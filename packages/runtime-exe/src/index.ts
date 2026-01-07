/**
 * fabric-ai-exe
 *
 * exe.dev VM sandbox adapter for Fabric
 * SSH-based cloud VMs with persistent disks
 */

import { Client, SFTPWrapper } from "ssh2"
import { readFileSync, existsSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import type {
  Sandbox,
  SandboxFactory,
  SandboxSnapshot,
  RuntimeType,
  MountSpec,
} from "fabric-ai-core"

// ============================================================================
// ExeSandbox - Implements Fabric's Sandbox interface via SSH
// ============================================================================

export class ExeSandbox implements Sandbox {
  readonly id: string
  readonly runtimeType: RuntimeType = "exe" as RuntimeType
  readonly vmHost: string

  private _status: "starting" | "running" | "stopped" | "error" = "starting"
  private sshConfig: SSHConfig
  private client: Client | null = null

  constructor(vmName: string, sshConfig: SSHConfig) {
    this.id = vmName
    this.vmHost = `${vmName}.exe.xyz`
    this.sshConfig = sshConfig
    this._status = "running"
  }

  get status() {
    return this._status
  }

  get ipAddress(): string | undefined {
    return this.vmHost
  }

  // SSH Connection helpers
  private async connect(): Promise<Client> {
    if (this.client) return this.client

    return new Promise((resolve, reject) => {
      const client = new Client()

      client
        .on("ready", () => {
          this.client = client
          resolve(client)
        })
        .on("error", (err) => {
          reject(new Error(`SSH connection failed: ${err.message}`))
        })
        .connect({
          host: this.vmHost,
          port: 22,
          username: this.sshConfig.username || "user",
          privateKey: this.sshConfig.privateKey,
        })
    })
  }

  private disconnect(): void {
    if (this.client) {
      this.client.end()
      this.client = null
    }
  }

  // Lifecycle
  async start(): Promise<void> {
    // exe.dev VMs are started on creation
    this._status = "running"
  }

  async stop(): Promise<void> {
    this.disconnect()

    // Delete the VM via exe.dev control plane
    await this.execOnControlPlane(`rm ${this.id}`)
    this._status = "stopped"
  }

  // Execute on exe.dev control plane (ssh exe.dev <command>)
  private async execOnControlPlane(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = new Client()

      client
        .on("ready", () => {
          client.exec(command, (err, stream) => {
            if (err) {
              client.end()
              reject(err)
              return
            }

            let stdout = ""
            let stderr = ""

            stream
              .on("close", (code: number) => {
                client.end()
                if (code !== 0 && stderr) {
                  reject(new Error(stderr))
                } else {
                  resolve(stdout)
                }
              })
              .on("data", (data: Buffer) => {
                stdout += data.toString()
              })
              .stderr.on("data", (data: Buffer) => {
                stderr += data.toString()
              })
          })
        })
        .on("error", (err) => {
          reject(new Error(`SSH connection to exe.dev failed: ${err.message}`))
        })
        .connect({
          host: "exe.dev",
          port: 22,
          username: this.sshConfig.username || "user",
          privateKey: this.sshConfig.privateKey,
        })
    })
  }

  // Execution
  async exec(command: string): Promise<{
    stdout: string
    stderr: string
    exitCode: number
  }> {
    const client = await this.connect()

    return new Promise((resolve, reject) => {
      client.exec(command, (err, stream) => {
        if (err) {
          reject(err)
          return
        }

        let stdout = ""
        let stderr = ""
        let exitCode = 0

        stream
          .on("close", (code: number) => {
            exitCode = code || 0
            resolve({ stdout, stderr, exitCode })
          })
          .on("data", (data: Buffer) => {
            stdout += data.toString()
          })
          .stderr.on("data", (data: Buffer) => {
            stderr += data.toString()
          })
      })
    })
  }

  async runCode(code: string, language?: string): Promise<{
    output: string
    error?: string
  }> {
    // Determine how to run based on language
    const lang = language || "bash"
    let command: string

    switch (lang) {
      case "python":
      case "python3":
        // Write code to temp file and execute
        const pyFile = `/tmp/fabric_${Date.now()}.py`
        await this.writeFile(pyFile, code)
        command = `python3 ${pyFile}`
        break

      case "javascript":
      case "js":
      case "node":
        const jsFile = `/tmp/fabric_${Date.now()}.js`
        await this.writeFile(jsFile, code)
        command = `node ${jsFile}`
        break

      case "typescript":
      case "ts":
        const tsFile = `/tmp/fabric_${Date.now()}.ts`
        await this.writeFile(tsFile, code)
        // Use bun or npx tsx
        command = `bun ${tsFile} 2>/dev/null || npx tsx ${tsFile}`
        break

      case "bash":
      case "shell":
      case "sh":
      default:
        command = code
        break
    }

    const result = await this.exec(command)

    if (result.exitCode !== 0) {
      return {
        output: result.stdout,
        error: result.stderr || `Exit code: ${result.exitCode}`,
      }
    }

    return { output: result.stdout }
  }

  // File System via SFTP
  private async getSFTP(): Promise<SFTPWrapper> {
    const client = await this.connect()

    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) reject(err)
        else resolve(sftp)
      })
    })
  }

  async writeFile(path: string, content: string | Buffer): Promise<void> {
    const sftp = await this.getSFTP()
    const data = typeof content === "string" ? Buffer.from(content) : content

    return new Promise((resolve, reject) => {
      const stream = sftp.createWriteStream(path)
      stream.on("close", () => resolve())
      stream.on("error", reject)
      stream.end(data)
    })
  }

  async readFile(path: string): Promise<string> {
    const sftp = await this.getSFTP()

    return new Promise((resolve, reject) => {
      let data = ""
      const stream = sftp.createReadStream(path)
      stream.on("data", (chunk: Buffer) => {
        data += chunk.toString()
      })
      stream.on("close", () => resolve(data))
      stream.on("error", reject)
    })
  }

  async listFiles(path: string): Promise<string[]> {
    const sftp = await this.getSFTP()

    return new Promise((resolve, reject) => {
      sftp.readdir(path, (err, list) => {
        if (err) reject(err)
        else resolve(list.map((f) => f.filename))
      })
    })
  }

  // Snapshot/Restore
  async snapshot(): Promise<SandboxSnapshot> {
    const files: SandboxSnapshot["files"] = []
    const workspacePath = "/home/user"

    try {
      const fileList = await this.listFiles(workspacePath)
      for (const filename of fileList.slice(0, 50)) {
        // Limit to 50 files
        if (filename.startsWith(".")) continue // Skip hidden files

        try {
          const content = await this.readFile(`${workspacePath}/${filename}`)
          files.push({
            path: `${workspacePath}/${filename}`,
            content: Buffer.from(content).toString("base64"),
            encoding: "base64",
          })
        } catch {
          // Skip files that can't be read
        }
      }
    } catch {
      // Workspace might not exist
    }

    return {
      id: `snapshot-${this.id}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      workspacePath,
      files,
    }
  }

  async restore(snapshot: SandboxSnapshot): Promise<void> {
    for (const file of snapshot.files) {
      const content =
        file.encoding === "base64"
          ? Buffer.from(file.content, "base64").toString("utf8")
          : file.content
      await this.writeFile(file.path, content)
    }
  }

  // Handoff
  async delegate(targetRuntime: RuntimeType): Promise<{
    token: string
    snapshot: SandboxSnapshot
  }> {
    const snapshot = await this.snapshot()
    const token = `exe-handoff-${this.id}-${Date.now()}`
    return { token, snapshot }
  }

  async reclaim(token: string, snapshot: SandboxSnapshot): Promise<void> {
    await this.restore(snapshot)
  }
}

// ============================================================================
// ExeSandboxFactory - Creates exe.dev VM instances via SSH
// ============================================================================

export interface SSHConfig {
  privateKey: Buffer
  username?: string
}

export interface ExeSandboxFactoryOptions {
  /** Path to SSH private key (defaults to ~/.ssh/id_ed25519 or ~/.ssh/id_rsa) */
  privateKeyPath?: string
  /** SSH private key content (alternative to path) */
  privateKey?: Buffer | string
  /** SSH username (usually your exe.dev username) */
  username?: string
  /** Default container image for new VMs */
  defaultImage?: string
}

export class ExeSandboxFactory implements SandboxFactory {
  private sshConfig: SSHConfig
  private options: ExeSandboxFactoryOptions
  private activeSandboxes: Map<string, ExeSandbox> = new Map()

  constructor(options: ExeSandboxFactoryOptions = {}) {
    this.options = options
    this.sshConfig = this.loadSSHConfig(options)
  }

  private loadSSHConfig(options: ExeSandboxFactoryOptions): SSHConfig {
    let privateKey: Buffer

    if (options.privateKey) {
      privateKey =
        typeof options.privateKey === "string"
          ? Buffer.from(options.privateKey)
          : options.privateKey
    } else {
      // Try to load from common locations
      const keyPaths = [
        options.privateKeyPath,
        join(homedir(), ".ssh", "id_ed25519"),
        join(homedir(), ".ssh", "id_rsa"),
      ].filter(Boolean) as string[]

      let found = false
      for (const keyPath of keyPaths) {
        if (existsSync(keyPath)) {
          privateKey = readFileSync(keyPath)
          found = true
          break
        }
      }

      if (!found) {
        throw new Error(
          "SSH private key not found. Provide privateKey or privateKeyPath option, " +
            "or ensure ~/.ssh/id_ed25519 or ~/.ssh/id_rsa exists."
        )
      }
    }

    return {
      privateKey: privateKey!,
      username: options.username,
    }
  }

  async create(options: {
    id?: string
    image?: string
    workspacePath?: string
    mounts?: MountSpec[]
    name?: string
  }): Promise<Sandbox> {
    // Create VM via exe.dev control plane
    const vmName = options.name || options.id || `fabric-${Date.now()}`
    const image = options.image || this.options.defaultImage

    // Build the new command
    let createCmd = `new ${vmName}`
    if (image) {
      createCmd += ` --image ${image}`
    }

    // Execute on exe.dev control plane
    const result = await this.execOnControlPlane(createCmd)

    // Parse the result to get the actual VM name (exe.dev might modify it)
    const actualName = this.parseVMName(result) || vmName

    const sandbox = new ExeSandbox(actualName, this.sshConfig)
    this.activeSandboxes.set(sandbox.id, sandbox)

    return sandbox
  }

  private parseVMName(output: string): string | null {
    // exe.dev typically outputs something like "Created VM: myvm"
    // or provides the name in the response
    const match = output.match(/(?:Created|created|VM|vm)[:\s]+(\S+)/i)
    return match ? match[1].replace(".exe.xyz", "") : null
  }

  private async execOnControlPlane(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const client = new Client()

      client
        .on("ready", () => {
          client.exec(command, (err, stream) => {
            if (err) {
              client.end()
              reject(err)
              return
            }

            let stdout = ""
            let stderr = ""

            stream
              .on("close", (code: number) => {
                client.end()
                if (code !== 0 && stderr) {
                  reject(new Error(stderr))
                } else {
                  resolve(stdout)
                }
              })
              .on("data", (data: Buffer) => {
                stdout += data.toString()
              })
              .stderr.on("data", (data: Buffer) => {
                stderr += data.toString()
              })
          })
        })
        .on("error", (err) => {
          reject(new Error(`SSH connection to exe.dev failed: ${err.message}`))
        })
        .connect({
          host: "exe.dev",
          port: 22,
          username: this.sshConfig.username || "user",
          privateKey: this.sshConfig.privateKey,
        })
    })
  }

  async resume(id: string): Promise<Sandbox | null> {
    // Check if we have it in memory
    const existing = this.activeSandboxes.get(id)
    if (existing) {
      return existing
    }

    // Try to connect to existing VM
    try {
      const sandbox = new ExeSandbox(id, this.sshConfig)
      // Test connection
      await sandbox.exec("echo ok")
      this.activeSandboxes.set(id, sandbox)
      return sandbox
    } catch {
      return null
    }
  }

  async list(): Promise<{ id: string; status: string }[]> {
    try {
      const output = await this.execOnControlPlane("ls")
      // Parse the ls output to get VM names and statuses
      const vms: { id: string; status: string }[] = []

      for (const line of output.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed) continue

        // exe.dev ls typically shows VM names, possibly with status
        const parts = trimmed.split(/\s+/)
        if (parts[0]) {
          vms.push({
            id: parts[0].replace(".exe.xyz", ""),
            status: parts[1] || "running",
          })
        }
      }

      return vms
    } catch {
      // Fallback to in-memory list
      return Array.from(this.activeSandboxes.entries()).map(([id, sandbox]) => ({
        id,
        status: sandbox.status,
      }))
    }
  }
}

/**
 * Create an exe.dev sandbox factory with the given options
 */
export function createExeFactory(
  options?: ExeSandboxFactoryOptions
): SandboxFactory {
  return new ExeSandboxFactory(options)
}
