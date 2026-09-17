# MyNote

A powerful, extensible text editor built with Electron, featuring a VS Code-like interface and plugin support. Uses hexagonal architecture for clean separation of concerns.

## Features

### Editor
- Tabbed editing with modified indicator
- Line numbers with active line highlight
- Word wrap toggle
- Undo/Redo with history
- Zoom in/out (50% - 200%)
- Drag & drop files to open
- Double-click or F2 to rename tabs

### File Explorer (VS Code-like)
- Tree view workspace with folder/file icons
- Expand/collapse folders
- Create new file (`📄+` button)
- Create new folder (`📁+` button)
- Open folder as workspace (`📂` button)
- Context menu (right-click): New File, New Folder, Rename, Delete, Copy Path, Copy Name
- Auto-refresh after file operations

### Search
- Search across all open files
- Match Case / Whole Word / Regex options
- Click result to jump to line
- Result count per file

### Find & Replace
- Find (Ctrl+F) with match count
- Replace one / Replace all
- Match Case & Whole Word options

### Terminal
- Integrated terminal (Ctrl+`)
- Run shell commands directly in editor

### Command Palette
- Ctrl+Shift+P to open
- Fuzzy search all commands
- Keyboard navigation (arrows + Enter)

### Settings Panel
- Auto Save + Delay
- Font Size
- Tab Size
- Word Wrap
- Line Numbers
- Minimap
- Bracket Colorizer
- Theme selector

### Plugin System
- Built-in plugins: Word Counter, Auto Save, Bracket Colorizer, Minimap
- Enable/disable plugins from Plugins panel
- Create custom plugins with lifecycle hooks

## Architecture

Built using **Hexagonal Architecture** (Ports & Adapters):

```
src/
├── core/
│   └── domain/
│       ├── tab.js          # Tab, Document, LanguageDetector
│       ├── cursor.js       # Selection, Cursor
│       └── plugin.js       # Plugin, PluginContext, PluginMetadata
├── adapters/
│   └── ui/
│       ├── event-bus.js    # Event bus
│       ├── editor.js       # Editor UI adapter
│       ├── find-replace.js # Find/Replace
│       ├── command-palette.js
│       ├── goto-line.js
│       └── terminal.js
└── plugins/                # Built-in plugins
    ├── word-counter/
    ├── auto-save/
    ├── bracket-colorizer/
    └── minimap/
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| Ctrl+N | New Tab |
| Ctrl+O | Open File |
| Ctrl+Shift+O | Open Folder |
| Ctrl+S | Save |
| Ctrl+Shift+S | Save As |
| Ctrl+Shift+Alt+S | Save All |
| Ctrl+W | Close Tab |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+F | Find |
| Ctrl+H | Replace |
| Ctrl+G | Go to Line |
| Ctrl+D | Duplicate Line |
| Ctrl+Shift+K | Delete Line |
| Ctrl+Shift+P | Command Palette |
| Ctrl+B | Toggle Sidebar |
| Ctrl+` | Terminal |
| F2 | Rename Tab |
| Alt+Z | Word Wrap |
| Ctrl+= | Zoom In |
| Ctrl+- | Zoom Out |
| Ctrl+0 | Reset Zoom |
| Ctrl+Tab | Next Tab |
| F11 | Fullscreen |
| Escape | Close Panel |

## Requirements

- Node.js 16+
- npm

## How To Run

```bash
npm install
npm start
```

## Build

To build the Electron app as an executable:

```bash
npm run build
```

This uses `electron-builder` to create platform-specific installers:

- **Windows**: `.exe` installer in `dist/` folder
- **macOS**: `.dmg` file
- **Linux**: `.AppImage` or `.deb`

Build for a specific platform:

```bash
npm run build:win
npm run build:mac
npm run build:linux
```

## Creating Plugins

```javascript
class MyPlugin extends Plugin {
  static METADATA = {
    id: 'my-plugin',
    name: 'My Plugin',
    version: '1.0.0',
    description: 'Description here',
    author: 'Your Name'
  };

  async onActivate(ctx) {
    // Register commands
    ctx.registerCommand({
      id: 'my-plugin.hello',
      label: 'Say Hello',
      execute: () => ctx.editor.insertText('Hello!')
    });

    // Register status bar item
    ctx.registerStatusBar({ text: 'MyPlugin Active' });

    // Listen to events
    ctx.onEvent('editor:change', ({ tab }) => {
      console.log('Editor changed:', tab.title);
    });

    // Access settings
    ctx.settings.set('mySetting', true);
    const val = ctx.settings.get('mySetting');
  }

  async onDeactivate() {
    // Cleanup
  }
}
```

## Version

- 3.1.0 (Electron - Hexagonal Architecture with Plugin System)
- 3.0.0
- 2.0.0
- 1.0.1
- 1.0.0

## License

MIT
