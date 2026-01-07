import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { TerminalDemo } from './components/TerminalDemo';
import { Features } from './components/Features';
import { Workflow } from './components/Workflow';
import { Footer } from './components/Footer';
import { Logos } from './components/Logos';
import { ArrowRight, ChevronRight, Terminal as TerminalIcon } from 'lucide-react';

const App: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-dark-950 text-white selection:bg-brand-500/30 overflow-x-hidden">
      <Navbar />
      
      {/* Parallax Background Grid Pattern */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none bg-grid opacity-[0.1]"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }}
      ></div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="flex-1 text-center lg:text-left opacity-0 animate-fade-in-up" style={{ animationFillMode: 'forwards' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono text-zinc-400 mb-8 hover:bg-white/10 transition-colors cursor-pointer tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"></span>
                v0.9.2 is live
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tighter mb-8 leading-[1.05] text-white">
                Seamless handoffs for <br/>
                <span className="brand-gradient-text">Agent Sandboxes</span>
              </h1>

              <p className="text-lg text-zinc-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                One interface to run agents across Daytona, E2B, and exe.dev.
                Switch providers seamlessly while your agent keeps working.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button className="h-12 px-6 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)]">
                  Get Started
                  <ArrowRight size={16} />
                </button>
                <div className="h-12 px-6 bg-zinc-900 border border-dark-border hover:border-zinc-700 hover:bg-zinc-800/80 text-zinc-400 rounded-lg font-mono text-sm flex items-center gap-3 transition-all duration-200 group">
                  <span className="select-none text-zinc-600 group-hover:text-zinc-500 transition-colors">$</span>
                  <span className="group-hover:text-zinc-300 transition-colors">npm install -g fabric-ai</span>
                  <CopyButton />
                </div>
              </div>
            </div>

            <div className="flex-1 w-full max-w-[600px] lg:max-w-none opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <TerminalDemo />
            </div>

          </div>
        </div>
      </section>

      {/* Integration Logos */}
      <section className="py-12 border-y border-dark-border bg-dark-950/50 backdrop-blur-sm relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8 text-center">
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Supported Infrastructure Providers</p>
        </div>
        <Logos />
      </section>

      <div className="relative z-10 bg-dark-950/50 backdrop-blur-sm">
          <Features />
      </div>
      
      <div className="relative z-10 bg-dark-950">
        <Workflow />
      </div>

      {/* Minimal CTA */}
      <section className="py-32 relative z-10 bg-dark-950 border-t border-dark-border">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 tracking-tight text-white">Ready to weave?</h2>
          <p className="text-zinc-400 mb-10 text-lg font-light">
            Open source, community driven, and built for the future of autonomous software.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <button className="px-8 py-3 bg-white text-black hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] rounded-full font-medium transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              View on GitHub
             </button>
             <button className="px-8 py-3 text-zinc-400 hover:text-white transition-colors hover:bg-white/5 rounded-full">
              Read Documentation
             </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const CopyButton = () => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText('npm install -g fabric-ai');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button onClick={handleCopy} className="ml-2 hover:text-white transition-colors">
            {copied ? <span className="text-emerald-400 text-xs">Copied</span> : <TerminalIcon size={14} />}
        </button>
    )
}

export default App;