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
const townStage = g => { const s = S(g); return s < 12 ? 0 : s < 14 ? 0.5 : s < 26 ? 1 : s < 60 ? 2 : s < 62 ? 3 : 4; }; // 段階4：第4章の始まり（ザハラを出た後）から // 段階3：第3章の不戦の約定（聖剣の競り）の後から
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
      { id: "oya", x: 11, y: 29, mon: "monster_134", face: 1, big: 1, nm: "オヤミズグモ", when: g => S(g) === 2 },
      // 場面10：黒外套の一団と、村の人たち
      { id: "sig", x: 8, y: 17, img: "person_146", dir: 1, nm: "傷の男", when: g => cut(g, "s10") },
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
      { id: "sig11", x: 3, y: 17, img: "person_146", dir: 2, nm: "傷の男", when: g => cut(g, "s12c") },
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
      { id: "timV", x: 7, y: 8, img: "person_069", dir: 0, nm: "ティム", talk: "town", card: g => S(g) >= 29, when: g => !g.flags.cut },
      { id: "hopV", x: 6, y: 17, img: "person_071", dir: 1, nm: "ホップ", talk: "town", when: g => S(g) >= 2 && !g.flags.cut },
      { id: "marthaV", x: 5, y: 14, img: "person_026", dir: 0, nm: "マーサ", talk: "town", when: g => S(g) >= 2 && !g.flags.cut },
      { id: "orb", x: 10, y: 8, img: "person_078", dir: 0, nm: "オーブ司祭", talk: "town" },
      { id: "fuki", x: 4, y: 15, img: "person_070f", dir: 0, nm: "フキ", talk: "fuki" },
      { id: "gyosho", x: 11, y: 10, img: "person_075", dir: 1, nm: "行商人", talk: "town", when: g => townStage(g) >= 2 },
      // 集める仲間（序章のあいだは、会えるだけ）
      { id: "seri", x: 12, y: 14, img: "person_017", dir: 0, nm: "セリ", talk: "seri", when: g => !(g.roster || []).includes(7) },
      { id: "karin", x: 12, y: 8, img: "person_105", dir: 0, nm: "カリン", talk: "karin", when: g => !(g.roster || []).includes(11) },
      { id: "sig", x: 8, y: 9, img: "person_146", dir: 0, nm: "傷の男", talk: "sigVillage", when: g => S(g) === 12 },
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
      { id: "otter", x: 6, y: 6, mon: "monster_131", face: 1, nm: "カワウソ盗", when: g => cut(g, "s2b") },
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
      { id: "d1", x: 8, y: 21, mon: "monster_130", face: 1, nm: "ドングリ兵", when: g => S(g) <= 5 },
      { id: "d2", x: 7, y: 21, mon: "monster_130", face: 1, nm: "ドングリ兵", when: g => S(g) <= 5 },
      { id: "d3", x: 9, y: 21, mon: "monster_130", face: -1, nm: "ドングリ兵", when: g => S(g) <= 5 },
      // 場面7：切り株の広場
      { id: "koke", x: 9, y: 13, mon: "monster_094", face: 1, nm: "コケ爺", talk: "koke" },
      { id: "owl", x: 10, y: 14, img: "person_054", dir: 0, nm: "夜番", talk: "owl" },
      { id: "da", x: 13, y: 12, mon: "monster_130", face: -1, nm: "ドングリ兵", talk: "dongu" },
      { id: "db", x: 7, y: 16, mon: "monster_130", face: 1, nm: "ドングリ兵", talk: "dongu" },
      // 森の婆の庵の前：見張りのフクロウと、切り株のドングリ兵（序章の三体のうちの一体。町の人の会話）
      { id: "fukuro", x: 17, y: 12, mon: "monster_112", face: 1, nm: "見張りのフクロウ", talk: "tt", tp: "hermit", when: g => S(g) >= 7 && !g.flags.cut },
      { id: "dongI", x: 21, y: 13, mon: "monster_130", face: -1, nm: "ドングリ兵", talk: "tt", tp: "hermit", when: g => S(g) >= 7 && !g.flags.cut },
      { id: "north", x: 14, y: 17, img: "person_040", dir: 1, nm: "北の子", talk: "north" },
      { id: "mukuC", x: 13, y: 17, img: "person_058", dir: 2, nm: "ムク", talk: "mukuC", when: g => S(g) <= 7 },
      // 場面9：沼への道をふさぐ狼の群れ
      { id: "wa", x: 20, y: 17, mon: "m_ookami", face: 1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "wb", x: 19, y: 17, mon: "m_ookami", face: 1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "wc", x: 21, y: 17, mon: "m_ookami", face: -1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "wd", x: 20, y: 18, mon: "m_ookami", face: -1, nm: "モリオオカミ", when: g => S(g) <= 8 },
      { id: "nushi", x: 17, y: 26, mon: "monster_135", face: 1, big: 1, nm: "ヌシガエル", when: g => S(g) <= 9 },
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
      // 町の人の会話（森の婆の庵）：土間のコロモチ。戦わない継ぐ民
      { id: "koroI", x: 1, y: 5, mon: "m_koromochi", face: 1, nm: "庵のコロモチ", talk: "tt", tp: "hermit", when: g => !g.flags.cut },
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
      { t: "wagon", x: 3, y: 14, w: 2, h: 1, army: 1 }, { t: "wagon", x: 6, y: 14, w: 2, h: 1, army: 1 }, { t: "wagon", x: 4, y: 16, w: 2, h: 1, when: g => S(g) < 28 }, { t: "wagon", x: 12, y: 12, w: 2, h: 1, when: g => S(g) < 28 }, { t: "wagon", x: 15, y: 16, w: 2, h: 1, army: 1 },
      { t: "house", x: 3, y: 5, w: 5, h: 3, roof: "brown", door: 2, chimney: 1 },   // かわうそ亭
      { t: "sign", x: 8, y: 8, text: ["宿　かわうそ亭"] },
      { t: "house", x: 12, y: 5, w: 5, h: 3, roof: "blue", door: 2 },               // 問屋場
      { t: "sign", x: 11, y: 8, text: ["ハルネ問屋場"] },
      { t: "house", x: 4, y: 20, w: 4, h: 3, roof: "green", door: 1, kind: "books", nm: "貸本屋" },              // 貸本屋
      { t: "sign", x: 8, y: 23, text: ["貸本"] },
      { t: "house", x: 12, y: 20, w: 4, h: 3, roof: "red", door: 1, chimney: 1 },
      { t: "well", x: 9, y: 11 },
      { t: "kaeri", x: 17, y: 11, talk: "kaeri" },
      { t: "sign", x: 17, y: 12, text: ["東　ガルム大橋"] },
    ],
    exits: [{ x: 0, y: 14, to: "road1", tx: 44, ty: 13, dir: 1 }],
    npcs: [
      { id: "gate", x: 2, y: 13, img: "person_014", dir: 1, nm: "門番", talk: "gateman" },
      { id: "akindo", x: 5, y: 13, img: "person_075", dir: 2, nm: "商人", talk: "akindo", when: g => S(g) < 28 },   // 足止めの客（橋が直ると発つ）
      { id: "hei", x: 8, y: 13, mon: "monster_010", face: 1, nm: "兵士", talk: "heishi", when: g => S(g) < 28 },
      // 町の人（段階1から）。ダッカとギドは場面4の後は問屋場の前に
      { id: "dakkaO", x: 12, y: 10, mon: "monster_010", face: 1, nm: "ダッカ", talk: "dakka", when: g => S(g) >= 19 && S(g) < 60 && !g.flags.cut }, // 段階3からは居ない（段階8でまた来る）
      { id: "gidoO", x: 16, y: 10, img: "person_030", dir: 1, nm: "ギド", talk: "gido", when: g => S(g) >= 19 && !g.flags.cut },
      { id: "shiroH", x: 16, y: 3, img: "person_131", dir: 1, nm: "白い犬", talk: "shiro", town: "harune", when: g => S(g) >= 17 && !g.flags.cut && !((g.flags.shiro || {}).harune) },
      { id: "shukuko", x: 14, y: 3, img: "person_022", dir: 0, nm: "宿場の子", talk: "tt", tp: "harune", when: g => S(g) >= 17 && !g.flags.cut },
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
      { id: "bela", x: 5, y: 1, img: "person_070", dir: 0, nm: "ベラ", talk: "bela", card: g => S(g) >= 18 && !!g.flags.cardsOk },
      { id: "toto", x: 2, y: 7, img: "person_100", dir: 2, nm: "トト", talk: "toto", card: g => S(g) >= 18, when: g => g.flags.cut !== "c1s12" },
      { id: "teo", x: 8, y: 7, img: "person_001", dir: 1, nm: "テオ", talk: "teo", when: g => !(g.roster || []).includes(4) },
      { id: "umeba", x: 2, y: 8, img: "person_101", dir: 2, nm: "ウメ婆", talk: "tt", tp: "harune", when: g => S(g) >= 18 && !g.flags.cut },
      { id: "liseN", x: 7, y: 5, img: "person_002", dir: 1, nm: "リゼット", when: g => cut(g, "c1s6") || cut(g, "c1s11") },
      { id: "bramN", x: 7, y: 6, img: "person_005", dir: 1, nm: "ブラム", when: g => cut(g, "c1s11") },
      { id: "nomi1", x: 3, y: 4, img: "person_075", dir: 2, nm: "商人", talk: "nomi1", when: g => S(g) === 27 && !g.flags.cut },
      { id: "nomi2", x: 4, y: 4, mon: "monster_010", face: -1, nm: "兵士", talk: "nomi2", when: g => S(g) === 27 && !g.flags.cut },
      { id: "sigK", x: 5, y: 7, img: "person_146", dir: 3, nm: "傷の男", when: g => cut(g, "c1s12") },
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
      { id: "dakka", x: 3, y: 3, mon: "monster_010", face: 1, nm: "ダッカ", talk: "dakka", when: g => S(g) < 19 },
      { id: "gido", x: 6, y: 3, img: "person_030", dir: 1, nm: "ギド", talk: "gido", when: g => S(g) < 19 },
      { id: "yaji", x: 2, y: 5, img: "person_075", dir: 3, nm: "商人", talk: "yaji", when: g => S(g) < 28 },
    ],
    foes: [], chests: [],
    trigs: [],
  };
}

// ---------- ガルム大橋の西のたもと（W5の東の端）：深い谷。橋の真ん中が無い。北の丘に古い塔 ----------
function ohashi() {
  const W = 22, H = 27, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 4); fill(g, "T", 0, H - 5, W, 5); fill(g, "T", 0, 4, 2, 7); fill(g, "T", 0, 16, 2, 6);
  fill(g, "c", 0, 12, 11, 3);                           // 町からの道
  fill(g, "V", 11, 4, 7, H - 9);                        // 谷
  fill(g, "T", 18, 16, 4, 6); g[5][21] = "T";           // 東のたもと（茶屋のある側）
  const fixed = window.GS && GS.G && GS.G.flags.s >= 28;  // 第1章の終わり（夜明け）からは、橋がつながっている
  if (fixed) fill(g, "c", 11, 12, 11, 3);
  else { fill(g, "c", 11, 12, 3, 3); fill(g, "E", 14, 12, 1, 3); fill(g, "c", 17, 12, 5, 3); } // 橋（真ん中が抜けている）
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
      { t: "house", x: 18, y: 7, w: 3, h: 3, roof: "red", door: 1, kind: "tea", nm: "たもとの茶屋" },                 // 東のたもとの茶屋
    ],
    exits: [{ x: 0, y: 13, to: "harune", tx: 17, ty: 14, dir: 1 }],
    npcs: [
      // 場面10：塔から下りてきた巨人と、町の人たち
      { id: "garmS", x: 9, y: 11, img: "person_132", dir: 2, psc: 1.5, nm: "ガルム", when: g => cut(g, "c1s10") },
      { id: "moriS", x: 4, y: 12, img: "person_099", dir: 2, nm: "モーリス", when: g => cut(g, "c1s10") },
      { id: "dakkaS", x: 4, y: 14, mon: "monster_010", face: 1, nm: "ダッカ", when: g => cut(g, "c1s10") },
      { id: "gidoS", x: 3, y: 13, img: "person_030", dir: 2, nm: "ギド", when: g => cut(g, "c1s10") },
      { id: "akinS", x: 2, y: 12, img: "person_075", dir: 2, nm: "商人", when: g => cut(g, "c1s10") },
      { id: "totoS", x: 2, y: 14, img: "person_100", dir: 2, nm: "トト", when: g => cut(g, "c1s10") },
      // 夜明けからは、橋のたもとに橋番
      { id: "garmB", x: 10, y: 11, img: "person_132", dir: 0, psc: 1.5, nm: "ガルム", talk: "garmBridge", card: () => 1, when: g => S(g) >= 28 && !(g.roster || []).includes(13) },
      { id: "kogarumu", x: 10, y: 11, img: "person_132", dir: 0, psc: 1, nm: "コガルム", talk: "kogarumu", card: () => 1, when: g => S(g) >= 28 && (g.roster || []).includes(13) },  // ガルムの甥（小さめの石の巨人）
      { id: "sigB", x: 6, y: 13, img: "person_146", dir: 2, nm: "傷の男", when: g => cut(g, "c1s13b") },
      { id: "kb1", x: 5, y: 12, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => cut(g, "c1s13b") },
      { id: "kb2", x: 5, y: 14, mon: "monster_020", face: 1, nm: "黒外套の兵", when: g => cut(g, "c1s13b") },
      { id: "kb3", x: 4, y: 13, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => cut(g, "c1s13b") },
      // 橋が直った後、西のたもとに旅の機械いじり
      { id: "nat", x: 8, y: 15, img: "person_094", dir: 3, nm: "ナット", talk: "nat", when: g => !(g.roster || []).includes(10) && S(g) >= 28 && !g.flags.cut },
      // 町の人（段階2から）
      { id: "chaya", x: 20, y: 10, img: "person_076c", dir: 0, nm: "茶屋の娘", talk: "tt", tp: "harune", when: g => S(g) >= 28 && !g.flags.cut },
      { id: "tabi", x: 14, y: 14, img: "person_075", dir: 1, nm: "旅人", talk: "tt", tp: "harune", tw: "旅人（荷を背負った若い商人）", when: g => S(g) >= 28 && !g.flags.cut },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 8, y: 12, w: 1, h: 3, when: g => S(g) === 19, run: "c1s5" },
      { x: 5, y: 6, when: g => S(g) === 20, run: "towerLater" },
      { x: 5, y: 6, when: g => S(g) >= 21, run: "towerIn" },
      { x: 7, y: 12, w: 1, h: 3, when: g => S(g) === 25, run: "c1s10" },
      { x: 21, y: 12, w: 1, h: 3, when: g => S(g) >= 28, run: "tollEast" },
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
      { id: "i1", x: 5, y: 8, mon: "monster_133", face: 1, nm: "イシコロ小僧", when: g => S(g) <= 22 },
      { id: "i2", x: 6, y: 8, mon: "monster_133", face: 1, nm: "イシコロ小僧", when: g => S(g) <= 22 },
      { id: "i3", x: 7, y: 8, mon: "monster_133", face: -1, nm: "イシコロ小僧", when: g => S(g) <= 22 },
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
    npcs: [{ id: "garm", x: 6, y: 4, img: "person_132", dir: 0, psc: 1.5, nm: "ガルム", talk: "garm" }],
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
  fill(g, "~", 16, 2, 1, 18);                                   // 東の小川
  return {
    id: "milna", nm: "風車の里ミルナ", g, tier: 0, bg: null, music: "town",
    objs: [
      { t: "windmill", x: 2, y: 3, w: 2, h: 3 }, { t: "windmill", x: 13, y: 3, w: 2, h: 3 }, { t: "windmill", x: 13, y: 8, w: 2, h: 3 },
      { t: "house", x: 3, y: 8, w: 4, h: 3, roof: "brown", door: 2, chimney: 1 },
      { t: "sign", x: 9, y: 10, text: ["東の関所、当分のあいだ通行を禁ず。宰相ヴァルド"] },
      { t: "wagon", x: 9, y: 12, w: 2, h: 1, when: g => S(g) <= 30 },
      { t: "kaeri", x: 4, y: 14, talk: "kaeri" },
      { t: "house", x: 1, y: 11, w: 3, h: 2, roof: "green", door: 1 },                // ネルの家（粉屋の隣）
      { t: "house", x: 4, y: 2, w: 3, h: 2, roof: "red", door: 1 },                  // 里の外れの木こり小屋
      { t: "woodpile", x: 7, y: 3 }, { t: "woodpile", x: 7, y: 2 },
      { t: "house", x: 13, y: 11, w: 3, h: 2, roof: "blue", door: 1, kind: "inn", nm: "ミルナの宿" },               // 宿
      { t: "sign", x: 12, y: 13, text: ["宿"] },
    ],
    exits: [{ x: 8, y: 0, to: "plain", tx: 31, ty: 28, dir: 3 }],
    npcs: [
      { id: "morto", x: 6, y: 11, img: "person_019k", dir: 0, nm: "モルト", talk: "morto", card: g => S(g) !== 30 },
      // 町の人（段階2から。台詞は TOWNTALK）
      { id: "hanna", x: 6, y: 4, img: "person_020", dir: 0, nm: "ハンナ", talk: "hanna", when: g => !(g.roster || []).includes(12) },
      { id: "yado", x: 14, y: 14, img: "person_014y", dir: 0, nm: "宿の主人", talk: "milnaInn" },
      { id: "neru", x: 3, y: 13, img: "person_026n", dir: 1, nm: "ネル", talk: "tt", tp: "milna" },
      { id: "fusha", x: 12, y: 9, img: "person_072", dir: 0, nm: "風車番", talk: "tt", tp: "milna" },
      { id: "sentaku", x: 15, y: 7, img: "person_070s", dir: 2, nm: "洗濯の女", talk: "tt", tp: "milna" },
      { id: "konako", x: 8, y: 13, img: "person_022k", dir: 0, nm: "粉まみれの子", talk: "tt", tp: "milna" },
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
  fill(g, "c", 2, 17, 1, 6); fill(g, "c", 3, 22, 5, 1);                   // 裏通りの奥（通夜小屋へ）
  g[15][W - 1] = "c"; g[16][W - 1] = "c";                                 // 東門
  const gc = window.GS && GS.G ? GS.G.flags.cut : "", soretsu = gc === "c2s16a" || gc === "c2s16b"; // 場面16：葬列（カイは棺の中）
  return {
    id: "lux", nm: "王都ルクスベル", g, tier: 0, bg: null, music: "town", noFollow: soretsu ? 1 : 0, noLeader: soretsu ? 1 : 0,
    objs: [
      { t: "castle", x: 7, y: 1, w: 8, h: 4 },
      { t: "gatePost", x: 9, y: 26, w: 1, h: 2 }, { t: "gatePost", x: 12, y: 26, w: 1, h: 2 },
      { t: "house", x: 3, y: 10, w: 5, h: 3, roof: "red", door: 2, chimney: 1 },     // 酒場
      { t: "sign", x: 8, y: 13, text: ["酒場　白い鳩亭"] },
      { t: "house", x: 3, y: 2, w: 4, h: 3, roof: "blue", door: 1 },                 // 古い礼拝堂
      { t: "sign", x: 7, y: 5, text: ["古い礼拝堂"] },
      { t: "house", x: 14, y: 9, w: 5, h: 3, roof: "brown", door: 2 },                // 役場
      { t: "sign", x: 13, y: 12, text: ["王都の役場"] },
      { t: "house", x: 16, y: 2, w: 4, h: 3, roof: "brown", door: 1 },                // 礼拝堂の裏の空き家（隠れ家）
      { t: "house", x: 14, y: 19, w: 5, h: 3, roof: "green", door: 2, chimney: 1 },
      { t: "house", x: 3, y: 19, w: 5, h: 3, roof: "blue", door: 2 },                 // 通夜小屋（裏通りの奥の長屋）
      { t: "lantern", x: 4, y: 22 }, { t: "lantern", x: 6, y: 22 },
      { t: "sign", x: 8, y: 22, text: ["通夜小屋　棺・泣き手、承ります"] },
      { t: "gatePost", x: W - 1, y: 13, w: 1, h: 2 }, { t: "gatePost", x: W - 1, y: 17, w: 1, h: 2 }, // 東門
      { t: "wagon", x: 14, y: 15, w: 2, h: 1, coffin: 1, when: g => cut(g, "c2s16a") },
      { t: "wagon", x: 17, y: 15, w: 2, h: 1, coffin: 1, when: g => cut(g, "c2s16b") },
      { t: "fountain", x: 13, y: 15 },
      { t: "stele", x: 6, y: 17, text: ["五年前の、国境の戦で亡くなった人たちの碑。", "名前が、びっしりと刻まれている。"] },
      { t: "sign", x: 9, y: 17, text: ["魔王討伐の軍資金にご協力を"] },
      { t: "sign", x: 12, y: 24, text: ["魔王討伐の軍資金にご協力を"] },
      { t: "kaeri", x: 18, y: 16, talk: "kaeri" },
      { t: "wagon", x: 10, y: 31, w: 2, h: 1, when: g => cut(g, "c2s3") },
    ],
    exits: [{ x: 10, y: 39, to: "plain", tx: 20, ty: 1, dir: 0 }, { x: 11, y: 39, to: "plain", tx: 20, ty: 1, dir: 0 },
      { x: W - 1, y: 15, to: "akamugi", tx: 2, ty: 8, dir: 2 }, { x: W - 1, y: 16, to: "akamugi", tx: 2, ty: 8, dir: 2 }],
    npcs: [
      { id: "dario", x: 13, y: 27, mon: "monster_010", face: -1, nm: "ダリオ", talk: "dario", card: () => 1, when: g => S(g) >= 31 },
      { id: "kgate1", x: 9, y: 28, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => S(g) >= 31 && S(g) < 46 },   // 葬列の後、黒外套は東へ去る
      { id: "kgate2", x: 12, y: 28, mon: "monster_020", face: -1, nm: "黒外套の兵", when: g => S(g) >= 31 && S(g) < 46 },
      // 東門：葬列の前は黒外套がふさいでいる。門番はいつも
      { id: "kuroE1", x: W - 1, y: 15, mon: "monster_019", face: -1, nm: "黒外套の兵", talk: "kuroEast", when: g => S(g) < 46 && !g.flags.cut },
      { id: "kuroE2", x: W - 1, y: 16, mon: "monster_020", face: -1, nm: "黒外套の兵", talk: "kuroEast", when: g => S(g) < 46 && !g.flags.cut },
      { id: "tomon", x: W - 2, y: 14, img: "person_138", dir: 1, nm: "東門の門番", talk: "tt", tp: "lux", when: g => S(g) >= 31 && !g.flags.cut },
      // 場面16の一：朝の大通りを行く葬列（荷車は14,15）
      ...[["jako16", 16, 15, "person_133", 2], ["lise16", 13, 15, "person_002", 2], ["muku16", 16, 16, "person_058h", 2], ["bram16", 15, 16, "person_005", 2], ["naki16a", 12, 15, "person_074k", 2], ["naki16b", 12, 16, "person_076", 2], ["naki16c", 13, 16, "person_074k", 2],
        ["machiW", 17, 14, "person_026n", 0], ["machiM", 18, 17, "person_014", 3]].map(([id, x, y, img, dir]) => ({ id, x, y, img, dir, nm: "", when: g => cut(g, "c2s16a") })),
      // 場面16の二：東門（荷車は17,15）
      ...[["jako16b", 19, 15, "person_133", 2], ["lise16b", 16, 15, "person_002", 2], ["muku16b", 16, 16, "person_058h", 2], ["bram16b", 17, 16, "person_005", 2], ["naki16d", 15, 15, "person_074k", 2], ["naki16e", 15, 16, "person_076", 2], ["naki16f", 14, 15, "person_074k", 2],
        ["tomon16", 19, 14, "person_138", 0], ["machiM2", 18, 17, "person_014", 3]].map(([id, x, y, img, dir]) => ({ id, x, y, img, dir, nm: "", when: g => cut(g, "c2s16b") })),
      ...[[W - 1, 15, "monster_019"], [W - 1, 16, "monster_020"], [W - 2, 13, "monster_021"], [W - 2, 18, "monster_019"]].map(([x, y, mon], i) => ({ id: "kuro16" + i, x, y, mon, face: -1, nm: "", when: g => cut(g, "c2s16b") })),
      { id: "sig16", x: W - 2, y: 16, img: "person_146", dir: 1, nm: "", when: g => cut(g, "c2s16b") && !!g.flags.sigHand && !!g.flags.sig16 },
      { id: "mortoG", x: 12, y: 31, img: "person_019k", dir: 3, nm: "モルト", when: g => cut(g, "c2s3") },
      // 町の人（段階2から。台詞は TOWNTALK）
      { id: "monouri", x: 9, y: 21, img: "person_075m", dir: 2, nm: "物売り", talk: "monouri", when: g => S(g) >= 31 && !g.flags.cut },
      { id: "mofuku", x: 7, y: 17, img: "person_076", dir: 1, nm: "喪服の婦人", talk: "tt", tp: "lux", when: g => S(g) >= 31 && !g.flags.cut },
      { id: "eihei", x: 12, y: 5, img: "person_138c", dir: 0, nm: "城門の衛兵", talk: "tt", tp: "lux", when: g => S(g) >= 31 && !g.flags.cut },
      { id: "oodori", x: 14, y: 16, img: "person_073", dir: 1, nm: "大通りの子", talk: "tt", tp: "lux", when: g => S(g) >= 31 && !g.flags.cut },
      { id: "shiroL", x: 14, y: 14, img: "person_131", dir: 1, nm: "白い犬", talk: "shiro", town: "lux", when: g => S(g) >= 31 && !g.flags.cut && !((g.flags.shiro || {}).lux) },
      { id: "kkado", x: 12, y: 14, mon: "monster_019", face: -1, nm: "黒外套の兵", talk: "tt", tp: "lux", when: g => S(g) >= 31 && S(g) < 46 && !g.flags.cut },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 5, y: 13, run: "sakabaDoor" },
      { x: 4, y: 5, when: g => S(g) >= 33, run: "cryptIn" },
      { x: 17, y: 5, when: g => S(g) >= 43, run: "kakureDoor" },
      { x: 16, y: 12, run: "yakubaDoor" },
      { x: 5, y: 22, run: "tsuyaDoor" },
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
      { id: "niko", x: 5, y: 1, img: "person_070n", dir: 0, nm: "ニコ", talk: "niko", card: g => S(g) >= 32 },
      { id: "kyaku1", x: 2, y: 5, img: "person_074", dir: 2, nm: "酒場の客", talk: "kyaku" },
      { id: "kyaku2", x: 4, y: 6, img: "person_071", dir: 3, nm: "酒場の客", talk: "kyaku" },
      { id: "totoL", x: 8, y: 6, img: "person_100", dir: 1, nm: "トト", talk: "totoL", card: () => 1 },
    ],
    foes: [], chests: [],
    trigs: [{ x: 5, y: 7, when: g => S(g) === 31, run: "c2s4" }],
  };
}

// ---------- 王家の地下墓所（C3。強さ3）：古い礼拝堂の床の下。王たちの回廊→壁画の間 ----------
function crypt1() {
  const W = 15, H = 30, g = grid(W, H, "W");
  fill(g, "_", 6, 24, 3, 5); g[29][7] = "_";              // 入口の階段の下
  fill(g, "_", 2, 12, 11, 12);                            // 王たちの回廊
  fill(g, "_", 6, 9, 3, 3);
  fill(g, "_", 2, 2, 11, 7);                              // 壁画の間
  g[2][7] = "S";
  return {
    id: "crypt1", nm: "王家の地下墓所", g, tier: 3, bg: "stone", dark: 1, inside: 1,
    objs: [
      ...[13, 16, 19].map(y => ({ t: "coffin", x: 3, y, w: 1, h: 2 })), ...[13, 16].map(y => ({ t: "coffin", x: 11, y, w: 1, h: 2 })),
      { t: "coffin", x: 11, y: 19, w: 1, h: 2, wheat: 1, text: ["麦の穂の彫りのある、新しい石棺。"] },
      { t: "candle", x: 5, y: 23 }, { t: "candle", x: 9, y: 23 }, { t: "candle", x: 5, y: 12 }, { t: "candle", x: 9, y: 12 },
      { t: "mural", x: 4, y: 2, w: 3, h: 2, text: ["剣を持つ人と、角のある大きな影。", "二人の顔だけが、削り取られている。"] },
      { t: "candle", x: 2, y: 2 }, { t: "candle", x: 12, y: 2 },
    ],
    exits: [{ x: 7, y: 29, to: "lux", tx: 4, ty: 6, dir: 0 }, { x: 7, y: 2, to: "crypt2", tx: 7, ty: 17, dir: 3 }],
    npcs: [],
    foes: [
      { id: "cr1", x: 7, y: 17, k: "hakamori", g: ["hakamori", "honeban", "hakamori"] },
      { id: "cr2", x: 4, y: 21, k: "rousoku", g: ["rousoku", "sekkan", "rousoku"] },
      { id: "cr3", x: 10, y: 6, k: "honeban", g: ["honeban", "sekkan"] },
    ],
    chests: [{ id: "c_crypt1", x: 12, y: 22, item: "knightswd" }, { id: "c_crypt2", x: 2, y: 8, tool: "onigiri" }],
    trigs: [
      { x: 7, y: 27, when: g => S(g) === 34, run: "c2s6" },
      { x: 9, y: 19, w: 2, h: 2, when: g => S(g) === 35, run: "c2s6b" },
      { x: 2, y: 6, w: 11, h: 1, when: g => S(g) === 36, run: "c2s6c" },
    ],
  };
}
// ---------- 建国王の間と、奥の階段（石獅子） ----------
function crypt2() {
  const W = 15, H = 19, g = grid(W, H, "W");
  fill(g, "_", 3, 6, 9, 11); g[17][7] = "_"; g[18][7] = "_";
  fill(g, "_", 6, 2, 3, 4); g[2][7] = "S";
  return {
    id: "crypt2", nm: "建国王の間", g, tier: 3, bg: "stone", dark: 1, inside: 1,
    objs: [
      { t: "bigCoffin", x: 7, y: 10, w: 1, h: 2, talk: "kenkoku" },
      { t: "stele", x: 3, y: 6, talk: "hibun" }, { t: "stele", x: 4, y: 6, talk: "hibun" },
      { t: "candle", x: 3, y: 15 }, { t: "candle", x: 11, y: 15 }, { t: "candle", x: 11, y: 7 },
    ],
    exits: [{ x: 7, y: 18, to: "crypt1", tx: 7, ty: 3, dir: 0 }, { x: 7, y: 2, to: "kiroku", tx: 5, ty: 8, dir: 3 }],
    npcs: [
      { id: "shishiN", x: 7, y: 4, mon: "monster_139", face: 1, big: 1, nm: "石獅子", when: g => S(g) <= 38 },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 7, y: 15, when: g => S(g) === 37, run: "c2s7" },
      { x: 7, y: 6, when: g => S(g) === 38, run: "c2s8" },
    ],
  };
}
// ---------- 王城の地下・記録の間 ----------
function kiroku() {
  const g = grid(11, 10, "w"); fill(g, "p", 1, 1, 9, 8); g[9][5] = "D";
  return {
    id: "kiroku", nm: "記録の間", g, tier: 0, bg: null, inside: 1, dark: 1,
    objs: [
      { t: "scroll", x: 1, y: 1 }, { t: "scroll", x: 2, y: 1 }, { t: "scroll", x: 3, y: 1 }, { t: "scroll", x: 7, y: 1 }, { t: "scroll", x: 8, y: 1 }, { t: "scroll", x: 9, y: 1 },
      { t: "table", x: 5, y: 3 }, { t: "chest2", x: 5, y: 2 },
      { t: "shelf", x: 9, y: 5, talk: "kakushi" },
    ],
    exits: [{ x: 5, y: 9, to: "crypt2", tx: 7, ty: 3, dir: 0 }],
    npcs: [], foes: [], chests: [],
    trigs: [{ x: 5, y: 7, when: g => S(g) === 39, run: "c2s9" }],
  };
}
// ---------- 王の寝所（記録の間の隠し戸の先）。隣に小部屋 ----------
function shinjo() {
  const g = grid(13, 10, "w"); fill(g, "p", 1, 1, 7, 8); fill(g, "p", 9, 1, 3, 3); g[2][8] = "p"; g[9][4] = "D";
  return {
    id: "shinjo", nm: "王の寝所", g, tier: 0, bg: null, inside: 1,
    objs: [
      { t: "kingBed", x: 2, y: 1, w: 2, h: 2, text: ["天蓋つきの寝台。王が、静かに眠っている。"] },
      { t: "portrait", x: 5, y: 0, text: ["王妃の肖像画。栗色の髪に、麦の穂の髪飾り。"] },
      { t: "candleStand", x: 1, y: 1 }, { t: "candleStand", x: 7, y: 1 },
      { t: "table", x: 6, y: 5 }, { t: "chair", x: 5, y: 5 },
      { t: "veiled", x: 10, y: 2, text: ["布をかけた台座。"] },
    ],
    exits: [],
    npcs: [{ id: "edmon", x: 2, y: 1, ox: 0.5, head: 1, img: "person_021", dir: 0, nm: "エドモン" }],
    foes: [], chests: [],
    trigs: [{ x: 4, y: 8, when: g => S(g) >= 41, run: "toNiwa" }],
  };
}
// ---------- 城の中庭（月夜） ----------
function nakaniwa() { // 一行は下（寝所の回廊）から出てくる。出口は上の門
  const W = 15, H = 14, g = grid(W, H, "c");
  fill(g, "Q", 0, 0, W, 2); fill(g, "Q", 0, 0, 1, H); fill(g, "Q", W - 1, 0, 1, H); fill(g, "Q", 0, H - 1, W, 1); g[0][7] = "c"; g[1][7] = "c";
  fill(g, ".", 4, 7, 2, 3); fill(g, ".", 9, 7, 2, 3);
  return {
    id: "nakaniwa", nm: "城の中庭", g, tier: 0, bg: null, inside: 1,
    objs: [
      ...[3, 6, 9].map(y => ({ t: "column", x: 2, y })), ...[3, 6, 9].map(y => ({ t: "column", x: 12, y })),
      { t: "gatePost", x: 6, y: 1 }, { t: "gatePost", x: 8, y: 1 },
    ],
    exits: [],
    npcs: [
      { id: "vald", x: 7, y: 6, img: "person_123", dir: 0, nm: "ヴァルド", when: g => S(g) <= 41 },
      { id: "vald2", x: 3, y: 6, img: "person_123", dir: 2, nm: "ヴァルド", when: g => S(g) >= 42 },
      { id: "sigN", x: 7, y: 5, img: "person_146", dir: 0, nm: "シグ" },
      { id: "kNiwa1", x: 6, y: 4, mon: "monster_018", face: 1, nm: "黒外套の兵", when: g => S(g) <= 41 },
      { id: "kNiwa2", x: 8, y: 4, mon: "monster_021", face: -1, nm: "黒外套の兵", when: g => S(g) <= 41 },
      { id: "kNiwa3", x: 7, y: 3, mon: "monster_019", face: 1, nm: "黒外套の兵", when: g => S(g) <= 41 },
    ],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- 北の礼拝堂の裏の空き家（隠れ家） ----------
function kakurega() {
  const g = grid(9, 7, "w"); fill(g, "p", 1, 1, 7, 5); g[6][4] = "D";
  return {
    id: "kakurega", nm: "裏通りの隠れ家", g, tier: 0, bg: null, inside: 1,
    objs: [{ t: "table", x: 3, y: 2 }, { t: "chair", x: 2, y: 2 }, { t: "basket", x: 7, y: 1 }, { t: "basket", x: 1, y: 5 }, { t: "shelf", x: 6, y: 1 }],
    exits: [{ x: 4, y: 6, to: "lux", tx: 17, ty: 6, dir: 0 }],
    npcs: [], foes: [], chests: [], trigs: [],
  };
}
// ---------- 王都の役場（戸籍の窓口） ----------
function yakuba() {
  const g = grid(11, 8, "w"); fill(g, "p", 1, 1, 9, 6); g[7][5] = "D";
  const sc = !!(window.GS && GS.G && GS.G.flags.cut === "c2s13");   // 場面13：主人公（と仲間）は外で待つ
  return {
    id: "yakuba", nm: "王都の役場", g, tier: 0, bg: null, inside: 1, noFollow: sc ? 1 : 0, noLeader: sc ? 1 : 0,
    objs: [
      ...[3, 4, 5, 6, 7].map(x => ({ t: "counter", x, y: 3 })),
      { t: "shelf", x: 1, y: 1 }, { t: "scroll", x: 2, y: 1 }, { t: "scroll", x: 8, y: 1 }, { t: "shelf", x: 9, y: 1 }, { t: "desk", x: 7, y: 1 },
    ],
    exits: [{ x: 5, y: 7, to: "lux", tx: 16, ty: 13, dir: 0 }],
    npcs: [
      { id: "shoki", x: 5, y: 2, img: "person_127", dir: 0, nm: "書記", talk: "tt", tp: "lux" },
      { id: "liseY", x: 5, y: 4, img: "person_002", dir: 3, nm: "リゼット", when: g => cut(g, "c2s13") },
      { id: "mukuY", x: 4, y: 5, img: "person_058h", dir: 3, nm: "ムク", when: g => cut(g, "c2s13") },
    ],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- 通夜小屋（王都の裏通りの奥。第2章の場面14・15） ----------
function tsuya() {
  const g = grid(11, 9, "w"); fill(g, "p", 1, 1, 9, 7); g[8][5] = "D";
  const c = window.GS && GS.G ? GS.G.flags.cut : "", night = c === "c2s15" || c === "c2s15b";
  return {
    id: "tsuya", nm: "通夜小屋", g, tier: 0, bg: null, inside: 1, music: "town", noFollow: night ? 1 : 0, noLeader: night ? 1 : 0,
    objs: [
      { t: "woodCoffin", x: 1, y: 1, h: 2 }, { t: "woodCoffin", x: 2, y: 1, h: 2 }, { t: "woodCoffin", x: 3, y: 1, h: 2 },
      { t: "counter", x: 7, y: 2 }, { t: "counter", x: 8, y: 2 }, { t: "counter", x: 9, y: 2 }, { t: "shelf", x: 9, y: 1 },
      { t: "candleStand", x: 9, y: 6 }, { t: "candleStand", x: 1, y: 6 },
      { t: "diceBowl", x: 5, y: 4, when: g => !night },
      { t: "openCoffin", x: 2, y: 4, h: 2, talk: "tsuyaNight", when: g => S(g) === 45 && !night }, // カイの棺（明日の朝、これで関を渡る）
      { t: "openCoffin", x: 5, y: 3, h: 2, when: g => night },
    ],
    exits: [{ x: 5, y: 8, to: "lux", tx: 5, ty: 23, dir: 0 }],
    npcs: [
      { id: "gonzo", x: 8, y: 1, img: "person_135", dir: 0, nm: "ゴンゾ", talk: "gonzo", card: g => S(g) >= 45, when: g => !night },
      { id: "jakoT", x: 5, y: 3, img: "person_133", dir: 0, nm: "ジャコ", talk: "jakoT", when: g => (S(g) === 44 || S(g) === 45) && !night },
      { id: "nakiA", x: 4, y: 4, img: "person_074k", dir: 2, nm: "泣き屋", talk: "nakiya", when: g => !night },
      { id: "nakiB", x: 6, y: 4, img: "person_076", dir: 1, nm: "泣き屋", talk: "nakiya", when: g => !night },
      { id: "nakiC", x: 5, y: 5, img: "person_074k", dir: 3, nm: "泣き屋", talk: "nakiya", when: g => !night && S(g) >= 47 },   // ジャコが抜けた後の席
      { id: "totoT", x: 5, y: 7, img: "person_100", dir: 3, nm: "トト", when: g => cut(g, "c2s14t") },
      // 場面15：通夜の夜
      { id: "kaiN", x: 5, y: 3, img: "person_108", dir: 0, nm: "", when: g => cut(g, "c2s15") },
      { id: "liseN", x: 6, y: 4, img: "person_002", dir: 1, nm: "", when: g => cut(g, "c2s15") },
      { id: "mukuN", x: 5, y: 6, img: "person_058h", dir: 4, col: 2, nm: "", when: g => night },
      { id: "bramN", x: 9, y: 4, img: "person_005", dir: 4, col: 2, nm: "", when: g => night },
      { id: "nakiN1", x: 2, y: 5, img: "person_074k", dir: 4, col: 2, nm: "", when: g => night },
      { id: "nakiN2", x: 3, y: 6, img: "person_076", dir: 2, nm: "", when: g => night },
      { id: "jakoN", x: 8, y: 6, img: "person_133", dir: 2, nm: "", when: g => cut(g, "c2s15b") },
    ],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- 赤麦の丘（C5。強さ3）と東の関所（C8） ----------
function akamugi() {
  const W = 26, H = 16, g = grid(W, H, "H");
  fill(g, ".", 0, 0, W, 2); fill(g, ".", 0, H - 2, W, 2);                 // 丘の上と下の縁は草
  fill(g, "T", 0, 0, W, 1); fill(g, "T", 0, H - 1, W, 1);
  fill(g, "=", 0, 8, 8, 1); fill(g, "=", 7, 8, 1, 4); fill(g, "=", 7, 11, 8, 1); fill(g, "=", 14, 7, 1, 5); fill(g, "=", 14, 7, 12, 1); // 赤麦の中の道
  fill(g, ".", 3, 3, 4, 3); fill(g, ".", 10, 12, 4, 2); fill(g, ".", 17, 9, 4, 3); fill(g, ".", 9, 4, 3, 3);   // 畑の切れ目の草地
  fill(g, "=", 4, 5, 1, 3); fill(g, "=", 10, 7, 1, 1); fill(g, "=", 10, 5, 1, 2); fill(g, "=", 12, 11, 1, 1); fill(g, "=", 18, 8, 1, 1);
  fill(g, ".", 16, 4, 6, 3); fill(g, ".", 17, 8, 6, 3); fill(g, "=", 17, 7, 6, 1);   // 関所の前の空き地（並ぶ荷車・関守）
  fill(g, "Q", 23, 0, 1, H); g[7][23] = "=";                              // 関所の石垣（門だけ通れる）
  fill(g, ".", 24, 0, 2, H); fill(g, "=", 24, 7, 2, 1);
  const open = window.GS && GS.G && (GS.G.flags.s || 0) >= 47;
  return {
    id: "akamugi", nm: "赤麦の丘", g, tier: 3, bg: "meadow", afterWin: "akaWin",
    objs: [
      { t: "kanmon", x: 22, y: 6, w: 3, h: 2, walk: 1, open },
      { t: "wagon", x: 17, y: 5, w: 2, h: 1, when: g => S(g) < 47 }, { t: "wagon", x: 19, y: 5, w: 2, h: 1, army: 0, when: g => S(g) < 47 },  // 追い返されて並ぶ荷車の列
      { t: "sign", x: 21, y: 8, text: ["東の関所　この先、金砂街道"] },
      { t: "sign", x: 1, y: 7, text: ["西　王都ルクスベル"] },
    ],
    exits: [{ x: 0, y: 8, to: "lux", tx: 20, ty: 15, dir: 1 }, { x: 25, y: 7, to: "hoshimi", tx: 1, ty: 9, dir: 2 }],
    npcs: [
      { id: "sekimori", x: 22, y: 8, img: "person_136", dir: 3, nm: "関守", talk: "sekimori" },
      { id: "gyoA", x: 18, y: 6, img: "person_075", dir: 0, nm: "行商人", talk: "gyoA", when: g => S(g) < 47 },
    ],
    foes: [
      { id: "a1", x: 5, y: 8, k: "akamugi", g: ["akamugi", "akamugi"] },
      { id: "a2", x: 11, y: 11, k: "doro", g: ["doro", "akamugi"] },
      { id: "a3", x: 14, y: 9, k: "akamugi", g: ["akamugi", "doro", "akamugi"] },
      { id: "a4", x: 18, y: 10, k: "doro", g: ["doro", "doro"] },
      { id: "a5", x: 10, y: 5, k: "akamugi", g: ["akamugi", "mugiwara", "akamugi"] },
    ],
    chests: [{ id: "c_aka1", x: 3, y: 3, gold: 120 }, { id: "c_aka2", x: 20, y: 11, item: "shortbow" }],
    trigs: [
      { x: 1, y: 8, when: g => S(g) === 46, run: "noBack" },       // 葬列は引き返さない
      { x: 21, y: 7, when: g => S(g) === 46, run: "c2s17" },      // 東の関所
    ],
  };
}
// ---------- 星見の丘（関の東。丘の上の墓地） ----------
function hoshimi() {
  const W = 16, H = 14, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 1); fill(g, "T", 0, 0, 1, 8); fill(g, "T", 0, 11, 1, 3); fill(g, "T", 0, H - 1, W, 1);
  fill(g, "=", 0, 9, 9, 1); fill(g, "=", 8, 4, 1, 6); fill(g, "=", 8, 9, 8, 1);      // 丘へ上る道と、東の街道
  fill(g, "=", W - 3, 1, 3, 12);                                                      // 東は砂色の地平（街道）
  return {
    id: "hoshimi", nm: "星見の丘", g, tier: 3, bg: "meadow",
    objs: [
      ...[[4, 3], [6, 2], [10, 2], [12, 4], [3, 6], [11, 6], [5, 11], [11, 11]].map(([x, y]) => ({ t: "grave", x, y })),
      { t: "newGrave", x: 8, y: 2, talk: "kaiGrave", when: g => S(g) >= 47 },
      { t: "sign", x: 12, y: 8, text: ["東　金砂街道・金砂の都ザハラ"] },
    ],
    exits: [{ x: 0, y: 9, to: "akamugi", tx: 24, ty: 7, dir: 1 }, { x: W - 1, y: 9, to: "kinsa", tx: 1, ty: 9, dir: 2 }],
    npcs: [],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- 金砂街道（E1。強さ4。星見の丘の東） ----------
function kinsa() {
  const W = 26, H = 16, g = grid(W, H, "Z");
  fill(g, "U", 0, 0, W, 2); fill(g, "U", 0, H - 2, W, 2);
  fill(g, "U", 5, 2, 3, 3); fill(g, "U", 15, 11, 4, 3); fill(g, "U", 20, 2, 2, 3); fill(g, "U", 9, 12, 2, 2);
  fill(g, "=", 0, 9, 7, 1); fill(g, "=", 6, 6, 1, 4); fill(g, "=", 6, 6, 9, 1); fill(g, "=", 14, 6, 1, 4); fill(g, "=", 14, 9, 12, 1);   // 丘を越える道
  fill(g, "=", 10, 4, 1, 2);
  return {
    id: "kinsa", nm: "金砂街道", g, tier: 4, bg: "gold", music: null, pad: "U",
    objs: [
      { t: "house", x: 8, y: 1, w: 5, h: 3, roof: "sand", door: 2, sign: "宿", kind: "inn", nm: "隊商宿" },      // 隊商宿
      { t: "wagon", x: 3, y: 4, w: 2, h: 1 },
      { t: "cactus", x: 3, y: 11 }, { t: "cactus", x: 12, y: 10 }, { t: "cactus", x: 19, y: 5 }, { t: "cactus", x: 23, y: 12 }, { t: "palm", x: 13, y: 2, h: 2 },
      { t: "sign", x: 1, y: 8, text: ["西　東の関所・星見の丘"] }, { t: "sign", x: 24, y: 8, text: ["東　金砂の都ザハラ"] },
    ],
    exits: [{ x: 0, y: 9, to: "hoshimi", tx: 14, ty: 9, dir: 1 }, { x: W - 1, y: 9, to: "zahara", tx: 1, ty: 15, dir: 2 }],
    npcs: [
      { id: "taishoA", x: 9, y: 5, img: "person_075d", dir: 0, nm: "隊商の男", talk: "taisho" },
      { id: "taishoB", x: 12, y: 5, img: "person_075d", dir: 1, nm: "隊商の男", talk: "taisho" },
    ],
    foes: [
      { id: "k1", x: 4, y: 9, k: "saboten", g: ["saboten"] },
      { id: "k2", x: 10, y: 8, k: "sunamogu", g: ["sunamogu", "sasori"] },
      { id: "k3", x: 17, y: 7, k: "saboten", g: ["saboten", "sasori"] },
      { id: "k4", x: 21, y: 11, k: "sunamogu", g: ["sunamogu"] },
    ],
    chests: [{ id: "c_kinsa1", x: 22, y: 4, gold: 150 }, { id: "c_kinsa2", x: 2, y: 12, tool: "onigiri" }],
    trigs: [
      { x: 1, y: 9, when: g => S(g) === 47, run: "c3s1" },
      { x: 9, y: 6, w: 4, h: 1, when: g => S(g) === 48, run: "c3s1b" },
    ],
  };
}
// ---------- 金砂の都ザハラ（E2） ----------
function zahara() {
  const W = 28, H = 30, g = grid(W, H, "Z");
  fill(g, "Q", 0, 0, W, 1); fill(g, "Q", 0, 0, 1, H); fill(g, "Q", W - 1, 0, 1, H); fill(g, "Q", 0, H - 1, W, 1);
  g[15][0] = "c"; g[16][0] = "c";                                         // 西の門
  fill(g, "c", 1, 15, W - 2, 2); fill(g, "c", 13, 2, 2, 26);              // 大通り（東西・南北）
  fill(g, "c", 4, 8, 9, 1); fill(g, "c", 15, 8, 9, 1); fill(g, "c", 4, 23, 9, 1); fill(g, "c", 15, 23, 9, 1);
  const zs = window.GS && GS.G ? (GS.G.flags.s || 0) : 0;
  if (zs >= 53) { g[H - 1][13] = "c"; g[H - 1][14] = "c"; g[H - 2][13] = "c"; g[H - 2][14] = "c"; }   // 南の門（涸れ谷へ）
  if (zs >= 62) { g[15][W - 1] = "c"; g[16][W - 1] = "c"; }                                         // 東の門（港町セイレナへ）
  return {
    id: "zahara", nm: "金砂の都ザハラ", g, tier: 0, bg: null, music: "town", pad: "Z", noFollow: window.GS && GS.G && GS.G.flags.cut === "c3s4" ? 1 : 0,
    objs: [
      { t: "house", x: 9, y: 2, w: 10, h: 4, roof: "gold", door: 4, sign: "商館" },               // 商館（扉 13,6）
      { t: "house", x: 18, y: 18, w: 6, h: 3, roof: "red", door: 2 },                                // 金の蠍亭（扉 20,21）
      { t: "scorpionSign", x: 24, y: 20 },
      { t: "house", x: 2, y: 18, w: 7, h: 4, roof: "sand", door: 3, sign: "闘技場" },             // 闘技場（扉 5,22）
      { t: "house", x: 2, y: 9, w: 5, h: 3, roof: "brown", door: 2, sign: "宿" },                  // 宿（扉 4,12）
      { t: "house", x: 18, y: 9, w: 6, h: 3, roof: "blue", door: 2 },                               // 競売館（まだ閉まっている）
      { t: "sign", x: 17, y: 12, text: ["競売館　次の競りは未定"], when: g => S(g) < 58 }, { t: "sign", x: 17, y: 12, text: ["競売館　本日、特別の競り"], when: g => S(g) >= 58 },
      { t: "fountain", x: 13, y: 12 }, { t: "fountain", x: 14, y: 12 },
      { t: "house", x: 21, y: 25, w: 4, h: 2, roof: "brown", door: 2, noEnter: 1, sign: "牢" },                     // 町の牢（第4章から牢番が立つ）
      { t: "stall", x: 4, y: 13, w: 2 }, { t: "stall", x: 8, y: 13, w: 2 }, { t: "stall", x: 18, y: 13, w: 2 }, { t: "stall", x: 22, y: 13, w: 2 },
      { t: "palm", x: 2, y: 2, h: 2 }, { t: "palm", x: 25, y: 2, h: 2 }, { t: "palm", x: 11, y: 25, h: 2 }, { t: "palm", x: 16, y: 25, h: 2 },
      { t: "gatePost", x: 0, y: 13, w: 1, h: 2 }, { t: "gatePost", x: 0, y: 17, w: 1, h: 2 },
      { t: "gatePost", x: 12, y: 28, w: 1, h: 1, when: g => S(g) >= 53 }, { t: "gatePost", x: 15, y: 28, w: 1, h: 1, when: g => S(g) >= 53 },
      { t: "gatePost", x: 27, y: 13, w: 1, h: 2, when: g => S(g) >= 62 }, { t: "gatePost", x: 27, y: 17, w: 1, h: 2, when: g => S(g) >= 62 },
    ],
    exits: [{ x: 0, y: 15, to: "kinsa", tx: 24, ty: 9, dir: 1 }, { x: 0, y: 16, to: "kinsa", tx: 24, ty: 9, dir: 1 },
      ...(window.GS && GS.G && (GS.G.flags.s || 0) >= 53 ? [{ x: 13, y: H - 1, to: "kareta", tx: 11, ty: 2, dir: 0 }, { x: 14, y: H - 1, to: "kareta", tx: 12, ty: 2, dir: 0 }] : []),
      ...(window.GS && GS.G && (GS.G.flags.s || 0) >= 62 ? [{ x: W - 1, y: 15, to: "seirena", tx: 1, ty: 11, dir: 2 }, { x: W - 1, y: 16, to: "seirena", tx: 1, ty: 12, dir: 2 }] : [])],
    npcs: [
      { id: "shokanban", x: 14, y: 7, img: "person_139", dir: 0, nm: "商館の番人", talk: "tt", tp: "zahara" },
      { id: "tobakuban", x: 21, y: 22, img: "person_140", dir: 0, nm: "賭場の番人", talk: "tt", tp: "zahara" },
      { id: "seriN", x: 19, y: 12, img: "person_014", dir: 0, nm: "競り人", talk: "tt", tp: "zahara" },
      { id: "mizuuri", x: 12, y: 13, img: "person_070w", dir: 0, nm: "水売りの娘", talk: "tt", tp: "zahara" },
      { id: "ryogae", x: 23, y: 14, img: "person_078z", dir: 0, nm: "両替商", talk: "tt", tp: "zahara" },
      { id: "totoZ", x: 9, y: 14, img: "person_100", dir: 0, nm: "トト", talk: "totoL", card: () => 1, when: g => S(g) !== 60 },
      { id: "liseZ", x: 13, y: 8, img: "person_002", dir: 0, nm: "", when: g => cut(g, "c3s4") },
      { id: "jakoZ", x: 14, y: 8, img: "person_133", dir: 3, nm: "", when: g => cut(g, "c3s4") },
      { id: "bramZ", x: 12, y: 8, img: "person_005", dir: 2, nm: "", when: g => cut(g, "c3s4") },
      { id: "mukuZ", x: 12, y: 9, img: "person_058h", dir: 3, nm: "", when: g => cut(g, "c3s4") },
      { id: "asterZ", x: 15, y: 8, img: "person_013", dir: 1, nm: "", when: g => cut(g, "c3s10b") || cut(g, "c3s12b") },
      { id: "rouban", x: 25, y: 27, img: "person_014j", dir: 0, nm: "牢番", talk: "tt", tp: "zahara", when: g => S(g) >= 62 },
      { id: "totoN", x: 6, y: 14, img: "person_100", dir: 1, nm: "トト", talk: "totoL", card: () => 1, when: g => S(g) === 60 },
      { id: "taishoZ", x: 2, y: 14, img: "person_075d", dir: 2, nm: "隊商の男", when: g => cut(g, "c3s14") },
      { id: "asterGate", x: 26, y: 15, img: "person_013", dir: 1, nm: "", when: g => cut(g, "c3s14b") },
      { id: "heiGate1", x: 26, y: 17, mon: "monster_010", face: -1, nm: "王国兵", when: g => cut(g, "c3s14b") },
      { id: "heiGate2", x: 25, y: 17, mon: "monster_010", face: -1, nm: "王国兵", when: g => cut(g, "c3s14b") },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 1, y: 15, h: 2, when: g => S(g) === 49, run: "c3s2" },
      { x: 13, y: 6, run: "shokanDoor" },
      { x: 20, y: 21, run: "casinoDoor" },
      { x: 5, y: 22, run: "arenaDoor" },
      { x: 4, y: 12, run: "zInnDoor" },
      { x: 20, y: 12, run: "auctionDoor" },
    ],
  };
}
function shokan() { // 商館の広間
  const g = grid(13, 9, "w"); fill(g, "p", 1, 1, 11, 7); g[8][6] = "D";
  return {
    id: "shokan", nm: "ザハラの商館", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [
      ...[4, 5, 6, 7, 8].map(x => ({ t: "counter", x, y: 3 })),
      { t: "shelf", x: 1, y: 1 }, { t: "scroll", x: 2, y: 1 }, { t: "scroll", x: 10, y: 1 }, { t: "shelf", x: 11, y: 1 }, { t: "desk", x: 6, y: 1 },
      { t: "chest2", x: 1, y: 6 }, { t: "chest2", x: 11, y: 6 }, { t: "candleStand", x: 3, y: 1 }, { t: "candleStand", x: 9, y: 1 },
    ],
    exits: [{ x: 6, y: 8, to: "zahara", tx: 13, ty: 7, dir: 0 }],
    npcs: [
      { id: "margo", x: 6, y: 2, img: "person_134", dir: 0, nm: "マルゴ", talk: "margo", card: g => S(g) >= 52 },
      { id: "asterS", x: 7, y: 6, img: "person_013", dir: 1, nm: "", when: g => cut(g, "c3s3b") || cut(g, "c3s10") || cut(g, "c3s12") },
    ],
    foes: [], chests: [], trigs: [],
  };
}
function casino() { // 大賭場「金の蠍亭」
  const g = grid(13, 9, "w"); fill(g, "p", 1, 1, 11, 7); g[8][6] = "D";
  return {
    id: "casino", nm: "金の蠍亭", g, tier: 0, bg: null, inside: 1, music: "town", noFollow: window.GS && GS.G && GS.G.flags.cut === "c3s4b" ? 1 : 0,
    objs: [
      ...[1, 2, 3, 4, 5].map(x => ({ t: "slotMachine", x, y: 1, talk: "slot" })),
      ...[8, 9, 10, 11].map(x => ({ t: "counter", x, y: 2 })),
      { t: "diceBowl", x: 9, y: 5 }, { t: "candleStand", x: 1, y: 6 }, { t: "candleStand", x: 11, y: 6 },
    ],
    exits: [{ x: 6, y: 8, to: "zahara", tx: 20, ty: 22, dir: 0 }],
    npcs: [
      { id: "keihin", x: 10, y: 1, img: "person_070p", dir: 0, nm: "景品係", talk: "keihin" },
      { id: "tsubo", x: 9, y: 4, img: "person_099", dir: 0, nm: "壺振り", talk: "tsubo" },
      { id: "jakoC", x: 3, y: 3, img: "person_133", dir: 3, nm: "", when: g => cut(g, "c3s4b") },
      { id: "liseC", x: 4, y: 4, img: "person_002", dir: 3, nm: "", when: g => cut(g, "c3s4b") },
    ],
    foes: [], chests: [], trigs: [],
  };
}
function arena() { // 闘技場の受付
  const g = grid(11, 8, "w"); fill(g, "p", 1, 1, 9, 6); g[7][5] = "D";
  return {
    id: "arena", nm: "ザハラの闘技場", g, tier: 4, bg: "gold", inside: 1, music: "town",
    objs: [...[3, 4, 5, 6, 7].map(x => ({ t: "counter", x, y: 3 })), { t: "shelf", x: 1, y: 1 }, { t: "desk", x: 8, y: 1 }, { t: "candleStand", x: 1, y: 5 }, { t: "candleStand", x: 9, y: 5 }],
    exits: [{ x: 5, y: 7, to: "zahara", tx: 5, ty: 23, dir: 0 }],
    npcs: [{ id: "gina", x: 5, y: 2, img: "person_137", dir: 0, nm: "ジーナ", talk: "gina", card: () => 1 }],
    foes: [], chests: [], trigs: [],
  };
}
function zinn() { // ザハラの宿
  const g = grid(9, 7, "w"); fill(g, "p", 1, 1, 7, 5); g[6][4] = "D";
  return {
    id: "zinn", nm: "ザハラの宿", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [{ t: "bed", x: 1, y: 1, w: 1, h: 2, talk: "zRest" }, { t: "bed", x: 3, y: 1, w: 1, h: 2, talk: "zRest" }, { t: "bed", x: 7, y: 1, w: 1, h: 2, talk: "zRest" }, { t: "counter", x: 6, y: 3 }],
    exits: [{ x: 4, y: 6, to: "zahara", tx: 3, ty: 12, dir: 0 }],
    npcs: [{ id: "zinnH", x: 6, y: 2, img: "person_078", dir: 0, nm: "宿の主人", talk: "zRest" }],
    foes: [], chests: [], trigs: [],
  };
}

// ---------- 港町セイレナ（E5）：西の門はザハラへ。東と南は海。北の波止場に商盟の船、南の桟橋に小舟 ----------
function seirena() {
  const W = 30, H = 24, g = grid(W, H, "Z");
  fill(g, "T", 0, 0, W, 1); fill(g, "T", 0, 0, 1, H); fill(g, "T", 0, H - 1, 20, 1);
  fill(g, "~", 23, 0, 7, H); fill(g, "~", 20, 20, 10, 4); fill(g, "~", 21, 17, 2, 3);          // 東と南の海
  fill(g, "c", 0, 11, 23, 2); fill(g, "c", 7, 2, 2, 19); fill(g, "c", 8, 7, 12, 1); fill(g, "c", 8, 14, 12, 1);   // 大通り
  fill(g, "b", 20, 7, 7, 2); fill(g, "b", 20, 14, 7, 2);                                                         // 北の波止場・南の桟橋
  g[11][0] = "c"; g[12][0] = "c";
  return {
    id: "seirena", nm: "港町セイレナ", g, tier: 0, bg: null, music: "town", pad: "T",
    objs: [
      { t: "house", x: 2, y: 3, w: 4, h: 3, roof: "blue", door: 2, sign: "宿", kind: "inn", nm: "セイレナの宿" },
      { t: "house", x: 10, y: 3, w: 5, h: 3, roof: "red", door: 2, chimney: 1 },                // 船乗り酒場（扉 12,6）
      { t: "sign", x: 15, y: 6, text: ["船乗り酒場"] },
      { t: "house", x: 2, y: 15, w: 3, h: 2, roof: "brown", door: 1 }, { t: "house", x: 10, y: 16, w: 3, h: 2, roof: "green", door: 1, chimney: 1 },
      { t: "stall", x: 12, y: 9, w: 2 }, { t: "stall", x: 16, y: 9, w: 2 },                                       // 魚市場
      { t: "sign", x: 18, y: 2, text: ["岬の灯台"] }, { t: "statue", x: 20, y: 1 },
      { t: "ship", x: 23, y: 4, w: 3, h: 3, text: ["商盟の旗を立てた船。湾の口がふさがっていて、出せない。"], when: g => S(g) < 66 },
      { t: "ship", x: 23, y: 4, w: 3, h: 3, talk: "boardShip", when: g => S(g) >= 66 },
      { t: "boat", x: 23, y: 16, w: 3, h: 1, talk: "kobune" },                                                  // 南の桟橋の小舟
      { t: "woodpile", x: 15, y: 19 }, { t: "woodpile", x: 16, y: 19 }, { t: "wagon", x: 13, y: 19, w: 2, h: 1 }, // 船だまり
      { t: "gatePost", x: 0, y: 9, w: 1, h: 2 }, { t: "gatePost", x: 0, y: 13, w: 1, h: 2 },
    ],
    exits: [{ x: 0, y: 11, to: "zahara", tx: 25, ty: 15, dir: 1 }, { x: 0, y: 12, to: "zahara", tx: 25, ty: 16, dir: 1 }],
    npcs: [
      { id: "yakunin", x: 21, y: 9, img: "person_074p", dir: 0, nm: "港の役人", talk: "tt", tp: "seirena" },
      { id: "ryoshi", x: 19, y: 13, img: "person_071f", dir: 2, nm: "年寄りの漁師", talk: "tt", tp: "seirena" },
      { id: "uouri", x: 14, y: 10, img: "person_070f", dir: 0, nm: "魚売り", talk: "tt", tp: "seirena" },
      { id: "todai", x: 19, y: 3, img: "person_014t", dir: 0, nm: "灯台守", talk: "tt", tp: "seirena" },
      { id: "minarai", x: 17, y: 20, img: "person_022s", dir: 1, nm: "船大工の見習い", talk: "tt", tp: "seirena" },
      { id: "hatch", x: 18, y: 18, img: "person_099c", dir: 0, nm: "船大工ハッチ", talk: "hatch", card: () => 1 },
      { id: "totoS", x: 5, y: 13, img: "person_100", dir: 0, nm: "トト", talk: "totoL", card: () => 1 },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 1, y: 11, h: 2, when: g => S(g) === 62, run: "c4s1" },
      { x: 20, y: 7, w: 2, h: 2, when: g => S(g) === 63, run: "c4s2" },
      { x: 12, y: 6, run: "funaDoor" },
    ],
  };
}
function funasaka() { // 船乗り酒場
  const g = grid(11, 8, "w"); fill(g, "p", 1, 1, 9, 6); g[7][5] = "D";
  return {
    id: "funasaka", nm: "船乗り酒場", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [...[3, 4, 5, 6, 7].map(x => ({ t: "counter", x, y: 2 })), { t: "hearth", x: 9, y: 0 }, { t: "shelf", x: 1, y: 1 }, { t: "diceBowl", x: 7, y: 5, talk: "funaChin" }, { t: "table", x: 2, y: 5 }],
    exits: [{ x: 5, y: 7, to: "seirena", tx: 12, ty: 7, dir: 0 }],
    npcs: [
      { id: "okamiS", x: 5, y: 1, img: "person_026s", dir: 0, nm: "酒場の女将", talk: "tt", tp: "seirena" },
      { id: "funanori", x: 8, y: 5, img: "person_072s", dir: 1, nm: "船乗り", talk: "funaChin" },
    ],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- 海賊の入り江（S3）：崖に囲まれた入り江。難破船を積んだ砦 ----------
function kaizoku() {
  const W = 22, H = 22, g = grid(W, H, "R");
  fill(g, "Z", 9, 15, 4, 7); g[21][11] = "Z";                       // 舟着き場
  fill(g, "~", 1, 12, 20, 3); fill(g, "b", 10, 12, 2, 3);           // 入り江の水路と板の橋
  fill(g, "Z", 2, 15, 6, 4); fill(g, "Z", 14, 15, 6, 4);            // 岸の岩場
  fill(g, "p", 3, 3, 16, 9); fill(g, "p", 10, 1, 2, 2); g[0][10] = "p"; g[0][11] = "p";   // 難破船の砦（板の床）
  fill(g, "R", 7, 6, 2, 3); fill(g, "R", 13, 6, 2, 3);
  return {
    id: "kaizoku", nm: "海賊の入り江", g, tier: 4, bg: "beach", inside: 1, afterWin: "kaizokuWin",
    objs: [
      { t: "wagon", x: 4, y: 4, w: 2, h: 1 }, { t: "woodpile", x: 17, y: 4 }, { t: "woodpile", x: 17, y: 5 }, { t: "chest2", x: 4, y: 10, text: ["奪った荷の箱。商盟の札が下がっている。"] },
      { t: "basket", x: 16, y: 10 }, { t: "candle", x: 9, y: 2 }, { t: "candle", x: 12, y: 2 },
    ],
    exits: [{ x: 11, y: 21, to: "seirena", tx: 23, ty: 15, dir: 0 }, { x: 10, y: 0, to: "kaizoku2", tx: 6, ty: 9, dir: 3 }, { x: 11, y: 0, to: "kaizoku2", tx: 6, ty: 9, dir: 3 }],
    npcs: [],
    foes: [
      { id: "kz1", x: 11, y: 16, k: "gaikotsu", g: ["gaikotsu", "kaizokuA"] },
      { id: "kz2", x: 4, y: 16, k: "yadokahou", g: ["yadokahou", "yadokahou"] },
      { id: "kz3", x: 16, y: 17, k: "fujitsubo", g: ["fujitsubo"] },
      { id: "kz4", x: 6, y: 8, k: "kaizokuB", g: ["kaizokuB", "gaikotsu"] },
      { id: "kz5", x: 16, y: 7, k: "gaikotsu", g: ["gaikotsu", "yadokahou", "kaizokuA"] },
    ],
    chests: [{ id: "c_kaizoku1", x: 18, y: 16, gold: 300 }, { id: "c_kaizoku2", x: 3, y: 3, item: "knightswd" }],
    trigs: [],
  };
}
function kaizoku2() { // 砦のいちばん奥：巻き上げ機と鎖、水の中の檻
  const W = 13, H = 11, g = grid(W, H, "R"); fill(g, "p", 1, 3, 11, 7); g[10][6] = "p"; fill(g, "~", 1, 1, 11, 2);
  return {
    id: "kaizoku2", nm: "入り江の奥", g, tier: 4, bg: "beach", inside: 1,
    objs: [{ t: "winch", x: 2, y: 3, w: 2, h: 2, text: (window.GS && GS.G && (GS.G.flags.s || 0) >= 66) ? ["止め金が外れ、鎖は海に沈んでいる。"] : ["大きな巻き上げ機。太い鎖が海へ伸びている。"] }, { t: "cage", x: 9, y: 1, w: 2, h: 2 }, { t: "woodpile", x: 11, y: 8 }],
    exits: [{ x: 6, y: 10, to: "kaizoku", tx: 10, ty: 1, dir: 0 }],
    npcs: [
      { id: "dreg", x: 6, y: 4, img: "person_144", dir: 0, nm: "ドレッグ", when: g => S(g) === 65 },
      { id: "kzA", x: 4, y: 5, img: "person_049", dir: 0, nm: "子分", when: g => S(g) === 65 },
      { id: "kzB", x: 8, y: 5, img: "person_116", dir: 0, nm: "子分", when: g => S(g) === 65 },
    ],
    foes: [], chests: [],
    trigs: [{ x: 1, y: 7, w: 11, h: 2, when: g => S(g) === 65, run: "c4s4" }],
  };
}
// ---------- 内海（S1）：船で動く。外側は嵐の壁。西にセイレナ、東に巡礼の浜 ----------
function uchiumi() {
  const W = 46, H = 32, g = grid(W, H, "~");
  fill(g, "K", 0, 0, W, 2); fill(g, "K", 0, H - 2, W, 2); fill(g, "K", 0, 0, 2, H); fill(g, "K", W - 2, 0, 2, H);   // 嵐の壁
  fill(g, ".", 2, 8, 6, 16); fill(g, "T", 2, 8, 3, 16); fill(g, "Z", 7, 10, 1, 12); fill(g, "c", 5, 14, 3, 3); fill(g, "b", 8, 14, 1, 3);    // 西の岸（セイレナ）と船着き場
  fill(g, ".", 38, 6, 6, 20); fill(g, "T", 41, 6, 3, 20); fill(g, "Z", 38, 9, 1, 14); fill(g, "c", 38, 13, 2, 3); fill(g, "b", 37, 13, 1, 3); // 東の岸（巡礼の浜）と船着き場
  fill(g, ".", 18, 26, 10, 4); fill(g, "Z", 18, 26, 10, 1); fill(g, "T", 19, 28, 8, 2);                          // 南の岸
  fill(g, ".", 21, 11, 4, 3); fill(g, "Z", 20, 12, 1, 1); fill(g, "T", 22, 11, 2, 2);                            // 内海の小島
  fill(g, "R", 30, 4, 3, 2); fill(g, "R", 12, 4, 2, 3); fill(g, "R", 32, 22, 2, 2);                              // 岩礁
  return {
    id: "uchiumi", nm: "内海", g, tier: 4, bg: "sea", music: null, sea: 1, noFollow: 1, pad: "K",
    objs: [],
    exits: [{ x: 8, y: 14, to: "seirena", tx: 22, ty: 9, dir: 1 }, { x: 8, y: 15, to: "seirena", tx: 22, ty: 9, dir: 1 }, { x: 8, y: 16, to: "seirena", tx: 22, ty: 9, dir: 1 }],
    npcs: [],
    foes: [
      { id: "u1", x: 14, y: 12, k: "tobiuo", g: ["tobiuo", "kurage"] },
      { id: "u2", x: 28, y: 16, k: "kamome", g: ["kamome", "kamome", "kamome"] },
      { id: "u3", x: 19, y: 20, k: "kurage", g: ["kurage", "kurage"] },
      { id: "u4", x: 32, y: 9, k: "yadokahou", g: ["yadokahou", "tobiuo"] },
      { id: "u5", x: 10, y: 24, k: "tobiuo", g: ["tobiuo", "tobiuo", "kamome"] },
    ],
    chests: [],
    trigs: [
      { x: 37, y: 13, w: 1, h: 3, run: "junreiDock" },
      { x: 2, y: 2, w: W - 4, h: 1, run: "stormWall", d: [0, 1] }, { x: 2, y: H - 3, w: W - 4, h: 1, run: "stormWall", d: [0, -1] },
      { x: 2, y: 3, w: 1, h: H - 6, run: "stormWall", d: [1, 0] }, { x: W - 3, y: 3, w: 1, h: H - 6, run: "stormWall", d: [-1, 0] },
    ],
  };
}

// ---------- 涸れ谷（E3）：干上がった川床。北はザハラの南門、東の岩山に盗賊の岩窟 ----------
function kareta() {
  const W = 24, H = 20, g = grid(W, H, "Z"), wet = window.GS && GS.G && (GS.G.flags.s || 0) >= 56; // ザザーンを倒した後は、川床に水が戻る
  fill(g, "U", 0, 0, W, 2); fill(g, "U", 0, 0, 2, H); fill(g, "U", W - 2, 0, 2, H); fill(g, "U", 0, H - 2, W, 2);
  g[0][11] = "Z"; g[1][11] = "Z"; g[0][12] = "Z"; g[1][12] = "Z";                    // 北の口（ザハラへ）
  fill(g, "U", 2, 2, 4, 3); fill(g, "U", 16, 2, 6, 4); fill(g, "U", 2, 14, 5, 4); fill(g, "U", 9, 15, 4, 3); fill(g, "U", 17, 13, 5, 5);
  // 川床：北の口から南へ下り、東の岩山のふもとへ曲がる
  fill(g, "=", 11, 2, 2, 7); fill(g, "=", 11, 8, 9, 2); fill(g, "=", 18, 8, 2, 3);
  if (wet) { fill(g, "~", 7, 10, 1, 4); fill(g, "~", 7, 10, 9, 1); fill(g, "~", 15, 10, 1, 3); } // 水の筋（道はふさがない）
  return {
    id: "kareta", nm: "涸れ谷", g, tier: 4, bg: "gold", music: null, pad: "U",
    objs: [
      { t: "well", x: 9, y: 6, text: wet ? ["井戸の底に、水の光が見える。"] : ["のぞきこんでも、底は乾いた砂だけだ。"] },
      { t: "mine", x: 18, y: 6, w: 2, h: 2 },                                                       // 盗賊の岩窟の入り口
      { t: "cactus", x: 4, y: 11 }, { t: "cactus", x: 14, y: 4 }, { t: "cactus", x: 21, y: 11 }, { t: "cactus", x: 8, y: 16 },
      { t: "sign", x: 13, y: 3, text: ["北　金砂の都ザハラ"] },
    ],
    exits: [{ x: 11, y: 0, to: "zahara", tx: 13, ty: 27, dir: 3 }, { x: 12, y: 0, to: "zahara", tx: 14, ty: 27, dir: 3 }, { x: 18, y: 8, to: "gankutsu", tx: 9, ty: 18, dir: 3 }],
    npcs: [
      { id: "rojin", x: 10, y: 6, img: "person_071v", dir: 2, nm: "谷の老人", talk: "rojin", when: g => S(g) >= 53 },
      { id: "heiK1", x: 10, y: 3, mon: "monster_010", face: 1, nm: "王国兵", when: g => cut(g, "c3s6") },
      { id: "heiK2", x: 13, y: 3, mon: "monster_010", face: -1, nm: "王国兵", when: g => cut(g, "c3s6") },
    ],
    foes: [
      { id: "kr1", x: 13, y: 5, k: "hagewashi", g: ["hagewashi", "hagewashi"] },
      { id: "kr2", x: 6, y: 12, k: "sunaningyo", g: ["sunaningyo", "sasori"] },
      { id: "kr3", x: 15, y: 11, k: "sasori", g: ["sasori", "hagewashi"] },
      { id: "kr4", x: 3, y: 7, k: "sunaningyo", g: ["sunaningyo"] },
    ],
    chests: [{ id: "c_kareta1", x: 2, y: 12, gold: 200 }, { id: "c_kareta2", x: 21, y: 6, tool: "hoshiniku" }],
    trigs: [
      { x: 11, y: 6, w: 2, h: 1, when: g => S(g) === 53, run: "c3s6b" },         // 枯れ井戸のそば（川床の道の上）
      { x: 11, y: 2, w: 2, h: 3, when: g => S(g) === 56, run: "c3s9" },          // 帰り道（夕暮れ）
    ],
  };
}
// ---------- 盗賊の岩窟（E4）：ダンジョン。奥の広間にサーシャ ----------
function gankutsu() {
  const W = 19, H = 20, g = grid(W, H, "W");
  fill(g, "_", 8, 14, 3, 6); g[19][9] = "_";                    // 入口
  fill(g, "_", 2, 12, 15, 3);                                   // 横の洞
  fill(g, "_", 2, 3, 3, 9); fill(g, "_", 14, 3, 3, 9);         // 左右の縦穴
  fill(g, "_", 2, 2, 15, 3); fill(g, "_", 8, 5, 3, 3);         // 奥の通路
  g[1][9] = "_"; g[0][9] = "_";
  return {
    id: "gankutsu", nm: "盗賊の岩窟", g, tier: 4, bg: "stone", dark: 1, inside: 1, afterWin: "gankutsuWin",
    objs: [
      { t: "chest2", x: 2, y: 8, text: ["王国の紋の焼き印がある木箱。中は空だ。"] }, { t: "basket", x: 16, y: 13 }, { t: "basket", x: 2, y: 14 },
      { t: "candle", x: 7, y: 14 }, { t: "candle", x: 11, y: 14 }, { t: "candle", x: 8, y: 2 }, { t: "candle", x: 10, y: 2 },
    ],
    exits: [{ x: 9, y: 19, to: "kareta", tx: 18, ty: 9, dir: 0 }, { x: 9, y: 0, to: "gankutsu2", tx: 6, ty: 9, dir: 3 }],
    npcs: [],
    foes: [
      { id: "gk1", x: 9, y: 13, k: "sunaningyo", g: ["sunaningyo", "miira"] },
      { id: "gk2", x: 3, y: 10, k: "miira", g: ["miira", "miira", "tozoku"] },
      { id: "gk3", x: 15, y: 6, k: "tozoku", g: ["tozoku", "tozoku"] },
      { id: "gk4", x: 15, y: 11, k: "koganegai", g: ["koganegai"], once: "kogane1" },
      { id: "gk5", x: 9, y: 6, k: "miira", g: ["miira", "tozoku"] },
    ],
    chests: [{ id: "c_gank1", x: 16, y: 3, item: "knightswd" }, { id: "c_gank2", x: 2, y: 3, tool: "onigiri" }],
    trigs: [],
  };
}
function gankutsu2() { // 岩窟の奥の広間
  const W = 13, H = 11, g = grid(W, H, "W"); fill(g, "_", 1, 1, 11, 9); g[10][6] = "_";
  const after = window.GS && GS.G && (GS.G.flags.s || 0) >= 56;
  return {
    id: "gankutsu2", nm: "岩窟の奥", g, tier: 4, bg: "stone", dark: 1, inside: 1,
    objs: [
      ...(after ? [2, 3] : [2, 3, 4, 8, 9]).map(x => ({ t: "chest2", x, y: 1, text: ["王国の紋の焼き印がある木箱。"] })),
      ...[2, 3, 9, 10].map(x => ({ t: "basket", x, y: 8, text: ["水がめ。たっぷり入っている。"] })),
      { t: "candle", x: 1, y: 4 }, { t: "candle", x: 11, y: 4 },
    ],
    exits: [{ x: 6, y: 10, to: "gankutsu", tx: 9, ty: 1, dir: 0 }],
    npcs: [
      { id: "sasha", x: 6, y: 2, img: "person_055", dir: 0, nm: "サーシャ", when: g => S(g) === 55 || cut(g, "c3s8") },
      { id: "kobunA", x: 4, y: 3, img: "person_010k", dir: 0, nm: "子分", when: g => S(g) === 55 || cut(g, "c3s8") },
      { id: "kobunB", x: 8, y: 3, img: "person_010k", dir: 0, nm: "子分", when: g => S(g) === 55 || cut(g, "c3s8") },
    ],
    foes: [], chests: [],
    trigs: [{ x: 1, y: 6, w: 11, h: 3, when: g => S(g) === 55, run: "c3s8" }],
  };
}
// ---------- 競売館：丸天井の広間。壇上に競り人、二階の桟敷に覆面の人 ----------
function kyobai() {
  const W = 13, H = 11, g = grid(W, H, "w"); fill(g, "p", 1, 1, 11, 9); g[10][6] = "D";
  return {
    id: "kyobai", nm: "ザハラの競売館", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [
      ...[4, 5, 6, 7, 8].map(x => ({ t: "counter", x, y: 2 })), { t: "candleStand", x: 3, y: 1 }, { t: "candleStand", x: 9, y: 1 },
      { t: "column", x: 1, y: 1 }, { t: "column", x: 11, y: 1 }, { t: "veiled", x: 6, y: 1, text: ["布をかけた台座。"] },
      ...[3, 5, 7, 9].map(x => ({ t: "chair", x, y: 5 })), ...[3, 5, 7, 9].map(x => ({ t: "chair", x, y: 7 })),
    ],
    exits: [{ x: 6, y: 10, to: "zahara", tx: 20, ty: 13, dir: 0 }],
    npcs: [
      { id: "seriK", x: 6, y: 3, img: "person_014", dir: 0, nm: "競り人", talk: "kyobaiSeri" },
      { id: "kyakuA", x: 3, y: 6, img: "person_075d", dir: 3, nm: "競売の客", when: g => cut(g, "c3s11") },
      { id: "kyakuB", x: 7, y: 6, img: "person_070p", dir: 3, nm: "競売の客", when: g => cut(g, "c3s11") },
      { id: "kyakuC", x: 9, y: 8, img: "person_078z", dir: 3, nm: "競売の客", when: g => cut(g, "c3s11") },
      { id: "margoK", x: 5, y: 4, img: "person_134", dir: 3, nm: "マルゴ", when: g => cut(g, "c3s11") },
      { id: "fukumen", x: 10, y: 2, img: "person_075m", dir: 0, nm: "覆面の買い手", when: g => cut(g, "c3s11") },
    ],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- ザハラの宿の屋上（夜。砂漠の星） ----------
function zroof() {
  const W = 9, H = 7, g = grid(W, H, "c"); fill(g, "U", 0, 0, W, 1);
  return {
    id: "zroof", nm: "宿の屋上", g, tier: 0, bg: null, inside: 1, music: null,
    objs: [{ t: "basket", x: 1, y: 1 }, { t: "woodpile", x: 7, y: 1 }],
    exits: [], npcs: [{ id: "liseR", x: 4, y: 3, img: "person_002", dir: 0, nm: "" }],
    foes: [], chests: [], trigs: [],
  };
}

// ---------- ふつうの家（物語の出来事のない家は、どれも入れる）----------
// 戸口に入ると、field.js が flags.minka に「どの町の・どの家か」を書いてから、ここへ来る。
// 家ごとの形と住人は、家の場所から決まる（何度入っても同じ家）。台詞は story.js の MINKA_TALK
const MINKA_FOLK = { w: "person_026h", o: "person_071h", g: "person_070h", m: "person_074h", c: "person_022h", inn: "person_014h", books: "person_099h", tea: "person_070t" };
function minka() {
  const d = (root.GS && GS.G && GS.G.flags.minka) || { from: "village", x: 5, y: 8, rx: 5, ry: 9, kind: "home", seed: 1, big: 0 };
  const big = d.big || d.kind !== "home", W = big ? 9 : 7, H = big ? 7 : 6, g = grid(W, H, "w"); fill(g, "p", 1, 1, W - 2, H - 2);
  const dx = Math.floor(W / 2); g[H - 1][dx] = "D";
  const flip = d.seed % 2 === 1, X = x => flip ? W - 1 - x : x; // 家ごとに左右を入れかえる
  const objs = [], npcs = [], who = (k, x, y, dir, nm) => npcs.push({ id: "mk" + npcs.length, x: X(x), y, img: MINKA_FOLK[k], dir, nm, talk: "minkaTalk", role: k });
  const find = (t, x, y) => objs.push({ t, x: X(x), y, talk: "minkaFind" });
  if (d.kind === "inn") {
    [3, 4, 5].forEach(x => objs.push({ t: "counter", x: X(x), y: 2 })); objs.push({ t: "shelf", x: X(1), y: 1 });
    objs.push({ t: "futon", x: X(7), y: 3, w: 1, h: 2 }, { t: "futon", x: X(6), y: 3, w: 1, h: 2 }); find("basket", 1, 5);
    who("inn", 4, 1, 0, "宿の者");
  } else if (d.kind === "books") {
    [1, 2, 6, 7].forEach(x => objs.push({ t: "shelf", x: X(x), y: 1, text: ["古い本がぎっしり並んでいる。背の字は、かすれて読めない。"] }));
    objs.push({ t: "table", x: X(4), y: 3 }); objs.push({ t: "shelf", x: X(1), y: 4, text: ["貸し出し中の札が、いくつも下がっている。"] }); find("basket", 7, 5);
    who("books", 4, 2, 0, "貸本屋");
  } else if (d.kind === "tea") {
    [3, 4, 5].forEach(x => objs.push({ t: "counter", x: X(x), y: 2 })); objs.push({ t: "hearth", x: X(1), y: 0 });
    objs.push({ t: "table", x: X(2), y: 4 }, { t: "table", x: X(6), y: 4 }); find("shelf", 7, 1);
    who("tea", 4, 1, 0, "茶屋の娘");
  } else {
    const roles = ["w", "o", "g", "m"], r = roles[((d.idx || 0) + [...d.from].reduce((a, c) => a + c.charCodeAt(0), 0)) % 4], nm = { w: "おかみさん", o: "じいさん", g: "娘", m: "亭主" }[r];
    objs.push(d.chimney ? { t: "hearth", x: X(1), y: 0 } : { t: "shelf", x: X(1), y: 1 });
    objs.push({ t: "bed", x: X(W - 2), y: 1, w: 1, h: 2 });
    objs.push({ t: "table", x: X(2), y: H - 3 }, { t: "chair", x: X(3), y: H - 3 });
    find(d.seed % 3 === 0 ? "basket" : "shelf", d.seed % 3 === 0 ? 1 : W - 3, d.seed % 3 === 0 ? H - 2 : 1);
    if (big) objs.push({ t: "shelf", x: X(W - 2), y: 4 });
    who(r, dx, 2, 0, nm);
    if (big && (d.idx || 0) % 2 === 0) who("c", W - 3, H - 2, 1, "子ども");
  }
  return {
    id: "minka", nm: d.nm || "民家", g, tier: 0, bg: null, inside: 1, music: "town",
    objs, npcs, foes: [], chests: [], trigs: [],
    exits: [{ x: dx, y: H - 1, to: d.from, tx: d.rx, ty: d.ry, dir: 0 }],
  };
}

root.MINKA_FOLK = MINKA_FOLK;
root.MAPS = { seirena, funasaka, kaizoku, kaizoku2, uchiumi, kareta, gankutsu, gankutsu2, kyobai, zroof, minka, kinsa, zahara, shokan, casino, arena, zinn, tsuya, akamugi, hoshimi, shinjo, nakaniwa, kakurega, yakuba, crypt1, crypt2, kiroku, plain, milna, lux, sakaba, hut, ferry, village, river, sandbar, forest, hermit, shrine, road0, road1, harune, kawauso, toiya, ohashi, tower1, tower2, towerTop };
})(typeof window !== "undefined" ? window : globalThis);
