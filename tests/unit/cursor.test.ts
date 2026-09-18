import { describe, it, expect } from 'vitest';
import { Selection, Cursor } from '../../src/core/domain/cursor';

describe('Selection', () => {
  it('should create selection with default values', () => {
    const sel = new Selection();
    expect(sel.start).toBe(0);
    expect(sel.end).toBe(0);
  });

  it('should create selection with custom values', () => {
    const sel = new Selection(5, 10);
    expect(sel.start).toBe(5);
    expect(sel.end).toBe(10);
  });

  it('should detect empty selection', () => {
    const sel = new Selection(5, 5);
    expect(sel.isEmpty).toBe(true);
  });

  it('should detect non-empty selection', () => {
    const sel = new Selection(5, 10);
    expect(sel.isEmpty).toBe(false);
  });

  it('should calculate length', () => {
    const sel = new Selection(5, 10);
    expect(sel.length).toBe(5);
  });

  it('should calculate length for reversed selection', () => {
    const sel = new Selection(10, 5);
    expect(sel.length).toBe(5);
  });

  it('should normalize selection', () => {
    const sel = new Selection(10, 5);
    const normalized = sel.normalize();
    expect(normalized.start).toBe(5);
    expect(normalized.end).toBe(10);
  });

  it('should not change normalized selection', () => {
    const sel = new Selection(5, 10);
    const normalized = sel.normalize();
    expect(normalized.start).toBe(5);
    expect(normalized.end).toBe(10);
  });

  it('should contain position within range', () => {
    const sel = new Selection(5, 10);
    expect(sel.contains(7)).toBe(true);
    expect(sel.contains(5)).toBe(true);
    expect(sel.contains(10)).toBe(true);
  });

  it('should not contain position outside range', () => {
    const sel = new Selection(5, 10);
    expect(sel.contains(4)).toBe(false);
    expect(sel.contains(11)).toBe(false);
  });

  it('should detect overlap', () => {
    const sel1 = new Selection(5, 10);
    const sel2 = new Selection(8, 15);
    expect(sel1.overlap(sel2)).toBe(true);
  });

  it('should detect no overlap', () => {
    const sel1 = new Selection(5, 10);
    const sel2 = new Selection(15, 20);
    expect(sel1.overlap(sel2)).toBe(false);
  });
});

describe('Cursor', () => {
  it('should create cursor at default position', () => {
    const cursor = new Cursor();
    expect(cursor.position).toBe(0);
    expect(cursor.hasSelection).toBe(false);
  });

  it('should create cursor at custom position', () => {
    const cursor = new Cursor(10);
    expect(cursor.position).toBe(10);
  });

  it('should move to position', () => {
    const cursor = new Cursor(5);
    cursor.moveTo(15);
    expect(cursor.position).toBe(15);
    expect(cursor.selection.isEmpty).toBe(true);
  });

  it('should select to position', () => {
    const cursor = new Cursor(5);
    cursor.selectTo(15);
    expect(cursor.hasSelection).toBe(true);
    expect(cursor.selection.start).toBe(5);
    expect(cursor.selection.end).toBe(15);
  });

  it('should get selected text', () => {
    const cursor = new Cursor(5);
    cursor.selectTo(10);
    const text = cursor.getSelectedText('hello world foo');
    expect(text).toBe(' worl');
  });

  it('should return empty string when no selection', () => {
    const cursor = new Cursor(5);
    const text = cursor.getSelectedText('hello');
    expect(text).toBe('');
  });
});
