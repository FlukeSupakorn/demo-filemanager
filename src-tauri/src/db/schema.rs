use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub action: String,
    pub src_path: Option<String>,
    pub dst_path: Option<String>,
    pub status: String,
    pub message: Option<String>,
    pub batch_id: Option<String>,
}