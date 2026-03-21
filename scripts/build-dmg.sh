#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$SCRIPT_DIR/.."
APP_DIR="$ROOT/app"
BUILD_DIR="$ROOT/dist"
APP_NAME="fabrun.app"
DMG_NAME="FabricRunner.dmg"
BUNDLE="$BUILD_DIR/$APP_NAME"
VERSION="0.2.0"

# Signing
SIGN_IDENTITY="Developer ID Application: Arach Tchoupani (2U83JFPW66)"
TEAM_ID="2U83JFPW66"
NOTARY_PROFILE="notarytool"

echo "==> Building release binary..."
cd "$APP_DIR"
swift build -c release 2>&1 | tail -3

BIN_PATH=$(swift build -c release --show-bin-path 2>/dev/null)
echo "    Binary at $BIN_PATH/Fabric"

echo "==> Creating app bundle..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUNDLE/Contents/MacOS"
mkdir -p "$BUNDLE/Contents/Resources"

# Copy binary
cp "$BIN_PATH/Fabric" "$BUNDLE/Contents/MacOS/Fabric"

# Copy bundled resources from SPM build if they exist
RESOURCES="$BIN_PATH/Fabric_Fabric.bundle"
if [ -d "$RESOURCES" ]; then
    cp -R "$RESOURCES" "$BUNDLE/Contents/Resources/"
fi

# Generate .icns from iconset if available
ICNS="$APP_DIR/Fabric/Assets.xcassets/AppIcon.appiconset"
if [ -d "$ICNS" ] && ls "$ICNS"/icon_*.png >/dev/null 2>&1; then
    ICONSET_DIR=$(mktemp -d)/AppIcon.iconset
    mkdir -p "$ICONSET_DIR"
    cp "$ICNS"/icon_*.png "$ICONSET_DIR/"
    iconutil -c icns "$ICONSET_DIR" -o "$BUNDLE/Contents/Resources/AppIcon.icns" 2>/dev/null || true
fi

# Entitlements
cat > "$BUILD_DIR/Fabric.entitlements" << 'ENT'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.network.server</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
ENT

# Info.plist
cat > "$BUNDLE/Contents/Info.plist" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>fabrun</string>
    <key>CFBundleDisplayName</key>
    <string>fabrun</string>
    <key>CFBundleIdentifier</key>
    <string>run.fab.app</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleExecutable</key>
    <string>Fabric</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>LSUIElement</key>
    <false/>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>run.fab.app.url</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>fab</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
PLIST

echo "==> App bundle created at $BUNDLE"

# ── Codesign ──────────────────────────────────────────
echo "==> Signing..."

codesign --force --options runtime --timestamp \
    --entitlements "$BUILD_DIR/Fabric.entitlements" \
    --sign "$SIGN_IDENTITY" \
    "$BUNDLE"

echo "    Signed Fabric Runner.app"

codesign --verify --deep --strict --verbose=2 "$BUNDLE" 2>&1 | tail -3

# ── Create DMG ────────────────────────────────────────
echo "==> Creating DMG..."
DMG_STAGING=$(mktemp -d)
cp -R "$BUNDLE" "$DMG_STAGING/"
ln -s /Applications "$DMG_STAGING/Applications"

hdiutil create \
    -volname "fabrun" \
    -srcfolder "$DMG_STAGING" \
    -ov \
    -format UDZO \
    "$BUILD_DIR/$DMG_NAME"

rm -rf "$DMG_STAGING"

# Sign the DMG
codesign --force --timestamp \
    --sign "$SIGN_IDENTITY" \
    "$BUILD_DIR/$DMG_NAME"

echo "    Signed $DMG_NAME"

# ── Notarize ──────────────────────────────────────────
echo "==> Submitting for notarization..."
xcrun notarytool submit "$BUILD_DIR/$DMG_NAME" \
    --keychain-profile "$NOTARY_PROFILE" \
    --wait

echo "==> Stapling notarization ticket..."
xcrun stapler staple "$BUILD_DIR/$DMG_NAME"

# ── Done ──────────────────────────────────────────────
echo ""
echo "==> Done: $BUILD_DIR/$DMG_NAME"
ls -lh "$BUILD_DIR/$DMG_NAME"
spctl --assess --type open --context context:primary-signature -v "$BUILD_DIR/$DMG_NAME" 2>&1 || true
