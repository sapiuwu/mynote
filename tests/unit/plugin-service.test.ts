import { describe, it, expect, vi } from 'vitest';
import { PluginService } from '../../src/core/services/plugin-service';
import { Plugin } from '../../src/core/domain/plugin';

describe('PluginService', () => {
  const createMockEventBus = () => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  });

  it('should create plugin service', () => {
    const service = new PluginService(createMockEventBus());
    expect(service).toBeDefined();
  });

  it('should load a plugin', async () => {
    const service = new PluginService(createMockEventBus());
    const mockContext = {
      editor: {} as never,
      eventBus: createMockEventBus(),
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };
    const plugin = new Plugin({ id: 'test', name: 'Test' }, mockContext);

    await service.load(plugin);
    expect(service.getAllPlugins()).toContain(plugin);
  });

  it('should not load duplicate plugin', async () => {
    const service = new PluginService(createMockEventBus());
    const mockContext = {
      editor: {} as never,
      eventBus: createMockEventBus(),
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };
    const plugin = new Plugin({ id: 'test', name: 'Test' }, mockContext);

    await service.load(plugin);
    await service.load(plugin);
    expect(service.getAllPlugins().length).toBe(1);
  });

  it('should unload a plugin', async () => {
    const service = new PluginService(createMockEventBus());
    const mockContext = {
      editor: {} as never,
      eventBus: createMockEventBus(),
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };
    const plugin = new Plugin({ id: 'test', name: 'Test' }, mockContext);

    await service.load(plugin);
    await service.unload('test');
    expect(service.getAllPlugins().length).toBe(0);
  });

  it('should handle unloading non-existent plugin', async () => {
    const service = new PluginService(createMockEventBus());
    // Should not throw
    await service.unload('nonexistent');
  });

  it('should register command', () => {
    const service = new PluginService(createMockEventBus());
    const command = { id: 'test', label: 'Test', category: 'Test', execute: vi.fn() };
    service.registerCommand(command);
    expect(service.getAllCommands()).toContain(command);
  });

  it('should execute command', () => {
    const service = new PluginService(createMockEventBus());
    const execute = vi.fn();
    const command = { id: 'test', label: 'Test', category: 'Test', execute };
    service.registerCommand(command);
    service.executeCommand('test');
    expect(execute).toHaveBeenCalled();
  });

  it('should handle executing non-existent command', () => {
    const service = new PluginService(createMockEventBus());
    // Should not throw
    service.executeCommand('nonexistent');
  });

  it('should return all plugins', async () => {
    const service = new PluginService(createMockEventBus());
    const mockContext = {
      editor: {} as never,
      eventBus: createMockEventBus(),
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };
    const plugin1 = new Plugin({ id: 'test1', name: 'Test 1' }, mockContext);
    const plugin2 = new Plugin({ id: 'test2', name: 'Test 2' }, mockContext);

    await service.load(plugin1);
    await service.load(plugin2);
    expect(service.getAllPlugins().length).toBe(2);
  });

  it('should return all commands', () => {
    const service = new PluginService(createMockEventBus());
    const cmd1 = { id: 'test1', label: 'Test 1', category: 'Test', execute: vi.fn() };
    const cmd2 = { id: 'test2', label: 'Test 2', category: 'Test', execute: vi.fn() };
    service.registerCommand(cmd1);
    service.registerCommand(cmd2);
    expect(service.getAllCommands().length).toBe(2);
  });
});
