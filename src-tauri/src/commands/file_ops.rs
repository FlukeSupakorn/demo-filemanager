use crate::db::{ActionLog, Database};
use crate::error::Result;
use crate::fs::{self, FileItem, FileStat};
use crate::fs::operations::{self, DirResult, RenameResult, BatchResult, UndoResult};
use crate::fs::trash::TrashManager;
use crate::fs::validators;
use chrono::Utc;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

pub struct AppState {
    pub db: Database,
    pub allowed_roots: Mutex<Vec<PathBuf>>,
    pub trash_manager: TrashManager,
}

#[tauri::command]
pub async fn list_dir(path: String, state: State<'_, AppState>) -> Result<Vec<FileItem>> {
    let path = PathBuf::from(&path);
    
    // Validate path is within allowed roots
    let roots = state.allowed_roots.lock().unwrap();
    if !roots.is_empty() && !fs::is_path_safe(&path, &roots) {
        return Err(crate::error::AppError::NotAllowed(
            "Access to this directory is not allowed".to_string()
        ));
    }

    let items = operations::list_directory(&path)?;
    
    // Log the operation
    let _ = state.db.log_action(ActionLog {
        id: None,
        timestamp: Utc::now().to_rfc3339(),
        action: "LIST_DIR".to_string(),
        src_path: Some(path.to_string_lossy().to_string()),
        dst_path: None,
        status: "SUCCESS".to_string(),
        message: None,
        batch_id: None,
    });

    Ok(items)
}

#[tauri::command]
pub async fn stat_path(path: String, state: State<'_, AppState>) -> Result<FileStat> {
    let path = PathBuf::from(&path);
    
    let roots = state.allowed_roots.lock().unwrap();
    if !roots.is_empty() && !fs::is_path_safe(&path, &roots) {
        return Err(crate::error::AppError::NotAllowed(
            "Access to this path is not allowed".to_string()
        ));
    }

    operations::get_file_stat(&path)
}

#[tauri::command]
pub async fn make_dir(base: String, name: String, state: State<'_, AppState>) -> Result<DirResult> {
    validators::validate_file_name(&name)?;
    
    let base_path = PathBuf::from(&base);
    
    let roots = state.allowed_roots.lock().unwrap();
    if !roots.is_empty() && !fs::is_path_safe(&base_path, &roots) {
        return Err(crate::error::AppError::NotAllowed(
            "Access to this directory is not allowed".to_string()
        ));
    }

    let result = operations::create_directory(&base_path, &name)?;
    
    // Log the operation
    let _ = state.db.log_action(ActionLog {
        id: None,
        timestamp: Utc::now().to_rfc3339(),
        action: "CREATE_DIR".to_string(),
        src_path: None,
        dst_path: Some(result.path.clone()),
        status: "SUCCESS".to_string(),
        message: None,
        batch_id: None,
    });

    Ok(result)
}

#[tauri::command]
pub async fn rename_path(src: String, new_name: String, state: State<'_, AppState>) -> Result<RenameResult> {
    validators::validate_file_name(&new_name)?;
    
    let src_path = PathBuf::from(&src);
    
    let roots = state.allowed_roots.lock().unwrap();
    if !roots.is_empty() && !fs::is_path_safe(&src_path, &roots) {
        return Err(crate::error::AppError::NotAllowed(
            "Access to this path is not allowed".to_string()
        ));
    }

    let result = operations::rename_item(&src_path, &new_name)?;
    
    // Log the operation
    let _ = state.db.log_action(ActionLog {
        id: None,
        timestamp: Utc::now().to_rfc3339(),
        action: "RENAME".to_string(),
        src_path: Some(result.old_path.clone()),
        dst_path: Some(result.new_path.clone()),
        status: "SUCCESS".to_string(),
        message: None,
        batch_id: None,
    });

    Ok(result)
}

#[tauri::command]
pub async fn move_paths(src_paths: Vec<String>, dest_dir: String, state: State<'_, AppState>) -> Result<BatchResult> {
    let dest_path = PathBuf::from(&dest_dir);
    
    let roots = state.allowed_roots.lock().unwrap();
    if !roots.is_empty() && !fs::is_path_safe(&dest_path, &roots) {
        return Err(crate::error::AppError::NotAllowed(
            "Access to destination directory is not allowed".to_string()
        ));
    }

    let src_paths: Vec<PathBuf> = src_paths
        .into_iter()
        .map(PathBuf::from)
        .collect();

    // Validate all source paths
    for path in &src_paths {
        if !roots.is_empty() && !fs::is_path_safe(path, &roots) {
            return Err(crate::error::AppError::NotAllowed(
                format!("Access to {} is not allowed", path.display())
            ));
        }
    }

    let result = operations::move_items(src_paths.clone(), &dest_path)?;
    
    // Log the batch operation
    for (i, src) in src_paths.iter().enumerate() {
        if result.results[i].success {
            let _ = state.db.log_action(ActionLog {
                id: None,
                timestamp: Utc::now().to_rfc3339(),
                action: "MOVE".to_string(),
                src_path: Some(src.to_string_lossy().to_string()),
                dst_path: Some(dest_dir.clone()),
                status: "SUCCESS".to_string(),
                message: None,
                batch_id: Some(result.batch_id.clone()),
            });
        }
    }

    Ok(result)
}

#[tauri::command]
pub async fn soft_delete(paths: Vec<String>, state: State<'_, AppState>) -> Result<BatchResult> {
    let paths: Vec<PathBuf> = paths
        .into_iter()
        .map(PathBuf::from)
        .collect();

    let roots = state.allowed_roots.lock().unwrap();
    
    // Validate all paths
    for path in &paths {
        if !roots.is_empty() && !fs::is_path_safe(path, &roots) {
            return Err(crate::error::AppError::NotAllowed(
                format!("Access to {} is not allowed", path.display())
            ));
        }
    }

    let result = state.trash_manager.soft_delete(paths.clone())?;
    
    // Log the batch operation
    for (i, path) in paths.iter().enumerate() {
        if result.results[i].success {
            let _ = state.db.log_action(ActionLog {
                id: None,
                timestamp: Utc::now().to_rfc3339(),
                action: "DELETE".to_string(),
                src_path: Some(path.to_string_lossy().to_string()),
                dst_path: None,
                status: "SUCCESS".to_string(),
                message: None,
                batch_id: Some(result.batch_id.clone()),
            });
        }
    }

    Ok(result)
}

#[tauri::command]
pub async fn undo_last_action(state: State<'_, AppState>) -> Result<UndoResult> {
    let last_actions = state.db.get_last_reversible_action()?;
    
    if last_actions.is_empty() {
        return Err(crate::error::AppError::UndoFailed(
            "No action to undo".to_string()
        ));
    }

    let first_action = &last_actions[0];
    let action_type = &first_action.action;
    
    let result = match action_type.as_str() {
        "DELETE" => {
            // Restore from trash
            let trash_folder = state.trash_manager.get_latest_trash_folder()
                .ok_or_else(|| crate::error::AppError::UndoFailed(
                    "No trash folder found".to_string()
                ))?;
            
            let paths: Vec<String> = last_actions
                .iter()
                .filter_map(|a| a.src_path.clone())
                .collect();
            
            state.trash_manager.restore_from_trash(&trash_folder, paths)?
        }
        "RENAME" => {
            // Reverse the rename
            if let (Some(src), Some(dst)) = (&first_action.src_path, &first_action.dst_path) {
                let src_path = PathBuf::from(dst);
                let dst_path = PathBuf::from(src);
                let file_name = dst_path.file_name()
                    .ok_or_else(|| crate::error::AppError::InvalidPath("Invalid file name".to_string()))?
                    .to_string_lossy()
                    .to_string();
                
                operations::rename_item(&src_path, &file_name)?;
                UndoResult {
                    success: true,
                    action: action_type.clone(),
                    items_restored: 1,
                    message: None,
                }
            } else {
                return Err(crate::error::AppError::UndoFailed(
                    "Missing path information".to_string()
                ));
            }
        }
        "MOVE" => {
            // Reverse the move operation
            let mut restored = 0;
            for action in &last_actions {
                if let (Some(src), Some(dst)) = (&action.src_path, &action.dst_path) {
                    let src_path = PathBuf::from(src);
                    let file_name = src_path.file_name()
                        .ok_or_else(|| crate::error::AppError::InvalidPath("Invalid file name".to_string()))?;
                    
                    let current_path = PathBuf::from(dst).join(file_name);
                    let original_parent = src_path.parent()
                        .ok_or_else(|| crate::error::AppError::InvalidPath("Invalid parent path".to_string()))?;
                    
                    operations::move_items(vec![current_path], original_parent)?;
                    restored += 1;
                }
            }
            UndoResult {
                success: true,
                action: action_type.clone(),
                items_restored: restored,
                message: None,
            }
        }
        "CREATE_DIR" => {
            // Delete the created directory
            if let Some(path) = &first_action.dst_path {
                let dir_path = PathBuf::from(path);
                std::fs::remove_dir(&dir_path)?;
                UndoResult {
                    success: true,
                    action: action_type.clone(),
                    items_restored: 1,
                    message: None,
                }
            } else {
                return Err(crate::error::AppError::UndoFailed(
                    "Missing path information".to_string()
                ));
            }
        }
        _ => {
            return Err(crate::error::AppError::UndoFailed(
                format!("Cannot undo action: {}", action_type)
            ));
        }
    };

    // Log the undo operation
    let _ = state.db.log_action(ActionLog {
        id: None,
        timestamp: Utc::now().to_rfc3339(),
        action: "UNDO".to_string(),
        src_path: None,
        dst_path: None,
        status: "SUCCESS".to_string(),
        message: Some(format!("Undid {} action(s)", result.items_restored)),
        batch_id: None,
    });

    Ok(result)
}

#[tauri::command]
pub async fn search(current_path: String, query: String, state: State<'_, AppState>) -> Result<Vec<FileItem>> {
    let path = PathBuf::from(&current_path);
    
    let roots = state.allowed_roots.lock().unwrap();
    if !roots.is_empty() && !fs::is_path_safe(&path, &roots) {
        return Err(crate::error::AppError::NotAllowed(
            "Access to this directory is not allowed".to_string()
        ));
    }

    let all_items = operations::list_directory(&path)?;
    let query_lower = query.to_lowercase();
    
    let filtered: Vec<FileItem> = all_items
        .into_iter()
        .filter(|item| item.name.to_lowercase().contains(&query_lower))
        .collect();

    Ok(filtered)
}

#[tauri::command]
pub async fn get_favorites() -> Result<Vec<String>> {
    let mut favorites = Vec::new();
    
    if let Some(downloads) = dirs::download_dir() {
        favorites.push(downloads.to_string_lossy().to_string());
    }
    
    if let Some(documents) = dirs::document_dir() {
        favorites.push(documents.to_string_lossy().to_string());
    }
    
    if let Some(desktop) = dirs::desktop_dir() {
        favorites.push(desktop.to_string_lossy().to_string());
    }
    
    if let Some(home) = dirs::home_dir() {
        favorites.push(home.to_string_lossy().to_string());
    }

    Ok(favorites)
}

#[tauri::command]
pub async fn set_allowed_roots(roots: Vec<String>, state: State<'_, AppState>) -> Result<()> {
    let mut allowed_roots = state.allowed_roots.lock().unwrap();
    *allowed_roots = roots.into_iter().map(PathBuf::from).collect();
    Ok(())
}