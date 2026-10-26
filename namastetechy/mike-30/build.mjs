// "Why you feel like a failure at 30": 2D sticker-style story, 16:9, narrated (Kokoro af_heart, fast cut),
// with a synthesized music bed and pop / soft-whoosh SFX (mix.py). Mike (character sheet) plays the lead;
// the rest of the cast is drawn as SVG chibi stickers. Beats are timed to assets/audio/segments.json.
// usage: node build.mjs -> index.html + assets/audio/sfx.json, then python3 mix.py
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
const parts = [], T = [], SFX = [];
const tw = (s) => T.push(s);
const pop = (sel, time, from = 0.3, rot = 0) => (SFX.push({ type: "pop", t: r2(time), gain: 0.55 }), tw(`tl.fromTo("${sel}", { scale: ${from}, opacity: 0, rotation: ${rot - 10} }, { scale: 1, opacity: 1, rotation: ${rot}, duration: 0.45, ease: "back.out(2.2)" }, ${r2(time)});`));
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
  if (from > 0) SFX.push({ type: "whoosh", t: r2(from - 0.12), gain: 0.35 });
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
// ---------- cast: chibi side characters drawn to match Mike's sticker style ----------
const SKIN = { light: "#F6D3B3", tan: "#E8B48E", deep: "#B9805A" };
const HAIR = {
  short: (c) => `<path d="M50 160 Q40 46 150 44 Q262 46 250 160 Q240 116 205 102 Q170 120 120 102 Q80 112 50 160 Z" fill="${c}" ${ink}/>`,
  part: (c) => `<path d="M50 165 Q38 46 150 42 Q264 46 250 165 Q246 110 210 96 Q140 128 90 92 Q58 116 50 165 Z" fill="${c}" ${ink}/>`,
  bob: (c) => `<path d="M52 136 Q48 44 150 42 Q252 44 248 136 Z" fill="${c}" ${ink}/>`,
  long: (c) => `<path d="M50 160 Q44 44 150 44 Q256 44 252 170 Q215 100 140 108 Q90 114 50 160 Z" fill="${c}" ${ink}/>`,
  curly: (c) => Array.from({ length: 9 }, (_, i) => { const a = Math.PI * (1.05 + i * 0.112); return `<circle cx="${r2(150 + 96 * Math.cos(a))}" cy="${r2(140 + 92 * Math.sin(a))}" r="34" fill="${c}" ${ink} stroke-width="5"/>`; }).join(""),
  white: () => `<path d="M48 175 Q40 92 92 72 Q150 56 208 72 Q260 92 252 175 Q240 112 150 104 Q60 112 48 175 Z" fill="#F4F2EE" ${ink}/>`,
  bald: (c) => `<path d="M50 186 Q44 118 80 98 L92 150 Z M250 186 Q256 118 220 98 L208 150 Z" fill="${c}" ${ink} stroke-width="5"/>`,
};
const BACK = {
  bob: (c) => `<path d="M42 252 Q16 60 150 40 Q284 60 258 252 Q150 268 42 252 Z" fill="${c}" ${ink}/>`,
  long: (c) => `<path d="M40 340 Q8 60 150 40 Q292 60 260 340 Q150 360 40 340 Z" fill="${c}" ${ink}/>`,
};
const MOUTH = {
  smile: `<path d="M132 206 Q150 224 168 206" fill="none" ${ink} stroke-width="5"/>`,
  grin: `<path d="M126 202 Q150 240 174 202 Z" fill="#8A3B3B" ${ink} stroke-width="5"/>`,
  o: `<ellipse cx="150" cy="214" rx="11" ry="14" fill="#8A3B3B" ${ink} stroke-width="5"/>`,
  smug: `<path d="M134 210 Q156 218 172 202" fill="none" ${ink} stroke-width="5"/>`,
};
const EYES = {
  dot: [112, 188].map((x) => `<ellipse cx="${x}" cy="168" rx="12" ry="15" fill="${C.ink}"/><circle cx="${x + 4}" cy="162" r="4.5" fill="#fff"/>`).join(""),
  happy: [112, 188].map((x) => `<path d="M${x - 13} 172 Q${x} 156 ${x + 13} 172" fill="none" ${ink} stroke-width="6"/>`).join(""),
};
const ACC = {
  glasses: `<g fill="rgba(255,255,255,.25)" stroke="${C.ink}" stroke-width="6"><circle cx="112" cy="168" r="27"/><circle cx="188" cy="168" r="27"/><path d="M139 166 H161"/></g>`,
  suit: `<path d="M128 258 L150 300 L172 258 Z" fill="#fff" ${ink} stroke-width="4"/><path d="M150 268 L141 280 L150 332 L159 280 Z" fill="${C.red}" ${ink} stroke-width="4"/>`,
  bowtie: `<path d="M128 252 L128 280 L150 266 Z M172 252 L172 280 L150 266 Z" fill="${C.ink}"/>`,
  stringTie: `<path d="M150 268 L126 256 V280 Z M150 268 L174 256 V280 Z" fill="${C.ink}"/><path d="M146 272 L138 326 M154 272 L162 326" ${ink} stroke-width="4"/>`,
  apron: `<path d="M112 282 H188 V388 H112 Z" fill="#fff" ${ink} stroke-width="4"/><path d="M112 282 Q150 262 188 282" fill="none" ${ink} stroke-width="4"/>`,
  goatee: `<path d="M118 200 Q150 184 182 200 Q166 214 150 205 Q134 214 118 200 Z" fill="#F4F2EE" ${ink} stroke-width="4"/><path d="M136 222 Q150 266 164 222 Z" fill="#F4F2EE" ${ink} stroke-width="4"/>`,
  pearls: Array.from({ length: 7 }, (_, i) => `<circle cx="${120 + i * 10}" cy="${266 + Math.sin((i / 6) * Math.PI) * 14}" r="6" fill="#fff" stroke="${C.ink}" stroke-width="2"/>`).join(""),
  hat: (c) => `<path d="M150 -44 L106 64 Q150 80 194 64 Z" fill="${c}" ${ink}/><path d="M122 30 L176 22 M114 50 L186 44" stroke="#fff" stroke-width="7"/><circle cx="150" cy="-46" r="15" fill="${C.mustard}" ${ink} stroke-width="5"/>`,
};
// one person: back hair > legs > body > arms > ears > head > hair > face > accessories
const person = ({ skin = SKIN.light, hair = "#3A2A22", style = "short", shirt = C.sky, pants = "#2E3A55", mouth = "smile", eyes = "dot", body = "", head = "", arms = "down" }) => S("0 0 300 460", `
    ${BACK[style] ? BACK[style](hair) : ""}
    <rect x="100" y="368" width="42" height="64" rx="14" fill="${pants}" ${ink}/><rect x="158" y="368" width="42" height="64" rx="14" fill="${pants}" ${ink}/>
    <ellipse cx="116" cy="436" rx="30" ry="14" fill="#5A3A2A" ${ink} stroke-width="5"/><ellipse cx="184" cy="436" rx="30" ry="14" fill="#5A3A2A" ${ink} stroke-width="5"/>
    <path d="M88 266 Q150 244 212 266 L220 382 Q150 396 80 382 Z" fill="${shirt}" ${ink}/>${body}
    ${(arms === "up" ? ["M94 276 Q60 240 64 192", "M206 276 Q240 240 236 192"] : ["M94 276 Q62 312 70 360", "M206 276 Q238 312 230 360"]).map((d) => `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="36" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${shirt}" stroke-width="24" stroke-linecap="round"/>`).join("")}
    ${(arms === "up" ? [[64, 186], [236, 186]] : [[70, 364], [230, 364]]).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="${skin}" ${ink} stroke-width="5"/>`).join("")}
    <circle cx="50" cy="176" r="21" fill="${skin}" ${ink} stroke-width="5"/><circle cx="250" cy="176" r="21" fill="${skin}" ${ink} stroke-width="5"/>
    <circle cx="150" cy="152" r="102" fill="${skin}" ${ink}/>
    ${HAIR[style](hair)}
    ${EYES[eyes]}<ellipse cx="90" cy="202" rx="17" ry="10" fill="#F2928A" opacity=".55"/><ellipse cx="210" cy="202" rx="17" ry="10" fill="#F2928A" opacity=".55"/>
    ${MOUTH[mouth]}${head}`);

const CAST = {
  roommate: () => person({ style: "short", hair: "#6B4226", shirt: C.mint, mouth: "grin", arms: "up" }),
  girl: () => person({ style: "long", hair: "#8A4B2A", skin: SKIN.light, shirt: C.rose, pants: "#3B4C7A", mouth: "grin", eyes: "happy" }),
  vp: () => person({ style: "part", hair: "#2B2321", skin: SKIN.tan, shirt: "#33415E", pants: "#33415E", mouth: "smug", body: ACC.suit }),
  festinger: () => person({ style: "bald", hair: "#5E5650", shirt: "#7A6A5A", pants: "#4A4038", mouth: "smile", body: ACC.bowtie, head: ACC.glasses }),
  julia: () => person({ style: "curly", hair: "#9C5B33", shirt: C.sky, pants: "#3B4C7A", mouth: "grin", body: ACC.apron }),
  vera: () => person({ style: "bob", hair: "#1E1A1A", skin: SKIN.light, shirt: "#2B2321", pants: "#2B2321", mouth: "smile", body: ACC.pearls }),
  colonel: () => person({ style: "white", hair: "#F4F2EE", shirt: "#FBFAF6", pants: "#FBFAF6", mouth: "smile", body: ACC.stringTie, head: ACC.goatee + ACC.glasses }),
  friend: (k) => [
    person({ style: "long", hair: "#2B2321", skin: SKIN.deep, shirt: C.mustard, mouth: "grin", eyes: "happy", head: ACC.hat(C.coral), arms: "up" }),
    person({ style: "curly", hair: "#2B2321", skin: SKIN.tan, shirt: C.lilac, mouth: "grin", head: ACC.hat(C.teal), arms: "up" }),
    person({ style: "short", hair: "#C9893F", shirt: C.coral, mouth: "grin", eyes: "happy", head: ACC.hat(C.lilac), arms: "up" }),
  ][k],
};

// ---------- props for this story ----------
Object.assign(P, {
  tree: () => S("0 0 420 540", `<path d="M180 300 L170 520 H250 L240 300 Z" fill="#9A6A44" ${ink}/><path d="M210 360 L270 300 M205 410 L150 360" ${ink} stroke-width="10"/>
    ${[[210, 150, 130], [110, 230, 100], [310, 230, 100], [160, 110, 90], [270, 110, 90], [210, 260, 110]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7CC48E" ${ink}/>`).join("")}
    ${[[200, 160, 92], [130, 230, 60], [290, 230, 60], [210, 250, 72]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#7CC48E"/>`).join("")}
    <ellipse cx="210" cy="524" rx="150" ry="14" fill="#6FB07E" ${ink} stroke-width="5"/>`),
  rings: () => S("0 0 240 240", `${[110, 86, 62, 40, 20].map((r, i) => `<circle cx="120" cy="120" r="${r}" fill="${i % 2 ? "#E9C9A0" : "#F3DDB9"}" ${ink} stroke-width="5"/>`).join("")}`),
  cake: () => S("0 0 380 360", `<ellipse cx="190" cy="330" rx="180" ry="24" fill="#fff" ${ink}/><rect x="40" y="200" width="300" height="120" rx="20" fill="${C.rose}" ${ink}/>
    <rect x="90" y="110" width="200" height="100" rx="18" fill="#FFF3E0" ${ink}/><path d="M90 140 Q115 165 140 140 Q165 165 190 140 Q215 165 240 140 Q265 165 290 140" fill="none" stroke="${C.coral}" stroke-width="10"/>
    <path d="M40 230 Q70 255 100 230 Q130 255 160 230 Q190 255 220 230 Q250 255 280 230 Q310 255 340 230" fill="none" stroke="#fff" stroke-width="10"/>
    <text x="190" y="104" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="104" fill="${C.mustard}" stroke="${C.ink}" stroke-width="6" paint-order="stroke">30</text>
    <path d="M160 6 Q170 -14 168 -26 Q186 -8 172 8 Z M222 6 Q232 -14 230 -26 Q248 -8 234 8 Z" fill="#FF9F43" ${ink} stroke-width="3"/>`),
  bistro: () => S("0 0 760 600", `<rect x="20" y="90" width="720" height="500" rx="10" fill="#C77B58" ${ink}/><rect x="60" y="20" width="640" height="90" rx="20" fill="${C.navy}" ${ink}/>
    <text x="380" y="88" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="64" fill="${C.mustard}">BISTRO</text>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M${40 + i * 85} 110 h85 v50 q-42 30 -85 0 Z" fill="${i % 2 ? "#fff" : C.coral}" ${ink} stroke-width="4"/>`).join("")}
    <rect x="70" y="200" width="420" height="300" rx="16" fill="#FFE29A" ${ink}/><rect x="560" y="260" width="130" height="330" rx="10" fill="#7A4A30" ${ink}/><circle cx="670" cy="430" r="10" fill="${C.mustard}"/>`),
  car: () => S("0 0 1000 470", `<path fill-rule="evenodd" d="M40 330 Q30 230 120 220 L250 210 Q320 70 460 60 H640 Q760 70 820 210 L900 220 Q980 240 970 330 V360 H40 Z M300 214 Q350 108 470 102 H560 V214 Z M600 102 H640 Q720 112 760 214 H600 Z" fill="${C.coral}" ${ink} stroke-width="8"/>
    <path d="M580 110 V214" ${ink} stroke-width="8"/><rect x="880" y="250" width="60" height="30" rx="10" fill="${C.mustard}" ${ink} stroke-width="5"/><rect x="420" y="250" width="70" height="16" rx="8" fill="${C.ink}"/>
    ${[230, 770].map((x) => `<circle cx="${x}" cy="360" r="78" fill="#3B3640" ${ink} stroke-width="8"/><circle cx="${x}" cy="360" r="32" fill="#C9CED8" ${ink} stroke-width="6"/>`).join("")}`),
  house: () => S("0 0 320 300", `<path d="M30 140 L160 30 L290 140 Z" fill="${C.coral}" ${ink}/><rect x="60" y="130" width="200" height="150" fill="#FFF3E0" ${ink}/><rect x="140" y="190" width="50" height="90" fill="${C.teal}" ${ink} stroke-width="5"/><rect x="80" y="160" width="46" height="46" fill="${C.sky}" ${ink} stroke-width="5"/><rect x="214" y="160" width="30" height="46" fill="${C.sky}" ${ink} stroke-width="5"/>`),
  ring: () => S("0 0 260 320", `<circle cx="130" cy="220" r="80" fill="none" stroke="${C.ink}" stroke-width="34"/><circle cx="130" cy="220" r="80" fill="none" stroke="${C.mustard}" stroke-width="20"/>
    <path d="M70 90 L100 50 H160 L190 90 L130 160 Z" fill="#CFEFFF" ${ink}/><path d="M70 90 H190 M100 50 L115 90 L130 160 L145 90 L160 50" fill="none" ${ink} stroke-width="4"/>`),
  pisa: () => S("0 0 180 400", `<g transform="rotate(8 90 390)">${Array.from({ length: 6 }, (_, i) => `<rect x="${30 + (i === 5 ? 15 : 0)}" y="${330 - i * 60}" width="${120 - (i === 5 ? 30 : 0)}" height="60" fill="#FBF3E4" ${ink} stroke-width="5"/>${[0, 1, 2].map((k) => `<path d="M${48 + k * 32 + (i === 5 ? 10 : 0)} ${384 - i * 60} v-28 a10 10 0 0 1 20 0 v28" fill="none" stroke="${C.ink}" stroke-width="3"/>`).join("")}`).join("")}</g>`),
  briefcase: () => S("0 0 280 230", `<rect x="100" y="20" width="80" height="50" rx="14" fill="none" stroke="${C.ink}" stroke-width="14"/><rect x="20" y="60" width="240" height="160" rx="24" fill="#9A6A44" ${ink}/><path d="M20 120 H260" ${ink}/><rect x="125" y="105" width="30" height="30" rx="6" fill="${C.mustard}" ${ink} stroke-width="4"/>`),
  apartment: () => S("0 0 220 300", `<rect x="30" y="40" width="160" height="250" rx="8" fill="${C.lilac}" ${ink}/>${[0, 1, 2].map((r) => [0, 1].map((c) => `<rect x="${58 + c * 62}" y="${68 + r * 64}" width="42" height="40" fill="${r === 1 && c === 0 ? C.mustard : "#EAF4FF"}" ${ink} stroke-width="4"/>`).join("")).join("")}<rect x="92" y="240" width="36" height="50" fill="${C.ink}"/>`),
  plant: () => S("0 0 220 300", `<path d="M110 200 V90" ${ink} stroke-width="8"/>${[[110, 120, -40], [110, 150, 40], [110, 95, -10]].map(([x, y, a]) => `<ellipse cx="${x + a * 0.9}" cy="${y - 10}" rx="38" ry="18" transform="rotate(${a} ${x + a * 0.9} ${y - 10})" fill="#7CC48E" ${ink} stroke-width="5"/>`).join("")}
    <path d="M50 190 H170 L155 290 H65 Z" fill="#D7774F" ${ink}/><rect x="40" y="180" width="140" height="28" rx="8" fill="#E58C62" ${ink} stroke-width="5"/>`),
  plantDead: () => S("0 0 220 300", `<path d="M110 200 Q112 140 150 120" fill="none" ${ink} stroke-width="8"/>${[[150, 140, 70], [128, 170, 100], [160, 118, 30]].map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="34" ry="14" transform="rotate(${a} ${x} ${y})" fill="#B6A46A" ${ink} stroke-width="5"/>`).join("")}
    <path d="M50 190 H170 L155 290 H65 Z" fill="#D7774F" ${ink}/><rect x="40" y="180" width="140" height="28" rx="8" fill="#E58C62" ${ink} stroke-width="5"/>`),
  board: (lines) => S("0 0 680 440", `<rect x="10" y="10" width="660" height="420" rx="20" fill="#9A6A44" ${ink}/><rect x="40" y="40" width="600" height="340" rx="10" fill="#2F5A48"/>
    ${lines.map(([txt, size, y], i) => `<text x="340" y="${y}" text-anchor="middle" font-family="Fredoka" font-weight="${i ? 500 : 700}" font-size="${size}" fill="#F4F2EE">${txt}</text>`).join("")}<rect x="420" y="390" width="80" height="16" rx="6" fill="#fff" ${ink} stroke-width="3"/>`),
  balance: () => S("0 0 560 380", `<path d="M280 60 V340 M200 350 H360" ${ink} stroke-width="14"/><g id="beam"><path d="M70 90 H490" ${ink} stroke-width="14"/>
    <path d="M70 90 L20 210 H120 Z M490 90 L440 210 H540 Z" fill="none" ${ink} stroke-width="4"/><path d="M10 210 Q70 260 130 210 Z M430 210 Q490 260 550 210 Z" fill="${C.mustard}" ${ink}/></g><circle cx="280" cy="60" r="20" fill="${C.coral}" ${ink}/>`),
  film: () => S("0 0 760 300", `<rect x="10" y="10" width="740" height="280" rx="16" fill="${C.ink}"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${30 + i * 52}" y="24" width="28" height="20" rx="4" fill="#fff"/><rect x="${30 + i * 52}" y="256" width="28" height="20" rx="4" fill="#fff"/>`).join("")}
    ${[0, 1, 2].map((i) => `<rect x="${40 + i * 236}" y="60" width="210" height="180" rx="10" fill="${[C.mustard, C.rose, C.mint][i]}"/>`).join("")}
    <path d="M145 95 L160 135 L200 138 L168 162 L180 202 L145 178 L110 202 L122 162 L90 138 L130 135 Z" fill="#fff" ${ink} stroke-width="4"/>
    <path d="M381 110 C350 85 330 130 381 175 C432 130 412 85 381 110 Z" fill="${C.red}" ${ink} stroke-width="4"/>
    <path d="M565 110 H655 L645 160 Q610 190 575 160 Z M600 185 V210 H620 V185" fill="${C.mustard}" ${ink} stroke-width="4"/>`),
  clapper: () => S("0 0 300 260", `<rect x="20" y="90" width="260" height="160" rx="12" fill="${C.ink}"/><g id="clapTop"><path d="M20 50 L270 20 L276 70 L26 100 Z" fill="#fff" ${ink} stroke-width="5"/>${[0, 1, 2, 3].map((i) => `<path d="M${50 + i * 60} ${50 - i * 7} L${80 + i * 60} ${46 - i * 7} L${86 + i * 60} ${92 - i * 7} L${56 + i * 60} ${96 - i * 7} Z" fill="${C.ink}"/>`).join("")}</g><text x="150" y="190" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="44" fill="#fff">TAKE 99</text>`),
  calendar: () => S("0 0 320 340", `<rect x="10" y="30" width="300" height="300" rx="24" fill="#fff" ${ink}/><path d="M10 54 Q10 30 34 30 H286 Q310 30 310 54 V110 H10 Z" fill="${C.red}" ${ink}/>
    <text x="160" y="92" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="44" fill="#fff">DEADLINE</text><text x="160" y="270" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="150" fill="${C.ink}">30</text>
    <rect x="70" y="10" width="20" height="50" rx="8" fill="${C.ink}"/><rect x="230" y="10" width="20" height="50" rx="8" fill="${C.ink}"/>`),
  blankPage: () => S("0 0 320 400", `<path d="M20 20 H240 L300 80 V380 H20 Z" fill="#fff" ${ink}/><path d="M240 20 V80 H300" fill="none" ${ink}/><text x="150" y="90" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="34" fill="${C.ink}">THE RULES</text>
    ${[150, 200, 250, 300].map((y) => `<path d="M60 ${y} H260" stroke="#E2DAD0" stroke-width="10" stroke-linecap="round"/>`).join("")}<text x="160" y="360" text-anchor="middle" font-family="Fredoka" font-weight="500" font-size="30" fill="#8A8480">signed: ???</text>`),
  gavel: () => S("0 0 320 260", `<g transform="rotate(-30 160 130)"><rect x="60" y="40" width="160" height="70" rx="18" fill="#9A6A44" ${ink}/><rect x="130" y="110" width="22" height="140" rx="10" fill="#C48A5A" ${ink} stroke-width="5"/></g><rect x="150" y="210" width="150" height="34" rx="10" fill="#9A6A44" ${ink} stroke-width="5"/>`),
  rulebook: () => S("0 0 280 340", `<rect x="30" y="20" width="230" height="300" rx="16" fill="${C.navy}" ${ink}/><rect x="30" y="20" width="36" height="300" rx="10" fill="#33415E" ${ink} stroke-width="5"/>
    <text x="165" y="150" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="42" fill="${C.mustard}">OFFICIAL</text><text x="165" y="200" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="42" fill="${C.mustard}">RULES</text>`),
  cookbook: () => S("0 0 240 280", `<rect x="20" y="20" width="200" height="250" rx="14" fill="${C.red}" ${ink}/><rect x="20" y="20" width="30" height="250" rx="8" fill="${C.deepCoral}" ${ink} stroke-width="5"/>
    <text x="135" y="120" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="#fff">COOK</text><text x="135" y="166" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="40" fill="#fff">BOOK</text><circle cx="135" cy="215" r="20" fill="${C.mustard}" ${ink} stroke-width="4"/>`),
  dress: () => S("0 0 260 400", `<path d="M130 380 V340" ${ink} stroke-width="10"/><path d="M80 390 H180" ${ink} stroke-width="10"/><path d="M100 40 Q130 20 160 40 L170 120 Q130 132 90 120 Z" fill="#fff" ${ink}/>
    <path d="M90 120 Q130 132 170 120 Q240 250 250 340 Q130 372 10 340 Q20 250 90 120 Z" fill="#fff" ${ink}/><path d="M60 260 Q130 280 200 260 M40 310 Q130 334 220 310" fill="none" stroke="#E2DAD0" stroke-width="6"/><circle cx="130" cy="80" r="10" fill="${C.rose}"/>`),
  bucket: () => S("0 0 260 300", `${[60, 110, 160, 200].map((x, i) => `<g transform="rotate(${-20 + i * 14} ${x} 90)"><ellipse cx="${x}" cy="72" rx="36" ry="34" fill="#B8692E" ${ink} stroke-width="5"/></g>`).join("")}
    <path d="M30 100 H230 L205 290 H55 Z" fill="#fff" ${ink}/>${[0, 1, 2, 3].map((i) => `<path d="M${52 + i * 50} 100 H${76 + i * 50} L${73 + i * 46} 290 H${58 + i * 44} Z" fill="${C.red}"/>`).join("")}<path d="M30 100 H230 L205 290 H55 Z" fill="none" ${ink}/>`),
  butter: () => S("0 0 300 200", `<ellipse cx="150" cy="160" rx="140" ry="30" fill="#fff" ${ink}/><path d="M60 80 L200 60 L250 110 L110 140 Z" fill="#FFE07A" ${ink}/><path d="M110 140 V160 L250 130 V110" fill="#F2C94C" ${ink}/>`),
  drumstick: () => S("0 0 240 240", `<path d="M150 90 Q190 20 130 20 Q40 20 50 120 Q60 170 110 160 Q150 150 150 90 Z" fill="#D99A4E" ${ink}/><path d="M110 160 L170 210" ${ink} stroke-width="22"/><path d="M110 160 L170 210" stroke="#FFF3E0" stroke-width="12" stroke-linecap="round"/><circle cx="178" cy="206" r="16" fill="#FFF3E0" ${ink} stroke-width="5"/><circle cx="194" cy="196" r="14" fill="#FFF3E0" ${ink} stroke-width="5"/>`),
  window: () => S("0 0 300 260", `<rect x="10" y="10" width="280" height="240" rx="16" fill="#1F2A44" ${ink}/><path d="M150 10 V250 M10 130 H290" ${ink}/><circle cx="90" cy="160" r="30" fill="#F6D3B3" ${ink} stroke-width="4"/><circle cx="210" cy="160" r="30" fill="#E8B48E" ${ink} stroke-width="4"/><circle cx="80" cy="155" r="5" fill="${C.ink}"/><circle cx="100" cy="155" r="5" fill="${C.ink}"/><circle cx="200" cy="155" r="5" fill="${C.ink}"/><circle cx="220" cy="155" r="5" fill="${C.ink}"/>`),
  sun: () => S("0 0 220 220", `<circle cx="110" cy="110" r="60" fill="${C.mustard}" ${ink}/>${Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${r2(110 + 78 * Math.cos(a))}" y1="${r2(110 + 78 * Math.sin(a))}" x2="${r2(110 + 100 * Math.cos(a))}" y2="${r2(110 + 100 * Math.sin(a))}" ${ink} stroke-width="8"/>`; }).join("")}`),
  rain: () => S("0 0 320 260", `<path d="M60 130 Q10 130 20 90 Q20 50 70 50 Q90 10 150 20 Q200 0 240 40 Q300 40 300 90 Q310 130 260 130 Z" fill="#B9BEC9" ${ink}/>${[80, 140, 200, 250].map((x, i) => `<path d="M${x} ${160 + (i % 2) * 20} q-8 22 0 30 q8 -8 0 -30 Z" fill="${C.sky}" ${ink} stroke-width="4"/>`).join("")}`),
  confetti: (k) => S("0 0 40 24", `<rect x="2" y="2" width="36" height="20" rx="5" fill="${[C.coral, C.mustard, C.mint, C.sky, C.lilac, C.rose][k % 6]}" ${ink} stroke-width="3"/>`),
});

// ---------- story helpers ----------
const sfx = (type, time, gain = 1) => SFX.push({ type, t: r2(time), gain });
const cam = (sc, time, scale, x, y, d = 0.8) => tw(`tl.to("#${sc}-st", { scale: ${scale}, x: ${x}, y: ${y}, duration: ${d}, ease: "power2.inOut" }, ${r2(time)});`);
// social post card with a cast member, a prop, a caption and a like count
const postCard = (id, x, y, who, prop, txt, likes) => `
        <div id="${id}" class="pcard" style="left:${x}px;top:${y}px">
          <div class="pcHead"><div class="pcAv" style="background:${who.color}"></div>${who.name}</div>
          <div class="pcPic" style="background:${who.bg}">${sticker(`${id}-who`, 40, 26, 230, CAST[who.cast]())}${prop}</div>
          <div class="pcTxt">${txt}</div><div class="pcLike">♥ ${likes}</div>
        </div>`;
const confettiBurst = (id, n, x0, y0, time) => {
  let h = "";
  for (let k = 0; k < n; k++) {
    h += sticker(`${id}${k}`, x0, y0, 40, P.confetti(k));
    const dx = Math.round(Math.cos(k * 2.4) * (300 + (k * 53) % 400)), dy = Math.round(-200 - (k * 71) % 300);
    tw(`tl.fromTo("#${id}${k}", { x: 0, y: 0, opacity: 0, rotation: 0 }, { keyframes: [{ x: ${dx * 0.6}, y: ${dy}, opacity: 1, rotation: ${k * 47}, duration: 0.5, ease: "power2.out" }, { x: ${dx}, y: ${dy + 900}, rotation: ${k * 47 + 360}, duration: 2.2, ease: "power1.in" }] }, ${r2(time + (k % 5) * 0.03)});`);
  }
  return h;
};

// ============ SCENES ============
// 1 · hook: a 30-year-old tree isn't a failure, so why do you feel like one?
{
  const a = 0, b = t(3);
  scene(a, b, "#DDF0E4", `
        ${sticker("trA", 110, 200, 520, P.tree())}
        ${label("trL", 150, 110, "30-year-old tree", "#fff", 60)}
        ${sticker("stA", 640, 330, 460, P.stamp("FAILURE?", C.deepCoral), ";transform:rotate(-8deg)")}
        <div id="noA" class="xbar" style="left:690px;right:auto;width:420px;top:445px;transform:rotate(-8deg)"></div>
        ${mike("mA", 1480, 900, 600, "sad")}
        ${label("loA", 1180, 140, "losing at 30?", C.mustard, 68)}
        ${sticker("qA1", 1150, 330, 90, P.q())}${sticker("qA2", 1720, 300, 80, P.q())}
        ${label("rrA", 640, 760, "the real reason…", C.navy, 60, "#fff")}`);
  tw(`tl.fromTo("#trA", { scaleY: 0.2, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.7, ease: "back.out(1.6)" }, 0.1);`); sfx("pop", 0.1);
  pop("#trL", at(0, "30"), 0.3, -2); pop("#stA", at(0, "failure"), 1.8, -8); sfx("thud", at(0, "failure") + 0.15);
  tw(`tl.fromTo("#noA", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${r2(te(0) - 0.2)});`);
  enterMike("mA", t(1), 400); breathe("mA", t(1) + 0.6, b); pop("#loA", at(1, "losing"), 0.3, 3);
  pop("#qA1", at(1, "30"), 0.3, -10); pop("#qA2", at(1, "30") + 0.1, 0.3, 10);
  pose("mA", "surprised", t(2)); pop("#rrA", at(2, "real"), 0.3, -2); sfx("sparkle", at(2, "real"), 0.6);
}
// 2 · meet Mike: turning 30 tonight
{
  const a = t(3), b = t(5);
  scene(a, b, C.cream, `
        ${mike("mB", 620, 900, 680, "happy")}
        ${label("nmB", 470, 140, "this is Mike", C.mint, 70)}
        ${sticker("ckB", 1100, 380, 420, P.cake())}
        ${label("tnB", 1120, 230, "30 tonight!", C.coral, 70, "#fff")}`);
  enterMike("mB", a, -400); breathe("mB", a + 0.6, b); pop("#nmB", a + 0.3, 0.3, -3); hop("mB", at(3, "mike"));
  pop("#ckB", at(4, "30"), 0.3, 4); pop("#tnB", at(4, "tonight"), 0.3, -3); sfx("sparkle", at(4, "tonight"), 0.6);
}
// 3 · friends inside the restaurant… and Mike in the parking lot, scrolling
{
  const a = t(5), b = t(8);
  const sc = scene(a, b, C.navy, `
        ${sticker("mnC", 1700, 60, 140, P.moon())}
        <div class="lot" style="top:860px"></div>
        ${sticker("biC", 980, 230, 760, P.bistro())}
        ${sticker("f1C", 1080, 330, 150, CAST.friend(0))}${sticker("f2C", 1210, 340, 150, CAST.friend(1))}${sticker("f3C", 1340, 330, 150, CAST.friend(2))}
        ${sticker("ckC", 1150, 520, 160, P.cake())}
        ${mike("mC", 513, 800, 300, "sad")}
        ${sticker("caC", 40, 400, 1100, P.car())}
        <div id="glC" class="glow" style="left:470px;top:470px"></div>
        ${sticker("phC", 640, 600, 64, P.phone())}
        ${label("scC", 260, 220, "scrolling…", "#fff", 58)}`);
  pop("#biC", a, 0.8); pop("#f1C", at(5, "friends"), 0.4); pop("#f2C", at(5, "friends") + 0.12, 0.4); pop("#f3C", at(5, "friends") + 0.24, 0.4);
  pop("#ckC", at(5, "cake"), 0.4);
  [1, 2, 3].forEach((k) => wob(`#f${k}C`, at(5, "cake") + 0.3, b - at(5, "cake") - 0.3, 3, 0.8 + k * 0.1));
  slideIn("#caC", t(6) - 0.4, -900, 0); slideIn("#mC", t(6) - 0.4, -900, 0); sfx("whoosh", t(6) - 0.4, 0.8);
  cam(sc, t(6), 1.18, 320, -40, 0.9);
  pop("#phC", t(7), 0.3); fadeIn("#glC", t(7)); pop("#scC", at(7, "scrolling"), 0.3, -2);
  tw(`tl.fromTo("#phC", { y: 0 }, { y: -8, duration: 0.25, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }, ${r2(at(7, "scrolling") + 0.1)});`);
}
// 4 · the feed: house, engagement in Italy, "now a VP"
{
  const a = t(8), b = t(11);
  scene(a, b, "#E9E3F7", `
        ${postCard("p1D", 70, 110, { name: "college roommate", color: C.mint, bg: "#E6F5EC", cast: "roommate" }, sticker("hoD", 280, 120, 250, P.house()), "Just bought a house!", "2.4k")}
        ${postCard("p2D", 680, 110, { name: "girl from 1st job", color: C.rose, bg: "#FCE8EC", cast: "girl" }, sticker("piD", 410, 40, 130, P.pisa()) + sticker("riD", 250, 150, 150, P.ring()), "Engaged! Italy ♥", "5.1k")}
        ${postCard("p3D", 1290, 110, { name: "Mario Kart rival", color: C.sky, bg: "#E4F0F9", cast: "vp" }, label("vpD", 300, 140, "VP", C.mustard, 110), "Thrilled to announce…", "9.8k")}
        ${label("mkD", 1150, 830, "I used to beat him at Mario Kart", "#fff", 40)}`);
  [["p1D", t(8)], ["p2D", t(9)], ["p3D", t(10)]].forEach(([id, tt], k) => {
    tw(`tl.fromTo("#${id}", { y: 700, rotation: ${[-6, 4, -3][k]}, opacity: 0 }, { y: 0, rotation: ${[-2, 1.5, -1][k]}, opacity: 1, duration: 0.55, ease: "back.out(1.4)" }, ${r2(tt)});`);
    sfx("ding", tt + 0.15, 0.8);
  });
  pop("#hoD", at(8, "house"), 0.3, 3);
  pop("#riD", at(9, "engaged"), 0.3, -6); pop("#piD", at(9, "italy"), 0.3, 6);
  tw(`tl.to("#riD", { scale: 1.55, x: -40, y: -30, duration: 0.4, ease: "back.out(2)" }, ${r2(at(9, "golf"))});`); sfx("sparkle", at(9, "golf"));
  pop("#mkD", at(10, "mario"), 0.3, -2); pop("#vpD", at(10, "vp") - 0.1, 0.3, -6); sfx("sparkle", at(10, "vp"), 0.7);
}
// 5 · Mike's own life: decent job, small apartment, a plant (3 weeks!) → "I'm behind."
{
  const a = t(11), b = t(16);
  scene(a, b, C.cream, `
        ${mike("mE", 420, 920, 660, "happy")}
        ${sticker("bcE", 800, 170, 300, P.briefcase())}${label("bcL", 800, 430, "decent job", "#fff", 50)}
        ${sticker("apE", 1190, 110, 240, P.apartment())}${label("apL", 1110, 430, "small apartment", "#fff", 50)}
        ${sticker("plE", 1500, 150, 280, P.plant())}${label("plL", 1450, 500, "alive: 3 weeks!", C.mint, 50)}
        ${sticker("clE", 760, 600, 760, P.cloud("“I'm behind.”", 760))}`);
  enterMike("mE", a, -400); breathe("mE", a + 0.6, b);
  pop("#bcE", t(12), 0.3, -5); pop("#bcL", t(12) + 0.1, 0.3, -2);
  pop("#apE", t(13), 0.3, 4); pop("#apL", t(13) + 0.1, 0.3, 2);
  pop("#plE", t(14), 0.3, -4); pop("#plL", at(14, "three"), 0.3, -3); hop("mE", at(14, "three"), 40);
  pose("mE", "sad", t(15)); pop("#clE", at(15, "behind") - 0.2, 0.3); shake("#mE", at(15, "behind") + 0.3, 10);
  out("#bcE, #bcL, #apE, #apL", t(15), 0.3);
}
// 6 · 1954: Leon Festinger and social comparison
{
  const a = t(16), b = t(21);
  scene(a, b, "#E4F0F9", `
        ${label("ntF", 640, 70, "what nobody told Mike", C.navy, 64, "#fff")}
        ${sticker("boF", 520, 190, 680, P.board([["1954", 120, 170], ["social", 72, 260], ["comparison", 72, 335]]))}
        ${sticker("feF", 130, 330, 330, CAST.festinger())}
        ${label("feL", 70, 830, "Leon Festinger · psychologist", "#fff", 44)}
        ${sticker("baF", 1290, 300, 520, P.balance())}
        ${mike("mF", 1390, 470, 210, "surprised")}${sticker("otF", 1660, 270, 130, CAST.friend(2))}
        ${label("nmF", 1260, 670, "normal ✓", C.mint, 60)}${label("huF", 1530, 760, "human ✓", C.mustard, 60)}`);
  pop("#ntF", a + 0.05, 0.3, -2);
  out("#ntF", t(17) - 0.1); pop("#boF", at(17, "1954"), 0.4, -3); slideIn("#feF", at(17, "psychologist"), -300, 0); pop("#feL", at(17, "festinger"), 0.3, -2);
  sfx("chalk", at(17, "social"), 0.7);
  pop("#baF", t(18), 0.4); pop("#mF", t(18) + 0.2, 0.3); pop("#otF", t(18) + 0.3, 0.3);
  tw(`tl.fromTo("#baF #beam", { rotation: -8, transformOrigin: "50% 0%" }, { rotation: 8, duration: 0.6, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${r2(at(18, "comparing"))});`);
  pop("#nmF", t(19), 0.3, -3); sfx("ding", t(19), 0.5); pop("#huF", t(20), 0.3, 3); sfx("ding", t(20), 0.5);
}
// 7 · behind-the-scenes vs highlight reel; the posts nobody makes
{
  const a = t(21), b = t(27);
  scene(a, b, "#FDE9C9", `
        ${sticker("prG", 700, 60, 520, P.stamp("THE PROBLEM", C.deepCoral), ";transform:rotate(-4deg)")}
        ${mike("mG", 380, 880, 560, "sad")}
        ${sticker("clG", 80, 250, 200, P.clapper())}${label("bsL", 80, 780, "behind-the-scenes", "#fff", 50)}
        <div id="vsG" class="big" style="left:830px;top:420px;width:200px;font-size:110px">vs</div>
        ${sticker("fiG", 1080, 300, 760, P.film())}${label("hrL", 1250, 640, "highlight reel ★", C.mustard, 54)}
        <div id="npG" class="npost" style="left:760px;top:180px"><div class="npTxt">“Sat in my car and cried a little.”</div><div class="npLike">♥ 0</div><div class="npX"></div></div>
        <div id="nrG" class="npost" style="left:760px;top:520px"><div class="npTxt">“Still renting. Doing fine.”</div><div class="npLike">♥ 0</div><div class="npX"></div></div>
        ${label("nbG", 140, 120, "nobody posts this", C.navy, 54, "#fff")}`);
  pop("#prG", a + 0.05, 1.8, -4); sfx("thud", a + 0.15);
  out("#prG", t(22) - 0.1); enterMike("mG", t(22), -400); breathe("mG", t(22) + 0.6, b);
  pop("#clG", at(23, "behind"), 0.3, -6); pop("#bsL", at(23, "behind") + 0.1, 0.3, -2);
  tw(`tl.fromTo("#clG #clapTop", { rotation: -14, transformOrigin: "4% 90%" }, { rotation: 0, duration: 0.18, ease: "power3.in" }, ${r2(at(23, "behind") + 0.3)});`); sfx("clap", at(23, "behind") + 0.45, 0.7);
  pop("#vsG", at(23, "their"), 0.3); pop("#fiG", at(23, "highlight"), 0.4, 2); pop("#hrL", at(23, "highlight") + 0.2, 0.3, 2); sfx("sparkle", at(23, "highlight"), 0.6);
  out("#clG, #bsL, #vsG, #fiG, #hrL", t(24) - 0.1);
  pop("#nbG", t(24), 0.3, -3); pop("#npG", at(24, "sat"), 0.4, -2);
  tw(`tl.fromTo("#npG .npX", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${r2(te(24) - 0.3)});`);
  pop("#nrG", at(25, "still"), 0.4, 2);
  tw(`tl.fromTo("#nrG .npX", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${r2(te(26) - 0.2)});`);
}
// 8 · a rigged game
{
  const a = t(27), b = t(30);
  scene(a, b, "#2E3550", `
        <div id="sbH" class="score"><div><span class="sN">MIKE</span><span class="sV">0</span></div><div class="sDiv">:</div><div><span class="sN">EVERYONE ELSE</span><span id="svH" class="sV">99</span></div></div>
        ${mike("mH", 380, 960, 520, "sad")}
        ${label("nfH", 760, 640, "not failing", "#fff", 60)}
        ${sticker("rgH", 1080, 610, 560, P.stamp("RIGGED", C.red), ";transform:rotate(-9deg)")}`);
  pop("#sbH", a + 0.05, 0.5); sfx("buzz", at(27, "every"), 0.5);
  tw(`tl.fromTo("#svH", { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${r2(at(27, "every"))});`);
  enterMike("mH", a + 0.2, -300); breathe("mH", a + 0.8, b);
  pop("#nfH", t(28), 0.3, -2); pose("mH", "angry", t(29)); pop("#rgH", at(29, "rigged") - 0.1, 2, -9); sfx("thud", at(29, "rigged")); shake("#sbH", at(29, "rigged") + 0.05);
}
// 9 · reason #2: a deadline nobody wrote
{
  const a = t(30), b = t(34);
  scene(a, b, "#F7E1E1", `
        <div id="r2I" class="big" style="left:120px;top:110px;text-align:left;font-size:110px">Reason #2</div>
        ${mike("mI", 1500, 940, 620, "surprised")}
        ${sticker("caI", 220, 330, 330, P.calendar())}
        ${sticker("pgI", 700, 300, 330, P.blankPage())}
        ${label("whI", 640, 760, "who wrote this?", C.mustard, 60)}`);
  pop("#r2I", a + 0.05, 0.4, -3); enterMike("mI", t(31), 400); breathe("mI", t(31) + 0.6, b);
  pop("#caI", t(32), 0.3, -6); shake("#caI", t(32) + 0.4);
  pop("#pgI", at(33, "nobody"), 0.3, 4); pop("#whI", at(33, "wrote"), 0.3, -2); sfx("sparkle", at(33, "twist"), 0.5);
}
// 10 · house, spouse, corner office by 30: no law, no rulebook, just a made-up timeline
{
  const a = t(34), b = t(39);
  scene(a, b, "#FFF6EA", `
        <div id="clJ" class="check" style="left:120px;top:120px"><div class="ckT">by 30:</div>
          <div id="ck1" class="ckR"><span class="ckB"></span>the house</div><div id="ck2" class="ckR"><span class="ckB"></span>the spouse</div><div id="ck3" class="ckR"><span class="ckB"></span>the corner office</div></div>
        ${sticker("gaJ", 900, 140, 290, P.gavel())}${label("glJ", 900, 430, "no law", "#fff", 56)}
        <div id="gxJ" class="xbar" style="left:880px;right:auto;width:330px;top:290px"></div>
        ${sticker("rbJ", 1360, 100, 260, P.rulebook())}${label("rlJ", 1290, 430, "no rulebook", "#fff", 56)}
        <div id="rxJ" class="xbar" style="left:1340px;right:auto;width:300px;top:270px"></div>
        <div id="tlJ" class="tline" style="left:900px;top:700px;width:880px"></div>
        ${sticker("muJ", 1080, 600, 460, P.stamp("MADE UP", C.deepCoral), ";transform:rotate(-6deg)")}`);
  pop("#clJ", t(35) - 0.1, 0.5, -2);
  [["ck1", "house"], ["ck2", "spouse"], ["ck3", "corner"]].forEach(([id, w]) => { fadeIn(`#${id}`, at(35, w) - 0.1); sfx("tick", at(35, w), 0.6); });
  pop("#gaJ", t(36), 0.3, -8); pop("#glJ", t(36) + 0.1, 0.3, -2);
  tw(`tl.fromTo("#gxJ", { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power2.out" }, ${r2(te(36) - 0.2)});`);
  pop("#rbJ", t(37), 0.3, 6); pop("#rlJ", t(37) + 0.1, 0.3, 2);
  tw(`tl.fromTo("#rxJ", { scaleX: 0 }, { scaleX: 1, duration: 0.25, ease: "power2.out" }, ${r2(te(37) - 0.2)});`);
  tw(`tl.fromTo("#tlJ", { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: "power2.out" }, ${r2(at(38, "timeline"))});`);
  pop("#muJ", at(38, "made up") - 0.1, 1.8, -6); sfx("thud", at(38, "made up"));
}
// 11 · real life ignores the timeline: Julia Child at 49, Vera Wang at 40, Colonel Sanders in his 60s
{
  const a = t(39), b = t(44);
  const X = (age) => 140 + (age - 20) * 32;
  const ticks = Array.from({ length: 11 }, (_, i) => 20 + i * 5).map((g) => `<div class="tk" style="left:${X(g) - 140}px"><span>${g}</span></div>`).join("");
  scene(a, b, "#E6F5EC", `
        ${label("rlK", 120, 70, "real life", C.mint, 70)}
        ${label("igK", 520, 80, "ignores the timeline", "#fff", 56)}
        <div id="ruK" class="ruler" style="left:140px;top:770px;width:${X(70) - 140}px">${ticks}</div>
        <div id="yhK" class="pin" style="left:${X(30) - 6}px;top:600px"><div class="pinL">30</div></div>
        ${sticker("vwK", X(40) - 150, 300, 300, CAST.vera())}${sticker("drK", X(40) - 290, 470, 150, P.dress())}${label("vwL", X(40) - 230, 220, "Vera Wang · 40", "#fff", 42)}
        ${sticker("jcK", X(49) - 60, 300, 300, CAST.julia())}${sticker("cbK", X(49) + 200, 480, 130, P.cookbook())}${label("jcL", X(49) - 50, 220, "Julia Child · 49", "#fff", 42)}
        ${sticker("csK", X(64) - 150, 300, 300, CAST.colonel())}${sticker("bkK", X(64) + 110, 500, 150, P.bucket())}${label("csL", X(64) - 260, 140, "Colonel Sanders · 60s", "#fff", 42)}`);
  pop("#rlK", a + 0.05, 0.3, -3); pop("#igK", t(40), 0.3, 2);
  tw(`tl.fromTo("#ruK", { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: "power2.out" }, ${r2(a + 0.2)});`);
  pop("#yhK", at(40, "timeline"), 0.4);
  out("#igK", t(41) - 0.1);
  pop("#jcK", t(41), 0.3, -4); pop("#jcL", at(41, "published"), 0.3, -2); pop("#cbK", at(41, "cookbook"), 0.3, 8); sfx("ding", at(41, "49"), 0.6);
  pop("#vwK", t(42), 0.3, 4); pop("#vwL", at(42, "started"), 0.3, 2); pop("#drK", at(42, "wedding"), 0.3, -6); sfx("ding", at(42, "40"), 0.6);
  pop("#csK", t(43), 0.3, -4); pop("#csL", at(43, "started"), 0.3, -2); pop("#bkK", at(43, "chicken"), 0.3, 6); sfx("ding", at(43, "60s"), 0.6);
}
// 12 · less butter, fewer gowns, way less fried chicken: a tragedy
{
  const a = t(44), b = t(47);
  scene(a, b, "#F3E3C7", `
        ${label("qtL", 300, 80, "if they'd quit at 30…", C.navy, 60, "#fff")}
        ${sticker("q1L", 260, 300, 260, CAST.julia())}${sticker("q2L", 830, 300, 260, CAST.vera())}${sticker("q3L", 1400, 300, 260, CAST.colonel())}
        ${sticker("qsL", 760, 600, 420, P.stamp("QUIT?", C.deepCoral), ";transform:rotate(-5deg)")}
        ${sticker("buL", 160, 330, 340, P.butter())}${label("bL", 190, 600, "less butter", "#fff", 50)}
        ${sticker("drL", 820, 260, 230, P.dress())}${label("dL", 760, 660, "fewer gowns", "#fff", 50)}
        ${sticker("ckL", 1400, 300, 280, P.drumstick())}${label("cL", 1300, 600, "way less fried chicken", "#fff", 50)}
        ${sticker("raL", 700, 120, 360, P.rain())}
        ${mike("mL", 960, 940, 520, "sad")}
        ${sticker("tgL", 1260, 640, 520, P.stamp("TRAGEDY", C.deepCoral), ";transform:rotate(-6deg)")}`);
  pop("#qtL", a + 0.05, 0.3, -2);
  pop("#q1L", a + 0.2, 0.3, -4); pop("#q2L", a + 0.35, 0.3, 4); pop("#q3L", a + 0.5, 0.3, -3); pop("#qsL", at(44, "quit"), 1.8, -5); sfx("thud", at(44, "quit") + 0.1, 0.7);
  out("#q1L, #q2L, #q3L, #qsL", at(44, "butter") - 0.45);
  [["buL", "bL", "butter"], ["drL", "dL", "gowns"], ["ckL", "cL", "fried"]].forEach(([s, l, w], k) => {
    pop(`#${s}`, at(44, w) - 0.15, 0.3, [-4, 3, -3][k]); pop(`#${l}`, at(44, w), 0.3, [-2, 2, -1][k]);
    tw(`tl.to("#${s}", { scale: 0.62, opacity: 0.5, duration: 0.35, ease: "power2.in" }, ${r2(at(44, w) + 0.45)});`);
  });
  out("#qtL, #buL, #bL, #drL, #dL, #ckL, #cL", t(45) - 0.05);
  pop("#mL", t(45), 0.4); breathe("mL", t(45) + 0.4, b); pop("#raL", t(45) + 0.1, 0.4);
  pop("#tgL", t(46), 1.8, -6); sfx("sadhorn", t(46) - 0.05, 0.55);
}
// 13 · back in the parking lot: phone down, walk inside
{
  const a = t(47), b = t(50);
  scene(a, b, C.navy, `
        ${sticker("mnM", 1700, 60, 140, P.moon())}
        <div class="lot" style="top:860px"></div>
        ${sticker("biM", 1080, 230, 760, P.bistro())}
        ${mike("mM", 593, 800, 300, "sad")}
        ${sticker("caM", 120, 400, 1100, P.car())}
        ${sticker("phM", 720, 600, 64, P.phone())}
        ${label("pdM", 300, 220, "phone: down", C.mint, 58)}
        ${mike("mW", 900, 930, 440, "happy")}`);
  pop("#phM", a, 0.3);
  tw(`tl.to("#phM", { y: 260, rotation: 70, opacity: 0, duration: 0.5, ease: "power2.in" }, ${r2(at(48, "down") - 0.1)});`);
  pop("#pdM", at(48, "down"), 0.3, -3); pose("mM", "happy", at(48, "down") + 0.2);
  tw(`tl.set("#mM", { opacity: 0 }, ${r2(t(49))});`);
  tw(`tl.fromTo("#mW", { x: 0, opacity: 0 }, { x: 760, opacity: 1, duration: ${r2(te(49) - t(49) + 0.3)}, ease: "none" }, ${r2(t(49))});`);
  tw(`tl.fromTo("#mW-s", { y: 0 }, { y: -26, duration: 0.18, yoyo: true, repeat: 5, ease: "sine.inOut", immediateRender: false }, ${r2(t(49))});`);
  sfx("whoosh", t(49), 0.5);
}
// 14 · "Surprise!": laughs, too much cake, not behind anyone tonight
{
  const a = t(50), b = t(54);
  scene(a, b, "#FFE9A8", `
        <div id="spN" class="big" style="left:0;right:0;top:60px;font-size:150px;color:${C.coral}">SURPRISE!</div>
        ${sticker("f1N", 160, 320, 300, CAST.friend(0))}${sticker("f2N", 1440, 300, 300, CAST.friend(1))}${sticker("f3N", 1190, 400, 260, CAST.friend(2))}
        ${mike("mN", 760, 940, 600, "surprised")}
        ${sticker("wiN", 1500, 690, 230, P.window())}${label("tmN", 1380, 640, "saw them 10 min ago", "#fff", 40)}
        ${sticker("ckN", 380, 620, 300, P.cake())}
        ${label("nbN", 520, 240, "not behind anyone", C.mint, 72)}
        ${confettiBurst("cfN", 18, 940, 240, a + 0.05)}`);
  pop("#spN", a + 0.05, 0.3, -3); sfx("party", a + 0.05, 0.8);
  pop("#f1N", a + 0.1, 0.4, -6); pop("#f2N", a + 0.18, 0.4, 6); pop("#f3N", a + 0.26, 0.4, 4);
  [1, 2, 3].forEach((k) => tw(`tl.fromTo("#f${k}N", { y: 0 }, { y: -30, duration: 0.25, yoyo: true, repeat: 7, ease: "sine.inOut", immediateRender: false }, ${r2(a + 0.5 + k * 0.08)});`));
  enterMike("mN", a, 0); breathe("mN", a + 0.6, b);
  pop("#wiN", at(50, "window"), 0.3, 4); pop("#tmN", at(50, "ten"), 0.3, -2);
  out("#spN", t(51) - 0.1); pose("mN", "happy", t(51)); hop("mN", t(51) + 0.1, 60); sfx("boing", t(51) + 0.1, 0.5);
  out("#wiN, #tmN", t(52) - 0.1); pop("#ckN", t(52), 0.4, -3); tw(`tl.to("#ckN", { scale: 1.25, duration: 0.5, ease: "back.out(2)" }, ${r2(at(52, "cake"))});`);
  pose("mN", "love", t(53)); pop("#nbN", at(53, "behind"), 0.3, -2); sfx("sparkle", at(53, "behind"), 0.7);
}
// 15 · not late, just early in a longer story
{
  const a = t(54), b = t(56);
  scene(a, b, "#CDEBDD", `
        <div id="nlO" class="big" style="left:120px;top:170px;text-align:left;font-size:110px">You're not late.</div>
        <div id="jeO" class="big" style="left:120px;top:340px;text-align:left;font-size:110px;color:${C.deepTeal}">You're just early.</div>
        <div id="arO" class="tline long" style="left:140px;top:640px;width:1660px"></div>
        <div id="dtO" class="pin" style="left:300px;top:540px"><div class="pinL">30</div></div>
        ${mike("mO", 1560, 920, 560, "cool")}`);
  pop("#nlO", a + 0.05, 0.4, -2); enterMike("mO", a + 0.1, 400); breathe("mO", a + 0.6, b);
  pop("#jeO", t(55), 0.4, 2);
  tw(`tl.fromTo("#arO", { scaleX: 0 }, { scaleX: 1, duration: 1.0, ease: "power2.out" }, ${r2(at(55, "story"))});`); pop("#dtO", at(55, "story"), 0.4);
}
// 16 · the plant: died the next morning
{
  const a = t(56), b = t(59);
  scene(a, b, "#FFF1D6", `
        ${sticker("suP", 1520, 60, 220, P.sun())}
        <div class="sill" style="top:640px"></div>
        ${sticker("plP", 820, 300, 320, P.plant())}${sticker("pdP", 820, 300, 320, P.plantDead(), ";opacity:0")}
        ${label("ripP", 760, 120, "R.I.P. · 3 weeks", "#fff", 56)}
        ${mike("mP", 420, 940, 560, "surprised")}
        ${label("trP", 1100, 760, "some timelines are real", C.mustard, 60)}`);
  pop("#plP", a + 0.05, 0.4); enterMike("mP", a, -400); breathe("mP", a + 0.6, b); pop("#suP", t(57), 0.4);
  tw(`tl.to("#plP", { opacity: 0, duration: 0.4 }, ${r2(at(57, "died"))});`); tw(`tl.to("#pdP", { opacity: 1, duration: 0.4 }, ${r2(at(57, "died"))});`);
  sfx("sadhorn", at(57, "died"), 0.45); pop("#ripP", at(57, "morning"), 0.3, -3); pose("mP", "sad", at(57, "morning"));
  pop("#trP", t(58), 0.3, 2);
}
// 17 · the lesson + subscribe
{
  const a = t(59), b = DUR;
  scene(a, b, "#E9E3F7", `
        <div id="c3Q" class="chap" style="left:180px;top:150px"><div>your<br><b>Chapter 3</b></div></div>
        <div id="neQ" class="big" style="left:760px;top:250px;width:300px;font-size:160px;color:${C.red}">≠</div>
        <div id="c20Q" class="chap alt" style="left:1100px;top:150px"><div>their<br><b>Chapter 20</b></div></div>
        ${mike("mQ", 420, 960, 560, "happy")}
        ${sticker("sbQ", 820, 300, 640, P.subBtn())}
        <div id="mjQ" class="mojo" style="left:820px;top:560px">Mojo Mike Lessons</div>
        ${sticker("ckQ", 1560, 90, 240, P.clockFace())}${label("otQ", 1490, 370, "right on time ✓", C.mint, 46)}
        ${sticker("cuQ", 1290, 420, 110, P.cursor())}`);
  pop("#c3Q", at(59, "chapter 3") - 0.1, 0.3, -4); pop("#c20Q", at(59, "chapter 20") - 0.1, 0.3, 4); pop("#neQ", at(59, "someone"), 0.3);
  out("#c3Q, #c20Q, #neQ", t(60) - 0.1);
  enterMike("mQ", t(60), -400); breathe("mQ", t(60) + 0.6, b);
  pop("#sbQ", at(60, "subscribe") - 0.1, 0.3, -2); pop("#mjQ", at(60, "mojo") - 0.1, 0.3, 2);
  tw(`tl.fromTo("#cuQ", { x: 260, y: 220, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, ${r2(at(60, "subscribe"))});`);
  tw(`tl.fromTo("#sbQ", { scale: 1 }, { scale: 0.92, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, ${r2(at(60, "subscribe") + 0.55)});`); sfx("click", at(60, "subscribe") + 0.55);
  pop("#ckQ", t(61), 0.3, -4); pop("#otQ", at(61, "right"), 0.3, -2); pose("mQ", "cool", t(61)); sfx("ding", at(61, "time"), 0.6);
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
      .lot { position: absolute; left: 0; right: 0; bottom: 0; background: #2A3550; border-top: 6px solid #4A587A; }
      .glow { position: absolute; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(170,220,255,.55), rgba(170,220,255,0) 70%); }
      .pcard { position: absolute; width: 560px; height: 680px; background: #fff; border: 5px solid ${C.ink}; border-radius: 34px; box-shadow: 0 0 0 8px #fff, 0 16px 20px rgba(0,0,0,.2); transform-origin: 50% 100%; overflow: hidden; }
      .pcHead { position: absolute; left: 24px; top: 20px; display: flex; align-items: center; gap: 16px; font-size: 34px; }
      .pcAv { width: 54px; height: 54px; border-radius: 50%; border: 4px solid ${C.ink}; }
      .pcPic { position: absolute; left: 20px; right: 20px; top: 96px; height: 420px; border-radius: 22px; border: 4px solid ${C.ink}; overflow: visible; }
      .pcTxt { position: absolute; left: 26px; right: 20px; top: 534px; font-size: 40px; }
      .pcLike { position: absolute; left: 26px; top: 600px; font-size: 36px; color: ${C.red}; }
      .npost { position: absolute; width: 1000px; padding: 34px 44px 30px; background: #fff; border: 5px solid ${C.ink}; border-radius: 30px; box-shadow: 0 0 0 8px #fff, 0 14px 18px rgba(0,0,0,.2); transform-origin: 50% 50%; }
      .npTxt { font-size: 52px; line-height: 1.15; } .npLike { font-size: 36px; color: #8A8480; margin-top: 12px; }
      .npX { position: absolute; left: 30px; right: 30px; top: 46%; height: 16px; background: ${C.red}; border-radius: 10px; transform-origin: 0 50%; box-shadow: 0 0 0 6px #fff; }
      .score { position: absolute; left: 260px; top: 110px; width: 1400px; height: 300px; background: #111522; border: 8px solid ${C.mustard}; border-radius: 34px; box-shadow: 0 0 0 8px #fff, 0 16px 20px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: space-around; color: ${C.mustard}; transform-origin: 50% 50%; }
      .score > div:not(.sDiv) { display: flex; flex-direction: column; align-items: center; }
      .score .sN { font-size: 48px; color: #fff; } .score .sV { font-size: 150px; line-height: 1; display: inline-block; transform-origin: 50% 50%; } .score .sDiv { font-size: 140px; }
      .check { position: absolute; padding: 36px 50px 40px; background: #fff; border: 5px solid ${C.ink}; border-radius: 30px; box-shadow: 0 0 0 8px #fff, 0 14px 18px rgba(0,0,0,.2); transform-origin: 50% 50%; }
      .ckT { font-size: 70px; color: ${C.deepCoral}; margin-bottom: 12px; } .ckR { font-size: 58px; display: flex; align-items: center; gap: 24px; margin: 14px 0; }
      .ckB { width: 56px; height: 56px; border: 6px solid ${C.ink}; border-radius: 12px; display: inline-block; }
      .tline { position: absolute; height: 14px; background: ${C.ink}; border-radius: 8px; transform-origin: 0 50%; }
      .tline::after { content: ""; position: absolute; right: -30px; top: -20px; border-left: 40px solid ${C.ink}; border-top: 27px solid transparent; border-bottom: 27px solid transparent; }
      .ruler { position: absolute; height: 16px; background: ${C.ink}; border-radius: 8px; transform-origin: 0 50%; }
      .ruler .tk { position: absolute; top: -14px; width: 8px; height: 44px; margin-left: -4px; background: ${C.ink}; border-radius: 4px; }
      .ruler .tk span { position: absolute; top: 52px; left: 50%; transform: translateX(-50%); font-size: 40px; }
      .pin { position: absolute; width: 12px; height: 170px; background: ${C.red}; border-radius: 6px; transform-origin: 50% 100%; }
      .pinL { position: absolute; left: 50%; top: -70px; transform: translateX(-50%); padding: 4px 22px 8px; background: ${C.red}; color: #fff; border: 5px solid ${C.ink}; border-radius: 999px; font-size: 44px; box-shadow: 0 0 0 6px #fff; }
      .sill { position: absolute; left: 600px; width: 760px; height: 40px; background: #C48A5A; border: 6px solid ${C.ink}; border-radius: 12px; }
      .chap { position: absolute; width: 560px; height: 520px; background: ${C.deepTeal}; color: #fff; border: 6px solid ${C.ink}; border-radius: 26px 40px 40px 26px; box-shadow: 0 0 0 8px #fff, 0 16px 20px rgba(0,0,0,.2); display: flex; align-items: center; justify-content: center; text-align: center; font-size: 60px; font-weight: 500; line-height: 1.3; transform-origin: 50% 50%; }
      .chap b { font-size: 92px; } .chap.alt { background: #5E4FA2; }
      .capStage { position: absolute; left: 0; right: 0; top: 968px; height: 90px; display: flex; align-items: center; justify-content: center; }
      .cap { max-width: 1600px; padding: 8px 30px 12px; border-radius: 22px; background: rgba(43,35,33,.82); color: #fff; font-weight: 500; font-size: 40px; line-height: 1.25; text-align: center; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">${parts.join("")}
    </div>
    <audio id="mix" src="assets/audio/mix.mp3" data-start="0" data-duration="${DUR}" data-track-index="9" data-volume="1"></audio>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${T.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
writeFileSync(new URL("./assets/audio/sfx.json", import.meta.url), JSON.stringify(SFX.sort((p, q) => p.t - q.t)));
console.log(`index.html: ${sceneN} scenes, ${SEG.length} captions, ${T.length} tweens, ${SFX.length} sfx, ${DUR}s`);
