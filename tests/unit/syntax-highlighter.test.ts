import { describe, it, expect } from 'vitest';
import { SyntaxHighlighter } from '../../src/core/syntax-highlighter';

describe('SyntaxHighlighter', () => {
  describe('detectLanguage', () => {
    it('should detect JavaScript', () => {
      expect(SyntaxHighlighter.detectLanguage('app.js')).toBe('javascript');
      expect(SyntaxHighlighter.detectLanguage('script.jsx')).toBe('javascript');
      expect(SyntaxHighlighter.detectLanguage('module.mjs')).toBe('javascript');
    });

    it('should detect TypeScript as javascript for highlighting', () => {
      expect(SyntaxHighlighter.detectLanguage('index.ts')).toBe('javascript');
      expect(SyntaxHighlighter.detectLanguage('app.tsx')).toBe('javascript');
    });

    it('should detect Python', () => {
      expect(SyntaxHighlighter.detectLanguage('main.py')).toBe('python');
    });

    it('should detect HTML', () => {
      expect(SyntaxHighlighter.detectLanguage('index.html')).toBe('html');
      expect(SyntaxHighlighter.detectLanguage('page.htm')).toBe('html');
      expect(SyntaxHighlighter.detectLanguage('style.svg')).toBe('html');
    });

    it('should detect CSS', () => {
      expect(SyntaxHighlighter.detectLanguage('styles.css')).toBe('css');
      expect(SyntaxHighlighter.detectLanguage('theme.scss')).toBe('css');
    });

    it('should detect JSON', () => {
      expect(SyntaxHighlighter.detectLanguage('package.json')).toBe('json');
    });

    it('should detect Markdown', () => {
      expect(SyntaxHighlighter.detectLanguage('README.md')).toBe('markdown');
    });

    it('should return text for unknown', () => {
      expect(SyntaxHighlighter.detectLanguage('file.xyz')).toBe('text');
    });

    it('should return text for null', () => {
      expect(SyntaxHighlighter.detectLanguage(null)).toBe('text');
    });
  });

  describe('getFileIcon', () => {
    it('should return JS icon', () => {
      const icon = SyntaxHighlighter.getFileIcon('app.js');
      expect(icon.label).toBe('JS');
      expect(icon.bg).toBe('#323330');
    });

    it('should return PY icon', () => {
      const icon = SyntaxHighlighter.getFileIcon('main.py');
      expect(icon.label).toBe('PY');
    });

    it('should return default icon for unknown', () => {
      const icon = SyntaxHighlighter.getFileIcon('file.xyz');
      expect(icon.label).toBe('XY');
    });

    it('should return default icon for null', () => {
      const icon = SyntaxHighlighter.getFileIcon(null);
      expect(icon.label).toBe('??');
    });
  });

  describe('escapeHtml', () => {
    it('should escape ampersand', () => {
      expect(SyntaxHighlighter.escapeHtml('a & b')).toBe('a &amp; b');
    });

    it('should escape less than', () => {
      expect(SyntaxHighlighter.escapeHtml('a < b')).toBe('a &lt; b');
    });

    it('should escape greater than', () => {
      expect(SyntaxHighlighter.escapeHtml('a > b')).toBe('a &gt; b');
    });

    it('should escape double quotes', () => {
      expect(SyntaxHighlighter.escapeHtml('"hello"')).toBe('&quot;hello&quot;');
    });

    it('should escape multiple characters', () => {
      expect(SyntaxHighlighter.escapeHtml('<div class="test">&amp;</div>')).toBe('&lt;div class=&quot;test&quot;&gt;&amp;amp;&lt;/div&gt;');
    });
  });

  describe('highlight', () => {
    it('should highlight JavaScript keywords', () => {
      const result = SyntaxHighlighter.highlight('const x = 1;', 'javascript');
      expect(result).toContain('span');
      expect(result).toContain('const');
    });

    it('should highlight Python keywords', () => {
      const result = SyntaxHighlighter.highlight('def hello():', 'python');
      expect(result).toContain('span');
      expect(result).toContain('def');
    });

    it('should return escaped text for unknown language', () => {
      const result = SyntaxHighlighter.highlight('<div>test</div>', 'unknown');
      expect(result).not.toContain('<div>');
      expect(result).toContain('&lt;div&gt;');
    });

    it('should handle empty code', () => {
      const result = SyntaxHighlighter.highlight('', 'javascript');
      expect(result).toBe('');
    });

    it('should handle null code', () => {
      const result = SyntaxHighlighter.highlight(null as unknown as string, 'javascript');
      expect(result).toBe('');
    });
  });
});
