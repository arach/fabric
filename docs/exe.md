# exe.dev Runtime

exe.dev provides persistent VMs with SSH access for running Claude Code agents. Unlike ephemeral sandboxes, exe.dev VMs persist between sessions with full root access.

## Installation

```bash
npm install fabric-ai-core fabric-ai-exe
```

## Configuration

exe.dev uses SSH authentication - no API key required. Your SSH key is used automatically:

```bash
# Ensure you have an SSH key
ls ~/.ssh/id_ed25519 || ls ~/.ssh/id_rsa

# If not, generate one
ssh-keygen -t ed25519

# Sign up and authenticate with exe.dev
ssh exe.dev
```

For Claude Code execution, set your Anthropic API key:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Basic Usage

```typescript
import { ExeSandboxFactory } from "fabric-ai-exe"

const factory = new ExeSandboxFactory()

// Create a VM
const sandbox = await factory.create({ name: "my-agent" })
console.log(`VM: ${sandbox.id}.exe.xyz`)

// Execute shell commands via SSH
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Run Python code
const codeResult = await sandbox.runCode(`
print("Hello from exe.dev!")
print("2 + 2 =", 2 + 2)
`, "python")
console.log(codeResult.output)

// Clean up
await sandbox.stop()
```

## SSH Configuration

The adapter automatically loads SSH keys from standard locations:

```typescript
// Default behavior - uses ~/.ssh/id_ed25519 or ~/.ssh/id_rsa
const factory = new ExeSandboxFactory()

// Custom SSH key path
const factory = new ExeSandboxFactory({
  privateKeyPath: "/path/to/your/key"
})

// Or provide key content directly
const factory = new ExeSandboxFactory({
  privateKey: Buffer.from("-----BEGIN OPENSSH PRIVATE KEY-----...")
})
```

## Language Support

exe.dev VMs are full Ubuntu machines. The runtime adapter handles code execution:

```typescript
// Python
const pyResult = await sandbox.runCode(`
import math
print(f"Pi is {math.pi}")
`, "python")

// JavaScript/Node.js
const jsResult = await sandbox.runCode(`
console.log("Hello from Node.js")
console.log(process.version)
`, "javascript")

// TypeScript (via bun or tsx)
const tsResult = await sandbox.runCode(`
const greeting: string = "Hello TypeScript"
console.log(greeting)
`, "typescript")

// Bash/Shell (default)
const shResult = await sandbox.runCode(`
echo "Current directory: $(pwd)"
ls -la
`)
```

## File Operations via SFTP

```typescript
// Write a file
await sandbox.writeFile("/home/user/hello.py", `
def greet(name):
    return f"Hello, {name}!"

print(greet("World"))
`)

// Read a file
const content = await sandbox.readFile("/home/user/hello.py")
console.log(content)

// List files in a directory
const files = await sandbox.listFiles("/home/user")
console.log("Files:", files)
```

## Pre-installed Agents

exe.dev VMs come with coding agents pre-installed:

```typescript
const sandbox = await factory.create({ name: "agent-box" })

// Check available agents
const result = await sandbox.exec("which claude codex")
console.log(result.stdout)
// /usr/local/bin/claude
// /usr/local/bin/codex

// Run Claude Code
await sandbox.exec(`
  export ANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY}
  echo 'Build a REST API in Python' | claude -p --dangerously-skip-permissions
`)
```

### Shelley Agent

exe.dev includes Shelley, a web-based agent accessible at port 9999:

```typescript
// Shelley is available at:
// https://my-agent.exe.xyz:9999/

// Configure Shelley via AGENTS.md
await sandbox.writeFile("/home/user/.config/shelley/AGENTS.md", `
# Agent Instructions

You are a helpful coding assistant.
- Write clean, documented code
- Follow best practices
- Test your changes
`)
```

## VM Management

```typescript
// Create with custom name
const sandbox = await factory.create({ name: "my-project" })

// List all your VMs
const vms = await factory.list()
console.log("Your VMs:", vms)
// [{ id: "my-project", status: "running" }, ...]

// Resume an existing VM
const existing = await factory.resume("my-project")
if (existing) {
  const result = await existing.exec("echo 'Still here!'")
  console.log(result.stdout)
}

// Stop and delete
await sandbox.stop()
```

## Direct SSH Access

You can also SSH into your VMs directly:

```bash
# Create VM via CLI
ssh exe.dev new my-project

# SSH into the VM
ssh my-project.exe.xyz

# Or use the Fabric CLI
fabric create --provider exe --name my-project
fabric exec --provider exe "echo hello"
```

## Snapshots

Capture and restore workspace state:

```typescript
// Capture snapshot
const snapshot = await sandbox.snapshot()
console.log(`Snapshot ID: ${snapshot.id}`)
console.log(`Files captured: ${snapshot.files.length}`)

// Save snapshot to file
import { writeFileSync } from "fs"
writeFileSync("snapshot.json", JSON.stringify(snapshot, null, 2))

// Later, restore from snapshot
const newSandbox = await factory.create({ name: "restored" })
await newSandbox.restore(snapshot)
```

## Network Access

exe.dev VMs have full internet access by default - no restrictions or allowlists.

```typescript
// Access any API
const result = await sandbox.exec("curl https://api.github.com")
console.log(result.stdout)

// Install packages from anywhere
await sandbox.exec("pip install requests pandas numpy")
await sandbox.exec("npm install express axios")
```

## Persistent Disk

Unlike ephemeral sandboxes, exe.dev VMs have persistent storage:

```typescript
// Files persist between sessions
await sandbox.writeFile("/home/user/data.json", '{"count": 1}')

// Later, reconnect to the same VM
const existing = await factory.resume("my-project")
if (existing) {
  const data = await existing.readFile("/home/user/data.json")
  console.log("Data:", JSON.parse(data)) // {"count": 1}
}
```

## Root Access

You have full sudo access on exe.dev VMs:

```typescript
// Install system packages
await sandbox.exec("sudo apt-get update && sudo apt-get install -y ffmpeg")

// Modify system configuration
await sandbox.exec("sudo systemctl enable nginx")

// Access everything
await sandbox.exec("sudo cat /etc/passwd")
```

## Error Handling

```typescript
try {
  const sandbox = await factory.create({ name: "test" })

  const result = await sandbox.exec("some-command")

  if (result.exitCode !== 0) {
    console.error("Command failed:", result.stderr)
  }

} catch (error) {
  if (error.message.includes("SSH connection failed")) {
    console.error("Could not connect to exe.dev")
    console.error("Make sure you have authenticated: ssh exe.dev")
  } else {
    console.error("Error:", error.message)
  }
}
```

## Comparison with Other Providers

| Feature | exe.dev | E2B | Daytona |
|---------|---------|-----|---------|
| Architecture | Persistent VMs | Ephemeral Sandboxes | Ephemeral Sandboxes |
| Network Access | Full Internet | Full Internet | Allowlist |
| Pre-installed Agents | Claude, Codex, Shelley | Claude Template | npm install |
| Root Access | Yes (sudo) | Limited | No |
| Persistent Disk | Yes | Snapshot | Snapshot |
| Access Protocol | SSH/SFTP | REST API | REST API |
| Setup | SSH key | API key | API key |

## Best Practices

1. **Name your VMs descriptively** - Makes it easier to manage multiple projects:
   ```typescript
   await factory.create({ name: "project-frontend" })
   await factory.create({ name: "project-api" })
   ```

2. **Use resume for existing VMs** - Don't create duplicates:
   ```typescript
   let sandbox = await factory.resume("my-project")
   if (!sandbox) {
     sandbox = await factory.create({ name: "my-project" })
   }
   ```

3. **Clean up when done** - VMs consume resources:
   ```typescript
   await sandbox.stop()
   ```

4. **Use snapshots before risky operations**:
   ```typescript
   const backup = await sandbox.snapshot()
   // Try something risky...
   if (somethingWentWrong) {
     await sandbox.restore(backup)
   }
   ```

5. **Keep SSH keys secure** - Your key authenticates all exe.dev operations

## Resources

- [exe.dev Website](https://exe.dev)
- [exe.dev Documentation](https://exe.dev/docs)
- [exe.dev Blog](https://blog.exe.dev)
- [Shelley Agent Docs](https://exe.dev/docs/shelley)
