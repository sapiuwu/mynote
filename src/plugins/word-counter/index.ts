import { Plugin } from '../../core/domain/plugin';
import type { PluginContext } from '../../core/domain/plugin';

export class WordCounterPlugin extends Plugin {
  static METADATA = {
    id: 'builtin.word-counter',
    name: 'Word Counter',
    version: '1.0.0',
    description: 'Displays word and character count in status bar',
    author: 'MyNote'
  };

  private statusEl: HTMLElement | null = null;

  protected async onActivate(ctx: PluginContext): Promise<void> {
    this.statusEl = document.createElement('span');
    this.statusEl.className = 'status-item';
    this.statusEl.textContent = '0 chars';
    document.querySelector('.status-left')?.appendChild(this.statusEl);

    ctx.onEvent('editor:change', (data: unknown) => {
      const { tab } = data as { tab: { getContent: () => string } };
      const content = tab.getContent();
      if (this.statusEl) this.statusEl.textContent = `${content.length} chars`;
    });
  }

  protected async onDeactivate(): Promise<void> {
    if (this.statusEl) this.statusEl.remove();
  }
}
