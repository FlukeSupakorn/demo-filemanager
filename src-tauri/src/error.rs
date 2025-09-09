use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug, Deserialize)]
pub enum AppError {
    #[error("File not found: {0}")]
    FileNotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("Invalid path: {0}")]
    InvalidPath(String),

    #[error("File already exists: {0}")]
    FileExists(String),

    #[error("Invalid file name: {0}")]
    InvalidFileName(String),

    #[error("IO error: {0}")]
    IoError(String),

    #[error("Database error: {0}")]
    DatabaseError(String),

    #[error("Operation not allowed: {0}")]
    NotAllowed(String),

    #[error("Undo failed: {0}")]
    UndoFailed(String),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IoError(error.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        AppError::DatabaseError(error.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        AppError::IoError(error.to_string())
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("AppError", 2)?;
        state.serialize_field("code", &self.error_code())?;
        state.serialize_field("message", &self.to_string())?;
        state.end()
    }
}

impl AppError {
    fn error_code(&self) -> &str {
        match self {
            AppError::FileNotFound(_) => "FILE_NOT_FOUND",
            AppError::PermissionDenied(_) => "PERMISSION_DENIED",
            AppError::InvalidPath(_) => "INVALID_PATH",
            AppError::FileExists(_) => "FILE_EXISTS",
            AppError::InvalidFileName(_) => "INVALID_FILE_NAME",
            AppError::IoError(_) => "IO_ERROR",
            AppError::DatabaseError(_) => "DATABASE_ERROR",
            AppError::NotAllowed(_) => "NOT_ALLOWED",
            AppError::UndoFailed(_) => "UNDO_FAILED",
            AppError::Unknown(_) => "UNKNOWN_ERROR",
        }
    }
}

pub type Result<T> = std::result::Result<T, AppError>;