#!/bin/bash
set -e

#
# Fabric Development Setup
#
# Sets up everything needed to develop and run Fabric from source,
# including the local container runtime (Apple Virtualization.framework).
#
# Usage: ./scripts/setup.sh
#
# What it does:
#   1. Installs Node/Bun dependencies
#   2. Installs the Apple container CLI (via Homebrew)
#   3. Downloads the recommended Linux kernel
#   4. Builds the Swift container binary (FabricContainer)
#   5. Symlinks the kernel so fabric-container can find it
#   6. Verifies everything works
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FABRIC_CONTAINER_DIR="$PROJECT_ROOT/packages/runtime-local/FabricContainer"
FABRIC_CONTAINER_BIN="$FABRIC_CONTAINER_DIR/.build/release/fabric-container"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
DIM='\033[2m'
NC='\033[0m'

info()    { echo -e "${BLUE}=>${NC} $1"; }
success() { echo -e "${GREEN}✓${NC}  $1"; }
warn()    { echo -e "${YELLOW}!${NC}  $1"; }
fail()    { echo -e "${RED}✗${NC}  $1"; exit 1; }
skip()    { echo -e "${DIM}–  $1 (already done)${NC}"; }

has() { command -v "$1" >/dev/null 2>&1; }

echo ""
echo -e "${BLUE}Fabric${NC} development setup"
echo ""

# ── Prerequisites ────────────────────────────────────────────────────────

if [[ "$(uname -s)" != "Darwin" ]]; then
    fail "Local container runtime requires macOS. Cloud runtimes (Daytona, E2B, exe.dev) work on any platform."
fi

if [[ "$(uname -m)" != "arm64" ]]; then
    fail "Apple Containerization framework requires Apple Silicon (arm64)."
fi

if ! has brew; then
    fail "Homebrew is required. Install from https://brew.sh"
fi

if ! has bun; then
    info "Installing Bun..."
    brew install oven-sh/bun/bun
    success "Bun installed"
fi

# ── Step 1: Dependencies ────────────────────────────────────────────────

info "Installing dependencies..."
cd "$PROJECT_ROOT"
bun install
success "Dependencies installed"

# ── Step 2: Apple container CLI ─────────────────────────────────────────

if has container; then
    skip "Apple container CLI"
else
    info "Installing Apple container CLI..."
    brew install container
    success "Apple container CLI installed"
fi

# ── Step 3: Linux kernel ────────────────────────────────────────────────

KERNEL_DIR="$HOME/Library/Application Support/com.apple.container/kernels"
if ls "$KERNEL_DIR"/vmlinux-* >/dev/null 2>&1; then
    skip "Linux kernel"
else
    info "Downloading Linux kernel (this takes a moment)..."
    container system kernel set --recommended
    success "Linux kernel downloaded"
fi

# Find the kernel path
KERNEL_PATH=$(ls -1 "$KERNEL_DIR"/vmlinux-* 2>/dev/null | head -1)
if [ -z "$KERNEL_PATH" ]; then
    fail "Kernel download succeeded but file not found at $KERNEL_DIR"
fi

# ── Step 4: Build Swift binary ──────────────────────────────────────────

if [ -f "$FABRIC_CONTAINER_BIN" ]; then
    skip "FabricContainer Swift binary"
else
    info "Building FabricContainer (this takes a few minutes on first build)..."
    cd "$FABRIC_CONTAINER_DIR"
    swift build -c release 2>&1 | tail -1
    cd "$PROJECT_ROOT"
    success "FabricContainer built"
fi

# ── Step 5: Symlink kernel ──────────────────────────────────────────────

# fabric-container looks for vmlinux next to itself and in bin/
BINARY_DIR=$(dirname "$(readlink -f "$FABRIC_CONTAINER_BIN" 2>/dev/null || echo "$FABRIC_CONTAINER_DIR/.build/arm64-apple-macosx/release/fabric-container")")
KERNEL_BIN_DIR="$PROJECT_ROOT/packages/runtime-local/bin"

mkdir -p "$KERNEL_BIN_DIR"

# Symlink to both locations fabric-container searches
for dest in "$BINARY_DIR/vmlinux" "$KERNEL_BIN_DIR/vmlinux"; do
    if [ ! -e "$dest" ]; then
        ln -sf "$KERNEL_PATH" "$dest"
    fi
done

success "Kernel linked"

# ── Step 6: Verify ──────────────────────────────────────────────────────

echo ""
info "Verifying setup..."

# Check fabric-container status
STATUS=$("$FABRIC_CONTAINER_BIN" status 2>&1)
KERNEL_EXISTS=$(echo "$STATUS" | grep -o '"kernelExists" : true' || true)

if [ -z "$KERNEL_EXISTS" ]; then
    warn "fabric-container can't find kernel. Status: $STATUS"
else
    success "fabric-container binary OK (kernel found)"
fi

# Test with Apple container CLI
info "Running test container..."
OUTPUT=$(container run --rm alpine:latest echo "hello from fabric" 2>&1) || true

if echo "$OUTPUT" | grep -q "hello from fabric"; then
    success "Container test passed"
else
    warn "Container test failed: $OUTPUT"
    echo ""
    echo -e "  ${DIM}Try: container system start${NC}"
    echo -e "  ${DIM}Then re-run: ./scripts/setup.sh${NC}"
fi

# ── Done ─────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "  Run tests:          bun test"
echo "  Run dev server:     bun run dev"
echo "  Test a container:   container run --rm alpine:latest echo hello"
echo ""
echo "  Cloud providers need API keys:"
echo "    export DAYTONA_API_KEY=...     # from app.daytona.io"
echo "    export E2B_API_KEY=...         # from e2b.dev/dashboard"
echo "    ssh exe.dev                    # registers SSH key"
echo ""
