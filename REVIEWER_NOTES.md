# Reviewer Notes - EnshitRadar Firefox Extension

## Extension Overview

EnshitRadar is a privacy-focused browser extension that helps users identify YouTube channels that may have been compromised by private equity or have experienced quality decline. The extension displays non-intrusive warning banners on YouTube pages.

## Core Functionality

### 1. Channel Detection (`src/content/youtube.ts`)

- Detects YouTube channel and video pages using URL parsing
- Extracts channel information from page DOM
- Matches against internal database of flagged channels
- No external API calls or data transmission

### 2. Warning System (`src/components/WarningBanner.ts`)

- Displays contextual warning banners
- **Security Note**: Recently refactored to eliminate `innerHTML` usage
- Uses safe DOM creation methods to prevent XSS attacks
- All user data properly escaped via `textContent`

### 3. Settings Management (`src/stores/settingsStore.ts`)

- Uses browser's local storage (sync storage)
- Simple enable/disable toggle
- No personal data collection

### 4. Cross-Browser Compatibility (`src/utils/browser.ts`)

- Uses webextension-polyfill for Firefox compatibility
- Abstracts browser-specific APIs
- Maintains consistent functionality across browsers

## Privacy and Security

### Data Collection: NONE

- **No tracking**: Extension doesn't track user behavior
- **No analytics**: No usage statistics collected
- **No external requests**: All data is local
- **No personal information**: Channel detection is pattern-based only

### Security Measures

1. **XSS Prevention**: Eliminated all `innerHTML` usage (recent security fix)
2. **Content Security Policy**: Strict CSP in manifest
3. **Minimal Permissions**: Only requests necessary permissions
4. **Safe DOM Manipulation**: Custom utilities in `src/utils/dom.ts`

### Permissions Explained

```json
{
  "permissions": ["storage", "activeTab"],
  "host_permissions": ["*://*.youtube.com/*", "*://youtube.com/*"]
}
```

- **storage**: Save user preferences locally
- **activeTab**: Access current tab URL and inject content script
- **host_permissions**: Run content script on YouTube pages only

## Technical Architecture

### Content Scripts

- **Single content script**: `src/content/youtube.ts`
- **Runs on**: YouTube pages only (`*://*.youtube.com/*`)
- **Function**: Page analysis and warning banner injection
- **Isolation**: Runs in isolated world, cannot access page scripts

### Background Script

- **Minimal functionality**: Settings synchronization only
- **No persistent background**: Uses event-based activation
- **Firefox-compatible**: Uses scripts array instead of service worker

### Data Sources

- **Static database**: `src/data/channels.json`
- **User reports**: Channels added based on community feedback
- **No dynamic updates**: Database is static, updated with extension releases

## Code Quality

### TypeScript

- **100% TypeScript**: All source files are TypeScript
- **Strict mode enabled**: Full type safety
- **No any types**: Proper type definitions throughout

### Build Process

- **Webpack**: Modern bundling and optimization
- **Source maps**: Available for debugging (development builds)
- **Tree shaking**: Removes unused code
- **Cross-browser builds**: Separate Chrome/Firefox manifests

### Testing Approach

- **Manual testing**: Comprehensive browser testing
- **Type checking**: Automated TypeScript validation
- **Build verification**: CI/CD pipeline ensures builds work

## Known Limitations

1. **Static database**: Channel list requires extension updates
2. **YouTube-only**: Currently supports YouTube exclusively
3. **English interface**: UI text is English-only
4. **Manual dismissal**: Warnings can be dismissed per session

## Recent Changes (Security Focus)

### Version 1.2.1+ Security Improvements

- **Eliminated innerHTML**: Replaced all `innerHTML` with safe DOM methods
- **XSS prevention**: All user data properly escaped
- **DOM utilities**: Added safe manipulation helpers
- **CSP compliance**: Strict content security policy

### Code Review Focus Areas

1. **Content script injection**: Check `src/content/youtube.ts` line 23-50
2. **Warning banner creation**: Review `src/components/WarningBanner.ts` line 23-95
3. **Settings handling**: Examine `src/stores/settingsStore.ts`
4. **Cross-browser compatibility**: Check `src/utils/browser.ts`

## Firefox-Specific Considerations

### Manifest Differences

- **Background scripts**: Uses scripts array instead of service worker
- **Browser ID**: Includes gecko-specific ID for signing
- **Permissions**: Host permissions separated from regular permissions

### API Usage

- **webextension-polyfill**: Ensures Firefox compatibility
- **Standard APIs only**: No experimental or Chrome-specific APIs
- **Async/await**: Modern promise-based API usage

## Support and Maintenance

- **Active development**: Regular updates and improvements
- **Community driven**: Channel database updated based on user reports
- **Open source**: Full source code available on GitHub
- **Responsive**: Bug fixes and security updates prioritized

## Verification Steps for Reviewers

1. **Build verification**: Follow BUILD_INSTRUCTIONS.md exactly
2. **Functionality test**: Load in Firefox, visit YouTube channels
3. **Permissions audit**: Verify only declared permissions used
4. **Security review**: Check for XSS, data leaks, malicious code
5. **Performance impact**: Monitor CPU/memory usage during operation

The extension is designed to be lightweight, privacy-respecting, and secure. All functionality is transparent and serves the single purpose of helping users make informed decisions about YouTube content quality.
