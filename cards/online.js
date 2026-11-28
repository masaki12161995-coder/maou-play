"use strict";
// ===== 札の卓　友だち対戦 =====
// 240枚の札から、お互いでたらめに5枚。引き直しは1回だけ。お互いの手札は見えない。
// つなぎ方：合言葉（部屋の名前）ごとに、ntfy.sh の公開の通り道を使って、短い知らせをやりとりする（自分たちのサーバーは要らない）。
//   ?local=1 のときは、同じブラウザの中だけでつなぐ（試し用）
const RARE=["","#cfcfcf","#56b35a","#4a90e2","#a66ad8","#e8b93c","#fff"];
const KIND_NM={"魔物":"魔物の札","色違い":"色違いの札","光る":"光る札","人物":"人物の札","限定":"限定の札"};
const ALL=Object.keys(CARDS);
const Q=new URLSearchParams(location.search), LOCAL=Q.get("local")==="1";
const ME_ID=Math.random().toString(36).slice(2,10);

// ---------- 小さな道具 ----------
const $app=document.getElementById("app");
const N=v=>v>=10?"A":String(v);
function el(tag,cls,html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }
function screen(){ $app.innerHTML=""; const s=el("div","screen"); $app.appendChild(s); return s; }
function toast(t){ const e=el("div","toast"); e.textContent=t; (document.querySelector(".screen")||document.body).appendChild(e); setTimeout(()=>e.remove(),1300); }
function desc(cid){ const c=CARDS[cid]; return `${c.nm}　${"★".repeat(c.r)}`+(c.q?"　"+c.q.map(k=>`${QK[k].nm}：${QK[k].ds}`).join("　"):""); }
function cardEl(cid,owner,w,h,o={}){
  const c=CARDS[cid], d=document.createElement("div");
  d.className="card "+owner; d.style.width=w+"px"; d.style.height=h+"px";
  const nums=o.n||c.n, q=o.q||c.q||[], fs=Math.max(11,Math.round(w*0.19));
  const [iw,ih]=IMG[c.im], bw=w*0.88, bh=h*0.66;
  const fit=iw<=bw&&ih<=bh, sc=fit?Math.max(1,Math.floor(Math.min(bw/iw,bh/ih))):(iw>bw*1.7&&ih>bh*1.3?0.5:1);
  const top=ih*sc<=bh?(bh-ih*sc)/2:0;
  d.innerHTML=`<div class="face"></div>
   <div class="art"><img src="img/c/${c.im}.png" style="width:${iw*sc}px;height:${ih*sc}px;top:${top}px"></div>
   <div class="stars">★${c.r}</div><div class="shield"></div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;top:${Math.round(h*0.03)}px">${N(nums[0])}</div>
   <div class="n" style="font-size:${fs}px;right:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[1])}</div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;bottom:${q.length?Math.round(h*(q.length>1?0.25:0.155)):Math.round(h*0.04)}px">${N(nums[2])}</div>
   <div class="n" style="font-size:${fs}px;left:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[3])}</div>
   ${q.length?`<div class="qk" style="font-size:${Math.max(9,Math.round(w*(q.length>1?0.12:0.14)))}px;line-height:1.15">${q.map(k=>QK[k].nm).join("<br>")}</div>`:""}`;
  d.style.borderColor=RARE[Math.min(6,c.r)]; d.style.borderWidth=c.r>=5?"3px":"2px"; if(c.r>=6) d.classList.add("r6"); if(c.glow) d.classList.add("glow");
  if(o.shield) d.classList.add("shielded"); if(o.sealed) d.classList.add("sealed");
  holdToShow(d,cid);
  return d;
}
function backEl(w,h){ const d=el("div","card back"); d.style.width=w+"px"; d.style.height=h+"px"; d.innerHTML='<div class="bk"></div>'; return d; }
// 長押しで、札をくわしく見る
let HOLD=null, EAT=false;
function holdToShow(d,cid){
  const start=()=>{ clearTimeout(HOLD); HOLD=setTimeout(()=>{ EAT=true; detail(cid); },420); }, stop=()=>clearTimeout(HOLD);
  d.addEventListener("pointerdown",start); d.addEventListener("pointerup",stop); d.addEventListener("pointerleave",stop); d.addEventListener("pointercancel",stop);
  d.addEventListener("contextmenu",e=>e.preventDefault());
}
document.addEventListener("click",e=>{ if(EAT){ EAT=false; e.stopPropagation(); e.preventDefault(); } },true);
function detail(cid){
  const c=CARDS[cid], v=el("div","veil"); v.style.zIndex=40;
  const k=cardEl(cid,"nb",150,196); k.classList.add("pop"); v.appendChild(k);
  v.appendChild(el("div","",`<div style="font-size:20px;font-weight:700;text-align:center">${c.nm}</div><div style="text-align:center;color:${c.r>=6?"#ffe08a":RARE[c.r]};letter-spacing:2px">${"★".repeat(c.r)}</div>`));
  const q=el("div","frame",""); q.style.cssText+="padding:10px 14px;max-width:320px;text-align:center;line-height:1.6";
  q.innerHTML=`<div style="font-size:12px;color:var(--sub);margin-bottom:4px">${KIND_NM[c.k]||""}</div>`+(c.q?c.q.map(k=>`<div style="color:var(--gold);font-size:16px;font-weight:700">${QK[k].nm}</div><div style="font-size:14px;margin-bottom:4px">${QK[k].ds}</div>`).join(""):`<div style="font-size:14px;color:var(--sub)">くせなし</div>`);
  v.appendChild(q); v.onclick=()=>v.remove(); (document.querySelector(".screen")||document.body).appendChild(v);
}
// そろえた乱数（両方の端末で同じ順に同じ目が出る）
function mulberry(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function deal5(){ const p=ALL.slice(), h=[]; for(let i=0;i<5;i++) h.push(p.splice(Math.floor(Math.random()*p.length),1)[0]); return h; }

// ---------- つなぐ ----------
// 知らせ：{r:部屋, u:送った人, n:通し番号, t:種類, ...}。自分の知らせと、もう受けた知らせは無視する
let NET=null, SEQ=0;
const SEEN=new Set();
function connect(room,onMsg){
  const handle=m=>{ if(!m||m.r!==room||m.u===ME_ID) return; const k=m.u+":"+m.n; if(SEEN.has(k)) return; SEEN.add(k); onMsg(m); };
  if(LOCAL){
    const bc=new BroadcastChannel("fuda-"+room); bc.onmessage=e=>handle(e.data);
    return { send:m=>bc.postMessage(m), close:()=>bc.close() };
  }
  const topic="maoufuda-"+room.toLowerCase(), base="https://ntfy.sh/"+topic;
  let es=null, last="15m", closed=false;
  const open=()=>{ if(closed) return; es=new EventSource(`${base}/sse?since=${last}`);
    es.onmessage=e=>{ try{ const d=JSON.parse(e.data); if(d.event&&d.event!=="message") return; if(d.id) last=d.id; handle(JSON.parse(d.message)); }catch(_){} };
    es.onerror=()=>{ try{ es.close(); }catch(_){} setTimeout(open,1500); }; };
  open();
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&!closed){ try{ es.close(); }catch(_){} open(); } }); // 画面に戻ったら、つなぎ直して取りこぼしを受ける
  const send=(m,tries=0)=>fetch(base,{method:"POST",body:JSON.stringify(m)}).then(r=>{ if(!r.ok) throw 0; }).catch(()=>{ if(tries<4) setTimeout(()=>send(m,tries+1),800*(tries+1)); else toast("つながりが悪い…"); });
  return { send, close:()=>{ closed=true; try{ es.close(); }catch(_){} } };
}
function post(t,extra={}){ const m={r:R.room,u:ME_ID,n:++SEQ,t,...extra}; NET.send(m); }

// ---------- 部屋 ----------
// R：部屋の様子。host＝部屋を作った人（盤では0の側）。G：盤と手札（0＝部屋を作った人、1＝入った人）
let R=null, M=null;
function newRoom(room,host){
  if(NET) NET.close();
  R={room,host,side:host?0:1,peer:false,game:0,again:[false,false],first:0,seed:0};
  NET=connect(room,onMsg);
  post("hi");
  if(host) waitRoom(); else joining();
  clearInterval(R.ping); R.ping=setInterval(()=>{ if(!R.peer) post("hi"); },10000);   // 相手が来るまで、ときどき呼ぶ（通り道の回数の決まりをこえないよう、間をあける）
}
function code6(){ const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s=""; for(let i=0;i<6;i++) s+=A[Math.floor(Math.random()*A.length)]; return s; }
function onMsg(m){
  if(m.t==="hi"){ if(!R.peer){ R.peer=true; post("hi"); if(R.host) setTimeout(()=>startGame(),300); } return; }
  if(m.t==="start"&&!R.host){ R.peer=true; beginDeal(m.seed,m.first,m.game); return; }
  if(m.t==="ready"&&M&&m.game===M.game){ M.opReady=true; if(M.meReady) goMatch(); else drawDeal(); return; }
  if(m.t==="mv"&&M&&m.game===M.game){ M.inbox[m.k]=m; pump(); return; }
  if(m.t==="again"&&M){ R.again[1-R.side]=true; if(R.again[R.side]&&R.host) startGame(); else if(M.over) drawResult(); return; }
  if(m.t==="bye"){ R.peer=false; toast("相手が卓を離れた"); setTimeout(()=>lobby(),1400); }
}
function startGame(){ // 部屋を作った人が、そろえた乱数の種と先攻を決めて知らせる
  R.game++; R.again=[false,false];
  const seed=Math.floor(Math.random()*2**31), first=Math.random()<0.5?0:1;
  post("start",{seed,first,game:R.game}); beginDeal(seed,first,R.game);
}

// ---------- 画面：入口 ----------
function lobby(){
  if(NET){ try{ post("bye"); }catch(_){} NET.close(); NET=null; } if(R) clearInterval(R.ping); R=null; M=null;
  history.replaceState(null,"",location.pathname+(LOCAL?"?local=1":""));
  const s=screen(); const box=el("div","lobby");
  box.appendChild(el("div","logo","札の卓<small>友だち対戦</small>"));
  const row=el("div","row"); row.style.cssText+="gap:10px;margin-top:6px";
  for(let i=0;i<5;i++){ const b=backEl(46,60); b.style.transform=`rotate(${(i-2)*7}deg) translateY(${Math.abs(i-2)*4}px)`; row.appendChild(b); }
  box.appendChild(row);
  const mk=el("button","btn gold","部屋をつくる"); mk.style.cssText+="width:230px;font-size:18px"; mk.onclick=()=>newRoom(code6(),true);
  box.appendChild(mk);
  const inp=el("input","inp"); inp.maxLength=6; inp.placeholder="合言葉"; inp.autocapitalize="characters"; inp.autocomplete="off"; inp.spellcheck=false;
  const go=el("button","btn","部屋に入る"); go.style.cssText+="width:230px;font-size:18px";
  go.onclick=()=>{ const c=(inp.value||"").toUpperCase().replace(/[^A-Z0-9]/g,""); if(c.length!==6){ toast("合言葉は6文字"); return; } newRoom(c,false); };
  inp.addEventListener("keydown",e=>{ if(e.key==="Enter") go.onclick(); });
  box.appendChild(inp); box.appendChild(go);
  s.appendChild(box);
}
function waitRoom(){
  const s=screen(); const box=el("div","lobby");
  box.appendChild(el("div","lbl","合言葉"));
  box.appendChild(el("div","code",R.room));
  const url=location.origin+location.pathname+"?r="+R.room+(LOCAL?"&local=1":"");
  const sh=el("button","btn gold","友だちに送る"); sh.style.cssText+="width:230px;font-size:18px";
  sh.onclick=async()=>{ const text=`札の卓で勝負しよう。合言葉は ${R.room}`; try{ if(navigator.share){ await navigator.share({title:"札の卓",text,url}); return; } }catch(_){ return; } try{ await navigator.clipboard.writeText(text+"\n"+url); toast("写した"); }catch(_){ toast(url); } };
  box.appendChild(sh);
  box.appendChild(el("div","st dots3","相手を待っている"));
  const bk=el("button","btn","やめる"); bk.style.cssText+="width:230px"; bk.onclick=lobby; box.appendChild(bk);
  s.appendChild(box);
}
function joining(){
  const s=screen(); const box=el("div","lobby");
  box.appendChild(el("div","lbl","合言葉")); box.appendChild(el("div","code",R.room));
  box.appendChild(el("div","st dots3","部屋につないでいる"));
  const bk=el("button","btn","やめる"); bk.style.cssText+="width:230px"; bk.onclick=lobby; box.appendChild(bk);
  s.appendChild(box);
}

// ---------- 画面：手札を配る（引き直しは1回） ----------
function beginDeal(seed,first,game){
  R.seed=seed; R.first=first; R.game=game; R.again=[false,false];
  M={game,mine:deal5(),redrawn:false,meReady:false,opReady:false,G:null,turn:-1,sel:null,busy:true,inbox:{},k:0,over:false};
  drawDeal();
}
function drawDeal(){
  const s=screen();
  const bar=el("div","bar"); bar.appendChild(el("div","title","手札")); const x=el("button","btn back","✕"); x.onclick=()=>{ if(confirm("卓を離れる？")) lobby(); }; bar.appendChild(x); s.appendChild(bar);
  const op=el("div","panel op"); const oh=el("div","phead"); oh.appendChild(el("div","","相手の手札")); oh.appendChild(el("div","",M.opReady?"支度できた":"考えている")); op.appendChild(oh);
  const orow=el("div","row"); for(let i=0;i<5;i++) orow.appendChild(backEl(54,70)); op.appendChild(orow); s.appendChild(op);
  const mid=el("div","vsmid"); mid.style.cssText+="flex:0 0 auto;padding:2px 0"; mid.innerHTML=`<div class="vs">VS</div>`; s.appendChild(mid);
  const me=el("div","panel me"); const mh=el("div","phead"); mh.appendChild(el("div","","こちらの手札")); mh.appendChild(el("div","lbl",`★${M.mine.reduce((a,c)=>a+CARDS[c].r,0)}`)); me.appendChild(mh);
  const hand=el("div","hand5"); const W=Math.min(440,$app.clientWidth)-40, cw=Math.min(104,Math.floor((W-24)/3)), ch=Math.round(cw*1.3); hand.style.cssText=`max-width:${cw*3+24}px;margin:0 auto`;   // 大きく、3枚と2枚の2段で
  M.mine.forEach((cid,i)=>{ const c=cardEl(cid,"me",cw,ch); c.onclick=()=>{ info.textContent=desc(cid); }; if(M.fresh){ c.classList.add("flip"); } hand.appendChild(c); });
  M.fresh=false;
  me.appendChild(hand); s.appendChild(me);
  const info=el("div","info2",""); s.appendChild(info);
  const btns=el("div","row"); btns.style.cssText+="gap:10px;margin-top:auto;padding-bottom:6px";
  if(!M.meReady){
    const rd=el("button","btn"+(M.redrawn?" dim":""),M.redrawn?"引き直した":"引き直す"); rd.style.cssText+="width:150px";
    rd.onclick=()=>{ if(M.redrawn) return; M.redrawn=true; M.mine=deal5(); M.fresh=true; drawDeal(); };
    const ok=el("button","btn gold","これで勝負"); ok.style.cssText+="width:150px";
    ok.onclick=()=>{ M.meReady=true; post("ready",{game:M.game}); if(M.opReady) goMatch(); else drawDeal(); };
    btns.appendChild(rd); btns.appendChild(ok);
  } else btns.appendChild(el("div","st dots3","相手の支度を待っている"));
  s.appendChild(btns);
}

// ---------- 画面：勝負 ----------
function goMatch(){
  const me=R.side, op=1-me;
  const h=[null,null]; h[me]=M.mine.slice(); h[op]=["?","?","?","?","?"];   // 相手の札は、置かれるまで分からない
  M.G={b:Array(9).fill(null),h,lost:[0,0]}; M.turn=-1; M.busy=true; M.k=0;
  window.RULE_RNG=mulberry(R.seed);
  drawMatch();
  const bd=document.querySelector(".board"), ov=el("div","toss"), meFirst=R.first===me;
  ov.innerHTML=`<div class="coinwrap"><div class="coin3d ${meFirst?'blue':'red'}"><div class="cf blue">先</div><div class="cf red">後</div></div></div><div class="tosstx"></div>`;
  bd.appendChild(ov);
  setTimeout(()=>{ ov.querySelector(".tosstx").textContent=meFirst?"こちらの先攻":"相手の先攻"; },1500);
  setTimeout(()=>{ ov.remove(); M.turn=R.first; M.busy=false; drawMatch(); pump(); },2600);
}
function dims(){
  const H=$app.clientHeight, W=Math.min(440,$app.clientWidth);
  let ch=Math.min(150,(H-330)/3), cw=Math.round(ch/1.27);
  if(cw*3+24>W-20){ cw=Math.floor((W-44)/3); ch=Math.round(cw*1.27); }
  return {cw:Math.floor(cw),ch:Math.floor(ch)};
}
function drawMatch(fx){
  const s=screen(), G=M.G, D=dims(), me=R.side, op=1-me;
  const top=el("div","score"); top.appendChild(el("div","",`<span style="font-size:14px">相手</span>`)); top.appendChild(el("div","",`<b style="color:var(--opL)">${score(G,op)}</b>`)); s.appendChild(top);
  const or=el("div","row"); or.style.minHeight="70px";
  G.h[op].forEach(cid=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:50px;height:65px"; or.appendChild(e); return; } or.appendChild(backEl(50,65)); });
  s.appendChild(or);
  const bd=el("div","frame board"); bd.style.gridTemplateColumns=`repeat(3,${D.cw}px)`;
  for(let i=0;i<9;i++){
    const ce=el("div","cell"); ce.style.width=D.cw+"px"; ce.style.height=D.ch+"px";
    const c=G.b[i];
    if(c){ const full=CARDS[c.cid].q||[]; const e=cardEl(c.cid,c.o===me?"me":"op",D.cw-4,D.ch-4,{n:c.n,shield:c.g,q:full,sealed:full.length&&!c.q.length}); if(fx&&fx[i]) e.classList.add(fx[i]); ce.appendChild(e); }
    else if(M.sel!==null&&M.turn===me&&!M.busy) ce.classList.add("can");
    ce.onclick=()=>{ if(M.busy||M.turn!==me||G.b[i]||M.sel===null) return; myPlay(M.sel,i); };
    bd.appendChild(ce);
  }
  s.appendChild(bd);
  const tb=el("div","turnbar "+(M.turn===me?"me":"op"),M.turn<0?"":M.turn===me?"こちらの番":"相手の番"); if(M.turn!==me&&M.turn>=0) tb.classList.add("dots3"); s.appendChild(tb);
  s.appendChild(el("div","info2",M.sel!==null?desc(G.h[me][M.sel]):""));
  const mr=el("div","row"); mr.style.minHeight="96px";
  G.h[me].forEach((cid,i)=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:64px;height:84px"; mr.appendChild(e); return; } const c=cardEl(cid,"me",64,84); if(M.sel===i) c.classList.add("sel");
    c.onclick=()=>{ if(M.busy) return; M.sel=M.sel===i?null:i; drawMatch(); }; mr.appendChild(c); });
  s.appendChild(mr);
  const bt=el("div","score"); bt.appendChild(el("div","lbl","友だち対戦")); bt.appendChild(el("div","",`<b style="color:var(--meL)">${score(G,me)}</b>`)); s.appendChild(bt);
}
const EVNM={chainx:"連鎖！",combo:"同数・合計！",seal:"封印",curse:"祟り！",spite:"道連れ！",back:"執念で戻った！",grow:"成長",turn:"回転",debuff:"威圧"};
function animate(ev,done){
  const steps=[], say=(list)=>{ const t=[...new Set(list.map(e=>e.t==="guard"?(e.wall?"鉄壁！":"踏ん張った！"):EVNM[e.t]).filter(Boolean))]; if(t.length) setTimeout(()=>toast(t.join("　")),50); };
  const pre=ev.filter(e=>e.lv===0), put=ev.filter(e=>e.t==="put"), l1=ev.filter(e=>e.lv===1), l2=ev.filter(e=>e.lv===2);
  if(pre.length) steps.push(()=>{ const fx={}; pre.forEach(e=>fx[e.cell]=e.t==="back"?"flip":"pop"); say(pre); return fx; });
  steps.push(()=>{ const fx={}; put.forEach(e=>fx[e.cell]="pop"); return fx; });
  if(l1.length) steps.push(()=>{ const fx={}; l1.forEach(e=>{ fx[e.cell]=e.t==="flip"||e.t==="spite"?"flip":"pop"; }); say(l1); return fx; });
  if(l2.length) steps.push(()=>{ const fx={}; l2.forEach(e=>{ fx[e.cell]=e.t==="flip"?"flip":"pop"; }); if(l2.some(e=>e.t==="flip")) l2.push({t:"chainx"}); say(l2); return fx; });
  let i=0; const next=()=>{ if(i>=steps.length){ done(); return; } const fx=steps[i++](); drawMatch(fx); setTimeout(next,i===1?300:480); }; next();
}
// 自分の番：置いた札と場所を知らせてから、盤に置く（相手の端末でも、同じ順に同じことが起きる）
function myPlay(hi,cell){
  const me=R.side, cid=M.G.h[me][hi];
  M.busy=true; M.sel=null; post("mv",{game:M.game,k:M.k,hi,cid,cell});
  apply(me,hi,cid,cell);
}
// 相手の手：届いた順ではなく、手の番号の順に置く
function pump(){
  if(!M||!M.G||M.busy||M.turn!==1-R.side) return;
  const m=M.inbox[M.k]; if(!m) return; delete M.inbox[M.k];
  M.busy=true; apply(1-R.side,m.hi,m.cid,m.cell);
}
function apply(side,hi,cid,cell){
  M.G.h[side]=M.G.h[side].slice(); M.G.h[side][hi]=cid; M.k++;
  const ev=[]; play(M.G,side,hi,cell,ev,true);
  animate(ev,()=>{ M.busy=false; const nx=1-side;
    if(M.G.b.every(x=>x)||!M.G.h[nx].some(x=>x)){ setTimeout(()=>{ M.over=true; drawResult(); },500); return; }
    M.turn=nx; drawMatch(); pump(); });
}
function drawResult(){
  drawMatch(); const me=R.side, a=score(M.G,me), b=score(M.G,1-me), win=a>b, draw=a===b;
  const v=el("div","veil");
  v.appendChild(el("div","big",win?"勝ち":draw?"引き分け":"負け"));
  v.appendChild(el("div","",`<span style="color:var(--meL);font-size:22px">${a}</span>　対　<span style="color:var(--opL);font-size:22px">${b}</span>`));
  const r=el("div","row"); r.style.gap="10px";
  if(R.again[me]) r.appendChild(el("div","st dots3",R.again[1-me]?"配っている":"相手を待っている"));
  else { const a2=el("button","btn gold",R.again[1-me]?"もう一勝負（相手は待っている）":"もう一勝負"); a2.style.cssText+="width:auto";
    a2.onclick=()=>{ R.again[me]=true; post("again"); if(R.again[1-me]&&R.host) startGame(); else drawResult(); };
    r.appendChild(a2); }
  const b2=el("button","btn","やめる"); b2.onclick=lobby; r.appendChild(b2);
  v.appendChild(r);
  document.querySelector(".screen").appendChild(v);
}

// ---------- はじめ ----------
(()=>{ const r=(Q.get("r")||"").toUpperCase().replace(/[^A-Z0-9]/g,""); if(r.length===6) newRoom(r,false); else lobby(); })();
