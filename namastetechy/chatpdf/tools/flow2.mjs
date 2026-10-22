import { chromium } from "playwright";
const [dir, pdf] = process.argv.slice(2);
const Q = "Is pooray chapter ki summary aur top 5 exam questions batao.";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell", proxy: { server: process.env.HTTPS_PROXY }, args: ["--ignore-certificate-errors"] });
const ctx = await b.newContext({ viewport: { width: 432, height: 936 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
const page = await ctx.newPage();
await page.goto("https://www.chatpdf.com/", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(1500);
// hide the "Download the app" banner: remove the fixed element containing that text
await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) { const s = getComputedStyle(el); if ((s.position === "fixed" || s.position === "sticky") && /Download the ChatPDF app/.test(el.textContent || "") && el.textContent.length < 200) el.style.visibility = "hidden"; } });
await page.screenshot({ path: `${dir}/home_clean.png` });
await (await page.$$('input[type="file"]'))[0].setInputFiles(pdf);
await page.waitForSelector("textarea", { timeout: 60000 }); await page.waitForTimeout(6000);
if (!(await page.$("textarea"))) { await b.close(); process.exit(0); }
await page.click("textarea"); await page.keyboard.type(Q); await page.keyboard.press("Enter");
await page.waitForTimeout(35000);
// find the scrollable chat container and scroll to the top of the answer, then down to the questions
const h = await page.evaluateHandle(() => [...document.querySelectorAll("*")].filter((e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).sort((a, b) => b.scrollHeight - a.scrollHeight)[0]);
const info = await h.evaluate((e) => ({ sh: e.scrollHeight, ch: e.clientHeight, top: e.scrollTop }));
console.log(info);
// start where the user's question bubble is
const qTop = await h.evaluate((e) => { const q = [...e.querySelectorAll("*")].find((x) => x.childElementCount === 0 && /Is pooray chapter/.test(x.textContent)); return q ? q.getBoundingClientRect().top - e.getBoundingClientRect().top + e.scrollTop - 20 : e.scrollTop; });
let y = qTop, n = 0; const end = info.sh - info.ch;
await h.evaluate((e, y) => (e.scrollTop = y), y);
while (true) { await page.screenshot({ path: `${dir}/f_scroll/${String(n++).padStart(4, "0")}.png` }); if (y >= end) break; y = Math.min(end, y + 14); await h.evaluate((e, y) => (e.scrollTop = y), y); await page.waitForTimeout(30); }
console.log("scroll frames", n);
await b.close();
