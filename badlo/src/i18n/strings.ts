import type { Language } from "../lib/ipc";

const en = {
  tagline: "Convert files right where they are.",
  saveWhere: "Where to save new files",
  nextTo: "Next to the original",
  nextToHint: "photo.heic → photo_badlo.jpg, in the same folder",
  inFolder: "Always in one folder",
  chooseFolder: "Choose folder…",
  noFolder: "No folder chosen yet",
  language: "Language",
  theme: "Look",
  themeSystem: "Match Windows",
  themeLight: "Light",
  themeDark: "Dark",
  startup: "Start with Windows",
  startupHint: "Badlo waits quietly in the tray. Uses almost no memory.",
  saved: "Saved ✓",
  offline: "100% offline. Your files never leave this PC.",
  filesReceived: (n: number) => (n === 1 ? "1 file ready" : `${n} files ready`),
  popupSoon: "Format choices land here in the next update.",
  close: "Close",
  escHint: "Esc to close",
};

type Strings = typeof en;

const hi: Strings = {
  tagline: "फ़ाइल जहाँ है, वहीं बदलें।",
  saveWhere: "नई फ़ाइल कहाँ सेव हो",
  nextTo: "असली फ़ाइल के बगल में",
  nextToHint: "photo.heic → photo_badlo.jpg, उसी फ़ोल्डर में",
  inFolder: "हमेशा एक ही फ़ोल्डर में",
  chooseFolder: "फ़ोल्डर चुनें…",
  noFolder: "अभी कोई फ़ोल्डर नहीं चुना",
  language: "भाषा",
  theme: "रूप",
  themeSystem: "Windows जैसा",
  themeLight: "लाइट",
  themeDark: "डार्क",
  startup: "Windows के साथ चालू करें",
  startupHint: "Badlo ट्रे में चुपचाप इंतज़ार करता है।",
  saved: "सेव हो गया ✓",
  offline: "100% ऑफ़लाइन। आपकी फ़ाइलें इस PC से बाहर नहीं जातीं।",
  filesReceived: (n: number) => `${n} फ़ाइल तैयार`,
  popupSoon: "फ़ॉर्मेट के विकल्प अगले अपडेट में यहाँ आएँगे।",
  close: "बंद करें",
  escHint: "बंद करने के लिए Esc",
};

const hinglish: Strings = {
  tagline: "File jahan hai, wahin badlo.",
  saveWhere: "Nayi file kahan save ho",
  nextTo: "Original ke bagal mein",
  nextToHint: "photo.heic → photo_badlo.jpg, same folder mein",
  inFolder: "Hamesha ek hi folder mein",
  chooseFolder: "Folder chuno…",
  noFolder: "Abhi koi folder nahi chuna",
  language: "Bhasha",
  theme: "Look",
  themeSystem: "Windows jaisa",
  themeLight: "Light",
  themeDark: "Dark",
  startup: "Windows ke saath start karo",
  startupHint: "Badlo tray mein chupchaap wait karta hai.",
  saved: "Ho gaya ✓",
  offline: "100% offline. Aapki files is PC se bahar nahi jaatin.",
  filesReceived: (n: number) => (n === 1 ? "1 file ready" : `${n} files ready`),
  popupSoon: "Format choices agle update mein yahan aayenge.",
  close: "Band karo",
  escHint: "Esc se band karo",
};

export const strings: Record<Language, Strings> = { en, hi, hinglish };
