/* 星環の決闘 — shared rules for both seats. No timing or UI in this file. */
(function (root) {
  "use strict";

  const LIFE = 20;
  const SLOTS = 3;
  const HAND_LIMIT = 7;
  const MANA_LIMIT = 8;

  const elements = {
    star: { name: "星", color: "#92dcff" },
    flame: { name: "炎", color: "#f69c7c" },
    forest: { name: "森", color: "#a9de91" },
    shade: { name: "影", color: "#d4a9f5" }
  };
  const rarities = [
    { name: "白", color: "#c4c8ce", dark: "#393c46" },
    { name: "緑", color: "#8cce97", dark: "#203c30" },
    { name: "青", color: "#82bdf9", dark: "#233956" },
    { name: "紫", color: "#c4a1f2", dark: "#44315e" },
    { name: "金", color: "#f1cb7d", dark: "#584328" },
    { name: "虹", color: "#e8baf1", dark: "#4d3b69" }
  ];

  const cards = {
    squire: {
      name: "星の剣士", kind: "unit", element: "star", rarity: 0, cost: 1, attack: 2, health: 2, art: "01",
      short: "", text: "場に出た次の自分の番から攻撃できます。"
    },
    wolf: {
      name: "霧狼", kind: "unit", element: "star", rarity: 1, cost: 2, attack: 2, health: 2, art: "02",
      charge: true, short: "速攻", text: "速攻：場に出た番から攻撃できます。"
    },
    hawk: {
      name: "火羽", kind: "unit", element: "flame", rarity: 0, cost: 1, attack: 2, health: 1, art: "03",
      short: "", text: "場に出た次の自分の番から攻撃できます。"
    },
    golem: {
      name: "苔の巨兵", kind: "unit", element: "forest", rarity: 1, cost: 3, attack: 2, health: 5, art: "04",
      guard: true, short: "守護", text: "守護：相手は攻撃をするとき、守護を持つユニットを先に狙います。"
    },
    alchemist: {
      name: "森の薬師", kind: "unit", element: "forest", rarity: 2, cost: 2, attack: 1, health: 3, art: "05",
      effect: "drawOne", short: "１枚引く", text: "場に出たとき、山札から１枚引きます。"
    },
    dawn: {
      name: "暁の騎士", kind: "unit", element: "star", rarity: 2, cost: 4, attack: 3, health: 4, art: "06",
      guard: true, effect: "dawn", short: "守護・回復", text: "守護。場に出たとき、自分のライフを２回復します。"
    },
    wraith: {
      name: "影の渡り手", kind: "unit", element: "shade", rarity: 3, cost: 4, attack: 3, health: 3, art: "07",
      effect: "wave", short: "敵全体に１", text: "場に出たとき、相手と相手のユニット全員に１ダメージを与えます。"
    },
    paladin: {
      name: "日輪騎士", kind: "unit", element: "flame", rarity: 4, cost: 5, attack: 4, health: 4, art: "08",
      followUp: true, short: "撃破で再攻撃", text: "攻撃で相手のユニットを倒して生き残ると、もう一度攻撃できます。各ターン１回まで。"
    },
    dragon: {
      name: "星喰い竜", kind: "unit", element: "shade", rarity: 5, cost: 6, attack: 5, health: 6, art: "09",
      effect: "rally", short: "味方が再攻撃", text: "場に出たとき、ほかの味方全員がすぐ攻撃できるようになります。この番に攻撃済みの味方も、もう一度攻撃できます。"
    },
    sword: {
      name: "星鉄の剣", kind: "gear", element: "star", rarity: 1, cost: 2, art: "10",
      effect: "power", short: "攻撃＋２", text: "味方１体に装備。場にいる間、そのユニットの攻撃力が２上がります。"
    },
    shield: {
      name: "月紋の盾", kind: "gear", element: "shade", rarity: 2, cost: 2, art: "11",
      effect: "shield", short: "体力＋２・守護", text: "味方１体に装備。最大体力と現在の体力が２上がり、守護を得ます。"
    },
    comet: {
      name: "流星火", kind: "spell", element: "flame", rarity: 2, cost: 2, art: "12",
      effect: "burn", target: "enemy", short: "３ダメージ", text: "相手か相手のユニット１体に３ダメージ。守護を通り越して狙えます。"
    },
    elixir: {
      name: "生命の雫", kind: "spell", element: "forest", rarity: 1, cost: 1, art: "13",
      effect: "heal", target: "ally", short: "４回復", text: "ダメージを受けた自分か味方ユニット１体を選び、ライフか体力を４回復します。"
    },
    gate: {
      name: "星門", kind: "spell", element: "star", rarity: 3, cost: 3, art: "14",
      effect: "drawTwo", short: "２枚引く", text: "自分の場に引っぱると、山札から２枚引きます。"
    },
    hourglass: {
      name: "逆巻く時", kind: "spell", element: "shade", rarity: 4, cost: 3, art: "15",
      effect: "rewind", target: "unit", short: "味方１体再攻撃", text: "味方１体がすぐに攻撃できるようになります。攻撃済みでも、もう一度攻撃できます。"
    },
    eclipse: {
      name: "蝕の秘典", kind: "spell", element: "shade", rarity: 5, cost: 4, art: "16",
      effect: "eclipse", short: "敵全体に２", text: "自分の場に引っぱると、相手と相手のユニット全員に２ダメージを与えます。"
    }
  };
  for (const [id, card] of Object.entries(cards)) {
    card.id = id;
    Object.freeze(card);
  }
  Object.freeze(cards);

  const starter = Object.freeze({
    squire: 3, wolf: 2, hawk: 2, golem: 2, alchemist: 2, dawn: 1, wraith: 1,
    paladin: 1, dragon: 1, sword: 2, shield: 1, comet: 2, elixir: 1, gate: 1
  });
  const prizes = Object.freeze(["hourglass", "eclipse"]);

  const hero = side => ({ kind: "hero", side });
  const slot = (side, index) => ({ kind: "slot", side, index });
  const altar = side => ({ kind: "altar", side });
  const atUnit = (side, unit) => ({ kind: "unit", side, id: unit.uid });
  const sameTarget = (a, b) => Boolean(
    a && b && a.kind === b.kind && a.side === b.side && a.id === b.id && a.index === b.index
  );

  function shuffle(values, rng) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  function create(rng = Math.random, decks = [starter, starter]) {
    let uid = 0;
    const players = decks.map(deck => {
      const pile = shuffle(Object.entries(deck).flatMap(([id, count]) =>
        Array.from({ length: count }, () => ({ uid: ++uid, id }))), rng);
      // Both opening hands contain a one-mana unit if the deck has one.
      const early = entry => cards[entry.id].kind === "unit" && cards[entry.id].cost === 1;
      if (!pile.slice(0, 4).some(early)) {
        const index = pile.findIndex(early);
        if (index >= 4) [pile[3], pile[index]] = [pile[index], pile[3]];
      }
      return {
        hp: LIFE, mana: 0, maxMana: 0, turns: 0, fatigue: 0, pile,
        hand: pile.splice(0, 4), board: Array(SLOTS).fill(null)
      };
    });

    const first = rng() < 0.5 ? 0 : 1;
    const game = { players, first, active: first, round: 1, winner: null, moves: 0 };
    begin(game);
    return game;
  }

  function unitAt(game, target) {
    if (target.kind !== "unit") return null;
    return game.players[target.side].board.find(unit => unit?.uid === target.id) || null;
  }

  function damage(game, target, amount, events) {
    if (target.kind === "hero") {
      const player = game.players[target.side];
      player.hp = Math.max(0, player.hp - amount);
    } else {
      unitAt(game, target).hp -= amount;
    }
    events.push({ type: "damage", target, amount });
  }

  function heal(game, target, amount, events) {
    const subject = target.kind === "hero" ? game.players[target.side] : unitAt(game, target);
    const cap = target.kind === "hero" ? LIFE : subject.maxHp;
    const restored = Math.min(amount, cap - subject.hp);
    if (restored <= 0) return;
    subject.hp += restored;
    events.push({ type: "heal", target, amount: restored });
  }

  function finish(game, events) {
    game.players.forEach((player, side) => {
      player.board.forEach((unit, index) => {
        if (!unit || unit.hp > 0) return;
        player.board[index] = null;
        events.push({ type: "fall", target: atUnit(side, unit), card: unit.id });
      });
    });

    if (game.players[0].hp <= 0) game.winner = 1;
    if (game.players[1].hp <= 0) game.winner = 0;
  }

  function draw(game, side, events, count = 1) {
    const player = game.players[side];
    for (let i = 0; i < count && player.hp > 0; i++) {
      const card = player.pile.shift();
      if (!card) {
        player.fatigue++;
        damage(game, hero(side), player.fatigue, events);
        events.push({ type: "fatigue", side, amount: player.fatigue });
      } else if (player.hand.length < HAND_LIMIT) {
        player.hand.push(card);
        events.push({ type: "draw", side, card });
      } else {
        events.push({ type: "overflow", side, card });
      }
    }
  }

  function begin(game) {
    const side = game.active;
    const player = game.players[side];
    const events = [];
    player.turns++;
    player.maxMana = Math.min(MANA_LIMIT, player.maxMana + 1);
    player.mana = player.maxMana;
    for (const unit of player.board) {
      if (!unit) continue;
      unit.ready = true;
      unit.followed = false;
    }
    if (player.turns > 1 || side !== game.first) {
      draw(game, side, events, player.turns === 1 ? 2 : 1);
    }
    finish(game, events);
    return events;
  }

  function end(game, side) {
    if (game.winner !== null || game.active !== side) return null;
    game.active = 1 - side;
    if (game.active === game.first) game.round++;
    return begin(game);
  }

  function units(game, side) {
    return game.players[side].board.filter(Boolean);
  }

  function playTargets(game, side, uid) {
    if (game.winner !== null || game.active !== side) return [];
    const player = game.players[side];
    const entry = player.hand.find(card => card.uid === uid);
    if (!entry) return [];
    const card = cards[entry.id];
    if (card.cost > player.mana) return [];

    if (card.kind === "unit") {
      return player.board.flatMap((unit, index) => unit ? [] : [slot(side, index)]);
    }

    if (card.kind === "gear" || card.target === "unit") {
      return units(game, side).map(unit => atUnit(side, unit));
    }
    if (card.target) {
      const recipient = card.target === "enemy" ? 1 - side : side;
      const team = units(game, recipient);
      if (card.effect === "heal") {
        const wounded = team.filter(unit => unit.hp < unit.maxHp).map(unit => atUnit(recipient, unit));
        return game.players[recipient].hp < LIFE ? [hero(recipient), ...wounded] : wounded;
      }
      return [hero(recipient), ...team.map(unit => atUnit(recipient, unit))];
    }
    return [altar(side)];
  }

  function attackTargets(game, side, uid) {
    if (game.winner !== null || game.active !== side) return [];
    const unit = units(game, side).find(candidate => candidate.uid === uid);
    if (!unit?.ready) return [];
    const enemy = 1 - side;
    const defenders = units(game, enemy);
    const guards = defenders.filter(defender => defender.guard);
    if (guards.length) return guards.map(guard => atUnit(enemy, guard));
    return [hero(enemy), ...defenders.map(defender => atUnit(enemy, defender))];
  }

  function summon(game, target, entry, card, events) {
    const player = game.players[target.side];
    const unit = {
      ...entry, attack: card.attack, hp: card.health, maxHp: card.health,
      ready: Boolean(card.charge), guard: Boolean(card.guard), gear: [], followed: false
    };
    player.board[target.index] = unit;
    events.push({ type: "summon", target: atUnit(target.side, unit) });
  }

  function applyEffect(game, side, effect, target, card, events) {
    const enemy = 1 - side;
    switch (effect) {
      case "power":
      case "shield": {
        const ally = unitAt(game, target);
        ally.gear.push(card.id);
        if (effect === "power") {
          ally.attack += 2;
        } else {
          ally.hp += 2;
          ally.maxHp += 2;
          ally.guard = true;
        }
        events.push({ type: "buff", target });
        break;
      }
      case "drawOne":
      case "drawTwo":
        draw(game, side, events, effect === "drawOne" ? 1 : 2);
        break;
      case "dawn":
        heal(game, hero(side), 2, events);
        break;
      case "wave":
      case "eclipse": {
        const amount = effect === "wave" ? 1 : 2;
        for (const foe of units(game, enemy)) damage(game, atUnit(enemy, foe), amount, events);
        damage(game, hero(enemy), amount, events);
        break;
      }
      case "burn":
        damage(game, target, 3, events);
        break;
      case "heal":
        heal(game, target, 4, events);
        break;
      case "rally":
        for (const ally of units(game, side)) {
          if (ally === game.players[side].board[target.index]) continue;
          ally.ready = true;
          events.push({ type: "buff", target: atUnit(side, ally) });
        }
        break;
      case "rewind":
        unitAt(game, target).ready = true;
        events.push({ type: "buff", target });
        break;
    }
  }

  function play(game, side, uid, target) {
    if (!playTargets(game, side, uid).some(item => sameTarget(item, target))) return null;
    const player = game.players[side];
    const index = player.hand.findIndex(card => card.uid === uid);
    const [entry] = player.hand.splice(index, 1);
    const card = cards[entry.id];
    const events = [];
    player.mana -= card.cost;
    if (card.kind === "unit") summon(game, target, entry, card, events);
    applyEffect(game, side, card.effect, target, card, events);
    game.moves++;
    finish(game, events);
    return events;
  }

  function attack(game, side, uid, target) {
    if (!attackTargets(game, side, uid).some(item => sameTarget(item, target))) return null;
    const source = units(game, side).find(unit => unit.uid === uid);
    const defender = unitAt(game, target);
    const events = [];

    source.ready = false;
    damage(game, target, source.attack, events);
    if (defender) damage(game, atUnit(side, source), defender.attack, events);
    if (source.hp > 0 && defender?.hp <= 0 && cards[source.id].followUp && !source.followed) {
      source.ready = true;
      source.followed = true;
      events.push({ type: "buff", target: atUnit(side, source) });
    }
    game.moves++;
    finish(game, events);
    return events;
  }

  function options(game, side) {
    const player = game.players[side];
    const plays = player.hand.flatMap(entry => playTargets(game, side, entry.uid)
      .map(target => ({ kind: "play", uid: entry.uid, card: entry.id, target })));
    const attacks = units(game, side).flatMap(unit => attackTargets(game, side, unit.uid)
      .map(target => ({ kind: "attack", uid: unit.uid, card: unit.id, target })));
    return [...plays, ...attacks];
  }

  function execute(game, side, move) {
    return move.kind === "play"
      ? play(game, side, move.uid, move.target)
      : attack(game, side, move.uid, move.target);
  }

  // The opponent considers its own cards, and the same visible information as the player.
  function cpuMove(game, side = 1, rng = Math.random) {
    const enemy = 1 - side;
    const mine = game.players[side];
    const theirs = game.players[enemy];
    const allies = units(game, side);
    const foes = units(game, enemy);
    const threat = foes.reduce((sum, unit) => sum + unit.attack, 0);
    const haveGuard = allies.some(unit => unit.guard);
    const canHitHero = !foes.some(unit => unit.guard);
    const attackTotal = allies.reduce((sum, unit) => sum + (unit.ready ? unit.attack : 0), 0);
    const burn = mine.mana >= 2 && mine.hand.some(entry => cards[entry.id].effect === "burn") ? 3 : 0;

    function score(move) {
      const card = cards[move.card];
      const defender = unitAt(game, move.target);
      if (move.kind === "attack") {
        const source = allies.find(unit => unit.uid === move.uid);
        if (!defender) {
          if (source.attack >= theirs.hp) return 100;
          if (canHitHero && attackTotal + burn >= theirs.hp) return 40 + source.attack;
          return 2.4 + source.attack * 0.9 + (LIFE - theirs.hp) * 0.12;
        }
        const kill = source.attack >= defender.hp;
        const survive = defender.attack < source.hp;
        const follower = kill && survive && card.followUp && !source.followed ? 3.5 : 0;
        const value = kill ? 4.2 + defender.attack * 1.05 : source.attack * 0.66;
        const sacrifice = survive ? defender.attack * 0.33 : 3.2 + source.attack * 0.55;
        return value - sacrifice + follower + (defender.guard ? 1.8 : 0);
      }

      if (card.kind === "unit") {
        let value = 5 + (card.attack + card.health) * 0.28 - card.cost * 0.14 - allies.length * 0.22;
        if (card.guard && !haveGuard) value += Math.min(4, threat * (mine.hp < 8 ? 0.9 : 0.48));
        if (card.charge) value += 0.6;
        if (card.effect === "drawOne") value += 0.8;
        if (card.effect === "wave") value += foes.filter(unit => unit.hp === 1).length * 2 + foes.length * 0.55;
        if (card.effect === "wave" && theirs.hp === 1) return 100;
        if (card.effect === "rally") value += allies.reduce((sum, unit) =>
          sum + (unit.ready ? -2.6 : unit.attack * 0.9), 0);
        return value - move.target.index * 0.08;
      }

      switch (card.effect) {
        case "power":
          return (defender.ready ? 6.8 : 4) + defender.hp * 0.25 +
            (defender.ready && canHitHero && attackTotal + 2 >= theirs.hp ? 37 : 0);
        case "shield":
          return 3.4 + (defender.guard ? 0 : 1.3) +
            (!haveGuard ? Math.min(4.5, threat * (mine.hp < 8 ? 0.95 : 0.52)) : 0);
        case "burn":
          if (!defender && theirs.hp <= 3) return 100;
          if (!defender && canHitHero && attackTotal + 3 >= theirs.hp) return 38;
          if (!defender) return theirs.hp <= 9 ? 6 : 1.4;
          return 2 + (defender.hp <= 3 ? 3 + defender.attack * 0.8 : 0) + (defender.guard ? 1.4 : 0);
        case "heal": {
          const missing = defender ? defender.maxHp - defender.hp : LIFE - mine.hp;
          if (missing < 2) return -1;
          const urgency = mine.hp <= threat || mine.hp < 7 ? 4 : 0;
          return Math.min(4, missing) * 0.85 + (defender ? defender.attack * 0.3 : urgency);
        }
        case "drawTwo":
          return mine.pile.length < 2 ? -2 : 6.5 - mine.hand.length * 0.55;
        case "rewind":
          return defender.ready ? -1 : 2 + defender.attack;
        case "eclipse":
          if (theirs.hp <= 2) return 100;
          return 3 + foes.length * 1.1 + foes.filter(unit => unit.hp <= 2).length * 2.2;
        default:
          return -1;
      }
    }

    let best = null;
    let high = 1.1;
    for (const move of options(game, side)) {
      const value = score(move) + rng() * 0.15;
      if (value <= high) continue;
      [best, high] = [move, value];
    }
    return best;
  }

  const rules = {
    LIFE, SLOTS, HAND_LIMIT, MANA_LIMIT, cards, elements, rarities, starter, prizes,
    hero, slot, altar, atUnit, sameTarget, create, units, unitAt, playTargets, attackTargets,
    options, execute, end, cpuMove
  };
  if (typeof module !== "undefined" && module.exports) module.exports = rules;
  else root.AstralRules = rules;
}(globalThis));
