#!/bin/bash

# ============================================
# 🐧 LINUX POST-INSTALLATION SCRIPT
# ============================================
# Registers reysilvaGen with the Linux system
# Platform: Debian, Ubuntu, Fedora, RHEL, etc.
# Package Types: DEB, RPM
# ============================================

echo "🐧 Linux Post-Installation Starting..."
echo "============================================"

# ============================================
# Desktop Environment Integration
# ============================================

# Update desktop database (GNOME, KDE, XFCE, etc.)
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database /usr/share/applications 2>/dev/null || true
fi

# Update mime database
if command -v update-mime-database &> /dev/null; then
    update-mime-database /usr/share/mime 2>/dev/null || true
fi

# Update icon cache
if command -v gtk-update-icon-cache &> /dev/null; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true
fi

# ============================================
# Command Line Integration
# ============================================

# Create symlink for command line access
if [ ! -L /usr/local/bin/reysilvaGen ]; then
    ln -sf /opt/reysilvaGen/reysilvagen /usr/local/bin/reysilvaGen 2>/dev/null || true
    echo "✅ Command line tool linked: reysilvaGen"
fi

# ============================================
# Completion Message
# ============================================

echo ""
echo "============================================"
echo "✅ reysilvaGen installed successfully!"
echo "============================================"
echo ""
echo "📍 Launch Options:"
echo "  • Applications menu (GNOME/KDE/XFCE)"
echo "  • Command line: reysilvaGen"
echo "  • Desktop search"
echo ""
echo "📁 Install Location: /opt/reysilvaGen"
echo "🔗 Binary Symlink: /usr/local/bin/reysilvaGen"
echo ""
echo "============================================"

exit 0

