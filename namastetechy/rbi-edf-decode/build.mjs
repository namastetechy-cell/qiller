// "RBI ka naya EDF rule aur YouTubers", 16:9, in the style of the Paisa Decode reference
// (input/reference_sheet.jpg): cream paper and night-spotlight scenes, one burnt-orange accent, heavy
// Montserrat numbers with tiny spaced-caps labels, rolling-digit counters, faceless bean characters,
// pinned website screenshots stamped REAL, level cards and a padlock tracker, soft blur crossfades
// and a coin zoom-through. No captions (the on-screen words carry it), no SFX, no music.
// Voiceover + timing are shared with ../rbi-edf (pauses trimmed by tools/tighten.py, line times from
// tools/pause_align.py). usage: node build.mjs -> index.html
import { readFileSync, writeFileSync } from "node:fs";

const W = 1920, H = 1080;
const C = { cream: "#F1ECE4", ink: "#1E1B1A", orange: "#E8612C", grey: "#756E66", night: "#1B1B23", paper: "#FBF8F3", bean: "#2B2726", blue: "#2C3E78" };
const { words, lines } = JSON.parse(readFileSync(new URL("./words.json", import.meta.url), "utf8"));
const DUR = +JSON.parse(readFileSync(new URL("./assets/audio/meta.json", import.meta.url), "utf8")).duration;

// ---------- timing ----------
const lineWords = lines.map((_, i) => words.filter((w) => w.line === i));
const L = (i) => (i >= lines.length ? DUR : lineWords[i][0].start);
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
let sceneN = 0;
// scenes alternate tracks so each can fade in over the previous one (blur crossfade)
const scene = (a, b, mode, inner) => {
  const id = `sc${sceneN}`, track = 2 + (sceneN++ % 2), from = Math.max(0, a - 0.3);
  parts.push(`
      <div id="${id}" class="clip layer ${mode}" data-start="${r2(from)}" data-duration="${r2(b - from)}" data-track-index="${track}">
        <div class="bg"></div><div id="${id}-st" class="layer">${inner}</div>
      </div>`);
  if (from > 0) tw(`tl.fromTo("#${id}", { opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power2.out" }, ${r2(from)});`);
  tw(`tl.fromTo("#${id}-st", { scale: 1 }, { scale: 1.025, duration: ${r2(b - from)}, ease: "none" }, ${r2(from)});`);
  return id;
};
const pop = (sel, t, from = 0.6, rot = 0) => tw(`tl.fromTo("${sel}", { opacity: 0, scale: ${from}, rotation: ${rot - 6} }, { opacity: 1, scale: 1, rotation: ${rot}, duration: 0.45, ease: "back.out(1.8)" }, ${r2(t)});`);
const fade = (sel, t, y = 24, stagger = 0) => tw(`tl.fromTo("${sel}", { opacity: 0, y: ${y}, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "power2.out"${stagger ? `, stagger: ${stagger}` : ""} }, ${r2(t)});`);
const out = (sel, t) => tw(`tl.to("${sel}", { opacity: 0, filter: "blur(6px)", duration: 0.25, ease: "power1.in" }, ${r2(t)});`);
const strike = (sel, t) => tw(`tl.fromTo("${sel}", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power2.out" }, ${r2(t)});`);
const drop = (sel, t, rot = 0) => tw(`tl.fromTo("${sel}", { opacity: 0, y: -260, rotation: ${rot - 8} }, { opacity: 1, y: 0, rotation: ${rot}, duration: 0.6, ease: "bounce.out" }, ${r2(t)});`);
const S = (vb, body, extra = "") => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"${extra}>${body}</svg>`;

// text helpers: tiny spaced caps label, heavy headline, positioned box
const lab = (id, x, y, txt, extra = "") => `<div id="${id}" class="lab" style="left:${x}px;top:${y}px${extra}">${txt}</div>`;
const big = (id, x, y, size, txt, cls = "", extra = "") => `<div id="${id}" class="big ${cls}" style="left:${x}px;top:${y}px;font-size:${size}px${extra}">${txt}</div>`;
const ctr = (id, y, size, txt, cls = "", extra = "") => `<div id="${id}" class="big ${cls}" style="left:0;right:0;top:${y}px;text-align:center;font-size:${size}px${extra}">${txt}</div>`;
const ctrLab = (id, y, txt, extra = "") => `<div id="${id}" class="lab" style="left:0;right:0;top:${y}px;text-align:center${extra}">${txt}</div>`;
const at = (sel, x, y, w, html, extra = "") => `<div id="${sel}" class="abs" style="left:${x}px;top:${y}px;width:${w}px${extra}">${html}</div>`;

// rolling-digit counter: each digit is a column of 0-9 x3 that slides to its target
const odo = (id, final) => `<span id="${id}" class="odo">${[...final].map((ch, k) => /\d/.test(ch)
  ? `<span class="dg"><span id="${id}-${k}" class="dcol">${Array.from({ length: 30 }, (_, n) => `<span>${n % 10}</span>`).join("")}</span></span>`
  : `<span class="sep">${ch}</span>`).join("")}</span>`;
const roll = (id, final, from, t, dur = 1.2) => {
  const f = [...final], s = [...from.padStart(f.length, "0")];
  f.forEach((ch, k) => {
    if (!/\d/.test(ch)) return;
    const a = +(/\d/.test(s[k]) ? s[k] : 0), b = +ch + (k >= f.length - 3 ? 20 : 10);
    tw(`tl.fromTo("#${id}-${k}", { yPercent: ${r2(-a / 30 * 100)} }, { yPercent: ${r2(-b / 30 * 100)}, duration: ${r2(dur + k * 0.05)}, ease: "power3.out" }, ${r2(t)});`);
  });
};
const setOdo = (id, final, t) => [...final].forEach((ch, k) => { if (/\d/.test(ch)) tw(`tl.set("#${id}-${k}", { yPercent: ${r2(-(+ch + 20) / 30 * 100)} }, ${r2(t)});`); });

// ---------- props ----------
const coin = (sym = "₹") => S("0 0 240 240", `<circle cx="120" cy="128" r="104" fill="#C24E20"/><circle cx="120" cy="118" r="104" fill="${C.orange}"/><circle cx="120" cy="118" r="84" fill="none" stroke="#F59A6C" stroke-width="6"/>
  <text x="120" y="160" text-anchor="middle" font-family="Montserrat" font-weight="900" font-size="120" fill="#FFF4EC">${sym}</text>`);
// faceless bean people. kind: hero (orange headphones), boss (glasses + tie), banker (cap), ca (glasses + clipboard), other
const bean = (kind = "hero", face = "calm", tint = C.bean) => {
  const eyes = face === "worried" ? `<path d="M80 66 l12 6 M120 72 l12 -6" stroke="#EDE6DC" stroke-width="6" stroke-linecap="round"/><circle cx="86" cy="80" r="6" fill="#EDE6DC"/><circle cx="126" cy="80" r="6" fill="#EDE6DC"/>`
    : `<circle cx="86" cy="76" r="6.5" fill="#EDE6DC"/><circle cx="126" cy="76" r="6.5" fill="#EDE6DC"/>`;
  const mouth = { calm: `<path d="M92 100 h28" stroke="#EDE6DC" stroke-width="6" stroke-linecap="round"/>`, happy: `<path d="M88 96 q18 18 36 0" fill="none" stroke="#EDE6DC" stroke-width="6" stroke-linecap="round"/>`,
    worried: `<path d="M90 104 q8 -8 16 0 t16 0" fill="none" stroke="#EDE6DC" stroke-width="6" stroke-linecap="round"/>`, o: `<ellipse cx="106" cy="102" rx="9" ry="11" fill="#EDE6DC"/>` }[face] || "";
  const acc = {
    hero: `<path d="M48 84 Q46 22 106 20 Q166 22 164 84" fill="none" stroke="${C.orange}" stroke-width="12"/><rect x="36" y="66" width="24" height="44" rx="10" fill="${C.orange}"/><rect x="152" y="66" width="24" height="44" rx="10" fill="${C.orange}"/>`,
    boss: `<g fill="none" stroke="#EDE6DC" stroke-width="5"><circle cx="86" cy="76" r="16"/><circle cx="126" cy="76" r="16"/><path d="M102 76 h8"/></g><path d="M106 150 l-12 14 l12 70 l12 -70 Z" fill="${C.orange}"/>`,
    banker: `<path d="M50 52 Q106 10 162 52 L170 60 H42 Z" fill="${C.orange}"/>`,
    ca: `<g fill="none" stroke="#EDE6DC" stroke-width="5"><rect x="70" y="62" width="32" height="26" rx="6"/><rect x="110" y="62" width="32" height="26" rx="6"/></g><rect x="128" y="190" width="58" height="76" rx="6" fill="#EDE6DC"/><rect x="146" y="184" width="22" height="12" rx="3" fill="${C.orange}"/>`,
    other: "",
  }[kind];
  return S("0 0 212 380", `<ellipse cx="106" cy="370" rx="70" ry="10" fill="rgba(0,0,0,.18)"/><rect x="50" y="138" width="112" height="232" rx="56" fill="${tint}"/><circle cx="106" cy="78" r="58" fill="${tint}"/>${eyes}${mouth}${acc}`);
};
// a website screenshot pinned like a polaroid, optional REAL stamp
const shot = (id, src, x, y, w, rot, caption, real = false) => `
        <div id="${id}" class="shot" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg)">
          <div class="pin"></div><div class="shImg"><img src="assets/shots/${src}.jpg"></div>
          <div class="shCap">${caption}</div>${real ? `<div class="real">REAL</div>` : ""}
        </div>`;
const phone = (id, x, y, rows, title) => `
        <div id="${id}" class="phone" style="left:${x}px;top:${y}px"><div class="notch"></div><div class="phT">${title}</div>${rows.map((r, i) => `<div id="${id}-r${i}" class="phRow">${r}</div>`).join("")}</div>`;
const lock = (open) => S("0 0 40 48", `<path d="M10 22 V14 a10 10 0 0 1 20 0 ${open ? "" : "V22"}" fill="none" stroke="${open ? "#fff" : C.ink}" stroke-width="4"/><rect x="4" y="22" width="32" height="24" rx="5" fill="${open ? "#fff" : C.ink}"/>`);
const stamp = (id, x, y, txt, rot = -8, extra = "") => `<div id="${id}" class="stamp" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)${extra}">${txt}</div>`;
const bubble = (id, x, y, txt, extra = "") => `<div id="${id}" class="bubble" style="left:${x}px;top:${y}px${extra}">${txt}</div>`;
const chips = (id, x, y, arr, cls = "") => `<div id="${id}" class="chipRow ${cls}" style="left:${x}px;top:${y}px">${arr.map((c, i) => `<span id="${id}-${i}" class="chip">${c}</span>`).join("")}</div>`;
const bank = () => S("0 0 260 220", `<path d="M20 70 L130 14 L240 70 Z" fill="${C.ink}"/><rect x="28" y="70" width="204" height="14" fill="${C.ink}"/>${[0, 1, 2, 3].map((i) => `<rect x="${44 + i * 50}" y="94" width="22" height="88" fill="${C.ink}"/>`).join("")}<rect x="20" y="186" width="220" height="20" fill="${C.ink}"/><circle cx="130" cy="48" r="12" fill="${C.orange}"/>`);
const globe = () => S("0 0 200 200", `<circle cx="100" cy="100" r="86" fill="none" stroke="${C.ink}" stroke-width="10"/><ellipse cx="100" cy="100" rx="40" ry="86" fill="none" stroke="${C.ink}" stroke-width="8"/><path d="M18 74 H182 M18 126 H182" stroke="${C.ink}" stroke-width="8"/>`);
const formDoc = (title) => S("0 0 200 260", `<rect x="8" y="8" width="184" height="244" rx="10" fill="#fff" stroke="${C.ink}" stroke-width="6"/><rect x="8" y="8" width="184" height="46" rx="10" fill="${C.orange}"/><text x="100" y="42" text-anchor="middle" font-family="Montserrat" font-weight="800" font-size="26" fill="#fff">${title}</text>${[80, 112, 144, 176, 208].map((y) => `<rect x="30" y="${y}" width="${y % 64 ? 140 : 100}" height="12" rx="6" fill="#E3DCD2"/>`).join("")}`);

// ---------- persistent HUD: brand + chapter padlocks (top right), like the reference's tracker ----------
const CH = [["RULE", 7], ["DARR", 16], ["JAWAB", 25], ["INCOME", 37], ["STEPS", 58]];
const hud = `
      <div id="hud" class="hud"><div class="hudLab">EDF PLAN</div><div class="locks">${CH.map(([n], i) => `<div id="lk${i}" class="lk"><span class="lkC">${lock(false)}</span><span class="lkO">${lock(true)}</span></div>`).join("")}</div></div>`;
CH.forEach(([, li], i) => {
  tw(`tl.set("#lk${i}", { backgroundColor: "${C.orange}", borderColor: "${C.orange}" }, ${r2(L(li))});`);
  tw(`tl.set("#lk${i} .lkC", { opacity: 0 }, ${r2(L(li))}); tl.set("#lk${i} .lkO", { opacity: 1 }, ${r2(L(li))});`);
  tw(`tl.fromTo("#lk${i}", { scale: 1.5 }, { scale: 1, duration: 0.4, ease: "back.out(3)", immediateRender: false }, ${r2(L(li))});`);
});
// level card (like the reference's "LEVEL 1 · SAPNA")
const level = (n, name, sub, a, b) => {
  const id = scene(a, b, "night", `
        ${ctrLab(`lv${n}a`, 390, `LEVEL ${n}`, ";color:" + C.orange)}
        ${ctr(`lv${n}b`, 430, 150, name, "light")}
        <div class="lvBar" style="top:640px"><div id="lv${n}c" class="lvFill"></div></div>
        ${ctrLab(`lv${n}d`, 690, sub, ";color:#9B958E")}`);
  fade(`#lv${n}a`, a + 0.05); pop(`#lv${n}b`, a + 0.15, 0.8); tw(`tl.fromTo("#lv${n}c", { scaleX: 0 }, { scaleX: ${(n / 5).toFixed(2)}, duration: 0.8, ease: "power2.out" }, ${r2(a + 0.3)});`); fade(`#lv${n}d`, a + 0.5);
  return id;
};

// ================= INTRO =================
{ // dollar earner, night, can't sleep: 1:59 -> 2:13 AM
  const a = 0, b = L(3);
  scene(a, b, "night", `
        <div class="spot"></div>
        ${at("cnA", 860, 140, 200, coin("$"))}
        ${lab("cnL", 1090, 220, "DOLLAR MEIN KAMAAI", ";color:#CFC8BE")}
        ${at("hA", 820, 480, 280, bean("hero", "worried", "#3A3546"))}
        <div id="tmA" class="big light" style="left:0;right:0;top:70px;text-align:center;font-size:110px;opacity:0">${odo("clk", "2:13")}<span style="font-size:.62em"> AM</span></div>
        ${ctrLab("nnA", 200, "NEEND UDNE SE PEHLE…", ";color:#9B958E;opacity:0")}
        <div id="dtA" class="date" style="left:1350px;top:470px"><div class="dM">OCT</div><div class="dD">7</div><div class="dY">RBI NE KYA KAHA?</div></div>`);
  drop("#cnA", 0.15); fade("#cnL", wt(0, "dollar"), 10);
  fade("#hA", 0.4, 40);
  out("#cnA, #cnL", L(1) - 0.2);
  tw(`tl.to("#tmA", { opacity: 1, duration: 0.3 }, ${r2(L(1))}); tl.to("#nnA", { opacity: 1, duration: 0.3 }, ${r2(wt(1, "neend"))});`);
  setOdo("clk", "1:59", L(1) - 0.01); roll("clk", "2:13", "1:59", L(1) + 0.2, 2.6);
  pop("#dtA", wt(2, "7"), 0.5, 6);
}
{ // coin zoom-through into: AdSense earning pe asar?
  const a = L(3), b = L(4);
  scene(a, b, "cream", `
        ${shot("shB", "adsense_start", 980, 170, 760, 3, "adsense.google.com", true)}
        ${lab("lbB", 160, 300, "TUMHARI ADSENSE EARNING")}
        <div id="nB" class="big" style="left:150px;top:340px;font-size:150px">${odo("adB", "$1,240")}</div>
        ${big("qB", 160, 540, 96, "PE ASAR?", "or")}`);
  fade("#lbB", a + 0.1); setOdo("adB", "$1,240", a); fade("#nB", a + 0.1); pop("#qB", wt(3, "asar"), 0.6, -3);
  drop("#shB", a + 0.4, 3);
  roll("adB", "$1,240", "$1,240", wt(3, "asar"), 1.4);
}
// zoom-through transition coin (sits above both scenes)
parts.push(`
      <div id="zoomCoin" class="clip abs" data-start="${r2(L(3) - 0.55)}" data-duration="0.85" data-track-index="8" style="left:810px;top:390px;width:300px">${coin("₹")}</div>`);
tw(`tl.fromTo("#zoomCoin", { scale: 0.2, opacity: 0 }, { keyframes: [{ scale: 1, opacity: 1, duration: 0.25, ease: "back.out(2)" }, { scale: 14, duration: 0.45, ease: "power3.in" }, { opacity: 0, duration: 0.15 }] }, ${r2(L(3) - 0.55)});`);
{ // agenda: four locks
  const a = L(4), b = L(7);
  const items = [["RULE KYA HAI", "rule"], ["DARR KYUN", "youtubers"], ["RBI NE KYA CLEAR KIYA", null], ["TUMHARI HAR INCOME", null]];
  scene(a, b, "cream", `
        ${ctrLab("agL", 250, "AAJ KA PLAN")}
        <div id="agR" class="agRow" style="top:330px">${items.map(([n], i) => `<div id="ag${i}" class="agBox"><div class="agN">${i + 1}</div><div class="agLock">${lock(false)}</div><div class="agT">${n}</div></div>`).join("")}</div>`);
  fade("#agL", a + 0.05); fade("#agR .agBox", a + 0.15, 30, 0.08);
  [wt(4, "rule"), wt(4, "youtubers"), L(5), L(6)].forEach((t, i) => {
    tw(`tl.to("#ag${i}", { backgroundColor: "${C.orange}", borderColor: "${C.orange}", color: "#fff", duration: 0.2 }, ${r2(t)});`);
    tw(`tl.fromTo("#ag${i}", { scale: 1.12 }, { scale: 1, duration: 0.35, ease: "back.out(3)", immediateRender: false }, ${r2(t)});`);
  });
}

// ================= LEVEL 1 · RULE =================
level(1, "RULE", "PEHLE, RULE.", L(7), L(8));
{ // 1 Oct 2026: new FEMA regulations; services export into EDF
  const a = L(8), b = L(10);
  scene(a, b, "cream", `
        <div id="dtC" class="date big2" style="left:180px;top:200px"><div class="dM">OCT 2026</div><div class="dD">1</div><div class="dY">LAGU</div></div>
        ${lab("feL", 560, 250, "FEMA KE")}
        ${big("feB", 550, 280, 96, "NAYE REGULATIONS")}
        <div id="svC" class="flow" style="left:560px;top:470px"><span class="chip">SERVICES EXPORT</span><span class="arr">→</span><span class="chip or">EDF FRAMEWORK</span></div>
        ${shot("shC", "taxmann_fema", 1180, 560, 560, -3, "taxmann.com", true)}`);
  pop("#dtC", a + 0.05, 0.6, -4); fade("#feL", wt(8, "fema")); fade("#feB", wt(8, "naye"));
  fade("#svC > *", wt(9, "services"), 20, 0.15); drop("#shC", wt(9, "edf"), -3);
}
{ // EDF = Export Declaration Form; goods before, services now (see-saw)
  const a = L(10), b = L(12);
  scene(a, b, "cream", `
        <div id="acr" class="acro" style="left:150px;top:180px"><div><b>E</b>XPORT</div><div><b>D</b>ECLARATION</div><div><b>F</b>ORM</div></div>
        <div id="ssW" class="seesaw" style="left:1080px;top:600px"><div id="ssBeam" class="beam"><div class="pan l"><span class="chip">GOODS</span></div><div class="pan r"><span id="ssSv" class="chip or">+ SERVICES</span></div></div><div class="fulcrum"></div></div>
        ${lab("ssL", 1130, 420, "PEHLE: ZYADA TAR GOODS")}${lab("ssL2", 1130, 460, "AB: SERVICES BHI", ";color:" + C.orange)}`);
  fade("#acr > div", wt(10, "export"), 30, 0.25);
  fade("#ssW", wt(11, "goods") - 0.2); fade("#ssL", wt(11, "goods"));
  tw(`tl.fromTo("#ssBeam", { rotation: -10 }, { rotation: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" }, ${r2(L(11) + 1.4)});`);
  pop("#ssSv", L(11) + 1.3, 0.5); fade("#ssL2", L(11) + 1.4);
}
{ // the idea: India -> foreign client, $ comes back, report via bank
  const a = L(12), b = L(16);
  scene(a, b, "cream", `
        ${at("hC", 150, 420, 200, bean("hero", "calm"))}${lab("hCl", 160, 820, "AAP · INDIA")}
        ${at("glC", 780, 300, 180, globe())}${at("cl2", 1000, 420, 200, bean("other", "calm", "#5B5550"))}${lab("clL", 860, 820, "VIDESHI CLIENT")}
        <div id="svArr" class="dash" style="left:380px;top:560px;width:560px"></div>${lab("svL", 560, 520, "SERVICE →")}
        ${at("cnD", 860, 600, 110, coin("$"))}
        ${at("bkD", 1460, 380, 260, bank())}${lab("bkL", 1500, 620, "BANK")}
        ${at("fmD", 1560, 650, 150, formDoc("EDF"))}
        ${stamp("skD", 1300, 130, "HO SAKTA HAI", -6)}`);
  fade("#hC, #hCl", a + 0.05); fade("#glC, #cl2, #clL", wt(12, "videshi"));
  strike("#svArr", wt(13, "service")); fade("#svL", wt(13, "service"));
  tw(`tl.fromTo("#cnD", { x: 0, y: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.15 }, { x: -620, y: -30, duration: 0.9, ease: "power2.inOut" }] }, ${r2(wt(13, "paisa"))});`);
  pop("#skD", wt(14, "sakta"), 1.6, -6);
  fade("#bkD, #bkL", wt(15, "bank")); drop("#fmD", wt(15, "through"), 6);
}

// ================= LEVEL 2 · DARR =================
level(2, "DARR", "AB SOCHO EK YOUTUBER KI LIFE", L(16), L(16) + 1.6);
{ // a YouTuber's month: AdSense every month, sometimes a foreign sponsor
  const a = L(16) + 1.6, b = L(19);
  scene(a, b, "night", `
        <div class="spot"></div>
        ${at("hE", 380, 470, 230, bean("hero", "happy", "#3A3546"))}
        ${phone("phE", 1040, 140, [`<b>Google AdSense</b><span class="amt">+ $412</span><i>HAR MAHINE</i>`, `<b>Google AdSense</b><span class="amt">+ $388</span><i>PICHLA MAHINA</i>`, `<b>Foreign brand</b><span class="amt or">+ $800</span><i>SPONSORSHIP</i>`], "INBOX · PAYMENTS")}`);
  fade("#hE", a); fade("#phE", a + 0.1, 40); fade("#phE-r0", wt(17, "google")); fade("#phE-r1", wt(17, "adsense"));
  pop("#phE-r2", wt(18, "foreign"), 0.7);
}
{ // every payment -> a bank form?
  const a = L(19), b = L(21);
  scene(a, b, "cream", `
        ${at("hF", 260, 420, 220, bean("hero", "worried"))}
        ${bubble("bbF", 470, 300, "Har payment pe bank form?!")}
        ${[0, 1, 2, 3, 4, 5].map((i) => at(`fF${i}`, 1100 + (i % 3) * 170, 220 + Math.floor(i / 3) * 290, 150, formDoc("EDF"), `;transform:rotate(${(i * 7) % 11 - 5}deg)`)).join("")}
        ${lab("cntL", 1150, 860, "FORMS / SAAL")}<div id="cntF" class="big or" style="left:1430px;top:820px;font-size:80px">${odo("frm", "12")}</div>`);
  fade("#hF", a); pop("#bbF", wt(20, "kya"), 0.6);
  [0, 1, 2, 3, 4, 5].forEach((i) => drop(`#fF${i}`, wt(20, "payment") + i * 0.12, (i * 7) % 11 - 5));
  setOdo("frm", "01", a); roll("frm", "12", "01", wt(20, "payment"), 1.2); fade("#cntL, #cntF", wt(20, "payment"));
}
{ // no minimum threshold; small creators scared most
  const a = L(21), b = L(23);
  scene(a, b, "cream", `
        ${lab("mnL", 160, 220, "MINIMUM AMOUNT KI CHHOOT")}
        <div id="mnN" class="big or" style="left:150px;top:250px;font-size:170px">${odo("mn", "₹00,000")}</div>
        ${big("mn0", 150, 250, 170, "₹0", "or")}
        ${at("hG", 1180, 360, 210, bean("hero", "worried"))}
        ${chips("crG", 1080, 830, ["CA ✗", "ACCOUNTANT ✗"])}
        ${lab("smL", 1100, 300, "CHHOTE CREATORS · SABSE ZYADA DARE", ";color:" + C.orange)}`);
  fade("#mnL", a + 0.05); setOdo("mn", "₹50,000", a); fade("#mnN", a + 0.05); roll("mn", "₹00,000", "₹50,000", wt(21, "chhoot") - 0.3, 1.3);
  out("#mnN", wt(21, "chhoot") + 1.2); pop("#mn0", wt(21, "chhoot") + 1.3, 1.4, -3);
  fade("#hG", L(22)); fade("#smL", wt(22, "sabse")); fade("#crG .chip", wt(22, "ca"), 20, 0.4);
  tw(`tl.fromTo("#hG", { x: 0 }, { keyframes: [{ x: 10 }, { x: -10 }, { x: 8 }, { x: -6 }, { x: 0 }], duration: 0.5, immediateRender: false }, ${r2(wt(22, "dare"))});`);
}
{ // the quote
  const a = L(23), b = L(25);
  scene(a, b, "dark", `
        ${ctrLab("qL", 330, "BUSINESS NEWS · EXPERTS KA REACTION", ";color:#9B958E")}
        ${ctr("qT", 400, 76, "“Fill a form for<br>just being alive.”", "light quote")}
        ${ctrLab("qS", 640, "— EK BUSINESS NEWS REPORT", ";color:" + C.orange)}`);
  fade("#qL", a + 0.1); fade("#qT", L(24) - 0.1, 30); fade("#qS", L(24) + 0.8);
}

// ================= LEVEL 3 · JAWAB =================
level(3, "PAR RUKO.", "SIRF 6 DIN BAAD…", L(25), L(26));
{ // six days later: 1 Oct -> 7 Oct, picture badal di, twist = income type
  const a = L(26), b = L(30);
  const days = [1, 2, 3, 4, 5, 6, 7];
  scene(a, b, "cream", `
        ${ctrLab("dyL", 200, "OCTOBER 2026")}
        <div id="dyR" class="dayRow" style="top:250px">${days.map((d) => `<div id="dy${d}" class="day"><span>${d}</span></div>`).join("")}</div>
        ${ctr("dyB", 470, 120, "6 DIN BAAD", "or")}
        ${ctrLab("dyP", 640, "RBI NE PICTURE BADAL DI")}
        <div id="twT" class="twist" style="left:560px;top:740px">TWIST: <b>TUMHARI INCOME KA TYPE</b></div>`);
  fade("#dyL", a); fade("#dyR .day", a + 0.05, 20, 0.05);
  tw(`tl.set("#dy1", { backgroundColor: "${C.ink}", color: "#fff" }, ${r2(a + 0.3)});`);
  days.slice(1).forEach((d, i) => tw(`tl.set("#dy${d}", { backgroundColor: "${d === 7 ? C.orange : "#D9D1C6"}", color: "${d === 7 ? "#fff" : C.ink}" }, ${r2(wt(26, "din") + i * 0.12)});`));
  pop("#dyB", wt(26, "6"), 0.6, -2); fade("#dyP", wt(27, "picture")); pop("#twT", wt(28, "twist"), 0.7, -1);
}
{ // Business Today: individuals with personal-nature contracts not covered; Governor's examples
  const a = L(30), b = L(34);
  scene(a, b, "cream", `
        ${shot("shH", "fueler_clarify", 120, 200, 620, -3, "RBI clarification · secondary report", true)}
        ${at("gvH", 1010, 330, 230, bean("boss", "calm"))}${lab("gvL", 990, 760, "RBI · GOVERNOR")}
        ${bubble("bbH", 1240, 210, "Personal nature ke contracts: <b>individuals shaamil nahi.</b>", ";width:560px")}
        ${chips("exH", 1260, 560, ["✓ TUITION PADHANA", "✓ CHHOTA SOFTWARE KAAM"], "col")}`);
  drop("#shH", a + 0.1, -3); fade("#gvH, #gvL", wt(31, "rbi")); pop("#bbH", wt(31, "personal"), 0.7);
  fade("#exH .chip", wt(33, "tuition"), 20, 0.5);
}
{ // individual creator: EDF tension kaafi kam (meter drains)
  const a = L(34), b = L(37);
  scene(a, b, "night", `
        <div class="spot"></div>
        ${at("hI", 360, 420, 240, bean("hero", "worried", "#3A3546"))}${at("hI2", 360, 420, 240, bean("hero", "happy", "#3A3546"), ";opacity:0")}
        ${lab("mtL", 900, 380, "EDF WALI TENSION", ";color:#CFC8BE")}
        <div class="meter" style="left:900px;top:420px"><div id="mtF" class="mFill"></div></div>
        ${lab("mtS", 900, 500, "ABHI KE STATEMENT KE HISAAB SE", ";color:#9B958E")}
        ${big("mtB", 900, 560, 110, "KAAFI KAM", "or")}
        ${lab("icL", 360, 860, "INDIVIDUAL CREATOR", ";color:#CFC8BE")}`);
  fade("#hI, #icL", a + 0.05); fade("#mtL", a + 0.2); fade("#mtS", wt(35, "statement"));
  tw(`tl.fromTo("#mtF", { scaleX: 1 }, { scaleX: 0.18, duration: 1.4, ease: "power2.inOut" }, ${r2(wt(36, "tension"))});`);
  pop("#mtB", wt(36, "kaafi"), 0.7, -2);
  tw(`tl.to("#hI", { opacity: 0, duration: 0.3 }, ${r2(wt(36, "kam"))}); tl.to("#hI2", { opacity: 1, duration: 0.3 }, ${r2(wt(36, "kam"))});`);
}

// ================= LEVEL 4 · INCOME =================
level(4, "3 HISSE", "AB TWIST · TUMHARI YOUTUBE INCOME", L(37), L(38));
const PIE = (hl) => {
  const seg = (a0, a1, col) => { const p = (a) => [120 + 110 * Math.cos(a), 120 + 110 * Math.sin(a)].map((v) => v.toFixed(1)); const [x0, y0] = p(a0), [x1, y1] = p(a1); return `<path d="M120 120 L${x0} ${y0} A110 110 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1} ${y1} Z" fill="${col}"/>`; };
  const A = [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6, Math.PI * 3 / 2];
  return S("0 0 240 240", [0, 1, 2].map((i) => seg(A[i], A[i + 1], i === hl ? C.orange : ["#3D3734", "#8E877F", "#D9D1C6"][i])).join("") + `<circle cx="120" cy="120" r="44" fill="${C.cream}"/>`);
};
const pieBlock = (k) => `${at(`pie${k}`, 140, 230, 300, PIE(k))}<div class="pieKey" style="left:150px;top:570px">${["ADSENSE / YOUTUBE", "FOREIGN BRANDS", "INDIAN BRANDS"].map((n, i) => `<div class="${i === k ? "on" : ""}">${i + 1}. ${n}</div>`).join("")}</div>`;
{ // 1: AdSense / YouTube money -> unclear
  const a = L(38), b = L(45);
  scene(a, b, "cream", `
        ${pieBlock(0)}
        ${lab("p1L", 620, 200, "1 · ADSENSE AUR YOUTUBE SE")}
        ${chips("p1C", 610, 240, ["ADS", "MEMBERSHIPS", "SUPER CHAT"])}
        ${big("p1Q", 610, 380, 74, "AD REVENUE =<br>SERVICE EXPORT?")}
        <div id="p1S" class="seesaw sm" style="left:640px;top:740px"><div id="p1Beam" class="beam"><div class="pan l"><span class="chip">HAAN</span></div><div class="pan r"><span class="chip">NAHI</span></div></div><div class="fulcrum"></div></div>
        ${lab("p1E", 640, 620, "EXPERTS KI RAAY ALAG")}
        ${stamp("p1X", 1080, 690, "ABHI CLEAR NAHI", -5)}
        ${shot("shP1", "yt_monetization", 1290, 170, 520, 4, "youtube.com/creators")}`);
  pop("#pie0", a + 0.05, 0.7); fade(".pieKey div", a + 0.2, 10, 0.08);
  fade("#p1L", a + 0.1); fade("#p1C .chip", wt(39, "ads", 1), 16, 0.35); drop("#shP1", wt(40, "super"), 4);
  fade("#p1Q", L(42)); fade("#p1E, #p1S", L(43));
  tw(`tl.fromTo("#p1Beam", { rotation: -8 }, { rotation: 8, duration: 0.7, yoyo: true, repeat: 3, ease: "sine.inOut", immediateRender: false }, ${r2(L(43) + 0.2)});`);
  pop("#p1X", wt(44, "clear") - 0.2, 1.6, -5);
}
{ // 2: foreign brand deals -> many experts: service export. Dhyan do.
  const a = L(45), b = L(49);
  scene(a, b, "cream", `
        ${pieBlock(1)}
        ${lab("p2L", 620, 200, "2 · FOREIGN BRAND DEALS")}
        ${at("glK", 640, 300, 150, globe())}${lab("glL", 620, 470, "VIDESHI BRAND")}
        <div id="p2A" class="dash" style="left:820px;top:380px;width:420px"></div>${at("cnK", 820, 330, 100, coin("$"))}
        ${at("hK", 1290, 260, 170, bean("hero", "happy"))}${lab("hKl", 1290, 600, "SEEDHA AAPKO")}
        <div id="p2S" class="verdict" style="left:620px;top:680px"><span class="vLab">KAI EXPERTS</span><span class="vBig">= SERVICE EXPORT</span></div>
        ${big("p2W", 1500, 640, 130, "!", "or")}${lab("p2D", 1450, 820, "DHYAN DO", ";color:" + C.orange)}`);
  pop("#pie1", a + 0.05, 0.85); fade(".pieKey div", a + 0.1, 10, 0.05); fade("#p2L", a + 0.1);
  fade("#glK, #glL", wt(46, "videshi")); strike("#p2A", wt(46, "seedha")); fade("#hK, #hKl", wt(46, "aapko"));
  tw(`tl.fromTo("#cnK", { x: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.1 }, { x: 420, duration: 0.8, ease: "power2.inOut" }] }, ${r2(wt(46, "paise"))});`);
  pop("#p2S", L(47), 0.8); pop("#p2W", L(48), 1.8, 8); fade("#p2D", L(48) + 0.2);
}
{ // 3: Indian brand deals in rupees -> not export
  const a = L(49), b = L(53);
  scene(a, b, "cream", `
        ${pieBlock(2)}
        ${lab("p3L", 620, 200, "3 · INDIAN BRAND DEALS")}
        ${at("ibK", 640, 270, 170, bean("other", "calm", "#5B5550"))}${lab("ibL", 640, 620, "INDIAN BRAND")}
        <div id="p3A" class="dash" style="left:860px;top:420px;width:400px"></div>${at("cnL3", 860, 370, 100, coin("₹"))}
        ${at("hL", 1300, 270, 170, bean("hero", "happy"))}${lab("hLl", 1310, 620, "AAP · INDIA")}
        ${stamp("p3X", 700, 720, "EXPORT HI NAHI ✓", -4)}
        ${lab("p3N", 1180, 760, "IS RULE SE LENA DENA NAHI")}`);
  pop("#pie2", a + 0.05, 0.85); fade(".pieKey div", a + 0.1, 10, 0.05); fade("#p3L", a + 0.1);
  fade("#ibK, #ibL", wt(50, "brand")); strike("#p3A", wt(50, "paisa")); fade("#hL, #hLl", wt(50, "india", 1));
  tw(`tl.fromTo("#cnL3", { x: 0, opacity: 0 }, { keyframes: [{ opacity: 1, duration: 0.1 }, { x: 400, duration: 0.8, ease: "power2.inOut" }] }, ${r2(wt(50, "rupay"))});`);
  pop("#p3X", L(51), 1.6, -4); fade("#p3N", L(52));
}
{ // one more thing: company / LLP / firm may still be covered; GST sole proprietors wait for FAQs
  const a = L(53), b = L(58);
  scene(a, b, "cream", `
        ${lab("ebL", 160, 170, "AUR EK BAAT")}
        <div id="bzR" class="bizRow" style="left:150px;top:220px">${["COMPANY", "LLP", "FIRM"].map((n, i) => `<div id="bz${i}" class="biz"><div class="bzIco">${S("0 0 120 120", `<rect x="20" y="${i === 0 ? 10 : 34}" width="80" height="${i === 0 ? 100 : 76}" fill="${C.ink}"/>${[0, 1, 2].map((r) => [0, 1].map((c) => `<rect x="${36 + c * 32}" y="${(i === 0 ? 24 : 48) + r * 22}" width="16" height="12" fill="${C.cream}"/>`).join("")).join("")}`)}</div>${n}</div>`).join("")}</div>
        ${stamp("bzX", 260, 520, "ABHI BHI COVER HO SAKTE", -5)}
        <div id="gsC" class="card" style="left:1060px;top:220px;width:700px"><div class="lab" style="position:static">GST WALE SOLE PROPRIETORS</div><div class="cBig">FINAL JAWAB:<br><span class="or">RBI FAQs</span></div><div class="cSub"><span id="spn" class="spinner"></span>abhi aane baaki hain</div></div>
        ${shot("shM", "rbi_faq", 1110, 620, 460, -3, "rbi.org.in · FAQs")}`);
  fade("#ebL", a); fade("#bzR .biz", wt(54, "company"), 30, 0.35); pop("#bzX", wt(55, "businesses"), 1.6, -5);
  fade("#gsC", L(56)); drop("#shM", wt(56, "faqs"), -3);
  tw(`tl.fromTo("#spn", { rotation: 0 }, { rotation: ${Math.round((b - L(56)) * 360)}, duration: ${r2(b - L(56))}, ease: "none" }, ${r2(L(56))});`);
}

// ================= LEVEL 5 · STEPS =================
level(5, "4 STEPS", "TOH YOUTUBERS KO ABHI KYA KARNA CHAHIYE?", L(58), L(60));
const stepBar = (k) => `<div class="stepBar">${[1, 2, 3, 4].map((n) => `<div class="sb ${n < k ? "done" : n === k ? "now" : ""}">${n}</div>`).join("")}</div>`;
{ // 1: don't panic
  const a = L(60), b = L(62);
  scene(a, b, "cream", `
        ${stepBar(1)}
        ${big("s1T", 160, 300, 120, "PANIC<br>MAT KARO.")}
        ${at("hS1", 1180, 330, 240, bean("hero", "happy"))}
        ${stamp("s1R", 1050, 760, "RAAHAT ✓", -5)}
        ${lab("s1L", 170, 620, "INDIVIDUAL CREATORS · RBI KA STATEMENT")}`);
  fade("#s1T", a + 0.05, 30); fade("#hS1", a + 0.2); fade("#s1L", L(61)); pop("#s1R", wt(61, "raahat"), 1.6, -5);
}
{ // 2: keep records
  const a = L(62), b = L(65);
  scene(a, b, "cream", `
        ${stepBar(2)}
        ${big("s2T", 160, 200, 110, "RECORDS<br>RAKHO.")}
        ${shot("sh2a", "adsense_payments", 820, 230, 360, -4, "AdSense payment statement")}
        <div id="inv" class="paperCard" style="left:1230px;top:250px;transform:rotate(3deg)"><div class="pin"></div><div class="pcT">INVOICE</div><div class="pcL">Brand deal · $800</div><div class="pcL">Due: 30 days</div><div class="pcBar"></div></div>
        <div id="fira" class="paperCard" style="left:1520px;top:300px;transform:rotate(-2deg)"><div class="pin"></div><div class="pcT">FIRA</div><div class="pcL">Foreign inward remittance</div><div class="pcBar"></div></div>
        <div id="fld" class="folder" style="left:980px;top:650px">SAB SAMBHAL KE</div>`);
  fade("#s2T", a + 0.05, 30); drop("#sh2a", wt(63, "adsense"), -4); drop("#inv", wt(63, "invoices"), 3); drop("#fira", wt(63, "remittance"), -2);
  pop("#fld", L(64), 0.7);
}
{ // 3: ask your bank
  const a = L(65), b = L(68);
  scene(a, b, "cream", `
        ${stepBar(3)}
        ${big("s3T", 160, 200, 110, "BANK SE<br>POOCHO.")}
        ${at("bk3", 820, 330, 300, bank())}${at("bkr", 1180, 360, 200, bean("banker", "calm"))}
        ${bubble("bb3", 1300, 220, "AdSense ya brand payment ke liye <b>kya chahiye</b> — main bataunga.", ";width:520px")}
        ${lab("s3L", 170, 520, "EDF BANK KE THROUGH JAATA HAI")}
        ${shot("sh3", "razorpay_edf", 260, 620, 440, -3, "razorpay.com/blog")}`);
  fade("#s3T", a + 0.05, 30); fade("#s3L", L(66)); fade("#bk3", wt(66, "bank")); fade("#bkr", wt(67, "bank")); pop("#bb3", wt(67, "batayega"), 0.7);
  drop("#sh3", L(66) + 0.6, -3);
}
{ // 4: talk to a CA -> level complete
  const a = L(68), b = L(70);
  scene(a, b, "cream", `
        ${stepBar(4)}
        ${big("s4T", 160, 200, 110, "CA SE<br>BAAT KARO.")}
        ${at("ca4", 1350, 300, 230, bean("ca", "calm"))}
        ${chips("s4C", 160, 560, ["COMPANY / REGISTERED BUSINESS", "BADI FOREIGN BRAND DEALS"], "col")}
        <div id="lvc" class="lvComplete">LEVEL COMPLETE</div>`);
  fade("#s4T", a + 0.05, 30); fade("#ca4", wt(69, "ca")); fade("#s4C .chip", wt(68, "channel"), 16, 0.9);
  pop("#lvc", b - 0.9, 0.5);
}

// ================= SUMMARY + OUTRO =================
{ // summary: three pinned polaroids
  const a = L(70), b = L(74);
  const cards = [["INDIVIDUAL YOUTUBERS", "TENSION KAM", "✓"], ["FOREIGN BRAND DEALS", "DHYAN DO", "!"], ["ADSENSE", "RBI FAQs KA WAIT", "…"]];
  scene(a, b, "night", `
        ${ctrLab("smL", 150, "SUMMARY", ";color:" + C.orange)}
        <div class="polRow" style="top:230px">${cards.map(([h, v, m], i) => `<div id="pl${i}" class="pol" style="transform:rotate(${[-3, 2, -1][i]}deg)"><div class="pin"></div><div class="polM ${i === 1 ? "or" : ""}">${m}</div><div class="polH">${h}</div><div class="polV">${v}</div></div>`).join("")}</div>
        <div id="upd" class="twist dk" style="left:610px;top:800px">FAQs AATE HI · <b>UPDATE VIDEO</b></div>`);
  fade("#smL", a); drop("#pl0", wt(70, "individual"), -3); drop("#pl1", L(71), 2); drop("#pl2", L(72), -1); pop("#upd", L(73), 0.7);
}
{ // disclaimer
  const a = L(74), b = L(76);
  scene(a, b, "dark", `
        ${ctrLab("dcL", 360, "DISCLAIMER", ";color:" + C.orange)}
        ${ctr("dcT", 410, 96, "LEGAL YA TAX<br>ADVICE NAHI.", "light")}
        ${ctrLab("dcS", 660, "APNE CASE KE LIYE BANK YA CA SE CONFIRM KAREIN", ";color:#CFC8BE")}`);
  fade("#dcL", a); fade("#dcT", a + 0.1, 30); fade("#dcS", L(75));
}
{ // comment poll + subscribe
  const a = L(76), b = DUR;
  scene(a, b, "cream", `
        ${ctrLab("cmL", 170, "COMMENT KARO")}
        ${ctr("cmT", 210, 84, "TUMHARI SABSE ZYADA KAMAAI?")}
        <div id="cmR" class="chipRow cen" style="left:0;right:0;top:380px">${["ADSENSE", "FOREIGN BRANDS", "INDIAN BRANDS"].map((c, i) => `<span id="cm${i}" class="chip lg">${c}</span>`).join("")}</div>
        <div id="cmBox" class="cmBox" style="left:560px;top:530px"><span class="cmQ">?</span>Meri sabse zyada kamaai: ______</div>
        <div id="sub" class="subBtn" style="left:760px;top:760px"><b>▶</b> SUBSCRIBE · NAMASTETECHY</div>`);
  fade("#cmL, #cmT", a + 0.05); fade("#cmR .chip", wt(77, "adsense"), 16, 0.6); fade("#cmBox", L(78));
  pop("#sub", wt(79, "namastetechy"), 0.6); tw(`tl.fromTo("#sub", { scale: 1 }, { scale: 0.93, duration: 0.1, yoyo: true, repeat: 1, immediateRender: false }, ${r2(wt(79, "subscribe") + 0.1)});`);
}

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="assets/gsap.min.js"></script>
    <style>
      ${[500, 700, 800, 900].map((w) => `@font-face { font-family: "Montserrat"; font-weight: ${w}; src: url("assets/fonts/montserrat-${w}.woff2") format("woff2"); }`).join("\n      ")}
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${C.cream}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${C.cream}; font-family: "Montserrat", sans-serif; color: ${C.ink}; }
      .layer { position: absolute; inset: 0; width: 100%; height: 100%; }
      .abs { position: absolute; } .abs svg, .bzIco svg { display: block; width: 100%; height: auto; }
      .bg { position: absolute; inset: 0; }
      .cream .bg { background: radial-gradient(ellipse 75% 70% at 50% 45%, #F7F3EC 0%, ${C.cream} 55%, #DCD3C6 100%); }
      .night .bg { background: radial-gradient(ellipse 60% 70% at 50% 60%, #222634 0%, ${C.night} 60%, #121218 100%); }
      .dark .bg { background: radial-gradient(ellipse 70% 70% at 50% 50%, #2E2925 0%, #221E1B 70%, #171412 100%); }
      .spot { position: absolute; left: 50%; top: 52%; width: 900px; height: 700px; margin: -350px 0 0 -450px; border-radius: 50%; background: radial-gradient(ellipse, rgba(44,62,120,.55), rgba(44,62,120,0) 70%); }
      .lab { position: absolute; font-weight: 700; font-size: 20px; letter-spacing: .28em; text-transform: uppercase; color: ${C.grey}; white-space: nowrap; }
      .big { position: absolute; font-weight: 900; line-height: 1.02; letter-spacing: -0.01em; white-space: nowrap; color: ${C.ink}; }
      .big.or, .or { color: ${C.orange}; } .big.light { color: #F4EFE8; }
      .quote { font-weight: 800; font-style: italic; line-height: 1.2; }
      .odo { display: inline-flex; align-items: flex-start; line-height: 1; }
      .odo .dg { display: inline-block; height: 1em; overflow: hidden; width: .72em; text-align: center; }
      .odo .dcol { display: block; } .odo .dcol span { display: block; height: 1em; line-height: 1; }
      .odo .sep { display: inline-block; line-height: 1; }
      .date { position: absolute; width: 230px; background: ${C.paper}; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,.25); text-align: center; }
      .date .dM { background: ${C.orange}; color: #fff; font-weight: 800; font-size: 28px; letter-spacing: .2em; padding: 10px 0; }
      .date .dD { font-weight: 900; font-size: 130px; line-height: 1.1; }
      .date .dY { font-weight: 700; font-size: 16px; letter-spacing: .2em; color: ${C.grey}; padding: 0 10px 18px; }
      .date.big2 { width: 300px; } .date.big2 .dD { font-size: 180px; }
      .shot { position: absolute; padding: 16px 16px 0; background: ${C.paper}; box-shadow: 0 24px 40px rgba(0,0,0,.25); transform-origin: 50% 0%; }
      .shot .shImg { width: 100%; aspect-ratio: 16 / 10; overflow: hidden; background: #fff; }
      .shot .shImg img { width: 100%; display: block; }
      .shot .shCap { font-weight: 700; font-size: 18px; letter-spacing: .12em; text-transform: uppercase; color: ${C.grey}; padding: 14px 4px 18px; }
      .pin { position: absolute; left: 50%; top: -14px; width: 28px; height: 28px; margin-left: -14px; border-radius: 50%; background: radial-gradient(circle at 35% 30%, #FF9A6A, ${C.orange} 60%, #A9431C); box-shadow: 0 6px 8px rgba(0,0,0,.3); z-index: 2; }
      .real { position: absolute; right: -24px; bottom: 30px; padding: 6px 18px; border: 5px solid ${C.orange}; color: ${C.orange}; font-weight: 900; font-size: 34px; letter-spacing: .08em; transform: rotate(-10deg); background: rgba(251,248,243,.85); }
      .stamp { position: absolute; padding: 10px 26px; border: 6px solid ${C.orange}; color: ${C.orange}; font-weight: 900; font-size: 44px; letter-spacing: .04em; white-space: nowrap; background: rgba(251,248,243,.6); transform-origin: 50% 50%; }
      .bubble { position: absolute; padding: 22px 30px; background: ${C.paper}; border-radius: 26px; font-weight: 700; font-size: 34px; line-height: 1.3; box-shadow: 0 14px 26px rgba(0,0,0,.18); transform-origin: 0% 100%; }
      .bubble::after { content: ""; position: absolute; left: 40px; bottom: -22px; border-top: 24px solid ${C.paper}; border-right: 26px solid transparent; }
      .bubble b { color: ${C.orange}; font-weight: 800; }
      .chipRow { position: absolute; display: flex; gap: 16px; } .chipRow.col { flex-direction: column; align-items: flex-start; } .chipRow.cen { justify-content: center; }
      .chip { display: inline-block; padding: 12px 24px; border-radius: 999px; background: ${C.paper}; border: 3px solid ${C.ink}; font-weight: 800; font-size: 26px; letter-spacing: .06em; white-space: nowrap; }
      .chip.or { background: ${C.orange}; border-color: ${C.orange}; color: #fff; } .chip.lg { font-size: 40px; padding: 18px 40px; }
      .night .lab, .dark .lab { color: #9B958E; }
      .flow { position: absolute; display: flex; align-items: center; gap: 18px; } .flow .arr { font-weight: 900; font-size: 48px; color: ${C.orange}; }
      .acro { position: absolute; font-weight: 900; font-size: 112px; line-height: 1.04; letter-spacing: -0.01em; } .acro b { color: ${C.orange}; font-weight: 900; }
      .seesaw { position: absolute; width: 640px; height: 220px; } .seesaw.sm { width: 400px; transform: scale(.8); transform-origin: 0 0; }
      .seesaw .beam { position: absolute; left: 0; right: 0; top: 90px; height: 14px; background: ${C.ink}; border-radius: 7px; transform-origin: 50% 50%; }
      .seesaw .pan { position: absolute; bottom: 14px; } .seesaw .pan.l { left: 10px; } .seesaw .pan.r { right: 10px; }
      .seesaw .fulcrum { position: absolute; left: 50%; top: 104px; margin-left: -40px; border-left: 40px solid transparent; border-right: 40px solid transparent; border-bottom: 80px solid ${C.ink}; }
      .dash { position: absolute; height: 0; border-top: 8px dashed ${C.ink}; transform-origin: 0 50%; }
      .phone { position: absolute; width: 520px; height: 820px; border-radius: 56px; background: #15151B; border: 10px solid #2E2E38; padding: 90px 36px 0; box-shadow: 0 30px 60px rgba(0,0,0,.5); }
      .phone .notch { position: absolute; left: 50%; top: 18px; width: 140px; height: 30px; margin-left: -70px; border-radius: 16px; background: #000; }
      .phone .phT { font-weight: 700; font-size: 18px; letter-spacing: .25em; color: #8E8A99; margin-bottom: 26px; }
      .phRow { position: relative; padding: 24px 26px; margin-bottom: 18px; border-radius: 20px; background: #24242E; color: #EDE9F2; font-size: 30px; }
      .phRow b { font-weight: 800; } .phRow .amt { position: absolute; right: 26px; top: 24px; font-weight: 900; color: #9FE3B4; } .phRow .amt.or { color: ${C.orange}; }
      .phRow i { display: block; font-style: normal; font-weight: 700; font-size: 16px; letter-spacing: .22em; color: #8E8A99; margin-top: 8px; }
      .meter { position: absolute; width: 760px; height: 46px; border-radius: 23px; background: #2A2C38; overflow: hidden; }
      .meter .mFill { position: absolute; inset: 0; background: ${C.orange}; transform-origin: 0 50%; border-radius: 23px; }
      .dayRow { position: absolute; left: 0; right: 0; display: flex; justify-content: center; gap: 20px; }
      .day { width: 150px; height: 170px; border-radius: 18px; background: ${C.paper}; border: 3px solid #D2C9BC; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 80px; }
      .twist { position: absolute; padding: 18px 34px; border-radius: 999px; background: ${C.ink}; color: #fff; font-weight: 700; font-size: 32px; letter-spacing: .08em; white-space: nowrap; }
      .twist b { color: ${C.orange}; font-weight: 900; } .twist.dk { background: #2E2A35; }
      .lvBar { position: absolute; left: 50%; width: 300px; margin-left: -150px; height: 8px; border-radius: 4px; background: #34343F; }
      .lvBar .lvFill { position: absolute; inset: 0; background: ${C.orange}; border-radius: 4px; transform-origin: 0 50%; }
      .agRow { position: absolute; left: 0; right: 0; display: flex; justify-content: center; gap: 30px; }
      .agBox { width: 330px; height: 330px; border-radius: 26px; background: ${C.paper}; border: 4px solid ${C.ink}; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; transform-origin: 50% 50%; }
      .agN { font-weight: 900; font-size: 96px; line-height: 1; } .agLock { width: 44px; } .agLock svg { display: block; width: 100%; }
      .agT { font-weight: 800; font-size: 24px; letter-spacing: .1em; padding: 0 20px; }
      .pieKey { position: absolute; display: flex; flex-direction: column; gap: 10px; } .pieKey div { font-weight: 800; font-size: 22px; letter-spacing: .12em; color: #A39B91; } .pieKey div.on { color: ${C.orange}; }
      .verdict { position: absolute; display: flex; flex-direction: column; } .vLab { font-weight: 700; font-size: 20px; letter-spacing: .28em; color: ${C.grey}; } .vBig { font-weight: 900; font-size: 64px; }
      .bizRow { position: absolute; display: flex; gap: 26px; }
      .biz { width: 240px; padding: 26px 0 22px; border-radius: 22px; background: ${C.paper}; border: 3px solid ${C.ink}; text-align: center; font-weight: 900; font-size: 30px; letter-spacing: .06em; }
      .bzIco { width: 100px; margin: 0 auto 14px; }
      .card { position: absolute; padding: 30px 36px; border-radius: 26px; background: ${C.paper}; box-shadow: 0 20px 36px rgba(0,0,0,.18); }
      .card .cBig { font-weight: 900; font-size: 70px; line-height: 1.05; margin: 14px 0; } .card .cSub { display: flex; align-items: center; gap: 16px; font-weight: 700; font-size: 26px; color: ${C.grey}; }
      .spinner { width: 34px; height: 34px; border-radius: 50%; border: 6px solid #D9D1C6; border-top-color: ${C.orange}; display: inline-block; }
      .stepBar { position: absolute; left: 160px; top: 110px; display: flex; gap: 12px; }
      .stepBar .sb { width: 54px; height: 54px; border-radius: 12px; border: 3px solid ${C.ink}; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 26px; background: ${C.paper}; }
      .stepBar .sb.done { background: ${C.ink}; color: #fff; } .stepBar .sb.now { background: ${C.orange}; border-color: ${C.orange}; color: #fff; }
      .paperCard { position: absolute; width: 280px; padding: 34px 26px 26px; background: ${C.paper}; box-shadow: 0 20px 34px rgba(0,0,0,.22); }
      .paperCard .pcT { font-weight: 900; font-size: 44px; color: ${C.orange}; } .paperCard .pcL { font-weight: 700; font-size: 22px; margin-top: 10px; }
      .paperCard .pcBar { height: 12px; margin-top: 20px; border-radius: 6px; background: #E3DCD2; }
      .folder { position: absolute; padding: 26px 50px; border-radius: 10px 30px 18px 18px; background: ${C.orange}; color: #fff; font-weight: 900; font-size: 40px; letter-spacing: .06em; box-shadow: 0 16px 28px rgba(0,0,0,.25); }
      .lvComplete { position: absolute; left: 50%; top: 850px; width: 520px; margin-left: -260px; padding: 18px 0; border-radius: 999px; background: ${C.orange}; color: #fff; text-align: center; font-weight: 900; font-size: 36px; letter-spacing: .14em; box-shadow: 0 0 40px rgba(232,97,44,.5); }
      .polRow { position: absolute; left: 0; right: 0; display: flex; justify-content: center; gap: 50px; }
      .pol { position: relative; width: 420px; height: 460px; padding: 40px 30px; background: ${C.paper}; box-shadow: 0 30px 50px rgba(0,0,0,.45); display: flex; flex-direction: column; align-items: center; text-align: center; }
      .polM { font-weight: 900; font-size: 150px; line-height: 1.1; } .polH { font-weight: 800; font-size: 22px; letter-spacing: .18em; color: ${C.grey}; margin-top: 10px; } .polV { font-weight: 900; font-size: 46px; margin-top: 14px; line-height: 1.1; }
      .cmBox { position: absolute; width: 800px; padding: 30px 36px; border-radius: 22px; background: ${C.paper}; border: 3px solid #D2C9BC; font-weight: 700; font-size: 36px; display: flex; align-items: center; gap: 20px; box-shadow: 0 16px 30px rgba(0,0,0,.12); }
      .cmQ { width: 54px; height: 54px; border-radius: 50%; background: ${C.orange}; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 34px; }
      .subBtn { position: absolute; padding: 24px 48px; border-radius: 999px; background: ${C.orange}; color: #fff; font-weight: 900; font-size: 38px; letter-spacing: .06em; box-shadow: 0 0 50px rgba(232,97,44,.45); white-space: nowrap; }
      .hud { position: absolute; right: 50px; top: 40px; display: flex; flex-direction: column; align-items: flex-end; gap: 8px; z-index: 20; }
      .hudLab { font-weight: 700; font-size: 14px; letter-spacing: .3em; color: ${C.grey}; }
      .locks { display: flex; gap: 6px; }
      .lk { position: relative; width: 34px; height: 34px; border-radius: 7px; border: 2px solid ${C.grey}; background: rgba(251,248,243,.85); transform-origin: 50% 50%; }
      .lk span { position: absolute; left: 8px; top: 6px; width: 16px; } .lk svg { display: block; width: 100%; } .lk .lkO { opacity: 0; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">${parts.join("")}
      ${hud}
    </div>
    <audio id="vo" src="assets/audio/voiceover.mp3" data-start="0" data-duration="${DUR}" data-track-index="9" data-volume="1"></audio>
    <script>
      const tl = gsap.timeline({ paused: true });
      ${T.join("\n      ")}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), html);
console.log(`index.html: ${sceneN} scenes, ${T.length} tweens, ${DUR}s`);
