import { describe, it, expect } from 'vitest';
import { Document } from '../../src/core/domain/tab';

describe('Document', () => {
  it('should initialize with empty content', () => {
    const doc = new Document();
    expect(doc.getContent()).toBe('');
  });

  it('should initialize with provided content', () => {
    const doc = new Document('Hello World');
    expect(doc.getContent()).toBe('Hello World');
  });

  it('should set content and track undo stack', () => {
    const doc = new Document('initial');
    doc.setContent('modified');
    expect(doc.getContent()).toBe('modified');
  });

  it('should undo changes', () => {
    const doc = new Document('first');
    doc.setContent('second');
    doc.setContent('third');

    const undone = doc.undo();
    expect(undone).toBe('second');
    expect(doc.getContent()).toBe('second');
  });

  it('should return null when undo stack is empty', () => {
    const doc = new Document('content');
    const undone = doc.undo();
    expect(undone).toBeNull();
  });

  it('should redo changes', () => {
    const doc = new Document('first');
    doc.setContent('second');
    doc.undo();
    const redone = doc.redo();
    expect(redone).toBe('second');
    expect(doc.getContent()).toBe('second');
  });

  it('should return null when redo stack is empty', () => {
    const doc = new Document('content');
    const redone = doc.redo();
    expect(redone).toBeNull();
  });

  it('should clear redo stack on new change', () => {
    const doc = new Document('first');
    doc.setContent('second');
    doc.undo();
    doc.setContent('third');
    const redone = doc.redo();
    expect(redone).toBeNull();
  });

  it('should calculate word count', () => {
    const doc = new Document('hello world foo');
    expect(doc.wordCount).toBe(3);
  });

  it('should return 0 word count for empty content', () => {
    const doc = new Document('');
    expect(doc.wordCount).toBe(0);
  });

  it('should calculate line count', () => {
    const doc = new Document('line1\nline2\nline3');
    expect(doc.lineCount).toBe(3);
  });

  it('should calculate char count', () => {
    const doc = new Document('hello');
    expect(doc.charCount).toBe(5);
  });

  it('should insert text at position', () => {
    const doc = new Document('hello world');
    const newPos = doc.insertAt(5, ' beautiful');
    expect(doc.getContent()).toBe('hello beautiful world');
    expect(newPos).toBe(15);
  });

  it('should delete range', () => {
    const doc = new Document('hello world');
    const pos = doc.deleteRange(5, 11);
    expect(doc.getContent()).toBe('hello');
    expect(pos).toBe(5);
  });

  it('should limit undo stack to 200 entries', () => {
    const doc = new Document('initial');
    for (let i = 0; i < 250; i++) {
      doc.setContent(`content ${i}`);
    }
    expect(doc.getContent()).toBe('content 249');
    // Undo 250 times - should only be able to undo 200 times
    for (let i = 0; i < 250; i++) {
      doc.undo();
    }
    // The earliest undo should be at index 50 (250 - 200)
    expect(doc.getContent()).toBe('content 49');
  });
});
