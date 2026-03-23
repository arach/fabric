# Fabric

Ambient compute fabric - run agentic workloads across local and cloud runtimes.

## Vision

Compute that follows you. Work starts anywhere, runs wherever it can, context persists always.

```
┌─────────────────────────────────────────────────────────────┐
│                     Context Layer                            │
│         (conversation, agent state, checkpoints)             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    iPhone    │      │     Mac      │      │    Cloud     │
│   (capture)  │ ───▶ │   (local)    │ ───▶ │  (E2B/Modal) │
└──────────────┘      └──────────────┘      └──────────────┘
                              │
                    Context preserved
                    across all runtimes
```

## Architecture

```
packages/
├── core/           # Task, Context, Runtime interfaces, Orchestrator
├── runtime-local/  # Mac execution (subprocess, future: containers)
├── runtime-e2b/    # E2B sandbox adapter
├── runtime-modal/  # Modal serverless adapter
└── server/         # HTTP API that clients (Talkie) talk to
```

## Build & Run

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test
```

## API

```bash
# Submit a task
curl -X POST http://localhost:8765/task \
  -H "Content-Type: application/json" \
  -d '{
    "type": "code-execution",
    "code": "console.log(\"Hello from Fabric!\")",
    "runtime": "auto"
  }'

# Get task status
curl http://localhost:8765/task/{taskId}

# List available runtimes
curl http://localhost:8765/runtimes
```

## Key Concepts

- **Task**: Unit of work with inputs, outputs, and runtime requirements
- **Context**: Serializable state that can be checkpointed and resumed
- **Runtime**: Execution environment (local subprocess, E2B, Modal)
- **Orchestrator**: Routes tasks to runtimes based on availability and cost

## Image Registry

Fabric images are declared in `images/fabric-images.json` (the manifest). The CLI discovers images through a cascade:

1. **Project manifest** — `{gitRoot}/images/fabric-images.json`
2. **Global manifest** — `~/.fabric/images.json` (written by `fabric setup`)
3. **Third-party aliases** — built-in map (alpine, node, python, bun, etc.)
4. **URL refs** — `fab.run/r/{id}.json` via `--ref` flag
5. **Literal OCI ref** — pass-through to `container` CLI

```bash
fabric images              # List available images
fabric build [name]        # Build from manifest (--all, --no-cache, --build-arg)
fabric build --ref=ID      # Build from a fab.run recipe ref
fabric publish             # Generate ref files for fab.run
```

Image definitions live in `images/` with Dockerfiles. Build args (including secrets) are declared in the manifest with `source: "file"` or `source: "env"` resolution.

## Runtimes

| Runtime | Status | Notes |
|---------|--------|-------|
| `local-subprocess` | ✅ Ready | Direct host execution |
| `local-container` | ✅ Ready | Apple Virtualization.framework |
| `e2b` | ❌ Not configured | Needs `E2B_API_KEY` |
| `modal` | ❌ Not configured | Needs `MODAL_TOKEN_ID` + `MODAL_TOKEN_SECRET` |

### Container Runtime Notes

- Uses Apple's Containerization framework (Virtualization.framework)
- Runs Linux containers in lightweight VMs
- Image references are auto-normalized (`alpine` → `docker.io/library/alpine`)
- First run may be slower (image pull + VM startup)

**Manual testing:**
```bash
./scripts/run-container.sh "echo hello"
./scripts/run-container.sh --image oven/bun:latest "bun --version"
```

## Development

- TypeScript + Bun
- Monorepo with workspaces
- Runtime adapters implement common interface
- Swift (FabricContainer) for Apple Virtualization.framework
