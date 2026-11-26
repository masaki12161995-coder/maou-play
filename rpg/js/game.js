// 遊んでいる記録（仲間の育ち・持ち物・お金・場所・出来事）。端末に保存する
(function (root) {
"use strict";
const KEY = "rpgPlay1";
let uid = 1;
function item(id, b, tag) { return { u: uid++, id, b: b || null, tag: tag || "" }; }
// 仲間1人ぶんの記録（加わったときに作る）
function newMem(hi) {
  const h = BT.HEROES[hi];
  return { st: { ...h.st }, hp: h.hp, lp: h.lp, gear: Object.fromEntries(Object.entries(h.gear).map(([k, id]) => [k, id ? item(id) : null])), heart: null };
}
// party＝仲間ごとの記録（BT.HEROESの並び。まだ加わっていない人は null）、roster＝いま一行に居る人、lo.pos＝戦う5人（空きは null）
function fresh() {
  const party = BT.HEROES.map((h, hi) => BT.START.includes(hi) ? newMem(hi) : null);
  return {
    v: 2, gold: 300, map: "town", x: 9, y: 21, dir: 3,
    party, roster: [...BT.START],
    lo: BT.defLo(), bag: [], hearts: {}, flags: {}, chests: {}, wins: 0,
  };
}
const S = {
  G: null,
  load() {
    try { const t = localStorage.getItem(KEY); S.G = t ? JSON.parse(t) : fresh(); } catch (e) { S.G = fresh(); }
    if (S.G && S.G.v === 1) { S.G.v = 2; S.G.roster = S.G.party.map((m, i) => i); } // 古い記録：仲間が5人で決まっていた頃のもの
    if (!S.G || S.G.v !== 2) S.G = fresh();
    while (S.G.party.length < BT.HEROES.length) S.G.party.push(null); // 仲間の顔ぶれが増えたぶん
    const mems = () => S.G.party.filter(Boolean);
    // 古い記録の直し：おまけの名前が欠けていたもの（精神のおまけ）を付け直す
    const fix = it => { if (it && it.b && (!it.tag || it.tag.includes("undefined"))) { const k = Object.keys(it.b)[0]; it.tag = "(" + BT.BONUS[k] + (it.b[k] >= 4 ? "+" : "") + ")"; } };
    S.G.bag.forEach(fix); mems().forEach(m => Object.values(m.gear).forEach(fix));
    uid = 1 + Math.max(0, ...S.G.bag.map(i => i.u), ...mems().flatMap(m => Object.values(m.gear).filter(Boolean).map(i => i.u)));
    return S.G;
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(S.G)); } catch (e) {} },
  reset() { S.G = fresh(); S.save(); },
  item,
  // お金は札の画面（別のページ）でも使うので、開く前後に読み書きする
  syncGoldFromDisk() { try { const t = JSON.parse(localStorage.getItem(KEY)); if (t && typeof t.gold === "number") S.G.gold = t.gold; } catch (e) {} },
  itemName(it) { const g = BT.GEAR[it.id]; return g.nm + (it.tag || ""); },
  maxLp(hi) { return BT.HEROES[hi].lp; },
  restAll() { S.G.party.forEach((m, hi) => { if (m) m.lp = BT.HEROES[hi].lp; }); },
  // ---------- 仲間の出入り ----------
  has(hi) { return S.G.roster.includes(hi); },
  fighters() { return S.G.lo.pos.filter(hi => hi != null); },
  bench() { return S.G.roster.filter(hi => !S.G.lo.pos.includes(hi)); },
  // 加わる：戦う5人に空きがあればそこへ、無ければ控えへ。前に居た人は育ちをそのまま持って戻る
  join(hi) {
    if (S.has(hi)) return false;
    if (!S.G.party[hi]) S.G.party[hi] = newMem(hi);
    S.G.roster.push(hi);
    const k = S.G.lo.pos.indexOf(null); if (k >= 0) S.G.lo.pos[k] = hi;
    S.save(); return true;
  },
  // 抜ける：付けていた装備と心は持ち物に戻す（育ちは残す）。戦う5人に居たなら、控えの先頭が代わりに入る
  leave(hi) {
    if (!S.has(hi)) return false;
    const m = S.G.party[hi];
    for (const k in m.gear) { if (m.gear[k]) S.G.bag.push(m.gear[k]); m.gear[k] = null; }
    if (m.heart) { S.G.hearts[m.heart] = (S.G.hearts[m.heart] || 0) + 1; m.heart = null; }
    S.G.roster = S.G.roster.filter(x => x !== hi);
    const k = S.G.lo.pos.indexOf(hi); if (k >= 0) S.G.lo.pos[k] = S.bench()[0] != null ? S.bench()[0] : null; // 空いた所には、控えの先頭が入る
    S.save(); return true;
  },
  // 戦う5人の入れ替え：slot の人（空きでもよい）と、控えの hi を取り替える。hi が null なら外すだけ（最後の1人は外せない）
  swapIn(slot, hi) {
    const pos = S.G.lo.pos;
    if (hi == null && S.fighters().length <= 1 && pos[slot] != null) return false;
    pos[slot] = hi; S.save(); return true;
  },
};
root.GS = S;
})(window);
