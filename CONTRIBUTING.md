# Contributing to EnshitRadar

Thank you for your interest in contributing! This guide will help you get started with the development process and understand our CI/CD workflows.

## 🚀 Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/EnshitRadar.git
   cd EnshitRadar
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Start development**:

   ```bash
   # For Chrome
   pnpm run dev:chrome

   # For Firefox
   pnpm run dev:firefox
   ```

## 🔧 Development Commands

```bash
# Build for production
pnpm run build:chrome      # Chrome extension
pnpm run build:firefox     # Firefox extension
pnpm run build:all         # Both browsers

# Development with watch mode
pnpm run dev:chrome        # Chrome development
pnpm run dev:firefox       # Firefox development

# Quality checks
pnpm run type-check        # TypeScript validation
pnpm run format:check      # Code formatting check
pnpm run format            # Fix formatting
pnpm run lint              # ESLint (currently disabled due to config issues)

# Packaging
pnpm run package:chrome    # Build and zip Chrome extension
pnpm run package:firefox   # Build and zip Firefox extension
pnpm run package:all       # Build and zip both
```

## 🏗️ Project Structure

```
src/
├── background/           # Background service worker
├── content/             # Content scripts (runs on web pages)
├── popup/               # Extension popup UI
├── options/             # Options/settings page
├── components/          # Reusable UI components
├── stores/              # Zustand state management
├── utils/               # Utility functions
├── types/               # TypeScript type definitions
├── data/                # Static data (channel database)
├── assets/              # Icons and images
├── manifest-chrome.json # Chrome extension manifest
└── manifest-firefox.json # Firefox extension manifest
```

## 🔄 CI/CD Workflow

Our project uses GitHub Actions for automated CI/CD:

### Quality Checks

- **Trigger**: Every push and pull request
- **Actions**: Type checking, formatting validation
- **Note**: Linting is temporarily disabled due to ESLint config issues

### Multi-Browser Builds

- **Trigger**: After quality checks pass
- **Actions**: Builds extension for both Chrome and Firefox
- **Artifacts**: Stores built extensions for 30 days

### Automated Releases

- **Trigger**: When you push a git tag (e.g., `v1.2.1`)
- **Actions**: Creates GitHub release with both browser packages and installation instructions

### Version Bumping

- **Trigger**: Manual workflow dispatch
- **Actions**:
  1. Updates version in `package.json` and both manifest files
  2. Creates a pull request with version changes
  3. After merging, you can create a tag to trigger a release

## 📝 Pull Request Process

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code style

3. **Test your changes**:
   - Load the extension in both Chrome and Firefox
   - Verify core functionality works
   - Check for console errors

4. **Create a pull request** using our PR template

5. **Wait for review** - the CI/CD pipeline will automatically:
   - Run quality checks
   - Build for both browsers
   - Report any issues

## 🏷️ Release Process

### For Maintainers

1. **Version Bump**:
   - Go to Actions → Version Bump workflow
   - Choose patch/minor/major or enter custom version
   - This creates a PR with version updates

2. **Create Release**:

   ```bash
   # After merging the version bump PR
   git tag v1.2.1
   git push origin v1.2.1
   ```

3. **Automatic Release**: GitHub Actions will:
   - Build both browser extensions
   - Create a GitHub release
   - Attach extension packages
   - Generate installation instructions

### For Contributors

- Focus on features and bug fixes
- Version bumping and releases are handled by maintainers

## 🧪 Testing Guidelines

- **Chrome**: Load unpacked extension from `dist-chrome/`
- **Firefox**: Load temporary add-on using `extension-firefox.zip`
- **Core functionality**: Verify channel detection works on YouTube
- **UI**: Check popup and options pages load correctly
- **Console**: Ensure no JavaScript errors

## 📋 Code Style

- **TypeScript**: Strict type checking enabled
- **Formatting**: Prettier with project config
- **Imports**: Always use absolute imports with `@/` prefix
- **Components**: Create reusable components when it improves code quality
- **State**: Use Zustand stores for state management

## 🐛 Bug Reports

Use our bug report template and include:

- Browser and version
- Extension version
- Steps to reproduce
- Console logs (if any)
- Screenshots (if applicable)

## ✨ Feature Requests

Use our feature request template and describe:

- The problem you're trying to solve
- Your proposed solution
- Priority level
- Browser compatibility requirements

## 🔐 Security

For security vulnerabilities, please use GitHub's private security advisory feature rather than creating a public issue.

## 📞 Getting Help

- **Discord**: Join our [Discord server](https://discord.gg/brCNpJcx)
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for general questions

## 📜 License

By contributing to EnshitRadar, you agree that your contributions will be licensed under the same license as the project.
