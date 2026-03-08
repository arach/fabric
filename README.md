# Fabric

Containers for agentic development. One interface, any runtime.

## Quick Start

```bash
npm install -g fabric-ai
```

Pick a provider and set your key:

```bash
# Daytona (enterprise, multi-language)
export DAYTONA_API_KEY=your_key

# E2B (fast startup, Python-first)
export E2B_API_KEY=your_key

# exe.dev (persistent VMs, SSH-based — no key needed)
ssh exe.dev
```

Run something:

```bash
fabric create --provider daytona
fabric exec "echo Hello from Fabric!"
fabric run --language typescript "console.log(2 + 2)"
fabric list
fabric stop --id <sandbox-id>
```

## SDK

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

Every provider implements the same `Sandbox` interface — `exec()`, `runCode()`, `writeFile()`, `readFile()`, `snapshot()`, `restore()`, and `delegate()`.

## Providers

| Provider | Startup | Auth | Best for |
|----------|---------|------|----------|
| [Daytona](./docs/daytona.md) | ~2-3s | API Key | Enterprise, TypeScript |
| [E2B](./docs/e2b.md) | <200ms | API Key | Data science, Python |
| [exe.dev](./docs/exe.md) | ~2s | SSH Key | Full control, persistent VMs |
| Local | ~1s | None | Development, offline |

## Handoff

Move work between runtimes without losing state:

```typescript
const snapshot = await localSandbox.snapshot()
await localSandbox.stop()

const cloudSandbox = await e2bFactory.create({})
await cloudSandbox.restore(snapshot)
```

## Documentation

- [Getting Started](./docs/getting-started.md)
- [Provider Guides](./docs/README.md)
- [Local Container Runtime](./docs/local-container.md)

## Development

```bash
git clone https://github.com/arach/fabric.git
cd fabric
bun install
bun run dev
```

## License

MIT
