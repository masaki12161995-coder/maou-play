// Each path is made from passages and rooms. Coordinates are in map pixels.
const openingRoads = {
  R01:{size:[1060,790],theme:'breakwater',route:[[158,637],[300,637],[410,512],[574,512],[704,428],[870,294]],
    branches:[[[574,512],[618,642],[777,675]]], signature:'breakwater'},
  R02:{size:[1010,920],theme:'dunes',route:[[164,148],[275,175],[371,298],[419,489],[633,666],[837,715]],
    branches:[[[419,489],[249,527],[165,666]]],signature:'windbreak'},
  R03:{size:[1050,905],theme:'river',route:[[144,678],[279,678],[411,535],[411,356],[604,356],[812,259]],
    branches:[[[411,535],[583,538],[697,618]]],signature:'reedBridge'},
  R04:{size:[1080,870],theme:'abandoned',route:[[894,664],[743,635],[609,562],[609,380],[447,312],[189,191]],
    branches:[[[609,380],[785,320],[821,196]]],signature:'roofRuin'},
  R05:{size:[1120,1020],theme:'forest',route:[[167,813],[321,748],[508,739],[531,536],[698,414],[923,234]],
    branches:[[[531,536],[358,492],[272,367]]],signature:'forestVista'},
  R32:{size:[930,800],theme:'dunes',route:[[156,654],[300,638],[385,497],[492,382],[629,382],[766,231]],
    branches:[[[385,497],[224,449],[160,329]]],signature:'windbreak'},
  R34:{size:[980,770],theme:'waterfront',route:[[154,630],[288,552],[388,552],[490,434],[595,434],[822,233]],
    branches:[[[490,434],[364,324],[318,211]]],signature:'sluiceGate'},
  R36:{size:[1080,920],theme:'forest',route:[[170,740],[334,686],[401,522],[553,467],[716,402],[891,230]],
    branches:[[[553,467],[641,616],[808,632]]],signature:'forestVista'}
};

const openingDungeons = {
  D01:{size:[890,860],theme:'warehouse',route:[[163,714],[165,565],[341,565],[341,372],[536,372],[536,228],[704,228]],
    chambers:[[165,565,128,116],[341,372,143,139],[536,372,124,124],[704,228,202,170]],
    branches:[[[341,565],[487,565],[487,682],[650,682]]],signature:'shelving',opening:'砂の積もる入口',end:'梁の間'},
  D03:{size:[1060,910],theme:'sluice',route:[[150,731],[294,679],[294,510],[499,510],[499,308],[691,308],[847,198]],
    chambers:[[294,679,163,110],[294,510,128,110],[499,308,151,132],[847,198,205,170]],
    branches:[[[499,510],[678,513],[786,658],[917,658]]],signature:'sluiceGate',opening:'水門の荷待ち場',end:'乾いた石囲い'},
  D05:{size:[1090,1080],theme:'woodlot',route:[[197,917],[342,845],[430,688],[609,569],[580,372],[741,320],[898,216]],
    chambers:[[342,845,157,130],[430,688,156,152],[609,569,155,164],[580,372,155,145],[898,216,215,180]],
    branches:[[[430,688],[272,627],[272,451],[152,346]],[[609,569],[788,613],[918,533]]],
    signature:'fallenTrunks',opening:'下草の切れ目',end:'根が集まる奥の岩庭'}
};

// Main terrain, bridge or road surface, blocked material, carved passage width, characteristic object.
const themes = {
  breakwater:['sand','paving','water',65,'breakwater'],dunes:['sand','track','duneWall',65,'windbreak'],
  river:['marsh','wood','water',60,'reedBridge'],abandoned:['slate','paving','cutStone',53,'roofRuin'],
  forest:['meadow','track','trees',58,'forestVista'],waterfront:['slate','wood','water',62,'sluiceGate'],
  cliff:['slate','stairs','drop',59,'cliffVista'],shelves:['stone','paving','cutStone',56,'stoneShelves'],
  meadow:['meadow','track','trees',72,'camp'],frost:['frost','stone','iceWall',58,'iceSpire'],
  forgeRoad:['ash','stone','bedrock',62,'furnace'],lowBeach:['marsh','sand','water',72,'mooring'],
  warehouse:['timber','timber','plaster',39,'shelving'],sluice:['stone','wood','water',41,'sluiceGate'],
  woodlot:['meadow','track','trees',43,'fallenTrunks'],cave:['slate','stone','bedrock',43,'stoneShelves'],
  dryHall:['paving','paving','plaster',40,'shelving'],waxCave:['umber','stone','bedrock',45,'waxPillars'],
  waterGarden:['marsh','stairs','water',41,'reedBridge'],bridgeHall:['slate','wood','drop',39,'cliffVista'],
  forge:['ash','paving','ironWall',42,'furnace'],shipyard:['timber','wood','water',41,'shipFrame'],
  rafts:['wood','wood','water',37,'mooring'],echo:['slate','stone','bedrock',42,'echoStones'],
  reef:['sand','stone','water',39,'reefStone'],refuge:['paving','stairs','cutStone',42,'camp'],
  sink:['slate','wood','water',41,'shipFrame'],workshop:['timber','timber','plaster',40,'shelving'],
  tallCliff:['stone','stairs','drop',38,'cliffVista'],iceHall:['frost','stone','iceWall',44,'iceSpire'],
  redCave:['umber','ash','redWall',46,'echoStones'],boneShore:['slate','stone','water',48,'boneRibs']
};

// Road themes follow the local geography and the terrain named on the world map.
const roadTheme = [
  'breakwater','dunes','river','abandoned','forest','cliff','river','cliff','shelves','forgeRoad','lowBeach','cliff','breakwater','forgeRoad','waterfront','forest',
  'forgeRoad','river','cliff','river','forest','dunes','cliff','forest','lowBeach','waterfront','cliff','frost','lowBeach','river','cliff','dunes',
  'waterfront','waterfront','abandoned','forest','cliff','river','cliff','waterfront','forgeRoad','cliff','forgeRoad','tallCliff','shipyard','shelves','echo','reef',
  'forgeRoad','waterfront','breakwater','shipyard','lowBeach','forgeRoad','waterfront','lowBeach','breakwater','tallCliff','frost','abandoned','redCave','cliff','boneShore','breakwater'
];
const dungeonTheme = [
  'warehouse','rafts','sluice','dryHall','woodlot','waxCave','waterGarden','bridgeHall','bridgeHall','forge','cave','forge','tallCliff','shipyard','workshop','echo',
  'reef','echo','reef','refuge','shipyard','sink','workshop','cave','dryHall','tallCliff','bridgeHall','iceHall','warehouse','redCave','echo','boneShore'
];

const compactRoutes = [
  [[.13,.79],[.29,.72],[.38,.49],[.57,.49],[.69,.27],[.84,.21]],
  [[.18,.23],[.32,.26],[.32,.52],[.57,.53],[.56,.76],[.82,.77]],
  [[.18,.72],[.34,.74],[.34,.43],[.61,.43],[.61,.23],[.84,.23]],
  [[.16,.80],[.27,.64],[.44,.70],[.48,.43],[.69,.38],[.84,.17]],
  [[.19,.25],[.34,.22],[.45,.44],[.63,.42],[.68,.63],[.84,.73]],
  [[.19,.68],[.31,.68],[.31,.34],[.52,.33],[.65,.54],[.84,.55]]
];
const hubRoutes = [
  [[.16,.79],[.35,.79],[.35,.55],[.55,.55],[.55,.32],[.75,.32],[.75,.18]],
  [[.20,.75],[.20,.48],[.44,.48],[.44,.72],[.68,.72],[.68,.37],[.85,.37]],
  [[.18,.23],[.37,.23],[.37,.45],[.60,.45],[.60,.68],[.82,.68],[.82,.82]],
  [[.16,.77],[.38,.77],[.38,.51],[.69,.51],[.69,.34],[.50,.34],[.50,.16]],
  [[.16,.27],[.17,.58],[.43,.58],[.43,.77],[.69,.77],[.69,.49],[.85,.48]],
  [[.12,.49],[.30,.49],[.30,.25],[.52,.25],[.52,.58],[.76,.58],[.76,.79]]
];

const point = ([x,y])=>({x:Math.round(x),y:Math.round(y)});

function pathDistance(path,p) {
  let closest=Infinity;
  for(let i=1;i<path.length;i++) {
    const a=path[i-1],b=path[i],x=b[0]-a[0],y=b[1]-a[1];
    const t=Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y)/(x*x+y*y||1)));
    closest=Math.min(closest,Math.hypot(p[0]-a[0]-x*t,p[1]-a[1]-y*t));
  }
  return closest;
}

function sidePassage(at,route,existing,width,height,order) {
  const limits=[.13,.25,.40,.59,.72,.86];
  const candidates=[];
  for(const x of limits) for(const y of limits) {
    const point=[x*width,y*height],span=Math.hypot(point[0]-at[0],point[1]-at[1]);
    const depth=pathDistance(route,point), separation=existing.length?pathDistance(existing[0],point):999;
    if(span<197) continue;
    const score=Math.min(depth,230)+Math.min(separation,183)*.52-Math.abs(span-334)*.30;
    candidates.push({point,score});
  }
  candidates.sort((a,b)=>b.score-a.score);
  const end=candidates[0].point;
  const bend=order%2===0?[end[0],at[1]]:[at[0],end[1]];
  const turn=[at[0]+(bend[0]-at[0])*.66,at[1]+(bend[1]-at[1])*.66];
  return [at,turn,bend,end].filter(([x,y],i,points)=>i===0||x!==points[i-1][0]||y!==points[i-1][1]);
}

function automaticLayout(id,level) {
  const dungeon=id[0]==='D',n=Number(id.slice(1));
  const theme=(dungeon?dungeonTheme:roadTheme)[n-1];
  const scale=Math.min(480,Math.round(level*4.1));
  const width=(dungeon?980:1040)+(n%4)*67+scale;
  const height=(dungeon?964:860)+(n%5)*64+scale;
  const layout=(dungeon?hubRoutes:compactRoutes)[(n*7+Math.floor(n/5))%6];
  const reverse=n%7===0;
  const route=layout.map(([x,y])=>[width*(reverse?1-x:x),height*y]);
  if(id==='D32') route.splice(5,0,[width*.66,height*.44]);
  const branches=[];
  const hubs=dungeon?[2,4]:[2+(n%2)];
  for(const h of hubs) {
    const at=route[h];
    branches.push(sidePassage(at,route,branches,width,height,n+h));
  }
  return {size:[width,height],theme,route,branches};
}

function room(x,y,w,h,shape,material) {
  return {x,y,w,h,shape,material};
}

function safeLoot(id,level,n) {
  const early={D01:{tool_004:2,eq_sword_02:1},D02:{tool_005:1,mat_005:2},D03:{tool_012:1,eq_shield_03:1},
    D04:{tool_004:2,mat_012:2},D05:{tool_011:1,eq_bow_04:1},R01:{tool_004:1},R04:{mat_012:2},R32:{tool_012:1}};
  if(early[id]) return early[id];
  return level<16?{tool_004:2,mat_005:1}:level<33?{tool_005:1,mat_032:2}:
    level<62?{tool_036:1,[n%2?'mat_045':'mat_084']:2}:{tool_044:1,mat_092:2};
}

export function adventureLandscape(id,level,markers) {
  const dungeon=id[0]==='D',n=Number(id.slice(1));
  const source=openingRoads[id]??openingDungeons[id]??automaticLayout(id,level);
  const [ground,track,wall,radius,usualSignature]=themes[source.theme];
  const [width,height]=source.size;
  const route=source.route.map(point);
  const branches=source.branches.map(path=>path.map(point));
  const chambers=[];
  const angular=dungeon&&['warehouse','sluice','dryHall','workshop','refuge','forge','bridgeHall','shipyard','sink','iceHall'].includes(source.theme);
  const material = angular?ground:null;
  const shape=angular?'brick':'hollow';
  if(source.chambers) {
    for(const [x,y,w,h] of source.chambers) chambers.push(room(x,y,w,h,shape,material));
  } else {
    for(const [i,p] of route.entries()) {
      const end=i===0||i===route.length-1;
      const extent=dungeon?(end?170:146+(i%3)*20):(end?150:(155+n%3*16+i%3*13));
      chambers.push(room(p.x,p.y,extent*(n%3===0?1.18:1),extent*(dungeon?.87:1.05),shape,material));
    }
  }
  for(const branch of branches) {
    const p=branch.at(-1);
    chambers.push(room(p.x,p.y,dungeon?137:151,dungeon?132:115,shape,material));
  }
  const hasChest=dungeon||n%4===0||['R01','R32','R34','R36'].includes(id);
  const treasure=hasChest?branches.slice(0,1).map(path=>({...path.at(-1),label:dungeon?'行き止まりの宝箱':'道脇の宝箱',loot:safeLoot(id,level,n)})):[];
  const spacing=dungeon?[385+Math.min(136,level*3),108]:[480+Math.min(140,level*2),175];
  return {width,height,ground,track,wall,radius,route,chambers,branches,treasure,signature:source.signature??usualSignature,
    theme:source.theme,spacing,opening:source.opening??markers[0],end:source.end??markers.at(-1),
    deep:dungeon,openingMap:!!(openingRoads[id]||openingDungeons[id])};
}
