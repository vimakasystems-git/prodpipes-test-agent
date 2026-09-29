# Roadmap

## P0 — correctness and security
1. Make CI deterministic and green.
2. Version the Agent/Protocol separately.
3. Define JSON schemas for registration, capabilities, jobs and results.
4. Add heartbeat, job lease, idempotency key, cancellation and retry policy.
5. Replace bearer registration token after enrollment with per-agent credentials.
6. Add command/job allowlists and path validation.
7. Add dependency audit, secret scanning and tests for hostile job payloads.
8. Implement ProdPipes.com control-plane API when its private repository becomes available.

## P1 — distributable agents
9. Implement Windows service lifecycle and produce EXE/MSI.
10. Produce DEB/RPM and hardened systemd service.
11. Store credentials in Windows Credential Manager / Linux secret store where available.
12. Add signed update manifest, SHA-256 verification, stable/beta channels and rollback.
13. Implement Android AVD lifecycle, boot health, Appium/UiAutomator2 and diagnostics.
14. Publish signed release artifacts through GitHub Releases/ProdPipes downloads.

## P2 — orchestration
15. Connect exploreSAMPA project to ProdPipes.
16. Receive GitHub Actions status in ProdPipes.
17. Route native jobs by capabilities.
18. Collect logs/screenshots/artifacts.
19. Evaluate release gate and deploy exploreSAMPA only after required gates.
20. Add macOS package and Xcode iOS Simulator runner.

## P3 — operations
21. Agent fleet dashboard, online/offline/draining/updating.
22. Metrics, structured logs, retention and audit trail.
23. Proxy support, bandwidth controls and artifact cache.
24. Organization/project isolation, quotas and policy templates.
