import type { ShellInfo, TerminalInstance } from '../../types';

interface TerminalTab {
  instance: TerminalInstance;
  tabEl: HTMLElement;
  bodyEl: HTMLElement;
  outputEl: HTMLElement;
  inputEl: HTMLInputElement;
}

export class TerminalUI {
  private _panel: HTMLElement;
  private _tabsContainer: HTMLElement;
  private _bodyEl: HTMLElement;
  private _tabs: Map<number, TerminalTab>;
  private _activeId: number | null;
  private _shellPickerVisible: boolean;

  constructor() {
    this._panel = document.getElementById('terminal-panel')!;
    this._bodyEl = this._panel.querySelector('.terminal-body') as HTMLElement;
    this._tabsContainer = this._panel.querySelector('.terminal-tabs') as HTMLElement;
    this._tabs = new Map();
    this._activeId = null;
    this._shellPickerVisible = false;
    this._init();
  }

  private _init(): void {
    document.getElementById('terminal-close')!.addEventListener('click', () => this.close());
    document.getElementById('terminal-new-btn')!.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showShellPicker(e as MouseEvent);
    });

    // Listen for terminal data from preload
    api.onTerminalData((id, data) => {
      const tab = this._tabs.get(id);
      if (tab) this._appendToOutput(tab, data);
    });

    api.onTerminalExit((id) => {
      const tab = this._tabs.get(id);
      if (tab) {
        this._appendToOutput(tab, '\r\n[Process exited]\r\n');
        tab.inputEl.disabled = true;
        tab.inputEl.placeholder = 'Process exited';
      }
    });

    // Close shell picker on outside click
    document.addEventListener('click', () => {
      this._hideShellPicker();
    });
  }

  open(): void {
    this._panel.classList.remove('hidden');
    if (this._tabs.size === 0) {
      this._showShellPickerAtCenter();
    } else if (this._activeId) {
      const tab = this._tabs.get(this._activeId);
      if (tab) tab.inputEl.focus();
    }
  }

  close(): void {
    this._panel.classList.add('hidden');
  }

  toggle(): void {
    if (this._panel.classList.contains('hidden')) this.open();
    else this.close();
  }

  private _showShellPicker(e: MouseEvent): void {
    this._hideShellPicker();
    const picker = document.createElement('div');
    picker.className = 'shell-picker';
    picker.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY - 10}px;z-index:5000;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,0.5);padding:4px 0;min-width:180px;`;

    const shells = api.getShells();
    shells.forEach(shell => {
      const item = document.createElement('div');
      item.className = 'shell-picker-item';
      item.style.cssText = 'padding:6px 14px;font-size:13px;color:var(--text-primary);cursor:pointer;white-space:nowrap;';
      item.textContent = shell.name;
      item.addEventListener('mouseenter', () => { item.style.background = 'var(--accent)'; item.style.color = '#fff'; });
      item.addEventListener('mouseleave', () => { item.style.background = ''; item.style.color = ''; });
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this._createTerminal(shell.id);
        this._hideShellPicker();
      });
      picker.appendChild(item);
    });

    document.body.appendChild(picker);
    this._shellPickerVisible = true;

    setTimeout(() => {
      document.addEventListener('click', () => this._hideShellPicker(), { once: true });
    }, 0);
  }

  private _showShellPickerAtCenter(): void {
    const rect = this._panel.getBoundingClientRect();
    const picker = document.createElement('div');
    picker.className = 'shell-picker';
    picker.style.cssText = `position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5000;background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.5);padding:16px 20px;min-width:220px;`;

    const title = document.createElement('div');
    title.style.cssText = 'font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:10px;';
    title.textContent = 'Select Terminal';
    picker.appendChild(title);

    const shells = api.getShells();
    shells.forEach(shell => {
      const item = document.createElement('div');
      item.style.cssText = 'padding:7px 12px;font-size:13px;color:var(--text-primary);cursor:pointer;border-radius:4px;margin-bottom:2px;';
      item.textContent = shell.name;
      item.addEventListener('mouseenter', () => { item.style.background = 'var(--accent)'; item.style.color = '#fff'; });
      item.addEventListener('mouseleave', () => { item.style.background = ''; item.style.color = ''; });
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this._createTerminal(shell.id);
        this._hideShellPicker();
      });
      picker.appendChild(item);
    });

    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:4999;';
    backdrop.addEventListener('click', () => {
      backdrop.remove();
      picker.remove();
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(picker);
  }

  private _hideShellPicker(): void {
    document.querySelectorAll('.shell-picker').forEach(el => el.remove());
    document.querySelectorAll('.shell-picker-backdrop').forEach(el => el.remove());
    this._shellPickerVisible = false;
  }

  private _createTerminal(shellId: string): void {
    const cwd = api.terminalGetCwd?.(this._activeId || 0) || undefined;
    const instance = api.terminalCreate(shellId, cwd);

    // Create tab element
    const tabEl = document.createElement('div');
    tabEl.className = 'terminal-tab';
    tabEl.dataset.id = String(instance.id);

    const label = document.createElement('span');
    label.className = 'terminal-tab-label';
    label.textContent = `${instance.shellName} ${instance.id}`;

    const closeBtn = document.createElement('span');
    closeBtn.className = 'terminal-tab-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._closeTerminal(instance.id);
    });

    tabEl.appendChild(label);
    tabEl.appendChild(closeBtn);
    tabEl.addEventListener('click', () => this._switchTab(instance.id));
    this._tabsContainer.appendChild(tabEl);

    // Create terminal body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'terminal-instance';
    bodyEl.dataset.id = String(instance.id);

    const outputEl = document.createElement('div');
    outputEl.className = 'terminal-output';
    outputEl.setAttribute('tabindex', '-1');

    const inputRow = document.createElement('div');
    inputRow.className = 'terminal-input-row';

    const prompt = document.createElement('span');
    prompt.className = 'terminal-prompt';
    prompt.textContent = '$';

    const inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'terminal-input';
    inputEl.spellcheck = false;
    inputEl.autocomplete = 'off';
    inputEl.setAttribute('autocapitalize', 'off');

    inputRow.appendChild(prompt);
    inputRow.appendChild(inputEl);
    bodyEl.appendChild(outputEl);
    bodyEl.appendChild(inputRow);
    this._bodyEl.appendChild(bodyEl);

    // Input handler
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const cmd = inputEl.value;
        this._appendToOutput(tab, `> ${cmd}\n`);
        api.terminalWrite(instance.id, cmd + '\r\n');
        inputEl.value = '';
      }
    });

    const tab: TerminalTab = { instance, tabEl, bodyEl, outputEl, inputEl };
    this._tabs.set(instance.id, tab);

    this._switchTab(instance.id);
    inputEl.focus();
  }

  private _switchTab(id: number): void {
    this._activeId = id;

    // Update tab active state
    this._tabs.forEach((tab, tabId) => {
      tab.tabEl.classList.toggle('active', tabId === id);
      tab.bodyEl.classList.toggle('active', tabId === id);
    });

    const tab = this._tabs.get(id);
    if (tab) tab.inputEl.focus();
  }

  private _closeTerminal(id: number): void {
    const tab = this._tabs.get(id);
    if (!tab) return;

    api.terminalClose(id);
    tab.tabEl.remove();
    tab.bodyEl.remove();
    this._tabs.delete(id);

    if (this._activeId === id) {
      const remaining = Array.from(this._tabs.keys());
      if (remaining.length > 0) {
        this._switchTab(remaining[remaining.length - 1]);
      } else {
        this._activeId = null;
        this._showShellPickerAtCenter();
      }
    }
  }

  private _appendToOutput(tab: TerminalTab, text: string): void {
    const span = document.createElement('span');
    span.textContent = text;
    tab.outputEl.appendChild(span);
    tab.outputEl.scrollTop = tab.outputEl.scrollHeight;
  }

  log(message: string): void {
    if (this._activeId) {
      const tab = this._tabs.get(this._activeId);
      if (tab) this._appendToOutput(tab, message + '\n');
    }
  }
}

const api = window.electronAPI;
