# ProdPipes MCP and multicloud adapters

ProdPipes.com is the internet-facing control plane. The Test Agent is the execution plane. Its MCP listener binds to 127.0.0.1 by default and must not be exposed directly to the Internet.

## Agent MCP
POST /mcp, JSON-RPC 2.0, Bearer authentication.
Initial tools: agent_capabilities and cloud_identity.
Cloud execution is allowlisted. Arbitrary CLI commands are forbidden.

## Providers
AWS: CLI/API/SDK; prefer short-lived role/identity credentials.
Azure: CLI/API/SDK; prefer managed/workload identities.
Google Cloud: gcloud/API/SDK; prefer Workload Identity Federation where applicable.
Cloudflare: Wrangler/API; use narrowly scoped API tokens.

## ProdPipes.com API contract
When its repository is available implement /api/v1 for agents, jobs, cloud connections/actions, GitHub events, deployments and release gates, plus /mcp tools for projects, pipelines, runs, agents, cloud connections and deployment plans/status.

Mutations require RBAC, tenant/project scoping, audit and release policy. Secrets never appear in MCP output, job logs or GitHub.
