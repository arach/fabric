import React from 'react';
import { FileCode, ArrowRight, Container, Server } from 'lucide-react';

export const Workflow: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white/[0.02] border-y border-white/[0.05]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold mb-6">From <span className="text-brand-400">Localhost</span> to <span className="text-orange-400">Cloud</span> in one command.</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Fabric mounts your project into a local container for seamless development, then pushes to cloud sandboxes when you're ready to scale.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold border border-brand-500/30">1</div>
                <div>
                  <h4 className="text-white font-medium mb-1">Point to your project</h4>
                  <p className="text-gray-500 text-sm">Fabric takes your existing directory—Python, Node.js, or any codebase.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold border border-purple-500/30">2</div>
                <div>
                  <h4 className="text-white font-medium mb-1">Develop locally in a container</h4>
                  <p className="text-gray-500 text-sm">Your directory is mounted into a lightweight Apple container. Edit files locally, run them in isolation.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold border border-orange-500/30">3</div>
                <div>
                  <h4 className="text-white font-medium mb-1">Push to cloud</h4>
                  <p className="text-gray-500 text-sm">One command to deploy to Daytona, E2B, or exe.dev. Just add your API keys to your environment.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 w-full">
            <div className="relative">
              {/* Connection Lines Background */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-brand-500/20 via-purple-500/20 to-orange-500/20 -translate-y-1/2 hidden md:block"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-0 relative z-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center shadow-lg mb-4 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                      <FileCode className="w-10 h-10 text-brand-400" />
                   </div>
                   <span className="text-sm font-medium text-gray-300">Local File</span>
                   <span className="text-xs text-gray-500 mt-1">./my-agent</span>
                   <div className="md:hidden mt-4 text-gray-600"><ArrowRight className="rotate-90" /></div>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center shadow-lg mb-4 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                      <Container className="w-10 h-10 text-purple-400" />
                   </div>
                   <span className="text-sm font-medium text-gray-300">Local Container</span>
                   <span className="text-xs text-gray-500 mt-1">Dir mounted</span>
                   <div className="md:hidden mt-4 text-gray-600"><ArrowRight className="rotate-90" /></div>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-2xl bg-dark-800 border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)] mb-4 relative z-10 hover:-translate-y-2 transition-transform duration-300">
                      <Server className="w-10 h-10 text-orange-400" />
                   </div>
                   <span className="text-sm font-medium text-gray-300">Cloud Sandbox</span>
                   <span className="text-xs text-gray-500 mt-1">One command</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};