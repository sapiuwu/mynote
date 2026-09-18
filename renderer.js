const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

let editorUI, findReplaceUI, commandPalette, gotoLineUI, terminalUI;

try {
  editorUI = new EditorUI(eventBus);
  editorUI.init();
  findReplaceUI = new FindReplaceUI(editorUI);
  commandPalette = new CommandPaletteUI(editorUI, eventBus);
  gotoLineUI = new GotoLineUI(editorUI);
  terminalUI = new TerminalUI();
} catch (err) {
  console.error('Editor init error:', err);
}

// Plugin context
const pluginContext = {
  editor: {
    getActiveTab: () => editorUI.getActiveTab(),
    getTabs: () => editorUI.getTabs(),
    getSelection: () => editorUI.getSelection(),
    setSelection: (s, e) => editorUI.setSelection(s, e),
    insertText: (t) => editorUI.insertText(t),
    deleteSelection: () => editorUI.deleteSelection(),
    getContent: () => editorUI.getContent(),
    setContent: (c) => editorUI.setContent(c)
  },
  eventBus,
  onEvent: (event, handler) => eventBus.on(event, handler),
  emitEvent: (event, data) => eventBus.emit(event, data),
  settings: {
    get: (key) => { try { return JSON.parse(localStorage.getItem(`setting:${key}`)); } catch { return null; } },
    set: (key, value) => { localStorage.setItem(`setting:${key}`, JSON.stringify(value)); eventBus.emit('settings:changed', { key, value }); },
    getAll: () => {
      const s = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('setting:')) try { s[k.replace('setting:', '')] = JSON.parse(localStorage.getItem(k)); } catch {}
      }
      return s;
    }
  }
};

let pluginService;
try {
  pluginService = new PluginService(eventBus, pluginContext.editor);
  pluginService.loadAll([WordCounterPlugin, AutoSavePlugin, BracketColorizerPlugin, MinimapPlugin], pluginContext).then(() => {
    updatePluginsSidebar();
  }).catch(err => console.error('Plugin load error:', err));
} catch (err) {
  console.error('PluginService init error:', err);
}

// ===================== FILE OPERATIONS =====================
async function openFile() {
  const result = await ipcRenderer.invoke('dialog:openFile', {
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Text', extensions: ['txt'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'JavaScript', extensions: ['js'] },
      { name: 'HTML', extensions: ['html'] },
      { name: 'CSS', extensions: ['css'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] }
    ]
  });
  if (result && result.filePaths) {
    for (const fp of result.filePaths) openFilePath(fp);
  }
}

function openFilePath(filePath) {
  try {
    const existing = editorUI.tabs.find(t => t.filePath === filePath);
    if (existing) { editorUI.switchTab(existing.id); return; }
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = filePath.split(/[/\\]/).pop();
    editorUI.createTab({ title: name, content, filePath });
  } catch (err) {
    terminalUI.log(`Error opening file: ${err.message}`);
  }
}

async function openFolder() {
  const result = await ipcRenderer.invoke('dialog:openFolder');
  if (result && result.filePaths && result.filePaths.length > 0) {
    editorUI.loadWorkspace(result.filePaths[0]);
    terminalUI.log(`Opened folder: ${result.filePaths[0]}`);
  }
}

async function saveFile() {
  const tab = editorUI.getActiveTab();
  if (!tab) return;
  if (tab.filePath) {
    try {
      const editor = document.getElementById(`editor-${tab.id}`);
      fs.writeFileSync(tab.filePath, editor ? editor.value : '', 'utf-8');
      tab.markSaved();
      const tabEl = document.querySelector(`.tab[data-id="${tab.id}"]`);
      if (tabEl) tabEl.classList.remove('modified');
      editorUI._updateTitlebar();
    } catch (err) { terminalUI.log(`Error saving: ${err.message}`); }
  } else { await saveFileAs(); }
}

async function saveFileAs() {
  const tab = editorUI.getActiveTab();
  if (!tab) return;
  const result = await ipcRenderer.invoke('dialog:saveFile', {
    defaultPath: tab.title,
    filters: [
      { name: 'Text', extensions: ['txt'] },
      { name: 'Python', extensions: ['py'] },
      { name: 'JavaScript', extensions: ['js'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (result && !result.canceled && result.filePath) {
    try {
      const editor = document.getElementById(`editor-${tab.id}`);
      fs.writeFileSync(result.filePath, editor ? editor.value : '', 'utf-8');
      tab.filePath = result.filePath;
      tab.title = result.filePath.split(/[/\\]/).pop();
      tab.markSaved();
      const tabEl = document.querySelector(`.tab[data-id="${tab.id}"]`);
      if (tabEl) { tabEl.classList.remove('modified'); tabEl.querySelector('.tab-title').textContent = tab.title; }
      editorUI._updateTitlebar();
      editorUI._updateSidebar();
    } catch (err) { terminalUI.log(`Error saving: ${err.message}`); }
  }
}

async function saveAll() {
  for (const tab of editorUI.getTabs()) {
    if (tab.modified && tab.filePath) {
      try {
        const editor = document.getElementById(`editor-${tab.id}`);
        if (editor) fs.writeFileSync(tab.filePath, editor.value, 'utf-8');
        tab.markSaved();
        const tabEl = document.querySelector(`.tab[data-id="${tab.id}"]`);
        if (tabEl) tabEl.classList.remove('modified');
      } catch {}
    }
  }
  editorUI._updateTitlebar();
}

// ===================== SEARCH PANEL =====================
function initSearch() {
  const input = document.getElementById('sidebar-find-input');
  const results = document.getElementById('sidebar-search-results');
  const matchCase = document.getElementById('sidebar-match-case');
  const wholeWord = document.getElementById('sidebar-whole-word');
  const useRegex = document.getElementById('sidebar-use-regex');

  function doSearch() {
    const query = input.value;
    results.innerHTML = '';
    if (!query) return;

    let regex;
    try {
      const flags = matchCase.checked ? 'g' : 'gi';
      regex = useRegex.checked ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch { return; }

    const files = editorUI.getTabs();
    let totalMatches = 0;

    files.forEach(tab => {
      const editor = document.getElementById(`editor-${tab.id}`);
      if (!editor) return;
      const content = editor.value;
      const fileMatches = [];

      let m;
      while ((m = regex.exec(content)) !== null) {
        const lineNum = content.substring(0, m.index).split('\n').length;
        const lineStart = content.lastIndexOf('\n', m.index) + 1;
        const lineEnd = content.indexOf('\n', m.index);
        const lineText = content.substring(lineStart, lineEnd === -1 ? content.length : lineEnd);
        fileMatches.push({ lineNum, lineText: lineText.trim(), start: m.index, length: m[0].length });
        totalMatches++;
        if (fileMatches.length > 50) break;
      }

      if (fileMatches.length > 0) {
        const fileEl = document.createElement('div');
        fileEl.className = 'search-file-result';
        fileEl.innerHTML = `<div class="search-file-name">${editorUI._escapeHtml(tab.title)}</div>`;

        fileMatches.forEach(fm => {
          const lineEl = document.createElement('div');
          lineEl.className = 'search-result-line';
          const highlighted = fm.lineText.substring(0, 100).replace(
            new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase.checked ? 'g' : 'gi'),
            '<span class="search-highlight">$&</span>'
          );
          lineEl.innerHTML = `<span class="search-line-num">Ln ${fm.lineNum}</span> <span class="search-line-text">${highlighted}</span>`;
          lineEl.addEventListener('click', () => {
            editorUI.switchTab(tab.id);
            editorUI.setSelection(fm.start, fm.start + fm.length);
          });
          fileEl.appendChild(lineEl);
        });

        results.appendChild(fileEl);
      }
    });

    results.innerHTML = `<div class="search-summary">${totalMatches} results in ${files.length} files</div>` + results.innerHTML;
  }

  input.addEventListener('input', doSearch);
  matchCase.addEventListener('change', doSearch);
  wholeWord.addEventListener('change', doSearch);
  useRegex.addEventListener('change', doSearch);
}

// ===================== PLUGINS PANEL =====================
function updatePluginsSidebar() {
  const container = document.getElementById('sidebar-plugins-list');
  if (!container) return;
  container.innerHTML = '';
  pluginService.getAllPlugins().forEach(p => {
    const el = document.createElement('div');
    el.className = 'plugin-item';
    const enabled = p._activated;
    el.innerHTML = `
      <div class="plugin-header">
        <span class="plugin-name">${p.metadata.name}</span>
        <label class="plugin-toggle">
          <input type="checkbox" ${enabled ? 'checked' : ''} data-plugin-id="${p.metadata.id}">
          <span class="plugin-toggle-slider"></span>
        </label>
      </div>
      <div class="plugin-desc">${p.metadata.description}</div>
      <div class="plugin-meta">v${p.metadata.version} by ${p.metadata.author || 'Unknown'}</div>
    `;
    el.querySelector('input[type="checkbox"]').addEventListener('change', async (e) => {
      if (e.target.checked) {
        await pluginService.load(p);
        terminalUI.log(`Plugin enabled: ${p.metadata.name}`);
      } else {
        await pluginService.unload(p.metadata.id);
        terminalUI.log(`Plugin disabled: ${p.metadata.name}`);
      }
      updatePluginsSidebar();
    });
    container.appendChild(el);
  });
}

// ===================== SETTINGS PANEL =====================
function initSettings() {
  const container = document.getElementById('settings-content');
  if (!container) return;

  const settings = [
    { key: 'autoSave', label: 'Auto Save', type: 'toggle', default: false },
    { key: 'autoSaveDelay', label: 'Auto Save Delay (ms)', type: 'number', default: 1000 },
    { key: 'fontSize', label: 'Font Size', type: 'number', default: 14 },
    { key: 'tabSize', label: 'Tab Size', type: 'number', default: 4 },
    { key: 'wordWrap', label: 'Word Wrap', type: 'toggle', default: false },
    { key: 'lineNumbers', label: 'Line Numbers', type: 'toggle', default: true },
    { key: 'minimap', label: 'Minimap', type: 'toggle', default: false },
    { key: 'bracketColorizer', label: 'Bracket Colorizer', type: 'toggle', default: true },
    { key: 'theme', label: 'Theme', type: 'select', options: ['Dark', 'Light', 'Monokai'], default: 'Dark' }
  ];

  container.innerHTML = '';
  settings.forEach(s => {
    const current = pluginContext.settings.get(s.key) ?? s.default;
    const row = document.createElement('div');
    row.className = 'settings-row';

    if (s.type === 'toggle') {
      row.innerHTML = `
        <span class="settings-label">${s.label}</span>
        <label class="plugin-toggle">
          <input type="checkbox" ${current ? 'checked' : ''} data-setting-key="${s.key}">
          <span class="plugin-toggle-slider"></span>
        </label>
      `;
      row.querySelector('input').addEventListener('change', (e) => {
        pluginContext.settings.set(s.key, e.target.checked);
        applySetting(s.key, e.target.checked);
      });
    } else if (s.type === 'number') {
      row.innerHTML = `
        <span class="settings-label">${s.label}</span>
        <input type="number" class="settings-input" value="${current}" data-setting-key="${s.key}" min="1">
      `;
      row.querySelector('input').addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        pluginContext.settings.set(s.key, val);
        applySetting(s.key, val);
      });
    } else if (s.type === 'select') {
      const opts = s.options.map(o => `<option value="${o}" ${current === o ? 'selected' : ''}>${o}</option>`).join('');
      row.innerHTML = `
        <span class="settings-label">${s.label}</span>
        <select class="settings-select" data-setting-key="${s.key}">${opts}</select>
      `;
      row.querySelector('select').addEventListener('change', (e) => {
        pluginContext.settings.set(s.key, e.target.value);
      });
    }
    container.appendChild(row);
  });
}

function applySetting(key, value) {
  switch (key) {
    case 'fontSize':
      document.querySelectorAll('textarea').forEach(ta => { ta.style.fontSize = `${value}px`; });
      document.querySelectorAll('.line-numbers').forEach(ln => { ln.style.fontSize = `${value}px`; });
      document.querySelectorAll('.highlight-layer').forEach(hl => { hl.style.fontSize = `${value}px`; });
      break;
    case 'tabSize':
      document.querySelectorAll('textarea').forEach(ta => { ta.style.tabSize = value; });
      document.querySelectorAll('.highlight-layer').forEach(hl => { hl.style.tabSize = value; });
      break;
    case 'wordWrap':
      document.querySelectorAll('textarea').forEach(ta => { ta.style.whiteSpace = value ? 'pre-wrap' : 'pre'; });
      document.querySelectorAll('.highlight-layer').forEach(hl => { hl.style.whiteSpace = value ? 'pre-wrap' : 'pre'; });
      break;
    case 'lineNumbers':
      document.querySelectorAll('.line-numbers').forEach(ln => { ln.style.display = value ? '' : 'none'; });
      break;
  }
}

// ===================== CONTEXT MENU =====================
let contextTarget = null;

function initContextMenu() {
  const menu = document.getElementById('context-menu');

  document.addEventListener('click', () => menu.classList.add('hidden'));

  menu.querySelectorAll('.ctx-item').forEach(item => {
    item.addEventListener('click', async () => {
      const action = item.dataset.action;
      if (!contextTarget) return;

      switch (action) {
        case 'new-file': {
          const name = prompt('File name:');
          if (name) await editorUI.createFileInWorkspace(name, contextTarget.type === 'folder' ? contextTarget.path : path.dirname(contextTarget.path));
          break;
        }
        case 'new-folder': {
          const name = prompt('Folder name:');
          if (name) await editorUI.createFolderInWorkspace(name, contextTarget.type === 'folder' ? contextTarget.path : path.dirname(contextTarget.path));
          break;
        }
        case 'rename': {
          const newName = prompt('New name:', contextTarget.name);
          if (newName && newName !== contextTarget.name) {
            await editorUI.renameFileInWorkspace(contextTarget.path, newName);
          }
          break;
        }
        case 'delete': {
          if (confirm(`Delete "${contextTarget.name}"?`)) {
            await editorUI.deleteFileInWorkspace(contextTarget.path);
          }
          break;
        }
        case 'copy-path':
          navigator.clipboard.writeText(contextTarget.path);
          terminalUI.log(`Copied: ${contextTarget.path}`);
          break;
        case 'copy-name':
          navigator.clipboard.writeText(contextTarget.name);
          terminalUI.log(`Copied: ${contextTarget.name}`);
          break;
      }
      menu.classList.add('hidden');
    });
  });
}

eventBus.on('explorer:contextmenu', ({ event, item }) => {
  contextTarget = item;
  const menu = document.getElementById('context-menu');
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.classList.remove('hidden');
});

eventBus.on('tab:contextmenu', ({ event, tab }) => {
  contextTarget = { name: tab.title, path: tab.filePath, type: 'file' };
  const menu = document.getElementById('context-menu');
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  menu.classList.remove('hidden');
});

eventBus.on('explorer:openfile', (item) => {
  if (item.path) openFilePath(item.path);
});

// ===================== SIDEBAR =====================
function initSidebar() {
  document.querySelectorAll('.activity-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      const isActive = btn.classList.contains('active');
      document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
      if (isActive) {
        document.getElementById('sidebar').classList.add('collapsed');
      } else {
        btn.classList.add('active');
        const panelEl = document.getElementById(`sidebar-${panel}`);
        if (panelEl) panelEl.classList.add('active');
        document.getElementById('sidebar').classList.remove('collapsed');
      }
    });
  });

  document.querySelector('.activity-btn[data-action="settings"]')?.addEventListener('click', () => {
    const btn = document.querySelector('.activity-btn[data-action="settings"]');
    const isActive = btn.classList.contains('active');
    document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
    if (isActive) {
      document.getElementById('sidebar').classList.add('collapsed');
    } else {
      btn.classList.add('active');
      document.getElementById('sidebar-settings').classList.add('active');
      document.getElementById('sidebar').classList.remove('collapsed');
      initSettings();
    }
  });

  // Explorer section toggles
  document.querySelectorAll('.explorer-section-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('.explorer-actions')) return;
      const content = header.nextElementSibling;
      const arrow = header.querySelector('.explorer-arrow');
      if (content) {
        const isOpen = content.style.display !== 'none';
        content.style.display = isOpen ? 'none' : 'block';
        if (arrow) arrow.classList.toggle('open', !isOpen);
      }
    });
  });

  // Explorer buttons
  document.getElementById('btn-new-file')?.addEventListener('click', async () => {
    if (!editorUI.workspacePath) {
      await openFolder();
      if (!editorUI.workspacePath) return;
    }
    const name = prompt('File name:');
    if (name) await editorUI.createFileInWorkspace(name);
  });

  document.getElementById('btn-new-folder')?.addEventListener('click', async () => {
    if (!editorUI.workspacePath) {
      await openFolder();
      if (!editorUI.workspacePath) return;
    }
    const name = prompt('Folder name:');
    if (name) await editorUI.createFolderInWorkspace(name);
  });

  document.getElementById('btn-open-folder')?.addEventListener('click', () => openFolder());
}

// ===================== IPC =====================
ipcRenderer.on('menu-new-tab', () => editorUI.createTab());
ipcRenderer.on('menu-open', () => openFile());
ipcRenderer.on('menu-save', () => saveFile());
ipcRenderer.on('menu-saveAs', () => saveFileAs());
ipcRenderer.on('menu-saveAll', () => saveAll());
ipcRenderer.on('menu-closeTab', () => { const t = editorUI.getActiveTab(); if (t) editorUI.closeTab(t.id); });
ipcRenderer.on('menu-find', () => findReplaceUI.open(false));
ipcRenderer.on('menu-replace', () => findReplaceUI.open(true));
ipcRenderer.on('menu-gotoLine', () => gotoLineUI.open());
ipcRenderer.on('menu-commandPalette', () => commandPalette.toggle());
ipcRenderer.on('menu-wordWrap', () => editorUI.toggleWordWrap());
ipcRenderer.on('menu-lineNumbers', () => editorUI.toggleLineNumbers());
ipcRenderer.on('menu-sidebar', () => document.getElementById('sidebar').classList.toggle('collapsed'));
ipcRenderer.on('menu-zoomIn', () => editorUI.setZoom(editorUI.currentZoom + 10));
ipcRenderer.on('menu-zoomOut', () => editorUI.setZoom(editorUI.currentZoom - 10));
ipcRenderer.on('menu-zoomReset', () => editorUI.setZoom(100));
ipcRenderer.on('menu-terminal', () => terminalUI.toggle());
ipcRenderer.on('menu-openFolder', () => openFolder());
ipcRenderer.on('window-maximized', (e, max) => {
  const btn = document.getElementById('btn-maximize');
  if (btn) btn.innerHTML = max ? '&#9723;' : '&#9723;';
});

// ===================== EVENT BUS COMMANDS =====================
eventBus.on('command:open', () => openFile());
eventBus.on('command:openFolder', () => openFolder());
eventBus.on('command:newFile', async () => {
  if (!editorUI.workspacePath) { await openFolder(); if (!editorUI.workspacePath) return; }
  const name = prompt('File name:');
  if (name) await editorUI.createFileInWorkspace(name);
});
eventBus.on('command:newFolder', async () => {
  if (!editorUI.workspacePath) { await openFolder(); if (!editorUI.workspacePath) return; }
  const name = prompt('Folder name:');
  if (name) await editorUI.createFolderInWorkspace(name);
});
eventBus.on('command:save', () => saveFile());
eventBus.on('command:saveAs', () => saveFileAs());
eventBus.on('command:saveAll', () => saveAll());
eventBus.on('command:find', () => findReplaceUI.open(false));
eventBus.on('command:replace', () => findReplaceUI.open(true));
eventBus.on('command:gotoLine', () => gotoLineUI.open());
eventBus.on('command:terminal', () => terminalUI.toggle());
eventBus.on('command:undo', () => {
  const tab = editorUI.getActiveTab();
  if (tab) { const c = tab.document.undo(); if (c !== null) editorUI.setContent(c); }
});
eventBus.on('command:redo', () => {
  const tab = editorUI.getActiveTab();
  if (tab) { const c = tab.document.redo(); if (c !== null) editorUI.setContent(c); }
});
eventBus.on('command:duplicateLine', () => {
  const tab = editorUI.getActiveTab();
  if (!tab) return;
  const content = editorUI.getContent();
  const pos = editorUI.getSelection()?.start || 0;
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
  let lineEnd = content.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = content.length;
  const line = content.substring(lineStart, lineEnd);
  editorUI.setContent(content.substring(0, lineEnd) + '\n' + line + content.substring(lineEnd));
  editorUI.setSelection(lineEnd + 1, lineEnd + 1);
});
eventBus.on('command:deleteLine', () => {
  const tab = editorUI.getActiveTab();
  if (!tab) return;
  const content = editorUI.getContent();
  const pos = editorUI.getSelection()?.start || 0;
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
  let lineEnd = content.indexOf('\n', pos);
  if (lineEnd === -1) lineEnd = content.length; else lineEnd += 1;
  editorUI.setContent(content.substring(0, lineStart) + content.substring(lineEnd));
  editorUI.setSelection(lineStart, lineStart);
});
eventBus.on('command:toUpperCase', () => {
  const tab = editorUI.getActiveTab(); const sel = editorUI.getSelection();
  if (!tab || !sel || sel.start === sel.end) return;
  const content = editorUI.getContent();
  const text = content.substring(sel.start, sel.end).toUpperCase();
  editorUI.setContent(content.substring(0, sel.start) + text + content.substring(sel.end));
});
eventBus.on('command:toLowerCase', () => {
  const tab = editorUI.getActiveTab(); const sel = editorUI.getSelection();
  if (!tab || !sel || sel.start === sel.end) return;
  const content = editorUI.getContent();
  const text = content.substring(sel.start, sel.end).toLowerCase();
  editorUI.setContent(content.substring(0, sel.start) + text + content.substring(sel.end));
});
eventBus.on('command:about', () => {
  terminalUI.log('MyNote v3.0.0 - Hexagonal Architecture with Plugin Support');
});
eventBus.on('command:shortcuts', () => {
  terminalUI.open();
  terminalUI.log('=== Keyboard Shortcuts ===');
  terminalUI.log('Ctrl+N          New Tab');
  terminalUI.log('Ctrl+O          Open File');
  terminalUI.log('Ctrl+K Ctrl+O   Open Folder');
  terminalUI.log('Ctrl+S          Save');
  terminalUI.log('Ctrl+Shift+S    Save As');
  terminalUI.log('Ctrl+W          Close Tab');
  terminalUI.log('Ctrl+F          Find');
  terminalUI.log('Ctrl+H          Replace');
  terminalUI.log('Ctrl+G          Go to Line');
  terminalUI.log('Ctrl+D          Duplicate Line');
  terminalUI.log('Ctrl+Shift+P    Command Palette');
  terminalUI.log('Ctrl+B          Toggle Sidebar');
  terminalUI.log('Ctrl+`          Terminal');
  terminalUI.log('F2              Rename');
  terminalUI.log('Alt+Z           Word Wrap');
  terminalUI.log('Ctrl+/-         Zoom');
  terminalUI.log('Ctrl+Tab        Next Tab');
});
eventBus.on('file:drop', (filePath) => openFilePath(filePath));
eventBus.on('tab:renamed', () => editorUI._updateSidebar());

// ===================== KEYBOARD (capture phase - runs before textarea) =====================
window.addEventListener('keydown', (e) => {
  const ctrl = e.ctrlKey || e.metaKey;

  if (ctrl && e.key === 'n') { e.preventDefault(); e.stopPropagation(); editorUI.createTab(); return; }
  if (ctrl && !e.shiftKey && e.key === 'o') { e.preventDefault(); e.stopPropagation(); openFile(); return; }
  if (ctrl && e.shiftKey && (e.key === 'O' || e.key === 'o')) { e.preventDefault(); e.stopPropagation(); openFolder(); return; }
  if (ctrl && e.key === 's') { e.preventDefault(); e.stopPropagation(); e.shiftKey ? saveFileAs() : saveFile(); return; }
  if (ctrl && e.key === 'w') { e.preventDefault(); e.stopPropagation(); const t = editorUI.getActiveTab(); if (t) editorUI.closeTab(t.id); return; }
  if (ctrl && e.key === 'f') { e.preventDefault(); e.stopPropagation(); findReplaceUI.open(false); return; }
  if (ctrl && e.key === 'h') { e.preventDefault(); e.stopPropagation(); findReplaceUI.open(true); return; }
  if (ctrl && e.key === 'g') { e.preventDefault(); e.stopPropagation(); gotoLineUI.open(); return; }
  if (ctrl && e.shiftKey && (e.key === 'P' || e.key === 'p')) { e.preventDefault(); e.stopPropagation(); commandPalette.toggle(); return; }
  if (ctrl && e.key === 'b') {
    e.preventDefault(); e.stopPropagation();
    const sidebar = document.getElementById('sidebar');
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (isCollapsed) {
      sidebar.classList.remove('collapsed');
      const firstBtn = document.querySelector('.activity-btn[data-panel]');
      if (firstBtn) {
        document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
        firstBtn.classList.add('active');
        const panel = firstBtn.dataset.panel;
        document.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
        const panelEl = document.getElementById(`sidebar-${panel}`);
        if (panelEl) panelEl.classList.add('active');
      }
    } else {
      sidebar.classList.add('collapsed');
      document.querySelectorAll('.activity-btn').forEach(b => b.classList.remove('active'));
    }
    return;
  }
  if (ctrl && e.key === '`') { e.preventDefault(); e.stopPropagation(); terminalUI.toggle(); return; }
  if (ctrl && e.key === '=') { e.preventDefault(); e.stopPropagation(); editorUI.setZoom(editorUI.currentZoom + 10); return; }
  if (ctrl && e.key === '-') { e.preventDefault(); e.stopPropagation(); editorUI.setZoom(editorUI.currentZoom - 10); return; }
  if (ctrl && e.key === '0') { e.preventDefault(); e.stopPropagation(); editorUI.setZoom(100); return; }
  if (e.altKey && e.key === 'z') { e.preventDefault(); e.stopPropagation(); editorUI.toggleWordWrap(); return; }
  if (e.key === 'F11') { e.preventDefault(); e.stopPropagation(); ipcRenderer.send('window-maximize'); return; }
  if (e.key === 'Escape') { findReplaceUI.close(); gotoLineUI.close(); commandPalette.close(); return; }
}, true);

// ===================== WINDOW CONTROLS =====================
document.getElementById('btn-minimize')?.addEventListener('click', () => ipcRenderer.send('window-minimize'));
document.getElementById('btn-maximize')?.addEventListener('click', () => ipcRenderer.send('window-maximize'));
document.getElementById('btn-close')?.addEventListener('click', () => ipcRenderer.send('window-close'));
document.getElementById('terminal-close')?.addEventListener('click', () => terminalUI.close());

// ===================== INIT =====================
try {
  initSidebar();
  initSearch();
  initContextMenu();
  terminalUI.log('MyNote v3.1.0 ready.');
  terminalUI.log('Ctrl+Shift+P = Command Palette | Ctrl+B = Sidebar | Ctrl+` = Terminal');
} catch (err) {
  console.error('Init error:', err);
}
