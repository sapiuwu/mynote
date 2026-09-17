class CommandPaletteUI {
  constructor(editorUI, eventBus) {
    this.editorUI = editorUI;
    this.bus = eventBus;
    this.commands = [];
    this.filtered = [];
    this.selectedIndex = 0;
    this._init();
  }

  _init() {
    this._panel = document.getElementById('command-palette');
    this._input = document.getElementById('command-input');
    this._list = document.getElementById('command-list');

    this._input.addEventListener('input', () => this._filter());
    this._input.addEventListener('keydown', (e) => this._handleKey(e));
    document.getElementById('command-palette-close').addEventListener('click', () => this.close());

    this._panel.addEventListener('click', (e) => {
      if (e.target === this._panel) this.close();
    });

    this._registerBuiltinCommands();
  }

  _registerBuiltinCommands() {
    this.commands = [
      { id: 'file.new', label: 'New Tab', category: 'File', shortcut: 'Ctrl+N', execute: () => this.editorUI.createTab() },
      { id: 'file.open', label: 'Open File', category: 'File', shortcut: 'Ctrl+O', execute: () => this.bus.emit('command:open') },
      { id: 'file.openFolder', label: 'Open Folder', category: 'File', shortcut: 'Ctrl+Shift+O', execute: () => this.bus.emit('command:openFolder') },
      { id: 'file.newFile', label: 'New File in Workspace', category: 'File', execute: () => this.bus.emit('command:newFile') },
      { id: 'file.newFolder', label: 'New Folder in Workspace', category: 'File', execute: () => this.bus.emit('command:newFolder') },
      { id: 'file.save', label: 'Save', category: 'File', shortcut: 'Ctrl+S', execute: () => this.bus.emit('command:save') },
      { id: 'file.saveAs', label: 'Save As...', category: 'File', shortcut: 'Ctrl+Shift+S', execute: () => this.bus.emit('command:saveAs') },
      { id: 'file.saveAll', label: 'Save All', category: 'File', shortcut: 'Ctrl+Shift+Alt+S', execute: () => this.bus.emit('command:saveAll') },
      { id: 'file.closeTab', label: 'Close Tab', category: 'File', shortcut: 'Ctrl+W', execute: () => { const t = this.editorUI.getActiveTab(); if (t) this.editorUI.closeTab(t.id); } },

      { id: 'edit.undo', label: 'Undo', category: 'Edit', shortcut: 'Ctrl+Z', execute: () => this.bus.emit('command:undo') },
      { id: 'edit.redo', label: 'Redo', category: 'Edit', shortcut: 'Ctrl+Y', execute: () => this.bus.emit('command:redo') },
      { id: 'edit.find', label: 'Find', category: 'Edit', shortcut: 'Ctrl+F', execute: () => this.bus.emit('command:find') },
      { id: 'edit.replace', label: 'Find and Replace', category: 'Edit', shortcut: 'Ctrl+H', execute: () => this.bus.emit('command:replace') },
      { id: 'edit.goToLine', label: 'Go to Line', category: 'Edit', shortcut: 'Ctrl+G', execute: () => this.bus.emit('command:gotoLine') },
      { id: 'edit.rename', label: 'Rename Active Tab (F2)', category: 'Edit', shortcut: 'F2', execute: () => { const t = this.editorUI.getActiveTab(); if (t) this.editorUI.startRenameTab(t.id); } },
      { id: 'edit.duplicateLine', label: 'Duplicate Line', category: 'Edit', shortcut: 'Ctrl+D', execute: () => this.bus.emit('command:duplicateLine') },
      { id: 'edit.deleteLine', label: 'Delete Line', category: 'Edit', shortcut: 'Ctrl+Shift+K', execute: () => this.bus.emit('command:deleteLine') },
      { id: 'edit.toUpperCase', label: 'Uppercase Selection', category: 'Edit', execute: () => this.bus.emit('command:toUpperCase') },
      { id: 'edit.toLowerCase', label: 'Lowercase Selection', category: 'Edit', execute: () => this.bus.emit('command:toLowerCase') },

      { id: 'view.wordWrap', label: 'Toggle Word Wrap', category: 'View', shortcut: 'Alt+Z', execute: () => this.editorUI.toggleWordWrap() },
      { id: 'view.lineNumbers', label: 'Toggle Line Numbers', category: 'View', execute: () => this.editorUI.toggleLineNumbers() },
      { id: 'view.zoomIn', label: 'Zoom In', category: 'View', shortcut: 'Ctrl+=', execute: () => this.editorUI.setZoom(this.editorUI.currentZoom + 10) },
      { id: 'view.zoomOut', label: 'Zoom Out', category: 'View', shortcut: 'Ctrl+-', execute: () => this.editorUI.setZoom(this.editorUI.currentZoom - 10) },
      { id: 'view.zoomReset', label: 'Reset Zoom', category: 'View', shortcut: 'Ctrl+0', execute: () => this.editorUI.setZoom(100) },
      { id: 'view.toggleSidebar', label: 'Toggle Sidebar', category: 'View', shortcut: 'Ctrl+B', execute: () => document.getElementById('sidebar').classList.toggle('collapsed') },
      { id: 'view.refreshExplorer', label: 'Refresh Explorer', category: 'View', execute: () => this.editorUI.refreshWorkspace() },

      { id: 'terminal.new', label: 'Open Terminal', category: 'Terminal', shortcut: 'Ctrl+`', execute: () => this.bus.emit('command:terminal') },

      { id: 'help.about', label: 'About MyNote', category: 'Help', execute: () => this.bus.emit('command:about') },
      { id: 'help.shortcuts', label: 'Keyboard Shortcuts', category: 'Help', shortcut: 'Ctrl+K Ctrl+S', execute: () => this.bus.emit('command:shortcuts') }
    ];
  }

  registerCommand(command) {
    this.commands.push(command);
  }

  open() {
    this._panel.classList.remove('hidden');
    this._input.value = '';
    this._input.focus();
    this._filter();
  }

  close() {
    this._panel.classList.add('hidden');
  }

  toggle() {
    if (this._panel.classList.contains('hidden')) this.open();
    else this.close();
  }

  _filter() {
    const query = this._input.value.toLowerCase();
    this.filtered = this.commands.filter(cmd =>
      cmd.label.toLowerCase().includes(query) ||
      cmd.category.toLowerCase().includes(query)
    );
    this.selectedIndex = 0;
    this._render();
  }

  _render() {
    this._list.innerHTML = '';
    let lastCategory = '';
    this.filtered.forEach((cmd, i) => {
      if (cmd.category !== lastCategory) {
        lastCategory = cmd.category;
        const cat = document.createElement('div');
        cat.className = 'command-category';
        cat.textContent = cmd.category;
        this._list.appendChild(cat);
      }
      const el = document.createElement('div');
      el.className = 'command-item' + (i === this.selectedIndex ? ' selected' : '');
      el.innerHTML = `
        <span class="command-label">${cmd.label}</span>
        ${cmd.shortcut ? `<span class="command-shortcut">${cmd.shortcut}</span>` : ''}
      `;
      el.addEventListener('click', () => this._execute(cmd));
      el.addEventListener('mouseenter', () => {
        this.selectedIndex = i;
        this._updateSelection();
      });
      this._list.appendChild(el);
    });
  }

  _updateSelection() {
    this._list.querySelectorAll('.command-item').forEach((el, i) => {
      el.classList.toggle('selected', i === this.selectedIndex);
    });
    const selected = this._list.querySelector('.command-item.selected');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }

  _handleKey(e) {
    if (e.key === 'Escape') { this.close(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.selectedIndex = Math.min(this.selectedIndex + 1, this.filtered.length - 1);
      this._updateSelection();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
      this._updateSelection();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.filtered[this.selectedIndex]) {
        this._execute(this.filtered[this.selectedIndex]);
      }
    }
  }

  _execute(cmd) {
    this.close();
    if (cmd.execute) cmd.execute();
  }
}
