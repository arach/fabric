#!/usr/bin/env python3
"""Speaker diarization using pyannote.audio.

Usage:
  diarize <audio_file> [--token TOKEN] [--output FILE] [--model MODEL]

Outputs JSON with speaker-labeled segments:
  [{"start": 4.0, "end": 5.5, "speaker": "SPEAKER_00"}, ...]
"""

import argparse
import json
import os
import sys


def main():
    parser = argparse.ArgumentParser(description="Speaker diarization")
    parser.add_argument("audio", help="Path to audio file (wav, mp3, etc.)")
    parser.add_argument("--token", default=os.environ.get("HF_TOKEN", ""),
                        help="HuggingFace token (or set HF_TOKEN env var)")
    parser.add_argument("--output", "-o", default=None,
                        help="Output JSON file (default: <audio>.diarization.json)")
    parser.add_argument("--model", default="pyannote/speaker-diarization-3.1",
                        help="Pyannote pipeline model")
    args = parser.parse_args()

    # If token provided, log in globally so pyannote picks it up.
    # When model is baked into the image, no token is needed.
    if args.token:
        from huggingface_hub import login
        login(token=args.token)

    from pyannote.audio import Pipeline

    print(f"Loading {args.model}...", file=sys.stderr)
    pipeline = Pipeline.from_pretrained(args.model)

    print(f"Diarizing {args.audio}...", file=sys.stderr)
    result = pipeline(args.audio)

    # Handle both old and new pyannote API
    annotation = getattr(result, "speaker_diarization", result)

    segments = []
    for turn, _, speaker in annotation.itertracks(yield_label=True):
        segments.append({
            "start": round(turn.start, 2),
            "end": round(turn.end, 2),
            "speaker": speaker,
        })

    output_path = args.output or args.audio.rsplit(".", 1)[0] + ".diarization.json"
    with open(output_path, "w") as f:
        json.dump(segments, f, indent=2)

    # Also print to stdout
    speakers = set(s["speaker"] for s in segments)
    print(f"\n{len(segments)} segments, {len(speakers)} speakers: {speakers}", file=sys.stderr)
    for s in segments:
        print(f"[{s['start']:.1f}s - {s['end']:.1f}s] {s['speaker']}")

    print(f"\nSaved to {output_path}", file=sys.stderr)


if __name__ == "__main__":
    main()
