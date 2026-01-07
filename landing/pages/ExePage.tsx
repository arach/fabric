import React from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { CodeBlock } from '../components/CodeBlock';
import { ArrowRight, Terminal, Cloud, Shield, Zap, Code, Box, Server } from 'lucide-react';

export const ExePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-brand-500/30 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <img
                src="https://exe.dev/static/exy.png"
                alt="exe.dev"
                className="h-6 w-auto"
              />
              <span className="text-zinc-400 text-sm">+</span>
              <span className="font-bold text-white">Fabric</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-[1.05]">
              Claude Agents on{' '}
              <span className="brand-gradient-text">exe.dev</span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Run Claude Code agents in persistent exe.dev VMs via SSH.
              Full Ubuntu machines with sudo access and built-in Shelley agent.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://exe.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                Get Started with exe.dev
                <ArrowRight size={16} />
              </a>
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
                <h3 className="font-semibold">Set up SSH access</h3>
              </div>
              <CodeBlock code="ssh exe.dev" language="bash" />
              <p className="text-zinc-500 text-sm mt-3">
                Sign up at{' '}
                <a href="https://exe.dev" className="text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
                  exe.dev
                </a>
                {' '}— your SSH key is used automatically by Fabric.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">2</span>
                <h3 className="font-semibold">Push your project to exe.dev</h3>
              </div>
              <CodeBlock code="fabric push --provider exe" language="bash" />
              <p className="text-zinc-500 text-sm mt-3">
                Fabric provisions a persistent VM and syncs your project via SFTP.
              </p>
            </div>

            <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-bold">3</span>
                <h3 className="font-semibold">Your agent runs in a persistent VM</h3>
              </div>
              <div className="space-y-3 text-sm text-zinc-400">
                <p>Once pushed, your project runs on a real Ubuntu VM:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Persistent disk</strong> — Your data stays between sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Full root access</strong> — Install anything with <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">sudo</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Full internet</strong> — No network restrictions whatsoever</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-brand-400 mt-1">•</span>
                    <span><strong className="text-white">Agents pre-installed</strong> — Claude Code, Codex, and Shelley ready to go</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shelley Agent */}
      <section className="py-20 border-t border-dark-border bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Built-in Shelley Agent</h2>
          <p className="text-zinc-400 text-center mb-10">
            exe.dev VMs come with Shelley pre-installed — a web-based coding agent accessible at port 9999.
          </p>

          <div className="bg-zinc-900/50 border border-dark-border rounded-xl p-6">
            <div className="space-y-3 text-sm text-zinc-400">
              <p>When you push to exe.dev, you get:</p>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span><strong className="text-white">Shelley web UI</strong> at <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">https://vmname.exe.xyz:9999/</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span><strong className="text-white">Claude Code</strong> pre-installed at <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">/usr/local/bin/claude</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span><strong className="text-white">Codex</strong> pre-installed at <code className="text-xs bg-zinc-800 px-1.5 py-0.5 rounded">/usr/local/bin/codex</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-400 mt-1">•</span>
                  <span><strong className="text-white">Full Ubuntu environment</strong> with Node.js, Python, Go, Rust</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-dark-border">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12 text-center">Why exe.dev + Fabric?</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Server className="w-6 h-6" />}
              title="Persistent VMs"
              description="Real Ubuntu VMs with persistent disks. Not serverless - your data stays between sessions."
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="Sub-Second Startup"
              description="VMs boot in under 2 seconds using container images on Cloud Hypervisor."
            />
            <FeatureCard
              icon={<Cloud className="w-6 h-6" />}
              title="Full Internet Access"
              description="No network restrictions. Full outbound internet access for your agents."
            />
            <FeatureCard
              icon={<Code className="w-6 h-6" />}
              title="Pre-installed Agents"
              description="Claude Code, Codex, and Shelley agent ready to use out of the box."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Sudo Access"
              description="Full root access to install any software. It's your VM, do what you want."
            />
            <FeatureCard
              icon={<Terminal className="w-6 h-6" />}
              title="SSH Native"
              description="Fabric uses SSH/SFTP under the hood - no proprietary SDKs required."
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 border-t border-dark-border bg-zinc-900/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center">exe.dev vs E2B vs Daytona</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left py-4 px-4 font-medium text-zinc-400">Feature</th>
                  <th className="text-center py-4 px-4 font-medium text-brand-400">exe.dev</th>
                  <th className="text-center py-4 px-4 font-medium text-zinc-400">E2B</th>
                  <th className="text-center py-4 px-4 font-medium text-zinc-400">Daytona</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Architecture</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Persistent VMs</td>
                  <td className="py-3 px-4 text-center">Ephemeral Sandboxes</td>
                  <td className="py-3 px-4 text-center">Ephemeral Sandboxes</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Network Access</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Full Internet</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Full Internet</td>
                  <td className="py-3 px-4 text-center">Allowlist</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Pre-installed Agents</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Claude, Codex, Shelley</td>
                  <td className="py-3 px-4 text-center">Claude Code Template</td>
                  <td className="py-3 px-4 text-center">npm install</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Root Access</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Yes (sudo)</td>
                  <td className="py-3 px-4 text-center">Limited</td>
                  <td className="py-3 px-4 text-center">No</td>
                </tr>
                <tr className="border-b border-dark-border/50">
                  <td className="py-3 px-4">Persistent Disk</td>
                  <td className="py-3 px-4 text-center text-emerald-400">Yes</td>
                  <td className="py-3 px-4 text-center">Snapshot</td>
                  <td className="py-3 px-4 text-center">Snapshot</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Access Protocol</td>
                  <td className="py-3 px-4 text-center">SSH/SFTP</td>
                  <td className="py-3 px-4 text-center">REST API</td>
                  <td className="py-3 px-4 text-center">REST API</td>
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
            Sign up for exe.dev and start running Claude agents in persistent VMs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://exe.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium transition-all"
            >
              Sign Up for exe.dev
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

export default ExePage;
