// ===== 世界地図 =====
// 地形は各地の雰囲気（町・雪・砂漠・沼・闇…）から自動で塗り分ける。まだ行っていない所は雲で隠す
const WM_PAD=14, WM_C=3;   // 地図のふち、地形の1マス（キャンバスの3ドット）
const WM_BIOME={
  plains:['#5f9e4a','#57934a','#4c8442'], forest:['#2f6e36','#2a6332','#24552b'], mount:['#8b8574','#7c7666','#6b6658'],
  hills:['#7d8f55','#72834e','#667546'], dark:['#3b3147','#352b40','#2b2335'], darkrock:['#4a4048','#433a42','#3a3239'],
  scorch:['#5c4a3c','#544336','#4a3a2f'], marsh:['#4f6b4a','#476243','#3e573b'], waste:['#8a7a5c','#7f7053','#73654a'],
  desert:['#d8b26a','#ccaa63','#c19e5a'], snow:['#e7eef5','#dce6ef','#cfdbe6'], ice:['#cde4f2','#bfd9ec','#b0cee3'],
  darkforest:['#2c2a45','#27253d','#222035'], void:['#2a1440','#24113a','#1d0d30'], mist:['#9aa3c0','#8f98b6','#848dab'],
  grave:['#5d6052','#56594c','#4e5145'], sea:null
};
const WM_THEME={village:'plains',city:'plains',town:'plains',port:'plains',library:'plains',sewer:'plains',tower:'plains',mountain:'mount',castle:'dark',
  forest:'forest',cave:'hills',burnt:'scorch',fort:'darkrock',marsh:'marsh',ruinfield:'waste',ship:'sea',desert:'desert',sandruin:'desert',snow:'snow',ice:'ice',
  holy:'snow',crypt:'snow',temple:'snow',shadow:'darkforest',abyss:'void',memory:'mist'};
const WM_LOC_BIOME={tomb:'grave'};
const WM_SPECIAL=['dark','darkrock','scorch','void','darkforest','waste','grave','marsh','mist'];
// 道（両はしに行けるようになったら描く）。sea:1 は船の道
const WM_EDGES=[['sora','mtpath'],['mtpath','castle'],['sora','halt'],['halt','lumiere'],['lumiere','forest'],['forest','gram'],['gram','mine'],['gram','burnt'],['burnt','fort1'],
  ['lumiere','sewer'],['lumiere','tower'],['lumiere','refuge'],['lumiere','azur'],['azur','ruth',1],['ruth','lhcave'],['ruth','marsh'],['marsh','garam'],['garam','battlefield'],['azur','wreck',1],
  ['azur','belka'],['belka','archive'],['belka','dura'],['dura','saha'],['saha','ruins'],['dura','fort2'],['dura','nest'],['refuge','hutte'],['hutte','canyon'],['canyon','sancta'],
  ['sancta','undercat'],['sancta','temple'],['temple','shadow'],['shadow','ruth'],['halt','hate'],['hate','abyss'],['castle','maze'],['archive','tomb']];
function wmPos(L){ const W=cv.width,H=cv.height; return [WM_PAD+L.x*(W-WM_PAD*2), WM_PAD+L.y*(H-WM_PAD*2)]; }
function wmNoise(x,y,s){ const h=Math.sin(x*12.9898+y*78.233+s*37.719)*43758.5453; return h-Math.floor(h); }
function wmSmooth(x,y,s){ const xi=Math.floor(x), yi=Math.floor(y), fx=x-xi, fy=y-yi, u=fx*fx*(3-2*fx), v=fy*fy*(3-2*fy);
  const a=wmNoise(xi,yi,s), b=wmNoise(xi+1,yi,s), c=wmNoise(xi,yi+1,s), d=wmNoise(xi+1,yi+1,s); return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v; }
function wmFbm(x,y,s){ return wmSmooth(x*6,y*6,s)*0.55+wmSmooth(x*13,y*13,s+1)*0.3+wmSmooth(x*27,y*27,s+2)*0.15; }
// 地形の絵（雲をのぞく）は、地図の大きさが変わったときだけ作り直す
function wmTerrain(){
  const W=cv.width,H=cv.height, key=W+'x'+H; if(WM.terrain&&WM.tkey===key) return WM.terrain;
  const gw=Math.ceil(W/WM_C), gh=Math.ceil(H/WM_C), locs=Object.entries(LOCS).map(([id,L])=>({id,L,b:WM_LOC_BIOME[id]||WM_THEME[L.theme]||'plains'}));
  const land=locs.filter(o=>o.b!=='sea'), mw=W-WM_PAD*2, mh=H-WM_PAD*2;
  const grid=new Array(gw*gh), isLand=new Uint8Array(gw*gh);
  for(let gy=0;gy<gh;gy++) for(let gx=0;gx<gw;gx++){
    const px=(gx+0.5)*WM_C, py=(gy+0.5)*WM_C, nx=(px-WM_PAD)/mw, ny=(py-WM_PAD)/mh;
    let f=0; for(const o of land){ const d=Math.hypot((nx-o.L.x)*1.0,(ny-o.L.y)*1.15); f=Math.max(f,1-d/0.15); }
    f+= (wmFbm(nx,ny,3)-0.5)*0.55;
    { const w1=0.603+(wmFbm(0.3,ny*1.6,41)-0.5)*0.11, w2=0.664+(wmFbm(0.7,ny*1.6,43)-0.5)*0.08; const top=0.33+(wmFbm(nx,0.2,45)-0.5)*0.06; if(nx>w1 && nx<w2 && ny>top) f-=0.9; }   // アズールと東の岸のあいだの海
    if(Math.hypot(nx-0.72,(ny-0.71)*1.1)<0.07) f-=0.8;          // 沈没船の海
    const wx=nx+(wmFbm(nx,ny,7)-0.5)*0.12, wy=ny+(wmFbm(nx,ny,9)-0.5)*0.12;
    let best=null,bd=9,base=null,bb=9; for(const o of land){ const d=Math.hypot(wx-o.L.x,(wy-o.L.y)*1.1); if(d<bd){bd=d;best=o;} if(!WM_SPECIAL.includes(o.b)&&d<bb){bb=d;base=o;} }
    if(WM_SPECIAL.includes(best.b) && bd>0.075 && base) best=base;
    isLand[gy*gw+gx]=f>0.18?1:0; grid[gy*gw+gx]={b:best.b, f};
  }
  const c=document.createElement('canvas'); c.width=gw; c.height=gh; const g=c.getContext('2d'); const img=g.createImageData(gw,gh);
  const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const put=(gx,gy,rgb)=>{ const i=(gy*gw+gx)*4; img.data[i]=rgb[0]; img.data[i+1]=rgb[1]; img.data[i+2]=rgb[2]; img.data[i+3]=255; };
  const L=(x,y)=> x>=0&&y>=0&&x<gw&&y<gh&&isLand[y*gw+x];
  for(let gy=0;gy<gh;gy++) for(let gx=0;gx<gw;gx++){
    const k=gy*gw+gx, cell=grid[k];
    if(!isLand[k]){ let near=0; for(let r=1;r<=4&&!near;r++) for(const [dx,dy] of [[r,0],[-r,0],[0,r],[0,-r]]) if(L(gx+dx,gy+dy)) near=r;
      const n=wmNoise(gx,gy,5); put(gx,gy, hex(near===1?'#5aa7d6':near&&near<=3?'#2f7fb8':(n<0.04?'#2a6aa0':'#1f5d93'))); continue; }
    const pal=WM_BIOME[cell.b]||WM_BIOME.plains; const coast=!L(gx+1,gy)||!L(gx-1,gy)||!L(gx,gy+1)||!L(gx,gy-1);
    const n=wmFbm(gx/gw,gy/gh,11); let col=pal[n<0.42?2:n<0.58?1:0];
    if(coast && ['plains','desert','hills','forest','waste'].includes(cell.b)) col='#e2cf98';
    put(gx,gy,hex(col));
  }
  g.putImageData(img,0,0);
  // 飾り（木・山・砂丘など）。町やダンジョンのまわりは空けておく
  const spots=locs.map(o=>[((WM_PAD+o.L.x*mw)/WM_C),((WM_PAD+o.L.y*mh)/WM_C)]);
  const px=(x,y,h)=>{ if(x<0||y<0||x>=gw||y>=gh) return; g.fillStyle=h; g.fillRect(x,y,1,1); };
  for(let gy=2;gy<gh-2;gy++) for(let gx=2;gx<gw-2;gx++){
    const k=gy*gw+gx; if(!isLand[k]) continue; const b=grid[k].b, r=wmNoise(gx,gy,13);
    if(spots.some(([sx,sy])=>Math.abs(sx-gx)<5&&Math.abs(sy-gy)<5)) continue;
    if(!(L(gx-1,gy)&&L(gx+1,gy)&&L(gx,gy+1))) continue;
    if(b==='forest'&&r<0.16){ px(gx,gy-1,'#3f8a46'); px(gx-1,gy,'#2f6e36'); px(gx,gy,'#2f6e36'); px(gx+1,gy,'#1f4a25'); px(gx,gy+1,'#5b3a1e'); }
    else if(b==='plains'&&r<0.025){ px(gx,gy-1,'#3f8a46'); px(gx,gy,'#2f6e36'); px(gx,gy+1,'#5b3a1e'); }
    else if(b==='mount'&&r<0.06){ px(gx,gy-2,'#f1f5f9'); px(gx-1,gy-1,'#a8a294'); px(gx,gy-1,'#cbd5e1'); px(gx+1,gy-1,'#5a554c'); for(let i=-2;i<=2;i++) px(gx+i,gy,i<0?'#9a9484':'#5a554c'); }
    else if(b==='hills'&&r<0.05){ px(gx-1,gy,'#8a9c60'); px(gx,gy-1,'#9aac6c'); px(gx+1,gy,'#5e6d40'); px(gx,gy,'#72834e'); }
    else if(b==='snow'&&r<0.06){ px(gx,gy-1,'#9fb7c9'); px(gx-1,gy,'#6f8ea8'); px(gx,gy,'#86a3ba'); px(gx+1,gy,'#5a778f'); px(gx,gy+1,'#5b3a1e'); }
    else if(b==='desert'&&r<0.03){ px(gx-1,gy,'#e8c98a'); px(gx,gy,'#b8924f'); px(gx+1,gy,'#e8c98a'); }
    else if(b==='marsh'&&r<0.08){ px(gx,gy,'#3f7fa8'); px(gx+1,gy,'#3f7fa8'); px(gx,gy-1,'#7a9a52'); }
    else if((b==='dark'||b==='darkrock'||b==='scorch')&&r<0.04){ px(gx,gy-1,'#1a141f'); px(gx,gy,'#1a141f'); px(gx-1,gy-1,'#1a141f'); px(gx+1,gy-2,'#1a141f'); }
    else if(b==='darkforest'&&r<0.14){ px(gx,gy-1,'#3b3760'); px(gx-1,gy,'#2c2a45'); px(gx,gy,'#2c2a45'); px(gx+1,gy,'#1b1930'); }
    else if(b==='void'&&r<0.05){ px(gx,gy,'#a855f7'); px(gx+1,gy+1,'#7e22ce'); }
    else if(b==='waste'&&r<0.03){ px(gx,gy,'#e7e0cf'); px(gx+1,gy,'#cfc6b0'); }
    else if(b==='grave'&&r<0.04){ px(gx,gy-1,'#c8c8c0'); px(gx-1,gy,'#c8c8c0'); px(gx,gy,'#c8c8c0'); px(gx+1,gy,'#c8c8c0'); px(gx,gy+1,'#c8c8c0'); }
    else if(b==='ice'&&r<0.04){ px(gx,gy-1,'#ffffff'); px(gx,gy,'#9fd0ee'); }
  }
  WM.grid={gw,gh,grid,isLand}; WM.tkey=key; WM.terrain=c; WM.fkey=null; return c;
}
// 雲（まだ行っていない所）。行ける場所が増えたら作り直す
function wmFog(){
  const W=cv.width,H=cv.height, seen=[...new Set([...G.unlocked,...Object.keys(G.visited||{})])].filter(id=>LOCS[id]);
  const key=W+'x'+H+'|'+seen.sort().join(','); if(WM.fog&&WM.fkey===key) return WM.fog;
  const gw=Math.ceil(W/WM_C), gh=Math.ceil(H/WM_C), mw=W-WM_PAD*2, mh=H-WM_PAD*2, pts=seen.map(id=>LOCS[id]);
  const segs=WM_EDGES.filter(([a,b])=>G.unlocked.includes(a)&&G.unlocked.includes(b)&&LOCS[a]&&LOCS[b]).map(([a,b])=>[LOCS[a],LOCS[b]]);
  const segD=(px,py,A,B)=>{ const vx=B.x-A.x, vy=(B.y-A.y)*1.1, wx=px-A.x, wy=(py-A.y)*1.1, t=Math.max(0,Math.min(1,(wx*vx+wy*vy)/(vx*vx+vy*vy||1))); return Math.hypot(wx-vx*t,wy-vy*t); };
  const c=document.createElement('canvas'); c.width=gw; c.height=gh; const g=c.getContext('2d'); const img=g.createImageData(gw,gh);
  for(let gy=0;gy<gh;gy++) for(let gx=0;gx<gw;gx++){
    const nx=((gx+0.5)*WM_C-WM_PAD)/mw, ny=((gy+0.5)*WM_C-WM_PAD)/mh; let d=9; for(const L of pts) d=Math.min(d,Math.hypot(nx-L.x,(ny-L.y)*1.1)-0.03); for(const [A,B] of segs) d=Math.min(d,segD(nx,ny,A,B));
    const n=wmFbm(nx,ny,21); const t=Math.max(0,Math.min(1,(d-0.085-n*0.05)/0.05)); if(t<=0) continue;
    const i=(gy*gw+gx)*4, hi=wmFbm(nx*1.7,ny*1.7,23), v=hi>0.58?214:hi>0.48?192:170; img.data[i]=v-22; img.data[i+1]=v-12; img.data[i+2]=v+6; img.data[i+3]=Math.round(t*245);
  }
  g.putImageData(img,0,0); WM.fkey=key; WM.fog=c; return c;
}
const WM={terrain:null,tkey:null,fog:null,fkey:null,sel:null,labels:null,lkey:null};
// 場所の絵（町・ダンジョンの種類ごと）
function wmIcon(id,L,x,y){
  const R=(a,b,w,h,c)=>{ cx.fillStyle=c; cx.fillRect(Math.round(x+a),Math.round(y+b),w,h); };
  const t=L.theme, post=L.post;
  R(-7,4,14,2,'#0005');
  if(L.type!=='dungeon'){
    if(L.type==='city'){ R(-8,-4,16,8,'#e8dcc0'); R(-8,-6,16,2,'#8b5a2b'); R(-6,-12,4,8,'#cbd5e1'); R(2,-12,4,8,'#cbd5e1'); R(-6,-14,4,2,'#3b6fb0'); R(2,-14,4,2,'#3b6fb0'); R(-2,-9,4,5,'#e8dcc0'); R(-2,-11,4,2,'#b91c1c'); R(-1,0,2,4,'#5b3a1e'); }
    else if(L.type==='town'){ R(-8,-3,7,7,'#e8dcc0'); R(-9,-6,9,3,'#b4413a'); R(1,-4,7,8,'#e8dcc0'); R(0,-7,9,3,t==='port'?'#3b6fb0':'#b4413a'); R(-6,0,2,4,'#5b3a1e'); R(3,0,2,4,'#5b3a1e'); }
    else { R(-5,-3,10,7,t==='snow'?'#f1f5f9':t==='desert'?'#e8c98a':t==='shadow'?'#4c4566':'#e8dcc0'); R(-6,-6,12,3,t==='snow'?'#64748b':t==='shadow'?'#2c2a45':'#b4413a'); R(-1,0,2,4,'#5b3a1e'); if(t==='holy'){} }
    if(t==='holy'){ R(-1,-16,2,6,'#fbbf24'); R(-3,-14,6,2,'#fbbf24'); }
    return; }
  const D={
    castle:()=>{ R(-7,-6,14,10,'#2b2335'); R(-8,-10,4,6,'#2b2335'); R(4,-10,4,6,'#2b2335'); R(-2,-13,4,7,'#2b2335'); R(-1,-2,2,6,'#dc2626'); R(-7,-11,2,1,'#7c3aed'); R(5,-11,2,1,'#7c3aed'); },
    fort:()=>{ R(-7,-4,14,8,'#3a3239'); for(let i=-7;i<7;i+=4) R(i,-6,2,2,'#3a3239'); R(5,-12,1,8,'#1a141f'); R(6,-12,4,3,'#b91c1c'); R(-1,0,2,4,'#000'); },
    tower:()=>{ R(-3,-15,6,19,'#e5e7eb'); R(-4,-17,8,3,'#fbbf24'); R(-1,-10,2,3,'#3b6fb0'); R(-1,-3,2,3,'#3b6fb0'); },
    cave:()=>{ R(-8,-4,16,8,'#6b6658'); R(-6,-7,12,3,'#7c7666'); R(-3,-2,6,6,'#111'); },
    mountain:()=>{ R(-8,0,16,4,'#6b6658'); R(-6,-4,12,4,'#7c7666'); R(-3,-8,6,4,'#8b8574'); R(-1,-10,3,2,'#f1f5f9'); },
    forest:()=>{ for(const [a,b] of [[-6,-2],[0,-6],[4,-1]]){ R(a-2,b,6,5,'#2f6e36'); R(a,b-2,2,2,'#3f8a46'); R(a,b+5,2,2,'#5b3a1e'); } },
    burnt:()=>{ R(-7,-2,6,6,'#3a2a20'); R(1,-4,6,8,'#3a2a20'); R(-6,-4,1,2,'#1a141f'); R(3,-6,1,2,'#1a141f'); R(-3,-9,2,3,'#f97316'); R(-2,-11,1,2,'#fde047'); },
    marsh:()=>{ R(-8,0,16,4,'#3f7fa8'); R(-6,-6,1,6,'#7a9a52'); R(-2,-8,1,8,'#7a9a52'); R(3,-5,1,5,'#7a9a52'); R(-2,-9,1,2,'#8b5a2b'); },
    ruinfield:()=>{ R(-7,-6,3,10,'#cfc6b0'); R(-1,-3,3,7,'#cfc6b0'); R(4,-8,3,12,'#cfc6b0'); R(5,-10,1,2,'#cfc6b0'); R(-4,2,3,2,'#8a7a5c'); },
    ship:()=>{ R(-8,0,16,4,'#5b3a1e'); R(-6,-2,12,2,'#7a5230'); R(-1,-14,1,12,'#3b2412'); R(0,-12,6,6,'#e8dcc0'); },
    library:()=>{ R(-8,-4,16,8,'#a8a294'); R(-9,-7,18,3,'#6b6658'); for(let i=-6;i<7;i+=4) R(i,-3,2,7,'#e5e7eb'); },
    desert:()=>{ R(-6,-6,12,10,'#fde047'); R(-4,-8,8,2,'#fef9c3'); R(-1,-12,2,4,'#fef08a'); },
    sandruin:()=>{ R(-8,-2,16,6,'#c19e5a'); R(-5,-8,10,6,'#d8b26a'); R(-2,-12,4,4,'#e8c98a'); R(-1,-1,2,5,'#3a2a20'); },
    ice:()=>{ R(-8,0,16,4,'#9fd0ee'); R(-6,-8,4,8,'#cde4f2'); R(1,-10,4,10,'#e7f3fb'); R(5,-5,3,5,'#bfd9ec'); },
    crypt:()=>{ R(-6,-6,12,10,'#6b6f60'); R(-2,-12,4,6,'#c8c8c0'); R(-4,-10,8,2,'#c8c8c0'); R(-2,0,4,4,'#111'); },
    temple:()=>{ R(-9,2,18,2,'#e5e7eb'); for(let i=-7;i<8;i+=4) R(i,-6,2,8,'#e5e7eb'); R(-9,-9,18,3,'#cbd5e1'); R(-6,-11,12,2,'#cbd5e1'); },
    sewer:()=>{ R(-6,-4,12,8,'#57534e'); R(-4,-2,8,6,'#111'); R(-4,2,8,2,'#4a90d0'); },
    abyss:()=>{ const s=Math.sin(RT.anim/9); cx.fillStyle='#1d0d30'; cx.beginPath(); cx.arc(x,y,9,0,7); cx.fill(); cx.strokeStyle=`rgba(168,85,247,${0.6+0.3*s})`; cx.lineWidth=2; cx.beginPath(); cx.arc(x,y,6,0,4.5); cx.stroke(); },
    memory:()=>{ const s=0.6+0.4*Math.sin(RT.anim/10); R(-5,-12,10,16,'#4c1d95'); cx.fillStyle=`rgba(196,181,253,${s})`; cx.fillRect(Math.round(x-3),Math.round(y-10),6,13); },
  };
  (D[t]||D.cave)();
  if(id==='nest'){ const s=0.5+0.5*Math.sin(RT.anim/7); cx.fillStyle=`rgba(253,224,71,${s})`; cx.fillRect(Math.round(x-1),Math.round(y-16),2,4); cx.fillRect(Math.round(x-3),Math.round(y-15),6,2); }
  if(post && t!=='memory'){ cx.fillStyle='#c4b5fd'; cx.fillRect(Math.round(x+6),Math.round(y-12),3,3); }
}
function wmShort(n){ return n.replace(/^(宿場町|王都|鉱山町|港町|灯台の村|傭兵の町|学術都市|荒野の宿場|オアシスの村|雪の村|大聖堂の町|最果ての村)/,''); }
function wmList(){ const cur=G.loc; const L0=LOCS[cur]||LOCS.sora; return G.unlocked.filter(id=>LOCS[id]).slice().sort((a,b)=>(b===G.next)-(a===G.next)||(Math.hypot(LOCS[a].x-L0.x,LOCS[a].y-L0.y)-Math.hypot(LOCS[b].x-L0.x,LOCS[b].y-L0.y))); }
function drawWorld(){
  const W=cv.width,H=cv.height;
  cx.imageSmoothingEnabled=false; cx.fillStyle='#1f5d93'; cx.fillRect(0,0,W,H);
  cx.drawImage(wmTerrain(),0,0,Math.ceil(W/WM_C)*WM_C,Math.ceil(H/WM_C)*WM_C);
  // 波のきらめき
  const gr=WM.grid; if(gr){ for(let i=0;i<14;i++){ const gx=Math.floor(wmNoise(i,Math.floor(RT.anim/40),31)*gr.gw), gy=Math.floor(wmNoise(i,Math.floor(RT.anim/40),33)*gr.gh); if(!gr.isLand[gy*gr.gw+gx]){ cx.fillStyle='#bfe3ff'; cx.fillRect(gx*WM_C,gy*WM_C,WM_C*2,1); } } }
  // 物語が進むと空が暗くなる
  if(G.chapter>=5 && !(G.flags&&G.flags.cleared)){ cx.fillStyle='rgba(40,10,60,.28)'; cx.fillRect(0,0,W,H); }
  // 道
  const ok=id=>G.unlocked.includes(id)&&LOCS[id];
  for(const [a,b,sea] of WM_EDGES){ if(!ok(a)||!ok(b)) continue; const [x1,y1]=wmPos(LOCS[a]), [x2,y2]=wmPos(LOCS[b]); const n=Math.max(1,Math.floor(Math.hypot(x2-x1,y2-y1)/(sea?7:4)));
    for(let i=1;i<n;i++){ const k=i/n, x=Math.round(x1+(x2-x1)*k), y=Math.round(y1+(y2-y1)*k+Math.sin(k*Math.PI)*0); cx.fillStyle=sea?'#e0f2fe':'#f3e3b8'; cx.fillRect(x,y,sea?3:2,sea?1:2); } }
  cx.drawImage(wmFog(),0,0,Math.ceil(W/WM_C)*WM_C,Math.ceil(H/WM_C)*WM_C);
  // 空のヒビ
  if(G.chapter>=1 && !(G.flags&&G.flags.cleared)){ const big=G.chapter>=5; cx.strokeStyle=big?'#e9d5ffcc':'#c084fc99'; cx.lineWidth=big?3:2; cx.beginPath(); cx.moveTo(W*0.18,0); cx.lineTo(W*0.28,H*0.05); cx.lineTo(W*0.24,H*0.1); cx.lineTo(W*0.34,H*(big?0.2:0.15)); if(big){ cx.lineTo(W*0.3,H*0.26); cx.moveTo(W*0.28,H*0.05); cx.lineTo(W*0.42,H*0.07); } cx.stroke(); }
  // 場所
  const vis=G.unlocked.filter(id=>LOCS[id]);
  for(const id of vis){ const L=LOCS[id], [x,y]=wmPos(L);
    if(id===G.next){ const r=11+Math.sin(RT.anim/8)*2; cx.strokeStyle='#facc15'; cx.lineWidth=2; cx.beginPath(); cx.arc(x,y-2,r,0,7); cx.stroke(); }
    wmIcon(id,L,x,y);
    if(id===WM.sel){ const s=Math.round(Math.sin(RT.anim/6)); cx.strokeStyle='#fff'; cx.lineWidth=2; const a=13+s;
      for(const [dx,dy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ cx.beginPath(); cx.moveTo(x+dx*a,y-2+dy*(a-5)); cx.lineTo(x+dx*a,y-2+dy*a); cx.lineTo(x+dx*(a-5),y-2+dy*a); cx.stroke(); } }
  }
  // 名前（重ならないように置く）
  const lk=W+'x'+H+'|'+vis.join(',')+'|'+WM.sel; if(WM.lkey!==lk){ WM.lkey=lk; cx.font='bold 10px sans-serif'; const boxes=[], out=[];
    const order=vis.slice().sort((a,b)=>(b===WM.sel)-(a===WM.sel)||(b===G.next)-(a===G.next)||(b===G.loc)-(a===G.loc));
    for(const id of order){ const [x,y]=wmPos(LOCS[id]), tx=wmShort(LOCS[id].n), w=Math.ceil(cx.measureText(tx).width)+8, h=14;
      const cand=[[x-w/2,y+7],[x-w/2,y-31],[x+12,y-9],[x-12-w,y-9]]; let put=null;
      for(const [bx,by] of cand){ const bb=[bx,by,w,h]; if(bx<2||by<2||bx+w>W-2||by+h>H-2) continue; if(boxes.some(o=>bx<o[0]+o[2]&&bx+w>o[0]&&by<o[1]+o[3]&&by+h>o[1])) continue; put=bb; break; }
      if(!put && (id===WM.sel||id===G.next)) put=[Math.max(2,Math.min(W-w-2,x-w/2)),y+7,w,h];
      if(put){ boxes.push(put); out.push([id,tx,...put]); } }
    WM.labels=out; }
  cx.font='bold 10px sans-serif'; cx.textAlign='center'; cx.textBaseline='middle';
  for(const [id,tx,bx,by,w,h] of WM.labels||[]){ cx.fillStyle=id===WM.sel?'#facc15e6':'rgba(10,14,28,.72)'; cx.beginPath(); cx.roundRect?cx.roundRect(bx,by,w,h,4):cx.rect(bx,by,w,h); cx.fill(); cx.fillStyle=id===WM.sel?'#111':(id===G.next?'#fde68a':'#f1f5f9'); cx.fillText(tx,bx+w/2,by+h/2+0.5); }
  cx.textBaseline='alphabetic';
  // いまいる所
  if(G.loc && LOCS[G.loc]){ const [x,y]=wmPos(LOCS[G.loc]); drawSprite(Math.round(x-16),Math.round(y-40+Math.sin(RT.anim/6)*2),LOOK['アルト'],0,'down'); }
}
function wmCard(){
  const id=WM.sel, L=LOCS[id]; if(!L) return;
  const here=id===G.loc;
  $('panel').innerHTML=`<div class="ptitle"><span>どこへ行く？</span><span>目的：${G.obj||'―'}</span></div>
    <div class="wcard"><span class="tag slab w5">${L.type==='dungeon'?'ダンジョン':'町'}</span><div class="grow"><div class="wnm">${L.n}${id===G.next?' <span class="tag" style="background:#854d0e;color:#fde68a">目的地</span>':''}${!G.visited[id]?' <span class="tag" style="color:var(--gold)">NEW</span>':''}</div><small>目安 Lv${locLv(id)}${L.post&&id==='maze'?`〜（第${Math.min(G.frag,11)+1}の迷宮）`:''}${here?'　<span style="color:#93c5fd">いまいる所</span>':''}</small></div></div>
    <div class="wbtns"><button class="cb" id="wPrev">◀</button><button class="bigb" id="wGo">${here?'もう一度入る':'ここへ行く'}</button><button class="cb" id="wNext">▶</button></div>
    <button class="cb sm" id="wMenu">メニュー</button>`;
  const list=wmList(); const step=d=>{ const i=list.indexOf(WM.sel); WM.sel=list[(i+d+list.length)%list.length]; sfx('tick'); wmCard(); };
  $('wPrev').onclick=()=>step(-1); $('wNext').onclick=()=>step(1);
  $('wGo').onclick=()=>{ sfx('ok'); travelTo(WM.sel); };
  $('wMenu').onclick=()=>{ openMenuFromWorld(); };
}
function openWorld(){
  RT.mode='world'; $('padField').style.display='none'; renderTop(); bgm('world');
  const list=wmList(); if(!list.includes(WM.sel)) WM.sel=G.unlocked.includes(G.next)?G.next:(list[0]||'sora');
  showPanel('<div></div>'); wmCard();
}
cv.addEventListener('pointerdown',e=>{
  if(RT.mode!=='world' || RT.busy) return; const r=cv.getBoundingClientRect(); const x=(e.clientX-r.left)*(cv.width/r.width), y=(e.clientY-r.top)*(cv.height/r.height);
  let best=null,bd=1e9; for(const id of G.unlocked){ if(!LOCS[id]) continue; const [px,py]=wmPos(LOCS[id]); const d=Math.hypot(px-x,py-2-y); if(d<bd){bd=d;best=id;} }
  if(best&&bd<26){ if(WM.sel===best){ sfx('ok'); travelTo(best); } else { WM.sel=best; sfx('tick'); wmCard(); } }
});
