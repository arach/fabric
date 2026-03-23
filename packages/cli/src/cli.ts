#!/usr/bin/env node
/**
 * Fabric CLI
 *
 * Ambient compute for Claude Code agents
 */

import { parseArgs } from "node:util"
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { spawnSync, execSync } from "node:child_process"
import { homedir } from "node:os"
import { createHash } from "node:crypto"
import type { SandboxFactory, Sandbox, MountSpec } from "fabric-ai-core"

const version = "0.2.0"

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

type Provider = "local" | "daytona" | "e2b" | "exe"

const PROVIDERS: Provider[] = ["local", "daytona", "e2b", "exe"]

// Help text
const helpText = `
${c("bold", "Fabric CLI")} ${c("dim", `v${version}`)}
${c("cyan", "Ambient compute for Claude Code agents")}

${c("bold", "USAGE")}
  ${c("green", "fabric")} <command> [options]

${c("bold", "COMMANDS")}
  ${c("green", "setup")}      Set up local container runtime
  ${c("green", "init")}       Create a .fabric config for this project
  ${c("green", "build")}      Build container images from manifest
  ${c("green", "images")}     List available container images
  ${c("green", "publish")}    Generate shareable recipe refs
  ${c("green", "shell")}     Drop into an interactive Linux shell
  ${c("green", "create")}     Create a new sandbox
  ${c("green", "exec")}       Execute a command in a sandbox
  ${c("green", "run")}        Run code in a sandbox
  ${c("green", "list")}       List active sandboxes
  ${c("green", "stop")}       Stop a sandbox
  ${c("green", "config")}     Manage configuration

${c("bold", "OPTIONS")}
  ${c("yellow", "-p, --provider")}  Provider to use (local, daytona, e2b, exe)
  ${c("yellow", "-l, --language")}  Language for sandbox (typescript, python, go, rust)
  ${c("yellow", "--image")}         Container image (for shell command)
  ${c("yellow", "--all")}           Build all images (for build command)
  ${c("yellow", "--no-cache")}      Disable build cache (for build command)
  ${c("yellow", "--build-arg")}     Build argument KEY=VAL (for build command)
  ${c("yellow", "--ref")}           Build from a fab.run recipe ref
  ${c("yellow", "--ext-ref")}       Build from an external recipe ref
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

  ${c("dim", "# Drop into a shell (Alpine + essentials)")}
  fabric shell

  ${c("dim", "# Ubuntu with dev tools")}
  fabric shell --image ubuntu

  ${c("dim", "# Bare Alpine (minimal)")}
  fabric shell --image bare

  ${c("dim", "# Build default images")}
  fabric build

  ${c("dim", "# Build a specific image")}
  fabric build ocr

  ${c("dim", "# Build all images")}
  fabric build --all

  ${c("dim", "# Build from a shared recipe")}
  fabric build --ref=a1b2c3

  ${c("dim", "# List available images")}
  fabric images

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

// ── .fabric config ────────────────────────────────────────────────────

interface FabricConfig {
  provider?: Provider
  image?: string
  network?: boolean
  mounts?: string[]
  env?: string[]
  profile?: string
  cpus?: number
  memory?: string
}

const PROFILES: Record<string, Partial<FabricConfig>> = {
  minimal: {
    image: "alpine:latest",
    mounts: [".:/workspace:ro"],
  },
  node: {
    image: "node:22",
    mounts: [
      "./src:/workspace/src:ro",
      "./package.json:/workspace/package.json:ro",
    ],
  },
  python: {
    image: "python:3.12",
    mounts: [
      "./src:/workspace/src:ro",
      "./requirements.txt:/workspace/requirements.txt:ro",
    ],
  },
  bun: {
    image: "oven/bun:latest",
    mounts: [
      "./src:/workspace/src:ro",
      "./package.json:/workspace/package.json:ro",
    ],
  },
}

function loadFabricConfig(startDir?: string): FabricConfig | null {
  let dir = startDir || process.cwd()

  // Walk up looking for .fabric
  for (let i = 0; i < 10; i++) {
    const configPath = resolve(dir, ".fabric")
    if (existsSync(configPath)) {
      try {
        const raw = readFileSync(configPath, "utf8")
        const config = parseConfigFile(raw)

        // If a profile is specified, merge it as base
        if (config.profile && PROFILES[config.profile]) {
          const profile = PROFILES[config.profile]
          return {
            ...profile,
            ...config,
            // Config mounts extend profile mounts
            mounts: [
              ...(profile.mounts || []),
              ...(config.mounts || []).filter(
                (m) => !profile.mounts?.includes(m)
              ),
            ],
          }
        }

        return config
      } catch {
        return null
      }
    }
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

function parseConfigFile(raw: string): FabricConfig {
  const config: FabricConfig = {}

  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const [key, ...rest] = trimmed.split(":")
    const value = rest.join(":").trim()
    if (!value) continue

    switch (key.trim()) {
      case "provider":
        config.provider = value as Provider
        break
      case "image":
        config.image = value
        break
      case "profile":
        config.profile = value
        break
      case "network":
        config.network = value !== "false"
        break
      case "cpus":
        config.cpus = parseInt(value)
        break
      case "memory":
        config.memory = value
        break
      case "mount":
        config.mounts = config.mounts || []
        config.mounts.push(value)
        break
      case "env":
        config.env = config.env || []
        config.env.push(value)
        break
    }
  }
  return config
}

function parseMounts(mountStrings: string[]): MountSpec[] {
  return mountStrings.map((m) => {
    const parts = m.split(":")
    const source = resolve(process.cwd(), parts[0])
    const destination = parts[1] || parts[0]
    const readOnly = parts[2] === "ro"
    return { source, destination, readOnly }
  })
}

function parseEnvVars(envStrings: string[]): Record<string, string> {
  const env: Record<string, string> = {}
  for (const e of envStrings) {
    const eqIdx = e.indexOf("=")
    if (eqIdx > 0) {
      env[e.slice(0, eqIdx)] = e.slice(eqIdx + 1)
    }
  }
  return env
}

// ── Image manifest ───────────────────────────────────────────────────

interface BuildArgSpec {
  source: "file" | "env"
  path?: string
  var?: string
}

interface ImageEntry {
  tag: string
  dockerfile: string
  context?: string
  description?: string
  default?: boolean
  buildArgs?: Record<string, string | BuildArgSpec>
}

interface ImageManifest {
  root?: string
  images: Record<string, ImageEntry>
}

interface ImageRef {
  name: string
  tag: string
  description?: string
  repo: string
  branch?: string
  path: string
  dockerfile: string
  context: string
  buildArgs?: Record<string, string | BuildArgSpec>
}

const GLOBAL_FABRIC_DIR = join(homedir(), ".fabric")
const GLOBAL_MANIFEST_PATH = join(GLOBAL_FABRIC_DIR, "images.json")
const REF_CACHE_DIR = join(GLOBAL_FABRIC_DIR, "refs")
const REF_BASE_URL = "https://fab.run/r"

function findProjectRoot(): string | null {
  try {
    const result = execSync("git rev-parse --show-toplevel 2>/dev/null", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    })
    return result.trim() || null
  } catch {
    return null
  }
}

function loadImageManifest(): { manifest: ImageManifest; root: string } | null {
  // 1. Try project manifest
  const projectRoot = findProjectRoot()
  if (projectRoot) {
    const manifestPath = join(projectRoot, "images", "fabric-images.json")
    if (existsSync(manifestPath)) {
      try {
        const raw = readFileSync(manifestPath, "utf8")
        return { manifest: JSON.parse(raw) as ImageManifest, root: projectRoot }
      } catch { /* fall through */ }
    }
  }

  // 2. Try global manifest at ~/.fabric/images.json
  if (existsSync(GLOBAL_MANIFEST_PATH)) {
    try {
      const raw = readFileSync(GLOBAL_MANIFEST_PATH, "utf8")
      const parsed = JSON.parse(raw) as ImageManifest
      const root = parsed.root || homedir()
      return { manifest: parsed, root }
    } catch { /* fall through */ }
  }

  return null
}

function writeGlobalManifest(projectRoot: string, manifest: ImageManifest): void {
  mkdirSync(GLOBAL_FABRIC_DIR, { recursive: true })
  const global = {
    root: projectRoot,
    generatedAt: new Date().toISOString(),
    images: manifest.images,
  }
  writeFileSync(GLOBAL_MANIFEST_PATH, JSON.stringify(global, null, 2) + "\n")
}

function resolveBuildArgs(
  entry: ImageEntry,
  cliBuildArgs: string[]
): string[] {
  const args: string[] = []

  // Resolve manifest buildArgs
  if (entry.buildArgs) {
    for (const [key, spec] of Object.entries(entry.buildArgs)) {
      if (typeof spec === "string") {
        args.push(`${key}=${spec}`)
      } else if (spec.source === "file" && spec.path) {
        const filePath = spec.path.replace(/^~/, homedir())
        if (!existsSync(filePath)) {
          console.error(c("red", `Error: Build arg ${key} requires file ${spec.path}`))
          console.error(c("dim", `  File not found: ${filePath}`))
          process.exit(1)
        }
        const value = readFileSync(filePath, "utf8").trim()
        args.push(`${key}=${value}`)
      } else if (spec.source === "env" && spec.var) {
        const value = process.env[spec.var]
        if (!value) {
          console.error(c("red", `Error: Build arg ${key} requires env var ${spec.var}`))
          process.exit(1)
        }
        args.push(`${key}=${value}`)
      }
    }
  }

  // CLI --build-arg overrides (later entries win)
  for (const arg of cliBuildArgs) {
    const key = arg.split("=")[0]
    // Remove any manifest arg with same key
    const idx = args.findIndex((a) => a.startsWith(`${key}=`))
    if (idx >= 0) args.splice(idx, 1)
    args.push(arg)
  }

  return args
}

function imageIsAvailable(tag: string): boolean {
  const result = spawnSync("container", ["image", "inspect", tag], {
    stdio: "pipe",
  })
  return result.status === 0
}

// Third-party image aliases (not built from Dockerfiles)
const THIRD_PARTY_IMAGES: Record<string, { image: string; description: string }> = {
  bare: { image: "alpine:latest", description: "Alpine Linux (bare)" },
  alpine: { image: "alpine:latest", description: "Alpine Linux (bare)" },
  omarchy: { image: "lopsided/archlinux:latest", description: "Arch Linux (Omarchy base)" },
  arch: { image: "lopsided/archlinux:latest", description: "Arch Linux" },
  debian: { image: "debian:latest", description: "Debian Linux" },
  fedora: { image: "fedora:latest", description: "Fedora Linux" },
  bun: { image: "oven/bun:latest", description: "Bun runtime" },
  node: { image: "node:22", description: "Node.js 22" },
  python: { image: "python:3.12", description: "Python 3.12" },
}

function resolveImageName(name: string): { image: string; label: string } {
  // 0. Handle ref: prefix — resolve from cached ref
  if (name.startsWith("ref:")) {
    const refId = name.slice(4)
    const cachedPath = join(REF_CACHE_DIR, `${refId}.json`)
    if (existsSync(cachedPath)) {
      const ref = JSON.parse(readFileSync(cachedPath, "utf8")) as ImageRef
      return { image: ref.tag, label: ref.description || ref.tag }
    }
    // Not cached yet — ensureImage will handle fetch+build
    return { image: `ref:${refId}`, label: `Recipe ${refId}` }
  }

  // 1. Check manifest by name
  const loaded = loadImageManifest()
  if (loaded && loaded.manifest.images[name]) {
    const entry = loaded.manifest.images[name]
    return { image: entry.tag, label: entry.description || entry.tag }
  }

  // 2. Check third-party aliases
  if (THIRD_PARTY_IMAGES[name]) {
    return {
      image: THIRD_PARTY_IMAGES[name].image,
      label: THIRD_PARTY_IMAGES[name].description,
    }
  }

  // 3. Treat as literal OCI reference
  return { image: name, label: name }
}

async function ensureImage(tag: string): Promise<void> {
  // Handle ref: tags — fetch and build from fab.run
  if (tag.startsWith("ref:")) {
    const refId = tag.slice(4)
    await fetchAndBuildRef(refId)
    return
  }

  if (imageIsAvailable(tag)) return

  // Check if it's a manifest image we can build
  const loaded = loadImageManifest()
  if (loaded) {
    for (const [name, entry] of Object.entries(loaded.manifest.images)) {
      if (entry.tag === tag) {
        console.log(c("cyan", `Image ${tag} not found locally. Building ${name}...`))
        const buildArgs = resolveBuildArgs(entry, [])
        const args = ["build", "--progress", "plain", "-t", entry.tag, "-f", join(loaded.root, entry.dockerfile)]
        for (const ba of buildArgs) args.push("--build-arg", ba)
        args.push(join(loaded.root, entry.context || "."))

        const result = spawnSync("container", args, { stdio: "inherit" })
        if (result.status !== 0) {
          console.error(c("red", `Failed to build ${tag}`))
          process.exit(1)
        }
        console.log(c("green", `✓ Built ${tag}`))
        return
      }
    }
  }

  // Try pulling from registry
  console.log(c("cyan", `Image ${tag} not found locally. Pulling...`))
  const result = spawnSync("container", ["image", "pull", tag], { stdio: "inherit" })
  if (result.status !== 0) {
    console.error(c("red", `Failed to pull ${tag}`))
    console.error(c("dim", "  If this is a Fabric image, run 'fabric build' first"))
    process.exit(1)
  }
}

// ── Ref-based image discovery ────────────────────────────────────────

async function fetchRef(refId: string): Promise<ImageRef> {
  const url = `${REF_BASE_URL}/${refId}.json`
  console.log(c("dim", `Fetching ref from ${url}...`))

  const res = await fetch(url)
  if (!res.ok) {
    console.error(c("red", `Failed to fetch ref: ${res.status} ${res.statusText}`))
    console.error(c("dim", `  URL: ${url}`))
    process.exit(1)
  }

  const ref = (await res.json()) as ImageRef

  // Validate required fields
  if (!ref.name || !ref.tag || !ref.repo || !ref.dockerfile) {
    console.error(c("red", "Invalid ref: missing required fields (name, tag, repo, dockerfile)"))
    process.exit(1)
  }

  // Cache locally
  mkdirSync(REF_CACHE_DIR, { recursive: true })
  writeFileSync(join(REF_CACHE_DIR, `${refId}.json`), JSON.stringify(ref, null, 2) + "\n")

  return ref
}

async function fetchAndBuildRef(
  refId: string,
  options: { noCache?: boolean; cliBuildArgs?: string[]; external?: boolean } = {}
): Promise<void> {
  // 1. Check cache or fetch
  const cachedPath = join(REF_CACHE_DIR, `${refId}.json`)
  let ref: ImageRef

  if (existsSync(cachedPath) && !options.noCache) {
    ref = JSON.parse(readFileSync(cachedPath, "utf8"))
    console.log(c("dim", `Using cached ref ${refId}`))
  } else {
    ref = await fetchRef(refId)
  }

  // External ref: require confirmation
  if (options.external) {
    console.log(c("yellow", `! External recipe from ${ref.repo}`))
    console.log(c("yellow", `  Image: ${ref.tag} — Dockerfile: ${ref.dockerfile}`))
    console.log(c("dim", "  Review the Dockerfile before building. Builds can execute arbitrary code."))
    const { createInterface } = await import("readline")
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise<string>((resolve) =>
      rl.question(`  ${c("yellow", "Continue? [y/N]")} `, resolve)
    )
    rl.close()
    if (answer.trim().toLowerCase() !== "y") {
      console.log(c("dim", "Aborted."))
      return
    }
  }

  // 2. If image already built, skip
  if (!options.noCache && imageIsAvailable(ref.tag)) {
    console.log(c("green", `✓ ${ref.tag} already available`))
    return
  }

  // 3. Download repo as tarball
  const buildDir = join(GLOBAL_FABRIC_DIR, "builds", refId)
  mkdirSync(buildDir, { recursive: true })

  console.log(c("cyan", `Downloading build context from ${ref.repo}...`))

  const tarPath = join(buildDir, "repo.tar.gz")
  const branches = ref.branch ? [ref.branch] : ["master", "main"]
  let tarRes: Response | null = null
  for (const branch of branches) {
    const url = `${ref.repo}/archive/refs/heads/${branch}.tar.gz`
    const res = await fetch(url, { redirect: "follow" })
    if (res.ok) {
      tarRes = res
      break
    }
  }
  if (!tarRes) {
    console.error(c("red", `Failed to download repo (tried branches: ${branches.join(", ")})`))
    process.exit(1)
  }

  const buffer = Buffer.from(await tarRes.arrayBuffer())
  writeFileSync(tarPath, buffer)

  // 4. Extract
  const extractDir = join(buildDir, "src")
  mkdirSync(extractDir, { recursive: true })
  spawnSync("tar", ["xzf", tarPath, "-C", extractDir, "--strip-components=1"], { stdio: "pipe" })

  // 5. Build
  const entry: ImageEntry = {
    tag: ref.tag,
    dockerfile: ref.dockerfile,
    context: ref.context || ".",
    buildArgs: ref.buildArgs,
  }

  const buildArgs = resolveBuildArgs(entry, options.cliBuildArgs || [])
  const args = ["build", "--progress", "plain", "-t", entry.tag, "-f", join(extractDir, entry.dockerfile)]
  if (options.noCache) args.push("--no-cache")
  for (const ba of buildArgs) args.push("--build-arg", ba)
  args.push(join(extractDir, entry.context || "."))

  console.log(`${c("blue", "=>")} Building ${ref.name} ${c("dim", `(${ref.tag})`)}`)
  const result = spawnSync("container", args, { stdio: "inherit" })

  if (result.status !== 0) {
    console.error(c("red", `Failed to build ${ref.tag}`))
    process.exit(1)
  }

  // Clean up build directory
  try {
    const { rmSync } = await import("fs")
    rmSync(buildDir, { recursive: true, force: true })
  } catch { /* best effort */ }

  console.log(c("green", `✓ Built ${ref.tag} from ref ${refId}`))
}

function generateRefId(name: string): string {
  return createHash("sha256").update(name).digest("hex").slice(0, 8)
}

/**
 * Resolve a provider name to a SandboxFactory instance.
 * Validates required credentials and dynamically imports the provider package.
 */
async function resolveFactory(
  provider: Provider,
  options?: { language?: string }
): Promise<SandboxFactory> {
  switch (provider) {
    case "local": {
      const { LocalContainerSandboxFactory } = await import("@arach/runtime-local")
      return new LocalContainerSandboxFactory()
    }

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

// Extract --build-arg values from argv before parseArgs (which doesn't handle repeated string options)
function extractBuildArgs(): string[] {
  const args: string[] = []
  const argv = process.argv.slice(2)
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--build-arg" && i + 1 < argv.length) {
      args.push(argv[i + 1])
      i++ // skip value
    } else if (argv[i].startsWith("--build-arg=")) {
      args.push(argv[i].slice("--build-arg=".length))
    }
  }
  return args
}

// Strip --build-arg entries from argv so parseArgs doesn't choke
function getCleanArgv(): string[] {
  const argv = process.argv.slice(2)
  const clean: string[] = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--build-arg" && i + 1 < argv.length) {
      i++ // skip value
    } else if (argv[i].startsWith("--build-arg=")) {
      // skip
    } else {
      clean.push(argv[i])
    }
  }
  return clean
}

// Parse command line arguments
function parseCliArgs() {
  try {
    const { values, positionals } = parseArgs({
      args: getCleanArgv(),
      allowPositionals: true,
      options: {
        provider: { type: "string", short: "p" },
        language: { type: "string", short: "l" },
        image: { type: "string" },
        help: { type: "boolean", short: "h" },
        version: { type: "boolean", short: "v" },
        interactive: { type: "boolean", short: "i" },
        id: { type: "string" },
        all: { type: "boolean" },
        "no-cache": { type: "boolean" },
        ref: { type: "string" },
        "ext-ref": { type: "string" },
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
  const config = loadFabricConfig()
  const provider = validateProvider(options.provider || config?.provider || "local")
  const language = options.language || "typescript"

  console.log(c("cyan", `Creating ${provider} sandbox...`))
  if (config) console.log(c("dim", "  Using .fabric config"))

  const factory = await resolveFactory(provider, { language })

  const createOpts: Record<string, unknown> = {}
  if (config?.image) createOpts.image = config.image
  if (config?.mounts) createOpts.mounts = parseMounts(config.mounts)

  const sandbox = await factory.create(createOpts)

  console.log(c("green", `✓ Sandbox created: ${sandbox.id}`))
  console.log(c("dim", `  Provider: ${provider}`))
  if (config?.image) console.log(c("dim", `  Image: ${config.image}`))
  console.log(c("dim", `  Status: ${sandbox.status}`))
  console.log()
  console.log(c("cyan", "Next: Run commands with"))
  console.log(c("yellow", `  fabric exec --provider ${provider} --id ${sandbox.id} "your command"`))
}

async function cmdExec(command: string, options: { id?: string; provider?: string }) {
  const config = loadFabricConfig()
  const provider = validateProvider(options.provider || config?.provider || "local")

  console.log(c("cyan", `Executing in ${provider} sandbox...`))
  if (config) console.log(c("dim", "  Using .fabric config"))
  console.log(c("dim", `$ ${command}`))
  console.log()

  const factory = await resolveFactory(provider)

  const createOpts: Record<string, unknown> = {}
  if (config?.image) createOpts.image = config.image
  if (config?.mounts) createOpts.mounts = parseMounts(config.mounts)

  const sandbox = await factory.create(createOpts)

  // Pass env vars from config
  const env = config?.env ? parseEnvVars(config.env) : undefined

  let exitCode = 1
  try {
    const result = await sandbox.exec(command)
    if (result.stdout) console.log(result.stdout)
    if (result.stderr) console.error(c("red", result.stderr))
    exitCode = result.exitCode
  } finally {
    await sandbox.stop()
  }
  process.exit(exitCode)
}

async function cmdRun(code: string, options: { language?: string; provider?: string }) {
  const config = loadFabricConfig()
  const provider = validateProvider(options.provider || config?.provider || "local")
  const language = options.language || "typescript"

  console.log(c("cyan", `Running ${language} code in ${provider}...`))
  if (config) console.log(c("dim", "  Using .fabric config"))
  console.log()

  const factory = await resolveFactory(provider, { language })

  const createOpts: Record<string, unknown> = {}
  if (config?.image) createOpts.image = config.image
  if (config?.mounts) createOpts.mounts = parseMounts(config.mounts)

  const sandbox = await factory.create(createOpts)

  try {
    const result = await sandbox.runCode!(code, language)
    if (result.output) console.log(result.output)
    if (result.error) console.error(c("red", result.error))
  } finally {
    await sandbox.stop()
  }
}

async function cmdList(options: { provider?: string }) {
  const provider = validateProvider(options.provider || "local")

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
  const provider = validateProvider(options.provider || "local")

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

// ── Init command ──────────────────────────────────────────────────────

async function cmdInit(profile?: string) {
  const configPath = resolve(process.cwd(), ".fabric")

  if (existsSync(configPath)) {
    console.log(c("yellow", "  .fabric already exists in this directory"))
    console.log(c("dim", `  ${configPath}`))
    return
  }

  const selectedProfile = profile && PROFILES[profile] ? profile : undefined

  let content: string
  if (selectedProfile) {
    const prof = PROFILES[selectedProfile]
    content = `# Fabric sandbox config\n# Profile: ${selectedProfile}\nprofile: ${selectedProfile}\n`
    if (prof.mounts) {
      content += `\n# Additional mounts (profile provides defaults)\n# mount: ./data:/workspace/data\n`
    }
    content += `\n# Override image (optional)\n# image: ${prof.image}\n`
  } else {
    content = `# Fabric sandbox config
# Docs: https://fabric.arach.dev/docs/getting-started

# Provider (local, daytona, e2b, exe)
# provider: local

# Container image
image: alpine:latest

# Mount host directories into the container
# mount: ./src:/workspace/src:ro
# mount: ./data:/workspace/data

# Environment variables
# env: NODE_ENV=development

# Network access (default: true)
# network: true

# Use a preset profile (minimal, node, python, bun)
# profile: node
`
  }

  const { writeFileSync } = await import("fs")
  writeFileSync(configPath, content)

  console.log(c("green", `✓ Created .fabric`))
  if (selectedProfile) {
    console.log(c("dim", `  Profile: ${selectedProfile}`))
  }
  console.log(c("dim", `  ${configPath}`))
  console.log()
  console.log(c("cyan", "Available profiles:"))
  for (const [name, prof] of Object.entries(PROFILES)) {
    console.log(c("dim", `  ${name.padEnd(10)} ${prof.image}`))
  }
  console.log()
  console.log(c("dim", "Usage: fabric init [profile]"))
  console.log(c("dim", "  e.g. fabric init node"))
}

// ── Build command ─────────────────────────────────────────────────────

async function cmdBuild(
  name?: string,
  options: { all?: boolean; noCache?: boolean; ref?: string; extRef?: string } = {}
) {
  // Handle ref-based builds (bypass manifest)
  if (options.ref || options.extRef) {
    const refId = (options.ref || options.extRef)!
    const cliBuildArgs = extractBuildArgs()
    await fetchAndBuildRef(refId, {
      noCache: options.noCache,
      cliBuildArgs,
      external: !!options.extRef,
    })
    return
  }

  const loaded = loadImageManifest()
  if (!loaded) {
    console.error(c("red", "Error: No image manifest found"))
    console.error(c("dim", "  Expected images/fabric-images.json in the project root or ~/.fabric/images.json"))
    process.exit(1)
  }

  const { manifest, root } = loaded
  const cliBuildArgs = extractBuildArgs()

  // Determine which images to build
  let entries: [string, ImageEntry][]
  if (name) {
    const entry = manifest.images[name]
    if (!entry) {
      console.error(c("red", `Unknown image: ${name}`))
      console.log(c("dim", `Available: ${Object.keys(manifest.images).join(", ")}`))
      process.exit(1)
    }
    entries = [[name, entry]]
  } else if (options.all) {
    entries = Object.entries(manifest.images)
  } else {
    entries = Object.entries(manifest.images).filter(([, e]) => e.default)
    if (entries.length === 0) {
      console.log(c("dim", "No default images to build. Use --all or specify a name."))
      return
    }
  }

  console.log(c("bold", `Building ${entries.length} image${entries.length > 1 ? "s" : ""}...`))
  console.log()

  let failed = 0
  for (const [imgName, entry] of entries) {
    console.log(`${c("blue", "=>")} ${imgName} ${c("dim", `(${entry.tag})`)}`)

    const buildArgs = resolveBuildArgs(entry, cliBuildArgs)
    const args = ["build", "--progress", "plain", "-t", entry.tag, "-f", join(root, entry.dockerfile)]
    if (options.noCache) args.push("--no-cache")
    for (const ba of buildArgs) args.push("--build-arg", ba)
    args.push(join(root, entry.context || "."))

    const result = spawnSync("container", args, { stdio: "inherit" })
    if (result.status === 0) {
      console.log(`${c("green", "✓")}  ${entry.tag}`)
    } else {
      console.log(`${c("red", "✗")}  ${entry.tag} failed`)
      failed++
    }
    console.log()
  }

  if (failed > 0) {
    console.error(c("red", `${failed} image${failed > 1 ? "s" : ""} failed to build`))
    process.exit(1)
  }
}

// ── Images command ───────────────────────────────────────────────────

async function cmdImages() {
  const loaded = loadImageManifest()

  if (!loaded) {
    console.log(c("dim", "No image manifest found (not in a Fabric workspace)"))
    console.log()
    console.log(c("bold", "Third-party aliases:"))
    for (const [name, info] of Object.entries(THIRD_PARTY_IMAGES)) {
      console.log(`  ${name.padEnd(12)} ${c("dim", info.image.padEnd(30))} ${c("dim", info.description)}`)
    }
    return
  }

  const { manifest } = loaded

  console.log(c("bold", "Fabric images"))
  console.log()

  for (const [name, entry] of Object.entries(manifest.images)) {
    const available = imageIsAvailable(entry.tag)
    const icon = available ? c("green", "✓") : c("red", "✗")
    const defaultLabel = entry.default ? c("cyan", " (default)") : ""
    console.log(`  ${icon}  ${name.padEnd(12)} ${c("dim", entry.tag.padEnd(28))} ${entry.description || ""}${defaultLabel}`)
  }

  console.log()
  console.log(c("bold", "Third-party aliases"))
  console.log()
  for (const [name, info] of Object.entries(THIRD_PARTY_IMAGES)) {
    console.log(`     ${name.padEnd(12)} ${c("dim", info.image.padEnd(28))} ${info.description}`)
  }

  // Show cached refs
  if (existsSync(REF_CACHE_DIR)) {
    try {
      const refFiles = readdirSync(REF_CACHE_DIR).filter((f: string) => f.endsWith(".json"))
      if (refFiles.length > 0) {
        console.log()
        console.log(c("bold", "Cached refs"))
        console.log()
        for (const file of refFiles) {
          const ref = JSON.parse(readFileSync(join(REF_CACHE_DIR, file), "utf8")) as ImageRef
          const refId = file.replace(".json", "")
          const available = imageIsAvailable(ref.tag)
          const icon = available ? c("green", "✓") : c("red", "✗")
          console.log(`  ${icon}  ref:${refId.padEnd(10)} ${c("dim", ref.tag.padEnd(28))} ${ref.description || ""}`)
        }
      }
    } catch { /* ignore */ }
  }

  console.log()
  console.log(c("dim", "Build missing images with: fabric build [name|--all|--ref=ID]"))
}

// ── Publish command ──────────────────────────────────────────────────

async function cmdPublish(name?: string) {
  const loaded = loadImageManifest()
  if (!loaded) {
    console.error(c("red", "Error: No image manifest found"))
    process.exit(1)
  }

  const { manifest, root } = loaded

  // Get repo URL from git remote
  let repoUrl = "https://github.com/arach/fabric"
  try {
    const remote = execSync("git remote get-url origin", { encoding: "utf8", cwd: root }).trim()
    repoUrl = remote
      .replace(/^git@github\.com:/, "https://github.com/")
      .replace(/\.git$/, "")
  } catch { /* use default */ }

  const refDir = join(root, "landing", "public", "r")
  mkdirSync(refDir, { recursive: true })

  const entries = name
    ? ([[name, manifest.images[name]] as [string, ImageEntry]])
    : Object.entries(manifest.images)

  if (name && !manifest.images[name]) {
    console.error(c("red", `Unknown image: ${name}`))
    console.log(c("dim", `Available: ${Object.keys(manifest.images).join(", ")}`))
    process.exit(1)
  }

  console.log(c("bold", "Publishing refs to landing/public/r/"))
  console.log()

  for (const [imgName, entry] of entries) {
    const refId = generateRefId(imgName)

    const ref: ImageRef = {
      name: imgName,
      tag: entry.tag,
      description: entry.description,
      repo: repoUrl,
      path: dirname(entry.dockerfile),
      dockerfile: entry.dockerfile,
      context: entry.context || ".",
      ...(entry.buildArgs && { buildArgs: entry.buildArgs }),
    }

    const refPath = join(refDir, `${refId}.json`)
    writeFileSync(refPath, JSON.stringify(ref, null, 2) + "\n")
    console.log(`${c("green", "✓")} ${imgName.padEnd(12)} ${c("dim", "→")} ${c("cyan", `fab.run/r/${refId}`)}`)
  }

  console.log()
  console.log(c("dim", "Deploy the landing site to make refs live."))
}

// ── Shell command ─────────────────────────────────────────────────────

async function cmdShell(options: { image?: string } = {}) {
  const config = loadFabricConfig()

  // Check container CLI is available
  const check = spawnSync("container", ["--version"], { stdio: "pipe" })
  if (check.status !== 0) {
    console.error(c("red", "Error: Apple container CLI not found"))
    console.log(c("dim", "Run 'fabric setup' to install it"))
    process.exit(1)
  }

  // Resolve image: CLI flag > .fabric config > default
  const imageName = options.image || config?.image
  let image: string
  let label: string

  if (!imageName) {
    // Default to fabric-base from manifest or fallback
    const loaded = loadImageManifest()
    const baseEntry = loaded?.manifest.images["base"]
    image = baseEntry?.tag || "fabric-base:latest"
    label = baseEntry?.description || "Fabric base (Alpine + essentials)"
  } else {
    const resolved = resolveImageName(imageName)
    image = resolved.image
    label = resolved.label
  }

  // Ensure image is available (auto-build from manifest or pull)
  await ensureImage(image)

  console.log(c("cyan", `Launching ${label}...`))
  console.log(c("dim", `Image: ${image}`))
  if (config) console.log(c("dim", "  Using .fabric config"))
  console.log(c("dim", "Exit with: exit or Ctrl+D"))
  console.log()

  // Build container args
  // Note: Apple's container CLI doesn't support -it combined; use -i only
  const containerArgs = ["run", "--rm", "-i"]

  // Add mounts from config
  if (config?.mounts) {
    for (const mount of parseMounts(config.mounts)) {
      const mountStr = mount.readOnly
        ? `${mount.source}:${mount.destination}:ro`
        : `${mount.source}:${mount.destination}`
      containerArgs.push("-v", mountStr)
    }
  }

  // Add env from config
  if (config?.env) {
    for (const e of config.env) {
      containerArgs.push("-e", e)
    }
  }

  containerArgs.push(image, "sh", "-c",
    "if command -v bash >/dev/null 2>&1; then exec bash; else exec sh; fi"
  )

  // Run interactively — inherits stdio so user gets a live shell
  const result = spawnSync("container", containerArgs, {
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

  // ── Step 7.5: Populate global image manifest ────────────────────

  const loaded = loadImageManifest()
  if (loaded && projectRoot) {
    writeGlobalManifest(projectRoot, loaded.manifest)
    ok("Global manifest written to ~/.fabric/images.json")
    console.log(c("dim", "     Images discoverable from any directory"))
  }

  // ── Step 8: Build/pull images (manifest-driven) ────────────────
  const manifestImages = loaded ? Object.entries(loaded.manifest.images) : []

  // Also include common third-party images for pulling
  const pullableImages = [
    { name: "alpine:latest", desc: "Bare Alpine (5 MB)", default: false },
    { name: "oven/bun:latest", desc: "Bun JS runtime", default: false },
    { name: "node:22-slim", desc: "Node.js runtime", default: false },
    { name: "python:3-slim", desc: "Python runtime", default: false },
  ]

  type SetupImage = { name: string; tag: string; desc: string; default: boolean; manifestEntry?: ImageEntry }
  const allImages: SetupImage[] = [
    ...manifestImages.map(([name, entry]) => ({
      name,
      tag: entry.tag,
      desc: entry.description || entry.tag,
      default: !!entry.default,
      manifestEntry: entry,
    })),
    ...pullableImages.map((img) => ({
      name: img.name,
      tag: img.name,
      desc: img.desc,
      default: img.default,
    })),
  ]

  let selectedImages = allImages.filter((i) => i.default)

  if (options.interactive) {
    const { createInterface } = await import("readline")
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const ask = (q: string): Promise<string> =>
      new Promise((resolve) => rl.question(q, resolve))

    console.log()
    info("Which container images would you like to build/pull?")
    console.log(c("dim", "  These will be ready now so your first sandbox starts fast."))
    console.log()

    const picked: SetupImage[] = []
    for (const img of allImages) {
      const def = img.default ? " [Y/n]" : " [y/N]"
      const answer = await ask(
        `  ${img.tag.padEnd(26)} ${c("dim", img.desc)}${def} `
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
    info("Building default container images...")
    console.log(c("dim", "  Run with --interactive to choose which images to build/pull."))
    console.log()

    for (const img of allImages) {
      const action = img.default
        ? (img.manifestEntry ? c("green", " (building)") : c("green", " (pulling)"))
        : ""
      console.log(`  ${img.tag.padEnd(26)} ${c("dim", img.desc)}${action}`)
    }
    console.log()
  }

  for (const img of selectedImages) {
    if (img.manifestEntry && projectRoot) {
      // Build from manifest Dockerfile
      const entry = img.manifestEntry
      info(`Building ${img.tag}...`)
      const buildArgs = resolveBuildArgs(entry, [])
      const args = ["build", "--progress", "plain", "-t", entry.tag, "-f", join(projectRoot, entry.dockerfile)]
      for (const ba of buildArgs) args.push("--build-arg", ba)
      args.push(join(projectRoot, entry.context || "."))

      const buildResult = spawnSync("container", args, { stdio: "pipe" })
      if (buildResult.status === 0) {
        ok(`${img.tag} built`)
      } else {
        console.log(`${c("yellow", "!")}  Build failed for ${img.tag}`)
        if (img.name === "base") {
          console.log(`${c("yellow", "!")}  Pulling alpine:latest as fallback...`)
          spawnSync("container", ["image", "pull", "alpine:latest"], { stdio: "pipe" })
          ok("alpine:latest ready (fallback)")
        }
      }
    } else {
      // Pull from registry
      info(`Pulling ${img.tag}...`)
      const pullResult = spawnSync("container", ["image", "pull", img.tag], { stdio: "pipe" })
      if (pullResult.status === 0) {
        ok(`${img.tag} ready`)
      } else {
        console.log(`${c("yellow", "!")}  Failed to pull ${img.tag}`)
      }
    }
  }

  // ── Step 9: Verify ─────────────────────────────────────────────

  console.log()
  info("Running test container...")
  const testResult = spawnSync("container", [
    "run",
    "--rm",
    "fabric-base:latest",
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
  console.log(`  ${c("cyan", "fabric shell")}              # default (Alpine + essentials)`)
  console.log(`  ${c("cyan", "fabric shell --image ubuntu")}  # Ubuntu with dev tools`)
  console.log(`  ${c("cyan", "fabric shell --image bare")}    # bare Alpine`)
  console.log()
  console.log("  Cloud providers need API keys:")
  console.log(`    ${c("yellow", "export DAYTONA_API_KEY=...")}     # from app.daytona.io`)
  console.log(`    ${c("yellow", "export E2B_API_KEY=...")}         # from e2b.dev/dashboard`)
  console.log(`    ${c("yellow", "ssh exe.dev")}                    # registers SSH key`)
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

    case "build":
      await cmdBuild(args[0], {
        all: values.all,
        noCache: values["no-cache"],
        ref: values.ref as string | undefined,
        extRef: values["ext-ref"] as string | undefined,
      })
      break

    case "images":
      await cmdImages()
      break

    case "publish":
      await cmdPublish(args[0])
      break

    case "shell":
      await cmdShell({ image: values.image })
      break

    case "init":
      await cmdInit(args[0])
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
