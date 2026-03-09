---
title: Architecture
description: Fabric project structure, runtime adapters, and how components connect.
order: 4
---

# Architecture

## Project Structure

```
fabric/
├── packages/
│   ├── cli/                 # CLI entry point
│   │   └── src/cli.ts       # All commands, .fabric config, provider resolution
│   ├── core/                # Shared interfaces
│   │   └── src/index.ts     # Sandbox, Runtime, Task, SandboxFactory types
│   ├── runtime-local/       # Local container runtime
│   │   └── src/index.ts     # SubprocessRuntime, ContainerRuntime, LocalContainerSandbox
│   ├── runtime-daytona/     # Daytona cloud adapter
│   │   └── src/index.ts     # DaytonaSandbox, DaytonaSandboxFactory
│   ├── runtime-e2b/         # E2B cloud adapter
│   │   └── src/index.ts     # E2BSandbox, E2BSandboxFactory
│   ├── runtime-exe/         # exe.dev adapter
│   │   └── src/index.ts     # ExeSandbox, ExeSandboxFactory
│   └── server/              # HTTP API server
│       └── src/index.ts     # REST endpoints for task submission
├── landing/                 # Website (React + Vite)
│   ├── App.tsx              # Landing page
│   └── pages/DocsPage.tsx   # Documentation (inline markdown)
├── docs/                    # Markdown docs (consumed by Dewey)
├── dewey.config.ts          # Dewey agent configuration
├── .fabric                  # Example project config
└── CLAUDE.md                # Agent instructions
```

## Runtime Adapter Pattern

Every provider implements the same `Sandbox` interface from `fabric-ai-core`:

```
                    ┌──────────────────┐
                    │  fabric-ai-core  │
                    │  Sandbox iface   │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────┴─────┐    ┌──────┴──────┐    ┌──────┴──────┐
    │   Local    │    │   Daytona   │    │    E2B      │
    │ container  │    │   @daytona  │    │  @e2b/sdk   │
    │   CLI      │    │     SDK     │    │             │
    └───────────┘    └─────────────┘    └─────────────┘
```

Each adapter:
1. Implements `SandboxFactory` — `create()`, `resume()`, `list()`
2. Returns a `Sandbox` — `exec()`, `runCode()`, `writeFile()`, `readFile()`, `snapshot()`, `restore()`, `stop()`
3. Handles provider-specific auth and lifecycle

## CLI Flow

```
User runs: fabric exec "echo hello"
  │
  ├── Parse args (parseArgs from node:util)
  ├── Load .fabric config (walk up directories)
  ├── Merge with profile defaults if specified
  ├── Resolve provider → SandboxFactory
  ├── factory.create() → Sandbox
  ├── sandbox.exec(command)
  ├── Print output
  └── sandbox.stop()
```

## .fabric Config Resolution

1. Start from `process.cwd()`
2. Walk up directories looking for `.fabric` file (max 10 levels)
3. Parse key:value format
4. If `profile:` is set, load profile defaults and merge
5. Config values override profile; `mount:` and `env:` are additive

## Local Container Lifecycle

```
fabric shell
  │
  ├── Resolve image alias ("omarchy" → "lopsided/archlinux:latest")
  ├── Build args: container run -it --rm [mounts] [env] image sh
  ├── spawnSync with stdio: "inherit" (interactive TTY)
  └── Container cleaned up on exit (--rm)

fabric exec "command"
  │
  ├── LocalContainerSandboxFactory.create()
  │   ├── container run -d (detached)
  │   ├── Mount workspace directory
  │   └── Return sandbox with containerId
  ├── sandbox.exec("command")
  │   └── container exec containerId sh -c "command"
  ├── Print stdout
  └── sandbox.stop()
      ├── container stop containerId
      └── container rm containerId
```

## Snapshot / Handoff

```
Local Sandbox                     Cloud Sandbox
     │                                 │
     ├── snapshot()                     │
     │   ├── Read all files             │
     │   ├── Base64 encode              │
     │   └── Return SandboxSnapshot     │
     │         │                        │
     ├── stop()                         │
     │                                  │
     │   ──── SandboxSnapshot ────────► │
     │                                  ├── restore(snapshot)
     │                                  │   ├── Decode files
     │                                  │   └── Write to workspace
     │                                  ├── exec("continue work")
     │                                  └── stop()
```
