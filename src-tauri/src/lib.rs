mod commands;
mod db;
mod error;
mod fs;

use commands::file_ops::AppState;
use db::Database;
use fs::trash::TrashManager;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .setup(|app| {
            let app_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&app_dir)?;
            
            let db_path = app_dir.join("filemanager.db");
            let db = Database::new(db_path.to_str().unwrap())?;
            
            let trash_manager = TrashManager::new(&app_dir);
            
            let state = AppState {
                db,
                allowed_roots: Mutex::new(Vec::new()),
                trash_manager,
            };
            
            app.manage(state);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::list_dir,
            commands::stat_path,
            commands::make_dir,
            commands::rename_path,
            commands::move_paths,
            commands::soft_delete,
            commands::undo_last_action,
            commands::search,
            commands::get_favorites,
            commands::set_allowed_roots,
            commands::get_recent_logs,
            commands::db_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
