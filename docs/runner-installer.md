---
title: Fabric Runner Installer
description: Bootstrap plan for a non-developer local Fabric Runner install.
order: 11
---

# Fabric Runner Installer

## Goal

Define the installation path for Fabric Runner as a productized local substrate, separate from Fabric's developer setup flow.

The installer should prepare a machine to run trusted cookbooks on top of Apple's local container runtime without requiring the user to think in terms of:

- Homebrew
- Bun
- Swift builds
- source checkouts

## Product Boundary

Fabric Runner is not the full Fabric developer environment.

It is a narrow installed component responsible for:

1. verifying the host can run local Apple containers
2. ensuring the Apple container system is available
3. ensuring a minimal runner home exists
4. pulling base images or running cookbooks when requested

## Host Assumptions

Required:

- Apple Silicon Mac
- supported macOS version
- permission to run Apple's `container` runtime
- enough disk and network for first-time pulls

Not required:

- Bun
- Node
- Swift toolchain
- Tesseract on the host
- Docker

## Installer Responsibilities

The first installer should:

1. Verify platform
   - `Darwin`
   - `arm64`
   - supported macOS version

2. Verify or install the Apple `container` CLI
   - if already present, reuse it
   - if unavailable, try the narrowest supported install path
   - if automatic installation is impossible, stop with a precise instruction

3. Start the Apple container system
   - `container system start`
   - verify status

4. Start or verify the builder
   - `container builder status`
   - if needed, `container builder start`

5. Create a runner home
   - e.g. `~/.fabric-runner`
   - store metadata, cache hints, and local state there

6. Optionally pre-pull a base image
   - keep this optional for first release

## Delivery Shape

Short term:

- shell bootstrap script
- intended for controlled testing and local distribution

Long term:

- dedicated installer or small host binary/app

The shell bootstrap is good enough to validate the workflow before building a more productized installer.

## Runner Home

Suggested local state directory:

```text
~/.fabric-runner/
  config/
  cache/
  logs/
  state/
```

Possible contents:

- selected runtime defaults
- pulled cookbook metadata
- image cache hints
- execution logs

## Failure Model

The installer should fail early and specifically.

Examples:

- unsupported CPU architecture
- unsupported macOS version
- `container` CLI missing and no supported install path available
- container system failed to start

The script should not continue after a broken substrate.

## Relationship to Fabric Dev Setup

Fabric dev setup:

- source oriented
- Bun dependencies
- Swift build
- local development workflow

Fabric Runner installer:

- substrate oriented
- no source build assumptions
- minimal runtime bootstrap only

These are separate paths and should stay separate.

## First Milestone

The first Fabric Runner installer should be considered successful if it can prepare a clean machine to run:

- a trusted cookbook
- on a local Apple container runtime
- without requiring the full Fabric development lifecycle

