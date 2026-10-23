import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export type OutputRule = "next_to_original" | "folder";
export type Language = "en" | "hi" | "hinglish";
export type Theme = "system" | "light" | "dark";

export interface Settings {
  outputRule: OutputRule;
  outputFolder: string | null;
  language: Language;
  theme: Theme;
  startWithWindows: boolean;
}

export const getSettings = () => invoke<Settings>("get_settings");
export const saveSettings = (settings: Settings) => invoke<Settings>("save_settings", { new: settings });
export const takePendingFiles = () => invoke<string[]>("take_pending_files");

export const onSettingsChanged = (cb: (s: Settings) => void): Promise<UnlistenFn> =>
  listen<Settings>("settings-changed", (e) => cb(e.payload));
export const onFilesPending = (cb: () => void): Promise<UnlistenFn> => listen("files-pending", () => cb());
