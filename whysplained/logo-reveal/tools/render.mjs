// Usage: node tools/render.mjs <16x9|9x16|1x1> <out.mp4> [--reduced] [--audio audio.wav]
//        node tools/render.mjs <aspect> --stills <dir> t1,t2,...   (PNG stills at times)
// Steps t = n/60 through window.seek(t) in headless Chromium and pipes PNGs to ffmpeg.
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const SIZES = { "16x9": [1920, 1080], "9x16": [1080, 1920], "1x1": [1080, 1080] };
const args = process.argv.slice(2);
const aspect = args[0];
const [W, H] = SIZES[aspect] ?? (() => { throw new Error("aspect must be 16x9, 9x16 or 1x1"); })();
const reduced = args.includes("--reduced");
const audio = args.includes("--audio") ? args[args.indexOf("--audio") + 1] : null;
const FPS = 60;

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const url = pathToFileURL(path.join(root, "index.html")).href + (reduced ? "?reduced" : "");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(url);
await page.evaluate(() => window.ready);
const dur = await page.evaluate(() => window.TIMELINE.duration);

async function frame(t) {
  await page.evaluate(t => window.seek(t), t);
  return page.screenshot({ type: "png" });
}

if (args.includes("--stills")) {
  const dir = args[args.indexOf("--stills") + 1];
  const times = args[args.indexOf("--stills") + 2].split(",").map(Number);
  fs.mkdirSync(dir, { recursive: true });
  for (const t of times) fs.writeFileSync(path.join(dir, `${aspect}${reduced ? "_reduced" : ""}_t${t.toFixed(2)}.png`), await frame(t));
} else {
  const out = args[1];
  const ff = ["-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-"];
  if (audio) ff.push("-i", audio);
  ff.push("-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart");
  if (audio) ff.push("-c:a", "aac", "-b:a", "192k", "-shortest");
  ff.push(out);
  const proc = spawn("ffmpeg", ff, { stdio: ["pipe", "ignore", "inherit"] });
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) {
    const buf = await frame(i / FPS);
    if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once("drain", r));
  }
  proc.stdin.end();
  await new Promise((res, rej) => proc.on("close", c => (c === 0 ? res() : rej(new Error("ffmpeg " + c)))));
  console.log(`wrote ${out} (${n} frames)`);
}
await browser.close();
