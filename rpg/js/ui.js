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
function say(name, pages, opt) {
  return new Promise(res => {
    const L = newLayer("talk");
    const box = A(L, div("frame dlg", ""), 8, 520, 285, 102);
    if (name) { const nt = A(L, div("nmtag", name), 14, 503, undefined, 20); nt.style.fontSize = d(10); nt.style.lineHeight = d(18); nt.style.padding = `0 ${d(8)}`; }
    const tx = A(box, div("dtext" + (opt && opt.narr ? " narr" : ""), ""), 12, 8, 259, 84); tx.style.fontSize = d(11.5); tx.style.lineHeight = d(19);
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
    const rh = 28;
    let top = 494 - opts.length * rh - 8;
    if (text) { // 問いかけの文があるときは下に会話の窓、無いとき（主人公の返事を選ぶとき）は選ぶ行だけを下に
      const box = A(L, div("frame dlg", ""), 8, 520, 285, 102);
      if (name) { const nt = A(L, div("nmtag", name), 14, 503, undefined, 20); nt.style.fontSize = d(10); nt.style.lineHeight = d(18); nt.style.padding = `0 ${d(8)}`; }
      const tx = A(box, div("dtext", text), 12, 8, 259, 84); tx.style.fontSize = d(11.5); tx.style.lineHeight = d(19);
    } else top = 618 - opts.length * rh - 8;
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
  SND.se(r.win ? "win" : "lose");
  return new Promise(res => {
    const L = newLayer("veil solid result");
    if (!r.win) {
      T(L, 0, 250, W, 40, r.time ? "引き分け" : "全滅……", 26, "gold center");
      T(L, 0, 300, W, 20, r.time ? "戦いを切り上げた" : "最後に休んだ所へ戻る", 11, "center dim");
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
    const cnt = {}; (r.mats || []).forEach(k => { cnt[k] = (cnt[k] || 0) + 1; }); // 同じ素材はまとめて×いくつ
    const drops = [...r.hearts.map(h => ({ h })), ...(r.tools || []).map(t => ({ t })), ...r.items.map(it => ({ it })), ...Object.keys(cnt).map(m => ({ m, n: cnt[m] }))];
    if (!drops.length) { T(L, 14, y, 260, 24, "なし", 10, "dim"); y += 26; }
    drops.forEach((dp, i) => {
      const x = 12 + (i % 2) * 140, yy = y + Math.floor(i / 2) * 32, t = A(L, div("frame dtile", ""), x, yy, 137, 29);
      if (dp.h) { A(t, heartIcon(dp.h, 23), 3, 2, 23, 23); T(t, 30, 0, 104, 27, `<span class="heartnm">${BT.HEARTS[dp.h].nm}</span>`, 9.5, ""); }
      else if (dp.t) { A(t, DM.iconImg(BT.TOOLS[dp.t].icon, 22 * DM.K), 4, 3, undefined, undefined); T(t, 30, 0, 104, 27, `<span class="toolnm">${BT.TOOLS[dp.t].nm}</span>`, 9.5, "name"); }
      else if (dp.m) { const mt = BT.MATS[dp.m]; A(t, DM.iconImg(mt.icon, 22 * DM.K), 4, 3, undefined, undefined); T(t, 30, 0, 104, 27, `${mt.nm}${dp.n > 1 ? `<small> ×${dp.n}</small>` : ""}`, 9.5, "name"); }
      else { const g = BT.GEAR[dp.it.id]; A(t, DM.iconImg(g.icon, 22 * DM.K), 4, 3, undefined, undefined); T(t, 30, 0, 104, 27, `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(dp.it)}</span>`, 9.5, "name"); }
    });
    y += Math.ceil(drops.length / 2) * 32 + 8;
    // 戦いの記録：まず与えたダメージの多い順に、ゲージつきで並べる。上の札を押すと「被ダメージ」「回復」の順位に切り替わる
    const cols = [["dealt", "与ダメージ", "#e8a23a"], ["taken", "被ダメージ", "#d8573a"], ["healed", "回復", "#5fc26a"]], n = r.growth.length;
    const tabEls = cols.map(([k, nm], i) => { const b = A(L, div("frame btn chip", nm), 12 + i * 93, y, 91, 22); b.style.fontSize = d(9.5); b.onclick = e => { e.stopPropagation(); rank(k); }; return b; });
    const tb = A(L, div("frame rbox", ""), 12, y + 24, 277, 6 + n * 22); tb.onclick = e => e.stopPropagation();
    const rank = key => {
      tb.innerHTML = ""; cols.forEach(([k], i) => tabEls[i].classList.toggle("sel", k === key));
      const col = cols.find(c => c[0] === key)[2], list = r.growth.slice().sort((p, q) => (q[key] || 0) - (p[key] || 0)), max = Math.max(1, ...list.map(g => g[key] || 0));
      list.forEach((g, j) => {
        const yy = 3 + j * 22, v = g[key] || 0;
        T(tb, 4, yy, 12, 20, `${j + 1}`, 8.5, "num2 center " + (j === 0 && v ? "top" : "zero"));
        const fc = DM.spriteBox(IM[g.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 18 * DM.K); A(tb, fc, 18, yy + 1, undefined, undefined);
        T(tb, 40, yy, 54, 20, g.nm, 9.5, "name");
        const bar = A(tb, div("rbar", `<i style="background:${col}"></i>`), 96, yy + 7, 118, 6);
        requestAnimationFrame(() => { bar.firstChild.style.width = (v / max * 100) + "%"; });
        T(tb, 216, yy, 54, 20, v.toLocaleString(), 10.5, "num2 right" + (j === 0 && v ? " top" : v ? "" : " zero"));
      });
    };
    rank("dealt");
    y += 24 + 6 + n * 22 + 2;
    y += 6;
    T(L, 14, y, 200, 14, "成長", 9, "label"); y += 16;
    // 成長：1段目に上がった能力、2段目に技ランクが上がった技。入りきらないときは、技ランクを「↑いくつ」にまとめて1段に
    const nRank = r.growth.filter(g => (g.ranks || []).length).length;
    const two = y + r.growth.length * 31 + nRank * 17 <= 596;
    r.growth.forEach(g => {
      const ranks = g.ranks || [], tall = two && ranks.length > 0;
      const row = A(L, div("frame grow", ""), 12, y, 277, tall ? 45 : 28);
      const fc = DM.spriteBox(IM[g.img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], 22 * DM.K); A(row, fc, 3, 2, undefined, undefined);
      T(row, 30, 0, 52, 26, g.nm, 10, "name");
      let chips = g.ups.map(u => `<span class="upchip">${u.k === "hp" ? "HP" : BT.ST_NM[u.k]}<b>+${u.v}</b></span>`).join("");
      if (!two && ranks.length) chips += `<span class="upchip rk">Rank<b>↑${ranks.length}</b></span>`;
      const c = A(row, div("chips", chips || (ranks.length ? "" : '<span class="dim">変わりなし</span>')), 84, 0, 190, 26); c.style.fontSize = d(8.5);
      if (tall) { const c2 = A(row, div("chips", ranks.map(u => `<span class="upchip rk">${u.nm}<b><small>Rank </small>${u.v}</b></span>`).join("")), 30, 25, 245, 18); c2.style.fontSize = d(7.6); }
      y += tall ? 48 : 31;
    });
    const nx = T(L, 0, Math.min(612, y + 4), W, 14, "▼", 9, "center gold blink");
    L.onclick = () => { clearLayer(); res(); };
  });
}

// ---------- メニュー（仲間・陣形・札帳） ----------
// ---------- メニュー：上に「仲間・持ち物・陣形・札帳」を並べ、押すとその画面に切り替わる ----------
let tab = "party", who = 0, view = "stat", slotSel = null, fsel = -1, bsel = null, pickItem = null, skillSel = null, bagTab = "gear";
function menu() {
  return new Promise(res => {
    const close = () => { clearLayer(); GS.save(); res(); };
    const draw = () => {
      const L = newLayer("veil solid menu");
      const tabs = [["party", "仲間"], ["form", "編成"], ["bag", "持ち物"], ["goal", "目的"], ["book", "札帳"]].filter(([k]) => k !== "book" || GS.G.flags.cards); // 札帳は、札を手に入れてから
      const tw = Math.floor(246 / tabs.length);
      tabs.forEach(([k, nm], i) => {
        const b = A(L, div("frame btn chip" + (tab === k ? " sel" : ""), nm), 12 + i * tw, 12, tw - 3, 28); b.style.fontSize = d(tabs.length > 4 ? 10 : 11);
        b.onclick = () => { if (k === "book") { cards("book").then(draw); return; } tab = k; slotSel = null; fsel = -1; bsel = null; pickItem = null; skillSel = null; draw(); };
      });
      const x = A(L, div("frame btn chip", "×"), 261, 12, 28, 28); x.style.fontSize = d(14); x.onclick = close;
      // 見出しを上の空きへ上げた分、持ち物・目的・編成も同じだけ上げる（中の並びはそのまま）
      const C = tab === "party" ? L : A(L, div("shift", ""), 0, -34, W, H);
      if (tab === "party") member(L, draw);
      else if (tab === "bag") bag(C, draw);
      else if (tab === "goal") goal(C);
      else formation(C, draw);
    };
    draw();
  });
}
const faceAt = (parent, img, x, y, size) => { const fc = DM.spriteBox(IM[img], DM.FACE[0], DM.FACE[1], DM.FACE[2], DM.FACE[3], size * DM.K); A(parent, fc, x, y, undefined, undefined); return fc; };
function gearSummary(id) {
  const g = BT.GEAR[id], out = [];
  if (g.slot === "weapon") { out.push(`威力${g.pow}`); for (const a in (g.mp || {})) out.push(`術威力(${a})${g.mp[a]}`); }
  for (const k in (g.st || {})) out.push(`${STAT_SHORT[k]}${g.st[k] > 0 ? "+" : ""}${g.st[k]}`);
  if (g.res) { const phys = Math.round(((g.res.斬 || 0) + (g.res.打 || 0) + (g.res.突 || 0)) / 3), mag = Math.round(((g.res.熱 || 0) + (g.res.冷 || 0) + (g.res.雷 || 0)) / 3); out.push(`物理${phys >= 0 ? "+" : ""}${phys}`); if (mag) out.push(`術${mag > 0 ? "+" : ""}${mag}`); }
  if (g.sres) for (const k in g.sres) out.push(`${k}よけ`);
  return out.join(" ");
}
function itemSummary(it) {
  let s = gearSummary(it.id);
  if (it.el) s += ` <span class="bonus">術威力(${it.el})${Math.round(BT.GEAR[it.id].pow * 0.8)}</span>`; // 属性つきの武器
  for (const k in (it.b || {})) s += ` <span class="bonus">${STAT_SHORT[k]}+${it.b[k]}</span>`;
  return s;
}
function heartSummary(k) {
  const h = BT.HEARTS[k];
  const ups = h.up.map(s => STAT_SHORT[s]).join("・");
  return `技：${BT.SKILLS[h.sk].nm}　${ups}が伸びやすい`;
}
// 技の1行（2段）。上の段＝属性・名前・Rank（技ランク。名前の長さに関係なく決まった列にそろえる）・BP。下の段＝威力・範囲・近遠・効果（入りきらない効果は「…」。全部は押して出る説明に）
//  本家（ロマサガRS）の技一覧と同じく、一覧は要点だけ。細かい効果は押して見る
const SK_H = 32;
function skillRow(parent, k, y, tag, m, onTap) {
  const s = BT.SKILLS[k], at = s.at || [], row = A(parent, div("skrow two" + (skillSel === k ? " sel" : ""), ""), 0, y, 277, SK_H - 1);
  const rank = s.kind === "攻撃" ? (s.rank && s.rank !== "N" ? s.rank : "—") : null;
  const bp = BT.cost(m, s), sr = (m && m.sr && m.sr[k]) || 1, fxs = BT.fxText(s);
  const L1 = d(10), L2 = d(23);
  row.innerHTML = `<span style="left:${d(6)};top:${d(5)};width:${d(24)};display:flex;flex-direction:column;gap:${d(1)};transform:none">${at.map(a => DM.icon(a, 10)).join("")}</span>` +
    `<span class="sn" style="left:${d(32)};top:${L1};font-size:${d(10.5)}">${s.nm}${tag ? `<i class="tagh" style="font-size:${d(7.5)}">${tag}</i>` : ""}</span>` +
    `<span class="srk2" style="left:${d(196)};top:${L1};font-size:${d(8)}">Rank<b style="font-size:${d(10.5)};margin-left:${d(3)}">${sr}</b></span>` + `<span class="bp${bp < s.bp ? " cut" : ""}" style="right:${d(8)};top:${L1};font-size:${d(10)}">${bp ? "BP" + bp : ""}</span>` +
    (rank ? `<span class="rk" style="left:${d(32)};top:${L2};font-size:${d(8)}">威力<b style="font-size:${d(9.5)}">${rank}</b></span>` : `<span class="rk kind" style="left:${d(32)};top:${L2};font-size:${d(8.5)}">${s.kind}</span>`) +
    `<span class="rg" style="left:${d(74)};top:${L2};font-size:${d(8.5)}">${BT.RANGE_NM[s.tg]}</span>` +
    (s.dist ? `<span class="ds ${s.dist === "近" ? "near" : "far"}" style="left:${d(112)};top:${L2};font-size:${d(7.5)};width:${d(12)};height:${d(12)};line-height:${d(12)}">${s.dist}</span>` : "") +
    (fxs ? `<span class="fx2" style="left:${d(130)};top:${L2};width:${d(139)};font-size:${d(8)}">${fxs}</span>` : "");
  if (onTap) row.onclick = () => onTap(k);
  return row;
}
// 技のくわしい説明（本家と同じ並び：種類／近・遠／直接・間接／範囲（属性））と、技ランク・覚醒
function skillDetail(L, k, hi, m, isHeart, redraw) {
  const s = BT.SKILLS[k], G = GS.G;
  const sr = (m.sr && m.sr[k]) || 1, aw = (m.aw && m.aw[k]) || 0, max = isHeart ? 0 : BT.awMax(s);
  const fx = [];
  if (s.kind === "攻撃") fx.push(s.tg === "rand" ? `ランダムな敵に攻撃する（${s.hits}回）` : `攻撃する${s.hits > 1 ? `（${s.hits}回）` : ""}`);
  if (s.stun) fx.push("攻撃が当たると、確率でスタンさせる");
  if (s.poison) fx.push("攻撃が当たると、確率で毒にする");
  if (s.heal) fx.push("味方全体のHPを回復する。倒れた味方も起こす");
  if (s.cover) fx.push(`${s.cover}ターンの間、狙われやすくなり、受けるダメージが半分になる`);
  // 効果の行の数で高さが決まる（強い技で効果が増えても、はみ出さない）。下の端は画面の下にそろえる
  const fy = 43, ry = fy + fx.length * 14 + 6, hgt = ry + (max > 0 ? 62 : 26) + 4;
  const box = A(L, div("frame sdetail", ""), 12, Math.min(470, 644 - hgt), 277, hgt);
  T(box, 10, 6, 180, 18, s.nm, 12.5, "name");
  const x = A(box, div("btn chip xbtn", "×"), 249, 4, 22, 22); x.style.fontSize = d(12); x.onclick = () => { skillSel = null; redraw(); };
  const line = [s.kind, s.dist, s.dir, { one: "敵単体", col: "敵縦一列", row: "敵横一列", all: "敵全体", rand: "敵ランダム", self: "自分", allies: "味方全体" }[s.tg]].filter(Boolean).join("／") + (s.at ? `（${s.at.join("＋")}）` : "");
  T(box, 10, 26, 257, 15, line, 9, "dim2");
  fx.forEach((t, i) => T(box, 10, fy + i * 14, 257, 14, t, 8.5, ""));
  // 技ランク（使って勝つと上がる）
  T(box, 10, ry, 60, 16, "Rank", 8.5, "label");
  T(box, 62, ry, 30, 16, `${sr}`, 11, "num2");
  T(box, 92, ry, 175, 16, s.kind === "攻撃" || s.heal ? `${s.heal ? "回復量" : "威力"} ＋${((sr - 1) * 0.5).toFixed(1)}%` : "", 8.5, "dim2");
  // 覚醒（秘伝書で、使うBPを減らす）
  if (max > 0) {
    T(box, 10, ry + 22, 60, 16, "覚醒", 8.5, "label");
    T(box, 62, ry + 22, 60, 16, `<span class="awk">${"◆".repeat(aw)}</span><span class="awk off">${"◇".repeat(max - aw)}</span>`, 10, "");
    T(box, 110, ry + 22, 60, 16, `BP${BT.cost(m, s)}`, 10, "num2 gold");
    if (aw < max) {
      const bk = GS.awakenBook(hi, k), have = G.tools[bk] || 0, tl = BT.TOOLS[bk];
      const b = A(box, div("frame btn chip" + (have ? " lit" : " off"), ""), 150, ry + 18, 121, 40);
      A(b, DM.iconImg(tl.icon, 18 * DM.K), 5, 9, undefined, undefined);
      T(b, 27, 3, 90, 16, have ? `覚醒する　BP${BT.cost(m, s) - 1}へ` : "秘伝書が足りない", 8.5, have ? "gold" : "dim");
      T(b, 27, 20, 90, 14, `${tl.nm}<small>　持っている ${have}</small>`, 7.5, "dim2");
      if (have) b.onclick = () => { if (GS.awaken(hi, k)) { DM.toast(`${s.nm}が覚醒した`, 440); redraw(); } };
    } else T(box, 150, ry + 22, 121, 16, "覚醒しきった", 8.5, "dim right");
  } else if (isHeart) T(box, 10, ry + 22, 257, 16, "心の技は、覚醒できない", 8.5, "dim");
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
    if (o.lp) { const m = GS.G.party[hi], mx = BT.HEROES[hi].lp; const bar = A(b, div("lpbar", `<i style="width:${m.lp / mx * 100}%"></i>`), 3, bh - 7, bw - 10, 3); bar.title = "LP"; } // 残りのLP
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
const pgWho = { n: 0 }, pgPick = { n: 0 }, pgBench = { n: 0 }, pgBag = { n: 0 }, pgCand = { n: 0 };
// 仲間：上の顔を押すと人が替わる。下は「能力・技」と「装備」を切り替える

// 能力8つ：4列×2段。名前のすぐ下に置き、「技」「装備」のどちらでも同じ場所に出る（王道RPGの装備画面と同じく、付け替えながら見比べられる）
function statBlock(L, y, h, m) {
  const S = BT.heroStats(BT.resolveHero(who, m)).st, heart = m.heart && BT.HEARTS[m.heart];
  BT.STATS.forEach((k, i) => {
    const cw = 68, x = 12 + (i % 4) * 69.7, yy = y + Math.floor(i / 4) * 30, box = A(L, div("frame sbox", ""), x, yy, cw, 28);
    T(box, 5, 1, 40, 12, STAT_SHORT[k], 8, "label");
    const up = (h.up.includes(k) ? '<span class="upm">↑</span>' : "") + (heart && heart.up.includes(k) ? '<span class="upm2">↑</span>' : "");
    T(box, 44, 1, 21, 12, up, 8, "right");
    T(box, 5, 12, 28, 15, `${S[k]}`, 12, "num2");
    const pc = heart ? heart.mul[k] : 100; // 心の倍率（上がれば青、下がれば赤）
    if (pc !== 100) T(box, 32, 13, 33, 14, `${pc}%`, 7.5, "num2 right " + (pc > 100 ? "pcup" : "pcdn"));
  });
}
function member(L, redraw) {
  const list = roster();
  if (!list.includes(who)) { who = list[0]; pgWho.n = 0; }
  faceStrip(L, 12, 46, 280, list, { sel: who, pg: pgWho, lp: 1, pick: hi => { who = hi; slotSel = null; skillSel = null; redraw(); } }, redraw);
  const h = BT.HEROES[who], m = GS.G.party[who];
  T(L, 12, 94, 170, 20, `${h.nm}<span class="rare r${h.rare}">${h.rare}</span>`, 13, "name");
  T(L, 12, 114, 170, 14, `${BT.WTYPE[h.wt].nm}${m.heart ? "・" + BT.HEARTS[m.heart].nm : ""}`, 8.5, "dim2");
  T(L, 180, 94, 30, 20, "HP", 9.5, "k");
  T(L, 204, 94, 85, 20, `${m.hp}`, 13, "num2");
  T(L, 180, 114, 30, 14, "LP", 9.5, "k");
  A(L, div("lpips", Array.from({ length: h.lp }, (_, i) => `<i class="${i < m.lp ? "on" : ""}"></i>`).join("")), 204, 117, 85, 8);
  statBlock(L, 134, h, m);
  [["stat", "技"], ["gear", "装備"]].forEach(([k, nm], i) => {
    const b = A(L, div("frame btn chip" + (view === k ? " sel" : ""), nm), 12 + i * 140, 198, 137, 24); b.style.fontSize = d(10.5);
    b.onclick = () => { view = k; slotSel = null; skillSel = null; redraw(); };
  });
  view === "stat" ? statView(L, h, m, redraw) : gearView(L, redraw, h, m);
}
function statView(L, h, m, redraw) {
  const heart = m.heart && BT.HEARTS[m.heart], Y = 230;
  T(L, 14, Y, 100, 14, "技", 9, "label");
  const nsk = h.sk.length + (heart ? 1 : 0), box = A(L, div("frame rbox", ""), 12, Y + 16, 277, 4 + nsk * SK_H);
  const tapSk = k => { skillSel = skillSel === k ? null : k; redraw(); };
  h.sk.forEach((k, i) => skillRow(box, k, 2 + i * SK_H, "", m, tapSk));
  if (heart) skillRow(box, heart.sk, 2 + h.sk.length * SK_H, "心", m, tapSk);
  if (skillSel && ![...h.sk, heart && heart.sk].includes(skillSel)) skillSel = null;
  const py = Y + 16 + 4 + nsk * SK_H + 8;
  T(L, 14, py, 100, 14, "パッシブ", 9, "label");
  const ps = [...h.ps.map(k => [k, ""]), ...Object.values(m.gear).filter(it => it && BT.GEAR[it.id].ps).map(it => [BT.GEAR[it.id].ps, "装備"])];
  const pb = A(L, div("frame rbox", ""), 12, py + 16, 277, 6 + ps.length * 21);
  ps.forEach(([k, tag], i) => {
    const P = BT.PASSIVES[k];
    T(pb, 8, 3 + i * 21, 70, 20, P.nm + (tag ? `<i class="tagw">${tag}</i>` : ""), 9.5, "name");
    T(pb, 84, 3 + i * 21, 188, 20, P.ds, 8.5, "dim2");
  });
  if (skillSel) skillDetail(L, skillSel, who, m, !!heart && heart.sk === skillSel, redraw);
}
// 付け替えた後の値（変わるものだけ）。上の能力の欄の今の値と見比べる
function afterVals(hi, m, slot, item) {
  const a = BT.heroStats(BT.resolveHero(hi, m)).st, m2 = { ...m, gear: { ...m.gear } };
  if (slot === "heart") m2.heart = item; else m2.gear[slot] = item;
  const b = BT.heroStats(BT.resolveHero(hi, m2)).st, out = [];
  for (const k of BT.STATS) if (b[k] !== a[k]) out.push(`<span class="dim2">${STAT_SHORT[k]}</span><span class="${b[k] > a[k] ? "pcup" : "pcdn"}">${b[k]}${b[k] > a[k] ? "↑" : "↓"}</span>`);
  return out.join(" ") || '<span class="dim">変わらない</span>';
}
function gearView(L, redraw, h, m) {
  const slots = ["weapon", "armor", "sub", "acc", "heart"], ey = 230;
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
    row.onclick = () => { slotSel = slotSel === sl ? null : sl; pgCand.n = 0; redraw(); };
  });
  if (!slotSel) return;
  const G = GS.G, sl = slotSel, list = [], fmt = afterVals;
  if (sl === "heart") {
    if (m.heart) list.push({ key: "x", v: null, nm: "外す", diff: fmt(who, m, "heart", null), act: () => { G.hearts[m.heart] = (G.hearts[m.heart] || 0) + 1; m.heart = null; } });
    Object.keys(G.hearts).filter(k => G.hearts[k] > 0 && k !== m.heart).forEach(k => list.push({ key: k, v: k, heart: k, html: `<span class="heartnm">${BT.HEARTS[k].nm}</span><small> ×${G.hearts[k]}</small>`, diff: fmt(who, m, "heart", k), act: () => { if (m.heart) G.hearts[m.heart] = (G.hearts[m.heart] || 0) + 1; G.hearts[k]--; m.heart = k; } }));
  } else {
    if (sl !== "weapon" && m.gear[sl]) list.push({ key: "x", v: null, nm: "外す", diff: fmt(who, m, sl, null), act: () => { G.bag.push(m.gear[sl]); m.gear[sl] = null; } });
    // 同じ物（名前も付いた力も同じ）は1行にまとめて「×数」
    const sig = it => JSON.stringify([it.id, it.el || "", it.b || {}]), seen = {};
    G.bag.filter(it => { const g = BT.GEAR[it.id]; return g.slot === sl && (sl !== "weapon" || g.wt === h.wt); }).forEach(it => {
      const s = sig(it); if (seen[s]) { seen[s].n++; seen[s].html = seen[s].base + `<small class="dim2"> ×${seen[s].n}</small>`; return; }
      const g = BT.GEAR[it.id], base = `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(it)}</span>`;
      const c = { key: s, v: it, n: 1, base, icon: g.icon, html: base, main: mainVal(it, m.gear[sl]), ps: g.ps, diff: fmt(who, m, sl, it), act: () => { G.bag.splice(G.bag.indexOf(it), 1); if (m.gear[sl]) G.bag.push(m.gear[sl]); m.gear[sl] = it; } };
      seen[s] = c; list.push(c);
    });
  }
  const per = list.length > 6 ? 5 : 6, pages = Math.max(1, Math.ceil(list.length / per));
  pgCand.n = Math.max(0, Math.min(pages - 1, pgCand.n));
  const y0 = ey + 5 * 36 + 4, shown = list.slice(pgCand.n * per, pgCand.n * per + per);
  const box = A(L, div("frame cands", ""), 12, y0, 277, Math.max(34, shown.length * 36 + 4));
  if (!list.length) { T(box, 10, 4, 257, 26, sl === "weapon" ? `使える${BT.WTYPE[h.wt].nm}を持っていない` : "替えられる物を持っていない", 9.5, "dim"); return; }
  shown.forEach((c, i) => {
    const r = A(box, div("cand2", ""), 2, 2 + i * 36, 273, 34);
    if (c.icon) A(r, DM.iconImg(c.icon, 22 * DM.K), 8, 5, undefined, undefined);
    if (c.heart) A(r, heartIcon(c.heart, 22), 8, 5, 22, 22);
    T(r, 38, 1, c.ps ? 178 : 230, 17, c.nm ? `<b>${c.nm}</b>` : c.html, 10.5, "name");
    if (c.ps) T(r, 214, 1, 56, 17, `<span class="pstag">${BT.PASSIVES[c.ps].nm}</span>`, 9, "right");
    if (c.main) { T(r, 38, 17, 64, 15, c.main, 8.5, ""); T(r, 104, 17, 166, 15, c.diff, 8.5, ""); }
    else T(r, 38, 17, 230, 15, c.diff, 8.5, "");
    r.onclick = () => { c.act(); slotSel = null; pgCand.n = 0; GS.save(); redraw(); };
  });
  if (pages > 1) {
    const py = y0 + shown.length * 36 + 6;
    [["◀", -1, 12], ["▶", 1, 225]].forEach(([t, dv, bx]) => {
      const on = pgCand.n + dv >= 0 && pgCand.n + dv < pages;
      const b = A(L, div("frame btn chip pgbtn" + (on ? "" : " off"), t), bx, py, 64, 24); b.style.fontSize = d(9);
      if (on) b.onclick = () => { pgCand.n += dv; redraw(); };
    });
    T(L, 80, py, 141, 24, `${pgCand.n + 1} / ${pages}`, 9.5, "dim2 center");
  }
}
// 武器の威力・防具の守り（物理）と、今付けている物との差
function mainVal(it, cur) {
  const g = BT.GEAR[it.id], c = cur && BT.GEAR[cur.id];
  const phys = x => x && x.res ? Math.round(((x.res.斬 || 0) + (x.res.打 || 0) + (x.res.突 || 0)) / 3) : 0;
  const [nm, v, v0] = g.slot === "weapon" ? ["威力", g.pow, c ? c.pow : 0] : g.res ? ["物理", phys(g), phys(c)] : [null];
  if (!nm) return null;
  const df = v - v0, dfs = df ? `<span class="${df > 0 ? "pcup" : "pcdn"}">${df > 0 ? "+" : ""}${df}</span>` : `<span class="dim">±0</span>`;
  return `<span class="dim2">${nm}</span><span class="mv">${v}</span>${dfs}`;
}
// 持ち物：装備していない武器・防具と、魔物の心。押すと、だれに付けるかを選ぶ
const RARE_COL = { 白: "#e5e7eb", 緑: "#7fd88a", 青: "#6ab0ff", 紫: "#c08aff", 金: "#ffd24a", 虹: "#ff9ad8" };
function bag(L, redraw) {
  const G = GS.G, rows = [];
  const order = { weapon: 0, armor: 1, sub: 2, acc: 3 };
  const n = { gear: G.bag.length, heart: Object.values(G.hearts).reduce((a, b) => a + b, 0), mat: Object.values(G.mats).reduce((a, b) => a + b, 0), tool: Object.values(G.tools).reduce((a, b) => a + b, 0) };
  [["gear", "装備"], ["heart", "心"], ["mat", "素材"], ["tool", "道具"]].forEach(([k, nm], i) => {
    const b = A(L, div("frame btn chip" + (bagTab === k ? " sel" : ""), `${nm}<small class="cnt">${n[k]}</small>`), 12 + i * 70, 80, 67, 24); b.style.fontSize = d(10);
    b.onclick = () => { bagTab = k; pickItem = null; pgBag.n = 0; redraw(); };
  });
  if (bagTab === "gear") { // 同じ物（名前も付いた力も同じ）は1行にまとめて「×数」。装備の候補と同じ
    const seen = {}, sig = it => JSON.stringify([it.id, it.el || "", it.b || {}]);
    G.bag.slice().sort((a, b) => order[BT.GEAR[a.id].slot] - order[BT.GEAR[b.id].slot] || BT.GEAR[a.id].nm.localeCompare(BT.GEAR[b.id].nm)).forEach(it => { const s = sig(it); if (seen[s]) { seen[s].n++; return; } seen[s] = { it, n: 1 }; rows.push(seen[s]); });
  }
  else if (bagTab === "heart") Object.keys(G.hearts).filter(k => G.hearts[k] > 0).forEach(k => rows.push({ h: k }));
  else if (bagTab === "mat") Object.keys(BT.MATS).filter(k => G.mats[k] > 0).forEach(k => rows.push({ m: k }));
  else Object.keys(BT.TOOLS).filter(k => G.tools[k] > 0).forEach(k => rows.push({ t: k }));
  if (!rows.length) { T(L, 12, 120, 277, 24, { gear: "付けていない装備はない", heart: "宿していない心はない", mat: "素材はない", tool: "道具はない" }[bagTab], 10.5, "dim center"); return; }
  const per = 11, rh = 36, pages = Math.ceil(rows.length / per);
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
    const row = A(L, div("frame prow" + ((r.it && pickItem === r.it) || (r.h && pickItem === r.h) ? " on" : ""), ""), 12, 110 + i * (rh + 2), 277, rh);
    if (r.m || r.t) { // 素材・道具：見るだけ（素材は鍛冶で、秘伝書は技の覚醒で使う）
      const def = r.m ? BT.MATS[r.m] : BT.TOOLS[r.t], have = r.m ? G.mats[r.m] : G.tools[r.t];
      A(row, DM.iconImg(def.icon, 24 * DM.K), 6, 5, undefined, undefined);
      T(row, 36, 2, 180, 17, `<span style="color:${RARE_COL[def.rare] || "#f3e4c8"}">${def.nm}</span>`, 10.5, "name");
      T(row, 36, 18, 200, 15, r.m ? def.fam : def.ds, 8.5, "dim2");
      T(row, 216, 2, 56, 32, `×${have}`, 12, "num2 right");
      return;
    }
    if (r.it) {
      const g = BT.GEAR[r.it.id];
      A(row, DM.iconImg(g.icon, 24 * DM.K), 6, 5, undefined, undefined);
      T(row, 36, 2, 160, 17, `<span style="color:${DM.RANKCOL[g.rank]}">${GS.itemName(r.it)}</span>${r.n > 1 ? `<small class="dim2"> ×${r.n}</small>` : ""}`, 10.5, "name");
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
// 目的：いま向かう所。続きから遊ぶときに迷わないように
const GOALS = { 1: "桟橋で待つホップ夫婦を、中州の畑まで渡す", 2: "川下の簗場で、ヤン爺の様子を見る", 3: "桟橋へ戻って、ひと休みする", 4: "森の小道を、奥へ進む", 5: "森の小道を、奥へ進む", 6: "森の小道を、奥へ進む",
  7: "森の奥の、婆の庵へ", 8: "庵から、沼への道を進む", 9: "ヌシの沼で、月夜草を採る", 10: "森の岸へ戻る", 11: "森の岸から、舟で村へ戻る", 12: "濡れた網を、渡し小屋へ運ぶ", 14: "西街道を東へ。宿場町ハルネをめざす", 15: "西街道を東へ。宿場町ハルネをめざす", 16: "西街道を東へ。宿場町ハルネをめざす", 17: "宿「かわうそ亭」へ", 18: "問屋場で、話を聞く", 19: "東の道から、落ちた大橋を見に行く", 20: "宿「かわうそ亭」に戻って休む", 21: "大橋の北の丘の、古い見張り塔へ", 22: "塔を登る", 23: "塔を登る", 24: "塔のてっぺんへ", 25: "塔を下りて、大橋のたもとへ", 26: "宿「かわうそ亭」へ戻る", 27: "かわうそ亭の寝床で休む", 28: "大橋を渡って、東の平原へ", 29: "北の王都をめざす", 30: "南の風車の里ミルナで、粉の荷車を探す", 31: "王都の酒場に入って、話を聞く", 32: "酒場を出る", 33: "北の古い礼拝堂へ", 34: "地下墓所の奥へ", 35: "地下墓所の奥へ", 36: "地下墓所の奥へ", 37: "建国王の間へ", 38: "奥の階段を上る", 39: "記録の間で、通行の印を探す", 40: "記録の間の隠し戸の先へ", 41: "部屋を出る", 42: "部屋を出る", 43: "王都の役場へ", 44: "裏通りの奥へ（この先は、次の更新で）" };
function goal(L) {
  const G = GS.G, s = G.flags.s || 0;
  T(L, 14, 84, 200, 14, "いまの目的", 9, "label");
  const box = A(L, div("frame rbox", ""), 12, 100, 277, 64);
  const t = T(box, 12, 8, 253, 48, GOALS[s] || "", 12, "name"); t.style.lineHeight = d(20); t.style.whiteSpace = "normal";
  // 音の入／切（押すと切り替わる）
  const sb = A(L, div("frame btn chip" + (SND.on ? " sel" : ""), SND.on ? "音　入" : "音　切"), 12, 256, 137, 26); sb.style.fontSize = d(10.5);
  sb.onclick = () => { SND.toggle(); sb.textContent = SND.on ? "音　入" : "音　切"; sb.classList.toggle("sel", SND.on); };
  T(L, 14, 176, 200, 14, "これまで", 9, "label");
  const kinds = new Set([...Object.keys(G.hearts).filter(k => G.hearts[k] > 0), ...G.party.filter(Boolean).map(m => m.heart).filter(Boolean)]).size;
  [["仲間", `${G.roster.length}人`], ["勝った戦い", `${G.wins}回`], ["集めた心", `${kinds}種`], ["お金", `${G.gold.toLocaleString()} G`]].forEach(([k, v], i) => {
    const r = A(L, div("frame sbox", ""), 12 + (i % 2) * 140, 192 + Math.floor(i / 2) * 27, 137, 24);
    T(r, 8, 0, 60, 22, k, 9.5, "label"); T(r, 60, 0, 70, 22, v, 11.5, "num2 right");
  });
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
        if (id.startsWith("t:")) { // 道具（食べ物など）
          const k = id.slice(2), t = BT.TOOLS[k], have = GS.G.tools[k] || 0;
          const r = A(L, div("frame shoprow" + (GS.G.gold < t.price ? " poor" : ""), ""), 12, 100 + i * 40, 277, 36);
          A(r, DM.iconImg(t.icon, 22 * DM.K), 6, 6, undefined, undefined);
          T(r, 34, 2, 150, 17, `${t.nm}<small class="dim"> 道具</small>`, 10.5, "name");
          T(r, 34, 18, 170, 14, t.ds, 8.5, "dim2");
          T(r, 196, 2, 76, 17, `${t.price}<small> G</small>`, 11, "num2 right");
          T(r, 196, 18, 76, 14, have ? `持っている ${have}` : "", 8, "dim right");
          r.onclick = () => {
            if (GS.G.gold < t.price) { DM.toast("お金が足りない", 560); return; }
            GS.G.gold -= t.price; GS.G.tools[k] = have + 1; GS.save(); draw(); DM.toast(`${t.nm}を買った`, 560);
          };
          return;
        }
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
function cards(go, k, practice) {
  return new Promise(res => {
    GS.save();
    const f = document.createElement("iframe");
    f.className = "cardframe"; const sp = DM.safePx || {}; f.src = `cards.html?st=${Math.round(sp.t || 0)}&sb=${Math.round(sp.b || 0)}&go=${go}${k !== undefined ? "&k=" + k : ""}${practice ? "&practice=1" : ""}&v=${Date.now() % 1e6}`;
    document.body.appendChild(f);
    const on = e => { if (e.data && e.data.t === "close") { removeEventListener("message", on); f.remove(); GS.syncGoldFromDisk(); res(e.data); } };
    addEventListener("message", on);
  });
}

root.UI = { say, choose, result, menu, shop, cards, clear: clearLayer };
})(window);
