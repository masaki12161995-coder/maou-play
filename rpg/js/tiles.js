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
  fringe(c, x, y, nb, ch => !"=bZU".includes(ch) && ch !== "c", P.grass);
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
  fringe(c, x, y, nb, ch => !"c=ZU".includes(ch), P.grass);
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
const ROOF = { gold: ["#8a6420", "#b08a30", "#d8b448"], sand: ["#8a6a48", "#a3815a", "#c09a6a"], red: ["#6e3529", "#8a4535", "#a35a44"], blue: ["#3b4659", "#4b5870", "#606f88"], green: ["#36493a", "#465e48", "#5a7559"], brown: ["#4f3a2b", "#654a36", "#7d5d44"] };
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


// ---- 家の中 ----
function floor(c, x, y) { // 板の床
  R(c, "#6b5038", 0, 0, T, T);
  for (let i = 0; i < 4; i++) { const yy = i * 12; R(c, i % 2 ? "#735840" : "#6b5038", 0, yy, T, 12); R(c, "#4e3a28", 0, yy + 11, T, 1); R(c, "#836648", 0, yy, T, 1); const j = (hash(x, y, i) * 36) | 0; R(c, "#4e3a28", j + 4, yy, 1, 12); }
  const r = rng(hash(x, y, 21) * 1e9); for (let i = 0; i < 6; i++) R(c, "#5c452f", (r() * 44) | 0, (r() * 46) | 0, 3, 1);
}
function wall(c, x, y, nb) { // 板の壁（下が床なら、壁の面を見せる）
  const face = "pD".includes(nb(0, 1));
  R(c, "#2a2019", 0, 0, T, T);
  if (face) { R(c, "#5a4634", 0, 8, T, 40); for (let i = 0; i < 4; i++) R(c, "#4a3929", i * 12 + 11, 8, 1, 40); R(c, "#6b5540", 0, 8, T, 2); R(c, "#33271e", 0, 44, T, 4); R(c, "#1c1511", 0, 0, T, 8); }
}
function voidT(c) { R(c, "#0b0d14", 0, 0, T, T); }
function door(c, x, y) { floor(c, x, y); R(c, "#2a2019", 0, 40, T, 8); R(c, "#c9a264", 10, 36, 28, 4); R(c, "#e8c98a", 12, 36, 24, 1); } // 出口（敷居）
// ---- 沼・畑・月夜草 ----
function marsh(c, x, y, nb, frame) {
  R(c, "#2c4a44", 0, 0, T, T);
  const r = rng(hash(x, y, 31) * 1e9);
  for (let i = 0; i < 26; i++) R(c, ["#27423d", "#34564c", "#3c6254"][(r() * 3) | 0], (r() * T) | 0, (r() * T) | 0, 4 + ((r() * 6) | 0), 2);
  for (let i = 0; i < 3; i++) { const lx = ((r() * 40) | 0) + (frame ? 1 : 0), ly = (r() * 40) | 0; R(c, "#8fb49a", lx, ly, 6, 1); }
  if (hash(x, y, 33) < 0.3) { const lx = 8 + ((r() * 24) | 0), ly = 8 + ((r() * 24) | 0); blob(c, "#3f6a3c", lx, ly, 6, 4); blob(c, "#5a8a4c", lx - 1, ly - 1, 4, 2); R(c, "#2c4a44", lx, ly, 6, 1); }
  for (const [dx, dy, ex, ey, ew, eh] of [[0, -1, 0, 0, T, 5], [0, 1, 0, T - 4, T, 4], [-1, 0, 0, 0, 4, T], [1, 0, T - 4, 0, 4, T]]) if (!"m".includes(nb(dx, dy))) { R(c, "#4a4634", ex, ey, ew, eh); R(c, "#35553a", ex, ey, ew, Math.min(eh, 2)); }
}
function crops(c, x, y) { // 畑のうね
  R(c, "#5a452e", 0, 0, T, T);
  for (let i = 0; i < 4; i++) { const yy = i * 12; R(c, "#6e5638", 0, yy + 2, T, 7); R(c, "#7d6442", 0, yy + 2, T, 2); R(c, "#43321f", 0, yy + 9, T, 3);
    for (let k = 0; k < 4; k++) { const px = k * 12 + 3 + ((hash(x, y, i * 4 + k) * 4) | 0); R(c, "#3f6a34", px, yy - 1, 6, 5); R(c, "#62944a", px + 1, yy - 2, 4, 3); R(c, "#8fbf62", px + 2, yy - 2, 2, 1); } }
}
function herb(c, x, y) { // 月夜草（青白く光る）
  grass(c, x, y, true);
  c.globalAlpha = 0.25; blob(c, "#bfe8ff", 24, 26, 16, 12); c.globalAlpha = 1;
  for (const [hx, hy] of [[16, 30], [24, 24], [32, 31]]) { R(c, "#4a7a6a", hx, hy, 2, 10); R(c, "#bfe8ff", hx - 3, hy - 4, 8, 5); R(c, "#f2fbff", hx - 1, hy - 3, 4, 2); }
}
// ---- 置き物 ----
function boat(c) { // 小舟（横3マス）。船尾に帆布
  const W = T * 3;
  blob(c, "#1b2f3d", W / 2, 34, 68, 12);
  blob(c, "#3e2a1c", W / 2, 26, 66, 15); blob(c, "#6e4c30", W / 2, 24, 62, 12); blob(c, "#8a6440", W / 2, 22, 56, 8); blob(c, "#5a3d27", W / 2, 24, 50, 6);
  for (const bx of [44, 72, 100]) { R(c, "#8a6440", bx, 17, 4, 14); R(c, "#a37a50", bx, 17, 1, 14); }
  blob(c, "#b8ad94", 112, 22, 14, 6); blob(c, "#d0c6ac", 110, 20, 10, 4); R(c, "#8e8470", 104, 24, 16, 1); // 帆布
  R(c, "#3e2a1c", 6, 20, 6, 4); R(c, "#3e2a1c", W - 12, 20, 6, 4);
}
function kaeri(c) { // 還り石（穴のあいた立ち石）
  blob(c, "#2a3a26", 24, 42, 14, 4);
  blob(c, "#4d4a55", 24, 26, 13, 20); blob(c, "#6a6672", 23, 24, 11, 18); blob(c, "#85808c", 20, 18, 5, 9);
  blob(c, "#1a1820", 24, 22, 5, 6); blob(c, "#bfe8ff", 24, 22, 2, 3);
  blob(c, "#4b6d47", 16, 38, 6, 3); blob(c, "#628350", 30, 12, 5, 2); R(c, "#4b6d47", 14, 30, 4, 3);
}
function stump(c) { // 大きな切り株（2×2マス）
  blob(c, "#2a3a26", 48, 78, 42, 10);
  R(c, "#4d3727", 10, 40, 76, 38); blob(c, "#4d3727", 48, 76, 38, 8);
  for (let i = 0; i < 9; i++) R(c, i % 2 ? "#3c2a1e" : "#5e4532", 12 + i * 8, 42, 4, 36);
  blob(c, "#8a6a48", 48, 38, 40, 16); blob(c, "#a3815a", 48, 37, 36, 13); blob(c, "#8a6a48", 48, 37, 24, 8); blob(c, "#a3815a", 48, 37, 14, 4); blob(c, "#6e5238", 48, 37, 4, 1);
  blob(c, "#4b6d47", 18, 44, 8, 3); blob(c, "#628350", 76, 70, 7, 3);
}
function thorns(c) { // 茨（道をふさぐ）
  const r = rng(77);
  for (let i = 0; i < 9; i++) { const ax = 4 + r() * 40, ay = 10 + r() * 30; c.strokeStyle = i % 2 ? "#3a2a22" : "#54382a"; c.lineWidth = 3; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(24 + (r() - 0.5) * 30, 24 + (r() - 0.5) * 30, 44 - r() * 40, 40 - r() * 30); c.stroke(); }
  for (let i = 0; i < 16; i++) { const tx = 4 + r() * 40, ty = 8 + r() * 34; R(c, "#c8b89a", tx, ty, 2, 2); }
  for (let i = 0; i < 6; i++) blob(c, "#35502f", 6 + r() * 36, 10 + r() * 30, 4, 3);
}
function shrineGate(c) { // 苔むした石の門（2×2マス）
  R(c, "#4f4a55", 8, 12, 18, 84); R(c, "#4f4a55", 70, 12, 18, 84); R(c, "#625c68", 10, 12, 6, 84); R(c, "#625c68", 72, 12, 6, 84);
  R(c, "#3a3640", 0, 4, 96, 16); R(c, "#625c68", 0, 4, 96, 4); R(c, "#4f4a55", 6, 24, 84, 8);
  R(c, "#0f0c12", 26, 32, 44, 64);
  for (const [mx, my, rx] of [[14, 6, 12], [60, 5, 16], [84, 22, 6], [12, 50, 6], [80, 66, 7], [40, 26, 10]]) { blob(c, "#3b5a3e", mx, my, rx, 4); blob(c, "#4b6d47", mx - 1, my - 1, rx - 3, 2); }
}
function bed(c) { // 寝床（1×2マス）
  R(c, "#3e2a1c", 4, 4, 40, 88); R(c, "#6e4c30", 6, 6, 36, 84);
  R(c, "#d9cdb0", 8, 8, 32, 22); R(c, "#efe6cc", 10, 10, 28, 14);
  R(c, "#5c6f84", 8, 32, 32, 56); R(c, "#6f8399", 8, 32, 32, 6); for (let i = 0; i < 4; i++) R(c, "#4d5e72", 8, 46 + i * 11, 32, 2);
}
function table(c) { R(c, "#2a1d14", 6, 34, 36, 8); R(c, "#6e4c30", 4, 12, 40, 24); R(c, "#8a6440", 4, 12, 40, 4); R(c, "#3e2a1c", 8, 36, 4, 10); R(c, "#3e2a1c", 36, 36, 4, 10); R(c, "#d9cdb0", 12, 16, 7, 6); R(c, "#d9cdb0", 28, 18, 7, 6); R(c, "#7a8a70", 13, 17, 5, 2); R(c, "#7a8a70", 29, 19, 5, 2); }
function chair(c, o) { R(c, "#3e2a1c", 12, 6, 24, 20); R(c, "#6e4c30", 14, 8, 20, 16); R(c, "#5a3d27", 10, 24, 28, 12); R(c, "#8a6440", 10, 24, 28, 3); R(c, "#3e2a1c", 12, 36, 4, 8); R(c, "#3e2a1c", 32, 36, 4, 8); if (o && o.dust) { c.globalAlpha = 0.5; R(c, "#cfc8b8", 12, 25, 24, 2); c.globalAlpha = 1; } }
function shelf(c) { R(c, "#3e2a1c", 4, 4, 40, 40); R(c, "#6e4c30", 6, 6, 36, 16); R(c, "#6e4c30", 6, 26, 36, 16); R(c, "#8a6440", 6, 22, 36, 3); R(c, "#b08a5a", 18, 9, 8, 12); R(c, "#b08a5a", 19, 6, 6, 4); R(c, "#8a6440", 17, 5, 2, 3); R(c, "#7a8a70", 10, 30, 8, 10); R(c, "#a36a4a", 28, 32, 10, 8); } // 棚（木彫りの人形）
function oarRack(c) { R(c, "#a5814f", 23, 6, 3, 42); R(c, "#c9a264", 23, 6, 1, 42); R(c, "#6d6670", 22, 0, 5, 7); R(c, "#a9a4ae", 23, 0, 1, 6); R(c, "#4f4a55", 22, 6, 5, 2); } // 壁に立てかけた棹（先に鉄）
function pillar(c) { R(c, "#4a3626", 18, 0, 12, T); R(c, "#6e4c30", 20, 0, 4, T); for (const yy of [12, 20, 27, 33, 38]) R(c, "#2a1d14", 19, yy, 7, 1); } // 柱（背丈の傷）
function hatWall(c) { blob(c, "#b8944a", 24, 26, 18, 6); blob(c, "#e8c878", 24, 24, 16, 5); blob(c, "#cea858", 24, 18, 9, 8); blob(c, "#e8c878", 22, 16, 6, 5); R(c, "#963c30", 16, 22, 17, 2); } // 壁の麦わら帽
function hearth(c) { R(c, "#3a3640", 4, 14, 40, 28); R(c, "#55504e", 6, 16, 36, 24); R(c, "#1c1511", 10, 20, 28, 16); blob(c, "#d8573a", 24, 30, 8, 4); blob(c, "#ffd04a", 24, 30, 4, 2); R(c, "#2a2532", 18, 6, 12, 10); R(c, "#433b4e", 18, 6, 12, 3); } // 囲炉裏と鉄瓶
function basket(c) { blob(c, "#6e4c30", 24, 34, 12, 8); blob(c, "#a3815a", 24, 30, 11, 5); blob(c, "#d9cdb0", 24, 28, 8, 3); } // 包み・籠
function statue(c) { // 苔むした戦士の石像
  caveFloor(c, 0, 0); blob(c, "#2a2532", 24, 42, 14, 4);
  R(c, "#625c68", 14, 16, 20, 26); R(c, "#7a7380", 16, 16, 6, 26); blob(c, "#7a7380", 24, 10, 7, 7); blob(c, "#8c8590", 22, 8, 4, 4);
  R(c, "#4f4a55", 34, 6, 3, 34); R(c, "#4f4a55", 31, 14, 9, 3); R(c, "#4f4a55", 12, 40, 24, 4);
  blob(c, "#4b6d47", 16, 18, 6, 3); blob(c, "#3b5a3e", 30, 30, 5, 3); blob(c, "#4b6d47", 20, 40, 7, 2);
}
function post(c) { R(c, "#3e2c1d", 20, 14, 8, 30); R(c, "#6e5238", 21, 14, 3, 30); blob(c, "#2a3a26", 24, 44, 8, 2); } // 杭

function willow(c) { // 柳（縦2マス。上のマスが枝、下のマスが幹）。枝は左右のマスにも少しかかる
  blob(c, "#2a3a26", 24, 90, 16, 4);
  R(c, "#4d3727", 19, 30, 10, 60); R(c, "#6b4d34", 20, 30, 3, 58); R(c, "#3c2a1e", 26, 40, 2, 44);
  blob(c, "#263f2f", 24, 18, 36, 26); blob(c, "#2f4a35", 22, 14, 32, 22); blob(c, "#3b5a3e", 18, 8, 22, 14); blob(c, "#4b6d47", 12, 2, 10, 5);
  const r = rng(31);
  for (let i = 0; i < 17; i++) { const x = -10 + i * 4 + r() * 2, len = 14 + r() * 26; R(c, i % 2 ? "#3b5a3e" : "#4b6d47", x, 30, 2, len); R(c, "#628350", x, 30 + len - 4, 2, 4); }
}
function weir(c, o) { // 簗（川に組んだ竹。横3マス）。web＝蜘蛛の糸でぐるぐる巻き
  const W = T * 3;
  R(c, "#1b2f3d", 4, 30, W - 8, 10);
  for (let i = 0; i < 12; i++) { const x = 6 + i * 12; R(c, "#6f7a3a", x, 8, 4, 30); R(c, "#93a04e", x, 8, 1, 30); R(c, "#4d5628", x, 14, 4, 1); R(c, "#4d5628", x, 26, 4, 1); }
  R(c, "#8a6a48", 2, 14, W - 4, 3); R(c, "#6e5238", 2, 26, W - 4, 3);
  for (let i = 0; i < 20; i++) R(c, i % 2 ? "#a3815a" : "#8a6a48", 10 + i * 6, 30, 5, 8);
  if (o && o.web) {
    const r = rng(9);
    c.strokeStyle = "#e8eef4"; c.lineWidth = 1.5;
    for (let i = 0; i < 16; i++) { c.globalAlpha = 0.55 + r() * 0.4; c.beginPath(); c.moveTo(r() * W, 4 + r() * 10); c.lineTo(r() * W, 26 + r() * 14); c.stroke(); }
    for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(0, 8 + i * 5); c.quadraticCurveTo(W / 2, 14 + i * 5 + (r() - 0.5) * 10, W, 8 + i * 5); c.stroke(); }
    c.globalAlpha = 0.8; for (let i = 0; i < 5; i++) blob(c, "#f4f8fb", 14 + r() * (W - 28), 12 + r() * 20, 5, 3);
    c.globalAlpha = 1;
  }
}
function wagon(c, o) { // 荷車（横2マス）。army＝幌に王国の紋のある軍の荷車
  const W = T * 2;
  blob(c, "#2a3a26", W / 2, 44, 40, 3);
  R(c, "#4d3727", 8, 26, W - 16, 10); R(c, "#6b4d34", 8, 26, W - 16, 3); R(c, "#3c2a1e", 4, 30, 6, 3); R(c, "#3c2a1e", W - 10, 30, 10, 3);
  for (const wx of [24, W - 24]) { blob(c, "#2a1d14", wx, 38, 9, 9); blob(c, "#6e5238", wx, 38, 7, 7); blob(c, "#2a1d14", wx, 38, 2, 2); R(c, "#2a1d14", wx - 7, 37, 14, 2); R(c, "#2a1d14", wx - 1, 31, 2, 14); }
  if (o && o.army) {
    blob(c, "#b8ad94", W / 2, 18, 36, 14); blob(c, "#d0c6ac", W / 2, 16, 33, 11); R(c, "#b8ad94", 12, 18, W - 24, 9);
    for (const rx of [28, 48, 68]) R(c, "#9a9078", rx, 6, 1, 20);
    R(c, "#2f5873", 42, 9, 12, 12); R(c, "#d7b45a", 46, 11, 4, 8); R(c, "#d7b45a", 44, 13, 8, 3); // 王国の紋
  } else if (o && o.coffin) { // 黒い布をかけた棺（葬列）
    R(c, "#14121a", 14, 8, W - 28, 20); R(c, "#2a2632", 16, 8, W - 32, 4); R(c, "#0b0a10", 14, 24, W - 28, 4);
    R(c, "#d8d2c0", W / 2 - 1, 8, 2, 18); R(c, "#d8d2c0", 16, 15, W - 32, 2); // 白い紐
    blob(c, "#e8e2f0", W - 22, 10, 4, 3); blob(c, "#f4d8e0", W - 18, 12, 3, 3); // 白い花
  } else {
    for (const [bx, col] of [[14, "#8a6a48"], [34, "#a3815a"], [54, "#7f6849"], [70, "#8a6a48"]]) { R(c, "#3c2a1e", bx - 1, 11, 14, 16); R(c, col, bx, 12, 12, 14); R(c, "#3c2a1e", bx, 18, 12, 1); }
  }
}
// ---- 第2章の終わり：通夜小屋・赤麦の丘・東の関所・星見の丘 ----
function redWheat(c, x, y) { // 赤麦の畑（歩けない）。赤い穂が、すき間なく実っている
  R(c, "#5a2a1a", 0, 0, T, T);
  const r = rng(hash(x, y, 31) * 1e9);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 6; i++) {
    const sx = i * 8 + ((row % 2) * 4) + ((r() * 3) | 0) - 1, sy = row * 12 + ((r() * 3) | 0) - 2, lean = r() < 0.5 ? 0 : 1;
    R(c, "#6e3a1e", sx + 2, sy + 7, 1, 8); R(c, "#4a2414", sx + 3, sy + 9, 1, 6);          // 茎
    R(c, "#9a4024", sx + lean, sy, 4, 8); R(c, "#c4583a", sx + lean, sy, 3, 6); R(c, "#e08a56", sx + lean + 1, sy + 1, 1, 3); // 穂
    R(c, "#e8b070", sx + lean + 1, sy - 1, 1, 1);                                          // 芒の光
  }
}
function woodCoffin(c) { // 立てかけた木の棺（縦2マス）
  floor(c, 0, 0); floor(c, 0, T);
  R(c, "#2a1d14", 9, 4, 30, 88); R(c, "#6e4c30", 11, 6, 26, 84); R(c, "#835c3a", 11, 6, 26, 3); R(c, "#5a3e28", 11, 30, 26, 2);
  R(c, "#4e3626", 22, 14, 4, 30); R(c, "#4e3626", 16, 22, 16, 4);
}
function openCoffin(c) { // 床に置いた棺（縦2マス）。蓋は外して壁ぎわに
  floor(c, 0, 0); floor(c, 0, T);
  R(c, "#2a1d14", 7, 8, 34, 82); R(c, "#6e4c30", 9, 10, 30, 78); R(c, "#1a120c", 13, 14, 22, 70); R(c, "#e6dfcc", 15, 16, 18, 8); // 中は暗く、枕だけ白い
}
function lantern(c) { // 軒の黒い提灯（弔いの印）。白い字の帯
  R(c, "#2a1d14", 23, 0, 2, 6); R(c, "#3a2a1e", 17, 5, 14, 3);
  blob(c, "#0e0c12", 24, 22, 12, 15); blob(c, "#24202c", 21, 19, 5, 9);
  for (const yy of [11, 17, 23, 29]) R(c, "#3a3446", 13, yy, 22, 1);
  R(c, "#efe8d8", 20, 15, 8, 13); R(c, "#0e0c12", 23, 17, 2, 9); R(c, "#0e0c12", 21, 20, 6, 2);
  R(c, "#3a2a1e", 17, 36, 14, 3); blob(c, "#2a3a26", 24, 44, 8, 2);
}
function diceBowl(c) { // 賽を振るどんぶり（床に置く）
  floor(c, 0, 0); blob(c, "#3a2a20", 24, 30, 17, 9); blob(c, "#efe6d4", 24, 27, 16, 9); blob(c, "#6a4a32", 24, 26, 13, 6);
  for (const [dx, dy] of [[-5, -1], [2, 1], [6, -2]]) { R(c, "#f8f4ea", 24 + dx - 2, 25 + dy, 5, 5); R(c, dx === 2 ? "#c23" : "#222", 24 + dx, 27 + dy, 1, 1); }
}
function kanmon(c, o) { // 東の関所の石の門（横3×縦2マス）。open＝格子が上がっている
  const W = T * 3, H = T * 2;
  R(c, "#3a3640", 0, 4, 18, H - 4); R(c, "#6d6670", 2, 4, 6, H - 4); R(c, "#3a3640", W - 18, 4, 18, H - 4); R(c, "#6d6670", W - 16, 4, 6, H - 4);
  R(c, "#4f4a55", 0, 0, W, 16); R(c, "#85808c", 0, 0, W, 3); R(c, "#3a3640", 0, 14, W, 3);
  R(c, "#0f0c12", 18, 17, W - 36, H - 17);
  const gy = o && o.open ? 17 - 22 : 17;
  for (let gx = 22; gx < W - 18; gx += 9) R(c, "#5a5048", gx, Math.max(17, gy), 3, H - 17 - Math.max(0, gy - 17) - (o && o.open ? 64 : 0));
  if (!(o && o.open)) for (let yy = 30; yy < H; yy += 14) R(c, "#5a5048", 18, yy, W - 36, 3);
  for (const yy of [40, 64]) { R(c, "#3a3640", 0, yy, 18, 2); R(c, "#3a3640", W - 18, yy, 18, 2); }
}
function grave(c) { // 古い墓石
  grass(c, 0, 0, true); blob(c, "#2a3a26", 24, 42, 14, 3);
  R(c, "#4f4a55", 14, 14, 20, 28); blob(c, "#4f4a55", 24, 14, 10, 6); R(c, "#7a7380", 16, 14, 4, 26); R(c, "#3a3640", 18, 24, 12, 1); R(c, "#3a3640", 18, 28, 10, 1);
}
function newGrave(c) { // 新しい土と木の墓標（カイの空の墓）
  grass(c, 0, 0, true); blob(c, "#5a4030", 24, 36, 18, 8); blob(c, "#6e5238", 24, 34, 16, 6);
  R(c, "#3e2c1d", 21, 6, 6, 32); R(c, "#8a6a48", 22, 6, 3, 32); R(c, "#3e2c1d", 14, 12, 20, 5); R(c, "#a3815a", 15, 12, 18, 2);
}
function coffinCart(c) { // 葬列の荷車（1マス）。黒い布をかけた棺
  blob(c, "#2a3a26", 24, 44, 20, 3);
  R(c, "#14121a", 6, 10, 36, 24); R(c, "#2a2632", 8, 10, 32, 4); R(c, "#d8d2c0", 23, 12, 2, 18); R(c, "#d8d2c0", 15, 18, 18, 2);
  blob(c, "#e8e2f0", 37, 12, 4, 3); blob(c, "#f4d8e0", 40, 15, 3, 3);
  for (const wx of [12, 36]) { blob(c, "#2a1d14", wx, 38, 7, 7); blob(c, "#6e5238", wx, 38, 5, 5); blob(c, "#2a1d14", wx, 38, 1, 1); }
}
// ---- 第3章：金砂街道・ザハラ ----
function sand(c, x, y) { // 砂地（歩ける）。風の筋
  R(c, "#c9a46a", 0, 0, T, T);
  const r = rng(hash(x, y, 41) * 1e9);
  for (let i = 0; i < 4; i++) { const yy = (r() * 44) | 0, xx = (r() * 20) | 0; R(c, "#b8915a", xx, yy, 18 + ((r() * 14) | 0), 2); R(c, "#dcb87c", xx + 2, yy - 1, 12, 1); }
  for (let i = 0; i < 10; i++) R(c, ["#b08a54", "#d4b078"][i % 2], (r() * 46) | 0, (r() * 46) | 0, 2, 1);
}
function sandRock(c, x, y) { // 砂岩の岩場（歩けない）。大きさと置き方をばらつかせる
  sand(c, x, y); const r = rng(hash(x, y, 43) * 1e9), k = r();
  if (k < 0.55) { const cx = 20 + ((r() * 8) | 0), cy = 28 + ((r() * 6) | 0), rx = 15 + ((r() * 7) | 0), ry = 11 + ((r() * 5) | 0);
    blob(c, "#7a5a3a", cx + 1, cy + 3, rx, ry); blob(c, "#a3815a", cx, cy, rx - 1, ry - 1); blob(c, "#c09a6a", cx - rx / 3, cy - ry / 2, rx / 3, ry / 3); R(c, "#7a5a3a", cx - rx / 2, cy + 2, rx, 1); }
  else { for (let i = 0; i < 3; i++) { const cx = 8 + ((r() * 32) | 0), cy = 14 + ((r() * 26) | 0), rr = 6 + ((r() * 6) | 0);
    blob(c, "#7a5a3a", cx + 1, cy + 2, rr, rr * 0.8); blob(c, "#b08a5a", cx, cy, rr - 1, rr * 0.7); blob(c, "#c9a46a", cx - 2, cy - 2, rr / 3, rr / 4); } }
}
function palm(c) { // ヤシの木（縦2マス。下のマスが幹）
  blob(c, "#2a3a26", 24, 92, 12, 3);
  for (let i = 0; i < 9; i++) R(c, i % 2 ? "#8a6a3a" : "#6e5230", 21 + (i > 4 ? 1 : 0), 40 + i * 6, 6, 6);
  for (const [dx, dy] of [[-18, 6], [18, 6], [-14, -4], [14, -4], [0, -8]]) { blob(c, "#2f6a3a", 24 + dx, 36 + dy, 14, 5); blob(c, "#4a8a4a", 24 + dx, 34 + dy, 10, 3); }
  blob(c, "#6e5230", 24, 38, 4, 3);
}
function cactus(c) { // 丸いサボテン（道ばた）
  blob(c, "#2a3a26", 24, 42, 12, 3); blob(c, "#3a6a3a", 24, 30, 11, 13); blob(c, "#4f8a4a", 21, 27, 6, 9);
  for (let i = 0; i < 5; i++) R(c, "#e8e0b0", 16 + i * 4, 22 + (i % 2) * 8, 1, 1);
}
function slotMachine(c) { // 絵合わせの機械
  floor(c, 0, 0); R(c, "#2a1d14", 8, 2, 32, 44); R(c, "#8a2a2a", 10, 4, 28, 40); R(c, "#c9a24a", 10, 4, 28, 3);
  R(c, "#1a1014", 13, 12, 22, 12); for (const xx of [14, 21, 28]) R(c, "#f4efe0", xx, 13, 6, 10);
  R(c, "#d23", 16, 16, 2, 4); R(c, "#d8b448", 23, 16, 2, 4); R(c, "#3a8a4a", 30, 16, 2, 4);
  R(c, "#c9a24a", 40, 10, 3, 14); blob(c, "#e04040", 41, 9, 3, 3); R(c, "#3a2a1e", 12, 32, 24, 6);
}
function scorpionSign(c) { // 金の蠍の看板
  R(c, "#3e2c1d", 22, 22, 4, 22); R(c, "#2a1d14", 6, 4, 36, 20); R(c, "#d8b448", 8, 6, 32, 16);
  blob(c, "#8a5a10", 22, 14, 7, 4); R(c, "#8a5a10", 28, 10, 2, 6); R(c, "#8a5a10", 28, 9, 6, 2); R(c, "#8a5a10", 12, 12, 4, 2); R(c, "#8a5a10", 12, 16, 4, 2);
}
function gatePost(c) { // 町の門の柱（縦2マス）
  R(c, "#3a3640", 12, 4, 24, 88); R(c, "#6d6670", 14, 4, 8, 88); R(c, "#4f4a55", 8, 0, 32, 8); R(c, "#85808c", 8, 0, 32, 2);
  for (const yy of [24, 46, 68]) R(c, "#3a3640", 12, yy, 24, 2);
  blob(c, "#2a3a26", 24, 92, 16, 3);
}
function offering(c) { // 石の前の、野の花と団子
  grass(c, 0, 0, true);
  R(c, "#d7d0b6", 12, 30, 12, 3); blob(c, "#f4f2e8", 15, 27, 3, 3); blob(c, "#f4f2e8", 21, 27, 3, 3); blob(c, "#f4f2e8", 18, 23, 3, 3);
  for (const [fx, col] of [[30, "#cdb56a"], [35, "#b98290"], [33, "#d7d0b6"]]) { R(c, "#2c4228", fx, 26, 1, 8); R(c, col, fx - 1, 23, 3, 3); }
}
function cedar(c) { // 一本杉（縦3マス。いちばん下が幹）
  blob(c, "#2a3a26", 24, 140, 18, 4);
  R(c, "#4d3727", 19, 96, 10, 44); R(c, "#6b4d34", 20, 96, 3, 42);
  for (let i = 0; i < 6; i++) { const w = 8 + i * 5, y = 8 + i * 18; blob(c, "#263f2f", 24, y + 10, w + 2, 12); blob(c, "#2f4a35", 23, y + 8, w, 10); blob(c, "#3b5a3e", 20, y + 4, Math.max(3, w - 6), 5); }
}
function canyon(c, x, y, nb) { // 深い谷（歩けない）。上が地面なら、崖の面を見せる
  R(c, "#0e1016", 0, 0, T, T);
  const r = rng(hash(x, y, 5) * 1e9);
  for (let i = 0; i < 3; i++) R(c, "#161a22", (r() * 40) | 0, (r() * 40) | 0, 6 + ((r() * 8) | 0), 2);
  if (nb(0, -1) !== "V" && nb(0, -1) !== "X" && nb(0, -1) !== "E") { R(c, "#4a4450", 0, 0, T, 16); R(c, "#35303a", 0, 16, T, 12); R(c, "#221f28", 0, 28, T, 8); for (let i = 0; i < 4; i++) R(c, "#2a2630", i * 12 + ((r() * 6) | 0), 2 + ((r() * 8) | 0), 2, 14); }
}
function fallen(c, x, y, nb) { canyon(c, x, y, nb); blob(c, "#2c2932", 24, 30, 18, 11); blob(c, "#4b4652", 22, 27, 15, 8); blob(c, "#625c68", 19, 24, 7, 4); } // 谷底の大きな石
function bridgeEnd(c) { // 橋の切れ目（欠けた石組み）
  R(c, "#0e1016", 0, 0, T, T); R(c, "#6d6670", 0, 0, 14, T); R(c, "#85808c", 0, 0, 14, 2); R(c, "#4f4a55", 12, 0, 4, T);
  for (const yy of [10, 24, 38]) R(c, "#4f4a55", 0, yy, 14, 1);
  R(c, "#6d6670", 14, 6, 6, 8); R(c, "#6d6670", 14, 30, 4, 10);
}
function plaque(c) { cobble(c, 0, 0, () => "c"); R(c, "#3a3640", 8, 14, 32, 24); R(c, "#8a7a52", 10, 16, 28, 20); R(c, "#c9b06a", 10, 16, 28, 2); for (const yy of [22, 27, 31]) R(c, "#5a4c2c", 14, yy, 20, 1); } // 銘板
function bigStone(c) { blob(c, "#2a3a26", 24, 42, 22, 5); blob(c, "#3a3640", 24, 28, 22, 17); blob(c, "#625c68", 22, 24, 19, 13); blob(c, "#7a7380", 17, 19, 9, 5); } // 落ちてきた大きな石
function towerFar(c) { // 丘の上の古い塔（横2×縦3マス。右のマスの真ん中に入口が来るように描く）
  c.save(); c.translate(24, 0); towerFar0(c); c.restore();
}
function towerFar0(c) {
  blob(c, "#34503a", 48, 136, 26, 10);
  R(c, "#4f4a55", 26, 28, 44, 108); R(c, "#6d6670", 30, 28, 14, 108); R(c, "#3a3640", 62, 28, 8, 108);
  for (let i = 0; i < 5; i++) R(c, "#3a3640", 26, 46 + i * 20, 44, 2);
  for (let i = 0; i < 4; i++) R(c, "#4f4a55", 24 + i * 13, 18, 9, 12);
  R(c, "#14121a", 42, 52, 10, 16); R(c, "#14121a", 42, 92, 10, 16); R(c, "#14121a", 40, 118, 16, 18);
}
function counter(c) { floor(c, 0, 0); R(c, "#3c2a1e", 0, 10, T, 30); R(c, "#7a5a3c", 0, 8, T, 8); R(c, "#93714d", 0, 8, T, 2); R(c, "#2a1d14", 0, 38, T, 3); } // 帳場の台
function futon(c) { floor(c, 0, 0); R(c, "#3a4a66", 6, 6, 36, 86); R(c, "#56698c", 8, 8, 32, 60); R(c, "#d8d2c0", 10, 70, 28, 16); R(c, "#2a3550", 6, 44, 36, 2); } // 雑魚寝の布団（縦2マス）
function stairs(c) { // 塔の階段（歩いて乗ると、上か下の階へ）
  R(c, "#2a2630", 0, 0, T, T);
  for (let i = 0; i < 6; i++) { R(c, i % 2 ? "#6d6670" : "#7a7380", 4, i * 8, 40, 7); R(c, "#3a3640", 4, i * 8 + 6, 40, 2); }
  R(c, "#3a3640", 0, 0, 4, T); R(c, "#3a3640", 44, 0, 4, T);
}
function campfire(c) { caveFloor(c, 0, 0); blob(c, "#2a2420", 24, 30, 15, 8); R(c, "#4d3727", 12, 28, 24, 4); R(c, "#6b4d34", 16, 24, 4, 10); blob(c, "#b8552b", 24, 24, 5, 6); blob(c, "#e8a23a", 24, 22, 3, 4); } // 消えかけた焚き火
function bell(c) { caveFloor(c, 0, 0); R(c, "#4d3727", 8, 4, 4, 38); R(c, "#4d3727", 36, 4, 4, 38); R(c, "#6b4d34", 8, 4, 32, 4); blob(c, "#5a4a2c", 24, 22, 10, 11); blob(c, "#7b6a3a", 22, 20, 7, 8); R(c, "#3a3220", 14, 30, 20, 3); blob(c, "#3a3220", 24, 35, 2, 2); } // 錆びた鐘
function desk(c) { caveFloor(c, 0, 0); R(c, "#3c2a1e", 6, 16, 36, 22); R(c, "#6b4d34", 6, 14, 36, 6); R(c, "#d8d2c0", 16, 9, 16, 9); R(c, "#8a8474", 24, 9, 1, 9); } // 机と日誌
function windmill(c) { // 風車（横2×縦3マス）
  const W = T * 2;
  blob(c, "#2a3a26", W / 2, 140, 30, 5);
  R(c, "#8a7a62", 30, 60, 36, 80); R(c, "#a6967a", 32, 60, 10, 80); R(c, "#6e5f48", 60, 60, 6, 80);
  R(c, "#7b4a32", 26, 50, 44, 12); R(c, "#93583a", 28, 46, 40, 6); R(c, "#3c2a1e", 42, 112, 12, 28);
  c.save(); c.translate(48, 52); c.strokeStyle = "#3c2a1e"; c.lineWidth = 3;
  for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.fillStyle = "#d9cfb6"; c.fillRect(2, -4, 40, 8); c.strokeRect(2, -4, 40, 8); c.fillStyle = "#3c2a1e"; c.fillRect(2, -1, 40, 2); }
  c.restore(); blob(c, "#3c2a1e", 48, 52, 4, 4);
}
function castle(c, o) { // 丘の上の白い城（横w×縦hマス）
  const W = (o.w || 6) * T, H = (o.h || 4) * T;
  R(c, "#cfd3da", W * 0.15, H * 0.35, W * 0.7, H * 0.65); R(c, "#e6e9ee", W * 0.15, H * 0.35, W * 0.7, 6);
  for (const [x, w, top] of [[0.02, 0.18, 0.12], [0.8, 0.18, 0.12], [0.4, 0.2, 0]]) {
    R(c, "#b9bec7", W * x, H * top, W * w, H * (1 - top)); R(c, "#e6e9ee", W * x, H * top, W * w, 5);
    R(c, "#3f5e8a", W * x - 4, H * top - 14, W * w + 8, 16); R(c, "#5577aa", W * x - 4, H * top - 14, W * w + 8, 4);
    R(c, "#2a3340", W * (x + w / 2) - 5, H * (top + 0.2), 10, 16);
  }
  R(c, "#2a3340", W / 2 - 14, H - 40, 28, 40); R(c, "#7a6a50", W / 2 - 12, H - 38, 24, 38);
  for (let i = 0; i < 10; i++) R(c, "#b9bec7", W * 0.15 + i * W * 0.07, H * 0.3, W * 0.04, 10);
}
function townWall(c, x, y, nb) { // 町を囲む石の壁（上が壁でなければ、上の縁を明るく）
  R(c, "#5d5966", 0, 0, T, T);
  for (let r = 0; r < 4; r++) { const off = r % 2 ? 12 : 0; R(c, "#3c3944", 0, r * 12 + 11, T, 1); for (let i = -1; i < 3; i++) R(c, "#3c3944", off + i * 24, r * 12, 1, 12); }
  if (nb(0, -1) !== "Q") { R(c, "#8a8594", 0, 0, T, 4); R(c, "#6e6a78", 0, 4, T, 2); }
  if (nb(0, 1) !== "Q") R(c, "#2a2830", 0, T - 4, T, 4);
}
function coffin(c, o) { // 石棺（縦2マス）。wheat＝麦の穂の彫り、open＝蓋がずれている
  const H = T * 2;
  caveFloor(c, 0, 0); caveFloor(c, 0, T);
  R(c, "#2a2830", 6, 6, 36, H - 10); R(c, "#7a7584", 8, 8, 32, H - 16); R(c, "#9a95a4", 8, 8, 32, 4); R(c, "#5d5966", 8, H - 12, 32, 4);
  if (o && o.wheat) { R(c, "#c9b06a", 23, 20, 2, 50); for (let i = 0; i < 6; i++) { R(c, "#c9b06a", 19, 26 + i * 7, 4, 3); R(c, "#c9b06a", 25, 28 + i * 7, 4, 3); } }
  else { R(c, "#5d5966", 14, 24, 20, 2); R(c, "#5d5966", 23, 18, 2, 40); }
  if (o && o.open) { R(c, "#0b0a10", 10, 10, 28, 30); R(c, "#7a7584", 14, 4, 32, 10); }
}
function bigCoffin(c) { coffin(c, { open: 1 }); } // 建国王の棺（蓋がわずかにずれ、中は空）
function mural(c, o) { // 壁画（横w×縦hマス）：剣を持つ人と角のある影。二人の顔は削られ、手が真ん中で重なる
  const W = (o.w || 3) * T, H = (o.h || 2) * T;
  R(c, "#3c3944", 0, 0, W, H); R(c, "#8a7a5a", 4, 4, W - 8, H - 8); R(c, "#a6967a", 4, 4, W - 8, 3);
  R(c, "#4a3a2a", W * 0.22, H * 0.3, 14, H * 0.55); blob(c, "#6b6a7a", W * 0.22 + 7, H * 0.26, 8, 8);   // 剣を持つ人（顔は削れて灰色）
  R(c, "#c9c4b0", W * 0.22 + 14, H * 0.2, 3, H * 0.45);
  blob(c, "#2a2230", W * 0.72, H * 0.55, 22, 28); blob(c, "#6b6a7a", W * 0.72, H * 0.26, 10, 9);       // 角のある大きな影
  R(c, "#2a2230", W * 0.72 - 14, H * 0.12, 4, 12); R(c, "#2a2230", W * 0.72 + 10, H * 0.12, 4, 12);
  R(c, "#4a3a2a", W * 0.22 + 14, H * 0.55, W * 0.5 - 30, 4); blob(c, "#d8c8a0", W * 0.5, H * 0.56, 5, 4); // 重なる手
}
function stele(c) { R(c, "#3c3944", 4, 2, 40, 44); R(c, "#6d6878", 6, 4, 36, 40); for (let i = 0; i < 7; i++) R(c, "#45414e", 10, 8 + i * 5, 28 - (i % 3) * 4, 2); } // 古い字の碑
function candle(c) { caveFloor(c, 0, 0); R(c, "#3c2a1e", 20, 22, 8, 20); R(c, "#d8d2c0", 21, 14, 6, 10); blob(c, "#5fa8ff", 24, 10, 4, 6); blob(c, "#c8e4ff", 24, 11, 2, 3); } // 青い蝋燭
function chest2(c) { R(c, "#3c2a1e", 8, 16, 32, 24); R(c, "#6b4d34", 10, 18, 28, 8); R(c, "#2a1d14", 10, 26, 28, 12); } // 開いて空の箱
function scroll(c) { floor(c, 0, 0); R(c, "#3c2a1e", 2, 2, 44, 44); for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) blob(c, i % 2 ? "#d8cfb0" : "#c4b994", 7 + i * 7, 10 + r * 14, 3, 5); } // 巻物の棚
function kingBed(c) { // 天蓋つきの寝台（横2×縦2マス）。人は頭だけ枕に描く
  floor(c, 0, 0); floor(c, T, 0); floor(c, 0, T); floor(c, T, T);
  R(c, "#2a1d14", 4, 2, 6, 92); R(c, "#2a1d14", 86, 2, 6, 92);                       // 天蓋の柱
  R(c, "#5a1e24", 2, 0, 92, 12); R(c, "#7a2a30", 2, 0, 92, 4); R(c, "#c9a24a", 2, 11, 92, 2); // 天蓋の布
  R(c, "#3e2a1c", 10, 14, 76, 80); R(c, "#6e4c30", 12, 16, 72, 76);
  R(c, "#e6dfcc", 18, 18, 60, 22); R(c, "#f4efe0", 20, 20, 56, 14);                   // 枕
  R(c, "#7a2a30", 14, 40, 68, 52); R(c, "#93363c", 14, 40, 68, 6); R(c, "#c9a24a", 14, 46, 68, 2); // 掛け布
  for (let i = 0; i < 3; i++) R(c, "#6a2228", 14, 58 + i * 11, 68, 2);
}
function portrait(c) { R(c, "#7a5a2c", 8, 4, 32, 36); R(c, "#c9a24a", 10, 6, 28, 32); R(c, "#3a3446", 12, 8, 24, 28); blob(c, "#7a4a2a", 24, 20, 9, 11); blob(c, "#e8c8a8", 24, 21, 5, 6); R(c, "#d8b850", 16, 12, 3, 8); R(c, "#d8b850", 18, 10, 2, 3); R(c, "#4a6a8a", 16, 30, 16, 6); } // 王妃の肖像（栗色の髪、麦の穂の髪飾り）
// ---------- 第6章：常闇領（影の原・空座城・四氏族の里） ----------
const SHADE = ["#2c2a3c", "#332f45", "#3a364e", "#433e58"];
function shade(c, x, y) { // 影の原の地面（歩ける）。昼でも薄暗い草地
  R(c, SHADE[1], 0, 0, T, T); const r = rng(hash(x, y, 61) * 1e9);
  for (let i = 0; i < 60; i++) R(c, SHADE[(r() * 4) | 0], (r() * T) | 0, (r() * T) | 0, 2, 2);
  for (let i = 0; i < 6; i++) { const gx = (r() * 44) | 0, gy = (r() * 42) | 0; R(c, "#262336", gx, gy + 2, 2, 4); R(c, "#4b4563", gx + 2, gy, 2, 4); }
  if (hash(x, y, 62) < 0.12) { const fx = 8 + ((r() * 30) | 0), fy = 10 + ((r() * 28) | 0); R(c, "#2a6a78", fx, fy + 2, 2, 3); R(c, "#6fd6e6", fx - 1, fy, 4, 2); } // 小さな光る茸
}
function shadePath(c, x, y, nb) { // 影の原の道（歩ける）
  R(c, "#4a4256", 0, 0, T, T); const r = rng(hash(x, y, 63) * 1e9);
  for (let i = 0; i < 50; i++) R(c, ["#423a4e", "#544b62", "#3c3548"][(r() * 3) | 0], (r() * T) | 0, (r() * T) | 0, 2 + ((r() * 3) | 0), 2);
  fringe(c, x, y, nb, ch => "LOP".includes(ch), SHADE);
}
function shadeTreeBase(c, x, y) { shade(c, x, y); R(c, "#1c1a26", 12, 38, 24, 5); R(c, "#14121c", 20, 24, 8, 16); }
function shadeTreeTop(c, x, y) { // 影絵のような木（黒い切り絵の形）
  const r = rng(hash(x, y, 64) * 1e9), cx = 24 + ((r() * 4) | 0) - 2;
  blob(c, "#14121c", cx, 30, 20, 18); blob(c, "#1b1826", cx - 3, 24, 15, 13); blob(c, "#14121c", cx + 6, 16, 8, 7);
  for (let i = 0; i < 4; i++) { const bx = cx - 16 + ((r() * 32) | 0); R(c, "#14121c", bx, 6 + ((r() * 12) | 0), 2, 10); }
  if (r() < 0.35) { R(c, "#6fd6e6", cx - 6 + ((r() * 12) | 0), 32 + ((r() * 8) | 0), 2, 2); }
}
function shadeRock(c, x, y) { // 黒い岩（通れない）
  shade(c, x, y); const r = rng(hash(x, y, 65) * 1e9);
  const rocks = [[14 + r() * 6, 30 + r() * 4, 14, 11], [32 + r() * 6, 32 + r() * 4, 13, 10], [24 + r() * 4, 18 + r() * 4, 15, 12]];
  for (const [cx, cy, rx, ry] of rocks) { blob(c, "#14121a", cx, cy + 3, rx, ry); blob(c, "#2e2a38", cx, cy, rx, ry); blob(c, "#433d50", cx - 3, cy - 3, rx * 0.6, ry * 0.55); R(c, "#5a536a", cx - rx * 0.5, cy - ry * 0.7, 6, 2); }
}
function glowShroom(c) { shade(c, 0, 0); for (const [x, y, s] of [[14, 30, 6], [30, 24, 9], [24, 38, 5]]) { R(c, "#2a6a78", x - 1, y, 3, s); blob(c, "#3fa6b8", x, y, s, s * 0.6); blob(c, "#8fe6f0", x - 2, y - 2, s * 0.45, s * 0.3); blob(c, "#6fd6e640", x, y, s + 5, s + 3); } } // 青く光る茸
function furTent(c) { // 骨と毛皮の天幕（横2マス×縦2マス）
  shade(c, 0, 0); shade(c, 1, 0); shade(c, 0, 1); shade(c, 1, 1);
  c.fillStyle = "#2a1d14"; c.beginPath(); c.moveTo(6, 90); c.lineTo(48, 22); c.lineTo(90, 90); c.fill();
  c.fillStyle = "#6e5238"; c.beginPath(); c.moveTo(10, 88); c.lineTo(48, 26); c.lineTo(86, 88); c.fill();
  c.fillStyle = "#8a6a48"; c.beginPath(); c.moveTo(16, 88); c.lineTo(48, 30); c.lineTo(50, 88); c.fill();
  c.fillStyle = "#1a1210"; c.beginPath(); c.moveTo(40, 88); c.lineTo(48, 60); c.lineTo(56, 88); c.fill();
  for (const [x1, y1, x2, y2] of [[40, 16, 48, 30], [56, 16, 48, 30]]) { c.strokeStyle = "#d8d0bc"; c.lineWidth = 3; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  R(c, "#a3815a", 24, 60, 14, 3); R(c, "#a3815a", 58, 64, 14, 3);
}
function nest(c) { shade(c, 0, 0); blob(c, "#2a1d14", 24, 34, 20, 9); blob(c, "#6e5238", 24, 30, 19, 8); blob(c, "#8a6a48", 24, 27, 15, 5); for (let i = 0; i < 8; i++) R(c, "#a3815a", 8 + i * 4, 24 + (i % 3) * 3, 6, 1); blob(c, "#3a2a1e", 24, 27, 9, 3); } // 枝で編んだ巣
function blackThrone(c) { // 黒い石の玉座。厚い埃
  stoneDark(c, 0, 0); R(c, "#0e0c12", 8, 44, 32, 3);
  R(c, "#1c1a24", 10, 0, 28, 40); R(c, "#2e2a38", 12, 2, 24, 36); R(c, "#3a3448", 15, 5, 18, 26); R(c, "#7a7484", 12, 2, 24, 3);
  R(c, "#1c1a24", 6, 26, 36, 6); R(c, "#7a7484", 6, 26, 36, 2); R(c, "#3a3448", 12, 31, 24, 7); R(c, "#8e8898", 12, 31, 24, 2); R(c, "#16141c", 8, 32, 4, 14); R(c, "#16141c", 36, 32, 4, 14);
  for (let i = 0; i < 12; i++) R(c, "#8e889860", 13 + (i * 7) % 22, 6 + (i * 5) % 24, 2, 1);
}
function stoneDark(c, x, y) { // 空座城の黒い石の床（歩ける）
  R(c, "#2a2733", 0, 0, T, T); const r = rng(hash(x, y, 66) * 1e9);
  for (let row = 0; row < 3; row++) { const off = (row + y) % 2 ? 12 : 0; for (let i = -1; i < 3; i++) { const bx = i * 24 + off; R(c, ["#33303d", "#2f2c39", "#383443"][(r() * 3) | 0], bx + 1, row * 16 + 1, 22, 14); R(c, "#423e4e", bx + 1, row * 16 + 1, 22, 1); } }
  for (let i = 0; i < 6; i++) R(c, "#8e889840", (r() * 46) | 0, (r() * 46) | 0, 2, 1); // 厚い埃
}
function dohyo(c) { // 石舞台の土俵（横3マス×縦3マス）。俵の丸い輪
  for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) { c.save(); c.translate(x * T, y * T); shade(c, x, y); c.restore(); }
  blob(c, "#3a2e26", 72, 76, 66, 62); blob(c, "#8a6a48", 72, 72, 64, 60); blob(c, "#a3815a", 72, 72, 56, 52);
  c.strokeStyle = "#d8c690"; c.lineWidth = 5; c.beginPath(); c.ellipse(72, 72, 46, 42, 0, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = "#b8a470"; c.lineWidth = 2; c.beginPath(); c.ellipse(72, 72, 46, 42, 0, 0, Math.PI * 2); c.stroke();
  R(c, "#f0ece0", 60, 66, 6, 2); R(c, "#f0ece0", 78, 66, 6, 2);
}
function drum(c) { shade(c, 0, 0); blob(c, "#1a1210", 24, 40, 16, 4); R(c, "#6e3529", 10, 16, 28, 24); R(c, "#8a4535", 10, 16, 28, 4); blob(c, "#d8c690", 24, 16, 14, 5); blob(c, "#efe0b0", 22, 15, 8, 2); for (let i = 0; i < 6; i++) R(c, "#c9a24a", 11 + i * 5, 22, 2, 2); R(c, "#4d3727", 34, 6, 3, 14); } // 鬼太鼓
function _floorDark(c) { R(c, "#26232e", 0, 0, T, T); for (let i = 0; i < 6; i++) R(c, i % 2 ? "#2c2934" : "#221f2a", 0, i * 8, T, 8); R(c, "#1a1820", 0, 47, T, 1); }
function tornBanner(c) { R(c, "#2a2632", 0, 0, T, T); R(c, "#4d3727", 22, 0, 3, 40); R(c, "#4a2030", 14, 4, 20, 26); R(c, "#5e2a3c", 14, 4, 20, 3); R(c, "#2a2632", 20, 18, 6, 14); R(c, "#2a2632", 14, 26, 5, 6); R(c, "#7a6a3a", 21, 10, 6, 5); } // 破れた旗
function windStone(c) { shade(c, 0, 0); R(c, "#1c1a24", 12, 4, 24, 42); R(c, "#4a4458", 14, 6, 20, 38); for (let i = 0; i < 4; i++) R(c, "#cfd6e6", 16 + i * 4, 10 + i * 8, 10, 1); } // 風の刻みのある石柱
// ---------- 第5章：北方（雪の原・氷の峠・砦・野営地） ----------
const SNOW = ["#b4bfcc", "#c0cad6", "#ccd5df", "#d9e0e8"];
function snow(c, x, y) { // 雪の原（歩ける）。夕方の青みのある白
  R(c, SNOW[1], 0, 0, T, T); const r = rng(hash(x, y, 51) * 1e9);
  for (let i = 0; i < 40; i++) R(c, SNOW[(r() * 4) | 0], (r() * T) | 0, (r() * T) | 0, 2 + ((r() * 3) | 0), 1);
  for (let i = 0; i < 3; i++) { const yy = (r() * 44) | 0, xx = (r() * 24) | 0; R(c, "#a9b5c3", xx, yy, 14 + ((r() * 10) | 0), 1); R(c, SNOW[3], xx + 1, yy - 1, 10, 1); }
}
function snowPath(c, x, y, nb) { // 踏み固めた雪の道（歩ける）
  R(c, "#9fa8b4", 0, 0, T, T); const r = rng(hash(x, y, 52) * 1e9);
  for (let i = 0; i < 40; i++) R(c, ["#949dab", "#a9b2be", "#8a93a0"][(r() * 3) | 0], (r() * T) | 0, (r() * T) | 0, 2 + ((r() * 3) | 0), 2);
  fringe(c, x, y, nb, ch => "YAI".includes(ch), SNOW);
}
function snowTreeBase(c, x, y) { snow(c, x, y); R(c, "#8d98a8", 12, 38, 24, 5); R(c, P.trunk, 20, 26, 8, 14); R(c, P.trunkL, 21, 26, 2, 12); }
function snowTreeTop(c, x, y) { // 雪をかぶった針葉樹（48×72。上に24はみ出す）
  const r = rng(hash(x, y, 53) * 1e9), cx = 24 + ((r() * 4) | 0) - 2;
  for (const [yy, w] of [[36, 20], [26, 16], [16, 11], [7, 6]]) {
    c.fillStyle = "#24392f"; c.beginPath(); c.moveTo(cx - w, yy + 10); c.lineTo(cx, yy - 10); c.lineTo(cx + w, yy + 10); c.fill();
    c.fillStyle = "#2e4838"; c.beginPath(); c.moveTo(cx - w + 4, yy + 8); c.lineTo(cx - 2, yy - 8); c.lineTo(cx + 2, yy + 8); c.fill();
    R(c, SNOW[2], cx - w + 2, yy + 6, w * 2 - 4, 3); R(c, SNOW[3], cx - w + 6, yy + 5, w, 2); R(c, SNOW[3], cx - 2, yy - 9, 4, 3);
  }
}
function iceWall(c, x, y, nb) { // 氷の壁・氷の岩（通れない）
  snow(c, x, y); const r = rng(hash(x, y, 54) * 1e9);
  const k = 1 + ((r() * 2) | 0);
  for (let i = 0; i < k + 1; i++) { const bx = 4 + ((r() * 20) | 0), bw = 16 + ((r() * 14) | 0), bh = 22 + ((r() * 18) | 0), by = 44 - bh;
    R(c, "#5c7891", bx + 2, by + 3, bw, bh); R(c, "#86a7c2", bx, by, bw, bh); R(c, "#a9c6dc", bx + 2, by + 2, bw / 3, bh - 4); R(c, "#d6e6f1", bx + 3, by + 3, 2, bh / 2); R(c, "#6d8aa4", bx + bw - 4, by + 2, 3, bh - 2); R(c, SNOW[3], bx, by, bw, 3); }
}
function tent(c) { // 軍の天幕（横2マス×縦2マス）
  snow(c, 0, 0); snow(c, 1, 0); snow(c, 0, 1); snow(c, 1, 1);
  c.fillStyle = "#3a3a2e"; c.beginPath(); c.moveTo(4, 90); c.lineTo(48, 18); c.lineTo(92, 90); c.fill();
  c.fillStyle = "#8a8466"; c.beginPath(); c.moveTo(8, 88); c.lineTo(48, 22); c.lineTo(88, 88); c.fill();
  c.fillStyle = "#a39d7c"; c.beginPath(); c.moveTo(14, 88); c.lineTo(48, 26); c.lineTo(52, 88); c.fill();
  c.fillStyle = "#2a2620"; c.beginPath(); c.moveTo(38, 88); c.lineTo(48, 56); c.lineTo(58, 88); c.fill();
  R(c, "#4d3727", 47, 6, 2, 16); R(c, "#2f4f8a", 49, 6, 12, 7); R(c, "#d8c070", 52, 8, 4, 3); R(c, SNOW[3], 30, 44, 20, 2);
}
function banner(c) { snow(c, 0, 0); R(c, "#4d3727", 22, 2, 3, 44); R(c, "#2f4f8a", 25, 4, 16, 22); R(c, "#3d63a3", 25, 4, 16, 3); R(c, "#d8c070", 30, 11, 6, 6); R(c, "#7f6849", 18, 42, 12, 4); } // 王国の旗
function ironGate(c, o) { // 鉄の大門（横4マス×縦2マス）。open のときは開いた扉
  if (o && o.open) return ironGateOpen(c); const W2 = 192; R(c, "#3c3944", 0, 0, W2, 96); for (let i = 0; i < 8; i++) R(c, i % 2 ? "#4f4a55" : "#46424e", i * 24, 0, 24, 96);
  R(c, "#2a2830", 20, 10, 152, 86); R(c, "#55606e", 24, 14, 144, 82);
  for (let i = 0; i < 9; i++) R(c, "#3e4652", 28 + i * 16, 14, 4, 82); for (const yy of [24, 50, 76]) R(c, "#6e7a88", 24, yy, 144, 4);
  for (let i = 0; i < 9; i++) for (const yy of [26, 52, 78]) R(c, "#8a95a3", 29 + i * 16, yy, 2, 2);
  R(c, "#2a2830", 94, 14, 4, 82);
}
function ironGateOpen(c) { R(c, "#3c3944", 0, 0, 192, 96); for (let i = 0; i < 8; i++) R(c, i % 2 ? "#4f4a55" : "#46424e", i * 24, 0, 24, 96); R(c, "#2a2830", 20, 10, 152, 86); R(c, "#c0cad6", 40, 16, 112, 80); R(c, "#d9e0e8", 40, 16, 112, 30); R(c, "#55606e", 24, 14, 16, 82); R(c, "#55606e", 152, 14, 16, 82); } // 開いた鉄門（向こうに雪の原）
function burntPost(c) { snow(c, 0, 0); R(c, "#1e1a1c", 18, 6, 12, 38); R(c, "#2e2628", 20, 6, 4, 36); R(c, "#3a2e2c", 16, 40, 16, 4); R(c, "#e07a3a", 24, 18, 2, 2); } // 焼けた柱
function brokenStone(c) { snow(c, 0, 0); blob(c, "#7d8794", 24, 42, 16, 4); R(c, "#4e5560", 12, 14, 10, 28); R(c, "#6d7580", 14, 16, 6, 24); R(c, "#4e5560", 26, 20, 10, 22); R(c, "#6d7580", 28, 22, 6, 18); R(c, "#2a2e36", 22, 14, 4, 28); } // 割られた還り石
function wisp(c) { snow(c, 0, 0); const t = (Date.now() / 600) | 0; for (const [x, y, k] of [[14, 18, 0], [32, 12, 1], [26, 30, 2]]) { const b = (t + k) % 3 === 0; blob(c, "#e8f0ff40", x, y, 7, 7); blob(c, b ? "#ffffff" : "#d8e4ff", x, y, 3, 3); } } // 行き場のない光
function iceBridge(c) { R(c, "#25313f", 0, 0, T, T); R(c, "#7fa2c0", 0, 10, T, 28); R(c, "#a9c6dc", 0, 12, T, 6); R(c, "#d6e6f1", 0, 12, T, 2); R(c, "#5c7891", 0, 34, T, 4); for (let i = 0; i < 4; i++) R(c, "#c0d6e6", 4 + i * 12, 22, 6, 1); } // 氷の橋（歩ける）
function watchtower(c) { // 木の見張り台（横2マス×縦3マス）
  snow(c, 0, 0); snow(c, 1, 0); snow(c, 0, 1); snow(c, 1, 1); snow(c, 0, 2); snow(c, 1, 2);
  for (const x of [10, 80]) { R(c, "#3e2c1d", x, 30, 7, 112); R(c, "#6b4d34", x + 1, 30, 2, 110); }
  for (let i = 0; i < 4; i++) { const y = 56 + i * 22; R(c, "#4d3727", 12, y, 72, 3); }
  R(c, "#2a1d14", 2, 18, 92, 16); R(c, "#6e5238", 4, 14, 88, 16); R(c, "#8a6a48", 4, 14, 88, 3); R(c, "#4d3727", 6, 0, 4, 16); R(c, "#4d3727", 86, 0, 4, 16); R(c, "#5e4430", 2, 0, 92, 4); R(c, SNOW[3], 2, 0, 92, 2);
}
function fireSnow(c) { snow(c, 0, 0); blob(c, "#8d98a8", 24, 32, 15, 7); R(c, "#4d3727", 12, 28, 24, 4); R(c, "#6b4d34", 16, 24, 4, 10); blob(c, "#c8602b", 24, 22, 7, 9); blob(c, "#f0a83a", 24, 20, 4, 6); blob(c, "#ffe08a", 24, 19, 2, 3); } // かがり火
function chasm(c, x, y) { R(c, "#1c2632", 0, 0, T, T); const r = rng(hash(x, y, 55) * 1e9); for (let i = 0; i < 6; i++) R(c, "#2a3848", (r() * 40) | 0, (r() * 44) | 0, 8, 2); if (hash(x, y, 56) < 0.4) R(c, "#3a6884", 10 + ((r() * 20) | 0), 20, 14, 3); } // 谷（下に川が細く見える）
// ---------- 第5章：謁見の間・宰相の館 ----------
function carpet(c, x, y, nb) { floor(c, x, y); const l = nb(-1, 0) === "C", r = nb(1, 0) === "C"; R(c, "#7a2228", l ? 0 : 4, 0, 48 - (l ? 0 : 4) - (r ? 0 : 4), 48); R(c, "#8e2c32", l ? 0 : 6, 0, 48 - (l ? 0 : 6) - (r ? 0 : 6), 48); if (!l) R(c, "#c9a24a", 6, 0, 2, 48); if (!r) R(c, "#c9a24a", 40, 0, 2, 48); if ((x + y) % 2 === 0) R(c, "#a03a40", 22, 22, 4, 4); } // 赤い絨毯
function throne(c) { // 空の玉座（背の高い椅子。赤い座面、金の縁）
  floor(c, 0, 0); R(c, "#2a1d14", 8, 44, 32, 3);
  R(c, "#8a6a2a", 10, 0, 28, 40); R(c, "#c9a24a", 12, 2, 24, 36); R(c, "#7a2228", 15, 5, 18, 26); R(c, "#93363c", 15, 5, 18, 3);
  blob(c, "#e0c060", 24, 3, 4, 3); R(c, "#8a6a2a", 6, 26, 36, 6); R(c, "#c9a24a", 6, 26, 36, 2); R(c, "#7a2228", 12, 31, 24, 7); R(c, "#6a5020", 8, 32, 4, 14); R(c, "#6a5020", 36, 32, 4, 14);
}
function chainBox(c) { // 鎖を巻いた長い箱（横2マス）
  floor(c, 0, 0); floor(c, 48, 0); R(c, "#1e1610", 6, 18, 84, 24); R(c, "#4a3424", 8, 14, 80, 24); R(c, "#5e4430", 8, 14, 80, 5); R(c, "#2e2218", 8, 34, 80, 4);
  for (const cx of [26, 70]) for (let i = 0; i < 6; i++) { R(c, i % 2 ? "#8a8a92" : "#b0b0b8", cx - 2, 12 + i * 5, 5, 4); R(c, "#4a4a52", cx - 1, 13 + i * 5, 3, 2); }
  R(c, "#c9a24a", 44, 22, 8, 7); R(c, "#7a5a20", 47, 25, 2, 3);
}
function grate(c) { caveFloor(c, 0, 0); R(c, "#1a1a20", 6, 6, 36, 36); for (let i = 0; i < 5; i++) R(c, "#6a6a72", 9 + i * 7, 6, 3, 36); R(c, "#6a6a72", 6, 14, 36, 3); R(c, "#6a6a72", 6, 30, 36, 3); } // 水路の格子（外れかけ）
function ledgers(c) { floor(c, 0, 0); R(c, "#3c2a1e", 2, 2, 44, 44); for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) R(c, ["#5a4a8a", "#8a3a3a", "#3a6a5a", "#7a6a3a"][(i + r) % 4], 5 + i * 6, 6 + r * 14, 5, 12); } // 壁いっぱいの帳簿
function column(c) { cobble(c, 0, 0, () => "c"); R(c, "#2a2830", 12, 40, 26, 6); R(c, "#8a8594", 14, 2, 20, 40); R(c, "#a9a4b2", 16, 2, 6, 40); R(c, "#5d5966", 30, 2, 4, 40); R(c, "#6e6a78", 10, 0, 28, 5); R(c, "#6e6a78", 10, 38, 28, 4); } // 石の柱（回廊）
function candleStand(c) { floor(c, 0, 0); R(c, "#8a6a2a", 22, 16, 4, 26); R(c, "#c9a24a", 16, 38, 16, 4); R(c, "#efe6cc", 21, 8, 6, 10); blob(c, "#ffb84a", 24, 5, 3, 4); blob(c, "#fff0b0", 24, 6, 1.5, 2); } // 燭台
function fountain(c) { cobble(c, 0, 0, () => "c"); blob(c, "#5d5966", 24, 26, 20, 15); blob(c, "#8a8594", 24, 25, 18, 13); blob(c, "#3f7fb8", 24, 26, 14, 9); blob(c, "#6fb0e0", 22, 24, 7, 4); R(c, "#8a8594", 21, 8, 6, 18); blob(c, "#bfe4ff", 24, 7, 5, 4); R(c, "#9fd4ff", 23, 10, 2, 10); } // 噴水
function woodpile(c) { grass(c, 0, 0); for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - (r === 2 ? 1 : 0); i++) { const x = 6 + i * 10 + (r === 2 ? 5 : 0), y = 32 - r * 10; blob(c, "#7a5230", x + 4, y, 5, 5); blob(c, "#e2c08a", x + 4, y, 3.2, 3.2); blob(c, "#b88a52", x + 4, y, 1.2, 1.2); } } // 割った薪の山
function veiled(c) { floor(c, 0, 0); R(c, "#4f4a55", 10, 28, 28, 16); R(c, "#6d6670", 10, 28, 28, 3); blob(c, "#d8d2c0", 24, 22, 14, 10); R(c, "#d8d2c0", 11, 22, 26, 10); blob(c, "#efe9d8", 22, 17, 8, 5); R(c, "#b8b2a0", 12, 30, 2, 6); R(c, "#b8b2a0", 34, 30, 2, 6); } // 布をかけた台座


function itae(c, o) { // 大書庫の古い板絵（横3マス×縦2マス）：倒れた人と、その手を取ってひざをつく人。顔は削られている。ひざをついた方の頭に、とがった形が二つ
  const W = (o.w || 3) * T, H = (o.h || 2) * T;
  R(c, "#3a2a1c", 0, 0, W, H); R(c, "#b8a47a", 4, 4, W - 8, H - 8); R(c, "#cdbb92", 4, 4, W - 8, 3);
  R(c, "#5a4430", W * 0.12, H * 0.66, W * 0.42, 10); blob(c, "#7a7484", W * 0.12, H * 0.66 + 4, 7, 7);  // 倒れた人（顔は削れて灰色）
  R(c, "#d8d2c0", W * 0.3, H * 0.6, 3, 22); R(c, "#d8d2c0", W * 0.27, H * 0.6 + 8, 9, 2);                 // 倒れた方の手もとの剣
  R(c, "#3e2c40", W * 0.62, H * 0.36, 16, H * 0.36); blob(c, "#7a7484", W * 0.62 + 8, H * 0.3, 8, 8);   // ひざをつく人
  R(c, "#3e2c40", W * 0.62, H * 0.14, 3, 9); R(c, "#3e2c40", W * 0.62 + 13, H * 0.14, 3, 9);             // 頭のとがった形
  R(c, "#3e2c40", W * 0.45, H * 0.62, W * 0.18, 4); blob(c, "#e2d2a8", W * 0.45, H * 0.64, 5, 4);         // 取った手
}
function starFloor(c) { // 星の間の床（星図）
  R(c, "#1c1f38", 0, 0, T, T); R(c, "#262a4a", 0, 0, T, 1); R(c, "#262a4a", 0, 0, 1, T);
  blob(c, "#d8d0a0", 14, 16, 2, 2); blob(c, "#efe8c0", 34, 30, 1, 1); R(c, "#4a5080", 14, 16, 20, 1); R(c, "#4a5080", 33, 16, 1, 14);
}
function ship(c, o) { // 帆船（横3マス×高さ3マス）。商盟の旗。o.left＝左向き
  const W = T * 3;
  c.save(); if (o && o.left) { c.translate(W, 0); c.scale(-1, 1); }
  blob(c, "#16324a", W / 2, 132, 70, 8);                                                    // 水に落ちる影
  blob(c, "#2b1c12", W / 2, 118, 66, 16); blob(c, "#5a3d27", W / 2, 114, 63, 13); blob(c, "#7a5434", W / 2, 110, 58, 8);
  R(c, "#2b1c12", 12, 106, 120, 2); R(c, "#a37a50", 14, 104, 116, 2);                       // 舷の縁
  R(c, "#3e2a1c", 118, 96, 18, 6); R(c, "#3e2a1c", 8, 100, 14, 4);                          // へさき・とも
  for (const wx of [34, 58, 82, 106]) R(c, "#2b1c12", wx, 112, 5, 4);                        // 窓
  R(c, "#4a3220", 70, 14, 5, 96); R(c, "#6e4c30", 70, 14, 2, 96);                           // 帆柱
  R(c, "#4a3220", 38, 30, 70, 3); R(c, "#4a3220", 44, 76, 58, 3);                           // 帆桁
  R(c, "#e9e0c8", 40, 33, 66, 43); R(c, "#d2c8ae", 40, 64, 66, 12); R(c, "#f7f1e0", 44, 36, 20, 30); // 帆
  blob(c, "#c99a2a", 73, 52, 11, 11); blob(c, "#f0c84a", 73, 51, 8, 8); R(c, "#8a6a18", 69, 50, 8, 2); // 商盟の紋（金の円）
  R(c, "#c99a2a", 75, 8, 18, 9); R(c, "#f0c84a", 75, 8, 18, 3);                             // 旗
  c.restore();
}
function storm(c, tx, ty) { // 嵐の壁：荒れた暗い海と、雨の筋
  R(c, "#1a2230", 0, 0, T, T); blob(c, "#243248", 24, 30, 22, 10); blob(c, "#2e3e58", 14 + (tx * 7 + ty * 3) % 20, 18, 9, 4);
  for (let k = 0; k < 4; k++) { const x = (tx * 13 + ty * 7 + k * 11) % T; R(c, "#8fa6c4", x, (k * 12 + ty * 5) % T, 1, 9); }
  R(c, "#c8d8ec", (tx * 17 + ty * 29) % 40 + 4, (tx * 11) % 30 + 6, 6, 1);
}
function winch(c) { // 鎖の巻き上げ機（2×2マス）
  blob(c, "#1a1410", 48, 84, 40, 8);
  R(c, "#3e2a1c", 14, 40, 68, 40); R(c, "#6e4c30", 16, 42, 64, 34); R(c, "#8a6440", 16, 42, 64, 4);
  blob(c, "#4d4a55", 48, 54, 22, 18); blob(c, "#6a6672", 48, 52, 18, 14); blob(c, "#33303a", 48, 54, 6, 6);
  for (const a of [0, 1, 2, 3]) R(c, "#8a8494", 46 + [0, 18, 0, -18][a], 52 + [-18, 0, 18, 0][a], 4, 4);
  for (let y = 0; y < 40; y += 6) { R(c, "#55525c", 46, y, 6, 4); R(c, "#7d7986", 47, y, 4, 2); } // 鎖
}
function cage(c) { // 水の中の鉄の檻（2×2マス）
  R(c, "#1f2a36", 8, 18, 80, 70); for (let x = 10; x < 90; x += 10) { R(c, "#55525c", x, 14, 4, 76); R(c, "#8a8494", x, 14, 1, 76); }
  R(c, "#3d3a44", 6, 12, 84, 6); R(c, "#3d3a44", 6, 84, 84, 6);
}
// ---- 第8章：棺の門・城の地下牢・墓所の深層 ----
function coffinGate(c, o) { // 棺の門（横3マス×縦2マス）。外壁にうがった古い石の門。open でないときは錆びた鎖
  R(c, "#4a4652", 0, 0, 144, 96); for (let y = 0; y < 96; y += 16) for (let x = (y / 16) % 2 ? 0 : 12; x < 144; x += 24) R(c, "#3c3944", x, y, 2, 16);
  for (let y = 16; y < 96; y += 16) R(c, "#3c3944", 0, y, 144, 2);
  R(c, "#2e2b34", 36, 14, 72, 82); R(c, "#57525e", 40, 18, 64, 4);
  R(c, "#0c0b10", 44, 22, 56, 74); blob(c, "#0c0b10", 72, 24, 28, 10);
  R(c, "#8a8494", 64, 4, 16, 8); R(c, "#2e2b34", 70, 6, 4, 4);   // 要石の髑髏の彫り（小さく）
  if (!o || !o.open) {
    for (let i = 0; i < 4; i++) { R(c, "#7a4a2a", 44, 34 + i * 16, 56, 4); R(c, "#a0643a", 44, 34 + i * 16, 56, 1); }
    R(c, "#5a3a22", 66, 44, 12, 14); R(c, "#a0643a", 69, 48, 6, 6);  // 錠前
  } else { R(c, "#1c2a3a", 52, 30, 40, 66); blob(c, "#2f4a66", 72, 56, 10, 6); }   // 開いた門：奥に青い蝋燭の火
}
function bars(c) { // 牢の鉄格子（1マス）
  for (let i = 0; i < 6; i++) { R(c, "#2a2a30", 3 + i * 8, 0, 4, 48); R(c, "#6a6a74", 3 + i * 8, 0, 2, 48); }
  R(c, "#2a2a30", 0, 6, 48, 4); R(c, "#6a6a74", 0, 6, 48, 2); R(c, "#2a2a30", 0, 38, 48, 4); R(c, "#6a6a74", 0, 38, 48, 2);
}
function straw(c) { // 牢の寝藁（1マス）
  blob(c, "#6a5a2a", 24, 30, 18, 10); blob(c, "#9a8442", 24, 28, 15, 8);
  for (let i = 0; i < 9; i++) R(c, i % 2 ? "#c8b060" : "#a8903e", 10 + i * 3, 24 + (i * 5) % 9, 7, 1);
}
function spiral(c) { // 床の下へ続く螺旋の階段（1マス）。外された敷石
  R(c, "#3a3640", 2, 2, 44, 44); R(c, "#0a090e", 6, 6, 36, 36);
  for (let i = 0; i < 6; i++) { const a = i * 0.9, x = 24 + Math.cos(a) * 12, y = 24 + Math.sin(a) * 12; R(c, i % 2 ? "#5a5462" : "#6a6472", Math.round(x) - 5, Math.round(y) - 3, 10, 5); }
  R(c, "#57525e", 36, 40, 10, 6); R(c, "#57525e", 2, 40, 8, 6);   // 外された敷石
}
function sealDoor(c) { // 封の間の扉（横3マス×縦2マス）。四つの紋
  R(c, "#2a2632", 0, 0, 144, 96); R(c, "#3c3646", 8, 6, 128, 90); R(c, "#14121a", 70, 10, 4, 86);
  const em = [["#c04a3a", 36, 34], ["#4a7ac0", 108, 34], ["#3a9a5a", 36, 70], ["#c0a03a", 108, 70]];
  for (const [col, x, y] of em) { blob(c, "#14121a", x, y, 12, 12); blob(c, col, x, y, 9, 9); blob(c, "#14121a", x, y, 3, 3); }
}
root.TL = { T, P, hash, rng, R, blob, grass, dirt, cobble, water, bridge, stones, rockWall, caveWall, caveFloor, rail, fence, treeBase, treeTop, house, well, sign, chest, stall, mineGate, rubble,
  floor, wall, voidT, door, marsh, crops, herb, boat, kaeri, stump, thorns, shrineGate, bed, table, chair, shelf, oarRack, pillar, hatWall, hearth, basket, post, statue, willow, weir, wagon, gatePost, offering, cedar, canyon, fallen, bridgeEnd, plaque, bigStone, towerFar, coffinGate, bars, straw, spiral, sealDoor, counter, futon, stairs, campfire, bell, desk, windmill, castle, townWall, coffin, bigCoffin, mural, stele, candle, chest2, scroll, kingBed, portrait, veiled, column, candleStand, fountain, woodpile, redWheat, woodCoffin, openCoffin, lantern, diceBowl, kanmon, grave, newGrave, coffinCart, sand, sandRock, palm, cactus, slotMachine, scorpionSign, ship, storm, winch, cage, itae, starFloor, carpet, throne, chainBox, grate, ledgers, snow, snowPath, snowTreeBase, snowTreeTop, iceWall, tent, banner, ironGate, ironGateOpen, burntPost, brokenStone, wisp, iceBridge, chasm, watchtower, fireSnow, shade, shadePath, shadeTreeBase, shadeTreeTop, shadeRock, glowShroom, furTent, nest, blackThrone, tornBanner, windStone, stoneDark, dohyo, drum };
})(window);
