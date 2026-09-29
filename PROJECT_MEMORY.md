# ProdPipes Test Agent — Project Memory
Read before changing the project.

## Flow
exploreSAMPA.com -> ProdPipes.com -> GitHub -> GitHub Actions -> ProdPipes.com -> Test Agent -> platform results -> ProdPipes.com -> release gate -> deployment -> exploreSAMPA.com

## Rules
ProdPipes is control plane; GitHub owns source/CI; Agent runs typed allowlisted jobs only. Never arbitrary remote shell. Never collect OS passwords. Never commit secrets. Fetch current main before editing. iOS Simulator requires macOS.

## Implemented
Node agent; capabilities; protocol v1; lease validation; heartbeat; typed smoke runners; in-process duplicate protection; pre-execution cancellation; retry backoff; one-time enrollment protocol client; per-agent credential persistence foundation; EULA; installer scaffolds; branding contract; cross-platform CI. CI runs 36612373981, 36615303921 and 36616411157 passed.

## Pending
ProdPipes backend/API; server-side enrollment token hashing/expiry/consumption; credential rotation/revocation; OS-native secure credential stores; durable idempotency; mid-process cancellation; server lease ownership; final Windows service/EXE/MSI; DEB/RPM; signed updater; Android AVD/Appium; macOS/iOS validation; artifacts/screenshots/log streaming; E2E ProdPipes; exploreSAMPA orchestration/deployment.

## Release rule
A scaffold is not a finished installer. Release requires green tests, audit, secret scan, package verification and platform smoke tests.

Last reviewed: 2026-09-29
