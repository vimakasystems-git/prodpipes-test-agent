const PREFIX = "prodpipes.admin.mfa";
const PENDING_KEY = `${PREFIX}.pending`;
const RETURN_KEY = `${PREFIX}.returnTo`;
const VERIFIED_KEY = `${PREFIX}.verifiedUntil`;

export function beginAdminMfa({returnTo="/admin",pendingTtlMs=10*60*1000}={}) {
  const now=Date.now();
  const existing=readPending();
  if (existing && existing.expiresAt > now) return existing;
  const nonce=crypto.randomUUID();
  const pending={nonce,createdAt:now,expiresAt:now+pendingTtlMs};
  sessionStorage.setItem(PENDING_KEY,JSON.stringify(pending));
  sessionStorage.setItem(RETURN_KEY,safeReturnTo(returnTo));
  return pending;
}

export function readPending(){
  try{
    const value=JSON.parse(sessionStorage.getItem(PENDING_KEY)||"null");
    if(!value||!value.nonce||Number(value.expiresAt)<=Date.now()){
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return value;
  }catch{
    sessionStorage.removeItem(PENDING_KEY);
    return null;
  }
}

export function completeAdminMfa({verifiedForMs=30*60*1000}={}){
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.setItem(VERIFIED_KEY,String(Date.now()+verifiedForMs));
  const target=safeReturnTo(sessionStorage.getItem(RETURN_KEY)||"/admin");
  sessionStorage.removeItem(RETURN_KEY);
  return target;
}

export function adminMfaVerified(){
  const until=Number(sessionStorage.getItem(VERIFIED_KEY)||0);
  if(until>Date.now())return true;
  sessionStorage.removeItem(VERIFIED_KEY);
  return false;
}

export function clearAdminMfa(){
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  sessionStorage.removeItem(VERIFIED_KEY);
}

export function safeReturnTo(value){
  const v=String(value||"/admin").trim();
  if(!v.startsWith("/")||v.startsWith("//"))return"/admin";
  if(v.startsWith("/login")||v.startsWith("/admin/2fa"))return"/admin";
  return v;
}
