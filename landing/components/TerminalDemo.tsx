import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

const STEPS = [
  { text: 'bash scripts/install-runner.sh', delay: 1000 },
  { text: '=> Fabric Runner bootstrap', output: true, color: 'text-cyan-400', delay: 500 },
  { text: '✔ Container CLI ready', output: true, delay: 300 },
  { text: '✔ Container builder ready', output: true, delay: 300 },
  { text: '✔ Runner home prepared', output: true, color: 'text-emerald-400', delay: 700 },
  { text: 'fabric runner run --cookbook ocr-page --input pdf=book.pdf --input page=7', delay: 1200 },
  { text: 'Resolving cookbook: ocr-page@v1', output: true, color: 'text-cyan-400', delay: 350 },
  { text: 'Image: fabric-ocr:local', output: true, delay: 300 },
  { text: '', output: true, delay: 200 },
  { text: 'Running OCR on scanned page 7...', output: true, color: 'text-zinc-100', delay: 500 },
  { text: '{ "pageNumber": 7, "engine": "tesseract", "text": "A BOOK OF VERSES" }', output: true, color: 'text-emerald-400', delay: 1200 },
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
    navigator.clipboard.writeText('bash scripts/install-runner.sh');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto md:mx-0 font-mono text-[13px] tracking-[0.02em] rounded-xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl relative">
      {/* Simple Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
          <div className="w-3 h-3 rounded-full bg-zinc-700"></div>
        </div>
        <button
          onClick={handleCopy}
          className="text-zinc-500 hover:text-white transition-colors"
          title="Copy command"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Body */}
      <div className="p-6 h-[300px] overflow-y-auto custom-scrollbar">
        <div className="space-y-3 font-normal">
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
