---
title: OCR Image Evaluation
description: Evaluate recipe-based and image-based OCR runtimes for Fabric.
order: 9
---

# OCR Image Evaluation

## Goal

Determine the best way for Fabric to support OCR workloads for scanned PDFs and page images with minimal operational friction.

The decision is between:

1. Clean base image plus install recipe
2. Fully baked first-party OCR image
3. Third-party OCR image

The target outcome is not just "OCR works." The target outcome is a reliable Fabric runtime shape that can be invoked as a small local compute primitive from another product such as Linea.

## Context

Fabric already supports local execution through Apple's `container` CLI and arbitrary OCI images. That gives us two viable implementation paths:

- start from a known base image such as `ubuntu:24.04` and install OCR tools at runtime
- publish a dedicated OCR image and run that image directly

There is also a possible shortcut:

- find an existing OCR-ready image and run it through Fabric

The unresolved tension is:

- cookbook path reduces image ownership but increases cold-start work and runtime variability
- baked image improves reproducibility and startup behavior but adds image build, storage, and download concerns

## Primary Questions

1. What is the cold-start cost of a clean image plus OCR install recipe?
2. What is the real size and pull-time cost of a baked OCR image?
3. Does a third-party image save meaningful time, or does it just move the complexity elsewhere?
4. Which path is the most reliable on Fabric's local Apple container runtime?
5. Which path keeps the future API surface simplest for products that want OCR as a small command-oriented dependency?

## Non-Goals

- Designing the full product UX for OCR in Linea
- Building OCR into VoxD
- Solving cloud OCR pricing
- Implementing full document-layout reconstruction

## Proposed OCR Workload

The evaluation should use one narrow, representative job:

- input: PDF file and page number
- runtime work:
  1. rasterize the target page to an image
  2. run OCR on that image
  3. return extracted text and basic metadata
- output:
  - `text`
  - `pageNumber`
  - `engine`
  - `durationMs`
  - optional `confidence`

This keeps the experiment focused on runtime packaging rather than on higher-level document semantics.

## Candidate Strategies

## 1. Clean Image Plus Recipe

Start from a known base image, likely Ubuntu.

Example package set:

- `tesseract-ocr`
- `tesseract-ocr-eng`
- `poppler-utils`
- `ghostscript` if required
- `imagemagick` only if preprocessing proves necessary

Advantages:

- smallest owned image surface
- easiest to tweak while learning
- no registry publishing requirement for the first experiment

Risks:

- slower first run
- apt mirror/network fragility
- more moving parts at runtime
- weaker reproducibility

## 2. First-Party Baked OCR Image

Create and publish a Fabric-maintained OCR image, for example:

- `ghcr.io/arach/fabric-ocr:<tag>`

Advantages:

- predictable runtime environment
- faster startup after pull
- easier operational story for downstream products
- simplest long-term behavior if the package set stabilizes

Risks:

- image size
- first-pull latency
- image maintenance burden
- image build/release workflow required

## 3. Third-Party OCR Image

Use an existing OCI image that already contains OCR tooling.

Advantages:

- fastest path to a proof of concept

Risks:

- unclear maintenance quality
- unknown arm64 behavior
- unclear package contents
- less control over updates and reproducibility

This can be used as a benchmark or temporary shortcut, but it should not be the default product path unless it proves unusually strong.

## Evaluation Matrix

Each candidate should be scored on:

1. Cold start
   - time from no local image cache to first successful OCR result

2. Warm start
   - time from job submission to OCR result when image and packages are already available

3. Setup reliability
   - success rate across repeated runs
   - susceptibility to package mirror failures

4. Runtime simplicity
   - number of steps required per OCR job
   - amount of bootstrapping logic in Fabric

5. Distribution weight
   - compressed image size
   - first-pull burden

6. Reproducibility
   - whether the environment behaves identically across machines

7. Apple container compatibility
   - works cleanly on Apple Silicon through Fabric's local runtime

8. Future portability
   - can be built or pulled cleanly on Linux CI or other OCI-compatible environments

## Minimum Test Matrix

At minimum, test:

1. Recipe on Ubuntu
2. Baked first-party OCR image based on Ubuntu
3. One third-party OCR image if a credible arm64 candidate exists

If time is limited, the first two are mandatory and the third is optional.

## Test Inputs

Use both:

1. Text-native control PDF
   - `Attention Is All You Need`
   - expected result: OCR is unnecessary but still produces readable text if forced

2. Scan-heavy PDF
   - `Book of Verses`
   - expected result: OCR is required for meaningful text extraction

For the scanned PDF, test a small page subset first, such as:

- early page
- middle page
- page with dense verse layout

## Suggested Command Shape

The experiment should standardize on one command contract, regardless of packaging strategy.

Example:

```sh
ocr-page --input /workspace/book.pdf --page 6 --output /workspace/out.json
```

Expected JSON shape:

```json
{
  "pageNumber": 6,
  "engine": "tesseract",
  "durationMs": 1840,
  "text": "..."
}
```

This keeps the downstream Fabric API stable even if the packaging strategy changes.

## Fabric Integration Target

The preferred long-term Fabric shape is:

- a small OCR-oriented command contract
- backed by either a recipe or a baked image
- invokable from Fabric without downstream products caring how OCR tooling is provisioned

That means the experiment should avoid over-coupling the caller to package-manager details.

The caller should eventually be able to express something equivalent to:

```ts
const sandbox = await localSandboxFactory.create({ image: "fabric-ocr" })
const result = await sandbox.exec("ocr-page --input /workspace/book.pdf --page 6 --output /workspace/out.json")
```

or the same command on a generic image after running a setup recipe.

## Recommendation Bias

The expected best path is:

1. learn with a recipe
2. freeze the known-good package set into a baked first-party image

This gives the team real data before paying the maintenance cost of a dedicated image, while still steering toward the more reproducible long-term solution.

The third-party image path should be treated as a benchmark, not as the default architecture.

## Deliverables

The evaluation should produce:

1. Measured cold-start and warm-start timings for each candidate
2. Approximate image or install footprint
3. Notes on arm64 and Apple container compatibility
4. Failure cases encountered during setup or runtime
5. A final recommendation:
   - recipe first
   - baked image first
   - or third-party image if it unexpectedly dominates

## Exit Criteria

The experiment is complete when we can answer, with data:

1. Whether a baked OCR image is justified
2. Whether a recipe-based setup is operationally acceptable
3. Whether Fabric should add a first-party OCR image under `images/ocr`

