# Fabric

Run Linux containers and cloud sandboxes from your Mac. One interface, any runtime.

## Quick Start

```bash
git clone https://github.com/arach/fabric.git && cd fabric
bun run packages/cli/src/cli.ts setup
```

Drop into a Linux shell:

```bash
fabric shell                      # Ubuntu (default)
fabric shell --image omarchy      # Arch Linux
fabric shell --image alpine       # Alpine
```

Run sandboxes across providers:

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
| Local | ~1s | None | Development, offline, exploring Linux |
| [Daytona](./docs/daytona.md) | ~2-3s | API Key | Enterprise, TypeScript |
| [E2B](./docs/e2b.md) | <200ms | API Key | Data science, Python |
| [exe.dev](./docs/exe.md) | ~2s | SSH Key | Full control, persistent VMs |

## Local Containers

Powered by the Apple `container` CLI and Virtualization.framework. No Docker, no entitlements, no code signing — just `brew install container`.

```bash
# Interactive shells
fabric shell --image ubuntu
fabric shell --image omarchy

# Available images
fabric shell --image alpine      # Alpine Linux
fabric shell --image debian      # Debian
fabric shell --image fedora      # Fedora
fabric shell --image bun         # Bun runtime
fabric shell --image node        # Node.js 22
fabric shell --image python      # Python 3.12
fabric shell --image nginx:latest  # Any OCI image
```

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

`fabric setup` handles everything: installs Bun, project deps, the Apple `container` CLI, downloads the Linux kernel, and pre-pulls base images. Requires macOS + Apple Silicon.

```bash
bun test              # run tests
bun run dev           # start dev server
```

## License

MIT
