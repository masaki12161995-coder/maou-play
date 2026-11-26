// 戦闘の画面。敵は上、仲間は後ろ姿で前列・後列。行動の順番と下の札は正面の顔。
(() => {
"use strict";
const W = 301, H = 655; // 1ドット＝4画素（3倍の画面で1.33pt）。人物と背景を同じ細かさで描く
const DPR = window.devicePixelRatio || 2;
const stage = document.getElementById("stage"), cv = document.getElementById("field"), ctx = cv.getContext("2d"), hud = document.getElementById("hud");
ctx.imageSmoothingEnabled = false;
let K = 2; // 1ドットの大きさ（pt）

// ---------- 位置（ドット） ----------
const TL = { x: 33, y: 68, w: 235, h: 34 };
const FOE_FEET = 228;
const ROW_FEET = [332, 402]; // 前列・後列の足元。後列の頭が前列の足より下になるので、絵が重ならない
const BANNER = { x: 33, y: 412, w: 235, h: 28 };
const CARD = { y: 450, w: 62, h: 60, x0: 17, gap: 6 };
const SPEED = { x: 108, y: 524, w: 85, h: 24 };
const SHEET = { fw: 48, fh: 60 };
const FACE = [58, 4, 28, 30]; // 正面の顔（シートの左上から）
const POSE = [0, 240, 48, 46]; // 技のポーズ（上半身）

const IM = {};
function load(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "img/" + src + ".png"; IM[src] = i; }); }

let ROWS = BT.HEROES.map(h => h.row);
let st = null, wave = 0, speed = 1, last = 0, busy = false, actor = null, poseUntil = {}, fx = {}, scene = null, ended = false;
const SCENES = [() => makeScene(), () => dungeonScene("canopy"), () => dungeonScene("gold")];
const PLACES = [
  ["夜の街道", "コウモリ・骨の犬・角ウサギ"],
  ["森の奥", "ゴブリンと毒キノコ"],
  ["岩場の親玉", "オークとゴブリン"],
];

function fit() {
  const w = Math.min(innerWidth, innerHeight * W / H);
  K = w / W;
  stage.style.width = w + "px"; stage.style.height = (w * H / W) + "px";
  if (st) buildHud();
}
const d = v => v * K + "px";
function px(el, x, y, w, h) { el.style.left = d(x); el.style.top = d(y); if (w !== undefined) el.style.width = d(w); if (h !== undefined) el.style.height = d(h); return el; }
function div(cls, html) { const e = document.createElement("div"); e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

// 絵の一部を、整数倍の画素で置く（にじまない大きさ）
function spriteBox(img, sx, sy, sw, sh, wantPt) {
  const s = Math.max(1, Math.round(wantPt * DPR / Math.max(sw, sh))) / DPR;
  const e = div("face");
  e.style.width = sw * s + "px"; e.style.height = sh * s + "px";
  e.style.backgroundImage = `url(${img.src})`;
  e.style.backgroundSize = `${img.naturalWidth * s}px ${img.naturalHeight * s}px`;
  e.style.backgroundPosition = `${-sx * s}px ${-sy * s}px`;
  return e;
}
function faceOf(u, pt) {
  const img = IM[u.img];
  if (u.side === 0) return spriteBox(img, FACE[0], FACE[1], FACE[2], FACE[3], pt);
  const sz = Math.min(img.naturalWidth, img.naturalHeight, 36);
  return spriteBox(img, Math.floor((img.naturalWidth - sz) / 2), Math.max(0, Math.floor(img.naturalHeight * 0.08)), sz, sz, pt);
}

// ---------- 上下の飾り（DOM） ----------
let els = {};
function buildHud() {
  hud.innerHTML = ""; els = { cards: {}, st: {} };
  els.tl = px(div("px frame", ""), TL.x, TL.y, TL.w, TL.h); els.tl.id = "tl"; hud.appendChild(els.tl);
  els.banner = px(div("px frame", ""), BANNER.x, BANNER.y, BANNER.w, BANNER.h); els.banner.id = "banner"; els.banner.style.fontSize = d(15); hud.appendChild(els.banner);
  st.party.forEach((u, i) => {
    const c = px(div("px frame card", ""), CARD.x0 + i * (CARD.w + CARD.gap), CARD.y, CARD.w, CARD.h);
    const holder = div("px", ""); holder.style.left = "50%"; holder.style.top = d(3); holder.style.transform = "translateX(-50%)"; c.appendChild(holder);
    const hp = div("bar", "<i></i>"); hp.style.bottom = d(9); c.appendChild(hp);
    const g = div("bar g", "<i></i>"); g.style.bottom = d(3); g.style.height = d(3.3); c.appendChild(g);
    const sh = div("sh", ""); c.appendChild(sh);
    hud.appendChild(c); els.cards[u.id] = { c, holder, hp: hp.firstChild, g, sh, pose: null };
    setFace(u, false);
  });
  st.foes.forEach(u => { const s = div("st", ""); hud.appendChild(s); els.st[u.id] = s; });
  const sp = px(div("px frame btn", ""), SPEED.x, SPEED.y, SPEED.w, SPEED.h); sp.style.fontSize = d(12.5);
  sp.onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; sp.innerHTML = `速さ　${speed}×`; };
  sp.innerHTML = `速さ　${speed}×`; hud.appendChild(sp);
  refresh();
}
function setFace(u, pose) {
  const e = els.cards[u.id]; if (!e) return;
  if (e.pose === pose) return; e.pose = pose;
  e.holder.innerHTML = "";
  const img = IM[u.img];
  const f = pose ? spriteBox(img, POSE[0], POSE[1], POSE[2], POSE[3], 45 * K) : spriteBox(img, FACE[0], FACE[1], FACE[2], FACE[3], 42 * K);
  e.holder.appendChild(f);
}
function refresh() {
  // 行動の順番（正面の顔）
  const q = BT.order(st, 7);
  els.tl.innerHTML = `<div class="hg" style="font-size:${d(12)}">⌛</div>`;
  q.forEach((u, i) => {
    const b = div("ic" + (u.side ? " foe" : "") + (i === 0 && busy ? " now" : ""), "");
    b.style.width = d(26); b.style.height = d(26);
    const f = faceOf(u, 26 * K); f.style.position = "absolute"; f.style.left = "50%"; f.style.top = "50%"; f.style.transform = "translate(-50%,-50%)";
    b.appendChild(f); els.tl.appendChild(b);
  });
  for (const u of st.party) {
    const e = els.cards[u.id];
    e.hp.style.width = (u.hp / u.max * 100) + "%";
    e.hp.style.background = u.hp < u.max * 0.25 ? "#e0604a" : "#6ab261";
    e.g.firstChild.style.width = u.gauge + "%"; e.g.classList.toggle("full", u.gauge >= 100);
    e.c.classList.toggle("ko", u.dead); e.c.classList.toggle("on", actor === u);
    e.sh.textContent = u.shield > 0 ? "守" + u.shield : "";
    e.sh.style.fontSize = d(8);
  }
  for (const u of st.foes) {
    const s = els.st[u.id], p = foePos(u);
    s.style.left = d(p.x); s.style.top = d(FOE_FEET + 11);
    s.innerHTML = u.dead ? "" : (u.burn > 0 ? `<b class="burn" style="font-size:${d(7.5)}">火傷</b>` : "") + (u.mark > 0 ? `<b class="mark" style="font-size:${d(7.5)}">印</b>` : "");
  }
}

// ---------- 敵と仲間の位置 ----------
let foeLayout = [];
function layoutFoes() {
  const sp = st.foes.map(u => IM[u.img]);
  const total = sp.reduce((s, i) => s + i.naturalWidth, 0);
  const gap = Math.max(2, Math.floor((W - total) / (sp.length + 1)));
  let left = Math.floor((W - total - gap * (sp.length - 1)) / 2);
  foeLayout = sp.map(i => { const p = { left, x: left + Math.floor(i.naturalWidth / 2), w: i.naturalWidth, h: i.naturalHeight }; left += i.naturalWidth + gap; return p; });
}
function foePos(u) { return foeLayout[u.slot]; }
function heroPos(u) { // 同じ列の人数で、左右に均等に並べる（1人なら真ん中）
  const same = st.party.filter(p => p.row === u.row), n = same.length, i = same.indexOf(u);
  const span = n === 1 ? 0 : n === 2 ? 120 : n === 3 ? 180 : 210;
  const x = Math.round(W / 2 - span / 2 + (n === 1 ? 0 : span * i / (n - 1)) + (u.row ? 0 : 0));
  return { x, y: ROW_FEET[u.row] };
}

// ---------- 描く ----------
const WHITE = new Map();
function white(img) { // 当たったときに光らせる白い影
  if (WHITE.has(img)) return WHITE.get(img);
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  WHITE.set(img, c); return c;
}
function draw(t) {
  ctx.clearRect(0, 0, W, H);
  if (scene) ctx.drawImage(scene, 0, 0);
  // 敵
  for (const u of st.foes) {
    const p = foePos(u), img = IM[u.img], f = fx[u.id] || {};
    if (u.dead && !(f.fade > t)) continue;
    let ox = 0, oy = 0;
    if (f.shake > t) ox = Math.round(Math.sin(t / 18) * 2);
    if (f.lunge > t) oy = 4;
    ctx.save();
    if (u.dead) ctx.globalAlpha = Math.max(0, (f.fade - t) / 500);
    // 影
    ctx.fillStyle = "#0006"; ctx.fillRect(p.x - Math.floor(p.w * 0.35), FOE_FEET - 2, Math.floor(p.w * 0.7), 3);
    ctx.drawImage(img, p.left + ox, FOE_FEET - p.h + oy);
    ctx.restore();
    if (f.flash > t) { ctx.save(); ctx.globalAlpha = 0.7; ctx.drawImage(white(img), p.left + ox, FOE_FEET - p.h + oy); ctx.restore(); } // 白く光る
    if (!u.dead) { // 体力
      const bw = Math.min(44, Math.max(26, Math.floor(p.w * 0.6))), bx = p.x - Math.floor(bw / 2), by = FOE_FEET + 4;
      ctx.fillStyle = "#1a1016"; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
      ctx.fillStyle = "#3a2531"; ctx.fillRect(bx, by, bw, 3);
      ctx.fillStyle = "#e0604a"; ctx.fillRect(bx, by, Math.ceil(bw * u.hp / u.max), 3);
    }
  }
  // 仲間（後ろ姿）。後列を先に描く
  for (const u of [...st.party].sort((a, b) => b.row - a.row)) {
    const p = heroPos(u), img = IM[u.img], f = fx[u.id] || {};
    let oy = 0, ox = 0, col = 1, row = 3;
    if (f.hop > t) { oy = -Math.round(Math.sin(Math.min(1, (f.hop - t) / 260) * Math.PI) * 7); col = Math.floor(t / 90) % 2 ? 0 : 2; }
    if (f.shake > t) ox = Math.round(Math.sin(t / 18) * 2);
    ctx.fillStyle = "#0007"; ctx.fillRect(p.x - 13, p.y - 2, 26, 3);
    ctx.save();
    if (u.dead) ctx.globalAlpha = 0.35;
    ctx.drawImage(img, col * SHEET.fw, row * SHEET.fh, SHEET.fw, SHEET.fh, p.x - 24 + ox, p.y - 60 + oy, SHEET.fw, SHEET.fh);
    ctx.restore();
  }
  requestAnimationFrame(draw);
}

// ---------- 数字と知らせ ----------
function num(x, y, text, cls, size) {
  const e = div("num " + (cls || ""), text); e.style.left = d(x); e.style.top = d(y); e.style.fontSize = d(size || 12);
  e.style.animationDuration = (0.9 / Math.sqrt(speed)) + "s";
  hud.appendChild(e); setTimeout(() => e.remove(), 1000);
}
function note(u, text) {
  let x, y;
  if (u.side === 0) { const i = st.party.indexOf(u); x = CARD.x0 + i * (CARD.w + CARD.gap) + CARD.w / 2; y = CARD.y - 13; }
  else { const p = foePos(u); x = p.x; y = FOE_FEET - p.h - 14; }
  const e = div("note", text); e.style.left = d(x); e.style.top = d(y); e.style.fontSize = d(8.4);
  e.style.animationDuration = (1.1 / Math.sqrt(speed)) + "s";
  hud.appendChild(e); setTimeout(() => e.remove(), 1200);
}
function where(u) {
  if (u.side === 1) { const p = foePos(u); return { x: p.x, y: FOE_FEET - p.h * 0.55 }; }
  const i = st.party.indexOf(u); return { x: CARD.x0 + i * (CARD.w + CARD.gap) + CARD.w / 2, y: CARD.y + 18 };
}
function byId(id) { return [...st.party, ...st.foes].find(u => u.id === id); }

// ---------- 進める ----------
const wait = ms => new Promise(r => setTimeout(r, ms / speed));
async function turn() {
  if (busy || ended) return;
  busy = true;
  const u = BT.step(st);
  actor = u;
  const evs = st.log.slice(last); last = st.log.length;
  const now = () => performance.now();
  refreshTL(u);
  for (const e of evs) {
    if (e.t === "act") {
      const s = BT.SKILLS[e.skill];
      els.banner.className = "px frame" + (e.k === "A" ? " act" : "");
      els.banner.innerHTML = `<span class="k" style="font-size:${d(8)}">${e.k === "A" ? "技" : "通常"}</span><span>${s.nm}</span>`;
      els.banner.classList.add("on");
      const a = byId(e.u);
      if (a.side === 0) { fx[a.id] = { ...(fx[a.id] || {}), hop: now() + 260 / speed }; if (e.k === "A") { setFace(a, true); poseUntil[a.id] = now() + 900 / speed; } }
      else fx[a.id] = { ...(fx[a.id] || {}), lunge: now() + 200 / speed };
      refresh();
      await wait(e.k === "A" ? 380 : 220);
    } else if (e.t === "hit") {
      const t = byId(e.d), p = where(t);
      fx[t.id] = { ...(fx[t.id] || {}), flash: now() + 120 / speed, shake: now() + 220 / speed };
      if (e.absorbed) num(p.x, p.y - 12, "守り " + e.absorbed, "guard", 12);
      if (e.v > 0 || !e.absorbed) num(p.x, p.y, String(e.v), (e.crit ? "crit" : "") + (t.side === 0 ? " foe" : ""), e.crit ? 22 : 18);
      if (e.syn) note(byId(e.a), e.syn[0]);
      refresh(); await wait(170);
    } else if (e.t === "passive") {
      const pu = byId(e.u); note(pu, e.nm + (e.v ? " " + e.v : "")); refresh(); await wait(140);
    } else if (e.t === "status") {
      refresh(); await wait(40);
    } else if (e.t === "shield") {
      const t = byId(e.d), p = where(t); num(p.x, p.y, "守り+" + e.v, "guard", 12); refresh(); await wait(60);
    } else if (e.t === "burn") {
      const t = byId(e.d), p = where(t); num(p.x, p.y, String(e.v), "foe", 15); note(t, "火傷"); refresh(); await wait(260);
    } else if (e.t === "down") {
      const t = byId(e.d); fx[t.id] = { ...(fx[t.id] || {}), fade: now() + 500 / speed }; refresh(); await wait(200);
    }
  }
  await wait(260);
  els.banner.classList.remove("on");
  for (const id in poseUntil) if (poseUntil[id] < now() + 50) { setFace(byId(id), false); delete poseUntil[id]; }
  actor = null; refresh();
  busy = false;
  if (st.over) { ended = true; setTimeout(result, 700 / speed); } else setTimeout(turn, 120 / speed);
}
function refreshTL(u) { refresh(); const first = els.tl.querySelector(".ic"); }

// ---------- 始めと終わり ----------
function start(w) {
  wave = w; st = BT.newBattle(w, (Date.now() & 0xffff) + 1, ROWS); last = 0; busy = false; ended = false; fx = {}; poseUntil = {};
  scene = SCENES[w](); layoutFoes(); buildHud();
  setTimeout(turn, 700);
}
function result() {
  const v = div("veil", "");
  const win = st.over === "win";
  v.appendChild(div("big", win ? "勝利" : "全滅…"));
  const max = Math.max(...st.party.map(u => u.dealt), 1);
  st.party.slice().sort((a, b) => b.dealt - a.dealt).forEach(u => {
    const r = div("rank", ""); const f = faceOf(u, 32); r.appendChild(f);
    r.appendChild(div("", u.nm)); r.appendChild(div("bar2", `<i style="width:${u.dealt / max * 100}%"></i>`)); r.appendChild(div("v", u.dealt)); v.appendChild(r);
  });
  const cnt = {}; st.log.filter(e => e.t === "passive").forEach(e => cnt[e.nm] = (cnt[e.nm] || 0) + 1);
  st.log.filter(e => e.t === "hit" && e.syn).forEach(e => e.syn.forEach(n => cnt[n] = (cnt[n] || 0) + 1));
  const ps = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([n, c]) => `<span style="white-space:nowrap">${n}×${c}</span>`).join("　");
  if (ps) { const p = div("", `<div style="font-size:12px;color:#c9b08c;text-align:center">働いたパッシブ</div><div style="font-size:13px;color:#ffe08a;text-align:center;padding:0 18px;line-height:1.7">${ps}</div>`); v.appendChild(p); }
  const again = div("frame btn pick", "もう一度"); again.onclick = () => start(wave); v.appendChild(again);
  const next = div("frame btn pick", "ほかの相手と戦う"); next.onclick = menu; v.appendChild(next);
  hud.appendChild(v);
}
function menu() {
  hud.innerHTML = ""; const v = div("veil", "");
  // 並び：顔を押すと前列と後列を行き来する（前列は1人以上）
  const fm = div("", ""); fm.style.cssText = "display:flex;flex-direction:column;gap:6px;width:86%";
  [0, 1].forEach(r => {
    const line = div("frame", ""); line.style.cssText = "display:flex;align-items:center;gap:8px;padding:6px 10px;min-height:52px";
    line.appendChild(div("", `<span style="font-size:13px;color:#c9b08c">${r ? "後列" : "前列"}</span>`));
    BT.HEROES.forEach((h, i) => { if (ROWS[i] !== r) return; const f = spriteBox(IM[h.img], FACE[0], FACE[1], FACE[2], FACE[3], 40); f.style.cursor = "pointer";
      f.onclick = () => { const nr = 1 - ROWS[i]; if (nr === 1 && ROWS.filter(x => x === 0).length <= 1) return; ROWS[i] = nr; menu(); }; line.appendChild(f); });
    fm.appendChild(line);
  });
  v.appendChild(fm);
  v.appendChild(div("big", "どこで戦う？"));
  PLACES.forEach(([n, s], i) => { const b = div("frame btn pick", `<div style="text-align:center">${n}<small>${s}</small></div>`); b.onclick = () => start(i); v.appendChild(b); });
  hud.appendChild(v);
}

addEventListener("resize", fit);
Promise.all([...new Set([...BT.HEROES.map(h => h.img), ...Object.values(BT.FOES).map(f => f.img)])].map(load)).then(() => {
  fit(); scene = SCENES[0](); st = BT.newBattle(0, 1); layoutFoes(); buildHud(); requestAnimationFrame(draw); menu();
});
})();
