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

// E2B logo SVG component
const E2BLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="20" height="22" viewBox="0 0 26 28" fill="currentColor" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M21.8458 19.3029C21.6671 19.3029 21.5555 19.4963 21.6448 19.6511L23.5141 22.889C23.6175 23.0681 23.4528 23.2828 23.253 23.2293L17.5836 21.7101C17.3359 21.6437 17.0813 21.7907 17.0149 22.0384L15.4958 27.7079C15.4422 27.9077 15.1739 27.943 15.0705 27.7639L13.2008 24.5254C13.1115 24.3707 12.8881 24.3707 12.7987 24.5254L10.929 27.7639C10.8256 27.943 10.5573 27.9077 10.5038 27.7079L8.9846 22.0384C8.91824 21.7907 8.66365 21.6437 8.41597 21.7101L2.74652 23.2293C2.54675 23.2828 2.38199 23.0681 2.4854 22.889L4.35472 19.6511C4.44406 19.4963 4.33238 19.3029 4.15368 19.3029L0.415222 19.3028C0.208406 19.3028 0.104834 19.0528 0.251077 18.9066L4.40145 14.7563C4.58277 14.5749 4.58277 14.281 4.40145 14.0997L0.251079 9.94927C0.104837 9.80302 0.208414 9.55297 0.415232 9.55297L4.15328 9.55302C4.33198 9.55302 4.44368 9.35957 4.35433 9.20481L2.4854 5.96763C2.38199 5.78852 2.54676 5.5738 2.74652 5.62733L8.41597 7.14652C8.66365 7.21288 8.91824 7.0659 8.98461 6.81822L10.5038 1.14869C10.5573 0.948918 10.8256 0.913592 10.929 1.0927L12.7987 4.33116C12.8881 4.48593 13.1114 4.48593 13.2008 4.33116L15.0705 1.0927C15.1739 0.913592 15.4422 0.948917 15.4957 1.14869L17.0149 6.81822C17.0813 7.0659 17.3359 7.21288 17.5835 7.14652L23.253 5.62733C23.4528 5.5738 23.6175 5.78852 23.5141 5.96763L21.6452 9.20481C21.5558 9.35957 21.6675 9.55302 21.8462 9.55302L25.5844 9.55297C25.7912 9.55297 25.8948 9.80302 25.7486 9.94927L21.5982 14.0997C21.4169 14.281 21.4169 14.5749 21.5982 14.7563L25.7486 18.9066C25.8948 19.0528 25.7912 19.3028 25.5844 19.3028L21.8458 19.3029ZM20.419 10.404C20.5869 10.236 20.4241 9.9541 20.1947 10.0156L15.1461 11.3684C14.8984 11.4348 14.6438 11.2878 14.5775 11.0401L13.224 5.98888C13.1625 5.75947 12.837 5.75947 12.7755 5.98888L11.422 11.0401C11.3557 11.2878 11.1011 11.4348 10.8534 11.3684L5.80496 10.0156C5.57555 9.95414 5.41278 10.2361 5.58072 10.404L9.27643 14.0997C9.45774 14.281 9.45774 14.575 9.27643 14.7563L5.57985 18.4528C5.41191 18.6208 5.57467 18.9027 5.80409 18.8412L10.8534 17.4882C11.1011 17.4218 11.3557 17.5688 11.422 17.8165L12.7755 22.8677C12.837 23.0972 13.1625 23.0972 13.224 22.8677L14.5775 17.8165C14.6439 17.5688 14.8984 17.4218 15.1461 17.4882L20.1956 18.8413C20.425 18.9027 20.5878 18.6208 20.4198 18.4529L16.7232 14.7563C16.5419 14.575 16.5419 14.281 16.7232 14.0997L20.419 10.404Z" />
  </svg>
);

// Provider data
const cloudProviders = [
  {
    name: 'Daytona',
    tagline: 'Enterprise teams, TypeScript/Node.js',
    features: ['Secure network policies & VPC', 'TypeScript, Python, Go, Rust', '~2-3s startup'],
    commands: ['export DAYTONA_API_KEY=your_key', 'fabric create --provider daytona'],
    link: { text: 'Get your key', url: 'https://app.daytona.io' },
    logo: 'https://github.com/daytonaio/daytona/raw/main/assets/images/Daytona-logotype-white.png',
    logoType: 'img' as const,
  },
  {
    name: 'E2B',
    tagline: 'Data science, Python, rapid prototyping',
    features: ['Ultra-fast <200ms cold starts', 'Built-in Jupyter kernel', 'Claude Code template'],
    commands: ['export E2B_API_KEY=your_key', 'fabric create --provider e2b'],
    link: { text: 'Get your key', url: 'https://e2b.dev/dashboard' },
    logo: null,
    logoType: 'e2b' as const,
  },
  {
    name: 'exe.dev',
    tagline: 'Persistent VMs, full root access',
    features: ['SSH-based (no API key)', 'Persistent disk across sessions', 'Pre-installed AI agents'],
    commands: ['ssh exe.dev', 'fabric create --provider exe'],
    link: { text: 'Learn more', url: 'https://exe.dev' },
    logo: 'https://exe.dev/static/exy.png',
    logoType: 'img-with-name' as const,
  },
];

// Inline code with copy
const InlineCode: React.FC<{ children: string }> = ({ children }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <code
      onClick={handleCopy}
      className="text-xs bg-zinc-900/80 text-zinc-300 px-2 py-1 rounded font-mono cursor-pointer hover:bg-zinc-800 transition-colors inline-flex items-center gap-2 group"
      title="Click to copy"
    >
      {children}
      <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
        {copied ? <Check size={10} /> : <Copy size={10} />}
      </span>
    </code>
  );
};

// Provider cards component
const ProviderCards: React.FC = () => {
  return (
    <div className="my-8 space-y-4">
      {/* Local Section */}
      <div className="rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-blue-600/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-blue-400">Local</span>
            <span className="text-sm text-zinc-500">Development, offline, no cloud costs</span>
          </div>
          <a href="/docs/local-containers" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Setup guide →
          </a>
        </div>
        <ul className="space-y-1 mb-3">
          <li className="text-sm text-zinc-400">• Apple Virtualization.framework</li>
          <li className="text-sm text-zinc-400">• No Docker required</li>
          <li className="text-sm text-zinc-400">• ~1s startup</li>
          <li className="text-sm text-zinc-400">• macOS only</li>
        </ul>
        <div className="space-y-2">
          <InlineCode>fabric create --provider local</InlineCode>
        </div>
      </div>

      {/* Cloud Section */}
      <div className="rounded-lg border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 overflow-hidden">
        {cloudProviders.map((provider, index) => (
          <div
            key={provider.name}
            className={`p-5 ${index > 0 ? 'border-t border-emerald-500/10' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {provider.logoType === 'img' ? (
                  <img src={provider.logo!} alt={provider.name} className="h-5 w-auto" />
                ) : provider.logoType === 'e2b' ? (
                  <div className="flex items-center gap-2">
                    <E2BLogo className="text-white" />
                    <span className="font-semibold text-white">E2B</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <img src={provider.logo!} alt={provider.name} className="h-5 w-auto" />
                    <span className="font-semibold text-white">{provider.name}</span>
                  </div>
                )}
                <span className="text-sm text-zinc-500">{provider.tagline}</span>
              </div>
              <a
                href={provider.link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                {provider.link.text} →
              </a>
            </div>
            <ul className="space-y-1 mb-3">
              {provider.features.map((feature, i) => (
                <li key={i} className="text-sm text-zinc-400">• {feature}</li>
              ))}
            </ul>
            <div className="space-y-2">
              {provider.commands.map((cmd, i) => (
                <InlineCode key={i}>{cmd}</InlineCode>
              ))}
            </div>
          </div>
        ))}
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
