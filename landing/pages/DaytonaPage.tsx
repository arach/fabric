import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ArrowRight, Terminal, Cloud, Shield, Zap, Code, Box } from 'lucide-react';

export const DaytonaPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-brand-500/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <img
                src="https://github.com/daytonaio/daytona/raw/main/assets/images/Daytona-logotype-white.png"
                alt="Daytona"
                className="h-5 w-auto"
              />
              <span className="text-zinc-400 text-sm">+</span>
              <span className="font-bold text-white">Fabric</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-[1.05]">
              Claude Agents on{' '}
              <span className="brand-gradient-text">Daytona</span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Run Claude Code agents in secure Daytona cloud sandboxes.
              Enterprise-grade isolation with seamless file sync and checkpoint support.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-all flex items-center gap-2">
                Get Started with Daytona
                <ArrowRight size={16} />
              </button>
              <a href="/" className="h-12 px-6 text-zinc-400 hover:text-white transition-colors flex items-center">
                View All Providers
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 border-t border-dark-border">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Quick Start</h2>

          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">1</span>
                <h3 className="font-semibold">Install Fabric</h3>
              </div>
              <pre className="bg-black/50 rounded-lg p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
                <code>npm install fabric-ai-core fabric-ai-daytona</code>
              </pre>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="font-semibold">Set Environment Variables</h3>
              </div>
              <pre className="bg-black/50 rounded-lg p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
                <code>{`DAYTONA_API_KEY=your_daytona_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key`}</code>
              </pre>
              <p className="text-zinc-500 text-sm mt-3">
                Get your Daytona API key from{' '}
                <a href="https://app.daytona.io" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  app.daytona.io
                </a>
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="font-semibold">Create a Daytona Sandbox</h3>
              </div>
              <pre className="bg-black/50 rounded-lg p-4 font-mono text-sm text-zinc-300 overflow-x-auto">
                <code>{`import { DaytonaSandboxFactory } from "fabric-ai-daytona"

const factory = new DaytonaSandboxFactory({
  apiKey: process.env.DAYTONA_API_KEY,
  defaultLanguage: "typescript"
})

const sandbox = await factory.create({})

// Execute commands
const result = await sandbox.exec("echo 'Hello from Daytona!'")
console.log(result.stdout)

// Run code directly
const output = await sandbox.runCode(\`
  console.log("2 + 2 =", 2 + 2)
\`)

// File operations
await sandbox.writeFile("/workspace/hello.ts", "export const x = 42")
const content = await sandbox.readFile("/workspace/hello.ts")

// Cleanup
await sandbox.stop()`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-dark-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Daytona + Fabric?</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Enterprise Security"
              description="Tier-based network policies with allowlisted AI APIs (Anthropic, OpenAI) and package registries."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Multi-Language"
              description="Native support for TypeScript, Python, Go, Rust, and JavaScript out of the box."
            />
            <FeatureCard
              icon={<Cloud className="w-6 h-6" />}
              title="Cloud Native"
              description="Sandboxes spin up in seconds with pre-installed runtimes and development tools."
            />
            <FeatureCard
              icon={<Code className="w-6 h-6" />}
              title="Claude Code Ready"
              description="Run Claude Code agents directly in Daytona sandboxes with full tool access."
            />
            <FeatureCard
              icon={<Box className="w-6 h-6" />}
              title="Snapshot & Restore"
              description="Capture sandbox state and restore it anytime for reproducible agent runs."
            />
            <FeatureCard
              icon={<Terminal className="w-6 h-6" />}
              title="Unified Interface"
              description="Same Fabric API works across Daytona, E2B, and local containers."
            />
          </div>
        </div>
      </section>

      {/* Network Info */}
      <section className="py-20 border-t border-dark-border bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Network Access</h2>
          <p className="text-zinc-400 text-center mb-10">
            Daytona sandboxes have secure network policies. Essential developer services are always accessible.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <h3 className="font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Allowed Services
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>api.anthropic.com</li>
                <li>api.openai.com</li>
                <li>github.com</li>
                <li>registry.npmjs.org</li>
                <li>pypi.org</li>
                <li>docker.io</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <h3 className="font-semibold text-zinc-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                Tier 3/4 Features
              </h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>Custom networkAllowList</li>
                <li>Full internet access</li>
                <li>Custom IP whitelisting</li>
                <li>Private network access</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-dark-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Start Building</h2>
          <p className="text-zinc-400 mb-8">
            Get your Daytona API key and start running Claude agents in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://app.daytona.io"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-all"
            >
              Get Daytona API Key
            </a>
            <a
              href="https://github.com/arach/fabric"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 text-zinc-400 hover:text-white transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon, title, description
}) => (
  <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6 hover:border-zinc-700 transition-colors">
    <div className="w-12 h-12 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="font-semibold mb-2">{title}</h3>
    <p className="text-zinc-400 text-sm">{description}</p>
  </div>
);

export default DaytonaPage;
