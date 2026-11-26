"use strict";

const FIELD_PART_FILES={ground:"ch1_ground",edge:"ch1_edges",scenery:"ch1_scenery"};
ART.push(...Object.values(FIELD_PART_FILES));

const FIELD_TILES=new Map();
const FIELD_FLOORS=new Map();
const PART_NEIGHBORS=[[0,-1],[1,0],[0,1],[-1,0]];
const PART_CORNERS=[[3,0,-1,-1,16],[2,3,-1,1,32],[1,2,1,1,64],[0,1,1,-1,128]];
const PART_SURFACES=[
  ["earth",new Set(["p","c","d","S","+","#","B"])],
  ["cobble",new Set(["c"])],
  ["slab",new Set(["d","+"])],
  ["rock",new Set(["^"])],
];
const LANDSCAPE_PROPS={
  table:"table",cargo:"cargo-tag",seal:"clue",bundles:"bundles",floorLight:"clue",signpost:"sign",
  board:"sign",fallenLog:"wood",posts:"step-mark",sap:"urn",rope:"rope",paper:"paper",
  cart:"cart",bridgehead:"step-mark",stoneYard:"step-mark",urn:"urn",wallRelief:"relief",
};
const PART_LIQUID=new Set(["~","="]);
const PART_TEXTURES=["#345764","#45727a","#588689"];

function fieldPartNoise(col,row,salt=0){
  let value=Math.imul(col+93,97184317)^Math.imul(row+219,235379311)^Math.imul(salt+7,6735913);
  value=Math.imul(value^(value>>>12),98274961);
  return (value^(value>>>15))>>>0;
}

function copyFieldPart(ctx, sheet, type, key, x, y){
  const size=FIELD_PART_INDEX[type][key];
  if(!size||!sheet?.naturalWidth)return;
  const [sx,sy,w,h,dx=0,dy=0]=size;
  ctx.drawImage(sheet,sx,sy,w,h,Math.round(x)-dx,Math.round(y)-dy,w,h);
}

function fieldPartCanvas(w,h){
  const canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d");
  ctx.imageSmoothingEnabled=false;
  return ctx;
}

function materialJoin(col,row,isSurface){
  let bits=0;
  for(const [i,[dx,dy]] of PART_NEIGHBORS.entries())if(isSurface(col+dx,row+dy))bits|=1<<i;
  for(const [a,b,dx,dy,bit] of PART_CORNERS)if(bits&(1<<a)&&bits&(1<<b)&&isSurface(col+dx,row+dy))bits|=bit;
  return bits;
}

function clippedSurface(sheets,material,join,seed){
  const texture=material+"-"+seed%6;
  const shape=join+"-"+((seed>>>15)&1);
  const key=texture+"/"+shape;
  const cached=FIELD_TILES.get(key);
  if(cached)return cached;
  const ctx=fieldPartCanvas(48,48);
  copyFieldPart(ctx,sheets.ground,"ground",texture,0,0);
  ctx.globalCompositeOperation="destination-in";
  copyFieldPart(ctx,sheets.edge,"edge",shape,0,0);
  FIELD_TILES.set(key,ctx.canvas);
  return ctx.canvas;
}

function partLocation(entry){
  const [x,y]=FIELD_COORD(entry.col,entry.row);
  return [x+(entry.dx||0),y+(entry.dy||0)];
}

class FieldParts {
  constructor(id,scene,bank){
    this.sheets=Object.fromEntries(Object.entries(FIELD_PART_FILES).map(([key,file])=>[key,bank.images[file]]));
    this.plan=scene.partPlan;
    this.grid=scene.grid;
    this.id=id;
    this.lamps=this.plan.lamps.map(([col,row,dx,dy,art])=>fieldPiece(col,row,art||"lamp",dx,dy));
    const closed=this.plan.closures.filter(([key])=>!scene.exits.some(exit=>exit.connection===key));
    this.blocks=[...this.plan.pieces.filter(p=>p.trunk).map(p=>[p.col,p.row]),...closed.map(([,col,row])=>[col,row])];
    this.fixed=[...this.plan.pieces,...this.lamps,...closed.filter(entry=>entry[3]).map(([,col,row,part])=>fieldPiece(col,row,part))];
    this.canvas=this.floor();
  }

  floor(){
    const memorized=FIELD_FLOORS.get(this.plan);
    if(memorized){
      FIELD_FLOORS.delete(this.plan);FIELD_FLOORS.set(this.plan,memorized);
      return memorized;
    }
    const {grid,sheets}=this;
    const {x:left,y:top,tileSize:size}=FIELD_GRID, w=grid[0].length,h=grid.length;
    const ctx=fieldPartCanvas(left*2+w*size,top*2+h*size);
    const tile=(col,row)=>grid[Math.min(h-1,Math.max(row,0))][Math.min(w-1,Math.max(col,0))];
    const ground=this.id==="gate"?"moor":"meadow";
    const earth=this.id==="gate"?"gravel":"dirt";
    const water=(col,row)=>PART_LIQUID.has(tile(col,row)) || (this.id==="gate"&&tile(col,row)==="+"&&row>=16&&row<=22);
    // Border cells are drawn a little further than the walking grid, including the mouths of roads.
    for(let row=-1;row<=h;row++)for(let col=-1;col<=w;col++){
      const actual=tile(col,row),x=left+col*size,y=top+row*size;
      const seed=fieldPartNoise(col,row,141);
      copyFieldPart(ctx,sheets.ground,"ground",ground+"-"+seed%6,x,y);
      const layers=PART_SURFACES.filter(([,kinds])=>kinds.has(actual));
      if(water(col,row)){
        const shore=materialJoin(col,row,water);
        ctx.drawImage(clippedSurface(sheets,earth,shore,seed+4),x,y);
        layers.push(["water",PART_LIQUID]);
      }
      for(const [name,kinds] of layers){
        const connected=name==="water"?water:(a,b)=>kinds.has(tile(a,b));
        let join=materialJoin(col,row,connected);
        if(name==="water")join=materialJoin(col,row,(a,b)=>water(a,b)||tile(a,b)==="^");
        const material=name==="earth"?earth:name;
        const edge=join+"-"+((seed>>>15)&1);
        if(name!=="water"&&join!==255)copyFieldPart(ctx,sheets.edge,"edge","verge-"+edge,x,y);
        ctx.drawImage(clippedSurface(sheets,material,join,seed),x,y);
        if(name==="water"&&join!==255)copyFieldPart(ctx,sheets.edge,"edge","shore-"+edge,x,y);
      }
      if(actual==="S"||actual==="="||actual==="+"){
        let part="stairs";
        if(actual==="=")part=this.id==="road"?"bridgeH":"bridgeV";
        if(actual==="+")copyFieldPart(ctx,sheets.ground,"ground","slab-"+seed%6,x,y);
        else copyFieldPart(ctx,sheets.ground,"ground",part+"-"+seed%3,x,y);
      }
    }
    for(let row=0;row<h;row++)for(let col=0;col<w;col++){
      if(tile(col,row)!=="^")continue;
      const [x,y]=FIELD_COORD(col,row),shade=fieldPartNoise(col,row,153)%3;
      if(tile(col,row+1)!=="^")copyFieldPart(ctx,sheets.scenery,"scenery","cliff-s-"+shade,x,y+4);
      else if(tile(col-1,row)!=="^"&&tile(col-1,row)!=="~")copyFieldPart(ctx,sheets.scenery,"scenery","cliff-l-"+shade,x-13,y-18);
      else if(tile(col+1,row)!=="^"&&tile(col+1,row)!=="~")copyFieldPart(ctx,sheets.scenery,"scenery","cliff-r-"+shade,x+13,y-18);
    }
    for(const [col,row,art,dx=0,dy=0] of this.plan.floorDetails||[]){
      const [x,y]=FIELD_COORD(col,row);
      copyFieldPart(ctx,sheets.scenery,"scenery",art,x+dx,y+dy);
    }
    for(const lamp of this.lamps){
      const [x,y]=partLocation(lamp);
      copyFieldPart(ctx,sheets.scenery,"scenery","light",x,y+4);
    }
    FIELD_FLOORS.set(this.plan,ctx.canvas);
    if(FIELD_FLOORS.size>2)FIELD_FLOORS.delete(FIELD_FLOORS.keys().next().value);
    return ctx.canvas;
  }

  objectSprite(object,time){
    let art=LANDSCAPE_PROPS[object.kind];
    if(object.passage){
      const nested=object.connection==="hallTown"&&this.id==="town";
      return nested?{art:"stairs-mouth"}:null;
    }
    if(object.sceneId==="gateHint")return {art:"fort-shutter"};
    if(object.sceneId==="townGate")return {art:"town-shutter"};
    if(object.sceneId==="underChain")return {art:"chain"};
    if(object.sceneId==="c1Cup")return {art:"bowl"};
    if(object.kind==="repairFlag")art=object.look?"flag-fixed":"flag-old";
    if(object.kind==="lift")art=object.open?"lift-open":"lift-rest";
    if(object.kind==="chest")art=object.open?"chest-open":"chest-shut";
    if(object.kind==="waterwheel")art=object.look&&Math.floor(time/170)%2?"wheel-run":"wheel-rest";
    if(object.kind==="barrier")art="fence";
    return art?{art}:null;
  }

  drawScenery(ctx,field,time){
    const items=[...this.fixed,...field.barriers,...field.objects];
    const visible=[];
    for(const item of items){
      const [x,y]=partLocation(item);
      if(!field.visible(x,y))continue;
      const model=item.art?item:this.objectSprite(item,time);
      if(model){
        const {art}=model;
        const depth=item.trunk?y:y-(item.dy||0);
        visible.push({x,y,depth,art,prop:true,light:art==="lamp"||art==="brazier"});
      }else if(item.image){
        visible.push({x,y,depth:y,prop:true,item});
      }
    }
    return visible;
  }

  drawPart(ctx,entry,time){
    const {x,y,art,light}=entry;
    copyFieldPart(ctx,this.sheets.scenery,"scenery",art,x,y);
    if(light){
      const glow=Math.floor(time/155+(x+y)%11)%7;
      ctx.fillStyle=glow<2?"#fff0a8":"#ffd68b";
      const dy=art==="brazier"?-49:-45;
      ctx.fillRect(x+1,y+dy,2,3+(glow<3));
    }
  }

  waterGlints(ctx,field,time){
    const {x,y}=field.camera,{width,height}=field.view;
    const firstCol=Math.max(0,Math.floor(x/48)-1),lastCol=Math.min(this.grid[0].length,Math.ceil((x+width)/48)+1);
    const firstRow=Math.max(0,Math.floor(y/48)-1),lastRow=Math.min(this.grid.length,Math.ceil((y+height)/48)+1);
    for(let row=firstRow;row<lastRow;row++)for(let col=firstCol;col<lastCol;col++){
      if(this.grid[row][col]!=="~")continue;
      const seed=fieldPartNoise(col,row,138);
      if(seed%4>1)continue;
      const beat=(Math.floor(time/132)+(seed>>>7))%16;
      const [a,b]=FIELD_COORD(col,row);
      ctx.fillStyle=PART_TEXTURES[Math.floor(beat/6)];
      ctx.fillRect(a-13+(seed%12),b-24+Math.floor(beat/2)-(seed%5),6+beat%6,1);
    }
  }

  markerAnchor(object){
    const [x,y]=partLocation(object);
    if(object.sheet)return [x,y-68];
    if(object.passage){
      const door=object.passage.style==="door";
      return [x+(door?22:0),y-(door?35:12)];
    }
    if(object.sceneId==="townGate")return [x+19,y-32];
    if(object.sceneId==="gateHint")return [x+20,y-34];
    const sprite=this.objectSprite(object,0);
    const size=sprite&&FIELD_PART_INDEX.scenery[sprite.art];
    if(!size)return [x,y-(object.image?42:23)];
    if(size[5]>62)return [x+22,y-45];
    return [x+6,y-Math.min(44,size[5]-4)];
  }

  marks(ctx,field,time){
    if(field.paused||field.shot)return;
    const [col,row]=field.trail[0];
    const near=e=>Math.abs(e.col-col)+Math.abs(e.row-row)<=3;
    for(const item of [...field.npcs,...field.objects]){
      if(!near(item)||item.passage&&item.passage.style==="path")continue;
      const [x,y]=this.markerAnchor(item);
      if(!field.visible(x,y))continue;
      const rest=(Math.floor(time/260)+item.row)%5;
      copyFieldPart(ctx,this.sheets.scenery,"scenery",rest===0?"marker-lit":"marker-dim",x,y);
    }
  }

  tapMark(field,x,y){
    if(field.paused||field.shot)return null;
    const [col,row]=field.trail[0];
    return [...field.npcs,...field.objects].find(item=>{
      if(item.passage?.style==="path"||Math.abs(item.col-col)+Math.abs(item.row-row)>3)return false;
      const [a,b]=this.markerAnchor(item);
      return Math.abs(a-x)<=8&&Math.abs(b-y)<=8;
    })||null;
  }
}
