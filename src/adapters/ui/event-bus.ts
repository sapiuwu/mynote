import type { IEventBus } from '../../types';

type Handler = (data: unknown) => void;

export class EventEmitter implements IEventBus {
  private _handlers: Record<string, Handler[]>;

  constructor() {
    this._handlers = {};
  }

  on(event: string, handler: Handler): void {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
  }

  off(event: string, handler: Handler): void {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter(h => h !== handler);
  }

  emit(event: string, data?: unknown): void {
    (this._handlers[event] || []).forEach(h => h(data));
  }
}

export const eventBus = new EventEmitter();
