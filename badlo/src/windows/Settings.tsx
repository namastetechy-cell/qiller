import { useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { Logo } from "../components/Logo";
import { strings } from "../i18n/strings";
import { saveSettings, type Language, type Settings, type Theme } from "../lib/ipc";
import { useSettings } from "../lib/useSettings";
import "./Settings.css";

const LANGS: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
  { value: "hinglish", label: "Hinglish" },
];

function Segmented<T extends string>(props: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={props.label}>
      {props.options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={props.value === o.value}
          className={props.value === o.value ? "on" : ""}
          onClick={() => props.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsWindow() {
  const [settings, setLocal] = useSettings();
  const [status, setStatus] = useState<{ kind: "saved" | "error"; text: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!settings) return null;
  const t = strings[settings.language];

  // Every change saves immediately; there is no Save button to forget.
  const commit = async (next: Settings) => {
    const previous = settings;
    setLocal(next);
    try {
      const saved = await saveSettings(next);
      setLocal(saved);
      setStatus({ kind: "saved", text: strings[saved.language].saved });
    } catch (err) {
      setLocal(previous);
      setStatus({ kind: "error", text: String(err) });
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(null), 2000);
  };

  const pickFolder = async () => {
    const dir = await open({ directory: true, multiple: false, defaultPath: settings.outputFolder ?? undefined });
    if (typeof dir === "string") commit({ ...settings, outputRule: "folder", outputFolder: dir });
  };

  const themes: { value: Theme; label: string }[] = [
    { value: "system", label: t.themeSystem },
    { value: "light", label: t.themeLight },
    { value: "dark", label: t.themeDark },
  ];

  return (
    <main className="settings">
      <header>
        <Logo size={40} />
        <div>
          <h1>Badlo</h1>
          <p>{t.tagline}</p>
        </div>
      </header>

      <section>
        <h2>{t.saveWhere}</h2>
        <label className={`choice ${settings.outputRule === "next_to_original" ? "on" : ""}`}>
          <input
            type="radio"
            name="rule"
            checked={settings.outputRule === "next_to_original"}
            onChange={() => commit({ ...settings, outputRule: "next_to_original" })}
          />
          <span>
            <strong>{t.nextTo}</strong>
            <small>{t.nextToHint}</small>
          </span>
        </label>
        <label className={`choice ${settings.outputRule === "folder" ? "on" : ""}`}>
          <input
            type="radio"
            name="rule"
            checked={settings.outputRule === "folder"}
            onChange={() => (settings.outputFolder ? commit({ ...settings, outputRule: "folder" }) : pickFolder())}
          />
          <span>
            <strong>{t.inFolder}</strong>
            <small className="path" title={settings.outputFolder ?? ""}>
              {settings.outputFolder ?? t.noFolder}
            </small>
          </span>
          <button className="btn" onClick={(e) => (e.preventDefault(), pickFolder())}>
            {t.chooseFolder}
          </button>
        </label>
      </section>

      <section>
        <h2>{t.language}</h2>
        <Segmented label={t.language} value={settings.language} options={LANGS} onChange={(language) => commit({ ...settings, language })} />
      </section>

      <section>
        <h2>{t.theme}</h2>
        <Segmented label={t.theme} value={settings.theme} options={themes} onChange={(theme) => commit({ ...settings, theme })} />
      </section>

      <section>
        <label className="toggle-row">
          <span>
            <strong>{t.startup}</strong>
            <small>{t.startupHint}</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            className="switch"
            checked={settings.startWithWindows}
            onChange={(e) => commit({ ...settings, startWithWindows: e.target.checked })}
          />
        </label>
      </section>

      <footer>
        <span className="offline">{t.offline}</span>
        <span className={`status ${status?.kind ?? ""}`} aria-live="polite">
          {status?.text}
        </span>
      </footer>
    </main>
  );
}
