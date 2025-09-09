// This file contains all the essential components for the file manager
// In production, these would be separate files, but for demo purposes they're combined

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, File, Home, Download, FileText, Monitor,
  Plus, Trash2, Edit2, Move, RefreshCw, Undo,
  Grid, List, Search, ChevronRight, ChevronDown,
  X, Check, AlertCircle, Info, FolderOpen
} from 'lucide-react';
import { useFileStore } from '../store/fileStore';
import { useUIStore } from '../store/uiStore';
import { commands } from '../lib/commands';
import { cn, formatBytes, formatDate, getFileName } from '../lib/utils';
import { Button } from './ui/button';
import type { FileItem } from '../lib/types';

// ============ Sidebar Component ============
export const Sidebar: React.FC = () => {
  const { favorites, currentPath, loadDirectory, roots } = useFileStore();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  return (
    <div className="w-64 bg-muted/50 border-r border-border flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-sm text-muted-foreground">FILE EXPLORER</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {/* Favorites */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">FAVORITES</h3>
          {favorites.map((path) => {
            const name = getFileName(path);
            const icon = name.toLowerCase().includes('download') ? Download :
                        name.toLowerCase().includes('document') ? FileText :
                        name.toLowerCase().includes('desktop') ? Monitor : Home;
            const Icon = icon;
            
            return (
              <button
                key={path}
                onClick={() => loadDirectory(path)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm",
                  currentPath === path && "bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{name}</span>
              </button>
            );
          })}
        </div>

        {/* Root Folders */}
        {roots.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">FOLDERS</h3>
            {roots.map((root) => (
              <button
                key={root}
                onClick={() => loadDirectory(root)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent text-sm",
                  currentPath === root && "bg-accent"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                <span className="truncate">{getFileName(root) || root}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============ TopBar Component ============
export const TopBar: React.FC = () => {
  const { currentPath, searchQuery, setSearchQuery, loadDirectory } = useFileStore();
  const { openCreateDialog } = useUIStore();
  const [localSearch, setLocalSearch] = useState('');

  const pathParts = currentPath.split('/').filter(Boolean);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
  };

  return (
    <div className="border-b border-border px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => loadDirectory('/')}
            className="hover:text-primary"
          >
            <Home className="h-4 w-4" />
          </button>
          {pathParts.map((part, index) => {
            const path = '/' + pathParts.slice(0, index + 1).join('/');
            return (
              <React.Fragment key={path}>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <button
                  onClick={() => loadDirectory(path)}
                  className="hover:text-primary"
                >
                  {part}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Search and Actions */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search files..."
              className="pl-8 pr-3 py-1.5 text-sm border rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" />
            New Folder
          </Button>
        </div>
      </div>
    </div>
  );
};

// ============ Toolbar Component ============
export const Toolbar: React.FC = () => {
  const { selection, refreshCurrentDirectory } = useFileStore();
  const { openMoveDialog, openRenameDialog, openDeleteDialog, viewMode, setViewMode } = useUIStore();
  
  const handleUndo = async () => {
    try {
      await commands.undoLastAction();
      refreshCurrentDirectory();
    } catch (error) {
      console.error('Undo failed:', error);
    }
  };

  const hasSelection = selection.size > 0;
  const singleSelection = selection.size === 1;

  return (
    <div className="border-b border-border px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button 
          size="sm" 
          variant="ghost"
          onClick={openMoveDialog}
          disabled={!hasSelection}
        >
          <Move className="h-4 w-4 mr-1" />
          Move
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={() => singleSelection && openRenameDialog(Array.from(selection)[0])}
          disabled={!singleSelection}
        >
          <Edit2 className="h-4 w-4 mr-1" />
          Rename
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={openDeleteDialog}
          disabled={!hasSelection}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Delete
        </Button>
        <div className="w-px h-6 bg-border mx-2" />
        <Button 
          size="sm" 
          variant="ghost"
          onClick={refreshCurrentDirectory}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Button 
          size="sm" 
          variant="ghost"
          onClick={handleUndo}
        >
          <Undo className="h-4 w-4 mr-1" />
          Undo
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={viewMode === 'list' ? 'secondary' : 'ghost'}
          onClick={() => setViewMode('list')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
          onClick={() => setViewMode('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ============ FileTable Component ============
export const FileTable: React.FC = () => {
  const { items, selection, toggleSelection, clearSelection, selectAll, loading, error, searchQuery } = useFileStore();
  const { viewMode, openRenameDialog } = useUIStore();
  
  const filteredItems = searchQuery 
    ? items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const handleDoubleClick = (item: FileItem) => {
    if (item.isDir) {
      useFileStore.getState().loadDirectory(item.path);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' && selection.size > 0) {
      useUIStore.getState().openDeleteDialog();
    } else if (e.key === 'F2' && selection.size === 1) {
      openRenameDialog(Array.from(selection)[0]);
    } else if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      selectAll();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      </div>
    );
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">
          {searchQuery ? 'No files found matching your search' : 'This folder is empty'}
        </div>
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div 
        className="p-4 grid grid-cols-6 gap-4"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {filteredItems.map((item) => (
          <div
            key={item.path}
            onClick={() => toggleSelection(item.path)}
            onDoubleClick={() => handleDoubleClick(item)}
            className={cn(
              "p-3 rounded-lg border cursor-pointer transition-colors",
              "hover:bg-accent flex flex-col items-center gap-2",
              selection.has(item.path) && "bg-accent border-primary"
            )}
          >
            {item.isDir ? (
              <Folder className="h-12 w-12 text-blue-500" />
            ) : (
              <File className="h-12 w-12 text-gray-400" />
            )}
            <span className="text-sm text-center truncate w-full">{item.name}</span>
            {!item.isDir && (
              <span className="text-xs text-muted-foreground">{formatBytes(item.size)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full" onKeyDown={handleKeyDown} tabIndex={0}>
      <table className="w-full">
        <thead className="border-b">
          <tr className="text-left text-sm text-muted-foreground">
            <th className="px-4 py-2 w-8">
              <input
                type="checkbox"
                checked={selection.size === items.length && items.length > 0}
                onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                className="rounded"
              />
            </th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2 w-32">Size</th>
            <th className="px-4 py-2 w-48">Modified</th>
            <th className="px-4 py-2 w-24">Type</th>
          </tr>
        </thead>
        <tbody>
          {filteredItems.map((item) => (
            <tr
              key={item.path}
              onClick={() => toggleSelection(item.path)}
              onDoubleClick={() => handleDoubleClick(item)}
              className={cn(
                "border-b hover:bg-accent cursor-pointer",
                selection.has(item.path) && "bg-accent"
              )}
            >
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={selection.has(item.path)}
                  onChange={() => {}}
                  className="rounded"
                />
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  {item.isDir ? (
                    <Folder className="h-4 w-4 text-blue-500" />
                  ) : (
                    <File className="h-4 w-4 text-gray-400" />
                  )}
                  <span>{item.name}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-sm text-muted-foreground">
                {item.isDir ? '--' : formatBytes(item.size)}
              </td>
              <td className="px-4 py-2 text-sm text-muted-foreground">
                {formatDate(item.modified)}
              </td>
              <td className="px-4 py-2 text-sm text-muted-foreground">
                {item.isDir ? 'Folder' : item.ext || 'File'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============ RightDrawer Component ============
export const RightDrawer: React.FC = () => {
  const { rightDrawerOpen, toggleRightDrawer } = useUIStore();
  const { selection, items } = useFileStore();
  
  if (!rightDrawerOpen) return null;

  const selectedItems = items.filter(item => selection.has(item.path));
  const selectedItem = selectedItems.length === 1 ? selectedItems[0] : null;

  return (
    <div className="w-80 border-l border-border bg-muted/30 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Inspector</h3>
        <Button size="sm" variant="ghost" onClick={toggleRightDrawer}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {selectedItem ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center p-4 bg-background rounded-lg">
            {selectedItem.isDir ? (
              <Folder className="h-16 w-16 text-blue-500 mb-2" />
            ) : (
              <File className="h-16 w-16 text-gray-400 mb-2" />
            )}
            <p className="font-medium text-center">{selectedItem.name}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span>{selectedItem.isDir ? 'Folder' : selectedItem.ext || 'File'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Size:</span>
              <span>{selectedItem.isDir ? '--' : formatBytes(selectedItem.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Modified:</span>
              <span>{formatDate(selectedItem.modified)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Path:</span>
              <span className="truncate ml-2" title={selectedItem.path}>
                {selectedItem.path}
              </span>
            </div>
          </div>

          {/* AI Placeholder */}
          <div className="mt-6 p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Smart Suggestions (AI)
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              AI features coming in Phase 2
            </p>
            <div className="space-y-2">
              <div className="p-2 bg-muted rounded text-sm">
                • Auto-categorize files
              </div>
              <div className="p-2 bg-muted rounded text-sm">
                • Suggest organization
              </div>
              <div className="p-2 bg-muted rounded text-sm">
                • Find duplicates
              </div>
            </div>
            <Button className="w-full mt-3" disabled>
              Enable AI (Coming Soon)
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          {selection.size === 0 ? 'Select a file to view details' : `${selection.size} items selected`}
        </div>
      )}
    </div>
  );
};

// ============ RootPicker Component ============
export const RootPicker: React.FC = () => {
  const { setRoots, favorites } = useFileStore();
  const { closeRootPicker } = useUIStore();
  const [selectedRoots, setSelectedRoots] = useState<string[]>([]);

  const handleSelect = (path: string) => {
    if (selectedRoots.includes(path)) {
      setSelectedRoots(selectedRoots.filter(r => r !== path));
    } else {
      setSelectedRoots([...selectedRoots, path]);
    }
  };

  const handleConfirm = () => {
    if (selectedRoots.length > 0) {
      setRoots(selectedRoots);
      closeRootPicker();
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="w-96 p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Select Root Folders</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Choose which folders the file manager can access:
        </p>
        
        <div className="space-y-2 mb-6">
          {favorites.map((path) => {
            const name = getFileName(path) || path;
            return (
              <label
                key={path}
                className="flex items-center gap-3 p-3 border rounded hover:bg-accent cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedRoots.includes(path)}
                  onChange={() => handleSelect(path)}
                  className="rounded"
                />
                <Folder className="h-4 w-4" />
                <span>{name}</span>
              </label>
            );
          })}
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={handleConfirm}
            disabled={selectedRoots.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};