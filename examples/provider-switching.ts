#!/usr/bin/env bun
/**
 * Provider Switching Example
 *
 * Demonstrates how to configure multiple AI providers and switch between them.
 * Useful when you hit rate limits on one provider and want to failover.
 *
 * Usage:
 *   bun run examples/provider-switching.ts
 *
 * Environment variables needed (at least one):
 *   ANTHROPIC_API_KEY     - Direct Anthropic API
 *   AWS_PROFILE           - AWS Bedrock (with AWS_REGION)
 *   VERTEX_PROJECT_ID     - Google Vertex AI
 */

import { Sandbox } from "@e2b/code-interpreter"
import "dotenv/config"

// Provider configurations based on available env vars
const providers = {
  anthropic: process.env.ANTHROPIC_API_KEY
    ? {
        provider: "anthropic" as const,
        apiKey: process.env.ANTHROPIC_API_KEY,
      }
    : null,

  bedrock: process.env.AWS_PROFILE
    ? {
        provider: "bedrock" as const,
        profile: process.env.AWS_PROFILE,
        region: process.env.AWS_REGION || "us-west-2",
      }
    : null,

  vertex: process.env.VERTEX_PROJECT_ID
    ? {
        provider: "vertex" as const,
        projectId: process.env.VERTEX_PROJECT_ID,
        region: process.env.VERTEX_REGION || "global",
      }
    : null,
}

// Get available providers
const availableProviders = Object.entries(providers)
  .filter(([_, config]) => config !== null)
  .map(([name, config]) => ({ name, config: config! }))

if (availableProviders.length === 0) {
  console.error("No providers configured. Set at least one of:")
  console.error("  ANTHROPIC_API_KEY")
  console.error("  AWS_PROFILE + AWS_REGION")
  console.error("  VERTEX_PROJECT_ID")
  process.exit(1)
}

console.log(`Available providers: ${availableProviders.map((p) => p.name).join(", ")}`)

// Helper to convert provider config to env vars
function providerToEnv(config: (typeof availableProviders)[0]["config"]): Record<string, string> {
  switch (config.provider) {
    case "anthropic":
      return { ANTHROPIC_API_KEY: config.apiKey }
    case "bedrock":
      const env: Record<string, string> = { AWS_REGION: config.region }
      if (config.profile) env.AWS_PROFILE = config.profile
      return env
    case "vertex":
      return {
        ANTHROPIC_VERTEX_PROJECT_ID: config.projectId,
        CLOUD_ML_REGION: config.region || "global",
      }
    default:
      return {}
  }
}

async function runWithProvider(
  sbx: Sandbox,
  prompt: string,
  providerConfig: (typeof availableProviders)[0]["config"]
): Promise<{ output: string; exitCode: number }> {
  const envMap = providerToEnv(providerConfig)
  const envPrefix = Object.entries(envMap)
    .map(([k, v]) => `${k}='${v}'`)
    .join(" ")

  const escapedPrompt = prompt.replace(/'/g, "'\\''")
  const command = `${envPrefix} echo '${escapedPrompt}' | claude -p --dangerously-skip-permissions`

  console.log(`Running with ${providerConfig.provider}...`)
  const result = await sbx.commands.run(command, { timeoutMs: 60_000 })

  return {
    output: result.stdout + (result.stderr ? `\n${result.stderr}` : ""),
    exitCode: result.exitCode,
  }
}

async function runWithFallback(
  sbx: Sandbox,
  prompt: string
): Promise<{ output: string; exitCode: number; usedProvider: string }> {
  for (const { name, config } of availableProviders) {
    try {
      const result = await runWithProvider(sbx, prompt, config)

      // Check for rate limit errors
      if (result.output.includes("rate limit") || result.output.includes("429")) {
        console.log(`${name} hit rate limit, trying next provider...`)
        continue
      }

      if (result.exitCode === 0) {
        return { ...result, usedProvider: name }
      }

      // Non-zero exit but not rate limit - might be auth error
      if (result.output.includes("Invalid API key") || result.output.includes("unauthorized")) {
        console.log(`${name} auth failed, trying next provider...`)
        continue
      }

      // Other error - return it
      return { ...result, usedProvider: name }
    } catch (error: any) {
      console.log(`${name} failed: ${error.message}, trying next provider...`)
      continue
    }
  }

  return {
    output: "All providers exhausted",
    exitCode: 1,
    usedProvider: "none",
  }
}

async function main() {
  console.log("Creating E2B sandbox...")
  const sbx = await Sandbox.create("anthropic-claude-code", {
    apiKey: process.env.E2B_API_KEY!,
    timeoutMs: 5 * 60 * 1000,
  })
  console.log(`Sandbox: ${sbx.sandboxId}`)

  try {
    // Simple test prompt
    const prompt = "What is 2 + 2? Reply with just the number."

    console.log("\n--- Running with automatic failover ---")
    const result = await runWithFallback(sbx, prompt)

    console.log(`\nUsed provider: ${result.usedProvider}`)
    console.log(`Exit code: ${result.exitCode}`)
    console.log(`Output: ${result.output.slice(0, 500)}`)

    // Demonstrate explicit provider switching
    if (availableProviders.length > 1) {
      console.log("\n--- Explicit provider switching ---")
      for (const { name, config } of availableProviders) {
        console.log(`\nSwitching to ${name}...`)
        const r = await runWithProvider(sbx, "Say hello in one word", config)
        console.log(`  Result: ${r.output.slice(0, 100)}`)
      }
    }
  } finally {
    console.log("\nCleaning up...")
    await sbx.kill()
  }
}

main().catch(console.error)
