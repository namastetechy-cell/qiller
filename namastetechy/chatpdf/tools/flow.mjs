import { chromium } from "playwright";
const [dir, pdf] = process.argv.slice(2);
const Q = "Is pooray chapter ki summary aur top 5 exam questions batao.";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell", proxy: { server: process.env.HTTPS_PROXY }, args: ["--ignore-certificate-errors"] });
const ctx = await b.newContext({ viewport: { width: 432, height: 936 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
const page = await ctx.newPage();
let n = 0;
const shot = (sub) => page.screenshot({ path: `${dir}/${sub}/${String(n++).padStart(4, "0")}.png` }).catch(() => {});
await page.goto("https://www.chatpdf.com/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
// dismiss the app banner if present
for (const sel of ['button[aria-label*="lose" i]', 'text=×']) { const el = await page.$(sel); if (el) { await el.click().catch(() => {}); break; } }
await page.mouse.click(5, 5).catch(() => {});
await page.screenshot({ path: `${dir}/home_clean.png` });
const inputs = await page.$$('input[type="file"]');
console.log("file inputs:", inputs.length);
n = 0;
await shot("f_upload");
await inputs[0].setInputFiles(pdf);
const t0 = Date.now();
while (Date.now() - t0 < 25000) { await shot("f_upload"); await page.waitForTimeout(250); }
console.log("url after upload:", page.url());
const ta = await page.$("textarea") || await page.$('[contenteditable="true"]');
console.log("chat box:", !!ta);
if (!ta) { console.log((await page.innerText("body")).slice(0, 1500)); await b.close(); process.exit(0); }
await ta.click(); n = 0;
for (const ch of Q) { await page.keyboard.type(ch); await shot("f_type"); }
await page.waitForTimeout(400); await shot("f_type");
await page.keyboard.press("Enter"); n = 0;
const t1 = Date.now();
while (Date.now() - t1 < 40000) { await shot("f_answer"); await page.waitForTimeout(300); }
await page.screenshot({ path: `${dir}/answer_final.png` });
console.log((await page.innerText("body")).slice(-2500));
await b.close();
