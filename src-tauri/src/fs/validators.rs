use crate::error::{AppError, Result};
use std::path::Path;

pub fn validate_file_name(name: &str) -> Result<()> {
    if name.trim().is_empty() {
        return Err(AppError::InvalidFileName("File name cannot be empty".to_string()));
    }

    // Check for invalid characters (Windows-compatible)
    let invalid_chars = ['<', '>', ':', '"', '|', '?', '*'];
    for ch in invalid_chars {
        if name.contains(ch) {
            return Err(AppError::InvalidFileName(
                format!("File name cannot contain '{}'", ch)
            ));
        }
    }

    // Check for control characters
    for ch in name.chars() {
        if ch.is_control() {
            return Err(AppError::InvalidFileName(
                "File name cannot contain control characters".to_string()
            ));
        }
    }

    // Check for reserved names (Windows)
    let reserved_names = [
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
    ];

    let name_upper = name.to_uppercase();
    let base_name = name_upper.split('.').next().unwrap_or(&name_upper);
    
    if reserved_names.contains(&base_name) {
        return Err(AppError::InvalidFileName(
            format!("'{}' is a reserved name", name)
        ));
    }

    // Check for trailing dots or spaces (Windows)
    if name.ends_with('.') || name.ends_with(' ') {
        return Err(AppError::InvalidFileName(
            "File name cannot end with a dot or space".to_string()
        ));
    }

    Ok(())
}

pub fn validate_path_traversal(path: &Path) -> Result<()> {
    let path_str = path.to_string_lossy();
    
    // Check for path traversal attempts
    if path_str.contains("..") {
        return Err(AppError::InvalidPath(
            "Path traversal is not allowed".to_string()
        ));
    }

    Ok(())
}

pub fn is_hidden_file(path: &Path) -> bool {
    path.file_name()
        .and_then(|name| name.to_str())
        .map(|name| name.starts_with('.'))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_file_name() {
        assert!(validate_file_name("valid_file.txt").is_ok());
        assert!(validate_file_name("file-name.doc").is_ok());
        
        assert!(validate_file_name("").is_err());
        assert!(validate_file_name("   ").is_err());
        assert!(validate_file_name("file<name>.txt").is_err());
        assert!(validate_file_name("file:name.txt").is_err());
        assert!(validate_file_name("CON").is_err());
        assert!(validate_file_name("con.txt").is_err());
        assert!(validate_file_name("file.").is_err());
        assert!(validate_file_name("file ").is_err());
    }
}