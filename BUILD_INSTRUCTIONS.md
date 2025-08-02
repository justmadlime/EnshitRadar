# Build Instructions for EnshitRadar Firefox Extension

This document provides step-by-step instructions to build the EnshitRadar Firefox extension from source code.

## System Requirements

### Operating System

- **Supported**: Windows 10+, macOS 10.15+, Ubuntu 18.04+, or any Linux distribution with Node.js support
- **Tested on**: macOS 14.1.0, Ubuntu 22.04 LTS, Windows 11

### Required Software

| Software | Version      | Installation                        |
| -------- | ------------ | ----------------------------------- |
| Node.js  | 18.x or 20.x | [nodejs.org](https://nodejs.org/)   |
| pnpm     | 8.x          | `npm install -g pnpm@8`             |
| Git      | Latest       | [git-scm.com](https://git-scm.com/) |

### Verification Commands

```bash
node --version    # Should show v18.x.x or v20.x.x
pnpm --version    # Should show 8.x.x
git --version     # Should show git version 2.x.x
```

## Build Process

### Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/justmadlime/EnshitRadar.git
cd EnshitRadar

# Install dependencies (creates pnpm-lock.yaml if missing)
pnpm install --frozen-lockfile
```

### Step 2: Build Firefox Extension

```bash
# Build specifically for Firefox
pnpm run build:firefox

# This creates dist-firefox/ directory with built extension
```

### Step 3: Create Distribution Package

```bash
# Create the .zip file for Firefox submission
pnpm run zip:firefox

# This creates extension-firefox.zip in the project root
```

### Step 4: Verification

```bash
# Verify the build completed successfully
ls -la dist-firefox/
ls -la extension-firefox.zip

# The dist-firefox/ directory should contain:
# - manifest.json (Firefox-specific)
# - background.js (transpiled from TypeScript)
# - youtube.js (content script, transpiled from TypeScript)
# - popup.js and popup.html (popup interface)
# - options.js and options.html (options page)
# - data/channels.json (channel database)
# - assets/ directory (extension icons)
```

## Build Script Details

The build process uses these npm scripts defined in `package.json`:

```json
{
  "build:firefox": "BROWSER=firefox webpack --mode=production",
  "zip:firefox": "cd dist-firefox && zip -r ../extension-firefox.zip .",
  "package:firefox": "pnpm run build:firefox && pnpm run zip:firefox"
}
```

### Environment Variables

- `BROWSER=firefox`: Tells webpack to use `src/manifest-firefox.json`
- `NODE_ENV=production`: Enables webpack production optimizations

### Webpack Configuration

The build uses `webpack.config.js` which:

1. Compiles TypeScript to JavaScript
2. Copies Firefox manifest (`src/manifest-firefox.json` → `manifest.json`)
3. Copies static assets (icons, data files)
4. Generates HTML files from templates
5. Bundles with webextension-polyfill for cross-browser compatibility

## Source Code Structure

```
src/
├── manifest-firefox.json    # Firefox-specific manifest
├── background/
│   └── index.ts            # Background service worker
├── content/
│   └── youtube.ts          # Content script for YouTube
├── popup/
│   ├── index.ts           # Popup interface logic
│   └── popup.html         # Popup HTML template
├── options/
│   ├── index.ts           # Options page logic
│   └── options.html       # Options page template
├── components/
│   └── WarningBanner.ts   # Warning banner component
├── stores/
│   └── settingsStore.ts   # State management (Zustand)
├── utils/
│   ├── browser.ts         # Cross-browser API wrapper
│   ├── messaging.ts       # Extension messaging
│   ├── youtube.ts         # YouTube page detection
│   ├── channelDatabase.ts # Channel data management
│   └── dom.ts            # Safe DOM manipulation
├── types/
│   └── index.ts          # TypeScript type definitions
├── data/
│   └── channels.json     # Channel database (static)
└── assets/
    ├── icon16.png        # Extension icons
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Dependencies

### Production Dependencies

- `webextension-polyfill@0.12.0`: Cross-browser extension API
- `zustand@4.4.7`: State management library

### Development Dependencies

- `typescript@5.3.2`: TypeScript compiler
- `webpack@5.89.0`: Module bundler
- `ts-loader@9.5.1`: TypeScript loader for webpack
- Various webpack plugins and loaders (see package.json)

## Build Output

The Firefox build (`dist-firefox/`) contains:

| File                 | Description                | Source                      |
| -------------------- | -------------------------- | --------------------------- |
| `manifest.json`      | Firefox extension manifest | `src/manifest-firefox.json` |
| `background.js`      | Background service worker  | `src/background/index.ts`   |
| `youtube.js`         | YouTube content script     | `src/content/youtube.ts`    |
| `popup.js`           | Popup interface            | `src/popup/index.ts`        |
| `popup.html`         | Popup HTML                 | `src/popup/popup.html`      |
| `options.js`         | Options page               | `src/options/index.ts`      |
| `options.html`       | Options HTML               | `src/options/options.html`  |
| `data/channels.json` | Channel database           | `src/data/channels.json`    |
| `assets/`            | Extension icons            | `src/assets/`               |

## Key Differences from Chrome Build

1. **Manifest**: Uses `src/manifest-firefox.json` with Firefox-specific settings
2. **Background Script**: Uses `"scripts": ["background.js"]` instead of service worker
3. **Permissions**: Host permissions properly separated from regular permissions
4. **Browser ID**: Includes `browser_specific_settings.gecko.id`

## Troubleshooting

### Common Issues

**Error: "Cannot find module 'typescript'"**

```bash
# Solution: Install dependencies
pnpm install
```

**Error: "BROWSER environment variable not set"**

```bash
# Solution: Use the specific Firefox build command
pnpm run build:firefox
```

**Error: "pnpm command not found"**

```bash
# Solution: Install pnpm globally
npm install -g pnpm@8
```

### Verification Steps

1. **Check Node.js version**: Must be 18.x or 20.x
2. **Verify pnpm version**: Must be 8.x
3. **Clean build**: Run `pnpm run clean` then rebuild
4. **Check manifest**: Ensure `dist-firefox/manifest.json` has correct Firefox format

## Quality Assurance

### Automated Checks

```bash
# Type checking
pnpm run type-check

# Code formatting verification
pnpm run format:check

# Build verification
pnpm run build:firefox
```

### Manual Testing

1. Load `dist-firefox/` as temporary add-on in Firefox
2. Navigate to about:debugging
3. Click "This Firefox" → "Load Temporary Add-on"
4. Select `dist-firefox/manifest.json`
5. Test core functionality on YouTube

## Contact Information

- **Repository**: https://github.com/justmadlime/EnshitRadar
- **Issues**: https://github.com/justmadlime/EnshitRadar/issues
- **Discord**: https://discord.gg/brCNpJcx

## Reproducible Builds

This extension supports reproducible builds. Using the same:

- Node.js version
- pnpm version
- Dependency versions (locked in pnpm-lock.yaml)
- Source code commit

Should produce byte-identical output files.
