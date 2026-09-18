const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const ALLOWED_FS_PATHS = (filePath) => {
  if (typeof filePath !== 'string') return false;
  const normalized = path.normalize(filePath);
  return !normalized.includes('\0');
};

// ===================== SHELL DETECTION =====================
function detectShells() {
  const shells = [];
  const platform = process.platform;

  if (platform === 'win32') {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const system32 = path.join(sysRoot, 'System32');

    const cmdPath = path.join(system32, 'cmd.exe');
    if (fs.existsSync(cmdPath)) {
      shells.push({ id: 'cmd', name: 'Command Prompt', cmd: cmdPath, args: [] });
    }

    const psPath = path.join(system32, 'WindowsPowerShell', 'v1.0', 'powershell.exe');
    if (fs.existsSync(psPath)) {
      shells.push({ id: 'powershell', name: 'PowerShell', cmd: psPath, args: ['-NoLogo', '-NoProfile'] });
    }

    const pwshPath = path.join(system32, 'pwsh.exe');
    if (fs.existsSync(pwshPath)) {
      shells.push({ id: 'pwsh', name: 'PowerShell 7', cmd: pwshPath, args: ['-NoLogo', '-NoProfile'] });
    }

    const gitBashLocations = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Git', 'bin', 'bash.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Git', 'bin', 'bash.exe'),
    ];
    for (const loc of gitBashLocations) {
      if (fs.existsSync(loc)) {
        shells.push({ id: 'gitbash', name: 'Git Bash', cmd: loc, args: ['--login', '-i'] });
        break;
      }
    }

    const wslPath = path.join(system32, 'wsl.exe');
    if (fs.existsSync(wslPath)) {
      shells.push({ id: 'wsl', name: 'WSL', cmd: wslPath, args: [] });
    }
  } else {
    shells.push({ id: 'bash', name: 'Bash', cmd: '/bin/bash', args: ['--login', '-i'] });
    if (fs.existsSync('/bin/zsh')) {
      shells.push({ id: 'zsh', name: 'Zsh', cmd: '/bin/zsh', args: [] });
    }
    shells.push({ id: 'sh', name: 'Shell', cmd: '/bin/sh', args: [] });
  }

  return shells;
}

// ===================== MULTI-TERMINAL =====================
const terminals = new Map();
let nextId = 1;

function createTerminal(shellId, cwd) {
  const id = nextId++;
  const shells = detectShells();
  const shell = shells.find(s => s.id === shellId) || shells[0];
  if (!shell) throw new Error('No shell available');

  const workDir = cwd || process.env.USERPROFILE || process.env.HOME || undefined;
  const child = spawn(shell.cmd, shell.args, {
    cwd: workDir,
    env: { ...process.env, TERM: 'xterm-256color' },
    windowsHide: false,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  terminals.set(id, { id, shellId: shell.id, shellName: shell.name, process: child, cwd: workDir });

  // Send data back to renderer via ipcRenderer
  child.stdout.on('data', (data) => {
    ipcRenderer.send('terminal-data', id, data.toString());
  });
  child.stderr.on('data', (data) => {
    ipcRenderer.send('terminal-data', id, data.toString());
  });
  child.on('exit', (code) => {
    ipcRenderer.send('terminal-exit', id, code);
    terminals.delete(id);
  });
  child.on('error', (err) => {
    ipcRenderer.send('terminal-data', id, `\r\nError: ${err.message}\r\n`);
    terminals.delete(id);
  });

  return { id, shellId: shell.id, shellName: shell.name };
}

// ===================== CONTEXT BRIDGE =====================
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Dialogs
  openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options) => ipcRenderer.invoke('dialog:saveFile', options),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),

  // Menu events
  onMenuCommand: (callback) => {
    const handler = (_event, channel) => callback(channel);
    ipcRenderer.on('menu-command', handler);
    return () => ipcRenderer.removeListener('menu-command', handler);
  },

  onWindowMaximized: (callback) => {
    const handler = (_event, maximized) => callback(maximized);
    ipcRenderer.on('window-maximized', handler);
    return () => ipcRenderer.removeListener('window-maximized', handler);
  },

  // File system operations
  readFile: (filePath) => {
    if (!ALLOWED_FS_PATHS(filePath)) throw new Error('Invalid file path');
    return fs.readFileSync(filePath, 'utf-8');
  },
  writeFile: (filePath, content) => {
    if (!ALLOWED_FS_PATHS(filePath)) throw new Error('Invalid file path');
    fs.writeFileSync(filePath, content, 'utf-8');
  },
  existsSync: (filePath) => {
    if (!ALLOWED_FS_PATHS(filePath)) return false;
    return fs.existsSync(filePath);
  },
  readDir: (dirPath) => {
    if (!ALLOWED_FS_PATHS(dirPath)) throw new Error('Invalid directory path');
    return fs.readdirSync(dirPath, { withFileTypes: true }).map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile()
    }));
  },
  statSync: (filePath) => {
    if (!ALLOWED_FS_PATHS(filePath)) throw new Error('Invalid file path');
    const stat = fs.statSync(filePath);
    return { isDirectory: stat.isDirectory(), isFile: stat.isFile() };
  },
  mkdirSync: (dirPath) => {
    if (!ALLOWED_FS_PATHS(dirPath)) throw new Error('Invalid directory path');
    fs.mkdirSync(dirPath, { recursive: true });
  },
  unlinkSync: (filePath) => {
    if (!ALLOWED_FS_PATHS(filePath)) throw new Error('Invalid file path');
    fs.unlinkSync(filePath);
  },
  rmSync: (filePath) => {
    if (!ALLOWED_FS_PATHS(filePath)) throw new Error('Invalid file path');
    fs.rmSync(filePath, { recursive: true, force: true });
  },
  renameSync: (oldPath, newPath) => {
    if (!ALLOWED_FS_PATHS(oldPath) || !ALLOWED_FS_PATHS(newPath)) throw new Error('Invalid file path');
    fs.renameSync(oldPath, newPath);
  },
  join: (...parts) => path.join(...parts),
  dirname: (p) => path.dirname(p),
  basename: (p) => path.basename(p),

  // ===================== MULTI-TERMINAL =====================
  getShells: () => detectShells(),

  terminalCreate: (shellId, cwd) => createTerminal(shellId, cwd),
  terminalWrite: (id, data) => {
    const t = terminals.get(id);
    if (t && t.process && !t.process.killed) t.process.stdin.write(data);
  },
  terminalResize: (id, cols, rows) => {
    const t = terminals.get(id);
    if (t && t.process && !t.process.killed) {
      try {
        t.process.stdout.columns = cols;
        t.process.stdout.rows = rows;
      } catch {}
    }
  },
  terminalClose: (id) => {
    const t = terminals.get(id);
    if (t) {
      if (t.process && !t.process.killed) t.process.kill();
      terminals.delete(id);
    }
  },

  // Listen for terminal data from preload (via custom event since preload can't directly call renderer)
  onTerminalData: (callback) => {
    const handler = (_event, id, data) => callback(id, data);
    ipcRenderer.on('terminal-data', handler);
    return () => ipcRenderer.removeListener('terminal-data', handler);
  },
  onTerminalExit: (callback) => {
    const handler = (_event, id, code) => callback(id, code);
    ipcRenderer.on('terminal-exit', handler);
    return () => ipcRenderer.removeListener('terminal-exit', handler);
  }
});
