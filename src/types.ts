export interface ShellInfo {
  id: string;
  name: string;
  cmd: string;
  args: string[];
}

export interface TerminalInstance {
  id: number;
  shellId: string;
  shellName: string;
}

export interface ElectronAPI {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  openFile: (options: { filters: Array<{ name: string; extensions: string[] }> }) => Promise<{ filePaths: string[]; canceled: boolean }>;
  saveFile: (options: { filters: Array<{ name: string; extensions: string[] }>; defaultPath: string }) => Promise<{ filePath: string; canceled: boolean }>;
  openFolder: () => Promise<{ filePaths: string[]; canceled: boolean }>;
  onMenuCommand: (callback: (channel: string) => void) => () => void;
  onWindowMaximized: (callback: (maximized: boolean) => void) => () => void;
  readFile: (filePath: string) => string;
  writeFile: (filePath: string, content: string) => void;
  existsSync: (filePath: string) => boolean;
  readDir: (dirPath: string) => Array<{ name: string; isDirectory: boolean; isFile: boolean }>;
  statSync: (filePath: string) => { isDirectory: boolean; isFile: boolean };
  mkdirSync: (dirPath: string) => void;
  unlinkSync: (filePath: string) => void;
  rmSync: (filePath: string) => void;
  renameSync: (oldPath: string, newPath: string) => void;
  join: (...parts: string[]) => string;
  dirname: (p: string) => string;
  basename: (p: string) => string;
  execCommand: (cmd: string, cwd?: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
  spawnCommand: (cmd: string, args?: string[], cwd?: string) => Promise<{ stdout: string; stderr: string; exitCode: number }>;
  // Multi-terminal
  getShells: () => ShellInfo[];
  terminalCreate: (shellId: string, cwd?: string) => TerminalInstance;
  terminalWrite: (id: number, data: string) => void;
  terminalResize: (id: number, cols: number, rows: number) => void;
  terminalClose: (id: number) => void;
  terminalGetCwd: (id: number) => string;
  onTerminalData: (callback: (id: number, data: string) => void) => () => void;
  onTerminalExit: (callback: (id: number, code: number) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export interface TabOptions {
  title?: string;
  content?: string;
  filePath?: string | null;
}

export interface PluginMetadataConfig {
  id: string;
  name: string;
  version?: string;
  description?: string;
  author?: string;
  main?: string;
}

export interface PluginContextConfig {
  editor: EditorPort;
  eventBus: IEventBus;
  settings: SettingsPort;
}

export interface EditorPort {
  getActiveTab: () => { id: number; title: string; filePath: string | null; getContent: () => string; markModified: () => void; markSaved: () => void; modified: boolean; active: boolean; language: string; document: unknown } | null;
  getTabs: () => Array<{ id: number; title: string; filePath: string | null; getContent: () => string; markModified: () => void; markSaved: () => void; modified: boolean; active: boolean; language: string; document: unknown }>;
  getSelection: () => { start: number; end: number } | null;
  setSelection: (start: number, end: number) => void;
  insertText: (text: string) => void;
  deleteSelection: () => void;
  getContent: () => string;
  setContent: (content: string) => void;
}

export interface SettingsPort {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  getAll: () => Record<string, unknown>;
}

export interface IEventBus {
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler: (data: unknown) => void): void;
  emit(event: string, data?: unknown): void;
}

export interface Command {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  execute: (...args: unknown[]) => void;
}

export interface Disposable {
  dispose: () => void;
}

export interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeItem[];
}

export interface SearchMatch {
  start: number;
  end: number;
}

export interface FileIcon {
  color: string;
  label: string;
  bg: string;
}

export type LanguageName = 'javascript' | 'python' | 'html' | 'css' | 'json' | 'markdown' | 'text';
