import {execFile} from "./exec.mjs";
import {writeFile} from "node:fs/promises";
import process from "node:process";
import {pathToFileURL} from "node:url";

function argValue(name, fallback="") {
  const i=process.argv.indexOf(name);
  return i>=0 ? (process.argv[i+1] ?? fallback) : fallback;
}
function hasFlag(name){ return process.argv.includes(name); }

async function git(cwd,args,options={}){
  return execFile("git",args,{cwd,timeoutMs:options.timeoutMs||120000,env:options.env});
}
async function gitText(cwd,args){
  const r=await git(cwd,args);
  return String(r.stdout||"").trim();
}
async function tryGitText(cwd,args){
  try{return await gitText(cwd,args)}catch{return""}
}
async function refExists(cwd,ref){
  try{await git(cwd,["rev-parse","--verify","--quiet",ref]);return true}catch{return false}
}
async function remoteExists(cwd,name){
  const remotes=(await gitText(cwd,["remote"])).split(/\r?\n/).filter(Boolean);
  return remotes.includes(name);
}
function parseCount(s){
  const [left="0",right="0"]=String(s).trim().split(/\s+/);
  return {localOnly:Number(left)||0,remoteOnly:Number(right)||0};
}
async function uniqueCommits(cwd,includeRef,excludeRef){
  if(!includeRef) return [];
  const args=["log","--format=%H%x09%s","-n","100",includeRef];
  if(excludeRef) args.push("--not",excludeRef);
  const text=await tryGitText(cwd,args);
  return text?text.split(/\r?\n/).filter(Boolean).map(line=>{
    const [sha,...msg]=line.split("\t");
    return {sha,message:msg.join("\t").slice(0,500)};
  }):[];
}
async function changedFiles(cwd,a,b){
  if(!a||!b) return [];
  const text=await tryGitText(cwd,["diff","--name-status",a,b]);
  return text?text.split(/\r?\n/).filter(Boolean).slice(0,500):[];
}
async function treeSha(cwd,ref){
  return tryGitText(cwd,["rev-parse",`${ref}^{tree}`]);
}
function reviewedSet(value){
  return new Set(String(value||"").split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean));
}
function allReviewed(commits,set){
  return commits.every(c=>set.has(c.sha));
}
async function compareRef(cwd,localRef,remoteRef){
  if(!(await refExists(cwd,remoteRef))) return {exists:false,remoteRef};
  const counts=parseCount(await gitText(cwd,["rev-list","--left-right","--count",`${localRef}...${remoteRef}`]));
  const remoteHead=await gitText(cwd,["rev-parse",remoteRef]);
  const localHead=await gitText(cwd,["rev-parse",localRef]);
  const [localTree,remoteTree,localCommits,remoteCommits]=await Promise.all([
    treeSha(cwd,localRef),
    treeSha(cwd,remoteRef),
    uniqueCommits(cwd,localRef,remoteRef),
    uniqueCommits(cwd,remoteRef,localRef)
  ]);
  return {
    exists:true,remoteRef,remoteHead,localHead,...counts,
    sameTree:Boolean(localTree&&remoteTree&&localTree===remoteTree),
    localTree,remoteTree,
    localCommits,remoteCommits,
    remoteChangedFiles:await changedFiles(cwd,localRef,remoteRef)
  };
}
export async function buildUpdatePlan({
  cwd=".",branch="main",primaryRemote="origin",mirrorRemote="gitlab",
  allowForce=false,reviewedShas=""
}={}){
  await git(cwd,["fetch","--all","--prune"]);
  const clean=(await gitText(cwd,["status","--porcelain"]))==="";
  const localHead=await gitText(cwd,["rev-parse","HEAD"]);
  const primaryRef=`${primaryRemote}/${branch}`;
  const mirrorRef=`${mirrorRemote}/${branch}`;
  const primaryAvailable=await remoteExists(cwd,primaryRemote);
  const mirrorAvailable=await remoteExists(cwd,mirrorRemote);
  const primary=primaryAvailable?await compareRef(cwd,"HEAD",primaryRef):{exists:false,remoteRef:primaryRef};
  const mirror=mirrorAvailable?await compareRef(cwd,"HEAD",mirrorRef):{exists:false,remoteRef:mirrorRef};
  const reviewed=reviewedSet(reviewedShas);

  let status="ready";
  let action="noop";
  let reason="repositories_aligned";

  if(!clean){
    status="blocked"; action="none"; reason="working_tree_not_clean";
  } else if(primary.exists && primary.remoteOnly>0 && primary.localOnly===0){
    status="superseded"; action="none"; reason="primary_remote_advanced";
  } else if(primary.exists && primary.remoteOnly>0){
    status="review_required"; action="none"; reason="primary_remote_diverged";
  } else if(!mirrorAvailable){
    status="ready"; action="skip_mirror"; reason="mirror_remote_not_configured";
  } else if(!mirror.exists){
    status="ready"; action="create_mirror_branch"; reason="mirror_branch_missing";
  } else if(mirror.remoteOnly===0 && mirror.localOnly>0){
    status="ready"; action="fast_forward_mirror"; reason="mirror_behind_primary";
  } else if(mirror.localOnly===0 && mirror.remoteOnly===0){
    status="ready"; action="noop"; reason="repositories_aligned";
  } else if(mirror.remoteOnly>0){
    const reviewedAll=allReviewed(mirror.remoteCommits,reviewed);
    if(allowForce && (mirror.sameTree || reviewedAll)){
      status="ready";
      action="force_with_lease_mirror";
      reason=mirror.sameTree?"history_diverged_same_tree":"remote_commits_explicitly_reviewed";
    } else {
      status="review_required";
      action="none";
      reason="mirror_contains_unique_commits";
    }
  }

  return {
    schemaVersion:"1.0",
    generatedAt:new Date().toISOString(),
    branch,primaryRemote,mirrorRemote,localHead,clean,
    status,action,reason,
    safety:{
      forceRequested:Boolean(allowForce),
      forceMode:"force-with-lease-only",
      reviewedShas:[...reviewed],
      destructiveForceForbidden:true
    },
    primary,mirror
  };
}
export async function applyUpdatePlan(cwd,plan){
  if(plan.status!=="ready") throw new Error(`Plan not ready: ${plan.status}/${plan.reason}`);
  const branch=plan.branch;
  if(plan.action==="noop"||plan.action==="skip_mirror") return {ok:true,action:plan.action};
  if(plan.action==="create_mirror_branch"||plan.action==="fast_forward_mirror"){
    await git(cwd,["push",plan.mirrorRemote,`HEAD:refs/heads/${branch}`]);
    return {ok:true,action:plan.action};
  }
  if(plan.action==="force_with_lease_mirror"){
    if(!plan.mirror?.remoteHead) throw new Error("Missing mirror remote head for lease");
    await git(cwd,["push",`--force-with-lease=refs/heads/${branch}:${plan.mirror.remoteHead}`,plan.mirrorRemote,`HEAD:refs/heads/${branch}`]);
    return {ok:true,action:plan.action,lease:plan.mirror.remoteHead};
  }
  throw new Error(`Unsupported plan action: ${plan.action}`);
}
async function reportProdPipes(kind,payload){
  const base=String(process.env.PRODPIPES_API_URL||"").replace(/\/$/,"");
  const token=String(process.env.PRODPIPES_TOKEN||"").trim();
  if(!base||!token) return {sent:false,reason:"not_configured"};
  const url=`${base}/api/v1/repository-updates/${kind}`;
  try{
    const r=await fetch(url,{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${token}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
    const text=await r.text();
    if(!r.ok) throw new Error(`HTTP ${r.status}: ${text.slice(0,1000)}`);
    return {sent:true,status:r.status};
  }catch(error){
    if(process.env.PRODPIPES_REQUIRED==="1") throw error;
    return {sent:false,reason:String(error?.message||error)};
  }
}
async function main(){
  const cwd=argValue("--repo",process.cwd());
  const branch=argValue("--branch",process.env.PRODPIPES_BRANCH||"main");
  const primaryRemote=argValue("--primary",process.env.PRODPIPES_PRIMARY_REMOTE||"origin");
  const mirrorRemote=argValue("--mirror",process.env.PRODPIPES_MIRROR_REMOTE||"gitlab");
  const allowForce=hasFlag("--allow-force")||process.env.PRODPIPES_ALLOW_FORCE==="1";
  const reviewedShas=argValue("--reviewed-shas",process.env.PRODPIPES_REVIEWED_SHAS||"");
  const out=argValue("--plan-out","prodpipes-update-plan.json");
  const plan=await buildUpdatePlan({cwd,branch,primaryRemote,mirrorRemote,allowForce,reviewedShas});
  await writeFile(out,JSON.stringify(plan,null,2)+"\n","utf8");
  const planReport=await reportProdPipes("plan",plan);
  let result={ok:true,action:"plan-only"};
  if(hasFlag("--apply")){
    if(plan.status!=="ready"){
      result={ok:false,action:"blocked",status:plan.status,reason:plan.reason};
    }else{
      result=await applyUpdatePlan(cwd,plan);
    }
    await reportProdPipes("result",{plan,result,completedAt:new Date().toISOString()});
  }
  console.log(JSON.stringify({plan,result,prodpipes:planReport},null,2));
  if(plan.status==="blocked"||plan.status==="review_required") process.exitCode=2;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{console.error(error?.stack||error);process.exit(1)});
}
