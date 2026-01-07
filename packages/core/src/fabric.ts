/**
 * Fabric SDK - Main entrypoint for external applications
 *
 * Usage:
 *   import { Fabric } from "@fabric/core"
 *
 *   const session = await Fabric.createSession({
 *     workspacePath: "/path/to/project",
 *     runtime: "local", // or "cloud"
 *   })
 *
 *   // Execute commands in the sandbox
 *   await session.exec("npm install")
 *   await session.exec("npm test")
 *
 *   // Delegate to cloud when needed
 *   await session.delegateToCloud()
 *
 *   // Later, reclaim back to local
 *   await session.reclaimToLocal()
 */

import type {
  Sandbox,
  SandboxFactory,
  SandboxSnapshot,
  RuntimeType,
  MountSpec,
} from "./index"
import { HandoffManager } from "./handoff"

// ============================================================================
// Types
// ============================================================================

export interface FabricSessionConfig {
  /** Unique session ID (auto-generated if not provided) */
  id?: string

  /** Path to the workspace directory to mount */
  workspacePath: string

  /** Initial runtime preference */
  runtime?: "local" | "cloud" | "auto"

  /** Container image to use (default: oven/bun:latest) */
  image?: string

  /** Additional mounts */
  mounts?: MountSpec[]

  /** Event callback */
  onEvent?: (event: FabricSessionEvent) => void
}

export type FabricSessionEventType =
  | "session:created"
  | "session:ready"
  | "session:delegating"
  | "session:delegated"
  | "session:reclaiming"
  | "session:reclaimed"
  | "session:error"
  | "exec:start"
  | "exec:output"
  | "exec:complete"

export interface FabricSessionEvent {
  type: FabricSessionEventType
  sessionId: string
  timestamp: string
  data?: Record<string, unknown>
}

export interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
  duration: number
}

// ============================================================================
// FabricSession - A working session with handoff support
// ============================================================================

export class FabricSession {
  readonly id: string
  readonly workspacePath: string

  private sandbox: Sandbox | null = null
  private handoffManager: HandoffManager
  private config: FabricSessionConfig
  private _currentRuntime: RuntimeType = "local-container"

  constructor(
    config: FabricSessionConfig,
    handoffManager: HandoffManager
  ) {
    this.id = config.id || `session-${Date.now()}`
    this.workspacePath = config.workspacePath
    this.config = config
    this.handoffManager = handoffManager
  }

  /** Current runtime type */
  get currentRuntime(): RuntimeType {
    return this._currentRuntime
  }

  /** Current sandbox instance */
  get currentSandbox(): Sandbox | null {
    return this.sandbox
  }

  /** Whether session is ready for execution */
  get isReady(): boolean {
    return this.sandbox !== null && this.sandbox.status === "running"
  }

  /**
   * Initialize the session with a sandbox
   */
  async initialize(sandbox: Sandbox): Promise<void> {
    this.sandbox = sandbox
    this._currentRuntime = sandbox.runtimeType
    this.emit("session:ready", { runtime: this._currentRuntime })
  }

  /**
   * Execute a command in the sandbox
   */
  async exec(command: string): Promise<ExecResult> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }

    const startTime = Date.now()
    this.emit("exec:start", { command })

    const result = await this.sandbox.exec(command)

    const execResult: ExecResult = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      duration: Date.now() - startTime,
    }

    this.emit("exec:complete", {
      command,
      exitCode: result.exitCode,
      duration: execResult.duration,
    })

    return execResult
  }

  /**
   * Run code in the sandbox
   */
  async runCode(code: string, language?: string): Promise<{ output: string; error?: string }> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }

    if (!this.sandbox.runCode) {
      // Fallback: write to file and execute
      const ext = language === "python" ? "py" : "ts"
      await this.sandbox.writeFile(`_run.${ext}`, code)
      const cmd = language === "python" ? "python _run.py" : "bun _run.ts"
      const result = await this.sandbox.exec(`cd /workspace && ${cmd}`)
      return {
        output: result.stdout,
        error: result.stderr || (result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : undefined),
      }
    }

    return this.sandbox.runCode(code, language)
  }

  /**
   * Write a file to the workspace
   */
  async writeFile(path: string, content: string | Buffer): Promise<void> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }
    await this.sandbox.writeFile(path, content)
  }

  /**
   * Read a file from the workspace
   */
  async readFile(path: string): Promise<string> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }
    return this.sandbox.readFile(path)
  }

  /**
   * List files in the workspace
   */
  async listFiles(path: string = "/"): Promise<string[]> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }
    return this.sandbox.listFiles(path)
  }

  /**
   * Delegate execution to cloud (E2B)
   */
  async delegateToCloud(): Promise<void> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }

    this.emit("session:delegating", { from: this._currentRuntime, to: "e2b" })

    const result = await this.handoffManager.delegate(this.sandbox, "e2b")

    if (!result.success) {
      this.emit("session:error", { error: result.error })
      throw new Error(`Delegation failed: ${result.error}`)
    }

    this.sandbox = result.newSandbox!
    this._currentRuntime = "e2b"

    this.emit("session:delegated", {
      token: result.token.id,
      runtime: this._currentRuntime,
    })
  }

  /**
   * Reclaim execution back to local
   */
  async reclaimToLocal(): Promise<void> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }

    this.emit("session:reclaiming", { from: this._currentRuntime, to: "local-container" })

    const result = await this.handoffManager.reclaimWithSnapshot(
      this.sandbox,
      "local-container"
    )

    if (!result.success) {
      this.emit("session:error", { error: result.error })
      throw new Error(`Reclaim failed: ${result.error}`)
    }

    this.sandbox = result.newSandbox!
    this._currentRuntime = "local-container"

    this.emit("session:reclaimed", { runtime: this._currentRuntime })
  }

  /**
   * Get a snapshot of current state
   */
  async snapshot(): Promise<SandboxSnapshot> {
    if (!this.sandbox) {
      throw new Error("Session not initialized")
    }
    return this.sandbox.snapshot()
  }

  /**
   * Stop the session
   */
  async stop(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.stop()
      this.sandbox = null
    }
  }

  private emit(type: FabricSessionEventType, data?: Record<string, unknown>): void {
    if (this.config.onEvent) {
      this.config.onEvent({
        type,
        sessionId: this.id,
        timestamp: new Date().toISOString(),
        data,
      })
    }
  }
}

// ============================================================================
// Fabric - Main SDK class
// ============================================================================

export class Fabric {
  private handoffManager: HandoffManager
  private localFactory: SandboxFactory | null = null
  private cloudFactory: SandboxFactory | null = null
  private sessions: Map<string, FabricSession> = new Map()

  constructor() {
    this.handoffManager = new HandoffManager()
  }

  /**
   * Register the local sandbox factory
   */
  registerLocalFactory(factory: SandboxFactory): void {
    this.localFactory = factory
    this.handoffManager.registerFactory("local-container", factory)
  }

  /**
   * Register the cloud sandbox factory (E2B)
   */
  registerCloudFactory(factory: SandboxFactory): void {
    this.cloudFactory = factory
    this.handoffManager.registerFactory("e2b", factory)
  }

  /**
   * Create a new Fabric session
   */
  async createSession(config: FabricSessionConfig): Promise<FabricSession> {
    const session = new FabricSession(config, this.handoffManager)

    // Determine which factory to use
    const useCloud = config.runtime === "cloud"
    const factory = useCloud ? this.cloudFactory : this.localFactory

    if (!factory) {
      throw new Error(
        useCloud
          ? "Cloud factory not registered. Call registerCloudFactory() first."
          : "Local factory not registered. Call registerLocalFactory() first."
      )
    }

    // Create the sandbox
    const sandbox = await factory.create({
      id: session.id,
      workspacePath: config.workspacePath,
      image: config.image,
      mounts: [
        {
          source: config.workspacePath,
          destination: "/workspace",
          readOnly: false,
        },
        ...(config.mounts || []),
      ],
    })

    await session.initialize(sandbox)
    this.sessions.set(session.id, session)

    return session
  }

  /**
   * Get an existing session by ID
   */
  getSession(id: string): FabricSession | undefined {
    return this.sessions.get(id)
  }

  /**
   * List all active sessions
   */
  listSessions(): FabricSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Stop all sessions
   */
  async stopAll(): Promise<void> {
    for (const session of this.sessions.values()) {
      await session.stop()
    }
    this.sessions.clear()
  }
}

// Default instance
export const fabric = new Fabric()
