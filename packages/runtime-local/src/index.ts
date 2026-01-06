/**
 * @fabric/runtime-local
 *
 * Local execution runtime - subprocess and Apple containers
 */

import { spawn } from "bun"
import type {
  Runtime,
  RuntimeType,
  RuntimeStatus,
  Task,
  TaskResult,
  TaskStatus,
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
    // For subprocess, we don't track state beyond the process
    return null
  }
}

// ============================================================================
// Container Runtime - Apple Containerization framework
// ============================================================================

export class ContainerRuntime implements Runtime {
  type: RuntimeType = "local-container"

  private containerBinaryPath: string

  constructor(containerBinaryPath?: string) {
    // Default to looking in the package's FabricContainer build
    this.containerBinaryPath =
      containerBinaryPath ||
      new URL(
        "../FabricContainer/.build/release/fabric-container",
        import.meta.url
      ).pathname
  }

  async isAvailable(): Promise<boolean> {
    try {
      const file = Bun.file(this.containerBinaryPath)
      return await file.exists()
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
        message: `Container binary not found at ${this.containerBinaryPath}. Run 'bun run build:container' first.`,
      }
    }

    // Check if fabric-container responds
    try {
      const proc = spawn({
        cmd: [this.containerBinaryPath, "status"],
        stdout: "pipe",
        stderr: "pipe",
      })

      const stdout = await new Response(proc.stdout).text()
      const exitCode = await proc.exited

      if (exitCode === 0) {
        return {
          type: this.type,
          available: true,
          healthy: true,
          message: "Container runtime ready",
        }
      }

      return {
        type: this.type,
        available: true,
        healthy: false,
        message: `Container runtime unhealthy: ${stdout}`,
      }
    } catch (error) {
      return {
        type: this.type,
        available: true,
        healthy: false,
        message: `Health check failed: ${error}`,
      }
    }
  }

  async execute(task: Task): Promise<TaskResult> {
    // TODO: Implement container execution via fabric-container binary
    return {
      taskId: task.id,
      status: "failed",
      error: "Container runtime not yet implemented",
    }
  }

  async cancel(taskId: string): Promise<void> {
    // TODO: Implement via fabric-container stop
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
