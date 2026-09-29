import os from "node:os";
import "dotenv/config";
export const config={apiUrl:(process.env.PRODPIPES_API_URL||"https://prodpipes.com").replace(/\/$/,""),token:process.env.PRODPIPES_AGENT_TOKEN||"",agentName:process.env.PRODPIPES_AGENT_NAME||os.hostname(),pollIntervalMs:Number(process.env.PRODPIPES_POLL_INTERVAL_MS||5000),jobTimeoutMs:Number(process.env.PRODPIPES_JOB_TIMEOUT_MS||900000)};
export function assertConfig(){if(!config.token)throw new Error("PRODPIPES_AGENT_TOKEN is required");}
