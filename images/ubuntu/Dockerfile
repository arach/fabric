FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
  bash \
  git \
  curl \
  wget \
  openssh-client \
  jq \
  ca-certificates \
  build-essential \
  sudo \
  unzip \
  && rm -rf /var/lib/apt/lists/* \
  && git config --system init.defaultBranch main

ENV LANG=C.UTF-8
WORKDIR /workspace
CMD ["/bin/bash"]
