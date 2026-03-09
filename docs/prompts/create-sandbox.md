---
title: Create and Use a Sandbox
---

# Create and Use a Sandbox

Create a local sandbox, run a command, and clean up.

## Prompt

```
Using Fabric, create a local sandbox with alpine:latest, run "uname -a" inside it, print the output, then stop the sandbox. Use the SDK, not the CLI.
```

## Expected Steps

1. Import `LocalContainerSandboxFactory` from `@fabric/runtime-local`
2. Call `factory.create({ image: "alpine:latest" })`
3. Call `sandbox.exec("uname -a")`
4. Print `result.stdout`
5. Call `sandbox.stop()`

## Key Files

- `packages/core/src/index.ts` — Sandbox interface
- `packages/runtime-local/src/index.ts` — LocalContainerSandbox implementation
