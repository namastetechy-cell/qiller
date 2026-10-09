// Whysplained Shorts template: turns a raw faceless video (images + voiceover) into a
// HyperFrames composition with per-scene zooms, zoom-punch cuts, word-by-word captions,
// a hook card, a CTA box and SFX. The raw video's picture and audio timing are never changed.
//
// usage: node build.mjs videos/<slug>
// needs in videos/<slug>/: edit.json, scenes.json, words.json, input/raw.mp4 (see README.md)
import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const dir = process.argv[2];
if (!dir) throw new Error("usage: node build.mjs videos/<slug>");
const read = (f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const edit = read("edit.json");
const { cuts, duration } = read("scenes.json");
const { words } = read("words.json");

// ---------- style (brand) ----------
const W = 1080, H = 1920, FPS = 30;
const ZOOM = [1.0, 1.12];          // per-scene zoom range, alternating in / out
const PUNCH = { scale: 1.06, frames: 8, flash: 0.22 };
const CAPTION_Y = 0.62;           // caption centre, fraction of height (bottom 20% kept clear)
// The raw export pillar/letterboxes each image (content box inside the frame). FILL scales it
// to cover the frame; measure with: ffmpeg -i raw.mp4 -vf cropdetect -f null -  (edit.json "contentBox").
const [rawW, rawH] = edit.rawSize || [W, H];
const [boxW, boxH] = edit.contentBox ? edit.contentBox.slice(0, 2) : [rawW, rawH];
const FILL = +Math.max(rawW / boxW, rawH / boxH).toFixed(4);
const SFX = {                      // peak dBFS of the source file -> target peak in the mix
  whoosh: { file: "whoosh.wav", peak: -6.4, target: -18, len: 0.55, lead: 0.25 },
  click: { file: "click.wav", peak: -2.4, target: -20, len: 0.08, lead: 0 },
};
const vol = (s) => +Math.pow(10, (s.target - s.peak) / 20).toFixed(3);

// ---------- keywords: each keyword highlights its first occurrence only ----------
const norm = (w) => w.toLowerCase().replace(/[.,!?]+$/, "");
const isKey = new Array(words.length).fill(false);
for (const k of edit.keywords) {
  const parts = k.split(/\s+/).map(norm);
  for (let i = 0; i + parts.length <= words.length; i++) {
    if (parts.every((p, j) => norm(words[i + j].text) === p && words[i + j].line === words[i].line)) {
      parts.forEach((_, j) => (isKey[i + j] = true));
      break;
    }
  }
}

// ---------- caption chunks: 2-4 words, split on line ends and pauses ----------
const mode = (t) => (t < edit.hookEnd ? "hook" : t >= edit.ctaStart ? "cta" : "cap");
const chunks = [];
let cur = [];
const flush = () => { if (cur.length) chunks.push(cur); cur = []; };
words.forEach((w, i) => {
  const prev = words[i - 1];
  const split = prev && (w.line !== prev.line || w.start - prev.end > 0.28 || mode(w.start) !== mode(prev.start));
  const max = mode(w.start) === "hook" ? 5 : 4;
  if (split || cur.length >= max) flush();
  cur.push({ ...w, i });
  if (cur.length >= 2 && /[,?]$/.test(w.text)) flush(); // break after a clause
});
flush();
// merge a dangling single word back into the previous chunk of the same line
for (let c = chunks.length - 1; c > 0; c--) {
  const a = chunks[c - 1], b = chunks[c];
  if (b.length === 1 && a.length < 5 && a[0].line === b[0].line && mode(a[0].start) === mode(b[0].start)) {
    a.push(...b); chunks.splice(c, 1);
  }
}
const timedChunks = chunks.map((ch, c) => {
  const start = ch[0].start;
  const next = chunks[c + 1];
  let end = ch[ch.length - 1].end + 0.35;
  if (next && next[0].start - end < 0.5) end = next[0].start;
  return { words: ch, start, end: Math.min(end, duration), mode: mode(start) };
});

// ---------- scenes ----------
const bounds = [...cuts, duration];
const scenes = cuts.map((t, i) => ({ start: t, end: bounds[i + 1], from: ZOOM[i % 2], to: ZOOM[(i + 1) % 2] }));

// ---------- markup ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const captionHtml = timedChunks.map((c, n) => `
      <div id="cap-${n}" class="clip capClip ${c.mode}" data-start="${c.start.toFixed(3)}" data-duration="${(c.end - c.start).toFixed(3)}" data-track-index="3">
        <div class="capRow"><div class="box">${c.words.map((w) => `<span id="w-${w.i}" class="w${isKey[w.i] ? " key" : ""}">${esc(w.text)}</span>`).join(" ")}</div></div>
      </div>`).join("");

const sfxCues = [
  // edit.json "whoosh": false turns off the cut whooshes
  ...(edit.whoosh === false ? [] : cuts.slice(1).map((t) => ["whoosh", t - SFX.whoosh.lead])),
  ...words.filter((_, i) => isKey[i] && (i === 0 || !isKey[i - 1] || words[i - 1].line !== words[i].line)).map((w) => ["click", w.start]),
].sort((a, b) => a[1] - b[1]);
const laneEnds = [];
const audioHtml = sfxCues.map(([k, t], n) => {
  const s = SFX[k];
  t = Math.max(0, t);
  let lane = laneEnds.findIndex((e) => e <= t);
  if (lane < 0) lane = laneEnds.push(0) - 1;
  laneEnds[lane] = t + s.len;
  return `<audio id="sfx-${n}" src="assets/sfx/${s.file}" data-start="${t.toFixed(3)}" data-duration="${s.len}" data-track-index="${10 + lane}" data-volume="${vol(s)}"></audio>`;
}).join("\n    ");

const f = (n) => +(n / FPS).toFixed(4);
const tlCode = [
  // scene zooms
  ...scenes.map((s, i) => `tl.fromTo("#zoom", { scale: ${s.from} }, { scale: ${s.to}, duration: ${(s.end - s.start).toFixed(3)}, ease: "sine.inOut"${i ? ", immediateRender: false" : ""} }, ${s.start.toFixed(3)});`),
  // zoom-punch + flash centred on each cut
  ...cuts.slice(1).flatMap((t, i) => [
    `tl.fromTo("#punch", { scale: 1 }, { scale: ${PUNCH.scale}, duration: ${f(PUNCH.frames / 2)}, ease: "power2.in"${i ? ", immediateRender: false" : ""} }, ${(t - f(PUNCH.frames / 2)).toFixed(4)});`,
    `tl.fromTo("#punch", { scale: ${PUNCH.scale} }, { scale: 1, duration: ${f(PUNCH.frames / 2)}, ease: "power2.out", immediateRender: false }, ${t.toFixed(4)});`,
    `tl.fromTo("#flash", { opacity: ${PUNCH.flash} }, { opacity: 0, duration: ${f(PUNCH.frames / 2)}, ease: "power1.out"${i ? ", immediateRender: false" : ""} }, ${t.toFixed(4)});`,
  ]),
  // words appear on their spoken time; keywords pop 80% -> 110% -> 100%
  // (in the boxed hook / CTA, upcoming words wait dimmed so the box never looks half-empty)
  ...timedChunks.flatMap((c) => c.words.map((w) => isKey[w.i]
    ? `tl.fromTo("#w-${w.i}", { opacity: ${c.mode === "cap" ? 0 : 0.3}, scale: 0.8 }, { keyframes: [{ opacity: 1, scale: 1.1, duration: 0.1 }, { scale: 1, duration: 0.08 }], ease: "power2.out" }, ${w.start.toFixed(3)});`
    : `tl.fromTo("#w-${w.i}", { opacity: ${c.mode === "cap" ? 0 : 0.3}, y: ${c.mode === "cap" ? 14 : 0} }, { opacity: 1, y: 0, duration: 0.09, ease: "power2.out" }, ${w.start.toFixed(3)});`)),
  // hook / CTA boxes scale in
  ...timedChunks.filter((c) => c.mode !== "cap" && (c === timedChunks.find((x) => x.mode === c.mode))).map((c) =>
    `tl.fromTo("#cap-${timedChunks.indexOf(c)} .box", { scale: 0.85 }, { scale: 1, duration: 0.25, ease: "back.out(2)" }, ${c.start.toFixed(3)});`),
].join("\n      ");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2"); }
      @font-face { font-family: "Montserrat"; font-weight: 900; src: url("assets/fonts/montserrat-latin-900-normal.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #000; }
      #punch, #zoom { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 50% 50%; }
      #fill { position: absolute; inset: 0; width: 100%; height: 100%; transform: scale(${FILL}); transform-origin: 50% 50%; }
      #raw { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #flash { position: absolute; inset: 0; width: 100%; height: 100%; background: #fff; opacity: 0; }

      .capClip { position: absolute; inset: 0; width: 100%; height: 100%; }
      .capRow { position: absolute; left: 60px; right: 60px; top: ${Math.round(H * CAPTION_Y)}px; height: 0; display: flex; justify-content: center; align-items: center; }
      .box { display: block; max-width: 900px; text-align: center; font-family: "Montserrat", sans-serif; font-weight: 800; text-transform: uppercase; line-height: 1.12; transform-origin: 50% 50%; }
      .w { display: inline-block; transform-origin: 50% 70%; }
      .cap .box { font-size: 82px; color: #fff; -webkit-text-stroke: 8px #000; paint-order: stroke fill; text-shadow: 0 6px 14px rgba(0,0,0,.55); }
      .cap .w.key { color: #ffd400; font-size: 1.15em; }
      .hook .capRow { top: ${Math.round(H * 0.5)}px; }
      .hook .box { background: #000; color: #ffd400; font-size: 92px; font-weight: 900; padding: 30px 40px; border-radius: 26px; box-shadow: 0 18px 50px rgba(0,0,0,.5); }
      .hook .w.key { color: #fff; }
      .cta .box { background: #ffd400; color: #000; font-size: 74px; font-weight: 900; padding: 26px 38px; border-radius: 24px; box-shadow: 0 16px 40px rgba(0,0,0,.45); }
      .cta .w.key { font-size: 1.12em; text-decoration: underline; text-decoration-thickness: 8px; text-underline-offset: 8px; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${duration}" data-width="${W}" data-height="${H}">
      <div id="punch"><div id="zoom"><div id="fill">
        <video id="raw" class="clip" src="${edit.input}" playsinline data-has-audio="true" data-start="0" data-duration="${duration}" data-track-index="0" data-volume="1"></video>
      </div></div></div>
      <div id="flash"></div>${captionHtml}
    </div>

    ${audioHtml}

    <script>
      const tl = gsap.timeline({ paused: true });
      ${tlCode}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;

// assets travel with each video project so it renders on its own
mkdirSync(join(dir, "assets"), { recursive: true });
cpSync(join(HERE, "assets"), join(dir, "assets"), { recursive: true });
writeFileSync(join(dir, "index.html"), html);
writeFileSync(join(dir, "hyperframes.json"), JSON.stringify({ $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { assets: "assets" }, media: { autoProxy: true } }, null, 2));
console.log(`${dir}/index.html: ${scenes.length} scenes, ${timedChunks.length} caption chunks, ${isKey.filter(Boolean).length} keyword words, ${sfxCues.length} sfx`);
