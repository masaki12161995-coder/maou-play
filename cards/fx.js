"use strict";
// ===== 札の勝負の演出（ゲームの中の札勝負と、友だち対戦で共通） =====
// 決まり（rules.js）が残した「起きたこと」と、その時の盤の写しを、ひと場面ずつ見せる。
//   置く → 置いたときのくせ → 向かい合う2枚が浮いて、比べる数字が光る → 負けた札がひっくり返る → 連鎖 …
// FX.run(ev, render, done)
//   render(board) … その盤で画面を描き直し、盤の入れ物（9つの .cell を持つ）を返す
(function(){
const QN=k=>(typeof QK!=="undefined"&&QK[k])?QK[k].nm:k;
let css=false;
function style(){ if(css) return; css=true; const s=document.createElement("style"); s.textContent=`
.cell{overflow:visible}
.card.lift{transform:translateY(-7px) scale(1.07);box-shadow:0 12px 18px #000c;z-index:4;transition:transform .16s ease-out,box-shadow .16s}
.card .n.hit{color:#ffe08a!important;transform:scale(1.45);transition:transform .16s;text-shadow:0 0 6px #ffb020,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000!important;z-index:3}
.card .n.lose{color:#aab0c0!important}
.card .n.miss{color:#7b8296!important;transition:color .15s}
.fxar{display:inline-block;font-size:.82em;font-weight:900;margin:0 .04em;vertical-align:.04em;animation:fxar .5s ease-in-out infinite alternate;text-shadow:0 0 0 #000,1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,0 0 6px #000}
.fxar.up{color:#6dff7c}.fxar.x{position:relative;width:.8em;height:.8em;margin:0 .06em;vertical-align:-.02em;animation:none}.fxar.x::before,.fxar.x::after{content:"";position:absolute;left:-.02em;right:-.02em;top:50%;height:.22em;margin-top:-.11em;background:#eef0f6;border:1px solid #000;border-radius:2px;transform:rotate(45deg)}.fxar.x::after{transform:rotate(-45deg)}.fxar.dn{color:#ff5b5b;animation-name:fxdn}.fxar.eq{color:#ffe08a;animation:none}
.card .n.nup{animation:nup .7s ease-out}.card .n.ndn{animation:ndn .7s ease-out}
@keyframes nup{0%{color:#8dff9a;transform:scale(1.45)}25%{color:#8dff9a;transform:scale(1)}60%{color:#8dff9a}100%{color:#fff}}
@keyframes ndn{0%{color:#ff6b6b;transform:scale(1.45)}25%{color:#ff6b6b;transform:scale(1)}60%{color:#ff6b6b}100%{color:#fff}}
.fxar.fxb,.fxar.pva{position:absolute;top:50%;margin:0;transform:translateY(-50%)}.fxar.fxb.up{animation:fxbu .7s ease-out forwards}.fxar.fxb.dn{animation:fxbd .7s ease-out forwards}
.fxar.k0,.fxar.k2{left:calc(50% + .36em)}.fxar.k1{right:100%}.fxar.k3{left:100%}
.fxar.pva{animation:fxpva .5s ease-in-out infinite alternate}
@keyframes fxbu{0%{opacity:0;transform:translateY(-10%)}20%,65%{opacity:1;transform:translateY(-70%)}100%{opacity:0;transform:translateY(-90%)}}
@keyframes fxbd{0%{opacity:0;transform:translateY(-90%)}20%,65%{opacity:1;transform:translateY(-30%)}100%{opacity:0;transform:translateY(-10%)}}
@keyframes fxpva{from{transform:translateY(-40%)}to{transform:translateY(-70%)}}
@keyframes fxar{from{transform:translateY(1px)}to{transform:translateY(-3px)}}@keyframes fxdn{from{transform:translateY(-1px)}to{transform:translateY(3px)}}
.card.fout{animation:fxout .17s ease-in forwards}
@keyframes fxout{from{transform:translateY(-7px) scale(1.07) rotateY(0)}to{transform:translateY(-7px) scale(1.07) rotateY(90deg)}}
.card.fin{animation:fxin .26s ease-out}
@keyframes fxin{from{transform:translateY(-7px) scale(1.07) rotateY(90deg)}to{transform:none}}
.card.fxpop{animation:fxpop .3s ease-out}
@keyframes fxpop{from{transform:scale(1.28)}to{transform:none}}
.card.fxshake{animation:fxshake .34s ease-in-out}
@keyframes fxshake{0%,100%{transform:translateY(-7px) scale(1.07)}25%{transform:translateY(-7px) scale(1.07) translateX(-4px)}75%{transform:translateY(-7px) scale(1.07) translateX(4px)}}
.card.fxglow{box-shadow:0 0 0 2px #ffe08a,0 0 16px 4px #ffcf5a99}
.fxlab{position:absolute;left:50%;top:30%;transform:translate(-50%,-50%);z-index:8;white-space:nowrap;font-size:13px;font-weight:800;color:#2a1a08;background:linear-gradient(#ffe9a8,#f0c050);border:1px solid #7a5418;border-radius:10px;padding:1px 8px;box-shadow:0 2px 6px #0009;animation:fxlab .28s ease-out;pointer-events:none}
@keyframes fxlab{from{transform:translate(-50%,-50%) scale(.3);opacity:0}70%{transform:translate(-50%,-50%) scale(1.15);opacity:1}to{transform:translate(-50%,-50%) scale(1)}}
.fxcmp{position:absolute;z-index:9;pointer-events:none;font-family:"Avenir Next",system-ui,sans-serif;font-weight:900;font-size:20px;color:#fff;text-shadow:0 0 6px #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000;transform:translate(-50%,-50%);animation:fxlab .25s ease-out;white-space:nowrap}
.fxcmp b{color:#ffe08a}
.fxban{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10;pointer-events:none;font-size:30px;font-weight:900;letter-spacing:.12em;color:#ffe9a8;text-shadow:0 0 12px #ff9a20,0 2px 0 #000,-2px 0 0 #000,2px 0 0 #000,0 -2px 0 #000;animation:fxban .7s ease-out forwards;white-space:nowrap}
@keyframes fxban{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}25%{transform:translate(-50%,-50%) scale(1.15);opacity:1}75%{opacity:1}100%{transform:translate(-50%,-50%) scale(1);opacity:0}}
`; document.head.appendChild(s); }
const SE=n=>{ try{ if(window.FX_SND) window.FX_SND(n); }catch(_){} };   // 音（友だち対戦のページだけ鳴る。無ければ何もしない）
const QS=(then)=>{ SE("chain"); if(then==="flip") setTimeout(()=>SE(then),110); };   // くせが発動したら、どのくせも同じ音（数字の上がる・下がる音は鳴らさない）   // くせが発動したら、どのくせも同じ音。数字が動くときは、すぐあとに上がる・下がる音
const card=(bd,i)=>{ const c=bd&&bd.querySelectorAll(".cell")[i]; return c&&c.querySelector(".card"); };
function lab(bd,i,txt,cls){ const c=bd.querySelectorAll(".cell")[i]; if(!c||!txt) return; const e=document.createElement("div"); e.className="fxlab"+(cls?" "+cls:""); e.textContent=txt; c.appendChild(e); }
// 数字が上がった／下がった：その数字を一瞬 緑／赤 に光らせて白に戻し、横に↑↓を出して消す（くせの名前には数字を付けない）
function bumpN(n,k,dir){ if(!n) return; n.classList.remove("nup","ndn"); void n.offsetWidth; n.classList.add(dir>0?"nup":"ndn");
  n.querySelectorAll(".fxb").forEach(x=>x.remove()); const a=document.createElement("i"); a.className="fxar fxb k"+k+" "+(dir>0?"up":"dn"); a.textContent=dir>0?"↑":"↓"; n.appendChild(a); }
function bump(bd,i,dir,ks){ const c=card(bd,i); if(!c) return; const ns=c.querySelectorAll(".n"); (ks||[0,1,2,3]).forEach(k=>bumpN(ns[k],k,dir)); }
function ban(bd,txt){ if(!txt) return; const e=document.createElement("div"); e.className="fxban"; e.textContent=txt; bd.appendChild(e); }
// 比べる数字を光らせ、横に矢印（勝つ数字は↑、負ける数字は↓）。右の辺の数字だけ、矢印を左に置く（札からはみ出さないよう）
function hit(bd,i,k,cls,ar){ const c=card(bd,i); if(!c||k==null||k<0) return; const n=c.querySelectorAll(".n")[k]; if(!n) return; n.classList.add(cls||"hit");
  if(!ar||n.querySelector(".fxar")) return; const a=document.createElement("i"); a.className="fxar "+ar; a.textContent=ar==="up"?"↑":ar==="dn"?"↓":ar==="x"?"":"＝"; if(k===1) n.prepend(a); else n.appendChild(a); }
// 2枚のあいだに「7＞5」
function cmp(bd,a,b,html){ const ca=bd.querySelectorAll(".cell")[a], cb=bd.querySelectorAll(".cell")[b]; if(!ca||!cb) return;
  const r=bd.getBoundingClientRect(), ra=ca.getBoundingClientRect(), rb=cb.getBoundingClientRect();
  const e=document.createElement("div"); e.className="fxcmp"; e.innerHTML=html;
  let x=(ra.left+ra.width/2+rb.left+rb.width/2)/2-r.left, y=(ra.top+ra.height/2+rb.top+rb.height/2)/2-r.top;
  if(Math.abs(ra.top-rb.top)<4) y-=ra.height*0.3;          // 横どうし：数字は真ん中の高さにあるので、少し上に
  else if(Math.abs(ra.left-rb.left)<4) x+=ra.width*0.3;     // 縦どうし：数字は真ん中にあるので、少し右に
  e.style.left=x+"px"; e.style.top=y+"px"; bd.appendChild(e); }
// 守護：ひとつ前の場面とくらべて、守護で上がった（下がった）札の数字を光らせる。上がったときは、守護の札に名前を出す
// skip：自分で置いた札（重ねたときの予告で、もう見せている）
function wardDiff(bd,a,b,skip){ if(!a||!b||typeof wb!=="function") return; const A={b:a}, B={b:b}, named=new Set();
  b.forEach((c,i)=>{ if(!c||(i===skip&&!a[i])) return; const nw=wb(B,i,c.o), ow=a[i]&&a[i].cid===c.cid?wb(A,i,a[i].o):0; if(nw===ow) return;
    bump(bd,i,nw>ow?1:-1); if(nw>ow) adj(i).forEach(([t])=>{ const w=b[t]; if(w&&w.o===c.o&&has(w,"ward")&&!named.has(t)){ named.add(t); lab(bd,t,QN("ward")); } }); }); }
function bonusText(info){ // 置いたときに出たくせの名前だけ（上がった分は数字の↑で見せる）
  return (info||[]).map(([k])=>k==="turn"?"回転":QN(k)).join("　"); }

window.FX={ css:style, bumpN, run(ev,render,done,pre0){
  style();
  const beats=[];
  const pre=ev.filter(e=>e.lv===0&&e.t==="back");
  if(pre.length) beats.push({snap:pre[pre.length-1].snap,wait:700,go(bd){ QS(pre.some(e=>e.t==="back")?"flip":"up"); pre.forEach(e=>{ const c=card(bd,e.cell); if(c) c.classList.add(e.t==="back"?"fin":"fxpop"); lab(bd,e.cell,e.t==="back"?QN("revive"):QN("grow")); if(e.t==="grow") bump(bd,e.cell,1); }); }});
  const put=ev.find(e=>e.t==="put");
  // 自分で置いた札の、置く前から見えていた上がり方（怒りは手札で、角取り・群れなどは重ねたときに見せている）は、置いたときにもう一度は言わない。相手の札・博打・回転は言う
  const SEEN=["corner","center","edge","lone","pack","early","late","under","rage","kin"];
  if(put){ const mine=window.FX_ME!==undefined&&put.side===window.FX_ME, shown=(put.info||[]).filter(([k])=>!(mine&&SEEN.includes(k))), bt=bonusText(shown); beats.push({snap:put.snap,wait:bt?750:360,go(bd){ SE("put"); if(bt) setTimeout(()=>QS("up"),120); const c=card(bd,put.cell); if(c){ c.classList.add("fxpop"); if(bt) c.classList.add("fxglow"); } lab(bd,put.cell,bt); if(shown.some(([k])=>k!=="turn")) bump(bd,put.cell,1); }}); }
  // 成長：相手が札を置いたので、こちらの成長の札が育つ
  const gr=ev.filter(e=>e.t==="grow");
  if(gr.length) beats.push({snap:gr[gr.length-1].snap,wait:700,go(bd){ QS("up"); gr.forEach(e=>{ const c=card(bd,e.cell); if(c) c.classList.add("fxpop"); lab(bd,e.cell,QN("grow")); bump(bd,e.cell,1); }); }});
  // 置いたときのくせ（励まし・威圧・封印）
  const on=ev.filter(e=>e.lv===1&&(e.t==="buff"||e.t==="debuff"||e.t==="seal"));
  if(on.length) beats.push({snap:on[on.length-1].snap,wait:750,go(bd){ QS(on.some(e=>e.t==="seal")?null:on[0].t==="buff"?"up":"down"); const src=on[0].from; const c=card(bd,src); if(c) c.classList.add("fxglow"); lab(bd,src,QN(on[0].q));
    on.forEach(e=>{ const t=card(bd,e.cell); if(t) t.classList.add("fxpop"); if(e.t!=="seal") bump(bd,e.cell,e.t==="buff"?1:-1); }); }});
  // 勝負：段ごと（1＝置いた札から、2＝連鎖）。向かい合う2枚が浮く → 比べる数字が光る → 負けた札がひっくり返る
  for(const lv of [1,2,4]){   // 4＝仇討ち（取られた側の仕返し）
    const all=ev.filter(e=>e.lv===lv&&e.t!=="buff"&&e.t!=="debuff"&&e.t!=="seal");
    const duels=all.filter(e=>e.t==="duel"), miss=all.filter(e=>e.t==="miss"); if(!duels.length&&!miss.length) continue;
    const outs=all.filter(e=>e.t!=="duel"&&e.t!=="miss");
    const flips=outs.filter(e=>e.t==="flip").map(e=>e.cell), guards=outs.filter(e=>e.t==="guard");
    const head=lv===4?QN("avenge")+"！":lv===2?(all.every(e=>e.tag==="cheer"||(e.t!=="duel"&&e.t!=="miss"))?QN("cheer")+"！":"連鎖！"):duels.some(d=>d.how==="same")?QN("same")+"！":duels.some(d=>d.how==="plus")?QN("plus")+"！":"";
    const s0=(duels[0]||miss[0]).snap;
    // 号令・仇討ち：ほかのくせと同じく、くせを持つ札の上に名前を出す（盤のまん中には出さない）。そのあと、動く味方の札が浮いて勝負する
    // 連鎖・王威も同じ：置いた札（くせを持つ札）の上に名前を出す
    const pq=put&&put.snap&&put.snap[put.cell]?(put.snap[put.cell].q||[]):[];
    const tagQ=lv===4?"avenge":lv===2&&all.every(e=>e.tag==="cheer"||(e.t!=="duel"&&e.t!=="miss"))?"cheer":lv===2?(pq.includes("king")?"king":"chain"):null;
    if(tagQ&&(tagQ!=="chain"&&tagQ!=="king"||duels.length)){ const srcs=tagQ==="avenge"?[...new Set([...duels,...miss].map(d=>d.from))]:(put?[put.cell]:[]);
      beats.push({snap:s0,wait:650,go(bd){ SE("chain"); srcs.forEach(i=>{ const c=card(bd,i); if(c) c.classList.add("fxglow","fxpop"); lab(bd,i,QN(tagQ)); }); }}); }

    beats.push({snap:s0,wait:duels.length?760:560,go(bd){
      // 取れなかった組：こちらの数字を灰色にするだけ（札は浮かせない）
      if(!duels.length) SE("miss");
      miss.forEach(d=>{ hit(bd,d.from,d.mi,"miss"); });
      duels.forEach(d=>{ const a=card(bd,d.from), t=card(bd,d.cell); if(a) a.classList.add("lift"); if(t) t.classList.add("lift");
        if(d.how==="same"){ hit(bd,d.from,d.mi); hit(bd,d.cell,d.ti); }          // 同数：同じ数字どうしが光るだけ（見れば同じと分かる）
        else if(d.how==="plus"){ hit(bd,d.from,d.mi); hit(bd,d.cell,d.ti); lab(bd,d.cell,`${d.a}＋${d.d}＝${d.a+d.d}`); }
        else { hit(bd,d.from,d.mi,"hit","up"); hit(bd,d.cell,d.ti,"lose","dn"); } });
      if(lv===1&&duels.length){ const from=duels[0].from, qs=[...new Set(duels.map(d=>d.how).filter(h=>h==="diag"))].map(QN); if(qs.length){ lab(bd,from,qs.join("　")); if(!head) QS(); } }
    },out(bd){ flips.forEach(()=>SE("flip")); if(guards.length) QS(); flips.forEach(i=>{ const c=card(bd,i); if(c){ c.classList.remove("lift"); c.classList.add("fout"); } }); guards.forEach(g=>{ const c=card(bd,g.cell); if(c) c.classList.add("fxshake"); }); }});
    if(duels.length) beats.push({snap:outs.length?outs[outs.length-1].snap:duels[duels.length-1].snap,wait:620,go(bd){
      flips.forEach(i=>{ const c=card(bd,i); if(c) c.classList.add("fin"); });
      guards.forEach(g=>{ const c=card(bd,g.cell); if(c) c.classList.add("fxglow"); lab(bd,g.cell,g.wall?QN("wall"):QN("guard")); });
      if(outs.some(e=>e.t==="curse"||e.t==="spite")) QS(outs.some(e=>e.t==="curse")?"down":null);
      outs.forEach(e=>{ if(e.t==="curse"){ const c=card(bd,e.cell); if(c) c.classList.add("fxpop"); lab(bd,e.cell,QN("curse")); bump(bd,e.cell,-1); }
        if(e.t==="spite"){ const c=card(bd,e.cell); if(c) c.classList.add("fin"); lab(bd,e.cell,QN("spite")); } });
    }});
  }
  const dr=ev.find(e=>e.t==="buff"&&e.q==="drain");
  if(dr) beats.push({snap:dr.snap,wait:650,go(bd){ QS("up"); const c=card(bd,dr.cell); if(c){ c.classList.add("fxpop","fxglow"); } lab(bd,dr.cell,QN("drain")); bump(bd,dr.cell,1); }});
  let i=0, bd=null, last=pre0;
  const mine=put&&window.FX_ME!==undefined&&put.side===window.FX_ME?put.cell:-1;
  const next=()=>{ if(i>=beats.length){ done(); return; } const b=beats[i++];
    bd=render(b.snap); wardDiff(bd,last,b.snap,mine); last=b.snap; b.go(bd);
    setTimeout(()=>{ if(b.out){ b.out(bd); setTimeout(next,180); } else next(); },b.wait); };
  next();
}};
})();
