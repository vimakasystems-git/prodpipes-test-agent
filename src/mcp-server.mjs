import http from "node:http";
import {providerNames,cloudRead} from "./cloud-providers.mjs";
import {SecretBroker,bearer,masterAuthorized} from "./secret-broker.mjs";

const tools=[
  {name:"agent_capabilities",description:"List supported cloud providers",inputSchema:{type:"object",additionalProperties:false}},
  {name:"cloud_identity",description:"Read authenticated cloud identity using an allowlisted local CLI operation",inputSchema:{type:"object",additionalProperties:false,required:["provider"],properties:{provider:{enum:["aws","azure","gcp","cloudflare"]}}}}
];

const reply=(res,status,body,extra={})=>{
  res.writeHead(status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...extra});
  res.end(JSON.stringify(body));
};
const html=(res,body)=>{
  res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff","content-security-policy":"default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'"});
  res.end(body);
};
async function readJson(req){let raw="";for await(const c of req){raw+=c;if(raw.length>65536)throw Object.assign(new Error("too_large"),{status:413})}if(!raw)return{};try{return JSON.parse(raw)}catch{throw Object.assign(new Error("invalid_json"),{status:400})}}
function catalog(){
  return[
    {id:"prodpipes",auth:"bearer",secretSlots:["PRODPIPES_ADMIN_TOKEN","PRODPIPES_MCP_TOKEN","PRODPIPES_TOKEN"]},
    {id:"github",auth:"github-app-or-token",secretSlots:["GITHUB_REPOSITORY_URL","GITHUB_TOKEN"]},
    {id:"gitlab",auth:"project-token-or-oauth",secretSlots:["GITLAB_REPOSITORY_URL","GITLAB_USERNAME","GITLAB_TOKEN"]},
    {id:"cerebrobrasil",auth:"api-key",secretSlots:["CEREBROBRASIL_API_URL","CEREBROBRASIL_API_KEY"]},
    {id:"aws",auth:"cli-or-oidc",secretSlots:["AWS_ROLE_ARN","AWS_REGION"]},
    {id:"azure",auth:"managed-workload-identity",secretSlots:["AZURE_TENANT_ID","AZURE_CLIENT_ID","AZURE_SUBSCRIPTION_ID"]},
    {id:"gcp",auth:"workload-identity",secretSlots:["GCP_PROJECT_ID","GCP_WORKLOAD_IDENTITY_PROVIDER"]},
    {id:"cloudflare",auth:"scoped-api-token",secretSlots:["CLOUDFLARE_API_TOKEN","CLOUDFLARE_ACCOUNT_ID"]}
  ];
}
function adminPage(){
  return`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ProdPipes Admin · Secrets</title><style>body{font-family:system-ui;margin:32px;max-width:1000px}input,button{font:inherit;padding:8px;margin:4px 0}input{width:100%;box-sizing:border-box}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{border:1px solid #ccc;border-radius:12px;padding:16px;margin:12px 0}pre{white-space:pre-wrap;word-break:break-word;background:#f5f5f5;padding:12px;border-radius:8px}</style></head><body><h1>ProdPipes · Admin de Secrets</h1><p>Gere credenciais temporárias para testes API/MCP. O plaintext é mostrado uma vez e nunca é persistido. GitHub/GitLab/clouds emitem suas próprias credenciais e elas devem ser armazenadas no secret store apropriado.</p><div class="card"><label>Admin token</label><input id="master" type="password"><button onclick="loadAll()">Carregar</button></div><div class="grid"><div class="card"><h2>Gerar temporária</h2><label>Integração</label><input id="integration" value="vimaka-peer"><label>Alvo</label><input id="target"><label>TTL</label><input id="ttl" type="number" value="900"><label>Usos</label><input id="uses" type="number" value="20"><label>Scopes</label><input id="scopes" value="api,mcp,test"><button onclick="generate()">Gerar</button><pre id="generated"></pre></div><div class="card"><h2>Catálogo</h2><pre id="catalog"></pre></div></div><div class="card"><h2>Ativas</h2><button onclick="loadSecrets()">Atualizar</button><pre id="secrets"></pre></div><script>const h=()=>({Authorization:'Bearer '+document.getElementById('master').value,'Content-Type':'application/json'});async function j(url,opt={}){const r=await fetch(url,{...opt,headers:{...h(),...(opt.headers||{})}});const t=await r.text();let d;try{d=JSON.parse(t)}catch{d={text:t}}if(!r.ok)throw new Error(JSON.stringify(d));return d}async function loadAll(){try{document.getElementById('catalog').textContent=JSON.stringify(await j('/api/admin/integrations'),null,2);await loadSecrets()}catch(e){alert(e.message)}}async function loadSecrets(){document.getElementById('secrets').textContent=JSON.stringify(await j('/api/admin/secrets'),null,2)}async function generate(){const scopes=document.getElementById('scopes').value.split(',').map(x=>x.trim()).filter(Boolean);const d=await j('/api/admin/secrets/generate',{method:'POST',body:JSON.stringify({integration:document.getElementById('integration').value,target:document.getElementById('target').value,ttlSeconds:Number(document.getElementById('ttl').value),maxUses:Number(document.getElementById('uses').value),scopes})});document.getElementById('generated').textContent=JSON.stringify(d,null,2);await loadSecrets()}</script></body></html>`;
}

export function createMcpServer({port=8787,host="127.0.0.1",token=process.env.PRODPIPES_MCP_TOKEN||"",adminToken=process.env.PRODPIPES_ADMIN_TOKEN||token,broker=new SecretBroker()}={}){
  if(!token)throw new Error("PRODPIPES_MCP_TOKEN is required");
  if(!adminToken)throw new Error("PRODPIPES_ADMIN_TOKEN is required");
  const server=http.createServer(async(req,res)=>{
    try{
      const url=new URL(req.url||"/",`http://${req.headers.host||"localhost"}`);
      if(req.method==="GET"&&url.pathname==="/api/health")return reply(res,200,{ok:true,service:"prodpipes-test-agent",mcp:"/mcp",admin:"/admin"});
      if(req.method==="GET"&&url.pathname==="/admin")return html(res,adminPage());
      if(url.pathname.startsWith("/api/admin/")){
        if(!masterAuthorized(req,adminToken))return reply(res,401,{error:"admin_unauthorized"});
        if(req.method==="GET"&&url.pathname==="/api/admin/integrations")return reply(res,200,{integrations:catalog(),temporarySecretPolicy:{maxTtlSeconds:broker.maxTtlSeconds,plaintextPersisted:false}});
        if(req.method==="GET"&&url.pathname==="/api/admin/secrets")return reply(res,200,{items:broker.list()});
        if(req.method==="POST"&&url.pathname==="/api/admin/secrets/generate"){
          const input=await readJson(req);
          const proto=String(req.headers["x-forwarded-proto"]||"http").split(",")[0].trim(),h=String(req.headers["x-forwarded-host"]||req.headers.host||`${host}:${port}`).split(",")[0].trim();
          const issued=broker.issue({...input,publicBaseUrl:input.publicBaseUrl||`${proto}://${h}`});
          return reply(res,201,issued);
        }
        if(req.method==="POST"&&url.pathname==="/api/admin/secrets/revoke"){
          const input=await readJson(req);return broker.revoke(String(input.id||""))?reply(res,200,{ok:true}):reply(res,404,{error:"secret_not_found"});
        }
        return reply(res,404,{error:"admin_route_not_found"});
      }
      if(req.method==="GET"&&url.pathname==="/test"){
        const raw=bearer(req);
        if(!masterAuthorized(req,adminToken)&&!broker.authorize(raw,"test"))return reply(res,401,{error:"unauthorized"});
        return reply(res,200,{ok:true,providers:providerNames(),temporarySecrets:broker.list().length,plaintextPersisted:false});
      }
      if(url.pathname!=="/mcp"||req.method!=="POST")return reply(res,404,{error:"not_found"});
      const raw=bearer(req);
      if(!masterAuthorized(req,token)&&!broker.authorize(raw,"mcp"))return reply(res,401,{error:"unauthorized"});
      const q=await readJson(req);
      if(q.method==="notifications/initialized"){res.writeHead(204);return res.end()}
      if(q.method==="initialize")return reply(res,200,{jsonrpc:"2.0",id:q.id,result:{protocolVersion:"2025-06-18",capabilities:{tools:{}},serverInfo:{name:"prodpipes-test-agent",version:"0.3.0"}}});
      if(q.method==="tools/list")return reply(res,200,{jsonrpc:"2.0",id:q.id,result:{tools}});
      if(q.method==="tools/call"){
        const a=q.params?.arguments||{};
        if(q.params?.name==="agent_capabilities")return reply(res,200,{jsonrpc:"2.0",id:q.id,result:{content:[{type:"text",text:JSON.stringify({providers:providerNames()})}]}});
        if(q.params?.name==="cloud_identity"){const r=await cloudRead(a.provider);return reply(res,200,{jsonrpc:"2.0",id:q.id,result:{content:[{type:"text",text:String(r.stdout||"").slice(0,50000)}]}})}
      }
      return reply(res,200,{jsonrpc:"2.0",id:q.id,error:{code:-32601,message:"Method not found"}});
    }catch(e){return reply(res,Number(e?.status||400),{error:String(e?.message||e)})}
  });
  return{start:()=>new Promise((ok,no)=>server.listen(port,host,()=>ok(server)).once("error",no)),stop:()=>new Promise(ok=>server.close(ok))}
}
