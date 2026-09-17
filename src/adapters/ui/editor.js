class EditorUI {
  constructor(eventBus) {
    this.bus = eventBus;
    this.tabs = [];
    this.activeTab = null;
    this.tabCounter = 0;
    this.wordWrap = false;
    this.showLineNumbers = true;
    this.currentZoom = 100;
    this._elements = {};
    this.workspacePath = null;
    this.workspaceFiles = [];
  }

  init() {
    this._elements = {
      tabsScroll: document.getElementById('tabs-scroll'),
      editors: document.getElementById('editors'),
      newTabBtn: document.getElementById('new-tab-btn'),
      statusCursor: document.getElementById('status-cursor'),
      statusSelection: document.getElementById('status-selection'),
      statusWords: document.getElementById('status-words'),
      statusLines: document.getElementById('status-lines'),
      statusLanguage: document.getElementById('status-language'),
      statusZoom: document.getElementById('status-zoom'),
      sidebarFiles: document.getElementById('sidebar-files'),
      titlebarText: document.querySelector('.titlebar-text')
    };

    this._elements.newTabBtn.addEventListener('click', () => this.createTab());
    this._elements.statusZoom.addEventListener('click', () => this.setZoom(100));

    this.createTab();
  }

  createTab({ title = 'Untitled', content = '', filePath = null } = {}) {
    const id = this.tabCounter++;
    const tab = new Tab({ title, content, filePath });
    tab.id = id;
    tab.active = false;
    this.tabs.push(tab);

    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.dataset.id = id;
    tabEl.innerHTML = `
      <span class="tab-dot"></span>
      <span class="tab-title">${this._escapeHtml(title)}</span>
      <button class="tab-close">&times;</button>
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'editor-wrapper';
    wrapper.dataset.id = id;

    const container = document.createElement('div');
    container.className = 'editor-container';

    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'line-numbers';
    lineNumbers.id = `lines-${id}`;

    const textarea = document.createElement('textarea');
    textarea.id = `editor-${id}`;
    textarea.spellcheck = false;
    textarea.value = content;

    container.appendChild(lineNumbers);
    container.appendChild(textarea);
    wrapper.appendChild(container);
    this._elements.editors.appendChild(wrapper);
    this._elements.tabsScroll.appendChild(tabEl);

    tabEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-close')) return;
      this.switchTab(id);
    });

    tabEl.querySelector('.tab-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(id);
    });

    // Double-click tab to rename
    tabEl.querySelector('.tab-title').addEventListener('dblclick', (e) => {
      e.stopPropagation();
      this.startRenameTab(id);
    });

    textarea.addEventListener('input', () => {
      if (!tab.modified) {
        tab.markModified();
        tabEl.classList.add('modified');
        this._updateTitlebar();
      }
      this._updateLineNumbers(id);
      this.updateStatusBar();
      this._updateSidebar();
      this.bus.emit('editor:change', { tab, content: textarea.value });
    });

    textarea.addEventListener('scroll', () => {
      lineNumbers.scrollTop = textarea.scrollTop;
    });

    textarea.addEventListener('click', () => this.updateStatusBar());
    textarea.addEventListener('keyup', () => this.updateStatusBar());
    textarea.addEventListener('keydown', (e) => this._handleKeys(e, id));

    textarea.addEventListener('dragover', (e) => e.preventDefault());
    textarea.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(f => {
          this.bus.emit('file:drop', f.path);
        });
      }
    });

    this.switchTab(id);
    return tab;
  }

  startRenameTab(id) {
    const tab = this.tabs.find(t => t.id === id);
    const tabEl = document.querySelector(`.tab[data-id="${id}"]`);
    if (!tab || !tabEl) return;

    const titleSpan = tabEl.querySelector('.tab-title');
    const currentTitle = tab.title;

    titleSpan.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tab-rename-input';
    input.value = currentTitle;
    titleSpan.parentNode.insertBefore(input, titleSpan);
    input.focus();
    input.select();

    const finish = () => {
      const newTitle = input.value.trim() || currentTitle;
      tab.title = newTitle;
      titleSpan.textContent = newTitle;
      titleSpan.style.display = '';
      input.remove();
      this._updateSidebar();
      this._updateTitlebar();
      this.bus.emit('tab:renamed', { tab, oldTitle: currentTitle, newTitle });
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(); }
      if (e.key === 'Escape') { input.value = currentTitle; finish(); }
    });
  }

  switchTab(id) {
    const tab = this.tabs.find(t => t.id === id);
    if (!tab) return;

    this.tabs.forEach(t => t.active = false);
    tab.active = true;
    this.activeTab = tab;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.editor-wrapper').forEach(e => e.classList.remove('active'));

    const tabEl = document.querySelector(`.tab[data-id="${id}"]`);
    const wrapper = document.querySelector(`.editor-wrapper[data-id="${id}"]`);

    if (tabEl) tabEl.classList.add('active');
    if (wrapper) {
      wrapper.classList.add('active');
      wrapper.querySelector('textarea').focus();
    }

    this._updateLineNumbers(id);
    this.updateStatusBar();
    this._updateSidebar();
    this._updateTitlebar();
    this.bus.emit('tab:switch', tab);
  }

  closeTab(id) {
    const idx = this.tabs.findIndex(t => t.id === id);
    if (idx === -1) return;

    this.tabs.splice(idx, 1);

    const tabEl = document.querySelector(`.tab[data-id="${id}"]`);
    const wrapper = document.querySelector(`.editor-wrapper[data-id="${id}"]`);
    if (tabEl) tabEl.remove();
    if (wrapper) wrapper.remove();

    if (this.tabs.length === 0) {
      this.createTab();
    } else {
      const newActive = this.tabs[Math.min(idx, this.tabs.length - 1)];
      this.switchTab(newActive.id);
    }
  }

  getActiveTab() { return this.activeTab; }
  getActiveEditor() {
    const wrapper = document.querySelector('.editor-wrapper.active');
    return wrapper ? wrapper.querySelector('textarea') : null;
  }
  getTabs() { return this.tabs; }

  getSelection() {
    const editor = this.getActiveEditor();
    if (!editor) return null;
    return { start: editor.selectionStart, end: editor.selectionEnd };
  }

  setSelection(start, end) {
    const editor = this.getActiveEditor();
    if (editor) { editor.focus(); editor.setSelectionRange(start, end); }
  }

  insertText(text) {
    const editor = this.getActiveEditor();
    if (!editor) return;
    const pos = editor.selectionStart;
    const before = editor.value.substring(0, pos);
    const after = editor.value.substring(editor.selectionEnd);
    editor.value = before + text + after;
    editor.setSelectionRange(pos + text.length, pos + text.length);
    editor.dispatchEvent(new Event('input'));
  }

  deleteSelection() {
    const editor = this.getActiveEditor();
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return;
    editor.value = editor.value.substring(0, start) + editor.value.substring(end);
    editor.setSelectionRange(start, start);
    editor.dispatchEvent(new Event('input'));
  }

  getContent() {
    const editor = this.getActiveEditor();
    return editor ? editor.value : '';
  }

  setContent(content) {
    const editor = this.getActiveEditor();
    if (editor) { editor.value = content; editor.dispatchEvent(new Event('input')); }
  }

  updateStatusBar() {
    const editor = this.getActiveEditor();
    const tab = this.getActiveTab();
    if (!editor || !tab) return;

    const text = editor.value;
    const pos = editor.selectionStart;
    const before = text.substring(0, pos);
    const line = before.split('\n').length;
    const col = pos - before.lastIndexOf('\n');
    const selected = editor.selectionEnd - editor.selectionStart;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    const lang = LanguageDetector.detect(tab.title);

    this._elements.statusCursor.textContent = `Ln ${line}, Col ${col}`;
    const selEl = this._elements.statusSelection;
    if (selected > 0) {
      selEl.textContent = `${selected} selected`;
      selEl.classList.remove('hidden');
    } else {
      selEl.textContent = '';
      selEl.classList.add('hidden');
    }
    this._elements.statusWords.textContent = `${words} words`;
    this._elements.statusLines.textContent = `${lines} lines`;
    this._elements.statusLanguage.textContent = lang;
    this._elements.statusZoom.textContent = `${this.currentZoom}%`;
  }

  setZoom(val) {
    this.currentZoom = Math.max(50, Math.min(200, val));
    document.querySelectorAll('textarea').forEach(ta => {
      ta.style.fontSize = `${14 * this.currentZoom / 100}px`;
    });
    document.querySelectorAll('.line-numbers').forEach(ln => {
      ln.style.fontSize = `${14 * this.currentZoom / 100}px`;
    });
    this.updateStatusBar();
  }

  toggleWordWrap() {
    this.wordWrap = !this.wordWrap;
    document.querySelectorAll('textarea').forEach(ta => {
      ta.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre';
    });
  }

  toggleLineNumbers() {
    this.showLineNumbers = !this.showLineNumbers;
    document.querySelectorAll('.line-numbers').forEach(ln => {
      ln.style.display = this.showLineNumbers ? '' : 'none';
    });
  }

  // Workspace / Explorer
  async loadWorkspace(folderPath) {
    this.workspacePath = folderPath;
    this.workspaceFiles = await this._readDirRecursive(folderPath);
    this._renderWorkspace();
  }

  async _readDirRecursive(dirPath, depth = 0) {
    const items = [];
    try {
      const fs = require('fs');
      const path = require('path');
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          items.push({
            name: entry.name,
            path: fullPath,
            type: 'folder',
            children: await this._readDirRecursive(fullPath, depth + 1)
          });
        } else {
          items.push({ name: entry.name, path: fullPath, type: 'file' });
        }
      }
    } catch (err) {}
    return items;
  }

  _renderWorkspace() {
    const container = document.getElementById('explorer-workspace');
    if (!container) return;
    container.innerHTML = '';
    if (!this.workspacePath) {
      container.innerHTML = '<div class="explorer-empty">No folder opened</div>';
      return;
    }
    const folderName = this.workspacePath.split(/[/\\]/).pop();
    const rootEl = this._createTreeItem({ name: folderName, path: this.workspacePath, type: 'folder', children: this.workspaceFiles }, 0, true);
    container.appendChild(rootEl);
  }

  _createTreeItem(item, depth, isOpen = false) {
    const el = document.createElement('div');
    el.className = 'tree-item';
    el.style.paddingLeft = `${12 + depth * 16}px`;

    if (item.type === 'folder') {
      const header = document.createElement('div');
      header.className = 'tree-folder';
      header.innerHTML = `<span class="tree-arrow ${isOpen ? 'open' : ''}">&#9654;</span><span class="tree-icon">&#128193;</span><span class="tree-name">${this._escapeHtml(item.name)}</span>`;
      el.appendChild(header);

      const children = document.createElement('div');
      children.className = 'tree-children';
      children.style.display = isOpen ? 'block' : 'none';

      if (item.children) {
        item.children.forEach(child => {
          children.appendChild(this._createTreeItem(child, depth + 1));
        });
      }

      header.addEventListener('click', () => {
        const arrow = header.querySelector('.tree-arrow');
        const isOpenNow = children.style.display !== 'none';
        children.style.display = isOpenNow ? 'none' : 'block';
        arrow.classList.toggle('open', !isOpenNow);
      });

      header.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.bus.emit('explorer:contextmenu', { event: e, item });
      });

      el.appendChild(children);
    } else {
      const fileEl = document.createElement('div');
      fileEl.className = 'tree-file';
      fileEl.style.paddingLeft = `${12 + depth * 16}px`;

      const ext = item.name.split('.').pop().toLowerCase();
      const icon = this._getFileIcon(ext);
      fileEl.innerHTML = `<span class="tree-icon">${icon}</span><span class="tree-name">${this._escapeHtml(item.name)}</span>`;

      fileEl.addEventListener('click', () => this.bus.emit('explorer:openfile', item));
      fileEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.bus.emit('explorer:contextmenu', { event: e, item });
      });

      el.appendChild(fileEl);
    }
    return el;
  }

  _getFileIcon(ext) {
    const icons = {
      js: '📜', ts: '📜', py: '🐍', html: '🌐', css: '🎨',
      json: '📋', md: '📝', txt: '📄', xml: '📋', yml: '⚙️',
      yaml: '⚙️', sh: '🖥️', bat: '🖥️', c: '⚙️', cpp: '⚙️',
      h: '⚙️', java: '☕', rs: '🦀', go: '🔵', rb: '💎',
      php: '🐘', sql: '🗃️', png: '🖼️', jpg: '🖼️', gif: '🖼️',
      svg: '🖼️', pdf: '📕', zip: '📦'
    };
    return icons[ext] || '📄';
  }

  refreshWorkspace() {
    if (this.workspacePath) this.loadWorkspace(this.workspacePath);
  }

  async createFileInWorkspace(name, parentPath) {
    const fs = require('fs');
    const path = require('path');
    const filePath = parentPath ? path.join(parentPath, name) : path.join(this.workspacePath, name);
    try {
      fs.writeFileSync(filePath, '', 'utf-8');
      this.refreshWorkspace();
      this.bus.emit('explorer:openfile', { name, path: filePath, type: 'file' });
      return true;
    } catch (err) { return false; }
  }

  async createFolderInWorkspace(name, parentPath) {
    const fs = require('fs');
    const path = require('path');
    const folderPath = parentPath ? path.join(parentPath, name) : path.join(this.workspacePath, name);
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      this.refreshWorkspace();
      return true;
    } catch (err) { return false; }
  }

  async deleteFileInWorkspace(filePath) {
    const fs = require('fs');
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(filePath);
      }
      this.refreshWorkspace();
      return true;
    } catch (err) { return false; }
  }

  async renameFileInWorkspace(oldPath, newName) {
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    try {
      fs.renameSync(oldPath, newPath);
      this.refreshWorkspace();
      // Update tab if open
      const tab = this.tabs.find(t => t.filePath === oldPath);
      if (tab) {
        tab.filePath = newPath;
        tab.title = newName;
        const tabEl = document.querySelector(`.tab[data-id="${tab.id}"]`);
        if (tabEl) tabEl.querySelector('.tab-title').textContent = newName;
        this._updateSidebar();
        this._updateTitlebar();
      }
      return true;
    } catch (err) { return false; }
  }

  _updateSidebar() {
    const container = this._elements.sidebarFiles;
    if (!container) return;
    container.innerHTML = '';
    this.tabs.forEach(t => {
      const el = document.createElement('div');
      el.className = 'sidebar-file' + (t.active ? ' active' : '');
      const modified = t.modified ? '● ' : '';
      const ext = t.title.split('.').pop().toLowerCase();
      const icon = this._getFileIcon(ext);
      el.innerHTML = `<span class="tree-icon">${icon}</span><span>${modified}${this._escapeHtml(t.title)}</span>`;
      el.addEventListener('click', () => this.switchTab(t.id));
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this.startRenameTab(t.id);
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.bus.emit('tab:contextmenu', { event: e, tab: t });
      });
      container.appendChild(el);
    });
  }

  _updateTitlebar() {
    const tab = this.getActiveTab();
    const title = tab ? tab.title : 'MyNote';
    const prefix = tab && tab.modified ? '● ' : '';
    document.title = `${prefix}${title} - MyNote`;
    if (this._elements.titlebarText) {
      this._elements.titlebarText.textContent = `MyNote — ${title}`;
    }
  }

  _updateLineNumbers(id) {
    const lineEl = document.getElementById(`lines-${id}`);
    const textarea = document.getElementById(`editor-${id}`);
    if (!lineEl || !textarea) return;
    const lineCount = textarea.value.split('\n').length;
    const currentLine = textarea.value.substring(0, textarea.selectionStart).split('\n').length;
    let html = '';
    for (let i = 1; i <= lineCount; i++) {
      html += `<div class="${i === currentLine ? 'active-line' : ''}">${i}</div>`;
    }
    lineEl.innerHTML = html;
  }

  _handleKeys(e, id) {
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault();
      const idx = this.tabs.findIndex(t => t.id === id);
      const next = e.shiftKey ? (idx - 1 + this.tabs.length) % this.tabs.length : (idx + 1) % this.tabs.length;
      this.switchTab(this.tabs[next].id);
    }
    if (e.key === 'F2') {
      e.preventDefault();
      this.startRenameTab(id);
    }
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      const tab = this.tabs.find(t => t.id === id);
      if (tab) {
        const content = tab.document.undo();
        if (content !== null) {
          const editor = document.getElementById(`editor-${id}`);
          if (editor) editor.value = content;
        }
      }
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      const tab = this.tabs.find(t => t.id === id);
      if (tab) {
        const content = tab.document.redo();
        if (content !== null) {
          const editor = document.getElementById(`editor-${id}`);
          if (editor) editor.value = content;
        }
      }
    }
    // Tab key inserts spaces
    if (e.key === 'Tab' && !e.ctrlKey) {
      e.preventDefault();
      this.insertText('    ');
    }
  }

  _escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
}
