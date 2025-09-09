pub mod operations;
pub mod trash;
pub mod validators;

use crate::error::{AppError, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub name: String,
    pub path: String,
    #[serde(rename = "isDir")]
    pub is_dir: bool,
    pub size: u64,
    pub modified: String,
    pub ext: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileStat {
    pub name: String,
    pub path: String,
    #[serde(rename = "isDir")]
    pub is_dir: bool,
    pub size: u64,
    pub modified: String,
    pub created: String,
}

impl FileItem {
    pub fn from_path(path: &Path) -> Result<Self> {
        let metadata = fs::metadata(path)?;
        let name = path
            .file_name()
            .ok_or_else(|| AppError::InvalidPath("Invalid file name".to_string()))?
            .to_string_lossy()
            .to_string();

        let ext = if metadata.is_file() {
            path.extension()
                .map(|e| e.to_string_lossy().to_string())
        } else {
            None
        };

        let modified = metadata
            .modified()
            .map(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                datetime.to_rfc3339()
            })
            .unwrap_or_default();

        Ok(FileItem {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
            modified,
            ext,
        })
    }
}

impl FileStat {
    pub fn from_path(path: &Path) -> Result<Self> {
        let metadata = fs::metadata(path)?;
        let name = path
            .file_name()
            .ok_or_else(|| AppError::InvalidPath("Invalid file name".to_string()))?
            .to_string_lossy()
            .to_string();

        let modified = metadata
            .modified()
            .map(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                datetime.to_rfc3339()
            })
            .unwrap_or_default();

        let created = metadata
            .created()
            .map(|t| {
                let datetime: chrono::DateTime<chrono::Utc> = t.into();
                datetime.to_rfc3339()
            })
            .unwrap_or_default();

        Ok(FileStat {
            name,
            path: path.to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
            modified,
            created,
        })
    }
}

pub fn normalize_path(path: &str) -> PathBuf {
    PathBuf::from(path.replace('\\', "/"))
}

pub fn is_path_safe(path: &Path, allowed_roots: &[PathBuf]) -> bool {
    let canonical = match path.canonicalize() {
        Ok(p) => p,
        Err(_) => return false,
    };

    for root in allowed_roots {
        if let Ok(canonical_root) = root.canonicalize() {
            if canonical.starts_with(&canonical_root) {
                return true;
            }
        }
    }
    false
}