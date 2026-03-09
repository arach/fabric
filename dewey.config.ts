/** @type {import('@arach/dewey').DeweyConfig} */
export default {
  project: {
    name: 'fabric',
    tagline: 'Lightweight sandboxes for agentic workloads — one interface, any runtime',
    type: 'npm-package',
    version: '0.1.1',
  },

  agent: {
    criticalContext: [
      'Fabric uses bun as its package manager and runtime — never use npm or pnpm',
      'All runtimes implement the unified Sandbox interface (exec, runCode, writeFile, readFile, snapshot, restore)',
      'Local containers use Apple `container` CLI (Virtualization.framework) — no Docker, no Swift binary',
      'The CLI defaults to --provider local — cloud providers (daytona, e2b, exe) require API keys',
      'Per-project .fabric config files define image, mounts, env, and composable profiles (minimal, node, python, bun)',
      'Snapshots enable handoff between any two runtimes — capture state locally, restore in cloud',
      'Image references: "alpine" → docker.io/library/alpine, "omarchy" → lopsided/archlinux',
    ],

    entryPoints: {
      'cli': 'packages/cli/src/cli.ts',
      'core': 'packages/core/src/',
      'runtime-local': 'packages/runtime-local/src/',
      'runtime-daytona': 'packages/runtime-daytona/src/',
      'runtime-e2b': 'packages/runtime-e2b/src/',
      'runtime-exe': 'packages/runtime-exe/src/',
      'server': 'packages/server/src/',
      'landing': 'landing/',
    },

    rules: [
      { pattern: 'cli', instruction: 'Check packages/cli/src/cli.ts — single-file CLI with all commands' },
      { pattern: 'runtime', instruction: 'Check packages/runtime-*/src/ for provider adapters' },
      { pattern: 'container', instruction: 'Local containers use Apple `container` CLI — see packages/runtime-local/src/index.ts' },
      { pattern: 'sandbox', instruction: 'Core Sandbox interface is in packages/core/src/index.ts' },
      { pattern: 'config', instruction: '.fabric config parsing is in packages/cli/src/cli.ts — loadFabricConfig(), parseConfigFile(), PROFILES' },
      { pattern: 'api', instruction: 'Check packages/server/src/ for HTTP API' },
      { pattern: 'snapshot', instruction: 'Snapshot/restore is in each runtime adapter — see Sandbox interface' },
      { pattern: 'handoff', instruction: 'Sandbox.delegate() captures state, target.reclaim() restores — see runtime-local/src/index.ts' },
      { pattern: 'docs', instruction: 'Landing site in landing/, doc content inline in landing/pages/DocsPage.tsx' },
    ],

    sections: ['overview', 'getting-started', 'local-container', 'daytona', 'e2b', 'exe'],
  },

  docs: {
    path: './docs',
    output: './',
    required: ['overview', 'getting-started', 'local-container'],
  },

  install: {
    objective: 'Clone Fabric and run a sandbox on local Apple Silicon.',

    doneWhen: {
      command: 'fabric exec "echo hello from fabric"',
      expectedOutput: 'hello from fabric',
    },

    prerequisites: [
      'macOS 26+ (Tahoe) with Apple Silicon',
      'Bun (https://bun.sh)',
      'Apple container CLI (installed by fabric setup)',
    ],

    steps: [
      { description: 'Clone the repository', command: 'git clone https://github.com/arach/fabric.git && cd fabric' },
      { description: 'Install dependencies', command: 'bun install' },
      { description: 'Set up the local container runtime', command: 'bun run packages/cli/src/cli.ts setup' },
      { description: 'Create a local sandbox', command: 'fabric create --provider local' },
      { description: 'Run a command', command: 'fabric exec "echo hello from fabric"' },
      { description: 'Drop into a shell', command: 'fabric shell' },
    ],
  },
}
