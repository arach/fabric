import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CodeBlock } from '../components/CodeBlock';
import { ArrowRight, Terminal, Cloud, Shield, Zap, Code, Box } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';

export const DaytonaPage: React.FC = () => {
  useMeta({
    title: 'fabric × Daytona | Secure Cloud Sandboxes',
    description: 'Run Claude agents in secure Daytona cloud sandboxes. Enterprise-grade isolation with seamless file sync and checkpoint support.',
    image: '/og-daytona.png',
    url: '/daytona',
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
                src="https://github.com/daytonaio/daytona/raw/main/assets/images/Daytona-logotype-white.png"
                alt="Daytona"
                className="h-5 w-auto"
              />
              <span className="text-muted text-sm">+</span>
              <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink">Fabric</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[5.4rem] font-display tracking-[-0.04em] leading-[1.05] mb-8">
              Claude Agents on{' '}
              <em className="text-accent">Daytona</em>
            </h1>

            <p className="text-[15px] leading-7 text-secondary mb-10 max-w-2xl mx-auto">
              Run Claude Code agents in secure Daytona cloud sandboxes.
              Enterprise-grade isolation with seamless file sync and checkpoint support.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button className="group inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-black transition-all hover:bg-accent-bright">
                Get Started with Daytona
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
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Set your Daytona API key</h3>
              </div>
              <CodeBlock code="export DAYTONA_API_KEY=your_daytona_api_key" language="bash" />
              <p className="text-[13px] text-muted mt-3">
                Get your API key from{' '}
                <a href="https://app.daytona.io" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                  app.daytona.io
                </a>
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">2</span>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Push your project to Daytona</h3>
              </div>
              <CodeBlock code="fabric push --provider daytona" language="bash" />
              <p className="text-[13px] text-muted mt-3">
                Fabric provisions a Daytona sandbox and syncs your project automatically.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">3</span>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Your agent runs in the cloud</h3>
              </div>
              <div className="space-y-3 text-[13px] text-secondary">
                <p>Once pushed, your project is running in a secure Daytona sandbox:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Files synced</strong> — Your local directory is mirrored to <code className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink">/workspace</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Environment ready</strong> — Node.js, Python, Go, Rust pre-installed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Checkpoints enabled</strong> — Snapshot and restore state anytime</span>
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

      {/* Features */}
      <section className="py-20 border-t border-line px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-12 text-center">Why Daytona + Fabric?</h2>

          <div className="grid md:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
            <FeatureCard icon={<Shield size={20} strokeWidth={1.5} />} title="Enterprise Security" description="Tier-based network policies with allowlisted AI APIs (Anthropic, OpenAI) and package registries." />
            <FeatureCard icon={<Zap size={20} strokeWidth={1.5} />} title="Multi-Language" description="Native support for TypeScript, Python, Go, Rust, and JavaScript out of the box." />
            <FeatureCard icon={<Cloud size={20} strokeWidth={1.5} />} title="Cloud Native" description="Sandboxes spin up in seconds with pre-installed runtimes and development tools." />
            <FeatureCard icon={<Code size={20} strokeWidth={1.5} />} title="Claude Code Ready" description="Run Claude Code agents directly in Daytona sandboxes with full tool access." />
            <FeatureCard icon={<Box size={20} strokeWidth={1.5} />} title="Snapshot & Restore" description="Capture sandbox state and restore it anytime for reproducible agent runs." />
            <FeatureCard icon={<Terminal size={20} strokeWidth={1.5} />} title="Unified Interface" description="Same Fabric API works across Daytona, E2B, and local containers." />
          </div>
        </div>
      </section>

      {/* Network Info */}
      <section className="py-20 border-t border-line bg-panel px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-xl border border-accent/20 bg-wave p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-accent mb-2">About Daytona Network Policies</h3>
                <p className="text-[13px] text-secondary mb-4">
                  Daytona sandboxes use tier-based network restrictions for security. By default, outbound connections are limited to essential developer services:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {['api.anthropic.com', 'api.openai.com', 'github.com', 'registry.npmjs.org', 'pypi.org'].map(domain => (
                    <span key={domain} className="px-2 py-1 rounded border border-line bg-canvas font-mono text-[11px] text-secondary">{domain}</span>
                  ))}
                </div>
                <p className="text-[12px] text-muted">
                  Higher-tier Daytona accounts can configure custom allowlists or enable full internet access.{' '}
                  <a href="https://www.daytona.io/docs" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    Learn more in Daytona's docs
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-line px-6 sm:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-6">Start Building</h2>
          <p className="text-[15px] text-secondary mb-8">
            Get your Daytona API key and start running Claude agents in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://app.daytona.io"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-canvas transition-all hover:opacity-90"
            >
              Get Daytona API Key
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

export default DaytonaPage;
