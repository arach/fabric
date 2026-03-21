import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CodeBlock } from '../components/CodeBlock';
import { ArrowRight, Terminal, Cloud, Shield, Zap, Code, Box, Server } from 'lucide-react';
import { useMeta } from '../hooks/useMeta';

export const ExePage: React.FC = () => {
  useMeta({
    title: 'fabric × exe.dev | Persistent VMs',
    description: 'Run Claude agents in persistent exe.dev Ubuntu VMs. Full root access, SSH native, and Shelley agent built-in.',
    image: '/og-exe.png',
    url: '/exe',
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
                src="https://exe.dev/static/exy.png"
                alt="exe.dev"
                className="h-6 w-auto"
              />
              <span className="text-muted text-sm">+</span>
              <span className="font-mono text-[12px] uppercase tracking-[0.1em] text-ink">Fabric</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-[5.4rem] font-display tracking-[-0.04em] leading-[1.05] mb-8">
              Claude Agents on{' '}
              <em className="text-accent">exe.dev</em>
            </h1>

            <p className="text-[15px] leading-7 text-secondary mb-10 max-w-2xl mx-auto">
              Run Claude Code agents in persistent exe.dev VMs via SSH.
              Full Ubuntu machines with sudo access and built-in Shelley agent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://exe.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-black transition-all hover:bg-accent-bright"
              >
                Get Started with exe.dev
                <ArrowRight size={14} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
              </a>
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
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Set up SSH access</h3>
              </div>
              <CodeBlock code="ssh exe.dev" language="bash" />
              <p className="text-[13px] text-muted mt-3">
                Sign up at{' '}
                <a href="https://exe.dev" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
                  exe.dev
                </a>
                {' '}— your SSH key is used automatically by Fabric.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">2</span>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Push your project to exe.dev</h3>
              </div>
              <CodeBlock code="fabric push --provider exe" language="bash" />
              <p className="text-[13px] text-muted mt-3">
                Fabric provisions a persistent VM and syncs your project via SFTP.
              </p>
            </div>

            <div className="rounded-xl border border-line bg-panel p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">3</span>
                <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink">Your agent runs in a persistent VM</h3>
              </div>
              <div className="space-y-3 text-[13px] text-secondary">
                <p>Once pushed, your project runs on a real Ubuntu VM:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Persistent disk</strong> — Your data stays between sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Full root access</strong> — Install anything with <code className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[12px] text-ink">sudo</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Full internet</strong> — No network restrictions whatsoever</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span><strong className="text-ink">Agents pre-installed</strong> — Claude Code, Codex, and Shelley ready to go</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shelley Agent */}
      <section className="py-20 border-t border-line bg-panel px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-6 text-center">Built-in Shelley Agent</h2>
          <p className="text-[15px] text-secondary text-center mb-10">
            exe.dev VMs come with Shelley pre-installed — a web-based coding agent accessible at port 9999.
          </p>

          <div className="rounded-xl border border-line bg-canvas p-6">
            <div className="space-y-3 text-[13px] text-secondary">
              <p>When you push to exe.dev, you get:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-ink">Shelley web UI</strong> at <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12px] text-ink">https://vmname.exe.xyz:9999/</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-ink">Claude Code</strong> pre-installed at <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12px] text-ink">/usr/local/bin/claude</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-ink">Codex</strong> pre-installed at <code className="rounded border border-line bg-panel px-1.5 py-0.5 font-mono text-[12px] text-ink">/usr/local/bin/codex</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-ink">Full Ubuntu environment</strong> with Node.js, Python, Go, Rust</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-line px-6 sm:px-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-12 text-center">Why exe.dev + Fabric?</h2>

          <div className="grid md:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
            <FeatureCard icon={<Server size={20} strokeWidth={1.5} />} title="Persistent VMs" description="Real Ubuntu VMs with persistent disks. Not serverless - your data stays between sessions." />
            <FeatureCard icon={<Zap size={20} strokeWidth={1.5} />} title="Sub-Second Startup" description="VMs boot in under 2 seconds using container images on Cloud Hypervisor." />
            <FeatureCard icon={<Cloud size={20} strokeWidth={1.5} />} title="Full Internet Access" description="No network restrictions. Full outbound internet access for your agents." />
            <FeatureCard icon={<Code size={20} strokeWidth={1.5} />} title="Pre-installed Agents" description="Claude Code, Codex, and Shelley agent ready to use out of the box." />
            <FeatureCard icon={<Shield size={20} strokeWidth={1.5} />} title="Sudo Access" description="Full root access to install any software. It's your VM, do what you want." />
            <FeatureCard icon={<Terminal size={20} strokeWidth={1.5} />} title="SSH Native" description="Fabric uses SSH/SFTP under the hood - no proprietary SDKs required." />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 border-t border-line bg-panel px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-display italic tracking-[-0.03em] mb-10 text-center">exe.dev vs E2B vs Daytona</h2>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line bg-canvas">
                  <th className="text-left py-4 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Feature</th>
                  <th className="text-center py-4 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-accent">exe.dev</th>
                  <th className="text-center py-4 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">E2B</th>
                  <th className="text-center py-4 px-4 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">Daytona</th>
                </tr>
              </thead>
              <tbody className="text-secondary">
                {[
                  ['Architecture', 'Persistent VMs', 'Ephemeral Sandboxes', 'Ephemeral Sandboxes'],
                  ['Network Access', 'Full Internet', 'Full Internet', 'Allowlist'],
                  ['Pre-installed Agents', 'Claude, Codex, Shelley', 'Claude Code Template', 'npm install'],
                  ['Root Access', 'Yes (sudo)', 'Limited', 'No'],
                  ['Persistent Disk', 'Yes', 'Snapshot', 'Snapshot'],
                  ['Access Protocol', 'SSH/SFTP', 'REST API', 'REST API'],
                ].map(([feature, exe, e2b, daytona]) => (
                  <tr key={feature} className="border-b border-line last:border-0">
                    <td className="py-3 px-4 text-ink">{feature}</td>
                    <td className="py-3 px-4 text-center">{exe}</td>
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
            Sign up for exe.dev and start running Claude agents in persistent VMs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://exe.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-canvas transition-all hover:opacity-90"
            >
              Sign Up for exe.dev
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

export default ExePage;
