import satori from 'satori';
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Load fonts
const interBold = readFileSync(join(__dirname, 'fonts', 'Inter-Bold.ttf'));
const interRegular = readFileSync(join(__dirname, 'fonts', 'Inter-Regular.ttf'));

const fonts = [
  { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
  { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
];

// Load logos as base64
const daytonaLogo = `data:image/png;base64,${readFileSync(join(publicDir, 'daytona.png')).toString('base64')}`;
const e2bLogo = `data:image/png;base64,${readFileSync(join(publicDir, 'e2b.png')).toString('base64')}`;
const exeLogo = `data:image/png;base64,${readFileSync(join(publicDir, 'exe.png')).toString('base64')}`;

// Helper to create elements
const h = (type, props, ...children) => ({
  type,
  props: {
    ...props,
    children: children.length === 1 ? children[0] : children.length > 0 ? children : undefined,
  },
});

// Main OG Image
const mainOGImage = h('div', {
  style: {
    width: 1200,
    height: 630,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#050508',
    fontFamily: 'Inter',
    position: 'relative',
    overflow: 'hidden',
  },
},
  // Subtle major grid only (80px) with gradient fade
  h('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'linear-gradient(to right, #1a3a5c 1px, transparent 1px), linear-gradient(to bottom, #1a3a5c 1px, transparent 1px)',
      backgroundSize: '80px 80px',
      opacity: 0.3,
    },
  }),
  // Grid gradient overlays - emanate from cross intersection points
  h('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle at 80px 80px, rgba(56, 189, 248, 0.15) 0%, transparent 40%)',
    },
  }),
  h('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle at 1120px 560px, rgba(129, 140, 248, 0.15) 0%, transparent 40%)',
    },
  }),

  // Top-left cross at (80, 80) - 75/25 asymmetric
  // Horizontal line: 40px left (outer), 120px right (inner)
  h('div', {
    style: {
      position: 'absolute',
      top: 79,
      left: 40,
      width: 160,
      height: 2,
      background: 'repeating-linear-gradient(to right, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),
  // Vertical line: 40px up (outer), 120px down (inner)
  h('div', {
    style: {
      position: 'absolute',
      top: 40,
      left: 79,
      width: 2,
      height: 160,
      background: 'repeating-linear-gradient(to bottom, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),

  // Bottom-right cross at (1120, 560) - 75/25 asymmetric
  // Horizontal line: 120px left (inner), 40px right (outer)
  h('div', {
    style: {
      position: 'absolute',
      top: 559,
      left: 1000,
      width: 160,
      height: 2,
      background: 'repeating-linear-gradient(to right, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),
  // Vertical line: 120px up (inner), 40px down (outer)
  h('div', {
    style: {
      position: 'absolute',
      top: 440,
      left: 1119,
      width: 2,
      height: 160,
      background: 'repeating-linear-gradient(to bottom, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),

  // Content - aligned to 80px grid
  h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: '160px 160px',
      position: 'relative',
    },
  },
    // Logo + fabric - baseline at 240 grid line
    h('div', {
      style: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 },
    },
      h('div', {
        style: {
          width: 52,
          height: 52,
          backgroundColor: 'white',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      },
        h('svg', {
          width: 32,
          height: 32,
          viewBox: '0 0 32 32',
        },
          h('path', {
            d: 'M16 2L3 9V23L16 30L29 23V9L16 2Z',
            stroke: '#050508',
            strokeWidth: 2.5,
            fill: 'none',
            strokeLinejoin: 'round',
          }),
          h('path', { d: 'M16 30V16', stroke: '#050508', strokeWidth: 2.5 }),
          h('path', { d: 'M29 9L16 16L3 9', stroke: '#050508', strokeWidth: 2.5 }),
        ),
      ),
      h('span', { style: { fontSize: 48, fontWeight: 700, color: 'white' } }, 'fabric'),
    ),
    // Headline - tighter for grid alignment
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 0 } },
      h('span', { style: { fontSize: 64, fontWeight: 700, color: 'white' } }, 'Seamless'),
      h('span', {
        style: {
          fontSize: 64,
          fontWeight: 700,
          backgroundImage: 'linear-gradient(90deg, #38bdf8, #818cf8)',
          backgroundClip: 'text',
          color: 'transparent',
        },
      }, 'Claude Code Sessions'),
    ),
    // Tagline - aligned to grid
    h('span', {
      style: { fontSize: 26, color: '#a1a1aa', marginTop: 40 },
    }, 'Run agents locally or in the cloud with one interface'),
    // Provider logos - all consistent opacity
    h('div', {
      style: { display: 'flex', alignItems: 'center', gap: 48, marginTop: 40 },
    },
      // Daytona - 4140x920 aspect ratio (~4.5:1)
      h('img', { src: daytonaLogo, width: 90, height: 20, style: { opacity: 0.6 } }),
      // E2B
      h('img', { src: e2bLogo, height: 22, style: { opacity: 0.6 } }),
      // exe.dev
      h('img', { src: exeLogo, height: 28, style: { opacity: 0.6 } }),
      // Apple logo for Local
      h('svg', {
        width: 20,
        height: 24,
        viewBox: '0 0 814 1000',
        style: { opacity: 0.7, marginTop: -2 },
      },
        h('path', {
          fill: '#ffffff',
          d: 'M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 781.5 0 643.2 0 515.9 0 330.1 119.4 232.1 236.8 232.1c65.3 0 119.7 42.8 160.5 42.8 39.5 0 101.1-45.4 176.3-45.4 28.5 0 130.9 2.6 198.5 110.4zM554.1 0c-16.5 38.4-60 87.5-104.9 117.2-42.8 28.3-90.3 50.1-140.6 50.1-8.6 0-17.1-.6-24.5-1.9-1.3-8-1.9-16.5-1.9-24.5 0-49.6 22.5-102.4 61.6-138.1 20.1-18.2 45.4-33.4 75.1-45.4C449.4 45.4 494.8 32.1 532.4 32.1c6.5 0 12.9.6 18.8 1.3 2.6 11 2.9 21.8 2.9 33.6 0 11-1.3 21.9-3.9 33z',
        }),
      ),
    ),
  ),
  // Bottom accent line
  h('div', {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 8,
      backgroundImage: 'linear-gradient(90deg, #38bdf8, #818cf8)',
      opacity: 0.5,
    },
  }),
);

// Vendor OG Image factory
const vendorOGImage = (vendor, features) => h('div', {
  style: {
    width: 1200,
    height: 630,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#050508',
    fontFamily: 'Inter',
    position: 'relative',
    overflow: 'hidden',
  },
},
  // Subtle major grid only with gradient fade
  h('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'linear-gradient(to right, #1a3a5c 1px, transparent 1px), linear-gradient(to bottom, #1a3a5c 1px, transparent 1px)',
      backgroundSize: '80px 80px',
      opacity: 0.3,
    },
  }),
  // Grid gradient overlays - emanate from cross intersection points
  h('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle at 80px 80px, rgba(56, 189, 248, 0.15) 0%, transparent 40%)',
    },
  }),
  h('div', {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundImage: 'radial-gradient(circle at 1120px 560px, rgba(129, 140, 248, 0.15) 0%, transparent 40%)',
    },
  }),

  // Top-left cross
  h('div', {
    style: {
      position: 'absolute',
      top: 79,
      left: 40,
      width: 160,
      height: 2,
      background: 'repeating-linear-gradient(to right, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),
  h('div', {
    style: {
      position: 'absolute',
      top: 40,
      left: 79,
      width: 2,
      height: 160,
      background: 'repeating-linear-gradient(to bottom, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),

  // Bottom-right cross
  h('div', {
    style: {
      position: 'absolute',
      top: 559,
      left: 1000,
      width: 160,
      height: 2,
      background: 'repeating-linear-gradient(to right, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),
  h('div', {
    style: {
      position: 'absolute',
      top: 440,
      left: 1119,
      width: 2,
      height: 160,
      background: 'repeating-linear-gradient(to bottom, #38bdf8 0px, #38bdf8 6px, transparent 6px, transparent 10px)',
      opacity: 0.9,
    },
  }),

  // Content
  h('div', {
    style: {
      display: 'flex',
      flexDirection: 'column',
      padding: '140px 100px',
      position: 'relative',
    },
  },
    // fabric × Vendor
    h('div', {
      style: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 },
    },
      h('span', { style: { fontSize: 56, fontWeight: 700, color: 'white' } }, 'fabric'),
      h('span', { style: { fontSize: 40, fontWeight: 300, color: '#52525b' } }, '×'),
      h('span', {
        style: {
          fontSize: 56,
          fontWeight: 700,
          backgroundImage: 'linear-gradient(90deg, #38bdf8, #818cf8)',
          backgroundClip: 'text',
          color: 'transparent',
        },
      }, vendor),
    ),
    // Headline
    h('div', { style: { display: 'flex', flexDirection: 'column', gap: 8 } },
      h('span', { style: { fontSize: 48, fontWeight: 600, color: 'white' } }, 'Seamless Claude Code Sessions'),
      h('span', { style: { fontSize: 48, fontWeight: 600, color: '#a1a1aa' } }, `with ${vendor}`),
    ),
    // Features
    h('div', { style: { display: 'flex', gap: 80, marginTop: 60 } },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
        h('span', { style: { fontSize: 22, color: '#71717a' } }, features[0]),
        h('span', { style: { fontSize: 22, color: '#71717a' } }, features[1]),
      ),
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: 20 } },
        h('span', { style: { fontSize: 22, color: '#71717a' } }, features[2]),
        h('span', { style: { fontSize: 22, color: '#71717a' } }, features[3]),
      ),
    ),
  ),
  // Bottom accent line
  h('div', {
    style: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 8,
      backgroundImage: 'linear-gradient(90deg, #38bdf8, #818cf8)',
      opacity: 0.5,
    },
  }),
);

async function generateOGImage(element, filename, generateSmall = false) {
  const svg = await satori(element, {
    width: 1200,
    height: 630,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(publicDir, filename), png);
  console.log(`✓ Generated ${filename}`);

  // Generate smaller version if requested
  if (generateSmall) {
    const smallPng = await sharp(Buffer.from(svg))
      .resize(600, 315)
      .png()
      .toBuffer();
    const smallFilename = filename.replace('.png', '-small.png');
    writeFileSync(join(publicDir, smallFilename), smallPng);
    console.log(`✓ Generated ${smallFilename}`);
  }
}

async function main() {
  console.log('Generating OG images with Satori...\n');

  await generateOGImage(mainOGImage, 'og-image.png', true);

  await generateOGImage(
    vendorOGImage('Daytona', [
      'Enterprise-grade isolation',
      'Seamless file sync',
      'Multi-language support',
      'Checkpoint & restore',
    ]),
    'og-daytona.png',
    true
  );

  await generateOGImage(
    vendorOGImage('E2B', [
      'Instant 200ms startup',
      'Full internet access',
      'Claude Code template',
      'Jupyter kernel built-in',
    ]),
    'og-e2b.png',
    true
  );

  await generateOGImage(
    vendorOGImage('exe.dev', [
      'Persistent Ubuntu VMs',
      'Full root access',
      'Shelley agent built-in',
      'SSH/SFTP native',
    ]),
    'og-exe.png',
    true
  );

  console.log('\nDone!');
}

main().catch(console.error);
