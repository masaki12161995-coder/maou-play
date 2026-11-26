"use strict";

const SCREEN_W=402, SCREEN_H=874, TOP_SAFE=72, BOTTOM_SAFE=816;
const FIELD_DOT=2/3, ARENA_DOT=2, HUD_DOT=4/3;

function plane(w,h,alpha=false) {
  const canvas=document.createElement("canvas");
  canvas.width=w;canvas.height=h;
  const ctx=canvas.getContext("2d",{alpha});
  ctx.imageSmoothingEnabled=false;
  return ctx;
}
function loadArt(key) {
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve([key,image]);
    image.onerror=()=>reject(new Error("assets/"+key+".png"));
    image.src="assets/"+key+".png";
  });
}
function playerText(ctx,labels,dpi,scale=1) {
  ctx.setTransform(dpi,0,0,dpi,0,0);ctx.textBaseline="middle";ctx.lineJoin="round";
  for(const {text,x,y,size,color,align="left",alpha=1,outline=0,outlineColor="#101523",weight=600,sans=false,max} of labels) {
    const family=sans?'"Noto Sans CJK JP","Hiragino Kaku Gothic ProN",sans-serif':'"Noto Serif CJK JP","Hiragino Mincho ProN","Yu Mincho",serif';
    ctx.font=weight+" "+size*scale+"px "+family;ctx.textAlign=align;ctx.globalAlpha=alpha;
    if(outline>0) {
      ctx.lineWidth=outline*scale;ctx.strokeStyle=outlineColor;
      ctx.strokeText(text,x*scale,y*scale,max||400);
    } else {
      ctx.fillStyle="#130e19";
      ctx.fillText(text,x*scale,y*scale+1,max||400);
    }
    ctx.fillStyle=color;ctx.fillText(text,x*scale,y*scale,max||400);
  }
  ctx.globalAlpha=1;ctx.resetTransform();
}
function drawThumb(ui,input) {
  if(input?.kind!=="walk"||!input.dragging)return;
  const c=ui.c;
  const disk=(x,y,r,color)=>{
    const cx=U(x),cy=U(y),radius=U(r);c.fillStyle=color;
    for(let dy=-radius;dy<=radius;dy++){
      const n=Math.floor(Math.sqrt(radius*radius-dy*dy));c.fillRect(cx-n,cy+dy,n*2+1,1);
    }
  };
  for(const [r,tint] of [[38,"#151726a4"],[35,"#b18a61d0"],[33,"#242a3bb8"],[29,"#34384aa5"]])disk(input.x,input.y,r,tint);
  ui.rec(input.x-18,input.y,37,1,"#ad896695");ui.rec(input.x,input.y-18,1,37,"#ad896695");
  for(const [r,tint] of [[15,"#171623dc"],[13,"#c7a66add"],[10,"#8e6e57d9"],[3,"#f4d8a6ec"]])disk(input.knobX,input.knobY,r,tint);
}

class Game {
  constructor(display,images,storage) {
    this.display=display;this.out=display.getContext("2d",{alpha:false});
    this.dpi=window.devicePixelRatio||1;
    display.width=Math.round(SCREEN_W*this.dpi);
    display.height=Math.round(SCREEN_H*this.dpi);
    this.surface=plane(603,1311);this.arena=plane(201,437);this.hud=plane(302,656,true);
    this.layer=plane(603,1311,true);
    this.bank={images,npcs:images,icons:images,stills:images,people:[]};
    this.dialogue=new Dialogue(this.bank);this.ui=new GameUI(this);
    this.book=new SaveBook(storage);
    this.cinematic=null;this.time=0;this.s=null;this.input=null;this.panel=null;
    this.titleField=new Field("road",{...this.bank,people:[]},{npcs:[],objects:[],trail:[[5,19]]});
    this.titleField.setPaused(true);
    this.bind();
    this.frame=t=>{this.draw(t);requestAnimationFrame(this.frame);};
  }
  start() { requestAnimationFrame(this.frame); }
  blit(ctx,dot) {
    const {canvas}=ctx, px=this.dpi*dot;
    this.out.imageSmoothingEnabled=false;
    this.out.drawImage(canvas,0,0,canvas.width*px,canvas.height*px);
  }
  setScreen(state) {
    this.display.dataset.scene=state;
    this.display.setAttribute("aria-label",state==="battle"?"戦闘":this.area?.title||"魔王は昨日死んだ");
  }
  draw(time) {
    this.time=time;
    if(!this.s) {
      this.titleField.draw(this.surface,time);
      this.ui.begin(this.surface);this.ui.title();
      this.blit(this.surface,FIELD_DOT);
      playerText(this.out,this.ui.labels,this.dpi);
      return;
    }
    if(this.battle) {
      this.battle.draw(this.arena,this.hud,time-this.battleStart);
      this.blit(this.arena,ARENA_DOT);this.blit(this.hud,HUD_DOT);
      playerText(this.out,this.battle.labels,this.dpi,HUD_DOT);
      return;
    }
    const inFront=Boolean(this.panel||this.dialogue.isOpen||this.cinematic);
    const field=this.field, before=field.steps;
    field.setPaused(inFront);
    field.draw(this.surface,time);
    if(field.approach && this.input?.kind==="walk")this.release();
    const request=field.takeInteraction();
    if(request)this.read(request);
    if(this.field===field && field.steps!==before && !this.panel && !this.cinematic && !this.dialogue.isOpen)this.stepped();
    if(this.battle||this.field!==field)return;
    this.ui.begin(this.surface);
    this.ui.hud();
    if(this.panel)this.ui.drawPanel();
    if(!this.dialogue.isOpen)this.ui.toast();
    const dialogueLabels=this.dialogue.isOpen?this.dialogue.draw(this.surface,time):[];
    drawThumb(this.ui,this.input);
    if(this.cinematic)this.drawEffect(time);
    this.blit(this.surface,FIELD_DOT);
    playerText(this.out,[...this.ui.labels,...dialogueLabels],this.dpi);
  }
  newGame(force=false) {
    if(this.book.get(0) && !force){this.open("newConfirm");return;}
    this.s=makeAdventure();
    this.enter(START.area,START.trail);
    this.autosave();
  }
  load(index) {
    const save=this.book.get(index);
    if(!save)return;
    this.s=save;
    this.release();this.panel=null;this.battle=null;this.result=null;this.toast=null;this.cinematic=null;
    this.dialogue.close();this.enter(save.position.area,save.position.trail);
    if(save.pending)this.beginFight(save.pending);
    this.autosave();
  }
  saveSlot(index) {
    if(!this.s)return;
    this.sync();
    if(this.book.save(this.s,index))this.notice("旅を記した","book");
    else this.notice("記録できません","book");
  }
  autosave() {
    if(!this.s)return;
    this.sync();
    if(!this.book.save(this.s))this.notice("記録できません","book");
  }
  sync() {
    this.s.position={area:this.area.id,trail:this.field.party};
  }
  toTitle() {
    if(this.s)this.autosave();
    this.release();this.dialogue.close();this.panel=null;this.battle=null;
    this.cinematic=null;this.s=null;this.area=null;
    this.setScreen("title");
  }
  enter(id,trail) {
    const scene=sceneFor(id,this);
    this.area={...scene,id};
    this.s.seen[id]=true;
    const next=new Field(id,this.bank,{...scene,trail:trail.map(c=>[...c])});
    if(!next.walkable(...next.trail[0])) {
      const [x,y]=next.trail[0],options=[];
      for(let row=4;row<=24;row++)for(let col=0;col<12;col++)if(next.walkable(col,row))options.push([col,row]);
      options.sort((a,b)=>(Math.abs(a[0]-x)+Math.abs(a[1]-y))-(Math.abs(b[0]-x)+Math.abs(b[1]-y)));
      next.trail=[options[0]||[...scene.start]];
    } else {
      const cut=next.trail.findIndex(c=>!next.walkable(...c));
      if(cut>0)next.trail.length=cut;
    }
    this.field=next;
    this.setParty();
    this.setScreen("field");
  }
  setParty() {
    this.bank.people=this.s.formation.filter(Boolean).map(id=>this.bank.images[id]);
    this.field.addTrail(this.bank.people.length);
    this.field.trail.length=Math.min(this.field.trail.length,this.bank.people.length);
    if(!this.field.facings.length)this.field.facings=[3];
  }
  refresh() {
    const angle=this.field.facings.slice(),trail=this.field.party,id=this.area.id;
    this.enter(id,trail);
    this.field.facings=this.field.facings.map((d,i)=>angle[i]??d);
    this.sync();
  }
  travel(id,spawn,condition=null) {
    if(!AREAS[id]||(condition&&!condition()))return;
    this.release();this.dialogue.close();this.panel=null;this.cinematic=null;
    this.s.chapter=Math.max(this.s.chapter,AREAS[id].chapter);
    this.enter(id,[spawn||AREAS[id].start]);
    if(AREAS[id].safe)this.s.checkpoint={area:id,trail:this.field.party};
    this.autosave();
  }
  open(id,details={}) {
    if(!this.s&&!["titleSave","newConfirm"].includes(id))return;
    this.release();this.field?.setPaused(true);this.panel={...details,id};
    if(id==="cards"&& !this.cards)this.cards=new CardTable(this);
    this.setScreen(id);
  }
  closePanel() {
    if(this.panel?.id==="result"){this.leaveResult();return;}
    this.panel=null;this.field?.setPaused(this.dialogue.isOpen);
    this.setScreen(this.s?"field":"title");
  }
  notice(text,art=null) {this.toast={text,art,until:performance.now()+1800};}
  mark(key,value=true) {
    this.s.flags[key]=value;
    this.autosave();
  }
  join(id,level,key) {
    if(!welcome(this.s,id,level))return;
    this.s.flags[key]=true;
    this.refresh();this.autosave();
    this.notice(CAST[id].name+"が加わった","party");
  }
  rest() {healAll(this.s);this.s.walkCount=0;this.autosave();this.notice("体力が戻った","herb");}
  give(reward) {
    if(reward==="book"){this.s.tools.book++;this.notice("技の本 ×1","book");}
    else if(reward==="material"){this.s.materials.iron+=2;this.notice("鉄片 ×2","mat_005");}
    else if(ITEMS[reward]) {
      const item=grant(this.s,reward);
      this.notice(this.s.chest.includes(item)?"受け取り箱へ":ITEMS[reward].name,ITEMS[reward].art);
    }
  }
  grantQuest(key,reward) {
    if(this.s.claims[key])return;
    this.s.claims[key]=true;
    this.give(reward);this.autosave();
  }
  openChest(key,reward) {
    this.grantQuest(key,reward);
    this.refresh();
  }
  chooseFire(value) {
    if(this.s.flags.C1)return;
    this.mark("C1",value);
    this.effect("embers",860,()=>this.refresh());
  }
  chooseCanopy(value) {
    if(this.s.flags.C2)return;
    this.mark("C2",value);
    this.effect("glide",1250,()=>this.refresh());
  }
  turnPlate(part) {
    const key=part+"Angle", f=this.s.flags;
    if(f.starPath)return;
    f[key]=f[key]===1?2:1;
    this.refresh();
    if(f.leafAngle===1&&f.slabAngle===2){
      f.starPath=true;this.refresh();
      this.effect("starroot",1200);
    }
    this.autosave();
  }
  read(request) {
    this.release();this.field.setPaused(true);
    if(request.instant){request.onEnd?.();return;}
    this.dialogue.open(request,this.time);
  }
  stepped() {
    this.sync();
    const f=this.s.flags, id=this.area.id, [x,y]=this.field.trail[0];
    const steppingHere=!this.field.routeTarget&&(this.field.heldDirection||!this.field.route.length&&!this.field.moving);
    if(id==="plate"&&x===8&&y===8&&!f.starPath&&steppingHere) {
      this.mark("starPath");this.refresh();this.effect("starroot",1200);return;
    }
    if(id==="towers" && x===6 && y===11 && !f.skyPath && steppingHere) {
      this.mark("skyPath");this.effect("standards",1220,()=>this.travel("sky",[6,20]));return;
    }
    if(id==="fire" && y<=19 && !f.emberRun) {
      this.mark("emberRun");this.effect("beast",1100);return;
    }
    if(id==="bridge"&&!f.rewindSeen&&y<=15&&y>=13&&x>=4&&x<=7) {
      this.s.flags.broken=true;this.refresh();
      this.effect("rewind",1650,()=>{
        delete f.broken;f.rewindSeen=true;
        this.refresh();this.autosave();
      });
      return;
    }
    const passage=this.area.exits.find(e=>e.col===x&&e.row===y);
    if(passage&&steppingHere){
      this.travel(passage.to,passage.spawn,passage.condition);return;
    }
    if(!POOLS[id] || id==="gate"&&!f.body)return;
    if(this.area.objects.some(o=>o.boss && Math.abs(o.col-x)+Math.abs(o.row-y)<=4))return;
    this.s.walkCount=(this.s.walkCount||0)+1;
    const needed=6+mixSeed(this.s.seed+":"+this.s.battles+":"+id)%6;
    if(this.s.walkCount<needed || this.field.approach || y<7 || y>22)return;
    this.s.walkCount=0;
    const pool=POOLS[id], selection=pool[mixSeed(this.s.seed+":"+this.s.battles+":"+id)%pool.length];
    this.fight(selection);
  }
  effect(kind,duration,finish) {
    this.release();
    this.cinematic={kind,at:this.time,duration,finish};
  }
  drawEffect(time) {
    const c=this.cinematic;
    const q=(time-c.at)/c.duration;
    if(q>=1){this.cinematic=null;c.finish?.();return;}
    const ui=this.ui;
    if(c.kind==="starroot") {
      const paint=(x,y,side)=>{
        for(let k=0;k<17;k++)if(k<=Math.floor(q*18)) {
          const xx=x+k*4*side,yy=y-7*k;
          ui.rec(xx,yy,3+k%2,3,k%4===0?"#fff0a2":"#a8cc90a7");
          if(k%5===0)ui.rec(xx-3,yy+1,9,1,"#d1dea4");
        }
      };
      paint(197,477,1);paint(197,477,-1);
    } else if(c.kind==="glide") {
      const bird=this.bank.images.M55,x=Math.round(535-q*581),y=Math.round(376-q*188);
      const rope=this.bank.images.rope;
      this.surface.drawImage(bird,x,y);
      this.surface.drawImage(rope,x+Math.floor(bird.naturalWidth/2),y+bird.naturalHeight+1);
      ui.rec(x*2/3+bird.naturalWidth/3-1,y*2/3+bird.naturalHeight*2/3,1,22,"#e4c18c");
    } else if(c.kind==="beast" || c.kind==="standards") {
      if(c.kind==="beast") {
        const image=this.bank.images.monster_073;
        this.surface.drawImage(image,Math.round(-image.naturalWidth+q*(603+image.naturalWidth)),690);
        for(let i=0;i<23;i++) {
          const x=Math.round(-51+q*412-i*9),y=512+(i*41%31);
          if(x>=0)ui.rec(x,y,2+i%6,1+i%3,i%2?"#f49d61":"#df5547");
        }
      } else {
        for(let i=0;i<15;i++) {
          const p=(q+i*.084)%1, x=153+Math.floor(164*p),y=650-Math.floor(488*p);
          ui.rec(x,y,2,16,"#ffc586c3");
          ui.rec(x+2,y+1,13-(i%3),6,"#f1b275a8");
          ui.rec(x+1,y+3,6,2,"#f7df9dad");
        }
      }
    } else if(c.kind==="flight") {
      const sprite=this.bank.images.H02;
      if(sprite) {
        const x=446+Math.round(42*q),y=562-Math.round(300*q),sx=48*Math.floor(q*17%3);
        this.surface.drawImage(sprite,sx,180,48,60,x,y,48,60);
      }
      for(let k=0;k<19;k++){const p=(q*6+k*.211)%1;ui.rec(75+k*13,445-p*246,2,2,k%2?"#e6ba68":"#bb7366");}
    } else {
      const rewind=c.kind==="rewind";
      if(rewind)ui.rec(0,130,402,587,q<.46?"#1713296b":"#d6dffc47");
      for(let k=0;k<52;k++){
        const p=((q*(rewind?-3:3)+k*.167)%1+1)%1;
        ui.rec((k*61+Math.floor(p*56))%402,180+(k*119+Math.floor(p*192))%502,k%3+1,2,rewind?"#e0d6baab":"#f99d58c1");
      }
      if(rewind && q>=.45 && q<.67){
        const line=Math.floor(180+(q-.45)*1900);
        ui.rec(0,line,402,4,"#c2c9fdbb");
      }
    }
  }
  fight(codes,key=null,scenario=null) {
    if(this.battle||this.s.pending||key&&this.s.flags[key])return;
    this.release();this.dialogue.close();this.panel=null;
    const seed=this.s.seed+":"+this.s.battles+":"+this.area.id+":"+codes.join("-");
    const pending={codes,key,seed,boss:Boolean(key),scenario};
    this.s.pending=pending;
    this.autosave();this.beginFight(pending);
  }
  beginFight(pending) {
    this.pending=pending;
    const foes=pending.codes.map(code=>ENEMIES[code]);
    const sim=resolveFight(this.s,foes,pending.seed);
    this.battle=new Battle({...this.bank,people:this.s.formation.map(id=>this.bank.images[id]||null),
      enemies:foes.map(foe=>this.bank.images[foe.art])},sim,this.area.arena||this.area.skin,this.s.speed);
    this.battleStart=this.time;
    this.setScreen("battle");
  }
  finishFight() {
    const {victorious,stalemate,reasons,health}=this.battle.demo, p=this.pending, s=this.s;
    const baseGold=p.boss?52+p.codes.length*8:7+p.codes.length*5;
    const baseXp=p.boss?105+s.chapter*25:((s.chapter===1?30:21)+p.codes.length*8+s.chapter*3);
    const r=seeded(mixSeed(p.seed+":bundle")),mat=Object.keys(MATERIALS)[Math.floor(r()*4)],quantity=p.boss?3:1;
    const drop=victorious?loot(p.seed,["swordIron","bow","coat","shield","ring","lantern"]):null;
    for(let i=0;i<4;i++)if(s.formation[i])s.members[s.formation[i]].hp=health[i];
    s.lastFight=p.codes.slice();s.battles++;s.pending=null;s.walkCount=0;
    this.result={victorious,stalemate,reasons,gold:0,xp:0,mat,quantity,item:null,chest:false};
    if(victorious){
      if(p.key)s.flags[p.key]=true;
      s.gold+=baseGold;applyXP(s,baseXp);s.materials[mat]+=quantity;
      if(p.boss)s.tools.book++;
      for(const id of Object.keys(s.members))if(s.members[id].hp===0)s.members[id].hp=1;
      this.result.gold=baseGold;this.result.xp=baseXp;
      if(drop){
        this.result.item=grant(s,drop.code,drop.grade);
        this.result.chest=s.chest.includes(this.result.item);
      }
      for(const id of p.codes) {
        s.lore[id]??={wins:0};s.lore[id].wins++;
      }
      this.refresh();
    } else {
      const {area,trail}=s.checkpoint;
      this.enter(area,trail);healAll(s);
    }
    this.battle=null;this.pending=null;this.open("result");
    this.autosave();
  }
  leaveResult() {this.result=null;this.panel=null;this.setScreen("field");}
  selectSlot(slot) {
    const p=this.panel,formation=this.s.formation;
    if(p.bench){formation[slot]=p.bench;this.formationChanged();return;}
    if(!Number.isInteger(p.slot) || !formation[p.slot]){p.slot=slot;return;}
    if(p.slot===slot){p.slot=null;return;}
    if(!formation[slot]&&slot===0)return;
    [formation[p.slot],formation[slot]]=[formation[slot],formation[p.slot]];
    if(!formation[0]){formation[0]=formation[p.slot];formation[p.slot]=null;}
    this.formationChanged();
  }
  selectBench(id) {
    if(Number.isInteger(this.panel.slot)) {
      this.s.formation[this.panel.slot]=id;this.formationChanged();
    } else this.panel.bench=this.panel.bench===id?null:id;
  }
  formationChanged() {
    this.panel.slot=null;this.panel.bench=null;this.setParty();this.autosave();
  }
  tryEquip(id,uid,slot) {
    if(equip(this.s,id,uid,slot))this.autosave();
  }
  recommend(id,slot) {
    const s=this.s, part=s.members[id], near=s.formation.indexOf(id)<2;
    const prey=s.lastFight?.map(id=>ENEMIES[id])||[];
    const candidates=s.bag.filter(it=>(!holding(s,it.uid)||part.gear[slot]===it.uid)&&ITEMS[it.code].slot===Math.min(slot,4));
    function score(item) {
      const d=ITEMS[item.code], ranged=d.ranged&&!near?7:0;
      const element=prey.filter(enemy=>enemy.weak===item.inlay||enemy.weak===d.element).length*5;
      const synergy=s.formation.includes("H04") && !near ? (d.speed||0)*1.6 : (d.defense||0)*.6;
      return (d.attack||0)*2.2+(d.defense||0)*2+(d.health||0)*.4+(d.speed||0)*1.5+item.forged*2+item.grade+ranged+element+synergy;
    }
    candidates.sort((a,b)=>score(b)-score(a));
    const best=candidates[0];
    if(!best)this.notice("この枠に合う品がない","starterShield");
    else if(best.uid===part.gear[slot])this.notice("今の品が合っている",ITEMS[best.code].art);
    else this.tryEquip(id,best.uid,slot);
  }
  buy(code) {
    const item=ITEMS[code] || (code==="salve"?{price:12}:null);
    if(!item)return;
    if(this.s.gold<item.price){this.notice("金貨が足りない","coin");return;}
    this.s.gold-=item.price;
    if(code==="salve"){this.s.tools.salve++;this.notice("薬草 ×1","herb");}
    else this.give(code);
    this.autosave();
  }
  useSalve() {
    const {s}=this;
    const list=s.formation.filter(Boolean).filter(id=>s.members[id].hp<stats(s,id).maxHp);
    list.sort((a,b)=>s.members[a].hp/stats(s,a).maxHp-s.members[b].hp/stats(s,b).maxHp);
    if(!s.tools.salve){this.notice("薬草がない","herb");return;}
    if(!list.length)return;
    const id=list[0],max=stats(s,id).maxHp;
    s.members[id].hp=Math.min(max,s.members[id].hp+Math.ceil(max*.48));s.tools.salve--;
    this.notice(CAST[id].name+"の体力が戻った","herb");this.autosave();
  }
  receive(uid) {
    if(this.s.bag.length>=POCKET){this.notice("袋がいっぱい","bag");return;}
    const index=this.s.chest.findIndex(it=>it.uid===uid);
    if(index>=0){this.s.bag.push(...this.s.chest.splice(index,1));this.autosave();}
  }
  toggleLock(uid) {
    const i=this.s.bag.find(it=>it.uid===uid);
    if(!i||i.grade>=4||ITEMS[i.code].unique||holding(this.s,uid))return;
    i.locked=!i.locked;this.autosave();
  }
  slotSkill(id,i) {
    const m=this.s.members[id];
    if(!learning(m.level,i))return;
    const p=this.panel;
    p.selected=i;
    const at=i<3?0:i<6?1:m.equipped[2]===i?2:m.equipped[3]===i?3:!m.equipped[2]?2:3;
    if(i<6)m.equipped[at]=i;
    else if(this.s.flags.B02||m.equipped[2]===i||m.equipped[2]===null)m.equipped[at]=i;
    else m.equipped[2]=i;
    this.autosave();
  }
  upgradeSkill(id,i) {
    const m=this.s.members[id];
    if(!learning(m.level,i)||!this.s.tools.book||(m.stars[i]||1)>=4)return;
    m.stars[i]=(m.stars[i]||1)+1;this.s.tools.book--;this.autosave();
  }
  work(art) {this.forgeGlow={art,until:this.time+420};this.autosave();}
  makeItem(recipe) {
    if(!spend(this.s,recipe.need)){this.notice("材料が足りない","ore");return;}
    this.give(recipe.item);this.work(ITEMS[recipe.item].art);
  }
  raise(uid) {
    const item=this.s.bag.find(it=>it.uid===uid);
    if(!item||item.forged>=5)return;
    if(!spend(this.s,{iron:item.forged+1})){this.notice("鉄片が足りない","ore");return;}
    item.forged++;this.work(ITEMS[item.code].art);
  }
  inlay(uid) {
    const item=this.s.bag.find(it=>it.uid===uid);
    if(!item||item.inlay)return;
    if(!spend(this.s,{glow:1})){this.notice("灯火の粉が足りない","ore");return;}
    item.inlay="light";this.work(ITEMS[item.code].art);
  }
  collectSalvage(uid) {
    const p=this.panel;p.selected??=[];
    p.selected=p.selected.includes(uid)?p.selected.filter(id=>id!==uid):[...p.selected,uid];
  }
  doSalvage() {
    if(salvage(this.s,this.panel.selected||[])){this.panel.selected=[];this.work("ore");}
  }
  release() {
    if(this.input?.kind==="walk")this.field?.setDirection(0,0);
    if(this.input?.kind==="dialogue")this.dialogue.endHold();
    this.input=null;
  }
  tap(x,y,t) {
    if(this.dialogue.isOpen){this.dialogue.tap(x,y);return;}
    if(y<TOP_SAFE||y>=BOTTOM_SAFE||this.cinematic)return;
    if(this.battle){
      const action=this.battle.tap(Math.floor(x/HUD_DOT),Math.floor(y/HUD_DOT));
      if(action==="speed"){this.s.speed=[1,2,4][this.battle.speed];this.autosave();}
      if(action==="result")this.finishFight();
      return;
    }
    if(this.ui.hit(x,y))return;
    if(!this.s||this.panel||y<126||y>=748)return;
    const request=this.field.tap(Math.floor(x/FIELD_DOT),Math.floor(y/FIELD_DOT),t);
    if(request)this.read(request);
  }
  bind() {
    const screen=this.display;
    const coord=e=>{
      const box=screen.getBoundingClientRect();
      return {x:(e.clientX-box.left)*SCREEN_W/box.width,y:(e.clientY-box.top)*SCREEN_H/box.height};
    };
    screen.addEventListener("pointerdown",e=>{
      if(this.input||e.pointerType==="mouse"&&e.button!==0)return;
      const {x,y}=coord(e);const t=performance.now();
      if(!this.dialogue.isOpen&&(y<TOP_SAFE||y>=BOTTOM_SAFE))return;
      e.preventDefault();
      const kind=this.dialogue.isOpen?"dialogue":!this.s||this.battle||this.panel||this.cinematic?"tap":"walk";
      this.input={id:e.pointerId,kind,x,y,time:t,dragging:false};
      if(kind==="dialogue")this.dialogue.beginHold(t);
      screen.setPointerCapture(e.pointerId);
    });
    screen.addEventListener("pointermove",e=>{
      const i=this.input;
      if(!i||i.id!==e.pointerId||i.kind!=="walk")return;
      const {x,y}=coord(e),dx=x-i.x,dy=y-i.y,distance=Math.hypot(dx,dy);
      if(!i.dragging && distance<=10)return;
      i.dragging=true;
      const ratio=Math.min(1,40/Math.max(1,distance));
      i.knobX=i.x+dx*ratio;i.knobY=i.y+dy*ratio;
      if(distance<12)this.field.setDirection(0,0);else this.field.setDirection(dx,dy);
    });
    screen.addEventListener("pointerup",e=>{
      const i=this.input;
      if(i?.id!==e.pointerId)return;
      const {x,y}=coord(e),t=performance.now();
      if(i.kind==="dialogue"){
        const used=this.dialogue.endHold(t);this.input=null;
        if(!used&&this.dialogue.isOpen)this.tap(x,y,t);
        return;
      }
      this.release();
      if(!i.dragging&&t-i.time<400)this.tap(x,y,t);
    });
    for(const type of ["pointercancel","lostpointercapture"])screen.addEventListener(type,e=>{if(this.input?.id===e.pointerId)this.release();});
    screen.addEventListener("contextmenu",e=>e.preventDefault());
    window.addEventListener("blur",()=>this.release());
    window.addEventListener("pagehide",()=>{if(this.s&&!this.cinematic)this.autosave();});
    window.addEventListener("keydown",e=>{
      if(e.key.startsWith("Arrow")&&this.s&&!this.battle&&!this.panel&&!this.dialogue.isOpen&&!this.cinematic){
        e.preventDefault();this.field.key(e.key);
      } else if(e.key==="Escape"&&this.panel){e.preventDefault();this.closePanel();}
    });
  }
}
async function boot() {
  const view=document.getElementById("screen"), loading=document.getElementById("loading");
  try {
    const images=Object.fromEntries(await Promise.all(ART.map(loadArt)));
    let storage;
    try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error("Storage unavailable");}};}
    const game=new Game(view,images,storage);
    loading.hidden=true;game.setScreen("title");game.start();
    view.dataset.ready="true";
  } catch(err) {
    loading.textContent="絵を読み込めません";
    console.error(err);
  }
}
if(typeof document!=="undefined"&&document.getElementById("screen"))boot();
