/* Opponent profiles, fair reward odds, and the saved collection. */
(function (root) {
  "use strict";

  const commonJs = typeof module !== "undefined" && module.exports;
  const rules = commonJs ? require("./engine.js") : root.AstralRules;
  const SAVE_KEY = "astral-eclipse.v2";
  const LEGACY_KEY = "astral-eclipse.v1";
  const playerArt = "person_013";

  const rivals = [
    {
      id: "watch", name: "辺境の番兵", art: "person_022", title: "第１の挑戦", difficulty: "入門",
      styleName: "堅実な布陣", description: "小さなユニットを並べ、装備で支える。",
      odds: [38, 40, 18, 4, 0, 0],
      style: { face: -.37, trade: -.38, defense: -.20, skill: .65, variance: .90 },
      deck: {
        squire: 2, hare: 2, slime: 2, hawk: 2, pikeman: 2, keeper: 1, crab: 2,
        hound: 1, tortoise: 1, copper: 2, cloak: 2, bread: 2, torch: 1
      }
    },
    {
      id: "hunt", name: "赤羽の狩人", art: "person_028", title: "第２の挑戦", difficulty: "中級",
      styleName: "速攻と火力", description: "速攻で先手を取り、火の魔法で押し切る。",
      odds: [16, 32, 35, 13, 4, 0],
      style: { face: .68, trade: .47, defense: -.42, skill: .90, variance: .34 },
      deck: {
        hawk: 2, lizard: 1, wolf: 3, bat: 1, candle: 1, spark: 2, talon: 1,
        coal: 1, banner: 1, archer: 1, sword: 1, pikeman: 2, torch: 1, comet: 2, whetstone: 2
      }
    },
    {
      id: "keep", name: "翠壁の騎士", art: "person_120", title: "第３の挑戦", difficulty: "上級",
      styleName: "守護と回復", description: "守護で足を止め、回復して長期戦に持ち込む。",
      odds: [5, 19, 37, 24, 13, 2],
      style: { face: .22, trade: .16, defense: .05, skill: 1.02, variance: .20 },
      deck: {
        squire: 2, slime: 2, keeper: 2, golem: 1, tortoise: 1, dawn: 1, healer: 1, alchemist: 1,
        hare: 2, wood: 1, cloak: 2, bread: 1, comet: 1, torch: 2, crab: 1, waveguard: 1
      }
    },
    {
      id: "moon", name: "月蝕の騎士", art: "person_010", title: "第４の挑戦", difficulty: "最上級",
      styleName: "復活と反撃", description: "復活で盤面を残し、再攻撃で反撃する。",
      odds: [0, 10, 25, 29, 27, 9],
      firstOdds: [0, 0, 0, 0, 78, 22],
      style: { face: .38, trade: .37, defense: .16, skill: 1.14, variance: .12 },
      deck: {
        squire: 2, bat: 2, wolf: 1, golem: 1, dawn: 1, alchemist: 1, wraith: 1, revenant: 1,
        paladin: 1, dragon: 1, scribe: 1, sword: 1, bow: 1, comet: 1, hourglass: 1, mirror: 1, gate: 1, scout: 1, torch: 1, lizard: 1
      }
    }
  ];

  function dictionary(object, filter) {
    if (!object || typeof object !== "object" || Array.isArray(object)) return {};
    return Object.fromEntries(Object.entries(object).filter(filter));
  }

  const positive = value => Number.isSafeInteger(value) && value > 0;
  function readProgress(storage) {
    let data = {};
    let legacy = false;
    try {
      const current = storage.getItem(SAVE_KEY);
      legacy = current === null;
      data = JSON.parse(current || storage.getItem(LEGACY_KEY) || "{}") || {};
    } catch {
      // A new collection is usable even if a device has storage turned off.
    }
    const owned = { ...rules.starter };
    const extra = dictionary(data.prizes, ([id, quantity]) => Object.hasOwn(rules.cards, id) && positive(quantity));
    for (const [id, quantity] of Object.entries(extra)) owned[id] = (owned[id] || 0) + quantity;
    const battles = dictionary(data.battles, ([id, value]) => rivals.some(rival => rival.id === id) && positive(value));
    const clears = dictionary(data.clears, ([id, value]) => rivals.some(rival => rival.id === id) && positive(value));
    return {
      prizes: extra,
      owned,
      deck: !legacy && rules.validDeck(data.deck, owned) ? { ...data.deck } : { ...rules.starter },
      muted: data.muted === true,
      wins: positive(data.wins) ? data.wins : 0,
      battles,
      clears
    };
  }

  function saveProgress(storage, data) {
    try {
      const { deck, prizes, muted, battles, clears, wins } = data;
      storage.setItem(SAVE_KEY, JSON.stringify({ deck, prizes, muted, battles, clears, wins }));
    } catch {
      // A storage failure does not interrupt a fight or discard in-memory rewards.
    }
  }

  function rareOdds(rival, cleared) {
    return (cleared || !rival.firstOdds) ? rival.odds : rival.firstOdds;
  }

  function reward(rival, progress, rng = Math.random) {
    const odds = rareOdds(rival, progress.clears[rival.id]);
    let roll = rng() * odds.reduce((sum, percent) => sum + percent, 0);
    let rarity = 0;
    for (let n = 0; n < odds.length; n++) {
      roll -= odds[n];
      if (roll < 0) {
        rarity = n;
        break;
      }
    }
    const pool = Object.values(rules.cards).filter(card => card.rarity === rarity);
    const missing = pool.filter(card => !progress.owned[card.id]);
    const candidates = missing.length ? missing : pool;
    const chosen = candidates[Math.floor(rng() * candidates.length)];
    const firstCopy = !progress.owned[chosen.id];
    progress.owned[chosen.id] = (progress.owned[chosen.id] || 0) + 1;
    progress.prizes[chosen.id] = (progress.prizes[chosen.id] || 0) + 1;
    progress.clears[rival.id] = (progress.clears[rival.id] || 0) + 1;
    progress.wins++;
    return { id: chosen.id, firstCopy };
  }

  const campaign = { rivals, playerArt, readProgress, saveProgress, rareOdds, reward };
  if (commonJs) module.exports = campaign;
  else root.AstralCampaign = campaign;
}(globalThis));
