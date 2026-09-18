import type { EditorUI } from './editor';
import type { SearchMatch } from '../../types';

export class FindReplaceUI {
  private editorUI: EditorUI;
  private matches: SearchMatch[];
  private currentIndex: number;
  private _panel: HTMLElement;
  private _replaceRow: HTMLElement;
  private _input: HTMLInputElement;
  private _replaceInput: HTMLInputElement;
  private _count: HTMLElement;

  constructor(editorUI: EditorUI) {
    this.editorUI = editorUI;
    this.matches = [];
    this.currentIndex = -1;
    this._panel = document.getElementById('find-panel')!;
    this._replaceRow = document.getElementById('replace-row')!;
    this._input = document.getElementById('find-input') as HTMLInputElement;
    this._replaceInput = document.getElementById('replace-input') as HTMLInputElement;
    this._count = document.getElementById('find-count')!;
    this._init();
  }

  private _init(): void {
    this._input.addEventListener('input', () => this.doFind());
    document.getElementById('find-next')!.addEventListener('click', () => this.findNext());
    document.getElementById('find-prev')!.addEventListener('click', () => this.findPrev());
    document.getElementById('find-close')!.addEventListener('click', () => this.close());
    document.getElementById('replace-one')!.addEventListener('click', () => this.replaceOne());
    document.getElementById('replace-all')!.addEventListener('click', () => this.replaceAll());

    this._input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.shiftKey ? this.findPrev() : this.findNext();
      }
      if (e.key === 'Escape') this.close();
    });

    this._replaceInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });

    document.getElementById('find-match-case')!.addEventListener('change', () => this.doFind());
    document.getElementById('find-whole-word')!.addEventListener('change', () => this.doFind());
  }

  open(withReplace: boolean = false): void {
    this._panel.classList.remove('hidden');
    this._replaceRow.classList.toggle('hidden', !withReplace);
    this._input.focus();
    this._input.select();

    const editor = this.editorUI.getActiveEditor();
    if (editor && editor.selectionStart !== editor.selectionEnd) {
      const selected = editor.value.substring(editor.selectionStart, editor.selectionEnd);
      this._input.value = selected;
      this.doFind();
    }
  }

  close(): void {
    this._panel.classList.add('hidden');
    this.matches = [];
    this.currentIndex = -1;
    this._count.textContent = '0 results';
  }

  doFind(): void {
    const query = this._input.value;
    if (!query) {
      this.matches = [];
      this.currentIndex = -1;
      this._count.textContent = '0 results';
      return;
    }

    const tab = this.editorUI.getActiveTab();
    if (!tab) return;

    const content = tab.getContent();
    const matchCase = (document.getElementById('find-match-case') as HTMLInputElement).checked;
    const wholeWord = (document.getElementById('find-whole-word') as HTMLInputElement).checked;

    this.matches = [];
    let idx = 0;
    const searchContent = matchCase ? content : content.toLowerCase();
    const searchQuery = matchCase ? query : query.toLowerCase();

    while (true) {
      let pos = searchContent.indexOf(searchQuery, idx);
      if (pos === -1) break;

      if (wholeWord) {
        const before = pos > 0 ? content[pos - 1] : ' ';
        const after = pos + query.length < content.length ? content[pos + query.length] : ' ';
        if (/\w/.test(before) || /\w/.test(after)) {
          idx = pos + 1;
          continue;
        }
      }

      this.matches.push({ start: pos, end: pos + query.length });
      idx = pos + 1;
    }

    this.currentIndex = this.matches.length > 0 ? 0 : -1;
    this._updateCount();
    if (this.currentIndex >= 0) this._selectMatch();
  }

  findNext(): void {
    if (this.matches.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.matches.length;
    this._selectMatch();
  }

  findPrev(): void {
    if (this.matches.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.matches.length) % this.matches.length;
    this._selectMatch();
  }

  replaceOne(): void {
    if (this.currentIndex < 0 || this.currentIndex >= this.matches.length) return;
    const tab = this.editorUI.getActiveTab();
    if (!tab) return;
    const replacement = this._replaceInput.value;
    const m = this.matches[this.currentIndex];
    const content = tab.getContent();
    tab.setContent(content.substring(0, m.start) + replacement + content.substring(m.end));
    this.editorUI.setContent(tab.getContent());
    this.doFind();
  }

  replaceAll(): void {
    if (this.matches.length === 0) return;
    const tab = this.editorUI.getActiveTab();
    if (!tab) return;
    const replacement = this._replaceInput.value;
    let content = tab.getContent();
    for (let i = this.matches.length - 1; i >= 0; i--) {
      const m = this.matches[i];
      content = content.substring(0, m.start) + replacement + content.substring(m.end);
    }
    tab.setContent(content);
    this.editorUI.setContent(content);
    this.doFind();
  }

  private _selectMatch(): void {
    if (this.currentIndex < 0) return;
    const m = this.matches[this.currentIndex];
    this.editorUI.setSelection(m.start, m.end);
    this._updateCount();
  }

  private _updateCount(): void {
    if (this.matches.length === 0) {
      this._count.textContent = '0 results';
    } else {
      this._count.textContent = `${this.currentIndex + 1} of ${this.matches.length}`;
    }
  }
}
