pub mod schema;

use crate::error::Result;
use rusqlite::{Connection, params};
use std::sync::Mutex;
use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionLog {
    pub id: Option<i64>,
    pub timestamp: String,
    pub action: String,
    pub src_path: Option<String>,
    pub dst_path: Option<String>,
    pub status: String,
    pub message: Option<String>,
    pub batch_id: Option<String>,
}

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(path: &str) -> Result<Self> {
        let conn = Connection::open(path)?;
        let db = Database {
            conn: Mutex::new(conn),
        };
        db.init()?;
        Ok(db)
    }

    pub fn init(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS action_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                action TEXT NOT NULL,
                src_path TEXT,
                dst_path TEXT,
                status TEXT NOT NULL,
                message TEXT,
                batch_id TEXT
            )",
            [],
        )?;
        Ok(())
    }

    pub fn log_action(&self, log: ActionLog) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO action_logs (timestamp, action, src_path, dst_path, status, message, batch_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                log.timestamp,
                log.action,
                log.src_path,
                log.dst_path,
                log.status,
                log.message,
                log.batch_id
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    pub fn get_last_reversible_action(&self) -> Result<Vec<ActionLog>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, timestamp, action, src_path, dst_path, status, message, batch_id
             FROM action_logs
             WHERE status = 'SUCCESS' AND action IN ('MOVE', 'RENAME', 'CREATE_DIR', 'DELETE')
             ORDER BY id DESC
             LIMIT 1"
        )?;

        let last_action = stmt.query_row([], |row| {
            Ok(ActionLog {
                id: Some(row.get(0)?),
                timestamp: row.get(1)?,
                action: row.get(2)?,
                src_path: row.get(3)?,
                dst_path: row.get(4)?,
                status: row.get(5)?,
                message: row.get(6)?,
                batch_id: row.get(7)?,
            })
        }).ok();

        if let Some(action) = last_action {
            if let Some(batch_id) = action.batch_id {
                // Get all actions in the batch
                let mut stmt = conn.prepare(
                    "SELECT id, timestamp, action, src_path, dst_path, status, message, batch_id
                     FROM action_logs
                     WHERE batch_id = ?1
                     ORDER BY id ASC"
                )?;

                let actions = stmt.query_map([batch_id], |row| {
                    Ok(ActionLog {
                        id: Some(row.get(0)?),
                        timestamp: row.get(1)?,
                        action: row.get(2)?,
                        src_path: row.get(3)?,
                        dst_path: row.get(4)?,
                        status: row.get(5)?,
                        message: row.get(6)?,
                        batch_id: row.get(7)?,
                    })
                })?.collect::<std::result::Result<Vec<_>, _>>()?;

                Ok(actions)
            } else {
                Ok(vec![action])
            }
        } else {
            Ok(vec![])
        }
    }

    pub fn get_recent_logs(&self, limit: usize) -> Result<Vec<ActionLog>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, timestamp, action, src_path, dst_path, status, message, batch_id
             FROM action_logs
             ORDER BY id DESC
             LIMIT ?1"
        )?;

        let logs = stmt.query_map([limit], |row| {
            Ok(ActionLog {
                id: Some(row.get(0)?),
                timestamp: row.get(1)?,
                action: row.get(2)?,
                src_path: row.get(3)?,
                dst_path: row.get(4)?,
                status: row.get(5)?,
                message: row.get(6)?,
                batch_id: row.get(7)?,
            })
        })?.collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(logs)
    }
}