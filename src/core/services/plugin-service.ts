import type { IEventBus, Command } from '../../types';
import type { Plugin } from '../domain/plugin';

export class PluginService {
  private eventBus: IEventBus;
  private plugins: Map<string, Plugin>;
  private commands: Map<string, Command>;

  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus;
    this.plugins = new Map();
    this.commands = new Map();
  }

  async load(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.metadata.id)) return;
    this.plugins.set(plugin.metadata.id, plugin);
    await plugin.activate();
  }

  async unload(id: string): Promise<void> {
    const plugin = this.plugins.get(id);
    if (!plugin) return;
    await plugin.deactivate();
    this.plugins.delete(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async loadAll(pluginClasses: any[], context: unknown): Promise<void> {
    for (const PluginClass of pluginClasses) {
      const metadata = PluginClass.METADATA;
      const plugin = new PluginClass(metadata, context);
      await this.load(plugin);
    }
  }

  registerCommand(command: Command): void {
    this.commands.set(command.id, command);
    this.eventBus.emit('commands-changed', Array.from(this.commands.values()));
  }

  executeCommand(commandId: string, ...args: unknown[]): void {
    const cmd = this.commands.get(commandId);
    if (cmd && cmd.execute) cmd.execute(...args);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }
}
