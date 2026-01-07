import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CodeBlock } from '../components/CodeBlock';
import { ArrowRight, Terminal, Cloud, Cpu, Zap, Code, Box } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';

export const E2BPage: React.FC = () => {
  useMeta({
    title: 'fabric × E2B | Code Interpreter Sandboxes',
    description: 'Run Claude agents in E2B code interpreter sandboxes. Instant startup, full internet access, and Jupyter kernel built-in.',
    image: '/og-e2b.png',
    url: '/e2b',
  });

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-brand-500/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <img
                src="https://github.com/e2b-dev/E2B/raw/main/readme-assets/e2b-logo.png"
                alt="E2B"
                className="h-6 w-auto"
              />
              <span className="text-zinc-400 text-sm">+</span>
              <span className="font-bold text-white">Fabric</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-[1.05]">
              Claude Agents on{' '}
              <span className="brand-gradient-text">E2B</span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Run Claude Code agents in E2B's secure code interpreter sandboxes.
              Pre-installed Claude Code template for instant agent deployment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-all flex items-center gap-2">
                Get Started with E2B
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
                <h3 className="font-semibold">Set your E2B API key</h3>
              </div>
              <CodeBlock code="export E2B_API_KEY=your_e2b_api_key" language="bash" />
              <p className="text-zinc-500 text-sm mt-3">
                Get your API key from{' '}
                <a href="https://e2b.dev/dashboard" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  e2b.dev/dashboard
                </a>
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="font-semibold">Push your project to E2B</h3>
              </div>
              <CodeBlock code="fabric push --provider e2b" language="bash" />
              <p className="text-zinc-500 text-sm mt-3">
                Fabric provisions an E2B sandbox and syncs your project automatically.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="font-semibold">Your agent runs in the cloud</h3>
              </div>
              <div className="space-y-3 text-sm text-zinc-400">
                <p>Once pushed, your project is running in a secure E2B sandbox:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Files synced</strong> — Your local directory is mirrored to <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">/home/user</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Instant startup</strong> — Sandboxes boot in under 200ms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Full internet</strong> — No network restrictions or allowlists</span>
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

      {/* Claude Code Template */}
      <section className="py-20 border-t border-dark-border bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Claude Code Template</h2>
          <p className="text-zinc-400 text-center mb-10">
            E2B provides a pre-built template with Claude Code installed. Fabric uses this automatically when you push.
          </p>

          <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
            <div className="space-y-3 text-sm text-zinc-400">
              <p>When you run <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">fabric push --provider e2b</code>, Fabric:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span>Provisions an E2B sandbox with the <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">anthropic-claude-code</code> template</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span>Syncs your project files to <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">/home/user</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span>Injects your <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">ANTHROPIC_API_KEY</code> securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span>Sets up the Jupyter kernel for code execution</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-dark-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Why E2B + Fabric?</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Cpu className="w-6 h-6" />}
              title="Code Interpreter"
              description="Built-in Python/JS execution with Jupyter kernel support for data science workloads."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Instant Startup"
              description="Sandboxes boot in under 200ms with pre-warmed environments ready to execute."
            />
            <FeatureCard
              icon={<Cloud className="w-6 h-6" />}
              title="Open Network"
              description="Full internet access by default. No network restrictions or allowlists needed."
            />
            <FeatureCard
              icon={<Code className="w-6 h-6" />}
              title="Claude Code Template"
              description="Pre-built template with Claude Code installed. Just add your API key and go."
            />
            <FeatureCard
              icon={<Box className="w-6 h-6" />}
              title="Snapshot & Restore"
              description="Capture sandbox state and restore it for reproducible agent runs."
            />
            <FeatureCard
              icon={<Terminal className="w-6 h-6" />}
              title="Unified Interface"
              description="Same Fabric API works across E2B, Daytona, and local containers."
            />
          </div>
        </div>
      </section>

      {/* E2B vs Daytona */}
      <section className="py-20 border-t border-dark-border bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">E2B vs Daytona</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-4 px-4 font-medium text-zinc-400">Feature</th>
                  <th className="text-center py-4 px-4 font-medium text-brand-400">E2B</th>
                  <th className="text-center py-4 px-4 font-medium text-zinc-400">Daytona</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Default Language</td>
                  <td className="py-3 px-4 text-center">Python</td>
                  <td className="py-3 px-4 text-center">TypeScript</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Network Access</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Full Internet</td>
                  <td className="py-3 px-4 text-center">Allowlist</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Claude Code Template</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Built-in</td>
                  <td className="py-3 px-4 text-center">npm install</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Jupyter Kernel</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Yes</td>
                  <td className="py-3 px-4 text-center">No</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Multi-Language</td>
                  <td className="py-3 px-4 text-center">Python, JS</td>
                  <td className="py-3 px-4 text-center text-emerald-400">TS, Python, Go, Rust</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Enterprise Network Policies</td>
                  <td className="py-3 px-4 text-center">No</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Yes</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-dark-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Start Building</h2>
          <p className="text-zinc-400 mb-8">
            Get your E2B API key and start running Claude agents in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://e2b.dev/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-all"
            >
              Get E2B API Key
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

export default E2BPage;
