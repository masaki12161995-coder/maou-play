/* Astral Eclipse — one card catalog for both players. */
(function (root) {
  "use strict";

  const elements = {
    star: { name: "光", color: "#fee2a0" },
    flame: { name: "炎", color: "#ff9b7a" },
    forest: { name: "土", color: "#b3de8d" },
    shade: { name: "影", color: "#d4a9fa" },
    frost: { name: "氷", color: "#b7f5f6" },
    tide: { name: "水", color: "#8cc8fc" },
    gale: { name: "風", color: "#a8ead2" },
    bolt: { name: "雷", color: "#fce88a" }
  };

  // Frame and text colors follow the bank's six grades.
  const rarities = [
    { name: "白", color: "#e5e7eb", border: "#ffffff22", dark: "#303847" },
    { name: "緑", color: "#6ee7a0", border: "#5ee08a99", dark: "#1b463b" },
    { name: "青", color: "#7ab8ff", border: "#5aa0ff99", dark: "#243f5e" },
    { name: "紫", color: "#d29bff", border: "#c084fc99", dark: "#402e57" },
    { name: "金", color: "#ffd34d", border: "#ffd34dcc", dark: "#593d27" },
    { name: "虹", color: "#e4bbff", border: "#d29bff", dark: "#463257" }
  ];

  const unit = (name, art, element, rarity, cost, attack, health, feature = {}) => ({
    name, art, element, rarity, cost, attack, health, kind: "unit", badge: "", short: "",
    text: "次の自分の番から攻撃できます。", ...feature
  });
  const gear = (name, art, element, rarity, cost, badge, short, text, upgrade) => ({
    name, art, element, rarity, cost, badge, short, text, upgrade, kind: "gear"
  });
  const spell = (name, art, element, rarity, cost, badge, short, text, effect, target, amount) => ({
    name, art, element, rarity, cost, badge, short, text, effect, target, amount, kind: "spell"
  });

  const cards = {
    squire: unit("星の剣士", "person_001", "star", 0, 1, 2, 2),
    hawk: unit("火羽", "monster_089", "flame", 0, 1, 2, 1),
    slime: unit("雫スライム", "monster_001", "tide", 0, 1, 1, 3),
    hare: unit("角うさぎ", "monster_003", "forest", 0, 1, 1, 2, {
      badge: "回復", short: "ライフ＋１", effect: "healHero", amount: 1,
      text: "登場したとき、自分のライフを１回復します。"
    }),
    pikeman: unit("風路の槍兵", "person_095", "gale", 0, 2, 3, 2),
    keeper: unit("門の守兵", "person_080", "forest", 0, 2, 1, 4, {
      guard: true, badge: "守護", short: "守護", text: "守護。相手は守護を持つ味方を先に攻撃します。"
    }),
    crab: unit("入江のカニ", "monster_025", "tide", 0, 2, 2, 4),
    lizard: unit("溶岩ヤモリ", "monster_017", "flame", 0, 2, 2, 1, {
      charge: true, badge: "速攻", short: "速攻", text: "速攻。出した番から攻撃できます。"
    }),
    candle: unit("火灯りの霊", "monster_007", "flame", 0, 2, 1, 2, {
      effect: "pingHero", amount: 1, badge: "火花", short: "相手に１",
      text: "登場したとき、相手のライフに１ダメージを与えます。"
    }),
    wolf: unit("霧狼", "monster_054", "frost", 1, 2, 2, 2, {
      charge: true, badge: "速攻", short: "速攻", text: "速攻。出した番から攻撃できます。"
    }),
    golem: unit("苔の巨兵", "monster_083", "forest", 1, 3, 2, 5, {
      guard: true, badge: "守護", short: "守護", text: "守護。相手は守護を持つ味方を先に攻撃します。"
    }),
    alchemist: unit("森の薬師", "person_008", "forest", 2, 2, 1, 3, {
      effect: "draw", amount: 1, badge: "補充", short: "１枚引く", text: "登場したとき、山札から１枚引きます。"
    }),
    bat: unit("月夜コウモリ", "monster_002", "shade", 1, 1, 1, 2, {
      leech: 1, badge: "吸収", short: "攻撃で回復", text: "攻撃でダメージを与えたとき、自分のライフを１回復します。"
    }),
    frog: unit("沼跳ねガエル", "monster_028", "tide", 1, 2, 2, 3, {
      effect: "healHero", amount: 2, badge: "回復", short: "ライフ＋２", text: "登場したとき、自分のライフを２回復します。"
    }),
    tortoise: unit("岩背のカメ", "monster_094", "forest", 1, 3, 1, 6, {
      guard: true, badge: "守護", short: "守護", text: "守護。相手は守護を持つ味方を先に攻撃します。"
    }),
    archer: unit("風道の射手", "person_044", "gale", 1, 3, 2, 3, {
      effect: "pingWeakest", amount: 1, badge: "狙撃", short: "弱い敵に１",
      text: "登場したとき、体力が最も低い相手ユニット１体に１ダメージを与えます。"
    }),
    spark: unit("稲妻の子", "monster_092", "bolt", 1, 2, 2, 2, {
      effect: "loanMana", amount: 1, badge: "魔力", short: "マナ＋１",
      text: "登場したとき、その番に使えるマナが１戻ります。"
    }),
    hound: unit("鉄顎の猟犬", "monster_022", "forest", 1, 3, 3, 3, {
      rush: true, badge: "突撃", short: "ユニットへ速攻",
      text: "突撃。出した番から相手ユニットを攻撃できます。相手の顔へは次の番から。"
    }),
    dawn: unit("暁の騎士", "person_006", "star", 2, 4, 3, 4, {
      guard: true, effect: "healHero", amount: 2, badge: "守護", short: "守護・ライフ＋２",
      text: "守護。登場したとき、自分のライフを２回復します。"
    }),
    librarian: unit("風詠み", "person_117", "gale", 2, 3, 1, 4, {
      effect: "draw", amount: 1, ward: true, badge: "障壁", short: "障壁・１枚引く",
      text: "障壁で最初のダメージを１回防ぎます。登場したとき、山札から１枚引きます。"
    }),
    lion: unit("碧石の獅子", "monster_067", "forest", 2, 4, 3, 4, {
      guard: true, ward: true, badge: "障壁", short: "守護・障壁",
      text: "守護。障壁で最初のダメージを１回防ぎます。"
    }),
    frostling: unit("結晶の精", "monster_053", "frost", 2, 3, 2, 3, {
      effect: "freezeStrongest", badge: "氷結", short: "強い敵を氷結",
      text: "登場したとき、攻撃力が最も高い相手ユニット１体を、その相手の次の番だけ攻撃できなくします。"
    }),
    healer: unit("河辺の癒し手", "person_052", "tide", 2, 3, 1, 3, {
      effect: "teamHeal", amount: 2, badge: "回復", short: "味方全体＋２",
      text: "登場したとき、味方全員の体力と自分のライフを２回復します。"
    }),
    scout: unit("影の斥候", "person_007", "shade", 2, 2, 2, 1, {
      faceDraw: true, badge: "密報", short: "直接攻撃で１枚",
      text: "相手の顔を攻撃するたび、山札から１枚引きます。"
    }),
    banner: unit("黒旗の先導", "monster_078", "shade", 2, 3, 2, 3, {
      effect: "teamPower", amount: 1, badge: "鼓舞", short: "他の味方の攻撃＋１",
      text: "登場したとき、ほかの味方全員の攻撃力が１上がります。"
    }),
    wraith: unit("影の渡り手", "monster_066", "shade", 3, 4, 3, 3, {
      effect: "wave", amount: 1, badge: "全体", short: "敵全体に１",
      text: "登場したとき、相手と相手のユニット全員に１ダメージを与えます。"
    }),
    harpy: unit("翼の踊り手", "monster_090", "gale", 3, 4, 3, 3, {
      effect: "recallWeakest", badge: "送還", short: "弱い敵を手札へ",
      text: "登場したとき、体力が最も低い相手ユニット１体を相手の手札に戻します。"
    }),
    revenant: unit("還らぬ騎士", "monster_056", "shade", 3, 4, 3, 3, {
      comeback: true, badge: "復活", short: "最初の撃破で復活",
      text: "最初に倒されたとき、体力１で場に残ります。その番は攻撃できません。"
    }),
    talon: unit("疾風の狩人", "person_027", "gale", 3, 4, 3, 4, {
      pierce: true, badge: "貫通", short: "余ったダメージを相手へ",
      text: "相手ユニットへの攻撃で体力を超えた分のダメージが、相手のライフにも届きます。"
    }),
    scribe: unit("禁書の魔術師", "monster_059", "shade", 3, 4, 2, 4, {
      effect: "reclaimSpell", badge: "再読", short: "使った魔法を回収",
      text: "登場したとき、最後に使った魔法を捨て札から手札に戻します。"
    }),
    sentinel: unit("赤煉瓦の番人", "monster_063", "forest", 3, 5, 3, 6, {
      guard: true, lastHeal: 3, badge: "遺光", short: "守護・倒れて回復",
      text: "守護。倒されたとき、自分のライフを３回復します。"
    }),
    paladin: unit("日輪騎士", "monster_070", "star", 4, 5, 4, 4, {
      followUp: true, badge: "追撃", short: "撃破で再攻撃",
      text: "攻撃で相手ユニットを倒して生き残ると、もう一度攻撃できます。各ターン１回。"
    }),
    choir: unit("白翼の導き手", "monster_065", "star", 4, 5, 3, 4, {
      effect: "teamWard", badge: "結界", short: "ほかの味方に障壁",
      text: "登場したとき、ほかの味方全員に障壁を与え、次のダメージを１回防ぎます。"
    }),
    reaper: unit("命巻きの死神", "monster_103", "shade", 4, 5, 4, 3, {
      faceReclaim: true, badge: "回収", short: "直接攻撃で味方回収",
      text: "相手の顔を攻撃するたび、最後に倒された味方１体を捨て札から手札に戻します。"
    }),
    shrine: unit("香炉の司祭", "monster_071", "star", 4, 5, 2, 5, {
      spellHeal: 2, badge: "祈り", short: "魔法を使うたび回復",
      text: "場にいる間、自分が魔法を使うたび、自分のライフを２回復します。"
    }),
    dragon: unit("星喰いの獣", "monster_073", "shade", 5, 6, 5, 6, {
      effect: "rally", badge: "再動", short: "ほかの味方が再攻撃",
      text: "登場したとき、ほかの味方全員がすぐに攻撃できます。攻撃済みの味方も、もう一度攻撃できます。"
    }),
    sovereign: unit("鎖牙の王", "monster_057", "shade", 5, 6, 4, 5, {
      effect: "siphon", badge: "奪力", short: "強い敵の攻撃を奪う",
      text: "登場したとき、攻撃力が最も高い敵１体の攻撃力を１にし、減った分だけ自身の攻撃力を上げます。"
    }),
    coal: unit("灯火の魔神", "monster_104", "flame", 4, 5, 4, 4, {
      spellPower: 1, badge: "連鎖", short: "魔法を使うたび攻撃＋１",
      text: "場にいる間、自分が魔法を使うたび、このユニットの攻撃力が１上がります。"
    }),
    unicorn: unit("白角の霊獣", "monster_097", "star", 2, 4, 3, 4, {
      ward: true, badge: "障壁", short: "ダメージを１回防ぐ", text: "障壁で最初のダメージを１回防ぎます。"
    }),
    waveguard: unit("波の槍士", "person_108", "tide", 1, 3, 3, 4),
    sandstone: unit("砂岩の巨人", "monster_049", "forest", 2, 5, 4, 6, {
      effect: "loanMana", amount: 1, badge: "魔力", short: "マナ＋１",
      text: "登場したとき、その番に使えるマナが１戻ります。"
    }),
    mimic: unit("箱食い", "monster_081", "shade", 1, 3, 2, 3, {
      lastDraw: 1, badge: "遺品", short: "倒れると１枚引く", text: "倒されたとき、山札から１枚引きます。"
    }),

    sword: gear("星鉄の剣", "eq_sword_03", "star", 1, 2, "剣＋２", "攻撃＋２",
      "味方１体に装備。場にいる間、そのユニットの攻撃力が２上がります。", { attack: 2 }),
    shield: gear("銀の盾", "eq_shield_04", "star", 2, 2, "守護", "体力＋２・守護",
      "味方１体に装備。体力の上限と現在の体力が２上がり、守護を得ます。", { hp: 2, guard: true }),
    wood: gear("木の盾", "eq_shield_01", "forest", 0, 1, "守護", "体力＋１・守護",
      "味方１体に装備。体力の上限と現在の体力が１上がり、守護を得ます。", { hp: 1, guard: true }),
    copper: gear("銅の剣", "eq_sword_01", "star", 0, 1, "剣＋１", "攻撃＋１",
      "味方１体に装備。そのユニットの攻撃力が１上がります。", { attack: 1 }),
    cloak: gear("緑布の外套", "eq_cloak_02", "forest", 0, 1, "体＋２", "体力＋２",
      "味方１体に装備。体力の上限と現在の体力が２上がります。", { hp: 2 }),
    bow: gear("黒木の弓", "eq_bow_03", "shade", 1, 2, "貫通", "攻撃＋１・貫通",
      "味方１体に装備。攻撃力が１上がり、攻撃で敵ユニットの体力を超えたダメージが敵の顔に届きます。", { attack: 1, pierce: true }),
    swift: gear("雪歩きの靴", "eq_boots_03", "frost", 1, 2, "再動", "すぐに攻撃",
      "味方１体に装備。この番すぐに攻撃できます。攻撃済みでも、もう一度攻撃できます。", { ready: true }),
    riverboots: gear("蛇革の靴", "eq_boots_04", "forest", 2, 2, "障壁", "体力＋１・障壁",
      "味方１体に装備。体力が１上がり、障壁で次のダメージを１回防ぎます。", { hp: 1, ward: true }),
    staff: gear("若葉の杖", "eq_staff_05", "star", 2, 2, "補充", "体力＋１・１枚引く",
      "味方１体に装備。体力が１上がり、山札から１枚引きます。", { hp: 1, draw: 1 }),
    fang: gear("竜骨の槍", "eq_spear_07", "shade", 3, 3, "遺品", "攻撃＋２・撃破で１枚",
      "味方１体に装備。攻撃力が２上がり、攻撃で敵を倒すたび山札から１枚引きます。", { attack: 2, killDraw: true }),
    veil: gear("紫紋の盾", "eq_shield_06", "shade", 3, 3, "障壁", "体力＋２・守護・障壁",
      "味方１体に装備。体力が２上がり、守護と障壁を得ます。障壁は次のダメージを１回防ぎます。", { hp: 2, ward: true, guard: true }),
    solar: gear("暁の剣", "eq_sword_10", "flame", 4, 3, "追撃", "攻撃＋１・撃破で再攻撃",
      "味方１体に装備。攻撃力が１上がり、敵ユニットを倒して生き残ると再攻撃できます。各ターン１回。", { attack: 1, followUp: true }),
    relic: gear("星灯の盾", "eq_shield_08", "star", 4, 3, "修復", "守護・番の終わりに回復",
      "味方１体に装備。体力が２上がり、守護を得ます。自分の番の終わりにこの味方の体力を２回復します。", { hp: 2, guard: true, mend: 2 }),
    eclipseblade: gear("月蝕の剣", "eq_sword_11", "shade", 5, 4, "奪魔", "攻撃＋２・撃破でマナ",
      "味方１体に装備。攻撃力が２上がり、攻撃で敵ユニットを倒すたび、その番のマナが２戻ります。", { attack: 2, killMana: true }),

    elixir: spell("生命の雫", "tool_012", "forest", 1, 1, "癒４", "４回復",
      "傷ついた自分か味方１体の、ライフか体力を４回復します。", "heal", "ally", 4),
    torch: spell("燃えるたいまつ", "tool_030", "flame", 0, 1, "傷２", "敵１体に２",
      "相手ユニット１体に２ダメージを与えます。", "burn", "enemyUnit", 2),
    bread: spell("旅の丸パン", "tool_032", "forest", 0, 1, "癒２", "２回復",
      "傷ついた自分か味方１体の、ライフか体力を２回復します。", "heal", "ally", 2),
    whetstone: spell("砥石", "tool_031", "forest", 0, 1, "剣＋２", "この番 攻撃＋２",
      "味方１体の攻撃力が、この番だけ２上がります。", "tempPower", "unit", 2),
    comet: spell("流星火", "mat_113", "flame", 2, 2, "傷３", "３ダメージ",
      "相手か相手ユニット１体に３ダメージを与えます。守護を通り越して狙えます。", "burn", "enemy", 3),
    gate: spell("星門", "mat_059", "star", 3, 3, "札２", "２枚引く",
      "自分の場で発動。山札から２枚引きます。", "draw", null, 2),
    frostRune: spell("氷の印", "mat_026", "frost", 1, 2, "氷結", "敵の次の攻撃を止める",
      "相手ユニット１体を、相手の次の番だけ攻撃できなくします。", "freeze", "enemyUnit"),
    retreat: spell("退潮の書", "tool_008", "tide", 1, 2, "帰還", "味方を戻し１枚引く",
      "味方１体を自分の手札に戻し、山札から１枚引きます。再び出せば登場時の効果を使えます。", "retreat", "unit"),
    medic: spell("薬布の包帯", "mat_028", "forest", 2, 2, "癒５", "５回復・味方に障壁",
      "自分のライフか、味方１体の体力を５回復します。味方を選んだ場合は障壁も与えます。", "mendWard", "ally", 5),
    gust: spell("風の玉", "mat_111", "gale", 2, 2, "送還", "３マナ以下の敵を戻す",
      "必要マナが３以下の相手ユニットを１体選び、相手の手札に戻します。", "recall", "smallEnemy"),
    warhorn: spell("号令の角笛", "tool_027", "gale", 2, 3, "鼓舞", "この番 味方全員攻撃＋１",
      "自分の場で発動。この番だけ、味方全員の攻撃力を１上げます。", "teamTemp", "team", 1),
    mirror: spell("月映しの鏡", "tool_040", "shade", 3, 3, "反射", "敵の攻撃力を相手へ",
      "相手ユニット１体を選び、その攻撃力の分だけ相手のライフにダメージを与えます（最大５）。", "mirror", "enemyUnit", 5),
    hourglass: spell("逆巻く時", "mat_066", "shade", 3, 3, "再動", "味方１体が再攻撃",
      "味方１体がすぐに攻撃できます。攻撃済みでも、もう一度攻撃できます。", "rewind", "unit"),
    chalice: spell("夜明けの聖杯", "tool_044", "star", 4, 4, "蘇生", "味方を蘇生・４回復",
      "自分の場で発動。ライフを４回復し、空き枠があれば最後に倒された味方を体力満タンで場に戻します。", "revive", null, 4),
    eclipse: spell("蝕の秘典", "tool_020", "shade", 5, 4, "全体", "敵全体に２・撃破でマナ",
      "自分の場で発動。相手と相手ユニット全員に２ダメージを与え、倒したユニット１体につきマナが１戻ります。", "eclipse", null, 2),
    starcross: spell("星渡りの宝玉", "mat_093", "star", 5, 4, "転生", "味方を戻し２枚引く",
      "味方１体を手札に戻して２枚引きます。戻した味方を次に出すマナが３減ります。", "starcross", "unit", 3)
  };

  for (const [id, card] of Object.entries(cards)) {
    card.id = id;
    if (card.upgrade) Object.freeze(card.upgrade);
    Object.freeze(card);
  }
  Object.freeze(cards);

  const starter = Object.freeze({
    squire: 3, hawk: 2, slime: 2, keeper: 2, pikeman: 2, wolf: 2, golem: 1,
    waveguard: 1, copper: 2, wood: 1, torch: 2, bread: 1, elixir: 1
  });

  const content = { cards, elements, rarities, starter };
  if (typeof module !== "undefined" && module.exports) module.exports = content;
  else root.AstralCards = content;
}(globalThis));
