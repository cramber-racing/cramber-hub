use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt;

pub const AUTOSTART_ARG: &str = "--minimized";

pub fn launched_minimized() -> bool {
    std::env::args().any(|a| a == AUTOSTART_ARG)
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
}

#[tauri::command]
pub fn show_window_on_startup(app: AppHandle) {
    if !launched_minimized() {
        show_main_window(&app);
    }
}

pub fn show_window_if_frontend_stalls(app: &AppHandle) {
    if launched_minimized() {
        return;
    }
    let handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_secs(3));
        if let Some(w) = handle.get_webview_window("main") {
            if !w.is_visible().unwrap_or(true) {
                show_main_window(&handle);
            }
        }
    });
}

pub fn notify_still_running_once(app: &AppHandle) {
    const KEY: &str = "trayNoticeShown";
    let Ok(store) = app.store("settings.json") else { return };
    if store.get(KEY).and_then(|v| v.as_bool()).unwrap_or(false) {
        return;
    }

    let _ = app
        .notification()
        .builder()
        .title("Cramber Hub is still running")
        .body("It's in the system tray, keeping your profile applied. Right-click the tray icon and choose Quit to exit.")
        .show();

    store.set(KEY, true);
    let _ = store.save();
}

#[tauri::command]
pub fn show_snap_layouts(window: tauri::WebviewWindow) {
    #[cfg(windows)]
    {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
            SendInput, INPUT, INPUT_0, INPUT_KEYBOARD, KEYBDINPUT, KEYEVENTF_KEYUP, VK_LWIN,
        };

        let _ = window.set_focus();

        let key = |vk: u16, up: bool| INPUT {
            r#type: INPUT_KEYBOARD,
            Anonymous: INPUT_0 {
                ki: KEYBDINPUT {
                    wVk: vk,
                    wScan: 0,
                    dwFlags: if up { KEYEVENTF_KEYUP } else { 0 },
                    time: 0,
                    dwExtraInfo: 0,
                },
            },
        };
        const VK_Z: u16 = 0x5A;
        let inputs = [key(VK_LWIN, false), key(VK_Z, false), key(VK_Z, true), key(VK_LWIN, true)];
        unsafe {
            SendInput(inputs.len() as u32, inputs.as_ptr(), std::mem::size_of::<INPUT>() as i32);
        }
    }
    #[cfg(not(windows))]
    let _ = window;
}
