"use strict";

const TRIPLE_CARDS = {
  sun:{art:"person_071",portrait:true,edges:[4,2,6,3]},
  moon:{art:"person_030",portrait:true,edges:[3,6,2,4]},
  key:{art:"person_099",portrait:true,edges:[4,3,2,6]},
  axe:{art:"person_074",portrait:true,edges:[6,4,3,2]},
  herb:{art:"person_101",portrait:true,edges:[2,3,6,4]},
  tower:{art:"person_072",portrait:true,edges:[7,3,3,2]},
  bow:{art:"person_066",portrait:true,edges:[3,5,4,3]},
  staff:{art:"person_075",portrait:true,edges:[6,2,5,2]},
  fire:{art:"person_100",portrait:true,edges:[1,6,4,4]},
  crown:{art:"person_080",portrait:true,edges:[4,4,2,6]},
};

function neighborsOf(index) {
  return [index>=3?index-3:-1,index%3===2?-1:index+1,index<6?index+3:-1,index%3===0?-1:index-1];
}
function placeCard(board,slot,id,owner) {
  const next=board.map(card=>card&&{...card});
  next[slot]={id,owner};
  neighborsOf(slot).forEach((other,d)=>{
    const touch=next[other];
    if(touch && touch.owner!==owner && TRIPLE_CARDS[id].edges[d]>TRIPLE_CARDS[touch.id].edges[(d+2)%4])touch.owner=owner;
  });
  return next;
}
const countCards=(board,owner)=>board.filter(c=>c?.owner===owner).length;

class CardTable {
  constructor(game) {this.g=game;this.selected=null;this.delay=0;this.seed=null;}
  get data() {
    const seed=this.g.s.seed;
    if(seed!==this.seed) {
      this.seed=seed;this.selected=null;this.delay=0;
      this.saved=this.g.book.cardsFor(seed)||{number:0,own:[],rival:["tower","bow","staff","fire","crown"],wins:0,match:null};
    }
    return this.saved;
  }
  save(next) {
    if(!this.g.book.writeCards(this.seed,next)){this.g.notice("札を記録できません","book");return false;}
    this.saved=next;
    return true;
  }
  hand(own) {
    const priority=own?[...this.data.own,"sun","moon","key","axe","herb"]:[...this.data.rival,"tower","bow","staff","fire","crown"];
    return [...new Set(priority)].slice(0,5);
  }
  before() {this.g.open("cards",{wager:true});}
  begin(stake=null) {
    const d=this.data;
    if(d.match && !d.match.result)return;
    const [hand,foe]=[this.hand(true),this.hand(false)];
    const giving=d.own.find(id=>hand.includes(id))||null;
    if(stake&&(!giving||!foe.includes(stake)||!d.rival.includes(stake)||d.own.includes(stake)))return;
    const match={board:Array(9).fill(null),left:[hand,foe],turn:d.number%2,stake,returnStake:giving,step:0,result:null};
    if(this.save({...d,number:d.number+1,match})) {
      this.selected=null;this.delay=this.g.time+520;
      this.g.open("cards");
    }
  }
  move(slot,card,side) {
    const d=this.data,m=d.match;
    if(!m||m.result||m.turn!==side||m.board[slot]||!m.left[side].includes(card))return;
    const board=placeCard(m.board,slot,card,side),left=m.left.map((a,i)=>i===side?a.filter(c=>c!==card):a);
    let result=null,own=d.own,rival=d.rival,wins=d.wins;
    if(board.every(Boolean)) {
      result=countCards(board,0)>=5?"勝利":"敗北";
      if(!m.stake&&!own.length){
        const training=["sun","moon","key","axe","herb"].find(id=>!d.rival.includes(id));
        if(training)own=[training];
      }
      if(result==="勝利"){
        wins++;
        if(m.stake){own=[m.stake,...own];rival=rival.filter(c=>c!==m.stake);}
      } else if(m.stake){
        own=own.filter(c=>c!==m.returnStake);rival=[m.returnStake,...rival];
      }
    }
    if(this.save({...d,own,rival,wins,match:{...m,board,left,step:m.step+1,turn:1-side,last:slot,result}})) {
      this.selected=null;this.delay=this.g.time+500;
    }
  }
  ai() {
    const m=this.data.match;
    if(!m||m.result||m.turn!==1||this.g.time<this.delay)return;
    let best=null;
    for(const card of m.left[1])for(let slot=0;slot<9;slot++) {
      if(m.board[slot])continue;
      const board=placeCard(m.board,slot,card,1);
      const captures=countCards(board,1)-countCards(m.board,1);
      let danger=0;
      neighborsOf(slot).forEach((n,d)=>{if(n>=0&&!m.board[n])danger+=5-TRIPLE_CARDS[card].edges[d];});
      const value=captures*5-danger*.26+((this.data.number*3+slot*17+Object.keys(TRIPLE_CARDS).indexOf(card)*11)%14)*.053;
      if(!best||value>best.value)best={slot,card,value};
    }
    if(best)this.move(best.slot,best.card,1);
  }
  drawCard(ui,id,x,y,w,h,owner,selected=false) {
    ui.frame(x,y,w,h,selected);
    ui.rec(x+5,y+5,w-10,h-10,owner===0?"#3b5661":"#663a42");
    ui.rec(x+7,y+7,w-14,h-14,owner===0?"#25354b":"#462d40");
    ui.rec(x+11,y+12,w-22,h-24,owner===0?"#304955":"#563344");
    if(!id)return;
    const def=TRIPLE_CARDS[id];
    if(def.portrait)ui.person(def.art,x+w/2-9,y+h/2-10,1,true);
    else ui.icon(def.art,x+w/2-10,y+h/2-10,2);
    const coords=[[x+w/2,y+11],[x+w-11,y+h/2],[x+w/2,y+h-11],[x+11,y+h/2]];
    def.edges.forEach((v,i)=>ui.text(v,...coords[i],12,i%2?PAPER:GOLD,"center",{sans:true,weight:800}));
  }
  draw(ui) {
    this.ai();
    const {g,data:d}=this,m=d.match;
    ui.modal("札の卓","book");
    if(g.panel.wager && (!m||m.result)){
      ui.text("賭ける札",39,219,17,GOLD);
      const giving=d.own.find(id=>this.hand(true).includes(id));
      const foe=this.hand(false), yours=this.hand(true);
      ui.text("手札",43,254,13,COOL);
      ui.text("相手の札",43,417,13,COOL);
      for(let i=0;i<5;i++){
        const x=40+i*65,choice=foe[i], yoursHere=yours[i];
        this.drawCard(ui,yoursHere,x,272,62,70,0,giving===yoursHere);
        this.drawCard(ui,choice,x,438,62,70,1);
        if(giving&&d.rival.includes(choice)&&!d.own.includes(choice))ui.add(x,438,62,70,()=>this.begin(choice));
      }
      if(giving)ui.text("負けると、光った札を渡す。",201,368,14,COOL,"center");
      ui.button("賭けなし",104,603,194,51,()=>this.begin(),true,"book");
      return;
    }
    const turn=m?(m.result?m.result:m.turn===0?"あなたの番":"相手の番"):"貸し札";
    ui.text(turn,44,221,17,GOLD);
    ui.text(d.wins+"勝",349,221,15,COOL,"right");
    ui.frame(43,251,316,312,true);ui.rec(48,256,306,302,"#574339");
    for(let i=0;i<9;i++) {
      const x=61+(i%3)*95,y=266+Math.floor(i/3)*95, at=m?.board[i];
      if(at)this.drawCard(ui,at.id,x,y,88,88,at.owner,m?.last===i);
      else {
        ui.frame(x,y,88,88,this.selected!==null);
        ui.rec(x+7,y+7,74,74,"#291f2b");
        ui.rec(x+13,y+13,62,62,"#312735");ui.mark(x+44,y+44,"#674e49");
        if(m?.turn===0&&this.selected)ui.add(x,y,88,88,()=>this.move(i,this.selected,0));
      }
    }
    const hand=m?.left[0]||this.hand(true);
    if(m&&!m.result) {
      hand.forEach((id,i)=>{
        const x=40+i*65;
        this.drawCard(ui,id,x,589,62,70,0,this.selected===id);
        if(m.turn===0)ui.add(x,589,62,70,()=>{this.selected=this.selected===id?null:id;});
      });
    } else {
      if(m?.result && m.stake)ui.text(m.result==="勝利"?"札を受け取った":"札を渡した",201,588,14,COOL,"center");
      ui.button("賭けなし",41,627,156,59,()=>this.begin(),true,"book");
      ui.button("札を賭ける",205,627,156,59,d.own.length?()=>this.before():null,false,"coin");
    }
  }
}
