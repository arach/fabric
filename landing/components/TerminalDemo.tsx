import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';

const STEPS = [
  { text: 'bash scripts/install-runner.sh', delay: 1000 },
  { text: '=> Fabric Runner bootstrap', output: true, color: 'text-accent', delay: 500 },
  { text: '✔ Container CLI ready', output: true, delay: 300 },
  { text: '✔ Container builder ready', output: true, delay: 300 },
  { text: '✔ Runner home prepared', output: true, color: 'text-accent', delay: 700 },
  { text: 'fabric runner run --cookbook ocr-page --input pdf=book.pdf --input page=7', delay: 1200 },
  { text: 'Resolving cookbook: ocr-page@v1', output: true, color: 'text-accent', delay: 350 },
  { text: 'Image: fabric-ocr:local', output: true, delay: 300 },
  { text: '', output: true, delay: 200 },
  { text: 'Running OCR on scanned page 7...', output: true, color: 'text-ink', delay: 500 },
  { text: '{ "pageNumber": 7, "engine": "tesseract", "text": "A BOOK OF VERSES" }', output: true, color: 'text-accent', delay: 1200 },
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
    <div className="w-full max-w-lg mx-auto md:mx-0 rounded-xl overflow-hidden border border-line-strong bg-canvas shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-panel">
        <div className="flex gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-line-strong" />
          <div className="w-2.5 h-2.5 rounded-full bg-line-strong" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">terminal</span>
        <button
          onClick={handleCopy}
          className="text-muted hover:text-ink transition-colors"
          title="Copy command"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Body */}
      <div className="p-5 h-[300px] overflow-y-auto scrollbar-hide">
        <div className="space-y-2.5 font-mono text-[12px] leading-6">
          {lines.map((line, i) => (
            <div key={i} className={line.output ? 'opacity-70' : 'flex items-center'}>
              {!line.output && <span className="text-muted mr-3 select-none">$</span>}
              <span className={line.color || (line.output ? 'text-secondary' : 'text-ink')}>
                {line.text}
              </span>
            </div>
          ))}
          {currentStepIndex < STEPS.length && !STEPS[currentStepIndex].output && (
            <div className="flex items-center">
              <span className="text-muted mr-3 select-none">$</span>
              <span className="w-2 h-4 bg-accent animate-pulse" />
            </div>
          )}
          {currentStepIndex >= STEPS.length && (
            <div className="flex items-center mt-2">
              <span className="text-muted mr-3 select-none">$</span>
              <span className="w-2 h-4 bg-muted animate-pulse" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
