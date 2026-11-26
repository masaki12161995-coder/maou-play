// 会話・選択・メニュー・店・戦いの結果など、フィールドの上に出す画面
(function (root) {
"use strict";
const { hud, W, H } = DM, d = DM.d, px = DM.px, div = DM.div;
const IM = window.IMG;
const A = (parent, el, x, y, w, h) => { px(el, x, y, w, h); el.style.position = "absolute"; parent.appendChild(el); return el; };
const T = (parent, x, y, w, h, html, size, cls) => { const e = A(parent, div("t " + (cls || ""), html), x, y, w, h); e.style.fontSize = d(size); e.style.lineHeight = d(h); return e; };
const SLOT_NM = { weapon: "武器", armor: "主防具", sub: "副防具", acc: "装飾品", heart: "心" }; // 本家と同じ呼び方
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
    // 戦いの記録（本家と同じ：与えたダメージ・受けたダメージ・回復）。列ごとに一番の人を金色に
    const cols = [["dealt", "与ダメージ"], ["taken", "被ダメージ"], ["healed", "回復"]], best = {};
    cols.forEach(([k]) => { best[k] = Math.max(...r.growth.map(g => g[k] || 0)); });
    const tb = A(L, div("frame rbox", ""), 12, y, 277, 22 + r.growth.length * 22);
    cols.forEach(([k, nm], i) => T(tb, 96 + i * 60, 2, 56, 16, nm, 8, "label right"));
    r.growth.forEach((g, j) => {
      const yy = 20 + j * 22;
      const fc = DM.spriteBox(IM[g.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 18 * DM.K); A(tb, fc, 6, yy + 1, undefined, undefined);
      T(tb, 28, yy, 64, 20, g.nm, 9.5, "name");
      cols.forEach(([k], i) => { const v = g[k] || 0; T(tb, 96 + i * 60, yy, 56, 20, v.toLocaleString(), 10.5, "num2 right" + (v && v === best[k] ? " top" : v ? "" : " zero")); });
    });
    y += 22 + r.growth.length * 22 + 2;
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
// ---------- メニュー：上に「仲間・持ち物・陣形・札帳」を並べ、押すとその画面に切り替わる ----------
let tab = "party", who = 0, view = "stat", slotSel = null, fsel = -1, bsel = null, pickItem = null;
function menu() {
  return new Promise(res => {
    const close = () => { clearLayer(); GS.save(); res(); };
    const draw = () => {
      const L = newLayer("veil solid menu");
      [["party", "仲間"], ["bag", "持ち物"], ["form", "陣形"], ["book", "札帳"]].forEach(([k, nm], i) => {
        const b = A(L, div("frame btn chip" + (tab === k ? " sel" : ""), nm), 12 + i * 62, 46, 59, 28); b.style.fontSize = d(11);
        b.onclick = () => { if (k === "book") { cards("book").then(draw); return; } tab = k; slotSel = null; fsel = -1; bsel = null; pickItem = null; draw(); };
      });
      const x = A(L, div("frame btn chip", "×"), 261, 46, 28, 28); x.style.fontSize = d(14); x.onclick = close;
      if (tab === "party") member(L, draw);
      else if (tab === "bag") bag(L, draw);
      else formation(L, draw);
    };
    draw();
  });
}
const faceAt = (parent, img, x, y, size) => { const fc = DM.spriteBox(IM[img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], size * DM.K); A(parent, fc, x, y, undefined, undefined); return fc; };
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
// 技の1行（戦闘の技選びと同じ並び：属性・名前・威力・範囲・近遠・BP）
function skillRow(parent, k, y, tag, wt) {
  const s0 = BT.SKILLS[k], s = k === "attack" && wt ? { ...s0, at: BT.WTYPE[wt].at, dist: wt === "bow" ? "遠" : "近" } : s0; // 通常攻撃は武器の属性・間合い
  const at = s.at || [], row = A(parent, div("skrow", ""), 0, y, 277, 21);
  const rank = s.kind === "攻撃" ? (s.rank && s.rank !== "N" ? s.rank : "—") : null;
  row.innerHTML = `<span style="left:${d(6)};width:${d(24)};display:flex;gap:1px">${at.map(a => DM.icon(a, 10)).join("")}</span>` +
    `<span class="sn" style="left:${d(32)};font-size:${d(10.5)}">${s.nm}${tag ? `<i class="tagh" style="font-size:${d(7.5)}">${tag}</i>` : ""}</span>` +
    (rank ? `<span class="rk" style="left:${d(140)};font-size:${d(8)}">威力<b style="font-size:${d(9.5)}">${rank}</b></span>` : `<span class="rk kind" style="left:${d(140)};font-size:${d(8.5)}">${s.kind}</span>`) +
    `<span class="rg" style="left:${d(180)};font-size:${d(8.5)}">${BT.RANGE_NM[s.tg]}</span>` +
    (s.dist ? `<span class="ds ${s.dist === "近" ? "near" : "far"}" style="left:${d(212)};font-size:${d(7.5)};width:${d(12)};height:${d(12)};line-height:${d(12)}">${s.dist}</span>` : "") +
    `<span class="bp" style="right:${d(8)};font-size:${d(9.5)}">${s.bp ? "BP" + s.bp : ""}</span>`;
  return row;
}
// 顔の並び：5人ずつ。5人より多いときだけ両端に◀▶が出て、めくれる
//  list＝仲間の番号、o.sel＝選んでいる人、o.ok(hi)＝押せるか、o.pick(hi)＝押したとき、o.pg＝{n:今の枚目}、o.small＝小さい顔
function faceStrip(parent, x, y, w, list, o, redraw) {
  const many = list.length > 5, aw = many ? 17 : 0, per = 5, pages = Math.max(1, Math.ceil(list.length / per));
  o.pg.n = Math.max(0, Math.min(pages - 1, o.pg.n));
  const step = (w - aw * 2) / per, bw = step - 3, bh = o.small ? 36 : 42, fs = o.small ? 32 : 36;
  list.slice(o.pg.n * per, o.pg.n * per + per).forEach((hi, i) => {
    const ok = !o.ok || o.ok(hi);
    const b = A(parent, div((o.small ? "facebtn small" : "frame facebtn") + (o.sel === hi ? " sel" : "") + (ok ? "" : " off"), ""), x + aw + i * step, y, bw, bh);
    faceAt(b, BT.HEROES[hi].img, (bw - fs * 28 / 30) / 2, o.small ? 1 : 2, fs);
    if (ok) b.onclick = () => o.pick(hi);
  });
  if (!many) return;
  [["◀", -1, x], ["▶", 1, x + w - aw + 2]].forEach(([t, dv, bx]) => {
    const on = o.pg.n + dv >= 0 && o.pg.n + dv < pages;
    const b = A(parent, div("frame btn chip pgbtn" + (on ? "" : " off"), t), bx, y, aw - 2, bh); b.style.fontSize = d(9);
    if (on) b.onclick = () => { o.pg.n += dv; redraw(); };
  });
}
const roster = () => [...GS.fighters(), ...GS.bench()]; // 戦う5人が先、控えがあと
const pgWho = { n: 0 }, pgPick = { n: 0 }, pgBench = { n: 0 }, pgBag = { n: 0 };
// 仲間：上の顔を押すと人が替わる。下は「能力・技」と「装備」を切り替える
function member(L, redraw) {
  const list = roster();
  if (!list.includes(who)) { who = list[0]; pgWho.n = 0; }
  faceStrip(L, 12, 80, 280, list, { sel: who, pg: pgWho, pick: hi => { who = hi; slotSel = null; redraw(); } }, redraw);
  const h = BT.HEROES[who], m = GS.G.party[who];
  T(L, 12, 128, 170, 20, `${h.nm}<span class="rare r${h.rare}">${h.rare}</span>`, 13, "name");
  T(L, 12, 148, 170, 14, `${BT.WTYPE[h.wt].nm}${m.heart ? "・" + BT.HEARTS[m.heart].nm : ""}`, 8.5, "dim2");
  T(L, 180, 128, 30, 20, "HP", 9.5, "k");
  T(L, 204, 128, 85, 20, `${m.hp}`, 13, "num2");
  T(L, 180, 148, 30, 14, "LP", 9.5, "k");
  A(L, div("lpips", Array.from({ length: h.lp }, (_, i) => `<i class="${i < m.lp ? "on" : ""}"></i>`).join("")), 204, 151, 85, 8);
  [["stat", "能力・技"], ["gear", "装備"]].forEach(([k, nm], i) => {
    const b = A(L, div("frame btn chip" + (view === k ? " sel" : ""), nm), 12 + i * 140, 168, 137, 24); b.style.fontSize = d(10.5);
    b.onclick = () => { view = k; slotSel = null; redraw(); };
  });
  view === "stat" ? statView(L, h, m) : gearView(L, redraw, h, m);
}
function statView(L, h, m) {
  const S = BT.heroStats(BT.resolveHero(who, m)), heart = m.heart && BT.HEARTS[m.heart];
  // 能力値：装備と心を入れた値。心を付けていると、その倍率を右に（上がれば青、下がれば赤。本家と同じ色）。↑は上がりやすい（緑＝本人・紫＝心）
  BT.STATS.forEach((k, i) => {
    const x = 12 + (i % 2) * 140, y = 200 + Math.floor(i / 2) * 25, box = A(L, div("frame sbox", ""), x, y, 137, 23);
    T(box, 6, 0, 46, 21, BT.ST_NM[k], 9.5, "label");
    T(box, 50, 0, 32, 21, `${S.st[k]}`, 12, "num2 right");
    const pc = heart ? heart.mul[k] : 100; // 心の倍率をかっこで。100%（変わらない）は横棒
    T(box, 78, 0, 38, 21, pc === 100 ? "(—)" : `(${pc}%)`, 8, "num2 right " + (pc > 100 ? "pcup" : pc < 100 ? "pcdn" : "zero"));
    const up = (h.up.includes(k) ? '<span class="upm">↑</span>' : "") + (heart && heart.up.includes(k) ? '<span class="upm2">↑</span>' : "");
    T(box, 119, 0, 17, 21, up, 9, "");
  });
  // 技（通常攻撃＋本人の3つ＋心の技）
  T(L, 14, 304, 100, 14, "技", 9, "label");
  const box = A(L, div("frame rbox", ""), 12, 320, 277, 6 + (4 + (heart ? 1 : 0)) * 22);
  ["attack", ...h.sk].forEach((k, i) => skillRow(box, k, 3 + i * 22, "", h.wt));
  if (heart) skillRow(box, heart.sk, 3 + 4 * 22, "心");
  // パッシブ（本人の3つ＋装備に付いているもの）
  const py = 320 + 6 + (4 + (heart ? 1 : 0)) * 22 + 8;
  T(L, 14, py, 100, 14, "パッシブ", 9, "label");
  const ps = [...h.ps.map(k => [k, ""]), ...Object.values(m.gear).filter(it => it && BT.GEAR[it.id].ps).map(it => [BT.GEAR[it.id].ps, "装備"])];
  const pb = A(L, div("frame rbox", ""), 12, py + 16, 277, 6 + ps.length * 21);
  ps.forEach(([k, tag], i) => {
    const P = BT.PASSIVES[k];
    T(pb, 8, 3 + i * 21, 70, 20, P.nm + (tag ? `<i class="tagw">${tag}</i>` : ""), 9.5, "name");
    T(pb, 84, 3 + i * 21, 188, 20, P.ds, 8.5, "dim2");
  });
}
function statDiff(hi, m, slot, item) { // 付け替えたら能力値がどう変わるか
  const a = BT.heroStats(BT.resolveHero(hi, m)).st;
  const m2 = { ...m, gear: { ...m.gear } };
  if (slot === "heart") m2.heart = item; else m2.gear[slot] = item;
  const b = BT.heroStats(BT.resolveHero(hi, m2)).st, out = [];
  for (const k of BT.STATS) if (b[k] !== a[k]) out.push(`<span class="${b[k] > a[k] ? "pcup" : "pcdn"}">${STAT_SHORT[k]}${b[k] > a[k] ? "+" : ""}${b[k] - a[k]}</span>`);
  return out.join(" ") || '<span class="dim">変わらない</span>';
}
function gearView(L, redraw, h, m) {
  const slots = ["weapon", "armor", "sub", "acc", "heart"], ey = 200;
  slots.forEach((sl, i) => {
    const y = ey + i * 36, row = A(L, div("frame slotrow" + (slotSel === sl ? " on" : ""), ""), 12, y, 277, 34);
    T(row, 8, 0, 46, 32, SLOT_NM[sl], 9.5, "label");
    if (sl === "heart") {
      if (m.heart) { A(row, heartIcon(m.heart, 24), 54, 4, 24, 24); T(row, 84, 2, 188, 16, `<span class="heartnm">${BT.HEARTS[m.heart].nm}</span>`, 10.5, "name"); T(row, 84, 17, 188, 14, heartSummary(m.heart), 8.5, "dim2"); }
      else T(row, 58, 0, 210, 32, "なし", 10, "dim");
    } else {
      const it = m.gear[sl];
      if (it) { const g = BT.GEAR[it.id]; A(row, DM.iconImg(g.icon, 24 * DM.K), 54, 4, undefined, undefined); T(row, 84, 2, 188, 16, `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(it)}</span>`, 10.5, "name"); T(row, 84, 17, 188, 14, itemSummary(it), 8.5, "dim2"); }
      else T(row, 58, 0, 210, 32, "なし", 10, "dim");
    }
    row.onclick = () => { slotSel = slotSel === sl ? null : sl; redraw(); };
  });
  if (!slotSel) return;
  const G = GS.G, sl = slotSel, list = [];
  if (sl === "heart") {
    if (m.heart) list.push({ nm: "外す", diff: statDiff(who, m, "heart", null), act: () => { G.hearts[m.heart] = (G.hearts[m.heart] || 0) + 1; m.heart = null; } });
    Object.keys(G.hearts).filter(k => G.hearts[k] > 0 && k !== m.heart).forEach(k => list.push({ heart: k, html: `<span class="heartnm">${BT.HEARTS[k].nm}</span><small> ×${G.hearts[k]}</small>`, diff: statDiff(who, m, "heart", k), act: () => { if (m.heart) G.hearts[m.heart] = (G.hearts[m.heart] || 0) + 1; G.hearts[k]--; m.heart = k; } }));
  } else {
    if (sl !== "weapon" && m.gear[sl]) list.push({ nm: "外す", diff: statDiff(who, m, sl, null), act: () => { G.bag.push(m.gear[sl]); m.gear[sl] = null; } });
    G.bag.filter(it => { const g = BT.GEAR[it.id]; return g.slot === sl && (sl !== "weapon" || g.wt === h.wt); }).forEach(it => {
      const g = BT.GEAR[it.id];
      list.push({ icon: g.icon, html: `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(it)}</span>`, diff: statDiff(who, m, sl, it), act: () => { G.bag.splice(G.bag.indexOf(it), 1); if (m.gear[sl]) G.bag.push(m.gear[sl]); m.gear[sl] = it; } });
    });
  }
  const y0 = ey + 5 * 36 + 4, n = Math.min(6, list.length);
  const box = A(L, div("frame cands", ""), 12, y0, 277, Math.max(34, n * 36 + 4));
  if (!list.length) { T(box, 10, 4, 257, 26, sl === "weapon" ? `使える${BT.WTYPE[h.wt].nm}を持っていない` : "替えられる物を持っていない", 9.5, "dim"); return; }
  list.slice(0, 6).forEach((c, i) => {
    const r = A(box, div("cand2", ""), 2, 2 + i * 36, 273, 34);
    if (c.icon) A(r, DM.iconImg(c.icon, 22 * DM.K), 8, 5, undefined, undefined);
    if (c.heart) A(r, heartIcon(c.heart, 22), 8, 5, 22, 22);
    T(r, 38, 1, 230, 17, c.nm ? `<b>${c.nm}</b>` : c.html, 10.5, "name");
    T(r, 38, 17, 230, 15, c.diff, 8.5, "");
    r.onclick = () => { c.act(); slotSel = null; GS.save(); redraw(); };
  });
}
// 持ち物：装備していない武器・防具と、魔物の心。押すと、だれに付けるかを選ぶ
function bag(L, redraw) {
  const G = GS.G, rows = [];
  const order = { weapon: 0, armor: 1, sub: 2, acc: 3 };
  G.bag.slice().sort((a, b) => order[BT.GEAR[a.id].slot] - order[BT.GEAR[b.id].slot] || BT.GEAR[a.id].nm.localeCompare(BT.GEAR[b.id].nm)).forEach(it => rows.push({ it }));
  Object.keys(G.hearts).filter(k => G.hearts[k] > 0).forEach(k => rows.push({ h: k }));
  if (!rows.length) { T(L, 12, 90, 277, 24, "持ち物はない", 10.5, "dim center"); return; }
  const per = 12, rh = 36, pages = Math.ceil(rows.length / per);
  pgBag.n = Math.max(0, Math.min(pages - 1, pgBag.n));
  if (pages > 1 && !pickItem) { // 13個より多いときは、下でめくる
    [["◀", -1, 12], ["▶", 1, 249]].forEach(([t, dv, bx]) => {
      const on = pgBag.n + dv >= 0 && pgBag.n + dv < pages;
      const b = A(L, div("frame btn chip pgbtn" + (on ? "" : " off"), t), bx, 596, 40, 24); b.style.fontSize = d(10);
      if (on) b.onclick = () => { pgBag.n += dv; redraw(); };
    });
    T(L, 52, 596, 197, 24, `${pgBag.n + 1} / ${pages}`, 9.5, "dim center");
  }
  rows.slice(pgBag.n * per, pgBag.n * per + per).forEach((r, i) => {
    const row = A(L, div("frame prow" + (pickItem === r.it || (r.h && pickItem === r.h) ? " on" : ""), ""), 12, 84 + i * (rh + 2), 277, rh);
    if (r.it) {
      const g = BT.GEAR[r.it.id];
      A(row, DM.iconImg(g.icon, 24 * DM.K), 6, 5, undefined, undefined);
      T(row, 36, 2, 160, 17, `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(r.it)}</span>`, 10.5, "name");
      T(row, 36, 18, 236, 15, itemSummary(r.it), 8.5, "dim2");
      T(row, 196, 2, 76, 17, g.slot === "weapon" ? BT.WTYPE[g.wt].nm : SLOT_NM[g.slot], 8.5, "dim right");
    } else {
      A(row, heartIcon(r.h, 26), 5, 4, 26, 26);
      T(row, 36, 2, 160, 17, `<span class="heartnm">${BT.HEARTS[r.h].nm}</span><small> ×${G.hearts[r.h]}</small>`, 10.5, "name");
      T(row, 36, 18, 236, 15, heartSummary(r.h), 8.5, "dim2");
      T(row, 196, 2, 76, 17, "心", 8.5, "dim right");
    }
    row.onclick = () => { pickItem = pickItem === (r.it || r.h) ? null : (r.it || r.h); redraw(); };
  });
  if (!pickItem) return;
  // だれに付けるか：付けられる人の顔だけ並べる
  const isHeart = typeof pickItem === "string", g = !isHeart && BT.GEAR[pickItem.id];
  const sheet = A(L, div("frame pickbar", ""), 12, 562, 277, 56);
  T(sheet, 8, 2, 120, 14, "だれに付ける？", 8.5, "label");
  faceStrip(sheet, 8, 16, 261, roster(), { small: 1, pg: pgPick, ok: hi => isHeart || g.slot !== "weapon" || g.wt === BT.HEROES[hi].wt,
    pick: hi => {
      const m = G.party[hi], h = BT.HEROES[hi];
      if (isHeart) { if (m.heart) G.hearts[m.heart] = (G.hearts[m.heart] || 0) + 1; G.hearts[pickItem]--; m.heart = pickItem; }
      else { G.bag.splice(G.bag.indexOf(pickItem), 1); if (m.gear[g.slot]) G.bag.push(m.gear[g.slot]); m.gear[g.slot] = pickItem; }
      DM.toast(`${h.nm}に付けた`, 540); pickItem = null; GS.save(); redraw();
    } }, redraw);
}
function formation(L, redraw) {
  const G = GS.G;
  Object.entries(BT.FORMATIONS).forEach(([k, f], i) => {
    const b = A(L, div("frame btn chip" + (G.lo.form === k ? " sel" : ""), f.nm), 12 + i * 93, 84, 89, 26); b.style.fontSize = d(10.5);
    b.onclick = () => { G.lo.form = k; fsel = -1; GS.save(); redraw(); };
  });
  const F = BT.FORMATIONS[G.lo.form];
  T(L, 12, 114, 277, 16, F.ds, 8.5, "dim2");
  A(L, div("frame", ""), 12, 134, 277, 236);
  T(L, 20, 138, 60, 14, "← 敵", 8, "dim");
  // マスを押してから別のマスを押すと場所が入れ替わる。マスと控えの顔を（どちらが先でも）押すと、その人が入れ替わる
  const put = (slot, hi) => { G.lo.pos[slot] = hi; fsel = -1; bsel = null; GS.save(); if (window.FD) FD.syncParty(); redraw(); };
  F.slots.forEach((sl, slot) => {
    const hi = G.lo.pos[slot], h = hi != null ? BT.HEROES[hi] : null;
    const cx = 44 + sl.c * 80, cy = 152 + sl.r * 42;
    const t = A(L, div("frame tile" + (fsel === slot ? " sel" : "") + (h ? "" : " empty"), ""), cx, cy, 80, 38);
    if (h) { const fc = DM.spriteBox(IM[h.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 26 * DM.K); fc.style.position = "absolute"; fc.style.left = d(2); fc.style.top = d(3); t.appendChild(fc); }
    const tx = div("tn", `${h ? h.nm : "空き"}<br><i>${sl.h >= 2 ? "狙われやすい" : sl.h < 1 ? "狙われにくい" : ""}</i>`); tx.style.fontSize = d(7.5); tx.style.left = d(24); tx.style.top = d(6); t.appendChild(tx);
    t.onclick = () => {
      if (bsel != null) { put(slot, bsel); return; }
      if (fsel < 0) { fsel = slot; redraw(); return; }
      const a = G.lo.pos[fsel]; G.lo.pos[fsel] = G.lo.pos[slot]; put(slot, a);
    };
  });
  const bench = GS.bench();
  if (bench.length) {
    T(L, 14, 376, 100, 14, "控え", 9, "label");
    if (!bench.includes(bsel)) bsel = null;
    faceStrip(L, 12, 392, 280, bench, { sel: bsel, pg: pgBench, pick: hi => { if (fsel >= 0) { put(fsel, hi); return; } bsel = bsel === hi ? null : hi; redraw(); } }, redraw);
    if (bsel != null) { const h = BT.HEROES[bsel]; T(L, 12, 438, 277, 16, `${h.nm}<span class="rare r${h.rare}">${h.rare}</span>　${BT.WTYPE[h.wt].nm}`, 10, "name"); }
  }
  const r = A(L, div("frame btn chip dimchip", "はじめから"), 189, 596, 100, 24); r.style.fontSize = d(9.5);
  r.onclick = async () => { const k = await choose("", "記録を消して、はじめから遊びますか？", ["はじめから", "やめる"]); if (k === 0) { GS.reset(); try { localStorage.removeItem("rpgCards1"); } catch (e) {} location.reload(); } else redraw(); };
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
        const g = BT.GEAR[id], have = GS.G.bag.filter(it => it.id === id).length + GS.G.party.filter(m => m && Object.values(m.gear).some(it => it && it.id === id)).length;
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
