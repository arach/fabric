---
title: API Reference
description: TypeScript interfaces for the Fabric SDK.
order: 5
---

# API Reference

## Sandbox

The main interface for interacting with a sandbox. All providers implement this.

```typescript
interface Sandbox {
  readonly id: string
  readonly runtimeType: "daytona" | "e2b" | "exe" | "local-container"
  readonly status: "starting" | "running" | "stopped" | "error"

  exec(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>
  runCode(code: string, language?: string): Promise<{ output: string; error?: string }>
  writeFile(path: string, content: string | Buffer): Promise<void>
  readFile(path: string): Promise<string>
  listFiles(path: string): Promise<string[]>
  snapshot(): Promise<SandboxSnapshot>
  restore(snapshot: SandboxSnapshot): Promise<void>
  stop(): Promise<void>
}
```

**File:** `packages/core/src/index.ts`

## SandboxFactory

Creates and manages sandboxes for a specific provider.

```typescript
interface SandboxFactory {
  create(options?: {
    id?: string
    image?: string
    workspacePath?: string
    mounts?: MountSpec[]
  }): Promise<Sandbox>

  resume(id: string): Promise<Sandbox | null>
  list(): Promise<Array<{ id: string; status: string }>>
}
```

**File:** `packages/core/src/index.ts`

## SandboxSnapshot

Serializable capture of workspace state for handoff between runtimes.

```typescript
interface SandboxSnapshot {
  id: string
  timestamp: string
  workspacePath: string
  files: Array<{
    path: string
    content: string
    encoding: "base64" | "utf8"
  }>
}
```

## MountSpec

Volume mount specification for containers.

```typescript
interface MountSpec {
  source: string       // Host path
  destination: string  // Container path
  readOnly?: boolean
}
```

## Runtime

Low-level execution interface (used internally by adapters).

```typescript
interface Runtime {
  type: RuntimeType
  isAvailable(): Promise<boolean>
  healthCheck(): Promise<RuntimeStatus>
  execute(task: Task): Promise<TaskResult>
  cancel(taskId: string): Promise<void>
  getStatus(taskId: string): Promise<Task | null>
}
```

## RuntimeStatus

```typescript
interface RuntimeStatus {
  type: RuntimeType
  available: boolean
  healthy: boolean
  message: string
}
```

## Task / TaskResult

```typescript
interface Task {
  id: string
  command?: string
  code?: string
  workingDirectory?: string
  env?: Record<string, string>
  mounts?: MountSpec[]
}

interface TaskResult {
  taskId: string
  status: "completed" | "failed"
  output?: string
  error?: string
  exitCode?: number
  duration: number
}
```

## Provider Constructors

### Local

```typescript
import { LocalContainerSandboxFactory } from "@fabric/runtime-local"

new LocalContainerSandboxFactory({ containerCli?: string })
```

### Daytona

```typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

new DaytonaSandboxFactory({
  apiKey: string,
  defaultLanguage?: string,
  apiUrl?: string,
})
```

### E2B

```typescript
import { E2BSandboxFactory } from "fabric-ai-e2b"

new E2BSandboxFactory(apiKey: string, template?: string)
```

### exe.dev

```typescript
import { ExeSandboxFactory } from "fabric-ai-exe"

new ExeSandboxFactory({ sshKeyPath?: string })
```

## .fabric Config (CLI)

```typescript
interface FabricConfig {
  provider?: "local" | "daytona" | "e2b" | "exe"
  image?: string
  profile?: "minimal" | "node" | "python" | "bun"
  mounts?: string[]    // "source:dest[:ro]"
  env?: string[]       // "KEY=value"
  network?: boolean
  cpus?: number
  memory?: string
}
```

**File:** `packages/cli/src/cli.ts`
