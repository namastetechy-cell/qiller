use tauri::image::Image;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Runtime};

use crate::i18n;
use crate::settings::{Language, SettingsState};
use crate::windows;

const TRAY_ID: &str = "badlo-tray";

fn build_menu<R: Runtime>(app: &AppHandle<R>, lang: Language) -> tauri::Result<Menu<R>> {
    let text = i18n::tray(lang);
    let settings = MenuItem::with_id(app, "settings", text.settings, true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "quit", text.quit, true, None::<&str>)?;
    Menu::with_items(app, &[&settings, &PredefinedMenuItem::separator(app)?, &quit])
}

pub fn create<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let lang = app.state::<SettingsState>().0.lock().unwrap().language;
    let icon = Image::from_bytes(include_bytes!("../icons/32x32.png"))?;

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .tooltip(i18n::tray(lang).tooltip)
        .menu(&build_menu(app, lang)?)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "settings" => windows::open_settings(app),
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                windows::open_settings(tray.app_handle());
            }
        })
        .build(app)?;
    Ok(())
}

/// Rebuilds the menu text after the language changes.
pub fn refresh<R: Runtime>(app: &AppHandle<R>, lang: Language) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        if let Ok(menu) = build_menu(app, lang) {
            let _ = tray.set_menu(Some(menu));
        }
        let _ = tray.set_tooltip(Some(i18n::tray(lang).tooltip));
    }
}
