/**
 * Test script for Fabric Handoff System
 *
 * Demonstrates the full delegate/reclaim cycle between local and cloud runtimes.
 * Since E2B requires an API key, this test focuses on local-to-local handoff
 * to verify the mechanics work correctly.
 */

import {
  HandoffManager,
  type SandboxSnapshot,
  type Sandbox,
  type RuntimeType,
  type SandboxFactory,
} from "@fabric/core"

// ============================================================================
// Mock Sandbox for Testing (simulates both local and cloud)
// ============================================================================

class MockSandbox implements Sandbox {
  readonly id: string
  readonly runtimeType: RuntimeType
  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private files: Map<string, string> = new Map()

  constructor(id: string, runtimeType: RuntimeType) {
    this.id = id
    this.runtimeType = runtimeType
  }

  get status() {
    return this._status
  }

  get ipAddress() {
    return "192.168.1.100"
  }

  async start(): Promise<void> {
    this._status = "running"
    console.log(`  [${this.runtimeType}] Sandbox ${this.id} started`)
  }

  async stop(): Promise<void> {
    this._status = "stopped"
    console.log(`  [${this.runtimeType}] Sandbox ${this.id} stopped`)
  }

  async exec(command: string) {
    console.log(`  [${this.runtimeType}] Executing: ${command}`)
    return { stdout: "OK", stderr: "", exitCode: 0 }
  }

  async runCode(code: string) {
    console.log(`  [${this.runtimeType}] Running code: ${code.slice(0, 50)}...`)
    return { output: "Code executed" }
  }

  async writeFile(path: string, content: string | Buffer): Promise<void> {
    this.files.set(path, content.toString())
    console.log(`  [${this.runtimeType}] Wrote file: ${path}`)
  }

  async readFile(path: string): Promise<string> {
    return this.files.get(path) || ""
  }

  async listFiles(path: string): Promise<string[]> {
    return Array.from(this.files.keys())
  }

  async snapshot(): Promise<SandboxSnapshot> {
    const files = Array.from(this.files.entries()).map(([path, content]) => ({
      path,
      content: Buffer.from(content).toString("base64"),
      encoding: "base64" as const,
    }))

    console.log(`  [${this.runtimeType}] Created snapshot with ${files.length} files`)

    return {
      id: this.id,
      timestamp: new Date().toISOString(),
      workspacePath: "/workspace",
      files,
    }
  }

  async restore(snapshot: SandboxSnapshot): Promise<void> {
    this.files.clear()
    for (const file of snapshot.files) {
      const content =
        file.encoding === "base64"
          ? Buffer.from(file.content, "base64").toString()
          : file.content
      this.files.set(file.path, content)
    }
    console.log(`  [${this.runtimeType}] Restored ${snapshot.files.length} files from snapshot`)
  }

  async delegate(targetRuntime: RuntimeType) {
    const snapshot = await this.snapshot()
    const token = `${this.runtimeType}:${this.id}:${Date.now()}`
    await this.stop()
    return { token, snapshot }
  }

  async reclaim(token: string, snapshot: SandboxSnapshot) {
    if (this._status !== "running") {
      await this.start()
    }
    await this.restore(snapshot)
  }
}

// ============================================================================
// Mock Factories
// ============================================================================

class MockSandboxFactory implements SandboxFactory {
  private runtimeType: RuntimeType
  private sandboxes = new Map<string, MockSandbox>()

  constructor(runtimeType: RuntimeType) {
    this.runtimeType = runtimeType
  }

  async create(options: { id?: string; workspacePath?: string }) {
    const id = options.id || `${this.runtimeType}-${Date.now()}`
    const sandbox = new MockSandbox(id, this.runtimeType)
    await sandbox.start()
    this.sandboxes.set(id, sandbox)
    return sandbox
  }

  async resume(id: string) {
    return this.sandboxes.get(id) || null
  }

  async list() {
    return Array.from(this.sandboxes.entries()).map(([id, s]) => ({
      id,
      status: s.status,
    }))
  }
}

// ============================================================================
// Test the Handoff
// ============================================================================

async function testHandoff() {
  console.log("=" .repeat(60))
  console.log("Fabric Handoff System Test")
  console.log("=" .repeat(60))
  console.log()

  // Create handoff manager
  const manager = new HandoffManager()

  // Register factories
  const localFactory = new MockSandboxFactory("local-container")
  const cloudFactory = new MockSandboxFactory("e2b")

  manager.registerFactory("local-container", localFactory)
  manager.registerFactory("e2b", cloudFactory)

  // Listen for events
  manager.on((event) => {
    console.log(`  📢 Event: ${event.type}`)
  })

  // ========================================================================
  // Step 1: Create a local sandbox and do some work
  // ========================================================================
  console.log("\n📦 Step 1: Create local sandbox and do work")
  console.log("-".repeat(40))

  const localSandbox = await localFactory.create({ id: "work-session-1" })

  // Simulate doing work
  await localSandbox.writeFile("app.ts", 'console.log("Hello World")')
  await localSandbox.writeFile("data.json", '{"count": 42}')
  await localSandbox.exec("bun run app.ts")

  console.log("\n✅ Local work completed")

  // ========================================================================
  // Step 2: Delegate to cloud (E2B)
  // ========================================================================
  console.log("\n☁️  Step 2: Delegate work to cloud (E2B)")
  console.log("-".repeat(40))

  const delegateResult = await manager.delegate(localSandbox, "e2b")

  if (delegateResult.success) {
    console.log(`\n✅ Delegation successful!`)
    console.log(`   Token: ${delegateResult.token.id}`)
    console.log(`   New sandbox: ${delegateResult.newSandbox?.id}`)

    // Simulate cloud work
    const cloudSandbox = delegateResult.newSandbox!
    await cloudSandbox.writeFile("cloud-result.txt", "Processed in cloud")
    await cloudSandbox.exec("echo 'Cloud processing complete'")

    console.log("\n✅ Cloud work completed")

    // ======================================================================
    // Step 3: Reclaim back to local
    // ======================================================================
    console.log("\n🏠 Step 3: Reclaim work back to local")
    console.log("-".repeat(40))

    const reclaimResult = await manager.reclaimWithSnapshot(
      cloudSandbox,
      "local-container"
    )

    if (reclaimResult.success) {
      console.log(`\n✅ Reclaim successful!`)
      console.log(`   New local sandbox: ${reclaimResult.newSandbox?.id}`)

      // Verify files
      const files = await reclaimResult.newSandbox!.listFiles("/")
      console.log(`   Files restored: ${files.join(", ")}`)

      console.log("\n✅ Full handoff cycle completed!")
    } else {
      console.log(`\n❌ Reclaim failed: ${reclaimResult.error}`)
    }
  } else {
    console.log(`\n❌ Delegation failed: ${delegateResult.error}`)
  }

  console.log("\n" + "=".repeat(60))
  console.log("Test Complete")
  console.log("=".repeat(60))
}

// Run the test
testHandoff().catch(console.error)
