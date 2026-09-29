export function startHeartbeat({agentId,capabilities,intervalMs=30000,send,onError=console.error}){
 let stopped=false,running=false,timer;
 const beat=async()=>{if(stopped||running)return;running=true;try{await send(agentId,{protocolVersion:"1",timestamp:new Date().toISOString(),capabilities,status:"online"})}catch(e){onError(e)}finally{running=false}};
 timer=setInterval(beat,intervalMs);timer.unref?.();void beat();
 return()=>{stopped=true;clearInterval(timer)};
}
