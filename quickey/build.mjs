// "Quickey" 13s promo, 16:9, light Apple-style kinetic type. See STORYBOARD.md for the beat sheet.
// usage: node build.mjs   -> index.html
import { writeFileSync } from "node:fs";

const W = 1920, H = 1080, DURATION = 13.0;
const C = {
  bg: "#F5F5F7", card: "#FFFFFF", ink: "#1D1D1F", mute: "#86868B",
  b1: "#2F6BFF", b2: "#7B4DFF", docx: "#2B65D9", pdf: "#E5322D", ok: "#34C759",
};

// Scene clips: [id, start, end, background]
const SC = [
  ["s1", 0.0, 1.0, C.bg],
  ["s2", 1.0, 2.0, C.bg],
  ["s3", 2.0, 3.0, "#FFFFFF"],
  ["s4", 3.0, 4.5, C.bg],
  ["s5", 4.5, 7.0, C.bg],
  ["s6a", 7.0, 7.5, "#EAF1FF"],
  ["s6b", 7.5, 8.0, "#EAF8EF"],
  ["s6c", 8.0, 8.5, "#FFF3E6"],
  ["s6d", 8.5, 9.0, "#F1ECFF"],
  ["s7", 9.0, 10.25, "#FFFFFF"],
  ["s8", 10.25, 13.0, C.bg],
];

const tw = []; // timeline lines
const at = (s) => tw.push(s);
const n = (x) => +x.toFixed(3);

// Kinetic word: scale+blur punch.
const punch = (sel, t, from = 1.35, dur = 0.3) =>
  at(`tl.fromTo("${sel}", { opacity: 0, scale: ${from}, filter: "blur(18px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: ${dur}, ease: "expo.out" }, ${n(t)});`);
// Softer word rise.
const rise = (sel, t, dur = 0.4) =>
  at(`tl.fromTo("${sel}", { opacity: 0, y: 40, filter: "blur(10px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: ${dur}, ease: "expo.out" }, ${n(t)});`);
const push = (sel, t0, t1, to = 1.05) =>
  at(`tl.fromTo("${sel}", { scale: 1 }, { scale: ${to}, duration: ${n(t1 - t0)}, ease: "none" }, ${n(t0)});`);

const words = (id, list, cls = "") =>
  list.map(([w, extra = ""], i) => `<span id="${id}-${i}" class="w ${extra}">${w}</span>`).join("");

// A keyboard key / app icon. size in px; filled = brand gradient from the start.
const key = (id, size, filled = false) => `
  <div id="${id}" class="key" style="width:${size}px;height:${size + size * 0.07}px;--r:${size * 0.23}px">
    <div class="keybase"></div>
    <div id="${id}-top" class="keytop">
      <div id="${id}-fill" class="keyfill" style="opacity:${filled ? 1 : 0}"></div>
      <div id="${id}-q" class="keyq" style="font-size:${size * 0.56}px;color:${filled ? "#fff" : C.ink}">Q</div>
    </div>
  </div>`;

// Document card. kind: label shown in badge.
const doc = (id, w, h, badge, color, extra = "") => {
  const lines = [0.92, 0.78, 0.86, 0.6, 0.88, 0.72, 0.5]
    .map((f, i) => `<i style="width:${f * 100}%;${i === 0 ? "height:22px;background:#2a2a2d;width:62%;margin-bottom:22px" : ""}"></i>`).join("");
  return `
  <div id="${id}" class="doc" style="width:${w}px;height:${h}px;${extra}">
    <div class="badge" style="background:${color}">${badge}</div>
    <div class="lines">${lines}</div>
  </div>`;
};

// ---------------- scene 2: file tiles pile ----------------
const EXT = [
  [".docx", C.docx], [".xlsx", "#1E8E4E"], [".pptx", "#D9541E"], [".jpg", "#8E5BD9"], [".png", "#0FA3B1"],
  [".txt", "#6E6E73"], [".pages", "#F29D0C"], [".docx", C.docx], [".csv", "#1E8E4E"], [".heic", "#8E5BD9"],
  [".pptx", "#D9541E"], [".odt", "#2B8BD9"], [".rtf", "#6E6E73"], [".xlsx", "#1E8E4E"],
];
// final positions (centers) and rotations — hand-placed so the pile frames the headline.
const TILE = [
  [250, 240, -14], [560, 170, 9], [900, 150, -6], [1240, 190, 12], [1580, 230, -9], [1760, 560, 16], [1500, 860, -12],
  [1150, 900, 7], [800, 880, -10], [430, 860, 14], [180, 600, -8], [700, 520, 18], [1250, 560, -16], [960, 600, 4],
];
const tiles = TILE.map(([x, y, r], i) => {
  const [e, c] = EXT[i];
  return `<div id="t${i}" class="tile" style="left:${x - 95}px;top:${y - 120}px"><div class="tband" style="background:${c}">${e}</div><i></i><i></i><i style="width:60%"></i><i></i></div>`;
}).join("");
TILE.forEach(([x, y, r], i) => {
  const ang = (i * 137.5) * Math.PI / 180;
  const fx = n(Math.cos(ang) * 1400), fy = n(Math.sin(ang) * 1000);
  at(`tl.fromTo("#t${i}", { x: ${fx}, y: ${fy}, rotation: ${r * 4}, opacity: 1 }, { x: 0, y: 0, rotation: ${r}, duration: 0.42, ease: "back.out(1.3)" }, ${n(1.0 + i * 0.03)});`);
});

// ---------------- timeline ----------------
// S1 hook
punch("#h1-0", 0.0); punch("#h1-1", 0.25); punch("#h1-2", 0.5, 1.6, 0.36);
push("#s1 .cam", 0, 1, 1.08);

// S2 mess
at(`tl.fromTo("#s2 .cam", { x: 0 }, { x: -14, duration: 0.05, repeat: 5, yoyo: true, ease: "none" }, 1.5);`);
push("#s2 .cam", 1, 2, 1.06);
at(`tl.fromTo("#plate", { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.25, ease: "expo.out" }, 1.42);`);
punch("#h2-0", 1.45); punch("#h2-1", 1.62);

// S3 breath
rise("#h3a-0", 2.08); rise("#h3a-1", 2.24); rise("#h3a-2", 2.4, 0.5);
rise("#h3b-0", 2.6); rise("#h3b-1", 2.74, 0.5);
at(`tl.fromTo("#h3b", { color: "${C.mute}" }, { color: "${C.ink}", duration: 0.3, ease: "power2.out" }, 2.72);`);
push("#s3 .cam", 2, 3, 1.04);

// S4 reveal: giant key falls in, is pressed, becomes the icon, wordmark slides out.
at(`tl.fromTo("#k4", { scale: 4.2, filter: "blur(30px)", opacity: 0 }, { scale: 1, filter: "blur(0px)", opacity: 1, duration: 0.42, ease: "expo.out" }, 3.0);`);
at(`tl.fromTo("#k4-top", { y: 0 }, { y: 20, duration: 0.07, ease: "power2.in" }, 3.48);`);
at(`tl.to("#k4-top", { y: 0, duration: 0.25, ease: "back.out(3)" }, 3.56);`);
at(`tl.fromTo("#k4-fill", { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" }, 3.52);`);
at(`tl.fromTo("#k4-q", { color: "${C.ink}" }, { color: "#ffffff", duration: 0.18, ease: "power2.out" }, 3.52);`);
at(`tl.fromTo("#ring4", { scale: 0.6, opacity: 0.9 }, { scale: 3.4, opacity: 0, duration: 0.7, ease: "expo.out" }, 3.52);`);
at(`tl.fromTo("#ring4b", { scale: 0.6, opacity: 0.5 }, { scale: 5, opacity: 0, duration: 0.9, ease: "expo.out" }, 3.56);`);
at(`tl.fromTo("#k4", { x: 0 }, { x: -390, duration: 0.5, ease: "expo.inOut", immediateRender: false }, 3.78);`);
"Quickey".split("").forEach((_, i) =>
  at(`tl.fromTo("#wm-${i}", { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: "expo.out" }, ${n(3.98 + i * 0.035)});`));
push("#s4 .cam", 3, 4.5, 1.05);

// S5 hero convert
punch("#h5-0", 4.52); punch("#h5-1", 4.66, 0.4); punch("#h5-2", 4.8, 1.5);
at(`tl.fromTo("#d5", { x: -500, rotation: -8, opacity: 0 }, { x: 0, rotation: -3, opacity: 1, duration: 0.45, ease: "expo.out" }, 4.5);`);
at(`tl.fromTo("#k5", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }, 4.62);`);
at(`tl.fromTo("#k5-top", { y: 0 }, { y: 16, duration: 0.06, ease: "power2.in" }, 4.98);`);
at(`tl.to("#k5-top", { y: 0, duration: 0.22, ease: "back.out(3)" }, 5.05);`);
at(`tl.fromTo("#ring5", { scale: 0.7, opacity: 0.8 }, { scale: 2.6, opacity: 0, duration: 0.5, ease: "expo.out" }, 5.02);`);
// flight: through the key, flip, land on the right
at(`tl.to("#d5", { keyframes: { x: [0, 460, 920], y: [0, -70, 0] }, rotation: 3, duration: 0.5, ease: "power3.inOut" }, 5.04);`);
at(`tl.fromTo("#d5", { rotationY: 0 }, { rotationY: 360, duration: 0.5, ease: "power3.inOut", immediateRender: false }, 5.04);`);
at(`tl.fromTo("#d5 .b-docx", { opacity: 1 }, { opacity: 0, duration: 0.06, ease: "none" }, 5.28);`);
at(`tl.fromTo("#d5 .b-pdf", { opacity: 0 }, { opacity: 1, duration: 0.06, ease: "none" }, 5.28);`);
at(`tl.fromTo("#d5 .sweep", { xPercent: -160 }, { xPercent: 260, duration: 0.45, ease: "power2.inOut" }, 5.3);`);
at(`tl.fromTo("#chk5", { scale: 0, rotation: -40 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2.5)" }, 5.55);`);
rise("#h5b-0", 5.75, 0.35); rise("#h5b-1", 5.9, 0.35); punch("#h5b-2", 6.15, 1.4); punch("#h5b-3", 6.3, 1.4);
push("#s5 .zoom", 4.5, 6.75, 1.05);
at(`tl.fromTo("#s5 .cam", { x: 0, filter: "blur(0px)" }, { x: -1500, filter: "blur(26px)", duration: 0.25, ease: "power3.in" }, 6.75);`);

// S6 features — whip lands into Merge
at(`tl.fromTo("#s6a .cam", { x: 900, filter: "blur(26px)" }, { x: 0, filter: "blur(0px)", duration: 0.22, ease: "power3.out" }, 7.0);`);
punch("#f1", 7.04);
at(`tl.fromTo("#m1", { x: -260, rotation: -14 }, { x: 0, rotation: 0, duration: 0.3, ease: "expo.out" }, 7.12);`);
at(`tl.fromTo("#m3", { x: 260, rotation: 14 }, { x: 0, rotation: 0, duration: 0.3, ease: "expo.out" }, 7.12);`);
at(`tl.fromTo("#m2", { scale: 1 }, { scale: 1.08, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" }, 7.36);`);
push("#s6a .zoom", 7, 7.5, 1.05);

punch("#f2", 7.52);
at(`tl.fromTo("#cp", { scaleX: 1, scaleY: 1 }, { scaleX: 0.82, scaleY: 0.5, duration: 0.3, ease: "expo.inOut" }, 7.6);`);
at(`tl.fromTo(P.mb, { v: 24 }, { v: 2, duration: 0.3, ease: "expo.inOut", onUpdate: function () { document.getElementById("mb").textContent = Math.round(this.targets()[0].v) + " MB"; } }, 7.6);`);
push("#s6b .zoom", 7.5, 8, 1.05);

punch("#f3", 8.02);
at(`tl.fromTo("#sig", { strokeDashoffset: 1200 }, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut" }, 8.06);`);
push("#s6c .zoom", 8, 8.5, 1.05);

punch("#f4", 8.52);
at(`tl.fromTo("#scan", { y: 0 }, { y: 440, duration: 0.42, ease: "power1.inOut" }, 8.55);`);
at(`tl.fromTo("#scanmask", { scaleY: 0 }, { scaleY: 1, duration: 0.42, ease: "power1.inOut" }, 8.55);`);
push("#s6d .zoom", 8.5, 9, 1.05);

// S7 stat
at(`tl.fromTo("#num", { opacity: 0, scale: 1.3, filter: "blur(20px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.35, ease: "expo.out" }, 9.0);`);
at(`tl.fromTo(P.num, { v: 0 }, { v: 0.8, duration: 0.5, ease: "power3.out", onUpdate: function () { document.getElementById("numv").textContent = this.targets()[0].v.toFixed(1); } }, 9.04);`);
rise("#h7-0", 9.5); rise("#h7-1", 9.68);
push("#s7 .cam", 9, 10.25, 1.06);

// S8 end card
at(`tl.fromTo("#k8", { scale: 0.5, opacity: 0, y: -60 }, { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(1.8)" }, 10.28);`);
rise("#wm8", 10.45);
punch("#h8-0", 10.62, 1.3, 0.4); punch("#h8-1", 10.9, 1.5, 0.45);
rise("#plat", 11.45);
at(`tl.fromTo("#pill", { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)" }, 11.7);`);
at(`tl.fromTo("#pill .shine", { xPercent: -150 }, { xPercent: 350, duration: 0.7, ease: "power2.inOut" }, 12.1);`);
push("#s8 .cam", 10.25, 13, 1.04);
at(`tl.set({}, {}, ${DURATION});`);

// ---------------- markup ----------------
const scene = (id, t0, t1, bg, body) =>
  `<div id="${id}" class="clip layer" data-start="${t0}" data-duration="${n(t1 - t0)}" data-track-index="1" style="background:${bg}"><div class="cam">${body}</div></div>`;
const S = Object.fromEntries(SC.map((s) => [s[0], s]));
const sc = (id, body) => scene(...S[id], body);

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Inter Display"; font-weight: 500; src: url("assets/fonts/InterDisplay-Medium.otf") format("opentype"); }
      @font-face { font-family: "Inter Display"; font-weight: 600; src: url("assets/fonts/InterDisplay-SemiBold.otf") format("opentype"); }
      @font-face { font-family: "Inter Display"; font-weight: 700; src: url("assets/fonts/InterDisplay-Bold.otf") format("opentype"); }
      @font-face { font-family: "Inter Display"; font-weight: 800; src: url("assets/fonts/InterDisplay-ExtraBold.otf") format("opentype"); }
      @font-face { font-family: "Inter Display"; font-weight: 900; src: url("assets/fonts/InterDisplay-Black.otf") format("opentype"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.bg}; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.bg}; font-family: "Inter Display", sans-serif; color: ${C.ink}; }
      .layer { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; }
      .cam, .zoom { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 50% 50%; }
      .line { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: baseline; gap: 0.24em; font-weight: 900; letter-spacing: -0.045em; line-height: 1; white-space: nowrap; }
      .w { display: inline-block; padding: 0.06em 0.02em; }
      .grad { background: linear-gradient(100deg, ${C.b1}, ${C.b2}); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .red { color: ${C.pdf}; } .blue { color: ${C.docx}; } .mute { color: ${C.mute}; }

      /* key / icon */
      .key { position: absolute; }
      .keybase { position: absolute; left: 0; right: 0; bottom: 0; height: 93.5%; border-radius: var(--r); background: linear-gradient(#d4d4da, #c4c4cc); box-shadow: 0 30px 60px rgba(29,29,31,.16), 0 8px 18px rgba(29,29,31,.08); }
      .keytop { position: absolute; left: 0; right: 0; top: 0; height: 93.5%; border-radius: var(--r); background: linear-gradient(160deg, #ffffff, #eeeef2); box-shadow: inset 0 -3px 0 rgba(0,0,0,.05), inset 0 2px 0 #fff; overflow: hidden; }
      .keyfill { position: absolute; inset: 0; background: radial-gradient(120% 90% at 25% 15%, #5b8cff 0%, ${C.b1} 40%, ${C.b2} 100%); }
      .keyq { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 900; letter-spacing: -0.04em; }
      .ring { position: absolute; border-radius: 50%; border: 10px solid ${C.b1}; }

      /* docs */
      .doc { position: absolute; background: ${C.card}; border-radius: 26px; box-shadow: 0 40px 80px rgba(29,29,31,.12), 0 6px 16px rgba(29,29,31,.06); overflow: hidden; }
      .badge { position: absolute; left: 30px; top: 30px; padding: 8px 18px; border-radius: 12px; color: #fff; font-weight: 800; font-size: 30px; letter-spacing: 0.02em; }
      .lines { position: absolute; left: 30px; right: 30px; top: 116px; display: flex; flex-direction: column; gap: 18px; }
      .lines i { display: block; height: 14px; border-radius: 7px; background: #e6e6ea; }

      /* tiles */
      .tile { position: absolute; width: 190px; height: 240px; background: #fff; border-radius: 22px; box-shadow: 0 24px 50px rgba(29,29,31,.13); padding: 0 22px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
      .tband { margin: 0 -22px 10px; height: 70px; display: flex; align-items: center; padding-left: 22px; color: #fff; font-weight: 800; font-size: 32px; letter-spacing: -0.01em; }
      .tile i { display: block; height: 12px; border-radius: 6px; background: #e8e8ec; }
      #plate { position: absolute; left: 460px; top: 455px; width: 1000px; height: 190px; border-radius: 40px; background: rgba(255,255,255,.9); box-shadow: 0 30px 70px rgba(29,29,31,.14); }

      /* feature cuts */
      .feat { position: absolute; top: 0; height: 100%; display: flex; align-items: center; font-weight: 900; font-size: 250px; letter-spacing: -0.05em; line-height: 1; }
      .sweep { position: absolute; top: -10%; left: 0; width: 40%; height: 120%; background: linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,.95), rgba(255,255,255,0)); }
      .pill { position: absolute; left: 760px; top: 862px; width: 400px; height: 92px; border-radius: 46px; background: ${C.ink}; color: #fff; font-weight: 700; font-size: 36px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .shine { position: absolute; top: 0; left: 0; width: 30%; height: 100%; background: linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,.35), rgba(255,255,255,0)); }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
      ${sc("s1", `<div class="line" style="top:405px;font-size:270px">${words("h1", [["Due"], ["at"], ["5&nbsp;PM.", "red"]])}</div>`)}
      ${sc("s2", `${tiles}<div id="plate"></div><div class="line" style="top:470px;font-size:150px">${words("h2", [["Wrong"], ["format."]])}</div>`)}
      ${sc("s3", `<div class="line mute" style="top:330px;font-size:170px;font-weight:700">${words("h3a", [["There's"], ["a"], ["key"]])}</div>
        <div id="h3b" class="line" style="top:540px;font-size:170px;font-weight:700;color:${C.mute}">${words("h3b", [["for"], ["that."]])}</div>`)}
      ${sc("s4", `<div id="ring4" class="ring" style="left:810px;top:390px;width:300px;height:300px"></div>
        <div id="ring4b" class="ring" style="left:810px;top:390px;width:300px;height:300px;border-color:${C.b2};border-width:4px"></div>
        <div style="position:absolute;left:820px;top:400px">${key("k4", 280)}</div>
        <div style="position:absolute;left:760px;top:445px;height:230px;overflow:hidden;display:flex;font-size:200px;font-weight:800;letter-spacing:-0.05em;line-height:1.1">${"Quickey".split("").map((c, i) => `<span id="wm-${i}" class="w" style="padding:0">${c}</span>`).join("")}</div>`)}
      ${sc("s5", `<div class="zoom">
        <div class="line" style="top:90px;font-size:150px">${words("h5", [["DOCX", "blue"], ["→", "mute"], ["PDF.", "red"]])}</div>
        <div style="position:absolute;left:0;top:0;width:100%;height:100%;perspective:1600px">
          <div id="d5" class="doc" style="left:330px;top:330px;width:340px;height:440px">
            <div class="badge b-docx" style="background:${C.docx}">DOCX</div>
            <div class="badge b-pdf" style="background:${C.pdf};opacity:0">PDF</div>
            <div class="lines">${[0.62, 0.92, 0.78, 0.86, 0.6, 0.88, 0.72, 0.5].map((f, i) => `<i style="width:${f * 100}%;${i === 0 ? "height:22px;background:#2a2a2d;margin-bottom:20px" : ""}"></i>`).join("")}</div>
            <div class="sweep"></div>
          </div>
        </div>
        <div id="ring5" class="ring" style="left:860px;top:450px;width:200px;height:200px"></div>
        <div style="position:absolute;left:860px;top:445px">${key("k5", 200, true)}</div>
        <div id="chk5" style="position:absolute;left:1520px;top:300px;width:96px;height:96px;border-radius:50%;background:${C.ok};display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px rgba(52,199,89,.35)">
          <svg width="52" height="52" viewBox="0 0 52 52"><path d="M12 27 L22 37 L41 16" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
        <div class="line" style="top:860px;font-size:100px;font-weight:800">${words("h5b", [["One", "mute"], ["press.", "mute"], ["Perfect"], ["PDF.", "grad"]])}</div>
      </div>`)}
      ${sc("s6a", `<div class="zoom"><div id="f1" class="feat" style="left:170px">Merge.</div>
        <div id="m1" class="doc" style="left:1180px;top:330px;width:300px;height:400px;background:#fff"><div class="badge" style="background:${C.docx}">1</div></div>
        <div id="m3" class="doc" style="left:1180px;top:330px;width:300px;height:400px"><div class="badge" style="background:${C.b2}">3</div></div>
        ${doc("m2", 300, 400, "PDF", C.pdf, "left:1180px;top:330px")}</div>`)}
      ${sc("s6b", `<div class="zoom">${doc("cp", 320, 420, "PDF", C.pdf, "left:170px;top:300px;transform-origin:50% 100%")}
        <div id="mb" style="position:absolute;left:110px;top:760px;width:440px;text-align:center;font-weight:800;font-size:72px;letter-spacing:-0.03em;color:#1E8E4E">24 MB</div>
        <div id="f2" class="feat" style="right:130px;font-size:230px">Compress.</div></div>`)}
      ${sc("s6c", `<div class="zoom"><div id="f3" class="feat" style="left:170px">Sign.</div>
        ${doc("sg", 520, 600, "PDF", C.pdf, "left:1100px;top:240px")}
        <svg style="position:absolute;left:1130px;top:600px" width="460" height="200" viewBox="0 0 460 200">
          <line x1="20" y1="170" x2="440" y2="170" stroke="#d0d0d6" stroke-width="4" stroke-dasharray="12 10"/>
          <path id="sig" d="M30 140 C 60 40, 90 40, 80 120 C 74 170, 120 60, 150 70 C 175 78, 150 150, 185 130 C 215 112, 230 60, 250 90 C 268 118, 240 150, 280 120 C 310 98, 330 80, 350 110 C 365 132, 400 120, 430 90" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1200" stroke-dashoffset="1200"/>
        </svg></div>`)}
      ${sc("s6d", `<div class="zoom">
        <div class="doc" style="left:380px;top:300px;width:360px;height:470px">
          <div id="scanmask" style="position:absolute;inset:0;transform-origin:50% 0;background:linear-gradient(rgba(123,77,255,.10),rgba(47,107,255,.14))"></div>
          <div class="badge" style="background:${C.b2}">SCAN</div>
          <div class="lines">${[0.62, 0.92, 0.78, 0.86, 0.6, 0.88, 0.72].map((f, i) => `<i style="width:${f * 100}%;${i === 0 ? "height:22px;background:#2a2a2d;margin-bottom:20px" : ""}"></i>`).join("")}</div>
          <div id="scan" style="position:absolute;left:-10px;right:-10px;top:10px;height:8px;border-radius:4px;background:${C.b1};box-shadow:0 0 30px 8px rgba(47,107,255,.55)"></div>
        </div>
        <div id="f4" class="feat" style="right:220px">Scan.</div></div>`)}
      ${sc("s7", `<div id="num" class="line grad" style="top:210px;font-size:420px;letter-spacing:-0.02em;gap:0.03em"><span id="numv" class="w">0.0</span><span class="w" style="font-size:240px">s</span></div>
        <div class="line" style="top:720px;font-size:72px;font-weight:600;letter-spacing:-0.02em">${words("h7", [["DOCX&nbsp;to&nbsp;PDF.", "mute"], ["On&nbsp;device."]])}</div>`)}
      ${sc("s8", `<div style="position:absolute;left:870px;top:120px">${key("k8", 180, true)}</div>
        <div id="wm8" class="line" style="top:340px;font-size:56px;font-weight:700;letter-spacing:-0.02em">Quickey</div>
        <div class="line" style="top:470px;font-size:190px">${words("h8", [["Paperwork,"], ["done.", "grad"]])}</div>
        <div id="plat" class="line mute" style="top:740px;font-size:44px;font-weight:600;letter-spacing:-0.01em">Mac · Windows · iPhone</div>
        <div id="pill" class="pill">Download free<div class="shine"></div></div>`)}
    </div>
    <audio id="mix" src="assets/audio/mix.wav" data-start="0" data-duration="${DURATION}" data-track-index="9" data-volume="1"></audio>
    <script>
      const tl = gsap.timeline({ paused: true });
      const P = { mb: { v: 24 }, num: { v: 0 } };
      ${tw.join("\n      ")}
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log("wrote index.html,", tw.length, "tweens");
