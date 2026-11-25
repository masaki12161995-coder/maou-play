import { createAudio } from './audio.js';
import { MapView, personScale, assetUrl } from './map.js';
import { startBattle, attributeInfo } from './battle.js';
import { HERO, bank, fieldArts, people, toolDefs, materialDefs, prologue, story, maps, monsterDefs } from './content.js';
import { addCampaign, chapters, endings, errands, mainCast, chapterScene, undertowResolution, captureEnding, endingScene, endingAftermath, campScene, townReaction, publicEvidence, postResolution } from './campaign.js';
import { recruits } from './recruits.js';
import { dangers, dangerMonsters } from './dangers.js';
import { abilityStats, combatRole, statLine, statCeiling, learnedTechniques } from './characters.js';
import { installExpansion, voyages, personalEpisodes, campPairs } from './expansion.js';
import { installJourneys, journeys } from './journey.js';
import { companionJourneys, relationshipJourneys } from './companion-journeys.js';
import { installInquiries, inquiries } from './inquiries.js';
import { trialEnemies, trials } from './trials.js';
import { installAdventureWorld, adventureGateOpen, adventureBosses } from './adventure-world.js';
import { adventureOpening, adventureChapters, adventureChapterCode, newAdventure, normalizeAdventure, availableAdventureEndings, adventureEndingPages } from './adventure-story.js';
import { createEquipmentRolls, materializeRolledEquipment } from './adventure-loot.js';
import { adventurePersonById, chapterDepartures, recruitmentReady } from './adventure-companions.js';
import { createCompanionUI } from './adventure-companion-ui.js';
import { huntBriefs, huntEdge, adventureBossMoves } from './adventure-hunts.js';

addCampaign(recruits,dangers);
people.push(...mainCast,...recruits);
Object.assign(monsterDefs,dangerMonsters,trialEnemies);
installExpansion(maps,monsterDefs);
installJourneys(maps,monsterDefs);
Object.assign(voyages,journeys);
installInquiries(maps);
installAdventureWorld(maps,monsterDefs);
const $ = id => document.getElementById(id);
const hud = $('hud'), storyView = $('story'), panels = $('panels'), combat = $('combat'), title = $('title');
const audio = createAudio();
const hero = HERO;
const peopleById = new Map(people.map(p => [p.id, p]));
const testimonySources = [...new Set(people.flatMap(p=>{
  const match=p.need?.kind==='clue'&&p.need.key.match(/^told-(\d+)$/);
  return match?[Number(match[1])]:[];
}))];
const images = new Map();
const assets = new Map();
const registry = { equipment: new Map(), items: new Map() };
const KEY = 'shio-kage-shelf-v1';
const ADVENTURE_KEY = 'shio-kage-adventure-v1';
const SLOT = ['武器','頭','体','腕','装飾'];
const ADVENTURE_SLOTS = [...SLOT,'装飾2'];
const rankOrder = ['白','緑','青','紫','金','虹'];
const TYPES = {剣:'sword',大剣:'great',短剣:'dagger',槍:'spear',斧:'axe',弓:'bow',杖:'staff',素手:'fist',盾:'club',その他:'club',なし:'fist'};
const weaponNames = {sword:'剣',great:'大剣',dagger:'短剣',spear:'槍',axe:'斧',bow:'弓',staff:'杖',fist:'手甲',club:'棍'};
const itemPrefixes = ['錆落としの','浜磨きの','渡り手の','深処の','逆潮の','海底の日の'];
const DAY = ['朝潮','昼潮','夕潮','夜潮'];
const collectorGear = new Set(people.map(p=>p.keeps).filter(Boolean));
const gearCrest = {sword:'eq_sword_11',great:'eq_great_11',dagger:'eq_dagger_11',spear:'eq_spear_11',axe:'eq_axe_11',bow:'eq_bow_11',staff:'eq_staff_11',fist:'eq_fist_11',club:'eq_club_11'};
const errandsByTown = Object.fromEntries(errands.map(q=>[q.town,q]));
const roadZones = [
  {to:1730,tier:0,packs:[[8],[6],[37,37],[3,29]]},
  {to:1490,tier:1,packs:[[13],[25,25],[2,29]]},
  {to:1220,tier:2,packs:[[28,29],[41],[33],[14,30]]},
  {to:1010,tier:3,packs:[[22],[36],[13,9]]},
  {to:830,tier:4,packs:[[53,53],[54],[55]]},
  {to:670,tier:5,packs:[[63],[7,17],[89]]},
  {to:434,tier:6,packs:[[62],[40],[66,29]]},
  {to:0,tier:7,packs:[[68],[79],[75]]}
];
const suggestedLevels = [2,3,4,5,6,7,8,9,11,13];
const suggestedAtTier = tier => suggestedLevels[tier] ?? 13+2*(tier-9);
const roadZoneAt = y => state.chapter<3?roadZones[0]:roadZones.find(zone=>y>=zone.to)??roadZones[0];
const chapterAtTown = Object.values(chapters);
let state, battle, currentMap, nearest, focusedPerson, loadingScene=false, menuSession, stepSample=0;
let saveTime=0, noticed=0, encounterDist=0;
let fromTitle=true;

const delay = ms => new Promise(resolve => setTimeout(resolve,ms));
const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
const count = (obj,k) => Number(obj[k])||0;
const lookup = id => assets.get(id)??assets.get(registry.equipment.get(id)?.base);
const sprite = id => assetUrl(lookup(bank('person',id)).file);
const adventurePeople = new Map([
  [84,{...peopleById.get(84),role:'剣と氷の護衛'}],
  [35,{...peopleById.get(35),role:'港の護衛'}],
  [49,{...peopleById.get(49),name:'カイ',role:'海賊船長',attribute:'水'}],
  [104,{...peopleById.get(104),name:'ミラ',role:'斥候',attribute:'氷'}]
]);
const recordPerson = (id,adventure) => (adventure?(adventurePersonById.get(+id)??adventurePeople.get(+id)):null)??peopleById.get(+id);
const person = id => recordPerson(id,state?.adventure);
const currentDay = () => Math.floor(state.tide/4)+1;
const phase = () => state.tide%4;
const wantsOnlineCache = () => 'serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1');

function el(tag, klass, text) {
  const node=document.createElement(tag);
  if(klass) node.className=klass;
  if(text!==undefined) node.textContent=text;
  return node;
}

function button(label, onClick, klass='game-button', disabled=false, detail='') {
  const node=el('button',klass);
  node.type='button';node.disabled=disabled;
  if(detail) node.append(el('b',null,label),el('small',null,detail));
  else node.textContent=label;
  node.addEventListener('click',()=>{
    audio.effect('click');
    onClick();
  });
  return node;
}

function portrait(id, size=1) {
  const n=el('i','portrait');
  n.style.backgroundImage='url("'+sprite(id)+'")';
  n.style.setProperty('--person-w',48*personScale()*size+'px');
  n.style.setProperty('--person-h',60*personScale()*size+'px');
  n.setAttribute('aria-hidden','true');
  return n;
}

function badge(attr) {
  const {glyph,color,name}=attributeInfo(attr);
  const icon=el('span',null,glyph+' '+name);
  icon.style.color=color;
  return icon;
}

function icon(id) {
  const asset=lookup(id);
  const frame=el('span','item-art');
  frame.dataset.r=asset.レア度||'白';
  const img=el('img');
  img.src=assetUrl(asset.file);
  img.alt='';
  frame.append(img);
  return frame;
}

function notify(message, sound) {
  if(sound) audio.effect(sound);
  const node=$('notice');
  node.replaceChildren(el('span',null,message));
  node.classList.add('visible');
  clearTimeout(noticed);
  noticed=setTimeout(()=>node.classList.remove('visible'),2150);
}

function newState(adventure=false) {
  const start=adventure?'T01':'port';
  return {
    version:1,balance:2,map:start,pos:{...maps[start].entry},chapter:0,tide:0,ticks:0,coins:52,
    adventure:adventure?newAdventure():null,
    members:[hero],party:[hero],partyData:{},inventory:{tool_004:3,tool_012:2},
    memories:{},lost:{},reputation:{},chests:{},discovered:{[start]:1},bestiary:{},
    authored:{},clues:{},lastActions:{},parley:{},history:[],flags:{},voyages:{},personal:{},
    companionJourneys:{},relationshipJourneys:{},inquiries:{},ethic:0,wins:0,
    audio:{bgm:.7,sfx:.72},battleSpeed:'normal',skirmishes:0,levelReport:[],ending:null,pendingBattle:null
  };
}

function normalize(raw) {
  if(!raw||raw.version!==1||!Object.hasOwn(maps,raw.map)||!Array.isArray(raw.party)||!Array.isArray(raw.members)) throw new Error('記録形式');
  const adventure=normalizeAdventure(raw.adventure);
  if(Boolean(maps[raw.map].adventure)!==Boolean(adventure)) throw new Error('旅と地図の形式');
  if(adventure) for(const [id,gear] of Object.entries(adventure.gear)) registerRolledGear(id,gear);
  const result=newState(!!adventure);
  for(const key of Object.keys(result)) {
    if(raw[key]===undefined) continue;
    if(result[key]&&typeof result[key]==='object'&&!Array.isArray(result[key])) {
      if(raw[key]&&typeof raw[key]==='object'&&!Array.isArray(raw[key])) result[key]=raw[key];
    } else result[key]=raw[key];
  }
  result.adventure=adventure;
  const known=id=>recordPerson(id,adventure);
  result.members=[...new Set([hero,...raw.members.map(Number)])].filter(id=>known(id)&&!result.lost[id]);
  result.party=[...new Set([hero,...raw.party.map(Number)])].filter(id=>result.members.includes(id)).slice(0,4);
  if(!Number.isFinite(result.pos?.x)||!Number.isFinite(result.pos?.y)) result.pos={...maps[result.map].entry};
  result.chapter=clamp(Math.floor(Number(result.chapter)||0),0,story.length-1);
  result.tide=Math.max(0,Math.floor(Number(result.tide)||0));
  result.ticks=Math.max(0,Number(result.ticks)||0);
  result.coins=Math.max(0,Math.floor(Number(result.coins)||0));
  result.audio={bgm:clamp(Number(result.audio.bgm??.7)||0,0,1),sfx:clamp(Number(result.audio.sfx??.72)||0,0,1)};
  result.battleSpeed=result.battleSpeed==='fast'?'fast':'normal';
  const oldBossWins=Object.keys(result.flags).filter(key=>key.startsWith('cleared-')||key==='below-seal'||key==='afterbell-seal').length+
    Number(result.chapter>=2)+count(result.flags,'hunts');
  result.skirmishes=Math.max(0,Math.floor(Number(raw.skirmishes??(Number(result.wins)-oldBossWins))||0));
  result.levelReport=Array.isArray(result.levelReport)?result.levelReport.filter(up=>known(up?.id)&&Array.isArray(up.gains)).slice(0,people.length)
    .map(up=>({...up,learned:Array.isArray(up.learned)?up.learned.filter(name=>typeof name==='string'):[]})):[];
  result.inventory=Object.fromEntries(Object.entries(result.inventory).filter(([id,n])=>registry.items.has(id)&&Number.isFinite(n)&&n>0).map(([id,n])=>[id,Math.floor(n)]));
  result.history=Array.isArray(result.history)?result.history.filter(x=>typeof x==='string').slice(0,240):[];
  result.ending=Object.hasOwn(endings,result.ending)?result.ending:null;
  result.partyData=Object.fromEntries(Object.entries(result.partyData).filter(([id,d])=>known(id)&&d&&typeof d==='object').map(([id,d])=>[id,{
    xp:Math.max(0,Number(d.xp)||0),hp:Number.isFinite(d.hp)?d.hp:null,mp:Number.isFinite(d.mp)?d.mp:null,refine:clamp(Math.floor(Number(d.refine)||0),0,8),
    equip:Object.fromEntries(Object.entries(d.equip??{}).filter(([slot,key])=>registry.equipment.get(key)?.slot===(slot==='装飾2'?'装飾':slot)))
  }]));
  const pending=result.pendingBattle;
  if(!pending||pending.map!==result.map||!Array.isArray(pending.ids)||!pending.ids.every(id=>Object.hasOwn(monsterDefs,id))||
      !pending.options||typeof pending.options!=='object'||(pending.options.duel&&!known(pending.options.duel))) result.pendingBattle=null;
  if(raw.balance!==2) migrateAbilityResources(result);
  result.balance=2;
  return result;
}

function migrateAbilityResources(record) {
  const rescale=(value,before,after)=>!Number.isFinite(value)?null:
    value<=0?0:clamp(Math.round(value/before*after),1,after);
  for(const [id,data] of Object.entries(record.partyData)){
    const level=levelOf(data.xp),equipment=equippedItems(data);
    const oldHp=88+(level-1)*20+equipment.reduce((sum,item)=>sum+item.hp,0)+(+id===35?17:0);
    const oldMp=19+(level-1)*4+equipment.reduce((sum,item)=>sum+item.mp,0);
    const next=statLine(+id,level,equipment,data.refine);
    data.hp=rescale(data.hp,oldHp,next.maxHp);
    data.mp=rescale(data.mp,oldMp,next.maxMp);
    const active=record.pendingBattle?.checkpoint?.party?.find?.(unit=>unit.id===+id);
    if(active){
      active.hp=rescale(active.hp,oldHp,next.maxHp)??next.maxHp;
      active.mp=rescale(active.mp,oldMp,next.maxMp)??next.maxMp;
    }
  }
}

function load(key=KEY) {
  try {
    const raw=localStorage.getItem(key);
    return raw?normalize(JSON.parse(raw)):null;
  } catch {return null;}
}

function save() {
  if(!state) return;
  if(!fromTitle&&!loadingScene) state.pos={x:Math.round(view.player.x),y:Math.round(view.player.y),face:view.player.face};
  try {localStorage.setItem(state.adventure?ADVENTURE_KEY:KEY, JSON.stringify(state));} catch { /* Save download remains available. */ }
  saveTime=performance.now();
}

function gain(id, amount) {
  state.inventory[id]=Math.max(0,count(state.inventory,id)+amount);
  if(amount>0) state.discovered[id]=1;
}

function restoreHealth(all=true) {
  for(const id of all?state.members:state.party){
    const data=memberData(id);
    const stats=battleActor(id);
    data.hp=stats.maxHp;data.mp=stats.maxMp;
  }
}

function weapon(id) {
  return lookup(bank('person',id))?.['持っている武器'][0]||'素手';
}

function memberData(id) {
  if(!state.partyData[id]){
    const type=TYPES[weapon(id)]??'fist';
    const starting='eq_'+type+'_01';
    state.partyData[id]={xp:id===hero?0:Math.max(0,(state.chapter-1)*11),hp:null,mp:null,equip:{武器:lookup(starting)?starting:null},refine:0};
    if(lookup(starting)) state.discovered[starting]=1;
  }
  return state.partyData[id];
}

const levelOf = xp => 1+Math.floor(Math.sqrt(Math.max(0,xp)/16));
const startingXp = level => 16*(level-1)**2;
const equippedItems = data => Object.values(data.equip??{}).map(key=>registry.equipment.get(key)).filter(Boolean);

function battleActor(id, xp=memberData(id).xp) {
  const p=person(id), data=memberData(id), level=levelOf(xp), held=weapon(id);
  const w=held==='なし'?'素手':held;
  const gear=equippedItems(data);
  const stats=statLine(id,level,gear,data.refine,p.adventureKit);
  const repertoire=learnedTechniques(p,w);
  return {id,name:p.name,sprite:sprite(id),weapon:w,attribute:p.attribute,xp,level,...stats,
    hp:clamp(data.hp??stats.maxHp,0,stats.maxHp),mp:clamp(data.mp??stats.maxMp,0,stats.maxMp),
    skills:repertoire.filter(s=>s.learn<=level),repertoire,gearEffects:[...new Set(gear.map(item=>item.effect).filter(Boolean))]};
}

function registerRolledGear(id,record) {
  if(!record||typeof record!=='object') return null;
  const base=registry.equipment.get(record.base);
  if(!base||base.base) return null;
  const item=materializeRolledEquipment(id,record,base);
  if(!item) return null;
  registry.equipment.set(id,item);
  registry.items.set(id,item);
  return item;
}

function enemy(id, tier=0, boss=false, encounterLevel, storyBonus=0) {
  const [name,attribute,weaknesses,shield,hp,attack,defense,speed,profile]=monsterDefs[id];
  const asset=lookup(bank('monster',profile?.spriteId??id)), [width,height]=asset.大きさ.split('×').map(Number);
  const level=encounterLevel??Math.max(1,suggestedAtTier(tier)+(boss?1:tier===0?-1:0))+storyBonus;
  const custom=!!profile&&Number.isFinite(encounterLevel);
  const rank=custom?Math.max(0,level-2):0;
  const boost=tier*(tier<3?1:1.15);
  const roster=state.party.filter(pid=>battleActor(pid).hp>0).length;
  const armor = (boss?1.18:1)*(1+Math.max(0,roster-1)*(boss?.29:.10));
  const physical=Math.round(attack+(custom?rank*3.65:boost*4+storyBonus*3.25)+(boss?2:0));
  const guard=Math.round(defense+(custom?rank*2.6:boost*1.95+storyBonus*2));
  const addedHealth=custom?rank*(boss?34:24)+(boss?Math.max(0,rank-12)**2*.85:0):boost*30+storyBonus*34;
  const pace=custom?speed+Math.round(rank*.92):speed+storyBonus;
  const magical=['光','雷','闇','氷','水'].includes(attribute);
  const specialSkill=attribute==='雷'?{effect:'slow',magnitude:.22,duration:2}:attribute==='闇'?{effect:'weaken',magnitude:.25,duration:2}:null;
  const skills=profile?.skills?.map((skill,index)=>({id:'style-'+id+'-'+index,attribute,channel:'magic',target:'one',power:1,hits:1,cost:0,...skill}));
  return {
    id,name,level,attribute,weaknesses,shield:shield+Math.min(2,Math.floor((custom?rank:tier)/3)),
    maxHp:Math.round((hp+addedHealth)*armor),
    attack:physical,defense:guard,magicAttack:Math.round(physical*(profile?.magicAttack??(magical?1.02:.88))),magicDefense:Math.round(guard*(profile?.magicDefense??(magical?1.11:.90))),
    speed:pace,accuracy:profile?.accuracy??96,evasion:Math.min(12,Math.floor(pace/3)),crit:boss?7:4,
    sprite:assetUrl(asset.file),width,height,posture:asset.素質.姿[0],
    behavior:profile?.behavior??(attribute==='闇'?'hunter':(attribute==='光'||attribute==='雷')?'caster':boss?'relentless':undefined),
    skills:skills??(boss?[{id:'fog',name:attribute+'潮のこだま',attribute,channel:'magic',power:1.18,target:'all',hits:1,cost:0,...specialSkill}]:[]),
    knownWeaknesses:state.bestiary[id]?.weakness??[]
  };
}

function enemyHuman(id, rank) {
  const p=person(id), w=weapon(id);
  return {id:'p'+id,name:p.name,level:rank,sprite:sprite(id),human:true,attribute:p.attribute,weapon:w,
    width:48,height:60,weaknesses:[w,p.attribute,'土'],shield:3+Math.floor(rank/4),maxHp:77+rank*28,
    attack:19+rank*3,defense:10+rank,magicAttack:17+rank*3,magicDefense:8+rank,
    speed:16,accuracy:96,evasion:7,crit:5,behavior:'hunter'};
}

function adventureEnemy(id,options) {
  const boss=adventureBosses[options.adventureBoss];
  const edge=huntEdge[options.huntEdge];
  const level=options.encounterLevel;
  const unit=enemy(id,0,false,level);
  const party=state.party.length;
  const chaptersBeforeBoss=boss?.chapter>1?boss.chapter-1:0;
  const attack=Math.round(11+level*(boss?2.36:2.08)+(boss&&chaptersBeforeBoss>1?5:0));
  const defense=Math.round(5+level*(boss?2.20:1.85));
  const weaknesses=boss?.weaknesses?.length?boss.weaknesses:unit.weaknesses;
  const element=boss?.attribute??boss?.attributes?.[0]??unit.attribute;
  const mult=boss?1+(party-1)*.25:1+Math.max(0,party-2)*.15;
  const phases=boss?.chapter===12?3:1;
  const phaseSkills=adventureBossMoves(boss?.chapter,element);
  return {...unit,name:boss?.title??unit.name,level,attribute:element,weaknesses,
    attack,magicAttack:Math.round(attack*1.02),defense,magicDefense:defense,openingAttack:edge?.attack,
    speed:Math.round((7+level*.7+(boss?2:0))*(edge?.speed??1)),evasion:Math.min(boss?8:10,Math.floor(level/7)),
    maxHp:Math.round((boss?(64+level*14+(phases-1)*level*5):(25+level*5.0))*mult),
    shield:boss?.shield??Math.min(4,Math.max(1,Math.round(1+level/32))),openingShieldCuts:edge?.shield,
    knownWeaknesses:edge?.reveal?[...new Set([...unit.knownWeaknesses,weaknesses[0]])]:unit.knownWeaknesses,
    behavior:boss?'relentless':unit.behavior,phaseCount:phases,
    phaseNames:phases===3?['浅瀬','骨の洞','岩の浜']:undefined,
    phaseThemes:phases===3?['coast','cave','final']:undefined,
    phaseShields:phases===3?[7,6,4]:undefined,
    skills:boss?phaseSkills.map((skill,index)=>({id:'adventure-boss-'+index,channel:'magic',target:'one',hits:1,cost:0,...skill})):unit.skills};
}

function lootRow(id, amount) {
  const i=registry.items.get(id);
  return {name:i.name,rarity:i.rarity??lookup(id).レア度,icon:assetUrl(lookup(id).file),amount,
    equipment:!!i.slot,slot:i.slot,effectLabel:i.effectLabel};
}

function rememberEnemy(e, won) {
  if(e.human) return;
  const memory=(state.bestiary[e.id]??={count:0,weakness:[]});
  memory.weakness=[...new Set([...memory.weakness,...(e.knownWeaknesses??[])])];
  memory.level=e.level;
  if(won) memory.count++;
}

const levelStats = abilityStats.map(({label,key})=>[label,key]);
const combatXp = (xp, active, reserveShare) => active?xp:Math.ceil(xp*reserveShare);
const plannedXp = (level, portion) => {
  const step=startingXp(level+1)-startingXp(level);
  const current=memberData(hero).xp;
  const gap=Math.max(0,startingXp(Math.max(1,level-1))-current);
  const scale=Math.max(.36,1-.14*Math.max(0,levelOf(current)-level-1));
  return Math.round(step*portion*scale+gap*.58);
};

function experienceReports(xp, activeIds, reserveShare) {
  const active=[],reserve=[];
  for(const id of state.members){
    const present=activeIds.includes(id),before=battleActor(id),next=before.xp+combatXp(xp,present,reserveShare);
    if(levelOf(next)===before.level) continue;
    const after=battleActor(id,next);
    const gains=levelStats.map(([label,key])=>({label,amount:after[key]-before[key]})).filter(stat=>stat.amount>0);
    const learned=after.repertoire.filter(skill=>skill.learn>before.level&&skill.learn<=after.level).map(skill=>skill.name);
    (present?active:reserve).push({id,name:before.name,from:before.level,to:after.level,gains,learned});
  }
  return {active,reserve};
}

function grantExperience(xp, activeIds, reserveShare, reports=experienceReports(xp,activeIds,reserveShare)) {
  for(const id of state.members){
    const participant=activeIds.includes(id),data=memberData(id),before=levelOf(data.xp);
    data.xp+=combatXp(xp,participant,reserveShare);
    if(participant&&levelOf(data.xp)>before){
      const member=battleActor(id);
      data.hp=member.maxHp;data.mp=member.maxMp;
    }
  }
  if(reports.active.length||reports.reserve.length) state.levelReport=[...reports.active,...reports.reserve];
  return reports;
}

function fieldExperience(xp) {
  if(xp<=0) return [];
  const report=grantExperience(xp,state.party,.78);
  const lines=[[0,'経験 '+xp.toLocaleString('ja-JP')+'を得た。']];
  for(const up of report.active){
    const learned=up.learned.length?'　習得した技 '+up.learned.join('・'):'';
    lines.push([0,up.name+'がレベル '+up.to+' に上がった。'+learned]);
  }
  if(report.active.length||report.reserve.length) audio.effect('level');
  return lines;
}

function battleRewards(enemies,{party},options) {
  const scale=options.tier??currentMap.tier??0, prize=options.boss?3.7:1;
  const reward=options.duel?{xp:14+options.rank*4,gold:0,items:[],levelUps:[]}:
    {xp:Math.round((10+scale*5)*enemies.length*prize),gold:Math.round((9+scale*7)*enemies.length*prize),items:[],levelUps:[]};
  if(options.encounterLevel){
    const company=1+Math.max(0,enemies.length-1)*.12;
    reward.xp=plannedXp(options.encounterLevel,(options.boss ? .74 : .23)*company);
    reward.gold=Math.round((26+options.encounterLevel*7)*(options.boss ? 1.3 : .55)*company);
  }
  if(options.adventureBoss){
    const chapter=adventureBosses[options.adventureBoss]?.chapter;
    const next=chapter && adventureChapters[chapter+1];
    if(next) reward.xp=Math.max(reward.xp,startingXp(Math.max(1,next.level-2))-memberData(hero).xp);
  }
  for(const e of enemies) {
    if(e.human) continue;
    const r=Math.random();
    const id=r<.0025?'mat_093':r<.009?'mat_092':r<.046?'mat_084':r<.095+scale*.009?'mat_045':r<.29+scale*.021?'mat_032':r<.59?'mat_012':'mat_005';
    const row=reward.items.find(i=>i.id===id);
    if(row) row.amount++;
    else reward.items.push({...lootRow(id,1),id});
  }
  if(options.adventureBattle){
    const campaign=state.adventure;
    const boss=adventureBosses[options.adventureBoss];
    const danger=options.encounterLevel??currentMap.level??1;
    const deep=currentMap.kind==='cave'||/^R2\d$/.test(currentMap.id);
    const rolls=createEquipmentRolls({level:danger,deep,boss:!!boss,side:!!boss&&!boss.chapter,
      post:danger>=64,region:currentMap.palette,preferred:boss?.gear,
      bases:[...registry.equipment.values()].filter(item=>!item.base)});
    for(const record of rolls){
      let id;
      do {id='drop_'+(campaign.nextGear++).toString(36);} while(Object.hasOwn(campaign.gear,id));
      if(registerRolledGear(id,record)){
        campaign.gear[id]=record;
        reward.items.push({...lootRow(id,1),id});
      }
    }
  }
  const reports=experienceReports(reward.xp,party.map(p=>p.id),options.encounterLevel ? .78 : .55);
  reward.levelUps=reports.active;
  reward.reserveLevelUps=reports.reserve;
  return reward;
}

function showBattle(ids, options={}, resume) {
  if(battle) return;
  if(!state.party.some(id=>battleActor(id).hp>0)) restoreHealth(false);
  const duelActor=state.party.includes(options.actorId)?options.actorId:hero;
  const pids=options.duel?[duelActor]:state.party;
  if(options.duel&&battleActor(duelActor).hp<=0) return;
  if(!options.boss&&!options.duel&&options.quick===undefined){
    options={...options,quick:state.skirmishes>0};
    state.skirmishes++;
  }
  if(!resume&&options.storyBonus===undefined&&['chapter','post'].includes(options.progress)&&
    Object.values(journeys).some(arc=>state.voyages[arc.id]?.step>=arc.stages.length)){
    const ranks=state.party.map(id=>levelOf(memberData(id).xp)).sort((a,b)=>a-b);
    const near=ranks[Math.floor((ranks.length-1)/2)];
    const floor=suggestedAtTier(options.tier??currentMap.tier??0)+1;
    options={...options,storyBonus:clamp(Math.floor((near-floor-2)*.65),0,6)};
  }
  closeStory();
  closeMenu();
  $('notice').classList.remove('visible');
  save();
  hud.hidden=true;combat.hidden=false;
  audio.scene(options.boss||options.duel?'boss':'battle');
  view.route=null;
  const enemies=options.duel?[enemyHuman(options.duel, options.rank)]:ids.map(id=>
    options.adventureBattle?adventureEnemy(id,options):enemy(id,options.tier??currentMap.tier??0,options.boss,options.encounterLevel,options.storyBonus));
  for(const e of enemies) rememberEnemy(e,false);
  const theme=options.duel?'town':currentMap.id==='deep'||currentMap.id==='afterbell'?'final':currentMap.palette==='frost'?'snow':currentMap.palette==='ember'?'ash':currentMap.kind==='cave'?'cave':currentMap.palette==='port'?'coast':'field';
  const pending=resume?state.pendingBattle:null;
  state.pendingBattle={map:currentMap.id,ids,options,checkpoint:resume??null,reward:pending?.reward};
  battle=startBattle({
    mount:combat,party:pids.map(id=>battleActor(id)),enemies,audio,
    items:Object.entries(toolDefs).filter(([,v])=>v.effect).map(([id,v])=>({id,...v,icon:assetUrl(lookup(id).file)})),inventory:state.inventory,
    theme,title:options.title??currentMap.name,fast:options.quick===true,speed:state.battleSpeed,
    onSpeedChange:mode=>{state.battleSpeed=mode==='fast'?'fast':'normal';save();},
    rules:{noEscape:!!(options.boss||options.duel),duel:!!options.duel},
    lastActions:state.lastActions,resume,
    rewards:(units,info)=>{
      if(state.pendingBattle.reward) return state.pendingBattle.reward;
      const reward=battleRewards(units,info,options);
      state.pendingBattle.reward=reward;
      save();
      return reward;
    },
    onCommit:info=>{
      for(const e of info.enemies) rememberEnemy(e,false);
      if(state.pendingBattle) state.pendingBattle.checkpoint=info.checkpoint;
      save();
    },
    onFinish: result=>finishBattle(result,options)
  });
  state.pendingBattle.checkpoint=battle.checkpoint();
  save();
}

function finishBattle(result, options) {
  battle=null;combat.hidden=true;hud.hidden=false;
  state.pendingBattle=null;
  state.lastActions=result.lastActions;
  state.inventory=result.inventory;
  for(const e of result.enemies) rememberEnemy(e,result.won);
  for(const p of result.party) {
    const data=memberData(p.id);
    data.hp=p.hp;data.mp=p.mp;
  }
  encounterDist=state.adventure?1350+Math.random()*620:220+Math.random()*270;
  audio.scene(mapMusic(currentMap));
  if(result.won) {
    const {xp,gold,items,levelUps,reserveLevelUps}=result.rewards;
    if(!options.duel) state.wins++;
    state.coins+=gold;
    grantExperience(xp,result.party.map(p=>p.id),options.encounterLevel ? .78 : .55,{active:levelUps??[],reserve:reserveLevelUps??[]});
    if(reserveLevelUps?.length) notify('待機中の仲間もレベルアップ','level');
    for(const row of items??[]) gain(row.id,row.amount);
  } else if(options.duel) {
    const id=result.party[0].id;
    const data=memberData(id);
    const p=battleActor(id);
    data.hp=Math.max(p.hp,Math.ceil(p.maxHp*.35));
  } else if(!result.escaped) {
    state.coins=Math.floor(state.coins*.87);
    restoreHealth();
    save();
    const refuge=state.adventure?currentMap.id:options.progress==='trial'?'lastwharf':'port';
    transition(refuge,maps[refuge].entry);
    notify(state.adventure?'入口まで退いた。体力と気力を回復した。':refuge==='lastwharf'?'岸へ引き上げられ、手当てを受けた。':'目を開くと、港で手当てを受けていた。');
  }
  if(options.adventureBattle){
    const equippedLoot=result.rewards?.items?.filter(item=>item.equipment)??[];
    let after;
    if(result.won&&options.adventureBoss){
      const a=state.adventure,boss=adventureBosses[options.adventureBoss];
      a.cleared[options.adventureBoss]=(a.cleared[options.adventureBoss]??0)+1;
      save();
      if(boss.chapter) after=()=>resolveAdventureChapter(boss.chapter);
      else after=()=>notify('狩りの記録を更新した。','success');
    } else save();
    if(result.exploreLoot&&equippedLoot.length) openMenu('adventure-loot',{found:equippedLoot,after});
    else after?.();
    return;
  }
  save();
  finishEncounterStory(options,result);
}

function mapMusic(scene) {
  return scene.kind==='town'?'town':scene.kind==='cave'?'dungeon':'field';
}

function showOnMap(p) {
  if(currentMap?.adventure){
    if(p.postgame&&!state?.adventure?.ending) return false;
    if(p.adventureResident) return true;
    return !state?.lost[p.id]&&!state?.members.includes(p.id)&&!!person(p.id);
  }
  const n=person(p.id);
  const visible=!state?.lost[p.id]&&(!state?.members.includes(p.id)||p.id===35||p.main);
  if(!visible) return false;
  if(state&&p.id===49&&p.main) return currentMap.id===(state.chapter>=9?'lastwharf':'mire');
  if(state&&p.id===35&&p.main) return currentMap.id==='threshold'&&state.chapter>=8;
  if(p.id===35&&state?.chapter>=8) return false;
  return n?.need?.kind!=='phase'||!state||phase()===n.need.at;
}

function refreshMap() {
  view.refreshPeople();
  if(!view.clear(view.player.x,view.player.y)) view.reposition(view.player);
  refreshHud(true);
}

function recommendedLevel(scene, y) {
  if(!scene) return null;
  if(scene.level) return scene.level;
  if(scene.id==='road') return Number.isFinite(y)?suggestedAtTier(roadZoneAt(y).tier):null;
  if(scene.encounters) return suggestedAtTier(scene.tier??0);
  const area=chapterAtTown.find(c=>c.town===scene.id);
  return area?recommendedLevel(maps[area.site]):null;
}

function partyLevel() {
  const levels=state.party.map(id=>levelOf(memberData(id).xp));
  const min=Math.min(...levels),max=Math.max(...levels);
  return min===max?String(max):min+'〜'+max;
}

function updateTime() {
  const level=currentMap.kind!=='town'?recommendedLevel(currentMap,view.player.y):null;
  const name=(state.adventure?['朝','昼','夕方','夜'][phase()]:DAY[phase()])+(level?'　目安レベル '+level:'');
  if($('place-time').textContent!==name) $('place-time').textContent=name;
}

function refreshHud(force=false) {
  if(!currentMap||!state) return;
  if(force) $('place-name').textContent=currentMap.name;
  updateTime();
  const target=view.near();
  if(!force&&nearest?.id===target?.id&&nearest?.type===target?.type) return;
  nearest=target;
  $('map-prompt').hidden=!target;
  const act=$('act');
  act.replaceChildren();
  if(!target) return;
  act.append(el('span','map-action-name',target.type==='person'?(target.name??person(target.id)?.name):target.label));
  const level=target.type==='exit'?recommendedLevel(maps[target.id],target.spawn?.y):null;
  if(level) act.append(el('small','map-action-level','目安レベル '+level+'　隊列 '+partyLevel()));
}

function openMap(id,pos) {
  currentMap=maps[id];
  $('game').classList.toggle('adventure-mode',!!currentMap.adventure);
  state.map=id;
  state.discovered[id]=1;
  view.setMap(currentMap,pos??currentMap.entry);
  encounterDist=currentMap.encounters?(currentMap.adventure?1100:state.chapter<=2?230:166)+Math.random()*(currentMap.adventure?620:135):Infinity;
  refreshHud(true);
  audio.scene(mapMusic(currentMap));
}

async function transition(id,pos) {
  if(loadingScene||!maps[id]) return;
  loadingScene=true;view.route=null;
  $('veil').classList.add('opaque');audio.effect('transition');
  await delay(175);
  openMap(id,pos);
  loadingScene=false;save();
  $('veil').classList.remove('opaque');
}

function movement(p,distance) {
  if(!currentMap||!state) return;
  state.ticks+=distance;
  if(state.ticks>2400) {
    state.ticks-=2400;
    state.tide++;
    if((currentMap.adventure&&currentMap.kind==='town')||currentMap.people?.some(n=>person(n.id)?.need?.kind==='phase')) refreshMap();
  }
  refreshHud();
  if(nearest?.type==='exit'&&Math.hypot(p.x-nearest.x,p.y-nearest.y)<12) {
    interact(nearest);return;
  }
  const now=performance.now();
  if(now-saveTime>3000) save();
  encounterDist-=distance;
  if(encounterDist>0||!currentMap.encounters||view.near()) return;
  const road=currentMap.id==='road'?roadZoneAt(p.y):null;
  const pairs=(road?.packs??currentMap.encounters).filter(set=>set.every(id=>monsterDefs[id]));
  if(!pairs.length){encounterDist=200;return;}
  const options=pairs[(state.wins+Math.floor(Math.random()*pairs.length))%pairs.length];
  showBattle(options,currentMap.adventure?{adventureBattle:true,encounterLevel:currentMap.level??1}:{tier:road?.tier});
}

function active() {
  return !fromTitle&&!loadingScene&&storyView.hidden&&panels.hidden&&combat.hidden;
}

const view=new MapView($('world'),{
  active,hero,interact,
  render:()=>combat.hidden,
  image:id=>images.get(bank('person',id)),
  show:showOnMap,
  night:()=>!fromTitle&&phase()===3,
  adventureState:()=>state?.adventure,
  opened:p=>!!state?.chests[p.id]||!!state?.adventure?.cleared[p.bossId],
  showObject:p=>adventureObjectVisible(p),
  move:movement,
  step:()=>{if(performance.now()-stepSample>225) {stepSample=performance.now();audio.effect('step');}}
});

const companionUI=createCompanionUI({state:()=>state,map:()=>currentMap,place:id=>maps[id],person,view:()=>view,save,notify,
  conversation,closeStory,openMenu,closeMenu,button,el,row,memberRow,panelFrame,join,lost,refreshMap});

function adventureObjectVisible(object) {
  const a=state?.adventure;
  if(object.postgame&&!a?.flags.POST) return false;
  if(object.appearsAfter?.length&&!object.appearsAfter.some(flag=>a?.flags[flag])) return false;
  const hidden=object.bossId&&Number(object.bossId.slice(1))>=43;
  return !hidden||!!a?.seen['trail-'+object.bossId];
}

function closeStory() {
  storyView.hidden=true;
  storyView.classList.remove('finale','on-title','field-mode');
  storyView.replaceChildren();
  focusedPerson=null;
  view.releaseTalk();
}

function conversation(script, choices=[], onEnd, mode='') {
  if(!script.length){
    if(choices.length) script=[[0,'手帳を開いた。']];
    else {closeStory();onEnd?.();return;}
  }
  view.route=null;view.keys.clear();
  storyView.hidden=false;
  storyView.classList.toggle('on-title',fromTitle);
  const fieldMode=mode==='field'&&!!focusedPerson;
  storyView.classList.toggle('field-mode',fieldMode);
  if(!fieldMode) view.releaseTalk();
  let i=0;
  function render() {
    const [id,line]=script[i];
    const p=typeof id==='number'&&id?person(id):null;
    storyView.replaceChildren();
    const box=el('div','story-box'),head=el('div','story-head');
    const shown=el('div','speaker-box');
    if(p) shown.append(portrait(id),el('h2',null,p.name));
    else if(typeof id==='string') shown.append(el('h2',null,id));
    head.append(shown);
    box.append(head);
    const last=i===script.length-1;
    if(last&&choices.length) {
      box.append(el('p','story-text',line));
      const actions=el('div','story-choices');
      for(const c of choices.slice(0,4)){
        actions.append(c.card?fieldCard(c):button(c.label,c.action,'choice'+(c.primary?' primary':''),c.disabled,c.detail));
      }
      box.append(actions);
      head.append(button('閉じる',()=>{closeStory();onEnd?.();},'game-button story-close'));
    } else {
      box.append(button(line,()=>{
        if(last){closeStory();onEnd?.();}
        else {i++;render();}
      },'story-text'));
    }
    storyView.append(box);
    if(fieldMode){
      const gameTop=$('game').getBoundingClientRect().top;
      const panelTop=box.getBoundingClientRect().top-gameTop;
      const safeTop=$('place').getBoundingClientRect().bottom-gameTop+8;
      view.focusTalk(focusedPerson,panelTop,safeTop);
    }
  }
  render();
}

function nextChapter(n) {
  state.chapter=Math.max(n,state.chapter);
  save();
  const line=story[state.chapter];
  if(line) notify('手帳を更新　'+line.title,'success');
}

function starterConversation(p) {
  if(p.id!==35||state.chapter>2) return false;
  const n=state.chapter;
  if(n===0) {
    conversation([[35,p.hello],[84,'君は僕の帰りを待っていた？'],[35,'違う。浜で拾われた荷を見張っていたの。父上の封は見せないで。鐘楼へ渡す前に、南の浜の石祠を見て。']],[],()=>nextChapter(1));
  } else if(n===1) {
    conversation([[35,'南門を出て最初の曲がり角を東。祠までは人の足跡を数えてもいい。帰りには、数えないで。']],[{label:'話を切り上げる',action:closeStory}]);
  } else {
    conversation([[84,'この字は父さんの癖だ。昨日の日付で、僕の死を一度取り消している。'],[35,'しまって、ハル。次の鐘まで同行する。私が先にひとりで帰ったら、どうか門を開けないで。']],[],()=>{join(p);nextChapter(3);});
  }
  return true;
}

function majorConversation(p) {
  const n=state.chapter,c=chapters[n];
  if(!c||c.speaker!==p.id||c.town!==currentMap.id||state.flags['route-'+n]) return false;
  conversation(c.opening,c.choices.map(choice=>({
    label:choice.label,detail:choice.detail, action:()=>{
      state.flags['route-'+n]=choice.key;
      state.ethic+=choice.ethic;
      const m=memory(p.id);
      m.trust+=choice.ethic;m.last=choice.ethic>0?'kind':'afraid';
      save();
      conversation([choice.response],[
        {label:'働きかける',action:()=>fieldMenu(p,0)},
        {label:'先へ進む',action:closeStory}
      ]);
    }
  })));
  return true;
}

function memory(id) {
  const found=state.memories[id];
  if(!found||!Array.isArray(found.tides)||!Number.isFinite(found.trust)) state.memories[id]={trust:0,tides:[],last:'',attempts:0};
  return state.memories[id];
}

function requirement(p) {
  const need=p.need,m=memory(p.id);
  if(!need||need.kind==='story') return {label:'旅を続ける',ready:false};
  const r={label:need.label.replace('段位','レベル'),ready:false};
  switch(need.kind){
    case 'gift':r.ready=count(state.inventory,need.item)>=need.amount;break;
    case 'pay':r.ready=state.coins>=need.amount;break;
    case 'visits':r.ready=m.tides.length>=need.count;break;
    case 'duel':r.ready=levelOf(memberData(hero).xp)>=need.rank;break;
    case 'trust':r.ready=m.trust>=need.mark;break;
    case 'phase':r.ready=phase()===need.at&&m.trust>=need.mark;break;
    case 'deed':r.ready=state.wins>=need.wins;break;
    case 'clue':r.ready=!!state.clues[need.key];break;
    case 'party':r.ready=state.party.includes(need.id);break;
    case 'alone':r.ready=state.party.length<=need.max;break;
    case 'fame':r.ready=count(state.reputation,currentMap.id)>=need.min;break;
    case 'infamy':r.ready=state.ethic<=need.mark;break;
    case 'poor':r.ready=state.coins<=need.max;break;
    case 'catalog':r.ready=Object.keys(state.bestiary).length>=need.count;break;
    case 'return':r.ready=state.chapter>=need.chapter&&m.tides.length>=need.visits;break;
    case 'proof':r.ready=!!state.chests[need.id];break;
    case 'choice':r.ready=!m.refused;break;
    case 'level':r.ready=levelOf(memberData(hero).xp)>=need.level;break;
    case 'conduct':r.ready=state.ethic>=need.mark;break;
    default: break;
  }
  return r;
}

function join(p) {
  if(state.members.includes(p.id)||state.lost[p.id]) return;
  state.members.push(p.id);
  const data=memberData(p.id),lead=levelOf(memberData(hero).xp);
  if(lead>=9) data.xp=Math.max(data.xp,startingXp(lead-3));
  if(state.party.length<4) state.party.push(p.id);
  memory(p.id).last='joined';
  state.history.unshift(p.name+'が旅に加わった。');
  refreshMap();save();
  notify(p.name+'が仲間に加わった','join');
}

function lost(id, reason) {
  if(id===hero||!state.members.includes(id)) return;
  state.lost[id]=reason;
  state.members=state.members.filter(pid=>pid!==id);
  state.party=state.party.filter(pid=>pid!==id);
  state.history.unshift(person(id).name+'の席が空いた。'+reason);
  refreshMap();save();
}

function companionChat() {
  const scene=campScene(state.party.map(person),state);
  if(!scene){
    conversation([[0,'少しのあいだ、誰も話さずに同じ火を見ていた。']]);
    return;
  }
  const mark=()=>{state.parley[scene.key]=1;save();};
  if(scene.conflict) {
    const {speaker,listen,leave}=scene.conflict;
    conversation(scene.lines,[
      {label:'ふたりの話を聞く',detail:'席を残して落ち着くまで待つ',action:()=>{
        state.ethic++;
        for(const id of new Set(scene.lines.map(([id])=>id).filter(id=>id&&id!==hero))) memory(id).trust++;
        mark();
        conversation(listen);
      }},
      {label:'引き留めない',detail:person(speaker).name+'が旅から去る',action:()=>{
        mark();
        lost(speaker,'宿の椅子をひとつ返した。');
        audio.scene('tragedy');
        conversation(leave,[],()=>audio.scene(mapMusic(currentMap)));
      }}
    ]);
    return;
  }
  conversation(scene.lines,[],mark);
}

function candidateChoice(p) {
  const n=p.need;
  if(!n||n.kind==='story'||state.members.includes(p.id)) return null;
  const r=requirement(p);
  if(n.kind==='duel') return fieldOption(p,'duel',hero,{recruitment:true,title:'加入を賭けて決闘',ready:r.ready});
  return {label:'旅に誘う',detail:r.label,disabled:!r.ready,action:()=>{
    if(n.kind==='choice') {
      const answers=n.answers??['引き受ける','今は断る','条件を聞く'];
      conversation([[p.id,n.question??'ひとつ、約束してほしいことがある。']],answers.map((label,i)=>({label,action:()=>{
        if(i===(n.answer??0)) conversation([[84,label],[p.id,p.reply]],[],()=>join(p));
        else {if(n.once) memory(p.id).refused=true;save();conversation([[p.id,'それなら、ここで見送ることにする。']]);}
      }})));
      return;
    }
    conversation([[84,'一緒に来てくれないか。'],[p.id,p.reply]],[],()=>{
      if(n.kind==='gift') gain(n.item,-n.amount);
      if(n.kind==='pay') state.coins-=n.amount;
      join(p);
    });
  }};
}

function visitedP(p) {
  const m=memory(p.id);
  if(m.tides.at(-1)!==state.tide) m.tides.push(state.tide);
  if(m.tides.length>20) m.tides=m.tides.slice(-20);
  state.discovered[bank('person',p.id)]=1;
  save();
  if(starterConversation(p)) return;
  if(majorConversation(p)) return;
  const direct=candidateChoice(p);
  const choices=[{label:'働きかける',action:()=>fieldMenu(p,0)}];
  if(direct) choices.push(direct);
  if(p.id===75) choices.push({label:'荷を見せてもらう',action:()=>openMenu('shop')});
  choices.push({label:'別れる',action:closeStory});
  const recent=townReaction(p.id,state,currentMap.id);
  const line=m.last==='angry'?'前にされたことは覚えている。今日は、何を話しに来た？':
    m.last==='afraid'?'そこからでも話は聞ける。':recent??(m.tides.length>1||m.last==='kind'?p.alternate??p.hello:p.hello);
  conversation([[p.id,line]],choices);
}

function fieldMenu(p,page) {
  const acts=new Map();
  for(const id of state.party){
    const actor=battleActor(id),art=person(id).art;
    if(actor.hp===0||!fieldArts[art]) continue;
    const score=art==='duel'?actor.level:fieldChance(p,art,id);
    if(!acts.has(art)||acts.get(art).score<score) acts.set(art,{id,score});
  }
  const available=[...acts].map(([art,{id}])=>fieldOption(p,art,id));
  const max=Math.ceil(available.length/3);
  const choices=available.slice(page*3,page*3+3);
  if(max>1) choices.push({label:page?'前の働きかけ':'ほかの働きかけ',action:()=>fieldMenu(p,page?0:1)});
  if(choices.length) conversation([[p.id,'働きかけを選ぶ']],choices,undefined,'field');
  else conversation([[p.id,'今は働きかけられる仲間がいない。']],[],undefined,'field');
}

function duelRank(p) {
  return p.need?.rank??Math.max(1,currentMap.tier??0)+1;
}

function fieldOption(p,art,id,{recruitment=false,title,ready=true}={}) {
  const actor=battleActor(id),m=memory(p.id),spec=fieldArts[art];
  const duel=art==='duel';
  const rank=duel?duelRank(p):null;
  const diff=duel?actor.level-rank:0;
  const chance=duel?null:fieldChance(p,art,id);
  const required=p.need?.kind==='duel'?p.need.par:null;
  const gear=p.keeps&&!m.claimed?registry.items.get(p.keeps)?.name:null;
  const plan=duel?null:fieldPlan(p,art);
  const cost=plan?.cost??'';
  const short=plan?.short??false;
  const blocked=!ready||short||actor.hp===0||!!plan?.lock;
  const status=!ready?'レベル不足':actor.hp===0?'戦闘不能':short?(art==='bargain'?'銀不足':'持ち物不足'):
    plan?.lock||(duel?diff>=2?'有利':diff>=-1?'互角':'難しい':chance+'％');
  const effect=duel?[recruitment?'仲間に加わる':null,gear,'信頼が上がる'].filter(Boolean).join('・'):
    plan.reward;
  const risk=duel?'敗北すると信頼が下がる':plan.risk;
  return {
    card:true,label:title??spec.label,actor,rank,status,effect,risk,cost,required:duel?required:null,
    description:spec.detail,disabled:blocked,
    favorable:duel?diff>=2:chance>=65,
    action:()=>recruitment?fieldDuel(p,true,id):fieldAction(p,art,id)
  };
}

function fieldCard(option) {
  const actor=option.actor;
  const card=button('',option.action,'choice field-card',option.disabled);
  const heading=el('span','field-action-heading');
  heading.append(el('b',null,option.label),el('span','field-likelihood'+(option.favorable?' favorable':''),option.status));
  const data=el('span','field-action-data'), actorLine=el('span','field-actor-name');
  actorLine.append(el('strong',null,actor.name),el('span',null,'レベル '+actor.level));
  if(option.rank!==null) actorLine.append(el('span','field-rival-level','相手 レベル '+option.rank));
  if(option.cost) actorLine.append(el('span','field-cost',option.cost));
  data.append(heading,actorLine,el('span','field-action-description',option.description));
  const gain=el('span','field-outcome');
  gain.append(el('span','field-outcome-label','成功'),el('span',null,option.effect+(option.required?'（'+option.required+'巡以内）':'')));
  const loss=el('span','field-outcome failure');
  loss.append(el('span','field-outcome-label','失敗'),el('span',null,option.risk));
  data.append(gain,loss);
  card.append(portrait(actor.id),data);
  return card;
}

function fieldChance(p,art,id) {
  const m=memory(p.id);
  let favor={verify:0,craft:14,shadow:-26,bargain:10,duel:0,comfort:3,threaten:-15,listen:1}[art];
  if(art==='comfort'&&p.temper==='誇り高い') favor-=23;
  if(art==='verify'&&p.temper==='勘定高い') favor-=9;
  if((art==='shadow'||art==='threaten')&&p.temper==='用心深い') favor-=11;
  if(p.bond===id) favor+=15;
  if(art===p.art) favor+=7;
  return clamp(66+favor+m.trust*5+(levelOf(memberData(id).xp)-1)*3+count(state.reputation,currentMap.id)*2,15,98);
}

function fieldPlan(p,art) {
  const memoryOfPerson=memory(p.id),stamp=state.tide+1;
  const spread=state.chapter>=3?['mat_012','mat_005','mat_032']:['mat_005','mat_012','mat_005'];
  const exchange=['tool_004','tool_012','tool_005','mat_012'];
  const helpItem=spread[p.id%spread.length],tradeItem=exchange[p.id%exchange.length];
  const price=14+p.id%15,deposit=Math.ceil(price/4);
  const stolen=memoryOfPerson.claimed?null:registry.items.get(p.keeps);
  const plans={
    verify:{reward:'本人の証言・信頼',risk:'警戒され、次の働きかけが難しくなる'},
    craft:{reward:registry.items.get(helpItem).name+'・町の評判',item:helpItem,risk:'担当者の気力が6減る',cost:'露草の包み 1束',short:count(state.inventory,'tool_004')<1},
    shadow:{reward:stolen?.name??'手持ちの小銭',risk:'町の評判が下がり、次の潮まで取引停止'},
    bargain:{reward:registry.items.get(tradeItem).name,item:tradeItem,risk:'手付けの銀 '+deposit+'を失う',cost:'成立で銀 '+price,price,deposit,short:state.coins<price},
    comfort:{reward:'信頼が大きく上がる・警戒が解ける',risk:'距離を置かれ、次の潮まで慰められない'},
    threaten:{reward:'持ち場の情報・相手が関係を恐れる',risk:'次の潮まで新たな働きかけを拒まれる'},
    listen:{reward:'聞き取った情報・旅の手帳に記録',risk:'物音に気づかれ、次の潮まで聞き耳を立てられない'}
  };
  const lock=memoryOfPerson.blocked?.all>=stamp||memoryOfPerson.blocked?.[art]>=stamp?'次の潮まで不可':
    memoryOfPerson.methods?.[art]===stamp?'この潮は済み':'';
  return {...plans[art],lock};
}

function claim(p) {
  const m=memory(p.id);
  if(!p.keeps||m.claimed||!registry.items.has(p.keeps)) return '';
  m.claimed=true;gain(p.keeps,1);
  return '　'+registry.items.get(p.keeps).name+'を手に入れた。';
}

function fieldAction(p, art, actor) {
  if(art==='duel'){fieldDuel(p,false,actor);return;}
  const m=memory(p.id),spec=fieldArts[art],s=fieldChance(p,art,actor),plan=fieldPlan(p,art);
  if(plan.lock||plan.short||battleActor(actor).hp===0) return;
  if(art==='craft') gain('tool_004',-1);
  const methods=m.methods??={};
  const locks=m.blocked??={};
  state.ethic+=spec.honesty;
  methods[art]=state.tide+1;
  m.attempts=count(m,'attempts')+1;
  const ok=Math.random()*100<s;
  const mapId=currentMap.id;
  const reputation=change=>{state.reputation[mapId]=clamp(count(state.reputation,mapId)+change,-20,20);};
  m.trust=clamp(m.trust+(ok?spec.trust:-1),-16,22);
  m.last=ok?(spec.trust>0?'kind':'afraid'):'angry';
  let response=ok?'分かった。話はここまでだ。':'今は、そういう話には乗れない。';
  let result=ok?plan.reward:plan.risk;
  if(ok){
    if(art==='verify'||art==='listen'){
      state.clues['told-'+p.id]=1;
      if(art==='listen') state.clues['heard-'+p.id]=1;
      response=publicEvidence(p,state);
    } else if(art==='craft'){
      reputation(2);
      gain(plan.item,1);
      response='助かった。作業場に残っていた分だ。受け取って。';
    } else if(art==='shadow'){
      const item=claim(p);
      if(item) result=item.trim();
      else {const silver=4+p.id%8;state.coins+=silver;result='銀 '+silver+'を手に入れた';}
      reputation(-1);
      response='……いま、どこかで布が鳴ったような。';
    } else if(art==='bargain'){
      state.coins-=plan.price;
      gain(plan.item,1);
      response='勘定はここまで。品はそっちのものだ。';
    } else if(art==='comfort'){
      delete locks.all;
      delete locks.comfort;
      m.trust=clamp(m.trust+2,-16,22);
      response='少し落ち着いた。待ってくれてありがとう。';
    } else if(art==='threaten'){
      state.clues['pressed-'+p.id]=1;
      response=p.alternate??p.hello;
    }
    audio.effect('success');
  } else {
    const stamp=state.tide+1;
    if(art==='verify') m.trust=Math.max(-16,m.trust-2);
    else if(art==='craft') memberData(actor).mp=Math.max(0,battleActor(actor).mp-6);
    else if(art==='shadow') {reputation(-3);state.flags['shunned-'+mapId]=stamp;}
    else if(art==='bargain') state.coins=Math.max(0,state.coins-plan.deposit);
    else if(art==='comfort') locks.comfort=stamp;
    else if(art==='threaten') locks.all=stamp;
    else if(art==='listen') locks.listen=stamp;
    if(art==='shadow') response='手を見せて。店には人をやっておく。';
    if(art==='bargain') response='取引はなしだ。手付けだけは受け取る。';
    if(art==='listen') response='さっきから、そこにいたのか。';
    audio.effect('failure');
  }
  save();
  const direct=candidateChoice(p);
  conversation([[p.id,response],[0,(ok?'成功　':'失敗　')+result]],[...(direct?[direct]:[]),
    {label:'ほかの働きかけ',action:()=>fieldMenu(p,0)},{label:'席を立つ',action:closeStory}],undefined,'field');
}

function fieldDuel(p, recruitment, actorId=hero) {
  showBattle([],{duel:p.id,rank:duelRank(p),actorId,recruitment,title:p.name+'との決闘'});
}

function finishDuel(p,result,recruitment) {
  const m=memory(p.id);
  if(result.won){m.trust+=2;m.last='kind';}
  else {m.last='angry';m.trust--;}
  const met=result.won&&result.round<=(p.need?.par??99);
  const grant=met?claim(p):'';
  save();
  conversation([[p.id,(met?p.reply:result.won?'届いたが、息が長すぎる。次は迷うな。':'足が震えている。立てるまでここにいろ。')+grant]],[],()=>{
    if(recruitment&&met) join(p);
  });
}

function finishEncounterStory(options,result) {
  if(options.duel) {finishDuel(person(options.duel),result,options.recruitment);return;}
  if(!result.won) return;
  const recovered=Object.entries(options.loot??{}).filter(([id,n])=>registry.items.has(id)&&!collectorGear.has(id)&&n>0);
  if(recovered.length) {
    for(const [id,n] of recovered) gain(id,n);
    notify(recovered.map(([id,n])=>registry.items.get(id).name+' ×'+n).join('　'),'chest');
  }
  if(options.progress==='shoal'){
    state.clues.shoal=1;nextChapter(2);
    conversation([[0,'波が引くように、祠のふたが緩んだ。'],[84,'僕の名前の下に、父さんの筆で線が引いてある。']]);
  } else if(options.progress==='chapter'){
    const n=options.chapter,c=chapters[n];
    if(!c||state.flags['cleared-'+n]) return;
    state.flags['cleared-'+n]=true;
    state.clues['seal-'+n]=true;
    state.history.unshift(c.title+'を手帳に写した。');
    save();
    chapterAftermath(n);
  } else if(options.progress==='post'){
    state.flags[options.seal]=true;
    state.history.unshift(options.title+'の返事を渡した。');
    save();
    conversation(postResolution(options.seal,state));
  } else if(options.progress==='hunt'){
    state.flags.hunts=Math.max(count(state.flags,'hunts'),options.hunt+1);
    save();
    conversation([[84,'足音の奥に、まだ別の返事が聞こえる。']]);
  } else if(options.progress==='errand'&&errandsByTown[options.region]){
    completeTrace(errandsByTown[options.region]);
  } else if(options.progress==='voyage'){
    finishVoyage(options.voyageId,options.voyageStep,options.voyageChoice);
  } else if(options.progress==='trial'){
    const trial=trials.find(entry=>entry.id===options.trialId);
    if(!trial||state.flags['trial-'+trial.id]) return;
    state.flags['trial-'+trial.id]=true;
    const items=takeLoot(trial.loot);
    state.history.unshift('腕試し「'+trial.title+'」を終えた。');
    save();
    conversation([...trial.done,...(items.length?[[0,items.join('　')+'を手に入れた。']]:[])]);
  }
}

function chapterAftermath(chapter) {
  conversation(chapterScene(chapter,'after',state),[],()=>{
    state.flags['aftermath-'+chapter]=true;
    if(chapter===8){save();afterUndertow();return;}
    nextChapter(chapter+1);
    if(chapter===9) endingAltar();
  });
}

function afterUndertow() {
  if(state.flags.enaAnswer||state.lost[35]||!state.members.includes(35)) {
    if(!state.flags.enaAnswer) state.flags.enaAnswer=state.lost[35]?'gone':'absent';
    nextChapter(9);
    closeStory();
    return;
  }
  const resolution=undertowResolution(state);
  const finish=(key,loss)=>{
    state.flags.enaAnswer=key;
    if(loss) {state.ethic-=3;lost(35,'帰るはずの足跡だけが、水面から消えた。');}
    else {state.ethic++;memory(35).trust+=3;}
    nextChapter(9);
    if(loss) audio.scene('tragedy');
    conversation(loss?resolution.gone:resolution.stay,[],()=>audio.scene(mapMusic(currentMap)));
  };
  conversation(resolution.lines,[
    {label:'帰ってほしい',detail:'名前を渡したエナに、帰る場所を残す',action:()=>finish('stay',false)},
    {label:'席を返す',detail:'エナの返事を受け取らない。エナが旅から去る',action:()=>finish('gone',true)}
  ]);
}

function chapterSeal(target) {
  const n=target.chapter;
  const c=chapters[n];
  if(!c) return false;
  if(n===9&&state.chapter===10) {endingAltar();return true;}
  if(state.flags['cleared-'+n]&&state.chapter===n) {
    if(n===8&&state.flags['aftermath-8']) afterUndertow();
    else chapterAftermath(n);
    return true;
  }
  if(state.chapter>n||state.flags['cleared-'+n]) {
    conversation([[0,'潮が当たっても、もうここから返事はない。']]);return true;
  }
  if(state.chapter<n) {
    conversation([[84,'音が二つ重なっている。今は意味が分からない。']]);return true;
  }
  const accessed=state.flags['route-'+n]||state.clues['proof-'+n];
  if(!accessed) {
    conversation([[84,'文字が同じところから二度始まっている。町に残った立札で読み方を確かめよう。']]);return true;
  }
  conversation(chapterScene(n,'before',state),[
    {label:n===9?'鐘を止める':'奥へ踏み込む',detail:target.text,action:()=>showBattle(target.boss,{
      boss:true,title:target.label,loot:{...c.loot,...target.loot},progress:'chapter',chapter:n
    })},
    {label:'離れる',action:closeStory}
  ]);
  return true;
}

function endingAltar() {
  if(state.ending) {finishEnding(state.ending,true);return;}
  const lines=[
    [0,'鐘の向こうに、父と同じ顔の男が立っている。左腕を手で掴んだまま、こちらを待っている。'],
    [0,'古い受け取り控えを両手で出す。十年前の子を弔った控えには火傷は左とある。港の杭に貼られた新しい票のほうだけが、火傷の位置を右に写し違えていた。'],
    [84,'僕の線を取り消した人と、港で死んだことになった人は、この岸では同じ手で書いていたんだね。'],
    [0,'男はうなずき、あの朝の通知と、それを仕分けた鐘の名簿を並べた。戸を開けて声を返す。欄を守って送り先を預かる。どちらにも選ばせず、名簿を海へ沈める。どれも自分の手で届ける返事だった。'],
    [84,'誰かの名を返したら、誰の暮らしが動くか分からない。それでも僕は、ここで返事をする。']
  ];
  const choices=Object.entries(endings).map(([key,e])=>({label:e.label,detail:e.detail,action:()=>finishEnding(key,false)}));
  conversation(lines,choices);
}

function finishEnding(key, replay=false) {
  const ending=endings[key];
  const first=!state.ending;
  if(first) {
    state.flags.endingRecord=captureEnding(state);
    state.ending=key;state.chapter=story.length-1;
    state.flags.finalePending=true;state.history.unshift('結末「'+ending.title+'」');
    save();
  } else if(!state.flags.endingRecord) {
    state.flags.endingRecord=captureEnding(state);
    save();
  }
  audio.scene('ending');
  audio.effect('victory');
  const lines=endingScene(key,state);
  const choices=[{label:replay?'手帳に戻る':'潮の跡へ',primary:true,action:()=>{
    closeStory();
    if(replay){audio.scene(mapMusic(currentMap));return;}
    state.flags.finalePending=false;
    save();
    transition('lastwharf',{x:423,y:411,face:3});
  }}];
  conversation(lines,choices);
  storyView.classList.add('finale');
}

const epilogueHunts = [44,40,56,89,72,75,103,102,109];

function postCard() {
  if(!state.ending){conversation([[0,'木札に塩がついている。下の文字が読めない。']]);return;}
  if(!state.flags.epilogue) {
    conversation(endingAftermath(state.ending,state),[],()=>{
      state.flags.epilogue=true;
      state.history.unshift('鐘の向こうに残った二通を追う。');
      save();refreshMap();notify('潮の外への道が開いた。','success');
    });
    return;
  }
  const num=count(state.flags,'hunts');
  const id=epilogueHunts[num%epilogueHunts.length];
  const current=monsterDefs[id]?id:41;
  const loot=num===0?{tool_044:2}:num===3?{mat_092:1}:num===8?{mat_093:1}:{mat_084:1};
  conversation([[0,'白い札の裏には「'+monsterDefs[current][0]+'」の目撃記録。戻った便　'+num+'。']],[
    {label:'その便を迎えに行く',detail:'この岸へ便を呼び、木札のそばで迎え撃つ',action:()=>showBattle([current],{
      tier:5+Math.min(7,num),title:'戻らなかった便',boss:true,loot,progress:'hunt',hunt:num
    })},{label:'札を置く',action:closeStory}
  ]);
}

function postSeal(target) {
  if(!state.flags.epilogue) {conversation([[0,'目を閉じても残る小さな光。まだ受取人がいない。']]);return;}
  if(state.flags[target.id]) {conversation([[0,'この手紙を開いたときから、静かなままだ。']]);return;}
  conversation([[84,target.text??'封をした者は、この先から呼んでいる。']],[
    {label:'届かなかった封を開く',action:()=>showBattle(target.boss,{boss:true,title:target.label,loot:target.loot,progress:'post',seal:target.id})},{label:'離れる',action:closeStory}
  ]);
}

function completeTrace(q) {
  state.flags['errand-'+q.town]=2;
  save();
  audio.effect('success');
  conversation([[84,'確かめた。来た道を戻って、札の裏に渡そう。']]);
}

function errandCard(q) {
  const key='errand-'+q.town, phase=count(state.flags,key);
  if(phase===3){conversation([[0,state.clues[key]==='returned'?q.reply:q.take]]);return;}
  if(phase===1){conversation([[0,q.hint]]);return;}
  if(phase===2){
    const decide=(returned)=>{
      state.flags[key]=3;
      state.clues[key]=returned?'returned':'sold';
      state.ethic+=returned?3:-3;
      state.coins+=returned?Math.ceil(q.pay*.54):q.pay;
      state.reputation[q.town]=count(state.reputation,q.town)+(returned?3:-2);
      if(returned) gain(q.town==='port'?'mat_005':q.town==='lastwharf'?'mat_092':'mat_045',1);
      state.history.unshift('寄り道「'+q.label+'」を終えた。');
      save();audio.effect(returned?'success':'coin');
      conversation([[0,returned?q.reply:q.take]]);
    };
    conversation([[84,'ここで受け取る人を、ずっと待っていたんだね。']],[
      {label:'札に書かれた場所へ返す',detail:'町の評判が上がる。礼と材料を受け取る',action:()=>decide(true)},
      {label:'買い手へ回す',detail:'銀'+q.pay+'を受け取る。町で不審に思われる',action:()=>decide(false)}
    ]);
    return;
  }
  conversation([[0,q.start]],[
    {label:'手帳に控える',detail:q.hint,action:()=>{
      state.flags[key]=1;save();
      conversation([[84,q.hint]]);
    }},
    {label:'その場を離れる',action:closeStory}
  ]);
}

function findTrace(q) {
  const use=state.party.map(person).find(p=>p.art==='listen'||p.art==='comfort');
  const choice=use?
    {label:'静かに取り出す',detail:use.name+'が合図を待つ。戦わずに品を得る',action:()=>completeTrace(q)}:
    {label:'灯を置いて待つ',detail:'露草の包みを一束使い、来たものを静める',disabled:!count(state.inventory,'tool_004'),action:()=>{gain('tool_004',-1);completeTrace(q);}};
  conversation([[0,q.found]],[
    choice,
    {label:'隠れているものを追う',detail:'戦って来た道を空ける',action:()=>showBattle([q.monster],{
      boss:true,title:q.trace,progress:'errand',region:q.town
    })},
    {label:'あとにする',action:closeStory}
  ]);
}

function progressAt(records,id) {
  const saved=records[id];
  if(!saved||!Number.isSafeInteger(saved.step)||saved.step<0||!saved.choices||typeof saved.choices!=='object') {
    records[id]={step:0,choices:{}};
  }
  return records[id];
}

function voyageAvailable(arc) {
  return !!arc&&state.chapter>=arc.chapter&&(!arc.post||!!state.ending)&&
    (arc.requires??[]).every(id=>voyages[id]&&state.voyages[id]?.step>=voyages[id].stages.length);
}

function trialsAvailable() {
  const last=journeys['12-room'];
  return !!state.ending&&!!last&&state.voyages[last.id]?.step>=last.stages.length;
}

function trialScene(trial,index) {
  if(!trialsAvailable()||currentMap.id!=='lastwharf'||state.flags['trial-'+trial.id]) return;
  if(index&&!state.flags['trial-'+trials[index-1].id]) return;
  const title=trial.title;
  conversation(trial.brief,[{label:'挑戦する',detail:'目安レベル '+trial.level+'　隊列 '+partyLevel(),action:()=>{
    showBattle(trial.enemies,{encounterLevel:trial.level,tier:10,boss:true,quick:false,title,progress:'trial',trialId:trial.id});
  }},{label:'支度をする',action:closeStory}]);
}

function voyageChoiceReady(option,progress) {
  return Object.entries(option.requires??{}).every(([step,keys])=>
    (Array.isArray(keys)?keys:[keys]).includes(progress.choices[step]));
}

function takeLoot(loot) {
  const found=[];
  for(const [id,amount] of Object.entries(loot??{})){
    if(!registry.items.has(id)||!Number.isFinite(amount)||amount<=0||collectorGear.has(id)) continue;
    gain(id,amount);
    found.push(registry.items.get(id).name+' ×'+amount);
  }
  return found;
}

function availablePages(lines,companions=state.party) {
  return (lines??[]).filter(([id])=>id===0||id===hero||companions.includes(id)&&!state.lost[id]);
}

function finishVoyage(id,index,selection) {
  const arc=voyages[id],stage=arc?.stages[index];
  const choice=stage?.choices.find(option=>option.key===selection);
  if(!choice||choice.incorrect||!voyageAvailable(arc)) return;
  const progress=progressAt(state.voyages,id);
  if(progress.step!==index||!voyageChoiceReady(choice,progress)) return;
  progress.choices[stage.key]=selection;
  progress.step++;
  state.ethic+=choice.ethic??0;
  state.coins=Math.max(0,state.coins+(choice.coins??0));
  if(choice.rep) state.reputation[arc.home]=clamp(count(state.reputation,arc.home)+choice.rep,-20,20);
  const recovered=takeLoot({...choice.battle?.loot,...choice.loot});
  const lines=availablePages([...(choice.reply??[]),...(stage.after??[])]);
  const completed=progress.step===arc.stages.length;
  if(completed) state.history.unshift('寄り道「'+arc.title+'」を終えた。');
  if(arc.acts){
    let portion=0;
    if(index===0) portion=.58;
    else if(completed) portion=.92;
    else if(!choice.battle&&arc.acts.some(wing=>wing.at(-1)===stage)) portion=.25;
    if(portion) lines.push(...fieldExperience(plannedXp(arc.level,portion)));
  }
  save();
  if(recovered.length) lines.push([0,recovered.join('　')+'を手に入れた。']);
  if(lines.length) conversation(lines);
  else closeStory();
  audio.effect(recovered.length?'chest':'success');
}

function voyageScene(target,retry=false) {
  const arc=voyages[target.arc];
  if(!voyageAvailable(arc)) {conversation([[0,'今はまだ、この手がかりをたどれない。']]);return;}
  const progress=progressAt(state.voyages,arc.id);
  const index=arc.stages.findIndex(stage=>stage.key===target.step);
  const stage=arc.stages[index];
  if(!stage) return;
  if(index!==progress.step){
    const hint=progress.step>0?arc.stages[progress.step]?.hint:null;
    conversation([[0,hint??(index<progress.step?'ここでやるべきことは済んでいる。':'町に残った最初の手がかりを探そう。')]]);
    return;
  }
  const choices=stage.choices.map(option=>({
    label:option.label,
    detail:voyageChoiceReady(option,progress)?option.detail:'ここまでに選んだ手順では行えない',
    disabled:state.coins+(option.coins??0)<0||!voyageChoiceReady(option,progress),
    action:()=>{
      if(option.incorrect){
        audio.effect('failure');
        conversation(availablePages(option.reply),[],()=>voyageScene(target,true));
      } else if(option.battle){
        const action=option.battle;
        const boss=action.boss??(stage.choices.length===1);
        const encounterLevel=arc.acts?(action.level??arc.level):undefined;
        showBattle(action.enemies,{tier:action.tier??arc.tier??currentMap.tier,encounterLevel,boss,quick:false,title:stage.label,
          progress:'voyage',voyageId:arc.id,voyageStep:index,voyageChoice:option.key});
      } else finishVoyage(arc.id,index,option.key);
    }
  }));
  const lines=availablePages(stage.lines);
  conversation(retry?lines.slice(-1):lines,choices);
}

function personalScene(id) {
  const episode=personalEpisodes[id], p=person(id);
  if(!episode||state.chapter<episode.chapter||!state.members.includes(id)||state.lost[id]) return;
  const progress=progressAt(state.personal,id);
  const scene=episode.scenes[progress.step];
  const hearing=[p.id,hero];
  if(!scene) {conversation([[id,publicEvidence(p,state)]]);return;}
  const index=progress.step;
  const finish=choice=>{
    if(progress.step!==index) return;
    progress.step++;
    if(choice){
      progress.choices[index]=choice.key;
      state.ethic+=choice.ethic??0;
    }
    if(progress.step===episode.scenes.length){
      state.history.unshift('仲間の話「'+episode.title+'」を聞いた。');
      memory(id).trust=clamp(memory(id).trust+2,-16,22);
    }
    save();
    const reply=availablePages(choice?.reply,hearing);
    if(reply.length) conversation(reply);
    else closeStory();
  };
  const choices=(scene.choices??[]).map(option=>({label:option.label,detail:option.detail,action:()=>finish(option)}));
  conversation(availablePages(scene.lines,hearing),choices,choices.length?undefined:()=>finish());
}

function pairedCampScene(pair) {
  if(!pair.members.every(id=>state.party.includes(id)&&!state.lost[id])||state.chapter<pair.chapter) return;
  const key='episode-pair-'+pair.id;
  if(state.parley[key]) return;
  const finish=option=>{
    if(state.parley[key]) return;
    state.parley[key]=option?.key??true;
    state.ethic+=option?.ethic??0;
    save();
    const lines=availablePages(option?.reply);
    if(lines.length) conversation(lines);
    else closeStory();
  };
  const choices=(pair.choices??[]).map(option=>({label:option.label,detail:option.detail,action:()=>finish(option)}));
  conversation(availablePages(pair.lines),choices,choices.length?undefined:()=>finish());
}

function companionJourneyReady(episode,members,partyOnly=false) {
  const roster=partyOnly?state.party:state.members;
  return !!episode&&state.chapter>=episode.chapter&&(!episode.post||!!state.ending)&&
    members.every(id=>roster.includes(id)&&!state.lost[id]);
}

function readCompanionJourney(episode,members,key,partyOnly=false) {
  if(!companionJourneyReady(episode,members,partyOnly)) return;
  const table=partyOnly?state.relationshipJourneys:state.companionJourneys;
  const progress=progressAt(table,key),index=progress.step,scene=episode.scenes[index];
  if(!scene||scene.site&&scene.site!==currentMap.id) return;
  const speakers=[hero,...members];
  const finish=choice=>{
    if(progress.step!==index||!companionJourneyReady(episode,members,partyOnly)) return;
    progress.step++;
    if(choice) progress.choices[index]=choice.key;
    const lines=availablePages(choice?.reply,speakers);
    const next=episode.scenes[progress.step];
    if(!next){
      state.history.unshift('夜話「'+episode.title+'」を聞いた。');
      lines.push(...fieldExperience((partyOnly?42:24)+Math.floor(episode.chapter*2)));
    } else if(next.site&&next.site!==currentMap.id){
      lines.push([0,'続きは'+maps[next.site].name+'の宿で聞ける。']);
    }
    save();
    const continueHere=next&&(!next.site||next.site===currentMap.id);
    conversation(lines,[],continueHere?()=>readCompanionJourney(episode,members,key,partyOnly):undefined);
  };
  const choices=(scene.choices??[]).map(option=>({label:option.label,detail:option.detail,action:()=>finish(option)}));
  const followup=scene.followup?.[progress.choices[index-1]]??[];
  conversation(availablePages([...scene.lines,...followup],speakers),choices,choices.length?undefined:()=>finish());
}

function companionJourneyButton(episode,members,key,partyOnly=false) {
  if(!companionJourneyReady(episode,members,partyOnly)) return null;
  const table=partyOnly?state.relationshipJourneys:state.companionJourneys;
  const step=table[key]?.step??0, scene=episode.scenes[step];
  if(!scene) return null;
  const detail=scene.site?maps[scene.site].name+'の宿'+(scene.place?'　'+scene.place:''):(step?'続きを聞く':'夜話を聞く');
  return row(partyOnly?'◇':portrait(members[0]),episode.title,detail,step?'進行中':'未着手',()=>{
    closeMenu();
    if(scene.site&&scene.site!==currentMap.id){
      conversation([[0,maps[scene.site].name+'の宿なら、続きを話せそうだ。']]);
      return;
    }
    readCompanionJourney(episode,members,key,partyOnly);
  });
}

function hearCompanion(id) {
  if(!state.members.includes(id)||state.lost[id]) return;
  const p=person(id);
  closeMenu();
  conversation([[id,publicEvidence(p,state)]],[],()=>{
    state.clues['told-'+id]=1;
    save();
  });
}

function inquiryAvailable(entry) {
  return !!entry&&state.chapter>=entry.chapter&&(!entry.post||!!state.ending);
}

function inquiryState(id) {
  const raw=state.inquiries[id];
  if(!raw||typeof raw!=='object'||!Array.isArray(raw.evidence)){
    state.inquiries[id]={started:false,evidence:[],question:0,verdict:null};
  }
  return state.inquiries[id];
}

function readInquiryClue(target) {
  const entry=inquiries[target.inquiry],clue=entry?.evidence[target.index];
  if(!clue||!inquiryAvailable(entry)) return;
  const progress=inquiryState(entry.id);
  if(!progress.started){
    conversation([[0,'まず'+maps[entry.home].name+'で相談を聞こう。行き先の「地方調査」に記しておく。']]);
    return;
  }
  conversation(availablePages(clue.pages),[],()=>{
    if(!progress.evidence.includes(target.index)){
      progress.evidence.push(target.index);
      save();
      notify('手帳に記録　'+clue.label,'success');
    }
  });
}

function discussInquiry(entry) {
  if(!inquiryAvailable(entry)||currentMap.id!==entry.home) return;
  const progress=inquiryState(entry.id),returnToFile=()=>openMenu('inquiry',{id:entry.id});
  if(progress.verdict!==null) return;
  const question=entry.questions[progress.question];
  if(question){
    if(!question.needs.every(index=>progress.evidence.includes(index))) return;
    const choices=question.answers.map((option,index)=>({label:option.label,detail:option.detail,action:()=>{
      if(index!==question.correct){
        audio.effect('failure');
        conversation(availablePages(option.reply),[],returnToFile);
        return;
      }
      progress.question++;
      save();
      audio.effect('success');
      conversation(availablePages(question.confirm),[],returnToFile);
    }}));
    conversation(availablePages(question.pages),choices);
    return;
  }
  conversation(availablePages(entry.review),entry.verdicts.map((option,index)=>({
    label:option.label,detail:option.detail,action:()=>{
      if(progress.verdict!==null) return;
      progress.verdict=index;
      state.coins+=option.coins??0;
      const loot=takeLoot(option.loot);
      const lines=availablePages(option.pages);
      if(loot.length) lines.push([0,loot.join('　')+'を手に入れた。']);
      lines.push(...fieldExperience(plannedXp(entry.level,.40)));
      state.history.unshift('地方調査「'+entry.title+'」を終えた。');
      save();
      audio.effect('success');
      conversation(lines,[],returnToFile);
    }
  })));
}

function inspectObject(target) {
  if(target.kind==='adventure-boss'){inspectAdventureBoss(target);return;}
  if(target.kind==='adventure-prep'){prepareAdventureEnding(target.prep);return;}
  if(target.kind==='adventure-rest'){
    conversation([[0,target.text??'風が当たらない。体を横にできそうだ。']],
      [{label:'休む',detail:'体力と気力を回復する',action:()=>{restoreHealth();save();closeStory();notify('体力と気力が満ちた。','heal');}},
        {label:'仲間と話す',action:()=>openMenu('camp')}]);
    return;
  }
  if(target.kind==='adventure-inspect'){
    const a=state.adventure;
    const trails=[];
    if(target.id.endsWith('-mark-3')){
      for(const object of currentMap.objects.filter(o=>o.bossId&&Number(o.bossId.slice(1))>=43)){
        if(object.postgame&&!a.flags.POST||object.appearsAfter?.length&&!object.appearsAfter.some(flag=>a.flags[flag])) continue;
        if(!a.seen['trail-'+object.bossId]) trails.push([84,'近くに跡が残ってる。'+huntBriefs[object.bossId].trail+'だ。']);
        a.seen['trail-'+object.bossId]=true;
      }
    }
    a.seen[target.id]=true;
    save();
    refreshMap();
    if(!trails.length&&companionUI.inspect(target)) return;
    conversation([[0,target.text??target.label],...trails]);
    return;
  }
  if(target.kind==='voyage'){voyageScene(target);return;}
  if(target.kind==='inquiry'){readInquiryClue(target);return;}
  if(target.kind==='errand'){errandCard(errandsByTown[currentMap.id]);return;}
  const quest=errandsByTown[target.errand];
  if(quest&&count(state.flags,'errand-'+quest.town)===1){findTrace(quest);return;}
  if(target.kind==='chest'){
    if(state.chests[target.id]) {notify('中には何も残っていない。');return;}
    state.chests[target.id]=1;
    for(const [id,n] of Object.entries(target.loot??{})) gain(id,n);
    save();
    audio.effect('chest');
    conversation([[0,Object.entries(target.loot??{}).map(([id,n])=>registry.items.get(id).name+' ×'+n).join('\n')]]);
    return;
  }
  if(target.kind==='boss'&&target.chapter===1) {
    if(state.chapter>1){conversation([[0,'もう潮下からの返事はない。']]);return;}
    if(state.chapter<1){conversation([[84,'潮位が合わない。港で時刻を確かめよう。']]);return;}
    conversation([[84,'封と同じ刻みだ。……石の内側から、水音がする。']],[{label:'石祠を開く',action:()=>showBattle(target.boss,{boss:true,title:'石祠の奥',loot:{tool_024:1},progress:'shoal'})},{label:'離れる',action:closeStory}]);
    return;
  }
  if(target.kind==='boss'&&chapterSeal(target)) return;
  if(target.kind==='boss'&&target.postgame){postSeal(target);return;}
  if(target.kind==='post'){postCard();return;}
  if(target.kind==='proof'){
    if(state.chapter<target.chapter) {conversation([[84,'どちらを上にして読めばいいんだろう。']]);return;}
    const c=chapters[target.chapter],was=!state.clues['proof-'+target.chapter];
    state.clues['proof-'+target.chapter]=true;save();
    if(was) audio.effect('success');
    conversation([[0,c.proof]]);
    return;
  }
  if(target.shop){openMenu('shop');return;}
  const free=state.coins<12;
  const choices=target.inn?[{label:free?'裏口で休む':'宿を借りる　銀12',detail:free?'体力と気力を回復。明朝まで台所を手伝う':'体力と気力を回復。次の潮まで休む',action:()=>{
    if(!free) state.coins-=12;
    state.tide+=free?2:1;restoreHealth();save();closeStory();refreshMap();notify('体力と気力が満ちた。','heal');
  }},...(state.members.length>1||personalEpisodes[hero]?.chapter<=state.chapter?
      [{label:'仲間と話す',detail:'宿の椅子を囲む',action:()=>openMenu('camp')}]:[]),{label:'立ち去る',action:closeStory}]:[];
  conversation([[0,target.text??'冷たい石に、潮が白く残っている。']],choices);
}

function interact(target) {
  if(!active()) return;
  const p=view.player;
  p.face=Math.abs(target.x-p.x)>Math.abs(target.y-p.y)?target.x<p.x?1:2:target.y<p.y?3:0;
  if(target.type==='exit'){
    if(currentMap.adventure){
      adventureExit(target);
      return;
    }
    if(target.voyage){
      const arc=voyages[target.voyage];
      if(!voyageAvailable(arc)||progressAt(state.voyages,arc.id).step<(target.minStep??0)){
        notify('この先へ進むための手がかりが揃っていない。');return;
      }
    } else if(target.post&&!state.flags.epilogue) {notify('岸へ返事が届くまで、ここからは進めない。');return;}
    transition(target.id,target.spawn);return;
  }
  if(target.type==='person'){
    focusedPerson=target;
    if(currentMap.adventure){
      if(target.adventureResident) adventureResident(target);
      else adventurePerson(target);
    } else visitedP(person(target.id));
    return;
  }
  inspectObject(target);
}

function adventureExit(target) {
  const design=state.adventure;
  const flags=design.flags;
  function pass(){
    if(target.adventureAction){
      flags[target.adventureAction]=true;
      save();
    }
    transition(target.id,target.spawn);
  }
  if(adventureExitAvailable(target)){pass();return;}
  const gates=String(target.adventureGate).split(',');
  const shortcut=gates.find(flag=>/^Q\d+$/.test(flag)&&!flags[flag]);
  if(shortcut&&gates.every(flag=>flag==='START'||flag===shortcut||flags[flag])){
    const level=maps[target.id]?.level;
    conversation([[84,'ここからも行ける。足場は細いし、奥に魔物がいそうだ。']],
      [{label:'足場を踏んで渡る',detail:level?'目安レベル '+level:'危険な近道',action:()=>{flags[shortcut]=true;closeStory();pass();}}]);
    return;
  }
  notify(gates.includes('POST')?'旅の決着がついたら通れる。':'いまは通れない。手帳で次に向かう場所を確かめよう。');
}

function adventureExitAvailable(target) {
  if(!target.adventureGate||adventureGateOpen(state,target.adventureGate)) return true;
  const step=target.adventureAction;
  return /^A\d{2}$/.test(step??'')&&target.adventureGate===step&&Number(step.slice(1))===state.adventure.chapter;
}

function preferredAdventureExit(dest) {
  const visited=new Set([currentMap.id]);
  const queue=[{id:currentMap.id,first:null}];
  for (const entry of queue) {
    if(entry.id===dest) return entry.first;
    for (const exit of maps[entry.id]?.exits??[]) {
      if(visited.has(exit.id)||!adventureExitAvailable(exit)) continue;
      visited.add(exit.id);
      queue.push({id:exit.id,first:entry.first??exit});
    }
  }
  return null;
}

function adventureResident(target) {
  adventureContact(target,null);
}

function adventurePerson(target) {
  const p=person(target.id);
  if(!p) return;
  const a=state.adventure;
  const pending=p.need?.chapter&&!a.flags[p.need.chapter];
  const contact=()=>{
    focusedPerson=target;
    adventureContact(target,pending?{...p,hello:target.role+'の仕事をしている。'}:p);
  };
  const met='met-'+p.id;
  if(!pending&&p.arrival&&!a.seen[met]){
    a.seen[met]=true;
    save();
    conversation([[0,p.arrival],[p.id,p.hello]],[],contact,'field');
  } else contact();
}

const contactCommands=[
  ['verify','聞き出す'],['craft','手伝う'],['bargain','取引'],['shadow','盗む'],
  ['duel','腕試し'],['comfort','慰める'],['threaten','脅す'],['listen','聞き耳']
];

function adventureContact(target,p,kind='verify',actorId=hero){
  view.route=null;view.keys.clear();
  storyView.hidden=false;
  storyView.classList.add('field-mode');
  storyView.replaceChildren();
  const a=state.adventure;
  const local=target.name??p.name;
  const actor=battleActor(actorId);
  const rank=target.level??Math.max(2,(a.chapter-1)*4+2);
  const key='contact-'+target.id;
  const memory=(a.seen[key]??={uses:{},warnUntil:0});
  const day=currentDay();
  const ratio=(diff,base)=>clamp(base+diff*4,12,96);
  const goods={craft:['tool_004'],bargain:['tool_004','tool_012','tool_005'],shadow:['tool_012','mat_012','tool_004'],
    comfort:['tool_012'],threaten:['mat_005']};
  const specs={
    verify:{detail:p?.hello??target.text??'何を聞きたい？',certain:true,label:'事情を聞く',success:'顔を見て、話を聞いた。'},
    craft:{detail:'その場の仕事を手伝い、お礼を受け取る。',certain:true,label:'手伝う',success:'一仕事ぶん、お礼を受け取った。'},
    bargain:{detail:'銀を払って道具を手に入れる。',certain:true,label:'買う'},
    shadow:{detail:'見つからずに品を取れそうか見る。',chance:ratio(actor.level-rank,49),label:'盗む',risk:'この人が明日まで話してくれなくなる。'},
    duel:{detail:memory.hunt===undefined?'町の外で魔物を一団倒し、腕を見せる。':'町の外で戦ったあとに報告できる。',
      certain:true,label:memory.hunt===undefined?'腕試しを引き受ける':'勝ったことを話す',risk:null},
    comfort:{detail:'隣で話を聞くと、手当ての品を分けてもらえる。',certain:true,label:'隣に座る',success:'少し話をして、分けてもらった。'},
    threaten:{detail:'脅して品を求める。',chance:ratio(actor.level-rank,56),label:'脅す',risk:'言い返されると、銀を払って謝る。'},
    listen:{detail:'近くに立ち、外へ向かう人の話を聞く。',certain:true,label:'話に耳を傾ける',success:'町から出る人が、足元の固い方を教えてくれた。'}
  };
  const box=el('div','contact-box');
  const meta=el('div','contact-title'),identity=el('div');
  identity.append(el('b',null,local+'　Lv '+rank),el('small',null,p?.role??target.role??'町の人'));
  const close=button('×',closeStory,'round-button');
  close.setAttribute('aria-label','働きかけを閉じる');
  meta.append(portrait(target.sprite??p.id,.67),identity,close);
  const commands=el('div','contact-commands');
  for(const [code,label] of contactCommands){
    const control=button(label,()=>adventureContact(target,p,code,actorId),'game-button');
    control.setAttribute('aria-pressed',String(code===kind));
    const spec=specs[code];
    control.append(el('small',null,spec.chance?spec.chance+'％':code==='bargain'?'銀で買う':code==='duel'?'町の外':'確実'));
    commands.append(control);
  }
  const content=el('div','contact-content');
  const partner=el('div','contact-partner');
  const changeActor=()=>{const next=state.party[(state.party.indexOf(actorId)+1)%state.party.length];adventureContact(target,p,kind,next);};
  partner.append(portrait(actorId,.47),el('strong',null,'担当 '+actor.name+'　Lv '+actor.level));
  if(state.party.length>1) partner.append(button('交代',changeActor,'game-button'));
  content.append(partner);
  const selected=specs[kind];
  const entries=goods[kind]??[null];
  for(const [i,id] of entries.entries()){
    const item=registry.items.get(id),price=10+12*i;
    const chance=selected.chance?clamp(selected.chance+i*9,12,96):0;
    const offer=el('div','contact-offer'),desc=el('div');
    desc.append(el('b',null,item?.name??selected.label),el('small',null,item?(kind==='bargain'?'銀 '+price:chance?'成功 '+chance+'％':selected.detail):selected.detail));
    const oneUse=!['verify','listen','bargain','duel'].includes(kind);
    const blocked=memory.warnUntil>=day;
    const unavailable=(kind==='bargain'&&state.coins<price)||(kind==='duel'&&memory.hunt!==undefined&&memory.hunt>=state.wins);
    const activate=()=>{
      if(blocked||unavailable||oneUse&&memory.uses[kind]===day) return;
      if(oneUse) memory.uses[kind]=day;
      if(chance&&Math.random()*100>=chance){
        if(kind==='shadow') memory.warnUntil=day;
        if(kind==='threaten') state.coins=Math.max(0,state.coins-18);
        save();notify(kind==='shadow'?'気づかれた。今日は話せない。':'銀を払ってその場を離れた。','failure');
      } else if(kind==='duel'){
        if(memory.hunt===undefined) {memory.hunt=state.wins;notify('町の外で一団を倒してから、ここへ戻ろう。');}
        else {delete memory.hunt;state.coins+=22;notify('腕試しの礼に銀22を受け取った。','coin');}
        save();
      } else {
        if(kind==='bargain') state.coins-=price;
        if(id) gain(id,1);
        if(kind==='verify'||kind==='listen') notify(kind==='verify'?selected.detail:selected.success);
        else notify(item.name+'を手に入れた。','success');
        save();
      }
      adventureContact(target,p,kind,actorId);
    };
    offer.append(id?icon(id):el('i','sheet-art','◇'),desc,button(selected.label,activate,'game-button',blocked||unavailable||oneUse&&memory.uses[kind]===day));
    content.append(offer);
  }
  if(p?.need?.kind==='adventure'){
    const ready=recruitmentReady(p.id,state);
    const recruit=el('div','contact-offer'),desc=el('div');
    desc.append(el('b',null,'旅に誘う'),el('small',null,p.need.label+(ready?'':'。必要なことを聞ける。')));
    recruit.append(portrait(p.id,.55),desc,button('話す',()=>companionUI.recruit(p),'game-button',blockedContact(memory,day)));
    content.append(recruit);
  }
  box.append(meta,commands,content);
  if(selected.risk||memory.warnUntil>=day) box.append(el('p','contact-risk',memory.warnUntil>=day?'今日は話せない。宿で休むと日を進められる。':'失敗すると　'+selected.risk));
  storyView.append(box);
  const origin=$('game').getBoundingClientRect().top;
  view.focusTalk(target,box.getBoundingClientRect().top-origin,$('place').getBoundingClientRect().bottom-origin+8);
  keepAdventureScroll(content,`contact:${target.id}:${kind}`);
}

const blockedContact=(memory,day)=>memory.warnUntil>=day;

const adventureBossCode = chapter => `B${String(chapter).padStart(2,'0')}`;

function inspectAdventureBoss(target) {
  const a=state.adventure;
  const boss=adventureBosses[target.bossId];
  if(!a||!boss) return;
  if(!boss.chapter) {inspectAdventureHunt(target,boss);return;}
  if(a.chapter!==boss.chapter||a.ending){notify('ここはもう通れる。');return;}
  if(a.cleared[target.bossId]) {resolveAdventureChapter(boss.chapter);return;}
  const chapter=adventureChapters[boss.chapter];
  const name=target.label??boss.title;
  const begin=()=>showBattle([boss.monsterId],{boss:true,adventureBattle:true,adventureBoss:target.bossId,
    encounterLevel:boss.level,title:name});
  const ask=()=>conversation([[0,boss.tell??'奥から大きな足音が聞こえる。']],
    [{label:'戦う',detail:'目安レベル '+boss.level,primary:true,action:begin},
      {label:'支度をする',action:closeStory}]);
  if(a.seen[target.bossId]) ask();
  else conversation(chapter.approach,[],()=>{a.seen[target.bossId]=true;save();ask();});
}

function inspectAdventureHunt(target,boss) {
  if(!adventureObjectVisible(target)){notify('足場の奥はまだ静かだ。');return;}
  const brief=huntBriefs[boss.id];
  const repeat=state.adventure.cleared[boss.id];
  const fight=edge=>showBattle([boss.monsterId],{boss:true,adventureBattle:true,adventureBoss:boss.id,encounterLevel:boss.level,
    huntEdge:edge,title:target.label??boss.title,quick:!!repeat});
  conversation([[0,(repeat?'戻ってみると、同じあたりから音がする。':'足元に、'+brief.trail+'がある。')],[0,boss.tell+'。']],
    [{label:brief.first,detail:huntEdge[brief.a].label,primary:true,action:()=>fight(brief.a)},
    {label:brief.second,detail:huntEdge[brief.b].label,action:()=>fight(brief.b)},{label:'ここから離れる',action:closeStory}]);
}

function prepareAdventureEnding(prep) {
  const {flags}=state.adventure;
  if(prep==='G01'){
    if(!flags.C05||flags.W03){notify(flags.W03?'火を持ち出した場所だ。':'まだ煙が入ってくる。');return;}
    flags.G01=true;
    save();
    conversation([['火の番','風を受けないよう囲ったよ。この火なら、舟が帰る時の目印になる。']]);
  } else if(prep==='oar'){
    if(!flags.C08){notify('まだ外浜の舟を動かせない。');return;}
    flags.oar=true;
    save();
    conversation([[84,'沖へ出るなら、この長さの櫂だ。持っていこう。']]);
  } else if(prep==='G02'){
    if(!flags.C10||flags.W05||!flags.oar){
      notify(flags.W05?'舟は流れてしまった。':!flags.C10?'まず浜の人を上へ逃がそう。':'角舟町の外浜で長い櫂を探そう。');
      return;
    }
    flags.G02=true;
    save();
    conversation([['舟番','これで沖の岩までこげる。必要になったら使ってくれ。']]);
  }
}

function resolveAdventureChapter(chapter) {
  const a=state.adventure;
  if(!a||chapter!==a.chapter||a.ending) return;
  if(chapter===12){finishAdventureShore();return;}
  const scene=adventureChapters[chapter];
  const finish=()=>conversation(scene.aftermath,[],()=>{
    a.flags[adventureChapterCode(chapter)]=true;
    a.chapter++;
    state.chapter=Math.min(a.chapter,story.length-1);
    restoreHealth(false);
    state.history.unshift(scene.title+'を終えた。');
    save();
    refreshMap();
    notify('手帳を更新　'+adventureChapters[a.chapter].title,'success');
  });
  const c=scene.choice;
  if(c&&a.choices[c.code]!==undefined){
    conversation(a.choices[c.code]?(c.code==='heardEna'?c.goodLines:c.badLines):(c.code==='heardEna'?c.badLines:c.goodLines),[],finish);
    return;
  }
  if(!c) {finish();return;}
  const decide=takeBad=>{
    if(a.choices[c.code]!==undefined) return;
    const set=c.code==='heardEna'?!takeBad:takeBad;
    a.choices[c.code]=set;
    a.flags[c.code]=set;
    if(takeBad){
      const prize={W01:'eq_ring_03',W02:'eq_bow_08',W03:'eq_sword_07',W06:'eq_sword_09'}[c.code];
      if(prize&&registry.equipment.has(prize)) gain(prize,1);
      for(const [id,reason] of chapterDepartures(a.flags)) if(state.members.includes(id)) lost(id,reason);
    }
    save();
    conversation(takeBad?c.badLines:c.goodLines,[],finish);
  };
  conversation([c.question],[{label:c.good,detail:c.goodNote,primary:true,action:()=>decide(false)},
    {label:c.bad,detail:c.badNote,action:()=>conversation([[84,'一度決めたら、やり直せない。']],
      [{label:c.bad,detail:c.badNote,action:()=>decide(true)},{label:'考え直す',action:()=>resolveAdventureChapter(chapter)}])}]);
}

function finishAdventureShore() {
  const a=state.adventure;
  if(a.ending) return;
  const choose=()=>{
    const options=availableAdventureEndings(a,state.members,state.lost);
    conversation([[84,'皆は上に着いた。この子を、どうしよう。']],options.map(o=>({label:o.label,detail:o.note,primary:o.id==='E1',action:()=>{
      if(o.volunteer) conversation([[o.volunteer,o.volunteer===33?'俺が引き受ける。あの岩から山側の岸を見るよ。ここで別れてもいいなら、舟を出す。':
        '私が行くよ。舟着き場が見える岩で待つ。いっしょに旅は続けられないけど、そこなら会いに来られるから。']],
        [{label:'託す',detail:o.note,action:()=>commitAdventureEnding(o)},{label:'考え直す',action:choose}]);
      else conversation([[84,'決めてしまったら、ここへは戻れない。']],
        [{label:o.label,detail:o.note,action:()=>commitAdventureEnding(o)},{label:'考え直す',action:choose}]);
    }})));
  };
  if(a.flags.V12){choose();return;}
  conversation(adventureChapters[12].aftermath,[{label:'高い道へ案内する',primary:true,action:()=>{
    a.flags.V12=true;
    save();
    conversation([['見張り','最後の舟からも上がった。もう誰も下にはいない。']],[],choose);
  }}]);
}

function commitAdventureEnding(option) {
  const a=state.adventure;
  if(a.ending) return;
  a.ending=option.id;
  a.flags.C12=true;
  a.flags.POST=true;
  a.flags.endingRead=false;
  if(option.volunteer) a.choices.volunteer=option.volunteer;
  for(const [id,reason] of chapterDepartures(a.flags,a.ending,option.volunteer)) if(state.members.includes(id)) lost(id,reason);
  restoreHealth();
  save();
  refreshMap();
  showAdventureEnding();
}

function showAdventureEnding() {
  const a=state.adventure;
  const pages=[...adventureEndingPages[a.ending]];
  if(a.ending==='E2') pages.splice(2,0,[a.choices.volunteer,a.choices.volunteer===33?
    '山の方から、最後の舟が見える。みんな帰れたら、こっちから灯を振るよ。':
    '外に出たら、ここも帰る場所にできると思う。舟着き場まで来たら知らせて。']);
  conversation(pages,[],()=>{
    a.flags.endingRead=true;
    save();
    notify('長い旅のあとも、高い道は続いている。','success');
  });
}

const buttons={
  party:['隊列','♙'],gear:['装備','†'],items:['持ち物','◇'],journal:['行き先','⌑'],
  records:['図鑑','◈'],settings:['音と記録','♬']
};

function closeMenu() {
  panels.hidden=true;panels.replaceChildren();menuSession=null;
}

function openMenu(kind='home', args={}) {
  view.route=null;view.keys.clear();closeStory();
  panels.hidden=false;
  menuSession={kind,args};
  drawMenu();
}

function panelFrame(label,back) {
  const panel=el('div','panel'),header=el('div','panel-head');
  const b=button(back?'‹':'×',back??closeMenu,'round-button');
  b.setAttribute('aria-label',back?'戻る':'閉じる');
  header.append(el('h2',null,label),b);
  panel.append(header);panels.replaceChildren(panel);
  return panel;
}

function row(start,name,detail,tail,action,disabled=false) {
  const node=action?button('',action,'menu-row',disabled):el('div','menu-row');
  const first=el('span','row-start');
  if(start instanceof Node) {
    if(start.classList.contains('portrait')) first.classList.add('with-portrait');
    first.append(start);
  }else first.textContent=start;
  const meta=el('span');
  meta.append(el('strong',null,name));
  if(detail instanceof Node) {const small=el('small');small.append(detail);meta.append(small);}
  else if(detail) meta.append(el('small',null,detail));
  node.append(first,meta,el('span','row-end',tail));
  return node;
}

function list(panel, rows, args, limit=6) {
  const max=Math.max(1,Math.ceil(rows.length/limit));
  const page=clamp(args.page??0,0,max-1);
  const r=el('div','menu-list');
  r.append(...rows.slice(page*limit,page*limit+limit));
  panel.append(r);
  if(max>1) {
    const nav=el('div','pager');
    const change=delta=>{args.page=page+delta;drawMenu();};
    const prev=button('‹',()=>change(-1),'page-button',page===0);
    const next=button('›',()=>change(1),'page-button',page===max-1);
    prev.setAttribute('aria-label','前のページ');next.setAttribute('aria-label','次のページ');
    nav.append(prev,el('span',null,(page+1)+' / '+max),next);
    panel.append(nav);
  }
  if(!rows.length) panel.append(el('p','empty','手帳に記録がない。'));
}

function comparison(now,next) {
  const output=el('span','stat-comparison');
  for (const {label,key,percent} of abilityStats) {
    const itemKey=key==='maxHp'?'hp':key==='maxMp'?'mp':key;
    const delta=(next?.[itemKey]??0)-(now?.[itemKey]??0);
    if(delta) {
      const pair=el('span','stat-comparison-pair '+(delta>0?'delta-up':'delta-down'));
      pair.append(el('span',null,label),el('b',null,(delta>0?'＋':'−')+Math.abs(delta)+(percent?'％':'')));
      output.append(pair);
    }
  }
  if(!output.firstChild) output.textContent='数値の変化なし';
  if(next?.attribute) output.append(badge(next.attribute));
  return output;
}

function equipmentCandidates(id,slot) {
  return [...registry.equipment.values()].filter(e=>e.slot===(slot==='装飾2'?'装飾':slot)&&count(state.inventory,e.id)>0&&(e.slot!=='武器'||e.type===TYPES[weapon(id)]));
}

function memberStats(actor) {
  const stats=el('span','member-stats');
  for(const [label,key,maxKey,tint] of [['体力','hp','maxHp','health'],['気力','mp','maxMp','spirit']]){
    const part=el('span','member-resource');
    part.append(el('span','member-stat-label',label),el('strong',null,actor[key]+'/'+actor[maxKey]),bar(actor[key],actor[maxKey],tint));
    stats.append(part);
  }
  return stats;
}

function bar(value,max,tint) {
  const gauge=el('span','ability-gauge '+tint);
  const fill=el('i');
  fill.style.width=clamp(100*value/Math.max(1,max),0,100)+'%';
  gauge.append(fill);
  gauge.setAttribute('aria-hidden','true');
  return gauge;
}

function memberSummary(actor) {
  const panel=el('div','panel-summary member-summary');
  const data=el('div','member-summary-content'),name=el('div','member-summary-name');
  name.append(el('b',null,actor.name),el('span','level-tag','レベル '+actor.level));
  data.append(name,memberStats(actor),el('small',null,'物理攻撃 '+actor.attack+'　魔法攻撃 '+actor.magicAttack+'　素早さ '+actor.speed));
  panel.append(portrait(actor.id),data);
  return panel;
}

function memberRow(id,detail,tail,action,disabled=false) {
  const actor=battleActor(id);
  const data=el('span','member-row-data');
  data.append(el('span','level-tag','レベル '+actor.level));
  if(detail==='health') data.append(memberStats(actor));
  else if(detail) data.append(el('span','member-row-detail',detail));
  const node=row(portrait(id),actor.name,data,tail,action,disabled);
  node.classList.add('member-row');
  return node;
}

function destinationForChapter() {
  if(state.adventure) return state.adventure.ending?null:maps[adventureChapters[state.adventure.chapter].site];
  const c=chapters[state.chapter];
  if(c) return maps[c.site];
  if(state.chapter===1) return maps.shoal;
  if(state.chapter===10) return maps.deep;
  return null;
}

function buildStatus(panel,id) {
  const actor=battleActor(id),p=person(id),data=memberData(id);
  panel.classList.add('status-panel');
  const profile=el('div','status-profile'),identity=el('div','status-identity');
  const rank=el('strong','status-rank','レベル '+actor.level);
  const currentStart=startingXp(actor.level),nextStart=startingXp(actor.level+1);
  const experience=el('div','status-experience');
  experience.append(el('span',null,'次のレベルまで'),el('b',null,(nextStart-actor.xp).toLocaleString('ja-JP')));
  const talent=el('div','status-talent');
  talent.append(el('span',null,'特技'),el('b',null,fieldArts[p.art]?.label??p.role));
  identity.append(rank,el('span','status-role',combatRole(id)),experience,bar(actor.xp-currentStart,nextStart-currentStart,'experience'),talent);
  profile.append(portrait(id,2),identity);
  panel.append(profile);

  const attributes=el('div','status-attributes');
  for(const stat of abilityStats){
    const {key,label,short,percent,tint}=stat;
    const line=el('div','status-attribute');
    const resource=key==='maxHp'?'hp':key==='maxMp'?'mp':null;
    const value=resource?actor[resource]+'/'+actor[key]:actor[key]+(percent?'％':'');
    line.append(el('span',null,short??label),el('b',null,value),
      bar(resource?actor[resource]:actor[key],resource?actor[key]:statCeiling(key,actor.level),tint));
    attributes.append(line);
  }
  panel.append(attributes);

  const gear=el('section','status-equipment');
  gear.append(el('h3',null,'装備'));
  const equipment=el('div','status-equipment-list');
  for(const slot of SLOT){
    const item=registry.equipment.get(data.equip[slot]);
    const line=el('div','status-equipment-row');
    line.append(el('span',null,slot),item?icon(item.id):el('i','status-empty-icon'),el('b',null,item?.name??'なし'));
    equipment.append(line);
  }
  gear.append(equipment);
  panel.append(gear);

  const skills=el('section','status-skills');
  skills.append(el('h3',null,'覚えた技・これから覚える技'));
  const skillList=el('div','status-skill-list');
  skillList.tabIndex=0;
  skillList.setAttribute('aria-label','習得した技と、これから覚える技の一覧');
  for(const skill of actor.repertoire){
    const unlocked=skill.learn<=actor.level;
    const line=el('div','status-skill-row'+(unlocked?'':' future'));
    const mark=attributeInfo(skill.attribute);
    const symbol=el('span','status-skill-mark',mark.glyph);
    symbol.style.color=mark.color;
    symbol.setAttribute('aria-label',mark.name);
    const title=el('b',skill.signature?'signature':'',skill.name);
    if(skill.signature) title.setAttribute('aria-label',skill.name+'、決め技');
    line.append(symbol,title,el('span','status-skill-note',skill.note),
      el('span','status-skill-level',unlocked?'習得済み':'レベル '+skill.learn));
    skillList.append(line);
  }
  skills.append(skillList);
  panel.append(skills);
}

const adventureListPositions=new Map();

function keepAdventureScroll(list,key) {
  list.addEventListener('scroll',()=>adventureListPositions.set(key,list.scrollTop),{passive:true});
  list.scrollTop=adventureListPositions.get(key)??0;
}

function adventureStatusFrame(label,actor,back) {
  const panel=panelFrame(label,back);
  panel.classList.add('adventure-sheet');
  const header=panel.querySelector('.panel-head');
  header.prepend(header.querySelector('button'));
  const members=el('div','sheet-members');
  const shown=state.party.includes(actor.id)?state.party:[...state.party.slice(0,3),actor.id];
  for(const id of shown){
    const selector=button('',()=>openMenu('adventure-status',{id,tab:menuSession?.args.tab??'status'}),'sheet-member');
    selector.setAttribute('aria-label',person(id).name+'のステータス');
    selector.setAttribute('aria-pressed',String(id===actor.id));
    selector.append(portrait(id,.55));
    members.append(selector);
  }
  header.append(members);
  return panel;
}

function adventureProfile(actor,compact=false) {
  const p=person(actor.id),profile=el('div','sheet-profile'+(compact?' compact':''));
  const meta=el('div','sheet-identity'),headline=el('div','sheet-headline');
  const level=el('span','sheet-level','レベル ');
  level.append(el('strong',null,actor.level));
  headline.append(el('b',null,actor.name),level);
  const role=el('div','sheet-role');
  role.append(el('span',null,combatRole(actor.id,p.adventureKit)),badge(actor.attribute));
  meta.append(headline,role);
  const row=el('div','sheet-xp');
  if(compact) row.append(el('span',null,'気力'),el('b',null,actor.mp+'/'+actor.maxMp));
  else {
    const start=startingXp(actor.level),next=startingXp(actor.level+1);
    row.append(el('span',null,'次のレベルまで'),el('b',null,(next-actor.xp).toLocaleString('ja-JP')));
    meta.append(row,bar(actor.xp-start,next-start,'experience'));
  }
  if(compact) meta.append(row);
  profile.append(portrait(actor.id,compact?.8:1.35),meta);
  return profile;
}

function showAdventureStatus({id,tab='status',from='party'}) {
  const actor=battleActor(id),data=memberData(id);
  const panel=adventureStatusFrame('ステータス',actor,()=>openMenu(from));
  panel.append(adventureProfile(actor,tab==='skills'));
  if(tab==='status'){
    const meters=el('div','sheet-meter-list');
    for(const [label,theme,value,max] of [['体力','health',actor.hp,actor.maxHp],['気力','spirit',actor.mp,actor.maxMp]]){
      const line=el('div','sheet-meter');
      line.append(el('span',null,label),bar(value,max,theme),el('strong',null,value+'/'+max));
      meters.append(line);
    }
    panel.append(meters);
  }
  const tabs=el('div','sheet-tabs');
  for(const [value,label] of [['status','ステータス'],['skills','技']]){
    const control=button(label,()=>openMenu('adventure-status',{id,tab:value,from}),'sheet-tab');
    control.setAttribute('aria-pressed',String(tab===value));
    tabs.append(control);
  }
  panel.append(tabs);
  if(tab==='skills'){
    const listArea=el('div','sheet-list sheet-skills');
    let titled=false;
    for(const skill of actor.repertoire){
      const learned=skill.learn<=actor.level;
      if(!learned&&!titled){listArea.append(el('h3',null,'これから覚える'));titled=true;}
      const art=attributeInfo(skill.attribute);
      const mark=el('i','sheet-art',art.glyph);mark.style.color=art.color;
      const label=el('span','sheet-line-title');
      const name=el('b',null,skill.name);
      if(skill.signature) name.append(el('small','sheet-signature','決め技'));
      label.append(name,el('small',null,skill.note??''));
      const line=el('div','sheet-line'+(learned?'':' future')+(skill.signature?' signature':''));
      line.append(mark,label,el('strong','sheet-cost',learned?'気力 '+skill.cost:'Lv '+skill.learn));
      listArea.append(line);
    }
    panel.append(listArea);
    keepAdventureScroll(listArea,`skills:${id}`);
    return;
  }
  const stats=el('div','sheet-stats');
  for(const key of ['attack','magicAttack','defense','magicDefense','speed','accuracy','evasion','crit']){
    const spec=abilityStats.find(stat=>stat.key===key);
    const line=el('div','sheet-stat');
    line.append(el('span',null,spec.label),el('b',null,actor[key]+(spec.percent?'％':'')),bar(actor[key],statCeiling(key,actor.level),spec.tint));
    stats.append(line);
  }
  panel.append(stats,el('h3',null,'装備'));
  const equipped=el('div','sheet-list sheet-equipment');
  for (const slot of ADVENTURE_SLOTS){
    const item=registry.equipment.get(data.equip[slot]);
    const control=button('',()=>openMenu('adventure-equip',{id,slot,from}),'sheet-line sheet-gear-row');
    const bonus=item?comparison(null,item):el('span');
    control.append(el('span','sheet-slot',slot==='装飾2'?'装飾':slot),item?icon(item.id):el('i','sheet-art'),
      el('b',null,item?.name??'なし'),bonus,el('span','sheet-arrow','›'));
    equipped.append(control);
  }
  panel.append(equipped);
  keepAdventureScroll(equipped,`gear:${id}`);
  if(id!==hero){
    const index=state.party.indexOf(id);
    panel.append(button(index<0?'隊列に加える':'待機に移す',()=>{
      if(index<0&&state.party.length===4){openMenu('party-swap',{id});return;}
      if(index<0) state.party.push(id);
      else state.party.splice(index,1);
      save();openMenu('party');
    },'game-button sheet-party-action'));
  }
}

function showAdventureEquipment({id,slot,from='party',focus,resumeLoot}) {
  const actor=battleActor(id),data=memberData(id),old=registry.equipment.get(data.equip[slot]);
  const back=()=>resumeLoot?openMenu('adventure-loot',resumeLoot):openMenu('adventure-status',{id,from});
  const panel=adventureStatusFrame((slot==='装飾2'?'装飾':slot)+'を選ぶ',actor,back);
  const current=el('div','sheet-current');
  current.append(el('span',null,'いまの装備'),old?icon(old.id):el('i','sheet-art'),el('b',null,old?.name??'なし'));
  panel.append(current,el('small','sheet-instruction','タップで付け替えて戻る'));
  const listArea=el('div','sheet-list sheet-choices');
  const candidates=equipmentCandidates(id,slot);
  if(focus) candidates.sort((a,b)=>Number(b.id===focus)-Number(a.id===focus));
  const select=next=>{
    if(old) gain(old.id,1);
    if(next){gain(next.id,-1);data.equip[slot]=next.id;}
    else delete data.equip[slot];
    save();audio.effect('click');back();
  };
  if(old) listArea.append(row(icon(old.id),old.name,old.effectLabel??'','装備中'));
  for(const item of candidates){
    const detail=el('span','sheet-compare-detail');
    detail.append(comparison(old,item));
    if(item.effectLabel) detail.append(el('small',null,item.effectLabel));
    listArea.append(row(icon(item.id),item.name,detail,item.rarity??lookup(item.id).レア度,()=>select(item)));
  }
  if(old&&slot!=='武器') listArea.append(row('−','外す',comparison(old,null),'',()=>select(null)));
  if(!candidates.length&&!old) listArea.append(el('p','empty','付けられる装備はまだない。'));
  panel.append(listArea);
  keepAdventureScroll(listArea,focus?`loot:${id}:${slot}`:`choose:${id}:${slot}`);
}

function showAdventureLoot(args) {
  const panel=panelFrame('手に入れた装備',()=>{closeMenu();args.after?.();});
  panel.classList.add('adventure-sheet');
  const items=el('div','sheet-list sheet-choices');
  for(const found of args.found){
    const item=registry.equipment.get(found.id);
    if(!item) continue;
    items.append(row(icon(item.id),item.name,item.effectLabel,item.rarity));
    const possible=state.members.filter(id=>equipmentCandidates(id,item.slot).some(candidate=>candidate.id===item.id));
    for(const id of possible){
      const old=registry.equipment.get(memberData(id).equip[item.slot]);
      items.append(row(portrait(id,.7),person(id).name,comparison(old,item),'比べる',()=>openMenu('adventure-equip',{
        id,slot:item.slot,focus:item.id,resumeLoot:args
      })));
    }
  }
  panel.append(items,button('旅に戻る',()=>{closeMenu();args.after?.();},'game-button primary'));
  keepAdventureScroll(items,'recentLoot');
}

function drawMenu() {
  const {kind,args}=menuSession;
  const go=(key,a)=>openMenu(key,a), back=()=>go('home');
  if(kind==='adventure-status'){showAdventureStatus(args);return;}
  if(kind==='adventure-equip'){showAdventureEquipment(args);return;}
  if(kind==='adventure-loot'){showAdventureLoot(args);return;}
  if(state.adventure&&['camp','adventure-camp'].includes(kind)){companionUI.camp();return;}
  if(kind==='adventure-hunts'){
    const panel=panelFrame('各地の狩り',()=>go('journal'));
    const a=state.adventure;
    const options=Object.values(adventureBosses).filter(boss=>!boss.chapter&&(!boss.postgame||a.flags.POST)&&
      (state.discovered[boss.site]||a.flags.POST)&&(+boss.id.slice(1)<43||a.seen['trail-'+boss.id]));
    const rows=options.map(boss=>{
      const trail=maps[boss.site];
      return row('♧',trail.name,'目安レベル '+boss.level,a.cleared[boss.id]?'討伐済み':'未討伐',()=>{
        if(currentMap===trail){
          const spot=trail.objects.find(p=>p.bossId===boss.id);
          if(spot){closeMenu();view.path(spot.x,spot.y,{...spot,type:'object'});}
          return;
        }
        const exit=preferredAdventureExit(boss.site);
        if(exit){closeMenu();view.path(exit.x,exit.y,{...exit,type:'exit'});}
        else notify('まず近くの町で道を開こう。');
      });
    });
    list(panel,rows,args,7);
    return;
  }
  if(kind==='home'){
    const panel=panelFrame('旅の手帳');
    const title=state.adventure?adventureChapters[state.adventure.chapter].title:story[state.chapter]?.title;
    const summary=el('div','panel-summary',title??'');
    summary.append(el('small',null,currentMap.name+'　'+currentDay()+'日目　'+DAY[phase()]+'　銀 '+state.coins));
    panel.append(summary);
    const grid=el('div','menu-grid');
    for(const [key,[label,glyph]] of Object.entries(buttons)){
      const b=button('',()=>go(key),'menu-tile');
      b.append(el('i',null,glyph),el('span',null,label));grid.append(b);
    }
    panel.append(grid);
    if(state.adventure&&state.members.length>1) panel.append(button('仲間の話',()=>go('adventure-camp')));
    return;
  }
  if(kind==='party'){
    const panel=panelFrame('隊列',back);
    const ordered=[...state.party,...state.members.filter(id=>!state.party.includes(id))];
    list(panel,ordered.map(id=>{
      const index=state.party.indexOf(id);
      return memberRow(id,'health',index<0?'待機':id===hero?'先頭':'隊列 '+(index+1),()=>go(state.adventure?'adventure-status':'party-edit',{id}));
    }),args,5);
    if(state.levelReport.length) panel.append(button('レベルアップの記録',()=>go('level-report')));
    return;
  }
  if(kind==='camp') {
    const panel=panelFrame('宿の夜話');
    const members=state.members.filter(id=>!state.lost[id]&&(id!==hero||personalEpisodes[id]?.chapter<=state.chapter));
    const paired=campPairs.filter(pair=>pair.chapter<=state.chapter&&
      pair.members.every(id=>state.party.includes(id)&&!state.lost[id])&&!state.parley['episode-pair-'+pair.id]);
    const rows=members.map(id=>{
      const episode=personalEpisodes[id],progress=state.personal[id]?.step??0;
      const eligible=episode&&state.chapter>=episode.chapter&&progress<episode.scenes.length;
      return memberRow(id,eligible?episode.title:'これまでの話',eligible?'夜話':'話す',()=>go('camp-member',{id}));
    });
    rows.push(...paired.map(pair=>row('◇',pair.title,pair.members.map(id=>person(id).name).join('・'),'夜話',()=>{
      closeMenu();pairedCampScene(pair);
    })));
    list(panel,rows,args,5);
    if(state.party.length>1) panel.append(button('皆で話す',()=>{closeMenu();companionChat();}));
    if(relationshipJourneys.some(pair=>companionJourneyReady(pair,pair.members,true)&&
      (state.relationshipJourneys[pair.id]?.step??0)<pair.scenes.length)){
      panel.append(button('二人の夜話',()=>go('relationship-journeys')));
    }
    return;
  }
  if(kind==='relationship-journeys'){
    const panel=panelFrame('二人の夜話',()=>go('camp'));
    const rows=relationshipJourneys.map(pair=>companionJourneyButton(pair,pair.members,pair.id,true)).filter(Boolean);
    list(panel,rows,args,5);
    return;
  }
  if(kind==='camp-member') {
    const {id}=args,p=person(id),episode=personalEpisodes[id];
    const panel=panelFrame(p.name,()=>go('camp'));
    panel.append(memberSummary(battleActor(id)));
    const progress=state.personal[id]?.step??0;
    if(episode&&state.chapter>=episode.chapter&&progress<episode.scenes.length){
      panel.append(button(progress?'夜話の続きを聞く':'夜話を聞く',()=>{closeMenu();personalScene(id);},'game-button primary'));
    }
    const journey=companionJourneyButton(companionJourneys[id],[id],id);
    if(journey) panel.append(journey);
    panel.append(button('これまでの話を聞く',()=>hearCompanion(id)));
    return;
  }
  if(kind==='level-report'){
    const panel=panelFrame('レベルアップの記録',()=>go('party'));
    list(panel,state.levelReport.map(up=>row(portrait(up.id),person(up.id).name,
      [...up.gains.map(g=>g.label+' ＋'+g.amount),...(up.learned??[]).map(name=>'習得 '+name)].join('　'),
      'レベル '+up.from+' → '+up.to)),args,5);
    return;
  }
  if(kind==='party-edit') {
    const {id}=args,p=person(id),index=state.party.indexOf(id);
    const panel=panelFrame(p.name,()=>go('party'));
    buildStatus(panel,id);
    const actions=el('div','status-actions');
    actions.append(button('装備を変更',()=>go('gear-slot',{id,from:'party-edit'})));
    if(id!==hero) actions.append(button(index>=0?'待機に移す':'隊列に加える',()=>{
      if(index<0&&state.party.length>=4) {go('party-swap',{id});return;}
      if(index>=0) state.party.splice(index,1);
      else state.party.push(id);
      save();go('party');
    },'game-button primary'));
    panel.append(actions);
    return;
  }
  if(kind==='party-swap') {
    const {id}=args;
    const panel=panelFrame('隊列の入れ替え',()=>go(state.adventure?'adventure-status':'party-edit',{id}));
    list(panel,state.party.slice(1).map((pid,i)=>memberRow(pid,'health','入れ替え',()=>{
      state.party.splice(i+1,1,id);
      save();go('party');
    })),args,4);
    return;
  }
  if(kind==='gear'){
    const panel=panelFrame('装備',back);
    list(panel,state.members.map(id=>{
      const a=battleActor(id);
      return memberRow(id,'物理 '+a.attack+'　魔法 '+a.magicAttack,'装備',()=>go(state.adventure?'adventure-status':'gear-slot',{id,from:'gear'}));
    }),args,5);
    return;
  }
  if(kind==='gear-slot'){
    const {id}=args,a=battleActor(id),d=memberData(id);
    const panel=panelFrame(a.name+'の装備',()=>go(args.from??'gear',{id}));
    panel.append(memberSummary(a));
    list(panel,SLOT.map(slot=>{
      const k=d.equip[slot],n=registry.equipment.get(k);
      return row(slot,n?.name??'空き',n?.attribute?badge(n.attribute):'',n?lookup(k).レア度:'',()=>go('gear-choose',{id,slot,from:args.from}));
    }),args);
    panel.append(button('鍛冶',()=>go('forge',{id,from:args.from}),'game-button'));return;
  }
  if(kind==='gear-choose'){
    const {id,slot}=args,d=memberData(id),old=registry.equipment.get(d.equip[slot]);
    const panel=panelFrame(slot+'の交換',()=>go('gear-slot',{id,from:args.from}));
    const summary=el('div','panel-summary','装備中　'+(old?.name??'空き'));
    summary.append(el('small',null,person(id).name+'　レベル '+levelOf(d.xp)));panel.append(summary);
    const rows=equipmentCandidates(id,slot).map(next=>row(icon(next.id),next.name,comparison(old,next),lookup(next.id).レア度,()=>{
      if(old) gain(old.id,1);
      gain(next.id,-1);d.equip[slot]=next.id;
      save();go('gear-slot',{id,from:args.from});
    }));
    if(old&&slot!=='武器') rows.unshift(row('外す','装備を外す',comparison(old,null),'',()=>{gain(old.id,1);delete d.equip[slot];save();go('gear-slot',{id,from:args.from});}));
    list(panel,rows,args);return;
  }
  if(kind==='forge'){
    const {id}=args,d=memberData(id),n=d.refine??0;
    const tier=Math.min(n,6), mats=['mat_005','mat_012','mat_032','mat_045','mat_084','mat_092','mat_093'];
    const req=mats[tier],needed=tier<4?3+tier:1,cost=28+12*n;
    const panel=panelFrame('手入れ台',()=>go('gear-slot',{id,from:args.from}));
    const summary=el('div','panel-summary',person(id).name+'　レベル '+levelOf(d.xp)+'　鍛錬 '+n);
    summary.append(el('small',null,'物理攻撃 ＋3　魔法攻撃 ＋2　銀 '+cost+'　'+registry.items.get(req).name+' '+count(state.inventory,req)+' / '+needed));
    panel.append(summary,button('打ち直す',()=>{
      d.refine=n+1;gain(req,-needed);state.coins-=cost;save();audio.effect('success');drawMenu();
    },'game-button primary',n>=8||state.coins<cost||count(state.inventory,req)<needed));
    if(state.ending){
      const id=gearCrest[TYPES[weapon(args.id)]],def=registry.equipment.get(id);
      const funds=640,ready=count(state.inventory,'mat_093')>=1&&count(state.inventory,'mat_092')>=2&&state.coins>=funds;
      if(def&&!collectorGear.has(id)){
        const description=el('div','panel-summary',def.name);
        description.append(el('small',null,'夜潮の核 '+count(state.inventory,'mat_093')+'/1　干天の刻印 '+count(state.inventory,'mat_092')+'/2　銀 '+funds));
        panel.append(description,button('伝承の品を打つ',()=>{
          gain('mat_093',-1);gain('mat_092',-2);state.coins-=funds;gain(id,1);save();
        notify(def.name+'を得た。','level');go('gear-slot',{id:args.id,from:args.from});
        },'game-button primary',!ready));
      }
    }
    return;
  }
  if(kind==='items'||kind==='shop'){
    const selling=kind==='shop', panel=panelFrame(selling?'荷受け':'持ち物',back);
    if(selling&&count(state.flags,'shunned-'+currentMap.id)>state.tide){
      panel.append(el('div','panel-summary','番に話が通っている。潮が変わるまで取り引きできない。'));return;
    }
    const tier=Math.min(5,Math.max(0,state.chapter-1));
    const offers=[['tool_004',10],['tool_005',32],['tool_011',31],['tool_012',16],['eq_sword_03',38],['eq_spear_02',41],...(tier>=3?[['tool_036',72]]:[])].filter(([id])=>!collectorGear.has(id));
    const equippedTypes=[...new Set(state.party.map(id=>TYPES[weapon(id)]))];
    if(selling) for(const type of equippedTypes){
      const k='eq_'+type+'_0'+Math.min(7,tier+2);
      if(registry.equipment.has(k)&&!collectorGear.has(k)&&!offers.some(o=>o[0]===k)) offers.push([k,44+tier*tier*14]);
    }
    const all=selling?offers:Object.entries(state.inventory).filter(([id,n])=>n>0&&registry.items.has(id));
    if(selling) panel.append(el('div','panel-summary','銀 '+state.coins));
    list(panel,all.map(([id,quantity])=>{
      const v=registry.items.get(id);
      const detail=el('span');
      if(v.attribute) detail.append(badge(v.attribute),document.createTextNode('　'));
      detail.append(v.note??lookup(id).説明??'');
      return row(icon(id),v.name,detail,selling?'銀 '+quantity:'×'+quantity,selling?()=>{
        state.coins-=quantity;gain(id,1);save();audio.effect('coin');drawMenu();
      }:v.effect?()=>go('item-use',{id}):null,selling&&state.coins<quantity);
    }),args);
    return;
  }
  if(kind==='item-use'){
    const v=registry.items.get(args.id),panel=panelFrame(v.name,()=>go('items'));
    panel.append(el('div','panel-summary',v.note));
    list(panel,state.party.map(id=>{
      const a=battleActor(id), d=memberData(id);
      const viable=v.effect==='restore'?a.mp<a.maxMp:v.effect==='revive'?a.hp===0:a.hp>0&&a.hp<a.maxHp;
      return memberRow(id,'health','使う',()=>{
        if(v.effect==='restore') d.mp=Math.min(a.mp+v.power,a.maxMp);else d.hp=Math.min(a.hp+v.power,a.maxHp);
        gain(v.id,-1);save();audio.effect('heal');go('items');
      },!viable||!count(state.inventory,v.id));
    }),args,4);
    return;
  }
  if(kind==='journal'){
    const panel=panelFrame('行き先',back),f=story[state.chapter];
    if(state.adventure){
      const a=state.adventure,dest=destinationForChapter();
      const title=a.ending?'旅のあと':'第'+a.chapter+'章　'+adventureChapters[a.chapter].title;
      const summary=el('div','panel-summary',title);
      if(dest){
        const road=Object.values(maps).find(map=>map.adventure&&map.exits?.some(e=>e.id===dest.id)&&map.kind==='road');
        const town=road&&Object.values(maps).find(map=>map.adventure&&map.kind==='town'&&map.exits?.some(e=>e.id===road.id));
        const guide=el('div','destination-level');
        guide.append(el('b',null,dest.name),el('span','level-tag','目安レベル '+dest.level));
        summary.append(guide,el('small',null,town&&road?town.name+' → '+road.name+' → '+dest.name:dest.name+'へ向かう。'));
        panel.append(summary);
        const nudge=preferredAdventureExit(dest.id);
        if(nudge) panel.append(button(nudge.label+'へ向かう',()=>{closeMenu();view.path(nudge.x,nudge.y,{...nudge,type:'exit'});},'game-button primary'));
        if(dest.id===currentMap.id){
          const boss=currentMap.objects.find(object=>object.bossId===adventureBossCode(a.chapter));
          if(boss) panel.append(button('現場へ向かう',()=>{closeMenu();view.path(boss.x,boss.y,{...boss,type:'object'});},'game-button primary'));
        }
      } else {
        summary.append(el('small',null,'高い道から、さらに強い魔物のいる場所へ行ける。'));
        panel.append(summary);
      }
      panel.append(button('各地の狩り',()=>go('adventure-hunts')));
      return;
    }
    const summary=el('div','panel-summary',f?.title??'旅のあと');
    if(f) summary.append(el('small',null,f.hint));
    const dest=destinationForChapter(),level=recommendedLevel(dest);
    if(level) {
      const guidance=el('div','destination-level');
      guidance.append(el('b',null,dest.name),el('span','level-tag','目安レベル '+level),el('span','party-level','隊列 '+partyLevel()));
      summary.append(guidance);
    }
    panel.append(summary);
    const activeErrands=errands.filter(q=>[1,2].includes(count(state.flags,'errand-'+q.town)));
    if(activeErrands.length) panel.append(button('寄り道',()=>go('errands')));
    if(Object.values(voyages).some(voyageAvailable)) panel.append(button('各地の探訪',()=>go('voyages')));
    if(Object.values(inquiries).some(inquiryAvailable)) panel.append(button('地方調査',()=>go('inquiries')));
    if(trialsAvailable()) panel.append(button('腕試し',()=>go('trials')));
    if(testimonySources.some(id=>state.lost[id]&&!state.clues['told-'+id])) panel.append(button('預かった書き置き',()=>go('testimonies')));
    if(state.ending) panel.append(button('結末「'+endings[state.ending].title+'」を読む',()=>{closeMenu();finishEnding(state.ending,true);}));
    list(panel,state.history.map(note=>row('◇',note,'','')),args,4);return;
  }
  if(kind==='errands'){
    const panel=panelFrame('寄り道',()=>go('journal'));
    const current=errands.filter(q=>[1,2].includes(count(state.flags,'errand-'+q.town)));
    list(panel,current.map(q=>row('◇',q.label,count(state.flags,'errand-'+q.town)===1?q.hint:maps[q.town].name+'の札に戻る。','')),args,5);
    return;
  }
  if(kind==='voyages') {
    const panel=panelFrame('各地の探訪',()=>go('journal'));
    const rank=arc=>{
      const step=state.voyages[arc.id]?.step??0;
      return step>=arc.stages.length?2:step?0:1;
    };
    const accounts=Object.values(voyages).filter(voyageAvailable).sort((a,b)=>rank(a)-rank(b)||a.level-b.level);
    list(panel,accounts.map(arc=>{
      const step=state.voyages[arc.id]?.step??0,stage=arc.stages[step];
      const place=maps[arc.home].name+'　目安レベル '+arc.level;
      const detail=step?(stage?stage.hint??stage.label:'手がかりをすべて調べた。'):place;
      return row('◇',arc.title,detail,stage?(step?'進行中':'未着手'):'完了',stage?()=>{
        closeMenu();
        conversation([[0,place],[0,step?(stage.hint??stage.label):'町にある「'+stage.label+'」から始められる。']]);
      }:undefined);
    }),args,5);
    return;
  }
  if(kind==='inquiries'){
    const panel=panelFrame('地方調査',()=>go('journal'));
    const entries=Object.values(inquiries).filter(inquiryAvailable).sort((a,b)=>Number(a.home!==currentMap.id)-Number(b.home!==currentMap.id)||a.level-b.level);
    list(panel,entries.map(entry=>{
      const progress=state.inquiries[entry.id];
      const badge=progress?.verdict!=null?'完了':progress?.started?'調査中':'相談';
      return row('⌑',entry.title,maps[entry.home].name,badge,()=>go('inquiry',{id:entry.id}));
    }),args,5);
    return;
  }
  if(kind==='trials'){
    const panel=panelFrame('腕試し',()=>go('journal'));
    const here=currentMap.id==='lastwharf';
    if(!here) panel.append(el('div','panel-summary',maps.lastwharf.name+'で挑める。'));
    list(panel,trials.map((trial,index)=>{
      const done=state.flags['trial-'+trial.id],ready=!index||state.flags['trial-'+trials[index-1].id];
      return row('◇',trial.title,'目安レベル '+trial.level,done?'達成':ready?'挑戦できる':'前の腕試しを終える',
        ready&&!done&&here?()=>{closeMenu();trialScene(trial,index);}:undefined);
    }),args,4);
    return;
  }
  if(kind==='inquiry'){
    const entry=inquiries[args.id];
    if(!inquiryAvailable(entry)) {go('inquiries');return;}
    const panel=panelFrame(entry.title,()=>go('inquiries')),progress=inquiryState(entry.id),home=maps[entry.home].name;
    if(!progress.started){
      panel.append(el('div','panel-summary',entry.memo));
      panel.append(button('相談を聞く',()=>{
        closeMenu();
        conversation(availablePages(entry.opening),[],()=>{
          progress.started=true;save();go('inquiry',{id:entry.id});
        });
      },'game-button primary',currentMap.id!==entry.home,home));
      return;
    }
    const resolved=progress.verdict!==null;
    const ready=entry.questions[progress.question]?.needs.every(index=>progress.evidence.includes(index))??true;
    panel.append(el('div','panel-summary',resolved?'記録済み　'+entry.verdicts[progress.verdict]?.label:
      '資料 '+progress.evidence.length+' / '+entry.evidence.length+'　　照合 '+progress.question+' / '+entry.questions.length));
    if(!resolved){
      const prompt=currentMap.id!==entry.home?home+'で記録を合わせる':ready?'手帳を照らし合わせる':'該当する資料を探す';
      panel.append(button(ready&&progress.question===entry.questions.length?'調査をまとめる':'資料を照合する',()=>{
        closeMenu();discussInquiry(entry);
      },'game-button primary',!ready||currentMap.id!==entry.home,prompt));
    }
    list(panel,entry.evidence.map((clue,index)=>{
      const seen=progress.evidence.includes(index);
      return row(seen?'◆':'◇',clue.label,clue.hint,seen?'読む':'未確認',seen?()=>{
        closeMenu();conversation(availablePages(clue.pages),[],()=>go('inquiry',{id:entry.id}));
      }:undefined);
    }),args,4);
    return;
  }
  if(kind==='testimonies') {
    const panel=panelFrame('預かった書き置き',()=>go('journal'));
    list(panel,testimonySources.filter(id=>state.lost[id]).map(id=>{
      const p=person(id);
      return row('◇',p.name+'の書き置き','','読む',()=>{
        closeMenu();
        conversation([[0,publicEvidence(p,state)]],[],()=>{
          state.clues['told-'+id]=1;
          save();
        });
      });
    }),args,5);
    return;
  }
  if(kind==='records') {
    const panel=panelFrame('図鑑',back), grid=el('div','menu-grid');
    for(const [key,label,glyph] of [['creatures','怪物','◈'],['folks','人物','♙'],['finds','見つけた品','◇'],['places','訪れた地','⌑']]) {
      grid.append(button(glyph+'　'+label,()=>go(key),'menu-tile'));
    }
    panel.append(grid);return;
  }
  if(kind==='creatures'){
    const panel=panelFrame('怪物',()=>go('records'));
    list(panel,Object.entries(state.bestiary).filter(([id])=>monsterDefs[id]).map(([id,record])=>{
      const def=monsterDefs[id], weaken=el('span');
      for(const w of record.weakness) weaken.append(badge(w),document.createTextNode('　'));
      if(!weaken.firstChild) weaken.textContent='弱点未確認';
      return row('◈',def[0],weaken,record.level?'レベル '+record.level+'　討伐 '+record.count:'討伐 '+record.count);
    }),args);
    return;
  }
  if(kind==='folks'){
    const panel=panelFrame('出会った人物',()=>go('records'));
    list(panel,people.filter(p=>p.id!==hero&&state.discovered[bank('person',p.id)]).map(p=>state.members.includes(p.id)?
      memberRow(p.id,p.role,'仲間',()=>go('folio',{id:p.id})):
      row(portrait(p.id),p.name,p.role,state.lost[p.id]?'離脱':'',()=>go('folio',{id:p.id}))),args,5);
    return;
  }
  if(kind==='folio'){
    const p=person(args.id);
    const panel=panelFrame(p.name,()=>go('folks'));
    const summary=el('div','panel-summary',p.role+'　'+p.temper);
    if(state.members.includes(p.id)) summary.append(el('small',null,'レベル '+levelOf(memberData(p.id).xp)));
    summary.append(el('small',null,'大切にすること　'+p.value));
    if(state.clues['told-'+p.id]||state.members.includes(p.id)){
      summary.append(el('small',null,'好むもの　'+p.like),el('small',null,'疎むもの　'+p.dislike),el('small',null,publicEvidence(p,state)));
      if(person(p.bond)&&state.discovered[bank('person',p.bond)]) summary.append(el('small',null,'縁のある人　'+person(p.bond).name));
    }
    if(state.lost[p.id]) summary.append(el('small',null,state.lost[p.id]));
    panel.append(summary);
    return;
  }
  if(kind==='finds'){
    const panel=panelFrame('見つけた品',()=>go('records'));
    list(panel,Object.keys(state.discovered).filter(id=>registry.items.has(id)).map(id=>row(icon(id),registry.items.get(id).name,registry.items.get(id).note??lookup(id).説明,lookup(id).レア度)),args);
    return;
  }
  if(kind==='places'){
    const panel=panelFrame('訪れた地',()=>go('records'));
    list(panel,Object.keys(state.discovered).filter(id=>maps[id]).map(id=>{
      const level=recommendedLevel(maps[id],id===currentMap.id?view.player.y:undefined);
      return row('◇',maps[id].name,level?'目安レベル '+level:'',id===currentMap.id?'現在地':'');
    }),args);
    return;
  }
  if(kind==='settings'){
    const panel=panelFrame('音と記録',back);
    for (const [label,key] of [['音楽','bgm'],['効果音','sfx']]){
      const meter=el('label','meter-setting');
      const input=el('input');input.type='range';input.min='0';input.max='100';input.value=Math.round(state.audio[key]*100);
      const value=el('span','row-end',input.value+'％');
      meter.append(el('span',null,label),input,value);
      input.addEventListener('input',()=>{state.audio[key]=+input.value/100;audio.volume(state.audio.bgm,state.audio.sfx);value.textContent=input.value+'％';save();});
      panel.append(meter);
    }
    const pacing=el('div','pacing-setting');
    pacing.append(el('span',null,'戦闘の速さ'));
    const modes=el('div','pacing-buttons');
    for(const [mode,label] of [['normal','通常'],['fast','速い']]){
      const set=button(label,()=>{state.battleSpeed=mode;save();drawMenu();},'game-button'+(state.battleSpeed===mode?' primary':''));
      set.setAttribute('aria-pressed',state.battleSpeed===mode?'true':'false');
      modes.append(set);
    }
    pacing.append(modes);
    panel.append(pacing);
    panel.append(button('記録を書き出す',exportSave),button('記録を読み込む',()=>$('restore-file').click()),button('表紙に戻る',()=>{save();closeMenu();startTitle();}));
  }
}

function exportSave() {
  save();
  const data=new Blob([JSON.stringify(state)],{type:'application/json'});
  const url=URL.createObjectURL(data),a=el('a');
  a.href=url;a.download='潮影の弔鐘-旅の記録.json';
  document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
}

$('restore-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file) return;
  try {
    const loaded=normalize(JSON.parse(await file.text()));
    if(battle){battle.destroy();battle=null;combat.hidden=true;}
    state=loaded;
    closeMenu();audio.volume(state.audio.bgm,state.audio.sfx);
    enter(false);notify('旅の記録を読み込んだ。','success');
  } catch {notify('旅の記録を読み込めなかった。','failure');}
});

function enter(first) {
  fromTitle=false;
  title.hidden=true;hud.hidden=false;
  openMap(state.map,state.pos);
  save();
  if(state.pendingBattle) {
    const {ids,options,checkpoint}=state.pendingBattle;
    showBattle(ids,options,checkpoint);
  } else if(state.adventure){
    const design=state.adventure;
    if(!design.flags.openingRead) conversation(adventureOpening,[],()=>{design.flags.openingRead=true;save();});
    else if(design.ending&&!design.flags.endingRead) showAdventureEnding();
    else if(!design.ending&&design.cleared[adventureBossCode(design.chapter)]&&currentMap.id===adventureChapters[design.chapter].site) resolveAdventureChapter(design.chapter);
  } else if(first) conversation(prologue);
  else if(state.flags.finalePending&&state.ending) finishEnding(state.ending,false);
}

function startTitle() {
  fromTitle=true;
  hud.hidden=true;title.hidden=false;
  view.setMap(maps.T01,maps.T01.preview??maps.T01.entry,true);
  audio.scene('title');
  const owned=load(ADVENTURE_KEY),old=load(),actions=$('start-actions');
  actions.replaceChildren();
  if(owned) actions.append(button('旅の続き',()=>{state=owned;audio.volume(state.audio.bgm,state.audio.sfx);enter(false);},'game-button primary'));
  actions.append(button('旅を始める',()=>{
    if(owned) {
      conversation([[0,'新しい記録で旅を始める？']],[{label:'始める',detail:'この旅の記録を置き換える',action:()=>{closeStory();state=newState(true);enter(true);}},{label:'戻る',action:closeStory}]);
    } else {state=newState(true);enter(true);}
  },owned?'game-button':'game-button primary'));
  if(old) actions.append(button(owned?'以前の旅を続ける':'旅の続き',()=>{state=old;audio.volume(state.audio.bgm,state.audio.sfx);enter(false);},'game-button'));
  actions.append(button('記録を読み込む',()=>$('restore-file').click()));
}

function buildCatalog(data) {
  for(const group of ['people','equipment','materials','tools','monsters']) {
    for(const item of data[group]) assets.set(item.id,item);
  }
  for(const a of data.equipment){
    const type=a.id.split('_')[1], tier=Math.max(0,rankOrder.indexOf(a.レア度)),index=+a.id.split('_').at(-1)||1,slot=a.部位;
    const isWeapon=slot==='武器',staff=type==='staff';
    const armour=['armor','helmet','shield','tower'].includes(type);
    const cloth=['robe','cloak','cap','circlet','amulet','plume','ring'].includes(type);
    const appearance=a.説明.replace(/（.*）/,'').slice(0,17);
    const stats={id:a.id,name:tier===5?itemPrefixes[tier]+(weaponNames[type]??appearance):appearance,slot,type,rarity:a.レア度,
      attack:isWeapon?(staff?2+tier*3:3+tier*8+index%4):0,
      magicAttack:isWeapon?(staff?5+tier*9+index%4:1+tier*(a.素質.属性.length?5:2)):cloth?1+tier:0,
      defense:isWeapon?0:1+tier*(armour?4:3)+index%2,
      magicDefense:isWeapon?0:1+tier*(cloth?4:armour?2:3),
      accuracy:isWeapon&&['bow','spear'].includes(type)?1+tier:0,
      crit:isWeapon&&['dagger','axe'].includes(type)?1+tier:0,
      evasion:cloth?1+Math.floor(tier/2):0,
      hp:slot==='体'?5+tier*6:0,mp:slot==='装飾'?2+tier*3:0,speed:slot==='腕'?tier+1:0,
      attribute:a.素質.属性[0],note:a.説明};
    registry.equipment.set(a.id,stats);registry.items.set(a.id,stats);
  }
  for(const a of data.materials){
    const [name,attribute]=materialDefs[a.id]??[a.説明, a.素質.属性[0]];
    registry.items.set(a.id,{id:a.id,name,attribute,note:'鍛冶に使う材料'});
  }
  for(const a of data.tools) registry.items.set(a.id,{id:a.id,name:a.説明,attribute:a.素質.属性[0],...toolDefs[a.id]});
}

async function preload() {
  const data=await fetch('./assets/catalog.json').then(res=>{
    if(!res.ok) throw new Error('素材一覧');
    return res.json();
  });
  buildCatalog(data);
  const all=[...assets.values()];
  let i=0,loaded=0;
  const worker=async ()=>{
    while(i<all.length) {
      const a=all[i++], path=assetUrl(a.file);
      const img=new Image();
      await new Promise((resolve,reject)=>{
        img.onload=resolve;img.onerror=()=>reject(new Error(path));img.src=path;
      });
      if(a.id.startsWith('person_')) images.set(a.id,img);
      loaded++;
      if(loaded%24===0||loaded===all.length) $('load-progress').textContent=Math.floor(100*loaded/all.length)+'％';
    }
  };
  await Promise.all(Array.from({length:20},worker));
}

$('open-menu').addEventListener('click',()=>{audio.effect('click');openMenu();});
$('act').addEventListener('click',()=>{if(nearest){audio.effect('click');interact(nearest);}});
window.addEventListener('keydown',e=>{
  if(e.key==='Escape') {if(!panels.hidden) closeMenu();else if(!storyView.hidden) closeStory();else if(active()) openMenu();}
  if((e.key==='Enter'||e.key===' ')&&active()&&nearest&&e.target===document.body){e.preventDefault();interact(nearest);}
});
window.addEventListener('pointerdown',()=>audio.unlock(),{capture:true,passive:true});
window.addEventListener('click',()=>audio.unlock(),{capture:true,passive:true});
window.addEventListener('keydown',()=>audio.unlock(),{capture:true,passive:true});
window.addEventListener('pagehide',()=>{if(!fromTitle) save();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!fromTitle) save();});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});

async function init() {
  if(wantsOnlineCache()){
    const sw=navigator.serviceWorker;
    try {
      await sw.register('./sw.js');
      if(!sw.controller) await Promise.race([new Promise(resolve=>sw.addEventListener('controllerchange',resolve,{once:true})),delay(950)]);
    } catch { /* Online play and manual saves are still possible. */ }
  }
  await preload();
  startTitle();
}

init().catch(error=>{
  console.error(error);
  $('start-actions').replaceChildren(el('div','panel-summary','支度が途中で止まりました。'),button('もう一度',()=>location.reload(),'game-button primary'));
});
