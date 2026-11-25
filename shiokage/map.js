import { drawTownProp, drawTownFloor, townPropSize, townPropBounds } from './town-landmarks.js';
import { adventureAppearance, adventureTerrainClear, drawAdventureGround, drawAdventureObject } from './adventure-terrain.js';

const TAU = Math.PI * 2;
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function random(seed) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

const palettes = {
  port: { grass: '#34473f', patches: ['#394c40','#3c4f41','#455246','#2c443d','#536051'], low: '#223c35', track: '#75674f', track2: '#8a785c', track3: '#625b49', leaf: '#284138', leaf2: '#3f5b49', leaf3: '#526950', water: '#27465a', wave: '#5e8190', roof: '#41616b', roof2: '#344c58', roof3: '#637d7d', stone: '#82745d', light: '#ffe1a0' },
  moor: { grass: '#43513b', patches: ['#4a5940','#485a40','#506648','#3d4e36','#5b6549'], low: '#293e30', track: '#806f53', track2: '#918264', track3: '#716953', leaf: '#29412f', leaf2: '#3e583c', leaf3: '#57694a', water: '#304c55', wave: '#729099', roof: '#786349', roof2: '#5c4937', roof3: '#a38862', stone: '#8a7a62', light: '#f9d796' },
  cave: { grass: '#3a3e3e', patches: ['#393c3c','#444743','#4a4c46','#454341','#50514b'], low: '#222b2d', track: '#55534a', track2: '#686454', track3: '#494745', leaf: '#314139', leaf2: '#40574a', leaf3: '#57766c', water: '#263d4a', wave: '#659dad', roof: '#454a52', roof2: '#343942', roof3: '#646f75', stone: '#777365', light: '#ffcc82' },
  frost: { grass: '#596a69', patches: ['#627572','#74837f','#546864','#66787a','#879492'], low: '#3e5856', track: '#7b7a6b', track2: '#979681', track3: '#687467', leaf: '#39554e', leaf2: '#526d61', leaf3: '#94a79b', water: '#38536b', wave: '#7eaeae', roof: '#4c6372', roof2: '#3e4f5d', roof3: '#8295a0', stone: '#9d9990', light: '#d8ebbd' },
  ember: { grass: '#50433c', patches: ['#5b473b','#574638','#594e43','#614b3a','#634d47'], low: '#342e2e', track: '#766050', track2: '#8e725a', track3: '#68584b', leaf: '#453c2f', leaf2: '#574d39', leaf3: '#756047', water: '#413846', wave: '#866176', roof: '#704d49', roof2: '#533839', roof3: '#866454', stone: '#907262', light: '#ffcf82' },
  shrine: { grass: '#494c51', patches: ['#4b4d54','#55575c','#404750','#4e525c','#5c5b60'], low: '#2c333d', track: '#6a6968', track2: '#84817a', track3: '#565759', leaf: '#3b4c48', leaf2: '#4d5551', leaf3: '#5c6862', water: '#28394f', wave: '#697996', roof: '#656875', roof2: '#454c60', roof3: '#808191', stone: '#8a8378', light: '#e7d2a8' }
};

function rect(ctx, fill, x, y, w, h) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function poly(ctx, fill, points) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  for (const [x, y] of points) ctx.lineTo(Math.round(x), Math.round(y));
  ctx.closePath();
  ctx.fill();
}

function round(ctx, fill, x, y, rx, ry) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.fill();
}

function line(ctx, fill, x, y, X, Y, width = 1) {
  ctx.strokeStyle = fill;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(X, Y);
  ctx.stroke();
}

function segment(x, y, a, b) {
  const h = clamp(((x - a[0]) * (b[0] - a[0]) + (y - a[1]) * (b[1] - a[1])) / ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2), 0, 1);
  return Math.hypot(x - a[0] - (b[0] - a[0]) * h, y - a[1] - (b[1] - a[1]) * h);
}

function trailAt(scene, x, y) {
  let nearest = Infinity;
  for (const path of scene.paths ?? []) {
    for (let i = 1; i < path.length; i++) nearest = Math.min(nearest, segment(x, y, path[i - 1], path[i]));
  }
  return nearest;
}

function coast(scene, x) {
  return (scene.shore ?? -200) + 17 * Math.sin(x / 96) + 8 * Math.sin(x / 43 + 1);
}

function onBridge(scene,x,y) {
  return scene.bridges?.some(([left,right,top,bottom])=>x>=left&&x<=right&&y>=top&&y<=bottom);
}

export function inTerrain(scene, x, y) {
  if(scene.field) return adventureTerrainClear(scene,x,y);
  if (x < 22 || y < 23 || x > scene.width - 22 || y > scene.height - 21) return false;
  if (scene.pier && x >= scene.pier[0] && x <= scene.pier[1] && y >= scene.pier[2] && y <= scene.pier[3]) return true;
  if (onBridge(scene,x,y)) return true;
  if (y < coast(scene, x) + 3) return false;
  if (scene.kind === 'cave' && trailAt(scene, x, y) > (scene.caveWidth ?? 63)) return false;
  for (const [cx, cy, rx, ry] of scene.lakes ?? []) {
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) return false;
  }
  return true;
}

function propSize(kind, size) {
  const special=townPropSize(kind,size);
  if(special) return special;
  if (kind === 'house') return [53 * size, 27 * size];
  if (kind === 'tower') return [26 * size, 22 * size];
  if (kind === 'ruin') return [35 * size, 18 * size];
  if (kind === 'rock') return [14 * size, 8 * size];
  if (kind === 'tree') return [11 * size, 9 * size];
  if (kind === 'crate' || kind === 'well') return [12 * size, 9 * size];
  return [0, 0];
}

function coverBounds(prop) {
  const special=townPropBounds(prop);
  if(special) return special;
  const bounds={house:[75,103],tower:[35,157],ruin:[39,82],tree:[40,68]};
  return bounds[prop.kind]?.map(value=>value*prop.size)??null;
}

function makeProps(scene) {
  const rng = random(scene.seed * 8517 + 13);
  const built = (scene.props ?? []).map(([kind, x, y, size = 1, variant = 0], i) => ({ kind, x, y, size, variant, seed: 97 + i * 151 }));
  const preserve = [...(scene.exits ?? []), ...(scene.objects ?? []), ...(scene.people ?? []), scene.entry].filter(Boolean);
  for (let i = 0; i < (scene.scatter ?? 115); i++) {
    const x = Math.round(22 + rng() * (scene.width - 44));
    const y = Math.round(42 + rng() * (scene.height - 64));
    if (!inTerrain(scene,x,y) || y < coast(scene, x) + 19 || trailAt(scene,x,y) < (scene.pathWidth ?? 24) + 13) continue;
    if (preserve.some(p => distance(p, { x, y }) < 60) || built.some(p => distance(p, { x, y }) < 33)) continue;
    const r = rng();
    const kind = r < .58 ? 'tuft' : r < .82 ? 'tree' : 'rock';
    const part = scene.kind === 'cave' && kind === 'tree' ? 'crystal' : kind;
    built.push({ kind: part, x, y, size: .64 + rng() * .59, variant: rng(), seed: 178 + i * 113 });
  }
  for(const prop of built){
    prop.footprint=propSize(prop.kind,prop.size);
    prop.cover=coverBounds(prop);
  }
  return built;
}

function stampFloor(scene, palette) {
  const canvas = document.createElement('canvas');
  canvas.width = scene.width;
  canvas.height = scene.height;
  const ctx = canvas.getContext('2d', { alpha: false });
  const rng = random(scene.seed * 100631 + 323);
  rect(ctx, palette.grass, 0, 0, scene.width, scene.height);
  for (let y = 0; y < scene.height; y += 5) {
    for (let x = 0; x < scene.width; x += 5) {
      const r = rng();
      const dy = y - coast(scene, x);
      const trail = trailAt(scene, x, y);
      const lake = (scene.lakes ?? []).some(([cx,cy,rx,ry]) => ((x-cx)/rx)**2 + ((y-cy)/ry)**2 < 1);
      if (dy < 0 || lake) {
        rect(ctx, palette.water, x, y, 5, 5);
        if (r < .16) rect(ctx, '#172e4290', x, y, 5, 3);
        if (dy > -7 && dy < 0) rect(ctx, '#81928a70', x, y + 1, 5, 2);
      } else if (scene.kind === 'cave' && trail > (scene.caveWidth ?? 63)) {
        rect(ctx, palette.low, x, y, 5, 5);
        if (r < .43) rect(ctx, '#111c245e', x, y, 3 + r * 6, 3);
        if (trail < (scene.caveWidth ?? 63) + 11) rect(ctx, '#676b5b', x + 1, y + 1, 4, 3);
      } else if (trail < (scene.pathWidth ?? 24) + r * 5) {
        rect(ctx, r < .64 ? palette.track : r < .80 ? palette.track2 : palette.track3, x, y, 5, 5);
        if (scene.paving && (x % 15 === 0 || y % 10 === 0)) rect(ctx, '#302e3355', x, y, x % 15 === 0 ? 1 : 5, y % 10 === 0 ? 1 : 4);
      } else if (dy < 18) {
        rect(ctx, palette.track3, x, y, 5, 5);
        if (r < .67) rect(ctx, palette.track2, x, y + 3, 5, 2);
      } else {
        const speck = Math.sin(x / 39) + Math.cos(y / 49) + Math.sin((x + y) / 53);
        if (r < .52 || speck > 1) rect(ctx, palette.patches[Math.floor((r + .08) * 4 + (speck > 0 ? 1 : 0)) % 5], x, y, 5, 5);
        if (r < .105) rect(ctx, '#89926d5a', x, y + 1, 2, 1);
        if (r > .96) rect(ctx, '#1d302b88', x + 1, y + 3, 4, 1);
      }
    }
  }
  if (scene.pier) {
    const [a,b,c,d] = scene.pier;
    rect(ctx, '#0e2035a1', a-9, c+7, b-a+19, d-c+13);
    rect(ctx, '#6f5746', a, c, b-a, d-c);
    for (let y = c; y < d; y += 7) {
      rect(ctx, y % 3 === 0 ? '#957452' : '#7c6149', a + 1, y, b-a-2, 5);
      rect(ctx, '#b0956d86', a + 7, y + 1, b-a-16, 1);
    }
    for (let y = c+3; y < d; y+=23) {
      rect(ctx, '#3c3430', a-1, y, 5, 7);
      rect(ctx, '#3c3430', b-4, y, 5, 7);
    }
  }
  drawTownFloor(ctx,scene);
  return canvas;
}

function drawHouse(ctx, p, palette) {
  const { x, y, size: s, variant } = p;
  const w = 58 * s;
  const wallH = 40 * s;
  const roofH = 43 * s;
  const top = y - wallH;
  const rng = random(p.seed);
  const face = variant === 2 ? '#70675c' : palette.stone;
  round(ctx,'#131c1f63',x + 3*s,y + 1,w + 7*s,17*s);
  poly(ctx,'#0d17194d',[[x-w,y],[x+w,y],[x+w+28*s,y-48*s],[x-w+13*s,y-49*s]]);
  rect(ctx,'#2e3430',x-w,top,w*2,wallH);
  rect(ctx,face,x-w+2*s,top,w*2-4*s,wallH-4*s);
  rect(ctx,'#423a36',x-w,top,w*2,5*s);
  for (let i=0;i<51;i++) {
    const px=x-w+4*s+rng()*(w*2-9*s), py=top+6*s+rng()*(wallH-12*s);
    rect(ctx,i%3===0?'#c6a98651':'#382e2e42',px,py,s*(2+rng()*8),s);
  }
  for (const k of [-1,1]) {
    rect(ctx,'#3a3330',x+k*w*.60-9*s,top+10*s,19*s,19*s);
    rect(ctx,'#d9a25f',x+k*w*.60-7*s,top+12*s,15*s,13*s);
    rect(ctx,'#ffe2a0aa',x+k*w*.60-6*s,top+13*s,13*s,2*s);
    rect(ctx,'#664734',x+k*w*.60,top+11*s,2*s,16*s);
    rect(ctx,'#664734',x+k*w*.60-8*s,top+18*s,16*s,2*s);
  }
  rect(ctx,'#302e2a',x-12*s,y-29*s,24*s,28*s);
  rect(ctx,'#574539',x-9*s,y-26*s,18*s,25*s);
  rect(ctx,'#987354',x-7*s,y-25*s,2*s,24*s);
  rect(ctx,'#d6aa6b',x+4*s,y-13*s,2*s,2*s);
  rect(ctx,'#a59474',x-14*s,y-2*s,28*s,3*s);
  const roof = variant === 1 ? '#79504a' : palette.roof;
  const shade = variant === 1 ? '#533c3c' : palette.roof2;
  const brim = w + 8*s;
  poly(ctx,shade,[[x-brim,top+2*s],[x-brim+14*s,top-roofH*.59],[x-12*s,top-roofH],[x+31*s,top-roofH],[x+brim-7*s,top-roofH*.53],[x+brim,top+2*s]]);
  poly(ctx,roof,[[x-brim,top],[x-12*s,top-roofH],[x+31*s,top-roofH],[x+brim,top]]);
  for(let row=1;row<8;row++){
    const f=row/8, yy=top-roofH+roofH*f;
    const left=x-12*s-(brim-12*s)*f,right=x+31*s+(brim-31*s)*f;
    rect(ctx,'#23272c70',left,yy,right-left,s);
    for(let xx=left+((row%2)*5+4)*s;xx<right-3*s;xx+=9*s) rect(ctx,palette.roof3,xx,yy+2*s,4*s,s);
  }
  rect(ctx,palette.roof3,x-13*s,top-roofH-2*s,46*s,3*s);
  rect(ctx,'#222a2d',x-brim,top,brim*2,4*s);
  rect(ctx,'#a08461',x-brim+1*s,top+4*s,brim*2-2*s,2*s);
  if (variant === 2) {
    rect(ctx,'#4c4643',x+21*s,top-roofH-15*s,10*s,24*s);
    rect(ctx,'#8f7b67',x+19*s,top-roofH-17*s,14*s,4*s);
  }
}

function drawTower(ctx, p, palette) {
  const { x, y, size:s }=p, w=27*s, top=y-101*s;
  round(ctx,'#0a141b68',x+4*s,y+1,w+12*s,15*s);
  rect(ctx,'#3d4140',x-w,top,w*2,101*s);
  rect(ctx,palette.stone,x-w+3*s,top,w*2-9*s,99*s);
  for(let i=0;i<16;i++) {
    const py=top+4*s+i*6*s;
    rect(ctx,'#302f3455',x-w,py,2*w,1*s);
    for(let j=0;j<4;j++) rect(ctx,'#c5bda65f',x-w+3*s+j*13*s+(i%2)*4*s,py+2*s,5*s,1*s);
  }
  rect(ctx,'#272d32',x-12*s,top+12*s,24*s,36*s);
  poly(ctx,'#292e35',[[x-12*s,top+12*s],[x,top+2*s],[x+12*s,top+12*s]]);
  poly(ctx,'#9c7248',[[x-11*s,top+36*s],[x-6*s,top+28*s],[x-5*s,top+16*s],[x+5*s,top+16*s],[x+6*s,top+28*s],[x+11*s,top+36*s]]);
  rect(ctx,'#e0b66a',x-10*s,top+34*s,20*s,2*s);
  rect(ctx,'#be9060',x-s,top+36*s,2*s,5*s);
  rect(ctx,'#2d2b2c',x-9*s,y-26*s,18*s,25*s);
  rect(ctx,'#937458',x-7*s,y-25*s,14*s,2*s);
  poly(ctx,palette.roof2,[[x-w-5*s,top],[x-4*s,top-44*s],[x+5*s,top-44*s],[x+w+5*s,top]]);
  poly(ctx,palette.roof,[[x-w-5*s,top],[x-4*s,top-44*s],[x+7*s,top-28*s],[x+11*s,top]]);
  rect(ctx,palette.roof3,x-w-6*s,top-1*s,2*w+12*s,2*s);
  rect(ctx,'#b5a278',x-s,top-56*s,2*s,16*s);
  rect(ctx,'#b5a278',x-5*s,top-51*s,10*s,2*s);
}

function drawTree(ctx,p,palette) {
  const {x,y,size:s,variant}=p;
  const h=(24+variant*18)*s;
  round(ctx,'#142a2569',x+8*s,y+1,20*s,8*s);
  rect(ctx,'#494132',x-3*s,y-h*.77,6*s,h*.82);
  rect(ctx,'#85704b',x-2*s,y-h*.47,2*s,h*.41);
  const rng=random(p.seed);
  for(let i=0;i<6;i++){
    const px=x+(rng()-.5)*23*s,py=y-h+(rng()-.5)*26*s;
    const d=(11+rng()*9)*s;
    round(ctx,palette.leaf,px+3*s,py+2*s,d,d*.72);
    round(ctx,palette.leaf2,px,py,d*.90,d*.66);
    rect(ctx,palette.leaf3,px-d*.43,py-d*.22,d*.54,2*s);
    rect(ctx,palette.leaf3,px-d*.19,py-d*.44,d*.60,s);
  }
}

function drawProp(ctx,p,palette,time) {
  if(p.physical) return drawAdventureObject(ctx,p,palette,time,false);
  if(drawTownProp(ctx,p,palette,time)) return;
  const {x,y,size:s,kind,variant}=p;
  if(kind==='house') return drawHouse(ctx,p,palette);
  if(kind==='tower') return drawTower(ctx,p,palette);
  if(kind==='tree') return drawTree(ctx,p,palette);
  if(kind==='tuft'){
    const rng=random(p.seed);
    for(let i=0;i<7;i++){
      const px=x+(rng()-.5)*17*s, py=y+(rng()-.5)*9*s, h=(3+rng()*6)*s;
      line(ctx,i%3 ? palette.leaf3 : '#a5a175',px,py,px+(i%2?2:-2)*s,py-h,s);
      if(variant>.72 && i%3===0) rect(ctx,'#c6ac71',px,py-h,2*s,2*s);
    }
    return;
  }
  if(kind==='rock'||kind==='crystal'){
    round(ctx,'#15252a87',x+4*s,y,19*s,6*s);
    poly(ctx,'#3e4543',[[x-16*s,y-1],[x-12*s,y-13*s],[x+3*s,y-20*s],[x+15*s,y-13*s],[x+18*s,y],[x-7*s,y+3*s]]);
    poly(ctx,kind==='crystal'?'#59787b':palette.stone,[[x-13*s,y-10*s],[x+3*s,y-20*s],[x+13*s,y-13*s],[x+1*s,y-11*s],[x-6*s,y-4*s]]);
    if(kind==='crystal') poly(ctx,'#8aac9d',[[x-3*s,y-13*s],[x-2*s,y-32*s],[x+6*s,y-39*s],[x+11*s,y-21*s],[x+7*s,y-12*s]]);
    return;
  }
  if(kind==='crate'){
    round(ctx,'#12222780',x,y,13*s,5*s);
    rect(ctx,'#6b533c',x-10*s,y-15*s,20*s,15*s);
    rect(ctx,'#a5885e',x-10*s,y-16*s,20*s,4*s);
    rect(ctx,'#4f4435',x-8*s,y-10*s,16*s,1*s);
    line(ctx,'#a78455',x-8*s,y-5*s,x+8*s,y-13*s,2*s);
    return;
  }
  if(kind==='well'){
    round(ctx,'#1c2b2a',x+2*s,y,16*s,6*s);
    rect(ctx,'#6d6b5b',x-14*s,y-14*s,28*s,15*s);
    round(ctx,'#aca087',x,y-14*s,15*s,6*s);
    round(ctx,'#24383d',x,y-14*s,11*s,4*s);
    return;
  }
  if(kind==='ruin'){
    const shade='#394246';
    round(ctx,'#151f2699',x,y,40*s,10*s);
    for(const k of [-1,1]){
      rect(ctx,shade,x+k*26*s-9*s,y-61*s,19*s,61*s);
      rect(ctx,palette.stone,x+k*26*s-7*s,y-59*s,8*s,57*s);
      for(let i=1;i<6;i++) rect(ctx,'#393d4177',x+k*26*s-9*s,y-i*9*s,19*s,s);
    }
    poly(ctx,palette.stone,[[x-35*s,y-60*s],[x-27*s,y-73*s],[x,y-82*s],[x+23*s,y-74*s],[x+36*s,y-60*s],[x+22*s,y-57*s],[x,y-68*s],[x-19*s,y-57*s]]);
    return;
  }
  if(kind==='lamp'){
    rect(ctx,'#4b483a',x-2*s,y-34*s,4*s,36*s);
    rect(ctx,'#362e2d',x-7*s,y-39*s,14*s,3*s);
    rect(ctx,'#594736',x-5*s,y-36*s,10*s,10*s);
    rect(ctx,palette.light,x-3*s,y-34*s,6*s,6*s);
    const glow=ctx.createRadialGradient(x,y-30*s,0,x,y-30*s,28*s+Math.sin(time*2+p.seed)*3);
    glow.addColorStop(0,'#ffce7179'); glow.addColorStop(1,'#ffc97700');
    round(ctx,glow,x,y-30*s,31*s,33*s);
  }
}

function drawExit(ctx,p,color,time,world) {
  const {x,y}=p;
  if(world) {
    const k = p.kind === 'town' ? 'house' : p.kind === 'ruin' ? 'ruin' : 'tower';
    drawProp(ctx,{ x,y:y-4,size:k==='house'?.54:.54,variant:0,seed:101,kind:k },palettes.port,time);
  }
  const h=y-(world?44:15)+Math.sin(time*3)*2;
  poly(ctx,'#222c2cf3',[[x,h-9],[x+9,h],[x,h+9],[x-9,h]]);
  poly(ctx,color,[[x,h-6],[x+6,h],[x,h+6],[x-6,h]]);
  poly(ctx,'#ece4b8',[[x,h-6],[x+1,h],[x-5,h]]);
  if(world){
    ctx.font='bold 12px sans-serif';
    ctx.textAlign='center';
    const w=ctx.measureText(p.label).width+12;
    rect(ctx,'#192424e8',x-w/2,y+9,w,20);
    rect(ctx,'#a694665e',x-w/2,y+9,w,1);
    ctx.fillStyle='#eee3c4';
    ctx.fillText(p.label,x,y+23);
  }
}

function drawObject(ctx, p, palette, time, opened) {
  const {x,y}=p;
  if(p.physical) return drawAdventureObject(ctx,p,palette,time,opened);
  if(p.kind==='chest') {
    round(ctx,'#14212399',x,y,15,5);
    rect(ctx,'#2e2423',x-13,y-15,26,15);
    rect(ctx,opened?'#524336':'#98633e',x-11,y-13,22,11);
    rect(ctx,'#bb925a',x-12,y-13,24,2);
    rect(ctx,'#d2b476',x-3,y-11,6,5);
    if(opened) rect(ctx,'#231f20',x-10,y-14,20,5);
    if(!opened && Math.sin(time*2)>0.70) {
      rect(ctx,'#ffebb6',x+9,y-18,2,10);
      rect(ctx,'#ffebb6',x+5,y-14,10,2);
    }
    return;
  }
  if(p.kind==='sign') {
    rect(ctx,'#42372e',x-2,y-21,4,23);
    rect(ctx,'#3c3330',x-14,y-26,28,14);
    rect(ctx,'#987d54',x-12,y-25,24,10);
    rect(ctx,'#d9bd85',x-7,y-21,14,1);
    return;
  }
  if(p.kind==='altar'||p.kind==='boss') {
    drawProp(ctx,{x,y,size:.65,kind:'ruin',seed:135,variant:0},palette,time);
    drawExit(ctx,p,p.kind==='boss'?'#eab699':'#a7dfd5',time,false);
    return;
  }
  if(p.kind==='voyage') {
    drawExit(ctx,p,'#8bc6b5',time,false);
    return;
  }
  drawExit(ctx,p,'#d8bd81',time,false);
}

export const personScale = (dpr = devicePixelRatio || 1) => Math.max(1, Math.round(dpr)) / dpr;
export const assetUrl = file => './assets/' + file;

export class MapView {
  constructor(canvas, hooks) {
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d',{alpha:false});
    this.hooks=hooks;
    this.player={x:0,y:0,face:0,walk:0,moving:false};
    this.floors=new Map();
    this.keys=new Set();
    this.camera={x:0,y:0};
    this.resize=()=>this.fit();
    this.clock=0;
    this.frame=this.frame.bind(this);
    new ResizeObserver(this.resize).observe(canvas);
    canvas.addEventListener('pointerdown',e=>{
      if(!this.hooks.active()||!e.isPrimary) return;
      this.route=null;
      this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0,drag:false};
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove',e=>{
      if(this.pointer?.id!==e.pointerId) return;
      this.pointer.dx=e.clientX-this.pointer.x;
      this.pointer.dy=e.clientY-this.pointer.y;
      if(Math.hypot(this.pointer.dx,this.pointer.dy)>7) this.pointer.drag=true;
    });
    const end=e=>{
      if(this.pointer?.id!==e.pointerId) return;
      const tap=e.type==='pointerup'&&!this.pointer.drag&&this.hooks.active();
      this.pointer=null;
      if(tap) {
        const a=canvas.getBoundingClientRect();
        this.tap(e.clientX-a.left+this.camera.x,e.clientY-a.top+this.camera.y);
      }
    };
    canvas.addEventListener('pointerup',end);
    canvas.addEventListener('pointercancel',end);
    canvas.addEventListener('lostpointercapture',end);
    const moves=['ArrowUp','ArrowLeft','ArrowRight','ArrowDown','w','a','s','d'];
    window.addEventListener('keydown',e=>{
      if(!this.hooks.active()) return;
      if(moves.includes(e.key)) {e.preventDefault();this.keys.add(e.key);this.route=null;}
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.key));
    window.addEventListener('blur',()=>{this.keys.clear();this.pointer=null;});
    requestAnimationFrame(this.frame);
  }

  fit() {
    const dpr=window.devicePixelRatio||1, {width,height}=this.canvas.getBoundingClientRect();
    this.w=width;this.h=height;this.dpr=dpr;
    this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.ctx.imageSmoothingEnabled=false;
  }

  setMap(scene,pos,preview=false) {
    const refresh=scene!==this.scene;
    this.scene=scene;
    this.palette=palettes[scene.palette]??palettes.moor;
    if(refresh){
      const floor=this.floors.get(scene.id)??(scene.field?new Map():stampFloor(scene,this.palette));
      this.floors.delete(scene.id);
      this.floors.set(scene.id,floor);
      if(this.floors.size>3) this.floors.delete(this.floors.keys().next().value);
      this.floor=floor;
      this.props=makeProps(scene);
    }
    this.refreshPeople();
    this.preview=preview;
    this.reposition(pos??scene.entry);
  }

  refreshPeople() {
    const {scene}=this;
    const night=this.hooks.night?.();
    this.people=(scene.people??[]).filter(p=>this.hooks.show(p)).map(p=>({...p,...(night?p.nightPosition:null),kind:'person',face:p.face??0}));
    this.objects=(scene.objects??[]).filter(p=>this.hooks.showObject?.(p)??true);
    this.targets=[...(scene.exits??[]).map(p=>({...p,type:'exit'})),...this.objects.map(p=>({...p,type:'object'})),...this.people.map(p=>({...p,type:'person'}))];
  }

  reposition(pos) {
    let loc={...pos};
    if(!this.preview&&!this.clear(loc.x,loc.y)){
      const {scene}=this;
      const legacy=scene.field?.legacySize;
      if(legacy&&(loc.x>=scene.width||loc.y>=scene.height)) {
        loc.x=loc.x*scene.width/legacy[0];
        loc.y=loc.y*scene.height/legacy[1];
      }
      const points=[];
      if(this.clear(loc.x,loc.y)) points.push(loc);
      for(let ring=6;ring<=198&&!points.length;ring+=6){
        for(let i=0;i<16;i++){
          const x=loc.x+ring*Math.cos(i*TAU/16),y=loc.y+ring*Math.sin(i*TAU/16);
          if(this.clear(x,y)) points.push({x,y});
        }
      }
      let nearest;
      if(!points.length&&scene.field?.route) {
        nearest=scene.field.route.reduce((best,point)=>
          this.clear(point.x,point.y)&&(!best||distance(loc,point)<distance(loc,best))?point:best,null);
      }
      loc={...loc,...(points[0]??nearest??scene.entry)};
    }
    this.player={...loc,face:pos.face??0,walk:0,moving:false};
    this.pointer=null;this.route=null;this.keys.clear();
    this.center(1);
  }

  center(amount) {
    if(!this.scene||!this.w||!this.h) return;
    let cx=this.scene.width<this.w?(this.scene.width-this.w)/2:clamp(this.player.x-this.w*.50,0,this.scene.width-this.w);
    let cy=this.scene.height<this.h?(this.scene.height-this.h)/2:clamp(this.player.y-this.h*.57,0,this.scene.height-this.h);
    if(this.talkFocus) {
      const {person,bottom,top,pose}=this.talkFocus;
      const feet=Math.max(top+75,top+(bottom-top)*.71);
      cx=(pose.x+person.x)/2-this.w*.50;
      cy=Math.max(pose.y,person.y)-feet;
    }
    this.camera.x+=(cx-this.camera.x)*amount;
    this.camera.y+=(cy-this.camera.y)*amount;
  }

  focusTalk(person,bottom,top) {
    const pose={...this.player,moving:false};
    if(Math.abs(pose.x-person.x)<33&&Math.abs(pose.y-person.y)<55){
      const direction=pose.x<person.x?-1:1;
      for(const side of [direction,-direction]){
        const x=person.x+side*36;
        if(!this.clear(x,pose.y)) continue;
        pose.x=x;
        pose.face=side===1?1:2;
        break;
      }
    }
    this.talkFocus={person,bottom,top,pose};
  }

  releaseTalk() {
    this.talkFocus=null;
  }

  clear(x,y) {
    if(!inTerrain(this.scene,x-7,y)||!inTerrain(this.scene,x+7,y)||!inTerrain(this.scene,x,y+4)||!inTerrain(this.scene,x,y-5)) return false;
    for(const p of this.props){
      const [w,h]=p.footprint;
      if(w&&Math.abs(x-p.x)<w+5&&y>p.y-h-5&&y<p.y+5) return false;
    }
    return !this.people.some(p=>Math.abs(x-p.x)<17&&Math.abs(y-p.y)<13);
  }

  walkableLine(ax,ay,bx,by) {
    const samples=Math.ceil(Math.hypot(bx-ax,by-ay)/2.5);
    for(let index=1;index<=samples;index++){
      const at=index/samples;
      if(!this.clear(ax+(bx-ax)*at,ay+(by-ay)*at)) return false;
    }
    return true;
  }

  path(x,y,target) {
    const adventure=!!this.scene.field;
    const step=this.scene.field?.type==='outdoor'?12:15,cols=Math.ceil(this.scene.width/step),rows=Math.ceil(this.scene.height/step);
    let startX=Math.round(this.player.x/step),startY=Math.round(this.player.y/step);
    if(adventure){
      const {x:px,y:py}=this.player;
      const options=[];
      for(let col=startX-2;col<=startX+2;col++)for(let row=startY-2;row<=startY+2;row++) {
        if(col<1||row<1||col>=cols-1||row>=rows-1) continue;
        options.push({col,row,distance:Math.hypot(px-col*step,py-row*step)});
      }
      options.sort((a,b)=>a.distance-b.distance);
      const anchor=options.find(p=>this.clear(p.col*step,p.row*step)&&this.walkableLine(px,py,p.col*step,p.row*step));
      if(!anchor) {this.route={way:[],target,point:{x,y}};return;}
      startX=anchor.col;startY=anchor.row;
    }
    const start=startY*cols+startX;
    const came=new Int32Array(cols*rows).fill(-1);
    came[start]=start;
    const queue=[start];
    let best=start,bestDist=Infinity;
    for(let i=0;i<queue.length;i++){
      const k=queue[i],cx=k%cols,cy=Math.floor(k/cols),d=Math.hypot(cx*step-x,cy*step-y);
      if(d<bestDist){best=k;bestDist=d;}
      if(d<(target?26:11)) break;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const nx=cx+dx,ny=cy+dy,n=ny*cols+nx;
        if(nx<=0||ny<=0||nx>=cols-1||ny>=rows-1||came[n]>=0||!this.clear(nx*step,ny*step)) continue;
        if(dx&&dy&&(!this.clear(nx*step,cy*step)||!this.clear(cx*step,ny*step))) continue;
        if(adventure ? !this.walkableLine(cx*step,cy*step,nx*step,ny*step) : !this.clear((nx+cx)*step/2,(ny+cy)*step/2)) continue;
        came[n]=k;queue.push(n);
      }
    }
    const way=[];
    for(let at=best;at!==start;at=came[at]) way.push({x:(at%cols)*step,y:Math.floor(at/cols)*step});
    if(adventure&&way.length) way.push({x:startX*step,y:startY*step});
    this.route={way:way.reverse(),target,point:{x,y}};
  }

  tap(x,y) {
    const hits=this.targets.filter(p=>Math.abs(p.x-x)<(p.type==='exit'?30:23)&&p.y-y<57&&y-p.y<15);
    const aim = t=>Math.hypot(t.x-x,t.y-y-(t.type==='person'?29:14));
    const target=this.scene.field?hits.sort((a,b)=>aim(a)-aim(b))[0]:hits[0];
    if(target&&distance(this.player,target)<45){this.hooks.interact(target);return;}
    this.path(target?.x??x,target?.y??y,target);
  }

  near() {
    return this.targets.filter(p=>distance(this.player,p)<44).sort((a,b)=>distance(this.player,a)-distance(this.player,b))[0];
  }

  move(dt) {
    if(!this.hooks.active()) {this.player.moving=false;return;}
    let dx=+(this.keys.has('ArrowRight')||this.keys.has('d'))-+(this.keys.has('ArrowLeft')||this.keys.has('a'));
    let dy=+(this.keys.has('ArrowDown')||this.keys.has('s'))-+(this.keys.has('ArrowUp')||this.keys.has('w'));
    const p=this.player;
    if(this.pointer?.drag) {dx=this.pointer.dx;dy=this.pointer.dy;}
    if(!dx&&!dy&&this.route) {
      const {way,target}=this.route;
      if(way.length&&distance(p,way[0])<.25) way.shift();
      if(way.length) {dx=way[0].x-p.x;dy=way[0].y-p.y;}
      else {this.route=null;if(target&&distance(p,target)<47) this.hooks.interact(target);}
    }
    const n=Math.hypot(dx,dy);
    const speed=(this.scene.kind==='world'?151:131)*dt;
    const from={x:p.x,y:p.y};
    if(n>0){
      const step=this.route?Math.min(speed,n):speed;
      const x=p.x+dx*step/n,y=p.y+dy*step/n;
      if(this.route&&this.clear(x,y)) {p.x=x;p.y=y;}
      else {
        if(this.clear(x,p.y)) p.x=x;
        if(this.clear(p.x,y)) p.y=y;
      }
      p.face=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;
    }
    const moved=distance(p,from);
    const previous=p.moving;
    p.moving=moved>.10;
    p.walk=p.moving?(previous?p.walk+dt:0):0;
    if(p.moving) {
      if(!previous||Math.floor(p.walk*4)!==Math.floor((p.walk-dt)*4)) this.hooks.step?.();
      this.hooks.move(p,moved);
    }
  }

  personFrame(p) {
    const s=personScale(this.dpr);
    const snap=x=>Math.round(x*this.dpr)/this.dpr;
    const beat=p.walk%0.50;
    const col=!p.moving?1:beat<.15?0:beat<.25?1:beat<.40?2:1;
    const bob=p.moving&&col!==1?-.7:0;
    return {sx:48*col,sy:60*(p.face??0),x:snap(p.x-24*s),y:snap(p.y-60*s+bob),w:48*s,h:60*s,s};
  }

  drawPerson(ctx,p,image,frame) {
    round(ctx,'#091b236b',p.x+1,p.y+1,14*frame.s,4*frame.s);
    this.drawFrame(ctx,image,frame);
  }

  drawFrame(ctx,image,frame,dx=0,dy=0) {
    ctx.drawImage(image,frame.sx,frame.sy,48,60,frame.x+dx,frame.y+dy,frame.w,frame.h);
  }

  drawHiddenPerson(ctx,p,image,frame,foreground,palette,time) {
    const dpr=this.dpr,pad=Math.ceil(3*dpr)/dpr;
    const x=frame.x-pad,y=frame.y-pad,w=frame.w+2*pad,h=frame.h+2*pad;
    const covers=foreground.filter(({prop,half,tall})=>prop.y>p.y&&
      prop.y-tall<y+h&&prop.x+half>x&&prop.x-half<x+w);
    if(!covers.length) return;
    this.coverCanvas??=document.createElement('canvas');
    this.outlineCanvas??=document.createElement('canvas');
    const mask=this.coverCanvas,ink=this.outlineCanvas;
    const pixelsW=Math.round(w*dpr),pixelsH=Math.round(h*dpr);
    for(const layer of [mask,ink]){
      if(layer.width!==pixelsW||layer.height!==pixelsH){layer.width=pixelsW;layer.height=pixelsH;}
    }
    const maskCtx=mask.getContext('2d'),outline=ink.getContext('2d');
    const prepare=layer=>{
      layer.setTransform(1,0,0,1,0,0);
      layer.globalCompositeOperation='source-over';
      layer.clearRect(0,0,pixelsW,pixelsH);
      layer.setTransform(dpr,0,0,dpr,-x*dpr,-y*dpr);
      layer.imageSmoothingEnabled=false;
    };
    prepare(maskCtx);
    for(const {prop} of covers) drawProp(maskCtx,prop,palette,time);
    const hideVisiblePixels=()=>{
      outline.setTransform(1,0,0,1,0,0);
      outline.globalCompositeOperation='destination-in';
      outline.drawImage(mask,0,0);
    };

    prepare(outline);
    this.drawFrame(outline,image,frame);
    hideVisiblePixels();
    ctx.globalAlpha=.42;
    ctx.drawImage(ink,x,y,w,h);

    prepare(outline);
    const step=frame.s;
    for(const [dx,dy] of [[-step,0],[step,0],[0,-step],[0,step]]) this.drawFrame(outline,image,frame,dx,dy);
    outline.globalCompositeOperation='destination-out';
    this.drawFrame(outline,image,frame);
    outline.globalCompositeOperation='source-in';
    outline.fillStyle='#ffe8b8';
    outline.fillRect(x,y,w,h);
    hideVisiblePixels();
    ctx.globalAlpha=.88;
    ctx.drawImage(ink,x,y,w,h);
    ctx.globalAlpha=1;
  }

  paint() {
    if(!this.scene||!this.w||!this.h) return;
    const {ctx,scene,palette,w,h,dpr,clock}=this;
    const cameraX=Math.round(this.camera.x*dpr)/dpr,cameraY=Math.round(this.camera.y*dpr)/dpr;
    rect(ctx,palette.low,0,0,w,h);
    ctx.save();ctx.translate(-cameraX,-cameraY);
    if(scene.field) drawAdventureGround(ctx,scene,this.floor,cameraX,cameraY,w,h,clock);
    else ctx.drawImage(this.floor,0,0);
    const waves=random(scene.seed*1227);
    if(!scene.field&&(scene.shore||scene.lakes?.length)){
      for(let i=0;i<scene.width*.19;i++){
        const x=Math.round(waves()*scene.width), y=Math.round(waves()*Math.max(1,scene.shore??scene.height));
        const r=waves(), span=3+17*r;
        const wet=y<coast(scene,x)-3||(scene.lakes??[]).some(([cx,cy,rx,ry])=>((x-cx)/rx)**2+((y-cy)/ry)**2<.985);
        if(!wet||onBridge(scene,x,y)||(scene.pier&&x>=scene.pier[0]-5&&x<=scene.pier[1]+3&&y>scene.pier[2])) continue;
        ctx.globalAlpha=.13+(.5+.5*Math.sin(clock*(.45+r)+i))*.35;
        rect(ctx,palette.wave,x+Math.sin(clock*.5+i)*4,y,span,1);
      }
      ctx.globalAlpha=1;
    }
    const render=[],foreground=[],actors=[];
    const adventure=scene.field?this.hooks.adventureState?.():null;
    for(const decoration of scene.field?.scenery??[]) {
      const p=adventureAppearance(decoration,adventure);
      render.push([p.y,()=>drawAdventureObject(ctx,p,palette,clock,false)]);
      if(p.physical==='stall') foreground.push({prop:p,half:35,tall:50});
    }
    for(const p of this.props){
      const bounds=p.cover,[half,tall]=bounds??[55,55];
      if(p.x+half<cameraX||p.x-half>cameraX+w||p.y<cameraY-20||p.y-tall>cameraY+h) continue;
      render.push([p.y,()=>drawProp(ctx,p,palette,clock)]);
      if(bounds&&half&&tall) foreground.push({prop:p,half,tall});
    }
    for(const p of scene.exits??[]) {
      if(p.physical) render.push([p.y,()=>drawAdventureObject(ctx,p,palette,clock,false)]);
      else render.push([p.y,()=>drawExit(ctx,p,'#d8bd81',clock,scene.kind==='world')]);
    }
    for(const p of this.objects) render.push([p.y,()=>drawObject(ctx,adventureAppearance(p,adventure),palette,clock,this.hooks.opened(p))]);
    if(!this.preview) for(const p of [...this.people,this.talkFocus?.pose??this.player]){
      if(p.x<cameraX-36||p.x>cameraX+w+36||p.y<cameraY-10||p.y>cameraY+h+66) continue;
      const image=this.hooks.image(p.sprite??p.id??this.hooks.hero);
      if(!image) continue;
      const frame=this.personFrame(p);
      actors.push({p,image,frame});
      render.push([p.y,()=>this.drawPerson(ctx,p,image,frame)]);
    }
    render.sort((a,b)=>a[0]-b[0]);
    for(const [,draw] of render) draw();
    for(const {p,image,frame} of actors) this.drawHiddenPerson(ctx,p,image,frame,foreground,palette,clock);
    ctx.restore();
    const vignette=ctx.createRadialGradient(w*.50,h*.47,h*.20,w*.50,h*.47,h*.67);
    vignette.addColorStop(0,'#0e172000');vignette.addColorStop(1,'#07162399');
    rect(ctx,vignette,0,0,w,h);
    const angle=ctx.createLinearGradient(0,h*.13,w,h*.83);
    const night=this.hooks.night?.();
    angle.addColorStop(0,night?'#4568ad2a':'#ffc68924');angle.addColorStop(.46,'#a0b4a008');angle.addColorStop(1,'#102d4832');
    rect(ctx,angle,0,0,w,h);
    for(let i=0;i<13;i++){
      const x=((i*97.3+clock*(6+i%3))% (w+40))-20;
      const y=((i*i*87.7-clock*(2+i%3))%h+h)%h;
      ctx.globalAlpha=(.4+.4*Math.sin(clock+i))* .56;
      rect(ctx,scene.kind==='cave'?'#a0d1c9':'#efe0a0',x,y,1+(i%4===0),1);
    }
    ctx.globalAlpha=1;
  }

  frame(now) {
    const dt=this.last?Math.min(.04,(now-this.last)/1000):0;
    this.last=now;this.clock+=dt;
    if(this.scene&&!document.hidden&&(this.hooks.render?.()??true)) {
      this.move(dt);
      if(!this.preview) this.center(1-Math.exp(-dt*11));
      this.paint();
    }
    requestAnimationFrame(this.frame);
  }
}
