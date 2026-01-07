import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CodeBlock } from '../components/CodeBlock';
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
                <h3 className="font-semibold">Set your Daytona API key</h3>
              </div>
              <CodeBlock code="export DAYTONA_API_KEY=your_daytona_api_key" language="bash" />
              <p className="text-zinc-500 text-sm mt-3">
                Get your API key from{' '}
                <a href="https://app.daytona.io" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  app.daytona.io
                </a>
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="font-semibold">Push your project to Daytona</h3>
              </div>
              <CodeBlock code="fabric push --provider daytona" language="bash" />
              <p className="text-zinc-500 text-sm mt-3">
                Fabric provisions a Daytona sandbox and syncs your project automatically.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="font-semibold">Your agent runs in the cloud</h3>
              </div>
              <div className="space-y-3 text-sm text-zinc-400">
                <p>Once pushed, your project is running in a secure Daytona sandbox:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Files synced</strong> — Your local directory is mirrored to <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">/workspace</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Environment ready</strong> — Node.js, Python, Go, Rust pre-installed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Checkpoints enabled</strong> — Snapshot and restore state anytime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Reclaim anytime</strong> — Pull back to local with <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">fabric pull</code></span>
                  </li>
                </ul>
              </div>
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
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">About Daytona Network Policies</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  Daytona sandboxes use tier-based network restrictions for security. By default, outbound connections are limited to essential developer services:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">api.anthropic.com</span>
                  <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">api.openai.com</span>
                  <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">github.com</span>
                  <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">registry.npmjs.org</span>
                  <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 text-xs font-mono">pypi.org</span>
                </div>
                <p className="text-zinc-500 text-xs">
                  Higher-tier Daytona accounts can configure custom allowlists or enable full internet access.{' '}
                  <a href="https://www.daytona.io/docs" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Learn more in Daytona's docs
                  </a>
                </p>
              </div>
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
