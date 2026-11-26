// 地図（仮の物語。名前や会話は、物語が届いたら差し替える）
// 地面の文字：.草 =土の道 c石畳 T木 ~水 b橋 s飛び石 R岩 f柵 W坑道の壁 _坑道の床 r線路
(function (root) {
"use strict";
function grid(w, h, ch) { return Array.from({ length: h }, () => Array(w).fill(ch)); }
function fill(g, ch, x, y, w, h) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (g[j] && g[j][i] !== undefined) g[j][i] = ch; }
function put(g, x, y, s) { [...s].forEach((ch, i) => { if (ch !== " " && g[y] && g[y][x + i] !== undefined) g[y][x + i] = ch; }); }

// ---------- カロの町 ----------
function town() {
  const g = grid(20, 24, ".");
  fill(g, "T", 0, 0, 20, 2); fill(g, "T", 0, 0, 2, 24); fill(g, "T", 18, 0, 2, 24);
  fill(g, "f", 2, 2, 16, 1); fill(g, "f", 2, 2, 1, 21); fill(g, "f", 17, 2, 1, 21); fill(g, "f", 2, 22, 16, 1);
  fill(g, "c", 9, 6, 2, 18); fill(g, "c", 5, 6, 10, 1); fill(g, "c", 3, 11, 14, 1); fill(g, "c", 3, 18, 14, 1);
  fill(g, "T", 0, 23, 9, 1); fill(g, "T", 11, 23, 9, 1);
  return {
    id: "town", nm: "カロの町", g, tier: 0, bg: null,
    objs: [
      { t: "house", x: 7, y: 3, w: 6, h: 3, roof: "brown", door: 2, chimney: 1 },
      { t: "house", x: 3, y: 8, w: 5, h: 3, roof: "red", door: 3, sign: "宿" },
      { t: "house", x: 12, y: 8, w: 5, h: 3, roof: "green", door: 1, sign: "武" },
      { t: "house", x: 3, y: 15, w: 5, h: 3, roof: "blue", door: 3, sign: "賭", chimney: 1 },
      { t: "house", x: 12, y: 15, w: 5, h: 3, roof: "red", door: 2 },
      { t: "well", x: 13, y: 13 },
      { t: "stall", x: 12, y: 20, w: 2 },
      { t: "sign", x: 8, y: 20, text: ["カロの町"] },
    ],
    exits: [{ x: 9, y: 23, to: "road", tx: 10, ty: 42, dir: 3 }, { x: 10, y: 23, to: "road", tx: 11, ty: 42, dir: 3 }],
    npcs: [
      { id: "elder", x: 11, y: 6, img: "person_019", dir: 0, nm: "町の長", talk: "elder" },
      { id: "inn", x: 6, y: 12, img: "person_026", dir: 3, nm: "宿のおかみ", talk: "inn" },
      { id: "smith", x: 13, y: 12, img: "person_014", dir: 3, nm: "武器屋", talk: "shop" },
      { id: "boss", x: 6, y: 19, img: "person_030", dir: 3, nm: "賭場の主ガロ", talk: "casino" },
      { id: "molt", x: 15, y: 14, img: "person_074", dir: 1, nm: "荷運びのモルト", talk: "duel0" },
      { id: "baba", x: 4, y: 13, img: "person_077", dir: 2, nm: "札読みの婆さま", talk: "duel1" },
      { id: "kid", x: 11, y: 16, img: "person_069", dir: 0, nm: "町の子", talk: "kid" },
      { id: "lady", x: 7, y: 7, img: "person_070", dir: 0, nm: "町の人", talk: "lady" },
      { id: "gate", x: 8, y: 21, img: "person_080", dir: 0, nm: "門番", talk: "gate" },
      { id: "cards", x: 13, y: 21, img: "person_101", dir: 0, nm: "札売り", talk: "cardshop" },
    ],
    foes: [], chests: [],
  };
}

// ---------- カロ街道（町の北。川の向こうの林は背伸びの寄り道） ----------
function road() {
  const W = 24, H = 44, g = grid(W, H, ".");
  fill(g, "T", 0, 0, 1, H); fill(g, "T", W - 1, 0, 1, H); fill(g, "T", 0, 0, W, 1);
  fill(g, "T", 0, H - 1, W, 1);
  // 森のかたまり
  fill(g, "T", 1, 1, 3, 4); fill(g, "T", 6, 1, 3, 3); fill(g, "T", 1, 9, 2, 8); fill(g, "T", 7, 10, 2, 6);
  fill(g, "T", 1, 30, 4, 6); fill(g, "T", 14, 31, 4, 3); fill(g, "T", 18, 29, 5, 9); fill(g, "T", 1, 39, 7, 4); fill(g, "T", 15, 39, 7, 4);
  fill(g, "T", 13, 2, 2, 5); fill(g, "T", 13, 16, 2, 5);
  // 東の川（南北）と、南の川（東西）
  fill(g, "~", 15, 1, 2, 27); fill(g, "~", 0, 26, 17, 2);
  fill(g, "R", 1, 22, 3, 3); fill(g, "R", 6, 23, 2, 2);
  // 林（川の向こう）
  fill(g, "T", 17, 1, 6, 28); fill(g, ".", 18, 3, 4, 18); fill(g, "T", 19, 9, 1, 2); fill(g, "T", 21, 14, 1, 2); fill(g, "T", 18, 18, 1, 1);
  fill(g, "T", 19, 3, 1, 3); fill(g, "T", 21, 3, 1, 3); fill(g, "T", 20, 3, 1, 1); // 宝箱のくぼみ（入れるのは南からだけ）
  // 道
  fill(g, "=", 10, 2, 2, 41);            // 南北の本道（町〜北の崖崩れ）
  fill(g, "b", 10, 26, 2, 2);            // 南の川の橋
  fill(g, "=", 4, 18, 8, 2);             // 西へ曲がる道
  fill(g, "=", 4, 7, 2, 13);             // 坑道へ
  fill(g, "=", 12, 12, 3, 2);            // 川辺へ
  fill(g, "s", 15, 12, 2, 1);            // 飛び石
  fill(g, ".", 17, 11, 1, 3);            // 林の入り口
  fill(g, "R", 9, 1, 4, 1); fill(g, "R", 9, 0, 4, 1); // 崖崩れ
  fill(g, "=", 10, 42, 2, 2); fill(g, "T", 0, 43, 10, 1); fill(g, "T", 12, 43, 12, 1);
  return {
    id: "road", nm: "カロ街道", g, tier: 1, bg: "meadow",
    objs: [
      { t: "mine", x: 4, y: 5 },
      { t: "sign", x: 12, y: 20, text: ["西：古い坑道", "南：カロの町"] },
    ],
    exits: [
      { x: 10, y: 43, to: "town", tx: 9, ty: 21, dir: 3 }, { x: 11, y: 43, to: "town", tx: 10, ty: 21, dir: 3 },
      { x: 4, y: 6, to: "mine", tx: 8, ty: 28, dir: 3 }, { x: 5, y: 6, to: "mine", tx: 9, ty: 28, dir: 3 },
    ],
    npcs: [
      { id: "slide", x: 12, y: 3, img: "person_072", dir: 1, nm: "見張りの男", talk: "slide" },
    ],
    // 見える敵。g＝顔ぶれ、tier＝強さの段階（成長の上限にも使う）
    foes: [
      { id: "r1", x: 12, y: 36, k: "slime", g: ["slime", "slime", "rat"] },
      { id: "r2", x: 8, y: 33, k: "rat", g: ["rat", "rat", "rabbit"] },
      { id: "r3", x: 13, y: 22, k: "bat", g: ["bat", "slime", "slime"] },
      { id: "r4", x: 6, y: 15, k: "shroom", g: ["shroom", "rabbit", "rabbit"] },
      { id: "r5", x: 9, y: 8, k: "bat", g: ["bat", "bat", "rat", "rat"] },
      { id: "r6", x: 3, y: 19, k: "rabbit", g: ["rabbit", "rabbit", "slime", "rat"] },
      { id: "g1", x: 20, y: 16, k: "dog", g: ["dog", "dog", "dog", "goblin", "goblin"], tier: 3, bg: "canopy", chase: 1 },
      { id: "g2", x: 20, y: 6, k: "treant", g: ["treant", "dog", "dog", "goblin", "goblin"], tier: 3, bg: "canopy", guard: 1 },
    ],
    chests: [
      { id: "c_grove", x: 20, y: 4, item: "oldblade" },
      { id: "c_road", x: 2, y: 20, gold: 80 },
    ],
  };
}

// ---------- 古い坑道（奥に親玉） ----------
function mine() {
  const W = 18, H = 30, g = grid(W, H, "W");
  fill(g, "_", 8, 22, 2, 8);            // 入口の通路
  fill(g, "_", 3, 16, 12, 7);           // 広間
  fill(g, "_", 13, 9, 2, 8);            // 東の通路
  fill(g, "_", 3, 9, 11, 2);            // 北の通路
  fill(g, "_", 3, 9, 2, 3);
  fill(g, "_", 4, 2, 10, 7);            // 親玉の間
  fill(g, "r", 8, 23, 2, 6); fill(g, "r", 3, 19, 9, 1);
  fill(g, "x", 6, 17, 1, 1); fill(g, "x", 12, 21, 1, 1);
  return {
    id: "mine", nm: "古い坑道", g, tier: 2, bg: "stone", dark: 1,
    objs: [],
    exits: [{ x: 8, y: 29, to: "road", tx: 4, ty: 7, dir: 0 }, { x: 9, y: 29, to: "road", tx: 5, ty: 7, dir: 0 }],
    npcs: [],
    foes: [
      { id: "m1", x: 8, y: 23, k: "goblin", g: ["goblin", "goblin", "shroom"] },
      { id: "m2", x: 5, y: 18, k: "dog", g: ["dog", "dog", "bat", "bat"], chase: 1 },
      { id: "m3", x: 13, y: 13, k: "goblin", g: ["goblin", "goblin", "goblin"] },
      { id: "m4", x: 7, y: 10, k: "shroom", g: ["shroom", "shroom", "bat", "bat", "bat"] },
      { id: "boss", x: 8, y: 4, k: "orc", g: ["orc"], boss: 1, bg: "stone" },
    ],
    chests: [
      { id: "c_mine1", x: 3, y: 16, item: "chain" },
      { id: "c_mine2", x: 14, y: 22, gold: 150 },
      { id: "c_mine3", x: 4, y: 11, item: "sagestaff" },
    ],
  };
}

root.MAPS = { town, road, mine };
})(window);
