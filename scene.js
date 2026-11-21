// ---------- 場面の演出（倒れた姿・玉座の間など） ----------
// 立ち絵の顔から目（2×2の四角が2つ、間が6ドット）を探す
function findEyesIn(g,w,h){
  const d=g.getImageData(0,0,w,h).data, P=(x,y)=>{ const i=(y*w+x)*4; return [d[i],d[i+1],d[i+2],d[i+3]]; }, eq=(a,b)=>a[0]===b[0]&&a[1]===b[1]&&a[2]===b[2]&&a[3]===b[3];
  let best=null;
  for(let y=1;y<h-2;y++) for(let x=0;x<w-10;x++){
    const c=P(x,y); if(c[3]!==255) continue;
    let ok=true; for(const i of [0,1]) for(const j of [0,1]){ if(!eq(P(x+i,y+j),c)||!eq(P(x+8+i,y+j),c)) ok=false; } if(!ok) continue;
    const mid=[]; for(let i=0;i<6;i++) for(const j of [0,1]) mid.push(P(x+2+i,y+j));
    if(mid.some(m=>m[3]!==255||eq(m,c))) continue;
    const cnt={}; for(const m of mid){ const k=m.join(','); cnt[k]=(cnt[k]||0)+1; }
    const [sk,n]=Object.entries(cnt).sort((a,b)=>b[1]-a[1])[0]; const skin=sk.split(',').map(Number);
    const far=Math.abs(skin[0]-c[0])+Math.abs(skin[1]-c[1])+Math.abs(skin[2]-c[2]);
    if(n>=5 && far>=100 && (!best||far>best.far)) best={x,y,c,skin,far};
  }
  return best;
}
// 目を描き替える：'x'＝バツ印（力尽きた）、'line'＝閉じた線（眠り・気絶・死）
function closeEyes(g,w,h,mode){
  const e=findEyesIn(g,w,h); if(!e) return;
  const px=(x,y,c)=>{ if(x<0||y<0||x>=w||y>=h) return; g.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`; g.fillRect(x,y,1,1); };
  for(const ex of [e.x,e.x+8]){
    for(const i of [0,1]) for(const j of [0,1]) px(ex+i,e.y+j,e.skin);
    if(mode==='x'){ for(let k=0;k<3;k++){ px(ex+k,e.y-1+k,e.c); px(ex+2-k,e.y-1+k,e.c); } }
    else { px(ex,e.y+1,e.c); px(ex+1,e.y+1,e.c); }
  }
}
// 正面の「立ち」のコマ（目を描き替えたもの）
function standFrame(img,mode){
  const fw=img.naturalWidth/3, fh=img.naturalHeight/5, c=document.createElement('canvas'); c.width=fw; c.height=fh;
  const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(img,fw,0,fw,fh,0,0,fw,fh);
  if(mode) try{ closeEyes(g,fw,fh,mode); }catch(e){}
  return c;
}
// 倒れた姿：正面の立ち絵を横に90度倒す（頭が左）
const LYING={};
function lyingCanvas(img,mode,key){
  const k=(key||img.src)+'|'+mode; if(LYING[k]) return LYING[k];
  const s=standFrame(img,mode), c=document.createElement('canvas'); c.width=s.height; c.height=s.width;
  const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.translate(0,c.height); g.rotate(-Math.PI/2); g.drawImage(s,0,0);
  return LYING[k]=c;
}

// ---------- 魔王城：玉座の間 ----------
const MAOU_IMG=new Image(); MAOU_IMG.src='img/maou.png';
function buildThrone(){
  const W=11,H=15,t=new Uint8Array(W*H).fill(1), set=(x,y,v)=>{ t[y*W+x]=v; };
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++) set(x,y,0);
  for(let y=3;y<H-1;y++) for(let x=4;x<=6;x++) set(x,y,7);   // 赤い絨毯
  for(const y of [4,7,10]){ set(2,y,8); set(8,y,8); }        // 柱
  const objs=[
    {type:'window',x:2,y:0},{type:'window',x:8,y:0},
    {type:'throne',x:5,y:2},{type:'torch',x:3,y:2},{type:'torch',x:7,y:2},
    {type:'scorch',x:4,y:5,s:1},{type:'scorch',x:6,y:6,s:2},{type:'scorch',x:5,y:7,s:3},{type:'scorch',x:6,y:4,s:4},
    {type:'body',x:5,y:5,ev:'maou_body'},
  ];
  return {id:'castle',floor:LOCS.castle.floors-1,w:W,h:H,t,objs,npcs:[],start:{x:5,y:13},theme:'castle',safe:1,throne:1};
}
function enterThrone(){
  G.loc='castle'; G.floor=LOCS.castle.floors-1; RT.map=buildThrone();
  const p=RT.map.start; G.x=p.x; G.y=p.y; G.dir='up'; RT.trail=[0,1,2,3].map(()=>({x:p.x,y:p.y,dir:'up'})); RT.mode='field';
  $('padField').style.display='flex'; hidePanel(); renderTop();
}
// 玉座の間の物を描く（drawObj から呼ぶ）。描いたら true
function drawSceneObj(o,sx,sy){
  const t=RT.anim;
  if(o.type==='church'){ const L=sx-64, R=sx+96;
    // 石壁（2段）
    cx.fillStyle='#d6d3d1'; cx.fillRect(L,sy+64,160,64); cx.fillStyle='#a8a29e'; for(let r=0;r<4;r++)for(let c=0;c<10;c++) cx.fillRect(L+c*16+(r%2?8:0),sy+64+r*16,1,16); for(let r=1;r<4;r++) cx.fillRect(L,sy+64+r*16,160,1);
    cx.fillStyle='#78716c'; cx.fillRect(L,sy+124,160,4);
    // 屋根（青灰）
    cx.fillStyle='#475569'; cx.fillRect(L,sy,160,64); cx.fillStyle='#0003'; for(let i=0;i<8;i++) cx.fillRect(L,sy+i*8+6,160,2);
    cx.fillStyle='#334155'; cx.fillRect(L,sy+60,160,4);
    // 中央の破風と鐘楼
    cx.fillStyle='#e7e5e4'; cx.beginPath(); cx.moveTo(sx-8,sy+64); cx.lineTo(sx+16,sy+10); cx.lineTo(sx+40,sy+64); cx.fill();
    cx.fillStyle='#57534e'; cx.fillRect(sx+10,sy+30,12,14); cx.fillStyle='#fbbf24'; cx.beginPath(); cx.arc(sx+16,sy+40,4,0,7); cx.fill();
    cx.fillStyle='#fbbf24'; cx.fillRect(sx+14,sy-4,4,18); cx.fillRect(sx+9,sy+1,14,4);
    // 窓（ステンドグラス）
    for(const wx of [L+16,L+40,R-48,R-24]){ cx.fillStyle='#57534e'; cx.fillRect(wx-1,sy+75,10,18); cx.fillStyle='#7dd3fc'; cx.fillRect(wx+1,sy+77,6,7); cx.fillStyle='#f0abfc'; cx.fillRect(wx+1,sy+84,6,7); }
    // 扉（アーチ）
    cx.fillStyle='#57534e'; cx.fillRect(sx+4,sy+102,24,26); cx.beginPath(); cx.arc(sx+16,sy+102,12,Math.PI,0); cx.fill();
    cx.fillStyle='#7c2d12'; cx.fillRect(sx+7,sy+104,18,24); cx.beginPath(); cx.arc(sx+16,sy+104,9,Math.PI,0); cx.fill(); cx.fillStyle='#fbbf24'; cx.fillRect(sx+15,sy+100,2,28);
    return true; }
  if(RT.map&&RT.map.room&&drawRoomObj(o,sx,sy)) return true;
  if(o.type==='boss' && RT.map.id==='castle' && !RT.map.throne && typeof bossDone==='function' && bossDone() && G.chapter===0 && !G.flags.maou_seen){
    cx.fillStyle='#1a0f24'; cx.fillRect(sx+4,sy+2,24,28); cx.beginPath(); cx.arc(sx+16,sy+4,12,Math.PI,0); cx.fill();
    cx.fillStyle='#4a1d2e'; cx.fillRect(sx+7,sy+4,18,26); cx.fillStyle='#d4a017'; cx.fillRect(sx+15,sy+4,2,26); cx.fillRect(sx+12,sy+16,2,3); cx.fillRect(sx+18,sy+16,2,3);
    return true; }
  if(o.type==='throne'){
    cx.fillStyle='#000a'; cx.beginPath(); cx.ellipse(sx+16,sy+30,18,5,0,0,7); cx.fill();
    cx.fillStyle='#3b1020'; cx.fillRect(sx+4,sy-22,24,46);                 // 背もたれ
    cx.fillStyle='#7f1d1d'; cx.fillRect(sx+8,sy-18,16,30);
    cx.fillStyle='#d4a017'; cx.fillRect(sx+4,sy-22,24,3); cx.fillRect(sx+4,sy-22,3,46); cx.fillRect(sx+25,sy-22,3,46);
    cx.fillStyle='#d4a017'; cx.beginPath(); cx.moveTo(sx+4,sy-22); cx.lineTo(sx+8,sy-32); cx.lineTo(sx+12,sy-22); cx.fill(); cx.beginPath(); cx.moveTo(sx+20,sy-22); cx.lineTo(sx+24,sy-32); cx.lineTo(sx+28,sy-22); cx.fill();
    cx.beginPath(); cx.moveTo(sx+12,sy-22); cx.lineTo(sx+16,sy-36); cx.lineTo(sx+20,sy-22); cx.fill();
    cx.fillStyle='#dc2626'; cx.fillRect(sx+14,sy-30,4,4);
    cx.fillStyle='#2a0a14'; cx.fillRect(sx+2,sy+10,28,8); cx.fillStyle='#d4a017'; cx.fillRect(sx+2,sy+10,28,2); // 座面
    cx.fillStyle='#3b1020'; cx.fillRect(sx+0,sy+2,6,18); cx.fillRect(sx+26,sy+2,6,18);   // ひじかけ
    cx.fillStyle='#d4a017'; cx.fillRect(sx+0,sy+2,6,2); cx.fillRect(sx+26,sy+2,6,2);
    cx.fillStyle='#1a0610'; cx.fillRect(sx+4,sy+18,24,10);
    return true; }
  if(o.type==='torch'){
    cx.fillStyle='#000a'; cx.beginPath(); cx.ellipse(sx+16,sy+30,8,3,0,0,7); cx.fill();
    cx.fillStyle='#57534e'; cx.fillRect(sx+14,sy+12,4,18); cx.fillStyle='#78716c'; cx.fillRect(sx+8,sy+8,16,6); cx.fillStyle='#44403c'; cx.fillRect(sx+10,sy+28,12,3);
    const f=Math.sin(t/4+o.x)*2;
    cx.fillStyle='rgba(251,146,60,.18)'; cx.beginPath(); cx.arc(sx+16,sy+2,18+f,0,7); cx.fill();
    cx.fillStyle='#f97316'; cx.beginPath(); cx.moveTo(sx+10,sy+8); cx.quadraticCurveTo(sx+16,sy-12-f,sx+22,sy+8); cx.fill();
    cx.fillStyle='#fde047'; cx.beginPath(); cx.moveTo(sx+13,sy+8); cx.quadraticCurveTo(sx+16,sy-4-f,sx+19,sy+8); cx.fill();
    return true; }
  if(o.type==='window'){
    cx.fillStyle='#120a1e'; cx.fillRect(sx+6,sy+4,20,26); cx.beginPath(); cx.arc(sx+16,sy+6,10,Math.PI,0); cx.fill();
    cx.fillStyle=G.flags.skycrack?'#3b2147':'#2b1840'; cx.fillRect(sx+8,sy+6,16,22); cx.beginPath(); cx.arc(sx+16,sy+7,8,Math.PI,0); cx.fill();
    cx.fillStyle='#5b4a6e'; cx.fillRect(sx+15,sy-1,2,29); cx.fillRect(sx+8,sy+15,16,2);
    if(G.flags.skycrack){ cx.strokeStyle='#f5f3ff'; cx.lineWidth=1.5; cx.beginPath(); cx.moveTo(sx+8,sy+4); cx.lineTo(sx+13,sy+10); cx.lineTo(sx+11,sy+15); cx.lineTo(sx+19,sy+21); cx.lineTo(sx+17,sy+25); cx.lineTo(sx+24,sy+29); cx.stroke(); }
    return true; }
  if(o.type==='scorch'){
    const r=[0,7,5,6,4][o.s||1], ox=sx+16, oy=sy+18;
    cx.fillStyle='rgba(120,110,95,.45)'; cx.beginPath(); cx.ellipse(ox,oy,r+6,r*0.55+4,0,0,7); cx.fill();
    cx.fillStyle='rgba(40,36,32,.7)'; cx.beginPath(); cx.ellipse(ox+2,oy-1,r+1,r*0.45+2,0,0,7); cx.fill();
    const g=0.35+0.15*Math.sin(t/20+(o.s||1)); cx.fillStyle=`rgba(254,240,138,${g})`;
    for(let i=0;i<5;i++){ const a=i*1.3+(o.s||1); cx.fillRect(Math.round(ox+Math.cos(a)*(r+3)),Math.round(oy+Math.sin(a)*(r*0.5+2)),2,1); }
    return true; }
  if(o.type==='body'){
    cx.fillStyle='#0006'; cx.beginPath(); cx.ellipse(sx+16,sy+22,22,7,0,0,7); cx.fill();
    if(MAOU_IMG.naturalWidth){ const c=lyingCanvas(MAOU_IMG,'line','maou'); cx.imageSmoothingEnabled=false; cx.drawImage(c,Math.round(sx+16-c.width/2),Math.round(sy+16-c.height/2)); }
    return true; }
  if(o.type==='boss' && RT.map && BOSS_WHO[RT.map.id]){ if(bossActorObj(o)) drawBossActor(o,sx,sy); return true; }
  if(o.type==='fallen'){
    const lk=o.look||LOOK[o.who]; if(lk&&hasImg(lk)){ cx.fillStyle='#0006'; cx.beginPath(); cx.ellipse(sx+16,sy+22,22,7,0,0,7); cx.fill();
      const c=lyingCanvas(lk.img,o.eyes||'line',o.who); cx.imageSmoothingEnabled=false; cx.drawImage(c,Math.round(sx+16-c.width/2),Math.round(sy+16-c.height/2)); }
    return true; }
  return false;
}
// 玉座の間の床（drawTile から呼ぶ）。描いたら true
function drawSceneTile(m,v,x,y,px,py){
  const th=THEMES[m.theme]||THEMES.castle, s=TS;
  if(v===7){ cx.fillStyle='#7f1d1d'; cx.fillRect(px,py,s,s); cx.fillStyle='#991b1b'; cx.fillRect(px,py+((y%2)?0:16),s,2);
    const L=tileAt(m,x-1,y)!==7, R=tileAt(m,x+1,y)!==7;
    cx.fillStyle='#ca8a04'; if(L) cx.fillRect(px+2,py,3,s); if(R) cx.fillRect(px+s-5,py,3,s); return true; }
  if(v===8){ cx.fillStyle=th.floor; cx.fillRect(px,py,s,s);
    cx.fillStyle='#000a'; cx.beginPath(); cx.ellipse(px+16,py+29,13,4,0,0,7); cx.fill();
    cx.fillStyle='#3a3347'; cx.fillRect(px+6,py-26,20,54); cx.fillStyle='#4f4660'; cx.fillRect(px+8,py-26,6,54); cx.fillStyle='#29233a'; cx.fillRect(px+22,py-26,4,54);
    cx.fillStyle='#57506a'; cx.fillRect(px+3,py-30,26,6); cx.fillRect(px+3,py+24,26,6); return true; }
  return false;
}

// ---------- 町の人：素材バンクの人物（024番以降）を、役目のある人に1人ずつ割り当てる ----------
// 同じ人物は2つの役に使わない。001〜023はこのゲームの登場人物なので使わない
const BANK_NPC={
  'sora|nm:リリィの母':'026', 'halt|inn':'028', 'lumiere|equip':'024', 'lumiere|smith':'030',
  'gram|item':'039', 'azur|item':'027', 'azur|equip':'031', 'garam|nm:傭兵':'033', 'garam|equip':'038',
  'belka|nm:学生':'029', 'belka|smith':'032', 'belka|item':'034', 'saha|item':'037',
  'shadow|nm:里の子ども':'040', 'shadow|flavor0':'025', 'shadow|flavor1':'036', 'shadow|flavor2':'042'
};
const BANK_SPEAKER={'里長':'041'};   // 物語の会話にだけ出る人の顔
const BANK_IMG={}; for(const id of new Set([...Object.values(BANK_NPC),...Object.values(BANK_SPEAKER)])){ const im=new Image(); im.src='img/bank_'+id+'.png'; BANK_IMG[id]=im; }
function bankForNpc(town,n){
  if(n.shop && n.kind) return BANK_NPC[town+'|'+n.kind];
  if(n.nm && BANK_NPC[town+'|nm:'+n.nm]) return BANK_NPC[town+'|nm:'+n.nm];
  if(n.role==='flavor' && n.fi!==undefined) return BANK_NPC[town+'|flavor'+n.fi];
}
function assignBankNpcs(m){ for(const n of m.npcs){ if(n.who) continue; const b=bankForNpc(m.id,n); if(b){ n.bank=b; n.look=null; } } }
function bankLook(id){ const im=BANK_IMG[id]; return im&&im.naturalWidth? {img:im} : null; }
function bankFaceURL(id){ const im=BANK_IMG[id]; if(!im||!im.naturalWidth) return null; const key='bank|'+id; if(SPR_URL[key]) return SPR_URL[key];
  const fw=im.naturalWidth/3, c=document.createElement('canvas'); c.width=fw; c.height=im.naturalHeight/5; const g=c.getContext('2d'); g.imageSmoothingEnabled=false; g.drawImage(im,fw,0,fw,c.height,0,0,fw,c.height); try{ return SPR_URL[key]=c.toDataURL(); }catch(e){ return null; } }

// ---------- アルトの家（はじまりの部屋） ----------
THEMES.house={floor:'#9a7650',floor2:'#8f6c48',wall:'#5a3d26',path:'#a8845c',sky:['#1a1410','#3a2f26']};
function buildRoom(opening){
  const W=9,H=8,t=new Uint8Array(W*H).fill(1), set=(x,y,v)=>{ t[y*W+x]=v; };
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++) set(x,y,0);
  set(4,H-1,0);                                   // 出入り口
  const objs=[
    {type:'hwindow',x:2,y:0},{type:'hwindow',x:6,y:0},
    {type:'bed',x:2,y:2,say:'ふかふかのベッドだ。ゆうべは、なかなか眠れなかった。'},{type:'block',x:2,y:3},
    {type:'shelf',x:6,y:1,say:'棚に、小さいころの木の剣が飾ってある。'},
    {type:'table',x:6,y:4,say:'テーブルに、母さんの作ってくれた弁当が置いてある。'},
    {type:'pot',x:1,y:6,say:'水がめだ。冷たい水がたっぷり入っている。'},
    {type:'rug',x:4,y:5},
    {type:'door',x:4,y:H-1},
  ];
  if(opening) objs.push({type:'sleeper',who:'アルト',x:2,y:2});
  return {id:'sora',floor:0,w:W,h:H,t,objs,npcs:opening?[{x:3,y:3,who:'リリィ',nm:'リリィ',dir:'left',role:'scene',idx:900}]:[],start:{x:3,y:2},theme:'house',safe:1,solo:1,room:'アルトの家'};
}
async function enterHome(){ RT.busy=true; sfx('door'); await fade(true); G.loc='sora'; G.floor=0; RT.map=buildRoom(false); G.x=4; G.y=6; G.dir='up'; RT.trail=[0,1,2,3].map(()=>({x:4,y:6,dir:'up'})); RT.mode='field'; renderTop(); await fade(false); RT.busy=false; }
function enterRoom(){
  G.loc='sora'; G.floor=0; RT.map=buildRoom(true); const p=RT.map.start; G.x=p.x; G.y=p.y; G.dir='down';
  RT.trail=[0,1,2,3].map(()=>({x:p.x,y:p.y,dir:'down'})); RT.mode='field'; $('padField').style.display='flex'; hidePanel(); renderTop();
}
async function npcWalk(n,path,ms){ ms=ms||STEP_MS; n.walk=1; n.walkT0=performance.now(); for(const [x,y] of path){ n.dir=x>n.x?'right':x<n.x?'left':y>n.y?'down':'up'; n.stepN=(n.stepN||0)+1; n.mv={fx:n.x,fy:n.y,t0:performance.now(),dur:ms}; n.x=x; n.y=y; await sleep(ms); } n.mv=null; n.walk=0; }
async function leaveRoom(){
  RT.busy=true; sfx('stairs'); await fade(true);
  enterMap('sora',0,{x:15,y:18}); G.dir='down'; RT.trail=[0,1,2,3].map(()=>({x:15,y:18,dir:'down'}));
  await fade(false); RT.busy=false; await runTrigger('enter_sora');
}
function drawRoomObj(o,sx,sy){
  const t=RT.anim;
  if(o.type==='hwindow'){ cx.fillStyle='#3b2a1a'; cx.fillRect(sx+4,sy+6,24,22); cx.fillStyle='#9fd3ff'; cx.fillRect(sx+7,sy+9,18,16); cx.fillStyle='#d8f0ff'; cx.fillRect(sx+7,sy+9,18,5); cx.fillStyle='#3b2a1a'; cx.fillRect(sx+15,sy+9,2,16); cx.fillRect(sx+7,sy+16,18,2); return true; }
  if(o.type==='bed'){ cx.fillStyle='#000a'; cx.fillRect(sx+3,sy+60,28,4);
    cx.fillStyle='#6b4423'; cx.fillRect(sx+2,sy+2,28,60); cx.fillStyle='#8b5a2b'; cx.fillRect(sx+2,sy+2,28,8);
    cx.fillStyle='#f5f0e6'; cx.fillRect(sx+5,sy+8,22,12);            // まくら
    cx.fillStyle='#3b6fb0'; cx.fillRect(sx+4,sy+22,24,38); cx.fillStyle='#5a8fd0'; cx.fillRect(sx+4,sy+22,24,4); cx.fillStyle='#2f5a92'; cx.fillRect(sx+4,sy+54,24,6); return true; }
  if(o.type==='block') return true;
  if(o.type==='rug'){ cx.fillStyle='#8a2f2f'; cx.fillRect(sx-12,sy+4,56,26); cx.fillStyle='#c2a050'; cx.fillRect(sx-10,sy+6,52,2); cx.fillRect(sx-10,sy+26,52,2); return true; }
  if(o.type==='shelf'){ cx.fillStyle='#5b3a1e'; cx.fillRect(sx+2,sy-10,28,40); cx.fillStyle='#7a5230'; cx.fillRect(sx+4,sy-8,24,10); cx.fillRect(sx+4,sy+6,24,10); cx.fillStyle='#c9925a'; cx.fillRect(sx+8,sy-4,16,3); cx.fillStyle='#9fb2c8'; cx.fillRect(sx+7,sy+9,4,6); cx.fillStyle='#d97706'; cx.fillRect(sx+14,sy+8,6,7); return true; }
  if(o.type==='table'){ cx.fillStyle='#000a'; cx.beginPath(); cx.ellipse(sx+16,sy+28,15,4,0,0,7); cx.fill(); cx.fillStyle='#6b4423'; cx.fillRect(sx+5,sy+16,4,12); cx.fillRect(sx+23,sy+16,4,12); cx.fillStyle='#8b5a2b'; cx.fillRect(sx+1,sy+8,30,10); cx.fillStyle='#a8743e'; cx.fillRect(sx+1,sy+8,30,3); cx.fillStyle='#e8dcc0'; cx.fillRect(sx+10,sy+4,12,6); cx.fillStyle='#b91c1c'; cx.fillRect(sx+10,sy+6,12,2); return true; }
  if(o.type==='pot'){ cx.fillStyle='#000a'; cx.beginPath(); cx.ellipse(sx+16,sy+28,10,3,0,0,7); cx.fill(); cx.fillStyle='#7c5a3a'; cx.beginPath(); cx.ellipse(sx+16,sy+18,10,11,0,0,7); cx.fill(); cx.fillStyle='#5b3f26'; cx.fillRect(sx+9,sy+6,14,4); cx.fillStyle='#4a90d0'; cx.fillRect(sx+11,sy+7,10,2); return true; }
  if(o.type==='door'){ cx.fillStyle='#3b2a1a'; cx.fillRect(sx+4,sy,24,32); cx.fillStyle='#6b4423'; cx.fillRect(sx+6,sy+2,20,30); cx.fillStyle='#fbbf24'; cx.fillRect(sx+21,sy+16,3,3); cx.fillStyle='#ffffff14'; cx.fillRect(sx+6,sy+2,20,30); return true; }
  if(o.type==='sleeper'){ const lk=LOOK[o.who]; if(lk&&hasImg(lk)){ const k='sleep|'+o.who; const c=LYING[k]||(LYING[k]=standFrame(lk.img,'line')); cx.imageSmoothingEnabled=false; cx.drawImage(c,sx,sy-4,32,40);
      cx.fillStyle='#3b6fb0'; cx.fillRect(sx+3,sy+17,26,43); cx.fillStyle='#5a8fd0'; cx.fillRect(sx+3,sy+17,26,4); cx.fillStyle='#e8eef8'; cx.fillRect(sx+3,sy+17,26,2); cx.fillStyle='#2f5a92'; cx.fillRect(sx+3,sy+54,26,6);
      const z=Math.floor(t/30)%3; cx.fillStyle='#e5e7eb'; cx.font='bold 10px sans-serif'; cx.textAlign='left'; cx.fillText('z'.repeat(z+1),sx+24,sy+4-z*2); }
    return true; }
  return false;
}

// ---------- はじまりの夢（もやの中。何なのかは、まだ分からない） ----------
function drawDream(){
  const D=RT.dream, W=VW, H=VH, t=RT.anim;
  const g=cx.createRadialGradient(W/2,H*0.42,20,W/2,H*0.5,Math.max(W,H)*0.75); g.addColorStop(0,'#3a3150'); g.addColorStop(1,'#0c0a14'); cx.fillStyle=g; cx.fillRect(0,0,W,H);
  const S=2; cx.save(); cx.translate(Math.round(W/2),0); cx.scale(S,S); cx.imageSmoothingEnabled=false;
  const ty=Math.round(H*0.15);
  cx.fillStyle='#5b1a24'; cx.fillRect(-26,ty+30,52,H); cx.fillStyle='#7a5a1a'; cx.fillRect(-26,ty+30,3,H); cx.fillRect(23,ty+30,3,H);
  cx.globalAlpha=0.85; drawSceneObj({type:'throne'},-16,ty); cx.globalAlpha=1;
  // 人影（うしろ姿）。巻き戻るときは残像が残る
  const lk=LOOK['アルト'];
  for(const gh of D.ghosts){ cx.globalAlpha=gh.a; drawSprite(-16,Math.round(gh.y/S),lk,0,'up',undefined,1); }
  cx.globalAlpha=1;
  if(D.show){ const wf=D.walking?Math.floor(performance.now()/160)%2:0; drawSprite(-16,Math.round(D.y/S),lk,wf,'up',undefined,D.walking?(wf?2:0):1); }
  cx.restore();
  // もや
  for(let i=0;i<14;i++){ const fx=(i*97%W)+Math.sin(t/90+i)*30, fy=(i*53%H)+Math.cos(t/110+i*2)*20, r=60+(i%5)*22;
    const fg=cx.createRadialGradient(fx,fy,0,fx,fy,r); fg.addColorStop(0,`rgba(225,222,240,${0.13+0.05*Math.sin(t/70+i)})`); fg.addColorStop(1,'rgba(225,222,240,0)'); cx.fillStyle=fg; cx.fillRect(fx-r,fy-r,r*2,r*2); }
  if(D.glow>0){ const bg=cx.createRadialGradient(W/2,H*0.95,10,W/2,H*0.9,H*D.glow*1.2); bg.addColorStop(0,`rgba(147,197,253,${Math.min(0.95,D.glow)})`); bg.addColorStop(1,'rgba(96,165,250,0)'); cx.fillStyle=bg; cx.fillRect(0,0,W,H); }
  if(D.white>0){ cx.fillStyle=`rgba(235,242,255,${D.white})`; cx.fillRect(0,0,W,H); }
  const v=cx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.35,W/2,H/2,Math.max(W,H)*0.7); v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.75)'); cx.fillStyle=v; cx.fillRect(0,0,W,H);
}
async function dreamTween(ms,fn){ const t0=performance.now(); for(;;){ const k=Math.min(1,(performance.now()-t0)/ms); fn(k); if(k>=1) break; await sleep(16); } }
TRIG.dream = async()=>{
  const H=VH; RT.dream={show:true,walking:true,y:H*0.88,glow:0,white:0,ghosts:[]};
  await fade(true); RT.dark=false; await fade(false);
  const y0=H*0.88, y1=H*0.46; await dreamTween(3400,k=>{ RT.dream.y=y0+(y1-y0)*k; });
  RT.dream.walking=false; await sleep(700);
  await say('','……アルト！');
  await sleep(500);
  RT.dream.walking=true; const y2=H*0.40; await dreamTween(900,k=>{ RT.dream.y=y1+(y2-y1)*k; }); RT.dream.walking=false;
  await say('','……おねがい。こっちを、見て。');
  await sleep(400);
  sfx('rewind');
  await dreamTween(1300,k=>{ const D=RT.dream; D.glow=k*1.1; D.y=y2+(H*0.95-y2)*k*k; if(Math.floor(k*20)%3===0) D.ghosts.push({y:D.y,a:0.35}); D.ghosts.forEach(g=>g.a*=0.9); D.ghosts=D.ghosts.filter(g=>g.a>0.03); D.white=Math.max(0,(k-0.6)/0.4); });
  await sleep(250);
  RT.dark=true; RT.dream=null; await sleep(700);
};

// ---------- 話す人は、その場に姿を見せてから話す ----------
// 遠くから声だけで話しかけてこないように：話す前に、その人がこちらへ歩いてくる（いなければ画面の外から来る）。
// 仲間・名前を伏せた「？？？」の声・暗い場面・家の中などは、そのまま話す。
const BOSS_WHO={fort1:'ザガン',fort2:'ザガン',tower:'セイル',tomb:'レオン'};
function speakerSpec(name){
  const c=CHARS[name]?name:(SPEAKER_CHAR[name]&&CHARS[SPEAKER_CHAR[name]]?SPEAKER_CHAR[name]:null);
  if(c) return {who:c};
  if(typeof BANK_SPEAKER!=='undefined'&&BANK_SPEAKER[name]) return {bank:BANK_SPEAKER[name]};
  return {type:SPEAKER_TYPE[name]||npcType(name,hashStr(name)), seed:hashStr(name)};
}
function specLook(sp){ return sp.who?LOOK[sp.who]:npcLookFor(sp); }
function dirTo(fx,fy,tx,ty){ const dx=tx-fx, dy=ty-fy; return Math.abs(dx)>=Math.abs(dy)?(dx>0?'right':dx<0?'left':(dy>0?'down':'up')):(dy>0?'down':'up'); }
function bossActorObj(o){ return o.type==='boss' && RT.map && BOSS_WHO[RT.map.id] && !o.hideActor && (!bossDone() || RT.event>0)
  && !RT.map.objs.some(f=>f.type==='fallen'&&!f.gone&&f.x===o.x&&f.y===o.y); }
function drawBossActor(o,sx,sy){
  const sp=o._sp||(o._sp=speakerSpec(BOSS_WHO[RT.map.id])), lk=specLook(sp);
  cx.fillStyle='#0005'; cx.beginPath(); cx.ellipse(sx+16,sy+28,12,4,0,0,7); cx.fill();
  drawSprite(sx,sy-4,lk,0,dirTo(o.x,o.y,G.x,G.y));
}
function partyTiles(){ const s=new Set([G.x+','+G.y]); for(let i=0;i<Math.min(3,G.party.length-1);i++){ const t=RT.trail[i]; if(t) s.add(t.x+','+t.y); } return s; }
function bfsFrom(m,sx,sy,block){ const D=[[0,1],[0,-1],[1,0],[-1,0]], dist=new Map([[sx+','+sy,0]]), prev=new Map(), q=[[sx,sy]];
  while(q.length){ const [x,y]=q.shift(), d=dist.get(x+','+y); for(const [dx,dy] of D){ const nx=x+dx, ny=y+dy, k=nx+','+ny; if(dist.has(k)||block.has(k)||!walkable(m,nx,ny)) continue; if(m.town&&ny>=m.h-1) continue; dist.set(k,d+1); prev.set(k,x+','+y); q.push([nx,ny]); } }
  return {dist,prev}; }
function onScreen(x,y){ const c=RT.cam||{x:0,y:0}; const px=x*TS-c.x, py=y*TS-c.y; return px>-4&&py>-4&&px<VW-TS+4&&py<VH-TS+4; }
function spawnSpot(m,opt){
  const {dist}=bfsFrom(m,G.x,G.y,partyTiles()); let off=null, vis=null;
  for(const [k,d] of dist){ if(d<3) continue; const [x,y]=k.split(',').map(Number);
    if(!onScreen(x,y)){ if(d<=16 && (!off||d<off.d)) off={x,y,d}; }
    else if(d<=6 && (!vis||d>vis.d)) vis={x,y,d}; }
  return opt.here? (vis||off) : (off||vis);
}
function pathToPlayer(m,n){
  const block=partyTiles(); block.delete(n.x+','+n.y);
  const {dist,prev}=bfsFrom(m,n.x,n.y,block);
  const fr={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[G.dir]||[0,1];
  const goals=[[G.x+fr[0],G.y+fr[1]],[G.x,G.y+1],[G.x,G.y-1],[G.x+1,G.y],[G.x-1,G.y]].map(([x,y])=>x+','+y).filter(k=>dist.has(k));
  if(!goals.length) return null;
  let g=goals[0]; for(const k of goals) if(dist.get(k)<dist.get(g)-1) g=k;   // 正面を優先（遠回りしすぎない範囲で）
  const path=[]; for(let k=g;k!==n.x+','+n.y;k=prev.get(k)) path.unshift(k.split(',').map(Number));
  return path;
}
function faceEachOther(x,y,n){ G.dir=dirTo(G.x,G.y,x,y); if(n) n.dir=dirTo(x,y,G.x,G.y); }
function findSpeakerBody(m,real,sp){
  const bw=BOSS_WHO[m.id]; if(bw && (bw===real||bw===sp.who)){ const b=m.objs.find(o=>o.type==='boss'); if(b&&bossActorObj(b)) return {obj:b}; }
  const fl=m.objs.find(o=>o.type==='fallen'&&!o.gone&&(o.who===real||(sp.who&&o.who===sp.who))); if(fl) return {obj:fl};
  const n=m.npcs.find(n=>!n.gone&&(n.nm===real||n.actorName===real||(sp.who&&n.who===sp.who))); if(n) return {npc:n};
  return null;
}
async function stageSpeaker(w){
  if(!w || !RT.event || RT.talkNpc || RT.dark || RT.dream || RT.mode!=='field') return;
  const m=RT.map; if(!m || m.solo || m.room || m.throne) return;
  const parts=w.split('|'); if(parts[0].startsWith('？？？')) return;
  const real=parts[parts.length-1]; if(real==='アルト') return;
  const sp=speakerSpec(real);
  if(G.party.includes(real) || (sp.who && (G.party.includes(sp.who) || (G.members[sp.who]&&G.members[sp.who].avail)))) return;
  const opt=(RT.stageOpt&&RT.stageOpt[real])||{}, near=opt.near||1;
  const body=findSpeakerBody(m,real,sp);
  if(body&&body.obj){ faceEachOther(body.obj.x,body.obj.y); return; }
  let n=body&&body.npc;
  if(!n){
    const s=spawnSpot(m,opt); if(!s) return;
    n={x:s.x,y:s.y,actorName:real,nm:real,role:'actor',idx:900+m.npcs.length,seed:hashStr(real),dir:dirTo(s.x,s.y,G.x,G.y)};
    if(sp.who) n.who=sp.who; else if(sp.bank) n.bank=sp.bank; else n.type=sp.type;
    n.actor=1; m.npcs.push(n);
  }
  if(!n.home) n.home={x:n.x,y:n.y,dir:n.dir,trip:[]};
  if(!RT.staged) RT.staged=[]; if(!RT.staged.includes(n)) RT.staged.push(n);
  const d=Math.abs(n.x-G.x)+Math.abs(n.y-G.y);
  if(d>near){
    $('msg').style.display='none';
    let path=pathToPlayer(m,n); if(path && near>1) path=path.slice(0,Math.max(0,path.length-(near-1)));
    if(path&&path.length){
      if(onScreen(n.x,n.y) && !n.excl){ n.excl=1; sfx('pop'); await sleep(450); }
      n.excl=0; await npcWalk(n,path,STEP_MS); n.home.trip.push(...path);
    }
  }
  faceEachOther(n.x,n.y,n);
}
// 出来事が終わったら、来た人は帰っていく（もとからいた人は元の場所へ戻る）
async function dismissStaged(){
  const list=(RT.staged||[]); RT.staged=[]; RT.stageOpt=null; const m=RT.map; if(!m) return;
  await Promise.all(list.filter(n=>m.npcs.includes(n)&&!n.gone).map(async n=>{
    const joined=n.who&&G.members[n.who]&&G.members[n.who].avail;
    if(joined){ n.gone=true; return; }
    const back=[...n.home.trip].reverse().slice(1).concat([[n.home.x,n.home.y]]).filter(([x,y])=>!(x===n.x&&y===n.y));
    if(back.length) await npcWalk(n,back,STEP_MS);
    if(n.actor) n.gone=true; else n.dir=n.home.dir;
    n.home=null;
  }));
}
// その場にいるはずの人を、ある物のそばに置いておく（歩いてこない）
function placeNear(name,o){
  const m=RT.map, sp=speakerSpec(name);
  const c=[[0,-1],[-1,0],[1,0],[-1,-1],[1,-1]].map(([dx,dy])=>[o.x+dx,o.y+dy]).find(([x,y])=>walkable(m,x,y)&&!(x===G.x&&y===G.y)); if(!c) return;
  const n={x:c[0],y:c[1],actorName:name,nm:name,role:'actor',idx:950+m.npcs.length,seed:hashStr(name),dir:'down',actor:1,home:{x:c[0],y:c[1],dir:'down',trip:[]}};
  if(sp.who) n.who=sp.who; else if(sp.bank) n.bank=sp.bank; else n.type=sp.type;
  m.npcs.push(n); (RT.staged=RT.staged||[]).push(n); return n;
}
