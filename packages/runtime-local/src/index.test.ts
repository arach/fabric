import { afterAll, beforeAll, describe, expect, test } from "bun:test"
import { mkdtemp, rm, readFile, writeFile, mkdir } from "fs/promises"
import { tmpdir } from "os"
import { join } from "path"
import { SubprocessRuntime } from "./index"
import type { Task } from "fabric-ai-core"

// ============================================================================
// SubprocessRuntime — real execution, no mocks
// ============================================================================

describe("SubprocessRuntime", () => {
  const runtime = new SubprocessRuntime()

  function makeTask(overrides: Partial<Task>): Task {
    return {
      id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "shell-command",
      status: "pending",
      createdAt: new Date(),
      ...overrides,
    }
  }

  test("isAvailable returns true", async () => {
    expect(await runtime.isAvailable()).toBe(true)
  })

  test("healthCheck reports healthy", async () => {
    const status = await runtime.healthCheck()
    expect(status.available).toBe(true)
    expect(status.healthy).toBe(true)
    expect(status.type).toBe("local-subprocess")
  })

  test("executes shell command and captures stdout", async () => {
    const result = await runtime.execute(
      makeTask({ command: "echo hello world" })
    )
    expect(result.status).toBe("completed")
    expect(result.output?.trim()).toBe("hello world")
    expect(result.exitCode).toBe(0)
    expect(result.duration).toBeGreaterThan(0)
  })

  test("captures stderr", async () => {
    const result = await runtime.execute(
      makeTask({ command: "echo oops >&2" })
    )
    expect(result.error?.trim()).toBe("oops")
  })

  test("returns non-zero exit code on failure", async () => {
    const result = await runtime.execute(
      makeTask({ command: "exit 42" })
    )
    expect(result.status).toBe("failed")
    expect(result.exitCode).toBe(42)
  })

  test("executes code via bun", async () => {
    const result = await runtime.execute(
      makeTask({ type: "code-execution", code: "console.log(2 + 2)" })
    )
    expect(result.status).toBe("completed")
    expect(result.output?.trim()).toBe("4")
  })

  test("respects working directory", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "fabric-test-"))
    try {
      const result = await runtime.execute(
        makeTask({ command: "pwd", workingDirectory: tmpDir })
      )
      // macOS resolves /var → /private/var, so compare real paths
      const { realpathSync } = await import("fs")
      expect(result.output?.trim()).toBe(realpathSync(tmpDir))
    } finally {
      await rm(tmpDir, { recursive: true, force: true })
    }
  })

  test("passes environment variables", async () => {
    const result = await runtime.execute(
      makeTask({
        command: "echo $FABRIC_TEST_VAR",
        env: { FABRIC_TEST_VAR: "hello-from-fabric" },
      })
    )
    expect(result.output?.trim()).toBe("hello-from-fabric")
  })

  test("fails with descriptive error when no command or code", async () => {
    const result = await runtime.execute(makeTask({}))
    expect(result.status).toBe("failed")
    expect(result.error).toContain("No command or code")
  })

  test("cancel kills a running process", async () => {
    const task = makeTask({ command: "sleep 60" })
    const promise = runtime.execute(task)

    // Give it a moment to start
    await Bun.sleep(100)
    await runtime.cancel(task.id)

    const result = await promise
    // Process was killed — exit code varies by platform but should not be 0
    expect(result.exitCode).not.toBe(0)
  })
})

// ============================================================================
// Apple Container CLI — real container execution
// ============================================================================

describe("Apple Container (container CLI)", () => {
  let hasContainerCLI = false

  beforeAll(async () => {
    // Check if the Apple container CLI is available and the system is running
    try {
      const proc = Bun.spawn({
        cmd: ["container", "run", "--rm", "alpine:latest", "true"],
        stdout: "pipe",
        stderr: "pipe",
      })
      const exitCode = await proc.exited
      hasContainerCLI = exitCode === 0
    } catch {
      hasContainerCLI = false
    }
  })

  function skipIfNoContainer() {
    if (!hasContainerCLI) {
      console.log("  (skipped — Apple container CLI not available)")
      return true
    }
    return false
  }

  async function containerRun(
    cmd: string,
    image = "alpine:latest"
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const proc = Bun.spawn({
      cmd: ["container", "run", "--rm", image, "sh", "-c", cmd],
      stdout: "pipe",
      stderr: "pipe",
    })
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])
    return { stdout, stderr, exitCode }
  }

  test("runs a command in an Alpine container", async () => {
    if (skipIfNoContainer()) return
    const result = await containerRun("echo hello from container")
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe("hello from container")
  }, 30_000)

  test("container has isolated filesystem", async () => {
    if (skipIfNoContainer()) return
    const result = await containerRun(
      "echo test > /tmp/isolated.txt && cat /tmp/isolated.txt"
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe("test")
  }, 30_000)

  test("container runs as Linux on arm64", async () => {
    if (skipIfNoContainer()) return
    const result = await containerRun("uname -s && uname -m")
    expect(result.exitCode).toBe(0)
    const lines = result.stdout.trim().split("\n")
    expect(lines[0]).toBe("Linux")
    expect(lines[1]).toBe("aarch64")
  }, 30_000)

  test("container can install and run packages", async () => {
    if (skipIfNoContainer()) return
    const result = await containerRun(
      "apk add --no-cache jq > /dev/null 2>&1 && echo '{\"x\":42}' | jq .x"
    )
    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toBe("42")
  }, 60_000)

  test("non-zero exit code propagates from container", async () => {
    if (skipIfNoContainer()) return
    const result = await containerRun("exit 7")
    expect(result.exitCode).toBe(7)
  }, 30_000)
})
