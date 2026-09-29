# Agent protocol v1

ProdPipes assigns a typed job with a unique id and a short lease. The Agent validates protocolVersion, runner, command and lease before execution.

## Lifecycle
queued -> leased -> running -> completed | failed | cancelled

The control plane is authoritative. It must issue unique job ids, lease a job to only one agent at a time, expire abandoned leases and make complete/fail idempotent. The Agent locally rejects duplicate running/terminal ids during its process lifetime.

## Retry
Retries are new attempts of the same logical job and must be bounded by the control plane. Transport polling uses exponential backoff. Jobs must never become arbitrary shell commands.

## Cancellation
v1 supports cancellation before execution with cancelRequested=true. Mid-process cancellation requires AbortSignal/process-tree termination and remains pending.

## Security
Agent tokens identify an enrolled machine, not a human. Enrollment secrets must be one-time/expiring. Long-lived credentials need rotation and revocation. OS passwords are never collected.
