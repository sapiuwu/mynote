export class Selection {
  start: number;
  end: number;

  constructor(start: number = 0, end: number = 0) {
    this.start = start;
    this.end = end;
  }

  get isEmpty(): boolean {
    return this.start === this.end;
  }

  get length(): number {
    return Math.abs(this.end - this.start);
  }

  normalize(): Selection {
    if (this.start > this.end) {
      return new Selection(this.end, this.start);
    }
    return new Selection(this.start, this.end);
  }

  contains(pos: number): boolean {
    const s = this.normalize();
    return pos >= s.start && pos <= s.end;
  }

  overlap(other: Selection): boolean {
    const a = this.normalize();
    const b = other.normalize();
    return a.start < b.end && b.start < a.end;
  }
}

export class Cursor {
  position: number;
  selection: Selection;

  constructor(position: number = 0) {
    this.position = position;
    this.selection = new Selection(position, position);
  }

  get hasSelection(): boolean {
    return !this.selection.isEmpty;
  }

  moveTo(pos: number): void {
    this.position = pos;
    this.selection = new Selection(pos, pos);
  }

  selectTo(pos: number): void {
    this.selection = new Selection(this.position, pos);
  }

  getSelectedText(content: string): string {
    if (!this.hasSelection) return '';
    const s = this.selection.normalize();
    return content.substring(s.start, s.end);
  }
}
