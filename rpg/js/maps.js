// 地図（序章：トルカ村・リム川の渡し・中州・ささやきの森・森の婆の庵・苔むす祠・西街道の入口）
// 地面の文字：.草 =土の道 c石畳 T木 ~水 b桟橋 f柵 p板の床 w壁 D出口 m沼 h畑 y月夜草 R岩 W石の壁 _石の床 （空白）＝何もない
// 人：img＝人物の絵／mon＝魔物の絵。when＝居る条件（g＝遊んでいる記録。g.flags.s＝物語の進み、g.flags.cut＝いま流れている場面）
// 置き物：talk＝調べたときの出来事、text＝調べたときの文。trigs＝そのマスに入ると起きる出来事
(function (root) {
"use strict";
function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function fill(g, ch, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch; }
const S = g => g.flags.s || 0, cut = (g, k) => g.flags.cut === k;

// ---------- 渡し小屋の中 ----------
function hut() {
  const g = grid(7, 7, "w"); fill(g, "p", 1, 1, 5, 5); g[6][3] = "D";
  return {
    id: "hut", nm: "渡し小屋", g, tier: 0, bg: null, inside: 1,
    objs: [
      { t: "bed", x: 1, y: 1, w: 1, h: 2, talk: "hutBed" },
      { t: "oarRack", x: 4, y: 0, text: ["長い櫂。舟を漕ぐにも、身を守るにも使う。"] },
      { t: "pillar", x: 2, y: 0, text: ["背丈の傷。毎年、村長が刻んでくれた。"] },
      { t: "shelf", x: 5, y: 1, text: ["不格好な木彫りの人形。角が片方欠けている。"] },
    ],
    exits: [{ x: 3, y: 6, to: "ferry", tx: 4, ty: 16, dir: 0 }],
    npcs: [
      { id: "dona", x: 3, y: 5, img: "person_077", dir: 3, nm: "ドナ", when: g => cut(g, "s1") },
      { id: "lise", x: 4, y: 3, img: "person_002", dir: 1, nm: "リゼット", when: g => cut(g, "s11") },
    ],
    foes: [], chests: [], trigs: [{ x: 3, y: 5, when: g => S(g) === 12, run: "s11" }],
  };
}

// ---------- リム川の渡し（W2）：西に村、東は川。桟橋から舟が出る ----------
function ferry() {
  const wild = g => S(g) >= 2 && S(g) !== 11 && S(g) !== 12; // 半鐘が鳴ってからの夕暮れと夜は、魔物は出ない
  const W = 16, H = 34, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 2); fill(g, "T", 0, 0, 1, H); fill(g, "T", 0, H - 2, W, 2);
  fill(g, "~", 10, 0, 6, H);
  fill(g, "T", 1, 2, 2, 11); fill(g, "T", 1, 20, 2, 12);
  fill(g, "=", 0, 17, 10, 1); fill(g, "=", 6, 4, 1, 27); fill(g, "=", 4, 16, 1, 1);
  fill(g, "b", 10, 17, 3, 1);
  g[9][9] = "T"; g[25][8] = "T"; g[5][3] = "T"; g[28][4] = "T";
  return {
    id: "ferry", nm: "リム川の渡し", g, tier: 1, bg: "meadow",
    objs: [
      { t: "house", x: 3, y: 14, w: 3, h: 2, roof: "brown", door: 1, chimney: 1 },
      { t: "boat", x: 10, y: 18, w: 3, h: 1, talk: "boat" },
      { t: "post", x: 9, y: 19, w: 1, h: 1 },
      { t: "kaeri", x: 8, y: 7, talk: "kaeri" },
      { t: "sign", x: 7, y: 16, text: ["リム川の渡し"] },
      // 川下の簗場
      { t: "weir", x: 10, y: 29, w: 3, h: 1, web: 1, when: g => S(g) <= 2 }, { t: "weir", x: 10, y: 29, w: 3, h: 1, when: g => S(g) > 2 },
      { t: "willow", x: 9, y: 27, w: 1, h: 2 },
      { t: "sign", x: 7, y: 26, text: ["この先　簗場"] },
    ],
    exits: [{ x: 4, y: 15, to: "hut", tx: 3, ty: 5, dir: 3 }, { x: 0, y: 17, to: "village", tx: 14, ty: 11, dir: 1 }],
    npcs: [
      { id: "hop", x: 8, y: 18, img: "person_071", dir: 3, nm: "ホップ", talk: "s2", when: g => S(g) === 1 },
      { id: "martha", x: 7, y: 18, img: "person_026", dir: 3, nm: "マーサ", talk: "s2", when: g => S(g) === 1 },
      { id: "lise", x: 9, y: 18, img: "person_002", dir: 1, nm: "娘", talk: "s4", when: g => S(g) === 3 },
      // 場面3：簗場。柳の上のヤン爺と、簗の上の親蜘蛛
      { id: "yanUp", x: 9, y: 27, img: "person_019", dir: 0, lift: 4, nm: "ヤン爺", when: g => S(g) <= 2 },
      { id: "yan", x: 8, y: 29, img: "person_019", dir: 2, nm: "ヤン爺", talk: "yan", when: g => S(g) >= 3 && S(g) !== 11 && S(g) !== 12 },
      { id: "oya", x: 11, y: 29, mon: "m_oyagumo", face: 1, big: 1, nm: "オヤミズグモ", when: g => S(g) === 2 },
      // 場面10：黒外套の一団と、村の人たち
      { id: "sig", x: 8, y: 17, img: "person_010", dir: 1, nm: "傷の男", when: g => cut(g, "s10") },
      { id: "k1", x: 8, y: 16, mon: "monster_019", face: -1, nm: "黒外套の兵", when: g => cut(g, "s10") },
      { id: "k2", x: 8, y: 18, mon: "monster_020", face: -1, nm: "黒外套の兵", when: g => cut(g, "s10") },
      { id: "k3", x: 9, y: 15, mon: "monster_021", face: -1, nm: "黒外套の兵", when: g => cut(g, "s10") },
      { id: "dona", x: 6, y: 17, img: "person_077", dir: 2, nm: "ドナ", when: g => cut(g, "s10") || cut(g, "s10d") || cut(g, "s12") },
      { id: "tim", x: 5, y: 18, img: "person_069", dir: 2, nm: "ティム", when: g => cut(g, "s10") },
      { id: "hop9", x: 9, y: 18, img: "person_071", dir: 1, nm: "ホップ", when: g => cut(g, "s10") },
      { id: "martha9", x: 9, y: 16, img: "person_026", dir: 1, nm: "マーサ", when: g => cut(g, "s10") },
      // 場面11：夜の見張り
      { id: "watch", x: 8, y: 17, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => cut(g, "s11b") },
      { id: "dona10", x: 7, y: 17, img: "person_077", dir: 2, nm: "ドナ", when: g => cut(g, "s11b") },
      // 場面12：土手の上の兵
      { id: "ka", x: 5, y: 16, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => cut(g, "s12b") || cut(g, "s12c") },
      { id: "kb", x: 4, y: 17, mon: "monster_020", face: 1, nm: "黒外套の兵", when: g => cut(g, "s12b") || cut(g, "s12c") },
      { id: "sig11", x: 3, y: 17, img: "person_010", dir: 2, nm: "傷の男", when: g => cut(g, "s12c") },
    ],
    foes: [
      // 川べりの魔物：1体なら楽、2体はきつい。道の脇に居るので、避けて通れる
      { id: "f1", x: 8, y: 9, k: "koromochi", g: ["koromochi"], when: wild },
      { id: "f2", x: 4, y: 6, k: "koromochi", g: ["koromochi", "koromochi"], when: wild },
      { id: "f3", x: 8, y: 21, k: "mizugumo", g: ["mizugumo"], when: wild },
      { id: "f4", x: 3, y: 22, k: "koromochi", g: ["koromochi", "koromochi"], when: wild },
      { id: "f5", x: 4, y: 30, k: "mizugumo", g: ["mizugumo", "koromochi"], when: g => wild(g) && S(g) >= 3 },
    ],
    chests: [{ id: "c_ferry", x: 3, y: 31, gold: 40 }],
    trigs: [{ x: 3, y: 27, w: 6, h: 1, when: g => S(g) === 2, run: "s3" }],
  };
}

// ---------- トルカ村（W1） ----------
function village() {
  const W = 16, H = 22, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 2); fill(g, "T", 0, 0, 2, H); fill(g, "T", 0, H - 2, W, 2); fill(g, "T", W - 1, 0, 1, H);
  fill(g, "=", 4, 11, 12, 1); fill(g, "c", 6, 9, 5, 5); fill(g, "=", 8, 4, 1, 16);
  fill(g, "h", 3, 16, 3, 3); fill(g, "h", 11, 16, 3, 3);
  return {
    id: "village", nm: "トルカ村", g, tier: 0, bg: null,
    objs: [
      { t: "house", x: 3, y: 5, w: 4, h: 3, roof: "red", door: 2, chimney: 1 },
      { t: "house", x: 10, y: 5, w: 4, h: 3, roof: "blue", door: 1 },
      { t: "house", x: 3, y: 12, w: 3, h: 2, roof: "green", door: 1 },
      { t: "house", x: 11, y: 12, w: 3, h: 2, roof: "brown", door: 1, chimney: 1 },
      { t: "well", x: 8, y: 11 },
      { t: "kaeri", x: 13, y: 9, talk: "kaeri" },
      { t: "sign", x: 13, y: 10, text: ["トルカ村"] },
      { t: "sign", x: 14, y: 8, text: ["トルカ村の礼拝堂"] },
    ],
    exits: [{ x: 15, y: 11, to: "ferry", tx: 1, ty: 17, dir: 2 }],
    npcs: [
      { id: "dona", x: 5, y: 9, img: "person_077", dir: 0, nm: "ドナ", talk: "donaHome", when: g => S(g) !== 12 },
      // 集める仲間（序章のあいだは、会えるだけ）
      { id: "seri", x: 12, y: 14, img: "person_017", dir: 0, nm: "セリ", talk: "seri" },
      { id: "karin", x: 12, y: 8, img: "person_105", dir: 0, nm: "カリン", talk: "karin" },
      { id: "sig", x: 8, y: 9, img: "person_010", dir: 0, nm: "傷の男", talk: "sigVillage", when: g => S(g) === 12 },
      { id: "k1", x: 6, y: 10, mon: "monster_019", face: -1, nm: "黒外套の兵", talk: "kuro", when: g => S(g) === 12 },
      { id: "k2", x: 10, y: 10, mon: "monster_020", face: 1, nm: "黒外套の兵", talk: "kuro", when: g => S(g) === 12 },
      { id: "k3", x: 9, y: 13, mon: "monster_021", face: 1, nm: "黒外套の兵", talk: "kuro", when: g => S(g) === 12 },
      { id: "k4", x: 12, y: 11, mon: "monster_018", face: 1, nm: "黒外套の兵", talk: "kuro", when: g => S(g) === 12 },
    ],
    foes: [], chests: [], trigs: [],
  };
}

// ---------- 舟の上（場面のあいだだけ） ----------
function river() {
  const g = grid(13, 28, "~"); fill(g, "T", 0, 0, 13, 4);
  const B = k => g => cut(g, k);
  return {
    id: "river", nm: "リム川", g, tier: 0, bg: null, noFollow: 1, fixedCam: 1,
    objs: [{ t: "boat", x: 5, y: 14, w: 3, h: 1 }],
    exits: [],
    npcs: [
      { id: "hop", x: 5, y: 14, img: "person_071", dir: 2, nm: "ホップ", when: g => cut(g, "s2") || cut(g, "s10c") },
      { id: "martha", x: 7, y: 14, img: "person_026", dir: 1, nm: "マーサ", when: g => cut(g, "s2") || cut(g, "s10c") },
      { id: "lise", x: 5, y: 14, img: "person_002", dir: 2, nm: "リゼット", when: g => cut(g, "s4") || cut(g, "s10b") || cut(g, "s12d") },
      { id: "muku", x: 7, y: 14, img: "person_058h", dir: 1, nm: "ムク", when: B("s12d") },
    ],
    foes: [], chests: [], trigs: [],
  };
}

// ---------- 川の中州 ----------
function sandbar() {
  const g = grid(13, 18, "~"); fill(g, ".", 3, 3, 7, 10); fill(g, "h", 4, 4, 2, 4); fill(g, "h", 7, 4, 2, 3); fill(g, "=", 6, 4, 1, 9);
  g[13][6] = "b"; g[3][3] = "~"; g[3][9] = "~"; g[12][3] = "~"; g[12][9] = "~";
  return {
    id: "sandbar", nm: "川の中州", g, tier: 1, bg: "meadow", noFollow: 1,
    objs: [{ t: "boat", x: 5, y: 14, w: 3, h: 1 }],
    exits: [],
    npcs: [
      { id: "otter", x: 6, y: 6, mon: "m_kawauso", face: 1, nm: "カワウソ盗", when: g => cut(g, "s2b") },
      { id: "hop", x: 5, y: 10, img: "person_071", dir: 3, nm: "ホップ", when: g => cut(g, "s2b") || cut(g, "s2c") || cut(g, "s10c") },
      { id: "martha", x: 7, y: 10, img: "person_026", dir: 3, nm: "マーサ", when: g => cut(g, "s2b") || cut(g, "s2c") || cut(g, "s10c") },
    ],
    foes: [], chests: [], trigs: [],
  };
}

// ---------- ささやきの森（W3） ----------
function forest() {
  const W = 24, H = 36, g = grid(W, H, "T");
  fill(g, "~", 0, 0, 3, H);
  const path = (x, y, w, h) => fill(g, "=", x, y, w, h), open = (x, y, w, h) => fill(g, ".", x, y, w, h);
  g[31][3] = "c"; g[31][4] = "c"; g[30][3] = "c"; g[30][4] = "c";         // 苔むした石の船着き
  open(3, 29, 4, 4); g[30][3] = "c"; g[31][3] = "c"; g[30][4] = "c"; g[31][4] = "c";
  path(5, 31, 4, 1); path(8, 19, 1, 13);                                   // 岸から小道を北へ
  open(7, 26, 4, 3); path(8, 26, 1, 3);                                    // 還り石のあたり
  open(7, 20, 3, 3); path(8, 20, 1, 3);                                    // 力比べの場所
  open(6, 11, 10, 8); path(8, 17, 1, 2);                                   // 切り株の広場
  path(11, 6, 1, 5); open(10, 5, 3, 2);                                    // 獣道（北へ。茨でふさがっている）
  path(16, 14, 5, 1); open(17, 12, 5, 2);                                  // 庵への道
  path(20, 14, 1, 10);                                                     // 分かれ目から南へ
  open(19, 16, 3, 2);                                                      // 狼の群れがふさぐ所
  open(19, 18, 5, 3); path(20, 18, 1, 3);                                  // 分かれ目（東に祠の門）
  open(12, 23, 11, 3); fill(g, "m", 12, 26, 11, 7); open(12, 25, 11, 1);   // ヌシの沼
  g[25][13] = "y"; g[25][16] = "y"; g[25][21] = "y"; g[24][12] = "y";
  path(20, 23, 1, 2);
  return {
    id: "forest", nm: "ささやきの森", g, tier: 1, bg: "canopy",
    objs: [
      { t: "boat", x: 0, y: 30, w: 3, h: 1, talk: "boat" },
      { t: "kaeri", x: 10, y: 27, talk: "kaeri" },
      { t: "stump", x: 10, y: 14, w: 2, h: 2 },
      { t: "thorns", x: 11, y: 8, talk: "thorns" }, { t: "thorns", x: 11, y: 7, talk: "thorns" },
      { t: "house", x: 18, y: 10, w: 3, h: 2, roof: "green", door: 1, chimney: 1 },
      { t: "shrineGate", x: 22, y: 18, w: 2, h: 2 },
    ],
    exits: [{ x: 19, y: 11, to: "hermit", tx: 3, ty: 5, dir: 3 }, { x: 22, y: 19, to: "shrine", tx: 6, ty: 26, dir: 3 }],
    npcs: [
      { id: "muku9", x: 5, y: 30, img: "person_058", dir: 1, nm: "ムク", talk: "mukuWait", when: g => S(g) === 11 && !!g.flags.mukuStay },
      { id: "nene10", x: 5, y: 30, img: "person_041", dir: 1, nm: "ネネ", when: g => ["s11c", "s11d", "s11e"].includes(g.flags.cut) },
      { id: "muku10", x: 5, y: 31, img: "person_058", dir: 1, nm: "ムク", when: g => cut(g, "s11c") },
      { id: "muku10h", x: 5, y: 31, img: "person_058h", dir: 1, nm: "ムク", when: g => cut(g, "s11d") },
      // 場面6：力比べのドングリ兵
      { id: "d1", x: 8, y: 21, mon: "m_donguri", face: 1, nm: "ドングリ兵", when: g => S(g) <= 5 },
      { id: "d2", x: 7, y: 21, mon: "m_donguri", face: 1, nm: "ドングリ兵", when: g => S(g) <= 5 },
      { id: "d3", x: 9, y: 21, mon: "m_donguri", face: -1, nm: "ドングリ兵", when: g => S(g) <= 5 },
      // 場面7：切り株の広場
      { id: "koke", x: 9, y: 13, mon: "monster_094", face: 1, nm: "コケ爺", talk: "koke" },
      { id: "owl", x: 10, y: 14, img: "person_054", dir: 0, nm: "夜番", talk: "owl" },
      { id: "da", x: 13, y: 12, mon: "m_donguri", face: -1, nm: "ドングリ兵", talk: "dongu" },
      { id: "db", x: 7, y: 16, mon: "m_donguri", face: 1, nm: "ドングリ兵", talk: "dongu" },
      { id: "north", x: 14, y: 17, img: "person_040", dir: 1, nm: "北の子", talk: "north" },
      { id: "mukuC", x: 13, y: 17, img: "person_058", dir: 2, nm: "ムク", talk: "mukuC", when: g => S(g) <= 7 },
      // 場面9：沼への道をふさぐ狼の群れ
      { id: "wa", x: 20, y: 17, mon: "m_ookami", face: 1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "wb", x: 19, y: 17, mon: "m_ookami", face: 1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "wc", x: 21, y: 17, mon: "m_ookami", face: -1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "wd", x: 20, y: 18, mon: "m_ookami", face: -1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "nushi", x: 17, y: 26, mon: "m_nushi", face: 1, big: 1, nm: "ヌシガエル", when: g => S(g) <= 9 },
      // 集める仲間（序章のあいだは、会えるだけ）
      { id: "toraji", x: 6, y: 32, img: "person_009", dir: 1, nm: "トラジ", talk: "toraji" },
      { id: "komari", x: 10, y: 26, img: "person_046", dir: 1, nm: "コマリ", talk: "komari" },
    ],
    foes: [
      { id: "w1", x: 8, y: 24, k: "donguri", g: ["donguri", "koromochi"], when: g => S(g) >= 6 },
      { id: "w3", x: 18, y: 13, k: "donguri", g: ["donguri", "donguri", "mizugumo"], when: g => S(g) >= 9 },
      { id: "w5", x: 19, y: 20, k: "moriookami", g: ["moriookami", "moriookami"], when: g => S(g) >= 9 },
      { id: "w2", x: 14, y: 23, k: "koromochi", g: ["koromochi", "koromochi", "donguri"], when: g => S(g) >= 10 },
      { id: "w4", x: 16, y: 24, k: "mizugumo", g: ["mizugumo", "moriookami", "koromochi"], when: g => S(g) >= 10 },
    ],
    chests: [{ id: "c_forest1", x: 6, y: 12, item: "oakclub" }, { id: "c_forest2", x: 22, y: 24, item: "needle" }, { id: "c_forest3", x: 15, y: 11, tool: "book1" }],
    trigs: [
      { x: 8, y: 28, when: g => S(g) === 4, run: "s5" },
      { x: 8, y: 22, when: g => S(g) === 5, run: "s6" },
      { x: 8, y: 18, when: g => S(g) === 6, run: "s7" },
      { x: 19, y: 16, w: 3, h: 1, when: g => S(g) === 8, run: "s9a" },
      { x: 19, y: 16, w: 3, h: 1, when: g => S(g) < 8, run: "wolfBlock" },
      { x: 19, y: 19, w: 5, h: 1, when: g => S(g) === 9 && !g.flags.fork, run: "s9b" },
      { x: 20, y: 24, w: 1, h: 1, when: g => S(g) === 9, run: "s9" }, { x: 17, y: 25, when: g => S(g) === 9, run: "s9" }, { x: 16, y: 25, when: g => S(g) === 9, run: "s9" }, { x: 18, y: 25, when: g => S(g) === 9, run: "s9" },
      { x: 20, y: 21, when: g => S(g) === 10, run: "s10" },
    ],
  };
}

// ---------- 森の婆の庵（W3a） ----------
function hermit() {
  const g = grid(7, 7, "w"); fill(g, "p", 1, 1, 5, 5); g[6][3] = "D";
  return {
    id: "hermit", nm: "森の婆の庵", g, tier: 0, bg: null, inside: 1,
    objs: [
      { t: "bed", x: 1, y: 1, w: 1, h: 2, talk: "rest" },
      { t: "hearth", x: 5, y: 1 },
      { t: "table", x: 3, y: 3 },
      { t: "chair", x: 2, y: 3 },
      { t: "chair", x: 4, y: 3, dust: 1, talk: "chair" },
      { t: "hatWall", x: 4, y: 0, when: g => !g.flags.hat },
    ],
    exits: [{ x: 3, y: 6, to: "forest", tx: 19, ty: 12, dir: 0 }],
    npcs: [
      { id: "nene", x: 3, y: 2, img: "person_041", dir: 0, nm: "ネネ", talk: "nene", when: g => !["s11c", "s11d", "s11e"].includes(g.flags.cut) },
      { id: "mukuIn", x: 4, y: 5, img: "person_058", dir: 3, nm: "ムク", when: g => cut(g, "s8") },
    ],
    foes: [], chests: [], trigs: [{ x: 3, y: 5, when: g => S(g) === 7, run: "s8" }],
  };
}

// ---------- 苔むす祠（W3b。強さ6の寄り道） ----------
function shrine() {
  const W = 13, H = 28, g = grid(W, H, "W");
  fill(g, "_", 5, 22, 3, 6); fill(g, "_", 3, 16, 7, 6); fill(g, "_", 6, 10, 1, 6); fill(g, "_", 2, 4, 9, 6); fill(g, "_", 5, 1, 3, 3);
  return {
    id: "shrine", nm: "苔むす祠", g, tier: 6, bg: "stone", dark: 1,
    objs: [{ t: "statue", x: 9, y: 4, talk: "statue" }],
    exits: [{ x: 6, y: 27, to: "forest", tx: 21, ty: 19, dir: 1 }],
    npcs: [],
    foes: [
      { id: "s1", x: 6, y: 20, k: "kokemusha", g: ["kokemusha", "sennen"], chase: 1 },
      { id: "s2", x: 4, y: 17, k: "koma", g: ["koma", "koma"], guard: 1 },
      { id: "s3", x: 6, y: 12, k: "kokemusha", g: ["kokemusha", "kokemusha", "sennen"], guard: 1 },
      { id: "s4", x: 4, y: 7, k: "sennen", g: ["sennen", "sennen", "koma"], chase: 1 },
      { id: "s5", x: 6, y: 4, k: "midorinushi", g: ["midorinushi"], boss: 1, once: "midori", guard: 1 },
    ],
    chests: [{ id: "c_shrine", x: 6, y: 1, item: "sennengai" }, { id: "c_shrine2", x: 2, y: 9, item: "mosssword" }],
    trigs: [],
  };
}

// ---------- 西街道の入口（W4の手前。序章のあと） ----------
function road0() {
  const g = grid(13, 20, "T"); fill(g, "~", 0, 0, 3, 20); fill(g, ".", 3, 6, 9, 8); fill(g, "=", 4, 10, 9, 1); g[10][3] = "c";
  return {
    id: "road0", nm: "西街道の入口", g, tier: 1, bg: "meadow",
    objs: [{ t: "boat", x: 0, y: 9, w: 3, h: 1, talk: "boat" }, { t: "sign", x: 6, y: 9, text: ["東　宿場町ハルネ"] }, { t: "kaeri", x: 9, y: 8, talk: "kaeri" }],
    exits: [],
    npcs: [],
    foes: [], chests: [], trigs: [{ x: 12, y: 10, run: "roadEnd" }],
  };
}

root.MAPS = { hut, ferry, village, river, sandbar, forest, hermit, shrine, road0 };
})(typeof window !== "undefined" ? window : globalThis);
