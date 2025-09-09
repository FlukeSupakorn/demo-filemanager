use crate::db::ActionLog;
use crate::error::Result;
use tauri::State;
use crate::commands::file_ops::AppState;

#[tauri::command]
pub async fn get_recent_logs(limit: usize, state: State<'_, AppState>) -> Result<Vec<ActionLog>> {
    state.db.get_recent_logs(limit)
}

#[tauri::command]
pub async fn db_log(entry: ActionLog, state: State<'_, AppState>) -> Result<i64> {
    state.db.log_action(entry)
}