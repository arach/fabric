#!/usr/bin/env bash
set -euo pipefail

INPUT=""
PAGE=""
OUTPUT=""
LANGUAGE="${OCR_LANGUAGE:-eng}"
DPI="${OCR_DPI:-300}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --input)
      INPUT="$2"
      shift 2
      ;;
    --page)
      PAGE="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --language)
      LANGUAGE="$2"
      shift 2
      ;;
    --dpi)
      DPI="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$INPUT" || -z "$PAGE" || -z "$OUTPUT" ]]; then
  echo "Usage: ocr-page --input FILE --page N --output FILE [--language eng] [--dpi 300]" >&2
  exit 1
fi

if [[ ! -f "$INPUT" ]]; then
  echo "Input file not found: $INPUT" >&2
  exit 1
fi

if ! command -v pdftoppm >/dev/null 2>&1; then
  echo "pdftoppm is required" >&2
  exit 1
fi

if ! command -v tesseract >/dev/null 2>&1; then
  echo "tesseract is required" >&2
  exit 1
fi

TMPDIR="$(mktemp -d)"
cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT

IMAGE_PREFIX="$TMPDIR/page"
pdftoppm -f "$PAGE" -l "$PAGE" -r "$DPI" -png "$INPUT" "$IMAGE_PREFIX" >/dev/null

IMAGE_PATH="$(find "$TMPDIR" -maxdepth 1 -type f -name 'page-*.png' | head -n 1)"
if [[ -z "$IMAGE_PATH" ]]; then
  echo "Failed to rasterize page $PAGE from $INPUT" >&2
  exit 1
fi

START_MS="$(python3 - <<'PY'
import time
print(int(time.time() * 1000))
PY
)"

TEXT_FILE="$TMPDIR/text.txt"
tesseract "$IMAGE_PATH" "$TMPDIR/text" -l "$LANGUAGE" >/dev/null 2>&1

END_MS="$(python3 - <<'PY'
import time
print(int(time.time() * 1000))
PY
)"

DURATION_MS="$((END_MS - START_MS))"

mkdir -p "$(dirname "$OUTPUT")"
python3 - "$OUTPUT" "$PAGE" "$LANGUAGE" "$DURATION_MS" "$TEXT_FILE" <<'PY'
import json
import sys

output_path, page, language, duration_ms, text_path = sys.argv[1:6]
with open(text_path, "r", encoding="utf-8") as f:
    text = f.read()

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(
        {
            "pageNumber": int(page),
            "engine": "tesseract",
            "language": language,
            "durationMs": int(duration_ms),
            "text": text.strip(),
        },
        f,
        ensure_ascii=False,
        indent=2,
    )
    f.write("\n")
PY

cat "$OUTPUT"
