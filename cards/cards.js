"use strict";
// ===== 札の卓（試作） =====
const IMG={ // 素材バンクの絵の元の大きさ
  "001":[26,20],"002":[55,29],"003":[40,41],"009":[28,30],"011":[19,20],"026":[37,30],"028":[43,30],"037":[31,30],
  "006":[42,40],"012":[38,45],"013":[45,35],"025":[41,30],"007":[22,35],"008":[56,45],
  "036":[37,70],"035":[43,70],"053":[29,35],"022":[55,45],"031":[72,70],"056":[60,70],"059":[57,70],"057":[76,45],"058":[32,70]
};
const QK={
  corner:{nm:"角取り",ds:"角に置くと、数字がすべて＋1"},
  guard:{nm:"踏ん張り",ds:"一度だけ、裏返されない"},
  chain:{nm:"連鎖",ds:"裏返した札が、さらに隣を裏返す"}
};
// 数字は［上,右,下,左］。10は「A」と書く
const CARDS={
  c01:{nm:"しずく",im:"001",r:1,n:[2,3,4,2]},
  c02:{nm:"コウモリ",im:"002",r:1,n:[5,1,2,4]},
  c03:{nm:"角ウサギ",im:"003",r:1,n:[4,3,1,4]},
  c04:{nm:"歩きキノコ",im:"009",r:1,n:[1,4,4,3]},
  c05:{nm:"小ネズミ",im:"011",r:1,n:[3,3,3,2]},
  c06:{nm:"カモメ",im:"026",r:1,n:[5,3,1,3]},
  c07:{nm:"カエル",im:"028",r:1,n:[2,2,5,4]},
  c08:{nm:"カラス",im:"037",r:1,n:[4,4,2,2]},
  c09:{nm:"骨の犬",im:"006",r:2,n:[6,2,3,5]},
  c10:{nm:"ゴブリン",im:"012",r:2,n:[3,6,4,2]},
  c11:{nm:"岩トカゲ",im:"013",r:2,n:[2,4,6,4]},
  c12:{nm:"赤ガニ",im:"025",r:2,n:[4,2,4,6]},
  c13:{nm:"炎の霊",im:"007",r:2,n:[6,5,2,3]},
  c14:{nm:"灰オオカミ",im:"008",r:2,n:[5,5,3,4]},
  c15:{nm:"弓の骸骨",im:"036",r:3,n:[7,2,6,4],q:"corner"},
  c16:{nm:"亡者の剣士",im:"035",r:3,n:[6,6,3,5]},
  c17:{nm:"氷の精",im:"053",r:3,n:[3,7,7,3]},
  c18:{nm:"鉄の猟犬",im:"022",r:3,n:[5,4,5,5],q:"guard"},
  c19:{nm:"泥人形",im:"031",r:4,n:[6,5,7,5],q:"guard"},
  c20:{nm:"青白い騎士",im:"056",r:4,n:[8,4,3,8],q:"chain"},
  c21:{nm:"紫の魔術師",im:"059",r:4,n:[4,8,8,3],q:"corner"},
  c22:{nm:"黒紫の獣",im:"057",r:5,n:[9,6,4,8],q:"chain"},
  c23:{nm:"祈りの像",im:"058",r:5,n:[7,7,6,7],q:"guard"}
};
const OPPS=[
  {nm:"荷運びのモルト",who:"074",cap:9,depth:1,sig:"c15",pool:["c02","c03","c06","c08","c10","c12","c15"]},
  {nm:"札読みの老婆",who:"077",cap:12,depth:2,sig:"c19",pool:["c05","c07","c09","c11","c13","c16","c18","c19"]},
  {nm:"賭場の主ガロ",who:"030",cap:15,depth:3,sig:"c22",pool:["c08","c14","c16","c17","c20","c21","c22","c13"]}
];
const START=["c01","c02","c03","c04","c05","c06","c07","c08","c09","c11","c13"];
const KEY="cardproto1";

// ---------- 記録 ----------
let S;
function fresh(){ return {col:countOf(START), op:OPPS.map(o=>({pool:o.pool.slice(),won:0,lost:0,first:0,deck:null})), last:{}}; }
function countOf(a){ const c={}; a.forEach(x=>c[x]=(c[x]||0)+1); return c; }
function load(){ try{ const t=localStorage.getItem(KEY); S=t?JSON.parse(t):fresh(); }catch(e){ S=fresh(); } }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function owned(){ const a=[]; Object.keys(S.col).sort(byCard).forEach(k=>{ for(let i=0;i<S.col[k];i++) a.push(k); }); return a; }
function byCard(a,b){ return CARDS[b].r-CARDS[a].r || sum(CARDS[b].n)-sum(CARDS[a].n) || (a<b?-1:1); }
function sum(n){ return n[0]+n[1]+n[2]+n[3]; }
function rk(list){ return list.reduce((s,c)=>s+CARDS[c].r,0); }

// ---------- 札の絵 ----------
const N=v=>v>=10?"A":String(v);
function cardEl(cid,owner,w,h,o={}){
  const c=CARDS[cid], d=document.createElement("div");
  d.className="card "+owner; d.style.width=w+"px"; d.style.height=h+"px";
  const nums=o.n||c.n, fs=Math.max(11,Math.round(w*0.19));
  const [iw,ih]=IMG[c.im], bw=w*0.88, bh=h*0.66;
  const sc=Math.max(1,Math.floor(Math.min(bw/iw,bh/ih)));
  const top=ih*sc<=bh?(bh-ih*sc)/2:0;
  d.innerHTML=`<div class="face"></div>
   <div class="art"><img src="img/monster_${c.im}.png" style="width:${iw*sc}px;height:${ih*sc}px;top:${top}px"></div>
   <div class="stars">${"★".repeat(c.r)}</div><div class="shield"></div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;top:${Math.round(h*0.03)}px">${N(nums[0])}</div>
   <div class="n" style="font-size:${fs}px;right:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[1])}</div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;bottom:${c.q?Math.round(h*0.13):Math.round(h*0.04)}px">${N(nums[2])}</div>
   <div class="n" style="font-size:${fs}px;left:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[3])}</div>
   ${c.q?`<div class="qk" style="font-size:${Math.max(9,Math.round(w*0.14))}px">${QK[c.q].nm}</div>`:""}`;
  if(o.shield) d.classList.add("shielded");
  if(o.count>1){ const b=document.createElement("div"); b.className="mark t"; b.style.bottom="auto"; b.style.top="-2px"; b.style.left="auto"; b.style.right="-2px"; b.style.transform="none"; b.textContent="×"+o.count; d.appendChild(b); }
  return d;
}
function who(id,box){ // 人物の正面の立ち姿（2倍、上半身で切る）
  const d=document.createElement("div"); d.className="sprite";
  d.style.cssText=`width:${box[0]}px;height:${box[1]}px;background-image:url(img/person_${id}.png);background-size:288px 600px;background-position:${-(96)+(box[0]-96)/2}px ${box[1]>=120?0:-4}px`;
  return d;
}
function desc(cid){ const c=CARDS[cid]; return `${c.nm}　${"★".repeat(c.r)}`+(c.q?`　${QK[c.q].nm}：${QK[c.q].ds}`:""); }
function toast(t){ const e=document.createElement("div"); e.className="toast"; e.textContent=t; document.querySelector(".screen").appendChild(e); setTimeout(()=>e.remove(),1300); }
const $app=document.getElementById("app");
function screen(){ $app.innerHTML=""; const s=document.createElement("div"); s.className="screen"; $app.appendChild(s); return s; }
function el(tag,cls,html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }

// ---------- 相手の手札（上限の中で一番強い5枚。看板札は必ず入れる） ----------
function bestDeck(pool,cap,must){
  const p=pool.slice().sort(byCard); let best=null,bs=-1;
  const n=p.length;
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++){
    const h=[p[a],p[b],p[c],p[d],p[e]], r=rk(h); if(r>cap) continue;
    if(must && pool.includes(must) && !h.includes(must)) continue;
    const sc=r*100+h.reduce((s,x)=>s+sum(CARDS[x].n),0);
    if(sc>bs){ bs=sc; best=h; }
  }
  if(!best){ best=p.slice(-5); }
  return best;
}

// ---------- 町 ----------
function town(){
  const s=screen();
  const bar=el("div","bar"); bar.appendChild(el("div","title","札の卓")); bar.appendChild(el("div","lbl",`手持ち ${owned().length}枚`)); s.appendChild(bar);
  OPPS.forEach((o,k)=>{
    const st=S.op[k], f=el("div","frame opp");
    const w=el("div","who"); w.appendChild(who(o.who,[72,90])); f.appendChild(w);
    const inf=el("div","info");
    inf.appendChild(el("div","nm",o.nm));
    inf.appendChild(el("div","sub",`手札の上限 ★${o.cap}`));
    inf.appendChild(el("div","rec",`勝ち ${st.won}　負け ${st.lost}`));
    f.appendChild(inf);
    const sigHere=st.pool.includes(o.sig);
    const sw=el("div",""); sw.style.cssText="display:flex;flex-direction:column;align-items:center;gap:3px";
    const sc=cardEl(o.sig,sigHere?"op":"me",58,76); sw.appendChild(sc);
    sw.appendChild(el("div","lbl",sigHere?"看板の札":"君の手に"));
    f.appendChild(sw);
    f.onclick=()=>prep(k);
    s.appendChild(f);
  });
  const col=el("button","btn","手持ちの札を見る"); col.onclick=collection; s.appendChild(col);
  const sp=el("div",""); sp.style.flex="1"; s.appendChild(sp);
  const rs=el("div","lbl","記録を消して、はじめから"); rs.style.cssText+="text-align:right;opacity:.6;padding:4px";
  rs.onclick=()=>{ if(rs.dataset.k){ S=fresh(); save(); town(); } else { rs.dataset.k=1; rs.textContent="もう一度押すと消えます"; } };
  s.appendChild(rs);
}
function collection(){
  const s=screen();
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town; bar.appendChild(el("div","title","手持ちの札")); bar.appendChild(b); s.appendChild(bar);
  const info=el("div","info2","札を押すと、くわしく見られます"); info.textContent=""; s.appendChild(info);
  const g=el("div","grid"); const ids=Object.keys(S.col).sort(byCard);
  ids.forEach(id=>{ const c=cardEl(id,"me",56,74,{count:S.col[id]}); c.onclick=()=>{ info.textContent=desc(id); }; g.appendChild(c); });
  s.appendChild(g);
}

// ---------- 支度 ----------
let P=null; // 支度中の状態
function prep(k){
  const o=OPPS[k], st=S.op[k];
  const opDeck=bestDeck(st.pool,o.cap,o.sig);
  let mine=(S.last[k]||[]).filter(()=>true);
  const pool=owned();
  // 前回の手札が今の手持ちで組めるか確かめ、だめなら上限の中で一番強い5枚
  const can=(()=>{ const c=countOf(pool); for(const x of mine){ if(!c[x]) return false; c[x]--; } return mine.length===5 && rk(mine)<=o.cap; })();
  if(!can) mine=bestDeck(pool,o.cap,null);
  const loan=pool.length<5;
  if(loan){ mine=pool.slice(); while(mine.length<5) mine.push("c05"); }
  P={k,op:opDeck,mine,target:null,loan};
  drawPrep();
}
function oppPick(){ // 相手は、こちらの手札の一番いい札を狙う
  if(P.loan) return null;
  return P.mine.slice().sort(byCard)[0];
}
function drawPrep(){
  const o=OPPS[P.k], s=screen();
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town;
  const t=el("div",""); t.style.cssText="display:flex;align-items:center;gap:8px"; const w=el("div",""); w.style.cssText="width:40px;height:44px;overflow:hidden"; w.appendChild(who(o.who,[40,60])); t.appendChild(w); t.appendChild(el("div","title",o.nm)); bar.appendChild(t); bar.appendChild(b); s.appendChild(bar);
  const info=el("div","info2","");
  // 相手の5枚
  s.appendChild(el("div","lbl","相手の札"));
  const or=el("div","row"); or.style.minHeight="88px"; or.style.marginBottom="12px";
  P.op.forEach((cid,i)=>{ const c=cardEl(cid,"op",62,80); if(P.target===i){ c.classList.add("target"); const m=el("div","mark t","指名"); c.appendChild(m);} if(cid===o.sig&&P.target!==i){ const m=el("div","mark t","看板"); m.style.background="#c9a35a"; c.appendChild(m);} c.onclick=()=>{ info.textContent=desc(cid); if(P.loan){ toast("貸し札では賭けられない"); return; } P.target=P.target===i?null:i; drawPrep(); setTimeout(()=>document.querySelector(".info2").textContent=desc(cid)); }; or.appendChild(c); });
  s.appendChild(or);
  // 自分の5枚
  const pick=oppPick();
  const myl=el("div","lbl",""); myl.textContent="こちらの手札"; s.appendChild(myl);
  const mr=el("div","row"); mr.style.minHeight="88px"; mr.style.marginBottom="12px";
  let dangerShown=false;
  P.mine.forEach((cid,i)=>{ const c=cardEl(cid,"me",62,80); if(P.target!==null&&cid===pick&&!dangerShown){ dangerShown=true; c.classList.add("danger"); const m=el("div","mark d","狙われる"); c.appendChild(m);} c.onclick=()=>{ if(P.loan) return; P.mine.splice(i,1); drawPrep(); }; mr.appendChild(c); });
  for(let i=P.mine.length;i<5;i++){ const e=el("div","card"); e.style.cssText="width:62px;height:80px;border:2px dashed #7a5a3e;background:#0003"; mr.appendChild(e); }
  s.appendChild(mr);
  const r=rk(P.mine), m=el("div","meter"+(r>o.cap?" over":""),`手札の重さ <b>★${r}</b> ／ ★${o.cap}`); s.appendChild(m);
  s.appendChild(info);
  // 手持ち
  const g=el("div","grid"); g.style.flex="1";
  const left=countOf(owned()); P.mine.forEach(x=>{ if(left[x]) left[x]--; });
  Object.keys(S.col).sort(byCard).forEach(id=>{
    const n=left[id]||0; const c=cardEl(id,"me",52,68,{count:n}); if(!n) c.classList.add("used");
    c.onclick=()=>{ info.textContent=desc(id); if(!n||P.loan) return; if(P.mine.length>=5){ toast("手札は5枚まで"); return; } if(rk(P.mine)+CARDS[id].r>o.cap){ toast("重さの上限をこえる"); return; } P.mine.push(id); drawPrep(); setTimeout(()=>document.querySelector(".info2").textContent=desc(id)); };
    g.appendChild(c);
  });
  s.appendChild(g);
  const go=el("button","btn gold"+(P.mine.length<5?" dim":""), P.target===null?"賭けずに勝負":`賭けて勝負`);
  go.onclick=()=>{ if(P.mine.length<5){ toast("手札を5枚にする"); return; } S.last[P.k]=P.mine.slice(); save(); startMatch(); };
  s.appendChild(go);
}

// ---------- 勝負の決まり ----------
const NB=[[-1,0,0,2],[0,1,1,3],[1,0,2,0],[0,-1,3,1]]; // [dy,dx,自分の辺,相手の辺]  上・右・下・左
const CORNER=[0,2,6,8];
function eff(cid,cell){ const c=CARDS[cid]; let n=c.n.slice(); if(c.q==="corner"&&CORNER.includes(cell)) n=n.map(v=>Math.min(10,v+1)); return n; }
function play(G,side,hi,cell,ev){ // G:{b:[9], h:[[],[]]}. side 0=自分 1=相手
  const cid=G.h[side][hi]; G.h[side]=G.h[side].slice(); G.h[side][hi]=null;
  const pc={cid,o:side,n:eff(cid,cell),g:CARDS[cid].q==="guard"};
  G.b=G.b.slice(); G.b[cell]=pc; if(ev) ev.push({t:"put",cell,side});
  const flipped=attack(G,cell,side,ev,1);
  if(CARDS[cid].q==="chain") flipped.forEach(fc=>attack(G,fc,side,ev,2));
}
function attack(G,cell,side,ev,lv){
  const out=[], me=G.b[cell], y=Math.floor(cell/3), x=cell%3;
  for(const [dy,dx,mi,ti] of NB){
    const ny=y+dy,nx=x+dx; if(ny<0||ny>2||nx<0||nx>2) continue;
    const t=ny*3+nx, tc=G.b[t]; if(!tc||tc.o===side) continue;
    if(me.n[mi]>tc.n[ti]){
      if(tc.g){ G.b[t]={...tc,g:false}; if(ev) ev.push({t:"guard",cell:t,lv}); continue; }
      G.b[t]={...tc,o:side}; out.push(t); if(ev) ev.push({t:"flip",cell:t,side,lv});
    }
  }
  return out;
}
function cnt(G,side){ return G.b.filter(c=>c&&c.o===side).length; }
// ---------- 相手の考え ----------
function evalG(G){ // 相手(1)から見た良さ
  let v=(cnt(G,1)-cnt(G,0))*10;
  G.b.forEach((c,i)=>{ if(!c) return; const y=Math.floor(i/3),x=i%3;
    for(const [dy,dx,mi] of NB){ const ny=y+dy,nx=x+dx; if(ny<0||ny>2||nx<0||nx>2) continue; if(G.b[ny*3+nx]) continue;
      const w=(c.n[mi]-5)*0.4; v+= c.o===1? w : -w; }
    if(c.g) v+= c.o===1?1.5:-1.5; });
  return v;
}
function moves(G,side){ const m=[]; const seen={}; G.h[side].forEach((cid,i)=>{ if(!cid||seen[cid]) return; seen[cid]=1; for(let c=0;c<9;c++) if(!G.b[c]) m.push([i,c]); }); return m; }
function search(G,side,d,a,b){
  const full=G.b.every(x=>x);
  if(full) return (cnt(G,1)-cnt(G,0))*100;
  if(d===0) return evalG(G);
  const ms=moves(G,side); if(!ms.length) return evalG(G);
  if(side===1){ let v=-1e9; for(const [i,c] of ms){ const g={b:G.b,h:[G.h[0],G.h[1]]}; play(g,1,i,c,null); v=Math.max(v,search(g,0,d-1,a,b)); a=Math.max(a,v); if(a>=b) break; } return v; }
  let v=1e9; for(const [i,c] of ms){ const g={b:G.b,h:[G.h[0],G.h[1]]}; play(g,0,i,c,null); v=Math.min(v,search(g,1,d-1,a,b)); b=Math.min(b,v); if(a>=b) break; } return v;
}
function aiMove(G,depth){
  const ms=moves(G,1); let best=null,bv=-1e9;
  for(const [i,c] of ms){ const g={b:G.b,h:[G.h[0],G.h[1]]}; play(g,1,i,c,null); let v=search(g,0,depth-1,-1e9,1e9); v+=Math.random()*0.6; if(v>bv){ bv=v; best=[i,c]; } }
  return best;
}

// ---------- 勝負の画面 ----------
let M=null;
function startMatch(){
  const k=P.k, st=S.op[k];
  M={k,G:{b:Array(9).fill(null),h:[P.mine.slice(),P.op.slice()]},turn:st.first,sel:null,busy:false,
     wager:P.target===null?null:{take:P.op[P.target],give:oppPick()},loan:P.loan};
  st.first=1-st.first; save();
  drawMatch(); if(M.turn===1) setTimeout(aiTurn,700);
}
function dims(){
  const H=$app.clientHeight, W=Math.min(440,$app.clientWidth);
  let ch=Math.min(150,(H-330)/3), cw=Math.round(ch/1.27);
  if(cw*3+24>W-20){ cw=Math.floor((W-44)/3); ch=Math.round(cw*1.27); }
  return {cw:Math.floor(cw),ch:Math.floor(ch)};
}
function drawMatch(fx){
  const o=OPPS[M.k], s=screen(), G=M.G, D=dims();
  const top=el("div","score");
  const ow=el("div",""); ow.style.cssText="display:flex;align-items:center;gap:6px"; const w=el("div",""); w.style.cssText="width:36px;height:40px;overflow:hidden"; w.appendChild(who(o.who,[36,60])); ow.appendChild(w); ow.appendChild(el("div","",`<span style="font-size:13px">${o.nm}</span>`));
  top.appendChild(ow); top.appendChild(el("div","",`<b style="color:var(--opL)">${cnt(G,1)}</b>`)); s.appendChild(top);
  const or=el("div","row"); or.style.minHeight="70px";
  G.h[1].forEach(cid=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:50px;height:65px"; or.appendChild(e); return; } const c=cardEl(cid,"op",50,65); if(M.wager&&cid===M.wager.take){ c.classList.add("target"); } or.appendChild(c); });
  s.appendChild(or);
  const bd=el("div","frame board"); bd.style.gridTemplateColumns=`repeat(3,${D.cw}px)`;
  for(let i=0;i<9;i++){
    const ce=el("div","cell"); ce.style.width=D.cw+"px"; ce.style.height=D.ch+"px";
    const c=G.b[i];
    if(c){ const e=cardEl(c.cid,c.o===0?"me":"op",D.cw-4,D.ch-4,{n:c.n,shield:c.g}); if(fx&&fx[i]) e.classList.add(fx[i]); ce.appendChild(e); }
    else if(M.sel!==null&&M.turn===0&&!M.busy) ce.classList.add("can");
    ce.onclick=()=>{ if(M.busy||M.turn!==0||G.b[i]) return; if(M.sel===null){ return; } humanPlay(M.sel,i); };
    bd.appendChild(ce);
  }
  s.appendChild(bd);
  const info=el("div","info2",M.sel!==null?desc(G.h[0][M.sel]):(M.turn===1?"相手が考えている…":"")); s.appendChild(info);
  const mr=el("div","row"); mr.style.minHeight="96px";
  G.h[0].forEach((cid,i)=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:64px;height:84px"; mr.appendChild(e); return; } const c=cardEl(cid,"me",64,84); if(M.sel===i) c.classList.add("sel"); if(M.wager&&cid===M.wager.give) c.classList.add("danger");
    c.onclick=()=>{ if(M.busy) return; M.sel=M.sel===i?null:i; drawMatch(); }; mr.appendChild(c); });
  s.appendChild(mr);
  const bt=el("div","score"); bt.appendChild(el("div","lbl",M.wager?"賭けの勝負":"賭けなし")); bt.appendChild(el("div","",`<b style="color:var(--meL)">${cnt(G,0)}</b>`)); s.appendChild(bt);
}
function animate(ev,done){
  // 置く → 裏返る（連鎖は少し遅れて）
  const steps=[];
  const put=ev.filter(e=>e.t==="put"), l1=ev.filter(e=>e.lv===1), l2=ev.filter(e=>e.lv===2);
  steps.push(()=>{ const fx={}; put.forEach(e=>fx[e.cell]="pop"); return fx; });
  if(l1.length) steps.push(()=>{ const fx={}; l1.forEach(e=>{ fx[e.cell]=e.t==="flip"?"flip":"pop"; }); if(l1.some(e=>e.t==="guard")) setTimeout(()=>toast("踏ん張った！"),50); return fx; });
  if(l2.length) steps.push(()=>{ const fx={}; l2.forEach(e=>{ fx[e.cell]=e.t==="flip"?"flip":"pop"; }); setTimeout(()=>toast(l2.some(e=>e.t==="flip")?"連鎖！":"踏ん張った！"),50); return fx; });
  // 盤面は最後の形で描き、段ごとに効果だけを付け直す
  let i=0; const next=()=>{ if(i>=steps.length){ done(); return; } const fx=steps[i++](); drawMatch(fx); setTimeout(next,i===1?260:460); }; next();
}
function humanPlay(hi,cell){
  M.busy=true; M.sel=null; const ev=[]; play(M.G,0,hi,cell,ev);
  animate(ev,()=>{ M.busy=false; endOrNext(1); });
}
function aiTurn(){
  M.busy=true; drawMatch();
  setTimeout(()=>{ const [hi,cell]=aiMove(M.G,OPPS[M.k].depth); const ev=[]; play(M.G,1,hi,cell,ev); animate(ev,()=>{ M.busy=false; endOrNext(0); }); },450);
}
function endOrNext(nextSide){
  if(M.G.b.every(x=>x)){ setTimeout(result,500); return; }
  M.turn=nextSide; drawMatch(); if(nextSide===1) setTimeout(aiTurn,500);
}
function result(){
  const st=S.op[M.k], me=cnt(M.G,0), op=cnt(M.G,1), win=me>op;
  if(win) st.won++; else st.lost++;
  let got=null,lost=null;
  if(M.wager){
    if(win){ got=M.wager.take; const j=st.pool.indexOf(got); if(j>=0) st.pool.splice(j,1); S.col[got]=(S.col[got]||0)+1; }
    else { lost=M.wager.give; if(S.col[lost]){ S.col[lost]--; if(!S.col[lost]) delete S.col[lost]; } st.pool.push(lost); }
  }
  save();
  drawMatch();
  const v=el("div","veil");
  v.appendChild(el("div","big",win?"勝ち":"負け"));
  v.appendChild(el("div","",`<span style="color:var(--meL);font-size:22px">${me}</span>　対　<span style="color:var(--opL);font-size:22px">${op}</span>`));
  if(got||lost){ const c=cardEl(got||lost,got?"me":"op",120,156); c.classList.add("flip"); v.appendChild(c); v.appendChild(el("div","",got?`${CARDS[got].nm}を手に入れた！`:`${CARDS[lost].nm}を取られた…`)); }
  const r=el("div","row"); r.style.gap="10px";
  const a=el("button","btn gold","もう一勝負"); a.onclick=()=>prep(M.k);
  const b=el("button","btn","卓を離れる"); b.onclick=town;
  r.appendChild(a); r.appendChild(b); v.appendChild(r);
  document.querySelector(".screen").appendChild(v);
}

load(); town();
window.__S=()=>S; window.__M=()=>M;
