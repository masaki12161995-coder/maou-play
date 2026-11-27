// 画面の共通の道具：大きさ合わせ（1ドット＝K px）と、DOMの部品
(function (root) {
"use strict";
const W = 301, H = 655;
const DPR = window.devicePixelRatio || 2;
const stage = document.getElementById("stage"), hud = document.getElementById("hud");
const M = { W, H, DPR, K: 2, stage, hud, onFit: [] };
// 画面の作り：絵（地図・戦いの背景・タイトル）は画面の端から端まで描く。
// 文字やボタン（hud）は、301×655 の枠を、切り欠きやホームバー（safe-area）をよけた所の真ん中に置く。
//  VW・VH＝画面ぜんぶの広さ、OX・OY＝枠の左上（どちらも枠の点の単位）。SL・ST・SR・SB＝さわれる所の端（枠の点の単位）
const probe = document.createElement("div"); probe.id = "safeprobe"; document.body.appendChild(probe);
M.fit = () => {
  const c = getComputedStyle(probe), n = k => parseFloat(c[k]) || 0;
  let sl = n("paddingLeft"), sr = n("paddingRight"), st = n("paddingTop"), sb = n("paddingBottom");
  // iPhoneのホーム画面から開いたとき、起動の直後は切り欠きの高さが0と返ることがある。そのときは機種の大きさから決めた値を使い、
  // 本当の値が届いたら（下の見張りで）すぐ置きかえる
  const ios = /iPhone/.test(navigator.userAgent), full = navigator.standalone || matchMedia("(display-mode: standalone)").matches, sh = Math.max(screen.width, screen.height);
  if (ios && full && innerHeight > innerWidth && sh >= 812) { if (st < 20) st = sh >= 874 ? 62 : sh >= 852 ? 59 : 47; if (sb < 10) sb = 34; }
  M.safeKey = [c.paddingTop, c.paddingBottom, c.paddingLeft, c.paddingRight].join();
  const vw = innerWidth, vh = innerHeight, aw = vw - sl - sr, ah = vh - st - sb;
  const K = Math.min(aw / W, ah / H), bw = W * K, bh = H * K, bx = sl + (aw - bw) / 2, by = st + (ah - bh) / 2;
  M.K = K; M.safePx = { t: st, b: sb, l: sl, r: sr };
  stage.style.width = vw + "px"; stage.style.height = vh + "px";
  hud.style.left = bx + "px"; hud.style.top = by + "px"; hud.style.width = bw + "px"; hud.style.height = bh + "px";
  M.VW = vw / K; M.VH = vh / K; M.OX = bx / K; M.OY = by / K;
  M.SL = (sl - bx) / K; M.ST = (st - by) / K; M.SR = (vw - sr - bx) / K; M.SB = (vh - sb - by) / K;
  const cv = document.getElementById("field"), cw = Math.round(M.VW * 4), ch = Math.round(M.VH * 4);
  if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; cv.getContext("2d").imageSmoothingEnabled = false; }
  M.onFit.forEach(f => f());
};
// 切り欠き・ホームバーの大きさが後から変わったら（起動の直後や、向きを変えたとき）、合わせ直す
setInterval(() => { const c = getComputedStyle(probe); if ([c.paddingTop, c.paddingBottom, c.paddingLeft, c.paddingRight].join() !== M.safeKey) M.fit(); }, 500);
["orientationchange", "pageshow"].forEach(e => addEventListener(e, () => setTimeout(() => M.fit(), 60)));
document.addEventListener("visibilitychange", () => { if (!document.hidden) setTimeout(() => M.fit(), 60); });
if (window.visualViewport) visualViewport.addEventListener("resize", () => M.fit());
// 画面ぜんぶにかぶせる幕（戦いに入るときの光など）。文字の枠ではなく、画面の端から端まで
M.screenLayer = cls => { const e = M.div(cls, ""); e.style.cssText = "position:absolute;inset:0;z-index:5"; stage.appendChild(e); return e; };
// 枠の中に描いた絵（背景）を、枠の外へのばす：左右は端の帯を裏返して、上下は端の1列を引きのばす
M.bleed = (ctx, cv, keepTop) => { // keepTop：枠の上にも本物の絵が描いてあるときは、上はのばさない
  const bx = Math.round(M.OX * 4), by = Math.round(M.OY * 4), bw = Math.round(W * 4), bh = Math.round(H * 4);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const y0 = keepTop ? 0 : by, hh = by + bh - y0;   // 上にも絵があるときは、上の端から裏返す
  if (bx > 0) {
    ctx.save(); ctx.translate(bx, 0); ctx.scale(-1, 1); ctx.drawImage(cv, bx, y0, bx, hh, 0, y0, bx, hh); ctx.restore();
    const rx = bx + bw, rw = cv.width - rx;
    if (rw > 0) { ctx.save(); ctx.translate(rx + rw, 0); ctx.scale(-1, 1); ctx.drawImage(cv, rx - rw, y0, rw, hh, 0, y0, rw, hh); ctx.restore(); }
  }
  if (by > 0 && !keepTop) ctx.drawImage(cv, 0, by, cv.width, 1, 0, 0, cv.width, by);
  const bot = by + bh; if (bot < cv.height) ctx.drawImage(cv, 0, bot - 1, cv.width, 1, 0, bot, cv.width, cv.height - bot);
  ctx.restore();
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
// 絵の表。読み込んでいない絵を使おうとしたら、その場で読み込み始める（描けるようになるまでは何も描かない。止まらない）
root.IMG = new Proxy({}, { get(t, k) { if (typeof k === "string" && !(k in t) && /^[a-z][a-z0-9_]*$/.test(k)) M.load(k); return t[k]; } });
M.load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(i); i.src = "img/" + src + ".png"; root.IMG[src] = i; });
})(window);
