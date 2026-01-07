# Fabric Documentation

Fabric is an ambient compute framework for running Claude Code agents across local and cloud runtimes. It provides a unified interface for executing code in isolated sandboxes with seamless handoff between providers.

## Table of Contents

- [Quick Start](#quick-start)
- [Providers](#providers)
  - [Daytona](#daytona)
  - [E2B](#e2b)
  - [Local Container](#local-container)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)

## Quick Start

```bash
# Install core and your preferred runtime
npm install @fabric/core @fabric/runtime-daytona
# or
npm install @fabric/core @fabric/runtime-e2b
```

```typescript
import { DaytonaSandboxFactory } from "@fabric/runtime-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({})

// Execute commands
const result = await sandbox.exec("echo 'Hello from Fabric!'")
console.log(result.stdout)

// Clean up
await sandbox.stop()
```

## Providers

Fabric supports multiple cloud sandbox providers through a unified interface.

### Daytona

[Daytona](https://daytona.io) provides enterprise-grade cloud sandboxes with secure network policies.

**Features:**
- Multi-language support (TypeScript, Python, Go, Rust, JavaScript)
- Enterprise network policies with allowlisted services
- Tier-based access control
- Pre-installed development tools

**Installation:**
```bash
npm install @fabric/runtime-daytona
```

**Configuration:**
```bash
DAYTONA_API_KEY=your_api_key
ANTHROPIC_API_KEY=your_anthropic_key
```

**Usage:**
```typescript
import { DaytonaSandboxFactory } from "@fabric/runtime-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({
  language: "typescript",
  envVars: { NODE_ENV: "production" }
})

// Run TypeScript code
const result = await sandbox.runCode(`
  console.log("Hello from Daytona!")
  console.log("2 + 2 =", 2 + 2)
`)
console.log(result.output)

await sandbox.stop()
```

**Network Access:**

Daytona sandboxes have tier-based network policies:

| Service | Tier 1/2 | Tier 3/4 |
|---------|----------|----------|
| api.anthropic.com | ✅ | ✅ |
| api.openai.com | ✅ | ✅ |
| github.com | ✅ | ✅ |
| registry.npmjs.org | ✅ | ✅ |
| pypi.org | ✅ | ✅ |
| Custom domains | ❌ | ✅ |

See [Daytona Network Documentation](https://www.daytona.io/docs/en/network-limits/) for details.

---

### E2B

[E2B](https://e2b.dev) provides fast-starting code interpreter sandboxes with full internet access.

**Features:**
- Sub-200ms sandbox startup
- Built-in Claude Code template
- Jupyter kernel support
- Full internet access (no restrictions)

**Installation:**
```bash
npm install @fabric/runtime-e2b
```

**Configuration:**
```bash
E2B_API_KEY=your_api_key
ANTHROPIC_API_KEY=your_anthropic_key
```

**Usage:**
```typescript
import { E2BSandboxFactory } from "@fabric/runtime-e2b"

const factory = new E2BSandboxFactory(process.env.E2B_API_KEY)

const sandbox = await factory.create({})

// Run Python code (E2B default)
const result = await sandbox.runCode(`
print("Hello from E2B!")
print("2 + 2 =", 2 + 2)
`)
console.log(result.output)

await sandbox.stop()
```

**Claude Code Template:**

E2B provides a pre-built template with Claude Code installed:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY,
  envs: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  }
})

const result = await sandbox.commands.run(
  `echo 'Create a hello world script' | claude -p --dangerously-skip-permissions`,
  { timeoutMs: 120_000 }
)

await sandbox.kill()
```

---

### Local Container

For local development, Fabric supports Apple's Containerization framework.

**Features:**
- No cloud dependency
- Fast local iteration
- Apple Silicon optimized

**Usage:**
```typescript
import { LocalContainerFactory } from "@fabric/runtime-local"

const factory = new LocalContainerFactory()
const sandbox = await factory.create({
  image: "alpine:latest"
})

await sandbox.exec("echo 'Hello from local container!'")
await sandbox.stop()
```

---

## Core Concepts

### Sandbox Interface

All providers implement the unified `Sandbox` interface:

```typescript
interface Sandbox {
  // Identity
  readonly id: string
  readonly runtimeType: RuntimeType
  readonly status: "starting" | "running" | "stopped" | "error"

  // Lifecycle
  start(): Promise<void>
  stop(): Promise<void>

  // Execution
  exec(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>
  runCode?(code: string, language?: string): Promise<{ output: string; error?: string }>

  // File System
  writeFile(path: string, content: string | Buffer): Promise<void>
  readFile(path: string): Promise<string>
  listFiles(path: string): Promise<string[]>

  // Checkpoint
  snapshot(): Promise<SandboxSnapshot>
  restore(snapshot: SandboxSnapshot): Promise<void>

  // Handoff
  delegate(targetRuntime: RuntimeType): Promise<{ token: string; snapshot: SandboxSnapshot }>
  reclaim(token: string, snapshot: SandboxSnapshot): Promise<void>
}
```

### Sandbox Factory

Each provider has a factory for creating sandboxes:

```typescript
interface SandboxFactory {
  create(options: CreateOptions): Promise<Sandbox>
  resume(id: string): Promise<Sandbox | null>
  list(): Promise<{ id: string; status: string }[]>
}
```

### Snapshots

Capture and restore sandbox state:

```typescript
// Capture current state
const snapshot = await sandbox.snapshot()
console.log(`Captured ${snapshot.files.length} files`)

// Later, restore the state
await sandbox.restore(snapshot)
```

### Handoff

Delegate execution between providers:

```typescript
// Delegate from local to cloud
const { token, snapshot } = await localSandbox.delegate("daytona")

// Create cloud sandbox and reclaim
const cloudSandbox = await daytonaFactory.create({})
await cloudSandbox.reclaim(token, snapshot)
```

---

## API Reference

### RuntimeType

```typescript
type RuntimeType =
  | "local-subprocess"
  | "local-container"
  | "e2b"
  | "daytona"
  | "modal"
```

### DaytonaSandboxFactory

```typescript
new DaytonaSandboxFactory(options: {
  apiKey: string
  apiUrl?: string
  defaultLanguage?: "python" | "typescript" | "javascript" | "go" | "rust"
})
```

### E2BSandboxFactory

```typescript
new E2BSandboxFactory(apiKey?: string)
```

### SandboxSnapshot

```typescript
interface SandboxSnapshot {
  id: string
  timestamp: string
  workspacePath: string
  files: {
    path: string
    content: string  // base64 encoded
    encoding: "base64" | "utf8"
  }[]
  metadata?: Record<string, unknown>
}
```

---

## Provider Comparison

| Feature | Daytona | E2B |
|---------|---------|-----|
| Default Language | TypeScript | Python |
| Startup Time | ~2-3s | <200ms |
| Network | Allowlist (enterprise) | Full access |
| Languages | TS, Python, Go, Rust, JS | Python, JS |
| Claude Template | npm install | Pre-built |
| Jupyter Kernel | No | Yes |
| Best For | Enterprise, TypeScript | Data science, Python |

---

## Examples

See the [examples](../examples/) directory for complete code samples:

- `daytona-sandbox.ts` - Basic Daytona usage
- `unified-sandbox.ts` - Test both providers
- `claude-in-sandbox.ts` - Run Claude Code in E2B

---

## Support

- GitHub Issues: [github.com/arach/fabric/issues](https://github.com/arach/fabric/issues)
- Documentation: [fabric.arach.dev](https://fabric.arach.dev)
