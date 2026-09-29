# Secret administration and cross-configuration

ProdPipes and every Vimaka integration gateway expose an authenticated admin surface for integration setup.

## Internal temporary secrets

The admin generator creates cryptographically random `vtmp_` credentials for API/MCP/test pairing.

Properties:
- plaintext returned once;
- only SHA-256 hash retained in memory;
- TTL from 60 seconds to 24 hours;
- configurable maximum use count;
- scoped to `api`, `mcp`, `test`, or `*`;
- revocable by the superadmin;
- automatically invalidated on expiry, use exhaustion, revocation, or process restart.

These temporary credentials are intended for integration tests and short-lived cross-system pairing, not as a replacement for provider credentials.

## Admin routes

- `GET /admin`
- `GET /api/admin/integrations`
- `GET /api/admin/secrets`
- `POST /api/admin/secrets/generate`
- `POST /api/admin/secrets/revoke`

The ProdPipes Test Agent uses `PRODPIPES_ADMIN_TOKEN` for admin operations and `PRODPIPES_MCP_TOKEN` for MCP. Product gateways use `VIMAKA_INTEGRATION_TOKEN` as the superadmin/master token.

## Provider credentials

GitHub, GitLab, AWS, Azure, GCP, Cloudflare and other external providers must issue their own credentials. The Vimaka secret generator must never fabricate a provider PAT/API key or commit one to source control.

Preferred provider auth:
- GitHub: GitHub App/OIDC; scoped token only where required.
- GitLab: project/group access token, OAuth, deploy token/key according to operation.
- AWS: OIDC/role or IAM Identity Center, short-lived sessions.
- Azure: managed/workload identity.
- GCP: Workload Identity Federation.
- Cloudflare: scoped API token.

Store provider secrets in the hosting/provider secret store and expose them to the runtime only through protected environment bindings.

## Cross configuration

System A generates a temporary pairing secret for System B. The response includes the source URL and recommended target environment variable names. System B stores the temporary value in its runtime secret store and uses it as `Authorization: Bearer <secret>`. The plaintext is never written to Git, logs, manifests, or telemetry.

For long-lived system-to-system integration, exchange the temporary token for a durable scoped service credential in the ProdPipes control plane once the backend repository is available.
