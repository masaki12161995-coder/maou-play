// 戦闘の画面（ロマサガRS型）。敵は上、仲間は陣形の場所に後ろ姿。行動の順番と下の札は正面の顔。
// ターンごとに、下の札の人の行動を選ぶ（押すとすぐ決まり、次の人へ）。敵を押すと全員の狙いがその敵になる。
// オートは「切」→「通常」→「全力」を押して切り替える。
(() => {
"use strict";
const W = 301, H = 655; // 1ドット＝4画素
const DPR = window.devicePixelRatio || 2;
const stage = document.getElementById("stage"), cv = document.getElementById("field"), ctx = cv.getContext("2d"), hud = document.getElementById("hud");
ctx.imageSmoothingEnabled = false;
let K = 2;

// ---------- 位置（ドット） ----------
const TL = { x: 17, y: 62, w: 267, h: 32 };
const FOE_FEET = 230;
const BANNER = { x: 17, y: 420, w: 267, h: 22 };
const CARD = { y: 446, w: 62, h: 62, x0: 17, gap: 6.33 };
const CMD = { y: 514, h: 38, gap: 4 }; // 2列×2段
const BAR = { y: 602, h: 22 };
const SHEET = { fw: 48, fh: 60 };
const FACE = [58, 4, 28, 30];
const POSE = [0, 240, 48, 46];
const EL = { 斬: "#c9c9d6", 打: "#c9a46c", 突: "#9fc9e0", 熱: "#e0603a", 冷: "#6ab0ff", 雷: "#f0d040", 陽: "#ffe08a", 陰: "#a070d0" };

const IM = {};
function load(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "img/" + src + ".png"; IM[src] = i; }); }

// 並び（陣形と、どの場所に誰が立つか）。端末に覚えておく
const LO_KEY = "rpgRS1";
let LO = (() => { try { const v = JSON.parse(localStorage.getItem(LO_KEY)); if (v && BT.FORMATIONS[v.form] && v.pos && v.pos.length === 4) return v; } catch (e) {} return BT.defLo(); })();
function saveLo() { try { localStorage.setItem(LO_KEY, JSON.stringify(LO)); } catch (e) {} }

let st = null, wave = 0, speed = 1, auto = "off", last = 0, busy = false, actor = null, poseUntil = {}, fx = {}, scene = null, ended = false, cmdIdx = 0;
const SCENES = [() => makeScene(), () => dungeonScene("canopy"), () => dungeonScene("gold")];

function fit() {
  const w = Math.min(innerWidth, innerHeight * W / H);
  K = w / W;
  stage.style.width = w + "px"; stage.style.height = (w * H / W) + "px";
  if (st && !hud.querySelector(".veil")) buildHud();
}
const d = v => v * K + "px";
function px(el, x, y, w, h) { el.style.left = d(x); el.style.top = d(y); if (w !== undefined) el.style.width = d(w); if (h !== undefined) el.style.height = d(h); return el; }
function div(cls, html) { const e = document.createElement("div"); e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
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
const cardX = i => CARD.x0 + i * (CARD.w + CARD.gap);

// ---------- 上下の飾り（DOM） ----------
let els = {};
function buildHud() {
  hud.innerHTML = ""; els = { cards: {}, st: {}, foeHit: {} };
  els.tl = px(div("px frame", ""), TL.x, TL.y, TL.w, TL.h); els.tl.id = "tl"; hud.appendChild(els.tl);
  els.banner = px(div("px frame", ""), BANNER.x, BANNER.y, BANNER.w, BANNER.h); els.banner.id = "banner"; els.banner.style.fontSize = d(12); hud.appendChild(els.banner);
  // 敵：押すと狙いがその敵になる
  st.foes.forEach(u => {
    const p = foePos(u);
    const hit = px(div("px foehit", ""), p.left - 4, FOE_FEET - p.h - 6, p.w + 8, p.h + 14);
    hit.onclick = () => { if (u.down) return; st.focus = u.id; refresh(); };
    hud.appendChild(hit); els.foeHit[u.id] = hit;
    const s = div("st", ""); hud.appendChild(s); els.st[u.id] = s;
  });
  els.aim = div("aim", "▼"); hud.appendChild(els.aim);
  // 仲間の札
  st.party.forEach((u, i) => {
    const c = px(div("px frame card", ""), cardX(i), CARD.y, CARD.w, CARD.h);
    const holder = div("px", ""); holder.style.left = "50%"; holder.style.top = d(2); holder.style.transform = "translateX(-50%)"; c.appendChild(holder);
    const hp = div("bar", "<i></i>"); hp.style.bottom = d(13); c.appendChild(hp);
    const info = div("info", ""); info.style.bottom = d(2); info.style.height = d(10); info.style.fontSize = d(7.5); c.appendChild(info);
    const cmd = div("cmdtag", ""); cmd.style.fontSize = d(7); cmd.style.top = d(2); cmd.style.left = d(2); c.appendChild(cmd);
    c.onclick = () => { if (st.phase === "command" && auto === "off" && !busy && !u.down) { cmdIdx = i; refresh(); } };
    hud.appendChild(c); els.cards[u.id] = { c, holder, hp: hp.firstChild, info, cmd, pose: null };
    setFace(u, false);
  });
  // コマンド（2列×2段）
  els.cmds = [0, 1, 2, 3].map(k => {
    const b = px(div("px frame cmd", ""), 17 + (k % 2) * 135.5, CMD.y + Math.floor(k / 2) * (CMD.h + CMD.gap), 131.5, CMD.h);
    hud.appendChild(b); return b;
  });
  els.auto = px(div("px frame btn", ""), 17, BAR.y, 131.5, BAR.h); els.auto.style.fontSize = d(10.5);
  els.auto.onclick = () => { auto = auto === "off" ? "normal" : auto === "normal" ? "full" : "off"; refresh(); if (st.phase === "command" && auto !== "off" && !busy) go(); };
  hud.appendChild(els.auto);
  els.speed = px(div("px frame btn", ""), 152.5, BAR.y, 131.5, BAR.h); els.speed.style.fontSize = d(10.5);
  els.speed.onclick = () => { speed = speed === 1 ? 2 : speed === 2 ? 4 : 1; refresh(); };
  hud.appendChild(els.speed);
  refresh();
}
function setFace(u, pose) {
  const e = els.cards[u.id]; if (!e || e.pose === pose) return; e.pose = pose;
  e.holder.innerHTML = "";
  const img = IM[u.img];
  e.holder.appendChild(pose ? spriteBox(img, POSE[0], POSE[1], POSE[2], POSE[3], 40 * K) : spriteBox(img, FACE[0], FACE[1], FACE[2], FACE[3], 38 * K));
}
function commanding() { return st.phase === "command" && auto === "off" && !busy && !ended; }
function refresh() {
  // 行動の順番
  const q = BT.order(st).slice(0, 7);
  els.tl.innerHTML = `<div class="hg" style="font-size:${d(11)};width:${d(34)}">${st.turn}<small style="font-size:${d(7.5)}">ターン</small></div>`;
  q.forEach((u, i) => {
    const b = div("ic" + (u.side ? " foe" : "") + (i === 0 && actor === u ? " now" : ""), "");
    b.style.width = d(26); b.style.height = d(26);
    const f = faceOf(u, 26 * K); f.style.position = "absolute"; f.style.left = "50%"; f.style.top = "50%"; f.style.transform = "translate(-50%,-50%)";
    b.appendChild(f); els.tl.appendChild(b);
  });
  // 札
  const cmdOn = commanding();
  if (cmdOn) { const al = st.party.map((u, i) => i).filter(i => !st.party[i].down); if (!al.includes(cmdIdx)) cmdIdx = al[0]; }
  st.party.forEach((u, i) => {
    const e = els.cards[u.id];
    e.hp.style.width = (u.hp / u.max * 100) + "%";
    e.hp.style.background = u.hp < u.max * 0.25 ? "#e0604a" : "#6ab261";
    e.info.innerHTML = `<span class="bp">BP<b>${u.bp}</b></span><span class="lp">LP<b>${u.lp}</b></span>`;
    e.c.classList.toggle("ko", u.down); e.c.classList.toggle("on", actor === u || (cmdOn && cmdIdx === i));
    const ck = st.cmd[u.id]; e.cmd.textContent = st.phase === "command" && ck && !u.down ? BT.SKILLS[ck].nm : "";
  });
  // 敵の札と狙い
  for (const u of st.foes) {
    const s = els.st[u.id], p = foePos(u);
    s.style.left = d(p.x); s.style.top = d(FOE_FEET + 9);
    s.innerHTML = u.down ? "" : (u.stun ? `<b class="ctl" style="font-size:${d(7)};line-height:${d(11)}">スタン</b>` : "") + (u.poison ? `<b class="poison" style="font-size:${d(7)};line-height:${d(11)}">毒</b>` : "");
    els.foeHit[u.id].style.pointerEvents = u.down ? "none" : "auto";
  }
  const f = st.foes.find(x => x.id === st.focus && !x.down);
  els.aim.style.display = f ? "block" : "none";
  if (f) { const p = foePos(f); els.aim.style.left = d(p.x); els.aim.style.top = d(FOE_FEET - p.h - 14); els.aim.style.fontSize = d(10); }
  // コマンド
  const cu = st.party[cmdIdx];
  els.cmds.forEach((b, k) => {
    b.innerHTML = ""; b.onclick = null; b.className = "px frame cmd";
    if (!cmdOn || !cu) { b.classList.add("off"); return; }
    const key = ["attack", ...cu.sk][k], s = BT.SKILLS[key], ok = s.bp <= cu.bp;
    const at = s.at || BT.WEAPON[cu.wp].at;
    b.innerHTML = `<div class="cn" style="font-size:${d(10.5)}">${s.nm}</div><div class="cb" style="font-size:${d(8)}">${s.bp ? "BP" + s.bp : ""}</div>` +
      `<div class="cd" style="font-size:${d(7.2)}">${s.heal || s.cover ? "" : at.map(a => `<i style="color:${EL[a]}">${a}</i>`).join("")}${s.ds}</div>`;
    if (!ok) b.classList.add("dim");
    if (st.cmd[cu.id] === key) b.classList.add("sel");
    if (ok) b.onclick = () => pick(key);
  });
  els.auto.innerHTML = `オート　<b>${auto === "off" ? "切" : auto === "normal" ? "通常" : "全力"}</b>`;
  els.auto.classList.toggle("lit", auto !== "off");
  els.speed.innerHTML = `速さ　<b>${speed}×</b>`;
}
// コマンドを押す：その人の行動が決まり、次の人へ。最後の人で動き出す
function pick(key) {
  const u = st.party[cmdIdx]; st.cmd[u.id] = key;
  const al = st.party.map((p, i) => i).filter(i => !st.party[i].down);
  const next = al.find(i => i > cmdIdx);
  if (next === undefined) { go(); return; }
  cmdIdx = next; refresh();
}
function go() {
  if (st.phase !== "command" || busy || ended) return;
  BT.commit(st, auto === "off" ? null : auto);
  cmdIdx = 0; refresh();
  setTimeout(turn, 150 / speed);
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
function heroPos(u) { const [x, y] = BT.FORMATIONS[LO.form].pos[u.slot]; return { x, y }; }

// ---------- 描く ----------
const WHITE = new Map();
function white(img) {
  if (WHITE.has(img)) return WHITE.get(img);
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  WHITE.set(img, c); return c;
}
function draw(t) {
  ctx.clearRect(0, 0, W, H);
  if (scene) ctx.drawImage(scene, 0, 0);
  if (st) {
    for (const u of st.foes) {
      const p = foePos(u), img = IM[u.img], f = fx[u.id] || {};
      if (u.down && !(f.fade > t)) continue;
      let ox = 0, oy = 0;
      if (f.shake > t) ox = Math.round(Math.sin(t / 18) * 2);
      if (f.lunge > t) oy = 4;
      ctx.save();
      if (u.down) ctx.globalAlpha = Math.max(0, (f.fade - t) / 500);
      ctx.fillStyle = "#0006"; ctx.fillRect(p.x - Math.floor(p.w * 0.35), FOE_FEET - 2, Math.floor(p.w * 0.7), 3);
      ctx.drawImage(img, p.left + ox, FOE_FEET - p.h + oy);
      ctx.restore();
      if (f.flash > t) { ctx.save(); ctx.globalAlpha = 0.7; ctx.drawImage(white(img), p.left + ox, FOE_FEET - p.h + oy); ctx.restore(); }
      if (!u.down) {
        const bw = Math.min(44, Math.max(26, Math.floor(p.w * 0.6))), bx = p.x - Math.floor(bw / 2), by = FOE_FEET + 4;
        ctx.fillStyle = "#1a1016"; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
        ctx.fillStyle = "#3a2531"; ctx.fillRect(bx, by, bw, 3);
        ctx.fillStyle = "#e0604a"; ctx.fillRect(bx, by, Math.ceil(bw * u.hp / u.max), 3);
      }
    }
    // 仲間（後ろ姿）。奥（上）から描く
    for (const u of [...st.party].sort((a, b) => heroPos(a).y - heroPos(b).y)) {
      const p = heroPos(u), img = IM[u.img], f = fx[u.id] || {};
      let oy = 0, ox = 0, col = 1;
      if (f.hop > t) { oy = -Math.round(Math.sin(Math.min(1, (f.hop - t) / 260) * Math.PI) * 7); col = Math.floor(t / 90) % 2 ? 0 : 2; }
      if (f.shake > t) ox = Math.round(Math.sin(t / 18) * 2);
      ctx.fillStyle = "#0007"; ctx.fillRect(p.x - 13, p.y - 2, 26, 3);
      ctx.save(); if (u.down) ctx.globalAlpha = 0.35;
      ctx.drawImage(img, col * SHEET.fw, 3 * SHEET.fh, SHEET.fw, SHEET.fh, p.x - 24 + ox, p.y - 60 + oy, SHEET.fw, SHEET.fh);
      ctx.restore();
    }
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
  if (u.side === 0) { const i = st.party.indexOf(u); x = cardX(i) + CARD.w / 2; y = CARD.y + 26; }
  else { const p = foePos(u); x = p.x; y = FOE_FEET - p.h - 14; }
  const e = div("note", text); e.style.left = d(x); e.style.top = d(y); e.style.fontSize = d(8.4);
  e.style.animationDuration = (1.1 / Math.sqrt(speed)) + "s";
  hud.appendChild(e); setTimeout(() => e.remove(), 1200);
}
function where(u) {
  if (u.side === 1) { const p = foePos(u); return { x: p.x, y: FOE_FEET - p.h * 0.55 }; }
  const i = st.party.indexOf(u); return { x: cardX(i) + CARD.w / 2, y: CARD.y + 20 };
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
  refresh();
  for (const e of evs) {
    if (e.t === "act") {
      const chain = e.chain && e.chain.length >= 2;
      els.banner.className = "px frame" + (e.sk ? " act" : "") + (chain ? " chain" : "");
      els.banner.innerHTML = chain ? `<span class="k" style="font-size:${d(7.5)}">${e.chain.length}連携</span><span>${e.chain.join("・")}</span>`
        : `<span class="k" style="font-size:${d(7.5)}">${e.sk ? "技" : "通常"}</span><span>${e.nm}</span>`;
      els.banner.classList.add("on");
      const a = byId(e.u);
      if (a.side === 0) { fx[a.id] = { ...(fx[a.id] || {}), hop: now() + 260 / speed }; if (e.sk) { setFace(a, true); poseUntil[a.id] = now() + 900 / speed; } }
      else fx[a.id] = { ...(fx[a.id] || {}), lunge: now() + 200 / speed };
      refresh(); await wait(e.sk ? 420 : 240);
    } else if (e.t === "hit") {
      const t = byId(e.d), p = where(t);
      fx[t.id] = { ...(fx[t.id] || {}), flash: now() + 120 / speed, shake: now() + 220 / speed };
      num(p.x, p.y, String(e.v), (t.side === 0 ? "foe" : "") + (e.weak ? " weak" : e.resist ? " resist" : ""), e.weak ? 21 : 18);
      if (e.weak && t.side === 1) note(t, "弱点");
      refresh(); await wait(170);
    } else if (e.t === "passive") { note(byId(e.u), e.nm + (e.v ? " " + e.v : "")); refresh(); await wait(140); }
    else if (e.t === "status") { note(byId(e.d), e.nm); refresh(); await wait(200); }
    else if (e.t === "heal" || e.t === "revive") { const t = byId(e.d), p = where(t); num(p.x, p.y, (e.t === "revive" ? "復活 " : "") + e.v, "heal", 15); refresh(); await wait(80); }
    else if (e.t === "dot") { const t = byId(e.d), p = where(t); num(p.x, p.y, String(e.v), "poison", 15); note(t, e.nm); refresh(); await wait(240); }
    else if (e.t === "skip") { note(byId(e.u), e.nm + "で動けない"); refresh(); await wait(400); }
    else if (e.t === "lp") { note(byId(e.d), "LP " + e.lp); refresh(); await wait(160); }
    else if (e.t === "down") { const t = byId(e.d); fx[t.id] = { ...(fx[t.id] || {}), fade: now() + 500 / speed }; if (t.side === 0) note(t, "LP " + e.lp); refresh(); await wait(220); }
    else if (e.t === "turn") { els.banner.className = "px frame on"; els.banner.innerHTML = `<span>${e.n}ターン目</span>`; await wait(300); }
  }
  await wait(200);
  els.banner.classList.remove("on");
  for (const id in poseUntil) if (poseUntil[id] < now() + 50) { setFace(byId(id), false); delete poseUntil[id]; }
  actor = null; busy = false; refresh();
  if (st.over) { ended = true; setTimeout(result, 600 / speed); return; }
  if (st.phase === "run") setTimeout(turn, 100 / speed);
  else if (auto !== "off") setTimeout(go, 250 / speed); // オート中は次のターンもそのまま
  else { cmdIdx = 0; refresh(); }
}

// ---------- 始めと終わり ----------
function start(w) {
  wave = w; st = BT.newBattle(w, (Date.now() & 0xffff) + 1, LO); last = st.log.length; busy = false; ended = false; fx = {}; poseUntil = {}; actor = null; cmdIdx = 0;
  scene = SCENES[w](); layoutFoes(); buildHud();
  if (auto !== "off") setTimeout(go, 600);
}
function result() {
  const v = div("veil", "");
  const win = st.over === "win";
  v.appendChild(div("big", win ? "勝利" : st.over === "time" ? "引き分け" : "全滅…"));
  const fell = st.party.filter(u => u.downAt).map(u => `${u.nm} ${u.downAt}ターン目`).join("　");
  v.appendChild(div("sub", `${st.turn}ターンで決着` + (fell ? `<br>倒れた仲間　${fell}` : "　倒れた仲間なし")));
  const max = Math.max(...st.party.map(u => u.dealt), 1);
  st.party.slice().sort((a, b) => b.dealt - a.dealt).forEach(u => {
    const r = div("rank", ""); r.appendChild(faceOf(u, 32));
    r.appendChild(div("", u.nm)); r.appendChild(div("bar2", `<i style="width:${u.dealt / max * 100}%"></i>`)); r.appendChild(div("v", u.dealt)); v.appendChild(r);
  });
  const again = div("frame btn pick", "もう一度"); again.onclick = () => start(wave); v.appendChild(again);
  const next = div("frame btn pick", "戻る"); next.onclick = menu; v.appendChild(next);
  hud.appendChild(v);
}
// 戦う前：陣形と並び、戦う場所
let sel = -1;
function menu() {
  hud.innerHTML = "";
  const v = div("veil solid", ""); hud.appendChild(v);
  const A = (el, x, y, w, h) => { px(el, x, y, w, h); el.style.position = "absolute"; v.appendChild(el); return el; };
  const T = (x, y, w, h, html, size, cls) => { const e = A(div("t " + (cls || ""), html), x, y, w, h); e.style.fontSize = d(size); e.style.lineHeight = d(h); return e; };
  T(17, 50, 267, 16, "陣形", 9, "dim");
  Object.entries(BT.FORMATIONS).forEach(([k, f], i) => {
    const b = A(div("frame btn chip" + (LO.form === k ? " sel" : ""), f.nm), 17 + i * 90, 68, 87, 24); b.style.fontSize = d(10.5);
    b.onclick = () => { LO.form = k; saveLo(); menu(); };
  });
  T(17, 96, 267, 14, BT.FORMATIONS[LO.form].ds, 8, "dim2");
  // 陣形の図：場所に顔。押した2人の場所が入れ替わる
  const box = A(div("frame", ""), 17, 114, 267, 134);
  const f = BT.FORMATIONS[LO.form];
  f.pos.forEach(([x, y], slot) => {
    const hi = LO.pos[slot], h = BT.HEROES[hi];
    const cx = 17 + x * 267 / W, cy = 140 + (y - 326) * 0.93; // 枠の中に収める
    const t = A(div("frame tile" + (sel === slot ? " sel" : ""), ""), cx - 26, cy - 25, 52, 52);
    const fc = spriteBox(IM[h.img], FACE[0], FACE[1], FACE[2], FACE[3], 32 * K); fc.style.position = "absolute"; fc.style.left = "50%"; fc.style.top = d(2); fc.style.transform = "translateX(-50%)"; t.appendChild(fc);
    const hate = f.slots[slot].h;
    const tag = div("hate", hate >= 2 ? "狙われやすい" : hate < 1 ? "狙われにくい" : ""); tag.style.fontSize = d(6.5); t.appendChild(tag);
    t.onclick = () => { if (sel < 0) { sel = slot; menu(); return; } const a = LO.pos[sel]; LO.pos[sel] = LO.pos[slot]; LO.pos[slot] = a; sel = -1; saveLo(); menu(); };
  });
  T(17, 254, 267, 16, "戦う場所", 9, "dim");
  BT.WAVES.forEach((w, i) => {
    const b = A(div("frame btn pick2", ""), 17, 272 + i * 46, 267, 40);
    b.innerHTML = `<div class="pn" style="font-size:${d(11.5)}">${w.nm}</div><div class="ps" style="font-size:${d(8)}">${w.foes.map(k => BT.FOES[k].nm).filter((n, j, a) => a.indexOf(n) === j).join("・")}</div>`;
    b.onclick = () => { sel = -1; start(i); };
  });
}

addEventListener("resize", fit);
Promise.all([...new Set([...BT.HEROES.map(h => h.img), ...Object.values(BT.FOES).map(f => f.img)])].map(load)).then(() => {
  fit(); scene = SCENES[0](); requestAnimationFrame(draw); menu();
});
})();
