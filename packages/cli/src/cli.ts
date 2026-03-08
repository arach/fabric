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
  ${c("green", "setup")}      Set up local container runtime
  ${c("green", "shell")}     Drop into an interactive Linux shell
  ${c("green", "create")}     Create a new sandbox
  ${c("green", "exec")}       Execute a command in a sandbox
  ${c("green", "run")}        Run code in a sandbox
  ${c("green", "list")}       List active sandboxes
  ${c("green", "stop")}       Stop a sandbox
  ${c("green", "config")}     Manage configuration

${c("bold", "OPTIONS")}
  ${c("yellow", "-p, --provider")}  Provider to use (daytona, e2b, exe)
  ${c("yellow", "-l, --language")}  Language for sandbox (typescript, python, go, rust)
  ${c("yellow", "--image")}         Container image (for shell command)
  ${c("yellow", "-i, --interactive")}  Interactive mode (for setup)
  ${c("yellow", "-h, --help")}      Show this help message
  ${c("yellow", "-v, --version")}   Show version number

${c("bold", "EXAMPLES")}
  ${c("dim", "# Create a Daytona sandbox")}
  fabric create --provider daytona

  ${c("dim", "# Execute a command")}
  fabric exec "echo Hello World"

  ${c("dim", "# Run TypeScript code")}
  fabric run --language typescript "console.log('Hello')"

  ${c("dim", "# Drop into an Ubuntu shell")}
  fabric shell

  ${c("dim", "# Try Omarchy (Arch Linux)")}
  fabric shell --image omarchy

  ${c("dim", "# Set up local container runtime")}
  fabric setup

  ${c("dim", "# Set up with interactive image selection")}
  fabric setup --interactive

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
        image: { type: "string" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
        interactive: { type: "boolean", short: "i" },
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

// ── Shell command ─────────────────────────────────────────────────────

const SHELL_IMAGES: Record<string, { image: string; description: string }> = {
  ubuntu: { image: "ubuntu:latest", description: "Ubuntu Linux" },
  omarchy: { image: "lopsided/archlinux:latest", description: "Arch Linux (Omarchy base)" },
  arch: { image: "lopsided/archlinux:latest", description: "Arch Linux" },
  alpine: { image: "alpine:latest", description: "Alpine Linux (minimal)" },
  debian: { image: "debian:latest", description: "Debian Linux" },
  fedora: { image: "fedora:latest", description: "Fedora Linux" },
  bun: { image: "oven/bun:latest", description: "Bun runtime" },
  node: { image: "node:22", description: "Node.js 22" },
  python: { image: "python:3.12", description: "Python 3.12" },
}

async function cmdShell(options: { image?: string } = {}) {
  const { spawnSync } = await import("child_process")

  // Check container CLI is available
  const check = spawnSync("container", ["--version"], { stdio: "pipe" })
  if (check.status !== 0) {
    console.error(c("red", "Error: Apple container CLI not found"))
    console.log(c("dim", "Run 'fabric setup' to install it"))
    process.exit(1)
  }

  // Resolve image name
  let image: string
  let label: string

  if (!options.image || options.image === "ubuntu") {
    image = SHELL_IMAGES.ubuntu.image
    label = SHELL_IMAGES.ubuntu.description
  } else if (SHELL_IMAGES[options.image]) {
    image = SHELL_IMAGES[options.image].image
    label = SHELL_IMAGES[options.image].description
  } else {
    // Treat as a raw image reference
    image = options.image
    label = options.image
  }

  console.log(c("cyan", `Launching ${label}...`))
  console.log(c("dim", `Image: ${image}`))
  console.log(c("dim", "Exit with: exit or Ctrl+D"))
  console.log()

  // Run interactively — inherits stdio so user gets a live shell
  const result = spawnSync("container", ["run", "--rm", "-it", image, "sh", "-c",
    // Try bash first, fall back to sh
    "if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi"
  ], {
    stdio: "inherit",
  })

  if (result.status !== 0 && result.status !== null) {
    console.error(c("red", `Shell exited with code ${result.status}`))
    if (result.stderr) {
      console.error(c("dim", result.stderr.toString()))
    }
    process.exit(result.status)
  }

  console.log(c("dim", "Container stopped."))
}

// ── Setup command ──────────────────────────────────────────────────────

async function cmdSetup(options: { interactive?: boolean } = {}) {
  const { execSync, spawnSync } = await import("child_process")
  const { existsSync, mkdirSync, symlinkSync, readlinkSync, realpathSync } =
    await import("fs")
  const { homedir, platform, arch } = await import("os")
  const { join, dirname } = await import("path")

  const has = (cmd: string) => {
    try {
      execSync(`command -v ${cmd}`, { stdio: "ignore" })
      return true
    } catch {
      return false
    }
  }

  const run = (cmd: string, opts?: { silent?: boolean }) => {
    try {
      return execSync(cmd, {
        stdio: opts?.silent ? "pipe" : "inherit",
        encoding: "utf8",
      })
    } catch (e: any) {
      return e.stdout || ""
    }
  }

  const info = (msg: string) => console.log(`${c("blue", "=>")} ${msg}`)
  const ok = (msg: string) => console.log(`${c("green", "✓")}  ${msg}`)
  const skip = (msg: string) =>
    console.log(`${c("dim", `–  ${msg} (already done)`)}`)
  const fail = (msg: string) => {
    console.error(`${c("red", "✗")}  ${msg}`)
    process.exit(1)
  }

  console.log()
  console.log(`${c("bold", "Fabric")} setup`)
  console.log()

  // ── Prerequisites ──────────────────────────────────────────────────

  if (platform() !== "darwin") {
    fail(
      "Local container runtime requires macOS. Cloud runtimes (Daytona, E2B, exe.dev) work on any platform."
    )
  }

  if (arch() !== "arm64") {
    fail("Apple Containerization framework requires Apple Silicon (arm64).")
  }

  if (!has("brew")) {
    fail("Homebrew is required. Install from https://brew.sh")
  }

  // ── Step 1: Bun ────────────────────────────────────────────────────

  if (!has("bun")) {
    info("Installing Bun...")
    run("brew install oven-sh/bun/bun")
    ok("Bun installed")
  }

  // ── Step 2: Dependencies ───────────────────────────────────────────

  // Find the project root by walking up from the CLI package
  // When running from source: we're in packages/cli/src/
  // When running as global: look for nearest package.json with workspaces
  let projectRoot = ""
  try {
    const result = run("git rev-parse --show-toplevel 2>/dev/null", {
      silent: true,
    })
    projectRoot = (result || "").trim()
  } catch {}

  if (projectRoot && existsSync(join(projectRoot, "package.json"))) {
    info("Installing dependencies...")
    run(`cd "${projectRoot}" && bun install`)
    ok("Dependencies installed")
  } else {
    info("Not in Fabric repo — skipping dependency install")
    projectRoot = ""
  }

  // ── Step 3: Apple container CLI ────────────────────────────────────

  if (has("container")) {
    skip("Apple container CLI")
  } else {
    info("Installing Apple container CLI...")
    run("brew install container")
    ok("Apple container CLI installed")
  }

  // ── Step 4: Linux kernel ───────────────────────────────────────────

  const kernelDir = join(
    homedir(),
    "Library",
    "Application Support",
    "com.apple.container",
    "kernels"
  )

  const findKernel = (): string | null => {
    try {
      const { readdirSync } = require("fs")
      const files = readdirSync(kernelDir) as string[]
      const kernel = files.find((f: string) => f.startsWith("vmlinux-"))
      return kernel ? join(kernelDir, kernel) : null
    } catch {
      return null
    }
  }

  let kernelPath = findKernel()

  if (kernelPath) {
    skip("Linux kernel")
  } else {
    info("Downloading Linux kernel...")
    run("container system kernel set --recommended")
    kernelPath = findKernel()
    if (!kernelPath) {
      fail("Kernel download succeeded but file not found")
    }
    ok("Linux kernel downloaded")
  }

  // ── Step 5: Build Swift binary ─────────────────────────────────────

  if (projectRoot) {
    const containerDir = join(
      projectRoot,
      "packages",
      "runtime-local",
      "FabricContainer"
    )
    const binaryPath = join(containerDir, ".build", "release", "fabric-container")

    if (existsSync(binaryPath)) {
      skip("FabricContainer Swift binary")
    } else if (existsSync(join(containerDir, "Package.swift"))) {
      info("Building FabricContainer (this takes a few minutes on first build)...")
      run(`cd "${containerDir}" && swift build -c release 2>&1 | tail -1`)
      ok("FabricContainer built")
    }

    // ── Step 6: Symlink kernel ─────────────────────────────────────

    if (kernelPath) {
      const binaryDir = join(
        containerDir,
        ".build",
        "arm64-apple-macosx",
        "release"
      )
      const binDir = join(projectRoot, "packages", "runtime-local", "bin")

      for (const dir of [binaryDir, binDir]) {
        const dest = join(dir, "vmlinux")
        if (!existsSync(dest)) {
          mkdirSync(dir, { recursive: true })
          symlinkSync(kernelPath, dest)
        }
      }

      ok("Kernel linked")
    }

    // ── Step 7: Verify ─────────────────────────────────────────────

    console.log()
    info("Verifying setup...")

    const binaryPath2 = join(
      containerDir,
      ".build",
      "release",
      "fabric-container"
    )
    if (existsSync(binaryPath2)) {
      const status = run(`"${binaryPath2}" status 2>&1`, { silent: true }) || ""
      if (status.includes('"kernelExists" : true')) {
        ok("fabric-container binary OK (kernel found)")
      } else {
        console.log(
          `${c("yellow", "!")}  fabric-container can't find kernel`
        )
      }
    }
  }

  // ── Step 8: Pre-pull images ──────────────────────────────────────

  const images = [
    { name: "alpine:latest", desc: "Minimal Linux (5 MB)", default: true },
    { name: "oven/bun:latest", desc: "Bun JS runtime", default: true },
    { name: "ubuntu:latest", desc: "Full Ubuntu", default: false },
    { name: "python:3-slim", desc: "Python runtime", default: false },
    { name: "node:22-slim", desc: "Node.js runtime", default: false },
  ]

  let selectedImages = images.filter((i) => i.default)

  if (options.interactive) {
    // Interactive mode: let user pick which images to pull
    const { createInterface } = await import("readline")
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const ask = (q: string): Promise<string> =>
      new Promise((resolve) => rl.question(q, resolve))

    console.log()
    info("Which container images would you like to pre-pull?")
    console.log(c("dim", "  These will be downloaded now so your first sandbox starts fast."))
    console.log()

    const picked: typeof images = []
    for (const img of images) {
      const def = img.default ? " [Y/n]" : " [y/N]"
      const answer = await ask(
        `  ${img.name.padEnd(22)} ${c("dim", img.desc)}${def} `
      )
      const yes = img.default
        ? answer.trim().toLowerCase() !== "n"
        : answer.trim().toLowerCase() === "y"
      if (yes) picked.push(img)
    }

    rl.close()
    selectedImages = picked
    console.log()
  } else {
    console.log()
    info("Pre-pulling default container images...")
    console.log(c("dim", "  Run with --interactive to choose which images to pull."))
    console.log()

    for (const img of images) {
      const tag = img.default ? c("green", " (pulling)") : ""
      console.log(`  ${img.name.padEnd(22)} ${c("dim", img.desc)}${tag}`)
    }
    console.log()
  }

  for (const img of selectedImages) {
    info(`Pulling ${img.name}...`)
    const pullResult = spawnSync("container", ["image", "pull", img.name], {
      stdio: "pipe",
    })
    if (pullResult.status === 0) {
      ok(`${img.name} ready`)
    } else {
      console.log(`${c("yellow", "!")}  Failed to pull ${img.name}`)
    }
  }

  // ── Step 9: Verify ─────────────────────────────────────────────

  console.log()
  info("Running test container...")
  const testResult = spawnSync("container", [
    "run",
    "--rm",
    "alpine:latest",
    "echo",
    "hello from fabric",
  ])
  const testOutput = testResult.stdout?.toString() || ""

  if (testOutput.includes("hello from fabric")) {
    ok("Container test passed")
  } else {
    const stderr = testResult.stderr?.toString() || ""
    console.log(`${c("yellow", "!")}  Container test failed`)
    if (stderr) console.log(c("dim", `   ${stderr.trim()}`))
    console.log()
    console.log(c("dim", "  Try: container system start"))
    console.log(c("dim", "  Then re-run: fabric setup"))
  }

  // ── Done ─────────────────────────────────────────────────────────

  console.log()
  console.log(c("green", "Setup complete!"))
  console.log()
  console.log("  Run tests:          bun test")
  console.log("  Run dev server:     bun run dev")
  console.log(
    "  Test a container:   container run --rm alpine:latest echo hello"
  )
  console.log()
  console.log("  Cloud providers need API keys:")
  console.log(`    ${c("yellow", "export DAYTONA_API_KEY=...")}     # from app.daytona.io`)
  console.log(`    ${c("yellow", "export E2B_API_KEY=...")}         # from e2b.dev/dashboard`)
  console.log(`    ${c("yellow", "ssh exe.dev")}                    # registers SSH key`)
  console.log()
  console.log(
    `  Pull more images:   ${c("dim", "container image pull ubuntu:latest")}`
  )
  console.log()
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

    case "shell":
      await cmdShell({ image: values.image })
      break

    case "setup":
      await cmdSetup({ interactive: values.interactive })
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
