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
} from "@fabric/core"

// ============================================================================
// E2B Runtime
// ============================================================================

export class E2BRuntime implements Runtime {
  type: RuntimeType = "e2b"

  private apiKey: string | undefined

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY
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

    // TODO: Actually ping E2B API
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
      // Dynamic import to avoid bundling issues when not used
      const { Sandbox } = await import("@e2b/code-interpreter")

      const sandbox = await Sandbox.create({ apiKey: this.apiKey })

      try {
        if (task.code) {
          // Execute code
          const execution = await sandbox.runCode(task.code)

          return {
            taskId: task.id,
            status: execution.error ? "failed" : "completed",
            output: execution.logs.stdout.join("\n"),
            error: execution.error?.message || execution.logs.stderr.join("\n") || undefined,
            exitCode: execution.error ? 1 : 0,
            duration: Date.now() - startTime,
          }
        } else if (task.command) {
          // Execute shell command
          const result = await sandbox.commands.run(task.command)

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
        await sandbox.kill()
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
    // TODO: Track running sandboxes and kill them
  }

  async getStatus(taskId: string): Promise<Task | null> {
    return null
  }
}

export const e2b = new E2BRuntime()
