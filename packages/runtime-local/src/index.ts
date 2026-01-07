/**
 * @fabric/runtime-local
 *
 * Local execution runtime - subprocess and Apple containers
 */

import { spawn, spawnSync } from "bun"
import { dirname, join } from "path"
import type {
  Runtime,
  RuntimeType,
  RuntimeStatus,
  Task,
  TaskResult,
} from "@fabric/core"

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

    // Default to alpine for simple commands, bun for code
    const image = task.code ? "docker.io/oven/bun:latest" : "alpine:latest"

    try {
      const proc = spawn({
        cmd: [
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

      const stdout = await new Response(proc.stdout).text()
      const stderr = await new Response(proc.stderr).text()
      const exitCode = await proc.exited

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
// Export default runtimes
// ============================================================================

export const subprocess = new SubprocessRuntime()
export const container = new ContainerRuntime()
