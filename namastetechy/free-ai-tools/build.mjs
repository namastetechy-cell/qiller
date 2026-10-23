// "5 free AI tools" long-form video, 16:9, Bold Poster frame preset, on the creator's
// voiceover (input/voiceover.mp3). No SFX. Every beat is anchored to the measured start of
// its script line (words.json from Whisper + align.py + retime.py).
// usage: node build.mjs   -> index.html
import { readFileSync, writeFileSync } from "node:fs";

const W = 1920, H = 1080, DURATION = 342.75;
const C = { bg: "#FFFFFF", dark: "#1C1410", red: "#D8000F", light: "#F5F2EF" };
const STACK = "0.03em 0.03em 0 rgba(28,20,16,.25), 0.06em 0.06em 0 rgba(28,20,16,.2), 0.09em 0.09em 0 rgba(28,20,16,.15)";
const { words, lines } = JSON.parse(readFileSync(new URL("./words.json", import.meta.url), "utf8"));

// ---------- timing helpers ----------
const lineWords = lines.map((_, i) => words.filter((w) => w.line === i));
const L = (i) => lineWords[i][0].start;                                // line start
const LE = (i) => lineWords[i][lineWords[i].length - 1].end;          // line end
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9₹,]/g, "");
const wt = (i, tok, nth = 0) => {                                      // start of a word in line i
  const hits = lineWords[i].filter((w) => norm(w.text).startsWith(norm(tok)));
  if (!hits.length) throw new Error(`word "${tok}" not in line ${i}: ${lines[i]}`);
  return hits[Math.min(nth, hits.length - 1)].start;
};
const r2 = (t) => +t.toFixed(2);

// ---------- builders ----------
const parts = [], T = [];
const tw = (s) => T.push(s);
let uid = 0;
const id = (p) => `${p}${uid++}`;
const popIn = (sel, t, from = 1.6, rot = 0) => tw(`tl.fromTo("${sel}", { scale: ${from}, opacity: 0${rot ? `, rotation: ${rot - 8}` : ""} }, { scale: 1, opacity: 1${rot ? `, rotation: ${rot}` : ""}, duration: 0.32, ease: "back.out(2)" }, ${r2(t)});`);
const wipe = (sel, t, d = 0.45) => tw(`tl.fromTo("${sel}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: ${d}, ease: "power2.out" }, ${r2(t)});`);
const rise = (sel, t) => tw(`tl.fromTo("${sel}", { yPercent: 110 }, { yPercent: 0, duration: 0.45, ease: "power3.out" }, ${r2(t)});`);
const fadeUp = (sel, t, stagger = 0) => tw(`tl.fromTo("${sel}", { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: "power3.out"${stagger ? `, stagger: ${stagger}` : ""} }, ${r2(t)});`);
const strike = (sel, t) => tw(`tl.fromTo("${sel}", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${r2(t)});`);
const scene = (name, at, end, cls, inner, track = 2) => {
  parts.push(`
      <div id="${name}" class="clip layer ${cls}" data-start="${r2(at)}" data-duration="${r2(end - at)}" data-track-index="${track}">${inner}
      </div>`);
};
// browser-style poster frame on the right with a sequence of media clips
const FR = { x: 770, y: 130, w: 1080, h: 608 };
const frame = (media, label = "") => {
  const items = media.map((m) => m.img
    ? `<div id="${id("m")}" class="clip mwin" data-start="${r2(m.from)}" data-duration="${r2(m.to - m.from)}" data-track-index="1"><img src="assets/broll/${m.src}" class="mfill"></div>`
    : `<div class="mwin"><video id="${id("v")}" class="clip mfill" src="assets/broll/${m.src}" muted playsinline data-start="${r2(m.from)}" data-duration="${r2(m.to - m.from)}" data-track-index="1"${m.offset ? ` data-media-start="${m.offset}"` : ""}></video></div>`).join("\n          ");
  return `
        <div class="frameOuter" style="left:${FR.x - 14}px;top:${FR.y - 14}px;width:${FR.w + 28}px;height:${FR.h + 28}px"></div>
        <div class="frame" style="left:${FR.x}px;top:${FR.y}px;width:${FR.w}px;height:${FR.h}px">
          ${items}
        </div>${label ? `<div class="frameLabel">${label}</div>` : ""}`;
};
const keycaps = (keys) => keys.map((k) => `<span class="key">${k}</span>`).join(`<span class="plus">+</span>`);
const grid = (rows, cols = "1fr 1fr", cls = "") => `<div class="fin ${cls}" style="grid-template-columns:${cols}">${rows.map((r) => r.map((c) => `<div class="cell">${c}</div>`).join("")).join("")}</div>`;

// red title slam at the start of each tool chapter
const CHAPTERS = [];
const titleSlam = (n, name, at) => {
  CHAPTERS.push({ n, name, at });
  const s = id("title");
  scene(s, at, at + 1.5, "redPanel center", `
        <div class="col"><div class="eyebrow static light">Tool</div>
          <div id="${s}n" class="disp white shadow" style="font-size:330px;line-height:1">0${n}</div>
          <div id="${s}t" class="disp white" style="font-size:84px;margin-top:-10px">${name}</div></div>`, 4);
  tw(`tl.fromTo("#${s}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power3.out" }, ${r2(at)});`);
  popIn(`#${s}n`, at + 0.12, 1.8, -6); wipe(`#${s}t`, at + 0.4);
  tw(`tl.to("#${s}", { clipPath: "inset(0% 0% 0% 100%)", duration: 0.2, ease: "power3.in" }, ${r2(at + 1.3)});`);
};
const T0 = (t) => t + 1.35;  // first entrance after a title slam

// ================= INTRO =================
{ // the math
  const s = "s-math", end = L(5);
  scene(s, 0, end, "", `
        <div id="mEye" class="eyebrow" style="left:120px;top:110px">Monthly subscriptions</div>
        <div class="mask" style="left:116px;top:150px"><div id="m1" class="disp" style="font-size:120px">Thoda simple math</div></div>
        <div id="mGrid" style="position:absolute;left:120px;top:360px;width:1000px">${grid([
          ["<span class='lab'>PDF edit</span>", "<span class='num'>₹1,600</span><span class='per'>/ month</span>"],
          ["<span class='lab'>Grammar &amp; writing</span>", "<span class='num'>₹2,500</span>"],
          ["<span class='lab'>Audio transcription</span>", "<span class='num'>₹1,400</span>"],
        ], "560px 1fr")}</div>
        <div id="mTotEye" class="eyebrow" style="left:1250px;top:380px">Har mahine waste</div>
        <div id="mTot" class="disp red" style="position:absolute;left:1200px;top:430px;font-size:160px;line-height:1;transform-origin:30% 60%">₹8–10K</div>
        <div id="mTotSub" class="tagline" style="left:1250px;top:680px;width:560px">subscription fees, sirf basic digital tasks ke liye.</div>`);
  wipe("#mEye", 0.05); rise("#m1", 0.1);
  [1, 2, 3].forEach((li, k) => fadeUp(`#mGrid .cell:nth-child(${2 * k + 1}), #mGrid .cell:nth-child(${2 * k + 2})`, L(li) + 0.1));
  wipe("#mTotEye", L(4)); popIn("#mTot", wt(4, "aath"), 2, -6); wipe("#mTotSub", wt(4, "subscription"), 0.6);
}
{ // stop paying
  const s = "s-tax";
  scene(s, L(5), L(6), "redPanel center", `
        <div class="col"><div id="xa" class="disp white shadow" style="font-size:210px;line-height:1;transform:rotate(-5deg)">Stop paying</div>
        <div id="xb" class="disp white" style="font-size:110px;margin-top:20px">this subscription tax!</div></div>`);
  tw(`tl.fromTo("#${s}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power3.out" }, ${r2(L(5))});`);
  popIn("#xa", L(5) + 0.1, 1.8, -5); wipe("#xb", wt(5, "this"), 0.5);
}
{ // 5 free tools
  const s = "s-five", tools = ["NotebookLM / ChatPDF", "MacWhisper / Whisper Web", "Clipdrop Cleanup", "DeepL Write / LanguageTool", "Make.com / Activepieces"];
  scene(s, L(6), L(7), "", `
        <div id="fEye" class="eyebrow" style="left:120px;top:150px">Aaj hum dekhenge</div>
        <div class="mask" style="left:116px;top:190px"><div id="f1" class="disp" style="font-size:130px">5 powerful</div></div>
        <div id="f2" class="disp red" style="position:absolute;left:116px;top:350px;font-size:140px;transform-origin:20% 60%">100% FREE</div>
        <div class="mask" style="left:330px;top:550px"><div id="f3" class="disp" style="font-size:120px;transform:rotate(2deg)">AI tools</div></div>
        <div id="fTag" class="tagline" style="left:120px;top:760px;width:640px">baap-level speed aur quality ke saath.</div>
        <div id="fList" class="list" style="left:1060px;top:220px">${tools.map((t, i) => `<div class="li"><span class="n">0${i + 1}</span><span>${t}</span></div>`).join("")}</div>`);
  wipe("#fEye", L(6)); rise("#f1", wt(6, "5")); popIn("#f2", wt(6, "100"), 1.8, -4); rise("#f3", wt(6, "AI"));
  fadeUp("#fList .li", wt(6, "jo"), 0.25); wipe("#fTag", wt(6, "baap"), 0.6);
}
{ // no sponsor
  const s = "s-spon";
  scene(s, L(7), L(9), "", `
        <div class="bullets" style="left:160px;top:220px">
          <div id="b1" class="bl"><span class="dash">—</span>Koi sponsor nahi</div>
          <div id="b2" class="bl"><span class="dash">—</span>Koi faltu bakwaas nahi</div>
          <div id="b3" class="bl"><span class="dash">—</span>Pure utility tools</div>
        </div>
        <div id="bGo" class="disp red" style="position:absolute;left:1120px;top:520px;font-size:190px;transform-origin:30% 60%">Chaliye!</div>`);
  fadeUp("#b1", L(7)); fadeUp("#b2", wt(7, "faltu")); fadeUp("#b3", wt(7, "pure")); popIn("#bGo", L(8), 1.8, -5);
}

// ================= TOOL 1 · PDF =================
titleSlam(1, "PDF Chat", L(9));
{
  const s = "t1-prob", t = T0(L(9));
  const sheets = [0, 1, 2, 3, 4].map((i) => `<div class="sheet" style="transform:translate(${i * 14}px,${-i * 14}px) rotate(${(i - 2) * 2}deg)"></div>`).join("");
  scene(s, L(9), L(12), "", `
        <div id="pEye" class="eyebrow" style="left:120px;top:150px">Office ya college</div>
        <div id="p80" class="disp red" style="position:absolute;left:110px;top:190px;font-size:250px;line-height:1;transform-origin:30% 60%">80-page</div>
        <div class="mask" style="left:120px;top:460px"><div id="pDoc" class="disp" style="font-size:96px">contract report</div></div>
        <div id="pKeys" class="keyRow" style="left:120px;top:640px">${keycaps(["CTRL", "F"])}<svg id="pX" viewBox="0 0 100 100" class="xmark"><path d="M10 10 L90 90 M90 10 L10 90" fill="none" stroke="${C.red}" stroke-width="12" stroke-linecap="square"/></svg></div>
        <div id="pMiss" class="tagline" style="left:620px;top:660px;width:520px">context hamesha miss.</div>
        <div id="pStack" class="stackWrap" style="left:1260px;top:150px">${sheets}<div class="sheet top"><div class="pdfTag">PDF</div>${"<div class='ln'></div>".repeat(10)}</div></div>`);
  wipe("#pEye", t); popIn("#p80", Math.max(t + 0.1, wt(10, "80")), 1.8, -6); rise("#pDoc", wt(10, "contract"));
  tw(`tl.fromTo("#pStack .sheet", { y: -500, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.07, ease: "power3.out" }, ${r2(t + 0.3)});`);
  fadeUp("#pKeys .key, #pKeys .plus", wt(11, "ctrl"), 0.07); popIn("#pX", wt(11, "hamesha"), 1.8); wipe("#pMiss", wt(11, "context"), 0.6);
}
{
  const s = "t1-sol", a = L(12), b = L(14);
  scene(s, a, b, "", `
        <div id="sEye" class="eyebrow" style="left:120px;top:200px">Solution · Google</div>
        <div class="mask" style="left:116px;top:240px"><div id="s1" class="disp" style="font-size:84px">NotebookLM</div></div>
        <div id="s2" class="disp red" style="position:absolute;left:116px;top:360px;font-size:84px;transform-origin:20% 60%">ya ChatPDF</div>
        ${frame([{ src: "notebooklm_hero.png", img: true, from: a, to: wt(12, "chatpdf") }, { src: "chatpdf_home_hero.png", img: true, from: wt(12, "chatpdf"), to: b }])}`);
  wipe("#sEye", a); rise("#s1", wt(12, "notebooklm")); popIn("#s2", wt(12, "chatpdf"), 1.7, -4);
}
{
  const s = "t1-demo", a = L(14), b = L(16);
  const tType = wt(14, "type"), tBam = wt(15, "seconds"), tPage = wt(15, "page");
  scene(s, a, b, "", `
        <div class="steps" style="left:110px;top:150px">
          <div id="d1" class="st"><span class="n">01</span><span>Drag &amp; drop PDF</span></div>
          <div id="d2" class="st"><span class="n">02</span><span>Type karo</span></div>
        </div>
        <div id="dQ" class="quote" style="left:110px;top:400px;width:600px">“Is document mein key deadlines aur financial risks kya hain?”</div>
        <div id="dBam" class="disp red" style="position:absolute;left:110px;top:620px;font-size:130px;transform-origin:30% 60%">BAM!</div>
        <div id="dCite" class="tagline" style="left:120px;top:800px;width:620px;font-size:30px">exact page numbers + source citations</div>
        ${frame([
          { src: "cp_upload.mp4", from: a, to: tType },
          { src: "cp_type.mp4", from: tType, to: tBam - 0.3 },
          { src: "cp_answer.mp4", from: tBam - 0.3, to: tPage },
          { src: "cp_scroll.mp4", from: tPage, to: b },
        ], "chatpdf.com")}`);
  fadeUp("#d1", a + 0.1); fadeUp("#d2", tType); wipe("#dQ", tType + 0.4, 0.9); popIn("#dBam", wt(14, "bam"), 2, -6); wipe("#dCite", tPage, 0.6);
}
{
  const s = "t1-free", a = L(16), b = L(18);
  scene(s, a, b, "", `
        <div id="nEye" class="eyebrow" style="left:120px;top:150px">Google NotebookLM · filhal</div>
        <div id="nFree" class="disp red" style="position:absolute;left:110px;top:200px;font-size:100px;line-height:1;transform-origin:30% 60%">100% Free</div>
        <div id="nGrid" style="position:absolute;left:120px;top:470px;width:600px">${grid([
          ["<span class='num'>50</span>", "<span class='lab2'>sources / notebook</span>"],
          ["<span class='num'>5 lakh</span>", "<span class='lab2'>words / source</span>"],
        ], "250px 1fr")}</div>
        ${frame([{ src: "notebooklm.mp4", from: a, to: b }], "notebooklm.google")}`);
  wipe("#nEye", a); popIn("#nFree", wt(16, "100"), 1.8, -6);
  fadeUp("#nGrid .cell:nth-child(1), #nGrid .cell:nth-child(2)", wt(17, "50")); fadeUp("#nGrid .cell:nth-child(3), #nGrid .cell:nth-child(4)", wt(17, "lakh"));
}
{
  const s = "t1-adobe", a = L(18), b = L(19);
  scene(s, a, b, "center", `
        <div class="col">
          <div id="aEye" class="eyebrow static">Iske baad zaroorat nahi</div>
          <div style="position:relative;display:inline-block"><div id="aName" class="disp" style="font-size:150px">Adobe Acrobat Pro</div><div id="aStrike" class="strikeBar"></div></div>
          <div id="aSub" class="body" style="margin-top:30px">ya kisi bhi paid PDF editor ki.</div>
        </div>`);
  wipe("#aEye", a); popIn("#aName", wt(18, "adobe"), 1.3); strike("#aStrike", wt(18, "zaroorat")); wipe("#aSub", wt(18, "paid"), 0.6);
}

// ================= TOOL 2 · TRANSCRIPTION =================
titleSlam(2, "Audio → Text", L(19));
{
  const s = "t2-prob", t = T0(L(19)), a = L(19), b = L(22);
  const bars = Array.from({ length: 36 }, (_, i) => `<div class="bar" style="height:${30 + Math.round(120 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)))}px"></div>`).join("");
  scene(s, a, b, "", `
        <div id="qEye" class="eyebrow" style="left:120px;top:150px">Meeting ya lecture</div>
        <div class="mask" style="left:116px;top:190px"><div id="q1" class="disp" style="font-size:84px">1 ghante ki</div></div>
        <div id="q2" class="disp red" style="position:absolute;left:116px;top:310px;font-size:76px;transform-origin:20% 60%">raw recording</div>
        <div id="qB1" class="tagline" style="left:120px;top:540px;width:600px">Paid tools: hazaron rupaye / month</div>
        <div id="qB2" class="tagline" style="left:120px;top:660px;width:600px">aur aapka private audio cloud par.</div>
        <div id="qWave" class="wave" style="left:930px;top:200px">${bars}<div class="timer">01:00:00</div></div>
        <div id="qOtter" class="clip layer" data-start="${r2(L(21))}" data-duration="${r2(b - L(21))}" data-track-index="2">${frame([{ src: "otter.mp4", from: L(21), to: b }], "paid transcription · pricing")}</div>`);
  wipe("#qEye", t); rise("#q1", Math.max(t + 0.2, wt(20, "1"))); popIn("#q2", wt(20, "raw"), 1.7, -4);
  fadeUp("#qWave .bar", t + 0.2, 0.02);
  tw(`tl.fromTo("#qWave .bar", { scaleY: 1 }, { scaleY: 0.35, duration: 0.4, yoyo: true, repeat: 15, stagger: { each: 0.03, from: "center" }, ease: "sine.inOut", immediateRender: false }, ${r2(t + 1)});`);
  wipe("#qB1", wt(21, "hazaron"), 0.6); wipe("#qB2", wt(21, "private"), 0.6);
}
{
  const s = "t2-sol", a = L(22), b = L(23);
  scene(s, a, b, "", `
        <div id="wEye" class="eyebrow" style="left:120px;top:200px">Try karo</div>
        <div class="mask" style="left:116px;top:240px"><div id="w1" class="disp" style="font-size:80px">MacWhisper</div></div>
        <div id="w2" class="disp red" style="position:absolute;left:116px;top:360px;font-size:80px;transform-origin:20% 60%">Whisper Web</div>
        <div id="wTag" class="tagline" style="left:120px;top:600px;width:600px">OpenAI ka open-source Whisper model</div>
        ${frame([{ src: "macwhisper.mp4", from: a, to: wt(22, "browser") }, { src: "whisperweb_hero.png", img: true, from: wt(22, "browser"), to: b }])}`);
  wipe("#wEye", a); rise("#w1", wt(22, "macwhisper")); popIn("#w2", wt(22, "whisper", 1), 1.7, -4); wipe("#wTag", wt(22, "openai"), 0.6);
}
{
  const s = "t2-demo", a = L(23), b = L(25);
  scene(s, a, b, "", `
        <div class="steps" style="left:110px;top:170px">
          <div id="e1" class="st"><span class="n">01</span><span>Audio / video drop</span></div>
          <div id="e2" class="st"><span class="n">02</span><span>Word-for-word text</span></div>
        </div>
        <div id="eSec" class="disp red" style="position:absolute;left:110px;top:520px;font-size:84px;transform-origin:30% 60%">seconds mein</div>
        ${frame([{ src: "whisperweb.mp4", from: a, to: b }], "whisper web · in-browser")}`);
  fadeUp("#e1", a + 0.1); fadeUp("#e2", wt(24, "word")); popIn("#eSec", wt(24, "seconds"), 1.7, -4);
}
{
  const s = "t2-local", a = L(25), b = L(28);
  scene(s, a, b, "", `
        <div id="lEye" class="eyebrow" style="left:160px;top:150px">Sabse badi baat</div>
        <div id="lGrid" style="position:absolute;left:160px;top:210px;width:1600px">${grid([
          ["<span class='num'>01</span><span class='lab'>Locally run</span>", "<span class='num'>02</span><span class='lab'>Data private</span>"],
          ["<span class='num'>03</span><span class='lab'>No minute limit</span>", "<span class='num'>04</span><span class='lab'>Unlimited · free</span>"],
        ], "1fr 1fr", "tall")}</div>`);
  wipe("#lEye", a);
  [["1", wt(25, "locally")], ["2", wt(25, "private")], ["3", L(26)], ["4", L(27)]].forEach(([k, t]) => fadeUp(`#lGrid .cell:nth-child(${k})`, t));
}

// ================= TOOL 3 · PHOTO CLEANUP =================
titleSlam(3, "Photo Cleanup", L(28));
{
  const s = "t3-prob", t = T0(L(28)), a = L(28), b = L(31);
  const ring = (x, y, r, k) => `<div id="ring${k}" class="ring" style="left:${FR.x + x - r}px;top:${FR.y + y - r}px;width:${2 * r}px;height:${2 * r}px"></div>`;
  scene(s, a, b, "", `
        <div id="cEye" class="eyebrow" style="left:120px;top:150px">Badhiya photo, lekin…</div>
        <div class="bullets small" style="left:120px;top:210px">
          <div id="c1" class="bl"><span class="dash">—</span>wires ka gucha</div>
          <div id="c2" class="bl"><span class="dash">—</span>koi stranger</div>
          <div id="c3" class="bl"><span class="dash">—</span>kachra</div>
        </div>
        <div style="position:absolute;left:120px;top:640px"><div id="cPs" class="disp" style="font-size:70px">Photoshop fill</div><div id="cPsX" class="strikeBar"></div></div>
        <div id="cPaid" class="tagline" style="left:120px;top:770px;width:560px">aur paid tools mehange.</div>
        ${frame([{ src: "kitchen.png", img: true, from: a, to: b }], "aapki photo")}
        ${ring(330, 470, 70, 1)}${ring(150, 300, 90, 2)}${ring(860, 470, 80, 3)}`);
  wipe("#cEye", t); fadeUp("#c1", wt(29, "wires")); fadeUp("#c2", wt(29, "stranger")); fadeUp("#c3", wt(29, "kachra"));
  [1, 2, 3].forEach((k) => popIn(`#ring${k}`, wt(29, ["wires", "stranger", "kachra"][k - 1]), 1.8));
  popIn("#cPs", wt(30, "photoshop"), 1.4); strike("#cPsX", wt(30, "bas")); wipe("#cPaid", wt(30, "paid"), 0.6);
}
{
  const s = "t3-sol", a = L(31), b = L(35);
  scene(s, a, b, "", `
        <div id="kEye" class="eyebrow" style="left:120px;top:150px">Tool ka naam</div>
        <div class="mask" style="left:116px;top:190px"><div id="k1" class="disp red" style="font-size:120px">Clipdrop</div></div>
        <div id="k2" class="disp" style="position:absolute;left:220px;top:320px;font-size:90px;transform:rotate(2deg)">Cleanup</div>
        <div class="steps small" style="left:120px;top:440px">
          <div id="k3" class="st"><span class="n">01</span><span>Upload</span></div>
          <div id="k4" class="st"><span class="n">02</span><span>Brush se paint</span></div>
          <div id="k5" class="st"><span class="n">03</span><span>Clean</span></div>
        </div>
        <div id="k3s" class="disp red" style="position:absolute;left:110px;top:760px;font-size:90px;transform-origin:30% 60%">3 sec magic</div>
        ${frame([{ src: "clipdrop.mp4", from: a, to: L(32) }, { src: "cd_paint.mp4", from: L(32), to: L(33) + 1.5 }, { src: "clipdrop_hero.png", img: true, from: L(33) + 1.5, to: b }], "clipdrop.co/cleanup")}`);
  wipe("#kEye", a); rise("#k1", wt(31, "clipdrop")); popIn("#k2", wt(31, "cleanup"), 1.5, 2);
  fadeUp("#k3", wt(32, "upload")); fadeUp("#k4", wt(32, "brush")); fadeUp("#k5", wt(32, "clean")); popIn("#k3s", L(34), 1.8, -5);
}
{
  const s = "t3-free", a = L(35), b = L(37);
  scene(s, a, b, "", `
        <div id="gEye" class="eyebrow" style="left:160px;top:140px">Clipdrop free tier</div>
        <div id="gGrid" style="position:absolute;left:160px;top:200px;width:1600px">${grid([
          ["<span class='tag'>Free</span><span class='lab'>Unlimited images</span><span class='lab2'>standard resolution · PPT, web, daily tasks</span>",
           "<span class='tag ink'>Paid</span><span class='lab'>High-res 4K export</span><span class='lab2'>normal use ke liye zaroorat nahi</span>"],
        ], "1fr 1fr", "tall")}</div>`);
  wipe("#gEye", a); fadeUp("#gGrid .cell:nth-child(1)", wt(35, "unlimited")); fadeUp("#gGrid .cell:nth-child(2)", L(36));
}

// ================= TOOL 4 · WRITING =================
titleSlam(4, "Writing", L(37));
{
  const s = "t4-prob", t = T0(L(37)), a = L(37), b = L(39);
  scene(s, a, b, "", `
        <div id="hEye" class="eyebrow" style="left:120px;top:150px">Emails · LinkedIn posts</div>
        <div class="mask" style="left:116px;top:190px"><div id="h1" class="disp" style="font-size:110px">Sahi tone</div></div>
        <div id="h2" class="disp red" style="position:absolute;left:116px;top:330px;font-size:90px;transform-origin:20% 60%">thoda tricky</div>
        <div id="hPay" class="tagline" style="left:120px;top:540px;width:600px">Grammarly: rewrites + tone = paywall</div>
        <div id="hMail" class="mail" style="left:820px;top:200px"><div class="eyebrow static">Draft</div>Hi sir, i want to informed you that the report are not ready yet becuase we was waiting for client data.</div>
        <div id="hGram" class="clip layer" data-start="${r2(L(38))}" data-duration="${r2(b - L(38))}" data-track-index="2">${frame([{ src: "grammarly.mp4", from: L(38), to: b }], "grammarly · plans")}</div>`);
  wipe("#hEye", t); rise("#h1", Math.max(t + 0.1, wt(37, "sahi"))); popIn("#h2", wt(37, "tricky"), 1.7, -4); fadeUp("#hMail", t + 0.5); wipe("#hPay", wt(38, "paywall"), 0.6);
}
{
  const s = "t4-sol", a = L(39), b = L(42);
  scene(s, a, b, "", `
        <div id="jEye" class="eyebrow" style="left:120px;top:150px">Use karo</div>
        <div class="mask" style="left:116px;top:190px"><div id="j1" class="disp" style="font-size:80px">DeepL Write</div></div>
        <div id="j2" class="disp red" style="position:absolute;left:116px;top:310px;font-size:72px;transform-origin:20% 60%">LanguageTool</div>
        <div id="jChips" class="chips" style="left:120px;top:530px"><span>Professional</span><span>Concise</span><span>Casual</span></div>
        <div id="jTag" class="tagline" style="left:120px;top:680px;width:600px">natural, professional, bina robotic tone ke.</div>
        ${frame([{ src: "languagetool_hero.png", img: true, from: a, to: L(40) }, { src: "lt_type.mp4", from: L(40), to: b }], "languagetool.org")}`);
  wipe("#jEye", a); rise("#j1", wt(39, "deepl")); popIn("#j2", wt(39, "languagetool"), 1.7, -4);
  fadeUp("#jChips span", wt(40, "style"), 0.2); wipe("#jTag", wt(41, "natural"), 0.6);
}
{
  const s = "t4-free", a = L(42), b = L(44);
  scene(s, a, b, "", `
        <div id="oEye" class="eyebrow" style="left:160px;top:140px">Free tier limits</div>
        <div id="oGrid" style="position:absolute;left:160px;top:200px;width:1600px">${grid([
          ["<span class='lab'>DeepL Write</span>", "<span class='num'>1,500</span><span class='lab2'>characters / edit · unlimited queries</span>"],
          ["<span class='lab'>LanguageTool</span>", "<span class='num'>10,000</span><span class='lab2'>characters / check</span>"],
        ], "520px 1fr", "tall")}</div>
        <div id="oOk" class="tagline" style="left:160px;top:760px;width:1100px">Daily emails aur reports ke liye zarurat se zyada.</div>`);
  wipe("#oEye", a); fadeUp("#oGrid .cell:nth-child(1), #oGrid .cell:nth-child(2)", wt(42, "1,500"));
  fadeUp("#oGrid .cell:nth-child(3), #oGrid .cell:nth-child(4)", wt(42, "languagetool")); wipe("#oOk", L(43), 0.6);
}

// ================= TOOL 5 · AUTOMATION =================
titleSlam(5, "Automation", L(44));
{
  const s = "t5-prob", t = T0(L(44)), a = L(44), b = L(47);
  const steps = ["Email aayi", "Attachment download", "Drive mein save", "Team ko message"];
  scene(s, a, b, "", `
        <div id="uEye" class="eyebrow" style="left:120px;top:150px">Har din, same boring tasks</div>
        <div id="uChain" class="chain" style="left:120px;top:230px">${steps.map((x, i) => `<div class="box">${x}</div>${i < 3 ? '<div class="arr">→</div>' : ""}`).join("")}</div>
        <div id="uWaste" class="disp red" style="position:absolute;left:110px;top:470px;font-size:150px;transform-origin:30% 60%">ghante waste</div>
        <div id="uZap" class="clip layer" data-start="${r2(L(46))}" data-duration="${r2(b - L(46))}" data-track-index="2">
          <div class="cover"></div>${frame([{ src: "zapier.mp4", from: L(46), to: b }], "zapier · pricing")}
          <div id="uZapT" class="tagline" style="left:120px;top:400px;width:560px">Zapier: bohot mehenga, free plan lagbhag useless.</div></div>`);
  wipe("#uEye", t);
  ["email", "attachment", "drive", "team"].forEach((k, i) => fadeUp(`#uChain > :nth-child(${2 * i + 1})${i ? `, #uChain > :nth-child(${2 * i})` : ""}`, Math.max(t + 0.2 + i * 0.1, wt(44, k))));
  popIn("#uWaste", wt(45, "ghante"), 1.8, -5); wipe("#uZapT", wt(46, "mehange"), 0.7);
}
{
  const s = "t5-sol", a = L(47), b = L(51);
  const node = (x, label, sub, k) => `<div id="nd${k}" class="node" style="left:${x}px"><div class="dot">${k + 1}</div><div class="nl">${label}</div><div class="ns">${sub}</div></div>`;
  scene(s, a, b, "", `
        <div id="vHead" class="clip layer" data-start="${r2(a)}" data-duration="${r2(L(49) - a)}" data-track-index="3">
        <div id="vEye" class="eyebrow" style="left:120px;top:150px">Solution</div>
        <div class="mask" style="left:116px;top:190px"><div id="v1" class="disp" style="font-size:110px">Make.com</div></div>
        <div id="v2" class="disp red" style="position:absolute;left:116px;top:330px;font-size:84px;transform-origin:20% 60%">Activepieces</div>
        <div id="vOss" class="tagline" style="left:120px;top:500px;width:560px">open-source · drag-and-drop workflows</div>
        </div>
        <div id="vAp" class="clip layer" data-start="${r2(a)}" data-duration="${r2(L(49) - a)}" data-track-index="2">${frame([{ src: "activepieces.mp4", from: a, to: L(49) }], "activepieces.com")}</div>
        <div id="vFlow" class="clip layer" data-start="${r2(L(49))}" data-duration="${r2(b - L(49))}" data-track-index="2">
          <div class="cover"></div>
          <div id="fEye2" class="eyebrow" style="left:160px;top:150px">Example workflow · ek baar setup</div>
          <div class="flowLine" id="fl"></div><div class="flowDot" id="fdot"></div>
          ${node(160, "Client invoice email", "trigger", 0)}${node(720, "Google Drive folder", "auto save", 1)}${node(1280, "Notification", "aapko alert", 2)}
          <div id="vBhool" class="disp red" style="position:absolute;left:0;right:0;top:720px;text-align:center;font-size:110px;transform:rotate(-3deg)">setup karo, bhool jao</div>
        </div>`);
  wipe("#vEye", a); rise("#v1", wt(47, "make")); popIn("#v2", wt(47, "activepieces"), 1.7, -4); wipe("#vOss", L(48), 0.6);
  wipe("#fEye2", L(49)); popIn("#nd0", wt(49, "invoice"), 1.4);
  strike("#fl", wt(49, "automatically")); popIn("#nd1", wt(49, "drive"), 1.4); popIn("#nd2", wt(49, "notification"), 1.4);
  tw(`tl.fromTo("#fdot", { x: 0, opacity: 1 }, { x: 1120, duration: 1.6, repeat: 2, ease: "power1.inOut", immediateRender: false }, ${r2(wt(49, "notification") + 0.4)});`);
  popIn("#vBhool", L(50), 1.6, -3);
}
{
  const s = "t5-free", a = L(51), b = L(52);
  scene(s, a, b, "", `
        <div id="yEye" class="eyebrow" style="left:160px;top:140px">Free plans compared</div>
        <div id="yGrid" style="position:absolute;left:160px;top:200px;width:1600px">${grid([
          ["<span class='lab'>Zapier free</span><span class='num ink'>100</span><span class='lab2'>simple tasks / month</span>",
           "<span class='lab'>Make.com free</span><span class='num big'>1,000</span><span class='lab2'>operations / month · multi-step</span>"],
        ], "1fr 1fr", "tall")}</div>`);
  wipe("#yEye", a); fadeUp("#yGrid .cell:nth-child(1)", wt(51, "100")); fadeUp("#yGrid .cell:nth-child(2)", wt(51, "1,000"));
}

// ================= PRO TIP =================
{
  const a = L(52), b = L(55), t = a + 1.4;
  const s0 = "tip-slam";
  scene(s0, a, a + 1.5, "redPanel center", `<div class="col"><div class="eyebrow static light">Ek</div><div id="tipT" class="disp white shadow" style="font-size:260px;line-height:1">Pro tip</div></div>`, 4);
  tw(`tl.fromTo("#${s0}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power3.out" }, ${r2(a)});`);
  popIn("#tipT", a + 0.12, 1.8, -6);
  tw(`tl.to("#${s0}", { clipPath: "inset(0% 0% 0% 100%)", duration: 0.2, ease: "power3.in" }, ${r2(a + 1.3)});`);
  const icons = ["NB", "CP", "WW", "CD", "LT"].map((x, i) => `<div class="sbIcon" id="ic${i}">${x}</div>`).join("");
  scene("tip", a, b, "", `
        <div style="position:absolute;left:120px;top:190px"><div id="tp1" class="disp" style="font-size:64px">Bookmark mat karo</div><div id="tp1x" class="strikeBar"></div></div>
        <div id="tp2" class="disp red" style="position:absolute;left:116px;top:320px;font-size:72px;transform-origin:20% 60%">Sidebar mein pin</div>
        <div id="tp3" class="tagline" style="left:120px;top:480px;width:640px">ya “Install as App”. Ek click, main window chhode bina.</div>
        <div class="browser" style="left:880px;top:130px">
          <div class="bTop"><span></span><span></span><span></span><div class="bUrl">Chrome · Edge</div></div>
          <div class="bSide">${icons}</div>
          <div id="bPanel" class="bPanel"><img src="assets/broll/chatpdf_home_hero.png"></div>
          <div class="bMain"><div class="ln"></div><div class="ln"></div><div class="ln short"></div><div class="ln"></div><div class="ln short"></div></div>
        </div>`);
  popIn("#tp1", t, 1.3); strike("#tp1x", Math.max(t + 0.4, wt(52, "warna"))); popIn("#tp2", wt(53, "sidebar"), 1.7, -4);
  tw(`tl.fromTo("#tip .sbIcon", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, stagger: 0.12, ease: "back.out(2)" }, ${r2(wt(53, "pin"))});`);
  wipe("#tp3", wt(53, "install"), 0.6);
  tw(`tl.fromTo("#ic1", { backgroundColor: "${C.bg}", color: "${C.dark}" }, { backgroundColor: "${C.red}", color: "${C.bg}", duration: 0.15 }, ${r2(wt(54, "side"))});`);
  tw(`tl.fromTo("#bPanel", { xPercent: -100, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, ${r2(wt(54, "side") + 0.15)});`);
}

// ================= OUTRO =================
{
  const a = L(55), b = L(57);
  const rows = [["NotebookLM / ChatPDF", "Acrobat Pro"], ["MacWhisper / Whisper Web", "paid transcription"], ["Clipdrop Cleanup", "Photoshop fill"], ["DeepL Write / LanguageTool", "Grammarly premium"], ["Make.com / Activepieces", "Zapier"]];
  scene("recap", a, b, "", `
        <div id="rEye" class="eyebrow" style="left:160px;top:110px">Toh yeh the · 5 free AI tools</div>
        <div id="rGrid" style="position:absolute;left:160px;top:160px;width:1600px">${grid(rows.map((r, i) => [`<span class='num sm'>0${i + 1}</span>`, `<span class='lab'>${r[0]}</span>`, `<span class='lab2'>replaces <s>${r[1]}</s></span>`]), "140px 760px 1fr", "rows")}</div>
        <div id="rDesc" class="downTag" style="top:770px"><span class="disp red" style="font-size:64px">links description mein</span><svg viewBox="0 0 60 80" class="arrow"><path d="M30 4 V66 M8 46 L30 70 L52 46" fill="none" stroke="${C.red}" stroke-width="9" stroke-linecap="square"/></svg><span class="eyebrow static">koi affiliate drama nahi</span></div>`);
  wipe("#rEye", a); tw(`tl.fromTo("#rGrid .cell", { opacity: 0 }, { opacity: 1, duration: 0.15, stagger: 0.07, ease: "none" }, ${r2(a + 0.3)});`);
  popIn("#rDesc", L(56), 1.3);
}
{
  const a = L(57), b = L(60);
  scene("ask", a, b, "", `
        <div id="zEye" class="eyebrow" style="left:120px;top:170px">Ab aap batao</div>
        <div class="mask" style="left:116px;top:210px"><div id="z1" class="disp" style="font-size:110px">Sabse pehle kaunsa</div></div>
        <div id="z2" class="disp red" style="position:absolute;left:116px;top:350px;font-size:150px;transform-origin:20% 60%">try karoge?</div>
        <div id="zNums" class="nums" style="left:120px;top:600px">${[1, 2, 3, 4, 5].map((n) => `<span>0${n}</span>`).join("")}<span class="q">?</span></div>
        <div id="zCom" class="disp red" style="position:absolute;left:1120px;top:600px;font-size:120px;transform:rotate(-5deg)">Comment!</div>`);
  wipe("#zEye", a); rise("#z1", wt(57, "5")); popIn("#z2", wt(57, "try"), 1.7, -4);
  fadeUp("#zNums span", wt(57, "try") + 0.4, 0.1); popIn("#zCom", L(59), 1.8, -5);
}
{
  const a = L(60), b = DURATION;
  scene("bye", a, b, "", `
        <div id="byEye" class="eyebrow" style="left:120px;top:150px">Video achhi lagi?</div>
        <div id="byRow" class="nums big" style="left:120px;top:210px"><span>Like</span><span>Share</span><span class="red">Subscribe</span></div>
        <div id="byCard" class="brandCard" style="left:120px;top:470px;width:1000px"><div class="eyebrow static">Channel</div><div class="disp red" style="font-size:130px;transform:rotate(-3deg)">NamasteTechy</div></div>
        <svg id="bell" viewBox="0 0 100 100" class="bell"><path d="M50 12c-14 0-24 11-24 25v18l-8 12h64l-8-12V37c0-14-10-25-24-25z" fill="none" stroke="${C.dark}" stroke-width="7"/><path d="M40 74a10 10 0 0 0 20 0" fill="none" stroke="${C.dark}" stroke-width="7"/></svg>
        <div id="byBye" class="disp" style="position:absolute;left:1240px;top:760px;font-size:70px;transform:rotate(2deg)">agli video mein!</div>`);
  wipe("#byEye", a); fadeUp("#byRow span", a + 0.2, 0.35); fadeUp("#byCard", wt(60, "namastetechy"));
  tw(`tl.fromTo("#bell", { rotation: 0, opacity: 0 }, { keyframes: [{ opacity: 1, rotation: -18, duration: 0.12 }, { rotation: 16, duration: 0.12 }, { rotation: -10, duration: 0.1 }, { rotation: 0, duration: 0.1 }] }, ${r2(wt(60, "bell"))});`);
  rise("#byBye", L(61));
}

// ---------- captions: groups of <= 8 words ----------
const groups = [];
let cur = [];
words.forEach((w, i) => {
  const p = words[i - 1];
  if (cur.length && (w.line !== p.line || cur.length >= 8)) { groups.push(cur); cur = []; }
  cur.push(w);
  if (cur.length >= 4 && /[,.!?:—]$/.test(w.text)) { groups.push(cur); cur = []; }
});
if (cur.length) groups.push(cur);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
groups.forEach((g, k) => {
  const next = groups[k + 1];
  const at = g[0].start, end = next ? Math.min(next[0].start, g[g.length - 1].end + 0.6) : DURATION;
  parts.push(`
      <div id="cap${k}" class="clip layer" data-start="${r2(at)}" data-duration="${r2(Math.max(0.3, end - at))}" data-track-index="5"><div class="capStage"><div class="capCard">${esc(g.map((w) => w.text).join(" "))}</div></div></div>`);
});

// ---------- chapter footer + progress ----------
const ticks = CHAPTERS.map((c) => `<div class="tick" style="left:${(c.at / DURATION * 100).toFixed(2)}%"></div>`).join("");
const chapterLabels = [{ name: "Intro", at: 0 }, ...CHAPTERS.map((c) => ({ name: `Tool 0${c.n} · ${c.name}`, at: c.at })), { name: "Pro tip", at: L(52) }, { name: "Outro", at: L(55) }];
const chapHtml = chapterLabels.map((c, i) => {
  const end = chapterLabels[i + 1]?.at ?? DURATION;
  return `<div id="chap${i}" class="clip chap" data-start="${r2(c.at)}" data-duration="${r2(end - c.at)}" data-track-index="6">${c.name}</div>`;
}).join("");
tw(`tl.fromTo("#progress", { scaleX: 0 }, { scaleX: 1, duration: ${DURATION}, ease: "none" }, 0);`);

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
      .col { display: flex; flex-direction: column; align-items: center; text-align: center; padding-bottom: 120px; }
      .disp { font-family: "Shrikhand", serif; font-weight: 400; line-height: 1.1; white-space: nowrap; color: ${C.dark}; }
      .disp.red, .red { color: ${C.red}; } .disp.white { color: ${C.bg}; } .shadow { text-shadow: ${STACK}; }
      .body { font-size: 46px; line-height: 1.5; }
      .mask { position: absolute; overflow: hidden; }
      .mask > div { display: block; }
      .eyebrow { position: absolute; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 26px; letter-spacing: 3px; text-transform: uppercase; color: ${C.red}; white-space: nowrap; }
      .eyebrow.static { position: static; margin-bottom: 8px; }
      .eyebrow.light { color: ${C.bg}; font-size: 34px; letter-spacing: 6px; }
      .tagline { position: absolute; padding-left: 20px; border-left: 4px solid ${C.red}; font-size: 36px; line-height: 1.45; }
      .redPanel { background: ${C.red}; }
      .frameOuter { position: absolute; border: 3px solid ${C.dark}; background: ${C.light}; }
      .frame { position: absolute; overflow: hidden; outline: 1.5px solid ${C.dark}; background: ${C.bg}; }
      .mwin { position: absolute; inset: 0; width: 100%; height: 100%; }
      .mfill { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      .frameLabel { position: absolute; left: ${FR.x}px; top: ${FR.y + FR.h + 24}px; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 22px; letter-spacing: 3px; text-transform: uppercase; color: ${C.dark}; }
      .cover { position: absolute; inset: 0; background: ${C.bg}; }
      .fin { display: grid; border: 3px solid ${C.dark}; }
      .fin .cell { border: 1.5px solid ${C.dark}; padding: 22px 30px; min-height: 120px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
      .fin.tall .cell { min-height: 260px; padding: 30px 44px; }
      .fin.rows .cell { min-height: 106px; padding: 10px 28px; flex-direction: row; align-items: center; }
      .num { font-family: "Shrikhand", serif; font-size: 84px; line-height: 1.05; color: ${C.red}; }
      .num.big { font-size: 150px; } .num.sm { font-size: 56px; } .num.ink { color: ${C.dark}; font-size: 110px; }
      .lab { font-family: "Shrikhand", serif; font-size: 54px; line-height: 1.15; }
      .lab2 { font-size: 30px; line-height: 1.4; }
      .lab2 s { text-decoration-color: ${C.red}; text-decoration-thickness: 4px; }
      .per { font-size: 28px; margin-left: 10px; }
      .tag { align-self: flex-start; padding: 6px 16px 8px; background: ${C.red}; color: ${C.bg}; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 3px; text-transform: uppercase; }
      .tag.ink { background: ${C.dark}; }
      .list { position: absolute; display: flex; flex-direction: column; gap: 20px; }
      .list .li, .steps .st { display: flex; align-items: baseline; gap: 26px; font-family: "Shrikhand", serif; font-size: 44px; border-left: 4px solid ${C.red}; padding-left: 22px; white-space: nowrap; }
      .list .n, .steps .n { color: ${C.red}; font-size: 40px; }
      .steps { position: absolute; display: flex; flex-direction: column; gap: 26px; }
      .steps.small .st { font-size: 42px; }
      .steps.small { gap: 18px; }
      .quote { position: absolute; font-family: "Libre Baskerville", serif; font-size: 36px; line-height: 1.45; padding: 20px 26px; border: 3px solid ${C.dark}; background: ${C.light}; }
      .bullets { position: absolute; display: flex; flex-direction: column; gap: 34px; }
      .bullets .bl { font-family: "Shrikhand", serif; font-size: 110px; line-height: 1.1; white-space: nowrap; }
      .bullets.small .bl { font-size: 58px; }
      .bullets .dash { color: ${C.red}; margin-right: 26px; }
      .keyRow { position: absolute; display: flex; align-items: center; gap: 16px; }
      .key { display: inline-block; padding: 8px 24px 14px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 5px; background: ${C.bg}; font-family: "Shrikhand", serif; font-size: 64px; line-height: 1.05; }
      .plus { font-family: "Shrikhand", serif; font-size: 60px; color: ${C.red}; }
      .xmark { position: absolute; left: -10px; top: -30px; width: 420px; height: 170px; }
      .strikeBar { position: absolute; left: -10px; right: -10px; top: 52%; height: 14px; background: ${C.red}; transform-origin: 0 50%; }
      .stackWrap { position: absolute; width: 470px; height: 620px; }
      .sheet { position: absolute; inset: 0; width: 100%; height: 100%; background: ${C.bg}; border: 3px solid ${C.dark}; }
      .sheet.top { padding: 90px 44px 0; }
      .sheet .ln, .bMain .ln { height: 14px; margin: 0 0 28px; background: ${C.light}; border: 1.5px solid #d9d2cc; }
      .pdfTag { position: absolute; right: 36px; top: 24px; padding: 4px 14px 8px; background: ${C.red}; color: ${C.bg}; font-family: "Shrikhand", serif; font-size: 32px; }
      .wave { position: absolute; width: 900px; height: 420px; border: 3px solid ${C.dark}; display: flex; align-items: center; justify-content: center; gap: 10px; background: ${C.light}; }
      .wave .bar { width: 16px; background: ${C.dark}; transform-origin: 50% 50%; }
      .wave .timer { position: absolute; right: 24px; bottom: 16px; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 34px; color: ${C.red}; letter-spacing: 3px; }
      .ring { position: absolute; border: 6px solid ${C.red}; border-radius: 50%; }
      .mail { position: absolute; width: 960px; padding: 40px 48px; border: 3px solid ${C.dark}; border-left: 4px solid ${C.red}; font-size: 40px; line-height: 1.6; background: ${C.bg}; }
      .chips { position: absolute; display: flex; gap: 12px; }
      .chips span { padding: 8px 18px 12px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 30px; }
      .chips span:first-child { background: ${C.red}; color: ${C.bg}; border-color: ${C.red}; }
      .chain { position: absolute; display: flex; align-items: center; gap: 14px; }
      .chain .box { padding: 18px 20px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 34px; white-space: nowrap; background: ${C.bg}; }
      .chain .arr { font-family: "Shrikhand", serif; font-size: 44px; color: ${C.red}; }
      .node { position: absolute; top: 260px; width: 460px; height: 330px; border: 3px solid ${C.dark}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: ${C.bg}; transform-origin: 50% 50%; }
      .node .dot { width: 90px; height: 90px; border-radius: 50%; background: ${C.red}; color: ${C.bg}; font-family: "Shrikhand", serif; font-size: 56px; display: flex; align-items: center; justify-content: center; }
      .node .nl { font-family: "Shrikhand", serif; font-size: 46px; text-align: center; padding: 0 20px; }
      .node .ns { font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 22px; letter-spacing: 3px; text-transform: uppercase; color: ${C.red}; }
      .flowLine { position: absolute; left: 390px; top: 423px; width: 1120px; height: 8px; background: ${C.dark}; transform-origin: 0 50%; }
      .flowDot { position: absolute; left: 380px; top: 412px; width: 30px; height: 30px; border-radius: 50%; background: ${C.red}; opacity: 0; }
      .browser { position: absolute; width: 960px; height: 640px; border: 3px solid ${C.dark}; background: ${C.bg}; overflow: hidden; }
      .bTop { height: 56px; border-bottom: 3px solid ${C.dark}; display: flex; align-items: center; gap: 10px; padding: 0 18px; background: ${C.light}; }
      .bTop > span { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid ${C.dark}; }
      .bUrl { margin-left: 20px; flex: 1; height: 34px; border: 2px solid ${C.dark}; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 20px; padding: 3px 14px; }
      .bSide { position: absolute; left: 0; top: 59px; bottom: 0; width: 110px; border-right: 3px solid ${C.dark}; display: flex; flex-direction: column; align-items: center; gap: 16px; padding-top: 20px; background: ${C.bg}; }
      .sbIcon { width: 72px; height: 72px; border: 3px solid ${C.dark}; display: flex; align-items: center; justify-content: center; font-family: "Shrikhand", serif; font-size: 28px; }
      .bPanel { position: absolute; left: 113px; top: 59px; bottom: 0; width: 520px; border-right: 3px solid ${C.dark}; overflow: hidden; background: ${C.bg}; }
      .bPanel img { position: absolute; left: -200px; top: 0; height: 100%; }
      .bMain { position: absolute; left: 670px; top: 110px; right: 40px; }
      .downTag { position: absolute; left: 0; right: 0; display: flex; align-items: center; justify-content: center; gap: 24px; }
      .arrow { width: 50px; height: 70px; }
      .nums { position: absolute; display: flex; gap: 18px; }
      .nums span { padding: 10px 26px 16px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 60px; color: ${C.red}; }
      .nums span.q { background: ${C.red}; color: ${C.bg}; border-color: ${C.red}; }
      .nums.big span { font-size: 110px; color: ${C.dark}; }
      .nums.big span.red { color: ${C.red}; }
      .brandCard { position: absolute; padding: 30px 0 40px; border: 3px solid ${C.dark}; display: flex; flex-direction: column; align-items: center; }
      .bell { position: absolute; left: 1300px; top: 480px; width: 200px; height: 200px; transform-origin: 50% 15%; }
      .capStage { position: absolute; left: 0; right: 0; top: 896px; height: 112px; display: flex; align-items: center; justify-content: center; }
      .capCard { max-width: 1560px; padding: 10px 34px 14px; background: ${C.bg}; border: 1.5px solid ${C.dark}; border-left: 4px solid ${C.red}; font-family: "Shrikhand", serif; font-size: 36px; line-height: 1.25; text-align: center; color: ${C.dark}; }
      #footer { position: absolute; left: 60px; right: 60px; top: 1030px; height: 30px; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 20px; letter-spacing: 3px; text-transform: uppercase; color: ${C.dark}; }
      #footer .brand { position: absolute; left: 0; top: 0; }
      .chap { position: absolute; right: 60px; top: 1030px; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 20px; letter-spacing: 3px; text-transform: uppercase; color: ${C.red}; }
      #progressTrack { position: absolute; left: 0; right: 0; bottom: 0; height: 10px; background: ${C.light}; }
      #progress { position: absolute; left: 0; bottom: 0; width: 100%; height: 10px; background: ${C.red}; transform-origin: 0 50%; }
      .tick { position: absolute; bottom: 0; width: 4px; height: 18px; background: ${C.dark}; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
      <div id="footer"><span class="brand">Namaste Techy</span></div>${chapHtml}${parts.join("")}
      <div id="progressTrack"></div><div id="progress"></div>${ticks}
    </div>

    <audio id="vo" src="input/voiceover.mp3" data-start="0" data-duration="${DURATION}" data-track-index="9" data-volume="1"></audio>

    <script>
      const tl = gsap.timeline({ paused: true });
      ${T.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log(`index.html: ${parts.length} parts, ${groups.length} caption groups, ${T.length} tweens, chapters at ${CHAPTERS.map((c) => c.at.toFixed(1)).join(", ")}`);
