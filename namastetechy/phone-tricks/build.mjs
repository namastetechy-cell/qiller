// "3 tricks your phone plays on you": 2D sticker-style explainer, 16:9, narrated (Kokoro af_heart,
// fast cut). Mike's poses come from the shared character sheet; props are drawn as SVG stickers.
// Beats are timed to assets/audio/segments.json (narrate_fast.py).
// usage: node build.mjs -> index.html
import { readFileSync, writeFileSync } from "node:fs";

const W = 1920, H = 1080;
const { segments: SEG, duration: DUR } = JSON.parse(readFileSync(new URL("./assets/audio/segments.json", import.meta.url), "utf8"));
const t = (i) => SEG[i].start, te = (i) => SEG[i].end;
// time a word is spoken inside segment i (character-proportional; TTS pacing is even)
const at = (i, word) => {
  const s = SEG[i], k = s.text.toLowerCase().indexOf(word.toLowerCase());
  if (k < 0) throw new Error(`"${word}" not in: ${s.text}`);
  return +(s.start + (k / s.text.length) * (s.end - s.start)).toFixed(2);
};
const r2 = (x) => +x.toFixed(2);

const C = { deepCoral: "#C8433A", deepTeal: "#24716E", ink: "#2B2321", cream: "#FFF6EA", teal: "#3FA7A3", coral: "#F07167", mustard: "#F2B544", lilac: "#9B8AD6", sky: "#8EC5E8", mint: "#9ED9B5", navy: "#1F2A44", rose: "#F4A6B4", beige: "#F3E3C7", red: "#E5484D" };

// ---------- builders ----------
const parts = [], T = [];
const tw = (s) => T.push(s);
const pop = (sel, time, from = 0.3, rot = 0) => tw(`tl.fromTo("${sel}", { scale: ${from}, opacity: 0, rotation: ${rot - 10} }, { scale: 1, opacity: 1, rotation: ${rot}, duration: 0.45, ease: "back.out(2.2)" }, ${r2(time)});`);
const slideIn = (sel, time, x = 0, y = 80) => tw(`tl.fromTo("${sel}", { x: ${x}, y: ${y}, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, ${r2(time)});`);
const out = (sel, time, d = 0.25) => tw(`tl.to("${sel}", { scale: 0.6, opacity: 0, duration: ${d}, ease: "back.in(2)" }, ${r2(time)});`);
const wob = (sel, time, dur, amt = 4, per = 0.9) => tw(`tl.fromTo("${sel}", { rotation: ${-amt} }, { rotation: ${amt}, duration: ${per / 2}, yoyo: true, repeat: ${Math.max(1, Math.floor(dur / (per / 2)) - 1)}, ease: "sine.inOut", immediateRender: false }, ${r2(time)});`);
const float = (sel, time, dur, amt = 10, per = 1.6) => tw(`tl.fromTo("${sel}", { y: 0 }, { y: ${-amt}, duration: ${per / 2}, yoyo: true, repeat: ${Math.max(1, Math.floor(dur / (per / 2)) - 1)}, ease: "sine.inOut", immediateRender: false }, ${r2(time)});`);
let sceneN = 0;
const scene = (from, to, bg, inner) => {
  const id = `sc${sceneN++}`;
  parts.push(`
      <div id="${id}" class="clip layer" data-start="${r2(from)}" data-duration="${r2(to - from)}" data-track-index="1" style="background:${bg}">
        <div class="dots"></div><div id="${id}-st" class="layer">${inner}</div>
      </div>`);
  tw(`tl.fromTo("#${id}-st", { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" }, ${r2(from)});`);
  return id;
};
const sticker = (id, x, y, w, svg, extra = "") => `<div id="${id}" class="stk" style="left:${x}px;top:${y}px;width:${w}px${extra}">${svg}</div>`;
const label = (id, x, y, text, bg = C.cream, size = 54, color = C.ink, extra = "") =>
  `<div id="${id}" class="lbl" data-layout-allow-overlap data-layout-allow-occlusion style="left:${x}px;top:${y}px;background:${bg};color:${color};font-size:${size}px${extra}">${text}</div>`;

// Mike: container (position) > squash > breathe > stacked pose images
const POSES = ["happy", "sad", "angry", "surprised", "cool", "love"];
const mike = (id, x, y, h, first) => `
        <div id="${id}" class="mike" style="left:${x}px;top:${y - h}px;height:${h}px;--h:${h}px">
          <div id="${id}-s" class="mikeIn"><div id="${id}-b" class="mikeIn">${POSES.map((p) => `<img id="${id}-${p}" src="assets/mike/${p}.png" style="opacity:${p === first ? 1 : 0}">`).join("")}</div></div>
        </div>`;
const breathe = (id, from, to) => tw(`tl.fromTo("#${id}-b", { scaleY: 1, scaleX: 1 }, { scaleY: 1.025, scaleX: 0.99, duration: 0.85, yoyo: true, repeat: ${Math.max(1, Math.floor((to - from) / 0.85) - 1)}, ease: "sine.inOut", immediateRender: false }, ${r2(from)});`);
const pose = (id, p, time) => {
  POSES.forEach((q) => tw(`tl.set("#${id}-${q}", { opacity: ${q === p ? 1 : 0} }, ${r2(time)});`));
  tw(`tl.fromTo("#${id}-s", { scaleX: 1.12, scaleY: 0.86 }, { scaleX: 1, scaleY: 1, duration: 0.45, ease: "elastic.out(1.1, 0.45)", immediateRender: false }, ${r2(time)});`);
};
const hop = (id, time, h = 50) => tw(`tl.fromTo("#${id}-s", { y: 0 }, { keyframes: [{ y: -${h}, duration: 0.18, ease: "power2.out" }, { y: 0, duration: 0.22, ease: "bounce.out" }], immediateRender: false }, ${r2(time)});`);
const enterMike = (id, time, dx = -500) => tw(`tl.fromTo("#${id}", { x: ${dx}, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" }, ${r2(time)});`);
const shake = (sel, time, amt = 14) => tw(`tl.fromTo("${sel}", { x: 0 }, { keyframes: [{ x: ${amt} }, { x: ${-amt} }, { x: ${amt * 0.6} }, { x: ${-amt * 0.4} }, { x: 0 }], duration: 0.4, immediateRender: false }, ${r2(time)});`);

// ---------- prop library (SVG, ink outlines; the .stk filter adds the white sticker edge) ----------
const S = (vb, body) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const ink = `stroke="${C.ink}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"`;
const P = {
  laptop: (badge = true) => S("0 0 520 380", `<rect x="60" y="20" width="400" height="260" rx="22" fill="#3B4252" ${ink}/><rect x="84" y="44" width="352" height="212" rx="10" fill="#EAF4FF"/>
    <rect x="170" y="100" width="180" height="120" rx="12" fill="#fff" ${ink}/><path d="M170 108 L260 170 L350 108" fill="none" ${ink}/>
    ${badge ? `<g id="badge"><circle cx="350" cy="96" r="34" fill="${C.red}" ${ink}/><text x="350" y="110" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="#fff">1</text></g>` : ""}
    <path d="M10 300 H510 L470 350 H50 Z" fill="#C9CED8" ${ink}/>`),
  desk: () => S("0 0 900 300", `<rect x="20" y="20" width="860" height="50" rx="14" fill="#C48A5A" ${ink}/><rect x="80" y="70" width="40" height="220" fill="#A06A3E" ${ink}/><rect x="780" y="70" width="40" height="220" fill="#A06A3E" ${ink}/>`),
  clockFace: () => S("0 0 400 400", `<circle cx="200" cy="200" r="180" fill="#fff" ${ink} stroke-width="10"/>${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${200 + 150 * Math.sin(a)}" y1="${200 - 150 * Math.cos(a)}" x2="${200 + 168 * Math.sin(a)}" y2="${200 - 168 * Math.cos(a)}" ${ink}/>`; }).join("")}<circle cx="200" cy="200" r="14" fill="${C.ink}"/>`),
  hand: (len, wdt, color = C.ink) => S(`0 0 40 ${len + 20}`, `<rect x="${20 - wdt / 2}" y="0" width="${wdt}" height="${len}" rx="${wdt / 2}" fill="${color}"/>`),
  jar: (labelTxt, lid) => S("0 0 150 210", `<rect x="22" y="10" width="106" height="36" rx="8" fill="${lid}" ${ink}/><rect x="12" y="44" width="126" height="156" rx="24" fill="#FBEFD9" ${ink}/><rect x="22" y="96" width="106" height="56" rx="8" fill="#fff" ${ink} stroke-width="4"/><text x="75" y="134" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="34" fill="${C.ink}">${labelTxt}</text>`),
  shelf: () => S("0 0 1000 60", `<rect x="10" y="10" width="980" height="40" rx="10" fill="#C48A5A" ${ink}/>`),
  panel: () => S("0 0 1300 420", `<path d="M40 120 Q650 20 1260 120 L1220 400 H80 Z" fill="#33415E" ${ink}/>
    ${[0, 1, 2].map((i) => `<rect x="${230 + i * 300}" y="110" width="240" height="140" rx="16" fill="${["#7FD4C1", "#F2B544", "#9B8AD6"][i]}" ${ink}/><path d="M${250 + i * 300} 200 q30 -40 60 0 t60 0 t60 0" fill="none" stroke="#fff" stroke-width="6"/>`).join("")}
    ${Array.from({ length: 10 }, (_, i) => `<circle cx="${190 + i * 100}" cy="320" r="22" fill="${[C.coral, C.mint, C.mustard, C.sky][i % 4]}" ${ink}/>`).join("")}`),
  chair: () => S("0 0 260 330", `<rect x="40" y="20" width="180" height="170" rx="40" fill="${C.coral}" ${ink}/><rect x="20" y="180" width="220" height="50" rx="20" fill="${C.coral}" ${ink}/><rect x="120" y="230" width="20" height="60" fill="${C.ink}"/><path d="M50 310 H210" ${ink} stroke-width="12"/>`),
  manager: () => S("0 0 240 300", `<circle cx="120" cy="90" r="70" fill="${C.beige}" ${ink}/><circle cx="96" cy="84" r="8" fill="${C.ink}"/><circle cx="144" cy="84" r="8" fill="${C.ink}"/><path d="M100 116 q20 16 40 0" fill="none" ${ink}/><rect x="50" y="160" width="140" height="130" rx="30" fill="#4A5A80" ${ink}/><path d="M120 165 l-14 30 l14 60 l14 -60 z" fill="${C.red}" ${ink} stroke-width="4"/><rect x="150" y="190" width="70" height="90" rx="8" fill="#fff" ${ink}/>`),
  umbrella: () => S("0 0 360 420", `<path d="M20 170 Q180 -40 340 170 Z" fill="${C.coral}" ${ink}/><path d="M80 170 Q180 40 280 170" fill="none" ${ink}/><path d="M180 170 V400" ${ink} stroke-width="10"/><rect x="40" y="380" width="280" height="30" rx="14" fill="#F6D6A0" ${ink}/>`),
  sun: () => S("0 0 220 220", `<circle cx="110" cy="110" r="60" fill="${C.mustard}" ${ink}/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${110 + 78 * Math.cos(a)}" y1="${110 + 78 * Math.sin(a)}" x2="${110 + 100 * Math.cos(a)}" y2="${110 + 100 * Math.sin(a)}" ${ink} stroke="${C.mustard}" stroke-width="12"/>`; }).join("")}`),
  gauge: (name, color) => S("0 0 360 260", `<path d="M30 220 A150 150 0 0 1 330 220 Z" fill="#fff" ${ink}/><path d="M60 220 A120 120 0 0 1 300 220" fill="none" stroke="${color}" stroke-width="26"/>`),
  needle: () => S("0 0 40 140", `<path d="M20 0 L30 120 H10 Z" fill="${C.ink}"/><circle cx="20" cy="120" r="16" fill="${C.ink}"/>`),
  meter: () => S("0 0 220 640", `<rect x="60" y="20" width="100" height="500" rx="50" fill="#fff" ${ink} stroke-width="8"/><circle cx="110" cy="560" r="70" fill="${C.mint}" ${ink} stroke-width="8"/>${[0, 1, 2, 3, 4].map((i) => `<line x1="160" y1="${100 + i * 90}" x2="190" y2="${100 + i * 90}" ${ink}/>`).join("")}`),
  form: () => S("0 0 300 380", `<rect x="10" y="10" width="280" height="360" rx="14" fill="#fff" ${ink}/><text x="150" y="70" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="${C.ink}">TAX FORM</text>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="40" y="${110 + i * 40}" width="${i % 2 ? 160 : 220}" height="14" rx="7" fill="#D9D2CC"/>`).join("")}`),
  phone: () => S("0 0 200 340", `<rect x="20" y="10" width="160" height="320" rx="30" fill="#3B4252" ${ink}/><rect x="36" y="44" width="128" height="240" rx="10" fill="#EAF4FF"/><rect x="50" y="70" width="100" height="44" rx="10" fill="${C.coral}"/><circle cx="160" cy="34" r="22" fill="${C.red}" ${ink}/>`),
  donut: () => S("0 0 220 220", `<circle cx="110" cy="110" r="96" fill="#E8B57A" ${ink}/><circle cx="110" cy="110" r="78" fill="${C.rose}"/><circle cx="110" cy="110" r="30" fill="#fff" ${ink}/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${70 + (i * 37) % 90}" y="${50 + (i * 53) % 110}" width="16" height="6" rx="3" fill="${[C.mint, C.mustard, C.sky][i % 3]}" transform="rotate(${i * 40} ${78 + (i * 37) % 90} ${53 + (i * 53) % 110})"/>`).join("")}`),
  cat: () => S("0 0 240 220", `<path d="M40 70 L60 10 L100 50 H140 L180 10 L200 70 Q220 200 120 205 Q20 200 40 70 Z" fill="#F2A65A" ${ink}/><circle cx="90" cy="110" r="10" fill="${C.ink}"/><circle cx="150" cy="110" r="10" fill="${C.ink}"/><path d="M110 140 q10 10 20 0" fill="none" ${ink} stroke-width="4"/>`),
  controller: () => S("0 0 300 200", `<path d="M60 40 H240 Q300 40 290 140 Q280 190 230 170 L190 140 H110 L70 170 Q20 190 10 140 Q0 40 60 40 Z" fill="${C.lilac}" ${ink}/><path d="M70 95 h50 M95 70 v50" ${ink} stroke="#fff" stroke-width="10"/><circle cx="210" cy="80" r="12" fill="${C.mustard}"/><circle cx="240" cy="110" r="12" fill="${C.mint}"/>`),
  door: () => S("0 0 420 700", `<rect x="20" y="20" width="380" height="680" fill="#8A5A3B" ${ink}/><rect x="60" y="60" width="300" height="640" fill="#2E2A33"/><rect x="60" y="60" width="160" height="640" fill="#C48A5A" ${ink} transform="skewY(-8) translate(0 30)"/><circle cx="196" cy="390" r="12" fill="${C.mustard}" ${ink} stroke-width="3"/>`),
  bill: () => S("0 0 340 440", `<path d="M20 20 H320 V400 l-30 20 l-30 -20 l-30 20 l-30 -20 l-30 20 l-30 -20 l-30 20 l-30 -20 l-30 20 l-20 -15 Z" fill="#fff" ${ink}/><text x="170" y="90" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="48" fill="${C.ink}">BILL</text>${[0, 1, 2, 3].map((i) => `<rect x="50" y="${130 + i * 46}" width="${i === 3 ? 150 : 240}" height="16" rx="8" fill="#D9D2CC"/>`).join("")}<text x="170" y="360" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="44" fill="${C.ink}">$ 84.20</text>`),
  stamp: (txt, color) => S("0 0 420 150", `<rect x="10" y="10" width="400" height="130" rx="18" fill="none" stroke="${color}" stroke-width="12"/><text x="210" y="100" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="76" fill="${color}">${txt}</text>`),
  button: () => S("0 0 360 260", `<rect x="20" y="150" width="320" height="90" rx="30" fill="#5C6377" ${ink}/><ellipse cx="180" cy="140" rx="140" ry="70" fill="${C.mint}" ${ink}/><text x="180" y="156" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="56" fill="${C.ink}">START</text>`),
  cursor: () => S("0 0 120 160", `<path d="M20 10 L20 130 L50 100 L72 150 L92 140 L70 92 L110 90 Z" fill="#fff" ${ink}/>`),
  wiring: () => S("0 0 1500 460", `<text x="40" y="70" font-family="Fredoka" font-weight="700" font-size="44" fill="${C.ink}">Typical</text><path id="wA" d="M60 140 H1440" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/>
    <text x="40" y="290" font-family="Fredoka" font-weight="700" font-size="44" fill="${C.ink}">ADHD</text><path id="wB" d="M60 380 C200 240 260 470 400 360 S600 220 700 380 S940 470 1020 330 S1240 260 1300 400 L1440 380" fill="none" stroke="${C.coral}" stroke-width="16" stroke-linecap="round"/>
    <circle cx="1440" cy="140" r="26" fill="${C.mint}" ${ink}/><circle cx="1440" cy="380" r="26" fill="${C.mustard}" ${ink}/>`),
  bars: () => S("0 0 520 320", Array.from({ length: 8 }, (_, i) => `<rect class="vb" x="${20 + i * 62}" y="${300 - (40 + i * 32)}" width="46" height="${40 + i * 32}" rx="10" fill="${i < 4 ? C.mint : i < 6 ? C.mustard : C.red}" ${ink} stroke-width="5"/>`).join("")),
  bubble: (txt) => S("0 0 620 240", `<path d="M40 20 H580 Q610 20 610 50 V160 Q610 190 580 190 H220 L150 236 L160 190 H40 Q10 190 10 160 V50 Q10 20 40 20 Z" fill="#fff" ${ink}/><text x="310" y="122" text-anchor="middle" font-family="Fredoka" font-weight="500" font-size="44" fill="${C.ink}">${txt}</text>`),
  glove: () => S("0 0 420 300", `<rect x="10" y="110" width="110" height="110" rx="20" fill="#fff" ${ink}/><path d="M110 70 Q120 20 220 20 H320 Q410 20 410 140 Q410 260 300 270 H160 Q110 270 110 220 Z" fill="${C.red}" ${ink}/><path d="M180 120 Q240 110 300 140" fill="none" ${ink}/>`),
  steam: () => S("0 0 160 120", `<path d="M30 90 Q10 60 40 40 Q50 10 90 20 Q130 10 135 50 Q160 80 120 95 Z" fill="#fff" ${ink}/>`),
  quote: () => S("0 0 160 120", `<text x="0" y="140" font-family="Georgia" font-size="240" fill="${C.coral}">“</text>`),
  sketch: () => S("0 0 460 360", `<rect x="20" y="20" width="420" height="320" rx="18" fill="#fff" ${ink}/><path d="M70 260 Q140 120 220 200 T380 110" fill="none" stroke="${C.teal}" stroke-width="12" stroke-linecap="round"/><circle cx="330" cy="100" r="34" fill="${C.mustard}" ${ink}/><path d="M360 300 L430 230" ${ink} stroke-width="16"/>`),
  reticle: () => S("0 0 600 600", `<circle cx="300" cy="300" r="250" fill="none" stroke="${C.red}" stroke-width="12" stroke-dasharray="60 30"/><path d="M300 20 V110 M300 490 V580 M20 300 H110 M490 300 H580" stroke="${C.red}" stroke-width="12" stroke-linecap="round"/>`),
  wingClock: () => S("0 0 340 220", `<path d="M90 110 Q20 40 10 110 Q20 160 90 130 Z M250 110 Q320 40 330 110 Q320 160 250 130 Z" fill="#fff" ${ink}/><circle cx="170" cy="110" r="80" fill="#fff" ${ink}/><path d="M170 110 V60 M170 110 L205 130" ${ink} stroke-width="8"/>`),
  badge: (icon, color) => S("0 0 260 260", `<circle cx="130" cy="130" r="118" fill="${color}" ${ink}/>${icon}`),
  bulb: (broken = false) => S("0 0 260 360", `<path d="M130 20 Q240 20 240 130 Q240 200 180 240 V280 H80 V240 Q20 200 20 130 Q20 20 130 20 Z" fill="${broken ? "#D9D2CC" : C.mustard}" ${ink}/><rect x="80" y="280" width="100" height="60" rx="10" fill="#9AA0AE" ${ink}/>${broken ? `<path d="M90 60 L130 120 L110 150 L150 210" fill="none" ${ink} stroke-width="8"/>` : `<path d="M100 180 Q130 120 160 180" fill="none" ${ink}/>`}`),
  puzzle: () => S("0 0 300 300", `<path d="M40 60 H110 Q100 20 140 20 Q180 20 170 60 H240 V130 Q280 120 280 160 Q280 200 240 190 V260 H170 Q180 220 140 220 Q100 220 110 260 H40 V190 Q0 200 0 160 Q0 120 40 130 Z" fill="${C.teal}" ${ink}/>`),
  stairs: () => S("0 0 260 220", `<path d="M20 200 H80 V150 H130 V100 H180 V50 H240 V200 Z" fill="${C.mint}" ${ink}/><circle cx="210" cy="30" r="16" fill="${C.coral}" ${ink} stroke-width="4"/>`),
  timer: () => S("0 0 240 260", `<rect x="100" y="10" width="40" height="30" rx="6" fill="${C.ink}"/><circle cx="120" cy="150" r="96" fill="#fff" ${ink} stroke-width="8"/><path d="M120 150 V80" ${ink} stroke-width="8"/><path d="M120 150 L120 54 A96 96 0 0 1 200 110 Z" fill="${C.coral}" opacity=".6"/>`),
  heartHands: () => S("0 0 280 240", `<path d="M140 210 C20 130 20 40 90 40 Q130 40 140 80 Q150 40 190 40 C260 40 260 130 140 210 Z" fill="${C.coral}" ${ink}/>`),
  doctor: () => S("0 0 420 360", `<rect x="20" y="20" width="380" height="320" rx="30" fill="#fff" ${ink}/><rect x="170" y="80" width="80" height="200" rx="12" fill="${C.red}"/><rect x="110" y="140" width="200" height="80" rx="12" fill="${C.red}"/>`),
  steth: () => S("0 0 300 300", `<path d="M80 20 V120 Q80 200 150 200 Q220 200 220 120 V20" fill="none" ${ink} stroke-width="14"/><path d="M150 200 V240 Q150 280 200 280" fill="none" ${ink} stroke-width="14"/><circle cx="220" cy="270" r="26" fill="${C.sky}" ${ink}/>`),
  heart: (color = C.coral) => S("0 0 120 110", `<path d="M60 100 C10 65 10 20 35 15 Q55 12 60 35 Q65 12 85 15 C110 20 110 65 60 100 Z" fill="${color}" ${ink} stroke-width="5"/>`),
  spark: (color = C.mustard) => S("0 0 100 100", `<path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" fill="${color}" ${ink} stroke-width="4"/>`),
  q: () => S("0 0 90 130", `<text x="45" y="110" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="130" fill="${C.coral}" stroke="${C.ink}" stroke-width="5" paint-order="stroke">?</text>`),
};

const fadeIn = (sel, time, stagger = 0) => tw(`tl.fromTo("${sel}", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out"${stagger ? `, stagger: ${stagger}` : ""} }, ${r2(time)});`);

// ---------- extra props for this video ----------
Object.assign(P, {
  slotBody: () => S("0 0 520 560", `<rect x="20" y="80" width="480" height="460" rx="40" fill="${C.red}" ${ink}/><rect x="60" y="20" width="400" height="90" rx="30" fill="${C.mustard}" ${ink}/><text x="260" y="82" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="54" fill="${C.ink}">JACKPOT</text><rect x="60" y="160" width="400" height="200" rx="20" fill="#fff" ${ink}/><rect x="90" y="420" width="340" height="70" rx="20" fill="#7A2226" ${ink}/>`),
  lever: () => S("0 0 80 300", `<rect x="30" y="40" width="20" height="250" rx="10" fill="#9AA0AE" ${ink} stroke-width="5"/><circle cx="40" cy="40" r="34" fill="${C.red}" ${ink}/>`),
  reelCol: () => S("0 0 120 1200", ["7", "★", "♥", "7", "★", "♥", "7", "★", "♥", "7"].map((s, i) => `<text x="60" y="${i * 120 + 92}" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${s === "7" ? 96 : 90}" fill="${[C.red, C.mustard, C.coral][i % 3]}" stroke="${C.ink}" stroke-width="4" paint-order="stroke">${s}</text>`).join("")),
  skinnerBox: () => S("0 0 620 440", `<rect x="20" y="40" width="580" height="380" rx="20" fill="#EAF4FF" ${ink}/><rect x="20" y="40" width="580" height="60" rx="20" fill="#9AA0AE" ${ink}/><rect x="440" y="250" width="120" height="30" rx="8" fill="${C.mustard}" ${ink}/><rect x="470" y="190" width="18" height="70" fill="${C.ink}"/><rect x="60" y="330" width="140" height="50" rx="10" fill="#fff" ${ink}/><path d="M150 100 V150 H110" fill="none" ${ink}/>`),
  mouse: () => S("0 0 260 180", `<ellipse cx="130" cy="110" rx="100" ry="60" fill="#B9BEC9" ${ink}/><circle cx="70" cy="60" r="34" fill="#D9DCE3" ${ink}/><circle cx="190" cy="60" r="34" fill="#D9DCE3" ${ink}/><circle cx="100" cy="100" r="9" fill="${C.ink}"/><circle cx="160" cy="100" r="9" fill="${C.ink}"/><circle cx="130" cy="130" r="12" fill="${C.rose}" ${ink} stroke-width="4"/><path d="M230 120 q40 -10 30 40" fill="none" ${ink}/>`),
  pellet: () => S("0 0 60 60", `<circle cx="30" cy="30" r="22" fill="#C48A5A" ${ink} stroke-width="5"/>`),
  phoneFrame: () => S("0 0 460 900", `<rect x="10" y="10" width="440" height="880" rx="60" fill="none" stroke="${C.ink}" stroke-width="26"/><rect x="170" y="30" width="120" height="26" rx="13" fill="${C.ink}"/>`),
  dog: () => S("0 0 300 260", `<path d="M60 70 Q20 60 30 150 Q70 150 80 110 Z M240 70 Q280 60 270 150 Q230 150 220 110 Z" fill="#8A5A3B" ${ink}/><ellipse cx="150" cy="130" rx="95" ry="100" fill="#E8B57A" ${ink}/><circle cx="115" cy="115" r="12" fill="${C.ink}"/><circle cx="185" cy="115" r="12" fill="${C.ink}"/><ellipse cx="150" cy="165" rx="28" ry="20" fill="${C.ink}"/><path d="M150 185 q0 25 -20 25 M150 185 q0 25 20 25" fill="none" ${ink} stroke-width="4"/>`),
  piano: () => S("0 0 440 170", `<rect x="10" y="10" width="420" height="150" rx="14" fill="#fff" ${ink}/>${Array.from({ length: 7 }, (_, i) => `<line x1="${70 + i * 60}" y1="10" x2="${70 + i * 60}" y2="160" ${ink} stroke-width="4"/>`).join("")}${[0, 1, 3, 4, 5].map((i) => `<rect x="${55 + i * 60}" y="10" width="30" height="90" fill="${C.ink}"/>`).join("")}`),
  note: () => S("0 0 80 110", `<path d="M30 10 V80" ${ink} stroke-width="8"/><ellipse cx="22" cy="84" rx="20" ry="16" fill="${C.ink}"/><path d="M30 10 Q60 20 70 40" fill="none" ${ink} stroke-width="8"/>`),
  cloud: (txt, w = 760) => S(`0 0 ${w} 260`, `<path d="M70 200 Q10 200 20 140 Q20 80 90 80 Q110 20 200 30 Q260 0 330 30 Q420 0 480 40 Q${w - 60} 30 ${w - 40} 110 Q${w} 170 ${w - 70} 200 Z" fill="#fff" ${ink}/><circle cx="60" cy="236" r="16" fill="#fff" ${ink} stroke-width="4"/><text x="${w / 2}" y="140" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="46" fill="${C.ink}">${txt}</text>`),
  star: (color = C.mustard) => S("0 0 200 200", `<path d="M100 10 L126 72 L192 76 L140 118 L158 184 L100 146 L42 184 L60 118 L8 76 L74 72 Z" fill="${color}" ${ink}/>`),
  thumb: () => S("0 0 260 300", `<path d="M70 280 V150 Q70 120 100 120 H120 L150 40 Q160 10 185 20 Q205 30 195 70 L180 120 H230 Q255 120 250 150 L235 260 Q230 285 200 285 Z" fill="${C.beige}" ${ink}/><rect x="20" y="140" width="60" height="150" rx="14" fill="${C.sky}" ${ink}/>`),
  browser: () => S("0 0 1100 640", `<rect x="10" y="10" width="1080" height="620" rx="26" fill="#fff" ${ink}/><path d="M10 80 H1090" ${ink}/><circle cx="50" cy="45" r="12" fill="${C.coral}"/><circle cx="85" cy="45" r="12" fill="${C.mustard}"/><circle cx="120" cy="45" r="12" fill="${C.mint}"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="60" y="${120 + i * 70}" width="${i % 2 ? 700 : 900}" height="30" rx="15" fill="#E7E1DA"/>`).join("")}`),
  infinity: () => S("0 0 600 300", `<path id="infP" d="M300 150 C230 40 70 40 70 150 C70 260 230 260 300 150 C370 40 530 40 530 150 C530 260 370 260 300 150 Z" fill="none" stroke="${C.lilac}" stroke-width="44" stroke-linecap="round"/><path d="M300 150 C230 40 70 40 70 150 C70 260 230 260 300 150 C370 40 530 40 530 150 C530 260 370 260 300 150 Z" fill="none" ${ink} stroke-width="6"/>`),
  pauseIcon: () => S("0 0 220 220", `<circle cx="110" cy="110" r="96" fill="#fff" ${ink}/><rect x="72" y="62" width="26" height="96" rx="8" fill="${C.ink}"/><rect x="122" y="62" width="26" height="96" rx="8" fill="${C.ink}"/>`),
  pages: () => S("0 0 300 380", `<rect x="40" y="10" width="240" height="320" rx="14" fill="#fff" ${ink}/><rect x="20" y="40" width="240" height="320" rx="14" fill="#fff" ${ink}/>${[0, 1, 2, 3].map((i) => `<rect x="50" y="${90 + i * 50}" width="170" height="16" rx="8" fill="#D9D2CC"/>`).join("")}`),
  envelope: () => S("0 0 260 180", `<rect x="10" y="10" width="240" height="160" rx="14" fill="#fff" ${ink}/><path d="M10 20 L130 100 L250 20" fill="none" ${ink}/><text x="130" y="160" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="32" fill="${C.ink}">MEMO</text>`),
  chips: () => S("0 0 340 440", `<path d="M40 60 L20 40 H320 L300 60 Q330 240 300 400 L320 420 H20 L40 400 Q10 240 40 60 Z" fill="${C.mustard}" ${ink}/><text x="170" y="250" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="56" fill="${C.ink}">CHIPS</text><circle cx="170" cy="160" r="40" fill="${C.coral}" ${ink}/>`),
  chip: () => S("0 0 120 100", `<path d="M10 60 Q30 10 80 15 Q115 25 108 60 Q90 95 45 90 Q12 85 10 60 Z" fill="#F6D06B" ${ink} stroke-width="5"/>`),
  spinner: () => S("0 0 120 120", Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${60 + 26 * Math.cos(a)}" y1="${60 + 26 * Math.sin(a)}" x2="${60 + 50 * Math.cos(a)}" y2="${60 + 50 * Math.sin(a)}" stroke="${C.ink}" stroke-width="12" stroke-linecap="round" opacity="${0.25 + i * 0.1}"/>`; }).join("")),
  bird: () => S("0 0 240 240", `<rect x="10" y="10" width="220" height="220" rx="50" fill="${C.sky}" ${ink}/><path d="M60 140 Q70 80 130 80 Q170 80 180 110 L205 100 L190 130 Q180 180 120 180 Q80 180 60 140 Z" fill="#fff" ${ink} stroke-width="5"/><circle cx="150" cy="110" r="8" fill="${C.ink}"/>`),
  hourglass: () => S("0 0 200 280", `<rect x="20" y="10" width="160" height="26" rx="10" fill="#C48A5A" ${ink}/><rect x="20" y="244" width="160" height="26" rx="10" fill="#C48A5A" ${ink}/><path d="M40 36 H160 Q160 110 105 140 Q160 170 160 244 H40 Q40 170 95 140 Q40 110 40 36 Z" fill="#EAF4FF" ${ink}/><path d="M60 230 Q100 190 140 230 Z" fill="${C.mustard}"/>`),
  homeScreen: () => S("0 0 460 900", `<rect x="10" y="10" width="440" height="880" rx="60" fill="#EAF4FF" ${ink} stroke-width="10"/>${Array.from({ length: 16 }, (_, i) => i === 5 ? "" : `<rect x="${55 + (i % 4) * 95}" y="${110 + Math.floor(i / 4) * 120}" width="70" height="70" rx="18" fill="${[C.mint, C.sky, C.lilac, C.mustard, C.coral, C.teal][i % 6]}" ${ink} stroke-width="4"/>`).join("")}`),
  appIcon: (color = C.red) => S("0 0 120 120", `<rect x="10" y="10" width="100" height="100" rx="26" fill="${color}" ${ink} stroke-width="5"/><path d="M45 35 L85 60 L45 85 Z" fill="#fff"/>`),
  dialog: () => S("0 0 520 300", `<rect x="10" y="10" width="500" height="280" rx="30" fill="#fff" ${ink}/><text x="260" y="100" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="52" fill="${C.ink}">Are you sure?</text><rect x="50" y="170" width="190" height="80" rx="20" fill="#E7E1DA" ${ink} stroke-width="4"/><rect x="280" y="170" width="190" height="80" rx="20" fill="${C.mint}" ${ink} stroke-width="4"/><text x="145" y="224" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="${C.ink}">Open</text><text x="375" y="224" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="${C.ink}">Nope</text>`),
  book: () => S("0 0 420 320", `<path d="M20 40 Q110 10 210 50 Q310 10 400 40 V290 Q310 260 210 300 Q110 260 20 290 Z" fill="${C.teal}" ${ink}/><path d="M210 50 V300" ${ink}/><text x="115" y="170" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="#fff">PLAY</text><text x="305" y="170" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="#fff">BOOK</text>`),
  subBtn: () => S("0 0 640 200", `<rect x="10" y="10" width="620" height="180" rx="50" fill="${C.red}" ${ink}/><text x="320" y="125" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="84" fill="#fff">SUBSCRIBE</text>`),
  moon: () => S("0 0 240 240", `<path d="M160 20 Q60 40 60 130 Q60 220 160 230 Q40 260 20 130 Q20 20 160 20 Z" fill="${C.mustard}" ${ink}/>`),
  mask: (n) => S("0 0 300 380", `<rect x="10" y="10" width="280" height="360" rx="36" fill="${C.lilac}" ${ink}/><path d="M50 150 Q150 90 250 150 Q240 210 180 200 Q150 170 120 200 Q60 210 50 150 Z" fill="${C.ink}"/><text x="150" y="320" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="90" fill="#fff" stroke="${C.ink}" stroke-width="6" paint-order="stroke">#${n}</text>`),
  shield: () => S("0 0 300 340", `<path d="M150 10 L280 60 Q290 230 150 330 Q10 230 20 60 Z" fill="${C.mint}" ${ink}/><path d="M95 170 L140 215 L215 125" fill="none" ${ink} stroke-width="16"/>`),
});
const feed = (id, items) => `<div id="${id}" class="phoneWrap"><div class="screen"><div id="${id}-col" class="feedCol">${items}</div></div><div class="stk frameOv">${P.phoneFrame()}</div></div>`;
const post = (txt, cls = "") => `<div class="post ${cls}"><div class="pAv"></div><div class="pTxt">${txt}</div><div class="pImg"></div></div>`;
const dogPost = () => `<div class="post dogPost"><div class="pAv"></div><div class="pTxt">omg</div><div class="pDog"><div class="stk" style="left:30px;top:6px;width:200px">${P.dog()}</div><div class="stk" style="left:150px;top:150px;width:200px">${P.piano()}</div></div></div>`;
const reels = (id) => `<div id="${id}" class="slot"><div class="stk" style="left:0;top:0;width:520px">${P.slotBody()}</div>${[0, 1, 2].map((r) => `<div class="reel" style="left:${70 + r * 130}px"><div id="${id}-r${r}" class="reelCol">${P.reelCol()}</div></div>`).join("")}<div id="${id}-lev" class="stk lever">${P.lever()}</div></div>`;
const spinReels = (id, time, dur = 1.4) => [0, 1, 2].forEach((r) => tw(`tl.fromTo("#${id}-r${r}", { y: 0 }, { y: ${-(720 + r * 120)}, duration: ${dur + r * 0.25}, ease: "power3.out" }, ${r2(time)});`));
const pullLever = (id, time) => tw(`tl.fromTo("#${id}-lev", { rotation: 0 }, { keyframes: [{ rotation: 38, duration: 0.25, ease: "power2.in" }, { rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }], immediateRender: false }, ${r2(time)});`);
const titleCard = (bg, num, name, propHtml, a, b) => {
  const id = scene(a, b, bg, `
        <div id="tc${num}a" class="big" style="left:120px;top:300px;text-align:left;font-size:110px">Trick #${num}</div>
        <div id="tc${num}b" class="big" style="left:120px;top:440px;text-align:left;font-size:96px;color:#fff;text-shadow:0 0 0 ${C.ink},5px 5px 0 ${C.ink},-5px -5px 0 ${C.ink},5px -5px 0 ${C.ink},-5px 5px 0 ${C.ink},0 14px 16px rgba(0,0,0,.25)">${name}</div>
        ${propHtml}`);
  pop(`#tc${num}a`, a + 0.05, 0.4, -3); pop(`#tc${num}b`, a + 0.35, 0.4, 2);
  return id;
};

// ============ SCENES ============
// 1 · "one more video", three tricks, which one first
{
  const a = 0, b = t(3);
  scene(a, b, C.navy, `
        ${sticker("moonA", 1600, 60, 200, P.moon())}${[0, 1, 2, 3, 4].map((i) => sticker(`stA${i}`, 200 + i * 330, 80 + (i % 2) * 80, 50, P.spark("#fff"))).join("")}
        ${mike("mA", 480, 960, 640, "sad")}
        ${sticker("phA", 640, 420, 170, P.phone())}
        ${label("lblA", 260, 160, "“one more video…”", "#fff", 60)}
        ${[1, 2, 3].map((n, i) => sticker(`mk${n}`, 950 + i * 310, 300, 270, P.mask(n))).join("")}
        ${label("lblA2", 1040, 760, "which one gets you?", C.mustard, 54)}`);
  enterMike("mA", 0.05, -300); breathe("mA", 0.5, b); pop("#phA", 0.3, 0.3, -8); pop("#lblA", at(0, "one more"), 0.3, -3);
  [1, 2, 3].forEach((n, i) => pop(`#mk${n}`, at(1, "three") + i * 0.15, 0.2, i % 2 ? 4 : -4));
  out("#lblA", t(1) + 0.4);
  tw(`tl.to("#mk1", { x: 620, duration: 0.35, ease: "power2.inOut" }, ${r2(t(2))});`);
  tw(`tl.to("#mk3", { x: -620, duration: 0.35, ease: "power2.inOut" }, ${r2(t(2))});`);
  tw(`tl.to("#mk2", { y: -40, duration: 0.18, yoyo: true, repeat: 1 }, ${r2(t(2))});`);
  pop("#lblA2", at(2, "gets"), 0.3, 2); pose("mA", "surprised", t(2));
}
// 2 · unmasking all three + how to beat them
{
  const a = t(3), b = t(4);
  scene(a, b, C.cream, `
        ${label("lblB", 640, 70, "Unmasking all three", "#fff", 72)}
        <div class="stk" id="u1" style="left:240px;top:250px;width:340px">${P.slotBody()}</div>
        ${sticker("u2", 700, 330, 460, P.infinity())}
        ${sticker("u3", 1330, 260, 140, P.lever())}${sticker("u3b", 1450, 380, 200, P.phone())}
        ${sticker("shB", 1500, 600, 230, P.shield())}${label("lblB2", 1150, 780, "how to beat them", C.mint, 54)}`);
  pop("#lblB", a + 0.05, 0.3, -2); [1, 2, 3].forEach((n, i) => pop(`#u${n}`, a + 0.3 + i * 0.25, 0.2, i % 2 ? 5 : -5)); pop("#u3b", a + 0.9, 0.2, 6);
  pop("#shB", at(3, "beat"), 0.2, -6); pop("#lblB2", at(3, "beat") + 0.15, 0.3, 2);
}
// 3 · Trick #1 title
{
  const a = t(4), b = t(5);
  titleCard("#F8C9C3", 1, "the slot machine", reels("slotC").replace('class="slot"', 'class="slot" style="left:1180px;top:200px"'), a, b);
  pop("#slotC", a + 0.2, 0.4, 4); pullLever("slotC", a + 0.8); spinReels("slotC", a + 1.0, 0.9);
}
// 4 · Skinner: every time vs random
{
  const a = t(5), b = t(8);
  scene(a, b, "#E7F1F8", `
        ${label("lblD1", 140, 90, "1950s", C.mustard, 64)}${label("lblD2", 400, 90, "B.F. Skinner · psychologist", "#fff", 50)}
        ${sticker("boxD", 640, 300, 640, P.skinnerBox())}
        <div id="mouseD" class="stk" style="left:760px;top:540px;width:200px">${P.mouse()}</div>
        ${[0, 1, 2, 3, 4].map((i) => sticker(`plD${i}`, 720 + i * 26, 330, 44, P.pellet())).join("")}
        ${label("lblD3", 140, 380, "every time", "#fff", 56)}${label("lblD4", 160, 480, "= boring", C.sky, 50)}
        ${label("lblD5", 1400, 380, "randomly", C.mustard, 56)}
        ${sticker("stampD", 1360, 520, 460, P.stamp("STICKS!", C.deepCoral), ";transform:rotate(-8deg)")}
        ${sticker("qD", 1180, 330, 80, P.q())}`);
  pop("#lblD1", a + 0.05, 0.3, -4); pop("#lblD2", at(5, "skinner"), 0.3, 2); pop("#boxD", a + 0.2, 0.6); pop("#mouseD", a + 0.4, 0.3);
  // every time: lever press -> pellet, regular
  [0, 1, 2].forEach((k) => {
    const tt = t(6) + 0.2 + k * 0.85;
    tw(`tl.fromTo("#mouseD", { x: 0 }, { x: 330, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, ${r2(tt)});`);
    tw(`tl.fromTo("#plD${k}", { y: -40, opacity: 0 }, { y: 250, opacity: 1, duration: 0.4, ease: "bounce.out" }, ${r2(tt + 0.25)});`);
  });
  pop("#lblD3", at(6, "every"), 0.3, -2); pop("#lblD4", at(6, "boring"), 0.3, 3);
  tw(`tl.to("#mouseD", { rotation: -8, duration: 0.5, yoyo: true, repeat: 1 }, ${r2(at(6, "boring") + 0.2)});`);
  pop("#lblD5", at(7, "randomly"), 0.3, 2); pop("#qD", at(7, "some"), 0.2, 8);
  [3, 4].forEach((k, j) => tw(`tl.fromTo("#plD${k}", { y: -40, opacity: 0 }, { y: 250, opacity: 1, duration: 0.4, ease: "bounce.out" }, ${r2(at(7, "randomly") + 0.4 + j * 1.0)});`));
  tw(`tl.fromTo("#mouseD", { x: 0 }, { x: 330, duration: 0.18, yoyo: true, repeat: 7, ease: "sine.inOut", immediateRender: false }, ${r2(at(7, "randomly") + 0.2)});`);
  pop("#stampD", at(7, "sticks"), 2.2, -8);
}
// 5 · slot machine = your feed
{
  const a = t(8), b = t(10);
  scene(a, b, "#FDE9C9", `
        ${reels("slotE").replace('class="slot"', 'class="slot" style="left:220px;top:180px"')}
        <div id="eqE" class="big" style="left:850px;top:390px;width:220px;font-size:160px">=</div>
        ${feed("phE", [post("post"), post("post"), post("post"), post("post")].join(""))}`);
  pop("#slotE", a + 0.05, 0.5, -3); pullLever("slotE", at(8, "slot")); spinReels("slotE", at(8, "slot") + 0.2);
  pop("#eqE", t(9), 0.3); slideIn("#phE", t(9) + 0.1, 300, 0);
  tw(`tl.fromTo("#phE-col", { y: 0 }, { y: -520, duration: 1.4, ease: "power2.inOut" }, ${r2(at(9, "feed"))});`);
}
// 6 · boring post x3, BOOM dog piano, "keep going"
{
  const a = t(10), b = t(16);
  const items = [post("boring post", "grey"), post("boring post", "grey"), post("boring post", "grey"), dogPost(), post("boring post", "grey"), post("…", "grey")].join("");
  scene(a, b, "#E9E3F7", `
        ${feed("phF", items).replace('class="phoneWrap"', 'class="phoneWrap" style="left:1180px;top:60px"')}
        ${mike("mF", 560, 960, 660, "sad")}
        ${sticker("burstF", 1080, 240, 640, P.star(C.mustard), ";opacity:0")}
        ${[0, 1, 2].map((i) => sticker(`ntF${i}`, 1060 + i * 140, 240 - (i % 2) * 60, 70, P.note())).join("")}
        ${label("boomF", 200, 140, "BOOM!", C.deepCoral, 96, "#fff")}
        ${sticker("cloudF", 120, 90, 760, P.cloud("there might be another one…"))}
        ${label("kgF", 300, 330, "keep going!", C.mint, 60)}`);
  enterMike("mF", a, -300); breathe("mF", a + 0.6, b);
  const cardH = 300;
  [10, 11, 12].forEach((s, k) => tw(`tl.to("#phF-col", { y: ${-(k + 1) * cardH + cardH}, duration: 0.35, ease: "power3.out" }, ${r2(t(s))});`));
  tw(`tl.to("#phF-col", { y: ${-3 * cardH}, duration: 0.35, ease: "back.out(1.6)" }, ${r2(at(13, "boom"))});`);
  tw(`tl.fromTo("#burstF", { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 0.9, duration: 0.35, ease: "back.out(2)" }, ${r2(at(13, "boom"))});`);
  tw(`tl.to("#burstF", { opacity: 0, duration: 0.4 }, ${r2(at(13, "boom") + 0.9)});`);
  pop("#boomF", at(13, "boom"), 0.2, -6); pose("mF", "surprised", at(13, "boom")); pose("mF", "love", at(13, "dog"));
  [0, 1, 2].forEach((i) => { pop(`#ntF${i}`, at(13, "piano") + i * 0.15, 0.2, i % 2 ? 10 : -10); float(`#ntF${i}`, at(13, "piano") + 0.5 + i * 0.15, 2, 20, 0.6); });
  out("#boomF", t(14) - 0.1); pop("#cloudF", t(14), 0.4, -2); pose("mF", "happy", t(14));
  pop("#kgF", t(15), 0.3, 4);
  tw(`tl.to("#phF-col", { y: ${-5 * cardH}, duration: 0.9, ease: "power2.inOut" }, ${r2(t(15))});`);
}
// 7 · dopamine = wanting: the chase, not the catch
{
  const a = t(16), b = t(21);
  scene(a, b, C.navy, `
        ${label("lblG1", 640, 80, "DOPAMINE", C.mint, 84)}
        <div id="plG" class="big" style="left:0;right:0;top:250px;color:#fff;text-shadow:none">“pleasure”<div id="plX" class="xbar"></div></div>
        <div id="wantG" class="big" style="left:0;right:0;top:250px;font-size:150px;color:${C.mustard};text-shadow:none">WANTING</div>
        ${sticker("starG", 1300, 420, 200, P.star())}
        <div id="arrG" class="chaseArrow"></div>
        ${label("chG", 300, 470, "the chase", C.mustard, 60)}
        ${label("caG", 1240, 680, "not the catch", "#fff", 54)}
        ${mike("mG", 560, 960, 560, "sad")}
        <div id="clkG" class="stk" style="left:1240px;top:220px;width:300px">${P.clockFace()}<div id="hG2" class="hand" style="height:120px">${P.hand(120, 12, C.coral)}</div></div>
        ${label("enjG", 1150, 600, "enjoyed: almost none", C.deepCoral, 46, "#fff")}`);
  pop("#lblG1", a + 0.05, 0.3, -3); pop("#plG", at(16, "pleasure") - 0.3, 0.6);
  tw(`tl.fromTo("#plX", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${r2(at(16, "pleasure") + 0.4)});`);
  out("#plG", t(17) - 0.1); pop("#wantG", at(17, "wanting"), 0.4, -3);
  out("#wantG", t(18) - 0.1); pop("#chG", t(18), 0.3, -3); pop("#starG", t(18) + 0.1, 0.3);
  tw(`tl.fromTo("#arrG", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power2.out" }, ${r2(t(18) + 0.1)});`);
  tw(`tl.to("#starG", { x: 280, y: -60, rotation: 30, duration: 0.6, ease: "power2.out" }, ${r2(t(19))});`);
  pop("#caG", t(19), 0.3, 3);
  out("#chG, #caG, #starG, #arrG, #lblG1", t(20) - 0.1);
  enterMike("mG", t(20), -300); breathe("mG", t(20) + 0.5, b); pop("#clkG", at(20, "hour") - 0.3, 0.3);
  tw(`tl.fromTo("#hG2", { rotation: 0 }, { rotation: 720, duration: 1.5, ease: "power2.inOut" }, ${r2(at(20, "hour"))});`);
  pop("#enjG", at(20, "enjoy"), 0.3, -2);
}
// 8 · teasers for #2 and #3
{
  const a = t(21), b = t(24);
  scene(a, b, "#F3E3C7", `
        ${label("hold", 760, 70, "Now hold on…", "#fff", 64)}
        <div id="t2" class="card2" style="left:200px;top:220px"><div class="cNum">#2</div><div class="cLine">invented by one guy</div><div class="cYear">2006</div><div class="cLine">and he regrets it</div></div>
        <div id="t3" class="card2" style="left:1040px;top:220px"><div class="cNum">#3</div><div class="cLine">you did it with</div>${sticker("thH", 120, 210, 190, P.thumb(), ";position:relative")}<div class="cLine">~20 min ago</div></div>`);
  pop("#hold", a + 0.05, 0.3, -2); pop("#t2", at(21, "trick"), 0.3, -3);
  pop("#t3", t(22), 0.3, 3); tw(`tl.fromTo("#thH", { y: 0 }, { y: -30, duration: 0.18, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }, ${r2(at(23, "thumb"))});`);
}
// 9 · Trick #2 title
{
  const a = t(24), b = t(25);
  titleCard("#DCD5F5", 2, "no bottom", sticker("infI", 1080, 330, 620, P.infinity()), a, b);
  pop("#infI", a + 0.2, 0.4, -4);
  tw(`tl.fromTo("#infP", { strokeDasharray: 1500, strokeDashoffset: 1500 }, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, ${r2(a + 0.3)});`);
}
// 10 · pages with "next"
{
  const a = t(25), b = t(28);
  scene(a, b, C.cream, `
        ${sticker("brJ", 200, 120, 1100, P.browser())}
        <div id="pgJ" class="pager" style="left:300px;top:580px"><span>1</span><span>2</span><span>3</span><span id="nxJ" class="nx">next →</span></div>
        ${sticker("cloudJ", 1080, 90, 760, P.cloud("Do I actually want more?"))}`);
  pop("#brJ", a + 0.05, 0.8); fadeIn("#pgJ span", at(26, "page"), 0.25);
  tw(`tl.fromTo("#nxJ", { scale: 1 }, { scale: 1.2, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${r2(at(27, "next"))});`);
  pop("#cloudJ", at(27, "asked"), 0.4, 2);
}
// 11 · Aza Raskin 2006, no pages, no pauses
{
  const a = t(28), b = t(32);
  scene(a, b, "#DCD5F5", `
        ${label("yrK", 160, 90, "2006", C.mustard, 72)}${label("azK", 360, 90, "Aza Raskin · designer", "#fff", 54)}
        ${sticker("infK", 640, 250, 640, P.infinity())}
        ${label("isK", 760, 600, "infinite scroll", C.lilac, 60, "#fff", ";background:#6B5BB0")}
        <div id="npK" class="stk" style="left:200px;top:300px;width:300px">${P.pages()}<div class="xbar" id="npX" style="left:-20px;right:-20px"></div></div>
        <div id="nzK" class="stk" style="left:1430px;top:330px;width:240px">${P.pauseIcon()}<div class="xbar" id="nzX" style="left:-20px;right:-20px"></div></div>
        <div id="qK" class="card" style="left:260px;top:300px;width:1400px"><div class="qm">“</div>He didn't see how it would be used to capture attention.</div>`);
  pop("#yrK", a + 0.05, 0.3, -4); pop("#azK", at(28, "aza"), 0.3, 2); pop("#infK", at(28, "infinite"), 0.4);
  tw(`tl.fromTo("#infK #infP", { strokeDasharray: 1500, strokeDashoffset: 1500 }, { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" }, ${r2(at(28, "infinite"))});`);
  pop("#isK", at(28, "scroll"), 0.3, -2);
  pop("#npK", t(29), 0.3, -5); tw(`tl.fromTo("#npX", { scaleX: 0 }, { scaleX: 1, duration: 0.25 }, ${r2(t(29) + 0.4)});`);
  pop("#nzK", t(30), 0.3, 5); tw(`tl.fromTo("#nzX", { scaleX: 0 }, { scaleX: 1, duration: 0.25 }, ${r2(t(30) + 0.4)});`);
  out("#infK, #isK, #npK, #nzK", t(31) - 0.1); pop("#qK", t(31), 0.6);
}
// 12 · no stopping point, chips that refill
{
  const a = t(32), b = t(37);
  const items = Array.from({ length: 14 }, (_, i) => i === 6 ? dogPost() : post(i % 3 ? "post" : "video", i % 2 ? "" : "grey")).join("");
  scene(a, b, "#FDE9C9", `
        ${feed("phL", items).replace('class="phoneWrap"', 'class="phoneWrap" style="left:200px;top:60px"')}
        ${label("nsL", 760, 120, "no stopping point", C.deepCoral, 64, "#fff")}
        ${sticker("memoL", 1500, 300, 240, P.envelope())}
        ${label("memoT", 1180, 480, "the memo never arrives", "#fff", 46)}
        ${sticker("chipsL", 980, 270, 320, P.chips())}
        ${[0, 1, 2, 3].map((i) => sticker(`cpL${i}`, 1040 + i * 50, 260, 90, P.chip())).join("")}
        ${mike("mL", 1560, 960, 600, "love")}
        ${sticker("stampL", 860, 560, 520, P.stamp("THE PROBLEM", C.deepCoral), ";transform:rotate(-6deg)")}`);
  tw(`tl.fromTo("#phL-col", { y: 0 }, { y: -3400, duration: ${r2(b - a)}, ease: "none" }, ${r2(a)});`);
  pop("#nsL", a + 0.1, 0.3, -2);
  pop("#memoL", t(33), 0.3);
  tw(`tl.fromTo("#memoL", { x: 0, y: 0 }, { x: -1000, y: 60, rotation: -20, duration: 1.0, ease: "power1.in", immediateRender: false }, ${r2(at(33, "memo") - 0.6)});`);
  tw(`tl.to("#memoL", { x: -700, y: -200, rotation: 40, opacity: 0, duration: 0.6, ease: "power2.out" }, ${r2(at(33, "memo") + 0.4)});`);
  pop("#memoT", at(33, "memo"), 0.3, 2);
  out("#memoT, #nsL", t(34) - 0.1); pop("#chipsL", t(34), 0.3, -4);
  [0, 1, 2, 3].forEach((i) => tw(`tl.fromTo("#cpL${i}", { y: 0, opacity: 0 }, { keyframes: [{ y: -160, opacity: 1, duration: 0.3 }, { y: 0, duration: 0.3 }], repeat: 2, immediateRender: false }, ${r2(at(34, "refills") + i * 0.12)});`));
  enterMike("mL", t(35), 400); breathe("mL", t(35) + 0.5, b); hop("mL", at(35, "buy"));
  pop("#stampL", t(36), 2.2, -6);
}
// 13 · Trick #3 title
{
  const a = t(37), b = t(38);
  titleCard("#FFE7A3", 3, "the lever", reels("slotM").replace('class="slot"', 'class="slot" style="left:1180px;top:200px"'), a, b);
  pop("#slotM", a + 0.2, 0.4, 4); pullLever("slotM", a + 0.6);
}
// 14 · pull to refresh, Tweetie, Tristan Harris
{
  const a = t(38), b = t(41);
  scene(a, b, "#E7F1F8", `
        <div id="phN" class="phoneWrap" style="left:240px;top:60px"><div class="screen"><div id="spN" class="spin">${P.spinner()}</div><div id="phN-col" class="feedCol">${[post("post"), post("post"), post("post")].join("")}</div></div><div class="stk frameOv">${P.phoneFrame()}</div></div>
        ${sticker("thN", 520, 140, 170, P.thumb())}
        ${label("pdN", 780, 110, "pull-down-to-refresh", "#fff", 56)}
        ${sticker("birdN", 800, 300, 200, P.bird())}${label("twN", 1030, 340, "first in “Tweetie”", C.sky, 52)}
        ${label("thN2", 790, 560, "Tristan Harris · ex-Google design ethicist", "#fff", 42)}
        <div style="position:absolute;left:1100px;top:670px;width:520px;height:560px;transform:scale(.46);transform-origin:0 0">${reels("slotN").replace('class="slot"', 'class="slot" style="left:0;top:0"')}</div>`);
  slideIn("#phN", a, -300, 0); pop("#pdN", a + 0.1, 0.3, -2);
  [0, 1].forEach((k) => {
    const tt = a + 0.4 + k * 1.1;
    tw(`tl.fromTo("#thN", { y: 0 }, { y: 220, duration: 0.45, ease: "power2.in", immediateRender: false }, ${r2(tt)});`);
    tw(`tl.to("#thN", { y: 0, duration: 0.35, ease: "power2.out" }, ${r2(tt + 0.5)});`);
    tw(`tl.fromTo("#phN-col", { y: 0 }, { y: 160, duration: 0.45, ease: "power2.in", immediateRender: false }, ${r2(tt)});`);
    tw(`tl.to("#phN-col", { y: 0, duration: 0.35, ease: "power2.out" }, ${r2(tt + 0.7)});`);
  });
  tw(`tl.fromTo("#spN", { rotation: 0 }, { rotation: 1440, duration: ${r2(b - a)}, ease: "none" }, ${r2(a)});`);
  pop("#birdN", at(39, "tweetie") - 0.2, 0.3, -6); pop("#twN", at(39, "tweetie"), 0.3, 2);
  pop("#thN2", at(40, "tristan"), 0.3, -1); pop("#slotN", at(40, "lever"), 0.3); pullLever("slotN", at(40, "lever") + 0.3); spinReels("slotN", at(40, "lever") + 0.5, 1.0);
}
// 15 · Pull. Wait. Spin. New stuff? Sometimes.
{
  const a = t(41), b = t(47);
  scene(a, b, "#FDE9C9", `
        ${reels("slotO").replace('class="slot"', 'class="slot" style="left:700px;top:160px"')}
        ${label("w0", 190, 200, "Pull.", "#fff", 80)}${label("w1", 210, 340, "Wait.", C.sky, 80)}${label("w2", 230, 480, "Spin.", C.mustard, 80)}
        ${label("w3", 1360, 260, "New stuff?", C.mint, 72)}${sticker("hgO", 1440, 420, 150, P.hourglass())}
        ${sticker("stO", 1300, 620, 480, P.stamp("SOMETIMES", C.deepCoral), ";transform:rotate(-7deg)")}
        ${label("addO", 560, 790, "the most addictive kind", C.deepCoral, 56, "#fff")}`);
  pop("#slotO", a, 0.6);
  pop("#w0", t(41), 0.3, -3); pullLever("slotO", t(41));
  pop("#w1", t(42), 0.3, 2); pop("#hgO", t(42), 0.3); tw(`tl.fromTo("#hgO", { rotation: 0 }, { rotation: 180, duration: 0.5, ease: "power2.inOut", immediateRender: false }, ${r2(t(42) + 0.1)});`);
  pop("#w2", t(43), 0.3, -2); spinReels("slotO", t(43), 1.1);
  pop("#w3", t(44), 0.3, 3); pop("#stO", t(45), 2.2, -7);
  pop("#addO", at(46, "addictive"), 0.3, -2);
}
// 16 · How to fight back: three moves
{
  const a = t(47), b = t(49);
  scene(a, b, "#CDEBDD", `
        <div id="fbP" class="big" style="left:120px;top:250px;text-align:left">How to fight back</div>
        ${label("tmP", 140, 450, "3 moves", C.mustard, 80)}
        ${mike("mP", 1420, 980, 720, "cool")}${sticker("shP", 1050, 480, 240, P.shield())}`);
  pop("#fbP", a + 0.05, 0.4, -2); pop("#tmP", t(48), 0.3, 3); enterMike("mP", a + 0.1, 400); breathe("mP", a + 0.6, b); pop("#shP", t(48), 0.3, -8);
}
// 17 · Move 1: your own stopping point
{
  const a = t(49), b = t(51);
  scene(a, b, C.cream, `
        <div id="m1Q" class="big" style="left:120px;top:110px;text-align:left;font-size:96px">1 · Your own stopping point</div>
        ${sticker("tmQ", 380, 340, 330, P.timer())}
        ${sticker("arQ", 760, 470, 200, S("0 0 200 80", `<path d="M10 40 H160 M130 10 L180 40 L130 70" fill="none" ${ink} stroke-width="12"/>`))}
        ${sticker("apQ", 1000, 400, 220, P.appIcon())}
        ${label("bfQ", 340, 760, "BEFORE you open the app", C.mint, 54)}${label("naQ", 1080, 760, "not after", "#fff", 54)}`);
  pop("#m1Q", a + 0.05, 0.4, -2); pop("#tmQ", t(50), 0.3, -6); pop("#arQ", at(50, "before"), 0.3); pop("#apQ", at(50, "open"), 0.3, 6);
  pop("#bfQ", at(50, "before"), 0.3, -2); pop("#naQ", at(50, "not after"), 0.3, 3);
}
// 18 · Move 2: friction
{
  const a = t(51), b = t(54);
  scene(a, b, "#E9E3F7", `
        <div id="m2R" class="big" style="left:120px;top:110px;text-align:left;font-size:96px">2 · Add friction</div>
        <div id="hsR" class="stk" style="left:1240px;top:90px;width:430px">${P.homeScreen()}</div>
        ${sticker("apR", 1360, 280, 130, P.appIcon())}
        ${label("offR", 200, 420, "off your home screen", "#fff", 56)}${label("loR", 200, 540, "log out after every use", C.sky, 56)}
        ${sticker("dlR", 560, 640, 520, P.dialog())}`);
  pop("#m2R", a + 0.05, 0.4, -2); pop("#hsR", a + 0.2, 0.5); pop("#apR", a + 0.4, 0.3);
  tw(`tl.to("#apR", { x: 700, rotation: 30, duration: 0.6, ease: "back.in(1.5)" }, ${r2(at(52, "off"))});`);
  pop("#offR", at(52, "off"), 0.3, -2); pop("#loR", at(52, "log"), 0.3, 2);
  pop("#dlR", at(53, "tap"), 0.3, -3); shake("#dlR", at(53, "sure"), 10);
}
// 19 · Move 3: grayscale
{
  const a = t(54), b = t(57);
  const items = [post("post"), dogPost(), post("video")].join("");
  scene(a, b, "#FFF1C9", `
        <div id="m3S" class="big" style="left:120px;top:110px;text-align:left;font-size:96px">3 · Make it less shiny</div>
        ${feed("phS", items).replace('class="phoneWrap"', 'class="phoneWrap" style="left:1260px;top:60px"')}
        ${label("gsS", 220, 400, "grayscale mode · 1 day", "#fff", 60)}
        ${label("hdS", 220, 540, "hits different", C.sky, 60)}`);
  pop("#m3S", a + 0.05, 0.4, -2); slideIn("#phS", a + 0.2, 300, 0);
  tw(`tl.set("#phS-col", { y: -300 }, ${r2(a)});`);
  pop("#gsS", at(55, "grayscale"), 0.3, -2);
  tw(`tl.fromTo("#phS .screen", { filter: "grayscale(0)" }, { filter: "grayscale(1)", duration: 0.8, ease: "power1.inOut" }, ${r2(at(55, "grayscale") + 0.2)});`);
  pop("#hdS", at(56, "hits"), 0.3, 3);
}
// 20 · You didn't fail. You were outplayed. The playbook.
{
  const a = t(57), b = t(60);
  scene(a, b, "#CDEBDD", `
        ${mike("mT", 520, 980, 700, "sad")}
        ${label("dfT", 980, 160, "You didn't fail.", "#fff", 72)}
        ${label("opT", 1020, 290, "You were outplayed.", C.mustard, 72)}
        ${sticker("bkT", 1080, 460, 440, P.book())}`);
  enterMike("mT", a, -300); breathe("mT", a + 0.5, b);
  pop("#dfT", a + 0.05, 0.3, -2); pop("#opT", t(58), 0.3, 2); pose("mT", "surprised", t(58));
  pop("#bkT", at(59, "playbook") - 0.2, 0.3, -5); pose("mT", "cool", at(59, "playbook"));
}
// 21 · subscribe: the only button trying to help you
{
  const a = t(60), b = t(62);
  scene(a, b, "#F8C9C3", `
        ${sticker("sbU", 640, 260, 640, P.subBtn())}
        ${sticker("curU", 1180, 420, 110, P.cursor())}
        ${label("onU", 470, 600, "the only button actually trying to help you", "#fff", 52)}
        ${mike("mU", 300, 980, 600, "happy")}`);
  pop("#sbU", a + 0.05, 0.4, -3);
  tw(`tl.fromTo("#curU", { x: 200, y: 160, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, ${r2(at(60, "subscribe") - 0.3)});`);
  tw(`tl.fromTo("#sbU", { scale: 1 }, { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, ${r2(at(60, "subscribe") + 0.25)});`);
  pop("#onU", t(61), 0.3, -1); enterMike("mU", t(61), -300); breathe("mU", t(61) + 0.5, b); pose("mU", "love", at(61, "help"));
}
// 22 · 2am: go to bed
{
  const a = t(62), b = DUR;
  scene(a, b, C.navy, `
        ${sticker("moonV", 1560, 60, 220, P.moon())}${[0, 1, 2, 3].map((i) => sticker(`stV${i}`, 300 + i * 360, 70 + (i % 2) * 90, 46, P.spark("#fff"))).join("")}
        <div id="clkV" class="stk" style="left:1180px;top:280px;width:360px">${P.clockFace()}<div class="hand" style="height:90px;transform:rotate(60deg)">${P.hand(90, 20)}</div><div class="hand" style="height:130px">${P.hand(130, 12, C.coral)}</div></div>
        ${label("amV", 1220, 700, "2:00 AM", C.mustard, 60)}
        ${mike("mV", 620, 980, 680, "sad")}
        ${label("bedV", 160, 150, "go to bed.", "#fff", 76)}
        ${label("tmV", 900, 820, "next one: tomorrow", C.mint, 52)}
        ${[0, 1, 2].map((i) => `<div id="zV${i}" class="zz" style="left:${800 + i * 70}px;top:${330 - i * 80}px;font-size:${60 + i * 20}px">z</div>`).join("")}`);
  pop("#clkV", a + 0.05, 0.4, 4); pop("#amV", at(62, "2am"), 0.3, -3); enterMike("mV", a, -300); breathe("mV", a + 0.5, b);
  pop("#bedV", t(63), 0.3, -3); [0, 1, 2].forEach((i) => { pop(`#zV${i}`, t(63) + 0.2 + i * 0.2, 0.2); float(`#zV${i}`, t(63) + 0.6 + i * 0.2, b - t(63) - 1, 20, 1); });
  pop("#tmV", t(64), 0.3, 2);
}

// ---------- captions (sentence-level, from the narration segments) ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
SEG.forEach((s, i) => {
  const end = i + 1 < SEG.length ? Math.min(SEG[i + 1].start, s.end + 0.6) : DUR;
  parts.push(`
      <div id="cap${i}" class="clip layer" data-start="${r2(s.start)}" data-duration="${r2(end - s.start)}" data-track-index="5"><div class="capStage"><div class="cap">${esc(s.text)}</div></div></div>`);
});

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Fredoka"; font-weight: 500; src: url("assets/fonts/fredoka-latin-500-normal.woff2") format("woff2"); }
      @font-face { font-family: "Fredoka"; font-weight: 700; src: url("assets/fonts/fredoka-latin-700-normal.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.cream}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${C.cream}; font-family: "Fredoka", sans-serif; font-weight: 700; color: ${C.ink}; }
      .layer { position: absolute; inset: 0; width: 100%; height: 100%; }
      .dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(0,0,0,.07) 3px, transparent 3.5px); background-size: 46px 46px; }
      /* sticker look: white die-cut edge + soft drop shadow, like the character sheet */
      .stk { position: absolute; transform-origin: 50% 60%; filter: drop-shadow(4px 0 0 #fff) drop-shadow(-4px 0 0 #fff) drop-shadow(0 4px 0 #fff) drop-shadow(0 -4px 0 #fff) drop-shadow(0 10px 10px rgba(0,0,0,.22)); }
      .stk svg { display: block; width: 100%; height: auto; overflow: visible; }
      .lbl { position: absolute; padding: 10px 30px 14px; border-radius: 999px; border: 5px solid ${C.ink}; box-shadow: 0 0 0 7px #fff, 0 12px 16px rgba(0,0,0,.2); white-space: nowrap; transform-origin: 50% 50%; line-height: 1.1; }
      .big { position: absolute; text-align: center; font-size: 120px; line-height: 1; color: ${C.ink}; -webkit-text-stroke: 0; text-shadow: 0 0 0 #fff, 6px 6px 0 #fff, -6px -6px 0 #fff, 6px -6px 0 #fff, -6px 6px 0 #fff, 0 16px 18px rgba(0,0,0,.18); transform-origin: 50% 50%; }
      .mike { position: absolute; width: 0; transform-origin: 50% 100%; }
      .mikeIn { position: absolute; left: 0; bottom: 0; transform-origin: 50% 100%; }
      .mike img { position: absolute; bottom: 0; height: var(--h); transform: translateX(-50%); filter: drop-shadow(0 14px 12px rgba(0,0,0,.25)); }
      .hand { position: absolute; left: calc(50% - 20px); bottom: 50%; width: 40px; transform-origin: 50% calc(100% - 10px); }
      .hand svg { width: 100%; height: 100%; display: block; }
      .needle { position: absolute; left: calc(50% - 14px); top: 195px; width: 28px; height: 100px; transform-origin: 50% 86%; }
      .needle svg { width: 100%; height: 100%; display: block; }
      .mfill { position: absolute; left: 68px; width: 84px; top: 30px; height: 490px; border-radius: 40px; background: ${C.mint}; transform-origin: 50% 100%; }
      .iris { position: absolute; inset: 0; background: ${C.navy}; opacity: 0; }
      .xbar { position: absolute; left: 30%; right: 30%; top: 60%; height: 16px; background: ${C.red}; border-radius: 12px; transform-origin: 0 50%; box-shadow: 0 0 0 6px #fff; }
      .xbar.small { height: 14px; right: auto; }
      .card { position: absolute; padding: 50px 60px 56px 110px; background: #fff; border: 5px solid ${C.ink}; border-radius: 34px; box-shadow: 0 0 0 8px #fff, 0 16px 20px rgba(0,0,0,.2); font-size: 64px; line-height: 1.2; transform-origin: 50% 50%; }
      .card .qm { position: absolute; left: 26px; top: 10px; font-size: 140px; color: ${C.coral}; line-height: 1; }
      .spot { position: absolute; left: 820px; top: 0; width: 980px; height: 900px; background: radial-gradient(ellipse at 50% 45%, rgba(255,255,255,.75), rgba(255,255,255,0) 60%); }
      .gaugeWrap { position: absolute; width: 460px; height: 460px; transform-origin: 50% 50%; }
      .badgeWrap { position: absolute; width: 250px; height: 340px; transform-origin: 50% 50%; }
      .badgeWrap .stk { position: relative; }
      .bdTxt { position: absolute; left: -40px; right: -40px; top: 270px; text-align: center; font-size: 40px; }
      .toolCard { position: absolute; top: 280px; width: 480px; height: 460px; background: #fff; border: 5px solid ${C.ink}; border-radius: 40px; box-shadow: 0 0 0 8px #fff, 0 16px 20px rgba(0,0,0,.18); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; transform-origin: 50% 50%; }
      .toolCard .stk { position: relative; }
      .tcTxt { font-size: 56px; }
      .mojo { position: absolute; left: 1180px; top: 520px; padding: 18px 54px 26px; border-radius: 999px; background: ${C.coral}; color: #fff; font-size: 104px; border: 6px solid ${C.ink}; box-shadow: 0 0 0 9px #fff, 0 16px 20px rgba(0,0,0,.22); transform-origin: 50% 50%; white-space: nowrap; }
      .phoneWrap { position: absolute; left: 1200px; top: 60px; width: 460px; height: 900px; transform-origin: 50% 50%; }
      .phoneWrap .screen { position: absolute; left: 24px; top: 24px; right: 24px; bottom: 24px; border-radius: 46px; overflow: hidden; background: #F4F1EC; }
      .phoneWrap .frameOv { position: absolute; left: 0; top: 0; width: 460px; }
      .feedCol { position: absolute; left: 0; right: 0; top: 70px; }
      .post { height: 280px; margin: 0 18px 20px; background: #fff; border-radius: 24px; border: 4px solid ${C.ink}; position: relative; overflow: hidden; }
      .post .pAv { position: absolute; left: 16px; top: 16px; width: 44px; height: 44px; border-radius: 50%; background: ${C.coral}; border: 3px solid ${C.ink}; }
      .post .pTxt { position: absolute; left: 74px; top: 20px; font-size: 30px; }
      .post .pImg { position: absolute; left: 16px; right: 16px; top: 80px; bottom: 16px; border-radius: 14px; background: ${C.sky}; }
      .post.grey .pImg { background: #D9D2CC; } .post.grey .pAv { background: #B9BEC9; } .post.grey .pTxt { color: #8A8480; }
      .post .pDog { position: absolute; left: 16px; right: 16px; top: 70px; bottom: 10px; border-radius: 14px; background: ${C.mint}; }
      .slot { position: absolute; width: 520px; height: 560px; transform-origin: 50% 50%; }
      .slot .reel { position: absolute; top: 160px; width: 120px; height: 200px; overflow: hidden; border-radius: 10px; }
      .slot .reelCol { position: absolute; left: 0; top: -20px; width: 120px; }
      .slot .reelCol svg { width: 120px; height: 1200px; display: block; }
      .slot .lever { left: 498px; top: 110px; width: 80px; transform-origin: 50% 92%; }
      .chaseArrow { position: absolute; left: 640px; top: 515px; width: 640px; height: 0; border-top: 12px dashed ${C.mustard}; transform-origin: 0 50%; }
      .card2 { position: absolute; width: 680px; height: 640px; background: #fff; border: 5px solid ${C.ink}; border-radius: 40px; box-shadow: 0 0 0 8px #fff, 0 16px 20px rgba(0,0,0,.2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; transform-origin: 50% 50%; }
      .card2 .cNum { font-size: 120px; color: ${C.deepCoral}; line-height: 1; }
      .card2 .cLine { font-size: 52px; font-weight: 500; }
      .card2 .cYear { font-size: 110px; color: ${C.ink}; line-height: 1.1; }
      .card2 .stk { position: relative; left: auto !important; top: auto !important; }
      .pager { position: absolute; display: flex; gap: 24px; }
      .pager span { padding: 14px 34px 20px; border: 5px solid ${C.ink}; border-radius: 22px; background: #fff; font-size: 56px; box-shadow: 0 0 0 7px #fff; }
      .pager .nx { background: ${C.mint}; transform-origin: 50% 50%; display: inline-block; }
      .spin { position: absolute; left: 50%; top: 14px; width: 80px; margin-left: -40px; }
      .spin svg { width: 80px; display: block; }
      .zz { position: absolute; color: #fff; font-weight: 700; transform-origin: 50% 50%; }
      .capStage { position: absolute; left: 0; right: 0; top: 968px; height: 90px; display: flex; align-items: center; justify-content: center; }
      .cap { max-width: 1600px; padding: 8px 30px 12px; border-radius: 22px; background: rgba(43,35,33,.82); color: #fff; font-weight: 500; font-size: 40px; line-height: 1.25; text-align: center; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">${parts.join("")}
    </div>
    <audio id="vo" src="assets/audio/narration.mp3" data-start="0" data-duration="${DUR}" data-track-index="9" data-volume="1"></audio>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${T.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log(`index.html: ${sceneN} scenes, ${SEG.length} captions, ${T.length} tweens, ${DUR}s`);
