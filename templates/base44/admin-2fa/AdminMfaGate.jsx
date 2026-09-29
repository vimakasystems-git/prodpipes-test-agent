import React,{useEffect,useRef,useState}from"react";
import {Navigate,useLocation}from"react-router-dom";
import {adminMfaVerified,beginAdminMfa}from"./adminMfaState";

export default function AdminMfaGate({user,requestEmailToken,children}){
  const location=useLocation();
  const [state,setState]=useState(adminMfaVerified()?"verified":"checking");
  const requested=useRef(false);

  useEffect(()=>{
    if(adminMfaVerified()){setState("verified");return}
    if(!user){setState("login");return}
    if(requested.current)return;
    requested.current=true;
    const pending=beginAdminMfa({returnTo:location.pathname+location.search});
    setState("sending");
    Promise.resolve(requestEmailToken({
      email:user.email,
      nonce:pending.nonce,
      callbackPath:"/admin/2fa/callback",
      returnTo:"/admin"
    })).then(()=>setState("waiting")).catch(()=>{requested.current=false;setState("error")});
  },[user,location.pathname,location.search,requestEmailToken]);

  if(state==="login")return <Navigate to={"/login?returnTo="+encodeURIComponent("/admin")} replace/>;
  if(state==="verified")return children;
  if(state==="error")return <div>Não foi possível enviar o código de 2FA. Tente novamente.</div>;
  return <div>Enviamos o link de 2FA para seu email. Esta tela não deve redirecionar para o login enquanto a validação estiver pendente.</div>;
}
