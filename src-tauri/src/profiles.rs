const PROFILE_FILE_MAX_BYTES: u64 = 1024 * 1024;

#[tauri::command]
pub fn read_profile_file(path: String) -> Result<String, String> {
    let size = std::fs::metadata(&path).map_err(|e| e.to_string())?.len();
    if size > PROFILE_FILE_MAX_BYTES {
        return Err("File is too large to be a profile.".into());
    }
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_profile_file(path: String, contents: String) -> Result<(), String> {
    std::fs::write(&path, contents).map_err(|e| e.to_string())
}
