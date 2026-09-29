# GitHub + GitLab event routing through ProdPipes

ProdPipes.com is the control plane. GitHub and GitLab are source/CI providers; neither provider is allowed to silently overwrite the other.

## Event ingress

Planned ProdPipes endpoints:

- `POST /api/v1/scm/github/webhook`
- `POST /api/v1/scm/gitlab/webhook`
- `POST /api/v1/repository-updates/plan`
- `POST /api/v1/repository-updates/result`

Webhook receivers normalize events to `schemas/scm-event.schema.json`, deduplicate by delivery id, attach the project/repository mapping and decide whether to request a repository update plan.

### GitHub

Validate the raw request body with the configured webhook secret using HMAC-SHA256 and `X-Hub-Signature-256`. Keep the delivery id for idempotency and audit.

### GitLab

For new GitLab webhooks, prefer the signing-token HMAC-SHA256 mechanism when available. Support legacy secret-token verification only as a migration path. Persist the GitLab webhook/message id for idempotency.

## Update state machine

`event_received -> plan_requested -> plan_ready | review_required | blocked | superseded -> sync_applied -> ci_wait -> agent_tests -> release_gate -> deploy`

Rules:

- `superseded`: an older CI run observed that its primary branch advanced. It exits without rewriting anything.
- `review_required`: both histories contain unique work, or the mirror has unique feature content.
- `ready + fast_forward_mirror`: safe automatic sync.
- `ready + force_with_lease_mirror`: allowed only after the feature-verification rules in the plan are satisfied.
- `blocked`: dirty workspace, invalid policy or another hard safety condition.

## Provider credentials

ProdPipes stores provider connection metadata and credential references, not credentials in repository files. Prefer GitHub Apps/OIDC and GitLab project/group access tokens, deploy tokens, OIDC or SSH deploy keys with minimal scopes.

## CI roles

GitHub caller repositories use `.github/workflows/prodpipes-update.yml`, which calls the reusable workflow in `prodpipes-test-agent`.

GitLab mirrors use `.gitlab-ci.yml`, which includes `templates/gitlab/prodpipes-repository-update.yml`.

Both produce the same normalized update-plan artifact, so ProdPipes can apply one release policy across both providers.
