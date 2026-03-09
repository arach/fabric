---
title: Overview
description: Lightweight sandboxes for agentic workloads. One interface, any runtime.
order: 1
---

# Overview

Fabric is a lightweight sandbox toolkit that lets you run agentic workloads across local containers and cloud runtimes through a unified interface. Start local, scale anywhere.

## What Fabric Does

Fabric provides a single `Sandbox` interface that works identically across four execution environments:

- **Local** — Apple `container` CLI on your Mac. No Docker, no API keys, free.
- **Daytona** — Enterprise cloud sandboxes with network policies.
- **E2B** — Sub-200ms code interpreter sandboxes.
- **exe.dev** — Persistent VMs with SSH and pre-installed agents.

Every sandbox supports the same operations: `exec()`, `runCode()`, `writeFile()`, `readFile()`, `snapshot()`, `restore()`, and `delegate()`.

## Key Concepts

**Sandbox**: An isolated execution environment. Create one, run code in it, tear it down. The interface is identical regardless of where it runs.

**`.fabric` Config**: Per-project configuration file. Defines image, mounts, env vars, and composable profiles (minimal, node, python, bun).

**Snapshot**: Serializable capture of workspace state (files + metadata). Enables checkpointing and cross-runtime handoff.

**Handoff**: Move work between runtimes without losing state. Snapshot locally, restore in the cloud.

**Runtime**: The execution backend. Each runtime adapter implements the same interface but talks to a different infrastructure provider.

## Architecture

```
packages/
├── cli/               # CLI — fabric setup, shell, exec, init
├── core/              # Sandbox, Runtime, Task interfaces
├── runtime-local/     # Apple container CLI + subprocess
├── runtime-daytona/   # Daytona cloud sandbox adapter
├── runtime-e2b/       # E2B cloud sandbox adapter
├── runtime-exe/       # exe.dev persistent VM adapter
├── server/            # HTTP API
└── landing/           # Website and docs
```

The local container runtime uses Apple's `container` CLI (Virtualization.framework) to run lightweight Linux VMs. No Docker daemon, no Swift binary — just a Homebrew package.

## Quick Example

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"

const factory = new LocalContainerSandboxFactory()
const sandbox = await factory.create({ image: "alpine:latest" })

const result = await sandbox.exec("uname -a")
console.log(result.stdout) // Linux ... aarch64

const snapshot = await sandbox.snapshot()
await sandbox.stop()

// Restore in cloud
const cloudSandbox = await e2bFactory.create({})
await cloudSandbox.restore(snapshot)
```

## Next Steps

- [Getting Started](./getting-started.md) — Install Fabric and create your first sandbox
- [Local Container Runtime](./local-container.md) — Apple container CLI deep dive
- [Daytona](./daytona.md) — Enterprise cloud sandboxes
- [E2B](./e2b.md) — Fast code interpreter sandboxes
- [exe.dev](./exe.md) — Persistent VMs with SSH
