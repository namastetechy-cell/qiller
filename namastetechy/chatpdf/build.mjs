// "ChatPDF" Short, Bold Poster frame preset, 9:16, no narration (paced for a voiceover
// recorded on top, see CUES.md), one quiet click SFX. B-roll is real chatpdf.com captured
// in a phone-sized headless browser (assets/broll/*).
// usage: node build.mjs   -> index.html + CUES.md
import { writeFileSync } from "node:fs";

const W = 1080, H = 1920;
const C = { bg: "#FFFFFF", dark: "#1C1410", red: "#D8000F", light: "#F5F2EF" };
const STACK = "0.03em 0.03em 0 rgba(28,20,16,.25), 0.06em 0.06em 0 rgba(28,20,16,.2), 0.09em 0.09em 0 rgba(28,20,16,.15)";

// Script lines, paced at ~2.8 words/sec.
const LINES = [
  { id: "hook", at: 0.0, end: 5.4, text: "Exams aane wale hain ya office mein 100-page ki PDF dekh kar rona aa raha hai?" },
  { id: "stop", at: 5.4, end: 11.0, text: "Pura document padhne mein ghanton waste karna BAND KARO, aur CTRL+F par depend rehna chhod do!" },
  { id: "search", at: 11.0, end: 13.2, text: "Google par search karo ChatPDF.com." },
  { id: "drop", at: 13.2, end: 17.8, text: "Apni massive PDF drag-and-drop karo aur is AI se directly chat karo!" },
  { id: "type", at: 17.8, end: 22.6, text: "Type karo: \"Is pooray chapter ki summary aur top 5 exam questions batao.\"" },
  { id: "ready", at: 22.6, end: 25.0, text: "Seconds mein exact answers ready!" },
  { id: "free", at: 25.0, end: 28.8, text: "Bilkul FREE hai aur kisi paid software ki zarurat nahi!" },
  { id: "cta", at: 28.8, end: 34.0, text: "Aise aur viral AI tools ke liye NamasteTechy ko abhi subscribe karo!" },
];
const DURATION = 34.0;
const L = Object.fromEntries(LINES.map((l) => [l.id, l]));

// Phone b-roll frame (screenshots are 900 x 1950 once scaled) and what each beat shows in it.
const FR = { x: 90, y: 450, w: 900, h: 880 };
const SHOT_H = 1950;
const BROLL = [
  { id: "home", src: "assets/broll/home.png", from: L.search.at, to: L.drop.at, y: -40, img: true },
  { id: "upload", src: "assets/broll/upload.mp4", from: L.drop.at, to: L.type.at, y: 0 },
  { id: "type", src: "assets/broll/type.mp4", from: L.type.at, to: L.ready.at, y: FR.h - SHOT_H },
  { id: "answer", src: "assets/broll/answer.mp4", from: L.ready.at, to: L.free.at, y: 0 },
  { id: "scroll", src: "assets/broll/scroll.mp4", from: L.free.at, to: L.cta.at, y: 0 },
];

const CLICK = { peak: -2.4, len: 0.08 };
const cues = [];
const click = (t, target = -28) => cues.push([+t.toFixed(3), target]);   // dBFS peak in the mix

const T = [];
const tw = (s) => T.push(s);
const popIn = (sel, t, from = 1.6, rot = 0) => tw(`tl.fromTo("${sel}", { scale: ${from}, opacity: 0${rot ? `, rotation: ${rot - 8}` : ""} }, { scale: 1, opacity: 1${rot ? `, rotation: ${rot}` : ""}, duration: 0.3, ease: "back.out(2)" }, ${t.toFixed(3)});`);
const wipe = (sel, t, d = 0.4) => tw(`tl.fromTo("${sel}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: ${d}, ease: "power2.out" }, ${t.toFixed(3)});`);
const rise = (sel, t) => tw(`tl.fromTo("${sel}", { yPercent: 110 }, { yPercent: 0, duration: 0.4, ease: "power3.out" }, ${t.toFixed(3)});`);
const clip = (id, at, end, cls, inner, track = 2) => `
      <div id="${id}" class="clip layer ${cls}" data-start="${at}" data-duration="${(end - at).toFixed(2)}" data-track-index="${track}">${inner}
      </div>`;
const keycaps = (keys, cls = "") => keys.map((k) => `<span class="key ${cls}">${k}</span>`).join(`<span class="plus ${cls}">+</span>`);

const parts = [];

// 1 · Hook: a fat stack of pages, "100" stamped on it
{
  const l = L.hook;
  const sheets = [0, 1, 2, 3, 4].map((i) => `<div class="sheet" style="transform:translate(${i * 14}px,${-i * 14}px) rotate(${(i - 2) * 2.2}deg)"></div>`).join("");
  parts.push(clip("s-hook", l.at, l.end, "", `
        <div id="hEye" class="eyebrow" style="left:60px;top:90px">Exams aane wale hain?</div>
        <div id="hOffice" class="disp" style="position:absolute;left:60px;top:140px;font-size:84px">ya office mein…</div>
        <div id="stack" class="stackWrap">${sheets}
          <div class="sheet top"><div class="pdfTag">PDF</div>${"<div class='ln'></div>".repeat(9)}</div>
        </div>
        <div id="h100" class="disp red" style="position:absolute;left:70px;top:330px;font-size:330px;line-height:1;transform-origin:30% 60%">100</div>
        <div id="hPages" class="eyebrow" style="left:110px;top:690px;font-size:34px">pages</div>
        <div id="hCry" class="disp red" style="position:absolute;left:0;right:0;top:1150px;text-align:center;font-size:104px;transform-origin:50% 60%">rona aa raha hai?</div>`));
  wipe("#hEye", 0.05); click(0.05);
  rise("#hOffice", 0.9);
  tw(`tl.fromTo("#stack .sheet", { y: -600, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.07, ease: "power3.out" }, 1.2);`);
  popIn("#h100", 1.9, 2.0, -6); click(1.9, -26);
  wipe("#hPages", 2.3);
  popIn("#hCry", 3.6, 1.8, -4); click(3.6, -26);
  tw(`tl.fromTo("#stack", { rotation: 0 }, { rotation: 2, duration: 5.4, ease: "sine.inOut" }, 0);`);
}

// 2 · "BAND KARO": red statement panel; CTRL+F crossed out
{
  const l = L.stop;
  parts.push(clip("s-stop", l.at, l.end, "redPanel", `
        <div id="sEye" class="eyebrow light" style="left:0;right:0;top:300px;text-align:center">Pura document padhna?</div>
        <div id="sWaste" class="disp white" style="position:absolute;left:0;right:0;top:360px;text-align:center;font-size:104px">ghanton waste</div>
        <div id="sStrike" class="strike"></div>
        <div id="sBand" class="disp white shadow" style="position:absolute;left:0;right:0;top:580px;text-align:center;font-size:150px;transform-origin:50% 60%">BAND KARO!</div>
        <div id="sKeys" class="keyRow" style="top:930px">${keycaps(["CTRL", "F"], "onRed")}<svg id="sX" viewBox="0 0 100 100" class="bigX"><path d="M10 10 L90 90 M90 10 L10 90" fill="none" stroke="${C.dark}" stroke-width="12" stroke-linecap="square"/></svg></div>
        <div id="sChhod" class="body light" style="position:absolute;left:0;right:0;top:1150px;text-align:center">par depend rehna chhod do!</div>`));
  tw(`tl.fromTo("#s-stop", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.18, ease: "power3.out" }, ${l.at});`);
  wipe("#sEye", l.at + 0.2);
  popIn("#sWaste", l.at + 0.8, 1.4); click(l.at + 0.8);
  tw(`tl.fromTo("#sStrike", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${(l.at + 1.6).toFixed(2)});`);
  popIn("#sBand", l.at + 2.6, 2.0, -6); click(l.at + 2.6, -24);
  tw(`tl.fromTo("#sKeys .key, #sKeys .plus", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.22, stagger: 0.07, ease: "power3.out" }, ${(l.at + 3.8).toFixed(2)});`); click(l.at + 3.8);
  popIn("#sX", l.at + 4.3, 1.8); click(l.at + 4.3, -26);
  wipe("#sChhod", l.at + 4.6, 0.5);
}

// 3-7 · The phone frame with real chatpdf.com b-roll, one header per line
{
  const from = L.search.at, to = L.cta.at;
  const media = BROLL.map((b) => b.img
    ? `<div id="br-${b.id}" class="clip brWin" data-layout-allow-overflow data-start="${b.from}" data-duration="${(b.to - b.from).toFixed(2)}" data-track-index="1"><img src="${b.src}" style="position:absolute;left:0;top:${b.y}px;width:${FR.w}px;height:auto"></div>`
    : `<div class="brWin" data-layout-allow-overflow><video id="br-${b.id}" class="clip" src="${b.src}" muted playsinline data-start="${b.from}" data-duration="${(b.to - b.from).toFixed(2)}" data-track-index="1" style="position:absolute;left:0;top:${b.y}px;width:${FR.w}px;height:${SHOT_H}px"></video></div>`).join("\n          ");
  parts.push(`
      <div id="phone" class="clip layer" data-start="${from}" data-duration="${(to - from).toFixed(2)}" data-track-index="1">
        <div class="frameOuter" style="left:${FR.x - 14}px;top:${FR.y - 14}px;width:${FR.w + 28}px;height:${FR.h + 28}px"></div>
        <div class="frame" style="left:${FR.x}px;top:${FR.y}px;width:${FR.w}px;height:${FR.h}px">
          ${media}
        </div>
        <div id="pdfIcon" class="pdfIcon"><div class="pdfTag">PDF</div>${"<div class='ln'></div>".repeat(4)}</div>
      </div>`);
  tw(`tl.fromTo("#phone .frameOuter, #phone .frame", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, ${from});`);
  // the PDF gets dragged into the upload box, then dropped
  tw(`tl.fromTo("#pdfIcon", { x: 520, y: -420, rotation: 14, opacity: 0 }, { x: 0, y: 0, rotation: -4, opacity: 1, duration: 0.7, ease: "power2.inOut" }, ${(L.drop.at - 0.9).toFixed(2)});`);
  tw(`tl.to("#pdfIcon", { scale: 0.4, opacity: 0, duration: 0.25, ease: "power2.in" }, ${(L.drop.at - 0.15).toFixed(2)});`);
  click(L.drop.at - 0.15, -26);
}
const header = (l, inner) => parts.push(clip(`h-${l.id}`, l.at, l.end, "", inner, 3));
{
  const l = L.search, q = "chatpdf.com";
  header(l, `
        <div id="qEye" class="eyebrow" style="left:60px;top:110px">Step 1 · Google par search karo</div>
        <div id="qBar" class="searchBar"><svg viewBox="0 0 40 40" class="mag"><circle cx="16" cy="16" r="11" fill="none" stroke="${C.dark}" stroke-width="4.5"/><path d="M24 24 L36 36" stroke="${C.dark}" stroke-width="5" stroke-linecap="square"/></svg><span>${[...q].map((ch, i) => `<span id="q${i}">${ch}</span>`).join("")}</span><span id="qCaret" class="caret"></span></div>`);
  wipe("#qEye", l.at + 0.05);
  tw(`tl.fromTo("#qBar", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, ${l.at + 0.1});`);
  [...q].forEach((_, i) => { const t = l.at + 0.45 + i * 0.09; tw(`tl.fromTo("#q${i}", { opacity: 0 }, { opacity: 1, duration: 0.01 }, ${t.toFixed(3)});`); if (i % 2 === 0) click(t, -34); });
  click(l.at + 1.6, -28);
}
{
  const l = L.drop;
  header(l, `
        <div id="dEye" class="eyebrow" style="left:60px;top:90px">Step 2</div>
        <div class="mask" style="left:56px;top:126px"><div id="d1" class="disp" style="font-size:112px">Drag &amp; drop</div></div>
        <div id="d2" class="disp red" style="position:absolute;left:640px;top:236px;font-size:130px;transform-origin:30% 60%">PDF</div>
        <div id="d3" class="tagline" style="left:60px;top:282px;width:520px">aur AI se directly chat karo!</div>`);
  wipe("#dEye", l.at + 0.05); rise("#d1", l.at + 0.1); click(l.at + 0.1);
  popIn("#d2", l.at + 0.7, 1.8, -5); click(l.at + 0.7, -26);
  wipe("#d3", l.at + 2.4, 0.5);
}
{
  const l = L.type;
  header(l, `
        <div id="tEye" class="eyebrow" style="left:60px;top:90px">Step 3 · Type karo</div>
        <div class="mask" style="left:56px;top:126px"><div id="t1" class="disp" style="font-size:104px">Summary +</div></div>
        <div id="t2" class="disp red" style="position:absolute;left:150px;top:250px;font-size:100px;transform-origin:30% 60%">top 5 exam Qs</div>`);
  wipe("#tEye", l.at + 0.05); rise("#t1", l.at + 0.1); click(l.at + 0.1);
  popIn("#t2", l.at + 1.0, 1.7, -4); click(l.at + 1.0, -26);
  for (let i = 0; i < 20; i++) click(l.at + 0.2 + i * 0.18, -36);   // soft typing under the b-roll
  click(l.at + 3.9, -26);                                            // enter
}
{
  const l = L.ready;
  header(l, `
        <div id="rEye" class="eyebrow" style="left:60px;top:90px">Result</div>
        <div class="mask" style="left:56px;top:126px"><div id="r1" class="disp" style="font-size:112px">Seconds mein</div></div>
        <div id="r2" class="disp red" style="position:absolute;left:110px;top:250px;font-size:112px;transform-origin:30% 60%">answers ready!</div>`);
  wipe("#rEye", l.at + 0.05); rise("#r1", l.at + 0.1); click(l.at + 0.1);
  popIn("#r2", l.at + 0.9, 1.8, -4); click(l.at + 0.9, -26);
}
{
  const l = L.free;
  header(l, `
        <div id="fEye" class="eyebrow" style="left:60px;top:90px">Bilkul</div>
        <div id="fFree" class="disp red" style="position:absolute;left:46px;top:120px;font-size:200px;line-height:1;transform-origin:30% 60%">FREE</div>
        <div id="fLine" class="tagline" style="left:690px;top:170px;width:350px;font-size:36px">Kisi paid software ki zarurat nahi!</div>`);
  wipe("#fEye", l.at + 0.05);
  popIn("#fFree", l.at + 0.3, 2.0, -6); click(l.at + 0.3, -24);
  wipe("#fLine", l.at + 1.5, 0.6);
}

// 8 · Closing
{
  const l = L.cta;
  parts.push(clip("s-cta", l.at, l.end, "", `
        <div id="cEye" class="eyebrow" style="left:60px;top:150px">Aise aur viral AI tools ke liye</div>
        <div id="c1" class="disp red" style="position:absolute;left:40px;top:220px;font-size:176px;transform-origin:30% 60%">Subscribe</div>
        <div id="c2" class="disp" style="position:absolute;left:420px;top:430px;font-size:150px;transform:rotate(2deg)">karo!</div>
        <div id="cBrand" class="brandCard"><div class="eyebrow static">Channel</div><div class="disp red" style="font-size:118px;transform:rotate(-3deg)">NamasteTechy</div></div>
        <div id="cTool" class="urlChip">Tool: <b>chatpdf.com</b></div>`));
  wipe("#cEye", l.at + 0.05);
  popIn("#c1", l.at + 2.6, 1.8, -5); click(l.at + 2.6, -24);
  tw(`tl.fromTo("#c2", { yPercent: 80, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: "power3.out" }, ${(l.at + 3.0).toFixed(2)});`);
  tw(`tl.fromTo("#cBrand", { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out" }, ${(l.at + 1.2).toFixed(2)});`); click(l.at + 1.2);
  wipe("#cTool", l.at + 3.6, 0.5);
}

// Line captions (preset caption skin) for muted viewers.
const caps = LINES.map((l) => clip(`cap-${l.id}`, l.at, l.end, "", `
        <div class="capStage"><div class="capCard">${l.text}</div></div>`, 5)).join("");
LINES.forEach((l) => tw(`tl.fromTo("#cap-${l.id} .capCard", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.2, ease: "power2.out" }, ${(l.at + 0.02).toFixed(2)});`));
// footer goes white on the red panel
tw(`tl.set("#footer, #footer span:last-child", { color: "${C.bg}" }, ${L.stop.at});`);
tw(`tl.set("#footer", { color: "${C.dark}" }, ${L.stop.end});`);
tw(`tl.set("#footer span:last-child", { color: "${C.red}" }, ${L.stop.end});`);
tw(`tl.fromTo("#progress", { scaleX: 0 }, { scaleX: 1, duration: ${DURATION}, ease: "none" }, 0);`);

const lanes = [];
const audio = cues.sort((a, b) => a[0] - b[0]).map(([t, target], i) => {
  let lane = lanes.findIndex((e) => e <= t);
  if (lane < 0) lane = lanes.push(0) - 1;
  lanes[lane] = t + CLICK.len;
  const v = +Math.pow(10, (target - CLICK.peak) / 20).toFixed(4);
  return `<audio id="sfx-${i}" src="assets/sfx/click.wav" data-start="${t}" data-duration="${CLICK.len}" data-track-index="${10 + lane}" data-volume="${v}"></audio>`;
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
      .disp { font-family: "Shrikhand", serif; font-weight: 400; line-height: 1.08; white-space: nowrap; color: ${C.dark}; }
      .disp.red { color: ${C.red}; } .disp.white { color: ${C.bg}; } .shadow { text-shadow: ${STACK}; }
      .body { font-family: "Libre Baskerville", serif; font-size: 44px; line-height: 1.5; color: ${C.dark}; }
      .body.light { color: ${C.bg}; }
      .mask { position: absolute; overflow: hidden; }
      .mask > div { display: block; }
      .eyebrow { position: absolute; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 28px; letter-spacing: 3px; text-transform: uppercase; color: ${C.red}; white-space: nowrap; }
      .eyebrow.light { color: ${C.bg}; font-size: 34px; letter-spacing: 5px; }
      .eyebrow.static { position: static; }
      .tagline { position: absolute; padding-left: 20px; border-left: 4px solid ${C.red}; font-family: "Libre Baskerville", serif; font-size: 40px; line-height: 1.45; color: ${C.dark}; }
      .redPanel { background: ${C.red}; }
      .frameOuter { position: absolute; border: 3px solid ${C.dark}; background: ${C.light}; }
      .frame { position: absolute; overflow: hidden; outline: 1.5px solid ${C.dark}; background: ${C.bg}; }
      .brWin { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }

      /* hook page stack */
      .stackWrap { position: absolute; left: 420px; top: 330px; width: 560px; height: 740px; transform-origin: 50% 100%; }
      .sheet { position: absolute; inset: 0; width: 100%; height: 100%; background: ${C.bg}; border: 3px solid ${C.dark}; }
      .sheet.top { padding: 90px 50px 0; }
      .sheet.top .pdfTag { left: auto; right: 40px; }
      .sheet .ln { height: 14px; margin: 0 0 30px; background: ${C.light}; border: 1.5px solid #d9d2cc; }
      .pdfTag { position: absolute; left: 50px; top: 26px; padding: 4px 14px 8px; background: ${C.red}; color: ${C.bg}; font-family: "Shrikhand", serif; font-size: 34px; }
      .pdfIcon { position: absolute; left: 450px; top: 1060px; width: 180px; height: 230px; background: ${C.bg}; border: 3px solid ${C.dark}; padding: 70px 20px 0; transform-origin: 50% 50%; }
      .pdfIcon .pdfTag { left: 16px; top: 14px; font-size: 26px; }
      .pdfIcon .ln { height: 10px; margin: 0 0 18px; background: ${C.light}; border: 1.5px solid #d9d2cc; }

      /* red panel pieces */
      .strike { position: absolute; left: 170px; top: 425px; width: 740px; height: 16px; background: ${C.dark}; transform-origin: 0 50%; }
      .keyRow { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: center; gap: 18px; }
      .key { display: inline-block; padding: 10px 26px 16px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 5px; background: ${C.bg}; font-family: "Shrikhand", serif; font-size: 86px; line-height: 1.05; color: ${C.dark}; }
      .plus { font-family: "Shrikhand", serif; font-size: 80px; color: ${C.dark}; }
      .plus.onRed { color: ${C.bg}; }
      .bigX { position: absolute; left: 330px; top: -40px; width: 420px; height: 220px; }

      /* search bar */
      .searchBar { position: absolute; left: 60px; top: 170px; width: 960px; height: 170px; display: flex; align-items: center; gap: 24px; padding: 0 36px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 6px; background: ${C.bg}; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 64px; color: ${C.dark}; white-space: nowrap; }
      .mag { width: 60px; height: 60px; flex: none; }
      .caret { display: inline-block; width: 5px; height: 70px; background: ${C.red}; }

      /* closing */
      .brandCard { position: absolute; left: 60px; right: 60px; top: 700px; padding: 40px 0 50px; border: 3px solid ${C.dark}; display: flex; flex-direction: column; align-items: center; gap: 10px; }
      .urlChip { position: absolute; left: 60px; right: 60px; top: 1060px; padding: 22px 26px; border: 3px solid ${C.dark}; text-align: center; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 44px; color: ${C.dark}; }
      .urlChip b { color: ${C.red}; }

      .capStage { position: absolute; left: 0; right: 0; top: 1372px; height: 160px; display: flex; align-items: center; justify-content: center; }
      .capCard { max-width: 92%; padding: 14px 36px 18px; background: ${C.bg}; border: 1.5px solid ${C.dark}; border-left: 4px solid ${C.red}; font-family: "Shrikhand", serif; font-size: 42px; line-height: 1.2; text-align: center; color: ${C.dark}; }
      #footer { position: absolute; left: 60px; right: 60px; top: 1570px; display: flex; justify-content: space-between; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 3px; text-transform: uppercase; color: ${C.dark}; }
      #footer span:last-child { color: ${C.red}; }
      #progress { position: absolute; left: 0; bottom: 0; width: 100%; height: 12px; background: ${C.red}; transform-origin: 0 50%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">${parts.join("")}${caps}
      <div id="footer"><span>Namaste Techy</span><span>AI tools · ChatPDF</span></div>
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
writeFileSync(new globalThis.URL("./index.html", import.meta.url), html);
const fmt = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;
writeFileSync(new globalThis.URL("./CUES.md", import.meta.url), `# Voiceover cue sheet: ChatPDF (${DURATION}s)

Start each line when its timecode comes up; its on-screen text appears at the same moment.

| Start | End | Line |
|---|---|---|
${LINES.map((l) => `| ${fmt(l.at)} | ${fmt(l.end)} | ${l.text} |`).join("\n")}
`);
console.log(`index.html: ${LINES.length} beats, ${cues.length} clicks, ${T.length} tweens`);
