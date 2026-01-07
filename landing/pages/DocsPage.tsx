import React, { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Book, Box, Copy, Check, ChevronRight, ExternalLink } from 'lucide-react';

// Custom dark theme matching site
const codeTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: '#e4e4e7',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  'pre[class*="language-"]': {
    color: '#e4e4e7',
    fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  comment: { color: '#6b7280' },
  prolog: { color: '#6b7280' },
  doctype: { color: '#6b7280' },
  cdata: { color: '#6b7280' },
  punctuation: { color: '#a1a1aa' },
  property: { color: '#93c5fd' },
  tag: { color: '#f472b6' },
  boolean: { color: '#c084fc' },
  number: { color: '#c084fc' },
  constant: { color: '#c084fc' },
  symbol: { color: '#c084fc' },
  selector: { color: '#86efac' },
  'attr-name': { color: '#93c5fd' },
  string: { color: '#86efac' },
  char: { color: '#86efac' },
  builtin: { color: '#93c5fd' },
  operator: { color: '#f472b6' },
  entity: { color: '#fbbf24' },
  url: { color: '#86efac' },
  variable: { color: '#e4e4e7' },
  atrule: { color: '#93c5fd' },
  'attr-value': { color: '#86efac' },
  keyword: { color: '#f472b6' },
  function: { color: '#93c5fd' },
  'class-name': { color: '#fbbf24' },
  regex: { color: '#fbbf24' },
  important: { color: '#f472b6', fontWeight: 'bold' },
};

// Code block component with syntax highlighting
const CodeBlock: React.FC<{ className?: string; children?: React.ReactNode; inline?: boolean }> = ({ className, children, inline }) => {
  const [copied, setCopied] = React.useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline || !match) {
    return (
      <code className="text-zinc-200 bg-zinc-800/50 px-1.5 py-0.5 rounded text-[13px] font-mono">
        {children}
      </code>
    );
  }

  return (
    <div className="relative group my-6">
      <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      </div>
      <SyntaxHighlighter
        style={codeTheme}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          borderRadius: '8px',
          padding: '16px 20px',
          backgroundColor: 'transparent',
          border: '1px solid rgba(63, 63, 70, 0.5)',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

// Generate slug from heading text
const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// Heading component with anchor links
const HeadingWithAnchor: React.FC<{
  level: 1 | 2 | 3;
  children?: React.ReactNode;
}> = ({ level, children }) => {
  const text = String(children);
  const slug = slugify(text);
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  const styles: Record<number, string> = {
    1: 'text-3xl font-semibold text-white mt-0 mb-6 pb-4 border-b border-zinc-800',
    2: 'text-xl font-semibold text-white mt-12 mb-4 scroll-mt-24 group',
    3: 'text-lg font-medium text-zinc-200 mt-8 mb-3 scroll-mt-24 group',
  };

  return (
    <Tag id={slug} className={styles[level]}>
      {children}
      {level > 1 && (
        <a
          href={`#${slug}`}
          className="ml-2 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={`Link to ${text}`}
        >
          #
        </a>
      )}
    </Tag>
  );
};

// Table component
const Table: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="my-6 overflow-x-auto">
    <table className="w-full text-sm">{children}</table>
  </div>
);

const TableHead: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <thead className="border-b border-zinc-800">{children}</thead>
);

const TableRow: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <tr className="border-b border-zinc-800/50">{children}</tr>
);

const TableHeader: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <th className="text-left py-3 px-4 text-zinc-400 font-medium text-xs uppercase tracking-wider">{children}</th>
);

const TableCell: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <td className="py-3 px-4 text-zinc-300">{children}</td>
);

// Provider cards data - Local first, then cloud providers
const providers = [
  {
    name: 'Local',
    tagline: 'Development, offline, no cloud costs',
    features: ['Apple Virtualization.framework', 'No Docker required', '~1s startup', 'macOS only'],
    setup: 'fabric create --provider local',
    link: { text: 'Setup guide', url: '/docs/local-containers' },
    color: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    accent: 'text-purple-400',
  },
  {
    name: 'Daytona',
    tagline: 'Enterprise teams, TypeScript/Node.js',
    features: ['Secure network policies & VPC', 'TypeScript, Python, Go, Rust', '~2-3s startup'],
    setup: 'export DAYTONA_API_KEY=your_key',
    link: { text: 'Get your key', url: 'https://app.daytona.io' },
    color: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    accent: 'text-blue-400',
  },
  {
    name: 'E2B',
    tagline: 'Data science, Python, rapid prototyping',
    features: ['Ultra-fast <200ms cold starts', 'Built-in Jupyter kernel', 'Claude Code template'],
    setup: 'export E2B_API_KEY=your_key',
    link: { text: 'Get your key', url: 'https://e2b.dev/dashboard' },
    color: 'from-orange-500/10 to-orange-600/5',
    border: 'border-orange-500/20 hover:border-orange-500/40',
    accent: 'text-orange-400',
  },
  {
    name: 'exe.dev',
    tagline: 'Persistent environments, full VM control',
    features: ['SSH-based (no API key)', 'Persistent disk across sessions', 'Pre-installed AI agents'],
    setup: 'ssh exe.dev',
    link: { text: 'Learn more', url: 'https://exe.dev' },
    color: 'from-green-500/10 to-green-600/5',
    border: 'border-green-500/20 hover:border-green-500/40',
    accent: 'text-green-400',
  },
];

// Provider card component
const ProviderCard: React.FC<{ provider: typeof providers[0] }> = ({ provider }) => (
  <div className={`rounded-lg border bg-gradient-to-r ${provider.color} ${provider.border} p-5 transition-colors`}>
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h4 className={`text-lg font-semibold ${provider.accent}`}>{provider.name}</h4>
          <span className="text-xs text-zinc-600">•</span>
          <p className="text-sm text-zinc-500">{provider.tagline}</p>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {provider.features.map((feature, i) => (
            <li key={i} className="text-sm text-zinc-400 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col items-start sm:items-end gap-2 sm:min-w-[200px]">
        <code className="text-xs bg-zinc-900/50 text-zinc-300 px-3 py-1.5 rounded font-mono">
          {provider.setup}
        </code>
        <a
          href={provider.link.url}
          className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
        >
          {provider.link.text}
          <span className="text-zinc-600">→</span>
        </a>
      </div>
    </div>
  </div>
);

// Provider cards component - split into Local and Cloud sections
const ProviderCards: React.FC = () => {
  const localProvider = providers[0]; // Local
  const cloudProviders = providers.slice(1); // Daytona, E2B, exe.dev

  return (
    <div className="my-8 space-y-6">
      {/* Local Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Local</span>
          <span className="flex-1 h-px bg-zinc-800"></span>
        </div>
        <div className="bg-zinc-900/80 rounded-lg border border-zinc-800 p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-lg font-semibold text-white">{localProvider.name}</h4>
                <span className="text-xs text-zinc-600">•</span>
                <p className="text-sm text-zinc-500">{localProvider.tagline}</p>
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {localProvider.features.map((feature, i) => (
                  <li key={i} className="text-sm text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-2 sm:min-w-[200px]">
              <code className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded font-mono">
                {localProvider.setup}
              </code>
              <a
                href={localProvider.link.url}
                className="text-sm text-zinc-400 hover:text-white transition-colors inline-flex items-center gap-1"
              >
                {localProvider.link.text}
                <span className="text-zinc-600">→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cloud Providers</span>
          <span className="flex-1 h-px bg-zinc-800"></span>
        </div>
        <div className="space-y-3">
          {cloudProviders.map((provider) => (
            <ProviderCard key={provider.name} provider={provider} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Extract headings for TOC
const extractHeadings = (content: string): { level: number; text: string; slug: string }[] => {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const headings: { level: number; text: string; slug: string }[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    headings.push({
      level: match[1].length,
      text: match[2],
      slug: slugify(match[2]),
    });
  }

  return headings;
};

// Docs content
const docsContent: Record<string, { title: string; content: string }> = {
  'getting-started': {
    title: 'Getting Started',
    content: `# Getting Started with Fabric

Fabric is an ambient compute framework for running code and AI agents across local and cloud sandboxes. Start local, scale to cloud, preserve context everywhere.

## Quick Start

Get a sandbox running in under 2 minutes:

\`\`\`bash
npm install -g fabric-ai

export DAYTONA_API_KEY=your_key

fabric create --provider daytona
fabric exec "echo 'Hello from Fabric!'"
\`\`\`

Or use the SDK directly:

\`\`\`typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({})
const result = await sandbox.exec("echo 'Hello!'")
console.log(result.stdout)
await sandbox.stop()
\`\`\`

## Installation

### CLI (Recommended)

\`\`\`bash
npm install -g fabric-ai
fabric --help
\`\`\`

### SDK Packages

\`\`\`bash
npm install fabric-ai-core
npm install fabric-ai-daytona
npm install fabric-ai-e2b
npm install fabric-ai-exe
\`\`\`

## Provider Setup

Fabric supports multiple sandbox providers. Each has different strengths—choose based on your workflow.

[PROVIDER_CARDS]

## Your First Sandbox

\`\`\`typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

async function main() {
  const factory = new DaytonaSandboxFactory({
    apiKey: process.env.DAYTONA_API_KEY,
    defaultLanguage: "typescript"
  })

  const sandbox = await factory.create({})
  console.log(\`Sandbox ID: \${sandbox.id}\`)

  const result = await sandbox.exec("echo 'Hello, Fabric!'")
  console.log(result.stdout)

  await sandbox.stop()
}

main()
\`\`\`

## Running Code

### Shell Commands

\`\`\`typescript
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

if (result.exitCode !== 0) {
  console.error(result.stderr)
}
\`\`\`

### Code Execution

\`\`\`typescript
const result = await sandbox.runCode(\`
  const greeting = "Hello from TypeScript!"
  console.log(greeting)
\`)
console.log(result.output)
\`\`\`

## File Operations

### Writing Files

\`\`\`typescript
await sandbox.writeFile("/workspace/hello.ts", \`
export function greet(name: string): string {
  return \\\`Hello, \\\${name}!\\\`
}
\`)
\`\`\`

### Reading Files

\`\`\`typescript
const content = await sandbox.readFile("/workspace/hello.ts")
console.log(content)
\`\`\`

## Handoffs

Transfer context between providers seamlessly:

\`\`\`typescript
import { Fabric } from "fabric-ai-core"
import { DaytonaSandboxFactory } from "fabric-ai-daytona"
import { E2BSandboxFactory } from "fabric-ai-e2b"

const fabric = new Fabric()
fabric.registerLocalFactory(daytonaFactory)
fabric.registerCloudFactory(e2bFactory)

const session = await fabric.createSession({
  workspacePath: "/path/to/project",
  runtime: "local"
})

await session.exec("npm install")
await session.delegateToCloud()
await session.exec("npm run build")
await session.reclaimToLocal()
await session.stop()
\`\`\`

## Running Claude Code

[Claude Code](https://docs.anthropic.com/en/docs/claude-code) is Anthropic's official CLI for AI-assisted coding. You can run it inside Fabric sandboxes for autonomous development tasks.

\`\`\`typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY,
  envs: { ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY }
})

const result = await sandbox.commands.run(
  \`echo 'Create a fibonacci function' | claude -p\`,
  { timeoutMs: 120_000 }
)

console.log(result.stdout)
await sandbox.kill()
\`\`\`

## Error Handling

Always clean up sandboxes, even when errors occur:

\`\`\`typescript
const sandbox = await factory.create({})
try {
  await sandbox.exec("some-command")
  await sandbox.exec("another-command")
} finally {
  await sandbox.stop() // Always runs
}
\`\`\`

For transient failures, use retry with backoff:

\`\`\`typescript
async function execWithRetry(sandbox, cmd, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await sandbox.exec(cmd)
    } catch (e) {
      if (i === maxAttempts - 1) throw e
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)))
    }
  }
}
\`\`\`

## Pricing

**Fabric is free.** You bring your own API keys for cloud providers.

| Component | Cost |
|-----------|------|
| Fabric CLI & SDK | Free |
| Local containers | Free (runs on your Mac) |
| Daytona sandboxes | [Daytona pricing](https://daytona.io/pricing) |
| E2B sandboxes | [E2B pricing](https://e2b.dev/pricing) |
| exe.dev VMs | [exe.dev pricing](https://exe.dev) |

We may introduce optional paid features in the future, but the core framework will remain free and open source.

## Next Steps

- [Daytona Guide](/daytona) - Enterprise features and network policies
- [E2B Guide](/e2b) - Jupyter integration and Claude Code template
- [exe.dev Guide](/exe) - Persistent VMs and pre-installed agents
`
  },
  'philosophy': {
    title: 'Philosophy',
    content: `# Philosophy

Fabric is built on a simple premise: **compute should follow you**.

## Why Fabric?

You could use provider SDKs directly—Daytona, E2B, and exe.dev all have great APIs. So why add Fabric?

**1. Unified interface.** Write code once, run anywhere. Switch providers by changing one line.

**2. Handoffs.** Move running work between local and cloud without losing context. No other tool does this.

**3. Local-first.** Start development locally with Apple containers (no Docker), scale to cloud when needed.

**4. Future-proof.** As new providers emerge, your code stays the same.

If you only use one provider and don't need handoffs, use their SDK directly. If you want flexibility, use Fabric.

## The Problem

Today's AI agents are constrained by where they run. Start a Claude Code session locally, and you're limited to your machine's resources. Move to the cloud, and you lose context. Switch providers, and you start over.

This fragmentation wastes time and breaks flow.

## Our Approach

Fabric creates an abstraction layer that makes compute ambient:

\`\`\`
┌─────────────────────────────────────────────────┐
│              Context Layer                       │
│    (conversation, agent state, checkpoints)      │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │  Local  │ ─▶ │ Container│ ─▶ │  Cloud  │
   │  (Mac)  │    │ (Apple) │    │(E2B/etc)│
   └─────────┘    └─────────┘    └─────────┘
\`\`\`

Work starts anywhere. Context persists always.

## Design Principles

### Provider Agnostic

Fabric doesn't lock you into a single cloud provider. The same code works across Daytona, E2B, exe.dev, or local containers:

\`\`\`typescript
const sandbox = await factory.create({})
await sandbox.exec("your command")
await sandbox.stop()
\`\`\`

Switch providers by changing one line.

### Context Preservation

Snapshots capture filesystem state, environment variables, and execution history. Restore anywhere:

\`\`\`typescript
const snapshot = await localSandbox.snapshot()
await cloudSandbox.restore(snapshot)
\`\`\`

### Local First

Development happens locally. Fabric provides lightweight containers using Apple's Virtualization framework—no Docker overhead, native performance.

### Progressive Enhancement

Start simple. Add cloud scaling when you need it. The abstraction grows with your requirements.

## Why Apple Containers?

For local development, Fabric uses Apple's Virtualization.framework to run Linux containers in lightweight VMs. This gives you:

- **Native performance** - Hardware-accelerated virtualization on Apple Silicon
- **No Docker** - Skip the daemon overhead
- **Full Linux** - Real kernel, real filesystem, real networking
- **Fast startup** - Containers boot in ~1 second

Learn more in our [Local Containers](/docs/local-containers) guide.

## The Handoff Pattern

The core innovation in Fabric is seamless handoffs:

1. **Local → Container**: Move from host execution to isolated container
2. **Container → Cloud**: Scale to cloud providers when local resources are insufficient
3. **Cloud → Cloud**: Migrate between providers without losing state
4. **Cloud → Local**: Reclaim work back to your machine

Each transition preserves context through snapshots.
`
  },
  'local-containers': {
    title: 'Local Containers',
    content: `# Local Containers

> **macOS only.** Local containers require macOS 13+ on Apple Silicon (M1/M2/M3/M4). On other platforms, use cloud providers instead.

Fabric provides native container support on macOS using Apple's Virtualization.framework.

## Overview

Instead of relying on Docker, Fabric uses Apple's built-in virtualization to run Linux containers. This approach offers several advantages:

- No Docker daemon required
- Native Apple Silicon performance
- Lightweight VM overhead
- Fast container startup (~1s)

## Requirements

- macOS 13.0+ (Ventura or later)
- Apple Silicon (M1/M2/M3/M4)
- Xcode Command Line Tools

## How It Works

Fabric's local container runtime uses [Containerization](https://github.com/apple/containerization), Apple's framework for running Linux containers in lightweight VMs:

\`\`\`
┌──────────────────────────────────────┐
│           Your Mac (Host)            │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │     Virtualization.framework   │  │
│  │  ┌──────────────────────────┐  │  │
│  │  │    Lightweight Linux VM  │  │  │
│  │  │  ┌────────────────────┐  │  │  │
│  │  │  │  Your Container    │  │  │  │
│  │  │  │  (alpine, debian)  │  │  │  │
│  │  │  └────────────────────┘  │  │  │
│  │  └──────────────────────────┘  │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
\`\`\`

## Setup

Build the container runtime:

\`\`\`bash
cd packages/runtime-local/FabricContainer
swift build -c release
\`\`\`

## Usage

### Via CLI

\`\`\`bash
fabric create --provider local
fabric exec "echo 'Hello from container!'"
\`\`\`

### Via SDK

\`\`\`typescript
import { LocalContainerFactory } from "@arach/runtime-local"

const factory = new LocalContainerFactory()
const sandbox = await factory.create({
  image: "alpine:latest"
})

const result = await sandbox.exec("uname -a")
console.log(result.stdout) // Linux ...

await sandbox.stop()
\`\`\`

## Supported Images

Any OCI-compatible image works. Common choices:

| Image | Use Case |
|-------|----------|
| alpine:latest | Minimal, fast startup |
| ubuntu:22.04 | Full development environment |
| debian:bookworm | Stable, well-tested |
| oven/bun:latest | JavaScript/TypeScript runtime |
| python:3.12 | Python development |

## Performance

Compared to Docker Desktop on Apple Silicon:

| Metric | Docker | Fabric Local |
|--------|--------|--------------|
| Cold start | ~3-5s | ~1s |
| Memory overhead | ~2GB | ~256MB |
| CPU overhead | Moderate | Minimal |

## Transitioning to Cloud

When local resources aren't enough, hand off to cloud:

\`\`\`typescript
const snapshot = await localSandbox.snapshot()
await localSandbox.stop()

const cloudSandbox = await e2bFactory.create({})
await cloudSandbox.restore(snapshot)
\`\`\`

Your files, environment, and state transfer seamlessly.
`
  },
  'api-reference': {
    title: 'API Reference',
    content: `# API Reference

TypeScript interfaces for the Fabric SDK.

## Sandbox

The main interface for interacting with a sandbox.

\`\`\`typescript
interface Sandbox {
  readonly id: string
  readonly runtimeType: "daytona" | "e2b" | "exe" | "local-container"
  readonly status: "starting" | "running" | "stopped" | "error"

  exec(command: string, options?: ExecOptions): Promise<ExecResult>
  runCode(code: string, language?: string): Promise<RunCodeResult>
  writeFile(path: string, content: string | Buffer): Promise<void>
  readFile(path: string): Promise<string>
  listFiles(path: string): Promise<string[]>
  snapshot(): Promise<SandboxSnapshot>
  restore(snapshot: SandboxSnapshot): Promise<void>
  stop(): Promise<void>
}
\`\`\`

## ExecOptions

\`\`\`typescript
interface ExecOptions {
  /** Timeout in milliseconds. Default: 30000 */
  timeoutMs?: number
  /** Working directory */
  cwd?: string
  /** Additional environment variables */
  env?: Record<string, string>
}
\`\`\`

## ExecResult

\`\`\`typescript
interface ExecResult {
  stdout: string
  stderr: string
  exitCode: number
}
\`\`\`

## RunCodeResult

\`\`\`typescript
interface RunCodeResult {
  output: string
  error?: string
}
\`\`\`

## CreateOptions

\`\`\`typescript
interface CreateOptions {
  /** Language: "typescript" | "python" | "go" | "rust" | "javascript" */
  language?: string
  /** Environment variables */
  envVars?: Record<string, string>
  /** Container image (local only) */
  image?: string
  /** Sandbox name (exe.dev only) */
  name?: string
  /** Creation timeout in ms */
  timeoutMs?: number
}
\`\`\`

## SandboxSnapshot

Used for handoffs between providers.

\`\`\`typescript
interface SandboxSnapshot {
  files: Array<{
    path: string
    content: string
    encoding: "utf-8" | "base64"
  }>
  env: Record<string, string>
  metadata?: Record<string, unknown>
  timestamp: string
}
\`\`\`

## SandboxFactory

\`\`\`typescript
interface SandboxFactory {
  create(options?: CreateOptions): Promise<Sandbox>
  resume(id: string): Promise<Sandbox>
  list(): Promise<Array<{ id: string; status: string }>>
}
\`\`\`

## Provider Constructors

### Daytona

\`\`\`typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

new DaytonaSandboxFactory({
  apiKey: string,
  defaultLanguage?: string,
  apiUrl?: string,
})
\`\`\`

### E2B

\`\`\`typescript
import { E2BSandboxFactory } from "fabric-ai-e2b"

new E2BSandboxFactory(apiKey: string, template?: string)
\`\`\`

### exe.dev

\`\`\`typescript
import { ExeSandboxFactory } from "fabric-ai-exe"

new ExeSandboxFactory({ sshKeyPath?: string })
\`\`\`

### Local

\`\`\`typescript
import { LocalContainerFactory } from "fabric-ai-local"

new LocalContainerFactory({ defaultImage?: string })
\`\`\`
`
  }
};

// Sidebar navigation
const docsNav = [
  { slug: 'getting-started', title: 'Getting Started' },
  { slug: 'philosophy', title: 'Philosophy' },
  { slug: 'local-containers', title: 'Local Containers' },
  { slug: 'api-reference', title: 'API Reference' },
];

export const DocsPage: React.FC = () => {
  const { slug = 'getting-started' } = useParams<{ slug: string }>();
  const location = useLocation();
  const doc = docsContent[slug];
  const [activeHeading, setActiveHeading] = useState<string>('');

  const headings = doc ? extractHeadings(doc.content) : [];

  // Scroll spy for TOC
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHeading(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(({ slug }) => {
      const element = document.getElementById(slug);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [slug, headings]);

  // Scroll to hash on load
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location.hash]);

  if (!doc) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Page not found</h1>
          <Link to="/docs/getting-started" className="text-zinc-400 hover:text-white transition-colors">
            Go to Getting Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Navbar />

      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-16">
            {/* Left Sidebar - Navigation */}
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <div className="sticky top-24 pb-12">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors mb-8"
                >
                  <ArrowLeft size={14} />
                  Home
                </Link>

                <nav className="space-y-1">
                  {docsNav.map((item) => {
                    const isActive = item.slug === slug;
                    return (
                      <Link
                        key={item.slug}
                        to={`/docs/${item.slug}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-zinc-900 text-white'
                            : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        <ChevronRight size={14} className={isActive ? 'text-zinc-400' : 'text-zinc-700'} />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-10 pt-6 border-t border-zinc-800">
                  <h4 className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-3">Providers</h4>
                  <nav className="space-y-1">
                    {[
                      { href: '/daytona', label: 'Daytona' },
                      { href: '/e2b', label: 'E2B' },
                      { href: '/exe', label: 'exe.dev' },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        to={item.href}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-500 hover:text-white transition-colors"
                      >
                        <ExternalLink size={12} />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0 pb-24">
              <article className="max-w-3xl">
                {doc.content.split('[PROVIDER_CARDS]').map((part, index, arr) => (
                  <React.Fragment key={index}>
                    <ReactMarkdown
                      components={{
                        code: CodeBlock,
                        h1: ({ children }) => <HeadingWithAnchor level={1}>{children}</HeadingWithAnchor>,
                        h2: ({ children }) => <HeadingWithAnchor level={2}>{children}</HeadingWithAnchor>,
                        h3: ({ children }) => <HeadingWithAnchor level={3}>{children}</HeadingWithAnchor>,
                        p: ({ children }) => <p className="text-zinc-400 leading-relaxed mb-4">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside text-zinc-400 mb-4 space-y-1">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside text-zinc-400 mb-4 space-y-1">{children}</ol>,
                        li: ({ children }) => <li className="text-zinc-400">{children}</li>,
                        a: ({ href, children }) => (
                          <a href={href} className="text-white hover:text-zinc-300 underline underline-offset-2 transition-colors">
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => <strong className="text-white font-medium">{children}</strong>,
                        hr: () => <hr className="border-zinc-800 my-10" />,
                        table: Table,
                        thead: TableHead,
                        tr: TableRow,
                        th: TableHeader,
                        td: TableCell,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-zinc-700 pl-4 my-4 text-zinc-500 italic">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {part}
                    </ReactMarkdown>
                    {index < arr.length - 1 && <ProviderCards />}
                  </React.Fragment>
                ))}
              </article>
            </main>

            {/* Right Sidebar - Table of Contents */}
            <aside className="hidden xl:block w-56 flex-shrink-0">
              <div className="sticky top-24">
                <h4 className="text-xs font-medium text-zinc-600 uppercase tracking-wider mb-4">On this page</h4>
                <nav className="space-y-1">
                  {headings.map(({ level, text, slug: headingSlug }) => (
                    <a
                      key={headingSlug}
                      href={`#${headingSlug}`}
                      className={`block text-sm transition-colors ${
                        level === 3 ? 'pl-3' : ''
                      } ${
                        activeHeading === headingSlug
                          ? 'text-white'
                          : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      {text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
