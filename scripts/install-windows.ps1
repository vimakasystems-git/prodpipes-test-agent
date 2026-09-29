$ErrorActionPreference="Stop"
if(-not(Get-Command node -ErrorAction SilentlyContinue)){throw "Node.js 20+ is required"}
npm install
if(-not(Test-Path ".env")){Copy-Item ".env.example" ".env"}
npm run check
Write-Host "Set PRODPIPES_AGENT_TOKEN in .env, then run npm start"
