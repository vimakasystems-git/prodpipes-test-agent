# ProdPipes Test Agent — Project Memory

Read this file before changing the project.

## Product objective
ProdPipes.com is the orchestration control plane. This repository is the self-hosted execution agent.

exploreSAMPA.com -> ProdPipes.com -> GitHub repository -> GitHub Actions -> ProdPipes.com -> ProdPipes Test Agent -> Windows/Linux/Android/macOS/iOS results -> ProdPipes.com -> release gate -> deployment -> exploreSAMPA.com

## Boundaries
- ProdPipes.com owns projects, agents, tokens, queues, release gates, deployment decisions and result history.
- GitHub owns source/versioning and GitHub Actions CI.
- Agent executes typed/allowlisted jobs only.
- Windows: Windows + WSL/Linux + Android. Linux: Linux + Android. macOS: macOS + Android + official Xcode iOS Simulator.
- Never fake iOS Simulator on Windows.
- Never accept arbitrary remote shell text.
- Never collect OS passwords; use UAC/sudo/polkit.
- Never commit API tokens/secrets.
- Fetch current main before editing.

## Implemented
- Node agent bootstrap and capability discovery.
- Protocol v1 and typed job validation with lease expiration.
- register / next / complete / fail client contract.
- heartbeat client and periodic online/capability reporting.
- smoke runners Windows/Linux/Android/macOS/iOS.
- EULA and Windows/Linux installer scaffolds.
- branding contract.
- cross-platform CI.
- CI run 36612373981 passed on 2026-09-29 after removing invalid setup-node cache dependency.

## Pending
- ProdPipes.com backend repo/API.
- job idempotency, cancellation, retry and concurrency controls.
- enrollment credential exchange/rotation/revocation.
- secure OS credential store.
- final Windows service + EXE/MSI.
- final DEB/RPM.
- signed updater/checksum/rollback.
- complete Android AVD/Appium lifecycle.
- macOS package/iOS real-host validation.
- artifacts/screenshots/log streaming.
- end-to-end ProdPipes test.
- exploreSAMPA orchestration/deployment integration.

## Release rule
Never call a scaffold a finished installer. Release requires green tests, audit, secret scan, package verification and platform smoke tests.

## Last reviewed
2026-09-29
