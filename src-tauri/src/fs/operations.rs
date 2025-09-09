use crate::error::{AppError, Result};
use crate::fs::{FileItem, FileStat};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirResult {
    pub success: bool,
    pub path: String,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenameResult {
    pub success: bool,
    pub old_path: String,
    pub new_path: String,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchResult {
    pub success: bool,
    pub processed: usize,
    pub failed: usize,
    pub batch_id: String,
    pub results: Vec<BatchItemResult>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchItemResult {
    pub path: String,
    pub success: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndoResult {
    pub success: bool,
    pub action: String,
    pub items_restored: usize,
    pub message: Option<String>,
}

pub fn list_directory(path: &Path) -> Result<Vec<FileItem>> {
    if !path.exists() {
        return Err(AppError::FileNotFound(path.to_string_lossy().to_string()));
    }

    if !path.is_dir() {
        return Err(AppError::InvalidPath("Not a directory".to_string()));
    }

    let mut items = Vec::new();
    let entries = fs::read_dir(path)?;

    for entry in entries {
        let entry = entry?;
        let path = entry.path();
        
        if let Ok(item) = FileItem::from_path(&path) {
            items.push(item);
        }
    }

    Ok(items)
}

pub fn get_file_stat(path: &Path) -> Result<FileStat> {
    if !path.exists() {
        return Err(AppError::FileNotFound(path.to_string_lossy().to_string()));
    }

    FileStat::from_path(path)
}

pub fn create_directory(parent: &Path, name: &str) -> Result<DirResult> {
    let new_path = parent.join(name);

    if new_path.exists() {
        return Err(AppError::FileExists(new_path.to_string_lossy().to_string()));
    }

    fs::create_dir(&new_path)?;

    Ok(DirResult {
        success: true,
        path: new_path.to_string_lossy().to_string(),
        message: None,
    })
}

pub fn rename_item(src: &Path, new_name: &str) -> Result<RenameResult> {
    if !src.exists() {
        return Err(AppError::FileNotFound(src.to_string_lossy().to_string()));
    }

    let parent = src.parent().ok_or_else(|| {
        AppError::InvalidPath("Cannot get parent directory".to_string())
    })?;

    let new_path = parent.join(new_name);

    if new_path.exists() {
        return Err(AppError::FileExists(new_path.to_string_lossy().to_string()));
    }

    fs::rename(src, &new_path)?;

    Ok(RenameResult {
        success: true,
        old_path: src.to_string_lossy().to_string(),
        new_path: new_path.to_string_lossy().to_string(),
        message: None,
    })
}

pub fn move_items(src_paths: Vec<PathBuf>, dest_dir: &Path) -> Result<BatchResult> {
    let batch_id = Uuid::new_v4().to_string();
    let mut results = Vec::new();
    let mut processed = 0;
    let mut failed = 0;

    for src_path in src_paths {
        let file_name = src_path
            .file_name()
            .ok_or_else(|| AppError::InvalidPath("Invalid file name".to_string()))?;
        
        let dest_path = dest_dir.join(file_name);

        let result = if dest_path.exists() {
            failed += 1;
            BatchItemResult {
                path: src_path.to_string_lossy().to_string(),
                success: false,
                message: Some("Destination already exists".to_string()),
            }
        } else {
            match fs::rename(&src_path, &dest_path) {
                Ok(_) => {
                    processed += 1;
                    BatchItemResult {
                        path: src_path.to_string_lossy().to_string(),
                        success: true,
                        message: None,
                    }
                }
                Err(_e) => {
                    // Try copy and delete for cross-device moves
                    match copy_and_delete(&src_path, &dest_path) {
                        Ok(_) => {
                            processed += 1;
                            BatchItemResult {
                                path: src_path.to_string_lossy().to_string(),
                                success: true,
                                message: None,
                            }
                        }
                        Err(e) => {
                            failed += 1;
                            BatchItemResult {
                                path: src_path.to_string_lossy().to_string(),
                                success: false,
                                message: Some(e.to_string()),
                            }
                        }
                    }
                }
            }
        };

        results.push(result);
    }

    Ok(BatchResult {
        success: failed == 0,
        processed,
        failed,
        batch_id,
        results,
    })
}

fn copy_and_delete(src: &Path, dest: &Path) -> Result<()> {
    if src.is_dir() {
        copy_dir_recursive(src, dest)?;
        fs::remove_dir_all(src)?;
    } else {
        fs::copy(src, dest)?;
        fs::remove_file(src)?;
    }
    Ok(())
}

fn copy_dir_recursive(src: &Path, dest: &Path) -> Result<()> {
    fs::create_dir_all(dest)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dest_path = dest.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dest_path)?;
        } else {
            fs::copy(&src_path, &dest_path)?;
        }
    }

    Ok(())
}