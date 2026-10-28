// Desktop (1920x1080) b-roll capture: page hero + smooth scroll as PNG frame sequences.
// usage: node capture.mjs <outDir> <jobs.json>
import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const [out, jobsFile] = process.argv.slice(2);
const jobs = JSON.parse(readFileSync(jobsFile, "utf8"));
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
  proxy: { server: process.env.HTTPS_PROXY }, args: ["--ignore-certificate-errors"],
});
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

async function dismiss(page) {
  for (const label of ["Accept all", "Accept All", "Accept", "Allow all", "I agree", "Agree", "Got it", "OK", "Accept cookies", "Allow All Cookies", "Reject all"]) {
    const b = page.getByRole("button", { name: label, exact: true });
    if (await b.count().catch(() => 0)) { await b.first().click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(400); }
  }
}

for (const job of jobs) {
  const dir = `${out}/${job.name}`; mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, userAgent: UA, locale: "en-IN" });
  const page = await ctx.newPage();
  try {
    await page.goto(job.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(job.wait ?? 2500);
    await dismiss(page);
    for (const label of job.click ?? []) { const b = page.getByText(label, { exact: true }); if (await b.count().catch(() => 0)) { await b.first().click({ timeout: 3000 }).catch(() => {}); await page.waitForTimeout(job.clickWait ?? 2500); } }
    if (job.css) await page.addStyleTag({ content: job.css });
    await page.screenshot({ path: `${dir}/hero.png` });
    const total = Math.min(job.scroll ?? 1800, await page.evaluate(() => document.scrollingElement.scrollHeight - innerHeight));
    let n = 0;
    for (let y = 0; y <= total; y += job.step ?? 12) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(25);
      await page.screenshot({ path: `${dir}/${String(n++).padStart(4, "0")}.png` });
    }
    console.log(`${job.name}: ok "${(await page.title()).slice(0, 60)}" frames=${n} scroll=${total}`);
  } catch (e) {
    console.log(`${job.name}: FAIL ${e.message.split("\n")[0]}`);
    await page.screenshot({ path: `${dir}/hero.png` }).catch(() => {});
  }
  await ctx.close();
}
await browser.close();
