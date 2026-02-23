---
title: Local Container Runtime
description: Run isolated Linux containers on macOS using Apple's Containerization framework (Virtualization.framework) — no cloud, no API keys.
order: 3
---

# Local Container Runtime

The local container runtime runs isolated Linux containers on your Mac using Apple's [Containerization framework](https://github.com/apple/containerization) (Virtualization.framework). No cloud dependency, no API keys — just native Apple Silicon performance.

## Requirements

- macOS 26+ (Tahoe)
- Apple Silicon (M1 or later)
- Swift 6.2+
- Xcode Command Line Tools

## Installation

No package to install — the local container runtime is built from source as a Swift executable.

```bash
# Build the container runtime
cd packages/runtime-local/FabricContainer
swift build -c release

# Verify the kernel binary exists
ls packages/runtime-local/bin/vmlinux
```

The `vmlinux` kernel binary must be present. It's a Linux arm64 kernel used to boot lightweight VMs.

## Architecture

The local container runtime has two layers:

```
TypeScript (Bun)                      Swift
┌──────────────────────┐    Unix     ┌──────────────────────────┐
│ ContainerDaemonRT    │   socket   │ fabric-container serve    │
│ LocalContainerSandbox│ ─────────▶ │ Apple Containerization    │
│ LocalContainerFactory│            │ Virtualization.framework  │
└──────────────────────┘            └──────────────────────────┘
```

**Swift layer** (`FabricContainer/`): Native executable wrapping Apple's Containerization framework. Provides both a CLI and an HTTP API over a Unix domain socket.

**TypeScript layer** (`src/index.ts`): Three runtime classes that talk to the Swift layer:

| Class | Communication | Use Case |
|-------|--------------|----------|
| `SubprocessRuntime` | Direct host exec | No isolation, fastest |
| `ContainerRuntime` | Invokes binary directly | One-shot commands |
| `ContainerDaemonRuntime` | Unix socket HTTP | Long-running containers, snapshots |

## Basic Usage

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"

const factory = new LocalContainerSandboxFactory()

// Create a sandbox
const sandbox = await factory.create({
  image: "alpine:latest"
})
console.log(`Sandbox ID: ${sandbox.id}`)

// Execute shell commands
const result = await sandbox.exec("ls -la /")
console.log(result.stdout)

// Run code
const codeResult = await sandbox.runCode(`
  console.log("Hello from local container!")
  console.log("Running on Apple Silicon")
`)
console.log(codeResult.output)

// Clean up
await sandbox.stop()
```

## Container Images

Image references are auto-normalized to fully-qualified OCI references:

| Input | Resolved To |
|-------|------------|
| `alpine` | `docker.io/library/alpine:latest` |
| `alpine:3.19` | `docker.io/library/alpine:3.19` |
| `oven/bun:latest` | `docker.io/oven/bun:latest` |
| `ghcr.io/org/image:tag` | `ghcr.io/org/image:tag` (unchanged) |

Default images:
- Shell commands: `alpine:latest`
- Code execution: `oven/bun:latest`

## File Operations

Files are shared between host and container via mounted volumes. The workspace directory on the host is mounted to `/workspace` inside the container.

```typescript
// Write a file (written to host, visible in container at /workspace/)
await sandbox.writeFile("hello.ts", `
export function greet(name: string) {
  return \`Hello, \${name}!\`
}
`)

// Read a file
const content = await sandbox.readFile("hello.ts")
console.log(content)

// List files
const files = await sandbox.listFiles(".")
console.log("Files:", files)
```

## Snapshots

Capture and restore workspace state for handoff between runtimes:

```typescript
// Capture snapshot (files are base64-encoded)
const snapshot = await sandbox.snapshot()
console.log(`Files captured: ${snapshot.files.length}`)

// Restore to a different sandbox
const newSandbox = await factory.create({})
await newSandbox.restore(snapshot)
```

## Handoff to Cloud

Delegate work from local to a cloud provider while preserving context:

```typescript
// Capture state and stop local sandbox
const { token, snapshot } = await sandbox.delegate("e2b")

// Create cloud sandbox and restore
const cloudSandbox = await e2bFactory.create({})
await cloudSandbox.reclaim(token, snapshot)
```

## CLI Usage

The `fabric-container` binary can be used directly:

```bash
# Run a one-shot command
fabric-container run --image alpine:latest --cmd "echo hello"

# Start the HTTP daemon
fabric-container serve --socket /tmp/fabric-container.sock

# Check runtime status
fabric-container status

# List running containers
fabric-container list
```

Or use the helper script:

```bash
./scripts/run-container.sh "echo hello"
./scripts/run-container.sh --image oven/bun:latest "bun --version"
```

## HTTP API

When running as a daemon (`fabric-container serve`), the Swift server exposes these endpoints on a Unix socket:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/status` | Runtime status and kernel info |
| `GET` | `/list` | List running containers |
| `POST` | `/run` | Execute a one-shot command |
| `POST` | `/start` | Start a long-running container |
| `POST` | `/stop/{id}` | Stop a container |
| `POST` | `/snapshot/{id}` | Capture workspace files |
| `POST` | `/restore/{id}` | Restore workspace files |

### Example: Run via API

```bash
curl --unix-socket /tmp/fabric-container.sock \
  -X POST http://localhost/run \
  -H "Content-Type: application/json" \
  -d '{"image": "alpine:latest", "command": "uname -a"}'
```

## Container Configuration

The Swift runtime supports these configuration options:

| Option | Default | Description |
|--------|---------|-------------|
| Memory | 512 MiB | RAM allocated to the VM |
| CPUs | 2 | Virtual CPU count |
| Rootfs | 2 GiB | Root filesystem size |
| Network | VmnetNetwork | Container networking via vmnet |

## Kernel Lookup

The `fabric-container` binary searches for the `vmlinux` kernel in this order:

1. Sibling to the executable
2. `FabricContainer/bin/vmlinux` (relative to build output)
3. `/usr/local/share/fabric/vmlinux`
4. `~/.fabric/vmlinux`

## Troubleshooting

**Binary not found**: Build it with `cd packages/runtime-local/FabricContainer && swift build -c release`

**Kernel not found**: Ensure `vmlinux` exists at `packages/runtime-local/bin/vmlinux`. This is a Linux arm64 kernel required by Virtualization.framework.

**First run slow**: Initial image pull downloads the OCI image and boots the VM. Subsequent runs are faster.

**PTY required**: The Virtualization.framework requires a TTY. The TypeScript adapter wraps invocations with `script -q /dev/null` to provide one.

## Comparison with Cloud Providers

| Feature | Local Container | Daytona | E2B | exe.dev |
|---------|----------------|---------|-----|---------|
| Startup | ~2-5s (first), <1s (cached) | ~2-3s | <200ms | ~5-10s |
| API Key | None | Required | Required | SSH key |
| Internet | Host network | Tier-based | Full | Full |
| Persistence | Workspace dir | Session | Session | Persistent VM |
| Cost | Free | Pay per use | Pay per use | Pay per use |
| Platform | macOS + Apple Silicon only | Any | Any | Any |
| Isolation | VM-level (Virtualization.framework) | Container | Container | VM |

## Resources

- [Apple Containerization framework](https://github.com/apple/containerization)
- [Virtualization.framework docs](https://developer.apple.com/documentation/virtualization)
- [Swift Package: FabricContainer](packages/runtime-local/FabricContainer/Package.swift)
