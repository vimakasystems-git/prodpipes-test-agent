import {run} from "./exec.mjs";
const P={aws:{cmd:"aws",ops:[["sts","get-caller-identity"]]},azure:{cmd:"az",ops:[["account","show","--output","json"]]},gcp:{cmd:"gcloud",ops:[["auth","list","--filter=status:ACTIVE","--format=json"]]},cloudflare:{cmd:"npx",ops:[["wrangler","whoami"]]}};
export const providerNames=()=>Object.keys(P);
export async function cloudRead(provider,operation=0,ctx={}){const p=P[provider];if(!p)throw new Error("Unsupported cloud provider");const args=p.ops[operation];if(!args)throw new Error("Unsupported cloud operation");return run(p.cmd,args,{timeoutMs:ctx.timeoutMs||60000})}
