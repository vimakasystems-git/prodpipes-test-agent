import {createHash,randomBytes,randomUUID,timingSafeEqual} from "node:crypto";

function sha256(value){return createHash("sha256").update(String(value)).digest("hex")}
function safeEqual(a,b){const aa=Buffer.from(String(a||"")),bb=Buffer.from(String(b||""));return aa.length===bb.length&&timingSafeEqual(aa,bb)}

export class SecretBroker{
  constructor({maxTtlSeconds=86400}={}){this.maxTtlSeconds=maxTtlSeconds;this.records=new Map()}
  cleanup(){const now=Date.now();for(const[hash,rec]of this.records){if(rec.revoked||rec.expiresAtMs<=now||rec.usesRemaining<=0)this.records.delete(hash)}}
  issue({integration="vimaka-peer",target="",scopes=["api","mcp","test"],ttlSeconds=900,maxUses=20,publicBaseUrl=""}={}){
    this.cleanup();
    const ttl=Math.max(60,Math.min(this.maxTtlSeconds,Number(ttlSeconds)||900));
    const uses=Math.max(1,Math.min(1000,Number(maxUses)||20));
    const allowed=[...new Set(scopes.map(v=>String(v).trim()).filter(v=>["api","mcp","test","*"].includes(v)))];
    if(!allowed.length)throw new Error("invalid_scopes");
    const raw=`vtmp_${randomBytes(32).toString("base64url")}`,id=randomUUID(),now=Date.now();
    const rec={id,integration:String(integration).slice(0,120),target:String(target).slice(0,120),scopes:allowed,maxUses:uses,usesRemaining:uses,createdAt:new Date(now).toISOString(),expiresAt:new Date(now+ttl*1000).toISOString(),expiresAtMs:now+ttl*1000,lastUsedAt:null,revoked:false};
    this.records.set(sha256(raw),rec);
    return{...this.publicRecord(rec),secret:raw,shownOnce:true,configureTarget:{baseUrl:String(publicBaseUrl||"").replace(/\/$/,""),authorization:"Bearer <secret>"}};
  }
  authorize(raw,scope=""){this.cleanup();const rec=this.records.get(sha256(raw));if(!rec||rec.revoked||rec.expiresAtMs<=Date.now()||rec.usesRemaining<=0)return null;if(scope&&!rec.scopes.includes(scope)&&!rec.scopes.includes("*"))return null;rec.usesRemaining-=1;rec.lastUsedAt=new Date().toISOString();return this.publicRecord(rec)}
  revoke(id){for(const rec of this.records.values()){if(rec.id===id){rec.revoked=true;return true}}return false}
  list(){this.cleanup();return[...this.records.values()].map(rec=>this.publicRecord(rec))}
  publicRecord(rec){const{expiresAtMs,...safe}=rec;return safe}
}

export function bearer(request){const value=String(request.headers?.authorization||"");return value.startsWith("Bearer ")?value.slice(7).trim():""}
export function masterAuthorized(request,token){return Boolean(token)&&safeEqual(bearer(request),token)}
