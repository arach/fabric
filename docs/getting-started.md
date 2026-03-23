---
title: Getting Started
description: Run Linux containers on your Mac in under 2 minutes. No Docker, no API keys.
order: 2
---

# Getting Started

Fabric runs Linux containers natively on your Mac using Apple's Virtualization framework. No Docker, no API keys, no cloud account needed.

## Install

```bash
npx @fabric-ai/cli setup
```

`fabric setup` installs the Apple `container` CLI, downloads the Linux kernel, builds default images, and writes `~/.fabric/images.json` so images are discoverable from any directory. Requires macOS 26+ on Apple Silicon.

## Your First Container

```bash
fabric shell
```

That's it. You're in a real Linux environment running natively on Apple Silicon. Exit with `exit` or Ctrl+D — the container is cleaned up automatically.

Try a different image:

```bash
fabric shell --image alpine       # Alpine Linux
fabric shell --image node:22      # Node.js 22
fabric shell --image python:3.12  # Python 3.12
```

Any OCI-compatible arm64 image works: `fabric shell --image nginx:latest`

## Run Commands

Run a command without dropping into a shell:

```bash
fabric exec "echo 'Hello from Fabric!'"
fabric exec "node --version"
fabric exec "python3 -c 'print(2 + 2)'"
```

Or run code directly:

```bash
fabric run --language typescript "console.log('Hello!')"
fabric run --language python "print(2 + 2)"
```

## Use the SDK

Install the core package:

```bash
npm install fabric-ai-core
```

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"

const factory = new LocalContainerSandboxFactory()
const sandbox = await factory.create({ image: "alpine:latest" })

const result = await sandbox.exec("uname -a")
console.log(result.stdout) // Linux ... aarch64

await sandbox.stop()
```

### File Operations

```typescript
// Write a file into the sandbox
await sandbox.writeFile("/workspace/hello.ts", `
export function greet(name: string): string {
  return \`Hello, \${name}!\`
}
`)

// Read it back
const content = await sandbox.readFile("/workspace/hello.ts")
console.log(content)

// List files
const files = await sandbox.listFiles("/workspace")
console.log(files) // ["hello.ts", ...]
```

### Run Code

```typescript
const result = await sandbox.runCode(`
  const greeting = "Hello from TypeScript!"
  console.log(greeting)
`, "typescript")
console.log(result.output)
```

## Available Images

List what's available:

```bash
fabric images
```

### Fabric Images (built from manifest)

| Name | Tag | Description |
|------|-----|-------------|
| base | fabric-base:latest | Alpine + bash, git, curl, ssh, jq (32 MB) |
| ubuntu | fabric-ubuntu:latest | Ubuntu 24.04 + dev tools (200 MB) |
| ocr | fabric-ocr:local | OCR pipeline (tesseract + poppler) |
| diarize | fabric-diarize:local | Speaker diarization (pyannote 3.3.2) |

Build them with:

```bash
fabric build base          # Build one image
fabric build --all         # Build everything
fabric build diarize       # Auto-resolves HF_TOKEN from ~/.cache/huggingface/token
```

### Third-party Aliases

| Name | Image | Description |
|------|-------|-------------|
| alpine / bare | alpine:latest | Alpine Linux (minimal) |
| omarchy / arch | lopsided/archlinux:latest | Arch Linux (arm64) |
| debian | debian:latest | Debian |
| fedora | fedora:latest | Fedora |
| bun | oven/bun:latest | Bun runtime |
| node | node:22 | Node.js 22 |
| python | python:3.12 | Python 3.12 |

### Build from a Shared Recipe

Images can be shared as refs — lightweight JSON recipes hosted at fab.run:

```bash
fabric build --ref=a24e29dd    # Fetches recipe, downloads repo, builds locally
```

Use `ref:ID` in `.fabric` configs to auto-resolve:

```bash
image: ref:a24e29dd
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
# image: ref:a24e29dd    # or use a fab.run recipe ref
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

## Scale to the Cloud

Everything above runs locally. When you need more — team sharing, persistent VMs, faster cold starts — Fabric uses the same interface with cloud providers. No code changes.

```bash
export DAYTONA_API_KEY=your_key
fabric create --provider daytona
fabric exec "echo 'Same commands, cloud sandbox'"
```

| Provider | Startup | Auth | Best for |
|----------|---------|------|----------|
| **Local** | ~1s | None | Development, offline, free |
| **Daytona** | ~2-3s | API Key | Enterprise, TypeScript, network policies |
| **E2B** | <200ms | API Key | Data science, Python, Jupyter |
| **exe.dev** | ~2s | SSH Key | Persistent VMs, full root access |

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

### Cloud SDK

```bash
npm install fabric-ai-daytona fabric-ai-e2b fabric-ai-exe
```

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY,
  defaultLanguage: "typescript",
})

const sandbox = await factory.create({})
const result = await sandbox.exec("echo 'Hello from Daytona!'")
console.log(result.stdout)
await sandbox.stop()
```

### Handoffs

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

## Running Claude Code

Run [Claude Code](https://docs.anthropic.com/en/docs/claude-code) inside Fabric sandboxes for autonomous development:

```bash
fabric create --provider local
fabric exec "npm install -g @anthropic-ai/claude-code"
fabric exec "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY echo 'Build a REST API' | claude -p"
```

Or via E2B's pre-built template:

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

## CLI Reference

| Command | Description |
|---------|-------------|
| `fabric setup` | Install everything (container CLI, kernel, images) |
| `fabric init` | Create a `.fabric` config for this project |
| `fabric build` | Build container images from manifest |
| `fabric images` | List available container images |
| `fabric publish` | Generate shareable recipe refs for fab.run |
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
