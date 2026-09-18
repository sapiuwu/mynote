import type { PluginMetadataConfig, PluginContextConfig, Disposable, IEventBus, EditorPort, SettingsPort } from '../../types';

export class PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;

  constructor(config: PluginMetadataConfig) {
    this.id = config.id;
    this.name = config.name;
    this.version = config.version || '1.0.0';
    this.description = config.description || '';
    this.author = config.author || '';
    this.main = config.main || 'index.js';
  }
}

export class PluginContext {
  editor: EditorPort;
  eventBus: IEventBus;
  settings: SettingsPort;
  private fileSystem?: unknown;
  private dialog?: unknown;

  constructor(config: PluginContextConfig & { fileSystem?: unknown; dialog?: unknown }) {
    this.editor = config.editor;
    this.eventBus = config.eventBus;
    this.settings = config.settings;
    this.fileSystem = config.fileSystem;
    this.dialog = config.dialog;
  }

  registerCommand(command: { id: string; label: string; execute: () => void }): void {
    this.eventBus.emit('plugin:register-command', command);
  }

  registerStatusBar(item: { text: string; tooltip?: string }): void {
    this.eventBus.emit('plugin:register-statusbar', item);
  }

  registerSidebarPanel(panel: { id: string; title: string; render: () => HTMLElement }): void {
    this.eventBus.emit('plugin:register-sidebar', panel);
  }

  registerMenu(menu: { id: string; label: string; execute: () => void }): void {
    this.eventBus.emit('plugin:register-menu', menu);
  }

  onEvent(event: string, handler: (data: unknown) => void): void {
    this.eventBus.on(event, handler);
  }

  emitEvent(event: string, data?: unknown): void {
    this.eventBus.emit(event, data);
  }
}

export class Plugin {
  metadata: PluginMetadata;
  context: PluginContext;
  protected _disposables: Disposable[];
  _activated: boolean;

  constructor(metadata: PluginMetadataConfig | PluginMetadata, context: PluginContext) {
    this.metadata = metadata instanceof PluginMetadata ? metadata : new PluginMetadata(metadata);
    this.context = context;
    this._disposables = [];
    this._activated = false;
  }

  async activate(): Promise<void> {
    if (this._activated) return;
    this._activated = true;
    await this.onActivate(this.context);
  }

  async deactivate(): Promise<void> {
    if (!this._activated) return;
    this._activated = false;
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
    await this.onDeactivate();
  }

  protected async onActivate(_context: PluginContext): Promise<void> {}
  protected async onDeactivate(): Promise<void> {}

  protected dispose(disposable: Disposable): void {
    this._disposables.push(disposable);
  }
}
