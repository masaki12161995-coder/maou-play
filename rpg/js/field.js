// フィールド：マスの上を歩く。指でなぞると歩き続け、2回たたくとそこまで歩く。1回たたくと話す・調べる
// 仲間は後ろをついて歩く。敵は地図の上に見えていて、ぶつかると戦い
(function (root) {
"use strict";
const { W, H, hud, stage } = DM, d = DM.d, px = DM.px, div = DM.div;
const IM = window.IMG;
const cv = document.getElementById("field"), ctx = cv.getContext("2d");
const TD = 24, TP = TL.T;         // 1マス＝24ドット（絵は48点）
const STEP = 170;                 // 1歩の時間
const WALK = new Set([".", "=", "c", "b", "s", "_", "r"]);
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
  const need = Math.ceil(H / TD) + 1 - M.g.length;
  if (need > 0) {
    const top = Math.ceil(need / 2), bot = need - top, w = M.g[0].length, rowT = () => Array(w).fill("T");
    M.g = [...Array(top).fill(0).map(rowT), ...M.g, ...Array(bot).fill(0).map(rowT)];
    for (const list of [M.objs, M.exits, M.npcs, M.foes, M.chests]) for (const o of list) o.y += top;
    M.padTop = top;
  } else M.padTop = 0;
  M.h = M.g.length; M.w = M.g[0].length;
  blocked = M.g.map(row => row.map(ch => !WALK.has(ch)));
  for (const o of M.objs) {
    const w = o.w || (o.t === "mine" ? 2 : 1), h = o.h || (o.t === "mine" ? 2 : 1);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (blocked[o.y + j]) blocked[o.y + j][o.x + i] = true;
  }
  for (const e of M.exits) blocked[e.y][e.x] = false;
  const hasWater = M.g.some(r => r.includes("~") || r.includes("b") || r.includes("s"));
  ground = [paint(0)]; if (hasWater) ground.push(paint(1));
  over = paintOver();
  npcs = M.npcs.map(n => ({ ...n, d: n.dir }));
  chests = M.chests.map(c => ({ ...c, open: !!G().chests[c.id] }));
  foes = M.foes.filter(f => !(f.boss && G().flags.boss)).map(f => ({ def: f, x: f.x, y: f.y, fx: f.x, fy: f.y, hx: f.x, hy: f.y, from: null, t0: 0, next: performance.now() + 400 + Math.random() * 900, face: 1, alive: true }));
}
function paint(frame) {
  const c = document.createElement("canvas"); c.width = M.w * TP; c.height = M.h * TP;
  const x = c.getContext("2d");
  for (let ty = 0; ty < M.h; ty++) for (let tx = 0; tx < M.w; tx++) {
    const ch = M.g[ty][tx], nb = (dx, dy) => { const v = chAt(tx + dx, ty + dy); return v === "#" ? ch : v; };
    x.save(); x.translate(tx * TP, ty * TP);
    ({ ".": () => TL.grass(x, tx, ty), "=": () => TL.dirt(x, tx, ty, nb), c: () => TL.cobble(x, tx, ty, nb), T: () => TL.treeBase(x, tx, ty, nb),
       "~": () => TL.water(x, tx, ty, nb, frame), b: () => TL.bridge(x, tx, ty, nb, frame), s: () => TL.stones(x, tx, ty, nb, frame), R: () => TL.rockWall(x, tx, ty, nb),
       f: () => TL.fence(x, tx, ty, nb), W: () => TL.caveWall(x, tx, ty, nb), _: () => TL.caveFloor(x, tx, ty), r: () => TL.rail(x, tx, ty), x: () => TL.rubble(x) }[ch] || (() => TL.grass(x, tx, ty)))();
    x.restore();
  }
  for (const o of M.objs) {
    x.save(); x.translate(o.x * TP, o.y * TP);
    if (o.t === "house") TL.house(x, o.w, o.h, o);
    else if (o.t === "well") TL.well(x);
    else if (o.t === "stall") TL.stall(x, o.w);
    else if (o.t === "sign") TL.sign(x);
    else if (o.t === "mine") TL.mineGate(x);
    x.restore();
  }
  return c;
}
function paintOver() { // 木の葉（上の層）
  const c = document.createElement("canvas"); c.width = M.w * TP; c.height = (M.h + 1) * TP;
  const x = c.getContext("2d");
  for (let ty = 0; ty < M.h; ty++) for (let tx = 0; tx < M.w; tx++) if (M.g[ty][tx] === "T") { x.save(); x.translate(tx * TP, ty * TP); x.translate(0, -TP / 2 + TP); TL.treeTop(x, tx, ty); x.restore(); }
  return c;
}

// ---------- 入る・出る ----------
function enter(id, x, y, dir) { // x,y は足す前の地図の座標
  build(id); y += M.padTop;
  P = { x, y, dir: dir || 0, fx: x, fy: y, from: null, t0: 0 };
  hist = Array(6).fill(0).map(() => ({ x, y }));
  fol = BT.HEROES.map((h, i) => i).filter(i => i !== LEADER).map(hi => ({ hi, x, y, fx: x, fy: y, from: null, dir: dir || 0 }));
  const g = G(); g.map = id; g.x = x; g.y = y - M.padTop; g.dir = P.dir; GS.save();
  route = null; grace = performance.now() + 800;
  hudBuild();
}
async function start() {
  const g = G(); active = true; enter(g.map, g.x, g.y, g.dir); fadeIn();
  if (!g.flags.intro) { busy = true; await new Promise(r => setTimeout(r, 500)); await UI.say("", ["旅の一行は、街道ぞいの小さな町にたどり着いた。", "町の長が、なにやら困っているらしい。"]); g.flags.intro = 1; GS.save(); busy = false; }
}

// ---------- 上の飾り ----------
let hudEls = {};
function hudBuild() {
  if (!active) return;
  [...hud.querySelectorAll(".fhud")].forEach(e => e.remove());
  const nm = px(div("px frame fhud place", `<b>${M.nm}</b><span>${G().gold.toLocaleString()} G</span>`), 8, 46, 150, 24); nm.style.fontSize = d(10); hud.appendChild(nm);
  const mb = px(div("px frame fhud fbtn", "≡"), 263, 46, 30, 26); mb.style.fontSize = d(16);
  mb.onclick = async e => { e.stopPropagation(); if (busy) return; busy = true; route = null; await UI.menu(); busy = false; hudBuild(); };
  hud.appendChild(mb);
  hudEls = { nm };
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
  hist.unshift({ x: nx, y: ny }); hist.length = 6;
  fol.forEach((f, i) => { const to = hist[i + 1]; if (to.x !== f.x || to.y !== f.y) { f.from = { x: f.x, y: f.y }; f.t0 = P.t0; f.dir = dirOf(to.x - f.x, to.y - f.y); f.x = to.x; f.y = to.y; } else f.from = null; });
  return true;
}
function arrived() {
  const g = G(); g.x = P.x; g.y = P.y - M.padTop; g.dir = P.dir;
  const ex = M.exits.find(e => e.x === P.x && e.y === P.y);
  if (ex) { route = null; travel(ex); return; }
  if (touchFoe()) return;
  if (route && route.length) { const n = route.shift(); if (!stepTo(dirOf(n.x - P.x, n.y - P.y))) { route = null; talkTarget = null; } }
  else { route = null; if (drag && drag.dir !== null) stepTo(drag.dir); }
}
function touchFoe() {
  if (performance.now() < grace || busy) return false;
  const f = foes.find(f => f.alive && Math.abs(f.x - P.x) + Math.abs(f.y - P.y) <= 1 && !f.from);
  if (f) { fight(f); return true; }
  return false;
}
async function travel(ex) {
  busy = true; drag = null; await fadeOut();
  enter(ex.to, ex.tx, ex.ty, ex.dir); busy = false; fadeIn();
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
const DROPS = {
  1: [{ id: "ironsword", p: 0.04 }, { id: "leather", p: 0.05 }, { id: "hood", p: 0.04 }, { id: "buckler", p: 0.04 }, { id: "shortbow", p: 0.03 }],
  2: [{ id: "ironspear", p: 0.05 }, { id: "plate", p: 0.04 }, { id: "chain", p: 0.03 }, { id: "ring", p: 0.04 }, { id: "oakstaff", p: 0.04 }],
  3: [{ id: "knightswd", p: 0.10 }, { id: "longbow", p: 0.08 }, { id: "sagestaff", p: 0.08 }, { id: "chain", p: 0.10 }, { id: "charm", p: 0.08 }],
};
const CELLS = [[0, 1], [0, 0], [0, 2], [1, 1], [1, 0], [1, 2], [2, 1], [2, 0], [2, 2]];
function makeWave(def) {
  const tier = def.tier || M.tier || 1;
  if (def.boss) return { nm: "坑道の主", foes: [{ k: "orc", big: 1 }], tier, bg: def.bg || M.bg, drops: [{ id: "knightswd", p: 1 }] };
  // 前の列に打たれ強い者、後ろに飛ぶ者・術の者
  const order = def.g.slice().sort((a, b) => (["bat", "shroom"].includes(a) ? 1 : 0) - (["bat", "shroom"].includes(b) ? 1 : 0));
  return { nm: M.nm, foes: order.map((k, i) => ({ k, c: CELLS[i][0], r: CELLS[i][1] })), tier, bg: def.bg || M.bg, drops: DROPS[tier] || [] };
}
async function fight(f) {
  if (busy) return;
  busy = true; route = null; drag = null;
  P.dir = dirOf(f.x - P.x, f.y - P.y);
  if (f.def.boss) await UI.say("オーク", ["グオオオ……！", "ここはオレの寝床だ。荷車の食い物は、ぜんぶオレのものだ！"]);
  await flash();
  active = false; [...hud.querySelectorAll(".fhud")].forEach(e => e.remove());
  const wave = makeWave(f.def);
  BV.start(wave, G().party, G().lo, st => after(f, st, wave));
}
async function after(f, st, wave) {
  const g = G();
  for (const u of st.party) g.party[u.hi].lp = Math.max(0, u.lp);
  if (st.over === "win") {
    const rng = Math.random, growth = st.party.map(u => ({ hi: u.hi, nm: u.nm, img: u.img, dealt: u.dealt, taken: u.taken, healed: u.healed, ups: BT.grow(u.hi, g.party[u.hi], wave.tier, rng) }));
    await BV.finish(growth);
    const rw = BT.rewards(st, rng);
    g.gold += rw.gold; rw.hearts.forEach(k => { g.hearts[k] = (g.hearts[k] || 0) + 1; }); rw.items.forEach(it => g.bag.push(GS.item(it.id, it.b, it.tag)));
    g.wins++; f.alive = false; if (f.def.boss) g.flags.boss = 1;
    GS.save();
    await UI.result({ win: true, gold: rw.gold, hearts: rw.hearts, items: rw.items, growth, turns: st.turn });
    active = true; hudBuild(); grace = performance.now() + 1200; busy = false; fadeIn();
    if (f.def.boss) { await UI.say("", ["坑道の主を倒した！", "これで街道の荷車も通れるはずだ。町の長に知らせよう。"]); }
  } else if (st.over === "lose") {
    await BV.finish(null); await UI.result({ win: false });
    g.gold = Math.floor(g.gold / 2); GS.restAll(); GS.save();
    active = true; busy = false; enter("town", 6, 13, 3); fadeIn();
  } else {
    await BV.finish(null); await UI.result({ win: false, time: true });
    active = true; hudBuild(); grace = performance.now() + 1500; busy = false; fadeIn();
  }
}

// ---------- 話す・調べる ----------
async function interact(tx, ty) {
  const n = npcs.find(n => n.x === tx && n.y === ty);
  const c = chests.find(c => c.x === tx && c.y === ty);
  const o = M.objs.find(o => o.t === "sign" && o.x === tx && o.y === ty);
  if (!n && !c && !o) return;
  busy = true; route = null;
  P.dir = dirOf(tx - P.x, ty - P.y);
  if (n) { n.d = dirOf(P.x - n.x, P.y - n.y); await (TALK[n.talk] || (() => UI.say(n.nm, ["……"])))(n); n.d = n.dir; }
  else if (c) await openChest(c);
  else await UI.say("", o.text);
  busy = false; hudBuild();
}
async function openChest(c) {
  if (c.open) { await UI.say("", ["からっぽだ。"]); return; }
  c.open = true; G().chests[c.id] = 1;
  if (c.gold) { G().gold += c.gold; GS.save(); await UI.say("", ["宝箱を開けた。", `${c.gold} G を手に入れた！`]); return; }
  const it = GS.item(c.item); G().bag.push(it); GS.save();
  await UI.say("", ["宝箱を開けた。", `${GS.itemName(it)}を手に入れた！`]);
}
const stage1 = () => !!G().flags.boss;
const TALK = {
  elder: n => UI.say(n.nm, stage1() ? ["坑道の主を追い払ってくれたそうじゃな！", "これで荷車が通れる。町の皆にかわって礼を言うぞ。", "崖崩れの片付けがすんだら、北へも行けるようになる。それまでゆっくりしていっておくれ。"]
    : ["わしはこの町の長じゃ。", "街道の先の古い坑道に、大きなオークが住みついてしもうた。", "荷車が襲われて、町に品が届かん。どうか追い払ってはくれんか。"]),
  inn: async n => {
    const k = await UI.choose(n.nm, "一晩 20G だよ。泊まっていくかい？", ["泊まる", "やめる"]);
    if (k !== 0) return;
    if (G().gold < 20) { await UI.say(n.nm, ["おや、お金が足りないようだね。"]); return; }
    G().gold -= 20; GS.restAll(); GS.save(); await fadeOut(); await new Promise(r => setTimeout(r, 400)); fadeIn();
    await UI.say(n.nm, ["よく眠れたかい？ 行ってらっしゃい。"]);
  },
  shop: async n => { await UI.say(n.nm, ["いらっしゃい！ 見ていっておくれ。"]); await UI.shop("武器屋", ["ironsword", "knightswd", "oakstaff", "shortbow", "longbow", "ironspear", "leather", "chain", "robe", "buckler", "hood", "ring"]); },
  casino: async n => {
    const k = await UI.choose(n.nm, "ここは賭場だよ。何で遊んでいく？", ["スロット・チンチロ", "札で勝負", "やめる"]);
    if (k === 0) await UI.cards("casino"); else if (k === 1) await UI.cards("duel", 2);
  },
  duel0: async n => { const k = await UI.choose(n.nm, stage1() ? "坑道が静かになって荷が軽いぜ。景気づけに一勝負どうだ？" : "よう、札で勝負しようぜ！ 1枚ずつ賭けてな。", ["勝負する", "やめる"]); if (k === 0) await UI.cards("duel", 0); },
  duel1: async n => { const k = await UI.choose(n.nm, "札は正直じゃよ。ひとつ読んでみるかい？", ["勝負する", "やめる"]); if (k === 0) await UI.cards("duel", 1); },
  cardshop: async n => { await UI.say(n.nm, ["札はいらんかね？ 町の外で見かける魔物の札だよ。"]); await UI.cards("shop"); },
  kid: n => UI.say(n.nm, stage1() ? ["ねえねえ、坑道のオークやっつけたの？ すっげー！", "東の林の宝箱は、もう見た？"] : ["東の川を飛び石で渡った先の林には、すっごく強い骨の犬がいるんだって！", "宝箱を守ってるってうわさだよ。"]),
  lady: n => UI.say(n.nm, ["魔物を倒すと、まれに『心』を落とすの。", "仲間に宿すと、能力の伸び方や使える技が変わるそうよ。"].concat(stage1() ? ["坑道が静かになって、夜もよく眠れるわ。"] : [])),
  gate: n => UI.say(n.nm, stage1() ? ["あんたらのおかげで見回りが楽になったよ。"] : ["街道に出るなら気をつけな。魔物がうろついてる。", "坑道は街道を北へ行って、西へ曲がった先だ。"]),
  slide: n => UI.say(n.nm, ["この先は崖崩れで道がふさがってる。片付くまで通せないよ。"].concat(stage1() ? ["坑道の件は聞いたよ。たいしたもんだ。"] : [])),
};

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
  const thing = npcs.some(n => n.x === tx && n.y === ty) || chests.some(c => c.x === tx && c.y === ty) || M.objs.some(o => o.t === "sign" && o.x === tx && o.y === ty);
  if (thing) { goTalk(tx, ty); lastTap.t = 0; return; }
  const dbl = now - lastTap.t < 320 && Math.abs(lastTap.tx - tx) <= 1 && Math.abs(lastTap.ty - ty) <= 1;
  lastTap = { t: now, tx, ty };
  if (dbl) { const f = foes.find(f => f.alive && f.x === tx && f.y === ty); route = findPath(tx, ty, !!f); if (route && !P.from) { const n = route.shift(); if (n) stepTo(dirOf(n.x - P.x, n.y - P.y)); } lastTap.t = 0; }
};
stage.addEventListener("pointerup", endDrag); stage.addEventListener("pointercancel", endDrag);
let talkTarget = null;
function goTalk(tx, ty) {
  if (Math.abs(tx - P.x) + Math.abs(ty - P.y) === 1) { interact(tx, ty); return; }
  const r = findPath(tx, ty, true); if (!r) return;
  route = r; talkTarget = { tx, ty };
  if (!P.from) { const n = route.shift(); stepTo(dirOf(n.x - P.x, n.y - P.y)); }
}

// ---------- 描く ----------
let cam = { x: 0, y: 0 };
function lerp(o, now) { if (!o.from) return [o.x, o.y]; const k = Math.min(1, (now - o.t0) / STEP); return [o.from.x + (o.x - o.from.x) * k, o.from.y + (o.y - o.from.y) * k]; }
function person(img, x, y, dir, moving, now, alpha) {
  const col = moving ? [0, 1, 2, 1][Math.floor(now / 130) % 4] : 1;
  const px0 = x * TD + TD / 2, py0 = y * TD + TD - 1;
  ctx.fillStyle = "#0006"; ctx.fillRect(px0 - 6, py0 - 1, 12, 2);
  ctx.drawImage(IM[img], col * 48, dir * 60, 48, 60, Math.round((px0 - 12) * 4) / 4, Math.round((py0 - 30) * 4) / 4, 24, 30);
}
function draw(now) {
  requestAnimationFrame(draw);
  if (!active || !M) return;
  // 歩きの区切り
  for (const o of [P, ...fol, ...foes]) if (o.from && now - o.t0 >= STEP * (o === P || fol.includes(o) ? 1 : 1.8)) { o.from = null; if (o === P) { arrived(); if (!route && talkTarget && !P.from) { const t = talkTarget; talkTarget = null; interact(t.tx, t.ty); } } }
  if (!P.from && !busy && drag && drag.dir !== null) stepTo(drag.dir);
  if (!busy) foeTick(now);
  for (const f of foes) if (f.from && now - f.t0 >= STEP * 1.8) f.from = null;
  const [lx, ly] = lerp(P, now);
  const mw = M.w * TD, mh = M.h * TD;
  cam.x = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(mw - W, lx * TD + TD / 2 - W / 2));
  cam.y = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(mh - H, ly * TD + TD / 2 - H / 2 + 20));
  cam.x = Math.round(cam.x * 2) / 2; cam.y = Math.round(cam.y * 2) / 2;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#0b0d14"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(4, 0, 0, 4, -cam.x * 4, -cam.y * 4);
  const gc = ground[ground.length > 1 ? Math.floor(now / 700) % 2 : 0];
  ctx.drawImage(gc, 0, 0, gc.width / 2, gc.height / 2);
  // 人・宝箱・敵を奥から
  const ents = [];
  for (const c of chests) ents.push({ y: c.y, f: () => { ctx.save(); ctx.translate(c.x * TD, c.y * TD); ctx.scale(0.5, 0.5); TL.chest(ctx, c.open); ctx.restore(); } });
  for (const n of npcs) ents.push({ y: n.y, f: () => person(n.img, n.x, n.y, n.d, false, now) });
  for (const f of fol) { const [x, y] = lerp(f, now); ents.push({ y, f: () => person(BT.HEROES[f.hi].img, x, y, f.dir, !!f.from, now) }); }
  ents.push({ y: ly, f: () => person(BT.HEROES[LEADER].img, lx, ly, P.dir, !!P.from || (drag && drag.dir !== null), now) });
  for (const f of foes) if (f.alive) {
    const k = f.from ? Math.min(1, (now - f.t0) / (STEP * 1.8)) : 1, x = f.from ? f.from.x + (f.x - f.from.x) * k : f.x, y = f.from ? f.from.y + (f.y - f.from.y) * k : f.y;
    ents.push({ y, f: () => {
      const img = IM[BT.FOES[f.def.k].img], s = f.def.boss ? 0.42 : 0.5, w = img.naturalWidth * s, h = img.naturalHeight * s;
      const bob = Math.round(Math.sin(now / 260 + f.hx) * 1.5 * 2) / 2, cx = x * TD + TD / 2, by = y * TD + TD - 2;
      ctx.fillStyle = "#0007"; ctx.fillRect(cx - w * 0.3, by - 1, w * 0.6, 2);
      ctx.save(); ctx.translate(Math.round((cx + (f.face < 0 ? w / 2 : -w / 2)) * 4) / 4, Math.round((by - h + (BT.FOES[f.def.k].img === "monster_002" ? bob - 6 : 0)) * 4) / 4); ctx.scale(f.face < 0 ? -1 : 1, 1);
      ctx.drawImage(img, 0, 0, w, h); ctx.restore();
    } });
  }
  ents.sort((a, b) => a.y - b.y).forEach(e => e.f());
  ctx.drawImage(over, 0, -TD, over.width / 2, over.height / 2);
  // 坑道は暗い（自分のまわりだけ明るい）
  if (M.dark) {
    const cx = lx * TD + TD / 2, cy = ly * TD + TD / 2, gr = ctx.createRadialGradient(cx, cy, 40, cx, cy, 210);
    gr.addColorStop(0, "#0000"); gr.addColorStop(1, "#05030ab8");
    ctx.fillStyle = gr; ctx.fillRect(cam.x, cam.y, W, H);
  }
  // 暗転
  const fv = fade + (fadeTo - fade) * 0.25; fade = Math.abs(fv - fadeTo) < 0.01 ? fadeTo : fv;
  if (fade > 0) { ctx.fillStyle = `rgba(5,4,10,${fade})`; ctx.fillRect(cam.x, cam.y, W, H); }
}
function fadeOut() { fadeTo = 1; return new Promise(r => setTimeout(r, 320)); }
function fadeIn() { fade = 1; fadeTo = 0; }
function flash() { return new Promise(r => { const e = px(div("px battleflash", ""), 0, 0, W, H); hud.appendChild(e); setTimeout(() => { e.remove(); r(); }, 420); }); }

requestAnimationFrame(draw);
root.FD = { start, enter, get active() { return active; },
  _test: { fight: id => fight(foes.find(f => f.def.id === id)), talk: id => { const n = npcs.find(n => n.id === id); return interact(n.x, n.y); }, pos: () => ({ ...P, busy, drag, route, active }) } };
})(window);
