import { create } from 'zustand';
import { FileItem, ActionLog } from '../lib/types';
import { commands } from '../lib/commands';

interface FileState {
  roots: string[];
  currentPath: string;
  items: FileItem[];
  selection: Set<string>;
  logs: ActionLog[];
  favorites: string[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  sortBy: 'name' | 'size' | 'modified' | 'type';
  sortOrder: 'asc' | 'desc';

  // Actions
  setRoots: (roots: string[]) => void;
  setCurrentPath: (path: string) => void;
  loadDirectory: (path: string) => Promise<void>;
  selectItem: (path: string) => void;
  deselectItem: (path: string) => void;
  toggleSelection: (path: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'name' | 'size' | 'modified' | 'type') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  loadFavorites: () => Promise<void>;
  loadRecentLogs: (limit?: number) => Promise<void>;
  refreshCurrentDirectory: () => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  roots: [],
  currentPath: '',
  items: [],
  selection: new Set(),
  logs: [],
  favorites: [],
  loading: false,
  error: null,
  searchQuery: '',
  sortBy: 'name',
  sortOrder: 'asc',

  setRoots: (roots) => {
    set({ roots });
    commands.setAllowedRoots(roots);
  },

  setCurrentPath: (path) => {
    set({ currentPath: path, selection: new Set() });
  },

  loadDirectory: async (path) => {
    set({ loading: true, error: null });
    try {
      const items = await commands.listDir(path);
      set({ 
        items, 
        currentPath: path, 
        loading: false,
        selection: new Set()
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load directory',
        loading: false 
      });
    }
  },

  selectItem: (path) => {
    set((state) => ({
      selection: new Set([...state.selection, path])
    }));
  },

  deselectItem: (path) => {
    set((state) => {
      const newSelection = new Set(state.selection);
      newSelection.delete(path);
      return { selection: newSelection };
    });
  },

  toggleSelection: (path) => {
    const state = get();
    if (state.selection.has(path)) {
      state.deselectItem(path);
    } else {
      state.selectItem(path);
    }
  },

  clearSelection: () => {
    set({ selection: new Set() });
  },

  selectAll: () => {
    set((state) => ({
      selection: new Set(state.items.map(item => item.path))
    }));
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
  },

  setSortOrder: (order) => {
    set({ sortOrder: order });
  },

  loadFavorites: async () => {
    try {
      const favorites = await commands.getFavorites();
      set({ favorites });
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  },

  loadRecentLogs: async (limit = 100) => {
    try {
      const logs = await commands.getRecentLogs(limit);
      set({ logs });
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  },

  refreshCurrentDirectory: async () => {
    const { currentPath } = get();
    if (currentPath) {
      await get().loadDirectory(currentPath);
    }
  },
}));