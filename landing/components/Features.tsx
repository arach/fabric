import React from 'react';
import { Terminal, Cloud, Zap, Cpu } from 'lucide-react';

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Native containers, <span className="brand-gradient-text">zero friction</span>.
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                Powered by Apple's Virtualization.framework and the <code className="text-zinc-300">container</code> CLI. No Docker, no entitlements, no code signing.
            </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Large Item 1 */}
            <div className="md:col-span-2 rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 relative overflow-hidden group hover:border-brand-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                        <Terminal className="text-white group-hover:text-brand-400 transition-colors" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Instant Linux Shells</h3>
                    <p className="text-zinc-400 leading-relaxed max-w-md text-base">
                        Drop into Ubuntu, Arch, Alpine, or any OCI image in one command. Install packages, run code, explore distros — containers boot in about a second.
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-25 transition-opacity duration-500">
                    <div className="space-y-3 p-8 translate-y-12">
                        <div className="h-2 w-3/4 bg-gradient-to-r from-brand-400 to-accent-400 rounded-full"></div>
                        <div className="h-2 w-1/2 bg-zinc-600 rounded-full"></div>
                        <div className="h-2 w-full bg-zinc-600 rounded-full"></div>
                        <div className="h-2 w-2/3 bg-zinc-600 rounded-full"></div>
                        <div className="h-2 w-5/6 bg-gradient-to-r from-brand-400 to-accent-400 rounded-full opacity-50"></div>
                    </div>
                </div>
            </div>

            {/* Tall Item */}
            <div className="md:row-span-2 rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 relative overflow-hidden group hover:border-brand-500/30 transition-all duration-500 hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-500/5 border border-brand-500/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-lg">
                    <Cloud className="text-brand-400" size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Cloud When You Need It</h3>
                <p className="text-zinc-400 leading-relaxed mb-8 text-base">
                    Same Sandbox interface across Daytona, E2B, and exe.dev. Snapshot locally, restore in the cloud. Switch providers by changing one line.
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-brand-900/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md text-xs font-mono text-zinc-400 shadow-xl group-hover:translate-y-[-4px] transition-transform duration-300">
                    <div className="flex justify-between mb-2">
                        <span>provider</span>
                        <span className="text-white">daytona</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span>status</span>
                        <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>running</span>
                    </div>
                    <div className="flex justify-between">
                        <span>handoff</span>
                        <span className="text-brand-400">local → cloud</span>
                    </div>
                </div>
            </div>

            {/* Small Item 2 */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 hover:border-brand-500/30 transition-all duration-500 group hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                    <Cpu className="text-white group-hover:text-accent-400 transition-colors" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">No Docker Required</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Uses Apple's <code className="text-zinc-300">container</code> CLI and Virtualization.framework directly. Native arm64 performance, minimal memory overhead.
                </p>
            </div>

             {/* Small Item 3 */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 hover:border-brand-500/30 transition-all duration-500 group hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-lg">
                    <Zap className="text-white group-hover:text-yellow-400 transition-colors" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">One Command Setup</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    <code className="text-zinc-300">fabric setup</code> installs everything — container CLI, Linux kernel, base images. Then <code className="text-zinc-300">fabric shell</code> and you're in.
                </p>
            </div>

        </div>
      </div>
    </section>
  );
};
