// フィールド：マスの上を歩く。指でなぞると歩き続け、2回たたくとそこまで歩く。1回たたくと話す・調べる
// 仲間は後ろをついて歩く。敵は地図の上に見えていて、ぶつかると戦い
(function (root) {
"use strict";
const { W, H, hud, stage } = DM, d = DM.d, px = DM.px, div = DM.div;
const IM = window.IMG;
const cv = document.getElementById("field"), ctx = cv.getContext("2d");
const TD = 24, TP = TL.T;         // 1マス＝24ドット（絵は48点）
const STEP = 170;                 // 1歩の時間
const WALK = new Set([".", "=", "c", "b", "s", "_", "r", "p", "D", "S", "Z", "N"]);
const LEADER = 0;

let M = null, ground = [], over = null, blocked = null;
let P = { x: 0, y: 0, dir: 0, fx: 0, fy: 0, from: null, t0: 0 };
let hist = [], fol = [], foes = [], npcs = [], chests = [];
let active = false, busy = false, route = null, drag = null, grace = 0, fade = 0, fadeTo = 0, waterF = 0;
const G = () => GS.G;

// ---------- 地図を作る ----------
function chAt(x, y) { return (M.g[y] && M.g[y][x] !== undefined) ? M.g[y][x] : "#"; }
function build(id) {
  M = MAPS[id]();
  // 地図が画面より低いときは、上下に木を足して黒い余白をなくす
  M.objs = M.objs.filter(o => !o.when || o.when(G())); M.trigs = M.trigs || [];
  const need = M.inside ? 0 : Math.ceil(Math.max(H, DM.VH || H) / TD) + 1 - M.g.length;
  if (need > 0) {
    const top = Math.ceil(need / 2), bot = need - top, w = M.g[0].length, rowT = () => Array(w).fill(M.pad || "T");
    M.g = [...Array(top).fill(0).map(rowT), ...M.g, ...Array(bot).fill(0).map(rowT)];
    for (const list of [M.objs, M.exits, M.npcs, M.foes, M.chests, M.trigs]) for (const o of list) o.y += top;
    M.padTop = top; M.padBot = bot;
  } else { M.padTop = 0; M.padBot = 0; }
  M.h = M.g.length; M.w = M.g[0].length;
  // 置き物の下が木のマスだと、木の葉が置き物の上にかぶさってしまう。置き物の下は草にしておく
  for (const o of M.objs) for (let j = 0; j < (o.h || 1); j++) for (let i = 0; i < (o.w || 1); i++) if (M.g[o.y + j] && M.g[o.y + j][o.x + i] === "T") M.g[o.y + j][o.x + i] = ".";
  blocked = M.g.map(row => row.map(ch => !WALK.has(ch)));
  for (const o of M.objs) {
    if (o.walk) continue; // 下をくぐれる置き物（関所の門など）
    const w = o.w || (o.t === "mine" ? 2 : 1), h = o.h || (o.t === "mine" ? 2 : 1);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (blocked[o.y + j]) blocked[o.y + j][o.x + i] = true;
  }
  if (M.sea) blocked = M.g.map(row => row.map(ch => ch !== "~" && ch !== "b")); // 海：船は水の上と、港の桟橋（船着き場）だけ
  for (const e of M.exits) blocked[e.y][e.x] = false;
  // 地図の端の出口（行けば次の地図へ切りかわる所）に出す矢印。となり合う出口は1つにまとめる
  const y0 = M.padTop, y1 = M.h - 1 - M.padBot, side = e => e.x === 0 ? 1 : e.x === M.w - 1 ? 2 : e.y === y0 ? 3 : e.y === y1 ? 0 : -1;
  M.arrows = [];
  for (const e of M.exits) { const d = side(e); if (d < 0) continue;
    const a = M.arrows.find(a => a.dir === d && a.to === e.to && a.tiles.some(t => Math.abs(t.x - e.x) + Math.abs(t.y - e.y) === 1));
    if (a) a.tiles.push(e); else M.arrows.push({ dir: d, to: e.to, tiles: [e] }); }
  // 出来事のない家（戸口に仕掛けも出口もない家）は、どれも入れる：戸口の前のマスに「ふつうの家」へ入る仕掛けを足す
  if (!M.inside) for (const o of M.objs) if (o.t === "house" && !o.noEnter) {
    const x = o.x + (o.door || 0), y = o.y + o.h;
    if (M.trigs.some(t => x >= t.x && x < t.x + (t.w || 1) && y >= t.y && y < t.y + (t.h || 1)) || M.exits.some(e => e.x === x && (e.y === y || e.y === y - 1))) continue;
    const back = [[x, y + 1], [x - 1, y], [x + 1, y]].find(([bx, by]) => blocked[by] && blocked[by][bx] === false) || [x, y + 1]; // 出てきたときに立つマス（戸口の前の仕掛けに乗らない所）
    M.trigs.push({ x, y, run: "minka", house: o, map: M.id, idx: M.trigs.filter(t => t.run === "minka").length, rx: back[0], ry: back[1] - M.padTop, dy: y - M.padTop, when: g => !g.flags.cut });
  }
  const hasWater = M.g.some(r => r.includes("~") || r.includes("b") || r.includes("s") || r.includes("m"));
  ground = [paint(0)]; if (hasWater) ground.push(paint(1));
  over = paintOver();
  syncNpcs();
  chests = M.chests.map(c => ({ ...c, open: !!G().chests[c.id] }));
  foes = []; syncFoes();
}
// うろつく魔物：出る条件（when）に合うものだけ居る。出来事のあとにも呼ぶ
function syncFoes() {
  const ok = f => !(f.once && G().flags["k_" + f.once]) && (!f.when || f.when(G()));
  foes = foes.filter(f => ok(f.def));
  for (const f of M.foes) if (ok(f) && !foes.some(x => x.def === f)) foes.push({ def: f, x: f.x, y: f.y, fx: f.x, fy: f.y, hx: f.x, hy: f.y, from: null, t0: 0, next: performance.now() + 400 + Math.random() * 900, face: 1, alive: true });
}
function paint(frame) {
  const c = document.createElement("canvas"); c.width = M.w * TP; c.height = M.h * TP;
  const x = c.getContext("2d");
  for (let ty = 0; ty < M.h; ty++) for (let tx = 0; tx < M.w; tx++) {
    const ch = M.g[ty][tx], nb = (dx, dy) => { const v = chAt(tx + dx, ty + dy); return v === "#" ? ch : v; };
    x.save(); x.translate(tx * TP, ty * TP);
    ({ ".": () => TL.grass(x, tx, ty), "=": () => TL.dirt(x, tx, ty, nb), c: () => TL.cobble(x, tx, ty, nb), T: () => TL.treeBase(x, tx, ty, nb),
       "~": () => TL.water(x, tx, ty, nb, frame), b: () => TL.bridge(x, tx, ty, nb, frame), s: () => TL.stones(x, tx, ty, nb, frame), R: () => TL.rockWall(x, tx, ty, nb),
       f: () => TL.fence(x, tx, ty, nb), W: () => TL.caveWall(x, tx, ty, nb), _: () => TL.caveFloor(x, tx, ty), r: () => TL.rail(x, tx, ty), x: () => TL.rubble(x),
       p: () => TL.floor(x, tx, ty), w: () => TL.wall(x, tx, ty, nb), " ": () => TL.voidT(x), D: () => TL.door(x, tx, ty), m: () => TL.marsh(x, tx, ty, nb, frame), h: () => TL.crops(x, tx, ty), y: () => TL.herb(x, tx, ty), V: () => TL.canyon(x, tx, ty, nb), X: () => TL.fallen(x, tx, ty, nb), E: () => TL.bridgeEnd(x), S: () => TL.stairs(x), K: () => TL.storm(x, tx, ty), N: () => TL.starFloor(x), Q: () => TL.townWall(x, tx, ty, nb), H: () => TL.redWheat(x, tx, ty), Z: () => TL.sand(x, tx, ty), U: () => TL.sandRock(x, tx, ty) }[ch] || (() => TL.grass(x, tx, ty)))();
    x.restore();
  }
  for (const o of M.objs) {
    x.save(); x.translate(o.x * TP, o.y * TP);
    if (o.t === "house") TL.house(x, o.w, o.h, o);
    else if (o.t === "well") TL.well(x);
    else if (o.t === "stall") TL.stall(x, o.w);
    else if (o.t === "sign") TL.sign(x);
    else if (o.t === "mine") TL.mineGate(x);
    else if (TL[o.t]) TL[o.t](x, o);
    x.restore();
  }
  return c;
}
// 地図の外を埋める森（木を4×4に並べた絵のくり返し。地図の格子とそろえる）
let forest = null;
function forestPat() {
  if (forest) return forest;
  const n = 6, c = document.createElement("canvas"); c.width = n * TP; c.height = n * TP;
  const x = c.getContext("2d"), nb = () => "T";
  for (let ty = 0; ty < n; ty++) for (let tx = 0; tx < n; tx++) { x.save(); x.translate(tx * TP, ty * TP); TL.treeBase(x, tx, ty, nb); x.restore(); }
  for (let ty = -1; ty < n; ty++) for (let tx = 0; tx < n; tx++) { x.save(); x.translate(tx * TP, ty * TP + TP / 2); TL.treeTop(x, tx, ty); x.restore(); }
  const t = document.createElement("canvas"); t.width = 4 * TP; t.height = 4 * TP; t.getContext("2d").drawImage(c, TP, TP, 4 * TP, 4 * TP, 0, 0, 4 * TP, 4 * TP);
  forest = ctx.createPattern(t, "repeat"); forest.setTransform(new DOMMatrix().scale(0.5)); return forest;
}
function paintOver() { // 木の葉（上の層）
  const c = document.createElement("canvas"); c.width = M.w * TP; c.height = (M.h + 1) * TP;
  const x = c.getContext("2d");
  for (let ty = 0; ty < M.h; ty++) for (let tx = 0; tx < M.w; tx++) if (M.g[ty][tx] === "T") { x.save(); x.translate(tx * TP, ty * TP); x.translate(0, -TP / 2 + TP); TL.treeTop(x, tx, ty); x.restore(); }
  return c;
}

// 町の人：when（出てくる条件）が付いている人は、条件に合うときだけ居る。出来事のあとにも呼ぶ
function syncNpcs() { npcs = M.npcs.filter(n => !n.when || n.when(G())).map(n => ({ ...n, d: n.dir })); }
// 後ろを付いて歩くのは、戦う5人のうち先頭の人（主人公）以外
function syncParty() {
  const ids = M && M.noFollow ? [] : GS.fighters().filter(hi => hi !== LEADER);
  fol = ids.map((hi, i) => fol.find(f => f.hi === hi) || { hi, x: P.x, y: P.y, fx: P.x, fy: P.y, from: null, dir: P.dir });
  const gi = G().flags.guest; // 戦いには出ないが、後ろをついてくる人（1人なら絵の名前、何人かなら並べる）
  if (gi && !(M && M.noFollow)) for (const img of [].concat(gi)) fol.push(fol.find(f => f.img === img) || { hi: -1, img, x: P.x, y: P.y, fx: P.x, fy: P.y, from: null, dir: P.dir });
}
// ---------- 入る・出る ----------
function enter(id, x, y, dir) { // x,y は足す前の地図の座標
  build(id); y += M.padTop;
  P = { x, y, dir: dir || 0, fx: x, fy: y, from: null, t0: 0 };
  hist = Array(9).fill(0).map(() => ({ x, y }));
  fol = []; syncParty();
  const g = G(); g.map = id; g.x = x; g.y = y - M.padTop; g.dir = P.dir; GS.save();
  route = null; grace = performance.now() + 800;
  hudBuild(); SND.bgm(M.music || null);
}
async function start() {
  const g = G(); active = true; enter(g.map, g.x, g.y, g.dir);
  if (!g.flags.s) { fade = 1; fadeTo = 1; await run("s1"); } else fadeIn(); // はじめから：物語の最初の場面
}
// 出来事を1つ流す（流れているあいだは歩けない）
async function run(name, arg) {
  if (!TALK[name]) return;
  const was = busy, held = GS.hold; busy = true; GS.hold = true; route = null; drag = null; talkTarget = null;
  const from = M && M.id + ":" + P.x + "," + P.y;
  try { await TALK[name](arg || {}); } finally { busy = was; GS.hold = held; if (!held) GS.save(); if (active) hudBuild(); }
  // 出来事の中で別の所へ移ったときは、着いた所の仕掛けも確かめる（同じ所に居るままなら、くり返さない）
  if (!was && active && M && M.id + ":" + P.x + "," + P.y !== from) checkTrig();
}

// ---------- 上の飾り ----------
let hudEls = {};
function hudBuild() {
  if (!active) return;
  [...hud.querySelectorAll(".fhud")].forEach(e => e.remove());
  // 左上と右上：さわれる所の端から同じだけ離して置く（画面の端にそろえる）
  const m = 8, top = Math.max(0, DM.ST) + m, lx = Math.max(-DM.OX, DM.SL) + m, rx = Math.min(DM.VW - DM.OX, DM.SR) - m;
  const nm = px(div("px frame fhud place", `<b>${M.nm}</b><span>${G().gold.toLocaleString()} G</span>`), lx, top, 150, 26); nm.style.fontSize = d(10); hud.appendChild(nm);
  const mb = px(div("px frame fhud fbtn", "≡"), rx - 30, top, 30, 26); mb.style.fontSize = d(16);
  mb.onclick = async e => { e.stopPropagation(); if (busy) return; busy = true; route = null; await UI.menu(); busy = false; hudBuild(); };
  hud.appendChild(mb);
  // いまの目的：場所の名前の下に1行で（メニューの「いまの目的」と同じ文）。長いときは字を小さくして収める
  const goal = G().flags.cut ? "" : UI.goalText();
  if (goal) { const gl = px(div("px fhud goalline", `<i>▶</i>${goal}`), lx, top + 30, rx - lx, 16); gl.style.fontSize = d(9); gl.style.setProperty("--gw", d(rx - lx)); hud.appendChild(gl); UI.fitT(gl); }
  hudEls = { nm, s: G().flags.s, cut: G().flags.cut };
}
DM.onFit.push(() => { if (active) hudBuild(); });

// ---------- 動く ----------
function occupied(x, y, self) {
  if (x < 0 || y < 0 || x >= M.w || y >= M.h || blocked[y][x]) return true;
  if (npcs.some(n => n.x === x && n.y === y)) return true;
  if (chests.some(c => c.x === x && c.y === y)) return true;
  if (foes.some(f => f !== self && f.alive && f.x === x && f.y === y)) return true;
  return false;
}
const DIRV = [[0, 1], [-1, 0], [1, 0], [0, -1]]; // 下・左・右・上（絵の段の順）
function dirOf(dx, dy) { return dy > 0 ? 0 : dx < 0 ? 1 : dx > 0 ? 2 : 3; }
function stepTo(dir) {
  const [dx, dy] = DIRV[dir]; P.dir = dir;
  const nx = P.x + dx, ny = P.y + dy;
  const foe = foes.find(f => f.alive && f.x === nx && f.y === ny);
  if (foe) { fight(foe); return false; }
  if (occupied(nx, ny)) return false;
  P.from = { x: P.x, y: P.y }; P.t0 = performance.now(); P.x = nx; P.y = ny;
  hist.unshift({ x: nx, y: ny }); hist.length = 9;
  fol.forEach((f, i) => { const to = hist[i + 1]; if (to.x !== f.x || to.y !== f.y) { f.from = { x: f.x, y: f.y }; f.t0 = P.t0; f.dir = dirOf(to.x - f.x, to.y - f.y); f.x = to.x; f.y = to.y; } else f.from = null; });
  return true;
}
function arrived() {
  const g = G(); g.x = P.x; g.y = P.y - M.padTop; g.dir = P.dir;
  const ex = M.exits.find(e => e.x === P.x && e.y === P.y);
  if (ex) { route = null; travel(ex); return; }
  if (checkTrig()) return;
  if (touchFoe()) return;
  if (route && route.length) { const n = route.shift(); if (!stepTo(dirOf(n.x - P.x, n.y - P.y))) { route = null; talkTarget = null; } }
  else { route = null; if (drag && drag.dir !== null) stepTo(drag.dir); }
}
// そのマスに入ると起きる出来事
function checkTrig() {
  if (busy) return false;
  const t = M.trigs.find(t => P.x >= t.x && P.x < t.x + (t.w || 1) && P.y >= t.y && P.y < t.y + (t.h || 1) && (!t.when || t.when(G())));
  if (!t) return false;
  route = null; drag = null; talkTarget = null; run(t.run, t); return true;
}
function touchFoe() {
  if (performance.now() < grace || busy) return false;
  const f = foes.find(f => f.alive && Math.abs(f.x - P.x) + Math.abs(f.y - P.y) <= 1 && !f.from);
  if (f) { fight(f); return true; }
  return false;
}
async function travel(ex) {
  const after = M.exitRun ? M.exitRun(G()) : null; // その地図を出たときに起きる出来事
  busy = true; drag = null; await fadeOut();
  enter(ex.to, ex.tx, ex.ty, ex.dir); busy = false; fadeIn(); checkTrig();
  if (after) run(after);
}
// 道を探す（幅優先）。目的のマスに立てなければ、その隣まで
function findPath(tx, ty, adjacent) {
  const key = (x, y) => y * M.w + x, prev = new Map([[key(P.x, P.y), null]]), q = [[P.x, P.y]];
  const goal = (x, y) => adjacent ? Math.abs(x - tx) + Math.abs(y - ty) === 1 : x === tx && y === ty;
  while (q.length) {
    const [x, y] = q.shift();
    if (goal(x, y)) { const out = []; let k = key(x, y); while (prev.get(k) !== null) { out.unshift({ x: k % M.w, y: Math.floor(k / M.w) }); k = prev.get(k); } return out; }
    for (const [dx, dy] of DIRV) { const nx = x + dx, ny = y + dy, k = key(nx, ny); if (prev.has(k) || occupied(nx, ny)) continue; prev.set(k, key(x, y)); q.push([nx, ny]); }
  }
  return null;
}

// ---------- 敵の動き ----------
function foeTick(now) {
  for (const f of foes) {
    if (!f.alive || f.def.boss || f.def.guard || now < f.next || f.from) continue;
    f.next = now + 650 + Math.random() * 900;
    const dist = Math.abs(f.x - P.x) + Math.abs(f.y - P.y);
    let opts = DIRV.map(([dx, dy]) => [f.x + dx, f.y + dy]);
    if (f.def.chase && dist <= 5) opts.sort((a, b) => (Math.abs(a[0] - P.x) + Math.abs(a[1] - P.y)) - (Math.abs(b[0] - P.x) + Math.abs(b[1] - P.y)));
    else { opts = opts.filter(([x, y]) => Math.abs(x - f.hx) + Math.abs(y - f.hy) <= 3); opts.sort(() => Math.random() - 0.5); if (Math.random() < 0.35) continue; }
    for (const [x, y] of opts) {
      if (x === P.x && y === P.y) { if (now > grace && !busy) fight(f); break; }
      if (occupied(x, y, f) || M.exits.some(e => e.x === x && e.y === y) || (x === P.x && y === P.y)) continue;
      f.from = { x: f.x, y: f.y }; f.t0 = now; f.face = x > f.x ? -1 : x < f.x ? 1 : f.face; f.x = x; f.y = y; break;
    }
  }
}

// ---------- 戦い ----------
// 場所の強さごとの落とし物
const DROPS = {
  1: [{ id: "oakclub", p: 0.04 }, { id: "needle", p: 0.04 }, { id: "ironfist", p: 0.04 }, { id: "tunic", p: 0.04 }, { id: "cloak", p: 0.04 }, { id: "hood", p: 0.04 }, { id: "buckler", p: 0.04 }, { id: "charm", p: 0.03 }],
  3: [{ id: "ironspear", p: 0.05 }, { id: "needle", p: 0.05 }, { id: "ironfist", p: 0.05 }, { id: "leather", p: 0.05 }, { id: "buckler", p: 0.05 }, { id: "hood", p: 0.05 }, { id: "charm", p: 0.04 }, { id: "ring", p: 0.03 }],
  2: [{ id: "oakclub", p: 0.05 }, { id: "needle", p: 0.05 }, { id: "ironfist", p: 0.05 }, { id: "leather", p: 0.04 }, { id: "buckler", p: 0.05 }, { id: "hood", p: 0.05 }, { id: "charm", p: 0.04 }, { id: "ring", p: 0.02 }],
  6: [{ id: "mosssword", p: 0.06 }, { id: "chain", p: 0.10 }, { id: "plate", p: 0.08 }, { id: "ring", p: 0.10 }, { id: "longbow", p: 0.05 }],
};
const CELLS = [[0, 1], [0, 0], [0, 2], [1, 1], [1, 0], [1, 2], [2, 1], [2, 0], [2, 2]];
const BACK = ["mizugumo", "sennen", "kuro_a"]; // 後ろの列に置く者（飛び道具・術）
function makeWave(def) {
  const tier = def.tier || M.tier || 1;
  if (def.boss) return { nm: M.nm, foes: [{ k: def.g[0], big: 1 }], tier, bg: def.bg || M.bg, drops: DROPS[tier] || [] };
  const order = def.g.slice().sort((a, b) => (BACK.includes(a) ? 1 : 0) - (BACK.includes(b) ? 1 : 0));
  return { nm: M.nm, foes: order.map((k, i) => ({ k, c: CELLS[i][0], r: CELLS[i][1] })), tier, bg: def.bg || M.bg, drops: DROPS[tier] || [], noHeart: !G().flags.heartOk }; // 心は、受け取り方を教わってから
}
// いま離れている仲間（物語の都合で一時はずれている人）は、戦いにも出ない
function battleLo() { const g = G(), away = g.away || []; return { form: g.lo.form, pos: g.lo.pos.map(hi => away.includes(hi) ? null : hi) }; }
// 戦って、成長・ごほうび・結果の画面まで。戻り値は "win" / "lose" / "time"
//  wave.solo＝その1人で戦う、wave.fixed＝決まった顔ぶれ、wave.until＝決まったターンで終わる
//  wave.loseOk＝負けても物語が進む（お金もLPも減らない。結果の画面も出さない）
//  wave.retry＝物語の途中の戦い。負けたら、その場でやり直す（お金は減らない）
async function runBattle(wave) {
  SND.se("encounter"); SND.bgm("battle");
  await flash();
  active = false; [...hud.querySelectorAll(".fhud")].forEach(e => e.remove());
  let st;
  for (;;) {
    const g = G();
    // 食べ物は戦いの中で使う。使ったぶんは、勝っても負けても減る。hurt＝傷を負ったままの主人公（HPの割合）
    wave.items = Object.fromEntries(BT.FOODS.filter(k => g.tools[k] > 0).map(k => [k, g.tools[k]]));
    if (g.flags.ally && !wave.guests && !wave.solo) wave.guests = [g.flags.ally]; // 物語で一緒に旅している客分（アスターなど）も戦う
    wave.hp0 = g.flags.hurt ? { 0: g.flags.hurt } : null;
    st = await new Promise(res => BV.start(wave, g.party, battleLo(), res));
    for (const k of BT.FOODS) if (wave.items[k]) g.tools[k] = st.items[k] || 0;
    if (!(wave.loseOk && st.over !== "win")) for (const u of st.party) g.party[u.hi].lp = Math.max(0, u.lp);
    if (st.over === "win") {
      const rng = Math.random, growth = st.party.map(u => ({ hi: u.hi, nm: u.nm, img: u.img, dealt: u.dealt, taken: u.taken, healed: u.healed,
        ups: BT.grow(u.hi, g.party[u.hi], wave.tier, rng), ranks: BT.rankUp(g.party[u.hi], u.used, wave.tier, rng) }));
      await BV.finish(growth);
      const rw = BT.rewards(st, rng);
      g.gold += rw.gold; rw.hearts.forEach(k => { g.hearts[k] = (g.hearts[k] || 0) + 1; }); rw.items.forEach(it => g.bag.push(GS.item(it.id, it.b, it.tag, it.el)));
      rw.mats.forEach(k => { g.mats[k] = (g.mats[k] || 0) + 1; }); rw.tools.forEach(k => { g.tools[k] = (g.tools[k] || 0) + 1; });
      g.wins++; GS.save();
      await UI.result({ win: true, gold: rw.gold, hearts: rw.hearts, items: rw.items, mats: rw.mats, tools: rw.tools, growth, turns: st.turn });
      break;
    }
    if (wave.loseOk) { await BV.finish(null); break; }
    await BV.finish(null); await UI.result({ win: false, time: st.over === "time" });
    if (wave.retry) { GS.restAll(); GS.save(); continue; }
    if (wave.soft) { GS.restAll(); break; } // 負けたら、出来事のほうで少し手前からやり直す（お金は減らない）
    if (st.over === "lose") { g.gold -= Math.floor(g.gold / 10); GS.restAll(); GS.save(); } // 全滅：お金の1割を落として、休んだ所へ戻る
    break;
  }
  active = true; hudBuild(); grace = performance.now() + 1200; fadeIn(); SND.bgm(M.music || null);
  return st.over;
}
// 全滅したら、最後に休んだ所（還り石・寝床）へ戻る
function toHome() { const h = G().home || { map: "hut", x: 3, y: 3 }; enter(h.map, h.x, h.y, 0); fadeIn(); }
async function fight(f) {
  if (busy) return;
  busy = true; route = null; drag = null;
  P.dir = dirOf(f.x - P.x, f.y - P.y);
  const r = await runBattle(makeWave(f.def));
  if (r === "win") { f.alive = false; if (f.def.once) { G().flags["k_" + f.def.once] = 1; GS.save(); } }
  if (r === "win" && M.afterWin && TALK[M.afterWin]) { try { await TALK[M.afterWin](); } catch (e) { console.error(e); } GS.save(); } // 地図ごとの「戦いの後」の出来事
  busy = false;
  if (r === "lose") toHome();
}
// ---------- 出来事の小道具（話しかけたときの出来事から使う） ----------
// 出来事の中の戦い。全滅（負けてもよい戦いは除く）なら宿へ戻り、false を返すので、出来事はそこでやめる
async function battle(wave) {
  const r = await runBattle({ tier: M.tier || 1, bg: M.bg || "meadow", ...wave });
  if (r === "lose" && !wave.loseOk && !wave.soft) { toHome(); return null; }
  return r;
}
async function joinMember(hi) {
  if (!GS.join(hi)) return;
  syncParty(); syncNpcs(); SND.se("get");
  const inFive = GS.fighters().includes(hi);
  await UI.say("", [`${BT.HEROES[hi].nm}が仲間になった！`].concat(inFive ? [] : ["戦う5人がいっぱいなので、控えに入った。（メニューの「陣形」で入れ替えられる）"]));
}
async function leaveMember(hi, lines) {
  if (!GS.leave(hi)) return;
  syncParty(); syncNpcs();
  await UI.say("", lines || [`${BT.HEROES[hi].nm}が一行を離れた。`, "付けていた装備と心は、持ち物に戻った。"]);
}

// ---------- 話す・調べる ----------
function objAt(tx, ty) { return M.objs.find(o => (o.talk || o.text) && tx >= o.x && tx < o.x + (o.w || 1) && ty >= o.y && ty < o.y + (o.h || 1)); }
async function interact(tx, ty) {
  const n = npcs.find(n => n.x === tx && n.y === ty && n.talk);
  const c = chests.find(c => c.x === tx && c.y === ty);
  const o = objAt(tx, ty);
  if (!n && !c && !o) return;
  busy = true; route = null;
  P.dir = dirOf(tx - P.x, ty - P.y);
  GS.hold = true;
  try {
    if (n) { if (n.img) n.d = dirOf(P.x - n.x, P.y - n.y); if (TALK[n.talk]) await TALK[n.talk](n); n.d = n.dir; }
    else if (c) await openChest(c);
    else if (o.talk) { if (TALK[o.talk]) await TALK[o.talk](o); }
    else await UI.say("", o.text);
  } finally { GS.hold = false; GS.save(); busy = false; hudBuild(); }
}
async function openChest(c) {
  if (c.open) { await UI.say("", ["からっぽだ。"]); return; }
  c.open = true; G().chests[c.id] = 1; SND.se("get");
  if (c.gold) { G().gold += c.gold; GS.save(); await UI.say("", ["宝箱を開けた。", `${c.gold} G を手に入れた！`]); return; }
  if (c.tool) { G().tools[c.tool] = (G().tools[c.tool] || 0) + 1; GS.save(); await UI.say("", ["宝箱を開けた。", `${BT.TOOLS[c.tool].nm}を手に入れた！`]); return; }
  const it = GS.item(c.item); G().bag.push(it); GS.save();
  await UI.say("", ["宝箱を開けた。", `${GS.itemName(it)}を手に入れた！`]);
}
const TALK = {}; // 出来事の置き場（名前→出来事）。中身は story.js が入れる

// ---------- 入力 ----------
let lastTap = { t: 0, x: 0, y: 0 }, tapTimer = null;
function toTile(cx, cy) { const r = stage.getBoundingClientRect(), x = (cx - r.left) / DM.K + cam.x, y = (cy - r.top) / DM.K + cam.y; return { tx: Math.floor(x / TD), ty: Math.floor(y / TD) }; }
function inUI(e) { return e.target.closest && e.target.closest(".uilayer,.fbtn,.cardframe"); }
stage.addEventListener("pointerdown", e => {
  if (!active || busy || inUI(e)) return;
  drag = { sx: e.clientX, sy: e.clientY, dir: null, moved: false, id: e.pointerId };
});
stage.addEventListener("pointermove", e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (Math.hypot(dx, dy) > 12) { drag.moved = true; route = null; drag.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 1) : (dy > 0 ? 0 : 3); }
});
const endDrag = e => {
  if (!drag || e.pointerId !== drag.id) return;
  const wasTap = !drag.moved; drag = null;
  if (!wasTap || !active || busy) return;
  const now = performance.now(), { tx, ty } = toTile(e.clientX, e.clientY);
  const thing = npcs.some(n => n.x === tx && n.y === ty && n.talk) || chests.some(c => c.x === tx && c.y === ty) || !!objAt(tx, ty);
  if (thing) { goTalk(tx, ty); lastTap.t = 0; return; }
  const dbl = now - lastTap.t < 320 && Math.abs(lastTap.tx - tx) <= 1 && Math.abs(lastTap.ty - ty) <= 1;
  lastTap = { t: now, tx, ty };
  // 何もない所を1回たたいた＝決定ボタン：向いている先の人・物を調べる（2回たたいて歩くときは、2回目で取り消す）
  clearTimeout(tapTimer); tapTimer = null;
  if (!dbl) tapTimer = setTimeout(() => { tapTimer = null; facing(); }, 330);
  if (dbl) { const f = foes.find(f => f.alive && f.x === tx && f.y === ty); route = findPath(tx, ty, !!f); if (route && !P.from) { const n = route.shift(); if (n) stepTo(dirOf(n.x - P.x, n.y - P.y)); } lastTap.t = 0; }
};
stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);
// 向いている1マス先を調べる。帳場の台などをはさんだ向こうの人にも話せる
function facing() {
  if (!active || busy || P.from || route || drag) return;
  const [dx, dy] = [[0, 1], [-1, 0], [1, 0], [0, -1]][P.dir];
  const has = (x, y) => npcs.some(n => n.x === x && n.y === y && n.talk) || chests.some(c => c.x === x && c.y === y) || !!objAt(x, y);
  let x = P.x + dx, y = P.y + dy;
  if (!has(x, y) && M.objs.some(o => o.t === "counter" && o.x === x && o.y === y)) { x += dx; y += dy; }
  if (has(x, y)) interact(x, y);
}
let talkTarget = null;
function goTalk(tx, ty) {
  // 大きな置き物（舟・家など）は、どのマスを押しても、いちばん近い端から調べる
  const o = !npcs.some(n => n.x === tx && n.y === ty && n.talk) && !chests.some(c => c.x === tx && c.y === ty) && objAt(tx, ty);
  const cells = []; if (o) for (let j = 0; j < (o.h || 1); j++) for (let i = 0; i < (o.w || 1); i++) cells.push([o.x + i, o.y + j]); else cells.push([tx, ty]);
  const near = cells.find(([x, y]) => Math.abs(x - P.x) + Math.abs(y - P.y) === 1);
  if (near) { interact(near[0], near[1]); return; }
  let r = null;
  for (const [x, y] of cells) { const q = findPath(x, y, true); if (q && (!r || q.length < r.length)) { r = q; tx = x; ty = y; } }
  if (!r) return;
  route = r; talkTarget = { tx, ty };
  if (!P.from) { const n = route.shift(); stepTo(dirOf(n.x - P.x, n.y - P.y)); }
}

// ---------- 描く ----------
let cam = { x: 0, y: 0 };
function lerp(o, now) { if (!o.from) return [o.x, o.y]; const k = Math.min(1, (now - o.t0) / STEP); return [o.from.x + (o.x - o.from.x) * k, o.from.y + (o.y - o.from.y) * k]; }
function person(img, x, y, dir, moving, now, lift, n) {
  const col = n && n.col != null ? n.col : moving ? [0, 1, 2, 1][Math.floor(now / 130) % 4] : 1; // col＝決まったコマ（dir 4・col 2 で、目を閉じた姿＝眠っている人）
  if (n && n.head) { // 寝ている人：頭だけを枕の上に（横へずらす量＝ox マス）
    const hx = (x + (n.ox || 0)) * TD + TD / 2, hy = y * TD + 4;
    ctx.drawImage(IM[img], col * 48, 0, 48, 26, Math.round((hx - 12) * 4) / 4, Math.round(hy * 4) / 4, 24, 13); return;
  }
  const px0 = x * TD + TD / 2, py0 = y * TD + TD - 1 - (lift || 0), k = (n && n.psc) || 1;   // psc＝人の型の絵を大きく描く（石の巨人など）
  if (!lift) { ctx.fillStyle = "#0006"; ctx.fillRect(px0 - 6 * k, py0 - 1, 12 * k, 2); }
  ctx.drawImage(IM[img], col * 48, dir * 60, 48, 60, Math.round((px0 - 12 * k) * 4) / 4, Math.round((py0 - 30 * k) * 4) / 4, 24 * k, 30 * k);
}
function cardMark(cx, by) { // 札の印：幅5・高さ7の小さな札（裏の模様）。by＝札の下の端
  const x = Math.round((cx - 2.5) * 4) / 4, y = Math.round((by - 7) * 4) / 4;
  ctx.fillStyle = "#1a1210"; ctx.fillRect(x - 0.5, y - 0.5, 6, 8);
  ctx.fillStyle = "#e8c27a"; ctx.fillRect(x, y, 5, 7);
  ctx.fillStyle = "#8a2a2a"; ctx.fillRect(x + 1, y + 1, 3, 5);
  ctx.fillStyle = "#e8c27a"; ctx.fillRect(x + 2, y + 2.5, 1, 2);
}
function beast(name, x, y, face, sc) { // 魔物の絵の人（立っているだけ）
  const img = IM[name], w = img.naturalWidth * sc, h = img.naturalHeight * sc, cx = x * TD + TD / 2, by = y * TD + TD - 2;
  ctx.fillStyle = "#0007"; ctx.fillRect(cx - w * 0.3, by - 1, w * 0.6, 2);
  ctx.save(); ctx.translate(Math.round((cx + (face < 0 ? w / 2 : -w / 2)) * 4) / 4, Math.round((by - h) * 4) / 4); ctx.scale(face < 0 ? -1 : 1, 1);
  ctx.drawImage(img, 0, 0, w, h); ctx.restore();
}
// 時間帯の色（夕暮れ・夜・夜明け）
const TINT = { dusk: "rgba(190,90,40,0.26)", night: "rgba(14,18,60,0.52)", dawn: "rgba(150,140,190,0.24)" };
function draw(now) {
  requestAnimationFrame(draw);
  if (!active || !M) return;
  if (hudEls.s !== G().flags.s || hudEls.cut !== G().flags.cut) hudBuild(); // 目的が変わったら、左上の目的も書きかえる
  // 歩きの区切り
  for (const o of [P, ...fol, ...foes]) if (o.from && now - o.t0 >= STEP * (o === P || fol.includes(o) ? 1 : 1.8)) { o.from = null; if (o === P) { arrived(); if (!route && talkTarget && !P.from) { const t = talkTarget; talkTarget = null; interact(t.tx, t.ty); } } }
  if (!P.from && !busy && drag && drag.dir !== null) stepTo(drag.dir);
  if (!busy) foeTick(now);
  for (const f of foes) if (f.from && now - f.t0 >= STEP * 1.8) f.from = null;
  const [lx, ly] = lerp(P, now);
  // 画面ぜんぶ（VW×VH）を描く。主人公は文字の枠の真ん中に来るようにする
  const mw = M.w * TD, mh = M.h * TD, VW = DM.VW, VH = DM.VH, cx0 = DM.OX + W / 2, cy0 = DM.OY + H / 2;
  cam.x = mw <= VW ? (mw - VW) / 2 : Math.max(0, Math.min(mw - VW, lx * TD + TD / 2 - cx0));
  cam.y = mh <= VH ? (mh - VH) / 2 : Math.max(0, Math.min(mh - VH, ly * TD + TD / 2 - cy0 + 20));
  cam.x = Math.round(cam.x * 2) / 2; cam.y = Math.round(cam.y * 2) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#0b0d14"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(4, 0, 0, 4, -cam.x * 4, -cam.y * 4);
  if (!M.inside && (mw < VW || mh < VH)) { ctx.fillStyle = forestPat(); ctx.fillRect(cam.x, cam.y, VW, VH); } // 地図より画面が広い所は、森でうめる
  const gc = ground[ground.length > 1 ? Math.floor(now / 700) % 2 : 0];
  ctx.drawImage(gc, 0, 0, gc.width / 2, gc.height / 2);
  // 人・宝箱・敵を奥から
  const ents = [];
  for (const c of chests) ents.push({ y: c.y, f: () => { ctx.save(); ctx.translate(c.x * TD, c.y * TD); ctx.scale(0.5, 0.5); TL.chest(ctx, c.open); ctx.restore(); } });
  for (const n of npcs) ents.push({ y: n.y, f: () => n.mon ? beast(n.mon, n.x, n.y, n.face || 1, n.sc || (n.big ? 0.42 : 0.5)) : person(n.img, n.x, n.y, n.d, false, now, n.lift, n) });
  for (const f of fol) { const [x, y] = lerp(f, now); ents.push({ y, f: () => person(f.img || BT.HEROES[f.hi].img, x, y, f.dir, !!f.from, now) }); }
  if (G().flags.cut === "soretsu") ents.push({ y: ly, f: () => { ctx.save(); ctx.translate(Math.round(lx * TD * 4) / 4, Math.round((ly * TD + (P.from ? Math.abs(Math.sin(now / 90)) * -0.6 : 0)) * 4) / 4); ctx.scale(0.5, 0.5); TL.coffinCart(ctx); ctx.restore(); } }); // 葬列のあいだ、カイは棺の中（荷車を描く）
  else if (M.sea) ents.push({ y: ly, f: () => { const bob = Math.sin(now / 420) * 0.6; ctx.save(); ctx.translate(Math.round((lx * TD + TD / 2 - 36) * 4) / 4, Math.round((ly * TD + TD - 64 + bob) * 4) / 4); ctx.scale(0.5, 0.5); TL.ship(ctx, { left: P.dir === 1 }); ctx.restore(); } }); // 海では、一行は船に乗っている
  else if (!M.noLeader) ents.push({ y: ly, f: () => person(BT.HEROES[LEADER].img, lx, ly, P.dir, !!P.from || (drag && drag.dir !== null), now) }); // noLeader＝主人公がその場に居ない場面（外で待っている など）
  for (const f of foes) if (f.alive) {
    const k = f.from ? Math.min(1, (now - f.t0) / (STEP * 1.8)) : 1, x = f.from ? f.from.x + (f.x - f.from.x) * k : f.x, y = f.from ? f.from.y + (f.y - f.from.y) * k : f.y;
    if (BT.FOES[f.def.k].person) { ents.push({ y, f: () => person(BT.FOES[f.def.k].img, x, y, f.face < 0 ? 1 : 2, !!f.from, now) }); continue; } // 人間の敵（盗賊など）は、人の歩く絵で
    ents.push({ y, f: () => {
      const img = IM[BT.FOES[f.def.k].img], s = BT.FOES[f.def.k].fsc || (f.def.boss ? 0.42 : 0.5), w = img.naturalWidth * s, h = img.naturalHeight * s;
      const bob = Math.round(Math.sin(now / 260 + f.hx) * 1.5 * 2) / 2, cx = x * TD + TD / 2, by = y * TD + TD - 2;
      ctx.fillStyle = "#0007"; ctx.fillRect(cx - w * 0.3, by - 1, w * 0.6, 2);
      ctx.save(); ctx.translate(Math.round((cx + (f.face < 0 ? w / 2 : -w / 2)) * 4) / 4, Math.round((by - h + 0) * 4) / 4); ctx.scale(f.face < 0 ? -1 : 1, 1);
      ctx.drawImage(img, 0, 0, w, h); ctx.restore();
    } });
  }
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  // 札勝負のできる人：頭の上に小さな札の印（ゆっくり上下する）
  if (!G().flags.cut) for (const n of npcs) if (n.card && n.card(G())) {
    const top = n.mon ? (n.y * TD + TD - 2) - IM[n.mon].naturalHeight * (n.sc || (n.big ? 0.42 : 0.5)) : n.y * TD + TD - 1 - (n.lift || 0) - 30 * (n.psc || 1);
    cardMark(n.x * TD + TD / 2, top - 2 + Math.sin(now / 420) * 0.8);
  }
  ctx.drawImage(over, 0, -TD, over.width / 2, over.height / 2);
  if (!G().flags.cut) exitArrows(now);
  // 坑道は暗い（自分のまわりだけ明るい）
  if (M.dark) {
    const cx = lx * TD + TD / 2, cy = ly * TD + TD / 2, gr = ctx.createRadialGradient(cx, cy, 40, cx, cy, 210);
    gr.addColorStop(0, "#0000"); gr.addColorStop(1, "#05030ab8");
    ctx.fillStyle = gr; ctx.fillRect(cam.x, cam.y, DM.VW, DM.VH);
  }
  const tint = TINT[G().flags.time]; if (tint) { ctx.fillStyle = tint; ctx.fillRect(cam.x, cam.y, DM.VW, DM.VH); }
  // 暗転
  const fv = fade + (fadeTo - fade) * 0.25; fade = Math.abs(fv - fadeTo) < 0.01 ? fadeTo : fv;
  if (fade > 0) { ctx.fillStyle = `rgba(5,4,10,${fade})`; ctx.fillRect(cam.x, cam.y, DM.VW, DM.VH); }
}
// 出口の矢印：ゆっくり点滅しながら、外へ向かって少し動く。人が立ちふさいでいる所や、通れない仕掛けがある所には出さない
function exitArrows(now) {
  const k = 0.5 + 0.5 * Math.sin(now / 320);
  for (const a of M.arrows) {
    const [vx, vy] = DIRV[a.dir];
    if (a.tiles.some(t => npcs.some(n => (n.x === t.x && n.y === t.y) || (n.x === t.x - vx && n.y === t.y - vy)) ||
        M.trigs.some(r => r.run !== "minka" && (!r.when || r.when(G())) && [[t.x, t.y], [t.x - vx, t.y - vy]].some(([x, y]) => x >= r.x && x < r.x + (r.w || 1) && y >= r.y && y < r.y + (r.h || 1))))) continue;
    const cx = a.tiles.reduce((s, t) => s + t.x, 0) / a.tiles.length * TD + TD / 2 + vx * (2 + k * 2);
    const cy = a.tiles.reduce((s, t) => s + t.y, 0) / a.tiles.length * TD + TD / 2 + vy * (2 + k * 2);
    ctx.save(); ctx.translate(Math.round(cx * 4) / 4, Math.round(cy * 4) / 4); ctx.rotate(Math.atan2(vy, vx)); ctx.scale(1.25, 1.25); ctx.globalAlpha = 0.45 + 0.55 * k;
    ctx.fillStyle = "#1a1208"; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-3.5, -6.5); ctx.lineTo(-3.5, 6.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#ffe9a8"; ctx.beginPath(); ctx.moveTo(4.5, 0); ctx.lineTo(-2.5, -4.8); ctx.lineTo(-2.5, 4.8); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}
function fadeOut() { fadeTo = 1; return new Promise(r => setTimeout(r, 320)); }
function fadeIn() { fade = 1; fadeTo = 0; }
function flash() { return new Promise(r => { const e = DM.screenLayer("battleflash"); setTimeout(() => { e.remove(); r(); }, 420); }); }

requestAnimationFrame(draw);
root.FD = { start, enter, get active() { return active; },
  battle, joinMember, leaveMember, syncParty, TALK, run,
  api: { fadeOut, fadeIn, enter, sync() { syncNpcs(); syncFoes(); syncParty(); hudBuild(); }, face(dir) { P.dir = dir; }, setFade(v) { fade = v; fadeTo = v; }, pos: () => P, map: () => M },
  _test: { screen: (tx, ty) => { const r = stage.getBoundingClientRect(); return { x: r.left + (tx * TD + TD / 2 - cam.x) * DM.K, y: r.top + (ty * TD + TD / 2 - cam.y) * DM.K }; },
    path: (tx, ty) => { const r = findPath(tx, ty, false); return r ? r.length : -1; }, npcs: () => npcs.map(n => n.id), foes: () => foes.map(f => f.def.id),
    fight: id => fight(foes.find(f => f.def.id === id)), talk: id => { const n = npcs.find(n => n.id === id); return interact(n.x, n.y); }, pos: () => ({ ...P, busy, drag, route, active }) } };
})(window);
