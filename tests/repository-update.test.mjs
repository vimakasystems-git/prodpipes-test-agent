import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,rm,mkdir} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {execFile} from "../src/exec.mjs";
import {buildUpdatePlan,applyUpdatePlan} from "../src/repository-update.mjs";

async function git(cwd,args){return execFile("git",args,{cwd,timeoutMs:30000})}
async function initRepo(path){
  await git(path,["init","-b","main"]);
  await git(path,["config","user.email","ci@example.invalid"]);
  await git(path,["config","user.name","CI"]);
  await git(path,["commit","--allow-empty","-m","initial"]);
}
test("plans safe mirror creation and fast-forward",async()=>{
  const root=await mkdtemp(join(tmpdir(),"prodpipes-sync-"));
  const work=join(root,"work"),mirror=join(root,"mirror.git");
  await mkdir(work,{recursive:true});
  await initRepo(work);
  await git(root,["init","--bare",mirror]);
  await git(work,["remote","add","gitlab",mirror]);
  let plan=await buildUpdatePlan({cwd:work,mirrorRemote:"gitlab"});
  assert.equal(plan.action,"create_mirror_branch");
  await applyUpdatePlan(work,plan);
  plan=await buildUpdatePlan({cwd:work,mirrorRemote:"gitlab"});
  assert.equal(plan.action,"noop");
  await rm(root,{recursive:true,force:true});
});
test("blocks force when mirror has unique unreviewed commit",async()=>{
  const root=await mkdtemp(join(tmpdir(),"prodpipes-diverge-"));
  const a=join(root,"a"),b=join(root,"b"),mirror=join(root,"mirror.git");
  await mkdir(a,{recursive:true});
  await initRepo(a);
  await git(root,["init","--bare",mirror]);
  await git(a,["remote","add","gitlab",mirror]);
  await git(a,["push","gitlab","main"]);
  await git(root,["clone",mirror,b]);
  await git(b,["config","user.email","ci@example.invalid"]);
  await git(b,["config","user.name","CI"]);
  await git(b,["commit","--allow-empty","-m","mirror-only"]);
  await git(b,["push","origin","main"]);
  const plan=await buildUpdatePlan({cwd:a,mirrorRemote:"gitlab",allowForce:true});
  assert.equal(plan.status,"review_required");
  assert.equal(plan.reason,"mirror_contains_unique_commits");
  await rm(root,{recursive:true,force:true});
});
