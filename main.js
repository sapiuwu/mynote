const { app, BrowserWindow, Menu, dialog, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 500,
    minHeight: 350,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1e1e1e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  });

  const isDev = !fs.existsSync(path.join(__dirname, 'dist-renderer', 'index.html'));
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist-renderer', 'index.html'));
  }

  mainWindow.on('maximize', () => send('window-maximized', true));
  mainWindow.on('unmaximize', () => send('window-maximized', false));

  buildMenu();
  setupIPC();
}

function send(channel, ...args) {
  if (mainWindow) mainWindow.webContents.send(channel, ...args);
}

function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        { label: 'New Tab', accelerator: 'CmdOrCtrl+N', click: () => send('menu-command', 'menu-new-tab') },
        { label: 'Open File...', accelerator: 'CmdOrCtrl+O', click: () => send('menu-command', 'menu-open') },
        { label: 'Open Folder...', accelerator: 'CmdOrCtrl+Shift+O', click: () => send('menu-command', 'menu-openFolder') },
        { type: 'separator' },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => send('menu-command', 'menu-save') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('menu-command', 'menu-saveAs') },
        { label: 'Save All', accelerator: 'CmdOrCtrl+Shift+Alt+S', click: () => send('menu-command', 'menu-saveAll') },
        { type: 'separator' },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: () => send('menu-command', 'menu-closeTab') },
        { label: 'Exit', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => send('menu-command', 'menu-find') },
        { label: 'Replace', accelerator: 'CmdOrCtrl+H', click: () => send('menu-command', 'menu-replace') },
        { label: 'Go to Line', accelerator: 'CmdOrCtrl+G', click: () => send('menu-command', 'menu-gotoLine') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Command Palette', accelerator: 'CmdOrCtrl+Shift+P', click: () => send('menu-command', 'menu-commandPalette') },
        { type: 'separator' },
        { label: 'Toggle Word Wrap', accelerator: 'Alt+Z', click: () => send('menu-command', 'menu-wordWrap') },
        { label: 'Toggle Line Numbers', click: () => send('menu-command', 'menu-lineNumbers') },
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => send('menu-command', 'menu-sidebar') },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => send('menu-command', 'menu-zoomIn') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => send('menu-command', 'menu-zoomOut') },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => send('menu-command', 'menu-zoomReset') },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { role: 'toggleDevTools' }
      ]
    },
    {
      label: 'Terminal',
      submenu: [
        { label: 'New Terminal', accelerator: 'CmdOrCtrl+`', click: () => send('menu-command', 'menu-terminal') }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MyNote',
          click: () => dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'About MyNote',
            message: 'MyNote v4.0.0',
            detail: 'A powerful text editor with plugin support.\n\nBuilt with Electron, TypeScript, and Hexagonal Architecture.'
          })
        },
        {
          label: 'Repository',
          click: () => shell.openExternal('https://github.com/aliftech/mynote')
        }
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);
}

function setupIPC() {
  ipcMain.on('window-minimize', () => mainWindow && mainWindow.minimize());
  ipcMain.on('window-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window-close', () => mainWindow && mainWindow.close());

  ipcMain.handle('dialog:openFile', async (event, options) => {
    return dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: options.filters || []
    });
  });

  ipcMain.handle('dialog:saveFile', async (event, options) => {
    return dialog.showSaveDialog(mainWindow, {
      filters: options.filters || [],
      defaultPath: options.defaultPath || 'Untitled.txt'
    });
  });

  ipcMain.handle('dialog:openFolder', async () => {
    return dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
