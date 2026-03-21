#!/bin/bash
set -euo pipefail

RUNNER_HOME="${FABRIC_RUNNER_HOME:-$HOME/.fabric-runner}"

blue='\033[0;34m'
green='\033[0;32m'
yellow='\033[1;33m'
red='\033[0;31m'
dim='\033[2m'
nc='\033[0m'

info() { echo -e "${blue}=>${nc} $1"; }
ok() { echo -e "${green}✓${nc}  $1"; }
warn() { echo -e "${yellow}!${nc}  $1"; }
fail() { echo -e "${red}✗${nc}  $1"; exit 1; }
note() { echo -e "${dim}$1${nc}"; }

has() { command -v "$1" >/dev/null 2>&1; }

info "Fabric Runner bootstrap"

if [[ "$(uname -s)" != "Darwin" ]]; then
  fail "Fabric Runner currently requires macOS."
fi

if [[ "$(uname -m)" != "arm64" ]]; then
  fail "Fabric Runner currently requires Apple Silicon."
fi

if has sw_vers; then
  PRODUCT_VERSION="$(sw_vers -productVersion)"
  info "Detected macOS ${PRODUCT_VERSION}"
fi

if has container; then
  ok "Apple container CLI found"
else
  if has brew; then
    info "Installing Apple container CLI with Homebrew"
    brew install container
    ok "Apple container CLI installed"
  else
    fail "Apple container CLI is missing and Homebrew is unavailable. Install 'container' first, then rerun this script."
  fi
fi

info "Starting container system"
container system start >/dev/null
ok "Container system ready"

if container builder status >/dev/null 2>&1; then
  ok "Container builder ready"
else
  info "Starting container builder"
  container builder start >/dev/null
  ok "Container builder started"
fi

mkdir -p "$RUNNER_HOME"/{config,cache,logs,state}
ok "Runner home prepared at $RUNNER_HOME"

if ! container image list >/dev/null 2>&1; then
  warn "Unable to list local images yet; substrate may still be warming up"
fi

echo ""
ok "Fabric Runner bootstrap complete"
note "This path prepares the local container substrate only."
note "Cookbooks and runtime tasks can now build on top of this state."
