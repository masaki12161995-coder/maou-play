"use strict";
// ===== 札の卓（試作） =====
const RARE=["","#cfcfcf","#56b35a","#4a90e2","#a66ad8","#e8b93c","#fff"];
const base=id=>String(id).split("|")[0];
const KIND_NM={"魔物":"魔物の札","色違い":"色違いの札","光る":"光る札","人物":"人物の札","限定":"限定の札"};
const KEY="cardproto3";

// ---------- 記録 ----------
let S;
function fresh(){ return {v:3,col:countOf(START),seen:{},op:OPPS.map(o=>({pool:o.pool.slice(),won:0,lost:0})),last:{},coin:300,games:0,shigoro:0}; }
function countOf(a){ const c={}; a.forEach(x=>c[x]=(c[x]||0)+1); return c; }
function load(){ try{ const t=localStorage.getItem(KEY); S=t?JSON.parse(t):fresh(); }catch(e){ S=fresh(); } if(S.v!==3) S=fresh();
  while(S.op.length<OPPS.length){ const o=OPPS[S.op.length]; S.op.push({pool:o.pool.slice(),won:0,lost:0}); }
  Object.keys(S.col).forEach(k=>{ if(!CARDS[k]) delete S.col[k]; S.seen[k]=1; }); }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function restock(){
  OPPS.forEach((o,k)=>{ const st=S.op[k]; const want=countOf(o.pool.filter(c=>CARDS[c].r<=2)); const have=countOf(st.pool);
    Object.keys(want).forEach(c=>{ for(let i=(have[c]||0);i<want[c];i++) st.pool.push(c); }); });
}
function owned(){ const a=[]; Object.keys(S.col).sort(byCard).forEach(k=>{ for(let i=0;i<S.col[k];i++) a.push(k); }); return a; }
function byCard(a,b){ return CARDS[b].r-CARDS[a].r || sum(CARDS[b].n)-sum(CARDS[a].n) || (a<b?-1:1); }
function sum(n){ return n[0]+n[1]+n[2]+n[3]; }
function rk(list){ return list.reduce((s,c)=>s+CARDS[c].r,0); }

// ---------- 札の絵 ----------
const N=v=>v>=10?`<span style="letter-spacing:-.08em">10</span>`:String(v); // 10は「10」と書く
function cardEl(cid,owner,w,h,o={}){
  const c=CARDS[cid], d=document.createElement("div");
  d.className="card "+owner; d.style.width=w+"px"; d.style.height=h+"px";
  const nums=o.n||c.n, q=o.mini?[]:(o.q||c.q||[]), fs=Math.max(11,Math.round(w*0.19));
  const [iw,ih]=IMG[c.im], bw=w*0.88, bh=h*0.66;
  const fit=iw<=bw&&ih<=bh, sc=fit?Math.max(1,Math.floor(Math.min(bw/iw,bh/ih))):(iw>bw*1.7&&ih>bh*1.3?0.5:1);
  const top=ih*sc<=bh?(bh-ih*sc)/2:0;
  const qn=q.map(k=>QK[k].nm).join("・");
  d.innerHTML=`<div class="face"></div>
   <div class="art"><img src="img/c/${c.im}.png" style="width:${iw*sc}px;height:${ih*sc}px;top:${top}px"></div>
   <div class="stars">★${c.r}</div><div class="shield"></div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;top:${Math.round(h*0.03)}px">${N(nums[0])}</div>
   <div class="n" style="font-size:${fs}px;right:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[1])}</div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;bottom:${q.length?Math.round(h*(q.length>1?0.25:0.155)):Math.round(h*0.04)}px">${N(nums[2])}</div>
   <div class="n" style="font-size:${fs}px;left:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[3])}</div>
   ${q.length?`<div class="qk" style="font-size:${Math.max(9,Math.round(w*(q.length>1?0.12:0.14)))}px;line-height:1.15">${q.map(k=>QK[k].nm).join("<br>")}</div>`:""}`;
  if(o.mini) d.querySelectorAll(".n").forEach(x=>x.remove());
  d.style.borderColor=RARE[c.r]; d.style.borderWidth=c.r>=5?"3px":"2px"; if(c.r>=6) d.classList.add("r6"); if(c.glow) d.classList.add("glow");
  if(o.shield) d.classList.add("shielded");
  if(o.sealed) d.classList.add("sealed");
  holdToShow(d,cid);
  if(o.count>1){ const b=document.createElement("div"); b.className="mark t"; b.style.bottom="auto"; b.style.top="-2px"; b.style.left="auto"; b.style.right="-2px"; b.style.transform="none"; b.textContent="×"+o.count; d.appendChild(b); }
  return d;
}
function backEl(w,h){ const d=el("div","card back"); d.style.width=w+"px"; d.style.height=h+"px"; d.innerHTML='<div class="bk"></div>'; return d; }
function who(id,box){ // 人物の正面の立ち姿（2倍、上半身で切る）
  const d=document.createElement("div"); d.className="sprite";
  d.style.cssText=`width:${box[0]}px;height:${box[1]}px;background-image:url(img/person_${id}.png);background-size:288px 600px;background-position:${-(96)+(box[0]-96)/2}px ${box[1]>=120?0:-4}px`;
  return d;
}
function desc(cid){ // 札をタップしたときの説明：名前と、くせ（名前の色を変えて、言葉で）
  const c=CARDS[cid];
  return `<div style="font-weight:700;font-size:14px">${c.nm}</div>`+(c.q?c.q.map(k=>`<div style="font-size:13px;line-height:1.45"><span style="color:var(--gold);font-weight:700">${QK[k].nm}</span>　${QK[k].ds}</div>`).join(""):`<div style="font-size:13px;color:var(--sub)">くせなし</div>`);
}
function toast(t){ const e=document.createElement("div"); e.className="toast"; e.textContent=t; document.querySelector(".screen").appendChild(e); setTimeout(()=>e.remove(),1300); }
const $app=document.getElementById("app");
function screen(){ $app.innerHTML=""; const s=document.createElement("div"); s.className="screen"; $app.appendChild(s); return s; }
function el(tag,cls,html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }

// ---------- 長押しで札をくわしく見る ----------
let HOLD=null, EAT=false;
function holdToShow(d,cid){
  const start=(e)=>{ clearTimeout(HOLD); HOLD=setTimeout(()=>{ EAT=true; detail(cid); },420); };
  const stop=()=>clearTimeout(HOLD);
  d.addEventListener("pointerdown",start); d.addEventListener("pointerup",stop); d.addEventListener("pointerleave",stop); d.addEventListener("pointercancel",stop);
  d.addEventListener("contextmenu",e=>e.preventDefault());
}
document.addEventListener("click",e=>{ if(EAT){ EAT=false; e.stopPropagation(); e.preventDefault(); } },true);
function detail(cid){
  const c=CARDS[cid]; const v=el("div","veil"); v.style.zIndex=40;
  const k=cardEl(cid,"nb",150,196); k.classList.add("pop"); v.appendChild(k);
  v.appendChild(el("div","",`<div style="font-size:20px;font-weight:700;text-align:center">${c.nm}</div><div style="text-align:center;color:${RARE[c.r]==="#fff"?"#ffe08a":RARE[c.r]};letter-spacing:2px">${"★".repeat(c.r)}</div>`));
  const q=el("div","frame",""); q.style.cssText+="padding:10px 14px;max-width:320px;text-align:center;line-height:1.6";
  q.innerHTML=`<div style="font-size:12px;color:var(--sub);margin-bottom:4px">No.${String(c.no).padStart(3,"0")}　${KIND_NM[c.k]}</div>`+
    (c.q?c.q.map(k=>`<div style="color:var(--gold);font-size:16px;font-weight:700">${QK[k].nm}</div><div style="font-size:14px;margin-bottom:4px">${QK[k].ds}</div>`).join(""):`<div style="font-size:14px;color:var(--sub)">くせなし</div>`);
  if(c.fam){ const f=ORDER.filter(x=>CARDS[x].fam===c.fam&&x!==cid); if(f.length) q.innerHTML+=`<div style="font-size:12px;color:var(--sub);margin-top:4px">同じ系統：${f.map(x=>S.seen[x]?CARDS[x].nm:"？？？").join("・")}</div>`; }
  if(c.only) q.innerHTML+=`<div style="font-size:12px;color:#ffb3d0;margin-top:6px">${c.only}</div>`;
  v.appendChild(q);
  v.onclick=()=>v.remove();
  (document.querySelector(".screen")||document.body).appendChild(v);
}

// ---------- 相手の手札（上限の中で一番強い5枚。看板札は必ず入れる） ----------
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function oppDeck(pool,cap,must){ // 相手の手札：毎回組み方を変え、並びも混ぜる
  const p=pool.slice().sort(byCard), n=p.length, all=[], seen=new Set();
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++){
    const h=[p[a],p[b],p[c],p[d],p[e]], r=rk(h); if(r>cap) continue;
    if(must && pool.includes(must) && !h.includes(must)) continue;
    const key=h.join(); if(seen.has(key)) continue; seen.add(key);
    all.push([r*100+h.reduce((s,x)=>s+sum(CARDS[x].n),0),h]);
  }
  if(!all.length) return shuffle(p.slice(-5));
  all.sort((x,y)=>y[0]-x[0]);
  const top=all[0][0], cand=all.filter(x=>x[0]>=top-130).slice(0,10);
  return shuffle(cand[Math.floor(Math.random()*cand.length)][1].slice());
}
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
function coinTag(){ return `<span style="color:var(--gold)">◎ ${S.coin.toLocaleString()}</span>`; }
function town(){
  const s=screen();
  const bar=el("div","bar"); bar.appendChild(el("div","title","札の卓")); bar.appendChild(el("div","lbl",`${coinTag()}`)); s.appendChild(bar);
  const g=el("div",""); g.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:6px";
  OPPS.forEach((o,k)=>{
    const st=S.op[k], f=el("div","frame opp2");
    const w=el("div","who"); w.appendChild(who(o.who,[44,58])); f.appendChild(w);
    const inf=el("div","info");
    const cut=o.nm.lastIndexOf("の"); inf.appendChild(el("div","nm",cut>0?`${o.nm.slice(0,cut+1)}<br>${o.nm.slice(cut+1)}`:o.nm));
    inf.appendChild(el("div","sub",`上限 ★${o.cap}`)); inf.appendChild(el("div","sub",`${st.won}勝 ${st.lost}敗`));
    f.appendChild(inf);
    const sigHere=st.pool.includes(o.sig);
    const sc=cardEl(o.sig,sigHere?"op":"me",44,58,{mini:true}); sc.classList.add("sig"); if(!sigHere) sc.style.opacity=".5"; f.appendChild(sc);
    const out=st.pool.length<5;
    if(out){ f.classList.add("out"); inf.lastChild.textContent="札が尽きた"; }
    f.onclick=()=>{ if(out){ toast("相手の札が足りない。集め直している"); return; } prep(k); };
    g.appendChild(f);
  });
  s.appendChild(g);
  const r=el("div","row"); r.style.gap="8px";
  const col=el("button","btn","札帳"); col.style.flex="1"; col.onclick=()=>collection(0); r.appendChild(col);
  const cas=el("button","btn gold","遊び場"); cas.style.flex="1"; cas.onclick=casino; r.appendChild(cas);
  s.appendChild(r);
  const sp=el("div",""); sp.style.flex="1"; s.appendChild(sp);
  const rs=el("div","lbl","記録を消して、はじめから"); rs.style.cssText+="text-align:right;opacity:.6;padding:4px";
  rs.onclick=()=>{ if(rs.dataset.k){ S=fresh(); save(); town(); } else { rs.dataset.k=1; rs.textContent="もう一度押すと消えます"; } };
  s.appendChild(rs);
}
// 札帳：240種を番号の順に。持っていない札は影だけ
function collection(page){
  // 出会った札・持っている札だけが載る（全部で何種類あるかは見せない）
  const list=ORDER.filter(id=>S.col[id]||S.seen[id]);
  const s=screen(), per=25, pages=Math.max(1,Math.ceil(list.length/per)); page=Math.max(0,Math.min(pages-1,page));
  const have=Object.keys(S.col).length;
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town;
  bar.appendChild(el("div","title","札帳")); bar.appendChild(el("div","lbl",`持っている札 <b style="color:var(--gold)">${have}</b>種`)); bar.appendChild(b); s.appendChild(bar);
  const g=el("div","book");
  list.slice(page*per,(page+1)*per).forEach(id=>{
    const box=el("div","bk1");
    if(S.col[id]){ box.appendChild(cardEl(id,"nb",66,86,{count:S.col[id]})); }
    else { const c=CARDS[id], sh=el("div","card shadow"); sh.style.cssText="width:66px;height:86px";
      sh.innerHTML=S.seen[id]?`<div class="art"><img src="img/c/${c.im}.png" style="${(()=>{ const [iw,ih]=IMG[c.im], sc=iw<=58&&ih<=56?Math.max(1,Math.floor(Math.min(58/iw,56/ih))):1; return `width:${iw*sc}px;height:${ih*sc}px;top:${ih*sc<=56?(56-ih*sc)/2:0}px`; })()}"></div>`:`<div class="q">？</div>`;
      box.appendChild(sh); }
    box.appendChild(el("div","no",String(CARDS[id].no).padStart(3,"0")));
    g.appendChild(box);
  });
  s.appendChild(g);
  const nav=el("div","pager");
  const pv=el("button","btn","‹"); pv.onclick=()=>collection(page-1); if(page===0) pv.classList.add("dim");
  const nx=el("button","btn","›"); nx.onclick=()=>collection(page+1); if(page===pages-1) nx.classList.add("dim");
  const dots=el("div","dots"); for(let i=0;i<pages;i++){ const d=el("i",i===page?"on":""); d.onclick=()=>collection(i); dots.appendChild(d); }
  nav.appendChild(pv); nav.appendChild(dots); nav.appendChild(nx); s.appendChild(nav);
  let sx=null; g.addEventListener("pointerdown",e=>{ sx=e.clientX; }); g.addEventListener("pointerup",e=>{ if(sx!==null&&Math.abs(e.clientX-sx)>60) collection(page+(e.clientX<sx?1:-1)); sx=null; });
}
function gain(cid){ S.col[cid]=(S.col[cid]||0)+1; S.seen[cid]=1; save(); }
function reveal(cid,title,back){
  const v=el("div","veil");
  v.appendChild(el("div","big",title));
  const c=cardEl(cid,"me",130,170); c.classList.add("flip"); v.appendChild(c);
  v.appendChild(el("div","",desc(cid))); v.lastChild.style.cssText="font-size:13px;padding:0 20px;text-align:center";
  const b=el("button","btn gold","受け取る"); b.onclick=()=>{ v.remove(); if(back) back(); }; v.appendChild(b);
  document.querySelector(".screen").appendChild(v);
}

// ---------- 遊び場 ----------
function casino(){
  const s=screen();
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town; bar.appendChild(el("div","title","遊び場")); const right=el("div","",coinTag()); bar.appendChild(right); bar.appendChild(b); s.appendChild(bar);
  const tile=(title,sub,cid,go)=>{ const f=el("div","frame opp"); const inf=el("div","info"); inf.appendChild(el("div","nm",title)); inf.appendChild(el("div","sub",sub)); f.appendChild(inf); const c=cardEl(cid,S.col[cid]?"me":"nb",64,84); f.appendChild(c); f.onclick=go; return f; };
  s.appendChild(tile("スロット","7が3つそろうと、ここだけの札","m004",slot));
  s.appendChild(tile("チンチロ","ピンゾロで勝つと、ここだけの札","m050",chin));
  s.appendChild(el("div","lbl","景品"));
  const info=el("div","info2","");
  const r=el("div","row"); r.style.gap="6px"; r.style.flexWrap="wrap";
  PRIZES.forEach(([cid,price])=>{ const w=el("div",""); w.style.cssText="display:flex;flex-direction:column;align-items:center;gap:6px";
    const c=cardEl(cid,"nb",52,68); w.appendChild(c);
    const p=el("div","",`<span style="color:var(--gold);font-size:13px">◎${price}</span>`); p.style.minHeight="30px"; w.appendChild(p);
    c.onclick=()=>{ info.innerHTML=desc(cid); r.querySelectorAll(".card").forEach(x=>x.classList.remove("target")); c.classList.add("target");
      r.querySelectorAll(".buy").forEach(x=>{ x.outerHTML=`<span style="color:var(--gold);font-size:13px">◎${x.dataset.p}</span>`; });
      const bt=el("button","btn gold buy",`交換 ◎${price}`); bt.dataset.p=price; bt.style.cssText+="font-size:12px;padding:5px 6px"; p.innerHTML=""; p.appendChild(bt);
      bt.onclick=()=>{ if(S.coin<price){ toast("コインが足りない"); return; } S.coin-=price; gain(cid); reveal(cid,"交換した！",casino); }; };
    r.appendChild(w); });
  s.appendChild(r); s.appendChild(info);
}
// スロット
const SYM=[["7",3],["鎧",3],["炎",5],["鴉",6],["雫",8]];
const PAY3={"7":1000,"鎧":300,"炎":120,"鴉":60,"雫":30}, PAY2={"7":60,"鎧":30,"炎":20,"鴉":16,"雫":13};
const SYMIMG={"鎧":["m004",1],"炎":["m007",2],"鴉":["m037",2],"雫":["m001",3]};
function symEl(k){ const d=el("div",""); d.style.cssText="width:100%;height:100%;display:flex;align-items:center;justify-content:center";
  if(k==="7"){ d.innerHTML='<span style="font-family:Avenir Next,system-ui;font-weight:900;font-size:64px;color:#ffd35a;text-shadow:0 3px 0 #8a4b10,0 0 12px #ffb347">7</span>'; }
  else { const [im,sc]=SYMIMG[k], [w,h]=IMG[im]; d.innerHTML=`<img src="img/c/${im}.png" style="width:${w*sc}px;height:${h*sc}px;image-rendering:pixelated">`; }
  return d; }
function pickSym(){ let r=Math.random()*25; for(const [k,w] of SYM){ if((r-=w)<0) return k; } return "雫"; }
let SL=null;
function slot(){
  const s=screen(); SL=SL||{busy:false,last:["7","鎧","炎"]};
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=()=>{ if(!SL.busy) casino(); }; bar.appendChild(el("div","title","スロット")); const ct=el("div","",coinTag()); bar.appendChild(ct); bar.appendChild(b); s.appendChild(bar);
  const mac=el("div","frame"); mac.style.cssText+="padding:14px;display:flex;gap:8px;justify-content:center;background:linear-gradient(#3a2430,#1d1418)";
  const reels=[0,1,2].map(i=>{ const r=el("div",""); r.style.cssText="width:104px;height:128px;background:linear-gradient(#f6ecd6,#d8c8a6);border:3px solid #5a3d2a;border-radius:6px;overflow:hidden;box-shadow:0 0 0 2px #000 inset"; r.appendChild(symEl(SL.last[i])); mac.appendChild(r); return r; });
  s.appendChild(mac);
  const res=el("div","info2",""); res.style.fontSize="18px"; res.style.color="var(--gold)"; s.appendChild(res);
  // 配当表
  const pt=el("div","frame"); pt.style.cssText+="padding:8px 12px;display:grid;grid-template-columns:auto 1fr auto 1fr;gap:4px 10px;align-items:center;font-size:13px";
  SYM.forEach(([k])=>{ const a=el("div",""); a.style.cssText="width:34px;height:34px"; const se=symEl(k); se.style.transform="scale(.42)"; se.style.transformOrigin="center"; a.appendChild(se);
    pt.appendChild(a); pt.appendChild(el("div","",`3つ　<b style="color:var(--gold)">◎${PAY3[k]}</b>`)); pt.appendChild(el("div","lbl","2つ")); pt.appendChild(el("div","",`<b>◎${PAY2[k]}</b>`)); });
  s.appendChild(pt);
  const sp=el("div",""); sp.style.flex="1"; s.appendChild(sp);
  const go=el("button","btn gold","回す（◎10）"); go.style.fontSize="20px"; go.style.padding="16px";
  const spin=()=>{ if(SL.busy) return; if(S.coin<10){ toast("コインが足りない"); return; }
    SL.busy=true; S.coin-=10; save(); ct.innerHTML=coinTag(); res.textContent="";
    const out=[pickSym(),pickSym(),pickSym()]; let t=0;
    const iv=setInterval(()=>{ t++; reels.forEach((r,i)=>{ if(t<8+i*6){ r.innerHTML=""; r.appendChild(symEl(SYM[(t+i*2)%5][0])); } else if(t===8+i*6){ r.innerHTML=""; r.appendChild(symEl(out[i])); r.animate([{transform:"translateY(-10px)"},{transform:"none"}],{duration:160}); } });
      if(t>=8+12){ clearInterval(iv); SL.last=out; finish(out); } },70);
  };
  const finish=(o)=>{ let win=0; if(o[0]===o[1]&&o[1]===o[2]) win=PAY3[o[0]]; else if(o[0]===o[1]) win=PAY2[o[0]];
    S.coin+=win; save(); ct.innerHTML=coinTag(); SL.busy=false;
    if(win){ res.textContent=`◎${win} 当たり！`; mac.animate([{filter:"brightness(1.6)"},{filter:"none"}],{duration:500,iterations:win>=300?4:1}); } else res.textContent="";
    if(o.join("")==="777"){ gain("m004"); reveal("m004","大当たり！",null); }
    else if(o.join("")==="鎧鎧鎧"&&!S.col.L05&&!(S.gotL||{}).L05){ S.gotL=S.gotL||{}; S.gotL.L05=1; gain("L05"); reveal("L05","限定の札！",null); } };
  go.onclick=spin; mac.onclick=spin;
  s.appendChild(go);
}
// チンチロ
function hand(d){ const a=d.slice().sort((x,y)=>x-y);
  if(a[0]===a[2]) return a[0]===1?{nm:"ピンゾロ",rk:100,m:5}:{nm:`${a[0]}のゾロ目`,rk:90+a[0],m:3};
  if(a.join("")==="456") return {nm:"シゴロ",rk:80,m:2};
  if(a.join("")==="123") return {nm:"ヒフミ",rk:-10,m:2};
  if(a[0]===a[1]) return {nm:`${a[2]}の目`,rk:a[2],m:1};
  if(a[1]===a[2]) return {nm:`${a[0]}の目`,rk:a[0],m:1};
  return null; }
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function dieEl(v,size){ const d=el("div",""); d.style.cssText=`width:${size}px;height:${size}px;background:#fbf6ea;border-radius:${size*0.18}px;box-shadow:0 2px 0 #a99a80,0 0 0 1px #0004 inset;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:${size*0.12}px;gap:1px`;
  for(let i=0;i<9;i++){ const p=el("div",""); if(PIPS[v].includes(i)) p.style.cssText=`border-radius:50%;background:${v===1?"#d23":"#222"};width:${v===1?"100%":"78%"};height:${v===1?"100%":"78%"};margin:auto`; d.appendChild(p); } return d; }
let CH={bet:10};
function chin(){
  const s=screen(); CH.state=CH.state||"bet";
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=()=>{ if(CH.state==="bet"||CH.state==="done"){ CH.state="bet"; casino(); } }; bar.appendChild(el("div","title","チンチロ")); const ct=el("div","",coinTag()); bar.appendChild(ct); bar.appendChild(b); s.appendChild(bar);
  const dl=el("div","frame opp"); const w=el("div","who"); w.style.width="56px"; w.style.height="70px"; w.appendChild(who("019",[56,70])); dl.appendChild(w);
  const di=el("div","info"); di.appendChild(el("div","nm","壺振りのゲン")); const dh=el("div","sub",CH.dh?`親の目：${CH.dh}`:"親"); di.appendChild(dh); dl.appendChild(di); s.appendChild(dl);
  const bowl=el("div",""); bowl.style.cssText="margin:6px auto;width:300px;height:220px;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#5a3b2a 0%,#3a2418 55%,#1e120c 75%);box-shadow:0 0 0 6px #6b4a33,0 10px 20px #000a,inset 0 12px 30px #000c;display:flex;align-items:center;justify-content:center;gap:14px";
  const dice=CH.dice||[4,5,6]; dice.forEach(v=>bowl.appendChild(dieEl(v,52))); s.appendChild(bowl);
  const msg=el("div","info2",CH.msg||""); msg.style.fontSize="17px"; msg.style.color="var(--gold)"; s.appendChild(msg);
  const mh=el("div","info2",CH.ph?`こちらの目：${CH.ph}`:""); s.appendChild(mh);
  const sp=el("div",""); sp.style.flex="1"; s.appendChild(sp);
  const roll=(cb)=>{ let t=0; const iv=setInterval(()=>{ t++; const r=[1,2,3].map(()=>1+Math.floor(Math.random()*6)); bowl.innerHTML=""; r.forEach(v=>bowl.appendChild(dieEl(v,52))); if(t>=10){ clearInterval(iv); cb(r); } },60); };
  if(CH.state==="bet"){
    const r=el("div","row"); r.style.gap="8px"; [10,50,100].forEach(v=>{ const bt=el("button","btn"+(CH.bet===v?" gold":""),`◎${v}`); bt.style.flex="1"; bt.onclick=()=>{ CH.bet=v; chin(); }; r.appendChild(bt); }); s.appendChild(r);
    const go=el("button","btn gold","勝負"); go.style.fontSize="20px"; go.style.padding="14px";
    go.onclick=()=>{ if(S.coin<CH.bet*2){ toast("コインが足りない（賭けの2倍が要る）"); return; } CH.state="dealer"; CH.try=0; CH.dh=null; CH.ph=null; CH.msg="親が振る…"; chin(); dealerRoll(); };
    s.appendChild(go);
  } else if(CH.state==="player"){
    const go=el("button","btn gold",`振る（あと${3-CH.try}回）`); go.style.fontSize="20px"; go.style.padding="14px";
    const doRoll=()=>{ if(CH.rolling) return; CH.rolling=true; roll(r=>{ CH.rolling=false; CH.dice=r; CH.try++; const h=hand(r);
        if(h){ CH.ph=h.nm; CH.phv=h; if(h.nm==="シゴロ"){ S.shigoro=(S.shigoro||0)+1; save(); } settle(); if(h.nm==="シゴロ") setTimeout(()=>awards(),1200); } else if(CH.try>=3){ CH.ph="目なし"; CH.phv={nm:"目なし",rk:0,m:1}; settle(); } else { CH.msg="目なし…もう一度"; chin(); } }); };
    go.onclick=doRoll; bowl.onclick=doRoll; s.appendChild(go);
  } else if(CH.state==="done"){
    const go=el("button","btn gold","もう一勝負"); go.style.fontSize="20px"; go.style.padding="14px"; go.onclick=()=>{ CH.state="bet"; CH.msg=""; CH.dh=null; CH.ph=null; chin(); }; s.appendChild(go);
  }
  function dealerRoll(){ roll(r=>{ CH.dice=r; CH.try++; const h=hand(r);
    if(!h && CH.try<3){ chin(); setTimeout(dealerRoll,350); return; }
    CH.dhv=h||{nm:"目なし",rk:0,m:1}; CH.dh=CH.dhv.nm; CH.try=0;
    if(CH.dhv.rk>=80){ CH.state="done"; pay(-CH.bet*CH.dhv.m, `親の${CH.dh}。こちらの負け`); return; }
    if(CH.dhv.rk<0){ CH.state="done"; pay(CH.bet*2, "親のヒフミ。こちらの勝ち"); return; }
    if(CH.dhv.rk===0){ CH.state="done"; pay(CH.bet, "親の目なし。こちらの勝ち"); return; }
    CH.state="player"; CH.msg=`親は${CH.dh}。こちらの番`; chin(); }); }
  function settle(){ const p=CH.phv, d=CH.dhv; CH.state="done";
    if(p.rk<0) return pay(-CH.bet*2,"ヒフミ…倍払い");
    if(p.rk>d.rk){ pay(CH.bet*p.m, `${p.nm}！こちらの勝ち`); if(p.nm==="ピンゾロ"){ gain("m050"); setTimeout(()=>reveal("m050","ピンゾロ！",null),300); } return; }
    if(p.rk===d.rk) return pay(0,"引き分け");
    pay(-CH.bet*d.m,"こちらの負け"); }
  function pay(v,text){ S.coin=Math.max(0,S.coin+v); save(); CH.msg=text+(v?`（${v>0?"+":""}${v}）`:""); chin(); }
}

// ---------- 支度 ----------
let P=null; // 支度中の状態
function prep(k){
  const o=OPPS[k], st=S.op[k];
  const opDeck=oppDeck(st.pool,o.cap,o.sig);
  let glow=null; // ごくまれに、伏せ札の中に光る札がまじる
  if(Math.random()<0.04){ const idx=opDeck.findIndex(x=>x!==o.sig); if(idx>=0){ opDeck[idx]=GLOWS[Math.floor(Math.random()*GLOWS.length)]; glow=idx; } }
  let mine=(S.last[k]||[]).slice();
  const pool=owned();
  const can=(()=>{ const c=countOf(pool); for(const x of mine){ if(!c[x]) return false; c[x]--; } return mine.length===5 && rk(mine)<=o.cap; })();
  if(!can) mine=quickDeck(pool,o.cap);
  const loan=pool.length<5;
  if(loan){ mine=pool.slice(); while(mine.length<5) mine.push("m001"); }
  P={k,op:opDeck,mine,target:null,loan,glow};
  drawPrep();
}
function quickDeck(pool,cap){ // 上限の中で強い5枚（数字の合計の大きい順に詰める）
  const p=pool.slice().sort((a,b)=>sum(CARDS[b].n)+CARDS[b].r*3-sum(CARDS[a].n)-CARDS[a].r*3), h=[]; let w=0;
  for(const c of p){ if(h.length>=5) break; const r=CARDS[c].r; if(w+r+(4-h.length)*1<=cap){ h.push(c); w+=r; } }
  return h;
}
function weight(mine){ return rk(mine); }
function oppPick(){ // 相手は、こちらの手札の一番いい札を狙う
  if(P.loan) return null;
  return P.mine.slice().sort(byCard)[0];
}
function miniOrEmpty(cid,owner,lab,cls){
  const box=el("div",""); box.style.cssText="display:flex;flex-direction:column;align-items:center;gap:3px;width:64px";
  box.appendChild(el("div","lbl",lab));
  if(cid){ const c=cardEl(cid,owner,40,52); if(cls) c.classList.add(cls); box.appendChild(c); }
  else { const d=el("div",""); d.style.cssText="width:40px;height:52px;border:2px dashed #5a4a3e;border-radius:6px"; box.appendChild(d); }
  return box;
}
function drawPrep(){
  const o=OPPS[P.k], s=screen();
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town;
  const t=el("div",""); t.style.cssText="display:flex;align-items:center;gap:8px"; const w=el("div",""); w.style.cssText="width:40px;height:44px;overflow:hidden"; w.appendChild(who(o.who,[40,60])); t.appendChild(w); t.appendChild(el("div","title",o.nm)); bar.appendChild(t); bar.appendChild(b); s.appendChild(bar);
  const say=(x)=>setTimeout(()=>{ const i=document.querySelector(".tray .info2"); if(i) i.innerHTML=desc(x); });
  // 相手（伏せたまま）
  const op=el("div","panel op");
  const oh=el("div","phead"); oh.appendChild(el("div","",`相手の手札`)); oh.appendChild(el("div","",`持ち札 ${S.op[P.k].pool.length}枚`)); op.appendChild(oh);
  const ready=P.mine.length===5;
  const or=el("div","row"); or.style.perspective="800px";
  const slots=P.op.map((cid,i)=>{ const slot=el("div",""); slot.style.cssText="width:58px;height:76px;position:relative";
    const bk=backEl(58,76); if(ready) bk.classList.add("lure"); slot.appendChild(bk);
    bk.onclick=()=>{ if(P.target!==null) return; if(P.mine.length<5){ toast("手札を5枚にする"); return; } choose(i,slot,bk); };
    or.appendChild(slot); return slot; });
  op.appendChild(or); s.appendChild(op);
  // 賭け
  const pick=oppPick();
  const vs=el("div","vsband");
  const lb=el("div",""); lb.style.cssText="display:flex;flex-direction:column;align-items:center;gap:3px;width:64px"; lb.appendChild(el("div","lbl","指名")); const q=backEl(40,52); q.querySelector(".bk").innerHTML="<b>？</b>"; lb.appendChild(q); vs.appendChild(lb);
  const mlab=()=>vs.querySelector(".vsmid .lbl");
  const mid=el("div","vsmid"); mid.innerHTML=`<div class="vs">VS</div><div class="lbl">${P.loan?"貸し札の練習":"勝った方が受け取る"}</div>`; vs.appendChild(mid);
  vs.appendChild(miniOrEmpty(P.loan?null:pick,"me","狙われる","danger"));
  s.appendChild(vs);
  // 自分の手札
  const me=el("div","panel me");
  const r=rk(P.mine);
  const mh=el("div","phead"); mh.appendChild(el("div","",`こちらの手札`));
  const meter=el("div","wmeter"); for(let i=0;i<o.cap;i++){ const d=el("i",""); if(i<r) d.className=r>o.cap?"over":"on"; meter.appendChild(d); } const wl=el("span","",`★${r}/${o.cap}`); meter.appendChild(wl); mh.appendChild(meter); me.appendChild(mh);
  const mr=el("div","row");
  P.mine.forEach((cid,i)=>{ const c=cardEl(cid,"me",62,80); if(!P.loan&&cid===pick&&P.mine.indexOf(cid)===i) c.classList.add("danger"); c.onclick=()=>{ if(P.loan) return; P.mine.splice(i,1); drawPrep(); say(cid); }; mr.appendChild(c); });
  for(let i=P.mine.length;i<5;i++){ const e=el("div","slot"); mr.appendChild(e); }
  me.appendChild(mr); s.appendChild(me);
  // 手持ち
  const tray=el("div","tray");
  const left=countOf(owned()); P.mine.forEach(x=>{ if(left[x]) left[x]--; });
  const ids=Object.keys(S.col).sort(byCard).filter(id=>left[id]>0);
  const th=el("div","phead"); th.appendChild(el("div","",`手持ち`)); th.appendChild(el("div","lbl",`${ids.reduce((s,x)=>s+left[x],0)}枚`)); tray.appendChild(th);
  tray.appendChild(el("div","info2",""));
  const g=el("div","grid");
  ids.forEach(id=>{ const n=left[id]; const c=cardEl(id,"me",48,62,{count:n}); const heavy=r+CARDS[id].r>o.cap||P.mine.length>=5; if(heavy) c.style.opacity=".45";
    c.onclick=()=>{ say(id); if(P.loan) return; if(P.mine.length>=5){ toast("手札は5枚まで"); return; } if(r+CARDS[id].r>o.cap){ toast("重さの上限をこえる"); return; } P.mine.push(id); drawPrep(); say(id); };
    g.appendChild(c); });
  tray.appendChild(g); s.appendChild(tray);
  function choose(i,slot,bk){ // 伏せ札を1枚めくって確定。後戻りなし
    P.target=i; S.last[P.k]=P.mine.slice(); save();
    const cid=P.op[i], sig=cid===o.sig, gl=Boolean(CARDS[cid].glow); S.seen[cid]=1;
    document.querySelectorAll("button,.card").forEach(x=>{ x.style.pointerEvents="none"; });
    or.querySelectorAll(".back").forEach(x=>{ x.classList.remove("lure"); if(x!==bk) x.style.opacity=".35"; });
    bk.animate([{transform:"rotateY(0)"},{transform:"rotateY(90deg)"}],{duration:220,fill:"forwards"});
    setTimeout(()=>{ slot.innerHTML=""; const c=cardEl(cid,"op",58,76); slot.appendChild(c); c.animate([{transform:"rotateY(90deg)"},{transform:"rotateY(0) scale(1.2)"},{transform:"scale(1)"}],{duration:380});
      const m=cardEl(cid,"op",40,52); q.replaceWith(m);
      const lab=mlab();
      if(gl){ lab.innerHTML=`<span style="color:#e8f2ff;font-size:16px;text-shadow:0 0 8px #9cc4ff">光る札！</span>`; s.animate([{background:"#cfe0ff66"},{background:"transparent"}],{duration:500,iterations:4}); }
      else if(sig){ c.classList.add("target"); m.classList.add("target"); lab.innerHTML=`<span style="color:var(--gold);font-size:16px">看板の札！</span>`; s.animate([{background:"#e8c27a55"},{background:"transparent"}],{duration:700,iterations:2}); }
      else lab.textContent=`${CARDS[cid].nm}　${"★".repeat(CARDS[cid].r)}`;
      setTimeout(startMatch,gl?2600:sig?2200:1400); },230);
  }
}

function guessHands(G,n){
  const m=G.h[0].filter(x=>x).length, pool=(typeof S!=="undefined"&&S)?owned():START.slice(), out=[];
  for(let k=0;k<n;k++){ const p=pool.slice(), h=[]; for(let j=0;j<m&&p.length;j++){ h.push(p.splice(Math.floor(Math.random()*p.length),1)[0]); } out.push(h); }
  return out;
}
function aiMove(G,depth){
  const ms=moves(G,1); let best=null,bv=-1e9;
  const hands=depth>1?guessHands(G,3):[G.h[0]];
  for(const [i,c] of ms){ let v=0; for(const h of hands){ const g={b:G.b,h:[h,G.h[1]]}; play(g,1,i,c,null); v+=search(g,0,depth-1,-1e9,1e9); } v=v/hands.length+Math.random()*0.6; if(v>bv){ bv=v; best=[i,c]; } }
  return best;
}

// ---------- 勝負の画面 ----------
let M=null;
function startMatch(){
  const k=P.k, first=Math.random()<0.5?0:1;
  M={k,G:{b:Array(9).fill(null),h:[P.mine.slice(),P.op.slice()],lost:[0,0]},turn:-1,sel:null,busy:true,
     wager:(P.target===null||P.loan)?null:{take:P.op[P.target],give:oppPick()},loan:P.loan,known:P.target};
  drawMatch(); tossOnBoard(first);
}
function tossOnBoard(first){
  const bd=document.querySelector(".board"); const ov=el("div","toss");
  ov.innerHTML=`<div class="coinwrap"><div class="coin3d ${first?'red':'blue'}"><div class="cf blue">先</div><div class="cf red">後</div></div></div><div class="tosstx"></div>`;
  bd.appendChild(ov);
  setTimeout(()=>{ ov.querySelector(".tosstx").textContent=first===0?"こちらの先攻":"相手の先攻"; ov.classList.add("done"); },1500);
  setTimeout(()=>{ ov.remove(); M.turn=first; M.busy=false; drawMatch(); if(first===1) setTimeout(aiTurn,400); },2600);
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
  top.appendChild(ow); top.appendChild(el("div","",`<b style="color:var(--opL)">${score(G,1)}</b>`)); s.appendChild(top);
  const or=el("div","row"); or.style.minHeight="70px";
  G.h[1].forEach((cid,i)=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:50px;height:65px"; or.appendChild(e); return; } if(i!==M.known){ or.appendChild(backEl(50,65)); return; } const c=cardEl(cid,"op",50,65); c.classList.add("target"); or.appendChild(c); });
  s.appendChild(or);
  const bd=el("div","frame board"); bd.style.gridTemplateColumns=`repeat(3,${D.cw}px)`;
  for(let i=0;i<9;i++){
    const ce=el("div","cell"); ce.style.width=D.cw+"px"; ce.style.height=D.ch+"px";
    const c=G.b[i];
    if(c){ const full=CARDS[c.cid].q||[]; const e=cardEl(c.cid,c.o===0?"me":"op",D.cw-4,D.ch-4,{n:c.n,shield:c.g,q:full,sealed:full.length&&!c.q.length}); if(fx&&fx[i]) e.classList.add(fx[i]); ce.appendChild(e); }
    else if(M.sel!==null&&M.turn===0&&!M.busy) ce.classList.add("can");
    ce.onclick=()=>{ if(M.busy||M.turn!==0||G.b[i]) return; if(M.sel===null){ return; } humanPlay(M.sel,i); };
    bd.appendChild(ce);
  }
  s.appendChild(bd);
  const info=el("div","info2",M.sel!==null?desc(G.h[0][M.sel]):(M.turn===1?"相手が考えている…":"")); s.appendChild(info);
  const mr=el("div","row"); mr.style.minHeight="96px";
  G.h[0].forEach((cid,i)=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:64px;height:84px"; mr.appendChild(e); return; } const c=cardEl(cid,"me",64,84); if(M.sel===i) c.classList.add("sel"); if(M.wager&&base(cid)===M.wager.give) c.classList.add("danger");
    c.onclick=()=>{ if(M.busy) return; M.sel=M.sel===i?null:i; drawMatch(); }; mr.appendChild(c); });
  s.appendChild(mr);
  const bt=el("div","score"); bt.appendChild(el("div","lbl",M.wager?"賭けの勝負":"賭けなし")); bt.appendChild(el("div","",`<b style="color:var(--meL)">${score(G,0)}</b>`)); s.appendChild(bt);
}
const EVNM={chainx:"連鎖！",combo:"同数・合計！",seal:"封印",curse:"祟り！",spite:"道連れ！",back:"執念で戻った！",grow:"成長",turn:"回転",debuff:"威圧"};
function animate(ev,done){
  // 番の始め（執念・成長） → 置く（回転） → 置いたとき・裏返る → 連鎖
  ev.forEach(e=>{ if(e.cell!==undefined&&M.G.b[e.cell]) S.seen[M.G.b[e.cell].cid]=1; });
  const steps=[], say=(list)=>{ const t=[...new Set(list.map(e=>e.t==="guard"?(e.wall?"鉄壁！":"踏ん張った！"):EVNM[e.t]).filter(Boolean))]; if(t.length) setTimeout(()=>toast(t.join("　")),50); };
  const pre=ev.filter(e=>e.lv===0), put=ev.filter(e=>e.t==="put"), l1=ev.filter(e=>e.lv===1), l2=ev.filter(e=>e.lv===2);
  if(pre.length) steps.push(()=>{ const fx={}; pre.forEach(e=>fx[e.cell]=e.t==="back"?"flip":"pop"); say(pre); return fx; });
  steps.push(()=>{ const fx={}; put.forEach(e=>fx[e.cell]="pop"); return fx; });
  if(l1.length) steps.push(()=>{ const fx={}; l1.forEach(e=>{ fx[e.cell]=e.t==="flip"||e.t==="spite"?"flip":"pop"; }); say(l1); return fx; });
  if(l2.length) steps.push(()=>{ const fx={}; l2.forEach(e=>{ fx[e.cell]=e.t==="flip"?"flip":"pop"; }); if(l2.some(e=>e.t==="flip")) l2.push({t:"chainx"}); say(l2); return fx; });
  let i=0; const next=()=>{ if(i>=steps.length){ done(); return; } const fx=steps[i++](); drawMatch(fx); setTimeout(next,i===1?300:480); }; next();
}
function humanPlay(hi,cell){
  M.busy=true; M.sel=null; const ev=[]; play(M.G,0,hi,cell,ev,true);
  animate(ev,()=>{ M.busy=false; endOrNext(1); });
}
function aiTurn(){
  M.busy=true; drawMatch();
  setTimeout(()=>{ const [hi,cell]=aiMove(M.G,OPPS[M.k].depth); const ev=[]; play(M.G,1,hi,cell,ev,true); animate(ev,()=>{ M.busy=false; endOrNext(0); }); },450);
}
function endOrNext(nextSide){
  if(M.G.b.every(x=>x)){ setTimeout(result,500); return; }
  M.turn=nextSide; drawMatch(); if(nextSide===1) setTimeout(aiTurn,500);
}
function result(){
  const st=S.op[M.k], me=score(M.G,0), op=score(M.G,1), win=me>op, draw=me===op;
  if(win){ st.won++; S.coin+=40; } else if(!draw) st.lost++;
  S.games=(S.games||0)+1; if(S.games%3===0) restock();
  let got=null,lost=null;
  if(M.wager&&!draw){
    if(win){ got=M.wager.take; const j=st.pool.indexOf(got); if(j>=0) st.pool.splice(j,1); S.col[got]=(S.col[got]||0)+1; S.seen[got]=1; }
    else { lost=M.wager.give; if(S.col[lost]){ S.col[lost]--; if(!S.col[lost]) delete S.col[lost]; } st.pool.push(lost); }
  }
  save();
  drawMatch();
  const v=el("div","veil");
  v.appendChild(el("div","big",win?"勝ち":draw?"引き分け":"負け"));
  v.appendChild(el("div","",`<span style="color:var(--meL);font-size:22px">${me}</span>　対　<span style="color:var(--opL);font-size:22px">${op}</span>`+(win?`　<span style="color:var(--gold)">◎+40</span>`:"")));
  if(got||lost){ const c=cardEl(got||lost,got?"me":"op",120,156); c.classList.add("flip"); v.appendChild(c); v.appendChild(el("div","",got?`${CARDS[got].nm}を手に入れた！`:`${CARDS[lost].nm}を取られた…`)); }
  else if(draw&&M.wager) v.appendChild(el("div","lbl","賭けた札は、どちらも動かない"));
  const r=el("div","row"); r.style.gap="10px";
  const a=el("button","btn gold","もう一勝負"); a.onclick=()=>prep(M.k);
  const b=el("button","btn","卓を離れる"); b.onclick=town;
  r.appendChild(a); r.appendChild(b); v.appendChild(r);
  document.querySelector(".screen").appendChild(v);
  setTimeout(()=>awards(),900);
}
// 限定の札：条件を満たしたら、まだ持っていなければ渡す
function awards(){
  const won=k=>S.op[k].won, kinds=Object.keys(S.col).length, glows=GLOWS.filter(g=>S.col[g]).length;
  const rules=[["L01",won(9)>=1],["L02",won(5)>=10],["L04",glows>=3],["L06",kinds>=150],["L07",won(4)>=10],["L08",won(2)>=10],["L09",(S.shigoro||0)>=3],["L10",OPPS.every((o,k)=>won(k)>=1)]];
  const due=rules.filter(([id,ok])=>ok&&!S.col[id]&&!S.gotL?.[id]).map(([id])=>id);
  if(!due.length) return;
  const id=due[0]; S.gotL=S.gotL||{}; S.gotL[id]=1; gain(id); reveal(id,"限定の札！",()=>awards());
}
load(); town();
window.__S=()=>S; window.__M=()=>M;
