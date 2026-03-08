---
title: Getting Started
description: Get Fabric running in under a minute.
order: 2
---

# Getting Started

## Install

```bash
npm install -g fabric-ai
```

## Set up a provider

Pick one and set the env var:

```bash
export DAYTONA_API_KEY=your_key    # from app.daytona.io
# or
export E2B_API_KEY=your_key        # from e2b.dev/dashboard
# or
ssh exe.dev                        # registers your SSH key
```

Check your config:

```bash
fabric config
```

## Use it

### CLI

```bash
fabric create --provider daytona
fabric exec "echo hello"
fabric run --language python "print(2 + 2)"
fabric list
fabric stop --id <sandbox-id>
```

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

## Run Claude Code in a sandbox

```typescript
const sandbox = await factory.create({})

await sandbox.exec("npm install -g @anthropic-ai/claude-code")

const result = await sandbox.exec(
  `ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY} echo 'Build a REST API' | claude -p --dangerously-skip-permissions`
)

console.log(result.stdout)
await sandbox.stop()
```

## Next steps

- [Daytona guide](./daytona.md) — network policies, multi-language support
- [E2B guide](./e2b.md) — pre-built Claude Code template, Jupyter
- [exe.dev guide](./exe.md) — persistent VMs, pre-installed agents
- [Local containers](./local-container.md) — Apple Virtualization.framework, no cloud needed
