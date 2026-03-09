---
title: Local Container Runtime
description: Run isolated Linux containers on macOS using Apple's container CLI — no Docker, no API keys.
order: 3
---

# Local Container Runtime

The local container runtime runs isolated Linux containers on your Mac using Apple's `container` CLI and Virtualization.framework. No Docker required — just native Apple Silicon performance.

## Requirements

- macOS 26+ (Tahoe)
- Apple Silicon (M1 or later)
- Apple `container` CLI (installed by `fabric setup`)

## Setup

```bash
fabric setup
```

This installs everything: the Apple `container` CLI (via Homebrew), the Linux kernel, and base images.

## Usage

### Interactive Shell

```bash
fabric shell                      # Ubuntu (default)
fabric shell --image alpine       # Alpine
fabric shell --image omarchy      # Arch Linux
fabric shell --image python       # Python 3.12
fabric shell --image nginx:latest # Any OCI image
```

### Programmatic (SDK)

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"

const factory = new LocalContainerSandboxFactory()
const sandbox = await factory.create({ image: "ubuntu:latest" })

const result = await sandbox.exec("uname -a")
console.log(result.stdout) // Linux ... aarch64

await sandbox.writeFile("hello.ts", "console.log('hi')")
await sandbox.exec("bun hello.ts")

await sandbox.stop()
```

## Architecture

```
┌──────────────────────────────────────┐
│           Your Mac (Host)            │
├──────────────────────────────────────┤
│  Apple container CLI                 │
│  └─ Virtualization.framework         │
│     └─ Lightweight Linux VM          │
│        └─ Your Container (OCI image) │
│           Mounted: ~/project ↔ /workspace
└──────────────────────────────────────┘
```

The `container` CLI manages everything through a privileged system daemon — networking, image pulls, VM lifecycle. No entitlements or code signing needed.

### TypeScript Classes

| Class | Description |
|-------|-------------|
| `SubprocessRuntime` | Direct host execution, no isolation |
| `ContainerRuntime` | Shells out to `container` CLI for one-shot commands |
| `LocalContainerSandbox` | Long-running container with `exec`, `writeFile`, `snapshot` |
| `LocalContainerSandboxFactory` | Creates and manages sandboxes |

## Container Images

| Name | Image | Description |
|------|-------|-------------|
| ubuntu | ubuntu:latest | Ubuntu 24.04 LTS |
| omarchy / arch | lopsided/archlinux | Arch Linux (arm64) |
| alpine | alpine:latest | Alpine Linux (minimal) |
| debian | debian:latest | Debian |
| fedora | fedora:latest | Fedora |
| bun | oven/bun:latest | Bun runtime |
| node | node:22 | Node.js 22 |
| python | python:3.12 | Python 3.12 |

Any OCI-compatible arm64 image works: `fabric shell --image myregistry/myimage:tag`

## File Operations

Files are shared via mounted volumes. The workspace directory on the host is mounted to `/workspace` inside the container.

```typescript
await sandbox.writeFile("hello.ts", `
export function greet(name: string) {
  return \`Hello, \${name}!\`
}
`)

const content = await sandbox.readFile("hello.ts")
const files = await sandbox.listFiles(".")
```

## Snapshots and Handoff

Capture and restore workspace state for handoff between runtimes:

```typescript
// Capture snapshot
const snapshot = await sandbox.snapshot()
await sandbox.stop()

// Restore to cloud sandbox
const cloudSandbox = await e2bFactory.create({})
await cloudSandbox.restore(snapshot)
```

## Known Issues

- **Arch Linux**: The official `archlinux:latest` image has broken platform metadata for the Apple container CLI. Fabric uses `lopsided/archlinux` instead.
- **pacman sandboxing**: Newer pacman versions use Landlock (kernel sandboxing) which the VM kernel doesn't support. Fix: `echo "DisableSandbox" >> /etc/pacman.conf`

## Comparison with Cloud Providers

| Feature | Local Container | Daytona | E2B | exe.dev |
|---------|----------------|---------|-----|---------|
| Startup | ~1s | ~2-3s | <200ms | ~5-10s |
| API Key | None | Required | Required | SSH key |
| Internet | Host network | Tier-based | Full | Full |
| Cost | Free | Pay per use | Pay per use | Pay per use |
| Platform | macOS + Apple Silicon | Any | Any | Any |
| Isolation | VM (Virtualization.framework) | Container | Container | VM |
