import { create } from 'zustand';

interface UIState {
  isMoveOpen: boolean;
  isRenameOpen: boolean;
  isCreateOpen: boolean;
  isDeleteOpen: boolean;
  isRootPickerOpen: boolean;
  rightDrawerOpen: boolean;
  viewMode: 'grid' | 'list';
  selectedItemForRename: string | null;
  moveDestination: string | null;
  
  // Actions
  openMoveDialog: () => void;
  closeMoveDialog: () => void;
  openRenameDialog: (path: string) => void;
  closeRenameDialog: () => void;
  openCreateDialog: () => void;
  closeCreateDialog: () => void;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  openRootPicker: () => void;
  closeRootPicker: () => void;
  toggleRightDrawer: () => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setMoveDestination: (path: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMoveOpen: false,
  isRenameOpen: false,
  isCreateOpen: false,
  isDeleteOpen: false,
  isRootPickerOpen: false,
  rightDrawerOpen: false,
  viewMode: 'list',
  selectedItemForRename: null,
  moveDestination: null,

  openMoveDialog: () => set({ isMoveOpen: true }),
  closeMoveDialog: () => set({ isMoveOpen: false, moveDestination: null }),
  
  openRenameDialog: (path) => set({ isRenameOpen: true, selectedItemForRename: path }),
  closeRenameDialog: () => set({ isRenameOpen: false, selectedItemForRename: null }),
  
  openCreateDialog: () => set({ isCreateOpen: true }),
  closeCreateDialog: () => set({ isCreateOpen: false }),
  
  openDeleteDialog: () => set({ isDeleteOpen: true }),
  closeDeleteDialog: () => set({ isDeleteOpen: false }),
  
  openRootPicker: () => set({ isRootPickerOpen: true }),
  closeRootPicker: () => set({ isRootPickerOpen: false }),
  
  toggleRightDrawer: () => set((state) => ({ rightDrawerOpen: !state.rightDrawerOpen })),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setMoveDestination: (path) => set({ moveDestination: path }),
}));