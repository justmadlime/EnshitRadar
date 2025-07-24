# 🔍 EnshitRadar - YouTube Channel Quality Monitor

A Chrome extension that detects YouTube channels compromised by private equity or experiencing significant quality decline. Get warned before watching content from channels that may no longer represent their original values.

## 🔗 Quick Links

- **🏪 [Chrome Web Store](https://chrome.google.com/webstore/detail/enshitradar/)** - Install the extension
- **💬 [Discord Community](https://discord.gg/enshitradar)** - Join discussions
- **📺 [YouTube Channel](https://youtube.com/@enshitradar)** - Updates & tutorials
- **🚀 [Submit Channel](https://github.com/your-username/enshitradar/pulls)** - Add new channels via PR

## 📖 User Guide

### **Installation & Setup**

1. **Install**: Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/enshitrador/) → "Add to Chrome"
2. **Start**: Click the EnshitRadar icon in your toolbar (enabled by default)
3. **Use**: Visit any YouTube channel or video - warnings appear automatically

### **How It Works**

EnshitRadar monitors YouTube and:

1. **Detects** channels you're viewing (works on channel pages and videos)
2. **Checks** our community database for quality concerns
3. **Shows** warning banners for flagged channels
4. **Allows** temporary dismissal per browser session

### **Warning Levels**

| Level            | Color  | Meaning                                               |
| ---------------- | ------ | ----------------------------------------------------- |
| **🟢 Low**       | Green  | Minor quality decline, some commercialization         |
| **🟡 Medium**    | Yellow | Significant commercialization, more sponsored content |
| **🟠 High**      | Orange | Heavily compromised, misleading content likely        |
| **🔴 Confirmed** | Red    | Sold to private equity, original creators gone        |

### **Managing Warnings**

- **Close**: Remove warning for current page
- **Dismiss for Session**: Hide warnings for this channel until browser restart
- **Learn More**: View detailed information about the channel

### **Settings**

Access via extension icon → "Options" or `chrome://extensions/` → EnshitRadar → "Options"

- **Enable/Disable** extension
- **View Statistics** of monitored channels
- **Export/Clear Data** for privacy
- **Manual Cleanup** of session storage

## 🤝 Contributing Channels

Help expand our database! We welcome community contributions of flagged channels.

### **Quick Report** (Recommended)

Create an [issue](https://github.com/your-username/enshitradar/issues) with:

- **Channel Name**: [Exact YouTube name]
- **Channel URL**: [YouTube URL]
- **Suggested Level**: [low/medium/high/confirmed]
- **Evidence**: [Links, description of what happened]

### **Pull Request Submission**

For direct contributions:

1. **Fork** this repository
2. **Edit** `src/data/channels.json`, add:
   ```json
   {
     "channelId": "UC_CHANNEL_ID_HERE",
     "channelName": "Exact Channel Name",
     "level": "confirmed",
     "description": "Why flagged (optional)",
     "dateAdded": "2025-01-19",
     "source": "Community report"
   }
   ```
3. **Test** your changes work
4. **Submit PR** with evidence and verification

**Finding Channel ID**: Visit channel → URL shows `youtube.com/channel/UC...` (the `UC...` part is the ID)

## 🧹 Privacy & Data

### **Automatic Cleanup**

- **Extension disabled/uninstalled**: All data cleared
- **Browser closed**: Session data cleared automatically

### **Data Storage**

- **Settings**: `chrome.storage.sync` (syncs across devices)
- **Statistics**: `chrome.storage.local` (local only)
- **Dismissed warnings**: `sessionStorage` (temporary, per-tab)

### **Manual Cleanup**

Options page → "Cleanup Session Data" button clears dismissed warnings

## 🛠️ Developer Information

### **Tech Stack**

- **TypeScript** + **Webpack** + **Manifest V3**
- **Zustand** for state management
- **ESLint + Prettier** for code quality

### **Quick Start**

```bash
git clone <repo>
cd EnshitRadar
pnpm install
pnpm run build          # Build extension
pnpm run dev           # Development mode
```

Load `dist/` folder in Chrome via `chrome://extensions/` → "Load unpacked"

### **Project Structure**

```
src/
├── background/        # Service worker
├── content/          # YouTube page scripts
├── popup/            # Extension popup UI
├── options/          # Settings page
├── data/             # Channel database
├── utils/            # Shared utilities
└── types/            # TypeScript definitions
```

### **Available Commands**

```bash
pnpm run build        # Production build
pnpm run dev          # Development with watch
pnpm run lint         # Check code quality
pnpm run format       # Fix formatting
pnpm run package      # Build + zip for store
```

## 📚 Resources & Support

### **Support**

- **🐛 [Report Issues](https://github.com/your-username/enshitradar/issues)**
- **💬 [Discord Server](https://discord.gg/enshitradar)**
- **📧 [Contact](mailto:support@enshitradar.com)**

### **Documentation**

- **[Chrome Extensions](https://developer.chrome.com/docs/extensions/)**
- **[Manifest V3](https://developer.chrome.com/docs/extensions/migrating/)**
- **[TypeScript](https://www.typescriptlang.org/docs/)**

---

**Built with ❤️ by the community. Help us keep YouTube trustworthy!**
