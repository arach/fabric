FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ENV LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
  bash \
  ca-certificates \
  poppler-utils \
  python3 \
  tesseract-ocr \
  tesseract-ocr-eng \
  && rm -rf /var/lib/apt/lists/*

COPY images/ocr/ocr-page.sh /usr/local/bin/ocr-page
RUN chmod +x /usr/local/bin/ocr-page

WORKDIR /workspace
CMD ["/bin/bash"]
