// はじまり：絵を読み込んで、記録の場所から歩き出す
(function () {
"use strict";
addEventListener("resize", DM.fit);
// ホーム画面のアプリとして、つながらない所でも遊べるようにする
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
DM.fit();
const imgs = new Set([...BT.HEROES.map(h => h.img), ...Object.values(BT.FOES).map(f => f.img), ...Object.values(BT.GEAR).map(g => g.icon), ...Object.values(BT.MATS).map(g => g.icon), ...Object.values(BT.TOOLS).map(g => g.icon)]);
for (const id of Object.keys(MAPS)) MAPS[id]().npcs.forEach(n => imgs.add(n.img || n.mon));
["person_058h", "person_002w"].forEach(k => imgs.add(k)); // 物語の途中で替わる絵（帽子のムク、粉をかぶったリゼット）
// 絵がそろったらタイトルを出す。「はじめから」なら記録（札の記録も）を消して始める
const hasSave = GS.valid();
GS.load();
Promise.all([...imgs].map(DM.load)).then(() => TT.show(hasSave)).then(k => {
  if (k === "new") { GS.reset(); try { localStorage.removeItem("rpgCards1"); } catch (e) {} }
  ST.apply();
  FD.start();
});
})();
