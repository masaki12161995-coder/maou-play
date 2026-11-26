"use strict";

// These encounter profiles are local to the new first chapter.
const CH1_FOES={
  c1_rim:{...ENEMIES.bat,name:"門梁の霧耳",maxHp:37,attack:17,focus:"rear",move:"耳鳴り"},
  c1_knuckle:{...ENEMIES.marten,maxHp:48,attack:17,speed:15,focus:"weak",move:"横跳び"},
  c1_horn:{...ENEMIES.goat,maxHp:62,attack:19,focus:"front",move:"角のつき上げ"},
  c1_rust:{...ENEMIES.armor,maxHp:76,attack:21,defense:11,focus:"front",move:"盾の返し"},
  c1_paw:{...ENEMIES.dog,maxHp:52,attack:27,focus:"front",move:"足音狩り"},
  c1_metal:{...ENEMIES.iron,maxHp:75,attack:31,defense:9,focus:"weak",move:"鉄の走り"},
  c1_guard:{...ENEMIES.armor,name:"柱守の空鎧",maxHp:151,attack:29,defense:15,focus:"front",brace:1,move:"力だめ"},
  c1_warden:{...ENEMIES.dragon,maxHp:322,attack:38,defense:14,speed:9,focus:"weak",lanes:["rear","front"],move:"黒鱗の爪",bigMove:"格子の火"},
};
Object.assign(ENEMIES,CH1_FOES);
Object.assign(AREAS,CHAPTER1_MAPS);

const CH1_ENCOUNTERS={
  road:{solo:[["bat"],["marten"],["bat"]],groups:[["bat","marten"],["c1_horn"],["bat","bat"]],
    xp:10,loot:["hat","coat","bow"],quiet:[[27,15,2]]},
  climb:{groups:[["c1_horn","bat"],["c1_knuckle","bat"],["c1_horn","c1_knuckle"]],xp:14,loot:["hat","shield","bow"]},
  gate:{groups:[["c1_rim","c1_horn"],["c1_knuckle","c1_rust"],["c1_rim","c1_knuckle"]],
    xp:18,loot:["hat","coat","swordIron","shield"],quiet:[[20,25,2],[19,9,2]]},
  hall:{groups:[["c1_rim","c1_rust"],["c1_paw","c1_rim"],["c1_rust","c1_knuckle"]],
    xp:21,loot:["swordIron","steel","lantern","ring"],quiet:[[21,7,6],[21,19,2],[21,11,3]]},
  service:{groups:[["c1_rust","c1_knuckle"],["c1_paw","c1_rim"],["c1_rust","c1_rim"]],xp:18,loot:["coat","steel","lantern"]},
  wardhouse:{groups:[["c1_rust","c1_rim"],["c1_paw","c1_knuckle"]],
    xp:18,loot:["shield","lantern","ring"],quiet:[[12,32,3],[17,20,2],[26,11,3]]},
};

function ch1Opponent(code,ward){
  const base=ENEMIES[code];
  if(code!=="c1_warden")return base;
  return ward==="brace"?{...base,attack:35,tempo:4,lanes:["front","rear"]}:{...base,maxHp:346,attack:40,speed:8};
}

function ch1Speak(g,key,finish,choices){
  g.read({label:"",pages:chapterPages(key),choices,source:"chapter",onEnd:finish});
}
function ch1Mark(g,key,value=true){
  if(g.s.flags[key]===value)return false;
  g.mark(key,value);
  return true;
}
function ch1Rest(g,record=false){
  if(record)g.s.checkpoint={area:g.area.id,trail:g.field.party};
  g.rest();
}
function ch1Intro(g){
  if(g.s.flags.ch1Arrival)return;
  ch1Shot(g,"arrival",2550,()=>ch1Speak(g,"arrival",()=>ch1Mark(g,"ch1Arrival")));
}
function ch1Lift(g){
  if(g.s.flags.joinH03)return;
  ch1Shot(g,"liftWalk",1450,()=>ch1Speak(g,"liftLead",()=>{
    ch1Shot(g,"liftWedge",2050,()=>ch1Speak(g,"liftDone",()=>{
      g.s.flags.ch1Lift=true;
      g.join("H03",1,"joinH03");
    }));
  }));
}
function ch1Gate(g){
  if(!g.s.flags.joinH03||g.s.flags.joinH04)return;
  ch1Speak(g,"glenOrder",()=>{
    ch1Shot(g,"unlock",1940,()=>ch1Speak(g,"glenJoined",()=>g.join("H04",1,"joinH04")));
  });
}
function ch1Body(g){
  if(g.s.flags.body)return;
  ch1Shot(g,"court",1950,()=>ch1Speak(g,"courtBody",()=>{
    ch1Speak(g,"courtEscape",()=>{
      ch1Shot(g,"escape",2390,()=>{
        g.s.flags.body=true;g.s.flags.ch1CourtIntro=true;
        g.refresh();g.autosave();
      });
    });
  }));
}
function ch1Lamp(g){
  if(g.s.flags.ch1Lamp)return;
  ch1Shot(g,"lamp",1390,()=>ch1Speak(g,"courtLamp",()=>{
    g.s.flags.ch1Lamp=true;g.refresh();g.autosave();
  }));
}
function ch1Tidings(g){
  if(g.s.flags.ch1Debrief)return;
  ch1Shot(g,"return",1770,()=>ch1Speak(g,"bossWin",()=>{
    g.s.flags.ch1Debrief=true;
    g.refresh();g.autosave();
  }));
}
function ch1North(g,travel){
  if(g.s.chapter===1)ch1Speak(g,"chapterLeave",travel);
  else travel();
}

function chapterOneScene(id,g){
  const base=CHAPTER1_MAPS[id],f=g.s.flags;
  const encounters=CH1_ENCOUNTERS[id];
  const scene={...base,safe:base.safe&&!encounters,encounters,npcs:[],objects:[],exits:[],blocks:[],barriers:[],lamps:base.backdrop.lamps};
  const middle=()=>Boolean(f.joinH03);
  const late=()=>Boolean(f.B01);
  const word=(a,b,c)=>late()&&c?c:middle()&&b?b:a;
  const dialogues=value=>()=>chapterPages(typeof value==="function"?value():value);
  const put=(i,x,y,kind,label,value,opt={})=>{
    const item=thing(x,y,kind,label,dialogues(value),{
      sceneId:i,chapterProp:true, ...opt
    });
    scene.objects.push(item);
    return item;
  };
  const person=(code,x,y,early,mid,after,opt={})=>{
    const [name,art]=CH1_VOICES[code];
    const {value,...extra}=opt;
    scene.npcs.push(faceAt(x,y,art,name,dialogues(value||(()=>word(early,mid,after))),{sceneId:code,...extra}));
  };
  const go=(key,label,before)=>attachChapterExit(scene,id,g,key,label,before);
  const aside=(i,x,y,kind,label,value,opt={})=>put(i,x,y,kind,label,value,{
    discovery:true,walk:opt.walk??false,bounds:opt.bounds||[-18,-35,18,10],...opt
  });
  const openBox=(i,x,y,reward)=>put(i,x,y,"chest","木の宝箱",()=>g.s.claims[i]?"emptyBox":"setBox",{
    cache:true,open:!!g.s.claims[i],icon:"chest",bounds:[-18,-22,18,9],
    onEnd:()=>g.openChest(i,reward),
  });
  const fire=(i,x,y,label="休み火",record=false)=>put(i,x,y,"fire",label,"camp",{
    bounds:[-19,-29,20,9],icon:"herb",onEnd:()=>ch1Rest(g,record)
  });
  const fight=(i,x,y,key,list,story,xp,extra={})=>{
    if(key&&f[key])return;
    const foe=ENEMIES[list[0]];
    return put(i,x,y,null,foe.name,story,{
      chapterProp:false,image:foe.art,boss:!!extra.boss,foeList:list,manualEncounter:true,
      instant:!!extra.instant,onEnd:()=>g.fight(list,key,{track:"ch1",boss:!!extra.boss,xp}),...extra
    });
  };
  const look=(key,update=false)=>()=>{if(ch1Mark(g,key)&&update)g.refresh();};
  const support=(n="material")=>()=>g.grantQuest("ch1:"+n,n);
  const complete=(key,value,reward)=>{
    f[key]=value;
    if(reward&&!g.s.claims[key])g.grantQuest(key,reward);
    else g.autosave();
    g.refresh();
  };
  const closeTiles=(tiles,look=0)=>{
    for(const [col,row] of tiles){
      scene.blocks.push([col,row]);
      scene.barriers.push({col,row,kind:"barrier",look,chapterProp:true});
    }
  };
  const choice=(label,response)=>({label,response:response?chapterPages(response):null});
  const fit=()=>{
    if(f.ch1Iron)return;
    ch1Speak(g,"ironShed",i=>{
      if(i===0)ch1Speak(g,"ironWrong");
      else if(i===1)ch1Speak(g,"ironDone",()=>complete("ch1Iron",true,"steel"));
    },[choice("端まで詰める角鉄"),choice("木が逃げる角鉄")]);
  };

  if(id==="town"){
    if(!f.ch1FlagPattern||f.sewnFlag)person("V",23,19,"vesterEarly","vesterMid","vesterLate",{onEnd:()=>{if(!f.ch1FlagRequest)ch1Mark(g,"ch1FlagRequest");}});
    person("D",18,18,"denEarly","denMid","denLate",{activity:"crate"});
    person("E",10,20,"wellEarly","wellMid","wellLate",{activity:"bundle"});
    person("N",12,12,"romEarly","romMid","romLate",{activity:"sweep"});
    person("K",25,22,"shopEarly","shopMid","shopLate",{activity:"sort",onEnd:()=>g.open("shop")});
    if(f.ch1Homes!=="wide")person("W",20,22,"watcherEarly","watcherMid","watcherLate");
    person("C",17,8,"captainEarly","captainMid","captainLate",{value:()=>f.B01?"captainLate":f.joinH04?"captainMid":"captainEarly"});
    if(!f.joinH03)person("B",20,16,"liftWait","liftWait","liftWait",{
      onEnd:()=>{if(f.flagSeen)ch1Lift(g);}
    });
    if(!f.joinH04)person("G",14,10,"glenEarly","glenOrder","glenJoined",{
      value:()=>f.joinH03&&!f.ch1LiftPass?"c1GlenHold":"glenEarly",
      onEnd:()=>{if(f.joinH03&&f.ch1LiftPass)ch1Gate(g);}
    });
    put("copperFlag",15,19,"repairFlag","坂の銅旗",()=>f.sewnFlag?"flagRevisit":"flag",{
      look:f.sewnFlag?1:0,discovery:true,quest:"flag",glint:!f.flagSeen,icon:"flag",
      bounds:[-20,-91,44,10],onEnd:look("flagSeen",true),
    });
    put("townLift",17,15,"lift","荷の昇降機",()=>f.joinH03?"stoppers":"liftWait",{
      open:!!f.joinH03,bounds:[-24,-56,26,10],onEnd:()=>{if(f.flagSeen&&!f.joinH03)ch1Lift(g);}
    });
    aside("waitingBoards",14,26,"table","時刻の違う札","c1QuietPlaza",{});
    put("liftPass",17,20,"cargo","下りる人の札",()=>f.ch1LiftPass?"c1LiftReturn":f.joinH03?"c1LiftPass":"c1LiftUnready",{
      quest:"pass",glint:!!f.joinH03&&!f.ch1LiftPass,bounds:[-36,-33,36,10],
      onEnd:()=>{
        if(!f.joinH03||f.ch1LiftPass)return;
        ch1Shot(g,"townPass",1650,()=>ch1Speak(g,"c1LiftReturn",()=>complete("ch1LiftPass",true,null)));
      }
    });
    if(f.joinH04)go("townClimb","角影坂");
    else put("townGate",15,6,"gate","鉄の戸",()=>f.joinH03?"captainMid":"captainEarly",{});
    go("townHomes","石工の長屋");
    go("lowerHomes","石工の長屋の下段");
    go("townInn","旗待ちの宿");
    go("townRoad","松影の街道");
    if(f.B01)go("townNord","ノルドへの尾根",travel=>ch1North(g,travel));
    aside("wellLine",11,20,"seal","井戸の線","wellMark",{icon:"vial"});
    aside("wedges",19,16,"bundles","支え木の束","stoppers",{icon:"rope"});
    aside("chalk",5,22,"floorLight","白の粉印","chalkTiles",{look:1,walk:true});
    aside("yardBell",24,27,"signpost","舌のない鈴","porchBell",{});
    openBox("c1TownBox",22,29,"hat");
    if(f.B01&&f.ch1WayBack)go("hallTown","裏の下り段");
    if(g.s.chapter>=2)put("postern",12,16,"board","閉門板","gateCrate",{onEnd:()=>g.grantQuest("postern","book")});
  } else if(id==="longhouses"){
    if(!f.ch1FlagPattern||f.sewnFlag)person("A",27,14,"maaraEarly","maaraMid","maaraLate",{activity:"sort"});
    if(!middle()||late())person("S",7,18,"stoneEarly","stoneMid","stoneLate",{activity:"smith"});
    person("P",20,16,"zenEarly","zenMid","zenLate",{
      value:()=>f.ch1Homes?"homesLater":word("zenEarly","zenMid","zenLate"),
      onEnd:()=>{if(middle()&&!f.ch1HomeRequest)ch1Speak(g,"homesBegin",look("ch1HomeRequest",true));}
    });
    person("R",32,19,"tomaEarly","tomaMid","tomaLate",{
      activity:"sweep",value:()=>f.ch1PaneDone?"tomaLate":f.ch1PaneHook?"c1PaneFinish":word("tomaEarly","tomaMid","tomaLate"),
      onEnd:()=>{
        if(f.ch1PaneHook&&!f.ch1PaneDone)ch1Shot(g,"pane",1200,()=>complete("ch1PaneDone",true,"book"));
        else if(f.joinH03&&!f.ch1PaneTask)ch1Speak(g,"c1PaneStart",()=>ch1Mark(g,"ch1PaneTask"));
      }
    });
    person("H",12,21,"lauEarly","lauMid","lauLate",{
      value:()=>f.ch1NameDone?"nameAfter":f.ch1NamePiece?"nameComplete":word("lauEarly","lauMid","lauLate"),
      onEnd:()=>{if(f.ch1NamePiece&&!f.ch1NameDone)complete("ch1NameDone",true,"book");}
    });
    go("townHomes","鉄門広場");
    go("lowerHomes","鉄門広場の下段");
    go("homesForge","角鉄の工房");
    go("homesStore","預かり倉",travel=>ch1Speak(g,"cisternDoor",travel));
    aside("flagPattern",26,16,"clothRail","古い縫い型","flagPattern",{quest:"flag",walk:false,onEnd:look("ch1FlagPattern")});
    aside("linens",17,15,"wash","干してある布","linen",{});
    aside("wellChest",11,23,"bunks","帰りの敷板","bedMark",{});
    aside("nameBench",6,21,"bench","名札を読む台",()=>f.ch1NameDone?"nameAfter":"nameBench",{quest:"name",onEnd:look("ch1NameBench")});
    aside("namesOld",15,23,"seal","井戸の名札","namesOld",{});
    if(f.ch1PaneDone)aside("returnedPane",30,17,"floorLight","光の入る窓","c1PaneFinish",{walk:true,look:1});
    if(f.ch1HomeRequest||f.ch1Homes){
      aside("seatWarm",16,19,"hearth","炉のそばの敷板",()=>f.ch1Homes==="warm"?"homesDoneWarm":"homesWarm",{
        quest:"homes",onEnd:look("ch1SeatWarm",true)
      });
      aside("seatWide",28,24,"beds","段の下の敷物",()=>f.ch1Homes==="wide"?"homesDoneWide":"homesWide",{
        quest:"homes",onEnd:look("ch1SeatWide",true)
      });
      put("housePlate",21,21,"paper","長屋の戸札",()=>f.ch1Homes?"homesLater":"homesPick",{
        quest:"homes",choices:!f.ch1Homes&&f.ch1SeatWarm&&f.ch1SeatWide?[choice("炉のそばで待つ"),choice("段の下で待つ")]:null,
        onEnd:i=>{
          if(i===null||f.ch1Homes)return;
          const pick=i===0?"warm":"wide";
          ch1Speak(g,i===0?"homesDoneWarm":"homesDoneWide",()=>complete("ch1Homes",pick,"book"));
        }
      });
    }
    if(f.ch1Homes==="wide"){
      person("W",29,24,"watcherEarly","watcherMid","watcherLate");
      aside("wideLights",27,21,"floorLight","段の下の明かり","homesLater",{look:1,walk:true});
    }else if(f.ch1Homes==="warm")aside("warmLights",18,18,"floorLight","炉の明かり","homesLater",{look:1,walk:true});
    openBox("c1LongBox",5,18,"coat");
  } else if(id==="inn"){
    person("U",14,16,"innGirlEarly","innGirlMid","innGirlLate",{onEnd:()=>ch1Rest(g),activity:"sort"});
    if(f.ch1FlagPattern&&!f.sewnFlag){
      person("V",9,11,"vesterEarly","vesterMid","vesterLate");
      person("A",17,16,"maaraEarly","maaraMid","maaraLate",{activity:"sort"});
    }
    person("T",7,17,"toveEarly","toveMid","toveLate",{
      value:()=>f.ch1CupDone?"cupAfter":f.ch1Cup?"cupReturn":word("toveEarly","toveMid","toveLate"),
      onEnd:()=>{if(f.ch1Cup&&!f.ch1CupDone)complete("ch1CupDone",true,"book");else ch1Mark(g,"ch1CupRequest");}
    });
    go("townInn","鉄門広場");
    put("c1Cards",15,22,"table","札の卓","cardStory",{icon:"book",instant:true,onEnd:()=>g.open("cards"),bounds:[-38,-28,39,10]});
    aside("cardLedger",13,23,"paper","卓の短い覚え書き","cardStory",{quest:"cards"});
    aside("innWindow",7,9,"clothRail","北窓の布","sailcloth",{});
    aside("innCot",17,13,"bunks","小さい寝台","innCots",{});
    aside("innBird",12,10,"table","返し棚の椀",()=>f.ch1CupDone?"cupAfter":"innCots",{quest:"cup"});
    put("tailoring",8,15,"repairFlag","布の折り返し","flagCloth",{
      discovery:true,quest:"flag",bounds:[-17,-60,28,10],look:f.sewnFlag?1:0,onEnd:look("ch1FlagSeam")
    });
    put("flagHelp",6,12,"table","旗縫いの支度","flagRequest",{
      quest:"flag",onEnd:look("ch1FlagRequest")
    });
    put("flagSew",16,17,"repairFlag","旗の縫い台",()=>f.sewnFlag?"flagRevisit":"flagNeeds",{
      quest:"flag",look:f.sewnFlag?1:0,glint:!!f.ch1FlagPattern&&!!f.ch1Resin&&!f.sewnFlag,onEnd:()=>{
        if(f.sewnFlag||!(f.ch1FlagSeam&&f.ch1FlagPattern&&f.ch1Resin))return;
        ch1Speak(g,"flagSew",i=>{
          if(i===0)ch1Speak(g,"flagWrong");
          if(i===1)ch1Shot(g,"flag",1150,()=>ch1Speak(g,"flagFinished",()=>complete("sewnFlag",true,"material")));
        },[choice("同じ長さで縫う"),choice("長い目と短い目")]);
      }
    });
    openBox("c1InnBox",16,8,"material");
  } else if(id==="workshop"){
    person("J",14,12,"forgeHandEarly","forgeHandMid","forgeHandLate",{activity:"smith",onEnd:()=>g.open("forge")});
    if(middle()&&!late())person("S",11,10,"stoneEarly","stoneMid","stoneLate",{activity:"smith"});
    go("homesForge","石工の長屋");
    aside("forgeMold",18,8,"forgeAnvil","角鉄の二つの型","ironShed",{quest:"iron",onEnd:look("ch1IronForm")});
    aside("forgeOre",6,12,"stones","炉の枝鉄","spareOre",{onEnd:support("material")});
    aside("forgeHammer",9,13,"rack","掛けた槌の跡","hammerSign",{});
    aside("forgePad",19,22,"stoneYard","薄い端材","splitPad",{});
    put("forgeFit",12,18,"forgeAnvil","戸の角鉄",()=>f.ch1Iron?"ironAfter":"ironClue",{
      quest:"iron",icon:"starterAxe",onEnd:()=>{if(!f.ch1Iron&&f.ch1IronForm&&f.ch1IronDent)fit();}
    });
    openBox("c1ForgeBox",6,7,"material");
    openBox("c1ForgeApron",20,20,"shield");
  } else if(id==="road"){
    person("F",19,30,"bridgeKeeperEarly","bridgeKeeperMid","bridgeKeeperLate",{
      value:()=>f.ch1BellDone?"bellAfter":f.ch1Bell?"bellGive":word("bridgeKeeperEarly","bridgeKeeperMid","bridgeKeeperLate"),
      onEnd:()=>{
        if(f.ch1Bell&&!f.ch1BellDone)complete("ch1BellDone",true,"lantern");
        else if(!f.ch1BellTask)ch1Speak(g,"bellFirst",()=>ch1Mark(g,"ch1BellTask"));
      }
    });
    person("M",28,23,"roadWomanEarly","roadWomanMid","roadWomanLate",{
      activity:"bundle",approach:!f.ch1RoadCall&&(([x,y])=>x===27&&y===15),
      onEnd:()=>{if(!f.ch1RoadCall){ch1Mark(g,"ch1RoadCall");g.refresh();}}
    });
    go("townRoad","鉄門広場");
    if(g.s.chapter>=2)go("roadPine","松煙小屋");
    aside("rootSteps",9,20,"fallenLog","食い込んだ松の根","roadRoots",{});
    aside("lowLedge",12,33,"posts","下の縁を見渡す","ledgeView",{walk:true});
    aside("sapCup",8,15,"sap","松脂の受け皿","resin",{quest:"flag",onEnd:look("ch1Resin")});
    aside("c1Cup",20,32,"table","鳥のある木椀",()=>f.ch1CupDone?"cupAfter":"cupBank",{quest:"cup",glint:!f.ch1Cup,onEnd:look("ch1Cup",true)});
    aside("bellRope",12,26,"rope","長さの違う縄","bellRope",{quest:"bell",walk:true,onEnd:look("ch1BellRope")});
    aside("bellTag",24,27,"paper","雨で白くなった札","bellFalse",{quest:"bell"});
    aside("bellHub",16,36,"cart","半分の車輪",()=>f.ch1BellDone?"bellAfter":"bellFind",{
      quest:"bell",walk:true,onEnd:look("ch1Bell")
    });
    aside("roadLabel",31,26,"signpost","荷を通す札","roadSeal",{});
    aside("wheelSign",8,34,"signpost","水車の板札",()=>f.ch1WheelDone?"wheelAfter":"wheelBegin",{
      quest:"wheel",onEnd:look("ch1WheelTask")
    });
    put("wheelStop",11,35,"waterwheel","根を押さえる縄",()=>f.ch1WheelDone?"wheelAfter":"wheelInspect",{
      quest:"wheel",look:f.ch1WheelDone?1:0,glint:!f.ch1WheelDone,onEnd:()=>{
        if(f.ch1WheelDone)return;
        ch1Shot(g,"wheel",1450,()=>complete("ch1WheelDone",true,"material"));
      }
    });
    if(!f.ch1WheelDone)closeTiles([[13,30]],1);
    else aside("wheelPlank",13,30,"bridgehead","水車の側の新しい板","wheelAfter",{walk:true});
    if(f.ch1BellDone)aside("bellFixed",18,35,"bridgehead","取り替えた橋板","bellAfter",{walk:true});
    openBox("c1RoadBox",14,12,"material");
    openBox("c1RoadPouch",9,36,"bow");
  } else if(id==="climb"){
    go("townClimb","鉄門広場");
    go("climbOverlook","外壁の見晴らし棚");
    if(f.ch1RoadRise&&f.ch1SecondView)go("climbGate","飛び石の巨角門");
    else put("climbGate",21,6,"gate","角の上の戸","c1UpperDoor",{});
    aside("highView",18,9,"hornStone","旗が映る角の石","c1SecondView",{
      quest:"approach",look:1,glint:!f.ch1SecondView,walk:false,
      onEnd:()=>{
        if(f.ch1SecondView)return;
        ch1Shot(g,"flagNorth",1250,()=>complete("ch1SecondView",true,null));
      }
    });
    aside("lostHook",14,30,"rope","赤い木屑の鉤","c1PaneHook",{quest:"pane",glint:!f.ch1PaneHook,onEnd:look("ch1PaneHook",true)});
    aside("hornRise",22,24,"hornStone","岩の二つの角","roadRise",{quest:"approach",walk:true,onEnd:look("ch1RoadRise",true)});
    aside("rockFoot",8,18,"stones","違う土の足跡","riseFoot",{});
    aside("copperStone",13,14,"signpost","赤銅の道しるべ","riseMark",{glint:true,onEnd:look("ch1TraceRise")});
    aside("ch1IronDent",9,29,"rope","折れた角鉄","ironClue",{quest:"iron",walk:true,onEnd:look("ch1IronDent")});
    aside("c1Spring",25,27,"urn","冷やし水の穴","riseSpring",{});
    openBox("c1RiseBox",24,23,"material");
    openBox("c1RiseSatchel",9,10,"coat");
  } else if(id==="gate"){
    go("climbGate","角影坂");
    if(f.ch1GateEye||f.ch1GateChain)go("gateCourt","玉座庭");
    else put("gateHint",20,6,"gate","奥の止まり戸","gateHint",{});
    aside("gateEye",19,9,"floorLight","綱の光を通す穴",()=>f.ch1GateEye?"c1GateReturn":"c1GateEye",{
      quest:"gate",glint:!f.ch1GateEye,look:f.ch1GateEye?1:0,onEnd:()=>{
        if(f.ch1GateEye)return;
        ch1Shot(g,"gateEye",1130,()=>complete("ch1GateEye",true,null));
      }
    });
    person("I",29,13,"lampKeeperEarly","lampKeeperMid","lampKeeperLate",{
      value:()=>f.ch1LampDone?"lampAfter":f.ch1Oil?"lampFill":word("lampKeeperEarly",f.body?"lampKeeperMid":null,"lampKeeperLate"),
      onEnd:()=>{
        if(f.ch1Oil&&!f.ch1LampDone)complete("ch1LampDone",true,"lantern");
        else if(f.body&&!f.ch1LampJob)ch1Speak(g,"lampDoor",()=>ch1Mark(g,"ch1LampJob"));
      }
    });
    aside("firstCross",20,25,"bridgehead","高い板と低い板","ferryFork",{walk:true,onEnd:look("ch1CrossSeen")});
    aside("wornRung",16,26,"stoneYard","持ち上げる板の穴","c1WornRung",{walk:true});
    aside("underChain",13,14,"gate","斜めになった鎖","oldChain",{quest:"chain",onEnd:look("ch1ChainSeen")});
    aside("posternChain",30,17,"rope","縦の穴の綱",()=>f.ch1GateChain?"gateChainReady":"c1GateLever",{
      quest:"chain",walk:true,onEnd:()=>{
        if(f.ch1GateChain)return;
        ch1Shot(g,"chain",1000,()=>ch1Speak(g,"gateChainReady",()=>complete("ch1GateChain",true,"material")));
      }
    });
    aside("crateWall",10,25,"cargo","仕分けの籠","gateCrate",{});
    aside("gateGutter",30,20,"urn","溝のすす","gutter",{});
    aside("fresco",11,11,"wallRelief","角の古い絵","gateFresco",{glint:true});
    if(f.ch1GateChain)go("courtSide","玉座庭の席側");
    if(f.B01)aside("gateReturn",23,12,"floorLight","手渡す灯","c1QuietEnd",{look:1,walk:true});
    if(f.body){
      go("gateWard","外壁の詰所");
      fight("gateHorns",9,26,"c1GateHorns",["c1_horn","c1_knuckle"],"patrolBrush",16);
      fight("gateWing",27,23,"c1GateWing",["c1_rim","c1_rim","c1_knuckle"],"patrolBat",22);
      if(f.c1GateHorns&&f.c1GateWing){
        const patrols=[["c1_knuckle","c1_rim"],["c1_rim","c1_horn"],["c1_horn","c1_knuckle"]];
        fight("gatePatrol",23,14,null,patrols[g.s.battles%patrols.length],"patrolReturns",14);
      }
    }
    openBox("c1GateIron",30,24,"hat");
    openBox("c1GateTools",12,17,"material");
  } else if(id==="court"){
    go("gateCourt","飛び石の巨角門");
    if(f.ch1GateChain)go("courtSide","飛び石の巨角門の脇口");
    if(!f.body)person("L",25,15,"courtWindow","courtWindow","courtWindow",{facing:1});
    put("royalStill",18,13,"body","玉座の下",()=>f.body?"courtEmpty":"courtBody",{
      icon:null,image:"H16",bounds:[-48,-82,50,12],
      instant:!f.body,onEnd:()=>{if(!f.body)ch1Body(g);}
    });
    scene.blocks.push([17,13],[19,13],[17,12],[18,12],[19,12]);
    aside("courtCrown",20,15,"crown","床の冠","crown",{icon:"coin",onEnd:look("crown")});
    aside("courtSeal",10,12,"seal","黒鉄の板","seal",{icon:"sealIcon",onEnd:look("seal")});
    aside("courtOrder",29,23,"paper","二筆の命令書","order",{icon:"book",onEnd:look("order")});
    aside("courtWindow",26,14,"armorStand","窓に並べた盾","courtWindow",{});
    aside("armorFoot",12,15,"wallRelief","空の鎧を支える木","c1LookCourt",{});
    aside("courtPaths",15,29,"wayStripe","石に残った歩幅","c1CourtPaths",{walk:true,look:1});
    aside("courtFold",19,25,"clothRail","巻き取っていない垂れ布","c1CourtFold",{walk:true});
    aside("courtSash",28,29,"rope","低い窓のひも",()=>f.ch1SeatWindow?"c1SeatMove":"c1SeatClue",{
      quest:"sash",glint:!!f.body&&!f.ch1SeatWindow,onEnd:()=>{
        if(!f.body||f.ch1SeatWindow)return;
        ch1Shot(g,"sash",1180,()=>ch1Speak(g,"c1SeatMove",()=>complete("ch1SeatWindow",true,"material")));
      }
    });
    aside("courtRail",8,29,"rail","二色の欄干","courtRail",{walk:true});
    aside("namePiece",27,31,"seal","半分の石札","namePiece",{quest:"name",onEnd:look("ch1NamePiece")});
    aside("courtLamp",29,13,"floorLight","上がった灯の金具",()=>f.ch1Lamp?"courtLamp":"courtEmpty",{
      quest:"lampFix",look:f.ch1Lamp?1:0,glint:!!f.body&&!f.ch1Lamp,instant:!!f.body&&!f.ch1Lamp,
      onEnd:()=>{if(f.body&&!f.ch1Lamp)ch1Lamp(g);}
    });
    aside("footsteps",27,10,"floorLight","濡れ跡の端","courtEmpty",{walk:true,look:f.body?1:0});
    if(f.ch1Lamp){
      go("courtHall","黒天井の回廊");
      aside("courtRest",28,23,"floorLight","残しておく灯","c1CourtReturn",{look:1,walk:true});
    }
    if(f.ch1Lamp&&f.ch1SeatWindow)go("hallMaintenance","下の保守段");
    openBox("c1CourtBox",11,31,"shield");
  } else if(id==="hall"){
    go("courtHall","玉座庭");
    if(f.ch1SeatWindow&&f.ch1Lamp)go("hallMaintenance","玉座庭の保守段");
    if(f.ch1WardPath&&f.ch1Lamp){
      if(f.ch1WardPlan==="high")go("wardHigh","外壁の詰所の上口");
      else go("wardLow","外壁の詰所の下口");
    }
    fire("hallCamp",18,34,"梁の下の休み火",true);
    fire("bossCamp",25,12,"格子前の灯",true);
    aside("hallBrace",15,29,"rail","片方だけの錘","hallWeights",{});
    aside("hallBridge",29,16,"posts","縁の焼けた板","hallBridge",{walk:true});
    aside("hallDrain",8,21,"urn","煤の溝","hallDrain",{});
    aside("hallJoint",21,30,"stoneYard","歩いて擦れた留め金","c1HallJoint",{walk:true});
    go("hallService","灯の物置");
    if(f.ch1StoreReturn||f.ch1LampDone)go("upperService","灯の物置の上口");
    if(f.B01){
      go("hallNord","ノルドへの尾根",travel=>ch1North(g,travel));
      go("hallTown","広場へ戻る階段",travel=>{
        if(f.ch1WayBack)travel();
        else ch1Speak(g,"returnStair",()=>{f.ch1WayBack=true;travel();});
      });
    }
    if(f.ch1BarOpen&&!f.B01){
      aside("openedBar",21,19,"floorLight","上がった横木","c1HallCross",{look:1,walk:true});
      aside("northLens",21,11,"floorLight","格子の二つの灯","c1Lens",{quest:"lens",look:f.ch1WardStyle?1:0,glint:!f.ch1WardStyle,walk:true});
      const lens=(id,x,y,title,option,reading)=>put(id,x,y,"floorLight",title,reading,{
        quest:"lens",look:f.ch1WardStyle===option?1:0,glint:!f.ch1WardStyle,
        onEnd:()=>{
          if(f.ch1WardStyle===option)return;
          ch1Shot(g,option==="brace"?"braceLens":"cutLens",1360,()=>complete("ch1WardStyle",option,null));
        }
      });
      lens("wardBrace",19,10,"西の盾明かり","brace","c1LensBrace");
      lens("wardCut",24,10,"東の筋明かり","cut","c1LensCut");
    }
    if(!f.ch1BarOpen&&!f.B01){
      const canOpen=()=>f.c1LiftWest||f.c1LiftEast;
      put("crossBar",21,19,"gate","降りた横木",()=>canOpen()?"hallBar":"hallClosed",{
        quest:"bar",onEnd:()=>{
          if(!canOpen())return;
          ch1Shot(g,"bar",1320,()=>complete("ch1BarOpen",true,null));
        }
      });
      for(let x=18;x<=26;x++){
        scene.blocks.push([x,12]);
        closeTiles([[x,13]],1);
      }
    }
    if(f.body){
      fight("hallWest",13,28,"c1LiftWest",["c1_guard","c1_rim"],"patrolArmor",41);
      fight("hallEast",32,28,"c1LiftEast",["c1_metal","c1_paw","c1_rim"],"patrolDog",41);
      fight("hallDark",10,24,"c1HallDark",["c1_rust","c1_knuckle"],"patrolArmor",19);
      fight("hallHigh",34,14,"c1HallHigh",["c1_metal","c1_rim"],"patrolDog",21);
      if(f.ch1BarOpen&&f.ch1WardStyle)fight("hallBoss",21,7,"B01",["c1_warden"],"bossWait",130,{boss:true});
    }
    openBox("c1HallShield",11,32,"steel");
    openBox("c1HallLamp",34,25,"lantern");
    openBox("c1HallNook",17,10,"swordIron");
  } else if(id==="service"){
    go("hallService","黒天井の回廊");
    if(f.ch1StoreReturn||f.ch1LampDone)go("upperService","上の横口");
    aside("storeOil",9,12,"urn","薄い油の瓶口","storeOil",{});
    aside("storePlanks",18,20,"posts","抜けた丸い板","storePlanks",{walk:true});
    aside("storeBench",8,26,"bench","煤をはらった椅子","storeBench",{});
    aside("storeWide",26,19,"rack","下がった棚","storeroom",{});
    aside("storeCloth",22,15,"roll","巻いた返し布","c1WingShelf",{quest:"service"});
    put("oilBottle",22,10,"urn","棚の薄い瓶","lampStock",{
      quest:"lamp",icon:"vial",glint:!f.ch1Oil,onEnd:look("ch1Oil",true)
    });
    put("smallWeights",26,14,"rope","ふたつの吊り石",()=>f.ch1StoreReturn?"serviceAgain":"serviceSwitch",{
      quest:"service",glint:!f.ch1StoreReturn,onEnd:()=>{
        if(f.ch1StoreReturn)return;
        ch1Shot(g,"store",1200,()=>complete("ch1StoreReturn",true,"material"));
      }
    });
    if(f.body){
      fight("stockDogs",11,22,"c1StockDogs",["c1_metal","c1_knuckle"],"patrolDog",17);
      fight("stockArmor",26,17,"c1StockArmor",["c1_guard","c1_paw"],"patrolArmor",22);
    }
    openBox("c1StoreBox",8,29,"material");
    openBox("c1StoreShelf",17,11,"ring");
  } else if(id==="cistern"){
    go("homesStore","石工の長屋");
    if(f.ch1SignalDone)go("overlookStore","見晴らし棚への戸");
    person("O",11,26,"cisternGuardEarly","cisternGuardMid","cisternGuardLate",{
      value:()=>f.ch1SignalDone&&!f.ch1SignalGift?"signalThanks":word("cisternGuardEarly","cisternGuardMid","cisternGuardLate"),
      onEnd:()=>{if(f.ch1SignalDone&&!f.ch1SignalGift)complete("ch1SignalGift",true,"steel");}
    });
    person("Y",25,15,"cisternKeeperEarly","cisternKeeperMid","cisternKeeperLate",{activity:"sort"});
    person("X",10,13,"cisternHandEarly","cisternHandMid","cisternHandLate",{activity:"bundle"});
    aside("cisternMark",16,24,"seal","水の高さを測る印","cisternMark",{quest:"signal",onEnd:look("ch1CisternMark",true)});
    const latch=(id,x,y,label,way,text)=>put(id,x,y,"rope",label,()=>f.ch1CisternWay===way?text:way==="upper"?"cisternUpperRing":"cisternLowerRing",{
      walk:true,quest:"signal",glint:f.ch1CisternMark&&!f.ch1CisternWay,onEnd:()=>{
        if(!f.ch1CisternMark||f.ch1CisternWay===way)return;
        ch1Shot(g,way==="upper"?"cisternUpper":"cisternLower",1380,()=>ch1Speak(g,text,()=>complete("ch1CisternWay",way,null)));
      }
    });
    latch("cisternWide",18,24,"長い板の留め輪","upper","cisternUpper");
    latch("cisternLow",20,26,"低い板の留め輪","lower","cisternLower");
    if(f.ch1CisternWay!=="upper")closeTiles([[17,19]]);
    if(f.ch1CisternWay!=="lower")closeTiles([[21,26],[22,26]]);
    if(f.ch1CisternWay)put("cisternLantern",27,9,"floorLight","太い取っ手の灯","cisternLantern",{
      quest:"signal",icon:"lantern",look:1,glint:!f.ch1LanternToken,onEnd:look("ch1LanternToken",true)
    });
    aside("cisternTin",8,21,"urn","冷ましたやかん","cisternTin",{});
    aside("cisternShadow",15,11,"roll","半分だけ乾いた布","cisternShadow",{});
    aside("cisternRope",23,29,"rope","左右の違う綱","cisternRope",{});
    aside("cisternHatch",28,26,"wallRelief","脇の戸の切り込み","cisternHatch",{});
    openBox("c1CisternBoxA",10,31,"material");
    openBox("c1CisternBoxB",31,28,"ring");
  } else if(id==="overlook"){
    go("climbOverlook","角影坂");
    person("Q",22,16,"roofEarly","roofMid","roofLate",{activity:"smith"});
    person("Z",32,22,"carrierEarly","carrierMid","carrierLate",{activity:"crate"});
    aside("signalWind",20,8,"clothRail","二色に見える旗の影","overlookWind",{quest:"signal",onEnd:look("ch1SignalWind")});
    aside("signalPlank",16,12,"bridgehead","裏表に線のある板","overlookPlank",{walk:true});
    aside("signalRoof",29,20,"watchRoof","風を逃がす屋根","overlookRoof",{});
    aside("signalRail",22,21,"rail","外れた柵の棒","overlookRail",{walk:true});
    const signal=(id,x,y,low)=>put(id,x,y,"floorLight",low?"低い横の枠":"高い縦の枠",()=>f.ch1SignalDone?"overlookAfter":low?"overlookLowFrame":"overlookHighFrame",{
      quest:"signal",look:f.ch1SignalDone&&low?1:0,glint:!!f.ch1LanternToken&&!f.ch1SignalDone,
      onEnd:()=>{
        if(!f.ch1LanternToken||f.ch1SignalDone)return;
        if(!low){ch1Speak(g,"overlookTryHigh");return;}
        ch1Shot(g,"signal",1770,()=>ch1Speak(g,"overlookSuccess",()=>complete("ch1SignalDone",true,null)));
      }
    });
    signal("signalHigh",25,9,false);
    signal("signalLow",27,11,true);
    if(f.ch1SignalDone)go("overlookStore","札を入れる下の戸");
    openBox("c1OverlookBoxA",11,19,"lantern");
    openBox("c1OverlookBoxB",31,24,"material");
  } else if(id==="wardhouse"){
    go("gateWard","飛び石の巨角門");
    const wardWord=(a,b,c)=>f.ch1WardPath?c:f.ch1WardPlan?b:a;
    person("AA",f.ch1WardPath?15:12,f.ch1WardPath?30:32,"wardMasterEarly","wardMasterSet","wardMasterLate",{
      value:()=>f.ch1WardPath&&!f.ch1WardGift?"wardThanks":wardWord("wardMasterEarly","wardMasterSet","wardMasterLate"),
      onEnd:()=>{if(f.ch1WardPath&&!f.ch1WardGift)complete("ch1WardGift",true,"book");}
    });
    person("AB",f.ch1WardPath?11:8,f.ch1WardPath?34:33,"wardHerbsEarly","wardHerbsSet","wardHerbsLate",{
      activity:"sort",value:()=>wardWord("wardHerbsEarly","wardHerbsSet","wardHerbsLate")
    });
    const high=f.ch1WardPlan==="high";
    person("AC",f.ch1WardPath?(high?19:30):26,f.ch1WardPath?(high?30:32):30,"wardScoutEarly","wardScoutSet","wardScoutLate",{
      value:()=>wardWord("wardScoutEarly","wardScoutSet","wardScoutLate")
    });
    aside("wardShields",7,23,"armorStand","火を避ける盾","wardShields",{
      quest:"ward",glint:!f.ch1WardShields,onEnd:look("ch1WardShields",true)
    });
    aside("wardBurn",24,31,"posts","先だけ焦げた杭","wardBurn",{
      quest:"ward",glint:!f.ch1WardBurn,onEnd:look("ch1WardBurn",true)
    });
    const planText=()=>f.ch1WardPlan?(high?"wardHigh":"wardLow"):
      f.ch1WardShields&&f.ch1WardBurn?"wardDecision":"wardWrong";
    put("wardControl",17,20,"floorRig","火を返す石枠",planText,{
      quest:"ward",look:f.ch1WardPlan?1:0,glint:!!f.ch1WardShields&&!!f.ch1WardBurn&&!f.ch1WardPlan,
      choices:!f.ch1WardPlan&&f.ch1WardShields&&f.ch1WardBurn?[choice("上の手すりへ逃がす"),choice("下の石戸へ逃がす")]:null,
      onEnd:i=>{
        if(i===null||f.ch1WardPlan)return;
        const upper=i===0;
        const effect=upper?"wardHigh":"wardLow";
        ch1Shot(g,effect,1640,()=>ch1Speak(g,effect,()=>complete("ch1WardPlan",upper?"high":"low",null)));
      }
    });
    if(!high)closeTiles([[17,25],[18,25]]);
    else aside("wardSpurA",18,25,"bridgehead","石に届いた板","wardHigh",{walk:true});
    if(f.ch1WardPlan!=="low")closeTiles([[29,21],[30,21],[31,21]],1);
    else aside("wardSpurB",30,21,"bridgehead","手の届く石戸","wardLow",{walk:true});
    aside("wardSill",21,27,"wallRelief","足元の白い窓","wardSill",{});
    aside("wardMirror",23,12,"floorLight","割れた反し石","wardMirror",{look:1});
    aside("wardFloorMarks",27,16,"wayStripe","歩幅の違う焦げ","wardFloorMarks",{walk:true});
    aside("wardShelter",13,36,"bunks","壁を背にした椅子","wardShelter",{});
    fire("wardCamp",11,30,"詰所の休み灯",true);
    if(f.ch1WardPlan&&!f.ch1WardLid)put("wardLid",26,11,"gate","縦に開く石の蓋","wardLid",{
      quest:"ward",glint:true,onEnd:()=>ch1Shot(g,"wardLid",1350,()=>complete("ch1WardLid",true,null))
    });
    if(f.ch1WardLid)fight("wardAsh",28,10,"c1WardAsh",["c1_rust","c1_paw"],"wardAsh",26);
    if(f.c1WardAsh)put("wardFlame",27,7,"floorLight","台に残った火","wardFlame",{
      quest:"ward",instant:!f.ch1WardPath,look:1,glint:!f.ch1WardPath,onEnd:()=>{
        if(!f.ch1WardPath)ch1Shot(g,"wardFlame",1860,()=>ch1Speak(g,"wardFlame",()=>complete("ch1WardPath",true,high?"ring":"material")));
      }
    });
    if(f.ch1WardPath){
      const send=travel=>ch1Speak(g,"wardBack",travel);
      if(f.ch1Lamp){
        if(high)go("wardHigh","上の回廊口",send);
        else go("wardLow","下の回廊口",send);
      }
      openBox("c1WardBoxC",30,29,"lantern");
    }
    openBox("c1WardBoxA",8,27,"coat");
    openBox("c1WardBoxB",29,8,"material");
  }
  return scene;
}

function ch1Migrate(save){
  if(save.ch1Layout===1)return;
  const starts={town:[15,23],road:[27,12],gate:[19,29],court:[17,33],hall:[21,36]};
  for(const place of [save.position,save.checkpoint]){
    if(starts[place.area])place.trail=[starts[place.area].slice()];
  }
  if(save.flags.joinH04)save.flags.ch1LiftPass=true;
  if(save.flags.body){Object.assign(save.flags,{ch1CourtIntro:true,ch1Lamp:true,ch1RoadRise:true,ch1SecondView:true,ch1GateEye:true});}
  if(save.flags.B01){save.flags.ch1BarOpen=true;save.flags.ch1Debrief=true;}
  if(save.chapter>=2||save.flags.flagSeen)save.flags.ch1Arrival=true;
  save.ch1Layout=1;
}
function ch1OnEntry(g){
  if(g.s.chapter!==1)return;
  if(g.area.id==="gate"&&!g.s.flags.ch1GateIntro){
    ch1Shot(g,"gateArrival",1900,()=>ch1Speak(g,"c1GateArrival",()=>ch1Mark(g,"ch1GateIntro")));
  }
  if(g.area.id==="court"&&!g.s.flags.ch1CourtIntro){
    ch1Speak(g,"courtEnter",()=>ch1Mark(g,"ch1CourtIntro"));
  }
  if(g.area.id==="hall"){
    if(g.s.flags.B01&&!g.s.flags.ch1Debrief)ch1Tidings(g);
    else if(!g.s.flags.ch1HallIntro)ch1Speak(g,"hallEnter",()=>ch1Mark(g,"ch1HallIntro"));
  }
  if(g.area.id==="cistern"&&!g.s.flags.ch1CisternIntro){
    ch1Speak(g,"cisternEntry",()=>ch1Mark(g,"ch1CisternIntro"));
  }
  if(g.area.id==="overlook"&&!g.s.flags.ch1OverlookIntro){
    ch1Speak(g,"overlookEntry",()=>ch1Mark(g,"ch1OverlookIntro"));
  }
  if(g.area.id==="wardhouse"&&!g.s.flags.ch1WardIntro){
    ch1Shot(g,"wardEntry",1620,()=>ch1Speak(g,"wardArrival",()=>ch1Mark(g,"ch1WardIntro")));
  }
}

// Keep the bank sheets as received. The existing art list also serves the later chapters.
for(const art of [...Object.values(CH1_VOICES).map(([,file])=>file),"vial"]){
  if(!ART.includes(art))ART.push(art);
}
