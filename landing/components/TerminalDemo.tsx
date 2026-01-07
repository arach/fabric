import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

const STEPS = [
  { text: 'fabric init --agent claude-v1', delay: 1000 },
  { text: '✔ Initialized local environment', output: true, delay: 500 },
  { text: '✔ Configured sandbox filesystem', output: true, delay: 500 },
  { text: 'fabric deploy --target e2b', delay: 1500 },
  { text: '→ Building container...', output: true, delay: 800 },
  { text: '→ Syncing context to E2B...', output: true, delay: 800 },
  { text: '✔ Deployed successfully to https://e2b.dev/x/89a2s', output: true, color: 'text-emerald-400', delay: 2000 }
];

export const TerminalDemo: React.FC = () => {
  const [lines, setLines] = useState<{text: string; output?: boolean; color?: string}[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentStepIndex >= STEPS.length) return;

    const step = STEPS[currentStepIndex];
    const timeout = setTimeout(() => {
      setLines(prev => [...prev, { text: step.text, output: step.output, color: step.color }]);
      setCurrentStepIndex(prev => prev + 1);
    }, step.delay);

    return () => clearTimeout(timeout);
  }, [currentStepIndex]);

  const handleCopy = () => {
    navigator.clipboard.writeText('npm install -g @fabric/cli');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto md:mx-0 font-mono text-sm rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl relative">
      {/* Simple Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
          <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
        </div>
        <button 
          onClick={handleCopy}
          className="text-zinc-500 hover:text-white transition-colors"
          title="Copy install command"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Body */}
      <div className="p-6 h-[300px] overflow-y-auto custom-scrollbar">
        <div className="space-y-3 font-medium">
          {lines.map((line, i) => (
            <div key={i} className={`${line.output ? 'opacity-70' : 'flex items-center'}`}>
              {!line.output && <span className="text-zinc-500 mr-3">$</span>}
              <span className={line.color || (line.output ? 'text-zinc-400' : 'text-zinc-100')}>
                {line.text}
              </span>
            </div>
          ))}
          {currentStepIndex < STEPS.length && !STEPS[currentStepIndex].output && (
             <div className="flex items-center">
               <span className="text-zinc-500 mr-3">$</span>
               <span className="w-2 h-4 bg-brand-400 animate-pulse"></span>
             </div>
          )}
           {currentStepIndex >= STEPS.length && (
            <div className="flex items-center mt-4">
              <span className="text-zinc-500 mr-3">$</span>
              <span className="w-2 h-4 bg-zinc-500 animate-pulse"></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};