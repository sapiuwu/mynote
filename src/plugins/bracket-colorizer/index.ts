import { Plugin } from '../../core/domain/plugin';
import type { PluginContext } from '../../core/domain/plugin';

export class BracketColorizerPlugin extends Plugin {
  static METADATA = {
    id: 'builtin.bracket-colorizer',
    name: 'Bracket Colorizer',
    version: '1.0.0',
    description: 'Colorizes matching brackets',
    author: 'MyNote'
  };

  private style: HTMLStyleElement | null = null;

  protected async onActivate(ctx: PluginContext): Promise<void> {
    this.style = document.createElement('style');
    this.style.textContent = `
      .bracket-match {
        background: rgba(255, 255, 0, 0.2);
        outline: 1px solid rgba(255, 255, 0, 0.4);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(this.style);

    ctx.onEvent('editor:change', () => {
      this.clearHighlights();
    });
  }

  private clearHighlights(): void {
    document.querySelectorAll('.bracket-match').forEach(el => {
      el.classList.remove('bracket-match');
    });
  }

  protected async onDeactivate(): Promise<void> {
    if (this.style) this.style.remove();
  }
}
