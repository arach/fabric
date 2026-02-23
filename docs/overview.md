---
title: Overview
description: Ambient compute fabric for running agentic workloads across local and cloud runtimes with a unified Sandbox interface.
order: 1
---

# Overview

Fabric is an ambient compute framework that lets you run agentic workloads across local and cloud runtimes through a unified interface. Work starts anywhere, runs wherever it can, and context persists always.

## What Fabric Does

Fabric provides a single `Sandbox` interface that works identically across four execution environments:

- **Local Container** — Apple Virtualization.framework on your Mac. No cloud, no API keys, free.
- **Daytona** — Enterprise cloud sandboxes with tiered network policies.
- **E2B** — Sub-200ms code interpreter sandboxes.
- **exe.dev** — Persistent VMs with SSH and pre-installed agents.

Every sandbox supports the same operations: `exec()`, `runCode()`, `writeFile()`, `readFile()`, `snapshot()`, `restore()`, and `delegate()`.

## Key Concepts

**Sandbox**: An isolated execution environment. Create one, run code in it, tear it down. The interface is identical regardless of where it runs.

**Snapshot**: Serializable capture of workspace state (files + metadata). Enables checkpointing and cross-runtime handoff.

**Handoff**: Move work between runtimes. Call `sandbox.delegate("e2b")` to capture state and stop locally, then `cloudSandbox.reclaim(token, snapshot)` to resume in the cloud.

**Runtime**: The execution backend. Each runtime adapter implements the same interface but talks to a different infrastructure provider.

## Architecture

```
packages/
├── core/              # Sandbox, Runtime, Task interfaces
├── runtime-local/     # Apple Containerization + subprocess
│   └── FabricContainer/  # Swift executable (Virtualization.framework)
├── runtime-e2b/       # E2B cloud sandbox adapter
├── runtime-daytona/   # Daytona cloud sandbox adapter
├── runtime-exe/       # exe.dev persistent VM adapter
└── server/            # HTTP API
```

The local container runtime is unique — it includes a Swift executable (`fabric-container`) that wraps Apple's Containerization framework and exposes an HTTP API over a Unix domain socket. The TypeScript adapter communicates with this daemon to manage containers.

## Quick Example

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"

const factory = new LocalContainerSandboxFactory()
const sandbox = await factory.create({ image: "alpine:latest" })

const result = await sandbox.exec("uname -a")
console.log(result.stdout) // Linux ... aarch64

// Handoff to cloud
const { token, snapshot } = await sandbox.delegate("e2b")
```

## Next Steps

- [Getting Started](./getting-started.md) — Install Fabric and create your first sandbox
- [Local Container Runtime](./local-container.md) — Apple Virtualization.framework deep dive
- [Daytona](./daytona.md) — Enterprise cloud sandboxes
- [E2B](./e2b.md) — Fast code interpreter sandboxes
- [exe.dev](./exe.md) — Persistent VMs with SSH
