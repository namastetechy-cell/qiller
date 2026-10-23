# Badlo

Offline Windows tray app that converts files right where they are.
Pick a file, pick a format, and a new copy (`name_badlo.ext`) is saved next to the original.

- 100% offline: no network calls, telemetry, update checks or login.
- Never overwrites or deletes the original.
- Tauri 2 + Rust backend, React + TypeScript (Vite) UI.

## Develop (Windows 10/11, 64-bit)

One-time setup: [Rust](https://rustup.rs) (MSVC toolchain), Visual Studio Build Tools with
"Desktop development with C++", Node.js 20+. WebView2 ships with Windows 10/11.

```bash
npm install
npm run tauri dev        # run the app with live reload
npm run icons            # regenerate icons from src-tauri/icons/badlo.svg
npm run licenses         # regenerate THIRD_PARTY_LICENSES.txt (fails on a disallowed licence)
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri build      # MSI + NSIS installers in src-tauri/target/release/bundle/
```

Every push that touches `badlo/` also builds the installers on GitHub Actions
(workflow "Badlo Windows build"); download them from the run's artifacts.

## Layout

```
src/                 React UI (one bundle; each window loads index.html?view=...)
  windows/           Settings and the cursor popup
  i18n/strings.ts    English, हिन्दी, Hinglish
  theme/tokens.css   Design tokens, light/dark
src-tauri/src/
  lib.rs             App setup, commands, single-instance hand-off
  settings.rs        settings.json + "Start with Windows"
  tray.rs            Tray icon and menu
  windows.rs         Window creation, file arguments, on-screen popup placement
```
