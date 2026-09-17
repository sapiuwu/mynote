class EventEmitter {
  constructor() {
    this._handlers = {};
  }
  on(event, handler) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(handler);
  }
  off(event, handler) {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter(h => h !== handler);
  }
  emit(event, data) {
    (this._handlers[event] || []).forEach(h => h(data));
  }
}

const eventBus = new EventEmitter();
