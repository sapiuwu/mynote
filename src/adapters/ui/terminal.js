class TerminalUI {
  constructor() {
    this._init();
  }

  _init() {
    this._panel = document.getElementById('terminal-panel');
    this._output = document.getElementById('terminal-output');
    this._input = document.getElementById('terminal-input');
    this._input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._execute();
    });
  }

  open() {
    this._panel.classList.remove('hidden');
    this._input.focus();
  }

  close() {
    this._panel.classList.add('hidden');
  }

  toggle() {
    if (this._panel.classList.contains('hidden')) this.open();
    else this.close();
  }

  _execute() {
    const cmd = this._input.value.trim();
    if (!cmd) return;

    this._appendLine(`> ${cmd}`);
    this._input.value = '';

    try {
      const { execSync } = require('child_process');
      const result = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 10000,
        windowsHide: true
      });
      if (result) this._appendLine(result);
    } catch (err) {
      this._appendLine(err.message || 'Command failed');
    }

    this._output.scrollTop = this._output.scrollHeight;
  }

  _appendLine(text) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.textContent = text;
    this._output.appendChild(line);
  }

  log(message) {
    this._appendLine(message);
    this._output.scrollTop = this._output.scrollHeight;
  }
}
