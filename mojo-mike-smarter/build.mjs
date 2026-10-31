// Mojo Mike Lessons — "5 signs you're smarter than you think" (9:16, ~41 s). Builds index.html (a HyperFrames composition) from
// lines.json (script + pose per line), timing.json (line starts, written by tools/audio.py) and voice/words.json (word timings).
// Character: the six poses cut from the supplied sticker sheet (assets/poses). Captions: word-by-word, inside the Shorts safe band.
import fs from 'node:fs';

const lines = JSON.parse(fs.readFileSync('lines.json', 'utf8'));
const { VO, DUR, END } = JSON.parse(fs.readFileSync('timing.json', 'utf8'));
const words = JSON.parse(fs.readFileSync('voice/words.json', 'utf8'));
const POSES = ['happy', 'sad', 'angry', 'surprised', 'cool', 'love'];
const BG = ['#ffd84d', '#8ec5ff', '#7ed9a6', '#ffb38a', '#c9a8ff', '#ffd84d', '#ff8a8a', '#ff9ec4'];
const TITLES = [null, 'You doubt yourself', "You're curious", 'You talk to yourself', 'You say "I don\'t know"', "You're funny", null, null];
const f = x => (+x).toFixed(3);
const st = id => VO[id], en = id => VO[id] + DUR[id];
const nextStart = i => (i < lines.length - 1 ? VO[lines[i + 1].id] : END);
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

let html = '', htmlSc = '', htmlCap = '', js = '', track = 10;
// ── per-scene background colour washes (crossfaded clips)
lines.forEach((L, i) => {
  const a = Math.max(0, st(L.id) - .3), b = i < lines.length - 1 ? nextStart(i) + .1 : END;
  html += `      <div id="bg-${i}" class="clip bg" data-start="${f(a)}" data-duration="${f(b - a)}" data-track-index="1" style="--c:${BG[i]}"></div>\n`;
  if (i) js += `      tl.fromTo("#bg-${i}", { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power1.out" }, ${f(a)});\n`;
});
// ── per-scene title cards and props
const scene = (i, inner, a, b) => { htmlSc += `      <div id="sc-${i}" class="clip scene" data-start="${f(a)}" data-duration="${f(b - a)}" data-track-index="${track++}">\n${inner}      </div>\n`; };
lines.forEach((L, i) => {
  const a = st(L.id) - .15, b = i < lines.length - 1 ? nextStart(i) - .15 : END;
  let inner = '';
  if (i === 0) inner += `        <div class="hook"><span class="hk">5 signs</span><br>you're smarter<br>than you think</div>\n        <div class="q q1">?</div><div class="q q2">?</div><div class="q q3">?</div>\n`;
  if (TITLES[i]) inner += `        <div class="title"><div class="num">${i}</div><div class="tt">${esc(TITLES[i])}</div></div>\n`;
  if (i === 1) inner += `        <div class="bub think" style="left:70px;top:560px">am I<br>smart?</div>\n`;
  if (i === 2) inner += ['why?', 'why?', 'why?'].map((w, k) => `        <div class="bub small why${k}">${w}</div>\n`).join('');
  if (i === 3) inner += `        <div class="bub say" style="left:700px;top:560px">keys...<br>keys...</div>\n`;
  if (i === 4) inner += `        <div class="bub say" style="left:60px;top:610px">I don't<br>know...</div>\n        <div class="bulb"><div class="glass"></div><div class="base"></div></div>\n`;
  if (i === 5) inner += `        <div class="ha ha0">HA!</div><div class="ha ha1">haha</div><div class="ha ha2">HA!</div>\n`;
  if (i === 6) inner += `        <div class="six">#6?!</div>\n`;
  if (i === 7) inner += `        <div class="brand2">Mojo Mike Lessons</div>\n        <div class="sub"><div class="subbtn">SUBSCRIBE</div><div class="cursor"></div></div>\n`;
  scene(i, inner, a, b);
  if (TITLES[i] || i === 0) js += `      tl.fromTo("#sc-${i} ${i ? '.title' : '.hook'}", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: "back.out(2)" }, ${f(a + .05)});\n`;
  if (TITLES[i]) js += `      tl.fromTo("#sc-${i} .num", { rotation: -25 }, { rotation: 0, duration: 0.5, ease: "back.out(3)" }, ${f(a + .1)});\n`;
});
// prop choreography (times from word timings)
const wt = (id, w, k = 0) => { let n = 0; for (const x of words[id]) if (x[0].toLowerCase().replace(/[^a-z']/g, '').startsWith(w) && n++ === k) return VO[id] + x[1]; throw new Error(w + ' not in ' + id); };
js += `      tl.fromTo("#sc-0 .q", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(3)", stagger: 0.25 }, ${f(st('l1') + .6)});\n`;
js += `      tl.to("#sc-0 .q", { y: -26, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: 3, stagger: 0.2 }, ${f(st('l1') + 1.1)});\n`;
js += `      tl.fromTo("#sc-1 .think", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)" }, ${f(wt('l2', 'doubt'))});\n`;
js += `      tl.fromTo("#sc-2 .small", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(3)", stagger: 0.35 }, ${f(wt('l3', 'asking'))});\n`;
js += `      tl.fromTo("#sc-3 .say", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)" }, ${f(wt('l4', 'saying'))});\n`;
js += `      tl.fromTo("#sc-4 .say", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)" }, ${f(wt('l5', 'i', 0) + .2)});\n`;
js += `      tl.fromTo("#sc-4 .bulb", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)" }, ${f(wt('l5', 'learning'))});\n`;
js += `      tl.fromTo("#sc-4 .glass", { backgroundColor: "#fff7c2" }, { backgroundColor: "#ffd400", duration: 0.25, yoyo: true, repeat: 3 }, ${f(wt('l5', 'learning') + .3)});\n`;
js += `      tl.fromTo("#sc-5 .ha", { scale: 0, opacity: 0, rotation: -20 }, { scale: 1, opacity: 1, rotation: 0, duration: 0.3, ease: "back.out(3)", stagger: 0.3 }, ${f(wt('l6', 'funny'))});\n`;
js += `      tl.fromTo("#sc-6 .six", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(3)" }, ${f(st('l7') + .2)});\n`;
js += `      tl.to("#sc-6 .six", { x: 10, duration: 0.05, yoyo: true, repeat: 9, ease: "none" }, ${f(st('l7') + .6)});\n`;
js += `      tl.fromTo("#sc-7 .brand2", { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" }, ${f(st('l8') + .1)});\n`;
js += `      tl.fromTo("#sc-7 .sub", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)" }, ${f(st('l8') + .2)});\n`;
js += `      tl.fromTo("#sc-7 .cursor", { x: 160, y: 140, opacity: 0 }, { x: 0, y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, ${f(st('l8') + .6)});\n`;
js += `      tl.to("#sc-7 .subbtn", { scale: 0.9, duration: 0.08, yoyo: true, repeat: 1 }, ${f(st('l8') + 1.15)});\n`;
// ── progress dots (one per sign), shown only while the signs are counted
js += `      tl.set("#pips", { opacity: 0 }, 0);\n      tl.to("#pips", { opacity: 1, duration: 0.3 }, ${f(st('l2') - .15)});\n      tl.to("#pips", { opacity: 0, duration: 0.3 }, ${f(st('l7') - .15)});\n`;
for (let k = 1; k <= 5; k++) js += `      tl.to("#dot-${k}", { backgroundColor: "#1d1d1f", scale: 1.25, duration: 0.25, ease: "back.out(3)" }, ${f(st('l' + (k + 1)) - .1)});\n`;
// ── the character: pose swaps with a pop, idle bob throughout
lines.forEach((L, i) => {
  const t = i ? st(L.id) - .12 : 0;
  for (const p of POSES) js += `      tl.set("#pose-${p}", { opacity: ${p === L.pose ? 1 : 0} }, ${f(t)});\n`;
  js += `      tl.fromTo("#charPop", { scale: 0.8, y: 40, rotation: ${i % 2 ? 4 : -4} }, { scale: 1, y: 0, rotation: 0, duration: 0.5, ease: "back.out(2.4)", immediateRender: ${i === 0} }, ${f(t)});\n`;
});
const bobs = Math.floor((END - .5) / .9);
js += `      tl.to("#charBob", { y: -18, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: ${bobs - (bobs % 2 ? 0 : 1)} }, 0.5);\n`;
js += `      tl.to("#charSway", { rotation: 2.5, duration: 1.7, ease: "sine.inOut", yoyo: true, repeat: ${Math.floor((END - 1) / 1.7)} }, 1);\n`;
js += `      tl.to("#charPop", { scale: 0.92, y: 10, duration: 0.8, ease: "power2.inOut" }, ${f(END - 1.1)});\n`;
// ── captions: up to 4 words per card (new card at sentence breaks); the spoken word lights up yellow
let ci = 0;
lines.forEach((L, i) => {
  const ws = words[L.id], chunks = []; let cur = [];
  ws.forEach((w, k) => { cur.push(w); if (cur.length >= 4 || /[.?!,:]$/.test(w[0]) && cur.length >= 2 || k === ws.length - 1) { chunks.push(cur); cur = []; } });
  chunks.forEach((c, k) => {
    const a = VO[L.id] + c[0][1] - .06, b = k < chunks.length - 1 ? VO[L.id] + chunks[k + 1][0][1] - .06 : Math.min(en(L.id) + .2, nextStart(i) - .06);
    htmlCap += `      <div id="cap-${ci}" class="clip cap" data-start="${f(a)}" data-duration="${f(b - a)}" data-track-index="${track++}"><div class="capRow"><div class="box">${c.map((w, j) => `<span id="w-${ci}-${j}" class="w">${esc(w[0])}</span>`).join(' ')}</div></div></div>\n`;
    js += `      tl.fromTo("#cap-${ci} .box", { scale: 0.86, y: 14 }, { scale: 1, y: 0, duration: 0.18, ease: "back.out(2.5)" }, ${f(a)});\n`;
    c.forEach((w, j) => { js += `      tl.fromTo("#w-${ci}-${j}", { color: "#ffffff", scale: 1 }, { color: "#ffd400", scale: 1.12, duration: 0.08, ease: "power2.out" }, ${f(VO[L.id] + w[1])});\n`;
      const nx = j < c.length - 1 ? c[j + 1][1] : (k < chunks.length - 1 ? chunks[k + 1][0][1] : w[2] + .15);
      js += `      tl.to("#w-${ci}-${j}", { color: "#ffffff", scale: 1, duration: 0.08 }, ${f(VO[L.id] + Math.max(w[1] + .1, nx - .02))});\n`; });
    ci++;
  });
});

const out = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <script src="assets/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Montserrat"; font-weight: 800; src: url("assets/fonts/montserrat-latin-800-normal.woff2") format("woff2"); }
      @font-face { font-family: "Montserrat"; font-weight: 900; src: url("assets/fonts/montserrat-latin-900-normal.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1080px; height: 1920px; overflow: hidden; background: #fff4de; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: #fff4de; font-family: "Montserrat", sans-serif; }
      .bg { position: absolute; inset: 0; background: radial-gradient(circle at 50% 42%, #fffaf0 0 30%, var(--c) 78%); }
      .dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(0,0,0,.07) 3px, transparent 3.5px); background-size: 46px 46px; }
      .brand { position: absolute; top: 96px; left: 50%; transform: translateX(-50%); background: #1d1d1f; color: #fff; font-weight: 900; font-size: 34px; letter-spacing: 3px; padding: 14px 30px; border-radius: 40px; text-transform: uppercase; white-space: nowrap; }
      .scene { position: absolute; inset: 0; }
      .hook { position: absolute; top: 210px; left: 60px; right: 60px; text-align: center; font-weight: 900; font-size: 84px; line-height: 1.02; color: #1d1d1f; text-transform: uppercase; }
      .hook .hk { display: inline-block; background: #1d1d1f; color: #ffd400; padding: 6px 26px; border-radius: 18px; margin-bottom: 10px; }
      .title { position: absolute; top: 230px; left: 70px; right: 70px; display: flex; align-items: center; justify-content: center; gap: 26px; }
      .num { flex: none; width: 150px; height: 150px; border-radius: 50%; background: #1d1d1f; color: #ffd400; font-weight: 900; font-size: 104px; line-height: 150px; text-align: center; box-shadow: 0 10px 0 rgba(0,0,0,.18); }
      .tt { font-weight: 900; font-size: 70px; line-height: 1.02; color: #1d1d1f; text-transform: uppercase; max-width: 720px; }
      .pips { position: absolute; top: 450px; left: 50%; transform: translateX(-50%); display: flex; gap: 22px; }
      .pip { width: 26px; height: 26px; border-radius: 50%; background: rgba(0,0,0,.16); }
      #char { position: absolute; left: 540px; top: 1190px; width: 0; height: 0; }
      #charBob, #charSway, #charPop { position: absolute; left: 0; top: 0; transform-origin: 0 0; }
      #charPop { transform-origin: 0 -300px; }
      .pose { position: absolute; bottom: 0; left: 50%; height: 660px; transform: translateX(-50%); opacity: 0; filter: drop-shadow(0 18px 18px rgba(0,0,0,.22)); }
      .shadow { position: absolute; left: -190px; top: -26px; width: 380px; height: 52px; border-radius: 50%; background: rgba(0,0,0,.16); }
      .bub { position: absolute; background: #fff; color: #1d1d1f; font-weight: 900; font-size: 54px; line-height: 1.05; text-align: center; padding: 24px 32px; border-radius: 40px; border: 6px solid #1d1d1f; box-shadow: 0 10px 0 rgba(0,0,0,.15); }
      .bub.small { font-size: 46px; padding: 14px 24px; }
      .why0 { left: 70px; top: 640px; } .why1 { left: 760px; top: 600px; } .why2 { left: 120px; top: 900px; }
      .q { position: absolute; font-weight: 900; font-size: 140px; color: #1d1d1f; }
      .q1 { left: 120px; top: 640px; } .q2 { left: 860px; top: 700px; } .q3 { left: 180px; top: 930px; }
      .bulb { position: absolute; left: 790px; top: 560px; width: 150px; height: 220px; }
      .glass { position: absolute; left: 0; top: 0; width: 150px; height: 150px; border-radius: 50%; background: #fff7c2; border: 7px solid #1d1d1f; }
      .base { position: absolute; left: 42px; top: 150px; width: 66px; height: 56px; border-radius: 6px 6px 18px 18px; background: #9aa0a8; border: 7px solid #1d1d1f; }
      .ha { position: absolute; font-weight: 900; color: #1d1d1f; font-size: 92px; }
      .ha0 { left: 90px; top: 640px; } .ha1 { left: 760px; top: 620px; font-size: 70px; } .ha2 { left: 780px; top: 900px; }
      .six { position: absolute; top: 230px; left: 0; right: 0; text-align: center; font-weight: 900; font-size: 190px; color: #d6283b; -webkit-text-stroke: 6px #1d1d1f; }
      .brand2 { position: absolute; top: 200px; left: 60px; right: 60px; text-align: center; font-weight: 900; font-size: 80px; line-height: 1; color: #1d1d1f; text-transform: uppercase; white-space: nowrap; }
      .sub { position: absolute; left: 340px; top: 380px; }
      .subbtn { background: #e62117; color: #fff; font-weight: 900; font-size: 56px; padding: 22px 46px; border-radius: 22px; box-shadow: 0 10px 0 rgba(0,0,0,.2); }
      .cursor { position: absolute; left: 300px; top: 60px; width: 0; height: 0; border-left: 34px solid transparent; border-right: 34px solid transparent; border-bottom: 80px solid #1d1d1f; transform: rotate(-30deg); }
      .cap { position: absolute; inset: 0; }
      .capRow { position: absolute; left: 90px; right: 150px; top: 1350px; height: 0; display: flex; justify-content: center; align-items: center; }
      .box { max-width: 840px; text-align: center; font-weight: 900; font-size: 76px; line-height: 1.1; color: #fff; -webkit-text-stroke: 9px #1d1d1f; paint-order: stroke fill; text-transform: uppercase; text-shadow: 0 8px 0 rgba(0,0,0,.25); }
      .w { display: inline-block; margin: 0 .1em; transform-origin: 50% 70%; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${f(END)}" data-width="1080" data-height="1920">
${html}      <div class="dots"></div>
      <div class="brand">Mojo Mike Lessons</div>
      <div id="pips" class="pips">${[1, 2, 3, 4, 5].map(k => `<div id="dot-${k}" class="pip"></div>`).join('')}</div>
      <div id="char"><div class="shadow"></div><div id="charBob"><div id="charSway"><div id="charPop">
${POSES.map(p => `        <img id="pose-${p}" class="pose" src="assets/poses/${p}.png" alt="" />`).join('\n')}
      </div></div></div></div>
${htmlSc}${htmlCap}      <audio id="mix" src="assets/mix.wav" data-start="0" data-duration="${f(END)}" data-track-index="2" data-volume="1"></audio>
    </div>
    <script>
      window.__timelines = window.__timelines || {};
      const tl = gsap.timeline({ paused: true });
${js}      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync('index.html', out);
console.log('index.html', ci, 'caption cards, END', END);
