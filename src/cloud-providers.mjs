import {execFile} from "./exec.mjs";

const PROVIDERS={
  aws:{cmd:"aws",ops:[["sts","get-caller-identity"]]},
  azure:{cmd:"az",ops:[["account","show","--output","json"]]},
  gcp:{cmd:"gcloud",ops:[["auth","list","--filter=status:ACTIVE","--format=json"]]},
  cloudflare:{cmd:"wrangler",ops:[["whoami"]]}
};

export const providerNames=()=>Object.keys(PROVIDERS);

export async function cloudRead(provider,operation=0,ctx={}){
  const p=PROVIDERS[provider];
  if(!p) throw new Error("Unsupported cloud provider");
  const args=p.ops[operation];
  if(!args) throw new Error("Unsupported cloud operation");
  return execFile(p.cmd,args,{timeoutMs:ctx.timeoutMs||60000});
}
