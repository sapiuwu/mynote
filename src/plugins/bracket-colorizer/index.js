class BracketColorizerPlugin extends Plugin {
  static METADATA = {
    id: 'builtin.bracket-colorizer',
    name: 'Bracket Colorizer',
    version: '1.0.0',
    description: 'Colorizes matching brackets',
    author: 'MyNote'
  };

  async onActivate(ctx) {
    this.style = document.createElement('style');
    this.style.textContent = `
      .bracket-match {
        background: rgba(255, 255, 0, 0.2);
        outline: 1px solid rgba(255, 255, 0, 0.4);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(this.style);

    ctx.onEvent('editor:change', ({ tab }) => {
      this.highlightBrackets(tab, ctx);
    });
  }

  highlightBrackets(tab, ctx) {
    // Remove existing highlights
    document.querySelectorAll('.bracket-match').forEach(el => {
      el.classList.remove('bracket-match');
    });
  }

  async onDeactivate() {
    if (this.style) this.style.remove();
  }
}
