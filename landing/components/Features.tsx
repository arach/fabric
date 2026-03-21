import React from 'react';
import { Terminal, Cloud, Zap, Cpu, FileCode } from 'lucide-react';

const features = [
  {
    icon: Terminal,
    title: 'Fabric Runner',
    description: 'Install a narrow local substrate once, then execute cookbook-driven tasks inside Apple containers without dragging users through a developer setup.',
  },
  {
    icon: Cloud,
    title: 'Cloud When You Need It',
    description: 'Keep the same task and cookbook model when you move to Daytona, E2B, or exe.dev. Local-first does not mean local-only.',
  },
  {
    icon: Cpu,
    title: 'No Host Toolchain',
    description: 'Keep OCR, PDF tooling, and task dependencies inside the container. The host only needs the runner substrate and Apple container runtime.',
  },
  {
    icon: FileCode,
    title: 'Cookbook-Driven Tasks',
    description: 'Promote repeatable jobs into guided cookbooks. OCR is the first concrete example, but the same shape applies to media, extraction, and transforms.',
  },
  {
    icon: Zap,
    title: 'Image or Recipe',
    description: 'Learn with a cookbook on Ubuntu, then graduate hot paths into a baked image. The current OCR benchmark showed a real cold-start win from the baked image.',
  },
];

export const Features: React.FC = () => {
  return (
    <section id="features" className="py-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl sm:text-5xl font-display italic tracking-[-0.03em] mb-5 text-ink">
            Built for portable execution.
          </h2>
          <p className="text-[15px] leading-7 text-secondary max-w-2xl">
            Thin local substrate, trusted cookbooks, and the same execution model across Apple containers and remote runtimes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line rounded-xl overflow-hidden border border-line">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-canvas p-8 transition-colors hover:bg-panel"
            >
              <feature.icon
                size={20}
                strokeWidth={1.5}
                className="text-accent mb-5"
              />
              <h3 className="font-mono text-[13px] uppercase tracking-[0.08em] text-ink mb-3">
                {feature.title}
              </h3>
              <p className="text-[15px] leading-7 text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
