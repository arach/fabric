/**
 * HandoffManager - Orchestrates work delegation between runtimes
 *
 * Enables seamless handoff of sandbox execution:
 * - Local → Cloud: Delegate to E2B when local resources are constrained
 * - Cloud → Local: Reclaim work when returning to local machine
 */

import type {
  Sandbox,
  SandboxSnapshot,
  SandboxFactory,
  RuntimeType,
} from "./index"

// ============================================================================
// Handoff Types
// ============================================================================

export interface HandoffToken {
  id: string
  sourceRuntime: RuntimeType
  targetRuntime: RuntimeType
  sandboxId: string
  timestamp: string
  snapshot: SandboxSnapshot
  metadata?: Record<string, unknown>
}

export interface HandoffResult {
  success: boolean
  token: HandoffToken
  newSandbox?: Sandbox
  error?: string
}

export type HandoffEventType =
  | "handoff:initiated"
  | "handoff:snapshot_created"
  | "handoff:snapshot_transferred"
  | "handoff:target_started"
  | "handoff:completed"
  | "handoff:failed"
  | "reclaim:initiated"
  | "reclaim:completed"
  | "reclaim:failed"

export interface HandoffEvent {
  type: HandoffEventType
  token: HandoffToken
  timestamp: string
  details?: Record<string, unknown>
}

export type HandoffEventListener = (event: HandoffEvent) => void

// ============================================================================
// HandoffManager
// ============================================================================

export class HandoffManager {
  private factories: Map<RuntimeType, SandboxFactory> = new Map()
  private tokens: Map<string, HandoffToken> = new Map()
  private listeners: HandoffEventListener[] = []

  /**
   * Register a sandbox factory for a runtime type
   */
  registerFactory(type: RuntimeType, factory: SandboxFactory): void {
    this.factories.set(type, factory)
  }

  /**
   * Add event listener
   */
  on(listener: HandoffEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index !== -1) this.listeners.splice(index, 1)
    }
  }

  private emit(event: HandoffEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event)
      } catch (e) {
        console.error("Handoff event listener error:", e)
      }
    }
  }

  /**
   * Delegate sandbox execution to a different runtime
   *
   * @param sandbox The sandbox to delegate
   * @param targetRuntime The runtime to delegate to
   * @returns HandoffResult with the new sandbox on the target runtime
   */
  async delegate(
    sandbox: Sandbox,
    targetRuntime: RuntimeType
  ): Promise<HandoffResult> {
    const targetFactory = this.factories.get(targetRuntime)
    if (!targetFactory) {
      return {
        success: false,
        token: this.createToken(sandbox, targetRuntime),
        error: `No factory registered for runtime: ${targetRuntime}`,
      }
    }

    const token = this.createToken(sandbox, targetRuntime)

    try {
      this.emit({
        type: "handoff:initiated",
        token,
        timestamp: new Date().toISOString(),
      })

      // 1. Capture snapshot from source
      const snapshot = await sandbox.snapshot()
      token.snapshot = snapshot

      this.emit({
        type: "handoff:snapshot_created",
        token,
        timestamp: new Date().toISOString(),
        details: { fileCount: snapshot.files.length },
      })

      // 2. Stop source sandbox
      await sandbox.stop()

      // 3. Create new sandbox on target
      const newSandbox = await targetFactory.create({
        id: `${sandbox.id}-${targetRuntime}`,
        workspacePath: snapshot.workspacePath,
      })

      this.emit({
        type: "handoff:target_started",
        token,
        timestamp: new Date().toISOString(),
        details: { targetId: newSandbox.id },
      })

      // 4. Restore snapshot on target
      await newSandbox.restore(snapshot)

      this.emit({
        type: "handoff:snapshot_transferred",
        token,
        timestamp: new Date().toISOString(),
      })

      // Store token for potential reclaim
      this.tokens.set(token.id, token)

      this.emit({
        type: "handoff:completed",
        token,
        timestamp: new Date().toISOString(),
      })

      return {
        success: true,
        token,
        newSandbox,
      }
    } catch (error) {
      this.emit({
        type: "handoff:failed",
        token,
        timestamp: new Date().toISOString(),
        details: { error: String(error) },
      })

      return {
        success: false,
        token,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Reclaim sandbox execution from a delegated runtime
   *
   * @param tokenId The handoff token ID
   * @param targetRuntime The runtime to reclaim to (usually local)
   * @returns HandoffResult with the reclaimed sandbox
   */
  async reclaim(
    tokenId: string,
    targetRuntime: RuntimeType
  ): Promise<HandoffResult> {
    const token = this.tokens.get(tokenId)
    if (!token) {
      return {
        success: false,
        token: {} as HandoffToken,
        error: `Token not found: ${tokenId}`,
      }
    }

    const targetFactory = this.factories.get(targetRuntime)
    if (!targetFactory) {
      return {
        success: false,
        token,
        error: `No factory registered for runtime: ${targetRuntime}`,
      }
    }

    try {
      this.emit({
        type: "reclaim:initiated",
        token,
        timestamp: new Date().toISOString(),
      })

      // Create new sandbox on reclaim target
      const newSandbox = await targetFactory.create({
        id: `${token.sandboxId}-reclaimed`,
        workspacePath: token.snapshot.workspacePath,
      })

      // Restore from the token's snapshot
      await newSandbox.restore(token.snapshot)

      // Remove used token
      this.tokens.delete(tokenId)

      this.emit({
        type: "reclaim:completed",
        token,
        timestamp: new Date().toISOString(),
        details: { newSandboxId: newSandbox.id },
      })

      return {
        success: true,
        token,
        newSandbox,
      }
    } catch (error) {
      this.emit({
        type: "reclaim:failed",
        token,
        timestamp: new Date().toISOString(),
        details: { error: String(error) },
      })

      return {
        success: false,
        token,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Reclaim with a fresh snapshot from the remote sandbox
   */
  async reclaimWithSnapshot(
    remoteSandbox: Sandbox,
    targetRuntime: RuntimeType
  ): Promise<HandoffResult> {
    const targetFactory = this.factories.get(targetRuntime)
    if (!targetFactory) {
      return {
        success: false,
        token: {} as HandoffToken,
        error: `No factory registered for runtime: ${targetRuntime}`,
      }
    }

    const token = this.createToken(remoteSandbox, targetRuntime)

    try {
      this.emit({
        type: "reclaim:initiated",
        token,
        timestamp: new Date().toISOString(),
      })

      // Get fresh snapshot from remote
      const snapshot = await remoteSandbox.snapshot()
      token.snapshot = snapshot

      // Stop remote sandbox
      await remoteSandbox.stop()

      // Create local sandbox
      const newSandbox = await targetFactory.create({
        id: `${remoteSandbox.id}-local`,
        workspacePath: snapshot.workspacePath,
      })

      // Restore snapshot
      await newSandbox.restore(snapshot)

      this.emit({
        type: "reclaim:completed",
        token,
        timestamp: new Date().toISOString(),
        details: { newSandboxId: newSandbox.id },
      })

      return {
        success: true,
        token,
        newSandbox,
      }
    } catch (error) {
      this.emit({
        type: "reclaim:failed",
        token,
        timestamp: new Date().toISOString(),
        details: { error: String(error) },
      })

      return {
        success: false,
        token,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * List all active handoff tokens
   */
  listTokens(): HandoffToken[] {
    return Array.from(this.tokens.values())
  }

  /**
   * Get a specific token
   */
  getToken(tokenId: string): HandoffToken | undefined {
    return this.tokens.get(tokenId)
  }

  private createToken(sandbox: Sandbox, targetRuntime: RuntimeType): HandoffToken {
    return {
      id: `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sourceRuntime: sandbox.runtimeType,
      targetRuntime,
      sandboxId: sandbox.id,
      timestamp: new Date().toISOString(),
      snapshot: {} as SandboxSnapshot, // Will be filled during handoff
    }
  }
}

// Default instance
export const handoffManager = new HandoffManager()
