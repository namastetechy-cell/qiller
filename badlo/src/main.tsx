import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./theme/tokens.css";
import { SettingsWindow } from "./windows/Settings";
import { PopupWindow } from "./windows/Popup";

// Each Tauri window loads index.html?view=<name>.
const view = new URLSearchParams(window.location.search).get("view");
if (view === "popup") document.body.classList.add("popup");

// No browser context menu: this is an app, not a web page.
window.addEventListener("contextmenu", (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>{view === "popup" ? <PopupWindow /> : <SettingsWindow />}</React.StrictMode>,
);
