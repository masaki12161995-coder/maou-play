(() => {
"use strict";
const WIDTH = 201;
const HEIGHT = 437;
const HUD_WIDTH = 302;
const toHud = dot => Math.round(dot * 3 / 2);
const SPEEDS = [1, 2, 4];
const COMMAND = { x: 86, y: 578, width: 130, height: 34 };
const FOE_FEET = 216;
const CARD_TOP = 499;
const CARD_WIDTH = 62;
const CARD_LEFT = [16, 83, 157, 224];

function layoutEnemies(sprites) {
  const totalWidth = sprites.reduce((width, sprite) => width + sprite.width, 0);
  // As in the original game, space the row using the actual widths. Keep full size at the edges.
  const gap = Math.max(3, Math.floor((WIDTH - totalWidth) / (sprites.length + 1)));
  let left = Math.floor((WIDTH - totalWidth - gap * (sprites.length - 1)) / 2);
  return sprites.map(sprite => {
    const place = { left, x: left + Math.floor(sprite.width / 2), width: sprite.width, height: sprite.height };
    left += sprite.width + gap;
    return place;
  });
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// Fill whole pixels so mountain ridges and edges use the same grid as the sprites.
function polygon(ctx, color, points) {
  const minY = Math.max(0, Math.floor(Math.min(...points.map(point => point[1]))));
  const maxY = Math.min(ctx.canvas.height - 1, Math.ceil(Math.max(...points.map(point => point[1]))));
  ctx.fillStyle = color;
  for (let y = minY; y <= maxY; y++) {
    const scan = y + 0.5;
    const crossings = [];
    for (let i = 0; i < points.length; i++) {
      const [ax, ay] = points[i];
      const [bx, by] = points[(i + 1) % points.length];
      if ((ay <= scan && by > scan) || (by <= scan && ay > scan)) {
        crossings.push(ax + ((scan - ay) * (bx - ax)) / (by - ay));
      }
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i < crossings.length; i += 2) {
      const left = Math.ceil(crossings[i] - 0.5);
      const right = Math.ceil(crossings[i + 1] - 0.5);
      ctx.fillRect(left, y, right - left, 1);
    }
  }
}

function line(ctx, color, ax, ay, bx, by, width = 1) {
  ax = Math.round(ax);
  ay = Math.round(ay);
  bx = Math.round(bx);
  by = Math.round(by);
  const dx = Math.abs(bx - ax);
  const dy = -Math.abs(by - ay);
  const sx = ax < bx ? 1 : -1;
  const sy = ay < by ? 1 : -1;
  let error = dx + dy;
  ctx.fillStyle = color;
  while (true) {
    ctx.fillRect(ax, ay, width, width);
    if (ax === bx && ay === by) break;
    const doubled = error * 2;
    if (doubled >= dy) { error += dy; ax += sx; }
    if (doubled <= dx) { error += dx; ay += sy; }
  }
}

function oval(ctx, color, x, y, rx, ry) {
  ctx.fillStyle = color;
  for (let offset = -ry; offset <= ry; offset++) {
    const wide = Math.floor(rx * Math.sqrt(1 - (offset / ry) ** 2));
    ctx.fillRect(x - wide, y + offset, wide * 2 + 1, 1);
  }
}

function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function pine(ctx, x, y, height, colors, seed) {
  const rand = random(seed);
  const trunk = Math.max(1, Math.round(height / 22));
  const top = y - height;
  rect(ctx, colors[0], x - 1, top + 6, trunk + 1, height - 6);
  rect(ctx, colors[1], x + trunk - 1, top + 15, 1, height - 15);
  let previous = 0;
  for (let depth = 4; depth < height * 0.91; depth += 4 + Math.floor(rand() * 4)) {
    const cy = top + depth;
    const wing = Math.min(23, 2 + Math.floor(depth * (0.16 + rand() * 0.12)));
    const branch = 2 + Math.floor(depth * 0.11);
    const extension = Math.floor(rand() * 4);
    polygon(ctx, colors[0], [
      [x, cy - 7], [x + 4, cy - 2], [x + wing, cy + branch - 2],
      [x + wing + extension, cy + branch], [x + wing - 3, cy + branch + 1],
      [x + 2, cy + 2], [x - 3, cy + 4], [x - wing - 2, cy + branch + 1],
      [x - wing + 1, cy + branch - 2], [x - 4, cy - 1],
    ]);
    line(ctx, colors[2], x + 1, cy, x + wing - 1, cy + branch - 2);
    line(ctx, colors[1], x - 3, cy + 1, x - wing + 1, cy + branch - 1);
    if (wing > 7) {
      rect(ctx, colors[2], x + wing - 3, cy + branch + 1, 3, 1);
      rect(ctx, colors[0], x - wing + 2, cy + branch + 2, 3, 1);
      if (previous > 4) rect(ctx, colors[1], x + 4, cy + 4, 3, 1);
    }
    previous = wing;
  }
}

function mountains(ctx) {
  rect(ctx, '#142034', 0, 0, WIDTH, HEIGHT);
  rect(ctx, '#1b2c42', 0, 24, WIDTH, 136);
  rect(ctx, '#243950', 0, 61, WIDTH, 108);
  rect(ctx, '#2e4559', 0, 106, WIDTH, 82);
  const rand = random(36);
  for (let i = 0; i < 49; i++) {
    const x = Math.floor(rand() * WIDTH);
    const y = 4 + Math.floor(rand() * 129);
    rect(ctx, y < 34 ? '#2c3d53' : '#3c5267', x, y, 1 + Math.floor(rand() * (y < 34 ? 2 : 6)), 1);
  }
  oval(ctx, '#314256', 153, 25, 10, 9);
  oval(ctx, '#d4bf8b', 153, 25, 7, 7);
  oval(ctx, '#e4d3a3', 151, 24, 5, 5);
  oval(ctx, '#1b2c42', 157, 22, 6, 7);
  rect(ctx, '#8990a0', 96, 22, 1, 1);
  rect(ctx, '#64758a', 113, 12, 1, 1);
  polygon(ctx, '#40546b', [
    [0, 110], [14, 90], [26, 87], [43, 65], [51, 66], [75, 102],
    [85, 94], [104, 112], [122, 92], [147, 70], [154, 72], [167, 92],
    [173, 83], [191, 55], [201, 66], [201, 188], [0, 181],
  ]);
  polygon(ctx, '#34485e', [
    [0, 122], [25, 103], [43, 65], [51, 66], [47, 80], [55, 90], [61, 110],
    [99, 126], [126, 98], [147, 70], [154, 72], [147, 86], [147, 103],
    [166, 125], [177, 101], [191, 55], [201, 66], [201, 190], [0, 188],
  ]);
  polygon(ctx, '#677887', [[32, 80], [43, 65], [51, 66], [57, 75], [49, 74], [42, 79], [38, 76]]);
  polygon(ctx, '#637684', [[131, 86], [147, 70], [154, 72], [161, 83], [155, 82], [149, 79], [142, 85]]);
  polygon(ctx, '#77818a', [[181, 74], [191, 55], [201, 66], [201, 78], [194, 71], [189, 70]]);
  line(ctx, '#53687c', 151, 85, 168, 109);
  line(ctx, '#4c6075', 48, 81, 62, 106);
  for (const [x, y, w] of [[28,109,33],[53,118,46],[88,128,42],[131,108,28],[151,135,41],[64,146,56]]) {
    rect(ctx, '#43586a', x, y, w, 1);
    rect(ctx, '#4c6173', x + 6, y + 1, w - 9, 1);
  }
  const distant = ['#263b4c','#30495a','#385266'];
  for (let i = 0; i < 21; i++) {
    const x = i * 10 + Math.floor(rand() * 8);
    const y = 163 + Math.floor(rand() * 16);
    pine(ctx, x, y, 15 + Math.floor(rand() * 30), distant, 426 + i * 13);
  }
}

const PATH_COLORS = [
  ['#52566b','#3c4054','#222a3c','#616476'],
  ['#59576a','#434052','#2a2a3c','#696476'],
  ['#494f62','#383e51','#242e40','#5a6072'],
  ['#565665','#414050','#282936','#656477'],
  ['#485364','#374354','#293343','#566375'],
  ['#5b574f','#4b473f','#342f2b','#696052'],
];

function stone(ctx, x, y, w, h, colors, rand) {
  const [lit, base, shade, highlight] = colors;
  const notch = rand() > 0.55 ? 2 : 1;
  polygon(ctx, shade, [[x+2,y],[x+w-2,y],[x+w,y+2],[x+w-1,y+h-1],[x+w-4,y+h],[x+1,y+h-1],[x-1,y+notch+1]]);
  polygon(ctx, base, [[x+2,y],[x+w-2,y],[x+w-1,y+2],[x+w-2,y+h-2],[x+3,y+h-1],[x,y+h-3],[x,y+notch]]);
  polygon(ctx, lit, [[x+2,y+1],[x+w-3,y],[x+w-2,y+2],[x+w-5,y+Math.max(2,h-3)],[x+2,y+Math.max(2,h-2)],[x,y+notch]]);
  if (w > 7) rect(ctx, highlight, x + 3, y + 1, w - 6, 1);
  if (w > 9 && h > 4) {
    const hairline = x + 4 + Math.floor(rand() * (w - 8));
    rect(ctx, base, hairline, y + 2, Math.min(5, x + w - hairline - 1), 1);
    rect(ctx, highlight, x + w - 5, y + h - 3, 2, 1);
  }
  if (w > 14 && h > 6) {
    rect(ctx, shade, x + 3, y + h - 2, 3 + Math.floor(rand() * 3), 1);
    rect(ctx, base, x + w - 8, y + 3, 3, 2);
  }
}

function grass(ctx, x, y, color, high, height) {
  line(ctx, color, x, y, x - 4, y - height + 2);
  line(ctx, high, x + 1, y, x + 2, y - height);
  line(ctx, color, x + 3, y, x + 6, y - height + 2);
  rect(ctx, color, x - 2, y, 8, 1);
}

function path(ctx) {
  const rand = random(16637);
  polygon(ctx, '#25363e', [[0,183],[32,171],[79,156],[133,158],[166,167],[201,178],[201,437],[0,437]]);
  polygon(ctx, '#252f3a', [[0,221],[30,185],[76,166],[120,165],[163,176],[184,195],[201,228],[201,437],[0,437]]);
  oval(ctx, '#37414c', 103, 212, 93, 45);
  let y = 171;
  let row = 0;
  while (y < HEIGHT) {
    const spread = y - 171;
    const h = 4 + Math.floor(spread / 37);
    const minWidth = 6 + Math.floor(spread / 28);
    const maxWidth = 13 + Math.floor(spread / 12);
    const left = Math.max(-17, 47 - Math.floor(spread / 1.9));
    const right = Math.min(217, 152 + Math.floor(spread / 1.8));
    let x = left - (row % 2 === 0 ? 3 : 6);
    while (x < right) {
      const width = minWidth + Math.floor(rand() * (maxWidth - minWidth));
      const vertical = Math.floor(rand() * (h > 7 ? 3 : 2));
      const warm = x > 143 && y < 224 && rand() < 0.42;
      const colors = PATH_COLORS[warm ? 5 : Math.floor(rand() * 5)];
      stone(ctx, x, y + vertical, width, h - vertical + 1, colors, rand);
      if (rand() < 0.30 && h > 4) {
        rect(ctx, '#4d5749', x + width - 3, y + h - 1, 4, 1);
        if (rand() < 0.35) rect(ctx, '#6a654e', x + width - 2, y + h - 2, 2, 1);
      }
      x += width + Math.floor(rand() * 3);
    }
    row++;
    y += h + 1;
  }
  for (let i = 0; i < 112; i++) {
    const ys = 179 + Math.floor(rand() * 252);
    const side = rand() < 0.49;
    const xs = (side ? -2 : 178) + Math.floor(rand() * (side ? 25 : 24));
    const hs = 3 + Math.floor(rand() * 8);
    if (i % 3 === 0) {
      stone(ctx, xs - 4, ys - 1, 7 + Math.floor(rand() * 13), hs, PATH_COLORS[4], rand);
    } else {
      grass(ctx, xs, ys, '#384836', i % 2 ? '#626348' : '#465d47', hs);
    }
    if (i % 8 === 0) {
      rect(ctx, '#744f47', xs + 2, ys - hs + 2, 2, 2);
      rect(ctx, '#8e654c', xs + 5, ys - hs + 2, 1, 1);
    }
  }
  // A dark, distant foreground keeps the action log and cards readable over the path.
  for (const [top, shade] of [[251, '#141c2925'], [284, '#13192639'], [330, '#11182438'], [413, '#0e172442']]) {
    rect(ctx, shade, 0, top, WIDTH, HEIGHT - top);
  }
}

function shack(ctx) {
  polygon(ctx, '#1f2939', [[0,79],[12,63],[35,62],[53,78],[54,109],[0,112]]);
  rect(ctx, '#393744', 5, 77, 39, 30);
  rect(ctx, '#4c3c39', 8, 80, 31, 25);
  for (let x = 11; x < 42; x += 6) {
    rect(ctx, '#62463a', x, 80, 3, 23);
    rect(ctx, '#352e34', x + 3, 80, 1, 25);
  }
  polygon(ctx, '#252c3d', [[0,75],[14,58],[31,55],[37,57],[51,75],[50,78],[0,79]]);
  polygon(ctx, '#3a4661', [[0,73],[14,58],[30,56],[35,58],[47,72],[35,75],[0,77]]);
  line(ctx, '#596074', 0, 73, 25, 68);
  line(ctx, '#526078', 7, 67, 28, 63);
  line(ctx, '#303b50', 33, 60, 44, 72);
  rect(ctx, '#6e6154', 5, 77, 43, 2);
  rect(ctx, '#1c2732', 9, 98, 34, 3);
  rect(ctx, '#231f27', 29, 86, 9, 20);
  rect(ctx, '#725141', 30, 88, 5, 17);
  rect(ctx, '#93805d', 33, 97, 1, 1);
  rect(ctx, '#814e35', 12, 84, 11, 10);
  rect(ctx, '#e4a856', 13, 85, 8, 7);
  rect(ctx, '#fff0aa', 14, 86, 6, 5);
  rect(ctx, '#704b3c', 17, 85, 1, 7);
  rect(ctx, '#704b3c', 13, 88, 8, 1);
  rect(ctx, '#6f624e', 10, 94, 14, 2);
}

function fence(ctx) {
  const posts = [
    { x: 3, y: 188, h: 25 }, { x: 26, y: 180, h: 22 },
    { x: 51, y: 175, h: 17 }, { x: 72, y: 173, h: 15 },
    { x: 123, y: 172, h: 17 }, { x: 144, y: 175, h: 18 },
    { x: 166, y: 180, h: 22 }, { x: 187, y: 189, h: 24 },
    { x: 201, y: 198, h: 29 },
  ];
  for (let i = 1; i < posts.length; i++) {
    if (i === 4) continue;
    const left = posts[i-1];
    const right = posts[i];
    for (const lift of [0.31, 0.70]) {
      const ay = left.y-Math.round(left.h*lift);
      const by = right.y-Math.round(right.h*lift);
      const thickness = i > 5 ? 4 : 3;
      const timber = i > 6 ? '#76523d' : '#57423a';
      line(ctx, '#29282f', left.x+2, ay+2, right.x+1, by+2, thickness);
      polygon(ctx, timber, [[left.x+1,ay],[right.x+2,by],[right.x+2,by+thickness],[left.x+1,ay+thickness]]);
      line(ctx, i > 6 ? '#a27551' : '#846851', left.x+2, ay, right.x, by);
      line(ctx, '#453733', left.x+5, ay+2, right.x-3, by+2);
    }
  }
  posts.forEach(({ x, y, h }, i) => {
    const w = i > 5 ? 5 : 4;
    oval(ctx, '#27242d', x+1, y+1, w+2, 2);
    rect(ctx, '#292832', x-1, y-h+1, w+2, h+1);
    rect(ctx, i > 6 ? '#936746' : '#725742', x, y-h, w, h);
    rect(ctx, '#b0885d', x+1, y-h+2, 1, h-3);
    rect(ctx, '#544034', x+w-1, y-h+1, 1, h-1);
    rect(ctx, '#b28a62', x+1, y-h-1, w-2, 1);
    for (const lift of [0.31, 0.70]) {
      rect(ctx, '#3b3537', x+w-2, y-Math.round(h*lift)+1, 1, 1);
    }
  });
}

function lantern(ctx, phase) {
  const bright = phase % 7 < 4;
  rect(ctx, '#28303b', 191, 132, 6, 57);
  rect(ctx, '#67473b', 191, 131, 4, 56);
  rect(ctx, '#a1734f', 192, 132, 1, 51);
  rect(ctx, '#322932', 176, 132, 23, 4);
  rect(ctx, '#80583d', 177, 130, 21, 3);
  rect(ctx, '#b28456', 179, 130, 18, 1);
  rect(ctx, '#463434', 181, 135, 1, 6);
  polygon(ctx, '#634338', [[176,143],[179,139],[185,139],[188,143],[186,145],[178,145]]);
  rect(ctx, '#3b2b2d', 177, 143, 11, 13);
  rect(ctx, '#a96944', 178, 144, 9, 10);
  rect(ctx, '#e4a25d', 179, 144, 7, 9);
  rect(ctx, bright ? '#fff0b3' : '#efc67d', 180, 145, 5, 7);
  rect(ctx, '#ffedab', 180, 146, 2, 5);
  rect(ctx, '#98613c', 182, 144, 1, 9);
  rect(ctx, '#72483a', 178, 154, 9, 1);
  rect(ctx, '#b2754b', 179, 155, 7, 1);
  if (bright) {
    rect(ctx, '#a8724c', 175, 147, 1, 1);
    rect(ctx, '#c08a56', 187, 159, 1, 1);
    rect(ctx, '#b47a4c', 179, 160, 1, 1);
  }
}

function makeScene() {
  const scene = document.createElement('canvas');
  scene.width = WIDTH;
  scene.height = HEIGHT;
  const ctx = scene.getContext('2d');
  mountains(ctx);
  path(ctx);
  ctx.save();
  ctx.translate(6, 56);
  shack(ctx);
  ctx.restore();
  const night = ['#192a32','#344443','#41544e'];
  const deep = ['#11212a','#243439','#354749'];
  pine(ctx, 2, 180, 152, deep, 21);
  pine(ctx, 43, 171, 102, night, 716);
  pine(ctx, 64, 172, 75, deep, 322);
  pine(ctx, 136, 171, 61, night, 56);
  pine(ctx, 162, 180, 99, night, 514);
  pine(ctx, 199, 187, 132, deep, 270);
  fence(ctx);
  const rand = random(333);
  for (let i = 0; i < 23; i++) {
    const x = 175 + Math.floor(rand() * 29);
    const y = 184 + Math.floor(rand() * 19);
    rect(ctx, rand() < 0.5 ? '#77644d' : '#956d4a', x, y, 1 + Math.floor(rand() * 2), 1);
  }
  return scene;
}

function dungeonScene(skin) {
  const scene=document.createElement("canvas");
  scene.width=WIDTH;scene.height=HEIGHT;
  const ctx=scene.getContext("2d");
  if (["gold","grass","sails","canopy"].includes(skin)) {
    const high=skin==="sails", leaves=skin==="canopy", rand=random(high?14920:leaves?67703:82031);
    rect(ctx,leaves?"#293e4b":"#334453",0,0,WIDTH,HEIGHT);
    for(let y=25;y<161;y+=7) {
      const color=leaves?["#3b4d53","#455659","#525e5c"]:["#52626b","#627075","#7f786c"];
      rect(ctx,color[Math.min(Math.floor(y/60),2)],0,y,WIDTH,7);
    }
    if(high||!leaves) oval(ctx,high?"#eed5a0":"#c7a47b",156,74,17,17);
    for(let i=0;i<13;i++){
      const x=i*19-20, y=145-Math.floor(rand()*40), w=36+Math.floor(rand()*40);
      polygon(ctx,leaves?"#2b4447":"#464955",[[x,163],[x+12,y],[x+22,y-6],[x+w,160],[x+w,185],[x,185]]);
    }
    const ground=high?"#50404a":leaves?"#455345":"#655542";
    polygon(ctx,ground,[[0,162],[49,154],[150,157],[201,171],[201,437],[0,437]]);
    if(leaves) {
      for(const [x,flip] of [[-8,1],[166,-1]]) {
        polygon(ctx,"#36453b",[[x,0],[x+40,0],[x+39,56],[x+22,106],[x+43,160],[x+59,194],[x,175]]);
        for(let n=0;n<9;n++){let y=25+17*n;line(ctx,"#617052",x+8+(n%3)*6,y,x+22+(n%4)*3,y+13,2);}
        for(let n=0;n<20;n++)oval(ctx,n%3?"#3d6257":"#527464",x+36+Math.floor(rand()*43)*flip,16+Math.floor(rand()*67),14,5);
      }
    } else if(high) {
      for (const [x,dir,t] of [[23,1,"#ad714d"],[180,-1,"#62888e"]]) {
        line(ctx,"#43333c",x,38,x,175,4);
        line(ctx,"#c79b6b",x-2,38,x-2,170);
        polygon(ctx,t,[[x,44],[x+dir*43,59],[x+dir*36,106],[x,116]]);
        line(ctx,"#ead18d",x,55,x+dir*34,67,3);
        line(ctx,"#9f8364",x+dir*34,104,x+dir*49,170);
      }
    } else {
      for(let n=0;n<95;n++){
        const x=Math.floor(rand()*201),y=137+Math.floor(rand()*195);
        grass(ctx,x,y,n%4===1?"#bc9762":"#85704f",n%4===1?"#e1b479":"#a48857",3+Math.floor(rand()*9));
      }
      if(skin==="gold")for(const [x,slant] of [[11,1],[186,-1]]){
        polygon(ctx,"#3d3038",[[x-19,161],[x-10,89],[x+slant*9,72],[x+slant*26,82],[x+17,172]]);
        line(ctx,"#a78163",x-7,100,x-12,158,2);
        for(let i=0;i<5;i++)rect(ctx,"#d48a5b",x-10+i*4,131+i%3,2,2);
      }
    }
    for(let n=0;n<281;n++){
      const x=Math.floor(rand()*201),y=170+Math.floor(rand()*240);
      rect(ctx,high?"#87655570":leaves?"#82a06b81":"#c4a36b79",x,y,n%8+1,1);
    }
    for(let k=0;k<26;k++){
      const y=184+k*7;
      if(high)line(ctx,"#312b3b",0,y,201,y,1);
      if(leaves)line(ctx,"#314037",Math.floor(rand()*90),y,90+Math.floor(rand()*94),y,1);
    }
    rect(ctx,"#100f2254",0,253,WIDTH,HEIGHT-253);
    return scene;
  }
  const bone=skin==="bone";
  rect(ctx,bone?"#222a3a":"#201f2d",0,0,WIDTH,HEIGHT);
  const rand=random(bone?55271:874);
  for(let row=0;row<23;row++){
    for(let col=-1;col<10;col++){
      const x=col*24+(row%2)*12,y=row*9;
      rect(ctx,bone?"#39363f":"#303043",x+1,y+1,23,8);
      rect(ctx,bone?"#484550":"#484255",x+2,y+1,21,1);
      if(rand()<.37) rect(ctx,bone?"#5b5051":"#3b3345",x+5,y+4,5,2);
    }
  }
  for(const x of [13,51,151,189]) {
    const h=x<20||x>180?178:132;
    rect(ctx,"#282735",x-9,0,19,h);
    rect(ctx,bone?"#756864":"#504858",x-6,0,11,h);
    rect(ctx,bone?"#a19079":"#6e6271",x-6,0,2,h);
    rect(ctx,"#292631",x+6,0,5,h+7);
    rect(ctx,"#8e6855",x-9,h-22,19,3);
    rect(ctx,"#d09558",x-2,h-26,5,10);
    oval(ctx,"#e4a25116",x,h-21,20,13);
  }
  polygon(ctx,bone?"#41414b":"#292734",[[0,173],[37,156],[162,157],[201,172],[201,437],[0,437]]);
  for(let y=162;y<HEIGHT;y+=5+Math.floor((y-156)/41)){
    const h=4+Math.floor((y-156)/42);
    for(let x=-6;x<201;){
      const width=7+Math.floor(rand()*12)+Math.floor((y-160)/29);
      const set=PATH_COLORS[bone?(rand()<.6?2:5):Math.floor(rand()*4)];
      stone(ctx,x,y,width,h,set,rand);x+=width+2;
    }
  }
  rect(ctx,"#100f2764",0,258,WIDTH,HEIGHT-258);
  if (bone) for(const x of [3,68,139,193]) {
    polygon(ctx,"#a48f78",[[x-5,167],[x-9,148],[x-5,112],[x+5,94],[x+12,107],[x+2,130],[x+1,167]]);
    line(ctx,"#e0b395",x-3,156,x-5,142);
  }
  return scene;
}

function plaque(ctx, x, y, w, h, active = false) {
  polygon(ctx, '#121722', [[x+4,y],[x+w-4,y],[x+w,y+4],[x+w,y+h-4],[x+w-4,y+h],[x+4,y+h],[x,y+h-4],[x,y+4]]);
  polygon(ctx, active ? '#e6ae67' : '#9f744e', [[x+5,y+1],[x+w-5,y+1],[x+w-1,y+5],[x+w-1,y+h-5],[x+w-5,y+h-1],[x+5,y+h-1],[x+1,y+h-5],[x+1,y+5]]);
  polygon(ctx, '#382b2d', [[x+6,y+2],[x+w-6,y+2],[x+w-2,y+6],[x+w-2,y+h-6],[x+w-6,y+h-2],[x+6,y+h-2],[x+2,y+h-6],[x+2,y+6]]);
  polygon(ctx, '#202634', [[x+7,y+3],[x+w-7,y+3],[x+w-3,y+7],[x+w-3,y+h-7],[x+w-7,y+h-3],[x+7,y+h-3],[x+3,y+h-7],[x+3,y+7]]);
  rect(ctx, '#cd9e67', x+7, y+1, w-14, 1);
  rect(ctx, '#654b3b', x+7, y+h-2, w-14, 1);
  for (const dx of [x + 3, x + w - 4]) {
    rect(ctx, '#e0ac70', dx, y+4, 1, 2);
    rect(ctx, '#b78d62', dx, y+h-6, 1, 2);
  }
}

function frontPortrait(ctx, sheet, x, y, w, h, headOffset) {
  if (!sheet) return;
  const sx = 48 + Math.floor((48 - w) / 2);
  ctx.drawImage(sheet, sx, headOffset, w, h, x, y, w, h);
}

function bar(ctx, x, y, w, value, colors) {
  rect(ctx, '#101722', x, y, w, 5);
  rect(ctx, colors[0], x + 1, y + 1, w - 2, 3);
  const filled = Math.round((w - 2) * Math.min(1, Math.max(0, value)));
  if (filled > 0) {
    rect(ctx, colors[1], x + 1, y + 1, filled, 3);
    rect(ctx, colors[2], x + 1, y + 1, filled, 1);
  }
}

const LIFE = ['#3a2531','#b95845','#f9815e'];
const PARTY_LIFE = ['#24382f','#6ab261','#b1de83'];
const GAUGE = ['#202e42','#4f91c2','#8dd5e9'];
const FULL = ['#453634','#d69b52','#ffdfa0'];

function swordBadge(ctx, x, y) {
  line(ctx, '#101722', x+2, y+9, x+10, y+1, 2);
  line(ctx, '#fff3bf', x+4, y+8, x+10, y+2);
  line(ctx, '#a6bfd3', x+6, y+7, x+10, y+3);
  line(ctx, '#d99550', x+3, y+6, x+6, y+9);
  line(ctx, '#96704e', x+3, y+10, x+4, y+9);
  rect(ctx, '#e4a462', x+2, y+11, 2, 1);
}

function crossedLight(ctx, x, y, color) {
  rect(ctx, color, x - 2, y, 5, 1);
  rect(ctx, color, x, y - 2, 1, 5);
  rect(ctx, '#fff3c7', x, y, 1, 1);
}

function slash(ctx, x, y, skill) {
  const scale = skill ? 1 : 0.6;
  const s = (a, b) => [x + Math.round(a * scale), y + Math.round(b * scale)];
  polygon(ctx, '#8d5b52', [
    s(-31,28), s(-30,15), s(-25,4), s(-16,-7), s(-6,-15), s(7,-20), s(22,-21),
    s(13,-15), s(4,-9), s(-7,0), s(-17,10), s(-23,21), s(-28,30),
  ]);
  polygon(ctx, '#cb8f56', [
    s(-30,27), s(-28,14), s(-23,4), s(-15,-6), s(-5,-14), s(8,-19), s(21,-20),
    s(12,-15), s(3,-9), s(-8,0), s(-18,11), s(-24,23), s(-28,28),
  ]);
  polygon(ctx, '#ffd182', [
    s(-29,27), s(-27,14), s(-22,4), s(-14,-6), s(-4,-14), s(9,-19), s(21,-20),
    s(11,-15), s(1,-9), s(-9,0), s(-19,12), s(-25,23),
  ]);
  polygon(ctx, '#fff0bf', [
    s(-28,24), s(-25,13), s(-20,4), s(-12,-6), s(-2,-13), s(10,-18), s(18,-19),
    s(9,-15), s(-1,-9), s(-11,0), s(-21,11),
  ]);
  crossedLight(ctx, x+15, y-15, '#f8b870');
  rect(ctx, '#e5a966', x-21, y+3, 2, 1);
  rect(ctx, '#fbc786', x+9, y-19, 2, 1);
  rect(ctx, '#f4ad65', x-28, y+9, 2, 1);
  rect(ctx, '#f7cc93', x-8, y-6, 2, 1);
  if (skill) {
    crossedLight(ctx, x-16, y-4, '#ecaa62');
    rect(ctx, '#c8814d', x-33, y+14, 2, 1);
    rect(ctx, '#d08e62', x-13, y+20, 2, 1);
    rect(ctx, '#f9ca82', x+7, y+2, 2, 1);
    rect(ctx, '#fbc786', x+16, y-6, 1, 1);
  }
}

const darkenedFrames = new WeakMap();

function drawActorFrame(ctx, sheet, sx, sy, x, y, knockedOut) {
  if (!sheet) return;
  if (!knockedOut) {
    ctx.drawImage(sheet, sx, sy, 48, 60, x, y, 48, 60);
    return;
  }

  let sheetFrames = darkenedFrames.get(sheet);
  if (!sheetFrames) {
    sheetFrames = new Map();
    darkenedFrames.set(sheet, sheetFrames);
  }
  const key = sy * 144 + sx;
  let frame = sheetFrames.get(key);
  if (!frame) {
    frame = document.createElement('canvas');
    frame.width = 48;
    frame.height = 60;
    const pixels = frame.getContext('2d');
    pixels.imageSmoothingEnabled = false;
    pixels.drawImage(sheet, sx, sy, 48, 60, 0, 0, 48, 60);
    pixels.globalCompositeOperation = 'source-atop';
    rect(pixels, '#090c18ab', 0, 0, 48, 60);
    sheetFrames.set(key, frame);
  }
  ctx.drawImage(frame, x, y);
}

const NOTICE_STYLE = {
  damage: { color: '#fff4df', size: 21 },
  critical: { color: '#ffd785', size: 25 },
  criticalState: { color: '#ffdc8e', size: 13 },
  hurt: { color: '#ffb2a3', size: 20 },
  hurtState: { color: '#ffc4b0', size: 13 },
  heal: { color: '#9ae3a2', size: 20 },
  state: { color: '#ffe4a5', size: 14 },
  protect: { color: '#a9e3f5', size: 14 },
  revive: { color: '#d9b9fd', size: 14 },
};

class Battle {
  constructor(bank, simulation, skin="road", speed=1) {
    this.bank = bank;
    this.skin = skin;
    this.scene = skin==="road" || skin==="town" ? makeScene() : dungeonScene(skin);
    this.speed = Math.max(0,SPEEDS.indexOf(speed));
    this.demo = simulation;
    this.enemyPlacement = layoutEnemies(bank.enemies);
    this.end = simulation.end;
    this.finishAt = this.end-310;
    this.reset();
  }

  reset() {
    this.clock = 0;
    this.previousTime = null;
    this.labels = [];
  }

  tap(x, y) {
    const { x: left, y: top, width, height } = COMMAND;
    if (x < left || x >= left + width || y < top || y >= top + height) return false;
    if (this.clock >= this.end) return 'result';
    this.speed = (this.speed + 1) % SPEEDS.length;
    return 'speed';
  }

  label(text, x, y, size, color = '#ffebbd', align = 'center', style = {}) {
    this.labels.push({ text, x, y, size, color, align, ...style });
  }

  draw(stage, hud, time = 0) {
    if (this.previousTime === null || time < this.previousTime) this.clock = Math.min(this.end, time);
    else this.clock = Math.min(this.end, this.clock + (time - this.previousTime) * SPEEDS[this.speed]);
    this.previousTime = time;
    const phase = this.clock;
    const frame = this.demo.frames.findLast(item => item.at <= phase);
    const event = this.demo.events.find(action => phase >= action.at && phase < action.until);
    const progress = event ? (phase - event.at) / (event.until - event.at) : 0;
    const impact = event && phase - event.impact;
    const showingSkill = event?.active && progress >= 0.24 && progress < 0.83;
    this.labels = [];

    stage.imageSmoothingEnabled = false;
    stage.drawImage(this.scene, 0, 0);
    if (this.skin==="road" || this.skin==="town") lantern(stage, Math.floor(phase / 135));
    this.drawFoes(stage, frame.foes, phase, event, progress);
    if (event && impact >= -65 && impact <= 285) this.drawEffect(stage, event, impact);

    hud.clearRect(0, 0, hud.canvas.width, hud.canvas.height);
    hud.imageSmoothingEnabled = false;
    this.drawOrder(hud, event, phase);
    frame.foes.forEach((foe, index) => {
      if (foe.hp > 0 || phase - foe.defeatedAt < 180) {
        const x = toHud(this.enemyPlacement[index].x);
        bar(hud, Math.max(4, Math.min(HUD_WIDTH - 43, x - 19)), toHud(FOE_FEET + 10), 39, foe.hp / foe.maxHp, LIFE);
      }
    });
    this.drawLog(hud, phase);
    this.drawHud(hud, frame.party, phase, event, showingSkill);
    this.drawNotice(phase);
  }

  drawOrder(ctx, event, phase) {
    const events = this.demo.events;
    const current = event ? events.indexOf(event) : events.findIndex(action => action.at > phase);
    if (current < 0 || phase >= this.finishAt) return;
    const upcoming = events.slice(current, current + 4);
    const width = 34 + 30 * upcoming.length;
    const left = Math.floor((HUD_WIDTH - width) / 2);
    plaque(ctx, left, 56, width, 30);
    line(ctx, '#c19866', left+10, 64, left+19, 64);
    line(ctx, '#c19866', left+11, 76, left+18, 76);
    line(ctx, '#d6a76c', left+10, 65, left+18, 75);
    line(ctx, '#a47e61', left+18, 65, left+11, 75);
    rect(ctx, '#e3b881', left+13, 69, 3, 3);
    upcoming.forEach((action, position) => {
      const x = left+26+position*30;
      const enemy = action.side === 'foes';
      rect(ctx, position === 0 ? '#c59158' : '#594636', x, 59, 26, 24);
      rect(ctx, enemy ? '#4b3343' : '#283649', x+1, 60, 24, 22);
      if (enemy) {
        const foe = this.bank.enemies[action.actor];
        const sx = foe ? Math.floor((foe.naturalWidth-24)/2) : 0;
        const sy = foe && foe.naturalHeight>70 ? 12 : 3;
        if (foe) ctx.drawImage(foe, sx, sy, 24, 22, x+1, 60, 24, 22);
      } else {
        frontPortrait(ctx, this.bank.people[action.actor], x+1, 60, 24, 22, 8);
      }
      if (position === 0) rect(ctx, '#f6d28c', x+3, 80, 20, 1);
    });
  }

  drawFoes(ctx, foes, phase, event, progress) {
    foes.forEach((foe, index) => {
      const sprite = this.bank.enemies[index];
      const place = this.enemyPlacement[index];
      const fade = foe.defeatedAt === null ? 1 : Math.max(0, 1 - (phase-foe.defeatedAt)/360);
      if (!sprite || fade <= 0) return;
      const hovering = index === 0 ? -4 + (Math.floor(phase / 155) % 4) : 0;
      const lunging = event?.kind === 'enemy' && event.actor === index;
      const lunge = lunging ? Math.max(0, 6 - Math.round(Math.abs(progress-0.47) * 17)) : 0;
      const struck = event && (event.kind === 'skill' || event.kind === 'cut') &&
        event.target === index && phase >= event.impact && phase < event.impact+135;
      const recoil = struck ? 2 : 0;
      const y = FOE_FEET + hovering + lunge - recoil;
      const shadowRadius = Math.round(sprite.width * 0.34);
      ctx.save();
      ctx.globalAlpha = fade;
      if (foe.charge) {
        oval(ctx, '#6d463a', place.x, FOE_FEET + 1, 24, 5);
        line(ctx, '#e29b56',place.x-24,FOE_FEET+6,place.x+24,FOE_FEET+6,2);
      }
      oval(ctx, '#202630', place.x, FOE_FEET + 1, shadowRadius, 4);
      oval(ctx, '#2d303c', place.x, FOE_FEET + 1, Math.max(1, shadowRadius - 4), 2);
      ctx.globalAlpha = fade * (struck ? 0.72 : 1);
      ctx.drawImage(sprite, place.left + recoil, y - sprite.height);
      ctx.restore();
    });
  }

  drawEffect(ctx, event, impact) {
    const target = this.enemyPlacement[event.target];
    if (event.kind === 'skill' || event.kind === 'cut') {
      slash(ctx, target.x + 4 + Math.round(impact / 100), FOE_FEET - Math.floor(target.height / 2), event.kind === 'skill');
    }
    if (event.kind === 'fire') this.enemyPlacement.forEach(({ x, height },i) => {
      if (event.targets && !event.targets.includes(i)) return;
      const y = FOE_FEET - Math.floor(height / 2) - Math.round(impact / 28);
      polygon(ctx, '#984a42', [[x-17,y+12],[x-22,y+3],[x-18,y-8],[x-13,y-3],[x-11,y-14],
        [x-4,y-7],[x+6,y-17],[x+5,y-5],[x+17,y-11],[x+19,y+3],[x+17,y+10],[x+6,y+15],[x-8,y+15]]);
      polygon(ctx, '#f4a45a', [[x-16,y+11],[x-17,y+2],[x-12,y-4],[x-7,y+2],[x-2,y-9],[x+2,y-4],
        [x+9,y-5],[x+14,y+3],[x+13,y+9],[x+7,y+12],[x-8,y+13]]);
      crossedLight(ctx, x + 3, y + 5, '#ffce7c');
      crossedLight(ctx, x - 12, y - 11, '#f38b50');
      rect(ctx, '#ffcf83', x + 13, y - 15, 2, 1);
    });
  }

  drawNotice(phase) {
    const duration = 960;
    const recent = this.demo.notices.filter(item => item.at <= phase && phase < item.at + duration);
    const latestForTarget = new Map();
    for (const item of recent) latestForTarget.set(item.side + item.index, item.at);

    for (const item of recent) {
      if (latestForTarget.get(item.side + item.index) !== item.at) continue;
      const progress = (phase - item.at) / duration;
      const rise = Math.round(14 * (1 - (1 - progress)**3) + 16 * progress);
      const alpha = progress < 0.64 ? 1 : (1-progress)/0.36;
      const { size, color } = NOTICE_STYLE[item.kind];
      const onCard = item.side === 'party';
      const target = this.enemyPlacement[item.index];
      const x = onCard ? CARD_LEFT[item.index] + CARD_WIDTH/2 : Math.min(HUD_WIDTH - 29, Math.max(29, toHud(target.x)));
      const base = onCard ? 468 : Math.max(146, toHud(FOE_FEET - target.height - 7));
      this.label(item.text, x, base-rise-item.lift, size, color, 'center',
        { alpha, outline: 2.2, outlineColor: '#151522', weight: 900, sans: true });
    }
  }

  drawLog(ctx, phase) {
    const action = this.demo.events.findLast(event => event.at <= phase);
    const finished = phase >= this.finishAt;
    const effect = action && phase >= action.impact && action.result;
    plaque(ctx, 16, 370, 270, 41, finished);
    if (finished) {
      this.label(this.demo.victorious ? '勝利' : this.demo.stalemate ? '引き上げる' : '敗北', 151, 390, 16);
      return;
    }
    if (effect) {
      this.label(action.headline, 151, 382, 13, '#ffedc5');
      this.label(effect, 151, 400, 12, '#d4d5ce');
      return;
    }
    this.label(action ? action.headline : '魔物が現れた！', 151, 390, 14);
  }

  drawHud(ctx, party, phase, event, showingSkill) {
    [['前列', 16, '#d6ad75'], ['後列', 157, '#a9bed2']].forEach(([label, left, color]) => {
      rect(ctx, '#242633', left, 482, 129, 15);
      rect(ctx, '#564a42', left, 482, 129, 1);
      rect(ctx, '#4a484a', left + 8, 489, 30, 1);
      rect(ctx, '#4a484a', left + 91, 489, 30, 1);
      this.label(label, left + 64, 489, 10, color);
    });
    const warning=this.demo.frames.findLast(f=>f.at<=phase)?.foes.find(f=>f.charge)?.nextLane;
    party.forEach((member, slot) => {
      const actor=slot;
      if (!member) {
        plaque(ctx,CARD_LEFT[slot],CARD_TOP,CARD_WIDTH,75);
        rect(ctx,"#1b2330",CARD_LEFT[slot]+8,CARD_TOP+12,46,50);
        return;
      }
      const acting = event?.actor === actor && event.side === 'party';
      const usingSkill = acting && showingSkill;
      const knockedOut = member.hp === 0;
      const targeting = event?.target === actor || event?.affected?.includes(actor);
      const elapsed = targeting ? phase - event.impact : -1;
      const takingHit = event?.kind === 'enemy' && elapsed >= 0 && elapsed < 180;
      const shift = takingHit ? [3, -3, 2, -2, 1, -1][Math.floor(elapsed / 30)] : 0;
      const x = CARD_LEFT[slot] + shift;
      const recovering = (event?.kind === 'heal' || event?.kind === 'revive') && elapsed >= 0 && elapsed < 210;
      const warned=warning===(slot<2?"front":"rear");
      plaque(ctx, x, CARD_TOP, CARD_WIDTH, 75, usingSkill||warned);
      if(warned)line(ctx,'#fa9f68',x+4,CARD_TOP-2,x+CARD_WIDTH-4,CARD_TOP-2,1);
      const inside = knockedOut ? '#161d29' : recovering ? '#2a433e' : takingHit ? '#3c2a35' : '#21313d';
      rect(ctx, inside, x+4, CARD_TOP + 3, 54, 60);
      drawActorFrame(ctx, this.bank.people[actor], usingSkill ? 0 : 48, usingSkill ? 240 : 0,
        x+7, CARD_TOP + 3, knockedOut);
      bar(ctx, x+5, CARD_TOP + 63, 52, member.hp/member.maxHp, PARTY_LIFE);
      bar(ctx, x+5, CARD_TOP + 68, 52, member.gauge/100, member.gauge >= 100 ? FULL : GAUGE);
    });
    rect(ctx, '#101821', 0, 574, HUD_WIDTH, 42);
    rect(ctx, '#594735', 0, 574, HUD_WIDTH, 1);
    rect(ctx, '#312e33', 0, 614, HUD_WIDTH, 1);
    rect(ctx, '#242933', 0, 575, HUD_WIDTH, 1);
    const { x, y, width, height } = COMMAND;
    const finished = phase >= this.end;
    plaque(ctx, x, y, width, height, finished);
    if (finished) {
      line(ctx, '#efc384', 104, 594, 119, 594, 2);
      line(ctx, '#efc384', 104, 594, 111, 588);
      line(ctx, '#efc384', 104, 595, 111, 601);
      this.label('戦果', 159, 595, 15);
    } else {
      this.label('速度', 127, 595, 15);
      this.label(`${SPEEDS[this.speed]}×`, 182, 595, 15);
    }
  }
}

window.Battle=Battle;
})();
