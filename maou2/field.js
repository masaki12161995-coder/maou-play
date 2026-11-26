(() => {
"use strict";
const WIDTH = 603;
const HEIGHT = 1311;
const SIZE = 48;
const LEFT = 13;
const TOP = 7;
const COLS = 12;
const ROWS = 27;
const FIRST_PLAYABLE_ROW = 4;
const LAST_PLAYABLE_ROW = 24;
const STEP_MS = 150;
const STAND = 1;

const ROAD_NPCS = [
  { col: 7, row: 13, sheet: 2, facing: 0, label: "旅人", pages: ["橋の欄干、右の板だけ色が新しいだろう？", "昨夜、見回りの人と二人で張り替えたんだ。"], activity: "map" },
  { col: 6, row: 11, sheet: 3, facing: 2, label: "見回り", pages: ["明るく擦れた石が足場だよ。段の端には、松の根が出てる。"], activity: "sweep" },
  { col: 10, row: 13, sheet: 6, facing: 0, label: "番小屋の人", pages: ["荷をしまったら、窓の灯を落とすよ。橋を渡るなら今のうちに。"], activity: "crate" },
];
const TOWN_NPCS = [
  { col: 3, row: 8, sheet: 1, facing: 0, label: "宿の人", pages: ["風が冷たいね。戸口の灯りの近くで休んでいきな。"], activity: "broom" },
  { col: 10, row: 9, sheet: 3, facing: 1, label: "荷運び", pages: ["この木箱は夕方の便。あと一つでおしまいだ。"], activity: "crate" },
  { col: 3, row: 11, sheet: 5, facing: 2, label: "露店の人", pages: ["赤いのが干しりんご。籠に入れたばかりだよ。"], activity: "sort" },
  { col: 7, row: 12, sheet: 4, facing: 0, label: "使いの子", pages: ["ねえ、待って。道の石段、もう上ってきた？", "宿の人から預かった灯りがあるんだ。町のこと、少し聞いていく？"], choices: [{label:"町のことを聞く", response:"上の広場には宿と露店、下には鍛冶場があるよ。"}, {label:"先を急ぐ", response:"そっか。道の端は暗いから、灯りのそばを通ってね。"}], activity: "lantern", approach: true },
  { col: 3, row: 21, sheet: 0, facing: 1, label: "鍛冶屋", pages: ["赤いうちにもう一度だけ打つよ。見ていくかい？", "刃の色が黒くなるまで、そこから見ていておくれ。"], activity: "smith" },
  { col: 9, row: 21, sheet: 7, facing: 1, label: "店じまいの人", pages: ["包みは椅子の下に置いたよ。あとで渡しに行こう。"], activity: "bundle" },
];

const ROAD_OBJECTS = [
  { col: 4, row: 14, label: "案内板", pages: ["石段を上れば町。東の橋は見回り小屋へ。"], icon: "map", bounds: [-15,-30,17,4] },
];
const TOWN_OBJECTS = [
  { col: 8, row: 10, label: "井戸", pages: ["冷たい水が、桶の底で揺れている。"], icon: "bottle", bounds: [-26,-54,27,13] },
  { col: 2, row: 21, label: "鍛冶台", pages: ["金床の上に、打ちかけの刃が置いてある。"], icon: "stone", bounds: [-18,-24,18,8] },
];
const ROAD_GRID = Object.freeze([
  "fffffffpppww",
  "fffffffpppww",
  "fffffffpppww",
  "fffffffmpmww",
  "fffffffSSSww",
  "fffffffSSSww",
  "fffffppppwwf",
  "tttfpppppwwf",
  "kkkfpppffwwf",
  "tttfSSSffwwf",
  "kkkfSSSpfwwf",
  "fffpppppwwff",
  "ffgpppppwwHH",
  "frppppppwwHH",
  "ffpppppp==pp",
  "ffpppppp==pp",
  "ffgrppppwwgg",
  "ttggppppwwgg",
  "kkkfppppwwff",
  "ffffppppwwff",
  "tttrppppwwff",
  "kkkfpppwwfff",
  "fffgpppwwfff",
  "tttgpppwwwwf",
  "kkkrpppffwwf",
  "fffgpppffwwf",
  "ffffpppffwwf",
]);
const TOWN_GRID = Object.freeze([
  "ffffccccffff",
  "ffffccccffff",
  "ffffccccffff",
  "mmmmccccmmmm",
  "fBBBccccffff",
  "fBBBccccBBBf",
  "fBBBccccBBBf",
  "fBBBccccBBBf",
  "ffdccccccddf",
  "fGGddccccccf",
  "fGGddcccdccf",
  "ffGccccccccf",
  "ffdcccccccdf",
  "fGccccccccGf",
  "ffGccccccccf",
  "ffdcccccccdf",
  "ffGcccccccGf",
  "fBBBccccffff",
  "fBBBccccfBBf",
  "fBBBccccfBBf",
  "fBBBccccfBBf",
  "ffddccccccdf",
  "ffdcccccccdf",
  "fGGcccccccGf",
  "ffGdcccccdGf",
  "fffGccccGfff",
  "ffffccccffff",
]);

const ROAD_LAMPS = [[6,5],[3,10],[7,14],[11,18],[3,18],[7,22],[3,25]];
const TOWN_LAMPS = [[1,8],[8,8],[2,13],[10,14],[4,20],[8,20],[3,24],[9,24]];
const WALKABLE = new Set(["p", "c", "g", "S", "=", "d", "s", "u"]);
const FIELD_GRID = Object.freeze({ x: LEFT, y: TOP, columns: COLS, rows: ROWS, tileSize: SIZE });
const ROAD_CELL_PROPS = [...ROAD_LAMPS,[11,13]];
const TOWN_CELL_PROPS = [...TOWN_LAMPS,[2,8],[9,8],[1,9],[1,10],[2,12],[10,12],[10,13],[2,15],[10,15],[2,22],[10,21],[10,22],[1,23],[10,23],[2,24],[10,24]];

const DIRECTIONS = [[0, 1], [-1, 0], [1, 0], [0, -1]];
const coordinate = (col, row) => [LEFT + col * SIZE + SIZE / 2, TOP + row * SIZE + 38];
const tileAt = (x, y) => [Math.floor((x - LEFT) / SIZE), Math.floor((y - TOP) / SIZE)];
const equal = (a, b) => a[0] === b[0] && a[1] === b[1];
const neighbors = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1;
const inBox = (x, y, [left, top, right, bottom]) => x >= left && x < right && y >= top && y < bottom;

function noise(x, y, salt = 0) {
  let value = Math.imul(x + 347, 374761393) + Math.imul(y + 31, 668265263) + Math.imul(salt, 14426957);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return (value ^ value >>> 16) >>> 0;
}

function rect(ctx, color, x, y, width, height) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.floor(x), Math.floor(y), width, height);
}

function shape(ctx, color, x, y, points) {
  const low = Math.min(...points.map(point => point[1]));
  const high = Math.max(...points.map(point => point[1]));
  ctx.fillStyle = color;
  for (let line = low; line <= high; line += 1) {
    const hits = [];
    for (let i = 0; i < points.length; i += 1) {
      const [ax, ay] = points[i];
      const [bx, by] = points[(i + 1) % points.length];
      if ((ay <= line && by > line) || (by <= line && ay > line)) {
        hits.push(ax + (bx - ax) * (line - ay) / (by - ay));
      }
    }
    hits.sort((a, b) => a - b);
    for (let i = 0; i < hits.length; i += 2) {
      const start = Math.floor(hits[i]);
      ctx.fillRect(x + start, y + line, Math.floor(hits[i + 1]) - start + 1, 1);
    }
  }
}

function oval(ctx, color, cx, cy, rx, ry) {
  ctx.fillStyle = color;
  for (let y = -ry; y <= ry; y += 2) {
    const x = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2));
    ctx.fillRect(cx - x, cy + y, x * 2 + 1, 2);
  }
}

function tuft(ctx, x, y, seed, lit = false) {
  const colors = lit ? ["#6b7760", "#57615a"] : ["#465b55", "#354947"];
  const height = 4 + seed % 4;
  rect(ctx, "#1d3036", x, y, 8, 2);
  rect(ctx, colors[0], x + 2, y - height, 1, height);
  rect(ctx, colors[1], x + 4, y - height + 1, 1, height);
  rect(ctx, colors[0], x + 6, y - height + 3, 1, height - 3);
  rect(ctx, colors[1], x, y - 3, 1, 3);
  if (lit) rect(ctx, "#95845f", x + 3, y - height - 2, 2, 2);
}

function tree(ctx, x, y, variation = 0) {
  const turn = variation % 2;
  const height = 62 + variation % 4 * 5;
  const top = y - height;
  const drift = turn ? 4 : -3;
  oval(ctx, "#17262c", x + 6, y - 2, 19, 6);
  rect(ctx, "#2d3130", x - 3, y - 21, 6, 20);
  rect(ctx, "#51443a", x - 2, y - 19, 2, 15);
  rect(ctx, "#222b2d", x + 1, y - 18, 3, 17);
  shape(ctx, "#17292f", x, top, [[drift,0],[7,15],[10,23],[9,24],[16,39],[11,40],[24,55],[20,58],[9,57],[1,62],[-10,58],[-22,60],[-25,55],[-16,43],[-19,43],[-12,27],[-14,27],[-7,13]]);
  shape(ctx, "#253c40", x - 2, top, [[drift,2],[4,18],[2,21],[10,34],[7,37],[16,49],[11,50],[20,56],[9,54],[-1,58],[-9,53],[-20,55],[-16,50],[-17,47],[-10,38],[-13,36],[-8,27],[-11,26],[-3,12]]);
  shape(ctx, "#325050", x - 5, top + 4, [[drift,0],[4,13],[-1,14],[6,25],[1,26],[9,36],[4,38],[12,48],[1,47],[-6,51],[-15,49],[-9,41],[-12,39],[-6,31],[-9,27],[-5,19],[-8,17]]);
  shape(ctx, "#42605b", x - 6, top + 5, [[drift,0],[2,12],[-3,12],[3,23],[-3,23],[2,29],[-8,27],[-4,21],[-7,20],[-3,13],[-6,14]]);
  rect(ctx, "#658373", x + drift - 4, top + 12, 2, 3);
  rect(ctx, "#52766a", x - 13, top + 32, 5, 2);
  rect(ctx, "#557468", x - 15, top + 44, 7, 2);
  rect(ctx, "#69806e", x - 8, top + 32, 3, 1);
  rect(ctx, "#3d5953", x + 3, top + 44, 8, 2);
  rect(ctx, "#385752", x + 4, top + 54, 8, 1);
  for (let cluster = 0; cluster < 15; cluster += 1) {
    const seed = noise(x + cluster * 7, y, variation);
    const dy = 14 + seed % 39;
    const spread = Math.floor(dy / 4) - 2;
    const dx = ((seed >>> 14) % (spread * 2 + 1)) - spread;
    const tone = dx < 2 ? ["#3d5955", "#47645d", "#58736a"] : ["#2a4246", "#263a43", "#395653"];
    rect(ctx, tone[cluster % tone.length], x + dx - 2, top + dy, 2 + seed % 3, 1 + (seed % 5 === 0));
  }
}

function tallPine(ctx, x, y, seed) {
  const height = 75 + seed % 24;
  const wind = seed % 2 ? 1 : -1;
  oval(ctx,"#192830",x+3,y-2,19,6);
  rect(ctx,"#4d443c",x-3,y-39,6,39);
  rect(ctx,"#6c5741",x-3,y-23,2,21);
  for (let tier = 4; tier >= 0; tier -= 1) {
    const top=y-height+tier*14;
    const width=8+tier*4;
    shape(ctx,"#172c34",x+(tier-3)*wind,top,[[0,0],[5,8],[width+3,19],[width-1,19],[width+5,24],[width-5,25],[0,29],[-width+1,24],[-width-4,25],[-width,18],[-width-2,18],[-5,7]]);
    shape(ctx,["#325052","#385450","#365553"][tier%3],x+(tier-4)*wind-3,top+2,[[0,0],[3,8],[width-1,21],[4,19],[-5,22],[-width+1,20],[-width-2,19],[-4,8]]);
    rect(ctx,"#507069",x-width+1,top+19,width-7,2);
  }
}

function broadTree(ctx, x, y, seed) {
  const high = 44 + seed % 23;
  const color = seed % 3 ? ["#283c3b","#35534b","#42655a","#5c7661"] : ["#3e4035","#585a42","#65704e","#877b52"];
  oval(ctx,"#1b2b30",x+3,y,25,7);
  shape(ctx,"#59463c",x,y,[[-7,0],[-3,-35],[-15,-49],[-10,-52],[2,-40],[5,-61],[10,-59],[7,-28],[17,-39],[21,-35],[9,-18],[9,0]]);
  rect(ctx,"#8c6b4d",x-3,y-23,2,22);
  for (let j=0;j<7;j+=1) {
    const n=noise(x,y,j+seed), dx=(n%33)-16, cy=y-high+(n>>>8)%24;
    const width=14+(n>>>18)%8;
    oval(ctx,color[0],x+dx,cy+3,width+3,12);
    oval(ctx,color[1],x+dx-1,cy,width,11);
    oval(ctx,color[2],x+dx-3,cy-6,width-5,5);
    rect(ctx,color[3],x+dx-7,cy-7,7,2);
  }
}

function sapling(ctx,x,y,seed) {
  const h=26+seed%10;
  oval(ctx,"#1d3035",x+2,y,12,4);
  rect(ctx,"#6a5945",x-1,y-14,3,14);
  shape(ctx,"#33514b",x,y-h,[[1,0],[7,11],[6,13],[13,23],[9,26],[-1,25],[-10,27],[-13,23],[-5,12],[-6,11]]);
  shape(ctx,"#557562",x-1,y-h+2,[[0,0],[3,11],[1,12],[6,21],[-2,20],[-8,22],[-9,21],[-5,11]]);
  rect(ctx,"#779075",x-6,y-h+18,6,1);
}

function windsweptPine(ctx,x,y,seed) {
  const top=y-62-seed%12;
  oval(ctx,"#1b2b30",x+4,y,21,5);
  shape(ctx,"#574c41",x,y,[[-5,0],[-6,-18],[0,-32],[-3,-49],[-11,-66],[-5,-68],[5,-53],[9,-38],[2,-19],[4,0]]);
  shape(ctx,"#877352",x,y,[[-5,-3],[-4,-20],[2,-32],[-1,-50],[-7,-61],[-4,-62],[3,-51],[5,-35],[-1,-20],[-1,-4]]);
  for (const [dy,dx,w] of [[30,-7,33],[17,-12,29],[4,-16,18]]) {
    shape(ctx,"#203840",x+dx,top+dy,[[0,0],[8,8],[w,12],[w-1,17],[16,17],[6,21],[-11,16],[-18,17],[-13,10],[-6,6]]);
    shape(ctx,"#425f57",x+dx-2,top+dy+1,[[1,0],[7,6],[w-5,11],[16,12],[8,15],[-5,15],[-14,13],[-10,9],[-5,6]]);
    rect(ctx,"#6a7a65",x+dx-10,top+dy+11,13,2);
  }
}

function rocks(ctx, x, y, scale = 1) {
  const draw = (color, points) => shape(ctx, color, x, y, points.map(([a, b]) => [Math.round(a * scale), Math.round(b * scale)]));
  draw("#1b2a33", [[0,21],[4,10],[10,2],[27,0],[34,5],[43,18],[42,29],[28,34],[8,32]]);
  draw("#364553", [[4,20],[9,10],[13,4],[26,3],[33,8],[40,19],[36,23],[28,23],[24,27],[10,27]]);
  draw("#4b5a60", [[7,15],[14,6],[25,5],[31,10],[32,16],[21,18],[17,21],[9,20]]);
  draw("#61716d", [[14,7],[27,6],[30,11],[20,10],[14,14],[9,16]]);
  draw("#293947", [[19,22],[28,18],[34,18],[39,20],[41,27],[27,32],[22,29]]);
  rect(ctx, "#405356", x + 8 * scale, y + 22 * scale, Math.round(8 * scale), Math.max(1, Math.round(2 * scale)));
  rect(ctx, "#586963", x + 13 * scale, y + 13 * scale, Math.round(4 * scale), 1);
}

function crate(ctx, x, y, color = "#795a43") {
  rect(ctx, "#1c2b32", x - 2, y + 13, 23, 5);
  rect(ctx, "#382f2f", x, y, 18, 16);
  rect(ctx, color, x + 1, y + 2, 16, 12);
  rect(ctx, "#a37b53", x + 1, y, 16, 2);
  rect(ctx, "#6a4738", x + 4, y + 3, 1, 10);
  rect(ctx, "#6a4738", x + 9, y + 3, 1, 10);
  rect(ctx, "#6a4738", x + 13, y + 3, 1, 10);
  for (let i = 0; i < 12; i += 1) rect(ctx, "#ae845b", x + 2 + i, y + 12 - Math.floor(i / 2), 2, 1);
}

function barrel(ctx, x, y) {
  oval(ctx, "#263039", x + 7, y + 13, 10, 3);
  shape(ctx, "#302c30", x, y, [[1,2],[4,0],[11,0],[15,3],[16,10],[12,16],[3,16],[0,11]]);
  shape(ctx, "#795443", x, y, [[2,3],[6,0],[11,0],[14,3],[14,10],[11,15],[4,15],[1,10]]);
  oval(ctx, "#b4895d", x + 7, y + 3, 5, 2);
  rect(ctx, "#6c4939", x + 4, y + 5, 2, 9);
  rect(ctx, "#493d3d", x + 1, y + 7, 13, 2);
  rect(ctx, "#493d3d", x + 2, y + 12, 11, 2);
  rect(ctx, "#a97a56", x + 8, y + 10, 1, 3);
}

function sign(ctx, x, y, kind) {
  rect(ctx, "#312c2e", x - 1, y - 22, 4, 22);
  rect(ctx, "#82664d", x, y - 22, 1, 20);
  rect(ctx, "#382d2b", x - 10, y - 21, 22, 15);
  rect(ctx, "#79553d", x - 9, y - 20, 20, 12);
  rect(ctx, "#af8256", x - 8, y - 19, 18, 1);
  if (kind === "forge") {
    rect(ctx, "#d2a580", x - 4, y - 17, 9, 3);
    rect(ctx, "#d2a580", x - 2, y - 14, 3, 5);
  } else if (kind === "inn") {
    rect(ctx, "#d2a580", x - 4, y - 16, 7, 5);
    rect(ctx, "#d2a580", x + 3, y - 15, 3, 3);
    rect(ctx, "#f1c792", x - 5, y - 17, 8, 1);
  } else if (kind === "goods") {
    rect(ctx,"#e5b882",x-5,y-16,11,7);
    rect(ctx,"#624c3f",x-1,y-16,2,7);
    rect(ctx,"#ad7953",x-5,y-13,11,1);
  } else if (kind === "tailor") {
    rect(ctx,"#dca6a4",x-5,y-16,11,2);
    rect(ctx,"#dca6a4",x-1,y-18,3,10);
    rect(ctx,"#f1c385",x-4,y-10,9,2);
  } else {
    rect(ctx, "#d2a580", x - 5, y - 15, 11, 2);
    rect(ctx, "#d2a580", x + 2, y - 17, 2, 6);
  }
}

function lamp(ctx, x, y) {
  rect(ctx, "#1c2a32", x - 2, y - 25, 5, 27);
  rect(ctx, "#668385", x - 1, y - 22, 1, 23);
  rect(ctx, "#9b7456", x + 2, y - 21, 1, 10);
  rect(ctx, "#2e2d30", x - 6, y - 33, 13, 11);
  rect(ctx, "#ad6d46", x - 5, y - 31, 11, 8);
  rect(ctx, "#f09d52", x - 4, y - 31, 9, 7);
  rect(ctx, "#ffdb8b", x - 2, y - 30, 5, 5);
  rect(ctx, "#a38260", x - 3, y - 35, 7, 2);
  rect(ctx, "#3a3740", x - 6, y - 23, 13, 2);
}

function windowFrame(ctx, x, y, color = "#eda460") {
  rect(ctx, "#4a3834", x - 2, y - 2, 26, 24);
  rect(ctx, "#b28a62", x - 1, y - 1, 24, 21);
  rect(ctx, "#603c33", x, y, 22, 19);
  rect(ctx, "#a26043", x + 2, y + 3, 18, 14);
  rect(ctx, color, x + 3, y + 3, 16, 12);
  rect(ctx, "#ffcb80", x + 4, y + 4, 14, 4);
  rect(ctx, "#75473a", x + 10, y + 2, 2, 15);
  rect(ctx, "#795346", x + 2, y + 8, 18, 2);
  rect(ctx, "#cfa477", x - 2, y + 19, 25, 2);
}

function roof(ctx, x, y, width, height, colors, style) {
  const [edge, base, dark, bright, rim] = colors;
  const eave = y+height;
  const topLeft = [40,13,17,27][style];
  const topRight = [33,31,19,30][style];
  for (let row=0;row<height;row+=1) {
    const course=Math.floor(row/8);
    const left=Math.max(0,topLeft-course*(style===1?2:5));
    const right=width-Math.max(0,topRight-course*(style===1?4:5));
    rect(ctx,edge,x+left,y+row,right-left,1);
    if (row%8>5 || right-left<12) continue;
    rect(ctx,row%8===0 ? rim : base,x+left+2,y+row,right-left-4,1);
    for (let seam=left+4+(course%2)*6;seam<right-9;seam+=13) {
      rect(ctx,row%8===1?bright:dark,x+seam,y+row,row%8===1?8:1,1);
    }
  }
  rect(ctx,rim,x+topLeft+2,y+1,width-topLeft-topRight-4,2);
  rect(ctx,edge,x-1,eave-5,width+2,8);
  rect(ctx,bright,x,eave-4,width,2);
  rect(ctx,"#302b31",x+1,eave-1,width-2,2);
}

const ROOFS = [
  ["#282e3a", "#395561", "#293e4f", "#65808a", "#58737c"],
  ["#352d3c", "#595161", "#433e50", "#837482", "#6f6374"],
  ["#392d35", "#514758", "#3d3544", "#786070", "#634f5e"],
  ["#29313a", "#3b4a56", "#2d3b4b", "#70828b", "#536775"],
];

function house(ctx, x, bottom, width, style) {
  const height = [150,119,137,133][style];
  const roofHeight = [95,59,73,85][style];
  const top = bottom - height;
  const eave = top + roofHeight - 5;
  const doorway = Math.floor(width / 2) - 12;
  rect(ctx, "#293139", x - 6, bottom - 10, width + 14, 16);
  rect(ctx, "#493b39", x + 5, eave - 5, width - 9, bottom - eave + 4);
  rect(ctx, style === 2 ? "#68544b" : "#91765a", x + 7, eave - 2, width - 14, bottom - eave - 3);
  for (let ay = eave; ay < bottom - 1; ay += style === 2 ? 6 : 10) {
    rect(ctx, style === 2 ? "#4c4445" : "#745b48", x + 8, ay, width - 17, 1);
    for (let ax = x + 13 + (ay % 3) * 4; ax < x + width - 15; ax += 13) {
      if (style === 2) rect(ctx, "#8e705b", ax, ay + 1, 10, 1);
      rect(ctx, "#5a4b46", ax, ay + 2, 1, 3);
    }
  }
  [9, width - 14, doorway - 8, doorway + 31].forEach(offset => {
    rect(ctx, "#4d3a36", x + offset, eave + 4, 5, bottom - eave - 6);
    rect(ctx, "#c19161", x + offset, eave + 7, 1, bottom - eave - 10);
  });
  rect(ctx, "#403434", x + doorway + 0, bottom - 35, 25, 34);
  rect(ctx, "#9d7050", x + doorway + 2, bottom - 34, 21, 3);
  rect(ctx, "#553d39", x + doorway + 4, bottom - 31, 17, 30);
  rect(ctx, "#745043", x + doorway + 5, bottom - 30, 5, 26);
  rect(ctx, "#bd824d", x + doorway + 15, bottom - 18, 2, 2);
  rect(ctx, "#cf9b6c", x + doorway + 2, bottom - 1, 21, 2);
  windowFrame(ctx, x + 17, eave + 9);
  if (style !== 2) windowFrame(ctx, x + width - 38, eave + 9);
  if (style === 2) {
    rect(ctx, "#3e2d32", x + 85, eave + 5, 29, 30);
    rect(ctx, "#923e38", x + 88, eave + 9, 24, 25);
    shape(ctx, "#e77841", x + 88, eave + 18, [[0,16],[1,7],[4,9],[9,0],[14,8],[16,3],[19,11],[23,7],[23,16]]);
    shape(ctx, "#ffbd70", x + 94, eave + 23, [[0,11],[2,5],[4,7],[8,0],[11,8],[14,4],[14,11]]);
  }
  roof(ctx, x, top, width, roofHeight, ROOFS[style], style);
  if (style === 2) {
    rect(ctx, "#342f37", x + 95, top + 5, 19, 27);
    rect(ctx, "#815a50", x + 96, top + 5, 14, 24);
    [7, 13, 20, 26].forEach(block => rect(ctx, "#554950", x + 96, top + block, 16, 2));
    rect(ctx, "#b08166", x + 93, top + 3, 23, 4);
    rect(ctx, "#3a343a", x + 95, top + 2, 19, 2);
  }
  if (style === 3) {
    const dormerX = x + width - 40;
    const dormerY = top + 24;
    rect(ctx, "#29313e", dormerX - 4, dormerY + 5, 28, 24);
    rect(ctx, "#846750", dormerX, dormerY + 9, 20, 18);
    shape(ctx, "#263843", dormerX, dormerY, [[-5,9],[10,-3],[24,9],[19,12],[0,12]]);
    shape(ctx, "#718088", dormerX, dormerY, [[-3,8],[10,-1],[21,8],[15,9],[3,9]]);
    rect(ctx, "#6e533e", dormerX + 5, dormerY + 12, 10, 12);
    rect(ctx, "#cb8a58", dormerX + 6, dormerY + 13, 8, 9);
    rect(ctx, "#f0bd78", dormerX + 7, dormerY + 14, 6, 3);
    rect(ctx, "#705640", dormerX + 9, dormerY + 13, 2, 9);
    rect(ctx, "#bd9a6f", dormerX + 3, dormerY + 24, 15, 2);
  }
  if (style === 1) {
    const awningY = bottom - 29;
    rect(ctx, "#41313a", x - 1, awningY, 48, 15);
    rect(ctx, "#a46150", x, awningY + 2, 46, 10);
    for (let stripe = 4; stripe < 45; stripe += 11) {
      rect(ctx, "#cf9b6d", x + stripe, awningY + 2, 5, 10);
      rect(ctx, "#a77458", x + stripe, awningY + 11, 5, 3);
    }
    rect(ctx, "#664439", x + 2, awningY + 13, 2, 17);
    rect(ctx, "#664439", x + 43, awningY + 13, 2, 17);
    crate(ctx,x+7,bottom-15);
    barrel(ctx,x+30,bottom-14);
  }
}

function stall(ctx, x, y, cloth = ["#924c46","#d1a073","#976852","#c38262"]) {
  rect(ctx, "#232c34", x - 3, y + 26, 72, 8);
  rect(ctx, "#5b443c", x + 1, y + 3, 5, 29);
  rect(ctx, "#6d5143", x + 58, y + 2, 4, 28);
  rect(ctx, "#745244", x, y + 19, 62, 6);
  rect(ctx, "#a37b53", x + 1, y + 18, 61, 3);
  rect(ctx, cloth[0], x - 2, y, 67, 11);
  for (let stripe = 5; stripe < 63; stripe += 14) {
    rect(ctx, cloth[1], x + stripe, y, 6, 10);
    rect(ctx, cloth[2], x + stripe, y + 9, 6, 4);
  }
  rect(ctx, cloth[3], x - 2, y, 65, 2);
  rect(ctx, "#6f4b45", x, y + 11, 65, 2);
  rect(ctx, "#e1a75f", x + 13, y + 14, 8, 4);
  rect(ctx, "#67805b", x + 24, y + 15, 10, 3);
  rect(ctx, "#c96a55", x + 44, y + 14, 6, 4);
  rect(ctx, "#eebf82", x + 14, y + 14, 4, 1);
  rect(ctx, "#91a167", x + 25, y + 15, 5, 1);
}

function well(ctx, x, y) {
  oval(ctx, "#27313a", x, y + 3, 26, 14);
  shape(ctx, "#786d5d", x, y, [[-24,-12],[-16,-22],[12,-22],[22,-14],[25,-2],[21,6],[13,12],[-14,12],[-23,4]]);
  oval(ctx, "#92927b", x, y - 9, 21, 12);
  oval(ctx, "#4d5455", x, y - 9, 16, 8);
  oval(ctx, "#274453", x - 2, y - 9, 13, 6);
  rect(ctx, "#6a8583", x - 8, y - 8, 13, 1);
  rect(ctx, "#8a6f57", x - 19, y - 48, 4, 39);
  rect(ctx, "#8a6f57", x + 17, y - 48, 4, 38);
  rect(ctx, "#4b3c38", x - 15, y - 47, 1, 36);
  rect(ctx, "#bea178", x - 20, y - 49, 41, 4);
  rect(ctx, "#6d5547", x - 20, y - 45, 41, 2);
  rect(ctx, "#a28b69", x - 1, y - 45, 2, 24);
  rect(ctx, "#966b4f", x - 5, y - 22, 11, 8);
  rect(ctx, "#b68763", x - 5, y - 23, 11, 2);
  rect(ctx, "#4b5151", x - 2, y + 1, 2, 7);
  rect(ctx, "#4b5151", x + 13, y - 1, 2, 6);
}

function fence(ctx, x, y, width) {
  rect(ctx, "#202d35", x, y + 4, width, 3);
  rect(ctx, "#705a49", x, y - 6, width, 3);
  rect(ctx, "#4c4040", x, y, width, 3);
  rect(ctx, "#9b7959", x, y - 7, width, 1);
  for (let col = 1; col < width; col += 13) {
    rect(ctx, "#423736", x + col, y - 13, 5, 19);
    rect(ctx, "#a17e5a", x + col, y - 13, 4, 3);
    rect(ctx, "#775b46", x + col, y - 10, 2, 15);
  }
}

function basalt(ctx, x, y, width, height, seed) {
  const silhouette = [[0,3],[3,0],[width-4,0],[width-1,2],[width-1,height-3],
    [width-3,height-1],[2,height-1],[0,height-3]];
  shape(ctx, "#30343e", x + 1, y + 2, silhouette);
  const faces = ["#5a5a62", "#666169", "#545963", "#5b5e68"];
  shape(ctx, faces[seed % faces.length], x, y, silhouette);
  rect(ctx, "#777078", x + 4, y + 1, Math.max(1, width - 8), 1);
  rect(ctx, "#41444f", x + 3, y + height - 2, width - 6, 1);
  rect(ctx, "#777478", x + 2 + seed % Math.max(1, width - 7), y + 3, 3, 1);
  if (seed % 4 === 1) {
    rect(ctx, "#424953", x + width - 6, y + 4, 1, height - 7);
    rect(ctx, "#535752", x + width - 8, y + height - 3, 4, 1);
  }
}

const sameStone = new Set(["c", "d"]);
const terrainColor = {
  f: "#283b43", g: "#3b4c48", p: "#655f55", c: "#635b53", d: "#635b53",
  w: "#284b5d", t: "#405052", k: "#2e3b49", S: "#59606a", "=": "#84674f",
  m: "#46515c", G: "#435650", H: "#414039", B: "#2d3a3c", r: "#38484a",
};

function tileTop(col, row) {
  return [LEFT + col * SIZE, TOP + row * SIZE];
}

function scatterTile(ctx, x, y, seed, colors, count, span = 4) {
  for (let i = 0; i < count; i += 1) {
    const value = noise(seed % 613, i, 221);
    const px = 1 + (value >>> 4) % (SIZE - 2 - span);
    const py = 1 + (value >>> 16) % (SIZE - 3);
    rect(ctx, colors[value % colors.length], x + px, y + py, 1 + value % span, 1);
  }
}

function cobbleTile(ctx, x, y, row, col) {
  for (let line = 0; line < 6; line += 1) {
    const offset = (row * 6 + line) % 2 * 8;
    const ly = y + line * 8;
    rect(ctx, "#4a4847", x, ly + 7, SIZE, 1);
    for (let cell = -offset; cell < SIZE; cell += 16) {
      const seed = noise(col * 3 + Math.floor((cell + offset) / 16), row * 6 + line, 451);
      const left = Math.max(0, cell);
      const right = Math.min(SIZE, cell + 15);
      const tone = ["#655d53","#676059","#625b53","#6a6055","#605a52"][seed % 5];
      rect(ctx, tone, x + left, ly, right - left, 7);
      rect(ctx, "#7c6e61", x + left + 1, ly, Math.max(0, right - left - 3), 1);
      if (right < SIZE) rect(ctx, "#514d4a", x + right, ly + 1, 1, 5);
      if (seed % 5 === 0 && right - left > 6) rect(ctx, "#4e4a47", x + left + 4, ly + 4, 3, 1);
    }
  }
}

function stoneChip(ctx, x, y, width, seed) {
  const rise = 1 + seed % 3;
  const depth = 4 + (seed >>> 11) % 4;
  shape(ctx, "#55575a", x, y, [[1,1],[5,0],[width-1,rise],[width+1,depth-1],[width-4,depth+1],[3,depth],[0,depth-2]]);
  shape(ctx, ["#827a6f","#716b62","#77716a","#7e766c"][seed % 4], x, y, [[1,1],[5,0],[width-2,rise],[width,depth-2],[width-5,depth],[2,depth-1],[0,depth-2]]);
  rect(ctx, "#9b8b786e", x + 4, y + 1, Math.max(1, width - 9), 1);
}

function pathTile(ctx, x, y, grid, row, col, seed) {
  scatterTile(ctx, x, y, seed, ["#88776175","#8b816a65","#544f4888","#74695b","#9a866555"], 44);
  if (seed % 5 !== 1) {
    stoneChip(ctx, x + 4 + seed % 17, y + 6 + seed % 6, 11 + (seed >>> 8) % 9, seed);
    if (seed % 3 === 0) stoneChip(ctx, x + 24, y + 29, 13, seed >>> 2);
    if (seed % 3 === 1) stoneChip(ctx, x + 10, y + 31, 10, seed >>> 3);
  }
  if (seed%11<3) {
    shape(ctx,"#83736058",x+seed%13,y+19,[[0,5],[13,0],[26,1],[29,6],[21,9],[5,10]]);
    rect(ctx,"#b19a7e52",x+seed%13+13,y+22,8,1);
  }
  const isRoad = (dy, dx) => ["p", "S", "=", "g"].includes(grid[row + dy]?.[col + dx]);
  if (!isRoad(0, -1)) {
    rect(ctx, "#544f48", x, y, 3, SIZE);
    rect(ctx, "#80705c", x + 3, y + 1 + seed % 13, 1, 6 + seed % 18);
  }
  if (!isRoad(0, 1)) {
    rect(ctx, "#565449", x + SIZE-3, y, 3, SIZE);
    rect(ctx, "#8b7962", x + SIZE-4, y + 17, 1, 3 + seed % 14);
  }
  if (!isRoad(-1, 0)) rect(ctx, "#514e45", x, y, SIZE, 2);
  if (!isRoad(1, 0)) rect(ctx, "#4f514b", x, y + SIZE-2, SIZE, 2);
}

function waterTile(ctx, x, y, grid, row, col, seed) {
  const isWet = (dy, dx) => ["w", "="].includes(grid[row + dy]?.[col + dx]);
  if (!isWet(0, -1)) {
    rect(ctx, "#4b6969", x, y, 4, SIZE);
    rect(ctx, "#355f67", x + 4, y, 2, SIZE);
  }
  if (!isWet(0, 1)) {
    rect(ctx, "#4b6766", x + SIZE-4, y, 4, SIZE);
    rect(ctx, "#355e65", x + SIZE-6, y, 2, SIZE);
  }
  if (!isWet(-1, 0)) rect(ctx, "#507073", x, y, SIZE, 3);
  if (!isWet(1, 0)) rect(ctx, "#3d6268", x, y + SIZE-3, SIZE, 3);
  for (let i = 0; i < 15; i += 1) {
    const jitter = noise(col, row, i + 15);
    const dx = 4 + (jitter >>> 7) % (SIZE-15);
    const dy = 4 + (jitter >>> 16) % (SIZE-8);
    rect(ctx, ["#355f6b","#376471","#315b6a","#4a7280"][jitter % 4], x + dx, y + dy, 3 + jitter % 7, 1);
  }
  if (seed % 5 === 0) rect(ctx, "#577d85", x + 20, y + 26, 9, 1);
}

function stairTile(ctx, x, y, col, row) {
  for (let step = 0; step < 6; step += 1) {
    const yy = y + step * 8;
    rect(ctx, "#343b48", x, yy + 7, SIZE, 1);
    for (let bx = 0; bx < 3; bx += 1) {
      const seed = noise(col * 3 + bx, row * 6 + step, 731);
      rect(ctx, ["#5b616b","#676670","#625e66","#656875"][seed % 4], x + 16 * bx, yy + 1, 16, 6);
      rect(ctx, "#87817f", x + 16 * bx + 1, yy + 1, 15, 1);
      rect(ctx, "#555661", x + 16 * bx + 14, yy + 2, 2, 4);
      if (seed % 5 < 2) rect(ctx, "#a29380", x + 16 * bx + 6, yy + 2, 3, 1);
    }
  }
}

function ledgeTile(ctx, x, y, seed) {
  rect(ctx, "#546660", x, y, SIZE, 5);
  rect(ctx, "#6f7b6b", x, y, SIZE, 1);
  for (let i = 0; i < 4; i += 1) {
    const offset = i * 12;
    const salt = noise(seed % 387, i, 70);
    const tone = ["#384655","#414c57","#334250","#4c535c"][salt % 4];
    shape(ctx, tone, x + offset, y, [[0,6],[9,4],[12,33],[8,45],[2,41],[0,29]]);
    rect(ctx, "#283746", x + offset, y + 10 + salt % 7, 1, 26);
    rect(ctx, "#59635f", x + offset + 3, y + 6, 5, 1);
    if (salt % 3 === 0) rect(ctx, "#737d6d", x + offset + 2, y + 1, 3, 2);
  }
  rect(ctx, "#233543", x, y + SIZE-2, SIZE, 2);
}

function deckTile(ctx, x, y, row, grid, col) {
  for (let plank = 0; plank < 6; plank += 1) {
    const xx = x + plank * 8;
    const seed = noise(col * 6 + plank, row, 544);
    rect(ctx, ["#9b7958","#967452","#876a50","#927354"][seed % 4], xx, y, 8, SIZE);
    rect(ctx, "#bd9b73", xx + 1, y, 1, SIZE);
    rect(ctx, "#665345", xx + 7, y, 1, SIZE);
    rect(ctx, "#524337", xx + 2, y + 7 + seed % 30, 2, 2);
    if (seed % 4 === 1) rect(ctx, "#705a47", xx + 4, y + 10, 1, 20);
  }
  for (const [neighbor, edge] of [[row - 1, y], [row + 1, y + SIZE-7]]) {
    if (grid[neighbor]?.[col] === "=") continue;
    rect(ctx, "#4c3c34", x, edge, SIZE, 6);
    rect(ctx, "#a7835c", x, edge, SIZE, 2);
    for (const offset of [4, 28]) {
      rect(ctx, "#5f493b", x + offset, edge - 4, 5, 13);
      rect(ctx, "#be996d", x + offset + 1, edge - 4, 3, 2);
    }
    if (col === 9) rect(ctx, "#c8a679", x + 14, edge, 11, 2);
  }
}

function paintTile(ctx, grid, col, row) {
  const type = grid[row][col];
  const [x, y] = tileTop(col, row);
  const seed = noise(col, row, 37);
  rect(ctx, terrainColor[type], x, y, SIZE, SIZE);
  if (sameStone.has(type)) cobbleTile(ctx, x, y, row, col);
  else if (type === "p") pathTile(ctx, x, y, grid, row, col, seed);
  else if (type === "w") waterTile(ctx, x, y, grid, row, col, seed);
  else if (type === "S") stairTile(ctx, x, y, col, row);
  else if (type === "k") ledgeTile(ctx, x, y, seed);
  else if (type === "=") deckTile(ctx, x, y, row, grid, col);
  else if (type === "m") {
    for (let h = 0; h < 4; h += 1) {
      for (let j = 0; j < 3; j += 1) basalt(ctx, x + j * 16, y + h * 12, 16, 11, seed + h + j);
    }
  } else {
    const vegetation = ["#415459","#293e49","#3c514b","#425551","#4c5d55"];
    scatterTile(ctx, x, y, seed, vegetation, type === "B" ? 26 : 49);
    if (type === "g" || type === "t" || type === "G") {
      tuft(ctx, x + 4 + seed % 11, y + 9 + seed % 28, seed, seed % 4 === 1);
      if (seed % 3 === 0) tuft(ctx, x + 27, y + 36, seed >>> 5);
    }
    if (type==="B") {
      if (grid[row-1]?.[col]!=="B") for(let j=0;j<3;j+=1) basalt(ctx,x+j*16,y+1,16,7,seed+j);
      if (grid[row+1]?.[col]!=="B") rect(ctx,"#4c4f47",x,y+SIZE-2,SIZE,2);
    }
  }
}

function paintGrid(ctx, grid) {
  rect(ctx, "#283942", 0, 0, WIDTH, HEIGHT);
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const [x,y] = tileTop(col,row);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x,y,SIZE,SIZE);
      ctx.clip();
      paintTile(ctx,grid,col,row);
      ctx.restore();
    }
  }
}

function goldenFloor(ctx, x, y, rx, ry) {
  oval(ctx, "#b389562c", x, y, rx, ry);
  oval(ctx, "#d49a5223", x, y, rx - 5, ry - 4);
  oval(ctx, "#edb46c20", x - 3, y - 2, rx - 13, ry - 8);
  oval(ctx, "#f5c07b1b", x, y - 3, rx - 20, ry - 12);
}

function forest(ctx, grid, townMode) {
  const props = townMode ? TOWN_CELL_PROPS : ROAD_CELL_PROPS;
  for (let row=0;row<ROWS;row+=1) {
    for (let col=0;col<COLS;col+=1) {
      const cell=grid[row][col];
      if (!["f","t","G"].includes(cell) || props.some(([x,y])=>x===col && y===row)) continue;
      const seed=noise(col,row,52);
      if (seed%8 < (townMode ? 3 : 2)) continue;
      const [x,y]=coordinate(col,row);
      if (cell==="G" || townMode && seed%4===1) broadTree(ctx,x,y,seed);
      else if (seed%5===1) sapling(ctx,x,y,seed);
      else if (seed%6===2 || !townMode && row>=18 && (col+row)%3===1) windsweptPine(ctx,x,y,seed);
      else if (seed%4===2) tree(ctx,x,y,seed);
      else tallPine(ctx,x,y,seed);
    }
  }
}

function lowRoot(ctx, x, y) {
  shape(ctx, "#263437", x, y, [[-12,4],[-6,-2],[3,-4],[16,-2],[29,2],[24,6],[11,4],[0,4],[-10,9]]);
  shape(ctx, "#685c47", x, y, [[-12,4],[-6,-2],[3,-4],[16,-2],[27,1],[13,0],[3,0],[-5,3],[-9,5]]);
  rect(ctx, "#89795c", x + 4, y - 3, 9, 1);
}

function roadGate(ctx) {
  const [x,y]=tileTop(7,3);
  rect(ctx,"#263541",x,y-13,SIZE*3,20);
  for(let i=0;i<9;i+=1) basalt(ctx,x+i*16,y-12-Math.round(Math.sin(i*0.42)*5),16,15,noise(i,y,54));
  rect(ctx,"#a49e88",x+62,y-11,18,3);
  for(const col of [7,9]) {
    const [left,top]=tileTop(col,3);
    rect(ctx,"#263744",left,top+38,SIZE,8);
    rect(ctx,"#67736f",left+2,top+38,SIZE-4,3);
  }
}

function smallGuardhouse(ctx) {
  const [left,top]=tileTop(10,12);
  const x=left+1, y=top+7;
  const width=95;
  rect(ctx,"#2e3439",x,y+15,width,81);
  rect(ctx,"#72634e",x+4,y+34,width-9,51);
  roof(ctx,x,y,width,38,ROOFS[0],1);
  rect(ctx,"#382f31",x+13,y+48,23,37);
  rect(ctx,"#a78056",x+13,y+45,26,3);
  rect(ctx,"#54453a",x+39,y+44,4,41);
  windowFrame(ctx,x+57,y+43);
}

function roadScenery(ctx, grid) {
  forest(ctx,grid,false);
  roadGate(ctx);
  smallGuardhouse(ctx);
  for (const [col,row,scale] of [[1,13,.92],[3,16,.95],[3,20,.8],[4,6,.72],[8,10,.74],[10,19,.85],[2,22,.8],[3,24,.88],[10,18,.62]]) {
    const [x,y]=coordinate(col,row);
    rocks(ctx,x-19,y-22,scale);
  }
  for (const [col,row] of [[3,8],[3,12],[2,18],[3,21],[8,24]]) lowRoot(ctx,...coordinate(col,row));
  sign(ctx,...coordinate(4,14),"route");
  const [x,y]=coordinate(11,13);
  crate(ctx,x-10,y-10);
  for (const [col,row] of ROAD_LAMPS) {
    const [x,y]=coordinate(col,row);
    goldenFloor(ctx,x+4,y-1,57,29);
    lamp(ctx,x,y);
  }
}

function workTable(ctx, x, y) {
  rect(ctx,"#322e33",x,y+12,31,4);
  rect(ctx,"#725344",x+3,y+1,4,15);
  rect(ctx,"#795a46",x+27,y+1,4,15);
  rect(ctx,"#543c39",x,y-4,31,10);
  rect(ctx,"#ba8d60",x,y-6,31,4);
  rect(ctx,"#423f44",x+7,y-10,17,7);
  rect(ctx,"#78838a",x+4,y-12,23,2);
  rect(ctx,"#554c4d",x+26,y-9,4,7);
  rect(ctx,"#ed9b58",x+14,y-12,8,1);
}

function townGate(ctx) {
  const [x,y]=tileTop(4,3);
  const width=4*SIZE;
  rect(ctx,"#392f35",x,y+2,width,18);
  rect(ctx,"#82644e",x,y+1,width,7);
  rect(ctx,"#b28357",x+2,y,width-4,2);
  rect(ctx,"#5f4c44",x+7,y+15,width-14,2);
  for (const col of [3,8]) {
    const [left,top]=tileTop(col,3);
    rect(ctx,"#48515a",left,top+1,SIZE,SIZE-2);
    for (let j=0;j<4;j+=1) basalt(ctx,left+2,top+j*11,SIZE-4,10,noise(col,j,941));
  }
}

function bench(ctx, x, y) {
  const width=27;
  rect(ctx,"#272c33",x-2,y+11,width+4,4);
  rect(ctx,"#4a3937",x+3,y+3,4,11);
  rect(ctx,"#4a3937",x+width-8,y+3,4,11);
  rect(ctx,"#775747",x,y,width,8);
  rect(ctx,"#b68d64",x,y-1,width,2);
  rect(ctx,"#866349",x+1,y+3,width-1,2);
  rect(ctx,"#4f403c",x+1,y+7,width-2,1);
}

function planter(ctx,x,y,color) {
  shape(ctx,"#2b3538",x,y,[[-1,8],[3,4],[16,2],[22,7],[21,14],[15,17],[4,16]]);
  rect(ctx,"#6b5949",x+3,y+7,15,7);
  rect(ctx,"#aa8761",x+2,y+5,18,3);
  rect(ctx,"#5a4d41",x+5,y+12,11,1);
  tuft(ctx,x+6,y+7,noise(x,y),true);
  rect(ctx,color,x+5,y+1,3,2);
  rect(ctx,color,x+12,y+2,2,2);
}

function townScenery(ctx, grid) {
  forest(ctx,grid,true);
  townGate(ctx);
  for (const [col,row,cols,rows,style] of [[1,4,3,4,0],[8,5,3,3,1],[1,17,3,4,2],[9,18,2,3,3]]) {
    const [x,y]=tileTop(col,row);
    house(ctx,x+1,y+rows*SIZE-3,cols*SIZE-2,style);
  }
  for (const [col,row,kind] of [[2,8,"inn"],[9,8,"goods"],[1,21,"forge"],[10,21,"tailor"]]) sign(ctx,...coordinate(col,row),kind);
  const [stallX,stallY]=tileTop(3,10);
  stall(ctx,stallX+13,stallY+7);
  crate(ctx,stallX+73,stallY+22);
  well(ctx,...coordinate(8,10));
  const [tableX,tableY]=tileTop(2,21);
  workTable(ctx,tableX+8,tableY+29);
  for (const [col,row] of [[10,8],[10,12],[10,15],[10,22]]) {
    const [x,y]=tileTop(col,row);
    bench(ctx,x+9,y+25);
  }
  for (const [col,row] of [[3,9],[2,12],[2,22],[10,13]]) {
    const [x,y]=coordinate(col,row);
    crate(ctx,x-10,y-9);
  }
  for (const [col,row] of [[1,9],[4,9],[1,13],[2,15],[1,23],[10,23],[2,24],[10,24]]) {
    const [x,y]=coordinate(col,row);
    planter(ctx,x-10,y-8,["#ab7957","#bc8970","#c5a376"][(col+row)%3]);
  }
  for (const [col,row] of [[1,10],[10,13]]) {
    const [x,y]=coordinate(col,row);
    barrel(ctx,x+8,y-12);
  }
  for (const [col,row] of [[1,24],[9,24]]) {
    const [x,y]=tileTop(col,row);
    fence(ctx,x,y+24,SIZE*2);
  }
  for (const [col,row] of TOWN_LAMPS) {
    const [x,y]=coordinate(col,row);
    goldenFloor(ctx,x+2,y-3,59,32);
    lamp(ctx,x,y);
  }
}

function bankSprite(ctx, sheet, col, row, x, y) {
  if (!sheet?.complete || !sheet.naturalWidth) return;
  ctx.drawImage(sheet, col * 48, row * 60, 48, 60, Math.round(x) - 24, Math.round(y) - 60, 48, 60);
}

function direction(from, to) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 2 : 1;
  return dy < 0 ? 3 : 0;
}

function stepColumn(elapsed) {
  const phase = Math.max(0, elapsed) % 500;
  if (phase < 150) return 0;
  if (phase < 250) return 1;
  return phase < 400 ? 2 : 1;
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

function drawActivity(ctx,member,x,y,time) {
  const beat=Math.floor(time/120);
  if (member.notice) {
    rect(ctx,"#fce5a3",x-1,y-65,3,6);
    rect(ctx,"#fce5a3",x-1,y-57,3,2);
  }
  if (member.talking) return;
  if (member.activity==="broom" || member.activity==="sweep") {
    const wave=beat%8;
    const toe=wave<4 ? wave : 7-wave;
    for (let k=0;k<13;k+=1) rect(ctx,"#947653",x+10+Math.floor(k/2)+toe,y-24+k,1,2);
    rect(ctx,"#a48a62",x+15+toe,y-12,7,2);
    if (wave===3 || wave===6) rect(ctx,"#b0a17c80",x+22+toe,y-12,2,1);
  }
  if (member.activity==="crate") {
    crate(ctx,x+13,y-14+(beat%14>11?2:0));
  }
  if (member.activity==="sort") {
    oval(ctx,"#69564b",x+15,y-7,9,4);
    rect(ctx,"#bc9365",x+9,y-9,12,2);
    rect(ctx,"#cf8060",x+12+(beat%5),y-12,3,3);
    rect(ctx,"#ad5f52",x+16,y-14,3,4);
  }
  if (member.activity==="map") {
    rect(ctx,"#886c53",x+7,y-20,14,9);
    rect(ctx,"#b49b72",x+8,y-19,12,7);
    rect(ctx,"#766853",x+14,y-18,1,5);
  }
  if (member.activity==="lantern") {
    oval(ctx,"#e6aa512b",x+13,y-13,14,9);
    rect(ctx,"#523e37",x+10,y-19,7,10);
    rect(ctx,beat%3 ? "#f6c179" : "#ffdfa0",x+11,y-17,5,5);
  }
  if (member.activity==="smith") {
    const [tx,ty]=coordinate(2,21);
    const phase=beat%12;
    const headY=y-(phase<4 ? 26-phase*3 : 14);
    rect(ctx,"#997954",x-17,headY,2,11);
    rect(ctx,"#68747a",x-21,headY-3,9,4);
    if (phase<4) {
      rect(ctx,"#f39454",tx+8+phase*2,ty-22-phase*3,2,2);
      rect(ctx,"#ffe2a0",tx+15-phase*2,ty-21-phase*2,2,1);
    }
  }
  if (member.activity==="bundle") {
    rect(ctx,"#694c55",x+9,y-14,12,11);
    rect(ctx,"#94666a",x+10,y-17,10,7);
    rect(ctx,"#c49a76",x+14,y-16,2,13);
  }
}

const AREA_COLORS = {
  castle: {base:"#34313c", joint:"#24252f", pale:"#56505b", dim:"#34303a", wall:"#393847", cap:"#68606a", void:"#1c202c", dust:"#62504e"},
  bone: {base:"#484143", joint:"#302e39", pale:"#71635c", dim:"#4c4953", wall:"#453e49", cap:"#80716a", void:"#212637", dust:"#937464"},
  gold: {base:"#6c5942", joint:"#493f36", pale:"#8e7350", dim:"#766447", wall:"#695042", cap:"#ac805c", void:"#322e35", dust:"#a78757"},
  green: {base:"#374839", joint:"#26372e", pale:"#54694f", dim:"#3d544a", wall:"#394a42", cap:"#68765b", void:"#202d36", dust:"#7d8954"},
};
function paintArea(ctx,grid,skin,lamps,fixtures,site) {
  const p=AREA_COLORS[skin]||AREA_COLORS.castle;
  rect(ctx,p.void,0,0,WIDTH,HEIGHT);
  for (let row=0;row<ROWS;row++) for (let col=0;col<COLS;col++) {
    const t=grid[row][col], [x,y]=tileTop(col,row), seed=noise(col,row,78);
    ctx.save();ctx.beginPath();ctx.rect(x,y,SIZE,SIZE);ctx.clip();
    if (t==="=" || t==="S" || t==="w") paintTile(ctx,grid,col,row);
    else if (t==="#") {
      rect(ctx,p.joint,x,y,SIZE,SIZE);
      if(skin==="castle") {
        for (let k=0;k<3;k++) for (let n=-1;n<3;n++) {
          const sx=x+n*24+(k%2)*12, sy=y+k*16;
          rect(ctx,p.wall,sx+1,sy+1,23,14);
          rect(ctx,p.cap,sx+2,sy+1,19,2);
          rect(ctx,p.base,sx+3+((seed+k+n)%6),sy+6,15,5);
          rect(ctx,p.dim,sx+4,sy+13,17,1);
        }
      } else if(skin==="green") {
        for(let i=-1;i<4;i++){
          const tint=["#334637","#526047","#3f533b"][((seed>>>2)+i+3)%3];
          shape(ctx,tint,x+i*15,y,[[4,0],[13,0],[8,18],[16,39],[13,48],[1,48],[3,25],[-2,9]]);
          rect(ctx,"#748264",x+i*15+3,y+3+(seed>>>5)%14,2,14+(i+1)%7);
        }
        scatterTile(ctx,x,y,seed,["#507050","#789060","#394d3b","#a1985f"],42,5);
      } else {
        const bone=skin==="bone";
        for(let i=-1;i<3;i++) {
          const sx=x+i*24+(row%2)*8;
          shape(ctx,bone?"#575358":"#806348",sx,y,[[3,6],[18,1],[26,6],[21,20],[25,33],[20,48],[1,48],[0,31],[7,20]]);
          shape(ctx,bone?"#767073":"#9b7957",sx,y,[[3,5],[19,1],[25,6],[11,12],[6,21],[2,18]]);
          rect(ctx,bone?"#45424d":"#6a5145",sx+4,y+29,16,9);
          rect(ctx,bone?"#686873":"#977a59",sx+9,y+21,10,2+(seed+i)%3);
        }
        scatterTile(ctx,x,y,seed,[p.dim,p.pale,p.wall,p.dust],27,5);
      }
      if (WALKABLE.has(grid[row+1]?.[col])) {
        rect(ctx,p.cap,x,y+41,SIZE,3);
        rect(ctx,p.joint,x,y+44,SIZE,4);
      }
    } else if (t==="x" || t==="u") {
      rect(ctx,p.void,x,y,SIZE,SIZE);
      scatterTile(ctx,x,y,seed,[p.joint,p.dim],18);
      for (const [dx,dy,sx,sy,w,h] of [[0,-1,0,0,48,9],[0,1,0,40,48,8],[-1,0,0,0,8,48],[1,0,40,0,8,48]]) {
        if (!WALKABLE.has(grid[row+dy]?.[col+dx])) continue;
        rect(ctx,p.joint,x+sx,y+sy,w,h);rect(ctx,p.dim,x+sx+1,y+sy+1,w-2,h-2);
      }
    } else {
      rect(ctx,t==="s"?p.joint:t==="g"?p.dim:p.base,x,y,SIZE,SIZE);
      if (t==="d") {
        for(let k=0;k<3;k++){
          rect(ctx,p.joint,x,y+k*16+15,SIZE,1);
          rect(ctx,p.joint,x+(k%2)*11+19+seed%5,y+k*16,1,15);
          rect(ctx,p.pale,x+3,y+1+k*16,14+(seed%6),1);
        }
      }
      scatterTile(ctx,x,y,seed,[p.dim,p.pale,p.base,p.dust],t==="d"?17:42);
      if ((t==="g" || t==="s") && seed%3!==1) tuft(ctx,x+14+seed%17,y+25,seed,skin==="gold");
      if (t==="p" && seed%5===1) basalt(ctx,x+8,y+20,12,8,seed);
      if(skin==="gold" && (t==="g" || t==="p") && (col<4||col>7)) {
        if(seed%2===0)for(let j=0;j<5;j++){
          const xx=x+4+(seed+j*23)%38, yy=y+6+((seed>>>12)+j*13)%35;
          shape(ctx,j%2?"#89754d":"#a99154",xx,yy,[[-3,2],[-5,-4],[0,-1],[4,-6],[4,1],[1,4]]);
          rect(ctx,"#c1a16a",xx+2,yy-2,1,3);
        }
        if(t==="g" && seed%4===1)scatterTile(ctx,x,y,seed,["#9b6a4b","#967e51","#b39566"],36,6);
      }
      if(skin==="green" && (t==="g"||t==="p")){
        if(seed%3!==0)for(let j=0;j<4;j++) {
          const xx=x+7+(seed+j*21)%33, yy=y+5+((seed>>>9)+j*11)%37;
          oval(ctx,"#2e453a",xx,yy,9,4);oval(ctx,j%3?"#526e4d":"#667b55",xx-1,yy-2,6,3);
          rect(ctx,j%3?"#8c9b6b":"#caa26f",xx-2,yy-4,2,2);
        }
        if(seed%7===0){rect(ctx,"#6a5942",x+11,y+14,30,3);rect(ctx,"#9b8257",x+16,y+13,19,1);}
      }
    }
    ctx.restore();
  }
  const openings=new Set(["cald","tarka","saddle","nelva","liena"]);
  for (let row=5;row<=23;row++) for(const col of [1,10]) {
    const t=grid[row][col],seed=noise(col,row,73);
    if(!["#","x"].includes(t))continue;
    const [x,y]=coordinate(col,row);
    if(skin==="green"&&seed%3!==2) {
      broadTree(ctx,x+((col===1)?-10:10),y+5,seed%232);
      if(seed%3===0)sapling(ctx,x+((col===1)?12:-12),y+22,seed%289);
    }
    if(skin==="gold"&&openings.has(site) && seed%4===1){
      tuft(ctx,x+5,y+10,seed,true);rocks(ctx,x-9,y+12,1.05);
    }
    if(skin==="bone"&&seed%4===1)rocks(ctx,x-9,y+11,1.5);
  }
  for (const [col,row] of lamps) {
    const [x,y]=coordinate(col,row);goldenFloor(ctx,x,y+6,52,28);lamp(ctx,x,y);
  }
  for (const item of fixtures) fixture(ctx,item,{},0);
}

function fixture(ctx,object,bank,time) {
  const [x,y]=coordinate(object.col,object.row);
  if (object.image) {
    const sprite=bank.stills?.[object.image];
    if (sprite) {
      oval(ctx,"#151523a5",x,y-1,Math.max(6,Math.floor(sprite.naturalWidth/3)),6);
      ctx.drawImage(sprite,x-Math.floor(sprite.naturalWidth/2),y-sprite.naturalHeight);
    }
    return;
  }
  const beam=Math.floor(time/125);
  const wood="#60483e", edge="#a47c55", deep="#261f2a", linen="#caa686";
  if (object.kind==="flag") {
    rect(ctx,deep,x-5,y-78,8,79);rect(ctx,edge,x-3,y-84,3,83);
    const wave=beam%5;
    shape(ctx,"#70363a",x,y-75,[[0,0],[27+wave,1],[24+wave,11],[30+wave,19],[1,20]]);
    shape(ctx,"#9a5551",x,y-73,[[0,0],[25+wave,2],[21+wave,7],[2,7]]);
    rect(ctx,"#dab274",x+9,y-69,13,2);rect(ctx,"#b89460",x+15,y-72,2,9);
    if (object.shown!==false) for(let k=0;k<4;k++) {
      const lift=(beam*5+k*10)%40;
      rect(ctx,k%2?"#d8985f":"#edc284",x+11-lift,y-4+Math.floor(lift/7),3,1);
    }
  } else if (object.kind==="lift" || object.kind==="gate") {
    for (const dx of [-23,19]) {
      rect(ctx,deep,x+dx-1,y-58,8,58);rect(ctx,wood,x+dx,y-55,6,53);
      rect(ctx,edge,x+dx+1,y-54,1,47);
    }
    rect(ctx,wood,x-24,y-55,49,6);rect(ctx,edge,x-25,y-56,50,2);
    if (!object.open) {
      const shake=object.kind==="lift"?(beam%3)-1:0;
      rect(ctx,deep,x-17,y-43+shake,36,38);
      for(let k=0;k<5;k++) rect(ctx,"#736059",x-16+k*7,y-43+shake,4,37);
      for(let k=0;k<5;k++) rect(ctx,"#a89c82",x+1,y-51+k*5,3,k%2?2:4);
    } else rect(ctx,"#8c7355",x-16,y-37,34,3);
  } else if (object.kind==="seat") {
    for(let k=0;k<3;k++){rect(ctx,"#312c3a",x-37+k*6,y-11-k*9,74-k*12,10);
      rect(ctx,"#6a5f69",x-37+k*6,y-12-k*9,74-k*12,2);}
    rect(ctx,deep,x-22,y-71,44,46);
    rect(ctx,"#554358",x-19,y-69,38,44);
    rect(ctx,"#8c6e72",x-18,y-67,35,3);
    rect(ctx,"#825160",x-11,y-63,22,29);
    rect(ctx,"#a17965",x-1,y-58,3,15);
    for(const a of [-26,21]){rect(ctx,"#494351",x+a,y-60,7,36);rect(ctx,"#a68d73",x+a,y-61,7,2);}
  } else if(object.kind==="house") {
    house(ctx,x-45,y,90,object.style??0);
  } else if(object.kind==="market") {
    stall(ctx,x-31,y-29,object.style===1?["#3b5560","#d6bd8a","#83684c","#6a876d"]:["#924c46","#d1a073","#976852","#c38262"]);
    if(object.style===1)barrel(ctx,x+23,y+4);
  } else if(object.kind==="branch" || object.kind==="bough") {
    const sign=object.turn?-1:1;
    for(let i=0;i<13;i++){
      const ox=sign*i*4, oy=-i*6;
      rect(ctx,"#242d2f",x-14+ox,y-5+oy,38,11);
      rect(ctx,"#675b4d",x-13+ox,y-6+oy,28,8);
      rect(ctx,"#968461",x-10+ox,y-6+oy,14,2);
      if(i%2===0)shape(ctx,"#4b644e",x+ox,y+oy,[[-20,3],[-12,-9],[12,-12],[17,-4],[5,5]]);
    }
    if(object.kind==="bough") {
      broadTree(ctx,x+sign*28,y-52,66);
      windsweptPine(ctx,x-sign*18,y-28,98);
    }
  } else if(object.kind==="rubble") {
    for(let k=0;k<4;k++) rocks(ctx,x-17+k*12,y-4-Math.abs(k-2)*4,.7+k%3*.2);
  } else if(object.kind==="cargo") {
    const moved=object.broken ? 29 : 0;
    rect(ctx,deep,x-31,y-6+moved,64,8);
    oval(ctx,deep,x-18,y+moved,10,7);oval(ctx,deep,x+16,y+moved,10,7);
    oval(ctx,"#87674d",x-18,y+moved,7,5);oval(ctx,"#87674d",x+16,y+moved,7,5);
    crate(ctx,x-17,y-10+moved);crate(ctx,x+5,y-10+moved,"#6a5248");
  } else if(object.kind==="mast") {
    const side=object.turn?-1:1;
    for(let k=0;k<22;k++) {
      const xx=x+side*k*2,yy=y-k;
      rect(ctx,k%3?"#3e343e":"#4d3d41",xx-1,yy,13,5);
    }
    rect(ctx,deep,x-4,y-109,9,110);rect(ctx,edge,x-2,y-107,3,104);
    shape(ctx,"#3c2834",x,y-101,[[0,0],[side*49,17],[side*41,59],[0,68]]);
    shape(ctx,object.blue?"#3e6574":"#965747",x+side*2,y-98,[[0,0],[side*44,17],[side*37,55],[0,62]]);
    shape(ctx,"#d6a26b",x+side*4,y-90,[[0,0],[side*30,12],[side*26,16],[0,9]]);
    rect(ctx,"#e4c38e",x-4,y-113,8,4);
  } else if(object.kind==="hint") {
    shape(ctx,object.sky?"#cebb86":"#34303a",x,y,[[-22,-1],[-17,-8],[8,-7],[4,-14],[24,-5],[8,2],[-11,1]]);
    for(let k=0;k<4;k++)rect(ctx,object.sky?"#eee1ad":"#9c8862",x-12+k*7,y-6+k%2,3,1);
  } else if (object.kind==="bone") {
    const end=object.turn?-1:1;
    for(let k=0;k<21;k++){
      const cx=x+end*Math.round(k*k/10), cy=y-k*3;
      rect(ctx,"#4b4148",cx-5,cy-3,11,6);rect(ctx,"#a48d72",cx-4,cy-4,9,6);
      rect(ctx,"#c9b18d",cx-3,cy-4,6,2);
    }
    oval(ctx,"#29253099",x,y,20,5);
  } else if (object.kind==="exit") {
    shape(ctx,"#302f38",x,y,[[-17,-13],[17,-13],[23,0],[-23,0]]);
    rect(ctx,"#77645d",x-14,y-11,28,3);rect(ctx,"#5a4e4c",x-19,y-7,38,3);
    rect(ctx,"#8b6c54",x-16,y-3,32,2);
    rect(ctx,beam%6<3?"#ac835d":"#c5a57d",x-2,y-11,4,3);
  } else if (object.kind==="chest") {
    rect(ctx,deep,x-13,y-17,26,19);
    rect(ctx,wood,x-12,y-15,24,15);rect(ctx,edge,x-12,y-15,23,4);
    rect(ctx,"#382934",x-12,y-8,24,2);rect(ctx,"#d0a462",x-2,y-11,4,6);
    if (object.open) rect(ctx,deep,x-10,y-14,20,6);
  } else if (object.kind==="rope") {
    oval(ctx,deep,x,y-1,13,5);oval(ctx,wood,x,y-3,12,4);
    for(let k=0;k<4;k++) rect(ctx,edge,x-7+k*4,y-5,2,3);
    rect(ctx,linen,x-1,y-15,3,12);
    if (object.active) rect(ctx,beam%4?"#ecd093":"#ffeaba",x-2,y-24,4,4);
  } else if (object.kind==="crown") {
    rect(ctx,"#62606a",x-12,y-5,24,7);rect(ctx,deep,x-14,y-8,28,4);
    shape(ctx,"#d8b679",x,y-9,[[-9,0],[-10,-10],[-5,-7],[0,-12],[5,-7],[9,-11],[8,0]]);
    rect(ctx,"#8f5150",x-1,y-13,3,3);
  } else if(object.kind==="turnSeal") {
    rect(ctx,"#2e3335",x-18,y-14,36,16);rect(ctx,"#8a785f",x-19,y-16,38,4);
    const flip=object.pin===1?1:-1;
    shape(ctx,object.pinType==="leaf"?"#9cbf78":"#8676a7",x,y-16,[[-13,0],[-11,-10],[flip*2,-21],[13,-7],[9,1]]);
    rect(ctx,"#f0ce94",x+flip*6-1,y-27,3,3);
  } else if (object.kind==="seal" || object.kind==="paper") {
    rect(ctx,"#57433d",x-11,y-9,22,10);rect(ctx,edge,x-11,y-10,22,2);
    const item=object.kind==="seal";
    rect(ctx,item?"#8e91a1":"#c0ad88",x-7,y-17,14,9);
    for (let k=0;k<2;k++) rect(ctx,item?"#464652":"#8e7052",x-4,y-14+k*3,8,1);
  } else if (object.kind==="board") {
    rect(ctx,deep,x-3,y-28,5,28);rect(ctx,wood,x-15,y-31,30,17);
    rect(ctx,edge,x-14,y-30,28,2);
    for(let k=0;k<3;k++) rect(ctx,linen,x-10,y-26+k*3,9+k*3,1);
  } else if (object.kind==="fire") {
    oval(ctx,"#d17d382c",x,y,28,11);
    shape(ctx,"#a7583a",x,y,[[0,0],[-9,-4],[-7,-15],[-3,-9],[4,-23+beam%4],[9,-9],[7,-2]]);
    shape(ctx,"#eda45b",x,y,[[0,-1],[-5,-6],[1,-12],[3,-7],[6,-9],[5,-2]]);
  }
}

class Field {
  constructor(mode, bank, scene = {}) {
    this.mode = mode;
    this.bank = bank;
    this.grid = scene.grid || (mode === "town" ? TOWN_GRID : ROAD_GRID);
    this.skin = scene.skin || mode;
    this.gridBounds = FIELD_GRID;
    this.cellProps = scene.grid ? (scene.blocks || []) : mode === "town" ? TOWN_CELL_PROPS : ROAD_CELL_PROPS;
    this.npcs = (scene.npcs || (mode === "town" ? TOWN_NPCS : ROAD_NPCS)).map(npc => ({ ...npc }));
    this.objects = scene.objects || (mode === "town" ? TOWN_OBJECTS : ROAD_OBJECTS);
    this.lamps = scene.lamps || (mode === "town" ? TOWN_LAMPS : ROAD_LAMPS);
    this.trail = scene.trail || [[5,15],[5,16],[5,17],[5,18]];
    this.facings = this.trail.map(()=>3);
    this.renderedParty = [];
    this.route = [];
    this.turnRoute = [];
    this.heldDirection = null;
    this.steps = 0;
    this.time = 0;
    this.animationStart = 0;
    this.lastStepEnd = -Infinity;
    this.moving = null;
    this.indicator = null;
    this.interacting = null;
    this.lastDistant = null;
    this.routeTarget = null;
    this.interaction = null;
    this.approach = null;
    this.approachPlayed = false;
    this.paused = false;
    this.scene = document.createElement("canvas");
    this.scene.width = WIDTH;
    this.scene.height = HEIGHT;
    const ctx = this.scene.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (scene.grid) paintArea(ctx,this.grid,this.skin,this.lamps,scene.fixtures||[],mode);
    else {
      paintGrid(ctx,this.grid);
      if (this.mode === "town") townScenery(ctx,this.grid);
      else roadScenery(ctx,this.grid);
    }
    this.ready = true;
  }

  get party() { return this.trail.map(cell => [...cell]); }

  get position() {
    const [col,row] = this.trail[0];
    return { col,row };
  }

  get partyPositions() { return this.trail.map(([col,row])=>({col,row})); }

  gridCell(col,row) { return this.grid[row]?.[col] ?? null; }

  addTrail(count) {
    if (this.trail.length >= count) return;
    const occupied=this.trail.map(cell=>cell.join(","));
    const choose=(cell,n,path)=> {
      if (!n) return path;
      for (const [dx,dy] of [[0,1],[-1,0],[1,0],[0,-1]]) {
        const point=[cell[0]+dx,cell[1]+dy];
        if (occupied.includes(point.join(",")) || path.some(a=>equal(a,point)) || !this.walkable(...point)) continue;
        const rest=choose(point,n-1,[...path,point]);
        if (rest) return rest;
      }
      return null;
    };
    const tail=choose(this.trail.at(-1),count-this.trail.length,[]);
    if (tail) {this.trail.push(...tail);this.facings.push(...tail.map(()=>3));}
  }

  walkable(col,row) {
    if (row < FIRST_PLAYABLE_ROW || row > LAST_PLAYABLE_ROW) return false;
    const cell=this.gridCell(col,row);
    const bridgeOpen=cell!=="u" || this.liftOpen || this.trail.some(([x,y])=>x===col && (y===10 || y===11));
    return bridgeOpen && WALKABLE.has(cell) &&
      !this.cellProps.some(([x,y])=>x===col && y===row) &&
      !this.npcs.some(npc=>npc.col===col && npc.row===row) &&
      !this.objects.some(object=>!object.walk && object.col===col && object.row===row);
  }

  canStep(trail,next) {
    // The fourth character moves into the third character's former cell at the same time.
    return this.walkable(...next) && !trail.slice(0,-1).some(cell=>equal(cell,next));
  }

  findPath(start,end) {
    if (!this.walkable(...end) || equal(start,end)) return [];
    const currentTrail = this.moving?.to ?? this.trail;
    const distance = ([x,y])=>Math.abs(x-end[0])+Math.abs(y-end[1]);
    const queue = [{ trail:currentTrail, path:[], cost:distance(start) }];
    const seen = new Set([currentTrail.flat().join(",")]);
    while (queue.length) {
      const {trail,path}=queue.shift();
      const [x,y]=trail[0];
      if (equal(trail[0],end)) return path;
      for (const [dx,dy] of DIRECTIONS) {
        const next=[x+dx,y+dy];
        if (!this.canStep(trail,next)) continue;
        const shifted=[next,...trail.slice(0,-1)];
        const key=shifted.flat().join(",");
        if (seen.has(key)) continue;
        seen.add(key);
        const nextPath=[...path,next];
        const cost=nextPath.length+distance(next);
        const node={trail:shifted,path:nextPath,cost};
        const later=queue.findIndex(entry=>entry.cost>cost);
        if (later<0) queue.push(node);
        else queue.splice(later,0,node);
      }
    }
    return [];
  }

  cancelRoute() {
    this.route=[];
    this.turnRoute=[];
    this.routeTarget=null;
    this.indicator=null;
    this.lastDistant=null;
  }

  setPaused(paused) {
    this.paused=paused;
    if (!paused) return;
    this.heldDirection=null;
    this.cancelRoute();
  }

  setDirection(dx,dy) {
    if (!dx && !dy) {
      this.heldDirection=null;
      this.turnRoute=[];
      return;
    }
    if (this.paused || this.approach || this.interaction) return;
    const next=Math.abs(dx)>Math.abs(dy) ? [Math.sign(dx),0] : [0,Math.sign(dy)];
    if (this.heldDirection && equal(this.heldDirection,next)) return;
    this.cancelRoute();
    this.interacting=null;
    this.heldDirection=next;
  }

  takeInteraction() {
    const request=this.interaction;
    this.interaction=null;
    return request;
  }

  beginConversation(target,source) {
    const [col,row]=this.trail[0];
    this.heldDirection=null;
    this.cancelRoute();
    this.facings[0]=direction([col,row],[target.col,target.row]);
    this.interacting={npc:target,since:this.time};
    return {label:target.label,line:target.pages[0],pages:target.pages,choices:target.choices,source,sheet:target.sheet,icon:target.icon,instant:target.instant,onEnd:target.onEnd,onSelect:target.onSelect};
  }

  tap(x,y,time=this.time) {
    if (this.paused || this.approach || this.interaction || x<LEFT || x>=LEFT+COLS*SIZE || y<120 || y>=TOP+(LAST_PLAYABLE_ROW+1)*SIZE) return null;
    const destination=tileAt(x,y);
    const clickedPerson=this.npcs.find(npc=>{
      const [cx,feet]=coordinate(npc.col,npc.row);
      return inBox(x-cx,y-feet,[-19,-50,20,8]);
    });
    const clicked=clickedPerson ?? this.objects.find(object=>{
      const [cx,feet]=coordinate(object.col,object.row);
      const asset=object.image&&this.bank.stills[object.image];
      const box=asset?[-Math.ceil(asset.naturalWidth/2),-asset.naturalHeight,Math.ceil(asset.naturalWidth/2),10]:object.bounds;
      return inBox(x-cx,y-feet,box);
    });
    const origin=this.moving?.to[0] ?? this.trail[0];
    const target=clicked ? [clicked.col,clicked.row] : destination;
    const distance=Math.abs(target[0]-origin[0])+Math.abs(target[1]-origin[1]);
    if (clicked && distance===1 && !this.moving) return this.beginConversation(clicked,"tap");
    const choices=clicked ? DIRECTIONS.map(([dx,dy])=>[target[0]+dx,target[1]+dy]) : [target];
    let path=[];
    for (const end of choices) {
      const candidate=this.findPath(origin,end);
      if (candidate.length && (!path.length || candidate.length<path.length)) path=candidate;
    }
    if (!path.length) {
      this.lastDistant=null;
      return null;
    }
    if (distance>1) {
      const last = this.lastDistant;
      const nearbyGround = last && !clicked && !last.object &&
        Math.abs(last.target[0] - target[0]) <= 1 && Math.abs(last.target[1] - target[1]) <= 1;
      const repeated = last && (equal(last.target,target) || nearbyGround) && time-last.at<320;
      if (!repeated) {
        this.lastDistant={target,at:time,object:!!clicked};
        this.indicator={destination:path.at(-1),since:time,preview:true};
        return null;
      }
    }
    this.lastDistant=null;
    this.heldDirection=null;
    this.turnRoute=[];
    this.route=path;
    this.routeTarget=clicked;
    this.interacting=null;
    this.indicator={destination:path.at(-1),since:time,preview:false};
    return null;
  }

  key(key) {
    const facing=["ArrowDown","ArrowLeft","ArrowRight","ArrowUp"].indexOf(key);
    if (facing>=0) this.step(...DIRECTIONS[facing]);
  }

  step(dx,dy) {
    if (this.paused || this.approach || this.interaction || Math.abs(dx)+Math.abs(dy)!==1) return;
    const [col,row]=this.moving?.to[0] ?? this.trail[0];
    const next=[col+dx,row+dy];
    if (!this.walkable(...next)) {
      if (!this.moving) this.facings[0]=direction([col,row],next);
      return;
    }
    this.cancelRoute();
    this.heldDirection=null;
    this.interacting=null;
    this.route=this.findPath([col,row],next);
  }

  startApproach() {
    if (this.approach || this.routeTarget) return;
    const npc=this.npcs.find(person=>person.approach && !person.approached &&
      (person.approach===true ? equal(this.trail[0],[5,14]) : person.approach(this.trail[0])));
    if (npc) this.call(npc);
  }

  call(npc) {
    const start=[npc.col,npc.row];
    const queue=[{cell:start,path:[]}];
    const visited=new Set([start.join(",")]);
    let remaining=[];
    for (let index=0; index<queue.length; index+=1) {
      const {cell,path}=queue[index];
      if (neighbors(cell,this.trail[0])) {
        remaining=path;
        break;
      }
      for (const [dx,dy] of DIRECTIONS) {
        const next=[cell[0]+dx,cell[1]+dy];
        const key=next.join(",");
        if (visited.has(key) || !this.walkable(...next) || this.trail.some(cell=>equal(cell,next))) continue;
        visited.add(key);
        queue.push({cell:next,path:[...path,next]});
      }
    }
    if (!remaining.length && !neighbors(start,this.trail[0])) return false;
    npc.approached=true;
    this.cancelRoute();
    this.heldDirection=null;
    this.approach={npc,remaining,readyAt:this.time+135,moving:null};
    return true;
  }

  advanceApproach() {
    const approach=this.approach;
    const {npc}=approach;
    if (approach.moving && this.time>=approach.moving.start+STEP_MS) {
      [npc.col,npc.row]=approach.moving.to;
      approach.moving=null;
    }
    if (approach.moving || this.time<approach.readyAt) return;
    const to=approach.remaining.shift();
    if (to) {
      npc.facing=direction([npc.col,npc.row],to);
      approach.moving={to,start:this.time};
      return;
    }
    this.approach=null;
    this.interaction=this.beginConversation(npc,"approach");
  }

  update(time) {
    this.time=time;
    if(this.mode==="canopy") {
      const held=this.trail.some(([x,y])=>(x===5||x===6)&&(y===10||y===11)) ||
        this.moving?.to.some(([x,y])=>(x===5||x===6)&&(y===10||y===11));
      this.liftOpen=Boolean(held)||time%3300>=1840;
    }
    if (this.paused) return;
    if (this.moving && time>=this.moving.start+STEP_MS) {
      this.trail=this.moving.to;
      this.steps+=1;
      this.moving=null;
      this.lastStepEnd=time;
      this.startApproach();
    }
    if (this.approach) {
      this.advanceApproach();
      return;
    }
    if (this.moving || this.interaction) return;
    if (this.routeTarget && !this.route.length) {
      const target=this.routeTarget;
      this.cancelRoute();
      if (neighbors(this.trail[0],[target.col,target.row])) this.interaction=this.beginConversation(target,"route");
      return;
    }
    let next=this.route.shift();
    if (this.heldDirection) {
      const [col,row]=this.trail[0];
      const wanted=[col+this.heldDirection[0],row+this.heldDirection[1]];
      if (!this.turnRoute.length && this.walkable(...wanted) && !this.canStep(this.trail,wanted)) {
        this.turnRoute=this.findPath(this.trail[0],wanted);
      }
      next=this.turnRoute.shift() ?? wanted;
      if (!this.canStep(this.trail,next)) {
        this.facings[0]=direction(this.trail[0],wanted);
        return;
      }
    }
    if (!next) return;
    if (!this.canStep(this.trail,next)) {
      this.cancelRoute();
      return;
    }
    if (time-this.lastStepEnd>=60) this.animationStart=time;
    const to=[next,...this.trail.slice(0,-1)];
    this.facings=to.map((cell,index)=>direction(this.trail[index],cell));
    this.moving={to,start:time};
  }

  draw(ctx,time=0) {
    this.update(time);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(this.scene,0,0);
    this.sceneryMotion(ctx,time);
    for (const object of this.objects) {
      if (object.kind || object.image) fixture(ctx,object,this.bank,time);
    }
    this.drawPeople(ctx,time);
    this.drawIndicator(ctx,time);
  }

  advance(time) { this.update(time); }

  sceneryMotion(ctx,time) {
    const beat=Math.floor(time/100);
    for (const [col,row] of this.lamps) {
      const [x,y]=coordinate(col,row);
      const tone=beat%6<2 ? "#ffe6a1" : "#ffd283";
      rect(ctx,tone,x-1,y-29,3,3);
      if (beat%7===2) rect(ctx,"#b4825538",x+5,y-29,4,2);
    }
    if(this.mode==="canopy")for(const x of [5,6])for(const y of [10,11]) {
      const [a,b]=tileTop(x,y);
      if(this.liftOpen)deckTile(ctx,a,b,y,this.grid,x);
      else {
        rect(ctx,"#465a43",a+19,b+13,8,4);
        rect(ctx,beat%33>=12?"#c6b479":"#887951",a+21,b+13,3,3);
      }
    }
    if (this.mode==="town") {
      const [forgeX,forgeY]=coordinate(3,18);
      for (let i=0;i<5;i+=1) {
        const phase=(beat+i*4)%19;
        const x=forgeX-4+(phase%3)+Math.floor(phase/3);
        const y=forgeY-31-phase*2;
        rect(ctx,phase<6 ? "#83807c64" : "#71858c46",x,y,2+Math.floor(phase/4),2);
        if (phase<8) rect(ctx,"#927a7188",x+2,y+1,3,1);
      }
      return;
    }
    for (let row=0;row<ROWS;row+=1) {
      const water=[];
      for (let col=0;col<COLS;col+=1) if (this.gridCell(col,row)==="w") water.push(col);
      if (!water.length) continue;
      const seed=noise(row,37,23);
      const col=water[(seed+Math.floor(beat/5))%water.length];
      const [left,top]=tileTop(col,row);
      const x=left+5+((seed>>>11)+beat)%(SIZE-17);
      const y=top+4+(seed+beat*3)%(SIZE-10);
      rect(ctx,"#7ca5a268",x,y,6+seed%5,1);
      if (seed%3===1) rect(ctx,"#9aada27c",x+2,y,3,1);
    }
  }

  drawPeople(ctx,time) {
    const cast=this.npcs.map(npc=>{
      let [x,y]=coordinate(npc.col,npc.row);
      const talking=this.interacting?.npc===npc && (this.paused || time-this.interacting.since<2500);
      const facing=talking ? direction([npc.col,npc.row],this.trail[0]) : npc.facing;
      const movement=this.approach?.npc===npc ? this.approach.moving : null;
      let col=STAND;
      if (movement) {
        const [tx,ty]=coordinate(...movement.to);
        const amount=Math.min(1,(time-movement.start)/STEP_MS);
        x=lerp(x,tx,amount);
        y=lerp(y,ty,amount);
        col=stepColumn(time-this.approach.readyAt);
      }
      return {x,y,facing,col,sheet:this.bank.npcs?.[npc.sheet],activity:npc.activity,talking,notice:this.approach?.npc===npc && !movement};
    });
    const amount=this.moving ? Math.min(1,(time-this.moving.start)/STEP_MS) : 0;
    const party=this.trail.map((cell,index)=>{
      const [sx,sy]=coordinate(...cell);
      const [tx,ty]=this.moving ? coordinate(...this.moving.to[index]) : [sx,sy];
      const x=Math.round(lerp(sx,tx,amount));
      const y=Math.round(lerp(sy,ty,amount));
      const col=this.moving ? stepColumn(time-this.animationStart+index*250) : STAND;
      return {x,y,facing:this.facings[index],col,sheet:this.bank.people?.[index],index};
    });
    this.renderedParty=party.map(({x,y,index})=>({x,y,index}));
    cast.push(...party);
    cast.sort((a,b)=>a.y-b.y || (b.index??9)-(a.index??9));
    for (const member of cast) {
      if (!member.sheet) continue;
      const x=Math.round(member.x);
      const y=Math.round(member.y);
      oval(ctx,"#151f29a6",x+1,y-2,12,4);
      bankSprite(ctx,member.sheet,member.col,member.facing,x,y);
      drawActivity(ctx,member,x,y,time);
    }
  }

  drawIndicator(ctx, time) {
    if (!this.indicator || time - this.indicator.since > 830) return;
    const [x, feet] = coordinate(...this.indicator.destination);
    const y = feet - 9;
    if (this.indicator.preview) {
      rect(ctx, "#f2c786ae", x - 5, y + 2, 2, 5);
      rect(ctx, "#f2c786ae", x + 2, y - 2, 2, 5);
      return;
    }
    const tint = time - this.indicator.since > 450 ? "#eac5955e" : "#eac595ba";
    for (const [dx, dy, sx, sy] of [[-11,-9,1,1],[10,-9,-1,1],[-11,8,1,-1],[10,8,-1,-1]]) {
      rect(ctx, tint, x + dx, y + dy, sx * 5, 1);
      rect(ctx, tint, x + dx, y + dy, 1, sy * 4);
    }
  }
}

Object.assign(window,{Field,FIELD_GRID,FIELD_COORD:coordinate});
})();
