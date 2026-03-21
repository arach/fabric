import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Github, Download } from 'lucide-react';

const FabricLogo = () => (
  <svg width="14" height="14" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="100,30 160,65 160,135 100,170 40,135 40,65" stroke="currentColor" strokeWidth="12" fill="none"/>
    <line x1="100" y1="30" x2="100" y2="170" stroke="currentColor" strokeWidth="12"/>
    <line x1="40" y1="65" x2="160" y2="135" stroke="currentColor" strokeWidth="12"/>
    <line x1="160" y1="65" x2="40" y2="135" stroke="currentColor" strokeWidth="12"/>
  </svg>
);

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isDocsPage = location.pathname.startsWith('/docs');
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    if (isHomePage) {
      const element = document.getElementById(hash);
      if (element) element.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-canvas/92 backdrop-blur-xl border-line' : 'bg-transparent border-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-6 h-6 rounded bg-ink flex items-center justify-center text-canvas">
            <FabricLogo />
          </div>
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-ink">fabric</span>
          <span className="hidden sm:inline-block rounded-full bg-wave px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-accent">v0.2.0</span>
        </a>

        <div className="hidden md:flex items-center gap-1">
          <a
            href="/docs/getting-started"
            className={`rounded-md px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] transition-colors ${isDocsPage ? 'text-ink' : 'text-muted hover:bg-wave hover:text-ink'}`}
          >
            Docs
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => handleHashClick(e, 'how-it-works')}
            className="rounded-md px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted hover:bg-wave hover:text-ink transition-colors"
          >
            How it Works
          </a>
          <a
            href="/#features"
            onClick={(e) => handleHashClick(e, 'features')}
            className="rounded-md px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted hover:bg-wave hover:text-ink transition-colors"
          >
            Features
          </a>
          <a
            href="https://github.com/arach/fabric"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted hover:bg-wave hover:text-ink transition-colors flex items-center gap-2"
          >
            <Github size={14} />
            GitHub
          </a>
          <a
            href="https://github.com/arach/fabric/releases/latest/download/FabricRunner.dmg"
            className="rounded-md px-3.5 py-1.5 font-mono text-[12px] uppercase tracking-[0.14em] bg-wave text-accent hover:bg-accent/20 transition-colors flex items-center gap-1.5"
          >
            <Download size={13} />
            Download
          </a>
        </div>

        <button className="md:hidden text-ink" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-canvas/95 backdrop-blur-xl border-b border-line p-6 md:hidden flex flex-col gap-4">
          <a href="/docs/getting-started" onClick={() => setMobileMenuOpen(false)} className={`font-mono text-[12px] uppercase tracking-[0.14em] ${isDocsPage ? 'text-ink' : 'text-muted hover:text-ink'}`}>Docs</a>
          <a href="/#how-it-works" onClick={(e) => handleHashClick(e, 'how-it-works')} className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted hover:text-ink">How it Works</a>
          <a href="/#features" onClick={(e) => handleHashClick(e, 'features')} className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted hover:text-ink">Features</a>
          <a href="https://github.com/arach/fabric" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted hover:text-ink">GitHub</a>
          <a href="https://github.com/arach/fabric/releases/latest/download/FabricRunner.dmg" onClick={() => setMobileMenuOpen(false)} className="font-mono text-[12px] uppercase tracking-[0.14em] text-accent">Download .dmg</a>
        </div>
      )}
    </nav>
  );
};
