import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'typescript',
  showLineNumbers = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-700/50 hover:bg-zinc-600/50 text-zinc-400 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
        title="Copy to clipboard"
      >
        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: '0.5rem',
          padding: '1rem',
          fontSize: '0.875rem',
          background: 'rgba(0, 0, 0, 0.5)',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'Fira Code, monospace',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
