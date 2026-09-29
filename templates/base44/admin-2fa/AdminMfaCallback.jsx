import React,{useEffect,useState}from"react";
import {useNavigate,useSearchParams}from"react-router-dom";
import {completeAdminMfa,readPending}from"./adminMfaState";

export default function AdminMfaCallback({verifyToken}){
  const [params]=useSearchParams();
  const navigate=useNavigate();
  const [status,setStatus]=useState("validating");
  const [message,setMessage]=useState("Validando sua autenticação de dois fatores…");

  useEffect(()=>{
    let active=true;
    (async()=>{
      const token=params.get("token")||params.get("code")||"";
      const nonce=params.get("nonce")||"";
      const pending=readPending();
      if(!token){if(active){setStatus("error");setMessage("Token de 2FA ausente.");}return}
      if(pending&&nonce&&pending.nonce!==nonce){if(active){setStatus("error");setMessage("Esta solicitação de 2FA não corresponde à sessão atual.");}return}
      try{
        const result=await verifyToken({token,nonce});
        if(!result?.ok)throw new Error(result?.error||"Token inválido ou expirado.");
        const target=completeAdminMfa({verifiedForMs:Number(result?.verifiedForMs)||30*60*1000});
        if(!active)return;
        setStatus("success");
        setMessage("2FA validado. Abrindo o painel administrativo…");
        window.history.replaceState({},"",window.location.pathname);
        navigate(target,{replace:true});
      }catch(error){
        if(!active)return;
        setStatus("error");
        setMessage(error?.message||"Falha ao validar o token.");
      }
    })();
    return()=>{active=false};
  },[params,navigate,verifyToken]);

  return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24}}>
    <div style={{maxWidth:520,width:"100%",border:"1px solid #ddd",borderRadius:16,padding:24}}>
      <h1>ProdPipes · Verificação 2FA</h1>
      <p>{message}</p>
      {status==="error"&&<a href="/login?returnTo=%2Fadmin">Voltar ao login</a>}
    </div>
  </div>;
}
