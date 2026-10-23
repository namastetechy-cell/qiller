//! The few strings the Rust side shows itself (tray menu). The UI has its own dictionaries.

use crate::settings::Language;

pub struct TrayText {
    pub settings: &'static str,
    pub quit: &'static str,
    pub tooltip: &'static str,
}

pub fn tray(lang: Language) -> TrayText {
    match lang {
        Language::En => TrayText {
            settings: "Settings",
            quit: "Quit Badlo",
            tooltip: "Badlo - right-click a file to convert",
        },
        Language::Hi => TrayText {
            settings: "सेटिंग्स",
            quit: "Badlo बंद करें",
            tooltip: "Badlo - फ़ाइल बदलने के लिए राइट-क्लिक करें",
        },
        Language::Hinglish => TrayText {
            settings: "Settings",
            quit: "Badlo band karo",
            tooltip: "Badlo - file pe right-click karo",
        },
    }
}
