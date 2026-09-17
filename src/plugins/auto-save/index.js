class AutoSavePlugin extends Plugin {
  static METADATA = {
    id: 'builtin.auto-save',
    name: 'Auto Save',
    version: '1.0.0',
    description: 'Automatically saves files after changes',
    author: 'MyNote'
  };

  async onActivate(ctx) {
    this.interval = null;
    this.settings = ctx.settings;

    const autoSave = this.settings.get('autoSave');
    const autoSaveDelay = this.settings.get('autoSaveDelay') || 1000;

    if (autoSave) {
      this.startAutoSave(ctx, autoSaveDelay);
    }

    ctx.onEvent('settings:changed', ({ key, value }) => {
      if (key === 'autoSave') {
        if (value) this.startAutoSave(ctx, this.settings.get('autoSaveDelay') || 1000);
        else this.stopAutoSave();
      }
    });
  }

  startAutoSave(ctx, delay) {
    this.stopAutoSave();
    this.interval = setInterval(() => {
      ctx.eventBus.emit('command:save');
    }, delay);
  }

  stopAutoSave() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async onDeactivate() {
    this.stopAutoSave();
  }
}
