import React, { useState, useEffect } from 'react';
import { Menu, X, Box, Github } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-dark-950/80 backdrop-blur-md border-dark-border' : 'bg-transparent border-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-black">
             <Box size={14} strokeWidth={3} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">fabric</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-dark-800 border border-dark-border text-[10px] font-mono text-gray-400">v0.1.1</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          <a href="/docs/getting-started" className="text-sm text-gray-400 hover:text-white transition-colors">Docs</a>
          <a href="/#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">How it Works</a>
          <a href="/#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a>
          <a href="https://github.com/arach/fabric" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
            <Github size={16} />
            <span>GitHub</span>
          </a>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-dark-950 border-b border-dark-border p-6 md:hidden flex flex-col gap-4 shadow-xl">
          <a href="/docs/getting-started" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white">Docs</a>
          <a href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white">How it Works</a>
          <a href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white">Features</a>
          <a href="https://github.com/arach/fabric" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white">GitHub</a>
        </div>
      )}
    </nav>
  );
};
