import React from 'react';
import { Github, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-dark-border bg-dark-950 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-white tracking-tight">fabric</span>
          </div>
          <p className="text-sm text-zinc-500 max-w-sm">
            Open source infrastructure for the next generation of AI agents. <br />
            Built with <span className="text-zinc-400">♥</span> for the community.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
            <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-white uppercase tracking-wider">Project</span>
                <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Documentation</a>
                <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Changelog</a>
                <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors">Contributing</a>
            </div>
            <div className="flex flex-col gap-3">
                <span className="text-xs font-medium text-white uppercase tracking-wider">Social</span>
                <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                    <Github size={14} /> GitHub
                </a>
                <a href="#" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                    <Twitter size={14} /> Twitter
                </a>
            </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-dark-border flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-zinc-600 font-mono">MIT License • 2024</p>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-dark-border">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <span className="text-xs text-zinc-400 font-medium">All systems operational</span>
        </div>
      </div>
    </footer>
  );
};