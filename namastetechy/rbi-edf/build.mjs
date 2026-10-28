// "RBI ka naya EDF rule aur YouTubers" long-form video, 16:9, Bold Poster (white / ink / tomato red;
// Shrikhand, Libre Baskerville, Space Grotesk) on the creator's voiceover with long pauses trimmed
// (assets/audio/voiceover.mp3, tools/tighten.py). No SFX, no music. Every beat is anchored to the
// measured start of its caption line (words.json: Whisper 10s windows + align.py + retime.py).
// B-roll: live captures of the real sites (tools/capture.mjs, tools/jobs.json).
// usage: node build.mjs   -> index.html
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const W = 1920, H = 1080;
const C = { bg: "#FFFFFF", dark: "#1C1410", red: "#D8000F", light: "#F5F2EF" };
const STACK = "0.03em 0.03em 0 rgba(28,20,16,.25), 0.06em 0.06em 0 rgba(28,20,16,.2), 0.09em 0.09em 0 rgba(28,20,16,.15)";
const { words, lines } = JSON.parse(readFileSync(new URL("./words.json", import.meta.url), "utf8"));
const DURATION = +JSON.parse(readFileSync(new URL("./assets/audio/meta.json", import.meta.url), "utf8")).duration;
const CLIPS = JSON.parse(readFileSync(new URL("./assets/broll/clips.json", import.meta.url), "utf8")); // name -> seconds

// ---------- timing helpers ----------
const lineWords = lines.map((_, i) => words.filter((w) => w.line === i));
const L = (i) => (i >= lines.length ? DURATION : lineWords[i][0].start);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9₹$]/g, "");
const wt = (i, tok, nth = 0) => {
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
// poster frame on the right; each media item plays from `from` to `to`. A capture shorter than its slot
// holds on that site's hero still for the remainder.
const FR = { x: 790, y: 120, w: 1060, h: 596 };
const frame = (media, label = "") => {
  const items = [];
  media.forEach((m) => {
    if (m.img) { items.push({ ...m }); return; }
    const len = CLIPS[m.src] ?? 0, cut = Math.min(m.to, m.from + len - 0.05);
    items.push({ ...m, to: cut });
    if (cut < m.to - 0.05) items.push({ img: true, src: `${m.src}_end.jpg`, from: cut, to: m.to });
  });
  const html = items.map((m) => m.img
    ? `<div id="${id("m")}" class="clip mwin" data-start="${r2(m.from)}" data-duration="${r2(m.to - m.from)}" data-track-index="1"><img src="assets/broll/${m.src}" class="mfill"></div>`
    : `<div class="mwin"><video id="${id("v")}" class="clip mfill" src="assets/broll/${m.src}.mp4" muted playsinline data-start="${r2(m.from)}" data-duration="${r2(m.to - m.from)}" data-track-index="1"></video></div>`).join("\n          ");
  return `
        <div class="frameOuter" style="left:${FR.x - 14}px;top:${FR.y - 14}px;width:${FR.w + 28}px;height:${FR.h + 28}px"></div>
        <div class="frame" style="left:${FR.x}px;top:${FR.y}px;width:${FR.w}px;height:${FR.h}px">
          ${html}
        </div>${label ? `<div class="frameLabel">${label}</div>` : ""}`;
};
const chips = (arr, cls = "") => `<div class="chips ${cls}">${arr.map((c) => `<span>${c}</span>`).join("")}</div>`;
const disp = (sid, x, y, size, text, cls = "", extra = "") => `<div id="${sid}" class="disp ${cls}" style="position:absolute;left:${x}px;top:${y}px;font-size:${size}px;transform-origin:20% 60%${extra}">${text}</div>`;
const masked = (sid, x, y, size, text, cls = "") => `<div class="mask" style="left:${x}px;top:${y}px"><div id="${sid}" class="disp ${cls}" style="font-size:${size}px">${text}</div></div>`;
const eyebrow = (sid, x, y, text) => `<div id="${sid}" class="eyebrow" style="left:${x}px;top:${y}px">${text}</div>`;
const tagline = (sid, x, y, w, text, extra = "") => `<div id="${sid}" class="tagline" style="left:${x}px;top:${y}px;width:${w}px${extra}">${text}</div>`;

// red title slam at the start of each chapter
const CHAPTERS = [];
const titleSlam = (n, name, at) => {
  CHAPTERS.push({ n, name, at });
  const s = id("title");
  scene(s, at, at + 1.3, "redPanel center", `
        <div class="col"><div class="eyebrow static light">Part 0${n}</div>
          <div id="${s}t" class="disp white shadow" style="font-size:150px;line-height:1.05">${name}</div></div>`, 4);
  tw(`tl.fromTo("#${s}", { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.2, ease: "power3.out" }, ${r2(at)});`);
  popIn(`#${s}t`, at + 0.1, 1.6, -4);
  tw(`tl.to("#${s}", { clipPath: "inset(0% 0% 0% 100%)", duration: 0.2, ease: "power3.in" }, ${r2(at + 1.1)});`);
};
const T0 = (t) => t + 1.15; // first entrance after a title slam

// ================= INTRO =================
{ // hook: dollar earners, the new EDF rule, 7 October
  const s = "s-hook", a = 0, b = L(3);
  scene(s, a, b, "", `
        ${eyebrow("hE", 110, 130, "YouTubers · dollar earnings")}
        ${masked("h1", 106, 170, 96, "Aap YouTuber ho?")}
        ${disp("h2", 100, 300, 128, "$ mein kamaai?", "red")}
        ${tagline("h3", 110, 500, 600, "RBI ka <b>naya EDF rule</b> — neend udne se pehle…")}
        <div id="hDate" class="dateCard" style="left:110px;top:650px"><div class="dM">OCT</div><div class="dD">7</div></div>
        ${tagline("h4", 300, 680, 420, "RBI ne kya kaha?")}
        ${frame([{ src: "yt_monetization", from: a, to: L(1) }, { src: "rbi_home", from: L(1), to: b }], "youtube.com · rbi.org.in")}`);
  wipe("#hE", 0.05); rise("#h1", 0.1); popIn("#h2", wt(0, "dollar"), 1.8, -4);
  wipe("#h3", L(1), 0.6); popIn("#hDate", wt(2, "7"), 1.8, -6); wipe("#h4", wt(2, "kya"));
}
{ // AdSense earning pe asar?
  const s = "s-ads", a = L(3), b = L(4);
  scene(s, a, b, "", `
        ${eyebrow("aE", 110, 200, "Sabse bada sawaal")}
        ${masked("a1", 106, 240, 110, "AdSense earning")}
        ${disp("a2", 100, 400, 150, "pe asar?", "red")}
        ${frame([{ src: "adsense_start", from: a, to: b }], "adsense.google.com")}`);
  wipe("#aE", a); rise("#a1", wt(3, "adsense")); popIn("#a2", wt(3, "asar"), 1.8, -5);
}
{ // agenda
  const s = "s-agenda", a = L(4), b = L(7);
  const items = ["Rule hai kya", "YouTubers itna dare kyun", "RBI ne baad mein kya clear kiya", "Aapki har YouTube income ka scene"];
  scene(s, a, b, "", `
        ${eyebrow("gE", 120, 140, "Aaj main bataunga")}
        <div id="gList" class="list" style="left:120px;top:200px">${items.map((t, i) => `<div class="li"><span class="n">0${i + 1}</span><span>${t}</span></div>`).join("")}</div>
        ${disp("g4", 1250, 560, 230, "4", "red shadow")}${tagline("g5", 1430, 640, 360, "sawaal, seedhe jawab")}`);
  wipe("#gE", a);
  [wt(4, "rule"), wt(4, "youtubers"), L(5), L(6)].forEach((t, i) => fadeUp(`#gList .li:nth-child(${i + 1})`, t));
  popIn("#g4", L(6) + 0.3, 1.8, -6); wipe("#g5", L(6) + 0.6);
}

// ================= PART 1 · THE RULE =================
titleSlam(1, "Pehle, rule.", L(7));
{ // 1 Oct 2026: new FEMA regulations; services export in the EDF framework
  const s = "r-fema", a = L(7), b = L(10), t = T0(a);
  scene(s, a, b, "", `
        ${eyebrow("fE", 110, 140, "Lagu · FEMA regulations")}
        ${disp("f1", 100, 180, 150, "1 Oct 2026", "red shadow")}
        ${masked("f2", 106, 380, 70, "naye FEMA regulations")}
        <div id="fChain" class="chain" style="left:110px;top:560px"><div class="box">Services export</div><div class="arr">→</div><div class="box red">EDF framework</div></div>
        ${frame([{ src: "taxmann_fema", from: a, to: L(9) }, { src: "scc_fema", from: L(9), to: b }], "taxmann.com · scconline.com")}`);
  wipe("#fE", t); popIn("#f1", Math.max(t, wt(8, "1")), 1.8, -4); rise("#f2", wt(8, "fema"));
  fadeUp("#fChain .box, #fChain .arr", wt(9, "services"), 0.12);
}
{ // EDF = Export Declaration Form; earlier mostly goods
  const s = "r-edf", a = L(10), b = L(12);
  scene(s, a, b, "", `
        ${eyebrow("eE", 120, 130, "EDF matlab")}
        <div id="eStack" class="acro" style="left:120px;top:180px">
          <div><span class="red">E</span>xport</div><div><span class="red">D</span>eclaration</div><div><span class="red">F</span>orm</div></div>
        <div id="eGoods" class="vsCard" style="left:1150px;top:220px"><div class="tag ink">Pehle</div><div class="lab">Goods export</div><div class="lab2">zyada tar saamaan bhejne walon ke liye</div></div>
        <div id="eSvc" class="vsCard" style="left:1150px;top:520px"><div class="tag">Ab</div><div class="lab">+ Services export</div><div class="lab2">freelancers, creators, consultants…</div></div>`);
  wipe("#eE", a); fadeUp("#eStack > div", wt(10, "export"), 0.28);
  fadeUp("#eGoods", wt(11, "goods")); fadeUp("#eSvc", L(11) + 1.6);
}
{ // the idea: India -> service -> foreign client -> money in -> report via bank
  const s = "r-idea", a = L(12), b = L(16);
  scene(s, a, b, "", `
        ${eyebrow("iE", 120, 120, "Idea yeh hai")}
        <div id="iChain" class="chain" style="left:120px;top:190px">
          <div class="box">Aap · India</div><div class="arr">→</div><div class="box">service</div><div class="arr">→</div><div class="box">videshi client</div></div>
        <div id="iBack" class="chain" style="left:120px;top:330px"><div class="box red">$ paisa bahar se</div><div class="arr">→</div><div class="box">= service export?</div></div>
        <div id="iBank" class="chain" style="left:120px;top:470px"><div class="box">Bank</div><div class="arr">→</div><div class="box red">EDF jaankari</div></div>
        ${tagline("iNote", 120, 640, 640, "ho <b>sakta</b> hai · deni pad <b>sakti</b> hai")}
        ${frame([{ src: "bt_edf", from: wt(13, "paisa"), to: b }], "businesstoday.in · 6 Oct")}`);
  wipe("#iE", a); fadeUp("#iChain > *", wt(12, "india"), 0.12);
  fadeUp("#iBack > *", wt(13, "paisa"), 0.15); fadeUp("#iBank > *", wt(15, "bank"), 0.15); wipe("#iNote", wt(15, "sakti") - 0.4, 0.6);
}

// ================= PART 2 · WHY YOUTUBERS PANICKED =================
titleSlam(2, "YouTubers ka darr", L(16));
{ // a YouTuber's money: AdSense monthly, foreign sponsors in dollars
  const s = "d-life", a = L(16), b = L(19), t = T0(a);
  scene(s, a, b, "", `
        ${eyebrow("lE", 120, 140, "Ab socho · ek YouTuber ki life")}
        <div id="lC1" class="vsCard" style="left:120px;top:200px;width:600px"><div class="tag">Har mahine</div><div class="lab">Google AdSense</div><div class="lab2">ads ka paisa, Google se</div></div>
        <div id="lC2" class="vsCard" style="left:120px;top:470px;width:600px"><div class="tag ink">Kabhi kabhi</div><div class="lab">Foreign brand · $</div><div class="lab2">sponsorship ka paisa, seedha dollar mein</div></div>
        ${frame([{ src: "adsense_payments", from: a, to: b }], "support.google.com/adsense")}`);
  wipe("#lE", t); fadeUp("#lC1", Math.max(t, wt(17, "google"))); fadeUp("#lC2", wt(18, "foreign"));
}
{ // the fear: a bank form for every payment?
  const s = "d-form", a = L(19), b = L(21);
  const sheets = [0, 1, 2, 3, 4].map((i) => `<div class="sheet" style="transform:translate(${i * 16}px,${-i * 16}px) rotate(${(i - 2) * 2}deg)"></div>`).join("");
  scene(s, a, b, "", `
        ${eyebrow("qE", 120, 200, "YouTubers ne socha")}
        ${masked("q1", 116, 240, 92, "Har payment pe")}
        ${disp("q2", 110, 380, 130, "bank form?", "red shadow")}
        <div id="qStack" class="stackWrap" style="left:1220px;top:150px">${sheets}<div class="sheet top"><div class="pdfTag">EDF</div>${"<div class='ln'></div>".repeat(10)}</div></div>`);
  wipe("#qE", a); rise("#q1", wt(20, "har")); popIn("#q2", wt(20, "form"), 1.8, -4);
  tw(`tl.fromTo("#qStack .sheet", { y: -500, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: "power3.out" }, ${r2(wt(20, "payment"))});`);
}
{ // no minimum threshold; small creators most scared; "fill a form for just being alive"
  const s = "d-scare", a = L(21), b = L(25);
  scene(s, a, b, "", `
        ${eyebrow("sE", 120, 120, "Kuch reports ke hisaab se")}
        <div id="sMin" class="nums" style="left:120px;top:160px"><span>Minimum chhoot</span><span class="q">₹0</span></div>
        <div id="sSmall" class="vsCard" style="left:120px;top:330px;width:620px"><div class="tag">Sabse zyada dare</div><div class="lab">Chhote creators</div><div class="lab2"><s>CA</s> &nbsp; <s>accountant</s></div></div>
        <div id="sQuote" class="quote" style="left:120px;top:620px;width:620px">“Fill a form for just being alive.”<div class="qSrc">— experts, via a business news report</div></div>
        ${frame([{ src: "studycafe_edf", from: a, to: b }], "studycafe.in")}`);
  wipe("#sE", a); fadeUp("#sMin span", wt(21, "minimum"), 0.15); fadeUp("#sSmall", L(22)); wipe("#sQuote", L(24), 0.9);
}

// ================= PART 3 · 7 OCTOBER =================
titleSlam(3, "Par ruko!", L(25));
{ // six days later, RBI changed the picture; the twist depends on income type
  const s = "c-six", a = L(25), b = L(30), t = T0(a);
  scene(s, a, b, "", `
        ${eyebrow("xE", 120, 140, "Sirf")}
        ${disp("x6", 110, 160, 260, "6 din", "red shadow")}
        ${masked("x2", 120, 470, 64, "baad, RBI ne picture badal di")}
        <div id="xDates" class="dates" style="left:1060px;top:230px">
          <div class="dateCard"><div class="dM">OCT</div><div class="dD">1</div></div><div class="arr">→</div>
          <div class="dateCard red"><div class="dM">OCT</div><div class="dD">7</div></div></div>
        <div id="xTwist" class="vsCard" style="left:1060px;top:560px;width:640px"><div class="tag">Twist</div><div class="lab">Aapki income ka type</div></div>`);
  wipe("#xE", t); popIn("#x6", Math.max(t + 0.1, wt(26, "6")), 1.8, -5); rise("#x2", L(27));
  fadeUp("#xDates > *", wt(26, "october"), 0.12); fadeUp("#xTwist", wt(28, "twist"));
}
{ // Business Today: personal-nature contracts, individuals not covered; tuition / small software
  const s = "c-bt", a = L(30), b = L(34);
  scene(s, a, b, "", `
        ${eyebrow("bE", 120, 120, "Business Today ke mutabik · RBI")}
        <div id="bQ" class="quote" style="left:120px;top:170px;width:620px">Personal nature ke contracts: <b>individuals</b> is reporting mein <span class="red">shaamil nahi</span>.</div>
        ${eyebrow("bG", 120, 470, "Governor ka example")}
        ${chips(["Tuition padhana", "Chhota software kaam"]).replace('class="chips "', 'id="bChips" class="chips big" style="left:120px;top:520px"')}
        ${frame([{ src: "fueler_clarify", from: a, to: b }], "secondary report · fueler.io")}`);
  wipe("#bE", a); wipe("#bQ", wt(31, "personal"), 0.9); wipe("#bG", L(33)); fadeUp("#bChips span", wt(33, "tuition"), 0.4);
}
{ // so: individual creator -> EDF tension kaafi kam
  const s = "c-calm", a = L(34), b = L(37);
  scene(s, a, b, "", `
        ${eyebrow("mE", 120, 180, "Matlab · individual creator?")}
        ${masked("m1", 116, 220, 110, "EDF tension")}
        ${disp("m2", 110, 380, 170, "kaafi kam", "red shadow")}
        ${tagline("m3", 120, 640, 640, "abhi ke statement ke hisaab se")}
        <div id="mMeter" class="meter" style="left:1240px;top:180px"><div class="mLab">tension</div><div id="mFill" class="mFill"></div></div>`);
  wipe("#mE", a); rise("#m1", wt(36, "edf")); popIn("#m2", wt(36, "kaafi"), 1.8, -4); wipe("#m3", wt(35, "statement"));
  tw(`tl.fromTo("#mFill", { scaleY: 1 }, { scaleY: 0.22, duration: 1.2, ease: "power2.inOut" }, ${r2(wt(36, "kam"))});`);
}

// ================= PART 4 · THREE KINDS OF YOUTUBE INCOME =================
titleSlam(4, "Income ke 3 hisse", L(37));
const tracker = (k) => `<div class="tracker">${["AdSense / YouTube", "Foreign brands", "Indian brands"].map((n, i) => `<span class="${i === k ? "on" : ""}">0${i + 1} · ${n}</span>`).join("")}</div>`;
{ // 1: AdSense / YouTube money: ads, memberships, Super Chat; unclear
  const s = "i-ads", a = L(38), b = L(45), t = T0(L(37));
  scene(s, Math.max(a, L(37) + 1.1), b, "", `
        ${tracker(0)}
        ${disp("j1", 110, 170, 120, "01 · AdSense", "red")}
        ${chips(["Ads", "Memberships", "Super Chat"]).replace('class="chips "', 'id="jChips" class="chips big" style="left:120px;top:340px"')}
        ${masked("j2", 116, 470, 62, "Ad revenue = service export?")}
        <div id="jStat" class="vsCard" style="left:120px;top:590px;width:620px"><div class="tag">Status</div><div class="lab">Abhi clear nahi</div><div class="lab2">experts ki raay alag · RBI ne alag se kuch nahi kaha</div></div>
        ${frame([{ src: "yt_monetization", from: Math.max(a, L(37) + 1.1), to: b }], "youtube.com/creators")}`);
  popIn("#j1", t, 1.6, -3); fadeUp("#jChips span", wt(39, "ads", 1), 0.35);
  rise("#j2", L(42)); fadeUp("#jStat", L(43));
}
{ // 2: foreign brand deals: many experts say service export
  const s = "i-foreign", a = L(45), b = L(49);
  scene(s, a, b, "", `
        ${tracker(1)}
        ${disp("k1", 110, 170, 120, "02 · Foreign brands", "red")}
        <div id="kChain" class="chain" style="left:120px;top:360px"><div class="box">Videshi brand</div><div class="arr">→</div><div class="box">$ seedha aapko</div><div class="arr">→</div><div class="box">sponsored video</div></div>
        <div id="kStat" class="vsCard" style="left:120px;top:520px;width:760px"><div class="tag">Kai experts</div><div class="lab">= service export</div><div class="lab2">yahan dhyan dena zaroori hai</div></div>
        ${disp("kWarn", 1380, 430, 220, "!", "red shadow")}`);
  popIn("#k1", a + 0.05, 1.6, -3); fadeUp("#kChain > *", wt(46, "videshi"), 0.12); fadeUp("#kStat", L(47)); popIn("#kWarn", L(48), 2, -8);
}
{ // 3: Indian brand deals: rupees within India is not export
  const s = "i-india", a = L(49), b = L(53);
  scene(s, a, b, "", `
        ${tracker(2)}
        ${disp("n1", 110, 170, 120, "03 · Indian brands", "red")}
        <div id="nChain" class="chain" style="left:120px;top:360px"><div class="box">Indian brand</div><div class="arr">→</div><div class="box">₹ India se</div><div class="arr">→</div><div class="box">aap · India</div></div>
        <div id="nStat" class="vsCard" style="left:120px;top:520px;width:760px"><div class="tag ink">Export hi nahi</div><div class="lab">Is rule se lena dena nahi</div></div>
        ${disp("nOk", 1360, 400, 220, "₹", "shadow")}`);
  popIn("#n1", a + 0.05, 1.6, -3); fadeUp("#nChain > *", wt(50, "brand"), 0.12); fadeUp("#nStat", L(51)); popIn("#nOk", wt(50, "rupay"), 1.8, -6);
}
{ // one more thing: company / LLP / firm may still be covered; GST sole proprietors await FAQs
  const s = "i-biz", a = L(53), b = L(58);
  scene(s, a, b, "", `
        ${eyebrow("zE", 120, 120, "Aur ek baat")}
        ${chips(["Company", "LLP", "Firm"]).replace('class="chips "', 'id="zChips" class="chips big" style="left:120px;top:170px"')}
        ${masked("z1", 116, 290, 70, "abhi bhi cover ho sakte")}
        <div id="zGst" class="vsCard" style="left:120px;top:450px;width:620px"><div class="tag ink">GST wale sole proprietors</div><div class="lab">Final jawab: RBI FAQs</div><div class="lab2">jo abhi aane baaki hain</div></div>
        ${frame([{ src: "winvesta_fema", from: a, to: L(56) }, { src: "rbi_faq", from: L(56), to: b }], "winvesta.in · rbi.org.in")}`);
  wipe("#zE", a); fadeUp("#zChips span", wt(54, "company"), 0.3); rise("#z1", wt(55, "businesses")); fadeUp("#zGst", L(56));
}

// ================= PART 5 · FOUR STEPS =================
titleSlam(5, "Ab kya karein?", L(58));
const steps = [["Panic mat karo", "individual creators ke liye raahat"], ["Records rakho", "AdSense statements · invoices · FIRA docs"], ["Bank se poocho", "EDF bank ke through jaata hai"], ["CA se baat karo", "company / business / badi foreign deals"]];
const stepList = (on) => `<div class="steps">${steps.map(([h, sub], i) => `<div id="st${on}_${i}" class="st ${i < on ? "done" : ""}"><span class="n">0${i + 1}</span><div><div>${h}</div><div class="sub">${sub}</div></div></div>`).join("")}</div>`;
{ // steps 1-2
  const s = "p-steps1", a = L(58), b = L(65), t = T0(a);
  scene(s, a, b, "", `
        ${eyebrow("pE", 120, 110, "Chaar steps")}
        <div style="position:absolute;left:120px;top:160px">${stepList(0)}</div>
        <div id="pDocs" class="docs" style="left:1180px;top:200px">
          <div class="doc"><div class="tag">PDF</div>AdSense payment statement</div>
          <div class="doc"><div class="tag ink">INV</div>Brand deal invoice</div>
          <div class="doc"><div class="tag">FIRA</div>Foreign inward remittance</div></div>`);
  wipe("#pE", t); fadeUp("#st0_0", L(60)); fadeUp("#st0_1", L(62));
  tw(`tl.set("#st0_2, #st0_3", { opacity: 0 }, ${r2(a)});`);
  fadeUp("#pDocs .doc", wt(63, "adsense"), 0.6);
}
{ // steps 3-4
  const s = "p-steps2", a = L(65), b = L(70);
  scene(s, a, b, "", `
        <div style="position:absolute;left:120px;top:160px">${stepList(2)}</div>
        ${frame([{ src: "razorpay_edf", from: a, to: b }], "razorpay.com/blog")}`.replace('class="steps"', 'class="steps small"'));
  tw(`tl.set("#st2_2, #st2_3", { opacity: 0 }, ${r2(a)});`);
  fadeUp("#st2_2", a + 0.05); fadeUp("#st2_3", L(68));
}

// ================= SUMMARY + OUTRO =================
{ // summary
  const s = "o-sum", a = L(70), b = L(74);
  scene(s, a, b, "", `
        ${eyebrow("uE", 120, 130, "Summary")}
        <div id="uGrid" class="sumGrid" style="left:120px;top:180px">
          <div class="row"><span class="mk">✓</span><span>Individual YouTubers</span><span class="v">tension kam</span></div>
          <div class="row"><span class="mk red">!</span><span>Foreign brand deals</span><span class="v red">dhyan do</span></div>
          <div class="row"><span class="mk">…</span><span>AdSense</span><span class="v">RBI FAQs ka wait</span></div></div>
        ${tagline("uUp", 120, 690, 900, "FAQs aate hi → <b>update video</b>")}`);
  wipe("#uE", a); fadeUp("#uGrid .row:nth-child(1)", wt(70, "individual")); fadeUp("#uGrid .row:nth-child(2)", L(71)); fadeUp("#uGrid .row:nth-child(3)", L(72)); wipe("#uUp", L(73), 0.6);
}
{ // disclaimer
  const s = "o-disc", a = L(74), b = L(76);
  scene(s, a, b, "redPanel center", `
        <div class="col"><div class="eyebrow static light">Disclaimer</div>
          <div id="dc1" class="disp white shadow" style="font-size:96px">Legal ya tax advice nahi</div>
          <div id="dc2" class="disp white" style="font-size:60px;margin-top:24px">Bank ya CA se confirm karein</div></div>`);
  popIn("#dc1", a + 0.05, 1.5, -2); wipe("#dc2", L(75), 0.6);
}
{ // poll + subscribe
  const s = "o-end", a = L(76), b = DURATION;
  scene(s, a, b, "", `
        ${eyebrow("eE2", 120, 140, "Comment mein batao")}
        ${masked("e1", 116, 180, 84, "Sabse zyada kamaai?")}
        <div id="ePoll" class="poll" style="left:120px;top:340px"><div>A · AdSense</div><div>B · Foreign brands</div><div>C · Indian brands</div></div>
        <div id="eSub" class="brandCard" style="left:1120px;top:260px;width:640px">
          <div class="eyebrow static">Creator updates ke liye</div><div class="disp" style="font-size:96px">NamasteTechy</div>
          <div id="eBtn" class="subBtn">SUBSCRIBE</div></div>`);
  wipe("#eE2", L(78)); rise("#e1", a + 0.05); fadeUp("#ePoll > div", wt(77, "adsense"), 0.45);
  fadeUp("#eSub", wt(79, "namastetechy")); popIn("#eBtn", wt(79, "subscribe"), 1.6, -3);
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
const chapterLabels = [{ name: "Intro", at: 0 }, ...CHAPTERS.map((c) => ({ name: `Part 0${c.n} · ${c.name.replace(/[.!?]/g, "")}`, at: c.at })), { name: "Summary", at: L(70) }];
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
      .mask { position: absolute; overflow: hidden; padding-bottom: 6px; }
      .mask > div { display: block; }
      .eyebrow { position: absolute; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 26px; letter-spacing: 3px; text-transform: uppercase; color: ${C.red}; white-space: nowrap; }
      .eyebrow.static { position: static; margin-bottom: 8px; }
      .eyebrow.light { color: ${C.bg}; font-size: 34px; letter-spacing: 6px; }
      .tagline { position: absolute; padding-left: 20px; border-left: 4px solid ${C.red}; font-size: 36px; line-height: 1.45; }
      .redPanel { background: ${C.red}; }
      .frameOuter { position: absolute; border: 3px solid ${C.dark}; background: ${C.light}; }
      .frame { position: absolute; overflow: hidden; outline: 1.5px solid ${C.dark}; background: ${C.bg}; }
      .mwin { position: absolute; inset: 0; width: 100%; height: 100%; }
      .mfill { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 0%; }
      .frameLabel { position: absolute; left: ${FR.x}px; top: ${FR.y + FR.h + 24}px; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 22px; letter-spacing: 3px; text-transform: uppercase; color: ${C.dark}; }
      .list { position: absolute; display: flex; flex-direction: column; gap: 24px; }
      .list .li, .steps .st { display: flex; align-items: baseline; gap: 26px; font-family: "Shrikhand", serif; font-size: 56px; border-left: 4px solid ${C.red}; padding-left: 22px; white-space: nowrap; }
      .list .n, .steps .n { color: ${C.red}; font-size: 44px; }
      .steps { display: flex; flex-direction: column; gap: 30px; }
      .steps .st .sub { font-family: "Libre Baskerville", serif; font-size: 28px; color: #5a504a; margin-top: 4px; }
      .steps .st.done { opacity: .35; }
      .steps.small .st { font-size: 50px; }
      .tag { align-self: flex-start; padding: 6px 16px 8px; background: ${C.red}; color: ${C.bg}; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 22px; letter-spacing: 3px; text-transform: uppercase; }
      .tag.ink { background: ${C.dark}; }
      .vsCard { position: absolute; width: 560px; padding: 24px 32px 28px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 6px; background: ${C.bg}; display: flex; flex-direction: column; gap: 10px; }
      .lab { font-family: "Shrikhand", serif; font-size: 52px; line-height: 1.15; }
      .lab2 { font-size: 28px; line-height: 1.4; }
      .lab2 s { text-decoration-color: ${C.red}; text-decoration-thickness: 4px; }
      .acro { position: absolute; font-family: "Shrikhand", serif; font-size: 130px; line-height: 1.12; }
      .acro .red { color: ${C.red}; }
      .chain { position: absolute; display: flex; align-items: center; gap: 14px; }
      .chain .box { padding: 16px 22px 20px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 40px; white-space: nowrap; background: ${C.bg}; }
      .chain .box.red { background: ${C.red}; color: ${C.bg}; border-color: ${C.red}; }
      .chain .arr { font-family: "Shrikhand", serif; font-size: 48px; color: ${C.red}; }
      .chips { position: absolute; display: flex; gap: 14px; }
      .chips span { padding: 8px 20px 12px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 34px; }
      .chips span:first-child { background: ${C.red}; color: ${C.bg}; border-color: ${C.red}; }
      .chips.big span { font-size: 46px; padding: 10px 26px 16px; }
      .nums { position: absolute; display: flex; gap: 18px; align-items: center; }
      .nums span { padding: 10px 26px 16px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 56px; }
      .nums span.q { background: ${C.red}; color: ${C.bg}; border-color: ${C.red}; font-size: 72px; }
      .quote { position: absolute; font-family: "Libre Baskerville", serif; font-size: 36px; line-height: 1.45; padding: 22px 28px; border: 3px solid ${C.dark}; border-left: 8px solid ${C.red}; background: ${C.light}; }
      .quote .qSrc { margin-top: 10px; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 20px; letter-spacing: 2px; text-transform: uppercase; color: #6c625c; }
      .dateCard { position: absolute; width: 150px; border: 3px solid ${C.dark}; background: ${C.bg}; text-align: center; }
      .dateCard .dM { background: ${C.red}; color: ${C.bg}; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 28px; letter-spacing: 4px; padding: 6px 0 8px; }
      .dateCard .dD { font-family: "Shrikhand", serif; font-size: 96px; line-height: 1.2; }
      .dates { position: absolute; display: flex; align-items: center; gap: 30px; }
      .dates .dateCard { position: static; width: 220px; } .dates .dateCard .dD { font-size: 150px; }
      .dates .dateCard.red { border-color: ${C.red}; outline: 3px solid ${C.red}; outline-offset: 6px; }
      .dates .arr { font-family: "Shrikhand", serif; font-size: 90px; color: ${C.red}; }
      .meter { position: absolute; width: 220px; height: 600px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 6px; background: ${C.light}; }
      .meter .mFill { position: absolute; left: 0; right: 0; bottom: 0; height: 100%; background: ${C.red}; transform-origin: 50% 100%; }
      .meter .mLab { position: absolute; left: 0; right: 0; top: -54px; text-align: center; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 24px; letter-spacing: 3px; text-transform: uppercase; }
      .tracker { position: absolute; left: 120px; top: 90px; display: flex; gap: 10px; }
      .tracker span { padding: 4px 14px 6px; border: 2px solid ${C.dark}; font-family: "Space Grotesk", sans-serif; font-weight: 600; font-size: 20px; letter-spacing: 2px; text-transform: uppercase; color: #8a807a; }
      .tracker span.on { background: ${C.dark}; color: ${C.bg}; }
      .stackWrap { position: absolute; width: 470px; height: 620px; }
      .sheet { position: absolute; inset: 0; width: 100%; height: 100%; background: ${C.bg}; border: 3px solid ${C.dark}; }
      .sheet.top { padding: 90px 44px 0; }
      .sheet .ln { height: 14px; margin: 0 0 28px; background: ${C.light}; border: 1.5px solid #d9d2cc; }
      .pdfTag { position: absolute; right: 36px; top: 24px; padding: 4px 14px 8px; background: ${C.red}; color: ${C.bg}; font-family: "Shrikhand", serif; font-size: 32px; }
      .docs { position: absolute; display: flex; flex-direction: column; gap: 26px; width: 620px; }
      .docs .doc { display: flex; align-items: center; gap: 22px; padding: 22px 26px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 36px; background: ${C.bg}; }
      .docs .doc .tag { align-self: center; }
      .sumGrid { position: absolute; display: flex; flex-direction: column; border: 3px solid ${C.dark}; width: 1680px; }
      .sumGrid .row { display: grid; grid-template-columns: 120px 1fr 1fr; align-items: center; border: 1.5px solid ${C.dark}; min-height: 140px; font-family: "Shrikhand", serif; font-size: 56px; }
      .sumGrid .mk { text-align: center; font-size: 70px; } .sumGrid .v { padding-right: 30px; }
      .poll { position: absolute; display: flex; flex-direction: column; gap: 22px; }
      .poll div { width: 760px; padding: 18px 30px 24px; border: 3px solid ${C.dark}; font-family: "Shrikhand", serif; font-size: 52px; }
      .poll div:first-child { border-left: 12px solid ${C.red}; }
      .brandCard { position: absolute; padding: 36px 0 44px; border: 3px solid ${C.dark}; outline: 1.5px solid ${C.dark}; outline-offset: 8px; display: flex; flex-direction: column; align-items: center; gap: 18px; }
      .subBtn { padding: 16px 50px 22px; background: ${C.red}; color: ${C.bg}; font-family: "Shrikhand", serif; font-size: 54px; }
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

    <audio id="vo" src="assets/audio/voiceover.mp3" data-start="0" data-duration="${DURATION}" data-track-index="9" data-volume="1"></audio>

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
