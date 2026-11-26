"use strict";

const CH1_SHOTS={
  arrival:{focus:[15,7],hold:.64,light:[15,19]},
  townPass:{focus:[17,20],hold:.73,actors:[["person_045",[[18,18],[18,19],[18,20],[18,21],[19,21]]],["person_019",[[12,12],[12,13],[13,13],[13,14],[13,15]]]]},
  gateArrival:{focus:[20,11],hold:.92},
  flagNorth:{focus:[18,9],hold:.65},
  gateEye:{focus:[19,9],hold:.62},
  pane:{focus:[30,17],hold:.78},
  wheel:{focus:[11,35],hold:.84},
  sash:{focus:[28,29],hold:.74},
  braceLens:{focus:[19,10],hold:.83},
  cutLens:{focus:[24,10],hold:.83},
  liftWalk:{focus:[17,16],hold:.76,actors:[["H03",[[20,16],[19,16],[19,15],[18,15]]]]},
  liftWedge:{focus:[17,15],hold:.83,actors:[["H03",[[18,15],[18,15]]],["person_045",[[18,18],[19,18],[19,19]]]]},
  unlock:{focus:[15,7],hold:.88,actors:[["H04",[[14,10],[15,10],[15,9],[15,8]]]]},
  court:{focus:[18,12],hold:.90},
  escape:{focus:[28,11],hold:.82,actors:[["H02",[[25,15],[26,15],[27,15],[28,15],[28,14],[28,13],[28,12],[28,11],[29,11],[29,10],[30,10],[30,9]]]]},
  lamp:{focus:[29,13],hold:.8},
  bar:{focus:[21,19],hold:.67},
  chain:{focus:[30,17],hold:.73},
  flag:{focus:[16,17],hold:.6},
  store:{focus:[26,14],hold:.74},
  cisternUpper:{focus:[18,24],hold:.72},
  cisternLower:{focus:[20,26],hold:.72},
  signal:{focus:[27,11],hold:.85},
  wardEntry:{focus:[11,28],hold:.67},
  wardHigh:{focus:[17,20],hold:.82},
  wardLow:{focus:[17,20],hold:.82},
  wardLid:{focus:[26,11],hold:.84},
  wardFlame:{focus:[27,7],hold:.91},
  return:{focus:[21,8],hold:.71},
};
function ch1Shot(g,id,duration,finish){
  g.effect("chapter1",duration,finish);
  g.cinematic.scene=id;
}
function ch1Frame(effect,now){
  if(effect?.kind!=="chapter1")return null;
  const shot=CH1_SHOTS[effect.scene];
  const q=Math.max(0,Math.min(1,(now-effect.at)/effect.duration));
  const easing=Math.min(1,q*4,(1-q)*3)**.65;
  const [x,y]=FIELD_COORD(...shot.focus);
  const actors=(shot.actors||[]).map(([art,points])=>{
    const t=Math.min(points.length-1,(q*(effect.scene==="escape"?1.2:1.6))*(points.length-1));
    const n=Math.min(points.length-2,Math.floor(t));
    return {art,from:points[n],to:points[n+1],q:t>=points.length-1?1:t-n};
  });
  return {focus:{x,y:y-31,weight:easing*shot.hold},actors,hidden:actors.map(a=>a.art),freeze:effect.scene==="arrival"&&q>.33&&q<.66};
}
function drawCh1Scene(g,context,c,q){
  const {scene}=c;
  const at=(col,row)=>{
    const [x,y]=FIELD_COORD(col,row);
    return [x-g.field.camera.x,y-g.field.camera.y];
  };
  const rect=(color,x,y,w,h)=>{
    context.fillStyle=color;
    context.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));
  };
  const spark=(x,y,color)=>{
    rect(color,x-3,y,7,1);rect(color,x,y-3,1,7);rect("#f3dba6",x,y,1,1);
  };
  const line=(x,y,tx,ty,tint)=>{
    const length=Math.max(Math.abs(tx-x),Math.abs(ty-y),1);
    for(let k=0;k<=length;k+=3)rect(tint,x+(tx-x)*k/length,y+(ty-y)*k/length,3,2);
  };
  context.save();
  context.beginPath();context.rect(0,0,context.canvas.width,context.canvas.height);context.clip();
  if(scene==="arrival"){
    const [x,y]=at(15,19), [bx,by]=at(12,20);
    for(let i=0;i<16;i++){
      const t=(q>.33&&q<.66?.33:q)*165;
      rect("#d8bba76a",bx+(i*37+Math.floor(t))%125-55,by-i%5*6+(i%3)*3,3,2);
    }
    if(q>.19)for(let i=0;i<7;i++){
      const p=(q*2+i*.12)%1;
      if(i%2)spark(x+p*10,y-11-p*207,"#c99162bc");
      else rect("#dbb37a9c",x-p*13,y-14-p*209,7,2);
    }
  } else if(scene==="liftWalk"||scene==="liftWedge"){
    const [x,y]=at(17,15);
    const falling=scene==="liftWedge"?Math.max(0,Math.min(1,(q-.31)*3)):0;
    for(let i=0;i<12;i++)rect(i%3?"#c4a38c":"#8d6761",x-5+((i+q*17)%3)-1,y-125+i*7+12*falling,3,4);
    if(falling>0){
      const wedge=11+(1-falling)*37;
      rect("#94684b",x+wedge-7,y+3,20,6);
      rect("#d8a573",x+wedge-8,y+2,13,3);
      if(q>.37&&q<.65)for(let k=0;k<16;k++)rect("#d7b08983",x+((k*5)%47)-24+(q-.37)*k*5,y-9-(k%5)*2-(q-.34)*38,3,2);
    }
  } else if(scene==="unlock"||scene==="bar"||scene==="chain"||scene==="store"){
    const [x,y]=at(...CH1_SHOTS[scene].focus);
    const drive=Math.max(0,Math.min(1,(q-.20)*1.55));
    for(let k=0;k<12;k++){
      const move=scene==="unlock"?drive*16:drive*31;
      rect("#a38b7b",x-4+(k%2)*4,y-k*6-move,3,4);
      rect("#ded0a0",x+1+(k%2)*4,y-k*6-move,1,2);
    }
    if(drive>.1)for(const d of [-1,1]){
      rect("#3e3039",x-26+d*drive*21,y-25-drive*10,24,16);
      rect("#c3a279",x-24+d*drive*21,y-21-drive*10,16,2);
      spark(x+d*(14+drive*52),y-8+Math.sin(q*18)*7,"#d2ab74a8");
    }
  } else if(scene==="court"){
    const [x,y]=at(18,13);
    for(let j=-5;j<=5;j++){
      const px=x+j*18,py=y+Math.abs(j)*3+41;
      rect("#211b2d89",px-11,py,38,10);
      rect("#c3a9823e",px+10,py-22,12,3);
    }
    rect("#17152840",0,0,context.canvas.width,context.canvas.height);
    const pulse=Math.floor(q*9)%3;
    if(pulse<2)line(x-47,y-76,x+18,y-33,"#c6aa7b50");
  } else if(scene==="escape"){
    for(let i=0;i<9;i++){
      if(i/10>q)continue;
      const point=[[25,15],[26,15],[27,15],[28,15],[28,14],[28,13],[28,12],[29,11],[30,10]][i];
      const [x,y]=at(...point);
      rect("#98a7ac83",x-8+i%2*8,y-3,4,6);
      if(i%3===0)spark(x-4,y-9,"#c5bac2a1");
    }
  } else if(scene==="lamp"){
    const [x,y]=at(29,13),[tx,ty]=at(30,9);
    const open=Math.max(0,Math.min(1,q*1.7-.22));
    rect("#64515b",x-13,y-23,27,5);
    rect("#d0ae86",x-11+open*19,y-27+open*8,9,5);
    if(open>0)for(let j=-2;j<=2;j++)
      line(x-8+open*14,y-18+j*3,x+(tx-x+j*13)*open,y+(ty-y)*open,"#ecca8b61");
  } else if(scene==="cisternUpper"||scene==="cisternLower"){
    const [x,y]=at(...CH1_SHOTS[scene].focus);
    const p=Math.max(0,Math.min(1,(q-.25)*2.5));
    for(let k=0;k<8;k++){
      rect("#625448",x-21,y-37+p*33+k*3,42,3);
      rect("#c49c6b",x-20,y-38+p*33+k*3,39,1);
    }
    for(let k=0;k<9;k++)rect("#7596918a",x+(k%2?1:-1)*(27+p*k*4),y+(k%5)*3,11,1);
  } else if(scene==="signal"){
    const [x,y]=at(27,11), length=Math.max(0,q-.21)*210;
    for(let i=0;i<3;i++){
      line(x-6,y-23+i*5,x-6-length,y-23+i*5+length/2,i===1?"#f0c9879f":"#b98d6560");
      if(length>35)spark(x-6-length*.83,y-23+i*5+length*.415,"#f0c9879f");
    }
  } else if(["wardEntry","wardHigh","wardLow","wardLid","wardFlame"].includes(scene)){
    const [x,y]=at(...CH1_SHOTS[scene].focus);
    if(scene==="wardLid")for(let j=0;j<25;j++)rect(j%4?"#62535d":"#a88e78",x-25+j%5*10,y+12-Math.floor(j/5)*8-q*62,9,6);
    for(let j=0;j<13;j++){
      const t=(q*1.18+j*.053)%1;
      const reach=scene==="wardFlame"?Math.pow(1-q,1.6)*92:85;
      const flip=scene==="wardLow"?1:-1;
      const nx=x+93*(t-.42),ny=y-17+flip*reach*t;
      rect(j%2?"#be633b":"#d9884b",nx-3,ny,9-j%4,3);
      if(j%3===0)spark(nx-3,ny-4,"#e9aa64a3");
    }
    if(scene==="wardEntry"||scene==="wardFlame"){
      line(x-81,y-16,x+89-(scene==="wardFlame"?145*q:0),y-16,"#e385516c");
    }
  } else if(scene==="return"){
    const places=[[21,8],[20,9],[19,10],[18,10],[19,12],[21,12],[22,11],[23,9],[23,7]];
    for(let i=0;i<places.length;i++){
      if(i*.082>q)continue;
      const [x,y]=at(...places[i]);
      rect("#d8bb8349",x-16,y-2,32,4);rect("#e1c58c9c",x-6,y-2,12,2);
      if((Math.floor(q*15)+i)%4===0)spark(x,y-9,"#ddb97e9f");
    }
  } else if(["townPass","gateArrival","flagNorth","gateEye","pane","wheel","sash","braceLens","cutLens"].includes(scene)){
    const [x,y]=at(...CH1_SHOTS[scene].focus);
    const width=scene==="gateArrival"?117:67;
    for(let i=0;i<9;i++){
      const t=(q*1.9+i*.093)%1, side=i%2?1:-1;
      const xx=x+side*width*t,yy=y-18-(i%5)*3-59*t;
      rect(i%2?"#b1916b96":"#e5c58a82",xx,yy,5+(i%3),2);
      if(i%3===1)spark(xx+2,yy-3,"#e4c598a1");
    }
  } else if(scene==="flag"){
    const [x,y]=at(16,17);
    for(let k=0;k<14;k++)if(k/14<=q)rect("#e1bd8d",x+12+k%3*2,y-78+k*2,5,2);
  }
  context.restore();
}

const CH1_ATLAS={
  road:[88,606,"松影の街道","map"],town:[191,549,"鉄門広場","map"],longhouses:[91,485,"石工の長屋","map"],
  inn:[271,553,"旗待ちの宿","herb"],workshop:[78,413,"角鉄の工房","starterAxe"],climb:[263,466,"角影坂","stone"],
  gate:[225,395,"飛び石の巨角門","stone"],court:[146,333,"玉座庭","coin"],hall:[260,296,"黒天井の回廊","stone"],
  service:[324,375,"灯の物置","lantern"],nord:[323,273,"北への尾根","map"],
  cistern:[71,341,"預かり倉","vial"],overlook:[328,470,"見晴らし棚","lantern"],
  wardhouse:[197,445,"外壁の詰所","shield"],
};
const CH1_LINKS=[
  ["road","town"],["town","longhouses"],["longhouses","workshop"],["town","inn"],["town","climb"],
  ["climb","gate"],["gate","court"],["court","hall"],["hall","service"],["hall","nord"],
  ["longhouses","cistern"],["climb","overlook"],
  ["gate","wardhouse"],
];
function drawChapterAtlas(ui,g){
  ui.frame(38,247,326,410);
  ui.rec(44,253,314,398,"#cdb48a");
  for(let r=0;r<57;r++)for(let k=0;k<45;k++){ // 古い紙のしみとかすれ
    const n=(Math.imul(r+7,7919)^Math.imul(k+3,104729))>>>0;
    if(n%9===0)ui.rec(44+k*7,253+r*7,7,7,n%2?"#c4a97d":"#d6c098");
  }
  ui.rec(44,253,314,4,"#a88d64");ui.rec(44,647,314,4,"#a88d64");ui.rec(44,253,4,398,"#a88d64");ui.rec(354,253,4,398,"#a88d64");
  for(const [a,b] of CH1_LINKS){
    if(!(g.s.seen[a]||g.area.id===a)||!(g.s.seen[b]||g.area.id===b))continue;
    const [u,v]=CH1_ATLAS[a],[x,y]=CH1_ATLAS[b], n=Math.ceil(Math.hypot(x-u,y-v)/7);
    for(let k=0;k<=n;k++)if(k%2===0)ui.rec(u+(x-u)*k/n,v+(y-v)*k/n,3,3,"#7a5a3a");
  }
  for(const [id,[x,y,name,art]] of Object.entries(CH1_ATLAS)){
    if(!g.s.seen[id]&&g.area.id!==id)continue;
    ui.frame(x-14,y-16,28,28,id===g.area.id);
    ui.icon(art,x-6,y-10,1);
    ui.text(name,x,y+24,12,"#3b2a1c","center",{outline:3,outlineColor:"#e8d6b0",max:107});
    const info=AREAS[id];
    ui.add(x-22,y-21,44,42,()=>info.safe?g.travel(id,info.start):g.notice(info.title,"map"));
  }
  ui.frame(56,667,291,34);
  ui.text(g.area.title,201,685,15,GOLD,"center",{max:262});
}
