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
