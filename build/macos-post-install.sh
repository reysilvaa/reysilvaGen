#!/bin/bash

# ============================================
# 🍎 macOS POST-INSTALLATION SCRIPT
# ============================================
# Registers reysilvaGen with macOS system
# Platform: macOS 10.13+ (High Sierra and later)
# Compatible: Intel x64 & Apple Silicon (M1/M2/M3)
# ============================================

echo "🍎 macOS Post-Installation Starting..."
echo "============================================"

APP_NAME="reysilvaGen.app"
APP_PATH="/Applications/$APP_NAME"

# ============================================
# Application Verification
# ============================================

if [ -d "$APP_PATH" ]; then
    echo "✅ App bundle found: $APP_PATH"
    
    # ============================================
    # macOS System Integration
    # ============================================
    
    # Register with Launch Services (makes app searchable in Spotlight)
    echo "🔍 Registering with Launch Services..."
    /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister -f "$APP_PATH"
    
    # Refresh Spotlight index
    echo "💡 Updating Spotlight index..."
    mdimport "$APP_PATH" 2>/dev/null || true
    
    # Set proper permissions
    echo "🔐 Setting permissions..."
    chmod -R 755 "$APP_PATH"
    
    # ============================================
    # Command Line Integration
    # ============================================
    
    BINARY_PATH="$APP_PATH/Contents/MacOS/reysilvaGen"
    SYMLINK_PATH="/usr/local/bin/reysilvaGen"
    
    if [ -f "$BINARY_PATH" ] && [ ! -L "$SYMLINK_PATH" ]; then
        echo "🔗 Creating command line symlink..."
        mkdir -p /usr/local/bin
        ln -sf "$BINARY_PATH" "$SYMLINK_PATH" 2>/dev/null || true
        echo "✅ Command line tool linked"
    fi
    
    # ============================================
    # Success Message
    # ============================================
    
    echo ""
    echo "============================================"
    echo "🎉 Installation Complete!"
    echo "============================================"
    echo ""
    echo "📍 Launch Options:"
    echo "  • Launchpad"
    echo "  • Spotlight (⌘+Space, type 'reysilvaGen')"
    echo "  • Applications folder"
    echo "  • Terminal: reysilvaGen"
    echo ""
    echo "📁 Install Location: /Applications/reysilvaGen.app"
    echo "🔗 CLI Symlink: /usr/local/bin/reysilvaGen"
    echo ""
    echo "============================================"
    echo "⚠️  First Launch Security Warning"
    echo "============================================"
    echo ""
    echo "If you see this warning:"
    echo '  "reysilvaGen cannot be opened because the'
    echo '   developer cannot be verified"'
    echo ""
    echo "Follow these steps (ONE TIME ONLY):"
    echo "  1. Right-click 'reysilvaGen.app' in Applications"
    echo "  2. Select 'Open' from menu"
    echo "  3. Click 'Open' button in dialog"
    echo ""
    echo "Alternative method:"
    echo "  System Preferences → Security & Privacy"
    echo "  → Click 'Open Anyway'"
    echo ""
    echo "This is normal for unsigned applications."
    echo "============================================"
else
    echo "❌ Installation failed: App not found in /Applications"
    exit 1
fi

exit 0

