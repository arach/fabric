import satori from 'satori';
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const ogDir = join(publicDir, 'og');

mkdirSync(ogDir, { recursive: true });

// Load fonts
const geistBold = readFileSync(join(__dirname, 'fonts', 'Geist-Bold.ttf'));
const geistRegular = readFileSync(join(__dirname, 'fonts', 'Geist-Regular.ttf'));
const geistMono = readFileSync(join(__dirname, 'fonts', 'GeistMono-Medium.ttf'));

const fonts = [
  { name: 'Geist', data: geistBold, weight: 700, style: 'normal' },
  { name: 'Geist', data: geistRegular, weight: 400, style: 'normal' },
  { name: 'Geist Mono', data: geistMono, weight: 500, style: 'normal' },
];

// Fabric brand colors — emerald accent
const COLORS = {
  bg: '#0a0a0a',
  gridLine: '#0d2818',
  accent: '#10b981',       // emerald-500
  accentBright: '#34d399', // emerald-400
  text: '#ffffff',
  textMuted: '#a1a1aa',
  crossColor: '#10b981',
};

// Helper to create elements
const h = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children: children.length === 1 ? children[0] : children.length > 0 ? children : undefined,
  },
});

// Shared brand background (grid, glows, corner marks, accent line)
function brandBackground() {
  return [
    // Major grid with emerald tint
    h('div', {
      style: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `linear-gradient(to right, ${COLORS.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${COLORS.gridLine} 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        opacity: 0.4,
      },
    }),
    // Radial glow from top-left
    h('div', {
      style: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `radial-gradient(circle at 80px 80px, rgba(16, 185, 129, 0.14) 0%, transparent 40%)`,
      },
    }),
    // Radial glow from bottom-right
    h('div', {
      style: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `radial-gradient(circle at 1120px 560px, rgba(16, 185, 129, 0.10) 0%, transparent 40%)`,
      },
    }),
    // Top-left corner — horizontal
    h('div', {
      style: {
        position: 'absolute', top: 79, left: 80, width: 100, height: 2,
        background: `linear-gradient(to right, ${COLORS.crossColor}, transparent)`,
        opacity: 0.7,
      },
    }),
    // Top-left corner — vertical
    h('div', {
      style: {
        position: 'absolute', top: 80, left: 79, width: 2, height: 100,
        background: `linear-gradient(to bottom, ${COLORS.crossColor}, transparent)`,
        opacity: 0.7,
      },
    }),
    // Bottom-right corner — horizontal
    h('div', {
      style: {
        position: 'absolute', top: 559, left: 1020, width: 100, height: 2,
        background: `linear-gradient(to left, ${COLORS.crossColor}, transparent)`,
        opacity: 0.7,
      },
    }),
    // Bottom-right corner — vertical
    h('div', {
      style: {
        position: 'absolute', top: 460, left: 1119, width: 2, height: 100,
        background: `linear-gradient(to top, ${COLORS.crossColor}, transparent)`,
        opacity: 0.7,
      },
    }),
    // Bottom accent line
    h('div', {
      style: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        backgroundColor: COLORS.accent, opacity: 0.6,
      },
    }),
  ];
}

// Fabric Docs OG Template
const fabricDocsOG = ({ title, subtitle, tag = 'Documentation' }) => h('div', {
  style: {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    backgroundColor: COLORS.bg, fontFamily: 'Geist', position: 'relative', overflow: 'hidden',
  },
},
  ...brandBackground(),

  // Content container
  h('div', {
    style: {
      display: 'flex', flexDirection: 'column', padding: '100px 120px',
      position: 'relative', height: '100%',
    },
  },
    // Top row: fabric brand on left, tag badge on right
    h('div', {
      style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 56,
      },
    },
      // Brand mark
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 12,
        },
      },
        // Emerald dot
        h('div', {
          style: {
            width: 14, height: 14, borderRadius: 7,
            backgroundColor: COLORS.accent,
            boxShadow: `0 0 0 5px rgba(16, 185, 129, 0.2)`,
          },
        }),
        h('span', {
          style: {
            fontSize: 22, fontWeight: 700, color: COLORS.text,
            fontFamily: 'Geist Mono', letterSpacing: '-0.02em',
          },
        }, 'fabric'),
      ),
      // Tag badge
      h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          borderRadius: 6, backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
        },
      },
        h('span', {
          style: {
            fontSize: 13, fontWeight: 700, color: COLORS.accentBright,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            fontFamily: 'Geist Mono',
          },
        }, tag),
      ),
    ),

    // Title
    h('div', {
      style: {
        fontSize: 64, fontWeight: 700, color: COLORS.text,
        lineHeight: 1.1, maxWidth: 900, marginBottom: 16, letterSpacing: '-0.02em',
      },
    }, title),

    // Subtitle
    subtitle && h('div', {
      style: {
        fontSize: 26, fontWeight: 400, color: COLORS.textMuted,
        lineHeight: 1.5, maxWidth: 700,
      },
    }, subtitle),

    // Spacer
    h('div', { style: { flex: 1 } }),

    // Footer with URL
    h('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
    },
      h('span', {
        style: {
          fontSize: 15, fontWeight: 500, color: COLORS.textMuted,
          fontFamily: 'Geist Mono', letterSpacing: '0.01em',
        },
      }, 'fabric.arach.dev/docs'),
    ),
  ),
);

// Pages configuration
const pages = [
  {
    slug: 'index',
    title: 'Fabric',
    subtitle: 'Lightweight sandboxes for agentic workloads — one interface, any runtime',
    tag: 'Docs',
  },
  {
    slug: 'overview',
    title: 'Overview',
    subtitle: 'What Fabric is, how it works, and why it exists',
    tag: 'Getting Started',
  },
  {
    slug: 'getting-started',
    title: 'Getting Started',
    subtitle: 'Get a sandbox running in under 2 minutes',
    tag: 'Guide',
  },
  {
    slug: 'philosophy',
    title: 'Philosophy',
    subtitle: 'Why Fabric exists and the design principles behind it',
    tag: 'Concepts',
  },
  {
    slug: 'architecture',
    title: 'Architecture',
    subtitle: 'Project structure, runtime adapters, and how components connect',
    tag: 'Deep Dive',
  },
  {
    slug: 'local-container',
    title: 'Local Container',
    subtitle: 'Run isolated Linux containers on macOS using Apple Virtualization',
    tag: 'Runtime',
  },
  {
    slug: 'daytona',
    title: 'Daytona',
    subtitle: 'Enterprise cloud sandboxes with secure network policies',
    tag: 'Runtime',
  },
  {
    slug: 'e2b',
    title: 'E2B',
    subtitle: 'Fast-starting code interpreter sandboxes with sub-200ms startup',
    tag: 'Runtime',
  },
  {
    slug: 'exe',
    title: 'exe.dev',
    subtitle: 'Persistent VMs with SSH access and pre-installed agents',
    tag: 'Runtime',
  },
  {
    slug: 'api',
    title: 'API Reference',
    subtitle: 'TypeScript interfaces for the Fabric SDK',
    tag: 'Reference',
  },
  {
    slug: 'skill',
    title: 'Skills',
    subtitle: 'Pre-built skills for AI agents working with Fabric',
    tag: 'Agents',
  },
];

async function generateOGImage(element, filename) {
  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(ogDir, filename), png);
  console.log(`  ✓ ${filename}`);
}

async function main() {
  console.log('Generating Fabric OG images...\n');

  for (const page of pages) {
    await generateOGImage(
      fabricDocsOG({
        title: page.title,
        subtitle: page.subtitle,
        tag: page.tag,
      }),
      `${page.slug}.png`
    );
  }

  console.log('\nDone! Images saved to public/og/');
}

main().catch(console.error);
