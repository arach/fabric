import React from 'react';
import { Github, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line px-6 sm:px-8 lg:px-12 py-12">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink">fabric</span>
          <span className="text-line-strong">|</span>
          <span className="text-[13px] text-muted">MIT License</span>
        </div>

        <div className="flex items-center gap-1">
          <a
            href="/docs/getting-started"
            className="rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:bg-wave hover:text-ink transition-colors"
          >
            Docs
          </a>
          <a
            href="https://github.com/arach/fabric"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:bg-wave hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <Github size={12} />
            GitHub
          </a>
          <a
            href="https://x.com/ArachAhmadi"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted hover:bg-wave hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <Twitter size={12} />
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
};
