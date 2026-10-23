//! Creating and placing Badlo's two windows: Settings and the cursor popup.

use std::path::{Path, PathBuf};
use std::sync::Mutex;

use tauri::{
    AppHandle, Emitter, Manager, PhysicalPosition, Runtime, Theme as WinTheme, WebviewUrl,
    WebviewWindow, WebviewWindowBuilder,
};

use crate::settings::{SettingsState, Theme};

pub const SETTINGS: &str = "settings";
pub const POPUP: &str = "popup";

/// Popup size in logical pixels (scaled per monitor).
const POPUP_W: f64 = 360.0;
const POPUP_H: f64 = 280.0;

/// Files handed to Badlo (command line or second launch) that the popup hasn't picked up yet.
#[derive(Default)]
pub struct PendingFiles(pub Mutex<Vec<String>>);

/// Pulls file paths out of a command line. Skips the exe itself and `--flags`,
/// resolves relative paths against the caller's working folder, drops anything
/// that isn't an existing file, and removes duplicates while keeping order.
pub fn collect_files(argv: &[String], cwd: &Path) -> Vec<PathBuf> {
    let mut out: Vec<PathBuf> = Vec::new();
    for arg in argv.iter().skip(1) {
        if arg.starts_with("--") || arg.trim().is_empty() {
            continue;
        }
        let raw = PathBuf::from(arg.trim_matches('"'));
        let path = if raw.is_absolute() { raw } else { cwd.join(raw) };
        if path.is_file() && !out.contains(&path) {
            out.push(path);
        }
    }
    out
}

/// Where to put a window of `size` so its corner sits at the cursor but it never
/// leaves the monitor's work area. Flips left/up when there is no room.
pub fn place_in_area(cursor: (i32, i32), size: (i32, i32), area: (i32, i32, i32, i32)) -> (i32, i32) {
    let (cx, cy) = cursor;
    let (w, h) = size;
    let (ax, ay, aw, ah) = area;
    let fit = |c: i32, len: i32, start: i32, span: i32| -> i32 {
        let end = start + span;
        let pos = if c + len <= end { c } else { c - len };
        pos.clamp(start, (end - len).max(start))
    };
    (fit(cx, w, ax, aw), fit(cy, h, ay, ah))
}

fn window_theme(theme: Theme) -> Option<WinTheme> {
    match theme {
        Theme::System => None,
        Theme::Light => Some(WinTheme::Light),
        Theme::Dark => Some(WinTheme::Dark),
    }
}

/// Applies the light/dark choice to every open window's title bar and webview.
pub fn apply_theme<R: Runtime>(app: &AppHandle<R>, theme: Theme) {
    for window in app.webview_windows().values() {
        let _ = window.set_theme(window_theme(theme));
    }
}

fn current_theme<R: Runtime>(app: &AppHandle<R>) -> Option<WinTheme> {
    window_theme(app.state::<SettingsState>().0.lock().unwrap().theme)
}

fn focus<R: Runtime>(window: &WebviewWindow<R>) {
    let _ = window.unminimize();
    let _ = window.show();
    let _ = window.set_focus();
}

pub fn open_settings<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window(SETTINGS) {
        focus(&window);
        return;
    }
    let built = WebviewWindowBuilder::new(app, SETTINGS, WebviewUrl::App("index.html?view=settings".into()))
        .title("Badlo")
        .inner_size(520.0, 640.0)
        .min_inner_size(440.0, 520.0)
        .center()
        .theme(current_theme(app))
        .build();
    if let Ok(window) = built {
        focus(&window);
    }
}

/// Receives files (first launch or a second launch forwarded by single-instance)
/// and shows the popup at the mouse cursor.
pub fn receive_files<R: Runtime>(app: &AppHandle<R>, argv: Vec<String>, cwd: &Path) {
    let files = collect_files(&argv, cwd);
    if files.is_empty() {
        // Launched with no files (e.g. from the Start menu): show settings so the app isn't silent.
        if !argv.iter().any(|a| a == "--autostart") {
            open_settings(app);
        }
        return;
    }
    let files: Vec<String> = files.into_iter().map(|p| p.to_string_lossy().into_owned()).collect();
    app.state::<PendingFiles>().0.lock().unwrap().extend(files);
    open_popup(app);
}

fn open_popup<R: Runtime>(app: &AppHandle<R>) {
    let window = match app.get_webview_window(POPUP) {
        Some(window) => {
            // Already open: tell it to pick up the new files.
            let _ = window.emit("files-pending", ());
            window
        }
        None => {
            let built = WebviewWindowBuilder::new(app, POPUP, WebviewUrl::App("index.html?view=popup".into()))
                .title("Badlo")
                .inner_size(POPUP_W, POPUP_H)
                .decorations(false)
                .transparent(true)
                .shadow(false)
                .resizable(false)
                .always_on_top(true)
                .skip_taskbar(true)
                .visible(false)
                .theme(current_theme(app))
                .build();
            match built {
                Ok(window) => window,
                Err(_) => return,
            }
        }
    };
    position_at_cursor(app, &window);
    focus(&window);
}

fn position_at_cursor<R: Runtime>(app: &AppHandle<R>, window: &WebviewWindow<R>) {
    let Ok(cursor) = app.cursor_position() else { return };
    let monitor = app
        .monitor_from_point(cursor.x, cursor.y)
        .ok()
        .flatten()
        .or_else(|| app.primary_monitor().ok().flatten());
    let Some(monitor) = monitor else { return };

    let scale = monitor.scale_factor();
    let size = ((POPUP_W * scale) as i32, (POPUP_H * scale) as i32);
    let work = monitor.work_area();
    let area = (work.position.x, work.position.y, work.size.width as i32, work.size.height as i32);
    let (x, y) = place_in_area((cursor.x as i32, cursor.y as i32), size, area);
    let _ = window.set_size(tauri::PhysicalSize::new(size.0 as u32, size.1 as u32));
    let _ = window.set_position(PhysicalPosition::new(x, y));
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("badlo-test-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn collects_files_with_spaces_and_hindi_names() {
        let dir = temp_dir("args");
        let spaced = dir.join("my photo 1.jpg");
        let hindi = dir.join("मेरी फ़ोटो.png");
        fs::write(&spaced, b"x").unwrap();
        fs::write(&hindi, b"x").unwrap();

        let argv = vec![
            "badlo.exe".to_string(),
            "--autostart".to_string(),
            spaced.to_string_lossy().into_owned(),
            "मेरी फ़ोटो.png".to_string(), // relative to cwd
            spaced.to_string_lossy().into_owned(), // duplicate
            dir.join("missing.jpg").to_string_lossy().into_owned(),
        ];
        assert_eq!(collect_files(&argv, &dir), vec![spaced, hindi]);
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn ignores_folders() {
        let dir = temp_dir("folders");
        let argv = vec!["badlo.exe".to_string(), dir.to_string_lossy().into_owned()];
        assert!(collect_files(&argv, &dir).is_empty());
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn popup_opens_at_cursor_when_there_is_room() {
        assert_eq!(place_in_area((100, 100), (360, 280), (0, 0, 1920, 1040)), (100, 100));
    }

    #[test]
    fn popup_flips_near_bottom_right_corner() {
        assert_eq!(place_in_area((1900, 1030), (360, 280), (0, 0, 1920, 1040)), (1540, 750));
    }

    #[test]
    fn popup_stays_on_second_monitor_left_of_primary() {
        // Monitor at negative x (to the left of the primary screen).
        let area = (-1280, 0, 1280, 984);
        assert_eq!(place_in_area((-10, 500), (360, 280), area), (-370, 500));
        assert_eq!(place_in_area((-1275, 980), (360, 280), area), (-1275, 700));
    }

    #[test]
    fn popup_bigger_than_screen_pins_to_top_left() {
        assert_eq!(place_in_area((50, 50), (800, 600), (0, 0, 640, 480)), (0, 0));
    }
}
