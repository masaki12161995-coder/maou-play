const CHUNK = 320;
const STEP = 8;

const shades = {
  sand:['#8a7855','#9c8c62','#786b51','#a39873','#6e624b'],
  meadow:['#4e5f48','#5d6c52','#435541','#657557','#394c42'],
  marsh:['#4a5c4a','#5b6a4b','#405648','#6d7957','#354a40'],
  stone:['#686866','#76766b','#5c5e59','#857f70','#4f5856'],
  slate:['#4b5154','#596060','#414b50','#6f716b','#364248'],
  ash:['#695649','#765d4d','#594b44','#897058','#4b4241'],
  wood:['#6e5a46','#806a51','#60503f','#917b5e','#433f39'],
  stairs:['#746f61','#8b8576','#655f52','#a49679','#53554f'],
  water:['#233e50','#2a495c','#203948','#315767','#1a313f'],
  cliff:['#282f36','#343c41','#20282f','#424a49','#19222b'],
  timber:['#705b47','#826953','#634e42','#a58a65','#4c4038'],
  frost:['#788d92','#879ca2','#657b83','#a2b0b0','#536d77'],
  umber:['#68544a','#785e51','#594842','#987661','#4a3e3e'],
  bedrock:['#292e35','#383f44','#21292f','#555850','#1b242b'],
  cutStone:['#333c47','#46515b','#2b3540','#626b70','#202c36'],
  plaster:['#635744','#75614e','#51443b','#92806b','#3b322c'],
  ironWall:['#372c30','#463737','#2e2629','#644741','#251d23'],
  redWall:['#453239','#583d41','#372c35','#765251','#2c232c'],
  iceWall:['#395060','#4a6472','#293c4c','#6b8290','#233743'],
  duneWall:['#615743','#746750','#524d3f','#9a8965','#453e32'],
  trees:['#263f38','#304b40','#203630','#39584a','#172b2a'],
  drop:['#273646','#354958','#20313e','#526977','#182735'],
  paving:['#7a7569','#878073','#696559','#a29a85','#5d5a53'],
  track:['#7a6f57','#877962','#695f50','#9d8d6b','#585449']
};
const blocked = new Set(['water','cliff','bedrock','cutStone','plaster','ironWall','redWall','iceWall','duneWall','trees','drop']);
const underground = {
  plaster:['#252422','#302b27','#211e1e'],bedrock:['#171f27','#202932','#151c24'],cutStone:['#202930','#27343d','#19222c'],
  ironWall:['#251f25','#2c252b','#201b22'],redWall:['#2a242b','#362930','#241e27'],iceWall:['#24333e','#2b3e4b','#202d38']
};

const hash = (x,y,seed) => {
  const t=Math.imul(x+37,371319427)^Math.imul(y+53,379769413)^Math.imul(seed,4543237);
  return ((t^(t>>>15))>>>0)%1024/1024;
};

function pathRange(paths,x,y) {
  let best = 1e20;
  for(const path of paths) {
    for(let i=1;i<path.length;i++) {
      const [ax,ay]=path[i-1], [bx,by]=path[i],dx=bx-ax,dy=by-ay;
      const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));
      best=Math.min(best,(x-ax-t*dx)**2+(y-ay-t*dy)**2);
    }
  }
  return best;
}

function outdoorSurface(scene,x,y) {
  const field=scene.field;
  const clearDist=pathRange(scene.paths,x,y);
  const hard=field.chambers[0]?.shape==='brick';
  const radius=field.radius+(hard?0:4*Math.cos(x*.012+y*.023)+4*Math.sin(y*.025-x*.016));
  if(field.track==='wood'&&clearDist<29**2) return 'wood';
  for(const room of field.chambers) {
    const dx=Math.abs(x-room.x)/(room.w*.5),dy=Math.abs(y-room.y)/(room.h*.5);
    const inRoom=room.shape==='brick'?Math.max(dx,dy)<1&&dx+dy<1.91:dx*dx+dy*dy<=.96+Math.sin((x+y)*.015)*.042;
    if(inRoom) return room.material??(clearDist<20**2?field.track:field.ground);
  }
  if(clearDist<radius**2) return hard||clearDist<30**2?field.track:field.ground;
  return field.wall;
}

function townSurface(scene,x,y) {
  const field=scene.field,nx=Math.floor((x-field.offset[0])/field.cell[0]), ny=Math.floor((y-field.offset[1])/field.cell[1]);
  const cell=field.tiles[ny]?.[nx];
  if (cell==='~') return 'water';
  if (!cell || cell==='#') return 'cliff';
  if (cell==='-') return 'wood';
  if (cell===':') return 'stairs';
  if (cell==='=' || cell==='1'||cell==='2') {
    if(field.ground==='wood') return 'wood';
    return field.ground==='stone'||field.ground==='slate'?'paving':'track';
  }
  return field.ground;
}

function surface(scene,x,y) {
  return scene.field.type==='town'?townSurface(scene,x,y):outdoorSurface(scene,x,y);
}

export function adventureTerrainClear(scene,x,y) {
  if(x<12||y<12||x>scene.width-12||y>scene.height-12) return false;
  return !blocked.has(surface(scene,x,y));
}

function paintCell(ctx,scene,x,y,lx,ly) {
  const base=surface(scene,x+STEP*.5,y+STEP*.5), normal=shades[base];
  const r=hash(x/STEP,y/STEP,scene.seed), smooth=Math.cos(x*.025-y*.031)+Math.sin(y*.036+x*.012);
  const outside=blocked.has(base);
  const above=surface(scene,x+4,y-4),below=surface(scene,x+4,y+12);
  const voidColors=scene.kind==='cave'?underground[base]:null;
  if(voidColors) {
    const lowerFloor=!blocked.has(below), face=lowerFloor||!blocked.has(surface(scene,x+4,y+20));
    const side=!blocked.has(above)||!blocked.has(surface(scene,x-4,y+4))||!blocked.has(surface(scene,x+12,y+4));
    const fill=face?normal[lowerFloor?1:0]:side?normal[4]:voidColors[r>.92?1:r<.15?2:0];
    ctx.fillStyle=fill;
    ctx.fillRect(lx,ly,STEP,STEP);
    if(face) {
      ctx.fillStyle=normal[lowerFloor?3:4];ctx.fillRect(lx,ly,STEP,2);
      ctx.fillStyle='#161d2080';ctx.fillRect(lx,ly+7,STEP,1);
      if((x+Math.floor(y/8)%2*8)%16===0) ctx.fillRect(lx,ly+2,1,5);
    } else if(side) {
      ctx.fillStyle=normal[3];ctx.fillRect(lx+2,ly+4,4,1);
    }
    return;
  }
  const edge=outside&&surface(scene,x+4,y+17)!==base;
  const color=normal[edge?3:r<.11?2:(r>.91||smooth>1.6)?1:0];
  ctx.fillStyle=color;
  ctx.fillRect(lx,ly,STEP,STEP);
  if(edge&&base!=='water') {
    ctx.fillStyle='#78807170';ctx.fillRect(lx,ly+STEP-2,STEP,2);
  }
  if(!outside&&blocked.has(above)&&above!=='water') {
    ctx.fillStyle='#292e3080';ctx.fillRect(lx,ly,STEP,3);
  }
  if(base!=='water'&&below==='water') {
    ctx.fillStyle='#8f8e7990';ctx.fillRect(lx,ly+4,STEP,2);
    ctx.fillStyle='#333e40';ctx.fillRect(lx,ly+6,STEP,2);
  }
  if(base==='wood'||base==='stairs'||base==='timber') {
    ctx.fillStyle=normal[4];ctx.fillRect(lx,ly,STEP,1);
    if((x+(Math.floor(y/8)%4)*8)%40===0) ctx.fillRect(lx,ly,1,STEP);
    if(r>.78) {ctx.fillStyle=normal[3];ctx.fillRect(lx+1,ly+3,5,1);}
  } else if(base==='paving'||base==='plaster'||base==='cutStone'||base==='ironWall') {
    const stitch=(x+(Math.floor(y/8)%2)*8)%16===0;
    ctx.fillStyle='#48464166';ctx.fillRect(lx,ly+7,STEP,1);
    if(stitch) ctx.fillRect(lx,ly,1,STEP);
    ctx.fillStyle=normal[3];
    if(r>.5) ctx.fillRect(lx+2,ly+1,4,1);
  } else if (base==='track'||base==='stone'||base==='slate'||base==='bedrock'||base==='drop'||base==='iceWall'||base==='redWall') {
    if(r>.70) {ctx.fillStyle=normal[3];ctx.fillRect(lx+1,ly+2,5,1);}
    if(r<.28) {ctx.fillStyle=normal[4];ctx.fillRect(lx+4,ly+7,4,1);}
  } else if(base==='water') {
    if(r>.91 || edge) {ctx.fillStyle=edge?'#72868188':normal[3];ctx.fillRect(lx+1,ly+5,6,1);}
  } else if(r>.87||r<.09) {
    ctx.fillStyle=normal[r>.87?3:4];
    ctx.fillRect(lx+2,ly+3,2+r*2,1);
    if(base==='marsh'||base==='meadow'||base==='trees') ctx.fillRect(lx+4,ly+2,1,3);
  }
}

function floorChunk(scene,column,row) {
  const canvas=document.createElement('canvas');
  canvas.width=CHUNK;canvas.height=CHUNK;
  const context=canvas.getContext('2d',{alpha:false}),sx=column*CHUNK,sy=row*CHUNK;
  for(let ly=0;ly<CHUNK;ly+=STEP) {
    for(let lx=0;lx<CHUNK;lx+=STEP) paintCell(context,scene,sx+lx,sy+ly,lx,ly);
  }
  return canvas;
}

export function drawAdventureGround(ctx,scene,tiles,x,y,w,h,time) {
  const left=Math.max(0,Math.floor(x/CHUNK)),top=Math.max(0,Math.floor(y/CHUNK));
  const right=Math.min(Math.ceil(scene.width/CHUNK)-1,Math.floor((x+w)/CHUNK));
  const bottom=Math.min(Math.ceil(scene.height/CHUNK)-1,Math.floor((y+h)/CHUNK));
  for(let row=top;row<=bottom;row++) {
    for(let col=left;col<=right;col++) {
      const key=row*1000+col;
      const chunk=tiles.get(key)??floorChunk(scene,col,row);
      tiles.delete(key);tiles.set(key,chunk);
      ctx.drawImage(chunk,col*CHUNK,row*CHUNK);
    }
  }
  while(tiles.size>22) tiles.delete(tiles.keys().next().value);
  const water=scene.field.wall==='water'||scene.field.type==='town';
  if(!water) return;
  for(let py=Math.floor(y/28)*28;py<y+h;py+=28) {
    for(let px=Math.floor(x/35)*35;px<x+w;px+=35) {
      const r=hash(px,py,scene.seed);
      const dx=px+5*Math.sin(time+r*16);
      if(r<.20||surface(scene,dx,py)!=='water') continue;
      ctx.fillStyle=r>.78?'#85a8a151':'#55879045';
      ctx.fillRect(dx,py,3+r*9,1);
    }
  }
}

function rectangle(ctx,color,x,y,w,h) {
  ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}

function polygon(ctx,color,points) {
  ctx.fillStyle=color;ctx.beginPath();
  for(const [x,y] of points) ctx.lineTo(x,y);
  ctx.closePath();ctx.fill();
}

function beam(ctx,color,x,y,X,Y,width=2) {
  ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(X,Y);ctx.stroke();
}

function shadow(ctx,x,y,radius=21) {
  ctx.beginPath();ctx.ellipse(x,y,radius,radius*.23,0,0,Math.PI*2);ctx.fillStyle='#111e29a3';ctx.fill();
}

function gate(ctx,x,y,palette,stone) {
  shadow(ctx,x,y,28);
  rectangle(ctx,stone?'#514f4e':'#513f36',x-27,y-5,54,7);
  rectangle(ctx,stone?'#928b78':'#877354',x-25,y-7,50,3);
  for(const offset of [-22,17]) {
    rectangle(ctx,'#292b2b',x+offset-2,y-32,10,34);
    rectangle(ctx,stone?palette.stone:'#786349',x+offset,y-33,6,30);
    rectangle(ctx,'#c2ae7c',x+offset-2,y-34,10,4);
    for(let i=0;i<4;i++) rectangle(ctx,'#38363580',x+offset,y-27+i*6,6,1);
    rectangle(ctx,'#e7bd72',x+offset+1,y-26,4,3);
  }
  if(stone) {
    polygon(ctx,'#434648',[[x-25,y-34],[x-13,y-47],[x+13,y-47],[x+26,y-34],[x+17,y-32],[x+9,y-40],[x-9,y-40],[x-18,y-32]]);
    beam(ctx,'#b2a48b',x-13,y-47,x+13,y-47,2);
  }
}

function hearth(ctx,x,y,time,style) {
  shadow(ctx,x,y,18);
  for (let i=0;i<7;i++) {
    const angle=i/7*Math.PI*2;
    rectangle(ctx,i%2?'#a09681':'#6e6556',x+Math.cos(angle)*13-3,y+Math.sin(angle)*5-2,6,4);
  }
  if(style==='coldHearth') {
    rectangle(ctx,'#403c39',x-7,y-4,14,3);
    for(const [dx,dy] of [[-7,-2],[-2,-5],[5,-3],[10,2],[-10,2]]) rectangle(ctx,'#878078',x+dx,y+dy,3,1);
    return;
  }
  const wide=style==='beacon'?55:34;
  const glow=ctx.createRadialGradient(x,y-9,1,x,y-9,wide);
  glow.addColorStop(0,style==='beacon'?'#f3b765a0':'#e79c5172');glow.addColorStop(1,'#ffb74700');
  rectangle(ctx,glow,x-wide,y-9-wide,wide*2,wide*2);
  rectangle(ctx,'#613b29',x-8,y-3,16,4);
  const bend=Math.sin(time*8)*2;
  const tip=style==='beacon'?29:21;
  polygon(ctx,'#ed9b55',[[x-7,y-4],[x-4,y-16],[x-1,y-10],[x+3+bend,y-tip],[x+7,y-7],[x+5,y-3]]);
  polygon(ctx,'#f8df99',[[x-3,y-5],[x+1,y-12],[x+5,y-6],[x+2,y-4]]);
}

function boat(ctx,x,y,ready) {
  shadow(ctx,x,y,31);
  polygon(ctx,'#472f2a',[[x-31,y-14],[x-18,y-22],[x+20,y-20],[x+33,y-14],[x+20,y+1],[x-18,y+2]]);
  polygon(ctx,'#9e7954',[[x-29,y-14],[x-18,y-19],[x+19,y-17],[x+29,y-13],[x+19,y-7],[x-18,y-7]]);
  polygon(ctx,'#59483a',[[x-19,y-14],[x-12,y-17],[x+14,y-16],[x+21,y-13],[x+12,y-10],[x-13,y-10]]);
  rectangle(ctx,'#bc9368',x-13,y-16,3,9);rectangle(ctx,'#bc9368',x+12,y-15,3,8);
  beam(ctx,'#d0a779',x-19,y-1,x+20,y-2,2);
  if(ready) {
    beam(ctx,'#d7bc87',x-27,y-19,x+26,y-11,2);
    rectangle(ctx,'#a55d4d',x+12,y-15,9,7);
    rectangle(ctx,'#c9886a',x+12,y-15,8,1);
  }
}

function mooring(ctx,x,y,anchored) {
  shadow(ctx,x,y,29);
  rectangle(ctx,'#5e5147',x-23,y-15,7,17);
  rectangle(ctx,'#a49984',x-25,y-16,11,4);
  const link=anchored?5:3, color=anchored?'#929797':'#a68d68';
  for(let i=0;i<7;i++) {
    const px=x-17+i*link,py=y-8+Math.round(Math.sin(i/2)*4)+i*.45;
    rectangle(ctx,color,px,py,link+1,3);
    rectangle(ctx,'#32343a',px+2,py+1,Math.max(1,link-2),1);
  }
  if(anchored) {
    beam(ctx,'#929797',x+21,y-6,x+31,y+1,3);beam(ctx,'#929797',x+27,y-7,x+31,y+1,3);
  } else rectangle(ctx,'#8c7760',x+13,y-1,9,3);
}

function refuge(ctx,x,y) {
  shadow(ctx,x,y,33);
  polygon(ctx,'#4a4645',[[x-33,y],[x-19,y-29],[x+12,y-28],[x+32,y-1]]);
  polygon(ctx,'#82755f',[[x-29,y-1],[x-18,y-27],[x+10,y-27],[x-1,y-1]]);
  polygon(ctx,'#b1a082',[[x-18,y-27],[x+10,y-27],[x+27,y-1],[x-1,y-1]]);
  polygon(ctx,'#4a4944',[[x+4,y-1],[x+11,y-23],[x+23,y-1]]);
  rectangle(ctx,'#8d6250',x-4,y-2,29,4);
  rectangle(ctx,'#b38369',x-8,y,19,3);
  beam(ctx,'#bdab8d',x-19,y-19,x-36,y+1,1);
}

function grove(ctx,x,y,burnt) {
  shadow(ctx,x,y,42);
  for(const [dx,dy] of [[-28,2],[-4,-10],[19,0]]) {
    const a=x+dx,b=y+dy;
    rectangle(ctx,burnt?'#3c3a37':'#665142',a-3,b-33,6,34);
    beam(ctx,burnt?'#55504a':'#7d654f',a,b-19,a+10,b-31,3);
    beam(ctx,burnt?'#4d4742':'#7d654f',a,b-14,a-10,b-26,2);
    if(burnt) {
      rectangle(ctx,'#5c514a',a-9,b+2,17,2);
      rectangle(ctx,'#383331',a-14,b+5,10,2);
    } else {
      polygon(ctx,'#3f5c48',[[a-17,b-22],[a-13,b-37],[a+1,b-46],[a+16,b-34],[a+18,b-24],[a+7,b-17],[a-7,b-17]]);
      polygon(ctx,'#617554',[[a-12,b-34],[a+1,b-44],[a+12,b-34],[a+5,b-27],[a-8,b-28]]);
    }
  }
}

function board(ctx,x,y,style) {
  const wide=style==='market'||style==='inn';
  const w=wide?28:24;
  shadow(ctx,x,y,w*.58);
  rectangle(ctx,'#372c25',x-2,y-24,4,26);
  rectangle(ctx,'#49382f',x-w/2,y-31,w,16);
  rectangle(ctx,wide?'#a48256':'#8b7352',x-w/2+2,y-29,w-4,12);
  rectangle(ctx,'#c6aa75',x-w/2+4,y-28,w-8,1);
  if(wide){
    if(style==='market') {
      polygon(ctx,'#e0c48e',[[x-5,y-24],[x+5,y-24],[x+4,y-19],[x-4,y-19]]);beam(ctx,'#e0c48e',x-4,y-24,x,y-28,1);
    }else{
      rectangle(ctx,'#e0c48e',x-6,y-25,3,6);rectangle(ctx,'#e0c48e',x-6,y-21,13,2);rectangle(ctx,'#e0c48e',x+4,y-24,3,5);
    }
  } else {
    rectangle(ctx,'#e0c48e',x-5,y-24,10,2);rectangle(ctx,'#bc9f76',x-5,y-20,7,1);
  }
}

function den(ctx,x,y,cleared) {
  shadow(ctx,x,y,37);
  polygon(ctx,'#32363c',[[x-36,y],[x-37,y-8],[x-24,y-25],[x-16,y-22],[x-11,y-33],[x+7,y-29],[x+18,y-35],[x+34,y-20],[x+38,y-4],[x+29,y+2]]);
  polygon(ctx,'#111f28',[[x-26,y-5],[x-21,y-15],[x-9,y-24],[x+15,y-24],[x+23,y-15],[x+28,y-4]]);
  beam(ctx,'#687066',x-34,y-10,x-22,y-23,3);beam(ctx,'#6f7367',x+17,y-31,x+34,y-17,3);
  if(!cleared){
    rectangle(ctx,'#e0a670',x-10,y-12,5,2);rectangle(ctx,'#e0a670',x+5,y-12,5,2);
  }
  for(const xx of [-19,-4,13,27]) rectangle(ctx,'#84755a',x+xx,y+7+(xx%5),4,2);
}

function tackle(ctx,x,y) {
  shadow(ctx,x,y,24);
  for(const line of [-15,14]) rectangle(ctx,'#544238',x+line,y-25,4,26);
  rectangle(ctx,'#7a654e',x-17,y-21,35,4);
  for(const dx of [-8,2,10]) {
    beam(ctx,'#c49d67',x+dx,y-24,x+dx-6,y-3,2);rectangle(ctx,'#a28256',x+dx-8,y-8,6,8);
  }
}

function basin(ctx,x,y) {
  shadow(ctx,x,y,20);
  rectangle(ctx,'#605e59',x-15,y-12,30,14);
  polygon(ctx,'#a49983',[[x-18,y-10],[x-13,y-16],[x+13,y-16],[x+19,y-10],[x+13,y-5],[x-13,y-5]]);
  polygon(ctx,'#35545d',[[x-14,y-10],[x-11,y-14],[x+11,y-14],[x+14,y-10],[x+11,y-8],[x-11,y-8]]);
  rectangle(ctx,'#679195',x-6,y-12,9,1);
}

function supplies(ctx,x,y,style) {
  shadow(ctx,x,y,25);
  if(style==='boulder') {
    polygon(ctx,'#484d4d',[[x-19,y-1],[x-17,y-12],[x-4,y-19],[x+13,y-15],[x+19,y-4],[x+15,y+2]]);
    polygon(ctx,'#81817a',[[x-16,y-11],[x-4,y-19],[x+13,y-15],[x+8,y-10],[x-6,y-8]]);
    return;
  }
  rectangle(ctx,'#3e302b',x-18,y-14,36,5);
  rectangle(ctx,'#8c704f',x-21,y-17,42,5);
  for(const dx of [-15,12]) rectangle(ctx,'#674c3b',x+dx,y-11,4,13);
  rectangle(ctx,'#b18e63',x-12,y-22,10,6);
  rectangle(ctx,style==='bench'?'#bca681':'#786b5b',x+1,y-21,14,5);
}

function stall(ctx,x,y,style) {
  const colors=[['#5d756e','#a3b09c'],['#896850','#ba9972'],['#79735f','#b0ab82'],['#546779','#94a3a9']];
  const [dark,pale]=colors[style??0];
  shadow(ctx,x,y,35);
  for(const xx of [-23,21]) rectangle(ctx,'#4b3d36',x+xx,y-39,4,42);
  rectangle(ctx,'#4e3e34',x-27,y-18,56,10);
  rectangle(ctx,'#82664b',x-26,y-21,52,7);
  for(const dx of [-20,-3,14]) {
    rectangle(ctx,'#b39a6f',x+dx,y-24,11,5);
    rectangle(ctx,'#77634e',x+dx,y-23,10,2);
  }
  polygon(ctx,'#313538',[[x-34,y-31],[x-26,y-49],[x+25,y-49],[x+34,y-31]]);
  for(let slice=0;slice<6;slice++) {
    const left=-33+11*slice;
    polygon(ctx,slice%2?dark:pale,[[x+left,y-32],[x+left+7,y-47],[x+left+16,y-47],[x+left+11,y-32]]);
  }
  rectangle(ctx,dark,x-32,y-32,65,3);
}

function breakwater(ctx) {
  for(let i=0;i<8;i++) {
    const x=(i-4)*15,y=7-Math.round(Math.sin(i*.54)*21);
    polygon(ctx,'#3c484c',[[x-10,y],[x-9,y-13],[x,y-22],[x+12,y-16],[x+13,y+1]]);
    polygon(ctx,i%2?'#7b8580':'#89918a',[[x-8,y-11],[x,y-22],[x+11,y-16],[x+7,y-9]]);
    rectangle(ctx,'#718f9065',x-2,y+3,17,2);
  }
}

function windbreak(ctx) {
  for(let i=0;i<10;i++) {
    const x=i*12-61, top= -52+(i%3)*4;
    rectangle(ctx,'#4f473b',x,top,9,50-(i%3)*4);
    rectangle(ctx,i%2?'#806852':'#a38761',x+1,top+1,6,41-(i%3)*4);
    rectangle(ctx,'#b29a72',x+1,top+2,6,2);
  }
  beam(ctx,'#584238',-63,-29,59,-23,5);
  beam(ctx,'#765944',-63,-12,59,-5,4);
}

function reedBridge(ctx) {
  for(const x of [-45,-25,0,25,46]) {
    rectangle(ctx,'#463e39',x,-34,4,37);
    rectangle(ctx,'#9c8865',x-2,-36,8,4);
    for(let i=0;i<4;i++) {
      const leaf=x-6+i*4, z=-10-i*3;
      beam(ctx,i%2?'#627456':'#8d9770',leaf,5,leaf+(i%2?5:-4),z,2);
    }
  }
  beam(ctx,'#a18e68',-45,-28,47,-28,3);
  beam(ctx,'#5e6250',-45,-17,47,-17,2);
}

function roofRuin(ctx) {
  shadow(ctx,0,0,56);
  polygon(ctx,'#3d3a39',[[-53,1],[-53,-52],[-28,-54],[-8,-63],[13,-55],[23,-31],[39,-40],[48,-29],[48,1]]);
  polygon(ctx,'#796d59',[[-50,-2],[-50,-48],[-27,-49],[-8,-58],[10,-49],[18,-25],[27,-28],[42,-27],[43,-2]]);
  polygon(ctx,'#4b4a45',[[-54,-48],[-37,-67],[-13,-74],[9,-72],[27,-58],[24,-50],[3,-62],[-16,-61],[-46,-46]]);
  rectangle(ctx,'#282c2d',-37,-35,14,24);rectangle(ctx,'#292d2f',17,-20,16,21);
  for(const x of [-42,-33,-11,2,34]) rectangle(ctx,'#9a8870',x,-22-x%5,8,2);
}

function forestVista(ctx) {
  for(const [x,y,size] of [[-32,0,.74],[1,-9,1.03],[34,2,.81]]){
    rectangle(ctx,'#554a42',x-3,y-45*size,6,47*size);
    for(let n=0;n<3;n++){
      const leafY=y-73*size+n*14*size, half=(16+n*7)*size;
      polygon(ctx,n===0?'#40614f':n===1?'#365745':'#304f42',[[x,leafY],[x-half,leafY+31*size],[x,leafY+27*size],[x+half,leafY+31*size]]);
      beam(ctx,'#6c806052',x,leafY+4,x-half*.81,leafY+27*size,1);
    }
  }
}

function cliffVista(ctx) {
  for(let i=0;i<4;i++) {
    const x=-79+i*44,y=6-(i%2)*11;
    polygon(ctx,i%2?'#455461':'#3c4b59',[[x-7,y],[x+4,y-17],[x+24,y-26],[x+38,y-17],[x+44,y-3],[x+44,y+8]]);
    beam(ctx,'#82908a',x+5,y-17,x+25,y-25,2);
    beam(ctx,'#677c83',x+23,y-10,x+31,y+4,1);
  }
}

function shelving(ctx,stone) {
  shadow(ctx,0,0,42);
  const beamColor=stone?'#4d5050':'#493b33',front=stone?'#7a7970':'#8a6e51';
  for(const x of [-39,33]) rectangle(ctx,beamColor,x,-53,7,55);
  for(const y of [-50,-29,-9]) {
    rectangle(ctx,beamColor,-41,y-4,82,8);
    rectangle(ctx,front,-40,y-4,79,2);
  }
  for(const [x,y] of [[-32,-43],[-10,-24],[9,-46],[20,-25],[-33,-9]]){
    rectangle(ctx,stone?'#6e6b61':'#785b45',x,y-7,13,9);
    rectangle(ctx,stone?'#a39b83':'#b39166',x,y-6,11,2);
    rectangle(ctx,'#4b423c',x+3,y-1,8,1);
  }
}

function sluiceGate(ctx) {
  shadow(ctx,0,0,47);
  for(const x of [-43,32]) {
    rectangle(ctx,'#343739',x,-61,11,62);
    rectangle(ctx,'#777b72',x+2,-60,7,54);
    rectangle(ctx,'#929488',x-3,-62,17,6);
  }
  rectangle(ctx,'#454643',-44,-57,89,10);
  rectangle(ctx,'#826d53',-42,-56,85,4);
  for(let i=0;i<8;i++){
    const x=-29+i*8;
    rectangle(ctx,i%2?'#665c4e':'#786855',x,-42,6,34);
    rectangle(ctx,'#343e3e',x,-12,6,4);
  }
  beam(ctx,'#aaab9a',-6,-49,-6,-17,2);
  beam(ctx,'#919589',-16,-44,4,-44,2);
}

function crystalCluster(ctx,color,light) {
  shadow(ctx,0,0,42);
  for(const [x,y,h,w] of [[-27,0,25,13],[-16,1,42,12],[2,-3,61,16],[21,0,31,10],[34,0,18,11]]){
    polygon(ctx,color,[[x-w,y],[x-w*.55,y-h*.60],[x+1,y-h],[x+w*.72,y-h*.42],[x+w,y]]);
    polygon(ctx,light,[[x+1,y-h],[x-w*.55,y-h*.60],[x-3,y-5],[x+4,y-h*.41]]);
  }
}

function furnace(ctx) {
  shadow(ctx,0,0,53);
  polygon(ctx,'#3f3430',[[-49,1],[-48,-30],[-35,-59],[-20,-75],[21,-75],[42,-50],[49,-25],[49,1]]);
  polygon(ctx,'#78604e',[[-45,-2],[-44,-29],[-30,-57],[-18,-68],[19,-68],[37,-49],[43,-28],[43,-2]]);
  polygon(ctx,'#38282a',[[-21,-3],[-21,-24],[-13,-35],[14,-35],[22,-20],[22,-3]]);
  for(const x of [-19,-9,1,10]) rectangle(ctx,'#cf804c',x,-7,8,2);
  for(const [x,y,w] of [[-41,-29,17],[-21,-46,28],[-9,-56,27],[21,-39,19]]) rectangle(ctx,'#a27f61',x,y,w,2);
}

function ribs(ctx,bone) {
  const ink=bone?'#71685b':'#544c41',color=bone?'#c2ae90':'#927456';
  shadow(ctx,0,0,59);
  for(const n of [-4,-3,-2,-1,0,1,2,3,4]){
    const x=n*13,y=1-(n%2)*3,h=(5-Math.abs(n))*8;
    beam(ctx,ink,x-4,y,x+8,y-h,5);
    beam(ctx,color,x-3,y-4,x+7,y-h,3);
    beam(ctx,color,x+7,y-h,x+15,y-h+5,2);
  }
  beam(ctx,ink,-57,3,59,3,5);
}

function fallenTrunks(ctx) {
  shadow(ctx,0,0,47);
  for(const [dx,dy,slope] of [[-18,-1,-16],[14,4,9]]){
    beam(ctx,'#434538',dx-35,dy-slope,dx+36,dy+slope,14);
    beam(ctx,'#77674d',dx-34,dy-slope-3,dx+34,dy+slope-3,7);
    beam(ctx,'#a08a62',dx-32,dy-slope-4,dx+30,dy+slope-4,2);
    rectangle(ctx,'#b49a71',dx+28,dy+slope-5,11,9);
    beam(ctx,'#4d6049',dx-13,dy-2,dx-7,dy-22,3);
  }
}

function barnDoor(ctx) {
  shadow(ctx,0,0,45);
  polygon(ctx,'#6e5b47',[[-43,1],[-43,-46],[-27,-59],[28,-59],[43,-46],[43,1]]);
  polygon(ctx,'#4b4239',[[-45,-45],[-31,-62],[30,-62],[46,-45],[39,-43],[-39,-43]]);
  rectangle(ctx,'#332e2c',-19,-41,38,42);
  rectangle(ctx,'#947256',-25,-44,7,46);rectangle(ctx,'#947256',19,-44,7,46);
  rectangle(ctx,'#a28862',-24,-44,50,4);
  for(const x of [-41,-33,30,38]) rectangle(ctx,'#806752',x,-43,2,41);
  rectangle(ctx,'#9b8865',-25,1,51,3);
}

function forestGate(ctx) {
  shadow(ctx,0,0,44);
  for(const x of [-34,24]) {
    polygon(ctx,'#544738',[[x-8,2],[x-5,-34],[x+2,-45],[x+11,-40],[x+14,2]]);
    beam(ctx,'#998665',x-4,-32,x+4,-43,2);
    for(const move of [-1,1]) beam(ctx,'#614a3a',x+4,-2,x+18*move,4,3);
  }
  beam(ctx,'#89976e',-34,-30,-31,-50,2);beam(ctx,'#89976e',26,-30,30,-47,2);
  rectangle(ctx,'#7a735a',-23,1,46,3);
}

function tunnelMouth(ctx) {
  shadow(ctx,0,0,44);
  polygon(ctx,'#424951',[[-46,1],[-44,-12],[-29,-42],[-17,-55],[12,-55],[28,-47],[45,-19],[46,1]]);
  polygon(ctx,'#18252f',[[-28,0],[-27,-13],[-17,-35],[-5,-42],[12,-39],[21,-28],[28,0]]);
  beam(ctx,'#787e75',-29,-42,-17,-54,3);beam(ctx,'#747b74',10,-53,27,-45,3);
  rectangle(ctx,'#687572',-27,1,54,3);
}

const signatureArt = {
  breakwater,windbreak,reedBridge,roofRuin,forestVista,cliffVista,shelving:ctx=>shelving(ctx,false),stoneShelves:ctx=>shelving(ctx,true),
  sluiceGate,waxPillars:ctx=>crystalCluster(ctx,'#937650','#caa574'),iceSpire:ctx=>crystalCluster(ctx,'#4d7688','#a7c4c1'),
  echoStones:ctx=>crystalCluster(ctx,'#6f7272','#a1a398'),reefStone:ctx=>crystalCluster(ctx,'#55696c','#77918b'),
  furnace,shipFrame:ctx=>ribs(ctx,false),boneRibs:ctx=>ribs(ctx,true),fallenTrunks,barnDoor,forestGate,tunnelMouth
};

export function drawAdventureObject(ctx,object,palette,time,opened) {
  const {x,y,physical}=object;
  const feature=signatureArt[physical];
  if(feature) {
    ctx.save();ctx.translate(x,y);
    const marker=object.kind?.startsWith('adventure');
    const size=object.small?.58:marker?.47:1;
    ctx.scale(size,size);feature(ctx);ctx.restore();
    return;
  }
  switch(physical) {
    case null:return;
    case 'gate':return gate(ctx,x,y,palette,true);
    case 'trailgate':return gate(ctx,x,y,palette,false);
    case 'hearth':case 'coldHearth':case 'beacon':return hearth(ctx,x,y,time,physical);
    case 'boat':case 'readyBoat':return boat(ctx,x,y,physical==='readyBoat');
    case 'mooring':case 'anchored':return mooring(ctx,x,y,physical==='anchored');
    case 'refuge':return refuge(ctx,x,y);
    case 'camp':return refuge(ctx,x,y);
    case 'grove':case 'burntGrove':return grove(ctx,x,y,physical==='burntGrove');
    case 'tackle':return tackle(ctx,x,y);
    case 'cistern':return basin(ctx,x,y);
    case 'den':return den(ctx,x,y,opened);
    case 'stall':return stall(ctx,x,y,object.variant);
    case 'board':case 'inn':case 'market':return board(ctx,x,y,physical);
    default:return supplies(ctx,x,y,physical);
  }
}

export function adventureAppearance(object,state) {
  if(!state||!object.appearance?.length) return object;
  const version=object.appearance.find(({flag,endings})=>
    (!flag||state.flags?.[flag])&&(!endings||endings.includes(state.ending)));
  return version?{...object,physical:version.art}:object;
}
