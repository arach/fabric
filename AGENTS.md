# fabric

> Lightweight sandboxes for agentic workloads — one interface, any runtime

## Critical Context

**IMPORTANT:** Read these rules before making any changes:

- Fabric uses bun as its package manager and runtime — never use npm or pnpm
- All runtimes implement the unified Sandbox interface (exec, runCode, writeFile, readFile, snapshot, restore)
- Local containers use Apple `container` CLI (Virtualization.framework) — no Docker, no Swift binary
- The CLI defaults to --provider local — cloud providers (daytona, e2b, exe) require API keys
- Per-project .fabric config files define image, mounts, env, and composable profiles (minimal, node, python, bun)
- Snapshots enable handoff between any two runtimes — capture state locally, restore in cloud
- Image references: "alpine" → docker.io/library/alpine, "omarchy" → lopsided/archlinux

## Project Structure

| Component | Path | Purpose |
|-----------|------|---------|
| Cli | `packages/cli/src/cli.ts` | |
| Core | `packages/core/src/` | |
| Runtime Local | `packages/runtime-local/src/` | |
| Runtime Daytona | `packages/runtime-daytona/src/` | |
| Runtime E2b | `packages/runtime-e2b/src/` | |
| Runtime Exe | `packages/runtime-exe/src/` | |
| Server | `packages/server/src/` | |
| Landing | `landing/` | |

## Quick Navigation

- Working with **cli**? → Check packages/cli/src/cli.ts — single-file CLI with all commands
- Working with **runtime**? → Check packages/runtime-*/src/ for provider adapters
- Working with **container**? → Local containers use Apple `container` CLI — see packages/runtime-local/src/index.ts
- Working with **sandbox**? → Core Sandbox interface is in packages/core/src/index.ts
- Working with **config**? → .fabric config parsing is in packages/cli/src/cli.ts — loadFabricConfig(), parseConfigFile(), PROFILES
- Working with **api**? → Check packages/server/src/ for HTTP API
- Working with **snapshot**? → Snapshot/restore is in each runtime adapter — see Sandbox interface
- Working with **handoff**? → Sandbox.delegate() captures state, target.reclaim() restores — see runtime-local/src/index.ts
- Working with **docs**? → Landing site in landing/, doc content inline in landing/pages/DocsPage.tsx

## Overview

> Lightweight sandboxes for agentic workloads. One interface, any runtime.

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

## Getting Started

> Get a sandbox running in under 2 minutes. Local containers, cloud providers, one interface.

# Getting Started

Fabric is a lightweight sandbox toolkit for running code and AI agents across local and cloud environments. Start local, scale to cloud, preserve context everywhere.

## Quick Start

Get a sandbox running in under 2 minutes:

```bash
npm install -g fabric-ai

export DAYTONA_API_KEY=your_key

fabric create --provider daytona
fabric exec "echo 'Hello from Fabric!'"
```

Or use the SDK directly:

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY,
  defaultLanguage: "typescript",
})

const sandbox = await factory.create({})
const result = await sandbox.exec("echo 'Hello!'")
console.log(result.stdout)
await sandbox.stop()
```

## Installation

### CLI (Recommended)

```bash
git clone https://github.com/arach/fabric.git && cd fabric
bun run packages/cli/src/cli.ts setup
```

`fabric setup` handles everything: installs the Apple `container` CLI, downloads the Linux kernel, and pulls base images. Requires macOS 26+ on Apple Silicon.

### SDK Packages

```bash
npm install fabric-ai-core
npm install fabric-ai-daytona
npm install fabric-ai-e2b
npm install fabric-ai-exe
```

## Provider Setup

Fabric supports multiple sandbox providers. Each has different strengths — choose based on your workflow.

| Provider | Startup | Auth | Best for |
|----------|---------|------|----------|
| **Local** | ~1s | None | Development, offline, free |
| **Daytona** | ~2-3s | API Key | Enterprise, TypeScript, network policies |
| **E2B** | <200ms | API Key | Data science, Python, Jupyter |
| **exe.dev** | ~2s | SSH Key | Persistent VMs, full root access |

### Local (default — no API key needed)

```bash
fabric create --provider local
fabric exec "echo Hello from a local container!"
```

### Cloud providers

```bash
# Daytona
export DAYTONA_API_KEY=your_key    # from app.daytona.io
fabric create --provider daytona

# E2B
export E2B_API_KEY=your_key        # from e2b.dev/dashboard
fabric create --provider e2b

# exe.dev
ssh exe.dev                        # registers your SSH key
fabric create --provider exe
```

## Your First Sandbox

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

async function main() {
  const factory = new DaytonaSandboxFactory({
    apiKey: process.env.DAYTONA_API_KEY,
    defaultLanguage: "typescript",
  })

  const sandbox = await factory.create({})
  console.log(`Sandbox ID: ${sandbox.id}`)

  const result = await sandbox.exec("echo 'Hello, Fabric!'")
  console.log(result.stdout)

  await sandbox.stop()
}

main()
```

Or locally, no API key needed:

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"

const factory = new LocalContainerSandboxFactory()
const sandbox = await factory.create({ image: "alpine:latest" })

const result = await sandbox.exec("uname -a")
console.log(result.stdout) // Linux ... aarch64

await sandbox.stop()
```

## Running Code

### Shell Commands

```typescript
const result = await sandbox.exec("ls -la /workspace")
console.log(result.stdout)

if (result.exitCode !== 0) {
  console.error(result.stderr)
}
```

Or from the CLI:

```bash
fabric exec "ls -la /workspace"
fabric exec "node --version"
fabric exec "python3 -c 'print(2 + 2)'"
```

### Code Execution

```typescript
const result = await sandbox.runCode(`
  const greeting = "Hello from TypeScript!"
  console.log(greeting)
`, "typescript")
console.log(result.output)
```

From the CLI:

```bash
fabric run --language typescript "console.log('Hello!')"
fabric run --language python "print(2 + 2)"
```

### Interactive Shell

Drop into a live Linux environment:

```bash
fabric shell                      # Ubuntu (default)
fabric shell --image alpine       # Alpine
fabric shell --image omarchy      # Arch Linux
fabric shell --image python       # Python 3.12
fabric shell --image nginx:latest # Any OCI image
```

Exit with `exit` or Ctrl+D — the container is cleaned up automatically.

## File Operations

### Writing Files

```typescript
await sandbox.writeFile("/workspace/hello.ts", `
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}
`)
```

### Reading Files

```typescript
const content = await sandbox.readFile("/workspace/hello.ts")
console.log(content)

const files = await sandbox.listFiles("/workspace")
console.log(files) // ["hello.ts", ...]
```

## Handoffs

Move work between runtimes without losing state. Snapshot locally, restore in the cloud:

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"
import { E2BSandboxFactory } from "fabric-ai-e2b"

// Start local
const localFactory = new LocalContainerSandboxFactory()
const local = await localFactory.create({ image: "node:22" })
await local.exec("npm install")
await local.writeFile("/workspace/data.json", '{"key": "value"}')

// Snapshot and move to cloud
const snapshot = await local.snapshot()
await local.stop()

const cloudFactory = new E2BSandboxFactory(process.env.E2B_API_KEY)
const cloud = await cloudFactory.create({})
await cloud.restore(snapshot)

// Files and state are preserved
const result = await cloud.exec("cat /workspace/data.json")
console.log(result.stdout) // {"key": "value"}

await cloud.stop()
```

## Project Configuration

Add a `.fabric` file to your project root to configure sandbox defaults:

```bash
fabric init          # Create default .fabric config
fabric init node     # Create config with node profile
```

Example `.fabric` file:

```bash
# Fabric sandbox config
profile: node

# Mount host directories into the container
mount: ./src:/workspace/src:ro
mount: ./data:/workspace/data

# Environment variables
env: NODE_ENV=development

# Override defaults
# image: node:22
# provider: local
# network: true
```

### Profiles

Presets that configure image and default mounts for common workflows:

| Profile | Image | Default Mounts |
|---------|-------|----------------|
| `minimal` | alpine:latest | `.:/workspace:ro` |
| `node` | node:22 | `./src`, `./package.json` |
| `python` | python:3.12 | `./src`, `./requirements.txt` |
| `bun` | oven/bun:latest | `./src`, `./package.json` |

Profiles are composable — your `.fabric` config extends the profile. Additional mounts and env vars are merged on top of profile defaults. The `.fabric` file is discovered by walking up from the current directory, so it works from any subdirectory.

## Running Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's CLI for AI-assisted coding. Run it inside Fabric sandboxes for autonomous development tasks:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY,
  envs: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY },
})

const result = await sandbox.commands.run(
  `echo 'Create a fibonacci function' | claude -p`,
  { timeoutMs: 120_000 }
)

console.log(result.stdout)
await sandbox.kill()
```

Or locally:

```bash
fabric create --provider local
fabric exec "npm install -g @anthropic-ai/claude-code"
fabric exec "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY echo 'Build a REST API' | claude -p"
```

## Error Handling

Always clean up sandboxes, even when errors occur:

```typescript
const sandbox = await factory.create({})
try {
  await sandbox.exec("some-command")
  await sandbox.exec("another-command")
} finally {
  await sandbox.stop() // Always runs
}
```

For transient failures, retry with backoff:

```typescript
async function execWithRetry(sandbox, cmd, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await sandbox.exec(cmd)
    } catch (e) {
      if (i === maxAttempts - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}
```

## Available Images

| Name | Image | Description |
|------|-------|-------------|
| ubuntu | ubuntu:latest | Ubuntu Linux (default) |
| alpine | alpine:latest | Alpine Linux (minimal) |
| omarchy / arch | lopsided/archlinux | Arch Linux (arm64) |
| debian | debian:latest | Debian |
| fedora | fedora:latest | Fedora |
| bun | oven/bun:latest | Bun runtime |
| node | node:22 | Node.js 22 |
| python | python:3.12 | Python 3.12 |

Any OCI-compatible arm64 image works: `fabric shell --image myregistry/myimage:tag`

## CLI Reference

| Command | Description |
|---------|-------------|
| `fabric setup` | Install everything (container CLI, kernel, images) |
| `fabric init` | Create a `.fabric` config for this project |
| `fabric shell` | Interactive Linux shell |
| `fabric create` | Create a sandbox |
| `fabric exec` | Run a command in a sandbox |
| `fabric run` | Execute code in a sandbox |
| `fabric list` | List active sandboxes |
| `fabric stop` | Stop a sandbox |

## Pricing

**Fabric is free.** You bring your own API keys for cloud providers.

| Component | Cost |
|-----------|------|
| Fabric CLI & SDK | Free |
| Local containers | Free (runs on your Mac) |
| Daytona sandboxes | [Daytona pricing](https://daytona.io/pricing) |
| E2B sandboxes | [E2B pricing](https://e2b.dev/pricing) |
| exe.dev VMs | [exe.dev pricing](https://exe.dev) |

The core framework will always be free and open source.

## Next Steps

- [Local Containers](./local-container.md) — How the container runtime works
- [Architecture](./architecture.md) — Project structure and runtime adapter pattern
- [API Reference](./api.md) — TypeScript interfaces
- [Project Config](./skill.md) — `.fabric` file reference and profiles
- [Daytona](./daytona.md) — Enterprise features and network policies
- [E2B](./e2b.md) — Jupyter integration and Claude Code template
- [exe.dev](./exe.md) — Persistent VMs and pre-installed agents

## Local Container Runtime

> Run isolated Linux containers on macOS using Apple's container CLI — no Docker, no API keys.

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

## Daytona Runtime

> Enterprise cloud sandboxes with secure network policies, multi-language support, and tier-based access control.

# Daytona Runtime

Daytona provides enterprise-grade cloud sandboxes for running Claude Code agents with secure network policies and multi-language support.

## Installation

```bash
npm install @fabric/core @fabric/runtime-daytona
```

## Configuration

Set these environment variables:

```bash
# Required
DAYTONA_API_KEY=your_daytona_api_key

# Required for Claude Code
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your Daytona API key from [app.daytona.io](https://app.daytona.io).

## Basic Usage

```typescript
import { DaytonaSandboxFactory } from "@fabric/runtime-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

// Create a sandbox
const sandbox = await factory.create({})
console.log(`Sandbox ID: ${sandbox.id}`)

// Execute shell commands
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Run TypeScript code
const codeResult = await sandbox.runCode(`
  const greeting = "Hello from Daytona!"
  console.log(greeting)
  console.log("Current time:", new Date().toISOString())
`)
console.log(codeResult.output)

// Clean up
await sandbox.stop()
```

## Language Support

Daytona supports multiple languages out of the box:

```typescript
// TypeScript (default)
const tsSandbox = await factory.create({ language: "typescript" })

// Python
const pySandbox = await factory.create({ language: "python" })

// Go
const goSandbox = await factory.create({ language: "go" })

// Rust
const rustSandbox = await factory.create({ language: "rust" })

// JavaScript
const jsSandbox = await factory.create({ language: "javascript" })
```

## File Operations

```typescript
// Write a file
await sandbox.writeFile("/home/daytona/hello.ts", `
export function greet(name: string) {
  return \`Hello, \${name}!\`
}
`)

// Read a file
const content = await sandbox.readFile("/home/daytona/hello.ts")
console.log(content)

// List files in a directory
const files = await sandbox.listFiles("/home/daytona")
console.log("Files:", files)
```

## Running Claude Code

Claude Code works in Daytona with a direct Anthropic API key:

```typescript
import { Daytona } from "@daytonaio/sdk"

const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY })

const sandbox = await daytona.create({ language: "typescript" })

// Install Claude Code
await sandbox.process.executeCommand(
  "npm install -g @anthropic-ai/claude-code",
  undefined, undefined, 120
)

// Run Claude Code
const mission = "Create a fibonacci function in TypeScript"
const result = await sandbox.process.executeCommand(
  `export ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY} && echo '${mission}' | claude -p --dangerously-skip-permissions`,
  undefined, undefined, 180
)

console.log(result.result)

await sandbox.delete()
```

## Network Access

Daytona uses tier-based network policies for security.

### Essential Services (All Tiers)

These services are always accessible:

**AI APIs:**
- api.anthropic.com
- api.openai.com
- api.perplexity.ai
- api.deepseek.com
- api.groq.com
- openrouter.ai

**Package Registries:**
- registry.npmjs.org
- pypi.org
- repo1.maven.org

**Git Hosting:**
- github.com
- gitlab.com
- bitbucket.org

**Container Registries:**
- docker.io
- gcr.io
- ghcr.io

### Network Restrictions

| Tier | Network Access |
|------|----------------|
| Tier 1/2 | Essential services only |
| Tier 3/4 | Full internet + custom allowlist |

### Custom Allowlist (Tier 3/4)

```typescript
const sandbox = await daytona.create({
  networkAllowList: "208.80.154.232/32,199.16.156.103/32"
})
```

## Snapshots

Capture and restore sandbox state:

```typescript
// Capture snapshot
const snapshot = await sandbox.snapshot()
console.log(`Snapshot ID: ${snapshot.id}`)
console.log(`Files captured: ${snapshot.files.length}`)

// Save snapshot to file
import { writeFileSync } from "fs"
writeFileSync("snapshot.json", JSON.stringify(snapshot, null, 2))

// Later, restore from snapshot
const newSandbox = await factory.create({})
await newSandbox.restore(snapshot)
```

## Environment Variables

Pass environment variables to the sandbox:

```typescript
const sandbox = await factory.create({
  envVars: {
    NODE_ENV: "production",
    DEBUG: "true",
    API_URL: "https://api.example.com"
  }
})
```

## Error Handling

```typescript
try {
  const sandbox = await factory.create({})

  const result = await sandbox.exec("some-command")

  if (result.exitCode !== 0) {
    console.error("Command failed:", result.stderr)
  }

} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("Operation timed out")
  } else {
    console.error("Error:", error.message)
  }
}
```

## Sandbox Lifecycle

```typescript
const sandbox = await factory.create({})

console.log(sandbox.status) // "running"

// Do work...

await sandbox.stop()

console.log(sandbox.status) // "stopped"
```

## Best Practices

1. **Always clean up sandboxes** - Call `sandbox.stop()` or `sandbox.delete()` when done

2. **Use appropriate timeouts** - Long-running commands need longer timeouts:
   ```typescript
   await sandbox.process.executeCommand(cmd, undefined, undefined, 300) // 5 min
   ```

3. **Check exit codes** - Always verify command success:
   ```typescript
   const result = await sandbox.exec("npm install")
   if (result.exitCode !== 0) {
     throw new Error(`Install failed: ${result.stderr}`)
   }
   ```

4. **Use snapshots for reproducibility** - Capture state before risky operations

5. **Set environment variables at creation** - More secure than inline exports

## Comparison with E2B

| Feature | Daytona | E2B |
|---------|---------|-----|
| Default Language | TypeScript | Python |
| Multi-Language | TS, Python, Go, Rust, JS | Python, JS |
| Network | Secure allowlist | Full access |
| Claude Template | npm install | Pre-built |
| Jupyter Kernel | No | Yes |
| Best For | Enterprise, TypeScript | Data science |

## Resources

- [Daytona Documentation](https://www.daytona.io/docs)
- [Daytona Dashboard](https://app.daytona.io)
- [Network Limits](https://www.daytona.io/docs/en/network-limits/)
- [SDK Reference](https://www.daytona.io/docs/en/typescript-sdk/)

## E2B Runtime

> Fast-starting code interpreter sandboxes with sub-200ms startup, Jupyter support, and a pre-built Claude Code template.

# E2B Runtime

E2B provides fast-starting code interpreter sandboxes with full internet access and a pre-built Claude Code template.

## Installation

```bash
npm install @fabric/core @fabric/runtime-e2b
```

## Configuration

Set these environment variables:

```bash
# Required
E2B_API_KEY=your_e2b_api_key

# Required for Claude Code
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your E2B API key from [e2b.dev/dashboard](https://e2b.dev/dashboard).

## Basic Usage

```typescript
import { E2BSandboxFactory } from "@fabric/runtime-e2b"

const factory = new E2BSandboxFactory(process.env.E2B_API_KEY)

// Create a sandbox
const sandbox = await factory.create({})
console.log(`Sandbox ID: ${sandbox.id}`)

// Execute shell commands
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Run Python code (E2B default)
const codeResult = await sandbox.runCode(`
import datetime
print("Hello from E2B!")
print("Current time:", datetime.datetime.now().isoformat())
`)
console.log(codeResult.output)

// Clean up
await sandbox.stop()
```

## Claude Code Template

E2B provides a pre-built template with Claude Code installed:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

// Create sandbox with Claude Code template
const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY,
  envs: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  }
})

console.log(`Sandbox: ${sandbox.sandboxId}`)

// Run Claude Code with a mission
const mission = "Create a Python script that generates the first 20 Fibonacci numbers"

const result = await sandbox.commands.run(
  `echo '${mission}' | claude -p --dangerously-skip-permissions`,
  { timeoutMs: 120_000 }
)

console.log("Claude's response:")
console.log(result.stdout)

// Check what Claude created
const files = await sandbox.files.list("/home/user")
console.log("Files:", files.map(f => f.name))

// Read a file Claude created
if (files.some(f => f.name === "fibonacci.py")) {
  const content = await sandbox.files.read("/home/user/fibonacci.py")
  console.log("\nfibonacci.py:")
  console.log(content)
}

await sandbox.kill()
```

## Code Execution

E2B's code interpreter supports Python and JavaScript:

```typescript
// Python (default)
const pyResult = await sandbox.runCode(`
import math
print("Pi =", math.pi)
print("E =", math.e)
`)

// Using the E2B SDK directly for more control
import { Sandbox } from "@e2b/code-interpreter"

const sbx = await Sandbox.create({ apiKey: process.env.E2B_API_KEY })

const execution = await sbx.runCode(`
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
plt.plot(x, np.sin(x))
plt.title("Sine Wave")
plt.savefig("sine.png")
print("Chart saved!")
`)

console.log(execution.logs.stdout)

// Access generated charts
for (const result of execution.results) {
  if (result.png) {
    console.log("Chart generated:", result.png.substring(0, 50) + "...")
  }
}

await sbx.kill()
```

## File Operations

```typescript
// Write a file
await sandbox.writeFile("/home/user/hello.py", `
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
`)

// Read a file
const content = await sandbox.readFile("/home/user/hello.py")
console.log(content)

// List files in a directory
const files = await sandbox.listFiles("/home/user")
console.log("Files:", files)
```

## Using the E2B SDK Directly

For advanced use cases, use the E2B SDK directly:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create({
  apiKey: process.env.E2B_API_KEY,
  metadata: { project: "my-project" }
})

// Commands API
const cmdResult = await sandbox.commands.run("pip install requests")
console.log("Exit code:", cmdResult.exitCode)

// Files API
await sandbox.files.write("/home/user/data.json", JSON.stringify({ key: "value" }))
const data = await sandbox.files.read("/home/user/data.json")

// Run code with full execution info
const execution = await sandbox.runCode(`
x = [1, 2, 3, 4, 5]
print("Sum:", sum(x))
print("Average:", sum(x) / len(x))
`)

console.log("Stdout:", execution.logs.stdout)
console.log("Stderr:", execution.logs.stderr)

if (execution.error) {
  console.error("Error:", execution.error)
}

await sandbox.kill()
```

## Snapshots

Capture and restore sandbox state:

```typescript
// Capture snapshot
const snapshot = await sandbox.snapshot()
console.log(`Snapshot ID: ${snapshot.id}`)
console.log(`Files captured: ${snapshot.files.length}`)

// Save snapshot
import { writeFileSync } from "fs"
writeFileSync("e2b-snapshot.json", JSON.stringify(snapshot, null, 2))

// Later, restore from snapshot
const newSandbox = await factory.create({})
await newSandbox.restore(snapshot)
```

## Network Access

E2B sandboxes have **full internet access** by default:

```typescript
const result = await sandbox.exec(`
curl -s https://api.github.com/users/anthropics
`)
console.log(result.stdout)
```

This makes E2B ideal for:
- Fetching external data
- Calling third-party APIs
- Installing packages from any source
- Web scraping

## Timeouts

E2B sandboxes have configurable timeouts:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

// Set sandbox timeout (default: 5 minutes)
const sandbox = await Sandbox.create({
  apiKey: process.env.E2B_API_KEY,
  timeoutMs: 600_000  // 10 minutes
})

// Set command timeout
const result = await sandbox.commands.run("long-running-command", {
  timeoutMs: 300_000  // 5 minutes
})
```

## Error Handling

```typescript
try {
  const sandbox = await factory.create({})

  const result = await sandbox.exec("python script.py")

  if (result.exitCode !== 0) {
    console.error("Script failed:")
    console.error(result.stderr)
  }

} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("Operation timed out")
  } else if (error.message.includes("E2B_API_KEY")) {
    console.error("API key not configured")
  } else {
    console.error("Error:", error.message)
  }
}
```

## Jupyter Kernel Support

E2B sandboxes include Jupyter kernel support:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY })

// Run code that maintains state
await sandbox.runCode("x = 10")
await sandbox.runCode("y = 20")
const result = await sandbox.runCode("print(x + y)")  // Outputs: 30

// Generate visualizations
const chartExecution = await sandbox.runCode(`
import matplotlib.pyplot as plt
plt.figure(figsize=(10, 6))
plt.bar(['A', 'B', 'C'], [10, 20, 15])
plt.title('Sample Chart')
plt.show()
`)

// Charts are returned as base64 PNG
for (const result of chartExecution.results) {
  if (result.png) {
    // Save or display the chart
    const buffer = Buffer.from(result.png, 'base64')
    writeFileSync('chart.png', buffer)
  }
}

await sandbox.kill()
```

## Best Practices

1. **Use the Claude Code template** - For Claude agents, use `anthropic-claude-code` template:
   ```typescript
   const sandbox = await Sandbox.create("anthropic-claude-code", { ... })
   ```

2. **Set appropriate timeouts** - Claude Code operations need longer timeouts:
   ```typescript
   await sandbox.commands.run(cmd, { timeoutMs: 120_000 })
   ```

3. **Clean up sandboxes** - Always call `kill()` or `stop()`:
   ```typescript
   try {
     // ... do work
   } finally {
     await sandbox.kill()
   }
   ```

4. **Check execution errors** - The `runCode` method returns an error field:
   ```typescript
   const result = await sandbox.runCode(code)
   if (result.error) {
     console.error("Execution error:", result.error)
   }
   ```

5. **Use metadata** - Tag sandboxes for easier management:
   ```typescript
   await Sandbox.create({
     apiKey: process.env.E2B_API_KEY,
     metadata: { userId: "123", project: "my-app" }
   })
   ```

## Comparison with Daytona

| Feature | E2B | Daytona |
|---------|-----|---------|
| Default Language | Python | TypeScript |
| Startup Time | <200ms | ~2-3s |
| Network | Full access | Allowlist |
| Claude Template | Pre-built | npm install |
| Jupyter Kernel | Yes | No |
| Multi-Language | Python, JS | TS, Python, Go, Rust, JS |
| Best For | Data science | Enterprise |

## Resources

- [E2B Documentation](https://e2b.dev/docs)
- [E2B Dashboard](https://e2b.dev/dashboard)
- [Code Interpreter SDK](https://github.com/e2b-dev/code-interpreter)
- [Claude Code Template](https://e2b.dev/docs/templates/claude-code)

## exe.dev Runtime

> Persistent VMs with SSH access, full root, and pre-installed Claude Code, Codex, and Shelley agents.

# exe.dev Runtime

exe.dev provides persistent VMs with SSH access for running Claude Code agents. Unlike ephemeral sandboxes, exe.dev VMs persist between sessions with full root access.

## Installation

```bash
npm install fabric-ai-core fabric-ai-exe
```

## Configuration

exe.dev uses SSH authentication - no API key required. Your SSH key is used automatically:

```bash
# Ensure you have an SSH key
ls ~/.ssh/id_ed25519 || ls ~/.ssh/id_rsa

# If not, generate one
ssh-keygen -t ed25519

# Sign up and authenticate with exe.dev
ssh exe.dev
```

For Claude Code execution, set your Anthropic API key:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Basic Usage

```typescript
import { ExeSandboxFactory } from "fabric-ai-exe"

const factory = new ExeSandboxFactory()

// Create a VM
const sandbox = await factory.create({ name: "my-agent" })
console.log(`VM: ${sandbox.id}.exe.xyz`)

// Execute shell commands via SSH
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Run Python code
const codeResult = await sandbox.runCode(`
print("Hello from exe.dev!")
print("2 + 2 =", 2 + 2)
`, "python")
console.log(codeResult.output)

// Clean up
await sandbox.stop()
```

## SSH Configuration

The adapter automatically loads SSH keys from standard locations:

```typescript
// Default behavior - uses ~/.ssh/id_ed25519 or ~/.ssh/id_rsa
const factory = new ExeSandboxFactory()

// Custom SSH key path
const factory = new ExeSandboxFactory({
  privateKeyPath: "/path/to/your/key"
})

// Or provide key content directly
const factory = new ExeSandboxFactory({
  privateKey: Buffer.from("-----BEGIN OPENSSH PRIVATE KEY-----...")
})
```

## Language Support

exe.dev VMs are full Ubuntu machines. The runtime adapter handles code execution:

```typescript
// Python
const pyResult = await sandbox.runCode(`
import math
print(f"Pi is {math.pi}")
`, "python")

// JavaScript/Node.js
const jsResult = await sandbox.runCode(`
console.log("Hello from Node.js")
console.log(process.version)
`, "javascript")

// TypeScript (via bun or tsx)
const tsResult = await sandbox.runCode(`
const greeting: string = "Hello TypeScript"
console.log(greeting)
`, "typescript")

// Bash/Shell (default)
const shResult = await sandbox.runCode(`
echo "Current directory: $(pwd)"
ls -la
`)
```

## File Operations via SFTP

```typescript
// Write a file
await sandbox.writeFile("/home/user/hello.py", `
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
`)

// Read a file
const content = await sandbox.readFile("/home/user/hello.py")
console.log(content)

// List files in a directory
const files = await sandbox.listFiles("/home/user")
console.log("Files:", files)
```

## Pre-installed Agents

exe.dev VMs come with coding agents pre-installed:

```typescript
const sandbox = await factory.create({ name: "agent-box" })

// Check available agents
const result = await sandbox.exec("which claude codex")
console.log(result.stdout)
// /usr/local/bin/claude
// /usr/local/bin/codex

// Run Claude Code
await sandbox.exec(`
  export ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}
  echo 'Build a REST API in Python' | claude -p --dangerously-skip-permissions
`)
```

### Shelley Agent

exe.dev includes Shelley, a web-based agent accessible at port 9999:

```typescript
// Shelley is available at:
// https://my-agent.exe.xyz:9999/

// Configure Shelley via AGENTS.md
await sandbox.writeFile("/home/user/.config/shelley/AGENTS.md", `
# Agent Instructions

You are a helpful coding assistant.
- Write clean, documented code
- Follow best practices
- Test your changes
`)
```

## VM Management

```typescript
// Create with custom name
const sandbox = await factory.create({ name: "my-project" })

// List all your VMs
const vms = await factory.list()
console.log("Your VMs:", vms)
// [{ id: "my-project", status: "running" }, ...]

// Resume an existing VM
const existing = await factory.resume("my-project")
if (existing) {
  const result = await existing.exec("echo 'Still here!'")
  console.log(result.stdout)
}

// Stop and delete
await sandbox.stop()
```

## Direct SSH Access

You can also SSH into your VMs directly:

```bash
# Create VM via CLI
ssh exe.dev new my-project

# SSH into the VM
ssh my-project.exe.xyz

# Or use the Fabric CLI
fabric create --provider exe --name my-project
fabric exec --provider exe "echo hello"
```

## Snapshots

Capture and restore workspace state:

```typescript
// Capture snapshot
const snapshot = await sandbox.snapshot()
console.log(`Snapshot ID: ${snapshot.id}`)
console.log(`Files captured: ${snapshot.files.length}`)

// Save snapshot to file
import { writeFileSync } from "fs"
writeFileSync("snapshot.json", JSON.stringify(snapshot, null, 2))

// Later, restore from snapshot
const newSandbox = await factory.create({ name: "restored" })
await newSandbox.restore(snapshot)
```

## Network Access

exe.dev VMs have full internet access by default - no restrictions or allowlists.

```typescript
// Access any API
const result = await sandbox.exec("curl https://api.github.com")
console.log(result.stdout)

// Install packages from anywhere
await sandbox.exec("pip install requests pandas numpy")
await sandbox.exec("npm install express axios")
```

## Persistent Disk

Unlike ephemeral sandboxes, exe.dev VMs have persistent storage:

```typescript
// Files persist between sessions
await sandbox.writeFile("/home/user/data.json", '{"count": 1}')

// Later, reconnect to the same VM
const existing = await factory.resume("my-project")
if (existing) {
  const data = await existing.readFile("/home/user/data.json")
  console.log("Data:", JSON.parse(data)) // {"count": 1}
}
```

## Root Access

You have full sudo access on exe.dev VMs:

```typescript
// Install system packages
await sandbox.exec("sudo apt-get update && sudo apt-get install -y ffmpeg")

// Modify system configuration
await sandbox.exec("sudo systemctl enable nginx")

// Access everything
await sandbox.exec("sudo cat /etc/passwd")
```

## Error Handling

```typescript
try {
  const sandbox = await factory.create({ name: "test" })

  const result = await sandbox.exec("some-command")

  if (result.exitCode !== 0) {
    console.error("Command failed:", result.stderr)
  }

} catch (error) {
  if (error.message.includes("SSH connection failed")) {
    console.error("Could not connect to exe.dev")
    console.error("Make sure you have authenticated: ssh exe.dev")
  } else {
    console.error("Error:", error.message)
  }
}
```

## Comparison with Other Providers

| Feature | exe.dev | E2B | Daytona |
|---------|---------|-----|---------|
| Architecture | Persistent VMs | Ephemeral Sandboxes | Ephemeral Sandboxes |
| Network Access | Full Internet | Full Internet | Allowlist |
| Pre-installed Agents | Claude, Codex, Shelley | Claude Template | npm install |
| Root Access | Yes (sudo) | Limited | No |
| Persistent Disk | Yes | Snapshot | Snapshot |
| Access Protocol | SSH/SFTP | REST API | REST API |
| Setup | SSH key | API key | API key |

## Best Practices

1. **Name your VMs descriptively** - Makes it easier to manage multiple projects:
   ```typescript
   await factory.create({ name: "project-frontend" })
   await factory.create({ name: "project-api" })
   ```

2. **Use resume for existing VMs** - Don't create duplicates:
   ```typescript
   let sandbox = await factory.resume("my-project")
   if (!sandbox) {
     sandbox = await factory.create({ name: "my-project" })
   }
   ```

3. **Clean up when done** - VMs consume resources:
   ```typescript
   await sandbox.stop()
   ```

4. **Use snapshots before risky operations**:
   ```typescript
   const backup = await sandbox.snapshot()
   // Try something risky...
   if (somethingWentWrong) {
     await sandbox.restore(backup)
   }
   ```

5. **Keep SSH keys secure** - Your key authenticates all exe.dev operations

## Resources

- [exe.dev Website](https://exe.dev)
- [exe.dev Documentation](https://exe.dev/docs)
- [exe.dev Blog](https://blog.exe.dev)
- [Shelley Agent Docs](https://exe.dev/docs/shelley)

---
Generated by [Dewey 0.3.1](https://github.com/arach/dewey) | Last updated: 2026-03-09