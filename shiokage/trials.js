const lines=(...text)=>text.map(page=>[0,page]);
const skill=(name,attribute,target,power,extra={})=>({name,attribute,target,power,...extra});
const encounter=(name,attribute,weaknesses,shield,hp,attack,defense,speed,spriteId,behavior,skills)=>
  [name,attribute,weaknesses,shield,hp,attack,defense,speed,{spriteId,behavior,skills}];

export const trialEnemies={
  301:encounter('白瀬の背岩','土',['斧','杖','雷','氷'],8,295,20,24,7,109,'relentless',[
    skill('深い構え','土','self',0,{effect:'ward',magnitude:.42,duration:2}),
    skill('足元を返す','土','all',1.12,{effect:'slow',magnitude:.25,duration:2}),
    skill('厚い背を低くする','土','one',1.70,{channel:'physical'})]),
  302:encounter('波止を縫う番','水',['短剣','槍','火','風'],5,120,14,14,17,103,'relentless',[
    skill('横波の縫い直し','水','allies',1.12,{effect:'heal'}),
    skill('ほどけない結び','水','allies',0,{effect:'ward',magnitude:.26,duration:2})]),
  303:encounter('逆さ綱の番','雷',['剣','杖','土','水'],7,238,24,15,21,91,'relentless',[
    skill('張り直しの音','雷','one',1.26,{effect:'stun',duration:1}),
    skill('二本を張る','雷','all',.78,{hits:2})]),
  304:encounter('風切りの岬守','風',['大剣','弓','氷','土'],6,170,21,21,21,73,'hunter',[
    skill('横なぎの吹き返し','風','all',1.13,{effect:'weaken',magnitude:.25,duration:2})]),
  305:encounter('火守りの岬守','火',['槍','素手','水','闇'],7,190,23,20,14,108,'relentless',[
    skill('遠火をためる','火','allies',0,{effect:'strengthen',magnitude:.28,duration:2}),
    skill('夕の送り火','火','all',.91,{effect:'poison',magnitude:.06,duration:2})]),
  306:encounter('光返りの岬守','光',['剣','短剣','雷','闇'],6,150,19,17,19,96,'caster',[
    skill('一番灯に集う','光','allies',1.16,{effect:'heal'}),
    skill('探り灯','光','one',1.23,{hits:2})])
};

export const trials=[
  {id:'ledge',level:29,title:'岩背の足場',enemies:[301],
    brief:lines('入り江の水が落ちると、岩の間に波除けを直せるほどの足場が出る。水だけが先に引き、砂は動くものが離れるまで固まらない。',
      '古い道具を手に取る人は、いつも岩の背が低くなるまで待つ。支えを失わせた一瞬だけ、奥へ押しても返りが来ないという。',
      '誰かが先走ると体力を奪われる場所だ。大きく動く前に仲間を整え、立て直す時間を残せるだろうか。'),
    done:lines('引いた水が別の音になった。岩の陰から、両岸で同じ位置まで入るための足跡が見つかった。',
      '帰った人は足跡の先を一人分ずつ指で追った。残した目印には、足の速い人が先着しても仲間を待つ場所を書いた。'),
    loot:{tool_012:3,mat_084:1}},
  {id:'twin-rope',level:30,title:'折り返しの双綱',enemies:[302,303],
    brief:lines('かつて別々に張った綱が、同じ木に巻き付いた。片方がぶれるともう片方が力を返し、止まって見える時間にも互いに綱を引いている。',
      '傷を塞ぐ見張りと、縄を張る見張りがいる。目の前の危うい攻めをしのぐか、支えを先に止めるか、立つ順でやり方が違う。',
      '岸から待つ人が綱の先を取ると約束した。片方が解けても、まだもう一方の返しが来ると伝えておこう。'),
    done:lines('綱が止まると、向こう岸から小石を鳴らす返事がした。誰かが強く引かなくても、ほどけた側から順に綱を巻ける。',
      '町に戻ってから、先に外した方の印を残した。別のやり方で来た人も、自分ならどちらから行くか教えてくれた。'),
    loot:{mat_084:2,tool_005:3}},
  {id:'three-lights',level:32,title:'岬を巡る三つの灯',enemies:[304,305,306],
    brief:lines('移動のための小さな灯が三つ、岬の影に置かれた。どの灯が消えるかで、通れる距離と見える景色が変わる。',
      '三つの影は別の力を使う。ひとつは足をすくい、ひとつは力を貸し合い、ひとつは相手を立たせ直す。前から倒す順だけがやり方ではない。',
      '灯を守る人は、今日ここへ来られる者だけで進めと伝えた。帰りを受け取る道は先に浜に引いてあり、ここまで来た者の人数に合わせて結び直せる。'),
    done:lines('裂けた三つの影のあいだから同じ岸が見えた。先に明るくなった側へ案内を渡し、帰りを待っていた灯が横に並ぶ。',
      '最後の足跡が濡れないうちに、今夜の目印を手帳に写した。名を書く欄には、ここに立った人だけが手を置いた。',
      '足跡をつなぐ道は残った。次の夜に来る人がいても、最初と同じ道を歩く必要はない。'),
    loot:{mat_093:1,mat_092:1,tool_012:3}}
];
