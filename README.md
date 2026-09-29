# ProdPipes Test Agent

Open-source self-hosted test agent for ProdPipes.

## Supported hosts
- Windows: Windows tests, Linux via WSL, Android via ADB/Appium.
- Linux: Linux tests and Android via ADB/Appium.
- macOS: macOS tests, Android, and iPhone/iPad Simulator via Xcode.

> iOS Simulator requires macOS/Xcode.

## Quick start
```bash
npm install
cp .env.example .env
npm start
```

## Environment
```
PRODPIPES_API_URL=https://prodpipes.com
PRODPIPES_AGENT_TOKEN=
PRODPIPES_AGENT_NAME=
PRODPIPES_POLL_INTERVAL_MS=5000
PRODPIPES_JOB_TIMEOUT_MS=900000
```

## ProdPipes API contract
- POST /api/test-agents/register
- GET /api/test-agents/jobs/next?agentId=...
- POST /api/test-agents/jobs/:id/complete
- POST /api/test-agents/jobs/:id/fail

## License
Apache-2.0
