---
title: Philosophy
description: Why Fabric exists, the problem it solves, and the design principles behind it.
order: 5
---

# Philosophy

Fabric is built on a simple premise: **compute should follow you**.

## Why Fabric?

You could use provider SDKs directly. Daytona, E2B, and exe.dev all have great APIs. So why add Fabric?

1. **Unified interface.** Write code once, run anywhere. Switch providers by changing one line.
2. **Handoffs.** Move running work between local and cloud without losing context. No other tool does this.
3. **Local-first.** Start development locally with Apple containers (no Docker), scale to cloud when needed.
4. **Future-proof.** New providers show up, your code stays the same.

If you only use one provider and don't need handoffs, use their SDK directly. If you want flexibility, use Fabric.

## The Problem

AI agents are constrained by where they run. Start a Claude Code session locally and you're limited to your machine's resources. Move to the cloud and you lose context. Switch providers and you start over.

That wastes time and breaks flow.

## Our Approach

When an agent runs a task, it builds up state: the conversation so far, files it's created, environment it's configured. That state is trapped in whichever runtime started the work. Fabric adds a **context layer** that sits above all runtimes:

```
┌─────────────────────────────────────────────────┐
│              Context Layer                       │
│    (conversation, agent state, checkpoints)      │
└─────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐
   │  Local  │ ─▶ │ Container│ ─▶ │  Cloud  │
   │  (Mac)  │    │ (Apple) │    │(E2B/etc)│
   └─────────┘    └─────────┘    └─────────┘
```

The context layer captures three things:

- **Conversation**: the full message history between user and agent, so a handoff doesn't lose the thread
- **Agent state**: environment variables, tool configurations, and working directory, so the new runtime picks up where the last left off
- **Checkpoints**: filesystem snapshots that can be restored on any runtime, turning handoffs from minutes of re-setup into seconds

Work starts anywhere and moves freely. An agent begins on your Mac, outgrows local resources, and hands off to the cloud. The user doesn't notice.

## Design Principles

### Provider Agnostic

Fabric doesn't lock you into a single cloud provider. The same code works across Daytona, E2B, exe.dev, or local containers:

```typescript
const sandbox = await factory.create({})
await sandbox.exec("your command")
await sandbox.stop()
```

Switch providers by changing one line.

### Context Preservation

Snapshots capture filesystem state, environment variables, and execution history. Restore anywhere:

```typescript
const snapshot = await localSandbox.snapshot()
await cloudSandbox.restore(snapshot)
```

### Local First

Development happens locally. Fabric provides lightweight containers using Apple's Virtualization framework. No Docker overhead, native performance.

### Progressive Enhancement

Start simple. Add cloud scaling when you need it. The abstraction grows with your requirements.

## Why Apple Containers?

For local development, Fabric uses Apple's Virtualization.framework to run Linux containers in lightweight VMs:

- **Native performance** - Hardware-accelerated virtualization on Apple Silicon
- **No Docker** - Skip the daemon overhead
- **Full Linux** - Real kernel, real filesystem, real networking
- **Fast startup** - Containers boot in ~1 second

Learn more in our [Local Containers](/docs/local-container) guide.

## The Handoff Pattern

Fabric's defining feature is handoffs:

1. **Local → Container**: Move from host execution to isolated container
2. **Container → Cloud**: Scale to cloud when local resources aren't enough
3. **Cloud → Cloud**: Migrate between providers without losing state
4. **Cloud → Local**: Reclaim work back to your machine

Each transition preserves context through snapshots.
