use crate::error::{AppError, Result};
use crate::fs::operations::BatchResult;
use chrono::Utc;
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

pub struct TrashManager {
    trash_root: PathBuf,
}

impl TrashManager {
    pub fn new(app_root: &Path) -> Self {
        let trash_root = app_root.join(".trash");
        TrashManager { trash_root }
    }

    pub fn soft_delete(&self, paths: Vec<PathBuf>) -> Result<BatchResult> {
        let batch_id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
        let trash_dir = self.trash_root.join(&timestamp);

        // Create trash directory if it doesn't exist
        fs::create_dir_all(&trash_dir)?;

        let mut results = Vec::new();
        let mut processed = 0;
        let mut failed = 0;

        for path in paths {
            let file_name = path
                .file_name()
                .ok_or_else(|| AppError::InvalidPath("Invalid file name".to_string()))?;
            
            let trash_path = trash_dir.join(file_name);

            let result = match fs::rename(&path, &trash_path) {
                Ok(_) => {
                    processed += 1;
                    crate::fs::operations::BatchItemResult {
                        path: path.to_string_lossy().to_string(),
                        success: true,
                        message: None,
                    }
                }
                Err(e) => {
                    // Try copy and delete for cross-device moves
                    match self.copy_to_trash(&path, &trash_path) {
                        Ok(_) => {
                            processed += 1;
                            crate::fs::operations::BatchItemResult {
                                path: path.to_string_lossy().to_string(),
                                success: true,
                                message: None,
                            }
                        }
                        Err(e) => {
                            failed += 1;
                            crate::fs::operations::BatchItemResult {
                                path: path.to_string_lossy().to_string(),
                                success: false,
                                message: Some(e.to_string()),
                            }
                        }
                    }
                }
            };

            results.push(result);
        }

        // Store metadata for undo
        let metadata_path = trash_dir.join(".metadata.json");
        let metadata = serde_json::json!({
            "batch_id": batch_id,
            "timestamp": timestamp,
            "items": results.iter().filter(|r| r.success).map(|r| &r.path).collect::<Vec<_>>()
        });
        fs::write(metadata_path, serde_json::to_string_pretty(&metadata)?)?;

        Ok(BatchResult {
            success: failed == 0,
            processed,
            failed,
            batch_id,
            results,
        })
    }

    pub fn restore_from_trash(&self, trash_folder: &str, original_paths: Vec<String>) -> Result<crate::fs::operations::UndoResult> {
        let trash_dir = self.trash_root.join(trash_folder);
        
        if !trash_dir.exists() {
            return Err(AppError::UndoFailed("Trash folder not found".to_string()));
        }

        let mut restored = 0;

        for original_path in original_paths {
            let path = PathBuf::from(&original_path);
            let file_name = path
                .file_name()
                .ok_or_else(|| AppError::InvalidPath("Invalid file name".to_string()))?;
            
            let trash_path = trash_dir.join(file_name);
            
            if trash_path.exists() {
                // Ensure parent directory exists
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent)?;
                }

                // Restore the file
                fs::rename(&trash_path, &path).or_else(|_| {
                    // Try copy and delete for cross-device moves
                    self.copy_from_trash(&trash_path, &path)
                })?;
                
                restored += 1;
            }
        }

        // Clean up empty trash folder
        let _ = fs::remove_dir(&trash_dir);

        Ok(crate::fs::operations::UndoResult {
            success: true,
            action: "DELETE".to_string(),
            items_restored: restored,
            message: None,
        })
    }

    fn copy_to_trash(&self, src: &Path, dest: &Path) -> Result<()> {
        if src.is_dir() {
            self.copy_dir_recursive(src, dest)?;
            fs::remove_dir_all(src)?;
        } else {
            fs::copy(src, dest)?;
            fs::remove_file(src)?;
        }
        Ok(())
    }

    fn copy_from_trash(&self, src: &Path, dest: &Path) -> Result<()> {
        if src.is_dir() {
            self.copy_dir_recursive(src, dest)?;
            fs::remove_dir_all(src)?;
        } else {
            fs::copy(src, dest)?;
            fs::remove_file(src)?;
        }
        Ok(())
    }

    fn copy_dir_recursive(&self, src: &Path, dest: &Path) -> Result<()> {
        fs::create_dir_all(dest)?;

        for entry in fs::read_dir(src)? {
            let entry = entry?;
            let src_path = entry.path();
            let dest_path = dest.join(entry.file_name());

            if src_path.is_dir() {
                self.copy_dir_recursive(&src_path, &dest_path)?;
            } else {
                fs::copy(&src_path, &dest_path)?;
            }
        }

        Ok(())
    }

    pub fn get_latest_trash_folder(&self) -> Option<String> {
        let mut entries: Vec<_> = fs::read_dir(&self.trash_root)
            .ok()?
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_dir())
            .collect();

        entries.sort_by_key(|e| e.path());
        entries.last().map(|e| {
            e.file_name().to_string_lossy().to_string()
        })
    }
}