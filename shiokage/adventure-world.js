import { bossData, monsterTraits, outsideData, townData } from './adventure-world-data.js';
import { adventureLandscape } from './adventure-landscapes.js';

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
const regionalPalettes = { A:'port', B:'moor', C:'shrine', D:'ember', E:'port', F:'cave', G:'frost' };
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
    const earlyHelp=roleId==='P01'?[-13,5]:roleId==='P04'?[-15,-6]:[0,0];
    const position = pointOnTown(scene,center,shiftX+earlyHelp[0],shiftY+earlyHelp[1]);
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
const landmarkMix = {
  breakwater:['breakwater','mooring','cliffVista'],windbreak:['windbreak','camp','windbreak'],
  reedBridge:['reedBridge','mooring','reefStone'],roofRuin:['roofRuin','stoneShelves','camp'],
  forestVista:['forestVista','fallenTrunks','cliffVista'],cliffVista:['cliffVista','camp','breakwater'],
  stoneShelves:['stoneShelves','echoStones','stoneShelves'],camp:['camp','forestVista','windbreak'],
  shelving:['shelving','supplies','shelving'],sluiceGate:['sluiceGate','reedBridge','mooring'],
  fallenTrunks:['fallenTrunks','forestVista','stoneShelves'],waxPillars:['waxPillars','stoneShelves','echoStones'],
  iceSpire:['iceSpire','cliffVista','echoStones'],furnace:['furnace','stoneShelves','camp'],
  shipFrame:['shipFrame','shelving','mooring'],echoStones:['echoStones','stoneShelves','camp'],
  reefStone:['reefStone','mooring','cliffVista'],boneRibs:['boneRibs','reefStone','cliffVista'],
  mooring:['mooring','reedBridge','breakwater']
};

function beside(a,b,offset,forward=0) {
  const span=dist(a,b)||1, dx=(b.x-a.x)/span,dy=(b.y-a.y)/span;
  return candidatePoint(a.x+dx*forward-dy*offset,a.y+dy*forward+dx*offset);
}

function outsideScene(row) {
  const [id,name,region,,,gate,action,level,oldWidth,oldHeight,,,,markers,packs,bosses] = row;
  const s=Number(id.slice(1)),dungeon=id[0]==='D';
  const layout=adventureLandscape(id,level,markers);
  const {width,height,route,branches,signature}=layout;
  const palette=regionalPalettes[region[0]];
  const paths = [route,...branches].map(path=>path.map(({x,y})=>[x,y]));
  const encounterSpecies=packs.filter(num=>num!==27);
  const encounters = encounterSpecies.map((species,index)=>s<3?
    [species] : index%2 ? [species,encounterSpecies[(index+1)%encounterSpecies.length]] : [species]);
  if(level>20&&encounterSpecies.length>2) encounters.push(encounterSpecies.slice(0,3));
  const scene={id,name,width,height,palette,level,seed:s*97+(dungeon?1673:429),kind:dungeon?'cave':'road',
    encounters,tier:Math.floor(level/4),paths,pathWidth:28,scatter:dungeon?9:28,props:[],objects:[],people:[],exits:[],adventure:true,
    adventureOpening:gate,adventureAction:/^A\d/.test(action)?action:null,
    field:{type:'outdoor',...layout,legacySize:[oldWidth,oldHeight],encounterSpacing:layout.spacing,scenery:[]} };
  scene.entry=offsetFrom(route[0],route[1],48);
  const signatures=landmarkMix[signature]??[signature];
  for (const [i,a] of route.entries()) {
    if(i===0||i===route.length-1) continue;
    const b=route[i+1],side=i%2?-1:1;
    const art=beside(a,b,side*(dungeon?67:94),23);
    scene.field.scenery.push({...art,physical:signatures[(i-1)%signatures.length],variant:(i+s)%4,small:i%3!==1});
    const mark=markers[Math.min(markers.length-1,i)];
    if(mark) scene.objects.push({id:id+'-mark-'+i,kind:'adventure-inspect',physical:physicalMark(mark,layout),
      label:mark,text:landscapeLine(id,mark,layout,i),...beside(a,b,side*(dungeon?19:28),15)});
    if(!dungeon){
      const near=beside(a,b,-side*67,53);
      scene.props.push([layout.wall==='trees'?'pine':layout.wall==='water'?'reeds':'rock',near.x,near.y,.71+(i%3)*.10,i%2]);
    }
  }
  for(const branch of branches){
    const end=branch.at(-1),spot=beside(end,branch.at(-2),dungeon?52:60);
    scene.field.scenery.push({...spot,physical:signature,variant:3,small:true});
  }
  if(dungeon||!bosses.length){
    for(const [index,treasure] of layout.treasure.entries()){
      scene.objects.push({...treasure,id:id+'-chest-'+(index+1),kind:'chest'});
    }
  }
  const middle=Math.floor(route.length/2), trail=route[middle],ahead=route[middle+1];
  const safe=beside(trail,ahead,layout.radius*.56,49);
  if(dungeon || mainApproach.has(id)) scene.objects.push({id:id+'-rest',kind:'adventure-rest',physical:'hearth',label:'風よけの休み場',
    text:'火を絶やさずに休める。',...safe});
  addOutdoorConsequences(scene,trail);
  for(const [i,bossId] of bosses.entries()) {
    const boss=adventureBosses[bossId];
    const target=dungeon&&i===0?route.at(-1):branches.at(-1)?.at(-1)??route.at(-2);
    const appearsAfter=bossId==='B43'?['W02','C03']:bossId==='B44'?['C06']:null;
    scene.objects.push({id:bossId,kind:'adventure-boss',label:boss.title,physical:'den',bossId,boss:[boss.monsterId],
      chapter:boss.chapter,postgame:boss.postgame,appearsAfter,portrait:boss.monsterId,level:boss.level,...target});
    const clues=concealedPaths[bossId];
    if(clues){
      const [label,text,physical]=clues;
      const landmark=scene.objects.find(o=>o.id===id+'-mark-3');
      const position=offsetFrom(target,branches.at(-1)?.at(-2)??trail,56);
      Object.assign(landmark,{...position,label,text,physical:physical==='basin'?'cistern':physical,postgame:boss.postgame,appearsAfter});
    }
  }
  const prep = {
    D10:['G01','高い避難所の火','hearth',beside(trail,ahead,-30,40)],
    R50:['oar','外浜の櫂立て','tackle',beside(trail,ahead,-37,46)],
    R57:['G02','沖へ出る救助舟','boat',beside(trail,ahead,-36,56)]
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
  scene.field.scenery.push(...items.map(({dx,dy,...item})=>({...item,...candidatePoint(trail.x+dx*.84,trail.y+dy*.84)})));
}

function physicalMark(name,layout) {
  if (/窯|炉|炭|焼/.test(name)) return 'furnace';
  if (/屋|蔵|残り穴|梁|桁|干し|工房/.test(name)) return 'shelving';
  if (/門|関|入口|停|出口/.test(name)) return 'board';
  if (/舟|水際|波|渡|外浜|橋/.test(name)) return layout.wall==='water'?'mooring':'tackle';
  if (/根|森|林|枝|草|木/.test(name)) return 'fallenTrunks';
  if (/棚|薪|箱|台|道具/.test(name)) return 'stoneShelves';
  return 'boulder';
}

function landscapeLine(id,mark,layout,index) {
  const written={D01:['床の砂が浅い。低い梁なら、足を取られずにくぐれそうだ。','倒れた棚に爪跡がある。荷箱がたまった横道と、高い梁へ行く道が分かれる。','梁から砂がこぼれている。ここから先は足音を聞いたほうがいい。'],
    D03:['水面の板がぶつかる。町へ戻る橋は、太い縄で結ばれている。','舟が水門に押しつけられている。手すりの方は石で組んである。','乾いた岩に綱が巻いてある。ここなら舟を止められる。'],
    D05:['下草が揺れた。その奥で一回り大きな枝が揺れている。','折れた根の先で小石が跳ねる。荷が落ちた横道はまだ通れる。','高い岩から、根が集まっている場所を見下ろせる。']};
  const lines=written[id];
  if(lines) return lines[Math.min(index-1,lines.length-1)];
  if (/砂|風/.test(mark)) return '風に飛ばされた砂が積もっている。石や板の出ている側は歩きやすい。';
  if (/舟|波|水|橋|岸/.test(mark)) return '水面まで古い縄が垂れている。白くなった石より上は乾いている。';
  if (/木|葉|根|林/.test(mark)) return '古い根に濡れた葉が引っかかっている。足跡は木の間へ続く。';
  if (/薪|火|窯|焼|灰/.test(mark)) return '石の隙間に灰がたまっている。触れると、まだ少し温かい。';
  if (/板|棚|箱|釘|道具/.test(mark)) return '残った道具は壁際に寄せてある。人が通った床だけ靴跡が重なっている。';
  return layout.deep?'壁に擦れた跡が残る。狭い通路の向こうから足音がする。':'街道を通る旅人が、風を避けて座った跡がある。';
}

export function adventureDepthAt(scene,point) {
  if(!scene?.field?.deep||!point) return scene?.level??1;
  const {route}=scene.field;
  let progress=0,best=Infinity;
  for(let n=1;n<route.length;n++) {
    const a=route[n-1],b=route[n], x=b.x-a.x, y=b.y-a.y;
    const t=Math.min(1,Math.max(0,((point.x-a.x)*x+(point.y-a.y)*y)/(x*x+y*y)));
    const d=(point.x-a.x-t*x)**2+(point.y-a.y-t*y)**2;
    if(d<best){best=d;progress=(n-1+t)/(route.length-1);}
  }
  return Math.max(1,scene.level-2+Math.min(2,Math.floor(progress*3)));
}

export const adventureMaps = Object.fromEntries([
  ...townData.map(townScene),...outsideData.map(outsideScene)
].map(scene=>[scene.id,scene]));

function addExit(scene,destination,position,spawn,settings={}) {
  scene.exits.push({id:destination.id,label:destination.name,kind:'adventure-gate',physical:scene.kind==='town'?'gate':'trailgate',
    ...position,spawn,...settings});
}

function dungeonPortal(scene) {
  const theme=scene.field.theme;
  if(['warehouse','dryHall','workshop','shipyard'].includes(theme)) return 'barnDoor';
  if(theme==='sluice') return 'sluiceGate';
  if(theme==='woodlot') return 'forestGate';
  return 'tunnelMouth';
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
    const physical=dungeonPortal(to);
    addExit(road,to,finish,to.entry,{adventureGate:to.adventureOpening,adventureAction:to.adventureAction,physical,physicalLabel:to.field.opening,roadSide:'to'});
    addExit(to,road,dungeon[0],finishSpawn,{physical,physicalLabel:'野外へ戻る入口',roadSide:'from'});
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
