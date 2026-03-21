---
title: Fabric Runner
description: A thin cookbook-oriented execution layer on top of Fabric runtimes.
order: 10
---

# Fabric Runner

## Goal

Define a narrow execution layer inside Fabric that can run small, portable cookbooks on top of local or remote runtimes.

This is not a second orchestration platform and not a general configuration-management system. It is a constrained way to express:

- use this runtime
- use this image
- run these setup steps
- run this task
- return structured results

## Why

Fabric already has the right substrate:

- local Apple container execution
- remote runtimes such as Daytona and E2B
- image selection
- task execution primitives

What is missing is a simple, stable layer for task-oriented workflows that do not want to expose users to full sandbox semantics.

Examples:

- OCR a page from a scanned PDF
- transcode an audio clip
- resize and normalize images
- run a one-off extraction pipeline

## Positioning

Fabric Runner should be understood as:

- a thin execution product inside Fabric
- recipe-oriented
- task-oriented
- portable across runtimes

It should not be understood as:

- a full agent platform
- a broad provisioning system
- a replacement for the sandbox abstractions

## Core Idea

The runner accepts:

- a runtime target
- an image
- a cookbook
- inputs

Then it:

1. resolves the runtime
2. provisions the environment
3. executes cookbook steps
4. returns outputs and artifacts

This keeps downstream products focused on the task, not on the infrastructure.

## Example Shape

```sh
fabric runner run \
  --runtime local-container \
  --image ubuntu:24.04 \
  --cookbook https://fabric.arach.dev/cookbooks/ocr-page@v1.json \
  --input pdf=/workspace/book.pdf \
  --input page=6
```

Equivalent programmatic shape:

```ts
await fabricRunner.run({
  runtime: "local-container",
  image: "ubuntu:24.04",
  cookbook: "https://fabric.arach.dev/cookbooks/ocr-page@v1.json",
  inputs: {
    pdf: "/workspace/book.pdf",
    page: 6,
  },
});
```

## Cookbook Responsibilities

A cookbook should define:

- runtime assumptions
- image assumptions
- setup steps
- execution steps
- output contract

It should not define:

- product UI
- cross-service orchestration
- arbitrary long-lived daemon behavior

## Proposed Cookbook Schema

The first version should stay narrow and explicit.

```json
{
  "name": "ocr-page",
  "version": "1",
  "image": "ubuntu:24.04",
  "inputs": {
    "pdf": { "type": "file", "required": true },
    "page": { "type": "number", "required": true },
    "language": { "type": "string", "default": "eng" }
  },
  "steps": [
    {
      "type": "apt.install",
      "packages": [
        "tesseract-ocr",
        "tesseract-ocr-eng",
        "poppler-utils",
        "python3-minimal"
      ]
    },
    {
      "type": "write_file",
      "path": "/usr/local/bin/ocr-page",
      "contentRef": "embedded:ocr-page.sh",
      "mode": "0755"
    },
    {
      "type": "exec",
      "command": "ocr-page --input {{inputs.pdf}} --page {{inputs.page}} --language {{inputs.language}} --output /workspace/out/result.json"
    }
  ],
  "outputs": {
    "result": "/workspace/out/result.json"
  }
}
```

## Step Types

The first pass should support only a small set of step types:

- `apt.install`
- `exec`
- `write_file`
- `download`
- `export_artifact`

This keeps the runner deterministic and easier to secure.

If a cookbook cannot be expressed with a few step types, that is a signal that it may need a dedicated image or a different abstraction.

## Trust Model

The runner should support multiple cookbook sources, but not all should be treated equally.

Trust tiers:

1. Embedded first-party cookbooks
2. First-party hosted cookbooks
3. Explicitly approved external cookbooks

The default behavior should bias toward first-party cookbooks.

Remote cookbook execution should not become "run arbitrary shell from the internet."

## Runtime Portability

The same cookbook model should work across:

- local Apple container runtime
- Daytona
- E2B
- other future Fabric runtimes

The runtime adapter may differ, but the cookbook contract should stay stable.

That is one of the main reasons to keep this work inside Fabric rather than building a disconnected local-only utility.

## Caching

The runner should eventually support two kinds of caching:

1. Image-level caching
   - if a base image or baked image is already present, reuse it

2. Cookbook-level caching
   - if a cookbook installs the same package set repeatedly, allow reuse through:
   - layered images
   - cached snapshots
   - provider-specific substrate reuse

The first version does not need to solve this fully, but the design should leave room for it.

## Relationship to Baked Images

Cookbooks and baked images are complementary.

Recommended lifecycle:

1. Prototype with a cookbook on a generic image
2. Measure startup cost and reliability
3. Promote stable high-value workflows into dedicated images

That means a cookbook can be both:

- the learning path
- the portability layer

while a baked image becomes:

- the optimization path

## OCR Example

OCR is a good first runner workload because it is:

- task-oriented
- bounded
- easy to benchmark
- useful locally
- portable to remote runtimes later

An OCR cookbook can:

1. install OCR dependencies
2. rasterize one PDF page
3. run OCR
4. emit JSON

And later the same workflow can move to:

- a baked Fabric OCR image
- a remote runtime
- or both

without changing the product-facing task contract much.

## CLI Direction

Possible CLI shapes:

```sh
fabric runner run --cookbook ocr-page --input pdf=/path/book.pdf --input page=6
```

## v0 Runner API

The first concrete surface should stay very small:

- `GET /health`
- `GET /capabilities`
- `POST /jobs`
- `GET /jobs/:id`

Default local address:

- `http://127.0.0.1:52157`

Runtime discovery file:

- `~/.fabric-runner/state/runtime.json`

### Supported job types

Initial task set:

- `ocr.page`

Request:

```json
{
  "type": "ocr.page",
  "input": {
    "pdfPath": "/absolute/path/to/file.pdf",
    "page": 7,
    "language": "eng"
  }
}
```

Capabilities should report:

- service name and version
- task list
- container availability
- OCR image availability
- supported OCR languages

This keeps the first end-to-end flow focused on one real workload while leaving
the cookbook layer behind the task interface.

or:

```sh
fabric task run ocr-page --pdf /path/book.pdf --page 6
```

The naming matters less than the behavior:

- small surface area
- cookbook-driven
- stable outputs

## Recommended First Milestone

The first milestone should not implement the entire runner system.

It should:

1. define the cookbook schema
2. implement one executor for local Apple containers
3. support one real cookbook: OCR page extraction
4. emit structured JSON outputs

That is enough to validate whether the runner concept is useful before broadening scope.

## Exit Criteria

This direction is successful if:

1. a downstream product can ask Fabric to perform OCR without caring about setup details
2. the same cookbook shape can plausibly target local and remote runtimes
3. the runner remains narrower than the full sandbox abstraction
