import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtemp, rm } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { CheckpointStore, type AgentCheckpoint } from "./checkpoint-store"

let tmpDir: string
let store: CheckpointStore

function makeCheckpoint(taskId: string): AgentCheckpoint {
  return {
    version: "1.0",
    taskId,
    timestamp: new Date().toISOString(),
    messages: [
      { role: "user", content: "hello", timestamp: new Date() },
      { role: "assistant", content: "hi there", timestamp: new Date() },
    ],
    lastOutput: "output",
    workingDirectory: "/workspace",
    env: { NODE_ENV: "test" },
    files: [
      { path: "/workspace/index.ts", content: "console.log('hi')", encoding: "utf8" },
    ],
    sourceRuntime: "local-subprocess",
  }
}

beforeAll(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), "fabric-test-"))
  store = new CheckpointStore(tmpDir)
})

afterAll(async () => {
  await rm(tmpDir, { recursive: true, force: true })
})

describe("CheckpointStore", () => {
  test("save and load roundtrips", async () => {
    const cp = makeCheckpoint("task-1")
    await store.save(cp)

    const loaded = await store.load("task-1")
    expect(loaded).not.toBeNull()
    expect(loaded!.taskId).toBe("task-1")
    expect(loaded!.messages).toHaveLength(2)
    expect(loaded!.files[0].content).toBe("console.log('hi')")
    expect(loaded!.env.NODE_ENV).toBe("test")
  })

  test("load returns null for missing checkpoint", async () => {
    const loaded = await store.load("nonexistent")
    expect(loaded).toBeNull()
  })

  test("list returns saved task IDs", async () => {
    await store.save(makeCheckpoint("task-a"))
    await store.save(makeCheckpoint("task-b"))

    const ids = await store.list()
    expect(ids).toContain("task-a")
    expect(ids).toContain("task-b")
  })

  test("delete removes checkpoint", async () => {
    await store.save(makeCheckpoint("task-del"))
    expect(await store.exists("task-del")).toBe(true)

    await store.delete("task-del")
    expect(await store.exists("task-del")).toBe(false)
    expect(await store.load("task-del")).toBeNull()
  })

  test("exists returns false for missing checkpoint", async () => {
    expect(await store.exists("nope")).toBe(false)
  })

  test("sanitizes task IDs to prevent path traversal", async () => {
    const cp = makeCheckpoint("../../etc/passwd")
    await store.save(cp)

    // Should be stored with sanitized name, not traverse
    const loaded = await store.load("../../etc/passwd")
    expect(loaded).not.toBeNull()
    expect(loaded!.taskId).toBe("../../etc/passwd")
  })
})
