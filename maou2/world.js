"use strict";

const START = {area:"town",trail:[[5,22]]};
const faceAt = (col,row,art,label,pages,extra={}) => ({col,row,sheet:art,facing:0,label,pages,...extra});
const thing = (col,row,kind,label,pages,extra={}) =>
  ({col,row,kind,label,pages,icon:"map",bounds:[-22,-62,23,9],...extra});
const ledge = (col,row,to,spawn,label,condition=null) => ({col,row,to,spawn,label,condition});
const ENEMIES = {
  bat:{name:"霧耳の蝠",art:"monster_002",maxHp:35,attack:12,defense:2,speed:13,focus:"rear",weak:"light",move:"羽うち"},
  armor:{name:"空鎧の煤番",art:"monster_005",maxHp:53,attack:18,defense:11,speed:7,focus:"front",brace:1,move:"ひとなぎ"},
  dog:{name:"骨噛みの番犬",art:"monster_006",maxHp:43,attack:16,defense:4,speed:11,focus:"front",move:"かみつく"},
  iron:{name:"帯鉄の黒犬",art:"monster_022",maxHp:53,attack:17,defense:7,speed:8,focus:"weak",move:"突進"},
  marten:{name:"赤穂テン",art:"M01",maxHp:42,attack:14,defense:5,speed:12,focus:"rear",move:"爪うち"},
  goat:{name:"琥珀角ゴート",art:"M02",maxHp:58,attack:15,defense:8,speed:7,focus:"front",brace:1,move:"頭突き"},
  dragon:{name:"黒牙竜ヴァルグ",art:"M33",maxHp:318,attack:37,defense:14,speed:9,focus:"weak",boss:true,lanes:["rear","front"],weak:"water",move:"黒鱗の爪",bigMove:"格子の火"},
  rabbit:{name:"角骨うさぎ",art:"monster_003",maxHp:54,attack:18,defense:5,speed:14,focus:"rear",move:"二段跳び"},
  sword:{name:"肋間の古剣",art:"monster_035",maxHp:72,attack:22,defense:11,speed:8,focus:"front",brace:1,weak:"light",move:"骨の縁打ち"},
  archer:{name:"塚弓の骸兵",art:"monster_036",maxHp:53,attack:21,defense:5,speed:10,focus:"rear",move:"白い矢"},
  crow:{name:"肋さらい鴉",art:"monster_037",maxHp:48,attack:17,defense:5,speed:13,focus:"weak",move:"ついばみ"},
  lamp:{name:"蝋窓",art:"M03",maxHp:67,attack:19,defense:6,speed:9,focus:"rear",weak:"light",move:"冷たいしぶき"},
  raven:{name:"骨枠鴉",art:"M04",maxHp:64,attack:21,defense:5,speed:12,focus:"rear",move:"白い羽刃"},
  ice:{name:"骨梁の白竜ギュロス",art:"monster_102",maxHp:555,attack:50,defense:17,speed:12,focus:"front",boss:true,lanes:["front","rear"],weak:"light",move:"骨梁打ち",bigMove:"両翼の嵐"},
  roots:{name:"黒根の三つ首",art:"monster_100",maxHp:420,attack:45,defense:14,speed:12,focus:"rear",boss:true,weak:"light",move:"三つの爪",bigMove:"根返し"},
  lizard:{name:"草火トカゲ",art:"monster_017",maxHp:80,attack:24,defense:8,speed:12,focus:"front",weak:"water",move:"草火"},
  boar:{name:"灰牙いのしし",art:"monster_087",maxHp:105,attack:28,defense:10,speed:8,focus:"rear",move:"灰牙"},
  ember:{name:"足元の火粒",art:"monster_099",maxHp:68,attack:21,defense:7,speed:11,focus:"weak",weak:"water",move:"火の尾"},
  mantis:{name:"刃草カマキリ",art:"monster_113",maxHp:76,attack:25,defense:9,speed:13,focus:"rear",move:"草切り"},
  kite:{name:"白縁の帆鳥",art:"monster_026",maxHp:91,attack:28,defense:8,speed:15,focus:"rear",move:"羽風"},
  griffin:{name:"岩待ち禿翼",art:"monster_047",maxHp:112,attack:32,defense:11,speed:13,focus:"weak",move:"岩つかみ"},
  sylph:{name:"草冠の羽女",art:"monster_090",maxHp:97,attack:30,defense:8,speed:14,focus:"rear",weak:"water",move:"風を裂く"},
  spark:{name:"角雷の火花",art:"monster_092",maxHp:104,attack:29,defense:12,speed:10,focus:"front",move:"角雷"},
  horn:{name:"幅角の半獣",art:"M11",maxHp:124,attack:31,defense:16,speed:9,focus:"front",brace:1,move:"角盾"},
  fungi:{name:"苔斑わらい茸",art:"monster_009",maxHp:101,attack:33,defense:9,speed:12,focus:"front",poison:1,move:"緑の粉"},
  seam:{name:"樹皮縫い蜂",art:"monster_082",maxHp:106,attack:40,defense:12,speed:16,focus:"rear",move:"針通し"},
  leaf:{name:"星粉の葉精",art:"monster_119",maxHp:99,attack:27,defense:13,speed:13,focus:"weak",move:"星しぶき"},
  spider:{name:"赤縫いの樹蜘蛛",art:"monster_084",maxHp:126,attack:35,defense:15,speed:11,focus:"rear",poison:1,move:"赤い糸"},
  canopy:{name:"緑翼ランティラ",art:"M37",maxHp:998,attack:69,defense:22,speed:14,focus:"weak",weak:"wind",boss:true,move:"枝の尾",bigMove:"緑翼の嵐"},
  pitcher:{name:"噛み葉",art:"monster_030",maxHp:125,attack:39,defense:15,speed:12,focus:"front",poison:1,move:"根絡み"},
  page:{name:"種巻きの頁",art:"monster_042",maxHp:118,attack:41,defense:13,speed:14,focus:"rear",move:"写し撃ち"},
  knot:{name:"目のある年輪",art:"monster_083",maxHp:139,attack:40,defense:17,speed:11,focus:"weak",move:"根伸び"},
  rootling:{name:"口根のこびと",art:"monster_114",maxHp:111,attack:36,defense:10,speed:16,focus:"front",move:"葉の輪"},
  esra:{name:"八葉の巨花エスラ",art:"M38",maxHp:1150,attack:75,defense:26,speed:15,focus:"weak",weak:"fire",boss:true,move:"葉の爪",bigMove:"閉じる八葉"},
  mushroom:{name:"光茸の丸太君",art:"monster_124",maxHp:580,attack:51,defense:21,speed:12,focus:"front",boss:true,lanes:["front","front","rear"],move:"丸太打ち",bigMove:"大振り"},
  cinder:{name:"焦穴の紅い炎身",art:"monster_104",maxHp:497,attack:53,defense:16,speed:12,focus:"rear",boss:true,weak:"water",move:"炎の腕",bigMove:"火の壁"},
  wheel:{name:"円陽の四腕トルカ",art:"M35",maxHp:775,attack:58,defense:21,speed:14,focus:"rear",boss:true,lanes:["rear","front","front"],weak:"light",move:"日輪の腕",bigMove:"四腕の圧"},
  gran:{name:"別牙のグラニ",art:"M34",maxHp:671,attack:54,defense:17,speed:14,focus:"weak",boss:true,lanes:["rear","rear","front"],weak:"water",move:"浮いた顎",bigMove:"顎返し"},
};
const POOLS = {
  gate:[["bat","marten"],["dog","goat"],["bat","dog","iron"]],
  hall:[["bat","dog"],["armor","marten"],["armor","bat","iron"],["goat","dog"]],
  ridge:[["rabbit","crow"],["rabbit","lamp"],["crow","raven","archer"]],
  high:[["sword","archer"],["raven","crow"],["sword","rabbit","lamp"]],
  roots:[["dog","marten"],["armor","bat"]],
  fire:[["lizard","boar"],["ember","mantis"],["ember","lizard","boar"]],
  burrow:[["lizard","horn"],["ember","boar"]],
  towers:[["kite","griffin"],["sylph","spark"],["kite","griffin","spark"]],
  sails:[["sylph","kite"],["kite","spark"],["sylph","griffin","kite"]],
  canopy:[["fungi","spider"],["leaf","seam"],["fungi","seam","leaf"]],
  beam:[["seam","spider"],["leaf","spider","fungi"]],
  trunk:[["pitcher","page"],["rootling","knot","page"]],
  plate:[["rootling","knot"],["knot","page","pitcher"]],
  mushroom:[["rootling","fungi"],["seam","pitcher","leaf"]],
};
const ROAD_OUT=[5,21];
const AREAS = {
  town:{title:"ベルグ門前町",safe:true,skin:"town",start:[5,22],chapter:1},
  road:{title:"松影の街道",safe:true,skin:"road",start:[5,15],chapter:1},
  gate:{title:"黒牙城　巨角門",skin:"castle",start:[5,22],chapter:1},
  court:{title:"黒牙城　玉座庭",skin:"castle",start:[5,22],chapter:1},
  hall:{title:"黒天井の回廊",skin:"castle",start:[5,22],chapter:1},
  nord:{title:"ノルド砦町",safe:true,skin:"bone",start:[5,22],chapter:2},
  ridge:{title:"竜骨の街道",skin:"bone",start:[5,22],chapter:2},
  watch:{title:"尾根の番小屋",skin:"bone",safe:true,start:[5,22],chapter:2},
  bridge:{title:"肋の渡り板",skin:"bone",start:[5,22],chapter:2},
  high:{title:"崩れた肋の空き地",skin:"bone",start:[5,22],chapter:2},
  pine:{title:"松煙小屋",safe:true,skin:"castle",start:[5,22],chapter:2},
  roots:{title:"黒根の塚穴",skin:"castle",start:[5,22],chapter:2},
  cald:{title:"カルド平市",safe:true,skin:"gold",start:[5,22],chapter:3},
  fire:{title:"炎走る獣道",skin:"gold",arena:"grass",start:[5,22],chapter:3},
  ashgate:{title:"煤色の吊り門",skin:"gold",start:[5,22],chapter:3},
  saddle:{title:"獣鞍宿",skin:"gold",safe:true,start:[5,22],chapter:3},
  burrow:{title:"焦げ角の穴",skin:"gold",start:[5,22],chapter:3},
  tarka:{title:"タルカの丘市",skin:"gold",safe:true,start:[5,22],chapter:4},
  towers:{title:"双角の風砦",skin:"gold",start:[5,22],chapter:4},
  sails:{title:"帆渡り",skin:"gold",arena:"sails",start:[5,22],chapter:4},
  sky:{title:"古い軍旗の道",skin:"gold",arena:"sails",start:[5,22],chapter:4},
  liena:{title:"リエナ梢町",skin:"green",arena:"canopy",safe:true,start:[5,22],chapter:5},
  canopy:{title:"傾く樹冠殿",skin:"green",arena:"canopy",start:[5,22],chapter:5},
  beam:{title:"傷のある大梁",skin:"green",arena:"canopy",start:[5,22],chapter:5},
  net:{title:"枝の吊り網倉",skin:"green",arena:"canopy",start:[5,22],chapter:5},
  nelva:{title:"ネルヴァ根都",skin:"green",arena:"canopy",safe:true,start:[5,22],chapter:6},
  trunk:{title:"星葉の巨木",skin:"green",arena:"canopy",start:[5,22],chapter:6},
  plate:{title:"発光する版の洞",skin:"green",arena:"canopy",start:[5,22],chapter:6},
  crown:{title:"星葉の奥",skin:"green",arena:"canopy",start:[5,22],chapter:6},
  mushroom:{title:"光茸の根洞",skin:"green",arena:"canopy",start:[5,22],chapter:6},
};
function makeTiles(kind,flags) {
  const wall=(x,y)=>x===0 || x===11 || y<4 || y>24;
  const defs={
    gate:(x,y)=>x<2||x>9?"#":((y===10||y===17) && [2,3,8,9].includes(x))?"#":y===5||y===6?"S":"d",
    court:(x,y)=>y<7 && !(x>=4&&x<=6)?"#":y>=8 && y<=14 && (x===1||x===10)?"#":y>=6 && y<=8?"S":"d",
    hall:(x,y)=>((y>=11&&y<=13) && (x===3||x===8))||((y===16||y===20)&&[2,9].includes(x))?"#":x===1||x===10?"x":"d",
    nord:(x,y)=>x===1||x===10||(y>6&&y<21&&[2,9].includes(x))?"#":y===6?"S":"p",
    ridge:(x,y)=>x===1||x===10?"x":y>=7&&y<=13&&x>=5&&x<=6?"x":y===16||y===17?"S":"p",
    watch:(x,y)=>x<=2||x>=9?"#":y<=7&&x!==5&&x!==6?"#":"d",
    bridge:(x,y)=>x===1||x===10?"x":y>=9&&y<=12?(x===5||x===6?(flags.broken?"x":"="):"x"):(y<17&&[2,9].includes(x))?"x":"p",
    high:(x,y)=>x===1||x===10?"x":y>=10&&y<=18&&[2,9].includes(x)?"#":"p",
    pine:(x,y)=>x<3||x>8?"#":y===12 && [3,8].includes(x)?"#":"d",
    roots:(x,y)=>x===1||x===10?"#":y>=10&&y<=18&&[3,8].includes(x)?"#":"d",
    cald:(x,y)=>x===1||x===10||(y>=8&&y<=20&&[2,9].includes(x))?"#":y===7?"S":"p",
    fire:(x,y)=>x===1||x===10?"x":y>=10&&y<=16&&x===6?"#":y<13?(flags.C1==="home"&&x>6||flags.C1==="store"&&x<6?(y>=9&&y<=11?"x":"s"):"p"):"g",
    ashgate:(x,y)=>x===1||x===10?"#":y>7&&y<17&&[2,9].includes(x)?"s":"p",
    saddle:(x,y)=>x<3||x>8?"#":y>=8&&y<=11&&[3,8].includes(x)?"#":"p",
    burrow:(x,y)=>x<2||x>9||y>=12&&y<=15&&[4,7].includes(x)?"#":y%7===1?"S":"d",
    tarka:(x,y)=>x===1||x===10||(y>=8&&y<=17&&[2,9].includes(x))?"#":y===7||y===17?"S":"p",
    towers:(x,y)=>[1,10].includes(x)||[9,16].includes(y)&&[2,3,8,9].includes(x)?"x":y<9&&[2,9].includes(x)?"#":y===10||y===11?"S":"p",
    sails:(x,y)=>x===1||x===10||y>=10&&y<=15&&![5,6,7].includes(x)?"x":y>=9&&y<=16?"=":y>=17&&y<=18?"S":"d",
    sky:(x,y)=>x<3||x>8||y<=14&&[3,8].includes(x)?"x":y===19||y===20?"=":"d",
    liena:(x,y)=>[1,10].includes(x)?"x":y<19&&y%6===2&&[2,3,9].includes(x)?"#":y===18?"=":y===8?"S":x>=8&&y<14?"g":"p",
    canopy:(x,y)=>[1,10].includes(x)?"x":[10,11].includes(y)?[5,6].includes(x)?"u":x===9?"=":"x":y>=15&&y<=19&&[2,3].includes(x)?"#":"g",
    beam:(x,y)=>[1,10].includes(x)||y>=10&&y<=14&&[2,9].includes(x)?"x":y>=13&&y<=15?"=":y%7===0?"S":"p",
    net:(x,y)=>x<2||x>9?"x":y>=8&&y<=17&&x===6?"#":y>=17&&y<=19?"=":"g",
    nelva:(x,y)=>[1,10].includes(x)?"x":y>=6&&y<=17&&[2,9].includes(x)?"#":y===11||y===12?"S":y%7===0?"=":"p",
    trunk:(x,y)=>[1,10].includes(x)||y>=9&&y<=12&&[4,5,8,9].includes(x)?"x":y%8===0||y%8===1?"S":x<5?"g":"p",
    plate:(x,y)=>[1,10].includes(x)?"#":y>=9&&y<=14&&[2,9].includes(x)?"x":y===8||y===15?"S":"d",
    crown:(x,y)=>[1,10].includes(x)?"x":y>=8&&y<=15&&[2,9].includes(x)?"#":y%6===0?"=":"g",
    mushroom:(x,y)=>[1,10].includes(x)?"x":y>=9&&y<=15&&[3,7].includes(x)?"#":y%5===0?"d":"g",
  };
  return Array.from({length:27},(_,y)=>Array.from({length:12},(_,x)=>wall(x,y)?"#":defs[kind](x,y)).join(""));
}
function sceneFor(id,g) {
  const f=g.s.flags, base=AREAS[id];
  const layout={...base,npcs:[],objects:[],fixtures:[],lamps:[],exits:[]};
  const say=(...args)=>layout.npcs.push(faceAt(...args));
  const place=(...args)=>layout.objects.push(thing(...args));
  const fix=(col,row,kind,extra={})=>layout.fixtures.push({col,row,kind,...extra});
  const exit=(col,row,to,spawn,label,condition=null)=>{
    layout.exits.push(ledge(col,row,to,spawn,label,condition));
    place(col,row,"exit",label,[label+"へ続く。"],{walk:true,instant:true,onEnd:()=>g.travel(to,spawn,condition)});
  };
  const flag=(key)=>()=>g.mark(key);
  const chest=(col,row,key,reward)=>place(col,row,"chest","木の宝箱",
    g.s.claims[key]?["箱は空だ。"]:["中に包みが入っている。"],
    {open:Boolean(g.s.claims[key]),onEnd:()=>g.openChest(key,reward)});
  const monster=(col,row,code,key)=>place(col,row,null,ENEMIES[code].name,["魔物の目が光った。"],
    {image:ENEMIES[code].art,boss:true,onEnd:()=>g.fight([code],key)});
  if (id==="town") {
    say(3,8,"person_099","ヴェスター",["温かい湯を用意したよ。"],{onEnd:()=>g.rest()});
    say(3,11,"person_101","露店の人",["刃や外套なら、ここに並べてあるよ。"],{activity:"sort",onEnd:()=>g.open("shop")});
    say(3,21,"person_030","鍛冶屋",["冷える前の鉄は、まだしなる。"],{activity:"smith",onEnd:()=>g.open("forge")});
    say(9,20,"person_074","荷運び",["城から、今朝の鐘が来ない。"],{activity:"crate"});
    if (!f.joinH03) say(7,16,"H03","ブランカ",["支えを入れた。もう落ちない。","城門まで、一緒に行こう。"],
      {approach:([x,y])=>Boolean(f.flagSeen) && x>=4&&x<=7&&y>=14&&y<=18,onEnd:()=>g.join("H03",1,"joinH03")});
    if (!f.joinH04) say(5,8,"H04","グレン",f.joinH03?["戸は私が開ける。","この門を通すのは、私の判断だ。"]:["鎖に触るな。作業台の足場が悪い。"],
      {onEnd:f.joinH03?()=>g.join("H04",1,"joinH04"):null});
    say(7,8,"H17","ガルヴィン",["鍵は私が預かる。","城の中のことは、外では話せない。"]);
    place(6,19,"flag","銅旗",["松葉が止まった。","旗の光だけが、風下と逆へ進む。"],{onEnd:flag("flagSeen")});
    place(8,15,"lift","昇降機",f.joinH03?["木の支えが台を受けている。"]:["鎖が鳴っている。支えが外れかけている。"]);
    place(5,4,"gate","黒牙城の門",f.joinH04?["鎖がゆるみ、戸が開いた。"]:["鉄の戸は閉じている。門番が上の広場にいる。"],
      {walk:Boolean(f.joinH04),open:Boolean(f.joinH04),instant:Boolean(f.joinH04),onEnd:()=>g.travel("gate",[5,22],()=>f.joinH04)});
    if (f.joinH04) layout.exits.push(ledge(5,4,"gate",[5,22],"黒牙城"));
    exit(6,22,"road",ROAD_OUT,"松影の街道");
    if (f.B01) exit(9,7,"nord",[5,22],"ノルド砦町");
    place(8,12,"board","札の卓",["旅人が札を置いていった。"],{instant:true,onEnd:()=>g.open("cards")});
    place(7,19,"rope","裂けた旗の綱",f.sewnFlag?["新しい縫い糸が、下の古い跡に沿っている。"]:["旗の端がほころんでいる。","外れた端を縫い合わせた。"],
      {onEnd:()=>{if(!f.sewnFlag){g.mark("sewnFlag");g.grantQuest("sewnFlag","material");g.refresh();}}});
    if (g.s.chapter>=2) place(4,9,"paper","閉門板",["板の内側だけが焦げている。","当番の印が端に残った。"],{onEnd:()=>g.grantQuest("postern","book")});
  } else if(id==="road") {
    say(7,13,"person_071","旅人",["橋の右の板だけ色が新しいだろう？","昨夜、見回りと張り替えたんだ。"],{activity:"map"});
    say(10,13,"person_066","番小屋の人",["窓の灯はもう落とすよ。"],{activity:"crate"});
    say(6,11,"person_019","見回り",["石段の先が町だ。段の端には松の根が出てる。"],{activity:"sweep"});
    place(4,14,"board","案内板",["石段を上れば町。東の橋は番小屋へ。"]);
    exit(8,4,"town",[5,22],"ベルグ門前町");
    if (g.s.chapter>=2) exit(11,14,"pine",[5,22],"松煙小屋");
  } else {
    layout.grid=makeTiles(id,f);
    layout.lamps=[[2,6],[9,6],[2,18],[9,18],[2,23],[9,23]];
    if(id==="gate") {
      fix(2,9,"bone");fix(9,9,"bone",{turn:1});fix(4,5,"gate",{open:true});
      exit(5,5,"court",[5,22],"玉座庭");exit(6,22,"town",[5,6],"ベルグ門前町");
      chest(8,14,"gateBox","hat");
      place(3,11,"flag","門の旗",["旗の継ぎ目に、折れた針が残っている。"],{onEnd:flag("needles")});
    } else if (id==="court") {
      layout.blocks=[[4,11],[6,11]];
      fix(5,7,"seat"); fix(4,9,"bone");fix(7,9,"bone",{turn:1});
      place(5,11,null,"玉座の下",f.body?["辺りの灯りが揺れても、もう動かない。"]:["……王は死んでいる。","冠は床に置いてあった。"],
        {image:"H16",bounds:[-48,-92,48,11],onEnd:()=>{
          if (f.body) return;
          g.mark("body");
          g.effect("flight",1120,()=>g.refresh());
        }});
      if (!f.body) say(7,10,"H02","杖の旅人",["……。"]);
      place(3,14,"crown","落ちた冠",["冠はひっくり返っていない。","そっと置いたように見える。"],{onEnd:flag("crown")});
      place(8,14,"seal","黒鉄の板",["角の印の途中で、板が割れている。"],{onEnd:flag("seal")});
      place(8,18,"paper","命令書",["『裏門は夜まで開けておけ』。","日付は昨日だ。"],{onEnd:flag("order")});
      if(f.body) exit(8,7,"hall",[5,22],"黒天井の回廊");
      exit(6,22,"gate",[5,7],"巨角門");
    } else if (id==="hall") {
      exit(6,22,"court",[8,8],"玉座庭");
      fix(4,10,"bone");fix(7,10,"bone",{turn:true});
      if (!f.B01) monster(5,6,"dragon","B01");
      else exit(5,5,"nord",[5,22],"尾根の出口");
      chest(8,13,"hallBox","steel");
      place(3,10,"fire","守り火",["火のそばで息をついた。"],{onEnd:()=>g.rest()});
      place(3,15,"board","擦れた柱",["ここだけ斬った跡が浅い。","灯りをよけた側に足場が続く。"]);
    } else if(id==="nord") {
      fix(2,14,"house",{style:3});fix(10,17,"house",{style:2});fix(2,6,"house",{style:0});fix(10,9,"market",{style:1});
      say(4,9,"person_080","ニルス",["杖の足跡なら北へ続く。","折れた尾根と番小屋、どちらからでも橋へ行ける。"]);
      say(8,14,"person_100","宿の人",["軒の下なら風が弱い。湯を置いておいた。"],{onEnd:()=>g.rest()});
      say(3,17,"person_030","鉄工",["折れた荷札なら直せるぞ。"],{activity:"smith",onEnd:()=>g.open("forge")});
      exit(4,5,"ridge",[5,22],"竜骨の街道");exit(8,5,"watch",[5,22],"番小屋の道");
      exit(6,22,"town",[8,9],"ベルグ門前町");
      place(6,12,"paper","骨越え荷札",["細い板は人だけ。太い板は荷車も通す。"],{onEnd:()=>g.grantQuest("boneSign","book")});
      if(f.B02) exit(8,19,"cald",[5,22],"黄金草原");
    } else if(id==="ridge" || id==="watch") {
      exit(6,22,"nord",[5,7],"ノルド砦町");
      exit(id==="ridge"?8:5,5,"bridge",[5,22],"渡り板");
      fix(4,13,"bone");fix(8,13,"bone",{turn:true});fix(5,19,"bone");
      chest(3,12,id+"Box","lantern");
      place(5,17,"flag","警戒旗",["旗の裏で金の鋲が光った。","骨の影が短い間なら、古い隙間が見える。"],{onEnd:()=>g.grantQuest("underFlag","material")});
      if(id==="watch") say(6,8,"person_071","番小屋の人",["荷が重そうだった。","板を渡る時は、右側の綱に気をつけな。"]);
    } else if(id==="bridge") {
      exit(6,22,"ridge",[8,7],"尾根に戻る");
      if (f.joinH02) exit(5,5,"high",[5,22],"肋の空き地");
      if (!f.joinH02) say(8,15,"H02","リュカ",f.rescued?["今の朝、君も見た？","戻る前のことを覚えてるのは、僕だけだ。","この先は、一緒に行っていいか。"]:["……荷車のそばは危ない。"],
        {approach:f.rescued?([x,y])=>x>=3&&x<=8&&y>=13&&y<=16:false,onEnd:f.rescued?()=>g.join("H02",3,"joinH02"):null});
      if (!f.rescued && !f.broken) say(6,8,"person_075","荷運び",["車輪が板に噛んでいる。"]);
      fix(3,12,"bone");fix(8,10,"bone",{turn:true});
      if(!f.rescued)fix(5,11,"cargo",{broken:Boolean(f.broken)});
      if (f.rewindSeen && !f.rescued) {
        place(4,13,"rope","山側の綱",["綱が張った。車輪が止まる。","荷運びが板を渡り切った。"],
          {active:true,onEnd:()=>{g.mark("rescued");g.refresh();const npc=g.field.npcs.find(p=>p.sheet==="H02");if(npc)g.field.call(npc);}});
        place(7,13,"rope","谷側の綱",["綱の編み目が切れている。","向こうに、光の当たる綱がある。"]);
      }
    } else if(id==="high") {
      exit(6,22,"bridge",[5,7],"渡り板");fix(2,8,"bone");fix(9,9,"bone",{turn:true});
      if(!f.B02)monster(5,6,"ice","B02");
      else exit(5,5,"cald",[5,22],"黄金草原");
      chest(8,14,"highBox","bow");
      place(7,9,"fire","尾根の火",["風をよけて息をついた。"],{onEnd:()=>g.rest()});
    } else if(id==="pine") {
      exit(6,22,"road",[8,14],"松影の街道");
      exit(5,5,"roots",[5,22],"黒根の塚穴");
      say(7,11,"H11","ヴィルネ",["灯の下に影がない。","囲いを反対に向けると、根の間が見える。"]);
      place(4,8,"fire","影のない灯",["石囲いを回すと、根の向こうが明るくなった。"],{onEnd:()=>g.join("H11",3,"joinH11")});
      place(6,15,"seal","修繕の型",["古い刻みの上から、新しい継ぎ手が打ってある。"],{onEnd:()=>g.grantQuest("hinge","book")});
      say(3,16,"person_100","小屋の主人",["空いた寝床がある。"],{onEnd:()=>g.rest()});
    } else if(id==="roots") {
      exit(6,22,"pine",[5,7],"松煙小屋");
      if(!f.B19) monster(5,6,"roots","B19");
      chest(7,13,"rootsBox","ring");
    } else if(id==="cald") {
      fix(2,11,"house",{style:2});fix(2,17,"house",{style:1});
      if(f.C1!=="store")fix(10,10,"house",{style:2});
      else fix(10,10,"market",{style:1});
      fix(10,16,"market",{style:0});fix(2,22,"rubble");
      say(3,12,"person_101","イルマ",f.C1==="home"?["炉が残った。今夜から、ここで湯を分けられる。"]:
        f.C1==="store"?["幕の下に寝床を作ったよ。薬は高台の倉にある。"]:["家の炉が消えたら、夜をどう過ごそう。"]);
      say(8,15,"person_074","モルク",f.C1?["尾根まで、みんなの足跡がそろった。"]:["穀物と薬が倉にある。人はもう尾根へ上がったよ。"],{activity:"crate"});
      say(8,9,"H19","ドゥラ",["運べる板を先に集めておく。"],{activity:"bundle"});
      say(5,19,"person_070","野営の人",["湯が沸いた。手を休めていくか。"],{onEnd:()=>g.rest()});
      exit(5,5,"fire",[5,22],"炎走る獣道");exit(6,22,"nord",[8,21],"ノルド砦町");
      fix(f.C1==="store"?7:3,10,f.C1?"chest":"fire");
      if (f.C1) exit(8,20,"saddle",[5,21],"獣鞍宿");
      if (f.C1) place(4,13,"paper","暮らしの室札",["新しい炊事場に置く札だ。"],{onEnd:()=>g.grantQuest("houseSign","book")});
    } else if(id==="fire") {
      exit(6,22,"cald",[5,7],"カルド平市");
      if(!f.C1) {
        fix(3,10,"fire");fix(9,10,"fire");
        place(5,16,"board","尾根の見張り床",["家並みも倉も、風下にある。","人と家畜はすでに尾根だ。低地に残るのは家と荷だ。"]);
        place(4,13,"rope","家並みの綱",["右へ火が流れた。","家の炉と寝床が残った。"],{active:true,onEnd:()=>g.chooseFire("home")});
        place(8,13,"rope","備蓄倉の綱",["左へ火が流れた。","薬と穀物の倉が残った。"],{active:true,onEnd:()=>g.chooseFire("store")});
      } else {
        fix(f.C1==="home"?9:3,10,"fire");
        if(!f.joinH05) say(6,7,"H05","ティアリエ",["最後の家畜も柵を越えた。","峠まで、後ろは私が見る。"],
          {approach:([x,y])=>x>=3&&x<=9&&y<=10,onEnd:()=>g.join("H05",4,"joinH05")});
        if(f.joinH05) exit(5,5,"ashgate",[5,22],"煤色の吊り門");
      }
    } else if(id==="ashgate") {
      exit(6,22,"fire",[5,7],"炎走る獣道");
      if(!f.B03) monster(5,6,"gran","B03");
      else exit(5,5,"tarka",[5,22],"タルカの丘市");
      fix(2,12,"fire");fix(9,12,"fire");
      place(8,10,"fire","小さな篝火",["冷えた手を温めた。"],{onEnd:()=>g.rest()});
    } else if(id==="saddle") {
      fix(2,13,"house",{style:2});fix(9,18,"house",{style:3});fix(2,9,"market",{style:1});
      exit(6,22,"cald",[8,19],"カルド平市");exit(5,5,"burrow",[5,22],"焦げ角の穴");
      if(!f.joinH12) say(7,11,"H12","マドック",f.B20&&f.burntLoad?
        ["これは全部、あの荷車の印だ。","荷の続きを、俺にも任せてくれ。"]:["荷車が戻らん。荷に溶けた鋲があるはずだ。"],
        {onEnd:f.B20&&f.burntLoad?()=>g.join("H12",5,"joinH12"):null});
      say(3,18,"person_074","モルク",["片方の輪は、火の外にあった。革はまだ使える。"],{activity:"crate"});
      place(7,17,"cargo","片側の焼けた荷車",["車輪の片方だけ、金具が焼けている。"]);
    } else if(id==="burrow") {
      fix(2,13,"rubble");fix(9,19,"bone",{turn:true});
      exit(6,22,"saddle",[5,7],"獣鞍宿");
      if(!f.B20)monster(5,6,"cinder","B20");
      else place(5,5,"chest","焦げた荷",["鋲と二つの焼印が残った。"],{open:true,onEnd:flag("burntLoad")});
    } else if(id==="tarka") {
      fix(2,14,"house",{style:1});fix(10,12,"house",{style:3});
      fix(2,8,"mast");fix(9,16,"mast",{turn:true,blue:true});
      fix(8,8,"market",{style:1});fix(3,15,"market");
      say(6,10,"person_094","アニエ",["丘と砦に、同じ角の印がある。","陰に入ると、先の向きが見えるよ。"]);
      say(8,18,"person_030","グラム",["帆を替えるなら、留め杭は太い方だ。"],{activity:"smith",onEnd:()=>g.open("forge")});
      say(4,20,"person_096","旅の宿",["今日は帆を張る日だ。まず湯で温まるといい。"],{onEnd:()=>g.rest()});
      place(3,11,"hint","片角の影",["角の影が、黒い岩の方へ延びる。"],{onEnd:flag("farHorn")});
      place(7,15,"rope","重い帆の綱",["帆を向こうの杭に移した。影が足元を横切る。"],{onEnd:()=>{
        if(!f.sailQuest){g.mark("sailQuest");g.grantQuest("twoSails","book");g.refresh();}
      }});
      if(f.sailQuest)fix(8,14,"mast",{blue:true});
      exit(5,5,"towers",[5,22],"双角の風砦");exit(6,22,"cald",[5,7],"カルド平市");
    } else if(id==="towers") {
      fix(2,8,"mast");fix(9,10,"mast",{turn:true,blue:true});fix(4,13,"rubble");fix(6,10,"rubble");
      fix(5,9,"hint");fix(6,10,"hint",{sky:true});
      place(8,12,"hint","もう一つの角",["影は折れた岩の下を見ている。"],{onEnd:flag("nearHorn")});
      exit(5,5,"sails",[5,22],"帆渡り");
      exit(6,22,"tarka",[5,7],"タルカの丘市");
      if(f.farHorn && f.nearHorn)chest(8,8,"windwardBox","ring");
    } else if(id==="sails") {
      fix(4,9,"mast");fix(8,10,"mast",{turn:true,blue:true});fix(5,19,"cargo");
      place(6,15,"seal","振り子の分銅",["目盛りのない分銅だけ、裏が擦れている。"],{onEnd:()=>g.grantQuest("weight","book")});
      place(4,19,"rope","風受けの綱",["上は細い風。下は途切れずに吹いている。"]);
      place(7,18,"rope","下の留め輪",["布が風を受け、ひらいた。"],{onEnd:()=>{
        if(f.fenWind)return;
        g.mark("fenWind");g.refresh();
        const npc=g.field.npcs.find(p=>p.sheet==="H15");if(npc)g.field.call(npc);
      }});
      if(f.fenWind&&!f.joinH15)say(8,19,"H15","フェン",["布が立った。今の風なら、ついていける。"],{onEnd:()=>g.join("H15",6,"joinH15")});
      if(!f.joinH06)say(6,9,"H06","バルド",["荷台を止めた。渡るなら、今だ。","俺も行く。道具は背負える。"],
        {approach:([x,y])=>x>=4&&x<=7&&y<=11,onEnd:()=>g.join("H06",6,"joinH06")});
      if(f.joinH06)exit(5,5,"sky",[5,22],"雲の上り口");
      exit(6,22,"towers",[5,7],"角塔の根");
    } else if(id==="sky") {
      fix(4,11,"mast");fix(7,13,"mast",{turn:true,blue:true});fix(8,18,"hint",{sky:true});
      exit(6,22,"sails",[5,7],"帆渡り");
      place(7,10,"fire","風よけの灯",["壁の陰で息をついた。"],{onEnd:()=>g.rest()});
      if(!f.B04)monster(5,6,"wheel","B04");
      else exit(5,5,"liena",[5,22],"リエナ梢町");
    } else if(id==="liena") {
      fix(2,12,"branch");fix(9,16,"branch",{turn:true});fix(10,7,"bough");
      fix(2,7,"house",{style:1});fix(10,14,"house",{style:0});fix(3,16,"market",{style:1});
      say(4,14,"H21","ロアナ",f.C2==="tool"?["太い網が届いた。枝の低い家にも降りられるよ。"]:
        f.C2==="sign"?["標をここに上げたよ。青い印が裏まで続いている。"]:["帯の穴に光が並ぶと、床が合う。","風が強い日は東の枝へ回りな。"]);
      say(8,19,"person_076","宿の人",["棚が空いたよ。湯を飲んでいきな。"],{onEnd:()=>g.rest()});
      if(f.C2 && !f.joinH07)say(5,12,"person_077","イリシア",["網の下のけが人は、みんな歩ける。","次の町の人も、診に行こう。"],
        {approach:([x,y])=>x>=4&&x<=7&&y<=15,onEnd:()=>g.join("person_077",7,"joinH07")});
      if(f.C2){
        fix(7,10,f.C2==="sign"?"seal":"cargo");
        place(7,11,"rope","枝棚の支え",["籠を太い梁へ。今度は板が沈まない。"],{onEnd:()=>{
          if(!f.branchQuest){g.mark("branchQuest");g.grantQuest("branchStack","book");g.refresh();}
        }});
      }
      if(f.branchQuest)fix(8,15,"market");
      exit(5,5,"canopy",[5,22],"傾く樹冠殿");
      if(f.joinH07)exit(8,7,"nelva",[5,22],"ネルヴァ根都");
      exit(6,22,"sky",[5,8],"帆の道");
    } else if(id==="canopy") {
      fix(2,8,"bough");fix(10,14,"bough");fix(3,15,"branch");fix(9,11,"branch",{turn:true});
      place(4,12,"seal","緑の帯",["目盛りが一つずつ光る。並び切ると、床が合う。"]);
      place(8,14,"board","東の太枝",["幹の外を回り、梁の向こうへ。"]);
      exit(6,22,"liena",[5,7],"リエナ梢町");exit(5,5,"beam",[5,22],"大梁の下");
    } else if(id==="beam") {
      fix(2,11,"branch");fix(9,12,"branch",{turn:true});
      fix(8,17,"cargo");
      say(3,12,"H13","カーシャ",["穴の向きだけ写す。まず、あの梁の下へ。"]);
      place(7,8,"fire","梁の灯",["葉の下で休んだ。"],{onEnd:()=>g.rest()});
      exit(6,22,"canopy",[5,7],"傾く樹冠殿");
      if(!f.B05)monster(5,6,"canopy","B05");
      else exit(5,5,"net",[5,22],"吊り網倉");
    } else if(id==="net") {
      fix(2,13,"branch");fix(9,13,"bough");fix(8,19,"cargo");
      exit(6,22,"beam",[5,8],"大梁の下");
      if(!f.C2) {
        place(5,17,"board","枝の巻き上げ台",["台に乗せられるのは片方だけ。人はみな高い棚にいる。","古い標は遠征の手がかり。救助具は網を張り直せる。"]);
        place(4,12,"seal","古い標",["遠征の標を台に吊るした。"],{onEnd:()=>g.chooseCanopy("sign")});
        place(8,12,"rope","網の救助具",["救助具を台に吊るした。"],{onEnd:()=>g.chooseCanopy("tool")});
      } else {
        fix(f.C2==="sign"?4:8,12,"cargo");
        exit(5,5,"liena",[5,8],"梢町へ下りる");
        place(7,7,"flag","星形の葉",["葉の穴から次の枝が見える。"]);
      }
    } else if(id==="nelva") {
      fix(2,13,"bough");fix(9,9,"bough");fix(9,18,"market",{style:1});fix(3,18,"house",{style:2});
      say(4,11,"H22","ナーヴェ",["葉は裏から開く。星を見失ったら、同じ角から見直すんだ。"]);
      say(8,20,"person_075","根の茶屋",["根に囲まれてると、夜は温かいよ。"],{onEnd:()=>g.rest()});
      if(f.C2&&!f.joinH13)say(8,11,"H13","カーシャ",f.C2==="sign"?["標の縁に粉を当てた。こっちが上だ。","写しを持っていく。次の印も見せてくれ。"]:
        ["網の留め具にも同じ刻みがあった。","次の印も写したい。連れていって。"],{onEnd:()=>g.join("H13",7,"joinH13")});
      place(3,14,"hint","葉裏の星",["白い星の片側が欠けている。向きは葉先と同じ。"],{onEnd:()=>g.grantQuest("leafMark","book")});
      exit(5,5,"trunk",[5,22],"星葉の巨木");
      exit(3,20,"mushroom",[5,22],"光茸の根洞");
      exit(6,22,"liena",[7,8],"リエナ梢町");
    } else if(id==="trunk") {
      fix(2,10,"bough");fix(9,15,"bough");
      fix(5,9,"hint");fix(6,13,"hint",{sky:true});fix(7,14,"branch");
      place(5,16,"seal","欠けた葉の版",["葉先を白い方へ。欠けた角が内側に合う。"],{onEnd:flag("leafClue")});
      exit(5,5,"plate",[5,22],"発光する版の洞");
      exit(6,22,"nelva",[5,7],"ネルヴァ根都");
    } else if(id==="plate") {
      fix(2,15,"bough");fix(9,12,"branch",{turn:true});
      place(4,12,"turnSeal","葉を開く台",["葉を裏へ返した。"],{pinType:"leaf",pin:g.s.flags.leafAngle||0,onEnd:()=>g.turnPlate("leaf")});
      place(7,12,"turnSeal","板を返す台",["板の向きを変えた。"],{pinType:"slab",pin:g.s.flags.slabAngle||0,onEnd:()=>g.turnPlate("slab")});
      place(5,15,"seal","光を通す枠",f.starPath?["星の下から、白い枝へ筋が伸びる。"]:["内側に欠けを寄せると、星に戻る。"]);
      if(!f.joinH08)say(6,7,"H08","ネメル",["枝の傷と、星の下の筋が合ってる。","この先なら案内できる。"],
        {approach:f.starPath?([x,y])=>x>=3&&x<=8&&y<=11:false,onEnd:f.starPath?()=>g.join("H08",8,"joinH08"):null});
      if(f.joinH08)exit(5,5,"crown",[5,22],"星葉の奥");
      exit(6,22,"trunk",[5,7],"巨木の幹");
    } else if(id==="crown") {
      fix(2,12,"bough");fix(9,10,"bough");fix(4,8,"hint",{sky:true});
      exit(6,22,"plate",[5,8],"版の洞");
      place(7,8,"fire","葉の灯",["根もとの灯のそばで息をついた。"],{onEnd:()=>g.rest()});
      if(!f.B06)monster(5,6,"esra","B06");
      else place(5,6,"flag","山へ向く枝",["枝の向こうに、雲より高い道が見えた。"],{onEnd:()=>g.open("chapterEnd")});
    } else if(id==="mushroom") {
      fix(2,13,"bough");fix(9,10,"bough");
      if(!f.B21)monster(5,6,"mushroom","B21");
      else if(!f.joinH14){
        say(7,11,"H14","ドロテア",["折れた足の節が曲がってる。木目に沿わせてみて。"]);
        place(4,12,"rubble","像の足",["木目をそろえると、足が座った。","作った人を捜しに行こう。"],{onEnd:()=>g.join("H14",8,"joinH14")});
      }
      chest(8,14,"mushroomCache","lantern");
      exit(6,22,"nelva",[4,20],"ネルヴァ根都");
    }
  }
  return layout;
}
