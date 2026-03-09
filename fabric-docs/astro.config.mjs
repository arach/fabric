import { defineConfig } from 'astro/config'
import tailwind from '@tailwindcss/vite'
import react from '@astrojs/react'
import { visit } from 'unist-util-visit'

// Rewrite ./foo.md links to /docs/foo route paths
function remarkRewriteMdLinks() {
  return (tree) => {
    visit(tree, 'link', (node) => {
      if (node.url && node.url.match(/^\.\/.*\.md$/)) {
        const slug = node.url.replace(/^\.\//, '').replace(/\.md$/, '')
        node.url = '/docs/' + slug
      }
    })
  }
}

export default defineConfig({
  base: '/docs',
  integrations: [react()],
  markdown: {
    remarkPlugins: [remarkRewriteMdLinks],
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    plugins: [tailwind()],
  },
})
