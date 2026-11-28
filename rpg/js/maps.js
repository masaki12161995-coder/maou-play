// 地図（序章：トルカ村・リム川の渡し・中州・ささやきの森・森の婆の庵・苔むす祠・西街道の入口）
// 地面の文字：.草 =土の道 c石畳 T木 ~水 b桟橋 f柵 p板の床 w壁 D出口 m沼 h畑 y月夜草 R岩 W石の壁 _石の床 （空白）＝何もない
// 人：img＝人物の絵／mon＝魔物の絵。when＝居る条件（g＝遊んでいる記録。g.flags.s＝物語の進み、g.flags.cut＝いま流れている場面）
// 置き物：talk＝調べたときの出来事、text＝調べたときの文。trigs＝そのマスに入ると起きる出来事
(function (root) {
"use strict";
function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function fill(g, ch, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch; }
const S = g => g.flags.s || 0, cut = (g, k) => g.flags.cut === k;
const GS0 = () => (window.GS && GS.G) || null; // 地図を作るときの記録（まだ無いこともある）
// 第8章の庵の前：戻ってきた仲間（ムク・ブラム・ジャコ・ミーファ・主人公のほか）の k 番目
const backMem = (g, k) => (g.roster || []).filter(hi => ![0, 1, 2, 3, 14, 15].includes(hi))[k];
// 町の会話の段階（骨組み0-4）。0＝序章の朝、0.5＝黒外套が来た後、1＝第1章、2＝第2章（第1章の場面10の後から）
const townStage = g => { const s = S(g); return s < 12 ? 0 : s < 14 ? 0.5 : s < 26 ? 1 : s < 60 ? 2 : s < 62 ? 3 : s < 81 ? 4 : s < 96 ? 5 : s < 102 ? 6 : 7; }; // 段階6：第6章の終わり（新しい魔王が立った）から // 段階5：第5章の謁見の間（宰相を捕らえた）から // 段階4：第4章の始まり（ザハラを出た後）から // 段階3：第3章の不戦の約定（聖剣の競り）の後から
root.townStage = townStage;

// ---------- 渡し小屋の中 ----------
function hut() {
  const g = grid(7, 7, "w"); fill(g, "p", 1, 1, 5, 5); g[6][3] = "D";
  return {
    id: "hut", nm: "渡し小屋", g, tier: 0, bg: null, inside: 1, music: "town", noFollow: GS0() && cut(GS0(), "c8s1") ? 1 : 0,
    auto: [{ when: g => S(g) === 102, run: "c8s1" }],   // 第8章：目を覚ますと、渡し小屋
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
      // 第8章 場面1：囲炉裏の向こうのシグ、藁の上で眠るミーファ、戸口のティム
      { id: "sig8", x: 4, y: 3, img: "person_146", dir: 1, nm: "シグ", when: g => cut(g, "c8s1") || cut(g, "c8s1t") },
      { id: "mifa8", x: 1, y: 1, img: "person_011", dir: 4, col: 2, head: 1, nm: "ミーファ", when: g => cut(g, "c8s1") || cut(g, "c8s1t") },
      { id: "tim8", x: 3, y: 5, img: "person_069", dir: 3, nm: "ティム", when: g => cut(g, "c8s1t") },
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
      { t: "newGrave", x: 9, y: 15, text: ["新しい木の墓標。下手な字で「渡し守カイ　川に還る」。", "毎朝、水をやった跡がある。"], when: g => S(g) >= 103 },   // 第8章：ティムが立てたカイの墓標
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
      { id: "timG", x: 8, y: 15, img: "person_069", dir: 2, nm: "ティム", when: g => cut(g, "c8s2c") },
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
    auto: [{ when: g => S(g) === 103, run: "c8s2" }],   // 第8章：幽霊騒ぎ
    objs: [
      { t: "house", x: 3, y: 5, w: 4, h: 3, roof: "red", door: 2, chimney: 1, kind: "dona", nm: "ドナの家" },
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
      { id: "dona", x: 5, y: 9, img: "person_077", dir: 0, nm: "ドナ", talk: "town", when: g => S(g) !== 12 && !cut(g, "c8s2") },
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
      // 第8章 場面2：鍬や棒を持って広場に集まった村人
      { id: "dona8", x: 10, y: 11, img: "person_077", dir: 2, nm: "ドナ", when: g => cut(g, "c8s2") },
      { id: "tim8", x: 9, y: 11, img: "person_069", dir: 2, nm: "ティム", when: g => cut(g, "c8s2") },
      { id: "hop8", x: 8, y: 10, img: "person_071", dir: 2, nm: "ホップ", when: g => cut(g, "c8s2") },
      { id: "martha8", x: 8, y: 12, img: "person_026", dir: 2, nm: "マーサ", when: g => cut(g, "c8s2") },
      { id: "vm8", x: 7, y: 10, img: "person_072", dir: 2, nm: "村人の男", when: g => cut(g, "c8s2") },
      { id: "vw8", x: 7, y: 12, img: "person_070s", dir: 2, nm: "村人の女", when: g => cut(g, "c8s2") },
      { id: "vc8", x: 7, y: 11, img: "person_022k", dir: 2, nm: "村の子", when: g => cut(g, "c8s2") },
      { id: "sig8", x: 13, y: 11, img: "person_146", dir: 1, nm: "シグ", when: g => cut(g, "c8s2") },
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
      { id: "mifa8", x: 5, y: 14, img: "person_011", dir: 2, nm: "ミーファ", when: B("c8s3") },
      { id: "sig8", x: 7, y: 14, img: "person_146", dir: 1, nm: "シグ", when: B("c8s3") },
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
  const kemono = window.GS && GS.G && (GS.G.flags.s || 0) >= 96; if (kemono) path(11, 0, 1, 6);   // 第6章の終わりに、婆が茨を払った（常闇領の影の原へ）
  path(16, 14, 5, 1); open(17, 12, 5, 2);                                  // 庵への道
  path(20, 14, 1, 10);                                                     // 分かれ目から南へ
  open(19, 16, 3, 2);                                                      // 狼の群れがふさぐ所
  open(19, 18, 5, 3); path(20, 18, 1, 3);                                  // 分かれ目（東に祠の門）
  open(12, 23, 11, 3); fill(g, "m", 12, 26, 11, 7); open(12, 25, 11, 1);   // ヌシの沼
  g[25][13] = "y"; g[25][16] = "y"; g[25][21] = "y"; g[24][12] = "y";
  path(20, 23, 1, 2);
  return {
    id: "forest", nm: "ささやきの森", g, tier: GS0() && S(GS0()) >= 107 ? 6 : GS0() && S(GS0()) >= 102 ? 5 : 1, bg: "canopy",   // 第8章からは、森の魔物も手ごわい
    objs: [
      { t: "boat", x: 0, y: 30, w: 3, h: 1, talk: "boat" },
      { t: "kaeri", x: 10, y: 27, talk: "kaeri" },
      { t: "stump", x: 10, y: 14, w: 2, h: 2 },
      { t: "thorns", x: 11, y: 8, talk: "thorns", when: g => S(g) < 96 }, { t: "thorns", x: 11, y: 7, talk: "thorns", when: g => S(g) < 96 },
      { t: "house", x: 18, y: 10, w: 3, h: 2, roof: "green", door: 1, chimney: 1 },
      { t: "shrineGate", x: 22, y: 18, w: 2, h: 2 },
      { t: "woodpile", x: 21, y: 13, when: g => S(g) >= 107 },   // 第8章：庵の裏の薪割り場（シグ）
    ],
    exits: [{ x: 19, y: 11, to: "hermit", tx: 3, ty: 5, dir: 3 }, { x: 22, y: 19, to: "shrine", tx: 6, ty: 26, dir: 3 }, ...(kemono ? [{ x: 11, y: 0, to: "kagenohara", tx: 1, ty: 8, dir: 2 }] : [])],
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
      { id: "dongI", x: 21, y: 13, mon: "monster_130", face: -1, nm: "ドングリ兵", talk: "tt", tp: "hermit", when: g => S(g) >= 7 && S(g) < 107 && !g.flags.cut },
      { id: "dongI8", x: 18, y: 13, mon: "monster_130", face: -1, nm: "ドングリ兵", talk: "tt", tp: "hermit", when: g => S(g) >= 107 && !g.flags.cut },
      // 第8章：薪を割るシグ（庵の夜から。仲間にするまで）
      { id: "sigW", x: 20, y: 13, img: "person_146", dir: 2, nm: "シグ", talk: "sigJoin", when: g => S(g) >= 107 && !(g.roster || []).includes(19) && !g.flags.cut },
      // 第8章 場面4：木の上から飛び降りてきたドングリ兵
      { id: "d8a", x: 7, y: 26, mon: "monster_130", face: 1, nm: "ドングリ兵", when: g => cut(g, "c8s4") },
      { id: "d8b", x: 8, y: 26, mon: "monster_130", face: 1, nm: "ドングリ兵", when: g => cut(g, "c8s4") },
      { id: "d8c", x: 9, y: 26, mon: "monster_130", face: -1, nm: "ドングリ兵", when: g => cut(g, "c8s4") },
      // 第8章 場面5：庵の前のネネと、戸口から出てくる仲間
      { id: "nene8", x: 19, y: 12, img: "person_041", dir: 0, nm: "ネネ", when: g => cut(g, "c8s5") },
      { id: "nene8b", x: 21, y: 12, img: "person_041", dir: 1, nm: "ネネ", when: g => cut(g, "c8s5b") || cut(g, "c8s5c") },
      { id: "muku8", x: 19, y: 13, img: "person_058h", dir: 0, nm: "ムク", when: g => cut(g, "c8s5b") || cut(g, "c8s5c") },
      { id: "bram8", x: 18, y: 12, img: "person_005", dir: 0, nm: "ブラム", when: g => cut(g, "c8s5b") || cut(g, "c8s5c") },
      { id: "jako8", x: 20, y: 12, img: "person_133", dir: 0, nm: "ジャコ", when: g => cut(g, "c8s5b") || cut(g, "c8s5c") },
      { id: "mifa8f", x: 18, y: 14, img: "person_011", dir: 3, nm: "ミーファ", when: g => /^c8s5/.test(g.flags.cut || "") },
      { id: "sig8f", x: 20, y: 15, img: "person_146", dir: 3, nm: "シグ", when: g => /^c8s5/.test(g.flags.cut || "") },
      ...[[17, 13], [21, 13], [16, 14], [17, 14], [17, 12], [21, 14], [16, 13], [20, 16]].map(([x, y], k) => { const hi = GS0() ? backMem(GS0(), k) : null; return hi == null ? null : { id: "back8_" + k, x, y, img: BT.HEROES[hi].img, psc: BT.HEROES[hi].id === "garm" ? 1.3 : 1, dir: 3, nm: BT.HEROES[hi].nm, when: g => cut(g, "c8s5c") }; }).filter(Boolean),
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
      // 第8章から：苔の魔物と夜鳴きの梟も出る
      { id: "w6", x: 9, y: 12, k: "kokedaruma", g: ["kokedaruma", "donguri"], when: g => S(g) >= 102 },
      { id: "w7", x: 13, y: 15, k: "yonaki", g: ["yonaki", "moriookami"], when: g => S(g) >= 102 },
      { id: "w8", x: 8, y: 21, k: "kokedaruma", g: ["kokedaruma", "yonaki"], when: g => S(g) >= 105 },
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
      { x: 16, y: 14, w: 5, h: 1, when: g => S(g) === 105, run: "c8s5" }, { x: 17, y: 12, w: 5, h: 2, when: g => S(g) === 105, run: "c8s5" },
    ],
  };
}

// ---------- 森の婆の庵（W3a） ----------
function hermit() {
  const g = grid(7, 7, "w"); fill(g, "p", 1, 1, 5, 5); g[6][3] = "D";
  return {
    id: "hermit", nm: "森の婆の庵", g, tier: 0, bg: null, inside: 1, noFollow: GS0() && cut(GS0(), "c8s6") ? 1 : 0,
    auto: [{ when: g => S(g) === 106, run: "c8s6" }],   // 第8章：庵の夜
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
      { id: "nene", x: 3, y: 2, img: "person_041", dir: 0, nm: "ネネ", talk: "nene", when: g => !["s11c", "s11d", "s11e"].includes(g.flags.cut) && !(S(g) >= 92 && S(g) < 96) && !g.roster.includes(17) },
      { id: "mukuIn", x: 4, y: 5, img: "person_058", dir: 3, nm: "ムク", when: g => cut(g, "s8") },
      // 町の人の会話（森の婆の庵）：土間のコロモチ。戦わない継ぐ民
      { id: "koroI", x: 1, y: 5, mon: "m_koromochi", face: 1, nm: "庵のコロモチ", talk: "tt", tp: "hermit", when: g => !g.flags.cut },
      // 第8章 場面6・7：庵の夜。卓を囲む（埃をかぶった椅子には誰も座らない）
      { id: "neneN", x: 3, y: 2, img: "person_041", dir: 0, nm: "ネネ", when: g => cut(g, "c8s6") && g.roster.includes(17) },
      { id: "bramN", x: 2, y: 2, img: "person_005", dir: 0, nm: "ブラム", when: g => cut(g, "c8s6") },
      { id: "jakoN", x: 4, y: 2, img: "person_133", dir: 0, nm: "ジャコ", when: g => cut(g, "c8s6") },
      { id: "sigN", x: 5, y: 3, img: "person_146", dir: 1, nm: "シグ", when: g => cut(g, "c8s6") },
      { id: "mifaN", x: 1, y: 3, img: "person_011", dir: 2, nm: "ミーファ", when: g => cut(g, "c8s6") },
      { id: "mukuN", x: 2, y: 4, img: "person_058h", dir: 3, nm: "ムク", when: g => cut(g, "c8s6") },
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
    id: "road1", nm: "西街道", g, tier: GS0() && S(GS0()) >= 102 ? 6 : 2, bg: "meadow",
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
  fill(g, "=", 6, 6, 1, 6);                             // 北の丘への小道（塔の入口の真下まで）
  for (const [x, y] of [[3, 9], [8, 8], [9, 17], [4, 18], [7, 20]]) g[y][x] = "T";
  return {
    id: "ohashi", nm: "ガルム大橋", g, tier: 0, bg: null,
    objs: [
      { t: "towerFar", x: 5, y: 3, w: 2, h: 3 },   // 入口が小道（x=6）の真上に来るように描く
      { t: "plaque", x: 10, y: 11, text: ["ガルム大橋。建国の年、これを架く。", "名の由来は伝わっていない。"] },
      { t: "bigStone", x: 9, y: 15, text: ["切り口がない。割れたのではないらしい。"], when: g => S(g) >= 20 },
      { t: "sign", x: 5, y: 11, text: ["北　古い見張り塔"] },
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
      { id: "garmB", x: 10, y: 11, img: "person_132", dir: 0, psc: 1.5, nm: "ガルム", talk: "garmBridge", card: () => 1, when: g => S(g) >= 28 && !(g.roster || []).includes(13) && !cut(g, "c8s8b") },
      { id: "kogarumu", x: 10, y: 11, img: "person_132", dir: 0, psc: 1, nm: "コガルム", talk: "kogarumu", card: () => 1, when: g => S(g) >= 28 && (g.roster || []).includes(13) && !cut(g, "c8s8b") },  // ガルムの甥（小さめの石の巨人）
      // 第8章 場面8：橋のたもとの臨時の関。番人が、兵と棺の間に座りこむ
      { id: "garm8", x: 10, y: 13, img: "person_132", dir: 1, psc: 1.5, nm: "ガルム", when: g => cut(g, "c8s8b") && !(g.roster || []).includes(13) },
      { id: "kogar8", x: 10, y: 13, img: "person_132", dir: 1, psc: 1, nm: "コガルム", when: g => cut(g, "c8s8b") && (g.roster || []).includes(13) },
      { id: "hei8a", x: 11, y: 12, mon: "monster_010", face: 1, nm: "王国兵", when: g => cut(g, "c8s8") || cut(g, "c8s8b") },
      { id: "hei8b", x: 11, y: 14, mon: "monster_010", face: 1, nm: "王国兵", when: g => cut(g, "c8s8") || cut(g, "c8s8b") },
      { id: "hei8c", x: 12, y: 13, mon: "monster_010", face: 1, nm: "王国兵", when: g => cut(g, "c8s8") || cut(g, "c8s8b") },
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
      { x: 6, y: 6, when: g => S(g) === 20, run: "towerLater" },
      { x: 6, y: 6, when: g => S(g) >= 21, run: "towerIn" },
      { x: 7, y: 12, w: 1, h: 3, when: g => S(g) === 25, run: "c1s10" },
      { x: 21, y: 12, w: 1, h: 3, when: g => S(g) >= 28, run: "tollEast" },
      { x: 7, y: 12, w: 1, h: 3, when: g => S(g) === 107, run: "c8s8" },   // 第8章：葬列が橋のたもとの関へ
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
    exits: [{ x: 6, y: 15, to: "ohashi", tx: 6, ty: 7, dir: 0 }, { x: 10, y: 2, to: "tower2", tx: 2, ty: 17, dir: 3 }],
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
  fill(g, "=", 0, 24, 5, 1); fill(g, "=", 4, 15, 1, 10);                    // 西：南の山道へ（第5章で開く）
  return {
    id: "plain", nm: "中央平原", g, tier: GS0() && S(GS0()) >= 102 ? 6 : 3, bg: "meadow",
    objs: [
      { t: "windmill", x: 33, y: 23, w: 2, h: 3 }, { t: "windmill", x: 36, y: 24, w: 2, h: 3 },
      { t: "kaeri", x: 18, y: 12, talk: "kaeri" },
      { t: "sign", x: 21, y: 13, text: ["北　王都ルクスベル"] }, { t: "sign", x: 32, y: 15, text: ["南　風車の里ミルナ"] }, { t: "sign", x: 37, y: 13, text: ["東　赤麦の丘・東の関所"] },
      { t: "sign", x: 5, y: 23, text: ["道しるべの柱。真新しい貼り紙が二枚。", "王女リゼリアを名乗る偽者あり。見つけ次第、役所へ届け出よ。宰相ヴァルド", "鉄門砦は、軍のほか通行を禁ず。宰相ヴァルド"], when: g => S(g) >= 75 && S(g) < 81 },
      { t: "sign", x: 5, y: 23, text: ["道しるべの柱。「西　南の山道・巡礼の道」", "貼り紙をはがした跡が残っている。"], when: g => S(g) >= 81 },
      { t: "sign", x: 3, y: 13, text: ["高札。「魔王は勇者アスターに討たれ、王国は救われた」", "「魔物の心を拾う者は、魔王の残党と見なす」"], when: g => S(g) >= 107 },   // 第8章：道ばたの高札
    ],
    exits: [{ x: 20, y: 0, to: "lux", tx: 11, ty: 38, dir: 3 }, { x: 31, y: 29, to: "milna", tx: 8, ty: 1, dir: 0 }, { x: 0, y: 24, to: "yamamichi", tx: 12, ty: 10, dir: 1 }],
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
      { x: 20, y: 3, w: 1, h: 1, when: g => S(g) >= 102, run: "luxShut8" },   // 第8章：戴冠まで、王都の門は閉じている
      { x: 0, y: 14, run: "tollWest" },
      { x: 39, y: 14, run: "eastShut" },
      { x: 1, y: 24, w: 4, h: 1, when: g => S(g) === 75, run: "c5s1" }, { x: 20, y: 6, when: g => S(g) === 75, run: "c5s1" },
      { x: 20, y: 3, when: g => S(g) === 76, run: "c5s2" },
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
      { t: "house", x: 1, y: 11, w: 3, h: 2, roof: "green", door: 1, kind: "nel", nm: "ネルの家" },                // ネルの家（粉屋の隣）
      { t: "house", x: 4, y: 2, w: 3, h: 2, roof: "red", door: 1 },                  // 里の外れの木こり小屋
      { t: "woodpile", x: 7, y: 3 }, { t: "woodpile", x: 7, y: 2 },
      { t: "house", x: 13, y: 11, w: 3, h: 2, roof: "blue", door: 1, kind: "inn", nm: "ミルナの宿" },               // 宿
      { t: "sign", x: 12, y: 13, text: ["宿"] },
      { t: "coffinCart", x: 8, y: 12, when: g => cut(g, "c8s10") },   // 第8章：ミーファの棺
    ],
    exits: [{ x: 8, y: 0, to: "plain", tx: 31, ty: 28, dir: 3 }],
    npcs: [
      { id: "morto", x: 6, y: 11, img: "person_019k", dir: 0, nm: "モルト", talk: "morto", card: g => S(g) !== 30 },
      // 町の人（段階2から。台詞は TOWNTALK）
      { id: "hanna", x: 6, y: 4, img: "person_020", dir: 0, nm: "ハンナ", talk: "hanna", when: g => !(g.roster || []).includes(12) },
      { id: "yado", x: 14, y: 14, img: "person_014y", dir: 0, nm: "宿の主人", talk: "milnaInn", when: g => !cut(g, "c8s10") },
      { id: "neru", x: 3, y: 13, img: "person_026n", dir: 1, nm: "ネル", talk: "nel", tp: "milna" },
      { id: "fusha", x: 12, y: 9, img: "person_072", dir: 0, nm: "風車番", talk: "tt", tp: "milna" },
      { id: "sentaku", x: 15, y: 7, img: "person_070s", dir: 2, nm: "洗濯の女", talk: "tt", tp: "milna" },
      { id: "konako", x: 8, y: 13, img: "person_022k", dir: 0, nm: "粉まみれの子", talk: "tt", tp: "milna", when: g => !cut(g, "c8s10") },
      // 第8章 場面10：葬列の一行（ミーファは隣の棺の中）
      { id: "bramM", x: 9, y: 11, img: "person_005", dir: 2, nm: "ブラム", when: g => cut(g, "c8s10") },
      { id: "jakoM", x: 10, y: 12, img: "person_133", dir: 2, nm: "ジャコ", when: g => cut(g, "c8s10") },
      { id: "mukuM", x: 8, y: 13, img: "person_058h", dir: 2, nm: "ムク", when: g => cut(g, "c8s10") },
      { id: "sigM", x: 8, y: 11, img: "person_146", dir: 2, nm: "シグ", when: g => cut(g, "c8s10") },
      // 第8章 場面10：宿の軒下で札を並べるトトと、宿の前の石段の勇者たち
      { id: "toto8", x: 11, y: 13, img: "person_100", dir: 2, nm: "トト", when: g => cut(g, "c8s10") },
      { id: "aster8", x: 14, y: 13, img: "person_013", dir: 1, nm: "アスター", when: g => cut(g, "c8s10") },
      { id: "elma8", x: 13, y: 13, img: "person_089", dir: 1, nm: "エルマ", when: g => cut(g, "c8s10") },
      { id: "rokka8", x: 15, y: 13, img: "person_015", dir: 1, nm: "ロッカ", when: g => cut(g, "c8s10") },
      { id: "vw8", x: 10, y: 14, img: "person_076c", dir: 1, nm: "村の女", when: g => cut(g, "c8s10") },
      { id: "vm8", x: 10, y: 11, img: "person_072", dir: 1, nm: "村の男", when: g => cut(g, "c8s10") },
      // 寄り道の仲間エルマ（第8章の一騎打ちの後から。宿の前の石段）
      { id: "elmaM", x: 13, y: 13, img: "person_089", dir: 0, nm: "エルマ", talk: "elmaJoin", when: g => S(g) >= 109 && !(g.roster || []).includes(20) && !g.flags.cut },
    ],
    foes: [], chests: [],
    trigs: [{ x: 8, y: 2, when: g => S(g) === 30 && !g.flags.milna, run: "c2s2" }, { x: 8, y: 2, when: g => S(g) === 108, run: "c8s10" }],
  };
}
// ---------- ミルナの外れ・風車の丘（第8章の一騎打ちの場面だけ） ----------
function fushaoka() {
  const W = 12, H = 11, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 1); fill(g, "T", 0, H - 1, W, 1); fill(g, "T", 0, 0, 1, H); fill(g, "T", W - 1, 0, 1, H);
  for (const [x, y] of [[1, 1], [10, 1], [1, 9], [10, 9], [2, 1]]) g[y][x] = "T";
  return {
    id: "fushaoka", nm: "風車の丘", g, tier: 0, bg: "meadow", noFollow: 1,
    objs: [{ t: "windmill", x: 5, y: 1, w: 2, h: 3 }],
    exits: [],
    npcs: [
      { id: "asterO", x: 4, y: 6, img: "person_013", dir: 2, nm: "アスター", when: g => cut(g, "c8s11") },
      { id: "asterO2", x: 4, y: 6, img: "person_013", dir: 4, col: 2, nm: "アスター", when: g => cut(g, "c8s11b") },
      { id: "elmaO", x: 2, y: 8, img: "person_089", dir: 3, nm: "エルマ", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "rokkaO", x: 3, y: 9, img: "person_015", dir: 3, nm: "ロッカ", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "mifaO", x: 9, y: 8, img: "person_011", dir: 3, nm: "ミーファ", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "mukuO", x: 8, y: 9, img: "person_058h", dir: 3, nm: "ムク", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "bramO", x: 9, y: 9, img: "person_005", dir: 3, nm: "ブラム", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "jakoO", x: 10, y: 8, img: "person_133", dir: 3, nm: "ジャコ", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "sigO", x: 10, y: 7, img: "person_146", dir: 1, nm: "シグ", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "vmO", x: 1, y: 4, img: "person_072", dir: 2, nm: "村の男", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "vwO", x: 1, y: 5, img: "person_070s", dir: 2, nm: "村の女", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
      { id: "vcO", x: 10, y: 4, img: "person_022k", dir: 1, nm: "粉まみれの子", when: g => cut(g, "c8s11") || cut(g, "c8s11b") },
    ],
    foes: [], chests: [], trigs: [],
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
  const sNow = window.GS && GS.G ? GS.G.flags.s || 0 : 0;
  if (sNow >= 77) { fill(g, "c", 12, 7, 10, 1); }                          // 東の坂：丘の上の宰相の館へ（第5章）
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
      { t: "sign", x: 19, y: 8, text: ["東の坂　宰相の館"], when: g => S(g) >= 77 },
      { t: "wagon", x: 10, y: 31, w: 2, h: 1, when: g => cut(g, "c2s3") },
    ],
    exits: [{ x: 10, y: 39, to: "plain", tx: 20, ty: 1, dir: 0 }, { x: 11, y: 39, to: "plain", tx: 20, ty: 1, dir: 0 },
      { x: W - 1, y: 15, to: "akamugi", tx: 2, ty: 8, dir: 2 }, { x: W - 1, y: 16, to: "akamugi", tx: 2, ty: 8, dir: 2 },
      ...(sNow >= 77 ? [{ x: W - 1, y: 7, to: "yakatagai", tx: 1, ty: 9, dir: 2 }] : [])],
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
      { id: "oodori", x: 14, y: 16, img: "person_022o", dir: 1, nm: "大通りの子", talk: "tt", tp: "lux", when: g => S(g) >= 31 && !g.flags.cut },
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
// ======================================================================
// 第6章：常闇領（影の原・空座城・牙の里と月吠えの谷・翼の高巣と風切りの断崖）
// ======================================================================
const chikai = (g, k) => !!((g.flags.chikai || {})[k]);
const c7walk = () => { const g = window.GS && GS.G; if (!g) return 0; const s = g.flags.s || 0, c = g.flags.cut; return s === 97 || c === "c7s4" || c === "c7s1" ? 1 : 0; }; // 第7章：城の中で仲間が人として立っている間は、後ろをついて歩かない
// ---------- 影の原：昼でも薄暗い。影絵のような木、青く光る茸。真ん中の十字の道から四方へ ----------
function kagenohara() {
  const W = 28, H = 24, g = grid(W, H, "L");
  fill(g, "O", 0, 0, W, 1); fill(g, "O", 0, H - 1, W, 1); fill(g, "O", 0, 0, 1, H); fill(g, "O", W - 1, 0, 1, H);
  fill(g, "l", 13, 0, 2, H); fill(g, "l", 0, 11, W, 1); fill(g, "l", 0, 19, 13, 1); fill(g, "l", 15, 19, 13, 1);
  for (const [x, y, w, h] of [[3, 3, 3, 3], [20, 2, 4, 3], [8, 14, 2, 3], [19, 14, 3, 2], [3, 21, 4, 1], [22, 21, 3, 1], [9, 4, 2, 2], [17, 7, 2, 2]]) fill(g, "O", x, y, w, h);
  for (const [x, y, w, h] of [[6, 7, 2, 2], [23, 8, 2, 2], [4, 15, 2, 2], [24, 15, 1, 2], [10, 21, 1, 1]]) fill(g, "P", x, y, w, h);
  if (sNow() >= 96) { fill(g, "l", 0, 8, 6, 1); fill(g, "l", 5, 8, 1, 3); }   // 獣道（ささやきの森へ。第6章の終わりに開く）
  return {
    id: "kagenohara", nm: "影の原", g, tier: 7, bg: "shade", shade: 1, nanori: 1,
    objs: [
      ...[[2, 9], [11, 7], [16, 4], [25, 5], [7, 18], [18, 17], [21, 10], [1, 14], [11, 16]].map(([x, y]) => ({ t: "glowShroom", x, y })),
      { t: "sign", x: 15, y: 12, text: ["北　空座城　／　西　牙の里　／　東　翼の高巣", "南西　鱗の沼　／　南東　角の石舞台"] },
      { t: "sign", x: 2, y: 7, text: ["獣道　この先、ささやきの森"], when: g => S(g) >= 96 },
    ],
    exits: [{ x: 13, y: H - 1, to: "itadaki", tx: 6, ty: 1, dir: 0 }, { x: 14, y: H - 1, to: "itadaki", tx: 7, ty: 1, dir: 0 },
      { x: 13, y: 0, to: "kuuza", tx: 7, ty: 16, dir: 3 }, { x: 14, y: 0, to: "kuuza", tx: 7, ty: 16, dir: 3 },
      { x: 0, y: 11, to: "kiba", tx: 16, ty: 8, dir: 1 }, { x: W - 1, y: 11, to: "tsubasa", tx: 1, ty: 12, dir: 2 },
      { x: 0, y: 19, to: "uroko", tx: 16, ty: 8, dir: 1 }, { x: W - 1, y: 19, to: "tsuno", tx: 1, ty: 8, dir: 2 },
      ...(sNow() >= 96 ? [{ x: 0, y: 8, to: "forest", tx: 11, ty: 1, dir: 0 }] : [])],
    npcs: [
      ...[["fergaH", 11, 13, "person_086"], ["daraH", 16, 13, "person_062"], ["gouraH", 11, 15, "person_122"]].map(([id, x, y, img]) => ({ id, x, y, img, dir: 3, nm: { fergaH: "フェルガ", daraH: "ダーラ", gouraH: "ゴウラ" }[id], when: g => cut(g, "c7s5") })),
      { id: "shuriH", x: 16, y: 15, mon: "m_shuri", face: -1, nm: "シュリ", when: g => cut(g, "c7s5") },
      { id: "totoH", x: 15, y: 20, img: "person_100", dir: 1, nm: "トト", when: g => cut(g, "c7s5") && g.flags.c7toto },
    ],
    foes: [
      { id: "kg1", x: 13, y: 17, k: "kageboushi", g: ["kageboushi", "yakou", "kageboushi"] },
      { id: "kg2", x: 5, y: 11, k: "kagee", g: ["kagee", "yamibotaru"] },
      { id: "kg3", x: 22, y: 11, k: "yamibotaru", g: ["yamibotaru", "yamibotaru", "kageboushi"] },
      { id: "kg4", x: 13, y: 5, k: "kagee", g: ["kagee", "kagee", "yakou"] },
      { id: "kg5", x: 6, y: 19, k: "yakou", g: ["yakou", "yakou", "kageboushi"] },
      { id: "kg6", x: 21, y: 19, k: "kagee", g: ["kagee", "yamibotaru", "kagee"] },
    ],
    chests: [{ id: "c_kage1", x: 2, y: 2, gold: 600 }, { id: "c_kage2", x: 25, y: 22, tool: "book2" }],
    trigs: [
      { x: 13, y: 21, w: 2, h: 1, when: g => S(g) === 90, run: "c6s1" }, { x: 13, y: 14, w: 2, h: 1, when: g => S(g) === 100, run: "c7s5" },
    ],
  };
}
// ---------- 空座城（門と広間）：黒い石の城。門は開いたまま。厚い埃 ----------
function kuuza() {
  const W = 15, H = 18, g = grid(W, H, "W");
  fill(g, "d", 1, 2, 13, 9); fill(g, "d", 5, 11, 5, 7); fill(g, "L", 1, 12, 4, 6); fill(g, "L", 10, 12, 4, 6); fill(g, "d", 1, 12, 13, 1);
  g[1][7] = "D";
  return {
    id: "kuuza", nm: "空座城", g, tier: 0, bg: null, inside: 1, shade: 1, noFollow: c7walk(),
    objs: [
      ...[3, 6, 9].map(y => ({ t: "column", x: 3, y })), ...[3, 6, 9].map(y => ({ t: "column", x: 11, y })),
      { t: "tornBanner", x: 5, y: 1, text: ["破れた旗。色あせて、紋が読めない。"] }, { t: "tornBanner", x: 9, y: 1, text: ["破れた旗。色あせて、紋が読めない。"] },
      { t: "glowShroom", x: 2, y: 14 }, { t: "glowShroom", x: 12, y: 15 },
    ],
    exits: [{ x: 7, y: H - 1, to: "kagenohara", tx: 13, ty: 1, dir: 0 }, { x: 7, y: 1, to: "gyokuza", tx: 6, ty: 10, dir: 3 }],
    npcs: [
      { id: "orgoK", x: 7, y: 5, mon: "monster_005", face: 1, nm: "オルゴ", when: g => cut(g, "c6s2") && g.flags.c6orgo },
      { id: "tsukaiA", x: 5, y: 8, mon: "m_tsunoko", face: 1, nm: "城の使い走り", talk: "tt", tp: "kuuza", when: g => S(g) >= 96 },
      { id: "tsukaiB", x: 9, y: 8, mon: "monster_132", face: -1, nm: "城の使い走り", talk: "tt", tp: "kuuza", tw: "城の使い走り", when: g => S(g) >= 96 },
      { id: "liseK", x: 7, y: 16, img: "person_002", dir: 0, nm: "リゼット", when: g => cut(g, "c6s12") && g.flags.c6liseOut },
      // 第7章・場面2：城の中の仲間（話しかけると、場面3へ）
      { id: "muku7", x: 3, y: 14, img: "person_058h", dir: 2, nm: "ムク", talk: "c7muku", when: g => S(g) === 97 },
      { id: "kodomo7a", x: 2, y: 15, mon: "m_tsunoko", face: 1, nm: "小鬼", when: g => S(g) === 97 },
      { id: "kodomo7b", x: 4, y: 15, mon: "m_tsunoko", face: -1, nm: "小鬼", when: g => S(g) === 97 },
      { id: "bram7", x: 11, y: 13, img: "person_005", dir: 0, nm: "ブラム", talk: "c7bram", when: g => S(g) === 97 },
      { id: "jako7", x: 5, y: 6, img: "person_133", dir: 2, nm: "ジャコ", talk: "c7jako", when: g => S(g) === 97 },
      { id: "saikoro7", x: 6, y: 6, mon: "m_kibasen", face: -1, nm: "継ぐ民", when: g => S(g) === 97 },
      // 第7章・場面3：城門の先遣隊
      { id: "gerd7", x: 7, y: 15, img: "person_088", dir: 3, nm: "ゲルト", when: g => cut(g, "c7s3b") },
      { id: "sen7a", x: 6, y: 16, mon: "monster_070", face: 1, nm: "先遣隊の兵", when: g => cut(g, "c7s3b") },
      { id: "sen7b", x: 8, y: 16, mon: "monster_010", face: -1, nm: "先遣隊の兵", when: g => cut(g, "c7s3b") },
      { id: "ferga7", x: 8, y: 13, img: "person_086", dir: 2, nm: "フェルガ", when: g => cut(g, "c7s3b") && g.flags.c7gerdWin },
    ],
    foes: [], chests: [],
    trigs: [{ x: 5, y: 15, w: 5, h: 1, when: g => S(g) === 91, run: "c6s2" }],
  };
}
// ---------- 空座城・玉座の間：段の上に黒い石の玉座。厚く積もった埃 ----------
function gyokuza() {
  const W = 13, H = 12, g = grid(W, H, "W"); fill(g, "d", 1, 1, 11, 10); g[H - 1][6] = "d"; g[3][W - 1] = "D";
  return {
    id: "gyokuza", nm: "玉座の間", g, tier: 0, bg: null, inside: 1, shade: 1, noFollow: c7walk(),
    objs: [
      { t: "blackThrone", x: 6, y: 1, text: ["黒い石の玉座。埃が厚く積もっている。"] },
      { t: "tornBanner", x: 3, y: 1 }, { t: "tornBanner", x: 9, y: 1 },
      ...[4, 7].map(y => ({ t: "column", x: 2, y })), ...[4, 7].map(y => ({ t: "column", x: 10, y })),
    ],
    exits: [{ x: 6, y: H - 1, to: "kuuza", tx: 7, ty: 2, dir: 0 }],
    npcs: [
      { id: "totoG", x: 6, y: 3, img: "person_100", dir: 3, nm: "トト", when: g => cut(g, "c6s3") && !g.flags.c6totoOut },
      { id: "orgoG", x: 9, y: 9, mon: "monster_005", face: -1, nm: "オルゴ", talk: "orgo", card: g => S(g) >= 96, when: g => S(g) >= 92 && !cut(g, "c6s11") && !/^c7s[134]$/.test(g.flags.cut || "") },
      { id: "orgoC", x: 9, y: 3, mon: "monster_005", face: -1, nm: "オルゴ", when: g => cut(g, "c6s11") },
      { id: "neneG", x: 6, y: 7, img: "person_041", dir: 0, nm: "ネネ", when: g => cut(g, "c6s3") && g.flags.c6nene },
      { id: "kitanoko", x: 5, y: 7, img: "person_040", dir: 0, nm: "北の子", when: g => cut(g, "c6s3") && g.flags.c6nene },
      { id: "moriA", x: 8, y: 7, mon: "m_ookami", face: -1, nm: "森の継ぐ民", when: g => cut(g, "c6s3") && g.flags.c6nene },
      { id: "moriB", x: 4, y: 7, mon: "monster_132", face: 1, nm: "森の継ぐ民", when: g => cut(g, "c6s3") && g.flags.c6nene },
      // 場面11　戴冠：四人の長と四氏族の者、柱にもたれたネネ、隅のトト
      ...[["fergaC", 4, 4, "person_086", "フェルガ"], ["daraC", 5, 4, "person_062", "ダーラ"], ["gouraC", 7, 4, "person_122", "ゴウラ"]].map(([id, x, y, img, nm]) => ({ id, x, y, img, dir: 3, nm, when: g => cut(g, "c6s11") })),
      { id: "shuriC", x: 8, y: 4, mon: "m_shuri", face: -1, nm: "シュリ", when: g => cut(g, "c6s11") },
      ...[["k1", 3, 6, "m_kibasen"], ["k2", 9, 6, "monster_090"], ["k3", 4, 8, "m_numayamori"], ["k4", 8, 8, "m_tsunoko"], ["k5", 3, 9, "m_tsukihoe"], ["k6", 9, 9, "m_otama"]].map(([id, x, y, mon]) => ({ id, x, y, mon, face: x < 6 ? 1 : -1, nm: "四氏族の者", when: g => cut(g, "c6s11") })),
      { id: "neneC", x: 11, y: 5, img: "person_041", dir: 1, nm: "ネネ", when: g => cut(g, "c6s11") },
      { id: "totoC", x: 1, y: 10, img: "person_100", dir: 2, nm: "トト", when: g => cut(g, "c6s11") && !g.flags.c6toto2 },
      // 第7章：場面1（奏上）・場面3（鷹兵の知らせ）・場面4（勇者一行を迎える）
      { id: "orgo7", x: 7, y: 3, mon: "monster_005", face: -1, nm: "オルゴ", when: g => cut(g, "c7s1") || cut(g, "c7s3") },
      { id: "takahei7", x: 6, y: 5, mon: "monster_090", face: 1, nm: "風切り鷹兵", when: g => cut(g, "c7s3") },
      ...[["mukuG", 4, 4, "person_058h", "ムク"], ["bramG", 5, 4, "person_005", "ブラム"], ["jakoG", 7, 4, "person_133", "ジャコ"], ["mifaG", 8, 4, "person_011", "ミーファ"]].map(([id, x, y, img, nm]) => ({ id, x, y, img, dir: 3, nm, when: g => cut(g, "c7s4") || cut(g, "c7s3") })),
      { id: "orgo7d", x: 9, y: 9, mon: "monster_005", face: -1, nm: "オルゴ", when: g => cut(g, "c7s4") },
      { id: "asterG", x: 6, y: 7, img: "person_013", dir: 3, nm: "アスター", when: g => cut(g, "c7s4") && g.flags.c7aster },
      { id: "elmaG", x: 5, y: 8, img: "person_089", dir: 3, nm: "エルマ", when: g => cut(g, "c7s4") && g.flags.c7aster },
      { id: "rokkaG", x: 7, y: 8, img: "person_015", dir: 3, nm: "ロッカ", when: g => cut(g, "c7s4") && g.flags.c7aster },
      { id: "heiG1", x: 4, y: 9, mon: "monster_070", face: 1, nm: "兵", when: g => cut(g, "c7s4") && g.flags.c7aster },
      { id: "heiG2", x: 8, y: 9, mon: "monster_070", face: -1, nm: "兵", when: g => cut(g, "c7s4") && g.flags.c7aster },
    ],
    foes: [], chests: [],
    trigs: [{ x: 5, y: 9, w: 3, h: 1, when: g => S(g) === 92, run: "c6s3" }, { x: 5, y: 9, w: 3, h: 1, when: g => S(g) === 94, run: "c6s11" }, { x: 5, y: 2, w: 3, h: 1, when: g => S(g) === 96, run: "c7s1" }],
  };
}
// ---------- 空座城の厨（夜）と城壁 ----------
function kuriya() {
  const W = 9, H = 7, g = grid(W, H, "W"); fill(g, "d", 1, 1, 7, 5); g[H - 1][4] = "d";
  const night = window.GS && GS.G && GS.G.flags.cut === "c6s6";
  return {
    id: "kuriya", nm: "城の厨", g, tier: 0, bg: null, inside: 1, shade: 1, noLeader: night, noFollow: night || c7walk(),
    objs: [{ t: "hearth", x: 4, y: 0 }, { t: "table", x: 2, y: 3 }, { t: "basket", x: 7, y: 1 }, { t: "shelf", x: 1, y: 1 }],
    exits: [{ x: 4, y: H - 1, to: "gyokuza", tx: 11, ty: 3, dir: 1 }],
    npcs: [
      { id: "neneK", x: 4, y: 2, img: "person_041", dir: 0, nm: "ネネ", talk: "neneK", when: g => (S(g) >= 93 && S(g) < 96) || cut(g, "c6s6") },
      { id: "mifaK", x: 2, y: 4, img: "person_011", dir: 2, nm: "ミーファ", talk: "c7mifa", when: g => cut(g, "c6s6") || S(g) === 97 },
      { id: "ko7", x: 3, y: 4, mon: "m_otama", face: -1, nm: "継ぐ民の子", when: g => S(g) === 97 },
    ],
    foes: [], chests: [], trigs: [],
  };
}
function jouheki() {
  const W = 11, H = 5, g = grid(W, H, "W"); fill(g, "d", 1, 1, 9, 3);
  return {
    id: "jouheki", nm: (window.GS && GS.G && GS.G.flags.cut === "c6s12b") ? "城の見張り台" : "城壁の上", g, tier: 0, bg: null, inside: 1, shade: 1, noFollow: 1,
    objs: [...[1, 3, 5, 7, 9].map(x => ({ t: "glowShroom", x, y: 3 }))],
    exits: [], npcs: [{ id: "mukuJ", x: 6, y: 2, img: "person_058h", dir: 1, nm: "ムク", when: g => cut(g, "c6s6b") }, { id: "jakoJ", x: 7, y: 2, img: "person_133", dir: 3, nm: "ジャコ", when: g => cut(g, "c6s12b") }],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- 鱗の沼：霧の沼。泥の上に杭の家。沼の真ん中の苔むした大岩（鱗の長ダーラ） ----------
function uroko() {
  const W = 18, H = 16, g = grid(W, H, "L");
  fill(g, "O", 0, 0, W, 1); fill(g, "O", 0, H - 1, W, 1); fill(g, "O", 0, 0, 1, H); fill(g, "O", W - 1, 0, 1, 8); fill(g, "O", W - 1, 9, 1, 7);
  fill(g, "m", 2, 4, 5, 4); fill(g, "m", 10, 2, 5, 3); fill(g, "m", 6, 9, 6, 3); fill(g, "m", 13, 12, 3, 2);
  fill(g, "l", 3, 0, 2, 4); fill(g, "l", 3, 8, 15, 1); fill(g, "l", 8, 4, 1, 4); fill(g, "l", 3, 3, 1, 6);
  g[0][3] = "l"; g[0][4] = "l";
  return {
    id: "uroko", nm: "鱗の沼", g, tier: 0, bg: null, music: "town", shade: 1,
    objs: [
      { t: "house", x: 13, y: 5, w: 3, h: 2, roof: "green", door: 1 }, { t: "house", x: 10, y: 12, w: 3, h: 2, roof: "brown", door: 1 },
      { t: "bigStone", x: 8, y: 3, text: ["苔むした大岩。…よく見ると、まぶたがある。"], when: g => !cut(g, "c6s9") && S(g) < 96 },
      { t: "sign", x: 5, y: 1, text: ["底なしの泥宮"] }, { t: "glowShroom", x: 1, y: 12 }, { t: "glowShroom", x: 16, y: 3 },
    ],
    exits: [{ x: W - 1, y: 8, to: "kagenohara", tx: 1, ty: 19, dir: 2 }, { x: 3, y: 0, to: "doromiya", tx: 5, ty: 20, dir: 3 }, { x: 4, y: 0, to: "doromiya", tx: 6, ty: 20, dir: 3 }],
    npcs: [
      { id: "daraU", x: 8, y: 3, img: "person_062", dir: 0, nm: "ダーラ", talk: "tt", tp: "uroko", when: g => cut(g, "c6s9") || S(g) >= 96 },
      { id: "mondou", x: 15, y: 9, mon: "m_mondou", face: -1, nm: "問答好きの蛙", talk: "tt", tp: "uroko" },
      { id: "watashi", x: 5, y: 9, mon: "m_watashigame", face: 1, nm: "沼の渡し亀", talk: "tt", tp: "uroko" },
      { id: "otama", x: 9, y: 7, mon: "m_otama", face: 1, nm: "おたまの子", talk: "tt", tp: "uroko" },
      { id: "doro", x: 12, y: 7, mon: "m_doro", face: -1, nm: "ドロ", talk: "doro", card: () => 1 },
    ],
    foes: [], chests: [],
    trigs: [{ x: 15, y: 8, w: 2, h: 1, when: g => S(g) >= 93 && !g.flags.c6urokoIn, run: "c6s9a" }],
  };
}
// ---------- 底なしの泥宮（鱗の試練）：泥の迷い道。最奥の泥の広間 ----------
function doromiya() {
  const W = 12, H = 22, g = grid(W, H, "W");
  fill(g, "_", 5, 16, 2, 6); fill(g, "_", 2, 15, 8, 2); fill(g, "_", 2, 10, 2, 6); fill(g, "_", 8, 10, 2, 6); fill(g, "_", 2, 9, 8, 2); fill(g, "_", 5, 6, 2, 4); fill(g, "_", 2, 1, 8, 6);
  fill(g, "m", 4, 11, 4, 4); fill(g, "m", 3, 3, 2, 2); fill(g, "m", 7, 3, 2, 2);
  return {
    id: "doromiya", nm: "底なしの泥宮", g, tier: 7, bg: "shade", inside: 1, shade: 1, nanori: 1, dark: 1,
    objs: [{ t: "glowShroom", x: 2, y: 1 }, { t: "glowShroom", x: 9, y: 1 }],
    exits: [{ x: 5, y: H - 1, to: "uroko", tx: 3, ty: 1, dir: 0 }, { x: 6, y: H - 1, to: "uroko", tx: 4, ty: 1, dir: 0 }],
    npcs: [{ id: "daraD", x: 6, y: 2, img: "person_062", dir: 0, nm: "ダーラ", when: g => S(g) >= 93 && !chikai(g, "uroko") }],
    foes: [
      { id: "dm1", x: 5, y: 15, k: "numayamori", g: ["numayamori", "dokuhebi"] },
      { id: "dm2", x: 2, y: 12, k: "dorogame", g: ["numayamori", "dorogame", "dokuhebi"] },
      { id: "dm3", x: 9, y: 12, k: "dokuhebi", g: ["dokuhebi", "dokuhebi", "numayamori"] },
      { id: "dm4", x: 6, y: 8, k: "dorogame", g: ["dorogame", "numayamori"] },
    ],
    chests: [{ id: "c_doro1", x: 9, y: 15, gold: 800 }, { id: "c_doro2", x: 2, y: 9, tool: "book2" }],
    trigs: [{ x: 2, y: 5, w: 8, h: 1, when: g => S(g) >= 93 && !chikai(g, "uroko"), run: "c6s9b" }],
  };
}
// ---------- 角の石舞台：岩山をくりぬいた円い舞台。太鼓。角のある者たちが酒を飲み、相撲を取っている ----------
function tsuno() {
  const W = 18, H = 16, g = grid(W, H, "L");
  fill(g, "P", 0, 0, W, 2); fill(g, "P", 0, H - 2, W, 2); fill(g, "P", 0, 0, 1, 8); fill(g, "P", 0, 9, 1, 7); fill(g, "P", W - 1, 0, 1, H);
  fill(g, "l", 0, 8, 8, 1); fill(g, "l", 8, 0, 2, 4); g[0][8] = "l"; g[0][9] = "l"; g[1][8] = "l"; g[1][9] = "l";
  return {
    id: "tsuno", nm: "角の石舞台", g, tier: 0, bg: null, music: "town", shade: 1,
    objs: [
      { t: "dohyo", x: 7, y: 5, w: 3, h: 3 },
      { t: "drum", x: 11, y: 5 }, { t: "drum", x: 11, y: 7 },
      { t: "house", x: 13, y: 2, w: 3, h: 2, roof: "red", door: 1, nm: "角の婆の小屋" },
      { t: "campfire", x: 4, y: 11 }, { t: "sign", x: 10, y: 3, text: ["百段の土俵　この上"] },
    ],
    exits: [{ x: 0, y: 8, to: "kagenohara", tx: 26, ty: 19, dir: 1 }, { x: 8, y: 0, to: "hyakudan", tx: 4, ty: 24, dir: 3 }, { x: 9, y: 0, to: "hyakudan", tx: 5, ty: 24, dir: 3 }],
    npcs: [
      { id: "gouraT", x: 8, y: 6, img: "person_122", dir: 0, nm: "ゴウラ", talk: "tt", tp: "tsuno", when: g => cut(g, "c6s10") || S(g) >= 96 },
      { id: "donta", x: 12, y: 6, mon: "m_donta", face: -1, nm: "ドン太", talk: "donta", card: () => 1 },
      { id: "dohyouoniT", x: 5, y: 7, mon: "monster_091", face: 1, nm: "土俵鬼", talk: "tt", tp: "tsuno" },
      { id: "tsunobaba", x: 14, y: 4, img: "person_068b", dir: 0, nm: "角の婆", talk: "tt", tp: "tsuno" },
      { id: "tsunoko", x: 10, y: 11, mon: "m_tsunoko", face: -1, nm: "角の子", talk: "tt", tp: "tsuno" },
    ],
    foes: [], chests: [],
    trigs: [{ x: 1, y: 8, w: 2, h: 1, when: g => S(g) >= 93 && !g.flags.c6tsunoIn, run: "c6s10a" }],
  };
}
// ---------- 百段の土俵（角の試練）：段ごとに相手が待つ勝ち抜き。てっぺんの土俵でゴウラが取る ----------
function hyakudan() {
  const W = 10, H = 26, g = grid(W, H, "P");
  fill(g, "d", 4, 5, 2, 21); fill(g, "d", 2, 1, 6, 5);
  for (const y of [21, 17, 13, 9]) g[y][4] = g[y][5] = "S";
  return {
    id: "hyakudan", nm: "百段の土俵", g, tier: 7, bg: "shade", shade: 1, nanori: 1,
    objs: [{ t: "dohyo", x: 3, y: 1, w: 3, h: 3, walk: 1 }, { t: "drum", x: 2, y: 4 }, { t: "drum", x: 7, y: 4 }],
    exits: [{ x: 4, y: H - 1, to: "tsuno", tx: 8, ty: 1, dir: 0 }, { x: 5, y: H - 1, to: "tsuno", tx: 9, ty: 1, dir: 0 }],
    npcs: [{ id: "gouraH", x: 4, y: 2, img: "person_122", dir: 0, nm: "ゴウラ", when: g => S(g) >= 93 && !chikai(g, "tsuno") }],
    foes: [
      { id: "hd1", x: 4, y: 19, k: "kodaiko", g: ["kodaiko", "kodaiko"] },
      { id: "hd2", x: 5, y: 15, k: "dohyouoni", g: ["dohyouoni", "kodaiko"] },
      { id: "hd3", x: 4, y: 11, k: "kodaiko", g: ["kodaiko", "dohyouoni", "kodaiko"] },
      { id: "hd4", x: 5, y: 7, k: "dohyouoni", g: ["dohyouoni", "dohyouoni"] },
    ],
    chests: [], trigs: [{ x: 2, y: 5, w: 6, h: 1, when: g => S(g) >= 93 && !chikai(g, "tsuno"), run: "c6s10b" }],
  };
}

// ---------- 牙の里：切り立った谷の入口。骨と毛皮の天幕。遠吠え ----------
function kiba() {
  const W = 18, H = 16, g = grid(W, H, "L");
  fill(g, "P", 0, 0, W, 1); fill(g, "P", 0, H - 1, W, 1); fill(g, "P", 0, 0, 1, H); fill(g, "P", W - 1, 0, 1, 8); fill(g, "P", W - 1, 9, 1, 7);
  fill(g, "P", 1, 0, 6, 2); fill(g, "P", 11, 0, 6, 2); g[0][8] = "l"; g[0][9] = "l";
  fill(g, "l", 8, 0, 2, 9); fill(g, "l", 9, 8, 9, 1);
  return {
    id: "kiba", nm: "牙の里", g, tier: 0, bg: null, music: "town", shade: 1,
    objs: [
      { t: "furTent", x: 3, y: 3, w: 2, h: 2 }, { t: "furTent", x: 12, y: 3, w: 2, h: 2 }, { t: "furTent", x: 3, y: 10, w: 2, h: 2 }, { t: "furTent", x: 12, y: 11, w: 2, h: 2 },
      { t: "campfire", x: 6, y: 8 }, { t: "bigStone", x: 8, y: 3, text: ["長の岩。爪のあとが、いくつも刻まれている。"] },
      { t: "glowShroom", x: 15, y: 13 }, { t: "glowShroom", x: 1, y: 13 },
    ],
    exits: [{ x: W - 1, y: 8, to: "kagenohara", tx: 1, ty: 11, dir: 2 }, { x: 8, y: 0, to: "tsukihoe", tx: 5, ty: 20, dir: 3 }, { x: 9, y: 0, to: "tsukihoe", tx: 6, ty: 20, dir: 3 }],
    npcs: [
      { id: "kibasenN", x: 15, y: 7, mon: "m_kibasen", face: 1, nm: "キバ戦士", talk: "tt", tp: "kiba" },
      { id: "korou", x: 6, y: 7, mon: "monster_054", face: 1, nm: "牙の古老", talk: "tt", tp: "kiba" },
      { id: "kibako", x: 11, y: 9, mon: "m_ookami", face: -1, nm: "牙の子", talk: "tt", tp: "kiba" },
      { id: "rolo", x: 14, y: 11, mon: "m_rolo", face: 1, nm: "ロロ", talk: "rolo", card: () => 1 },
      { id: "fergaK", x: 8, y: 2, img: "person_086", dir: 0, nm: "フェルガ", talk: "tt", tp: "kiba", when: g => cut(g, "c6s7") || S(g) >= 96 },
    ],
    foes: [], chests: [],
    trigs: [{ x: 14, y: 8, w: 2, h: 1, when: g => S(g) >= 93 && !g.flags.c6kibaIn, run: "c6s7a" }],
  };
}
// ---------- 月吠えの谷（牙の試練）：切り立った谷を登る。頂に満月のような白い岩 ----------
function tsukihoe() {
  const W = 12, H = 22, g = grid(W, H, "P");
  fill(g, "L", 5, 17, 2, 5); fill(g, "L", 2, 15, 5, 2); fill(g, "L", 2, 10, 2, 6); fill(g, "L", 2, 9, 7, 2); fill(g, "L", 7, 5, 2, 5); fill(g, "L", 3, 3, 6, 3); fill(g, "L", 9, 13, 2, 3); fill(g, "L", 6, 13, 3, 1);
  return {
    id: "tsukihoe", nm: "月吠えの谷", g, tier: 7, bg: "shade", shade: 1, nanori: 1,
    objs: [{ t: "bigStone", x: 5, y: 2, text: ["満月のような、白い大岩。"] }, { t: "glowShroom", x: 10, y: 14 }],
    exits: [{ x: 5, y: H - 1, to: "kiba", tx: 8, ty: 1, dir: 0 }, { x: 6, y: H - 1, to: "kiba", tx: 9, ty: 1, dir: 0 }],
    npcs: [{ id: "fergaT", x: 6, y: 3, img: "person_086", dir: 0, nm: "フェルガ", when: g => S(g) >= 93 && !chikai(g, "kiba") }],
    foes: [
      { id: "tk1", x: 5, y: 16, k: "kibasen", g: ["kibasen", "tsukihoe"] },
      { id: "tk2", x: 2, y: 12, k: "tsukihoe", g: ["tsukihoe", "tsukihoe", "kibasen"] },
      { id: "tk3", x: 7, y: 8, k: "kibasen", g: ["kibasen", "kibasen", "tsukihoe"] },
    ],
    chests: [{ id: "c_tsukihoe1", x: 10, y: 13, gold: 700 }],
    trigs: [{ x: 3, y: 5, w: 6, h: 1, when: g => S(g) >= 93 && !chikai(g, "kiba"), run: "c6s7b" }],
  };
}
// ---------- 翼の高巣：天を突く岩の塔。巣のような家々。風 ----------
function tsubasa() {
  const W = 16, H = 18, g = grid(W, H, "L");
  fill(g, "P", 0, 0, W, 1); fill(g, "P", 0, H - 1, W, 1); fill(g, "P", 0, 0, 1, 12); fill(g, "P", 0, 13, 1, 5); fill(g, "P", W - 1, 0, 1, H);
  fill(g, "P", 1, 0, 6, 2); fill(g, "P", 9, 0, 6, 2); g[0][7] = "l"; g[0][8] = "l";
  fill(g, "l", 7, 0, 2, 13); fill(g, "l", 0, 12, 9, 1);
  for (const [x, y, w, h] of [[2, 3, 2, 3], [12, 6, 2, 3], [3, 14, 3, 2], [11, 14, 3, 2]]) fill(g, "P", x, y, w, h);
  return {
    id: "tsubasa", nm: "翼の高巣", g, tier: 0, bg: null, music: "town", shade: 1,
    objs: [
      ...[[4, 7], [10, 4], [12, 10], [3, 10], [10, 12]].map(([x, y]) => ({ t: "nest", x, y })),
      { t: "windStone", x: 6, y: 4, text: ["風の刻みのある石柱。翼の民の高さを測るらしい。"] }, { t: "windStone", x: 9, y: 8 },
    ],
    exits: [{ x: 0, y: 12, to: "kagenohara", tx: 26, ty: 11, dir: 1 }, { x: 7, y: 0, to: "kazakiri", tx: 5, ty: 22, dir: 3 }, { x: 8, y: 0, to: "kazakiri", tx: 6, ty: 22, dir: 3 }],
    npcs: [
      { id: "takaheiN", x: 2, y: 11, mon: "monster_090", face: 1, nm: "風切り鷹兵", talk: "tt", tp: "tsubasa" },
      { id: "rouchou", x: 12, y: 4, img: "person_054r", dir: 1, nm: "巣守りの老鳥", talk: "tt", tp: "tsubasa" },
      { id: "hina", x: 5, y: 7, mon: "monster_132", face: 1, nm: "雛の子", talk: "tt", tp: "tsubasa" },
      { id: "kana", x: 10, y: 9, img: "person_054", dir: 1, nm: "カナ", talk: "kana", card: () => 1 },
      { id: "shuriT", x: 8, y: 3, mon: "m_shuri", face: -1, nm: "シュリ", talk: "tt", tp: "tsubasa", when: g => cut(g, "c6s8") || S(g) >= 96 },
    ],
    foes: [], chests: [],
    trigs: [{ x: 1, y: 12, w: 2, h: 1, when: g => S(g) >= 93 && !g.flags.c6tsubasaIn, run: "c6s8a" }],
  };
}
// ---------- 風切りの断崖（翼の試練）：雲の上まで続く崖の道 ----------
function kazakiri() {
  const W = 12, H = 24, g = grid(W, H, "G");
  fill(g, "L", 5, 19, 2, 5); fill(g, "L", 2, 18, 5, 2); fill(g, "L", 2, 13, 2, 6); fill(g, "L", 2, 12, 7, 2); fill(g, "L", 7, 7, 2, 6); fill(g, "L", 3, 6, 6, 2); fill(g, "L", 3, 2, 6, 5);
  fill(g, "P", 1, 17, 1, 4); fill(g, "P", 9, 10, 1, 4); fill(g, "P", 1, 3, 2, 3); fill(g, "P", 9, 2, 2, 4);
  return {
    id: "kazakiri", nm: "風切りの断崖", g, tier: 7, bg: "shade", shade: 1, nanori: 1,
    objs: [{ t: "windStone", x: 3, y: 2, text: ["風の刻みのある石柱。ここが頂だ。"] }],
    exits: [{ x: 5, y: H - 1, to: "tsubasa", tx: 7, ty: 1, dir: 0 }, { x: 6, y: H - 1, to: "tsubasa", tx: 8, ty: 1, dir: 0 }],
    npcs: [{ id: "shuriK", x: 6, y: 3, mon: "m_shuri", face: -1, nm: "シュリ", when: g => S(g) >= 93 && !chikai(g, "tsubasa") }],
    foes: [
      { id: "kz1", x: 3, y: 18, k: "takahei", g: ["takahei", "takahei"] },
      { id: "kz2", x: 2, y: 14, k: "raichou", g: ["raichou", "takahei", "raichou"] },
      { id: "kz3", x: 7, y: 9, k: "takahei", g: ["takahei", "raichou", "takahei"] },
    ],
    chests: [{ id: "c_kaza1", x: 8, y: 12, gold: 700 }],
    trigs: [{ x: 3, y: 6, w: 6, h: 1, when: g => S(g) >= 93 && !chikai(g, "tsubasa"), run: "c6s8b" }],
  };
}

// ======================================================================
// 第5章その2：北方（鉄門砦・凍て野・遠征軍の野営地・廃坑の町ドゥーガ・氷壁の峠・峠の頂）
// ======================================================================
const sNow = () => (window.GS && GS.G ? GS.G.flags.s || 0 : 0);
const kaidan = g => cut(g, "c7s6") || cut(g, "c7fall"); // 第7章：氷の橋の会談
// ---------- 鉄門砦：山の切れ目をふさぐ鉄の門。内側に砦の町 ----------
function tetsumon() {
  const W = 18, H = 18, g = grid(W, H, "Y"), open = sNow() >= 84;
  fill(g, "A", 0, 0, 1, H); fill(g, "A", W - 1, 0, 1, H); fill(g, "Q", 1, 0, 16, 2); fill(g, "c", 7, 0, 4, 2);
  fill(g, "c", 8, 2, 2, H - 2); fill(g, "c", 2, 9, 14, 1);
  return {
    id: "tetsumon", nm: "鉄門砦", g, tier: 0, bg: null, music: "town", snow: 1,
    objs: [
      { t: "ironGate", x: 7, y: 0, w: 4, h: 2, open, walk: open ? 1 : 0 },
      { t: "house", x: 2, y: 2, w: 4, h: 3, roof: "blue", door: 2, nm: "兵舎" },
      { t: "house", x: 12, y: 3, w: 4, h: 3, roof: "red", door: 2, kind: "inn", nm: "砦の宿" },
      { t: "house", x: 12, y: 14, w: 4, h: 2, roof: "brown", door: 1, nm: "鍛冶場" },
      { t: "tent", x: 12, y: 10, w: 2, h: 2, text: ["負傷兵の天幕。うめき声が聞こえる。"] },
      { t: "watchtower", x: 2, y: 11, w: 2, h: 3, text: ["見張り台。上から、ずっと遠くまで見えそうだ。"] },
      { t: "banner", x: 6, y: 2 }, { t: "banner", x: 11, y: 2 }, { t: "fireSnow", x: 6, y: 7 },
      { t: "wagon", x: 4, y: 7, w: 2, h: 1 },
      { t: "sign", x: 10, y: 15, text: ["鉄門砦。この先、北の戦線。"] },
    ],
    exits: [{ x: 8, y: H - 1, to: "akamugi", tx: 14, ty: 1, dir: 0 }, { x: 9, y: H - 1, to: "akamugi", tx: 14, ty: 1, dir: 0 },
      ...(open ? [{ x: 8, y: 0, to: "iteno", tx: 12, ty: 22, dir: 3 }, { x: 9, y: 0, to: "iteno", tx: 13, ty: 22, dir: 3 }] : [])],
    npcs: [
      { id: "monei", x: 7, y: 2, img: "person_138c", dir: 0, nm: "砦の門衛", talk: "tt", tp: "toride" },
      { id: "wakahei", x: 10, y: 8, img: "person_138f", dir: 1, nm: "若い兵", talk: "tt", tp: "toride" },
      { id: "fushou", x: 14, y: 11, img: "person_138w", dir: 1, nm: "負傷兵", talk: "tt", tp: "toride" },
      { id: "bolts", x: 7, y: 7, img: "person_099h", dir: 1, nm: "ボルツ", talk: "bolts", card: () => 1 },
      { id: "kaji", x: 11, y: 15, img: "person_026s", dir: 2, nm: "砦の鍛冶", talk: "tt", tp: "toride" },
      { id: "totoT", x: 12, y: 2, img: "person_100", dir: 1, nm: "トト", talk: "totoT", card: () => 1, when: g => S(g) >= 83 },
      { id: "toby", x: 4, y: 14, img: "person_080", dir: 3, nm: "トビー", talk: "toby", when: g => S(g) >= 83 && S(g) < 90 && !g.roster.includes(16) },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 8, y: 15, w: 2, h: 1, when: g => S(g) === 82, run: "c5s9a" },
      { x: 8, y: 2, w: 2, h: 1, when: g => S(g) === 83, run: "c5s9b" },
    ],
  };
}
// ---------- 凍て野：雪の原。中ほどに焼け落ちた小さな里 ----------
function iteno() {
  const W = 26, H = 24, g = grid(W, H, "Y");
  fill(g, "A", 0, 0, W, 1); fill(g, "A", 0, H - 1, W, 1); fill(g, "A", 0, 0, 1, H); fill(g, "A", W - 1, 0, 1, H);
  fill(g, "j", 12, 12, 2, 12); fill(g, "j", 0, 6, 13, 1); fill(g, "j", 12, 6, 1, 7); fill(g, "j", 13, 12, 13, 1); fill(g, "j", 18, 0, 2, 13); fill(g, "j", 10, 16, 2, 1);
  for (const [x, y, w, h] of [[2, 9, 3, 2], [16, 3, 1, 2], [21, 4, 3, 3], [3, 20, 4, 2], [16, 18, 3, 2], [22, 15, 2, 4], [7, 2, 2, 2]]) fill(g, "A", x, y, w, h);
  for (const [x, y] of [[5, 3], [14, 9], [23, 9], [9, 21], [20, 21], [15, 15]]) g[y][x] = "I";
  return {
    id: "iteno", nm: "凍て野", g, tier: 6, bg: "snow", snow: 1,
    objs: [
      { t: "burntPost", x: 5, y: 15 }, { t: "burntPost", x: 8, y: 14 }, { t: "burntPost", x: 9, y: 18 }, { t: "burntPost", x: 4, y: 17 },
      { t: "brokenStone", x: 7, y: 16, text: ["割られた還り石。真ん中から、二つに割れている。"] },
      ...[[6, 17], [8, 16], [6, 15], [7, 18]].map(([x, y]) => ({ t: "wisp", x, y, when: g => S(g) < 85 })),
      { t: "sign", x: 14, y: 20, text: ["北　氷壁の峠　／　西　遠征軍の野営地　／　東　廃坑の町ドゥーガ"] },
    ],
    exits: [{ x: 12, y: H - 1, to: "tetsumon", tx: 8, ty: 1, dir: 0 }, { x: 13, y: H - 1, to: "tetsumon", tx: 9, ty: 1, dir: 0 },
      { x: 0, y: 6, to: "camp", tx: 16, ty: 7, dir: 1 }, { x: W - 1, y: 12, to: "duga", tx: 1, ty: 9, dir: 2 },
      { x: 18, y: 0, to: "touge", tx: 6, ty: 22, dir: 3 }, { x: 19, y: 0, to: "touge", tx: 7, ty: 22, dir: 3 }],
    npcs: [],
    foes: [
      { id: "it1", x: 13, y: 18, k: "yukiusagi", g: ["yukiusagi", "yukiusagi", "yukiusagi"] },
      { id: "it2", x: 6, y: 6, k: "shimofuri", g: ["shimofuri", "shimofuri"] },
      { id: "it3", x: 20, y: 12, k: "kogoe", g: ["kogoe", "kogoe", "shimofuri"] },
      { id: "it4", x: 18, y: 6, k: "yukidaruma", g: ["shimofuri", "yukidaruma", "shimofuri"] },
      { id: "it5", x: 22, y: 20, k: "yukiusagi", g: ["yukiusagi", "yukidaruma", "yukiusagi"] },
      { id: "it6", x: 3, y: 13, k: "kogoe", g: ["kogoe", "yukiusagi"] },
    ],
    chests: [{ id: "c_iteno1", x: 2, y: 2, gold: 360 }, { id: "c_iteno2", x: 23, y: 21, item: "chain" }],
    trigs: [{ x: 4, y: 14, w: 7, h: 5, when: g => S(g) === 84, run: "c5s10" }],
  };
}
// ---------- 遠征軍の野営地：雪原の中の天幕の群れ。王国の旗、かがり火 ----------
function camp() {
  const W = 18, H = 14, g = grid(W, H, "Y");
  fill(g, "A", 0, 0, W, 1); fill(g, "A", 0, H - 1, W, 1); fill(g, "A", 0, 0, 1, H); fill(g, "A", W - 1, 0, 1, 7); fill(g, "A", W - 1, 8, 1, 6);
  fill(g, "j", 2, 7, 16, 1); fill(g, "j", 8, 4, 1, 3); fill(g, "j", 13, 4, 1, 3);
  const scene = g2 => S(g2) === 85;
  return {
    id: "camp", nm: "遠征軍の野営地", g, tier: 0, bg: null, music: "town", snow: 1,
    objs: [
      { t: "tent", x: 7, y: 2, w: 2, h: 2, text: ["勇者一行の天幕。"] }, { t: "tent", x: 12, y: 2, w: 2, h: 2, text: ["先遣隊の天幕。"] },
      { t: "tent", x: 3, y: 2, w: 2, h: 2 }, { t: "tent", x: 3, y: 9, w: 2, h: 2, text: ["祈りの天幕。"] }, { t: "tent", x: 12, y: 9, w: 2, h: 2, text: ["兵舎の天幕。中から、賽を振る音がする。"] },
      { t: "banner", x: 6, y: 5 }, { t: "banner", x: 10, y: 5 }, { t: "fireSnow", x: 9, y: 9 }, { t: "fireSnow", x: 15, y: 4 },
      { t: "wagon", x: 6, y: 11, w: 2, h: 1 },
    ],
    exits: [{ x: W - 1, y: 7, to: "iteno", tx: 1, ty: 6, dir: 2 }],
    npcs: [
      { id: "asterC", x: 8, y: 5, img: "person_013", dir: 0, nm: "アスター", talk: "asterCamp", when: g => S(g) >= 85 && S(g) < 88 },
      { id: "elma", x: 7, y: 5, img: "person_089", dir: 0, nm: "エルマ", talk: "elma", card: g => S(g) >= 86, when: g => S(g) >= 85 && !(S(g) >= 86 && S(g) < 88) },
      { id: "rokka", x: 9, y: 5, img: "person_015", dir: 0, nm: "ロッカ", talk: "tt", tp: "toride", when: g => S(g) >= 85 && !(S(g) >= 86 && S(g) < 88) },
      { id: "gerdC", x: 13, y: 5, img: "person_088", dir: 0, nm: "ゲルト", talk: "tt", tp: "toride", when: g => (S(g) === 85 && g.flags.c5gerd) || S(g) >= 88 },
      { id: "souryo", x: 5, y: 10, img: "person_076", dir: 1, nm: "従軍の僧", talk: "tt", tp: "toride" },
      { id: "mihari", x: 15, y: 8, img: "person_138f", dir: 1, nm: "見張りの兵", talk: "tt", tp: "toride" },
      { id: "chinhei", x: 14, y: 10, img: "person_138f", dir: 1, nm: "兵舎の兵", talk: "campChin" },
    ],
    foes: [], chests: [],
    trigs: [{ x: 14, y: 7, w: 3, h: 1, when: scene, run: "c5s11" }],
  };
}
// ---------- 廃坑の町ドゥーガ：崖にへばりつく町。人と半鬼が一緒に暮らす ----------
function duga() {
  const W = 20, H = 16, g = grid(W, H, "Y");
  fill(g, "I", 0, 0, W, 2); fill(g, "I", W - 1, 0, 1, H); fill(g, "I", 0, H - 1, W, 1); fill(g, "I", 0, 0, 1, 9); fill(g, "I", 0, 11, 1, 5);
  fill(g, "I", 13, 2, 6, 1);
  fill(g, "j", 0, 9, 18, 2); fill(g, "j", 15, 4, 2, 5); fill(g, "j", 5, 4, 1, 5); fill(g, "j", 10, 4, 1, 5); fill(g, "j", 5, 11, 1, 1); fill(g, "j", 11, 11, 1, 1); fill(g, "j", 16, 11, 1, 1);
  return {
    id: "duga", nm: "廃坑の町ドゥーガ", g, tier: 0, bg: null, music: "town", snow: 1,
    objs: [
      { t: "gatePost", x: 2, y: 8 }, { t: "gatePost", x: 2, y: 11 },
      { t: "mine", x: 15, y: 2, w: 2, h: 2 },
      { t: "house", x: 4, y: 2, w: 3, h: 2, roof: "brown", door: 1 }, { t: "house", x: 9, y: 2, w: 3, h: 2, roof: "green", door: 1 },
      { t: "house", x: 4, y: 12, w: 3, h: 2, roof: "red", door: 1, nm: "ニィの家" }, { t: "house", x: 10, y: 12, w: 3, h: 2, roof: "brown", door: 1, nm: "町の酒場" },
      { t: "house", x: 15, y: 12, w: 3, h: 2, roof: "blue", door: 1, kind: "inn", nm: "ドゥーガの宿" },
      { t: "woodpile", x: 8, y: 6 }, { t: "woodpile", x: 9, y: 6 }, { t: "fireSnow", x: 13, y: 7 },
      { t: "sign", x: 3, y: 7, text: ["ドゥーガ"] },
    ],
    exits: [{ x: 0, y: 9, to: "iteno", tx: 24, ty: 12, dir: 1 }, { x: 0, y: 10, to: "iteno", tx: 24, ty: 12, dir: 1 }],
    npcs: [
      { id: "dag", x: 14, y: 5, img: "person_071d", dir: 0, nm: "ダグ", talk: "tt", tp: "duga" },
      { id: "nii", x: 9, y: 8, img: "person_073n", dir: 0, nm: "ニィ", talk: "nii", card: g => S(g) >= 87 },
      { id: "niiHaha", x: 6, y: 11, img: "person_101d", dir: 0, nm: "ニィの母", talk: "tt", tp: "duga" },
      { id: "makiH", x: 7, y: 7, img: "person_014d", dir: 2, nm: "薪割りの男", talk: "tt", tp: "duga" },
      { id: "makiO", x: 10, y: 7, img: "person_068h", dir: 1, nm: "角のこぶの大男", talk: "tt", tp: "duga" },
      { id: "sakaba", x: 12, y: 11, img: "person_019", dir: 0, nm: "酒場の主", talk: "tt", tp: "duga" },
      { id: "koban", x: 17, y: 5, img: "person_130h", dir: 1, nm: "坑道の番", talk: "tt", tp: "duga" },
      // 場面13：夜明けの門
      { id: "gerdD", x: 1, y: 9, img: "person_088", dir: 2, nm: "ゲルト", when: g => cut(g, "c5s13") },
      { id: "senD1", x: 1, y: 10, mon: "monster_070", face: 1, nm: "先遣隊の兵", when: g => cut(g, "c5s13") && !g.flags.c5back },
      { id: "senD2", x: 1, y: 8, mon: "monster_010", face: 1, nm: "先遣隊の槍兵", when: g => cut(g, "c5s13") && !g.flags.c5back },
      { id: "asterD", x: 2, y: 10, img: "person_013", dir: 1, nm: "アスター", when: g => cut(g, "c5s13") && g.flags.c5aster },
      { id: "elmaD", x: 1, y: 11, img: "person_089", dir: 2, nm: "エルマ", when: g => cut(g, "c5s13") && g.flags.c5aster },
      { id: "rokkaD", x: 3, y: 11, img: "person_015", dir: 3, nm: "ロッカ", when: g => cut(g, "c5s13") && g.flags.c5aster },
    ],
    foes: [], chests: [{ id: "c_duga1", x: 18, y: 7, tool: "onigiri" }],
    trigs: [
      { x: 1, y: 9, w: 3, h: 2, when: g => S(g) === 86, run: "c5s12" },
      { x: 15, y: 4, w: 2, h: 1, run: "dugaMine" },
    ],
  };
}
// ---------- 氷壁の峠：青白い氷の壁にはさまれた峠道。中ほどの裂け目から水が流れ出す ----------
function touge() {
  const W = 14, H = 24, g = grid(W, H, "I");
  fill(g, "Y", 6, 19, 2, 5); fill(g, "Y", 3, 18, 5, 2); fill(g, "Y", 3, 12, 2, 7); fill(g, "Y", 3, 11, 8, 2); fill(g, "Y", 9, 4, 2, 8); fill(g, "Y", 5, 3, 6, 2); fill(g, "Y", 5, 0, 2, 4);
  fill(g, "Y", 5, 14, 3, 2); fill(g, "Y", 11, 6, 1, 3);
  fill(g, "~", 12, 10, 1, 14); g[11][11] = "~";
  return {
    id: "touge", nm: "氷壁の峠", g, tier: 6, bg: "snow", snow: 1,
    objs: [{ t: "stele", x: 10, y: 3, text: ["凍りついた道しるべ。「この先、峠の頂」"] }],
    exits: [{ x: 6, y: H - 1, to: "iteno", tx: 18, ty: 1, dir: 0 }, { x: 7, y: H - 1, to: "iteno", tx: 19, ty: 1, dir: 0 },
      { x: 5, y: 0, to: "itadaki", tx: 6, ty: 12, dir: 3 }, { x: 6, y: 0, to: "itadaki", tx: 7, ty: 12, dir: 3 }],
    npcs: [],
    foes: [
      { id: "tg1", x: 5, y: 18, k: "tsurara", g: ["tsurara", "tsurara"] },
      { id: "tg2", x: 3, y: 14, k: "shirokuma", g: ["shirokuma", "tsurara"] },
      { id: "tg3", x: 7, y: 11, k: "tsurara", g: ["tsurara", "shirokuma", "tsurara"] },
      { id: "tg4", x: 9, y: 6, k: "shirokuma", g: ["shirokuma", "shirokuma"] },
    ],
    chests: [{ id: "c_touge1", x: 6, y: 15, gold: 500 }, { id: "c_touge2", x: 11, y: 7, item: "sagestaff" }],
    trigs: [{ x: 9, y: 11, w: 2, h: 2, when: g => S(g) === 88, run: "c5s14" }],
  };
}
// ---------- 峠の頂：氷の橋が谷をまたぐ。その手前に氷河ムカデ ----------
function itadaki() {
  const W = 14, H = 14, g = grid(W, H, "Y");
  fill(g, "A", 0, 0, 1, H); fill(g, "A", W - 1, 0, 1, H); fill(g, "I", 1, 7, 5, 2); fill(g, "I", 7, 7, 6, 2); // 橋のたもとは1マスだけ（氷河ムカデがふさぐ） fill(g, "I", 1, 12, 4, 2); fill(g, "I", 9, 12, 4, 2);
  fill(g, "G", 1, 2, 12, 5); fill(g, "B", 6, 2, 2, 5);
  const kaidanNow = window.GS && GS.G && ["c7s6", "c7fall"].includes(GS.G.flags.cut);
  return {
    id: "itadaki", nm: "峠の頂", g, tier: 6, bg: "snow", snow: 1, noLeader: ["c6end", "c7fall"].includes(window.GS && GS.G && GS.G.flags.cut), noFollow: ["c6end", "c7s6", "c7fall"].includes(window.GS && GS.G && GS.G.flags.cut),
    objs: [{ t: "sign", x: 9, y: 9, text: ["氷の橋。谷の底を、細い川が流れている。"], when: g => !kaidan(g) },
      { t: "table", x: 6, y: 4, when: kaidan }, { t: "table", x: 7, y: 4, when: kaidan },
      { t: "banner", x: 5, y: 11, when: kaidan }, { t: "banner", x: 8, y: 11, when: kaidan }, { t: "banner", x: 7, y: 10, when: kaidan }],
    exits: [{ x: 6, y: H - 1, to: "touge", tx: 5, ty: 1, dir: 0 }, { x: 7, y: H - 1, to: "touge", tx: 6, ty: 1, dir: 0 },
      ...(sNow() >= 90 ? [{ x: 6, y: 0, to: "kagenohara", tx: 13, ty: 22, dir: 3 }, { x: 7, y: 0, to: "kagenohara", tx: 14, ty: 22, dir: 3 }] : [])],
    npcs: [{ id: "hyougaN", x: 6, y: 7, mon: "m_hyouga", face: 1, big: 1, nm: "氷河ムカデ", talk: "hyougaN", when: g => S(g) < 90 },
      // 第7章・場面6〜8：氷の橋の会談
      ...[["muku8", 7, 3, () => "person_058h", "ムク"], ["bram8", 6, 1, () => "person_005", "ブラム"], ["jako8", 7, 1, () => "person_133", "ジャコ"], ["mifa8", 5, 1, () => "person_011", "ミーファ"]].map(([id, x, y, img, nm]) => ({ id, x, y, img: img(), dir: 0, nm, when: g => kaidan(g) && !(id === "mifa8" && g.flags.c7mifaJump) && !(id !== "mifa8" && g.flags.c7flee) && !(id === "muku8" && g.flags.c7hat) })),
      { id: "muku8b", x: 7, y: 3, img: "person_058", dir: 0, nm: "ムク", when: g => kaidan(g) && g.flags.c7hat && !g.flags.c7flee },
      { id: "liseM", x: 6, y: 5, img: "person_002", dir: 3, nm: "リゼリア", when: g => kaidan(g) },
      { id: "asterM", x: 7, y: 5, img: "person_013", dir: 3, nm: "アスター", when: g => kaidan(g) },
      { id: "oswaldM", x: 5, y: 9, img: "person_128o", dir: 3, nm: "オズワルド", when: g => kaidan(g) },
      { id: "margoM", x: 8, y: 9, img: "person_134", dir: 3, nm: "マルゴ", when: g => kaidan(g) },
      { id: "elmaM", x: 4, y: 10, img: "person_089", dir: 3, nm: "エルマ", when: g => kaidan(g) },
      { id: "rokkaM", x: 9, y: 10, img: "person_015", dir: 3, nm: "ロッカ", when: g => kaidan(g) },
      { id: "sekiM", x: 2, y: 9, img: "person_136", dir: 3, nm: "関守", when: g => kaidan(g) },
      { id: "shokiM", x: 11, y: 9, img: "person_127", dir: 3, nm: "書記", when: g => kaidan(g) },
      ...[[3, 11], [10, 11], [1, 11], [12, 11]].map(([x, y], i) => ({ id: "heiM" + i, x, y, mon: "monster_070", face: x < 6 ? 1 : -1, nm: "王国兵", when: g => kaidan(g) })),
      ...[[2, 0], [4, 0], [9, 0], [11, 0]].map(([x, y], i) => ({ id: "fushi" + i, x, y, mon: ["m_kibasen", "monster_090", "m_numayamori", "monster_091"][i], face: 1, nm: "四氏族の戦士", when: g => kaidan(g) && g.flags.c7fushi && !g.flags.c7fall })),
      { id: "liseB", x: 6, y: 4, img: "person_002", dir: 3, nm: "リゼット", when: g => cut(g, "c6end") }],
    foes: [], chests: [],
    trigs: [{ x: 1, y: 9, w: 12, h: 1, when: g => S(g) === 89, run: "c5s15" }, { x: 1, y: 1, w: 12, h: 1, when: g => S(g) === 101, run: "c7s6" }],
  };
}

// ---------- 第5章：丘の上の宰相の館（外。夜）。正面は黒外套が固めている。裏の水路から入る ----------
function yakatagai() {
  const W = 14, H = 12, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 1); fill(g, "T", W - 1, 0, 1, H); fill(g, "T", 0, H - 1, W, 1); fill(g, "T", 0, 0, 1, 9); fill(g, "T", 0, 10, 1, 2);
  fill(g, "Q", 4, 1, 1, 6); fill(g, "Q", 12, 1, 1, 6); fill(g, "Q", 4, 6, 9, 1); g[6][8] = "c";   // 高い塀と正門
  fill(g, "~", 2, 1, 1, 10); g[9][2] = "b";                                                          // 裏の水路
  fill(g, "=", 3, 2, 1, 8); fill(g, "=", 0, 9, 2, 1); fill(g, "=", 3, 9, 6, 1); fill(g, "=", 8, 7, 1, 2);
  return {
    id: "yakatagai", nm: "宰相の館（外）", g, tier: 0, bg: null,
    objs: [
      { t: "house", x: 5, y: 1, w: 7, h: 4, roof: "brown", door: 3, noEnter: 1 },
      { t: "gatePost", x: 7, y: 6, text: ["門に、紋が刻まれている。閉じた門の紋だ。"] }, { t: "gatePost", x: 9, y: 6, text: ["門に、紋が刻まれている。閉じた門の紋だ。"] },
      { t: "lantern", x: 6, y: 7 }, { t: "lantern", x: 10, y: 7 },
      { t: "grate", x: 3, y: 1, text: ["水路の格子。下のほうが、錆びて外れかけている。"] },
    ],
    exits: [{ x: 0, y: 9, to: "lux", tx: 20, ty: 7, dir: 1 }],
    npcs: [
      { id: "kyg1", x: 8, y: 6, mon: "monster_019", face: 1, nm: "黒外套の兵", talk: "kuroYakata", when: g => S(g) < 81 },
      { id: "kyg2", x: 7, y: 7, mon: "monster_018", face: 1, nm: "黒外套の兵", talk: "kuroYakata", when: g => S(g) < 81 },
      { id: "kyg3", x: 9, y: 7, mon: "monster_020", face: -1, nm: "黒外套の兵", talk: "kuroYakata", when: g => S(g) < 81 },
    ],
    foes: [], chests: [],
    trigs: [{ x: 3, y: 2, run: "yakataIn" }],
  };
}
// ---------- 宰相の館（中）：長い廊下。飾りのない壁。左上に書斎、右上に地下への階段 ----------
function yakata() {
  const W = 15, H = 22, g = grid(W, H, "w");
  fill(g, "p", 1, 12, 3, 9); fill(g, "p", 1, 12, 13, 2); fill(g, "p", 11, 2, 3, 12);   // 入り口の廊下・横の廊下・右の廊下
  fill(g, "p", 1, 1, 7, 6); fill(g, "p", 8, 4, 3, 1);                                   // 書斎（左上）
  fill(g, "p", 5, 15, 5, 4); fill(g, "p", 4, 16, 1, 1);                                 // 小部屋（下の真ん中）
  g[H - 1][2] = "D"; g[2][12] = "S";
  const night = 1;
  return {
    id: "yakata", nm: "宰相の館", g, tier: 5, bg: "stone", inside: 1,
    objs: [
      ...[1, 2, 3, 5, 6, 7].map(x => ({ t: "ledgers", x, y: 1, text: ["壁いっぱいの帳簿。日付と数字が、細かい字でびっしり並んでいる。"] })),
      { t: "desk", x: 4, y: 3, text: ["大きな机。小さな額が、伏せて置いてある。"] }, { t: "chair", x: 4, y: 4 },
      { t: "candleStand", x: 1, y: 5 }, { t: "shelf", x: 7, y: 5, text: ["帳簿の棚。紙の束が、ひもでくくってある。"] },
      { t: "candleStand", x: 13, y: 12 }, { t: "candleStand", x: 1, y: 13 },
      { t: "basket", x: 9, y: 15 }, { t: "shelf", x: 5, y: 15, text: ["空の棚。何も置かれていない。"] },
    ],
    exits: [{ x: 2, y: H - 1, to: "yakatagai", tx: 3, ty: 3, dir: 0 }],
    npcs: [
      { id: "banken", x: 2, y: 13, mon: "monster_079", face: -1, nm: "鉄の番犬", when: g => S(g) === 77 },
    ],
    foes: [
      { id: "yk1", x: 7, y: 13, k: "fuurou", g: ["fuurou", "fuurou", "tetsuken"] },
      { id: "yk2", x: 12, y: 9, k: "kurohei", g: ["kurohei", "kurohei", "kuroyumi"] },
      { id: "yk3", x: 7, y: 17, k: "tetsuken", g: ["tetsuken", "fuurou"] },
      { id: "yk4", x: 12, y: 5, k: "kuroyumi", g: ["kurohei", "kuroyumi", "kuroyumi"] },
    ],
    chests: [{ id: "c_yakata1", x: 9, y: 17, gold: 420 }, { id: "c_yakata2", x: 13, y: 3, item: "plate" }],
    trigs: [
      { x: 2, y: 16, when: g => S(g) === 77, run: "c5s3" },
      { x: 1, y: 2, w: 7, h: 4, when: g => S(g) === 78, run: "c5s4" },
      { x: 12, y: 2, run: "yakataStairs" },
    ],
  };
}
// ---------- 館の地下の蔵：鎖を巻いた長い箱。三つ首の鉄犬が守る ----------
function kura() {
  const W = 11, H = 10, g = grid(W, H, "W"); fill(g, "_", 1, 1, 9, 8); g[H - 1][5] = "S";
  return {
    id: "kura", nm: "館の地下の蔵", g, tier: 5, bg: "stone", inside: 1, dark: 1,
    objs: [
      { t: "chainBox", x: 4, y: 1, w: 2, h: 1, text: ["鎖を巻いた長い箱。"] },
      { t: "candleStand", x: 1, y: 1 }, { t: "candleStand", x: 9, y: 1 },
      { t: "basket", x: 1, y: 7 }, { t: "basket", x: 9, y: 7 },
    ],
    exits: [{ x: 5, y: H - 1, to: "yakata", tx: 12, ty: 3, dir: 0 }],
    npcs: [{ id: "kerbeN", x: 5, y: 3, mon: "m_kerbe", face: 1, big: 1, nm: "三つ首の鉄犬", when: g => S(g) === 79 }],
    foes: [], chests: [],
    trigs: [{ x: 1, y: 6, w: 9, h: 1, when: g => S(g) === 79, run: "c5s5" }],
  };
}
// ---------- 王城の謁見の間：空の玉座。玉座の脇に宰相の机 ----------
function ekken() {
  const W = 13, H = 14, g = grid(W, H, "w"); fill(g, "p", 1, 1, 11, 12); fill(g, "C", 6, 3, 1, 10); g[H - 1][6] = "D";
  const during = g => S(g) === 80;
  return {
    id: "ekken", nm: "謁見の間", g, tier: 0, bg: null, inside: 1, music: null,
    objs: [
      { t: "throne", x: 6, y: 1, text: ["空の玉座。王が病に伏してから、誰も座っていない。"] },
      { t: "desk", x: 8, y: 2, text: ["宰相の机。きれいに片づいている。"], when: g => S(g) <= 80 },
      { t: "desk", x: 8, y: 2, text: ["宰相の机。何も置かれていない。"], when: g => S(g) > 80 },
      ...[3, 6, 9].map(y => ({ t: "column", x: 2, y })), ...[3, 6, 9].map(y => ({ t: "column", x: 10, y })),
      { t: "candleStand", x: 4, y: 1 }, { t: "candleStand", x: 1, y: 1 }, { t: "candleStand", x: 11, y: 1 },
    ],
    exits: [{ x: 6, y: H - 1, to: "lux", tx: 11, ty: 6, dir: 0 }],
    npcs: [
      { id: "valdE", x: 8, y: 3, img: "person_123", dir: 0, nm: "ヴァルド", when: during },
      { id: "sigE", x: 9, y: 4, img: "person_146", dir: 1, nm: "シグ", when: g => during(g) && !g.flags.c5sig },
      { id: "kuroE1", x: 10, y: 4, mon: "monster_019", face: -1, nm: "黒外套の兵", when: during },
      { id: "kuroE2", x: 10, y: 7, mon: "monster_020", face: -1, nm: "黒外套の兵", when: during },
      { id: "oswald", x: 4, y: 4, img: "person_128o", dir: 2, nm: "オズワルド", talk: "oswald" },
      { id: "teishin1", x: 3, y: 7, img: "person_014k", dir: 2, nm: "廷臣", talk: "tt", tp: "lux", when: g => S(g) === 80 },
      { id: "teishin2", x: 9, y: 8, img: "person_078t", dir: 1, nm: "廷臣", talk: "tt", tp: "lux", when: g => S(g) === 80 },
      { id: "teishin3", x: 3, y: 9, img: "person_078t", dir: 2, nm: "年かさの廷臣", talk: "ekkenTeishin", when: g => S(g) > 80 },
      { id: "kishi1", x: 5, y: 11, img: "person_138k", dir: 3, nm: "騎士", talk: "ekkenKishi" },
      { id: "kishi2", x: 7, y: 11, img: "person_138k", dir: 3, nm: "騎士", talk: "ekkenKishi" },
      { id: "edmonE", x: 5, y: 9, img: "person_021", dir: 3, nm: "エドモン", when: g => during(g) && !g.flags.c5edmon },
    ],
    foes: [], chests: [], trigs: [],
  };
}
// ---------- 城の回廊（謁見の間を出た所） ----------
function kairoJ() {
  const W = 13, H = 6, g = grid(W, H, "w"); fill(g, "p", 1, 1, 11, 4); fill(g, "C", 1, 2, 11, 2);
  return {
    id: "kairoJ", nm: "城の回廊", g, tier: 0, bg: null, inside: 1, music: null,
    objs: [...[2, 5, 8, 11].map(x => ({ t: "column", x, y: 1 })), ...[2, 5, 8, 11].map(x => ({ t: "candleStand", x, y: 4 }))],
    exits: [], npcs: [], foes: [], chests: [], trigs: [],
  };
}
// ---------- 城の客間（夜） ----------
function kyakuma() {
  const W = 9, H = 7, g = grid(W, H, "w"); fill(g, "p", 1, 1, 7, 5); g[H - 1][4] = "D";
  return {
    id: "kyakuma", nm: "城の客間", g, tier: 0, bg: null, inside: 1, music: null,
    objs: [
      { t: "bed", x: 7, y: 1, w: 1, h: 2 }, { t: "bed", x: 1, y: 3, w: 1, h: 2 },
      { t: "table", x: 2, y: 1 }, { t: "candleStand", x: 5, y: 1 }, { t: "chair", x: 6, y: 4 },
    ],
    exits: [{ x: 4, y: H - 1, to: "lux", tx: 11, ty: 6, dir: 0 }],
    npcs: [{ id: "jakoK", x: 4, y: 1, img: "person_133", dir: 3, nm: "ジャコ", when: g => cut(g, "c5s8b") }],
    foes: [], chests: [], trigs: [],
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
  const open = window.GS && GS.G && (GS.G.flags.s || 0) >= 47, north = window.GS && GS.G && (GS.G.flags.s || 0) >= 82;
  if (north) fill(g, "=", 14, 0, 1, 7);                                    // 北の道：鉄門砦へ（第5章、通行証を得てから）
  return {
    id: "akamugi", nm: "赤麦の丘", g, tier: 3, bg: "meadow", afterWin: "akaWin",
    objs: [
      { t: "kanmon", x: 22, y: 6, w: 3, h: 2, walk: 1, open },
      { t: "wagon", x: 17, y: 5, w: 2, h: 1, when: g => S(g) < 47 }, { t: "wagon", x: 19, y: 5, w: 2, h: 1, army: 0, when: g => S(g) < 47 },  // 追い返されて並ぶ荷車の列
      { t: "sign", x: 21, y: 8, text: ["東の関所　この先、金砂街道"] },
      { t: "sign", x: 1, y: 7, text: ["西　王都ルクスベル"] },
      { t: "sign", x: 15, y: 2, text: ["北　鉄門砦"], when: g => S(g) >= 82 },
    ],
    exits: [{ x: 0, y: 8, to: "lux", tx: 20, ty: 15, dir: 1 }, { x: 25, y: 7, to: "hoshimi", tx: 1, ty: 9, dir: 2 }, ...(north ? [{ x: 14, y: 0, to: "tetsumon", tx: 8, ty: 16, dir: 3 }] : [])],
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
    exits: [{ x: 8, y: 14, to: "seirena", tx: 22, ty: 9, dir: 1 }, { x: 8, y: 15, to: "seirena", tx: 22, ty: 9, dir: 1 }, { x: 8, y: 16, to: "seirena", tx: 22, ty: 9, dir: 1 }, { x: 37, y: 13, to: "junrei", tx: 3, ty: 15, dir: 2 }, { x: 37, y: 14, to: "junrei", tx: 3, ty: 15, dir: 2 }, { x: 37, y: 15, to: "junrei", tx: 3, ty: 16, dir: 2 }],
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
      { x: 2, y: 2, w: W - 4, h: 1, run: "stormWall", d: [0, 1] }, { x: 2, y: H - 3, w: W - 4, h: 1, run: "stormWall", d: [0, -1] },
      { x: 2, y: 3, w: 1, h: H - 6, run: "stormWall", d: [1, 0] }, { x: W - 3, y: 3, w: 1, h: H - 6, run: "stormWall", d: [-1, 0] },
    ],
  };
}

// ---------- 巡礼の浜〜巡礼の道（S4）：西の船着き場から、白い浜を経て北の丘の聖都へ。南の山道は土砂でふさがっている ----------
function junrei() {
  const W = 20, H = 26, g = grid(W, H, ".");
  fill(g, "T", 0, 0, W, 2); fill(g, "T", W - 2, 0, 2, H); fill(g, "T", 0, H - 2, W, 2);
  fill(g, "~", 0, 2, 3, H - 4); fill(g, "Z", 3, 12, 6, 10); fill(g, "b", 0, 15, 3, 2);   // 西の海・白い浜・船着き場
  fill(g, "c", 3, 15, 6, 2); fill(g, "c", 8, 5, 2, 12); fill(g, "c", 8, 0, 2, 6);         // 石畳の巡礼の道（北へ）
  fill(g, "c", 10, 20, 2, 4); fill(g, "T", 12, 4, 6, 5); fill(g, "T", 13, 14, 5, 6);      // 南の山道（第5章で開く）
  g[H - 2][10] = "c"; g[H - 1][10] = "c"; g[H - 2][11] = "c"; g[H - 1][11] = "c";
  return {
    id: "junrei", nm: "巡礼の道", g, tier: 4, bg: "meadow", music: null, pad: "T",
    objs: [
      { t: "offering", x: 10, y: 9, text: ["道ばたの祠。星の形の石が祀ってある。"] }, { t: "sign", x: 10, y: 4, text: ["北　聖都エリュシス"] },
      { t: "rubble", x: 10, y: 22, text: ["土砂で道がふさがっている。南の山道は、通れない。"], when: g => S(g) < 75 }, { t: "rubble", x: 11, y: 22, text: ["土砂で道がふさがっている。南の山道は、通れない。"], when: g => S(g) < 75 },
      { t: "sign", x: 12, y: 18, text: ["南　山道（崩れのため通れず）"], when: g => S(g) < 75 }, { t: "sign", x: 12, y: 18, text: ["南　山道（峠を越えて、中央平原へ）"], when: g => S(g) >= 75 }, { t: "boat", x: 0, y: 17, w: 3, h: 1, text: ["商盟の船の小舟。沖の船まで漕いで戻れる。"] },
    ],
    exits: [{ x: 0, y: 15, to: "uchiumi", tx: 36, ty: 14, dir: 1 }, { x: 0, y: 16, to: "uchiumi", tx: 36, ty: 14, dir: 1 }, { x: 8, y: 0, to: "seito", tx: 11, ty: 25, dir: 3 }, { x: 9, y: 0, to: "seito", tx: 12, ty: 25, dir: 3 },
      { x: 10, y: H - 1, to: "yamamichi", tx: 6, ty: 1, dir: 0 }, { x: 11, y: H - 1, to: "yamamichi", tx: 7, ty: 1, dir: 0 }],
    npcs: [
      { id: "junreiM", x: 11, y: 9, img: "person_074w", dir: 1, nm: "巡礼の男", when: g => S(g) <= 68 },
      { id: "junreiF", x: 11, y: 10, img: "person_026w", dir: 1, nm: "巡礼の女", when: g => S(g) <= 68 },
    ],
    foes: [
      { id: "j1", x: 5, y: 19, k: "junreigani", g: ["junreigani", "junreigani"] },
      { id: "j2", x: 6, y: 9, k: "shirayuri", g: ["shirayuri", "junreigani"] },
      { id: "j3", x: 12, y: 12, k: "shirayuri", g: ["shirayuri", "shirayuri"] },
    ],
    chests: [{ id: "c_junrei1", x: 4, y: 20, tool: "onigiri" }, { id: "c_junrei2", x: 15, y: 11, gold: 250 }],
    trigs: [{ x: 8, y: 9, w: 2, h: 2, when: g => S(g) === 67, run: "c4s6" }, { x: 10, y: 19, w: 2, h: 2, when: g => S(g) === 75 && !g.flags.c5yama, run: "c5s1a" }],
  };
}
// ---------- 南の山道（第5章で開く）：巡礼の道から峠を越えて、中央平原の西へ ----------
function yamamichi() {
  const W = 14, H = 15, g = grid(W, H, "T");
  fill(g, "R", 1, 1, 4, 8); fill(g, "R", 9, 1, 4, 7); fill(g, "R", 1, 12, 12, 2);
  fill(g, "=", 6, 0, 2, 12); fill(g, "=", 8, 10, 6, 2); fill(g, ".", 4, 8, 2, 3); fill(g, ".", 8, 8, 2, 2);
  return {
    id: "yamamichi", nm: "南の山道", g, tier: 5, bg: "meadow", pad: "T",
    objs: [
      { t: "stele", x: 8, y: 8, text: ["峠の道しるべ。", "北　巡礼の道　／　東　中央平原"] },
      { t: "rubble", x: 5, y: 10, text: ["道の脇に、掘り出したばかりの土砂が積んである。"] },
    ],
    exits: [{ x: 6, y: 0, to: "junrei", tx: 10, ty: 24, dir: 3 }, { x: 7, y: 0, to: "junrei", tx: 11, ty: 24, dir: 3 },
      { x: W - 1, y: 10, to: "plain", tx: 1, ty: 24, dir: 2 }, { x: W - 1, y: 11, to: "plain", tx: 1, ty: 24, dir: 2 }],
    npcs: [], foes: [],
    chests: [{ id: "c_yama1", x: 4, y: 8, tool: "onigiri" }],
    trigs: [],
  };
}
// ---------- 聖都エリュシス（S5）：白い石の都。北に大聖堂、西に大書庫、東に宿坊 ----------
function seito() {
  const W = 24, H = 28, g = grid(W, H, "c");
  fill(g, "Q", 0, 0, W, 1); fill(g, "Q", 0, 0, 1, H); fill(g, "Q", W - 1, 0, 1, H); fill(g, "Q", 0, H - 1, W, 1);
  g[H - 1][11] = "c"; g[H - 1][12] = "c";                                                    // 南の門（巡礼の道へ）
  fill(g, ".", 2, 14, 6, 4); fill(g, ".", 16, 14, 6, 4); fill(g, ".", 2, 21, 5, 4); fill(g, ".", 17, 21, 5, 4);
  return {
    id: "seito", nm: "聖都エリュシス", g, tier: 0, bg: null, music: "town",
    objs: [
      { t: "house", x: 7, y: 2, w: 10, h: 5, roof: "blue", door: 5, chimney: 0, sign: "大聖堂" },          // 大聖堂（扉 12,7）
      { t: "column", x: 6, y: 7 }, { t: "column", x: 17, y: 7 },
      { t: "house", x: 1, y: 9, w: 5, h: 3, roof: "brown", door: 2, sign: "大書庫" },                          // 大書庫（扉 3,12）
      { t: "house", x: 18, y: 9, w: 5, h: 3, roof: "green", door: 2, sign: "宿", kind: "inn", nm: "聖都の宿坊" }, // 宿坊
      { t: "house", x: 2, y: 18, w: 4, h: 2, roof: "red", door: 1 }, { t: "house", x: 18, y: 18, w: 4, h: 2, roof: "blue", door: 2, chimney: 1 },
      { t: "fountain", x: 11, y: 14 }, { t: "fountain", x: 12, y: 14 }, { t: "stall", x: 14, y: 17, w: 2 }, { t: "bell", x: 20, y: 5 },
    ],
    exits: [{ x: 11, y: H - 1, to: "junrei", tx: 8, ty: 1, dir: 0 }, { x: 12, y: H - 1, to: "junrei", tx: 9, ty: 1, dir: 0 }],
    npcs: [
      { id: "monso", x: 11, y: 8, img: "person_078m", dir: 0, nm: "門の僧", talk: "monso" },
      { id: "ordo", x: 13, y: 8, img: "person_008", dir: 0, nm: "オルド", talk: "ordo", card: g => S(g) >= 69, when: g => S(g) >= 69 || cut(g, "c4s7") },
      { id: "hoshigashi", x: 15, y: 17, img: "person_075h", dir: 0, nm: "星菓子売り", talk: "tt", tp: "seito" },
      { id: "kanetsukiS", x: 20, y: 6, img: "person_071b", dir: 0, nm: "鐘つきの老僧", talk: "tt", tp: "seito" },
      { id: "seitonoko", x: 10, y: 15, img: "person_109h", dir: 2, nm: "聖都の子", talk: "tt", tp: "seito" },
      { id: "junreiM2", x: 17, y: 13, img: "person_074w", dir: 1, nm: "巡礼の男", talk: "tt", tp: "seito", when: g => S(g) >= 69 },
      { id: "junreiF2", x: 17, y: 14, img: "person_026w", dir: 1, nm: "巡礼の女", talk: "tt", tp: "seito", when: g => S(g) >= 69 },
    ],
    foes: [], chests: [],
    trigs: [
      { x: 11, y: H - 3, w: 2, h: 2, when: g => S(g) === 68, run: "c4s7" },
      { x: 3, y: 12, run: "shokoDoor" },
      { x: 12, y: 7, run: "seidoDoor" },
    ],
  };
}
function shoko() { // 聖都の大書庫
  const g = grid(13, 9, "w"); fill(g, "p", 1, 1, 11, 7); g[8][6] = "D";
  return {
    id: "shoko", nm: "聖都の大書庫", g, tier: 0, bg: null, inside: 1, music: "town",
    objs: [
      { t: "itae", x: 5, y: 0, w: 3, h: 2, talk: "itae" },
      ...[1, 2, 3, 9, 10, 11].map(x => ({ t: "shelf", x, y: 1, text: ["天井まで本が詰まっている。"] })), ...[1, 2, 10, 11].map(x => ({ t: "shelf", x, y: 4, text: ["古い記録の棚。どの本にも、顔の削られた絵のことは書いていない。"] })),
      { t: "table", x: 4, y: 5 }, { t: "chair", x: 8, y: 6 },
    ],
    exits: [{ x: 6, y: 8, to: "seito", tx: 3, ty: 13, dir: 0 }],
    npcs: [
      { id: "riko", x: 6, y: 3, img: "person_129r", dir: 0, nm: "リコ", talk: "riko", card: g => S(g) >= 70 },
      { id: "totoSh", x: 8, y: 5, img: "person_100", dir: 3, nm: "トト", talk: "totoL", card: () => 1, when: g => S(g) >= 69 },
    ],
    foes: [], chests: [],
    trigs: [{ x: 4, y: 3, w: 5, h: 4, when: g => S(g) === 69, run: "c4s8" }],
  };
}
// ---------- 大聖堂・沈黙の回廊（S6）：手を組んだ石の聖人像が並ぶ長い回廊。突き当たりに守護像 ----------
function kairou() {
  const W = 13, H = 26, g = grid(W, H, "w"); fill(g, "p", 2, 1, 9, 24); g[H - 1][6] = "D";
  fill(g, "w", 2, 8, 3, 2); fill(g, "w", 8, 8, 3, 2); fill(g, "w", 2, 15, 3, 2); fill(g, "w", 8, 15, 3, 2);
  return {
    id: "kairou", nm: "沈黙の回廊", g, tier: 4, bg: "stone", inside: 1, afterWin: "kairouWin",
    objs: [
      ...[3, 6, 11, 13, 19, 22].map(y => ({ t: "statue", x: 2, y, text: ["手を組んだ石の聖人像。目を閉じている。"] })), ...[3, 6, 11, 13, 19, 22].map(y => ({ t: "statue", x: 10, y, text: ["手を組んだ石の聖人像。目を閉じている。"] })),
      { t: "stele", x: 7, y: 2, text: ["問う者は、まず己に問え。"] }, { t: "candleStand", x: 4, y: 1 }, { t: "candleStand", x: 8, y: 1 },
    ],
    exits: [{ x: 6, y: H - 1, to: "seito", tx: 12, ty: 8, dir: 0 }, ...((window.GS && GS.G && (GS.G.flags.s || 0) >= 73) ? [{ x: 6, y: 1, to: "hoshinoma", tx: 5, ty: 7, dir: 3 }] : [])],
    npcs: [
      { id: "kairouso", x: 5, y: 23, img: "person_078k", dir: 3, nm: "回廊の僧", talk: "tt", tp: "seito" },
      { id: "shugozoN", x: 6, y: 1, mon: "monster_065", face: 1, big: 1, nm: "沈黙の守護像", when: g => S(g) < 73 },
    ],
    foes: [
      { id: "kr1", x: 6, y: 20, k: "inoriseki", g: ["inoriseki", "rouko"] },
      { id: "kr2", x: 6, y: 12, k: "kanetsuki", g: ["kanetsuki", "irogarasu", "rouko"] },
      { id: "kr3", x: 4, y: 5, k: "irogarasu", g: ["irogarasu", "irogarasu"] },
      { id: "kr4", x: 9, y: 17, k: "rouko", g: ["rouko", "inoriseki"] },
    ],
    chests: [{ id: "c_kairou1", x: 3, y: 17, item: "knightswd" }, { id: "c_kairou2", x: 9, y: 4, tool: "onigiri" }],
    trigs: [{ x: 3, y: 3, w: 7, h: 1, when: g => S(g) === 72, run: "c4s10" }],
  };
}
function hoshinoma() { // 星の間：硝子の丸屋根。床に星図
  const W = 11, H = 9, g = grid(W, H, "w"); fill(g, "N", 1, 1, 9, 7); g[H - 1][5] = "D";
  return {
    id: "hoshinoma", nm: "星の間", g, tier: 4, bg: "stone", inside: 1, music: null,
    objs: [{ t: "candleStand", x: 1, y: 1 }, { t: "candleStand", x: 9, y: 1 }],
    exits: [{ x: 5, y: H - 1, to: "kairou", tx: 6, ty: 2, dir: 0 }],
    npcs: [
      { id: "mifaH", x: 5, y: 2, img: "person_011", dir: 0, nm: "ミーファ", col: 1, when: g => S(g) === 73 || cut(g, "c4s11") },
      { id: "ordoH", x: 4, y: 5, img: "person_008", dir: 3, nm: "", when: g => cut(g, "c4s12") },
      { id: "kuroH1", x: 3, y: 6, mon: "monster_077", face: 1, nm: "", when: g => cut(g, "c4s11b") },
      { id: "kuroH2", x: 7, y: 6, mon: "monster_076", face: -1, nm: "", when: g => cut(g, "c4s11b") },
    ],
    foes: [], chests: [],
    trigs: [{ x: 2, y: 4, w: 7, h: 3, when: g => S(g) === 73, run: "c4s11" }],
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
  } else if (d.kind === "dona") { // ドナの家（村長の家）：囲炉裏と寝床。第8章の場面2で、ミーファが目を覚ます
    objs.push({ t: "hearth", x: X(1), y: 0 }, { t: "bed", x: X(W - 2), y: 1, w: 1, h: 2 }, { t: "table", x: X(2), y: H - 3 }, { t: "chair", x: X(3), y: H - 3 }, { t: "shelf", x: X(W - 3), y: 1, text: ["弁当箱が並んでいる。ふたに名前。「カイ」と書いた箱もある。"] });
    const G0 = root.GS && GS.G, c = G0 && G0.flags.cut;
    if (c === "c8s2b" || c === "c8s2b2") {
      npcs.push({ id: "donaH", x: X(2), y: 2, img: "person_077", dir: 0, nm: "ドナ" });
      npcs.push({ id: "mifaH", x: X(W - 2), y: 1, img: "person_011", dir: c === "c8s2b" ? 4 : 0, col: c === "c8s2b" ? 2 : 1, head: 1, nm: "ミーファ" });
    }
  } else if (d.kind === "nel") { // ネルの家：寄り道の仲間トビーを逃したときは、ここにトビーがいる（段階6から）
    objs.push({ t: "shelf", x: X(1), y: 1 }, { t: "bed", x: X(W - 2), y: 1, w: 1, h: 2 }, { t: "table", x: X(2), y: H - 3 }, { t: "chair", x: X(3), y: H - 3 });
    const G0 = root.GS && GS.G; if (G0 && (G0.flags.s || 0) >= 96 && !G0.roster.includes(16)) npcs.push({ id: "tobyH", x: X(dx), y: 2, img: "person_080", dir: 0, nm: "トビー", talk: "tobyHome" });
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
    id: "minka", nm: d.nm || "民家", g, tier: 0, bg: null, inside: 1, music: "town", noFollow: d.kind === "dona" && GS0() && /^c8s2b/.test(GS0().flags.cut || "") ? 1 : 0,
    objs, npcs, foes: [], chests: [], trigs: [],
    exits: [{ x: dx, y: H - 1, to: d.from, tx: d.rx, ty: d.ry, dir: 0 }],
  };
}

root.MINKA_FOLK = MINKA_FOLK;
root.MAPS = { fushaoka, uroko, doromiya, tsuno, hyakudan, kagenohara, kuuza, gyokuza, kuriya, jouheki, kiba, tsukihoe, tsubasa, kazakiri, tetsumon, iteno, camp, duga, touge, itadaki, yamamichi, yakatagai, yakata, kura, ekken, kairoJ, kyakuma, junrei, seito, shoko, kairou, hoshinoma, seirena, funasaka, kaizoku, kaizoku2, uchiumi, kareta, gankutsu, gankutsu2, kyobai, zroof, minka, kinsa, zahara, shokan, casino, arena, zinn, tsuya, akamugi, hoshimi, shinjo, nakaniwa, kakurega, yakuba, crypt1, crypt2, kiroku, plain, milna, lux, sakaba, hut, ferry, village, river, sandbar, forest, hermit, shrine, road0, road1, harune, kawauso, toiya, ohashi, tower1, tower2, towerTop };
})(typeof window !== "undefined" ? window : globalThis);
