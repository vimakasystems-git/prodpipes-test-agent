const terminal=new Set(["completed","failed","cancelled"]);
export class JobState{
 constructor(){this.seen=new Map()}
 begin(job){const old=this.seen.get(job.id);if(old&&terminal.has(old.status))return {accepted:false,reason:"terminal",state:old};if(old?.status==="running")return {accepted:false,reason:"duplicate",state:old};const state={status:"running",attempt:(old?.attempt||0)+1,startedAt:new Date().toISOString()};this.seen.set(job.id,state);return {accepted:true,state}}
 finish(id,status){if(!terminal.has(status))throw new Error("Invalid terminal status");const old=this.seen.get(id)||{};const state={...old,status,finishedAt:new Date().toISOString()};this.seen.set(id,state);return state}
 get(id){return this.seen.get(id)}
}
export function retryDelayMs(attempt,{base=1000,max=30000}={}){return Math.min(max,base*2**Math.max(0,attempt-1))}
