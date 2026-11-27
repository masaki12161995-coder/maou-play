// 地図（序章：トルカ村・リム川の渡し・中州・ささやきの森・森の婆の庵・苔むす祠・西街道の入口）
// 地面の文字：.草 =土の道 c石畳 T木 ~水 b桟橋 f柵 p板の床 w壁 D出口 m沼 h畑 y月夜草 R岩 W石の壁 _石の床 （空白）＝何もない
// 人：img＝人物の絵／mon＝魔物の絵。when＝居る条件（g＝遊んでいる記録。g.flags.s＝物語の進み、g.flags.cut＝いま流れている場面）
// 置き物：talk＝調べたときの出来事、text＝調べたときの文。trigs＝そのマスに入ると起きる出来事
(function (root) {
"use strict";
function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function fill(g, ch, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch; }
const S = g => g.flags.s || 0, cut = (g, k) => g.flags.cut === k;
// 町の会話の段階（骨組み0-4）。0＝序章の朝、0.5＝黒外套が来た後、1＝第1章、2＝第2章（第1章の場面10の後から）
const townStage = g => { const s = S(g); return s < 12 ? 0 : s < 14 ? 0.5 : s < 26 ? 1 : 2; };
root.townStage = townStage;

// ---------- 渡し小屋の中 ----------
function hut() {
  const g = grid(7, 7, "w"); fill(g, "p", 1, 1, 5, 5); g[6][3] = "D";
  return {
    id: "hut", nm: "渡し小屋", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [
      { t: "bed", x: 1, y: 1, w: 1, h: 2, talk: "hutBed" },
      { t: "oarRack", x: 4, y: 0, text: ["先に鉄をはめた長い棹。舟を押すにも、身を守るにも使う。"] },
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
    id: "village", nm: "トルカ村", g, tier: 0, bg: null, music: "town",
    objs: [
      { t: "house", x: 3, y: 5, w: 4, h: 3, roof: "red", door: 2, chimney: 1 },
      { t: "house", x: 10, y: 5, w: 4, h: 3, roof: "blue", door: 1 },
      { t: "house", x: 3, y: 12, w: 3, h: 2, roof: "green", door: 1 },
      { t: "house", x: 11, y: 12, w: 3, h: 2, roof: "brown", door: 1, chimney: 1 },
      { t: "well", x: 8, y: 11 },
      { t: "kaeri", x: 13, y: 9, talk: "kaeri" },
      { t: "sign", x: 13, y: 10, text: ["トルカ村"] },
      { t: "sign", x: 14, y: 8, text: ["トルカ村の礼拝堂"] },
      { t: "stall", x: 2, y: 15, w: 2, h: 1 },
      { t: "sign", x: 2, y: 14, text: ["よろず屋"] },
    ],
    exits: [{ x: 15, y: 11, to: "ferry", tx: 1, ty: 17, dir: 2 }],
    npcs: [
      { id: "dona", x: 5, y: 9, img: "person_077", dir: 0, nm: "ドナ", talk: "town", when: g => S(g) !== 12 },
      { id: "donaD", x: 5, y: 9, img: "person_077", dir: 0, nm: "ドナ", talk: "town", when: g => S(g) === 12 && !g.flags.cut },
      // 村の人（台詞は TOWNTALK。物語の段階で切り替わる）
      { id: "timV", x: 7, y: 8, img: "person_069", dir: 0, nm: "ティム", talk: "town", when: g => !g.flags.cut },
      { id: "hopV", x: 6, y: 17, img: "person_071", dir: 1, nm: "ホップ", talk: "town", when: g => S(g) >= 2 && !g.flags.cut },
      { id: "marthaV", x: 5, y: 14, img: "person_026", dir: 0, nm: "マーサ", talk: "town", when: g => S(g) >= 2 && !g.flags.cut },
      { id: "orb", x: 10, y: 8, img: "person_078", dir: 0, nm: "オーブ司祭", talk: "town" },
      { id: "fuki", x: 4, y: 15, img: "person_070f", dir: 0, nm: "フキ", talk: "fuki" },
      { id: "gyosho", x: 11, y: 10, img: "person_075", dir: 1, nm: "行商人", talk: "town", when: g => townStage(g) >= 2 },
      // 集める仲間（序章のあいだは、会えるだけ）
      { id: "seri", x: 12, y: 14, img: "person_017", dir: 0, nm: "セリ", talk: "seri", when: g => !(g.roster || []).includes(7) },
      { id: "karin", x: 12, y: 8, img: "person_105", dir: 0, nm: "カリン", talk: "karin", when: g => !(g.roster || []).includes(11) },
      { id: "sig", x: 8, y: 9, img: "person_010", dir: 0, nm: "傷の男", talk: "sigVillage", when: g => S(g) === 12 },
      { id: "k1", x: 6, y: 10, mon: "monster_019", face: -1, nm: "黒外套の兵", talk: "town", n: 0, when: g => S(g) === 12 },
      { id: "k2", x: 10, y: 10, mon: "monster_020", face: 1, nm: "黒外套の兵", talk: "town", n: 1, when: g => S(g) === 12 },
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
      { id: "toraji", x: 6, y: 32, img: "person_009", dir: 1, nm: "トラジ", talk: "toraji", when: g => !(g.roster || []).includes(6) },
      { id: "komari", x: 10, y: 26, img: "person_046", dir: 1, nm: "コマリ", talk: "komari", when: g => !(g.roster || []).includes(9) && !((g.flags.mt || {}).komari || {}).go },
      // かくれんぼ（見つけるたびに次の所へ）
      ...[[7, 20], [21, 12], [22, 25]].map(([x, y], k) => ({ id: "komariH" + k, x, y, img: "person_046", dir: 0, nm: "コマリ", talk: "komariHide", when: g => { const m = (g.flags.mt || {}).komari; return !!m && m.go && m.k === k && !(g.roster || []).includes(9); } })),
    ],
    foes: [
      { id: "w1", x: 8, y: 24, k: "donguri", g: ["donguri", "koromochi"], when: g => S(g) >= 6 },
      { id: "w3", x: 18, y: 13, k: "donguri", g: ["donguri", "donguri", "mizugumo"], when: g => S(g) >= 9 },
      { id: "w5", x: 19, y: 20, k: "moriookami", g: ["moriookami", "moriookami"], when: g => S(g) >= 9 },
      { id: "w2", x: 14, y: 23, k: "koromochi", g: ["koromochi", "koromochi", "donguri"], when: g => S(g) >= 10 },
      { id: "w4", x: 16, y: 24, k: "mizugumo", g: ["mizugumo", "moriookami", "koromochi"], when: g => S(g) >= 10 },
    ],
    chests: [{ id: "c_forest1", x: 6, y: 12, item: "ironspear" }, { id: "c_forest2", x: 22, y: 24, item: "needle" }, { id: "c_forest3", x: 15, y: 11, tool: "book1" }],
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
    exits: [{ x: 12, y: 10, to: "road1", tx: 1, ty: 13, dir: 2 }],
    npcs: [],
    foes: [], chests: [], trigs: [],
  };
}

// ---------- 西街道（W4。強さ2）：西から東へ。畑と林の間を行く土の道 ----------
function road1() {
  const W = 46, H = 27, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 5); fill(g, "T", 0, H - 5, W, 5);
  fill(g, "=", 0, 13, W, 1);
  for (const [x, y, w, h] of [[4, 7, 5, 4], [12, 16, 6, 4], [22, 15, 5, 5], [30, 7, 6, 4], [37, 16, 6, 4]]) fill(g, "h", x, y, w, h); // 畑
  for (const [x, y] of [[2, 9], [10, 6], [19, 18], [27, 6], [28, 19], [35, 20], [41, 8], [9, 19], [44, 18], [20, 6]]) g[y][x] = "T";
  fill(g, "f", 4, 11, 5, 1); fill(g, "f", 30, 11, 6, 1); fill(g, "f", 12, 15, 6, 1); fill(g, "f", 37, 15, 6, 1);
  return {
    id: "road1", nm: "西街道", g, tier: 2, bg: "meadow",
    objs: [
      { t: "cedar", x: 15, y: 8, w: 1, h: 3 },
      { t: "kaeri", x: 24, y: 11, talk: "roadStone" }, { t: "offering", x: 25, y: 11 },
      { t: "sign", x: 3, y: 12, text: ["西街道　西　リム川の渡し"] }, { t: "sign", x: 42, y: 12, text: ["西街道　東　宿場町ハルネ"] },
    ],
    exits: [{ x: 0, y: 13, to: "road0", tx: 11, ty: 10, dir: 1 }, { x: 45, y: 13, to: "harune", tx: 1, ty: 14, dir: 2 }],
    npcs: [
      { id: "linka", x: 16, y: 11, img: "person_004", dir: 0, nm: "リンカ", talk: "linka", when: g => !(g.roster || []).includes(5) },
      { id: "bookMan", x: 36, y: 12, img: "person_074", dir: 1, nm: "旅人", talk: "bookMan", when: g => !!((g.flags.mt || {}).poruka || {}).asked && !(g.roster || []).includes(8) },
      { id: "oba", x: 24, y: 12, img: "person_101", dir: 3, nm: "旅の老婆", when: g => S(g) <= 15 },
    ],
    foes: [
      { id: "r1", x: 7, y: 15, k: "koromochi", g: ["koromochi", "koromochi", "hanenezumi"] },
      { id: "r2", x: 11, y: 9, k: "hanenezumi", g: ["hanenezumi", "hanenezumi"] },
      { id: "r3", x: 19, y: 16, k: "kakashi", g: ["kakashi", "koromochi"] },
      { id: "r4", x: 31, y: 16, k: "moriookami", g: ["moriookami", "moriookami", "hanenezumi"] },
      { id: "r5", x: 33, y: 9, k: "kakashi", g: ["kakashi", "kakashi"] },
      { id: "r6", x: 39, y: 10, k: "hanenezumi", g: ["kakashi", "hanenezumi", "hanenezumi"] },
    ],
    chests: [{ id: "c_road1", x: 9, y: 6, item: "ironfist" }, { id: "c_road2", x: 43, y: 20, gold: 80 }],
    trigs: [
      { x: 1, y: 13, when: g => S(g) === 14, run: "c1s1" },
      { x: 22, y: 5, w: 1, h: 17, when: g => S(g) === 15, run: "c1s1b" },
    ],
  };
}

// ---------- 宿場町ハルネ（W5）：西の門から入る。宿・問屋場・貸本屋、東は大橋への道 ----------
function harune() {
  const W = 20, H = 30, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 3); fill(g, "T", 0, H - 3, W, 3); fill(g, "T", 0, 0, 1, H); fill(g, "T", W - 1, 0, 1, H);
  fill(g, "c", 0, 13, W, 3);                    // 大通り（西の門〜東の大橋への道）
  fill(g, "c", 9, 5, 2, 20);                    // 南北の通り
  fill(g, "=", 4, 9, 5, 1); fill(g, "=", 11, 9, 5, 1); fill(g, "=", 4, 19, 5, 1); fill(g, "=", 11, 19, 5, 1);
  g[14][0] = "c"; g[14][W - 1] = "c";
  return {
    id: "harune", nm: "宿場町ハルネ", g, tier: 0, bg: null, music: "town",
    objs: [
      { t: "gatePost", x: 1, y: 11, w: 1, h: 2 }, { t: "gatePost", x: 1, y: 16, w: 1, h: 2 },
      { t: "wagon", x: 3, y: 14, w: 2, h: 1, army: 1 }, { t: "wagon", x: 6, y: 14, w: 2, h: 1, army: 1 }, { t: "wagon", x: 4, y: 16, w: 2, h: 1 }, { t: "wagon", x: 12, y: 12, w: 2, h: 1 }, { t: "wagon", x: 15, y: 16, w: 2, h: 1, army: 1 },
      { t: "house", x: 3, y: 5, w: 5, h: 3, roof: "brown", door: 2, chimney: 1 },   // かわうそ亭
      { t: "sign", x: 8, y: 8, text: ["宿　かわうそ亭"] },
      { t: "house", x: 12, y: 5, w: 5, h: 3, roof: "blue", door: 2 },               // 問屋場
      { t: "sign", x: 11, y: 8, text: ["ハルネ問屋場"] },
      { t: "house", x: 4, y: 20, w: 4, h: 3, roof: "green", door: 1 },              // 貸本屋
      { t: "sign", x: 8, y: 23, text: ["貸本"] },
      { t: "house", x: 12, y: 20, w: 4, h: 3, roof: "red", door: 1, chimney: 1 },
      { t: "well", x: 9, y: 11 },
      { t: "kaeri", x: 17, y: 11, talk: "kaeri" },
      { t: "sign", x: 17, y: 12, text: ["東　ガルム大橋"] },
    ],
    exits: [{ x: 0, y: 14, to: "road1", tx: 44, ty: 13, dir: 1 }],
    npcs: [
      { id: "gate", x: 2, y: 13, img: "person_014", dir: 1, nm: "門番", talk: "gateman" },
      { id: "akindo", x: 5, y: 13, img: "person_075", dir: 2, nm: "商人", talk: "akindo" },
      { id: "hei", x: 8, y: 13, mon: "monster_010", face: 1, nm: "兵士", talk: "heishi" },
      { id: "poruka", x: 6, y: 23, img: "person_029", dir: 0, nm: "ポルカ", talk: "poruka", when: g => !(g.roster || []).includes(8) },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 1, y: 13, w: 1, h: 3, when: g => S(g) === 16, run: "c1s2" },
      { x: 5, y: 8, w: 1, h: 1, run: "innDoor" },                       // かわうそ亭の戸口
      { x: 14, y: 8, w: 1, h: 1, run: "toiyaDoor" },                    // 問屋場の戸口
      { x: 18, y: 13, w: 1, h: 3, run: "eastRoad" },                    // 大橋への道
    ],
  };
}

// ---------- 宿「かわうそ亭」（土間の大部屋） ----------
function kawauso() {
  const g = grid(11, 10, "w"); fill(g, "p", 1, 1, 9, 8); g[9][5] = "D";
  return {
    id: "kawauso", nm: "かわうそ亭", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [
      { t: "counter", x: 4, y: 2 }, { t: "counter", x: 5, y: 2 }, { t: "counter", x: 6, y: 2 },
      { t: "hearth", x: 2, y: 0 }, { t: "shelf", x: 8, y: 1 },
      { t: "futon", x: 8, y: 3, w: 1, h: 2, talk: "innBed" }, { t: "futon", x: 9, y: 3, w: 1, h: 2, talk: "innBed" }, { t: "futon", x: 9, y: 6, w: 1, h: 2, talk: "innBed" },
      { t: "basket", x: 1, y: 6 }, { t: "table", x: 3, y: 5 },
    ],
    exits: [{ x: 5, y: 9, to: "harune", tx: 5, ty: 9, dir: 0 }],
    npcs: [
      { id: "bela", x: 5, y: 1, img: "person_070", dir: 0, nm: "ベラ", talk: "bela" },
      { id: "toto", x: 2, y: 7, img: "person_100", dir: 2, nm: "トト", talk: "toto", when: g => g.flags.cut !== "c1s12" },
      { id: "teo", x: 8, y: 7, img: "person_001", dir: 1, nm: "テオ", talk: "teo", when: g => !(g.roster || []).includes(4) },
      { id: "liseN", x: 7, y: 5, img: "person_002", dir: 1, nm: "リゼット", when: g => cut(g, "c1s6") || cut(g, "c1s11") },
      { id: "bramN", x: 7, y: 6, img: "person_005", dir: 1, nm: "ブラム", when: g => cut(g, "c1s11") },
      { id: "nomi1", x: 3, y: 4, img: "person_075", dir: 2, nm: "商人", talk: "nomi1", when: g => S(g) === 27 && !g.flags.cut },
      { id: "nomi2", x: 4, y: 4, mon: "monster_010", face: -1, nm: "兵士", talk: "nomi2", when: g => S(g) === 27 && !g.flags.cut },
      { id: "sigK", x: 5, y: 7, img: "person_010", dir: 3, nm: "傷の男", when: g => cut(g, "c1s12") },
      { id: "kk1", x: 4, y: 8, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => cut(g, "c1s12") },
      { id: "kk2", x: 6, y: 8, mon: "monster_020", face: -1, nm: "黒外套の兵", when: g => cut(g, "c1s12") },
      { id: "totoK", x: 5, y: 5, img: "person_100", dir: 0, nm: "トト", when: g => cut(g, "c1s12") },
      { id: "mukuN", x: 8, y: 6, img: "person_058h", dir: 0, nm: "ムク", when: g => cut(g, "c1s6") },
    ],
    foes: [], chests: [],
    trigs: [],
  };
}

// ---------- 問屋場（荷と馬を取りしきる役所） ----------
function toiya() {
  const g = grid(9, 8, "w"); fill(g, "p", 1, 1, 7, 6); g[7][4] = "D";
  return {
    id: "toiya", nm: "ハルネ問屋場", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [{ t: "counter", x: 3, y: 2 }, { t: "counter", x: 4, y: 2 }, { t: "counter", x: 5, y: 2 }, { t: "shelf", x: 1, y: 1 }, { t: "shelf", x: 7, y: 1 }, { t: "basket", x: 7, y: 5 }],
    exits: [{ x: 4, y: 7, to: "harune", tx: 14, ty: 9, dir: 0 }],
    npcs: [
      { id: "mori", x: 4, y: 1, img: "person_099", dir: 0, nm: "モーリス", talk: "mori" },
      { id: "dakka", x: 3, y: 3, mon: "monster_010", face: 1, nm: "ダッカ", talk: "dakka" },
      { id: "gido", x: 6, y: 3, img: "person_030", dir: 1, nm: "ギド", talk: "gido" },
      { id: "yaji", x: 2, y: 5, img: "person_075", dir: 3, nm: "商人", talk: "yaji" },
    ],
    foes: [], chests: [],
    trigs: [],
  };
}

// ---------- ガルム大橋の西のたもと（W5の東の端）：深い谷。橋の真ん中が無い。北の丘に古い塔 ----------
function ohashi() {
  const W = 18, H = 27, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 4); fill(g, "T", 0, H - 5, W, 5); fill(g, "T", 0, 4, 2, 7); fill(g, "T", 0, 16, 2, 6);
  fill(g, "c", 0, 12, 11, 3);                           // 町からの道
  fill(g, "V", 11, 4, 7, H - 9);                        // 谷
  const fixed = window.GS && GS.G && GS.G.flags.s >= 28;  // 第1章の終わり（夜明け）からは、橋がつながっている
  if (fixed) fill(g, "c", 11, 12, 7, 3);
  else { fill(g, "c", 11, 12, 3, 3); fill(g, "E", 14, 12, 1, 3); fill(g, "c", 17, 12, 1, 3); } // 橋（真ん中が抜けている）
  for (const [x, y] of [[12, 17], [14, 18], [15, 16], [13, 20], [16, 19], [15, 9], [13, 8]]) g[y][x] = "X"; // 谷底に散らばる石
  fill(g, "=", 5, 6, 1, 6);                             // 北の丘への小道
  for (const [x, y] of [[3, 9], [8, 8], [9, 17], [4, 18], [7, 20]]) g[y][x] = "T";
  return {
    id: "ohashi", nm: "ガルム大橋", g, tier: 0, bg: null,
    objs: [
      { t: "towerFar", x: 6, y: 3, w: 2, h: 3 },
      { t: "plaque", x: 10, y: 11, text: ["ガルム大橋。建国の年、これを架く。", "名の由来は伝わっていない。"] },
      { t: "bigStone", x: 9, y: 15, text: ["切り口がない。割れたのではないらしい。"], when: g => S(g) >= 20 },
      { t: "sign", x: 4, y: 11, text: ["北　古い見張り塔"] },
    ],
    exits: [{ x: 0, y: 13, to: "harune", tx: 17, ty: 14, dir: 1 }],
    npcs: [
      // 場面10：塔から下りてきた巨人と、町の人たち
      { id: "garmS", x: 9, y: 11, mon: "monster_063", face: -1, sc: 0.8, nm: "ガルム", when: g => cut(g, "c1s10") },
      { id: "moriS", x: 4, y: 12, img: "person_099", dir: 2, nm: "モーリス", when: g => cut(g, "c1s10") },
      { id: "dakkaS", x: 4, y: 14, mon: "monster_010", face: 1, nm: "ダッカ", when: g => cut(g, "c1s10") },
      { id: "gidoS", x: 3, y: 13, img: "person_030", dir: 2, nm: "ギド", when: g => cut(g, "c1s10") },
      { id: "akinS", x: 2, y: 12, img: "person_075", dir: 2, nm: "商人", when: g => cut(g, "c1s10") },
      { id: "totoS", x: 2, y: 14, img: "person_100", dir: 2, nm: "トト", when: g => cut(g, "c1s10") },
      // 夜明けからは、橋のたもとに橋番
      { id: "garmB", x: 10, y: 11, mon: "monster_063", face: 1, sc: 0.8, nm: "ガルム", talk: "garmBridge", when: g => S(g) >= 28 },
      { id: "sigB", x: 6, y: 13, img: "person_010", dir: 2, nm: "傷の男", when: g => cut(g, "c1s13b") },
      { id: "kb1", x: 5, y: 12, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => cut(g, "c1s13b") },
      { id: "kb2", x: 5, y: 14, mon: "monster_020", face: 1, nm: "黒外套の兵", when: g => cut(g, "c1s13b") },
      { id: "kb3", x: 4, y: 13, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => cut(g, "c1s13b") },
      // 橋が直った後、西のたもとに旅の機械いじり
      { id: "nat", x: 8, y: 15, img: "person_094", dir: 3, nm: "ナット", talk: "nat", when: g => !(g.roster || []).includes(10) && S(g) >= 28 && !g.flags.cut },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 8, y: 12, w: 1, h: 3, when: g => S(g) === 19, run: "c1s5" },
      { x: 5, y: 6, when: g => S(g) === 20, run: "towerLater" },
      { x: 5, y: 6, when: g => S(g) >= 21, run: "towerIn" },
      { x: 7, y: 12, w: 1, h: 3, when: g => S(g) === 25, run: "c1s10" },
      { x: 17, y: 12, w: 1, h: 3, when: g => S(g) >= 28, run: "tollEast" },
    ],
  };
}

// ---------- 古い見張り塔（W6。強さ2〜3）：1階の広間／中ほど／てっぺん ----------
function tower1() {
  const W = 13, H = 16, g = grid(W, H, "W");
  fill(g, "_", 2, 2, 9, 12); g[14][6] = "_"; g[15][6] = "_"; g[2][10] = "S";
  return {
    id: "tower1", nm: "古い見張り塔", g, tier: 2, bg: "stone", inside: 1,
    objs: [
      { t: "desk", x: 3, y: 2, talk: "nisshi" },
      { t: "bell", x: 7, y: 2, text: ["鳴らす者のいない警鐘。"] },
    ],
    exits: [{ x: 6, y: 15, to: "ohashi", tx: 5, ty: 7, dir: 0 }, { x: 10, y: 2, to: "tower2", tx: 2, ty: 17, dir: 3 }],
    npcs: [
      { id: "i1", x: 5, y: 8, mon: "m_ishikoro", face: 1, nm: "イシコロ小僧", when: g => S(g) <= 22 },
      { id: "i2", x: 6, y: 8, mon: "m_ishikoro", face: 1, nm: "イシコロ小僧", when: g => S(g) <= 22 },
      { id: "i3", x: 7, y: 8, mon: "m_ishikoro", face: -1, nm: "イシコロ小僧", when: g => S(g) <= 22 },
    ],
    foes: [{ id: "t1", x: 9, y: 6, k: "ishikoro", g: ["ishikoro", "ishikoro"], when: g => S(g) >= 23 }],
    chests: [{ id: "c_tower1", x: 2, y: 13, gold: 60 }],
    trigs: [{ x: 6, y: 13, when: g => S(g) === 21, run: "c1s7" }, { x: 2, y: 10, w: 9, h: 1, when: g => S(g) === 22, run: "c1s7b" }],
  };
}
function tower2() {
  const W = 13, H = 20, g = grid(W, H, "W");
  fill(g, "_", 2, 11, 9, 7); fill(g, "_", 6, 8, 1, 3); fill(g, "_", 3, 3, 7, 5); g[17][2] = "S"; g[3][9] = "S";
  return {
    id: "tower2", nm: "見張り塔の中ほど", g, tier: 2, bg: "stone", inside: 1,
    objs: [{ t: "campfire", x: 5, y: 5 }],
    exits: [{ x: 2, y: 17, to: "tower1", tx: 10, ty: 3, dir: 0 }, { x: 9, y: 3, to: "towerTop", tx: 6, ty: 11, dir: 3 }],
    npcs: [{ id: "bram", x: 4, y: 4, img: "person_005", dir: 0, nm: "ブラム", when: g => S(g) <= 23 }],
    foes: [
      { id: "t2", x: 6, y: 13, k: "tsutayoroi", g: ["tsutayoroi", "ishikoro"] },
      { id: "t3", x: 9, y: 15, k: "ishikoro", g: ["ishikoro", "ishikoro", "tsutayoroi"] },
    ],
    chests: [{ id: "c_tower2", x: 10, y: 11, item: "leather" }],
    trigs: [{ x: 6, y: 7, when: g => S(g) === 23, run: "c1s8" }],
  };
}
function towerTop() {
  const W = 13, H = 14, g = grid(W, H, "W");
  fill(g, "_", 2, 2, 9, 10); fill(g, "V", 9, 1, 3, 5); g[11][6] = "S";
  for (const [x, y] of [[3, 3], [4, 2], [8, 6], [3, 6]]) g[y][x] = "x";
  return {
    id: "towerTop", nm: "見張り塔のてっぺん", g, tier: 3, bg: "stone", inside: 1,
    objs: [],
    exits: [{ x: 6, y: 11, to: "tower2", tx: 9, ty: 4, dir: 0 }],
    npcs: [{ id: "garm", x: 6, y: 4, mon: "monster_063", face: 1, sc: 0.8, nm: "ガルム", talk: "garm" }],
    foes: [], chests: [],
    trigs: [{ x: 2, y: 8, w: 9, h: 1, when: g => S(g) === 24, run: "c1s9" }],
  };
}


// ==================== 第2章 ====================
// ---------- 中央平原（C1。強さ2〜3）：西に大橋、北に王都、南東に風車の里ミルナ、東は赤麦の丘 ----------
function plain() {
  const W = 40, H = 30, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 2); fill(g, "T", 0, H - 2, W, 2); fill(g, "T", 0, 0, 1, H);
  fill(g, "=", 0, 14, W, 1);                 // 東西の街道
  fill(g, "=", 20, 2, 1, 12);                // 北：王都へ
  fill(g, "=", 31, 15, 1, 13);               // 南：ミルナへ
  g[0][20] = "="; g[1][20] = "="; g[28][31] = "="; g[29][31] = "=";
  for (const [x, y, w, h] of [[3, 4, 7, 5], [24, 4, 8, 6], [5, 17, 9, 6], [17, 18, 8, 7], [34, 18, 5, 5]]) fill(g, "h", x, y, w, h); // 麦と牧草
  for (const [x, y] of [[12, 3], [13, 9], [2, 11], [15, 16], [27, 17], [36, 9], [38, 4], [11, 25], [26, 26], [2, 23]]) g[y][x] = "T";
  fill(g, "f", 3, 9, 7, 1); fill(g, "f", 24, 10, 8, 1); fill(g, "f", 5, 16, 9, 1);
  return {
    id: "plain", nm: "中央平原", g, tier: 3, bg: "meadow",
    objs: [
      { t: "windmill", x: 33, y: 23, w: 2, h: 3 }, { t: "windmill", x: 36, y: 24, w: 2, h: 3 },
      { t: "kaeri", x: 18, y: 12, talk: "kaeri" },
      { t: "sign", x: 21, y: 13, text: ["北　王都ルクスベル"] }, { t: "sign", x: 32, y: 15, text: ["南　風車の里ミルナ"] }, { t: "sign", x: 37, y: 13, text: ["東　赤麦の丘・東の関所"] },
    ],
    exits: [{ x: 20, y: 0, to: "lux", tx: 11, ty: 38, dir: 3 }, { x: 31, y: 29, to: "milna", tx: 8, ty: 1, dir: 0 }],
    npcs: [
      { id: "gyoshoP", x: 12, y: 13, img: "person_075", dir: 1, nm: "行商人", when: g => cut(g, "c2s1") },
    ],
    foes: [
      { id: "p1", x: 8, y: 12, k: "mugiwara", g: ["mugiwara", "mugiwara"] },
      { id: "p2", x: 15, y: 11, k: "kamausagi", g: ["kamausagi", "kamausagi", "fusha"] },
      { id: "p3", x: 23, y: 12, k: "fusha", g: ["fusha", "fusha", "mugiwara"] },
      { id: "p4", x: 27, y: 16, k: "doro", g: ["doro", "kamausagi"] },
      { id: "p5", x: 33, y: 11, k: "doro", g: ["doro", "mugiwara", "fusha"] },
      { id: "p6", x: 18, y: 6, k: "kamausagi", g: ["kamausagi", "mugiwara", "kamausagi"] },
    ],
    chests: [{ id: "c_plain1", x: 3, y: 3, gold: 120 }, { id: "c_plain2", x: 38, y: 27, item: "longbow" }],
    trigs: [
      { x: 1, y: 14, when: g => S(g) === 28, run: "c2s1" },
      { x: 20, y: 5, w: 1, h: 1, when: g => S(g) === 29, run: "c2s1b" },
      { x: 20, y: 3, w: 1, h: 1, when: g => S(g) <= 30, run: "luxShut" },
      { x: 0, y: 14, run: "tollWest" },
      { x: 39, y: 14, run: "eastShut" },
    ],
  };
}
// ---------- 風車の里ミルナ（C4） ----------
function milna() {
  const W = 18, H = 22, g = grid(W, H, ".");
  fill(g, "T", 0, H - 2, W, 2); fill(g, "T", 0, 0, 1, H); fill(g, "T", W - 1, 0, 1, H); fill(g, "T", 0, 0, 7, 2); fill(g, "T", 10, 0, 8, 2);
  fill(g, "=", 8, 0, 1, 12); fill(g, "c", 5, 11, 8, 4);
  for (const [x, y, w, h] of [[2, 16, 5, 3], [11, 16, 5, 3]]) fill(g, "h", x, y, w, h);
  return {
    id: "milna", nm: "風車の里ミルナ", g, tier: 0, bg: null, music: "town",
    objs: [
      { t: "windmill", x: 2, y: 3, w: 2, h: 3 }, { t: "windmill", x: 13, y: 3, w: 2, h: 3 }, { t: "windmill", x: 13, y: 8, w: 2, h: 3 },
      { t: "house", x: 3, y: 8, w: 4, h: 3, roof: "brown", door: 2, chimney: 1 },
      { t: "sign", x: 9, y: 10, text: ["東の関所、当分のあいだ通行を禁ず。宰相ヴァルド"] },
      { t: "wagon", x: 9, y: 12, w: 2, h: 1, when: g => S(g) <= 30 },
      { t: "kaeri", x: 4, y: 14, talk: "kaeri" },
    ],
    exits: [{ x: 8, y: 0, to: "plain", tx: 31, ty: 28, dir: 3 }],
    npcs: [
      { id: "morto", x: 11, y: 12, img: "person_019k", dir: 1, nm: "モルト", talk: "morto" },
    ],
    foes: [], chests: [],
    trigs: [{ x: 8, y: 2, when: g => S(g) === 30 && !g.flags.milna, run: "c2s2" }],
  };
}
// ---------- 王都ルクスベル（C2）：南に正門、北に城と古い礼拝堂、西に酒場と裏通り ----------
function lux() {
  const W = 22, H = 40, g = grid(W, H, ".");
  fill(g, "Q", 0, 27, W, 2); fill(g, "c", 10, 27, 2, 2);   // 町の壁と正門
  fill(g, "T", 0, 29, W, 11); fill(g, ".", 7, 29, 8, 9); fill(g, "=", 10, 29, 2, 11);  // 門の外（丘へ下る道）
  fill(g, "c", 10, 6, 2, 21); fill(g, "c", 1, 15, 20, 2);   // 大通りと横の通り
  fill(g, "c", 2, 6, 1, 9);                                // 裏通り
  fill(g, "c", 3, 6, 7, 1);
  fill(g, "Q", 0, 0, W, 2); fill(g, "Q", 0, 0, 1, 27); fill(g, "Q", W - 1, 0, 1, 27);
  return {
    id: "lux", nm: "王都ルクスベル", g, tier: 0, bg: null, music: "town",
    objs: [
      { t: "castle", x: 7, y: 1, w: 8, h: 4 },
      { t: "gatePost", x: 9, y: 26, w: 1, h: 2 }, { t: "gatePost", x: 12, y: 26, w: 1, h: 2 },
      { t: "house", x: 3, y: 10, w: 5, h: 3, roof: "red", door: 2, chimney: 1 },     // 酒場
      { t: "sign", x: 8, y: 13, text: ["酒場　白い鳩亭"] },
      { t: "house", x: 3, y: 2, w: 4, h: 3, roof: "blue", door: 1 },                 // 古い礼拝堂
      { t: "sign", x: 7, y: 5, text: ["古い礼拝堂"] },
      { t: "house", x: 14, y: 9, w: 5, h: 3, roof: "brown", door: 2 },
      { t: "house", x: 14, y: 19, w: 5, h: 3, roof: "green", door: 2, chimney: 1 },
      { t: "house", x: 3, y: 19, w: 5, h: 3, roof: "blue", door: 2 },
      { t: "well", x: 13, y: 15 },
      { t: "sign", x: 9, y: 17, text: ["魔王討伐の軍資金にご協力を"] },
      { t: "sign", x: 12, y: 24, text: ["魔王討伐の軍資金にご協力を"] },
      { t: "kaeri", x: 18, y: 16, talk: "kaeri" },
      { t: "wagon", x: 10, y: 31, w: 2, h: 1, when: g => cut(g, "c2s3") },
    ],
    exits: [{ x: 10, y: 39, to: "plain", tx: 20, ty: 1, dir: 0 }, { x: 11, y: 39, to: "plain", tx: 20, ty: 1, dir: 0 }],
    npcs: [
      { id: "dario", x: 13, y: 27, mon: "monster_010", face: -1, nm: "ダリオ", talk: "dario", when: g => S(g) >= 31 },
      { id: "kgate1", x: 9, y: 28, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => S(g) >= 31 && S(g) <= 40 },
      { id: "kgate2", x: 12, y: 28, mon: "monster_020", face: -1, nm: "黒外套の兵", when: g => S(g) >= 31 && S(g) <= 40 },
      { id: "mortoG", x: 12, y: 31, img: "person_019k", dir: 3, nm: "モルト", when: g => cut(g, "c2s3") },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 5, y: 13, run: "sakabaDoor" },
      { x: 4, y: 5, when: g => S(g) === 33, run: "c2stop" },
    ],
  };
}
// ---------- 王都の酒場「白い鳩亭」 ----------
function sakaba() {
  const g = grid(11, 9, "w"); fill(g, "p", 1, 1, 9, 7); g[8][5] = "D";
  return {
    id: "sakaba", nm: "白い鳩亭", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [
      { t: "counter", x: 3, y: 2 }, { t: "counter", x: 4, y: 2 }, { t: "counter", x: 5, y: 2 }, { t: "counter", x: 6, y: 2 },
      { t: "hearth", x: 8, y: 0 }, { t: "shelf", x: 2, y: 1 },
      { t: "table", x: 3, y: 5 }, { t: "table", x: 7, y: 5 },
    ],
    exits: [{ x: 5, y: 8, to: "lux", tx: 5, ty: 14, dir: 0 }],
    exitRun: g => S(g) === 32 ? "c2s5" : null,
    npcs: [
      { id: "niko", x: 5, y: 1, img: "person_070n", dir: 0, nm: "ニコ", talk: "niko" },
      { id: "kyaku1", x: 2, y: 5, img: "person_074", dir: 2, nm: "酒場の客", talk: "kyaku" },
      { id: "kyaku2", x: 4, y: 6, img: "person_071", dir: 3, nm: "酒場の客", talk: "kyaku" },
      { id: "totoL", x: 8, y: 6, img: "person_100", dir: 1, nm: "トト", talk: "totoL" },
    ],
    foes: [], chests: [],
    trigs: [{ x: 5, y: 7, when: g => S(g) === 31, run: "c2s4" }],
  };
}
root.MAPS = { plain, milna, lux, sakaba, hut, ferry, village, river, sandbar, forest, hermit, shrine, road0, road1, harune, kawauso, toiya, ohashi, tower1, tower2, towerTop };
})(typeof window !== "undefined" ? window : globalThis);
