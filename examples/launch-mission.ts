#!/usr/bin/env bun
/**
 * Example: Launch a Fabric Mission from an External Application
 *
 * This demonstrates the core use case:
 * 1. External app initializes Fabric
 * 2. Creates a session with a workspace directory
 * 3. Runs agent commands in the sandbox
 * 4. Delegates to cloud (E2B) when needed
 * 5. Reclaims back to local
 *
 * Usage:
 *   bun run examples/launch-mission.ts
 *   bun run examples/launch-mission.ts /path/to/workspace
 */

import { Fabric, type FabricSessionEvent } from "@fabric/core"
// import {
//   LocalContainerSandboxFactory,
//   ContainerDaemonRuntime,
// } from "@fabric/runtime-local"
// import { E2BSandboxFactory } from "@fabric/runtime-e2b"  // Uncomment if E2B_API_KEY is set

// Note: Local containers require vmnet permissions. Using mock factories for demo.
// To use real containers, you need to codesign with com.apple.vm.networking entitlement.

// ============================================================================
// Configuration
// ============================================================================

const WORKSPACE_PATH = process.argv[2] || "/Users/arach/dev/fabric/sandbox-alpha"

// ============================================================================
// Mock E2B Factory (for testing without API key)
// ============================================================================

import type { Sandbox, SandboxSnapshot, SandboxFactory, RuntimeType } from "@fabric/core"

class MockE2BSandbox implements Sandbox {
  readonly id: string
  readonly runtimeType: RuntimeType = "e2b"
  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private files: Map<string, string> = new Map()

  constructor(id: string, initialFiles?: Map<string, string>) {
    this.id = id
    if (initialFiles) {
      this.files = new Map(initialFiles)
    }
  }

  get status() { return this._status }
  get ipAddress() { return "cloud.e2b.dev" }

  async start() {
    this._status = "running"
    console.log(`    ☁️  [E2B] Sandbox ${this.id} started in cloud`)
  }

  async stop() {
    this._status = "stopped"
    console.log(`    ☁️  [E2B] Sandbox ${this.id} stopped`)
  }

  async exec(command: string) {
    console.log(`    ☁️  [E2B] Executing: ${command}`)
    // Simulate cloud execution
    await Bun.sleep(100)
    return { stdout: `[cloud] ${command} completed`, stderr: "", exitCode: 0 }
  }

  async runCode(code: string) {
    console.log(`    ☁️  [E2B] Running code...`)
    return { output: "[cloud] Code executed" }
  }

  async writeFile(path: string, content: string | Buffer) {
    this.files.set(path, content.toString())
  }

  async readFile(path: string) {
    return this.files.get(path) || ""
  }

  async listFiles(path: string) {
    return Array.from(this.files.keys())
  }

  async snapshot(): Promise<SandboxSnapshot> {
    const files = Array.from(this.files.entries()).map(([path, content]) => ({
      path,
      content: Buffer.from(content).toString("base64"),
      encoding: "base64" as const,
    }))
    return {
      id: this.id,
      timestamp: new Date().toISOString(),
      workspacePath: "/workspace",
      files,
    }
  }

  async restore(snapshot: SandboxSnapshot) {
    this.files.clear()
    for (const file of snapshot.files) {
      const content = file.encoding === "base64"
        ? Buffer.from(file.content, "base64").toString()
        : file.content
      this.files.set(file.path, content)
    }
    console.log(`    ☁️  [E2B] Restored ${snapshot.files.length} files`)
  }

  async delegate(targetRuntime: RuntimeType) {
    const snapshot = await this.snapshot()
    await this.stop()
    return { token: `e2b:${this.id}:${Date.now()}`, snapshot }
  }

  async reclaim(token: string, snapshot: SandboxSnapshot) {
    if (this._status !== "running") await this.start()
    await this.restore(snapshot)
  }
}

class MockE2BSandboxFactory implements SandboxFactory {
  private sandboxes = new Map<string, MockE2BSandbox>()

  async create(options: { id?: string; workspacePath?: string }) {
    const id = options.id || `e2b-${Date.now()}`
    const sandbox = new MockE2BSandbox(id)
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
// Mock Local Sandbox (simulates local container when vmnet not available)
// ============================================================================

class MockLocalSandbox implements Sandbox {
  readonly id: string
  readonly runtimeType: RuntimeType = "local-container"
  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private files: Map<string, string> = new Map()
  private workspacePath: string

  constructor(id: string, workspacePath: string) {
    this.id = id
    this.workspacePath = workspacePath
    // Load initial files from workspace if it exists
    this.loadWorkspaceFiles()
  }

  private loadWorkspaceFiles() {
    try {
      const fs = require("fs")
      const path = require("path")
      if (fs.existsSync(this.workspacePath)) {
        const entries = fs.readdirSync(this.workspacePath)
        for (const entry of entries) {
          const fullPath = path.join(this.workspacePath, entry)
          const stat = fs.statSync(fullPath)
          if (stat.isFile()) {
            this.files.set(entry, fs.readFileSync(fullPath, "utf8"))
          }
        }
      }
    } catch {
      // Ignore errors loading workspace
    }
  }

  get status() { return this._status }
  get ipAddress() { return "192.168.64.2" }

  async start() {
    this._status = "running"
    console.log(`    🖥️  [Local] Sandbox ${this.id} started`)
  }

  async stop() {
    this._status = "stopped"
    console.log(`    🖥️  [Local] Sandbox ${this.id} stopped`)
  }

  async exec(command: string) {
    console.log(`    🖥️  [Local] Executing: ${command}`)
    // Simulate local execution
    await Bun.sleep(50)
    return { stdout: `[local] ${command} completed`, stderr: "", exitCode: 0 }
  }

  async runCode(code: string) {
    console.log(`    🖥️  [Local] Running code...`)
    return { output: "[local] Code executed" }
  }

  async writeFile(path: string, content: string | Buffer) {
    this.files.set(path, content.toString())
    console.log(`    🖥️  [Local] Wrote file: ${path}`)
  }

  async readFile(path: string) {
    return this.files.get(path) || ""
  }

  async listFiles(path: string) {
    return Array.from(this.files.keys())
  }

  async snapshot(): Promise<SandboxSnapshot> {
    const files = Array.from(this.files.entries()).map(([path, content]) => ({
      path,
      content: Buffer.from(content).toString("base64"),
      encoding: "base64" as const,
    }))
    console.log(`    🖥️  [Local] Created snapshot with ${files.length} files`)
    return {
      id: this.id,
      timestamp: new Date().toISOString(),
      workspacePath: this.workspacePath,
      files,
    }
  }

  async restore(snapshot: SandboxSnapshot) {
    this.files.clear()
    for (const file of snapshot.files) {
      const content = file.encoding === "base64"
        ? Buffer.from(file.content, "base64").toString()
        : file.content
      this.files.set(file.path, content)
    }
    console.log(`    🖥️  [Local] Restored ${snapshot.files.length} files`)
  }

  async delegate(targetRuntime: RuntimeType) {
    const snapshot = await this.snapshot()
    await this.stop()
    return { token: `local:${this.id}:${Date.now()}`, snapshot }
  }

  async reclaim(token: string, snapshot: SandboxSnapshot) {
    if (this._status !== "running") await this.start()
    await this.restore(snapshot)
  }
}

class MockLocalSandboxFactory implements SandboxFactory {
  private sandboxes = new Map<string, MockLocalSandbox>()

  async create(options: { id?: string; workspacePath?: string }) {
    const id = options.id || `local-${Date.now()}`
    const sandbox = new MockLocalSandbox(id, options.workspacePath || "/tmp")
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
// Main
// ============================================================================

async function main() {
  console.log("=" .repeat(70))
  console.log("  Fabric Mission Launch Demo")
  console.log("  Simulating: External App → Local Container → E2B Cloud → Local")
  console.log("=" .repeat(70))
  console.log()
  console.log(`  Workspace: ${WORKSPACE_PATH}`)
  console.log()

  // ========================================================================
  // Step 1: Initialize Fabric SDK
  // ========================================================================
  console.log("📦 Step 1: Initialize Fabric SDK")
  console.log("-".repeat(50))

  const fabric = new Fabric()

  // Register local container factory (using mock due to vmnet permissions)
  // To use real containers, codesign with com.apple.vm.networking entitlement
  const localFactory = new MockLocalSandboxFactory()
  fabric.registerLocalFactory(localFactory)

  // Register cloud factory (mock for demo, real E2B if API key available)
  const cloudFactory = new MockE2BSandboxFactory()
  // const cloudFactory = new E2BSandboxFactory()  // Use this if E2B_API_KEY is set
  fabric.registerCloudFactory(cloudFactory)

  console.log("  ✓ Local factory registered (Mock - vmnet requires special entitlements)")
  console.log("  ✓ Cloud factory registered (Mock E2B)")
  console.log()

  // ========================================================================
  // Step 2: Create a Fabric Session
  // ========================================================================
  console.log("🚀 Step 2: Create Fabric Session")
  console.log("-".repeat(50))

  const session = await fabric.createSession({
    workspacePath: WORKSPACE_PATH,
    runtime: "local",
    image: "oven/bun:latest",
    onEvent: (event: FabricSessionEvent) => {
      console.log(`    📢 ${event.type}`, event.data || "")
    },
  })

  console.log(`  ✓ Session created: ${session.id}`)
  console.log(`  ✓ Runtime: ${session.currentRuntime}`)
  console.log(`  ✓ Workspace mounted at /workspace`)
  console.log()

  // ========================================================================
  // Step 3: Execute Agent Commands (Local)
  // ========================================================================
  console.log("🤖 Step 3: Execute Agent Commands (Local)")
  console.log("-".repeat(50))

  // Simulate an agent doing work
  console.log("  Agent: Checking workspace contents...")
  const files = await session.listFiles("/workspace")
  console.log(`    Found files: ${files.join(", ") || "(empty)"}`)

  console.log("  Agent: Creating a test file...")
  await session.writeFile("agent-output.txt", `
Agent Session Log
=================
Session ID: ${session.id}
Runtime: ${session.currentRuntime}
Started: ${new Date().toISOString()}
Workspace: ${WORKSPACE_PATH}

This file was created by the Fabric agent running in a local container.
`.trim())

  console.log("  Agent: Running a command...")
  const result = await session.exec("ls -la /workspace")
  console.log(`    Exit code: ${result.exitCode}`)
  console.log(`    Duration: ${result.duration}ms`)

  console.log("  Agent: Running some code...")
  const codeResult = await session.runCode(`
    console.log("Hello from the sandbox!")
    console.log("Runtime:", "${session.currentRuntime}")
  `)
  console.log(`    Output: ${codeResult.output.slice(0, 100)}...`)
  console.log()

  // ========================================================================
  // Step 4: Delegate to Cloud (E2B)
  // ========================================================================
  console.log("☁️  Step 4: Delegate to Cloud (E2B)")
  console.log("-".repeat(50))
  console.log("  Scenario: Local resources constrained, delegating to cloud...")

  await session.delegateToCloud()

  console.log(`  ✓ Delegation complete!`)
  console.log(`  ✓ Now running on: ${session.currentRuntime}`)
  console.log()

  // ========================================================================
  // Step 5: Continue Work in Cloud
  // ========================================================================
  console.log("☁️  Step 5: Continue Work in Cloud")
  console.log("-".repeat(50))

  console.log("  Agent: Running cloud-intensive task...")
  const cloudResult = await session.exec("echo 'Heavy computation in cloud...' && sleep 1")
  console.log(`    Exit code: ${cloudResult.exitCode}`)

  console.log("  Agent: Updating output file...")
  const currentContent = await session.readFile("agent-output.txt")
  await session.writeFile("agent-output.txt", currentContent + `\n
Cloud Processing
================
Delegated at: ${new Date().toISOString()}
Cloud runtime: ${session.currentRuntime}
Cloud work completed successfully.
`)
  console.log()

  // ========================================================================
  // Step 6: Reclaim Back to Local
  // ========================================================================
  console.log("🏠 Step 6: Reclaim Back to Local")
  console.log("-".repeat(50))
  console.log("  Scenario: User returning to local machine, reclaiming work...")

  await session.reclaimToLocal()

  console.log(`  ✓ Reclaim complete!`)
  console.log(`  ✓ Now running on: ${session.currentRuntime}`)
  console.log()

  // ========================================================================
  // Step 7: Verify State
  // ========================================================================
  console.log("✅ Step 7: Verify State")
  console.log("-".repeat(50))

  const finalFiles = await session.listFiles("/workspace")
  console.log(`  Files in workspace: ${finalFiles.join(", ")}`)

  const agentOutput = await session.readFile("agent-output.txt")
  console.log(`  Agent output file contents:`)
  console.log("  " + "-".repeat(40))
  for (const line of agentOutput.split("\n").slice(0, 10)) {
    console.log(`    ${line}`)
  }
  console.log("    ...")
  console.log()

  // ========================================================================
  // Cleanup
  // ========================================================================
  console.log("🧹 Cleanup")
  console.log("-".repeat(50))
  await session.stop()
  console.log("  ✓ Session stopped")
  console.log()

  console.log("=" .repeat(70))
  console.log("  Mission Complete!")
  console.log("=" .repeat(70))
}

main().catch((error) => {
  console.error("Mission failed:", error)
  process.exit(1)
})
