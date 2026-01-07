#!/usr/bin/env node
/**
 * Generate static HTML files for each route with correct OG meta tags.
 * This allows social media crawlers to see the right meta tags while
 * keeping SPA functionality.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://fabric.arach.dev';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Route configurations with their meta tags
const routes = [
  {
    path: '/daytona',
    title: 'fabric × Daytona | Secure Cloud Sandboxes',
    description: 'Run Claude agents in secure Daytona cloud sandboxes. Enterprise-grade isolation with seamless file sync and checkpoint support.',
    image: '/og-daytona.png',
  },
  {
    path: '/e2b',
    title: 'fabric × E2B | Code Interpreter Sandboxes',
    description: 'Run Claude agents in E2B code interpreter sandboxes. Instant startup, full internet access, and Jupyter kernel built-in.',
    image: '/og-e2b.png',
  },
  {
    path: '/exe',
    title: 'fabric × exe.dev | Persistent VMs',
    description: 'Run Claude agents in persistent exe.dev Ubuntu VMs. Full root access, SSH native, and Shelley agent built-in.',
    image: '/og-exe.png',
  },
  {
    path: '/docs',
    title: 'Fabric Docs | Getting Started',
    description: 'Learn how to use Fabric to run agents locally or in the cloud with one interface.',
    image: '/og-image.png',
  },
  {
    path: '/docs/getting-started',
    title: 'Getting Started | Fabric Docs',
    description: 'Get started with Fabric - install, configure, and run your first agent sandbox.',
    image: '/og-image.png',
  },
  {
    path: '/docs/philosophy',
    title: 'Philosophy | Fabric Docs',
    description: 'The philosophy behind Fabric - ambient compute that follows you from local to cloud.',
    image: '/og-image.png',
  },
  {
    path: '/docs/local-containers',
    title: 'Local Containers | Fabric Docs',
    description: 'Run agents in local Apple containers using Virtualization.framework.',
    image: '/og-image.png',
  },
];

function updateMetaTags(html, route) {
  const { title, description, image } = route;
  const url = `${BASE_URL}${route.path}`;
  const imageUrl = `${BASE_URL}${image}`;

  // Update title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

  // Update meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${description}"`
  );

  // Update OG tags
  html = html.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`);
  html = html.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`);
  html = html.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`);
  html = html.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${imageUrl}"`);

  // Update Twitter tags
  html = html.replace(/<meta property="twitter:title" content="[^"]*"/, `<meta property="twitter:title" content="${title}"`);
  html = html.replace(/<meta property="twitter:description" content="[^"]*"/, `<meta property="twitter:description" content="${description}"`);
  html = html.replace(/<meta property="twitter:url" content="[^"]*"/, `<meta property="twitter:url" content="${url}"`);
  html = html.replace(/<meta property="twitter:image" content="[^"]*"/, `<meta property="twitter:image" content="${imageUrl}"`);

  return html;
}

function main() {
  const indexPath = path.join(DIST_DIR, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('Error: dist/index.html not found. Run `npm run build` first.');
    process.exit(1);
  }

  const baseHtml = fs.readFileSync(indexPath, 'utf-8');

  for (const route of routes) {
    const routeDir = path.join(DIST_DIR, route.path);
    const routeHtml = path.join(routeDir, 'index.html');

    // Create directory if it doesn't exist
    fs.mkdirSync(routeDir, { recursive: true });

    // Generate HTML with updated meta tags
    const html = updateMetaTags(baseHtml, route);
    fs.writeFileSync(routeHtml, html);

    console.log(`✓ Generated ${route.path}/index.html`);
  }

  console.log(`\nGenerated ${routes.length} static pages.`);
}

main();
