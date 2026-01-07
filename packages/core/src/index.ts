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

export interface MountSpec {
  source: string      // Host path
  destination: string // Container path
  readOnly?: boolean
}

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
  mounts?: MountSpec[]  // Directory mounts for container runtimes

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
  mounts?: MountSpec[]
  runtime?: RuntimeType | "auto"
  contextId?: string
}

// ============================================================================
// Agent Task - Long-running LLM agent with conversation state
// ============================================================================

export interface AgentTask extends Task {
  type: "agent"

  // Conversation state
  messages: Message[]
  systemPrompt?: string

  // Current turn
  currentTurn?: number
}

export interface AgentTaskInput extends TaskInput {
  type: "agent"
  messages: Message[]
  systemPrompt?: string
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
// Sandbox - Unified interface for container execution environments
// ============================================================================

/**
 * Snapshot of sandbox filesystem and state
 */
export interface SandboxSnapshot {
  id: string
  timestamp: string
  workspacePath: string
  files: {
    path: string
    content: string // base64 encoded
    encoding: "base64" | "utf8"
  }[]
  metadata?: Record<string, unknown>
}

/**
 * Sandbox provides a unified interface for executing code in isolated environments.
 * Implementations can be local containers, cloud sandboxes (E2B), or other runtimes.
 */
export interface Sandbox {
  /** Unique identifier for this sandbox instance */
  readonly id: string

  /** Runtime type (local-container, e2b, etc.) */
  readonly runtimeType: RuntimeType

  /** Sandbox status */
  readonly status: "starting" | "running" | "stopped" | "error"

  /** IP address if available (for network access) */
  readonly ipAddress?: string

  // Lifecycle
  /** Start the sandbox */
  start(): Promise<void>

  /** Stop the sandbox */
  stop(): Promise<void>

  // Execution
  /** Run a command in the sandbox */
  exec(command: string): Promise<{
    stdout: string
    stderr: string
    exitCode: number
  }>

  /** Run code (language-specific) */
  runCode?(code: string, language?: string): Promise<{
    output: string
    error?: string
  }>

  // File System
  /** Write a file to the sandbox */
  writeFile(path: string, content: string | Buffer): Promise<void>

  /** Read a file from the sandbox */
  readFile(path: string): Promise<string>

  /** List files in a directory */
  listFiles(path: string): Promise<string[]>

  // Snapshot/Restore
  /** Capture current state as a snapshot */
  snapshot(): Promise<SandboxSnapshot>

  /** Restore from a snapshot */
  restore(snapshot: SandboxSnapshot): Promise<void>

  // Handoff
  /** Delegate execution to another runtime (returns handoff token) */
  delegate(targetRuntime: RuntimeType): Promise<{
    token: string
    snapshot: SandboxSnapshot
  }>

  /** Reclaim execution from a delegated sandbox */
  reclaim(token: string, snapshot: SandboxSnapshot): Promise<void>
}

/**
 * Factory for creating sandbox instances
 */
export interface SandboxFactory {
  /** Create a new sandbox */
  create(options: {
    id?: string
    image?: string
    workspacePath?: string
    mounts?: MountSpec[]
  }): Promise<Sandbox>

  /** Resume an existing sandbox by ID */
  resume(id: string): Promise<Sandbox | null>

  /** List all sandboxes */
  list(): Promise<{ id: string; status: string }[]>
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

// ============================================================================
// Re-exports
// ============================================================================

export {
  CheckpointStore,
  checkpointStore,
  encodeFileForCheckpoint,
  decodeFileFromCheckpoint,
  type AgentCheckpoint,
  type CheckpointFile,
} from "./checkpoint-store"

export {
  HandoffManager,
  handoffManager,
  type HandoffToken,
  type HandoffResult,
  type HandoffEvent,
  type HandoffEventType,
  type HandoffEventListener,
} from "./handoff"
