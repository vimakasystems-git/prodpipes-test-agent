# Secure agent enrollment

Preferred bootstrap:
1. An administrator creates a short-lived, one-time enrollment token in ProdPipes.com.
2. Installer receives that token through a masked field or secure provisioning channel.
3. Agent calls POST /api/test-agents/enroll with host identity metadata and capabilities.
4. Control plane consumes the enrollment token and returns agentId + a unique agentToken.
5. Agent stores only the issued machine credential and the bootstrap token is discarded.
6. Control plane can rotate/revoke the machine credential independently.

The server must store only hashes of enrollment tokens and, where practical, hashes/derived representations of agent credentials. Tokens must be scoped to organization/project, expire, be revocable and never be returned in logs.

Current local credential file is a transition mechanism with restrictive file permissions. Production packaging should use Windows DPAPI/Credential Manager, macOS Keychain and an appropriate Linux secret store/systemd credential facility where available.
