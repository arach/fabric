import React from 'react';
import { Terminal, ArrowRight, Server, Check } from 'lucide-react';

export const Workflow: React.FC = () => {
  return (
    <section id="how-it-works" className="border-y border-line bg-panel px-6 sm:px-8 lg:px-12 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl sm:text-5xl font-display italic tracking-[-0.03em] mb-5 text-ink">
            From bootstrap to execution.
          </h2>
          <p className="text-[15px] leading-7 text-secondary max-w-2xl">
            Bootstrap Fabric Runner once, execute a trusted cookbook locally, and keep a clean path to remote runtimes when the task outgrows the laptop.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Steps */}
          <div className="lg:w-1/2 space-y-10">
            {/* Step 1 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">
                1
              </div>
              <div>
                <h4 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink mb-2">Bootstrap the runner</h4>
                <p className="text-[15px] leading-7 text-secondary mb-3">
                  Prepare the Apple container substrate and a local runner home without assuming a development machine.
                </p>
                <code className="inline-block rounded-md border border-line-strong bg-canvas px-3 py-1.5 font-mono text-[12px] text-secondary">
                  bash scripts/install-runner.sh
                </code>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">
                2
              </div>
              <div>
                <h4 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink mb-2">Run a cookbook locally</h4>
                <p className="text-[15px] leading-7 text-secondary mb-3">
                  Use a generic image plus a recipe or a baked task image. OCR is the first concrete path.
                </p>
                <div className="rounded-lg border border-line bg-canvas p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-3">Current runner direction</p>
                  <ul className="space-y-2">
                    {[
                      'Trusted cookbooks with narrow step types',
                      'Recipe-first development, baked image optimization',
                      'OCR benchmarked against text-native and scanned PDFs',
                      'Same task model maps to local or remote runtimes',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-[13px] text-secondary">
                        <Check size={12} strokeWidth={2} className="text-accent mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0 w-8 h-8 rounded-full border border-accent/30 bg-wave flex items-center justify-center font-mono text-[12px] text-accent">
                3
              </div>
              <div>
                <h4 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink mb-2">Scale to cloud</h4>
                <p className="text-[15px] leading-7 text-secondary mb-3">
                  Keep the same execution shape when the workload should run on Daytona, E2B, or exe.dev.
                </p>
                <div className="rounded-lg border border-line bg-canvas p-5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted mb-3">Cloud providers</p>
                  <ul className="space-y-2">
                    {[
                      ['Daytona', 'enterprise, TypeScript, network policies'],
                      ['E2B', 'ultra-fast cold starts, Jupyter, Python'],
                      ['exe.dev', 'persistent VMs, SSH, full root access'],
                    ].map(([name, desc]) => (
                      <li key={name} className="flex items-start gap-2.5 text-[13px] text-secondary">
                        <Check size={12} strokeWidth={2} className="text-accent mt-1 flex-shrink-0" />
                        <span><span className="text-ink">{name}</span> — {desc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <code className="inline-block mt-3 rounded-md border border-line-strong bg-canvas px-3 py-1.5 font-mono text-[12px] text-secondary">
                  fabric runner run --cookbook ocr-page
                </code>
              </div>
            </div>
          </div>

          {/* Visual diagram */}
          <div className="lg:w-1/2 lg:sticky lg:top-32 self-start">
            <div className="relative">
              {/* Connection line */}
              <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 -translate-y-1/2 hidden md:block" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 relative z-10">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-xl border border-line-strong bg-canvas flex items-center justify-center mb-4 transition-transform duration-300 hover:-translate-y-1">
                    <Terminal size={28} strokeWidth={1.5} className="text-accent" />
                  </div>
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink">Bootstrap</span>
                  <span className="text-[12px] text-muted mt-1">install-runner.sh</span>
                  <div className="md:hidden mt-4 text-muted"><ArrowRight className="rotate-90" size={16} /></div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-xl border border-line-strong bg-canvas flex items-center justify-center mb-4 transition-transform duration-300 hover:-translate-y-1">
                    <svg className="text-accent" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M7 8h10M7 12h6M7 16h8" />
                    </svg>
                  </div>
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink">Cookbook</span>
                  <span className="text-[12px] text-muted mt-1">ocr-page</span>
                  <div className="md:hidden mt-4 text-muted"><ArrowRight className="rotate-90" size={16} /></div>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-xl border border-line-strong bg-canvas flex items-center justify-center mb-4 transition-transform duration-300 hover:-translate-y-1">
                    <Server size={28} strokeWidth={1.5} className="text-accent" />
                  </div>
                  <span className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink">Remote</span>
                  <span className="text-[12px] text-muted mt-1">Daytona / E2B / exe</span>
                </div>
              </div>
            </div>

            {/* Status card */}
            <div className="mt-10 rounded-lg border border-line-strong bg-canvas p-5 font-mono text-[12px] leading-6 text-secondary">
              <div className="signal-bar mb-4 rounded-full" />
              <div className="flex justify-between mb-1.5">
                <span className="text-muted">cookbook</span>
                <span className="text-ink">ocr-page</span>
              </div>
              <div className="flex justify-between mb-1.5">
                <span className="text-muted">runtime</span>
                <span className="text-accent flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  local runner
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">upgrade path</span>
                <span className="text-secondary">runner → cloud</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
