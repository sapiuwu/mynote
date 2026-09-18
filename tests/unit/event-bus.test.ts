import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from '../../src/adapters/ui/event-bus';

describe('EventEmitter', () => {
  it('should create event emitter', () => {
    const emitter = new EventEmitter();
    expect(emitter).toBeDefined();
  });

  it('should register and emit event', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.emit('test', 'data');
    expect(handler).toHaveBeenCalledWith('data');
  });

  it('should support multiple handlers', () => {
    const emitter = new EventEmitter();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    emitter.on('test', handler1);
    emitter.on('test', handler2);
    emitter.emit('test');
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should remove handler', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.off('test', handler);
    emitter.emit('test');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle emitting non-existent event', () => {
    const emitter = new EventEmitter();
    // Should not throw
    emitter.emit('nonexistent', 'data');
  });

  it('should handle removing non-existent handler', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    // Should not throw
    emitter.off('nonexistent', handler);
  });

  it('should handle removing non-existent event', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    // Should not throw
    emitter.off('nonexistent', handler);
    emitter.emit('test');
    expect(handler).toHaveBeenCalled();
  });

  it('should emit with no data', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test', handler);
    emitter.emit('test');
    expect(handler).toHaveBeenCalledWith(undefined);
  });

  it('should support complex data', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    const data = { nested: { value: 42 } };
    emitter.on('test', handler);
    emitter.emit('test', data);
    expect(handler).toHaveBeenCalledWith(data);
  });

  it('should not call handler for different events', () => {
    const emitter = new EventEmitter();
    const handler = vi.fn();
    emitter.on('test1', handler);
    emitter.emit('test2');
    expect(handler).not.toHaveBeenCalled();
  });
});
