use tauri::menu::{CheckMenuItem, IsMenuItem, Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, Runtime};

use crate::window::show_main_window;

const TRAY_ID: &str = "main";
const PROFILE_ITEM_PREFIX: &str = "profile:";

#[derive(serde::Deserialize)]
pub struct TrayProfile {
    id: String,
    name: String,
}

fn build_menu<R: Runtime, M: Manager<R>>(
    manager: &M,
    profiles: &[TrayProfile],
    active_id: Option<&str>,
    has_more: bool,
) -> tauri::Result<Menu<R>> {
    let mut checks = Vec::with_capacity(profiles.len());
    for p in profiles {
        checks.push(CheckMenuItem::with_id(
            manager,
            format!("{PROFILE_ITEM_PREFIX}{}", p.id),
            &p.name,
            true,
            Some(p.id.as_str()) == active_id,
            None::<&str>,
        )?);
    }
    let all_profiles = MenuItem::with_id(manager, "all-profiles", "All profiles…", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(manager)?;
    let open = MenuItem::with_id(manager, "open", "Open Cramber Hub", true, None::<&str>)?;
    let quit = MenuItem::with_id(manager, "quit", "Quit", true, None::<&str>)?;

    let mut items: Vec<&dyn IsMenuItem<R>> = checks.iter().map(|c| c as &dyn IsMenuItem<R>).collect();
    if has_more {
        items.push(&all_profiles);
    }
    if !checks.is_empty() {
        items.push(&separator);
    }
    items.push(&open);
    items.push(&quit);
    Menu::with_items(manager, &items)
}

#[tauri::command]
pub fn set_tray_profiles(
    app: AppHandle,
    profiles: Vec<TrayProfile>,
    active_id: Option<String>,
    has_more: bool,
) -> Result<(), String> {
    let menu = build_menu(&app, &profiles, active_id.as_deref(), has_more).map_err(|e| e.to_string())?;
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        tray.set_menu(Some(menu)).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn setup(app: &tauri::App) -> tauri::Result<()> {
    let menu = build_menu(app, &[], None, false)?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(app.default_window_icon().cloned().expect("app icon"))
        .tooltip("Cramber Hub")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => show_main_window(app),
            "all-profiles" => {
                show_main_window(app);
                let _ = app.emit("navigate", "/profiles");
            }
            "quit" => app.exit(0),
            id => {
                if let Some(profile_id) = id.strip_prefix(PROFILE_ITEM_PREFIX) {
                    let _ = app.emit("tray-select-profile", profile_id.to_string());
                }
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                show_main_window(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}
