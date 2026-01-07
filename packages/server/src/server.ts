/**
 * Fabric Server
 *
 * HTTP API for ambient compute orchestration
 */

import type {
  Task,
  TaskInput,
  RuntimeStatus,
  Runtime,
  AgentTask,
  AgentTaskInput,
  Message,
  AgentCheckpoint,
  RuntimeType,
} from "fabric-ai-core"
import { checkpointStore, encodeFileForCheckpoint } from "fabric-ai-core"
import { subprocess, container } from "@fabric-ai/runtime-local"

const PORT = parseInt(process.env.PORT || "9000")

// In-memory task store
const tasks = new Map<string, Task | AgentTask>()

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

// Check if task is an agent task
function isAgentTask(task: Task | AgentTask): task is AgentTask {
  return task.type === "agent"
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
            version: "0.2.0",
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

        // Add cloud runtimes
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

      // ========================================================================
      // Checkpoint endpoints
      // ========================================================================

      // List checkpoints
      if (path === "/checkpoints" && method === "GET") {
        const checkpointIds = await checkpointStore.list()
        const checkpoints = await Promise.all(
          checkpointIds.map(async (id) => {
            const cp = await checkpointStore.load(id)
            return cp
              ? { taskId: cp.taskId, timestamp: cp.timestamp, sourceRuntime: cp.sourceRuntime }
              : null
          })
        )
        return Response.json(
          { checkpoints: checkpoints.filter(Boolean) },
          { headers }
        )
      }

      // Delete checkpoint
      const deleteCheckpointMatch = path.match(/^\/checkpoint\/([^/]+)$/)
      if (deleteCheckpointMatch && method === "DELETE") {
        const taskId = deleteCheckpointMatch[1]
        await checkpointStore.delete(taskId)
        return Response.json({ deleted: taskId }, { headers })
      }

      // Checkpoint a task
      const checkpointMatch = path.match(/^\/task\/([^/]+)\/checkpoint$/)
      if (checkpointMatch && method === "POST") {
        const taskId = checkpointMatch[1]
        const task = tasks.get(taskId)

        if (!task) {
          return Response.json(
            { error: "Task not found" },
            { headers, status: 404 }
          )
        }

        // Build checkpoint
        const checkpoint: AgentCheckpoint = {
          version: "1.0",
          taskId: task.id,
          timestamp: new Date().toISOString(),
          messages: isAgentTask(task) ? task.messages : [],
          systemPrompt: isAgentTask(task) ? task.systemPrompt : undefined,
          lastOutput: task.output || "",
          workingDirectory: task.workingDirectory || "/",
          env: task.env || {},
          files: [], // TODO: Capture files from runtime
          sourceRuntime: (task.runtime as RuntimeType) || "local-subprocess",
        }

        const savedPath = await checkpointStore.save(checkpoint)
        console.log(`[${taskId}] Checkpoint saved to ${savedPath}`)

        return Response.json(
          { checkpoint: { taskId, timestamp: checkpoint.timestamp, path: savedPath } },
          { headers }
        )
      }

      // Restore from checkpoint
      const restoreMatch = path.match(/^\/task\/([^/]+)\/restore$/)
      if (restoreMatch && method === "POST") {
        const taskId = restoreMatch[1]
        const body = await req.json()
        const targetRuntime = body.targetRuntime || "e2b"

        // Load checkpoint
        const checkpoint = await checkpointStore.load(taskId)
        if (!checkpoint) {
          return Response.json(
            { error: "Checkpoint not found" },
            { headers, status: 404 }
          )
        }

        // Create new task from checkpoint
        const newTask: AgentTask = {
          id: generateId(),
          type: "agent",
          status: "pending",
          createdAt: new Date(),
          runtime: targetRuntime,
          messages: checkpoint.messages,
          systemPrompt: checkpoint.systemPrompt,
          workingDirectory: checkpoint.workingDirectory,
          env: checkpoint.env,
          output: checkpoint.lastOutput,
          contextId: checkpoint.taskId, // Link to original
        }

        tasks.set(newTask.id, newTask)
        console.log(`[${newTask.id}] Restored from checkpoint ${taskId} to ${targetRuntime}`)

        // TODO: Start execution on target runtime with files restored

        return Response.json(
          {
            task: newTask,
            restoredFrom: taskId,
            targetRuntime,
          },
          { headers, status: 201 }
        )
      }

      // ========================================================================
      // Task endpoints
      // ========================================================================

      // Submit task
      if (path === "/task" && method === "POST") {
        const input = await req.json() as TaskInput | AgentTaskInput

        let task: Task | AgentTask

        if (input.type === "agent") {
          const agentInput = input as AgentTaskInput
          task = {
            id: generateId(),
            type: "agent",
            status: "pending",
            createdAt: new Date(),
            runtime: input.runtime || "auto",
            workingDirectory: input.workingDirectory,
            env: input.env,
            contextId: input.contextId,
            messages: agentInput.messages || [],
            systemPrompt: agentInput.systemPrompt,
            currentTurn: 0,
          } as AgentTask
        } else {
          task = {
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
        }

        tasks.set(task.id, task)

        // Execute non-agent tasks immediately
        if (task.type !== "agent") {
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
        } else {
          // Agent tasks wait for messages
          task.status = "running"
          task.startedAt = new Date()
          console.log(`[${task.id}] Agent task created, waiting for messages`)
        }

        return Response.json({ task }, { headers, status: 201 })
      }

      // Add message to agent task
      const messageMatch = path.match(/^\/task\/([^/]+)\/message$/)
      if (messageMatch && method === "POST") {
        const taskId = messageMatch[1]
        const task = tasks.get(taskId)

        if (!task) {
          return Response.json(
            { error: "Task not found" },
            { headers, status: 404 }
          )
        }

        if (!isAgentTask(task)) {
          return Response.json(
            { error: "Task is not an agent task" },
            { headers, status: 400 }
          )
        }

        const { content, role = "user" } = await req.json()

        const message: Message = {
          role,
          content,
          timestamp: new Date(),
        }

        task.messages.push(message)
        task.currentTurn = (task.currentTurn || 0) + 1

        console.log(`[${taskId}] Message added (turn ${task.currentTurn})`)

        // TODO: Execute agent turn (call LLM, run tools, etc.)

        return Response.json({ task, messageAdded: message }, { headers })
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
│         Fabric Server v0.2.0         │
│    Ambient Compute Orchestrator      │
├──────────────────────────────────────┤
│  http://localhost:${PORT}              │
│                                      │
│  Endpoints:                          │
│    GET  /health              - Health│
│    GET  /runtimes            - List  │
│    POST /task                - Submit│
│    GET  /task/:id            - Get   │
│    POST /task/:id/message    - Chat  │
│    POST /task/:id/checkpoint - Save  │
│    POST /task/:id/restore    - Load  │
│    GET  /checkpoints         - List  │
╰──────────────────────────────────────╯
`)
