import React from 'react';
import { Terminal, ArrowRight, Cloud, Server, Check } from 'lucide-react';

export const Workflow: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white/[0.02] border-y border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-16">

          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold mb-6">From <span className="text-brand-400">bootstrap</span> to <span className="text-orange-400">task execution</span> in two commands.</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Bootstrap Fabric Runner once, execute a trusted cookbook locally, and keep a clean path to remote runtimes when the task outgrows the laptop.
            </p>

            <div className="space-y-8">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold border border-brand-500/30">1</div>
                <div>
                  <h4 className="text-white font-medium mb-1">Bootstrap the runner</h4>
                  <p className="text-gray-500 text-sm mb-2">Prepare the Apple container substrate and a local runner home without assuming a development machine.</p>
                  <code className="text-xs bg-dark-800 text-gray-400 px-2 py-1 rounded font-mono">bash scripts/install-runner.sh</code>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">2</div>
                <div>
                  <h4 className="text-white font-medium mb-2">Run a cookbook locally</h4>
                  <p className="text-gray-500 text-sm mb-3">Use a generic image plus a recipe or a baked task image. OCR is the first concrete path.</p>

                  <div className="bg-dark-800/50 rounded-lg p-4 border border-purple-500/10">
                    <p className="text-xs text-purple-400 font-medium mb-2">Current runner direction:</p>
                    <ul className="space-y-1.5 text-xs text-gray-500">
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Trusted cookbooks with narrow step types</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Recipe-first development, baked image optimization</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>OCR benchmarked locally against text-native and scanned PDFs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-purple-400 mt-0.5 flex-shrink-0" />
                        <span>Same task model can map to local Apple containers or remote runtimes later</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold border border-orange-500/30">3</div>
                <div>
                  <h4 className="text-white font-medium mb-2">Scale to cloud</h4>
                  <p className="text-gray-500 text-sm mb-3">Keep the same execution shape when the workload should run on Daytona, E2B, or exe.dev instead of the local machine.</p>

                  <div className="bg-dark-800/50 rounded-lg p-4 border border-orange-500/10">
                    <p className="text-xs text-orange-400 font-medium mb-2">Cloud providers:</p>
                    <ul className="space-y-1.5 text-xs text-gray-500">
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>Daytona — enterprise, TypeScript, network policies</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>E2B — ultra-fast cold starts, Jupyter, Python</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>exe.dev — persistent VMs, SSH, full root access</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-orange-400 mt-0.5 flex-shrink-0" />
                        <span>Seamless handoffs — snapshot local, restore in cloud</span>
                      </li>
                    </ul>
                  </div>

                  <code className="text-xs bg-dark-800 text-gray-400 px-2 py-1 rounded font-mono mt-3 inline-block">fabric runner run --cookbook ocr-page</code>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 w-full lg:sticky lg:top-32">
            <div className="relative">
              {/* Connection Lines Background */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-orange-500/20 -translate-y-1/2 hidden md:block"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 relative z-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center shadow-lg mb-4 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                      <Terminal className="w-10 h-10 text-brand-400" />
                   </div>
                   <span className="text-sm font-medium text-gray-300">Bootstrap</span>
                   <span className="text-xs text-gray-500 mt-1">install-runner.sh</span>
                   <div className="md:hidden mt-4 text-gray-600"><ArrowRight className="rotate-90" /></div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-2xl bg-dark-800 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.1)] mb-4 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                      <svg className="w-10 h-10 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M7 8h10M7 12h6M7 16h8" />
                      </svg>
                   </div>
                   <span className="text-sm font-medium text-gray-300">Cookbook Task</span>
                   <span className="text-xs text-gray-500 mt-1">ocr-page</span>
                   <div className="md:hidden mt-4 text-gray-600"><ArrowRight className="rotate-90" /></div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-2xl bg-dark-800 border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)] mb-4 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                      <Server className="w-10 h-10 text-orange-400" />
                   </div>
                   <span className="text-sm font-medium text-gray-300">Remote Runtime</span>
                   <span className="text-xs text-gray-500 mt-1">Daytona / E2B / exe</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
