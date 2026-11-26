"use strict";

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
async function loadLibrary(images,keys){
  const missing=keys.filter(key=>!images[key]);
  for(let i=0;i<missing.length;i+=24){
    const batch=await Promise.all(missing.slice(i,i+24).map(loadArt));
    Object.assign(images,Object.fromEntries(batch));
  }
}
function playerText(ctx,labels,layout,pixels=0) {
  const {dpi}=layout,scale=pixels?pixels/dpi:1;
  ctx.setTransform(dpi,0,0,dpi,0,0);ctx.textBaseline="middle";ctx.lineJoin="round";
  for(const {text,x,y,size,color,align="left",alpha=1,outline=0,outlineColor="#101523",weight=600,sans=false,max,screen} of labels) {
    const left=pixels||screen?x*scale:layout.x(x),top=pixels||screen?y*scale:layout.y(y);
    const family=sans?'"Noto Sans CJK JP","Hiragino Kaku Gothic ProN",sans-serif':'"Noto Serif CJK JP","Hiragino Mincho ProN","Yu Mincho",serif';
    ctx.font=weight+" "+size*scale+"px "+family;ctx.textAlign=align;ctx.globalAlpha=alpha;
    if(outline>0) {
      ctx.lineWidth=outline*scale;ctx.strokeStyle=outlineColor;
      ctx.strokeText(text,left,top,max||400);
    } else {
      ctx.fillStyle="#130e19";
      ctx.fillText(text,left,top+1,max||400);
    }
    ctx.fillStyle=color;ctx.fillText(text,left,top,max||400);
  }
  ctx.globalAlpha=1;ctx.resetTransform();
}
function drawThumb(ui,input) {
  if(input?.kind!=="walk"||!input.dragging)return;
  const c=ui.c;
  const dot=pt=>Math.round(pt*ui.g.layout.dpi/FIELD_PIXEL);
  const disk=(x,y,r,color)=>{
    const cx=dot(x),cy=dot(y),radius=dot(r);c.fillStyle=color;
    for(let dy=-radius;dy<=radius;dy++){
      const n=Math.floor(Math.sqrt(radius*radius-dy*dy));c.fillRect(cx-n,cy+dy,n*2+1,1);
    }
  };
  for(const [r,tint] of [[38,"#151726a4"],[35,"#b18a61d0"],[33,"#242a3bb8"],[29,"#34384aa5"]])disk(input.x,input.y,r,tint);
  c.fillStyle="#ad896695";
  c.fillRect(dot(input.x-18),dot(input.y),dot(37),1);
  c.fillRect(dot(input.x),dot(input.y-18),1,dot(37));
  for(const [r,tint] of [[15,"#171623dc"],[13,"#c7a66add"],[10,"#8e6e57d9"],[3,"#f4d8a6ec"]])disk(input.knobX,input.knobY,r,tint);
}

class Game {
  constructor(display,images,storage) {
    this.display=display;this.out=display.getContext("2d",{alpha:false});
    this.root=document.getElementById("app");
    this.safeArea=document.getElementById("safe-area");
    this.bank={images,npcs:images,icons:images,stills:images,people:[]};
    this.dialogue=new Dialogue(this.bank);this.ui=new GameUI(this);
    this.book=new SaveBook(storage);
    this.cinematic=null;this.time=0;this.s=null;this.input=null;this.panel=null;
    this.titleField=new Field("road",{...this.bank,people:[]},{npcs:[],objects:[],trail:[[5,19]]});
    this.titleField.setPaused(true);
    this.syncLayout();
    this.bind();
    this.frame=t=>{this.draw(t);requestAnimationFrame(this.frame);};
  }
  start() { requestAnimationFrame(this.frame); }
  syncLayout() {
    fitViewportRoot(this.root);
    const rect=this.display.getBoundingClientRect?.()||{left:0,top:0,width:UI_WIDTH,height:UI_HEIGHT};
    if(!rect.width||!rect.height)return;
    const layout=new Viewport(rect,window.devicePixelRatio||1,this.safeArea?.getBoundingClientRect()||rect);
    if(!this.layout||layout.pixelWidth!==this.layout.pixelWidth||layout.pixelHeight!==this.layout.pixelHeight){
      if(this.surface)for(const layer of [this.surface,this.arena,this.hud])layer.canvas.width=1;
      const [field,arena,hud]=layout.planes();
      this.display.width=layout.pixelWidth;this.display.height=layout.pixelHeight;
      this.surface=plane(...field);this.arena=plane(...arena);this.hud=plane(...hud,true);
    }
    this.layout=layout;
    this.surface.uiLayout=layout;
  }
  blit(ctx,pixels) {
    const {canvas}=ctx;
    this.out.imageSmoothingEnabled=false;
    this.out.drawImage(canvas,0,0,canvas.width*pixels,canvas.height*pixels);
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
      this.blit(this.surface,FIELD_PIXEL);
      playerText(this.out,this.ui.labels,this.layout);
      return;
    }
    if(this.battle) {
      this.battle.draw(this.arena,this.hud,time-this.battleStart,this.layout);
      this.blit(this.arena,ARENA_PIXEL);this.blit(this.hud,HUD_PIXEL);
      playerText(this.out,this.battle.labels,this.layout,HUD_PIXEL);
      return;
    }
    const inFront=Boolean(this.panel||this.dialogue.isOpen||this.cinematic);
    const field=this.field, before=field.steps;
    field.setPaused(inFront);
    if(field.scroll)field.shot=ch1Frame(this.cinematic,time);
    field.draw(this.surface,time);
    if(field.approach && this.input?.kind==="walk")this.release();
    const request=field.takeInteraction();
    if(request)this.read(request);
    if(this.field===field && field.steps!==before && !this.panel && !this.cinematic && !this.dialogue.isOpen)this.stepped();
    if(this.battle||this.field!==field)return;
    this.ui.begin(this.surface);
    if(!inFront&&!this.dialogue.isOpen){
      if(field.parts?.plan.expanded)field.parts.exitLabel(this.ui,field);
      else this.ui.exitNote();
    }
    this.ui.hud();
    if(this.panel)this.ui.drawPanel();
    if(!this.dialogue.isOpen)this.ui.toast();
    const dialogueLabels=this.dialogue.isOpen?this.dialogue.draw(this.surface,time):[];
    drawThumb(this.ui,this.input);
    if(this.cinematic)this.drawEffect(time);
    this.blit(this.surface,FIELD_PIXEL);
    playerText(this.out,[...this.ui.labels,...dialogueLabels],this.layout);
  }
  waitForArt(action) {
    if(!this.loadLibrary)return false;
    if(!this.loadingArt){
      this.loadingArt=true;this.artError=false;
      this.loadLibrary().then(()=>{
        this.loadLibrary=null;this.loadingArt=false;action();
      }).catch(()=>{this.loadingArt=false;this.artError=true;});
    }
    return true;
  }
  newGame(force=false) {
    if(this.waitForArt(()=>this.newGame(force)))return;
    if(this.book.get(0) && !force){this.open("newConfirm");return;}
    this.s=makeAdventure();
    this.s.ch1Layout=1;
    this.enter(START.area,[AREAS[START.area].start]);
    this.s.checkpoint={area:this.area.id,trail:this.field.party};
    this.autosave();
    ch1Intro(this);
  }
  load(index) {
    if(this.waitForArt(()=>this.load(index)))return;
    const save=this.book.get(index);
    if(!save)return;
    ch1Migrate(save);
    restorePreferences(save);
    this.s=save;
    this.release();this.panel=null;this.battle=null;this.result=null;this.toast=null;this.cinematic=null;
    this.dialogue.close();this.enter(save.position.area,save.position.trail);
    if(save.pending)this.beginFight(save.pending);
    else if(save.chapter===1&&this.area.id==="town"&&!save.flags.ch1Arrival)ch1Intro(this);
    else ch1OnEntry(this);
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
      const {columns,rows}=next.gridBounds;
      for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)if(next.walkable(col,row))options.push([col,row]);
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
    this.field.addTrail(this.bank.people.length,this.area.exits);
    this.field.trail.length=Math.min(this.field.trail.length,this.bank.people.length);
    if(!this.field.facings.length)this.field.facings=[3];
  }
  refresh() {
    const angle=this.field.facings.slice(),trail=this.field.party,id=this.area.id;
    this.enter(id,trail);
    this.field.facings=this.field.facings.map((d,i)=>angle[i]??d);
    this.sync();
  }
  travel(id,spawn,condition=null,facing=null) {
    if(!AREAS[id]||(condition&&!condition()))return;
    this.release();this.dialogue.close();this.panel=null;this.cinematic=null;
    this.s.chapter=Math.max(this.s.chapter,AREAS[id].chapter);
    this.enter(id,[spawn||AREAS[id].start]);
    if(facing)this.field.facings[0]=["S","W","E","N"].indexOf(facing);
    if(this.area.safe)this.s.checkpoint={area:id,trail:this.field.party};
    this.resetEncounter();
    this.autosave();
    if(this.area.scroll)ch1OnEntry(this);
  }
  open(id,details={}) {
    if(id==="menu")id="status";
    if(!this.s&&!["titleSave","newConfirm"].includes(id))return;
    this.release();this.field?.setPaused(true);
    this.panel={back:this.panel?.id===id?this.panel.back:null,...details,id};
    if(id==="cards"&& !this.cards)this.cards=new CardTable(this);
    this.setScreen(id);
  }
  backPanel() {
    const back=this.panel?.back;
    if(back)this.open(back.id,back.details);
    else this.closePanel();
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
  rest() {healAll(this.s);this.s.walkCount=0;this.resetEncounter();this.autosave();this.notice("体力が戻った","herb");}
  give(reward) {
    if(reward==="book"){this.s.tools.book++;this.notice("技の本 ×1","book");}
    else if(reward==="material"){addMaterial(this.s,"iron",2);this.notice("鉄片 ×2","mat_005");}
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
      if(passage.open)passage.open();
      else this.travel(passage.to,passage.spawn,passage.condition);
      return;
    }
    if(this.area.scroll){this.stepEncounter(x,y);return;}
    if(!POOLS[id] || id==="gate"&&!f.body)return;
    if(this.area.objects.some(o=>o.boss && Math.abs(o.col-x)+Math.abs(o.row-y)<=4))return;
    this.s.walkCount=(this.s.walkCount||0)+1;
    const needed=6+mixSeed(this.s.seed+":"+this.s.battles+":"+id)%6;
    if(this.s.walkCount<needed || this.field.approach || y<7 || y>22)return;
    this.s.walkCount=0;
    const pool=POOLS[id], selection=pool[mixSeed(this.s.seed+":"+this.s.battles+":"+id)%pool.length];
    this.fight(selection);
  }
  resetEncounter() {
    if(!this.area.encounters)return;
    const {id}=this.area, s=this.s;
    const turn=(s.encounter?.turn||0)+1;
    s.encounter={id,turn,left:14+mixSeed(s.seed+":steps:"+id+":"+turn)%13};
  }
  stepEncounter(x,y) {
    const spec=this.area.encounters;
    if(!spec||this.field.approach||this.cinematic||this.dialogue.isOpen||this.panel||this.battle||this.s.pending)return;
    const near=(a,b,r)=>Math.abs(a-x)+Math.abs(b-y)<=r;
    if(spec.quiet?.some(([a,b,r])=>near(a,b,r)))return;
    if(this.area.exits.some(o=>near(o.col,o.row,1)))return;
    if(this.area.objects.some(o=>o.boss&&near(o.col,o.row,6)||o.kind==="fire"&&near(o.col,o.row,2)||o.manualEncounter&&near(o.col,o.row,1)))return;
    if(this.s.encounter?.id!==this.area.id)this.resetEncounter();
    const e=this.s.encounter;
    if(--e.left>0)return;
    const pool=spec.solo&&this.s.formation.filter(Boolean).length===1?spec.solo:spec.groups;
    const choice=pool[mixSeed(this.s.seed+":wild:"+e.id+":"+e.turn)%pool.length];
    this.resetEncounter();
    this.fight(choice,null,{track:"ch1",xp:spec.xp,boss:false,loot:spec.loot,wild:true});
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
    if(c.kind==="chapter1"){drawCh1Scene(this,this.surface,c,q);return;}
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
    this.release();this.dialogue.close();this.panel=null;this.toast=null;
    const seed=this.s.seed+":"+this.s.battles+":"+this.area.id+":"+codes.join("-");
    const pending={codes,key,seed,boss:scenario?.track==="ch1"?scenario.boss:Boolean(key),scenario};
    for(const code of new Set(codes)){
      const entry=this.s.lore[code]??={wins:0};
      entry.seen=(entry.seen??entry.wins)+1;
    }
    this.s.pending=pending;
    this.autosave();this.beginFight(pending);
  }
  beginFight(pending) {
    this.pending=pending;
    const foes=pending.codes.map(code=>ch1Opponent(code,this.s.flags.ch1WardStyle));
    const sim=resolveFight(this.s,foes,pending.seed);
    this.battle=new Battle({...this.bank,people:this.s.formation.map(id=>this.bank.images[id]||null),
      enemies:foes.map(foe=>this.bank.images[foe.art])},sim,this.area.arena||this.area.skin,this.s.speed,Boolean(pending.scenario?.wild));
    this.battleStart=this.time;
    this.setScreen("battle");
  }
  finishFight() {
    const {victorious,stalemate,reasons,health}=this.battle.demo, p=this.pending, s=this.s;
    const baseGold=p.boss?52+p.codes.length*8:7+p.codes.length*5;
    const baseXp=p.scenario?.track==="ch1"?p.scenario.xp:
      p.boss?105+s.chapter*25:((s.chapter===1?30:21)+p.codes.length*8+s.chapter*3);
    const r=seeded(mixSeed(p.seed+":bundle")),mat=Object.keys(MATERIALS)[Math.floor(r()*4)],quantity=p.boss?3:1;
    const drop=victorious?loot(p.seed,p.scenario?.loot||["swordIron","bow","coat","shield","ring","lantern"]):null;
    for(let i=0;i<4;i++)if(s.formation[i])s.members[s.formation[i]].hp=health[i];
    s.lastFight=p.codes.slice();s.battles++;s.pending=null;s.walkCount=0;
    this.result={victorious,stalemate,reasons,gold:0,xp:0,mat,quantity,item:null,chest:false,
      chapterOneWin:victorious&&p.key==="B01"&&this.area.scroll};
    if(victorious){
      if(p.key)s.flags[p.key]=true;
      const levels=s.formation.map(id=>id&&s.members[id].level);
      s.gold+=baseGold;applyXP(s,baseXp);addMaterial(s,mat,quantity);
      this.result.raised=s.formation.filter((id,i)=>id&&s.members[id].level>levels[i]);
      if(p.boss){s.tools.book++;this.result.book=true;}
      for(const id of Object.keys(s.members))if(s.members[id].hp===0)s.members[id].hp=1;
      this.result.gold=baseGold;this.result.xp=baseXp;
      if(drop){
        const item=grant(s,drop.code,drop.grade);
        if(s.options.sell.includes(item.grade)&&discardItem(s,item)){
          this.result.sold=itemPrice(item);
          this.result.soldArt=ITEMS[item.code].art;
          s.gold+=this.result.sold;
        }else{
          this.result.item=item;
          this.result.chest=s.chest.includes(item);
        }
      }
      for(const id of p.codes) {
        s.lore[id]??={wins:0};s.lore[id].wins++;
      }
      if(s.options.autoHeal){
        this.result.healed=0;
        for(const id of s.formation.filter(Boolean)){
          if(s.members[id].hp<stats(s,id).maxHp/2&&this.salve(id))this.result.healed++;
        }
      }
      this.refresh();
    } else {
      const {area,trail}=s.checkpoint;
      this.enter(area,trail);healAll(s);this.resetEncounter();
    }
    this.battle=null;this.pending=null;this.open("result");
    this.autosave();
  }
  retreat() {
    if(!this.pending?.scenario?.wild||!this.battle)return;
    const frame=this.battle.demo.frames.findLast(f=>f.at<=this.battle.clock);
    if(!frame?.party.some(p=>p?.hp>0))return;
    frame.party.forEach(p=>{if(p)this.s.members[p.id].hp=p.hp;});
    this.s.pending=null;this.s.battles++;
    this.battle=null;this.pending=null;this.setScreen("field");
    this.autosave();this.notice("戦いから退いた","map");
  }
  leaveResult() {
    const chapterOneWin=this.result?.chapterOneWin;
    this.result=null;this.panel=null;this.setScreen("field");
    if(chapterOneWin)ch1Tidings(this);
  }
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
  recommend(id,slot,batch=false) {
    const s=this.s, part=s.members[id], near=s.formation.indexOf(id)<2;
    const prey=s.lastFight?.map(id=>ENEMIES[id])||[];
    const candidates=s.bag.filter(it=>(!holding(s,it.uid)||part.gear[slot]===it.uid)&&ITEMS[it.code].slot===Math.min(slot,4));
    function score(item) {
      const d=ITEMS[item.code], ranged=d.ranged&&!near?7:0;
      const element=prey.filter(enemy=>enemy?.weak&&(enemy.weak===item.inlay||enemy.weak===d.element)).length*5;
      const synergy=s.formation.includes("H04") && !near ? (d.speed||0)*1.6 : (d.defense||0)*.6;
      return (d.attack||0)*2.2+(d.defense||0)*2+(d.health||0)*.4+(d.speed||0)*1.5+item.forged*2+item.grade+ranged+element+synergy;
    }
    candidates.sort((a,b)=>score(b)-score(a));
    const best=candidates[0];
    if(batch)return best?.uid!==part.gear[slot]&&best&&equip(s,id,best.uid,slot);
    if(!best)this.notice("この枠に合う品がない","starterShield");
    else if(best.uid===part.gear[slot])this.notice("今の品が合っている",ITEMS[best.code].art);
    else this.tryEquip(id,best.uid,slot);
  }
  recommendMember(id) {
    let changed=0;
    for(let slot=0;slot<SLOTS.length;slot++)if(this.recommend(id,slot,true))changed++;
    if(changed)this.autosave();
    this.notice(changed?"装備を整えた":"今の装備が合っている","starterShield");
  }
  recommendAll() {
    let changed=0;
    for(const id of this.s.formation.filter(Boolean))for(let slot=0;slot<SLOTS.length;slot++){
      if(this.recommend(id,slot,true))changed++;
    }
    if(changed)this.autosave();
    this.notice(changed?"装備を整えた":"今の装備が合っている","starterShield");
  }
  option(key,value) {
    if(key==="speed")this.s.speed=value;
    else this.s.options[key]=value;
    this.autosave();
  }
  sell(uid) {
    const item=this.s.bag.find(i=>i.uid===uid);
    if(!item||!discardItem(this.s,item))return;
    const amount=itemPrice(item);
    this.s.gold+=amount;
    this.notice(amount+" G で売った","coin");
    this.autosave();
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
  salve(id) {
    const {s}=this,member=s.members[id],max=stats(s,id).maxHp;
    if(!s.tools.salve||member.hp<=0||member.hp>=max)return false;
    member.hp=Math.min(max,member.hp+Math.ceil(max*.48));
    s.tools.salve--;
    return true;
  }
  useSalve(id) {
    if(!this.salve(id))return;
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
    if(this.input?.kind==="walk"||this.heldKey)this.field?.setDirection(0,0);
    if(this.input?.kind==="dialogue")this.dialogue.endHold();
    this.input=null;this.heldKey=null;
  }
  tap(x,y,t) {
    const l=this.layout,[u,v]=l.point(x,y);
    if(this.dialogue.isOpen){this.dialogue.tap(u,v);return;}
    if(!l.inside(x,y)||this.cinematic)return;
    if(this.battle){
      const action=this.battle.tap(Math.floor(x*l.dpi/HUD_PIXEL),Math.floor(y*l.dpi/HUD_PIXEL));
      if(action==="speed"){this.s.speed=[1,2,4][this.battle.speed];this.autosave();}
      if(action==="result")this.finishFight();
      if(action==="retreat")this.retreat();
      return;
    }
    if(this.ui.hit(u,v))return;
    if(!this.s||this.panel)return;
    const request=this.field.tap(Math.floor(x*l.dpi/FIELD_PIXEL),Math.floor(y*l.dpi/FIELD_PIXEL),t);
    if(request)this.read(request);
  }
  bind() {
    const screen=this.display;
    const resize=()=>this.syncLayout();
    window.addEventListener("resize",resize);
    window.addEventListener("pageshow",resize);
    window.visualViewport?.addEventListener("resize",resize);
    window.visualViewport?.addEventListener("scroll",resize);
    if(this.root&&typeof ResizeObserver!=="undefined")new ResizeObserver(resize).observe(this.root);
    const coord=e=>{
      const box=screen.getBoundingClientRect();
      return {x:e.clientX-box.left,y:e.clientY-box.top};
    };
    screen.addEventListener("pointerdown",e=>{
      if(this.input||e.pointerType==="mouse"&&e.button!==0)return;
      const {x,y}=coord(e);const t=performance.now();
      if(!this.dialogue.isOpen&&!this.layout.inside(x,y))return;
      if(this.heldKey)this.release();
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
    const suspend=()=>{if(this.s&&!this.cinematic&&!this.dialogue.isOpen)this.autosave();};
    window.addEventListener("pagehide",suspend);
    document.addEventListener?.("visibilitychange",()=>{if(document.visibilityState==="hidden")suspend();});
    const down=[0,1],left=[-1,0],right=[1,0],up=[0,-1];
    const keys={arrowdown:down,arrowleft:left,arrowright:right,arrowup:up,s:down,a:left,d:right,w:up};
    window.addEventListener("keydown",e=>{
      const key=e.key.toLowerCase(), advance=["enter"," ","z"].includes(key);
      if(this.input||this.cinematic||this.battle)return;
      if(this.dialogue.isOpen){if(advance){e.preventDefault();this.dialogue.tap(0,0);}return;}
      if(key==="escape"||key==="x"){
        if(this.panel){e.preventDefault();this.backPanel();}
        else if(this.s){e.preventDefault();this.open("menu");}
        return;
      }
      if(!this.s||this.panel)return;
      if(Object.hasOwn(keys,key)){
        e.preventDefault();this.heldKey=key;
        this.field.setDirection(...keys[key]);
      } else if(advance){
        e.preventDefault();
        const request=this.field.talkAhead();
        if(request)this.read(request);
      }
    });
    window.addEventListener("keyup",e=>{if(this.heldKey===e.key.toLowerCase())this.release();});
  }
}
async function boot() {
  const view=document.getElementById("screen"), loading=document.getElementById("loading");
  try {
    const images={};
    await loadLibrary(images,["H01","starterSword","book","map"]);
    let storage;
    try{storage=localStorage;}catch{storage={getItem:()=>null,setItem:()=>{throw new Error("Storage unavailable");}};}
    const game=new Game(view,images,storage);
    loading.hidden=true;game.setScreen("title");game.start();
    view.dataset.ready="true";
    let pending=null;
    game.loadLibrary=()=>pending??=loadLibrary(images,ART).catch(error=>{pending=null;throw error;});
    game.loadLibrary().then(()=>{if(!game.loadingArt)game.loadLibrary=null;}).catch(()=>{game.artError=true;});
    if(typeof navigator!=="undefined"&&navigator.serviceWorker&&window.isSecureContext&&location.protocol!=="file:"){
      navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).catch(()=>{});
    }
  } catch(err) {
    loading.textContent="絵を読み込めません";
    console.error(err);
  }
}
if(typeof document!=="undefined"&&document.getElementById("screen"))boot();
