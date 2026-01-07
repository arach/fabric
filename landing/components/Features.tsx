import React from 'react';
import { Box, Code2, Cloud, Zap, Shield, Globe, Terminal, Cpu } from 'lucide-react';
import { Feature } from '../types';

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
                Designed for <span className="brand-gradient-text">velocity</span>.
            </h2>
            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
                Fabric strips away the complexity of managing containers, giving you a raw, powerful interface to continue agentic development sessions anywhere.
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
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Local-First Experience</h3>
                    <p className="text-zinc-400 leading-relaxed max-w-md text-base">
                        Your filesystem is the API. Fabric watches for changes in your local directory and instantly mirrors them to the remote sandbox. No docker build required.
                    </p>
                </div>
                <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-10 group-hover:opacity-25 transition-opacity duration-500">
                    {/* Abstract code lines representation */}
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
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">Native Cloud Support</h3>
                <p className="text-zinc-400 leading-relaxed mb-8 text-base">
                    First-class support for E2B secure sandboxes and Daytona workspaces. Long-running, stateful environments that just work.
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-brand-900/30 to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md text-xs font-mono text-zinc-400 shadow-xl group-hover:translate-y-[-4px] transition-transform duration-300">
                    <div className="flex justify-between mb-2">
                        <span>status</span>
                        <span className="text-emerald-400 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>connected</span>
                    </div>
                    <div className="flex justify-between">
                        <span>provider</span>
                        <span className="text-white">aws-us-east-1</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-800 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-brand-500 w-2/3"></div>
                    </div>
                </div>
            </div>

            {/* Small Item 2 */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 hover:border-brand-500/30 transition-all duration-500 group hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg">
                    <Cpu className="text-white group-hover:text-accent-400 transition-colors" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Smart Context</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Automatic dependency detection for Python and Node.js. Fabric generates the container spec so you don't have to.
                </p>
            </div>

             {/* Small Item 3 */}
            <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 hover:border-brand-500/30 transition-all duration-500 group hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]">
                 <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 shadow-lg">
                    <Zap className="text-white group-hover:text-yellow-400 transition-colors" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Sub-ms Sync</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                    Optimized rsync protocols ensure your local edits appear in the container faster than you can alt-tab.
                </p>
            </div>

        </div>
      </div>
    </section>
  );
};