/**
 * Fabric Server
 *
 * HTTP API for ambient compute orchestration
 */

import type { Task, TaskInput, RuntimeStatus, Checkpoint } from "@fabric/core"

const PORT = parseInt(process.env.PORT || "9000")

// In-memory task store (replace with persistent storage)
const tasks = new Map<string, Task>()
const contexts = new Map<string, any>()

// Generate unique IDs
const generateId = () => crypto.randomUUID()

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

      // List runtimes
      if (path === "/runtimes" && method === "GET") {
        const runtimes: RuntimeStatus[] = [
          {
            type: "local-subprocess",
            available: true,
            healthy: true,
            message: "Direct subprocess execution",
          },
          {
            type: "local-container",
            available: false, // TODO: Check FabricContainer binary
            healthy: false,
            message: "Apple Containerization (requires setup)",
          },
          {
            type: "e2b",
            available: false, // TODO: Check API key
            healthy: false,
            message: "E2B cloud sandbox (requires API key)",
          },
          {
            type: "modal",
            available: false, // TODO: Check API key
            healthy: false,
            message: "Modal serverless (requires API key)",
          },
        ]
        return Response.json({ runtimes }, { headers })
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

        // TODO: Actually execute the task via orchestrator
        // For now, just simulate
        setTimeout(() => {
          const t = tasks.get(task.id)
          if (t && t.status === "pending") {
            t.status = "running"
            t.startedAt = new Date()

            // Simulate execution
            setTimeout(() => {
              t.status = "completed"
              t.completedAt = new Date()
              t.output = `Executed: ${t.code || t.command}`
              t.exitCode = 0
            }, 1000)
          }
        }, 100)

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
