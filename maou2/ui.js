"use strict";

const GOLD="#efcea0", PAPER="#f3e4c8", COOL="#bdcde4", GREEN="#a6cc95";
const GRADE_TINT=["#eddfc4","#b6df99","#acd4f8","#d9b6f8","#ffdb8c","#f8bfe7"];
const FRAME_COLORS={
  warm:{edge:"#865f4a",bright:"#d9a96c",wood:"#513d3c",paper:"#262933",chosen:"#383344",rim:"#bb8c62",line:"#695048"},
  night:{edge:"#687da4",bright:"#adc6ee",wood:"#273954",paper:"#172438",chosen:"#2a3d5b",rim:"#92accf",line:"#41597b"},
  white:{edge:"#afb5bf",bright:"#f1e7cb",wood:"#4b4e57",paper:"#17191e",chosen:"#343845",rim:"#d4d5d5",line:"#646872"},
};

class GameUI {
  constructor(game) { this.g=game; this.links=[]; this.labels=[]; }
  begin(ctx) { this.c=ctx;ctx.imageSmoothingEnabled=false;this.links=[];this.labels=[]; }
  rec(x,y,w,h,color) {
    const c=this.c,left=uiDotX(c,x),top=uiDotY(c,y);
    c.fillStyle=color;c.fillRect(left,top,uiDotX(c,x+w)-left,uiDotY(c,y+h)-top);
  }
  text(text,x,y,size=15,color=PAPER,align="left",extra={}) {this.labels.push({text:String(text),x,y,size,color,align,...extra});}
  frame(x,y,w,h,on=false) {
    const c=this;
    const p=FRAME_COLORS[this.g.s?.options?.theme]||FRAME_COLORS.warm;
    c.rec(x+3,y+4,w-4,h,"#101421b0");c.rec(x,y+5,w,h-9,on?p.bright:p.edge);
    c.rec(x+4,y,w-8,h,on?p.bright:p.edge);
    c.rec(x+3,y+3,w-6,h-6,p.wood);
    c.rec(x+5,y+5,w-10,h-10,on?p.chosen:p.paper);
    c.rec(x+8,y+2,w-16,1,on?p.bright:p.rim);
    c.rec(x+8,y+h-4,w-16,1,p.line);
    for(const dx of [5,w-7])for(const dy of [5,h-7])c.rec(x+dx,y+dy,2,2,on?p.bright:p.rim);
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
    const cx=uiDotX(this.c,x),cy=uiDotY(this.c,y);
    if(w>32||h>32) this.c.drawImage(image,Math.floor((w-24)/2),Math.max(0,Math.floor((h-24)/2)),24,24,cx,cy,24*scale,24*scale);
    else this.c.drawImage(image,cx,cy,w*scale,h*scale);
  }
  person(id,x,y,scale=1,face=false) {
    const image=this.g.bank.images[id];if(!image)return;
    const [sx,sy,sw,sh]=face?[58,4,28,32]:[48,0,48,60];
    this.c.drawImage(image,sx,sy,sw,sh,uiDotX(this.c,x),uiDotY(this.c,y),sw*scale,sh*scale);
  }
  bar(x,y,w,ratio,palette=["#1c252b","#70a378","#a9ce93"]) {
    this.rec(x,y,w,5,palette[0]);
    const width=Math.max(0,Math.min(w,Math.round(w*ratio)));
    this.rec(x,y,width,4,palette[1]);this.rec(x,y,width,1,palette[2]);
  }
  exitNote() {
    const {field,layout}=this.g,[col,row]=field.trail[0];
    const distance=o=>Math.abs(o.col-col)+Math.abs(o.row-row);
    const door=field.objects.filter(o=>o.passage&&distance(o)<=2).sort((a,b)=>distance(a)-distance(b))[0];
    if(!door)return;
    const [x,feet]=FIELD_COORD(door.col,door.row);
    const low=door.passage.style==="stairs"||door.passage.style==="path";
    const dot=FIELD_PIXEL/layout.dpi;
    const [u,v]=layout.point((x-field.camera.x)*dot,(feet-field.camera.y-(low?35:63))*dot);
    const w=Math.min(168,door.label.length*12+26);
    const center=Math.max(9+w/2,Math.min(393-w/2,u));
    const y=Math.max(130,Math.min(720,v));
    this.frame(center-w/2,y-11,w,23);
    this.text(door.label,center,y,12,GOLD,"center",{max:w-10});
  }
  hud() {
    const {g}=this;
    const current=g.area.title;
    this.frame(16,77,167,44);
    this.mark(27,94);this.text(current,38,96,current.length>9?14:17,PAPER,"left",{max:140});
    this.add(16,77,167,44,()=>g.open("journal"));
    for(let i=0;i<4;i++) {
      const x=194+i*48, id=g.s.formation[i];
      this.frame(x,76,42,49);
      if(id) {
        this.rec(x+4,81,34,32,"#31394b");this.person(id,x+11,84,1,true);
        const p=g.s.members[id];
        this.bar(x+7,115,28,p.hp/stats(g.s,id).maxHp);
      }
      this.add(x,76,42,49,()=>id?g.open("status",{who:id}):g.open("party",{slot:i,back:{id:"status"}}));
    }
    const groups={status:["status","equip","skills","party","toolTarget"],bag:["bag","itemPage"],map:["map"],
      journal:["journal","dex","enemyPage","save","settings"]};
    [["仲間","status","party"],["持ち物","bag","bag"],["地図","map","map"],["旅の帳","journal","book"]].forEach(([name,kind,art],i)=>{
      const x=11+i*96,y=752,w=91,h=53,on=groups[kind].includes(g.panel?.id);
      this.frame(x,y,w,h,on);
      if(kind==="status"){this.rec(x+8,y+12,28,30,"#31394b");this.person(g.s.formation[0]||"H01",x+8,y+11,1,true);}
      else this.icon(art,x+9,y+15,2);
      this.text(name,x+33,y+27,name.length>2?13:15,on?GOLD:PAPER,"left",{max:53});
      this.add(x,y,w,h,()=>on?g.closePanel():g.open(kind));
    });
    }
  toast() {
    const {g}=this;
    if(g.toast && performance.now()<g.toast.until) {
      const compact=Boolean(g.panel),y=compact?123:695,h=compact?22:36;
      this.frame(45,y,312,h,true);
      if(g.toast.art)this.icon(g.toast.art,56,y+(compact?5:9),1);
      this.text(g.toast.text,201,y+h/2,compact?12:14,GOLD,"center",{max:261});
    }
  }
  modal(title,art) {
    this.rec(0,126,402,614,"#111522bf");this.frame(18,141,366,591);
    this.rec(29,194,344,524,"#1d2430");
    const back=Boolean(this.g.panel?.back);
    if(back)this.button("‹",33,151,35,38,()=>this.g.backPanel());
    if(art)this.icon(art,back?77:38,159,2);
    this.text(title,back?109:72,173,22,GOLD,"left",{max:218});
    this.button("×",332,151,40,38,()=>this.g.closePanel());
    this.rec(31,194,339,2,"#a17857");
  }
  tabs(entries,y=204) {
    const gap=5, w=Math.floor((328-(entries.length-1)*gap)/entries.length);
    entries.forEach(([text,click,active],i)=>this.button(text,37+i*(w+gap),y,w,34,click,active));
  }
  menu() {
    const {g}=this,{s}=g;
    const open=(id,details={})=>g.open(id,{...details,back:{id:"menu"}});
    this.modal("メニュー","book");
    this.frame(38,208,326,121);
    s.formation.forEach((id,i)=>{
      const x=45+i*79;
      this.frame(x,214,74,109);
      if(!id){this.mark(x+37,269,"#625664");return;}
      const m=s.members[id],hp=stats(s,id).maxHp;
      const avatarScale=g.layout.y(301)-g.layout.y(218)>=80?2:1;
      this.person(id,x+(avatarScale===2?5:21),218,avatarScale);
      this.bar(x+8,316,58,m.hp/hp);
      this.text(CAST[id].name,x+37,306,12,PAPER,"center",{max:59});
      this.add(x,214,74,109,()=>open("status",{who:id}));
    });
    this.button("一括そうび",38,341,159,44,()=>g.recommendAll(),false,"starterShield");
    this.button("自動回復 "+(s.options.autoHeal?"入":"切"),204,341,159,44,
      ()=>g.option("autoHeal",!s.options.autoHeal),s.options.autoHeal,"herb");
    const entries=[
      ["ステータス","status","party"],["そうび","equip","starterSword"],
      ["スキル","skills","tool_031"],["どうぐ","bag","herb",{category:"use"}],
      ["素材","bag","ore",{category:"mat"}],["装備品","bag","bag"],
      ["図鑑","dex","book"],["設定","settings","stone"],
      ["編成","party","flag"],["記録","save","map"],
    ];
    entries.forEach(([name,id,art,detail],i)=>{
      const x=38+(i%2)*166,y=398+Math.floor(i/2)*54;
      this.button(name,x,y,159,48,()=>open(id,detail),false,art);
    });
    this.icon("coin",53,681,2);
    this.text(s.gold+" G",82,693,15,GOLD);
    this.text("第"+s.chapter+"章",348,693,15,COOL,"right");
  }
  status() {
    const {g}=this,{s}=g,{id,i,people}=this.selectedMember(),m=s.members[id];
    const cur=stats(s,id),base=stats(s,id,[]);
    const here={id:"status",details:{member:i}};
    this.modal("仲間",null);
    this.rec(37,155,30,32,"#31394b");this.person(s.formation[0]||id,38,155,1,true);
    // 仲間の顔（出撃の4人、そのあと控え）
    people.slice(0,7).forEach((pid,n)=>{
      const x=38+n*47,bench=!s.formation.includes(pid);
      this.frame(x,203,44,42,n===i);
      this.rec(x+6,209,32,30,bench?"#262a33":"#31394b");
      this.person(pid,x+8,209,1,true);
      if(bench){this.rec(x+6,209,32,30,"#14172a80");this.text("控",x+35,236,10,COOL,"center",{sans:true});}
      this.add(x,203,44,42,()=>g.open("status",{member:n}));
    });
    // 顔・名前・レベル・体力
    this.frame(38,252,326,86,true);
    this.rec(49,262,66,66,"#283545");this.rec(52,265,60,60,"#314355");
    this.person(id,53,262,2,true);
    const at=s.formation.indexOf(id);
    this.text(CAST[id].name,127,276,21,GOLD,"left",{max:150});
    this.text("Lv "+m.level,352,277,17,PAPER,"right",{sans:true});
    this.text(at<0?"控え":at<2?"前列":"後列",127,301,12,COOL);
    this.text(m.level>=99?"最高レベル":"次のレベルまで "+Math.max(0,levelCost(m.level)-m.xp),352,301,12,COOL,"right");
    this.text("体力",127,322,13,GREEN);
    this.bar(161,321,116,m.hp/cur.maxHp);
    this.text(m.hp+" / "+cur.maxHp,352,322,14,PAPER,"right",{sans:true});
    // 能力（2列。装備で増えた分を緑で）
    this.frame(38,345,326,96);
    const cells=[["攻撃","attack"],["防御","defense"],["魔法","magic"],["魔防","magicDefense"],
      ["速さ","speed"],["会心率","critical","%"],["間合い","ranged"],["属性","element"]];
    const ELEM={fire:"火",ice:"氷",thunder:"雷",dark:"闇",light:"光",wind:"風",earth:"土",water:"水"};
    cells.forEach(([label,key,suf=""],n)=>{
      const x=n%2?211:52,y=364+Math.floor(n/2)*20;
      this.text(label,x,y,13,COOL);
      if(key==="ranged"){this.text(cur.ranged?"遠い":"近い",x+92,y,14,PAPER,"right");return;}
      if(key==="element"){this.text(cur.element?(ELEM[cur.element]||cur.element):"なし",x+92,y,14,cur.element?GOLD:"#8e93a3","right");return;}
      this.text(cur[key]+suf,x+92,y,14,PAPER,"right",{sans:true});
      const d=cur[key]-base[key];
      if(d)this.text((d>0?"+":"")+d,x+98,y,11,d>0?GREEN:"#e59a8c","left",{sans:true});
    });
    // 装備（押すと、その枠の品を選ぶ）
    for(let slot=0;slot<6;slot++){
      const x=slot%2?203:38,y=449+Math.floor(slot/2)*45,w=161,h=42;
      const it=s.bag.find(e=>e.uid===m.gear[slot]),a=it&&ITEMS[it.code];
      this.frame(x,y,w,h);
      this.text(SLOTS[slot],x+11,y+21,11,COOL);
      this.rec(x+36,y+8,26,26,"#171c2b");
      if(a){
        this.icon(a.art,x+37,y+9,1);
        this.text(a.name+(it.forged?" +"+it.forged:""),x+69,y+21,13,GRADE_TINT[it.grade],"left",{max:w-76});
      } else this.text("なし",x+69,y+21,13,"#7d8291");
      this.add(x,y,w,h,()=>g.open("equip",{member:i,rail:slot,page:0,back:here}));
    }
    // 技（通常・アクティブ・パッシブ2つ）
    this.frame(38,587,326,92);
    const KIND=[["通常","#3e5f97","#8fb2ea"],["アクティブ","#8a6a2e","#f0cd84"],["パッシブ","#5d4790","#c3a8f0"],["パッシブ","#5d4790","#c3a8f0"]];
    for(let n=0;n<4;n++){
      const cx=79+n*80,key=m.equipped[n],[kname,dark,light]=KIND[n];
      const locked=n===3&&!s.flags.B02;
      this.text(kname,cx,600,10,COOL,"center");
      if(Number.isInteger(key)&&!locked){
        const sk=CAST[id].skills[key];
        this.rec(cx-17,609,34,32,light);this.rec(cx-15,611,30,28,dark);
        this.text(sk.name[0],cx,625,18,"#fff6e0","center",{weight:800});
        this.text(sk.name,cx,652,11,PAPER,"center",{max:76});
        this.text("★".repeat(m.stars[key]||1),cx,667,9,GOLD,"center",{sans:true});
      } else {
        this.rec(cx-17,609,34,32,"#2a2d3a");this.rec(cx-15,611,30,28,"#1d2030");
        this.text(locked?"鍵":"空",cx,625,13,"#6f7486","center");
        this.text(locked?"まだ使えない":"なし",cx,652,10,"#7d8291","center");
      }
      this.add(cx-40,592,80,84,locked?null:()=>g.open("skills",{member:i,category:Math.min(n,2),back:here}));
    }
    // 下：おすすめの装備と、並び替え
    this.button("おすすめ装備",38,686,159,40,()=>g.recommendMember(id),false,"starterShield");
    this.button("並び・控え",205,686,159,40,()=>g.open("party",{back:here}),false,"flag");
  }
  settings() {
    const {g}=this,{s}=g,o=s.options;
    this.modal("旅の帳","book");this.bookTabs("settings");
    const shelf=(title,art,y)=>{
      this.frame(38,y,326,86);
      this.icon(art,52,y+11,1);
      this.text(title,71,y+18,14,GOLD);
    };
    shelf("戦闘のはやさ","flag",249);
    [1,2,4].forEach((n,i)=>this.button(n+"倍",49+i*102,281,99,40,()=>g.option("speed",n),s.speed===n));
    shelf("画面の色","lantern",339);
    [["warm","暖かな色"],["night","夜空"],["white","白わく"]].forEach(([key,label],i)=>{
      this.button(label,49+i*102,371,99,40,()=>g.option("theme",key),o.theme===key);
    });
    shelf("拾った装備を自動で売る","coin",429);
    [0,1,2].forEach((grade,i)=>this.button(GRADES[grade],49+i*102,461,99,40,
      ()=>g.option("sell",o.sell.includes(grade)?o.sell.filter(g=>g!==grade):[...o.sell,grade]),o.sell.includes(grade)));
    shelf("戦闘後に薬草で回復","herb",519);
    this.button("オン",49,551,149,40,()=>g.option("autoHeal",true),o.autoHeal);
    this.button("オフ",205,551,149,40,()=>g.option("autoHeal",false),!o.autoHeal);
    this.frame(38,612,326,52);
    this.icon("lantern",53,629,1);this.text("音",72,638,14,GOLD);this.text("まだない",345,638,14,COOL,"right");
  }
  party() {
    const {g}=this,p=g.panel,s=g.s;
    this.modal("並び・控え","flag");
    for (let i=0;i<4;i++) {
      const id=s.formation[i], row=Math.floor(i/2), x=41+(i%2)*165, y=214+row*184;
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
    this.rec(39,590,325,66,"#231e2a");this.rec(45,590,313,2,"#88674a");
    if (bench.length) {
      this.text("控え",50,620,13,GOLD);
      const size=bench.length>5?4:5,page=Math.min(p.benchPage||0,Math.ceil(bench.length/size)-1);
      bench.slice(page*size,(page+1)*size).forEach((id,index)=>{
        const x=94+index*49;
        this.frame(x,602,43,41,p.bench===id);this.person(id,x+12,608,1,true);
        this.add(x,602,43,41,()=>this.g.selectBench(id));
      });
      if(bench.length>5){
        if(page>0)this.button("‹",290,602,32,41,()=>g.open("party",{...p,benchPage:page-1}));
        if(page+1<Math.ceil(bench.length/size))this.button("›",326,602,32,41,()=>g.open("party",{...p,benchPage:page+1}));
      }
    } else {
      this.mark(201,619,"#605254");this.rec(128,619,56,1,"#645650");this.rec(218,619,56,1,"#645650");
    }
  }
  selectedMember() {
    const {s,panel}=this.g;
    const people=[...s.formation.filter(Boolean),...Object.keys(s.members).filter(id=>!s.formation.includes(id))];
    const i=Math.max(0,Math.min(people.length-1,panel.member??people.indexOf(panel.who)));
    return {id:people[i],people,i};
  }
  personTabs(klass) {
    const {people,i}=this.selectedMember(),p=this.g.panel;
    const visible=people.length>4?3:4,start=Math.floor(i/visible)*visible;
    const select=member=>this.g.open(klass,{...p,member,who:null,page:0,selected:null});
    people.slice(start,start+visible).forEach((id,n)=>{
      const x=39+n*81;
      this.frame(x,205,76,39,i===start+n);this.person(id,x+6,213,1,true);
      this.text(CAST[id].name,x+27,224,12);
      this.add(x,205,76,39,()=>select(start+n));
    });
    if(visible===3){
      this.button("‹",282,205,36,39,start>0?()=>select(start-3):null);
      this.button("›",321,205,36,39,start+3<people.length?()=>select(start+3):null);
    }
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
      const slot=p.rail ?? 0;
      this.modal(CAST[id].name+"の"+SLOTS[slot],ITEMS[s.bag.find(e=>e.uid===member.gear[slot])?.code]?.art||null);
      const equipped=s.bag.find(item=>item.uid===member.gear[slot]);
      const options=s.bag.filter(item=>ITEMS[item.code].slot===Math.min(slot,4) && !holding(s,item.uid));
      if (equipped) this.row(206,ITEMS[equipped.code].name+(equipped.forged?" +"+equipped.forged:""),ITEMS[equipped.code].art,"いま装備している　"+GRADES[equipped.grade],null,{on:true,colour:GRADE_TINT[equipped.grade]});
      else this.row(206,"なし","starterShield","この枠は空いている",null);
      this.rec(45,272,313,2,"#88674a");
      if(!options.length)this.text("替えられる品がない",201,330,14,COOL,"center");
      this.pageRows(options,p.page,284,item=>{
        const a=ITEMS[item.code];
        const proposed=member.gear.slice();proposed[slot]=item.uid;
        const before=stats(s,id),after=stats(s,id,proposed);
        const names={attack:"攻撃",defense:"防御",maxHp:"体力",speed:"速さ",magic:"魔法",magicDefense:"魔防",critical:"会心"};
        const notes=Object.keys(names).filter(k=>after[k]!==before[k]).slice(0,3).map(k=>{
          const diff=after[k]-before[k];return names[k]+(diff>0?"+":"")+diff+(k==="critical"?"%":"");
        }).join("　");
        return [a.name+(item.forged?" +"+item.forged:""),a.art,notes||GRADES[item.grade],()=>{g.tryEquip(id,item.uid,slot);g.backPanel();},{colour:GRADE_TINT[item.grade]}];
      },6);
      return;
    }
    if(mode==="shop") {
      this.modal("道具屋","bag");
      const sell=p.category==="sell";
      this.tabs([["買う",()=>g.open("shop"),!sell],["売る",()=>g.open("shop",{category:"sell"}),sell]]);
      this.icon("coin",249,250,1);this.text(s.gold+" G",347,256,15,GOLD,"right");
      if(sell){
        const sellable=s.bag.filter(i=>!i.locked&&!holding(s,i.uid));
        if(!sellable.length)this.shelf("売れる装備はない","coin");
        this.pageRows(sellable,p.page,276,item=>[ITEMS[item.code].name,ITEMS[item.code].art,itemPrice(item)+" G",
          ()=>g.sell(item.uid),{colour:GRADE_TINT[item.grade]}],6);
        return;
      }
      const stock=["salve","swordIron","steel","coat","hat","ring","lantern"];
      this.pageRows(stock,p.page,276,code=>{
        const item=ITEMS[code]||(code==="salve"?{name:"薬草",art:"herb",price:12}:null);
        return [item.name,item.art,item.price+" G",()=>g.buy(code)];
      },6);return;
    }
    const category=p.category||"use";
    this.modal("持ち物","bag");
    this.icon("coin",250,162,1);this.text(s.gold+" G",320,173,15,GOLD,"right",{sans:true});
    this.tabs([["どうぐ",()=>g.open("bag",{category:"use"}),category==="use"],["装備品",()=>g.open("bag",{category:"bag"}),category==="bag"],
      ["素材",()=>g.open("bag",{category:"mat"}),category==="mat"],["受け取り",()=>g.open("bag",{category:"chest"}),category==="chest"]]);
    if(category==="mat") {
      Object.entries(MATERIALS).forEach(([key,m],i)=>{
        this.row(258+i*65,m.name,m.art,["武器と盾を作る・鍛える","盾や飾りを作る","武器や外套を作る","飾りを作る・組み合わせる"][i],null);
        this.text(s.materials[key]||0,340,275+i*65,14,GOLD,"right",{sans:true});
      });
      return;
    }
    if(category==="use") {
      this.row(258,"薬草","herb",s.tools.salve+"個　体力を回復",s.tools.salve?()=>g.open("toolTarget",{back:{id:"bag",details:{...p}}}):null);
      this.row(323,"技の本","book",s.tools.book+"冊　技を強くする",()=>g.open("skills",{back:{id:"bag",details:{...p}}}));
      return;
    }
    const list=(category==="chest"?s.chest:s.bag).slice();
    const order=s.options.sort;
    const value=i=>ITEMS[i.code].price+i.forged*11+i.grade*24;
    list.sort((a,b)=>{
      if(order==="slot")return ITEMS[a.code].slot-ITEMS[b.code].slot||b.grade-a.grade;
      if(order==="new")return Number(b.uid.slice(1))-Number(a.uid.slice(1));
      if(order==="power")return value(b)-value(a);
      return b.grade-a.grade||b.forged-a.forged;
    });
    this.tabs([["レア度","grade"],["部位","slot"],["新しい順","new"],["強さ","power"]].map(([label,key])=>
      [label,()=>{g.option("sort",key);g.open("bag",{...p,page:0});},key===order]),247);
    if(!list.length)this.shelf("空の箱","chest");
    this.pageRows(list,p.page,287,item=>[ITEMS[item.code].name,ITEMS[item.code].art,
      GRADES[item.grade]+(item.forged?"　+"+item.forged:"")+(holding(s,item.uid)?"　装備中":item.locked?"　保護":""),
      category==="chest"?()=>g.receive(item.uid):()=>g.open("itemPage",{uid:item.uid,back:{id:"bag",details:{...p}}}),
      {colour:GRADE_TINT[item.grade]}],6);
    this.text(s.bag.length+" / "+POCKET,203,698,13,GOLD,"center");
  }
  itemPage() {
    const {g}=this,{s,panel}=g;
    const item=s.bag.find(o=>o.uid===panel.uid),a=ITEMS[item.code];
    this.modal("装備品","bag");
    this.frame(47,220,307,149,true);this.icon(a.art,65,250,5);
    this.text(a.name,137,269,20,GRADE_TINT[item.grade],"left",{max:203});
    this.text(SLOTS[a.slot]+"　"+GRADES[item.grade]+(item.forged?" ＋"+item.forged:""),137,309,15,COOL);
    const notes=[["攻撃",(a.attack||0)+(a.slot===0?item.grade+item.forged*2:0)],
      ["防御",(a.defense||0)+(a.slot!==0?item.grade+item.forged:0)],["体力",(a.health||0)+item.grade*2],
      ["速さ",a.speed||0],["魔法の補正",a.magic||0],["魔法防御の補正",a.magicDefense||0],["会心率",a.critical?"+"+a.critical+"%":0]];
    notes.filter(([,v])=>v).forEach(([label,value],i)=>{
      const y=396+i*29;
      this.rec(49,y-10,298,23,i%2?"#2b2834":"#212934");
      this.text(label,59,y,14,PAPER);this.text(value,334,y,14,GOLD,"right");
    });
    if(item.inlay||a.element)this.text("属性の力",61,624,13,COOL);
    const protectedItem=item.grade>=4||a.unique||holding(s,item.uid);
    const owner=Object.keys(s.members).find(id=>s.members[id].gear.includes(item.uid));
    if(owner){this.person(owner,57,678,1,true);this.text(CAST[owner].name+"が装備中",82,694,14,COOL);}
    else this.button(item.locked?"保護中":"保護する",102,668,196,44,protectedItem?null:()=>g.toggleLock(item.uid),item.locked,"starterShield");
  }
  toolTarget() {
    const {g}=this,{s}=g;
    this.modal("薬草","herb");
    const people=s.formation.filter(Boolean);
    people.forEach((id,i)=>{
      const y=224+i*107,m=s.members[id],hp=stats(s,id).maxHp;
      this.frame(39,y,325,96);
      this.person(id,54,y+12,2);
      this.text(CAST[id].name,142,y+24,17,PAPER);
      this.text(m.hp+" / "+hp,343,y+51,16,GREEN,"right");
      this.bar(143,y+69,198,m.hp/hp);
      if(m.hp>0&&m.hp<hp&&s.tools.salve)this.add(39,y,325,96,()=>g.useSalve(id));
    });
    this.text("薬草　"+s.tools.salve+"個",344,682,15,COOL,"right");
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
    this.modal(CAST[id].name+"の技","book");
    const group=p.category||0;
    const go=c=>g.open("skills",{...p,category:c,selected:null});
    this.tabs([["通常",()=>go(0),group===0],["アクティブ",()=>go(1),group===1],["パッシブ",()=>go(2),group===2]],204);
    CAST[id].skills.forEach((skill,i)=>{
      if(Math.floor(Math.min(8,i)/3)!==group)return;
      const at=i-(group*3), y=248+at*64, ready=learning(m.level,i);
      const used=m.equipped.includes(i);
      const hint=ready?skill.description:"Lv."+LEARNING[i]+" で習得";
      this.row(y,skill.name,null,hint,
        ready?()=>g.slotSkill(id,i):null,{on:used||p.selected===i,colour:ready?PAPER:"#9296a4"});
      const [dark,light]=ready?[["#3e5f97","#8fb2ea"],["#8a6a2e","#f0cd84"],["#5d4790","#c3a8f0"]][group]:["#2a2d3a","#4a4e5e"];
      this.rec(50,y+12,36,34,light);this.rec(52,y+14,32,30,dark);
      this.text(skill.name[0],68,y+29,18,ready?"#fff6e0":"#8e93a3","center",{weight:800});
      if(used) this.text("★"+(m.stars[i]||1),349,y+17,12,GOLD,"right");
    });
    if(senSkill(m,p) && this.g.s.tools.book>0) {
      this.button("技の本で強くする（"+g.s.tools.book+"冊）",76,684,250,38,()=>g.upgradeSkill(id,p.selected),true,"book");
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
    if(g.area.scroll&&g.s.chapter===1){drawChapterAtlas(this,g);return;}
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
  bookTabs(on) {
    const g=this.g;
    this.tabs([["旅の記録","journal"],["図鑑","dex"],["記録","save"],["設定","settings"]].map(([t,k])=>[t,()=>g.open(k),on===k]));
  }
  journal() {
    const {g}=this;
    this.modal("旅の帳","book");
    this.bookTabs("journal");
    this.frame(47,264,309,99);this.icon("map",69,285,3);
    this.text("第"+g.s.chapter+"章",120,292,20,GOLD);
    this.text(g.area.title,120,326,15,COOL);
    const s=g.s,met=Object.keys(s.lore||{}).length;
    [["所持金",s.gold+" G","coin"],["仲間",Object.keys(s.members).length+" 人","flag"],["戦った回数",(s.battles||0)+" 回","starterSword"],["出会った魔物",met+" 種","book"]]
      .forEach(([label,value,art],i)=>{const y=376+i*34;this.rec(47,y,309,30,i%2?"#272833":"#202633");this.icon(art,56,y+3,1);
        this.text(label,88,y+15,13,COOL);this.text(value,344,y+15,14,PAPER,"right",{sans:true});});
    Object.entries({body:["玉座庭","sealIcon"],seal:["黒鉄の板","sealIcon"],crown:["冠","coin"],rewindSeen:["肋の渡り板","rope"],rescued:["荷車の綱","rope"],
      C1:["尾根の火","tool_031"]}).filter(([k])=>g.s.flags[k]).slice(0,3).forEach(([k,[title,art]],i)=>this.row(520+i*60,title,art,"",null));
  }
  dex() {
    const {g}=this,{panel:p,s}=g;
    const group=p.category||"enemies";
    this.modal("旅の帳","book");this.bookTabs("dex");
    this.tabs([["魔物","enemies"],["装備","items"],["素材","materials"]].map(([label,k])=>
      [label,()=>g.open("dex",{...p,category:k,page:0}),group===k]),246);
    if(group==="enemies"){
      const found=Object.keys(s.lore).filter(id=>ENEMIES[id]);
      if(!found.length)this.shelf("白紙の頁","book");
      this.pageRows(found,p.page,292,id=>[ENEMIES[id].name,ENEMIES[id].art,
        "出会った回数　"+(s.lore[id].seen??s.lore[id].wins),
        ()=>g.open("enemyPage",{code:id,back:{id:"dex",details:{...p}}})],6);
      return;
    }
    if(group==="items"){
      const collected=Object.keys(ITEMS).filter(code=>s.claims["item:"+code]);
      if(!collected.length)this.shelf("白紙の頁","book");
      this.pageRows(collected,p.page,292,code=>{
        const item=ITEMS[code];
        const grade=Math.max(s.records?.item?.[code]??0,...[...s.bag,...s.chest].filter(x=>x.code===code).map(i=>i.grade));
        return [item.name,item.art,SLOTS[item.slot]+"　見つけた色 "+GRADES[grade],null,{colour:GRADE_TINT[grade]}];
      },6);
      return;
    }
    const ids=Object.keys(MATERIALS).filter(code=>s.records?.material?.[code]||s.materials[code]);
    if(!ids.length)this.shelf("白紙の頁","book");
    this.pageRows(ids,p.page,292,code=>{
      const m=MATERIALS[code],count=s.records?.material?.[code]||s.materials[code];
      return [m.name,m.art,"見つけた数　"+count,null];
    });
  }
  save() {
    const {g}=this,tabs=Boolean(g.s&&g.panel?.id==="save");
    this.modal(tabs?"旅の帳":"記録","book");
    if(tabs)this.bookTabs("save");
    for(let i=0;i<4;i++){
      const s=g.book.get(i),y=(tabs?248:210)+i*(tabs?108:113);
      this.frame(47,y,309,104);
      this.icon("map",62,y+18,2);
      this.text(i===0?"自動記録":"旅の記録 "+i,98,y+22,16,GOLD);
      if(s?.stamp){
        const d=new Date(s.stamp);
        const mm=String(d.getMinutes()).padStart(2,"0");
        this.text((d.getMonth()+1)+"/"+d.getDate()+" "+d.getHours()+":"+mm,340,y+22,12,COOL,"right",{sans:true});
      }
      this.text(s?"第"+s.chapter+"章　"+(AREAS[s.position.area]?.title||""):"空の記録",98,y+44,13,COOL,"left",{max:235});
      if(i&&g.s)this.button("記す",60,y+56,137,37,()=>g.saveSlot(i),false,"book");
      if(s)this.button("読む",209,y+56,133,37,()=>g.load(i),false,"map");
    }
    if(g.s)this.button("表題へ",103,(tabs?686:688),197,32,()=>g.toTitle());
  }
  result() {
    const {g}=this, entry=g.result, s=g.s;
    this.links=[];
    this.modal(entry.victorious?"勝利":entry.stalemate?"引き上げた":"敗北",entry.victorious?"coin":"starterShield");
    this.frame(47,221,309,131,entry.victorious);
    if(entry.victorious) {
      this.icon("coin",72,244,4);this.text(entry.gold+" G",135,263,20,GOLD);
      this.text("経験 "+entry.xp,136,294,16,COOL);
      const material=MATERIALS[entry.mat];
      this.icon(material.art,68,317,1);
      this.text(material.name+" ×"+entry.quantity,88,326,12,PAPER);
      if(entry.book){this.icon("book",240,317,1);this.text("技の本 ×1",258,326,12,PAPER);}
      if(entry.item){
        const grade=entry.item.grade,a=ITEMS[entry.item.code];
        this.row(366,a.name,a.art,GRADES[grade]+(entry.chest?"　受け取り箱":""),null,{on:true,colour:GRADE_TINT[grade]});
        if(grade>=4)for(let k=0;k<8;k++){
          const t=(Math.floor(g.time/95)+k*7)%34;
          this.rec(46+(k*17)%49,413-t,2,2,GRADE_TINT[grade]);
        }
      }
      else if(entry.sold)this.row(366,"自動で売った",entry.soldArt,"＋ "+entry.sold+" G",null);
    } else {
      this.icon("starterShield",80,253,4);this.text("手当てを受けた",139,277,17,COOL);
    }
    const party=s.formation.filter(Boolean),partyTop=entry.item||entry.sold?432:367;
    const partyLeft=201-(party.length*78-4)/2;
    party.forEach((id,i)=>{
      const x=partyLeft+i*78,m=s.members[id],raised=entry.raised?.includes(id);
      this.frame(x,partyTop,74,81,raised);
      this.rec(x+8,partyTop+6,58,44,"#343c49");
      this.person(id,x+21,partyTop+6,1);
      this.text(CAST[id].name,x+37,partyTop+61,12,PAPER,"center",{max:64});
      this.bar(x+8,partyTop+73,58,m.hp/stats(s,id).maxHp);
      if(raised){this.mark(x+60,partyTop+12);}
    });
    const reasons={cover:"かばった",stop:"大技を止めた",feed:"力を渡して大技",revive:"立て直した"};
    const recent=entry.reasons.filter((r,i,a)=>a.findIndex(t=>t.kind===r.kind&&t.actor===r.actor)===i).slice(0,3);
    const firstReason=partyTop+92;
    recent.forEach((r,i)=>{
      const y=firstReason+i*41;this.frame(38,y,325,38);this.person(r.actor,52,y+7,1,true);
      if(r.friend){
        this.person(r.friend,84,y+7,1,true);
        if(r.kind==="feed")this.rec(72+Math.floor(g.time/60)%16,y+23,3,1,"#b0dcf1");
        if(r.kind==="cover")this.icon("starterShield",70,y+25,1);
      }else this.icon("starterSword",82,y+7,2);
      this.text(reasons[r.kind],124,y+20,14,GOLD);this.text(partyName(r.actor),350,y+20,12,COOL,"right",{max:97});
    });
    const notes=Math.min(652,Math.max(partyTop+105,firstReason+recent.length*41+11));
    if(entry.raised?.length){
      this.mark(66,notes);this.text("レベルが上がった",81,notes,13,GOLD);
    }
    if(entry.healed){this.icon("herb",218,notes-6,1);this.text("薬草で "+entry.healed+"人が回復",235,notes,12,GREEN);}
    this.button("戻る",97,666,208,47,()=>g.leaveResult(),true,"map");
  }
  drawPanel() {
    const {id}=this.g.panel;
    const g=this.g;
    if(id==="party")this.party();
    if(id==="menu")this.menu();
    if(id==="status")this.status();
    if(id==="settings")this.settings();
    if(id==="dex")this.dex();
    if(id==="itemPage")this.itemPage();
    if(id==="toolTarget")this.toolTarget();
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
      if(image)this.c.drawImage(image,uiDotX(this.c,201)-Math.floor(image.naturalWidth/2),uiDotY(this.c,354)-Math.floor(image.naturalHeight/2));
      const entry=g.s.lore[g.panel.code];
      this.text("出会った回数　"+(entry.seen??entry.wins),201,477,14,GOLD,"center");
      this.text("倒した回数　"+entry.wins,201,529,14,COOL,"center");
      this.button("図鑑",109,655,184,43,()=>g.panel.back?g.backPanel():g.open("dex"),true,"book");
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
    if(g.book.get(1)||g.book.get(2)||g.book.get(3))this.button("記録を開く",95,675,212,48,()=>g.open("titleSave"),false,"map");
    if(g.panel?.id==="titleSave"){this.links=[];this.save();}
    if(g.panel?.id==="newConfirm"){
      this.links=[];this.modal("新しい旅","book");
      this.shelf("自動記録を上書きする","book");
      this.button("はじめから",55,652,148,49,()=>g.newGame(true),true);
      this.button("戻る",207,652,148,49,()=>g.closePanel());
    }
    if(g.book.error)this.text("記録を開けません",201,764,14,COOL,"center");
    else if(g.loadingArt||g.artError)this.text(g.loadingArt?"絵を読み込み中":"絵を読み込めませんでした",201,764,14,COOL,"center");
  }
}
