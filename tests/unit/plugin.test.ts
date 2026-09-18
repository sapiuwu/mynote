import { describe, it, expect } from 'vitest';
import { PluginMetadata, PluginContext, Plugin } from '../../src/core/domain/plugin';

describe('PluginMetadata', () => {
  it('should create metadata with required fields', () => {
    const meta = new PluginMetadata({ id: 'test', name: 'Test Plugin' });
    expect(meta.id).toBe('test');
    expect(meta.name).toBe('Test Plugin');
    expect(meta.version).toBe('1.0.0');
    expect(meta.description).toBe('');
    expect(meta.author).toBe('');
    expect(meta.main).toBe('index.js');
  });

  it('should create metadata with all fields', () => {
    const meta = new PluginMetadata({
      id: 'test',
      name: 'Test',
      version: '2.0.0',
      description: 'A test plugin',
      author: 'Tester',
      main: 'plugin.js'
    });
    expect(meta.version).toBe('2.0.0');
    expect(meta.description).toBe('A test plugin');
    expect(meta.author).toBe('Tester');
    expect(meta.main).toBe('plugin.js');
  });
});

describe('PluginContext', () => {
  it('should create context with required fields', () => {
    const mockEditor = {
      getActiveTab: () => null,
      getTabs: () => [],
      getSelection: () => null,
      setSelection: () => {},
      insertText: () => {},
      deleteSelection: () => {},
      getContent: () => '',
      setContent: () => {}
    };
    const mockEventBus = {
      on: () => {},
      off: () => {},
      emit: () => {}
    };
    const mockSettings = {
      get: () => null,
      set: () => {},
      getAll: () => ({})
    };

    const ctx = new PluginContext({
      editor: mockEditor,
      eventBus: mockEventBus,
      settings: mockSettings
    });

    expect(ctx.editor).toBe(mockEditor);
    expect(ctx.eventBus).toBe(mockEventBus);
    expect(ctx.settings).toBe(mockSettings);
  });
});

describe('Plugin', () => {
  it('should create plugin with metadata', () => {
    const mockContext = {
      editor: {} as never,
      eventBus: { on: () => {}, off: () => {}, emit: () => {} },
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };

    const meta = { id: 'test', name: 'Test Plugin' };
    const plugin = new Plugin(meta, mockContext);

    expect(plugin.metadata.id).toBe('test');
    expect(plugin.metadata.name).toBe('Test Plugin');
    expect(plugin._activated).toBe(false);
  });

  it('should create plugin from PluginMetadata instance', () => {
    const mockContext = {
      editor: {} as never,
      eventBus: { on: () => {}, off: () => {}, emit: () => {} },
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };

    const meta = new PluginMetadata({ id: 'test', name: 'Test' });
    const plugin = new Plugin(meta, mockContext);

    expect(plugin.metadata).toBe(meta);
  });

  it('should activate plugin', async () => {
    const mockContext = {
      editor: {} as never,
      eventBus: { on: () => {}, off: () => {}, emit: () => {} },
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };

    const plugin = new Plugin({ id: 'test', name: 'Test' }, mockContext);
    await plugin.activate();
    expect(plugin._activated).toBe(true);
  });

  it('should not activate twice', async () => {
    let callCount = 0;
    class TestPlugin extends Plugin {
      protected async onActivate(): Promise<void> {
        callCount++;
      }
    }

    const mockContext = {
      editor: {} as never,
      eventBus: { on: () => {}, off: () => {}, emit: () => {} },
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };

    const plugin = new TestPlugin({ id: 'test', name: 'Test' }, mockContext);
    await plugin.activate();
    await plugin.activate();
    expect(callCount).toBe(1);
  });

  it('should deactivate plugin', async () => {
    let deactivated = false;
    class TestPlugin extends Plugin {
      protected async onDeactivate(): Promise<void> {
        deactivated = true;
      }
    }

    const mockContext = {
      editor: {} as never,
      eventBus: { on: () => {}, off: () => {}, emit: () => {} },
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };

    const plugin = new TestPlugin({ id: 'test', name: 'Test' }, mockContext);
    await plugin.activate();
    await plugin.deactivate();
    expect(plugin._activated).toBe(false);
    expect(deactivated).toBe(true);
  });

  it('should not deactivate if not activated', async () => {
    let deactivated = false;
    class TestPlugin extends Plugin {
      protected async onDeactivate(): Promise<void> {
        deactivated = true;
      }
    }

    const mockContext = {
      editor: {} as never,
      eventBus: { on: () => {}, off: () => {}, emit: () => {} },
      settings: { get: () => null, set: () => {}, getAll: () => ({}) }
    };

    const plugin = new TestPlugin({ id: 'test', name: 'Test' }, mockContext);
    await plugin.deactivate();
    expect(deactivated).toBe(false);
  });
});
