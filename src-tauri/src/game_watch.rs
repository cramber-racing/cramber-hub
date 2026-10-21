use std::collections::HashSet;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use sysinfo::{ProcessRefreshKind, ProcessesToUpdate, System};
use tauri::{AppHandle, Emitter, State};

const POLL_INTERVAL: Duration = Duration::from_secs(3);

#[derive(Default, Clone)]
pub struct GameWatch {
    watched: Arc<Mutex<Vec<String>>>,
}

impl GameWatch {
    pub fn set_watched(&self, exes: Vec<String>) {
        if let Ok(mut w) = self.watched.lock() {
            *w = exes.into_iter().map(|e| e.to_lowercase()).collect();
        }
    }

    pub fn start(&self, app: AppHandle) {
        let watched = self.watched.clone();
        thread::spawn(move || {
            let mut sys = System::new();
            let mut last: Option<String> = None;
            loop {
                let wanted = watched.lock().map(|w| w.clone()).unwrap_or_default();
                let current = if wanted.is_empty() {
                    None
                } else {
                    sys.refresh_processes_specifics(ProcessesToUpdate::All, true, ProcessRefreshKind::nothing());
                    let running: HashSet<String> = sys
                        .processes()
                        .values()
                        .map(|p| p.name().to_string_lossy().to_lowercase())
                        .collect();
                    wanted.into_iter().find(|exe| running.contains(exe))
                };

                if current != last {
                    let _ = app.emit("game-detected", current.clone());
                    last = current;
                }
                thread::sleep(POLL_INTERVAL);
            }
        });
    }
}

#[tauri::command]
pub fn set_game_watch(watch: State<GameWatch>, exes: Vec<String>) {
    watch.set_watched(exes);
}
