export const abilityStats = [
  { key:'maxHp', label:'最大体力', short:'体力', tint:'health' },
  { key:'maxMp', label:'最大気力', short:'気力', tint:'spirit' },
  { key:'attack', label:'物理攻撃', tint:'physical' },
  { key:'magicAttack', label:'魔法攻撃', tint:'magic' },
  { key:'defense', label:'物理防御', tint:'physical' },
  { key:'magicDefense', label:'魔法防御', tint:'magic' },
  { key:'speed', label:'素早さ', tint:'speed' },
  { key:'accuracy', label:'命中', percent:true, tint:'speed' },
  { key:'evasion', label:'回避', percent:true, tint:'speed' },
  { key:'crit', label:'会心', percent:true, tint:'physical' }
];

const roles = {
  keeper:{label:'剣と術の両立',base:[94,22,22,21,9,9,12,97,6,7],growth:[20,4,4,4,3,3,1,.45,.30,.30],moves:['frostline','rest','divide','ward','counter']},
  breaker:{label:'盾を崩す前衛',base:[104,18,26,14,9,7,10,94,5,9],growth:[22,3,4.8,2.6,3,2.5,.9,.55,.24,.42],moves:['cut','smash','double','fury','counter']},
  guard:{label:'物理に強い盾役',base:[111,18,20,16,14,9,8,96,4,4],growth:[23,3.35,3.7,3,3.8,3,.72,.48,.22,.24],moves:['brace','sweep','shield','oath','counter']},
  mage:{label:'属性を操る術師',base:[79,27,15,29,6,11,11,96,7,5],growth:[17,5.4,3,5.6,2.6,3.55,.85,.48,.32,.29],moves:['bolt','circle','veil','snare','cascade']},
  mender:{label:'回復と解除',base:[84,28,16,25,7,13,10,97,6,4],growth:[18,5.2,3.15,4.7,2.65,3.65,.80,.54,.25,.23],moves:['mend','bolt','clean','renew','ward']},
  stalker:{label:'回避と連撃',base:[83,21,22,18,7,8,17,96,13,12],growth:[18,4,4.1,3.55,2.65,2.85,1.15,.57,.46,.48],moves:['double','toxin','snare','seam','sweep']},
  ranger:{label:'高命中の狙撃',base:[87,20,23,17,8,9,15,99,9,10],growth:[19,3.75,4.25,3.15,2.85,3,1.0,.62,.36,.41],moves:['snipe','sweep','divide','smash','volley']},
  tactician:{label:'弱体と援護',base:[91,24,19,24,8,11,13,97,8,6],growth:[19,4.5,3.7,4.3,2.85,3.4,.95,.48,.30,.30],moves:['bolt','blunt','haste','ward','renew']},
  duelist:{label:'速攻と会心',base:[92,19,25,16,9,8,15,97,10,10],growth:[20,3.6,4.5,3,3.1,2.75,1.1,.52,.34,.45],moves:['cut','feint','double','fury','volley']},
  channeler:{label:'気力と魔法防御',base:[87,27,17,27,7,15,10,98,5,4],growth:[18,5.15,3.3,5.15,2.75,4.0,.8,.50,.26,.24],moves:['bolt','veil','spring','cascade','clean']}
};

const techniques = {
  cut:{name:'切り払い',power:1.32,cost:3},
  frostline:{id:'sunder',name:'薄氷の刻み',channel:'magic',power:1.48,cost:4},
  rest:{id:'mend',name:'凪の息継ぎ',channel:'magic',effect:'heal',target:'self',power:1.5,cost:5},
  divide:{name:'裂け目狙い',power:1.10,effect:'shatter',magnitude:1,cost:6},
  ward:{name:'風除けの陣',channel:'magic',effect:'ward',target:'allies',duration:2,magnitude:.25,cost:8},
  counter:{name:'構え直し',effect:'guard',target:'self',magnitude:.58,cost:4},
  smash:{name:'楔打ち',effect:'shatter',power:1.07,magnitude:2,cost:7},
  double:{name:'折り返し',power:.78,hits:2,cost:4},
  fury:{name:'勝ち気を起こす',effect:'strengthen',target:'self',magnitude:.36,duration:2,cost:6},
  brace:{name:'背を預ける',effect:'guard',target:'ally',magnitude:.53,cost:4},
  sweep:{name:'周囲払い',target:'all',power:.91,cost:6},
  shield:{name:'盾留め',effect:'shatter',power:.84,magnitude:2,cost:5},
  oath:{name:'援護の構え',effect:'guard',target:'allies',magnitude:.44,cost:9},
  bolt:{name:'呼び水の術',channel:'magic',power:1.48,cost:4},
  circle:{name:'広がる輪',channel:'magic',power:1.11,target:'all',cost:8},
  veil:{name:'潮よけ',channel:'magic',effect:'ward',target:'ally',magnitude:.31,duration:2,cost:5},
  snare:{name:'足止め',channel:'magic',effect:'slow',power:.90,magnitude:.29,duration:2,cost:5},
  cascade:{name:'術脈の連鎖',channel:'magic',power:.89,hits:3,cost:11},
  mend:{name:'手当て',channel:'magic',effect:'heal',target:'ally',power:1.74,cost:4},
  clean:{name:'澄み直し',channel:'magic',effect:'cleanse',target:'ally',cost:5},
  renew:{name:'潮帰り',channel:'magic',effect:'heal',target:'allies',power:1.05,cost:10},
  toxin:{name:'濁りを仕込む',effect:'poison',power:.83,magnitude:.07,duration:3,cost:5},
  seam:{name:'継ぎ目を抜く',effect:'shatter',power:.95,magnitude:2,cost:7},
  snipe:{name:'遠的',power:1.55,cost:4},
  volley:{name:'追い風の連撃',power:.68,hits:3,cost:8},
  blunt:{name:'力をそらす',channel:'magic',effect:'weaken',power:.9,magnitude:.28,duration:2,cost:4},
  haste:{name:'声をそろえる',effect:'strengthen',target:'ally',magnitude:.28,duration:3,cost:6},
  feint:{name:'間を抜く',effect:'slow',power:.98,magnitude:.22,duration:2,cost:4},
  spring:{name:'泉の息',channel:'magic',effect:'restore',target:'ally',power:16,cost:5}
};

const signatures = {
  strike:{power:2.15,cost:10}, frost:{channel:'magic',power:1.72,effect:'shatter',magnitude:1,cost:9},
  break:{power:1.38,effect:'shatter',magnitude:3,cost:9},
  wave:{channel:'magic',power:1.48,target:'all',cost:11},
  flurry:{power:.79,hits:3,cost:9}, volley:{power:.66,hits:2,target:'all',cost:10},
  mend:{channel:'magic',effect:'heal',target:'allies',power:1.33,cost:10},
  remedy:{channel:'magic',effect:'cleanse',target:'allies',cost:8},
  shelter:{effect:'guard',target:'allies',magnitude:.55,cost:8},
  aegis:{channel:'magic',effect:'ward',target:'allies',magnitude:.37,duration:3,cost:9},
  might:{effect:'strengthen',target:'allies',magnitude:.30,duration:2,cost:9},
  hush:{channel:'magic',power:1.04,target:'all',effect:'weaken',magnitude:.34,duration:2,cost:10},
  toxin:{power:.98,target:'all',effect:'poison',magnitude:.079,duration:3,cost:9},
  check:{power:1.19,effect:'stun',duration:1,cost:10},
  drift:{channel:'magic',power:1.21,effect:'slow',target:'all',magnitude:.34,duration:2,cost:10},
  drain:{channel:'magic',power:1.93,effect:'drain',magnitude:.58,cost:9},
  well:{channel:'magic',effect:'restore',target:'allies',power:17,cost:9}
};

// Each entry has its own signature, alternate technique, and a small individual strength.
const profiles = {
  84:['keeper','氷点を渡る刃','frost','cut','magicDefense'],
  35:['guard','雪解けの背','shelter','divide','maxHp'],
  70:['mender','火の消えない窯','mend','brace','magicDefense'],
  80:['duelist','風帆を留める槍','check','snipe','accuracy'],
  75:['tactician','土積みの帳尻','might','seam','defense'],
  77:['channeler','音のない貝笛','well','mend','maxMp'],
  28:['mender','灯を送る葬列','aegis','blunt','magicDefense'],
  49:['stalker','返し波の舷斬り','volley','snipe','speed'],
  78:['channeler','署名を照らす光','hush','circle','magicAttack'],
  87:['mage','窓辺の初雪','drift','veil','evasion'],
  98:['stalker','夜便の三つ折り','flurry','divide','crit'],
  104:['mender','白息の輪郭','remedy','rest','magicAttack'],
  117:['tactician','その先へ運ぶ風','might','spring','speed'],
  123:['duelist','残り火の抜き打ち','strike','fury','attack'],
  9:['breaker','塩堤をひらく槍','break','snipe','attack'],
  17:['ranger','逆さ水路の矢','flurry','snare','accuracy'],
  26:['mender','釜鳴りの手当て','mend','veil','maxMp'],
  38:['guard','三人目の肩','shelter','fury','defense'],
  47:['duelist','張り綱の一閃','check','brace','evasion'],
  55:['stalker','風に透く漉き紙','drift','circle','speed'],
  62:['tactician','錘を返す網','drift','shield','defense'],
  74:['breaker','荷渡しの足固め','break','brace','maxHp'],
  8:['channeler','葦越しの測り棒','hush','snare','magicDefense'],
  24:['mender','葦舟の薬灯','mend','spring','magicAttack'],
  31:['ranger','駆け杭の合図','volley','haste','speed'],
  33:['guard','水際の葦垣','shelter','brace','defense'],
  39:['stalker','飛び杭の影越え','check','toxin','evasion'],
  44:['ranger','鳥の止まない羽音','volley','feint','accuracy'],
  54:['mage','宙を割る継ぎ線','wave','blunt','magicAttack'],
  85:['ranger','音より先の矢','strike','double','crit'],
  3:['mage','白壁に残る灯','frost','clean','magicAttack'],
  5:['breaker','吊り鋼を起こす火','break','circle','attack'],
  19:['tactician','影の傾き直し','hush','snare','magicDefense'],
  30:['breaker','石灰を掘り分ける','strike','shield','maxHp'],
  63:['duelist','横穴を抜ける風','flurry','snipe','speed'],
  66:['tactician','光で塗る道しるべ','aegis','mend','accuracy'],
  71:['guard','鉱札の返し盾','shelter','divide','magicDefense'],
  94:['tactician','試し鐘の二度鳴り','check','circle','accuracy'],
  6:['guard','氷棚の白い砦','shelter','veil','defense'],
  41:['mage','氷窓の二重結び','frost','spring','magicAttack'],
  48:['channeler','雪明かりの貸し火','well','renew','maxMp'],
  51:['breaker','棚氷の筋断ち','break','toxin','attack'],
  68:['guard','粥鍋の重し','aegis','spring','maxHp'],
  76:['mender','雪檻をほどく灯','remedy','rest','magicDefense'],
  82:['channeler','融雪の底を読む','hush','clean','magicAttack'],
  92:['mage','霜字を散らす術','wave','mend','maxMp'],
  4:['duelist','灰坂の三歩','flurry','counter','speed'],
  20:['breaker','灼枝の道を割る','strike','fury','crit'],
  32:['mage','火間の置き文','toxin','veil','magicAttack'],
  36:['duelist','弔火をとどめる手','check','blunt','attack'],
  42:['guard','熾火の煉瓦壁','shelter','rest','maxHp'],
  56:['breaker','雷の通い鉄','break','feint','accuracy'],
  81:['stalker','避雷針の足運び','check','snipe','evasion'],
  122:['breaker','帰炉の薪割り','volley','shield','maxHp'],
  10:['duelist','境に残る剣影','strike','toxin','crit'],
  12:['channeler','濃藍の堰止め','aegis','snare','maxMp'],
  25:['stalker','霜裂きの側道','toxin','veil','crit'],
  43:['duelist','借り刃を返す間','drain','double','attack'],
  53:['tactician','余白を繋ぐ刃','might','cut','speed'],
  88:['guard','稲光を受ける扉','shelter','blunt','defense'],
  93:['mage','吊り布を染める夜','drain','clean','magicAttack'],
  107:['channeler','裏に響く低音','hush','mend','magicDefense'],
  11:['mender','席へ返す灯火','mend','spring','maxMp'],
  21:['keeper','帆に差す道明かり','might','snipe','accuracy'],
  50:['ranger','沖の三つの指標','volley','haste','speed'],
  57:['mender','窓を拭う手のひら','remedy','blunt','magicDefense'],
  65:['guard','岸棚の大盾','shelter','smash','defense'],
  105:['channeler','足音を運ぶ燈','well','haste','maxMp'],
  110:['breaker','船留めの綱断ち','break','veil','attack'],
  120:['guard','凪の盾継ぎ','aegis','mend','magicDefense']
};

const fallback = ['keeper','遠潮の構え','strike','cut','attack'];
const getProfile = id => profiles[id] ?? fallback;

// These techniques have a different tactical scope or tradeoff even when their base affinity matches.
const signatureVariants = {
  41:{hits:2,power:.92,cost:10},
  6:{channel:'magic',effect:'ward',target:'allies',magnitude:.32,duration:3,cost:10},
  26:{target:'ally',power:2.15,cost:6,learn:3},
  39:{target:'all',power:.60,cost:12,learn:5},
  105:{power:20,cost:11},
  63:{target:'all',hits:2,power:.62,cost:12},
  53:{target:'ally',magnitude:.55,duration:3,cost:8},
  20:{target:'all',power:1.52,cost:11},
  74:{hits:2,power:.66,magnitude:2,cost:9},
  38:{target:'ally',magnitude:.81,cost:6,learn:3},
  71:{channel:'magic',effect:'ward',target:'allies',magnitude:.34,duration:3,cost:9},
  42:{target:'self',magnitude:.84,cost:5},
  65:{magnitude:.66,cost:12,learn:5},
  94:{channel:'magic',hits:2,power:.64,cost:11},
  81:{effect:'shatter',hits:2,power:.68,magnitude:1,cost:8},
  11:{target:'self',power:2.6,cost:5,learn:3},
  44:{target:'one',hits:3,power:.77,cost:9},
  50:{hits:3,power:.54,cost:13,learn:5},
  107:{target:'one',magnitude:.61,duration:3,power:.84,cost:8},
  120:{magnitude:.46,duration:2,cost:9},
  57:{target:'ally',cost:3,learn:3},
  93:{target:'all',power:1.17,magnitude:.30,cost:11}
};

// Four later lessons keep the opening kit intact and teach different jobs at each milestone.
const veteranRoles = {
  keeper:{levels:[11,16,22,28],
    advance:{name:'氷刃の引き波',channel:'magic',target:'all',power:1.23,cost:12},
    mastery:{name:'静海の星断ち',channel:'magic',power:2.56,bonusVsBreak:.34,cost:26}},
  breaker:{levels:[12,16,21,28],
    advance:{name:'重ね楔',effect:'shatter',power:1.51,magnitude:3,cost:11},
    mastery:{name:'岩根返し',target:'all',power:1.34,effect:'shatter',magnitude:3,cost:25}},
  guard:{levels:[11,17,23,29],
    advance:{name:'巡りの盾',effect:'guard',target:'allies',magnitude:.59,cost:11},
    mastery:{name:'重ねの防壁',channel:'magic',effect:'ward',target:'allies',magnitude:.55,duration:3,cost:24}},
  mage:{levels:[12,17,22,30],
    advance:{name:'反響の術',channel:'magic',power:1.09,hits:2,cost:8},
    mastery:{name:'星潮の大輪',channel:'magic',target:'all',power:1.86,bonusVsBreak:.19,cost:31}},
  mender:{levels:[11,16,21,28],
    advance:{name:'灯の手当て',channel:'magic',effect:'heal',power:2.05,target:'ally',cleanses:true,cost:11},
    mastery:{name:'明け方の灯',channel:'magic',effect:'heal',target:'allies',power:1.75,cleanses:true,cost:28}},
  stalker:{levels:[12,18,23,29],
    advance:{name:'影を三つ置く',power:.83,hits:3,effect:'slow',magnitude:.27,duration:2,cost:12},
    mastery:{name:'残影の四刻',power:.99,hits:4,bonusVsBreak:.24,cost:28}},
  ranger:{levels:[11,17,22,29],
    advance:{name:'鷹の返し矢',power:1.06,hits:2,cost:10},
    mastery:{name:'時雨の四筋',target:'all',power:.88,hits:3,cost:30}},
  tactician:{levels:[12,17,23,30],
    advance:{name:'間合いを崩す',channel:'magic',effect:'weaken',target:'all',power:.89,magnitude:.29,duration:3,cost:11},
    mastery:{name:'攻め時の号令',effect:'strengthen',target:'allies',magnitude:.49,duration:3,cost:25}},
  duelist:{levels:[11,16,22,29],
    advance:{name:'片帆の打ち返し',power:1.84,bonusVsBreak:.25,cost:12},
    mastery:{name:'一拍の絶閃',power:2.73,bonusVsBreak:.29,cost:26}},
  channeler:{levels:[12,18,24,31],
    advance:{name:'透かし潮',channel:'magic',effect:'ward',target:'allies',magnitude:.41,duration:3,cost:12},
    mastery:{name:'満ち引きの法',channel:'magic',target:'all',power:1.58,effect:'slow',magnitude:.42,duration:3,cost:28}}
};

const veteranSignatures = {
  strike:{name:'一線の追撃',power:2.18,bonusVsBreak:.28,cost:15},
  frost:{name:'晶脈を割る術',channel:'magic',power:1.83,effect:'shatter',magnitude:2,cost:14},
  break:{name:'間を裂く一打',power:1.54,effect:'shatter',magnitude:4,cost:14},
  wave:{name:'重なる潮紋',channel:'magic',power:1.48,hits:1,target:'all',bonusVsBreak:.24,cost:16},
  flurry:{name:'風切る四連',power:.71,hits:4,cost:16},
  volley:{name:'逆巻く飛沫',power:.83,hits:2,target:'all',cost:16},
  mend:{name:'静かな潮の手当て',channel:'magic',effect:'heal',target:'allies',power:1.52,cost:14},
  remedy:{name:'立て直しの灯',channel:'magic',effect:'revive',target:'ally',power:1.55,cleanses:true,cost:17},
  shelter:{name:'力を流す構え',effect:'guard',target:'allies',magnitude:.62,cost:16},
  aegis:{name:'上げ潮の守り',channel:'magic',effect:'ward',target:'allies',magnitude:.42,duration:3,cost:15},
  might:{name:'波頭の号令',effect:'strengthen',target:'allies',magnitude:.39,duration:3,cost:15},
  hush:{name:'深みの静けさ',channel:'magic',effect:'weaken',target:'all',power:1.22,magnitude:.42,duration:3,cost:17},
  toxin:{name:'澱みの波',power:1.12,target:'all',effect:'poison',magnitude:.095,duration:3,cost:16},
  check:{name:'逆足の止め',power:1.65,effect:'stun',duration:1,cost:17},
  drift:{name:'遅潮の円',channel:'magic',power:1.38,effect:'slow',target:'all',magnitude:.42,duration:3,cost:16},
  drain:{name:'余波を吸う術',channel:'magic',power:2.04,effect:'drain',magnitude:.55,cost:16},
  well:{name:'清めの水明かり',channel:'magic',effect:'heal',target:'allies',power:.91,cleanses:true,cost:15}
};

const veteranTalents = {
  maxHp:{name:'足場を守る',target:'ally',effect:'guard',magnitude:.78,cost:18},
  maxMp:{name:'気付けの灯',channel:'magic',effect:'revive',target:'ally',power:1.96,cost:19},
  attack:{name:'打ち波の劫風',power:2.30,bonusVsBreak:.32,cost:20},
  magicAttack:{name:'返る烈光',channel:'magic',power:2.47,effect:'shatter',magnitude:1,cost:22},
  defense:{name:'抱え盾',target:'allies',effect:'guard',magnitude:.66,cost:20},
  magicDefense:{name:'澄んだ輪',channel:'magic',effect:'heal',target:'allies',power:1.18,cleanses:true,cost:20},
  speed:{name:'走り火の渡り',power:1.16,target:'all',effect:'slow',magnitude:.46,duration:3,cost:19},
  accuracy:{name:'向かい風を縫う',power:1.03,hits:3,cost:20},
  evasion:{name:'背波を抜ける',power:1.53,effect:'weaken',magnitude:.52,duration:3,cost:19},
  crit:{name:'間を貫く追い波',power:1.26,hits:2,bonusVsBreak:.42,cost:20}
};

export function combatRole(id, kit) {
  return kit?.label ?? roles[getProfile(id)[0]].label;
}

export function statLine(id,level,equipment=[],refine=0,kit) {
  const [legacyRole, , , ,legacyStrength]=getProfile(id);
  const key=kit?.role??legacyRole;
  const strong=kit?.strength??legacyStrength;
  const {base,growth}=roles[key];
  return Object.fromEntries(abilityStats.map(({key:stat,percent},index)=>{
    let value=base[index]+growth[index]*(level-1);
    if(stat===strong) value+=percent?3:stat==='maxHp'?8:3;
    if(kit?.strength===stat) value+=growth[index]*Math.max(0,level-1)*.08;
    const gearStat=stat==='maxHp'?'hp':stat==='maxMp'?'mp':stat;
    value+=equipment.reduce((sum,item)=>sum+(item[gearStat]??0),0);
    if(stat==='attack') value+=refine*3;
    if(stat==='magicAttack') value+=refine*2;
    if(stat==='accuracy') value=Math.min(100,value);
    if(stat==='evasion') value=Math.min(38,value);
    if(stat==='crit') value=Math.min(45,value);
    return [stat,Math.round(value)];
  }));
}

export function statCeiling(key,level) {
  const index=abilityStats.findIndex(v=>v.key===key);
  const basis=Math.max(...Object.values(roles).map(role=>role.base[index]+role.growth[index]*(level-1)));
  if(key==='accuracy') return 100;
  if(key==='evasion'||key==='crit') return 38;
  return Math.ceil(basis*1.16);
}

export const effectNames = {
  heal:'回復',restore:'気力回復',guard:'被害軽減',ward:'防御↑',strengthen:'攻撃↑',
  weaken:'攻撃↓',poison:'毒',slow:'素早さ↓',stun:'気絶',shatter:'盾削り',cleanse:'状態異常解除',drain:'体力吸収',revive:'蘇生'
};

export function learnedTechniques(person,weapon) {
  const kit=person.adventureKit;
  const [legacyRole,signatureName,signatureStyle,legacyAlternate,legacyTalent]=getProfile(person.id);
  const role=kit?.role??legacyRole;
  const alternate=kit?.alternate??legacyAlternate;
  const talent=kit?.strength??legacyTalent;
  const [opening,second,third,fourth,fifth]=roles[role].moves;
  const keys=[opening,second,alternate,third,fourth,fifth];
  const levels=[1,1,2,3,6,9];
  const known=new Set();
  const build=(id,source,learn,signature=false)=>{
    const channel=source.channel??'physical';
    return {
      id,name:source.name,learn,signature,weapon,channel,
      attribute:source.attribute??(channel==='magic'||signature?person.attribute:weapon),
      power:source.power??1,hits:source.hits??1,cost:source.cost??0,target:source.target??'one',
      effect:source.effect,magnitude:source.magnitude,duration:source.duration,
      bonusVsBreak:source.bonusVsBreak,cleanses:source.cleanses,
      note:source.note??(source.cleanses?'回復時に弱体を解除':source.bonusVsBreak?`ブレイク時 威力＋${Math.round(source.bonusVsBreak*100)}％`:effectNames[source.effect]??(channel==='magic'?'属性で攻撃':'武器で攻撃'))
    };
  };
  const repertoire=[];
  for(const [index,key] of keys.entries()) {
    if(known.has(key)) continue;
    known.add(key);
    const source=techniques[key];
    repertoire.push(build(person.id===84&&source.id?source.id:'tech-'+key,source,levels[index]));
  }
  const variant=signatureVariants[person.id];
  if(kit?.signature) {
    const {signature}=kit;
    repertoire.push(build('sig-'+person.id,signature,signature.learn??4,true));
  } else {
    repertoire.push(build('sig-'+person.id,{...signatures[signatureStyle],...variant,name:signatureName},variant?.learn??4,true));
  }
  const veteran=veteranRoles[role];
  repertoire.push(
    build('veteran-'+role,veteran.advance,veteran.levels[0]),
    build('veteran-style-'+signatureStyle,veteranSignatures[signatureStyle],veteran.levels[1]),
    build('veteran-talent-'+talent,veteranTalents[talent],veteran.levels[2]),
    build('mastery-'+role,veteran.mastery,veteran.levels[3])
  );
  if(kit){
    const later=kit.signature;
    repertoire.push(
      build('late-'+person.id,{...later,...kit.advanced},kit.advanced.learn),
      build('legend-'+person.id,{...later,...kit.mastery},kit.mastery.learn,true)
    );
  }
  return repertoire.sort((a,b)=>a.learn-b.learn);
}
