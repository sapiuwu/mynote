class SyntaxHighlighter {
  static LANGUAGES = {
    javascript: {
      keywords: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|class|extends|new|this|super|import|from|export|default|try|catch|finally|throw|async|await|yield|typeof|instanceof|in|of|void|delete|true|false|null|undefined|NaN|Infinity)\b/g,
      strings: /(["'`])(?:(?!\1|\\).|\\.)*?\1/g,
      comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      numbers: /\b(\d+\.?\d*)\b/g,
      functions: /\b([a-zA-Z_$][\w$]*)\s*(?=\()/g,
      properties: /\.([a-zA-Z_$][\w$]*)/g,
      operators: /([+\-*/%=!<>&|^~?:]+|\.{3})/g,
      regex: /(\/(?![*/])(?:[^/\\]|\\.)+\/[gimsuy]*)/g,
      colors: {
        keyword: '#c586c0',
        string: '#ce9178',
        comment: '#6a9955',
        number: '#b5cea8',
        function: '#dcdcaa',
        property: '#9cdcfe',
        operator: '#d4d4d4',
        regex: '#d16969'
      }
    },
    python: {
      keywords: /\b(def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|try|except|finally|raise|with|yield|lambda|and|or|not|in|is|True|False|None|self|print|global|nonlocal|assert|del|async|await)\b/g,
      strings: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|f"(?:[^"\\]|\\.)*"|f'(?:[^'\\]|\\.)*')/g,
      comments: /(#.*$)/gm,
      numbers: /\b(\d+\.?\d*)\b/g,
      functions: /\b([a-zA-Z_][\w]*)\s*(?=\()/g,
      decorators: /(@\w+)/g,
      colors: {
        keyword: '#c586c0',
        string: '#ce9178',
        comment: '#6a9955',
        number: '#b5cea8',
        function: '#dcdcaa',
        decorator: '#dcdcaa'
      }
    },
    html: {
      tags: /(&lt;\/?)([\w-]+)/g,
      attributes: /\s([\w-]+)=/g,
      strings: /(["'])(?:(?!\1).)*?\1/g,
      comments: /(<!--[\s\S]*?-->)/g,
      entities: /(&amp;[\w#]+;)/g,
      colors: {
        tag: '#569cd6',
        attribute: '#9cdcfe',
        string: '#ce9178',
        comment: '#6a9955',
        entity: '#d7ba7d'
      }
    },
    css: {
      keywords: /\b(important|inherit|initial|unset|none|auto|normal)\b/g,
      selectors: /([.#][\w-]+|[\w-]+\s*(?=\{))/g,
      properties: /([\w-]+)\s*(?=:)/g,
      values: /:\s*([^;{}\n]+)/g,
      strings: /(["'])(?:(?!\1).)*?\1/g,
      comments: /(\/\*[\s\S]*?\*\/)/g,
      numbers: /:\s*(\d+\.?\d*(px|em|rem|%|vh|vw|deg|s|ms)?)/g,
      colors: {
        keyword: '#569cd6',
        selector: '#d7ba7d',
        property: '#9cdcfe',
        value: '#ce9178',
        string: '#ce9178',
        comment: '#6a9955',
        number: '#b5cea8'
      }
    },
    json: {
      strings: /"(?:[^"\\]|\\.)*"\s*(?=:)/g,
      values: /:\s*("(?:[^"\\]|\\.)*"|\d+\.?\d*|true|false|null)/g,
      braces: /[{}[\]]/g,
      numbers: /\b(\d+\.?\d*)\b/g,
      colors: {
        string: '#9cdcfe',
        value: '#ce9178',
        braces: '#d4d4d4',
        number: '#b5cea8'
      }
    },
    markdown: {
      headings: /^(#{1,6}\s.*)$/gm,
      bold: /(\*\*.*?\*\*)/g,
      italic: /(\*.*?\*)/g,
      code: /(`[^`]+`)/g,
      links: /(\[.*?\]\(.*?\))/g,
      lists: /^(\s*[-*+]\s)/gm,
      colors: {
        heading: '#569cd6',
        bold: '#d4d4d4',
        italic: '#d4d4d4',
        code: '#ce9178',
        links: '#569cd6',
        lists: '#d7ba7d'
      }
    }
  };

  static FILE_ICONS = {
    js: { color: '#f7df1e', label: 'JS', bg: '#323330' },
    jsx: { color: '#61dafb', label: 'JSX', bg: '#282c34' },
    ts: { color: '#3178c6', label: 'TS', bg: '#1e1e1e' },
    tsx: { color: '#3178c6', label: 'TSX', bg: '#1e1e1e' },
    py: { color: '#3776ab', label: 'PY', bg: '#ffd43b' },
    html: { color: '#e34f26', label: 'HT', bg: '#fff' },
    htm: { color: '#e34f26', label: 'HT', bg: '#fff' },
    css: { color: '#1572b6', label: 'CS', bg: '#fff' },
    scss: { color: '#cc6699', label: 'SC', bg: '#fff' },
    json: { color: '#f5f5f5', label: '{}', bg: '#5b5b5b' },
    md: { color: '#ffffff', label: 'MD', bg: '#083fa1' },
    xml: { color: '#f16529', label: 'XM', bg: '#fff' },
    yml: { color: '#cb171e', label: 'YM', bg: '#fff' },
    yaml: { color: '#cb171e', label: 'YM', bg: '#fff' },
    sh: { color: '#4eaa25', label: 'SH', bg: '#1e1e1e' },
    bash: { color: '#4eaa25', label: 'SH', bg: '#1e1e1e' },
    c: { color: '#a8b9cc', label: 'C', bg: '#555555' },
    cpp: { color: '#00599c', label: 'C+', bg: '#fff' },
    h: { color: '#a8b9cc', label: 'H', bg: '#555555' },
    java: { color: '#f89820', label: 'JV', bg: '#5382a1' },
    rs: { color: '#dea584', label: 'RS', bg: '#000' },
    go: { color: '#00add8', label: 'GO', bg: '#fff' },
    rb: { color: '#cc342d', label: 'RB', bg: '#fff' },
    php: { color: '#777bb4', label: 'PH', bg: '#fff' },
    sql: { color: '#f29111', label: 'SQ', bg: '#1e1e1e' },
    txt: { color: '#969696', label: 'TX', bg: '#2d2d2d' },
    csv: { color: '#178600', label: 'CS', bg: '#fff' },
    toml: { color: '#9c4221', label: 'TM', bg: '#fff' },
    ini: { color: '#6d8086', label: 'IN', bg: '#fff' },
    env: { color: '#ecd53f', label: 'EN', bg: '#333' },
    gitignore: { color: '#f14e32', label: 'GI', bg: '#fff' },
    dockerfile: { color: '#2496ed', label: 'DK', bg: '#fff' },
    makefile: { color: '#427819', label: 'MK', bg: '#fff' },
    lock: { color: '#888', label: 'LK', bg: '#333' }
  };

  static detectLanguage(filename) {
    if (!filename) return 'text';
    const ext = filename.split('.').pop().toLowerCase();
    const base = filename.startsWith('.') ? filename.slice(1).toLowerCase() : filename.toLowerCase();

    const map = {
      js: 'javascript', jsx: 'javascript', mjs: 'javascript',
      ts: 'javascript', tsx: 'javascript',
      py: 'python', pyw: 'python',
      html: 'html', htm: 'html',
      css: 'css', scss: 'css', less: 'css',
      json: 'json',
      md: 'markdown', mdx: 'markdown',
      xml: 'html', svg: 'html',
      yml: 'text', yaml: 'text',
      txt: 'text', log: 'text'
    };
    return map[ext] || map[base] || 'text';
  }

  static getFileIcon(filename) {
    if (!filename) return { color: '#969696', label: '??', bg: '#2d2d2d' };
    const ext = filename.split('.').pop().toLowerCase();
    const base = filename.startsWith('.') ? filename.slice(1).toLowerCase() : filename.toLowerCase();
    return this.FILE_ICONS[ext] || this.FILE_ICONS[base] || { color: '#969696', label: ext.substring(0, 2).toUpperCase(), bg: '#2d2d2d' };
  }

  static escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static highlight(code, language) {
    if (!code) return '';
    const lang = this.LANGUAGES[language];
    if (!lang) return this.escapeHtml(code);

    const escaped = this.escapeHtml(code);
    const tokens = [];
    let result = escaped;

    // Collect all matches
    const rules = [];
    for (const [type, regex] of Object.entries(lang)) {
      if (type === 'colors') continue;
      const r = new RegExp(regex.source, regex.flags);
      let m;
      while ((m = r.exec(escaped)) !== null) {
        rules.push({ type, start: m.index, end: m.index + m[0].length, text: m[0] });
      }
    }

    // Sort by start position, longer matches first for same position
    rules.sort((a, b) => a.start - b.start || b.end - a.end);

    // Remove overlapping tokens (keep first/longest)
    const used = [];
    for (const rule of rules) {
      let overlaps = false;
      for (const u of used) {
        if (rule.start < u.end && rule.end > u.start) { overlaps = true; break; }
      }
      if (!overlaps) used.push(rule);
    }

    // Build highlighted result
    let html = '';
    let lastEnd = 0;
    for (const token of used) {
      if (token.start > lastEnd) {
        html += escaped.substring(lastEnd, token.start);
      }
      const color = lang.colors[token.type] || '#d4d4d4';
      html += `<span style="color:${color}">${token.text}</span>`;
      lastEnd = token.end;
    }
    if (lastEnd < escaped.length) {
      html += escaped.substring(lastEnd);
    }

    return html;
  }
}
