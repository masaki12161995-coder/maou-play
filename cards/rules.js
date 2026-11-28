// ---------- 勝負の決まり（30の癖） ----------
// 盤の札： {cid,o:持ち主,n:[上,右,下,左],q:[癖],g:踏ん張り,w:鉄壁の辺,gr:成長した数,sp:道連れ,rv:執念,rb:戻る先,home}
// G = {b:[9], h:[[自分の手札],[相手の手札]], lost:[取られた数,取られた数]}
const NB=[[-1,0,0,2],[0,1,1,3],[1,0,2,0],[0,-1,3,1]]; // [dy,dx,自分の辺,相手の辺]  上・右・下・左
const DG=[[-1,-1],[-1,1],[1,-1],[1,1]];
const CORNER=[0,2,6,8];
const cl=v=>Math.max(1,Math.min(10,v));
function qs(cid){ const q=CARDS[cid].q; return q?q:[]; }
function has(x,q){ return (x.q||[]).includes(q); }
function adj(cell){ const y=Math.floor(cell/3),x=cell%3,o=[]; for(const [dy,dx,mi,ti] of NB){ const ny=y+dy,nx=x+dx; if(ny<0||ny>2||nx<0||nx>2) continue; o.push([ny*3+nx,mi,ti]); } return o; }
function diag(cell){ const y=Math.floor(cell/3),x=cell%3,o=[]; for(const [dy,dx] of DG){ const ny=y+dy,nx=x+dx; if(ny<0||ny>2||nx<0||nx>2) continue; o.push(ny*3+nx); } return o; }
function cnt(G,side){ return G.b.filter(c=>c&&c.o===side).length; }
// 点数：盤の自分の色の札＋手札に残った札（後攻は1枚残るので、5対5になる）
function score(G,side){ return cnt(G,side)+G.h[side].filter(x=>x).length; }
function fam(cid){ return CARDS[cid].fam||null; }

// 置くときの数字（場所・流れの癖）
function eff(cid,cell,G,side,real){
  const c=CARDS[cid], q=qs(cid); let n=c.n.slice(), add=0;
  const empty=G.b.filter(x=>!x).length;
  if(q.includes("corner")&&CORNER.includes(cell)) add+=1;
  if(q.includes("center")&&cell===4) add+=2;
  if(q.includes("edge")&&!CORNER.includes(cell)&&cell!==4) add+=1;
  if(q.includes("lone")&&!adj(cell).some(([t])=>G.b[t]&&G.b[t].o===side)) add+=2;
  if(q.includes("pack")) add+=Math.min(3,cnt(G,side));
  if(q.includes("early")&&empty>=7) add+=2;
  if(q.includes("late")&&empty<=3) add+=2;
  if(q.includes("under")&&cnt(G,side)<cnt(G,1-side)) add+=2;
  if(q.includes("rage")) add+=Math.min(3,(G.lost||[0,0])[side]);
  if(q.includes("kin")&&fam(cid)&&G.b.some(x=>x&&x.o===side&&fam(x.cid)===fam(cid))) add+=2;
  n=n.map(v=>cl(v+add));
  if(q.includes("gamble")) n=n.map(v=>cl(v+(real?1+Math.floor((typeof RULE_RNG==="function"?RULE_RNG:Math.random)()*4):2))); // 友だち対戦では、両方の端末で同じ目が出るよう、そろえた乱数を使う
  return n;
}
// 守護：隣の味方の数だけ＋1
function val(G,cell,i){
  const c=G.b[cell]; let v=c.n[i];
  for(const [t] of adj(cell)){ const w=G.b[t]; if(w&&w.o===c.o&&has(w,"ward")) v++; }
  return v;
}
function setc(G,t,o){ G.b[t]=o; }

// 1枚を裏返す（鉄壁・踏ん張り・祟り・道連れ・執念）
function flipOne(G,t,side,from,ev,lv,dir){
  const tc=G.b[t];
  if(dir!==undefined&&tc.w===dir){ if(ev) ev.push({t:"guard",cell:t,lv,wall:1}); return false; }
  if(tc.g){ setc(G,t,{...tc,g:false}); if(ev) ev.push({t:"guard",cell:t,lv}); return false; }
  const prev=tc.o;
  const nt={...tc,o:side};
  if(tc.rv){ nt.rb=prev; }
  setc(G,t,nt); G.lost[prev]++;
  if(ev) ev.push({t:"flip",cell:t,side,lv});
  const me=G.b[from];
  if(me&&has(tc,"curse")){ setc(G,from,{...G.b[from],n:G.b[from].n.map(v=>cl(v-2))}); if(ev) ev.push({t:"curse",cell:from,lv}); }
  if(me&&tc.sp&&G.b[from].o===side){ setc(G,from,{...G.b[from],o:prev}); setc(G,t,{...G.b[t],sp:false}); G.lost[side]++; if(ev) ev.push({t:"spite",cell:from,side:prev,lv}); }
  return true;
}
// となりと比べる
function attack(G,cell,side,ev,lv,tie){
  const out=[];
  for(const [t,mi,ti] of adj(cell)){
    const me=G.b[cell]; if(!me||me.o!==side) break;
    const tc=G.b[t]; if(!tc||tc.o===side) continue;
    const a=val(G,cell,mi), d=val(G,t,ti), rev=has(me,"rev");
    const win=rev?(a<d||(tie&&a===d)):(a>d||(tie&&a===d));
    if(win&&flipOne(G,t,side,cell,ev,lv,ti)) out.push(t);
  }
  return out;
}
// 置いて裏返せる数（回転の向きを決めるため）
function countFlips(G,cell,side,n,tie,rev){
  let k=0;
  for(const [t,mi,ti] of adj(cell)){ const tc=G.b[t]; if(!tc||tc.o===side) continue;
    const d=val(G,t,ti), a=n[mi]; if(rev?(a<d||(tie&&a===d)):(a>d||(tie&&a===d))) k++; }
  return k;
}
function play(G,side,hi,cell,ev,real){
  G.b=G.b.slice(); G.h=[G.h[0],G.h[1]]; G.lost=(G.lost||[0,0]).slice();
  // 自分の番の始め：執念で戻る札
  G.b.forEach((c,t)=>{ if(c&&c.rb===side&&c.o!==side){ setc(G,t,{...c,o:side,rb:undefined,rv:false}); if(ev) ev.push({t:"back",cell:t,side,lv:0}); } });
  // 相手の成長する札が育つ
  G.b.forEach((c,t)=>{ if(c&&c.o!==side&&has(c,"grow")&&(c.gr||0)<3){ setc(G,t,{...c,n:c.n.map(v=>cl(v+1)),gr:(c.gr||0)+1}); if(ev) ev.push({t:"grow",cell:t,lv:0}); } });
  const cid=G.h[side][hi]; G.h[side]=G.h[side].slice(); G.h[side][hi]=null;
  const q=qs(cid); let n=eff(cid,cell,G,side,real);
  const tie=q.includes("tie")||q.includes("king"), rev=q.includes("rev");
  if(q.includes("turn")){ let best=n,bk=-1; for(let r=0;r<4;r++){ const m=[0,1,2,3].map(i=>n[(i-r+4)%4]); const k=countFlips(G,cell,side,m,tie,rev); if(k>bk){ bk=k; best=m; } } if(best!==n&&ev) ev.push({t:"turn",cell,lv:0}); n=best; }
  const pc={cid,o:side,n,q:q.slice(),g:q.includes("guard"),w:q.includes("wall")?n.indexOf(Math.max(...n)):-1,sp:q.includes("spite"),rv:q.includes("revive"),home:side};
  setc(G,cell,pc); if(ev) ev.push({t:"put",cell,side});
  // 置いたとき
  for(const [t] of adj(cell)){ const tc=G.b[t]; if(!tc) continue;
    if(q.includes("cheer")&&tc.o===side){ setc(G,t,{...tc,n:tc.n.map(v=>cl(v+1))}); if(ev) ev.push({t:"buff",cell:t,lv:1}); }
    if(q.includes("awe")&&tc.o!==side){ setc(G,t,{...G.b[t],n:G.b[t].n.map(v=>cl(v-1))}); if(ev) ev.push({t:"debuff",cell:t,lv:1}); }
    if(q.includes("seal")&&tc.o!==side&&(G.b[t].q||[]).length){ setc(G,t,{...G.b[t],q:[],g:false,w:-1,sp:false,rv:false,rb:undefined}); if(ev) ev.push({t:"seal",cell:t,lv:1}); }
  }
  let flipped=[];
  // 同数・合計
  if(q.includes("same")||q.includes("plus")){
    const ns=adj(cell).filter(([t])=>G.b[t]&&G.b[t].o!==side).map(([t,mi,ti])=>({t,a:G.b[cell].n[mi],d:val(G,t,ti),ti}));
    const hit=new Set();
    if(q.includes("same")){ const s=ns.filter(x=>x.a===x.d); if(s.length>=2) s.forEach(x=>hit.add(x.t)); }
    if(q.includes("plus")){ const sums={}; ns.forEach(x=>{ (sums[x.a+x.d]=sums[x.a+x.d]||[]).push(x); }); Object.values(sums).forEach(g=>{ if(g.length>=2) g.forEach(x=>hit.add(x.t)); }); }
    for(const t of hit){ if(G.b[t].o!==side&&flipOne(G,t,side,cell,ev,1)) { flipped.push(t); if(ev) ev.push({t:"combo",cell:t,lv:1}); } }
  }
  flipped=flipped.concat(attack(G,cell,side,ev,1,tie));
  // 斜め打ち
  if(q.includes("diag")&&G.b[cell].o===side){ for(const t of diag(cell)){ const tc=G.b[t]; if(!tc||tc.o===side) continue;
    const a=Math.max(...G.b[cell].n), d=Math.min(...tc.n); if(a>d||(tie&&a===d)){ if(flipOne(G,t,side,cell,ev,1)) flipped.push(t); } } }
  // 連鎖・王威
  if(q.includes("chain")||q.includes("king")) flipped.slice().forEach(fc=>{ if(G.b[fc].o===side) flipped=flipped.concat(attack(G,fc,side,ev,2,tie)); });
  // 吸収
  if(q.includes("drain")&&flipped.length&&G.b[cell].o===side){ setc(G,cell,{...G.b[cell],n:G.b[cell].n.map(v=>cl(v+flipped.length))}); if(ev) ev.push({t:"buff",cell,lv:2}); }
  return flipped.length;
}

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
  if(full) return (score(G,1)-score(G,0))*100;
  if(d===0) return evalG(G);
  const ms=moves(G,side); if(!ms.length) return evalG(G);
  if(side===1){ let v=-1e9; for(const [i,c] of ms){ const g={b:G.b,h:[G.h[0],G.h[1]],lost:G.lost}; play(g,1,i,c,null); v=Math.max(v,search(g,0,d-1,a,b)); a=Math.max(a,v); if(a>=b) break; } return v; }
  let v=1e9; for(const [i,c] of ms){ const g={b:G.b,h:[G.h[0],G.h[1]],lost:G.lost}; play(g,0,i,c,null); v=Math.min(v,search(g,1,d-1,a,b)); b=Math.min(b,v); if(a>=b) break; } return v;
}
if(typeof module!=="undefined") module.exports={play,search,evalG,moves,cnt,score,eff,adj};
