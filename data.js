// ===== 基本データ =====
const GR = {S:400,A:350,B:300,C:250,D:200};
const GR_HP = {S:4200,A:3800,B:3400,C:3000,D:2600};
const GR_MP = {S:640,A:520,B:400,C:290,D:180};
const STATK = ['hp','atk','def','mat','mdf','spd'];
const G_IDX = {hp:0,mp:1,atk:2,def:3,mat:4,mdf:5,spd:6}; // CHARS.g の並び（MPの位置は使わない）
const STJP = {hp:'HP',mp:'MP',atk:'攻撃',def:'防御',mat:'魔攻',mdf:'魔防',spd:'速度'};
const ELJP = {fire:'炎',ice:'氷',thunder:'雷',light:'光',dark:'闇',none:'無'};
const JPEL = {'炎':'fire','氷':'ice','雷':'thunder','光':'light','闇':'dark','無':'none','―':null};
const STATUSJP = {poison:'毒',paralyze:'麻痺',sleep:'眠り',silence:'沈黙',confuse:'混乱',blind:'暗闇',stop:'ストップ'};

function gradeVal(s, g, lv){
  const top = s==='hp'?GR_HP[g]:s==='mp'?GR_MP[g]:GR[g];
  const r = s==='hp'?0.014:s==='mp'?0.03:0.04;
  const lo = top*r;
  return Math.round(lo + (top-lo)*Math.pow((lv-1)/98,1.25));
}
const expNeed = lv => Math.round(8*Math.pow(lv,2.3));
const enemyExp = L => Math.round(6+0.55*Math.pow(L,1.95));
const enemyGold = L => Math.round(4+0.4*Math.pow(L,1.6));
const dmgF = (a,d) => a*a/(a+Math.max(0,d));

// 仲間（28人）
const CHARS = {
  'アルト': {g:'BBAABBB', col:'#3b82f6', col2:'#1e3a8a', hair:'#1f2937', style:'short', role:'万能の剣士', wpn:'phys'},
  'リリィ': {g:'CSDCAAB', col:'#84cc16', col2:'#f8fafc', hair:'#92400e', style:'braid', role:'回復', wpn:'mag'},
  'ノア':   {g:'DACCBSA', col:'#8b5cf6', col2:'#4c1d95', hair:'#e5e7eb', style:'bob', role:'補助・蘇生', wpn:'mag'},
  'ミナ':   {g:'BDSCDCA', col:'#f97316', col2:'#fff7ed', hair:'#7c2d12', style:'pony', role:'拳闘士', wpn:'phys'},
  'ガルド': {g:'SDSACDD', col:'#9a3412', col2:'#57534e', hair:'#b45309', style:'beard', role:'重戦士', wpn:'phys'},
  'オルガ': {g:'ACCSDAD', col:'#94a3b8', col2:'#38bdf8', hair:'#e2e8f0', style:'long', role:'盾の騎士', wpn:'phys'},
  'シオン': {g:'CCBCDCS', col:'#eab308', col2:'#111827', hair:'#111827', style:'spiky', role:'双剣の盗賊', wpn:'phys'},
  'ドルク': {g:'DSDDSAC', col:'#15803d', col2:'#78350f', hair:'#d1d5db', style:'old', role:'老魔導士', wpn:'mag'},
  'ルガ':   {g:'BCSBDBS', col:'#a16207', col2:'#422006', hair:'#d97706', style:'beast', role:'獣人の槍使い', wpn:'phys', hidden:1},
  'ゴード': {g:'ACSBCBA', col:'#475569', col2:'#1e293b', hair:'#6b7280', style:'beard', role:'元・勇者狩り', wpn:'phys', hidden:1},
  'イヴ':   {g:'CSDCSSB', col:'#fef3c7', col2:'#fbbf24', hair:'#fde68a', style:'long', role:'最初の巫女', wpn:'mag', hidden:1},
  'クロノ': {g:'CBACASS', col:'#0ea5e9', col2:'#0c4a6e', hair:'#f8fafc', style:'hood', role:'時の番人', wpn:'mag', hidden:1},
  'レオン': {g:'SASSASA', col:'#facc15', col2:'#1e40af', hair:'#fef08a', style:'short', role:'初代勇者', wpn:'phys', hidden:1},
  // ここから下は寄り道で出会う仲間（条件は秘密）
  'ロロ':     {g:'CBCCCCA', col:'#d97706', col2:'#78350f', hair:'#451a03', style:'short', role:'行商人', wpn:'phys', hidden:1},
  'テオ':     {g:'BCCADBC', col:'#cbd5e1', col2:'#1d4ed8', hair:'#92400e', style:'short', role:'見習い騎士', wpn:'phys', hidden:1},
  'リュート': {g:'CADCBBB', col:'#10b981', col2:'#064e3b', hair:'#fcd34d', style:'long', role:'吟遊詩人', wpn:'mag', hidden:1},
  'ミオ':     {g:'CBBCBCA', col:'#38bdf8', col2:'#f8fafc', hair:'#1e3a8a', style:'pony', role:'灯台の弓使い', wpn:'phys', hidden:1},
  'ヨル':     {g:'DADCAAB', col:'#6d28d9', col2:'#111827', hair:'#e5e7eb', style:'bob', role:'影の里の娘', wpn:'mag', hidden:1},
  'モルド':   {g:'BCABCAD', col:'#57534e', col2:'#1c1917', hair:'#a8a29e', style:'old', role:'墓守', wpn:'phys', hidden:1},
  'ベラ':     {g:'ADSBDCC', col:'#b91c1c', col2:'#292524', hair:'#f97316', style:'pony', role:'傭兵団の頭', wpn:'phys', hidden:1},
  'アルベルト':{g:'BBAACBD', col:'#7c3aed', col2:'#fbbf24', hair:'#e5e7eb', style:'beard', role:'王', wpn:'phys', hidden:1},
  'ピピ':     {g:'SSSSSSS', col:'#fde047', col2:'#0284c7', hair:'#7dd3fc', style:'spiky', role:'ソラの子', wpn:'phys', hidden:1, expNeedMul:1.3},
  'ザガン':   {g:'SDSACBB', col:'#374151', col2:'#7f1d1d', hair:'#111827', style:'beast', role:'黒将', wpn:'phys', hidden:1},
  // 寄り道で出会う仲間（2）
  'オーツ':   {g:'BCDBAAC', col:'#92400e', col2:'#f5f5f4', hair:'#f5f5f4', style:'beast', role:'ヤギの薬師', wpn:'mag', hidden:1},
  'ガロ':     {g:'SDBSDBD', col:'#0f766e', col2:'#a16207', hair:'#115e59', style:'beast', role:'トカゲの盾斧', wpn:'phys', hidden:1},
  'カスミ':   {g:'CCADCCS', col:'#1e3a8a', col2:'#b91c1c', hair:'#111827', style:'short', role:'忍び', wpn:'phys', hidden:1},
  'ネフェ':   {g:'CADCASB', col:'#7f1d1d', col2:'#ca8a04', hair:'#1f2937', style:'long', role:'星読みの魔族', wpn:'mag', hidden:1},
  'タオ':     {g:'SDABDCC', col:'#dc2626', col2:'#111827', hair:'#f5f5f4', style:'beast', role:'パンダの拳士', wpn:'phys', hidden:1},
};
const CHAR_ORDER = Object.keys(CHARS);
// 次のレベルまでに必要な経験値（晩成の仲間は多めに要る）
function needOf(n,lv){ return Math.round(expNeed(lv)*((CHARS[n]&&CHARS[n].expNeedMul)||1)); }

// ===== 装備 =====
const SLOTS = ['weapon','head','body','arm','acc1','acc2'];
const SLOTJP = {weapon:'武器',head:'頭',body:'体',arm:'腕',acc1:'装飾',acc2:'装飾',acc:'装飾'};
const RARJP = ['白','青','紫','黄','虹'];
const NAMES = {
  wp:['銅の剣','鉄の剣','鋼の剣','銀の剣','騎士の剣','魔鋼の剣','竜骨の剣','星鉄の剣','天の剣'],
  wm:['樫の杖','魔石の杖','賢者の杖','銀の杖','聖樹の杖','魔鋼の杖','竜眼の杖','星の杖','天の杖'],
  head:['皮の帽子','鉄の兜','鋼の兜','銀の髪飾り','騎士の兜','魔鋼の兜','竜鱗の兜','星の冠','天の冠'],
  body:['旅人の服','鎖かたびら','鋼の鎧','銀の胸当て','騎士の鎧','魔鋼の鎧','竜鱗の鎧','星の衣','天の衣'],
  arm:['皮の小手','木の盾','鉄の盾','銀の盾','騎士の盾','魔鋼の盾','竜鱗の盾','星の盾','天の盾'],
  acc:['お守り','銅の指輪','銀の指輪','金の腕輪','騎士の徽章','魔石の首飾り','竜の牙','星のかけら','天の指輪'],
};
// ランダム能力
const AFX = [
  {k:'atkF', t:'攻撃力+', s:['weapon','arm','acc'], max:i=>Math.max(1,Math.round(i*0.8))},
  {k:'matF', t:'魔法攻撃力+', s:['weapon','arm','acc'], max:i=>Math.max(1,Math.round(i*0.8))},
  {k:'defF', t:'防御力+', s:['head','body','arm','acc'], max:i=>Math.max(1,Math.round(i*0.8))},
  {k:'mdfF', t:'魔法防御+', s:['head','body','arm','acc'], max:i=>Math.max(1,Math.round(i*0.8))},
  {k:'spdF', t:'速度+', s:['head','body','arm','acc'], max:i=>Math.max(1,Math.round(i*0.8))},
  {k:'hpF', t:'HP+', s:['head','body','arm','acc'], max:i=>Math.max(5,Math.round(i*12))},
  {k:'gaugeF', t:'戦闘開始時ゲージ+', s:['head','body','acc'], max:i=>Math.max(3,5+Math.floor(i/5))},
  {k:'atkP', t:'攻撃力+', p:1, s:['weapon','acc'], max:i=>2+Math.floor(i/12)},
  {k:'matP', t:'魔法攻撃力+', p:1, s:['weapon','acc'], max:i=>2+Math.floor(i/12)},
  {k:'hpP', t:'HP+', p:1, s:['body','acc'], max:i=>2+Math.floor(i/12)},
  {k:'crit', t:'会心率+', p:1, s:['weapon','arm','acc'], max:i=>2+Math.floor(i/25)},
  {k:'critDmg', t:'会心ダメージ+', p:1, s:['weapon','acc'], max:i=>10+Math.floor(i/5)},
  {k:'critDef', t:'会心防御率+', p:1, s:['head','body','arm'], max:i=>2+Math.floor(i/25)},
  {k:'resFire', t:'炎耐性+', p:1, s:['head','body','arm','acc'], max:i=>20},
  {k:'resIce', t:'氷耐性+', p:1, s:['head','body','arm','acc'], max:i=>20},
  {k:'resThunder', t:'雷耐性+', p:1, s:['head','body','arm','acc'], max:i=>20},
  {k:'resDark', t:'闇耐性+', p:1, s:['head','body','arm','acc'], max:i=>20},
  {k:'stRes', t:'状態異常耐性+', p:1, s:['head','acc'], max:i=>30},
  {k:'expUp', t:'経験値+', p:1, s:['acc'], max:i=>15},
  {k:'dropUp', t:'ドロップ率+', p:1, s:['acc'], max:i=>15},
  {k:'drain', t:'HP吸収', p:1, s:['weapon'], max:i=>5, minR:3},
  // ゲージまわり（MPがないかわりに、アクティブの回り方を変える効果）
  {k:'gNorm', t:'通常攻撃のゲージ+', s:['weapon','acc'], max:i=>3+Math.floor(i/12)},
  {k:'gHurt', t:'被弾時のゲージ+', s:['head','body','arm'], max:i=>4+Math.floor(i/10)},
  {k:'gCrit', t:'会心時のゲージ+', s:['weapon','arm','acc'], max:i=>6+Math.floor(i/8)},
  {k:'gKill', t:'撃破時のゲージ+', s:['weapon','head','acc'], max:i=>8+Math.floor(i/6)},
  {k:'gTurn', t:'毎ターンゲージ+', s:['head','body','acc'], max:i=>2+Math.floor(i/20), minR:2},
  {k:'gKeep', t:'アクティブ後に残るゲージ+', s:['body','acc'], max:i=>10+Math.floor(i/6), minR:3},
  {k:'actP', t:'アクティブの威力+', p:1, s:['weapon','acc'], max:i=>4+Math.floor(i/10), minR:2},
];
const UNIQ = [
  {k:'critSpd', t:'会心を出すたび速度↑'},
  {k:'mpRegen', t:'毎ターンゲージ+8'},
  {k:'light30', t:'光属性ダメージ+30%'},
  {k:'dmgCut', t:'受けるダメージ-10%'},
  {k:'dblAtk', t:'通常攻撃が10%で2回になる'},
  {k:'startAll', t:'戦闘開始時に全能力↑'},
  {k:'fullHp', t:'HPが満タンなら攻撃力+25%'},
  {k:'grief', t:'倒れた仲間がいると全能力+15%'},
  {k:'gDouble', t:'通常攻撃でたまるゲージが2倍'},
  {k:'startFull', t:'戦闘開始時にゲージ満タン'},
  {k:'gShare', t:'アクティブを使うと仲間全員のゲージ+15'},
  {k:'gHalf', t:'アクティブのあと、ゲージが半分残る'},
  {k:'rise', t:'倒れたとき1度だけ、HP40%で立ち上がる'},
  {k:'raise', t:'1戦闘1回、倒れた仲間をHP30%で起こす'},
  {k:'regenU', t:'毎ターン、HPが最大HPの4%回復する'},
];
// 武器・防具の種類。種類ごとに素の強さと性格が違う（ランダムの効果とは別の、品そのものの強さ）
//  m：主な能力の倍率（武器は攻撃/魔攻、防具は能力ごと）、add：レベル×値を足す、imp：最初から付いている効果 [能力, 基本, レベルごと]
//  n：レベル帯ごとの名前（9段階）。nn：名品・夜明けの品に使う呼び名
const ITYPE = {
  wp:[
    {id:'sword', t:'剣', nn:'剣', m:1, n:['銅の剣','鉄の剣','鋼の剣','白銀の剣','騎士団の剣','魔鋼の剣','竜骨の剣','星鉄の剣','蒼天の剣']},
    {id:'great', t:'大剣', nn:'大剣', m:1.2, add:{spd:-0.3}, n:['石の大剣','鉄の大剣','クレイモア','鋼の大剣','戦士の大剣','魔鋼の大剣','竜骨の大剣','星鉄の大剣','断天の大剣']},
    {id:'katana', t:'刀', nn:'太刀', m:1.05, imp:[['crit',3,0],['critDmg',8,0.1]], n:['竹光','打刀','鋼の刀','銀の太刀','業物の刀','妖刀','竜鱗の太刀','星鉄の太刀','天津の太刀']},
    {id:'rapier', t:'細剣', nn:'細剣', m:0.9, add:{spd:0.35}, imp:[['crit',2,0]], n:['練習用の細剣','鉄の細剣','レイピア','銀の細剣','貴族の細剣','魔鋼の細剣','竜牙の細剣','星光の細剣','天の細剣']},
    {id:'dagger', t:'短剣', nn:'双刃', m:0.86, add:{spd:0.3}, imp:[['crit',3,0]], n:['銅の短剣','鉄の短剣','盗賊の短剣','銀の短剣','暗殺者の短剣','魔鋼の短剣','竜牙の短剣','星鉄の短剣','天の短剣']},
    {id:'axe', t:'斧', nn:'斧', m:1.1, imp:[['gKill',6,0.1]], n:['手斧','鉄の斧','鋼の戦斧','銀の斧','バトルアックス','魔鋼の斧','竜骨の斧','星鉄の斧','天割りの斧']},
    {id:'spear', t:'槍', nn:'槍', m:1.04, add:{def:0.35}, n:['木の槍','鉄の槍','鋼の槍','銀の槍','騎士の槍','ハルバード','竜骨の槍','星鉄の槍','天の槍']},
    {id:'club', t:'鈍器', nn:'鎚', m:1.15, add:{spd:-0.15}, imp:[['gHurt',3,0.05]], n:['こん棒','樫の棍棒','鉄の棍','鎚矛','戦鎚','魔鋼の鎚','竜骨の大槌','星球の鎚','天の鉄槌']},
    {id:'scythe', t:'鎌', nn:'大鎌', m:1.05, imp:[['drain',2,0.02]], n:['草刈り鎌','鉄の鎌','鋼の大鎌','銀の鎌','墓守の大鎌','魔鋼の大鎌','竜骨の大鎌','星喰いの鎌','天の大鎌']},
    {id:'bow', t:'弓', nn:'弓', m:0.95, imp:[['critDmg',10,0.2]], n:['短弓','狩人の弓','長弓','銀の弓','騎士の弓','魔鋼の弓','竜骨の弓','星の弓','天の弓']},
    {id:'fist', t:'拳', nn:'拳', m:0.9, imp:[['gNorm',3,0.05]], n:['皮の拳帯','鉄の拳当て','鋼の鉤爪','銀の拳当て','闘士の拳','魔鋼の爪','竜の爪','星の拳','天の拳']},
  ],
  wm:[
    {id:'staff', t:'杖', nn:'杖', m:1, n:['樫の杖','魔石の杖','賢者の杖','銀の杖','聖樹の杖','魔鋼の杖','竜眼の杖','星の杖','天の杖']},
    {id:'tome', t:'書', nn:'書', m:0.88, imp:[['gaugeF',12,0.1]], n:['見習いの書','魔石の書','呪文書','銀の書','聖典','魔鋼の書','竜語の書','星図の書','天の書']},
    {id:'scepter', t:'錫杖', nn:'錫杖', m:0.92, add:{mdf:0.3,hp:3}, n:['木の錫杖','祈りの錫杖','司祭の錫杖','銀の錫杖','聖樹の錫杖','大司教の錫杖','竜眼の錫杖','星の錫杖','天の錫杖']},
    {id:'orb', t:'宝珠', nn:'宝珠', m:1.17, add:{def:-0.3}, n:['ガラスの宝珠','魔石の宝珠','水晶玉','銀の宝珠','月の宝珠','魔鋼の宝珠','竜眼の宝珠','星の宝珠','天の宝珠']},
    {id:'harp', t:'楽器', nn:'竪琴', m:0.85, imp:[['gTurn',2,0.02]], n:['木の笛','旅の竪琴','銀の笛','詩人の竪琴','月の竪琴','魔鋼の笛','竜骨の角笛','星の竪琴','天の竪琴']},
    {id:'fan', t:'扇', nn:'扇', m:0.95, add:{spd:0.3,mdf:0.2}, n:['紙の扇','絹の扇','鉄扇','銀の扇','舞姫の扇','魔鋼の鉄扇','竜鱗の扇','星の扇','天の羽扇']},
    {id:'hex', t:'呪具', nn:'呪具', m:1.25, add:{def:-0.2,mdf:-0.2}, n:['木彫りの人形','呪いの人形','骨の杖','髑髏の杖','黒魔の杖','魔鋼の呪具','竜骨の呪杖','星喰いの呪具','冥府の杖']},
  ],
  body:[
    {id:'armor', t:'鎧', nn:'鎧', m:{def:1.25,mdf:0.6}, add:{spd:-0.2}, n:['皮の鎧','鎖かたびら','鋼の鎧','銀の鎧','騎士の鎧','魔鋼の鎧','竜鱗の鎧','星の鎧','天の鎧']},
    {id:'vest', t:'胸当て', nn:'胸当て', m:{def:0.95,mdf:0.9}, add:{spd:0.25}, n:['布の胸当て','皮の胸当て','鋼の胸当て','銀の胸当て','騎士の胸当て','魔鋼の胸当て','竜鱗の胸当て','星の胸当て','天の胸当て']},
    {id:'robe', t:'衣', nn:'衣', m:{def:0.7,mdf:1.4}, n:['旅人の服','魔法の衣','賢者のローブ','銀糸のローブ','聖なる衣','魔鋼糸の衣','竜絹の衣','星の衣','天の衣']},
    {id:'cloak', t:'外套', nn:'外套', m:{def:0.85,mdf:1.05}, add:{spd:0.15}, imp:[['critDef',3,0.03]], n:['旅の外套','狩人の外套','影の外套','銀糸の外套','騎士のマント','魔鋼糸の外套','竜皮のマント','星のマント','天のマント']},
    {id:'gi', t:'道着', nn:'道着', m:{def:0.8,mdf:0.8}, add:{atk:0.3,spd:0.15}, n:['布の道着','稽古着','武闘着','銀糸の道着','師範の道着','魔鋼糸の道着','竜皮の道着','星の道着','天の道着']},
    {id:'fur', t:'毛皮', nn:'毛皮', m:{def:0.9,mdf:0.7}, add:{hp:6}, n:['毛皮のベスト','狼の毛皮','熊の毛皮','銀狼の毛皮','雪豹の毛皮','魔獣の毛皮','竜の皮衣','星獣の毛皮','天狼の毛皮']},
  ],
  head:[
    {id:'helm', t:'兜', nn:'兜', m:{def:1.3,mdf:0.6}, n:['皮の兜','鉄の兜','鋼の兜','銀の兜','騎士の兜','魔鋼の兜','竜鱗の兜','星の兜','天の兜']},
    {id:'hat', t:'冠', nn:'冠', m:{def:0.7,mdf:1.4}, n:['皮の帽子','魔法の帽子','賢者の帽子','銀の冠','聖なる冠','魔鋼の冠','竜眼の冠','星の冠','天の冠']},
    {id:'band', t:'鉢金', nn:'サークレット', m:{def:0.9,mdf:0.9}, imp:[['critDef',4,0.04]], n:['布の鉢巻','鉄の鉢金','鋼の鉢金','銀のサークレット','騎士の鉢金','魔鋼の鉢金','竜骨の鉢金','星のサークレット','天のサークレット']},
    {id:'hood', t:'頭巾', nn:'頭巾', m:{def:0.75,mdf:1.0}, add:{spd:0.2}, n:['布の頭巾','皮のフード','忍びの頭巾','銀糸のフード','影の頭巾','魔鋼糸のフード','竜皮のフード','星のフード','天のフード']},
    {id:'mask', t:'仮面', nn:'仮面', m:{def:0.9,mdf:0.8}, imp:[['crit',2,0.02]], n:['木の仮面','鉄の仮面','鋼の仮面','銀の仮面','道化の仮面','魔鋼の仮面','竜の仮面','星の仮面','天の仮面']},
    {id:'orn', t:'髪飾り', nn:'髪飾り', m:{def:0.6,mdf:1.2}, imp:[['gaugeF',6,0.05]], n:['花の髪飾り','銅のかんざし','銀のかんざし','真珠の髪飾り','月のかんざし','魔石の髪飾り','竜玉の髪飾り','星の髪飾り','天の髪飾り']},
  ],
  arm:[
    {id:'shield', t:'盾', nn:'盾', m:{def:1.3,mdf:1.0}, add:{spd:-0.1}, n:['木の盾','鉄の盾','鋼の盾','銀の盾','騎士の盾','魔鋼の盾','竜鱗の盾','星の盾','天の盾']},
    {id:'tower', t:'大盾', nn:'大盾', m:{def:1.65,mdf:1.1}, add:{spd:-0.3}, n:['木の大盾','鉄の大盾','鋼の大盾','銀の大盾','城塞の大盾','魔鋼の大盾','竜鱗の大盾','星の大盾','天の大盾']},
    {id:'buckler', t:'小盾', nn:'小盾', m:{def:0.95,mdf:0.85}, add:{spd:0.15}, n:['皮の小盾','鉄のバックラー','鋼のバックラー','銀の小盾','騎士の小盾','魔鋼の小盾','竜鱗の小盾','星の小盾','天の小盾']},
    {id:'gauntlet', t:'小手', nn:'小手', m:{def:0.75,mdf:0.6}, add:{atk:0.35}, n:['皮の小手','鉄の小手','鋼の小手','銀の小手','騎士の小手','魔鋼の小手','竜骨の小手','星の小手','天の小手']},
    {id:'glove', t:'手袋', nn:'手袋', m:{def:0.6,mdf:0.9}, add:{mat:0.35}, n:['布の手袋','魔石の手袋','賢者の手袋','銀糸の手袋','聖なる手袋','魔鋼糸の手袋','竜皮の手袋','星の手袋','天の手袋']},
  ],
  acc:[
    {id:'ring', t:'指輪', nn:'指輪', m:{hp:0.5}, imp:[['crit',2,0.02]], n:['銅の指輪','鉄の指輪','銀の指輪','金の指輪','騎士の指輪','魔石の指輪','竜の指輪','星の指輪','天の指輪']},
    {id:'amulet', t:'首飾り', nn:'首飾り', m:{hp:1.6}, n:['木彫りの首飾り','銅の首飾り','銀の首飾り','金の首飾り','騎士の首飾り','魔石の首飾り','竜の牙','星のかけら','天の首飾り']},
    {id:'charm', t:'お守り', nn:'お守り', m:{hp:0.8}, imp:[['stRes',8,0.1]], n:['お守り','魔除けのお守り','銀のお守り','金のお守り','騎士の徽章','魔石のお守り','竜のお守り','星のお守り','天のお守り']},
    {id:'bangle', t:'腕輪', nn:'腕輪', m:{hp:0.6}, add:{spd:0.2}, n:['皮の腕輪','銅の腕輪','銀の腕輪','金の腕輪','騎士の腕輪','魔鋼の腕輪','竜骨の腕輪','星の腕輪','天の腕輪']},
    {id:'earring', t:'耳飾り', nn:'耳飾り', m:{hp:0.5}, add:{mdf:0.3}, n:['貝の耳飾り','銅のイヤリング','銀のイヤリング','金のイヤリング','真珠の耳飾り','魔石の耳飾り','竜玉の耳飾り','星の耳飾り','天の耳飾り']},
    {id:'belt', t:'帯', nn:'帯', m:{hp:1.0}, add:{def:0.25}, n:['皮のベルト','鉄の帯金','鋼のベルト','銀の帯','騎士のベルト','魔鋼の帯','竜皮の帯','星の帯','天の帯']},
    {id:'plume', t:'羽根飾り', nn:'羽根飾り', m:{hp:0.5}, imp:[['gaugeF',5,0.05]], n:['鳥の羽根','白い羽根','鷹の羽根','銀の羽根','孔雀の羽根','魔鳥の羽根','竜の羽根','星の羽根','天使の羽根']},
  ],
};
// 名品：素の強さが一段上の品。まれに混ざり、錬成屋で作ることもできる（夜明けの品は迷宮の奥でしか見つからない）
const MEIHIN = [
  // 物理の武器
  {nm:'名工の剣', g:'wp', ty:'sword', lv:18, x:1.15},
  {nm:'疾風の槍', g:'wp', ty:'spear', lv:22, x:1.12, imp:[['spdF',6,0]]},
  {nm:'鬼の金棒', g:'wp', ty:'club', lv:24, x:1.2},
  {nm:'風切りの短剣', g:'wp', ty:'dagger', lv:26, x:1.12, imp:[['crit',4,0]]},
  {nm:'薔薇の細剣', g:'wp', ty:'rapier', lv:28, x:1.15},
  {nm:'獣王の爪', g:'wp', ty:'fist', lv:28, x:1.15},
  {nm:'斬鉄の刀', g:'wp', ty:'katana', lv:30, x:1.15, imp:[['crit',3,0]]},
  {nm:'巨人殺しの大剣', g:'wp', ty:'great', lv:32, x:1.18},
  {nm:'王家の宝剣', g:'wp', ty:'sword', lv:34, x:1.2, imp:[['crit',2,0]]},
  {nm:'月影の弓', g:'wp', ty:'bow', lv:34, x:1.16},
  {nm:'断罪の斧', g:'wp', ty:'axe', lv:38, x:1.18},
  {nm:'竜突きの槍', g:'wp', ty:'spear', lv:40, x:1.18},
  {nm:'死神の大鎌', g:'wp', ty:'scythe', lv:40, x:1.2, imp:[['drain',2,0]]},
  {nm:'影縫いの短剣', g:'wp', ty:'dagger', lv:42, x:1.2},
  {nm:'闘神の拳', g:'wp', ty:'fist', lv:44, x:1.15, imp:[['gNorm',4,0]]},
  {nm:'王女の細剣', g:'wp', ty:'rapier', lv:44, x:1.2},
  {nm:'聖騎士の鎚', g:'wp', ty:'club', lv:44, x:1.22},
  {nm:'月下の太刀', g:'wp', ty:'katana', lv:46, x:1.2, imp:[['critDmg',15,0]]},
  {nm:'竜断ちの大剣', g:'wp', ty:'great', lv:50, x:1.24},
  {nm:'百発の弓', g:'wp', ty:'bow', lv:50, x:1.22, imp:[['crit',4,0]]},
  {nm:'永劫の剣', g:'wp', ty:'sword', lv:52, x:1.25, imp:[['gTurn',2,0]]},
  // 魔法の武器
  {nm:'大賢者の杖', g:'wm', ty:'staff', lv:20, x:1.15},
  {nm:'禁じられた書', g:'wm', ty:'tome', lv:34, x:1.1, imp:[['gaugeF',15,0]]},
  {nm:'精霊の竪琴', g:'wm', ty:'harp', lv:36, x:1.2, imp:[['gTurn',2,0]]},
  {nm:'聖女の錫杖', g:'wm', ty:'scepter', lv:40, x:1.18},
  {nm:'天女の扇', g:'wm', ty:'fan', lv:40, x:1.2},
  {nm:'星詠みの宝珠', g:'wm', ty:'orb', lv:46, x:1.15},
  {nm:'世界樹の杖', g:'wm', ty:'staff', lv:48, x:1.24},
  {nm:'魔王の髑髏杖', g:'wm', ty:'hex', lv:50, x:1.25},
  // 防具
  {nm:'獅子の兜', g:'head', ty:'helm', lv:28, x:1.2},
  {nm:'英雄の鎧', g:'body', ty:'armor', lv:30, x:1.2},
  {nm:'闘士の小手', g:'arm', ty:'gauntlet', lv:30, x:1.2},
  {nm:'白狼の毛皮', g:'body', ty:'fur', lv:30, x:1.2},
  {nm:'道化師の仮面', g:'head', ty:'mask', lv:32, x:1.2, imp:[['crit',3,0]]},
  {nm:'魔導師の手袋', g:'arm', ty:'glove', lv:34, x:1.2},
  {nm:'城壁の大盾', g:'arm', ty:'tower', lv:36, x:1.3},
  {nm:'闇夜の外套', g:'body', ty:'cloak', lv:36, x:1.2},
  {nm:'拳聖の道着', g:'body', ty:'gi', lv:40, x:1.2},
  {nm:'月の冠', g:'head', ty:'hat', lv:40, x:1.2},
  {nm:'鏡の盾', g:'arm', ty:'shield', lv:42, x:1.2, imp:[['resDark',15,0]]},
  {nm:'星織りの衣', g:'body', ty:'robe', lv:42, x:1.2},
  {nm:'天女の髪飾り', g:'head', ty:'orn', lv:44, x:1.2},
  {nm:'不壊の鎧', g:'body', ty:'armor', lv:52, x:1.25},
  // 装飾
  {nm:'幸運の首飾り', g:'acc', ty:'amulet', lv:26, x:1.0, imp:[['dropUp',10,0]]},
  {nm:'学者の耳飾り', g:'acc', ty:'earring', lv:30, x:1.0, imp:[['expUp',10,0]]},
  {nm:'女神の指輪', g:'acc', ty:'ring', lv:38, x:1.2, imp:[['crit',3,0]]},
  {nm:'巨人の帯', g:'acc', ty:'belt', lv:40, x:1.3},
  {nm:'鳳凰の羽根', g:'acc', ty:'plume', lv:46, x:1.0, imp:[['gaugeF',20,0]]},
  {nm:'時の砂時計', g:'acc', ty:'charm', lv:48, x:1.0, imp:[['gTurn',3,0]]},
];
// 夜明けの品：どの種類にも1つずつ。素の強さ1.3倍。Lv66から（第3の迷宮より奥）
for(const g in ITYPE) for(const T of ITYPE[g]) MEIHIN.push({nm:'夜明けの'+T.nn, g, ty:T.id, lv:66, x:1.3, top:1});
// 仲間ごとの得意・苦手な武器（得意：武器の素の強さ+12%、苦手：-15%）
const AFF = {
  'アルト':{fav:['sword'], ng:['bow','fist']},
  'リリィ':{fav:['scepter'], ng:['hex']},
  'ノア':{fav:['tome','orb'], ng:['hex']},
  'ミナ':{fav:['fist'], ng:['great','spear','bow']},
  'ガルド':{fav:['great','club'], ng:['dagger','rapier','bow']},
  'オルガ':{fav:['spear','sword'], ng:['fist','scythe']},
  'シオン':{fav:['dagger'], ng:['great','club','spear']},
  'ドルク':{fav:['staff','tome'], ng:['fan','harp']},
  'ルガ':{fav:['spear','fist'], ng:['rapier','bow']},
  'ゴード':{fav:['katana'], ng:['bow','fist']},
  'イヴ':{fav:['scepter','fan'], ng:['hex']},
  'クロノ':{fav:['orb','tome'], ng:['harp']},
  'レオン':{fav:['sword','great'], ng:[]},
  'ロロ':{fav:['dagger','club'], ng:['great','axe']},
  'テオ':{fav:['sword','spear'], ng:['scythe','katana']},
  'リュート':{fav:['harp'], ng:['hex','staff']},
  'ミオ':{fav:['bow'], ng:['great','axe','club']},
  'ヨル':{fav:['hex','fan'], ng:['scepter']},
  'モルド':{fav:['scythe'], ng:['rapier','bow']},
  'ベラ':{fav:['axe','great'], ng:['rapier','dagger']},
  'アルベルト':{fav:['rapier','sword'], ng:['axe','fist','scythe']},
  'ピピ':{fav:['fist'], ng:['great','axe']},
  'ザガン':{fav:['axe'], ng:['bow','rapier']},
  'オーツ':{fav:['staff','scepter'], ng:['hex']},
  'ガロ':{fav:['axe','club'], ng:['bow','rapier']},
  'カスミ':{fav:['dagger','katana'], ng:['great','club']},
  'ネフェ':{fav:['orb','hex'], ng:['scepter']},
  'タオ':{fav:['fist'], ng:['bow','rapier']},
};
const FAV = {}; for(const n in AFF) FAV[n]=AFF[n].fav[0];
function weaponAff(n,ty){ const a=AFF[n]; if(!a||!ty) return 0; return a.fav.includes(ty)?1: a.ng.includes(ty)?-1:0; }
const TYJP = {}; for(const g in ITYPE) for(const T of ITYPE[g]) TYJP[T.id]=T.t;
// クリア後の敵（記憶の迷宮だけに出る40種）。迷宮ごとに「失敗した周」の景色に合わせた4グループ
const POST_AREA0 = ENEMY_AREAS.length;
ENEMY_AREAS.push(
 ['記憶の迷宮（魔王の周）',75,[
  ['玉座の影','魔','光','闇','呪い（能力ダウン）','黒い結晶'],['黒衣の近衛','硬','雷','闇','かばう','黒い結晶'],['燃える軍旗','補','氷','炎','味方全体を強化','焦げた布'],['魔王の猟犬','速','光','闇','2回かみつく','黒い牙'],['崩れた石像','硬','雷','―','防御が高い','石のかけら'],
  ['器の残り火','魔','氷','炎','炎の魔法','残り火'],['名もなき勇者の霊','攻','光','闇','会心が出やすい','さびた剣'],['砕けた冠の精','補','闇','光','HPを回復する','冠のかけら'],['影の弓兵','速','炎','闇','後列から射る','影の矢'],['夜の巨人','大','光','闇','暴れる（2回攻撃）','巨人の骨']]],
 ['記憶の迷宮（喪失の周）',80,[
  ['泣き声の亡霊','魔','光','闇','眠らせる','涙の結晶'],['墓守の鎧','硬','雷','氷','反撃','古い鎧片'],['灰の獣','攻','氷','炎','炎を吐く','灰'],['焼けた本','魔','氷','炎','沈黙させる','焦げた紙'],['迷子の灯火','補','闇','光','ランダムな状態異常','灯火'],
  ['道場の木人','硬','炎','―','攻撃力を上げる','木片'],['忘れられた騎士','攻','雷','光','光の剣','騎士の紋章'],['さまよう双影','速','光','闇','2回攻撃','影の刃'],['涙の大蛇','大','雷','氷','毒の尾','蛇の鱗'],['錆びた盾の番人','硬','雷','―','かばう','錆びた盾']]],
 ['記憶の迷宮（黒天の周）',86,[
  ['黒天の天使','魔','闇','光','全体攻撃','白い羽'],['祭壇の石像','硬','雷','光','防御を上げる','祭壇の石'],['聖騎士の影','攻','闇','光','光の剣','聖印'],['祈りの壺','補','雷','―','敵を強化する','壺のかけら'],['金の書庫','魔','炎','光','ランダムな魔法','金の紙'],
  ['ひび割れ精','速','光','闇','先に動きやすい','ひびの欠片'],['黒い雨の精','魔','雷','氷','毒の水','黒い雫'],['教会の猟犬','速','闇','光','弱った仲間を狙う','聖なる首輪'],['器の守り手','硬','闇','光','味方全体を強化','守り手の芯'],['寄付箱ゴーレム','大','雷','―','道具を盗む','金貨']]],
 ['記憶の迷宮（終わりのない周）',92,[
  ['終わらない亡霊','魔','光','闇','HPを吸う','虚のかけら'],['巻き戻る影','速','光','闇','動きを止める','時の砂'],['生き返った兵士','攻','光','闇','反撃','兵士の認識票'],['虚の羽虫','速','光','闇','群れで出る','虚の羽'],['取り消された死','魔','光','闇','毒・混乱','黒い花'],
  ['崩れる世界の精','魔','雷','―','全体攻撃','世界のかけら'],['器のなり損ない','大','光','闇','HPを吸う','黒い結晶'],['祈る泥人形','補','雷','―','HPを回復する','泥'],['夜明けの番人','硬','闇','光','防御が高い','朝の光'],['首飾りの影','攻','光','闇','会心が出やすい','金の鎖']]]
);
// 記憶の迷宮の番人（失敗した周の誰か）
const MAZE_BOSS = [
  {nm:'玉座の魔王アルト', sh:'human', col:'#1f2937', w:'光', ab:['charge','darkAoe']},
  {nm:'古戦場の亡霊ガルド', sh:'ghost', col:'#57534e', w:'光', ab:['charge']},
  {nm:'黒天のセイル', sh:'seil', col:'#0f172a', w:'雷', ab:['holyAoe','selfHeal']},
  {nm:'独りの巫女の影', sh:'ghost', col:'#a5b4fc', w:'闇', ab:['light','selfHeal']},
  {nm:'笑わない拳', sh:'human', col:'#b91c1c', w:'氷', ab:['aoe','twice']},
  {nm:'さまよう双剣', sh:'human', col:'#0e7490', w:'炎', ab:['twice']},
  {nm:'砕けた大盾', sh:'golem', col:'#cbd5e1', w:'雷', ab:['guard','defUp']},
  {nm:'燃える古文書', sh:'ghost', col:'#ea580c', w:'氷', ab:['aoe','dark']},
  {nm:'泣きつづける少女', sh:'noah', col:'#64748b', w:'光', ab:['selfHeal','darkAoe']},
  {nm:'剣を向けた勇者', sh:'human', col:'#1d4ed8', w:'闇', ab:['charge','aoe']},
  {nm:'終わりのない世界', sh:'void', col:'#020617', w:'光', ab:['darkAoe','summon']},
  {nm:'首飾りの記憶', sh:'void', col:'#8b5cf6', w:'無', ab:['darkAoe','twice','selfHeal']},
];
// 伝説装備：前の周の誰かが使っていたもの。説明文でその周の結末が分かる
const LEGENDS = [
  {nm:'玉座の黒剣', slot:'weapon', kind:'p', ty:'sword', u:'fullHp', lore:'魔王になった周のアルトの剣。最後まで、誰も斬れなかった。'},
  {nm:'古戦場の大剣', slot:'weapon', kind:'p', ty:'great', u:'grief', lore:'ガルドが倒れた周の大剣。持ち主を待って、千年さびなかった。'},
  {nm:'黒天の冠', slot:'head', ty:'hat', u:'mpRegen', lore:'セイルが勝った周の冠。空が黒く塗りつぶされた日にかぶられた。'},
  {nm:'独りの守り石', slot:'acc', ty:'charm', u:'startAll', lore:'リリィが一人で魔王城へ行った周の守り石。光ったのは、一度だけ。'},
  {nm:'道場の拳帯', slot:'arm', ty:'gauntlet', u:'dblAtk', lore:'ミナの道場が焼けた周の拳帯。ほどかれることはなかった。'},
  {nm:'復讐者の双剣', slot:'weapon', kind:'p', ty:'dagger', u:'critSpd', lore:'ザガンが生き返らなかった周のシオンの剣。抜く相手を、最後まで探していた。'},
  {nm:'忠義の大盾', slot:'body', ty:'armor', u:'dmgCut', lore:'オルガがセイルの盾として死んだ周の鎧。最後まで、主を疑わなかった。'},
  {nm:'焼けた古文書', slot:'acc', ty:'charm', u:'mpRegen', lore:'ドルクが口封じされた周の古文書。焦げた最後の一行だけが読める。「フタは、人の手で閉じられる」'},
  {nm:'涙の首飾り', slot:'acc', ty:'amulet', u:'grief', lore:'ノアが誰も生き返らせなかった周の首飾り。いつも濡れていた。'},
  {nm:'疑いの剣', slot:'weapon', kind:'p', ty:'sword', u:'critSpd', lore:'アルトがリリィに剣を向けた周の剣。リリィは、笑っていた。'},
  {nm:'終わりの杖', slot:'weapon', kind:'m', ty:'staff', u:'light30', lore:'誰も死ななかった周の杖。世界がなくなる直前まで、だれかを癒やしていた。'},
  {nm:'名もなき首飾り', slot:'acc', ty:'amulet', u:'startAll', lore:'どの周のものでもない首飾り。裏に、小さく「ありがとう」と彫ってある。'},
];
const RAINBOW_WHO = ['勇者','剣士','巫女','騎士','魔導士','盗賊','拳闘士'];

// ===== 素材（魔物が落とす。錬成屋で使う） =====
// 種類：鉱石・皮と鱗・骨と牙・結晶・布と紙・羽・珍品。★は手に入る場所の深さ（★1〜★5）
const MATCAT = {ore:'鉱石', hide:'皮・鱗', bone:'骨・牙', crystal:'結晶', cloth:'布・紙', feather:'羽', curio:'珍品', boss:'ボスの素材'};
// 図鑑の「落とす物」のうち、素材として読み替えるもの（道具そのものは道具として落ちる）
const MAT_ALIAS = {'目薬':'薬の小瓶','毒消し':'毒消し草','煙玉':'火薬','銅の盾':'銅の破片','鉄の剣':'折れた剣','古びた剣':'錆びた刃','兵士の剣':'兵士の折れ剣','聖騎士の剣':'聖銀の破片','鋼の盾':'鋼の破片','守り手の盾':'守り手の破片','矢筒':'矢羽','記憶のかけら':'記憶の砂','さびた剣':'錆びた刃','錆びた盾':'鋼の破片'};
const MAT_ITEM = {'薬草':'herb','聖水':'holy'}; // これは道具として落ちる
const MAT_CAT_FIX = {'聖なる鎖':'ore','金の鎖':'ore','聖騎士の紋章':'curio','騎士の紋章':'curio','聖印':'curio','船員の帽子':'cloth','黒い本':'cloth','審問の書':'cloth','王冠のかけら':'crystal','冠のかけら':'crystal','虚のかけら':'crystal','世界のかけら':'crystal','時の砂':'crystal','記憶の砂':'crystal','祭壇の石':'ore','石のかけら':'ore','石の欠片':'ore','ひびの欠片':'crystal','壺のかけら':'curio','残り火':'crystal','灯火':'crystal','朝の光':'crystal','黒い雫':'crystal','灰':'curio','木片':'curio','金貨':'curio','古い硬貨':'curio','兵士の認識票':'curio','聖なる首輪':'curio','守り手の芯':'crystal','黒い花':'curio','種':'curio','泥':'curio','粘液':'curio','チーズ':'curio','イカの足':'curio','火薬':'curio','薬の小瓶':'curio','毒消し草':'curio','錆びた鍵':'curio','古い鍵':'curio','巨人の骨':'bone','古い鎧片':'ore'};
function matCatGuess(n){ if(MAT_CAT_FIX[n]) return MAT_CAT_FIX[n];
  if(/羽|矢羽/.test(n)) return 'feather'; if(/皮|鱗|甲羅|毛皮/.test(n)) return 'hide'; if(/骨|牙|歯|爪/.test(n)) return 'bone';
  if(/結晶|水|宝石|核|かけら|欠片|砂|雫|氷/.test(n)) return 'crystal'; if(/布|紙|インク|包帯|呪符|旗|本|書|帽子|矢/.test(n)) return 'cloth';
  if(/鉱|鉄|鋼|銅|石|瓦礫|刃|剣|破片|鎖/.test(n)) return 'ore'; return 'curio'; }
const MAT = {};
ENEMY_AREAS.forEach(([place,lv,list])=>list.forEach(e=>{ const raw=e[5]; if(!raw||raw==='―'||MAT_ITEM[raw]) return; const n=MAT_ALIAS[raw]||raw;
  const g= lv<=15?1: lv<=30?2: lv<=45?3: lv<=60?4:5; if(!MAT[n]||MAT[n].g>g) MAT[n]={cat:matCatGuess(n), g}; }));
// ボスの素材（ボスごとに1つ）。迷宮の番人は「記憶の核」
const BOSS_MAT = ['大鎧の鉄板','大土竜の爪','黒将の鎧片','大蛇の毒牙','亡霊騎士の魂','深海の真珠','守護者の核','黒将の角','氷竜の鱗','聖騎士団の紋章','大王の牙','白翼の羽','虚の結晶',null];
BOSS_MAT.forEach((n,i)=>{ if(n) MAT[n]={cat:'boss', g:Math.min(5,1+Math.floor(i/3)), boss:i}; });
MAT['記憶の核']={cat:'boss', g:5, core:1};
MAT['初代の聖印']={cat:'boss', g:5};
function matOfEnemy(raw){ if(!raw||raw==='―') return null; if(MAT_ITEM[raw]) return {item:MAT_ITEM[raw]}; const n=MAT_ALIAS[raw]||raw; return MAT[n]?{mat:n}:null; }

// ===== 道具 =====
const ITEMS = {
  herb:  {n:'薬草', d:'HPを30%回復', price:10, ch:0},
  herb2: {n:'上薬草', d:'HPを60%回復', price:80, ch:2},
  herb3: {n:'特薬草', d:'HPを全回復', price:400, ch:4},
  feather:{n:'蘇生の羽', d:'戦闘不能から復活（75%）', price:180, ch:1},
  rope:  {n:'抜け道の糸', d:'ダンジョンの外まで、すぐに戻れる（町や戦闘中は使えない）。たまに魔物が落とす', price:0, ch:0, noShop:1},
  holy:  {n:'聖水', d:'しばらく敵に出会いにくい', price:40, ch:1},
  book1: {n:'万能の書・初', d:'どの種類のスキルにも使える。スキルを★1から★2にする', price:0, ch:0, noShop:1, bk:'W', t:1},
  book2: {n:'万能の書・中', d:'どの種類のスキルにも使える。スキルを★2から★3にする。ボスや宝箱から', price:0, ch:0, noShop:1, bk:'W', t:2},
  book3: {n:'万能の書・上', d:'どの種類のスキルにも使える。スキルを★3から★4にする。強いボスや宝箱から', price:0, ch:0, noShop:1, bk:'W', t:3},
  book4: {n:'万能の書・極', d:'どの種類のスキルにも使える。スキルを★4から★5にする。迷宮の番人や裏ボスから', price:0, ch:0, noShop:1, bk:'W', t:4},
  bN1: {n:'型の書・初', d:'通常攻撃のスキルを★1から★2にする', price:250, ch:1, bk:'N', t:1},
  bN2: {n:'型の書・中', d:'通常攻撃のスキルを★2から★3にする。ボスや宝箱から', price:0, ch:0, noShop:1, bk:'N', t:2},
  bN3: {n:'型の書・上', d:'通常攻撃のスキルを★3から★4にする。強いボスや宝箱から', price:0, ch:0, noShop:1, bk:'N', t:3},
  bN4: {n:'型の書・極', d:'通常攻撃のスキルを★4から★5にする。迷宮の番人や裏ボスから', price:0, ch:0, noShop:1, bk:'N', t:4},
  bP1: {n:'心得の書・初', d:'パッシブのスキルを★1から★2にする', price:400, ch:1, bk:'P', t:1},
  bP2: {n:'心得の書・中', d:'パッシブのスキルを★2から★3にする。ボスや宝箱から', price:0, ch:0, noShop:1, bk:'P', t:2},
  bP3: {n:'心得の書・上', d:'パッシブのスキルを★3から★4にする。強いボスや宝箱から', price:0, ch:0, noShop:1, bk:'P', t:3},
  bP4: {n:'心得の書・極', d:'パッシブのスキルを★4から★5にする。迷宮の番人や裏ボスから', price:0, ch:0, noShop:1, bk:'P', t:4},
  bA1: {n:'奥義の書・初', d:'アクティブのスキルを★1から★2にする', price:700, ch:2, bk:'A', t:1},
  bA2: {n:'奥義の書・中', d:'アクティブのスキルを★2から★3にする。ボスや宝箱から', price:0, ch:0, noShop:1, bk:'A', t:2},
  bA3: {n:'奥義の書・上', d:'アクティブのスキルを★3から★4にする。強いボスや宝箱から', price:0, ch:0, noShop:1, bk:'A', t:3},
  bA4: {n:'奥義の書・極', d:'アクティブのスキルを★4から★5にする。迷宮の番人や裏ボスから', price:0, ch:0, noShop:1, bk:'A', t:4},
};

// ===== 場所 =====
// type: town/city/village/dungeon ; area: ENEMY_AREAS の番号 ; boss: BOSS_LIST の番号
const LOCS = {
  sora:   {n:'ソラの村', type:'village', npc:10, area:0, x:.30, y:.20, theme:'village'},
  mtpath: {n:'北の山道', type:'dungeon', floors:2, area:0, goal:1, x:.27, y:.10, theme:'mountain'},
  castle: {n:'魔王城', type:'dungeon', floors:3, area:1, boss:0, x:.36, y:.05, theme:'castle'},
  halt:   {n:'宿場町ハルト', type:'village', npc:8, area:2, x:.29, y:.31, theme:'village'},
  lumiere:{n:'王都ルミエール', type:'city', npc:28, area:2, x:.40, y:.42, theme:'city', smith:1},
  forest: {n:'街道の森', type:'dungeon', floors:2, area:2, goal:1, x:.26, y:.50, theme:'forest'},
  gram:   {n:'鉱山町グラム', type:'town', npc:14, area:2, x:.15, y:.56, theme:'town'},
  mine:   {n:'グラム坑道', type:'dungeon', floors:3, area:3, boss:1, x:.07, y:.64, theme:'cave'},
  burnt:  {n:'焼かれた村の跡', type:'dungeon', floors:2, area:4, goal:1, x:.20, y:.68, theme:'burnt'},
  fort1:  {n:'黒将の砦', type:'dungeon', floors:4, area:5, boss:2, x:.10, y:.79, theme:'fort'},
  azur:   {n:'港町アズール', type:'town', npc:14, area:6, x:.58, y:.47, theme:'port'},
  ruth:   {n:'灯台の村ルース', type:'village', npc:8, area:6, x:.68, y:.39, theme:'village'},
  marsh:  {n:'霧の湿原', type:'dungeon', floors:3, area:7, x:.75, y:.47, theme:'marsh', goal:1},
  lhcave: {n:'灯台の洞窟', type:'dungeon', floors:3, area:8, boss:3, x:.82, y:.36, theme:'cave'},
  garam:  {n:'傭兵の町ガラム', type:'town', npc:14, area:9, x:.83, y:.58, theme:'town'},
  battlefield:{n:'古戦場', type:'dungeon', floors:4, area:9, boss:4, x:.91, y:.68, theme:'ruinfield'},
  wreck:  {n:'沈没船', type:'dungeon', floors:3, area:10, boss:5, x:.72, y:.71, theme:'ship'},
  belka:  {n:'学術都市ベルカ', type:'city', npc:25, area:12, x:.52, y:.64, theme:'city', smith:1},
  archive:{n:'古文書館の地下書庫', type:'dungeon', floors:3, area:11, x:.55, y:.73, theme:'library', goal:1},
  dura:   {n:'荒野の宿場ドゥラ', type:'village', npc:8, area:12, x:.41, y:.77, theme:'desert'},
  saha:   {n:'オアシスの村サハ', type:'village', npc:8, area:12, x:.30, y:.87, theme:'desert'},
  ruins:  {n:'砂の遺跡', type:'dungeon', floors:4, area:13, boss:6, x:.19, y:.94, theme:'sandruin'},
  fort2:  {n:'黒将の新しい砦', type:'dungeon', floors:4, area:14, boss:7, x:.44, y:.92, theme:'fort'},
  hutte:  {n:'雪の村ヒュッテ', type:'village', npc:8, area:15, x:.60, y:.14, theme:'snow'},
  canyon: {n:'凍てつく峡谷', type:'dungeon', floors:4, area:15, boss:8, x:.71, y:.08, theme:'ice'},
  sancta: {n:'大聖堂の町サンクタ', type:'town', npc:14, area:15, x:.84, y:.15, theme:'holy', smith:1},
  undercat:{n:'大聖堂の地下', type:'dungeon', floors:3, area:16, x:.93, y:.09, theme:'crypt', goal:1},
  temple: {n:'器の神殿', type:'dungeon', floors:4, area:17, x:.92, y:.26, theme:'temple', goal:1},
  shadow: {n:'影の里', type:'village', npc:10, area:17, x:.79, y:.28, theme:'shadow'},
  refuge: {n:'避難所の村', type:'village', npc:10, area:18, x:.50, y:.30, theme:'village'},
  sewer:  {n:'王都地下水路', type:'dungeon', floors:4, area:19, boss:10, x:.33, y:.45, theme:'sewer'},
  tower:  {n:'セイルの塔', type:'dungeon', floors:5, area:20, boss:11, x:.45, y:.38, theme:'tower'},
  hate:   {n:'最果ての村ハテ', type:'village', npc:6, area:18, x:.08, y:.32, theme:'snow'},
  abyss:  {n:'虚の淵', type:'dungeon', floors:5, area:21, boss:12, x:.06, y:.15, theme:'abyss'},
  nest:   {n:'光る敵の巣', type:'dungeon', floors:3, area:13, x:.47, y:.86, theme:'desert', opt:1},
  maze:   {n:'記憶の迷宮', type:'dungeon', floors:4, area:21, boss:12, x:.55, y:.06, theme:'memory', post:1},
  tomb:   {n:'初代勇者の墓所', type:'dungeon', floors:2, area:21, boss:12, x:.64, y:.92, theme:'crypt', post:1},
};
// 場所の目安レベル（ENEMY_AREAS の Lv）
function locLv(id){ const L=LOCS[id]; return ENEMY_AREAS[L.area][1]; }

const THEMES = {
  village:{floor:'#5aa04a',floor2:'#4f9142',wall:'#2f5d2a',path:'#c9a66b',sky:['#1f3b73','#4a7bc8']},
  city:{floor:'#8f8a80',floor2:'#857f75',wall:'#4b4741',path:'#b9b2a4',sky:['#29304f','#59668f']},
  town:{floor:'#6f9b4f',floor2:'#658f47',wall:'#3a5530',path:'#bfa57c',sky:['#2a3d6e','#5b80c4']},
  port:{floor:'#c9b98e',floor2:'#bfae82',wall:'#2a6fa8',path:'#e3d5ad',sky:['#1d4f7a','#5fa6d6']},
  desert:{floor:'#d8b26a',floor2:'#cfa75e',wall:'#9a6b2f',path:'#e8cf96',sky:['#7a3f1d','#e2a35a']},
  snow:{floor:'#e2e8f0',floor2:'#d5dde8',wall:'#64748b',path:'#cbd5e1',sky:['#334155','#94a3b8']},
  holy:{floor:'#d6d3c8',floor2:'#cbc7ba',wall:'#8b8574',path:'#f1ede1',sky:['#3b3f6e','#a3a8d6']},
  shadow:{floor:'#3f3a52',floor2:'#37324a',wall:'#1d1a2b',path:'#5b5373',sky:['#120f1f','#3b3157']},
  mountain:{floor:'#7c8a5a',floor2:'#718050',wall:'#4a4a42',path:'#9a8f70',sky:['#2a3b5a','#6b84a8']},
  castle:{floor:'#4b4557',floor2:'#433d4f',wall:'#211d2b',path:'#5e566e',sky:['#1a1028','#4a2850']},
  forest:{floor:'#3f7a3a',floor2:'#376d33',wall:'#1f4520',path:'#6b8a4a',sky:['#173322','#3f6d4a']},
  cave:{floor:'#5c5146',floor2:'#54493f',wall:'#2b241e',path:'#6e6255',sky:['#1a1410','#3a2f26']},
  burnt:{floor:'#4a3b33',floor2:'#41332c',wall:'#1f1612',path:'#6b4a3a',sky:['#3a1410','#7a3020']},
  fort:{floor:'#57534e',floor2:'#4e4a45',wall:'#1c1917',path:'#6b6660',sky:['#1c1917','#44403c']},
  marsh:{floor:'#4f6b5a',floor2:'#476152',wall:'#2b3d33',path:'#6f8577',sky:['#2e3d38','#7c958a']},
  ruinfield:{floor:'#6b6656',floor2:'#625d4e',wall:'#3a372e',path:'#827c69',sky:['#2b2a35','#5c5a6e']},
  ship:{floor:'#5b4632',floor2:'#523f2d',wall:'#2b2016',path:'#6e5640',sky:['#0b2a3d','#1f5a7a']},
  library:{floor:'#6b4f3a',floor2:'#624834',wall:'#3a2a1e',path:'#8a6a50',sky:['#2a1d14','#5a4030']},
  sandruin:{floor:'#c49a5a',floor2:'#b98f50',wall:'#7a5a2e',path:'#d6b47a',sky:['#5a3010','#c07a3a']},
  ice:{floor:'#b9d3e6',floor2:'#aecbe0',wall:'#3f6b8a',path:'#d6e6f2',sky:['#1e3a5f','#7fb0d6']},
  crypt:{floor:'#5a5560',floor2:'#524d58',wall:'#26232b',path:'#706a78',sky:['#16141c','#3a3446']},
  temple:{floor:'#cfc8b6',floor2:'#c4bdaa',wall:'#6e6656',path:'#e6dfcc',sky:['#2b2a45','#8a86b8']},
  sewer:{floor:'#4a5547',floor2:'#434d40',wall:'#232a21',path:'#5f6b5b',sky:['#151a14','#323d30']},
  tower:{floor:'#e5e0d4',floor2:'#dad4c6',wall:'#a39a84',path:'#f3efe6',sky:['#3a3570','#c9c3f0']},
  abyss:{floor:'#2a1f3d',floor2:'#241a35',wall:'#0b0714',path:'#3b2d55',sky:['#05020a','#2a1240']},
  memory:{floor:'#3b4a6b',floor2:'#34425f',wall:'#151c2e',path:'#56688f',sky:['#0b1020','#2c3f6e']},
};

// 章の名前
const CHAPTERS = ['序章　魔王は昨日死んだ','1章　黒将ザガン','2章　疑惑の剣士','3章　帰ってきた男','4章　器','5章　命の巫女','最終章　終わらない命','クリア後'];
