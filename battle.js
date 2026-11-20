// ===== 戦闘（完全オート） =====
let B = null;
const SIM = {on:false};            // バランス試算のときは表示と待ち時間を飛ばす
const BAL = {boss:1, mob:1};       // 試算で決めた調整（ボスHP・雑魚HP）
// ボスごとのHP・攻撃の調整（試算で、どの章も約8〜9ターンになるように合わせた）
const BOSS_TUNE = {hp:[0.55,0.74,0.80,0.90,0.85,0.89,0.74,0.77,0.94,0.85,0.75,0.55,1.30,1], atk:[1,1,1,1,1,1,1,1,1,1,1,1,0.75,1]};
const BOSS_TUNE2 = [1.07,1.26,1.12,1.40,1.39,1.26,1.48,1.44,1.56,1.22,1.77,1.60,1.70,1]; // スキル★制のあとの調整
// ふつうに進めたときのレベル・装備・★で、ボスの手応え（残りHP 4〜6割）がそろうように合わせた攻撃の倍率
const BOSS_ATK2 = [1,1.16,1.42,1.31,1.68,1.7,1.63,1.94,1.7,1.7,1.26,1.31,1.18,1]; // 全滅もありうる強さ（激レアを引けば押し切れる）
const MAZE_HP = [2.0,2.0]; // 迷宮の番人（1番目→12番目）
// 番人ごとの攻撃・HPの倍率（迷宮で拾った装備で挑んで、ふつうは苦戦・激レアがあれば押し切れるように合わせる）
const MAZE_ATK = [1.05,1.55,1.5,1.55,1.05,1.16,1.8,1.62,1.6,1.6,1.8,1.08], MAZE_HPK = [1.15,1.15,1.15,1.15,1.15,1.15,1.15,1.15,1.15,1.15,1.15,1.15];
const NOAH_HP = 1.04; // 最終戦のノアのHP（仲間だったときの強さから決める）
const MOB_HP_CH = [1.0, 2.3, 2.1, 2.05, 2.0, 1.9, 1.9, 1.9]; // 章ごとの雑魚HP
const MOB_ATK_CH = [1, 1.05, 1.05, 1.05, 1.05, 1.05, 1.05, 1]; // 章ごとの雑魚の攻撃（ダンジョンでじわじわ削られる厳しさは残す）
const TYPEK = {'普':[1,1,1,1],'硬':[1.3,.9,1.6,.85],'攻':[.8,1.25,.8,1],'魔':[.8,1.15,.7,1],'速':[.7,1,.8,1.3],'大':[1.8,1.1,1.1,.8],'補':[.9,.8,1,1]};
function areaBase(L){
  const i=Math.max(1,L-2);
  const Ap=gradeVal('atk','B',L)+(6+3*i)+Math.round(i*0.2);
  const Dp=gradeVal('def','B',L)+Math.round(4+1.7*i)+2*Math.round(2+0.8*i);
  const Hp=gradeVal('hp','B',L)+Math.round(i*3.6);
  const De=Math.round(Ap*0.5); const He=dmgF(Ap,De)*2.6;
  const solve=t=>(t+Math.sqrt(t*t+4*t*Dp))/2;
  return {He,Ae:solve(0.11*Hp),Ab:solve(0.2*Hp),De,Hp,Dp,Ap,spd:gradeVal('spd','B',L)};
}
function enemyShape(n){
  if(/プルリン/.test(n))return'blob';
  if(/コウモリ|カラス|ウミネコ|ハゲワシ|羽虫|天使/.test(n))return'bird';
  if(/霊|亡霊|影|精|ガス|灯火/.test(n))return'ghost';
  if(/キノコ|草/.test(n))return'plant';
  if(/石像|巨人|泥人形|瓦礫|鎧|番人|守り手|書庫|ゴーレム|木人/.test(n))return'golem';
  if(/イカ|カニ|フナムシ|紙魚|ナメクジ|ミミズ|サソリ|蛇|ザメ/.test(n))return'crawler';
  if(/本|壺|旗|インク|氷柱/.test(n))return'object';
  if(/オオカミ|犬|猟犬|ネズミ|ウサギ|トカゲ|獣|雪男|ゴブリン|カエル/.test(n))return'beast';
  return'human';
}
function makeEnemy(areaIdx, ei, lvOverride, prefix){
  const area=ENEMY_AREAS[areaIdx]; const [nm,tp,w,r,feat,drop]=area[2][ei];
  const L=lvOverride||area[1]; const b=areaBase(L); const k=TYPEK[tp]||TYPEK['普'];
  const mhp=Math.round(b.He*k[0]*MOB_HP_CH[Math.min(7,G.chapter)]*(prefix?1.3:1)*BAL.mob*(G.chapter>=1?DIFF.mobHp:1));
  const ak=(MOB_ATK_CH[Math.min(7,G.chapter)]||1)*(G.chapter>=1?DIFF.mobAtk:1);
  return {name:(prefix||'')+nm, dexName:nm, isEnemy:true, lv:L, hp:mhp, mhp, mp:999, mmp:999, atk:Math.round(b.Ae*k[1]*1.45*(prefix?1.3:1)*ak), def:Math.round(b.De*k[2]), mat:Math.round(b.Ae*k[1]*1.45*(prefix?1.3:1)*ak), mdf:Math.round(b.De*k[2]*0.9),
    spd:Math.round(b.spd*k[3]*(feat.includes('先に動きやすい')?1.3:1)), weak:JPEL[w], resist:JPEL[r], feat, tp, drop, exp:enemyExp(L)*(prefix?1.4:1), gold:enemyGold(L)*(prefix?1.3:1),
    shape:enemyShape(nm), col:'hsl('+(hashStr(nm)%360)+',55%,55%)', st:{}, buff:{}, crit:feat.includes('会心が出やすい')?20:0, critDmg:0, critDef:0};
}
const BOSSDEF = [
  {sh:'golem',col:'#6b7280',ab:['guard']},
  {sh:'beast',col:'#a16207',ab:['aoe']},
  {sh:'zagan',col:'#111827',ab:['charge']},
  {sh:'crawler',col:'#15803d',ab:['poison','aoe']},
  {sh:'ghost',col:'#4c1d95',ab:['dark']},
  {sh:'crawler',col:'#0e7490',ab:['aoe']},
  {sh:'golem',col:'#b45309',ab:['blindAoe']},
  {sh:'zagan',col:'#111827',ab:['charge','learn']},
  {sh:'dragon',col:'#7dd3fc',ab:['iceAoe']},
  {sh:'human',col:'#e5e7eb',ab:['light','defUp']},
  {sh:'beast',col:'#57534e',ab:['summon']},
  {sh:'seil',col:'#fef3c7',ab:['holyAoe','summon','selfHeal']},
  {sh:'void',col:'#1e1b4b',ab:['darkAoe','twice']},
  {sh:'noah',col:'#8b5cf6',ab:['noah']},
];
// 全体の強さ（錬成で鍛える遊び方を前提に、全体を引き上げる）。ボス・迷宮の番人・雑魚それぞれ
const DIFF={bossAtk:1, bossHp:1, mazeAtk:1.15, mazeHp:1.1, mobAtk:1.08, mobHp:1.08};
// ボスごとの上乗せ。序盤はまだ錬成の素材が少ないので控えめ、中盤からしっかり（HPは攻撃の上乗せの3分の2）
const BOSS_UP=[1,1,1,1.05,1.03,1.04,1.12,1.12,1.07,1.28,1.32,1.22,1.08,1];
function makeBoss(idx, L, mazeMul){
  const [ch,nm,place,w,feat]=BOSS_LIST[idx]; const b=areaBase(L); const d=BOSSDEF[idx];
  const mul=mazeMul||1, hpMul=idx===11?1.4:(idx===12&&!mazeMul)?0.9:1;
  const mhp=Math.round(dmgF(b.Ap,b.De)*32*1.3*1.25*hpMul*mul*(idx===0?0.6:1)*BAL.boss*(mazeMul?1:BOSS_TUNE.hp[idx]*BOSS_TUNE2[idx]));
  const e={name:nm, isEnemy:true, boss:true, bidx:idx, lv:L, hp:mhp, mhp, mp:9999, mmp:9999, atk:Math.round(b.Ab*1.35*mul*(mazeMul?1:BOSS_TUNE.atk[idx]*BOSS_ATK2[idx])), def:Math.round(b.De*1.1), mat:Math.round(b.Ab*1.35*mul*(mazeMul?1:BOSS_TUNE.atk[idx]*BOSS_ATK2[idx])), mdf:Math.round(b.De),
    spd:Math.round(b.spd*1.1), weak:JPEL[w]||null, resist:null, feat, ab:d.ab, exp:enemyExp(L)*10, gold:enemyGold(L)*8, shape:d.sh, col:d.col, st:{}, buff:{}, crit:5, critDmg:0, critDef:20, big:1};
  if(idx>0 && idx<13){ const up=mazeMul?1:BOSS_UP[idx], fa=(mazeMul?DIFF.mazeAtk:DIFF.bossAtk)*up, fh=(mazeMul?DIFF.mazeHp:DIFF.bossHp)*(1+(up-1)*0.67); e.atk=Math.round(e.atk*fa); e.mat=Math.round(e.mat*fa); e.mhp=e.hp=Math.round(e.mhp*fh); }
  if(d.ab.includes('learn')){ // 1章で一番使われた属性を覚えている
    const u=G.elemUse||{}; const top=Object.keys(u).sort((a,b)=>u[b]-u[a])[0]||'none';
    e.learned=top; if(top!=='none') e.resist=top; e.def=Math.round(e.def*(top==='none'?1.5:1.1));
  }
  if(idx===13){ // ノア：仲間だったときの強さ
    const ns=G.members['ノア'] ? calcStats('ノア') : null;
    if(ns){ e.mhp=e.hp=Math.round(Math.max(e.mhp*0.9, ns.hp*8)*NOAH_HP); e.mat=Math.max(e.mat, Math.round(ns.mat*1.8)); e.spd=Math.max(e.spd, ns.spd); e.noahLv=G.members['ノア'].lv; }
    e.autoRevive=1; e.exp=Math.round(expNeed(G.members['アルト'].lv)*1.05);
  }
  return e;
}

// ---------- ユニット（完全オート） ----------
function alive(arr){return arr.filter(u=>u.hp>0);}
function canAct(u){ return u.hp>0 && !u.st.sleep && !u.st.paralyze && !u.st.stop; }
// ゲージ：自分の行動で溜まる分は上限なし。味方のスキルからもらう分は1人1ターン30まで（無限に回らないように）
// ダメージの集計（リザルトで見せる）
function meter(u){ if(!B.meter[u.name]) B.meter[u.name]={dmg:0,heal:0,taken:0,acts:0,max:0,maxNm:'',crit:0,by:{},tby:{}}; return B.meter[u.name]; }
function meterAdd(u,skill,kind,v){ if(!u||u.isEnemy||!B) return; const M=meter(u); M[kind]+=v; if(kind==='taken'){ M.tby[skill]=(M.tby[skill]||0)+v; return; } const s=M.by[skill]||(M.by[skill]={dmg:0,heal:0,n:0,crit:0}); s[kind]+=v; if(kind==='dmg'&&v>M.max){M.max=v;M.maxNm=skill;} }

// ---------- 戦闘の開始 ----------
async function randomBattle(areaIdx, locId, opts){
  opts=opts||{};
  const area=ENEMY_AREAS[areaIdx]; const list=area[2];
  let n = G.chapter===0?ri(1,2):G.chapter<=2?ri(1,3):ri(2,4);
  const es=[]; for(let i=0;i<n;i++){ const ei=Math.floor(Math.random()*list.length); es.push(makeEnemy(areaIdx,ei,opts.lv,opts.prefix)); }
  if(es.some(e=>/群れ|2〜3体|数が多い/.test(e.feat)) && es.length<4) es.push(makeEnemy(areaIdx,list.findIndex(x=>/群れ|2〜3体|数が多い/.test(x[4])),opts.lv,opts.prefix));
  if(opts.post) for(const e of es) postScale(e,opts.depth);
  // 記憶が薄れた階：とどまるほど強くなる
  if(opts.fade) for(const e of es){ const f=1+0.15*opts.fade; e.mhp=e.hp=Math.round(e.mhp*f); e.atk=Math.round(e.atk*f); e.mat=Math.round(e.mat*f); }
  if(Math.random()<(opts.glow||0.015)){ es[0].glow=1; }
  return startBattle(es,{canRun:true, maze:opts.maze, depth:opts.depth||0, fade:opts.fade||0});
}
// 記憶の迷宮の敵：ふつうのダンジョンより手強く、深い階ほどさらに強い（そのぶん経験値も多い）
const POST_MOB={hp:1.4,atk:1.4,depth:0.05};
function postScale(e,depth){ const f=1+POST_MOB.depth*(depth||0); e.mhp=e.hp=Math.round(e.mhp*POST_MOB.hp*f); e.atk=Math.round(e.atk*POST_MOB.atk*f); e.mat=Math.round(e.mat*POST_MOB.atk*f); e.exp=Math.round(e.exp*1.4*(1+0.1*(depth||0))); e.gold=Math.round(e.gold*1.3); }
function mazeScale(e,k){ const f=k===undefined? MAZE_HP[1] : MAZE_HP[0]+(MAZE_HP[1]-MAZE_HP[0])*k/11; e.mhp=e.hp=Math.round(e.mhp*f*(k===undefined?1:MAZE_HPK[k])); if(k!==undefined){ e.atk=Math.round(e.atk*MAZE_ATK[k]); e.mat=Math.round(e.mat*MAZE_ATK[k]); } }
async function bossBattle(idx, extra){
  extra=extra||{}; const L=(extra.lv||locLv(G.loc))+1;
  const es=[makeBoss(idx,L,extra.mul)];
  if(extra.mazeK!==undefined){ const M=MAZE_BOSS[extra.mazeK]; const e=es[0]; e.name=M.nm; e.dexName=M.nm; e.shape=M.sh; e.col=M.col; e.weak=JPEL[M.w]||null; e.ab=M.ab; e.mazeK=extra.mazeK; }
  if(extra.zagan && typeof zaganSetup==='function') zaganSetup(es[0]);
  if(extra.maze) mazeScale(es[0], extra.mazeK);
  if(extra.adds) for(const a of extra.adds) es.push(makeEnemy(LOCS[G.loc].area,a,L-1));
  return startBattle(es,{canRun:false, boss:true, maze:extra.maze, noLose:extra.noLose, bgm:idx===13?'noahDark':'boss'});
}
async function startBattle(enemies, opts){
  const prevMode=RT.mode; RT.mode='battle'; RT.busy=true;
  B={enemies, party:G.party.map(partyUnit), turn:0, opts, pops:[], fx:[], shake:0, sel:-1, partySpd:0, meter:{}, queue:[]};
  // 人数が少ないときは敵を弱める（序盤は2〜3人）
  const np=alive(B.party).length; if(np<4){ const hm=[0.45,0.45,0.6,0.8][np], am=[0.6,0.6,0.75,0.9][np]; for(const e of enemies){ e.mhp=e.hp=Math.max(1,Math.round(e.mhp*hm)); e.atk=Math.round(e.atk*am); e.mat=Math.round(e.mat*am); } }
  $('padField').style.display='none'; showBattleBar(); renderTop(B.party);
  bgm(opts.bgm||'battle'); sfx('enc');
  for(const e of enemies){ e.x=0; }
  layoutEnemies();
  const names=[...new Set(enemies.map(e=>e.name))].join('、');
  await blog(`${names} が現れた！`, 700);
  await battleOpen();
  if(enemies.some(e=>e.glow)) await blog('光る敵がいる！ 倒すと良い装備を落とすぞ！',800);
  let result=null;
  while(!result){ result = await battleTurn(); if(!result && B.turn>=80) result='run'; }
  // 後片付け
  for(const u of B.party){ const m=G.members[u.name]; m.hp=Math.max(0,Math.min(u.hp,calcStats(u.name).hp)); }
  let out=result;
  if(result==='win') await battleWin();
  hidePanel(); $('msg').style.display='none';
  if(result==='lose' && !opts.noLose){ B=null; RT.mode=prevMode; await gameOver(); return 'lose'; }
  B=null; RT.mode=prevMode==='battle'?'field':prevMode; RT.busy=false;
  if(RT.mode==='field') $('padField').style.display='flex';
  bgm(RT.mode==='world'?'world':'field'); renderTop();
  return out;
}
// 戦闘中の下の帯：オートで進む。速さだけ変えられる
function showBattleBar(){
  showPanel(`<div class="bbar"><span class="bauto">オート戦闘中</span><div class="row" style="flex:0 0 auto;gap:6px">${[1,2,4].map(v=>`<button class="cb sm ${G.settings.speed===v?'on':''}" data-spd="${v}" style="min-width:58px">×${v}</button>`).join('')}</div></div>`);
  $('panel').querySelectorAll('[data-spd]').forEach(b=>b.onclick=()=>{ G.settings.speed=+b.dataset.spd; sfx('tick'); showBattleBar(); });
}

function layoutEnemies(){ const W=cv.width; const n=B.enemies.length; B.enemies.forEach((e,i)=>{ e.x= n>=4 ? W*(i+0.5)/n : W*(i+1)/(n+1); }); }

// ---------- 表示 ----------
async function blog(text, ms){ if(SIM.on) return; const el=$('msg'); el.style.display='block'; el.innerHTML=`<div class="tx">${text}</div>`; await sleep((ms||600)*1.6/G.settings.speed); }
// 1行足す（行動の結果）。3行まで
async function blogAdd(text, ms){ if(SIM.on) return; const el=$('msg'); el.style.display='block'; const ls=[...el.querySelectorAll('.tx')]; if(ls.length>=3) ls[0].remove(); el.insertAdjacentHTML('beforeend',`<div class="tx" style="font-size:14px;color:#e2e8f0">${text}</div>`); await sleep((ms||500)/G.settings.speed); }
function pop(target,text,color){
  if(SIM.on) return;
  if(target.isEnemy){ B.pops.push({t:target,text,color,born:performance.now()}); return; }
  const i=B.party.indexOf(target); const col=$('bpop').children[i]; if(!col) return;
  const d=document.createElement('div'); d.className='dpop'; d.style.color=color||'#fff'; d.textContent=text; col.appendChild(d); setTimeout(()=>d.remove(),1400);
  if(/^\d/.test(String(text))||/会心/.test(String(text))){ const ch=$('bparty').children[i]; if(ch){ ch.classList.remove('hit'); void ch.offsetWidth; ch.classList.add('hit'); } }
}
function drawBattle(){
  if(!B) return; const W=cv.width,H=cv.height; const th=THEMES[RT.map?RT.map.theme:'village']||THEMES.village;
  const g=cx.createLinearGradient(0,0,0,H); g.addColorStop(0,th.sky[0]); g.addColorStop(1,th.sky[1]); cx.fillStyle=g; cx.fillRect(0,0,W,H);
  cx.fillStyle=shade(th.floor,-.2); cx.beginPath(); cx.ellipse(W/2,H*0.6,W*0.7,H*0.16,0,0,7); cx.fill();
  const sx=B.shake>0?(Math.random()-.5)*8:0; if(B.shake>0)B.shake--;
  cx.save(); cx.translate(sx,0);
  const by=H*0.46;
  const nE=B.enemies.length; const base=nE>=4?1.0:nE===3?1.15:1.35;
  B.enemies.forEach((e,i)=>{ if(e.hp<=0&&!e.dying) return; const s=(e.big?1.6:(e.tp==='大'?1.25:1))*base;
    let a=1; if(e.dying){ a=Math.max(0,1-(performance.now()-e.dying)/400); if(a<=0){e.dying=0;} }
    cx.globalAlpha=a; if(e.flash && performance.now()-e.flash<160) cx.globalAlpha=a*0.35;
    drawEnemy(e, e.x, by - (e.big?20:0), s);
    cx.globalAlpha=1;
    if(e.hp>0){ const w=56*s; cx.fillStyle='#0008'; cx.fillRect(e.x-w/2,by+42*s,w,5); cx.fillStyle=e.hp/e.mhp<.3?'#f87171':'#4ade80'; cx.fillRect(e.x-w/2,by+42*s,w*e.hp/e.mhp,5);
      if(B.sel===i){ cx.strokeStyle='#facc15'; cx.lineWidth=2; if(e._box) cx.strokeRect(e._box.x-4,e._box.y-4,e._box.w+8,e._box.h+8); else cx.strokeRect(e.x-w/2-4,by-50*s,w+8,100*s); }
      const dr=G.dex&&G.dex.e[e.dexName||e.name]; if(dr&&dr.w&&e.weak){ cx.font='bold 10px sans-serif'; cx.textAlign='center'; cx.fillStyle='#000a'; cx.fillRect(e.x-20,by+48*s,40,13); cx.fillStyle=elemColor(e.weak); cx.fillText('弱:'+ELJP[e.weak],e.x,by+58*s); }
      const tx=[...Object.keys(e.st).map(k=>STX[k]||STATUSJP[k]), e.curse?'呪'+e.curse:'', e.vuln?'見抜':''].filter(Boolean); if(tx.length){ const yy=by+(dr&&dr.w&&e.weak?71:58)*s; cx.font='10px sans-serif'; cx.textAlign='center'; cx.fillStyle='#000a'; const tw=cx.measureText(tx.join(' ')).width+6; cx.fillRect(e.x-tw/2,yy-10,tw,13); cx.fillStyle='#fde68a'; cx.fillText(tx.join(' '),e.x,yy); } }
  });
  cx.restore();
  // エフェクト
  const now=performance.now();
  B.fx=B.fx.filter(f=>now-f.born<350);
  for(const f of B.fx){ const k=(now-f.born)/350; cx.globalAlpha=1-k; cx.strokeStyle=f.col; cx.lineWidth=4;
    if(f.kind==='slash'){ cx.beginPath(); cx.moveTo(f.x-30+k*10,f.y-30); cx.lineTo(f.x+30,f.y+30-k*10); cx.stroke(); }
    else { cx.beginPath(); cx.arc(f.x,f.y,10+k*40,0,7); cx.stroke(); }
    cx.globalAlpha=1; }
  // 行動順
  if(B.queue&&B.queue.length){ const rest=B.queue.slice(B.qi).filter(u=>u.hp>0).slice(0,7); let x=6; cx.font='bold 10px sans-serif'; cx.textAlign='left'; cx.textBaseline='middle';
    cx.fillStyle='#0008'; cx.fillRect(0,0,W,18); cx.fillStyle='#94a3b8'; cx.fillText('順番',x,9); x+=28;
    rest.forEach((u,i)=>{ const nm=u.name.length>5?u.name.slice(0,5):u.name; const w=cx.measureText(nm).width+10; cx.fillStyle=i===0?'#facc15':(u.isEnemy?'#7f1d1d':'#1e3a8a'); cx.fillRect(x,3,w,12); cx.fillStyle=i===0?'#111':'#fff'; cx.fillText(nm,x+5,9.5); x+=w+3; });
    cx.textBaseline='alphabetic'; }
  B.pops=B.pops.filter(p=>now-p.born<1300);
  for(const p of B.pops){ const k=(now-p.born)/1300; const x=p.t.x, y=by-30-k*30;
    cx.globalAlpha=k<.7?1:1-(k-.7)/.3; cx.font='bold 26px sans-serif'; cx.textAlign='center'; cx.lineWidth=4; cx.strokeStyle='#000'; cx.strokeText(p.text,x,y); cx.fillStyle=p.color||'#fff'; cx.fillText(p.text,x,y); cx.globalAlpha=1; }
}
// 敵の絵：番号の付いた絵（img/enemy_番号.png）がある敵は絵で、まだない敵は今までの図形で描く
const ENEMY_NO={"プルリン": "001", "ヤミコウモリ": "002", "ツノウサギ": "003", "門番の大鎧": "004", "からっぽの鎧": "005", "城の骨犬": "006", "灯火の霊": "007", "キバオオカミ": "008", "ドクキノコ": "009", "はぐれ兵": "010", "森ネズミ": "011", "ツルハシゴブリン": "012", "岩トカゲ": "013", "ガス溜まり": "014", "坑道コウモリ": "015", "焼け跡の亡霊": "016", "火喰いトカゲ": "017", "黒将軍の偵察兵": "018", "黒将軍の歩兵": "019", "黒将軍の弓兵": "020", "黒将軍の魔術兵": "021", "鉄の猟犬": "022", "坑道の主・大土竜": "023", "黒将ザガン（1回目）": "024"};
const ENEMY_PIC_FILES={}; for(const n in ENEMY_NO) ENEMY_PIC_FILES[n]='img/enemy_'+ENEMY_NO[n]+'.png';
const ENEMY_PIC={}; for(const n in ENEMY_PIC_FILES){ const im=new Image(); im.onload=()=>{ ENEMY_PIC[n]=im; for(const k in ENEMY_ICON) if(k===n) delete ENEMY_ICON[k]; }; im.src=ENEMY_PIC_FILES[n]; }
function drawEnemyPic(e,im,x,y,s,cx,icon){
  if(icon){ const c=cx.canvas, P=Math.max(1,Math.floor(Math.min(c.width,c.height)/Math.max(im.naturalWidth,im.naturalHeight))), w=im.naturalWidth*P, h=im.naturalHeight*P;
    cx.save(); cx.imageSmoothingEnabled=false; cx.drawImage(im,Math.round((c.width-w)/2),Math.round((c.height-h)/2)+P,w,h); cx.restore(); return; }
  const P=icon?1:2, w=im.naturalWidth*P, h=im.naturalHeight*P, t=RT.anim, fly=/コウモリ/.test(e.nm||e.dexName||e.name||'');
  const bob=icon?0:(fly?Math.round(Math.sin(t/10)*3)-3:Math.round(Math.sin(t/22)*1.2));
  const foot=Math.round(y+36*s), left=Math.round(x-w/2), top=foot-h+2*P+bob;
  cx.save(); if(e.glow){ cx.fillStyle=`rgba(250,204,21,${0.25+0.15*Math.sin(t/6)})`; cx.beginPath(); cx.arc(x,foot-h/2,h*0.55,0,7); cx.fill(); }
  cx.fillStyle='#0005'; cx.beginPath(); cx.ellipse(x,foot,w*0.32,Math.max(4,w*0.07),0,0,7); cx.fill();
  cx.imageSmoothingEnabled=false; cx.drawImage(im,left,top,w,h); cx.restore();
  e._box={x:left,y:top,w,h};
}
function drawEnemy(e,x,y,s,ctxo){ const cx=ctxo||CX0;
  const pim=ENEMY_PIC[e.dexName||e.nm||e.name]; if(pim){ return drawEnemyPic(e,pim,x,y,s,cx,!!ctxo); } e._box=null;
  const c=e.col, d=shade(c.startsWith('hsl')?'#888888':c,-.35);
  cx.save(); cx.translate(x,y); cx.scale(s,s);
  if(e.glow){ cx.fillStyle=`rgba(250,204,21,${0.25+0.15*Math.sin(RT.anim/6)})`; cx.beginPath(); cx.arc(0,0,48,0,7); cx.fill(); }
  cx.fillStyle='#0005'; cx.beginPath(); cx.ellipse(0,36,30,7,0,0,7); cx.fill();
  cx.fillStyle=c; const eye=(ex,ey,col)=>{cx.fillStyle='#fff';cx.beginPath();cx.arc(ex,ey,5,0,7);cx.fill();cx.fillStyle=col||'#111';cx.beginPath();cx.arc(ex,ey+1,2.5,0,7);cx.fill();};
  const sh=e.shape, t=RT.anim;
  if(sh==='blob'){ cx.beginPath(); cx.ellipse(0,14,30,22,0,0,7); cx.fill(); cx.beginPath(); cx.moveTo(-8,-6);cx.quadraticCurveTo(0,-26,8,-6);cx.fill(); eye(-10,10);eye(10,10); }
  else if(sh==='bird'){ const f=Math.sin(t/5)*10; cx.beginPath(); cx.moveTo(-6,0);cx.lineTo(-44,-14+f);cx.lineTo(-14,14);cx.fill(); cx.beginPath();cx.moveTo(6,0);cx.lineTo(44,-14+f);cx.lineTo(14,14);cx.fill(); cx.beginPath();cx.arc(0,4,16,0,7);cx.fill(); eye(-6,0,'#dc2626');eye(6,0,'#dc2626'); }
  else if(sh==='ghost'){ cx.globalAlpha*=0.85; cx.beginPath(); cx.arc(0,-4,24,Math.PI,0); cx.lineTo(24,30); for(let i=0;i<4;i++) cx.lineTo(24-12*i-6, 22+((i+Math.floor(t/8))%2)*8); cx.lineTo(-24,30); cx.fill(); cx.globalAlpha=1; eye(-9,-4,'#7c3aed');eye(9,-4,'#7c3aed'); }
  else if(sh==='plant'){ cx.fillStyle='#4d7c0f'; cx.fillRect(-5,4,10,30); cx.fillStyle=c; cx.beginPath(); cx.ellipse(0,0,30,18,0,Math.PI,0); cx.fill(); cx.fillStyle='#fff'; [[-14,-8],[6,-12],[16,-4]].forEach(([a,b])=>{cx.beginPath();cx.arc(a,b,3,0,7);cx.fill();}); eye(-6,14);eye(6,14); }
  else if(sh==='golem'){ cx.fillRect(-26,-30,52,62); cx.fillStyle=d; cx.fillRect(-34,-10,10,34); cx.fillRect(24,-10,10,34); cx.fillStyle='#38bdf8'; cx.fillRect(-14,-16,8,5); cx.fillRect(6,-16,8,5); }
  else if(sh==='crawler'){ cx.beginPath(); cx.ellipse(0,14,36,18,0,0,7); cx.fill(); cx.fillStyle=d; for(let i=-3;i<=3;i++){ cx.fillRect(i*10-2,26,4,10);} eye(-12,6,'#dc2626');eye(12,6,'#dc2626'); }
  else if(sh==='object'){ cx.fillRect(-20,-26,40,52); cx.fillStyle=d; cx.fillRect(-20,-26,40,8); eye(-8,0);eye(8,0); }
  else if(sh==='beast'){ cx.beginPath(); cx.ellipse(0,16,32,18,0,0,7); cx.fill(); cx.beginPath(); cx.arc(-18,-6,16,0,7); cx.fill(); cx.beginPath(); cx.moveTo(-30,-16);cx.lineTo(-26,-34);cx.lineTo(-18,-20);cx.fill(); cx.beginPath();cx.moveTo(-12,-18);cx.lineTo(-6,-34);cx.lineTo(-2,-14);cx.fill(); eye(-24,-8,'#facc15'); cx.fillStyle='#fff'; cx.fillRect(-32,2,4,6);cx.fillRect(-24,2,4,6); }
  else if(sh==='dragon'){ cx.beginPath(); cx.ellipse(0,10,38,24,0,0,7); cx.fill(); cx.beginPath();cx.moveTo(-20,-6);cx.lineTo(-58,-36);cx.lineTo(-30,10);cx.fill(); cx.beginPath();cx.moveTo(20,-6);cx.lineTo(58,-36);cx.lineTo(30,10);cx.fill(); cx.beginPath();cx.arc(0,-22,16,0,7);cx.fill(); eye(-6,-24,'#1d4ed8');eye(6,-24,'#1d4ed8'); }
  else if(sh==='zagan'||sh==='human'||sh==='seil'||sh==='noah'||sh==='void'){
    if(sh==='void'){ cx.fillStyle=`rgba(76,29,149,${.5+.3*Math.sin(t/8)})`; cx.beginPath(); cx.arc(0,0,46,0,7); cx.fill(); cx.fillStyle='#0b0714'; cx.beginPath(); cx.arc(0,0,34,0,7); cx.fill(); eye(-12,-4,'#f43f5e');eye(12,-4,'#f43f5e'); eye(0,14,'#f43f5e'); }
    else {
      const body = sh==='zagan'?'#1f2937':sh==='seil'?'#f8fafc':sh==='noah'?'#6d28d9':c;
      cx.fillStyle=body; cx.beginPath(); cx.moveTo(-26,34);cx.lineTo(-18,-6);cx.lineTo(18,-6);cx.lineTo(26,34);cx.fill();
      cx.fillStyle='#f2c79b'; if(sh==='zagan') cx.fillStyle='#6b7280'; cx.beginPath(); cx.arc(0,-18,13,0,7); cx.fill();
      if(sh==='zagan'){ cx.fillStyle='#e5e7eb'; cx.beginPath();cx.moveTo(-10,-26);cx.lineTo(-20,-46);cx.lineTo(-4,-30);cx.fill(); cx.beginPath();cx.moveTo(10,-26);cx.lineTo(20,-46);cx.lineTo(4,-30);cx.fill(); cx.fillStyle='#b91c1c'; cx.fillRect(-28,-4,8,36); cx.fillStyle='#ef4444'; cx.fillRect(-7,-21,4,3);cx.fillRect(3,-21,4,3); cx.fillStyle='#9ca3af'; cx.fillRect(22,-24,6,56); cx.fillRect(16,-28,18,10); }
      else if(sh==='seil'){ cx.fillStyle='#fbbf24'; cx.fillRect(-12,-32,24,6); cx.fillRect(-3,6,6,22); cx.fillRect(-10,12,20,5); cx.fillStyle='#111'; cx.fillRect(-7,-19,4,1);cx.fillRect(3,-19,4,1); }
      else if(sh==='noah'){ cx.fillStyle='#e5e7eb'; cx.beginPath(); cx.arc(0,-22,14,Math.PI,0); cx.fill(); cx.fillRect(-14,-22,5,14); cx.fillRect(9,-22,5,14); cx.fillStyle='#fbbf24'; cx.beginPath(); cx.arc(0,-2,4,0,7); cx.fill(); cx.fillStyle='#111'; cx.fillRect(-6,-18,3,2);cx.fillRect(3,-18,3,2); }
      else { cx.fillStyle='#d1d5db'; cx.fillRect(18,-20,5,50); cx.fillStyle='#111'; cx.fillRect(-6,-19,3,3);cx.fillRect(3,-19,3,3); }
    }
  }
  cx.restore();
}

// 図鑑の顔アイコン：戦闘と同じ描き方で、小さなキャンバスに描いて画像にする
const ENEMY_ICON={};
function enemyIconURL(x){ const key=x.nm; if(ENEMY_ICON[key]) return ENEMY_ICON[key];
  const c=document.createElement('canvas'); c.width=96; c.height=96; const g=c.getContext('2d');
  const e={nm:x.nm, shape:x.sh||enemyShape(x.nm), col:x.col||('hsl('+(hashStr(x.nm)%360)+',55%,55%)'), st:{}, buff:{}};
  const wide=['dragon','bird','void'].includes(e.shape), tall=['zagan','seil','noah','human','golem'].includes(e.shape); const s=wide?0.95:tall?1.15:1.35;
  try{ drawEnemy(e,48,tall?58:44,s,g); return ENEMY_ICON[key]=c.toDataURL(); }catch(err){ return ''; } }
// ---------- バランス試算用：画面を使わず1戦闘を回す ----------
// ---------- 1ターン（全員自動） ----------
function checkEnd(){
  if(!alive(B.enemies).length) return 'win';
  if(!alive(B.party).length) return 'lose';
  if(B.ran) return 'run';
  return null;
}
async function doEnemy(u,c){
  if(u.st.confuse && Math.random()<0.5){ const t=pick(alive([...B.party,...B.enemies])); await blog(`${u.name}は混乱している！`,400); await hit(u,t,{mult:1}); return; }
  return enemyAct(u,c);
}

// ---------- 味方の行動：ゲージが満タンならアクティブ、そうでなければ通常攻撃 ----------
// 回復・蘇生のアクティブは、必要になるまで溜めて待つ
// 属性：弱点を知っていればそこを突く。知らなければ順番に試して探す（見つけると図鑑に残る）
function aiEnemy(e){
  const pal0=alive(B.party), pal=pal0.filter(u=>!u.air).length?pal0.filter(u=>!u.air):pal0; let tgt=pick(pal); const tz=pal.find(u=>u.taunt||u.tauntAll); if(tz&&(tz.tauntAll||Math.random()<.75)) tgt=tz;
  if(/弱った仲間/.test(e.feat||'')) tgt=pal.slice().sort((a,b)=>a.hp-b.hp)[0];
  const f=e.feat||'', ab=e.ab||[], r=Math.random();
  if(e.charging){ return {type:'eCharge',target:tgt}; }
  if(e.bidx===13) return aiNoah(e,tgt);
  if(ab.includes('selfHeal') && e.hp<e.mhp*0.4 && !e.healed){ return {type:'eHeal'}; }
  if(ab.includes('summon') && r<0.2 && B.enemies.length<4) return {type:'eSummon'};
  if((ab.includes('aoe')||ab.includes('iceAoe')||ab.includes('holyAoe')||ab.includes('darkAoe')||ab.includes('blindAoe')) && r<0.35) return {type:'eAoe', elem:ab.includes('iceAoe')?'ice':ab.includes('holyAoe')?'light':ab.includes('darkAoe')?'dark':'none', blind:ab.includes('blindAoe')};
  if((ab.includes('charge')||/力をためる/.test(f)) && r<0.25) return {type:'eChargeStart'};
  if(ab.includes('guard')&&r<0.2) return {type:'eBuff',stat:'def'};
  if(ab.includes('defUp')&&r<0.2) return {type:'eBuff',stat:'def'};
  if(ab.includes('poison')&&r<0.3) return {type:'eStatus',st:'poison',target:tgt};
  if(/全体攻撃|地震/.test(f)&&r<0.3) return {type:'eAoe',elem:'none'};
  if(/(炎|氷)の魔法|炎を吐く|ランダムな魔法|光の剣/.test(f)&&r<0.45){ const el=/炎/.test(f)?'fire':/氷/.test(f)?'ice':/光/.test(f)?'light':pick(['fire','ice','thunder']); return {type:'eMagic',elem:el,target:tgt}; }
  const stm={'暗闇':'blind','毒':'poison','眠らせる':'sleep','麻痺':'paralyze','混乱':'confuse','沈黙':'silence','動けなく':'paralyze','しばる':'paralyze'};
  for(const k in stm) if(f.includes(k) && r<0.3) return {type:'eStatus',st:stm[k],target:tgt};
  if(/ランダムな状態異常/.test(f)&&r<.35) return {type:'eStatus',st:pick(['poison','blind','sleep','confuse','silence']),target:tgt};
  if(/2回|暴れる/.test(f)) return {type:'eDouble',target:tgt};
  if(/味方全体を強化|攻撃力を上げる|敵を強化する/.test(f)&&r<0.3) return {type:'eAllyBuff'};
  if(/防御を上げる/.test(f)&&r<0.25) return {type:'eBuff',stat:'def'};
  if(/防御を下げる|ステータスを下げる|呪い/.test(f)&&r<0.3) return {type:'eDebuff',target:tgt};
  if(/HPを回復/.test(f)&&r<0.3) return {type:'eHealAlly'};
  if(/強化を消す/.test(f)&&r<0.3) return {type:'eDispel'};
  if(/仲間を呼ぶ/.test(f)&&r<0.15&&B.enemies.filter(x=>x.hp>0).length<4) return {type:'eCall'};
  if(/自爆/.test(f)&&e.hp<e.mhp*0.5&&r<0.5) return {type:'eBoom'};
  if(/MPを吸う/.test(f)&&r<0.3) return {type:'eMpDrain',target:tgt};
  if(/HPを吸う/.test(f)&&r<0.3) return {type:'eDrain',target:tgt};
  if(ab.includes('dark')||ab.includes('light')) return {type:'eMagic',elem:ab.includes('dark')?'dark':'light',target:tgt};
  return {type:'eAtk',target:tgt};
}
function aiNoah(e,tgt){
  const r=Math.random();
  if(r<0.2) return {type:'eStatus',st:pick(['sleep','silence']),target:tgt,all:true,chance:25,name:pick(['まどろみ','静寂'])};
  if(r<0.35) return {type:'eDebuffAll',name:'スロウ'};
  if(r<0.5) return {type:'eDispel',name:'ディスペル'};
  return {type:'eMagic',elem:'light',target:tgt,name:'ルミナ',mul:1.3};
}

// ---------- ダメージ計算 ----------
function elemColor(e){return {fire:'#f97316',ice:'#7dd3fc',thunder:'#facc15',light:'#fef9c3',dark:'#a855f7'}[e]||'#e5e7eb';}
async function enemyAct(e,c){
  const tgt=c.target&&c.target.hp>0?c.target:pick(alive(B.party)); if(!tgt) return;
  const n=c.name;
  switch(c.type){
    case 'eAtk': await blog(`${e.name}の攻撃！`,250); await hit(e,tgt,{mult:1}); break;
    case 'eDouble': await blog(`${e.name}の連続攻撃！`,250); await hit(e,tgt,{mult:.7}); if(alive(B.party).length) await hit(e,pick(alive(B.party)),{mult:.7}); break;
    case 'eMagic': await blog(`${e.name}の ${n||ELJP[c.elem]+'の魔法'}！`,300); await hit(e,tgt,{mult:c.mul||1.05,mag:true,elem:c.elem}); break;
    case 'eAoe': await blog(`${e.name}の全体攻撃！`,350); for(const t of alive(B.party)){ if(t.air) continue; await hit(e,t,{mult:e.boss?.65:.55,mag:c.elem!=='none',elem:c.elem,aoe:1}); if(c.blind) addStatus(t,'blind',35,e);} break;
    case 'eStatus': await blog(`${e.name}の ${n||STATUSJP[c.st]+'攻撃'}！`,300); if(c.all){ for(const t of alive(B.party)) addStatus(t,c.st,c.chance||45,e); } else { await hit(e,tgt,{mult:.6}); addStatus(tgt,c.st,45,e); } break;
    case 'eChargeStart': e.charging=true; await blog(`${e.name}は力をためている…！`,500);
      { const ly=alive(B.party).find(x=>x.P&&x.P.foresight&&!x.flags.foresight); if(ly){ ly.flags.foresight=1; ly.forceActive=true; ly.foreMul=ly.P.foresight; ly.flags.first=true; await blog(`${ly.name}は、この先に来るものを知っている顔をした。`,500); } } break;
    case 'eCharge': e.charging=false; await blog(`${e.name}の渾身の一撃！`,400); await hit(e,tgt,{mult:2.4}); break;
    case 'eBuff': e.buff[c.stat]=[clamp((e.buff[c.stat]?e.buff[c.stat][0]:0)+1,-2,2),3]; await blog(`${e.name}は守りを固めた。`,350); break;
    case 'eAllyBuff': alive(B.enemies).forEach(x=>x.buff.atk=[1,3]); await blog(`${e.name}は仲間を奮い立たせた！`,350); break;
    case 'eDebuff': await blog(`${e.name}の呪い！`,300); { const st=pick(['atk','def','spd']); tgt.buff[st]=[clamp((tgt.buff[st]?tgt.buff[st][0]:0)-1,-2,2),3]; pop(tgt,STJP[st]+'↓','#fca5a5'); } break;
    case 'eDebuffAll': await blog(`${e.name}の ${n}！`,300); alive(B.party).forEach(t=>{ t.buff.spd=[-1,3]; pop(t,'速度↓','#fca5a5'); }); break;
    case 'eHealAlly': { const a=alive(B.enemies).sort((x,y)=>x.hp/x.mhp-y.hp/y.mhp)[0]; const h=Math.round(a.mhp*.3*(1-partyMax('noRise')/100)); a.hp=Math.min(a.mhp,a.hp+h); pop(a,'+'+h,'#4ade80'); await blog(`${e.name}は祈りを捧げた。`,300); } break;
    case 'eHeal': e.healed=1; { const h=Math.round(e.mhp*.25*(1-partyMax('noRise')/100)); e.hp=Math.min(e.mhp,e.hp+h); pop(e,'+'+h,'#4ade80'); await blog(`${e.name}は聖なる光で傷を癒やした！`,500); } break;
    case 'eDispel': await blog(`${e.name}の ${n||'強化消し'}！`,300); alive(B.party).forEach(t=>{ t.buff={}; t.guard=null; t.regen=null; t.critBuff=null; for(const k in t.atkUps) if(t.atkUps[k][1]<50) delete t.atkUps[k]; }); break;
    case 'eCall': case 'eSummon': { const base=e.boss?makeEnemy(LOCS[G.loc].area,0,e.lv-1):makeEnemy(LOCS[G.loc].area,0,e.lv); if(!e.boss){ Object.assign(base,{name:e.name.replace(/^.*?の/,'')===e.name?e.name:e.name, }); }
      B.enemies.push(e.boss?base:{...e,hp:e.mhp,st:{},buff:{},glow:0}); layoutEnemies(); await blog(`${e.name}は仲間を呼んだ！`,400); } break;
    case 'eBoom': await blog(`${e.name}は自爆した！`,400); for(const t of alive(B.party)) await hit(e,t,{mult:1.2}); e.hp=0; e.dying=performance.now(); break;
    case 'eMpDrain': { const v=Math.min(tgt.gauge||0,20); tgt.gauge=(tgt.gauge||0)-v; await blog(`${e.name}はゲージを吸い取った！`,300); pop(tgt,'ゲージ-'+v,'#ffd166'); } break;
    case 'eDrain': await blog(`${e.name}は生気を吸い取った！`,300); { const d=await hit(e,tgt,{mult:.9}); e.hp=Math.min(e.mhp,e.hp+Math.round(d/2*(1-partyMax('noRise')/100))); } break;
  }
}

// ---------- 勝利 ----------
async function battleWin(){
  const es=B.enemies; const L=es[0].lv; RT.newMats=new Set();
  let exp=es.reduce((a,e)=>a+e.exp,0), gold=es.reduce((a,e)=>a+e.gold,0);
  const expUp=Math.max(...B.party.map(u=>u.expUp||0)), dropUp=Math.max(...B.party.map(u=>u.dropUp||0))+(B.opts.maze?30+25*(B.opts.depth||0):0); // 迷宮は深いほど良い物が出る
  exp=Math.round(exp*(1+expUp/100)); gold=Math.round(gold*(1+partyMax('greedy')/100)+Math.min(gold*1.5,B.goldGain||0));
  G.gold+=gold; bgm('win');
  await blog('戦いに勝った！',700);
  // 経験値
  const ups=[], gained=[];
  for(const n in G.members){ const m=G.members[n]; if(!m.avail) continue; const inParty=G.party.includes(n); const u=B.party.find(x=>x.name===n);
    if(inParty && u && u.hp<=0) continue; let gain=inParty?exp:Math.round(exp*0.5); if(m.lv>=99) continue;
    gain=Math.round(gain*(1+((u&&u.P&&u.P.heroEgg)||0)/100));
    const before=calcStats(n), lv0=m.lv, learned=[];
    m.exp+=gain; while(m.lv<99 && m.exp>=needOf(n,m.lv)){ m.exp-=needOf(n,m.lv); m.lv++; learned.push(...growthNews(n,m.lv)); }
    if(inParty) gained.push(n);
    if(m.lv>lv0){ const after=calcStats(n); ups.push({n,inParty,lv0,lv:m.lv,before,after,learned}); if(u){ u.mhp=after.hp; }
      m.hp=Math.min(after.hp, m.hp+(after.hp-before.hp)); } }
  // ドロップ
  const drops=[], gotItems=[];
  const boss=es.some(e=>e.boss);
  if(boss){ const bi=es.find(e=>e.boss); const gen=()=>makeItem(randomSlot(), L, rollRarity(true,dropUp,B.opts.maze), undefined, {meiRate:B.opts.maze?0.08:0.05});
    drops.push(B.opts.maze? gen() : withRunSeed('boss_'+bi.bidx+'_'+G.chapter, gen));
    // 最後のボス：迷宮へ挑むための、確かな一品（黄以上）
    if(bi.bidx===12 && !B.opts.maze) drops.push(withRunSeed('boss_last_'+G.chapter, ()=>makeItem(randomSlot(), L, Math.max(3,rollRarity(true,dropUp)), undefined, {meiRate:0.25})));
    const mk=es.find(e=>e.mazeK!==undefined); if(mk && Math.random()<0.12*(1+dropUp/100)) drops.push(makeLegend(mk.mazeK, L));
    // 技の書：ストーリーのボスは周ごとに固定。迷宮の番人と裏ボスは極の書
    const bks = (mk? [4,3] : B.opts.maze? [4,4,4] : bi.bidx>=12? [3,3,2] : G.chapter>=4? [3,2] : [2,1]).map(t=>bookOf(t));
    if(mk && Math.random()<0.2) bks.push('book3'); // まれに万能の書
    for(const b of bks){ G.inv[b]=(G.inv[b]||0)+1; gotItems.push(ITEMS[b].n); }
    // ボスの素材（名品づくり・昇華に使う）
    if(mk){ const k=1+(Math.random()<0.25?1:0); gainMat('記憶の核',k); gotItems.push('記憶の核'+(k>1?'×2':'')); }
    else if(B.opts.maze){ gainMat('初代の聖印'); gotItems.push('初代の聖印'); }
    else if(BOSS_MAT[bi.bidx]){ const k=1+(Math.random()<0.3?1:0); gainMat(BOSS_MAT[bi.bidx],k); gotItems.push(BOSS_MAT[bi.bidx]+(k>1?'×2':'')); } }
  else if(B.opts.fade){ /* 記憶が薄れた階では、何も落とさない */ }
  else {
    if(es.some(e=>e.glow)) drops.push(makeItem(randomSlot(), L, Math.max(2,rollRarity(true,dropUp))));
    if(Math.random() < 0.10*(1+dropUp/100)*(B.opts.maze?1.5:1)) drops.push(makeItem(randomSlot(), L, rollRarity(false,dropUp,B.opts.maze), undefined, {meiRate:B.opts.maze?0.06:0.04}));
    if(Math.random()<0.18){ const ik=pick(['herb','herb','herb', G.chapter>=2?'herb2':'herb', G.chapter>=1?'feather':'herb']); G.inv[ik]=(G.inv[ik]||0)+1; gotItems.push(ITEMS[ik].n); }
    if(Math.random()<(B.opts.maze?0.04:0.025)){ G.inv.rope=(G.inv.rope||0)+1; gotItems.push(ITEMS.rope.n); }
    { const r=Math.random()*(1-dropUp/200); const bt= B.opts.maze? (r<0.006?3:r<0.035?2:r<0.07?1:0) : (r<0.03?1:0); const bk= bt? bookOf(bt) : null; if(bk){ G.inv[bk]=(G.inv[bk]||0)+1; gotItems.push(ITEMS[bk].n); } }
  }
  // 魔物の素材：ときどき、倒した魔物の素材が手に入る（記憶が薄れた階では何も出ない）
  if(!boss && !B.opts.fade){ const n= Math.random()<0.4? (Math.random()<0.2?2:1) : 0;
    for(let i=0;i<n;i++){ const e=pick(es); const m=matOfEnemy(e.drop); if(!m) continue;
      if(m.item){ G.inv[m.item]=(G.inv[m.item]||0)+1; gotItems.push(ITEMS[m.item].n); } else { gainMat(m.mat); gotItems.push(m.mat); } } }
  const dropRes=drops.map(it=>({it, sold:gainItem(it)==='sold'}));
  const best=Math.max(-1,...drops.map(d=>d.r));
  if(best>=3){ const fx=$('rarefx'); fx.className=''; void fx.offsetWidth; fx.className=best===4?'rainbow':'gold'; fx.innerHTML=best===4?'<b class="r4">★ 虹の装備 ★</b>':'<b style="color:#ffd34d">金の装備！</b>'; sfx(best===4?'rainbow':'rare'); await sleep(best===4?1900:950); fx.className=''; }
  const newMats=[...RT.newMats]; RT.newMats=null;
  await showResult({exp,gold,gained,ups,dropRes,gotItems,newMats,meter:B.meter,party:B.party.map(u=>u.name)});
  if(!G.flags.ropeTip && gotItems.includes(ITEMS.rope.n) && !SIM.on){ G.flags.ropeTip=1; await say('','抜け道の糸を手に入れた！\nメニューの「どうぐ」から使うと、ダンジョンの外へすぐに出られる。\n全滅すると、最後にセーブした所まで戻ってしまう。持ち帰りたい物があるときに。'); }
  if(!G.flags.matTip && gotItems.some(n=>MAT[n]||MAT[n.replace(/×\d$/,'')]) && !SIM.on){ G.flags.matTip=1; await say('','魔物の素材を手に入れた！\n錬成屋（王都・学術都市・大聖堂の町）で、装備を鍛えたり、名品を打ったり、道具を作ったりできる。'); }
  if(!G.flags.bookTip && gotItems.some(n=>{ const x=goodByName(n); return x.kind==='tool'&&isBook(x.key); }) && !SIM.on){ G.flags.bookTip=1; await say('','技の書を手に入れた！\nメニューの「スキル」で、スキルを★2・★3…と強くできる。'); await say('','書は3種類。通常攻撃・アクティブ・パッシブで使う書が違う。\nアクティブの書は見つかりにくい。'); }
}

function makeLegend(k,L){ const D=LEGENDS[k]; const it=makeItem(D.slot, Math.min(99,L+6), 4, D.kind, {ty:D.ty}); it.name=D.nm; it.u=D.u; it.legend=k; it.lore=D.lore; return it; }
// ---------- リザルト画面 ----------
// 戦闘の成績：与ダメージ・回復・受けたダメージのタブ。多い順に並べ、タップで技ごと（受けたダメージは敵ごと）の内訳
const RES_TABS=[['dmg','与ダメージ'],['heal','回復'],['taken','受けた']];
function meterHTML(R, tab){
  if(!R.meter) return '';
  tab=tab||RT.resTab||'dmg'; G.records=G.records||{};
  if(!R._best){ R._best={}; for(const n of R.party){ const m=(R.meter[n]||{}).max||0; if(m>0 && m>(G.records[n]||0)){ if(G.records[n]) R._best[n]=1; G.records[n]=m; } } }
  const rows=R.party.map(n=>({n, M:Object.assign({dmg:0,heal:0,taken:0,acts:0,max:0,maxNm:'',crit:0,by:{},tby:{}}, R.meter[n]||{})}));
  const val=r=>r.M[tab]||0; rows.sort((a,b)=>val(b)-val(a));
  const total=rows.reduce((s,r)=>s+val(r),0), top=Math.max(1,...rows.map(val));
  const tabs=`<div class="rtabs">${RES_TABS.map(([k,l])=>`<button class="${k===tab?'on':''}" data-rtab="${k}">${l}</button>`).join('')}</div>`;
  const list=rows.map((r,i)=>{ const M=r.M, v=val(r);
    const best = tab==='dmg' && R._best[r.n];
    const det = tab==='taken'
      ? Object.entries(M.tby||{}).sort((a,b)=>b[1]-a[1]).map(([k,x])=>`<div class="mby"><span>${k}</span><span>${x.toLocaleString()}</span><i style="width:${x/Math.max(1,v)*100}%"></i></div>`).join('')
      : Object.entries(M.by||{}).filter(([k,x])=>x[tab]>0).sort((a,b)=>b[1][tab]-a[1][tab]).map(([k,x])=>`<div class="mby"><span>${k}${x.n?` <small>×${x.n}</small>`:''}${tab==='dmg'&&x.crit?` <small class="cr">会心${x.crit}</small>`:''}</span><span>${x[tab].toLocaleString()} <small>${Math.round(x[tab]/Math.max(1,v)*100)}%</small></span><i style="width:${x[tab]/Math.max(1,v)*100}%"></i></div>`).join('');
    const sub = tab==='dmg' ? `<span>${M.acts?`★アクティブ×${M.acts}`:'アクティブなし'}${M.crit?`・会心×${M.crit}`:''}</span><span>${M.max?`最大の一撃 ${M.max.toLocaleString()}`:''}${best?' <b class="pb">自己ベスト！</b>':''}</span>`
      : tab==='heal' ? `<span>${v?'':'回復していない'}</span><span></span>` : `<span>${v?'':'無傷'}</span><span></span>`;
    const rk = v>0 && i===0 ? `<b class="rk r1">${tab==='dmg'?'MVP':tab==='heal'?'癒し手':'盾役'}</b>` : `<b class="rk">${v>0?i+1:'―'}</b>`;
    return `<div class="mrow${v>0?'':' zero'}${v>0&&i===0?' top':''}" data-mrow="${i}">${rk}<img src="${spriteURL(r.n,0)}"><div class="mmain"><div class="mtop"><b>${r.n}</b><span><b class="${tab}">${v.toLocaleString()}</b> <small>${total?Math.round(v/total*100):0}%</small></span></div>
      <div class="mbar ${tab}"><i style="width:${v/top*100}%"></i></div><div class="msub">${sub}</div>
      <div class="mdet" style="display:${RT.resOpen===r.n?'block':'none'}">${det||'<div class="mby"><span>なし</span></div>'}</div></div></div>`; }).join('');
  return `<div class="ptitle"><span>この戦闘の成績</span><span>${RES_TABS.find(x=>x[0]===tab)[1]} 合計 ${total.toLocaleString()}</span></div>${tabs}<div class="meter">${list}</div><div class="mhint" style="font-size:10px;color:var(--sub);text-align:right">名前をタップで内訳</div>`;
}
function showResult(R){
  return new Promise(res=>{
    const el=$('result'); const lab={hp:'HP',atk:'攻撃',def:'防御',mat:'魔攻',mdf:'魔防',spd:'速度'};
    const upHTML=R.ups.map(x=>{
      const head=`<div style="display:flex;align-items:center;gap:8px"><img src="${spriteURL(x.n,0)}" class="pspr"><div style="flex:1"><b>${x.n}</b>${x.inParty?'':' <span class="tag">控え</span>'}</div><div style="color:var(--gold);font-weight:800;font-variant-numeric:tabular-nums">Lv ${x.lv0} → ${x.lv}</div></div>`;
      if(!x.inParty) return `<div class="card upc" style="padding:6px 10px">${head}${x.learned.length?`<div style="font-size:12px;color:var(--gold)">✦ 覚えた：${x.learned.join('、')}</div>`:''}</div>`;
      const rows=['hp','atk','def','mat','mdf','spd'].map(k=>[lab[k],x.after[k],x.after[k]-x.before[k]]);
      return `<div class="card upc" style="padding:8px 10px">${head}<div style="margin-top:6px">${statGrid(rows,1)}</div>${x.learned.length?`<div style="margin-top:6px;font-size:12px;color:var(--gold)">✦ 覚えた：${x.learned.join('、')}</div>`:''}</div>`; }).join('');
    // 手に入れたもの：装備は中身（素の強さ・効果）まで。道具は同じ位置に「道具」の枠
    const dropHTML=R.dropRes.map(({it,sold})=>`<div class="item drop${it.r>=3?' rare q'+it.r:''}">${itemLine(it)}${sold?'<small class="cnt" style="flex-basis:2.6em">売却</small>':''}</div>`).join('')
      +(()=>{ const T={}, order=[]; for(const nm of R.gotItems){ const x=goodByName(nm); if(!T[x.n]){ T[x.n]=x; order.push(x.n); x.cnt0=0; } T[x.n].cnt0+=x.cnt; }
        // 道具・素材も装備と同じ並びで1つずつ。素材は種類と★、道具は効き目。はじめて手に入れた素材には印
        return order.map(n=>{ const x=T[n]; const sub= x.kind==='tool'? ITEMS[x.key].d : x.kind==='mat'? `${MATCAT[MAT[n].cat]}${MAT[n].cat==='boss'?'':'　★'+MAT[n].g}` : '';
          const first=(R.newMats||[]).includes(n);
          return `<div class="item drop">${goodIconHTML(x)}<div class="grow"><div class="r${x.r>=3?x.r:0}">${n}${first?' <span class="tag first">はじめて</span>':''}</div><small>${sub}</small></div><b class="cnt" style="flex-basis:2.6em">×${x.cnt0}</b></div>`; }).join(''); })();
    const nDrop=R.dropRes.length+R.gotItems.reduce((a,nm)=>a+goodByName(nm).cnt,0);
    const pages=[{k:'main'}]; if(upHTML) pages.push({k:'up'});
    let pi=0, closed=false, ready=false;
    const close=()=>{ if(closed) return; closed=true; el.style.display='none'; el.innerHTML=''; sfx('tick'); res(); };
    const hintText=()=> pi<pages.length-1 ? `タップでつぎへ <small>（${pi+1}/${pages.length}）</small>` : (pages.length>1?`タップでつづける <small>（${pi+1}/${pages.length}）</small>`:'タップでつづける');
    const render=()=>{
      const P=pages[pi]; ready=false;
      if(P.k==='main'){
        const nRow=(R.party||[]).length, dropDelay=0.15+nRow*0.12+0.25;
        el.innerHTML=`<div class="rc"><div style="text-align:center;font-weight:900;font-size:18px;letter-spacing:2px">VICTORY</div>
          <div style="display:flex;justify-content:center;gap:18px;font-size:14px;font-variant-numeric:tabular-nums"><span>経験値 <b style="color:#a5f3fc">${R.exp.toLocaleString()}</b></span><span><b style="color:var(--gold)">${R.gold.toLocaleString()}</b> G</span></div>
          <div class="scroll" style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;min-height:0">
            <div id="resMeter" class="anim" style="display:flex;flex-direction:column;gap:6px">${meterHTML(R)}</div>
            ${nDrop?`<div class="dropbox" style="--dd:${dropDelay}s"><div class="ptitle"><span>手に入れたもの</span><span>${nDrop}こ</span></div><div class="list" style="flex:0 0 auto;overflow:visible">${dropHTML}</div></div>`:''}
          </div>
          <div class="rhint">${hintText()}</div></div>`;
        el.querySelectorAll('#resMeter .mrow').forEach((r,i)=>r.style.setProperty('--d',(0.15+i*0.12)+'s'));
        const mh=el.querySelector('#resMeter .mhint'); if(mh) mh.style.setProperty('--d',(0.15+nRow*0.12)+'s');
        const bindMeter=()=>{ const box=el.querySelector('#resMeter'); if(!box) return;
          box.querySelectorAll('[data-mrow]').forEach(r=>r.onclick=e=>{ e.stopPropagation(); const d=r.querySelector('.mdet'); const open=d.style.display==='none'; box.querySelectorAll('.mdet').forEach(x=>x.style.display='none'); d.style.display=open?'block':'none'; RT.resOpen=open?r.querySelector('.mtop b').textContent:null; sfx('tick'); });
          box.querySelectorAll('[data-rtab]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); RT.resTab=b.dataset.rtab; RT.resOpen=null; box.classList.remove('anim'); box.innerHTML=meterHTML(R,RT.resTab); bindMeter(); sfx('tick'); }); };
        RT.resOpen=null; bindMeter();
        if(!P.sfxDone){ P.sfxDone=1; sfx('win'); const vals=(R.party||[]).map(n=>(R.meter&&R.meter[n]&&R.meter[n].dmg)||0).sort((a,b)=>b-a), top=Math.max(1,vals[0]||0);
          if(vals[0]>0) sfxGauge(1, 0.4);   // バーが伸びる音は1本だけ（人数分重ねるとせわしない）
          if(nDrop) setTimeout(()=>sfx('pop'),(dropDelay+0.15)*1000); }
        // 連打で閉じないよう、出そろうまでは少しだけタップを受け付けない（レアのときは長め）
        const rare=R.dropRes.some(d=>d.it.r>=3);
        const wait=Math.min(1600, (nDrop?dropDelay*1000:0.15+nRow*120) + (rare?700:250));
        const hint=el.querySelector('.rhint'); hint.style.opacity=.25; setTimeout(()=>{ ready=true; hint.style.opacity=1; }, wait);
      } else {
        el.innerHTML=`<div class="rc"><div style="text-align:center;font-weight:900;font-size:18px;letter-spacing:2px;color:var(--gold)">LEVEL UP</div>
          <div class="scroll" style="overflow-y:auto;display:flex;flex-direction:column;gap:8px;min-height:0">${upHTML}</div>
          <div class="rhint">${hintText()}</div></div>`;
        el.querySelectorAll('.upc').forEach((r,i)=>r.style.setProperty('--d',(i*0.1)+'s'));
        sfx('lvup');
        const hint=el.querySelector('.rhint'); hint.style.opacity=.25; setTimeout(()=>{ ready=true; hint.style.opacity=1; }, 450);
      }
    };
    el.style.display='flex'; $('msg').style.display='none';
    el.onclick=()=>{ if(!ready) return; if(pi<pages.length-1){ pi++; sfx('tick'); render(); } else close(); };
    render();
  });
}

// ---------- 全滅 ----------
async function gameOver(){
  RT.mode='event'; hidePanel(); bgm(null);
  await blog('パーティーは全滅した……',1200);
  await fade(true);
  META=loadMeta(); META.gameOvers=(META.gameOvers||0)+1; if(G.chapter<5){ META.goPre5=(META.goPre5||0)+1; META.goRun=META.goRun||{}; META.goRun[G.runSeed]=(META.goRun[G.runSeed]||0)+1; } META.loads=(META.loads||0)+1; saveMeta(META);
  $('msg').style.display='none';
  const s=loadSave(slotKey()); kvDel('mzy_suspend');
  await sleep(500);
  if(s){ resumeFrom(s); } else { newGame(); enterMap('sora',0); }
  await fade(false);
  RT.busy=false;
  await say('', s&&s.saveLoc&&s.saveLoc.loc==='__world'? '……気がつくと、迷宮の外に立っていた。見つけたものは、何も残っていない。' : '……気がつくと、見覚えのある光る石の前に立っていた。');
  bgm('field');
}
