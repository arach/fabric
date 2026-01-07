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
