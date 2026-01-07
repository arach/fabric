# Daytona Runtime

Daytona provides enterprise-grade cloud sandboxes for running Claude Code agents with secure network policies and multi-language support.

## Installation

```bash
npm install @fabric/core @fabric/runtime-daytona
```

## Configuration

Set these environment variables:

```bash
# Required
DAYTONA_API_KEY=your_daytona_api_key

# Required for Claude Code
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your Daytona API key from [app.daytona.io](https://app.daytona.io).

## Basic Usage

```typescript
import { DaytonaSandboxFactory } from "@fabric/runtime-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

// Create a sandbox
const sandbox = await factory.create({})
console.log(`Sandbox ID: ${sandbox.id}`)

// Execute shell commands
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Run TypeScript code
const codeResult = await sandbox.runCode(`
  const greeting = "Hello from Daytona!"
  console.log(greeting)
  console.log("Current time:", new Date().toISOString())
`)
console.log(codeResult.output)

// Clean up
await sandbox.stop()
```

## Language Support

Daytona supports multiple languages out of the box:

```typescript
// TypeScript (default)
const tsSandbox = await factory.create({ language: "typescript" })

// Python
const pySandbox = await factory.create({ language: "python" })

// Go
const goSandbox = await factory.create({ language: "go" })

// Rust
const rustSandbox = await factory.create({ language: "rust" })

// JavaScript
const jsSandbox = await factory.create({ language: "javascript" })
```

## File Operations

```typescript
// Write a file
await sandbox.writeFile("/home/daytona/hello.ts", `
export function greet(name: string) {
  return \`Hello, \${name}!\`
}
`)

// Read a file
const content = await sandbox.readFile("/home/daytona/hello.ts")
console.log(content)

// List files in a directory
const files = await sandbox.listFiles("/home/daytona")
console.log("Files:", files)
```

## Running Claude Code

Claude Code works in Daytona with a direct Anthropic API key:

```typescript
import { Daytona } from "@daytonaio/sdk"

const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY })

const sandbox = await daytona.create({ language: "typescript" })

// Install Claude Code
await sandbox.process.executeCommand(
  "npm install -g @anthropic-ai/claude-code",
  undefined, undefined, 120
)

// Run Claude Code
const mission = "Create a fibonacci function in TypeScript"
const result = await sandbox.process.executeCommand(
  `export ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY} && echo '${mission}' | claude -p --dangerously-skip-permissions`,
  undefined, undefined, 180
)

console.log(result.result)

await sandbox.delete()
```

## Network Access

Daytona uses tier-based network policies for security.

### Essential Services (All Tiers)

These services are always accessible:

**AI APIs:**
- api.anthropic.com
- api.openai.com
- api.perplexity.ai
- api.deepseek.com
- api.groq.com
- openrouter.ai

**Package Registries:**
- registry.npmjs.org
- pypi.org
- repo1.maven.org

**Git Hosting:**
- github.com
- gitlab.com
- bitbucket.org

**Container Registries:**
- docker.io
- gcr.io
- ghcr.io

### Network Restrictions

| Tier | Network Access |
|------|----------------|
| Tier 1/2 | Essential services only |
| Tier 3/4 | Full internet + custom allowlist |

### Custom Allowlist (Tier 3/4)

```typescript
const sandbox = await daytona.create({
  networkAllowList: "208.80.154.232/32,199.16.156.103/32"
})
```

## Snapshots

Capture and restore sandbox state:

```typescript
// Capture snapshot
const snapshot = await sandbox.snapshot()
console.log(`Snapshot ID: ${snapshot.id}`)
console.log(`Files captured: ${snapshot.files.length}`)

// Save snapshot to file
import { writeFileSync } from "fs"
writeFileSync("snapshot.json", JSON.stringify(snapshot, null, 2))

// Later, restore from snapshot
const newSandbox = await factory.create({})
await newSandbox.restore(snapshot)
```

## Environment Variables

Pass environment variables to the sandbox:

```typescript
const sandbox = await factory.create({
  envVars: {
    NODE_ENV: "production",
    DEBUG: "true",
    API_URL: "https://api.example.com"
  }
})
```

## Error Handling

```typescript
try {
  const sandbox = await factory.create({})

  const result = await sandbox.exec("some-command")

  if (result.exitCode !== 0) {
    console.error("Command failed:", result.stderr)
  }

} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("Operation timed out")
  } else {
    console.error("Error:", error.message)
  }
}
```

## Sandbox Lifecycle

```typescript
const sandbox = await factory.create({})

console.log(sandbox.status) // "running"

// Do work...

await sandbox.stop()

console.log(sandbox.status) // "stopped"
```

## Best Practices

1. **Always clean up sandboxes** - Call `sandbox.stop()` or `sandbox.delete()` when done

2. **Use appropriate timeouts** - Long-running commands need longer timeouts:
   ```typescript
   await sandbox.process.executeCommand(cmd, undefined, undefined, 300) // 5 min
   ```

3. **Check exit codes** - Always verify command success:
   ```typescript
   const result = await sandbox.exec("npm install")
   if (result.exitCode !== 0) {
     throw new Error(`Install failed: ${result.stderr}`)
   }
   ```

4. **Use snapshots for reproducibility** - Capture state before risky operations

5. **Set environment variables at creation** - More secure than inline exports

## Comparison with E2B

| Feature | Daytona | E2B |
|---------|---------|-----|
| Default Language | TypeScript | Python |
| Multi-Language | TS, Python, Go, Rust, JS | Python, JS |
| Network | Secure allowlist | Full access |
| Claude Template | npm install | Pre-built |
| Jupyter Kernel | No | Yes |
| Best For | Enterprise, TypeScript | Data science |

## Resources

- [Daytona Documentation](https://www.daytona.io/docs)
- [Daytona Dashboard](https://app.daytona.io)
- [Network Limits](https://www.daytona.io/docs/en/network-limits/)
- [SDK Reference](https://www.daytona.io/docs/en/typescript-sdk/)
