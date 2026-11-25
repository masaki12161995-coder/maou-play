const shapes = {
  saltRack:   { footprint:[34,11], picture:[46,55] },
  saltShed:   { footprint:[59,23], picture:[72,76] },
  stiltHouse: { footprint:[55,20], picture:[69,104] },
  arcade:     { footprint:[76,26], picture:[83,89] },
  pine:       { footprint:[10,9], picture:[35,87] },
  iceLodge:   { footprint:[49,26], picture:[65,112] },
  kiln:       { footprint:[72,26], picture:[87,130] },
  tidalGate:  { footprint:[64,15], picture:[79,88] },
  lighthouse: { footprint:[34,24], picture:[43,161] },
  reeds:      { footprint:[0,0], picture:[0,0] },
  bollard:    { footprint:[10,6], picture:[14,26] },
  furnaceCrate:{footprint:[20,9], picture:[25,26] }
};

export function townPropSize(kind,size) {
  return shapes[kind]?.footprint.map(n=>n*size)??null;
}

export function townPropBounds({kind,size}) {
  return shapes[kind]?.picture.map(n=>n*size)??null;
}

function rect(ctx,color,x,y,w,h) {
  ctx.fillStyle=color;
  ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
}

function poly(ctx,color,points) {
  ctx.fillStyle=color;
  ctx.beginPath();
  for(const [x,y] of points) ctx.lineTo(Math.round(x),Math.round(y));
  ctx.closePath();
  ctx.fill();
}

function ellipse(ctx,color,x,y,rx,ry) {
  ctx.fillStyle=color;
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);
  ctx.fill();
}

function masonry(ctx,x,y,w,h,face,mortar) {
  rect(ctx,face,x,y,w,h);
  for(let row=0;row<h-4;row+=8){
    rect(ctx,mortar,x,y+row,w,1);
    for(let i=(row%16?7:0);i<w-10;i+=14) rect(ctx,mortar,x+i+4,y+row,1,8);
  }
}

function lantern(ctx,x,y,color) {
  rect(ctx,'#221e1b',x-6,y-6,12,13);
  rect(ctx,'#765130',x-4,y-4,8,9);
  rect(ctx,color,x-3,y-3,6,5);
  rect(ctx,'#ffe9aa',x-2,y-2,4,2);
}

function saltRack(ctx) {
  ellipse(ctx,'#23312e65',0,1,41,8);
  for(const x of [-37,37]){
    rect(ctx,'#574936',x,-51,4,52);
    rect(ctx,'#a38b65',x,-52,6,3);
  }
  for(const y of [-40,-17]){
    rect(ctx,'#796145',-42,y,84,5);
    rect(ctx,'#c4a784',-42,y,84,1);
    for(let i=0;i<5;i++) {
      const x=i*16-38;
      poly(ctx,'#9b9380',[[x,y],[x+7,y-10],[x+13,y-1],[x+13,y+2],[x,y+2]]);
      poly(ctx,'#d9ccb2',[[x+2,y-2],[x+7,y-10],[x+11,y-3]]);
    }
  }
  rect(ctx,'#aa8760',-41,-52,82,4);
  rect(ctx,'#ccb299',-32,-47,3,10);
  rect(ctx,'#d9cec1',-16,-47,7,9);
  rect(ctx,'#bcb2a1',24,-47,6,8);
}

function saltShed(ctx,variant) {
  ellipse(ctx,'#2130287c',4,1,71,12);
  rect(ctx,'#524940',-62,-37,124,38);
  masonry(ctx,-60,-37,120,33,'#aca68f','#66695671');
  rect(ctx,'#353537',-20,-32,41,33);
  rect(ctx,'#706151',-17,-29,34,29);
  for(let i=-14;i<16;i+=6) rect(ctx,'#a1916f',i,-29,1,28);
  rect(ctx,'#302d2a',-3,-28,3,27);
  rect(ctx,'#c69f5a',-5,-15,7,2);
  const roof=variant?'#6a7978':'#95a1a0';
  poly(ctx,'#3e4d4b',[[-71,-37],[-42,-68],[58,-68],[71,-37]]);
  poly(ctx,roof,[[-69,-41],[-44,-67],[57,-67],[68,-41]]);
  for(let y=-63;y<-40;y+=5){
    rect(ctx,'#46565094',-43-(y+63)*.93,y,100+(y+63)*1.37,1);
  }
  rect(ctx,'#d2d6bd',-43,-70,102,3);
  rect(ctx,'#272e2d',-70,-40,140,4);
  lantern(ctx,-38,-24,'#f2cf8d');
}

function stiltHouse(ctx,variant) {
  ellipse(ctx,'#183d435e',0,0,63,10);
  for(const x of [-49,-27,28,51]){
    rect(ctx,'#574234',x,-31,6,32);
    rect(ctx,'#a58a64',x,-27,2,23);
  }
  poly(ctx,'#66523b',[[-27,-24],[22,-24],[35,3],[-41,3]]);
  for(let i=0;i<7;i++) rect(ctx,i%2?'#987a53':'#806549',-27-i*2,-23+i*4,50+i*3,3);
  rect(ctx,'#5a4635',-57,-61,114,40);
  for(let x=-55;x<56;x+=7) rect(ctx,'#a88a61a0',x,-59,3,36);
  rect(ctx,'#3e382e',-14,-54,29,32);
  for(const x of [-42,34]) {
    rect(ctx,'#332d29',x-8,-49,16,17);
    rect(ctx,'#d9aa5c',x-6,-46,12,11);
    rect(ctx,'#694c35',x-1,-47,2,14);
  }
  const roof=variant?'#62725b':'#6e5942';
  poly(ctx,'#443c2f',[[-69,-59],[-43,-92],[37,-92],[68,-59]]);
  poly(ctx,roof,[[-66,-65],[-44,-94],[38,-94],[65,-65]]);
  for(let i=0;i<7;i++) {
    const left=-45-i*3,y=-92+i*4;
    rect(ctx,'#a6966c4d',left,y,84+i*6,2);
  }
  rect(ctx,'#b8a17a',-44,-96,84,2);
  rect(ctx,'#3b362e',-68,-63,136,4);
}

function arcade(ctx,variant) {
  ellipse(ctx,'#28363880',0,1,82,11);
  rect(ctx,'#7b7770',-78,-66,156,66);
  masonry(ctx,-77,-67,154,64,variant?'#b7aca0':'#c8bcb0','#766d666e');
  for(const center of [-51,0,51]){
    poly(ctx,'#343c3c',[[center-16,-3],[center-16,-39],[center-12,-49],[center,-54],[center+12,-49],[center+16,-39],[center+16,-3]]);
    rect(ctx,'#8b8177',center-20,-35,4,32);
    rect(ctx,'#e5d2bc',center+16,-37,4,34);
    rect(ctx,'#6f675e',center-17,-8,33,4);
  }
  for(const x of [-72,-24,24,72]) {
    rect(ctx,'#eee0c6',x-3,-58,5,57);
    rect(ctx,'#b4a18c',x+1,-57,4,56);
    rect(ctx,'#ded2b9',x-7,-17,13,6);
  }
  rect(ctx,'#543f3c',-83,-70,166,8);
  rect(ctx,'#e5d1b6',-81,-74,162,5);
  rect(ctx,'#8d7768',-79,-77,158,3);
  rect(ctx,'#c2aa8c',-63,-83,126,6);
  for(let x=-66;x<71;x+=12) rect(ctx,'#eadcc5',x,-76,5,2);
}

function pine(ctx,variant) {
  ellipse(ctx,'#243c3d63',0,0,24,7);
  const snow=variant>=.4;
  rect(ctx,'#5d5047',-3,-33,7,35);
  rect(ctx,'#b9a790',0,-24,2,21);
  for(let i=3;i>=0;i--){
    const y=-83+i*15,w=13+i*6;
    poly(ctx,'#27433e',[[0,y],[w+2,y+29],[8,y+27],[-8,y+30],[-w,y+26]]);
    poly(ctx,'#4e6a5e',[[0,y+1],[3,y+24],[-w,y+26]]);
    if(snow) poly(ctx,'#cbd5ce',[[0,y+1],[Math.round(w*.68),y+20],[5,y+16],[-5,y+19],[-Math.round(w*.68),y+20]]);
  }
}

function iceLodge(ctx,variant) {
  ellipse(ctx,'#273d3c77',0,1,62,12);
  rect(ctx,'#5a5249',-53,-45,106,46);
  for(let y=-43;y<0;y+=6) rect(ctx,'#8e7964',-51,y,102,3);
  rect(ctx,'#292d2b',-11,-32,22,31);
  rect(ctx,'#806047',-8,-29,16,28);
  for(const x of [-34,35]) {
    rect(ctx,'#333b3f',x-8,-43,16,20);
    rect(ctx,'#e7b372',x-6,-40,12,14);
    rect(ctx,'#6f513f',x,-40,2,15);
  }
  poly(ctx,'#374a52',[[-66,-45],[-9,-112],[9,-112],[66,-45]]);
  poly(ctx,variant?'#677f83':'#7a9098',[[-61,-50],[0,-110],[9,-104],[60,-50]]);
  for(let i=0;i<10;i++) rect(ctx,'#415a616d',-3-i*5,-105+i*6,7+i*10,2);
  poly(ctx,'#cfdad4',[[0,-113],[34,-80],[22,-82],[17,-88],[12,-83],[-2,-97],[-12,-83],[-29,-82]]);
  poly(ctx,'#9db1b1',[[-63,-48],[-46,-62],[-26,-52],[-6,-50],[24,-53],[44,-61],[63,-48],[27,-45],[0,-44],[-26,-46]]);
  rect(ctx,'#42545a',-65,-47,130,3);
}

function kiln(ctx,variant,time) {
  ellipse(ctx,'#231a19a0',0,1,84,12);
  masonry(ctx,-76,-70,151,71,'#6f5447','#382d298c');
  for(const x of [-55,48]) {
    poly(ctx,'#483733',[[x-18,-47],[x-12,-120],[x+10,-120],[x+18,-47]]);
    rect(ctx,'#8a6553',x-13,-123,26,6);
    rect(ctx,'#a18068',x-16,-127,32,4);
    for(let y=-111;y<-54;y+=8) rect(ctx,'#aa816a6b',x-10,y,20,1);
    for(let i=0;i<4;i++) {
      const phase=(time*.29+i*.22+(x===48?.35:0))%1;
      const spread=3+phase*13;
      ctx.save();
      ctx.globalAlpha=(1-phase)*.32;
      ellipse(ctx,'#cab8ab',x+4+phase*26,-130-phase*34,spread,spread*.39);
      ctx.restore();
    }
  }
  poly(ctx,'#8a6450',[[-46,-5],[-46,-43],[-36,-62],[-23,-73],[24,-73],[38,-59],[48,-42],[48,-5]]);
  poly(ctx,'#332522',[[-39,-6],[-39,-41],[-29,-55],[-18,-61],[19,-61],[32,-52],[41,-39],[41,-6]]);
  poly(ctx,'#5b2f25',[[-24,-6],[-24,-35],[-14,-47],[18,-47],[26,-36],[26,-6]]);
  const fire=variant?'#d77744':'#f2a25a';
  poly(ctx,fire,[[-20,-8],[-15,-24],[-7,-17],[-3,-34-Math.sin(time*5)*3],[7,-19],[9,-27],[19,-9]]);
  rect(ctx,'#ead497',-13,-10,28,4);
  rect(ctx,'#a27a61',-80,-2,160,3);
  rect(ctx,'#3b302c',-78,-74,156,5);
}

function tidalGate(ctx,variant) {
  ellipse(ctx,'#252e3d75',0,0,74,8);
  for(const x of [-43,43]){
    rect(ctx,'#59616a',x-8,-68,16,67);
    rect(ctx,'#939398',x-6,-67,6,66);
    for(let y=-62;y<-4;y+=11) rect(ctx,'#444a55',x-8,y,15,1);
    rect(ctx,'#a9a4a2',x-13,-17,26,5);
    rect(ctx,'#77747b',x-14,-10,27,8);
  }
  const shade=variant?'#544c60':'#444c5d';
  poly(ctx,shade,[[-77,-78],[-56,-76],[55,-76],[77,-81],[68,-66],[-67,-66]]);
  poly(ctx,'#aa9d9a',[[-77,-83],[-54,-81],[55,-81],[77,-86],[67,-76],[-67,-76]]);
  rect(ctx,'#807c86',-64,-53,128,8);
  rect(ctx,'#b5a7a3',-60,-54,120,2);
  rect(ctx,'#504a57',-8,-67,16,24);
  rect(ctx,'#c1a88a',-5,-64,10,1);
  rect(ctx,'#bda997',-3,-60,6,9);
}

function lighthouse(ctx,variant,time) {
  ellipse(ctx,'#2429368c',0,0,44,13);
  poly(ctx,'#483f49',[[-34,1],[-23,-110],[24,-110],[34,1]]);
  poly(ctx,'#d1c6b0',[[-28,-1],[-20,-105],[19,-105],[29,-1]]);
  poly(ctx,'#9f978d',[[7,-2],[7,-105],[19,-105],[29,-1]]);
  for(const y of [-24,-55,-86]) {
    const w=29+(y/12);
    poly(ctx,variant?'#93635b':'#80626d',[[-w,y],[w,y],[w-1,y+12],[-w-1,y+12]]);
    rect(ctx,'#e0af8d5c',-w+2,y,2*w-5,2);
  }
  rect(ctx,'#493d40',-7,-21,15,21);
  rect(ctx,'#6f5851',-5,-19,11,17);
  rect(ctx,'#403b46',-37,-108,74,7);
  rect(ctx,'#816f70',-39,-114,78,6);
  for(let x=-35;x<37;x+=7) rect(ctx,'#4d4551',x,-114,2,9);
  rect(ctx,'#43394a',-25,-142,50,31);
  rect(ctx,'#e8b66a',-20,-138,40,24);
  for(const x of [-14,0,14]) rect(ctx,'#83665a',x,-138,2,24);
  rect(ctx,'#ffe7a7',-15,-132,30,9);
  poly(ctx,'#454755',[[-34,-142],[-6,-160],[6,-160],[34,-142]]);
  rect(ctx,'#8d8890',-32,-143,64,3);
  const reach=37+Math.sin(time*1.3)*8;
  const glow=ctx.createRadialGradient(0,-126,4,0,-126,reach);
  glow.addColorStop(0,'#ffe5ae70');
  glow.addColorStop(1,'#ffe5ae00');
  ellipse(ctx,glow,0,-126,reach,reach*.73);
}

function reeds(ctx,variant) {
  for(let i=0;i<7;i++) {
    const x=-18+i*6;
    const h=11+(i*7)%19;
    poly(ctx,'#55684e',[[x,-h],[x+3,0],[x+1,0],[x-2,-h*.7]]);
    rect(ctx,variant?'#baad77':'#9a865c',x-1,-h-3,3,6);
  }
}

function bollard(ctx) {
  ellipse(ctx,'#2635388a',0,1,11,5);
  rect(ctx,'#3b3736',-5,-22,10,23);
  rect(ctx,'#8b7969',-3,-22,2,22);
  rect(ctx,'#b3a38d',-8,-22,16,3);
  rect(ctx,'#56483e',-7,-11,14,4);
  rect(ctx,'#b9a07c',-6,-11,12,1);
}

function furnaceCrate(ctx) {
  ellipse(ctx,'#2b232079',0,1,24,6);
  rect(ctx,'#57433c',-20,-17,40,17);
  rect(ctx,'#b48060',-20,-20,40,6);
  for(let x=-17;x<20;x+=7) rect(ctx,'#7e5e4f',x,-14,3,12);
  rect(ctx,'#312b27',-20,-5,40,4);
}

const crafts={saltRack,saltShed,stiltHouse,arcade,pine,iceLodge,kiln,tidalGate,lighthouse,reeds,bollard,furnaceCrate};

export function drawTownProp(ctx,prop,palette,time) {
  const draw=crafts[prop.kind];
  if(!draw) return false;
  ctx.save();
  ctx.translate(Math.round(prop.x),Math.round(prop.y));
  ctx.scale(prop.size,prop.size);
  const v=prop.variant;
  draw(ctx,v,time,palette);
  ctx.restore();
  return true;
}

function saltPan(ctx,x,y,w,h) {
  rect(ctx,'#675d53',x,y,w,h);
  rect(ctx,'#b5a18b',x+3,y+3,w-6,h-6);
  rect(ctx,'#716d6b',x+6,y+6,w-12,h-12);
  rect(ctx,'#968f8b',x+8,y+8,w-16,h-16);
  rect(ctx,'#ccc3aa',x+8,y+h-11,w-16,3);
  for(let i=12;i<w-6;i+=12) rect(ctx,'#e2d7bb70',x+i,y+h-14-(i%8),5,1);
}

function stairs(ctx,x,y,w,h) {
  rect(ctx,'#575450',x,y,w,h);
  for(let i=2;i<h-3;i+=6){
    rect(ctx,i%12<6?'#aaa294':'#958c81',x+3,y+i,w-6,4);
    rect(ctx,'#c9bbab',x+3,y+i,w-6,1);
  }
  rect(ctx,'#baab92',x,y-1,4,h+3);
  rect(ctx,'#a99986',x+w-4,y-1,4,h+3);
}

function platform(ctx,x,y,w,h,colors) {
  rect(ctx,colors[0],x,y,w,h);
  rect(ctx,colors[1],x+2,y+2,w-4,h-4);
  for(let j=4;j<h-4;j+=10) {
    rect(ctx,colors[2],x+4,y+j,w-8,1);
    for(let i=(j%20<10?8:13);i<w-6;i+=13) rect(ctx,colors[2],x+i,y+j,1,9);
  }
}

function ice(ctx,x,y,w,h) {
  const points=[[x+w*.14,y],[x+w*.75,y+2],[x+w,y+h*.35],[x+w*.86,y+h*.83],[x+w*.48,y+h],[x+w*.08,y+h*.76],[x,y+h*.37]];
  poly(ctx,'#a5bab4',points);
  poly(ctx,'#c9d3cb',[[x+w*.16,y+4],[x+w*.74,y+6],[x+w*.96,y+h*.35],[x+w*.38,y+h*.37],[x+w*.13,y+h*.65],[x+4,y+h*.37]]);
}

const groundPaint = {
  salt:saltPan,stair:stairs,ice,
  limestone:(ctx,x,y,w,h)=>platform(ctx,x,y,w,h,['#635f59','#8e8982','#b1a4965a']),
  ash:(ctx,x,y,w,h)=>platform(ctx,x,y,w,h,['#47372f','#69574e','#95827566']),
  pier:(ctx,x,y,w,h)=>platform(ctx,x,y,w,h,['#4a4b51','#777077','#aea3a36b']),
};

export function drawTownFloor(ctx,scene) {
  for(const [kind,x,y,w,h] of scene.ground??[]) groundPaint[kind](ctx,x,y,w,h);
  for(const [left,right,top,bottom] of scene.bridges??[]) {
    const w=right-left,h=bottom-top,wood='#76644d';
    rect(ctx,'#1f33356b',left-4,top+4,w+8,h+5);
    rect(ctx,'#5c4c3d',left,top,w,h);
    if(w>=h){
      for(let x=left+1;x<right-2;x+=6) rect(ctx,x%4?wood:'#917453',x,top+2,4,h-4);
      for(let x=left;x<right;x+=26) {
        rect(ctx,'#b39972',x,top-1,3,6);
        rect(ctx,'#b39972',x,bottom-5,3,6);
      }
    } else {
      for(let y=top+1;y<bottom-2;y+=6) rect(ctx,y%4?wood:'#917453',left+2,y,w-4,4);
      for(let y=top;y<bottom;y+=26) {
        rect(ctx,'#b39972',left-1,y,6,3);
        rect(ctx,'#b39972',right-5,y,6,3);
      }
    }
  }
}
