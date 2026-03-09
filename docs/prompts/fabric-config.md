---
title: Set Up Project Config
---

# Set Up Project Config

Initialize a `.fabric` config for a Node.js project and verify it works.

## Prompt

```
Initialize a Fabric config for this Node.js project using the node profile. Add a mount for the ./data directory and set NODE_ENV=development. Then run "node --version" to verify it picks up the config.
```

## Expected Steps

1. Run `fabric init node`
2. Edit `.fabric` to add `mount: ./data:/workspace/data` and `env: NODE_ENV=development`
3. Run `fabric exec "node --version"` — should use node:22 image from profile
4. Run `fabric exec "echo $NODE_ENV"` — should print "development"

## Key Files

- `packages/cli/src/cli.ts` — loadFabricConfig(), PROFILES, cmdInit()
