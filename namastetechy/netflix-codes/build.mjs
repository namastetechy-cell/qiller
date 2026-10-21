// "Netflix secret codes" Short, Bold Poster frame preset, 9:16, no narration:
// paced for a voiceover recorded on top (see CUES.md), quiet SFX only.
// usage: node build.mjs   -> index.html + CUES.md
import { writeFileSync } from "node:fs";

const W = 1080, H = 1920;
const C = { bg: "#FFFFFF", dark: "#1C1410", red: "#D8000F", light: "#F5F2EF" };
const STACK = "0.03em 0.03em 0 rgba(28,20,16,.25), 0.06em 0.06em 0 rgba(28,20,16,.2), 0.09em 0.09em 0 rgba(28,20,16,.15)";
const LINK = "netflix.com/browse/genre/";

// Script lines, paced at ~2.7 words/sec. caption:false where the poster type already says it.
const LINES = [
  { id: "hook", at: 0.0, end: 3.2, text: "Netflix pe scroll karke raat barbaad mat karo." },
  { id: "one", at: 3.2, end: 7.4, text: "Aap bas ek secret code door ho apni favourite movie se." },
  { id: "last", at: 7.4, end: 10.4, text: "Aur last wala code to sabka favourite hai." },
  { id: "browser", at: 10.4, end: 15.0, text: "Browser kholo, likho netflix dot com slash browse slash genre slash" },
  { id: "slot", at: 15.0, end: 17.0, text: "aur aage ye secret code." },
  { id: "c1", at: 17.0, end: 20.2, text: "One three six five: Action.", caption: false },
  { id: "c2", at: 20.2, end: 23.4, text: "Eight seven one one: Horror.", caption: false },
  { id: "c3", at: 23.4, end: 26.6, text: "Triple eight three: Romantic.", caption: false },
  { id: "c4", at: 26.6, end: 29.8, text: "Seven four two four: Anime.", caption: false },
  { id: "c5", at: 29.8, end: 34.0, text: "Aur six seven eight seven nine: Korean.", caption: false },
  { id: "tv", at: 34.0, end: 37.6, text: "Ye trick browser me chalti hai, TV app me nahi." },
  { id: "desc", at: 37.6, end: 39.6, text: "Saare codes description me hai." },
  { id: "cta", at: 39.6, end: 45.0, text: "Aapka favourite genre kaunsa hai? Comment karo aur subscribe karo Namaste Techy ko." },
];
const DURATION = 45.0;
const L = Object.fromEntries(LINES.map((l) => [l.id, l]));

// Codes: digit groups appear as they are spoken ("triple eight" lands as one group).
const CODES = [
  { id: "c1", code: "1365", genre: "Action", groups: ["1", "3", "6", "5"] },
  { id: "c2", code: "8711", genre: "Horror", groups: ["8", "7", "1", "1"] },
  { id: "c3", code: "8883", genre: "Romantic", groups: ["888", "3"] },
  { id: "c4", code: "7424", genre: "Anime", groups: ["7", "4", "2", "4"] },
  { id: "c5", code: "67879", genre: "Korean", groups: ["6", "7", "8", "7", "9"], hero: true },
];

// SFX: file peak dBFS -> target peak (kept low so the voiceover sits on top)
const SFX = {
  pop: { peak: -3.9, target: -24, len: 0.14 }, key: { peak: -7.5, target: -32, len: 0.035 },
  tick: { peak: -6.3, target: -27, len: 0.07 }, boom: { peak: -3.4, target: -20, len: 0.9 },
  ding: { peak: -4.5, target: -22, len: 1.2 },
};
const cues = [];
const sfx = (t, name) => cues.push([+t.toFixed(3), name]);

const T = [];
const tw = (s) => T.push(s);
const popIn = (sel, t, from = 1.6, rot = 0) => { tw(`tl.fromTo("${sel}", { scale: ${from}, opacity: 0${rot ? `, rotation: ${rot - 8}` : ""} }, { scale: 1, opacity: 1${rot ? `, rotation: ${rot}` : ""}, duration: 0.3, ease: "back.out(2)" }, ${t.toFixed(3)});`); };
const wipe = (sel, t, d = 0.4) => tw(`tl.fromTo("${sel}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: ${d}, ease: "power2.out" }, ${t.toFixed(3)});`);
const rise = (sel, t) => tw(`tl.fromTo("${sel}", { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: "power3.out" }, ${t.toFixed(3)});`);
const scene = (l, cls, inner, track = 2) => `
      <div id="s-${l.id}" class="clip layer ${cls}" data-start="${l.at}" data-duration="${(l.end - l.at).toFixed(2)}" data-track-index="${track}">${inner}
      </div>`;
const frame = (id, x, y, w, h, inner) => `
        <div class="frameOuter" style="left:${x - 14}px;top:${y - 14}px;width:${w + 28}px;height:${h + 28}px"></div>
        <div class="frame" id="${id}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px">${inner}</div>`;
const svgCheck = `<svg viewBox="0 0 100 100" class="mark"><path d="M14 54 L40 78 L88 22" fill="none" stroke="${C.dark}" stroke-width="14" stroke-linecap="square"/></svg>`;
const svgCross = `<svg viewBox="0 0 100 100" class="mark"><path d="M18 18 L82 82 M82 18 L18 82" fill="none" stroke="${C.red}" stroke-width="14" stroke-linecap="square"/></svg>`;

const parts = [];

// 1 · Hook: hero stack + endless-scroll app shot + the N stamp
{
  const l = L.hook;
  parts.push(scene(l, "", `
        <div class="eyebrow" id="hEye" style="left:56px;top:70px">Netflix · secret codes</div>
        <div class="mask" style="left:52px;top:110px"><div id="h1" class="disp" style="font-size:104px">Scroll karke</div></div>
        <div id="h2" class="disp red" style="position:absolute;left:52px;top:236px;font-size:132px;transform-origin:20% 60%">raat barbaad</div>
        <div class="mask" style="left:420px;top:398px"><div id="h3" class="disp" style="font-size:96px;transform:rotate(2deg)">mat karo!</div></div>
        ${frame("appFrame", 40, 580, 1000, 760, `<img id="appImg" src="assets/img/app.jpg" style="position:absolute;left:0;top:0;height:760px;width:auto">`)}
        <img id="logoStamp" src="assets/img/logo.png" class="stamp" style="left:840px;top:520px;width:190px;height:190px">`));
  tw(`tl.fromTo("#appImg", { x: 0, scale: 1.0 }, { x: -351, scale: 1.04, duration: ${l.end}, ease: "sine.inOut" }, 0);`);
  wipe("#hEye", 0.05); rise("#h1", 0.1); sfx(0.1, "pop");
  popIn("#h2", 0.9, 1.8, -4); sfx(0.9, "pop");
  rise("#h3", 1.9); sfx(1.9, "pop");
  popIn("#logoStamp", 0.4, 2.2, 6);
}

// 2 · "ek secret code": red statement panel
{
  const l = L.one;
  parts.push(scene(l, "redPanel center", `
        <div class="col">
          <div id="oEye" class="eyebrow static light">Aap bas</div>
          <div id="oNum" class="disp white shadow" style="font-size:520px;line-height:1;transform:rotate(-6deg)">1</div>
          <div id="oCode" class="disp white shadow" style="font-size:118px;margin-top:-10px;transform:rotate(-3deg)">secret code</div>
          <div id="oSub" class="body light" style="margin-top:46px">door ho apni favourite movie se.</div>
        </div>`));
  tw(`tl.fromTo("#s-one", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.18, ease: "power3.out" }, ${l.at});`);
  wipe("#oEye", l.at + 0.15); popIn("#oNum", l.at + 0.6, 1.8, -6); sfx(l.at + 0.6, "pop");
  popIn("#oCode", l.at + 1.2, 1.5, -3); sfx(l.at + 1.2, "pop");
  wipe("#oSub", l.at + 2.3, 0.6);
}

// 3 · "last wala code sabka favourite": dark teaser with a locked 5-digit slot
{
  const l = L.last;
  parts.push(scene(l, "darkPanel center", `
        <div class="col">
          <div id="lEye" class="eyebrow static">Aur</div>
          <div id="l1" class="disp white" style="font-size:112px">last wala code</div>
          <div id="l2" class="disp red" style="font-size:104px;transform:rotate(-4deg)">sabka favourite</div>
          <div id="lSlot" class="slot">${"<span>?</span>".repeat(5)}</div>
        </div>`));
  wipe("#lEye", l.at + 0.05); popIn("#l1", l.at + 0.2, 1.4); sfx(l.at + 0.2, "pop");
  popIn("#l2", l.at + 1.3, 1.8, -4); sfx(l.at + 1.3, "pop");
  tw(`tl.fromTo("#lSlot span", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, stagger: 0.08, ease: "back.out(2)" }, ${(l.at + 2.0).toFixed(2)});`);
}

// 4 · Browser + typed LINK + the code slot
{
  const l = L.browser, s = L.slot;
  const chars = [...LINK].map((ch, i) => `<span id="u${i}" class="uc">${ch}</span>`).join("");
  parts.push(`
      <div id="s-browser" class="clip layer" data-start="${l.at}" data-duration="${(s.end - l.at).toFixed(2)}" data-track-index="2">
        <div id="bEye" class="eyebrow" style="left:56px;top:96px">Step 1</div>
        <div class="mask" style="left:52px;top:134px"><div id="b1" class="disp" style="font-size:130px">Browser</div></div>
        <div id="b2" class="disp red" style="position:absolute;left:470px;top:262px;font-size:140px;transform-origin:20% 60%">kholo</div>
        ${frame("browserFrame", 40, 470, 1000, 310, `<img src="assets/img/browser.png" style="position:absolute;inset:0;width:100%;height:100%">`)}
        <div id="bEye2" class="eyebrow" style="left:56px;top:850px">Likho</div>
        <div id="urlBar" class="urlBar"><span class="urlText">${chars}</span><span id="codeSlot" class="codeSlot">????</span></div>
        <div id="slotLabel" class="eyebrow" style="left:0;right:0;top:1110px;text-align:center">+ secret code</div>
      </div>`);
  wipe("#bEye", l.at + 0.05); rise("#b1", l.at + 0.1); sfx(l.at + 0.1, "pop");
  popIn("#b2", l.at + 0.6, 1.8, -4); sfx(l.at + 0.6, "pop");
  tw(`tl.fromTo("#browserFrame img", { scale: 1.08 }, { scale: 1, duration: 1.2, ease: "power2.out" }, ${l.at});`);
  wipe("#bEye2", l.at + 1.0);
  tw(`tl.fromTo("#urlBar", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, ${(l.at + 1.0).toFixed(2)});`);
  const t0 = l.at + 1.2, step = (l.end - 0.3 - t0) / LINK.length;
  [...LINK].forEach((_, i) => {
    const t = t0 + i * step;
    tw(`tl.fromTo("#u${i}", { opacity: 0 }, { opacity: 1, duration: 0.01 }, ${t.toFixed(3)});`);
    if (i % 2 === 0) sfx(t, "key");
  });
  popIn("#codeSlot", s.at + 0.1, 1.8); sfx(s.at + 0.1, "pop");
  tw(`tl.fromTo("#codeSlot", { opacity: 1 }, { opacity: 0.25, duration: 0.25, yoyo: true, repeat: 5, ease: "none", immediateRender: false }, ${(s.at + 0.5).toFixed(2)});`);
  wipe("#slotLabel", s.at + 0.4);
}

// 5-9 · Codes: digits land as spoken, then the genre; LINK chip shows the full link
CODES.forEach((c, k) => {
  const l = L[c.id];
  const digits = c.groups.map((g, i) => `<span id="${c.id}d${i}" class="dg">${g}</span>`).join("");
  const size = c.code.length > 4 ? 250 : 300;
  parts.push(scene(l, c.hero ? "redPanel" : "", `
        <div id="${c.id}Eye" class="eyebrow ${c.hero ? "lightAbs" : ""}" style="left:0;right:0;top:250px;text-align:center">Code 0${k + 1} / 05${c.hero ? " · sabka favourite" : ""}</div>
        <div class="codeRow" style="top:390px"><div class="codeTilt disp ${c.hero ? "white shadow" : "red"}" style="font-size:${size}px">${digits}</div></div>
        <div id="${c.id}G" class="genre disp ${c.hero ? "white" : ""}">${c.genre}</div>
        <div id="${c.id}Url" class="urlChip ${c.hero ? "onRed" : ""}">${LINK}<b>${c.code}</b></div>`));
  if (c.hero) tw(`tl.fromTo("#s-${c.id}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.18, ease: "power3.out" }, ${l.at});`);
  wipe(`#${c.id}Eye`, l.at + 0.05);
  const lead = c.hero ? 0.45 : 0.15;  // "Aur ..." comes first on the last code
  let t = l.at + lead;
  c.groups.forEach((g, i) => {
    popIn(`#${c.id}d${i}`, t, 1.9); sfx(t, "tick");
    t += g.length > 1 ? 0.7 : 0.3;
  });
  const gAt = t + 0.25;
  popIn(`#${c.id}G`, gAt, 1.7, 2); sfx(gAt, c.hero ? "boom" : "pop");
  wipe(`#${c.id}Url`, gAt + 0.35, 0.5);
});

// 10 · Browser yes, TV app no
{
  const l = L.tv;
  parts.push(scene(l, "", `
        <div id="tEye" class="eyebrow" style="left:56px;top:110px">Dhyan rahe</div>
        ${frame("tvTop", 40, 190, 1000, 310, `<img src="assets/img/browser.png" style="position:absolute;inset:0;width:100%;height:100%">`)}
        <div id="tYes" class="verdict" style="top:540px">${svgCheck}<span class="disp" style="font-size:96px">Browser</span><span class="body">chalti hai</span></div>
        ${frame("tvBot", 40, 770, 1000, 420, `<img id="tvApp" src="assets/img/app.jpg" style="position:absolute;left:-90px;top:-40px;height:640px;width:auto;filter:grayscale(1)">`)}
        <div id="tNo" class="verdict" style="top:1220px">${svgCross}<span class="disp red" style="font-size:96px">TV app</span><span class="body">nahi</span></div>`));
  wipe("#tEye", l.at + 0.05);
  tw(`tl.fromTo("#tvTop", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, ${l.at + 0.1});`);
  popIn("#tYes", l.at + 0.9, 1.3); sfx(l.at + 0.9, "tick");
  tw(`tl.fromTo("#tvBot", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.3, ease: "power3.out" }, ${l.at + 1.6});`);
  popIn("#tNo", l.at + 2.4, 1.3); sfx(l.at + 2.4, "pop");
}

// 11 · Recap grid -> description
{
  const l = L.desc;
  const rows = CODES.map((c) => `<div class="cell num">${c.code}</div><div class="cell gen">${c.genre}</div>`).join("");
  parts.push(scene(l, "", `
        <div id="dEye" class="eyebrow" style="left:60px;top:150px">Saare codes</div>
        <div class="recap" id="recap">${rows}</div>
        <div id="dDown" class="downTag"><span class="disp red" style="font-size:84px">description me</span><svg viewBox="0 0 60 80" class="arrow"><path d="M30 4 V66 M8 46 L30 70 L52 46" fill="none" stroke="${C.red}" stroke-width="9" stroke-linecap="square"/></svg></div>`));
  wipe("#dEye", l.at + 0.05);
  tw(`tl.fromTo("#recap .cell", { opacity: 0 }, { opacity: 1, duration: 0.12, stagger: 0.06, ease: "none" }, ${l.at + 0.15});`);
  CODES.forEach((_, i) => sfx(l.at + 0.15 + i * 0.12, "tick"));
  popIn("#dDown", l.at + 0.9, 1.4); sfx(l.at + 0.9, "pop");
  tw(`tl.fromTo("#dDown .arrow", { y: -10 }, { y: 14, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${l.at + 1.1});`);
}

// 12 · Closing
{
  const l = L.cta;
  parts.push(scene(l, "", `
        <div id="cEye" class="eyebrow" style="left:60px;top:110px">Aapka favourite genre kaunsa hai?</div>
        <div id="c1x" class="disp red" style="position:absolute;left:40px;top:180px;font-size:168px;transform-origin:30% 60%">Comment</div>
        <div id="c2x" class="disp" style="position:absolute;left:360px;top:380px;font-size:160px;transform:rotate(2deg)">karo!</div>
        <img id="cLogo" src="assets/img/logo.png" class="stamp" style="left:420px;top:640px;width:240px;height:240px">
        <div id="cSub" class="body" style="position:absolute;left:60px;right:60px;top:960px;text-align:center;font-size:44px">Aur subscribe karo</div>
        <div id="cBrand" class="disp red" style="position:absolute;left:0;right:0;top:1040px;text-align:center;font-size:120px;transform:rotate(-3deg)">Namaste Techy</div>`));
  wipe("#cEye", l.at + 0.05);
  popIn("#c1x", l.at + 1.5, 1.8, -5); sfx(l.at + 1.5, "pop");
  tw(`tl.fromTo("#c2x", { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, ${(l.at + 1.9).toFixed(2)});`);
  popIn("#cLogo", l.at + 0.4, 1.6, 4);
  wipe("#cSub", l.at + 2.6, 0.5);
  popIn("#cBrand", l.at + 3.4, 1.6, -3); sfx(l.at + 3.4, "ding");
}

// Line captions (preset caption skin, whole line per beat) — muted viewers read along.
const caps = LINES.filter((l) => l.caption !== false).map((l) => `
      <div id="cap-${l.id}" class="clip layer" data-start="${l.at}" data-duration="${(l.end - l.at).toFixed(2)}" data-track-index="5">
        <div class="capStage"><div class="capCard">${l.text.replace("netflix dot com slash browse slash genre slash", "netflix.com/browse/genre/")}</div></div>
      </div>`).join("");
LINES.filter((l) => l.caption !== false).forEach((l) => tw(`tl.fromTo("#cap-${l.id} .capCard", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, ease: "power2.out" }, ${(l.at + 0.02).toFixed(2)});`));
// footer accent can't be red on the red panels
for (const id of ["one", "last", "c5"]) {
  tw(`tl.set("#footer", { color: "${C.bg}" }, ${L[id].at});`);
  if (id !== "last") tw(`tl.set("#footer span:last-child", { color: "${C.bg}" }, ${L[id].at});`);
  tw(`tl.set("#footer", { color: "${C.dark}" }, ${L[id].end});`);
  tw(`tl.set("#footer span:last-child", { color: "${C.red}" }, ${L[id].end});`);
}
tw(`tl.fromTo("#progress", { scaleX: 0 }, { scaleX: 1, duration: ${DURATION}, ease: "none" }, 0);`);

const vol = (s) => +Math.pow(10, (s.target - s.peak) / 20).toFixed(4);
const lanes = [];
const audio = cues.sort((a, b) => a[0] - b[0]).map(([t, n], i) => {
  let lane = lanes.findIndex((e) => e <= t);
  if (lane < 0) lane = lanes.push(0) - 1;
  lanes[lane] = t + SFX[n].len;
  return `<audio id="sfx-${i}" src="assets/sfx/${n}.wav" data-start="${t}" data-duration="${SFX[n].len}" data-track-index="${10 + lane}" data-volume="${vol(SFX[n])}"></audio>`;
}).join("\n    ");

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
      .center { display: flex; align-items: center; justify-content: center; }
      .col { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 50px 260px; }
      .disp { font-family: "Shrikhand", serif; font-weight: 400; line-height: 1.08; white-space: nowrap; color: ${C.dark}; }
      .disp.red { color: ${C.red}; } .disp.white { color: ${C.bg}; } .shadow { text-shadow: ${STACK}; }
      .body { font-family: "Libre Baskerville", serif; font-size: 40px; line-height: 1.5; color: ${C.dark}; }
      .body.light { color: ${C.bg}; }
      .mask { position: absolute; overflow: hidden; }
      .mask > div { display: block; }
      .eyebrow { position: absolute; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 28px; letter-spacing: 3px; text-transform: uppercase; color: ${C.red}; white-space: nowrap; }
      .eyebrow.static { position: static; margin-bottom: 10px; font-size: 34px; letter-spacing: 5px; }
      .eyebrow.light, .eyebrow.lightAbs { color: ${C.bg}; }
      .redPanel { background: ${C.red}; }
      .darkPanel { background: ${C.dark}; }
      .frameOuter { position: absolute; border: 3px solid ${C.dark}; background: ${C.light}; }
      .frame { position: absolute; overflow: hidden; outline: 1.5px solid ${C.dark}; background: #000; }
      .stamp { position: absolute; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 5px; background: #000; }
      .slot { display: flex; gap: 16px; margin-top: 70px; }
      .slot span { display: block; width: 120px; height: 150px; border: 3px solid ${C.bg}; font-family: "Shrikhand", serif; font-size: 96px; line-height: 150px; color: ${C.red}; text-align: center; }
      .urlBar { position: absolute; left: 40px; top: 900px; width: 1000px; height: 180px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 6px; background: ${C.bg}; display: flex; align-items: center; padding: 0 30px; white-space: nowrap; }
      .urlText { font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 50px; letter-spacing: -0.5px; color: ${C.dark}; }
      .codeSlot { display: inline-block; margin-left: 10px; font-family: "Shrikhand", serif; font-size: 84px; color: ${C.red}; }
      .codeRow { position: absolute; left: 0; right: 0; display: flex; justify-content: center; }
      .codeTilt { display: flex; transform: rotate(-6deg); line-height: 1; }
      .dg { display: inline-block; }
      .genre { position: absolute; left: 0; right: 0; top: 850px; text-align: center; font-size: 170px; transform: rotate(2deg); }
      .urlChip { position: absolute; left: 60px; right: 60px; top: 1170px; padding: 22px 26px; border: 3px solid ${C.dark}; background: ${C.bg}; text-align: center; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 40px; color: ${C.dark}; white-space: nowrap; }
      .urlChip b { color: ${C.red}; }
      .urlChip.onRed { border-color: ${C.dark}; }
      .verdict { position: absolute; left: 60px; right: 60px; height: 140px; display: flex; align-items: center; gap: 26px; border-left: 4px solid ${C.red}; padding-left: 26px; transform-origin: 20% 50%; }
      .verdict .body { font-size: 44px; }
      .mark { width: 92px; height: 92px; flex: none; }
      .recap { position: absolute; left: 60px; top: 230px; width: 960px; display: grid; grid-template-columns: 380px 1fr; border: 3px solid ${C.dark}; }
      .recap .cell { height: 150px; border: 1.5px solid ${C.dark}; display: flex; align-items: center; padding: 0 30px; font-family: "Shrikhand", serif; }
      .recap .num { justify-content: center; font-size: 100px; color: ${C.red}; }
      .recap .gen { font-size: 76px; color: ${C.dark}; }
      .downTag { position: absolute; left: 0; right: 0; top: 1040px; display: flex; flex-direction: column; align-items: center; gap: 6px; transform-origin: 50% 30%; }
      .arrow { width: 70px; height: 92px; }
      .capStage { position: absolute; left: 0; right: 0; top: 1372px; height: 160px; display: flex; align-items: center; justify-content: center; }
      .capCard { max-width: 92%; padding: 14px 36px 18px; background: ${C.bg}; border: 1.5px solid ${C.dark}; border-left: 4px solid ${C.red}; font-family: "Shrikhand", serif; font-size: 44px; line-height: 1.2; text-align: center; color: ${C.dark}; }
      #footer { position: absolute; left: 60px; right: 60px; top: 1570px; display: flex; justify-content: space-between; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 3px; text-transform: uppercase; color: ${C.dark}; }
      #footer span:last-child { color: ${C.red}; }
      #progress { position: absolute; left: 0; bottom: 0; width: 100%; height: 12px; background: ${C.red}; transform-origin: 0 50%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">${parts.join("")}${caps}
      <div id="footer"><span>Namaste Techy</span><span>Netflix secret codes</span></div>
      <div id="progress"></div>
    </div>

    ${audio}

    <script>
      const tl = gsap.timeline({ paused: true });
      ${T.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);

const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
writeFileSync(new URL("./CUES.md", import.meta.url), `# Voiceover cue sheet: Netflix secret codes (${DURATION}s)

Start each line when its timecode comes up on screen. The on-screen text for that line appears at the same moment.

| Start | End | Line |
|---|---|---|
${LINES.map((l) => `| ${fmt(l.at)} | ${fmt(l.end)} | ${l.text} |`).join("\n")}
`);
console.log(`index.html: ${LINES.length} beats, ${cues.length} sfx, ${T.length} tweens`);
