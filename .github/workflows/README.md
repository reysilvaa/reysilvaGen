# 🤖 GitHub Actions Workflows

Centralized workflow untuk auto-build dan release.

## 📁 File Structure

```
.github/workflows/
└── release.yml          # Main workflow (terpusat)
```

## 🎯 Workflows Available

### 1️⃣ **Automatic Release** (Push Tag)

**Trigger:** Push tag dengan format `v*` (contoh: `v2.0.1`, `v2.1.0`)

**What it does:**
1. ✅ Build Windows installer & portable
2. ✅ Upload artifacts
3. ✅ Create GitHub Release automatically
4. ✅ Upload files ke release

**Usage:**
```bash
# Update version
npm version patch  # 2.0.1 → 2.0.2

# Push tag
git push origin v2.0.2

# GitHub Actions akan auto-build & release!
```

**Output:**
- `reysilvaGen-Setup-2.0.2.exe` - NSIS Installer
- `reysilvaGen-2.0.2-Portable.exe` - Portable version
- `latest.yml` - Auto-update manifest

### 2️⃣ **Manual Build** (Workflow Dispatch)

**Trigger:** Manual dari GitHub UI

**How to trigger:**
1. Buka: https://github.com/reysilva/reysilvaGen/actions
2. Pilih **"Build & Release"**
3. Klik **"Run workflow"**
4. Pilih platform:
   - `windows` - Build Windows only
   - `macos` - Build macOS only
   - `linux` - Build Linux only
   - `all` - Build semua platform

**Output:**
- Download dari Artifacts tab

## 📊 Jobs Explanation

### `build-windows`
- **Runs on:** Windows Server 2022
- **Node version:** 20.x
- **Output:** NSIS + Portable
- **Trigger:** Auto on tag push OR manual

### `build-macos`
- **Runs on:** macOS latest
- **Node version:** 20.x
- **Output:** DMG + ZIP
- **Trigger:** Manual only

### `build-linux`
- **Runs on:** Ubuntu latest
- **Node version:** 20.x
- **Output:** AppImage + tar.gz
- **Trigger:** Manual only

### `release`
- **Runs on:** Ubuntu latest
- **Dependencies:** build-windows
- **Purpose:** Create GitHub Release
- **Trigger:** Auto on tag push

### `publish`
- **Runs on:** Windows Server 2022
- **Purpose:** Direct publish to GitHub
- **Trigger:** Manual only

## 🔐 Environment Variables

### Set in Workflow:
```yaml
CSC_IDENTITY_AUTO_DISCOVERY: false  # Disable code signing
```

### From Secrets:
```yaml
GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Auto-provided by GitHub
```

## 📝 Workflow File: release.yml

```yaml
name: Build & Release

on:
  push:
    tags: ['v*']      # Auto-trigger on version tags
  workflow_dispatch:  # Manual trigger with options

env:
  CSC_IDENTITY_AUTO_DISCOVERY: false

jobs:
  build-windows:   # Build Windows
  build-macos:     # Build macOS (manual)
  build-linux:     # Build Linux (manual)
  release:         # Create GitHub Release
  publish:         # Direct publish (manual)
```

## 🚀 Usage Examples

### Release Development Version

```bash
# 1. Update version in package.json
npm version patch

# 2. Commit
git add package.json package-lock.json
git commit -m "Bump version to 2.0.2"

# 3. Push tag
git push origin v2.0.2

# 4. Wait for GitHub Actions
# Check: https://github.com/reysilva/reysilvaGen/actions

# 5. Download from Releases
# https://github.com/reysilva/reysilvaGen/releases
```

### Manual Build (Testing)

1. Go to: https://github.com/reysilva/reysilvaGen/actions
2. Click **"Build & Release"**
3. Click **"Run workflow"**
4. Select:
   - Branch: `main`
   - Platform: `windows`
5. Click **"Run workflow"** button
6. Wait ~5-10 minutes
7. Download from **Artifacts**

### Build All Platforms

1. Workflow Dispatch → Select `all`
2. Wait ~15-20 minutes
3. Download artifacts:
   - `windows-installer`
   - `macos-installer`
   - `linux-installer`

## 📦 Artifacts Retention

- **Windows builds:** 7 days
- **macOS builds:** 7 days
- **Linux builds:** 7 days
- **Releases:** Forever (in GitHub Releases)

## 🔍 Monitoring

### Check Build Status:
```
https://github.com/reysilva/reysilvaGen/actions
```

### Status Badges:
- 🟢 Success - Build berhasil
- 🔴 Failure - Build gagal
- 🟡 In Progress - Sedang build
- ⚪ Queued - Waiting

### View Logs:
1. Click pada workflow run
2. Click pada job (e.g., "Build Windows")
3. Expand steps untuk lihat detail logs

## ⚙️ Configuration

### Modify Workflow:

```yaml
# .github/workflows/release.yml

# Change retention days
retention-days: 30  # Default: 7

# Change Node version
node-version: '18'  # Default: '20'

# Add more platforms
- windows
- macos  
- linux
- all
- android  # Coming soon
```

## 🎯 Best Practices

1. **Versioning:**
   - Use semantic versioning: `v2.0.1`
   - Patch: Bug fixes
   - Minor: New features
   - Major: Breaking changes

2. **Testing:**
   - Test locally before push tag
   - Use manual dispatch for testing
   - Check artifacts before release

3. **Release Notes:**
   - Auto-generated from commits
   - Edit release notes after creation
   - Add breaking changes warning

## 🐛 Troubleshooting

### Build Failed

**Check:**
1. Logs di Actions tab
2. Error message
3. Dependencies updated?

**Common fixes:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Test local build
npm run build
```

### Release Not Created

**Check:**
1. Tag format: `v2.0.1` (dengan "v")
2. Tag pushed: `git push origin v2.0.1`
3. Workflow enabled
4. GITHUB_TOKEN valid

### Artifacts Not Found

**Possible causes:**
- Build failed (check logs)
- Retention expired (> 7 days)
- Path incorrect in workflow

## 📚 Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [electron-builder](https://www.electron.build/)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)

---

**Automated & Centralized! 🚀**

