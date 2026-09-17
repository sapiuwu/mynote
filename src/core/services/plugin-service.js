class PluginService {
  constructor(eventBus, editorPort) {
    this.eventBus = eventBus;
    this.editor = editorPort;
    this.plugins = new Map();
    this.commands = new Map();
  }

  async load(plugin) {
    if (this.plugins.has(plugin.metadata.id)) return;
    this.plugins.set(plugin.metadata.id, plugin);
    await plugin.activate();
  }

  async unload(id) {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    await plugin.deactivate();
    this.plugins.delete(id);
  }

  async loadAll(pluginClasses, context) {
    for (const PluginClass of pluginClasses) {
      const metadata = PluginClass.METADATA;
      const plugin = new PluginClass(metadata, context);
      await this.load(plugin);
    }
  }

  registerCommand(command) {
    this.commands.set(command.id, command);
    this.eventBus.emit('commands-changed', Array.from(this.commands.values()));
  }

  executeCommand(commandId, ...args) {
    const cmd = this.commands.get(commandId);
    if (cmd && cmd.execute) cmd.execute(...args);
  }

  getAllCommands() {
    return Array.from(this.commands.values());
  }

  getAllPlugins() {
    return Array.from(this.plugins.values());
  }
}
