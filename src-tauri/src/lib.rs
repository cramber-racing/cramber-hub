mod device;
mod game_watch;
mod profiles;
mod tray;
mod window;

use device::{DeviceState, Joystick};
use device::commands as base;
use game_watch::GameWatch;
use tauri::{Manager, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| window::show_main_window(app)))
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![window::AUTOSTART_ARG]),
        ))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(DeviceState::default())
        .manage(Joystick::default())
        .manage(GameWatch::default())
        .setup(|app| {
            tray::setup(app)?;
            window::show_window_if_frontend_stalls(app.handle());
            app.state::<GameWatch>().start(app.handle().clone());
            app.state::<Joystick>().start();
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
                window::notify_still_running_once(window.app_handle());
            }
        })
        .invoke_handler(tauri::generate_handler![
            base::connect,
            base::is_connected,
            base::get_serial,
            base::get_param,
            base::get_params,
            base::get_defaults,
            base::set_param,
            base::calibrate,
            base::clear_fault,
            base::reboot,
            base::get_wheel_axis,
            base::inspect_firmware,
            base::bootloader_present,
            base::update_firmware,
            profiles::read_profile_file,
            profiles::write_profile_file,
            game_watch::set_game_watch,
            tray::set_tray_profiles,
            window::show_window_on_startup,
            window::show_snap_layouts,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
