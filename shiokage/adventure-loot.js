const rankColors = ['白','緑','青','紫','金','虹'];

const dropTables = {
  road: [
    [.28,[68,30,2,0,0,0]], [.30,[22,42,30,6,0,0]], [.34,[0,16,50,32,2,0]]
  ],
  deep: [
    [.44,[42,50,8,0,0,0]], [.48,[5,22,54,18,1,0]], [.56,[0,4,32,54,10,0]]
  ],
  post: [
    [.46,[0,0,10,54,35,1]], [.60,[0,0,3,36,57,4]], [.72,[0,0,0,23,68,9]]
  ]
};

const slots = ['武器','体','腕','頭','装飾'];
const regionWeights = {
  coast:[34,18,17,14,17], forest:[39,18,14,13,16],
  rock:[36,16,21,17,10], extreme:[31,23,15,14,17], post:[35,20,14,15,16]
};
const regionalTypes = {
  coast:new Set(['spear','bow','shield']), forest:new Set(['bow','dagger','cloak']),
  rock:new Set(['axe','sword','great','tower','helmet']), extreme:new Set(['staff','robe','glove']),
  post:new Set(['spear','bow','shield','amulet','great','staff'])
};
const budgets = [[1,3],[2,5],[4,8],[6,10],[8,12],[11,16]];
const statLabel={attack:'物理攻撃',magicAttack:'魔法攻撃',defense:'物理防御',magicDefense:'魔法防御',
  hp:'体力',mp:'気力',speed:'素早さ',accuracy:'命中',evasion:'回避',crit:'会心'};
const pools = {
  '武器':['attack','magicAttack','crit','accuracy'], '体':['hp','defense','magicDefense'],
  '腕':['speed','defense','accuracy','crit'], '頭':['hp','magicDefense','evasion','accuracy'],
  '装飾':['mp','hp','evasion','speed','magicAttack']
};

export const gearEffects = {
  pierce:{label:'最初の弱点攻撃で盾をもう一つ削る',slots:['武器','腕']},
  echo:{label:'守った次の斬撃が隣の敵にも当たる',slots:['武器']},
  return:{label:'最大ブーストで撃つと気力が戻る',slots:['武器','装飾']},
  shelter:{label:'最初の全体攻撃から味方をかばう',slots:['腕','体']},
  chill:{label:'初めて氷で攻撃した敵の素早さを下げる',slots:['武器','頭']},
  secondWind:{label:'戦闘で初めて追い詰められたとき体力を回復する',slots:['頭','体','装飾']}
};

const rollInt=(min,max,rng)=>min+Math.floor(rng()*(max-min+1));

function weighted(rows,weight,rng) {
  let ticket=rng()*rows.reduce((sum,row)=>sum+weight(row),0);
  for (const row of rows) {
    ticket-=weight(row);
    if(ticket<0) return row;
  }
  return rows.at(-1);
}

export function dropTable(level,inDepth,post) {
  if(post) return dropTables.post[level>=82?2:level>=74?1:0];
  return dropTables[inDepth?'deep':'road'][level>=33?2:level>=16?1:0];
}

function chooseRegion(region,post) {
  if(post) return 'post';
  if(['port','coast','marsh','mire','shore'].includes(region)) return 'coast';
  if(['grove','moor','forest','grass'].includes(region)) return 'forest';
  if(['frost','ember','ash','snow'].includes(region)) return 'extreme';
  return 'rock';
}

export function createEquipmentRolls({level,deep,boss,side,post,region,preferred=[],bases,rng=Math.random}) {
  const [dropChance,rankWeights]=dropTable(level,boss||deep,post);
  if(!boss&&rng()>=dropChance) return [];
  const count=boss&&side&&rng()<.35?2:1;
  const habitat=chooseRegion(region,post);
  const result=[];
  for(let i=0;i<count;i++) {
    const rarity=weighted(rankColors,rank=>rankWeights[rankColors.indexOf(rank)],rng);
    const rank=rankColors.indexOf(rarity);
    const pool=bases.filter(base=>base.rarity===rarity);
    if(!pool.length) continue;
    const available=slots.filter(slot=>pool.some(base=>base.slot===slot));
    const slot=weighted(available,type=>regionWeights[habitat][slots.indexOf(type)],rng);
    const base=weighted(pool.filter(item=>item.slot===slot),item=>(regionalTypes[habitat].has(item.type)?3:1)*(preferred.includes(item.id)?2:1),rng);
    const rareChance=[0,0,0,.02,.08,.24][rank];
    const effects=Object.keys(gearEffects).filter(key=>gearEffects[key].slots.includes(slot));
    const effect=effects.length&&rng()<rareChance?effects[Math.floor(rng()*effects.length)]:null;
    let [min,max]=budgets[rank];
    const levelBonus=1+Math.floor(level/16);
    const budget=rollInt(min,max,rng)+levelBonus;
    const poolStats=pools[slot].filter(key=>slot!=='武器'||key!==(base.type==='staff'?'attack':'magicAttack'));
    const first=poolStats[Math.floor(rng()*poolStats.length)];
    const extra=poolStats.filter(key=>key!==first);
    const second=rank>0&&extra.length&&rng()<(.45+rank*.1)?extra[Math.floor(rng()*extra.length)]:null;
    const remaining=Math.max(1,budget-(effect?3:0));
    const split=second?Math.max(1,Math.floor(remaining*(.25+rng()*.28))):0;
    const points={};
    const apply=(stat,value)=>{if(stat) points[stat]=Math.max(1,Math.floor(value*(stat==='hp'?3:stat==='mp'?1.5:stat==='speed'||stat==='crit'||stat==='evasion'||stat==='accuracy'?.55:1)));};
    apply(first,remaining-split);apply(second,split);
    result.push({base:base.id,points,effect,level});
  }
  return result;
}

export function materializeRolledEquipment(id,record,base) {
  if(!/^drop_[a-z0-9]+$/.test(id)||!base||record.base!==base.id||!pools[base.slot]) return null;
  const extra=Object.fromEntries(Object.entries(record.points??{}).filter(([key,value])=>pools[base.slot].includes(key)&&Number.isFinite(value)&&value>0&&value<=80));
  const effect=gearEffects[record.effect]?.slots.includes(base.slot)?record.effect:null;
  const item={...base,id,base:base.id,level:Math.min(90,Math.max(1,Number(record.level)||1)),effect};
  for (const [key,value] of Object.entries(extra)) item[key]=(item[key]??0)+Math.trunc(value);
  const stats=Object.entries(extra).map(([key,value])=>statLabel[key]+' ＋'+value).join('　');
  item.effectLabel=[gearEffects[effect]?.label,stats].filter(Boolean).join('　');
  return item;
}
