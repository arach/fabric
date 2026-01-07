#!/usr/bin/env bun
/**
 * Example: Run Claude Code Inside a Fabric Sandbox
 *
 * This demonstrates running Claude Code (the AI agent) inside an isolated sandbox,
 * following the pattern from E2B's guide:
 * https://www.e2b.dev/blog/javascript-guide-run-claude-code-in-an-e2b-sandbox
 *
 * The pattern:
 * 1. Create a sandbox with Claude Code installed
 * 2. Pass ANTHROPIC_API_KEY to the sandbox
 * 3. Run Claude non-interactively: echo 'prompt' | claude -p --dangerously-skip-permissions
 * 4. Files created by Claude persist in the sandbox
 * 5. Optionally delegate to E2B cloud for longer tasks
 *
 * Usage:
 *   E2B_API_KEY=xxx ANTHROPIC_API_KEY=xxx bun run examples/claude-in-sandbox.ts
 */

import { Sandbox } from "@e2b/code-interpreter"
import "dotenv/config"

// ============================================================================
// Configuration
// ============================================================================

const E2B_API_KEY = process.env.E2B_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL

if (!E2B_API_KEY) {
  console.log("⚠️  E2B_API_KEY not set - will use mock sandbox")
}

if (!ANTHROPIC_API_KEY) {
  console.log("⚠️  ANTHROPIC_API_KEY not set - Claude Code won't work")
}

if (ANTHROPIC_BASE_URL) {
  console.log(`📡 Using custom API endpoint: ${ANTHROPIC_BASE_URL}`)
}

// ============================================================================
// E2B Sandbox with Claude Code
// ============================================================================

async function runWithE2B() {
  console.log("=" .repeat(70))
  console.log("  Running Claude Code in E2B Sandbox")
  console.log("=" .repeat(70))
  console.log()

  // Create sandbox with E2B's Claude Code template
  console.log("📦 Creating E2B sandbox with Claude Code template...")
  const envs: Record<string, string> = {
    ANTHROPIC_API_KEY: ANTHROPIC_API_KEY!,
  }
  if (ANTHROPIC_BASE_URL) {
    envs.ANTHROPIC_BASE_URL = ANTHROPIC_BASE_URL
  }
  const sbx = await Sandbox.create("anthropic-claude-code", {
    apiKey: E2B_API_KEY,
    envs,
  })

  console.log(`  ✓ Sandbox created: ${sbx.sandboxId}`)
  console.log()

  try {
    // Give Claude a mission
    const mission = "Create a simple TypeScript function that calculates fibonacci numbers and save it to fibonacci.ts"

    console.log("🤖 Sending mission to Claude Code...")
    console.log(`  Mission: "${mission}"`)
    console.log()

    // Run Claude non-interactively
    // -p = print mode (no interactive UI)
    // --dangerously-skip-permissions = skip permission prompts
    const result = await sbx.commands.run(
      `echo '${mission}' | claude -p --dangerously-skip-permissions`,
      { timeoutMs: 120_000 } // 2 minute timeout for Claude to work
    )

    console.log("📝 Claude's response:")
    console.log("-".repeat(50))
    console.log(result.stdout)
    if (result.stderr) {
      console.log("Stderr:", result.stderr)
    }
    console.log("-".repeat(50))
    console.log()

    // Check what files Claude created
    console.log("📂 Files in sandbox:")
    const files = await sbx.commands.run("ls -la")
    console.log(files.stdout)

    // Read the file Claude created
    console.log("📄 Contents of fibonacci.ts:")
    const content = await sbx.files.read("fibonacci.ts")
    console.log(content)

  } finally {
    console.log("🧹 Cleaning up...")
    await sbx.kill()
    console.log("  ✓ Sandbox destroyed")
  }
}

// ============================================================================
// Mock Demo (when E2B_API_KEY not available)
// ============================================================================

async function runMockDemo() {
  console.log("=" .repeat(70))
  console.log("  Claude Code in Sandbox - Mock Demo")
  console.log("  (Set E2B_API_KEY and ANTHROPIC_API_KEY for real execution)")
  console.log("=" .repeat(70))
  console.log()

  console.log("📦 Creating sandbox...")
  console.log("  ✓ Using E2B template: anthropic-claude-code")
  console.log("  ✓ ANTHROPIC_API_KEY injected into sandbox environment")
  console.log()

  const mission = "Create a simple TypeScript function that calculates fibonacci numbers"

  console.log("🤖 Sending mission to Claude Code...")
  console.log(`  Mission: "${mission}"`)
  console.log()

  console.log("  Command executed in sandbox:")
  console.log(`    echo '${mission}' | claude -p --dangerously-skip-permissions`)
  console.log()

  // Simulate Claude's response
  console.log("📝 [Simulated] Claude's work:")
  console.log("-".repeat(50))
  console.log(`
Claude Code is analyzing the request...
Creating fibonacci.ts...
Writing function implementation...
Done!
  `.trim())
  console.log("-".repeat(50))
  console.log()

  console.log("📄 [Simulated] fibonacci.ts created:")
  console.log("-".repeat(50))
  console.log(`
/**
 * Calculate the nth Fibonacci number
 */
export function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}

// Optimized version with memoization
export function fibonacciMemo(n: number, memo: Map<number, number> = new Map()): number {
  if (n <= 1) return n
  if (memo.has(n)) return memo.get(n)!

  const result = fibonacciMemo(n - 1, memo) + fibonacciMemo(n - 2, memo)
  memo.set(n, result)
  return result
}

// Test
console.log("fibonacci(10) =", fibonacci(10))
console.log("fibonacciMemo(50) =", fibonacciMemo(50))
  `.trim())
  console.log("-".repeat(50))
  console.log()

  console.log("=" .repeat(70))
  console.log("  Key Concepts:")
  console.log("  1. E2B provides isolated sandbox with Claude Code pre-installed")
  console.log("  2. ANTHROPIC_API_KEY passed as environment variable")
  console.log("  3. Claude runs non-interactively with -p flag")
  console.log("  4. Files persist in sandbox filesystem")
  console.log("  5. Sandbox destroyed after completion")
  console.log("=" .repeat(70))
}

// ============================================================================
// Fabric Integration Pattern
// ============================================================================

console.log(`
┌────────────────────────────────────────────────────────────────────────┐
│                    Fabric + Claude Code Integration                      │
├────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   External App                                                           │
│       │                                                                  │
│       ▼                                                                  │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                     Fabric SDK                                    │   │
│   │                                                                   │   │
│   │   createSession({ workspacePath, runtime: "local" | "cloud" })   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│       │                                                                  │
│       ├─────────────────────┬─────────────────────┐                     │
│       ▼                     ▼                     ▼                     │
│   ┌─────────┐         ┌─────────┐         ┌─────────────┐              │
│   │  Local  │ ──────▶ │  E2B    │ ──────▶ │   E2B       │              │
│   │Container│ delegate│ Sandbox │ (or)    │Claude Code  │              │
│   └─────────┘         └─────────┘         │  Template   │              │
│       │                     │             └─────────────┘              │
│       │                     │                   │                       │
│       ▼                     ▼                   ▼                       │
│   Workspace mounted    Files synced      Claude runs autonomously      │
│   at /workspace        via snapshot      in isolated environment       │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
`)

// ============================================================================
// Main
// ============================================================================

async function main() {
  if (E2B_API_KEY && ANTHROPIC_API_KEY) {
    await runWithE2B()
  } else {
    await runMockDemo()
  }
}

main().catch(console.error)
