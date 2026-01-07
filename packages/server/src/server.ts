/**
 * Fabric Server
 *
 * HTTP API for ambient compute orchestration
 */

import type { Task, TaskInput, RuntimeStatus, Checkpoint, Runtime } from "@fabric/core"
import { subprocess, container } from "@fabric/runtime-local"

const PORT = parseInt(process.env.PORT || "9000")

// In-memory task store (replace with persistent storage)
const tasks = new Map<string, Task>()

// Available runtimes
const runtimes: Runtime[] = [subprocess, container]

// Generate unique IDs
const generateId = () => crypto.randomUUID()

// Get runtime by type
function getRuntime(type: string): Runtime | undefined {
  return runtimes.find((r) => r.type === type)
}

// Auto-select runtime (prefer container if available, else subprocess)
async function selectRuntime(preferred?: string): Promise<Runtime> {
  if (preferred && preferred !== "auto") {
    const runtime = getRuntime(preferred)
    if (runtime && (await runtime.isAvailable())) {
      return runtime
    }
  }

  // Try container first
  if (await container.isAvailable()) {
    return container
  }

  // Fall back to subprocess
  return subprocess
}

// ============================================================================
// HTTP Server
// ============================================================================

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    }

    // Handle preflight
    if (method === "OPTIONS") {
      return new Response(null, { headers })
    }

    try {
      // Health check
      if (path === "/health" && method === "GET") {
        return Response.json(
          {
            status: "ok",
            version: "0.1.0",
            uptime: process.uptime(),
          },
          { headers }
        )
      }

      // List runtimes with actual health checks
      if (path === "/runtimes" && method === "GET") {
        const statuses: RuntimeStatus[] = await Promise.all(
          runtimes.map((r) => r.healthCheck())
        )

        // Add cloud runtimes (not yet implemented)
        statuses.push({
          type: "e2b",
          available: !!process.env.E2B_API_KEY,
          healthy: !!process.env.E2B_API_KEY,
          message: process.env.E2B_API_KEY
            ? "E2B API key configured"
            : "E2B cloud sandbox (requires E2B_API_KEY)",
        })

        statuses.push({
          type: "modal",
          available: !!(process.env.MODAL_TOKEN_ID && process.env.MODAL_TOKEN_SECRET),
          healthy: !!(process.env.MODAL_TOKEN_ID && process.env.MODAL_TOKEN_SECRET),
          message:
            process.env.MODAL_TOKEN_ID && process.env.MODAL_TOKEN_SECRET
              ? "Modal credentials configured"
              : "Modal serverless (requires MODAL_TOKEN_ID + MODAL_TOKEN_SECRET)",
        })

        return Response.json({ runtimes: statuses }, { headers })
      }

      // Submit task
      if (path === "/task" && method === "POST") {
        const input: TaskInput = await req.json()

        const task: Task = {
          id: generateId(),
          type: input.type,
          status: "pending",
          createdAt: new Date(),
          code: input.code,
          command: input.command,
          workingDirectory: input.workingDirectory,
          env: input.env,
          runtime: input.runtime || "auto",
          contextId: input.contextId,
        }

        tasks.set(task.id, task)

        // Execute task asynchronously
        ;(async () => {
          try {
            const runtime = await selectRuntime(task.runtime as string)
            task.status = "running"
            task.startedAt = new Date()

            console.log(`[${task.id}] Executing on ${runtime.type}...`)

            const result = await runtime.execute(task)

            task.status = result.status
            task.completedAt = new Date()
            task.output = result.output
            task.error = result.error
            task.exitCode = result.exitCode

            console.log(`[${task.id}] ${result.status} (exit: ${result.exitCode}, ${result.duration}ms)`)
          } catch (error) {
            task.status = "failed"
            task.completedAt = new Date()
            task.error = error instanceof Error ? error.message : String(error)
            console.error(`[${task.id}] Error:`, error)
          }
        })()

        return Response.json({ task }, { headers, status: 201 })
      }

      // Get task
      const taskMatch = path.match(/^\/task\/([^/]+)$/)
      if (taskMatch && method === "GET") {
        const taskId = taskMatch[1]
        const task = tasks.get(taskId)

        if (!task) {
          return Response.json(
            { error: "Task not found" },
            { headers, status: 404 }
          )
        }

        return Response.json({ task }, { headers })
      }

      // Cancel task
      if (taskMatch && method === "DELETE") {
        const taskId = taskMatch[1]
        const task = tasks.get(taskId)

        if (!task) {
          return Response.json(
            { error: "Task not found" },
            { headers, status: 404 }
          )
        }

        if (task.status === "running" || task.status === "pending") {
          const runtime = getRuntime(task.runtime as string)
          if (runtime) {
            await runtime.cancel(taskId)
          }
          task.status = "cancelled"
        }

        return Response.json({ task }, { headers })
      }

      // List tasks
      if (path === "/tasks" && method === "GET") {
        const status = url.searchParams.get("status")
        let taskList = Array.from(tasks.values())

        if (status) {
          taskList = taskList.filter((t) => t.status === status)
        }

        return Response.json({ tasks: taskList }, { headers })
      }

      // Save checkpoint
      if (path === "/checkpoint" && method === "POST") {
        const { taskId } = await req.json()
        const task = tasks.get(taskId)

        if (!task) {
          return Response.json(
            { error: "Task not found" },
            { headers, status: 404 }
          )
        }

        const checkpoint: Checkpoint = {
          contextId: task.contextId || generateId(),
          taskId: task.id,
          timestamp: new Date(),
          state: {
            output: task.output,
            env: task.env,
          },
        }

        return Response.json({ checkpoint }, { headers })
      }

      // 404 for unmatched routes
      return Response.json(
        { error: "Not found", path },
        { headers, status: 404 }
      )
    } catch (error) {
      console.error("Server error:", error)
      return Response.json(
        { error: error instanceof Error ? error.message : "Internal error" },
        { headers, status: 500 }
      )
    }
  },
})

console.log(`
╭──────────────────────────────────────╮
│         Fabric Server v0.1.0         │
│    Ambient Compute Orchestrator      │
├──────────────────────────────────────┤
│  http://localhost:${PORT}              │
│                                      │
│  Endpoints:                          │
│    GET  /health     - Health check   │
│    GET  /runtimes   - List runtimes  │
│    POST /task       - Submit task    │
│    GET  /task/:id   - Get task       │
│    GET  /tasks      - List tasks     │
╰──────────────────────────────────────╯
`)
