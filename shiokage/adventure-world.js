import { bossData, monsterTraits, outsideData, townData } from './adventure-world-data.js';

const dimensions = {
  T01: [70, 73], T02: [76, 83], T03: [75, 77], T04: [68, 75], T05: [82, 75],
  T06: [70, 80], T07: [68, 72], T08: [70, 76], T09: [69, 72], T10: [70, 77],
  T11: [75, 76], T12: [72, 77], T13: [77, 81], T14: [74, 82], T15: [77, 76],
  T16: [83, 83], T17: [77, 72], T18: [73, 91], T19: [74, 93], T20: [76, 94]
};
const townStyles = [
  ['port','saltShed','stone','port'], ['moor','saltShed','sand','dune'], ['port','stiltHouse','marsh','marsh'],
  ['port','tidalGate','wood','harbor'], ['moor','arcade','meadow','wax'], ['shrine','ruin','stone','gate'],
  ['moor','stiltHouse','meadow','terrace'], ['shrine','arcade','stone','ravine'], ['cave','ruin','slate','rock'],
  ['ember','kiln','ash','kiln'], ['port','stiltHouse','wood','boats'], ['moor','arcade','wood','ridge'],
  ['port','lighthouse','slate','black-coast'], ['ember','tower','ash','iron'], ['port','lighthouse','wood','headland'],
  ['port','arcade','wood','shipyard'], ['ember','kiln','ash','forge'], ['shrine','tidalGate','stone','locks'],
  ['moor','saltShed','meadow','bluff'], ['shrine','arcade','stone','city']
];
const localSprites = [1,2,3,5,9,12,17,20,22,29,30,34,43,47,51,52,56,63,64,68,69,71,72,73,74,76,78,79,82,83,86,87,88,90,91,92,97,99,100,101,102,105,107,108,109,112,113,115,116,118,119,120,121,122,123];
const terrainStyles = {
  '帯状地': { profile:'ridge', wall:'cliff', radius:112 },
  '水際': { profile:'water', wall:'water', radius:96 },
  '折れ棚': { profile:'bend', wall:'cliff', radius:104 },
  '平棚': { profile:'shelf', wall:'cliff', radius:115 },
  '昇降地': { profile:'rise', wall:'cliff', radius:105 },
  '中庭': { profile:'court', wall:'cliff', radius:110 }
};
// Match the atlas's walkable-area budgets while keeping the approaches and retreat paths independent.
const roomWidth = {
  R01:3.064,R02:2.327,R03:2.69,R04:2.845,R05:2.671,R06:2.516,R07:2.402,R08:2.337,R09:2.666,R10:2.407,R11:2.292,R12:2.422,
  R13:2.974,R14:3.706,R15:2.143,R16:2.237,R17:2.551,R18:2.511,R19:2.128,R20:2.855,R21:2.242,R22:2.302,R23:2.935,R24:2.551,
  R25:2.402,R26:2.302,R27:3.233,R28:2.436,R29:2.153,R30:2.626,R31:2.431,R32:2.685,R33:2.865,R34:2.94,R35:2.79,R36:2.402,
  R37:2.476,R38:2.471,R39:2.456,R40:2.661,R41:2.417,R42:2.611,R43:2.621,R44:2.267,R45:2.785,R46:2.332,R47:2.685,R48:2.631,
  R49:2.84,R50:2.382,R51:2.471,R52:2.616,R53:2.481,R54:2.601,R55:2.138,R56:2.77,R57:2.267,R58:2.83,R59:2.511,R60:2.476,
  R61:2.651,R62:3.004,R63:3.547,R64:2.377,
  D01:2.422,D02:2.182,D03:2.412,D04:2.441,D05:2.451,D06:2.825,D07:2.063,D08:2.531,D09:2.098,D10:2.516,D11:2.093,D12:2.705,
  D13:2.78,D14:2.556,D15:2.207,D16:2.277,D17:2.397,D18:2.307,D19:1.914,D20:2.875,D21:2.516,D22:2.427,D23:2.317,D24:2.402,
  D25:2.566,D26:2.685,D27:2.163,D28:2.347,D29:2.302,D30:2.262,D31:2.148,D32:2.441
};
const regionalPalettes = { A:'port', B:'moor', C:'shrine', D:'ember', E:'port', F:'cave', G:'frost' };
const regionalGround = { A:'sand', B:'meadow', C:'slate', D:'ash', E:'slate', F:'stone', G:'stone' };
const candidatePoint = (x,y) => ({x:Math.round(x),y:Math.round(y)});
const pad = n => String(n).padStart(2,'0');
const manhattan = (a,b) => Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
const cardinals = [[1,0],[-1,0],[0,1],[0,-1]];
const solid = c => !c||c==='#'||c==='~';
const terrainAt = (grid,x,y) => grid[y]?.[x];

export const adventureBosses = Object.fromEntries(bossData.map(row => {
  const [id,title,monsterId,site,level,category,arena,attributes,shield,weaknesses,tell,response,gear,condition] = row;
  const number = Number(id.slice(1));
  return [id, {id,title,monsterId,site,level,category,arena,attributes,shield,weaknesses,tell,response,gear,condition,
    chapter:number<=12?number:null,postgame:category.includes('結末後')}];
}));

const outsideById = new Map(outsideData.map(row => [row[0],row]));
export const adventureRoute = Object.values(adventureBosses).slice(0,12).map(boss => {
  const dungeon = outsideById.get(boss.site);
  const road = outsideById.get(dungeon[3]);
  return { chapter:boss.chapter, town:road[3], road:road[0], site:boss.site, boss:boss.id, level:boss.level };
});

function cellOf(point) {
  if (!point) return null;
  const [row,col] = point.split('-');
  return [/\d/.test(col)?Number(col)-1:col.charCodeAt(0)-56,row.charCodeAt(0)-65];
}

function nearestFloor(grid,point) {
  if (!point) return null;
  if (!solid(terrainAt(grid,...point))) return point;
  return grid.flatMap((row,y)=>row.map((cell,x) => solid(cell)?null:[x,y]).filter(Boolean))
    .sort((a,b)=>manhattan(a,point)-manhattan(b,point))[0];
}

function reachableCells(grid,origin) {
  const key = (x,y)=>x+','+y;
  const seen = new Set([key(...origin)]), queue = [origin];
  for (let k=0;k<queue.length;k++) {
    const [x,y] = queue[k];
    for (const [dx,dy] of cardinals) {
      const a=x+dx,b=y+dy;
      if (seen.has(key(a,b))||solid(terrainAt(grid,a,b))) continue;
      seen.add(key(a,b));
      queue.push([a,b]);
    }
  }
  return queue;
}

function joinTownGrid(grid, origin, targets) {
  let reaching = reachableCells(grid,origin);
  for (const target of targets) {
    if (reaching.some(cell=>manhattan(cell,target)===0)) continue;
    const [sx,sy] = [...reaching].sort((a,b)=>manhattan(a,target)-manhattan(b,target))[0];
    let [x,y] = target;
    while (x!==sx || y!==sy) {
      if (solid(terrainAt(grid,x,y))) grid[y][x]=terrainAt(grid,x,y)==='~'?'-':'=';
      if (x!==sx && grid[y][x+Math.sign(sx-x)]!==undefined) x+=Math.sign(sx-x);
      else y+=Math.sign(sy-y);
    }
    reaching = reachableCells(grid,origin);
  }
}

function pointOnTown(scene,c,dx=0,dy=0) {
  const [cw,ch] = scene.field.cell;
  const [left,top] = scene.field.offset;
  return candidatePoint(left+(c[0]+.5)*cw+dx,top+(c[1]+.5)*ch+dy);
}

function townScene(row,index) {
  const [id,name,rawTiles,props,residents,mouths,heroPoint] = row;
  const [cw,ch] = dimensions[id];
  const [palette,landmark,ground,identity] = townStyles[index];
  const size = Math.max(...rawTiles.map(row=>row.length));
  const tiles = rawTiles.map(row=>[...row.padEnd(size,'#')]);
  const mouthsByRoad = new Map();
  const initial = id==='T01'?[4,5]:nearestFloor(tiles,cellOf(heroPoint));
  const dominant = initial??nearestFloor(tiles,[Math.floor(size/2),Math.floor(tiles.length/2)]);
  if (solid(terrainAt(tiles,...dominant))) tiles[dominant[1]][dominant[0]]='.';
  const join = [...mouths.map(e=>cellOf(e[1])),...props.map(prop=>nearestFloor(tiles,cellOf(prop[2]))),
    ...residents.flatMap(resident=>[nearestFloor(tiles,cellOf(resident[4])),nearestFloor(tiles,cellOf(resident[5]))]).filter(Boolean)];
  joinTownGrid(tiles,dominant,join);
  const padding = 42;
  const scene = { id,name,palette,kind:'town',seed:197+index*31,width:size*cw+2*padding,height:tiles.length*ch+2*padding,
    scatter:0,props:[],objects:[],people:[],exits:[],adventure:true,
    field:{type:'town',tiles:tiles.map(row=>row.join('')),ground,wall:'cliff',cell:[cw,ch],offset:[padding,padding]} };
  scene.entry = pointOnTown(scene,dominant);
  for (const [key,label,coord,physical,text] of props) {
    const point = pointOnTown(scene,nearestFloor(tiles,cellOf(coord)));
    scene.objects.push({ id:id+'-'+key,kind:'adventure-inspect',label,physical,text,...point });
    if (key==='A'||key==='D') {
      const shop=key==='A';
      const sign = candidatePoint(point.x+(shop?24:-23),point.y+22);
      scene.objects.push({ id:id+(shop?'-shop':'-inn'),kind:'sign',label:shop?'店':'宿・休憩所',
        physical:shop?'market':'inn',shop,inn:!shop,text:shop?'街道へ出る前に、道具を見ていくといい。':'ここなら安心して眠れるよ。',...sign });
    }
  }
  for (const [i,p] of residents.entries()) {
    const [roleId,localName,sprite,role,day,night,text] = p;
    const center = nearestFloor(tiles,cellOf(day));
    if (!center) continue;
    const nCenter = nearestFloor(tiles,cellOf(night))??center;
    const occupied = scene.people.filter(other=>other.cell===center.join(',')).length;
    const shiftX = occupied===0?0:occupied%2===1?20:-20;
    const shiftY = occupied===0?0:-17;
    const position = pointOnTown(scene,center,shiftX,shiftY);
    const late = pointOnTown(scene,nCenter,shiftX,shiftY);
    const character = { ...position,nightPosition:late,face:[0,1,2,0][i%4],cell:center.join(','),name:localName,role };
    if (roleId.startsWith('P')&&sprite) scene.people.push({...character,id:sprite,adventureCompanion:roleId});
    else scene.people.push({...character,id:roleId,sprite:localSprites[(index*8+i)%localSprites.length],adventureResident:true,
      text:text??localShortLine(identity,i),name:roleId[0]==='L'?localRoleName(role):localName});
  }
  if(id==='T01'){
    const day=pointOnTown(scene,[2,4],0,8),night=pointOnTown(scene,[2,3],17,9);
    scene.people.push({id:35,name:'エナ',role:'港の護衛',adventureCompanion:'P61',postgame:true,
      cell:'2,4',...day,nightPosition:night,face:0});
  }
  for (const [road,coord,label] of mouths) {
    const c=cellOf(coord);
    const point=pointOnTown(scene,c);
    const neighbour=cardinals.map(([dx,dy])=>[c[0]+dx,c[1]+dy])
      .find(next=>!solid(terrainAt(tiles,...next))&&manhattan(next,dominant)<manhattan(c,dominant));
    const retreat=neighbour?pointOnTown(scene,neighbour):candidatePoint(point.x+30,point.y+16);
    const gate={point,retreat,label};
    mouthsByRoad.set(road,[...(mouthsByRoad.get(road)??[]),gate]);
  }
  addTownBuildings(scene,tiles,landmark,index);
  addWorkplaces(scene,tiles,index);
  addTownConsequences(scene,tiles);
  scene.mouths=mouthsByRoad;
  return scene;
}

const coastFires = { T01:'H-8',T04:'E-9',T06:'G-9',T10:'H-9',T14:'G-B',T18:'E-E' };

function addTownConsequences(scene,tiles) {
  const coordinate=coastFires[scene.id];
  if(!coordinate) return;
  const position=pointOnTown(scene,nearestFloor(tiles,cellOf(coordinate)),28,-26);
  const home=scene.id==='T01';
  const branches=home?
    [{endings:['E3'],art:'beacon'},{endings:['E2'],art:'hearth'}]:
    [{endings:['E1','E3'],art:'coldHearth'}];
  const inn=scene.objects.find(object=>object.inn);
  scene.field.scenery.push({...position,physical:home?'coldHearth':'hearth',appearance:branches},
    {...candidatePoint(inn.x+34,inn.y-36),physical:null,appearance:[{endings:home?['E1']:['E1','E3'],art:'refuge'}]});
  if(home) scene.field.scenery.push({...candidatePoint(position.x+62,position.y+69),physical:null,
    appearance:[{endings:['E3'],art:'anchored'}]});
}

function addWorkplaces(scene,tiles,index) {
  const scenery=[];
  const market=scene.objects.find(object=>object.shop);
  const shop=scene.objects.find(object=>object.id===scene.id+'-A');
  if(market&&shop) {
    const beside=candidatePoint(shop.x-23,shop.y-25);
    scenery.push({...beside,physical:'stall',variant:index%4});
  }
  for(const resident of scene.people) {
    if(scenery.length>=5) break;
    const role=resident.role;
    let type=null;
    if(/漁|舟|船|桟橋|係留/.test(role)) type='boat';
    else if(/薬|布|石|細工|職人|鍛|工房|炊|灯/.test(role)) type='bench';
    if(!type) continue;
    const [x,y]=resident.cell.split(',').map(Number);
    const nearby=cardinals.map(([dx,dy])=>[x+dx,y+dy]).find(point=> {
      const cell=terrainAt(tiles,...point);
      return cell==='~'&&type==='boat'||['.','-'].includes(cell);
    });
    if(!nearby) continue;
    const spot=pointOnTown(scene,nearby,0,-9);
    const existing=[...scenery,...scene.objects,...scene.people].some(object=>dist(spot,object)<45);
    if(!existing) scenery.push({...spot,physical:type});
  }
  scene.field.scenery=scenery;
}

function localShortLine(identity,index) {
  const lines = {
    port:'縄をたぐる前に、足を桟橋へ乗せて。', dune:'風の弱い間に、靴の砂を落としておいで。',
    marsh:'葦が鳴ったら、しっかりした板の方へ戻って。', harbor:'下の桟橋が揺れても、上の段は歩けるよ。',
    wax:'灯を低くしてね。軒に干した紙がよく燃えるから。', gate:'門の向こうが白く見えたら、階段まで下がって。',
    terrace:'上の畦を回れば、水車を止めずに渡れるよ。', ravine:'橋の下から人の声がしたら、先に返事をして。',
    rock:'石をけると、下にいる人に当たる。足元を見てね。', kiln:'窯が鳴りやんだら、冷えた敷石を渡れるよ。',
    boats:'舟を降りる時は縄をつかんで。板はまだ濡れてる。', ridge:'突風が来たら、荷を置いて柱の横に立つんだ。',
    'black-coast':'岩の端が白くなるところまで、波が上がってくるよ。', iron:'鐘は一度で聞こえるよ。返事を消さないためにね。',
    headland:'舟の陰なら風を避けられるよ。寒ければおいで。', shipyard:'歩くなら削り台の外側を。重い板が通るから。',
    forge:'釘を冷ましてる。手を離しても、まだ触らないで。', locks:'低い戸が閉じたら、石の橋へ上がりな。',
    bluff:'浜まで下りず、ここから声を掛けてみて。', city:'大きな橋が揺れた時も、内側の小橋は使えるよ。'
  };
  return index%2?lines[identity]:'道具は端に寄せたよ。重い荷はそこで休ませて。';
}

function localRoleName(role) {
  const names=['漁師','火番','かご屋','灯番','職人','革屋','舟守','橋番','見張り','薬師','地図屋','船員','宿守','門番','飛脚'];
  return names.find(name=>role.includes(name))??role;
}

function addTownBuildings(scene,tiles,landmark,index) {
  const nearLand = tiles.flatMap((row,y)=>row.map((cell,x)=>[cell,x,y]))
    .filter(([cell,x,y])=>cell==='#' && cardinals.some(([dx,dy])=>!solid(terrainAt(tiles,x+dx,y+dy))));
  const shop=scene.objects.find(o=>o.shop), inn=scene.objects.find(o=>o.inn);
  const used=[];
  for(const [n,target] of [shop,inn,scene.entry].entries()) {
    const available = nearLand.filter(([,x,y])=>!used.some(pair=>manhattan(pair,[x,y])<2));
    const closest = available.sort((a,b)=>{
      const p=pointOnTown(scene,a.slice(1)),q=pointOnTown(scene,b.slice(1));
      return Math.hypot(p.x-target.x,p.y-target.y)-Math.hypot(q.x-target.x,q.y-target.y);
    })[0];
    if (!closest) continue;
    const [,x,y]=closest;
    const p=pointOnTown(scene,[x,y]);
    used.push([x,y]);
    scene.props.push([n===0?landmark:n===1?'house':index%2?'tower':'house',p.x,p.y,.61+n*.08,index%3]);
  }
  for (const [,x,y] of nearLand) {
    if (used.some(pair=>manhattan(pair,[x,y])<2)||((x*11+y*7+index)%8)>2) continue;
    used.push([x,y]);
    const p=pointOnTown(scene,[x,y]);
    scene.props.push([(x+y+index)%3===0?'house':index%3?'tree':'pine',p.x,p.y,.53+(x%3)*.06,(x+y)%3]);
  }
  for(const [y,row] of tiles.entries()) {
    for(const [x,cell] of row.entries()) {
      if (cell!=='.'||((x*13+y*17+index)%13!==3)) continue;
      const p=pointOnTown(scene,[x,y],24,-18);
      const close=[...scene.objects,...scene.people].some(o=>Math.hypot(o.x-p.x,o.y-p.y)<35);
      if(!close) scene.props.push([index<5?'tuft':index%3===0?'crate':'rock',p.x,p.y,.64,index%4]);
    }
  }
}

const shapes = {
  ridge:[[0,.64],[.20,.57],[.40,.61],[.62,.40],[.81,.43],[1,.35]],
  water:[[0,.72],[.20,.70],[.38,.54],[.57,.57],[.75,.39],[1,.36]],
  bend:[[0,.76],[.18,.66],[.32,.40],[.50,.57],[.66,.39],[.81,.55],[1,.38]],
  shelf:[[0,.62],[.19,.68],[.36,.50],[.57,.48],[.80,.51],[1,.34]],
  rise:[[0,.77],[.20,.70],[.36,.56],[.56,.60],[.72,.41],[1,.27]],
  court:[[0,.72],[.17,.69],[.33,.51],[.56,.52],[.81,.30],[1,.28]]
};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const offsetFrom = (a,b,distance) => {
  const span=dist(a,b)||1;
  return candidatePoint(a.x+(b.x-a.x)*distance/span,a.y+(b.y-a.y)*distance/span);
};
const mainApproach = new Set(adventureRoute.map(route=>route.road));
const concealedPaths = {
  B43:['焦げ跡のそばの枝','引きずられた枝の先に穴がある。火の回らなかった湿った石から中を見られる。','boulder'],
  B44:['岩棚に増えた穴','丸い穴の下から土が上がってくる。静かな岩棚の方にも足跡が続く。','boulder'],
  B45:['霧の上の石縁','霧が上がった時だけ岩の縁が見える。乾いた高い方へ延びている。','boulder'],
  B46:['削れた蝋の台','昨夜は丸かった蝋の端が欠けている。羽音が止まると奥の巣が見えた。','bench'],
  B47:['岩の手前の足跡','雪の足跡が岩の前で急に戻っている。高い棚から下の音を待てる。','boulder'],
  B48:['泡が並ぶ水際','波に逆らって泡が並ぶ。奥で重い甲羅が向きを変えた。','basin'],
  B49:['屋根へ続く爪跡','小さな鳥の影の外に、もう一つ大きな爪跡がある。屋根の先へ続いている。','tackle'],
  B50:['光を返す窓','日の入らない窓が光を返す。角度を変えると、北へ回れる隙間が見えた。','board'],
  B51:['雨粒がそれる石段','足音は一つなのに、雨は二つの場所からはじかれている。奥に広い床がある。','boulder'],
  B52:['岸の外の足跡','海へ向いた岩に新しい爪跡がある。二つの岸から見えた影は、ここまで来ていた。','boulder']
};

function routePoints(width,height,length,style,seed,vertical) {
  const points=shapes[style];
  const reversed=seed%3===0;
  const major=vertical?height:width,minor=vertical?width:height;
  const span=Math.min(major-.25*major,length*.90);
  const margin=(major-span)/2;
  const displacement=Math.min(minor*.55,length*.34);
  return points.map(([progress,cross],index)=>{
    const main=margin+(reversed?1-progress:progress)*span;
    const across=minor*.5+(cross-.5)*displacement+Math.sin(index*2+seed)*Math.min(47,minor*.02);
    return vertical?candidatePoint(across,main):candidatePoint(main,across);
  });
}

function scenicKinds(id,terrain,palette) {
  if (terrain==='water') return ['reeds','bollard','rock','supplies'];
  if (palette==='ember') return ['rock','furnaceCrate','kiln','rock'];
  if (id.startsWith('D')) return ['rock','ruin','crystal','supplies'];
  if (terrain==='rise'||palette==='frost') return ['rock','pine','tuft','ruin'];
  return ['tree','rock','tuft','crate'];
}

function outsideScene(row) {
  const [id,name,region,,,gate,action,level,width,height,plannedArea,length,mapStyle,markers,packs,bosses] = row;
  const [a] = region;
  const s = Number(id.slice(1)), dungeon = id[0]==='D';
  const style=terrainStyles[mapStyle]??terrainStyles['平棚'];
  const palette=regionalPalettes[a];
  const route=routePoints(width,height,length,style.profile,s+(dungeon?17:0),height>width*1.06||s%7===0);
  const branches=[],rooms=[];
  const baseRoom=Math.min(width,height)*(dungeon?.13:.12);
  route.forEach((point,index)=>{
    const radius=baseRoom*(.8+((s+index*4)%7)*.08);
    const r = [point.x,point.y,radius*(style.profile==='shelf'?1.29:1),radius*(style.profile==='rise'?1.23:.86)];
    if (index!==0&&index<route.length-1) rooms.push(r);
    if (index<1||index>route.length-2||index%2!==s%2) return;
    const dist=baseRoom*(1.05+(s%4)*.22), next=route[index+1], prev=route[index-1];
    const [dx,dy]=[next.y-prev.y,prev.x-next.x];
    const span=Math.hypot(dx,dy)||1,side=(index+s)%4===0?1:-1;
    const dest = candidatePoint(point.x+dx/span*dist*side,point.y+dy/span*dist*side);
    if(dest.x<180||dest.y<180||dest.x>width-180||dest.y>height-180) return;
    branches.push([point,dest]);
    rooms.push([dest.x,dest.y,radius*.72,radius*.64]);
  });
  const paths = [route,...branches].map(path=>path.map(({x,y})=>[x,y]));
  const encounterSpecies=packs.filter(num=>num!==27);
  const encounters = encounterSpecies.map((species,index)=>s<3?
    [species] : index%2 ? [species,encounterSpecies[(index+1)%encounterSpecies.length]] : [species]);
  if(level>20&&encounterSpecies.length>2) encounters.push(encounterSpecies.slice(0,3));
  const scene={id,name,width,height,palette,level,seed:s*97+(dungeon?1673:429),kind:dungeon?'cave':'road',
    encounters,tier:Math.floor(level/4),paths,pathWidth:34,caveWidth:99,scatter:dungeon?210:175,props:[],objects:[],people:[],exits:[],adventure:true,
    adventureOpening:gate,adventureAction:/^A\d/.test(action)?action:null,
    field:{type:'outdoor',profile:style.profile,wall:style.wall,ground:regionalGround[a],
      rooms:rooms.map(([x,y,w,h])=>[x,y,w*roomWidth[id],h*roomWidth[id]]),
      radius:style.radius,planArea:plannedArea,route} };
  scene.entry=offsetFrom(route[0],route[1],56);
  const decor=scenicKinds(id,style.profile,palette);
  for (const [i,point] of route.entries()) {
    if(i===0||i===route.length-1) continue;
    const dx=(i%2===0?-1:1)*(73+(s%4)*11), dy=(i%3===0?1:-1)*(76+(s%5)*7);
    scene.props.push([decor[(i+s)%decor.length],point.x+dx,point.y+dy,.75+(i%3)*.22,i%3]);
    scene.props.push([decor[(i+2+s)%decor.length],point.x-dx*1.2,point.y-dy*.75,.68+i*.09,i%2]);
    const mark=markers[Math.min(markers.length-1,i)];
    if(mark) scene.objects.push({id:id+'-mark-'+i,kind:'adventure-inspect',physical:physicalMark(mark,style.profile),
      label:mark,text:landscapeLine(style.profile,dungeon,i),...candidatePoint(point.x+19+(i%2)*-38,point.y+43)});
  }
  for(const [a,b] of branches) {
    const spot=offsetFrom(b,a,-29),sp=offsetFrom(b,a,48);
    scene.props.push([decor[1],spot.x,spot.y,.97,1],[decor[2],sp.x+46,sp.y+16,.84,2]);
  }
  const trail=route[Math.floor(route.length/2)];
  const safe=candidatePoint(trail.x-24,trail.y-51);
  if(dungeon || mainApproach.has(id)) scene.objects.push({id:id+'-rest',kind:'adventure-rest',physical:'hearth',label:'風よけの休み場',
    text:'火を絶やさずに休める。',...safe});
  addOutdoorConsequences(scene,trail);
  for(const [i,bossId] of bosses.entries()) {
    const boss=adventureBosses[bossId];
    const target=(dungeon&&i===0)?route.at(-1):branches[i%Math.max(1,branches.length)]?.[1]??route.at(-2);
    const appearsAfter=bossId==='B43'?['W02','C03']:bossId==='B44'?['C06']:null;
    scene.objects.push({id:bossId,kind:'adventure-boss',label:boss.title,physical:'den',bossId,boss:[boss.monsterId],
      chapter:boss.chapter,postgame:boss.postgame,appearsAfter,portrait:boss.monsterId,level:boss.level,...target});
    const clues=concealedPaths[bossId];
    if(clues){
      const [label,text,physical]=clues;
      const landmark=scene.objects.find(o=>o.id===id+'-mark-3');
      const position=offsetFrom(target,route[Math.floor(route.length/2)],96);
      Object.assign(landmark,{...position,label,text,physical:physical==='basin'?'cistern':physical,postgame:boss.postgame,appearsAfter});
    }
  }
  const prep = {
    D10:['G01','高い避難所の火','hearth',candidatePoint(trail.x+78,trail.y-18)],
    R50:['oar','外浜の櫂立て','tackle',candidatePoint(trail.x+72,trail.y-20)],
    R57:['G02','沖へ出る救助舟','boat',candidatePoint(trail.x+79,trail.y-19)]
  }[id];
  if(prep) {
    const appearance = id==='D10'?[{flag:'W03',art:'coldHearth'}]:id==='R57'?
      [{flag:'W05',art:'mooring'},{flag:'G02',art:'readyBoat'}]:[];
    scene.objects.push({id:id+'-'+prep[0],kind:'adventure-prep',prep:prep[0],label:prep[1],physical:prep[2],appearance,...prep[3]});
  }
  return scene;
}

function addOutdoorConsequences(scene,trail) {
  const items = {
    D03:[{dx:90,dy:34,physical:'boat',appearance:[{flag:'W01',art:'mooring'},{flag:'C02',art:'readyBoat'}]},
      {dx:140,dy:-42,physical:'bench',appearance:[{flag:'C02',art:'refuge'}]}],
    D05:[{dx:105,dy:45,physical:'grove',appearance:[{flag:'W02',art:'burntGrove'}]},
      {dx:155,dy:-38,physical:'hearth',appearance:[{flag:'W02',art:'coldHearth'}]}],
    D13:[{dx:97,dy:30,physical:'refuge',appearance:[{flag:'W04',art:'mooring'},{flag:'C06',art:'bench'}]}],
    D26:[{dx:94,dy:51,physical:'boat',appearance:[{flag:'W05',art:'mooring'},{flag:'G02',art:'readyBoat'}]}],
    D30:[{dx:98,dy:29,physical:'refuge',appearance:[{flag:'W06',art:'coldHearth'},{flag:'C11',art:'bench'}]}],
    R64:[{dx:98,dy:47,physical:null,appearance:[{endings:['E1'],art:'coldHearth'},{endings:['E2'],art:'readyBoat'},{endings:['E3'],art:'anchored'}]}]
  }[scene.id]??[];
  scene.field.scenery=items.map(({dx,dy,...item})=>({...item,...candidatePoint(trail.x+dx,trail.y+dy)}));
}

function physicalMark(name,profile) {
  if (/屋|蔵|小戸|戸口|門|工房/.test(name)) return 'board';
  if (/舟|水際|渡|桁|外浜|橋/.test(name)) return profile==='water'?'boat':'tackle';
  if (/棚|薪|箱|台|道具/.test(name)) return 'supplies';
  return 'boulder';
}

function landscapeLine(profile,dungeon,index) {
  if(index%3===0) return '道が分かれている。来た方には、動かない足場が残っている。';
  if(profile==='water') return '波が板を打っている。白くなった石より上は乾いている。';
  if(profile==='rise') return '砂粒が斜面を落ちていく。固い岩の縁なら上へ回れる。';
  if(profile==='bend') return '内側に風が当たらない窪みがある。奥へ出る前に一息つける。';
  return dungeon?'入口の方から風が来る。壁沿いを見れば帰り道が分かる。':'先へ続く道と、脇に開けた静かな足場が見える。';
}

export const adventureMaps = Object.fromEntries([
  ...townData.map(townScene),...outsideData.map(outsideScene)
].map(scene=>[scene.id,scene]));

function addExit(scene,destination,position,spawn,settings={}) {
  scene.exits.push({id:destination.id,label:destination.name,kind:'adventure-gate',physical:scene.kind==='town'?'gate':'trailgate',
    ...position,spawn,...settings});
}

for (const row of outsideData) {
  const [id,, ,fromId,toId,open] = row;
  if (id[0]!=='R') continue;
  const road=adventureMaps[id],from=adventureMaps[fromId],to=adventureMaps[toId];
  const fromMouth=from.mouths.get(id)[0];
  const toMouth=to.mouths?.get(id).at(from===to?1:0);
  const path=road.field.route;
  const start=path[0],finish=path.at(-1),startSpawn=offsetFrom(start,path[1],59),finishSpawn=offsetFrom(finish,path.at(-2),59);
  addExit(from,road,fromMouth.point,startSpawn,{adventureGate:open,physicalLabel:fromMouth.label,roadSide:'from'});
  addExit(road,from,start,fromMouth.retreat,{physicalLabel:'町へ戻る道',roadSide:'from'});
  if(toMouth) {
    addExit(to,road,toMouth.point,finishSpawn,{adventureGate:open,physicalLabel:toMouth.label,roadSide:'to'});
    addExit(road,to,finish,toMouth.retreat,{physicalLabel:toMouth.label,roadSide:'to'});
  } else {
    const dungeon=to.field.route;
    addExit(road,to,finish,to.entry,{adventureGate:to.adventureOpening,adventureAction:to.adventureAction,physicalLabel:'奥へ続く入口',roadSide:'to'});
    addExit(to,road,dungeon[0],finishSpawn,{physicalLabel:'野外へ戻る入口',roadSide:'from'});
  }
}

export function adventureGateOpen(state,gate) {
  if(!gate) return true;
  const flags=state?.adventure?.flags??{};
  return gate.split(',').every(key=>key==='START'||!!flags[key]);
}

const monsterNames = {
  1:'緑のしずく',2:'紫コウモリ',3:'角ウサギ',4:'塔の鎧',5:'空の鎧',6:'骨の犬',7:'火の精',8:'灰色オオカミ',
  9:'歩くキノコ',11:'砂ネズミ',12:'穴掘りゴブリン',13:'岩のゴーレム',14:'小トカゲ',18:'赤い翼の群れ',
  22:'大きな番犬',23:'大モグラ',24:'砂の潜り手',25:'浜ガニ',26:'砂の甲虫',28:'跳ねるカエル',29:'川の羽虫',
  32:'大トカゲ',33:'流れる傘',34:'石の牙',36:'骨の弓兵',37:'小さな鳥の魔物',40:'水の触手',41:'水の魔物',
  43:'穴の虫',47:'谷の飛び手',54:'冷たい獣',60:'板を噛む虫',64:'群れの獣',83:'根の魔物',86:'黒い海蛇',
  92:'水辺の牙',93:'氷の獣',94:'岩棚の魔物',95:'石肌の獣',98:'風の魔物',99:'大きな爪',101:'砂州の怪物'
};
const attributeWeaknesses = {火:['氷','水','剣'],水:['雷','氷','槍'],氷:['火','斧','杖'],風:['弓','雷','剣'],雷:['土','槍','氷'],
  土:['風','剣','斧'],光:['闇','水','弓'],闇:['光','火','剣']};

export function installAdventureWorld(maps,monsterDefs) {
  Object.assign(maps,adventureMaps);
  const bySprite=new Map(Object.values(adventureBosses).map(boss=>[boss.monsterId,boss]));
  const used=new Set([...Object.values(adventureMaps).flatMap(map=>map.encounters?.flat()??[]),...bySprite.keys()]);
  for(const id of used) {
    if(monsterDefs[id]) continue;
    const [attribute,posture]=monsterTraits[id];
    const boss=bySprite.get(id);
    const pace=posture==='飛ぶ'?17:posture==='地をはう'?8:12;
    monsterDefs[id]=[monsterNames[id]??boss?.title??'荒地の魔物',attribute,attributeWeaknesses[attribute]??['剣','火','風'],2,30,11,5,pace,{}];
  }
}
