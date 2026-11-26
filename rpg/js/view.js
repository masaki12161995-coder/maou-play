// 戦闘の画面（ロマサガRS型・横向き）。敵は左、仲間は右に陣形の形で並ぶ。
// コマンドの時：下に選んでいる人の札（名前・HP・LP・BP）と、通常攻撃と技の一覧。押すと決まり、次の人へ。敵を押すと全員の狙いがその敵に。
// 一番下：戻る・AUTO（左の丸で通常/全力を切り替え、文字を押すと開始・停止）・補助/防御・Repeat。オート中は早送り。
// 見せ方：物理攻撃は少し左前に出て5段目の真ん中の構え、術は5段目の左の技ポーズ、倒れた人は5段目の右。
(() => {
"use strict";
const { W, H, DPR, stage, hud } = DM;
const cv = document.getElementById("field"), ctx = cv.getContext("2d");
ctx.imageSmoothingEnabled = false;

// ---------- 位置（ドット） ----------
// canvasは端末の点の細かさ（1204×2620、配置の1ドット＝4点）で持つ。
// 人物は素材の1ドット＝2点（Q）、モンスターは全員そろえて1ドット＝3点（QM）。素材バンクの決まり：人物は整数倍、モンスターは全員同じ倍率
const Q = 0.5, QM = 0.75;
// 敵は3列×3段、仲間は3列×5段（決まりが別）。真ん中の段の高さ（中心線）だけそろえる
const FOE_X = [132, 90, 48], FOE_Y = [222, 284, 346];             // 敵：列0がこちら寄り。段の間62は「ふつう」の魔物（高さ50）を1.5倍にしても入る
const HERO_X = [204, 234, 264], HERO_Y = [214, 249, 284, 319, 354]; // 仲間：列0が敵寄り。段の間35＝絵の高さ30＋足元の体力ゲージ4.5が、下の段の頭と重ならない幅
const MID_Y = 284; // 中心線：敵の段1と仲間の段2
let DEV_ERR = [];
const DEV = /[?&]dev=1/.test(location.search); // 開発用：マスの線を出す（ふだんの画面には出さない）
const BIG = { x: 90 }; // 大きい敵はマス全体を使うので、体の真ん中を中心線に合わせる
const SCENE_UP = 100; // 背景を上にずらす量（ドット）
const PANEL = { y: 398 };
const BAR = { y: 604, h: 22 };
const SHEET = { fw: 48, fh: 60 };
const FACE = [58, 4, 28, 30];
const EL = { 斬: "#9aa0b4", 打: "#b8925a", 突: "#5f8fb0", 熱: "#d8573a", 冷: "#4a8ad8", 雷: "#c9a42a", 陽: "#d8b84a", 陰: "#7a5ab0" };

const IM = window.IMG;

let st = null, fast = false, autoMode = "normal", autoOn = false, support = true, active = false, onEnd = null;
try { const a = JSON.parse(localStorage.getItem("rpgAuto") || "{}"); if (a.mode) autoMode = a.mode; autoOn = !!a.on; fast = !!a.fast; } catch (e) {}
const keepAuto = () => { try { localStorage.setItem("rpgAuto", JSON.stringify({ mode: autoMode, on: autoOn, fast })); } catch (e) {} };
let last = 0, busy = false, pose = {}, fx = {}, scene = null, ended = false, cmdIdx = 0;
const SCENES = { road: () => makeScene(), grass: () => dungeonScene("grass"), meadow: () => dungeonScene("meadow"), canopy: () => dungeonScene("canopy"), gold: () => dungeonScene("gold"), stone: () => dungeonScene("stone") };
const d = DM.d, px = DM.px, div = DM.div, spriteBox = DM.spriteBox, icon = DM.icon;
DM.onFit.push(() => { if (active && st && !ended) buildHud(); });

// ---------- 位置 ----------
function heroPos(u) { return { x: HERO_X[u.c], y: HERO_Y[u.r] }; }
function foeBox(u) {
  const img = IM[u.img];
  const w = img.naturalWidth * QM, h = img.naturalHeight * QM;
  if (u.big) { const y = Math.round((MID_Y + h / 2) * 4) / 4; return { x: BIG.x, y, w, h, left: Math.round((BIG.x - w / 2) * 4) / 4, top: y - h }; }
  const x = FOE_X[u.c], y = FOE_Y[u.r];
  return { x, y, w, h, left: Math.round((x - w / 2) * 4) / 4, top: y - h }; // 点の境目にそろえる
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
  els.banner = px(div("px skillname", ""), 0, 99, W, 24); els.banner.style.fontSize = d(11.5); hud.appendChild(els.banner);
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
  // 下の枠とボタンは、見た目が変わるときだけ作り直す（作り直しの最中に押すと、押したことが消えてしまうため）
  const u = st.party[cmdIdx];
  const pk = cmdOn ? [cmdIdx, u.hp, u.bp, u.lp, st.cmd[u.id] || "", st.party.map(p => (st.cmd[p.id] ? 1 : 0) + (p.down ? 2 : 0)).join("")].join("|") : "off";
  if (pk !== els.pk) { els.pk = pk; els.panel.innerHTML = ""; els.panel.style.display = cmdOn ? "block" : "none"; if (cmdOn) buildPanel(u); }
  const canRep = cmdOn && Object.keys(st.lastCmd).length > 0, canBack = cmdOn && cmdIdx > aliveIdx()[0];
  const bk = [cmdOn, autoOn, autoMode, support, fast, canRep, canBack, ended].join("|");
  if (bk !== els.bk) { els.bk = bk; buildBar(cmdOn); }
}
function buildPanel(u) {
  const P = els.panel, A = (cls, html, x, y, w, h) => { const e = px(div("px " + cls, html), x, y, w, h); P.appendChild(e); return e; };
  const card = A("frame pcard", "", 12, 0, 277, 42);
  const nm = div("pn", u.nm); nm.style.fontSize = d(13); nm.style.left = d(12); nm.style.top = d(5); card.appendChild(nm);
  const sub = div("ps", `${BT.WTYPE[u.wt].nm}${u.heart ? "・" + BT.HEARTS[u.heart].nm : ""}`); sub.style.fontSize = d(8); sub.style.left = d(12); sub.style.top = d(25); card.appendChild(sub);
  const fc = spriteBox(IM[u.img], FACE[0], FACE[1], FACE[2], FACE[3], 40 * DM.K); fc.style.position = "absolute"; fc.style.right = d(8); fc.style.top = d(1); card.appendChild(fc);
  const dots = div("pdots", st.party.map((p, i) => `<i class="${i === cmdIdx ? "on" : st.cmd[p.id] ? "done" : ""}${p.down ? " ko" : ""}"></i>`).join("")); dots.style.left = d(120); dots.style.top = d(17); card.appendChild(dots);
  [["HP", `${u.hp}<small>/${u.max}</small>`], ["LP", `${u.lp}<small>/${u.lp_max || BT.HEROES.find(h => h.id === u.id).lp}</small>`], ["BP", `${u.bp}<small>/${BT.BP_MAX}</small>`]].forEach(([k, v], i) => {
    const b = A("frame pst", `<span class="k">${k}</span><span class="v">${v}</span>`, 12 + i * 94, 46, 89, 18); b.style.fontSize = d(9.5);
  });
  const keys = ["attack", ...u.sk];
  const listBox = A("frame plist", "", 12, 68, 277, 132);
  keys.forEach((k, j) => {
    const s = BT.SKILLS[k], ok = s.bp <= u.bp, at = s.at || (s.kind === "攻撃" ? BT.WTYPE[u.wt].at : []);
    const row = div("srow" + (ok ? "" : " dim") + (st.cmd[u.id] === k ? " sel" : "") + (u.heart && j === keys.length - 1 ? " heart" : ""), "");
    px(row, 4, 3 + j * 25.6, 269, 24.6);
    const rank = s.kind === "攻撃" ? (s.rank && s.rank !== "N" ? s.rank : "—") : null;
    const dist = s.dist || (s.magic ? "遠" : "");
    row.innerHTML = `<span class="ic" style="left:${d(4)};width:${d(26)}">${at.map(a => icon(a, 11)).join("")}</span>` +
      `<span class="sn" style="left:${d(32)};font-size:${d(11)}">${s.nm}</span>` +
      (rank ? `<span class="rk" style="left:${d(128)};font-size:${d(8)}">威力<b style="font-size:${d(10)}">${rank}</b></span>` : `<span class="rk kind" style="left:${d(128)};font-size:${d(8.5)}">${s.kind}</span>`) +
      `<span class="rg" style="left:${d(168)};font-size:${d(8.5)}">${BT.RANGE_NM[s.tg]}</span>` +
      (dist ? `<span class="ds ${dist === "近" ? "near" : "far"}" style="left:${d(202)};font-size:${d(8)};width:${d(13)};height:${d(13)};line-height:${d(13)}">${dist}</span>` : "") +
      `<span class="bp" style="right:${d(6)};font-size:${d(10)}">${s.bp ? "BP" + s.bp : ""}</span>`;
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
  sw.onclick = e => { e.stopPropagation(); autoMode = autoMode === "normal" ? "full" : "normal"; keepAuto(); refresh(); };
  const lb = div("lb", autoMode === "normal" ? "通常AUTO" : "全力AUTO");
  ab.appendChild(sw); ab.appendChild(lb);
  ab.onclick = () => { if (ended) return; autoOn = !autoOn; keepAuto(); refresh(); if (autoOn && st.phase === "command" && !busy) go(); };
  btn(`補助/防御 <b>${support ? "ON" : "OFF"}</b>`, 158, 76, () => { support = !support; refresh(); }, "two");
  const canRep = cmdOn && Object.keys(st.lastCmd).length;
  if (!autoOn) btn("Repeat", 238, 51, canRep ? repeat : null, "rep" + (canRep ? "" : " dim"));
  else btn(fast ? "▶▶▶" : "▶▶", 238, 51, () => { fast = !fast; keepAuto(); refresh(); }, "ff" + (fast ? " lit" : ""));
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
  if (!active) { requestAnimationFrame(draw); return; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cv.width, cv.height);
  // 背景は上にずらし、地平線を一番上の人の足より上に持ってくる（空に浮いて見えないように）。空いた下は地面の帯をもう一度描く
  if (scene) { // 背景の1点＝canvasの2点
    const up = SCENE_UP * 2, strip = up + 2;
    ctx.drawImage(scene, 0, -up * 2, scene.width * 2, scene.height * 2);
    ctx.drawImage(scene, 0, scene.height - strip, scene.width, strip, 0, cv.height - strip * 2, scene.width * 2, strip * 2);
  }
  ctx.setTransform(4, 0, 0, 4, 0, 0); // ここから先はドットの座標で描く
  if (DEV && st) devGrid();
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
      ctx.translate(Math.round((b.left + ox + b.w) * 4) / 4, Math.round(b.top * 4) / 4); ctx.scale(-1, 1); // 点の境目にそろえて左右反転
      ctx.drawImage(img, 0, 0, b.w, b.h);
      if (f.flash > t) { ctx.globalAlpha = 0.7; ctx.drawImage(white(img), 0, 0, b.w, b.h); }
      ctx.restore();
      if (!u.down) { const bw = Math.min(30, Math.max(16, Math.floor(b.w * 0.7))); hpBar(b.x - Math.floor(bw / 2), b.y + 2, bw, u.hp / u.max); }
    }
    for (const u of [...st.party].sort((a, b) => heroPos(a).y - heroPos(b).y)) { // 仲間（左向き）。奥から描く
      const p = heroPos(u), img = IM[u.img], f = fx[u.id] || {}, ps = pose[u.id];
      let col = 1, row = 1, ox = 0;
      const sp = spin[u.id];
      if (u.down) { col = 2; row = 4; }
      else if (sp && t >= sp.t0 && t < sp.t1) { row = [1, 0, 2, 3, 1][Math.min(4, Math.floor((t - sp.t0) / (sp.t1 - sp.t0) * 5))]; }
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
// 開発用の点検：仲間3×5のどのマスの組み合わせ（どんな陣形）でも、絵と体力ゲージが重ならないか、陣形の決まりが正しいかを確かめる
function devCheck() {
  const err = [];
  const box = (c, r, step) => { // 絵（1ドット＝Q）の幅いっぱい・頭の上〜体力ゲージの下。物理攻撃のときは6ドット前（左）に出る
    const x = HERO_X[c] - (step ? 6 : 0), y = HERO_Y[r];
    return { l: x - SHEET.fw * Q / 2, r: x + SHEET.fw * Q / 2, t: y - SHEET.fh * Q, b: y + 4.5 };
  };
  const hit = (a, b) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
  const cells = []; for (let c = 0; c < 3; c++) for (let r = 0; r < 5; r++) cells.push([c, r]);
  for (const [c1, r1] of cells) for (const [c2, r2] of cells) { // 15マスのどの2マスでも（＝どの陣形でも）
    if (c1 === c2 && r1 === r2) continue;
    for (const s1 of [0, 1]) if (hit(box(c1, r1, s1), box(c2, r2, 0))) err.push(`仲${c1}-${r1}${s1 ? "(前に出た時)" : ""}と仲${c2}-${r2}が重なる`);
  }
  for (const [k, F] of Object.entries(BT.FORMATIONS)) {
    if (F.slots.length !== 5) err.push(`${F.nm}：5人分ない`);
    const seen = new Set();
    for (const sl of F.slots) {
      if (!(sl.c >= 0 && sl.c < 3 && sl.r >= 0 && sl.r < 5)) err.push(`${F.nm}：マスの外 ${sl.c}-${sl.r}`);
      if (seen.has(sl.c + "-" + sl.r)) err.push(`${F.nm}：同じマスに2人 ${sl.c}-${sl.r}`); seen.add(sl.c + "-" + sl.r);
    }
  }
  const top = Math.min(...HERO_Y) - SHEET.fh * Q, bottom = Math.max(...HERO_Y) + 4.5;
  if (top < 100) err.push("仲間の上の段が上の帯にかかる"); if (bottom > PANEL.y) err.push("仲間の下の段が下の枠にかかる");
  if (HERO_Y[2] !== MID_Y || FOE_Y[1] !== MID_Y) err.push("中心線がずれている");
  console[err.length ? "error" : "log"]("マス点検", err.length ? err : "OK");
  return err;
}
// 開発用のマス目：敵3×3と仲間3×5。足元が各マスの下辺の少し上に来る。黄色の点線が中心線
function devGrid() {
  ctx.save(); ctx.lineWidth = 0.25; ctx.font = "5px sans-serif";
  const cell = (cx, cy, w, h, color, label) => {
    ctx.strokeStyle = color; ctx.strokeRect(cx - w / 2, cy - h + 6, w, h);
    ctx.fillStyle = color; ctx.fillText(label, cx - w / 2 + 1, cy - h + 11);
  };
  for (let c = 0; c < 3; c++) {
    for (let r = 0; r < 3; r++) cell(FOE_X[c], FOE_Y[r], 42, 62, "#ff7a6a", `敵${c}-${r}`);
    for (let r = 0; r < 5; r++) cell(HERO_X[c], HERO_Y[r], 30, 35, "#6ad0ff", `仲${c}-${r}`);
  }
  ctx.strokeStyle = "#ffe08a"; ctx.setLineDash([1, 1]);
  ctx.beginPath(); ctx.moveTo(20, MID_Y); ctx.lineTo(282, MID_Y); ctx.stroke(); // 中心線
  ctx.font = "6px sans-serif"; ctx.fillStyle = DEV_ERR.length ? "#ff5a4a" : "#7ee08a";
  ctx.fillText(DEV_ERR.length ? "マス点検NG " + DEV_ERR[0] : "マス点検OK（3×5のどの形でも重ならない）", 6, 106);
  ctx.restore();
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

// 技の名前：だれが使ったか分かるように、顔（敵は姿）と属性を添えて上の帯の下に出す
function showBanner(a, e) {
  els.banner.innerHTML = ""; els.banner.classList.toggle("on", !!e.sk); els.banner.classList.toggle("foe", a.side === 1);
  if (!e.sk) return;
  const box = div("sbn", ""); box.style.height = d(22); box.style.padding = `0 ${d(10)} 0 ${d(3)}`; box.style.gap = d(5);
  if (a.side === 0) { const fc = spriteBox(IM[a.img], FACE[0], FACE[1], FACE[2], FACE[3], 18 * DM.K); fc.style.flex = "none"; box.appendChild(fc); }
  else { const im = IM[a.img], sc = Math.min(18 / im.naturalWidth, 18 / im.naturalHeight), i = document.createElement("img"); i.src = im.src; i.style.cssText = `width:${d(im.naturalWidth * sc)};height:${d(im.naturalHeight * sc)};image-rendering:pixelated;transform:scaleX(-1);flex:none`; box.appendChild(i); }
  const s = BT.SKILLS[e.skill] || {}, at = s.at || [];
  box.appendChild(div("sbn-nm", e.nm));
  if (at.length) box.appendChild(div("sbn-at", at.map(x => icon(x, 11)).join("")));
  els.banner.appendChild(box);
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
      showBanner(a, e);
      if (a.side === 0) pose[a.id] = { kind: e.magic || e.kind === "回復" || e.kind === "防御" ? "magic" : "phys", until: now() + 650 / spd() };
      else fx[a.id] = { ...(fx[a.id] || {}), lunge: now() + 220 / spd() };
      await wait(e.sk ? 360 : 220);
    } else if (e.t === "hit") {
      const t = byId(e.d), p = where(t);
      fx[t.id] = { ...(fx[t.id] || {}), flash: now() + 110 / spd(), shake: now() + 220 / spd() };
      const tag = e.weak ? '<b class="tag weak">WEAK</b>' : e.resist ? '<b class="tag resist">RESIST</b>' : ""; // 弱点は赤、耐性は青（上の帯の▲▼と同じ色）
      num(p.x, p.y, tag + e.v, (t.side === 0 ? "foe" : "") + (e.weak ? " big" : ""), e.weak ? 19 : 16);
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
  if (st.over) { ended = true; refresh(); setTimeout(result, 900 / spd()); return; }
  if (st.phase === "run") setTimeout(turn, 80 / spd());
  else if (autoOn) setTimeout(go, 200 / spd());
  else { cmdIdx = aliveIdx()[0]; refresh(); }
}

// ---------- 始めと終わり ----------
// wave：{nm, foes, tier, bg}。roster：仲間の記録。終わると done(st) を呼ぶ（勝ち負け・ごほうびは呼んだ側で）
function start(wave, roster, lo, done) {
  st = BT.newBattle(wave, (Date.now() & 0xffff) + 1, lo, roster); last = st.log.length; busy = false; ended = false; fx = {}; pose = {}; cmdIdx = 0;
  onEnd = done; active = true;
  scene = (SCENES[wave.bg] || SCENES.grass)(); buildHud();
  if (autoOn) setTimeout(go, 600);
}
function result() { if (onEnd) onEnd(st); }
// 勝ったあと：能力が上がった人はくるっと回り、上がった能力をその場で見せる（本家と同じ見せ方）。そのあと結果の画面へ
let spin = {};
function finish(growth) {
  return new Promise(res => {
    const done = () => { active = false; hud.innerHTML = ""; spin = {}; res(); };
    if (!growth || !growth.some(g => g.ups.length)) { setTimeout(done, st.over === "win" ? 500 : 200); return; }
    els.panel.style.display = "none"; els.bar.style.display = "none";
    const now = performance.now();
    growth.forEach((g, i) => {
      const u = st.party.find(p => p.hi === g.hi); if (!u || !g.ups.length) return;
      const t0 = now + i * 180; spin[u.id] = { t0, t1: t0 + 640 };
      const p = heroPos(u);
      g.ups.forEach((up, k) => setTimeout(() => {
        const nm = up.k === "hp" ? "HP" : BT.ST_NM[up.k];
        const e = div("growpop", `${nm}<b>+${up.v}</b>`); e.style.left = d(p.x); e.style.top = d(p.y - 34 - k * 11); e.style.fontSize = d(8.5);
        hud.appendChild(e);
      }, i * 180 + 380 + k * 160));
    });
    const total = Math.max(...growth.map((g, i) => i * 180 + 380 + g.ups.length * 160)) + 1300;
    const veil = px(div("px skipveil", ""), 0, 0, W, H); hud.appendChild(veil);
    let t = setTimeout(done, total); veil.onclick = () => { clearTimeout(t); done(); };
  });
}
if (DEV) DEV_ERR = devCheck();
requestAnimationFrame(draw);
window.BV = { start, finish, get active() { return active; } };
})();
