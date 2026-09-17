class Tab {
  static #counter = 0;

  constructor({ title = 'Untitled', content = '', filePath = null }) {
    this.id = Tab.#counter++;
    this.title = title;
    this.filePath = filePath;
    this.document = new Document(content);
    this.modified = false;
    this.active = false;
  }

  get language() {
    return LanguageDetector.detect(this.title);
  }

  markModified() {
    this.modified = true;
  }

  markSaved() {
    this.modified = false;
  }

  setContent(content) {
    this.document.setContent(content);
    this.markModified();
  }

  getContent() {
    return this.document.getContent();
  }
}

class Document {
  constructor(content = '') {
    this._content = content;
    this._undoStack = [];
    this._redoStack = [];
  }

  getContent() { return this._content; }

  setContent(content) {
    this._undoStack.push(this._content);
    this._redoStack = [];
    if (this._undoStack.length > 200) this._undoStack.shift();
    this._content = content;
  }

  undo() {
    if (this._undoStack.length === 0) return null;
    this._redoStack.push(this._content);
    this._content = this._undoStack.pop();
    return this._content;
  }

  redo() {
    if (this._redoStack.length === 0) return null;
    this._undoStack.push(this._content);
    this._content = this._redoStack.pop();
    return this._content;
  }

  get wordCount() {
    return this._content.trim() ? this._content.trim().split(/\s+/).length : 0;
  }

  get lineCount() {
    return this._content.split('\n').length;
  }

  get charCount() {
    return this._content.length;
  }

  insertAt(pos, text) {
    const before = this._content.substring(0, pos);
    const after = this._content.substring(pos);
    this.setContent(before + text + after);
    return pos + text.length;
  }

  deleteRange(start, end) {
    const before = this._content.substring(0, start);
    const after = this._content.substring(end);
    this.setContent(before + after);
    return start;
  }
}

class LanguageDetector {
  static MAP = {
    txt: 'Plain Text', py: 'Python', js: 'JavaScript', jsx: 'JSX',
    ts: 'TypeScript', tsx: 'TSX', html: 'HTML', htm: 'HTML',
    css: 'CSS', scss: 'SCSS', less: 'LESS', json: 'JSON',
    md: 'Markdown', xml: 'XML', yml: 'YAML', yaml: 'YAML',
    sh: 'Shell', bash: 'Bash', c: 'C', cpp: 'C++',
    h: 'C/C++', java: 'Java', rs: 'Rust', go: 'Go',
    rb: 'Ruby', php: 'PHP', sql: 'SQL', r: 'R',
    swift: 'Swift', kt: 'Kotlin', toml: 'TOML', ini: 'INI',
    dockerfile: 'Dockerfile', makefile: 'Makefile'
  };

  static detect(filename) {
    if (!filename) return 'Plain Text';
    const ext = filename.split('.').pop().toLowerCase();
    const base = filename.startsWith('.') ? filename.slice(1).toLowerCase() : filename.toLowerCase();
    return LanguageDetector.MAP[ext] || LanguageDetector.MAP[base] || 'Plain Text';
  }
}

if (typeof module !== 'undefined') module.exports = { Tab, Document, LanguageDetector };
