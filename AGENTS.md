# fabric

> Ambient compute fabric — run agentic workloads across local and cloud runtimes

## Critical Context

**IMPORTANT:** Read these rules before making any changes:

- Fabric uses bun as its package manager and runtime — never use npm or pnpm
- All runtimes implement the unified Sandbox interface (exec, runCode, writeFile, readFile, snapshot, restore)
- The local container runtime uses Apple Containerization framework (Virtualization.framework) — macOS 26+, Apple Silicon only
- FabricContainer is a Swift 6.2 executable that provides CLI + HTTP API over Unix domain socket
- Image references are auto-normalized: "alpine" → "docker.io/library/alpine"
- Snapshots enable handoff between any two runtimes — capture state locally, restore in cloud

## Project Structure

| Component | Path | Purpose |
|-----------|------|---------|
| Core | `packages/core/src/` | |
| Runtime Local | `packages/runtime-local/src/` | |
| Fabric Container (Swift) | `packages/runtime-local/FabricContainer/` | |
| Runtime E2b | `packages/runtime-e2b/src/` | |
| Runtime Daytona | `packages/runtime-daytona/src/` | |
| Runtime Exe | `packages/runtime-exe/src/` | |
| Server | `packages/server/src/` | |

## Quick Navigation

- Working with **runtime**? → Check packages/runtime-*/src/ for provider adapters
- Working with **container**? → Check packages/runtime-local/FabricContainer/ for Swift source and packages/runtime-local/src/index.ts for TS adapter
- Working with **sandbox**? → Core Sandbox interface is in packages/core/src/index.ts
- Working with **api**? → Check packages/server/src/ for HTTP API
- Working with **snapshot**? → Snapshot/restore is in each runtime adapter and in the FabricContainer HTTP API (/snapshot, /restore)
- Working with **handoff**? → Sandbox.delegate() captures state, target.reclaim() restores — see runtime-local/src/index.ts

## Overview

> Ambient compute fabric for running agentic workloads across local and cloud runtimes with a unified Sandbox interface.

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

## Getting Started

> Set up Fabric and create your first sandbox across local containers, Daytona, E2B, or exe.dev.

# Getting Started with Fabric

Fabric is an ambient compute framework for running code and AI agents across local and cloud sandboxes. This guide will help you get up and running quickly.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Provider Setup](#provider-setup)
  - [Daytona](#daytona)
  - [E2B](#e2b)
  - [exe.dev](#exedev)
  - [Local Containers](#local-containers)
- [Your First Sandbox](#your-first-sandbox)
- [Running Code](#running-code)
- [File Operations](#file-operations)
- [Handoffs](#handoffs)
- [Running Claude Code in Sandboxes](#running-claude-code-in-sandboxes)

---

## Quick Start

Get a sandbox running in under 2 minutes:

```bash
# Install the CLI and core packages
npm install -g fabric-ai

# Set up your provider (pick one)
export DAYTONA_API_KEY=your_key      # Daytona
export E2B_API_KEY=your_key          # E2B
# or just `ssh exe.dev` for exe.dev

# Create and use a sandbox
fabric create --provider daytona
fabric exec "echo 'Hello from Fabric!'"
fabric stop
```

Or use the SDK directly:

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({})
const result = await sandbox.exec("echo 'Hello from Fabric!'")
console.log(result.stdout) // "Hello from Fabric!"
await sandbox.stop()
```

---

## Installation

### Option 1: CLI (Recommended for Getting Started)

```bash
# Install globally with npm
npm install -g fabric-ai

# Or with pnpm
pnpm add -g fabric-ai

# Or with bun
bun add -g fabric-ai

# Verify installation
fabric --help
```

### Option 2: SDK Packages

Install the core package and your preferred provider:

```bash
# Core (always required)
npm install fabric-ai-core

# Pick your provider(s)
npm install fabric-ai-daytona  # Daytona cloud sandboxes
npm install fabric-ai-e2b      # E2B cloud sandboxes
npm install fabric-ai-exe      # exe.dev persistent VMs
```

### Option 3: From Source

```bash
# Clone the repository
git clone https://github.com/arach/fabric.git
cd fabric

# Install dependencies with bun
bun install

# Build all packages
bun run build

# Run development server
bun run dev
```

---

## Provider Setup

Fabric supports multiple cloud sandbox providers. Choose based on your needs:

| Provider | Best For | Auth Method | Startup Time |
|----------|----------|-------------|--------------|
| **Daytona** | Enterprise, TypeScript | API Key | ~2-3s |
| **E2B** | Data science, Python | API Key | <200ms |
| **exe.dev** | Full control, persistent VMs | SSH Key | ~2s |
| **Local** | Development, no cloud needed | None | ~1s |

### Daytona

[Daytona](https://daytona.io) provides enterprise-grade cloud sandboxes with secure network policies.

**1. Get your API key:**
- Sign up at [app.daytona.io](https://app.daytona.io)
- Navigate to Settings > API Keys
- Create a new API key

**2. Set environment variable:**
```bash
export DAYTONA_API_KEY=your_daytona_api_key
```

**3. Test the connection:**
```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({})
console.log(`Sandbox created: ${sandbox.id}`)
await sandbox.stop()
```

**Supported languages:** TypeScript, Python, Go, Rust, JavaScript

---

### E2B

[E2B](https://e2b.dev) provides fast-starting code interpreter sandboxes with full internet access.

**1. Get your API key:**
- Sign up at [e2b.dev](https://e2b.dev)
- Go to [e2b.dev/dashboard](https://e2b.dev/dashboard)
- Copy your API key

**2. Set environment variable:**
```bash
export E2B_API_KEY=your_e2b_api_key
```

**3. Test the connection:**
```typescript
import { E2BSandboxFactory } from "fabric-ai-e2b"

const factory = new E2BSandboxFactory(process.env.E2B_API_KEY)

const sandbox = await factory.create({})
console.log(`Sandbox created: ${sandbox.id}`)
await sandbox.stop()
```

**Special feature:** E2B offers a pre-built Claude Code template:
```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY
})
```

---

### exe.dev

[exe.dev](https://exe.dev) provides persistent VMs with SSH access and pre-installed coding agents.

**1. Set up SSH key:**
```bash
# Check if you have an SSH key
ls ~/.ssh/id_ed25519 || ls ~/.ssh/id_rsa

# If not, generate one
ssh-keygen -t ed25519
```

**2. Authenticate with exe.dev:**
```bash
# This registers your SSH key
ssh exe.dev
```

**3. Test the connection:**
```typescript
import { ExeSandboxFactory } from "fabric-ai-exe"

const factory = new ExeSandboxFactory()

const sandbox = await factory.create({ name: "my-first-sandbox" })
console.log(`VM created: ${sandbox.id}.exe.xyz`)
await sandbox.stop()
```

**Special features:**
- Persistent disk (files survive restarts)
- Full root access (sudo)
- Pre-installed Claude Code, Codex, and Shelley agents

---

### Local Containers

For development without cloud dependencies, use local containers (macOS only, requires Apple Silicon).

**Requirements:**
- macOS 13.0+ (Ventura or later)
- Apple Silicon (M1/M2/M3)
- Xcode Command Line Tools

**Setup:**
```bash
# Build the container runtime
cd packages/runtime-local/FabricContainer
swift build -c release
```

**Usage:**
```typescript
import { LocalContainerFactory } from "@arach/runtime-local"

const factory = new LocalContainerFactory()
const sandbox = await factory.create({
  image: "alpine:latest"
})

await sandbox.exec("echo 'Hello from local container!'")
await sandbox.stop()
```

---

## Your First Sandbox

Let's create a sandbox, run some code, and clean up:

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

async function main() {
  // 1. Create a factory
  const factory = new DaytonaSandboxFactory({
    apiKey: process.env.DAYTONA_API_KEY!,
    defaultLanguage: "typescript"
  })

  // 2. Create a sandbox
  console.log("Creating sandbox...")
  const sandbox = await factory.create({})
  console.log(`Sandbox ID: ${sandbox.id}`)
  console.log(`Runtime: ${sandbox.runtimeType}`)
  console.log(`Status: ${sandbox.status}`)

  // 3. Run a command
  console.log("\nRunning command...")
  const result = await sandbox.exec("echo 'Hello, Fabric!'")
  console.log(`Output: ${result.stdout}`)
  console.log(`Exit code: ${result.exitCode}`)

  // 4. Clean up
  console.log("\nStopping sandbox...")
  await sandbox.stop()
  console.log("Done!")
}

main().catch(console.error)
```

---

## Running Code

### Shell Commands with `exec()`

Run any shell command:

```typescript
// Simple command
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Check exit code
const npmResult = await sandbox.exec("npm install express")
if (npmResult.exitCode !== 0) {
  console.error("Install failed:", npmResult.stderr)
}

// Chain commands
await sandbox.exec("cd /workspace && npm init -y && npm install typescript")
```

### Code Execution with `runCode()`

Execute code in the sandbox's default language:

```typescript
// TypeScript (Daytona default)
const tsResult = await sandbox.runCode(`
  const greeting = "Hello from TypeScript!"
  console.log(greeting)
  console.log("2 + 2 =", 2 + 2)
`)
console.log(tsResult.output)

// Python (E2B default)
const pyResult = await sandbox.runCode(`
import math
print(f"Pi is {math.pi}")
print(f"Square root of 2 is {math.sqrt(2)}")
`)
console.log(pyResult.output)

// Specify language explicitly
const jsResult = await sandbox.runCode(`
console.log("JavaScript works too!")
`, "javascript")
```

### Multi-step Execution

```typescript
// Install dependencies and run
await sandbox.exec("npm install axios")

const result = await sandbox.runCode(`
import axios from "axios"

const response = await axios.get("https://api.github.com/users/anthropics")
console.log("Anthropic GitHub profile:", response.data.name)
console.log("Public repos:", response.data.public_repos)
`)
```

---

## File Operations

### Writing Files

```typescript
// Write a text file
await sandbox.writeFile("/workspace/hello.ts", `
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}

console.log(greet("World"))
`)

// Write JSON
await sandbox.writeFile("/workspace/config.json", JSON.stringify({
  name: "my-project",
  version: "1.0.0"
}, null, 2))

// Write binary data
const imageBuffer = Buffer.from(base64Image, "base64")
await sandbox.writeFile("/workspace/image.png", imageBuffer)
```

### Reading Files

```typescript
// Read a text file
const content = await sandbox.readFile("/workspace/hello.ts")
console.log(content)

// Read JSON
const configStr = await sandbox.readFile("/workspace/config.json")
const config = JSON.parse(configStr)
console.log(config.name)
```

### Listing Files

```typescript
// List files in a directory
const files = await sandbox.listFiles("/workspace")
console.log("Files:", files)
// ["hello.ts", "config.json", "node_modules", "package.json"]

// Filter by extension
const tsFiles = files.filter(f => f.endsWith(".ts"))
console.log("TypeScript files:", tsFiles)
```

### Complete Example: Build a Project

```typescript
// Create a complete TypeScript project
await sandbox.writeFile("/workspace/src/index.ts", `
import { add } from "./math"

console.log("2 + 3 =", add(2, 3))
`)

await sandbox.writeFile("/workspace/src/math.ts", `
export function add(a: number, b: number): number {
  return a + b
}
`)

await sandbox.writeFile("/workspace/package.json", JSON.stringify({
  name: "my-project",
  scripts: {
    build: "tsc",
    start: "node dist/index.js"
  }
}, null, 2))

await sandbox.writeFile("/workspace/tsconfig.json", JSON.stringify({
  compilerOptions: {
    target: "ES2020",
    module: "commonjs",
    outDir: "./dist",
    rootDir: "./src",
    strict: true
  }
}, null, 2))

// Build and run
await sandbox.exec("cd /workspace && npm install typescript")
await sandbox.exec("cd /workspace && npm run build")
const result = await sandbox.exec("cd /workspace && npm run start")
console.log(result.stdout) // "2 + 3 = 5"
```

---

## Handoffs

Transfer execution context between providers seamlessly.

### Why Handoffs?

- **Start local, scale to cloud**: Begin development locally, delegate heavy tasks to cloud
- **Provider flexibility**: Switch providers without losing state
- **Cost optimization**: Use cheaper providers for simple tasks, powerful ones for complex work

### Basic Handoff

```typescript
import { Fabric } from "fabric-ai-core"
import { DaytonaSandboxFactory } from "fabric-ai-daytona"
import { E2BSandboxFactory } from "fabric-ai-e2b"

// Set up Fabric with multiple providers
const fabric = new Fabric()
fabric.registerLocalFactory(new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!
}))
fabric.registerCloudFactory(new E2BSandboxFactory(process.env.E2B_API_KEY))

// Create a session starting locally
const session = await fabric.createSession({
  workspacePath: "/path/to/project",
  runtime: "local"
})

// Do some work
await session.exec("npm install")
await session.exec("npm test")

// Delegate to cloud for heavy computation
await session.delegateToCloud()
await session.exec("npm run build:production") // Runs in E2B

// Reclaim back to local
await session.reclaimToLocal()
console.log("Back to local execution!")

// Clean up
await session.stop()
```

### Manual Handoff with Snapshots

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"
import { E2BSandboxFactory } from "fabric-ai-e2b"

// Start with Daytona
const daytonaFactory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!
})
const daySandbox = await daytonaFactory.create({})

// Do work
await daySandbox.writeFile("/workspace/data.json", '{"count": 42}')
await daySandbox.exec("echo 'Processed' >> /workspace/log.txt")

// Capture state
const snapshot = await daySandbox.snapshot()
console.log(`Captured ${snapshot.files.length} files`)

// Stop Daytona sandbox
await daySandbox.stop()

// Restore in E2B
const e2bFactory = new E2BSandboxFactory(process.env.E2B_API_KEY)
const e2bSandbox = await e2bFactory.create({})
await e2bSandbox.restore(snapshot)

// Continue work - files are preserved!
const data = await e2bSandbox.readFile("/workspace/data.json")
console.log(data) // {"count": 42}

await e2bSandbox.stop()
```

### Handoff Events

```typescript
import { HandoffManager } from "fabric-ai-core"

const handoff = new HandoffManager()
handoff.registerFactory("daytona", daytonaFactory)
handoff.registerFactory("e2b", e2bFactory)

// Listen for handoff events
handoff.on((event) => {
  console.log(`[${event.type}] ${event.timestamp}`)
  if (event.details) {
    console.log("  Details:", event.details)
  }
})

// Perform handoff
const result = await handoff.delegate(daySandbox, "e2b")
if (result.success) {
  console.log("Handoff successful!")
  console.log("New sandbox:", result.newSandbox!.id)
}
```

---

## Running Claude Code in Sandboxes

Run Claude Code (the AI coding agent) inside sandboxes for autonomous coding tasks.

### With E2B (Pre-built Template)

```typescript
import { Sandbox } from "@e2b/code-interpreter"

// Create sandbox with Claude Code pre-installed
const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY,
  envs: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!
  }
})

// Give Claude a mission
const mission = "Create a TypeScript function that calculates fibonacci numbers"

const result = await sandbox.commands.run(
  `echo '${mission}' | claude -p --dangerously-skip-permissions`,
  { timeoutMs: 120_000 }
)

console.log("Claude's response:")
console.log(result.stdout)

// Check what Claude created
const files = await sandbox.files.list("/home/user")
console.log("Files created:", files.map(f => f.name))

await sandbox.kill()
```

### With Daytona

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({
  envVars: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!
  }
})

// Install Claude Code
await sandbox.exec("npm install -g @anthropic-ai/claude-code")

// Run Claude
const mission = "Build a REST API with Express"
const result = await sandbox.exec(
  `echo '${mission}' | claude -p --dangerously-skip-permissions`
)

console.log(result.stdout)
await sandbox.stop()
```

### Using the Fabric SDK

```typescript
import { Fabric } from "fabric-ai-core"
import { E2BSandboxFactory } from "fabric-ai-e2b"

const fabric = new Fabric()
fabric.registerCloudFactory(new E2BSandboxFactory(process.env.E2B_API_KEY))

const session = await fabric.createSession({
  workspacePath: "/tmp/project",
  runtime: "cloud",
  provider: {
    provider: "anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY!
  }
})

// Run Claude with automatic provider configuration
const result = await session.runClaude("Create a hello world script", {
  dangerouslySkipPermissions: true,
  timeoutMs: 60_000
})

console.log(result.output)
await session.stop()
```

---

## Next Steps

- **[Daytona Deep Dive](./daytona.md)** - Advanced Daytona features and network policies
- **[E2B Deep Dive](./e2b.md)** - Jupyter integration and Claude Code template
- **[exe.dev Deep Dive](./exe.md)** - Persistent VMs and pre-installed agents
- **[Examples](../examples/)** - Complete code samples

## Resources

- [API Reference](./README.md#api-reference)
- [GitHub Repository](https://github.com/arach/fabric)
- [Discord Community](https://discord.gg/fabric) (coming soon)

---

## Troubleshooting

### "No factory registered for runtime"

Make sure you've registered the factory before creating sessions:

```typescript
const fabric = new Fabric()
fabric.registerCloudFactory(e2bFactory) // Don't forget this!
```

### "API key not configured"

Check your environment variables:

```bash
echo $DAYTONA_API_KEY
echo $E2B_API_KEY
```

### "SSH connection failed" (exe.dev)

1. Verify your SSH key exists: `ls ~/.ssh/id_ed25519`
2. Re-authenticate: `ssh exe.dev`
3. Check SSH agent: `ssh-add -l`

### Sandbox timeout

Increase the timeout for long-running operations:

```typescript
// E2B
await sandbox.commands.run(cmd, { timeoutMs: 300_000 }) // 5 minutes

// Fabric session
await session.runClaude(prompt, { timeoutMs: 300_000 })
```

### Rate limits

Configure fallback providers:

```typescript
const session = await fabric.createSession({
  workspacePath: "/tmp/project",
  provider: { provider: "anthropic", apiKey: process.env.ANTHROPIC_API_KEY! },
  fallbackProviders: [
    { provider: "bedrock", region: "us-west-2", profile: "default" },
    { provider: "vertex", projectId: "my-project" }
  ]
})
```

## Local Container Runtime

> Run isolated Linux containers on macOS using Apple's Containerization framework (Virtualization.framework) — no cloud, no API keys.

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
Generated by [Dewey](https://github.com/arach/dewey) | Last updated: 2026-02-23