import { Plugin } from '../../core/domain/plugin';
import type { PluginContext } from '../../core/domain/plugin';

export class MinimapPlugin extends Plugin {
  static METADATA = {
    id: 'builtin.minimap',
    name: 'Minimap',
    version: '1.0.0',
    description: 'Shows a minimap preview of the code',
    author: 'MyNote'
  };

  private style: HTMLStyleElement | null = null;

  protected async onActivate(_ctx: PluginContext): Promise<void> {
    this.style = document.createElement('style');
    this.style.textContent = `
      .minimap-container {
        width: 100px;
        background: var(--bg-primary);
        border-left: 1px solid var(--border);
        overflow: hidden;
        position: relative;
        flex-shrink: 0;
      }
      .minimap-container canvas {
        width: 100%;
        image-rendering: pixelated;
      }
      .minimap-viewport {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        pointer-events: none;
        transition: top 0.1s;
      }
    `;
    document.head.appendChild(this.style);
  }

  protected async onDeactivate(): Promise<void> {
    if (this.style) this.style.remove();
    document.querySelectorAll('.minimap-container').forEach(el => el.remove());
  }
}
