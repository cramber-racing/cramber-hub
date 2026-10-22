use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, State};

use super::firmware::{self, FirmwareImage, FirmwareInfo, Stage};
use super::hid::Device;
use super::joystick::Joystick;
use super::protocol::{Command, Response, Value, BOOTLOADER_CONFIRM};

#[derive(Default)]
pub struct DeviceState(Mutex<Device>);

fn with_device<T>(state: &State<DeviceState>, f: impl FnOnce(&mut Device) -> Result<T, String>) -> Result<T, String> {
    let mut device = state.0.lock().map_err(|_| "device lock poisoned".to_string())?;
    f(&mut device)
}

#[tauri::command]
pub fn connect(state: State<DeviceState>) -> Result<bool, String> {
    with_device(&state, |d| {
        d.connect()?;
        Ok(d.is_connected())
    })
}

#[tauri::command]
pub fn is_connected(state: State<DeviceState>) -> bool {
    state.0.lock().map(|d| d.is_connected()).unwrap_or(false)
}

#[tauri::command]
pub fn get_serial(state: State<DeviceState>) -> Option<String> {
    state.0.lock().ok().and_then(|d| d.serial())
}

#[tauri::command]
pub fn get_param(state: State<DeviceState>, id: u16) -> Result<Response, String> {
    with_device(&state, |d| d.transact(Command::Get, id, Value::None))
}

#[tauri::command]
pub fn get_params(state: State<DeviceState>, ids: Vec<u16>) -> Result<Vec<Response>, String> {
    ids.iter()
        .map(|&id| with_device(&state, |d| d.transact(Command::Get, id, Value::None)))
        .collect()
}

#[tauri::command]
pub fn get_defaults(state: State<DeviceState>, ids: Vec<u16>) -> Result<Vec<Response>, String> {
    ids.iter()
        .map(|&id| with_device(&state, |d| d.transact(Command::GetDefault, id, Value::None)))
        .collect()
}

#[tauri::command]
pub fn set_param(state: State<DeviceState>, id: u16, value: Value) -> Result<Response, String> {
    with_device(&state, |d| d.transact(Command::Set, id, value))
}

#[tauri::command]
pub fn calibrate(state: State<DeviceState>, caltype: u16) -> Result<Response, String> {
    with_device(&state, |d| d.transact(Command::Calibrate, caltype, Value::None))
}

#[tauri::command]
pub fn clear_fault(state: State<DeviceState>) -> Result<Response, String> {
    with_device(&state, |d| d.transact(Command::ClearFault, 0, Value::None))
}

#[tauri::command]
pub fn reboot(state: State<DeviceState>) -> Result<(), String> {
    with_device(&state, |d| {
        let _ = d.transact(Command::Reboot, 0, Value::None);
        d.disconnect();
        Ok(())
    })
}

#[tauri::command]
pub fn get_wheel_axis(joystick: State<Joystick>) -> Option<f32> {
    joystick.axis()
}

// ── firmware update ─────────────────────────────────────────────────────

#[tauri::command]
pub fn inspect_firmware(path: String) -> Result<FirmwareInfo, String> {
    Ok(FirmwareImage::read(&path)?.info())
}

#[tauri::command]
pub fn bootloader_present() -> bool {
    firmware::bootloader_present()
}

#[derive(Clone, Serialize)]
struct UpdateProgress {
    stage: Stage,
    progress: f64,
}

#[tauri::command]
pub async fn update_firmware(app: AppHandle, path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let image = FirmwareImage::read(&path)?;
        let report = |stage: Stage, progress: f64| {
            let _ = app.emit("firmware-update", UpdateProgress { stage, progress });
        };

        if !firmware::bootloader_present() {
            report(Stage::Restarting, 0.0);
            let state = app.state::<DeviceState>();
            with_device(&state, |d| {
                d.connect()?;
                let response = d.transact(Command::EnterBootloader, BOOTLOADER_CONFIRM, Value::None)?;
                d.disconnect();
                match response.status {
                    0 => Ok(()),
                    _ => Err("The base refused to enter update mode. Update its firmware with a programmer once.".into()),
                }
            })?;
        }

        let mut bootloader = firmware::wait_for_bootloader()?;
        bootloader.install(&image, report)
    })
    .await
    .map_err(|e| e.to_string())?
}
