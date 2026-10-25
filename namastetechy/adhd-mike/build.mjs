// "Inside Mike's ADHD brain": 2D sticker-style explainer, 16:9, narrated (Kokoro af_heart).
// Mike's six poses are cut from input/character_sheet.png; every prop is drawn here as SVG in
// the same white-outlined sticker style. Beats are timed to assets/audio/segments.json.
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

// ============ SCENES ============
// 1 · This is Mike
{
  const a = 0, b = t(2), id = scene(a, b, "#FBE3D2", `
        ${sticker("deskA", 840, 600, 900, P.desk())}
        ${sticker("lapA", 1050, 330, 520, P.laptop())}
        ${mike("mA", 420, 900, 620, "happy")}
        ${label("lblA", 200, 140, "This is Mike", "#fff", 72)}
        ${label("lblA2", 1150, 150, "1 email", C.mustard, 54)}`);
  enterMike("mA", 0.2); breathe("mA", 0.8, b); pop("#lblA", 0.5, 0.3, -4);
  slideIn("#deskA", 0.2, 200, 0); slideIn("#lapA", 0.4, 200, 0);
  pop("#lapA #badge", at(1, "one"), 0.2); pop("#lblA2", at(1, "email"), 0.3, 3); hop("mA", at(1, "answer"));
}
// 2 · Three hours later… spice rack, email still waiting
{
  const a = t(2), b = t(5);
  const jars = ["A", "B", "C", "D", "E", "F"].map((ch, i) => sticker(`jar${i}`, 860 + i * 160, 300, 150, P.jar(ch, [C.coral, C.teal, C.mustard, C.lilac, C.mint, C.sky][i]))).join("");
  scene(a, b, "#CDEBDD", `
        ${label("lblB", 760, 70, "3 hours later…", "#fff", 70)}
        <div id="clkB" class="stk" style="left:110px;top:120px;width:330px">${P.clockFace()}<div id="hB1" class="hand" style="height:110px">${P.hand(110, 18)}</div><div id="hB2" class="hand" style="height:150px">${P.hand(150, 12, C.coral)}</div></div>
        ${sticker("shelfB", 820, 500, 1000, P.shelf())}${jars}
        ${mike("mB", 520, 920, 560, "happy")}
        <div id="lapB" class="stk" style="left:150px;top:560px;width:300px">${P.laptop()}</div>
        ${label("lblB2", 120, 520, "still unanswered", C.deepCoral, 40, "#fff")}`);
  pop("#lblB", a + 0.1); pop("#clkB", a + 0.1);
  tw(`tl.fromTo("#hB2", { rotation: 0 }, { rotation: 1440, duration: ${r2(te(2) - a + 0.4)}, ease: "power2.inOut" }, ${r2(a + 0.2)});`);
  tw(`tl.fromTo("#hB1", { rotation: 0 }, { rotation: 120, duration: ${r2(te(2) - a + 0.4)}, ease: "power2.inOut" }, ${r2(a + 0.2)});`);
  slideIn("#shelfB", t(3) - 0.3, 300, 0); enterMike("mB", t(3) - 0.3, -300); breathe("mB", t(3) + 0.4, b);
  for (let i = 0; i < 6; i++) pop(`#jar${i}`, t(3) + 0.15 + i * 0.28, 0.2, (i % 2 ? 4 : -4));
  pop("#lapB", t(4), 0.2); pop("#lblB2", at(4, "answered"), 0.3, -3); pose("mB", "surprised", at(4, "still"));
  tw(`tl.fromTo("#lapB #badge", { scale: 1 }, { scale: 1.25, duration: 0.3, yoyo: true, repeat: 5, transformOrigin: "50% 50%", ease: "sine.inOut", immediateRender: false }, ${r2(at(4, "answered"))});`);
}
// 3 · Sound familiar? → zoom into the brain
{
  const a = t(5), b = t(7);
  scene(a, b, "#E3DDF7", `
        ${label("lblC", 640, 120, "Sound familiar?", "#fff", 86)}
        ${mike("mC", 960 - 300, 990, 700, "surprised")}
        ${sticker("qC1", 1240, 360, 90, P.q())}${sticker("qC2", 1340, 460, 70, P.q())}
        <div id="irisC" class="iris"></div>`);
  pop("#lblC", a + 0.05, 0.3, -3); breathe("mC", a, b); pop("#qC1", a + 0.4); pop("#qC2", a + 0.6);
  tw(`tl.fromTo("#mC", { scale: 1 }, { scale: 3.2, y: 520, duration: ${r2(te(6) - t(6) + 0.3)}, ease: "power2.in", transformOrigin: "50% 22%" }, ${r2(t(6))});`);
  out("#lblC", t(6)); out("#qC1, #qC2", t(6));
  tw(`tl.fromTo("#irisC", { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.in" }, ${r2(b - 0.5)});`);
}
// 4 · Control room, manager, manager on vacation
{
  const a = t(7), b = t(11);
  scene(a, b, C.navy, `
        ${label("lblD", 620, 60, "Mike's brain HQ", C.mustard, 66)}
        ${sticker("panelD", 310, 520, 1300, P.panel())}
        ${sticker("chairD", 840, 270, 240, P.chair())}
        ${sticker("mgrD", 850, 160, 220, P.manager())}
        ${label("mgrLbl", 1140, 260, "THE MANAGER", "#fff", 44)}
        ${label("mgrSub", 1140, 340, "decides what's important", C.mint, 34)}
        ${sticker("umbD", 360, 180, 300, P.umbrella())}${sticker("sunD", 1560, 110, 180, P.sun())}
        ${label("vacD", 1080, 300, "OUT OF OFFICE", C.deepCoral, 52, "#fff")}`);
  pop("#lblD", a + 0.1); slideIn("#panelD", a + 0.2, 0, 200);
  tw(`tl.fromTo("#panelD", { y: 0 }, { y: -6, duration: 0.25, yoyo: true, repeat: 11, ease: "sine.inOut", immediateRender: false }, ${r2(a + 0.8)});`);
  pop("#chairD", t(8), 0.3); pop("#mgrD", at(8, "manager"), 0.2); pop("#mgrLbl", at(8, "manager") + 0.2, 0.3, -2); pop("#mgrSub", at(8, "deciding"), 0.3, 2);
  float("#mgrD", at(8, "manager") + 0.5, t(9) - at(8, "manager"), 8);
  tw(`tl.to("#mgrD", { y: -700, rotation: 25, duration: 0.6, ease: "back.in(1.5)" }, ${r2(at(9, "manager"))});`);
  out("#mgrLbl, #mgrSub", at(9, "manager"));
  pop("#vacD", at(9, "is…"), 0.2, -6); pop("#umbD", t(10), 0.2, -6); pop("#sunD", t(10) + 0.2, 0.2);
  tw(`tl.fromTo("#sunD", { rotation: 0 }, { rotation: 90, duration: ${r2(b - t(10))}, ease: "none", immediateRender: false }, ${r2(t(10) + 0.6)});`);
}
// 5 · Focus / planning / impulse control
{
  const a = t(11), b = t(12);
  const g = [["FOCUS", C.mint, "focus"], ["PLANNING", C.mustard, "planning"], ["IMPULSE", C.coral, "impulse"]];
  scene(a, b, C.navy, `
        ${label("lblE", 640, 90, "ADHD affects…", C.mustard, 66)}
        ${g.map(([n, c], i) => `<div id="gE${i}" class="gaugeWrap" style="left:${170 + i * 560}px;top:330px"><div class="stk" style="left:0;top:0;width:460px">${P.gauge(n, c)}<div id="nE${i}" class="needle">${P.needle()}</div></div>${label(`gL${i}`, 0, 370, n === "IMPULSE" ? "IMPULSE CONTROL" : n, c, 46, C.ink, ";left:50%;transform:translateX(-50%)")}</div>`).join("")}`);
  pop("#lblE", a + 0.05);
  g.forEach(([, , w], i) => {
    pop(`#gE${i}`, at(11, w), 0.3);
    tw(`tl.fromTo("#nE${i}", { rotation: -70 }, { rotation: ${[-20, 25, 60][i]}, duration: 0.8, ease: "elastic.out(1, 0.4)" }, ${r2(at(11, w) + 0.2)});`);
    wob(`#nE${i}`, at(11, w) + 1, b - at(11, w) - 1, 14, 0.5);
  });
}
// 6 · Dopamine
{
  const a = t(12), b = t(16);
  const dis = [["disP", 1180, 160, 170, P.phone()], ["disC", 1520, 250, 220, P.cat()], ["disD", 1300, 560, 200, P.donut()], ["disG", 1580, 560, 260, P.controller()]];
  scene(a, b, C.navy, `
        <div id="mtr" class="stk" style="left:220px;top:150px;width:220px">${P.meter()}<div id="mFill" class="mfill"></div></div>
        ${label("lblF", 480, 130, "DOPAMINE", C.mint, 72)}
        ${label("lblF2", 480, 250, "“this is worth doing”", "#fff", 46)}
        ${sticker("formF", 640, 420, 300, P.form())}
        ${label("lblF3", 600, 830, "Boring task?", C.mustard, 52)}
        ${dis.map(([id, x, y, w, svg]) => sticker(id, x, y, w, svg)).join("")}
        ${label("lblF4", 1160, 860, "something more exciting!", C.deepCoral, 44, "#fff")}`);
  pop("#mtr", a + 0.1); pop("#lblF", at(12, "dopamine"), 0.3, -3);
  tw(`tl.fromTo("#mFill", { scaleY: 0.1 }, { scaleY: 0.85, duration: 1.2, ease: "power2.out" }, ${r2(at(12, "dopamine") + 0.2)});`);
  pop("#lblF2", at(12, "this is worth"), 0.3, 2);
  out("#lblF2", t(13) - 0.1); pop("#formF", t(13), 0.2, -5); pop("#lblF3", t(13) + 0.1, 0.3, 3);
  tw(`tl.to("#mFill", { scaleY: 0.12, duration: 1.0, ease: "power2.in" }, ${r2(t(14))});`);
  shake("#mtr", t(14) + 0.9, 10);
  dis.forEach(([id], i) => { pop(`#${id}`, t(15) + 0.5 + i * 0.35, 0.2, i % 2 ? 6 : -6); float(`#${id}`, t(15) + 1 + i * 0.35, b - t(15) - 1.4 - i * 0.35, 12, 1.2 + i * 0.2); });
  pop("#lblF4", at(15, "exciting"), 0.3, -2);
  tw(`tl.to("#formF", { x: -80, rotation: -20, opacity: 0.35, duration: 0.6, ease: "power2.inOut" }, ${r2(t(15) + 0.3)});`);
}
// 7 · Five minutes becomes an hour
{
  const a = t(16), b = t(18);
  scene(a, b, "#FFF1C9", `
        ${mike("mG", 260, 950, 640, "happy")}
        <div id="clkG" class="stk" style="left:1020px;top:170px;width:520px">${P.clockFace()}<div id="hG1" class="hand" style="height:150px">${P.hand(150, 22)}</div><div id="hG2" class="hand" style="height:200px">${P.hand(200, 14, C.coral)}</div></div>
        ${label("lblG1", 1080, 760, "“5 minutes”", "#fff", 60)}
        ${label("lblG2", 1080, 760, "= 1 hour", C.deepCoral, 60, "#fff", ";z-index:2")}`);
  enterMike("mG", a, -400); breathe("mG", a + 0.6, b); pop("#clkG", a + 0.2);
  pop("#lblG1", t(17), 0.3, -3);
  tw(`tl.fromTo("#hG2", { rotation: 0 }, { rotation: 360 * 3, duration: 1.4, ease: "power2.inOut" }, ${r2(at(17, "becomes"))});`);
  tw(`tl.fromTo("#hG1", { rotation: 300 }, { rotation: 390, duration: 1.4, ease: "power2.inOut" }, ${r2(at(17, "becomes"))});`);
  out("#lblG1", at(17, "hour") - 0.1, 0.2); pop("#lblG2", at(17, "hour"), 0.3, 3); pose("mG", "surprised", at(17, "hour"));
}
// 8 · Walks into a room, forgets why
{
  const a = t(18), b = t(19);
  scene(a, b, "#D8ECF8", `
        ${sticker("doorH", 760, 160, 420, P.door())}
        ${mike("mH", 940, 960, 560, "happy")}
        ${sticker("qH1", 1240, 300, 110, P.q())}${sticker("qH2", 1380, 380, 80, P.q())}${sticker("qH3", 1150, 200, 70, P.q())}`);
  pop("#doorH", a + 0.05, 0.6);
  tw(`tl.fromTo("#mH", { x: -900 }, { x: 0, duration: 1.1, ease: "power1.out" }, ${r2(a + 0.1)});`);
  tw(`tl.fromTo("#mH-s", { y: 0 }, { y: -26, duration: 0.14, yoyo: true, repeat: 7, ease: "sine.inOut", immediateRender: false }, ${r2(a + 0.1)});`);
  pose("mH", "surprised", at(18, "forgets")); pop("#qH1", at(18, "forgets") + 0.1, 0.2, -8); pop("#qH2", at(18, "forgets") + 0.3, 0.2, 8); pop("#qH3", at(18, "why"), 0.2, -4);
}
// 9 · The bill, can't start
{
  const a = t(19), b = t(21);
  scene(a, b, "#FBE3D2", `
        ${sticker("billI", 260, 160, 340, P.bill())}
        ${sticker("stampI", 220, 380, 420, P.stamp("DUE", C.red), ";transform:rotate(-12deg)")}
        ${sticker("btnI", 1240, 520, 360, P.button())}
        ${sticker("curI", 1500, 330, 110, P.cursor())}
        ${mike("mI", 820, 960, 600, "happy")}`);
  pop("#billI", a + 0.05, 0.4, -4); pop("#stampI", at(19, "due"), 2.2, -12); shake("#billI", at(19, "due") + 0.2, 8);
  enterMike("mI", a + 0.1, 300); breathe("mI", a + 0.7, b); pose("mI", "sad", t(20));
  pop("#btnI", t(20) - 0.1, 0.3);
  tw(`tl.fromTo("#curI", { x: 120, y: -60, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, ${r2(t(20) + 0.2)});`);
  tw(`tl.fromTo("#curI", { x: 0 }, { x: 34, duration: 0.25, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${r2(at(20, "start") - 0.6)});`);
}
// 10 · Not laziness, wired differently
{
  const a = t(21), b = t(23);
  scene(a, b, "#CDEBDD", `
        <div id="lzJ" class="big" data-layout-allow-occlusion style="left:0;right:0;top:170px">LAZINESS<div id="lzX" class="xbar"></div></div>
        <div id="wireJ" class="stk" style="left:210px;top:420px;width:1500px">${P.wiring()}</div>
        ${label("lblJ", 690, 860, "wired differently", C.deepCoral, 60, "#fff")}`);
  pop("#lzJ", a + 0.05, 0.6);
  tw(`tl.fromTo("#lzX", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.out" }, ${r2(at(21, "laziness") + 0.2)});`);
  pop("#wireJ", t(22) - 0.1, 0.8);
  tw(`tl.fromTo("#wA", { strokeDasharray: 1500, strokeDashoffset: 1500 }, { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" }, ${r2(t(22))});`);
  tw(`tl.fromTo("#wB", { strokeDasharray: 2200, strokeDashoffset: 2200 }, { strokeDashoffset: 0, duration: 1.4, ease: "power1.inOut" }, ${r2(t(22) + 0.3)});`);
  pop("#lblJ", at(22, "differently"), 0.3, -2);
}
// 11 · Feelings hit harder
{
  const a = t(23), b = t(28);
  scene(a, b, "#FADADD", `
        ${label("lblK", 160, 90, "And feelings?", "#fff", 76)}
        ${sticker("barsK", 220, 300, 520, P.bars())}
        ${label("lblK1", 260, 660, "volume: MAX", C.red, 48, "#fff")}
        ${mike("mK", 1110, 960, 640, "sad")}
        ${sticker("bubK", 820, 120, 560, P.bubble("“small criticism”"))}
        ${sticker("gloveK", 1500, 330, 380, P.glove())}
        ${sticker("stK1", 1080, 300, 150, P.steam())}${sticker("stK2", 1600, 300, 150, P.steam())}
        <div id="quoteK" class="card" style="left:120px;top:320px;width:900px"><div class="qm">“</div>The hardest part… and the least talked about.</div>
        <div id="flashK" class="layer" style="background:${C.red};opacity:0"></div>`);
  pop("#lblK", a + 0.05, 0.3, -3); enterMike("mK", a + 0.1, 400); breathe("mK", a + 0.7, b);
  pop("#barsK", t(24), 0.5); pop("#lblK1", te(24) - 0.2, 0.3, 3);
  tw(`tl.fromTo("#barsK .vb", { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.25, stagger: 0.06, ease: "back.out(2)" }, ${r2(t(24) + 0.1)});`);
  out("#barsK, #lblK1, #lblK", t(25) - 0.15);
  pop("#bubK", t(25), 0.3, -3);
  tw(`tl.fromTo("#gloveK", { x: 700, opacity: 0 }, { x: -60, opacity: 1, duration: 0.25, ease: "power4.in" }, ${r2(at(25, "punch") - 0.15)});`);
  shake("#mK", at(25, "punch") + 0.1, 26);
  tw(`tl.to("#gloveK", { x: 700, duration: 0.4, ease: "power2.in" }, ${r2(at(25, "punch") + 0.6)});`);
  out("#bubK", t(26) - 0.1); pose("mK", "angry", t(26));
  tw(`tl.fromTo("#flashK", { opacity: 0.35 }, { opacity: 0, duration: 0.5, ease: "power2.out", immediateRender: false }, ${r2(t(26))});`);
  pop("#stK1", t(26) + 0.1, 0.2, -10); pop("#stK2", t(26) + 0.25, 0.2, 10);
  float("#stK1, #stK2", t(26) + 0.6, te(26) - t(26), 30, 0.5);
  out("#stK1, #stK2", t(27) - 0.1); pose("mK", "sad", t(27)); pop("#quoteK", t(27) + 0.1, 0.6);
}
// 12 · The twist: hyperfocus and strengths
{
  const a = t(28), b = t(33);
  const badges = [["CREATIVE", P.badge(`<path d="M130 50 Q190 50 190 110 Q190 150 160 170 V195 H100 V170 Q70 150 70 110 Q70 50 130 50 Z" fill="#fff" ${ink}/>`, C.mustard), "creative"],
    ["ENERGETIC", P.badge(`<path d="M150 40 L80 140 H130 L110 220 L190 110 H140 Z" fill="#fff" ${ink}/>`, C.coral), "energetic"],
    ["QUICK THINKER", P.badge(`<path d="M130 40 Q180 80 170 160 L150 190 H110 L90 160 Q80 80 130 40 Z" fill="#fff" ${ink}/><circle cx="130" cy="110" r="18" fill="${C.sky}" ${ink}/>`, C.lilac), "thinking"]];
  scene(a, b, "#FFE7A3", `
        <div id="twL" class="big" data-layout-allow-occlusion style="left:0;right:0;top:380px">But here's the twist</div>
        <div id="spotL" class="spot"></div>
        ${sticker("sketchL", 1080, 300, 460, P.sketch())}
        ${sticker("retL", 1010, 230, 600, P.reticle())}
        ${mike("mL", 420, 960, 650, "cool")}
        ${label("hyperL", 1060, 760, "HYPERFOCUS", C.red, 72, "#fff")}
        ${[0, 1, 2].map((i) => sticker(`wcL${i}`, -360, 140 + i * 230, 300, P.wingClock())).join("")}
        ${badges.map(([n, svg], i) => `<div id="bdL${i}" class="badgeWrap" style="left:${860 + i * 340}px;top:250px">${sticker(`bdLs${i}`, 0, 0, 250, svg)}<div class="bdTxt">${n}</div></div>`).join("")}`);
  pop("#twL", a + 0.05, 0.4, -2); out("#twL", t(29) - 0.15);
  pop("#mL", t(29), 0.6); breathe("mL", t(29) + 0.4, b);
  tw(`tl.fromTo("#spotL", { opacity: 0 }, { opacity: 1, duration: 0.4 }, ${r2(t(29))});`);
  pop("#sketchL", at(29, "grabs"), 0.3, -3);
  tw(`tl.fromTo("#retL", { scale: 1.8, opacity: 0, rotation: 60 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.5, ease: "power3.out" }, ${r2(at(29, "locks"))});`);
  tw(`tl.to("#retL", { rotation: 90, duration: ${r2(t(32) - at(29, "locks"))}, ease: "none" }, ${r2(at(29, "locks") + 0.5)});`);
  pop("#hyperL", at(30, "hyperfocus"), 0.2, -4);
  [0, 1, 2].forEach((i) => tw(`tl.fromTo("#wcL${i}", { x: 0 }, { x: 2400, duration: 1.6, ease: "power1.inOut" }, ${r2(t(31) + i * 0.25)});`));
  out("#sketchL, #retL, #hyperL, #spotL", t(32) - 0.1);
  pose("mL", "happy", t(32));
  badges.forEach(([, , w], i) => pop(`#bdL${i}`, at(32, w), 0.2, i % 2 ? 5 : -5));
  pose("mL", "love", at(32, "feet"));
}
// 13 · The lesson
{
  const a = t(33), b = t(38);
  scene(a, b, C.cream, `
        <div id="lsM" class="big" data-layout-allow-occlusion style="left:0;right:0;top:90px">So the lesson?</div>
        ${sticker("bulbM", 360, 300, 260, P.bulb(true))}
        ${label("brkM", 300, 690, "broken", "#fff", 56)}<div id="brkX" class="xbar small" style="left:300px;top:720px;width:230px"></div>
        ${sticker("pzM", 1180, 320, 320, P.puzzle())}
        ${label("difM", 1160, 690, "different", C.deepTeal, 60, "#fff")}
        ${[["stairs", P.stairs(), "Small steps", "small"], ["timer", P.timer(), "Timers", "timers"], ["heart", P.heartHands(), "Support", "support"]].map(([k, svg, txt], i) => `<div id="tool${i}" class="toolCard" data-layout-allow-occlusion style="left:${190 + i * 540}px">${sticker(`toolS${i}`, 0, 0, 230, svg, ";position:relative")}<div class="tcTxt">${txt}</div></div>`).join("")}
        <div id="docM" class="layer">${sticker("docC", 560, 220, 380, P.doctor())}${sticker("docS", 1000, 260, 280, P.steth())}${label("docL", 640, 650, "Talk to a doctor", C.deepCoral, 72, "#fff")}</div>`);
  pop("#lsM", a + 0.05, 0.4, -2);
  pop("#bulbM", t(34), 0.3, -6); pop("#brkM", at(34, "broken"), 0.3);
  tw(`tl.fromTo("#brkX", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${r2(te(34) - 0.2)});`);
  pop("#pzM", t(35), 0.2, 8); pop("#difM", t(35) + 0.2, 0.3, -3);
  tw(`tl.fromTo("#pzM", { rotation: 0 }, { rotation: 360, duration: 1, ease: "back.out(1.4)", immediateRender: false }, ${r2(t(35) + 0.4)});`);
  out("#lsM, #bulbM, #brkM, #brkX, #pzM, #difM", t(36) - 0.15);
  [["small"], ["timers"], ["support"]].forEach(([w], i) => pop(`#tool${i}`, at(36, w), 0.3, i % 2 ? 4 : -4));
  out("#tool0, #tool1, #tool2", t(37) - 0.15);
  pop("#docC", at(37, "talk"), 0.3, -4); pop("#docS", at(37, "doctor"), 0.3, 6); pop("#docL", at(37, "doctor") + 0.15, 0.3, -2);
}
// 14 · See you next time. Stay mojo.
{
  const a = t(38), b = DUR;
  const hearts = [[520, 260, 90, C.coral], [1380, 220, 110, C.rose], [600, 620, 70, C.mustard], [1320, 600, 80, C.coral]];
  scene(a, b, "#FBE3D2", `
        ${mike("mN", 760, 1000, 720, "love")}
        ${hearts.map(([x, y, w, c], i) => sticker(`hN${i}`, x, y, w, P.heart(c))).join("")}
        ${label("seeN", 1180, 330, "See you next time!", "#fff", 60)}
        <div id="mojoN" class="mojo">Stay mojo${sticker("spN", 0, 0, 90, P.spark(), ";position:absolute;right:-70px;top:-50px")}</div>`);
  pop("#mN", a, 0.5); breathe("mN", a + 0.4, b); hop("mN", t(39), 70);
  hearts.forEach((_, i) => { pop(`#hN${i}`, a + 0.2 + i * 0.15, 0.2, i % 2 ? 10 : -10); float(`#hN${i}`, a + 0.7 + i * 0.15, b - a - 1, 16, 1.1 + i * 0.15); });
  pop("#seeN", a + 0.15, 0.3, -3); pop("#mojoN", t(39), 0.3, -4);
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
