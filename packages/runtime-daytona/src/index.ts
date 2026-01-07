/**
 * @fabric/runtime-daytona
 *
 * Daytona cloud sandbox adapter for Fabric
 */

import { Daytona, Sandbox as DaytonaSandboxSDK } from "@daytonaio/sdk"
import type {
  Sandbox,
  SandboxFactory,
  SandboxSnapshot,
  RuntimeType,
  MountSpec,
} from "@fabric/core"

// ============================================================================
// DaytonaSandbox - Implements Fabric's Sandbox interface
// ============================================================================

export class DaytonaSandbox implements Sandbox {
  readonly id: string
  readonly runtimeType: RuntimeType = "daytona"

  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private sandbox: DaytonaSandboxSDK

  constructor(sandbox: DaytonaSandboxSDK) {
    this.sandbox = sandbox
    this.id = sandbox.id
    this._status = "running"
  }

  get status() {
    return this._status
  }

  get ipAddress(): string | undefined {
    return undefined // Daytona doesn't expose IP directly
  }

  // Lifecycle
  async start(): Promise<void> {
    // Daytona sandboxes are started on creation
    this._status = "running"
  }

  async stop(): Promise<void> {
    await this.sandbox.delete()
    this._status = "stopped"
  }

  // Execution
  async exec(command: string): Promise<{
    stdout: string
    stderr: string
    exitCode: number
  }> {
    const result = await this.sandbox.process.executeCommand(command)
    return {
      stdout: result.result || "",
      stderr: "",
      exitCode: result.exitCode,
    }
  }

  async runCode(code: string, language?: string): Promise<{
    output: string
    error?: string
  }> {
    const result = await this.sandbox.process.codeRun(code)
    if (result.exitCode !== 0) {
      return {
        output: "",
        error: result.result || "Unknown error",
      }
    }
    return {
      output: result.result || "",
    }
  }

  // File System
  async writeFile(path: string, content: string | Buffer): Promise<void> {
    const buffer = typeof content === "string" ? Buffer.from(content) : content
    await this.sandbox.fs.uploadFile(buffer, path)
  }

  async readFile(path: string): Promise<string> {
    const buffer = await this.sandbox.fs.downloadFile(path)
    return buffer.toString("utf8")
  }

  async listFiles(path: string): Promise<string[]> {
    const files = await this.sandbox.fs.listFiles(path)
    return files.map((f) => f.name)
  }

  // Snapshot/Restore
  async snapshot(): Promise<SandboxSnapshot> {
    // Get list of files in workspace
    const files: SandboxSnapshot["files"] = []

    // Get files from /home/daytona (typical workspace)
    try {
      const fileList = await this.sandbox.fs.listFiles("/home/daytona")
      for (const file of fileList.slice(0, 50)) {
        // Limit to 50 files
        if (file.isDir) continue
        try {
          const buffer = await this.sandbox.fs.downloadFile(`/home/daytona/${file.name}`)
          files.push({
            path: `/home/daytona/${file.name}`,
            content: buffer.toString("base64"),
            encoding: "base64",
          })
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // Workspace might not exist
    }

    return {
      id: `snapshot-${this.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      workspacePath: "/home/daytona",
      files,
    }
  }

  async restore(snapshot: SandboxSnapshot): Promise<void> {
    for (const file of snapshot.files) {
      const content =
        file.encoding === "base64"
          ? Buffer.from(file.content, "base64").toString("utf8")
          : file.content
      await this.writeFile(file.path, content)
    }
  }

  // Handoff
  async delegate(targetRuntime: RuntimeType): Promise<{
    token: string
    snapshot: SandboxSnapshot
  }> {
    const snapshot = await this.snapshot()
    const token = `daytona-handoff-${this.id}-${Date.now()}`
    return { token, snapshot }
  }

  async reclaim(token: string, snapshot: SandboxSnapshot): Promise<void> {
    await this.restore(snapshot)
  }
}

// ============================================================================
// DaytonaSandboxFactory - Creates Daytona sandbox instances
// ============================================================================

export interface DaytonaSandboxFactoryOptions {
  apiKey: string
  apiUrl?: string
  defaultLanguage?: "python" | "typescript" | "javascript" | "go" | "rust"
}

export class DaytonaSandboxFactory implements SandboxFactory {
  private daytona: Daytona
  private options: DaytonaSandboxFactoryOptions
  private activeSandboxes: Map<string, DaytonaSandbox> = new Map()

  constructor(options: DaytonaSandboxFactoryOptions) {
    this.options = options
    this.daytona = new Daytona({
      apiKey: options.apiKey,
      apiUrl: options.apiUrl,
    })
  }

  async create(options: {
    id?: string
    image?: string
    workspacePath?: string
    mounts?: MountSpec[]
    language?: "python" | "typescript" | "javascript" | "go" | "rust"
    envVars?: Record<string, string>
  }): Promise<Sandbox> {
    const sandbox = await this.daytona.create({
      language: options.language || this.options.defaultLanguage || "typescript",
      envVars: options.envVars,
    })

    const fabricSandbox = new DaytonaSandbox(sandbox)
    this.activeSandboxes.set(fabricSandbox.id, fabricSandbox)

    return fabricSandbox
  }

  async resume(id: string): Promise<Sandbox | null> {
    // Check if we have it in memory
    const existing = this.activeSandboxes.get(id)
    if (existing) {
      return existing
    }

    // Daytona doesn't support resuming sandboxes by ID directly
    // This would require keeping track of sandbox IDs externally
    return null
  }

  async list(): Promise<{ id: string; status: string }[]> {
    return Array.from(this.activeSandboxes.entries()).map(([id, sandbox]) => ({
      id,
      status: sandbox.status,
    }))
  }
}

/**
 * Create a Daytona sandbox factory with the given options
 */
export function createDaytonaFactory(
  options: DaytonaSandboxFactoryOptions
): SandboxFactory {
  return new DaytonaSandboxFactory(options)
}
