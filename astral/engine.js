/* 星環の決闘 — the same legal moves and effects apply to both seats. */
(function (root) {
  "use strict";

  const commonJs = typeof module !== "undefined" && module.exports;
  const { cards, elements, rarities, starter } = commonJs ? require("./cards.js") : root.AstralCards;
  const LIFE = 20;
  const SLOTS = 3;
  const HAND_LIMIT = 7;
  const MANA_LIMIT = 8;
  const DECK_SIZE = 22;

  const hero = side => ({ kind: "hero", side });
  const slot = (side, index) => ({ kind: "slot", side, index });
  const altar = side => ({ kind: "altar", side });
  const atUnit = (side, unit) => ({ kind: "unit", side, id: unit.uid });
  const sameTarget = (a, b) => Boolean(
    a && b && a.kind === b.kind && a.side === b.side && a.id === b.id && a.index === b.index
  );
  const count = deck => Object.values(deck).reduce((sum, copies) => sum + copies, 0);
  const copyLimit = id => cards[id].rarity >= 4 ? 1 : 3;
  const costOf = entry => Math.max(0, cards[entry.id].cost - (entry.discount || 0));

  function validDeck(deck, owned) {
    return deck && typeof deck === "object" && count(deck) === DECK_SIZE &&
      Object.entries(deck).every(([id, copies]) => (
        Object.hasOwn(cards, id) && Number.isInteger(copies) && copies > 0 &&
        copies <= copyLimit(id) && (!owned || copies <= (owned[id] || 0))
      ));
  }

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
      const pile = shuffle(Object.entries(deck).flatMap(([id, copies]) =>
        Array.from({ length: copies }, () => ({ uid: ++uid, id }))), rng);
      // Give both seats a useful first move if their deck has a one-mana unit.
      const early = entry => cards[entry.id].kind === "unit" && cards[entry.id].cost === 1;
      if (!pile.slice(0, 4).some(early)) {
        const index = pile.findIndex(early);
        if (index >= 4) [pile[3], pile[index]] = [pile[index], pile[3]];
      }
      return {
        hp: LIFE, mana: 0, maxMana: 0, turns: 0, fatigue: 0,
        discard: [], hand: pile.splice(0, 4), pile, board: Array(SLOTS).fill(null)
      };
    });
    const first = rng() < 0.5 ? 0 : 1;
    const game = { players, first, active: first, round: 1, winner: null, moves: 0 };
    begin(game);
    return game;
  }

  function units(game, side) {
    return game.players[side].board.filter(Boolean);
  }

  function unitAt(game, target) {
    if (target.kind !== "unit") return null;
    return game.players[target.side].board.find(unit => unit?.uid === target.id) || null;
  }

  function damage(game, target, amount, events) {
    if (amount <= 0) return 0;
    if (target.kind === "hero") {
      const player = game.players[target.side];
      player.hp = Math.max(0, player.hp - amount);
    } else {
      const unit = unitAt(game, target);
      if (unit.ward) {
        unit.ward = false;
        events.push({ type: "block", target });
        return 0;
      }
      unit.hp -= amount;
    }
    events.push({ type: "damage", target, amount });
    return amount;
  }

  function heal(game, target, amount, events) {
    const subject = target.kind === "hero" ? game.players[target.side] : unitAt(game, target);
    const cap = target.kind === "hero" ? LIFE : subject.maxHp;
    const restored = Math.min(amount, cap - subject.hp);
    if (restored <= 0 || subject.hp <= 0) return;
    subject.hp += restored;
    events.push({ type: "heal", target, amount: restored });
  }

  function restoreMana(game, side, amount, events) {
    const player = game.players[side];
    const restored = Math.min(amount, player.maxMana - player.mana);
    if (!restored) return;
    player.mana += restored;
    events.push({ type: "mana", target: hero(side), amount: restored });
  }

  function putHand(game, side, card, events) {
    const player = game.players[side];
    if (player.hand.length < HAND_LIMIT) {
      player.hand.push(card);
      events.push({ type: "draw", side, card });
    } else {
      player.discard.push({ uid: card.uid, id: card.id });
      events.push({ type: "overflow", side, card });
    }
  }

  function draw(game, side, events, amount = 1) {
    const player = game.players[side];
    for (let i = 0; i < amount && player.hp > 0; i++) {
      const card = player.pile.shift();
      if (card) {
        putHand(game, side, card, events);
      } else {
        player.fatigue++;
        damage(game, hero(side), player.fatigue, events);
        events.push({ type: "fatigue", side, amount: player.fatigue });
      }
    }
  }

  function isFalling(unit) {
    return unit.hp <= 0 && (!unit.comeback || unit.returned);
  }

  function finish(game, events) {
    game.players.forEach((player, side) => {
      player.board.forEach((unit, index) => {
        if (!unit || unit.hp > 0) return;
        const target = atUnit(side, unit);
        if (!isFalling(unit)) {
          unit.returned = true;
          unit.hp = 1;
          unit.ready = false;
          events.push({ type: "buff", target });
          return;
        }
        player.board[index] = null;
        player.discard.push({ uid: unit.uid, id: unit.id, fallen: true });
        events.push({ type: "fall", target, card: unit.id });
        if (unit.lastDraw) draw(game, side, events, unit.lastDraw);
        if (unit.lastHeal) heal(game, hero(side), unit.lastHeal, events);
      });
    });

    if (game.players[game.active].hp <= 0) game.winner = 1 - game.active;
    else if (game.players[1 - game.active].hp <= 0) game.winner = game.active;
  }

  function begin(game, events = []) {
    const side = game.active;
    const player = game.players[side];
    player.turns++;
    player.maxMana = Math.min(MANA_LIMIT, player.maxMana + 1);
    player.mana = player.maxMana;
    for (const unit of units(game, side)) {
      unit.ready = !unit.frozen;
      unit.frozen = false;
      unit.rushOnly = false;
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
    const events = [];
    for (const unit of units(game, side)) {
      unit.attack -= unit.tempPower;
      unit.tempPower = 0;
      if (unit.mend) heal(game, atUnit(side, unit), unit.mend, events);
    }
    game.active = 1 - side;
    if (game.active === game.first) game.round++;
    return begin(game, events);
  }

  function playTargets(game, side, uid) {
    if (game.winner !== null || game.active !== side) return [];
    const player = game.players[side];
    const entry = player.hand.find(card => card.uid === uid);
    if (!entry || costOf(entry) > player.mana) return [];
    const card = cards[entry.id];
    if (card.kind === "unit") {
      return player.board.flatMap((unit, index) => unit ? [] : [slot(side, index)]);
    }

    const allies = units(game, side);
    const foes = units(game, 1 - side);
    const toAlly = unit => atUnit(side, unit);
    const toEnemy = unit => atUnit(1 - side, unit);
    const needsWake = unit => !unit.ready || unit.rushOnly;
    if (card.kind === "gear") {
      return (card.upgrade.ready ? allies.filter(needsWake) : allies).map(toAlly);
    }
    switch (card.target) {
      case "unit":
        return (card.effect === "rewind" ? allies.filter(needsWake) : allies).map(toAlly);
      case "enemyUnit":
        return (card.effect === "freeze" ? foes.filter(unit => !unit.frozen) : foes).map(toEnemy);
      case "smallEnemy":
        return foes.filter(unit => cards[unit.id].cost <= 3).map(toEnemy);
      case "enemy":
        return [hero(1 - side), ...foes.map(toEnemy)];
      case "ally": {
        const eligible = allies.filter(unit => unit.hp < unit.maxHp || (card.effect === "mendWard" && !unit.ward)).map(toAlly);
        return player.hp < LIFE ? [hero(side), ...eligible] : eligible;
      }
      case "team":
        return allies.length ? [altar(side)] : [];
      default:
        return [altar(side)];
    }
  }

  function attackTargets(game, side, uid) {
    if (game.winner !== null || game.active !== side) return [];
    const unit = units(game, side).find(candidate => candidate.uid === uid);
    if (!unit?.ready) return [];
    const enemy = 1 - side;
    const defenders = units(game, enemy);
    const guards = defenders.filter(defender => defender.guard);
    if (guards.length) return guards.map(guard => atUnit(enemy, guard));
    const attacks = defenders.map(defender => atUnit(enemy, defender));
    return unit.rushOnly ? attacks : [hero(enemy), ...attacks];
  }

  function summon(game, target, entry, events) {
    const card = cards[entry.id];
    const unit = {
      uid: entry.uid, id: entry.id, attack: card.attack, hp: card.health, maxHp: card.health,
      ready: Boolean(card.charge || card.rush), rushOnly: Boolean(card.rush), gear: [],
      guard: Boolean(card.guard), ward: Boolean(card.ward), pierce: Boolean(card.pierce),
      comeback: Boolean(card.comeback), returned: false, followUp: Boolean(card.followUp), followed: false,
      leech: card.leech || 0, lastHeal: card.lastHeal || 0, lastDraw: card.lastDraw || 0,
      faceDraw: Boolean(card.faceDraw), faceReclaim: Boolean(card.faceReclaim),
      spellPower: card.spellPower || 0, spellHeal: card.spellHeal || 0,
      mend: 0, tempPower: 0, frozen: false
    };
    game.players[target.side].board[target.index] = unit;
    events.push({ type: "summon", target: atUnit(target.side, unit) });
    return unit;
  }

  function wake(unit) {
    unit.ready = true;
    unit.rushOnly = false;
  }

  function upgrade(game, side, target, card, events) {
    const unit = unitAt(game, target);
    const effect = card.upgrade;
    unit.gear.push(card.id);
    unit.attack += effect.attack || 0;
    unit.hp += effect.hp || 0;
    unit.maxHp += effect.hp || 0;
    unit.mend += effect.mend || 0;
    for (const trait of ["guard", "ward", "pierce", "followUp", "killDraw", "killMana"]) {
      if (effect[trait]) unit[trait] = true;
    }
    if (effect.ready) wake(unit);
    if (effect.draw) draw(game, side, events, effect.draw);
    events.push({ type: "buff", target });
  }

  function takeDiscard(game, side, predicate) {
    const discard = game.players[side].discard;
    const index = discard.findLastIndex(predicate);
    return index === -1 ? null : discard.splice(index, 1)[0];
  }

  function reclaim(game, side, predicate, events) {
    if (game.players[side].hand.length >= HAND_LIMIT) return;
    const card = takeDiscard(game, side, predicate);
    if (card) putHand(game, side, { uid: card.uid, id: card.id }, events);
  }

  function recall(game, target, events, discount = 0) {
    const player = game.players[target.side];
    const index = player.board.findIndex(unit => unit?.uid === target.id);
    const [unit] = player.board.splice(index, 1, null);
    putHand(game, target.side, { uid: unit.uid, id: unit.id, discount }, events);
    events.push({ type: "recall", target, card: unit.id });
  }

  function weakest(team) {
    return team.reduce((best, unit) => (!best || unit.hp < best.hp) ? unit : best, null);
  }

  function strongest(team) {
    return team.reduce((best, unit) => (!best || unit.attack > best.attack) ? unit : best, null);
  }

  function setFrozen(game, target, events) {
    unitAt(game, target).frozen = true;
    events.push({ type: "freeze", target });
  }

  function applyEffect(game, side, target, card, events) {
    const enemy = 1 - side;
    const allies = units(game, side);
    const foes = units(game, enemy);
    const source = target.kind === "slot" ? game.players[side].board[target.index] : null;
    const otherAllies = allies.filter(unit => unit !== source);
    const recipient = unitAt(game, target);
    const amount = card.amount || 0;
    const boost = unit => events.push({ type: "buff", target: atUnit(side, unit) });
    switch (card.effect) {
      case "draw":
        draw(game, side, events, amount);
        break;
      case "healHero":
        heal(game, hero(side), amount, events);
        break;
      case "teamHeal":
        heal(game, hero(side), amount, events);
        for (const unit of otherAllies) heal(game, atUnit(side, unit), amount, events);
        break;
      case "pingHero":
        damage(game, hero(enemy), amount, events);
        break;
      case "pingWeakest": {
        const foe = weakest(foes);
        if (foe) damage(game, atUnit(enemy, foe), amount, events);
        break;
      }
      case "freezeStrongest": {
        const foe = strongest(foes.filter(unit => !unit.frozen));
        if (foe) setFrozen(game, atUnit(enemy, foe), events);
        break;
      }
      case "loanMana":
        restoreMana(game, side, amount, events);
        break;
      case "wave":
      case "eclipse": {
        for (const foe of foes) damage(game, atUnit(enemy, foe), amount, events);
        damage(game, hero(enemy), amount, events);
        if (card.effect === "eclipse") restoreMana(game, side, foes.filter(isFalling).length, events);
        break;
      }
      case "teamPower":
        for (const unit of otherAllies) {
          unit.attack += amount;
          boost(unit);
        }
        break;
      case "teamWard":
        for (const unit of otherAllies) {
          unit.ward = true;
          boost(unit);
        }
        break;
      case "rally":
        for (const unit of otherAllies) {
          wake(unit);
          boost(unit);
        }
        break;
      case "rewind":
        wake(recipient);
        boost(recipient);
        break;
      case "recallWeakest": {
        const foe = weakest(foes);
        if (foe) recall(game, atUnit(enemy, foe), events);
        break;
      }
      case "reclaimSpell":
        reclaim(game, side, item => cards[item.id].kind === "spell", events);
        break;
      case "siphon": {
        const foe = strongest(foes);
        if (!foe || foe.attack <= 1) break;
        source.attack += foe.attack - 1;
        foe.attack = 1;
        boost(source);
        events.push({ type: "buff", target: atUnit(enemy, foe) });
        break;
      }
      case "burn":
        damage(game, target, amount, events);
        break;
      case "mirror":
        damage(game, hero(enemy), Math.min(amount, recipient.attack), events);
        break;
      case "heal":
      case "mendWard":
        heal(game, target, amount, events);
        if (card.effect === "mendWard" && recipient) {
          recipient.ward = true;
          boost(recipient);
        }
        break;
      case "tempPower":
      case "teamTemp":
        for (const unit of card.effect === "tempPower" ? [recipient] : allies) {
          unit.attack += amount;
          unit.tempPower += amount;
          boost(unit);
        }
        break;
      case "freeze":
        setFrozen(game, target, events);
        break;
      case "recall":
        recall(game, target, events);
        break;
      case "retreat":
      case "starcross":
        recall(game, target, events, card.effect === "starcross" ? amount : 0);
        draw(game, side, events, card.effect === "starcross" ? 2 : 1);
        break;
      case "revive": {
        heal(game, hero(side), amount, events);
        const index = game.players[side].board.indexOf(null);
        if (index < 0) break;
        const fallen = takeDiscard(game, side, item => item.fallen);
        if (fallen) summon(game, slot(side, index), fallen, events);
        break;
      }
    }
  }

  function play(game, side, uid, target) {
    if (!playTargets(game, side, uid).some(item => sameTarget(item, target))) return null;
    const player = game.players[side];
    const [entry] = player.hand.splice(player.hand.findIndex(card => card.uid === uid), 1);
    const card = cards[entry.id];
    const events = [];
    player.mana -= costOf(entry);
    if (card.kind === "unit") summon(game, target, entry, events);
    if (card.kind === "gear") {
      upgrade(game, side, target, card, events);
    } else {
      applyEffect(game, side, target, card, events);
    }
    if (card.kind === "spell") {
      player.discard.push({ uid: entry.uid, id: entry.id });
      for (const unit of units(game, side)) {
        if (unit.spellHeal) heal(game, hero(side), unit.spellHeal, events);
        if (unit.spellPower) {
          unit.attack += unit.spellPower;
          events.push({ type: "buff", target: atUnit(side, unit) });
        }
      }
    }
    game.moves++;
    finish(game, events);
    return events;
  }

  function attack(game, side, uid, target) {
    if (!attackTargets(game, side, uid).some(item => sameTarget(item, target))) return null;
    const source = units(game, side).find(unit => unit.uid === uid);
    const defender = unitAt(game, target);
    const events = [];
    const sourceTarget = atUnit(side, source);
    const excess = defender && !defender.ward && source.pierce ? Math.max(0, source.attack - defender.hp) : 0;

    source.ready = false;
    const dealt = damage(game, target, source.attack, events);
    if (defender) damage(game, sourceTarget, defender.attack, events);
    if (excess) damage(game, hero(1 - side), excess, events);
    if (source.leech && dealt > 0) heal(game, hero(side), source.leech, events);
    if (!defender && source.faceDraw && game.players[1 - side].hp > 0) draw(game, side, events);
    if (!defender && source.faceReclaim) reclaim(game, side, item => item.fallen, events);

    if (defender && isFalling(defender)) {
      if (source.hp > 0 && source.followUp && !source.followed) {
        source.ready = true;
        source.followed = true;
        events.push({ type: "buff", target: sourceTarget });
      }
      if (source.killDraw) draw(game, side, events, 1);
      if (source.killMana) restoreMana(game, side, 2, events);
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

  // This chooser only uses its own cards and public board information.
  function cpuMove(game, side = 1, rng = Math.random, style = {}) {
    const { face = 0, trade = 0, defense = 0, variance = .15, skill = 1 } = style;
    const enemy = 1 - side;
    const mine = game.players[side];
    const theirs = game.players[enemy];
    const allies = units(game, side);
    const foes = units(game, enemy);
    const threat = foes.reduce((sum, unit) => sum + unit.attack, 0);
    const haveGuard = allies.some(unit => unit.guard);
    const canHitHero = !foes.some(unit => unit.guard);
    const ready = allies.filter(unit => unit.ready);
    const attackTotal = ready.reduce((sum, unit) => sum + (unit.rushOnly ? 0 : unit.attack), 0);
    const spellBurn = mine.hand.filter(entry => {
      const card = cards[entry.id];
      return costOf(entry) <= mine.mana && card.effect === "burn" && card.target === "enemy";
    }).reduce((best, entry) => Math.max(cards[entry.id].amount, best), 0);
    const danger = Math.min(4, threat * (mine.hp < 8 ? .9 : .42));
    const weakestFoe = weakest(foes);

    function scoreAttack(move, defender) {
      const source = allies.find(unit => unit.uid === move.uid);
      if (!defender) {
        if (source.attack >= theirs.hp) return 100;
        if (attackTotal + spellBurn >= theirs.hp) return 42 + source.attack;
        return 2.65 + source.attack * .9 + (LIFE - theirs.hp) * .15 + face +
          (source.faceDraw ? .8 : 0) + (source.leech && mine.hp < LIFE ? .65 : 0);
      }
      const dropsToZero = !defender.ward && source.attack >= defender.hp;
      const kill = dropsToZero && (!defender.comeback || defender.returned);
      const survive = source.ward || defender.attack < source.hp;
      const spare = source.pierce && !defender.ward ? Math.max(0, source.attack - defender.hp) : 0;
      if (spare >= theirs.hp) return 100;
      const follow = kill && source.followUp && !source.followed && survive ? 3.7 : 0;
      const dealt = kill ? 4.3 + defender.attack * 1.11 + (defender.ward ? 0 : defender.gear.length * .38)
        : defender.ward ? 1.7 + defender.attack * .23 : source.attack * .75 + (dropsToZero ? 1 : 0);
      const suffered = survive ? defender.attack * .30 : 3.2 + source.attack * .51;
      return dealt - suffered + follow + spare * .89 + (defender.guard ? 1.75 : 0) +
        (kill && (source.killDraw || source.killMana) ? 1.7 : 0) + trade;
    }

    function scoreGear(card, unit) {
      const upgrade = card.upgrade;
      const stats = (upgrade.attack || 0) * (unit.ready ? 1.45 : .75) + (upgrade.hp || 0) * .80;
      const guard = upgrade.guard && !unit.guard ? 1.2 + (!haveGuard ? danger + defense : 0) : 0;
      const ward = upgrade.ward && !unit.ward ? 2.8 : 0;
      const wakeValue = upgrade.ready ? unit.attack * .88 : 0;
      const perk = upgrade.draw || upgrade.followUp || upgrade.killDraw || upgrade.killMana || upgrade.mend ? 1.5 : 0;
      const pushesLethal = unit.ready && upgrade.attack && canHitHero &&
        attackTotal + spellBurn + upgrade.attack >= theirs.hp;
      return pushesLethal ? 39 : 2.7 + stats + guard + ward + wakeValue + perk +
        Math.min(1.6, unit.hp * .32) - card.cost * .14;
    }

    function effectValue(card, unit) {
      const amount = card.amount || 0;
      switch (card.effect) {
        case "burn":
          if (!unit && theirs.hp <= amount) return 100;
          if (!unit && attackTotal + amount >= theirs.hp && canHitHero) return 39;
          if (!unit) return theirs.hp <= 8 ? 5.5 + face : 1 + face;
          return (unit.ward ? 2.5 : 2 + amount * .45 + (unit.hp <= amount ? 2.6 + unit.attack * .78 : 0)) +
            (unit.guard ? 1.35 : 0) + trade;
        case "wave":
        case "eclipse":
          if (theirs.hp <= amount) return 100;
          return foes.reduce((value, foe) => value + (!foe.ward && foe.hp <= amount ? 2.4 : .65), amount * .4);
        case "draw":
          return mine.pile.length < amount ? -2.8 : amount * (2.75 - mine.hand.length * .23);
        case "heal":
        case "mendWard": {
          const missing = unit ? unit.maxHp - unit.hp : LIFE - mine.hp;
          const urgency = !unit && (mine.hp <= threat || mine.hp < 7) ? 3.8 : 0;
          const ward = unit && card.effect === "mendWard" && !unit.ward ? 2 : 0;
          return Math.min(amount, missing) * .82 + urgency + ward;
        }
        case "healHero":
          return Math.min(amount, LIFE - mine.hp) * (mine.hp < 9 ? .95 : .33);
        case "teamHeal":
          return allies.reduce((sum, ally) => sum + Math.min(amount, ally.maxHp - ally.hp) * .55, 0) +
            Math.min(amount, LIFE - mine.hp) * .55;
        case "pingHero":
          return theirs.hp <= amount ? 100 : amount * .70 + face * .32;
        case "pingWeakest":
          return weakestFoe && !weakestFoe.ward ? (weakestFoe.hp <= amount ? 3 : .65) : 0;
        case "loanMana":
          return amount * .85;
        case "teamPower":
          return allies.length * 1.15;
        case "teamWard":
          return allies.filter(ally => !ally.ward).length * 1.9;
        case "rally":
          return allies.reduce((sum, ally) => sum + (ally.ready && !ally.rushOnly ? -2.7 : ally.attack * .86), 0);
        case "rewind":
          return 2.4 + unit.attack * (canHitHero ? 1 : .84);
        case "freezeStrongest":
        case "freeze":
          return (unit || strongest(foes))?.attack * .78 || 0;
        case "recallWeakest":
        case "recall": {
          const victim = unit || weakestFoe;
          return victim ? 2.2 + victim.attack * .56 + (victim.guard ? 1.6 : 0) + victim.gear.length * .9 : 0;
        }
        case "reclaimSpell":
          return mine.discard.some(item => cards[item.id].kind === "spell") ? 1.55 : 0;
        case "siphon":
          return (strongest(foes)?.attack || 0) * .95;
        case "mirror": {
          const hit = Math.min(amount, unit.attack);
          return hit >= theirs.hp ? 100 : hit * .95 + face;
        }
        case "tempPower":
          if (!unit.ready) return -2;
          return canHitHero && attackTotal + amount >= theirs.hp ? 38 : 3.7 + unit.attack * .20;
        case "teamTemp":
          return canHitHero && attackTotal + ready.length * amount >= theirs.hp ? 38 : ready.length * 1.85;
        case "retreat":
        case "starcross": {
          const missing = unit.maxHp - unit.hp;
          return missing * .65 + (!unit.ready && cards[unit.id].effect ? 1.7 : -2) +
            (card.effect === "starcross" ? 2 : 0) - unit.gear.length * .8;
        }
        case "revive":
          return Math.min(amount, LIFE - mine.hp) * .68 +
            (allies.length < SLOTS && mine.discard.some(item => item.fallen) ? 6.1 : 0);
        default:
          return 0;
      }
    }

    function score(move) {
      const card = cards[move.card];
      const unit = unitAt(game, move.target);
      if (move.kind === "attack") return scoreAttack(move, unit);
      if (card.kind === "gear") return scoreGear(card, unit);
      const effect = effectValue(card, unit);
      if (effect >= 38) return effect;
      if (card.kind === "spell") return effect;

      const guard = card.guard && !haveGuard ? Math.max(0, danger + defense) : 0;
      const speed = card.charge || (card.rush && foes.length) ? .68 + face * .2 : 0;
      const traits = (card.followUp || card.pierce || card.lastDraw || card.faceDraw || card.ward ? 1.05 : 0) +
        (card.comeback ? 1.4 : 0);
      return 4.8 + (card.attack + card.health) * .30 - card.cost * .17 - allies.length * .26 +
        guard + speed + traits + effect * skill - move.target.index * .08;
    }

    let best = null;
    let high = 1.15;
    for (const move of options(game, side)) {
      const value = score(move) + rng() * variance;
      if (value <= high) continue;
      [best, high] = [move, value];
    }
    return best;
  }

  const rules = {
    LIFE, SLOTS, HAND_LIMIT, MANA_LIMIT, DECK_SIZE, cards, elements, rarities, starter,
    copies: count, copyLimit, costOf, validDeck, hero, slot, altar, atUnit, sameTarget,
    create, units, unitAt, playTargets, attackTargets, options, execute, end, cpuMove
  };
  if (commonJs) module.exports = rules;
  else root.AstralRules = rules;
}(globalThis));
