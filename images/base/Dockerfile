FROM alpine:3.23

RUN apk add --no-cache \
  bash \
  git \
  curl \
  openssh-client \
  jq \
  tar \
  gzip \
  ca-certificates \
  && git config --system init.defaultBranch main

ENV LANG=C.UTF-8
SHELL ["/bin/bash", "-c"]
WORKDIR /workspace
CMD ["/bin/bash"]
