import { useEffect, useState } from "react";
import { useFileStore } from "./store/fileStore";
import { useUIStore } from "./store/uiStore";
import { 
  FileTable, 
  Sidebar, 
  TopBar, 
  Toolbar, 
  RootPicker,
  RightDrawer 
} from "./components";
import { CreateFolderDialog } from "./components/dialogs/CreateFolderDialog";
import { RenameDialog } from "./components/dialogs/RenameDialog";
import { DeleteDialog } from "./components/dialogs/DeleteDialog";
import { MoveDialog } from "./components/dialogs/MoveDialog";
import "./styles/globals.css";

function App() {
  const { roots, loadFavorites, setCurrentPath, loadDirectory } = useFileStore();
  const { isRootPickerOpen } = useUIStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Load favorites on mount
    loadFavorites();
    
    // Check if we need to show root picker
    if (roots.length === 0 && !isInitialized) {
      useUIStore.getState().openRootPicker();
    } else if (roots.length > 0 && !isInitialized) {
      // Load the first root directory
      setCurrentPath(roots[0]);
      loadDirectory(roots[0]);
      setIsInitialized(true);
    }
  }, [roots, isInitialized]);

  if (isRootPickerOpen || (roots.length === 0 && !isInitialized)) {
    return <RootPicker />;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <TopBar />

        {/* Toolbar */}
        <Toolbar />

        {/* File Table */}
        <div className="flex-1 overflow-auto">
          <FileTable />
        </div>
      </div>

      {/* Right Drawer */}
      <RightDrawer />

      {/* Dialogs */}
      <CreateFolderDialog />
      <RenameDialog />
      <DeleteDialog />
      <MoveDialog />
    </div>
  );
}

export default App;