use std::sync::Mutex;

use tauri::State;

use super::hid::Device;
use super::protocol::{Command, Response, Value};

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
