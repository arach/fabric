#!/bin/bash
#
# Run a command in a Fabric container
#
# Usage:
#   ./run-container.sh "echo hello"
#   ./run-container.sh --image oven/bun:latest "bun --version"
#
# Requirements:
#   - Must be run from a terminal (not subprocess)
#   - Kernel must be available at packages/runtime-local/bin/vmlinux
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FABRIC_CONTAINER="$PROJECT_ROOT/packages/runtime-local/FabricContainer/.build/release/fabric-container"

# Check binary exists
if [ ! -f "$FABRIC_CONTAINER" ]; then
    echo "Error: fabric-container not found at $FABRIC_CONTAINER"
    echo "Build it first: cd packages/runtime-local/FabricContainer && swift build -c release"
    exit 1
fi

# Check kernel exists
KERNEL="$PROJECT_ROOT/packages/runtime-local/FabricContainer/bin/vmlinux"
if [ ! -f "$KERNEL" ]; then
    KERNEL="$PROJECT_ROOT/packages/runtime-local/bin/vmlinux"
fi
if [ ! -f "$KERNEL" ]; then
    echo "Error: Linux kernel not found"
    echo "Expected at: $PROJECT_ROOT/packages/runtime-local/bin/vmlinux"
    exit 1
fi

# Parse args
IMAGE="alpine:latest"
CMD=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --image|-i)
            IMAGE="$2"
            shift 2
            ;;
        *)
            CMD="$1"
            shift
            ;;
    esac
done

if [ -z "$CMD" ]; then
    echo "Usage: $0 [--image IMAGE] COMMAND"
    echo ""
    echo "Examples:"
    echo "  $0 'echo hello'"
    echo "  $0 --image oven/bun:latest 'bun --version'"
    exit 1
fi

echo "Running in container..."
echo "  Image: $IMAGE"
echo "  Command: $CMD"
echo ""

exec "$FABRIC_CONTAINER" run --kernel "$KERNEL" --image "$IMAGE" --cmd "$CMD"
