// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::process::Command;

/// HTTP request payload from frontend
#[derive(Debug, Deserialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

/// HTTP response to frontend
#[derive(Debug, Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub body: String,
    pub error: Option<String>,
}

/// Make an HTTP request to external APIs (bypasses CORS)
#[tauri::command]
async fn http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();
    
    // Build the request
    let mut req_builder = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        "PATCH" => client.patch(&request.url),
        _ => return Err(format!("Unsupported HTTP method: {}", request.method)),
    };
    
    // Add headers
    for (key, value) in request.headers {
        req_builder = req_builder.header(&key, &value);
    }
    
    // Add body if present
    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }
    
    // Execute request
    match req_builder.send().await {
        Ok(response) => {
            let status = response.status().as_u16();
            match response.text().await {
                Ok(body) => Ok(HttpResponse {
                    status,
                    body,
                    error: None,
                }),
                Err(e) => Ok(HttpResponse {
                    status,
                    body: String::new(),
                    error: Some(format!("Failed to read response body: {}", e)),
                }),
            }
        }
        Err(e) => {
            // Categorize the error for better diagnostics
            let error_msg = if e.is_connect() {
                format!("Connection failed: Unable to reach {}. Check your internet connection.", request.url)
            } else if e.is_timeout() {
                "Request timed out. The server took too long to respond.".to_string()
            } else if e.is_request() {
                format!("Invalid request: {}", e)
            } else {
                format!("HTTP request failed: {}", e)
            };
            
            Ok(HttpResponse {
                status: 0,
                body: String::new(),
                error: Some(error_msg),
            })
        }
    }
}

// ============================================
// SD CARD / DISK OPERATIONS
// ============================================

/// Detected drive information
#[derive(Debug, Serialize)]
pub struct DetectedDrive {
    pub letter: String,
    pub label: String,
    pub drive_type: String,
    pub size: u64,
    pub free_space: u64,
    pub is_removable: bool,
    pub file_system: String,
}

/// Detect removable drives (SD cards, USB drives)
#[tauri::command]
async fn detect_drives() -> Result<Vec<DetectedDrive>, String> {
    #[cfg(target_os = "windows")]
    {
        detect_drives_windows().await
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        Err("Drive detection not implemented for this OS".to_string())
    }
}

#[cfg(target_os = "windows")]
async fn detect_drives_windows() -> Result<Vec<DetectedDrive>, String> {
    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            r#"
            Get-WmiObject Win32_LogicalDisk | 
            Where-Object { $_.DriveType -eq 2 -or $_.DriveType -eq 3 } | 
            Select-Object DeviceID, VolumeName, DriveType, Size, FreeSpace, FileSystem | 
            ConvertTo-Json -Compress
            "#,
        ])
        .output()
        .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "PowerShell error: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();
    
    if trimmed.is_empty() || trimmed == "null" {
        return Ok(vec![]);
    }

    // Parse JSON - can be array or single object
    let drives: Vec<DetectedDrive> = if trimmed.starts_with('[') {
        #[derive(Deserialize)]
        struct WmiDrive {
            DeviceID: Option<String>,
            VolumeName: Option<String>,
            DriveType: Option<u32>,
            Size: Option<u64>,
            FreeSpace: Option<u64>,
            FileSystem: Option<String>,
        }
        
        let wmi_drives: Vec<WmiDrive> = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse drives JSON: {}", e))?;
            
        wmi_drives
            .into_iter()
            .filter_map(|d| {
                let device_id = d.DeviceID?;
                let drive_type = d.DriveType.unwrap_or(0);
                Some(DetectedDrive {
                    letter: device_id.replace(":", ""),
                    label: d.VolumeName.unwrap_or_else(|| "Removable".to_string()),
                    drive_type: match drive_type {
                        2 => "Removable".to_string(),
                        3 => "Local".to_string(),
                        _ => "Unknown".to_string(),
                    },
                    size: d.Size.unwrap_or(0),
                    free_space: d.FreeSpace.unwrap_or(0),
                    is_removable: drive_type == 2,
                    file_system: d.FileSystem.unwrap_or_else(|| "Unknown".to_string()),
                })
            })
            .collect()
    } else {
        // Single object
        #[derive(Deserialize)]
        struct WmiDrive {
            DeviceID: Option<String>,
            VolumeName: Option<String>,
            DriveType: Option<u32>,
            Size: Option<u64>,
            FreeSpace: Option<u64>,
            FileSystem: Option<String>,
        }
        
        let d: WmiDrive = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse drive JSON: {}", e))?;
            
        if let Some(device_id) = d.DeviceID {
            let drive_type = d.DriveType.unwrap_or(0);
            vec![DetectedDrive {
                letter: device_id.replace(":", ""),
                label: d.VolumeName.unwrap_or_else(|| "Removable".to_string()),
                drive_type: match drive_type {
                    2 => "Removable".to_string(),
                    3 => "Local".to_string(),
                    _ => "Unknown".to_string(),
                },
                size: d.Size.unwrap_or(0),
                free_space: d.FreeSpace.unwrap_or(0),
                is_removable: drive_type == 2,
                file_system: d.FileSystem.unwrap_or_else(|| "Unknown".to_string()),
            }]
        } else {
            vec![]
        }
    };

    // Filter to only show likely SD cards (removable drives < 256GB)
    Ok(drives
        .into_iter()
        .filter(|d| d.is_removable || (d.size > 0 && d.size < 256 * 1024 * 1024 * 1024))
        .collect())
}

/// Write a file to a specific path
#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file {}: {}", path, e))
}

/// Write binary file to a specific path
#[tauri::command]
async fn write_binary_file(path: String, content: Vec<u8>) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file {}: {}", path, e))
}

/// Check if a path exists
#[tauri::command]
async fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

/// Check if path is a Pi boot partition (contains specific files)
#[tauri::command]
async fn is_pi_boot_partition(path: String) -> Result<bool, String> {
    let boot_path = Path::new(&path);
    
    if !boot_path.exists() {
        return Ok(false);
    }
    
    // Check for typical Pi boot partition files
    let indicators = ["bootcode.bin", "start.elf", "config.txt", "cmdline.txt"];
    let mut found_count = 0;
    
    for indicator in &indicators {
        if boot_path.join(indicator).exists() {
            found_count += 1;
        }
    }
    
    // If at least 2 indicators found, it's likely a Pi boot partition
    Ok(found_count >= 2)
}

/// Generate SHA-512 encrypted password for Pi userconf.txt
#[tauri::command]
async fn hash_password(password: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        hash_password_windows(&password).await
    }
    
    #[cfg(not(target_os = "windows"))]
    {
        hash_password_unix(&password).await
    }
}

#[cfg(target_os = "windows")]
async fn hash_password_windows(password: &str) -> Result<String, String> {
    // Try using OpenSSL if available, otherwise use Python
    // First try openssl
    let openssl_result = Command::new("openssl")
        .args(["passwd", "-6", "-stdin"])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn();
        
    if let Ok(mut child) = openssl_result {
        use std::io::Write;
        if let Some(mut stdin) = child.stdin.take() {
            let _ = stdin.write_all(password.as_bytes());
        }
        
        if let Ok(output) = child.wait_with_output() {
            if output.status.success() {
                let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if hash.starts_with("$6$") {
                    return Ok(hash);
                }
            }
        }
    }
    
    // Fallback to Python
    let python_script = format!(
        r#"import crypt; import secrets; salt = secrets.token_hex(8); print(crypt.crypt('{}', '$6$' + salt))"#,
        password.replace("'", "\\'")
    );
    
    let python_result = Command::new("python")
        .args(["-c", &python_script])
        .output();
        
    if let Ok(output) = python_result {
        if output.status.success() {
            let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if hash.starts_with("$6$") {
                return Ok(hash);
            }
        }
    }
    
    // Try python3
    let python3_result = Command::new("python3")
        .args(["-c", &python_script])
        .output();
        
    if let Ok(output) = python3_result {
        if output.status.success() {
            let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if hash.starts_with("$6$") {
                return Ok(hash);
            }
        }
    }
    
    Err("Could not hash password. Please install OpenSSL or Python.".to_string())
}

#[cfg(not(target_os = "windows"))]
async fn hash_password_unix(password: &str) -> Result<String, String> {
    use std::io::Write;
    
    let mut child = Command::new("openssl")
        .args(["passwd", "-6", "-stdin"])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run openssl: {}", e))?;
        
    if let Some(mut stdin) = child.stdin.take() {
        stdin.write_all(password.as_bytes())
            .map_err(|e| format!("Failed to write password: {}", e))?;
    }
    
    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to get openssl output: {}", e))?;
        
    if output.status.success() {
        let hash = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if hash.starts_with("$6$") {
            return Ok(hash);
        }
    }
    
    Err("Failed to hash password with openssl".to_string())
}

/// List files in a directory
#[tauri::command]
async fn list_directory(path: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(&path)
        .map_err(|e| format!("Failed to read directory {}: {}", path, e))?;
        
    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(name) = entry.file_name().to_str() {
                files.push(name.to_string());
            }
        }
    }
    
    Ok(files)
}

/// Create a directory (and parents if needed)
#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory {}: {}", path, e))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            http_request,
            detect_drives,
            write_file,
            write_binary_file,
            path_exists,
            is_pi_boot_partition,
            hash_password,
            list_directory,
            create_directory
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
