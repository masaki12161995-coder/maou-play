"use strict";

const EXIT_STEPS={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]};

const CH1_PORTALS={
  townRoad:["path",["town",9,36,"S"],["road",28,7,"N"]],
  townClimb:["gate",["town",15,6,"N"],["climb",10,37,"S"]],
  townHomes:["path",["town",3,21,"W"],["longhouses",36,15,"E"]],
  lowerHomes:["stairs",["town",3,24,"W"],["longhouses",36,24,"E"]],
  townInn:["door",["town",25,18,"N"],["inn",12,24,"S"]],
  homesForge:["door",["longhouses",8,10,"N"],["workshop",12,24,"S"]],
  homesStore:["door",["longhouses",22,23,"E"],["cistern",9,34,"S"]],
  climbOverlook:["stairs",["climb",6,17,"W"],["overlook",34,22,"E"]],
  climbGate:["gate",["climb",21,6,"N"],["gate",20,31,"S"]],
  gateCourt:["gate",["gate",20,6,"N"],["court",17,36,"S"]],
  courtSide:["stairs",["gate",13,6,"N"],["court",10,34,"S"]],
  gateWard:["gate",["gate",33,15,"E"],["wardhouse",5,36,"W"]],
  courtHall:["stairs",["court",30,8,"N"],["hall",21,38,"S"]],
  hallMaintenance:["stairs",["court",31,31,"E"],["hall",4,23,"W"]],
  hallService:["door",["hall",38,34,"E"],["service",7,27,"W"]],
  upperService:["stairs",["hall",36,15,"E"],["service",8,9,"W"]],
  hallTown:["stairs",["hall",38,36,"E"],["town",4,19,"W"]],
  hallNord:["path",["hall",23,5,"N"],["nord",6,24,"S"]],
  townNord:["path",["town",27,24,"E"],["nord",2,22,"W"]],
  roadPine:["path",["road",32,29,"E"],["pine",3,22,"W"]],
  overlookStore:["stairs",["overlook",14,33,"S"],["cistern",28,6,"N"]],
  wardHigh:["stairs",["wardhouse",19,7,"N"],["hall",25,38,"S"]],
  wardLow:["stairs",["wardhouse",32,33,"E"],["hall",10,29,"W"]],
};

function attachChapterExit(scene,id,g,key,label,before=null) {
  const [style,first,second]=CH1_PORTALS[key];
  const [[,col,row,direction],[to,otherCol,otherRow,back]]=first[0]===id?[first,second]:[second,first];
  const [dx,dy]=EXIT_STEPS[back],spawn=[otherCol-dx,otherRow-dy];
  const travel=()=>g.travel(to,spawn,null,direction);
  const open=()=>before?before(travel):travel();
  scene.exits.push({col,row,to,spawn,direction,connection:key,open});
  scene.objects.push(thing(col,row,"exit",label,[],{
    sceneId:"exit-"+to,passage:{style,direction},connection:key,
    walk:true,instant:true,bounds:[-23,style==="path"||style==="stairs"?-26:-53,24,11],onEnd:open,
  }));
}

// Door lips and small landings at the borders of the existing maps.
const CH1_LANDINGS={
  town:[[3,24,"p"],[27,23,"p"],[27,24,"p"],[27,25,"p"],[14,5,"#"],[15,5,"#"],[16,5,"#"]],
  climb:[[20,5,"^"],[21,5,"^"],[22,5,"^"],[23,5,"^"]],
  gate:[[19,31,"p"],[20,31,"p"],[21,31,"p"],[19,5,"#"],[20,5,"#"],[21,5,"#"]],
  court:[[30,30,"d"],[31,30,"d"],[31,31,"d"],[31,32,"d"]],
};
for(const [id,cells] of Object.entries(CH1_LANDINGS)){
  const grid=CHAPTER1_MAPS[id].grid;
  for(const [col,row,tile] of cells)grid[row]=grid[row].slice(0,col)+tile+grid[row].slice(col+1);
}
