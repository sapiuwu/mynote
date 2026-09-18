import { Plugin } from '../../core/domain/plugin';
import type { PluginContext } from '../../core/domain/plugin';
import type { SettingsPort, IEventBus } from '../../types';

export class AutoSavePlugin extends Plugin {
  static METADATA = {
    id: 'builtin.auto-save',
    name: 'Auto Save',
    version: '1.0.0',
    description: 'Automatically saves files after changes',
    author: 'MyNote'
  };

  private interval: ReturnType<typeof setInterval> | null = null;
  private settings: SettingsPort | null = null;
  private eventBus: IEventBus | null = null;

  protected async onActivate(ctx: PluginContext): Promise<void> {
    this.settings = ctx.settings;
    this.eventBus = ctx.eventBus;

    const autoSave = this.settings?.get('autoSave') as boolean;
    const autoSaveDelay = (this.settings?.get('autoSaveDelay') as number) || 1000;

    if (autoSave) {
      this.startAutoSave(autoSaveDelay);
    }

    ctx.onEvent('settings:changed', (data: unknown) => {
      const e = data as { key: string; value: boolean };
      if (e.key === 'autoSave') {
        if (e.value) this.startAutoSave((this.settings?.get('autoSaveDelay') as number) || 1000);
        else this.stopAutoSave();
      }
    });
  }

  private startAutoSave(delay: number): void {
    this.stopAutoSave();
    this.interval = setInterval(() => {
      this.eventBus?.emit('command:save');
    }, delay);
  }

  private stopAutoSave(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  protected async onDeactivate(): Promise<void> {
    this.stopAutoSave();
  }
}
