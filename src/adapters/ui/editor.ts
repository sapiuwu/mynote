import { Tab } from '../../core/domain/tab';
import { SyntaxHighlighter } from '../../core/syntax-highlighter';
import type { IEventBus, TreeItem } from '../../types';

export class EditorUI {
  bus: IEventBus;
  tabs: Tab[];
  activeTab: Tab | null;
  private tabCounter: number;
  wordWrap: boolean;
  showLineNumbers: boolean;
  currentZoom: number;
  private _elements: Record<string, HTMLElement>;
  workspacePath: string | null;
  workspaceFiles: TreeItem[];

  constructor(bus: IEventBus) {
    this.bus = bus;
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

  init(): void {
    this._elements = {
      tabsScroll: document.getElementById('tabs-scroll')!,
      editors: document.getElementById('editors')!,
      newTabBtn: document.getElementById('new-tab-btn')!,
      statusCursor: document.getElementById('status-cursor')!,
      statusSelection: document.getElementById('status-selection')!,
      statusWords: document.getElementById('status-words')!,
      statusLines: document.getElementById('status-lines')!,
      statusLanguage: document.getElementById('status-language')!,
      statusZoom: document.getElementById('status-zoom')!,
      sidebarFiles: document.getElementById('sidebar-files')!,
      titlebarText: document.querySelector('.titlebar-text') as HTMLElement
    };

    this._elements.newTabBtn.addEventListener('click', () => this.createTab());
    this._elements.statusZoom.addEventListener('click', () => this.setZoom(100));

    this.createTab();
  }

  createTab(options: { title?: string; content?: string; filePath?: string | null } = {}): Tab {
    const { title = 'Untitled', content = '', filePath = null } = options;
    const id = this.tabCounter++;
    const tab = new Tab({ title, content, filePath });
    tab.id = id;
    tab.active = false;
    this.tabs.push(tab);

    const tabEl = document.createElement('div');
    tabEl.className = 'tab';
    tabEl.dataset.id = String(id);
    const icon = SyntaxHighlighter.getFileIcon(title);
    tabEl.innerHTML = `
      <span class="tab-file-icon" style="background:${icon.bg};color:${icon.color}">${icon.label}</span>
      <span class="tab-dot"></span>
      <span class="tab-title">${this._escapeHtml(title)}</span>
      <button class="tab-close">&times;</button>
    `;

    const wrapper = document.createElement('div');
    wrapper.className = 'editor-wrapper';
    wrapper.dataset.id = String(id);

    const container = document.createElement('div');
    container.className = 'editor-container';

    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'line-numbers';
    lineNumbers.id = `lines-${id}`;

    const highlightLayer = document.createElement('div');
    highlightLayer.className = 'highlight-layer';
    highlightLayer.id = `highlight-${id}`;

    const highlightCode = document.createElement('code');
    highlightCode.className = 'highlight-code';
    highlightLayer.appendChild(highlightCode);

    const textarea = document.createElement('textarea');
    textarea.id = `editor-${id}`;
    textarea.spellcheck = false;
    textarea.value = content;

    container.appendChild(lineNumbers);
    container.appendChild(highlightLayer);
    container.appendChild(textarea);
    wrapper.appendChild(container);
    this._elements.editors.appendChild(wrapper);
    this._elements.tabsScroll.appendChild(tabEl);

    tabEl.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).classList.contains('tab-close')) return;
      this.switchTab(id);
    });

    tabEl.querySelector('.tab-close')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(id);
    });

    tabEl.querySelector('.tab-title')!.addEventListener('dblclick', (e) => {
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
      this._updateHighlight(id);
      this.updateStatusBar();
      this._updateSidebar();
      this.bus.emit('editor:change', { tab, content: textarea.value });
    });

    textarea.addEventListener('scroll', () => {
      lineNumbers.scrollTop = textarea.scrollTop;
      highlightLayer.scrollTop = textarea.scrollTop;
      highlightLayer.scrollLeft = textarea.scrollLeft;
    });

    textarea.addEventListener('click', () => this.updateStatusBar());
    textarea.addEventListener('keyup', () => this.updateStatusBar());
    textarea.addEventListener('keydown', (e) => this._handleKeys(e, id));

    textarea.addEventListener('dragover', (e) => e.preventDefault());
    textarea.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        Array.from(files).forEach((f) => {
          const path = (f as unknown as { path: string }).path;
          if (path) this.bus.emit('file:drop', path);
        });
      }
    });

    this._updateHighlight(id);
    this.switchTab(id);
    return tab;
  }

  startRenameTab(id: number): void {
    const tab = this.tabs.find(t => t.id === id);
    const tabEl = document.querySelector(`.tab[data-id="${id}"]`);
    if (!tab || !tabEl) return;

    const titleSpan = tabEl.querySelector('.tab-title') as HTMLElement;
    const currentTitle = tab.title;

    titleSpan.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tab-rename-input';
    input.value = currentTitle;
    titleSpan.parentNode!.insertBefore(input, titleSpan);
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

  switchTab(id: number): void {
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
      (wrapper.querySelector('textarea') as HTMLTextAreaElement)?.focus();
    }

    this._updateLineNumbers(id);
    this._updateHighlight(id);
    this.updateStatusBar();
    this._updateSidebar();
    this._updateTitlebar();
    this.bus.emit('tab:switch', tab);
  }

  closeTab(id: number): void {
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

  getActiveTab(): Tab | null { return this.activeTab; }

  getActiveEditor(): HTMLTextAreaElement | null {
    const wrapper = document.querySelector('.editor-wrapper.active');
    return wrapper ? wrapper.querySelector('textarea') : null;
  }

  getTabs(): Tab[] { return this.tabs; }

  getSelection(): { start: number; end: number } | null {
    const editor = this.getActiveEditor();
    if (!editor) return null;
    return { start: editor.selectionStart, end: editor.selectionEnd };
  }

  setSelection(start: number, end: number): void {
    const editor = this.getActiveEditor();
    if (editor) { editor.focus(); editor.setSelectionRange(start, end); }
  }

  insertText(text: string): void {
    const editor = this.getActiveEditor();
    if (!editor) return;
    const pos = editor.selectionStart;
    const before = editor.value.substring(0, pos);
    const after = editor.value.substring(editor.selectionEnd);
    editor.value = before + text + after;
    editor.setSelectionRange(pos + text.length, pos + text.length);
    editor.dispatchEvent(new Event('input'));
    const tab = this.getActiveTab();
    if (tab) this._updateHighlight(tab.id);
  }

  deleteSelection(): void {
    const editor = this.getActiveEditor();
    if (!editor) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    if (start === end) return;
    editor.value = editor.value.substring(0, start) + editor.value.substring(end);
    editor.setSelectionRange(start, start);
    editor.dispatchEvent(new Event('input'));
    const tab = this.getActiveTab();
    if (tab) this._updateHighlight(tab.id);
  }

  getContent(): string {
    const editor = this.getActiveEditor();
    return editor ? editor.value : '';
  }

  setContent(content: string): void {
    const editor = this.getActiveEditor();
    if (editor) {
      editor.value = content;
      editor.dispatchEvent(new Event('input'));
      const tab = this.getActiveTab();
      if (tab) this._updateHighlight(tab.id);
    }
  }

  updateStatusBar(): void {
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
    const lang = SyntaxHighlighter.detectLanguage(tab.title);

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

  setZoom(val: number): void {
    this.currentZoom = Math.max(50, Math.min(200, val));
    const size = 14 * this.currentZoom / 100;
    document.querySelectorAll('textarea').forEach(ta => { (ta as HTMLElement).style.fontSize = `${size}px`; });
    document.querySelectorAll('.line-numbers').forEach(ln => { (ln as HTMLElement).style.fontSize = `${size}px`; });
    document.querySelectorAll('.highlight-layer').forEach(hl => { (hl as HTMLElement).style.fontSize = `${size}px`; });
    this.updateStatusBar();
  }

  toggleWordWrap(): void {
    this.wordWrap = !this.wordWrap;
    document.querySelectorAll('textarea').forEach(ta => { (ta as HTMLElement).style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre'; });
    document.querySelectorAll('.highlight-layer').forEach(hl => { (hl as HTMLElement).style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre'; });
  }

  toggleLineNumbers(): void {
    this.showLineNumbers = !this.showLineNumbers;
    document.querySelectorAll('.line-numbers').forEach(ln => {
      (ln as HTMLElement).style.display = this.showLineNumbers ? '' : 'none';
    });
  }

  async loadWorkspace(folderPath: string): Promise<void> {
    this.workspacePath = folderPath;
    this.workspaceFiles = await this._readDir(folderPath);
    this._renderWorkspace();
  }

  private async _readDir(dirPath: string): Promise<TreeItem[]> {
    const items: TreeItem[] = [];
    try {
      const api = window.electronAPI;
      const entries = api.readDir(dirPath);
      entries.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = api.join(dirPath, entry.name);
        if (entry.isDirectory) {
          items.push({ name: entry.name, path: fullPath, type: 'folder' });
        } else {
          items.push({ name: entry.name, path: fullPath, type: 'file' });
        }
      }
    } catch (_err) {}
    return items;
  }

  private _renderWorkspace(): void {
    const container = document.getElementById('explorer-workspace');
    if (!container) return;
    container.innerHTML = '';
    if (!this.workspacePath) {
      container.innerHTML = '<div class="explorer-empty">No folder opened</div>';
      return;
    }
    const folderName = this.workspacePath.split(/[/\\]/).pop() || '';
    const rootEl = this._createTreeItem({ name: folderName, path: this.workspacePath, type: 'folder', children: this.workspaceFiles }, 0, true);
    container.appendChild(rootEl);
  }

  private _createTreeItem(item: TreeItem, depth: number, isOpen: boolean = false): HTMLElement {
    const el = document.createElement('div');
    el.className = 'tree-item';

    const indent = `${8 + depth * 14}px`;

    if (item.type === 'folder') {
      const header = document.createElement('div');
      header.className = 'tree-folder';
      header.style.paddingLeft = indent;
      header.innerHTML = `<span class="tree-arrow ${isOpen ? 'open' : ''}">&#9654;</span><span class="tree-icon">&#128193;</span><span class="tree-name">${this._escapeHtml(item.name)}</span>`;
      el.appendChild(header);

      const children = document.createElement('div');
      children.className = 'tree-children';
      children.style.display = isOpen ? 'block' : 'none';

      if (isOpen && item.children) {
        item.children.forEach(child => {
          children.appendChild(this._createTreeItem(child, depth + 1));
        });
      }

      let loaded = isOpen && item.children && item.children.length > 0;

      header.addEventListener('click', async () => {
        const arrow = header.querySelector('.tree-arrow') as HTMLElement;
        const isOpenNow = children.style.display !== 'none';

        if (isOpenNow) {
          children.style.display = 'none';
          arrow.classList.remove('open');
        } else {
          if (!loaded) {
            children.innerHTML = '<div class="tree-loading" style="padding:2px 0;font-size:11px;color:var(--text-muted);">Loading...</div>';
            children.style.display = 'block';
            arrow.classList.add('open');
            try {
              const subItems = await this._readDir(item.path);
              item.children = subItems;
              children.innerHTML = '';
              subItems.forEach(child => {
                children.appendChild(this._createTreeItem(child, depth + 1));
              });
              loaded = true;
            } catch {
              children.innerHTML = '<div class="tree-loading" style="padding:2px 0;font-size:11px;color:var(--text-muted);">Failed to load</div>';
            }
          } else {
            children.style.display = 'block';
            arrow.classList.add('open');
          }
        }
      });

      header.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.bus.emit('explorer:contextmenu', { event: e, item });
      });

      el.appendChild(children);
    } else {
      const fileEl = document.createElement('div');
      fileEl.className = 'tree-file';
      fileEl.style.paddingLeft = indent;

      const icon = SyntaxHighlighter.getFileIcon(item.name);
      fileEl.innerHTML = `<span class="file-icon-badge" style="background:${icon.bg};color:${icon.color}">${icon.label}</span><span class="tree-name">${this._escapeHtml(item.name)}</span>`;

      fileEl.addEventListener('click', () => this.bus.emit('explorer:openfile', item));
      fileEl.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.bus.emit('explorer:contextmenu', { event: e, item });
      });

      el.appendChild(fileEl);
    }
    return el;
  }

  refreshWorkspace(): void {
    if (this.workspacePath) this.loadWorkspace(this.workspacePath);
  }

  async createFileInWorkspace(name: string, parentPath?: string): Promise<boolean> {
    const api = window.electronAPI;
    const filePath = parentPath ? api.join(parentPath, name) : api.join(this.workspacePath!, name);
    try {
      api.writeFile(filePath, '');
      this.refreshWorkspace();
      this.bus.emit('explorer:openfile', { name, path: filePath, type: 'file' });
      return true;
    } catch (_err) { return false; }
  }

  async createFolderInWorkspace(name: string, parentPath?: string): Promise<boolean> {
    const api = window.electronAPI;
    const folderPath = parentPath ? api.join(parentPath, name) : api.join(this.workspacePath!, name);
    try {
      api.mkdirSync(folderPath);
      this.refreshWorkspace();
      return true;
    } catch (_err) { return false; }
  }

  async deleteFileInWorkspace(filePath: string): Promise<boolean> {
    const api = window.electronAPI;
    try {
      const stat = api.statSync(filePath);
      if (stat.isDirectory) {
        api.rmSync(filePath);
      } else {
        api.unlinkSync(filePath);
      }
      this.refreshWorkspace();
      return true;
    } catch (_err) { return false; }
  }

  async renameFileInWorkspace(oldPath: string, newName: string): Promise<boolean> {
    const api = window.electronAPI;
    const dir = api.dirname(oldPath);
    const newPath = api.join(dir, newName);
    try {
      api.renameSync(oldPath, newPath);
      this.refreshWorkspace();
      const tab = this.tabs.find(t => t.filePath === oldPath);
      if (tab) {
        tab.filePath = newPath;
        tab.title = newName;
        const tabEl = document.querySelector(`.tab[data-id="${tab.id}"]`);
        if (tabEl) (tabEl.querySelector('.tab-title') as HTMLElement).textContent = newName;
        this._updateSidebar();
        this._updateTitlebar();
      }
      return true;
    } catch (_err) { return false; }
  }

  _updateSidebar(): void {
    const container = this._elements.sidebarFiles;
    if (!container) return;
    container.innerHTML = '';
    this.tabs.forEach(t => {
      const el = document.createElement('div');
      el.className = 'sidebar-file' + (t.active ? ' active' : '');
      const modified = t.modified ? '● ' : '';
      const icon = SyntaxHighlighter.getFileIcon(t.title);
      el.innerHTML = `<span class="file-icon-badge" style="background:${icon.bg};color:${icon.color}">${icon.label}</span><span>${modified}${this._escapeHtml(t.title)}</span>`;
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

  _updateTitlebar(): void {
    const tab = this.getActiveTab();
    const title = tab ? tab.title : 'MyNote';
    const prefix = tab && tab.modified ? '● ' : '';
    document.title = `${prefix}${title} - MyNote`;
    if (this._elements.titlebarText) {
      this._elements.titlebarText.textContent = `MyNote — ${title}`;
    }
  }

  private _updateLineNumbers(id: number): void {
    const lineEl = document.getElementById(`lines-${id}`);
    const textarea = document.getElementById(`editor-${id}`) as HTMLTextAreaElement;
    if (!lineEl || !textarea) return;
    const lineCount = textarea.value.split('\n').length;
    const currentLine = textarea.value.substring(0, textarea.selectionStart).split('\n').length;
    let html = '';
    for (let i = 1; i <= lineCount; i++) {
      html += `<div class="${i === currentLine ? 'active-line' : ''}">${i}</div>`;
    }
    lineEl.innerHTML = html;
  }

  private _updateHighlight(id: number): void {
    const highlightCode = document.querySelector(`#highlight-${id} .highlight-code`) as HTMLElement;
    const textarea = document.getElementById(`editor-${id}`) as HTMLTextAreaElement;
    const tab = this.tabs.find(t => t.id === id);
    if (!highlightCode || !textarea || !tab) return;

    const language = SyntaxHighlighter.detectLanguage(tab.title);
    const highlighted = SyntaxHighlighter.highlight(textarea.value, language);
    highlightCode.innerHTML = highlighted + '\n';
  }

  private _handleKeys(e: KeyboardEvent, id: number): void {
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
          const editor = document.getElementById(`editor-${id}`) as HTMLTextAreaElement;
          if (editor) { editor.value = content; this._updateHighlight(id); }
        }
      }
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      const tab = this.tabs.find(t => t.id === id);
      if (tab) {
        const content = tab.document.redo();
        if (content !== null) {
          const editor = document.getElementById(`editor-${id}`) as HTMLTextAreaElement;
          if (editor) { editor.value = content; this._updateHighlight(id); }
        }
      }
    }
    if (e.key === 'Tab' && !e.ctrlKey) {
      e.preventDefault();
      this.insertText('    ');
    }
  }

  _escapeHtml(text: string): string {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }
}
