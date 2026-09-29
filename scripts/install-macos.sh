#!/usr/bin/env bash
set -euo pipefail
command -v node >/dev/null || { echo "Node.js 20+ required"; exit 1; }
npm install
[ -f .env ] || cp .env.example .env
npm run check
echo "For iOS install Xcode. Set PRODPIPES_AGENT_TOKEN in .env, then run npm start"
