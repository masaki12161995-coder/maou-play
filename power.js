// ===== 戦闘力・一括装備・装備の鍵 =====
// 戦闘力：レベル・能力値・装備・付けているスキルと★を、1つの数字にまとめたもの。
// おすすめ装備・一括装備は、この数字だけで良し悪しを決める（だから「おすすめなのに弱くなった」が起きない）。
function powerFrom(n,s){
  const mag=CHARS[n].wpn==='mag', main=mag?s.mat:s.atk;
  let v=(mag?s.mat*1.2+s.atk*0.2:s.atk*1.2+s.mat*0.2)+s.def*0.8+s.mdf*0.6+s.spd*0.8+s.hp/12+s.crit*4+s.critDmg
    +s.gauge*main*0.002+main*((s.gNorm||0)*0.012+(s.gHurt||0)*0.004+(s.gCrit||0)*0.002+(s.gKill||0)*0.003+(s.gTurn||0)*0.014+(s.gKeep||0)*0.006+(s.actP||0)*0.006)
    +((s.uniq&&s.uniq.length)?main*0.15*s.uniq.length:0);
  // 付けているスキルの★（★1は0、強化1回ごとに+3%）
  const k=kitMember(n); let rk=0;
  for(const [kind,j] of [['N',k.n],['A',k.a],['P',k.p[0]],['P',k.p[1]]]) if(j!==null&&j!==undefined) rk+=skRank(n,kind,j)-1;
  return Math.round(v*(1+rk*0.03)*10);
}
function power(n){ return powerFrom(n,calcStats(n)); }
function isLocked(n,sl){ const m=G.members[n]; return !!(m&&m.lock&&m.lock[sl]); }
function toggleLock(n,sl){ const m=G.members[n]; m.lock=m.lock||{}; if(m.lock[sl]) delete m.lock[sl]; else m.lock[sl]=1; POW.sig=''; }
const baseOfSlot=sl=>sl.startsWith('acc')?'acc':sl;

// いちばん強くなる付け方を、実際には付けずに探す。
// 決まり：鍵のかかった部位は動かさない／押す前より戦闘力が下がる人は出さない／装備は得意な人に回す（合計がいちばん高くなるように）
function partyPlan(names){
  const ns=(names||G.party).filter(n=>G.members[n]);
  const snap=ns.map(n=>Object.assign({},G.members[n].equip));
  const p0={}; ns.forEach(n=>p0[n]=power(n)); const cur=Object.assign({},p0);
  let bag=G.gear.slice(); const freed=[];
  try{
   // 候補をしぼって探し、良くならなくなったら候補を選び直して、もう一度（最大4回）
   for(let round=0; round<4; round++){ let moved=false;
    // 候補をしぼる：人×部位ごとに、袋の中で強くなる上位8個
    const pick={};
    for(const n of ns){ const m=G.members[n];
      for(const sl of SLOTS){ if(isLocked(n,sl)) continue; const b=baseOfSlot(sl), mine=m.equip[sl], arr=[];
        for(const c of bag){ if(c.slot!==b) continue; m.equip[sl]=c; arr.push([power(n),c]); }
        m.equip[sl]=mine; arr.sort((x,y)=>y[0]-x[0]); pick[n+'|'+sl]=arr.slice(0,8).map(x=>x[1]); } }
    for(let iter=0; iter<60; iter++){
      let best=null;
      for(const n of ns){ const m=G.members[n];
        for(const sl of SLOTS){ if(isLocked(n,sl)) continue; const b=baseOfSlot(sl), mine=m.equip[sl];
          // 袋から付ける
          for(const c of [...pick[n+'|'+sl], ...freed.filter(x=>x.slot===b)]){ if(!bag.includes(c)) continue;
            m.equip[sl]=c; const pn=power(n); m.equip[sl]=mine; const g=pn-cur[n];
            if(g>=1 && pn>=p0[n] && (!best||g>best.g)) best={g,k:'bag',n,sl,c,pn}; }
          // ほかの人と取りかえる（相手の部位にも鍵がないときだけ）
          for(const o of ns){ if(o===n) continue; const mo=G.members[o];
            for(const sl2 of SLOTS){ if(baseOfSlot(sl2)!==b || isLocked(o,sl2)) continue; const c=mo.equip[sl2]; if(!c) continue;
              m.equip[sl]=c; mo.equip[sl2]=mine; const pn=power(n), po=power(o); m.equip[sl]=mine; mo.equip[sl2]=c;
              const g=(pn-cur[n])+(po-cur[o]);
              if(g>=1 && pn>=p0[n] && po>=p0[o] && (!best||g>best.g)) best={g,k:'swap',n,sl,o,sl2,c,pn,po}; } } } }
      if(!best) break; moved=true;
      const m=G.members[best.n], mine=m.equip[best.sl];
      if(best.k==='bag'){ m.equip[best.sl]=best.c; bag=bag.filter(x=>x!==best.c); if(mine){ bag.push(mine); freed.push(mine); } cur[best.n]=best.pn; }
      else { const mo=G.members[best.o]; m.equip[best.sl]=best.c; mo.equip[best.sl2]=mine; cur[best.n]=best.pn; cur[best.o]=best.po; }
    }
    if(!moved) break; }
    const eq=ns.map(n=>Object.assign({},G.members[n].equip));
    const gain=ns.reduce((a,n)=>a+cur[n]-p0[n],0);
    return {ns,p0,p1:cur,eq,bag,gain};
  } finally { ns.forEach((n,i)=>G.members[n].equip=snap[i]); }
}
function applyPlan(P){
  P.ns.forEach((n,i)=>{ const m=G.members[n]; m.equip=Object.assign({},P.eq[i]); for(const x of Object.values(m.equip)) if(x) x.isNew=false; clampHpMp(n); });
  G.gear=P.bag.slice(); POW.sig='';
}

// ---------- フィールドの一括装備ボタン ----------
// 計算は重いので、パーティー・装備・レベル・スキル・鍵が変わったときだけやり直す
const POW={sig:'',plan:null,timer:null,undo:null,undoT:null}; const ITEMID=new WeakMap(); let ITEMN=0;
const iid=x=>{ if(!x) return 0; if(!ITEMID.has(x)) ITEMID.set(x,++ITEMN); return ITEMID.get(x); };
function powSig(){ if(!G) return ''; return JSON.stringify([G.party, G.party.map(n=>{ const m=G.members[n]; return m?[m.lv, m.kit&&m.kit.rk, m.kit&&[m.kit.n,m.kit.a,m.kit.p], m.lock||0, SLOTS.map(sl=>{ const x=m.equip[sl]; return x?[iid(x),x.plus||0]:0; })]:0; }), G.gear.length, G.gear.reduce((a,x)=>a+iid(x)*7+(x.plus||0),0)]); }
function partyPower(){ return G.party.reduce((a,n)=>a+(G.members[n]?power(n):0),0); }
function updateEqBtn(){
  const b=$('bEq'); if(!b||!G) return;
  const sig=powSig();
  if(sig!==POW.sig){ POW.sig=sig; POW.plan=null; b.classList.remove('glow');
    clearTimeout(POW.timer); POW.timer=setTimeout(()=>{ if(powSig()!==sig) return; POW.plan=partyPlan(); const g=POW.plan.gain; $('bEqUp').textContent=g>0?'+'+g.toLocaleString():''; b.classList.toggle('glow',g>0 && $('bUndo').style.display!=='block'); },120); }
}
function countUp(el,from,to,ms){ const t0=performance.now(); const f=t=>{ const r=Math.min(1,(t-t0)/ms), e=1-Math.pow(1-r,3); el.textContent=Math.round(from+(to-from)*e).toLocaleString(); if(r<1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
function floatUp(anchor,text){ const r=anchor.getBoundingClientRect(), a=APP.getBoundingClientRect(); const d=document.createElement('div'); d.className='pwfloat'; d.textContent=text; d.style.left=(r.left-a.left+r.width/2)+'px'; d.style.top=(r.bottom-a.top+2)+'px'; APP.appendChild(d); setTimeout(()=>d.remove(),1400); }
function doPartyEquip(){
  audioUnlock(); if(RT.mode!=='field'||RT.busy||msgResolve) return;
  const P=(POW.plan && powSig()===POW.sig)? POW.plan : partyPlan();
  if(!P || P.gain<1){ sfx('tick'); toast('今がいちばん強い'); return; }
  const before=P.ns.map(n=>power(n)), stB=P.ns.map(n=>calcStats(n));
  POW.undo={ns:P.ns, eq:P.ns.map(n=>Object.assign({},G.members[n].equip)), gear:G.gear.slice(), hp:P.ns.map(n=>G.members[n].hp)};
  applyPlan(P); sfx('best'); $('bEq').classList.remove('glow'); renderTop();
  P.ns.forEach((n,i)=>{ const el=$('top').querySelector(`[data-pw="${n}"]`); if(!el) return; const now=power(n); if(now>before[i]){ countUp(el,before[i],now,900); floatUp(el.closest('.chip'),'+'+(now-before[i]).toLocaleString()); el.closest('.chip').classList.add('pwup'); } });
  // 上がった能力は緑、下がった能力は赤で、数字が動く
  P.ns.forEach((n,i)=>{ const s=calcStats(n); for(const k of ['atk','def','mat','mdf']){ const el=$('top').querySelector(`[data-s="${n}|${k}"]`); const d=s[k]-stB[i][k]; if(!el||!d) continue; el.classList.add(d>0?'sup':'sdn'); countUp(el,stB[i][k],s[k],700); } });
  setTimeout(()=>$('top').querySelectorAll('.pwup').forEach(c=>c.classList.remove('pwup')),1200);
  const u=$('bUndo'); u.style.display='block'; clearTimeout(POW.undoT); POW.undoT=setTimeout(()=>{ u.style.display='none'; POW.undo=null; },5000);
}
function undoPartyEquip(){
  const U=POW.undo; if(!U) return; U.ns.forEach((n,i)=>{ G.members[n].equip=U.eq[i]; G.members[n].hp=U.hp[i]; }); G.gear=U.gear; POW.undo=null; POW.sig='';
  $('bUndo').style.display='none'; sfx('back'); renderTop(); toast('元に戻した');
}
$('bEq').onclick=doPartyEquip; $('bUndo').onclick=undoPartyEquip;

// ---------- 自動回復（戦闘のあと） ----------
// 戦闘不能の人に蘇生の羽、HPが半分を切った人に薬草（減り具合に合う方）。特薬草は自動では使わない。
function autoHeal(){
  if(!G||!G.settings.autoHeal) return; const used={}; const use=(k,n)=>{ G.inv[k]--; const key=n+'|'+k; used[key]=(used[key]||0)+1; };
  for(const n of G.party){ const m=G.members[n]; if(!m) continue; const s=calcStats(n);
    while(m.hp<=0 && (G.inv.feather||0)>0){ use('feather',n); if(Math.random()<.75) m.hp=Math.round(s.hp*.3); }
    while(m.hp>0 && m.hp<s.hp*0.5){ const miss=1-m.hp/s.hp; const k= miss>=0.55&&(G.inv.herb2||0)>0 ? 'herb2' : (G.inv.herb||0)>0 ? 'herb' : (G.inv.herb2||0)>0 ? 'herb2' : null; if(!k) break;
      use(k,n); m.hp=Math.min(s.hp,m.hp+Math.round(s.hp*{herb:.3,herb2:.6}[k])); } }
  const ks=Object.keys(used); if(!ks.length){ const need=G.party.some(n=>{ const m=G.members[n]; return m && m.hp<calcStats(n).hp*0.5; }); if(need) toast('自動回復：薬が足りない'); return; }
  sfx('heal');
  const line=ks.map(x=>{ const [n,k]=x.split('|'); return `${n}に${ITEMS[k].n}${used[x]>1?'×'+used[x]:''}`; }).join('・');
  const left=['herb','herb2','feather'].filter(k=>ks.some(x=>x.endsWith('|'+k))).map(k=>`${ITEMS[k].n}${G.inv[k]||0}`).join('・');
  toast(`<span style="font-size:13px">自動回復：${line}<br><small style="opacity:.75">残り ${left}</small></span>`);
}
// 上の札をタップすると、攻撃・防御などの表示をオン・オフ
$('top').addEventListener('click',()=>{ if(!G||RT.mode==='battle') return; G.settings.chipDetail=G.settings.chipDetail===false; sfx('tick'); renderTop(); });
