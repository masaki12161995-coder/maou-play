// タイトル画面：夜明け前の川と小舟、遠くの城。光がゆっくり昇る。「つづきから」「はじめから」を押すと始まる
(function (root) {
"use strict";
const { W, H, hud } = DM, d = DM.d, px = DM.px, div = DM.div;
const cv = document.getElementById("field"), ctx = cv.getContext("2d");
let on = false, bg = null, t00 = 0;
const HOR = 372; // 水平線（ドット）

// 決まった乱数（毎回同じ絵になる）
function rng(seed) { let s = seed; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
// 動かない部分を1ドット＝1点で描いておく（空・星・山・城・岸）
function paint() {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d"), r = rng(7);
  // 空：上は藍、水平線に向かって朱。帯を少しずつ混ぜて、なめらかに見せる
  const SKY = ["#0b0d24", "#10133a", "#171a4c", "#22205a", "#332863", "#4a3068", "#683a68", "#8c4762", "#b25a58", "#d47a52", "#eca258", "#f6c676"];
  // 色と色のあいだを4段ずつに分けて、細かい帯にする（太い縞に見えないように）
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (t, dark) => { const k = Math.max(0, Math.min(SKY.length - 1.001, t)), i = Math.floor(k), f = Math.round((k - i) * 4) / 4, a = hex(SKY[i]), b2 = hex(SKY[i + 1]); return "rgb(" + a.map((v, j) => Math.round((v + (b2[j] - v) * f) * dark)).join(",") + ")"; };
  for (let y = 0; y < HOR; y++) { x.fillStyle = mix(y / HOR * (SKY.length - 1), 1); x.fillRect(0, y, W, 1); }
  // 星
  for (let i = 0; i < 90; i++) { const sx = Math.floor(r() * W), sy = Math.floor(r() * 210), b = r(); x.fillStyle = b > 0.85 ? "#fff8e0" : b > 0.5 ? "#b8b6e8" : "#6a68a8"; x.fillRect(sx, sy, 1, 1); if (b > 0.93) { x.fillRect(sx - 1, sy, 3, 1); x.fillRect(sx, sy - 1, 1, 3); } }
  // 遠い山なみ（3かさね）
  const ridge = (base, amp, col, seed, step) => {
    const q = rng(seed); let h = base; x.fillStyle = col;
    for (let px2 = 0; px2 < W; px2++) { if (px2 % step === 0) h += (q() - 0.5) * amp; h += (base - h) * 0.04; x.fillRect(px2, Math.round(h), 1, HOR - Math.round(h)); }
  };
  ridge(318, 16, "#5a3a66", 11, 3);
  // 城（山の上の影絵）：まんなかの塔がいちばん高い
  const cx = 196, cy = 300; x.fillStyle = "#3c2a52";
  [[-18, 14, 9], [-8, 24, 7], [0, 40, 9], [10, 26, 7], [18, 16, 9]].forEach(([ox, hgt, wd]) => { x.fillRect(cx + ox, cy - hgt, wd, hgt + 30); x.fillRect(cx + ox - 1, cy - hgt, wd + 2, 2); for (let k = 0; k < wd + 2; k += 2) x.fillRect(cx + ox - 1 + k, cy - hgt - 2, 1, 2); });
  x.beginPath(); x.moveTo(cx + 1, cy - 40 - 2); x.lineTo(cx + 4.5, cy - 52); x.lineTo(cx + 8, cy - 40 - 2); x.fill();
  x.fillStyle = "#f6c676"; x.fillRect(cx + 4, cy - 30, 1, 2); // 灯りがひとつだけ
  x.fillStyle = "#3c2a52"; let hh = 0; for (let px2 = 140; px2 < 260; px2++) { hh = 26 - Math.abs(px2 - 200) * 0.42 + Math.sin(px2 * 0.7) * 1.5; if (hh > 0) x.fillRect(px2, cy + 30 - Math.round(hh) - 6, 1, 60); }
  ridge(340, 12, "#3a2850", 23, 2);
  ridge(358, 7, "#281c3e", 31, 2);
  // 川：空の色を映す（上下さかさま。水平線の近くほど明るく、手前ほど暗い）
  for (let y = HOR; y < H; y++) { const k = (y - HOR) / (H - HOR); x.fillStyle = mix((1 - Math.pow(k, 0.7)) * (SKY.length - 1), 0.62 - k * 0.2); x.fillRect(0, y, W, 1); }
  x.fillStyle = "#281c3e"; x.fillRect(0, HOR, W, 2);
  // 手前の岸と草（影絵）
  const q = rng(51); x.fillStyle = "#0c0a18";
  for (let px2 = 0; px2 < W; px2++) { const gh = 26 + Math.sin(px2 * 0.045) * 9 + Math.sin(px2 * 0.21) * 3; x.fillRect(px2, H - Math.round(gh), 1, Math.round(gh)); if (q() > 0.45) x.fillRect(px2, H - Math.round(gh) - 1 - Math.floor(q() * 6), 1, 7); }
  return c;
}
// 小舟と、棹をさす人（影絵）
function boat(x, bx, by) {
  x.fillStyle = "#0c0a18";
  x.fillRect(bx - 17, by, 34, 3); x.fillRect(bx - 14, by + 3, 28, 2); x.fillRect(bx - 20, by - 1, 4, 2); x.fillRect(bx + 16, by - 1, 4, 2);
  x.fillRect(bx + 4, by - 13, 5, 13); x.fillRect(bx + 4, by - 18, 5, 5); x.fillRect(bx + 3, by - 17, 7, 3); // 人
  x.save(); x.translate(bx + 8, by - 12); x.rotate(-0.38); x.fillRect(-0.7, -14, 1.4, 40); x.restore(); // 棹（水の中へ斜めに）
}
const LIGHTS = (() => { const r = rng(99); return Array.from({ length: 26 }, () => ({ x: r() * W, y: r(), sp: 0.012 + r() * 0.02, ph: r() * 6.28, big: r() > 0.7, warm: r() > 0.4 })); })();
function draw(now) {
  if (!on) return;
  requestAnimationFrame(draw);
  const t = (now - t00) / 1000;
  const ox = Math.round(DM.OX * 4), oy = Math.round(DM.OY * 4);
  ctx.setTransform(4, 0, 0, 4, ox, oy); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bg, 0, 0); DM.bleed(ctx, document.getElementById("field")); // 枠の外（画面の端まで）は、絵をのばしてうめる
  ctx.setTransform(4, 0, 0, 4, ox, oy);
  // 水面のきらめき（横の細い線が、ゆっくり流れる）
  for (let i = 0; i < 46; i++) {
    const y = HOR + 4 + ((i * 37) % (H - HOR - 44)), w = 4 + (i * 13) % 14, sp = 3 + (i % 5);
    const x0 = ((i * 71 + t * sp) % (W + 40)) - 20, near = 1 - Math.min(1, Math.abs(x0 + w / 2 - 196) / 130);
    ctx.globalAlpha = (0.10 + near * 0.35) * (0.6 + 0.4 * Math.sin(t * 1.3 + i));
    ctx.fillStyle = near > 0.5 ? "#ffe0a0" : "#c8b8e8"; ctx.fillRect(Math.round(x0), y, w, 1);
  }
  ctx.globalAlpha = 1;
  const by = 404 + Math.round(Math.sin(t * 1.1) * 1), bx = 84; // 明るい水面の上に置く（影絵がはっきり見える所）
  boat(ctx, bx, by);
  ctx.globalAlpha = 0.3; ctx.fillStyle = "#0c0a18"; ctx.fillRect(bx - 16, by + 6, 32, 1); ctx.fillRect(bx - 11, by + 8, 22, 1); ctx.globalAlpha = 1;
  // 昇っていく光
  ctx.globalCompositeOperation = "lighter";
  for (const L of LIGHTS) {
    const yy = H - 20 - ((L.y + t * L.sp) % 1) * (H - 60), xx = L.x + Math.sin(t * 0.5 + L.ph) * 5, life = ((L.y + t * L.sp) % 1);
    const a = Math.sin(life * Math.PI) * (0.55 + 0.45 * Math.sin(t * 2 + L.ph));
    ctx.fillStyle = L.warm ? "#ffd890" : "#c0d0ff";
    ctx.globalAlpha = a * 0.22; ctx.fillRect(Math.round(xx) - 2, Math.round(yy) - 2, L.big ? 5 : 4, L.big ? 5 : 4);
    ctx.globalAlpha = a; ctx.fillRect(Math.round(xx) - (L.big ? 1 : 0), Math.round(yy) - (L.big ? 1 : 0), L.big ? 3 : 1, L.big ? 3 : 1);
  }
  ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
}
// ---- 記録の引っ越し（文字にして写す／貼りつけて入れる） ----
const SAVE_KEYS = ["rpgPlay1", "rpgCards1", "rpgSnd"], MARK = "SENSHIN1:";
async function copyOut() {
  const o = {}; SAVE_KEYS.forEach(k => { const v = localStorage.getItem(k); if (v !== null) o[k] = v; });
  const code = MARK + btoa(unescape(encodeURIComponent(JSON.stringify(o))));
  try { await navigator.clipboard.writeText(code); DM.toast("記録を写しました", 520); }
  catch (e) { prompt("", code); }
}
async function pasteIn() {
  let t = "";
  try { t = await navigator.clipboard.readText(); } catch (e) {}
  if (!t || !t.startsWith(MARK)) t = prompt("", "") || "";
  t = t.trim(); if (!t.startsWith(MARK)) { if (t) DM.toast("記録として読めませんでした", 520); return false; }
  let o; try { o = JSON.parse(decodeURIComponent(escape(atob(t.slice(MARK.length))))); } catch (e) { DM.toast("記録として読めませんでした", 520); return false; }
  if (!o.rpgPlay1) { DM.toast("記録として読めませんでした", 520); return false; }
  if (localStorage.getItem("rpgPlay1") && await UI.choose("", "今の記録と入れかえますか？", ["入れかえる", "やめる"]) !== 0) return false;
  SAVE_KEYS.forEach(k => { if (o[k] !== undefined) localStorage.setItem(k, o[k]); });
  return true;
}
// 出す。押されたほう（"new"＝はじめから／"cont"＝つづきから）を返す
function show(hasSave) {
  return new Promise(res => {
    bg = bg || paint(); on = true; t00 = performance.now(); requestAnimationFrame(draw);
    const build = () => {
      hud.innerHTML = "";
      const L = px(div("px titlelayer", ""), 0, 0, W, H); hud.appendChild(L);
      const put = (cls, html, y, size) => { const e = px(div(cls, html), 0, y, W); e.style.fontSize = d(size); L.appendChild(e); return e; };
      put("ttl ttl1", "千の心と", 132, 30);
      put("ttl ttl2", "空の玉座", 172, 46);
      const line = px(div("ttlline", ""), 92, 236, 117, 1); L.appendChild(line);
      const btn = (label, y, k, main) => {
        const b = px(div("ttlbtn" + (main ? " main" : ""), label), 78, y, 145, 36); b.style.fontSize = d(14); b.style.lineHeight = d(34); L.appendChild(b);
        b.onclick = async () => {
          if (k === "new" && hasSave) { [...L.querySelectorAll(".ttlbtn")].forEach(e => e.remove()); const a = await UI.choose("", "今の記録を消して、はじめから遊びますか？", ["はじめから", "やめる"]); if (a !== 0) { build(); return; } }
          on = false; hud.innerHTML = ""; res(k);
        };
      };
      if (hasSave) { btn("つづきから", 432, "cont", true); btn("はじめから", 478, "new", false); }
      else btn("はじめから", 452, "new", true);
      // 記録をうつす：Safariとホーム画面のアプリでは記録が別々なので、文字にして写し、もう片方で貼りつける
      const mv = px(div("ttlsub", "記録をうつす"), 98, 560, 105, 26); mv.style.fontSize = d(10.5); mv.style.lineHeight = d(26); L.appendChild(mv);
      mv.onclick = async () => {
        [...L.querySelectorAll(".ttlbtn,.ttlsub")].forEach(e => e.style.visibility = "hidden");
        const a = await UI.choose("", "", hasSave ? ["この記録を写す", "写した記録を入れる", "やめる"] : ["写した記録を入れる", "やめる"]);
        const pick = hasSave ? a : (a === 0 ? 1 : 2);
        if (pick === 0) await copyOut();
        else if (pick === 1 && await pasteIn()) return location.reload();
        build();
      };
    };
    build();
    DM.onFit.push(() => { if (on && !document.querySelector(".uilayer")) build(); });
  });
}
root.TT = { show };
})(window);
