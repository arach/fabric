---
title: OCR Benchmark Results
description: Initial benchmark results for recipe and baked-image OCR on Fabric.
order: 12
---

# OCR Benchmark Results

## Environment

- runtime: local Apple container runtime
- architecture: `linux/arm64`
- baked image: `fabric-ocr:local`

## Image Size

Current baked OCR image:

- `fabric-ocr:local`
- size: `84,828,884` bytes
- approximately `84.8 MB`

The base Ubuntu image used during the build resolved to roughly `28.9 MB` of downloaded layers before OCR packages were added.

## Benchmark 1: Attention Is All You Need

Input:

- PDF: `attention-is-all-you-need.pdf`
- page: `1`

Results:

- recipe path
  - setup: `12,260 ms`
  - cold: `17,667 ms`
  - warm: `4,622 ms`
  - extracted text chars: `2,872`

- baked image path
  - cold: `3,459 ms`
  - warm: `3,984 ms`
  - extracted text chars: `2,872`

Observation:

- the baked image materially improves first-run latency
- warm OCR is in the same general range for both paths
- OCR on a text-native PDF works, though it is not the ideal extraction path for such documents

## Benchmark 2: Book of Verses

### Page 6

Input:

- PDF: `book-of-verses.pdf`
- page: `6`

Results:

- recipe path
  - setup: `12,732 ms`
  - cold: `14,156 ms`
  - warm: `1,525 ms`
  - extracted text chars: `0`

- baked image path
  - cold: `1,289 ms`
  - warm: `1,077 ms`
  - extracted text chars: `0`

Observation:

- page 6 appears visually blank or near-blank
- zero OCR text is consistent with the document content, not necessarily a runtime failure

### Page 7

Input:

- PDF: `book-of-verses.pdf`
- page: `7`

Results:

- recipe path
  - setup: `10,390 ms`
  - cold: `11,611 ms`
  - warm: `1,212 ms`
  - extracted text chars: `16`
  - preview: `A BOOK OF VERSES`

- baked image path
  - cold: `1,285 ms`
  - warm: `1,234 ms`
  - extracted text chars: `16`
  - preview: `A BOOK OF VERSES`

Observation:

- the OCR command works on a scan-heavy document
- baked image cold-start remains much better than the recipe path
- once the package environment exists, warm OCR on a single scanned page is fast

## Initial Conclusion

The current data supports this strategy:

1. keep the cookbook path as the learning and portability layer
2. use a baked OCR image as the preferred optimized local path

The baked image is small enough to remain tractable and provides a clear cold-start improvement over on-demand package installation.

