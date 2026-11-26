// 自動で進む戦闘の決まり（画面に触れない部分。ブラウザでもnodeでも動く）
// 設計書「新しいRPG 戦いの決まり」に合わせた形：
//  ・ラウンド制。各ラウンド、生きている全員が速い順に1回ずつ動く。15ラウンドで決着がなければ挑んだ側（仲間）の負け
//  ・通常攻撃でゲージ＋50、攻撃を受けると＋10。アクティブごとに要るゲージが違う。超えた分だけ技が強くなる
//  ・属性6つ（水>火>風>土>水、光⇔闇）。有利なら×1.3。4人の属性の組み方で全体が強くなる
//  ・動けない系（気絶・凍結・石化）は確率でなく条件でかかる。かかったあとは次のラウンドまで効かない（3つで共有）
//  ・前列が残っている間、近接は後列に届かない。「倒したとき」は1人1ラウンド1回まで。割合ダメージには上限
//  ・敵も仲間も同じ決まり。魔物は、自分の心と同じ効果のパッシブを1つ持つ
(function (root) {
"use strict";

const ROUNDS = 15, G_NORMAL = 50, G_HIT = 10, G_MAX = 200;
const ELEM = { water: "水", fire: "火", wind: "風", earth: "土", light: "光", dark: "闇" };
const BEATS = { water: "fire", fire: "wind", wind: "earth", earth: "water", light: "dark", dark: "light" };
const ELEM_X = 1.3;

// ---------- 技 ----------
// k: N=通常攻撃 A=アクティブ P=パッシブ。cost=アクティブに要るゲージ。rng=近接でない（後列からでも弱まらず、後列にも届く）
// on: パッシブが反応する時（start / allyActive / kill / markKill / hitShield / low / always）
const SKILLS = {
  // 剣士
  slash:   { k: "N", nm: "踏み込み", ds: "前の敵1体を斬る", hit: { pow: 1.0 } },
  triple:  { k: "A", nm: "三段斬り", cost: 100, ds: "1体を3回斬る。印のある敵を先に狙う", hit: { pow: 0.75, times: 3, prefer: "mark" } },
  tailwind:{ k: "P", nm: "追い風", ds: "味方がアクティブを使うたび、自分のゲージ＋20", on: "allyActive" },
  finisher:{ k: "P", nm: "とどめの構え", ds: "印のある敵には会心が出やすい（＋40%）", on: "always" },
  // 盾
  bash:    { k: "N", nm: "盾打ち", ds: "1体を打ち、2回狙われやすくなる。印のある敵は気絶させる", hit: { pow: 0.8, stunIfMark: 1 }, taunt: 2 },
  bulwark: { k: "A", nm: "守りの陣", cost: 80, ds: "前列の味方に最大体力の30%の守り、後列に15%", guard: [0.30, 0.15] },
  parry:   { k: "P", nm: "受け流し", ds: "守りで攻撃を受けきったとき、その敵に反撃する", on: "hitShield" },
  stand:   { k: "P", nm: "不屈", ds: "体力が3割を切ると、受けるダメージが4割減る", on: "low" },
  // 魔術師
  ember:   { k: "N", nm: "火の粉", ds: "1体に火の魔法。火傷にする", hit: { pow: 0.9, mag: 1, burn: 2 }, rng: 1 },
  inferno: { k: "A", nm: "業火", cost: 150, ds: "敵全体に火の魔法。全員を火傷にする", hit: { pow: 1.1, mag: 1, all: 1, burn: 2 }, rng: 1 },
  spread:  { k: "P", nm: "燃え広がり", ds: "火傷の敵へのダメージ＋35%（味方全員）", on: "always" },
  embers:  { k: "P", nm: "残り火", ds: "敵が倒れたとき、自分のゲージ＋30", on: "kill" },
  // 弓
  pierce:  { k: "N", nm: "射抜く", ds: "1体を射って印を付ける", hit: { pow: 1.0, mark: 2 }, rng: 1 },
  rain:    { k: "A", nm: "雨の矢", cost: 100, ds: "敵全体を射る。印のある敵には2倍", hit: { pow: 0.75, all: 1, markx: 2 }, rng: 1 },
  signal:  { k: "P", nm: "狩りの合図", ds: "印のある敵が倒れたとき、味方全員のゲージ＋15", on: "markKill" },
  first:   { k: "P", nm: "先手", ds: "戦いの始めにゲージ＋50", on: "start" },
  // 魔物（通常攻撃とアクティブ）
  bite:    { k: "N", nm: "かみつく", hit: { pow: 1.0 } },
  claw:    { k: "N", nm: "ひっかく", hit: { pow: 0.9 } },
  club:    { k: "N", nm: "こん棒", hit: { pow: 1.1 } },
  spit:    { k: "N", nm: "胞子を吐く", hit: { pow: 0.8, mag: 1, poison: 2 }, rng: 1 },
  gust:    { k: "N", nm: "はばたき", hit: { pow: 0.9 }, rng: 1 },
  spore:   { k: "A", nm: "毒の霧", cost: 100, hit: { pow: 0.55, all: 1, mag: 1, poison: 2 }, rng: 1 },
  quake:   { k: "A", nm: "地ならし", cost: 150, ds: "前列の全員をたたきつぶす", hit: { pow: 1.7, front: 1 } },
  // 魔物のパッシブ（＝その魔物の心と同じ効果）
  swift:   { k: "P", nm: "すばしこさ", ds: "戦いの始めにゲージ＋40", on: "start", v: 40 },
  pack:    { k: "P", nm: "群れの怒り", ds: "味方が倒れたとき、自分のゲージ＋40", on: "allyDown", v: 40 },
  keen:    { k: "P", nm: "鋭い角", ds: "会心が出やすい（＋20%）", on: "always" },
  snatch:  { k: "P", nm: "ひったくり", ds: "攻撃した相手のゲージ−15", on: "always" },
  rot:     { k: "P", nm: "腐れ", ds: "毒の相手へのダメージ＋30%", on: "always" },
  rage:    { k: "P", nm: "親玉の怒り", ds: "取り巻きが倒れたとき、自分のゲージ＋50", on: "allyDown", v: 50 },
};

// ---------- 仲間（仮の4人） ----------
const HEROES = [
  { id: "h1", nm: "レオン", img: "person_001", el: "wind",  row: 0, hp: 118, atk: 27, def: 12, mat: 8,  mdf: 9,  spd: 13, crit: 8,  sk: ["slash", "triple", "tailwind", "finisher"] },
  { id: "h2", nm: "アデラ", img: "person_006", el: "earth", row: 0, hp: 150, atk: 19, def: 18, mat: 8,  mdf: 13, spd: 9,  crit: 5,  sk: ["bash", "bulwark", "parry", "stand"] },
  { id: "h3", nm: "カイン", img: "person_032", el: "fire",  row: 1, hp: 84,  atk: 9,  def: 8,  mat: 28, mdf: 15, spd: 11, crit: 6,  sk: ["ember", "inferno", "spread", "embers"] },
  { id: "h4", nm: "ミレイ", img: "person_017", el: "water", row: 1, hp: 92,  atk: 23, def: 9,  mat: 10, mdf: 10, spd: 15, crit: 10, sk: ["pierce", "rain", "signal", "first"] },
];

// ---------- 魔物 ----------
const FOES = {
  bat:    { nm: "夜コウモリ", img: "monster_002", el: "wind",  hp: 100, atk: 31, def: 6,  mat: 6,  mdf: 6,  spd: 14, crit: 5, sk: ["gust", null, "swift"] },
  dog:    { nm: "骨の犬",     img: "monster_006", el: "dark",  hp: 135, atk: 36, def: 9,  mat: 5,  mdf: 5,  spd: 11, crit: 5, sk: ["bite", null, "pack"] },
  rabbit: { nm: "角ウサギ",   img: "monster_003", el: "earth", hp: 90,  atk: 30, def: 5,  mat: 5,  mdf: 5,  spd: 16, crit: 5, sk: ["claw", null, "keen"] },
  goblin: { nm: "ゴブリン",   img: "monster_012", el: "earth", hp: 150, atk: 38, def: 11, mat: 5,  mdf: 7,  spd: 10, crit: 5, sk: ["club", null, "snatch"] },
  shroom: { nm: "毒キノコ",   img: "monster_009", el: "dark",  hp: 110, atk: 12, def: 7,  mat: 32, mdf: 10, spd: 9,  crit: 5, sk: ["spit", "spore", "rot"] },
  orc:    { nm: "オーク",     img: "monster_116", el: "earth", hp: 880, atk: 66, def: 15, mat: 8,  mdf: 10, spd: 8,  crit: 5, sk: ["club", "quake", "rage"], boss: 1 },
};
// 戦場。row 0=前列 1=後列
const WAVES = [
  [{ k: "bat", row: 1 }, { k: "dog", row: 0 }, { k: "rabbit", row: 0 }],
  [{ k: "goblin", row: 0 }, { k: "shroom", row: 1 }, { k: "goblin", row: 0 }],
  [{ k: "goblin", row: 0 }, { k: "orc", row: 0 }, { k: "goblin", row: 0 }],
];

// ---------- 小道具 ----------
function rnd(st) { st.seed = (st.seed * 1103515245 + 12345) & 0x7fffffff; return st.seed / 0x7fffffff; }
function has(u, id) { return u.sk.includes(id); }
function alive(list) { return list.filter(u => !u.dead); }
function all(st) { return [...st.party, ...st.foes]; }
function mates(st, u) { return u.side === 0 ? st.party : st.foes; }
function opps(st, u) { return u.side === 0 ? st.foes : st.party; }
function activeOf(u) { const id = u.sk[1]; return id ? SKILLS[id] : null; }
function costOf(u) { const a = activeOf(u); return a ? a.cost : 0; }

// 4人の属性の組み方による全体の強化
function aura(list) {
  if (list.length < 4) return null;
  const c = {}; list.forEach(u => c[u.el] = (c[u.el] || 0) + 1);
  const n = Object.values(c).sort((a, b) => b - a);
  if (n[0] === 4) return { nm: "属性ぞろい", hp: 0.15, atk: 0.15 };
  if (n[0] === 2 && n[1] === 2) return { nm: "二色の組", hp: 0.06, atk: 0.06 };
  if (n.length === 4) return { nm: "四色の組", hp: 0.06, atk: 0.06 };
  return null;
}
// 戦力（目安の数字）
function power(u) { return Math.round(u.hp * 1.0 + Math.max(u.atk, u.mat) * 7 + (u.def + u.mdf) * 3 + u.spd * 4 + (u.crit || 0) * 2); }
function teamPower(list) { return list.reduce((s, u) => s + power(u), 0); }

function makeUnit(src, side, slot) {
  const u = { ...src, side, slot, max: src.hp, hp: src.hp, gauge: 0, burn: 0, poison: 0, mark: 0, shield: 0, taunt: 0,
    ctl: 0, ctlNm: "", ccFree: 0, sil: 0, trig: {}, dealt: 0, taken: 0, acts: 0, dead: false, downAt: 0 };
  u.sk = src.sk.slice();
  return u;
}
function newBattle(wave, seed, rows) {
  const st = { seed: seed || 1, round: 0, queue: [], log: [], over: null };
  st.party = HEROES.map((h, i) => makeUnit({ ...h, row: rows ? rows[i] : h.row }, 0, i));
  st.foes = WAVES[wave].map((f, i) => makeUnit({ ...FOES[f.k], id: "f" + i, row: f.row }, 1, i));
  for (const side of [st.party, st.foes]) {
    const a = aura(side);
    if (a) for (const u of side) { u.max = u.hp = Math.round(u.max * (1 + a.hp)); u.atk = Math.round(u.atk * (1 + a.atk)); u.mat = Math.round(u.mat * (1 + a.atk)); }
    if (side === st.party) st.aura = a;
  }
  for (const u of all(st)) for (const id of u.sk) {
    const s = id && SKILLS[id]; if (s && s.on === "start") gaugeAdd(st, u, s.v || 50, s.nm);
  }
  nextRound(st);
  return st;
}
function nextRound(st) {
  st.round++;
  // 速い順。同じ速さならくじ
  st.queue = alive(all(st)).map(u => ({ u, r: rnd(st) })).sort((a, b) => b.u.spd - a.u.spd || a.r - b.r).map(x => x.u);
  st.log.push({ t: "round", n: st.round });
}
// 次に動く順（このラウンドの残り＋次のラウンド）
function order(st, n) {
  const rest = st.queue.filter(u => !u.dead);
  const next = alive(all(st)).slice().sort((a, b) => b.spd - a.spd);
  const out = rest.concat(next);
  return out.slice(0, n);
}
function gaugeAdd(st, u, v, why) {
  if (u.dead) return;
  u.gauge = Math.max(0, Math.min(G_MAX, u.gauge + v));
  if (why) st.log.push({ t: "passive", u: u.id, nm: why, v: (v > 0 ? "+" : "") + v });
}
// 「倒したとき」などの反応は1人1ラウンド1回
function once(st, u, key) { if (u.trig[key] === st.round) return false; u.trig[key] = st.round; return true; }

// ---------- 狙う相手 ----------
function targets(st, u, s, h) {
  const foes = alive(opps(st, u)); if (!foes.length) return [];
  const front = foes.filter(f => f.row === 0), back = foes.filter(f => f.row === 1);
  if (h.all) return foes;
  if (h.front) return front.length ? front : back;
  // 近接は前列が残る間、後列に届かない
  const reach = !s.rng && front.length ? front : foes;
  if (u.side === 1) {
    const t = reach.filter(f => f.taunt > 0); if (t.length) return [t[0]];
    // 近接でなければ7割がた前列
    let pool = reach;
    if (s.rng && front.length && back.length) pool = rnd(st) < 0.7 ? front : back;
    return [pool[Math.floor(rnd(st) * pool.length)]];
  }
  if (h.prefer === "mark") { const m = reach.filter(f => f.mark > 0); if (m.length) return [m[0]]; }
  return [reach.slice().sort((a, b) => a.hp - b.hp)[0]];
}

// ---------- ダメージ ----------
function damage(st, a, d, s, h, boost) {
  const magic = Boolean(h.mag);
  const atk = magic ? a.mat : a.atk, def = magic ? d.mdf : d.def;
  let v = atk * h.pow * 60 / (60 + def * 2.2);
  const syn = [];
  if (!magic && a.row === 1 && !s.rng) v *= 0.7;              // 後列から近接
  if (!magic && d.row === 1) v *= 0.85;                       // 後列は物理を受けにくい
  if (BEATS[a.el] === d.el) v *= ELEM_X;                      // 属性の有利
  // 上乗せ：同じ種類は足し算、違う種類は掛け算
  if (d.mark > 0) v *= 1.25;
  if (h.markx && d.mark > 0) v *= h.markx;
  if (d.burn > 0 && alive(mates(st, a)).some(p => has(p, "spread"))) { v *= 1.35; syn.push("燃え広がり"); }
  if (d.poison > 0 && has(a, "rot")) { v *= 1.3; syn.push("腐れ"); }
  if (boost > 0) v *= 1 + boost;                              // あふれたゲージ
  let cr = (a.crit || 0) / 100;
  if (d.mark > 0 && has(a, "finisher")) cr += 0.4;
  if (has(a, "keen")) cr += 0.2;
  const crit = rnd(st) < cr; if (crit) v *= 1.5;
  if (has(d, "stand") && d.hp < d.max * 0.3) v *= 0.6;
  v *= 0.92 + rnd(st) * 0.16;
  v = Math.max(1, Math.round(v));
  let absorbed = 0;
  if (d.shield > 0) { absorbed = Math.min(d.shield, v); d.shield -= absorbed; v -= absorbed; }
  d.hp = Math.max(0, d.hp - v); a.dealt += v; d.taken += v;
  st.log.push({ t: "hit", a: a.id, d: d.id, v, crit, absorbed, adv: BEATS[a.el] === d.el, syn: syn.length ? syn : null });
  gaugeAdd(st, d, G_HIT);
  if (d.hp > 0) {
    if (h.burn) { d.burn = Math.max(d.burn, h.burn); d.burnBy = a; st.log.push({ t: "status", d: d.id, nm: "火傷" }); }
    if (h.poison) { d.poison = Math.max(d.poison, h.poison); d.poisonBy = a; st.log.push({ t: "status", d: d.id, nm: "毒" }); }
    if (h.mark) { d.mark = Math.max(d.mark, h.mark); st.log.push({ t: "status", d: d.id, nm: "印" }); }
    if (h.stunIfMark && d.mark > 0) control(st, d, "気絶");
    if (has(a, "snatch")) gaugeAdd(st, d, -15);
  }
  if (absorbed > 0 && v === 0 && has(d, "parry") && !a.dead && d.hp > 0) {
    st.log.push({ t: "passive", u: d.id, nm: "受け流し" });
    const pv = Math.max(1, Math.round(d.atk * 1.2 * 60 / (60 + a.def * 2.2)));
    a.hp = Math.max(0, a.hp - pv); d.dealt += pv; a.taken += pv;
    st.log.push({ t: "hit", a: d.id, d: a.id, v: pv, counter: 1 });
    if (a.hp <= 0) kill(st, a, d);
  }
  if (d.hp <= 0) kill(st, d, a);
  return v;
}
// 動けない系：かかったあと、次のラウンドの終わりまでは効かない（気絶・凍結・石化で共有）
function control(st, d, nm) {
  if (d.dead || d.ctl > 0 || st.round <= d.ccFree) { st.log.push({ t: "resist", d: d.id, nm }); return false; }
  d.ctl = 1; d.ctlNm = nm; st.log.push({ t: "status", d: d.id, nm }); return true;
}
function kill(st, d, a) {
  if (d.dead) return;
  d.dead = true; d.downAt = st.round; st.log.push({ t: "down", d: d.id, r: st.round });
  const killers = alive(opps(st, d)), friends = alive(mates(st, d));
  for (const p of killers) if (has(p, "embers") && once(st, p, "embers")) gaugeAdd(st, p, 30, "残り火");
  if (d.mark > 0) { const sg = killers.find(p => has(p, "signal")); if (sg && once(st, sg, "signal")) { st.log.push({ t: "passive", u: sg.id, nm: "狩りの合図" }); for (const p of killers) gaugeAdd(st, p, 15); } }
  for (const p of friends) for (const id of p.sk) { const s = id && SKILLS[id]; if (s && s.on === "allyDown" && once(st, p, id)) gaugeAdd(st, p, s.v, s.nm); }
}
function useSkill(st, u, id, boost) {
  const s = SKILLS[id];
  st.log.push({ t: "act", u: u.id, skill: id, nm: s.nm, k: s.k, boost: Math.round((boost || 0) * 100) });
  if (s.guard) for (const p of alive(mates(st, u))) { const g = Math.round(p.max * (p.row === 0 ? s.guard[0] : s.guard[1]) * (1 + (boost || 0))); p.shield = Math.max(p.shield, g); st.log.push({ t: "shield", d: p.id, v: g }); }
  if (s.taunt) u.taunt = s.taunt;
  if (s.hit) {
    const h = s.hit;
    for (const t of targets(st, u, s, h)) {
      for (let k = 0; k < (h.times || 1); k++) { if (t.dead || u.dead) break; damage(st, u, t, s, h, boost); }
      if (u.dead) return;
    }
  }
}
// 火傷・毒：自分の番の終わりに減る。最大体力の割合で、かけた者の力の1.5倍まで
function tick(st, u, key, nm) {
  if (u[key] <= 0 || u.dead) return;
  const by = u[key + "By"], cap = by ? Math.max(by.atk, by.mat) * 1.5 : 999;
  const v = Math.max(1, Math.round(Math.min(u.max * 0.08, cap)));
  u.hp = Math.max(0, u.hp - v); u[key]--;
  if (by) by.dealt += v;
  st.log.push({ t: "dot", d: u.id, v, nm });
  if (u.hp <= 0) kill(st, u, by);
}
// 1人ぶん進める。戻り値は動いた人
function step(st) {
  if (st.over) return null;
  while (true) {
    while (st.queue.length && st.queue[0].dead) st.queue.shift();
    if (st.queue.length) break;
    if (st.round >= ROUNDS) { st.over = "time"; st.log.push({ t: "timeup" }); return null; }
    nextRound(st);
  }
  const u = st.queue.shift(); u.acts++;
  if (u.ctl > 0) {
    u.ctl = 0; u.ccFree = st.round + 1;
    st.log.push({ t: "skip", u: u.id, nm: u.ctlNm });
  } else {
    const a = activeOf(u);
    if (a && u.gauge >= a.cost && u.sil <= 0) {
      const boost = (u.gauge - a.cost) / 200; u.gauge = 0;
      useSkill(st, u, u.sk[1], boost);
      for (const p of alive(mates(st, u))) if (p !== u && has(p, "tailwind")) gaugeAdd(st, p, 20, "追い風");
    } else {
      useSkill(st, u, u.sk[0], 0);
      gaugeAdd(st, u, G_NORMAL);
    }
  }
  // 番の終わり
  tick(st, u, "burn", "火傷"); tick(st, u, "poison", "毒");
  if (u.taunt > 0) u.taunt--;
  if (u.mark > 0) u.mark--;
  if (u.sil > 0) u.sil--;
  checkEnd(st);
  return u;
}
function checkEnd(st) {
  if (!alive(st.foes).length) st.over = "win"; else if (!alive(st.party).length) st.over = "lose";
}
const api = { SKILLS, HEROES, FOES, WAVES, ELEM, BEATS, ROUNDS, newBattle, step, order, alive, costOf, activeOf, power, teamPower, aura, makeUnit };
if (typeof module !== "undefined") module.exports = api; else root.BT = api;
})(this);
