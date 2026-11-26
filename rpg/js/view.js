// 戦闘の画面（ロマサガRS型・横向き）。敵は左、仲間は右に陣形の形で並ぶ。
// コマンドの時：下に選んでいる人の札（名前・HP・LP・BP）と、通常攻撃と技の一覧。押すと決まり、次の人へ。敵を押すと全員の狙いがその敵に。
// 一番下：戻る・AUTO（左の丸で通常/全力を切り替え、文字を押すと開始・停止）・補助/防御・Repeat。オート中は早送り。
// 見せ方：物理攻撃は少し左前に出て5段目の真ん中の構え、術は5段目の左の技ポーズ、倒れた人は5段目の右。
(() => {
"use strict";
const W = 301, H = 655;
const DPR = window.devicePixelRatio || 2;
const stage = document.getElementById("stage"), cv = document.getElementById("field"), ctx = cv.getContext("2d"), hud = document.getElementById("hud");
ctx.imageSmoothingEnabled = false;
let K = 2;

// ---------- 位置（ドット） ----------
// 画面の点は2倍に細かい（canvasは602×1310）。素材の絵は元の大きさのまま置くので、配置の数字（ドット）では半分の大きさになる
const Q = 0.5;
const FOE_X = [128, 94, 60], FOE_Y = [212, 262, 312];             // 敵：列0がこちら寄り
const HERO_X = [194, 226, 258], HERO_Y = [196, 229, 262, 295, 328]; // 仲間：列0が敵寄り。段の間は絵の高さ（30）より広い
const BIG = { x: 86, y: 316 };
const PANEL = { y: 398 };
const BAR = { y: 604, h: 22 };
const SHEET = { fw: 48, fh: 60 };
const FACE = [58, 4, 28, 30];
const EL = { 斬: "#9aa0b4", 打: "#b8925a", 突: "#5f8fb0", 熱: "#d8573a", 冷: "#4a8ad8", 雷: "#c9a42a", 陽: "#d8b84a", 陰: "#7a5ab0" };

const IM = {};
function load(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = "img/" + src + ".png"; IM[src] = i; }); }

const LO_KEY = "rpgRS2";
let LO = (() => { try { const v = JSON.parse(localStorage.getItem(LO_KEY)); if (v && BT.FORMATIONS[v.form] && v.pos && v.pos.length === 5) return v; } catch (e) {} return BT.defLo(); })();
function saveLo() { try { localStorage.setItem(LO_KEY, JSON.stringify(LO)); } catch (e) {} }

let st = null, wave = 0, fast = false, autoMode = "normal", autoOn = false, support = true;
let last = 0, busy = false, pose = {}, fx = {}, scene = null, ended = false, cmdIdx = 0;
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
const icon = (a, size) => `<b class="at" style="background:${EL[a]};width:${d(size)};height:${d(size)};line-height:${d(size)};font-size:${d(size * 0.72)}">${a}</b>`;

// ---------- 位置 ----------
function heroPos(u) { return { x: HERO_X[u.c], y: HERO_Y[u.r] }; }
function foeBox(u) {
  const img = IM[u.img];
  const w = img.naturalWidth * Q, h = img.naturalHeight * Q;
  if (u.big) return { x: BIG.x, y: BIG.y, w, h, left: Math.round(BIG.x - w / 2), top: BIG.y - h };
  const x = FOE_X[u.c], y = FOE_Y[u.r];
  return { x, y, w, h, left: Math.round(x - w / 2), top: y - h };
}
function where(u) {
  if (u.side === 1) { const b = foeBox(u); return { x: b.x, y: b.top + b.h * 0.45 }; }
  const p = heroPos(u); return { x: p.x, y: p.y - 20 };
}
function byId(id) { return [...st.party, ...st.foes].find(u => u.id === id); }

// ---------- 上下の飾り（DOM） ----------
let els = {};
function buildHud() {
  hud.innerHTML = ""; els = {};
  els.top = px(div("px topbar", ""), 0, 44, W, 16); hud.appendChild(els.top);
  els.info = px(div("px info", ""), 0, 62, W, 32); hud.appendChild(els.info);
  els.banner = px(div("px skillname", ""), 40, 98, 221, 18); els.banner.style.fontSize = d(11); hud.appendChild(els.banner);
  els.foeHit = {};
  st.foes.forEach(u => {
    const b = foeBox(u);
    const hit = px(div("px foehit", ""), b.left - 6, b.top - 8, b.w + 12, b.h + 16); // 小さくなったぶん、押せる範囲は広めに
    hit.onclick = () => { if (u.down || ended) return; st.focus = u.id; refresh(); };
    hud.appendChild(hit); els.foeHit[u.id] = hit;
  });
  els.aim = div("aim", "▼"); hud.appendChild(els.aim);
  els.panel = px(div("px panel", ""), 0, PANEL.y, W, BAR.y - PANEL.y - 4); hud.appendChild(els.panel);
  els.bar = px(div("px bottombar", ""), 0, BAR.y, W, BAR.h); hud.appendChild(els.bar);
  refresh();
}
function commanding() { return st.phase === "command" && !autoOn && !busy && !ended; }

function refresh() {
  els.top.innerHTML = `<span>ラウンド <b>1/1</b></span><span>ターン <b>${st.turn}</b></span><span>行動 <b>${st.actions}</b></span>`;
  els.top.style.fontSize = d(8.5);
  // 狙っている敵の名前・体力・耐性（▲効く ▼効きにくい）
  const f = st.foes.find(x => x.id === st.focus && !x.down) || BT.alive(st.foes)[0];
  if (f) {
    const res = BT.ATTR.map(a => { const r = f.res[a] || 0; return `<span class="ri">${icon(a, 13)}<i class="${r < 0 ? "up" : r > 0 ? "dn" : ""}" style="font-size:${d(7)}">${r < 0 ? "▲" : r > 0 ? "▼" : ""}</i></span>`; }).join("");
    els.info.innerHTML = `<div class="nm" style="font-size:${d(11)};left:${d(12)};top:${d(1)}">${f.boss ? `<em style="font-size:${d(8)}">BOSS</em>` : ""}${f.nm}</div>` +
      `<div class="hpb" style="left:${d(12)};top:${d(17)};width:${d(118)};height:${d(5)}"><i style="width:${f.hp / f.max * 100}%"></i></div>` +
      `<div class="res" style="left:${d(140)};top:${d(1)}">${res}</div>`;
  } else els.info.innerHTML = "";
  const ff = st.foes.find(x => x.id === st.focus && !x.down);
  els.aim.style.display = ff && !ended ? "block" : "none";
  if (ff) { const b = foeBox(ff); els.aim.style.left = d(b.x); els.aim.style.top = d(b.top - 12); els.aim.style.fontSize = d(10); }
  for (const u of st.foes) els.foeHit[u.id].style.pointerEvents = u.down ? "none" : "auto";
  const cmdOn = commanding();
  if (cmdOn) { const al = aliveIdx(); if (!al.includes(cmdIdx)) cmdIdx = al[0]; }
  els.panel.innerHTML = ""; els.panel.style.display = cmdOn ? "block" : "none";
  if (cmdOn) buildPanel(st.party[cmdIdx]);
  buildBar(cmdOn);
}
function buildPanel(u) {
  const P = els.panel, A = (cls, html, x, y, w, h) => { const e = px(div("px " + cls, html), x, y, w, h); P.appendChild(e); return e; };
  const card = A("frame pcard", "", 12, 0, 277, 42);
  const nm = div("pn", u.nm); nm.style.fontSize = d(13); nm.style.left = d(12); nm.style.top = d(5); card.appendChild(nm);
  const sub = div("ps", `${BT.WTYPE[u.wt].nm}${u.heart ? "・" + BT.HEARTS[u.heart].nm : ""}`); sub.style.fontSize = d(8); sub.style.left = d(12); sub.style.top = d(25); card.appendChild(sub);
  const fc = spriteBox(IM[u.img], FACE[0], FACE[1], FACE[2], FACE[3], 40 * K); fc.style.position = "absolute"; fc.style.right = d(8); fc.style.top = d(1); card.appendChild(fc);
  const dots = div("pdots", st.party.map((p, i) => `<i class="${i === cmdIdx ? "on" : st.cmd[p.id] ? "done" : ""}${p.down ? " ko" : ""}"></i>`).join("")); dots.style.left = d(120); dots.style.top = d(17); card.appendChild(dots);
  [["HP", `${u.hp}<small>/${u.max}</small>`], ["LP", `${u.lp}<small>/${BT.HEROES.find(h => h.id === u.id).lp}</small>`], ["BP", `${u.bp}<small>/${BT.BP_MAX}</small>`]].forEach(([k, v], i) => {
    const b = A("frame pst", `<span class="k">${k}</span><span class="v">${v}</span>`, 12 + i * 94, 46, 89, 18); b.style.fontSize = d(9.5);
  });
  const keys = ["attack", ...u.sk];
  const listBox = A("frame plist", "", 12, 68, 277, 132);
  keys.forEach((k, j) => {
    const s = BT.SKILLS[k], ok = s.bp <= u.bp, at = s.at || (s.kind === "攻撃" ? BT.WTYPE[u.wt].at : []);
    const row = div("srow" + (ok ? "" : " dim") + (st.cmd[u.id] === k ? " sel" : "") + (u.heart && j === keys.length - 1 ? " heart" : ""), "");
    px(row, 4, 3 + j * 25.6, 269, 24.6);
    row.innerHTML = `<span class="ic" style="left:${d(4)};width:${d(26)}">${at.map(a => icon(a, 11)).join("")}</span>` +
      `<span class="sn" style="left:${d(34)};font-size:${d(11)}">${s.nm}</span>` +
      `<span class="rg" style="left:${d(150)};font-size:${d(7.5)}">${BT.RANGE_NM[s.tg]}${s.kind && s.kind !== "攻撃" ? "・" + s.kind : ""}</span>` +
      `<span class="bp" style="right:${d(8)};font-size:${d(10)}">${s.bp ? "BP " + s.bp : ""}</span>`;
    if (ok) row.onclick = () => pick(k);
    listBox.appendChild(row);
  });
}
function buildBar(cmdOn) {
  const B = els.bar; B.innerHTML = "";
  const btn = (html, x, w, fn, cls) => { const b = px(div("px frame bbtn " + (cls || ""), html), x, 0, w, BAR.h); b.style.fontSize = d(9.5); if (fn) b.onclick = fn; B.appendChild(b); return b; };
  // 横の並び（12〜289）：戻る34・AUTO104・補助/防御76・Repeat51（オート中は AUTO142・補助/防御76・早送り51）
  if (!autoOn) btn("↩", 12, 34, cmdOn && cmdIdx > aliveIdx()[0] ? back : null, cmdOn && cmdIdx > aliveIdx()[0] ? "" : "dim").style.fontSize = d(13);
  const ab = btn("", autoOn ? 12 : 50, autoOn ? 142 : 104, null, "auto" + (autoOn ? " lit" : ""));
  const sw = div("sw", "⟳"); sw.style.width = sw.style.height = d(16); sw.style.fontSize = d(10);
  sw.onclick = e => { e.stopPropagation(); autoMode = autoMode === "normal" ? "full" : "normal"; refresh(); };
  const lb = div("lb", autoMode === "normal" ? "通常AUTO" : "全力AUTO");
  ab.appendChild(sw); ab.appendChild(lb);
  ab.onclick = () => { if (ended) return; autoOn = !autoOn; refresh(); if (autoOn && st.phase === "command" && !busy) go(); };
  btn(`補助/防御 <b>${support ? "ON" : "OFF"}</b>`, 158, 76, () => { support = !support; refresh(); }, "two");
  const canRep = cmdOn && Object.keys(st.lastCmd).length;
  if (!autoOn) btn("Repeat", 238, 51, canRep ? repeat : null, "rep" + (canRep ? "" : " dim"));
  else btn(fast ? "▶▶▶" : "▶▶", 238, 51, () => { fast = !fast; refresh(); }, "ff" + (fast ? " lit" : ""));
}
function aliveIdx() { return st.party.map((p, i) => i).filter(i => !st.party[i].down); }
function pick(key) {
  const u = st.party[cmdIdx]; st.cmd[u.id] = key;
  const next = aliveIdx().find(i => i > cmdIdx);
  if (next === undefined) { go(); return; }
  cmdIdx = next; refresh();
}
function back() { const prev = aliveIdx().filter(i => i < cmdIdx).pop(); if (prev !== undefined) { cmdIdx = prev; refresh(); } }
function repeat() { for (const u of BT.alive(st.party)) { const k = st.lastCmd[u.id]; st.cmd[u.id] = k && BT.SKILLS[k].bp <= u.bp ? k : "attack"; } go(); }
function go() {
  if (st.phase !== "command" || busy || ended) return;
  BT.commit(st, autoOn ? autoMode : null, support);
  cmdIdx = 0; refresh();
  setTimeout(turn, 120 / spd());
}

// ---------- 描く ----------
const WHITE = new Map();
function white(img) {
  if (WHITE.has(img)) return WHITE.get(img);
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  WHITE.set(img, c); return c;
}
function hpBar(x, y, w, ratio) {
  ctx.fillStyle = "#120c10"; ctx.fillRect(x - 0.5, y - 0.5, w + 1, 3);
  ctx.fillStyle = "#3a2531"; ctx.fillRect(x, y, w, 2);
  ctx.fillStyle = ratio < 0.25 ? "#e0604a" : "#5fc26a"; ctx.fillRect(x, y, Math.ceil(w * ratio * 2) / 2, 2);
}
function draw(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (scene) ctx.drawImage(scene, 0, 0);
  ctx.setTransform(2, 0, 0, 2, 0, 0); // ここから先はドットの座標で描く
  if (st) {
    ctx.fillStyle = "#000a"; ctx.fillRect(0, 44, W, 52); // 上の帯の下地
    for (const u of st.foes) { // 敵（右向きにして描く）
      const b = foeBox(u), img = IM[u.img], f = fx[u.id] || {};
      if (u.down && !(f.fade > t)) continue;
      let ox = 0;
      if (f.shake > t) ox = Math.round(Math.sin(t / 18) * 2);
      if (f.lunge > t) ox += 4;
      ctx.save();
      if (u.down) ctx.globalAlpha = Math.max(0, (f.fade - t) / 500);
      ctx.fillStyle = "#0006"; ctx.fillRect(b.x - Math.floor(b.w * 0.35), b.y - 1, Math.floor(b.w * 0.7), 1.5);
      ctx.translate(Math.round(b.left + ox + b.w), Math.round(b.top)); ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, b.w, b.h);
      if (f.flash > t) { ctx.globalAlpha = 0.7; ctx.drawImage(white(img), 0, 0, b.w, b.h); }
      ctx.restore();
      if (!u.down) { const bw = Math.min(30, Math.max(16, Math.floor(b.w * 0.7))); hpBar(b.x - Math.floor(bw / 2), b.y + 2, bw, u.hp / u.max); }
    }
    for (const u of [...st.party].sort((a, b) => heroPos(a).y - heroPos(b).y)) { // 仲間（左向き）。奥から描く
      const p = heroPos(u), img = IM[u.img], f = fx[u.id] || {}, ps = pose[u.id];
      let col = 1, row = 1, ox = 0;
      if (u.down) { col = 2; row = 4; }
      else if (ps && ps.until > t) { row = 4; col = ps.kind === "magic" ? 0 : 1; if (ps.kind === "phys") ox = -6; }
      if (f.shake > t) ox += Math.round(Math.sin(t / 18) * 2);
      const fw = SHEET.fw * Q, fh = SHEET.fh * Q;
      ctx.fillStyle = "#0007"; ctx.fillRect(p.x - 6, p.y - 1, 12, 1.5);
      ctx.save(); if (u.down) ctx.globalAlpha = 0.8;
      ctx.drawImage(img, col * SHEET.fw, row * SHEET.fh, SHEET.fw, SHEET.fh, p.x - fw / 2 + ox, p.y - fh, fw, fh);
      if (f.flash > t) { ctx.globalAlpha = 0.6; ctx.drawImage(whiteCell(img, col, row), p.x - fw / 2 + ox, p.y - fh, fw, fh); }
      ctx.restore();
      hpBar(p.x - 8, p.y + 2, 16, u.hp / u.max);
    }
  }
  requestAnimationFrame(draw);
}
const WCELL = new Map();
function whiteCell(img, col, row) {
  const k = img.src + col + "," + row; if (WCELL.has(k)) return WCELL.get(k);
  const c = document.createElement("canvas"); c.width = SHEET.fw; c.height = SHEET.fh;
  const x = c.getContext("2d"); x.drawImage(img, col * SHEET.fw, row * SHEET.fh, SHEET.fw, SHEET.fh, 0, 0, SHEET.fw, SHEET.fh);
  x.globalCompositeOperation = "source-in"; x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
  WCELL.set(k, c); return c;
}

// ---------- 数字と知らせ ----------
const spd = () => fast ? 2.5 : 1;
function num(x, y, text, cls, size) {
  const e = div("num " + (cls || ""), text); e.style.left = d(x); e.style.top = d(y); e.style.fontSize = d(size || 12);
  e.style.animationDuration = (0.9 / Math.sqrt(spd())) + "s";
  hud.appendChild(e); setTimeout(() => e.remove(), 1000);
}
function note(u, text) {
  const p = where(u);
  const e = div("note", text); e.style.left = d(p.x); e.style.top = d(p.y - 26); e.style.fontSize = d(8);
  e.style.animationDuration = (1.1 / Math.sqrt(spd())) + "s";
  hud.appendChild(e); setTimeout(() => e.remove(), 1200);
}

// ---------- 進める ----------
const wait = ms => new Promise(r => setTimeout(r, ms / spd()));
async function turn() {
  if (busy || ended) return;
  busy = true;
  BT.step(st);
  const evs = st.log.slice(last); last = st.log.length;
  const now = () => performance.now();
  refresh();
  for (const e of evs) {
    if (e.t === "act") {
      const a = byId(e.u);
      els.banner.innerHTML = e.sk ? e.nm : ""; els.banner.classList.toggle("on", !!e.sk);
      if (a.side === 0) pose[a.id] = { kind: e.magic || e.kind === "回復" || e.kind === "防御" ? "magic" : "phys", until: now() + 650 / spd() };
      else fx[a.id] = { ...(fx[a.id] || {}), lunge: now() + 220 / spd() };
      await wait(e.sk ? 360 : 220);
    } else if (e.t === "hit") {
      const t = byId(e.d), p = where(t);
      fx[t.id] = { ...(fx[t.id] || {}), flash: now() + 110 / spd(), shake: now() + 220 / spd() };
      num(p.x, p.y, String(e.v), (t.side === 0 ? "foe" : "") + (e.weak ? " weak" : e.resist ? " resist" : ""), e.weak ? 19 : 16);
      refresh(); await wait(140);
    } else if (e.t === "passive") { note(byId(e.u), e.nm + (e.v ? " " + e.v : "")); await wait(120); }
    else if (e.t === "status") { note(byId(e.d), e.nm); refresh(); await wait(160); }
    else if (e.t === "heal" || e.t === "revive") { const t = byId(e.d), p = where(t); num(p.x, p.y, (e.t === "revive" ? "復活 " : "") + e.v, "heal", 14); refresh(); await wait(60); }
    else if (e.t === "dot") { const t = byId(e.d), p = where(t); num(p.x, p.y, String(e.v), "poison", 14); refresh(); await wait(200); }
    else if (e.t === "skip") { note(byId(e.u), e.nm + "で動けない"); await wait(360); }
    else if (e.t === "lp") { note(byId(e.d), "LP " + e.lp); refresh(); await wait(140); }
    else if (e.t === "down") { const t = byId(e.d); fx[t.id] = { ...(fx[t.id] || {}), fade: now() + 500 / spd() }; if (t.side === 0) note(t, "LP " + e.lp); refresh(); await wait(200); }
  }
  await wait(160);
  els.banner.classList.remove("on");
  busy = false; refresh();
  if (st.over) { ended = true; refresh(); setTimeout(result, 600 / spd()); return; }
  if (st.phase === "run") setTimeout(turn, 80 / spd());
  else if (autoOn) setTimeout(go, 200 / spd());
  else { cmdIdx = aliveIdx()[0]; refresh(); }
}

// ---------- 始めと終わり ----------
function start(w) {
  wave = w; st = BT.newBattle(w, (Date.now() & 0xffff) + 1, LO); last = st.log.length; busy = false; ended = false; fx = {}; pose = {}; cmdIdx = 0;
  scene = SCENES[w](); buildHud();
  if (autoOn) setTimeout(go, 600);
}
function result() {
  const v = div("veil", "");
  v.appendChild(div("big", st.over === "win" ? "勝利" : st.over === "time" ? "引き分け" : "全滅…"));
  const fell = st.party.filter(u => u.downAt).map(u => `${u.nm} ${u.downAt}ターン目`).join("　");
  v.appendChild(div("sub", `${st.turn}ターンで決着` + (fell ? `<br>倒れた仲間　${fell}` : "　倒れた仲間なし")));
  const max = Math.max(...st.party.map(u => u.dealt), 1);
  st.party.slice().sort((a, b) => b.dealt - a.dealt).forEach(u => {
    const r = div("rank", ""); r.appendChild(spriteBox(IM[u.img], FACE[0], FACE[1], FACE[2], FACE[3], 30));
    r.appendChild(div("", u.nm)); r.appendChild(div("bar2", `<i style="width:${u.dealt / max * 100}%"></i>`)); r.appendChild(div("v", u.dealt)); v.appendChild(r);
  });
  const again = div("frame btn pick", "もう一度"); again.onclick = () => start(wave); v.appendChild(again);
  const next = div("frame btn pick", "戻る"); next.onclick = menu; v.appendChild(next);
  hud.appendChild(v);
}
// 戦う前：陣形と並び、戦う場所
let sel = -1;
function menu() {
  hud.innerHTML = ""; st = null;
  const v = div("veil solid", ""); hud.appendChild(v);
  const A = (el, x, y, w, h) => { px(el, x, y, w, h); el.style.position = "absolute"; v.appendChild(el); return el; };
  const T = (x, y, w, h, html, size, cls) => { const e = A(div("t " + (cls || ""), html), x, y, w, h); e.style.fontSize = d(size); e.style.lineHeight = d(h); return e; };
  T(17, 50, 267, 16, "陣形", 9, "dim");
  Object.entries(BT.FORMATIONS).forEach(([k, f], i) => {
    const b = A(div("frame btn chip" + (LO.form === k ? " sel" : ""), f.nm), 17 + i * 90, 68, 87, 24); b.style.fontSize = d(10.5);
    b.onclick = () => { LO.form = k; saveLo(); menu(); };
  });
  const F = BT.FORMATIONS[LO.form];
  T(17, 96, 267, 14, F.ds, 8, "dim2");
  A(div("frame", ""), 17, 114, 267, 232);
  T(26, 120, 60, 14, "← 敵", 8, "dim");
  F.slots.forEach((sl, slot) => {
    const h = BT.HEROES[LO.pos[slot]];
    const cx = 52 + sl.c * 76, cy = 140 + sl.r * 41;
    const t = A(div("frame tile" + (sel === slot ? " sel" : ""), ""), cx, cy, 80, 38); // 「狙われやすい」まで1行で入る幅
    const fc = spriteBox(IM[h.img], FACE[0], FACE[1], FACE[2], FACE[3], 26 * K); fc.style.position = "absolute"; fc.style.left = d(2); fc.style.top = d(3); t.appendChild(fc);
    const tx = div("tn", `${h.nm}<br><i>${sl.h >= 2 ? "狙われやすい" : sl.h < 1 ? "狙われにくい" : ""}</i>`); tx.style.fontSize = d(7.5); tx.style.left = d(24); tx.style.top = d(6); t.appendChild(tx);
    t.onclick = () => { if (sel < 0) { sel = slot; menu(); return; } const a = LO.pos[sel]; LO.pos[sel] = LO.pos[slot]; LO.pos[slot] = a; sel = -1; saveLo(); menu(); };
  });
  T(17, 352, 267, 16, "戦う場所", 9, "dim");
  BT.WAVES.forEach((w, i) => {
    const b = A(div("frame btn pick2", ""), 17, 370 + i * 46, 267, 40);
    const names = [...new Set(w.foes.map(f => BT.FOES[f.k].nm))].join("・");
    b.innerHTML = `<div class="pn" style="font-size:${d(11.5)}">${w.nm}</div><div class="ps" style="font-size:${d(8)}">${names}</div>`;
    b.onclick = () => { sel = -1; start(i); };
  });
}

addEventListener("resize", fit);
Promise.all([...new Set([...BT.HEROES.map(h => h.img), ...Object.values(BT.FOES).map(f => f.img)])].map(load)).then(() => {
  fit(); scene = SCENES[0](); requestAnimationFrame(draw); menu();
});
})();
