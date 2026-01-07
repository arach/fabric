/**
 * @fabric/runtime-e2b
 *
 * E2B cloud sandbox runtime adapter
 * https://e2b.dev
 */

import type {
  Runtime,
  RuntimeType,
  RuntimeStatus,
  Task,
  TaskResult,
  Sandbox as FabricSandbox,
  SandboxSnapshot,
  SandboxFactory,
} from "@fabric/core"

// Dynamic import type for E2B SDK
// The actual Sandbox type from @e2b/code-interpreter has runCode,
// but TypeScript inference sometimes misses it
type E2BSandboxType = Awaited<
  ReturnType<typeof import("@e2b/code-interpreter").Sandbox.create>
> & {
  runCode(code: string): Promise<{
    logs: { stdout: string[]; stderr: string[] }
    error?: unknown
  }>
}

// E2B file entry type
type E2BFileEntry = { name: string; type?: string }

// ============================================================================
// E2B Sandbox - Implements unified Sandbox interface
// ============================================================================

export class E2BSandbox implements FabricSandbox {
  readonly id: string
  readonly runtimeType: RuntimeType = "e2b"
  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private sandbox: E2BSandboxType | null = null
  private apiKey: string

  constructor(id: string, apiKey: string) {
    this.id = id
    this.apiKey = apiKey
  }

  get status() {
    return this._status
  }

  get ipAddress(): string | undefined {
    return undefined // E2B doesn't expose IPs directly
  }

  async start(): Promise<void> {
    try {
      const { Sandbox } = await import("@e2b/code-interpreter")
      this.sandbox = await Sandbox.create({
        apiKey: this.apiKey,
        metadata: { fabricId: this.id },
      })
      this._status = "running"
    } catch (error) {
      this._status = "error"
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.kill()
      this.sandbox = null
    }
    this._status = "stopped"
  }

  private ensureRunning(): E2BSandboxType {
    if (!this.sandbox || this._status !== "running") {
      throw new Error("Sandbox not running")
    }
    return this.sandbox
  }

  async exec(command: string): Promise<{
    stdout: string
    stderr: string
    exitCode: number
  }> {
    const sandbox = this.ensureRunning()
    const result = await sandbox.commands.run(command)
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    }
  }

  async runCode(
    code: string,
    language?: string
  ): Promise<{ output: string; error?: string }> {
    const sandbox = this.ensureRunning()
    const execution = await sandbox.runCode(code)

    // Handle error serialization - execution.error can be an object
    let errorStr: string | undefined
    if (execution.error) {
      if (typeof execution.error === "string") {
        errorStr = execution.error
      } else if (execution.error instanceof Error) {
        errorStr = execution.error.message
      } else if (typeof execution.error === "object") {
        // E2B may return error objects with name/value/traceback
        const err = execution.error as Record<string, unknown>
        errorStr = err.value
          ? String(err.value)
          : err.message
            ? String(err.message)
            : JSON.stringify(execution.error)
      } else {
        errorStr = String(execution.error)
      }
    } else if (execution.logs.stderr.length > 0) {
      errorStr = execution.logs.stderr.join("\n")
    }

    return {
      output: execution.logs.stdout.join("\n"),
      error: errorStr,
    }
  }

  async writeFile(path: string, content: string | Buffer): Promise<void> {
    const sandbox = this.ensureRunning()
    const data = typeof content === "string" ? content : content.toString("base64")
    await sandbox.files.write(path, data)
  }

  async readFile(path: string): Promise<string> {
    const sandbox = this.ensureRunning()
    return sandbox.files.read(path)
  }

  async listFiles(path: string): Promise<string[]> {
    const sandbox = this.ensureRunning()
    const files = await sandbox.files.list(path)
    return files.map((f) => f.name)
  }

  async snapshot(): Promise<SandboxSnapshot> {
    const sandbox = this.ensureRunning()

    // List all files in /home/user (default workspace)
    const collectFiles = async (
      dir: string
    ): Promise<SandboxSnapshot["files"]> => {
      const files: SandboxSnapshot["files"] = []
      try {
        const entries = await sandbox.files.list(dir)
        for (const entry of entries as E2BFileEntry[]) {
          const fullPath = `${dir}/${entry.name}`
          const isDir = entry.type === "dir" || entry.type === "directory"
          if (!isDir) {
            try {
              const content = await sandbox.files.read(fullPath)
              files.push({
                path: fullPath,
                content: Buffer.from(content).toString("base64"),
                encoding: "base64",
              })
            } catch {
              // Skip unreadable files
            }
          } else if (!entry.name.startsWith(".")) {
            const subFiles = await collectFiles(fullPath)
            files.push(...subFiles)
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
      }
      return files
    }

    const files = await collectFiles("/home/user")

    return {
      id: this.id,
      timestamp: new Date().toISOString(),
      workspacePath: "/home/user",
      files,
    }
  }

  async restore(snapshot: SandboxSnapshot): Promise<void> {
    const sandbox = this.ensureRunning()

    for (const file of snapshot.files) {
      const content =
        file.encoding === "base64"
          ? Buffer.from(file.content, "base64").toString()
          : file.content

      // Ensure parent directory exists
      const dir = file.path.substring(0, file.path.lastIndexOf("/"))
      if (dir) {
        await sandbox.commands.run(`mkdir -p ${dir}`)
      }

      await sandbox.files.write(file.path, content)
    }
  }

  async delegate(
    targetRuntime: RuntimeType
  ): Promise<{ token: string; snapshot: SandboxSnapshot }> {
    // Capture current state
    const snapshot = await this.snapshot()

    // Generate handoff token
    const token = `e2b:${this.id}:${Date.now()}`

    // Stop this sandbox (delegate means we're handing off)
    await this.stop()

    return { token, snapshot }
  }

  async reclaim(token: string, snapshot: SandboxSnapshot): Promise<void> {
    // Start sandbox if not running
    if (this._status !== "running") {
      await this.start()
    }

    // Restore from snapshot
    await this.restore(snapshot)
  }
}

// ============================================================================
// E2B Sandbox Factory
// ============================================================================

export class E2BSandboxFactory implements SandboxFactory {
  private apiKey: string
  private sandboxes = new Map<string, E2BSandbox>()

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY || ""
  }

  async create(options: {
    id?: string
    image?: string
    workspacePath?: string
  }): Promise<FabricSandbox> {
    if (!this.apiKey) {
      throw new Error("E2B_API_KEY not configured")
    }

    const id = options.id || `e2b-${Date.now()}`
    const sandbox = new E2BSandbox(id, this.apiKey)
    await sandbox.start()

    this.sandboxes.set(id, sandbox)
    return sandbox
  }

  async resume(id: string): Promise<FabricSandbox | null> {
    return this.sandboxes.get(id) || null
  }

  async list(): Promise<{ id: string; status: string }[]> {
    return Array.from(this.sandboxes.entries()).map(([id, sandbox]) => ({
      id,
      status: sandbox.status,
    }))
  }
}

// ============================================================================
// E2B Runtime (Legacy API - implements Runtime interface)
// ============================================================================

export class E2BRuntime implements Runtime {
  type: RuntimeType = "e2b"

  private apiKey: string | undefined
  private factory: E2BSandboxFactory

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY
    this.factory = new E2BSandboxFactory(this.apiKey)
  }

  get sandboxFactory(): E2BSandboxFactory {
    return this.factory
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey
  }

  async healthCheck(): Promise<RuntimeStatus> {
    if (!this.apiKey) {
      return {
        type: this.type,
        available: false,
        healthy: false,
        message: "E2B_API_KEY not configured",
      }
    }

    return {
      type: this.type,
      available: true,
      healthy: true,
      message: "E2B API key configured",
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    if (!this.apiKey) {
      return {
        taskId: task.id,
        status: "failed",
        error: "E2B_API_KEY not configured",
      }
    }

    const startTime = Date.now()

    try {
      const sandbox = await this.factory.create({ id: task.id })

      try {
        if (task.code) {
          const result = await sandbox.runCode!(task.code)
          return {
            taskId: task.id,
            status: result.error ? "failed" : "completed",
            output: result.output,
            error: result.error,
            exitCode: result.error ? 1 : 0,
            duration: Date.now() - startTime,
          }
        } else if (task.command) {
          const result = await sandbox.exec(task.command)
          return {
            taskId: task.id,
            status: result.exitCode === 0 ? "completed" : "failed",
            output: result.stdout,
            error: result.stderr || undefined,
            exitCode: result.exitCode,
            duration: Date.now() - startTime,
          }
        }

        return {
          taskId: task.id,
          status: "failed",
          error: "No code or command provided",
          duration: Date.now() - startTime,
        }
      } finally {
        await sandbox.stop()
      }
    } catch (error) {
      return {
        taskId: task.id,
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      }
    }
  }

  async cancel(taskId: string): Promise<void> {
    const sandbox = await this.factory.resume(taskId)
    if (sandbox) {
      await sandbox.stop()
    }
  }

  async getStatus(taskId: string): Promise<Task | null> {
    return null
  }
}

export const e2b = new E2BRuntime()
export const e2bFactory = new E2BSandboxFactory()
