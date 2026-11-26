// フィールドの地面と置き物の絵。人物の絵と同じ点の細かさ（1マス＝48点。画面では半分の24ドット）で描く
// 夕暮れどきの色にそろえる（戦闘の背景も夕方〜夜の色なので、行き来しても明るさが飛ばないように）
(function (root) {
"use strict";
const T = 48;

function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + (s || 0) * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function R(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); }
function blob(c, col, cx, cy, rx, ry) { c.fillStyle = col; for (let dy = -ry; dy <= ry; dy++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2))); c.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2, 1); } }

const P = {
  grass: ["#41603a", "#4a6b40", "#557748", "#628350"], grassDark: "#36502f", flower: ["#cdb56a", "#b98290", "#d7d0b6"],
  dirt: ["#7f6849", "#8b7352", "#977e5b"], dirtDark: "#6a5639", pebble: "#5d4c36",
  cobble: ["#6f6762", "#7b726b", "#867c74"], mortar: "#55504e",
  water: ["#284c63", "#2f5873", "#3a6884"], foam: "#9cbccc", shore: "#5d5240",
  leaf: ["#263f2f", "#2f4a35", "#3b5a3e", "#4b6d47"], trunk: "#4d3727", trunkL: "#6b4d34",
  rock: ["#4f4a55", "#625c68", "#7a7380"], rockTop: "#8c8590",
  cave: ["#2a2532", "#352f3f", "#433b4e"], caveFloor: ["#4a4038", "#544940", "#5f5248"],
  wood: ["#6e5238", "#8a6a48", "#a3815a"],
};

// ---- 地面（周りに合わせて縁を描く） ----
function grass(c, x, y, plain) {
  R(c, P.grass[1], 0, 0, T, T);
  const r = rng(hash(x, y, 1) * 1e9);
  for (let i = 0; i < 70; i++) R(c, P.grass[(r() * 4) | 0], (r() * T) | 0, (r() * T) | 0, 2, 2);
  for (let i = 0; i < 10; i++) { const gx = (r() * 44) | 0, gy = (r() * 42) | 0; R(c, P.grassDark, gx, gy + 2, 2, 4); R(c, P.grass[3], gx + 2, gy, 2, 4); }
  if (!plain && hash(x, y, 7) < 0.16) for (let i = 0; i < 4; i++) { const fx = 6 + ((r() * 34) | 0), fy = 6 + ((r() * 34) | 0); R(c, P.flower[(r() * 3) | 0], fx, fy, 2, 2); R(c, "#2c4228", fx, fy + 2, 2, 2); }
}
function dirt(c, x, y, nb) {
  R(c, P.dirt[1], 0, 0, T, T);
  const r = rng(hash(x, y, 2) * 1e9);
  for (let i = 0; i < 60; i++) R(c, P.dirt[(r() * 3) | 0], (r() * T) | 0, (r() * T) | 0, 2 + ((r() * 3) | 0), 2);
  for (let i = 0; i < 5; i++) R(c, P.pebble, (r() * 44) | 0, (r() * 44) | 0, 2, 2);
  fringe(c, x, y, nb, ch => !"=b".includes(ch) && ch !== "c", P.grass);
}
function cobble(c, x, y, nb) {
  R(c, P.mortar, 0, 0, T, T);
  for (let row = 0; row < 6; row++) {
    const off = (row % 2) * 6 + (((x + y) % 2) * 3);
    for (let col = -1; col < 5; col++) {
      const sx = col * 12 + off, sy = row * 8, h = hash(x * 7 + col, y * 7 + row, 3);
      R(c, P.cobble[(h * 3) | 0], sx + 1, sy + 1, 10, 6);
      R(c, "#958b83", sx + 1, sy + 1, 10, 1);
    }
  }
  fringe(c, x, y, nb, ch => !"c=".includes(ch), P.grass);
}
// 隣が別の地面なら、草の縁をぎざぎざに乗せる
function fringe(c, x, y, nb, isOther, pal) {
  const r = rng(hash(x, y, 9) * 1e9);
  const sides = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  sides.forEach(([dx, dy], si) => {
    if (!isOther(nb(dx, dy))) return;
    for (let i = 0; i < T; i += 2) {
      const d = 2 + ((r() * 5) | 0);
      const col = pal[(r() * 3) | 0];
      if (si === 0) R(c, col, i, 0, 2, d); else if (si === 1) R(c, col, i, T - d, 2, d);
      else if (si === 2) R(c, col, 0, i, d, 2); else R(c, col, T - d, i, d, 2);
    }
  });
}
function water(c, x, y, nb, frame) {
  R(c, P.water[1], 0, 0, T, T);
  const r = rng(hash(x, y, 4) * 1e9 + frame * 77);
  for (let i = 0; i < 9; i++) { const wx = (r() * 40) | 0, wy = (r() * 44) | 0; R(c, P.water[2], wx, wy, 6 + ((r() * 6) | 0), 1); }
  for (let i = 0; i < 5; i++) R(c, P.water[0], (r() * 44) | 0, (r() * 44) | 0, 4, 2);
  if (hash(x, y, 5 + frame) < 0.5) R(c, P.foam, 10 + ((r() * 26) | 0), 8 + ((r() * 30) | 0), 4, 1);
  const land = ch => !"~b".includes(ch);
  if (land(nb(0, -1))) { R(c, P.shore, 0, 0, T, 4); R(c, P.foam, 0, 4, T, 1); }
  if (land(nb(0, 1))) { R(c, P.foam, 0, T - 3, T, 1); R(c, "#1f3a4d", 0, T - 2, T, 2); }
  if (land(nb(-1, 0))) { R(c, P.shore, 0, 0, 3, T); R(c, P.foam, 3, 0, 1, T); }
  if (land(nb(1, 0))) { R(c, P.shore, T - 3, 0, 3, T); R(c, P.foam, T - 4, 0, 1, T); }
}
function bridge(c, x, y, nb, frame) {
  water(c, x, y, nb, frame);
  R(c, P.wood[0], 4, 0, 40, T);
  for (let i = 0; i < 6; i++) { R(c, P.wood[1 + (i % 2)], 6, i * 8 + 1, 36, 6); R(c, P.wood[0], 6, i * 8 + 7, 36, 1); }
  R(c, "#4a3624", 2, 0, 3, T); R(c, "#4a3624", 43, 0, 3, T);
}
function stones(c, x, y, nb, frame) { // 浅瀬の飛び石（歩ける）
  water(c, x, y, nb, frame);
  for (const [sx, sy] of [[8, 10], [26, 22], [12, 32]]) { blob(c, "#4a4652", sx + 6, sy + 5, 8, 5); blob(c, "#7d7685", sx + 6, sy + 4, 7, 4); R(c, "#9a93a0", sx + 2, sy + 1, 5, 1); }
}
function rockWall(c, x, y, nb) { // 岩（通れない）：草の上に丸い岩が積み重なる
  grass(c, x, y, true);
  const r = rng(hash(x, y, 6) * 1e9);
  const rocks = [[14 + r() * 6, 30 + r() * 4, 14, 11], [32 + r() * 6, 32 + r() * 4, 13, 10], [24 + r() * 4, 18 + r() * 4, 15, 12]];
  for (const [cx, cy, rx, ry] of rocks) {
    blob(c, "#2e2b33", cx, cy + 3, rx, ry);
    blob(c, P.rock[1], cx, cy, rx, ry);
    blob(c, P.rock[2], cx - 3, cy - 3, rx * 0.6, ry * 0.55);
    R(c, P.rockTop, cx - rx * 0.5, cy - ry * 0.7, 6, 2);
    R(c, "#3a3640", cx + 2, cy + 2, 4, 2);
  }
}
function caveWall(c, x, y, nb) {
  const below = nb(0, 1);
  if (below !== "W" && below !== "#") { // こちら向きの壁の面
    R(c, P.cave[1], 0, 0, T, T);
    const r = rng(hash(x, y, 8) * 1e9);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) { const bx = col * 16 + (row % 2) * 8 - 4, by = row * 12; R(c, P.cave[2], bx + 1, by + 1, 14, 10); R(c, "#4e465a", bx + 1, by + 1, 14, 1); if (r() < 0.3) R(c, P.cave[0], bx + 5, by + 5, 4, 2); }
    R(c, "#1d1924", 0, T - 3, T, 3);
  } else {
    R(c, P.cave[0], 0, 0, T, T);
    const r = rng(hash(x, y, 8) * 1e9);
    for (let i = 0; i < 12; i++) R(c, "#231f2b", (r() * 44) | 0, (r() * 44) | 0, 4, 3);
  }
}
function caveFloor(c, x, y) {
  R(c, P.caveFloor[1], 0, 0, T, T);
  const r = rng(hash(x, y, 10) * 1e9);
  for (let i = 0; i < 40; i++) R(c, P.caveFloor[(r() * 3) | 0], (r() * T) | 0, (r() * T) | 0, 3, 2);
  for (let i = 0; i < 3; i++) { const sx = (r() * 40) | 0, sy = (r() * 40) | 0; R(c, "#3c332d", sx, sy + 3, 6, 2); R(c, "#6f6155", sx, sy, 6, 3); }
}
function rail(c, x, y) { caveFloor(c, x, y); R(c, "#3b3029", 0, 10, T, 4); R(c, "#3b3029", 0, 34, T, 4); for (let i = 0; i < 4; i++) R(c, "#5e4a3a", i * 12 + 2, 6, 6, 36); R(c, "#7d7480", 0, 12, T, 2); R(c, "#7d7480", 0, 36, T, 2); }
function fence(c, x, y, nb) {
  grass(c, x, y, true);
  const hz = "fF".includes(nb(-1, 0)) || "fF".includes(nb(1, 0));
  if (hz || !"fF".includes(nb(0, -1))) { R(c, P.wood[0], 0, 18, T, 4); R(c, P.wood[2], 0, 18, T, 1); R(c, P.wood[0], 0, 30, T, 4); R(c, P.wood[2], 0, 30, T, 1); }
  if ("fF".includes(nb(0, -1)) || "fF".includes(nb(0, 1))) R(c, P.wood[0], 21, 0, 6, T);
  R(c, "#3e2c1d", 20, 12, 8, 30); R(c, P.wood[2], 21, 12, 6, 2); R(c, "#2a1f15", 20, 42, 8, 2);
}

// ---- 木（幹は地面に、葉は上の層に描く。葉が北のマスにはみ出すので、奥の人が隠れる） ----
function treeBase(c, x, y, nb) { grass(c, x, y, true); R(c, "#2a3a26", 12, 36, 24, 6); R(c, P.trunk, 19, 22, 10, 18); R(c, P.trunkL, 20, 22, 3, 16); }
function treeTop(c, x, y) { // 48×72（上に24はみ出す）
  const r = rng(hash(x, y, 11) * 1e9), cx = 24 + ((r() * 4) | 0) - 2;
  blob(c, P.leaf[0], cx, 34, 22, 20);
  blob(c, P.leaf[1], cx - 2, 30, 20, 18);
  blob(c, P.leaf[2], cx - 5, 24, 14, 12);
  blob(c, P.leaf[3], cx - 8, 18, 7, 5);
  for (let i = 0; i < 18; i++) R(c, P.leaf[(r() * 2) | 0], cx - 18 + ((r() * 36) | 0), 16 + ((r() * 34) | 0), 2, 2);
  for (let i = 0; i < 8; i++) R(c, P.leaf[3], cx - 14 + ((r() * 20) | 0), 12 + ((r() * 16) | 0), 2, 2);
}

// ---- 家（マスの四角で受け取り、屋根・壁・戸・窓を描く） ----
const ROOF = { red: ["#6e3529", "#8a4535", "#a35a44"], blue: ["#3b4659", "#4b5870", "#606f88"], green: ["#36493a", "#465e48", "#5a7559"], brown: ["#4f3a2b", "#654a36", "#7d5d44"] };
function house(c, w, h, o) { // w,h はマス数
  const W = w * T, H = h * T, roof = ROOF[o.roof || "red"], wallH = Math.round(H * 0.42), roofH = H - wallH;
  // 屋根（段のついた瓦）
  R(c, roof[0], 2, 6, W - 4, roofH - 4);
  for (let yy = 8; yy < roofH - 4; yy += 6) { R(c, roof[1], 4, yy, W - 8, 4); for (let xx = 4 + (yy % 12 ? 6 : 0); xx < W - 8; xx += 12) R(c, roof[2], xx, yy, 6, 1); }
  R(c, roof[2], 2, 6, W - 4, 2); R(c, "#2b1c17", 0, roofH - 4, W, 4);
  if (o.chimney) { R(c, "#4a3f3c", W - 40, 0, 12, 18); R(c, "#6b5d58", W - 40, 0, 12, 3); }
  // 壁（しっくいと木の柱）
  const wy = roofH;
  R(c, "#b9a68a", 0, wy, W, wallH); R(c, "#cdbb9d", 0, wy, W, 3);
  for (let xx = 0; xx <= W; xx += T) R(c, "#5d4433", Math.min(W - 4, xx), wy, 4, wallH);
  R(c, "#5d4433", 0, wy + 2, W, 3); R(c, "#3e2e22", 0, H - 4, W, 4);
  // 窓（灯りがともる）
  for (let i = 0; i < w; i++) {
    if (i === o.door) continue;
    const wx = i * T + 14, wyy = wy + 8;
    R(c, "#3e2e22", wx - 2, wyy - 2, 24, 18); R(c, "#e2b76a", wx, wyy, 20, 14); R(c, "#f2d79a", wx, wyy, 20, 3); R(c, "#3e2e22", wx + 9, wyy, 2, 14);
  }
  // 戸
  const dx = o.door * T + 12;
  R(c, "#2d2119", dx - 2, H - wallH + 4, 28, wallH - 4); R(c, "#5e412d", dx, H - wallH + 6, 24, wallH - 8); R(c, "#76563b", dx + 2, H - wallH + 8, 8, wallH - 12); R(c, "#d6ad5c", dx + 18, H - wallH / 2, 3, 3);
  // 看板
  if (o.sign) {
    const sx = (o.door + (o.door > 0 ? -1 : 1)) * T + 6, sy = wy + 4;
    R(c, "#3e2e22", sx, sy, 36, 22); R(c, "#d9c49b", sx + 2, sy + 2, 32, 18);
    c.fillStyle = "#3a2a1c"; c.font = "bold 16px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(o.sign, sx + 18, sy + 12);
  }
}
function well(c) { // 1マス
  grass(c, 0, 0, true);
  blob(c, "#3a3640", 24, 30, 18, 12); blob(c, "#6d6670", 24, 28, 17, 11); blob(c, "#1c2c3a", 24, 28, 11, 6);
  R(c, "#5a4030", 6, 4, 4, 26); R(c, "#5a4030", 38, 4, 4, 26); R(c, "#7a5a40", 4, 2, 40, 4);
}
function sign(c) { R(c, "#3e2c1d", 22, 22, 4, 22); R(c, "#3e2e22", 8, 8, 32, 18); R(c, "#b9965f", 10, 10, 28, 14); R(c, "#7d6240", 13, 14, 22, 2); R(c, "#7d6240", 13, 18, 16, 2); }
function chest(c, open) {
  R(c, "#2a1d14", 8, 18, 32, 24); R(c, "#7a4f2c", 10, 20, 28, 20); R(c, "#99673a", 10, 20, 28, 3);
  if (open) { R(c, "#1a120c", 12, 22, 24, 8); R(c, "#5a3a20", 8, 10, 32, 10); } else { R(c, "#5a3a20", 8, 16, 32, 8); R(c, "#99673a", 10, 16, 28, 2); }
  R(c, "#c9a253", 22, 24, 4, 6); R(c, "#c9a253", 10, 30, 28, 2);
}
function stall(c, w) { // 露店（屋根の布＋台）
  const W = w * T;
  for (let i = 0; i < W; i += 12) { R(c, i % 24 ? "#d9c49b" : "#8a4535", i, 4, 12, 14); }
  R(c, "#3e2e22", 0, 18, W, 3); R(c, "#5d4433", 4, 18, 4, 26); R(c, "#5d4433", W - 8, 18, 4, 26);
  R(c, "#6e5238", 2, 30, W - 4, 12); R(c, "#8a6a48", 2, 30, W - 4, 2);
}
function mineGate(c) { // 坑道の入り口（2マス幅×2マス高）
  R(c, P.rock[0], 0, 0, 96, 96); for (let i = 0; i < 10; i++) R(c, P.rock[1 + (i % 2)], (i * 23) % 80, (i * 37) % 70, 16, 10);
  R(c, "#0f0c12", 22, 30, 52, 66); blob(c, "#0f0c12", 48, 32, 26, 12);
  R(c, "#6e5238", 18, 26, 8, 70); R(c, "#6e5238", 70, 26, 8, 70); R(c, "#8a6a48", 14, 20, 68, 8); R(c, "#a3815a", 14, 20, 68, 2);
}
function rubble(c) { caveFloor(c, 0, 0); blob(c, "#3a3640", 24, 30, 20, 13); blob(c, "#625c68", 22, 26, 17, 10); blob(c, "#7a7380", 18, 22, 8, 5); }

root.TL = { T, P, hash, rng, R, blob, grass, dirt, cobble, water, bridge, stones, rockWall, caveWall, caveFloor, rail, fence, treeBase, treeTop, house, well, sign, chest, stall, mineGate, rubble };
})(window);
