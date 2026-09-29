# ProdPipes Test Agent — Project Memory
Read before changing the project.

## Flow
exploreSAMPA.com -> ProdPipes.com -> GitHub -> GitHub Actions -> ProdPipes.com -> Test Agent -> platform results -> ProdPipes.com -> release gate -> deployment -> exploreSAMPA.com

## Rules
ProdPipes is control plane; GitHub owns source/CI; Agent runs typed allowlisted jobs only. Never arbitrary remote shell. Never collect OS passwords. Never commit secrets. Fetch current main before editing. iOS Simulator requires macOS.

## Implemented
Node agent, capability discovery, protocol v1, lease validation, heartbeat, typed smoke runners, EULA, installer scaffolds, branding contract, cross-platform CI, in-process duplicate/terminal job protection, pre-execution cancellation and retry backoff. CI runs 36612373981 and 36615303921 passed.

## Pending
ProdPipes backend/API; durable idempotency across restarts; mid-process cancellation; server-side lease ownership; bounded job retry policy; enrollment credential exchange/rotation/revocation; secure OS credential storage; final Windows service/EXE/MSI; DEB/RPM; signed updater/rollback; Android AVD/Appium lifecycle; macOS/iOS validation; artifacts/screenshots/log streaming; end-to-end ProdPipes test; exploreSAMPA orchestration/deployment.

## Release rule
A scaffold is not a finished installer. Release requires green tests, audit, secret scan, packaging verification and platform smoke tests.

Last reviewed: 2026-09-29
