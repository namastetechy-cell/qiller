// Live tool demos at 1920x1080, recorded as PNG frame sequences.
// usage: node demos.mjs <outDir> <which> [assetDir]
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [out, which, assets] = process.argv.slice(2);
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  proxy: { server: process.env.HTTPS_PROXY }, args: ["--ignore-certificate-errors", "--autoplay-policy=no-user-gesture-required"],
});
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, userAgent: UA, locale: "en-IN" });
const page = await ctx.newPage();

// background recorder: screenshots back-to-back into dir until stop()
function recorder(name) {
  const dir = `${out}/${name}`; mkdirSync(dir, { recursive: true });
  let on = true, n = 0;
  const done = (async () => { while (on) { await page.screenshot({ path: `${dir}/${String(n++).padStart(4, "0")}.png` }).catch(() => {}); await page.waitForTimeout(60); } })();
  return { stop: async () => { on = false; await done; console.log(`${name}: ${n} frames`); } };
}
async function dismiss() {
  for (const label of ["Accept all", "Accept All", "Accept", "OK, got it", "Got it", "I agree", "Allow all"]) {
    const b = page.getByRole("button", { name: label, exact: true });
    if (await b.count().catch(() => 0)) await b.first().click({ timeout: 1500 }).catch(() => {});
  }
}
const sleep = (ms) => page.waitForTimeout(ms);

if (which === "notebooklm") {
  await page.goto("https://notebooklm.google/", { waitUntil: "networkidle", timeout: 60000 }); await sleep(2000); await dismiss(); await sleep(800);
  const r = recorder("nb_scroll");
  for (let y = 0; y <= 2400; y += 10) { await page.evaluate((y) => scrollTo(0, y), y); await sleep(20); }
  await r.stop();
}

if (which === "chatpdf") {
  await page.goto("https://www.chatpdf.com/", { waitUntil: "networkidle", timeout: 60000 }); await sleep(2000); await dismiss();
  const r1 = recorder("cp_upload");
  await sleep(1200);
  await (await page.$$('input[type="file"]'))[0].setInputFiles(`${assets}/MSA_Contract_Report.pdf`);
  await page.waitForSelector("textarea", { timeout: 60000 }); await sleep(7000);
  await r1.stop();
  await page.click("textarea");
  const r2 = recorder("cp_type");
  await page.keyboard.type("Is document mein key deadlines aur financial risks kya hain?", { delay: 55 });
  await sleep(600); await page.keyboard.press("Enter"); await sleep(1200);
  await r2.stop();
  const r3 = recorder("cp_answer");
  await sleep(26000);
  await r3.stop();
  const h = await page.evaluateHandle(() => [...document.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]);
  const r4 = recorder("cp_scroll");
  const top = await h.evaluate((e) => { const q = [...e.querySelectorAll("*")].find((x) => x.childElementCount === 0 && /key deadlines aur financial/.test(x.textContent)); return q ? q.getBoundingClientRect().top - e.getBoundingClientRect().top + e.scrollTop - 30 : 0; });
  const end = await h.evaluate((e) => e.scrollHeight - e.clientHeight);
  for (let y = top; y <= end; y += 8) { await h.evaluate((e, y) => (e.scrollTop = y), y); await sleep(20); }
  await sleep(800); await r4.stop();
  console.log((await page.innerText("body")).slice(-1800));
}

if (which === "languagetool") {
  await page.goto("https://languagetool.org/", { waitUntil: "networkidle", timeout: 60000 }); await sleep(2000); await dismiss();
  const ed = page.locator('[contenteditable="true"], textarea').first();
  await ed.scrollIntoViewIfNeeded(); await ed.click();
  const r = recorder("lt_type");
  await page.keyboard.type("Hi sir, i want to informed you that the report are not ready yet becuase we was waiting for client data. Please let me know if their is any issue.", { delay: 35 });
  await sleep(6000);
  await r.stop();
  await page.screenshot({ path: `${out}/lt_final.png` });
}

if (which === "whisperweb") {
  await page.goto("https://xenova-whisper-web.static.hf.space/", { waitUntil: "networkidle", timeout: 60000 }); await sleep(3000);
  const r = recorder("ww_run");
  await sleep(800);
  const [fc] = await Promise.all([page.waitForEvent("filechooser", { timeout: 10000 }).catch(() => null), page.getByText("From file", { exact: false }).first().click()]);
  if (fc) await fc.setFiles(`${assets}/vo_clip.wav`); else console.log("no filechooser");
  await sleep(2500);
  const tb = page.getByRole("button", { name: /transcribe/i });
  if (await tb.count()) await tb.first().click();
  for (let i = 0; i < 90; i++) { await sleep(1000); if (/Export|TXT|JSON/.test(await page.innerText("body"))) { await sleep(3000); break; } }
  await r.stop();
  console.log((await page.innerText("body")).slice(0, 1200));
}

if (which === "clipdrop") {
  await page.goto("https://clipdrop.co/cleanup", { waitUntil: "domcontentloaded", timeout: 60000 }); await sleep(8000); await dismiss();
  const r = recorder("cd_run");
  await sleep(800);
  // use the site's own sample photos
  const imgs = page.locator("button img, [role=button] img");
  const n = await imgs.count(); console.log("examples", n);
  if (n) await imgs.nth(Math.min(1, n - 1)).click();
  await sleep(6000);
  // paint over the plant + vase on the table, then Clean
  const cx = 800, cy = 585;
  await page.mouse.move(cx - 40, cy - 70); await page.mouse.down();
  for (let k = 0; k < 7; k++) { await page.mouse.move(cx + 40, cy - 70 + k * 22, { steps: 8 }); await page.mouse.move(cx - 40, cy - 59 + k * 22, { steps: 8 }); }
  await page.mouse.up(); await sleep(900);
  const clean = page.getByRole("button", { name: /^clean$/i });
  if (await clean.count()) await clean.first().click(); else console.log("no clean button");
  await sleep(9000);
  await r.stop();
  await page.screenshot({ path: `${out}/cd_editor.png` });
  console.log((await page.innerText("body")).slice(0, 800));
}

await browser.close();
