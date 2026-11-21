// ===== メニュー・お店・世界地図 =====
// ---- 画面の行き来：開いた画面を積んでおき、左下の「もどる」で1つ前へ ----
// key が同じ画面（キャラ切り替え・タブ切り替え）は積まずに置きかえる。前にある画面へ進んだら、そこまで戻す
let NAV=[], NAVSET=false;
function navHere(key, fn, ch){ if($('screen').style.display!=='flex') NAV=[]; const i=NAV.findIndex(e=>e.key===key); if(i>=0) NAV.length=i; NAV.push({key,fn,ch}); NAVSET=true; }
function navPop(k, ch){ NAV.length=Math.max(1,NAV.length-k); const e=NAV[NAV.length-1]; if(!e) return false; e.fn(ch!==undefined && e.ch!==undefined ? ch : e.ch); return true; }
function navBack(){
  const sh=$('skSheet'); if(sh){ sfx('back'); sh.remove(); return; }
  if(NAV.length<2) return; const cur=NAV[NAV.length-1]; sfx('back'); navPop(1, cur.ch);
}
function openScreen(title, html, onClose){
  const sh=$('skSheet'); if(sh) sh.remove();
  if(!NAVSET) NAV=[]; NAVSET=false; RT.swipe=null;
  $('scrTitle').textContent=title; $('scrBody').innerHTML=html; $('screen').style.display='flex';
  const ft=$('scrFoot'); if(ft){ ft.style.display=NAV.length>1?'flex':'none'; $('scrBack').onclick=navBack; }
  $('scrClose').onclick=()=>{ sfx('back'); NAV=[]; $('screen').style.display='none'; renderTop(); if(onClose) onClose(); };
}
function closeScreen(){ NAV=[]; $('screen').style.display='none'; RT.atStone=false; renderTop(); }
// 仲間の並び：出撃中の順、そのあと控え
function memberList(){ const av=Object.keys(G.members).filter(n=>G.members[n].avail); return [...G.party.filter(n=>av.includes(n)), ...av.filter(n=>!G.party.includes(n))]; }
function memberTabs(cur){
  const ns=memberList();
  return `<div class="row scroll mtabs" style="overflow-x:auto;flex:0 0 auto;touch-action:pan-x">${ns.map(n=>`<button class="mtab ${n===cur?'on':''}${G.party.includes(n)?'':' rsv'}" data-m="${n}"><img draggable="false" src="${spriteURL(n,0)}"><span>${n}</span></button>`).join('')}</div>`;
}
function bindTabs(cb){ const body=$('scrBody');
  body.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ sfx('tick'); cb(b.dataset.m); });
  const on=body.querySelector('.mtab.on'); if(on) on.scrollIntoView({inline:'center',block:'nearest'});
  const cur=on&&on.dataset.m;
  if(cur) RT.swipe=dir=>{ const ns=memberList(); if(ns.length<2) return; const i=ns.indexOf(cur); const nx=ns[(i+dir+ns.length)%ns.length]; RT.swipeDir=dir; sfx('tick'); cb(nx); };
}
// キャラの顔・名前・Lv（装備・スキル画面の頭）。左右の矢印でも切り替え
function charHead(n, inner, below){
  const m=G.members[n], c=CHARS[n];
  return `<div class="card chead"><div class="chrow"><button class="cha" data-sw="-1">‹</button><div class="chp" style="background:radial-gradient(circle at 50% 70%,${c.col||'#334155'}55,#0b1222 70%)"><img class="portrait" data-n="${n}" src="${spriteURL(n,0)}"></div>
    <div class="chi"><div class="chn"><b>${n}</b><span>Lv <b>${m.lv}</b></span></div><div class="chr">${c.role}　得意：${TYJP[FAV[n]]||'―'}${G.party.includes(n)?'':'　<span class="tag">控え</span>'}</div>${inner||''}</div><button class="cha" data-sw="1">›</button></div>${below?`<div class="chb">${below}</div>`:''}</div>`;
}
function bindHead(){ $('scrBody').querySelectorAll('[data-sw]').forEach(b=>b.onclick=e=>{ e.stopPropagation(); if(RT.swipe) RT.swipe(+b.dataset.sw); }); }
// 左右スワイプでキャラ切り替え（横に大きく動いたときだけ。タブの帯・ドラッグ中は無視）
(()=>{ let S=null; const body=()=>$('scrBody');
  document.addEventListener('touchstart',e=>{ const b=body(); if(!b||!RT.swipe||$('screen').style.display==='none'||$('skSheet')) { S=null; return; }
    if(!b.contains(e.target) || e.target.closest('.mtabs') || e.touches.length>1){ S=null; return; } const t=e.touches[0]; S={x:t.clientX,y:t.clientY,t:Date.now()}; },{passive:true});
  document.addEventListener('touchend',e=>{ if(!S) return; const t=e.changedTouches[0]; const dx=t.clientX-S.x, dy=t.clientY-S.y, dt=Date.now()-S.t; S=null;
    if(DRAG.on||DRAG.justDropped) return; if(Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.6 && dt<700 && RT.swipe){ RT.swipe(dx<0?1:-1); } },{passive:true});
})();
// 切り替えた向きに少しだけ流れる
function swipeAnim(){ const d=RT.swipeDir; RT.swipeDir=0; if(!d) return; const b=$('scrBody'); b.classList.remove('swl','swr'); void b.offsetWidth; b.classList.add(d>0?'swl':'swr'); }

// ---------- メニュー ----------
const ICO={
 status:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>',
 equip:'<svg viewBox="0 0 24 24"><path d="M14.5 3.5l6 6-9.5 9.5H5v-6z"/><path d="M4 20l3-3"/></svg>',
 skill:'<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
 item:'<svg viewBox="0 0 24 24"><path d="M9 3h6v4l3 3v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-9l3-3z"/><path d="M6 13h12"/></svg>',
 party:'<svg viewBox="0 0 24 24"><path d="M7 4v16M7 4L3.5 7.5M7 4l3.5 3.5M17 20V4M17 20l-3.5-3.5M17 20l3.5-3.5"/></svg>',
 gear:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
 mat:'<svg viewBox="0 0 24 24"><path d="M12 3l6 5-2 11H8L6 8z"/><path d="M6 8h12M10 8l2 11M14 8l-2 11"/></svg>',
 dex:'<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/></svg>',
 setting:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/></svg>'};
// 今すぐ強化できるスキルの数（技の書が足りるもの）
// 付けているスキルのうち、今すぐ強化できるものの数
function upgradable(n){ const K=KIT[n], m=G.members[n]; if(!K||!m) return 0; kitAutoFill(n); const k=kitMember(n); let c=0;
  for(const [kind,j] of [['N',k.n],['A',k.a],['P',k.p[0]],['P',k.p[1]]]){ if(j===null||j===undefined) continue; const r=skRank(n,kind,j); if(bookUse(kind,r)) c++; } return c; }
function openMenu(){
  sfx('ok');
  const party=G.party.map(n=>{ const m=G.members[n], st=calcStats(n), hr=Math.max(0,Math.min(1,m.hp/st.hp));
    return `<button class="mp" data-st="${n}"><img draggable="false" src="${spriteURL(n,0)}"><div class="mpn">${n}</div><div class="mpl">Lv ${m.lv}</div><div class="mph"><i style="width:${hr*100}%;${hr<.25?'background:var(--hplow)':''}"></i></div></button>`; }).join('');
  const upN=G.party.reduce((a,n)=>a+upgradable(n),0);
  const tile=(k,lab,badge)=>`<button class="mt" data-a="${k}">${ICO[k]}<span>${lab}</span>${badge?`<em>${badge}</em>`:''}</button>`;
  const bsum=ks=>ks.reduce((a,k)=>a+(G.inv[k]||0),0);
  const bk=[['N',BOOKK.N],['A',BOOKK.A],['P',BOOKK.P],['W',BOOKS]].filter(([c,ks],i)=>i<3||bsum(ks)>0).map(([c,ks])=>`<span class="bki">${goodIconHTML(toolIcon(c==='W'?'book1':'b'+c+'1'),1).replace('ico ','ico xs ')}<b>${bsum(ks)}</b></span>`).join('');
  const h=`<div class="card mobj"><div class="mch">${CHAPTERS[Math.min(G.chapter,7)]}</div><div class="mgo">${G.obj||'―'}</div></div>
  <div class="mparty">${party}</div><div class="skhint mph2" style="margin-top:-4px"><span>長押しで並べかえ</span>${memberList().length>G.party.length?'<button class="lnk" id="toParty">控えと入れ替え ›</button>':''}</div>
  <div class="mtiles">${tile('status','ステータス')}${tile('equip','そうび',(()=>{ const c=G.gear.filter(x=>x.isNew).length; return c?`NEW ${c}`:''; })())}${tile('skill','スキル',upN?`強化${upN}`:'')}${tile('item','どうぐ')}${tile('mat','素材')}${tile('gear','装備品')}${tile('dex','図鑑')}${tile('setting','設定')}<button class="mt mq" data-a="quit"><span>中断して<br>終わる</span></button></div>
  <div class="card minfo"><div><small>所持金</small><b style="color:var(--gold)">${G.gold.toLocaleString()}G</b></div><div><small>技の書</small><span class="bks">${bk}</span></div><div><small>${G.frag?'素材・欠片':'錬成の素材'}</small><b>${G.mat}</b>${G.frag?` <b>欠片${G.frag}</b>`:''}</div></div>`;
  NAV=[]; navHere('menu', openMenu); openScreen('メニュー',h);
  $('scrBody').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ sfx('ok'); ({status:()=>scrStatus(G.party[0]),equip:()=>scrEquip(G.party[0]),skill:()=>scrSkill(G.party[0]),item:()=>scrItem(),mat:scrMat,gear:scrGear,setting:scrSetting,dex:()=>scrDex('e'),quit:doQuit})[b.dataset.a](); });
  const tp=$('scrBody').querySelector('#toParty'); if(tp) tp.onclick=()=>{ sfx('ok'); scrParty(); };
  $('scrBody').querySelectorAll('[data-st]').forEach(b=>{ b.onclick=()=>{ if(DRAG.justDropped) return; sfx('ok'); scrStatus(b.dataset.st); };
    dragable(b,{ ghost:()=>b.querySelector('img').cloneNode(true), targets:()=>[...$('scrBody').querySelectorAll('[data-st]')].filter(x=>x!==b),
      drop:(t)=>{ const a=G.party.indexOf(b.dataset.st), z=G.party.indexOf(t.dataset.st); if(a<0||z<0) return; [G.party[a],G.party[z]]=[G.party[z],G.party[a]]; sfx('ok'); renderTop(); openMenu(); } }); });
}
function backToMenu(){ return ()=>{}; }
function statsCard(n){
  const m=G.members[n], c=CHARS[n];
  const need=m.lv>=99?0:needOf(n,m.lv);
  return `<div class="card"><div style="display:flex;gap:12px;align-items:center;margin-bottom:10px">
  <div style="flex:0 0 72px;height:72px;border-radius:14px;background:radial-gradient(circle at 50% 70%,${c.col||'#334155'}55,#0b1222 70%);border:1px solid var(--line);display:flex;align-items:center;justify-content:center"><img class="portrait" data-n="${n}" src="${spriteURL(n,0)}" style="height:66px;width:auto;max-width:62px;image-rendering:pixelated"></div>
  <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between;align-items:baseline"><div style="font-size:18px;font-weight:800">${n}</div><div>Lv <b style="font-size:18px">${m.lv}</b></div></div>
  <div style="font-size:12px;color:var(--sub)">${c.role}　得意：${TYJP[FAV[n]]||'―'}</div>
  <div style="font-size:12px;color:var(--sub);margin-top:4px">次のレベルまで <b style="color:var(--text)">${m.lv>=99?'―':(need-m.exp).toLocaleString()}</b></div></div></div>
  ${statGrid(statRows(n))}${(()=>{ const g=gxText(calcStats(n)); return g?`<div style="font-size:11px;color:var(--sub);margin-top:6px">ゲージ：${g}</div>`:''; })()}</div>`;
}
// 顔のところの人物：足ぶみを何回かしてから、技のポーズを見せる
let PORTRAIT_T=0; const PORTRAIT_SEQ=[0,0,0,0,0,0,'pose','pose','pose','pose']; // 正面で立つ→技のポーズ、をゆっくりくり返す
setInterval(()=>{ PORTRAIT_T=(PORTRAIT_T+1)%PORTRAIT_SEQ.length; const f=PORTRAIT_SEQ[PORTRAIT_T]; document.querySelectorAll('img.portrait').forEach(im=>{ im.src=spriteURL(im.dataset.n,f); }); },450);
function scrStatus(n){
  const m=G.members[n];
  const eq=`<div class="eqgrid">${SLOTS.map(sl=>{ const it=m.equip[sl]; return `<button class="eqc" data-esl="${sl}">${it?itemIconHTML(it).replace('class="ico','class="ico sm'):`<span class="ico sm none">${SLOTJP[sl]}</span>`}<b class="r${it?it.r:0}"${it?'':' style="color:var(--sub);font-weight:400"'}>${it?it.name:'なし'}</b></button>`; }).join('')}</div>`;
  kitAutoFill(n); const kk=kitMember(n);
  const pas=`<div class="eqbar">${[['N',kk.n],['A',kk.a],['P',kk.p[0]],['P',kk.p[1]]].map(([kind,j],i)=>{ const lab=['通常','アクティブ','パッシブ1','パッシブ2'][i];
    if(j===null||j===undefined) return `<div class="eqs"><div class="ski k${kind} empty">―</div><small>${lab}</small></div>`;
    const d=KIT[n][kind][j]; return `<button class="eqs" data-sk2="${kind}${j}"><div class="ski k${kind}">${skillGlyphs(n)[kind+j]}</div><small>${d.nm}</small></button>`; }).join('')}</div>`;
  navHere('status', scrStatus, n);
  openScreen('ステータス', memberTabs(n)+`<div class="scroll" style="flex:1;display:flex;flex-direction:column;gap:8px">${statsCard(n)}<div class="card eqcard"><div class="ptitle" style="padding:0 0 6px"><span style="font-weight:700;color:var(--text);font-size:13px">装備</span><button class="lnk" id="toEquip">そうび画面へ ›</button></div>${eq}</div><div class="card"><div class="ptitle" style="padding:0 0 6px"><span style="font-weight:700;color:var(--text);font-size:13px">スキル</span><button class="lnk" id="toSkill">スキル画面へ ›</button></div>${pas}</div></div>`, null);
  bindTabs(scrStatus); swipeAnim();
  $('scrBody').querySelectorAll('[data-sk2]').forEach(b=>b.onclick=()=>{ sfx('tick'); skSheet(n, b.dataset.sk2[0], +b.dataset.sk2.slice(1), ()=>scrStatus(n)); });
  $('scrBody').querySelectorAll('[data-esl]').forEach(b=>b.onclick=()=>{ sfx('ok'); scrEquip(n,b.dataset.esl); });
  $('toEquip').onclick=()=>{ sfx('ok'); scrEquip(n); };
  const sk=$('scrBody').querySelector('#toSkill'); if(sk) sk.onclick=()=>{ sfx('ok'); scrSkill(n); };
}
function itemLine(it, cmp, who){
  const st=[]; for(const k in it.base) st.push(`${STJP[k]||k}${it.base[k]}`);
  for(const a of (it.imp||[])) st.push(afText(a));
  const af = who && it.slot==='weapon'? weaponAff(who, wTy(it)) : 0;
  const tags=`${it.ty&&TYJP[it.ty]?`<span class="tag">${TYJP[it.ty]}</span>`:''}${it.mei!==undefined?`<span class="tag mei${it.top?' top':''}">名品</span>`:''}${af>0?'<span class="tag fav">得意</span>':af<0?'<span class="tag ng">苦手</span>':''}`;
  // 新しい印はアイコンの角に付ける（名前の始まる位置がずれないように）
  return `<span class="icw">${itemIconHTML(it)}${it.isNew?'<i class="newdot"></i>':''}</span><div class="grow"><div class="r${it.r}">${it.name}${it.plus?`<b style="color:#fde68a"> +${it.plus}</b>`:''} <span class="tag">Lv${it.iLv}</span>${tags}</div><small>${st.join(' ')}${it.af.length?'　'+it.af.map(afHTML).join(' '):''}${it.u?'　★'+UNIQ.find(u=>u.k===it.u).t:''}</small>${cmp||''}</div>`;
}
// ゲージに関わる効果のまとめ（ステータス・比較で使う）
const GXJP=[['gNorm','通常攻撃'],['gHurt','被弾'],['gCrit','会心'],['gKill','撃破'],['gTurn','毎ターン'],['gKeep','アクティブ後'],['actP','アクティブ威力']];
function gxText(s){ const p=GXJP.filter(([k])=>s[k]).map(([k,l])=>`${l}+${s[k]}${k==='actP'?'%':''}`); const u=(s.uniq||[]).filter(k=>['gDouble','startFull','gShare','gHalf','mpRegen'].includes(k)).map(k=>UNIQ.find(x=>x.k===k).t); return [...p,...u].join('　'); }
function diffStats(n, it, slot){
  const m=G.members[n]; const before=calcStats(n); const sl=slot; const old=m.equip[sl]; m.equip[sl]=it; const after=calcStats(n); m.equip[sl]=old;
  const parts=[]; for(const k of ['atk','def','mat','mdf','spd','hp']){ const d=after[k]-before[k]; if(d) parts.push(`<span class="${d>0?'up':'dn'}">${STJP[k]}${d>0?'+':''}${d}</span>`); }
  for(const k of ['crit','critDmg']){ const d=after[k]-before[k]; if(d) parts.push(`<span class="${d>0?'up':'dn'}">${k==='crit'?'会心':'会心ダメ'}${d>0?'+':''}${d}%</span>`); }
  return parts.length?`<div style="font-size:11px;display:flex;gap:6px;flex-wrap:wrap;margin-top:2px">${parts.join('')}</div>`:'';
}
function scrEquip(n, slotSel){
  const m=G.members[n];
  if(!slotSel){
    const rows=SLOTS.map(sl=>{ const it=m.equip[sl]; const cnt=G.gear.filter(x=>x.slot===(sl.startsWith('acc')?'acc':sl)).length; const nw=G.gear.some(x=>x.slot===(sl.startsWith('acc')?'acc':sl)&&x.isNew);
      return `<button class="item" data-sl="${sl}" style="text-align:left"><span class="tag slab">${SLOTJP[sl]}</span>${it?itemLine(it,'',n):'<span class="ico none"></span><div class="grow" style="color:var(--sub)">なし</div>'}<small class="cnt">${nw?'<span class="newdot"></span>':''}${cnt}</small></button>`; }).join('');
    navHere('equip', x=>scrEquip(x), n);
    openScreen('そうび', memberTabs(n)+charHead(n,'',statGrid(statRows(n),1))+`<div class="list scroll">${rows}</div><button class="cb" id="eqBest">おすすめ装備</button>`);
    bindTabs(x=>scrEquip(x)); bindHead(); swipeAnim();
    $('scrBody').querySelectorAll('[data-sl]').forEach(b=>b.onclick=()=>{ sfx('ok'); scrEquip(n,b.dataset.sl); });
    $('eqBest').onclick=()=>{ const P=autoPlan(n); if(!P.changes.length){ sfx('tick'); toast('いまの装備がいちばん良い'); return; } sfx('ok'); scrAutoEquip(n,P); };
    return;
  }
  const base=slotSel.startsWith('acc')?'acc':slotSel;
  const cur=m.equip[slotSel];
  const list=sortGear(G.gear.filter(x=>x.slot===base)).slice(0,150);
  navHere('eqslot', x=>scrEquip(x,slotSel), n);
  openScreen(`${n}：${SLOTJP[slotSel]}`, memberTabs(n)+`<div class="card" style="padding:8px"><div style="font-size:11px;color:var(--sub)">いまの装備</div>${cur?`<div class="item" style="border:none;padding:4px 0">${itemLine(cur,'',n)}</div>`:'<div>なし</div>'}</div>
    ${sortBar()}<div class="list scroll">${list.length?list.map((it,i)=>`<button class="item" data-i="${i}" style="text-align:left">${itemLine(it,diffStats(n,it,slotSel),n)}</button>`).join(''):'<div class="card">この部位の装備を持っていない</div>'}</div>
    <div class="row"><button class="cb sm" id="eqOff" ${cur?'':'disabled style="opacity:.4"'}>はずす</button></div>`);
  bindTabs(x=>scrEquip(x,slotSel)); swipeAnim();
  $('scrBody').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ sfx('ok'); scrEquipCmp(n,slotSel,list[+b.dataset.i]); });
  $('eqOff').onclick=()=>{ const old=m.equip[slotSel]; if(!old) return; G.gear.push(old); m.equip[slotSel]=null; clampHpMp(n); sfx('tick'); toast(old.name+' をはずした'); scrEquip(n,slotSel); };
  bindSort(()=>scrEquip(n,slotSel));
  list.forEach(it=>it.isNew=false);
}
// 装備したらどう変わるか：全部のステータスを「今 → 装備後」で
function cmpTable(before,after){
  const ks=['hp','atk','def','mat','mdf','spd'];
  const r=(lab,a,b,suf='')=>{ const d=b-a; return `<span class="k">${lab}</span><span class="a">${a}${suf}</span><span class="ar">→</span><span class="b ${d>0?'up':d<0?'dn':''}">${b}${suf}${d?` <small>${d>0?'▲':'▼'}${Math.abs(d)}</small>`:''}</span>`; };
  return `<div class="cmp">${ks.map(k=>r(STJP[k],before[k],after[k])).join('')}${r('会心率',5+before.crit,5+after.crit,'%')}${r('会心ダメ',150+before.critDmg,150+after.critDmg,'%')}${r('会心防御',before.critDef,after.critDef,'%')}${r('開始ゲージ',before.gauge,after.gauge)}${GXJP.filter(([k])=>before[k]||after[k]).map(([k,l])=>r(l==='アクティブ威力'?'アクティブ威力':'ゲージ('+l+')',before[k],after[k],k==='actP'?'%':'')).join('')}</div>`;
}
function scrEquipCmp(n,slot,it){
  const m=G.members[n]; const before=calcStats(n); const old=m.equip[slot]; m.equip[slot]=it; const after=calcStats(n); m.equip[slot]=old;
  const card=x=>x?`<div class="item" style="padding:6px 8px">${itemLine(x,'',n)}</div>`:'<div class="item" style="padding:6px 8px;color:var(--sub)">なし</div>';
  navHere('eqcmp', ()=>scrEquipCmp(n,slot,it));
  openScreen(`${n}：${SLOTJP[slot]}`, `<div class="scroll" style="flex:1;display:flex;flex-direction:column;gap:8px;overflow-y:auto">
    <div class="ptitle"><span>いまの装備</span></div>${card(old)}<div class="ptitle"><span>これに変える</span></div>${card(it)}
    <div class="card">${cmpTable(before,after)}</div></div>
    <button class="cb" id="cmpOk" style="background:#24407a;border-color:#4b6fd1">装備する</button>`);
  $('cmpOk').onclick=()=>{ const o=m.equip[slot]; m.equip[slot]=it; it.isNew=false; G.gear=G.gear.filter(x=>x!==it); if(o) G.gear.push(o); clampHpMp(n); sfx('equip'); toast(it.name+' を装備した');
    // 部位の一覧の、その前の画面（そうび画面かステータス画面）へ戻る
    if(NAV.length>=3 && NAV[NAV.length-2].key==='eqslot') navPop(2, n); else scrEquip(n); };
}
// おすすめ装備を、実際には付けずに試す（変わる部位と、変わったあとの能力）
function autoPlan(n){
  const m=G.members[n]; const eq0=Object.assign({},m.equip), gear0=G.gear.slice(), hp0=m.hp, mp0=m.mp;
  const flags=new Map([...gear0, ...Object.values(eq0).filter(Boolean)].map(x=>[x,x.isNew]));
  const before=calcStats(n); autoEquip(n); const after=calcStats(n); const eq1=Object.assign({},m.equip);
  m.equip=eq0; G.gear=gear0; m.hp=hp0; m.mp=mp0; flags.forEach((v,x)=>x.isNew=v);
  const changes=SLOTS.filter(sl=>eq1[sl]!==eq0[sl]).map(sl=>({sl,from:eq0[sl],to:eq1[sl]}));
  return {before,after,changes};
}
// ビフォー・アフター：変わる部位を「いま → おすすめ」で並べ、能力の差を見せてから付ける
function scrAutoEquip(n,P){
  navHere('eqauto', ()=>scrAutoEquip(n,autoPlan(n)));
  const line=(it,dim)=>it?`<div class="aeq${dim?' dim':''}">${itemIconHTML(it).replace('class="ico','class="ico sm')}<span class="r${it.r}">${it.name}${it.plus?` +${it.plus}`:''}</span></div>`:`<div class="aeq${dim?' dim':''}"><span class="ico sm none"></span><span style="color:var(--sub)">なし</span></div>`;
  const rows=P.changes.map(c=>`<div class="item aeqr"><span class="tag slab">${SLOTJP[c.sl]}</span><div class="grow">${line(c.from,1)}<div class="aeqa">↓</div>${line(c.to)}</div></div>`).join('');
  openScreen(`${n}：おすすめ装備`, `<div class="scroll" style="flex:1;display:flex;flex-direction:column;gap:8px;overflow-y:auto">
    <div class="ptitle"><span>変わる装備（${P.changes.length}か所）</span><span>ほかはそのまま</span></div><div class="list" style="flex:0 0 auto;overflow:visible">${rows}</div>
    <div class="ptitle"><span>能力の変化</span><span>いま → おすすめ</span></div><div class="card">${cmpTable(P.before,P.after)}</div></div>
    <button class="cb" id="aeqOk" style="background:#24407a;border-color:#4b6fd1">この装備にする</button>`);
  $('aeqOk').onclick=()=>{ autoEquip(n); sfx('equip'); toast('おすすめの装備にした'); navPop(1,n); };
}
function autoEquip(n){
  const m=G.members[n], mag=CHARS[n].wpn==='mag';
  const score=(it,sl)=>{ const old=m.equip[sl]; m.equip[sl]=it; const s=calcStats(n); m.equip[sl]=old; const main=mag?s.mat:s.atk; return (mag?s.mat*1.2+s.atk*0.2:s.atk*1.2+s.mat*0.2)+s.def*0.8+s.mdf*0.6+s.spd*0.8+s.hp/12+s.crit*4+s.critDmg+s.gauge*main*0.002+main*(s.gNorm*0.012+s.gHurt*0.004+s.gCrit*0.002+s.gKill*0.003+s.gTurn*0.014+s.gKeep*0.006+s.actP*0.006)+(s.uniq.length?main*0.15*s.uniq.length:0); };
  for(const sl of SLOTS){ const base=sl.startsWith('acc')?'acc':sl; const cands=[m.equip[sl],...G.gear.filter(x=>x.slot===base)].filter(Boolean);
    if(!cands.length) continue; let best=cands[0],bs=-1; for(const it of cands){ const v=score(it,sl); if(v>bs){bs=v;best=it;} }
    if(best!==m.equip[sl]){ const old=m.equip[sl]; m.equip[sl]=best; best.isNew=false; G.gear=G.gear.filter(x=>x!==best); if(old) G.gear.push(old); } }
  clampHpMp(n);
}
// ---------- スキル（通常3・アクティブ3・パッシブ6。装備は通常1・アクティブ1・パッシブ2） ----------
// 四角いアイコンを、覚える順に線でつないだ「スキルツリー」。タップで詳細が下から出る
// 初めて付けるときはどこでも。付け替えは光る石（セーブ地点）で、何度でも無料。強化（技の書）はどこでも
function canRespec(){ return true; } // 付け替えはどこでも
function starsHTML(r){ return `<span class="stars">${'★'.repeat(r)}<i>${'★'.repeat(5-r)}</i></span>`; }
const KINDJP={N:'通常攻撃',A:'アクティブ',P:'パッシブ'};
// アイコンの字：名前の最初の漢字。同じキャラの中でかぶったら「の」の後ろの字
function skillGlyphs(n){ const K=KIT[n]; if(K._gl) return K._gl; const used=new Set(), gl={};
  for(const kind of ['N','A','P']) K[kind].forEach((d,j)=>{ const ks=(d.nm.match(/[一-鿿]/g)||[d.nm[0]]); let g=d.ic||ks[0];
    if(used.has(g)){ const af=d.nm.split('の')[1]; const k2=af&&af.match(/[一-鿿]/); g=k2?k2[0]:(ks.find(x=>!used.has(x))||g); }
    used.add(g); gl[kind+j]=g; });
  return K._gl=gl; }
function skillOn(n,kind,j){ const k=kitMember(n); if(kind==='N') return k.n===j?'使用中':''; if(kind==='A') return k.a===j?'使用中':''; const e=k.p.indexOf(j); return e>=0?'枠'+(e+1):''; }
function skTile(n,kind,j){ const d=KIT[n][kind][j], m=G.members[n], got=m.lv>=d.lv, r=skRank(n,kind,j), on=skillOn(n,kind,j);
  const can= got && on && r<5 && !!bookUse(kind,r);
  return `<button class="skt k${kind}${on?' on':''}${got?'':' lock'}" data-sk="${kind}${j}"><div class="ski">${got?skillGlyphs(n)[kind+j]:'<small>Lv</small>'+d.lv}${on?`<em>${on}</em>`:''}${can?'<i class="upd"></i>':''}</div><div class="skn">${d.nm}</div>${got?`<div class="skr">${starsHTML(r)}</div>`:''}</button>`; }
function scrSkill(n, openKey){
  const m=G.members[n], K=KIT[n], k=kitMember(n); kitAutoFill(n);
  const row=(kind,from,to)=>`<div class="sktrack t${kind}">${K[kind].slice(from,to).map((d,j)=>skTile(n,kind,j+from)).join('')}</div>`;
  const eq=[['N',k.n,'n'],['A',k.a,'a'],['P',k.p[0],'p0'],['P',k.p[1],'p1']].map(([kind,j,slot],i)=>{ const lab=['通常','アクティブ','パッシブ','パッシブ'][i];
    const open= kind!=='P' || m.lv>=SLOT_LV[i-2];
    if(j===null||j===undefined) return `<${open?'button':'div'} class="eqs" data-slot="${slot}" data-kind="${kind}"${open?` data-empty="${slot}"`:''}><div class="ski k${kind} empty">${open?'＋':'<small>Lv</small>'+SLOT_LV[i-2]}</div><small>${lab}</small></${open?'button':'div'}>`;
    return `<button class="eqs" data-slot="${slot}" data-kind="${kind}" data-sk="${kind}${j}"><div class="ski k${kind}">${skillGlyphs(n)[kind+j]}</div><small>${lab}</small></button>`; }).join('');
  navHere('skill', x=>scrSkill(x), n);
  openScreen('スキル', memberTabs(n)+charHead(n,`<div class="eqbar" style="margin-top:6px">${eq}</div>`)+`<div class="scroll skwrap" id="skWrap">
    <div class="sksec"><div class="sklab kN">通常攻撃</div>${row('N',0,3)}</div>
    <div class="sksec"><div class="sklab kA">アクティブ</div>${row('A',0,3)}</div>
    <div class="sksec"><div class="sklab kP">パッシブ</div>${row('P',0,3)}${row('P',3,6)}</div>
    <div class="skhint">タップで詳しく・長押しで上の枠へ・左右スワイプで仲間を切り替え</div>
  </div>`);
  bindTabs(x=>scrSkill(x)); bindHead(); swipeAnim();
  const body=$('scrBody');
  body.querySelectorAll('[data-sk]').forEach(b=>{ b.onclick=()=>{ if(DRAG.justDropped) return; sfx('tick'); skSheet(n,b.dataset.sk[0],+b.dataset.sk.slice(1)); }; });
  body.querySelectorAll('[data-empty]').forEach(b=>{ b.onclick=()=>{ sfx('tick'); skPick(n,'P',b.dataset.empty); }; });
  // 長押しして上の枠へ運ぶと付け替え
  body.querySelectorAll('.skt[data-sk]').forEach(b=>{ const kind=b.dataset.sk[0], j=+b.dataset.sk.slice(1); if(m.lv<K[kind][j].lv) return;
    dragable(b, { ghost:()=>b.querySelector('.ski').cloneNode(true),
      targets:()=>[...body.querySelectorAll('.eqs')].filter(t=>t.dataset.kind===kind && !t.querySelector('.ski small')),
      drop:(t)=>{ equipSkill(n,kind,j,t.dataset.slot); } }); });
  if(openKey) skSheet(n,openKey[0],+openKey.slice(1));
}
// 付け替え（どこでもできる）。slot: 'n' 'a' 'p0' 'p1'
function equipSkill(n,kind,j,slot,back){ const k=kitMember(n), m=G.members[n];
  if(kind==='N') k.n=j; else if(kind==='A') k.a=j;
  else { const i=slot==='p1'?1:0; if(m.lv<SLOT_LV[i]) return; const cur=k.p.indexOf(j); if(cur>=0 && cur!==i){ k.p[cur]=k.p[i]; } k.p[i]=j; }
  sfx('ok'); (back||(()=>scrSkill(n)))(); }
const PTYPE={rally:'倒したら',killAgain:'倒したら',follow:'仲間に反応',oath:'溜めて撃つ',back:'ずっと効く',lastStand:'倒れそうなとき',healWind:'回復したら',bless:'回復したら',overflow:'回復したら',judge:'溜めて撃つ',devotion:'仲間に反応',foresight:'敵に反応',gift:'配ったら',refund:'仲間が倒れたら',deepSleep:'ずっと効く',dreamCrit:'ずっと効く',nightmare:'溜めて撃つ',undo:'倒れたとき',kiUp:'ずっと効く',chase:'会心したら',shatter:'ずっと効く',kiBurst:'溜めて撃つ',counter:'殴られたら',desperate:'ずっと効く',wounded:'ずっと効く',blood:'技のたび',rage:'溜めて撃つ',breakDef:'ずっと効く',undying:'倒れそうなとき',vengeance:'倒れたとき',retaliate:'殴られたら',shieldMind:'殴られたら',guardChain:'殴られたら',wall:'ずっと効く',immovable:'溜めて撃つ',recover:'倒れそうなとき',momentum:'会心したら',gale:'会心したら',chainBlade:'会心したら',deepWound:'ずっと効く',thousand:'溜めて撃つ',critHunt:'会心したら',spread:'技のたび',ember:'溜めて撃つ',frost:'ずっと効く',heatRes:'ずっと効く',prep:'戦闘開始',infernoHeart:'ずっと効く',vanguard:'ずっと効く',swift:'ずっと効く',huntChain:'倒したら',pack:'ずっと効く',scent:'弱点を突いたら',moonFang:'溜めて撃つ',stHunt:'状態異常に反応',venom:'ずっと効く',stSkill:'ずっと効く',widen:'状態異常に反応',finish:'ずっと効く',finale:'溜めて撃つ',afterglow:'技のたび',cycle:'回復に反応',primal:'ずっと効く',lamp:'ずっと効く',wake:'戦闘開始',pillar:'溜めて撃つ',waver:'毎行動',haste:'毎行動',stopped:'ずっと効く',foresee:'戦闘開始',rewind:'仲間が倒れたら',timeEnd:'溜めて撃つ',command:'技のたび',breath:'ずっと効く',resonance:'仲間に反応',lead:'ずっと効く',thousandGuard:'ずっと効く',afterlight:'溜めて撃つ',
  appraise:'戦闘開始',greedy:'勝ったら',bargain:'勝ったら',interest:'溜めて撃つ',fortune:'ずっと効く',purse:'倒れそうなとき',
  grit:'殴られたら',guardHeart:'仲間がピンチ',pride:'ずっと効く',paladin:'溜めて撃つ',resolve:'ずっと効く',standFirm:'倒れそうなとき',
  encore:'技のたび',resonate:'仲間に反応',accomp:'ずっと効く',finale2:'溜めて撃つ',cheer:'ずっと効く',lastSong:'倒れたとき',
  hawk:'弱点を突いたら',rapid:'毎行動',keeper:'ずっと効く',guiding:'溜めて撃つ',longshot:'ずっと効く',dawnWatch:'戦闘開始',
  cursedDmg:'ずっと効く',curseHit:'当てたら',shadowGuard:'仲間がピンチ',darkFest:'溜めて撃つ',demonBlood:'ずっと効く',vesselKin:'戦闘開始',
  deathScent:'ずっと効く',sendOff:'倒したら',procession:'溜めて撃つ',graveEye:'ずっと効く',noRise:'ずっと効く',mourner:'仲間が倒れたら',
  bloodBack:'倒したら',pushThrough:'ずっと効く',strongArm:'ずっと効く',warCry:'溜めて撃つ',aftershock:'当てたら',guildBond:'仲間に反応',
  majesty:'ずっと効く',command2:'技のたび',stillStrong:'ずっと効く',kingReturn:'溜めて撃つ',noFlee:'倒れそうなとき',regret:'仲間が倒れたら',
  growing:'ずっと効く',admire:'仲間に反応',spirit:'殴られたら',nextEra:'溜めて撃つ',innocent:'ずっと効く',heroEgg:'勝ったら',
  learn:'殴られたら',remember:'ずっと効く',generalPride:'ずっと効く',thirdTime:'当てたら',warlord:'ずっと効く',undying2:'倒れたとき'};
// ---- スキルの中身を「対象・ダメージ・効果」の行にする（見てすぐ分かるように） ----
const TGJP={front:'前にいる敵1体',low:'HPが一番少ない敵1体',high:'HPが一番多い敵1体',all:'敵全員',mostSt:'状態異常が一番多い敵1体',random:'敵1体'};
const ELJP2={fire:'炎',ice:'氷',thunder:'雷',light:'光',dark:'闇',weak:'弱点の属性',allweak:'全員の弱点'};
const STJP2={sleep:'眠り',poison:'毒',paralyze:'麻痺',burn:'燃焼',freeze:'凍結',stop:'停止',mark:'印',defDown:'防御ダウン'};
const PC=v=>Math.round(v*100)+'%', NB=t=>`<b class="num">${t}</b>`;
function skillSpec(def,r){
  const z=skillAt(def,r), R=[]; const add=(l,v,key)=>R.push({l,v,key:key||l});
  if(def.kind==='P'){ add('いつ',PTYPE[def.id]||''); add('効果',skillText(def,r).replace(/([+−\-×]?\d+(?:\.\d+)?%?)/g,'<b class="num">$1</b>')); return R; }
  switch(z.k){
  case 'atk':
    add('対象',TGJP[z.tgt]||'敵');
    if(z.rh) add('対象','ランダムな敵（1回ずつ選び直す）');
    if(z.xTaken) add('ダメージ',`この戦闘で受けたダメージの ${NB(PC(z.m))}`,'dmg');
    else if(z.mimicN) add('ダメージ',`前に動いた味方の通常攻撃を ${NB(PC(z.mimicN))} でまねる`,'dmg');
    else if(z.mimic) add('ダメージ',`直前の味方のアクティブを ${NB(PC(z.mimic))} でまねる <small>なければ ${PC(z.m)}</small>`,'dmg');
    else if(z.xLearnAll) add('ダメージ',`覚え1つにつき ${NB(PC(z.xLearnAll))} <small>最低 ${PC(z.m)}</small>`,'dmg');
    else if(z.m>0) add('ダメージ',`${NB(PC(z.m))}${(z.h||1)>1?` × ${NB(z.h+'回')}`:''}${z.mag?' <small>魔法</small>':''}${z.el?` <small>${ELJP2[z.el]||''}</small>`:''}`,'dmg');
    break;
  case 'pray': add('対象','HPが80%未満の味方（一番減った人）'); add('回復',`魔攻の ${NB(PC(z.m))}${z.n>1?` × ${NB(z.n+'人')}`:''}`,'heal'); add('いなければ',`敵に光 ${NB('80%')}`); break;
  case 'heal': add('対象',z.tgt==='all'?'味方全員':'HPが一番減った味方'); add('回復',`魔攻の ${NB(PC(z.m))}`,'heal'); break;
  case 'shield': add('対象',z.tgt==='all'?'味方全員':`HPが一番低い味方${z.n>1?' '+z.n+'人':''}`); add('盾', z.shHp?`自分の最大HPの ${NB(z.shHp+'%')} ぶんのダメージを防ぐ`:`魔攻の ${NB(PC(z.m))} ぶんのダメージを防ぐ`,'sh'); break;
  case 'support': add('対象', z.gTop?`ゲージが一番多い味方${z.gTopN>1?' '+z.gTopN+'人':''}`:'味方全員'); if(z.gTop) add('ゲージ',`+${NB(z.gTop)}`,'gtop'); if(z.actTop&&!z.pAtk&&!z.pG) add('動き','攻撃せず、仲間を動かす'); break;
  case 'taunt': add(z.cover?'かばう':'挑発',`${NB(z.turns+'ターン')} ${z.cover?'味方への攻撃を全部、代わりに受ける':'敵の攻撃を自分に集める'}`,'taunt'); if(z.cut) add('被ダメージ',NB('−'+z.cut+'%'),'cut'); break;
  case 'stance': add('動き','攻撃せず、構える'); if(z.cover) add('かばう','次の自分の番まで、味方への攻撃を代わりに受ける'); else if(!z.noTaunt) add('挑発','次の自分の番まで'); if(z.cut) add('被ダメージ',NB('−'+z.cut+'%'),'cut'); if(z.ctr) add('反撃',`殴られたら ${NB(PC(z.ctr))}${z.ctrAll?'（敵全員に）':''}`,'ctr'); break;
  case 'revive': add('復活',`倒れた味方を HP${NB(z.rev+'%')} で起こす`,'rev'); add('いなければ',`味方全員のHPを ${NB(z.pHeal+'%')} 回復`,'ph'); break;
  }
  const E=[]; const e=(t,key)=>E.push({t,key});
  if(z.st) e(`${STJP2[z.st.s]} ${NB(z.st.c+'%')}`,'st'); if(z.st2) e(`${STJP2[z.st2.s]} ${NB(z.st2.c+'%')}`,'st2');
  if(z.stPick) e(`毒・麻痺・燃焼から${NB(z.stPick.n+'つ')}（各${z.stPick.c}%）`,'stp'); if(z.elSt) e('炎なら燃焼・氷なら凍結','elst');
  if(z.dd) e(z.dd>=100?'防御ダウン':`防御ダウン ${NB(z.dd+'%')}`,'dd'); if(z.sd) e('速度ダウン','sd');
  if(z.mark) e(`急所の印 ${NB((z.mark)+'ターン')}（会心率+${z.markCr||40}%）`,'mark'); if(z.lvn) e(`光の被ダメージ ${NB('+'+z.lvn.pct+'%')}（${z.lvn.t}ターン）`,'lvn');
  if(z.xLow) e(`HP${z.xLow.th*100}%以下の敵に ${NB('×'+z.xLow.x)}`,'xl'); if(z.xSelfLow) e(`自分のHP${z.xSelfLow.th*100}%以下で ${NB('×'+z.xSelfLow.x)}`,'xsl');
  if(z.xSelfScale) e(`自分のHPが低いほど 最大${NB('×'+z.xSelfScale)}`,'xss'); if(z.xSt) e(`${STJP2[z.xSt.st]}の敵に ${NB('×'+z.xSt.x)}`,'xst');
  if(z.xPerSt) e(`状態異常1つごとに ${NB('+'+PC(z.xPerSt))}`,'xps'); if(z.xFirst) e(`一番に動いたら ${NB('×'+z.xFirst)}`,'xf'); if(z.xTaunt) e(`挑発中は ${NB('×'+z.xTaunt)}`,'xt');
  if(z.xPerAtkUp) e(`攻撃アップ中の味方1人ごとに ${NB('+'+PC(z.xPerAtkUp))}`,'xpa'); if(z.xAnyAtkUp) e(`攻撃アップ中の味方がいれば ${NB('×'+z.xAnyAtkUp)}`,'xaa');
  if(z.xPerFull) e(`HP満タンの味方1人ごとに ${NB('+'+PC(z.xPerFull))}`,'xpf'); if(z.xKi) e(`気1つごとに ${NB('+'+PC(z.xKi))}（気を全部使う）`,'xki');
  if(z.xWeak) e(`弱点なら ${NB('×'+z.xWeak)}`,'xw'); if(z.weakH) e(`弱点なら ${NB(z.weakH+'回')}`,'wh');
  if(z.sc) e('かならず会心','sc'); if(z.scIf) e({mark:'印の敵にはかならず会心',paralyze:'麻痺の敵にはかならず会心',st2:'状態異常2つ以上ならかならず会心',ki8:'気8以上でかならず会心',ki5:'気5以上なら会心率+30%'}[z.scIf],'scif');
  if(z.cr) e(`会心率 ${NB('+'+z.cr+'%')}`,'cr'); if(z.idef) e(z.idef>=1?'防御を無視':`防御を${NB(PC(z.idef))}無視`,'idef'); if(z.idefLow) e('自分のHP30%以下なら防御を無視','idl');
  if(z.critX) e(`会心ダメージ ${NB('+'+PC(z.critX))}`,'cx'); if(z.weakX) e(`弱点ダメージ ${NB('+'+PC(z.weakX))}`,'wx'); if(z.drain) e(`与えたダメージの${NB(PC(z.drain))}を回復`,'drain');
  if(z.cost) e(`自分のHPを${NB(z.cost+'%')}払う${z.costIfAbove?'（HP30%以下なら払わない）':''}`,'cost');
  if(z.burst) e(`燃えている敵全員の燃焼を爆発（残りの燃焼ダメージ ${NB('×'+z.burst)}）${z.keepBurn?'・燃焼は残る':''}`,'burst');
  if(z.splash) e(`ほかの敵にも ${NB(PC(z.splash))}`,'spl'); if(z.land) e(`着地で敵全員に ${NB(PC(z.land))}`,'land'); if(z.air) e('次の自分の番まで攻撃を受けない','air');
  if(z.tauntSelf) e(`自分に挑発 ${NB(z.tauntSelf+'ターン')}${z.cutSelf?`・被ダメージ−${z.cutSelf}%`:''}`,'ts');
  if(z.atkSelf) e(`自分の攻撃 ${NB('+'+z.atkSelf.pct+'%')}（${z.atkSelf.t}ターン）`,'as'); if(z.hurtG) e(`殴られるたびゲージ ${NB('+'+z.hurtG)}`,'hg'); if(z.noDie) e('挑発中は倒れない','nd'); if(z.hurtWeak) e('殴ってきた敵の攻撃ダウン','hw');
  if(z.pAtk) e(`味方全員の攻撃 ${NB('+'+z.pAtk.pct+'%')}（${z.pAtk.t}ターン）`,'pa'); if(z.pCrit) e(`味方全員の会心率 ${NB('+'+z.pCrit+'%')}`,'pc');
  if(z.pCut) e(`味方全員の被ダメージ ${NB('−'+z.pCut.pct+'%')}（${z.pCut.t}ターン）`,'pcut'); if(z.pSpd) e(`味方全員の速度アップ（${z.pSpd}ターン）`,'ps');
  if(z.pG && z.k!=='support') e(`味方全員のゲージ ${NB('+'+z.pG)}`,'pg'); if(z.pG && z.k==='support') e(`味方全員のゲージ ${NB('+'+z.pG)}`,'pg');
  if(z.pHeal && z.k!=='revive') e(`味方全員のHPを ${NB(z.pHeal+'%')} 回復`,'phl'); if(z.pShield) e(`味方全員に盾（魔攻の${NB(PC(z.pShield))}）`,'psh');
  if(z.cure) e('状態異常を治す','cure'); if(z.over) e('あふれた回復は盾になる','over'); if(z.toG) e(`その味方のゲージ ${NB('+'+z.toG)}`,'tog');
  if(z.shAtk) e(`盾がある間 攻撃 ${NB('+'+z.shAtk+'%')}`,'sha'); if(z.shBurst) e('盾が割れたら、殴った敵に割れた量のダメージ','shb');
  if(z.nextPow) e(`もらった味方の次のアクティブ ${NB('+'+z.nextPow+'%')}`,'np'); if(z.nextCrit) e('次の味方のアクティブがかならず会心','nc'); if(z.actTop) e('ゲージが一番多い味方がすぐ動く','at');
  if(z.guardAll) e('全員に1度だけ死なない加護','ga'); if(z.fullG && z.k==='revive') e('復活した味方のゲージ満タン','fg'); if(z.fullG && z.k!=='revive') e(`HP満タンの味方のゲージ ${NB('+'+z.fullG)}`,'fg2');
  if(z.defUp) e('防御アップ','du'); if(z.deep) e(`攻撃${NB(z.deep+'回')}まで目覚めない`,'deep'); if(z.bossOk) e('ボスにも効きやすい','bo');
  if(z.burnT) e(`燃焼が${NB(z.burnT+'ターン')}`,'bt'); if(z.burnX) e(`この燃焼のダメージ ${NB('×'+z.burnX)}`,'bx'); if(z.frostPhys) e(`凍った敵は物理の被ダメージ ${NB('+'+z.frostPhys+'%')}`,'fp');
  if(z.gp) e(`与えたダメージの${NB(z.gp+'%')}がお金に`,'gp'); if(z.reveal) e('弱点を見抜く','rv'); if(z.expose) e(`その敵の被ダメージ ${NB('+'+z.expose.pct+'%')}（${z.expose.t}ターン）`,'exp');
  if(z.atkDown) e('攻撃ダウン','ad'); if(z.allDown) e('敵全員の攻撃ダウン','ald'); if(z.lucky) e(`${NB(z.lucky.c+'%')}で ${NB('×'+z.lucky.x)}`,'lk');
  if(z.selfDefUp) e('自分の防御アップ','sdu'); if(z.xTakenScale) e(`受けたダメージが多いほど 最大${NB('×'+z.xTakenScale)}`,'xts');
  if(z.weakCr) e(`弱点なら会心率 ${NB('+'+z.weakCr+'%')}`,'wcr'); if(z.weakBuff) e(`味方全員の弱点ダメージ ${NB('+'+z.weakBuff.pct+'%')}（${z.weakBuff.t}ターン）`,'wb');
  if(z.curse) e(`呪い ${NB('+'+z.curse)}<small>（1つにつき被ダメージ+3%・最大6）</small>`,'cu'); if(z.curseBurst) e(`呪いをはじけさせる（1つにつき ${NB(PC(z.curseBurst))}）${z.keepCurse?'・半分残る':''}`,'cb');
  if(z.xUndead) e(`アンデッドに ${NB('×'+z.xUndead)}`,'xu'); if(z.exec) e(`HP${Math.round(z.exec.th*100)}%以下の敵を${NB(z.exec.c+'%')}で倒す（ボス以外）`,'ex');
  if(z.xFoeLow) e(`敵のHPが減っているほど 最大${NB('×'+z.xFoeLow)}`,'xfl'); if(z.spill) e('倒したら、あふれたダメージを次の敵へ','spl2');
  if(z.xSelfFull) e(`自分のHP満タンなら ${NB('×'+z.xSelfFull)}`,'xsf'); if(z.allAttack) e('ほかの味方がすぐ通常攻撃する','aa');
  if(z.selfStack) e(`自分の攻撃 ${NB('+'+z.selfStack+'%')}（戦闘中・最大+50%）`,'sst'); if(z.focus) e(`同じ敵を続けて攻撃するたび ${NB('+'+z.focus+'%')}`,'foc');
  if(z.xLearn) e(`覚え1つにつき ${NB('+'+PC(z.xLearn))}`,'xle');
  if(z.poisonExt) e('毒を1ターン延ばす','pe'); if(z.stAdd) e('状態異常を1つ足す','sa');
  // あとから起きること
  if(z.gph) e(`当たるたびゲージ ${NB('+'+z.gph)}`,'gph'); if(z.kph) e(`当たるたび気 ${NB('+'+z.kph)}`,'kph'); if(z.kAdd) e(`気 ${NB('+'+z.kAdd)}`,'kadd'); if(z.kpt) e('当てた数だけ気+1','kpt');
  if(z.hLow) e(`与えたダメージの${NB(z.hLow+'%')}で一番減った味方を回復`,'hl'); if(z.hAll) e(`与えたダメージの${NB(z.hAll+'%')}で味方全員を回復`,'ha'); if(z.healHit) e(`回復量の${NB(PC(z.healHit))}を敵にダメージ`,'hh');
  if(z.kG) e(`倒すとゲージ ${NB('+'+z.kG)}`,'kg'); if(z.kAtk) e(`倒すと味方全員の攻撃 ${NB('+'+z.kAtk.pct+'%')}`,'katk'); if(z.kAgain) e('倒すともう1回動く','kag');
  if(z.kRe) e(`${z.kReCrit?'会心で':''}倒したら、もう一度（威力${NB(PC(z.kRe))}）`,'kre'); if(z.reKi10) e('気が10ならもう一度','rk'); if(z.kAtkSelf) e(`倒すたび自分の攻撃 ${NB('+'+z.kAtkSelf+'%')}（戦闘中ずっと）`,'kas');
  if(z.kSpread) e(`倒れた敵の${STJP2[z.kSpread]}がとなりに移る`,'ksp'); if(z.kKi) e('倒すと気が戻る','kki'); if(z.kiBack) e(`使った気の${PC(z.kiBack)}が戻る`,'kb');
  if(z.cG) e(`会心でゲージ ${NB('+'+z.cG)}`,'cg'); if(z.cPG) e(`会心で味方全員のゲージ ${NB('+'+z.cPG)}`,'cpg'); if(z.cSpd) e('会心で速度アップ','cs'); if(z.cHit) e('会心のたび1回追加（最大5）','ch');
  if(z.gAll) e(`味方全員のゲージ ${NB('+'+z.gAll)}`,'gall'); if(z.gSelf) e(`自分のゲージ ${NB('+'+z.gSelf)}`,'gself'); if(z.gNext) e(`次に動く味方のゲージ ${NB('+'+z.gNext)}`,'gn');
  if(z.gLow) e(`ゲージが一番少ない味方${z.gLowN>1?z.gLowN+'人':''}に ${NB('+'+z.gLow)}${z.aLow?`・攻撃+${z.aLow}%`:''}`,'gl'); if(z.gpt) e(`当てた数×ゲージ ${NB('+'+z.gpt)}`,'gpt');
  if(z.stG) e(`眠らせたらゲージ ${NB('+'+z.stG)}`,'stg'); if(z.slG) e(`眠った数×味方全員のゲージ ${NB('+'+z.slG)}`,'slg'); if(z.stopG) e(`止めたら味方全員のゲージ ${NB('+'+z.stopG)}`,'stopg'); if(z.stopAgain) e('止めたらもう1回動く','sta');
  if(z.st2G) e(`状態異常2つ以上の敵ならゲージ ${NB('+'+z.st2G)}`,'s2g'); if(z.burnG) e(`燃えている敵1体ごとにゲージ ${NB('+'+z.burnG)}`,'bg'); if(z.thawG) e(`凍結が割れたらゲージ ${NB('+'+z.thawG)}`,'tg'); if(z.burstG) e(`爆発した数×ゲージ ${NB('+'+z.burstG)}`,'bsg');
  if(z.markG) e('印の敵に会心が出るたび味方全員のゲージ+5','mg'); if(z.again) e(`${NB(z.again+'%')}でもう1回動く`,'ag'); if(z.spdSelf) e('自分の速度アップ','ss');
  if(E.length) add('効果',E.map(x=>`<span class="sfx">${x.t}</span>`).join(''),'fx');
  R._E=E; return R;
}
// 次の★で変わるところだけ（数字の変化と、新しく付く効果）
function skillDiff(def,r){
  if(def.kind==='P'){ const a=skillText(def,r), b=skillText(def,r+1); return a===b?[]:[b.replace(/([+−\-×]?\d+(?:\.\d+)?%?)/g,'<b class="num">$1</b>')]; }
  const A=skillSpec(def,r), B=skillSpec(def,r+1), out=[];
  const cp=v=>v.replace(/\s*<small>.*?<\/small>/g,'').trim();
  for(const row of B){ if(row.key==='fx') continue; const o=A.find(x=>x.key===row.key); if(o && o.v!==row.v) out.push(`${row.l}　${cp(o.v)} → ${cp(row.v)}`); }
  const ea=A._E||[], eb=B._E||[];
  for(const x of eb){ const o=ea.find(y=>y.key===x.key); if(!o) out.push(`<span class="newfx">NEW</span> ${x.t}`); else if(o.t!==x.t) out.push(`${o.t} → ${x.t}`); }
  return out; }
function specHTML(R){ return `<div class="spec">${R.map(x=>`<div class="srow"><span class="sl">${x.l}</span><span class="sv">${x.v}</span></div>`).join('')}</div>`; }
// 詳細（下から出るシート）：今の効果・次の★・必要な技の書だけ。back：閉じたあとに描き直す画面
function skSheet(n,kind,j,back){
  back=back||(()=>scrSkill(n));
  const K=KIT[n], d=K[kind][j], m=G.members[n], k=kitMember(n), got=m.lv>=d.lv, r=skRank(n,kind,j), on=skillOn(n,kind,j);
  const kb=r<5?BOOKK[kind][r-1]:null, wb=r<5?BOOKS[r-1]:null, bk=r<5?(bookUse(kind,r)||kb):null, have=bk?(G.inv[bk]||0):0;
  let act='';
  if(!got) act=`<div class="shnote">Lv${d.lv}で覚える</div>`;
  else {
    const eqBtn= on ? (kind==='P'? `<button class="cb" id="shCh">変更</button><button class="cb sm" id="shEq" style="flex:0 0 auto">外す</button>` : `<button class="cb" id="shCh">変更<small>使用中</small></button>`) : `<button class="cb" id="shEq">付ける</button>`;
    const upBtn= bk? `<button class="cb${have?'':' dis'}" id="shUp">強化する<small>${ITEMS[bk].n} 1冊（${have}冊）${bk===wb?'':(G.inv[wb]||0)?`・万能${G.inv[wb]}`:''}</small></button>` : `<button class="cb dis">★5（最大）</button>`;
    act=`<div class="row">${eqBtn}${upBtn}</div>`;
  }
  const diff= got&&r<5 ? skillDiff(d,r) : [];
  const el=document.createElement('div'); el.id='skSheet'; el.innerHTML=`<div class="shbg"></div><div class="sh">
    <div class="shtop"><div class="ski big k${kind}">${skillGlyphs(n)[kind+j]}</div><div style="flex:1;min-width:0"><div class="shk">${KINDJP[kind]}${kind!=='P'&&d.tag?`<span class="tag">${d.tag}向け</span>`:''}</div><div class="shn">${d.nm}</div>${got?starsHTML(r):''}</div><button class="cb sm" id="shX">×</button></div>
    ${specHTML(skillSpec(d,Math.max(1,r)))}
    ${diff.length?`<div class="shnext"><small>次の★${r+1}</small>${diff.map(x=>`<div>${x}</div>`).join('')}</div>`:''}
    ${act}</div>`;
  const old=$('skSheet'); if(old) old.remove();
  $('screen').appendChild(el);
  const close=()=>{ el.remove(); };
  el.querySelector('.shbg').onclick=close; el.querySelector('#shX').onclick=()=>{ sfx('back'); close(); };
  const up=el.querySelector('#shUp'); if(up) up.onclick=()=>{ if(!(G.inv[bk]>0)) return; G.inv[bk]--; k.rk[kind+j]=r+1; sfx('lvup'); toast(`${d.nm} ★${r+1}`); close(); back(); skSheet(n,kind,j,back); };
  const chb=el.querySelector('#shCh'); if(chb) chb.onclick=()=>{ sfx('tick'); const slot= kind==='N'?'n': kind==='A'?'a': 'p'+k.p.indexOf(j); skPick(n,kind,slot,back); };
  const eqb=el.querySelector('#shEq'); if(eqb) eqb.onclick=async()=>{
    if(kind==='N'||kind==='A'){ close(); equipSkill(n,kind,j,null,back); return; }
    const cur=k.p.indexOf(j);
    if(cur>=0){ k.p[cur]=null; sfx('tick'); close(); back(); return; }
    const open=[0,1].filter(i=>m.lv>=SLOT_LV[i]); if(!open.length){ toast(`Lv${SLOT_LV[0]}で枠が開く`); return; }
    const empty=open.find(i=>k.p[i]===null||k.p[i]===undefined);
    close();
    if(empty!==undefined){ equipSkill(n,'P',j,'p'+empty,back); return; }
    let slot=open[0]; if(open.length>1){ slot=await choose(`「${d.nm}」と入れ替える`,open.map(i=>K.P[k.p[i]].nm).concat(['やめる'])); if(slot>=open.length){ back(); return; } slot=open[slot]; }
    equipSkill(n,'P',j,'p'+slot,back); };
}
// 枠に入れるスキルを選ぶ（下から出る一覧）。いま付いているものは一番上、覚えていないものは灰色
function skBrief(n,kind,j){ const d=KIT[n][kind][j]; const r=Math.max(1,skRank(n,kind,j));
  const R=skillSpec(d,r); const strip=v=>String(v).replace(/<small>.*?<\/small>/g,'').replace(/<[^>]+>/g,'').replace(/\s+/g,' ').trim();
  return R.filter(x=>x.key!=='fx').map(x=>strip(x.v)).concat((R._E||[]).slice(0,2).map(x=>strip(x.t))).join('・'); }
function skPick(n,kind,slot,back){
  back=back||(()=>scrSkill(n));
  const K=KIT[n], m=G.members[n], k=kitMember(n);
  const cur= kind==='N'?k.n: kind==='A'?k.a: k.p[slot==='p1'?1:0];
  const other= kind==='P'? k.p[slot==='p1'?0:1] : null;
  const lab= kind==='N'?'通常攻撃': kind==='A'?'アクティブ': 'パッシブ'+(slot==='p1'?'2':'1');
  const rows=K[kind].map((d,j)=>({d,j})).sort((a,b)=>(b.j===cur)-(a.j===cur) || (m.lv>=b.d.lv)-(m.lv>=a.d.lv) || a.d.lv-b.d.lv).map(({d,j})=>{
    const got=m.lv>=d.lv, isCur=j===cur, isOther=j===other&&other!==null&&other!==undefined;
    return `<button class="pkr${isCur?' cur':''}${got?'':' lock'}" data-pk="${j}" ${got&&!isCur?'':'disabled'}><div class="ski k${kind}">${got?skillGlyphs(n)[kind+j]:'<small>Lv</small>'+d.lv}</div>
      <div class="pki"><div><b>${d.nm}</b> ${got?starsHTML(skRank(n,kind,j)):`<small>Lv${d.lv}で覚える</small>`}${isCur?' <span class="tag">いま</span>':''}${isOther?' <span class="tag">もう1つの枠</span>':''}</div><small>${got?skBrief(n,kind,j):''}</small></div></button>`; }).join('');
  const el=document.createElement('div'); el.id='skSheet'; el.innerHTML=`<div class="shbg"></div><div class="sh">
    <div class="shtop"><div style="flex:1"><div class="shk">${n}</div><div class="shn">${lab}を選ぶ</div></div><button class="cb sm" id="shX">×</button></div>
    <div class="pkl">${rows}</div>${kind==='P'&&other!==null&&other!==undefined?'<div class="skhint" style="text-align:left">もう1つの枠のスキルを選ぶと、枠どうしで入れ替わる</div>':''}</div>`;
  const old=$('skSheet'); if(old) old.remove(); $('screen').appendChild(el);
  const close=()=>el.remove();
  el.querySelector('.shbg').onclick=close; el.querySelector('#shX').onclick=()=>{ sfx('back'); close(); };
  el.querySelectorAll('[data-pk]').forEach(b=>b.onclick=()=>{ const j=+b.dataset.pk; close(); equipSkill(n,kind,j,slot,back); toast(`${lab}：${K[kind][j].nm}`); });
}
// ---------- 長押しドラッグ（メニューの並び替え・スキルの付け替え） ----------
const DRAG={on:false, justDropped:false, p:null};
function dragable(el, opt){
  el.addEventListener('pointerdown',e=>{ if(DRAG.on||DRAG.p) return;
    const P={el,opt,sx:e.clientX,sy:e.clientY,pid:e.pointerId,ghost:null,over:null,tg:[]};
    P.timer=setTimeout(()=>{ P.timer=null; DRAG.on=true; el.classList.add('dragging'); sfx('tick'); if(navigator.vibrate) try{navigator.vibrate(10);}catch(_){}
      P.tg=opt.targets(); P.tg.forEach(t=>t.classList.add('dropok'));
      P.ghost=document.createElement('div'); P.ghost.className='dghost'; P.ghost.appendChild(opt.ghost()); document.body.appendChild(P.ghost); dragPlace(P,P.sx,P.sy); },320);
    DRAG.p=P; });
}
function dragPlace(P,x,y){ if(P.ghost){ P.ghost.style.left=x+'px'; P.ghost.style.top=y+'px'; } }
function dragEnd(drop){ const P=DRAG.p; if(!P) return; DRAG.p=null; clearTimeout(P.timer);
  if(!DRAG.on) return; DRAG.on=false; P.el.classList.remove('dragging'); if(P.ghost) P.ghost.remove(); P.tg.forEach(t=>t.classList.remove('dropok','dropover'));
  DRAG.justDropped=true; setTimeout(()=>DRAG.justDropped=false,250);
  if(drop && P.over) P.opt.drop(P.over); }
window.addEventListener('pointermove',e=>{ const P=DRAG.p; if(!P||e.pointerId!==P.pid) return;
  if(P.timer && Math.hypot(e.clientX-P.sx,e.clientY-P.sy)>9){ clearTimeout(P.timer); DRAG.p=null; return; }
  if(DRAG.on){ dragPlace(P,e.clientX,e.clientY); const hit=document.elementFromPoint(e.clientX,e.clientY); const t=hit&&P.tg.find(x=>x.contains(hit)); if(t!==P.over){ if(P.over) P.over.classList.remove('dropover'); P.over=t||null; if(P.over) P.over.classList.add('dropover'); } } });
window.addEventListener('pointerup',e=>{ const P=DRAG.p; if(!P||e.pointerId!==P.pid) return; dragEnd(true); });
document.addEventListener('dragstart',e=>{ if(DRAG.p) e.preventDefault(); });
window.addEventListener('pointercancel',e=>{ const P=DRAG.p; if(!P||e.pointerId!==P.pid) return; dragEnd(false); });
// ドラッグ中は画面のスクロールを止める
document.addEventListener('touchmove',e=>{ if(DRAG.on) e.preventDefault(); },{passive:false});
function scrItem(tab){
  tab=tab||RT.itemTab||'tool'; RT.itemTab=tab;
  if(tab==='mat') tab='tool';
  const tabs=`<div class="rtabs" style="grid-template-columns:repeat(2,1fr)">${[['tool','道具'],['book','技の書']].map(([k,l])=>`<button class="${k===tab?'on':''}" data-it="${k}">${l}</button>`).join('')}</div>`;
  let body='';
  if(tab==='tool'){
    const ks=Object.keys(G.inv).filter(k=>G.inv[k]>0&&ITEMS[k]&&!isBook(k));
    body=`<div class="list scroll tight" style="flex:1">${ks.length?ks.map(k=>`<button class="item" data-k="${k}" style="text-align:left">${goodIconHTML(toolIcon(k))}<div class="grow"><div>${ITEMS[k].n}</div><small>${ITEMS[k].d}</small></div><b class="cnt">×${G.inv[k]}</b></button>`).join(''):'<div class="card">道具を持っていない</div>'}</div>`;
  } else if(tab==='book'){
    // 種類（行）× 段階（列）の表。数字の位置がそろうように
    const rows=[['N','型の書','通常攻撃'],['A','奥義の書','アクティブ'],['P','心得の書','パッシブ'],['W','万能の書','どれにでも']];
    body=`<div class="scroll" style="flex:1;display:flex;flex-direction:column;gap:8px"><div class="card bkt"><span></span>${['初','中','上','極'].map(t=>`<span class="bth">${t}</span>`).join('')}
      ${rows.map(([c,nm,lab])=>`<span class="bkn"><b>${nm}</b><small>${lab}</small></span>${[1,2,3,4].map(t=>{ const k=c==='W'?'book'+t:'b'+c+t, n=G.inv[k]||0; return `<span class="bkc${n?'':' none'}">${goodIconHTML(toolIcon(k),1)}<b>${n}</b></span>`; }).join('')}`).join('')}</div>
      <div class="skhint" style="text-align:left">スキルの★を上げるのに使う（初：★1→2、中：★2→3、上：★3→4、極：★4→5）。その種類の書がないときは、万能の書を使う。アクティブの書は見つかりにくい。</div></div>`;
  }
  navHere('item', ()=>scrItem());
  openScreen('どうぐ', tabs+body);
  $('scrBody').querySelectorAll('[data-it]').forEach(b=>b.onclick=()=>{ sfx('tick'); scrItem(b.dataset.it); });
  $('scrBody').querySelectorAll('[data-k]').forEach(b=>b.onclick=async()=>{ const k=b.dataset.k;
    if(isBook(k)){ toast('スキル画面の「強化」で使う'); return; }
    if(k==='holy'){ G.inv.holy--; G.holy=120; toast('聖水をふりかけた。しばらく敵に出会いにくい'); scrItem(); return; }
    if(k==='rope'){ if(RT.mode!=='field'||!RT.map||RT.map.town){ toast('ダンジョンの中で使う'); return; } if(RT.map.id==='maze'){ toast('記憶の迷宮の中では、糸がほどけてしまう'); return; }
      G.inv.rope--; closeScreen(); RT.busy=true; sfx('ok'); await fade(true); if(RT.map) await runTrigger('leave_'+RT.map.id); RT.mode='world'; RT.map=null; await fade(false); RT.busy=false; toast('抜け道の糸をたどって、外へ出た'); openWorld(); return; }
    const pool=G.party.filter(x=> k==='feather'?G.members[x].hp<=0:G.members[x].hp>0);
    if(!pool.length){ toast('使える相手がいない'); return; }
    const i=await new Promise(r=>{ navHere('itemWho', ()=>{}); openScreen('だれに使う？', `<div class="list">${pool.map((t,i)=>`<button class="item" data-t="${i}"><div class="grow"><div>${t}</div><small>HP ${G.members[t].hp}/${calcStats(t).hp}</small></div></button>`).join('')}</div>`); $('scrBody').querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>r(+x.dataset.t)); });
    const t=pool[i], tm=G.members[t], ts=calcStats(t); G.inv[k]--;
    if(k==='feather'){ if(Math.random()<.75){ tm.hp=Math.round(ts.hp*.3); toast(t+' が生き返った！'); } else toast('効かなかった…'); }
    else if(k==='cure') toast('（状態異常は戦闘が終わると治る）');
    else tm.hp=Math.min(ts.hp,tm.hp+Math.round(ts.hp*{herb:.3,herb2:.6,herb3:1}[k]));
    sfx('heal'); scrItem(); });
}
// 素材：種類・名前・★・個数を列にそろえて
// 素材の使い道（錬成屋の仕組みから）と、どの魔物が落とすか（図鑑で出会った魔物だけ）
const MAT_USE={ore:'武器を鍛える・武器の名品を打つ',crystal:'魔法の武器と装飾品を鍛える・効果を磨く・調合',hide:'防具を鍛える・防具の名品を打つ・調合',bone:'武器と盾の名品を打つ・調合',
  cloth:'魔法の武器と防具の名品を打つ・調合',feather:'装飾品の名品を打つ・調合',curio:'薬などの調合',boss:'名品を打つ・レア度を上げる（昇華）'};
function matSource(n){ const d=dex(); if(MAT[n]&&MAT[n].cat==='boss'){ return n==='記憶の核'?'迷宮の番人が落とす':n==='初代の聖印'?'墓所の主が落とす':'ボスが落とす'; }
  const who=[]; ENEMY_AREAS.forEach(([pl,lv,list])=>list.forEach(e=>{ const raw=e[5]; if(raw&&(MAT_ALIAS[raw]||raw)===n && d.e[e[0]]&&d.e[e[0]].n>0 && !who.includes(e[0])) who.push(e[0]); }));
  return who.length? who.slice(0,2).join('・')+(who.length>2?' など':'')+'が落とす' : ''; }
function matDesc(n){ const M=MAT[n]; const use=n==='記憶の核'?'黄から虹への昇華に使う':MAT_USE[M.cat]||''; const src=matSource(n); return use+(src?`。${src}`:''); }
function scrMat(){
  // 道具の一覧と同じ規格：アイコン・名前（種類と★）・説明・個数
  const mats=Object.keys(G.mats||{}).filter(n=>G.mats[n]>0&&MAT[n]).sort((a,b)=>Object.keys(MATCAT).indexOf(MAT[a].cat)-Object.keys(MATCAT).indexOf(MAT[b].cat)||MAT[a].g-MAT[b].g);
  navHere('mat', scrMat);
  openScreen('素材', `<div class="ptitle"><span>持っている素材（${mats.length}種類）</span><span>錬成の素材 ${G.mat}</span></div><div class="list scroll tight" style="flex:1">${mats.length?mats.map(n=>{ const x=matIcon(n);
      return `<div class="item">${goodIconHTML(x)}<div class="grow"><div><span class="r${x.r>=3?x.r:0}">${n}</span> <span class="tag">${MATCAT[MAT[n].cat]}${MAT[n].cat==='boss'?'':' ★'+MAT[n].g}</span></div><small>${matDesc(n)}</small></div><b class="cnt">×${G.mats[n]}</b></div>`; }).join(''):'<div class="card">まだ持っていない。魔物がときどき落とす</div>'}</div>`);
}
function scrParty(){
  const ns=Object.keys(G.members).filter(n=>G.members[n].avail);
  navHere('party', scrParty);
  openScreen('メンバー入れ替え', `<div class="ptitle"><span>戦うメンバー（4人まで）。アルトは外せない</span><span>${G.party.length}/4</span></div>
  <div class="list scroll">${ns.map(n=>{ const m=G.members[n], s=calcStats(n), on=G.party.includes(n); return `<button class="item ${on?'sel':''}" data-n="${n}" style="text-align:left"><img class="pspr" src="${spriteURL(n,0)}" draggable="false"><div class="grow"><div>${n} <span class="tag">${CHARS[n].role}</span></div><small class="nums">Lv${m.lv}　HP ${m.hp}/${s.hp}　攻${s.atk} 魔${s.mat} 速${s.spd}</small></div><span class="tag slab w3 ${on?'on':''}">${on?'出撃中':'控え'}</span></button>`; }).join('')}</div>
  <div style="font-size:11px;color:var(--sub)">控えの仲間も、経験値を半分もらえる。</div>`);
  $('scrBody').querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{ const n=b.dataset.n; if(n==='アルト'){ toast('アルトは外せない'); return; }
    if(G.party.includes(n)){ G.party=G.party.filter(x=>x!==n); } else { if(G.party.length>=4){ toast('4人までしか出られない'); return; } G.party.push(n); }
    sfx('tick'); scrParty(); });
}
const SORTS=[['r','レア度'],['slot','部位'],['new','新しい順'],['pow','強さ']];
function sortGear(list){ const k=(G.settings.sort||'r'); const so=['weapon','head','body','arm','acc'];
  return list.slice().sort(k==='slot'?(a,b)=>so.indexOf(a.slot)-so.indexOf(b.slot)||b.r-a.r||b.iLv-a.iLv: k==='new'?(a,b)=>(b.isNew?1:0)-(a.isNew?1:0)||b.id-a.id: k==='pow'?(a,b)=>itemPower(b)-itemPower(a): (a,b)=>b.r-a.r||b.iLv-a.iLv); }
function sortBar(){ return `<div class="row">${SORTS.map(([k,l])=>`<button class="cb sm ${(G.settings.sort||'r')===k?'on':''}" data-so2="${k}" style="min-height:30px;font-size:12px">${l}</button>`).join('')}</div>`; }
function bindSort(again){ $('scrBody').querySelectorAll('[data-so2]').forEach(b=>b.onclick=()=>{ G.settings.sort=b.dataset.so2; sfx('tick'); again(); }); }
function scrGear(){
  const list=sortGear(G.gear);
  navHere('gear', scrGear);
  openScreen('装備品の一覧', sortBar()+`<div class="ptitle"><span>持っている装備（だれも装備していないもの）</span><span>${G.gear.length}/300</span></div><div class="list scroll">${list.length?list.map(it=>`<div class="item"><span class="tag slab">${SLOTJP[it.slot]}</span>${itemLine(it)}</div>`).join(''):'<div class="card">なし</div>'}</div><div style="font-size:11px;color:var(--sub)">売る・分解するのは町の武具屋・錬成屋で。</div>`);
  bindSort(scrGear);
}
const UI_THEMES=[['warm','あたたかい色'],['night','夜空'],['dq','黒と白わく']];
function applyTheme(){ const t=(G&&G.settings&&G.settings.theme)||(()=>{try{return localStorage.getItem('mzy_theme')}catch(e){return null}})()||'warm';
  document.body.classList.remove('th-warm','th-dq'); if(t!=='night') document.body.classList.add('th-'+t); try{ localStorage.setItem('mzy_theme',t); }catch(e){} }
setInterval(()=>{ const t=(typeof G!=='undefined'&&G&&G.settings&&G.settings.theme)||'warm'; const want=t==='night'?'':'th-'+t; if(want? !document.body.classList.contains(want) : (document.body.classList.contains('th-warm')||document.body.classList.contains('th-dq'))) applyTheme(); },500);
function scrSetting(){
  const S=G.settings;
  navHere('setting', scrSetting);
  openScreen('設定', `<div class="list">
  <div class="card"><div style="font-weight:700;margin-bottom:6px">戦闘のはやさ（最初の値）</div><div class="row">${[1,2,4].map(v=>`<button class="cb sm ${S.speed===v?'on':''}" data-sp="${v}">×${v}</button>`).join('')}</div></div>
  
  <div class="card"><div style="font-weight:700;margin-bottom:6px">拾ったら自動で売る</div><div class="row"><button class="cb sm ${S.autosell[0]?'on':''}" data-as="0">白</button><button class="cb sm ${S.autosell[1]?'on':''}" data-as="1">青</button></div></div>
  <div class="card"><div style="font-weight:700;margin-bottom:6px">画面の色</div><div class="row">${UI_THEMES.map(t=>`<button class="cb sm ${(S.theme||'warm')===t[0]?'on':''}" data-th="${t[0]}">${t[1]}</button>`).join('')}</div></div>
  <div class="card"><div style="font-weight:700;margin-bottom:6px">音</div><div class="row"><button class="cb sm ${S.sound?'on':''}" data-so="1">オン</button><button class="cb sm ${!S.sound?'on':''}" data-so="0">オフ</button></div></div></div>`);
  $('scrBody').querySelectorAll('[data-sp]').forEach(b=>b.onclick=()=>{S.speed=+b.dataset.sp;scrSetting();});
  $('scrBody').querySelectorAll('[data-as]').forEach(b=>b.onclick=()=>{const i=+b.dataset.as;S.autosell[i]=!S.autosell[i];scrSetting();});
  $('scrBody').querySelectorAll('[data-th]').forEach(b=>b.onclick=()=>{ S.theme=b.dataset.th; applyTheme(); scrSetting(); });
  $('scrBody').querySelectorAll('[data-so]').forEach(b=>b.onclick=()=>{S.sound=b.dataset.so==='1'; if(!S.sound) bgm(null); else bgm(RT.mode==='world'?'world':'field'); scrSetting();});
}
async function doQuit(){
  try{ const s={...G, slot:RT.slot||1, saveLoc:{loc:G.loc,floor:G.floor,x:G.x,y:G.y}}; kvSet('mzy_suspend',JSON.stringify(s)); }catch(e){}
  closeScreen(); toast('中断しました'); await sleep(500); showTitle();
}

// ---------- お店 ----------
function shopLv(){ return Math.max(1, locLv(G.loc)+1); }
async function openShop(kind){
  if(kind==='inn'){ const price=10+avgLv()*6;
    const c=await choose(`宿屋「ひと晩 ${price}G だよ。泊まっていくかい？」`,['泊まる','やめる']);
    if(c!==0) return; if(G.gold<price){ await say('宿屋','お金が足りないみたいだね。'); return; }
    G.gold-=price; await fade(true); sfx('inn'); for(const n in G.members){ const s=calcStats(n); G.members[n].hp=s.hp; } renderTop(); await sleep(700); await fade(false);
    await say('','ぐっすり眠った。みんな元気になった！'); await innChat(); return; }
  if(kind==='item') return shopItems();
  if(kind==='equip') return shopEquip();
  if(kind==='smith') return shopSmith();
}
function shopItems(){
  const ks=Object.keys(ITEMS).filter(k=>ITEMS[k].ch<=G.chapter&&!ITEMS[k].noShop);
  openScreen('道具屋', `<div class="ptitle"><span>何にするかい？</span><span style="color:var(--gold)">${G.gold.toLocaleString()}G</span></div><div class="list scroll">${ks.map(k=>`<div class="item">${goodIconHTML(toolIcon(k))}<div class="grow"><div>${ITEMS[k].n} <span class="tag">${ITEMS[k].price}G</span></div><small>${ITEMS[k].d}　持っている：${G.inv[k]||0}</small></div><button class="cb sm" data-b="${k}" data-q="1">1</button><button class="cb sm" data-b="${k}" data-q="5">5</button></div>`).join('')}</div>`);
  $('scrBody').querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{ const k=b.dataset.b,q=+b.dataset.q,p=ITEMS[k].price*q; if(G.gold<p){ toast('お金が足りない'); return; } G.gold-=p; G.inv[k]=(G.inv[k]||0)+q; sfx('buy'); G.shopBuys=(G.shopBuys||0)+1; if(G.shopBuys===5 && G.chapter>=1) toast('道具屋「お得意さんだね。ハルトの旅の商人さんも、よく買っていくよ」'); shopItems(); });
}
function shopEquip(tab){
  tab=tab||'buy'; const L=shopLv();
  if(!RT.shopStock||RT.shopStock.loc!==G.loc||RT.shopStock.lv!==L){
    RT.shopStock={loc:G.loc,lv:L,items:(()=>{ const no={mei:false}, p1=makeItem('weapon',L,0,'p',no); let p2=makeItem('weapon',L,0,'p',no); for(let i=0;i<4&&p2.ty===p1.ty;i++) p2=makeItem('weapon',L,0,'p',no); return [p1,p2,makeItem('weapon',L,0,'m',no),makeItem('head',L,0,undefined,no),makeItem('body',L,0,undefined,no),makeItem('arm',L,0,undefined,no),makeItem('acc',L,0,undefined,no)]; })()};
    RT.shopStock.items.forEach(x=>x.isNew=false);
  }
  const head=`<div class="row"><button class="cb sm ${tab==='buy'?'on':''}" id="tBuy">買う</button><button class="cb sm ${tab==='sell'?'on':''}" id="tSell">売る</button></div><div class="ptitle"><span>${tab==='buy'?'この町の装備（白）':'持っている装備'}</span><span style="color:var(--gold)">${G.gold.toLocaleString()}G</span></div>`;
  if(tab==='buy'){
    const its=RT.shopStock.items;
    const who=it=>{ const sl=it.slot==='acc'?'acc1':it.slot; return G.party.map(n=>{ const m=G.members[n]; const bf=calcStats(n); const o=m.equip[sl]; m.equip[sl]=it; const af=calcStats(n); m.equip[sl]=o; const k=it.slot==='weapon'?(CHARS[n].wpn==='mag'?'mat':'atk'):it.slot==='acc'?'hp':'def'; const d=af[k]-bf[k]; return `<span class="wn">${n}</span><span class="ws">${STJP[k]}</span><b class="${d>0?'up':d<0?'dn':''}" style="${d?'':'color:var(--sub)'}">${d>0?'+':''}${d}</b>`; }).join(''); };
    openScreen('武具屋', head+`<div class="list scroll">${its.map((it,i)=>`<div class="item shopw"><span class="tag slab">${SLOTJP[it.slot]}</span>${itemLine(it)}<button class="cb sm pbtn" data-i="${i}">${(sellPrice(it)*4).toLocaleString()}G</button><div class="whog">${who(it)}</div></div>`).join('')}</div>`);
    $('scrBody').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ const it=its[+b.dataset.i], p=sellPrice(it)*4; if(G.gold<p){toast('お金が足りない');return;} G.gold-=p; const cp=JSON.parse(JSON.stringify(it)); cp.id=G.nid++; cp.isNew=true; G.gear.push(cp); sfx('buy'); toast(it.name+' を買った'); shopEquip('buy'); });
  } else {
    const list=G.gear.slice().sort((a,b)=>a.r-b.r||a.iLv-b.iLv);
    openScreen('武具屋', head+`<div class="list scroll">${list.map((it,i)=>`<div class="item"><span class="tag slab">${SLOTJP[it.slot]}</span>${itemLine(it)}<button class="cb sm pbtn" data-s="${i}">${sellPrice(it).toLocaleString()}G</button></div>`).join('')||'<div class="card">売れる装備がない</div>'}</div><button class="cb sm" id="sellWB">白と青をまとめて売る</button>`);
    $('scrBody').querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{ const it=list[+b.dataset.s]; if(it.r>=3 && !confirmSell(it)) return; G.gold+=sellPrice(it); G.gear=G.gear.filter(x=>x!==it); sfx('buy'); shopEquip('sell'); });
    $('sellWB').onclick=()=>{ let g=0; G.gear=G.gear.filter(x=>{ if(x.r<=1){ g+=sellPrice(x); return false;} return true; }); G.gold+=g; toast(`${g.toLocaleString()}G で売った`); shopEquip('sell'); };
  }
  $('tBuy').onclick=()=>shopEquip('buy'); $('tSell').onclick=()=>shopEquip('sell');
}
function confirmSell(it){ if(RT.sellConfirm===it) return true; RT.sellConfirm=it; toast('レア装備です。もう一度押すと確定'); return false; }
const MATS=[1,3,8,20,50], RRMAT=[0,2,5,12,30];
function shopSmith(tab, it, sel){
  tab=tab||'forge'; navHere(it?'smithD':'smith', ()=>shopSmith(tab,it,sel));
  const TABS=[['forge','鍛える'],['polish','磨く'],['reroll','振り直し'],['ascend','昇華'],['craft','鍛造'],['mix','調合'],['break','分解']];
  const head=`<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${TABS.map(([k,l])=>`<button class="cb sm ${tab===k?'on':''}" data-tab="${k}">${l}</button>`).join('')}</div><div class="ptitle"><span>錬成の素材 ${G.mat}</span><span style="color:var(--gold)">${G.gold.toLocaleString()}G</span></div>`;
  const all=[...G.gear, ...Object.keys(G.members).filter(n=>G.members[n].avail).flatMap(n=>SLOTS.map(sl=>G.members[n].equip[sl]).filter(Boolean))];
  const bind=()=>{ $('scrBody').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{ sfx('tick'); shopSmith(b.dataset.tab); }); };
  const pick=(desc,list,next)=>{ openScreen('錬成屋', head+`<div style="font-size:12px;color:var(--sub)">${desc}</div><div class="list scroll">${list.map((x,i)=>`<button class="item" data-i="${i}" style="text-align:left">${itemLine(x)}</button>`).join('')||'<div class="card">対象の装備がない</div>'}</div>`); bind(); $('scrBody').querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{ sfx('ok'); next(list[+b.dataset.i]); }); };
  const need=(rows)=>rows.map(([lab,have,want])=>`<div style="display:flex;justify-content:space-between;font-size:13px"><span>${lab}</span><b class="nums" style="color:${have>=want?'#86efac':'#fca5a5'}">${have.toLocaleString()} / ${want.toLocaleString()}</b></div>`).join('');
  const detail=(title,body,btn,ok,act)=>{ openScreen('錬成屋', head+`<div class="card il">${itemLine(it)}</div><div class="card"><div style="font-weight:700;margin-bottom:6px">${title}</div>${body}</div><button class="cb ${ok?'':'dis'}" id="smGo" style="${ok?'background:#24407a;border-color:#4b6fd1':''}">${btn}</button>`); bind(); $('smGo').onclick=()=>{ if(!ok){ toast('素材かお金が足りない'); return; } act(); }; };
  if(tab==='break'){
    const list=G.gear.slice().sort((a,b)=>a.r-b.r);
    openScreen('錬成屋', head+`<div style="font-size:12px;color:var(--sub)">いらない装備を「錬成の素材」にする（白1・青3・紫8・黄20・虹50）</div><div class="list scroll">${list.map((x,i)=>`<div class="item">${itemLine(x)}<button class="cb sm pbtn" data-b="${i}">分解 +${MATS[x.r]}</button></div>`).join('')||'<div class="card">分解できる装備がない</div>'}</div>`);
    bind(); $('scrBody').querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{ const x=list[+b.dataset.b]; if(x.r>=3&&!confirmSell(x)) return; G.mat+=MATS[x.r]; G.gear=G.gear.filter(y=>y!==x); sfx('buy'); shopSmith('break'); });
    return;
  }
  if(tab==='mix'){
    openScreen('錬成屋', head+`<div style="font-size:12px;color:var(--sub)">魔物の素材から、道具を作る</div><div class="list scroll">${MIX.map((R,i)=>{ const ok=R.need.every(([c,g,k])=>matCount(c,g)>=k);
      return `<div class="item">${R.out==='mat'?'<span class="ico none">素材</span>':goodIconHTML(toolIcon(R.out))}<div class="grow"><div>${ITEMS[R.out]?ITEMS[R.out].n:'錬成の素材'} ×${R.k}</div><small>${R.need.map(([c,g,k])=>`${MATCAT[c]}${g>1?'★'+g+'以上':''}×${k}（${matCount(c,g)}）`).join('・')}</small></div><button class="cb sm ${ok?'':'dis'}" data-m="${i}">作る</button></div>`; }).join('')}</div>`);
    bind(); $('scrBody').querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{ const R=MIX[+b.dataset.m]; if(!R.need.every(([c,g,k])=>matCount(c,g)>=k)){ toast('素材が足りない'); return; }
      for(const [c,g,k] of R.need) matTake(c,g,k); if(R.out==='mat') G.mat+=R.k; else G.inv[R.out]=(G.inv[R.out]||0)+R.k; sfx('buy'); toast(`${R.out==='mat'?'錬成の素材':ITEMS[R.out].n} ×${R.k} を作った`); shopSmith('mix'); });
    return;
  }
  if(tab==='craft'){
    const lv=avgLv(), list=MEIHIN.map((M,i)=>({M,i})).filter(({M})=>!M.top && M.lv<=lv+8);
    if(!it){
      openScreen('錬成屋', head+`<div style="font-size:12px;color:var(--sub)">ボスの素材と魔物の素材で、名品を打つ。できあがりのレア度は運しだい</div><div class="list scroll">${list.map(({M,i})=>{ const R=craftRecipe(M), ok=craftOk(R);
        return `<button class="item" data-c="${i}" style="text-align:left"><div class="grow"><div>${M.nm} <span class="tag">${TYJP[M.ty]}</span><span class="tag">Lv${M.lv}〜</span></div><small>${R.boss}×1・${MATCAT[R.main]}×${R.mainK}・${MATCAT[R.sub]}×${R.subK}・${R.gold.toLocaleString()}G</small></div><b style="color:${ok?'#86efac':'var(--sub)'}">${ok?'作れる':''}</b></button>`; }).join('')||'<div class="card">まだ作れる名品がない</div>'}</div>`);
      bind(); $('scrBody').querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{ sfx('ok'); shopSmith('craft', {mi:+b.dataset.c}); });
      return;
    }
    const M=MEIHIN[it.mi], R=craftRecipe(M), ok=craftOk(R);
    openScreen('錬成屋', head+`<div class="card"><div style="font-weight:700">${M.nm} <span class="tag">${TYJP[M.ty]}</span></div><small style="color:var(--sub)">素の強さが同じ種類の${Math.round((M.x-1)*100)}%上の名品${(M.imp||[]).length?'。'+M.imp.map(([k,a])=>afText({k,v:a})).join('・'):''}</small></div><div class="card">${need([[R.boss,matHave(R.boss),1],[MATCAT[R.main]+(R.g>1?'★'+R.g+'以上':''),matCount(R.main,R.g),R.mainK],[MATCAT[R.sub]+(R.g>1?'★'+R.g+'以上':''),matCount(R.sub,R.g),R.subK],['お金',G.gold,R.gold]])}<div style="font-size:12px;color:var(--sub);margin-top:6px">できあがり：白〜黄（まれに黄）。レベルはLv${craftLv(M)}</div></div><button class="cb ${ok?'':'dis'}" id="smGo" style="${ok?'background:#24407a;border-color:#4b6fd1':''}">打つ</button>`);
    bind(); $('smGo').onclick=()=>{ if(!craftOk(R)){ toast('素材かお金が足りない'); return; }
      matTakeName(R.boss,1); matTake(R.main,R.g,R.mainK); matTake(R.sub,R.g,R.subK); G.gold-=R.gold;
      const x=Math.random(), r= x<0.03?3: x<0.15?2: x<0.45?1:0; const g=M.g; const out=makeItem(g==='wp'||g==='wm'?'weapon':g, craftLv(M), r, g==='wm'?'m':g==='wp'?'p':undefined, {meiIdx:it.mi}); gainItem(out);
      sfx(r>=3?'rare':'buy'); toast(`${out.name}（${RARJP[r]}）を打ち上げた！`); shopSmith('craft'); };
    return;
  }
  if(tab==='reroll'){
    if(!it) return pick('ランダムな効果を1つ選んで、種類ごと振り直す。最初に選んだ効果しか、それ以降は振り直せない。', all.filter(x=>x.af.length).sort((a,b)=>b.r-a.r), x=>shopSmith('reroll',x));
    const cost=it.iLv*25*(it.r+1), mc=RRMAT[it.r];
    openScreen('錬成屋', head+`<div class="card il">${itemLine(it)}</div><div class="ptitle"><span>どの効果を振り直す？</span><span>${cost.toLocaleString()}G＋錬成の素材${mc}</span></div><div class="list">${it.af.map((a,i)=>{ const ok=it.rr===undefined||it.rr===i; return `<button class="item ${ok?'':'cb dis'}" data-a="${i}">${afHTML(a)}${it.rr===i?' <span class="tag">固定</span>':''}</button>`; }).join('')}</div>`);
    bind(); $('scrBody').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.a; if(it.rr!==undefined&&it.rr!==i) return; if(G.gold<cost||G.mat<mc){ toast('お金か素材が足りない'); return; }
      G.gold-=cost; G.mat-=mc; it.rr=i; const ex=it.af.filter((_,j)=>j!==i).map(a=>a.k); it.af[i]=rollAffix(it,ex); sfx('rare'); toast('→ '+afText(it.af[i])+(it.af[i].q>=1.3?'（最高の出来！）':it.af[i].q>=1?'（良い出来）':'')); Object.keys(G.members).forEach(clampHpMp); shopSmith('reroll',it); });
    return;
  }
  if(tab==='polish'){
    if(!it) return pick('効果の種類はそのままに、数値だけを磨き直す。高いレア度ほど良い値が出やすい。', all.filter(x=>x.af.length).sort((a,b)=>b.r-a.r), x=>shopSmith('polish',x));
    const cost=it.iLv*10*(it.r+1), g=Math.max(1,gradeOf(it.iLv)-1), mk=1+Math.floor(it.r/2);
    openScreen('錬成屋', head+`<div class="card il">${itemLine(it)}</div><div class="ptitle"><span>どの効果を磨く？</span><span>${cost.toLocaleString()}G＋結晶${g>1?'★'+g+'以上':''}×${mk}（${matCount('crystal',g)}）</span></div><div class="list">${it.af.map((a,i)=>`<button class="item" data-a="${i}">${afHTML(a)}</button>`).join('')}</div>`);
    bind(); $('scrBody').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.a; if(G.gold<cost||matCount('crystal',g)<mk){ toast('お金か素材が足りない'); return; }
      G.gold-=cost; matTake('crystal',g,mk); const a=it.af[i]; const old=a.v; const n=rollAffixValue(it,a.k); a.v=n.v; a.q=n.q; sfx(a.q>=1.3?'rare':'buy'); toast(`${afText(a)}（${old}→${a.v}）${a.q>=1.3?' 最高の出来！':a.q>=1?' 良い出来':''}`); Object.keys(G.members).forEach(clampHpMp); shopSmith('polish',it); });
    return;
  }
  if(tab==='ascend'){
    if(!it) return pick('レア度を1つ上げる。成功すると効果が増え、素の強さも上がる。失敗すると素材だけ失う。', all.filter(x=>x.r<4&&x.legend===undefined).sort((a,b)=>b.r-a.r), x=>shopSmith('ascend',x));
    const A=ASCEND[it.r], bossHave=matCountBoss(A.core);
    const ok=G.mat>=A.mat && G.gold>=A.gold && (!A.boss||bossHave>=A.boss);
    detail(`${RARJP[it.r]} → ${RARJP[it.r+1]}　成功 ${A.rate}%`, need([['錬成の素材',G.mat,A.mat],...(A.boss?[[A.core?'記憶の核':'ボスの素材（どれでも）',bossHave,A.boss]]:[]),['お金',G.gold,A.gold]])+`<div style="font-size:12px;color:var(--sub);margin-top:6px">失敗すると、使った素材とお金はなくなる（装備は残る）</div>`, '昇華する', ok, ()=>{
      G.mat-=A.mat; G.gold-=A.gold; if(A.boss) matTakeBoss(A.core,A.boss);
      if(Math.random()*100<A.rate){ ascendItem(it); sfx(it.r>=4?'rainbow':'rare'); toast(`成功！ ${RARJP[it.r]}になった`); }
      else { sfx('back'); toast('失敗……素材は砕け散った'); }
      Object.keys(G.members).forEach(clampHpMp); shopSmith('ascend',it.r<4?it:undefined); });
    return;
  }
  // 鍛える
  if(!it) return pick('装備を鍛えて、素の強さを上げる（+1ごとに4%、最大+5）。+2から先は、失敗すると1段階下がる。まれに大成功で2段階上がる。', all.filter(x=>(x.plus||0)<5).sort((a,b)=>b.r-a.r||b.iLv-a.iLv), x=>shopSmith('forge',x));
  const p=it.plus||0, F=forgeCost(it), rate=FORGE_RATE[p];
  detail(`+${p} → +${p+1}　成功 ${rate}%`, need([[MATCAT[F.cat]+(F.g>1?'★'+F.g+'以上':''),matCount(F.cat,F.g),F.k],['お金',G.gold,F.gold]])+`<div style="font-size:12px;color:var(--sub);margin-top:6px">${p>=1?'失敗すると +'+(p-1)+' に下がる。':'失敗しても下がらない。'}大成功（5%）なら+2</div>`, '鍛える', matCount(F.cat,F.g)>=F.k && G.gold>=F.gold, ()=>{
    matTake(F.cat,F.g,F.k); G.gold-=F.gold;
    const x=Math.random()*100;
    if(x<5 && p<4){ it.plus=p+2; sfx('rare'); toast(`大成功！ +${it.plus}`); }
    else if(x<rate){ it.plus=p+1; sfx('lvup'); toast(`成功 +${it.plus}`); }
    else { if(p>=1) it.plus=p-1; sfx('back'); toast(p>=1?`失敗…… +${it.plus}に下がった`:'失敗……'); }
    Object.keys(G.members).forEach(clampHpMp); shopSmith('forge', (it.plus||0)<5?it:undefined); });
}
// 鍛える：+1〜+5 の成功率。素材は部位で決まる（武器は鉱石、魔法の武器と装飾は結晶、防具は皮・鱗）
const FORGE_RATE=[100,85,65,45,30];
function forgeCost(it){ const cat= it.slot==='weapon'? (it.kind==='m'?'crystal':'ore') : it.slot==='acc'?'crystal':'hide'; const p=it.plus||0; return {cat, g:Math.max(1,gradeOf(it.iLv)-1), k:2+p, gold:it.iLv*15*(p+1)}; }
// 昇華：レア度+1。黄→虹は迷宮の番人の「記憶の核」が要る
const ASCEND=[{rate:90,mat:2,gold:200},{rate:75,mat:6,gold:800},{rate:50,mat:15,gold:3000,boss:1},{rate:20,mat:40,gold:12000,boss:2,core:1}];
function ascendItem(it){ const o=it.r, n=o+1; for(const k in it.base) if(it.base[k]>0) it.base[k]=Math.round(it.base[k]/(RMUL[o]||1)*RMUL[n]); it.r=n;
  const want=[[0,0],[1,2],[2,3],[3,4],[4,4]][n][0]; while(it.af.length<want) it.af.push(rollAffix(it,it.af.map(a=>a.k)));
  if(n===4 && !it.u){ it.u=pick(UNIQ).k; } dexItem(it); }
// 鍛造：名品ごとのレシピ。ボスの素材＋魔物の素材
const BOSS_LV=(()=>{ const a=[]; for(const id in LOCS){ const L=LOCS[id]; if(L.boss!==undefined && !L.post) a[L.boss]=ENEMY_AREAS[L.area][1]; } return a; })();
function craftRecipe(M){ let bi=0; for(let i=0;i<BOSS_MAT.length;i++) if(BOSS_MAT[i] && BOSS_LV[i]!==undefined && BOSS_LV[i]<=M.lv) bi=i;
  const main={wp:'ore',wm:'crystal',body:'hide',head:'hide',arm:'hide',acc:'crystal'}[M.g], sub={wp:'bone',wm:'cloth',body:'cloth',head:'cloth',arm:'bone',acc:'feather'}[M.g];
  return {boss:BOSS_MAT[bi], main, sub, mainK:4, subK:2, g:Math.max(1,gradeOf(M.lv)-1), gold:M.lv*60}; }
function craftOk(R){ return matHave(R.boss)>=1 && matCount(R.main,R.g)>=R.mainK && matCount(R.sub,R.g)>=R.subK && G.gold>=R.gold; }
function craftLv(M){ return Math.max(M.lv, Math.min(avgLv(), M.lv+12)); }
// 調合：魔物の素材から道具を作る
const MIX=[
  {out:'feather', k:1, need:[['feather',1,3]]},
  {out:'rope', k:1, need:[['cloth',1,4]]},
  {out:'holy', k:2, need:[['crystal',1,2]]},
  {out:'herb2', k:2, need:[['curio',1,3]]},
  {out:'herb3', k:1, need:[['curio',3,3],['crystal',3,2]]},
  {out:'bN1', k:1, need:[['cloth',2,3],['bone',1,2]]},
  {out:'bP1', k:1, need:[['cloth',2,3],['crystal',2,2]]},
  {out:'bA1', k:1, need:[['cloth',3,3],['curio',2,3],['crystal',3,2]]},
  {out:'mat', k:3, need:[['bone',1,2],['hide',1,2]]},
];

// ---------- 図鑑 ----------
const NOAH_PAGE=[[10,'みんなの名前、ここに書いておくね。わすれないように。'],[25,'アルトは、だまってるけど、いちばん先に走っていく。'],[40,'リリィは、ときどき、もう知ってるみたいな顔をする。'],
  [55,'わたしが生き返らせた人たちは、みんな、ちょっとだけ悲しそうだった。'],[70,'死ぬって、こわいことじゃないのかもしれない。終わるから、大事になるんだ。'],[85,'もし、わたしがいなくなっても、このページは残るかな。'],[100,'アルト。リリィ。みんな。……ありがとう。ちゃんと、ここにいたよ。　――ノア']];
function dexAllEnemies(){ const out=[]; const seen=new Set();
  ENEMY_AREAS.forEach(([place,lv,list])=>list.forEach(([nm,tp,w,r,feat,drop])=>{ if(seen.has(nm)) return; seen.add(nm); out.push({nm,place,w,r,feat,drop}); }));
  BOSS_LIST.forEach(([ch,nm,place,w,feat],i)=>{ if(seen.has(nm)) return; seen.add(nm); const D=BOSSDEF[i]||{}; out.push({nm,place,w,r:'―',feat,boss:1,sh:D.sh,col:D.col}); });
  MAZE_BOSS.forEach(M=>out.push({nm:M.nm,place:'記憶の迷宮',w:M.w,r:'―',feat:'欠片の番人',boss:1,maze:1,sh:M.sh,col:M.col}));
  return out; }
function dexRate(){ const d=dex(), all=dexAllEnemies(); const es=all.filter(x=>d.e[x.nm]&&d.e[x.nm].n>0).length/all.length; const ls=Object.keys(d.L).length/12; return Math.floor(100*(es*0.5+ls*0.25+Math.min(12,G.frag)/12*0.25)); }
// 前のセーブはレア度だけを残していたので、名前から種類と段階を探す
let DEX_NAME_MAP=null;
function dexItemInfo(n,v){ if(v && typeof v==='object' && v.ty) return v; const r=typeof v==='number'?v:(v&&v.r)||0;
  if(!DEX_NAME_MAP){ DEX_NAME_MAP={}; for(const g in ITYPE) for(const T of ITYPE[g]) (T.n||[]).forEach((nm,t)=>{ DEX_NAME_MAP[nm]={ty:T.id,t}; }); for(const M of MEIHIN) DEX_NAME_MAP[M.nm]={ty:M.ty,t:tierOf(M.lv||1),sp:M.top?'dawn':'mei'}; }
  let f=DEX_NAME_MAP[n];
  if(!f){ const tail=n.replace(/^.*の/,''); for(const g in ITYPE){ for(const T of ITYPE[g]){ const t=(T.n||[]).findIndex(nm=>nm.replace(/^.*の/,'')===tail); if(t>=0){ f={ty:T.id,t}; break; } } if(f) break; } }
  return {r, ...(f||{ty:'ring',t:0})}; }
function scrDex(tab){
  const d=dex(); const all=dexAllEnemies(); const seenN=all.filter(x=>d.e[x.nm]&&d.e[x.nm].n>0).length;
  const tabs=`<div class="row">${[['e','敵'],['i','装備'],['m','素材'],['f','欠片'],['p','最後のページ']].map(([k,l])=>`<button class="cb sm ${tab===k?'on':''}" data-dt="${k}" style="font-size:12px;white-space:nowrap;padding:6px 2px">${l}</button>`).join('')}</div>`;
  let body='';
  // 図鑑は「出会った・手に入れた」ものだけが載る（まだのものの数や場所は見せない）
  if(tab==='e'){
    const seen=all.filter(x=>d.e[x.nm]&&d.e[x.nm].n>0);
    body=`<div class="ptitle"><span>出会った敵</span><span>${seen.length}種類</span></div><div class="list scroll">${seen.map(x=>{ const r=d.e[x.nm];
      return `<div class="item dexe${x.boss?' boss':''}"><img class="ico eico${x.boss?' r3':''}" src="${enemyIconURL(x)}" alt=""><div class="grow"><div>${x.nm}</div>
        <small>弱点 <b style="color:${r.w?'#fca5a5':'var(--sub)'}">${r.w?x.w:'？'}</b>　耐性 <b style="color:${r.r?'#93c5fd':'var(--sub)'}">${x.r==='―'?'―':(r.r?x.r:'？')}</b>${x.feat?'　'+x.feat:''}</small>
        <small>${x.maze?'記憶の迷宮':x.place}${x.drop&&x.drop!=='―'?'　落とす物：'+(MAT_ALIAS[x.drop]||x.drop):''}</small></div><small class="cnt" style="flex-basis:3.4em">×${r.n}</small></div>`; }).join('')||'<div class="card">まだ、だれとも戦っていない</div>'}</div>`;
  } else if(tab==='m'){
    // 敵・装備と同じ並び：アイコンの横に名前と種類、下に説明。右は今までに手に入れた数
    const dm=dexMats(), order=Object.keys(MATCAT), got=Object.keys(MAT).filter(n=>dm[n]).sort((a,b)=>order.indexOf(MAT[a].cat)-order.indexOf(MAT[b].cat)||MAT[a].g-MAT[b].g);
    body=`<div class="ptitle"><span>見つけた素材</span><span>${got.length}種類</span></div><div class="list scroll tight">${got.map(n=>{ const x=matIcon(n);
      return `<div class="item">${goodIconHTML(x)}<div class="grow"><div><span class="r${x.r>=3?x.r:0}">${n}</span> <span class="tag">${MATCAT[MAT[n].cat]}${MAT[n].cat==='boss'?'':' ★'+MAT[n].g}</span></div><small>${matDesc(n)}</small></div><small class="cnt" style="flex-basis:3.4em">×${dm[n]}</small></div>`; }).join('')||'<div class="card">まだ見つけていない</div>'}</div>`;
  } else if(tab==='i'){
    // 装備も、道具や素材と同じ並び：アイコン・名前・種類と一番高いレア度
    const got=LEGENDS.map((L,k)=>({L,k})).filter(({k})=>d.L[k]);
    const rows=Object.keys(d.i).filter(n=>!LEGENDS.some(L=>L.nm===n)).map(n=>({n,...dexItemInfo(n,d.i[n])})).sort((a,b)=>b.r-a.r||(a.ty||'').localeCompare(b.ty||'')||a.n.localeCompare(b.n));
    const icon=(x)=>`<img class="ico r${x.r}" src="${iconURL(x.ty||'ring',x.t||0,x.sp||'')}" alt="">`;
    body=`<div class="list scroll">${got.length?`<div class="ptitle"><span>伝説の装備</span><span>${got.length}種類</span></div>${got.map(({L})=>`<div class="item">${`<img class="ico r4" src="${iconURL(L.ty||ICON_SLOT_DEF[L.slot]||'ring',8,'legend')}" alt="">`}<div class="grow"><div class="r4">${L.nm}</div><small style="white-space:normal">${L.lore}</small></div></div>`).join('')}`:''}
      <div class="ptitle"${got.length?' style="margin-top:6px"':''}><span>拾った装備</span><span>${rows.length}種類</span></div>
      ${rows.map(x=>`<div class="item">${icon(x)}<div class="grow"><div class="r${x.r}">${x.n}</div><small>${TYJP[x.ty]||SLOTJP[x.slot]||'装備'}　いちばん良かったのは ${RARJP[x.r]}</small></div></div>`).join('')||'<div class="card">まだ拾っていない</div>'}</div>`;
  } else if(tab==='f'){
    const n=Math.min(FRAG_SCENES.length,G.frag||0);
    body=`<div class="ptitle"><span>虚の欠片</span><span>${n}こ</span></div><div class="list scroll">${FRAG_SCENES.slice(0,n).map((s,k)=>`<div class="item" style="padding:10px;display:block"><small style="color:var(--gold)">欠片 ${k+1}</small><div style="font-size:13px;line-height:1.7;margin-top:2px">${s}</div></div>`).join('')||'<div class="card">まだ、何も見つけていない</div>'}</div>`;
  } else {
    const rate=dexRate(); const lines=NOAH_PAGE.filter(([p])=>rate>=p);
    body=`<div class="ptitle"><span>図鑑の完成度</span><span>${rate}%</span></div><div class="card scroll" style="flex:1;overflow-y:auto;background:#f4ecd8;color:#3b2f1e;font-family:'Hiragino Mincho ProN',serif;line-height:2;font-size:14px;padding:16px">
      ${lines.length?lines.map(([p,s])=>`<div style="margin-bottom:10px">${s}</div>`).join(''):'<div style="color:#8a7a60">まだ、何も書かれていない。</div>'}
      ${lines.length<NOAH_PAGE.length?'<div style="color:#b3a385;font-size:12px;margin-top:8px">……図鑑を埋めると、書き込みが増えていく。</div>':''}</div>`;
  }
  navHere('dex', ()=>scrDex(tab)); openScreen('図鑑', tabs+body);
  $('scrBody').querySelectorAll('[data-dt]').forEach(b=>b.onclick=()=>{ sfx('tick'); scrDex(b.dataset.dt); });
}
// ---------- 世界地図 ----------
function openMenuFromWorld(){ openMenu(); }

async function travelTo(id){
  if(RT.busy) return; RT.busy=true; hidePanel(); RT.worldSel=null;
  if(id==='maze'){ const n=Math.min(G.frag,11);
    if(G.frag>0){ const opts=[]; for(let k=0;k<=n;k++) opts.push(`第${k+1}の迷宮　${G.flags['boss_maze_'+k]?MAZE_BOSS[k].nm:'？？？'}`); opts.push('やめる');
      const c=await choose('どの記憶に入る？', opts, 1); if(c===opts.length-1){ RT.busy=false; openWorld(); return; } G.flags.mazeNo=c; }
    else G.flags.mazeNo=0; }
  if(id==='maze'){
    if(!G.flags.mazeRule3){ G.flags.mazeRule3=1; await say('','記憶の迷宮は、入るたびに形が変わる。\n中では記録を残せず、階段は下りの一方通行だ。'); await say('','見つけた物は、外へ持ち帰ってはじめて自分のものになる。\n倒れると、すべて消えてしまう。'); await say('','階段では「深く潜る」か「持ち帰る」かを選べる。\n深いほど敵は強く、良い物と記憶のかけらが増える。'); await say('','ひとつの階に長くとどまると、記憶が薄れていく。\n何も見つからなくなり、魔物は強くなる一方だ。'); await say('','最奥には番人がいる。手前の泉で傷を癒やせる。\n番人を倒せば、すべてを持ち帰れる。'); }
    G.inMaze=0; G.mazeLoot=0; G.mazePot=0; G.mazeFF=0; doSave(true); toast('迷宮に入る前に、自動で記録した'); G.inMaze=1;
    G.mazeEntry=(G.mazeEntry||0)+1; }
  const first=!G.visited[id];
  G.loc=id;
  if(first && G.chapter>=1 && Math.random()<0.6 && !LOCS[id].post){ await say('','道中で魔物に出会った！'); const ar=LOCS[id].area; const r=await randomBattle(ar,id,{lv:Math.min(ENEMY_AREAS[ar][1],avgLv())}); if(r==='lose'){ RT.busy=false; return; } RT.mode='world'; }
  await arrive(id); RT.busy=false;
}
