import React from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowLeft, Book, FileText, Box } from 'lucide-react';

// Docs content - embedded for static site generation
const docsContent: Record<string, { title: string; content: string }> = {
  'getting-started': {
    title: 'Getting Started',
    content: `# Getting Started with Fabric

Fabric is an ambient compute framework for running code and AI agents across local and cloud sandboxes. This guide will help you get up and running quickly.

## Quick Start

Get a sandbox running in under 2 minutes:

\`\`\`bash
# Install the CLI
npm install -g fabric-ai

# Set up your provider (pick one)
export DAYTONA_API_KEY=your_key      # Daytona
export E2B_API_KEY=your_key          # E2B
# or just \`ssh exe.dev\` for exe.dev

# Create and use a sandbox
fabric create --provider daytona
fabric exec "echo 'Hello from Fabric!'"
fabric stop
\`\`\`

Or use the SDK directly:

\`\`\`typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY!,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({})
const result = await sandbox.exec("echo 'Hello from Fabric!'")
console.log(result.stdout) // "Hello from Fabric!"
await sandbox.stop()
\`\`\`

---

## Installation

### Option 1: CLI (Recommended)

\`\`\`bash
# Install globally with npm
npm install -g fabric-ai

# Or with pnpm
pnpm add -g fabric-ai

# Verify installation
fabric --help
\`\`\`

### Option 2: SDK Packages

\`\`\`bash
# Core (always required)
npm install fabric-ai-core

# Pick your provider(s)
npm install fabric-ai-daytona  # Daytona cloud sandboxes
npm install fabric-ai-e2b      # E2B cloud sandboxes
npm install fabric-ai-exe      # exe.dev persistent VMs
\`\`\`

---

## Provider Setup

Fabric supports multiple cloud sandbox providers:

| Provider | Best For | Auth Method | Startup Time |
|----------|----------|-------------|--------------|
| **Daytona** | Enterprise, TypeScript | API Key | ~2-3s |
| **E2B** | Data science, Python | API Key | <200ms |
| **exe.dev** | Full control, persistent VMs | SSH Key | ~2s |
| **Local** | Development, no cloud needed | None | ~1s |

### Daytona

1. Sign up at [app.daytona.io](https://app.daytona.io)
2. Navigate to Settings > API Keys
3. Set environment variable:

\`\`\`bash
export DAYTONA_API_KEY=your_daytona_api_key
\`\`\`

### E2B

1. Sign up at [e2b.dev](https://e2b.dev)
2. Go to [e2b.dev/dashboard](https://e2b.dev/dashboard)
3. Set environment variable:

\`\`\`bash
export E2B_API_KEY=your_e2b_api_key
\`\`\`

### exe.dev

1. Ensure you have an SSH key:

\`\`\`bash
ls ~/.ssh/id_ed25519 || ssh-keygen -t ed25519
\`\`\`

2. Authenticate with exe.dev:

\`\`\`bash
ssh exe.dev
\`\`\`

---

## Your First Sandbox

\`\`\`typescript
import { DaytonaSandboxFactory } from "fabric-ai-daytona"

async function main() {
  // 1. Create a factory
  const factory = new DaytonaSandboxFactory({
    apiKey: process.env.DAYTONA_API_KEY!,
    defaultLanguage: "typescript"
  })

  // 2. Create a sandbox
  const sandbox = await factory.create({})
  console.log(\`Sandbox ID: \${sandbox.id}\`)

  // 3. Run a command
  const result = await sandbox.exec("echo 'Hello, Fabric!'")
  console.log(\`Output: \${result.stdout}\`)

  // 4. Clean up
  await sandbox.stop()
}

main().catch(console.error)
\`\`\`

---

## Running Code

### Shell Commands

\`\`\`typescript
const result = await sandbox.exec("ls -la")
console.log(result.stdout)

// Check exit code
const npmResult = await sandbox.exec("npm install express")
if (npmResult.exitCode !== 0) {
  console.error("Install failed:", npmResult.stderr)
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

---

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

---

## Handoffs

Transfer execution context between providers seamlessly:

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

// Work locally
await session.exec("npm install")

// Delegate to cloud
await session.delegateToCloud()
await session.exec("npm run build:production")

// Reclaim back
await session.reclaimToLocal()
await session.stop()
\`\`\`

---

## Running Claude Code

Run Claude Code inside sandboxes:

\`\`\`typescript
import { Sandbox } from "@e2b/code-interpreter"

const sandbox = await Sandbox.create("anthropic-claude-code", {
  apiKey: process.env.E2B_API_KEY,
  envs: {
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!
  }
})

const result = await sandbox.commands.run(
  \`echo 'Create a fibonacci function' | claude -p --dangerously-skip-permissions\`,
  { timeoutMs: 120_000 }
)

console.log(result.stdout)
await sandbox.kill()
\`\`\`

---

## Troubleshooting

### "API key not configured"

Check your environment variables:

\`\`\`bash
echo $DAYTONA_API_KEY
echo $E2B_API_KEY
\`\`\`

### "SSH connection failed" (exe.dev)

1. Verify SSH key: \`ls ~/.ssh/id_ed25519\`
2. Re-authenticate: \`ssh exe.dev\`
3. Check SSH agent: \`ssh-add -l\`

### Sandbox timeout

Increase timeout for long operations:

\`\`\`typescript
await sandbox.commands.run(cmd, { timeoutMs: 300_000 })
\`\`\`

---

## Next Steps

- [Daytona Deep Dive](/daytona) - Enterprise features
- [E2B Deep Dive](/e2b) - Jupyter & Claude Code template
- [exe.dev Deep Dive](/exe) - Persistent VMs
`
  }
};

// Sidebar navigation
const docsNav = [
  { slug: 'getting-started', title: 'Getting Started', icon: Book },
];

export const DocsPage: React.FC = () => {
  const { slug = 'getting-started' } = useParams<{ slug: string }>();
  const doc = docsContent[slug];

  if (!doc) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Doc not found</h1>
          <Link to="/docs/getting-started" className="text-brand-400 hover:underline">
            Go to Getting Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />

      <div className="pt-20 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>

          <div className="flex gap-12">
            {/* Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                  Documentation
                </h3>
                <nav className="space-y-1">
                  {docsNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.slug === slug;
                    return (
                      <Link
                        key={item.slug}
                        to={`/docs/${item.slug}`}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-zinc-800 text-white'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        <Icon size={16} />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-8 pt-8 border-t border-dark-border">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                    Providers
                  </h3>
                  <nav className="space-y-1">
                    <Link to="/daytona" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                      <Box size={16} />
                      Daytona
                    </Link>
                    <Link to="/e2b" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                      <Box size={16} />
                      E2B
                    </Link>
                    <Link to="/exe" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors">
                      <Box size={16} />
                      exe.dev
                    </Link>
                  </nav>
                </div>
              </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 min-w-0">
              <article className="prose prose-invert prose-zinc max-w-none
                prose-headings:font-semibold
                prose-h1:text-3xl prose-h1:mb-8 prose-h1:pb-4 prose-h1:border-b prose-h1:border-dark-border
                prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-zinc-300 prose-p:leading-relaxed
                prose-a:text-brand-400 prose-a:no-underline hover:prose-a:underline
                prose-code:text-brand-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-dark-border prose-pre:rounded-lg
                prose-table:border-collapse
                prose-th:border prose-th:border-dark-border prose-th:bg-zinc-800/50 prose-th:px-4 prose-th:py-2 prose-th:text-left
                prose-td:border prose-td:border-dark-border prose-td:px-4 prose-td:py-2
                prose-hr:border-dark-border prose-hr:my-12
                prose-strong:text-white
                prose-li:text-zinc-300
              ">
                <ReactMarkdown>{doc.content}</ReactMarkdown>
              </article>
            </main>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};
