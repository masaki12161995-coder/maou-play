// 画面の共通の道具：大きさ合わせ（1ドット＝K px）と、DOMの部品
(function (root) {
"use strict";
const W = 301, H = 655;
const DPR = window.devicePixelRatio || 2;
const stage = document.getElementById("stage"), hud = document.getElementById("hud");
const M = { W, H, DPR, K: 2, stage, hud, onFit: [] };
M.fit = () => {
  const w = Math.min(innerWidth, innerHeight * W / H);
  M.K = w / W;
  stage.style.width = w + "px"; stage.style.height = (w * H / W) + "px";
  M.onFit.forEach(f => f());
};
M.d = v => v * M.K + "px";
M.px = (el, x, y, w, h) => { el.style.left = M.d(x); el.style.top = M.d(y); if (w !== undefined) el.style.width = M.d(w); if (h !== undefined) el.style.height = M.d(h); return el; };
M.div = (cls, html) => { const e = document.createElement("div"); e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
// 人物の絵の一部（顔など）を、整数倍で切り出して置く
M.spriteBox = (img, sx, sy, sw, sh, wantPt) => {
  const s = Math.max(1, Math.round(wantPt * DPR / Math.max(sw, sh))) / DPR;
  const e = M.div("face");
  e.style.width = sw * s + "px"; e.style.height = sh * s + "px";
  e.style.backgroundImage = `url(${img.src})`;
  e.style.backgroundSize = `${img.naturalWidth * s}px ${img.naturalHeight * s}px`;
  e.style.backgroundPosition = `${-sx * s}px ${-sy * s}px`;
  return e;
};
// 装備などのアイコン（素材の大きさの整数倍）
M.iconImg = (src, wantPt) => {
  const e = document.createElement("img"); e.src = "img/" + src + ".png"; e.className = "ico";
  e.onload = () => { const s = Math.max(1, Math.round(wantPt * DPR / Math.max(e.naturalWidth, e.naturalHeight))) / DPR; e.style.width = e.naturalWidth * s + "px"; e.style.height = e.naturalHeight * s + "px"; };
  return e;
};
M.EL = { 斬: "#9aa0b4", 打: "#b8925a", 突: "#5f8fb0", 熱: "#d8573a", 冷: "#4a8ad8", 雷: "#c9a42a", 陽: "#d8b84a", 陰: "#7a5ab0" };
M.icon = (a, size) => `<b class="at" style="background:${M.EL[a]};width:${M.d(size)};height:${M.d(size)};line-height:${M.d(size)};font-size:${M.d(size * 0.72)}">${a}</b>`;
// ランクの色（素材バンクのレア度の枠と同じ並び：白→緑→青→紫→金→虹）
M.RANKCOL = { B: "#d8d4cc", A: "#6fcf6a", S: "#5aa8f0", SS: "#b07ae8", SSS: "#f0c040" };
M.FACE = [58, 4, 28, 30];
M.toast = (text, y) => {
  const e = M.px(M.div("toast", text), 0, y || 300, W); e.style.fontSize = M.d(10);
  hud.appendChild(e); setTimeout(() => e.remove(), 1400);
};
root.DM = M;
root.IMG = {};
M.load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(i); i.src = "img/" + src + ".png"; root.IMG[src] = i; });
})(window);
