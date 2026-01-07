# Fabric

Ambient compute fabric for Claude Code agents. Run agentic workloads across local and cloud runtimes with seamless handoff.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Overview

Fabric provides a unified interface for running Claude Code agents in isolated sandboxes. Work starts anywhere, runs wherever it can, context persists always.

```
┌─────────────────────────────────────────────────────────────┐
│                     Context Layer                            │
│         (conversation, agent state, checkpoints)             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Daytona    │      │     E2B      │      │    Local     │
│   (cloud)    │ ◀──▶ │   (cloud)    │ ◀──▶ │ (container)  │
└──────────────┘      └──────────────┘      └──────────────┘
```

## Quick Start

### With Daytona

```bash
npm install @fabric/core @fabric/runtime-daytona
```

```typescript
import { DaytonaSandboxFactory } from "@fabric/runtime-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({})

// Run TypeScript code
const result = await sandbox.runCode(`
  console.log("Hello from Daytona!")
`)
console.log(result.output)

await sandbox.stop()
```

### With E2B

```bash
npm install @fabric/core @fabric/runtime-e2b
```

```typescript
import { E2BSandboxFactory } from "@fabric/runtime-e2b"

const factory = new E2BSandboxFactory(process.env.E2B_API_KEY)

const sandbox = await factory.create({})

// Run Python code
const result = await sandbox.runCode(`
print("Hello from E2B!")
`)
console.log(result.output)

await sandbox.stop()
```

## Providers

| Provider | Languages | Network | Claude Code | Best For |
|----------|-----------|---------|-------------|----------|
| **[Daytona](./docs/daytona.md)** | TS, Python, Go, Rust, JS | Secure allowlist | npm install | Enterprise, TypeScript |
| **[E2B](./docs/e2b.md)** | Python, JS | Full access | Pre-built template | Data science, Python |
| Local | Any | Full access | Manual | Development |

## Features

- **Unified Interface** - Same API across all providers
- **Multi-Language** - TypeScript, Python, Go, Rust, JavaScript
- **Snapshots** - Capture and restore sandbox state
- **Handoff** - Delegate execution between runtimes
- **Claude Code Ready** - Run AI agents in isolated environments

## Documentation

- [Getting Started](./docs/README.md)
- [Daytona Guide](./docs/daytona.md)
- [E2B Guide](./docs/e2b.md)

## Environment Variables

```bash
# Daytona
DAYTONA_API_KEY=your_daytona_api_key

# E2B
E2B_API_KEY=your_e2b_api_key

# Claude (required for Claude Code)
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Running Claude Code

### In Daytona

```typescript
const sandbox = await daytona.create({ language: "typescript" })

await sandbox.process.executeCommand("npm install -g @anthropic-ai/claude-code")

const result = await sandbox.process.executeCommand(
  `export ANTHROPIC_API_KEY=${apiKey} && echo 'Build a REST API' | claude -p --dangerously-skip-permissions`
)
```

### In E2B

```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create("anthropic-claude-code", {
  envs: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
})

const result = await sandbox.commands.run(
  `echo 'Build a REST API' | claude -p --dangerously-skip-permissions`
)
```

## Architecture

```
packages/
├── core/              # Task, Context, Sandbox interfaces
├── runtime-daytona/   # Daytona cloud sandbox adapter
├── runtime-e2b/       # E2B code interpreter adapter
├── runtime-local/     # Local container runtime
└── server/            # HTTP API server

docs/                  # Documentation
examples/              # Example scripts
landing/               # Marketing website
```

## Development

```bash
# Install dependencies
bun install

# Run examples
bun run examples/daytona-sandbox.ts
bun run examples/unified-sandbox.ts

# Run tests
bun test
```

## License

MIT
