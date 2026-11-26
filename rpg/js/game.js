// 遊んでいる記録（仲間の育ち・持ち物・お金・場所・出来事）。端末に保存する
(function (root) {
"use strict";
const KEY = "rpgPlay1";
let uid = 1;
function item(id, b, tag) { return { u: uid++, id, b: b || null, tag: tag || "" }; }
function fresh() {
  return {
    v: 1, gold: 300, map: "town", x: 9, y: 21, dir: 3,
    party: BT.HEROES.map(h => ({ st: { ...h.st }, hp: h.hp, lp: h.lp, gear: Object.fromEntries(Object.entries(h.gear).map(([k, id]) => [k, item(id)])), heart: null })),
    lo: BT.defLo(), bag: [], hearts: {}, flags: {}, chests: {}, wins: 0,
  };
}
const S = {
  G: null,
  load() {
    try { const t = localStorage.getItem(KEY); S.G = t ? JSON.parse(t) : fresh(); } catch (e) { S.G = fresh(); }
    if (!S.G || S.G.v !== 1) S.G = fresh();
    // 古い記録の直し：おまけの名前が欠けていたもの（精神のおまけ）を付け直す
    const fix = it => { if (it && it.b && (!it.tag || it.tag.includes("undefined"))) { const k = Object.keys(it.b)[0]; it.tag = "(" + BT.BONUS[k] + (it.b[k] >= 4 ? "+" : "") + ")"; } };
    S.G.bag.forEach(fix); S.G.party.forEach(m => Object.values(m.gear).forEach(fix));
    uid = 1 + Math.max(0, ...S.G.bag.map(i => i.u), ...S.G.party.flatMap(m => Object.values(m.gear).filter(Boolean).map(i => i.u)));
    return S.G;
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify(S.G)); } catch (e) {} },
  reset() { S.G = fresh(); S.save(); },
  item,
  // お金は札の画面（別のページ）でも使うので、開く前後に読み書きする
  syncGoldFromDisk() { try { const t = JSON.parse(localStorage.getItem(KEY)); if (t && typeof t.gold === "number") S.G.gold = t.gold; } catch (e) {} },
  itemName(it) { const g = BT.GEAR[it.id]; return g.nm + (it.tag || ""); },
  maxLp(hi) { return BT.HEROES[hi].lp; },
  restAll() { S.G.party.forEach((m, hi) => { m.lp = BT.HEROES[hi].lp; }); },
};
root.GS = S;
})(window);
