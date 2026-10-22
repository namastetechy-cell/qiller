import { chromium } from "playwright";
const [inp, out] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell" });
const p = await b.newPage(); await p.goto("file://" + inp); await p.pdf({ path: out, format: "A4" }); await b.close();
