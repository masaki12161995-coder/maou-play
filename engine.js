// ===== エンジン：状態・セーブ・能力値・装備生成・マップ・描画・入力・会話 =====
const $ = id => document.getElementById(id);
const cv = $('cv'), cx = cv.getContext('2d'), CX0 = cx;
let VW=352, VH=600, VS=1;   // 画面の広さ（ドット）と、1ドットあたりの点の数
const TS = 32; // タイルの描画サイズ
let G = null;            // セーブされる状態
const RT = {mode:'title', map:null, moving:null, dir:null, busy:false, trail:[], anim:0, encounterIn:20, worldSel:null, lastSaveBlocked:false};
const sleep = ms => (typeof SIM!=='undefined' && SIM.on) ? Promise.resolve() : new Promise(r=>setTimeout(r,ms));
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const rnd = (a,b)=>a+Math.random()*(b-a);
const ri = (a,b)=>Math.floor(rnd(a,b+1));
const pick = a => a[Math.floor(Math.random()*a.length)];
function hashStr(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
// 中身を「この周で1回だけ」決める：key ごとに決まった乱数で fn を実行
function withRunSeed(key, fn){ if(G.runSeed===undefined) G.runSeed=(Math.random()*2**31)|0; const R=Math.random; Math.random=mulberry((G.runSeed ^ hashStr(key))>>>0); try{ return fn(); } finally{ Math.random=R; } }
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}

// ---------- メタ情報（セーブとは別に残る） ----------
function loadMeta(){try{return JSON.parse(kvGet('mzy_meta'))||{};}catch(e){return {};}}
function saveMeta(m){try{kvSet('mzy_meta',JSON.stringify(m));}catch(e){}}
let META = loadMeta();

// ---------- 新しいゲーム ----------
function newGame(){
  G = {v:1, chapter:0, loc:'sora', floor:0, x:0, y:0, dir:'down', flags:{}, unlocked:['sora'], visited:{}, gold:60,
       members:{}, party:[], inv:{herb:6}, gear:[], mat:0, mats:{}, steps:0, holy:0, obj:'', frag:0, time:0,
       settings:{speed:1, v2:1, auto:false, autosell:[false,false], sound:true}, elemUse:{}, nid:1, runSeed:(Math.random()*2**31)|0};
  addMember('アルト', 1); addMember('リリィ', 1);
  G.party = ['アルト','リリィ'];
  // 初期装備
  equip('アルト', makeItem('weapon',1,0,'p',{ty:FAV['アルト']}));
  equip('アルト', makeItem('body',1,0,undefined,{mei:false}));
  equip('リリィ', makeItem('weapon',1,0,'m',{ty:FAV['リリィ']}));
  equip('リリィ', makeItem('body',1,0,undefined,{mei:false}));
  addCompare();
  fullHeal();
  META = {gameOvers:0, goPre5:0, run:Date.now()}; saveMeta(META);
}
function addMember(name, lv){
  const m = {lv, exp:0, hp:1, equip:{weapon:null,head:null,body:null,arm:null,acc1:null,acc2:null}, avail:true};
  G.members[name] = m;
  const s = calcStats(name); m.hp = s.hp;
  return m;
}
function avgLv(){const ns=G.party.length?G.party:Object.keys(G.members);return Math.max(1,Math.round(ns.reduce((a,n)=>a+G.members[n].lv,0)/ns.length));}

// ---------- 能力値 ----------
function passiveSum(name){
  const P={}; for(const p of equippedPassives(name)){ P[p.id]=p.v; if(p.v2!==undefined) P[p.id+'2']=p.v2; const f=P_STATIC[p.id]; if(f){ const o=f(p.v); for(const k in o) P[k]=(P[k]||0)+o[k]; } } return P;
}
function calcStats(name){
  const m=G.members[name], c=CHARS[name], lv=m.lv;
  const s={}; STATK.forEach(k=>s[k]=gradeVal(k,c.g[G_IDX[k]],lv));
  const fl={hp:0,atk:0,def:0,mat:0,mdf:0,spd:0}, pc={hp:0,atk:0,def:0,mat:0,mdf:0,spd:0};
  const ex={gauge:0,crit:0,critDmg:0,critDef:0,res:{fire:0,ice:0,thunder:0,dark:0,light:0},stRes:0,expUp:0,dropUp:0,drain:0,uniq:[]}; for(const k of EXK) ex[k]=0;
  for(const sl of SLOTS){ const it=m.equip[sl]; if(!it) continue;
    // 得意な武器は素の強さ+12%、苦手な武器は-15%。鍛えた品（+1〜+5）は素の強さ+4%ずつ
    const aff = sl==='weapon'? weaponAff(name, wTy(it)) : 0, am = aff>0?1.12: aff<0?0.85:1, pm=1+0.04*(it.plus||0);
    for(const k in it.base){ const v=it.base[k]; fl[k]+= v>0? Math.round(v*pm*((k==='atk'||k==='mat')?am:1)) : v; }
    for(const a of [...(it.imp||[]), ...it.af]){ const k=a.k,v=a.v;
      if(k==='atkF')fl.atk+=v; else if(k==='matF')fl.mat+=v; else if(k==='defF')fl.def+=v; else if(k==='mdfF')fl.mdf+=v; else if(k==='spdF')fl.spd+=v;
      else if(k==='hpF')fl.hp+=v; else if(k==='gaugeF')ex.gauge+=v; else if(k==='mpF')ex.gauge+=Math.min(25,Math.round(v/8)); else if(k==='atkP')pc.atk+=v; else if(k==='matP')pc.mat+=v; else if(k==='hpP')pc.hp+=v;
      else if(k==='crit')ex.crit+=v; else if(k==='critDmg')ex.critDmg+=v; else if(k==='critDef')ex.critDef+=v;
      else if(k==='resFire')ex.res.fire+=v; else if(k==='resIce')ex.res.ice+=v; else if(k==='resThunder')ex.res.thunder+=v; else if(k==='resDark')ex.res.dark+=v;
      else if(k==='stRes')ex.stRes+=v; else if(k==='expUp')ex.expUp+=v; else if(k==='dropUp')ex.dropUp+=v; else if(k==='drain')ex.drain+=v; else if(EXK.includes(k)) ex[k]+=v; }
    if(it.u) ex.uniq.push(it.u);
  }
  const P=passiveSum(name);
  pc.atk+=(P.atkPct||0)+(P.allPct||0); pc.def+=(P.defPct||0)+(P.allPct||0); pc.mat+=(P.matPct||0)+(P.allPct||0); pc.mdf+=(P.mdfPct||0)+(P.allPct||0);
  pc.spd+=(P.spdPct||0)+(P.allPct||0); pc.hp+=(P.hpPct||0)+(P.allPct||0);
  const o={};
  for(const k of STATK){ const cap=k==='hp'?99999:9999; /* 上限は高め（ハクスラで数値がどこまでも伸びる楽しさ） */ o[k]=Math.min(cap, Math.round((s[k]+fl[k])*(1+pc[k]/100))); }
  if(P.spdToMat) o.mat=Math.min(9999,o.mat+Math.round(o.spd*P.spdToMat/100));
  o.gauge=Math.min(100,ex.gauge+(P.startGauge||0)); o.crit=ex.crit+(P.crit||0); o.critDmg=ex.critDmg+(P.critDmg||0); o.critDef=ex.critDef+(P.critDef||0);
  o.res=ex.res; if(P.darkRes) o.res.dark+=P.darkRes; o.stRes=ex.stRes+(P.resist||0); o.expUp=ex.expUp; o.dropUp=ex.dropUp+(P.dropUp||0); o.drain=ex.drain; o.uniq=ex.uniq; o.P=P; for(const k of EXK) o[k]=ex[k]; if(o.uniq.includes('startFull')) o.gauge=100;
  return o;
}
function clampHpMp(name){const m=G.members[name],s=calcStats(name);m.hp=Math.min(m.hp,s.hp);}
function fullHeal(all){ for(const n in G.members){ const s=calcStats(n); G.members[n].hp=s.hp; } }

// ---------- 装備の生成 ----------
function tierOf(iLv){return clamp(Math.floor((iLv-1)/11),0,8);}
function baseOf(slot,iLv,kind){
  if(slot==='weapon') return kind==='m'?{mat:6+3*iLv}:{atk:6+3*iLv};
  if(slot==='body'){const d=Math.round(4+1.7*iLv);return {def:d,mdf:Math.round(d*0.7)};}
  if(slot==='head'||slot==='arm'){const d=Math.round(2+0.8*iLv);return {def:d,mdf:Math.round(d*0.7)};}
  return {hp:Math.round(5+3*iLv)};
}
// レア度ほど素の強さも上がる（白1.0・青1.08・紫1.18・黄1.32・虹1.5）
const RMUL=[1,1.08,1.18,1.32,1.5];
// おまけの効果の出方：[いちばん低い, いちばん高い, かたより]。かたよりが1より大きいと低い値が出やすく、小さいと高い値が出やすい
// 高いレア度ほど上限も高く、上の方が出やすい。低いレア度は、高い値がめったに出ない
const AQ=[[0.3,0.8,1.6],[0.3,1.0,1.6],[0.4,1.1,1.15],[0.55,1.25,0.75],[0.7,1.45,0.5]];
const EXK=['gNorm','gHurt','gCrit','gKill','gTurn','gKeep','actP'];
function scaleBase(b,r){ const o={}; for(const k in b) o[k]= b[k]>0? Math.round(b[k]*(RMUL[r]||1)) : b[k]; return o; }
function gradeOf(iLv){ return iLv<=15?1: iLv<=30?2: iLv<=45?3: iLv<=60?4:5; }
function wTy(it){ return it? (it.ty || (it.slot==='weapon'?(it.kind==='m'?'staff':'sword'):null)) : null; }
function typeGroup(slot,kind){ return slot==='weapon'?(kind==='m'?'wm':'wp'):slot; }
function typeBase(slot,iLv,kind,T,x){ const b=baseOf(slot,iLv,kind), o={};
  for(const k in b){ const mul= typeof T.m==='number'? T.m : (T.m[k]!==undefined?T.m[k]:1); o[k]=Math.round(b[k]*mul*(x||1)); }
  if(T.add) for(const k in T.add) o[k]=(o[k]||0)+Math.round(T.add[k]*iLv);
  for(const k in o) if(!o[k]) delete o[k];
  return o; }
// 前の版で手に入れた装備も、同じ基準にそろえる（1回だけ）
function migrateItems(){ const all=[...(G.gear||[])]; for(const n in G.members) for(const sl in G.members[n].equip){ const it=G.members[n].equip[sl]; if(it) all.push(it); } for(const it of all){ if(!it) continue; if(!it.rv){ it.base=scaleBase(it.base,it.r||0); it.rv=1; } if(it.slot==='weapon' && !it.ty) it.ty=it.kind==='m'?'staff':'sword'; if(!it.imp) it.imp=[]; } }
function rollAffix(it, exclude){
  const sl = it.slot==='weapon'?'weapon':it.slot;
  const pool = AFX.filter(a=>a.s.includes(sl) && !exclude.includes(a.k) && (!a.minR || it.r>=a.minR) && !(it.kind==='m'&&(a.k==='atkF'||a.k==='atkP')) && !(it.kind==='p'&&(a.k==='matF'||a.k==='matP')) );
  const a = pick(pool); const mx=a.max(it.iLv); const Q=AQ[it.r]||AQ[0];
  const f=Q[0]+(Q[1]-Q[0])*Math.pow(Math.random(),Q[2]);
  return {k:a.k, v:Math.max(1, Math.round(mx*f)), q:Math.round(f*100)/100};
}
// opt：{ty:種類を指定, mei:false で名品なし, meiRate:名品の出やすさ}
// 効果の数値だけを振り直す（錬成屋の「磨く」）
function rollAffixValue(it,k){ const a=AFX.find(x=>x.k===k); const Q=AQ[it.r]||AQ[0]; const f=Q[0]+(Q[1]-Q[0])*Math.pow(Math.random(),Q[2]); return {v:Math.max(1,Math.round(a.max(it.iLv)*f)), q:Math.round(f*100)/100}; }
// ---------- 素材 ----------
function gainMat(n,k){ if(!MAT[n]) return; G.mats=G.mats||{}; G.mats[n]=(G.mats[n]||0)+(k||1);
  const d=dexMats(); if(!d[n]){ if(RT.newMats) RT.newMats.add(n); } d[n]=(d[n]||0)+(k||1); }
// 素材の図鑑：一度でも手に入れた素材（前のセーブは、いま持っている素材から始める）
function dexMats(){ const d=dex(); if(!d.m){ d.m={}; for(const n in (G.mats||{})) if(G.mats[n]>0) d.m[n]=G.mats[n]; } return d.m; }
function matHave(n){ return (G.mats&&G.mats[n])||0; }
function matTakeName(n,k){ G.mats[n]=Math.max(0,matHave(n)-k); if(!G.mats[n]) delete G.mats[n]; }
function matList(cat,minG){ return Object.keys(G.mats||{}).filter(n=>MAT[n]&&MAT[n].cat===cat&&MAT[n].g>=(minG||1)&&G.mats[n]>0).sort((a,b)=>MAT[a].g-MAT[b].g); }
function matCount(cat,minG){ return matList(cat,minG).reduce((s,n)=>s+G.mats[n],0); }
// 足りる分だけ、★の低いものから使う
function matTake(cat,minG,k){ for(const n of matList(cat,minG)){ if(k<=0) break; const t=Math.min(k,G.mats[n]); matTakeName(n,t); k-=t; } }
function matCountBoss(core){ return Object.keys(G.mats||{}).filter(n=>MAT[n]&&MAT[n].cat==='boss'&&(core?MAT[n].core:true)).reduce((s,n)=>s+G.mats[n],0); }
function matTakeBoss(core,k){ for(const n of Object.keys(G.mats||{}).filter(n=>MAT[n]&&MAT[n].cat==='boss'&&(core?MAT[n].core:!MAT[n].core)).concat(core?[]:['記憶の核'])){ if(k<=0) break; const t=Math.min(k,matHave(n)); if(t>0){ matTakeName(n,t); k-=t; } } }
function makeItem(slot, iLv, r, kind, opt){
  opt=opt||{};
  if(slot==='acc1'||slot==='acc2') slot='acc';
  iLv = clamp(Math.round(iLv),1,99);
  if(slot==='weapon' && !kind) kind = Math.random()<0.5?'p':'m';
  const t=tierOf(iLv), grp=typeGroup(slot,kind);
  let M= opt.meiIdx!==undefined? MEIHIN[opt.meiIdx] : null;
  if(!M && opt.mei!==false && !opt.ty && Math.random()<(opt.meiRate!==undefined?opt.meiRate:0.04)){
    const el=MEIHIN.filter(x=>x.g===grp && x.lv<=iLv);
    if(el.length){ const w=el.map(x=>x.lv*x.lv); let z=Math.random()*w.reduce((a,b)=>a+b,0); for(let i=0;i<el.length&&!M;i++){ z-=w[i]; if(z<=0) M=el[i]; } M=M||el[el.length-1]; } }
  const T = ITYPE[grp].find(x=>x.id===(M?M.ty:opt.ty)) || pick(ITYPE[grp]);
  const nameBase = M? M.nm : T.n[t];
  const imp={}; for(const [k,a,b] of [...(T.imp||[]),...((M&&M.imp)||[])]) imp[k]=(imp[k]||0)+Math.round(a+iLv*b);
  const it={id:G?G.nid++:0, slot, kind:slot==='weapon'?kind:undefined, ty:T.id, iLv, r, name:nameBase, base:scaleBase(typeBase(slot,iLv,kind,T,M?M.x:1),r), imp:Object.keys(imp).map(k=>({k,v:imp[k]})), af:[], isNew:true, rv:1};
  if(M){ it.mei=MEIHIN.indexOf(M); if(M.top) it.top=1; }
  const cnt = [[0,0],[1,2],[2,3],[3,4],[4,4]][r];
  const n = ri(cnt[0],cnt[1]);
  for(let i=0;i<n;i++){ it.af.push(rollAffix(it, it.af.map(a=>a.k))); }
  if(r===4){ const u=pick(UNIQ); it.u=u.k; if(!M) it.name=`${ri(3,48)}周目の${pick(RAINBOW_WHO)}の${nameBase.replace(/^.*の/,'')}`; }
  return it;
}
function rollRarity(boss, dropUp, maze){
  const x=Math.random()*100/(1+dropUp/100);
  if(boss){ if(x<(maze?3:1)) return 4; if(x<15) return 3; return 2; }
  if(x<0.1) return 4; if(x<1.0) return 3; if(x<5.0) return 2; if(x<25) return 1; return 0;
}
function randomSlot(){return pick(['weapon','weapon','head','body','arm','acc','acc']);}
function afText(a){ if(a.k==='mpF') return '戦闘開始時ゲージ+'+Math.min(25,Math.round(a.v/8)); const d=AFX.find(x=>x.k===a.k); return d.t+a.v+(d.p?'%':''); }
// 効果値の出来（その効果の上限に対する割合）。高い出来は色で見せる
function afHTML(a){ const t=afText(a); if(!(a.q>=1)) return t; return `<span class="${a.q>=1.3?'qtop':'qhi'}">${t}</span>`; }
const PW={gNorm:4,gHurt:1,gCrit:1,gKill:1,gTurn:5,gKeep:1.5,actP:3,gaugeF:1,mpF:1,hpF:0.1};
function itemPower(it){ // 比較用のざっくりした強さ
  let p=0; const pm=1+0.04*(it.plus||0); for(const k in it.base) p+= (k==='hp'?it.base[k]/10:it.base[k])*(it.base[k]>0?pm:1);
  for(const a of [...(it.imp||[]),...it.af]){ const d=AFX.find(x=>x.k===a.k)||{}; p+= PW[a.k]!==undefined? a.v*PW[a.k] : d.p? a.v*4 : a.v; }
  if(it.u) p+=40; return Math.round(p);
}
function equip(name, it){
  const m=G.members[name]; let sl=it.slot;
  if(sl==='acc') sl = !m.equip.acc1?'acc1':(!m.equip.acc2?'acc2':'acc1');
  const old=m.equip[sl]; m.equip[sl]=it; it.isNew=false;
  G.gear=G.gear.filter(x=>x!==it); if(old) G.gear.push(old);
  clampHpMp(name);
}
function dex(){ if(!G.dex) G.dex={e:{},i:{},L:{}}; return G.dex; }
function dexEnemy(e,kill){ const d=dex().e; const k=e.dexName||e.name; const r=d[k]||(d[k]={n:0}); if(kill) r.n++; return r; }
// 拾った装備：名前ごとに、いちばん高いレア度と、アイコン用の種類・段階を残す
function dexItem(it){ const d=dex(); if(it.legend!==undefined) d.L[it.legend]=1; const k=it.name; const o=d.i[k]; const r0=typeof o==='number'?o:o?o.r:-1;
  if(r0<it.r || typeof o!=='object') d.i[k]={r:Math.max(r0,it.r), ty:it.ty, t:tierOf(it.iLv||1), sp:it.top?'dawn':it.mei!==undefined?'mei':'', slot:it.slot}; }
function itemName(it){ return `<span class="r${it.r}">${it.name}</span>`; }
function gainItem(it){
  dexItem(it); if(G.inMaze) G.mazeLoot=(G.mazeLoot||0)+1;
  if(G.settings.autosell[0] && it.r===0){ G.gold+=sellPrice(it); return 'sold'; }
  if(G.settings.autosell[1] && it.r===1){ G.gold+=sellPrice(it); return 'sold'; }
  if(G.gear.length>=300){ G.gold+=sellPrice(it); return 'sold'; }
  G.gear.push(it); return 'got';
}
function sellPrice(it){return Math.round((10+it.iLv*6)*[1,2,4,8,20][it.r]);}

// ---------- マップ生成 ----------
// タイル: 0床 1壁 2木/障害物 3水 4家の壁 5屋根 6扉 9道
function genTown(id){
  const L=LOCS[id], rng=mulberry(hashStr(id)+7);
  const W=20,H=22, t=new Uint8Array(W*H);
  const set=(x,y,v)=>{if(x>=0&&y>=0&&x<W&&y<H)t[y*W+x]=v;};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){ set(x,y, (x===0||y===0||x===W-1||y===H-1)?2:0); }
  for(let y=1;y<H-1;y++){set(9,y,9);set(10,y,9);} for(let x=1;x<W-1;x++){set(x,11,9);}
  set(9,H-1,9); set(10,H-1,9);
  const objs=[], npcs=[];
  const slots=[[2,2],[13,2],[2,14],[13,14],[2,7],[13,7]];
  const shops=['inn','item','equip']; if(L.smith) shops.push('smith'); if(L.type!=='village') shops.push('house');
  shops.push('house');
  shops.slice(0,slots.length).forEach((kind,i)=>{
    const [bx,by]=slots[i];
    for(let x=bx;x<bx+5;x++){set(x,by,5);set(x,by+1,5);set(x,by+2,4);set(x,by+3,4);}
    set(bx+2,by+3,6);
    if(kind!=='house'){ npcs.push({x:bx+2,y:by+4,kind,shop:1,seed:hashStr(id+kind)}); objs.push({type:'sign',x:bx+1,y:by+4,kind}); set(bx+1,by+4,0);}
  });
  let church=null; if(id==='sora'){ const bx=2,by=7; for(let x=bx;x<bx+5;x++){set(x,by,5);set(x,by+1,5);set(x,by+2,4);set(x,by+3,4);} set(bx+2,by+3,6); objs.push({type:'church',x:bx+2,y:by}); church={x:bx+2,y:by+4}; }
  if(L.theme==='port'){ for(let y=17;y<21;y++)for(let x=12;x<19;x++)set(x,y,3); }
  if(L.theme==='village'||L.theme==='snow'){ for(let i=0;i<14;i++){const x=1+Math.floor(rng()*18),y=1+Math.floor(rng()*20); if(t[y*W+x]===0 && Math.abs(x-9.5)>2 && y!==11) set(x,y,2);} }
  objs.push({type:'save',x:12,y:12});
  // 住人
  const free=[]; for(let y=2;y<H-2;y++)for(let x=1;x<W-1;x++){ if(t[y*W+x]===0||t[y*W+x]===9){ if(objs.some(o=>o.x===x&&o.y===y)||npcs.some(n=>Math.abs(n.x-x)+Math.abs(n.y-y)<2)) continue; if((x===9||x===10)&&y>H-4) continue; free.push([x,y]); } }
  let cnt=L.npc;
  for(let i=0;i<cnt&&free.length;i++){ const k=Math.floor(rng()*free.length); const [x,y]=free.splice(k,1)[0]; npcs.push({x,y,idx:i,seed:hashStr(id)+i*131}); }
  return {id,w:W,h:H,t,objs,npcs,start:{x:9,y:H-2},exitY:H-1,town:1,theme:L.theme,church};
}
function genDungeon(id, floor){
  const L=LOCS[id], rng=mulberry(hashStr(id)+floor*977+(L.post?(G.flags.mazeNo||0)*31+(G.mazeEntry||0)*7919:0));
  const W=28+Math.min(12,Math.floor((L.area||0)*0.7)), H=W, t=new Uint8Array(W*H).fill(1);
  const rooms=[]; let tries=0;
  while(rooms.length<12 && tries<400){ tries++;
    const w=4+Math.floor(rng()*5), h=4+Math.floor(rng()*4), x=1+Math.floor(rng()*(W-w-2)), y=1+Math.floor(rng()*(H-h-2));
    if(rooms.some(r=>x<r.x+r.w+1&&x+w+1>r.x&&y<r.y+r.h+1&&y+h+1>r.y)) continue;
    rooms.push({x,y,w,h,cx:x+Math.floor(w/2),cy:y+Math.floor(h/2)});
  }
  // 本道：左上から右下へ蛇行。残りは行き止まりの小部屋（宝箱が多い）
  const nMain=Math.min(rooms.length, 8+Math.floor(rng()*2));
  rooms.sort((a,b)=>(a.cx+a.cy*0.6)-(b.cx+b.cy*0.6));
  const main=[], side=[]; const pickIdx=new Set(); while(pickIdx.size<rooms.length-nMain){ const i=1+Math.floor(rng()*(rooms.length-2)); pickIdx.add(i); }
  rooms.forEach((r,i)=>(pickIdx.has(i)?side:main).push(r));
  const carve=(a,b)=>{ let x=a.cx,y=a.cy; const hf=rng()<.5; if(hf){ while(x!==b.cx){t[y*W+x]=0;x+=Math.sign(b.cx-x);} while(y!==b.cy){t[y*W+x]=0;y+=Math.sign(b.cy-y);} } else { while(y!==b.cy){t[y*W+x]=0;y+=Math.sign(b.cy-y);} while(x!==b.cx){t[y*W+x]=0;x+=Math.sign(b.cx-x);} } t[y*W+x]=0; };
  for(const r of rooms) for(let y=r.y;y<r.y+r.h;y++)for(let x=r.x;x<r.x+r.w;x++) t[y*W+x]=0;
  for(let i=0;i<14;i++){ const r=rooms[Math.floor(rng()*rooms.length)]; if(r===main[0]||r===main[main.length-1]) continue; const x=r.x+1+Math.floor(rng()*Math.max(1,r.w-2)), y=r.y+1+Math.floor(rng()*Math.max(1,r.h-2)); if(x!==r.cx&&y!==r.cy&&rng()<.5) t[y*W+x]=2; }
  for(let i=1;i<main.length;i++) carve(main[i-1],main[i]);
  for(const s of side){ let best=main[0],bd=1e9; for(const m of main.slice(0,-1)){ const d=Math.abs(m.cx-s.cx)+Math.abs(m.cy-s.cy); if(d<bd){bd=d;best=m;} } carve(best,s); }
  const objs=[]; const first=main[0], last=main[main.length-1];
  const MZ = id==='maze'; // 記憶の迷宮：一方通行（戻る階段は入口だけ）。中では記録できない
  if(!MZ || floor===0) objs.push({type:'up',x:first.cx,y:first.cy});
  const final = floor===L.floors-1;
  if(!final) objs.push({type:'down',x:last.cx,y:last.cy});
  else if(L.boss!==undefined || L.goal || L.post) objs.push({type:L.goal?'goal':'boss',x:last.cx,y:last.cy});
  if(MZ){ if(final && main.length>2){ const pr=main[main.length-2]; objs.push({type:'spring',x:pr.x+pr.w-1,y:pr.y}); } } // 番人の手前に、一度だけ傷が治る泉
  else if(floor===0) objs.push({type:'save',x:first.x+first.w-1,y:first.y});
  if(MZ){}
  else if(final && main.length>2){ const pr=main[main.length-2]; objs.push({type:'save',x:pr.x+pr.w-1,y:pr.y}); }
  else if(floor>0 && floor%2===0 && main.length>3){ const pr=main[Math.floor(main.length/2)]; objs.push({type:'save',x:pr.x+pr.w-1,y:pr.y}); }
  let ci=0;
  for(let i=1;i<main.length-1;i++){ ci++; if(rng()<0.3){ const r=main[i]; objs.push({type:'chest',x:r.x+1,y:r.y+1,ci}); } }
  for(const r of side){ ci++; if(rng()<0.8) objs.push({type:'chest',x:r.x+r.w-2,y:r.y+1,ci}); }
  for(const o of objs) t[o.y*W+o.x]=0;
  return {id,floor,w:W,h:H,t,objs,npcs:[],start:{x:first.cx,y:first.cy+1},theme:L.theme};
}
function tileAt(m,x,y){ if(x<0||y<0||x>=m.w||y>=m.h) return 1; return m.t[y*m.w+x]; }
function walkable(m,x,y){
  const v=tileAt(m,x,y); if(!(v===0||v===9||v===7)) return false;
  if(m.npcs.some(n=>n.x===x&&n.y===y&&!n.gone)) return false;
  if(m.objs.some(o=>o.x===x&&o.y===y&&['save','chest','boss','goal','sign','spring','throne','torch','body','fallen','bed','table','shelf','block','pot'].includes(o.type)&&!o.gone)) return false;
  return true;
}

// ---------- 描画 ----------
function resizeCanvas(){
  const v=$('view'); const r=v.getBoundingClientRect(); const dpr=window.devicePixelRatio||1;
  const aw=Math.max(100,r.width), ah=Math.max(100,r.height);
  // 画面の1ドットが、スマホでもきっちり同じ大きさ（整数倍）になるように。ドットが不ぞろいだと汚く見える
  // 倍率は横352ドットを基準に決め、その倍率のまま画面の幅いっぱいまで広げる（左右に黒い帯を出さない）
  const s=Math.max(1,Math.floor(aw*dpr/352));
  const w=Math.max(320,Math.floor(aw*dpr/s)), h=clamp(Math.floor(ah*dpr/s),224,900);
  // 絵を描く紙は画面の点の細かさのまま持ち、1ドット＝s個の点として描く（細かい絵の人物も、細かさを保ったまま映せる）
  VW=w; VH=h; VS=s;
  if(cv.height!==h*s||cv.width!==w*s){cv.width=w*s;cv.height=h*s;}
  cx.setTransform(s,0,0,s,0,0); cx.imageSmoothingEnabled=false;
  cv.style.width=(w*s/dpr)+'px'; cv.style.height=(h*s/dpr)+'px';
}
function shade(hex,amt){ let c=parseInt(hex.slice(1),16); let r=(c>>16)&255,g=(c>>8)&255,b=c&255; r=clamp(Math.round(r*(1+amt)),0,255);g=clamp(Math.round(g*(1+amt)),0,255);b=clamp(Math.round(b*(1+amt)),0,255); return '#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function drawTile(m,v,x,y,px,py){
  if((v===7||v===8)&&typeof drawSceneTile==='function'&&drawSceneTile(m,v,x,y,px,py)) return;
  const th=THEMES[m.theme]||THEMES.village; const s=TS;
  const h=(x*7+y*13)%5;
  if(v===0||v===9){ cx.fillStyle=v===9?th.path:(h===0?th.floor2:th.floor); cx.fillRect(px,py,s,s);
    if(v===0&&h===2){cx.fillStyle=shade(th.floor,-.12);cx.fillRect(px+8,py+12,4,4);cx.fillRect(px+20,py+22,4,4);} return; }
  if(v===1){ cx.fillStyle=th.wall; cx.fillRect(px,py,s,s); cx.fillStyle=shade(th.wall,.18); cx.fillRect(px,py,s,6); cx.fillStyle=shade(th.wall,-.25); cx.fillRect(px,py+s-4,s,4); return; }
  if(v===2){ cx.fillStyle=th.floor; cx.fillRect(px,py,s,s);
    if(m.town||['forest','village','marsh','mountain'].includes(m.theme)){ cx.fillStyle='#5b3a1e'; cx.fillRect(px+13,py+18,6,12); cx.fillStyle=shade(th.wall,.05); cx.beginPath(); cx.arc(px+16,py+14,12,0,7); cx.fill(); cx.fillStyle=shade(th.wall,.3); cx.beginPath(); cx.arc(px+12,py+10,5,0,7); cx.fill(); }
    else { cx.fillStyle=shade(th.wall,.1); cx.beginPath(); cx.moveTo(px+4,py+28);cx.lineTo(px+16,py+4);cx.lineTo(px+28,py+28);cx.fill(); cx.fillStyle=shade(th.wall,.35); cx.fillRect(px+14,py+8,4,6);} return; }
  if(v===3){ cx.fillStyle='#2a6fb0'; cx.fillRect(px,py,s,s); cx.fillStyle='#5aa0e0'; const o=(RT.anim/20+x*3)%s; cx.fillRect(px+(o%s),py+10,8,2); cx.fillRect(px+((o+14)%s),py+22,8,2); return; }
  if(v===4){ cx.fillStyle='#e8dcc0'; cx.fillRect(px,py,s,s); cx.fillStyle='#a08a66'; cx.fillRect(px,py,s,3); cx.fillStyle='#7ec8ff'; if(h%2===0) cx.fillRect(px+10,py+10,12,10); return; }
  if(v===5){ cx.fillStyle=m.theme==='snow'?'#64748b':m.theme==='shadow'?'#4c1d95':m.theme==='holy'?'#1e3a8a':'#b4413a'; cx.fillRect(px,py,s,s); cx.fillStyle='#0003'; for(let i=0;i<4;i++)cx.fillRect(px,py+i*8+6,s,2); return; }
  if(v===6){ cx.fillStyle='#e8dcc0'; cx.fillRect(px,py,s,s); cx.fillStyle='#6b4423'; cx.fillRect(px+8,py+4,16,28); cx.fillStyle='#fbbf24'; cx.fillRect(px+20,py+18,3,3); return; }
}
// キャラクターのドット絵（16x16 を 2倍）
function drawSprite(x,y,look,frame,dir,ctxo,icol,irow){ const cx=ctxo||CX0;
  if(hasImg(look)){ const c=icol===undefined?1:icol, r=irow!==undefined?irow:(DIRROW[dir]||0);
    cx.fillStyle='#0004'; cx.beginPath(); cx.ellipse(x+16,y+33,9,3,0,0,7); cx.fill();
    const fw=look.img.naturalWidth/3, fh=look.img.naturalHeight/5, k=32/fw; cx.imageSmoothingEnabled=!!look.smooth; if(look.smooth) cx.imageSmoothingQuality='high'; cx.drawImage(look.img, c*fw, r*fh, fw, fh, x, y+36-fh*k, 32, fh*k); cx.imageSmoothingEnabled=false; return; }
  const P=2; const r=(px,py,w,h,c)=>{cx.fillStyle=c;cx.fillRect(x+px*P,y+py*P,w*P,h*P);};
  const skin=look.skin||'#f2c79b', hair=look.hair, col=look.col, col2=look.col2||shade(col,-.3), st=look.style||'short';
  // 影
  cx.fillStyle='#0004'; cx.beginPath(); cx.ellipse(x+16,y+30,9,3,0,0,7); cx.fill();
  const lg=frame?1:0;
  r(5,13-0,2,3- (lg?1:0),'#3b2a1e'); r(9,13,2,3-(lg?0:1),'#3b2a1e');
  r(4,8,8,5,col); r(4,11,8,1,col2); if(st==='hood') r(4,8,8,5,col2);
  r(3,8,1,4,skin); r(12,8,1,4,skin);
  if(st==='hood'){ r(4,1,8,7,col2); r(5,3,6,4,skin); }
  else { r(4,2,8,6,skin); }
  if(st==='old'){ r(3,3,2,4,hair); r(11,3,2,4,hair); r(5,6,6,4,hair); }
  else if(st!=='hood'){
    r(4,1,8,2,hair); r(3,2,1,3,hair); r(12,2,1,3,hair); if(dir==='up') r(4,1,8,7,hair);
    if(st==='long'){ r(3,4,1,6,hair); r(12,4,1,6,hair); }
    if(st==='bob'){ r(3,3,2,5,hair); r(11,3,2,5,hair); r(4,3,8,1,hair); }
    if(st==='braid'){ r(12,4,2,7,hair); r(12,11,2,1,'#fbbf24'); }
    if(st==='pony'){ r(12,1,2,6,hair); }
    if(st==='spiky'){ r(4,0,2,1,hair); r(7,0,2,1,hair); r(10,0,2,1,hair); }
    if(st==='beard'){ r(5,6,6,2,hair); }
    if(st==='beast'){ r(4,0,2,2,hair); r(10,0,2,2,hair); }
  }
  if(dir!=='up'){ const ex = dir==='left'?-1:dir==='right'?1:0; r(6+ex,5,1,1,'#111'); r(9+ex,5,1,1,'#111'); }
  if(look.mark) { r(7,9,2,2,look.mark); }
}
// 見比べ用に一時的に入れていた仲間を、記録から外す（見比べは終わった）
// 見比べ用に一時的に入れていた仲間を、記録から外す（見比べは終わった）。リリィが外れていたら戻す
function removeCompare(){ for(const n of ['新アルト','新リリィ','少年32','少年48','騎士32','騎士48','少年そのまま','熊そのまま','新・女の子','新・エルフ','新・魔族','新・少年','新・熊','新・金髪','新・フード','新・少女','新・クマ','少女48','少女32','男の子','よろい','エルフ','老人']){ if(G.members) delete G.members[n]; if(G.party) G.party=G.party.filter(x=>x!==n); }
  if(G.party && G.members && G.members['リリィ'] && G.members['リリィ'].avail && !G.party.includes('リリィ') && G.party.length<4) G.party.splice(Math.min(1,G.party.length),0,'リリィ'); }
// 見比べ用：新しいやり方で描いた32×40のドット絵（中身はアルトと同じ。絵だけ違う）
const COMPARE=[['男の子','img/d48_022.png'],['よろい','img/d48_023.png'],['エルフ','img/d48_024.png'],['老人','img/d48_008.png']];
for(const [nw] of COMPARE){ CHARS[nw]={...CHARS['アルト'],role:'見比べ用'}; AFF[nw]=AFF['アルト']; FAV[nw]=FAV['アルト']; if(typeof SKILLS!=='undefined') SKILLS[nw]=SKILLS['アルト']; if(typeof KIT!=='undefined') KIT[nw]=KIT['アルト']; }
function addCompare(lead){ for(const [nw] of COMPARE){ if(!G.members[nw]||!G.members[nw].avail) join(nw,true); } if(lead&&COMPARE.length) G.party=COMPARE.map(c=>c[0]).slice(0,4); }
const LOOK = {};
for(const n in CHARS){ const c=CHARS[n]; LOOK[n]={hair:c.hair,col:c.col,col2:c.col2,style:c.style}; }
// 歩行ドット絵（1コマ16×20、横3コマ×縦5段：下/左/右/上/技のポーズ）。細かい版（1コマ32×40）も同じ並びで使える
const SPRITE_FILES={...Object.fromEntries(COMPARE),'アルト':'img/alto.png','リリィ':'img/lily.png','ノア':'img/noah.png','ミナ':'img/mina.png','ガルド':'img/gard.png','オルガ':'img/olga.png','シオン':'img/sion.png','ドルク':'img/dork.png','ルガ':'img/luga.png','ゴード':'img/gord.png','イヴ':'img/eve.png','クロノ':'img/chrono.png','レオン':'img/leon.png','ロロ':'img/lolo.png','テオ':'img/teo.png','リュート':'img/lute.png','ミオ':'img/mio.png','ヨル':'img/yoru.png','モルド':'img/mord.png','ベラ':'img/bella.png','アルベルト':'img/albert.png','ピピ':'img/pipi.png','ザガン':'img/zagan.png'};
const SPR_URL={};
for(const n in SPRITE_FILES){ const im=new Image(); im.onload=()=>{ LOOK[n].img=im; for(const k in SPR_URL) if(k.startsWith(n+'|')) delete SPR_URL[k]; try{ renderTop(RT.mode==='battle'&&B?B.party:undefined); }catch(e){} }; im.src=SPRITE_FILES[n]; }
const DIRROW={down:0,left:1,right:2,up:3};
// 町の人12種類
const NPC_TYPES=['oldman','oldwoman','man','woman','boy','girl','soldier','merchant','priest','nun','miner','sailor'];
const NPC_IMG={}; for(const k of NPC_TYPES){ const im=new Image(); im.onload=()=>{ NPC_IMG[k]=im; }; im.src='img/npc_'+k+'.png'; }
// 呼び名から見た目を選ぶ（分からなければ番号で男女を振り分け）
function npcType(label, seed){
  const L=label||'';
  const rules=[['man',/旅人|弟子/],['soldier',/衛兵|兵|騎士|見張り|保安官|戦士|用心棒|傭兵|狩人/],['nun',/修道女|聖歌|巡礼/],['priest',/神父|司祭|修道士|教会/],
    ['miner',/鉱夫|炭焼き|鍛冶|薪割り/],['sailor',/船|漁|網|港|荷運び|灯台|ラクダ/],['oldwoman',/老婆|おばあ/],
    ['oldman',/老|じい|族長|長$|村長|町長|年寄り|教授|墓守/],['girl',/女の子|娘|少女|水くみの子|雪かきの子/],['boy',/男の子|少年|息子|子ども|学生|見習い/],
    ['woman',/女|母|妻|奥さん|おばさん|花売り|司書|歌い手|占い師/],['merchant',/商人|屋|売り|主人|胴元|賭け|書記|大臣/]];
  for(const [k,re] of rules) if(re.test(L)) return k;
  return ['man','woman','man','woman','oldman','boy'][Math.abs(seed||0)%6];
}
// 町の人の正面の立ち姿（会話の顔アイコン用）
function npcFaceURL(type){ const im=NPC_IMG[type]; if(!im) return null; const key='npc|'+type; if(SPR_URL[key]) return SPR_URL[key];
  const fw=im.naturalWidth/3; const c=document.createElement('canvas'); c.width=fw; c.height=im.naturalHeight/5; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(im,fw,0,fw,c.height,0,0,fw,c.height); try{ return SPR_URL[key]=c.toDataURL(); }catch(e){ return null; } }
// 話している人の顔アイコン：仲間はその人、話しかけた町の人はその人、それ以外は呼び名から選ぶ
const SPEAKER_TYPE={'セイル':'priest','セイル司祭':'priest','王':'oldman','王さま':'oldman','ザガン':'soldier','黒将ザガン':'soldier','衛兵':'soldier','宿屋':'merchant','老婆':'oldwoman','村長':'oldman','神父':'priest'};
// 名前を明かす前の呼び名でも、顔はその人物のもの（あとで仲間になる人も同じ顔のまま）
const SPEAKER_CHAR={'銀髪の少女':'ノア','大剣の男':'ガルド','老魔導士':'ドルク','少年':'シオン','獣人の男':'ルガ','獣人の副官':'ルガ','白い髪の女':'イヴ','弓の少女':'ミオ','時の番人':'クロノ','初代勇者':'レオン',
  '黒将ザガンの記憶':'ザガン','黒将ザガン':'ザガン','傭兵ギルドの長':'ベラ','旅の商人':'ロロ','見張りの娘':'ヨル','見習い騎士':'テオ','吟遊詩人':'リュート','墓守':'モルド','宿屋の主人':'ゴード','ソラの子ども':'ピピ','王':'アルベルト','王さま':'アルベルト'};
function speakerFace(who){
  if(!who) return null;
  if(who.includes('|')) who=who.split('|')[1];
  if(CHARS[who]) return spriteURL(who,0);
  if(SPEAKER_CHAR[who] && CHARS[SPEAKER_CHAR[who]]) return spriteURL(SPEAKER_CHAR[who],0);
  if(typeof BANK_SPEAKER!=='undefined' && BANK_SPEAKER[who]){ const f=bankFaceURL(BANK_SPEAKER[who]); if(f) return f; }
  const n=RT.talkNpc; if(n && (n.nm===who || !n.nm)){ if(n.who&&CHARS[n.who]) return spriteURL(n.who,0); if(n.bank&&typeof bankFaceURL==='function'){ const f=bankFaceURL(n.bank); if(f) return f; } if(n.type) return npcFaceURL(n.type); }
  const t=SPEAKER_TYPE[who]||npcType(who, hashStr(who)); return npcFaceURL(t);
}
function npcLookFor(n){ if(n.bank&&typeof bankLook==='function'){ const b=bankLook(n.bank); if(b) return b; } const k=n.type; if(k && NPC_IMG[k]) return (n.look={img:NPC_IMG[k]}); return n.oldLook||(n.oldLook=npcLook(n.seed||0)); }
function hasImg(look){ return look && look.img && look.img.naturalWidth>0; }
function npcLook(seed){
  const rng=mulberry(seed); const hairs=['#1f2937','#78350f','#a16207','#d6d3d1','#7c2d12','#e5e7eb','#111827'];
  const cols=['#7c3aed','#0891b2','#b45309','#be123c','#4d7c0f','#334155','#a21caf','#0f766e','#c2410c'];
  const sts=['short','long','bob','beard','old','pony','short'];
  return {hair:hairs[Math.floor(rng()*hairs.length)], col:cols[Math.floor(rng()*cols.length)], style:sts[Math.floor(rng()*sts.length)]};
}
function drawField(){
  const m=RT.map; if(!m) return;
  const W=VW,H=VH;
  let px=G.x,py=G.y;
  if(RT.moving){ const k=clamp((performance.now()-RT.moving.t0)/RT.moving.dur,0,1); px=RT.moving.fx+(G.x-RT.moving.fx)*k; py=RT.moving.fy+(G.y-RT.moving.fy)*k; }
  let camX=px*TS+TS/2-W/2, camY=py*TS+TS/2-H/2;
  const mw=m.w*TS, mh=m.h*TS; camX = mw>W? clamp(camX,0,mw-W) : (mw-W)/2; camY = mh>H? clamp(camY,0,mh-H) : (mh-H)/2; RT.cam={x:camX,y:camY};
  if(RT.quake>0){ RT.quake--; camX+=Math.round((Math.random()-.5)*8); camY+=Math.round((Math.random()-.5)*8); }
  cx.fillStyle='#000'; cx.fillRect(0,0,W,H);
  const x0=Math.floor(camX/TS)-1,y0=Math.floor(camY/TS)-1,x1=x0+W/TS+3,y1=y0+H/TS+3;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){ const out=(x<0||y<0||x>=m.w||y>=m.h); if(out&&m.room) continue; const v=out?(m.town?2:1):m.t[y*m.w+x]; drawTile(m,v,x,y,Math.round(x*TS-camX),Math.round(y*TS-camY)); }
  // 物
  for(const o of m.objs){ if(o.gone) continue; const sx=Math.round(o.x*TS-camX), sy=Math.round(o.y*TS-camY); if(sx<-TS*4||sy<-TS*5||sx>W+TS*2||sy>H+TS) continue; drawObj(o,sx,sy); }
  // 出口の目印
  if(m.town){ for(const ex of [9,10]){ const sx=ex*TS-camX, sy=(m.h-1)*TS-camY; cx.fillStyle='#ffffff18'; cx.fillRect(sx,sy,TS,TS);} }
  // 住人
  const ents=[];
  for(const n of m.npcs){ if(n.gone) continue; let nx=n.x, ny=n.y; if(n.mv){ const k=clamp((performance.now()-n.mv.t0)/n.mv.dur,0,1); nx=n.mv.fx+(n.x-n.mv.fx)*k; ny=n.mv.fy+(n.y-n.mv.fy)*k; } ents.push({x:nx,y:ny,look:n.who?LOOK[n.who]:(n.bank?npcLookFor(n):(n.look&&n.look.img?n.look:npcLookFor(n))),fr:(n.walk&&walkCol(performance.now()-(n.walkT0||0))!==1)?1:0,col:n.walk?walkCol(performance.now()-(n.walkT0||0)):undefined,dir:n.dir||'down',bang:n.excl||npcHasNew(n)}); }
  // 仲間（後ろについてくる）
  const pts=[{x:px,y:py,dir:G.dir}];
  const tr=RT.trail, mk=RT.moving?clamp((performance.now()-RT.moving.t0)/RT.moving.dur,0,1):1, wf=Math.floor(performance.now()/120)%2;
  pts[0].mv=!!RT.moving;
  for(let i=1;i<Math.min(4,G.party.length);i++){ const to=tr[i-1]; if(!to) continue; const fr=(RT.moving&&tr[i])?tr[i]:to;
    const dx=to.x-fr.x, dy=to.y-fr.y; const mv=!!RT.moving&&(dx||dy);
    const d=mv?(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')):(to.dir||G.dir); to.dir=d;
    pts.push({x:fr.x+dx*mk,y:fr.y+dy*mk,dir:d,mv}); }
  if(m.solo) pts.length=1; if(RT.sleeping) pts.length=0;
  const pw=partyWalking();
  pts.forEach((p,i)=>{ const c=(p.mv||pw)?walkCol(performance.now()-(RT.walkT0||0)+i*250):1; ents.push({x:p.x,y:p.y,look:LOOK[G.party[i]],fr:c===1?0:1,col:c,dir:p.dir,party:i}); });
  ents.sort((a,b)=>a.y-b.y||((b.party??9)-(a.party??9)));
  for(const e of ents){ const sx=Math.round(e.x*TS-camX), sy=Math.round(e.y*TS-camY)-4; drawSprite(sx,sy,e.look,e.fr,e.dir,undefined,e.col);
    if(e.bang){ cx.fillStyle='#facc15'; cx.font='bold 16px sans-serif'; cx.textAlign='center'; cx.fillText('！',sx+16,sy-2+Math.sin(RT.anim/8)*2); } }
  if(m.theme==='abyss'||m.theme==='crypt'||m.theme==='cave'||m.theme==='sewer'){ const g=cx.createRadialGradient(W/2,H/2,60,W/2,H/2,Math.max(W,H)*0.7); g.addColorStop(0,'#0000'); g.addColorStop(1,'#000c'); cx.fillStyle=g; cx.fillRect(0,0,W,H); }
}
function drawObj(o,sx,sy){
  const t=RT.anim;
  if(typeof drawSceneObj==='function'&&drawSceneObj(o,sx,sy)) return;
  if(o.type==='save'){ cx.fillStyle='#1e3a8a'; cx.fillRect(sx+10,sy+22,12,6); const g=0.6+0.4*Math.sin(t/12); cx.fillStyle=`rgba(96,165,250,${g})`; cx.beginPath(); cx.moveTo(sx+16,sy+2);cx.lineTo(sx+25,sy+14);cx.lineTo(sx+16,sy+24);cx.lineTo(sx+7,sy+14);cx.fill(); cx.fillStyle='#fff8'; cx.fillRect(sx+13,sy+8,3,6); }
  else if(o.type==='chest'){ const op=G.flags[chestKey(o)]; cx.fillStyle=op?'#5b3a1e':'#8b5a2b'; cx.fillRect(sx+6,sy+12,20,16); cx.fillStyle=op?'#3b2412':'#b07a3a'; cx.fillRect(sx+6,sy+10,20,6); cx.fillStyle='#facc15'; cx.fillRect(sx+14,sy+16,4,4); }
  else if(o.type==='spring'){ const used=G.flags.springAt===G.mazeEntry; cx.fillStyle='#0f766e'; cx.beginPath(); cx.ellipse(sx+16,sy+22,13,6,0,0,7); cx.fill(); if(!used){ const g=0.5+0.5*Math.sin(t/10); cx.fillStyle=`rgba(94,234,212,${0.5+g*0.4})`; cx.beginPath(); cx.ellipse(sx+16,sy+21,9,4,0,0,7); cx.fill(); cx.fillStyle='#ccfbf1'; cx.fillRect(sx+15,sy+8-g*4,2,8); } }
  else if(o.type==='up'||o.type==='down'){ cx.fillStyle='#0008'; cx.fillRect(sx+2,sy+2,28,28); cx.fillStyle='#cbd5e1'; for(let i=0;i<4;i++) cx.fillRect(sx+4+(o.type==='down'?i*2:6-i*2),sy+5+i*6,24-(o.type==='down'?i*4:(3-i)*4)+0,4); }
  else if(o.type==='boss'){ if(bossDone()) return; if(RT.map.id==='abyss'&&G.flags.cleared){ const g=0.3+0.3*Math.sin(t/14); cx.fillStyle=`rgba(250,204,21,${g})`; cx.fillRect(sx+14,sy+14,3,3); return; } cx.fillStyle='#000a'; cx.beginPath(); cx.ellipse(sx+16,sy+28,16,5,0,0,7); cx.fill(); const pul=Math.sin(t/10)*2; cx.fillStyle='#3b0764'; cx.beginPath(); cx.arc(sx+16,sy+12+pul,15,0,7); cx.fill(); cx.fillStyle='#f87171'; cx.fillRect(sx+9,sy+9+pul,4,4); cx.fillRect(sx+19,sy+9+pul,4,4); }
  else if(o.type==='goal'){ if(goalDone()) return; const g=0.5+0.5*Math.sin(t/9); cx.fillStyle=`rgba(250,204,21,${g})`; cx.beginPath(); cx.arc(sx+16,sy+16,8+g*4,0,7); cx.fill(); cx.fillStyle='#fff'; cx.fillRect(sx+14,sy+10,4,12); }
  else if(o.type==='sign'){ cx.fillStyle='#6b4423'; cx.fillRect(sx+14,sy+16,4,14); cx.fillStyle='#d6b47a'; cx.fillRect(sx+4,sy+6,24,12); cx.fillStyle='#3b2412'; cx.font='bold 10px sans-serif'; cx.textAlign='center'; cx.fillText({inn:'宿',item:'道具',equip:'武具',smith:'錬成'}[o.kind]||'',sx+16,sy+16); }
}
function chestKey(o){return `chest_${RT.map.id}_${RT.map.floor||0}_${o.ci}${LOCS[RT.map.id].post?'_'+(G.flags.mazeNo||0)+'_'+(G.mazeEntry||0):''}`;}

// ---------- 上のパーティー表示・HUD ----------
// 立ち絵の画像（frame: 0/1＝足ぶみ、'pose'＝技のポーズ）
function spriteURL(name,frame){ const lk=LOOK[name]; const key=name+'|'+frame+'|'+(hasImg(lk)?1:0); if(SPR_URL[key]) return SPR_URL[key];
  const c=document.createElement('canvas'); const g=c.getContext('2d');
  if(hasImg(lk)&&frame==='ko'&&typeof standFrame==='function'){ const k=standFrame(lk.img,'x'); c.width=k.width; c.height=k.height; g.drawImage(k,0,0); }
  else if(hasImg(lk)&&lk.smooth){ const fw=lk.img.naturalWidth/3, fh=lk.img.naturalHeight/5, W2=96, H2=Math.round(fh*96/fw); c.width=W2; c.height=H2; g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high'; const sx=frame==='pose'?0:(frame?2:0)*fw, sy=frame==='pose'?fh*4:0; g.drawImage(lk.img,sx,sy,fw,fh,0,0,W2,H2); }
  else if(hasImg(lk)){ const fw=lk.img.naturalWidth/3, fh=lk.img.naturalHeight/5; c.width=fw; c.height=fh; g.imageSmoothingEnabled=false; if(frame==='pose') g.drawImage(lk.img,0,fh*4,fw,fh,0,0,fw,fh); else g.drawImage(lk.img,(frame?2:0)*fw,0,fw,fh,0,0,fw,fh); }
  else { c.width=32; c.height=34; drawSprite(0,0,lk,frame==='pose'?1:(frame||0),'down',g); }
  try{ return SPR_URL[key]=c.toDataURL(); }catch(e){ const d=document.createElement('canvas'); d.width=32; d.height=34; drawSprite(0,0,{...lk,img:null},0,'down',d.getContext('2d')); return d.toDataURL(); } }
// rows: [[ラベル, 合計, 増えた分], ...] を2列で
function statGrid(rows,small){
  return `<div class="sg"${small?' style="font-size:13px"':''}>${rows.map(([l,v,p])=>`<span class="l">${l}</span><span class="v">${v}</span><span class="p">${p?`(+${p})`:''}</span>`).join('')}</div>`;
}
function statRows(n){
  const m=G.members[n], s=calcStats(n), b=baseStats(n), add=k=>Math.max(0,s[k]-b[k]);
  return [['HP',`${m.hp}/${s.hp}`,0],['開始ゲージ',s.gauge,0],['攻撃',s.atk,add('atk')],['防御',s.def,add('def')],['魔攻',s.mat,add('mat')],['魔防',s.mdf,add('mdf')],
    ['速度',s.spd,add('spd')],['会心率',(5+s.crit)+'%',s.crit],['会心ダメ',(150+s.critDmg)+'%',s.critDmg],['会心防御',s.critDef+'%',s.critDef]];
}
function baseStats(n){ const m=G.members[n], c=CHARS[n]; const s={}; STATK.forEach(k=>s[k]=Math.round(gradeVal(k,c.g[G_IDX[k]],m.lv))); return s; }
// HPゲージ（数字は中）。戦闘中だけ、その下にアクティブのゲージ
function gaugeHTML(hp,mhp,gauge){
  const hr=Math.max(0,Math.min(1,hp/Math.max(1,mhp)));
  let h=`<div class="g${hr<.25?' low':''}"><i style="width:${hr*100}%"></i><b><em>HP</em><span>${hp}</span></b></div>`;
  if(gauge!==undefined && gauge!==null){ const g=Math.max(0,Math.min(100,gauge)); h+=`<div class="g gg${g>=100?' full':''}"><i style="width:${g}%"></i><b><em>ゲージ</em><span>${g>=100?'MAX':Math.floor(g)}</span></b></div>`; }
  return h;
}
// 戦闘中、溜めて撃つパッシブの溜まり具合を名前の横に出す
function stackLabel(u){ if(!u||!u.kit) return ''; const out=[]; if(u.ki>0) out.push('気'+u.ki);
  for(const d of u.kit.P){ if(d.need && u.P&&u.P[d.id]) out.push(`${d.stack}${u.stk[d.id]||0}/${d.need}`); }
  if(u.learn>0) out.push('覚え'+u.learn);
  if(u.cover>0) out.push('かばう');
  if(u.shield>0) out.push('盾');
  return out.length?`<span class="stkb">${out.join(' ')}</span>`:''; }
function renderTop(battleUnits){
  if(typeof SIM!=='undefined' && SIM.on) return;
  const el=battleUnits?$('bparty'):$('top'); let h='';
  const names = battleUnits ? battleUnits.map(u=>u.name) : G.party;
  for(let i=0;i<4;i++){
    const n=names[i]; if(!n){h+='<div class="chip" style="opacity:.25"></div>';continue;}
    let hp,mhp,gauge=null,st='',act=false,dead=false;
    if(battleUnits){ const u=battleUnits[i]; hp=u.hp;mhp=u.mhp;gauge=u.gauge; const ks=Object.keys(u.st||{}); if(ks.length) st=STATUSJP[ks[0]]; act=u.active; dead=u.hp<=0; }
    else { const m=G.members[n], s=calcStats(n); hp=m.hp;mhp=s.hp; dead=hp<=0; }
    const lv=G.members[n].lv;
    if(battleUnits){ const u=battleUnits[i];
      h+=`<div class="chip bchip${act?' act':''}${dead?' dead':''}">${st?`<span class="st">${st}</span>`:''}<img class="bicon${u.pose&&!dead?' pose':''}" src="${spriteURL(n,dead?'ko':u.pose?'pose':0)}">${stackLabel(u)}<div class="bin"><div class="nm"><span>${n}</span><span>Lv${lv}</span></div>${gaugeHTML(hp,mhp,gauge)}</div></div>`; continue; }
    h+=`<div class="chip${act?' act':''}${dead?' dead':''}">${st?`<span class="st">${st}</span>`:''}<div class="nm"><span>${n}</span><span>Lv${lv}</span></div>
    ${gaugeHTML(hp,mhp)}</div>`;
  }
  el.innerHTML=h;
}
function renderHud(){
  if(!G) return;
  let l=''; if(RT.mode==='world') l='世界地図'; else if(RT.map){ l=RT.map.room?RT.map.room:LOCS[RT.map.id].n; if(RT.map.room){} else if(RT.map.throne) l+='  玉座の間'; else if(RT.map.floor!==undefined && LOCS[RT.map.id].floors>1) l+=`  ${RT.map.floor+1}F`; }
  const intro=!!(RT.dark||RT.dream); $('hud').style.display=(intro||RT.mode==='battle'||$('msg').style.display==='block')?'none':'flex'; $('top').style.visibility=intro?'hidden':''; $('padField').style.visibility=intro?'hidden':'';
  $('hudL').textContent=l; $('hudR').textContent=`${G.gold.toLocaleString()} G`;
}

// ---------- 会話 ----------
let msgResolve=null;
async function say(who,text){ if(typeof stageSpeaker==='function') await stageSpeaker(who); return say0(who,text); }
// 文字はゆっくり流れ、2文字ごとに「ピッ」。句読点で少し間を置く。
// 流れている途中でタップ → その枠の最後まで一気に出す。出し終わると ▼ が点滅し、もう一度タップで次へ
const MSG_SPEED=42;
function blip(narr){ if(typeof SIM!=='undefined'&&SIM.on) return; if(typeof soundOn==='function'&&!soundOn()) return; if(typeof tone==='function') tone(740,0.03,'triangle',0.025); }
function say0(who,text){
  return new Promise(res=>{
    const el=$('msg'); el.style.display='block'; const center=!!(RT.dark||RT.dream); el.classList.toggle('center',center); el.classList.remove('done');
    const face=center?null:speakerFace(who);
    const shown=who&&who.includes('|')?who.split('|')[0]:who; // 「？？？|ミナ」＝名前は伏せて、顔はミナ
    el.innerHTML=(face?`<img class="mface" src="${face}">`:'')+(shown?`<div class="who">${shown}</div>`:'')+'<div class="tx"></div><div class="nx">▼</div>';
    const tx=el.querySelector('.tx'); let i=0, done=false, tm=null, voiced=0;
    // 色つきの文字（装備名など）も、最初から色のまま1文字ずつ出す。行の折り返しも最初から最後の形で決まる
    const html=/<[a-z]/i.test(text), src=(html?text:text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))).replace(/\n/g,'<br>');
    tx.innerHTML=src; const units=[];
    const walk=n=>{ for(const ch of [...n.childNodes]){
      if(ch.nodeType===3){ const fr=document.createDocumentFragment(); for(const c of [...ch.data]){ const sp=document.createElement('span'); sp.textContent=c; sp.style.visibility='hidden'; fr.append(sp); units.push({sp,c}); } ch.replaceWith(fr); }
      else if(ch.nodeName==='BR') units.push({c:'\n'}); else walk(ch); } };
    walk(tx); const chars=units.map(u=>u.c);
    const fin=()=>{ clearTimeout(tm); for(const u of units) if(u.sp) u.sp.style.visibility=''; done=true; el.classList.add('done'); };
    const step=()=>{
      const u=units[i++], c=u&&u.c; if(u&&u.sp) u.sp.style.visibility='';
      if(c && !/[\s、。，．！？!?…・「」『』（）()―ー〜~]/.test(c)){ if(voiced++%2===0) blip(!who); }
      if(i>=chars.length){ fin(); return; }
      const wait=/[。！？!?]/.test(c)?MSG_SPEED*5:/[、，]/.test(c)?MSG_SPEED*3:c==='…'?MSG_SPEED*2:(c==='\n'?MSG_SPEED*3:MSG_SPEED);
      tm=setTimeout(step,wait);
    };
    tm=setTimeout(step,60);
    msgResolve=()=>{ if(!done){ fin(); return; } msgResolve=null; el.classList.remove('done'); el.style.display='none'; sfx('tick'); res(); };
  });
}
function advanceMsg(){ if(msgResolve) msgResolve(); }
$('msg').addEventListener('pointerdown',e=>{e.preventDefault();advanceMsg();});
function choose(prompt, opts, cols){
  return new Promise(res=>{
    if(prompt){ const el=$('msg'); el.style.display='block'; el.innerHTML=`<div class="tx">${prompt}</div>`; }
    showPanel(`<div class="grid scroll" style="grid-template-columns:repeat(${cols||(opts.length>3?2:1)},1fr);overflow-y:auto;min-height:0;flex:1;align-content:start">${opts.map((o,i)=>`<button class="cb" data-i="${i}">${o}</button>`).join('')}</div>`);
    $('panel').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ sfx('ok'); hidePanel(); $('msg').style.display='none'; res(+b.dataset.i); });
  });
}
function showPanel(html){ const p=$('panel'); p.innerHTML=html; p.style.display='flex'; $('padField').style.display='none'; }
function hidePanel(){ $('panel').style.display='none'; $('panel').innerHTML=''; if(RT.mode==='field') $('padField').style.display='flex'; }
function toast(t,cls){ const d=document.createElement('div'); d.className='tst '+(cls||''); d.innerHTML=t; $('toast').appendChild(d); setTimeout(()=>d.remove(),1700); }
async function fade(out){ const f=$('fade'); f.style.opacity=out?1:0; await sleep(460); }

// ---------- 入力 ----------
// ---------- 操作：画面のどこでもドラッグで移動／タップで調べる ----------
const APP=$('app'), knob=$('knob'), kb=$('knobBase'); let joyO=null;
function fieldUI(){ return RT.mode==='field' && $('screen').style.display!=='flex' && $('title').style.display==='none' && $('panel').style.display!=='flex'; }
function syncLayout(){ const fm=RT.mode==='field' && $('panel').style.display!=='flex', bm=RT.mode==='battle', wm=RT.mode==='world'; if(APP.classList.contains('fm')!==fm || APP.classList.contains('bm')!==bm || APP.classList.contains('wm')!==wm){ APP.classList.toggle('fm',fm); APP.classList.toggle('bm',bm); APP.classList.toggle('wm',wm); resizeCanvas(); } }
setInterval(syncLayout,50);
APP.addEventListener('pointerdown',e=>{
  if(!fieldUI() || e.target.closest('button,#top,#msg,#panel,#screen')) return;
  e.preventDefault(); audioUnlock(); try{ APP.setPointerCapture(e.pointerId); }catch(_){}
  const r=APP.getBoundingClientRect(); joyO={id:e.pointerId,x:e.clientX-r.left,y:e.clientY-r.top,cx:e.clientX,cy:e.clientY,t:performance.now(),drag:false};
});
APP.addEventListener('pointermove',e=>{ if(!joyO||e.pointerId!==joyO.id) return;
  const dx=e.clientX-joyO.cx, dy=e.clientY-joyO.cy, d=Math.hypot(dx,dy);
  if(!joyO.drag && d>10){ joyO.drag=true; kb.style.left=knob.style.left=joyO.x+'px'; kb.style.top=knob.style.top=joyO.y+'px'; kb.style.display=knob.style.display='block'; }
  if(!joyO.drag) return;
  const k=Math.min(1,40/Math.max(1,d)); knob.style.left=(joyO.x+dx*k)+'px'; knob.style.top=(joyO.y+dy*k)+'px';
  RT.dir = d<12?null:(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')); });
function tapAt(clientX,clientY){
  if(msgResolve){ advanceMsg(); return; }
  if(RT.mode!=='field'||RT.busy||RT.moving||!RT.cam) return;
  // タップした場所が主人公のとなりなら、そちらを向いてから調べる
  const r=cv.getBoundingClientRect(), sc=Math.min(r.width/VW, r.height/VH);
  const ox=r.left+(r.width-VW*sc)/2, oy=r.top+(r.height-VH*sc)/2;
  const tx=Math.floor(((clientX-ox)/sc+RT.cam.x)/TS), ty=Math.floor(((clientY-oy)/sc+RT.cam.y)/TS+4/TS);
  const ddx=tx-G.x, ddy=ty-G.y; if(Math.abs(ddx)+Math.abs(ddy)===1) G.dir=ddx>0?'right':ddx<0?'left':ddy>0?'down':'up';
  interact();
}
const joyEnd=e=>{ if(!joyO) return; const o=joyO; joyO=null; RT.dir=null; kb.style.display=knob.style.display='none';
  if(e && e.type==='pointerup' && !o.drag && performance.now()-o.t<400) tapAt(e.clientX,e.clientY); };
APP.addEventListener('pointerup',joyEnd); APP.addEventListener('pointercancel',joyEnd);
// 長押しで会話を早送り（選択肢が出たら止まる）
let ffHold=null, ffIv=null;
document.addEventListener('pointerdown',e=>{ if(e.target.closest('button,#screen,#title,#panel')) return; clearTimeout(ffHold); ffHold=setTimeout(()=>{ if(!msgResolve) return; ffIv=setInterval(()=>{ if(msgResolve){ msgResolve(); if(msgResolve) msgResolve(); } },90); },450); });
const ffStop=()=>{ clearTimeout(ffHold); clearInterval(ffIv); ffIv=null; };
document.addEventListener('pointerup',ffStop); document.addEventListener('pointercancel',ffStop);
// メッセージ表示中は、どこをタップしても次へ（ボタンや選択肢以外）
document.addEventListener('pointerdown',e=>{ if(msgResolve && !fieldUI() && RT.mode!=='battle' && !e.target.closest('button,#panel,#screen,#msg,#title')) advanceMsg(); });
$('bM').onclick=()=>{ audioUnlock(); if(RT.mode==='field'&&!RT.busy&&!RT.moving&&!msgResolve) openMenu(); };
const KEYD={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
document.addEventListener('keydown',e=>{ if(KEYD[e.key]){RT.dir=KEYD[e.key];e.preventDefault();}
  else if(e.key==='Enter'||e.key===' '||e.key==='z'){ e.preventDefault(); if(msgResolve)advanceMsg(); else if(RT.mode==='field'&&!RT.busy&&!RT.moving) interact(); }
  else if(e.key==='Escape'||e.key==='x'){ if(RT.mode==='field'&&!RT.busy&&!msgResolve) openMenu(); } });
document.addEventListener('keyup',e=>{ if(KEYD[e.key]&&RT.dir===KEYD[e.key]) RT.dir=null; });
document.addEventListener('touchmove',e=>{ if(!e.target.closest('.scroll')) e.preventDefault(); },{passive:false});
document.addEventListener('gesturestart',e=>e.preventDefault());
document.addEventListener('dblclick',e=>e.preventDefault());

const DXY={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
// 1マス進むのにかかる時間（ミリ秒）。人やイベントで歩く村人も同じ速さにそろえる
const STEP_MS=150;
// 足のコマは進む速さと切り離して、歩き出した時からこのリズムで回す：片足を前→両足そろう→逆の足を前→両足そろう
const WALK_BEATS=[[0,150],[1,100],[2,150],[1,100]], WALK_CYCLE=500;
function walkCol(t){ t=((t%WALK_CYCLE)+WALK_CYCLE)%WALK_CYCLE; for(const [c,d] of WALK_BEATS){ if(t<d) return c; t-=d; } return 1; }
function partyWalking(){ return !!RT.moving || (RT.lastStepEnd && performance.now()-RT.lastStepEnd<60); }
function stepLoop(){
  if(RT.saveWhenFree!==undefined && RT.saveWhenFree!==false && G && RT.mode==='field' && !RT.busy && !RT.event && !msgResolve && RT.map && $('screen').style.display!=='flex'){ if(G.chapter===RT.saveWhenFree) doSave(); RT.saveWhenFree=false; }
  if(RT.mode==='field' && !RT.busy && !RT.moving && !msgResolve && RT.dir && $('screen').style.display!=='flex'){
    const [dx,dy]=DXY[RT.dir]; G.dir=RT.dir; const nx=G.x+dx, ny=G.y+dy, m=RT.map;
    if(m.town && ny>=m.h-1 && (nx===9||nx===10)){ leaveToWorld(); return; }
    if(walkable(m,nx,ny)){
      RT.trail.unshift({x:G.x,y:G.y,dir:(RT.trail[0]&&RT.trail[0].x===G.x&&RT.trail[0].y===G.y)?RT.trail[0].dir:G.dir}); RT.trail.length=4;
      if(!partyWalking()) RT.walkT0=performance.now(); RT.stepN=(RT.stepN||0)+1; RT.moving={fx:G.x,fy:G.y,t0:performance.now(),dur:STEP_MS}; G.x=nx; G.y=ny;
      setTimeout(()=>{ RT.moving=null; RT.lastStepEnd=performance.now(); onStep(); },STEP_MS);
    }
  }
}
setInterval(stepLoop,20);

function frame(){ RT.anim++; cx.setTransform(VS,0,0,VS,0,0); cx.imageSmoothingEnabled=false; if(RT.dream&&typeof drawDream==='function'){ drawDream(); } else if(RT.dark){ cx.fillStyle='#000'; cx.fillRect(0,0,VW,VH); } else if(RT.mode==='field') drawField(); else if(RT.mode==='world') drawWorld(); else if(RT.mode==='battle' && typeof drawBattle==='function') drawBattle(); renderHud(); requestAnimationFrame(frame); }

// ---------- 場所の出入り ----------
function enterMap(id, floor, pos){
  const L=LOCS[id]; G.loc=id; G.floor=floor||0;
  RT.map = L.type==='dungeon'? genDungeon(id,G.floor) : genTown(id);
  if(RT.map.town) decorateTown(RT.map);
  const p = pos || RT.map.start; G.x=p.x; G.y=p.y; RT.trail=[0,1,2,3].map(()=>({x:p.x,y:p.y,dir:G.dir||'down'})); RT.mode='field'; RT.encounterIn=ri(14,26);
  $('padField').style.display='flex'; hidePanel();
  if(typeof BGM!=='undefined' && ['field','town','dungeon'].includes(BGM.name)) bgm('field');
  if(!G.visited[id]){ G.visited[id]=1; }
  renderTop();
}
async function arrive(id){
  await fade(true); enterMap(id,0); await fade(false);
  toast(LOCS[id].n);
  await runTrigger('enter_'+id);
}
async function leaveToWorld(){ RT.busy=true; if(RT.map) await runTrigger('leave_'+RT.map.id); RT.busy=true; await fade(true); RT.mode='world'; RT.map=null; await fade(false); RT.busy=false; openWorld(); }
async function onStep(){
  const m=RT.map; G.steps++; if(G.holy>0) G.holy--;
  // 階段
  const o=m.objs.find(o=>o.x===G.x&&o.y===G.y&&!o.gone);
  if(o && o.type==='door' && m.room && typeof leaveRoom==='function'){ await leaveRoom(); return; }
  if(o && (o.type==='up'||o.type==='down')){
    RT.busy=true;
    // 記憶の迷宮：階段が「持ち帰るか、潜るか」を決める場所。下りは一方通行
    if(m.id==='maze' && (o.type==='down'||o.type==='up')){
      const down=o.type==='down', next=down? mazePotFor(m.floor+1) : 0;
      const c=await choose(`${down?'階段が、さらに深い記憶へ続いている。':'迷宮の入口だ。'}\n${mazeBag()}${down?`\n潜れば、記憶のかけら+${next}。ただし倒れたら、すべて失う。`:''}`, down?['深く潜る','持ち帰る（外へ出る）','まだ見て回る']:['持ち帰る（外へ出る）','まだ見て回る']);
      if(down && c===0){ /* 下へ */ }
      else if((down&&c===1)||(!down&&c===0)){ await fade(true); RT.mode='world'; RT.map=null; await fade(false); await mazeSecure(); RT.busy=false; openWorld(); return; }
      else { RT.busy=false; return; } }
    sfx('stairs'); await fade(true);
    if(o.type==='up'){ if(m.floor===0){ RT.mode='world'; RT.map=null; await fade(false); RT.busy=false; openWorld(); return; }
      enterMap(m.id,m.floor-1); const d=RT.map.objs.find(x=>x.type==='down');
      // 下り階段のとなりに出る。仲間も同じ場所へ（前は、仲間だけ階のスタート地点に残って、あとから飛んできていた）
      const q=[[0,1],[0,-1],[1,0],[-1,0]].map(([dx,dy])=>({x:d.x+dx,y:d.y+dy})).find(p=>walkable(RT.map,p.x,p.y))||{x:d.x,y:d.y+1};
      G.x=q.x; G.y=q.y; RT.trail=[0,1,2,3].map(()=>({x:G.x,y:G.y,dir:G.dir||'down'})); }
    else { enterMap(m.id,m.floor+1); if(m.id==='maze'){ G.mazeFF=0; const p=mazePotFor(RT.map.floor); G.mazePot=(G.mazePot||0)+p; toast(`記憶のかけら +${p}（持ち帰るまでは仮）`); } }
    await fade(false); RT.busy=false; return;
  }
  if(!m.town && !m.safe){ RT.encounterIn -= (G.holy>0?0.5:1); if(RT.encounterIn<=0){ RT.encounterIn=ri(14,26); RT.busy=true; const post=LOCS[m.id].post; let fadeN=0; if(m.id==='maze'){ G.mazeFF=(G.mazeFF||0)+1; fadeN=Math.max(0,G.mazeFF-MAZE_FADE_AT); if(fadeN===1) await say('','……あたりの景色が、薄れはじめた。\nこの階の記憶は尽きかけている。もう何も見つからず、魔物はどんどん強くなる。'); }
    const r=post? await randomBattle(POST_AREA0+Math.min(3,Math.floor((G.flags.mazeNo||0)/3)), m.id, {lv:(m.id==='tomb'?96:mazeLv())+ri(0,2)+(m.floor||0), maze:true, post:true, depth:m.floor||0, fade:fadeN}) : m.id==='nest'? await randomBattle(Math.min(20,LOCS[G.next]?LOCS[G.next].area:13), m.id, {lv:avgLv()+1, glow:0.3}) : await randomBattle(LOCS[m.id].area, m.id); RT.busy=false; if(r==='lose') return; } }
}
function facing(){ const [dx,dy]=DXY[G.dir]; return {x:G.x+dx,y:G.y+dy}; }
async function interact(){
  const f=facing(), m=RT.map;
  const npc=m.npcs.find(n=>n.x===f.x&&n.y===f.y&&!n.gone);
  const o=m.objs.find(o=>o.x===f.x&&o.y===f.y&&!o.gone);
  RT.busy=true;
  try{
    if(npc){ await talkNpc(npc); }
    else if(o){
      if(o.type==='save') await saveStone();
      else if(o.type==='spring') await mazeSpring();
      else if(o.type==='chest') await openChest(o);
      else if(o.type==='boss' && m.id==='castle' && !m.throne && bossDone() && G.chapter===0 && !G.flags.maou_seen){ sfx('door'); await fade(true); enterThrone(); await fade(false); }
      else if(o.type==='boss' && !bossDone()) await runTrigger('boss_'+m.id);
      else if(o.type==='body'||o.type==='fallen'){ if(o.ev) await runTrigger(o.ev); else if(o.say) await say('',o.say); }
      else if(o.say) await say('',o.say);
      else if(o.type==='goal' && !goalDone()) await runTrigger('goal_'+m.id);
      else if(o.type==='sign'){ const n=m.npcs.find(n=>n.kind===o.kind); if(n) await talkNpc(n); }
    } else if(m.id==='sora' && m.town && f.x===15 && f.y===17 && typeof enterHome==='function'){ await enterHome(); }
    else { await runTrigger('look_'+m.id); }
  } finally { RT.busy=false; renderTop(); }
}
function bossDone(){ const m=RT.map; if(typeof bossReopen==='function' && bossReopen(m.id)) return false; if(m.id==='maze') return false; return !!G.flags['boss_'+m.id+(m.id==='maze'?'_'+(G.flags.mazeNo||0):'')]; }
function goalDone(){ return !!G.flags['goal_'+RT.map.id]; }
async function openChest(o){
  const k=chestKey(o); if(G.flags[k]){ await say('','からっぽだ。'); return; }
  G.flags[k]=1; sfx('chest');
  const post=LOCS[RT.map.id].post;
  const lv=locLv(RT.map.id)+(post?mazeLv()-locLv(RT.map.id):0);
  // 記憶の迷宮は潜るたびに変わる。それ以外の宝箱は、この周で1回だけ中身が決まる（ロードしても同じ）
  const roll=()=>{ if(Math.random()<0.18) return {bk: bookOf(post? (Math.random()<0.3?3:2) : (Math.random()<0.35?2:1))};
    if(Math.random()<0.55){ let r=rollRarity(false,30); if(Math.random()<.4) r=Math.min(4,r+1); return {it:makeItem(randomSlot(), lv, r)}; }
    return {g:Math.round(enemyGold(lv)*ri(4,8)), ik:pick(['herb','herb','herb2','herb2','feather','rope'])}; };
  const c=post? roll() : withRunSeed(k, roll);
  if(c.it){ const it=c.it; it.id=G.nid++; gainItem(it); if(it.r>=3) sfx('rare'); await say('',`宝箱を開けた！\n${itemName(it)} を手に入れた！`); }
  else if(c.bk){ G.inv[c.bk]=(G.inv[c.bk]||0)+1; sfx('rare'); await say('',`宝箱を開けた！\n${ITEMS[c.bk].n} を手に入れた！`+(G.flags.bookTip?'':'\nメニューの「スキル」で、スキルを強くできる。')); G.flags.bookTip=1; }
  else { G.gold+=c.g; if(ITEMS[c.ik].ch<=G.chapter){ G.inv[c.ik]=(G.inv[c.ik]||0)+1; } await say('',`宝箱を開けた！\n${c.g}ゴールドと ${ITEMS[c.ik].n} を手に入れた！`); }
}
async function saveStone(){
  const c=await choose('光る石だ。不思議と、心が落ち着く。',['セーブする','やめる']);
  if(c!==0) return;
  // どの記録に書くか。いまの記録はそのまま、ほかの記録が埋まっていたら上書きを確かめる
  const cur=RT.slot||1; const ss=[1,2,3].map(k=>loadSave(slotKey(k)));
  const k=await choose('どの記録に書き残す？',[1,2,3].map(k=>slotLabel(k,ss[k-1],k===cur)).concat(['やめる']),1);
  if(k>=3) return; const slot=k+1;
  if(slot!==cur && ss[k]){ const ok=await choose(`記録${slot}には、別の冒険が書かれている。\n${saveInfo(ss[k])}\n上書きする？`,['上書きする','やめる']); if(ok!==0) return; }
  doSave(false, slot); sfx('save'); await say('',`冒険の記録を書き残した。（記録${slot}）`);
}
// 記憶の迷宮から外へ出たとき：持ち帰った物を確定させる（自動で記録）
// 番人の手前の泉：1回の挑戦で一度だけ、全員の傷が治る（倒れた仲間も起き上がる）
async function mazeSpring(){ if(G.flags.springAt===G.mazeEntry){ await say('','泉は静まりかえっている。'); return; }
  G.flags.springAt=G.mazeEntry; for(const n in G.members){ const s=calcStats(n); G.members[n].hp=s.hp; } sfx('heal'); renderTop(); await say('','澄んだ泉だ。手をひたすと、みんなの傷がふさがった。\nこの先に、番人の気配がする。'); }
// 1つの階で戦える回数の目安。これを超えると、その階の記憶が薄れる（何も落とさなくなり、魔物が強くなっていく）
const MAZE_FADE_AT=7;
// 階を下りるごとに増える「記憶のかけら」（錬成の素材になる）。深いほど、奥の迷宮ほど多い
function mazePotFor(f){ return Math.round((4+4*f)*(1+0.15*(G.flags.mazeNo||0))); }
function mazeBag(){ const n=G.mazeLoot||0, p=G.mazePot||0; return n||p? `持ち帰れる物：装備${n}個・記憶のかけら${p}` : 'まだ何も見つけていない。'; }
async function mazeSecure(inTown){ const n=G.mazeLoot||0, p=G.mazePot||0; G.mat=(G.mat||0)+p; G.inMaze=0; G.mazeLoot=0; G.mazePot=0; G.mazeFF=0; doSave(!inTown); sfx('save'); toast(n||p?`持ち帰った：装備${n}個・素材${p}（自動で記録した）`:'迷宮から戻った（自動で記録した）'); }
// 記録は3つ。記録1は前からの保存場所をそのまま使う（前のセーブは記録1になる）
const SAVE_SLOTS=3;
function slotKey(k){ k=k||RT.slot||1; return k===1?'mzy_save':'mzy_save'+k; }
function doSave(atWorld, slot){ try{ if(slot) RT.slot=slot; G.slot=RT.slot||1; G.saveLoc= atWorld? {loc:'__world',floor:0,x:0,y:0} : {loc:G.loc,floor:G.floor,x:G.x,y:G.y}; G.savedAt=Date.now(); kvSet(slotKey(),JSON.stringify(G)); kvDel('mzy_suspend'); }catch(e){ toast('この環境ではセーブできませんでした'); } }
function loadSave(key){ try{ const s=kvGet(key||slotKey()); return s?JSON.parse(s):null; }catch(e){return null;} }
// 記録の見出し（何章・どこ・Lv・いつ）
function saveInfo(s){ if(!s) return ''; const sl=s.saveLoc||{}; const place=sl.loc==='__world'||!LOCS[sl.loc]?'世界地図':LOCS[sl.loc].n+(LOCS[sl.loc].type==='dungeon'&&LOCS[sl.loc].floors>1?` ${(sl.floor||0)+1}階`:'');
  const lv=s.members&&s.members['アルト']?s.members['アルト'].lv:1; return `${(CHAPTERS[s.chapter]||'').split('　')[0]}・${place}・Lv${lv}`; }
function saveWhen(s){ if(!s||!s.savedAt) return ''; const d=new Date(s.savedAt); const p=n=>String(n).padStart(2,'0'); return `${d.getMonth()+1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`; }
function slotLabel(k,s,cur){ return `<div class="slot"><b>記録${k}</b>${cur?'<span class="tag on">いまの記録</span>':''}<span class="sw">${s?saveWhen(s):''}</span></div><div class="ss">${s?saveInfo(s):'（空き）'}</div>`; }
function resumeFrom(state){
  G=state; RT.slot=state.slot||RT.slot||1; migrateItems(); if(!G.mats) G.mats={};
  // 前のセーブ：4章の終わりを過ぎていたら、影の里に戻れるように
  if(G.flags && G.flags.boss_temple && G.unlocked && !G.unlocked.includes('shadow')) G.unlocked.push('shadow');
  // イベントの途中で記録されたセーブを直す（済んだ出来事の先が開いていない、など）
  if(typeof storyRepair==='function'){ try{ const n=storyRepair(); if(n) setTimeout(()=>toast('記録を整えました'),600); }catch(e){} } META=loadMeta(); if(G.inv){ for(const k of ['ether','cure','smoke']) if(G.inv[k]){ G.inv.herb=(G.inv.herb||0)+G.inv[k]; delete G.inv[k]; } } if(G.runSeed===undefined) G.runSeed=hashStr(String(G.nid)+G.chapter+String(G.gold)); if(G.settings && !G.settings.v2){ G.settings.speed=1; G.settings.v2=1; } if(!G.saveLoc) G.saveLoc={loc:G.loc,floor:G.floor,x:G.x,y:G.y};
  removeCompare(); addCompare(true);
  if(G.loc==='__world'||G.saveLoc.loc==='__world'){ if(G.loc==='__world') G.loc='sora'; RT.mode='world'; RT.map=null; openWorld(); }
  else { enterMap(G.saveLoc.loc,G.saveLoc.floor,{x:G.saveLoc.x,y:G.saveLoc.y}); }
  renderTop();
}
