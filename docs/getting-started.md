---
title: Getting Started
description: Get Fabric running in under a minute.
order: 2
---

# Getting Started

## Quick Start

```bash
git clone https://github.com/arach/fabric.git && cd fabric
bun run packages/cli/src/cli.ts setup
```

This installs the Apple `container` CLI, downloads the Linux kernel, and pulls base images.

## Use It

### CLI

```bash
fabric shell                      # interactive Linux shell
fabric exec "echo Hello World"    # run a command
fabric run --language typescript "console.log(2 + 2)"
fabric list                       # list active sandboxes
fabric stop --id <sandbox-id>
```

### Project Config

Add a `.fabric` file to your project:

```bash
fabric init node     # create config with node profile
```

```ini
# .fabric
profile: node
mount: ./data:/workspace/data
env: NODE_ENV=development
```

Available profiles: `minimal` (alpine), `node` (node:22), `python` (python:3.12), `bun` (oven/bun).

### SDK

```bash
npm install fabric-ai-core fabric-ai-daytona
```

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
})

const sandbox = await factory.create({})
const result = await sandbox.exec("echo hello")
console.log(result.stdout)
await sandbox.stop()
```

Swap `fabric-ai-daytona` for `fabric-ai-e2b` or `fabric-ai-exe` — the `Sandbox` interface is identical.

## Cloud Providers

Set your API key and use the same interface:

```bash
export DAYTONA_API_KEY=your_key
fabric create --provider daytona
fabric exec "echo Hello from the cloud!"
```

| Provider | Startup | Auth | Best for |
|----------|---------|------|----------|
| Local | ~1s | None | Development, offline |
| Daytona | ~2-3s | API Key | Enterprise, TypeScript |
| E2B | <200ms | API Key | Data science, Python |
| exe.dev | ~2s | SSH Key | Persistent VMs |

## Available Images

| Name | Image | Description |
|------|-------|-------------|
| ubuntu | ubuntu:latest | Ubuntu Linux (default) |
| alpine | alpine:latest | Alpine Linux (minimal) |
| omarchy / arch | lopsided/archlinux | Arch Linux (arm64) |
| bun | oven/bun:latest | Bun runtime |
| node | node:22 | Node.js 22 |
| python | python:3.12 | Python 3.12 |

Any OCI-compatible arm64 image works: `fabric shell --image nginx:latest`

## Next steps

- [Local containers](./local-container.md) — How the container runtime works
- [Daytona guide](./daytona.md) — Network policies, multi-language support
- [E2B guide](./e2b.md) — Pre-built Claude Code template, Jupyter
- [exe.dev guide](./exe.md) — Persistent VMs, pre-installed agents
