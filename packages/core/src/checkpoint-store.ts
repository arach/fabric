/**
 * CheckpointStore - Filesystem persistence for agent checkpoints
 *
 * Stores checkpoints at ~/.fabric/checkpoints/{taskId}.json
 */

import { mkdir, readdir, readFile, rm, writeFile } from "fs/promises"
import { homedir } from "os"
import { join } from "path"
import type { Message, RuntimeType } from "./index"

// ============================================================================
// Types
// ============================================================================

export interface CheckpointFile {
  path: string
  content: string // base64 encoded for binary, utf8 for text
  encoding: "utf8" | "base64"
}

export interface AgentCheckpoint {
  version: "1.0"
  taskId: string
  timestamp: string // ISO date string

  // Agent conversation state
  messages: Message[]
  systemPrompt?: string

  // Execution state
  lastOutput: string
  workingDirectory: string
  env: Record<string, string>

  // File system state (for cloud restore)
  files: CheckpointFile[]

  // Runtime info
  sourceRuntime: RuntimeType
  targetRuntime?: RuntimeType
}

// ============================================================================
// CheckpointStore
// ============================================================================

export class CheckpointStore {
  private baseDir: string

  constructor(baseDir?: string) {
    this.baseDir = baseDir || join(homedir(), ".fabric", "checkpoints")
  }

  /**
   * Ensure the checkpoints directory exists
   */
  private async ensureDir(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true })
  }

  /**
   * Get the file path for a checkpoint
   */
  private getPath(taskId: string): string {
    // Sanitize taskId to prevent path traversal
    const safeId = taskId.replace(/[^a-zA-Z0-9-_]/g, "_")
    return join(this.baseDir, `${safeId}.json`)
  }

  /**
   * Save a checkpoint to disk
   */
  async save(checkpoint: AgentCheckpoint): Promise<string> {
    await this.ensureDir()
    const path = this.getPath(checkpoint.taskId)
    const json = JSON.stringify(checkpoint, null, 2)
    await writeFile(path, json, "utf8")
    return path
  }

  /**
   * Load a checkpoint from disk
   */
  async load(taskId: string): Promise<AgentCheckpoint | null> {
    try {
      const path = this.getPath(taskId)
      const json = await readFile(path, "utf8")
      return JSON.parse(json) as AgentCheckpoint
    } catch (error) {
      // File doesn't exist or invalid JSON
      return null
    }
  }

  /**
   * List all checkpoint task IDs
   */
  async list(): Promise<string[]> {
    try {
      await this.ensureDir()
      const files = await readdir(this.baseDir)
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""))
    } catch {
      return []
    }
  }

  /**
   * Delete a checkpoint
   */
  async delete(taskId: string): Promise<void> {
    try {
      const path = this.getPath(taskId)
      await rm(path)
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Check if a checkpoint exists
   */
  async exists(taskId: string): Promise<boolean> {
    try {
      const path = this.getPath(taskId)
      await readFile(path)
      return true
    } catch {
      return false
    }
  }
}

// ============================================================================
// Helper functions for creating checkpoints
// ============================================================================

/**
 * Encode file content for checkpoint storage
 */
export function encodeFileForCheckpoint(
  path: string,
  content: Buffer | string
): CheckpointFile {
  if (typeof content === "string") {
    return { path, content, encoding: "utf8" }
  }
  return { path, content: content.toString("base64"), encoding: "base64" }
}

/**
 * Decode file content from checkpoint
 */
export function decodeFileFromCheckpoint(file: CheckpointFile): {
  path: string
  content: Buffer
} {
  if (file.encoding === "base64") {
    return { path: file.path, content: Buffer.from(file.content, "base64") }
  }
  return { path: file.path, content: Buffer.from(file.content, "utf8") }
}

// Default store instance
export const checkpointStore = new CheckpointStore()
