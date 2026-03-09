# Fabric — Agent Context

Lightweight sandboxes for agentic workloads. One Sandbox interface across local + cloud.

## Providers

| Provider | Package | Auth | Startup |
|----------|---------|------|---------|
| local | @fabric/runtime-local | None | ~1s |
| daytona | fabric-ai-daytona | DAYTONA_API_KEY | ~2-3s |
| e2b | fabric-ai-e2b | E2B_API_KEY | <200ms |
| exe | fabric-ai-exe | SSH key | ~2s |

## Sandbox Interface

All providers: `exec(cmd)`, `runCode(code, lang)`, `writeFile(path, content)`, `readFile(path)`, `listFiles(path)`, `snapshot()`, `restore(snapshot)`, `stop()`

## Entry Points

| Area | File |
|------|------|
| CLI | `packages/cli/src/cli.ts` |
| Core types | `packages/core/src/index.ts` |
| Local runtime | `packages/runtime-local/src/index.ts` |
| Daytona | `packages/runtime-daytona/src/index.ts` |
| E2B | `packages/runtime-e2b/src/index.ts` |
| exe.dev | `packages/runtime-exe/src/index.ts` |

## .fabric Config

Per-project config. Key:value format. Profiles: minimal, node, python, bun. Walks up directories.

| Key | Values |
|-----|--------|
| provider | local, daytona, e2b, exe |
| image | Any OCI image |
| profile | minimal, node, python, bun |
| mount | source:dest[:ro] (repeatable) |
| env | KEY=value (repeatable) |

## Critical Rules

- Always `sandbox.stop()` in finally blocks
- Local requires macOS 26+ Apple Silicon
- Cloud requires API keys
- Uses bun, not npm/pnpm
- Apple `container` CLI for local (not Docker)
