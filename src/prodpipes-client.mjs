import {config} from "./config.mjs";
async function api(path,{token=config.token,...options}={}){const headers={"content-type":"application/json",...(options.headers||{})};if(token)headers.authorization=`Bearer ${token}`;const r=await fetch(`${config.apiUrl}${path}`,{...options,headers});if(!r.ok)throw new Error(`ProdPipes API ${r.status}: ${await r.text()}`);return r.status===204?null:r.json()}
export const prodpipes={
 enroll:p=>api("/api/test-agents/enroll",{method:"POST",token:config.enrollmentToken,body:JSON.stringify(p)}),
 register:(p,token)=>api("/api/test-agents/register",{method:"POST",token,body:JSON.stringify(p)}),
 heartbeat:(id,p,token)=>api(`/api/test-agents/${encodeURIComponent(id)}/heartbeat`,{method:"POST",token,body:JSON.stringify(p)}),
 nextJob:(id,token)=>api(`/api/test-agents/jobs/next?agentId=${encodeURIComponent(id)}`,{token}),
 complete:(id,p,token)=>api(`/api/test-agents/jobs/${encodeURIComponent(id)}/complete`,{method:"POST",token,body:JSON.stringify(p)}),
 fail:(id,p,token)=>api(`/api/test-agents/jobs/${encodeURIComponent(id)}/fail`,{method:"POST",token,body:JSON.stringify(p)})
};
