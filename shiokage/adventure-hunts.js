const encounterNotes = [
  ['B13','網の上の裂け目','鳥が戻る足場で待つ','切れた舟を先に岸へ戻す','sense','stand'],
  ['B14','棚から井戸へ落ちる泥','乾いた梁から回る','濡れた道から先に止める','stand','slow'],
  ['B15','火をつけた所に増える影','灯を消して耳を澄ます','明るい床に怪物を誘う','sense','anchor'],
  ['B16','水路に根がかかった渡り板','水をせき止めて根を誘う','板を留めて足場を作る','slow','stand'],
  ['B17','岩の間で張った綱','低い床から呼び寄せる','先に救助の綱を張る','slow','anchor'],
  ['B18','岩に見えた鱗','崖から後ろへ回る','足音が止まる所で待つ','sense','stand'],
  ['B19','冷えた窯に浮く赤い泡','冷たい床で待ち受ける','開けた戸から攻める','slow','anchor'],
  ['B20','舟の裏から出る足','舟を岸に留める','流れた舟を別の足場から追う','stand','sense'],
  ['B21','内側から噛む空箱','影だけ見て空いた側へ誘う','箱から離れて構える','sense','anchor'],
  ['B22','岩の間で光る網','網を術で少し切る','飛沫がかかる間に渡る','slow','stand'],
  ['B23','雷が落ちた所に残る足音','床の光から間を読む','足音が途切れる時に動く','sense','anchor'],
  ['B24','灰の中を引きずられる袋','足場を先に空ける','煙を回って袋の向こうへ出る','stand','sense'],
  ['B25','折れた舟に集まる羽','広い所へ順に誘う','明るい方でまとめて止める','slow','anchor'],
  ['B26','穴へ集められた鉄の道具','道具を置いて広い所へ誘う','狭い横道で待つ','sense','stand'],
  ['B27','煙に押し上げられる扉','煙の外から様子を見る','煙が切れる時に短く攻める','stand','anchor'],
  ['B28','低い杭を折る二つの影','退く高い道を確かめる','走り始めの後ろへ回る','stand','sense'],
  ['B29','低い屋根に積もる武具','高い屋根へ戻る足場を作る','落とした武具に寄る時を狙う','stand','anchor'],
  ['B30','風窓から飛び出す氷','窓を開けて広く戦う','窓を閉めて冷気を止める','anchor','slow'],
  ['B31','外棚に残った乾いた輪','雨の中へ踏み出す','乾いた所に相手を誘う','sense','stand'],
  ['B32','曲がり角まで伸びた角','走らせてから受ける','横の坂から身をかわす','slow','stand'],
  ['B33','水たまりの向こうの声','乾いた石から舟へ移る','跳び出す先を見て待つ','stand','sense'],
  ['B34','片側ずつ縄を引く杭','戻る舟を先に留める','縄がたるんだ所から近づく','stand','anchor'],
  ['B35','盛り上がって岩を割る砂','砂の外へ誘う','岩の裏で次の動きを見る','slow','sense'],
  ['B36','歯形の横に広がる穴','硬い地面まで回る','音を止めて待つ','stand','slow'],
  ['B37','葉の影に続く鉤の跡','木の外から狙う','影の向きが変わるまで待つ','anchor','sense'],
  ['B38','曇った水面を流れる光','雷が返る場所から離れる','水面の上から動きを読む','stand','sense'],
  ['B39','舟の板に刺さった歯','水の筋を追って横へ回る','舟から離れて待つ','sense','stand'],
  ['B40','水が引いても上へ動く泥','高い道を保つ','岩の先まで泥を誘う','stand','slow'],
  ['B41','綱を渡る間だけ止まる風','風のない所から走る','翼が閉じるまで待つ','anchor','sense'],
  ['B42','砂州の裏でつながる三つの影','浅瀬を避けて岩の上に立つ','一つの影を追って動きを読む','stand','sense'],
  ['B43','焦げた枝を引いた跡','湿った岩のすきまを抜ける','枝を動かして音で誘う','stand','slow'],
  ['B44','岩を穿つ丸い穴','穴の上の岩棚で待つ','離れた棚から道を回る','slow','sense'],
  ['B45','霧の薄い棚の縁','通気段へ戻る道を確かめる','霧が薄い間に近づく','stand','anchor'],
  ['B46','欠けた蝋と消える羽音','明るい所へ誘う','羽音がやむまで身を隠す','slow','sense'],
  ['B47','岩の前で折り返す足跡','雪が落ちない高い側で待つ','足跡のない脇から近づく','stand','anchor'],
  ['B48','砂へ逆向きに並ぶ泡','甲羅の薄い方へ回る','波の届かない所で待つ','sense','stand'],
  ['B49','鳥の影から外にはみ出す爪','屋根を背に出ていく','爪が入った隙間から近づく','stand','anchor'],
  ['B50','朝日のない窓に返る光','術が返らない所まで回る','窓から離れて間合いを取る','sense','stand'],
  ['B51','ひとつの足音の周りでよける雨','広い棚へ引き出す','雨を背に影を見る','slow','sense'],
  ['B52','二つの岸から見える大きな影','岩の端に降りる時を待つ','二つの戻り道を先に確かめる','anchor','stand']
];

export const huntBriefs=Object.fromEntries(encounterNotes.map(([id,trail,first,second,a,b])=>[id,{trail,first,second,a,b}]));

export const huntEdge = {
  sense:{label:'弱点を一つ見抜いて戦う',reveal:true},
  stand:{label:'足場を選び、最初の一撃を弱める',attack:.82},
  slow:{label:'引きつけて、相手の行動を遅らせる',speed:.79},
  anchor:{label:'守りを読んで、最初の盾を一つ削る',shield:1}
};

const mainMoves = [
  null,
  [{name:'砂を蹴って突進',attribute:'風',channel:'physical',power:1.18}],
  [{name:'鋏で舟を払う',attribute:'水',channel:'physical',power:1.16,target:'all'}],
  [{name:'地面を走る根',attribute:'土',effect:'slow',magnitude:.20,power:1.16}],
  [{name:'吠えて桁を叩く',attribute:'土',channel:'physical',power:1.20,target:'all'}],
  [{name:'窯の炎を取り込む',attribute:'火',effect:'strengthen',magnitude:.24,target:'self',power:0},
    {name:'焼けた石をたたきつける',attribute:'火',power:1.12,target:'all'}],
  [{name:'崖へ落ちる炎',attribute:'火',power:1.21,target:'all'},
    {name:'足場を払う翼',attribute:'風',channel:'physical',power:1.18}],
  [{name:'鎖を引き絞る',attribute:'闇',power:1.18,effect:'weaken',magnitude:.22},
    {name:'橋を払う鎖',attribute:'土',channel:'physical',power:1.04,target:'all'}],
  [{name:'岩をはたく腕',attribute:'水',channel:'physical',power:.70,hits:2},
    {name:'足場をさらう波',attribute:'水',power:1.14,target:'all'}],
  [{name:'影から跳びかかる',attribute:'闇',channel:'physical',power:1.25},
    {name:'六つの目で見据える',attribute:'闇',effect:'slow',magnitude:.26,power:1.05}],
  [{name:'翼で押し戻す',attribute:'風',effect:'slow',magnitude:.28,power:1.08,target:'all'},
    {name:'低く降りて爪を立てる',attribute:'風',channel:'physical',power:1.24}],
  [{name:'一つ目の頭が噛みつく',attribute:'闇',channel:'physical',power:1.26},
    {name:'二つ目の頭が火を吐く',attribute:'火',power:1.12,target:'all'},
    {name:'残りの頭が道をふさぐ',attribute:'土',effect:'weaken',magnitude:.24,power:1.12}],
  [{name:'波を吐く',attribute:'水',power:1.20,target:'all'},
    {name:'骨を打ちつける',attribute:'土',channel:'physical',power:1.14,target:'all'},
    {name:'岩から飛びかかる',attribute:'闇',power:1.26,target:'all'}]
];

export const adventureBossMoves=(chapter,element)=>mainMoves[chapter]??[
  {name:'力をためた一撃',attribute:element,power:1.24},
  {name:'足場を揺らす一撃',attribute:element,channel:'physical',power:1.06,target:'all'}
];
