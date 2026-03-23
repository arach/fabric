#!/usr/bin/env python3
"""Download and cache the pyannote diarization model during image build."""
import os
import sys

token = os.environ.get("HF_TOKEN", "")
if not token:
    print("HF_TOKEN required to download model", file=sys.stderr)
    sys.exit(1)

# Set the token globally so pyannote picks it up automatically
# without needing to pass it as a kwarg (avoids API mismatch issues).
from huggingface_hub import login
login(token=token)

from pyannote.audio import Pipeline
p = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
print("Model cached successfully")
