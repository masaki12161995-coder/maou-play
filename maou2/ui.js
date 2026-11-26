"use strict";

const U = x=>Math.round(x*1.5);
const GOLD="#efcea0", PAPER="#f3e4c8", COOL="#bdcde4", GREEN="#a6cc95";
const GRADE_TINT=["#eddfc4","#b6df99","#acd4f8","#d9b6f8","#ffdb8c","#f8bfe7"];

class GameUI {
  constructor(game) { this.g=game; this.links=[]; this.labels=[]; }
  begin(ctx) { this.c=ctx;ctx.imageSmoothingEnabled=false;this.links=[];this.labels=[]; }
  rec(x,y,w,h,color) { const c=this.c;c.fillStyle=color;c.fillRect(U(x),U(y),U(x+w)-U(x),U(y+h)-U(y)); }
  text(text,x,y,size=15,color=PAPER,align="left",extra={}) {this.labels.push({text:String(text),x,y,size,color,align,...extra});}
  frame(x,y,w,h,on=false) {
    const c=this;
    c.rec(x+3,y+4,w-4,h,"#101421b0");c.rec(x,y+5,w,h-9,on?"#d9a96c":"#865f4a");
    c.rec(x+4,y,w-8,h,on?"#d9a96c":"#865f4a");
    c.rec(x+3,y+3,w-6,h-6,"#513d3c");
    c.rec(x+5,y+5,w-10,h-10,on?"#383344":"#262933");
    c.rec(x+8,y+2,w-16,1,on?"#ffeeaf":"#bb8c62");
    c.rec(x+8,y+h-4,w-16,1,"#695048");
    for(const dx of [5,w-7])for(const dy of [5,h-7])c.rec(x+dx,y+dy,2,2,on?"#ffdf9a":"#b48362");
  }
  mark(x,y,color=GOLD) {this.rec(x-4,y-1,9,3,color);this.rec(x-1,y-4,3,9,color);this.rec(x,y,1,1,"#fff1c7");}
  button(title,x,y,w,h,run,active=false,art=null) {
    this.frame(x,y,w,h,active); this.add(x,y,w,h,run);
    if(art){this.rec(x+9,y+8,31,h-16,"#171c2b");this.icon(art,x+14,y+Math.floor(h/2)-10,2);}
    this.text(title,art?x+48:x+w/2,y+h/2,15,run?PAPER:"#9b9291",art?"left":"center");
  }
  add(x,y,w,h,run) {if(run)this.links.push({x,y,w,h,run});}
  hit(x,y) {
    const cell=this.links.findLast(e=>x>=e.x && x<e.x+e.w && y>=e.y && y<e.y+e.h);
    if (cell) cell.run();
    return Boolean(cell);
  }
  icon(art,x,y,scale=2) {
    const image=this.g.bank.images[art]; if(!image) return;
    const w=image.naturalWidth, h=image.naturalHeight;
    if(w>32||h>32) this.c.drawImage(image,Math.floor((w-24)/2),Math.max(0,Math.floor((h-24)/2)),24,24,U(x),U(y),24*scale,24*scale);
    else this.c.drawImage(image,U(x),U(y),w*scale,h*scale);
  }
  person(id,x,y,scale=1,face=false) {
    const image=this.g.bank.images[id];if(!image)return;
    const [sx,sy,sw,sh]=face?[58,4,28,32]:[48,0,48,60];
    this.c.drawImage(image,sx,sy,sw,sh,U(x),U(y),sw*scale,sh*scale);
  }
  bar(x,y,w,ratio,palette=["#1c252b","#70a378","#a9ce93"]) {
    this.rec(x,y,w,5,palette[0]);
    const width=Math.max(0,Math.min(w,Math.round(w*ratio)));
    this.rec(x,y,width,4,palette[1]);this.rec(x,y,width,1,palette[2]);
  }
  hud() {
    const {g}=this;
    const current=g.area.title;
    this.frame(16,77,167,44);
    this.mark(27,94);this.text(current,38,96,current.length>9?14:17);
    this.add(16,77,167,44,()=>g.open("journal"));
    for(let i=0;i<4;i++) {
      const x=194+i*48, id=g.s.formation[i];
      this.frame(x,76,42,49);
      if(id) {
        this.rec(x+4,81,34,32,"#31394b");this.person(id,x+11,84,1,true);
        const p=g.s.members[id];
        this.bar(x+7,115,28,p.hp/stats(g.s,id).maxHp);
      }
      this.add(x,76,42,49,()=>g.open("party",{slot:i}));
    }
    [["地図","map","map"],["持ち物","bag","bag"],["編成","party","party"]].forEach(([name,kind,art],i)=>{
      this.button(name,16+i*126,752,118,53,()=>g.panel?.id===kind ? g.closePanel() : g.open(kind),g.panel?.id===kind,art);
    });
    }
  toast() {
    const {g}=this;
    if(g.toast && performance.now()<g.toast.until) {
      this.frame(45,695,312,36,true);
      if(g.toast.art) this.icon(g.toast.art,56,704,1);
      this.text(g.toast.text,201,712,14,GOLD,"center");
    }
  }
  modal(title,art,tabKind="") {
    this.rec(0,126,402,614,"#111522bf");this.frame(18,141,366,591);
    this.rec(29,194,344,524,"#1d2430");
    if(art)this.icon(art,38,159,2);
    this.text(title,72,173,22,GOLD);
    this.button("×",332,151,40,38,()=>this.g.closePanel());
    this.rec(31,194,339,2,"#a17857");
  }
  tabs(entries,y=204) {
    const gap=5, w=Math.floor((328-(entries.length-1)*gap)/entries.length);
    entries.forEach(([text,click,active],i)=>this.button(text,37+i*(w+gap),y,w,34,click,active));
  }
  party() {
    const p=this.g.panel, s=this.g.s;
    this.modal("編成","party");
    this.tabs([["編成",()=>this.g.open("party"),true],["装備",()=>this.g.open("equip"),false],["技",()=>this.g.open("skills"),false]]);
    for (let i=0;i<4;i++) {
      const id=s.formation[i], row=Math.floor(i/2), x=41+(i%2)*165, y=263+row*184;
      const active=p.slot===i;
      this.frame(x,y,155,165,active);
      this.rec(x+9,y+11,137,100,row?"#2c3c49":"#37404b");
      this.rec(x+20,y+16,115,95,row?"#34485a":"#3c4858");
      this.rec(x+36,y+100,83,8,"#29313e");
      this.text(row?"後列":i===0?"先頭・前列":"前列",x+14,y+18,11,row?COOL:GOLD);
      if (id) {
        const person=s.members[id];
        this.person(id,x+29,y+9,3);
        this.rec(x+7,y+112,141,45,"#24212e");
        this.text(CAST[id].name,x+14,y+124,17);
        this.text("Lv."+person.level,x+140,y+124,12,GOLD,"right");
        const max=stats(s,id).maxHp;
        this.text("体力",x+14,y+143,12,GREEN);
        this.text(person.hp+" / "+max,x+140,y+143,12,COOL,"right");
        this.bar(x+14,y+153,126,person.hp/max);
      } else {
        this.rec(x+47,y+73,60,6,"#252d3c");
        this.mark(x+77,y+53,"#576476");
      }
      this.add(x,y,155,165,()=>this.g.selectSlot(i));
    }
    const bench=Object.keys(s.members).filter(id=>!s.formation.includes(id));
    this.rec(39,632,325,66,"#231e2a");this.rec(45,632,313,2,"#88674a");
    if (bench.length) {
      this.text("控え",50,662,13,GOLD);
      bench.slice(0,5).forEach((id,index)=>{
        const x=94+index*49;
        this.frame(x,644,43,41,p.bench===id);this.person(id,x+12,650,1,true);
        this.add(x,644,43,41,()=>this.g.selectBench(id));
      });
    } else {
      this.mark(201,661,"#605254");this.rec(128,661,56,1,"#645650");this.rec(218,661,56,1,"#645650");
    }
  }
  selectedMember() {
    const people=this.g.s.formation.filter(Boolean);
    const i=this.g.panel.member||0;
    return {id:people[i % people.length], people, i};
  }
  personTabs(klass) {
    const {people,i}=this.selectedMember();
    people.forEach((id,n)=>{
      const x=39+n*81;
      this.frame(x,205,76,39,i===n);this.person(id,x+6,213,1,true);
      this.text(CAST[id].name,x+27,224,12);
      this.add(x,205,76,39,()=>this.g.open(klass,{member:n}));
    });
  }
  row(y,title,art,sub,click,{on=false,colour=PAPER}={}) {
    this.frame(38,y,325,58,on);
    this.rec(47,y+9,42,39,"#201f2b");
    if(art)this.icon(art,56,y+17,2);
    this.text(title,100,y+19,16,colour,"left",{max:248});
    if(sub)this.text(sub,100,y+39,12,COOL,"left",{max:248});
    this.add(38,y,325,58,click);
  }
  inventory(mode) {
    const {g}=this, s=g.s, p=g.panel;
    if(mode==="equip") {
      const {id}=this.selectedMember(); const member=s.members[id];
      this.modal("装備","starterSword");this.personTabs("equip");
      const slot=p.rail ?? 0;
      for(let i=0;i<6;i++) {
        const it=s.bag.find(entry=>entry.uid===member.gear[i]), art=it&&ITEMS[it.code].art;
        const x=38+(i%3)*109,y=255+Math.floor(i/3)*44;
        this.button(SLOTS[i],x,y,105,40,()=>g.open("equip",{member:p.member,rail:i}),slot===i,art);
      }
      const equipped=s.bag.find(item=>item.uid===member.gear[slot]);
      const options=s.bag.filter(item=>ITEMS[item.code].slot===Math.min(slot,4) && !holding(s,item.uid));
      if (equipped) this.row(347,ITEMS[equipped.code].name,ITEMS[equipped.code].art,"装備中　　"+GRADES[equipped.grade],null,{on:true});
      else this.row(347,SLOTS[slot]+"の枠","starterShield","空いている",null);
      this.pageRows(options,p.page,415,item=>{
        const a=ITEMS[item.code];
        const notes=[a.attack&&"攻め "+(a.attack+item.forged*2+item.grade),a.defense&&"守り "+(a.defense+item.forged+item.grade),a.health&&"体力 "+a.health].filter(Boolean).join("　");
        return [a.name,a.art,notes,()=>g.tryEquip(id,item.uid,slot)];
      });
      if (options.length && !equipped?.locked) this.text("着替え",56,343,10,COOL);
      this.button("おすすめ",157,688,148,31,()=>g.recommend(id,slot),false,"starterShield");
      return;
    }
    this.modal(mode==="shop"?"道具屋":"持ち物","bag");
    if(mode==="shop") {
      this.text(s.gold+" G",326,173,16,GOLD,"right");
      const stock=["salve","swordIron","steel","coat","hat","ring","lantern"];
      this.pageRows(stock,p.page,227,code=>{
        const item=ITEMS[code]||(code==="salve"?{name:"薬草",art:"herb",price:12}:null);
        return [item.name,item.art,item.price+" G",()=>g.buy(code)];
      },6);return;
    }
    const category=p.category||"bag";
    this.tabs([["装備",()=>g.open("bag",{category:"bag"}),category==="bag"],["材料",()=>g.open("bag",{category:"mat"}),category==="mat"],
      ["どうぐ",()=>g.open("bag",{category:"use"}),category==="use"],["受け取り",()=>g.open("bag",{category:"chest"}),category==="chest"]]);
    if(category==="mat") {
      Object.entries(MATERIALS).forEach(([key,m],i)=>this.row(258+i*65,m.name,m.art,String(s.materials[key]||0),null));
      return;
    }
    if(category==="use") {
      this.row(258,"薬草","herb",s.tools.salve+"個",()=>g.useSalve());
      this.row(323,"技の本","book",s.tools.book+"冊",()=>g.open("skills"));
      return;
    }
    const list=category==="chest"?s.chest:s.bag;
    if(!list.length)this.shelf("空の箱","chest");
    this.pageRows(list,p.page,252,item=>[ITEMS[item.code].name,ITEMS[item.code].art,
      GRADES[item.grade]+(item.forged?"　+"+item.forged:"")+(holding(s,item.uid)?"　装備中":item.locked?"　保護":""),
      category==="chest"?()=>g.receive(item.uid):()=>g.toggleLock(item.uid)],6);
    this.text(s.bag.length+" / "+POCKET,203,698,13,GOLD,"center");
  }
  pageRows(values,page,first,describe,count=4) {
    page=Math.max(0,Math.min(page||0,Math.ceil(values.length/count)-1));
    values.slice(page*count,(page+1)*count).forEach((val,i)=>this.row(first+i*64,...describe(val)));
    if(values.length>count) {
      const p=this.g.panel;
      this.button("‹",40,686,48,32,page>0?()=>this.g.open(p.id,{...p,page:page-1}):null);
      this.button("›",313,686,48,32,(page+1)*count<values.length?()=>this.g.open(p.id,{...p,page:page+1}):null);
    }
  }
  shelf(title,art) {
    this.frame(72,310,258,207);
    this.icon(art,176,353,4);
    this.text(title,201,455,18,COOL,"center");
  }
  skills() {
    const {g}=this, p=g.panel, {id}=this.selectedMember(), m=g.s.members[id];
    this.modal("技","book");this.personTabs("skills");
    const group=p.category||0;
    this.tabs([["通常",()=>g.open("skills",{member:p.member,category:0}),group===0],["アクティブ",()=>g.open("skills",{member:p.member,category:1}),group===1],
      ["パッシブ",()=>g.open("skills",{member:p.member,category:2}),group===2]],251);
    CAST[id].skills.forEach((skill,i)=>{
      if(Math.floor(Math.min(8,i)/3)!==group)return;
      const at=i-(group*3), y=293+at*64, ready=learning(m.level,i);
      const used=m.equipped.includes(i);
      const hint=ready?skill.description:"Lv."+LEARNING[i]+" で習得";
      this.row(y,skill.name,group===0?"starterSword":group===1?"tool_031":"book",hint,
        ready?()=>g.slotSkill(id,i):null,{on:used,colour:ready?PAPER:"#9296a4"});
      if(used) this.text("★"+(m.stars[i]||1),349,y+17,12,GOLD,"right");
    });
    if(senSkill(m,p) && this.g.s.tools.book>0) {
      this.button("技の本　"+g.s.tools.book+"冊",111,687,180,32,()=>g.upgradeSkill(id,p.selected),false,"book");
    }
    function senSkill(member,panel) {return Number.isInteger(panel.selected) && learning(member.level,panel.selected);}
  }
  forge() {
    const {g}=this,p=g.panel,s=g.s, type=p.category||"make";
    this.modal("鍛冶","starterAxe");
    this.tabs([["作る",()=>g.open("forge",{category:"make"}),type==="make"],["鍛える",()=>g.open("forge",{category:"raise"}),type==="raise"],
      ["組合せ",()=>g.open("forge",{category:"mix"}),type==="mix"],["分解",()=>g.open("forge",{category:"split"}),type==="split"]]);
    this.frame(39,253,324,112);
    this.rec(54,319,294,27,"#352d32");this.rec(72,316,246,4,"#987153");
    this.rec(128,293,145,9,"#6b717b");this.rec(146,302,106,17,"#434b56");
    this.rec(155,299,91,3,"#909095");this.rec(169,317,65,4,"#222632");
    const forge=g.forgeGlow;
    if(forge && g.time<forge.until){
      this.icon(forge.art,181,267,3);
      for(let i=0;i<9;i++){const phase=Math.floor(g.time/35)+i;this.rec(160+i*9+(phase%4),298-(phase%12)*3,2,2,i%2?"#ffe2a2":"#f39b55");}
    } else this.icon("starterAxe",180,264,3);
    if(type==="make") {
      RECIPES.forEach((r,i)=>{
        const item=ITEMS[r.item];
        const req=Object.entries(r.need).map(([k,n])=>MATERIALS[k].name+" ×"+n).join("　");
        this.row(375+i*64,item.name,item.art,req,()=>g.makeItem(r));
      });
    } else {
      const list=s.bag.filter(item=>type!=="split" || !item.locked && !holding(s,item.uid) && item.grade<4);
      if(!list.length)this.shelf("皿は空だ","starterAxe");
      this.pageRows(list,p.page,375,item=>{
        const def=ITEMS[item.code];
        return [def.name,def.art,type==="raise"?"鉄片 ×"+(item.forged+1):type==="mix"?(item.inlay?"光を組合せ済み":"灯火の粉 ×1"):p.selected?.includes(item.uid)?"皿にある":"鉄片 "+(1+item.forged),
          ()=>type==="raise"?g.raise(item.uid):type==="mix"?g.inlay(item.uid):g.collectSalvage(item.uid),{colour:GRADE_TINT[item.grade]}];
      });
      const page=Math.max(0,Math.min(p.page||0,Math.ceil(list.length/4)-1));
      list.slice(page*4,page*4+4).forEach((item,i)=>{
        const owner=Object.keys(s.members).find(id=>s.members[id].gear.includes(item.uid));
        if(owner)this.person(owner,332,388+i*64,1,true);
      });
      if(type==="split" && p.selected?.length) {
        const returns=s.bag.filter(item=>p.selected.includes(item.uid)).reduce((n,item)=>n+item.forged+1,0);
        this.icon("ore",89,342,2);
        this.text("鉄片 +"+returns,115,345,12,GOLD);
        this.button(p.selected.length+"点を分解",109,687,188,33,()=>g.doSalvage(),true,"starterAxe");
      }
    }
    this.text("鉄片 "+s.materials.iron,320,342,12,GOLD,"right");
  }
  map() {
    const {g}=this;
    this.modal("地図","map");
    this.tabs([["地図",()=>g.open("map"),true],["帳面",()=>g.open("journal"),false],["記録",()=>g.open("save"),false]]);
    const x=38,y=252,w=326,h=435;
    this.rec(x,y,w,h,"#5a584d");
    for(let row=0;row<27;row++)for(let col=0;col<20;col++){
      const n=(Math.imul(row+91,5671)^Math.imul(col+19,823))>>>0;
      const river=13+(row>11?1:0)-(row>20?3:0);
      this.rec(x+col*16,y+row*16,16,16,col===river?"#435d64":["#666151","#696654","#585849","#736853"][n%4]);
      if(n%7===0 && col!==river)this.rec(x+col*16+3,y+row*16+4,5,3,"#827460");
    }
    const positions={road:[103,602],town:[103,456],gate:[128,348],court:[160,322],hall:[193,289],
      nord:[245,381],watch:[283,320],ridge:[218,469],bridge:[268,492],high:[277,547],pine:[85,536],roots:[66,501],
      cald:[321,527],fire:[318,566],ashgate:[316,613],saddle:[350,553],burrow:[348,591],tarka:[266,619],towers:[213,620],sails:[173,593],sky:[193,553],liena:[152,450],canopy:[188,411],beam:[171,376],net:[244,281],nelva:[325,316],trunk:[329,271],plate:[294,300],crown:[287,353],mushroom:[337,371]};
    const routes=[["road","town"],["town","gate"],["gate","court"],["court","hall"],["hall","nord"],["nord","watch"],
      ["nord","ridge"],["ridge","bridge"],["watch","bridge"],["bridge","high"],["road","pine"],["pine","roots"],["high","cald"],["cald","fire"],["fire","ashgate"],["cald","saddle"],["saddle","burrow"],["ashgate","tarka"],["tarka","towers"],["towers","sails"],["sails","sky"],["sky","liena"],["liena","canopy"],["canopy","beam"],["beam","net"],["liena","nelva"],["nelva","trunk"],["trunk","plate"],["plate","crown"],["nelva","mushroom"]];
    for(const [a,b] of routes){
      const [x1,y1]=positions[a],[x2,y2]=positions[b];
      for(let i=0;i<=24;i++){const q=i/24;this.rec(x1+(x2-x1)*q,y1+(y2-y1)*q,2,2,"#a19369");}
    }
    for(const [id,[u,v]] of Object.entries(positions)){
      if(!g.s.seen[id] && id!==g.area.id) continue;
      const area=AREAS[id];
      this.frame(u-12,v-12,24,24,id===g.area.id);
      this.icon(area.safe?"map":"stone",u-5,v-5,1);
      this.add(u-16,v-16,32,32,()=>{if(area.safe)g.travel(id,area.start);else g.notice(area.title,"map");});
    }
    this.frame(56,654,291,35);
    this.text(g.area.title,201,672,17,GOLD,"center");
  }
  journal() {
    const {g}=this,p=g.panel;
    this.modal("帳面","book");
    this.tabs([["旅の記録",()=>g.open("journal"),!p.category],["図鑑",()=>g.open("journal",{category:"guide"}),p.category==="guide"],
      ["記録",()=>g.open("save"),false]]);
    if(p.category==="guide") {
      const found=Object.keys(g.s.lore).filter(id=>ENEMIES[id]);
      if(!found.length)this.shelf("白紙の頁","book");
      this.pageRows(found,p.page,255,id=>{
        const e=ENEMIES[id];return [e.name,e.art,g.s.lore[id].wins+"回",()=>g.open("enemyPage",{code:id})];
      },6);
    } else {
      this.frame(47,264,309,99);this.icon("map",69,285,3);
      this.text("第"+g.s.chapter+"章",120,292,20,GOLD);
      this.text(g.area.title,120,326,15,COOL);
      Object.entries({body:["玉座庭","sealIcon"],seal:["黒鉄の板","sealIcon"],crown:["冠","coin"],rewindSeen:["肋の渡り板","rope"],rescued:["荷車の綱","rope"],
        C1:["尾根の火","tool_031"]}).filter(([k])=>g.s.flags[k]).slice(0,5).forEach(([k,[title,art]],i)=>this.row(379+i*60,title,art,"",null));
    }
  }
  save() {
    this.modal("記録","book");
    const {g}=this;
    for(let i=0;i<3;i++){
      const s=g.book.get(i), y=226+i*147;
      this.frame(47,y,309,133);
      this.icon("map",63,y+21,3);
      this.text(i===0?"自動記録":"旅の記録 "+i,118,y+28,18,GOLD);
      this.text(s?"第"+s.chapter+"章　"+(AREAS[s.position.area]?.title||""):"空の記録",118,y+54,13,COOL);
      if(i&&g.s)this.button("記す",60,y+79,137,38,()=>g.saveSlot(i),false,"book");
      if(s)this.button("読む",209,y+79,133,38,()=>g.load(i),false,"map");
    }
    if(g.s)this.button("表題へ",103,688,197,32,()=>g.toTitle());
  }
  result() {
    const {g}=this, entry=g.result, s=g.s;
    this.modal(entry.victorious?"勝利":entry.stalemate?"引き上げた":"敗北",entry.victorious?"coin":"starterShield");
    this.frame(47,221,309,131,entry.victorious);
    if(entry.victorious) {
      this.icon("coin",72,248,4);this.text(entry.gold+" G",135,272,20,GOLD);
      this.text("経験 "+entry.xp,136,314,16,COOL);
      if(entry.item){
        const grade=entry.item.grade,a=ITEMS[entry.item.code];
        this.row(366,a.name,a.art,GRADES[grade]+(entry.chest?"　受け取り箱":""),null,{on:true,colour:GRADE_TINT[grade]});
        if(grade>=4)for(let k=0;k<8;k++){
          const t=(Math.floor(g.time/95)+k*7)%34;
          this.rec(46+(k*17)%49,413-t,2,2,GRADE_TINT[grade]);
        }
      }
      else this.row(366,MATERIALS[entry.mat].name,MATERIALS[entry.mat].art,"× "+entry.quantity,null);
    } else {
      this.icon("starterShield",80,253,4);this.text("手当てを受けた",139,277,17,COOL);
    }
    const reasons={cover:"かばった",stop:"大技を止めた",feed:"力を渡して大技",revive:"立て直した"};
    const recent=entry.reasons.filter((r,i,a)=>a.findIndex(t=>t.kind===r.kind&&t.actor===r.actor)===i).slice(0,3);
    recent.forEach((r,i)=>{
      const y=437+i*66;this.frame(38,y,325,57);this.person(r.actor,52,y+12,1,true);
      if(r.friend){
        this.person(r.friend,84,y+12,1,true);
        if(r.kind==="feed")this.rec(72+Math.floor(g.time/60)%16,y+29,3,1,"#b0dcf1");
        if(r.kind==="cover")this.icon("starterShield",70,y+40,1);
      }else this.icon("starterSword",83,y+15,2);
      this.text(reasons[r.kind],136,y+21,15,GOLD);this.text(partyName(r.actor),136,y+40,12,COOL);
    });
    this.button("戻る",97,666,208,47,()=>g.leaveResult(),true,"map");
  }
  drawPanel() {
    const {id}=this.g.panel;
    const g=this.g;
    if(id==="party")this.party();
    if(["bag","equip","shop"].includes(id))this.inventory(id);
    if(id==="map")this.map();
    if(id==="journal")this.journal();
    if(id==="skills")this.skills();
    if(id==="forge")this.forge();
    if(id==="save")this.save();
    if(id==="result")this.result();
    if(id==="cards")g.cards.draw(this);
    if(id==="chapterEnd") {
      this.modal("旅の記録","map");this.shelf("第6章　了","book");
      this.button("戻る",97,666,208,42,()=>g.closePanel(),true,"map");
    }
    if(id==="enemyPage") {
      const e=ENEMIES[g.panel.code], image=g.bank.images[e.art];
      this.modal(e.name,"book");
      this.frame(46,235,310,267);
      if(image)this.c.drawImage(image,U(201)-Math.floor(image.naturalWidth/2),U(354)-Math.floor(image.naturalHeight/2));
      this.text("出会った回数　"+g.s.lore[g.panel.code].wins,201,477,14,GOLD,"center");
      this.button("図鑑",109,655,184,43,()=>g.open("journal",{category:"guide"}),true,"book");
    }
  }
  title() {
    const {g}=this;
    this.rec(0,0,402,874,"#14172675");this.rec(0,158,402,432,"#181c2cb8");
    this.rec(37,218,328,1,"#ad835d");
    this.mark(201,218,"#dcac7e");
    this.text("魔王は",201,282,40,GOLD,"center",{weight:800,outline:1.4});
    this.text("昨日死んだ",201,339,48,PAPER,"center",{weight:800,outline:1.5});
    this.rec(52,397,298,1,"#9a7356");this.mark(201,397);
    this.person("H01",177,425,2);
    this.button("はじめから",95,547,212,54,()=>g.newGame(),!g.book.get(0),"starterSword");
    const slots=g.book.get(0);
    if(slots)this.button("つづきから",95,611,212,54,()=>g.load(0),true,"book");
    if(g.book.get(1)||g.book.get(2))this.button("記録を開く",95,675,212,48,()=>g.open("titleSave"),false,"map");
    if(g.panel?.id==="titleSave"){this.links=[];this.save();}
    if(g.panel?.id==="newConfirm"){
      this.links=[];this.modal("新しい旅","book");
      this.shelf("自動記録を上書きする","book");
      this.button("はじめから",55,652,148,49,()=>g.newGame(true),true);
      this.button("戻る",207,652,148,49,()=>g.closePanel());
    }
    if(g.book.error)this.text("記録を開けません",201,764,14,COOL,"center");
  }
}
