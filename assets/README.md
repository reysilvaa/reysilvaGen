# Assets Folder

This folder is for application icons and images.

## Adding Custom Icon

To customize the app icon, add these files here:

- `icon.png` - For Linux (512x512 recommended)
- `icon.ico` - For Windows (256x256 recommended)
- `icon.icns` - For macOS

You can use online tools to convert your icon:

- https://icoconvert.com/
- https://convertio.co/

## Default Icon

Currently, the app uses the emoji 💳 as the icon in the UI.
For system icons, Electron will use its default icon until you provide custom ones.

## Icon Requirements

- **PNG**: 512x512px (transparent background)
- **ICO**: 256x256px (for Windows)
- **ICNS**: Multiple sizes (for macOS)

After adding icons, rebuild the app:

```bash
npm run build:win   # or build:mac, build:linux
```

The icons will be included in the built application.
