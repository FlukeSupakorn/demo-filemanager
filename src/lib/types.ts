export interface FileItem {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified: string;
  ext?: string;
}

export interface FileStat {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  modified: string;
  created: string;
  permissions?: string;
}

export type ActionType = 'MOVE' | 'RENAME' | 'CREATE_DIR' | 'DELETE' | 'UNDO';
export type ActionStatus = 'SUCCESS' | 'ERROR';

export interface ActionLog {
  id: number;
  timestamp: string;
  action: ActionType;
  src_path?: string;
  dst_path?: string;
  status: ActionStatus;
  message?: string;
  batch_id?: string;
}

export interface DirResult {
  success: boolean;
  path: string;
  message?: string;
}

export interface RenameResult {
  success: boolean;
  old_path: string;
  new_path: string;
  message?: string;
}

export interface BatchResult {
  success: boolean;
  processed: number;
  failed: number;
  batch_id: string;
  results: Array<{
    path: string;
    success: boolean;
    message?: string;
  }>;
}

export interface UndoResult {
  success: boolean;
  action: ActionType;
  items_restored: number;
  message?: string;
}

export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export interface RootConfig {
  roots: string[];
  favorites: string[];
}