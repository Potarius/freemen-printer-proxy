// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use futures::StreamExt;
use serde::{Deserialize, Serialize};
use sha_crypt::{sha512_simple, Sha512Params};
use std::collections::HashMap;
use std::fs;
use std::io::{self, BufReader, Read, Write};
use std::path::Path;
use std::process::Command;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use xz2::read::XzDecoder;

// On Windows, hide the console window for all child processes we spawn.
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

// ============================================
// SELF-ELEVATION  (release builds only)
//
// The NSIS installer launches the app as the current user via ShellExecAsUser.
// Rather than baking requireAdministrator into the manifest (which causes a
// hidden UAC dialog that the user misses), we start as asInvoker, check for
// elevation at runtime, and relaunch with the "runas" verb if needed.
// In debug/dev builds this is skipped so `tauri dev` never triggers UAC.
// ============================================

#[cfg(all(target_os = "windows", not(debug_assertions)))]
fn relaunch_as_admin_if_needed() {
    use std::ffi::{c_void, OsStr};
    use std::os::windows::ffi::OsStrExt;

    extern "system" {
        fn OpenProcessToken(process: *mut c_void, access: u32, token: *mut *mut c_void) -> i32;
        fn GetCurrentProcess() -> *mut c_void;
        fn GetTokenInformation(
            token: *mut c_void,
            class: u32,
            info: *mut c_void,
            len: u32,
            ret_len: *mut u32,
        ) -> i32;
        fn CloseHandle(h: *mut c_void) -> i32;
        fn ShellExecuteW(
            hwnd: *mut c_void,
            op: *const u16,
            file: *const u16,
            params: *const u16,
            dir: *const u16,
            show: i32,
        ) -> isize;
    }

    const TOKEN_QUERY: u32 = 0x0008;
    const TOKEN_ELEVATION: u32 = 20;
    const SW_SHOWNORMAL: i32 = 1;

    unsafe {
        let mut token: *mut c_void = std::ptr::null_mut();
        if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) == 0 {
            return; // Cannot query — proceed as-is
        }
        let mut elevation: u32 = 0;
        let mut ret_len: u32 = 0;
        let ok = GetTokenInformation(
            token,
            TOKEN_ELEVATION,
            &mut elevation as *mut _ as *mut c_void,
            4,
            &mut ret_len,
        );
        CloseHandle(token);
        if ok != 0 && elevation != 0 {
            return; // Already elevated — proceed normally
        }

        // Not elevated: relaunch with "runas" verb to trigger UAC
        let exe = match std::env::current_exe() {
            Ok(p) => p,
            Err(_) => return,
        };
        let exe_w: Vec<u16> = OsStr::new(&exe).encode_wide().chain(Some(0)).collect();
        let verb_w: Vec<u16> = OsStr::new("runas").encode_wide().chain(Some(0)).collect();

        ShellExecuteW(
            std::ptr::null_mut(),
            verb_w.as_ptr(),
            exe_w.as_ptr(),
            std::ptr::null(),
            std::ptr::null(),
            SW_SHOWNORMAL,
        );
    }

    std::process::exit(0);
}

// ============================================
// WINDOWS VOLUME LOCKING  (Rufus-style)
//
// Volumes must be locked and dismounted from the SAME PROCESS that writes
// to the physical disk, with handles kept open for the duration.
// External tools (diskpart, PowerShell) release their locks when they exit,
// and Windows remounts the volumes before our write starts — causing error 5.
// ============================================

#[cfg(target_os = "windows")]
mod disk_lock {
    use std::ffi::c_void;
    use std::os::windows::fs::OpenOptionsExt;
    use std::os::windows::io::AsRawHandle;

    const FILE_SHARE_READ: u32 = 0x01;
    const FILE_SHARE_WRITE: u32 = 0x02;

    // DeviceIoControl control codes
    const IOCTL_STORAGE_GET_DEVICE_NUMBER: u32 = 0x002D_1080;
    const FSCTL_LOCK_VOLUME: u32 = 0x0009_0018;
    const FSCTL_DISMOUNT_VOLUME: u32 = 0x0009_0020;

    #[repr(C)]
    struct StorageDeviceNumber {
        device_type: u32,
        device_number: u32,
        partition_number: u32,
    }

    extern "system" {
        fn GetLogicalDrives() -> u32;
        fn DeviceIoControl(
            h_device: *mut c_void,
            dw_io_control_code: u32,
            lp_in_buffer: *const c_void,
            n_in_buffer_size: u32,
            lp_out_buffer: *mut c_void,
            n_out_buffer_size: u32,
            lp_bytes_returned: *mut u32,
            lp_overlapped: *const c_void,
        ) -> i32;
    }

    /// Open, lock, and dismount every volume that lives on `disk_number`.
    /// Returns the open file handles — caller MUST keep them alive (drop them
    /// only after the raw write finishes) to prevent Windows from remounting.
    pub fn lock_volumes_on_disk(disk_number: u32) -> Vec<std::fs::File> {
        let drive_mask = unsafe { GetLogicalDrives() };
        let mut locked: Vec<std::fs::File> = Vec::new();

        for i in 0u32..26 {
            if drive_mask & (1 << i) == 0 {
                continue;
            }
            let letter = char::from(b'A' + i as u8);
            let vol_path = format!("\\\\.\\{}:", letter);

            let file = match std::fs::OpenOptions::new()
                .read(true)
                .write(true)
                .share_mode(FILE_SHARE_READ | FILE_SHARE_WRITE)
                .open(&vol_path)
            {
                Ok(f) => f,
                Err(_) => continue,
            };

            // Check whether this volume lives on our target physical disk.
            let mut sdn = StorageDeviceNumber {
                device_type: 0,
                device_number: 0,
                partition_number: 0,
            };
            let mut returned: u32 = 0;
            let ok = unsafe {
                DeviceIoControl(
                    file.as_raw_handle() as *mut c_void,
                    IOCTL_STORAGE_GET_DEVICE_NUMBER,
                    std::ptr::null(),
                    0,
                    &mut sdn as *mut _ as *mut c_void,
                    std::mem::size_of::<StorageDeviceNumber>() as u32,
                    &mut returned,
                    std::ptr::null(),
                )
            };
            if ok == 0 || sdn.device_number != disk_number {
                continue;
            }

            // Volume is on our disk — lock then force-dismount.
            // FSCTL_LOCK_VOLUME may fail if there are open user-space handles,
            // but FSCTL_DISMOUNT_VOLUME still succeeds and is what matters.
            unsafe {
                DeviceIoControl(
                    file.as_raw_handle() as *mut c_void,
                    FSCTL_LOCK_VOLUME,
                    std::ptr::null(),
                    0,
                    std::ptr::null_mut(),
                    0,
                    &mut returned,
                    std::ptr::null(),
                );
                DeviceIoControl(
                    file.as_raw_handle() as *mut c_void,
                    FSCTL_DISMOUNT_VOLUME,
                    std::ptr::null(),
                    0,
                    std::ptr::null_mut(),
                    0,
                    &mut returned,
                    std::ptr::null(),
                );
            }

            locked.push(file); // Handle stays open → lock stays active
        }

        locked
    }
}

// ============================================
// GLOBAL CANCEL FLAG
// ============================================

static CANCEL_FLAG: AtomicBool = AtomicBool::new(false);

// ============================================
// COUNTING READER  (tracks compressed bytes read for flash progress)
// ============================================

struct CountingReader<R: Read> {
    inner: R,
    count: Arc<AtomicU64>,
}

impl<R: Read> CountingReader<R> {
    fn new(inner: R) -> Self {
        Self {
            inner,
            count: Arc::new(AtomicU64::new(0)),
        }
    }
}

impl<R: Read> Read for CountingReader<R> {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        let n = self.inner.read(buf)?;
        self.count.fetch_add(n as u64, Ordering::Relaxed);
        Ok(n)
    }
}

// ============================================
// HTTP PROXY  (bypasses CORS for Cloudflare API calls)
// ============================================

#[derive(Debug, Deserialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String,
    pub headers: HashMap<String, String>,
    pub body: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub body: String,
    pub error: Option<String>,
}

#[tauri::command]
async fn http_request(request: HttpRequest) -> Result<HttpResponse, String> {
    let client = reqwest::Client::new();

    let mut req_builder = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        "PATCH" => client.patch(&request.url),
        _ => return Err(format!("Unsupported HTTP method: {}", request.method)),
    };

    for (key, value) in request.headers {
        req_builder = req_builder.header(&key, &value);
    }

    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }

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
            let error_msg = if e.is_connect() {
                format!(
                    "Connection failed: Unable to reach {}. Check your internet connection.",
                    request.url
                )
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
// SD CARD PARTITION OPERATIONS  (write config files to already-flashed card)
// ============================================

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
        .creation_flags(CREATE_NO_WINDOW)
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

    #[derive(Deserialize)]
    #[allow(non_snake_case)]
    struct WmiDrive {
        DeviceID: Option<String>,
        VolumeName: Option<String>,
        DriveType: Option<u32>,
        Size: Option<u64>,
        FreeSpace: Option<u64>,
        FileSystem: Option<String>,
    }

    let parse_drive = |d: WmiDrive| -> Option<DetectedDrive> {
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
    };

    let drives: Vec<DetectedDrive> = if trimmed.starts_with('[') {
        let wmi_drives: Vec<WmiDrive> = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse drives JSON: {}", e))?;
        wmi_drives.into_iter().filter_map(parse_drive).collect()
    } else {
        let d: WmiDrive = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse drive JSON: {}", e))?;
        parse_drive(d).into_iter().collect()
    };

    Ok(drives
        .into_iter()
        .filter(|d| d.is_removable || (d.size > 0 && d.size < 256 * 1024 * 1024 * 1024))
        .collect())
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file {}: {}", path, e))
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file {}: {}", path, e))
}

#[tauri::command]
async fn write_binary_file(path: String, content: Vec<u8>) -> Result<(), String> {
    fs::write(&path, &content).map_err(|e| format!("Failed to write file {}: {}", path, e))
}

#[tauri::command]
async fn path_exists(path: String) -> bool {
    Path::new(&path).exists()
}

#[tauri::command]
async fn is_pi_boot_partition(path: String) -> Result<bool, String> {
    let boot_path = Path::new(&path);

    if !boot_path.exists() {
        return Ok(false);
    }

    let indicators = ["bootcode.bin", "start.elf", "config.txt", "cmdline.txt"];
    let found_count = indicators
        .iter()
        .filter(|f| boot_path.join(f).exists())
        .count();

    Ok(found_count >= 2)
}

#[tauri::command]
async fn hash_password(password: String) -> Result<String, String> {
    let params = Sha512Params::new(10_000)
        .map_err(|e| format!("Failed to configure password hashing params: {:?}", e))?;

    sha512_simple(&password, &params)
        .map_err(|e| format!("Failed to hash password: {:?}", e))
}

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

#[tauri::command]
async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path)
        .map_err(|e| format!("Failed to create directory {}: {}", path, e))
}

// ============================================
// OS IMAGE DOWNLOAD & RAW DISK FLASH  (new)
// ============================================

#[derive(Debug, Serialize, Clone)]
pub struct PhysicalDisk {
    pub number: u32,
    pub friendly_name: String,
    pub size: u64,
    pub bus_type: String,
    pub is_removable: bool,
    pub status: String,
}

#[derive(Debug, Serialize, Clone)]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percent: f32,
}

#[derive(Debug, Serialize, Clone)]
pub struct FlashProgress {
    pub compressed_read: u64,
    pub compressed_total: u64,
    pub written: u64,
    pub percent: f32,
}

/// Set / clear the global cancel flag
#[tauri::command]
fn cancel_operation() {
    CANCEL_FLAG.store(true, Ordering::SeqCst);
}

/// Return (and create) the temp directory used for downloaded images
#[tauri::command]
fn get_download_path() -> Result<String, String> {
    let dir = std::env::temp_dir().join("freemen-provisioner");
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Cannot create download directory: {}", e))?;
    Ok(dir.to_string_lossy().into_owned())
}

/// List physical disks (Windows only)
#[tauri::command]
async fn list_physical_disks() -> Result<Vec<PhysicalDisk>, String> {
    #[cfg(target_os = "windows")]
    {
        list_physical_disks_windows().await
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Physical disk listing is only supported on Windows".to_string())
    }
}

#[cfg(target_os = "windows")]
async fn list_physical_disks_windows() -> Result<Vec<PhysicalDisk>, String> {
    let output = Command::new("powershell")
        .creation_flags(CREATE_NO_WINDOW)
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            r#"Get-Disk | Select-Object Number, FriendlyName, @{N='Size';E={[uint64]$_.Size}}, BusType, @{N='IsRemovable';E={$_.BusType -eq 'USB' -or $_.BusType -eq 'SD' -or $_.BusType -eq 'MMC'}}, OperationalStatus | ConvertTo-Json -Compress"#,
        ])
        .output()
        .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "PowerShell error: {}. Make sure to run as Administrator.",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let trimmed = stdout.trim();

    if trimmed.is_empty() || trimmed == "null" {
        return Ok(vec![]);
    }

    #[derive(Deserialize)]
    #[allow(non_snake_case)]
    struct PsDisk {
        Number: Option<u32>,
        FriendlyName: Option<String>,
        Size: Option<u64>,
        BusType: Option<String>,
        IsRemovable: Option<bool>,
        OperationalStatus: Option<String>,
    }

    let parse = |d: PsDisk| -> PhysicalDisk {
        let bus = d.BusType.clone().unwrap_or_default();
        let removable = d.IsRemovable.unwrap_or(false)
            || bus == "USB"
            || bus == "SD"
            || bus == "MMC";
        PhysicalDisk {
            number: d.Number.unwrap_or(0),
            friendly_name: d
                .FriendlyName
                .unwrap_or_else(|| "Unknown Disk".to_string()),
            size: d.Size.unwrap_or(0),
            bus_type: bus,
            is_removable: removable,
            status: d.OperationalStatus.unwrap_or_else(|| "Unknown".to_string()),
        }
    };

    if trimmed.starts_with('[') {
        let disks: Vec<PsDisk> = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse disks: {}", e))?;
        Ok(disks.into_iter().map(parse).collect())
    } else {
        let disk: PsDisk = serde_json::from_str(trimmed)
            .map_err(|e| format!("Failed to parse disk: {}", e))?;
        Ok(vec![parse(disk)])
    }
}

/// Streaming download of an OS image with progress events
#[tauri::command]
async fn download_image(
    url: String,
    dest_path: String,
    window: tauri::Window,
) -> Result<(), String> {
    CANCEL_FLAG.store(false, Ordering::SeqCst);

    let client = reqwest::Client::builder()
        .build()
        .map_err(|e| format!("HTTP client error: {}", e))?;

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;

    if !response.status().is_success() {
        return Err(format!(
            "Server returned {}: {}",
            response.status().as_u16(),
            response.status().canonical_reason().unwrap_or("Error")
        ));
    }

    let total = response.content_length().unwrap_or(0);

    if let Some(parent) = Path::new(&dest_path).parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Cannot create directory: {}", e))?;
    }

    let mut file = tokio::fs::File::create(&dest_path)
        .await
        .map_err(|e| format!("Cannot create file {}: {}", dest_path, e))?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();
    let mut last_emit = std::time::Instant::now();

    while let Some(chunk_result) = stream.next().await {
        if CANCEL_FLAG.load(Ordering::SeqCst) {
            drop(file);
            let _ = fs::remove_file(&dest_path);
            return Err("cancelled".to_string());
        }

        let chunk = chunk_result.map_err(|e| format!("Download error: {}", e))?;

        tokio::io::AsyncWriteExt::write_all(&mut file, &chunk)
            .await
            .map_err(|e| format!("Write error: {}", e))?;

        downloaded += chunk.len() as u64;

        if last_emit.elapsed().as_millis() >= 150 {
            let percent = if total > 0 {
                (downloaded as f32 / total as f32) * 100.0
            } else {
                0.0
            };
            let _ = window.emit(
                "download-progress",
                DownloadProgress {
                    downloaded,
                    total,
                    percent,
                },
            );
            last_emit = std::time::Instant::now();
        }
    }

    let _ = window.emit(
        "download-progress",
        DownloadProgress {
            downloaded,
            total,
            percent: 100.0,
        },
    );

    Ok(())
}

/// Prepare a physical disk for raw writing (Windows only).
///
/// For removable media (SD cards, USB drives) `Set-Disk -IsOffline` is not
/// supported by Windows.  Instead we remove all partition access paths (drive
/// letters) so the OS releases its file-system handles, then the caller opens
/// \\.\PhysicalDriveN with FILE_SHARE_READ | FILE_SHARE_WRITE.
///
/// For fixed disks we still use the traditional offline approach.
#[tauri::command]
async fn prepare_disk_for_flash(disk_number: u32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Clear the read-only attribute via diskpart.
        // Do NOT remove drive letters here — we need them present so that
        // lock_volumes_on_disk() in flash_image_to_disk can open \\.\X: handles,
        // call FSCTL_LOCK_VOLUME + FSCTL_DISMOUNT_VOLUME, and hold those handles
        // open for the duration of the raw write.  Removing letters beforehand
        // makes GetLogicalDrives() miss the mounted-but-letter-less volumes, so
        // nothing gets locked and Windows blocks writes mid-stream (error 5).
        let diskpart_cmds = format!(
            "select disk {0}\r\nattributes disk clear readonly\r\n",
            disk_number
        );
        let tmp_path = format!(
            "{}\\diskflash_{}.txt",
            std::env::temp_dir().display(),
            disk_number
        );
        fs::write(&tmp_path, diskpart_cmds.as_bytes())
            .map_err(|e| format!("Failed to write diskpart script: {}", e))?;
        let _ = Command::new("diskpart")
            .args(["/s", &tmp_path])
            .creation_flags(CREATE_NO_WINDOW)
            .output();
        let _ = fs::remove_file(&tmp_path);

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Disk preparation is only supported on Windows".to_string())
    }
}

/// Decompress an .img.xz file and write it raw to a physical disk, emitting progress events
#[tauri::command]
async fn flash_image_to_disk(
    image_path: String,
    disk_number: u32,
    window: tauri::Window,
) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        CANCEL_FLAG.store(false, Ordering::SeqCst);

        let compressed_size = fs::metadata(&image_path)
            .map_err(|e| format!("Cannot stat image file: {}", e))?
            .len();

        let disk_path = format!("\\\\.\\PhysicalDrive{}", disk_number);
        let image_path_clone = image_path.clone();
        let disk_path_clone = disk_path.clone();
        let window_clone = window.clone();

        let result = tokio::task::spawn_blocking(move || -> Result<(), String> {
            let file = fs::File::open(&image_path_clone)
                .map_err(|e| format!("Cannot open image: {}", e))?;

            let counting = CountingReader::new(BufReader::new(file));
            let compressed_counter = counting.count.clone();

            let mut decoder = XzDecoder::new(counting);

            // Lock every volume on this disk from THIS process before opening the
            // physical disk handle.  The returned handles MUST stay alive until the
            // write is done — dropping them releases the locks and Windows remounts.
            #[cfg(target_os = "windows")]
            let _volume_locks = disk_lock::lock_volumes_on_disk(disk_number);

            // Open the physical disk with GENERIC_READ | GENERIC_WRITE.
            #[cfg(target_os = "windows")]
            let mut disk = {
                use std::os::windows::fs::OpenOptionsExt;
                const FILE_SHARE_READ: u32 = 0x0000_0001;
                const FILE_SHARE_WRITE: u32 = 0x0000_0002;
                fs::OpenOptions::new()
                    .read(true)
                    .write(true)
                    .share_mode(FILE_SHARE_READ | FILE_SHARE_WRITE)
                    .open(&disk_path_clone)
                    .map_err(|e| {
                        format!(
                            "Cannot open disk {}: {}. Make sure to run as Administrator.",
                            disk_path_clone, e
                        )
                    })?
            };
            #[cfg(not(target_os = "windows"))]
            let mut disk = fs::OpenOptions::new()
                .write(true)
                .open(&disk_path_clone)
                .map_err(|e| {
                    format!(
                        "Cannot open disk {}: {}. Make sure to run as Administrator.",
                        disk_path_clone, e
                    )
                })?;

            // Windows raw-disk I/O requires every write to be a multiple of
            // the physical sector size (512 bytes). The XZ decompressor returns
            // variable-length chunks, so we accumulate into `pending` and only
            // flush aligned blocks. The final leftover bytes are zero-padded to
            // the next sector boundary.
            const SECTOR: usize = 512;
            const READ_SIZE: usize = 1024 * 1024; // 1 MB read buffer
            let mut read_buf = vec![0u8; READ_SIZE];
            let mut pending: Vec<u8> = Vec::with_capacity(READ_SIZE + SECTOR);
            let mut written: u64 = 0;
            let mut last_emit = std::time::Instant::now();

            loop {
                if CANCEL_FLAG.load(Ordering::SeqCst) {
                    return Err("cancelled".to_string());
                }

                let n = decoder
                    .read(&mut read_buf)
                    .map_err(|e| format!("Decompress error: {}", e))?;

                if n == 0 {
                    // End of image — flush remaining bytes padded to sector boundary.
                    if !pending.is_empty() {
                        let pad = (SECTOR - pending.len() % SECTOR) % SECTOR;
                        pending.resize(pending.len() + pad, 0);
                        disk.write_all(&pending)
                            .map_err(|e| format!("Disk write error: {}", e))?;
                        written += pending.len() as u64;
                    }
                    break;
                }

                pending.extend_from_slice(&read_buf[..n]);

                // Write once we have at least 1 MB buffered, in sector-aligned chunks.
                if pending.len() >= READ_SIZE {
                    let aligned = (pending.len() / SECTOR) * SECTOR;
                    disk.write_all(&pending[..aligned])
                        .map_err(|e| format!("Disk write error: {}", e))?;
                    written += aligned as u64;
                    pending.drain(..aligned);

                    if last_emit.elapsed().as_millis() >= 200 {
                        let compressed_read = compressed_counter.load(Ordering::Relaxed);
                        let percent = if compressed_size > 0 {
                            ((compressed_read as f32 / compressed_size as f32) * 100.0).min(99.5)
                        } else {
                            0.0
                        };
                        let _ = window_clone.emit(
                            "flash-progress",
                            FlashProgress {
                                compressed_read,
                                compressed_total: compressed_size,
                                written,
                                percent,
                            },
                        );
                        last_emit = std::time::Instant::now();
                    }
                }
            }

            disk.flush()
                .map_err(|e| format!("Failed to flush disk: {}", e))?;

            let _ = window_clone.emit(
                "flash-progress",
                FlashProgress {
                    compressed_read: compressed_size,
                    compressed_total: compressed_size,
                    written,
                    percent: 100.0,
                },
            );

            Ok(())
        })
        .await
        .map_err(|e| format!("Flash task panicked: {}", e))?;

        result
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Disk flashing is only supported on Windows".to_string())
    }
}

/// Bring a disk back online after flashing (Windows only).
///
/// For removable media we never took the disk offline, so we just refresh
/// the partition table so Windows remounts the new partitions.
/// For fixed disks we reverse the offline step first.
#[tauri::command]
async fn restore_disk(disk_number: u32) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // Refresh the disk so Windows remounts the new partitions, then assign
        // a drive letter to partition 1 (the FAT32 boot partition) so that
        // detect_drives() can find it and write the config files.
        let script = format!(
            r#"
$ErrorActionPreference = 'SilentlyContinue'
Update-Disk -Number {0}
Start-Sleep -Seconds 3
$part = Get-Partition -DiskNumber {0} -PartitionNumber 1 -ErrorAction SilentlyContinue
if ($part -and (-not $part.DriveLetter -or $part.DriveLetter -eq [char]0)) {{
    Add-PartitionAccessPath -DiskNumber {0} -PartitionNumber 1 -AssignDriveLetter -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}}
Write-Output "OK"
"#,
            disk_number
        );
        let output = Command::new("powershell")
            .args(["-NoProfile", "-NonInteractive", "-Command", &script])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("Failed to run PowerShell: {}", e))?;

        if !output.status.success() {
            let err = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Failed to restore disk: {}", err.trim()));
        }

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Disk restore is only supported on Windows".to_string())
    }
}

// ============================================
// ENTRY POINT
// ============================================

fn main() {
    #[cfg(all(target_os = "windows", not(debug_assertions)))]
    relaunch_as_admin_if_needed();

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // HTTP proxy
            http_request,
            // SD partition ops (write config files to flashed card)
            detect_drives,
            read_file,
            write_file,
            write_binary_file,
            path_exists,
            is_pi_boot_partition,
            hash_password,
            list_directory,
            create_directory,
            // OS download + raw disk flash
            cancel_operation,
            get_download_path,
            list_physical_disks,
            download_image,
            prepare_disk_for_flash,
            flash_image_to_disk,
            restore_disk,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
