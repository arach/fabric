/**
 * @fabric/runtime-local
 *
 * Local execution runtime - subprocess and Apple containers
 */

import { spawn, spawnSync } from "bun"
import { dirname, join } from "path"
import { mkdir, readdir, readFile, writeFile } from "fs/promises"
import type {
  Runtime,
  RuntimeType,
  RuntimeStatus,
  Task,
  TaskResult,
  MountSpec,
  Sandbox,
  SandboxSnapshot,
  SandboxFactory,
} from "fabric-ai-core"

// ============================================================================
// Subprocess Runtime - Direct execution on host
// ============================================================================

export class SubprocessRuntime implements Runtime {
  type: RuntimeType = "local-subprocess"

  private processes = new Map<string, ReturnType<typeof spawn>>()

  async isAvailable(): Promise<boolean> {
    return true // Always available on the host
  }

  async healthCheck(): Promise<RuntimeStatus> {
    return {
      type: this.type,
      available: true,
      healthy: true,
      message: "Ready for subprocess execution",
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now()

    try {
      let command: string[]

      if (task.command) {
        command = ["sh", "-c", task.command]
      } else if (task.code) {
        // Execute code via bun
        command = ["bun", "-e", task.code]
      } else {
        throw new Error("No command or code provided")
      }

      const proc = spawn({
        cmd: command,
        cwd: task.workingDirectory || process.cwd(),
        env: { ...process.env, ...task.env },
        stdout: "pipe",
        stderr: "pipe",
      })

      this.processes.set(task.id, proc)

      // Collect output
      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      this.processes.delete(task.id)

      return {
        taskId: task.id,
        status: exitCode === 0 ? "completed" : "failed",
        output: stdout,
        error: stderr || undefined,
        exitCode,
        duration: Date.now() - startTime,
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
    const proc = this.processes.get(taskId)
    if (proc) {
      proc.kill()
      this.processes.delete(taskId)
    }
  }

  async getStatus(taskId: string): Promise<Task | null> {
    return null
  }
}

// ============================================================================
// Container Runtime - Apple `container` CLI
// ============================================================================

export class ContainerRuntime implements Runtime {
  type: RuntimeType = "local-container"

  private containerCli: string
  private runningContainers = new Map<string, string>() // taskId -> containerId

  constructor(containerCli?: string) {
    this.containerCli = containerCli || "container"
  }

  async isAvailable(): Promise<boolean> {
    try {
      const proc = spawnSync({
        cmd: [this.containerCli, "--version"],
        stdout: "pipe",
        stderr: "pipe",
      })
      return proc.exitCode === 0
    } catch {
      return false
    }
  }

  async healthCheck(): Promise<RuntimeStatus> {
    const available = await this.isAvailable()
    if (!available) {
      return {
        type: this.type,
        available: false,
        healthy: false,
        message: `Apple container CLI not found. Install with: brew install container`,
      }
    }

    return {
      type: this.type,
      available: true,
      healthy: true,
      message: "Container runtime ready (Apple container CLI)",
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now()

    let cmd: string
    if (task.command) {
      cmd = task.command
    } else if (task.code) {
      cmd = task.code
    } else {
      return {
        taskId: task.id,
        status: "failed",
        error: "No command or code provided",
        duration: Date.now() - startTime,
      }
    }

    const image = task.code ? "oven/bun:latest" : "alpine:latest"

    try {
      const args = [this.containerCli, "run", "--rm", "--progress", "none"]

      if (task.workingDirectory) {
        args.push("-w", task.workingDirectory)
      }

      if (task.env) {
        for (const [key, value] of Object.entries(task.env)) {
          args.push("-e", `${key}=${value}`)
        }
      }

      if (task.mounts) {
        for (const mount of task.mounts) {
          const mountStr = mount.readOnly
            ? `${mount.source}:${mount.destination}:ro`
            : `${mount.source}:${mount.destination}`
          args.push("-v", mountStr)
        }
      }

      args.push(image, "sh", "-c", cmd)

      const proc = spawn({
        cmd: args,
        stdout: "pipe",
        stderr: "pipe",
      })

      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      return {
        taskId: task.id,
        status: exitCode === 0 ? "completed" : "failed",
        output: stdout,
        error: stderr || undefined,
        exitCode,
        duration: Date.now() - startTime,
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
    const containerId = this.runningContainers.get(taskId)
    if (containerId) {
      spawnSync({
        cmd: [this.containerCli, "stop", containerId],
        stdout: "pipe",
        stderr: "pipe",
      })
      this.runningContainers.delete(taskId)
    }
  }

  async getStatus(taskId: string): Promise<Task | null> {
    return null
  }

  async listContainers(): Promise<string[]> {
    const proc = spawnSync({
      cmd: [this.containerCli, "list", "--quiet"],
      stdout: "pipe",
      stderr: "pipe",
    })
    if (proc.exitCode !== 0) return []
    return proc.stdout.toString().trim().split("\n").filter(Boolean)
  }

  async stopContainer(containerId: string): Promise<void> {
    spawnSync({
      cmd: [this.containerCli, "stop", containerId],
      stdout: "pipe",
      stderr: "pipe",
    })
  }
}

// ============================================================================
// Local Container Sandbox - Implements unified Sandbox interface
// Uses Apple `container` CLI for execution
// ============================================================================

export class LocalContainerSandbox implements Sandbox {
  readonly id: string
  readonly runtimeType: RuntimeType = "local-container"
  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private containerId: string | null = null
  private containerCli: string
  private workspacePath: string
  private image: string

  constructor(
    id: string,
    options: { workspacePath?: string; image?: string; containerCli?: string } = {}
  ) {
    this.id = id
    this.containerCli = options.containerCli || "container"
    this.workspacePath = options.workspacePath || `/tmp/fabric-sandbox-${id}`
    this.image = options.image || "oven/bun:latest"
  }

  get status() {
    return this._status
  }

  async start(): Promise<void> {
    try {
      await mkdir(this.workspacePath, { recursive: true })

      // Start a detached container with workspace mount
      const proc = spawn({
        cmd: [
          this.containerCli, "run",
          "-d",
          "--progress", "none",
          "-v", `${this.workspacePath}:/workspace`,
          "-w", "/workspace",
          this.image,
          "sleep", "infinity",
        ],
        stdout: "pipe",
        stderr: "pipe",
      })

      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      if (exitCode !== 0) {
        throw new Error(`Failed to start container: ${stderr}`)
      }

      this.containerId = stdout.trim()
      this._status = "running"
    } catch (error) {
      this._status = "error"
      throw error
    }
  }

  async stop(): Promise<void> {
    if (this.containerId) {
      spawnSync({
        cmd: [this.containerCli, "stop", this.containerId],
        stdout: "pipe",
        stderr: "pipe",
      })
      spawnSync({
        cmd: [this.containerCli, "rm", this.containerId],
        stdout: "pipe",
        stderr: "pipe",
      })
      this.containerId = null
    }
    this._status = "stopped"
  }

  async exec(command: string): Promise<{
    stdout: string
    stderr: string
    exitCode: number
  }> {
    if (!this.containerId) {
      throw new Error("Container not running")
    }

    const proc = spawn({
      cmd: [
        this.containerCli, "exec",
        this.containerId,
        "sh", "-c", command,
      ],
      stdout: "pipe",
      stderr: "pipe",
    })

    const stdout = await new Response(proc.stdout).text()
    const stderr = await new Response(proc.stderr).text()
    const exitCode = await proc.exited

    return { stdout, stderr, exitCode }
  }

  async runCode(
    code: string,
    language?: string
  ): Promise<{ output: string; error?: string }> {
    const ext = language === "python" ? ".py" : ".ts"
    const filename = `_run${ext}`
    const filePath = join(this.workspacePath, filename)

    await writeFile(filePath, code)

    const cmd = language === "python" ? `python ${filename}` : `bun ${filename}`
    const result = await this.exec(`cd /workspace && ${cmd}`)

    return {
      output: result.stdout,
      error: result.stderr || (result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : undefined),
    }
  }

  async writeFile(path: string, content: string | Buffer): Promise<void> {
    const fullPath = join(this.workspacePath, path)
    const dir = dirname(fullPath)
    await mkdir(dir, { recursive: true })
    await writeFile(fullPath, content)
  }

  async readFile(path: string): Promise<string> {
    const fullPath = join(this.workspacePath, path)
    return readFile(fullPath, "utf8")
  }

  async listFiles(path: string): Promise<string[]> {
    const fullPath = join(this.workspacePath, path)
    try {
      return readdir(fullPath)
    } catch {
      return []
    }
  }

  async snapshot(): Promise<SandboxSnapshot> {
    const files: { path: string; content: string; encoding: "base64" | "utf8" }[] = []
    const entries = await readdir(this.workspacePath, { recursive: true, withFileTypes: true } as any)

    for (const entry of entries) {
      if (!entry.isFile()) continue
      const relativePath = join(entry.parentPath || (entry as any).path || "", entry.name)
        .replace(this.workspacePath, "")
        .replace(/^\//, "")
      const content = await readFile(join(this.workspacePath, relativePath))
      files.push({
        path: relativePath,
        content: content.toString("base64"),
        encoding: "base64",
      })
    }

    return {
      id: this.id,
      timestamp: new Date().toISOString(),
      workspacePath: this.workspacePath,
      files,
    }
  }

  async restore(snapshot: SandboxSnapshot): Promise<void> {
    for (const file of snapshot.files) {
      const fullPath = join(this.workspacePath, file.path)
      await mkdir(dirname(fullPath), { recursive: true })
      const content = file.encoding === "base64"
        ? Buffer.from(file.content, "base64")
        : file.content
      await writeFile(fullPath, content)
    }
  }

  async delegate(
    targetRuntime: RuntimeType
  ): Promise<{ token: string; snapshot: SandboxSnapshot }> {
    const snapshot = await this.snapshot()
    const token = `local:${this.id}:${Date.now()}`
    await this.stop()
    return { token, snapshot }
  }

  async reclaim(token: string, snapshot: SandboxSnapshot): Promise<void> {
    if (this._status !== "running") {
      await this.start()
    }
    await this.restore(snapshot)
  }
}

// ============================================================================
// Local Container Sandbox Factory
// ============================================================================

export class LocalContainerSandboxFactory implements SandboxFactory {
  private containerCli: string
  private sandboxes = new Map<string, LocalContainerSandbox>()

  constructor(options?: { containerCli?: string }) {
    this.containerCli = options?.containerCli || "container"
  }

  async create(options: {
    id?: string
    image?: string
    workspacePath?: string
    mounts?: MountSpec[]
  }): Promise<Sandbox> {
    const id = options.id || `sandbox-${Date.now()}`
    const sandbox = new LocalContainerSandbox(id, {
      workspacePath: options.workspacePath,
      image: options.image,
      containerCli: this.containerCli,
    })
    await sandbox.start()
    this.sandboxes.set(id, sandbox)
    return sandbox
  }

  async resume(id: string): Promise<Sandbox | null> {
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
// Export default runtimes
// ============================================================================

export const subprocess = new SubprocessRuntime()
export const container = new ContainerRuntime()
export const localSandboxFactory = new LocalContainerSandboxFactory()
