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
const EL_COL = { water: "#4a90e2", fire: "#e0503a", wind: "#4cb860", earth: "#b8864a", light: "#f0c840", dark: "#9a5ad0" };
function elChip(el, size) { const e = div("el", BT.ELEM[el]); e.style.background = EL_COL[el]; e.style.width = e.style.height = e.style.lineHeight = d(size); e.style.fontSize = d(size * 0.72); return e; }
function chips(u) { // 状態の札（同じ大きさ・同じ並び）
  const a = [];
  if (u.ctl > 0) a.push(["ctl", u.ctlNm]);
  if (u.burn > 0) a.push(["burn", "火傷"]);
  if (u.poison > 0) a.push(["poison", "毒"]);
  if (u.mark > 0) a.push(["mark", "印"]);
  return a.map(([c, t]) => `<b class="${c}" style="font-size:${d(7)};line-height:${d(11)}">${t}</b>`).join("");
}
function load(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "img/" + src + ".png"; IM[src] = i; }); }

// 組み立て（並び・技・心）。端末に覚えておく
const LO_KEY = "rpgLoadout1";
function defLo() { return { rows: BT.HEROES.map(h => h.row), sk: BT.HEROES.map(h => h.sk.slice()), hearts: BT.HEROES.map(() => [null, null]) }; }
let LO = (() => { try { const v = JSON.parse(localStorage.getItem(LO_KEY)); if (v && v.sk && v.sk.length === 4 && v.sk.every((a, i) => a.every(k => BT.HEROES[i].learn.includes(k)))) return v; } catch (e) {} return defLo(); })();
function saveLo() { try { localStorage.setItem(LO_KEY, JSON.stringify(LO)); } catch (e) {} }
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
    const el = elChip(u.el, 11); el.style.position = "absolute"; el.style.left = d(3); el.style.top = d(3); c.appendChild(el);
    const ss = div("st cs", ""); ss.style.left = d(3); ss.style.top = d(16); c.appendChild(ss);
    hud.appendChild(c); els.cards[u.id] = { c, holder, hp: hp.firstChild, g, sh, ss, pose: null };
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
  const q = actor && !actor.dead ? [actor, ...BT.order(st, 5)] : BT.order(st, 6); // 先頭は今動いている人
  els.tl.innerHTML = `<div class="hg" style="font-size:${d(12)};width:${d(30)}">${Math.max(1, st.round)}<small style="font-size:${d(8)}">/${BT.ROUNDS}</small></div>`;
  q.forEach((u, i) => {
    const b = div("ic" + (u.side ? " foe" : "") + (i === 0 && actor ? " now" : ""), "");
    b.style.width = d(26); b.style.height = d(26);
    const f = faceOf(u, 26 * K); f.style.position = "absolute"; f.style.left = "50%"; f.style.top = "50%"; f.style.transform = "translate(-50%,-50%)";
    b.appendChild(f); els.tl.appendChild(b);
  });
  for (const u of st.party) {
    const e = els.cards[u.id];
    e.hp.style.width = (u.hp / u.max * 100) + "%";
    e.hp.style.background = u.hp < u.max * 0.25 ? "#e0604a" : "#6ab261";
    const cost = BT.costOf(u) || 100;
    e.g.firstChild.style.width = Math.min(100, u.gauge / cost * 100) + "%"; e.g.classList.toggle("full", u.gauge >= cost);
    e.ss.innerHTML = u.dead ? "" : chips(u);
    e.c.classList.toggle("ko", u.dead); e.c.classList.toggle("on", actor === u);
    e.sh.textContent = u.shield > 0 ? "守" + u.shield : "";
    e.sh.style.fontSize = d(8);
  }
  for (const u of st.foes) {
    const s = els.st[u.id], p = foePos(u);
    s.style.left = d(p.x); s.style.top = d(p.feet + 9);
    s.innerHTML = u.dead ? "" : `<b class="elb" style="background:${EL_COL[u.el]};font-size:${d(7)};line-height:${d(11)}">${BT.ELEM[u.el]}</b>` + chips(u);
  }
}

// ---------- 敵と仲間の位置 ----------
let foeLayout = [];
function layoutFoes() {
  const sp = st.foes.map(u => IM[u.img]);
  const total = sp.reduce((s, i) => s + i.naturalWidth, 0);
  const gap = Math.max(2, Math.floor((W - total) / (sp.length + 1)));
  let left = Math.floor((W - total - gap * (sp.length - 1)) / 2);
  foeLayout = sp.map((i, k) => { const p = { left, x: left + Math.floor(i.naturalWidth / 2), w: i.naturalWidth, h: i.naturalHeight, feet: FOE_FEET - (st.foes[k].row ? 26 : 0) }; left += i.naturalWidth + gap; return p; });
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
  for (const u of [...st.foes].sort((a, b) => b.row - a.row)) {
    const p = foePos(u), img = IM[u.img], f = fx[u.id] || {}, FEET = p.feet;
    if (u.dead && !(f.fade > t)) continue;
    let ox = 0, oy = 0;
    if (f.shake > t) ox = Math.round(Math.sin(t / 18) * 2);
    if (f.lunge > t) oy = 4;
    ctx.save();
    if (u.dead) ctx.globalAlpha = Math.max(0, (f.fade - t) / 500);
    // 影
    ctx.fillStyle = "#0006"; ctx.fillRect(p.x - Math.floor(p.w * 0.35), FEET - 2, Math.floor(p.w * 0.7), 3);
    ctx.drawImage(img, p.left + ox, FEET - p.h + oy);
    ctx.restore();
    if (f.flash > t) { ctx.save(); ctx.globalAlpha = 0.7; ctx.drawImage(white(img), p.left + ox, FEET - p.h + oy); ctx.restore(); } // 白く光る
    if (!u.dead) { // 体力
      const bw = Math.min(44, Math.max(26, Math.floor(p.w * 0.6))), bx = p.x - Math.floor(bw / 2), by = FEET + 4;
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
  if (u.side === 0) { const i = st.party.indexOf(u); x = CARD.x0 + i * (CARD.w + CARD.gap) + CARD.w / 2; y = CARD.y + 30; }
  else { const p = foePos(u); x = p.x; y = p.feet - p.h - 14; }
  const e = div("note", text); e.style.left = d(x); e.style.top = d(y); e.style.fontSize = d(8.4);
  e.style.animationDuration = (1.1 / Math.sqrt(speed)) + "s";
  hud.appendChild(e); setTimeout(() => e.remove(), 1200);
}
function where(u) {
  if (u.side === 1) { const p = foePos(u); return { x: p.x, y: p.feet - p.h * 0.55 }; }
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
  if (!u) { busy = false; ended = true; setTimeout(result, 500 / speed); return; }
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
      if (e.v > 0 || !e.absorbed) num(p.x, p.y, String(e.v), (e.crit ? "crit" : "") + (t.side === 0 ? " foe" : ""), e.crit ? 22 : e.adv ? 20 : 18);
      if (e.syn) note(byId(e.a), e.syn[0]);
      refresh(); await wait(170);
    } else if (e.t === "passive") {
      const pu = byId(e.u); note(pu, e.nm + (e.v ? " " + e.v : "")); refresh(); await wait(140);
    } else if (e.t === "shield") {
      const t = byId(e.d), p = where(t); num(p.x, p.y, "守り+" + e.v, "guard", 12); refresh(); await wait(60);
    } else if (e.t === "dot") {
      const t = byId(e.d), p = where(t); num(p.x, p.y, String(e.v), e.nm === "毒" ? "poison" : "foe", 15); note(t, e.nm); refresh(); await wait(260);
    } else if (e.t === "skip") {
      const t = byId(e.u); note(t, e.nm + "で動けない"); refresh(); await wait(420);
    } else if (e.t === "resist") {
      const t = byId(e.d); note(t, "効かない"); refresh(); await wait(200);
    } else if (e.t === "status") {
      const t = byId(e.d); if (e.nm === "気絶" || e.nm === "凍結" || e.nm === "石化") { note(t, e.nm); await wait(240); } refresh(); await wait(40);
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
  wave = w; st = BT.newBattle(w, (Date.now() & 0xffff) + 1, LO); last = 0; busy = false; ended = false; fx = {}; poseUntil = {};
  scene = SCENES[w](); layoutFoes(); buildHud();
  setTimeout(turn, 700);
}
function result() {
  const v = div("veil", "");
  const win = st.over === "win";
  v.appendChild(div("big", win ? "勝利" : st.over === "time" ? "時間切れ…" : "全滅…"));
  const fell = st.party.filter(u => u.dead).sort((a, b) => a.downAt - b.downAt).map(u => `${u.nm} ${u.downAt}ラウンド目`).join("　");
  v.appendChild(div("sub", `${st.round}ラウンドで決着` + (fell ? `<br>倒れた仲間　${fell}` : "　倒れた仲間なし")));
  const max = Math.max(...st.party.map(u => u.dealt), 1);
  st.party.slice().sort((a, b) => b.dealt - a.dealt).forEach(u => {
    const r = div("rank", ""); const f = faceOf(u, 32); r.appendChild(f);
    r.appendChild(div("", u.nm)); r.appendChild(div("bar2", `<i style="width:${u.dealt / max * 100}%"></i>`)); r.appendChild(div("v", u.dealt)); v.appendChild(r);
  });
  const ours = id => st.party.some(u => u.id === id); // 仲間のぶんだけ数える
  const cnt = {}; st.log.filter(e => e.t === "passive" && ours(e.u)).forEach(e => cnt[e.nm] = (cnt[e.nm] || 0) + 1);
  st.log.filter(e => e.t === "hit" && e.syn && ours(e.a)).forEach(e => e.syn.forEach(n => cnt[n] = (cnt[n] || 0) + 1));
  const ps = Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([n, c]) => `<span style="white-space:nowrap">${n}×${c}</span>`).join("　");
  if (ps) { const p = div("", `<div style="font-size:12px;color:#c9b08c;text-align:center">働いたパッシブ</div><div style="font-size:13px;color:#ffe08a;text-align:center;padding:0 18px;line-height:1.7">${ps}</div>`); v.appendChild(p); }
  const again = div("frame btn pick", "もう一度"); again.onclick = () => start(wave); v.appendChild(again);
  const next = div("frame btn pick", "ほかの相手と戦う"); next.onclick = menu; v.appendChild(next);
  hud.appendChild(v);
}
function menu() {
  hud.innerHTML = ""; const v = div("veil", "");
  // 仲間の顔：押すとその人の組み立てへ
  const fm = div("", ""); fm.style.cssText = "display:flex;gap:8px;justify-content:center";
  BT.HEROES.forEach((h, i) => {
    const t = div("frame tile", ""); t.style.cssText = "position:relative;width:62px;height:70px;cursor:pointer";
    const f = spriteBox(IM[h.img], FACE[0], FACE[1], FACE[2], FACE[3], 44); f.style.cssText += ";position:absolute;left:50%;top:4px;transform:translateX(-50%)"; t.appendChild(f);
    const el = elChip(h.el, 11); el.style.position = "absolute"; el.style.left = d(3); el.style.top = d(3); t.appendChild(el);
    const r = div("rowtag " + (LO.rows[i] ? "back" : "front"), LO.rows[i] ? "後列" : "前列"); r.style.cssText += ";position:absolute;left:0;right:0;bottom:0;height:18px;line-height:18px;font-size:11px"; t.appendChild(r);
    t.onclick = () => build(i); fm.appendChild(t);
  });
  v.appendChild(fm);
  v.appendChild(div("big", "どこで戦う？"));
  const me = BT.newBattle(0, 1, LO);
  v.appendChild(div("sub", `こちらの戦力　<b>${BT.teamPower(me.party)}</b>` + (me.aura ? `　${me.aura.nm}` : "")));
  PLACES.forEach(([n, s], i) => { const f = BT.newBattle(i, 1, LO); const b = div("frame btn pick", `<div style="text-align:center">${n}<small>${s}　戦力 ${BT.teamPower(f.foes)}</small></div>`); b.onclick = () => start(i); v.appendChild(b); });
  hud.appendChild(v);
}

// ---------- 組み立て画面 ----------
// 上：4人の顔と列（押すと前列・後列が入れ替わる）。線：仲間同士のつながり。
// 中：選んだ人の枠（通常・アクティブ・パッシブ2・心2）。押した枠の候補が下に出て、候補を押せばすぐ入れ替わる。
const TAGS = [ // つながり：作る技 → 使う技
  { nm: "印", col: "#2a5aa8", make: ["pierce"], use: ["triple", "finisher", "bash", "charge", "rain", "signal", "hawk", "snipe", "icearrow", "flash"] },
  { nm: "火傷", col: "#b8452a", make: ["ember", "inferno", "fireball"], use: ["spread", "burst", "heatwave"] },
  { nm: "動けない", col: "#c9a43a", make: ["bash", "charge", "icearrow"], use: ["smite", "flow"] },
  { nm: "守り", col: "#3a8ab8", make: ["bulwark"], use: ["parry", "shieldcall"] },
  { nm: "アクティブ", col: "#7a6a9a", make: [], use: ["tailwind"] },
];
function links() {
  const out = [];
  for (const t of TAGS) {
    const mk = [], us = [];
    BT.HEROES.forEach((h, i) => { const sk = LO.sk[i]; if (sk.some(k => t.make.includes(k)) || (t.nm === "アクティブ")) mk.push(i); if (sk.some(k => t.use.includes(k))) us.push(i); });
    const pairs = [], self = [];
    for (const a of mk) for (const b of us) if (a !== b) pairs.push([a, b]); else self.push(a);
    if (t.nm === "アクティブ") { if (us.length) out.push({ t, mk: [], us, pairs: [], self: [] }); continue; }
    if (pairs.length || self.length) out.push({ t, mk: [...new Set(pairs.map(p => p[0]))], us: [...new Set(pairs.map(p => p[1]))], pairs, self });
  }
  return out;
}
let focus = 0;
const SLOT_NM = ["通常", "アクティブ", "パッシブ", "パッシブ", "心", "心"];
function build(i, keepFocus) {
  if (!keepFocus) focus = 0;
  hud.innerHTML = "";
  const v = div("veil solid", ""); hud.appendChild(v);
  const A = (el, x, y, w, h) => { px(el, x, y, w, h); el.style.position = "absolute"; v.appendChild(el); return el; };
  const T = (x, y, w, h, html, size, cls) => { const e = A(div("t " + (cls || ""), html), x, y, w, h); e.style.fontSize = d(size); e.style.lineHeight = d(h); return e; };
  // 4人
  BT.HEROES.forEach((h, k) => {
    const x = 17 + k * 68;
    const t = A(div("frame tile" + (k === i ? " sel" : ""), ""), x, 48, 62, 56);
    const f = spriteBox(IM[h.img], FACE[0], FACE[1], FACE[2], FACE[3], 40 * K); f.style.position = "absolute"; f.style.left = "50%"; f.style.top = d(4); f.style.transform = "translateX(-50%)"; t.appendChild(f);
    const el = elChip(h.el, 11); el.style.position = "absolute"; el.style.left = d(3); el.style.top = d(3); t.appendChild(el);
    t.onclick = () => build(k);
    const r = A(div("rowtag " + (LO.rows[k] ? "back" : "front"), LO.rows[k] ? "後列" : "前列"), x, 107, 62, 15);
    r.style.fontSize = d(9); r.style.lineHeight = d(15);
    r.onclick = () => { const nr = 1 - LO.rows[k]; if (nr === 1 && LO.rows.filter(z => z === 0).length <= 1) return; LO.rows[k] = nr; saveLo(); build(i, true); };
  });
  // つながりの線と一覧
  const L = links();
  const svgNS = "http://www.w3.org/2000/svg", svg = document.createElementNS(svgNS, "svg");
  A(svg, 0, 124, W, 12); svg.setAttribute("viewBox", `0 0 ${W} 12`);
  L.forEach((l, n) => l.pairs.forEach(([a, b]) => {
    const xa = 48 + a * 68, xb = 48 + b * 68, y = 3 + n * 3;
    const ln = document.createElementNS(svgNS, "path"); ln.setAttribute("d", `M${xa} 0 V${y} H${xb} V0`);
    ln.setAttribute("fill", "none"); ln.setAttribute("stroke", l.t.col); ln.setAttribute("stroke-width", "1.6"); ln.setAttribute("class", "glowline"); svg.appendChild(ln);
  }));
  const box = A(div("frame", ""), 17, 138, 267, 58);
  if (!L.length) T(25, 138, 251, 58, "つながりはまだない", 9, "dim");
  L.slice(0, 4).forEach((l, n) => {
    const y = 140 + n * 13.5;
    const c = T(23, y, 44, 13, l.t.nm, 8, "tag"); c.style.background = l.t.col;
    const nm = k => BT.HEROES[k].nm;
    const who = l.t.nm === "アクティブ" ? `誰かの技 → ${l.us.map(nm).join("・")}（追い風）`
      : [l.pairs.length ? `${l.mk.map(nm).join("・")} → ${l.us.map(nm).join("・")}` : "", l.self.length ? `${l.self.map(nm).join("・")}（ひとりで）` : ""].filter(Boolean).join("　");
    T(72, y, 206, 13, who, 9);
  });
  // 選んだ人
  const h = BT.HEROES[i], u = BT.heroUnit(h, i, LO);
  T(17, 202, 120, 18, h.nm, 14, "name");
  T(150, 202, 134, 18, `戦力 <b>${BT.power(u)}</b>`, 10, "right");
  const stats = [["hp", "体力"], ["atk", "攻撃"], ["mat", "魔力"], ["spd", "速さ"], ["def", "防御"], ["mdf", "魔防"], ["crit", "会心"]];
  stats.forEach(([k, n], j) => {
    const x = 17 + (j % 4) * 67, y = 222 + Math.floor(j / 4) * 14;
    const base = h[k] || 0, now = u[k] || 0;
    T(x, y, 30, 14, n, 8.5, "dim");
    T(x + 26, y, 36, 14, now + (now > base ? `<i>+${now - base}</i>` : ""), 9.5, "num2");
  });
  // 枠
  const sk = LO.sk[i], hs = LO.hearts[i];
  const slotItem = j => j < 4 ? sk[j] : hs[j - 4];
  for (let j = 0; j < 6; j++) {
    const y = 254 + j * 28, id = slotItem(j);
    const row = A(div("slot" + (j === focus ? " on" : ""), ""), 17, y, 267, 26);
    row.onclick = () => { focus = j; build(i, true); };
    T(21, y, 46, 26, SLOT_NM[j], 8.5, "label");
    if (j < 4) {
      const s = BT.SKILLS[id];
      T(70, y + 1, 150, 14, s.nm, 11, "sname");
      T(70, y + 13, 210, 12, s.ds, 8, "sdesc");
      if (s.cost) T(214, y + 1, 66, 14, `ゲージ${s.cost}`, 8, "right dim");
    } else if (id) {
      const hh = BT.HEARTS[id];
      T(70, y + 1, 150, 14, `${hh.nm}<span class="hc">${hh.col}</span>`, 11, "sname");
      T(70, y + 13, 210, 12, BT.heartText(id), 8, "sdesc");
    } else T(70, y, 210, 26, "空き", 10, "dim");
  }
  // 候補
  T(17, 424, 267, 18, `${SLOT_NM[focus]}の候補`, 8.5, "dim");
  let cands = [];
  if (focus < 4) {
    const kind = focus === 0 ? "N" : focus === 1 ? "A" : "P";
    cands = h.learn.filter(k => BT.SKILLS[k].k === kind).map(k => {
      const s = BT.SKILLS[k], other = focus >= 2 ? sk[focus === 2 ? 3 : 2] : null;
      return { nm: s.nm, ds: s.ds, cost: s.cost, now: sk[focus] === k, note: k === other ? "もう1つの枠" : "",
        go: () => { if (k === other) { sk[focus === 2 ? 3 : 2] = sk[focus]; } sk[focus] = k; } };
    });
  } else {
    const hj = focus - 4;
    cands = Object.keys(BT.HEARTS).map(id => {
      const hh = BT.HEARTS[id]; let owner = -1, oj = -1;
      LO.hearts.forEach((a, k) => a.forEach((x, m) => { if (x === id) { owner = k; oj = m; } }));
      const note = owner === i ? (oj === hj ? "" : "もう1つの枠") : owner >= 0 ? `${BT.HEROES[owner].nm}が使用中` : "";
      return { nm: hh.nm, col: hh.col, ds: BT.heartText(id), now: hs[hj] === id, note,
        go: () => { if (owner >= 0) LO.hearts[owner][oj] = owner === i ? hs[hj] : null; hs[hj] = id; } };
    });
    cands.push({ nm: "外す", ds: "この枠を空ける", now: !hs[hj], go: () => { hs[hj] = null; } });
  }
  cands.forEach((c, n) => {
    const y = 442 + n * 26;
    const row = A(div("cand" + (c.now ? " now" : ""), ""), 17, y, 267, 25);
    if (!c.now) row.onclick = () => { c.go(); saveLo(); build(i, true); };
    T(23, y + 1, 150, 13, c.nm + (c.col ? `<span class="hc">${c.col}</span>` : ""), 10.5, "sname");
    T(23, y + 13, 257, 11, c.ds, 8, "sdesc");
    const tag = c.now ? (c.nm === "外す" ? "" : "使用中") : c.note ? c.note : c.cost ? `ゲージ${c.cost}` : "";
    if (tag) T(180, y + 1, 100, 13, tag, 8, "right " + (c.now ? "gold" : "dim"));
  });
  const back = A(div("frame btn", "戦う場所へ"), 88, 604, 125, 22); back.style.fontSize = d(10.5);
  back.onclick = menu;
}

addEventListener("resize", fit);
Promise.all([...new Set([...BT.HEROES.map(h => h.img), ...Object.values(BT.FOES).map(f => f.img)])].map(load)).then(() => {
  fit(); scene = SCENES[0](); st = BT.newBattle(0, 1); layoutFoes(); buildHud(); requestAnimationFrame(draw); menu();
});
})();
