class WordCounterPlugin extends Plugin {
  static METADATA = {
    id: 'builtin.word-counter',
    name: 'Word Counter',
    version: '1.0.0',
    description: 'Displays word and character count in status bar',
    author: 'MyNote'
  };

  async onActivate(ctx) {
    this.statusEl = document.createElement('span');
    this.statusEl.className = 'status-item';
    this.statusEl.textContent = '0 chars';
    document.querySelector('.status-left').appendChild(this.statusEl);

    ctx.onEvent('editor:change', ({ tab }) => {
      const content = tab.getContent();
      this.statusEl.textContent = `${content.length} chars`;
    });
  }

  async onDeactivate() {
    if (this.statusEl) this.statusEl.remove();
  }
}
