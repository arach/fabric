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
// Container Runtime - Apple Containerization framework
// ============================================================================

export class ContainerRuntime implements Runtime {
  type: RuntimeType = "local-container"

  private binaryPath: string
  private _status: { kernelExists: boolean; kernelPath: string } | null = null

  constructor(binaryPath?: string) {
    // Default path relative to this package
    const packageDir = dirname(dirname(new URL(import.meta.url).pathname))
    this.binaryPath =
      binaryPath ||
      join(packageDir, "FabricContainer/.build/release/fabric-container")
  }

  private async getBinaryStatus(): Promise<{
    kernelExists: boolean
    kernelPath: string
    status: string
  }> {
    if (this._status) {
      return { ...this._status, status: "ready" }
    }

    try {
      const proc = spawnSync({
        cmd: [this.binaryPath, "status"],
        stdout: "pipe",
        stderr: "pipe",
      })

      if (proc.exitCode === 0) {
        const output = proc.stdout.toString()
        this._status = JSON.parse(output)
        return this._status as any
      }
    } catch {}

    return { kernelExists: false, kernelPath: "", status: "error" }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const file = Bun.file(this.binaryPath)
      if (!(await file.exists())) return false

      const status = await this.getBinaryStatus()
      return status.kernelExists
    } catch {
      return false
    }
  }

  async healthCheck(): Promise<RuntimeStatus> {
    // Check binary exists
    try {
      const file = Bun.file(this.binaryPath)
      if (!(await file.exists())) {
        return {
          type: this.type,
          available: false,
          healthy: false,
          message: `Binary not found at ${this.binaryPath}. Run 'swift build -c release' in FabricContainer/`,
        }
      }
    } catch {
      return {
        type: this.type,
        available: false,
        healthy: false,
        message: `Cannot access binary at ${this.binaryPath}`,
      }
    }

    // Check kernel
    const status = await this.getBinaryStatus()

    if (!status.kernelExists) {
      return {
        type: this.type,
        available: false,
        healthy: false,
        message: `Kernel not found at ${status.kernelPath}. Run setup script to download kernel.`,
      }
    }

    return {
      type: this.type,
      available: true,
      healthy: true,
      message: `Container runtime ready (kernel: ${status.kernelPath})`,
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now()

    // Build the command
    let cmd: string
    if (task.command) {
      cmd = task.command
    } else if (task.code) {
      // For code execution, we need to write it to a file or use echo
      // For now, assume it's shell code
      cmd = task.code
    } else {
      return {
        taskId: task.id,
        status: "failed",
        error: "No command or code provided",
        duration: Date.now() - startTime,
      }
    }

    // Normalize image reference to fully-qualified form
    const normalizeImage = (ref: string): string => {
      if (ref.includes(".")) return ref
      const parts = ref.split("/")
      if (parts.length === 1) return `docker.io/library/${ref}`
      return `docker.io/${ref}`
    }

    // Default to alpine for simple commands, bun for code
    const image = normalizeImage(
      task.code ? "oven/bun:latest" : "alpine:latest"
    )

    try {
      // Use 'script' to provide a PTY - required by Virtualization.framework
      const proc = spawn({
        cmd: [
          "script",
          "-q",
          "/dev/null",
          this.binaryPath,
          "run",
          "--image",
          image,
          "--cmd",
          cmd,
        ],
        stdout: "pipe",
        stderr: "pipe",
      })

      let stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

      // Clean up PTY control characters from script wrapper
      stdout = stdout
        .replace(/\^\[?D\\b\\b/g, "")  // Remove ^D and backspaces
        .replace(/\r\n/g, "\n")         // Normalize line endings
        .replace(/^\s+/, "")            // Trim leading whitespace

      // Parse output from fabric-container
      // It prints status messages, then "Exit code: N"
      const exitMatch = stdout.match(/Exit code: (\d+)/)
      const containerExitCode = exitMatch ? parseInt(exitMatch[1]) : exitCode

      return {
        taskId: task.id,
        status: containerExitCode === 0 ? "completed" : "failed",
        output: stdout,
        error: stderr || undefined,
        exitCode: containerExitCode,
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
    // TODO: Track running containers and stop them
  }

  async getStatus(taskId: string): Promise<Task | null> {
    return null
  }
}

// ============================================================================
// Container Daemon Runtime - Communicates via Unix socket
// ============================================================================

export class ContainerDaemonRuntime implements Runtime {
  type: RuntimeType = "local-container"

  private socketPath: string
  private binaryPath: string
  private kernelPath: string
  private serverProcess: ReturnType<typeof spawn> | null = null

  constructor(options?: {
    socketPath?: string
    binaryPath?: string
    kernelPath?: string
  }) {
    const packageDir = dirname(dirname(new URL(import.meta.url).pathname))
    this.socketPath = options?.socketPath || "/tmp/fabric-container.sock"
    this.binaryPath =
      options?.binaryPath ||
      join(packageDir, "FabricContainer/.build/release/fabric-container")
    this.kernelPath =
      options?.kernelPath || join(packageDir, "bin/vmlinux")
  }

  private async fetch(
    path: string,
    options?: { method?: string; body?: unknown }
  ): Promise<unknown> {
    const response = await fetch(`http://localhost${path}`, {
      method: options?.method || "GET",
      headers: options?.body ? { "Content-Type": "application/json" } : undefined,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      // @ts-ignore - Bun supports unix socket
      unix: this.socketPath,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error((error as { error: string }).error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async startServer(): Promise<void> {
    // Check if server is already running
    try {
      await this.fetch("/status")
      return // Server already running
    } catch {
      // Server not running, start it
    }

    // Start the server
    this.serverProcess = spawn({
      cmd: [
        this.binaryPath,
        "serve",
        "--socket",
        this.socketPath,
        "--kernel",
        this.kernelPath,
      ],
      stdout: "pipe",
      stderr: "pipe",
    })

    // Wait for server to be ready
    for (let i = 0; i < 50; i++) {
      await Bun.sleep(100)
      try {
        await this.fetch("/status")
        return // Server is ready
      } catch {
        // Keep waiting
      }
    }

    throw new Error("Failed to start container daemon")
  }

  async stopServer(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill()
      this.serverProcess = null
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const file = Bun.file(this.binaryPath)
      if (!(await file.exists())) return false

      const kernelFile = Bun.file(this.kernelPath)
      return kernelFile.exists()
    } catch {
      return false
    }
  }

  async healthCheck(): Promise<RuntimeStatus> {
    try {
      const file = Bun.file(this.binaryPath)
      if (!(await file.exists())) {
        return {
          type: this.type,
          available: false,
          healthy: false,
          message: `Binary not found at ${this.binaryPath}`,
        }
      }

      // Try to connect to running daemon
      const status = (await this.fetch("/status")) as {
        status: string
        kernelPath: string
        kernelExists: boolean
      }

      return {
        type: this.type,
        available: status.kernelExists,
        healthy: status.status === "ready",
        message: `Container daemon ready (kernel: ${status.kernelPath})`,
      }
    } catch {
      // Daemon not running - check kernel exists
      const kernelFile = Bun.file(this.kernelPath)
      const kernelExists = await kernelFile.exists()

      return {
        type: this.type,
        available: kernelExists,
        healthy: false,
        message: kernelExists
          ? "Container daemon not running. Call startServer() first."
          : `Kernel not found at ${this.kernelPath}`,
      }
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    const startTime = Date.now()

    try {
      // Ensure server is running
      await this.startServer()

      // Build the command
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

      // Default to alpine for simple commands, bun for code
      const image = task.code ? "oven/bun:latest" : "alpine:latest"

      const result = (await this.fetch("/run", {
        method: "POST",
        body: {
          id: task.id,
          image,
          command: cmd,
          workdir: task.workingDirectory || "/",
          mounts: task.mounts || [],
        },
      })) as {
        id: string
        exitCode: number
        stdout: string
        stderr: string
      }

      return {
        taskId: task.id,
        status: result.exitCode === 0 ? "completed" : "failed",
        output: result.stdout,
        error: result.stderr || undefined,
        exitCode: result.exitCode,
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
    try {
      await this.fetch(`/stop/${taskId}`, { method: "POST" })
    } catch {
      // Ignore errors
    }
  }

  async getStatus(taskId: string): Promise<Task | null> {
    return null
  }

  // ========================================================================
  // Snapshot/Restore API
  // ========================================================================

  /**
   * Capture a snapshot of the workspace files
   */
  async snapshot(
    containerId: string,
    workspacePath: string
  ): Promise<{
    containerId: string
    timestamp: string
    workspacePath: string
    files: { path: string; content: string; encoding: "base64" | "utf8" }[]
  }> {
    await this.startServer()
    return (await this.fetch(`/snapshot/${containerId}`, {
      method: "POST",
      body: { workspacePath },
    })) as any
  }

  /**
   * Restore a snapshot to a workspace directory
   */
  async restore(
    containerId: string,
    workspacePath: string,
    files: { path: string; content: string; encoding: "base64" | "utf8" }[]
  ): Promise<{
    containerId: string
    workspacePath: string
    restoredFiles: string[]
    errors: string[]
  }> {
    await this.startServer()
    return (await this.fetch(`/restore/${containerId}`, {
      method: "POST",
      body: { workspacePath, files },
    })) as any
  }

  /**
   * Start a long-running container (e.g., for a dev server)
   */
  async start(options: {
    id: string
    image: string
    command: string[]
    workdir?: string
    mounts?: MountSpec[]
  }): Promise<{ containerId: string; ipAddress: string }> {
    await this.startServer()
    return (await this.fetch("/start", {
      method: "POST",
      body: {
        id: options.id,
        image: options.image,
        command: options.command,
        workdir: options.workdir || "/",
        mounts: options.mounts || [],
      },
    })) as any
  }
}

// ============================================================================
// Local Container Sandbox - Implements unified Sandbox interface
// ============================================================================

export class LocalContainerSandbox implements Sandbox {
  readonly id: string
  readonly runtimeType: RuntimeType = "local-container"
  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private _ipAddress?: string
  private daemon: ContainerDaemonRuntime
  private workspacePath: string
  private image: string

  constructor(
    id: string,
    daemon: ContainerDaemonRuntime,
    options: { workspacePath?: string; image?: string } = {}
  ) {
    this.id = id
    this.daemon = daemon
    this.workspacePath = options.workspacePath || `/tmp/fabric-sandbox-${id}`
    this.image = options.image || "oven/bun:latest"
  }

  get status() {
    return this._status
  }

  get ipAddress(): string | undefined {
    return this._ipAddress
  }

  async start(): Promise<void> {
    try {
      // Create workspace directory
      await mkdir(this.workspacePath, { recursive: true })

      // Start the container with workspace mount
      const result = await this.daemon.start({
        id: this.id,
        image: this.image,
        command: ["sleep", "infinity"], // Keep container running
        workdir: "/workspace",
        mounts: [
          {
            source: this.workspacePath,
            destination: "/workspace",
            readOnly: false,
          },
        ],
      })

      this._ipAddress = result.ipAddress
      this._status = "running"
    } catch (error) {
      this._status = "error"
      throw error
    }
  }

  async stop(): Promise<void> {
    try {
      await this.daemon.cancel(this.id)
    } catch {
      // Ignore errors
    }
    this._status = "stopped"
  }

  async exec(command: string): Promise<{
    stdout: string
    stderr: string
    exitCode: number
  }> {
    // For now, use the daemon to run in the container
    // In the future, we could exec into the running container
    const result = await this.daemon.execute({
      id: `${this.id}-exec-${Date.now()}`,
      type: "shell-command",
      status: "pending",
      createdAt: new Date(),
      command,
      mounts: [
        {
          source: this.workspacePath,
          destination: "/workspace",
          readOnly: false,
        },
      ],
    })

    return {
      stdout: result.output || "",
      stderr: result.error || "",
      exitCode: result.exitCode || (result.status === "completed" ? 0 : 1),
    }
  }

  async runCode(
    code: string,
    language?: string
  ): Promise<{ output: string; error?: string }> {
    // Write code to file and execute
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
    const result = await this.daemon.snapshot(this.id, this.workspacePath)
    return {
      id: this.id,
      timestamp: result.timestamp,
      workspacePath: this.workspacePath,
      files: result.files,
    }
  }

  async restore(snapshot: SandboxSnapshot): Promise<void> {
    await this.daemon.restore(this.id, this.workspacePath, snapshot.files)
  }

  async delegate(
    targetRuntime: RuntimeType
  ): Promise<{ token: string; snapshot: SandboxSnapshot }> {
    // Capture current state
    const snapshot = await this.snapshot()

    // Generate handoff token
    const token = `local:${this.id}:${Date.now()}`

    // Stop this sandbox
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
// Local Container Sandbox Factory
// ============================================================================

export class LocalContainerSandboxFactory implements SandboxFactory {
  private daemon: ContainerDaemonRuntime
  private sandboxes = new Map<string, LocalContainerSandbox>()

  constructor(daemon?: ContainerDaemonRuntime) {
    this.daemon = daemon || new ContainerDaemonRuntime()
  }

  async create(options: {
    id?: string
    image?: string
    workspacePath?: string
    mounts?: MountSpec[]
  }): Promise<Sandbox> {
    const id = options.id || `sandbox-${Date.now()}`
    const sandbox = new LocalContainerSandbox(id, this.daemon, {
      workspacePath: options.workspacePath,
      image: options.image,
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
export const containerDaemon = new ContainerDaemonRuntime()
export const localSandboxFactory = new LocalContainerSandboxFactory()
