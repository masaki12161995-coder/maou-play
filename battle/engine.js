// 戦闘の仕組み（画面に触れない部分）。ブラウザでも、検証用のnodeでも動く。
(function (root) {
  const ELEM = { fire: '火', ice: '氷', thunder: '雷', wind: '風', light: '光' };

  const HEROES = [
    { id: 'allen', name: 'アレン', img: 'person_001', hp: 130, mp: 16, atk: 30, mag: 10, def: 14, spd: 12,
      skills: [
        { id: 'flame', name: 'かえん斬り', mp: 4, kind: 'phys', elem: 'fire', mult: 1.3, target: 'enemy' },
        { id: 'sweep', name: 'なぎはらい', mp: 5, kind: 'phys', mult: 0.7, target: 'enemies' },
      ] },
    { id: 'mina', name: 'ミナ', img: 'person_092', hp: 80, mp: 32, atk: 12, mag: 30, def: 8, spd: 11,
      skills: [
        { id: 'fireball', name: '火の玉', mp: 4, kind: 'mag', elem: 'fire', mult: 1.4, target: 'enemy' },
        { id: 'icelance', name: '氷の槍', mp: 3, kind: 'mag', elem: 'ice', mult: 1.4, target: 'enemy' },
        { id: 'bolt', name: 'いかずち', mp: 7, kind: 'mag', elem: 'thunder', mult: 0.95, target: 'enemies' },
      ] },
    { id: 'sera', name: 'セラ', img: 'person_002', hp: 95, mp: 40, atk: 14, mag: 26, def: 10, spd: 9,
      skills: [
        { id: 'heal', name: 'いやし', mp: 3, kind: 'heal', power: 52, target: 'ally' },
        { id: 'healall', name: 'いやしの風', mp: 8, kind: 'heal', power: 34, target: 'allies' },
        { id: 'lightarrow', name: '光の矢', mp: 3, kind: 'mag', elem: 'light', mult: 1.3, target: 'enemy' },
      ] },
    { id: 'rina', name: 'リナ', img: 'person_017', hp: 100, mp: 24, atk: 26, mag: 12, def: 11, spd: 16,
      skills: [
        { id: 'windarrow', name: '風の矢', mp: 3, kind: 'phys', elem: 'wind', mult: 1.3, target: 'enemy' },
        { id: 'double', name: '二連射', mp: 4, kind: 'phys', mult: 0.75, hits: 2, target: 'enemy' },
      ] },
  ];

  const ITEMS = [
    { id: 'herb', name: 'やくそう', n: 5, kind: 'hp', power: 45 },
    { id: 'ether', name: 'まほうの水', n: 2, kind: 'mp', power: 15 },
  ];

  // 大技
  const BIG = {
    bite:   { name: 'かみくだき', all: false, mult: 2.0 },
    scream: { name: 'さけび声', all: true, mult: 0.75 },
    cleave: { name: '大なた振り', all: false, mult: 2.3 },
    smash:  { name: '丸太なぎ払い', all: true, mult: 1.6 },
  };

  const MON = {
    slime:  { name: 'スライム', img: 'monster_001', hp: 42, atk: 15, mag: 0, def: 4, spd: 8, weak: ['fire'], resist: [], pattern: ['atk', 'atk', 'guard'] },
    bat:    { name: 'コウモリ', img: 'monster_002', hp: 34, atk: 14, mag: 0, def: 3, spd: 15, weak: ['wind'], resist: [], pattern: ['atk', 'atk'] },
    goblin: { name: 'ゴブリン', img: 'monster_012', hp: 62, atk: 20, mag: 0, def: 8, spd: 10, weak: ['thunder'], resist: ['fire'], pattern: ['atk', 'pump', 'atk'] },
    wolf:   { name: 'オオカミ', img: 'monster_008', hp: 58, atk: 22, mag: 0, def: 6, spd: 14, weak: ['fire'], resist: ['ice'], pattern: ['atk', 'charge:bite', 'atk'] },
    mandra: { name: 'マンドラゴラ', img: 'monster_114', hp: 46, atk: 12, mag: 0, def: 5, spd: 9, weak: ['fire'], resist: ['thunder'], pattern: ['charge:scream', 'atk'] },
    orc:    { name: 'オーク', img: 'monster_116', hp: 125, atk: 27, mag: 0, def: 12, spd: 8, weak: ['thunder'], resist: [], pattern: ['atk', 'charge:cleave', 'atk'] },
    imp:    { name: '小悪魔', img: 'monster_117', hp: 42, atk: 14, mag: 22, def: 6, spd: 15, weak: ['light'], resist: ['fire'], pattern: ['spell', 'atk'] },
    troll:  { name: 'トロル', img: 'monster_124', hp: 1050, atk: 36, mag: 0, def: 14, spd: 11, weak: ['fire'], resist: ['ice'], boss: true, pushResist: 0.6,
              pattern: ['atk', 'atk', 'pump', 'charge:smash', 'atk', 'charge:smash'] },
  };

  const FIGHTS = [
    ['slime', 'bat', 'slime'],
    ['goblin', 'wolf', 'mandra'],
    ['imp', 'orc', 'imp'],
    ['troll'],
  ];

  let RNG = Math.random;
  const rnd = (a, b) => a + (b - a) * RNG();
  const pick = (arr) => arr[Math.floor(RNG() * arr.length)];
  const interval = (u) => 1000 / u.spd;

  function newParty() {
    return {
      heroes: HEROES.map((h) => ({ ...h, side: 'hero', maxhp: h.hp, maxmp: h.mp })),
      items: ITEMS.map((i) => ({ ...i })),
      known: {}, // known[モンスターの種類][属性] = 'weak' | 'resist' | 'normal'
    };
  }

  function newBattle(party, idx) {
    const keys = FIGHTS[idx];
    const counts = {};
    keys.forEach((k) => (counts[k] = (counts[k] || 0) + 1));
    const seen = {};
    const enemies = keys.map((k, i) => {
      const m = MON[k];
      seen[k] = (seen[k] || 0) + 1;
      const label = counts[k] > 1 ? m.name + 'ABC'[seen[k] - 1] : m.name;
      return { ...m, key: k, uid: 'e' + i, label, side: 'enemy', maxhp: m.hp, step: 0, charging: null, guard: false, pump: 1, intent: null, pushResist: m.pushResist || 0 };
    });
    const B = { party, heroes: party.heroes, enemies, idx, over: null, turn: 0 };
    party.heroes.forEach((h) => { h.guard = false; h.next = h.hp > 0 ? interval(h) * rnd(0.35, 0.65) : 1e9; });
    enemies.forEach((e) => { e.next = interval(e) * rnd(0.45, 0.8); });
    enemies.forEach((e) => planIntent(B, e));
    return B;
  }

  const alive = (arr) => arr.filter((u) => u.hp > 0);

  function nextActor(B) {
    const us = [...alive(B.heroes), ...alive(B.enemies)];
    us.sort((a, b) => a.next - b.next || (a.side === 'hero' ? -1 : 1));
    return us[0];
  }

  // 行動順の予報（押し出しなどは起きない前提で、この先 n 回）
  function forecast(B, n) {
    const us = [...alive(B.heroes), ...alive(B.enemies)].map((u) => ({ u, t: u.next }));
    const out = [];
    while (out.length < n && us.length) {
      us.sort((a, b) => a.t - b.t || (a.u.side === 'hero' ? -1 : 1));
      out.push(us[0].u);
      us[0].t += interval(us[0].u);
    }
    return out;
  }

  function planIntent(B, e) {
    if (e.hp <= 0) { e.intent = null; return; }
    const hs = alive(B.heroes);
    if (e.charging) {
      const big = BIG[e.charging];
      e.intent = { kind: 'big', move: e.charging, target: big.all ? null : (e.bigTarget && e.bigTarget.hp > 0 ? e.bigTarget : pick(hs)) };
      if (!big.all) e.bigTarget = e.intent.target;
      return;
    }
    const step = e.pattern[e.step % e.pattern.length];
    if (step === 'atk' || step === 'spell') e.intent = { kind: step, target: pick(hs) };
    else if (step.startsWith('charge:')) {
      const mv = step.slice(7);
      e.intent = { kind: 'charge', move: mv };
    } else e.intent = { kind: step };
  }

  function retarget(B) {
    B.enemies.forEach((e) => {
      if (e.hp > 0 && e.intent && e.intent.target && e.intent.target.hp <= 0) {
        e.intent.target = pick(alive(B.heroes));
        if (e.intent.kind === 'big') e.bigTarget = e.intent.target;
      }
    });
  }

  function elemMod(e, elem) {
    if (!elem) return 1;
    if (e.weak.includes(elem)) return 1.5;
    if (e.resist.includes(elem)) return 0.5;
    return 1;
  }

  function learn(B, e, elem) {
    if (!elem) return;
    const k = (B.party.known[e.key] = B.party.known[e.key] || {});
    k[elem] = e.weak.includes(elem) ? 'weak' : e.resist.includes(elem) ? 'resist' : 'normal';
  }

  function heroHit(B, h, e, sk, ev, pushed) {
    const mult = sk ? sk.mult : 1;
    const base = (sk && sk.kind === 'mag') ? h.mag * mult - e.def * 0.25 : h.atk * mult - e.def * 0.5;
    const m = elemMod(e, sk && sk.elem);
    let d = Math.max(1, Math.round(base * m * rnd(0.9, 1.1) * (e.guard ? 0.5 : 1)));
    e.hp = Math.max(0, e.hp - d);
    const weak = m > 1, resist = m < 1;
    if (sk) learn(B, e, sk.elem);
    ev.push({ t: 'dmg', who: e, n: d, weak, resist });
    if (weak && e.hp > 0 && !pushed.has(e)) {
      pushed.add(e);
      e.next += interval(e) * 0.45 * (1 - e.pushResist);
      if (e.charging) {
        e.charging = null; e.bigTarget = null;
        ev.push({ t: 'break', who: e });
      } else ev.push({ t: 'push', who: e });
      planIntent(B, e);
    }
    if (e.hp <= 0) { ev.push({ t: 'die', who: e }); e.intent = null; }
  }

  // 主人公側の行動。cmd = {type:'attack'|'skill'|'guard'|'item', skill, item, target}
  function heroAct(B, h, cmd) {
    const ev = [];
    h.guard = false;
    const pushed = new Set();
    if (cmd.type === 'attack') {
      ev.push({ t: 'msg', s: `${h.name}の こうげき！`, actor: h, anim: 'step' });
      heroHit(B, h, cmd.target, null, ev, pushed);
    } else if (cmd.type === 'skill') {
      const sk = cmd.skill;
      h.mp -= sk.mp;
      ev.push({ t: 'msg', s: `${h.name}の ${sk.name}！`, actor: h });
      ev.push({ t: 'cutin', actor: h, s: sk.name });
      if (sk.kind === 'heal') {
        const tg = sk.target === 'allies' ? alive(B.heroes) : [cmd.target];
        tg.forEach((t) => {
          const n = Math.round((sk.power + h.mag * 0.4) * rnd(0.95, 1.05));
          const before = t.hp; t.hp = Math.min(t.maxhp, t.hp + n);
          ev.push({ t: 'heal', who: t, n: t.hp - before });
        });
      } else {
        const tg = sk.target === 'enemies' ? alive(B.enemies) : [cmd.target];
        tg.forEach((e) => {
          for (let i = 0; i < (sk.hits || 1); i++) if (e.hp > 0) heroHit(B, h, e, sk, ev, pushed);
        });
      }
    } else if (cmd.type === 'guard') {
      h.guard = true;
      ev.push({ t: 'msg', s: `${h.name}は みをまもっている。`, actor: h });
    } else if (cmd.type === 'item') {
      const it = cmd.item; it.n--;
      ev.push({ t: 'msg', s: `${h.name}は ${it.name}を つかった！`, actor: h });
      const t = cmd.target;
      if (it.kind === 'hp') { const b = t.hp; t.hp = Math.min(t.maxhp, t.hp + it.power); ev.push({ t: 'heal', who: t, n: t.hp - b }); }
      else { const b = t.mp; t.mp = Math.min(t.maxmp, t.mp + it.power); ev.push({ t: 'mpheal', who: t, n: t.mp - b }); }
    }
    h.next += interval(h);
    finish(B, ev);
    return ev;
  }

  function enemyHitHero(e, t, mult, ev, magic) {
    const pw = (magic ? e.mag : e.atk * e.pump) * mult;
    let d = Math.max(1, Math.round((pw - t.def * (magic ? 0.25 : 0.5)) * rnd(0.88, 1.12) * (t.guard ? 0.5 : 1)));
    t.hp = Math.max(0, t.hp - d);
    ev.push({ t: 'hdmg', who: t, n: d });
    if (t.hp <= 0) { ev.push({ t: 'hdie', who: t }); t.next = 1e9; }
  }

  function enemyAct(B, e) {
    const ev = [];
    e.guard = false;
    const it = e.intent || { kind: 'atk', target: pick(alive(B.heroes)) };
    if (it.kind === 'atk') {
      ev.push({ t: 'msg', s: `${e.label}の こうげき！`, actor: e, anim: 'lunge' });
      enemyHitHero(e, it.target.hp > 0 ? it.target : pick(alive(B.heroes)), 1, ev, false);
      e.step++;
    } else if (it.kind === 'spell') {
      ev.push({ t: 'msg', s: `${e.label}は 火の呪文を となえた！`, actor: e, anim: 'lunge' });
      enemyHitHero(e, it.target.hp > 0 ? it.target : pick(alive(B.heroes)), 1.2, ev, true);
      e.step++;
    } else if (it.kind === 'guard') {
      e.guard = true; e.step++;
      ev.push({ t: 'msg', s: `${e.label}は みをまもっている。`, actor: e });
    } else if (it.kind === 'pump') {
      e.pump = Math.min(1.6, e.pump + 0.3); e.step++;
      ev.push({ t: 'msg', s: `${e.label}は ちからをためた！ こうげき力が上がった。`, actor: e, anim: 'pump' });
    } else if (it.kind === 'charge') {
      e.charging = it.move; e.step++;
      ev.push({ t: 'msg', s: `${e.label}は 大技の かまえをとった！`, actor: e, anim: 'charge' });
    } else if (it.kind === 'big') {
      const big = BIG[it.move];
      ev.push({ t: 'msg', s: `${e.label}の ${big.name}！`, actor: e, anim: 'big' });
      const tg = big.all ? alive(B.heroes) : [it.target.hp > 0 ? it.target : pick(alive(B.heroes))];
      tg.forEach((t) => enemyHitHero(e, t, big.mult, ev, false));
      e.charging = null; e.bigTarget = null;
    }
    e.next += interval(e);
    if (alive(B.heroes).length) planIntent(B, e);
    finish(B, ev);
    return ev;
  }

  function finish(B, ev) {
    retarget(B);
    if (!alive(B.enemies).length) { B.over = 'win'; ev.push({ t: 'win' }); }
    else if (!alive(B.heroes).length) { B.over = 'lose'; ev.push({ t: 'lose' }); }
    B.turn++;
  }

  const api = { ELEM, HEROES, ITEMS, BIG, MON, FIGHTS, newParty, newBattle, nextActor, forecast, heroAct, enemyAct, alive, interval, setRng: (f) => (RNG = f) };
  if (typeof module !== 'undefined') module.exports = api; else root.ENG = api;
})(this);
