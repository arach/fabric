import React from 'react';
import { Navbar } from './components/Navbar';
import { TerminalDemo } from './components/TerminalDemo';
import { Features } from './components/Features';
import { Workflow } from './components/Workflow';
import { Footer } from './components/Footer';
import { Logos } from './components/Logos';
import { ArrowRight, Copy, Check } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen text-ink overflow-x-hidden">
      <Navbar />

      {/* Hero Grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none hero-grid" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 lg:pt-44 lg:pb-24 z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col lg:grid lg:grid-cols-[1.3fr_0.7fr] gap-16 items-center">

            <div className="text-center lg:text-left">
              <div className="animate-fade-up">
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-wave border border-line text-accent font-mono text-[10px] uppercase tracking-[0.1em] mb-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  v0.2.0 is live
                </div>
              </div>

              <h1 className="animate-fade-up delay-1 text-4xl sm:text-6xl lg:text-[5.4rem] font-display tracking-[-0.04em] leading-[1.05] mb-8 text-ink">
                Portable runtimes for{' '}
                <em className="text-accent">local and cloud</em> tasks
              </h1>

              <p className="animate-fade-up delay-2 text-[15px] leading-7 text-secondary max-w-xl mx-auto lg:mx-0 mb-10">
                Start with Fabric Runner on Apple containers, execute trusted cookbooks locally, and keep the same execution model when you move to Daytona, E2B, or exe.dev.
              </p>

              <div className="animate-fade-up delay-3 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
                <a
                  href="/docs/getting-started"
                  className="group inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-black transition-all hover:bg-accent-bright"
                >
                  Get Started
                  <ArrowRight size={14} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
                </a>
                <CopyCommand />
              </div>
            </div>

            <div className="animate-fade-up delay-4 w-full max-w-[540px] lg:max-w-none">
              <TerminalDemo />
            </div>

          </div>
        </div>
      </section>

      {/* Integration Logos */}
      <section className="py-12 border-y border-line bg-panel px-6 sm:px-8 lg:px-12 relative z-10">
        <div className="max-w-6xl mx-auto mb-8 text-center">
          <p className="font-mono text-[10px] text-muted uppercase tracking-[0.14em]">Supported Infrastructure Providers</p>
        </div>
        <Logos />
      </section>

      <div className="relative z-10">
        <Features />
      </div>

      <div className="relative z-10">
        <Workflow />
      </div>

      {/* CTA Section */}
      <section className="py-28 relative z-10 border-t border-line">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-5xl font-display italic tracking-[-0.03em] mb-6 text-ink">
            Install the runner. Ship the task.
          </h2>
          <p className="text-[15px] leading-7 text-secondary mb-10 max-w-lg mx-auto">
            Bootstrap Apple containers once, run cookbook-driven tasks locally, and keep a clean path to remote execution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://github.com/arach/fabric"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-11 items-center gap-2 rounded-lg bg-ink px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-canvas transition-all hover:opacity-90"
            >
              View on GitHub
              <ArrowRight size={14} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
            </a>
            <a
              href="/docs/"
              className="inline-flex h-11 items-center gap-2 rounded-lg border border-line-strong px-6 font-mono text-[12px] uppercase tracking-[0.1em] text-secondary transition-colors hover:border-accent/50 hover:text-ink hover:bg-wave"
            >
              Read Documentation
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const CopyCommand = () => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('bash scripts/install-runner.sh');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex h-11 items-center gap-3 rounded-lg border border-line-strong bg-panel px-5 font-mono text-[12px] text-secondary transition-colors hover:border-accent/30 hover:bg-canvas hover:text-ink"
    >
      <span className="text-muted select-none">$</span>
      <span>bash scripts/install-runner.sh</span>
      {copied
        ? <Check size={14} className="text-accent ml-1" />
        : <Copy size={14} className="text-muted ml-1" />
      }
    </button>
  );
};

export default App;
