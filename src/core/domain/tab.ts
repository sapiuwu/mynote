import type { TabOptions } from '../../types';

export class Document {
  private _content: string;
  private _undoStack: string[];
  private _redoStack: string[];
  private static readonly MAX_UNDO = 200;

  constructor(content: string = '') {
    this._content = content;
    this._undoStack = [];
    this._redoStack = [];
  }

  getContent(): string {
    return this._content;
  }

  setContent(content: string): void {
    this._undoStack.push(this._content);
    this._redoStack = [];
    if (this._undoStack.length > Document.MAX_UNDO) this._undoStack.shift();
    this._content = content;
  }

  undo(): string | null {
    if (this._undoStack.length === 0) return null;
    this._redoStack.push(this._content);
    this._content = this._undoStack.pop()!;
    return this._content;
  }

  redo(): string | null {
    if (this._redoStack.length === 0) return null;
    this._undoStack.push(this._content);
    this._content = this._redoStack.pop()!;
    return this._content;
  }

  get wordCount(): number {
    return this._content.trim() ? this._content.trim().split(/\s+/).length : 0;
  }

  get lineCount(): number {
    return this._content.split('\n').length;
  }

  get charCount(): number {
    return this._content.length;
  }

  insertAt(pos: number, text: string): number {
    const before = this._content.substring(0, pos);
    const after = this._content.substring(pos);
    this.setContent(before + text + after);
    return pos + text.length;
  }

  deleteRange(start: number, end: number): number {
    const before = this._content.substring(0, start);
    const after = this._content.substring(end);
    this.setContent(before + after);
    return start;
  }
}

export class LanguageDetector {
  private static MAP: Record<string, string> = {
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

  static detect(filename: string | null): string {
    if (!filename) return 'Plain Text';
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const base = filename.startsWith('.') ? filename.slice(1).toLowerCase() : filename.toLowerCase();
    return LanguageDetector.MAP[ext] || LanguageDetector.MAP[base] || 'Plain Text';
  }
}

export class Tab {
  private static _counter = 0;

  id: number;
  title: string;
  filePath: string | null;
  document: Document;
  modified: boolean;
  active: boolean;

  constructor({ title = 'Untitled', content = '', filePath = null }: TabOptions = {}) {
    this.id = Tab._counter++;
    this.title = title;
    this.filePath = filePath;
    this.document = new Document(content);
    this.modified = false;
    this.active = false;
  }

  get language(): string {
    return LanguageDetector.detect(this.title);
  }

  markModified(): void {
    this.modified = true;
  }

  markSaved(): void {
    this.modified = false;
  }

  setContent(content: string): void {
    this.document.setContent(content);
    this.markModified();
  }

  getContent(): string {
    return this.document.getContent();
  }
}
