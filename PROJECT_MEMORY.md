# ProdPipes Test Agent — Project Memory

Read this file before changing the project.

## Product objective
ProdPipes.com is the orchestration control plane. This repository is the self-hosted execution agent. The intended delivery chain is:

exploreSAMPA.com -> ProdPipes.com -> GitHub repository -> GitHub Actions -> ProdPipes.com -> ProdPipes Test Agent -> Windows/Linux/Android/macOS/iOS results -> ProdPipes.com -> release gate -> deployment -> exploreSAMPA.com

## Boundaries
- ProdPipes.com owns projects, agents, tokens, queues, release gates, deployment decisions and result history.
- GitHub owns source/versioning and GitHub Actions CI.
- Test Agent executes only typed/allowlisted jobs on registered machines.
- Windows hosts support Windows, WSL/Linux and Android.
- Linux hosts support Linux and Android.
- macOS hosts support macOS, Android and official Xcode iOS Simulator.
- Do not pretend iOS Simulator runs on Windows.
- Never accept arbitrary remote shell text as a job.
- Never collect OS passwords. Use UAC/sudo/polkit.
- Never commit API tokens or secrets.
- Fetch current main before editing because external systems may also publish.

## Implemented
- Node.js agent bootstrap.
- capability discovery.
- ProdPipes client contract: register, next job, complete, fail.
- typed smoke runners for Windows/Linux/Android/macOS/iOS.
- EULA/consent foundation.
- Windows Inno Setup scaffold.
- Linux systemd installer scaffold.
- branding asset contract for ProdPipes/Vimaka.
- cross-platform GitHub Actions workflow.

## Known gaps
- ProdPipes.com backend repository is not yet available here; server API contract is therefore provisional.
- Current Actions runs fail during setup-node before tests.
- No package-lock existed initially.
- Windows executable/service implementation is not complete.
- DEB/RPM generation is not complete.
- Auto-update, signature verification and rollback are specified but not implemented.
- Official branding binaries are not committed.
- Agent heartbeat/offline detection not implemented.
- Artifact upload/download contract not implemented.
- Job leases, cancellation, retries, idempotency and concurrency limits not implemented.
- Token rotation/revocation and secure OS credential storage not implemented.
- Android emulator lifecycle/Appium orchestration is incomplete.
- macOS/iOS requires a real Mac host.
- No end-to-end test against ProdPipes.com yet.

## Release gates
A release is not ready until unit tests, dependency audit, secret scan, packaging tests and supported platform smoke tests pass. Never describe a scaffold as a finished installer.

## Priority order
P0: green CI and deterministic dependency lock.
P0: secure protocol/job schema and heartbeat/lease/idempotency.
P0: ProdPipes server API once its repository exists.
P1: Windows service + signed installer.
P1: Linux DEB/RPM + systemd.
P1: updater with signed manifest/checksum/rollback.
P1: Android emulator/Appium lifecycle.
P2: macOS package and iOS Simulator runner.
P2: artifacts/screenshots/log streaming.
P2: admin UX and release-gate UX in ProdPipes.
P3: telemetry/metrics, fleet policies and enterprise proxy support.

## Last reviewed
2026-09-29
