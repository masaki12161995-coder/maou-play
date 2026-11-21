// ===== 味方側の戦闘（完全オート）=====
// 通常攻撃・アクティブ・パッシブは kit.js のデータを読み、ここで動かす。
// パッシブは「条件で勝手に出る技」：できごと（倒した・会心・殴られた・回復した…）に反応して動く。

const STAGE=[0.5,0.75,1,1.25,1.5];
const AILMENT=['poison','burn','freeze','sleep','paralyze','stop','confuse','blind','silence'];
const STX={poison:'毒',burn:'燃焼',freeze:'凍結',sleep:'眠り',paralyze:'麻痺',stop:'停止',confuse:'混乱',blind:'暗闇',silence:'沈黙'};
const GIFT_CAP=50; // 仲間からもらうゲージは1人1ターン50まで

function partyUnit(name){
  const m=G.members[name], s=calcStats(name), P=s.P||{};
  return {name, isEnemy:false, hp:m.hp, mhp:s.hp, atk:s.atk, def:s.def, mat:s.mat, mdf:s.mdf, spd:s.spd, crit:s.crit, critDmg:s.critDmg, critDef:s.critDef,
    res:s.res, stRes:s.stRes, drain:s.drain, uniq:s.uniq, P, st:{}, buff:{}, expUp:s.expUp, dropUp:s.dropUp, flags:{}, tf:{}, prevHp:m.hp,
    kit:KIT[name], N:normalOf(name), A:activeOf(name), gauge:Math.min(100,s.gauge||0), gx:{n:s.gNorm||0,h:s.gHurt||0,c:s.gCrit||0,k:s.gKill||0,t:s.gTurn||0,keep:s.gKeep||0,ap:s.actP||0}, gift:0, stk:{}, ki:0, atkUps:{}, shield:0, taken:0, spdUp:0, atkStack:0, extra:0, nextPow:0, learn:0, selfStk:0, grit:0, spiritUp:0, cover:0, nextHitUp:0};
}
// ---- 状態の見方 ----
const nSt=t=>Object.keys(t.st).filter(k=>AILMENT.includes(k)).length;
const disabled=t=>!!(t.st.sleep||t.st.paralyze||t.st.freeze||t.st.stop);
const hasAtkUp=u=>Object.keys(u.atkUps||{}).length>0 || (u.buff.atk&&u.buff.atk[0]>0);
const defDown=t=>t.buff.def&&t.buff.def[0]<0;
const UNDEAD=/亡霊|骨|骸|ゾンビ|死|霊|屍|スケルトン|ゴースト|ミイラ|影/;
const isUndead=t=>!!(t&&t.isEnemy&&UNDEAD.test(t.dexName||t.name));
const foeKey=t=>(t.dexName||t.name||'').replace(/[A-ZＡ-Ｚ]$/,'');
function revealWeak(t){ if(!t||!t.isEnemy) return; const r=dexEnemy(t,false); if(t.weak&&!r.w){ r.w=1; B.newWeak=t; } }
function addCurse(t,n,a){ if(!t||t.hp<=0||!(n>0)) return; const before=t.curse||0; t.curse=Math.min(6,before+n); const got=t.curse-before; if(got>0){ pop(t,'呪'+t.curse,'#c084fc'); if(B) for(const x of alive(B.party)) if(x.P.darkFest) stackUp(x,'darkFest',got); } }
function setCut(x,pct,turns){ if(!x||!(pct>0)) return; if(!x.cut||x.cut[0]<pct||(x.cut[0]===pct&&x.cut[1]<turns)) x.cut=[pct,turns]; }
function partyMax(key){ return B? alive(B.party).reduce((m,x)=>Math.max(m,(x.P&&x.P[key])||0),0) : 0; }
function addAtkUp(u,src,pct,turns){ if(!u||u.hp<=0||!(pct>0)) return; const c=u.atkUps[src]; if(!c||c[0]<=pct) u.atkUps[src]=[pct,turns+1]; else c[1]=Math.max(c[1],turns+1); }

function sv(u,k){ let v=u[k]; const b=u.buff[k]; if(b) v*=STAGE[b[0]+2];
  if(u.isEnemy){ if(k==='spd'&&u.st.freeze) v*=0.5; return v; }
  const P=u.P||{}; const down=B&&B.party.some(x=>x.hp<=0);
  if(k==='atk'||k==='mat'){
    let up=0; for(const s in u.atkUps) up+=u.atkUps[s][0];
    if(P.wounded) up+=P.wounded*(1-u.hp/u.mhp);
    if(P.desperate && u.hp<=u.mhp*0.5) up+=P.desperate;
    if(P.pack && B && alive(B.enemies).length>=3) up+=P.pack;
    if(P.back && B) up+=P.back*B.party.filter(x=>x!==u&&x.hp>0&&hasAtkUp(x)).length;
    if(P.kiUp) up+=P.kiUp*(u.ki||0);
    if(u.shield>0 && u.shAtk) up+=u.shAtk;
    up+=u.atkStack||0; up+=u.selfStk||0; up+=u.spiritUp||0;
    if(P.keeper && u.hp>=u.mhp) up+=P.keeper;
    if(P.stillStrong && u.hp>=u.mhp) up+=P.stillStrong;
    if(P.learn) up+=P.learn*(u.learn||0);
    if(B){ if(P.longshot && alive(B.enemies).length===1) up+=P.longshot;
      if(P.pushThrough) up+=P.pushThrough*alive(B.enemies).length;
      if(P.growing) up+=Math.min(60,P.growing*B.turn);
      up+=partyMax('warlord');
      up+=alive(B.party).filter(x=>x.P.pride&&(x.taunt>0||x.cover>0)).reduce((m,x)=>Math.max(m,x.P.pride),0); }
    if(k==='mat'){ if(P.heatRes&&B) up+=P.heatRes*Math.min(5,alive(B.enemies).reduce((a,e)=>a+nSt(e),0));
      if(P.lamp&&B) up+=P.lamp*alive(B.party).filter(x=>x.hp>=x.mhp).length;
      if(P.cheer&&B) up+=P.cheer*alive(B.party).length; }
    v*=1+up/100;
    if(k==='atk' && u.uniq.includes('fullHp')&&u.hp>=u.mhp) v*=1.25;
  }
  if((k==='def'||k==='mdf') && P.wall && u.taunt>0) v*=1+P.wall/100;
  if(k==='def'||k==='mdf'){ if(B){ const mj=partyMax('majesty'); if(mj) v*=1+mj/100; } if(u.grit) v*=1+u.grit/100; }
  if(u.uniq.includes('grief') && down && k!=='spd') v*=1.15;
  if(k==='spd'){ if(B&&B.partySpd) v*=1+B.partySpd/100; if(u.spdUp) v*=1+u.spdUp/100; if(B&&hasAtkUp(u)){ const ac=partyMax('accomp'); if(ac) v*=1+ac/100; } }
  return v; }

// ゲージ：自分の行動で溜まる分は上限なし。仲間からもらう分は1人1ターン50まで
function addGauge(u,v,fromAlly){ if(!u||u.isEnemy||u.hp<=0||!(v>0)) return 0; if(fromAlly){ v=Math.min(v,GIFT_CAP-(u.gift||0)); if(v<=0) return 0; u.gift=(u.gift||0)+v; } u.gauge=Math.min(100,(u.gauge||0)+v); return v; }
// ノアなど「配る」側：時の贈り物（次のアクティブ強化）も一緒に渡す
function giveGauge(from,to,v,pow){ const got=addGauge(to,v,to!==from); if(got>0 && to!==from){ const g=Math.max(pow||0,(from.P&&from.P.gift)||0); if(g) to.nextPow=Math.max(to.nextPow||0,g); } return got; }
function addKi(u,n){ if(!u||u.hp<=0) return; if(u.P&&u.P.desperate&&u.hp<=u.mhp*0.5) n*=2; u.ki=Math.min(10,(u.ki||0)+n); }
// 溜めて撃つパッシブ
// 溜まった数を足すだけ。発動は行動の区切りで（flushStacks）
function stackUp(u,id,n){ const P=u.P||{}; if(!P[id]||u.hp<=0) return; u.stk[id]=(u.stk[id]||0)+(n||1); }
async function flushStacks(){ for(let loop=0;loop<3;loop++){ let fired=false;
  for(const u of B.party){ if(u.hp<=0) continue; for(const def of u.kit.P){ if(!def.need||!u.P[def.id]) continue; if((u.stk[def.id]||0)>=def.need && alive(B.enemies).length){ u.stk[def.id]-=def.need; fired=true; await firePassive(u,def.id); } } }
  if(!fired) break; } }

// ---- 戦闘開始 ----
async function battleOpen(){
  for(const u of B.party){
    if(u.uniq.includes('startAll')) for(const k of ['atk','def','mat','mdf','spd']) u.buff[k]=[1,3];
    if(u.P.finaleOpen) {}
  }
  B.prevFoes=G.lastFoes||[]; G.lastFoes=[...new Set(B.enemies.map(foeKey))];
  if(partyMax('appraise')) for(const e of alive(B.enemies)) revealWeak(e);
  for(const u of B.party){ if(u.hp>0&&u.P.vesselKin) for(const e of alive(B.enemies)) addCurse(e,Math.floor(u.P.vesselKin),u); }
  for(const u of B.party) kitTrace(u);
}
function kitTrace(u){} // 予備（表示用）

async function simBattle(enemies,maxT){
  const was=SIM.on; SIM.on=true;
  B={enemies, party:G.party.map(partyUnit), turn:0, opts:{}, pops:[], fx:[], shake:0, partySpd:0, meter:{}, queue:[]};
  await battleOpen();
  let r=null; while(!r){ r=await battleTurn(); if(!r&&B.turn>=(maxT||80)) r='timeout'; }
  const out={r, turns:B.turn, edmg:B.enemies.reduce((a,e)=>a+(e.mhp-Math.max(0,e.hp)),0), meter:B.meter, hp:B.party.map(u=>Math.max(0,u.hp)/u.mhp), dead:B.party.filter(u=>u.hp<=0).length};
  B=null; SIM.on=was; return out;
}

// ---------- 1ターン（全員自動） ----------
async function battleTurn(){
  B.turn++; B.firstAny=null; B.nextCrit=null;
  for(const u of B.party){ u.prevHp=u.hp; u.gift=0; u.tf={}; u.retal=0; }
  const units=[...B.party.filter(canAct), ...alive(B.enemies).filter(canAct)];
  const order=units.map(u=>({u, s:sv(u,'spd')*rnd(0.9,1.1)*(u.flags&&u.flags.first?10:1)})).sort((a,b)=>b.s-a.s);
  B.party.forEach(u=>{ u.flags.first=false; });
  B.queue=order.map(o=>o.u);
  for(B.qi=0; B.qi<B.queue.length; B.qi++){
    const u=B.queue[B.qi];
    if(u.hp<=0 || !canAct(u)) continue;
    if(!B.firstAny) B.firstAny=u;
    if(u.isEnemy){
      const c=aiEnemy(u); if(u.ab&&u.ab.includes('twice')) u.twice=true;
      await doEnemy(u,c);
      if(u.twice && u.hp>0 && alive(B.party).length){ u.twice=false; await doEnemy(u, aiEnemy(u)); }
    } else {
      await partyTurn(u);
    }
    if(alive(B.enemies).length&&alive(B.party).length) await flushStacks();
    renderTop(B.party);
    const r=checkEnd(); if(r){ B.queue=[]; return r; }
  }
  B.queue=[];
  await endOfTurn();
  if(alive(B.enemies).length&&alive(B.party).length) await flushStacks();
  return checkEnd();
}
// 1人ぶんの番：本来の行動＋もう1回行動
async function partyTurn(u){
  u.tf.first=(B.firstAny===u);
  if(u.tf.first && u.P.moonFang) stackUp(u,'moonFang');
  await partyAct(u);
  if(u.P.waver && Math.random()*100<u.P.waver) u.extra++;
  let n=0;
  while(u.extra>0 && n<2 && u.hp>0 && canAct(u) && alive(B.enemies).length){ u.extra--; n++; await blog(`${u.name}がもう一度動く！`,380); await partyAct(u,{extra:true}); }
  u.extra=0;
}
function nextAlly(u){ for(let i=B.qi+1;i<B.queue.length;i++){ const x=B.queue[i]; if(!x.isEnemy&&x!==u&&x.hp>0) return x; } return null; }

async function partyAct(u, opt){
  opt=opt||{};
  u.air=false;
  if(u.st.confuse && Math.random()<0.5){ const t=pick(alive([...B.party,...B.enemies])); await blog(`${u.name}は混乱している！`,400); await hit(u,t,{mult:1,skill:'混乱'}); return; }
  // 連鎖の刃：前に動いた味方からの会心の後押し
  if(B.nextCrit && B.nextCrit.from!==u){ u.tf.critBonus=B.nextCrit.v; B.nextCrit=null; }
  if(u.stance){ if(u.stance.cover && !(u.tauntSk&&u.tauntSk.cover)) u.cover=0; u.stance=null; if(u.stanceTaunt){ u.taunt=0; u.stanceTaunt=0; } }
  const want=(u.gauge>=100 || u.forceActive);
  if(want && !u.st.silence && (u.forceActive || activeReady(u))){ u.forceActive=false; u.gauge=0; await useActive(u); }
  else await normalAct(u);
  u.tf.critBonus=0;
  // 早回し・刻み：次に動く味方へ
  const nx=nextAlly(u);
  if(nx){ if(u.P.haste) addGauge(nx,u.P.haste,true); }
  if(u.ki>=10 && u.P.kiBurst) await firePassive(u,'kiBurst');
  for(const x of alive(B.party)) if(x.P.kingReturn) stackUp(x,'kingReturn');
  if(G.chapter===1){ const k=u.N.el||'none'; G.elemUse[k]=(G.elemUse[k]||0)+1; }
}
// 回復・蘇生のアクティブは、必要になるまで溜めて待つ
function activeReady(u){ const a=u.A;
  if(a.k==='heal') return B.party.some(x=>x.hp>0&&x.hp<x.mhp*0.6);
  if(a.k==='revive') return B.party.some(x=>x.hp<=0||x.hp<x.mhp*0.6);
  if(a.xTaken) return (u.taken||0)>=u.mhp*0.3;
  return true; }

// 属性：弱点を知っていればそこを突く。知らなければ順番に試して探す（見つけると図鑑に残る）
const TRY_EL=['fire','ice','thunder','light','dark'];
function resolveElem(u,el,t){
  const ban=t.zaganRule;
  if(el==='allweak') return t.weak||(ban==='light'?'fire':'light');
  if(el!=='weak') return el||'none';
  const r=dexEnemy(t,false); if(r.w && t.weak) return t.weak;
  r.tried=r.tried||[]; const e=TRY_EL.find(x=>!r.tried.includes(x)&&x!==ban)||(ban==='fire'?'ice':'fire'); if(!r.tried.includes(e)) r.tried.push(e); return e;
}
function pickTargets(tgt){ const en=alive(B.enemies); if(!en.length) return [];
  if(tgt==='all') return en;
  if(tgt==='low') return [en.slice().sort((a,b)=>a.hp-b.hp)[0]];
  if(tgt==='high') return [en.slice().sort((a,b)=>b.hp-a.hp)[0]];
  if(tgt==='mostSt') return [en.slice().sort((a,b)=>nSt(b)-nSt(a)||b.hp-a.hp)[0]];
  if(tgt==='random') return [pick(en)];
  return [en[0]]; }

// ---------- 通常攻撃 ----------
async function normalAct(u,opt){
  const s=u.N, P=u.P; if(!alive(B.enemies).length) return;
  if(!u.isEnemy){ u.pose=true; renderTop(B.party); const bb=B; clearTimeout(u.poseT); u.poseT=setTimeout(()=>{ u.pose=false; if(B===bb) renderTop(B.party); }, 700/G.settings.speed); }
  await blog(`${u.name}の ${s.nm}！`,250);
  if(!u.isEnemy){ const M=meter(u); (M.by[s.nm]||(M.by[s.nm]={dmg:0,heal:0,n:0,crit:0})).n++; }
  const base=25+(P.breath||0);
  const r=await runSkill(u,s,{normal:true});
  if(!s.mimicN) B.lastN={s,u};
  if(!(opt&&opt.noG) && (s.k!=='atk'||r.hits>0)){ let g=s.gph? (P.breath||0) : base; if(u.uniq.includes('gDouble')) g*=2; addGauge(u, g+(u.gx?u.gx.n:0)); }
  if(u.uniq.includes('dblAtk') && s.k==='atk' && alive(B.enemies).length && Math.random()<0.1){ await blog(`${u.name}の二連撃！`,250); await runSkill(u,s,{normal:true}); }
  if(P.rapid && s.k==='atk' && alive(B.enemies).length && Math.random()*100<P.rapid){ await blog(`${u.name}の連射！`,250); await runSkill(u,s,{normal:true}); }
}
// ---------- アクティブ ----------
async function useActive(u){
  const a=u.A; const M=meter(u); M.acts++; (M.by[a.nm]||(M.by[a.nm]={dmg:0,heal:0,n:0})).n++;
  u.pose=true; renderTop(B.party); const bb=B; clearTimeout(u.poseT); u.poseT=setTimeout(()=>{ u.pose=false; if(B===bb) renderTop(B.party); }, 1100/G.settings.speed);
  await blog(`<span style="color:#ffd166">★</span> ${u.name}の ${a.nm}！`,450); sfx(a.rank>=5?'ult':'buff');
  let pow=(1+(u.nextPow||0)/100)*(1+((u.gx&&u.gx.ap)||0)/100); u.nextPow=0;
  if(u.P.blood){ const c=Math.round(u.mhp*0.15); if(u.hp>c+1){ u.hp-=c; u.taken=(u.taken||0)+c; pop(u,'-'+c,'#fca5a5'); pow*=1+u.P.blood/100; } }
  const sure=!!B.nextActCrit; B.nextActCrit=null;
  if(u.foreMul){ pow*=u.foreMul; u.foreMul=0; }
  let run=a;
  if(a.mimic && B.lastA && B.lastA.u!==u){ const L=B.lastA.s; run={...L, m:(L.m||0)*a.mimic, nm:a.nm+'（'+L.nm+'）', mimic:0, gSelf:(a.gSelf||0)}; if(run.tgt==='all'&&a.mimic>1) run.m=L.m*Math.min(a.mimic,1.2); await blogAdd(`${L.nm}をまねした！`,300); }
  const r=await runSkill(u,run,{pow,sure,active:true});
  if(!a.mimic) B.lastA={s:a,u};
  // もう一度出る（1回まで）
  let again=0, why='';
  if(a.kRe && r.kills>0 && (!a.kReCrit||r.critKills>0)){ again=a.kRe; why='倒した勢いで'; }
  else if(a.reKi10 && u.ki>=10){ again=1; why='気が満ちて'; }
  else if(u.P.spread && alive(B.enemies).some(e=>e.st.burn) && a.k==='atk'){ again=u.P.spread/100; why='炎が燃え広がり'; }
  if(!again && u.P.encore && Math.random()*100<u.P.encore){ again=1; why='アンコールにこたえて'; }
  if(again && alive(B.enemies).length){ await blog(`${why}、${a.nm}がもう一度！`,420); await runSkill(u,run,{pow:pow*again,active:true,re:true}); }
  if(u.P.command2){ const x=alive(B.party).filter(x=>x!==u&&x.gauge<100).sort((p,q)=>q.gauge-p.gauge)[0]; if(x) addGauge(x,u.P.command2,true); }
  { const keep=Math.min(50,((u.gx&&u.gx.keep)||0)+(u.uniq.includes('gHalf')?50:0)); if(keep>0 && u.hp>0) u.gauge=Math.max(u.gauge||0,keep); }
  if(u.uniq.includes('gShare')) for(const x of alive(B.party)) if(x!==u) addGauge(x,15,true);
  if(u.P.finale2) stackUp(u,'finale2');
  if(u.P.afterglow && r.dmg>0){ const h=r.dmg*u.P.afterglow/100/Math.max(1,alive(B.party).length); for(const x of alive(B.party)) await healUnit(u,x,h,'祈りの残り火',true); }
  if(u.P.command) for(const x of alive(B.party)) addAtkUp(x,'command',u.P.command,2);
  // 仲間のアクティブに反応する
  for(const x of alive(B.party)){
    if(x.P.afterlight) stackUp(x,'afterlight');
    if(x===u) continue;
    if(x.P.resonance) addGauge(x,x.P.resonance,true);
    if(x.P.resonate) await healUnit(x,u,u.mhp*x.P.resonate/100,'旋律の共鳴',true);
    if(x.P.admire && (u.name==='アルト'||u.name==='レオン')) addGauge(x,x.P.admire,true);
    if(x.P.nextEra) stackUp(x,'nextEra');
    if(x.P.follow && !x.tf.followed && r.lastT && r.lastT.hp>0 && a.k==='atk'){ x.tf.followed=1; await blog(`${x.name}が続いて斬りかかる！`,300); await hit(x,r.lastT,{mult:x.P.follow,skill:'続く剣',passive:1}); }
  }
  renderTop(B.party);
}

// ---------- スキルを動かす（通常・アクティブ共通） ----------
async function runSkill(u,s,ctx){
  ctx=ctx||{}; const R={hits:0,kills:0,critKills:0,crits:0,dmg:0,lastT:null};
  const nm=s.nm, pow=ctx.pow||1;
  if(s.mimicN && B.lastN && B.lastN.u!==u && B.lastN.s.k==='atk'){ const L=B.lastN.s; await blogAdd(`${L.nm}をまねした！`,250); return runSkill(u,{...L, m:L.m*s.mimicN, nm:L.nm, mimicN:0, gSelf:(L.gSelf||0)+(s.gSelf||0)},ctx); }
  if(s.k==='atk'){
    let targets=s.rh? new Array(s.h||1).fill('R') : pickTargets(s.tgt); if(!targets.length||!alive(B.enemies).length) return R;
    let kiSpent=0; if(s.xKi){ kiSpent=u.ki||0; u.ki=0; }
    if(s.cost && !(s.costIfAbove && u.hp<=u.mhp*s.costIfAbove)){ const c=Math.round(u.mhp*s.cost/100); if(u.hp>c){ u.hp-=c; u.taken=(u.taken||0)+c; pop(u,'-'+c,'#fca5a5'); } }
    for(let t of targets){ if(t==='R'){ const en=alive(B.enemies); if(!en.length) break; t=pick(en); } if(t.hp<=0) continue;
      R.lastT=t;
      if(s.m>0){
        const el=resolveElem(u,s.el,t);
        let mult=s.m*pow;
        if(s.xLearnAll) mult=Math.max(s.m,s.xLearnAll*(u.learn||0))*pow;
        if(s.xTakenScale) mult*=1+(s.xTakenScale-1)*Math.min(1,(u.taken||0)/u.mhp);
        if(s.xUndead && isUndead(t)) mult*=s.xUndead;
        if(s.xFoeLow) mult*=1+(s.xFoeLow-1)*(1-t.hp/t.mhp);
        if(s.xSelfFull && u.hp>=u.mhp) mult*=s.xSelfFull;
        if(s.xLearn) mult*=1+s.xLearn*(u.learn||0);
        if(s.focus){ if(u.focusT!==t){ u.focusT=t; u.focusN=0; } mult*=1+s.focus*Math.min(10,u.focusN)/100; u.focusN++; }
        if(s.lucky && Math.random()*100<s.lucky.c){ mult*=s.lucky.x; pop(t,'大当たり！','#facc15'); }
        if(s.xLow && t.hp<=t.mhp*s.xLow.th) mult*=s.xLow.x;
        if(s.xSelfLow && u.hp<=u.mhp*s.xSelfLow.th) mult*=s.xSelfLow.x;
        if(s.xSelfScale) mult*=1+(s.xSelfScale-1)*(1-u.hp/u.mhp);
        if(s.xSt && (s.xSt.st==='defDown'?defDown(t):s.xSt.st==='mark'?t.mark>0:t.st[s.xSt.st])) mult*=s.xSt.x;
        if(s.xPerSt) mult*=1+s.xPerSt*nSt(t);
        if(s.xFirst && u.tf.first) mult*=s.xFirst;
        if(s.xTaunt && u.taunt>0) mult*=s.xTaunt;
        if(s.xPerAtkUp) mult*=1+s.xPerAtkUp*B.party.filter(x=>x.hp>0&&hasAtkUp(x)).length;
        if(s.xAnyAtkUp && B.party.some(x=>x.hp>0&&hasAtkUp(x))) mult*=s.xAnyAtkUp;
        if(s.xPerFull) mult*=1+s.xPerFull*alive(B.party).filter(x=>x.hp>=x.mhp).length;
        if(s.xKi) mult*=1+s.xKi*kiSpent;
        if(s.xWeak && t.weak===el) mult*=s.xWeak;
        let hits=s.rh?1:(s.h||1); if(s.weakH && t.weak===el) hits=s.weakH;
        let sure=!!(s.sc||ctx.sure); let cr=(s.cr||0);
        if(s.scIf==='mark' && t.mark>0) sure=true;
        if(s.scIf==='paralyze' && t.st.paralyze) sure=true;
        if(s.scIf==='st2' && nSt(t)>=2) sure=true;
        if(s.scIf==='ki8' && kiSpent>=8) sure=true;
        if(s.scIf==='ki5' && (u.ki||0)>=5) cr+=30;
        if(s.weakCr && t.weak===el) cr+=s.weakCr;
        const idef=s.idef||(s.idefLow&&u.hp<=u.mhp*0.3?1:0);
        let extraHits=0;
        for(let h=0;h<hits+extraHits && t.hp>0;h++){
          const o={mult, mag:!!s.mag, elem:el, crit:cr, sureCrit:sure, ignoreDef:idef, drain:s.drain, skill:nm, normal:!!ctx.normal, active:!!ctx.active, critX:s.critX, weakX:s.weakX};
          if(s.xTaken) o.fixed=Math.max(1,Math.round((u.taken||0)*mult));
          const hp0=t.hp; const d=await hit(u,t,o);
          if(t.hp<=0 && d>hp0) R.over=(R.over||0)+(d-hp0);
          if(d>0){ R.hits++; R.dmg+=d; if(s.gp&&B) B.goldGain=(B.goldGain||0)+d*s.gp/100; if(s.gph) addGauge(u,s.gph); if(s.kph) addKi(u,s.kph); if(s.hLow) await healLowest(u,d*s.hLow/100,nm); if(s.hAll){ for(const x of alive(B.party)) await healUnit(u,x,d*s.hAll/100/4,nm,true); } }
          if(o.didCrit){ R.crits++; if(s.cG) addGauge(u,s.cG); if(s.cPG) for(const x of alive(B.party)) if(x!==u) addGauge(x,s.cPG,true); if(s.cSpd) u.spdUp=Math.min(50,(u.spdUp||0)+10); if(s.cHit && extraHits<5) extraHits++; }
          if(t.hp<=0){ R.kills++; if(o.didCrit) R.critKills++; }
        }
        if(t.hp>0 && s.exec && !t.boss && t.hp<=t.mhp*s.exec.th && Math.random()*100<s.exec.c){ pop(t,'葬送','#e9d5ff'); await fixedHit(u,t,t.hp,nm,'#e9d5ff'); R.kills++; }
        if(t.hp>0 && s.curseBurst && t.curse>0){ const n=t.curse; t.curse=s.keepCurse?Math.floor(n/2):0; pop(t,'呪いがはじけた','#c084fc'); const d2=await hit(u,t,{mult:s.curseBurst*n*pow,mag:true,elem:'dark',skill:nm,passive:1}); R.dmg+=d2; }
        if(t.hp<=0){ await onKillBySkill(u,s,t); continue; }
      }
      // 当てたあとに付くもの
      if(s.st){ const ok=addStatus(t,s.st.s,s.st.c,u,s); if(ok){ if(s.st.s==='sleep'&&s.stG) addGauge(u,s.stG); if(s.st.s==='stop'){ if(s.stopG) for(const x of alive(B.party)) addGauge(x,s.stopG,x!==u); if(s.stopAgain&&!u.tf.stopAgain){ u.tf.stopAgain=1; u.extra++; } } } }
      if(s.st2) addStatus(t,s.st2.s,s.st2.c,u,s);
      if(s.stPick){ const pool=['poison','paralyze','burn'].filter(x=>!t.st[x]); for(let i=0;i<s.stPick.n && pool.length;i++){ const x=pool.splice(Math.floor(Math.random()*pool.length),1)[0]; addStatus(t,x,s.stPick.c,u,s); } }
      if(s.elSt){ const el=resolveElem(u,s.el,t); if(el==='fire') addStatus(t,'burn',100,u,s); if(el==='ice') addStatus(t,'freeze',100,u,s); }
      if(s.dd && Math.random()*100<s.dd){ t.buff.def=[-1,3]; pop(t,'防御↓','#93c5fd'); }
      if(s.sd) t.buff.spd=[-1,3];
      if(s.mark){ t.mark=Math.max(t.mark||0,s.mark+1); t.markCr=Math.max(t.markCr||0,s.markCr||40); if(s.markG) t.markG=u; pop(t,'印','#f0abfc'); }
      if(s.lvn){ t.lvn=[s.lvn.pct,s.lvn.t+1]; }
      if(s.curse) addCurse(t,s.curse,u);
      if(s.reveal) revealWeak(t);
      if(s.expose){ t.vuln=[s.expose.pct,s.expose.t+1]; pop(t,'見抜いた','#fde68a'); }
      if(s.atkDown){ t.buff.atk=[-1,3]; pop(t,'攻撃↓','#93c5fd'); }
      if(s.poisonExt && t.st.poison) t.st.poison+=1;
      if(s.stAdd){ const pool=['poison','paralyze','burn'].filter(x=>!t.st[x]); if(pool.length) addStatus(t,pick(pool),100,u,s); }
      if(s.st2G && nSt(t)>=2) addGauge(u,s.st2G);
      if(s.kpt) addKi(u,s.kpt);
    }
    if(s.burst){ let n=0; for(const e of alive(B.enemies)){ if(!e.st.burn) continue; const d=Math.round((e.burnPow||1)*e.st.burn*s.burst*pow); n++; await fixedHit(u,e,d,nm,'#f97316'); if(!s.keepBurn) delete e.st.burn; } if(s.burstG) addGauge(u,s.burstG*n); }
    if(s.splash) for(const e of alive(B.enemies)) if(e!==R.lastT) await hit(u,e,{mult:s.splash*pow,mag:!!s.mag,elem:resolveElem(u,s.el,e),skill:nm});
    if(s.land) for(const e of alive(B.enemies)) await hit(u,e,{mult:s.land*pow,skill:nm});
    if(s.kiBack) addKi(u,Math.floor(kiSpent*s.kiBack));
    if(s.kKi && R.kills>0) u.ki=Math.max(u.ki||0,kiSpent);
    if(s.burnG) addGauge(u,s.burnG*alive(B.enemies).filter(e=>e.st.burn).length);
    if(s.slG){ const n=alive(B.enemies).filter(e=>e.st.sleep).length; for(const x of alive(B.party)) if(x!==u) giveGauge(u,x,s.slG*n); }
    if(s.gpt) addGauge(u,s.gpt*R.hits);
    if(s.spill && R.over>0){ const nx=alive(B.enemies)[0]; if(nx){ pop(nx,'あふれた','#fca5a5'); await fixedHit(u,nx,R.over,nm,'#fca5a5'); } }
    if(u.P.aftershock && s.tgt!=='all' && !s.rh && R.dmg>0 && !ctx.re) for(const e of alive(B.enemies)) if(e!==R.lastT) await fixedHit(u,e,R.dmg*u.P.aftershock/100,'余波','#fca5a5');
  }
  else if(s.k==='pray'){
    const hurt=alive(B.party).filter(x=>x.hp<x.mhp*0.8).sort((a,b)=>a.hp/a.mhp-b.hp/b.mhp);
    if(hurt.length){ for(const t of hurt.slice(0,s.n||1)){ const h=await healUnit(u,t,sv(u,'mat')*s.m*pow,nm); if(s.cure) t.st={}; if(s.healHit && h>0){ const e=pickTargets('front')[0]; if(e) await fixedHit(u,e,Math.round(h*s.healHit),nm,'#fef9c3'); } } R.hits=1; }
    else { const t=pickTargets('front')[0]; if(t){ const d=await hit(u,t,{mult:0.8*pow,mag:true,elem:'light',skill:nm,normal:true}); if(d>0){R.hits=1;R.dmg+=d;} } }
  }
  else if(s.k==='heal'){
    if(s.tgt==='all'){ for(const x of alive(B.party)) await healUnit(u,x,sv(u,'mat')*s.m*pow,nm,true,false,s); if(u.P.judge) stackUp(u,'judge'); await blogAdd('みんなのHPが回復した',420); }
    else { const x=alive(B.party).sort((p,q)=>p.hp/p.mhp-q.hp/q.mhp)[0]; await healUnit(u,x,sv(u,'mat')*s.m*pow,nm,false,false,s); if(x&&s.toG) addGauge(x,s.toG,x!==u); }
    if(s.cure) alive(B.party).forEach(x=>{ for(const k of AILMENT) delete x.st[k]; });
    if(s.pCut) alive(B.party).forEach(x=>setCut(x,s.pCut.pct,s.pCut.t+1));
    if(s.pG) for(const x of alive(B.party)) if(x!==u) addGauge(x,s.pG,true);
  }
  else if(s.k==='shield'){
    const ts= s.tgt==='all'? alive(B.party) : alive(B.party).sort((p,q)=>p.hp/p.mhp-q.hp/q.mhp).slice(0,s.n||1);
    const shV=Math.round(s.shHp? u.mhp*s.shHp/100*pow : sv(u,'mat')*s.m*pow);
    for(const x of ts){ const v=shV; x.shield=(x.shield||0)+v; if(s.shAtk) x.shAtk=s.shAtk; if(s.shBurst) x.shFrom=u; pop(x,'加護 '+v,'#bae6fd'); }
    if(s.pAtk) for(const x of alive(B.party)) addAtkUp(x,'sk_'+u.name,s.pAtk.pct,s.pAtk.t);
    if(s.pCut) alive(B.party).forEach(x=>setCut(x,s.pCut.pct,s.pCut.t+1));
    if(s.pG) for(const x of alive(B.party)) if(x!==u) giveGauge(u,x,s.pG);
    if(s.cure) alive(B.party).forEach(x=>{ for(const k of AILMENT) delete x.st[k]; });
    if(!ctx.normal) await blogAdd(ts.length>1?'みんなに加護がついた':`${ts[0].name}に加護がついた`,400);
  }
  else if(s.k==='support'){
    if(s.pAtk) for(const x of alive(B.party)) addAtkUp(x,'sk_'+u.name,s.pAtk.pct,s.pAtk.t);
    if(s.pCrit) for(const x of alive(B.party)){ const t=(s.pAtk?s.pAtk.t:2)+1; if(!x.critBuff||x.critBuff[0]<=s.pCrit) x.critBuff=[s.pCrit,t]; }
    if(s.pCut) alive(B.party).forEach(x=>setCut(x,s.pCut.pct,s.pCut.t+1));
    if(s.pSpd) alive(B.party).forEach(x=>{ x.buff.spd=[1,s.pSpd+1]; });
    if(s.pG) for(const x of alive(B.party)) if(x!==u) giveGauge(u,x,s.pG,s.nextPow);
    if(s.gTop){ const ts=alive(B.party).filter(x=>x!==u&&x.gauge<100).sort((a,b)=>b.gauge-a.gauge).slice(0,s.gTopN||1); for(const x of ts) giveGauge(u,x,s.gTop,s.nextPow); }
    if(s.nextCrit) B.nextActCrit=1;
    if(s.weakBuff) B.weakBuff=[s.weakBuff.pct,s.weakBuff.t+1];
    if(s.reveal) for(const e of alive(B.enemies)) revealWeak(e);
    if(s.pHeal) for(const x of alive(B.party)) await healUnit(u,x,x.mhp*s.pHeal/100*pow,nm,true);
    if(s.cure) alive(B.party).forEach(x=>{ for(const k of AILMENT) delete x.st[k]; });
    if(!ctx.normal){ await blogAdd(s.pAtk?'みんなの力が湧き上がる':'みんなのゲージが増えた',420); }
    if(s.allAttack) for(const x of alive(B.party)){ if(x===u||!canAct(x)||x.tf.pushed||!alive(B.enemies).length) continue; x.tf.pushed=1; await normalAct(x,{noG:true}); }
    if(s.actTop){ const x=alive(B.party).filter(x=>x!==u&&canAct(x)).sort((a,b)=>b.gauge-a.gauge)[0]; if(x&&!x.tf.pushed){ x.tf.pushed=1; await blog(`${x.name}がすぐに動く！`,350); await partyAct(x,{extra:true}); } }
  }
  else if(s.k==='taunt'){
    u.taunt=s.turns+1; setCut(u,s.cut||0,s.turns+1); u.tauntSk=s; pop(u,s.cover?'かばう':'挑発','#fde68a'); if(s.cover) u.cover=s.turns+1;
    if(s.atkSelf) addAtkUp(u,'taunt',s.atkSelf.pct,s.atkSelf.t);
    if(s.pCut) alive(B.party).forEach(x=>{ if(x!==u) setCut(x,s.pCut.pct,s.pCut.t+1); });
    await blogAdd(`敵の目が ${u.name} に向いた`,420);
  }
  else if(s.k==='stance'){
    u.stance=s; if(s.cover) u.cover=Math.max(u.cover||0,2); if(!s.noTaunt){ u.taunt=Math.max(u.taunt||0,1); u.stanceTaunt=1; } if(s.defUp) u.buff.def=[1,2];
    pop(u,s.cover?'かばう':s.noTaunt?'構え':'挑発','#fde68a');
  }
  else if(s.k==='revive'){
    const dead=B.party.filter(x=>x.hp<=0);
    if(dead.length){ for(const x of dead){ x.hp=Math.min(x.mhp,Math.round(x.mhp*s.rev/100*pow)); x.gauge=s.fullG?100:0; x.st={}; x.buff={}; pop(x,'復活','#c084fc'); meterAdd(u,nm,'heal',x.hp); } sfx('heal'); await blogAdd(`${dead.map(x=>x.name).join('と')}が立ち上がった`,500); }
    else { for(const x of alive(B.party)) await healUnit(u,x,x.mhp*s.pHeal/100*pow,nm,true); await blogAdd('みんなのHPが回復した',420); }
    if(s.guardAll) B.party.forEach(x=>{ if(x.hp>0) x.guardOnce=1; });
  }
  // スキル共通のおまけ
  if(s.k==='atk'){
    if(s.pHeal) for(const x of alive(B.party)) await healUnit(u,x,x.mhp*s.pHeal/100,nm,true);
    if(s.cure) alive(B.party).forEach(x=>{ for(const k of AILMENT) delete x.st[k]; });
    if(s.pShield) for(const x of alive(B.party)){ const v=Math.round(sv(u,'mat')*s.pShield); x.shield=(x.shield||0)+v; }
    if(s.pAtk) for(const x of alive(B.party)) addAtkUp(x,'sk_'+u.name,s.pAtk.pct,s.pAtk.t);
    if(s.tauntSelf){ u.taunt=Math.max(u.taunt||0,s.tauntSelf+1); setCut(u,s.cutSelf||0,s.tauntSelf+1); pop(u,'挑発','#fde68a'); }
    if(s.air){ u.air=true; pop(u,'跳躍','#e0f2fe'); }
    if(s.fullG) for(const x of alive(B.party)) if(x.hp>=x.mhp) addGauge(x,s.fullG,x!==u);
  }
  if(s.gAll) for(const x of alive(B.party)) if(x!==u) addGauge(x,s.gAll,true);
  if(s.gSelf) addGauge(u,s.gSelf);
  if(s.kAdd) addKi(u,s.kAdd);
  if(s.spdSelf) u.buff.spd=[1,3];
  if(s.gLow){ const ts=alive(B.party).filter(x=>x!==u).sort((a,b)=>a.gauge-b.gauge).slice(0,s.gLowN||1); for(const x of ts){ addGauge(x,s.gLow,true); if(s.aLow) addAtkUp(x,'guide',s.aLow,2); } }
  if(s.gNext){ const nx=nextAlly(u); if(nx) addGauge(nx,s.gNext,true); }
  if(s.again && Math.random()*100<s.again && !u.tf.again){ u.tf.again=1; u.extra++; }
  if(s.allDown) for(const e of alive(B.enemies)){ e.buff.atk=[-1,3]; }
  if(s.selfStack) u.selfStk=Math.min(50,(u.selfStk||0)+s.selfStack);
  if(s.selfDefUp) u.buff.def=[1,3];
  return R;
}
// 倒したとき（スキル側）
async function onKillBySkill(u,s,t){
  if(s.kG) addGauge(u,s.kG);
  if(s.kAtk) for(const x of alive(B.party)) addAtkUp(x,'kill_'+u.name,s.kAtk.pct,s.kAtk.t);
  if(s.kAgain && !u.tf.kAgain){ u.tf.kAgain=1; u.extra++; }
  if(s.kAtkSelf) u.atkStack=(u.atkStack||0)+s.kAtkSelf;
  if(s.kSpread && !t.spreadDone){ t.spreadDone=1; const nx=alive(B.enemies).filter(e=>!e.st[s.kSpread])[0]; if(nx) addStatus(nx,s.kSpread,100,u,s); }
}
async function healLowest(u,amt,skill){ const x=alive(B.party).sort((p,q)=>p.hp/p.mhp-q.hp/q.mhp)[0]; if(x) await healUnit(u,x,amt,skill,true); }
async function healUnit(u,t,amt,skill,quiet,noEvt,s){
  if(!t||t.hp<=0) return 0;
  const P=u.P||{};
  let h=Math.round(amt*rnd(.95,1.05)); const room=t.mhp-t.hp; const over=Math.max(0,h-room); h=Math.min(h,room);
  t.hp+=h; if(h>0){ pop(t,'+'+h,'#4ade80'); meterAdd(u,skill,'heal',h); sfx('heal'); }
  // あふれる癒やし・祈りの光★3
  const ov=((P.overflow||0)/100) + (s&&s.over?1:0); if(over>0 && ov>0){ const v=Math.round(over*Math.min(1,ov)); t.shield=(t.shield||0)+v; pop(t,'加護 '+v,'#bae6fd'); }
  if(!noEvt && (h>0||over>0)){
    if(P.healWind && t!==u) addGauge(t,P.healWind,true);
    if(P.bless) addAtkUp(t,'bless',P.bless,2);
    if(P.judge && !quiet) stackUp(u,'judge');
    for(const x of alive(B.party)){ if(x.P.cycle) addGauge(x,x.P.cycle); if(x.P.pillar) stackUp(x,'pillar'); }
  }
  if(!quiet && h>0) await blogAdd(`${t.name}のHPが <b style="color:#4ade80">${h}</b> 回復`,420);
  return h;
}
// 防御を通さない固定ダメージ（爆炎・燃焼など）
async function fixedHit(a,t,d,skill,col){ if(t.hp<=0) return 0; d=Math.max(1,Math.round(d)); t.hp=Math.max(0,t.hp-d); pop(t,d,col||'#fff'); meterAdd(a,skill,'dmg',d); t.flash=performance.now();
  if(t.hp<=0) await onDown(t,a); return d; }

// ---------- パッシブの技 ----------
async function firePassive(u,id){
  const P=u.P, v=P[id], def=u.kit.P.find(p=>p.id===id); if(!def||u.hp<=0&&id!=='vengeance') return;
  const nm=def.nm; const en=()=>alive(B.enemies);
  if(!en().length) return;
  u.pose=true; renderTop(B.party); const bb=B; clearTimeout(u.poseT); u.poseT=setTimeout(()=>{ u.pose=false; if(B===bb) renderTop(B.party); }, 900/G.settings.speed);
  await blog(`<span style="color:#7dd3fc">◆</span> ${u.name}の ${nm}！`,420); sfx('buff');
  const all=async(o)=>{ for(const e of en()) await hit(u,e,{passive:1,skill:nm,...o}); };
  switch(id){
    case 'oath': await all({mult:v,elem:'light'}); alive(B.party).forEach(x=>setCut(x,20,2)); break;
    case 'judge': await all({mult:v,mag:true,elem:'light'}); break;
    case 'nightmare': for(const e of en().filter(e=>e.st.sleep)) await hit(u,e,{passive:1,skill:nm,mult:v,mag:true,elem:'dark',noWake:1}); break;
    case 'kiBurst': u.ki=0; await all({mult:v}); break;
    case 'rage': { const t=pickTargets('high')[0]; if(t) await hit(u,t,{passive:1,skill:nm,mult:v*(1+0.5*(1-u.hp/u.mhp)),elem:'dark'}); } break;
    case 'immovable': await all({mult:v}); u.taunt=Math.max(u.taunt||0,2); pop(u,'挑発','#fde68a'); break;
    case 'thousand': for(let i=0;i<4;i++) await all({mult:v,sureCrit:true}); break;
    case 'ember': await all({mult:v,mag:true,elem:'fire'}); for(const e of en()) addStatus(e,'burn',60,u); break;
    case 'moonFang': { const t=pickTargets('high')[0]; if(t) await hit(u,t,{passive:1,skill:nm,mult:v,elem:'light',sureCrit:true}); } break;
    case 'finale': { const t=pickTargets('mostSt')[0]; if(t) await hit(u,t,{passive:1,skill:nm,mult:v*Math.max(1,nSt(t)),sureCrit:nSt(t)>=2}); } break;
    case 'pillar': await all({mult:v,mag:true,elem:'light'}); break;
    case 'timeEnd': await all({mult:v,mag:true}); for(const e of en()) addStatus(e,'stop',30,u); break;
    case 'afterlight': await all({mult:v,elem:'light'}); for(const x of alive(B.party)) addAtkUp(x,'afterlight',15,2); break;
    case 'lastStand': await all({mult:v,counter:1}); break;
    case 'vengeance': await all({mult:v,elem:'dark'}); break;
    case 'interest': await all({mult:v}); break;
    case 'paladin': await all({mult:v,elem:'light'}); for(const x of alive(B.party)) await healUnit(u,x,x.mhp*0.1,nm,true); break;
    case 'finale2': for(const x of alive(B.party)){ addAtkUp(x,'finale2',v,2); if(x!==u) addGauge(x,20,true); } await blogAdd('みんなの力が湧き上がる',380); break;
    case 'guiding': await all({mult:v,elem:'light',allweak:true}); break;
    case 'darkFest': await all({mult:v,mag:true,elem:'dark'}); break;
    case 'procession': await all({mult:v}); for(const e of en()) if(!e.boss && e.hp<=e.mhp*0.5 && Math.random()<0.1){ pop(e,'葬送','#e9d5ff'); await fixedHit(u,e,e.hp,nm,'#e9d5ff'); } break;
    case 'warCry': await all({mult:v}); break;
    case 'kingReturn': for(const x of alive(B.party)){ addAtkUp(x,'kingReturn',v,2); if(x!==u) addGauge(x,30,true); } await blogAdd('王が、みんなの前に立った',380); break;
    case 'nextEra': { const t=pickTargets('high')[0]; if(t) await hit(u,t,{passive:1,skill:nm,mult:v,elem:'light',sureCrit:true}); } break;
  }
  renderTop(B.party);
}

// ---------- ダメージ計算 ----------
function elemMul(t,elem,att){
  if(!elem||elem==='none') return 1; let m=1;
  if(t.isEnemy && att && !att.isEnemy){ const r=dexEnemy(t,false); if(t.weak===elem && !r.w){ r.w=1; B.newWeak=t; } if(t.resist===elem) r.r=1; }
  if(t.isEnemy){ if(t.weak===elem) m*=1.5; if(t.resist===elem) m*=(t.learned===elem?0.3:0.5); if(elem==='light'&&t.lvn) m*=1+t.lvn[0]/100; }
  else { m*=1-(t.res&&t.res[elem]||0)/100; }
  if(att&&!att.isEnemy){ const P=att.P||{}; if(elem==='light'&&P.primal) m*=1+P.primal/100; if(elem==='light'&&att.uniq.includes('light30')) m*=1.3; if(elem==='dark'&&P.demonBlood) m*=1+P.demonBlood/100; }
  return m;
}
function calcDmg(a,t,o){
  const mag=!!o.mag; let A=mag?sv(a,'mat'):sv(a,'atk'); let D=(o.useMdf||mag)?sv(t,'mdf'):sv(t,'def');
  if(o.ignoreDef) D*=(1-Math.min(1,o.ignoreDef));
  let d=dmgF(A,D)*(o.mult||1);
  const el=o.elem;
  if(o.allweak && t.isEnemy) d*=1.5; else d*=elemMul(t,el,a);
  const isWeak = t.isEnemy && el && el!=='none' && t.weak===el;
  if(isWeak && o.weakX) d*=1+o.weakX;
  let cr=5+(a.crit||0)+(o.crit||0)-(t.critDef||0);
  if(!a.isEnemy && t.isEnemy && B){ const P=a.P||{};
    if(t.st.sleep) cr+=partyMax('dreamCrit');
    if(t.mark>0) cr+=t.markCr||40;
    if(disabled(t)&&P.shatter) cr+=P.shatter;
    if(nSt(t)>=2&&P.finish) cr+=P.finish;
    if(hasAtkUp(a)) cr+=partyMax('lead');
    if(a.critBuff) cr+=a.critBuff[0];
    cr+=a.tf&&a.tf.critBonus||0;
    if(t.st.freeze && partyMax('frost')) d*=1+partyMax('frost')/100;
    if(t.st.freeze && !mag && t.frostPhys) d*=1+t.frostPhys/100;
    if(t.st.stop) d*=1+partyMax('stopped')/100;
    if(defDown(t)&&P.breakDef) d*=1+P.breakDef/100;
    if(a.tf&&a.tf.first&&P.vanguard) d*=1+P.vanguard/100;
    if(t.st.poison&&P.venomHit) d*=1+P.venomHit/100;
    if(isWeak){ const ap=partyMax('appraise'); if(ap) d*=1+ap/100; if(B.weakBuff) d*=1+B.weakBuff[0]/100; }
    cr+=partyMax('fortune');
    if(t.curse>0){ d*=1+0.03*t.curse; const cd=partyMax('cursedDmg'); if(cd) d*=1+cd/100; }
    if(t.vuln) d*=1+t.vuln[0]/100;
    if(isUndead(t)){ const g=partyMax('graveEye'); if(g) d*=1+g/100; }
    if(P.deathScent && t.hp<=t.mhp*0.3) d*=1+P.deathScent/100;
    if(P.remember && B.prevFoes && B.prevFoes.includes(foeKey(t))) d*=1+P.remember/100;
    if(a.nextHitUp && !o.passive){ d*=1+a.nextHitUp/100; a.nextHitUp=0; }
  }
  if(a.isEnemy && !t.isEnemy && B){ const g=alive(B.party).reduce((m,x)=>Math.max(m,(x.P&&x.P.allyCritDef)||0),0); cr-=g; }
  cr=clamp(cr,0,100); if(a.isEnemy) cr=Math.min(cr,60);
  let crit=false;
  if(!a.isEnemy && t.isEnemy && t.st.freeze && !mag) crit=true; // 凍った敵は殴ると割れて会心
  if(crit||o.sureCrit||Math.random()*100<cr){ crit=true; d*=1.5+(a.critDmg||0)/100+(o.critX||0); }
  d*=rnd(0.9,1.1);
  if(!a.isEnemy && a.kit && a.kit.pow) d*=a.kit.pow; // キャラごとの火力の差をならす（試算で決めた）
  if(!t.isEnemy){
    { const c=Math.max(t.cut?t.cut[0]:0, (t.stance&&t.stance.cut)||0); if(c) d*=1-c/100; }
    const g=partyMax('thousandGuard'); if(g) d*=1-g/100;
    if(t.P&&t.P.learn) d*=1-Math.min(50,t.P.learn*(t.learn||0))/100;
    if(t.P&&t.P.generalPride && t.hp>=t.mhp*0.5) d*=1-t.P.generalPride/100;
    if(t.uniq && t.uniq.includes('dmgCut')) d*=0.9;
  }
  if(o.fixed) d=o.fixed*(crit?1.5:1)*elemMul(t,el,a);
  return {d:Math.max(1,Math.round(d)),crit,el,isWeak};
}

async function hit(a,t,o){
  if(!a||!t||t.hp<=0) return 0;
  if(a.isEnemy && !t.isEnemy && !o.counter && B){ const cov=alive(B.party).find(x=>x!==t&&x.cover>0); if(cov){ t=cov; o.covered=1; } }
  if(!o.mag && a.st.blind && Math.random()<.5){ pop(t,'ミス','#cbd5e1'); await blogAdd(`ミス！ ${t.name}はダメージを受けない`,380); return 0; }
  const r=calcDmg(a,t,o); let d=r.d; o.didCrit=r.crit;
  if(o.covered && o.aoe) d=Math.max(1,Math.round(d*0.5)); // 全体攻撃をかばうときは盾で半分受け流す
  if(t.zaganRule && !a.isEnemy && r.el===t.zaganRule && !G.zgBroken){ G.zgBroken=r.el; pop(t,'覚えている','#f87171'); await blog(`${t.name}「……その${(typeof ELJP!=='undefined'&&ELJP[r.el])||''}の力。覚えているぞ」`,700); }
  // 味方が受ける：加護（盾）が先に受け止める
  if(!t.isEnemy && t.shield>0){ const ab=Math.min(t.shield,d); t.shield-=ab; d-=ab; pop(t,'加護','#bae6fd');
    if(t.shield<=0){ t.shield=0; t.shAtk=0; if(t.shFrom && a.isEnemy && a.hp>0){ const sf=t.shFrom; t.shFrom=null; await fixedHit(sf,a,ab,'女神の加護','#fef9c3'); } } }
  // 倒れる一撃を耐える
  let endured=null;
  if(!t.isEnemy && d>=t.hp && t.hp>0){
    if(t.guardOnce){ d=t.hp-1; t.guardOnce=0; pop(t,'加護','#c084fc'); }
    else if(t.taunt>0 && t.tauntSk && t.tauntSk.noDie){ d=t.hp-1; pop(t,'仁王立ち','#fde68a'); }
    else if(t.P.lastStand && !t.flags.endured){ d=Math.max(0,t.hp-1); t.flags.endured=1; endured='lastStand'; }
    else if(t.P.undying && !t.flags.endured){ d=Math.max(0,t.hp-1); t.flags.endured=1; endured='undying'; }
    else if(t.P.standFirm && !t.flags.endured){ d=Math.max(0,t.hp-1); t.flags.endured=1; endured='standFirm'; }
    else if(t.P.noFlee && !t.flags.endured){ d=Math.max(0,t.hp-1); t.flags.endured=1; endured='noFlee'; }
    else if(t.P.purse && !t.flags.endured && (G.gold>0||SIM.on)){ d=Math.max(0,t.hp-1); t.flags.endured=1; endured='purse'; }
    else { const sg=alive(B.party).find(x=>x.P.shadowGuard && (x.flags.shadow||0)<Math.floor(x.P.shadowGuard)); if(sg){ sg.flags.shadow=(sg.flags.shadow||0)+1; d=0; endured='shadow'; } }
  }
  t.hp=Math.max(0,t.hp-d);
  pop(t,(r.crit?'会心 ':'')+d+(r.isWeak?' 弱点!':''), r.crit?'#facc15':(r.isWeak?'#fdba74':(t.isEnemy?'#fff':'#fca5a5')));
  if(t.isEnemy){ t.flash=performance.now(); B.fx.push({kind:o.mag?'circle':'slash',x:t.x,y:VH*0.46,col:o.mag?elemColor(r.el):'#fff',born:performance.now()}); } else B.shake=6;
  sfx(r.crit?'crit':'hit');
  // 眠り・凍結は殴られて終わる
  if(t.st.sleep && d>0 && !o.noWake){ t.sleepHits=(t.sleepHits||1)-1; if(t.sleepHits<=0) delete t.st.sleep; }
  if(t.isEnemy && t.st.freeze && !o.mag && d>0){ delete t.st.freeze; pop(t,'粉砕','#bae6fd'); for(const x of alive(B.party)) if(x.N&&x.N.thawG) addGauge(x,x.N.thawG); }
  // ---- 味方が与えた ----
  if(!a.isEnemy){
    meterAdd(a,o.skill||'攻撃','dmg',d); if(r.crit){ const M=meter(a); M.crit=(M.crit||0)+1; const sk=M.by[o.skill||'攻撃']; if(sk) sk.crit=(sk.crit||0)+1; }
    const P=a.P||{};
    if(P.kiUp) addKi(a,1);
    if(r.crit){
      if(P.momentum) addGauge(a,P.momentum);
      if(a.gx && a.gx.c && !o.passive) addGauge(a,a.gx.c);
      if(a.uniq&&a.uniq.includes('critSpd')) a.spdUp=Math.min(50,(a.spdUp||0)+8);
      if(P.gale) a.spdUp=Math.min(50,(a.spdUp||0)+P.gale);
      if(P.chainBlade) B.nextCrit={v:P.chainBlade,from:a};
      if(!o.passive) for(const x of alive(B.party)) if(x.P.thousand) stackUp(x,'thousand');
      if(t.mark>0 && t.markG && !o.passive) for(const x of alive(B.party)) addGauge(x,5,x!==t.markG);
      if(P.critHunt && (disabled(t)||t.mark>0) && !a.tf.critHunt && Math.random()*100<P.critHunt){ a.tf.critHunt=1; a.extra++; }
    }
    if(r.isWeak && P.scent) addGauge(a,P.scent);
    if(r.isWeak){ if(P.hawk) addGauge(a,P.hawk); if(!o.passive) for(const x of alive(B.party)){ if(x.P.interest) stackUp(x,'interest'); if(x.P.guiding) stackUp(x,'guiding'); } }
    if(r.crit && !o.passive) for(const x of alive(B.party)) if(x.P.guildBond) addGauge(x,x.P.guildBond,x!==a);
    if(P.curseHit && t.hp>0 && !o.passive && Math.random()*100<P.curseHit) addCurse(t,1,a);
    if(nSt(t)>0){ if(P.stHunt) addGauge(a,P.stHunt); if(P.widen && t.hp>0 && Math.random()*100<P.widen){ const pool=['poison','paralyze','burn'].filter(x=>!t.st[x]); if(pool.length) addStatus(t,pick(pool),100,a); } }
    const dr=(a.drain||0)/100+(o.drain||0); if(dr>0){ const h=Math.round(d*dr); if(h>0){ a.hp=Math.min(a.mhp,a.hp+h); meterAdd(a,o.skill||'攻撃','heal',h); } }
    if(o.status && t.hp>0) addStatus(t,o.status[0],o.status[1],a);
  }
  // ---- 味方が受けた ----
  if(!t.isEnemy){
    t.taken=(t.taken||0)+d; if(a && a.isEnemy) meterAdd(t,(a.dexName||a.name),'taken',d);
    if(t.hp>0){ addGauge(t,((t.P.shieldMind)||10)+((t.gx&&t.gx.h)||0)); if(t.taunt>0&&t.tauntSk&&t.tauntSk.hurtG) addGauge(t,t.tauntSk.hurtG); }
    for(const x of alive(B.party)){ if(x!==t && x.P.devotion) addGauge(x,x.P.devotion); if(x.P.oath && !o.passive) stackUp(x,'oath'); }
    if(t.hp>0){
      if(t.P.rage) stackUp(t,'rage');
      if(t.P.grit) t.grit=Math.min(30,(t.grit||0)+t.P.grit);
      if(t.P.spirit) t.spiritUp=Math.min(60,(t.spiritUp||0)+t.P.spirit);
      if(t.P.learn) t.learn=Math.min(10,(t.learn||0)+1);
      if(t.P.paladin && (o.covered||t.taunt>0||t.cover>0)) stackUp(t,'paladin');
      if(t.hp<=t.mhp*0.3){ const gh=alive(B.party).find(x=>x!==t&&x.P.guardHeart&&!x.flags.gh); if(gh){ gh.flags.gh=1; gh.cover=Math.max(gh.cover||0,2); await healUnit(gh,t,t.mhp*gh.P.guardHeart/100,'かばう心',true); pop(gh,'かばう','#fde68a'); } }
      if(t.P.immovable) stackUp(t,'immovable');
      if(t.taunt>0 && t.P.guardChain){ const lo=alive(B.party).filter(x=>x!==t).sort((p,q)=>p.gauge-q.gauge)[0]; addGauge(lo,t.P.guardChain,true); }
      if(t.taunt>0 && t.tauntSk && t.tauntSk.hurtWeak && a.isEnemy) a.buff.atk=[-1,3];
      if(t.P.recover && !t.flags.recovered && t.hp<=t.mhp*0.4){ t.flags.recovered=1; await healUnit(t,t,sv(t,'mat')*t.P.recover,'リカバー',true); }
    }
  }
  renderTop(B.party);
  await blogAdd(`${r.crit?'<b style="color:#facc15">会心！</b> ':''}${r.isWeak?'<b style="color:#fdba74">弱点！</b> ':''}${t.name}に <b style="color:${t.isEnemy?'#fff':'#fca5a5'};font-size:16px">${d}</b> のダメージ`, 520);
  if(endured==='lastStand'){ pop(t,'耐えた','#fde68a'); await firePassive(t,'lastStand'); }
  if(endured==='undying'){ pop(t,'不死身','#fde68a'); addAtkUp(t,'undying',t.P.undying,99); }
  if(endured==='standFirm'){ pop(t,'踏みとどまった','#fde68a'); addGauge(t,t.P.standFirm); }
  if(endured==='noFlee'){ pop(t,'王は退かない','#fde68a'); for(const x of alive(B.party)) addAtkUp(x,'noFlee',t.P.noFlee,2); }
  if(endured==='purse'){ const c=SIM.on?0:Math.min(G.gold,Math.max(10,Math.round(G.gold*0.1))); G.gold-=c; t.hp=Math.max(t.hp,Math.round(t.mhp*t.P.purse/100)); pop(t,c?`${c}G払った`:'耐えた','#facc15'); }
  if(endured==='shadow'){ pop(t,'影が受けた','#c084fc'); }
  if(t.hp<=0){ await onDown(t,a); }
  else if(!t.isEnemy && a.isEnemy && a.hp>0 && !o.counter){
    // 反撃いろいろ
    if(t.stance && t.stance.ctr){ const st=t.stance; if(st.once) t.stance=null; await blog(`${t.name}の返し！`,250); if(st.ctrAll){ for(const e of alive(B.enemies)) await hit(t,e,{mult:st.ctr,skill:t.N.nm,counter:1}); } else await hit(t,a,{mult:st.ctr,skill:t.N.nm,counter:1}); }
    if(t.taunt>0 && t.P.retaliate && (t.retal||0)<3){ t.retal=(t.retal||0)+1; await blog(`${t.name}の報復の盾！`,250); for(const e of alive(B.enemies)) await hit(t,e,{mult:t.P.retaliate,skill:'報復の盾',counter:1,passive:1}); }
    if(t.P.counter && a.hp>0 && Math.random()*100<t.P.counter){ await blog(`${t.name}の反撃！`,250); await hit(t,a,{mult:1,skill:'反撃',counter:1}); addKi(t,1); }
  }
  else if(t.isEnemy && /反撃/.test(t.feat||'') && !a.isEnemy && Math.random()<.3 && a.hp>0 && !o.counter && !o.passive){ await blog(`${t.name}の反撃！`,250); await hit(t,a,{mult:0.8,counter:1}); }
  // 追い打ち（通常攻撃の会心）
  if(!a.isEnemy && a.P.thirdTime && !o.passive && t.hp>0){ if(a.ttT!==t){ a.ttT=t; a.ttN=0; } if(++a.ttN>=3){ a.ttN=0; await hit(a,t,{mult:a.P.thirdTime,skill:'三度目',passive:1}); } }
  if(!a.isEnemy && r.crit && o.normal && a.P.chase && t.hp>0 && (a.tf.chased||0)<3 && Math.random()*100<a.P.chase){ a.tf.chased=(a.tf.chased||0)+1; await blog(`${a.name}の追い打ち！`,250); await hit(a,t,{...o,normal:true}); }
  return d;
}

async function onDown(t,by){
  if(t.isEnemy){
    if(t.dying) return;
    if(t.autoRevive){ t.autoRevive=0; await blog(`${t.name}が倒れた…`,500); await sleep(400); t.hp=Math.round(t.mhp*0.35); pop(t,'復活','#c084fc'); await blog('……倒れたはずのノアが、自分を生き返らせた。',1100); return; }
    t.dying=performance.now(); sfx('down'); dexEnemy(t,true); await blog(`${t.name}を倒した！`,300);
    // 燃え移る・毒が移る（業火★5・毒霧★5で付けたもの）
    if(t.spreadSt && t.st[t.spreadSt] && !t.spreadDone){ t.spreadDone=1; const src=t.spreadSt==='burn'?t.burnBy:t.poisonBy; const nx=alive(B.enemies).filter(e=>!e.st[t.spreadSt])[0]; if(nx&&src) addStatus(nx,t.spreadSt,100,src,{kSpread:t.spreadSt}); }
    if(by && !by.isEnemy){
      const P=by.P||{};
      if(by.gx && by.gx.k) addGauge(by,by.gx.k);
      if(P.rally){ for(const x of alive(B.party)){ addAtkUp(x,'rally',P.rally,2); addGauge(x,P.rally2||0,x!==by); } pop(by,'勝ちどき','#fde68a'); }
      if(P.killAgain && !by.tf.killAgain && Math.random()*100<P.killAgain){ by.tf.killAgain=1; by.extra++; }
      if(P.huntChain) addGauge(by,P.huntChain);
      if(P.sendOff) by.nextHitUp=Math.max(by.nextHitUp||0,P.sendOff);
      if(P.bloodBack && by.hp>0){ const h=Math.round(by.mhp*P.bloodBack/100); by.hp=Math.min(by.mhp,by.hp+h); pop(by,'+'+h,'#4ade80'); }
      if(P.warCry) stackUp(by,'warCry');
    }
    for(const x of alive(B.party)) if(x.P.procession) stackUp(x,'procession');
    return;
  }
  sfx('ko'); await blog(`${t.name}は倒れた！`,400);
  if(!SIM.on) G.rcDown=(G.rcDown||0)+1;
  t.st={}; t.buff={}; t.gauge=0; t.shield=0; t.taunt=0; t.atkUps={}; t.cover=0; t.stance=null; t.cut=null;
  if(t.P.vengeance && !t.flags.venged){ t.flags.venged=1; await firePassive(t,'vengeance'); }
  if(t.P.lastSong && !t.flags.sang){ t.flags.sang=1; await blog(`${t.name}の歌が、最後まで響いた。`,450); for(const x of alive(B.party)) await healUnit(t,x,x.mhp*t.P.lastSong/100,'歌いつづける',true,true); }
  for(const x of alive(B.party)){ if(x.P.mourner) addAtkUp(x,'mourn',x.P.mourner,99); if(x.P.regret) alive(B.party).forEach(y=>setCut(y,x.P.regret,3)); }
  if(t.P.undying2 && !t.flags.revived){ t.flags.revived=1; t.hp=Math.round(t.mhp*t.P.undying2/100); pop(t,'復活','#c084fc'); await blog(`${t.name}は、もう一度立ち上がった。`,500); return; }
  if(t.P.undo && !t.flags.revived){ t.flags.revived=1; t.hp=Math.round(t.mhp*t.P.undo/100); pop(t,'復活','#c084fc'); await blog(`${t.name}は自分で立ち上がった！`,500); return; }
  const ch=alive(B.party).find(x=>x.P.rewind && (x.flags.rewound||0)<Math.floor(x.P.rewind));
  if(ch && t.prevHp>0){ ch.flags.rewound=(ch.flags.rewound||0)+1; t.hp=t.prevHp; pop(t,'巻き戻し','#7dd3fc'); meterAdd(ch,'巻き戻し','heal',t.prevHp); await blog(`${ch.name}が時を巻き戻した。${t.name}はそこに立っている。`,600); return; }
  for(const x of alive(B.party)) if(x.P.refund){ x.flags.first=true; addGauge(x,x.P.refund); }
}

function addStatus(t,s,chance,a,sk){
  if(t.hp<=0) return false;
  if(!t.isEnemy){ const P=t.P||{}; if(P.immuneAll) return false; chance*=(1-(t.stRes||0)/100); }
  if(t.boss){ const k={stop:0.25,sleep:0.4,paralyze:0.4,poison:0.6,burn:0.8,freeze:0.5,confuse:0.4,blind:0.5,silence:0.5}[s]||0.4; chance*= (s==='stop'&&sk&&sk.bossOk)? 0.6 : k; }
  if(a && !a.isEnemy && a.P && a.P.stSkill) chance+=a.P.stSkill;
  if(Math.random()*100>=chance) return false;
  const fresh=!t.st[s];
  t.st[s] = s==='poison'?99:s==='sleep'?3:s==='paralyze'?ri(1,2):s==='confuse'?ri(2,3):s==='stop'?2:s==='burn'?((sk&&sk.burnT)||3)+1:s==='freeze'?3:3;
  if(s==='sleep'){ const deep=Math.max(a&&!a.isEnemy? Math.floor(partyMax('deepSleep'))||1 : 1, sk&&sk.deep||1); t.sleepHits=deep; }
  if(sk && sk.kSpread===s && t.isEnemy){ t.spreadSt=s; }
  if(s==='burn' && a && !a.isEnemy){ const p=dmgF(sv(a,'mat'),sv(t,'mdf'))*0.4*((sk&&sk.burnX)||1); t.burnPow=Math.max(t.burnPow&&t.st.burn?t.burnPow:0,p); t.burnBy=a; }
  if(s==='freeze' && sk && sk.frostPhys) t.frostPhys=sk.frostPhys;
  if(s==='poison' && a && !a.isEnemy){ t.poisonBy=a; }
  pop(t,STX[s]||STATUSJP[s],'#fde68a');
  if(fresh && t.isEnemy && a && !a.isEnemy){ for(const x of alive(B.party)) if(x.P.finale) stackUp(x,'finale'); }
  return true;
}

async function endOfTurn(){
  // 燃焼・毒
  for(const e of alive(B.enemies)){
    if(e.st.burn && e.burnBy){ const by=e.burnBy; let d=Math.max(1,Math.round(e.burnPow*(1+((by.P&&by.P.infernoHeart)||0)/100))); await fixedHit(by,e,d,'燃焼','#f97316'); if(by.P&&by.P.ember&&by.hp>0) stackUp(by,'ember'); }
    if(e.hp>0 && e.st.poison){ const by=e.poisonBy; const vm=1+((by&&by.P&&by.P.venom)||0)/100; const d=Math.max(1,Math.round(e.mhp*(e.boss?0.008:0.05)*vm)); e.hp=Math.max(1,e.hp-d); pop(e,d,'#a3e635'); if(by) meterAdd(by,'毒','dmg',d); }
  }
  for(const u of B.party){ if(u.hp<=0) continue;
    if(u.st.poison){ const d=Math.max(1,Math.round(u.mhp*0.05)); u.hp=Math.max(1,u.hp-d); pop(u,d,'#a3e635'); }
    if(u.uniq&&u.uniq.includes('mpRegen')) addGauge(u,8);
    if(u.gx&&u.gx.t) addGauge(u,u.gx.t);
    if(u.P.nightmare){ const n=alive(B.enemies).filter(e=>e.st.sleep).length; if(n) stackUp(u,'nightmare',n); }
    if(u.P.timeEnd) stackUp(u,'timeEnd');
  }
  for(const u of [...B.party,...B.enemies]){
    if(u.hp<=0) continue;
    if(u.regen){ const h=Math.round(u.mhp*u.regen[0]*(u.isEnemy?1-partyMax('noRise')/100:1)); u.hp=Math.min(u.mhp,u.hp+h); pop(u,'+'+h,'#4ade80'); if(--u.regen[1]<=0) u.regen=null; }
    for(const k in u.st){ if(--u.st[k]<=0){ delete u.st[k]; if(k==='sleep') u.sleepHits=0; } }
    for(const k in u.buff){ if(--u.buff[k][1]<=0) delete u.buff[k]; }
    if(u.cut){ if(--u.cut[1]<=0) u.cut=null; }
    if(u.taunt){ if(--u.taunt<=0){ u.taunt=0; u.tauntSk=null; } }
    if(u.mark){ if(--u.mark<=0) u.mark=0; }
    if(u.lvn){ if(--u.lvn[1]<=0) u.lvn=null; }
    if(u.vuln){ if(--u.vuln[1]<=0) u.vuln=null; }
    if(u.cover){ if(--u.cover<=0) u.cover=0; }
    if(u.critBuff){ if(--u.critBuff[1]<=0) u.critBuff=null; }
    if(u.atkUps) for(const k in u.atkUps){ if(--u.atkUps[k][1]<=0) delete u.atkUps[k]; }
  }
  if(B.weakBuff && --B.weakBuff[1]<=0) B.weakBuff=null;
  renderTop(B.party);
}
