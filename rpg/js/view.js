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
const HERO_X = [204, 234, 264], HERO_Y = [204, 244, 284, 324, 364]; // 仲間：列0が敵寄り。段の間40＝絵の高さ30＋足元の体力ゲージとHPの数字（9.5）が、下の段の頭と重ならない幅
const HP_BELOW = 9.5; // 足元から、体力ゲージとHPの数字の下まで
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
const SCENES = { road: () => makeScene(), grass: () => dungeonScene("grass"), meadow: () => dungeonScene("meadow"), canopy: () => dungeonScene("canopy"), gold: () => dungeonScene("gold"), stone: () => dungeonScene("stone"), beach: () => dungeonScene("gold"), sea: () => dungeonScene("sails"), snow: () => dungeonScene("snow"), shade: () => dungeonScene("shade") }; // beach＝入り江（砂地）、sea＝船の上（帆柱）
const d = DM.d, px = DM.px, div = DM.div, spriteBox = DM.spriteBox, icon = DM.icon;
DM.onFit.push(() => { if (active && st && !ended) buildHud(); });

// ---------- 位置 ----------
function heroPos(u) { return { x: HERO_X[u.c], y: HERO_Y[u.r] }; }
// 双頭の魔物（twin）：一つの体の絵を真ん中に1回だけ描き、頭ごとに狙う場所を分ける。数字は、左右反転した後の絵の中の頭の場所（ドット）
const TWIN = { A: [54, 0, 34, 46], B: [25, 0, 29, 38], C: [24, 20, 34, 38], D: [60, 0, 32, 34], E: [92, 16, 34, 42] }; // C〜E：三つ首のケルベ（画面の左・真ん中・右の首）
function twinBody(u) { const img = IM[u.img], w = img.naturalWidth * QM, h = img.naturalHeight * QM, y = Math.round((MID_Y + h / 2) * 4) / 4; return { x: BIG.x, y, w, h, left: Math.round((BIG.x - w / 2) * 4) / 4, top: y - h }; }
function foeBox(u) {
  if (u.twin) { const b = twinBody(u), [hx, hy, hw, hh] = TWIN[u.twin], left = b.left + hx * QM, top = b.top + hy * QM, w = hw * QM, h = hh * QM; return { x: left + w / 2, y: b.y, w, h, left, top, body: b }; }
  const img = IM[u.img];
  // 人間の敵は、仲間と同じ人物の絵・同じ大きさ（歩く絵の1コマ）
  // ただし魔物の兵を従える隊長などは、魔物と同じ点の細かさ（psc＝1.5で魔物の倍率と同じ）にして、手下より小さく見えないようにする
  const ps = Q * (u.psc || 1), w = u.person ? SHEET.fw * ps : img.naturalWidth * QM, h = u.person ? SHEET.fh * ps : img.naturalHeight * QM;
  if (u.big) { const y = Math.round((MID_Y + h / 2) * 4) / 4; return { x: BIG.x, y, w, h, left: Math.round((BIG.x - w / 2) * 4) / 4, top: y - h }; }
  const x = FOE_X[u.c], y = FOE_Y[u.r];
  return { x, y, w, h, left: Math.round((x - w / 2) * 4) / 4, top: y - h }; // 点の境目にそろえる
}
// 双頭の体：両方の頭が倒れたら消える。倒れた頭だけ暗くし、光るのは当たった頭だけ
function drawTwin(tw, t) {
  const u0 = tw[0], body = twinBody(u0), img = IM[u0.img], fs = tw.map(u => fx[u.id] || {});
  const allDown = tw.every(u => u.down), fadeT = Math.max(...fs.map(f => f.fade || 0));
  if (allDown && !(fadeT > t)) return;
  let ox = 0;
  if (fs.some(f => f.shake > t)) ox = Math.round(Math.sin(t / 18) * 2);
  if (fs.some(f => f.lunge > t)) ox += 4;
  ctx.save();
  if (allDown) ctx.globalAlpha = Math.max(0, (fadeT - t) / 500);
  ctx.fillStyle = "#0006"; ctx.fillRect(body.x - Math.floor(body.w * 0.35), body.y - 1, Math.floor(body.w * 0.7), 1.5);
  ctx.translate(Math.round((body.left + ox + body.w) * 4) / 4, Math.round(body.top * 4) / 4); ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0, body.w, body.h);
  tw.forEach((u, i) => {
    const [hx, hy, hw, hh] = TWIN[u.twin], rx = body.w - (hx + hw) * QM, ry = hy * QM, rw = hw * QM, rh = hh * QM;
    if (fs[i].flash > t) { ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip(); ctx.globalAlpha = 0.7; ctx.drawImage(white(img), 0, 0, body.w, body.h); ctx.restore(); }
    if (u.down && !allDown) { ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip(); ctx.globalAlpha = 0.5; ctx.drawImage(white(img, "#000"), 0, 0, body.w, body.h); ctx.restore(); } // 倒れた頭は暗く沈む
  });
  ctx.restore();
  tw.forEach(u => { if (!u.down) { const b = foeBox(u), bw = Math.min(30, Math.max(16, Math.floor(b.w * 0.7))); hpBar(b.x - Math.floor(bw / 2), b.y + 2, bw, u.hp / u.max); } });
}
// 横に寝た姿：目を閉じたコマ（5段目の右）を90度まわして、地面（y）に横たえる。dir＝1は頭が右、-1は頭が左
function lying(img, x, y, fw, fh, dir) {
  ctx.save(); ctx.translate(Math.round(x * 4) / 4, Math.round((y - fw * 0.34) * 4) / 4); ctx.rotate(dir * Math.PI / 2);
  ctx.drawImage(img, 2 * SHEET.fw, 4 * SHEET.fh, SHEET.fw, SHEET.fh, -fw / 2, -fh / 2, fw, fh);
  ctx.restore();
}
function where(u) {
  if (u.side === 1) { const b = foeBox(u); return { x: b.x, y: b.top + b.h * 0.45 }; }
  const p = heroPos(u); return { x: p.x, y: p.y - 20 };
}
function byId(id) { return [...st.party, ...(st.guests || []), ...st.foes].find(u => u.id === id); }

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
  const pk = cmdOn ? [cmdIdx, u.hp, u.bp, u.lp, st.cmd[u.id] || "", st.party.map(p => (st.cmd[p.id] ? 1 : 0) + (p.down ? 2 : 0)).join(""), JSON.stringify(st.items)].join("|") : "off";
  if (pk !== els.pk) { els.pk = pk; els.panel.innerHTML = ""; els.panel.style.display = cmdOn ? "block" : "none"; if (cmdOn) buildPanel(u); }
  const canRep = cmdOn && Object.keys(st.lastCmd).length > 0, canBack = cmdOn && cmdIdx > aliveIdx()[0];
  const bk = [cmdOn, autoOn, autoMode, support, fast, canRep, canBack, ended].join("|");
  if (bk !== els.bk) { els.bk = bk; buildBar(cmdOn); }
}
function buildPanel(u) {
  const P = els.panel, A = (cls, html, x, y, w, h) => { const e = px(div("px " + cls, html), x, y, w, h); P.appendChild(e); return e; };
  const card = A("frame pcard", "", 12, 0, 277, 42);
  const nm = div("pn", u.nm); nm.style.fontSize = d(13); nm.style.left = d(12); nm.style.top = d(5); card.appendChild(nm);
  const sub = div("ps", `${BT.WTYPE[u.wt].nm}${u.heart ? "・" + BT.heart(u.heart).nm : ""}`); sub.style.fontSize = d(8); sub.style.left = d(12); sub.style.top = d(25); card.appendChild(sub);
  const fc = spriteBox(IM[u.img], FACE[0], FACE[1], FACE[2], FACE[3], 40 * DM.K); fc.style.position = "absolute"; fc.style.right = d(8); fc.style.top = d(1); card.appendChild(fc);
  const dots = div("pdots", st.party.map((p, i) => `<i class="${i === cmdIdx ? "on" : st.cmd[p.id] ? "done" : ""}${p.down ? " ko" : ""}"></i>`).join("")); dots.style.left = d(120); dots.style.top = d(17); card.appendChild(dots);
  [["HP", `${u.hp}<small>/${u.max}</small>`], ["LP", `${u.lp}<small>/${u.lp_max || BT.HEROES.find(h => h.id === u.id).lp}</small>`], ["BP", `${u.bp}<small>/${BT.BP_MAX}</small>`]].forEach(([k, v], i) => {
    const b = A("frame pst", `<span class="k">${k}</span><span class="v">${v}</span>`, 12 + i * 94, 46, 89, 18); b.style.fontSize = d(9.5);
  });
  const keys = ["attack", ...u.sk];
  const listBox = A("frame plist", "", 12, 68, 277, 132);
  const food = BT.foodLeft(st, u), rows = keys.length + (food ? 1 : 0), RH = Math.min(25.6, 128 / rows);
  if (food) { // 食べ物：技と同じように、押すと決まる
    const fk = food.slice(5), T = BT.TOOLS[fk], left = (st.items[fk] || 0) - Object.entries(st.cmd).filter(([id, c]) => id !== u.id && c === food).length;
    const row = div("srow food" + (st.cmd[u.id] === food ? " sel" : ""), ""); px(row, 4, 3 + keys.length * RH, 269, RH - 1);
    row.innerHTML = `<span class="ic" style="left:${d(4)};width:${d(26)}"><img src="${IM[T.icon].src}" style="width:${d(14)};height:${d(14)};image-rendering:pixelated"></span>` +
      `<span class="sn" style="left:${d(32)};font-size:${d(11)}">${T.nm}</span>` +
      `<span class="rk kind" style="left:${d(128)};font-size:${d(8.5)}">HP${Math.round(T.food * 100)}%回復</span>` +
      `<span class="bp" style="right:${d(6)};font-size:${d(10)}">×${left}</span>`;
    row.onclick = () => pick(food);
    listBox.appendChild(row);
  }
  keys.forEach((k, j) => {
    const s = BT.SKILLS[k], bp = BT.cost(u, s), ok = bp <= u.bp, fxs = BT.fxText(s), at = s.at || (s.kind === "攻撃" ? BT.WTYPE[u.wt].at : []);
    const row = div("srow" + (ok ? "" : " dim") + (st.cmd[u.id] === k ? " sel" : "") + (u.heart && j === keys.length - 1 ? " heart" : ""), "");
    px(row, 4, 3 + j * RH, 269, RH - 1);
    const rank = s.kind === "攻撃" ? (s.rank && s.rank !== "N" ? s.rank : "—") : null;
    const dist = k === "attack" ? (u.wt === "bow" ? "遠" : "近") : s.kind !== "攻撃" ? "" : s.dist || (s.magic ? "遠" : ""); // 近・遠は攻撃の技だけ
    row.innerHTML = `<span class="ic" style="left:${d(4)};width:${d(26)}">${at.map(a => icon(a, 11)).join("")}</span>` +
      `<span class="sn${fxs ? " up" : ""}" style="left:${d(32)};font-size:${d(11)}">${s.nm}</span>` + (fxs ? `<span class="fx" style="left:${d(32)};font-size:${d(6.8)}">${fxs}</span>` : "") +
      (rank ? `<span class="rk" style="left:${d(128)};font-size:${d(8)}">威力<b style="font-size:${d(10)}">${rank}</b></span>` : `<span class="rk kind" style="left:${d(128)};font-size:${d(8.5)}">${s.kind}</span>`) +
      `<span class="rg" style="left:${d(168)};font-size:${d(8.5)}">${BT.RANGE_NM[s.tg]}</span>` +
      (dist ? `<span class="ds ${dist === "近" ? "near" : "far"}" style="left:${d(206)};font-size:${d(8)};width:${d(13)};height:${d(13)};line-height:${d(13)}">${dist}</span>` : "") +
      `<span class="bp${bp < s.bp ? " cut" : ""}" style="right:${d(6)};font-size:${d(10)}">${bp ? "BP" + bp : ""}</span>`;
    if (ok) row.onclick = () => pick(k);
    listBox.appendChild(row);
  });
}
// 下のボタン：戻る・通常AUTO・全力AUTO・補助/防御・Repeat（オート中は早送り）
// 通常AUTO／全力AUTOは押したほうで動き出す。光っているほうをもう一度押すとオートが止まり、次のターンから自分で選ぶ
function buildBar(cmdOn) {
  const B = els.bar; B.innerHTML = "";
  const btn = (html, x, w, fn, cls) => { const b = px(div("px frame bbtn " + (cls || ""), html), x, 0, w, BAR.h); b.style.fontSize = d(9.5); if (fn) b.onclick = fn; B.appendChild(b); return b; };
  const canBack = cmdOn && cmdIdx > aliveIdx()[0];
  btn("↩", 12, 28, canBack ? back : null, canBack ? "" : "dim").style.fontSize = d(13);
  const autoBtn = (mode, label, x) => btn(label, x, 62, () => {
    if (ended) return;
    if (autoOn && autoMode === mode) autoOn = false; else { autoMode = mode; autoOn = true; }
    keepAuto(); refresh();
    if (autoOn && st.phase === "command" && !busy) go();
  }, "auto" + (autoOn && autoMode === mode ? " lit" : ""));
  autoBtn("normal", "通常AUTO", 44);
  autoBtn("full", "全力AUTO", 110);
  btn(`補助/防御<br><b>${support ? "ON" : "OFF"}</b>`, 176, 66, () => { support = !support; refresh(); }, "two");
  const canRep = cmdOn && Object.keys(st.lastCmd).length;
  if (!autoOn) btn("Repeat", 246, 43, canRep ? repeat : null, "rep" + (canRep ? "" : " dim"));
  else btn(fast ? "▶▶▶" : "▶▶", 246, 43, () => { fast = !fast; keepAuto(); refresh(); }, "ff" + (fast ? " lit" : ""));
}
function aliveIdx() { return st.party.map((p, i) => i).filter(i => !st.party[i].down); }
function pick(key) {
  const u = st.party[cmdIdx]; st.cmd[u.id] = key;
  const next = aliveIdx().find(i => i > cmdIdx);
  if (next === undefined) { go(); return; }
  cmdIdx = next; refresh();
}
function back() { const prev = aliveIdx().filter(i => i < cmdIdx).pop(); if (prev !== undefined) { cmdIdx = prev; refresh(); } }
function repeat() { for (const u of BT.alive(st.party)) { const k = st.lastCmd[u.id]; st.cmd[u.id] = k && BT.SKILLS[k] && BT.cost(u, BT.SKILLS[k]) <= u.bp ? k : "attack"; } go(); } // 食べ物は繰り返さない
function go() {
  if (st.phase !== "command" || busy || ended) return;
  BT.commit(st, autoOn ? autoMode : null, support);
  cmdIdx = 0; refresh();
  setTimeout(turn, 120 / spd());
}

// ---------- 描く ----------
const WHITE = new Map();
function white(img, col = "#fff") {
  const key = col === "#fff" ? img : img.src + col;
  if (WHITE.has(key)) return WHITE.get(key);
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext("2d"); x.drawImage(img, 0, 0); x.globalCompositeOperation = "source-in"; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
  WHITE.set(key, c); return c;
}
// HPの数字（今/最大）。ゲージのすぐ下に小さく
function hpText(x, y, u) {
  ctx.save(); ctx.font = "bold 4.6px 'Avenir Next', system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "top";
  const t = `${u.hp}/${u.max}`; ctx.lineWidth = 1.2; ctx.strokeStyle = "#000c"; ctx.strokeText(t, x, y);
  ctx.fillStyle = u.hp <= 0 ? "#8a8090" : u.hp < u.max * 0.25 ? "#ff8a6a" : "#f0f4e8"; ctx.fillText(t, x, y); ctx.restore();
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
  const ox = Math.round(DM.OX * 4), oy = Math.round(DM.OY * 4); // 文字の枠の左上（canvasの点）
  if (scene) { // 背景の1点＝canvasの2点。枠の中に描いてから、画面の端までのばす
    const up = SCENE_UP * 2, strip = up + 2;
    ctx.setTransform(1, 0, 0, 1, ox, oy);
    ctx.drawImage(scene, 0, -up * 2, scene.width * 2, scene.height * 2);
    ctx.drawImage(scene, 0, scene.height - strip, scene.width, strip, 0, H * 4 - strip * 2, scene.width * 2, strip * 2);
    DM.bleed(ctx, cv, oy <= up * 2); // 背景は上にずらして描くので、枠の上にも絵がある
  }
  const qx = quake > t ? Math.round(Math.sin(t / 14) * 1.5 * 4) : 0; // 大きく当たったときの揺れ
  ctx.setTransform(4, 0, 0, 4, qx + ox, oy); // ここから先はドットの座標で描く（枠の左上が 0,0）
  if (DEV && st) devGrid();
  if (st) drawEfx(t); // 範囲の光は人の後ろに
  if (st) {
    ctx.fillStyle = "#000a"; ctx.fillRect(-DM.OX, 44, DM.VW, 52); // 上の帯の下地（画面の端まで）
    const twins = st.foes.filter(u => u.twin);
    for (const u of st.foes) { // 敵（右向きにして描く）
      if (u.twin) { if (u === twins[0]) drawTwin(twins, t); continue; }
      const b = foeBox(u), img = IM[u.img], f = fx[u.id] || {};
      if (u.down && !(f.fade > t) && !u.human) continue; // 人間は、倒れてもそこに残る
      let ox = 0;
      if (f.shake > t) ox = Math.round(Math.sin(t / 18) * 2);
      if (f.lunge > t) ox += 4;
      ctx.save();
      if (u.down) ctx.globalAlpha = u.human ? Math.max(0.5, (f.fade - t) / 500) : Math.max(0, (f.fade - t) / 500);
      ctx.fillStyle = "#0006"; ctx.fillRect(b.x - Math.floor(b.w * 0.35), b.y - 1, Math.floor(b.w * 0.7), 1.5);
      if (u.person && u.down) lying(img, b.x + ox, b.y, b.w, b.h, -1); // 倒れた人間の敵も、横に寝かせる
      else if (u.person) { // 人間の敵：ふだんは右向きの立ち姿。動くときは構えのコマ（左向きの絵）を裏返して右向きに
        const ps = pose[u.id], act = ps && ps.until > t, col = act ? (ps.kind === "magic" ? 0 : 1) : 1, row = act ? 4 : 2;
        if (act) { ctx.translate(Math.round((b.left + ox + b.w) * 4) / 4, Math.round(b.top * 4) / 4); ctx.scale(-1, 1); }
        else ctx.translate(Math.round((b.left + ox) * 4) / 4, Math.round(b.top * 4) / 4);
        ctx.drawImage(img, col * SHEET.fw, row * SHEET.fh, SHEET.fw, SHEET.fh, 0, 0, b.w, b.h);
        if (f.flash > t) { ctx.globalAlpha = 0.7; ctx.drawImage(whiteCell(img, col, row), 0, 0, b.w, b.h); }
      } else {
        ctx.translate(Math.round((b.left + ox + b.w) * 4) / 4, Math.round(b.top * 4) / 4); ctx.scale(-1, 1); // 点の境目にそろえて左右反転
        ctx.drawImage(img, 0, 0, b.w, b.h);
        if (f.flash > t) { ctx.globalAlpha = 0.7; ctx.drawImage(white(img), 0, 0, b.w, b.h); }
      }
      ctx.restore();
      if (!u.down) { const bw = Math.min(30, Math.max(16, Math.floor(b.w * 0.7))); hpBar(b.x - Math.floor(bw / 2), b.y + 2, bw, u.hp / u.max); }
    }
    for (const u of [...st.party, ...(st.guests || [])].sort((a, b) => heroPos(a).y - heroPos(b).y)) { // 仲間（左向き）。奥から描く
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
      if (u.down) lying(img, p.x + ox, p.y, fw, fh, 1); // 倒れた仲間：目を閉じたコマを横に寝かせる（敵に背を向けず、後ろへ倒れた向き）
      else {
        ctx.drawImage(img, col * SHEET.fw, row * SHEET.fh, SHEET.fw, SHEET.fh, p.x - fw / 2 + ox, p.y - fh, fw, fh);
        if (f.flash > t) { ctx.globalAlpha = 0.6; ctx.drawImage(whiteCell(img, col, row), p.x - fw / 2 + ox, p.y - fh, fw, fh); }
      }
      ctx.restore();
      hpBar(p.x - 8, p.y + 2, 16, u.hp / u.max);
      hpText(p.x, p.y + 5, u);
    }
  }
  if (st) drawEfxTop(t);
  requestAnimationFrame(draw);
}
// ---------- 攻撃の見せ方（範囲の光・飛ぶもの・当たったときの絵） ----------
let efx = [];
const ACOL = { 斬: "#e8eef8", 打: "#ffd58a", 突: "#bfe4ff", 熱: "#ff8a3a", 冷: "#8ad8ff", 雷: "#ffe85a", 陽: "#fff0a0", 陰: "#b080ff" };
function cellBox(u) { // その人・その敵が立つマスの四角（ドット）
  if (u.side === 1) { if (u.big) return { x: 22, y: 168, w: 136, h: 186 }; const x = FOE_X[u.c], y = FOE_Y[u.r]; return { x: x - 21, y: y - 58, w: 42, h: 62 }; }
  const x = HERO_X[u.c], y = HERO_Y[u.r]; return { x: x - 15, y: y - 34, w: 30, h: 44 };
}
function drawEfx(t) { efxPass(t, e => e.type === "area"); }
function drawEfxTop(t) { efxPass(t, e => e.type !== "area"); efx = efx.filter(e => t < e.t0 + e.dur); }
function efxPass(t, pick) {
  for (const e of efx.filter(pick)) {
    const k = Math.max(0, Math.min(1, (t - e.t0) / e.dur)); if (t < e.t0) continue;
    ctx.save();
    if (e.type === "area") { ctx.globalAlpha = 0.35 * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8 * 0.6); ctx.fillStyle = e.col; ctx.fillRect(e.b.x, e.b.y, e.b.w, e.b.h); ctx.globalAlpha *= 1.6; ctx.strokeStyle = e.col; ctx.lineWidth = 0.6; ctx.strokeRect(e.b.x + 0.3, e.b.y + 0.3, e.b.w - 0.6, e.b.h - 0.6); }
    else if (e.type === "shot") { // 矢や術の玉が飛ぶ
      const x = e.x + (e.x2 - e.x) * k, y = e.y + (e.y2 - e.y) * k - Math.sin(k * Math.PI) * (e.arc || 0);
      ctx.fillStyle = e.col; ctx.globalAlpha = 1; ctx.globalCompositeOperation = "lighter";
      const ang = Math.atan2(e.y2 - e.y + (e.arc ? -Math.cos(k * Math.PI) * e.arc * 2 : 0), e.x2 - e.x);
      if (e.arrow) { ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = 0.35; ctx.fillRect(-22, -0.8, 18, 1.6); ctx.globalAlpha = 1; ctx.fillStyle = "#d8c8a0"; ctx.fillRect(-10, -0.6, 14, 1.2); ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(2, -2); ctx.lineTo(2, 2); ctx.fill(); }
      else { ctx.globalAlpha = 0.3; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); }
    } else if (e.type === "hit") hitArt(e, k);
    ctx.restore();
  }
}
function hitArt(e, k) {
  const { x, y } = e, a = 1 - k * k, c = ACOL[e.at] || "#fff";
  ctx.globalCompositeOperation = "lighter"; ctx.translate(x, y); ctx.scale(1.6, 1.6); ctx.translate(-x, -y); // 当たった絵は大きく明るく
  ctx.globalAlpha = a; ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap = "round";
  if (e.at === "斬") { ctx.lineWidth = 2.2 * a + 0.6; const L = 8 + 10 * Math.min(1, k * 3); ctx.beginPath(); ctx.moveTo(x - L, y - L); ctx.lineTo(x + L, y + L); ctx.stroke(); if (e.hits2) { ctx.beginPath(); ctx.moveTo(x + L, y - L); ctx.lineTo(x - L, y + L); ctx.stroke(); } }
  else if (e.at === "打") { ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, 3 + k * 10, 0, 7); ctx.stroke(); for (let i = 0; i < 6; i++) { const an = i * 1.047 + 0.3, r1 = 4 + k * 8, r2 = r1 + 4; ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * r1, y + Math.sin(an) * r1); ctx.lineTo(x + Math.cos(an) * r2, y + Math.sin(an) * r2); ctx.stroke(); } }
  else if (e.at === "突") { ctx.lineWidth = 2; const L = 16 * Math.min(1, k * 3); ctx.beginPath(); ctx.moveTo(x + 12 - L * 1.6, y); ctx.lineTo(x + 12, y); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 1.5 + k * 5, 0, 7); ctx.stroke(); }
  else if (e.at === "熱") { for (let i = 0; i < 9; i++) { const px = x + Math.sin(i * 2.3) * 8, py = y + 6 - k * (10 + (i % 3) * 5) - i % 4; ctx.globalAlpha = a * 0.9; ctx.fillStyle = i % 2 ? "#ffd04a" : "#ff6a2a"; ctx.beginPath(); ctx.arc(px, py, 2.4 * a + 0.6, 0, 7); ctx.fill(); } }
  else if (e.at === "冷") { for (let i = 0; i < 6; i++) { const an = i * 1.047, r = 14 * (1 - k) + 2; ctx.save(); ctx.translate(x + Math.cos(an) * r, y + Math.sin(an) * r); ctx.rotate(an); ctx.fillRect(-2.5, -0.8, 5, 1.6); ctx.restore(); } }
  else if (e.at === "雷") { ctx.lineWidth = 1.8; ctx.beginPath(); let px = x - 2, py = y - 40; ctx.moveTo(px, py); for (let i = 0; i < 5; i++) { px = x + (i % 2 ? 4 : -4); py += 8; ctx.lineTo(px, py); } ctx.stroke(); ctx.globalAlpha = a * 0.4; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); }
  else if (e.at === "陽") { ctx.globalAlpha = a * 0.55; ctx.fillRect(x - 5, y - 40, 10, 48); ctx.globalAlpha = a; ctx.fillRect(x - 1.5, y - 40, 3, 48); }
  else if (e.at === "陰") { ctx.lineWidth = 1.6; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x, y, 3 + i * 4 + k * 6, k * 6 + i, k * 6 + i + 3.5); ctx.stroke(); } }
  else { ctx.beginPath(); ctx.arc(x, y, 4 + k * 8, 0, 7); ctx.stroke(); }
}

// 開発用の点検：仲間3×5のどのマスの組み合わせ（どんな陣形）でも、絵と体力ゲージが重ならないか、陣形の決まりが正しいかを確かめる
function devCheck() {
  const err = [];
  const box = (c, r, step) => { // 絵（1ドット＝Q）の幅いっぱい・頭の上〜体力ゲージの下。物理攻撃のときは6ドット前（左）に出る
    const x = HERO_X[c] - (step ? 6 : 0), y = HERO_Y[r];
    return { l: x - SHEET.fw * Q / 2, r: x + SHEET.fw * Q / 2, t: y - SHEET.fh * Q, b: y + HP_BELOW };
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
  const top = Math.min(...HERO_Y) - SHEET.fh * Q, bottom = Math.max(...HERO_Y) + HP_BELOW;
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
  els.banner.innerHTML = ""; els.banner.classList.add("on"); els.banner.classList.toggle("foe", a.side === 1);
  const box = div("sbn", ""); box.style.height = d(22); box.style.padding = `0 ${d(10)} 0 ${d(3)}`; box.style.gap = d(5);
  if (a.side === 0 || a.person) { const fc = spriteBox(IM[a.img], FACE[0], FACE[1], FACE[2], FACE[3], 18 * DM.K); fc.style.flex = "none"; box.appendChild(fc); }
  else { const im = IM[a.img], sc = Math.min(18 / im.naturalWidth, 18 / im.naturalHeight), i = document.createElement("img"); i.src = im.src; i.style.cssText = `width:${d(im.naturalWidth * sc)};height:${d(im.naturalHeight * sc)};image-rendering:pixelated;transform:scaleX(-1);flex:none`; box.appendChild(i); }
  const s = BT.SKILLS[e.skill] || {}, at = s.at || (e.skill === "attack" && BT.WTYPE[a.wt] ? BT.WTYPE[a.wt].at : []);
  box.appendChild(div("sbn-nm", e.nm));
  if (at.length) box.appendChild(div("sbn-at", at.map(x => icon(x, 11)).join("")));
  els.banner.appendChild(box);
}

// ---------- 進める ----------
const wait = ms => new Promise(r => setTimeout(r, ms / spd()));
let cur = null, quake = 0;
async function turn() {
  if (busy || ended) return;
  busy = true;
  BT.step(st);
  const evs = st.log.slice(last); last = st.log.length;
  const now = () => performance.now();
  refresh();
  for (const e of evs) {
    if (e.t === "act") {
      const a = byId(e.u), sk = BT.SKILLS[e.skill] || {}, idx = evs.indexOf(e);
      cur = { a, sk, at: (sk.at || BT.WTYPE[a.wt].at || [])[0], ranged: sk.dist === "遠" || !!sk.magic || (e.skill === "attack" && a.wt === "bow"), first: true, hits: 0 };
      showBanner(a, e); SND.se(e.magic || e.kind === "回復" || e.kind === "補助" ? "cast" : "swing");
      if (a.side === 0 || a.person) pose[a.id] = { kind: e.magic || e.kind === "回復" || e.kind === "防御" ? "magic" : "phys", until: now() + 650 / spd() };
      if (a.side === 1 && !(a.person && e.magic)) fx[a.id] = { ...(fx[a.id] || {}), lunge: now() + (a.person ? 650 : 220) / spd() };
      // 縦・横・全体の技は、当たるマスを先に光らせる
      if (["col", "row", "all"].includes(sk.tg)) {
        const tg = []; for (let j = idx + 1; j < evs.length && evs[j].t !== "act"; j++) if (evs[j].t === "hit" && !tg.includes(evs[j].d)) tg.push(evs[j].d);
        tg.map(byId).forEach(u => efx.push({ type: "area", b: cellBox(u), col: a.side === 0 ? "#ffd88a" : "#ff5a4a", t0: now(), dur: 900 / spd() }));
      }
      await wait(e.sk ? 380 : 240);
    } else if (e.t === "hit") {
      const t = byId(e.d), p = where(t);
      if (cur && cur.ranged && (cur.first || cur.sk.tg === "rand")) { // 遠くからの攻撃は、飛んでいく（ばらばらに当たる技は1本ずつ）
        const s0 = where(cur.a), dt = cur.first ? 220 : 140; efx.push({ type: "shot", x: s0.x, y: s0.y, x2: p.x, y2: p.y, col: ACOL[cur.at] || "#fff", arrow: !cur.sk.magic, arc: cur.sk.magic ? 0 : 8, t0: now(), dur: dt / spd() });
        await wait(dt);
      }
      if (cur) { cur.first = false; efx.push({ type: "hit", x: p.x, y: p.y, at: cur.at, hits2: (cur.hits++ % 2) === 1, t0: now(), dur: 380 / spd() }); }
      fx[t.id] = { ...(fx[t.id] || {}), flash: now() + 110 / spd(), shake: now() + (e.weak ? 360 : 220) / spd() }; SND.se("hit_" + ((cur && cur.at) || "打"));
      if (e.weak || e.v >= t.max * 0.3) quake = now() + 180 / spd();
      const tag = e.weak ? '<b class="tag weak">WEAK</b>' : e.resist ? '<b class="tag resist">RESIST</b>' : ""; // 弱点は赤、耐性は青（上の帯の▲▼と同じ色）
      num(p.x, p.y, tag + e.v, (t.side === 0 ? "foe" : "") + (e.weak ? " big" : ""), e.weak ? 19 : 16);
      refresh(); await wait(150);
    } else if (e.t === "item") { // 食べ物を食べる
      const a = byId(e.u); cur = null; showBanner(a, { nm: e.nm }); SND.se("eat"); pose[a.id] = { kind: "magic", until: now() + 650 / spd() }; await wait(380);
    } else if (e.t === "summon") { const t = byId(e.d); fx[t.id] = {}; note(t, "呼ばれて出てきた"); SND.se("summon"); refresh(); await wait(420); }
    else if (e.t === "flee") { const t = byId(e.d); fx[t.id] = { ...(fx[t.id] || {}), fade: now() + 500 / spd() }; note(t, "逃げていった"); refresh(); await wait(120); }
    else if (e.t === "passive") { note(byId(e.u), e.nm + (e.v ? " " + e.v : "")); await wait(120); }
    else if (e.t === "status") { SND.se("status"); note(byId(e.d), e.nm); refresh(); await wait(160); }
    else if (e.t === "heal" || e.t === "revive") { SND.se("heal"); const t = byId(e.d), p = where(t); num(p.x, p.y, (e.t === "revive" ? "復活 " : "") + e.v, "heal", 14); refresh(); await wait(60); }
    else if (e.t === "dot") { const t = byId(e.d), p = where(t); num(p.x, p.y, String(e.v), "poison", 14); refresh(); await wait(200); }
    else if (e.t === "skip") { note(byId(e.u), e.nm + "で動けない"); await wait(360); }
    else if (e.t === "lp") { note(byId(e.d), "LP " + e.lp); refresh(); await wait(140); }
    else if (e.t === "down") { const t = byId(e.d); SND.se(t.side === 0 ? "down" : "foedown"); fx[t.id] = { ...(fx[t.id] || {}), fade: now() + 500 / spd() }; if (t.side === 0) note(t, "LP " + e.lp); refresh(); await wait(200); }
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
    const timers = []; // 途中で飛ばしたら、まだ出ていない「上がった能力」は出さない（出しっぱなしで残るのを防ぐ）
    const done = () => { timers.forEach(clearTimeout); active = false; hud.innerHTML = ""; spin = {}; res(); };
    if (!growth || !growth.some(g => g.ups.length)) { setTimeout(done, st.over === "win" ? 500 : 200); return; }
    els.panel.style.display = "none"; els.bar.style.display = "none";
    const now = performance.now();
    growth.forEach((g, i) => {
      const u = st.party.find(p => p.hi === g.hi); if (!u || !g.ups.length) return;
      const t0 = now + i * 180; spin[u.id] = { t0, t1: t0 + 640 };
      const p = heroPos(u);
      g.ups.forEach((up, k) => timers.push(setTimeout(() => {
        const nm = up.k === "hp" ? "HP" : BT.ST_NM[up.k];
        const e = div("growpop", `${nm}<b>+${up.v}</b>`); e.style.left = d(p.x); e.style.top = d(p.y - 34 - k * 11); e.style.fontSize = d(8.5);
        hud.appendChild(e); SND.se("up");
      }, i * 180 + 380 + k * 160)));
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
