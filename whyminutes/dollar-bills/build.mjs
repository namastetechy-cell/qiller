// "Why every dollar bill is the same size": 9:16 kinetic-type Short in the style of the reference
// (input/reference.mp4): words blur in one by one as they're spoken, key words punch in red (green for
// "green"), cream paper scenes with a grid, barcode and grey arc alternate with black spotlight scenes
// where red words glow; 3D props (Fluent emoji, MIT) and illustrated bills. Narration: Kokoro am_michael,
// fast cut; word times from Whisper (align_words.py). SFX cues -> assets/audio/sfx.json, mixed by mix.py.
// usage: node build.mjs -> index.html
import { readFileSync, writeFileSync } from "node:fs";

const W = 1080, H = 1920;
const WORDS = JSON.parse(readFileSync(new URL("./assets/audio/words.json", import.meta.url), "utf8"));
const { duration: DUR } = JSON.parse(readFileSync(new URL("./assets/audio/segments.json", import.meta.url), "utf8"));
const r2 = (x) => +x.toFixed(2);
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
// index of the first word of a phrase (searching forward from `from`)
const idx = (phrase, from = 0) => {
  const p = phrase.split(" ").map(norm);
  for (let i = from; i <= WORDS.length - p.length; i++) if (p.every((w, k) => norm(WORDS[i + k].w) === w)) return i;
  throw new Error(`phrase not found: ${phrase}`);
};
const ws = (phrase) => WORDS[idx(phrase)].s;

const C = { cream: "#F7F3EE", ink: "#161616", grey: "#5E5E5E", red: "#E0192D", green: "#1F8F4E", black: "#050505", arc: "#C9C6C2" };

// ---------- builders ----------
const parts = [], T = [], SFX = [];
const tw = (s) => T.push(s);
const sfx = (type, t, gain = 1) => SFX.push({ type, t: r2(t), gain });
let sceneN = 0;
// a scene: cream (paper grid, barcode, grey arc, footer) or black (spotlight); slow push-in; quick dim before the cut
const scene = (from, to, dark, inner, { arc = false, grid = true } = {}) => {
  const id = `sc${sceneN++}`;
  const deco = dark ? `<div class="spot"></div>` : `${grid ? `<div class="grid"></div>` : ""}${arc ? `<div class="arc"></div>` : ""}
          <div class="barcode">${Array.from({ length: 30 }, (_, i) => `<i style="width:${[3, 6, 2, 4, 8][i % 5]}px"></i>`).join("")}</div>
          <div class="foot">◐ WHY MINUTES DAILY · VOL. 01</div>`;
  parts.push(`
      <div id="${id}" class="clip layer ${dark ? "dark" : "paper"}" data-start="${r2(from)}" data-duration="${r2(to - from)}" data-track-index="1">
        <div id="${id}-st" class="layer">${deco}${inner}</div><div id="${id}-dim" class="dim"></div>
      </div>`);
  tw(`tl.fromTo("#${id}-st", { scale: 1 }, { scale: 1.06, duration: ${r2(to - from)}, ease: "none" }, ${r2(from)});`);
  tw(`tl.fromTo("#${id}-dim", { opacity: 0 }, { opacity: ${dark ? 0.6 : 0.4}, duration: 0.14, ease: "power1.in", immediateRender: false }, ${r2(to - 0.14)});`);
  if (from > 0) sfx("swish", from - 0.06, 0.8);
  return id;
};

// kinetic text block. Each token is one spoken word; "*w" = red key word, "~w" = green key word,
// "w+2" = token stands for two spoken words (e.g. "$1" for "1 dollar"). Lines are laid out as given.
let cursor = 0;
const block = (id, lines, { x = 90, y = 600, w = 900, size = 78, align = "left", dark = false, start } = {}) => {
  if (start) cursor = idx(start, cursor);
  let html = "";
  lines.forEach((line, li) => {
    html += `<div class="ln" style="justify-content:${align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start"}">`;
    line.split(" ").forEach((tok, k) => {
      let n = 1, kind = "";
      const m = tok.match(/^(.*)\+(\d)$/); if (m) { tok = m[1]; n = +m[2]; }
      if (tok[0] === "*") { kind = "key"; tok = tok.slice(1); } else if (tok[0] === "~") { kind = "key gr"; tok = tok.slice(1); }
      const wid = `${id}-w${li}-${k}`, t0 = WORDS[cursor].s;
      cursor += n;
      html += `<span id="${wid}" class="wd ${kind}">${tok}</span>`;
      if (kind) {
        tw(`tl.fromTo("#${wid}", { opacity: 0, scale: 1.45, filter: "blur(16px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.32, ease: "power3.out" }, ${r2(t0 - 0.04)});`);
        sfx("tick", t0, 0.7);
      } else tw(`tl.fromTo("#${wid}", { opacity: 0, y: 16, filter: "blur(12px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.26, ease: "power2.out" }, ${r2(t0 - 0.05)});`);
    });
    html += `</div>`;
  });
  return `<div id="${id}" class="blk ${dark ? "onDark" : ""}" style="left:${x}px;top:${y}px;width:${w}px;font-size:${size}px;text-align:${align}">${html}</div>`;
};
const at = (phrase) => WORDS[idx(phrase, Math.max(0, cursor - 40))].s;

// props
const emoji = (id, name, x, y, w, extra = "") => `<img id="${id}" class="emo" src="assets/emoji/${name}_3d.png" style="left:${x}px;top:${y}px;width:${w}px${extra}">`;
const pop = (sel, t, from = 0.4, rot = 0, sound = true) => {
  tw(`tl.fromTo("${sel}", { opacity: 0, scale: ${from}, rotation: ${rot - 12} }, { opacity: 1, scale: 1, rotation: ${rot}, duration: 0.5, ease: "back.out(2)" }, ${r2(t)});`);
  if (sound) sfx("pop", t, 0.6);
};
const fade = (sel, t, d = 0.3) => tw(`tl.fromTo("${sel}", { opacity: 0, filter: "blur(14px)" }, { opacity: 1, filter: "blur(0px)", duration: ${d}, ease: "power2.out" }, ${r2(t)});`);
const out = (sel, t, d = 0.22) => tw(`tl.to("${sel}", { opacity: 0, filter: "blur(12px)", duration: ${d}, ease: "power2.in" }, ${r2(t)});`);
const floaty = (sel, t, dur, amt = 14) => tw(`tl.fromTo("${sel}", { y: 0 }, { y: ${-amt}, duration: 1.1, yoyo: true, repeat: ${Math.max(1, Math.floor(dur / 1.1) - 1)}, ease: "sine.inOut", immediateRender: false }, ${r2(t)});`);

// an illustrated banknote (not a reproduction: simplified layout, no real-note text or seals)
const bill = (val, side = "front", wpx = 700) => {
  const front = side === "front";
  const word = { 1: "ONE", 100: "ONE HUNDRED", 20: "TWENTY", 5: "FIVE" }[val] || "";
  const body = front ? `
      <rect x="6" y="6" width="988" height="413" rx="14" fill="#E3E8DA" stroke="#6E7F67" stroke-width="6"/>
      <rect x="34" y="34" width="932" height="357" rx="8" fill="none" stroke="#8FA087" stroke-width="10" stroke-dasharray="2 6"/>
      <ellipse cx="500" cy="212" rx="128" ry="150" fill="#D2DAC6" stroke="#5F7058" stroke-width="8"/>
      <path d="M430 330 Q440 250 500 245 Q560 250 570 330 Z M500 160 m-46 0 a46 52 0 1 0 92 0 a46 52 0 1 0 -92 0" fill="#7D8C74"/>
      ${[[90, 100], [910, 100], [90, 360], [910, 360]].map(([x, y]) => `<text data-layout-allow-overlap x="${x}" y="${y}" text-anchor="middle" font-family="Inter Tight" font-weight="800" font-size="${val >= 100 ? 64 : 84}" fill="#4E5E48">${val}</text>`).join("")}
      <text data-layout-allow-overlap x="500" y="404" text-anchor="middle" font-family="Inter Tight" font-weight="800" font-size="34" letter-spacing="6" fill="#4E5E48">${word}</text>
      <circle cx="790" cy="212" r="56" fill="none" stroke="#2F6F48" stroke-width="8"/><circle cx="210" cy="212" r="56" fill="none" stroke="#5F7058" stroke-width="8"/>` : `
      <rect x="6" y="6" width="988" height="413" rx="14" fill="#2E7D4F" stroke="#1C4F32" stroke-width="6"/>
      <rect x="34" y="34" width="932" height="357" rx="8" fill="none" stroke="#7FC59A" stroke-width="10" stroke-dasharray="2 6"/>
      <ellipse cx="500" cy="212" rx="170" ry="130" fill="#3F9663" stroke="#BFE6CC" stroke-width="8"/>
      <text data-layout-allow-overlap x="500" y="250" text-anchor="middle" font-family="Inter Tight" font-weight="800" font-size="120" fill="#E3F4E8">${val}</text>
      ${[[90, 100], [910, 100], [90, 360], [910, 360]].map(([x, y]) => `<text data-layout-allow-overlap x="${x}" y="${y}" text-anchor="middle" font-family="Inter Tight" font-weight="800" font-size="${val >= 100 ? 64 : 84}" fill="#BFE6CC">${val}</text>`).join("")}`;
  return `<svg viewBox="0 0 1000 425" style="width:${wpx}px;display:block">${body}</svg>`;
};
const billEl = (id, val, side, x, y, wpx, extra = "") => `<div id="${id}" class="bill" data-layout-allow-overlap style="left:${x}px;top:${y}px;width:${wpx}px${extra}">${bill(val, side, wpx)}</div>`;

// ---------- scenes ----------
const B = (p) => ws(p) - 0.12;
const cuts = ["You've never", "But why does", "Let's start", "In 1861", "and printed paper", "People called", "Why green", "Cameras back", "The ink was",
  "Then the size", "In 1929", "and gave every", "And they kept", "So your wallet", "Cheaper to print", "Subscribe to"].map((p, i) => (i ? B(p) : 0));
cuts.push(DUR);
const span = (k) => [cuts[k], cuts[k + 1]];

// 1 · a $1 and a $100 are the exact same size
{
  const [a, b] = span(0);
  scene(a, b, false, `
        ${billEl("b1A", 1, "front", 120, 1080, 820, ";transform:rotate(-8deg)")}
        ${billEl("b2A", 100, "front", 160, 1180, 820, ";transform:rotate(5deg)")}
        ${block("tA", ["You've never noticed", "that a *$1+2 bill", "and a *$100", "are the *exact *same *size."], { y: 330, size: 92 })}
        <div id="rlA" class="ruler"></div>`, { arc: true });
  tw(`tl.fromTo("#b1A", { x: -900, rotation: -20 }, { x: 0, rotation: -8, duration: 0.6, ease: "power3.out" }, ${r2(at("1 dollar") - 0.1)});`); sfx("swish", at("1 dollar") - 0.1, 0.5);
  tw(`tl.fromTo("#b2A", { x: 900, rotation: 20 }, { x: 0, rotation: 5, duration: 0.6, ease: "power3.out" }, ${r2(at("100") - 0.1)});`); sfx("swish", at("100") - 0.1, 0.5);
  // they line up perfectly
  tw(`tl.to("#b1A", { x: 20, y: 60, rotation: 0, duration: 0.45, ease: "power2.inOut" }, ${r2(at("exact"))});`);
  tw(`tl.to("#b2A", { x: -20, y: -40, rotation: 0, duration: 0.45, ease: "power2.inOut" }, ${r2(at("exact"))});`);
  tw(`tl.fromTo("#rlA", { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.4, ease: "power2.out" }, ${r2(at("size") - 0.1)});`);
}
// 2 · but why does every bill look the same?  (black, spotlight, glowing circle like the reference)
{
  const [a, b] = span(1);
  scene(a, b, true, `
        <div id="orbB" class="orb"></div>
        ${block("tB", ["But why does", "every bill", "*look *the *same?"], { start: "But why", x: 240, y: 560, w: 600, size: 68, align: "center" })}
        ${emoji("emB", "face_with_raised_eyebrow", 330, 1150, 420)}`);
  pop("#orbB", a, 0.6, 0, false); pop("#emB", at("look"), 0.4, -6); floaty("#emB", at("look") + 0.5, b - at("look"), 10);
}
// 3 · let's start with the green  (green blob fills from the centre, like the reference's circle)
{
  const [a, b] = span(2);
  scene(a, b, false, `
        <div id="gcC" class="gcirc"></div>
        ${block("tC", ["Let's start", "with the ~green."], { start: "Let's start", y: 760, size: 110, align: "center" })}
        ${emoji("emC", "artist_palette", 640, 1240, 300)}`);
  tw(`tl.fromTo("#gcC", { scale: 0 }, { scale: 1, duration: 0.5, ease: "power3.out" }, ${r2(at("green") + 0.05)});`); sfx("whoomp", at("green"), 0.7);
  pop("#emC", a + 0.2, 0.4, 8);
}
// 4 · 1861: the Union needed cash for the Civil War
{
  const [a, b] = span(3);
  scene(a, b, true, `
        ${block("tD1", ["In *1861,"], { start: "In 1861", y: 300, size: 170, align: "center", dark: true })}
        ${block("tD2", ["the Union", "needed *cash", "for the *Civil *War"], { start: "the Union", y: 700, size: 84, align: "center", dark: true })}
        ${emoji("emD1", "crossed_swords", 170, 1230, 330)}${emoji("emD2", "military_helmet", 590, 1250, 330)}
        ${emoji("emD3", "money_bag", 430, 990, 220)}`);
  pop("#emD3", at("cash"), 0.4, 10); pop("#emD1", at("Civil"), 0.4, -8); pop("#emD2", at("War"), 0.4, 6);
  floaty("#emD1, #emD2", at("War") + 0.4, b - at("War"), 8);
}
// 4b · printed paper notes with green ink on the back  (a note flips to its green back)
{
  const [a, b] = span(4);
  scene(a, b, false, `
        ${emoji("emE", "printer", 120, 1180, 380)}
        <div id="flE" class="flip" data-layout-allow-overlap style="left:200px;top:820px;width:700px">
          <div id="flE-f" class="face">${bill(5, "front", 700)}</div><div id="flE-b" class="face back">${bill(5, "back", 700)}</div>
        </div>
        ${block("tE", ["and printed", "paper *notes", "with ~green ~ink", "on the *back."], { start: "and printed", y: 260, size: 88 })}`, { arc: true });
  pop("#emE", a + 0.05, 0.5, -4);
  tw(`tl.fromTo("#flE", { y: 300, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, ${r2(at("notes") - 0.1)});`); sfx("swish", at("notes") - 0.1, 0.5);
  tw(`tl.to("#flE-f", { rotationY: -180, duration: 0.5, ease: "power2.inOut" }, ${r2(at("back") - 0.2)});`);
  tw(`tl.fromTo("#flE-b", { rotationY: 180 }, { rotationY: 0, duration: 0.5, ease: "power2.inOut" }, ${r2(at("back") - 0.2)});`); sfx("flip", at("back") - 0.15, 0.6);
}
// 5 · people called them greenbacks  (pinned note card, like the reference's "Value" card)
{
  const [a, b] = span(5);
  scene(a, b, false, `
        <div id="cdF" class="note" data-layout-allow-overlap><div class="pin"></div><div class="nT">Greenbacks</div><div class="nL">nickname · 1860s</div></div>
        ${billEl("bF", 5, "back", 250, 1260, 580, ";transform:rotate(-6deg)")}
        ${block("tF", ["People called", "them"], { start: "People called", y: 300, size: 80, align: "center" })}`, { arc: true });
  tw(`tl.fromTo("#cdF", { y: -600, rotation: -10 }, { y: 0, rotation: -3, duration: 0.55, ease: "back.out(1.4)" }, ${r2(at("greenbacks") - 0.15)});`); sfx("thud", at("greenbacks"), 0.6);
  pop("#bF", at("greenbacks") + 0.2, 0.5, -6);
}
// 6 · why green?
{
  const [a, b] = span(6);
  scene(a, b, true, `
        ${block("tG", ["Why", "~green?"], { start: "Why green", y: 620, size: 190, align: "center", dark: true })}
        ${emoji("emG", "thinking_face", 340, 1180, 400)}`);
  pop("#emG", a + 0.1, 0.4, -6);
}
// 7 · cameras only shot black and white, so a green back was harder to copy
{
  const [a, b] = span(7);
  scene(a, b, false, `
        ${emoji("emH", "camera_with_flash", -80, 1120, 640, ";filter:grayscale(1) contrast(1.1)")}
        <div id="flH" class="flash"></div>
        ${block("tH1", ["Cameras back then", "only shot in", "*black *and *white,"], { start: "Cameras back", y: 250, size: 82 })}
        ${block("tH2", ["so a ~green ~back", "was *harder", "*to *copy."], { start: "so a green", y: 250, size: 92 })}
        ${billEl("bH", 5, "back", 520, 1180, 500, ";transform:rotate(8deg)")}
        ${billEl("bH2", 5, "back", 540, 1420, 500, ";transform:rotate(-4deg);filter:grayscale(1) blur(2px) contrast(.6);opacity:.85")}
        ${emoji("xH", "cross_mark", 860, 1460, 150)}`, { grid: true });
  pop("#emH", a + 0.05, 0.6, 4);
  tw(`tl.fromTo("#flH", { opacity: 0 }, { keyframes: [{ opacity: 0.95, duration: 0.05 }, { opacity: 0, duration: 0.35 }] }, ${r2(at("shot"))});`); sfx("shutter", at("shot"), 0.8);
  out("#tH1", at("so a") - 0.2); fade("#tH2", at("so a") - 0.15, 0.01);
  pop("#bH", at("green back"), 0.5, 8); pop("#bH2", at("copy") - 0.25, 0.6, -4, false); pop("#xH", at("copy"), 0.3, 0);
}
// 8 · the ink: plentiful and tough, holding up against wear and chemicals  (pinned list card)
{
  const [a, b] = span(8);
  scene(a, b, false, `
        <div id="cdI" class="note tall"><div class="pin"></div><div class="nT">Green ink</div>
          <div id="li1" class="li"><img src="assets/emoji/check_mark_button_3d.png">plentiful</div>
          <div id="li2" class="li"><img src="assets/emoji/shield_3d.png">tough</div>
          <div id="li3" class="li"><img src="assets/emoji/hourglass_not_done_3d.png">survives wear</div>
          <div id="li4" class="li"><img src="assets/emoji/test_tube_3d.png">resists chemicals</div></div>
        ${block("tI", ["The ink was also", "*plentiful and *tough,"], { start: "The ink", y: 240, size: 78 })}`, { arc: true });
  tw(`tl.fromTo("#cdI", { y: 900, rotation: 8 }, { y: 0, rotation: -2, duration: 0.55, ease: "back.out(1.3)" }, ${r2(a + 0.15)});`);
  [["li1", "plentiful"], ["li2", "tough"], ["li3", "wear"], ["li4", "chemicals"]].forEach(([id, w]) => { fade(`#${id}`, at(w) - 0.05); sfx("pop", at(w), 0.5); });
}
// 9 · then the size: bills used to be bigger
{
  const [a, b] = span(9);
  scene(a, b, true, `
        ${block("tJ", ["Then the *size.", "Bills used", "to be *bigger."], { start: "Then the size", y: 300, size: 100, align: "center", dark: true })}
        ${billEl("bJ", 1, "front", 40, 1050, 1000, ";transform:rotate(-4deg)")}
        <div id="lbJ" class="tag">pre-1929 · ~30% bigger</div>`);
  tw(`tl.fromTo("#bJ", { scale: 0.62, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(1.5)" }, ${r2(at("bigger") - 0.1)});`); sfx("whoomp", at("bigger"), 0.6);
  fade("#lbJ", at("bigger") + 0.35);
}
// 10 · 1929: the government shrank them to cut printing costs
{
  const [a, b] = span(10);
  scene(a, b, false, `
        ${block("tK", ["In *1929,", "the government", "*shrank them", "to cut printing *costs,"], { start: "In 1929", y: 230, size: 86 })}
        ${emoji("emK1", "classical_building", 700, 520, 280)}
        ${billEl("bK", 1, "front", 90, 1060, 900, ";transform-origin:50% 50%")}
        ${emoji("emK2", "scissors", 720, 980, 260)}${emoji("emK3", "coin", 140, 1500, 200)}${emoji("emK4", "money_bag", 330, 1460, 240)}`, { arc: true });
  pop("#emK1", at("government"), 0.4, 6); fade("#bK", a + 0.3);
  pop("#emK2", at("shrank") - 0.15, 0.4, -20);
  tw(`tl.fromTo("#emK2", { x: 0 }, { x: -620, duration: 0.5, ease: "power2.inOut", immediateRender: false }, ${r2(at("shrank") + 0.15)});`); sfx("snip", at("shrank") + 0.2, 0.8);
  tw(`tl.to("#bK", { scale: 0.74, duration: 0.5, ease: "back.out(1.6)" }, ${r2(at("shrank") + 0.45)});`);
  out("#emK2", at("shrank") + 0.7); pop("#emK3", at("costs"), 0.4, -8); pop("#emK4", at("costs") + 0.12, 0.4, 6);
}
// 10b · same size and a uniform design  (identical notes line up)
{
  const [a, b] = span(11);
  scene(a, b, false, `
        ${block("tL", ["and gave every bill", "the *same *size", "and a *uniform *design."], { start: "and gave", y: 250, size: 84 })}
        ${[1, 5, 20, 100].map((v, i) => billEl(`bL${i}`, v, "front", 190, 820 + i * 210, 700)).join("")}
        <div id="brL" class="bracket"></div>`, { arc: true });
  [0, 1, 2, 3].forEach((i) => { tw(`tl.fromTo("#bL${i}", { x: ${i % 2 ? 900 : -900}, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, ${r2(at("every bill") + i * 0.18)});`); sfx("swish", at("every bill") + i * 0.18, 0.35); });
  tw(`tl.fromTo("#brL", { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.4, ease: "power2.out" }, ${r2(at("same size"))});`);
}
// 11 · and they kept the classic green
{
  const [a, b] = span(12);
  scene(a, b, true, `
        ${block("tM", ["And they kept", "the ~classic ~green."], { start: "And they kept", y: 480, size: 104, align: "center", dark: true })}
        ${billEl("bM", 100, "back", 140, 1020, 800, ";transform:rotate(-5deg)")}`);
  tw(`tl.fromTo("#bM", { y: 200, opacity: 0, rotation: 6 }, { y: 0, opacity: 1, rotation: -5, duration: 0.6, ease: "power3.out" }, ${r2(at("classic"))});`); sfx("sparkle", at("green.") , 0.6);
  floaty("#bM", at("classic") + 0.6, b - at("classic"), 10);
}
// 12 · your wallet is a stack of twins, on purpose
{
  const [a, b] = span(13);
  scene(a, b, false, `
        ${block("tN", ["So your wallet", "looks like a", "stack of *twins", "on *purpose."], { start: "So your", y: 240, size: 92 })}
        ${[0, 1, 2, 3, 4].map((i) => billEl(`bN${i}`, [1, 100, 20, 5, 1][i], "front", 260, 1160 - i * 26, 640, `;transform:rotate(${-12 + i * 6}deg)`)).join("")}
        ${emoji("emN1", "purse", 70, 1380, 300)}${emoji("emN2", "smiling_face_with_sunglasses", 760, 1360, 240)}`, { arc: true });
  pop("#emN1", at("wallet"), 0.4, -6);
  [0, 1, 2, 3, 4].forEach((i) => tw(`tl.fromTo("#bN${i}", { y: 400, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "back.out(1.4)" }, ${r2(at("stack") + i * 0.07)});`));
  sfx("riffle", at("stack"), 0.6); pop("#emN2", at("purpose"), 0.4, 8);
}
// 13 · cheaper to print, harder to fake
{
  const [a, b] = span(14);
  scene(a, b, true, `
        ${block("tO", ["*Cheaper to print,", "*harder to fake."], { start: "Cheaper to", x: 20, w: 1040, y: 640, size: 92, align: "center", dark: true })}
        ${emoji("emO1", "coin", 170, 1100, 280)}${emoji("emO2", "locked", 620, 1100, 290)}`);
  pop("#emO1", at("Cheaper"), 0.4, -8); pop("#emO2", at("harder"), 0.4, 8);
}
// 14 · subscribe to Why Minutes Daily: costs less than a $1 bill
{
  const [a, b] = span(15);
  scene(a, b, true, `
        ${block("tP1", ["Subscribe to", "*Why *Minutes *Daily."], { start: "Subscribe to", y: 420, size: 96, align: "center", dark: true })}
        <div id="sbP" class="sub">SUBSCRIBE</div>
        ${block("tP2", ["It costs less", "than a *$1+2 bill."], { start: "It costs", y: 1240, size: 76, align: "center", dark: true })}
        ${emoji("emP", "smiling_face_with_sunglasses", 400, 1520, 280)}
        <img id="cuP" class="emo" src="assets/emoji/check_mark_button_3d.png" style="left:770px;top:840px;width:120px">`);
  pop("#sbP", at("Subscribe") + 0.1, 0.5, -2);
  tw(`tl.fromTo("#sbP", { scale: 1 }, { scale: 0.9, duration: 0.09, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, ${r2(at("Daily") + 0.1)});`); sfx("click", at("Daily") + 0.1, 0.9);
  pop("#cuP", at("Daily") + 0.2, 0.3, 0); pop("#emP", at("dollar bill") + 0.2, 0.4, 6);
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Inter Tight"; font-weight: 500; src: url("assets/fonts/inter-tight-500.woff2") format("woff2"); }
      @font-face { font-family: "Inter Tight"; font-weight: 700; src: url("assets/fonts/inter-tight-700.woff2") format("woff2"); }
      @font-face { font-family: "Inter Tight"; font-weight: 800; src: url("assets/fonts/inter-tight-800.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.black}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${C.black}; font-family: "Inter Tight", sans-serif; }
      .layer { position: absolute; inset: 0; width: 100%; height: 100%; }
      .paper { background: ${C.cream}; } .dark { background: ${C.black}; }
      .dim { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; }
      .grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,0,0,.045) 2px, transparent 2px), linear-gradient(90deg, rgba(0,0,0,.045) 2px, transparent 2px); background-size: 120px 120px; }
      .arc { position: absolute; left: -520px; top: 260px; width: 1500px; height: 1500px; border-radius: 50%; border: 90px solid ${C.arc}; opacity: .55; }
      .spot { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 45% at 50% 45%, rgba(255,255,255,.14), rgba(255,255,255,0) 70%); }
      .barcode { position: absolute; right: 90px; top: 110px; height: 70px; display: flex; gap: 4px; } .barcode i { display: block; height: 100%; background: ${C.ink}; }
      .foot { position: absolute; left: 0; right: 0; bottom: 120px; text-align: center; font-size: 26px; font-weight: 700; letter-spacing: .3em; color: #8C8984; }
      .blk { position: absolute; color: ${C.ink}; line-height: 1.02; letter-spacing: -0.045em; font-weight: 500; }
      .blk .ln { display: flex; flex-wrap: wrap; column-gap: .24em; }
      .blk .wd { display: inline-block; transform-origin: 50% 70%; }
      .blk .key { color: ${C.red}; font-weight: 800; font-size: 1.32em; letter-spacing: -0.055em; }
      .blk .key.gr { color: ${C.green}; }
      .onDark { color: #EDEDED; }
      .onDark .key { color: #FF2A3D; text-shadow: 0 0 22px rgba(255,20,40,.85), 0 0 60px rgba(255,20,40,.5); }
      .onDark .key.gr { color: #3BE07F; text-shadow: 0 0 22px rgba(40,220,120,.8), 0 0 60px rgba(40,220,120,.45); }
      .emo { position: absolute; filter: drop-shadow(0 30px 30px rgba(0,0,0,.35)); transform-origin: 50% 60%; }
      .dark .emo { filter: drop-shadow(0 0 40px rgba(255,255,255,.25)) drop-shadow(0 30px 30px rgba(0,0,0,.6)); }
      .bill { position: absolute; filter: drop-shadow(0 26px 26px rgba(0,0,0,.28)); transform-origin: 50% 50%; }
      .dark .bill { filter: drop-shadow(0 0 50px rgba(60,220,130,.25)) drop-shadow(0 26px 30px rgba(0,0,0,.7)); }
      .ruler { position: absolute; left: 140px; top: 1700px; width: 800px; height: 6px; background: ${C.red}; transform-origin: 50% 50%; }
      .ruler::before, .ruler::after { content: ""; position: absolute; top: -22px; width: 6px; height: 50px; background: ${C.red}; } .ruler::before { left: 0; } .ruler::after { right: 0; }
      .orb { position: absolute; left: 190px; top: 400px; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle at 50% 40%, #fff, #E9E9E9 70%); box-shadow: 0 0 120px rgba(255,255,255,.35); }
      .gcirc { position: absolute; left: 140px; top: 560px; width: 800px; height: 800px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #DDF3E5, #BFE6CC); transform-origin: 50% 50%; }
      .flip { position: absolute; height: 298px; perspective: 1600px; }
      .flip .face { position: absolute; inset: 0; backface-visibility: hidden; filter: drop-shadow(0 26px 26px rgba(0,0,0,.28)); }
      .note { position: absolute; left: 230px; top: 700px; width: 620px; padding: 70px 50px 60px; background: #8D8B88; color: #fff; box-shadow: 0 40px 50px rgba(0,0,0,.3); transform-origin: 50% 0%; }
      .note.tall { top: 640px; }
      .note .pin { position: absolute; left: 50%; top: -26px; width: 52px; height: 52px; margin-left: -26px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #FF6B6B, #C40F1F 70%); box-shadow: 0 8px 10px rgba(0,0,0,.35); }
      .note .nT { font-size: 104px; font-weight: 700; letter-spacing: -0.05em; border-bottom: 5px solid rgba(255,255,255,.75); padding-bottom: 18px; margin-bottom: 26px; }
      .note .nL { font-size: 44px; font-weight: 500; opacity: .9; }
      .note .li { display: flex; align-items: center; gap: 22px; font-size: 54px; font-weight: 500; letter-spacing: -0.03em; margin: 18px 0; }
      .note .li img { width: 74px; }
      .flash { position: absolute; inset: 0; background: #fff; opacity: 0; }
      .tag { position: absolute; left: 0; right: 0; top: 1580px; text-align: center; font-size: 46px; font-weight: 700; color: #BDBDBD; letter-spacing: -0.02em; }
      .bracket { position: absolute; left: 930px; top: 830px; width: 40px; height: 790px; border: 8px solid ${C.red}; border-left: 0; transform-origin: 50% 0%; }
      .sub { position: absolute; left: 240px; top: 820px; width: 600px; padding: 34px 0 40px; border-radius: 999px; background: ${C.red}; color: #fff; text-align: center; font-size: 74px; font-weight: 800; letter-spacing: -0.03em; box-shadow: 0 0 60px rgba(255,20,40,.6); transform-origin: 50% 50%; }
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
console.log(`index.html: ${sceneN} scenes, ${T.length} tweens, ${SFX.length} sfx, ${DUR}s`);
