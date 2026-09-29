# ProdPipes control-plane contract for repository updates

The repository synchronization client is implemented in `src/repository-update.mjs`. The ProdPipes.com backend is expected to persist plans/results and feed them into release gates.

## Endpoints

### POST /api/v1/repository-updates/plan

Bearer-authenticated. Receives a repository update plan matching `schemas/repository-update.schema.json`.

The backend should persist:
- repository/project identity;
- primary and mirror provider;
- branch and source SHA;
- unique commits on both sides;
- changed-file summary;
- feature-review state;
- proposed action;
- audit correlation id;
- requesting actor/agent.

A `review_required` plan must not be promoted automatically.

### POST /api/v1/repository-updates/result

Bearer-authenticated. Receives `{ plan, result, completedAt }`.

ProdPipes should attach the result to the relevant pipeline/release gate and require a fresh plan before retrying after remote state changes.

## Provider model

GitHub and GitLab are peers managed by one ProdPipes project. The current default is GitHub as primary in GitHub Actions and GitLab as primary in GitLab CI. Synchronization only fast-forwards a target without unique commits.

Force policy:
- plain `git push --force` is forbidden;
- only `--force-with-lease` is supported;
- force requires equivalent trees or explicit review of every target-only commit SHA;
- the exact target head used for the review becomes the lease value;
- any subsequent target change invalidates the operation.

## Required secret/variable names

GitHub caller repositories:
- variable `GITLAB_REPOSITORY_URL`;
- secret `GITLAB_USERNAME` when HTTPS authentication requires it;
- secret `GITLAB_TOKEN`;
- secret `PRODPIPES_TOKEN`.

GitLab projects:
- variable `GITHUB_REPOSITORY_URL`;
- protected/masked variable `GITHUB_USERNAME` when needed;
- protected/masked variable `GITHUB_TOKEN`;
- protected/masked variable `PRODPIPES_TOKEN`.

Use repository/project access tokens, deploy credentials, OIDC or SSH deploy keys with the narrowest practical scopes. Never place credentials in repository URLs committed to source.

## Release gate

ProdPipes should allow deployment only after:
1. source synchronization plan is ready/noop;
2. GitHub/GitLab CI required checks are green;
3. Test Agent platform checks are green;
4. artifacts correspond to the approved SHA;
5. security and secret scanning gates pass.
