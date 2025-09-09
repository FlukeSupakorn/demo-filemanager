import { invoke } from '@tauri-apps/api/core';
import type {
  FileItem,
  FileStat,
  DirResult,
  RenameResult,
  BatchResult,
  UndoResult,
  ActionLog
} from './types';

export const commands = {
  async listDir(path: string): Promise<FileItem[]> {
    return invoke('list_dir', { path });
  },

  async statPath(path: string): Promise<FileStat> {
    return invoke('stat_path', { path });
  },

  async makeDir(base: string, name: string): Promise<DirResult> {
    return invoke('make_dir', { base, name });
  },

  async renamePath(src: string, newName: string): Promise<RenameResult> {
    return invoke('rename_path', { src, newName });
  },

  async movePaths(srcPaths: string[], destDir: string): Promise<BatchResult> {
    return invoke('move_paths', { srcPaths, destDir });
  },

  async softDelete(paths: string[]): Promise<BatchResult> {
    return invoke('soft_delete', { paths });
  },

  async undoLastAction(): Promise<UndoResult> {
    return invoke('undo_last_action');
  },

  async search(currentPath: string, query: string): Promise<FileItem[]> {
    return invoke('search', { currentPath, query });
  },

  async getFavorites(): Promise<string[]> {
    return invoke('get_favorites');
  },

  async setAllowedRoots(roots: string[]): Promise<void> {
    return invoke('set_allowed_roots', { roots });
  },

  async getRecentLogs(limit: number): Promise<ActionLog[]> {
    return invoke('get_recent_logs', { limit });
  },

  async dbLog(entry: Omit<ActionLog, 'id'>): Promise<number> {
    return invoke('db_log', { entry });
  },
};