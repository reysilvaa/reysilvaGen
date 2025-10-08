#!/bin/bash

# Post-installation script for Linux
# Registers the application with the system

# Update desktop database
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

# Create symlink for command line access (optional)
if [ ! -L /usr/local/bin/reysilvaGen ]; then
    ln -sf /opt/reysilvaGen/reysilvagen /usr/local/bin/reysilvaGen 2>/dev/null || true
fi

echo "reysilvaGen installed successfully!"
echo "Launch from Applications menu or run: reysilvaGen"

exit 0

