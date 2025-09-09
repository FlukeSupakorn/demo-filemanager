import React, { useState, useEffect } from 'react';
import { X, Folder, AlertTriangle, FolderOpen } from 'lucide-react';
import { useFileStore } from '../../store/fileStore';
import { useUIStore } from '../../store/uiStore';
import { commands } from '../../lib/commands';
import { Button } from '../ui/button';
import { cn, getFileName } from '../../lib/utils';

// Simple Dialog Component
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background border rounded-lg shadow-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Create Folder Dialog
export const CreateFolderDialog: React.FC = () => {
  const { isCreateOpen, closeCreateDialog } = useUIStore();
  const { currentPath, refreshCurrentDirectory } = useFileStore();
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCreateOpen) {
      setFolderName('');
      setError('');
    }
  }, [isCreateOpen]);

  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await commands.makeDir(currentPath, folderName);
      await refreshCurrentDirectory();
      closeCreateDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isCreateOpen} onClose={closeCreateDialog} title="Create New Folder">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Folder Name</label>
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="New Folder"
            className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          {error && (
            <p className="mt-1 text-sm text-destructive">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeCreateDialog}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

// Rename Dialog
export const RenameDialog: React.FC = () => {
  const { isRenameOpen, closeRenameDialog, selectedItemForRename } = useUIStore();
  const { items, refreshCurrentDirectory } = useFileStore();
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedItem = items.find(item => item.path === selectedItemForRename);

  useEffect(() => {
    if (isRenameOpen && selectedItem) {
      setNewName(selectedItem.name);
      setError('');
    }
  }, [isRenameOpen, selectedItem]);

  const handleRename = async () => {
    if (!newName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    if (!selectedItemForRename) return;

    setLoading(true);
    setError('');

    try {
      await commands.renamePath(selectedItemForRename, newName);
      await refreshCurrentDirectory();
      closeRenameDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isRenameOpen} onClose={closeRenameDialog} title="Rename">
      <div className="space-y-4">
        {selectedItem && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded">
            {selectedItem.isDir ? (
              <Folder className="h-4 w-4" />
            ) : (
              <span className="text-sm">📄</span>
            )}
            <span className="text-sm">{selectedItem.name}</span>
          </div>
        )}
        <div>
          <label className="text-sm font-medium">New Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="w-full mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          {error && (
            <p className="mt-1 text-sm text-destructive">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeRenameDialog}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={loading}>
            {loading ? 'Renaming...' : 'Rename'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

// Delete Dialog
export const DeleteDialog: React.FC = () => {
  const { isDeleteOpen, closeDeleteDialog } = useUIStore();
  const { selection, items, refreshCurrentDirectory, clearSelection } = useFileStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedItems = items.filter(item => selection.has(item.path));

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const paths = Array.from(selection);
      await commands.softDelete(paths);
      clearSelection();
      await refreshCurrentDirectory();
      closeDeleteDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDeleteOpen} onClose={closeDeleteDialog} title="Confirm Delete">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <p className="text-sm">
              Are you sure you want to delete {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Items will be moved to trash and can be restored using Undo.
            </p>
          </div>
        </div>

        {selectedItems.length <= 5 && (
          <div className="max-h-32 overflow-y-auto border rounded p-2">
            {selectedItems.map(item => (
              <div key={item.path} className="flex items-center gap-2 py-1">
                {item.isDir ? (
                  <Folder className="h-3 w-3" />
                ) : (
                  <span className="text-xs">📄</span>
                )}
                <span className="text-sm truncate">{item.name}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeDeleteDialog}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

// Move Dialog
export const MoveDialog: React.FC = () => {
  const { isMoveOpen, closeMoveDialog, moveDestination, setMoveDestination } = useUIStore();
  const { selection, items, roots, favorites, refreshCurrentDirectory, clearSelection, currentPath } = useFileStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [folderContents, setFolderContents] = useState<Record<string, any[]>>({});

  const selectedItems = items.filter(item => selection.has(item.path));

  const loadFolderContents = async (path: string) => {
    try {
      const contents = await commands.listDir(path);
      setFolderContents(prev => ({ ...prev, [path]: contents.filter(item => item.isDir) }));
    } catch (err) {
      console.error('Failed to load folder contents:', err);
    }
  };

  const toggleFolder = async (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
      if (!folderContents[path]) {
        await loadFolderContents(path);
      }
    }
    setExpandedFolders(newExpanded);
  };

  const handleMove = async () => {
    if (!moveDestination) {
      setError('Please select a destination folder');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paths = Array.from(selection);
      await commands.movePaths(paths, moveDestination);
      clearSelection();
      await refreshCurrentDirectory();
      closeMoveDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move items');
    } finally {
      setLoading(false);
    }
  };

  const FolderItem: React.FC<{ path: string; name: string; level: number }> = ({ path, name, level }) => {
    const isExpanded = expandedFolders.has(path);
    const children = folderContents[path] || [];
    const isSelected = moveDestination === path;
    const isCurrentPath = path === currentPath;

    return (
      <div>
        <button
          onClick={() => setMoveDestination(path)}
          onDoubleClick={() => toggleFolder(path)}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-accent text-sm text-left",
            isSelected && "bg-accent",
            isCurrentPath && "text-muted-foreground"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          disabled={isCurrentPath}
        >
          <FolderOpen className="h-4 w-4" />
          <span>{name}</span>
          {isCurrentPath && <span className="text-xs ml-auto">(current)</span>}
        </button>
        {isExpanded && children.map((child: any) => (
          <FolderItem
            key={child.path}
            path={child.path}
            name={child.name}
            level={level + 1}
          />
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isMoveOpen} onClose={closeMoveDialog} title="Move Items">
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Moving {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} to:
          </p>
        </div>

        <div className="border rounded-md h-64 overflow-y-auto">
          <div className="p-2">
            <div className="font-medium text-xs text-muted-foreground mb-2 px-2">FAVORITES</div>
            {favorites.map(path => (
              <FolderItem key={path} path={path} name={getFileName(path) || path} level={0} />
            ))}
            
            {roots.length > 0 && (
              <>
                <div className="font-medium text-xs text-muted-foreground mb-2 mt-4 px-2">FOLDERS</div>
                {roots.map(path => (
                  <FolderItem key={path} path={path} name={getFileName(path) || path} level={0} />
                ))}
              </>
            )}
          </div>
        </div>

        {moveDestination && (
          <div className="p-2 bg-muted rounded text-sm">
            Destination: {moveDestination}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={closeMoveDialog}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={loading || !moveDestination}>
            {loading ? 'Moving...' : 'Move'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

// Components are already exported above, no need to re-export