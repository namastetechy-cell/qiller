// Generates index.html for the "Ravan ki pooja" Short.
// Every timing lives in T / SFX below — retime to a real voiceover by editing them,
// then run `node build.mjs`.
import { readFileSync, writeFileSync } from "node:fs";

const W = 1080, H = 1920, DURATION = 50;

// Line start times (seconds) — estimated at ~3 words/sec until the real VO lands.
const T = {
  jalta: 0.0, aarti: 2.9, jeet: 5.4, kaise: 7.9,
  bisrakh: 10.7, beta: 14.3,
  mandsaur: 16.5, damaad: 19.4, jalata: 21.3,
  kanpur: 23.8, dussehre: 28.1, shivBhakt: 29.3,
  baijnath: 32.5, gadchiroli: 36.7,
  villain: 40.6, kahan: 43.3,
  cta: 45.5, subscribe: 47.6,
};

// SFX cues: [time, file, volume]
const SFX = [
  [0.0, "whoosh", 0.7],
  [T.aarti - 0.9, "riser", 0.8],
  ...[0, 1, 2, 3, 4].map((i) => [T.aarti + 0.1 + i * 0.14, "pop", 0.55]),
  [T.aarti + 0.9, "boom", 0.9],
  [T.jeet - 0.2, "whoosh", 0.7],
  [T.jeet + 0.2, "pop", 0.6],
  [T.jeet + 1.2, "pop", 0.6],
  [T.kaise, "whoosh", 0.6],
  [T.kaise + 1.3, "click", 0.8],
  [T.bisrakh, "whoosh", 0.8],
  [T.bisrakh + 1.2, "pop", 0.6],
  [T.bisrakh + 1.6, "pop", 0.5],
  [T.beta, "pop", 0.6],
  [T.mandsaur - 0.1, "whoosh", 0.8],
  [T.mandsaur + 1.1, "pop", 0.6],
  [T.mandsaur + 1.5, "pop", 0.5],
  [T.damaad + 1.1, "boom", 1.0],
  [T.jalata + 1.6, "click", 0.8],
  [T.kanpur - 0.1, "whoosh", 0.8],
  [T.kanpur + 1.1, "pop", 0.6],
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => [T.kanpur + 1.8 + i * 0.2, "click", 0.45]),
  [T.dussehre - 1.4, "riser", 0.7],
  [T.dussehre, "pop", 0.7],
  [T.shivBhakt, "pop", 0.6],
  [T.baijnath - 0.1, "whoosh", 0.8],
  [T.baijnath + 1.1, "pop", 0.6],
  [T.baijnath + 1.6, "pop", 0.5],
  [T.gadchiroli - 0.1, "whoosh", 0.8],
  [T.gadchiroli + 1.1, "pop", 0.6],
  [T.gadchiroli + 1.6, "pop", 0.5],
  [T.gadchiroli + 2.6, "pop", 0.6],
  [T.villain - 0.1, "whoosh", 0.8],
  [T.villain + 0.6, "click", 0.8],
  [T.villain + 1.5, "click", 0.8],
  [T.kahan, "whoosh", 0.7],
  [T.cta - 0.1, "whoosh", 0.8],
  [T.cta + 0.4, "pop", 0.7],
  [T.subscribe, "ding", 0.8],
];

// India map (@svg-maps/india, viewBox 612x696). City positions projected from lat/lon:
// x = (lon - 68.18) * 20.94, y = 210.4 + (28.6 - lat) * 22.29 (fitted to state bounds).
const svg = readFileSync(new URL("./assets/map/india.svg", import.meta.url), "utf8");
const paths = [...svg.matchAll(/id="(\w+)"[\s\S]*?\sd="([^"]+)"/g)].map(([, id, d]) => ({ id, d }));
const proj = (lat, lon) => [+((lon - 68.18) * 20.94).toFixed(1), +(210.4 + (28.6 - lat) * 22.29).toFixed(1)];
const CITIES = {
  bisrakh: { name: "BISRAKH", sub: "NOIDA", state: "up", at: proj(28.57, 77.43) },
  mandsaur: { name: "MANDSAUR", sub: "MADHYA PRADESH", state: "mp", at: proj(24.07, 75.07) },
  kanpur: { name: "KANPUR", sub: "UTTAR PRADESH", state: "up", at: proj(26.45, 80.33) },
  baijnath: { name: "BAIJNATH", sub: "HIMACHAL", state: "hp", at: proj(32.05, 76.65) },
  gadchiroli: { name: "GADCHIROLI", sub: "MAHARASHTRA", state: "mh", at: proj(20.18, 80.0) },
};
const OVERVIEW = { at: [306, 290], s: 1.7 };
// City shots frame the town left of centre so its name has room on the right.
const LEAD = 50;
const ZOOM = 5.2;

// Seeded PRNG for embers (determinism).
let seed = 7;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const embers = Array.from({ length: 36 }, (_, i) => ({
  i, x: Math.round(rand() * W), size: Math.round(6 + rand() * 10), delay: +(rand() * 1.6).toFixed(2), dur: +(1.6 + rand() * 1.4).toFixed(2),
}));

const pin = (cls) => `<svg class="${cls}" viewBox="0 0 40 52"><path d="M20 0C9 0 0 9 0 20c0 14 20 32 20 32s20-18 20-32C40 9 31 0 20 0z" fill="#e3262b"/><circle cx="20" cy="19" r="8" fill="#fff"/></svg>`;

const cityLabels = Object.entries(CITIES).map(([k, c]) => `
      <div class="cityLab" id="lab-${k}" style="left:${c.at[0]}px;top:${c.at[1]}px;transform:scale(${(1 / ZOOM).toFixed(4)})">
        <div class="pinWrap" id="pin-${k}">${pin("pinSvg")}</div>
        <div class="cityName" id="name-${k}">${c.name}</div>
        <div class="citySub" id="sub-${k}">${c.sub}</div>
      </div>`).join("");

const overviewPins = Object.entries(CITIES).map(([k, c]) => `
      <div class="ovLab" style="left:${c.at[0]}px;top:${c.at[1]}px;transform:scale(${(1 / OVERVIEW.s).toFixed(4)})">
        <div class="pinWrap ovPin" id="ov-${k}">${pin("pinSvg small")}</div>
      </div>`).join("");

const camFor = ([px, py], s) => ({ x: +(W / 2 - px * s).toFixed(1), y: +(H / 2 - py * s).toFixed(1), scale: s });

// SFX file lengths; each cue gets the first audio lane that is free at its start.
const LEN = { boom: 0.8, click: 0.05, ding: 1.2, pop: 0.15, riser: 1.5, whoosh: 0.6 };
const laneEnds = [];
const audio = [...SFX].sort((a, b) => a[0] - b[0]).map(([t, f, v], i) => {
  let lane = laneEnds.findIndex((end) => end <= t);
  if (lane < 0) lane = laneEnds.push(0) - 1;
  laneEnds[lane] = t + LEN[f];
  return `<audio id="sfx-${i}" src="assets/sfx/${f}.wav" data-start="${t.toFixed(2)}" data-duration="${LEN[f]}" data-track-index="${10 + lane}" data-volume="${v}"></audio>`;
}).join("\n    ");

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="vendor/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2"); }
      @font-face { font-family: "Montserrat"; font-weight: 900; src: url("assets/fonts/montserrat-latin-900-normal.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #071d21; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Montserrat", sans-serif; font-weight: 900; text-transform: uppercase; color: #fff; }
      .layer { position: absolute; inset: 0; width: 100%; height: 100%; }
      #shake { position: absolute; inset: 0; width: 100%; height: 100%; }

      /* ---------- map ---------- */
      #sea { background: radial-gradient(ellipse at 50% 45%, #13505a 0%, #0b333a 45%, #051a1e 100%); }
      #stage { perspective: 1800px; overflow: hidden; }
      #tilt { position: absolute; inset: 0; width: 100%; height: 100%; transform-origin: 50% 50%; transform-style: preserve-3d; }
      #cam { position: absolute; left: 0; top: 0; width: 612px; height: 696px; transform-origin: 0 0; }
      #cam svg.map { position: absolute; left: 0; top: 0; width: 612px; height: 696px; overflow: visible; }
      #outline path { fill: none; stroke: #bff9ff; stroke-width: 6px; vector-effect: non-scaling-stroke; }
      #outline { filter: drop-shadow(0 0 6px #5ff4ff) drop-shadow(0 0 14px #2fd8ff); }
      #states path { fill: #7d0c0c; stroke: #3a0404; stroke-width: 1px; vector-effect: non-scaling-stroke; }
      .cityLab, .ovLab { position: absolute; width: 0; height: 0; transform-origin: 0 0; }
      .pinWrap { position: absolute; left: -26px; top: -68px; width: 52px; height: 68px; transform-origin: 50% 100%; }
      .ovPin { left: -20px; top: -52px; width: 40px; height: 52px; }
      .pinSvg { display: block; width: 100%; height: 100%; filter: drop-shadow(0 6px 6px rgba(0,0,0,.5)); }
      .cityName { position: absolute; left: 40px; top: -96px; font-size: 84px; letter-spacing: -1px; white-space: nowrap; text-shadow: 0 8px 0 rgba(0,0,0,.35), 0 0 30px rgba(0,0,0,.5); }
      .citySub { position: absolute; left: 44px; top: 6px; padding: 8px 18px; background: #0b0b0b; border-radius: 10px; font-size: 34px; font-weight: 800; letter-spacing: 1px; white-space: nowrap; }

      /* ---------- chips / headlines (screen space) ---------- */
      .chipRow { position: absolute; left: 0; right: 0; display: flex; justify-content: center; }
      .chip { display: inline-block; padding: 22px 38px; border-radius: 18px; font-size: 62px; letter-spacing: 0; line-height: 1.05; text-align: center; box-shadow: 0 14px 40px rgba(0,0,0,.45); }
      .chip.dark { background: #0b0b0b; color: #fff; }
      .chip.yellow { background: #121212; color: #ffe14d; border: 5px solid #ffe14d; }
      .chip.cyan { background: #062a30; color: #6ff6ff; border: 5px solid #5ff4ff; text-shadow: 0 0 18px rgba(95,244,255,.7); }
      .chip.green { background: #07240f; color: #4dff7c; border: 5px solid #4dff7c; text-shadow: 0 0 18px rgba(77,255,124,.6); }
      .chip.red { background: #2a0606; color: #ff4a4a; border: 5px solid #ff4a4a; }
      .head { position: absolute; left: 60px; right: 60px; text-align: center; font-size: 96px; line-height: 1.02; letter-spacing: -2px; text-shadow: 0 8px 0 rgba(0,0,0,.35); }

      /* ---------- intro fire ---------- */
      #fire { background: radial-gradient(ellipse 90% 40% at 50% 108%, rgba(255,140,20,.95) 0%, rgba(255,70,0,.65) 35%, rgba(160,20,0,.25) 60%, rgba(0,0,0,0) 80%); mix-blend-mode: screen; }
      .ember { position: absolute; bottom: -20px; border-radius: 50%; background: #ffc94d; box-shadow: 0 0 10px 4px rgba(255,120,0,.8); }
      #introTitle { top: 170px; font-size: 150px; color: #ffd400; text-shadow: 0 0 40px rgba(255,140,0,.8), 0 10px 0 #7a1d00; }

      /* ---------- text scenes ---------- */
      .panel { background: radial-gradient(ellipse at 50% 40%, #1d1d1d 0%, #090909 75%); }
      .big { position: absolute; left: 0; right: 0; text-align: center; letter-spacing: -3px; }
      #strike { position: absolute; left: 230px; width: 620px; height: 18px; top: 760px; background: #ff3b3b; transform-origin: 0 50%; box-shadow: 0 0 20px #ff3b3b; }
      #split .half { position: absolute; left: 0; right: 0; height: 50%; display: flex; align-items: center; justify-content: center; }
      #vTop { top: 0; background: linear-gradient(160deg, #3b0000, #8f0b0b); }
      #vBot { bottom: 0; background: linear-gradient(160deg, #003d16, #0a8c3a); }
      #cta { background: #ffd400; color: #0b0b0b; }
      #bubble { position: absolute; left: 140px; width: 800px; top: 360px; height: 470px; background: #0b0b0b; color: #ffd400; border-radius: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
      #bubbleTail { position: absolute; left: 230px; top: 800px; width: 0; height: 0; border-left: 70px solid transparent; border-right: 70px solid transparent; border-top: 110px solid #0b0b0b; }
      #subBtn { position: absolute; left: 190px; width: 700px; top: 1240px; height: 170px; background: #e3262b; color: #fff; border-radius: 30px; display: flex; align-items: center; justify-content: center; font-size: 78px; box-shadow: 0 16px 0 #8c1013; }
      #grain { opacity: .10; mix-blend-mode: overlay; pointer-events: none; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
     <div id="shake">
      <!-- MAP WORLD (whole video, covered by panels in text scenes) -->
      <div id="mapWorld" class="layer clip" data-start="0" data-duration="${DURATION}" data-track-index="0">
        <div id="sea" class="layer"></div>
        <div id="stage" class="layer">
          <div id="tilt" data-layout-allow-overflow>
            <div id="cam" data-layout-allow-overflow>
              <svg class="map" viewBox="0 0 612 696">
                <defs>
                  <filter id="terrain" x="-5%" y="-5%" width="110%" height="110%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" seed="11" result="n"/>
                    <feColorMatrix in="n" type="saturate" values="0" result="g"/>
                    <feBlend in="SourceGraphic" in2="g" mode="multiply" result="m"/>
                    <feComposite in="m" in2="SourceGraphic" operator="in"/>
                  </filter>
                </defs>
                <g id="outline">${paths.map((p) => `<path d="${p.d}"/>`).join("")}</g>
                <g id="states" filter="url(#terrain)">${paths.map((p) => `<path id="st-${p.id}" d="${p.d}"/>`).join("")}</g>
              </svg>${overviewPins}${cityLabels}
            </div>
          </div>
        </div>
        <div id="fire" class="layer"></div>
        <div id="embers" class="layer">${embers.map((e) => `<div class="ember" id="em${e.i}" style="left:${e.x}px;width:${e.size}px;height:${e.size}px"></div>`).join("")}</div>
        <div id="introTitle" class="head">DUSSEHRA</div>
        <div class="chipRow" style="top:400px"><div id="introChip" class="chip dark" style="font-size:48px;white-space:nowrap">POORE INDIA MEIN RAVAN DAHAN</div></div>
        <div class="chipRow" style="top:1330px"><div id="aartiChip" class="chip yellow" style="font-size:84px;white-space:nowrap">PAR YAHAN AARTI!</div></div>
        <div class="chipRow" style="top:1330px"><div id="betaChip" class="chip cyan">RAVAN KA JANMASTHAN</div></div>
        <div class="chipRow" style="top:1480px"><div id="betaChip2" class="chip yellow">GHAR KA BETA</div></div>
        <div class="chipRow" style="top:1330px"><div id="mayChip" class="chip cyan">MANDODARI KA MAAYKA</div></div>
        <div id="damaad" class="big" style="top:300px;font-size:190px;color:#ff3b3b;text-shadow:0 0 40px rgba(255,40,40,.6),0 12px 0 #3a0000">DAMAAD!</div>
        <div class="chipRow" style="top:1480px"><div id="jalaChip" class="chip red">JALATE HAIN KYA?</div></div>
        <div class="chipRow" style="top:1300px"><div id="countBox" class="chip dark" style="font-size:52px;padding:26px 44px">SAAL MEIN KHULTA HAI<div id="countNum" style="font-size:150px;color:#4dff7c;line-height:1.1">365 DIN</div></div></div>
        <div class="chipRow" style="top:300px"><div id="dussChip" class="chip yellow" style="font-size:80px">SIRF DUSSEHRE PE</div></div>
        <div class="chipRow" style="top:300px"><div id="shivChip" class="chip cyan" style="font-size:80px">SHIV BHAKT RAVAN</div></div>
        <div class="chipRow" style="top:1330px"><div id="tapChip" class="chip cyan">SHIV KI TAPASYA</div></div>
        <div class="chipRow" style="top:1330px"><div id="gondChip" class="chip dark">GOND AADIVASI</div></div>
        <div class="chipRow" style="top:1490px"><div id="purvajChip" class="chip green" style="font-size:80px">RAVAN = PURVAJ</div></div>
        <div id="kahanHead" class="head" style="top:150px;font-size:74px">DEPEND KARTA HAI <span style="color:#ffd400">AAP KAHAN KHADE HO</span></div>
      </div>

      <!-- TEXT SCENE: burai vs achhai / pooja kaise -->
      <div id="jeetScene" class="layer clip panel" data-start="${T.jeet - 0.2}" data-duration="${(T.bisrakh - T.jeet + 0.2).toFixed(2)}" data-track-index="1">
        <div id="jeetA" class="big" style="top:480px;font-size:84px;color:#bbb">DUSSEHRA MATLAB</div>
        <div id="burai" class="big" style="top:640px;font-size:190px;color:#ff3b3b">BURAI</div>
        <div id="strike"></div>
        <div id="achhai" class="big" style="top:880px;font-size:150px;color:#4dff7c;text-shadow:0 0 40px rgba(77,255,124,.5)">ACHHAI</div>
        <div id="jeetB" class="big" style="top:1060px;font-size:84px;color:#fff">KI JEET</div>
        <div id="poojaA" class="big" style="top:560px;font-size:110px">TOH RAVAN KI</div>
        <div id="poojaB" class="big" style="top:700px;font-size:240px;color:#ffd400;text-shadow:0 12px 0 #5a4a00">POOJA</div>
        <div class="chipRow" style="top:1060px"><div id="kaiseChip" class="chip red" style="font-size:120px">KAISE?!</div></div>
      </div>

      <!-- TEXT SCENE: villain vs hero -->
      <div id="split" class="layer clip" data-start="${T.villain - 0.1}" data-duration="${(T.kahan - T.villain + 0.1).toFixed(2)}" data-track-index="1">
        <div id="vTop" class="half"><div id="vWord" style="font-size:200px;color:#ff5a5a;letter-spacing:-4px">VILLAIN</div></div>
        <div id="vBot" class="half"><div id="hWord" style="font-size:230px;color:#7dffa0;letter-spacing:-4px">HERO</div></div>
        <div id="ya" style="position:absolute;left:390px;top:880px;width:300px;height:160px;background:#0b0b0b;border-radius:80px;display:flex;align-items:center;justify-content:center;font-size:96px">YA</div>
      </div>

      <!-- CTA -->
      <div id="cta" class="layer clip" data-start="${T.cta - 0.1}" data-duration="${(DURATION - T.cta + 0.1).toFixed(2)}" data-track-index="1">
        <div id="bubbleWrap" class="layer">
          <div id="bubble"><div style="font-size:70px;color:#fff">AAPKA</div><div style="font-size:200px;letter-spacing:-6px;text-transform:none">WHY?</div></div>
          <div id="bubbleTail"></div>
        </div>
        <div id="ctaLine" class="big" style="top:960px;font-size:76px;line-height:1.1">COMMENT KARO<div style="font-size:56px;margin-top:14px">NEXT VIDEO USI PE!</div></div>
        <div id="subBtn"><span id="subA">SUBSCRIBE</span><span id="subB" style="position:absolute">SUBSCRIBED</span></div>
        <div id="brand" class="big" style="top:1450px;font-size:64px;letter-spacing:2px;text-transform:none">Whysplained</div>
      </div>
     </div>

      <svg id="grain" class="layer" viewBox="0 0 ${W} ${H}"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3"/></filter><rect width="100%" height="100%" filter="url(#gr)"/></svg>
    </div>

    ${audio}

    <script>
      const T = ${JSON.stringify(T)};
      const CITIES = ${JSON.stringify(CITIES)};
      const ZOOM = ${ZOOM};
      const cam = (k, s) => { const [px, py] = k === "ov" ? ${JSON.stringify(OVERVIEW.at)} : [CITIES[k].at[0] + ${LEAD}, CITIES[k].at[1]]; return { x: ${W / 2} - px * s, y: ${H / 2} - py * s, scale: s }; };
      const ORANGE = "#f5a21b", CRIMSON = "#7d0c0c";
      const tl = gsap.timeline({ paused: true });

      // reusable reveals
      const pop = (sel, t, from = 0.4) => tl.fromTo(sel, { scale: from, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.2)" }, t);
      const out = (sel, t, d = 0.2) => tl.to(sel, { opacity: 0, duration: d, ease: "power1.in" }, t);
      const wipe = (sel, t) => tl.fromTo(sel, { clipPath: "inset(0% 100% 0% 0%)", opacity: 1 }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.4, ease: "power2.out" }, t);
      const shake = (t, amt = 18) => tl.fromTo("#shake", { x: 0, y: 0 }, { keyframes: [{ x: amt, y: -amt / 2 }, { x: -amt, y: amt / 2 }, { x: amt / 2, y: amt / 3 }, { x: 0, y: 0 }], duration: 0.32, ease: "none", immediateRender: false }, t);

      // hide all screen-space overlays initially
      gsap.set("#introChip,#aartiChip,#betaChip,#betaChip2,#mayChip,#damaad,#jalaChip,#countBox,#dussChip,#shivChip,#tapChip,#gondChip,#purvajChip,#kahanHead,.pinWrap,.cityName,.citySub,#poojaA,#poojaB,#kaiseChip,#subB", { opacity: 0 });

      // ---------- 1. Intro: India burns, then the twist ----------
      tl.set("#cam", cam("ov", 1.45), 0);
      tl.to("#cam", { ...cam("ov", ${OVERVIEW.s}), duration: T.aarti, ease: "power1.out" }, 0);
      tl.fromTo("#introTitle", { scale: 1.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.1);
      wipe("#introChip", 0.6);
      tl.fromTo("#fire", { opacity: 0.6 }, { opacity: 1, duration: 0.18, yoyo: true, repeat: 15, ease: "sine.inOut" }, 0);
      ${embers.map((e) => `tl.fromTo("#em${e.i}", { y: 0, opacity: 0 }, { y: -${700 + (e.i % 5) * 120}, opacity: 1, duration: ${e.dur}, ease: "power1.out" }, ${e.delay});`).join("\n      ")}
      tl.to("#states path", { fill: "#a3140c", duration: 0.6 }, 0.2);
      // twist: fire dies, map cools, pins drop
      tl.to("#fire,#embers", { opacity: 0, duration: 0.4 }, T.aarti);
      out("#introTitle,#introChip", T.aarti);
      tl.to("#states path", { fill: CRIMSON, duration: 0.4 }, T.aarti);
      ["bisrakh","mandsaur","kanpur","baijnath","gadchiroli"].forEach((k, i) => {
        tl.fromTo("#ov-" + k, { y: -60, opacity: 0, scale: 0.4 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.5)" }, T.aarti + 0.1 + i * 0.14);
      });
      pop("#aartiChip", T.aarti + 0.9, 1.8); shake(T.aarti + 0.9, 22);
      tl.to("#cam", { ...cam("ov", 1.85), duration: 2.4, ease: "none" }, T.aarti);

      out("#aartiChip", T.jeet - 0.2, 0.1);
      // ---------- 2. Burai / achhai, pooja kaise ----------
      wipe("#jeetA", T.jeet);
      pop("#burai", T.jeet + 0.2);
      tl.fromTo("#strike", { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease: "power2.out" }, T.jeet + 0.7);
      pop("#achhai", T.jeet + 1.2); wipe("#jeetB", T.jeet + 1.5);
      out("#jeetA,#burai,#strike,#achhai,#jeetB", T.kaise - 0.15, 0.15);
      wipe("#poojaA", T.kaise);
      tl.fromTo("#poojaB", { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" }, T.kaise + 0.4);
      pop("#kaiseChip", T.kaise + 1.3, 1.6); shake(T.kaise + 1.3, 10);
      tl.to("#poojaB", { scale: 1.08, duration: 2.6, ease: "none" }, T.kaise + 0.8);
      tl.to(".ovPin", { opacity: 0, duration: 0.1 }, T.bisrakh - 0.3);

      // ---------- city fly-ins ----------
      // fly(from, to, t): swoop out-and-in between two focus points, tilt the map, swap highlighted state
      function fly(from, to, t, prevState) {
        const a = from === "ov" ? ${JSON.stringify(OVERVIEW.at)} : CITIES[from].at, b = CITIES[to].at;
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const midS = from === "ov" ? 2.6 : 3.0;
        tl.to("#cam", { x: ${W / 2} - mid[0] * midS, y: ${H / 2} - mid[1] * midS, scale: midS, duration: 0.5, ease: "power2.in" }, t);
        tl.to("#cam", { ...cam(to, ZOOM), duration: 0.7, ease: "power3.out" }, t + 0.5);
        tl.to("#cam", { ...cam(to, ZOOM * 1.08), duration: 3.0, ease: "none" }, t + 1.2);
        tl.to("#tilt", { rotationX: 28, duration: 1.2, ease: "power2.inOut" }, t);
        if (prevState && prevState !== CITIES[to].state) tl.to("#st-" + prevState, { fill: CRIMSON, duration: 0.5 }, t);
        tl.to("#st-" + CITIES[to].state, { fill: ORANGE, duration: 0.6 }, t + 0.4);
        tl.fromTo("#pin-" + to, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "bounce.out" }, t + 1.1);
        wipe("#name-" + to, t + 1.2);
        pop("#sub-" + to, t + 1.6);
      }
      function leave(k, t) { out("#pin-" + k + ",#name-" + k + ",#sub-" + k, t, 0.15); }

      // Bisrakh
      fly("ov", "bisrakh", T.bisrakh, null);
      wipe("#betaChip", T.bisrakh + 2.0);
      pop("#betaChip2", T.beta);
      leave("bisrakh", T.mandsaur - 0.2); out("#betaChip,#betaChip2", T.mandsaur - 0.2);

      // Mandsaur
      fly("bisrakh", "mandsaur", T.mandsaur, "up");
      wipe("#mayChip", T.mandsaur + 2.0);
      tl.fromTo("#damaad", { scale: 2.4, opacity: 0, rotation: -8 }, { scale: 1, opacity: 1, rotation: -4, duration: 0.3, ease: "power4.out" }, T.damaad + 1.1);
      shake(T.damaad + 1.1, 26);
      pop("#jalaChip", T.jalata + 1.6);
      leave("mandsaur", T.kanpur - 0.2); out("#mayChip,#damaad,#jalaChip", T.kanpur - 0.2);

      // Kanpur: 365 -> 1 counter
      fly("mandsaur", "kanpur", T.kanpur, "mp");
      pop("#countBox", T.kanpur + 1.5);
      const counter = { v: 365 };
      tl.to(counter, { v: 1, duration: 1.6, ease: "power2.in", onUpdate: () => {
        const n = Math.max(1, Math.round(counter.v));
        document.getElementById("countNum").textContent = n + " DIN";
      } }, T.kanpur + 1.8);
      tl.fromTo("#countNum", { scale: 1 }, { scale: 1.25, duration: 0.15, yoyo: true, repeat: 1 }, T.kanpur + 3.4);
      pop("#dussChip", T.dussehre, 1.6);
      out("#dussChip", T.shivBhakt - 0.15, 0.15);
      pop("#shivChip", T.shivBhakt);
      leave("kanpur", T.baijnath - 0.2); out("#countBox,#shivChip", T.baijnath - 0.2);

      // Baijnath
      fly("kanpur", "baijnath", T.baijnath, "up");
      wipe("#tapChip", T.baijnath + 2.0);
      leave("baijnath", T.gadchiroli - 0.2); out("#tapChip", T.gadchiroli - 0.2);

      // Gadchiroli
      fly("baijnath", "gadchiroli", T.gadchiroli, "hp");
      wipe("#gondChip", T.gadchiroli + 1.9);
      pop("#purvajChip", T.gadchiroli + 2.6);
      leave("gadchiroli", T.villain - 0.2); out("#gondChip,#purvajChip", T.villain - 0.2);

      // ---------- villain ya hero ----------
      tl.fromTo("#vTop", { yPercent: -100 }, { yPercent: 0, duration: 0.35, ease: "power3.out" }, T.villain - 0.1);
      tl.fromTo("#vBot", { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power3.out" }, T.villain - 0.1);
      pop("#vWord", T.villain + 0.6, 1.8);
      pop("#ya", T.villain + 1.0);
      pop("#hWord", T.villain + 1.5, 1.8);
      // meanwhile the map resets to the overview behind the split
      tl.set("#cam", cam("ov", 1.6), T.villain + 0.4);
      tl.set("#tilt", { rotationX: 0 }, T.villain + 0.4);
      tl.set("#st-up,#st-mp,#st-hp,#st-mh", { fill: ORANGE }, T.villain + 0.4);
      tl.set(".ovPin", { opacity: 1, y: 0, scale: 1 }, T.villain + 0.4);
      tl.to("#cam", { ...cam("ov", 1.75), duration: 2.2, ease: "none" }, T.kahan);
      tl.fromTo(".ovPin", { scale: 1 }, { scale: 1.3, duration: 0.4, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, T.kahan + 0.3);
      wipe("#kahanHead", T.kahan + 0.2);

      // ---------- CTA ----------
      tl.fromTo("#bubbleWrap", { scale: 0.3, opacity: 0, rotation: -6 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.45, ease: "back.out(2)" }, T.cta + 0.4);
      wipe("#ctaLine", T.cta + 1.0);
      tl.fromTo("#subBtn", { y: 300, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "back.out(1.8)" }, T.cta + 1.4);
      tl.fromTo("#subBtn", { scale: 1 }, { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.inOut", immediateRender: false }, T.subscribe);
      tl.to("#subBtn", { backgroundColor: "#2b2b2b", duration: 0.1 }, T.subscribe + 0.12);
      tl.set("#subA", { opacity: 0 }, T.subscribe + 0.12); tl.set("#subB", { opacity: 1 }, T.subscribe + 0.12);
      wipe("#brand", T.cta + 1.8);

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log(`index.html written: ${paths.length} states, ${SFX.length} sfx cues, ${DURATION}s`);
