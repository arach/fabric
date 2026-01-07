# E2B Runtime

E2B provides fast-starting code interpreter sandboxes with full internet access and a pre-built Claude Code template.

## Installation

```bash
npm install @fabric/core @fabric/runtime-e2b
```

## Configuration

Set these environment variables:

```bash
# Required
E2B_API_KEY=your_e2b_api_key

# Required for Claude Code
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Get your E2B API key from [e2b.dev/dashboard](https://e2b.dev/dashboard).

## Basic Usage

```typescript
import { E2BSandboxFactory } from "@fabric/runtime-e2b"

const factory = new E2BSandboxFactory(process.env.E2B_API_KEY)

// Create a sandbox
const sandbox = await factory.create({})
console.log(`Sandbox ID: ${sandbox.id}`)

// Execute shell commands
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Run Python code (E2B default)
const codeResult = await sandbox.runCode(`
import datetime
print("Hello from E2B!")
print("Current time:", datetime.datetime.now().isoformat())
`)
console.log(codeResult.output)

// Clean up
await sandbox.stop()
```

## Claude Code Template

E2B provides a pre-built template with Claude Code installed:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

// Create sandbox with Claude Code template
const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY,
  envs: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  }
})

console.log(`Sandbox: ${sandbox.sandboxId}`)

// Run Claude Code with a mission
const mission = "Create a Python script that generates the first 20 Fibonacci numbers"

const result = await sandbox.commands.run(
  `echo '${mission}' | claude -p --dangerously-skip-permissions`,
  { timeoutMs: 120_000 }
)

console.log("Claude's response:")
console.log(result.stdout)

// Check what Claude created
const files = await sandbox.files.list("/home/user")
console.log("Files:", files.map(f => f.name))

// Read a file Claude created
if (files.some(f => f.name === "fibonacci.py")) {
  const content = await sandbox.files.read("/home/user/fibonacci.py")
  console.log("\nfibonacci.py:")
  console.log(content)
}

await sandbox.kill()
```

## Code Execution

E2B's code interpreter supports Python and JavaScript:

```typescript
// Python (default)
const pyResult = await sandbox.runCode(`
import math
print("Pi =", math.pi)
print("E =", math.e)
`)

// Using the E2B SDK directly for more control
import { Sandbox } from "@e2b/code-interpreter"

const sbx = await Sandbox.create({ apiKey: process.env.E2B_API_KEY })

const execution = await sbx.runCode(`
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
plt.plot(x, np.sin(x))
plt.title("Sine Wave")
plt.savefig("sine.png")
print("Chart saved!")
`)

console.log(execution.logs.stdout)

// Access generated charts
for (const result of execution.results) {
  if (result.png) {
    console.log("Chart generated:", result.png.substring(0, 50) + "...")
  }
}

await sbx.kill()
```

## File Operations

```typescript
// Write a file
await sandbox.writeFile("/home/user/hello.py", `
def greet(name):
    return f"Hello, {name}!"

if __name__ == "__main__":
    print(greet("World"))
`)

// Read a file
const content = await sandbox.readFile("/home/user/hello.py")
console.log(content)

// List files in a directory
const files = await sandbox.listFiles("/home/user")
console.log("Files:", files)
```

## Using the E2B SDK Directly

For advanced use cases, use the E2B SDK directly:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create({
  apiKey: process.env.E2B_API_KEY,
  metadata: { project: "my-project" }
})

// Commands API
const cmdResult = await sandbox.commands.run("pip install requests")
console.log("Exit code:", cmdResult.exitCode)

// Files API
await sandbox.files.write("/home/user/data.json", JSON.stringify({ key: "value" }))
const data = await sandbox.files.read("/home/user/data.json")

// Run code with full execution info
const execution = await sandbox.runCode(`
x = [1, 2, 3, 4, 5]
print("Sum:", sum(x))
print("Average:", sum(x) / len(x))
`)

console.log("Stdout:", execution.logs.stdout)
console.log("Stderr:", execution.logs.stderr)

if (execution.error) {
  console.error("Error:", execution.error)
}

await sandbox.kill()
```

## Snapshots

Capture and restore sandbox state:

```typescript
// Capture snapshot
const snapshot = await sandbox.snapshot()
console.log(`Snapshot ID: ${snapshot.id}`)
console.log(`Files captured: ${snapshot.files.length}`)

// Save snapshot
import { writeFileSync } from "fs"
writeFileSync("e2b-snapshot.json", JSON.stringify(snapshot, null, 2))

// Later, restore from snapshot
const newSandbox = await factory.create({})
await newSandbox.restore(snapshot)
```

## Network Access

E2B sandboxes have **full internet access** by default:

```typescript
const result = await sandbox.exec(`
curl -s https://api.github.com/users/anthropics
`)
console.log(result.stdout)
```

This makes E2B ideal for:
- Fetching external data
- Calling third-party APIs
- Installing packages from any source
- Web scraping

## Timeouts

E2B sandboxes have configurable timeouts:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

// Set sandbox timeout (default: 5 minutes)
const sandbox = await Sandbox.create({
  apiKey: process.env.E2B_API_KEY,
  timeoutMs: 600_000  // 10 minutes
})

// Set command timeout
const result = await sandbox.commands.run("long-running-command", {
  timeoutMs: 300_000  // 5 minutes
})
```

## Error Handling

```typescript
try {
  const sandbox = await factory.create({})

  const result = await sandbox.exec("python script.py")

  if (result.exitCode !== 0) {
    console.error("Script failed:")
    console.error(result.stderr)
  }

} catch (error) {
  if (error.message.includes("timeout")) {
    console.error("Operation timed out")
  } else if (error.message.includes("E2B_API_KEY")) {
    console.error("API key not configured")
  } else {
    console.error("Error:", error.message)
  }
}
```

## Jupyter Kernel Support

E2B sandboxes include Jupyter kernel support:

```typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create({ apiKey: process.env.E2B_API_KEY })

// Run code that maintains state
await sandbox.runCode("x = 10")
await sandbox.runCode("y = 20")
const result = await sandbox.runCode("print(x + y)")  // Outputs: 30

// Generate visualizations
const chartExecution = await sandbox.runCode(`
import matplotlib.pyplot as plt
plt.figure(figsize=(10, 6))
plt.bar(['A', 'B', 'C'], [10, 20, 15])
plt.title('Sample Chart')
plt.show()
`)

// Charts are returned as base64 PNG
for (const result of chartExecution.results) {
  if (result.png) {
    // Save or display the chart
    const buffer = Buffer.from(result.png, 'base64')
    writeFileSync('chart.png', buffer)
  }
}

await sandbox.kill()
```

## Best Practices

1. **Use the Claude Code template** - For Claude agents, use `anthropic-claude-code` template:
   ```typescript
   const sandbox = await Sandbox.create("anthropic-claude-code", { ... })
   ```

2. **Set appropriate timeouts** - Claude Code operations need longer timeouts:
   ```typescript
   await sandbox.commands.run(cmd, { timeoutMs: 120_000 })
   ```

3. **Clean up sandboxes** - Always call `kill()` or `stop()`:
   ```typescript
   try {
     // ... do work
   } finally {
     await sandbox.kill()
   }
   ```

4. **Check execution errors** - The `runCode` method returns an error field:
   ```typescript
   const result = await sandbox.runCode(code)
   if (result.error) {
     console.error("Execution error:", result.error)
   }
   ```

5. **Use metadata** - Tag sandboxes for easier management:
   ```typescript
   await Sandbox.create({
     apiKey: process.env.E2B_API_KEY,
     metadata: { userId: "123", project: "my-app" }
   })
   ```

## Comparison with Daytona

| Feature | E2B | Daytona |
|---------|-----|---------|
| Default Language | Python | TypeScript |
| Startup Time | <200ms | ~2-3s |
| Network | Full access | Allowlist |
| Claude Template | Pre-built | npm install |
| Jupyter Kernel | Yes | No |
| Multi-Language | Python, JS | TS, Python, Go, Rust, JS |
| Best For | Data science | Enterprise |

## Resources

- [E2B Documentation](https://e2b.dev/docs)
- [E2B Dashboard](https://e2b.dev/dashboard)
- [Code Interpreter SDK](https://github.com/e2b-dev/code-interpreter)
- [Claude Code Template](https://e2b.dev/docs/templates/claude-code)
