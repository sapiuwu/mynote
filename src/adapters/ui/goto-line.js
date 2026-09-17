class GotoLineUI {
  constructor(editorUI) {
    this.editorUI = editorUI;
    this._init();
  }

  _init() {
    this._panel = document.getElementById('goto-panel');
    this._input = document.getElementById('goto-input');
    document.getElementById('goto-go').addEventListener('click', () => this._go());
    document.getElementById('goto-close').addEventListener('click', () => this.close());
    this._input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._go();
      if (e.key === 'Escape') this.close();
    });
  }

  open() {
    this._panel.classList.remove('hidden');
    this._input.value = '';
    this._input.focus();
  }

  close() {
    this._panel.classList.add('hidden');
  }

  _go() {
    const line = parseInt(this._input.value);
    if (isNaN(line) || line < 1) return;
    const tab = this.editorUI.getActiveTab();
    if (!tab) return;
    const lines = tab.getContent().split('\n');
    const target = Math.min(line, lines.length);
    let pos = 0;
    for (let i = 0; i < target - 1; i++) pos += lines[i].length + 1;
    this.editorUI.setSelection(pos, pos);
    const editor = this.editorUI.getActiveEditor();
    if (editor) {
      const lineHeight = 22.4;
      editor.scrollTop = (target - 5) * lineHeight;
    }
    this.close();
  }
}
