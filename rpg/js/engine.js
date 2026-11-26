// 自動で進む戦闘の決まり（画面に触れない部分。ブラウザでもnodeでも動く）
// 1人に 通常攻撃・アクティブ・パッシブ2つ。通常攻撃でゲージがたまり、満タンでアクティブが自動で出る。
// パッシブは、味方や敵の動きに反応して働く（ここが組み合わせの面白さ）。
(function (root) {
"use strict";

// ---------- 技の中身 ----------
// N=通常攻撃 A=アクティブ P=パッシブ
const SKILLS = {
  // 剣士
  slash:   {k:"N", nm:"踏み込み",   ds:"前の敵1体を斬る", hit:{pow:1.0}},
  triple:  {k:"A", nm:"三段斬り",   ds:"1体を3回斬る。印のある敵を先に狙う", hit:{pow:0.72, times:3, prefer:"mark"}},
  tailwind:{k:"P", nm:"追い風",     ds:"味方がアクティブを使うたび、自分のゲージ＋20"},
  finisher:{k:"P", nm:"とどめの構え", ds:"印のある敵には、会心が出やすい（＋40%）"},
  // 盾
  bash:    {k:"N", nm:"盾打ち",     ds:"1体を打ち、2回だけ自分が狙われやすくなる", hit:{pow:0.8}, taunt:2},
  bulwark: {k:"A", nm:"守りの陣",   ds:"前列の味方に、最大体力の30%の守り。後列には15%", guard:[0.30,0.15]},
  parry:   {k:"P", nm:"受け流し",   ds:"守りで攻撃を受けきったとき、その敵に反撃する"},
  stand:   {k:"P", nm:"不屈",       ds:"体力が3割を切ると、受けるダメージが4割減る"},
  // 魔術師
  ember:   {k:"N", nm:"火の粉",     ds:"1体に火の魔法。半分の確率で火傷にする", hit:{pow:0.95, mag:1, burn:0.5}},
  inferno: {k:"A", nm:"業火",       ds:"敵全体に火の魔法。全員を火傷にする", hit:{pow:1.05, mag:1, all:1, burn:1}},
  spread:  {k:"P", nm:"燃え広がり", ds:"火傷の敵へのダメージ＋35%（味方全員）"},
  embers:  {k:"P", nm:"残り火",     ds:"敵が倒れるたび、自分のゲージ＋30"},
  // 弓
  pierce:  {k:"N", nm:"射抜く",     ds:"1体を射って印を付ける（後列からでも弱まらない）", hit:{pow:1.0, mark:2}, ranged:1},
  rain:    {k:"A", nm:"雨の矢",     ds:"敵全体を射る。印のある敵には2倍", hit:{pow:0.8, all:1, markx:2}, ranged:1},
  signal:  {k:"P", nm:"狩りの合図", ds:"印のある敵が倒れると、味方全員のゲージ＋15"},
  first:   {k:"P", nm:"先手",       ds:"戦いの始めにゲージ＋50"},
  // 敵
  bite:    {k:"N", nm:"かみつく",   hit:{pow:1.0}},
  claw:    {k:"N", nm:"ひっかく",   hit:{pow:0.9}},
  club:    {k:"N", nm:"こん棒",     hit:{pow:1.1}},
  spore:   {k:"A", nm:"胞子",       hit:{pow:0.6, all:1, mag:1}},
  smash:   {k:"A", nm:"たたきつぶす", hit:{pow:2.0}},
  roar:    {k:"A", nm:"雄たけび",   hit:{pow:0.7, all:1}},
};

// ---------- 仲間（仮の4人） ----------
const HEROES = [
  {id:"h1", nm:"レオン", img:"person_001", row:0, hp:118, atk:27, def:12, mat:8,  mdf:9,  spd:13, crit:8,  sk:["slash","triple","tailwind","finisher"]},
  {id:"h2", nm:"アデラ", img:"person_006", row:0, hp:150, atk:19, def:18, mat:8,  mdf:13, spd:9,  crit:5,  sk:["bash","bulwark","parry","stand"]},
  {id:"h3", nm:"カイン", img:"person_032", row:1, hp:84,  atk:9,  def:8,  mat:28, mdf:15, spd:11, crit:6,  sk:["ember","inferno","spread","embers"]},
  {id:"h4", nm:"ミレイ", img:"person_017", row:1, hp:92,  atk:23, def:9,  mat:10, mdf:10, spd:15, crit:10, sk:["pierce","rain","signal","first"]},
];

// ---------- 敵の群れ ----------
const FOES = {
  bat:    {nm:"夜コウモリ",   img:"monster_002", hp:70,  atk:26, def:6,  mat:6, mdf:6,  spd:14, sk:["bite"]},
  dog:    {nm:"骨の犬",       img:"monster_006", hp:95,  atk:30, def:9,  mat:5, mdf:5,  spd:11, sk:["bite"]},
  rabbit: {nm:"角ウサギ",     img:"monster_003", hp:62,  atk:24, def:5,  mat:5, mdf:5,  spd:16, sk:["claw"]},
  goblin: {nm:"ゴブリン",     img:"monster_012", hp:110, atk:34, def:11, mat:5, mdf:7,  spd:10, sk:["club"]},
  shroom: {nm:"毒キノコ",     img:"monster_009", hp:80,  atk:12, def:7,  mat:28,mdf:10, spd:9,  sk:["claw","spore"], gauge:30},
  orc:    {nm:"オーク",       img:"monster_116", hp:820, atk:70, def:15, mat:8, mdf:10, spd:8,  sk:["club","smash"], gauge:28, boss:1},
};
const WAVES = [["bat","dog","rabbit"],["goblin","shroom","goblin"],["goblin","orc","goblin"]];

const GAUGE_N = 34, GAUGE_HIT = 8;

function rnd(st){ st.seed=(st.seed*1103515245+12345)&0x7fffffff; return st.seed/0x7fffffff; }
function has(u,id){ return u.sk.includes(id); }

function makeUnit(src,side,slot){
  const u={...src, side, slot, max:src.hp, hp:src.hp, gauge:src.gauge||0, ct:0, burn:0, mark:0, shield:0, taunt:0,
    dealt:0, taken:0, acts:0, dead:false};
  u.sk=src.sk.slice();
  return u;
}
function newBattle(wave,seed){
  const st={seed:seed||1, turn:0, log:[], over:null};
  st.party=HEROES.map((h,i)=>makeUnit(h,0,i));
  st.foes=WAVES[wave].map((k,i)=>makeUnit({...FOES[k],id:"f"+i},1,i));
  for(const u of st.party) if(has(u,"first")) { u.gauge+=50; st.log.push({t:"passive",u:u.id,nm:"先手",v:"+50"}); }
  for(const u of [...st.party,...st.foes]) u.ct=100/u.spd*(0.8+rnd(st)*0.4);
  return st;
}
function alive(list){ return list.filter(u=>!u.dead); }
function all(st){ return [...st.party,...st.foes]; }
// 次に動く順（時間の短い順）
function order(st,n){
  const sim=alive(all(st)).map(u=>({u,ct:u.ct})), out=[];
  for(let k=0;k<n;k++){ sim.sort((a,b)=>a.ct-b.ct); const x=sim[0]; out.push(x.u); x.ct+=100/x.u.spd; }
  return out;
}
// 敵が狙う相手：前列が7割。挑発していればその人
function pickHero(st){
  const al=alive(st.party); const t=al.filter(u=>u.taunt>0); if(t.length&&rnd(st)<0.75) return t[0];
  const front=al.filter(u=>u.row===0), back=al.filter(u=>u.row===1);
  const pool=front.length&&(rnd(st)<0.7||!back.length)?front:back.length?back:front;
  return pool[Math.floor(rnd(st)*pool.length)];
}
function pickFoe(st,prefer){
  const al=alive(st.foes); if(!al.length) return null;
  if(prefer==="mark"){ const m=al.filter(u=>u.mark>0); if(m.length) return m[0]; }
  return al.slice().sort((a,b)=>a.hp-b.hp)[0];
}
function gaugeAdd(st,u,v,why){ if(u.dead) return; u.gauge=Math.min(100,u.gauge+v); if(why) st.log.push({t:"passive",u:u.id,nm:why,v:"+"+v}); }

function damage(st,a,d,h,ev){
  const magic=Boolean(h.mag);
  let base=(magic?a.mat:a.atk)*h.pow, def=magic?d.mdf:d.def;
  let v=base*60/(60+def*2.2);
  // 列：後列から近接で殴ると弱い。後列は物理を少し受けにくい
  if(!magic&&a.side===0&&a.row===1&&!SKILLS[ev.skill].ranged) v*=0.7;
  if(!magic&&d.side===0&&d.row===1) v*=0.85;
  if(d.mark>0) v*=1.25;
  if(d.burn>0&&a.side===0&&st.party.some(p=>!p.dead&&has(p,"spread"))){ v*=1.35; ev.syn=(ev.syn||[]).concat("燃え広がり"); }
  if(h.markx&&d.mark>0) v*=h.markx;
  let cr=a.crit/100; if(d.mark>0&&has(a,"finisher")){ cr+=0.4; }
  const crit=rnd(st)<cr; if(crit) v*=1.5;
  if(d.side===0&&has(d,"stand")&&d.hp<d.max*0.3) v*=0.6;
  v*=0.92+rnd(st)*0.16;
  v=Math.max(1,Math.round(v));
  // 守り
  let absorbed=0;
  if(d.shield>0){ absorbed=Math.min(d.shield,v); d.shield-=absorbed; v-=absorbed; }
  d.hp=Math.max(0,d.hp-v); a.dealt+=v; d.taken+=v;
  const r={t:"hit",a:a.id,d:d.id,v,crit,absorbed,skill:ev.skill,syn:ev.syn};
  st.log.push(r); ev.syn=null;
  gaugeAdd(st,d,GAUGE_HIT);
  if(h.burn&&!d.dead&&rnd(st)<h.burn&&d.hp>0){ d.burn=3; st.log.push({t:"status",d:d.id,nm:"火傷"}); }
  if(h.mark&&d.hp>0){ d.mark=Math.max(d.mark,h.mark); st.log.push({t:"status",d:d.id,nm:"印"}); }
  if(absorbed>0&&v===0&&has(d,"parry")&&!a.dead){ st.log.push({t:"passive",u:d.id,nm:"受け流し"}); const pv=Math.round(d.atk*1.2*60/(60+a.def*2.2)); a.hp=Math.max(0,a.hp-pv); d.dealt+=pv; st.log.push({t:"hit",a:d.id,d:a.id,v:pv,counter:1}); if(a.hp<=0) kill(st,a,d); }
  if(d.hp<=0) kill(st,d,a);
  return v;
}
function kill(st,d,a){
  if(d.dead) return; d.dead=true; st.log.push({t:"down",d:d.id});
  if(d.side===1){
    for(const p of alive(st.party)) if(has(p,"embers")) gaugeAdd(st,p,30,"残り火");
    if(d.mark>0&&st.party.some(p=>!p.dead&&has(p,"signal"))){ st.log.push({t:"passive",u:st.party.find(p=>has(p,"signal")).id,nm:"狩りの合図"}); for(const p of alive(st.party)) gaugeAdd(st,p,15); }
  }
}
function useSkill(st,u,id){
  const s=SKILLS[id]; const ev={skill:id};
  st.log.push({t:"act",u:u.id,skill:id,nm:s.nm,k:s.k});
  if(s.guard){ for(const p of alive(st.party)){ const g=Math.round(p.max*(p.row===0?s.guard[0]:s.guard[1])); p.shield=Math.max(p.shield,g); st.log.push({t:"shield",d:p.id,v:g}); } }
  if(s.taunt){ u.taunt=s.taunt; }
  if(s.hit){
    const h=s.hit;
    const targets=u.side===0?(h.all?alive(st.foes):[pickFoe(st,h.prefer)]):(h.all?alive(st.party):[pickHero(st)]);
    for(const t of targets){ if(!t) continue; for(let k=0;k<(h.times||1);k++){ if(t.dead) break; damage(st,u,t,h,ev); if(u.dead) return; } }
  }
}
// 1人ぶん進める。戻り値は動いた人
function step(st){
  if(st.over) return null;
  const al=alive(all(st)); al.sort((a,b)=>a.ct-b.ct); const u=al[0];
  const dt=u.ct; for(const x of al) x.ct-=dt;
  u.ct=100/u.spd; u.acts++; st.turn++;
  // 番の始め：火傷
  if(u.burn>0){ const v=Math.max(1,Math.round(u.max*0.07)); u.hp=Math.max(0,u.hp-v); u.burn--; st.log.push({t:"burn",d:u.id,v}); if(u.hp<=0){ kill(st,u,null); checkEnd(st); return u; } }
  if(u.taunt>0) u.taunt--;
  if(u.mark>0) u.mark--;
  const [n,a]=u.side===0?[u.sk[0],u.sk[1]]:[u.sk[0],u.sk[1]];
  if(a&&u.gauge>=100){
    u.gauge=0; useSkill(st,u,a);
    if(u.side===0) for(const p of alive(st.party)) if(p!==u&&has(p,"tailwind")) gaugeAdd(st,p,20,"追い風");
  } else {
    useSkill(st,u,n); gaugeAdd(st,u,u.side===0?GAUGE_N:(u.boss?26:20));
  }
  for(const f of st.foes) if(f.mark>0&&f.dead) f.mark=0;
  checkEnd(st);
  return u;
}
function checkEnd(st){
  if(!alive(st.foes).length) st.over="win"; else if(!alive(st.party).length) st.over="lose";
}
const api={SKILLS,HEROES,FOES,WAVES,newBattle,step,order,alive};
if(typeof module!=="undefined") module.exports=api; else root.BT=api;
})(this);
