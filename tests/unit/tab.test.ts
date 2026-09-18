import { describe, it, expect } from 'vitest';
import { Tab, LanguageDetector } from '../../src/core/domain/tab';

describe('LanguageDetector', () => {
  it('should detect JavaScript', () => {
    expect(LanguageDetector.detect('app.js')).toBe('JavaScript');
    expect(LanguageDetector.detect('script.jsx')).toBe('JSX');
  });

  it('should detect Python', () => {
    expect(LanguageDetector.detect('main.py')).toBe('Python');
  });

  it('should detect TypeScript', () => {
    expect(LanguageDetector.detect('index.ts')).toBe('TypeScript');
    expect(LanguageDetector.detect('app.tsx')).toBe('TSX');
  });

  it('should detect HTML', () => {
    expect(LanguageDetector.detect('index.html')).toBe('HTML');
    expect(LanguageDetector.detect('page.htm')).toBe('HTML');
  });

  it('should detect CSS', () => {
    expect(LanguageDetector.detect('styles.css')).toBe('CSS');
    expect(LanguageDetector.detect('theme.scss')).toBe('SCSS');
  });

  it('should detect JSON', () => {
    expect(LanguageDetector.detect('package.json')).toBe('JSON');
  });

  it('should detect Markdown', () => {
    expect(LanguageDetector.detect('README.md')).toBe('Markdown');
  });

  it('should detect dotfiles', () => {
    expect(LanguageDetector.detect('.gitignore')).toBe('Plain Text');
    expect(LanguageDetector.detect('.dockerfile')).toBe('Dockerfile');
  });

  it('should return Plain Text for unknown extensions', () => {
    expect(LanguageDetector.detect('file.xyz')).toBe('Plain Text');
  });

  it('should return Plain Text for null', () => {
    expect(LanguageDetector.detect(null)).toBe('Plain Text');
  });
});

describe('Tab', () => {
  it('should create tab with default values', () => {
    const tab = new Tab();
    expect(tab.title).toBe('Untitled');
    expect(tab.filePath).toBeNull();
    expect(tab.modified).toBe(false);
    expect(tab.active).toBe(false);
  });

  it('should create tab with custom values', () => {
    const tab = new Tab({ title: 'test.js', content: 'hello', filePath: '/path/to/test.js' });
    expect(tab.title).toBe('test.js');
    expect(tab.getContent()).toBe('hello');
    expect(tab.filePath).toBe('/path/to/test.js');
  });

  it('should detect language from title', () => {
    const tab = new Tab({ title: 'app.py' });
    expect(tab.language).toBe('Python');
  });

  it('should mark as modified', () => {
    const tab = new Tab();
    tab.setContent('new content');
    expect(tab.modified).toBe(true);
  });

  it('should mark as saved', () => {
    const tab = new Tab();
    tab.setContent('content');
    tab.markSaved();
    expect(tab.modified).toBe(false);
  });

  it('should have unique ids', () => {
    const tab1 = new Tab();
    const tab2 = new Tab();
    expect(tab1.id).not.toBe(tab2.id);
  });

  it('should have working document', () => {
    const tab = new Tab({ content: 'initial' });
    expect(tab.getContent()).toBe('initial');
    tab.setContent('modified');
    expect(tab.getContent()).toBe('modified');
    expect(tab.modified).toBe(true);
  });
});
