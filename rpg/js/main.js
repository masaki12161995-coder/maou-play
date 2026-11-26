// はじまり：絵を読み込んで、記録の場所から歩き出す
(function () {
"use strict";
addEventListener("resize", DM.fit);
DM.fit();
const imgs = new Set([...BT.HEROES.map(h => h.img), ...Object.values(BT.FOES).map(f => f.img), ...Object.values(BT.GEAR).map(g => g.icon)]);
for (const id of Object.keys(MAPS)) MAPS[id]().npcs.forEach(n => imgs.add(n.img));
// 絵がそろったらタイトルを出す。「はじめから」なら記録（札の記録も）を消して始める
const hasSave = (() => { try { return !!localStorage.getItem("rpgPlay1"); } catch (e) { return false; } })();
GS.load();
Promise.all([...imgs].map(DM.load)).then(() => TT.show(hasSave)).then(k => {
  if (k === "new") { GS.reset(); try { localStorage.removeItem("rpgCards1"); } catch (e) {} }
  FD.start();
});
})();
