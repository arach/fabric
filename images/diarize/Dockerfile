FROM python:3.12-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
  libgomp1 \
  libsndfile1 \
  ffmpeg \
  && rm -rf /var/lib/apt/lists/*

# pyannote 3.3.x internally uses use_auth_token= which was removed in huggingface_hub 0.25+.
# Pin to the last compatible set. These versions are frozen in the image — no drift.
RUN pip install --no-cache-dir \
  "pyannote.audio==3.3.2" \
  "huggingface_hub==0.24.7" \
  "torch==2.5.1" \
  "torchaudio==2.5.1" \
  soundfile \
  matplotlib

# Pre-download model weights at build time so no HF token needed at runtime.
# Requires --build-arg HF_TOKEN=hf_... during build (one-time).
COPY images/diarize/cache_model.py /tmp/cache_model.py
ARG HF_TOKEN
RUN HF_TOKEN=${HF_TOKEN} python3 /tmp/cache_model.py && rm /tmp/cache_model.py

COPY images/diarize/diarize.py /usr/local/bin/diarize
RUN chmod +x /usr/local/bin/diarize

WORKDIR /workspace
CMD ["/bin/bash"]
