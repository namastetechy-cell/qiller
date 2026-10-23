mod i18n;
mod settings;
mod tray;
mod windows;

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, RunEvent, State};
use tauri_plugin_autostart::MacosLauncher;

use settings::{Settings, SettingsState};
use windows::PendingFiles;

#[tauri::command]
fn get_settings(state: State<SettingsState>) -> Settings {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
fn save_settings(app: AppHandle, state: State<SettingsState>, new: Settings) -> Result<Settings, String> {
    new.validate()?;
    let old = state.0.lock().unwrap().clone();
    if old.start_with_windows != new.start_with_windows {
        settings::apply_autostart(&app, new.start_with_windows)?;
    }
    settings::store(&app, &new)?;
    *state.0.lock().unwrap() = new.clone();

    if old.language != new.language {
        tray::refresh(&app, new.language);
    }
    if old.theme != new.theme {
        windows::apply_theme(&app, new.theme);
    }
    let _ = app.emit("settings-changed", &new);
    Ok(new)
}

/// The popup calls this when it opens (and on `files-pending`) to take the queued files.
#[tauri::command]
fn take_pending_files(pending: State<PendingFiles>) -> Vec<String> {
    std::mem::take(&mut *pending.0.lock().unwrap())
}

#[tauri::command]
fn open_settings(app: AppHandle) {
    windows::open_settings(&app);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        // Must be registered first: a second launch hands its arguments to this
        // running instance and then exits.
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            windows::receive_files(app, argv, std::path::Path::new(&cwd));
        }))
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--autostart"])))
        .plugin(tauri_plugin_dialog::init())
        .manage(PendingFiles::default())
        .setup(|app| {
            let handle = app.handle().clone();
            let loaded = settings::init(&handle);
            app.manage(SettingsState(Mutex::new(loaded)));
            tray::create(&handle)?;

            let argv: Vec<String> = std::env::args_os().map(|a| a.to_string_lossy().into_owned()).collect();
            let cwd = std::env::current_dir().unwrap_or_default();
            windows::receive_files(&handle, argv, &cwd);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            take_pending_files,
            open_settings
        ])
        .build(tauri::generate_context!())
        .expect("failed to start Badlo");

    app.run(|_app, event| {
        // Closing the last window keeps Badlo in the tray; only "Quit" (exit code set) exits.
        if let RunEvent::ExitRequested { api, code, .. } = event {
            if code.is_none() {
                api.prevent_exit();
            }
        }
    });
}
