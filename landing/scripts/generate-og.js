import satori from 'satori';
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Load fonts — new design system
const spaceGroteskLight = readFileSync(join(__dirname, 'fonts', 'SpaceGrotesk-Light.ttf'));
const spaceGroteskMedium = readFileSync(join(__dirname, 'fonts', 'SpaceGrotesk-Medium.ttf'));
const ibmPlexMono = readFileSync(join(__dirname, 'fonts', 'IBMPlexMono-Regular.ttf'));
// Keep Inter Bold for display headings (serif not available in Satori, Inter Bold is close enough)
const interBold = readFileSync(join(__dirname, 'fonts', 'Inter-Bold.ttf'));

const fonts = [
  { name: 'SpaceGrotesk', data: spaceGroteskLight, weight: 300, style: 'normal' },
  { name: 'SpaceGrotesk', data: spaceGroteskMedium, weight: 500, style: 'normal' },
  { name: 'IBMPlexMono', data: ibmPlexMono, weight: 400, style: 'normal' },
  { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
];

// Load logos as base64
const daytonaLogo = `data:image/png;base64,${readFileSync(join(publicDir, 'daytona.png')).toString('base64')}`;
const e2bLogo = `data:image/png;base64,${readFileSync(join(publicDir, 'e2b.png')).toString('base64')}`;
const exeLogo = `data:image/png;base64,${readFileSync(join(publicDir, 'exe.png')).toString('base64')}`;

// Design tokens
const canvas = '#0a0a0a';
const panel = '#141414';
const ink = '#e5e5e5';
const secondary = '#b5b5b5';
const muted = '#737373';
const accent = '#38bdf8';
const accentBright = '#7dd3fc';
const line = 'rgba(255,255,255,0.09)';

// Helper
const h = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children: children.length === 1 ? children[0] : children.length > 0 ? children : undefined,
  },
});

// Shared background layers
const bgLayers = () => [
  // Radial glow top-left
  h('div', {
    style: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: `radial-gradient(circle at 100px 80px, rgba(56,189,248,0.12), transparent 40%)`,
    },
  }),
  // Radial glow bottom-right
  h('div', {
    style: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: `radial-gradient(circle at 1100px 550px, rgba(56,189,248,0.06), transparent 35%)`,
    },
  }),
  // Grid
  h('div', {
    style: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)',
      backgroundSize: '42px 42px',
      opacity: 0.6,
    },
  }),
  // Signal bar at top
  h('div', {
    style: {
      position: 'absolute', top: 0, left: 0, right: 0, height: 3,
      backgroundImage: `linear-gradient(90deg, transparent, ${accent} 30%, ${accentBright} 60%, transparent)`,
      opacity: 0.5,
    },
  }),
];

// Fabric logo hexagon
const fabricLogo = () => h('div', {
  style: {
    width: 44, height: 44, backgroundColor: ink, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
},
  h('svg', { width: 26, height: 26, viewBox: '0 0 32 32' },
    h('path', { d: 'M16 2L3 9V23L16 30L29 23V9L16 2Z', stroke: canvas, strokeWidth: 2.5, fill: 'none', strokeLinejoin: 'round' }),
    h('path', { d: 'M16 30V16', stroke: canvas, strokeWidth: 2.5 }),
    h('path', { d: 'M29 9L16 16L3 9', stroke: canvas, strokeWidth: 2.5 }),
  ),
);

// Mono label badge
const monoBadge = (text) => h('div', {
  style: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 14px', borderRadius: 20,
    backgroundColor: 'rgba(56,189,248,0.1)', border: '1px solid rgba(255,255,255,0.09)',
  },
},
  h('div', { style: { width: 6, height: 6, borderRadius: 3, backgroundColor: accent } }),
  h('span', { style: { fontFamily: 'IBMPlexMono', fontSize: 12, color: accent, textTransform: 'uppercase', letterSpacing: '0.1em' } }, text),
);

// ── Main OG Image ────────────────────────────────────────
const mainOGImage = h('div', {
  style: {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    backgroundColor: canvas, fontFamily: 'SpaceGrotesk', position: 'relative', overflow: 'hidden',
  },
},
  ...bgLayers(),

  h('div', {
    style: { display: 'flex', flexDirection: 'column', padding: '100px 120px', position: 'relative' },
  },
    // Top row: logo + badge
    h('div', {
      style: { display: 'flex', alignItems: 'center', gap: 20, marginBottom: 48 },
    },
      fabricLogo(),
      h('span', { style: { fontFamily: 'IBMPlexMono', fontSize: 18, color: ink, textTransform: 'uppercase', letterSpacing: '0.14em' } }, 'fabric'),
      monoBadge('v0.2.0'),
    ),

    // Headline
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 4 } },
      h('span', { style: { fontSize: 64, fontWeight: 700, fontFamily: 'Inter', color: ink, letterSpacing: '-0.04em' } }, 'Portable runtimes for'),
      h('span', { style: { fontSize: 64, fontWeight: 700, fontFamily: 'Inter', color: accent, letterSpacing: '-0.04em' } }, 'local and cloud tasks'),
    ),

    // Tagline
    h('span', {
      style: { fontSize: 22, fontWeight: 300, color: secondary, marginTop: 32 },
    }, 'Apple containers locally. Daytona, E2B, or exe.dev in the cloud.'),

    // Provider logos
    h('div', {
      style: { display: 'flex', alignItems: 'center', gap: 48, marginTop: 40 },
    },
      h('img', { src: daytonaLogo, width: 80, height: 18, style: { opacity: 0.5 } }),
      h('img', { src: e2bLogo, height: 20, style: { opacity: 0.5 } }),
      h('img', { src: exeLogo, height: 24, style: { opacity: 0.5 } }),
    ),
  ),
);

// ── Vendor OG Image ──────────────────────────────────────
const vendorOGImage = (vendor, subtitle, features) => h('div', {
  style: {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column',
    backgroundColor: canvas, fontFamily: 'SpaceGrotesk', position: 'relative', overflow: 'hidden',
  },
},
  ...bgLayers(),

  h('div', {
    style: { display: 'flex', flexDirection: 'column', padding: '100px 120px', position: 'relative' },
  },
    // Top row
    h('div', {
      style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 },
    },
      fabricLogo(),
      h('span', { style: { fontFamily: 'IBMPlexMono', fontSize: 18, color: ink, textTransform: 'uppercase', letterSpacing: '0.14em' } }, 'fabric'),
      h('span', { style: { fontSize: 24, fontWeight: 300, color: muted, margin: '0 4px' } }, '×'),
      h('span', { style: { fontSize: 24, fontWeight: 500, color: ink } }, vendor),
    ),

    // Headline
    h('span', { style: { fontSize: 56, fontWeight: 700, fontFamily: 'Inter', color: ink, letterSpacing: '-0.03em' } }, subtitle),

    // Features as mono pills
    h('div', {
      style: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 48 },
    },
      ...features.map(f => h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 16px', borderRadius: 8,
          backgroundColor: panel, border: `1px solid ${line}`,
        },
      },
        h('span', { style: { fontFamily: 'IBMPlexMono', fontSize: 14, color: secondary } }, f),
      )),
    ),

    // fab.run
    h('span', {
      style: { fontFamily: 'IBMPlexMono', fontSize: 14, color: muted, marginTop: 48, letterSpacing: '0.08em' },
    }, 'fab.run'),
  ),
);

async function generateOGImage(element, filename) {
  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(publicDir, filename), png);
  console.log(`✓ Generated ${filename}`);
}

async function main() {
  console.log('Generating OG images...\n');

  await generateOGImage(mainOGImage, 'og-image.png');

  await generateOGImage(
    vendorOGImage('Daytona', 'Secure cloud sandboxes for agents', [
      'Enterprise isolation',
      'Multi-language',
      'Network policies',
      'Checkpoint & restore',
    ]),
    'og-daytona.png'
  );

  await generateOGImage(
    vendorOGImage('E2B', 'Code interpreter sandboxes', [
      '200ms cold start',
      'Full internet access',
      'Claude Code template',
      'Jupyter kernel',
    ]),
    'og-e2b.png'
  );

  await generateOGImage(
    vendorOGImage('exe.dev', 'Persistent Ubuntu VMs', [
      'Full root access',
      'SSH/SFTP native',
      'Persistent disk',
      'Shelley + Claude Code',
    ]),
    'og-exe.png'
  );

  console.log('\nDone!');
}

main().catch(console.error);
