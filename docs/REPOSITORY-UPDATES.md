# ProdPipes repository update routine

This routine coordinates repository updates through ProdPipes with GitHub and GitLab while preserving features before any merge or force operation.

## Safety contract

1. Fetch all remotes and compare commit ancestry, trees, unique commits and changed files.
2. GitHub is the default primary remote (`origin`); GitLab is the default mirror (`gitlab`).
3. Fast-forward synchronization is automatic only when the target has no unique commits.
4. Divergence produces `review_required` and blocks synchronization.
5. Force is never plain `--force`. The only supported force mode is `--force-with-lease`.
6. A force-with-lease plan is allowed only when the trees are already identical or every target-only commit SHA is explicitly supplied as reviewed.
7. Plans and results can be reported to ProdPipes at:
   - `POST /api/v1/repository-updates/plan`
   - `POST /api/v1/repository-updates/result`
8. Tokens are provided through environment/secrets and are never written to the repository.

## Environment

`PRODPIPES_API_URL=https://prodpipes.com`
`PRODPIPES_TOKEN=<secret>`
`PRODPIPES_PRIMARY_REMOTE=origin`
`PRODPIPES_MIRROR_REMOTE=gitlab`
`PRODPIPES_ALLOW_FORCE=0`
`PRODPIPES_REVIEWED_SHAS=<comma-separated reviewed target-only commits>`

Run a plan:

`node src/repository-update.mjs --repo . --branch main --plan-out prodpipes-update-plan.json`

Apply only safe updates:

`node src/repository-update.mjs --repo . --branch main --apply`

After feature review, a guarded force candidate can be enabled with:

`node src/repository-update.mjs --repo . --branch main --apply --allow-force --reviewed-shas <sha1,sha2>`

A divergent target with unreviewed commits remains blocked.
