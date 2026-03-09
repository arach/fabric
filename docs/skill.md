---
title: Skills
description: Pre-built skills for AI agents working with Fabric.
order: 6
---

# Skills

Skills are task templates that help AI agents work effectively with Fabric.

## fabric-sandbox

Create, use, and manage sandboxes.

**When to use:** Agent needs isolated code execution, file operations, or command running.

**Key operations:**
- `factory.create({ image })` — Create sandbox
- `sandbox.exec(command)` — Run shell command
- `sandbox.runCode(code, language)` — Execute code
- `sandbox.writeFile(path, content)` — Write file
- `sandbox.readFile(path)` — Read file
- `sandbox.stop()` — Clean up

**Critical rules:**
- Always call `sandbox.stop()` in a finally block
- Local provider requires macOS + Apple Silicon
- Cloud providers require API keys in environment

## fabric-handoff

Snapshot and restore state across runtimes.

**When to use:** Agent needs to move work from local to cloud or between cloud providers.

**Key operations:**
- `sandbox.snapshot()` — Capture workspace state
- `sandbox.restore(snapshot)` — Restore from snapshot
- `sandbox.delegate(targetRuntime)` — Capture + stop in one call

**Critical rules:**
- Snapshots capture files only (not running processes)
- Files are base64 encoded in the snapshot
- Stop the source sandbox before creating the target

## fabric-config

Manage per-project `.fabric` configuration.

**When to use:** Agent needs to configure sandbox defaults for a project.

**Key operations:**
- `fabric init [profile]` — Create config
- Profiles: `minimal`, `node`, `python`, `bun`
- Config keys: `provider`, `image`, `profile`, `mount`, `env`, `network`, `cpus`, `memory`

**Critical rules:**
- `.fabric` is discovered by walking up directories
- `mount:` and `env:` are repeatable keys
- Profile defaults are merged, not replaced
- Mount format: `source:destination[:ro]`
