import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Logo } from "../components/Logo";
import { strings } from "../i18n/strings";
import { onFilesPending, takePendingFiles } from "../lib/ipc";
import { useSettings } from "../lib/useSettings";
import "./Popup.css";

const fileName = (p: string) => p.split(/[\\/]/).pop() ?? p;

/**
 * Milestone 1 placeholder: proves files reach the running app.
 * The real Convert / Compress / Clean menu replaces the body in Milestone 3.
 */
export function PopupWindow() {
  const [settings] = useSettings();
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    const pull = () => takePendingFiles().then((f) => f.length && setFiles((old) => [...old, ...f]));
    pull();
    const off = onFilesPending(pull);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && getCurrentWindow().close();
    window.addEventListener("keydown", onKey);
    return () => {
      off.then((f) => f());
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!settings) return null;
  const t = strings[settings.language];

  return (
    <div className="popup-card">
      <header data-tauri-drag-region>
        <Logo size={22} />
        <strong data-tauri-drag-region>{t.filesReceived(files.length)}</strong>
      </header>
      <ul className="files">
        {files.map((f) => (
          <li key={f} title={f}>
            {fileName(f)}
          </li>
        ))}
      </ul>
      <p className="soon">{t.popupSoon}</p>
      <footer>
        <small>{t.escHint}</small>
        <button className="btn btn-primary" autoFocus onClick={() => getCurrentWindow().close()}>
          {t.close}
        </button>
      </footer>
    </div>
  );
}
