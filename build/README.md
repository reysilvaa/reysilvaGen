# 🔨 Build Scripts & Configuration

This directory contains platform-specific build scripts and configuration files for packaging **reysilvaGen** across Windows, macOS, and Linux.

## 📁 Directory Structure

```
build/
├── windows-installer.nsh              # 🪟 Windows NSIS installer script
├── macos-entitlements.plist           # 🍎 macOS security entitlements
├── macos-entitlements-inherit.plist   # 🍎 macOS inherited entitlements
├── macos-post-install.sh              # 🍎 macOS post-installation script
├── linux-post-install.sh              # 🐧 Linux post-installation script
└── README.md                          # 📖 This file
```

---

## 🪟 Windows Configuration

### `windows-installer.nsh`
**Purpose:** Custom NSIS installer configuration for Windows integration

**Features:**
- ✅ Windows Search registration
- ✅ Start Menu integration
- ✅ Programs & Features registration
- ✅ App Paths registry (enables running from Win+R)
- ✅ Desktop & Start Menu shortcuts
- ✅ Proper uninstallation

**Used By:** `electron-builder` during NSIS installer creation

**Platform:** Windows 10/11

**Registry Keys Created:**
- `HKCU\Software\Classes\Applications\reysilvaGen.exe`
- `HKCU\Software\Microsoft\Windows\CurrentVersion\App Paths\reysilvaGen.exe`
- `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\{app-id}`

---

## 🍎 macOS Configuration

### `macos-entitlements.plist`
**Purpose:** Security permissions for the main application process

**Features:**
- ✅ JIT compilation for JavaScript
- ✅ Unsigned executable memory (required for Electron)
- ✅ Network client/server access
- ✅ File system permissions
- ✅ Disabled App Sandbox (for development)

**Used By:** `electron-builder` during macOS app signing

**Platform:** macOS 10.13+ (High Sierra and later)

### `macos-entitlements-inherit.plist`
**Purpose:** Security permissions inherited by child processes (GPU, renderer)

**Features:**
- ✅ Inherited JIT compilation
- ✅ Inherited memory permissions
- ✅ Inherited library validation

**Used By:** `electron-builder` for child processes

### `macos-post-install.sh`
**Purpose:** Post-installation script for macOS DMG installer

**Features:**
- ✅ Launch Services registration (Spotlight search)
- ✅ Spotlight index refresh
- ✅ Command line symlink creation
- ✅ Permission setting
- ✅ User guidance for Gatekeeper bypass

**Used By:** Embedded in DMG installer (if configured)

**Platform:** macOS 10.13+

**Installation Paths:**
- App: `/Applications/reysilvaGen.app`
- CLI: `/usr/local/bin/reysilvaGen`

---

## 🐧 Linux Configuration

### `linux-post-install.sh`
**Purpose:** Post-installation script for DEB/RPM packages

**Features:**
- ✅ Desktop database update (GNOME, KDE, XFCE)
- ✅ MIME database update
- ✅ Icon cache update
- ✅ Command line symlink creation
- ✅ System integration

**Used By:** DEB/RPM packages via `afterInstall` hook

**Platform:** Debian, Ubuntu, Fedora, RHEL, CentOS, etc.

**Installation Paths:**
- App: `/opt/reysilvaGen/`
- Desktop: `/usr/share/applications/reysilvaGen.desktop`
- CLI: `/usr/local/bin/reysilvaGen`

---

## 🔧 How It Works

### Build Process Flow

```
┌─────────────────────────────────────────┐
│  1. electron-builder reads package.json │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Platform-specific configuration     │
│     • Windows: nsis.include             │
│     • macOS:   mac.entitlements         │
│     • Linux:   deb/rpm.afterInstall     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Scripts are embedded/executed       │
│     • Windows: NSIS compile-time        │
│     • macOS:   Bundle creation          │
│     • Linux:   Package post-install     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Final installer/package created     │
│     • reysilvaGen-Setup-*.exe           │
│     • reysilvaGen-*-mac-*.dmg           │
│     • reysilvaGen-*-linux-*.deb/rpm     │
└─────────────────────────────────────────┘
```

### Integration Points

**`package.json` references:**

```json
{
  "build": {
    "nsis": {
      "include": "build/windows-installer.nsh"
    },
    "mac": {
      "entitlements": "build/macos-entitlements.plist",
      "entitlementsInherit": "build/macos-entitlements-inherit.plist"
    },
    "deb": {
      "afterInstall": "build/linux-post-install.sh"
    },
    "rpm": {
      "afterInstall": "build/linux-post-install.sh"
    }
  }
}
```

---

## 📝 File Naming Convention

All build scripts follow a consistent naming pattern:

```
{platform}-{purpose}.{extension}

Examples:
✅ windows-installer.nsh
✅ macos-entitlements.plist
✅ linux-post-install.sh

❌ installer.nsh          (unclear platform)
❌ entitlements.mac.plist (inconsistent format)
```

---

## 🚀 Usage

### Building with Scripts

```bash
# Windows (uses windows-installer.nsh)
npm run build:win

# macOS (uses macos-entitlements*.plist)
npm run build:mac

# Linux (uses linux-post-install.sh)
npm run build:linux

# All platforms
npm run build:all
```

### Testing Scripts Individually

**Windows (NSIS):**
```powershell
# Scripts are embedded, test via full build
npm run build:win
```

**macOS:**
```bash
# Test post-install manually
chmod +x build/macos-post-install.sh
./build/macos-post-install.sh
```

**Linux:**
```bash
# Test post-install manually
chmod +x build/linux-post-install.sh
sudo ./build/linux-post-install.sh
```

---

## 🔍 Troubleshooting

### Windows

**Issue:** App not searchable in Start Menu  
**Solution:** Check that `windows-installer.nsh` is being included in `package.json`

**Issue:** Registry keys not created  
**Solution:** Run installer as Administrator or check NSIS compilation logs

### macOS

**Issue:** App not in Spotlight  
**Solution:** Run `lsregister` and `mdimport` manually (see `macos-post-install.sh`)

**Issue:** Gatekeeper blocks app  
**Solution:** Right-click → Open (see script output for instructions)

### Linux

**Issue:** Desktop file not showing  
**Solution:** Run `update-desktop-database` manually

**Issue:** Command not found  
**Solution:** Check symlink with `ls -la /usr/local/bin/reysilvaGen`

---

## 📚 References

- [NSIS Documentation](https://nsis.sourceforge.io/Docs/)
- [macOS Entitlements](https://developer.apple.com/documentation/bundleresources/entitlements)
- [Linux Desktop Entry Spec](https://specifications.freedesktop.org/desktop-entry-spec/latest/)
- [electron-builder Config](https://www.electron.build/configuration/configuration)

---

## ✨ Features by Platform

| Feature | Windows | macOS | Linux |
|---------|---------|-------|-------|
| **Search Integration** | ✅ Start Menu | ✅ Spotlight | ✅ Desktop Search |
| **Command Line Access** | ✅ Win+R | ✅ Terminal | ✅ Terminal |
| **Desktop Shortcut** | ✅ | ❌ | ✅ (optional) |
| **Start Menu / Launchpad** | ✅ | ✅ | ✅ |
| **Auto-Update Support** | ✅ | ✅ | ✅ |
| **Uninstaller** | ✅ | ✅ (manual) | ✅ (package manager) |

---

**Last Updated:** 2025-10-08  
**Version:** 2.0.2  
**Maintained by:** Reysilva

