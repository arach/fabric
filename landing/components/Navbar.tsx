import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Github } from 'lucide-react';

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

  // Handle hash navigation - if not on homepage, navigate there first then scroll
  const handleHashClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    if (isHomePage) {
      // Already on homepage, just scroll
      const element = document.getElementById(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // Navigate to homepage, then scroll after a short delay
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
    setMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${isScrolled ? 'bg-dark-950/80 backdrop-blur-md border-dark-border' : 'bg-transparent border-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-black">
             <FabricLogo />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">fabric</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-dark-800 border border-dark-border text-[10px] font-mono text-gray-400">v0.1.1</span>
        </a>

        <div className="hidden md:flex items-center gap-6">
          <a
            href="/docs/getting-started"
            className={`text-sm transition-colors ${isDocsPage ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Docs
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => handleHashClick(e, 'how-it-works')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            How it Works
          </a>
          <a
            href="/#features"
            onClick={(e) => handleHashClick(e, 'features')}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Features
          </a>
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
          <a
            href="/docs/getting-started"
            onClick={() => setMobileMenuOpen(false)}
            className={`text-sm font-medium ${isDocsPage ? 'text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Docs
          </a>
          <a
            href="/#how-it-works"
            onClick={(e) => handleHashClick(e, 'how-it-works')}
            className="text-sm font-medium text-gray-400 hover:text-white"
          >
            How it Works
          </a>
          <a
            href="/#features"
            onClick={(e) => handleHashClick(e, 'features')}
            className="text-sm font-medium text-gray-400 hover:text-white"
          >
            Features
          </a>
          <a href="https://github.com/arach/fabric" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-gray-400 hover:text-white">GitHub</a>
        </div>
      )}
    </nav>
  );
};
