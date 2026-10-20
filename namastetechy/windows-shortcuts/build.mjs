// "5 Windows shortcuts" Short, Bold Poster frame preset (white / ink / tomato red,
// tilted Shrikhand, Baskerville body, Space Grotesk chrome). The raw video's picture and
// audio play untouched inside a double-ruled poster frame; everything else is layered on top.
// usage: node build.mjs   (reads words.json, writes index.html)
import { readFileSync, writeFileSync } from "node:fs";

const W = 1080, H = 1920, DURATION = 39.45;
const C = { bg: "#FFFFFF", dark: "#1C1410", red: "#D8000F", light: "#F5F2EF" };
const STACKED = "0.03em 0.03em 0 rgba(28,20,16,.25), 0.06em 0.06em 0 rgba(28,20,16,.2), 0.09em 0.09em 0 rgba(28,20,16,.15)";
const { words } = JSON.parse(readFileSync(new URL("./words.json", import.meta.url), "utf8"));

// Sections start on the spoken "Number N"; focus = vertical centre of the raw frame to show (0..1).
const SECTIONS = [
  { n: 5, at: 6.24, keys: ["WIN", "L"], line: "Seat chhodo, laptop turant lock.", focus: 0.5 },
  { n: 4, at: 11.5, keys: ["WIN", "."], line: "PC par emoji keyboard.", focus: 0.33 },
  { n: 3, at: 16.54, keys: ["CTRL", "SHIFT", "T"], line: "Galti se band tab, sab wapas.", focus: 0.3 },
  { n: 2, at: 22.72, keys: ["WIN", "V"], line: "Clipboard history: jo bhi copy kiya.", focus: 0.47 },
  { n: 1, at: 29.34, keys: ["WIN", "SHIFT", "S"], line: "Screen ka koi bhi hissa, screenshot.", focus: 0.3 },
];
const CTA_AT = 34.98;   // raw picture is black from here: the closing card owns the frame
const HOOK_FOCUS = 0.45;
const ends = [...SECTIONS.map((s) => s.at).slice(1), CTA_AT];

// Frame geometry: raw 1080x1920 scaled to the frame width; we pan a window over it.
const FR = { x: 40, y: 480, w: 1000, h: 860 };
const SCALE = FR.w / 1080, RAW_H = 1920 * SCALE;
const panY = (f) => Math.round(Math.min(0, Math.max(FR.h - RAW_H, FR.h / 2 - f * RAW_H)));

// Slam card runs from "Number" to just after the digit is spoken.
const slamOf = (s) => {
  const i = words.findIndex((w) => w.start >= s.at - 0.05 && /^number$/i.test(w.text));
  const digit = words[i + 1];
  return { start: words[i].start, end: Math.max(words[i].start + 0.75, digit.end + 0.25) };
};

// ---------- caption groups: 2-4 words, split on lines, pauses and clauses ----------
const groups = [];
let cur = [];
words.forEach((w, i) => {
  const p = words[i - 1];
  if (cur.length && p && (w.line !== p.line || w.start - p.end > 0.28 || cur.length >= 4)) { groups.push(cur); cur = []; }
  cur.push({ ...w, i });
  if (cur.length >= 2 && /[,?:.!]$/.test(w.text)) { groups.push(cur); cur = []; }
});
if (cur.length) groups.push(cur);
const timed = groups.map((g, k) => {
  const next = groups[k + 1];
  const end = next ? Math.min(next[0].start, g[g.length - 1].end + 0.3) : DURATION;
  return { words: g, start: g[0].start, end: Math.max(end, g[0].start + 0.2) };
});

// ---------- markup ----------
const keycaps = (keys) => keys.map((k) => `<span class="key">${k}</span>`).join('<span class="plus">+</span>');
const pad2 = (n) => String(n).padStart(2, "0");

const sectionHeads = SECTIONS.map((s, k) => `
      <div id="head-${s.n}" class="clip layer" data-start="${s.at}" data-duration="${(ends[k] - s.at).toFixed(2)}" data-track-index="2">
        <div class="eyebrow" style="left:340px;top:96px">Shortcut no. ${pad2(s.n)} / 05</div>
        <div id="num-${s.n}" class="statNum">${s.n}</div>
        <div id="keys-${s.n}" class="keys">${keycaps(s.keys)}</div>
        <div id="line-${s.n}" class="tagline">${s.line}</div>
      </div>`).join("");

const slams = SECTIONS.map((s) => {
  const { start, end } = slamOf(s);
  return `
      <div id="slam-${s.n}" class="clip layer slam" data-start="${start.toFixed(2)}" data-duration="${(end - start).toFixed(2)}" data-track-index="4">
        <div class="slamInner" id="slamIn-${s.n}">
          <div class="eyebrow light">Number</div>
          <div class="slamNum">${s.n}</div>
        </div>
      </div>`;
}).join("");

const recapRows = [...SECTIONS].reverse().map((s) => `
            <div class="cell num">${pad2(s.n)}</div><div class="cell keysCell">${s.keys.join(" + ")}</div>`).join("");

const capHtml = timed.map((g, k) => `
      <div id="cap-${k}" class="clip layer" data-start="${g.start.toFixed(3)}" data-duration="${(g.end - g.start).toFixed(3)}" data-track-index="5">
        <div class="capStage"><div class="capCard"><div class="capLine">${g.words.map((w) => `<span id="cw-${w.i}" class="cw">${w.text}</span>`).join(" ")}</div></div></div>
      </div>`).join("");

// ---------- timeline ----------
const T = [];
const add = (s) => T.push(s);
// progress bar grows across the whole film
add(`tl.fromTo("#progress", { scaleX: 0 }, { scaleX: 1, duration: ${DURATION}, ease: "none" }, 0);`);
// hook: hero stack
add(`tl.fromTo("#h1", { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: "power3.out" }, 0.05);`);
add(`tl.fromTo("#h2", { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: "power3.out" }, 2.5);`);
add(`tl.fromTo("#h3", { scale: 1.8, opacity: 0, rotation: -12 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.35, ease: "back.out(2)" }, 3.38);`);
add(`tl.fromTo("#hookEyebrow", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.4, ease: "power2.out" }, 0.3);`);
// frame pan: hook focus, then each section's focus during its slam
add(`tl.set("#pan", { y: ${panY(HOOK_FOCUS)} }, 0);`);
SECTIONS.forEach((s) => add(`tl.to("#pan", { y: ${panY(s.focus)}, duration: 0.5, ease: "power2.inOut" }, ${(slamOf(s).start + 0.1).toFixed(2)});`));
// slow push-in on the footage, alternating per section
[0, ...SECTIONS.map((s) => s.at)].forEach((t, k, arr) => {
  const to = (k === arr.length - 1 ? CTA_AT : arr[k + 1]) - t;
  add(`tl.fromTo("#push", { scale: ${k % 2 ? 1.06 : 1} }, { scale: ${k % 2 ? 1 : 1.06}, duration: ${to.toFixed(2)}, ease: "sine.inOut"${k ? ", immediateRender: false" : ""} }, ${t});`);
});
// slams: red panel wipes in, numeral slams, wipes out
SECTIONS.forEach((s) => {
  const { start, end } = slamOf(s);
  add(`tl.fromTo("#slam-${s.n}", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.16, ease: "power3.out" }, ${start.toFixed(2)});`);
  add(`tl.fromTo("#slamIn-${s.n}", { scale: 1.7, rotation: -14 }, { scale: 1, rotation: -6, duration: 0.3, ease: "back.out(1.8)" }, ${(start + 0.05).toFixed(2)});`);
  add(`tl.to("#slam-${s.n}", { clipPath: "inset(0 0% 0 100%)", duration: 0.16, ease: "power3.in" }, ${(end - 0.16).toFixed(2)});`);
  // section header entrances right after the slam
  const e = end - 0.1;
  add(`tl.fromTo("#num-${s.n}", { scale: 1.6, rotation: -16, opacity: 0 }, { scale: 1, rotation: -6, opacity: 1, duration: 0.35, ease: "back.out(2)" }, ${e.toFixed(2)});`);
  add(`tl.fromTo("#keys-${s.n} .key, #keys-${s.n} .plus", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, stagger: 0.07, ease: "power3.out" }, ${(e + 0.15).toFixed(2)});`);
  add(`tl.fromTo("#line-${s.n}", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "power2.out" }, ${(e + 0.4).toFixed(2)});`);
});
// closing card
add(`tl.fromTo("#closeIn", { yPercent: 100 }, { yPercent: 0, duration: 0.4, ease: "power3.out" }, ${CTA_AT});`);
add(`tl.fromTo("#close1", { scale: 1.7, opacity: 0, rotation: -14 }, { scale: 1, opacity: 1, rotation: -5, duration: 0.35, ease: "back.out(2)" }, ${(CTA_AT + 1.5).toFixed(2)});`);
add(`tl.fromTo("#close2", { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, ${(CTA_AT + 2.0).toFixed(2)});`);
add(`tl.fromTo(".recap > .cell", { opacity: 0 }, { opacity: 1, duration: 0.18, stagger: 0.05, ease: "none" }, ${(CTA_AT + 0.35).toFixed(2)});`);
add(`tl.fromTo("#sub", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power2.out" }, ${(CTA_AT + 2.45).toFixed(2)});`);
// captions: 3-state karaoke (upcoming faint ink / active red panel / spoken ink), seek-safe sets
timed.forEach((g) => g.words.forEach((w, j) => {
  const nextAt = j + 1 < g.words.length ? g.words[j + 1].start : Math.min(g.end, w.end + 0.1);
  add(`tl.set("#cw-${w.i}", { attr: { class: "cw" } }, ${g.start.toFixed(3)});`);
  add(`tl.set("#cw-${w.i}", { attr: { class: "cw on" } }, ${w.start.toFixed(3)});`);
  add(`tl.set("#cw-${w.i}", { attr: { class: "cw done" } }, ${nextAt.toFixed(3)});`);
}));

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Shrikhand"; font-weight: 400; src: url("assets/fonts/shrikhand-latin-400-normal.woff2") format("woff2"); }
      @font-face { font-family: "Libre Baskerville"; font-weight: 400; src: url("assets/fonts/libre-baskerville-latin-400-normal.woff2") format("woff2"); }
      @font-face { font-family: "Space Grotesk"; font-weight: 600; src: url("assets/fonts/space-grotesk-latin-600-normal.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.bg}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${C.bg}; color: ${C.dark}; font-family: "Libre Baskerville", serif; }
      .layer { position: absolute; inset: 0; width: 100%; height: 100%; }
      .eyebrow { position: absolute; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 28px; letter-spacing: 3px; text-transform: uppercase; color: ${C.red}; white-space: nowrap; }
      .eyebrow.light { position: static; color: ${C.bg}; font-size: 40px; letter-spacing: 6px; text-align: center; }

      /* poster frame: 3px outer ink rule + 1.5px inner rule, square corners, no shadow */
      #frameOuter { position: absolute; left: ${FR.x - 14}px; top: ${FR.y - 14}px; width: ${FR.w + 28}px; height: ${FR.h + 28}px; border: 3px solid ${C.dark}; background: ${C.light}; }
      #frame { position: absolute; left: ${FR.x}px; top: ${FR.y}px; width: ${FR.w}px; height: ${FR.h}px; overflow: hidden; outline: 1.5px solid ${C.dark}; background: #000; }
      #push { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 50% 50%; }
      #pan { position: absolute; left: 0; top: 0; width: ${FR.w}px; height: ${RAW_H.toFixed(1)}px; }
      #raw { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

      /* hook hero stack */
      .stackLine { position: absolute; left: 50px; overflow: hidden; font-family: "Shrikhand", serif; font-weight: 400; line-height: 1.12; white-space: nowrap; }
      .stackLine > div { display: block; }

      /* section header */
      .statNum { position: absolute; left: 40px; top: 30px; width: 280px; font-family: "Shrikhand", serif; font-size: 360px; line-height: 1.05; color: ${C.red}; text-align: center; transform-origin: 50% 60%; }
      .keys { position: absolute; left: 340px; top: 150px; width: 700px; display: flex; align-items: center; flex-wrap: nowrap; gap: 14px; }
      .key { display: inline-block; padding: 10px 22px 16px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 4px; font-family: "Shrikhand", serif; font-size: 58px; line-height: 1.05; color: ${C.dark}; background: ${C.bg}; }
      .plus { display: inline-block; font-family: "Shrikhand", serif; font-size: 56px; color: ${C.red}; }
      .tagline { position: absolute; left: 340px; top: 300px; width: 700px; padding-left: 18px; border-left: 4px solid ${C.red}; font-size: 34px; line-height: 1.5; color: ${C.dark}; }

      /* red slam panel (hero stat): white Shrikhand numeral with the stacked shadow */
      .slam { background: ${C.red}; display: flex; align-items: center; justify-content: center; }
      .slamInner { display: flex; flex-direction: column; align-items: center; transform-origin: 50% 50%; }
      .slamNum { font-family: "Shrikhand", serif; font-size: 620px; line-height: 1; color: ${C.bg}; text-shadow: ${STACKED}; }

      /* closing card */
      #close { background: ${C.bg}; overflow: hidden; }
      #closeIn { position: absolute; inset: 0; width: 100%; height: 100%; background: ${C.bg}; }
      #close1 { position: absolute; left: 40px; top: 140px; font-family: "Shrikhand", serif; font-size: 190px; line-height: 1; color: ${C.red}; transform-origin: 30% 60%; white-space: nowrap; }
      #close2 { position: absolute; left: 330px; top: 330px; font-family: "Shrikhand", serif; font-size: 150px; line-height: 1; color: ${C.dark}; transform: rotate(2deg); white-space: nowrap; }
      .recap { position: absolute; left: 60px; top: 560px; width: 960px; display: grid; grid-template-columns: 220px 1fr; border: 3px solid ${C.dark}; }
      .recap .cell { height: 146px; border: 1.5px solid ${C.dark}; display: flex; align-items: center; padding: 0 28px; }
      .recap .num { justify-content: center; font-family: "Shrikhand", serif; font-size: 96px; color: ${C.red}; }
      .recap .keysCell { font-family: "Shrikhand", serif; font-size: 58px; color: ${C.dark}; }
      #sub { position: absolute; left: 60px; top: 1300px; width: 960px; text-align: center; font-size: 40px; line-height: 1.5; }
      #sub b { font-family: "Space Grotesk", sans-serif; font-weight: 600; letter-spacing: 3px; color: ${C.red}; }

      /* captions (preset caption skin): paper card, ink rule, red leftbar, karaoke red panel */
      .capStage { position: absolute; left: 0; right: 0; top: 1372px; height: 150px; display: flex; align-items: center; justify-content: center; }
      .capCard { max-width: 92%; padding: 14px 40px 20px; background: ${C.bg}; border: 1.5px solid ${C.dark}; border-left: 4px solid ${C.red}; }
      .capLine { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.08em 0.3em; font-family: "Shrikhand", serif; font-size: 52px; line-height: 1.18; }
      .cw { display: inline-block; padding: 0 0.06em; color: #948f8b; }
      .cw.on { color: ${C.bg}; background: ${C.red}; box-shadow: 0 0 0 0.06em ${C.red}; text-shadow: ${STACKED}; }
      .cw.done { color: ${C.dark}; }

      /* chrome */
      #footer { position: absolute; left: 60px; right: 60px; top: 1560px; display: flex; justify-content: space-between; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 3px; text-transform: uppercase; color: ${C.dark}; }
      #footer span:last-child { color: ${C.red}; }
      #progress { position: absolute; left: 0; bottom: 0; width: 100%; height: 12px; background: ${C.red}; transform-origin: 0 50%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
      <div id="frameOuter"></div>
      <div id="frame"><div id="push"><div id="pan">
        <video id="raw" class="clip" src="input/raw.mp4" playsinline data-has-audio="true" data-start="0" data-duration="${DURATION}" data-track-index="0" data-volume="1"></video>
      </div></div></div>

      <div id="hook" class="clip layer" data-start="0" data-duration="${SECTIONS[0].at}" data-track-index="2">
        <div id="hookEyebrow" class="eyebrow" style="left:54px;top:70px">Windows 11 · Top 5</div>
        <div class="stackLine" style="top:112px;font-size:104px"><div id="h1">5 shortcuts</div></div>
        <div class="stackLine" style="top:228px;font-size:92px"><div id="h2">roz time</div></div>
        <div id="h3" style="position:absolute;left:470px;top:206px;font-family:Shrikhand,serif;font-size:150px;line-height:1.1;color:${C.red};white-space:nowrap;transform-origin:30% 60%">waste?</div>
      </div>${sectionHeads}

      <div id="close" class="clip layer" data-start="${CTA_AT}" data-duration="${(DURATION - CTA_AT).toFixed(2)}" data-track-index="3">
        <div id="closeIn">
          <div class="eyebrow" style="left:60px;top:84px">Tumhe kaun sa pehle se pata tha?</div>
          <div id="close1">Comment</div>
          <div id="close2">karo!</div>
          <div class="recap">${recapRows}
          </div>
          <div id="sub">Aur subscribe karo <b>Namaste Techy</b></div>
        </div>
      </div>${slams}${capHtml}

      <div id="footer"><span>Namaste Techy</span><span>Windows 11 shortcuts</span></div>
      <div id="progress"></div>
    </div>

    <script>
      const tl = gsap.timeline({ paused: true });
      ${T.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log(`index.html: ${SECTIONS.length} sections, ${timed.length} caption groups, ${T.length} tweens`);
