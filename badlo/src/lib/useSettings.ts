import { useEffect, useState } from "react";
import { getSettings, onSettingsChanged, type Settings } from "./ipc";

function applyTheme(s: Settings) {
  const root = document.documentElement;
  if (s.theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", s.theme);
  root.lang = s.language === "hi" ? "hi" : "en";
}

/** Current settings, kept in sync across windows. */
export function useSettings(): [Settings | null, (s: Settings) => void] {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSettings().then((s) => {
      applyTheme(s);
      setSettings(s);
    });
    const off = onSettingsChanged((s) => {
      applyTheme(s);
      setSettings(s);
    });
    return () => {
      off.then((f) => f());
    };
  }, []);

  const update = (s: Settings) => {
    applyTheme(s);
    setSettings(s);
  };
  return [settings, update];
}
