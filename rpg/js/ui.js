// 会話・選択・メニュー・店・戦いの結果など、フィールドの上に出す画面
(function (root) {
"use strict";
const { hud, W, H } = DM, d = DM.d, px = DM.px, div = DM.div;
const IM = window.IMG;
const A = (parent, el, x, y, w, h) => { px(el, x, y, w, h); el.style.position = "absolute"; parent.appendChild(el); return el; };
const T = (parent, x, y, w, h, html, size, cls) => { const e = A(parent, div("t " + (cls || ""), html), x, y, w, h); e.style.fontSize = d(size); e.style.lineHeight = d(h); return e; };
const SLOT_NM = { weapon: "武器", armor: "鎧", sub: "盾・頭", acc: "飾り", heart: "心" };
const STAT_SHORT = { str: "腕力", vit: "体力", dex: "器用", agi: "素早", int: "知力", wil: "精神", lov: "愛", cha: "魅力" };

let layer = null;
function clearLayer() { if (layer) layer.remove(); layer = null; }
function newLayer(cls) { clearLayer(); layer = A(hud, div("px uilayer " + (cls || ""), ""), 0, 0, W, H); return layer; }

// ---------- 会話 ----------
// pages：文字列の配列（1つ40字まで）。顔の絵があれば左に出す
function say(name, pages, img) {
  return new Promise(res => {
    const L = newLayer("talk");
    const box = A(L, div("frame dlg", ""), 8, 520, 285, 102);
    if (name) { const nt = A(L, div("nmtag", name), 14, 503, undefined, 20); nt.style.fontSize = d(10); nt.style.lineHeight = d(18); nt.style.padding = `0 ${d(8)}`; }
    const tx = A(box, div("dtext", ""), 12, 8, 259, 84); tx.style.fontSize = d(11.5); tx.style.lineHeight = d(19);
    const arrow = A(box, div("darr", "▼"), 262, 80, 12, 12); arrow.style.fontSize = d(9);
    let i = 0, shown = 0, timer = null, full = "";
    const show = () => {
      full = pages[i]; shown = 0; arrow.style.visibility = "hidden";
      clearInterval(timer);
      timer = setInterval(() => { shown += 2; tx.textContent = full.slice(0, shown); if (shown >= full.length) { clearInterval(timer); arrow.style.visibility = "visible"; } }, 24);
    };
    L.onclick = () => {
      if (shown < full.length) { shown = full.length; tx.textContent = full; clearInterval(timer); arrow.style.visibility = "visible"; return; }
      i++; if (i >= pages.length) { clearInterval(timer); clearLayer(); res(); return; }
      show();
    };
    show();
  });
}
// 選ぶ：会話の窓の上に、選べる行を出す。返り値は選んだ番号（やめるは最後）
function choose(name, text, opts) {
  return new Promise(res => {
    const L = newLayer("talk");
    const box = A(L, div("frame dlg", ""), 8, 520, 285, 102);
    if (name) { const nt = A(L, div("nmtag", name), 14, 503, undefined, 20); nt.style.fontSize = d(10); nt.style.lineHeight = d(18); nt.style.padding = `0 ${d(8)}`; }
    const tx = A(box, div("dtext", text), 12, 8, 259, 84); tx.style.fontSize = d(11.5); tx.style.lineHeight = d(19);
    const rh = 28, top = 494 - opts.length * rh - 8;
    const cb = A(L, div("frame chbox", ""), 141, top, 152, opts.length * rh + 8);
    opts.forEach((o, k) => {
      const r = A(cb, div("chrow", o), 4, 4 + k * rh, 140, rh - 2); r.style.fontSize = d(11); r.style.lineHeight = d(rh - 2);
      r.onclick = e => { e.stopPropagation(); clearLayer(); res(k); };
    });
  });
}

// ---------- 戦いの結果（お金・手に入れた物・与えたダメージ・成長を、ひと目で） ----------
function heartImg(k) { const f = Object.values(BT.FOES).find(f => f.heart === k); return f ? f.img : null; }
function heartIcon(k, size) { // 心の絵：その魔物の姿を丸い枠に入れる
  const box = div("hicon", ""); box.style.width = box.style.height = d(size);
  const im = IM[heartImg(k)]; if (im) { const e = document.createElement("img"); e.src = im.src; const sc = Math.min(size * 0.86 / im.naturalWidth, size * 0.86 / im.naturalHeight); e.style.width = d(im.naturalWidth * sc); e.style.height = d(im.naturalHeight * sc); box.appendChild(e); }
  return box;
}
function result(r) {
  return new Promise(res => {
    const L = newLayer("veil solid result");
    if (!r.win) {
      T(L, 0, 250, W, 40, r.time ? "引き分け" : "全滅……", 26, "gold center");
      T(L, 0, 300, W, 20, r.time ? "戦いを切り上げた" : "宿で目を覚ました", 11, "center dim");
      L.onclick = () => { clearLayer(); res(); }; return;
    }
    T(L, 0, 48, W, 34, "勝利", 26, "gold center");
    if (r.turns) T(L, 200, 58, 89, 18, `${r.turns}ターン`, 9.5, "dim right");
    let y = 90;
    const money = A(L, div("frame rbox", ""), 12, y, 277, 28);
    T(money, 10, 0, 60, 26, "お金", 9.5, "label");
    T(money, 70, 0, 100, 26, `+${r.gold.toLocaleString()} G`, 13, "num2 gold");
    T(money, 150, 0, 118, 26, `持っている ${GS.G.gold.toLocaleString()} G`, 9, "dim right");
    y += 36;
    T(L, 14, y, 200, 14, "手に入れた物", 9, "label"); y += 16;
    const drops = [...r.hearts.map(h => ({ h })), ...r.items.map(it => ({ it }))];
    if (!drops.length) { T(L, 14, y, 260, 24, "なし", 10, "dim"); y += 26; }
    drops.forEach((dp, i) => {
      const x = 12 + (i % 2) * 140, yy = y + Math.floor(i / 2) * 32, t = A(L, div("frame dtile", ""), x, yy, 137, 29);
      if (dp.h) { A(t, heartIcon(dp.h, 23), 3, 2, 23, 23); T(t, 30, 0, 104, 27, `<span class="heartnm">${BT.HEARTS[dp.h].nm}</span>`, 9.5, ""); }
      else { const g = BT.GEAR[dp.it.id]; A(t, DM.iconImg(g.icon, 22 * DM.K), 4, 3, undefined, undefined); T(t, 30, 0, 104, 27, `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(dp.it)}</span>`, 9.5, "name"); }
    });
    y += Math.ceil(drops.length / 2) * 32 + 8;
    T(L, 14, y, 200, 14, "与えたダメージ", 9, "label"); y += 16;
    const max = Math.max(1, ...r.growth.map(g => g.dealt || 0));
    r.growth.slice().sort((a, b) => (b.dealt || 0) - (a.dealt || 0)).forEach(g => {
      const row = A(L, div("dmgrow", ""), 12, y, 277, 22);
      const fc = DM.spriteBox(IM[g.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 20 * DM.K); A(row, fc, 0, 1, undefined, undefined);
      T(row, 26, 0, 56, 22, g.nm, 10, "name");
      const bar = A(row, div("dbar", `<i style="width:${(g.dealt || 0) / max * 100}%"></i>`), 84, 8, 140, 6);
      T(row, 228, 0, 49, 22, `${(g.dealt || 0).toLocaleString()}`, 10.5, "num2 right");
      y += 24;
    });
    y += 6;
    T(L, 14, y, 200, 14, "成長", 9, "label"); y += 16;
    r.growth.forEach(g => {
      const row = A(L, div("frame grow", ""), 12, y, 277, 28);
      const fc = DM.spriteBox(IM[g.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 22 * DM.K); A(row, fc, 3, 2, undefined, undefined);
      T(row, 30, 0, 52, 26, g.nm, 10, "name");
      const chips = g.ups.map(u => `<span class="upchip">${u.k === "hp" ? "HP" : BT.ST_NM[u.k]}<b>+${u.v}</b></span>`).join("");
      const c = A(row, div("chips", chips || '<span class="dim">変わりなし</span>'), 84, 0, 190, 26); c.style.fontSize = d(8.5);
      y += 31;
    });
    const nx = T(L, 0, Math.min(612, y + 4), W, 14, "▼", 9, "center gold blink");
    L.onclick = () => { clearLayer(); res(); };
  });
}

// ---------- メニュー（仲間・陣形・札帳） ----------
let tab = "party", who = -1, slotSel = null, fsel = -1;
function menu() {
  return new Promise(res => {
    const close = () => { clearLayer(); GS.save(); res(); };
    const draw = () => {
      const L = newLayer("veil solid menu");
      [["party", "仲間"], ["form", "陣形"], ["book", "札帳"]].forEach(([k, nm], i) => {
        const b = A(L, div("frame btn chip" + (tab === k ? " sel" : ""), nm), 12 + i * 82, 46, 78, 26); b.style.fontSize = d(11);
        b.onclick = () => { if (k === "book") { cards("book").then(draw); return; } tab = k; who = -1; slotSel = null; fsel = -1; draw(); };
      });
      const x = A(L, div("frame btn chip", "×"), 263, 46, 26, 26); x.style.fontSize = d(14); x.onclick = close;
      const gold = T(L, 12, 78, 277, 16, `<span class="dim">お金</span> <b>${GS.G.gold.toLocaleString()}</b> G`, 10, "num2 right");
      if (tab === "party") who < 0 ? partyList(L, draw) : member(L, draw);
      else formation(L, draw);
      if (tab === "party" && who < 0) {
        const r = A(L, div("frame btn chip dimchip", "はじめから"), 189, 596, 100, 24); r.style.fontSize = d(9.5);
        r.onclick = async () => { const k = await choose("", "記録を消して、はじめから遊びますか？", ["はじめから", "やめる"]); if (k === 0) { GS.reset(); try { localStorage.removeItem("rpgCards1"); } catch (e) {} location.reload(); } else draw(); };
      }
    };
    draw();
  });
}
function partyList(L, redraw) {
  BT.HEROES.forEach((h, hi) => {
    const m = GS.G.party[hi];
    const row = A(L, div("frame prow", ""), 12, 100 + hi * 56, 277, 52);
    const fc = DM.spriteBox(IM[h.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 40 * DM.K); fc.style.position = "absolute"; fc.style.left = d(4); fc.style.top = d(4); row.appendChild(fc);
    T(row, 50, 4, 120, 18, `${h.nm}<span class="rare r${h.rare}">${h.rare}</span>`, 12, "name");
    T(row, 50, 26, 120, 16, `${BT.WTYPE[h.wt].nm}${m.heart ? "・" + BT.HEARTS[m.heart].nm : ""}`, 9, "dim2");
    T(row, 176, 6, 92, 16, `<span class="k">HP</span> ${m.hp}`, 10, "num2");
    T(row, 176, 26, 92, 16, `<span class="k">LP</span> ${m.lp}<small>/${h.lp}</small>`, 10, "num2");
    row.onclick = () => { who = hi; slotSel = null; redraw(); };
  });
}
function gearSummary(id) {
  const g = BT.GEAR[id], out = [];
  if (g.slot === "weapon") out.push(`威力${g.pow}`);
  for (const k in (g.st || {})) out.push(`${STAT_SHORT[k]}${g.st[k] > 0 ? "+" : ""}${g.st[k]}`);
  if (g.res) { const phys = Math.round(((g.res.斬 || 0) + (g.res.打 || 0) + (g.res.突 || 0)) / 3), mag = Math.round(((g.res.熱 || 0) + (g.res.冷 || 0) + (g.res.雷 || 0)) / 3); out.push(`物理${phys >= 0 ? "+" : ""}${phys}`); if (mag) out.push(`術${mag > 0 ? "+" : ""}${mag}`); }
  if (g.sres) for (const k in g.sres) out.push(`${k}よけ`);
  return out.join(" ");
}
function itemSummary(it) {
  let s = gearSummary(it.id);
  for (const k in (it.b || {})) s += ` <span class="bonus">${STAT_SHORT[k]}+${it.b[k]}</span>`;
  return s;
}
function heartSummary(k) {
  const h = BT.HEARTS[k];
  const ups = h.up.map(s => STAT_SHORT[s]).join("・");
  return `技：${BT.SKILLS[h.sk].nm}　${ups}が伸びやすい`;
}
function member(L, redraw) {
  const h = BT.HEROES[who], m = GS.G.party[who];
  const back = A(L, div("frame btn chip", "↩"), 12, 100, 30, 30); back.style.fontSize = d(13); back.onclick = () => { who = -1; slotSel = null; redraw(); };
  const fc = DM.spriteBox(IM[h.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 44 * DM.K); A(L, fc, 48, 96, undefined, undefined);
  T(L, 98, 98, 150, 22, `${h.nm}<span class="rare r${h.rare}">${h.rare}</span>`, 14, "name");
  T(L, 98, 120, 80, 16, `${BT.WTYPE[h.wt].nm}${m.heart ? "・" + BT.HEARTS[m.heart].nm : ""}`, 9, "dim2");
  // HPとLP
  const hb = A(L, div("frame rbox", ""), 12, 140, 277, 26);
  T(hb, 10, 0, 30, 24, "HP", 10, "k");
  T(hb, 36, 0, 60, 24, `${m.hp}`, 13, "num2");
  T(hb, 140, 0, 30, 24, "LP", 10, "k");
  const pips = A(hb, div("lpips", Array.from({ length: h.lp }, (_, i) => `<i class="${i < m.lp ? "on" : ""}"></i>`).join("")), 164, 8, 106, 9);
  // 能力値（装備・心を入れた値。↑は上がりやすい：緑＝本人、紫＝心）
  const S = BT.heroStats(BT.resolveHero(who, m));
  const heart = m.heart && BT.HEARTS[m.heart];
  BT.STATS.forEach((k, i) => {
    const col = i % 2, row = Math.floor(i / 2), x = 12 + col * 140, y = 172 + row * 27;
    const box = A(L, div("frame sbox", ""), x, y, 137, 25);
    T(box, 8, 0, 52, 23, BT.ST_NM[k], 10, "label");
    T(box, 60, 0, 42, 23, `${S.st[k]}`, 13, "num2 right");
    const up = (h.up.includes(k) ? '<span class="upm">↑</span>' : "") + (heart && heart.up.includes(k) ? '<span class="upm2">↑</span>' : "");
    T(box, 106, 0, 28, 23, up, 10, "");
  });
  // 装備と心（ラベルの幅をそろえて縦に並べる）
  const slots = ["weapon", "armor", "sub", "acc", "heart"];
  const ey = 284;
  slots.forEach((sl, i) => {
    const y = ey + i * 36, row = A(L, div("frame slotrow" + (slotSel === sl ? " on" : ""), ""), 12, y, 277, 34);
    T(row, 8, 0, 44, 32, SLOT_NM[sl], 10, "label");
    if (sl === "heart") {
      if (m.heart) { A(row, heartIcon(m.heart, 24), 50, 4, 24, 24); T(row, 80, 2, 192, 16, `<span class="heartnm">${BT.HEARTS[m.heart].nm}</span>`, 11, "name"); T(row, 80, 17, 192, 14, heartSummary(m.heart), 8.5, "dim2"); }
      else T(row, 54, 0, 220, 32, "なし", 10.5, "dim");
    } else {
      const it = m.gear[sl];
      if (it) {
        const g = BT.GEAR[it.id], ic = DM.iconImg(g.icon, 24 * DM.K); A(row, ic, 50, 4, undefined, undefined);
        T(row, 80, 2, 192, 16, `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(it)}</span>`, 11, "name");
        T(row, 80, 17, 192, 14, itemSummary(it), 8.5, "dim2");
      } else T(row, 54, 0, 220, 32, "なし", 10.5, "dim");
    }
    row.onclick = () => { slotSel = slotSel === sl ? null : sl; redraw(); };
  });
  if (slotSel) candidates(L, redraw, ey + slots.length * 36 + 4);
}
function candidates(L, redraw, y0) {
  const h = BT.HEROES[who], m = GS.G.party[who], G = GS.G, sl = slotSel, list = [];
  if (sl === "heart") {
    if (m.heart) list.push({ nm: "外す", act: () => { G.hearts[m.heart] = (G.hearts[m.heart] || 0) + 1; m.heart = null; } });
    Object.keys(G.hearts).filter(k => G.hearts[k] > 0 && k !== m.heart).forEach(k => list.push({ html: `<span class="heartnm">${BT.HEARTS[k].nm}</span> <small>×${G.hearts[k]}</small>`, sub: heartSummary(k), act: () => { if (m.heart) G.hearts[m.heart] = (G.hearts[m.heart] || 0) + 1; G.hearts[k]--; m.heart = k; } }));
  } else {
    if (sl !== "weapon" && m.gear[sl]) list.push({ nm: "外す", act: () => { G.bag.push(m.gear[sl]); m.gear[sl] = null; } });
    G.bag.filter(it => { const g = BT.GEAR[it.id]; return g.slot === sl && (sl !== "weapon" || g.wt === h.wt); }).forEach(it => {
      const g = BT.GEAR[it.id];
      list.push({ icon: g.icon, html: `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(it)}</span>`, sub: itemSummary(it), act: () => { G.bag.splice(G.bag.indexOf(it), 1); if (m.gear[sl]) G.bag.push(m.gear[sl]); m.gear[sl] = it; } });
    });
  }
  const box = A(L, div("frame cands", ""), 12, y0, 277, Math.max(34, Math.min(4, list.length) * 34 + 4));
  if (!list.length) { T(box, 10, 4, 257, 26, sl === "weapon" ? `使える${BT.WTYPE[h.wt].nm}を持っていない` : "替えられる物を持っていない", 9.5, "dim"); return; }
  list.slice(0, 4).forEach((c, i) => {
    const r = A(box, div("cand2", ""), 2, 2 + i * 34, 273, 32);
    if (c.icon) A(r, DM.iconImg(c.icon, 22 * DM.K), 38, 4, undefined, undefined);
    if (c.nm) T(r, 52, 0, 200, 32, c.nm, 10.5, "name");
    else { T(r, 64, 1, 205, 16, c.html, 10.5, "name"); T(r, 64, 16, 205, 14, c.sub, 8.5, "dim2"); }
    r.onclick = () => { c.act(); slotSel = null; GS.save(); redraw(); };
  });
}
function formation(L, redraw) {
  const G = GS.G;
  Object.entries(BT.FORMATIONS).forEach(([k, f], i) => {
    const b = A(L, div("frame btn chip" + (G.lo.form === k ? " sel" : ""), f.nm), 12 + i * 93, 100, 89, 26); b.style.fontSize = d(10.5);
    b.onclick = () => { G.lo.form = k; fsel = -1; GS.save(); redraw(); };
  });
  const F = BT.FORMATIONS[G.lo.form];
  T(L, 12, 130, 277, 16, F.ds, 8.5, "dim2");
  A(L, div("frame", ""), 12, 150, 277, 236);
  T(L, 20, 154, 60, 14, "← 敵", 8, "dim");
  F.slots.forEach((sl, slot) => {
    const h = BT.HEROES[G.lo.pos[slot]];
    const cx = 44 + sl.c * 80, cy = 168 + sl.r * 42;
    const t = A(L, div("frame tile" + (fsel === slot ? " sel" : ""), ""), cx, cy, 80, 38);
    const fc = DM.spriteBox(IM[h.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 26 * DM.K); fc.style.position = "absolute"; fc.style.left = d(2); fc.style.top = d(3); t.appendChild(fc);
    const tx = div("tn", `${h.nm}<br><i>${sl.h >= 2 ? "狙われやすい" : sl.h < 1 ? "狙われにくい" : ""}</i>`); tx.style.fontSize = d(7.5); tx.style.left = d(24); tx.style.top = d(6); t.appendChild(tx);
    t.onclick = () => { if (fsel < 0) { fsel = slot; redraw(); return; } const a = G.lo.pos[fsel]; G.lo.pos[fsel] = G.lo.pos[slot]; G.lo.pos[slot] = a; fsel = -1; GS.save(); redraw(); };
  });
}

// ---------- 店 ----------
function shop(title, ids) {
  return new Promise(res => {
    const draw = () => {
      const L = newLayer("veil solid");
      T(L, 12, 46, 200, 26, title, 14, "gold");
      const x = A(L, div("frame btn chip", "×"), 263, 46, 26, 26); x.style.fontSize = d(14); x.onclick = () => { clearLayer(); GS.save(); res(); };
      T(L, 12, 78, 277, 16, `<span class="dim">お金</span> <b>${GS.G.gold.toLocaleString()}</b> G`, 10, "num2 right");
      ids.forEach((id, i) => {
        const g = BT.GEAR[id], have = GS.G.bag.filter(it => it.id === id).length + GS.G.party.filter(m => Object.values(m.gear).some(it => it && it.id === id)).length;
        const r = A(L, div("frame shoprow" + (GS.G.gold < g.price ? " poor" : ""), ""), 12, 100 + i * 40, 277, 36);
        A(r, DM.iconImg(g.icon, 22 * DM.K), 6, 6, undefined, undefined);
        T(r, 34, 2, 150, 17, `<span style="color:${DM.RANKCOL[g.rank]}">${g.nm}</span><small class="dim"> ${g.slot === "weapon" ? BT.WTYPE[g.wt].nm : g.kind || SLOT_NM[g.slot]}</small>`, 10.5, "name");
        T(r, 34, 18, 170, 14, gearSummary(id), 8.5, "dim2");
        T(r, 196, 2, 76, 17, `${g.price}<small> G</small>`, 11, "num2 right");
        T(r, 196, 18, 76, 14, have ? `持っている ${have}` : "", 8, "dim right");
        r.onclick = () => {
          if (GS.G.gold < g.price) { DM.toast("お金が足りない", 560); return; }
          GS.G.gold -= g.price; GS.G.bag.push(GS.item(id)); GS.save(); draw(); DM.toast(`${g.nm}を買った`, 560);
        };
      });
    };
    draw();
  });
}

// ---------- 札（別のページを上にかぶせる） ----------
function cards(go, k) {
  return new Promise(res => {
    GS.save();
    const f = document.createElement("iframe");
    f.className = "cardframe"; f.src = `cards.html?go=${go}${k !== undefined ? "&k=" + k : ""}&v=${Date.now() % 1e6}`;
    document.body.appendChild(f);
    const on = e => { if (e.data && e.data.t === "close") { removeEventListener("message", on); f.remove(); GS.syncGoldFromDisk(); res(e.data); } };
    addEventListener("message", on);
  });
}

root.UI = { say, choose, result, menu, shop, cards, clear: clearLayer };
})(window);
