# Fabric

Lightweight sandboxes for agentic workloads. One interface, any runtime.

## Quick Start

```bash
git clone https://github.com/arach/fabric.git && cd fabric
bun run packages/cli/src/cli.ts setup
```

Run something:

```bash
fabric create --provider local
fabric exec "echo Hello from Fabric!"
fabric run --language typescript "console.log(2 + 2)"
fabric shell                      # interactive Linux shell
fabric list
fabric stop --id <sandbox-id>
```

## Cloud Providers

Set your key and use the same interface:

```bash
export DAYTONA_API_KEY=your_key
fabric create --provider daytona
fabric exec "echo Hello from the cloud!"
```

| Provider | Startup | Auth | Best for |
|----------|---------|------|----------|
| Local | ~1s | None | Development, offline |
| [Daytona](./docs/daytona.md) | ~2-3s | API Key | Enterprise, TypeScript |
| [E2B](./docs/e2b.md) | <200ms | API Key | Data science, Python |
| [exe.dev](./docs/exe.md) | ~2s | SSH Key | Persistent VMs |

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

## Project Config

Add a `.fabric` file to configure sandbox defaults per-project:

```bash
fabric init node     # create .fabric with node profile
```

```ini
# .fabric
profile: node
mount: ./data:/workspace/data
env: NODE_ENV=development
```

Profiles: `minimal` (alpine), `node` (node:22), `python` (python:3.12), `bun` (oven/bun). Config is discovered by walking up from the current directory.

## Handoff

Move work between runtimes without losing state:

```typescript
const snapshot = await localSandbox.snapshot()
await localSandbox.stop()

const cloudSandbox = await e2bFactory.create({})
await cloudSandbox.restore(snapshot)
```

## Development

```bash
git clone https://github.com/arach/fabric.git
cd fabric
bun run packages/cli/src/cli.ts setup
```

`fabric setup` handles everything: installs the Apple `container` CLI, downloads the Linux kernel, and pulls base images. Requires macOS + Apple Silicon.

```bash
bun test              # run tests
bun run dev           # start dev server
```

## License

MIT
