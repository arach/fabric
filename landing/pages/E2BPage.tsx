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
    <div className="min-h-screen text-ink overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-28 z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-wave border border-line mb-10">
              <img
                src="https://github.com/e2b-dev/E2B/raw/main/readme-assets/e2b-logo.png"
                alt="E2B"
                className="h-6 w-auto"
              />
              <span className="text-muted text-sm">+</span>
              <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink">Fabric</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[5.4rem] font-display tracking-[-0.04em] leading-[1.05] mb-8">
              Claude Agents on{' '}
              <em className="text-accent">E2B</em>
            </h1>

            <p className="text-[15px] leading-7 text-secondary mb-10 max-w-2xl mx-auto">
              Run Claude Code agents in E2B's secure code interpreter sandboxes.
              Pre-installed Claude Code template for instant agent deployment.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button className="group inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-black transition-all hover:bg-accent-bright">
                Get Started with E2B
                <ArrowRight size={14} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
              </button>
              <a href="/" className="inline-flex h-11 items-center px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-secondary hover:text-ink transition-colors">
                View All Providers
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-20 border-t border-line px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-12 text-center">Quick Start</h2>

          <div className="space-y-6">
            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">1</span>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Set your E2B API key</h3>
              </div>
              <CodeBlock code="export E2B_API_KEY=your_e2b_api_key" language="bash" />
              <p className="text-[13px] text-muted mt-3">
                Get your API key from{' '}
                <a href="https://e2b.dev/dashboard" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                  e2b.dev/dashboard
                </a>
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">2</span>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Push your project to E2B</h3>
              </div>
              <CodeBlock code="fabric push --provider e2b" language="bash" />
              <p className="text-[13px] text-muted mt-3">
                Fabric provisions an E2B sandbox and syncs your project automatically.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">3</span>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Your agent runs in the cloud</h3>
              </div>
              <div className="space-y-3 text-[13px] text-secondary">
                <p>Once pushed, your project is running in a secure E2B sandbox:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Files synced</strong> — Your local directory is mirrored to <code className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink">/home/user</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Instant startup</strong> — Sandboxes boot in under 200ms</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Full internet</strong> — No network restrictions or allowlists</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Reclaim anytime</strong> — Pull back to local with <code className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink">fabric pull</code></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Claude Code Template */}
      <section className="py-20 border-t border-line bg-panel px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-6 text-center">Claude Code Template</h2>
          <p className="text-[15px] text-secondary text-center mb-10">
            E2B provides a pre-built template with Claude Code installed. Fabric uses this automatically when you push.
          </p>

          <div className="rounded-xl border border-line bg-canvas p-6">
            <div className="space-y-3 text-[13px] text-secondary">
              <p>When you run <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12px] text-ink">fabric push --provider e2b</code>, Fabric:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Provisions an E2B sandbox with the <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12px] text-ink">anthropic-claude-code</code> template</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Syncs your project files to <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12px] text-ink">/home/user</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Injects your <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12px] text-ink">ANTHROPIC_API_KEY</code> securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span>Sets up the Jupyter kernel for code execution</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-line px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-12 text-center">Why E2B + Fabric?</h2>

          <div className="grid md:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
            <FeatureCard icon={<Cpu size={20} strokeWidth={1.5} />} title="Code Interpreter" description="Built-in Python/JS execution with Jupyter kernel support for data science workloads." />
            <FeatureCard icon={<Zap size={20} strokeWidth={1.5} />} title="Instant Startup" description="Sandboxes boot in under 200ms with pre-warmed environments ready to execute." />
            <FeatureCard icon={<Cloud size={20} strokeWidth={1.5} />} title="Open Network" description="Full internet access by default. No network restrictions or allowlists needed." />
            <FeatureCard icon={<Code size={20} strokeWidth={1.5} />} title="Claude Code Template" description="Pre-built template with Claude Code installed. Just add your API key and go." />
            <FeatureCard icon={<Box size={20} strokeWidth={1.5} />} title="Snapshot & Restore" description="Capture sandbox state and restore it for reproducible agent runs." />
            <FeatureCard icon={<Terminal size={20} strokeWidth={1.5} />} title="Unified Interface" description="Same Fabric API works across E2B, Daytona, and local containers." />
          </div>
        </div>
      </section>

      {/* E2B vs Daytona */}
      <section className="py-20 border-t border-line bg-panel px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-10 text-center">E2B vs Daytona</h2>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th className="text-left py-4 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Feature</th>
                  <th className="text-center py-4 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-accent">E2B</th>
                  <th className="text-center py-4 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Daytona</th>
                </tr>
              </thead>
              <tbody className="text-secondary">
                {[
                  ['Default Language', 'Python', 'TypeScript'],
                  ['Network Access', 'Full Internet', 'Allowlist'],
                  ['Claude Code Template', 'Built-in', 'npm install'],
                  ['Jupyter Kernel', 'Yes', 'No'],
                  ['Multi-Language', 'Python, JS', 'TS, Python, Go, Rust'],
                  ['Enterprise Network Policies', 'No', 'Yes'],
                ].map(([feature, e2b, daytona], i) => (
                  <tr key={feature} className="border-b border-line last:border-0">
                    <td className="py-3 px-4 text-ink">{feature}</td>
                    <td className="py-3 px-4 text-center">{e2b}</td>
                    <td className="py-3 px-4 text-center">{daytona}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-line px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-6">Start Building</h2>
          <p className="text-[15px] text-secondary mb-8">
            Get your E2B API key and start running Claude agents in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://e2b.dev/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-canvas transition-all hover:opacity-90"
            >
              Get E2B API Key
            </a>
            <a
              href="https://github.com/arach/fabric"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-secondary hover:text-ink transition-colors"
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
  <div className="bg-canvas p-6 transition-colors hover:bg-panel">
    <div className="text-accent mb-4">
      {icon}
    </div>
    <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink mb-2">{title}</h3>
    <p className="text-[13px] leading-6 text-secondary">{description}</p>
  </div>
);

export default E2BPage;
