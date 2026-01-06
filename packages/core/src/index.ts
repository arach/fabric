/**
 * @fabric/core
 *
 * Core interfaces and types for the Fabric ambient compute framework
 */

// ============================================================================
// Task - Unit of work
// ============================================================================

export type TaskType =
  | "code-execution"    // Run arbitrary code in sandbox
  | "shell-command"     // Run shell commands
  | "agent"             // Long-running agent with checkpoints

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export interface Task {
  id: string
  type: TaskType
  status: TaskStatus
  createdAt: Date
  startedAt?: Date
  completedAt?: Date

  // Inputs
  code?: string
  command?: string
  workingDirectory?: string
  env?: Record<string, string>

  // Runtime preference
  runtime?: RuntimeType | "auto"

  // Context for resumption
  contextId?: string
  checkpoint?: Checkpoint

  // Outputs
  output?: string
  error?: string
  exitCode?: number
}

export interface TaskInput {
  type: TaskType
  code?: string
  command?: string
  workingDirectory?: string
  env?: Record<string, string>
  runtime?: RuntimeType | "auto"
  contextId?: string
}

// ============================================================================
// Context - Serializable state for checkpointing
// ============================================================================

export interface Context {
  id: string
  createdAt: Date
  updatedAt: Date

  // Conversation history (for agents)
  messages?: Message[]

  // File system state
  files?: ContextFile[]

  // Environment
  env?: Record<string, string>

  // Custom metadata
  metadata?: Record<string, unknown>
}

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export interface ContextFile {
  path: string
  content: string  // base64 for binary
  encoding: "utf8" | "base64"
}

export interface Checkpoint {
  contextId: string
  taskId: string
  timestamp: Date
  state: Record<string, unknown>
}

// ============================================================================
// Runtime - Execution environment
// ============================================================================

export type RuntimeType =
  | "local-subprocess"   // Direct subprocess on host
  | "local-container"    // Apple Containerization framework
  | "e2b"                // E2B cloud sandbox
  | "modal"              // Modal serverless

export interface RuntimeStatus {
  type: RuntimeType
  available: boolean
  healthy: boolean
  message?: string
}

export interface Runtime {
  type: RuntimeType

  /** Check if runtime is available */
  isAvailable(): Promise<boolean>

  /** Check runtime health */
  healthCheck(): Promise<RuntimeStatus>

  /** Execute a task */
  execute(task: Task): Promise<TaskResult>

  /** Cancel a running task */
  cancel(taskId: string): Promise<void>

  /** Get task status */
  getStatus(taskId: string): Promise<Task | null>
}

export interface TaskResult {
  taskId: string
  status: TaskStatus
  output?: string
  error?: string
  exitCode?: number
  duration?: number
  checkpoint?: Checkpoint
}

// ============================================================================
// Orchestrator - Routes tasks to runtimes
// ============================================================================

export interface OrchestratorConfig {
  preferLocal: boolean          // Prefer local execution when possible
  maxConcurrentTasks: number
  defaultTimeout: number        // ms
  runtimes: RuntimeType[]       // Enabled runtimes
}

export interface Orchestrator {
  /** Submit a task for execution */
  submit(input: TaskInput): Promise<Task>

  /** Get task by ID */
  getTask(taskId: string): Promise<Task | null>

  /** Cancel a task */
  cancel(taskId: string): Promise<void>

  /** List all tasks */
  listTasks(filter?: { status?: TaskStatus }): Promise<Task[]>

  /** Get available runtimes */
  getRuntimes(): Promise<RuntimeStatus[]>

  /** Save context checkpoint */
  saveCheckpoint(taskId: string): Promise<Checkpoint>

  /** Restore from checkpoint */
  restoreCheckpoint(checkpoint: Checkpoint): Promise<Task>
}

// ============================================================================
// Events - For real-time updates
// ============================================================================

export type FabricEvent =
  | { type: "task:created"; task: Task }
  | { type: "task:started"; task: Task }
  | { type: "task:output"; taskId: string; chunk: string }
  | { type: "task:completed"; task: Task; result: TaskResult }
  | { type: "task:failed"; task: Task; error: string }
  | { type: "task:cancelled"; task: Task }
  | { type: "checkpoint:saved"; checkpoint: Checkpoint }
  | { type: "runtime:status"; status: RuntimeStatus }
