---
title: Handoff Between Runtimes
---

# Handoff Between Runtimes

Snapshot state from a local sandbox and restore it in a cloud provider.

## Prompt

```
Using Fabric, create a local sandbox, write a file to it, snapshot the state, stop the local sandbox, then create a Daytona sandbox and restore the snapshot there. Verify the file exists in the cloud sandbox.
```

## Expected Steps

1. Create local sandbox via `LocalContainerSandboxFactory`
2. `sandbox.writeFile("data.json", '{"key": "value"}')`
3. `const snapshot = await sandbox.snapshot()`
4. `await sandbox.stop()`
5. Create Daytona sandbox via `DaytonaSandboxFactory`
6. `await cloudSandbox.restore(snapshot)`
7. `await cloudSandbox.exec("cat /workspace/data.json")`
8. `await cloudSandbox.stop()`

## Key Files

- `packages/runtime-local/src/index.ts` — snapshot/restore implementation
- `packages/runtime-daytona/src/index.ts` — Daytona restore
- `packages/core/src/index.ts` — SandboxSnapshot type
