// 戦闘の決まり（ロマサガRS型）。画面に触れない部分。ブラウザでもnodeでも動く
// 設計書「新しいRPG 戦いの決まり（ロマサガRS型）」に合わせる
//  ・コマンドバトル。ターンの始めにBP＋3（初期10・上限20）→ 仲間の行動を選ぶ → 素早さ±10%のゆれで速い順に動く
//  ・狙う敵は1体を全員で共有（敵を押して決める）。オートは「通常」（通常攻撃だけ）と「全力」（技も使う）
//  ・ダメージ＝（武器威力×1.5＋技威力）×（1＋攻める能力×4−守る能力×1.5）÷100×倍率。会心なし
//  ・8属性（斬打突熱冷雷陽陰）と耐性。陣形4つの場所。連携。LP
(function (root) {
"use strict";

const BP0 = 10, BP_TURN = 3, BP_MAX = 20;
const ATTR = ["斬", "打", "突", "熱", "冷", "雷", "陽", "陰"];
const RANK = { N: 7, E: 12, D: 18, C: 25, B: 33, A: 42, S: 52, SS: 64 };
const ST_NM = { str: "腕力", vit: "体力", dex: "器用さ", agi: "素早さ", int: "知力", wil: "精神", lov: "愛", cha: "魅力" };
// 武器：攻める能力と、武器そのものの威力・属性
const WEAPON = {
  sword: { nm: "剣", st: "str", pow: 12, at: ["斬"] },
  club:  { nm: "棍棒", st: "str", pow: 12, at: ["打"] },
  staff: { nm: "杖", st: "str", pow: 6, at: ["打"] },
  bow:   { nm: "弓", st: "dex", pow: 11, at: ["突"] },
  fang:  { nm: "牙", st: "str", pow: 10, at: ["突"] },
  fist:  { nm: "こぶし", st: "str", pow: 10, at: ["打"] },
};

// ---------- 技（BPを使う）と通常攻撃 ----------
// tg: one=狙った敵1体 all=敵全体 rand=ランダムにn回 self=自分 allies=味方全体
const SKILLS = {
  attack:   { nm: "通常攻撃", bp: 0, rank: "N", tg: "one", ds: "武器で攻撃する" },
  // レオン（剣）
  gale:     { nm: "疾風斬り", bp: 3, rank: "D", tg: "one", at: ["斬"], ds: "敵1体を斬る" },
  twin:     { nm: "二段斬り", bp: 6, rank: "C", tg: "one", hits: 2, at: ["斬"], ds: "敵1体を2回斬る" },
  whirl:    { nm: "大旋風", bp: 10, rank: "B", tg: "all", at: ["斬"], ds: "敵全体を斬る" },
  // アデラ（棍棒）
  shieldbash:{ nm: "盾打ち", bp: 2, rank: "E", tg: "one", at: ["打"], stun: 60, ds: "敵1体を打つ。たまにスタン" },
  guard:    { nm: "かばう構え", bp: 4, tg: "self", cover: 3, ds: "3ターン狙われ役、被害半分" },
  quake:    { nm: "地割り", bp: 8, rank: "B", tg: "all", at: ["打"], ds: "敵全体を打つ" },
  // カイン（杖・術）
  fireball: { nm: "火の玉", bp: 3, rank: "D", tg: "one", at: ["熱"], magic: 1, ds: "敵1体を焼く" },
  flameband:{ nm: "炎の帯", bp: 7, rank: "C", tg: "all", at: ["熱"], magic: 1, ds: "敵全体を焼く" },
  scorch:   { nm: "灼熱", bp: 12, rank: "A", tg: "one", at: ["熱"], magic: 1, ds: "敵1体を強く焼く" },
  // ミレイ（弓）
  aim:      { nm: "狙い撃ち", bp: 2, rank: "D", tg: "one", at: ["突"], ds: "敵1体を射る" },
  healrain: { nm: "癒しの水", bp: 5, tg: "allies", heal: 30, ds: "全体回復。倒れた者も起こす" },
  shower:   { nm: "五月雨撃ち", bp: 9, rank: "E", tg: "rand", hits: 5, at: ["突"], ds: "ランダムな敵を5回射る" },
  // 魔物の技
  spore:    { nm: "毒の胞子", bp: 0, rank: "E", tg: "one", at: ["陰"], magic: 1, poison: 70 },
  stomp:    { nm: "地ならし", bp: 0, rank: "C", tg: "all", at: ["打"] },
  fury:     { nm: "怒りの大振り", bp: 0, rank: "SS", tg: "all", at: ["打"] },
};

// ---------- パッシブ（働く時：戦いの始め・ターンの始め・攻撃が当たった時・攻撃を受けた時・技を使った後・いつも） ----------
const PASSIVES = {
  spirit:   { nm: "闘志", ds: "戦いの始めにBP＋2" },
  momentum: { nm: "勢い", ds: "攻撃が当たると、たまにBP＋1" },
  swordway: { nm: "剣の心得", ds: "斬のダメージ＋10%" },
  ironwall: { nm: "鉄壁", ds: "受けるダメージ−15%" },
  standfast:{ nm: "仁王立ち", ds: "ターンの始めに体力＋5%（3回まで）" },
  counter:  { nm: "反撃", ds: "攻撃を受けると、たまに通常攻撃で返す" },
  focus:    { nm: "魔力集中", ds: "戦いの始めにBP＋3" },
  heatway:  { nm: "熱の心得", ds: "熱のダメージ＋15%" },
  afterglow:{ nm: "余熱", ds: "技を使うと、たまにBP＋2" },
  bowway:   { nm: "弓の心得", ds: "突のダメージ＋10%" },
  healer:   { nm: "癒し手", ds: "回復の量＋20%" },
  quickdraw:{ nm: "速射", ds: "戦いの始めに素早さ＋15%" },
};

// ---------- 仲間（仮の4人。res＝8属性の耐性。−は弱い、＋は強い） ----------
const HEROES = [
  { id: "h1", nm: "レオン", img: "person_001", wp: "sword", hp: 230, lp: 8,
    st: { str: 30, vit: 22, dex: 18, agi: 22, int: 10, wil: 14, lov: 12, cha: 16 },
    res: { 熱: -10 }, sk: ["gale", "twin", "whirl"], ps: ["spirit", "momentum", "swordway"], prio: ["whirl", "twin", "gale"] },
  { id: "h2", nm: "アデラ", img: "person_006", wp: "club", hp: 300, lp: 10,
    st: { str: 24, vit: 32, dex: 14, agi: 15, int: 10, wil: 22, lov: 14, cha: 20 },
    res: { 斬: 15, 打: 15, 突: 15 }, sk: ["shieldbash", "guard", "quake"], ps: ["ironwall", "standfast", "counter"], prio: ["guard", "quake", "shieldbash"] },
  { id: "h3", nm: "カイン", img: "person_032", wp: "staff", hp: 180, lp: 6,
    st: { str: 10, vit: 14, dex: 16, agi: 18, int: 32, wil: 26, lov: 16, cha: 18 },
    res: { 熱: 30, 冷: -15 }, sk: ["fireball", "flameband", "scorch"], ps: ["focus", "heatway", "afterglow"], prio: ["scorch", "flameband", "fireball"] },
  { id: "h4", nm: "ミレイ", img: "person_017", wp: "bow", hp: 200, lp: 7,
    st: { str: 14, vit: 18, dex: 30, agi: 26, int: 14, wil: 20, lov: 28, cha: 22 },
    res: { 冷: 15 }, sk: ["aim", "healrain", "shower"], ps: ["bowway", "healer", "quickdraw"], prio: ["healrain", "shower", "aim"] },
];

// ---------- 陣形（場所ごとの強化と狙われやすさ。posは画面の足元） ----------
const FORMATIONS = {
  line:   { nm: "横一文字", ds: "全員の腕力・器用さ・知力＋10%",
            slots: [{ b: { str: 10, dex: 10, int: 10 }, h: 1 }, { b: { str: 10, dex: 10, int: 10 }, h: 1 }, { b: { str: 10, dex: 10, int: 10 }, h: 1 }, { b: { str: 10, dex: 10, int: 10 }, h: 1 }],
            pos: [[48, 372], [116, 372], [185, 372], [253, 372]] },
  shield: { nm: "盾の陣", ds: "先頭は体力・精神＋30%で狙われやすい。後ろの3人は攻める力＋5%",
            slots: [{ b: { vit: 30, wil: 30 }, h: 4 }, { b: { str: 5, dex: 5, int: 5 }, h: 1 }, { b: { str: 5, dex: 5, int: 5 }, h: 1 }, { b: { str: 5, dex: 5, int: 5 }, h: 1 }],
            pos: [[150, 340], [62, 406], [150, 406], [238, 406]] },
  swift:  { nm: "疾風の陣", ds: "全員の素早さ＋25%、体力−10%",
            slots: [{ b: { agi: 25, vit: -10 }, h: 1.4 }, { b: { agi: 25, vit: -10 }, h: 1 }, { b: { agi: 25, vit: -10 }, h: 1 }, { b: { agi: 25, vit: -10 }, h: 0.7 }],
            pos: [[150, 332], [66, 372], [234, 372], [150, 410]] },
};

// ---------- 魔物（決まった動き方。plan: ターン数→技、every: nターンごとの技） ----------
const FOES = {
  rabbit: { nm: "角ウサギ", img: "monster_003", wp: "fang", hp: 150, st: { str: 22, vit: 14, dex: 14, agi: 24, int: 5, wil: 8, lov: 0, cha: 10 }, res: { 斬: -40, 打: 20 } },
  bat:    { nm: "夜コウモリ", img: "monster_002", wp: "fang", hp: 140, st: { str: 20, vit: 12, dex: 20, agi: 28, int: 8, wil: 10, lov: 0, cha: 10 }, res: { 突: -50, 打: 30 } },
  dog:    { nm: "骨の犬", img: "monster_006", wp: "fang", hp: 190, st: { str: 26, vit: 18, dex: 12, agi: 18, int: 5, wil: 8, lov: 0, cha: 10 }, res: { 打: -50, 斬: 30, 陽: -50 } },
  goblin: { nm: "ゴブリン", img: "monster_012", wp: "club", hp: 230, st: { str: 28, vit: 20, dex: 14, agi: 16, int: 6, wil: 10, lov: 0, cha: 12 }, res: {} },
  shroom: { nm: "毒キノコ", img: "monster_009", wp: "fist", hp: 200, st: { str: 12, vit: 16, dex: 10, agi: 12, int: 24, wil: 14, lov: 0, cha: 22 }, res: { 熱: -60, 冷: 30 }, every: { n: 2, sk: "spore" } },
  orc:    { nm: "オーク", img: "monster_116", wp: "club", hp: 1200, boss: 1, st: { str: 34, vit: 28, dex: 12, agi: 14, int: 8, wil: 14, lov: 0, cha: 20 }, res: { 斬: 30, 打: 50, 熱: -40 },
            plan: { 3: "stomp", 6: "fury" }, rageFrom: 7, rage: "fury", stunRes: 1 },
};
const WAVES = [
  { nm: "夜の街道", foes: ["rabbit", "bat", "dog"] },
  { nm: "森の奥", foes: ["goblin", "shroom", "goblin"] },
  { nm: "岩場の親玉", foes: ["goblin", "orc", "goblin"] },
];

// ---------- 小道具 ----------
function rnd(st) { st.seed = (st.seed * 1103515245 + 12345) & 0x7fffffff; return st.seed / 0x7fffffff; }
function alive(list) { return list.filter(u => !u.down); }
function all(st) { return [...st.party, ...st.foes]; }
function opps(st, u) { return u.side === 0 ? st.foes : st.party; }
function hasP(u, id) { return (u.ps || []).includes(id); }
function log(st, e) { st.log.push(e); }
function keyOf(s) { return Object.keys(SKILLS).find(k => SKILLS[k] === s); }

function defLo() { return { form: "line", pos: [0, 1, 2, 3] }; }
function heroStats(hi, slot, form) {
  const h = HEROES[hi], b = FORMATIONS[form].slots[slot].b, st = {};
  for (const k in h.st) st[k] = Math.round(h.st[k] * (1 + (b[k] || 0) / 100));
  return st;
}
function base(u) { return Object.assign(u, { down: false, poison: 0, stun: 0, cover: 0, stack: 0, dealt: 0, taken: 0, downAt: 0 }); }

function newBattle(wave, seed, lo) {
  lo = lo || defLo();
  const st = { seed: seed || 1, turn: 0, queue: [], log: [], over: null, phase: "command", cmd: {}, focus: null, chain: [], wave };
  st.party = lo.pos.map((hi, slot) => base({ ...HEROES[hi], st: heroStats(hi, slot, lo.form), side: 0, slot, hate: FORMATIONS[lo.form].slots[slot].h,
    max: HEROES[hi].hp, hp: HEROES[hi].hp, lp: HEROES[hi].lp, bp: BP0 }));
  st.foes = WAVES[wave].foes.map((k, i) => base({ ...FOES[k], st: { ...FOES[k].st }, key: k, id: "f" + i, side: 1, slot: i, max: FOES[k].hp, hp: FOES[k].hp, lp: 1, hate: 1, sk: [], ps: [], bp: 0 }));
  for (const u of st.party) {
    if (hasP(u, "spirit")) bpAdd(st, u, 2, "闘志");
    if (hasP(u, "focus")) bpAdd(st, u, 3, "魔力集中");
    if (hasP(u, "quickdraw")) { u.st.agi = Math.round(u.st.agi * 1.15); log(st, { t: "passive", u: u.id, nm: "速射" }); }
  }
  beginTurn(st);
  return st;
}
function bpAdd(st, u, v, why) { const b = u.bp; u.bp = Math.min(BP_MAX, u.bp + v); if (why) log(st, { t: "passive", u: u.id, nm: why, v: "BP+" + (u.bp - b) }); }

// ターンの始め：BP＋3、ターンの始めのパッシブ。そのあとコマンドを選ぶ
function beginTurn(st) {
  st.turn++;
  for (const u of alive(st.party)) {
    if (st.turn > 1) u.bp = Math.min(BP_MAX, u.bp + BP_TURN);
    if (hasP(u, "standfast") && u.stack < 3) { u.stack++; u.st.vit = Math.round(u.st.vit * 1.05); }
  }
  st.phase = "command"; st.cmd = {};
  if (!st.focus || st.foes.find(f => f.id === st.focus).down) st.focus = (alive(st.foes)[0] || {}).id;
  log(st, { t: "turn", n: st.turn });
}
// コマンドを選び終えたら動き出す。選んでいない仲間はオートで選ぶ
function commit(st, auto) {
  for (const u of alive(st.party)) if (!st.cmd[u.id] || auto) st.cmd[u.id] = keyOf(autoChoose(st, u, auto || "normal"));
  st.queue = alive(all(st)).map(u => ({ u, s: u.st.agi * (0.9 + rnd(st) * 0.2) })).sort((a, b) => b.s - a.s).map(x => x.u);
  st.phase = "run"; st.chain = [];
}
// 画面の帯に出す順：動く前はおおよその順（素早さ順）、動き出したら残り
function order(st) {
  if (st.phase === "run") return st.queue.filter(u => !u.down);
  return alive(all(st)).slice().sort((a, b) => b.st.agi - a.st.agi);
}
function usable(st, u, key) { const s = SKILLS[key]; return s.bp <= u.bp; }

// ---------- 狙い ----------
function resMul(d, at) { // 一番よく効く属性で
  let best = 0;
  for (const a of at) { const m = Math.max(0.1, 1 - (d.res[a] || 0) / 100); if (m > best) best = m; }
  return best || 1;
}
function pickTarget(st, u, s) {
  const list = alive(opps(st, u)); if (!list.length) return null;
  if (u.side === 1) { // 狙われやすさで重み付け
    const w = list.map(p => p.hate * (p.cover > 0 ? 4 : 1)); const sum = w.reduce((a, b) => a + b, 0);
    let r = rnd(st) * sum; for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; } return list[list.length - 1];
  }
  const f = list.find(x => x.id === st.focus); if (f) return f; // 全員で同じ敵を狙う
  const at = s.at || WEAPON[u.wp].at;
  return list.slice().sort((a, b) => resMul(b, at) - resMul(a, at) || a.hp - b.hp)[0];
}

// ---------- ダメージ ----------
function damage(st, a, d, s, chainMul) {
  const wp = WEAPON[a.wp], magic = Boolean(s.magic), at = s.at || wp.at;
  let statT, A;
  if (magic) { A = a.st.int; statT = 1 + A * 4 - d.st.wil * 1.5; }
  else if (a.wp === "fist") { A = a.st.str; statT = 1 + a.st.str * 2 + a.st.agi * 2.5 - d.st.vit * 1.2; }
  else { A = a.st[wp.st]; statT = 1 + A * 4 - d.st.vit * 1.5; }
  statT = Math.max(A, statT);
  let v = ((magic ? 6 : wp.pow) * 1.5 + RANK[s.rank || "N"]) * statT / 100;
  const rm = resMul(d, at); v *= rm;
  if (hasP(a, "swordway") && at.includes("斬")) v *= 1.1;
  if (hasP(a, "heatway") && at.includes("熱")) v *= 1.15;
  if (hasP(a, "bowway") && at.includes("突")) v *= 1.1;
  if (hasP(d, "ironwall")) v *= 0.85;
  if (d.cover > 0) v *= 0.5;
  v *= chainMul || 1;
  v *= 0.95 + rnd(st) * 0.1;
  v = Math.max(1, Math.round(v));
  d.hp = Math.max(0, d.hp - v); a.dealt += v; d.taken += v;
  log(st, { t: "hit", a: a.id, d: d.id, v, weak: rm > 1.05, resist: rm < 0.95 });
  if (hasP(a, "momentum") && rnd(st) < 0.3) bpAdd(st, a, 1, "勢い");
  if (d.hp <= 0) { fall(st, d); return v; }
  if (s.stun && !d.stunRes && rnd(st) * 100 < s.stun + (a.st.cha - d.st.cha)) { d.stun = 1; log(st, { t: "status", d: d.id, nm: "スタン" }); }
  if (s.poison && rnd(st) * 100 < s.poison + (a.st.cha - d.st.cha)) { d.poison = 3; log(st, { t: "status", d: d.id, nm: "毒" }); }
  if (hasP(d, "counter") && !a.down && rnd(st) < 0.25) { log(st, { t: "passive", u: d.id, nm: "反撃" }); damage(st, d, a, SKILLS.attack, 1); }
  return v;
}
// 倒れたまま全体攻撃に巻き込まれるとLPがさらに減る
function hitDown(st, d) { if (d.lp > 0) { d.lp--; log(st, { t: "lp", d: d.id, lp: d.lp }); } }
function fall(st, d) {
  if (d.down) return;
  d.down = true; d.downAt = st.turn; d.lp = Math.max(0, d.lp - 1); d.poison = 0; d.stun = 0; d.cover = 0;
  log(st, { t: "down", d: d.id, lp: d.lp });
}

// ---------- オートの選び方 ----------
function autoChoose(st, u, mode) {
  if (mode !== "full") return SKILLS.attack;
  for (const id of u.prio) {
    const s = SKILLS[id]; if (s.bp > u.bp) continue;
    if (s.heal && !st.party.some(p => (p.down && p.lp > 0) || (!p.down && p.hp < p.max * 0.6))) continue;
    if (s.cover && u.cover > 0) continue;
    if (s.tg === "all" && alive(st.foes).length === 1) continue; // 1体なら単体の技で
    return s;
  }
  return SKILLS.attack;
}
function foeChoose(st, u) {
  if (u.plan && u.plan[st.turn]) return SKILLS[u.plan[st.turn]];
  if (u.rageFrom && st.turn >= u.rageFrom) return SKILLS[u.rage]; // 長引くと毎ターン大技
  if (u.every && st.turn % u.every.n === 0) return SKILLS[u.every.sk];
  return SKILLS.attack;
}

function act(st, u) {
  let s;
  if (u.side === 1) s = foeChoose(st, u);
  else { s = SKILLS[st.cmd[u.id]] || SKILLS.attack; if (s.bp > u.bp) s = SKILLS.attack; }
  // 連携：仲間が続けて技を出すとつながる。敵が動くか通常攻撃で切れる
  const isSkill = u.side === 0 && s !== SKILLS.attack && s.tg !== "self" && s.tg !== "allies";
  if (isSkill) st.chain.push(s.nm); else st.chain = [];
  const n = st.chain.length, chainMul = n >= 4 ? 1.4 : n >= 2 ? 1.3 : 1;
  if (u.side === 0) u.bp -= s.bp;
  log(st, { t: "act", u: u.id, skill: keyOf(s), nm: s.nm, sk: s !== SKILLS.attack, chain: n >= 2 ? st.chain.slice() : null });
  if (s.tg === "self") { if (s.cover) { u.cover = s.cover; log(st, { t: "status", d: u.id, nm: "かばう構え" }); } }
  else if (s.tg === "allies") {
    for (const p of st.party) {
      if (p.down && p.lp <= 0) continue;
      const v = Math.round((s.heal + u.st.lov * 1.6) * (hasP(u, "healer") ? 1.2 : 1));
      if (p.down) { p.down = false; p.hp = Math.min(p.max, v); log(st, { t: "revive", d: p.id, v }); }
      else { const h = Math.min(p.max - p.hp, v); p.hp += h; log(st, { t: "heal", d: p.id, v: h }); }
    }
  } else {
    const foes = opps(st, u);
    if (s.tg === "all") {
      const tg = alive(foes); for (const d of tg) damage(st, u, d, s, chainMul);
      if (u.side === 1) for (const d of foes.filter(p => p.down && !tg.includes(p))) hitDown(st, d);
    } else if (s.tg === "rand") {
      for (let k = 0; k < s.hits; k++) { const l = alive(foes); if (!l.length) break; damage(st, u, l[Math.floor(rnd(st) * l.length)], s, chainMul); }
    } else {
      const t = pickTarget(st, u, s);
      for (let k = 0; k < (s.hits || 1) && t && !t.down && !u.down; k++) damage(st, u, t, s, chainMul);
    }
  }
  if (isSkill && hasP(u, "afterglow") && rnd(st) < 0.35) bpAdd(st, u, 2, "余熱");
}

// 1人ぶん進める。戻り値は動いた人。ターンが終わると次のターンのコマンド選びに戻る（nullを返す）
function step(st) {
  if (st.over || st.phase !== "run") return null;
  while (st.queue.length && st.queue[0].down) st.queue.shift();
  if (!st.queue.length) { endTurn(st); if (!st.over) beginTurn(st); return null; }
  const u = st.queue.shift();
  if (u.stun > 0) { u.stun = 0; st.chain = []; log(st, { t: "skip", u: u.id, nm: "スタン" }); }
  else act(st, u);
  checkEnd(st);
  return u;
}
function endTurn(st) {
  for (const u of alive(all(st))) {
    if (u.poison > 0) { const v = Math.max(1, Math.round(u.max * 0.06)); u.hp = Math.max(0, u.hp - v); u.poison--; log(st, { t: "dot", d: u.id, v, nm: "毒" }); if (u.hp <= 0) fall(st, u); }
    if (u.cover > 0) u.cover--;
  }
  st.chain = [];
  checkEnd(st);
  if (!st.over && st.turn >= 30) st.over = "time";
}
function checkEnd(st) {
  if (!alive(st.foes).length) st.over = "win"; else if (!alive(st.party).length) st.over = "lose";
}

const api = { BP0, BP_TURN, BP_MAX, ATTR, RANK, ST_NM, WEAPON, SKILLS, PASSIVES, HEROES, FORMATIONS, FOES, WAVES,
  defLo, heroStats, newBattle, commit, step, order, alive, usable, resMul };
if (typeof module !== "undefined") module.exports = api; else root.BT = api;
})(this);
