#!/usr/bin/env bun
/**
 * Unified Sandbox Example
 *
 * Tests both E2B and Daytona through the same Sandbox interface
 */

import type { Sandbox, SandboxFactory } from "@fabric/core"
import { E2BSandboxFactory } from "@fabric/runtime-e2b"
import { DaytonaSandboxFactory } from "@fabric/runtime-daytona"
import "dotenv/config"

const E2B_API_KEY = process.env.E2B_API_KEY
const DAYTONA_API_KEY = process.env.DAYTONA_API_KEY

async function testSandbox(name: string, sandbox: Sandbox) {
  console.log(`\n--- Testing ${name} ---`)
  console.log(`ID: ${sandbox.id}`)
  console.log(`Runtime: ${sandbox.runtimeType}`)
  console.log(`Status: ${sandbox.status}`)

  // Test exec
  console.log("\n[exec] Running command...")
  const execResult = await sandbox.exec("echo 'Hello from sandbox!'")
  console.log(`  stdout: ${execResult.stdout.trim()}`)
  console.log(`  exitCode: ${execResult.exitCode}`)

  // Test runCode
  if (sandbox.runCode) {
    console.log("\n[runCode] Running code...")
    const codeResult = await sandbox.runCode(`console.log("2 + 2 =", 2 + 2)`)
    console.log(`  output: ${codeResult.output.trim()}`)
    if (codeResult.error) console.log(`  error: ${codeResult.error}`)
  }

  // Test file system
  console.log("\n[fs] Writing file...")
  await sandbox.writeFile("/tmp/test.txt", "Hello from Fabric!")
  const content = await sandbox.readFile("/tmp/test.txt")
  console.log(`  read back: ${content}`)

  // Test listFiles
  console.log("\n[fs] Listing /tmp...")
  const files = await sandbox.listFiles("/tmp")
  console.log(`  files: ${files.slice(0, 5).join(", ")}${files.length > 5 ? "..." : ""}`)

  // Test snapshot
  console.log("\n[snapshot] Creating snapshot...")
  const snapshot = await sandbox.snapshot()
  console.log(`  snapshot id: ${snapshot.id}`)
  console.log(`  files captured: ${snapshot.files.length}`)

  console.log("\n[cleanup] Stopping sandbox...")
  await sandbox.stop()
  console.log(`  Status: ${sandbox.status}`)
}

async function main() {
  const factories: { name: string; factory: SandboxFactory }[] = []

  // Add available providers
  if (E2B_API_KEY) {
    factories.push({
      name: "E2B",
      factory: new E2BSandboxFactory(E2B_API_KEY),
    })
  } else {
    console.log("E2B_API_KEY not set, skipping E2B")
  }

  if (DAYTONA_API_KEY) {
    factories.push({
      name: "Daytona",
      factory: new DaytonaSandboxFactory({
        apiKey: DAYTONA_API_KEY,
        defaultLanguage: "typescript",
      }),
    })
  } else {
    console.log("DAYTONA_API_KEY not set, skipping Daytona")
  }

  if (factories.length === 0) {
    console.error("No providers configured. Set E2B_API_KEY or DAYTONA_API_KEY")
    process.exit(1)
  }

  console.log(`Testing ${factories.length} provider(s)...`)

  for (const { name, factory } of factories) {
    try {
      console.log(`\nCreating ${name} sandbox...`)
      const sandbox = await factory.create({})
      await testSandbox(name, sandbox)
    } catch (error) {
      console.error(`${name} failed:`, error)
    }
  }

  console.log("\n=== All tests complete ===")
}

main().catch(console.error)
