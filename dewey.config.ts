/** @type {import('@arach/dewey').DeweyConfig} */
export default {
  project: {
    name: 'fabric',
    tagline: 'Ambient compute fabric — run agentic workloads across local and cloud runtimes',
    type: 'npm-package',
    version: '0.1.0',
  },

  agent: {
    criticalContext: [
      'Fabric uses bun as its package manager and runtime — never use npm or pnpm',
      'All runtimes implement the unified Sandbox interface (exec, runCode, writeFile, readFile, snapshot, restore)',
      'The local container runtime uses Apple Containerization framework (Virtualization.framework) — macOS 26+, Apple Silicon only',
      'FabricContainer is a Swift 6.2 executable that provides CLI + HTTP API over Unix domain socket',
      'Image references are auto-normalized: "alpine" → "docker.io/library/alpine"',
      'Snapshots enable handoff between any two runtimes — capture state locally, restore in cloud',
    ],

    entryPoints: {
      'core': 'packages/core/src/',
      'runtime-local': 'packages/runtime-local/src/',
      'fabric-container (Swift)': 'packages/runtime-local/FabricContainer/',
      'runtime-e2b': 'packages/runtime-e2b/src/',
      'runtime-daytona': 'packages/runtime-daytona/src/',
      'runtime-exe': 'packages/runtime-exe/src/',
      'server': 'packages/server/src/',
    },

    rules: [
      { pattern: 'runtime', instruction: 'Check packages/runtime-*/src/ for provider adapters' },
      { pattern: 'container', instruction: 'Check packages/runtime-local/FabricContainer/ for Swift source and packages/runtime-local/src/index.ts for TS adapter' },
      { pattern: 'sandbox', instruction: 'Core Sandbox interface is in packages/core/src/index.ts' },
      { pattern: 'api', instruction: 'Check packages/server/src/ for HTTP API' },
      { pattern: 'snapshot', instruction: 'Snapshot/restore is in each runtime adapter and in the FabricContainer HTTP API (/snapshot, /restore)' },
      { pattern: 'handoff', instruction: 'Sandbox.delegate() captures state, target.reclaim() restores — see runtime-local/src/index.ts' },
    ],

    sections: ['overview', 'getting-started', 'local-container', 'daytona', 'e2b', 'exe'],
  },

  docs: {
    path: './docs',
    output: './',
    required: ['overview', 'getting-started', 'local-container'],
  },

  install: {
    objective: 'Clone Fabric and run a container on local Apple Silicon.',

    doneWhen: {
      command: './scripts/run-container.sh "echo hello from fabric"',
      expectedOutput: 'Exit code: 0',
    },

    prerequisites: [
      'macOS 26+ (Tahoe) with Apple Silicon',
      'Bun (https://bun.sh)',
      'Swift 6.2+ (Xcode Command Line Tools)',
      'Linux kernel binary (vmlinux) for Virtualization.framework',
    ],

    steps: [
      { description: 'Clone the repository', command: 'git clone https://github.com/arach/fabric.git && cd fabric' },
      { description: 'Install dependencies', command: 'bun install' },
      { description: 'Build the Swift container runtime', command: 'cd packages/runtime-local/FabricContainer && swift build -c release' },
      { description: 'Verify the kernel binary exists', command: 'ls packages/runtime-local/bin/vmlinux' },
      { description: 'Run a test container', command: './scripts/run-container.sh "echo hello from fabric"' },
    ],
  },
}
