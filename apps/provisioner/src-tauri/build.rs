fn main() {
    #[cfg(target_os = "windows")]
    {
        // Only require Administrator elevation in release builds.
        // In debug builds (tauri dev) we use the default asInvoker manifest so
        // the Tauri CLI can spawn the binary without triggering UAC.
        let is_release = std::env::var("PROFILE").unwrap_or_default() == "release";
        let mut windows_attrs = tauri_build::WindowsAttributes::new();
        if is_release {
            windows_attrs = windows_attrs.app_manifest(include_str!("app.manifest"));
        }
        tauri_build::try_build(
            tauri_build::Attributes::new().windows_attributes(windows_attrs),
        )
        .expect("failed to run tauri-build");
        return;
    }
    #[allow(unreachable_code)]
    tauri_build::build()
}
