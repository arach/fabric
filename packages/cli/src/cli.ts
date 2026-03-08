#!/usr/bin/env node
/**
 * Fabric CLI
 *
 * Ambient compute for Claude Code agents
 */

import { parseArgs } from "node:util"
import type { SandboxFactory, Sandbox } from "fabric-ai-core"

const version = "0.1.1"

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
}

const c = (color: keyof typeof colors, text: string) =>
  `${colors[color]}${text}${colors.reset}`

type Provider = "daytona" | "e2b" | "exe"

const PROVIDERS: Provider[] = ["daytona", "e2b", "exe"]

// Help text
const helpText = `
${c("bold", "Fabric CLI")} ${c("dim", `v${version}`)}
${c("cyan", "Ambient compute for Claude Code agents")}

${c("bold", "USAGE")}
  ${c("green", "fabric")} <command> [options]

${c("bold", "COMMANDS")}
  ${c("green", "create")}     Create a new sandbox
  ${c("green", "exec")}       Execute a command in a sandbox
  ${c("green", "run")}        Run code in a sandbox
  ${c("green", "list")}       List active sandboxes
  ${c("green", "stop")}       Stop a sandbox
  ${c("green", "config")}     Manage configuration

${c("bold", "OPTIONS")}
  ${c("yellow", "-p, --provider")}  Provider to use (daytona, e2b, exe)
  ${c("yellow", "-l, --language")}  Language for sandbox (typescript, python, go, rust)
  ${c("yellow", "-h, --help")}      Show this help message
  ${c("yellow", "-v, --version")}   Show version number

${c("bold", "EXAMPLES")}
  ${c("dim", "# Create a Daytona sandbox")}
  fabric create --provider daytona

  ${c("dim", "# Execute a command")}
  fabric exec "echo Hello World"

  ${c("dim", "# Run TypeScript code")}
  fabric run --language typescript "console.log('Hello')"

  ${c("dim", "# List sandboxes")}
  fabric list

${c("bold", "ENVIRONMENT VARIABLES")}
  ${c("yellow", "DAYTONA_API_KEY")}     Daytona API key
  ${c("yellow", "E2B_API_KEY")}         E2B API key
  ${c("yellow", "ANTHROPIC_API_KEY")}   Anthropic API key (for Claude Code)

${c("bold", "DOCUMENTATION")}
  https://fabric.arach.dev/docs

${c("bold", "GITHUB")}
  https://github.com/arach/fabric
`

/**
 * Resolve a provider name to a SandboxFactory instance.
 * Validates required credentials and dynamically imports the provider package.
 */
async function resolveFactory(
  provider: Provider,
  options?: { language?: string }
): Promise<SandboxFactory> {
  switch (provider) {
    case "daytona": {
      const apiKey = process.env.DAYTONA_API_KEY
      if (!apiKey) {
        console.error(c("red", "Error: DAYTONA_API_KEY not set"))
        console.log(c("dim", "Get your API key from https://app.daytona.io"))
        process.exit(1)
      }
      const { DaytonaSandboxFactory } = await import("fabric-ai-daytona")
      return new DaytonaSandboxFactory({
        apiKey,
        defaultLanguage: (options?.language as any) || "typescript",
      })
    }

    case "e2b": {
      const apiKey = process.env.E2B_API_KEY
      if (!apiKey) {
        console.error(c("red", "Error: E2B_API_KEY not set"))
        console.log(c("dim", "Get your API key from https://e2b.dev/dashboard"))
        process.exit(1)
      }
      const { E2BSandboxFactory } = await import("fabric-ai-e2b")
      return new E2BSandboxFactory(apiKey)
    }

    case "exe": {
      const { ExeSandboxFactory } = await import("fabric-ai-exe")
      return new ExeSandboxFactory()
    }

    default:
      console.error(c("red", `Unknown provider: ${provider}`))
      console.log(c("dim", `Available providers: ${PROVIDERS.join(", ")}`))
      process.exit(1)
  }
}

function validateProvider(provider: string): Provider {
  if (!PROVIDERS.includes(provider as Provider)) {
    console.error(c("red", `Unknown provider: ${provider}`))
    console.log(c("dim", `Available providers: ${PROVIDERS.join(", ")}`))
    process.exit(1)
  }
  return provider as Provider
}

// Parse command line arguments
function parseCliArgs() {
  try {
    const { values, positionals } = parseArgs({
      allowPositionals: true,
      options: {
        provider: { type: "string", short: "p" },
        language: { type: "string", short: "l" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
        id: { type: "string" },
      },
    })

    return { values, positionals }
  } catch (error) {
    console.error(c("red", `Error: ${(error as Error).message}`))
    process.exit(1)
  }
}

// Commands
async function cmdCreate(options: {
  provider?: string
  language?: string
}) {
  const provider = validateProvider(options.provider || "daytona")
  const language = options.language || "typescript"

  console.log(c("cyan", `Creating ${provider} sandbox...`))

  const factory = await resolveFactory(provider, { language })
  const sandbox = await factory.create({})

  console.log(c("green", `✓ Sandbox created: ${sandbox.id}`))
  console.log(c("dim", `  Provider: ${provider}`))
  console.log(c("dim", `  Language: ${language}`))
  console.log(c("dim", `  Status: ${sandbox.status}`))
  console.log()
  console.log(c("cyan", "Next: Run commands with"))
  console.log(c("yellow", `  fabric exec --provider ${provider} --id ${sandbox.id} "your command"`))
}

async function cmdExec(command: string, options: { id?: string; provider?: string }) {
  const provider = validateProvider(options.provider || "daytona")

  console.log(c("cyan", `Executing in ${provider} sandbox...`))
  console.log(c("dim", `$ ${command}`))
  console.log()

  const factory = await resolveFactory(provider)
  const sandbox = await factory.create({})

  try {
    const result = await sandbox.exec(command)
    if (result.stdout) console.log(result.stdout)
    if (result.stderr) console.error(c("red", result.stderr))
    process.exit(result.exitCode)
  } finally {
    await sandbox.stop()
  }
}

async function cmdRun(code: string, options: { language?: string; provider?: string }) {
  const provider = validateProvider(options.provider || "daytona")
  const language = options.language || "typescript"

  console.log(c("cyan", `Running ${language} code in ${provider}...`))
  console.log()

  const factory = await resolveFactory(provider, { language })
  const sandbox = await factory.create({})

  try {
    const result = await sandbox.runCode!(code, language)
    if (result.output) console.log(result.output)
    if (result.error) console.error(c("red", result.error))
  } finally {
    await sandbox.stop()
  }
}

async function cmdList(options: { provider?: string }) {
  const provider = validateProvider(options.provider || "daytona")

  console.log(c("cyan", `Listing ${provider} sandboxes...`))
  console.log()

  const factory = await resolveFactory(provider)
  const sandboxes = await factory.list()

  if (sandboxes.length === 0) {
    console.log(c("dim", "No active sandboxes"))
    return
  }

  for (const sb of sandboxes) {
    const statusColor = sb.status === "running" ? "green" : "dim"
    console.log(`  ${c(statusColor, sb.status.padEnd(10))} ${sb.id}`)
  }
}

async function cmdStop(options: { id?: string; provider?: string }) {
  const provider = validateProvider(options.provider || "daytona")

  if (!options.id) {
    console.error(c("red", "Error: --id is required"))
    console.log(c("dim", "Usage: fabric stop --id <sandbox-id>"))
    process.exit(1)
  }

  console.log(c("cyan", `Stopping sandbox ${options.id}...`))

  const factory = await resolveFactory(provider)
  const sandbox = await factory.resume(options.id)

  if (!sandbox) {
    console.error(c("red", `Sandbox not found: ${options.id}`))
    process.exit(1)
  }

  await sandbox.stop()
  console.log(c("green", `✓ Sandbox stopped: ${options.id}`))
}

async function cmdConfig() {
  console.log(c("bold", "Fabric Configuration"))
  console.log()

  // API Keys
  const configs = [
    { name: "DAYTONA_API_KEY", value: process.env.DAYTONA_API_KEY },
    { name: "E2B_API_KEY", value: process.env.E2B_API_KEY },
    { name: "ANTHROPIC_API_KEY", value: process.env.ANTHROPIC_API_KEY },
  ]

  for (const config of configs) {
    const status = config.value
      ? c("green", "✓ Set")
      : c("red", "✗ Not set")
    const preview = config.value
      ? c("dim", ` (${config.value.substring(0, 8)}...)`)
      : ""
    console.log(`  ${config.name}: ${status}${preview}`)
  }

  // SSH Keys for exe.dev
  console.log()
  console.log(c("bold", "SSH Keys (for exe.dev)"))
  console.log()

  const { existsSync } = await import("fs")
  const { homedir } = await import("os")
  const { join } = await import("path")

  const sshKeys = [
    join(homedir(), ".ssh", "id_ed25519"),
    join(homedir(), ".ssh", "id_rsa"),
  ]

  let foundKey = false
  for (const keyPath of sshKeys) {
    if (existsSync(keyPath)) {
      console.log(`  ${c("green", "✓")} ${keyPath}`)
      foundKey = true
      break
    }
  }

  if (!foundKey) {
    console.log(`  ${c("red", "✗")} No SSH key found`)
    console.log(c("dim", "    Generate one with: ssh-keygen -t ed25519"))
  }

  console.log()
  console.log(c("dim", "API keys: Set in your shell profile or .env file"))
  console.log(c("dim", "exe.dev: Uses your SSH key (~/.ssh/id_ed25519)"))
}

// Main
async function main() {
  const { values, positionals } = parseCliArgs()

  // Handle flags
  if (values.version) {
    console.log(version)
    process.exit(0)
  }

  if (values.help || positionals.length === 0) {
    console.log(helpText)
    process.exit(0)
  }

  // Handle commands
  const [command, ...args] = positionals

  switch (command) {
    case "create":
      await cmdCreate({
        provider: values.provider,
        language: values.language,
      })
      break

    case "exec":
      if (args.length === 0) {
        console.error(c("red", "Error: No command specified"))
        console.log(c("dim", "Usage: fabric exec \"your command\""))
        process.exit(1)
      }
      await cmdExec(args.join(" "), {
        id: values.id,
        provider: values.provider,
      })
      break

    case "run":
      if (args.length === 0) {
        console.error(c("red", "Error: No code specified"))
        console.log(c("dim", "Usage: fabric run \"console.log('hello')\""))
        process.exit(1)
      }
      await cmdRun(args.join(" "), {
        language: values.language,
        provider: values.provider,
      })
      break

    case "config":
      await cmdConfig()
      break

    case "list":
      await cmdList({ provider: values.provider })
      break

    case "stop":
      await cmdStop({ id: values.id, provider: values.provider })
      break

    default:
      console.error(c("red", `Unknown command: ${command}`))
      console.log(c("dim", "Run 'fabric --help' for available commands"))
      process.exit(1)
  }
}

main().catch((error) => {
  console.error(c("red", `Error: ${error.message}`))
  process.exit(1)
})
