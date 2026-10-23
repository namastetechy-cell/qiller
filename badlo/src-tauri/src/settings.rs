//! User settings, stored as JSON in the app config folder
//! (%APPDATA%\app.badlo.desktop\settings.json on Windows).

use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, Runtime};
use tauri_plugin_autostart::ManagerExt;

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum OutputRule {
    /// Save the new file in the same folder as the original.
    NextToOriginal,
    /// Save every new file into `output_folder`.
    Folder,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Language {
    En,
    Hi,
    Hinglish,
}

#[derive(Serialize, Deserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    System,
    Light,
    Dark,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub output_rule: OutputRule,
    pub output_folder: Option<String>,
    pub language: Language,
    pub theme: Theme,
    pub start_with_windows: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            output_rule: OutputRule::NextToOriginal,
            output_folder: None,
            language: Language::En,
            theme: Theme::System,
            start_with_windows: true,
        }
    }
}

impl Settings {
    pub fn validate(&self) -> Result<(), String> {
        if self.output_rule == OutputRule::Folder {
            match &self.output_folder {
                Some(dir) if PathBuf::from(dir).is_dir() => {}
                Some(_) => return Err("That folder doesn't exist any more.".into()),
                None => return Err("Pick a folder first.".into()),
            }
        }
        Ok(())
    }
}

pub struct SettingsState(pub Mutex<Settings>);

fn settings_path<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("settings.json"))
}

/// Loads settings from disk. Returns `(settings, first_run)`.
pub fn load<R: Runtime>(app: &AppHandle<R>) -> (Settings, bool) {
    let Ok(path) = settings_path(app) else {
        return (Settings::default(), true);
    };
    match fs::read_to_string(&path) {
        Ok(text) => (serde_json::from_str(&text).unwrap_or_default(), false),
        Err(_) => (Settings::default(), true),
    }
}

/// Writes settings atomically (temp file + rename) so a crash never leaves half a file.
pub fn store<R: Runtime>(app: &AppHandle<R>, settings: &Settings) -> Result<(), String> {
    let path = settings_path(app)?;
    let tmp = path.with_extension("json.tmp");
    let text = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&tmp, text).map_err(|e| e.to_string())?;
    fs::rename(&tmp, &path).map_err(|e| e.to_string())
}

/// Makes the Windows "Run" registry entry match the setting.
pub fn apply_autostart<R: Runtime>(app: &AppHandle<R>, enabled: bool) -> Result<(), String> {
    let launcher = app.autolaunch();
    let current = launcher.is_enabled().unwrap_or(false);
    if enabled && !current {
        launcher.enable().map_err(|e| e.to_string())?;
    } else if !enabled && current {
        launcher.disable().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Called once at startup. The registry is the source of truth for
/// "start with Windows", so the user can also turn it off in Task Manager.
pub fn init<R: Runtime>(app: &AppHandle<R>) -> Settings {
    let (mut settings, first_run) = load(app);
    if first_run {
        // Debug builds would register the dev exe, so only release builds opt in.
        if cfg!(debug_assertions) {
            settings.start_with_windows = false;
        }
        let _ = apply_autostart(app, settings.start_with_windows);
        let _ = store(app, &settings);
    } else {
        settings.start_with_windows = app.autolaunch().is_enabled().unwrap_or(false);
    }
    settings
}
