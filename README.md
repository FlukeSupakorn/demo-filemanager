# Intelligent File Management System (Demo)

A modern desktop file manager built with Tauri, React, and TypeScript. This demo showcases a production-ready file management interface with safety features and preparation for AI integration.

## Features

### Core Functionality
- 📁 **Browse & Navigate** - Explore folders with sidebar tree and breadcrumb navigation
- ✨ **File Operations** - Move, rename, create folders, and soft delete with undo
- 🔍 **Search** - Quick client-side file filtering
- 📊 **Multiple Views** - Switch between list and grid views
- ⌨️ **Keyboard Shortcuts** - Productivity shortcuts for common operations
- 🗄️ **Activity Logging** - SQLite database tracks all file operations
- ↩️ **Undo System** - Restore deleted files and reverse operations

### Safety Features
- 🔒 **Sandboxed Access** - Restricts file operations to user-selected roots
- 🗑️ **Soft Delete** - Files moved to .trash folder instead of permanent deletion
- ✅ **Validation** - Prevents invalid file names and path traversal attacks
- 👁️ **Preview Operations** - See changes before applying them

### UI/UX
- 🎨 **Modern Interface** - Clean design with shadcn/ui components
- 🌓 **Theme Support** - Light/dark mode ready
- 📱 **Responsive Layout** - Adapts to different window sizes
- 🎯 **Multi-select** - Batch operations with Shift/Ctrl selection

## Prerequisites

- **Node.js** 18+ and npm/pnpm
- **Rust** 1.70+ (for Tauri)
- **Platform Requirements:**
  - Windows: Windows 10/11 + Visual Studio Build Tools
  - macOS: macOS 10.15+
  - Linux: WebKit2GTK and additional dependencies

### Windows Setup (REQUIRED)

1. **Install Visual Studio Build Tools 2022**:
   - Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
   - During installation, select:
     - "Desktop development with C++" workload
     - Windows 10/11 SDK
     - MSVC v143 - VS 2022 C++ x64/x86 build tools

2. **Install Rust**:
   ```powershell
   # Download and run rustup-init.exe from https://rustup.rs/
   # Or use winget:
   winget install Rustlang.Rustup
   ```

3. **Install WebView2** (usually pre-installed on Windows 10/11):
   - Download from: https://developer.microsoft.com/en-us/microsoft-edge/webview2/

### macOS/Linux Setup

```bash
# Install Rust via rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Linux Dependencies
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libssl-dev libayatana-appindicator3-dev librsvg2-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel openssl-devel
```

## Quick Start for Windows

```powershell
# 1. First, install Visual Studio Build Tools 2022 (see Prerequisites above)

# 2. Clone and enter the project
git clone https://github.com/yourusername/demo-filemanager.git
cd demo-filemanager

# 3. Install dependencies
npm install

# 4. Run the app in development mode
npm run tauri:dev
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/demo-filemanager.git
cd demo-filemanager
```

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run tauri:dev
```

This will:
- Start the Vite dev server on http://localhost:5173
- Launch the Tauri development window
- Enable hot module replacement for React
- Watch for Rust changes and rebuild automatically

## Building

Create a production build:
```bash
npm run tauri build
```

The installer will be created in `src-tauri/target/release/bundle/`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Delete` | Delete selected items |
| `F2` | Rename selected item |
| `Ctrl/Cmd + Z` | Undo last action |
| `Ctrl/Cmd + A` | Select all items |
| `Ctrl/Cmd + N` | Create new folder |
| `Shift + Click` | Range selection |
| `Ctrl/Cmd + Click` | Toggle individual selection |

## Project Structure

```
demo-filemanager/
├── src/                    # React frontend
│   ├── components/        # UI components
│   ├── store/            # Zustand state management
│   ├── lib/              # Utilities and types
│   └── styles/           # Global styles
├── src-tauri/            # Rust backend
│   ├── src/
│   │   ├── commands/     # Tauri command handlers
│   │   ├── fs/          # File system operations
│   │   ├── db/          # Database operations
│   │   └── error.rs     # Error handling
│   └── tauri.conf.json  # Tauri configuration
└── package.json         # Node dependencies
```

## Platform-Specific Notes

### macOS
- **Full Disk Access**: The app may require Full Disk Access permission in System Preferences > Security & Privacy
- **Code Signing**: Production builds should be code-signed for distribution

### Windows
- **Windows Defender**: May flag unsigned builds - add exception during development
- **Long Paths**: Enable long path support in Windows for deeply nested directories

### Linux
- **File Permissions**: Ensure the app has appropriate permissions for file operations
- **Desktop Integration**: The app will integrate with system file managers

## Troubleshooting

### Common Issues

**Build fails with "cargo not found"**
- Ensure Rust is installed and `~/.cargo/bin` is in your PATH
- Restart your terminal after installing Rust

**File operations fail with permission errors**
- On macOS: Grant Full Disk Access in System Preferences
- On Linux: Check file ownership and permissions
- Ensure selected root folders are accessible

**App doesn't start on Linux**
- Install WebKit2GTK: `sudo apt install libwebkit2gtk-4.1-0`
- Check for missing dependencies: `ldd target/release/demo-filemanager`

**SQLite errors**
- The app will create the database on first run
- Check `~/AppData/Roaming/demo-filemanager` (Windows) or `~/.config/demo-filemanager` (Linux/macOS)

## What's Next (AI Phase 2)

The app is prepared for AI integration with:

- **Smart Suggestions Panel** - UI placeholder in right drawer
- **File Categorization** - Automatic organization based on content
- **Duplicate Detection** - Find and manage duplicate files
- **Bulk Rename** - AI-powered file naming suggestions
- **Content Search** - Search within files using AI
- **Organization Assistant** - Suggest optimal folder structures

### Integration Points
- Command handlers ready for AI operations in `src-tauri/src/commands/`
- UI components prepared for AI features in right drawer
- State management structure supports AI metadata

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop application framework
- [React](https://react.dev/) - UI library
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Lucide](https://lucide.dev/) - Icons

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing issues for solutions
- Review the troubleshooting section above

---

Built with ❤️ for modern file management
