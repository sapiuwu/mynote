class PluginMetadata {
  constructor({ id, name, version, description, author, main }) {
    this.id = id;
    this.name = name;
    this.version = version || '1.0.0';
    this.description = description || '';
    this.author = author || '';
    this.main = main || 'index.js';
  }
}

class PluginContext {
  constructor({ editor, fileSystem, dialog, eventBus, settings }) {
    this.editor = editor;
    this.fileSystem = fileSystem;
    this.dialog = dialog;
    this.eventBus = eventBus;
    this.settings = settings;
  }

  registerCommand(command) {
    this.eventBus.emit('plugin:register-command', command);
  }

  registerStatusBar(item) {
    this.eventBus.emit('plugin:register-statusbar', item);
  }

  registerSidebarPanel(panel) {
    this.eventBus.emit('plugin:register-sidebar', panel);
  }

  registerMenu(menu) {
    this.eventBus.emit('plugin:register-menu', menu);
  }

  onEvent(event, handler) {
    this.eventBus.on(event, handler);
  }

  emitEvent(event, data) {
    this.eventBus.emit(event, data);
  }
}

class Plugin {
  constructor(metadata, context) {
    this.metadata = metadata instanceof PluginMetadata ? metadata : new PluginMetadata(metadata);
    this.context = context;
    this._disposables = [];
    this._activated = false;
  }

  async activate() {
    if (this._activated) return;
    this._activated = true;
    await this.onActivate(this.context);
  }

  async deactivate() {
    if (!this._activated) return;
    this._activated = false;
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
    await this.onDeactivate();
  }

  async onActivate(context) {}
  async onDeactivate() {}

  dispose(disposable) {
    this._disposables.push(disposable);
  }
}

if (typeof module !== 'undefined') module.exports = { PluginMetadata, PluginContext, Plugin };
