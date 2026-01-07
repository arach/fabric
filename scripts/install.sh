#!/bin/bash
set -e

# Fabric CLI Installer
# Usage: curl -fsSL https://fabric.arach.dev/install.sh | bash

VERSION="latest"
INSTALL_DIR="/usr/local/bin"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_banner() {
    echo ""
    echo -e "${BLUE}╭─────────────────────────────────────╮${NC}"
    echo -e "${BLUE}│${NC}         ${GREEN}Fabric CLI Installer${NC}         ${BLUE}│${NC}"
    echo -e "${BLUE}│${NC}   Ambient compute for AI agents    ${BLUE}│${NC}"
    echo -e "${BLUE}╰─────────────────────────────────────╯${NC}"
    echo ""
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="macos";;
        MINGW*|MSYS*|CYGWIN*)    OS="windows";;
        *)          OS="unknown";;
    esac
    echo $OS
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64)   ARCH="x64";;
        arm64|aarch64)  ARCH="arm64";;
        *)              ARCH="unknown";;
    esac
    echo $ARCH
}

# Check if command exists
has_command() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node() {
    if has_command node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            success "Node.js v$(node -v | cut -d'v' -f2) found"
            return 0
        else
            warn "Node.js v$(node -v | cut -d'v' -f2) found, but v18+ recommended"
            return 0
        fi
    fi
    return 1
}

# Install Node.js
install_node() {
    info "Installing Node.js..."

    OS=$(detect_os)

    case $OS in
        macos)
            if has_command brew; then
                brew install node
            else
                error "Please install Homebrew first: https://brew.sh"
            fi
            ;;
        linux)
            if has_command apt-get; then
                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif has_command dnf; then
                sudo dnf install -y nodejs
            elif has_command yum; then
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo yum install -y nodejs
            else
                error "Unsupported Linux distribution. Please install Node.js manually."
            fi
            ;;
        *)
            error "Unsupported OS. Please install Node.js manually: https://nodejs.org"
            ;;
    esac

    success "Node.js installed"
}

# Install Fabric CLI
install_fabric() {
    info "Installing Fabric CLI..."

    # Determine package manager
    if has_command pnpm; then
        PKG_MANAGER="pnpm"
    elif has_command bun; then
        PKG_MANAGER="bun"
    elif has_command yarn; then
        PKG_MANAGER="yarn"
    else
        PKG_MANAGER="npm"
    fi

    info "Using $PKG_MANAGER..."

    case $PKG_MANAGER in
        pnpm)
            pnpm add -g fabric-ai
            ;;
        bun)
            bun add -g fabric-ai
            ;;
        yarn)
            yarn global add fabric-ai
            ;;
        npm)
            npm install -g fabric-ai
            ;;
    esac

    success "Fabric CLI installed"
}

# Verify installation
verify_installation() {
    if has_command fabric; then
        success "Fabric CLI is ready!"
        echo ""
        fabric --version
    else
        warn "Installation complete, but 'fabric' command not found in PATH"
        echo "  Try restarting your terminal or adding npm global bin to PATH"
    fi
}

# Print next steps
print_next_steps() {
    echo ""
    echo -e "${GREEN}Installation complete!${NC}"
    echo ""
    echo "Next steps:"
    echo ""
    echo "  1. Set up your API keys:"
    echo -e "     ${YELLOW}export DAYTONA_API_KEY=your_key${NC}"
    echo -e "     ${YELLOW}export ANTHROPIC_API_KEY=your_key${NC}"
    echo ""
    echo "  2. Create your first sandbox:"
    echo -e "     ${YELLOW}fabric create --provider daytona${NC}"
    echo ""
    echo "  3. Run code:"
    echo -e "     ${YELLOW}fabric exec 'echo Hello World'${NC}"
    echo ""
    echo "Documentation: https://fabric.arach.dev/docs"
    echo "GitHub: https://github.com/arach/fabric"
    echo ""
}

# Main
main() {
    print_banner

    OS=$(detect_os)
    ARCH=$(detect_arch)

    info "Detected: $OS ($ARCH)"

    # Check/install Node.js
    if ! check_node; then
        install_node
    fi

    # Install Fabric
    install_fabric

    # Verify
    verify_installation

    # Print next steps
    print_next_steps
}

main "$@"
