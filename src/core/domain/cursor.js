class Selection {
  constructor(start = 0, end = 0) {
    this.start = start;
    this.end = end;
  }

  get isEmpty() { return this.start === this.end; }
  get length() { return Math.abs(this.end - this.start); }

  normalize() {
    if (this.start > this.end) {
      return new Selection(this.end, this.start);
    }
    return new Selection(this.start, this.end);
  }

  contains(pos) {
    const s = this.normalize();
    return pos >= s.start && pos <= s.end;
  }

  overlap(other) {
    const a = this.normalize();
    const b = other.normalize();
    return a.start < b.end && b.start < a.end;
  }
}

class Cursor {
  constructor(position = 0) {
    this.position = position;
    this.selection = new Selection(position, position);
  }

  get hasSelection() { return !this.selection.isEmpty; }

  moveTo(pos) {
    this.position = pos;
    this.selection = new Selection(pos, pos);
  }

  selectTo(pos) {
    this.selection = new Selection(this.position, pos);
  }

  getSelectedText(content) {
    if (!this.hasSelection) return '';
    const s = this.selection.normalize();
    return content.substring(s.start, s.end);
  }
}

if (typeof module !== 'undefined') module.exports = { Selection, Cursor };
