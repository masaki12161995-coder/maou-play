"use strict";

const GAME_SAVE = "maou.yesterday.rebuild.campaign.v1";
const POCKET = 240;
const GRADES = ["白", "緑", "青", "紫", "金", "虹"];
const SLOTS = ["武器", "頭", "体", "腕", "飾り", "飾り"];
const MATERIALS = {
  iron: {name:"鉄片",art:"mat_005"},
  ash: {name:"松の灰",art:"mat_015"},
  hide: {name:"丈夫な革",art:"mat_054"},
  glow: {name:"灯火の粉",art:"mat_006"},
};
const ITEMS = {
  sword: { name:"街道の剣", art:"starterSword", slot:0, attack:4, price:32 },
  staff: { name:"木の杖", art:"starterStaff", slot:0, attack:3, magic:3, ranged:true, price:30 },
  hook: { name:"鉤の櫂", art:"starterAxe", slot:0, attack:4, speed:1, price:28 },
  shield: { name:"番人の盾", art:"starterShield", slot:3, defense:4, price:36 },
  swordIron: { name:"緋留めの短剣", art:"E01", slot:0, attack:7, price:72 },
  bow: { name:"谷風の弓", art:"E03", slot:0, attack:5, ranged:true, speed:2, price:56 },
  hat: { name:"旅の頭巾", art:"eq_hood_01", slot:1, defense:1, speed:1, price:23 },
  coat: { name:"毛織の外套", art:"starterVest", slot:2, defense:3, health:11, price:45 },
  steel: { name:"山形の大盾", art:"starterShield", slot:3, defense:6, health:6, price:82 },
  lantern: { name:"小さな灯飾り", art:"eq_amulet_01", slot:4, health:9, defense:1, magicDefense:2, element:"light", price:48 },
  ring: { name:"風の腕輪", art:"eq_ring_01", slot:4, speed:3, critical:2, price:43 },
  prism: { name:"星波の耳飾り", art:"E40", slot:4, attack:18, speed:5, defense:7, health:24, element:"light", price:310, unique:true },
};
const RECIPES = [
  {item:"swordIron",need:{iron:3,hide:1}}, {item:"steel",need:{iron:4,ash:1}},
  {item:"lantern",need:{ash:2,glow:1}}, {item:"coat",need:{hide:3}},
];

function mixSeed(text) {
  let n = 2166136261;
  for (const c of String(text)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
function seeded(seed) {
  return () => {
    seed = (Math.imul(1664525,seed)+1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function defaults(){return {theme:"warm",sort:"grade",autoHeal:false,sell:[]};}
function restorePreferences(save){save.options={...defaults(),...save.options};}
function addMaterial(save,key,quantity){
  save.records??={item:{},material:{}};
  save.records.material[key]=(save.records.material[key]||save.materials[key]||0)+quantity;
  save.materials[key]=(save.materials[key]||0)+quantity;
}

function makeAdventure(seed = Date.now()) {
  const s = {
    version:1, seed, chapter:1, position:{area:"town",trail:[[5,22]]},
    checkpoint:{area:"town",trail:[[5,22]]}, flags:{}, claims:{}, lore:{}, seen:{}, lastFight:null,
    members:{}, formation:[null,null,null,null], gold:34, serial:1, battles:0, pending:null,
    bag:[], chest:[], materials:{iron:1,ash:0,hide:0,glow:0}, tools:{salve:2,book:0},
    speed:1, options:defaults(), stamp:0,
  };
  welcome(s,"H01");
  return s;
}
function itemId(s) { return "i"+s.serial++; }
function grant(s, code, grade=0) {
  const fresh = !s.claims["item:"+code];
  const instance = {uid:itemId(s), code, grade, forged:0, inlay:null, locked:fresh || grade>3 || Boolean(ITEMS[code].unique)};
  (s.bag.length >= POCKET ? s.chest : s.bag).push(instance);
  s.claims["item:"+code]=true;
  s.records??={item:{},material:{}};
  s.records.item[code]=Math.max(grade,s.records.item[code]??0);
  return instance;
}
function welcome(s, id, level=1) {
  if (s.members[id]) return false;
  const member = {level, xp:0, hp:null, gear:[null,null,null,null,null,null], equipped:[0,3,6,null], stars:{}};
  s.members[id]=member;
  const starters = {H01:["sword","coat"],H02:["staff"],H03:["hook"],H04:["sword","shield"],H05:["bow"],H06:["swordIron"],H11:["staff","lantern"],person_077:["staff","lantern"],H12:["hook","coat"],H15:["staff","ring"],H08:["hook","coat"],H13:["bow","lantern"],H14:["hook","shield"]};
  for (const code of starters[id] || ["sword"]) {
    const item = grant(s,code), slot = ITEMS[code].slot;
    if (s.bag.includes(item)) member.gear[slot]=item.uid;
  }
  const vacant=s.formation.indexOf(null);
  if (vacant>=0) s.formation[vacant]=id;
  member.hp=stats(s,id).maxHp;
  return true;
}
function stats(s,id,gear=s.members[id].gear) {
  const person = s.members[id];
  const profile = {
    H01:[59,12,4,11,false], H02:[49,8,3,10,true], H03:[66,11,5,9,false],
    H04:[73,9,7,8,false], H05:[52,14,3,14,true], H06:[78,13,5,7,false], H11:[53,10,4,10,true], person_077:[50,10,5,9,true], H12:[70,12,5,8,false], H15:[49,11,3,15,true], H08:[66,14,6,11,false], H13:[53,12,5,13,true], H14:[70,15,7,9,false],
  }[id] || [60,11,4,10,false];
  let [maxHp,attack,defense,speed,ranged] = profile;
  maxHp += person.level * 7;
  attack += person.level * 2;
  defense += person.level;
  speed += Math.floor(person.level / 3);
  let element=null,magicalBoost=0,resistBoost=0,critical=10;
  for (const uid of gear) {
    const item = s.bag.find(entry=>entry.uid===uid);
    if (!item) continue;
    const prop = ITEMS[item.code];
    maxHp += (prop.health || 0) + item.grade * 2;
    attack += (prop.attack || 0) + (prop.slot===0 ? item.forged*2+item.grade : 0);
    defense += (prop.defense || 0) + (prop.slot!==0 ? item.forged+item.grade : 0);
    speed += prop.speed || 0;
    magicalBoost+=prop.magic||0;
    resistBoost+=prop.magicDefense||0;
    critical+=prop.critical||0;
    ranged ||= Boolean(prop.ranged);
    element ||= item.inlay || prop.element;
  }
  return {maxHp,attack,defense,magic:attack+magicalBoost,magicDefense:defense+resistBoost,
    speed,critical,criticalPower:150,ranged,element};
}
function healAll(s) {
  for (const id of Object.keys(s.members)) s.members[id].hp=stats(s,id).maxHp;
}
const levelCost=level=>34+13*level;
function applyXP(s, amount) {
  for (const [id, member] of Object.entries(s.members)) {
    member.xp += s.formation.includes(id) ? amount : Math.floor(amount*.6);
    while (member.level<99 && member.xp >= levelCost(member.level)) {
      member.xp -= levelCost(member.level);
      member.level++;
      member.hp=Math.min(stats(s,id).maxHp,(member.hp || 0)+9);
    }
  }
}
function loot(seed, table=[]) {
  const random=seeded(mixSeed(seed+":loot"));
  if (random()<.0001) return {code:"prism",grade:5};
  if (table.length && random()<.13) {
    const code=table[Math.floor(random()*table.length)];
    const v=random();
    return {code,grade:v<.015?4:v<.065?3:v<.21?2:v<.54?1:0};
  }
  return null;
}
function holding(s,uid) { return Object.values(s.members).some(member=>member.gear.includes(uid)); }
function itemPrice(item){return Math.max(1,Math.floor(ITEMS[item.code].price*(.41+item.grade*.12))+item.forged*4);}
function discardItem(s,item){
  const shelf=s.bag.includes(item)?s.bag:s.chest;
  const match=shelf.indexOf(item);
  if(match<0||item.locked||holding(s,item.uid))return false;
  shelf.splice(match,1);
  return true;
}
function equip(s,id,uid,slot) {
  const item=s.bag.find(entry=>entry.uid===uid);
  const member=s.members[id];
  if (!item || !member || holding(s,uid) || Math.min(slot,4)!==ITEMS[item.code].slot) return false;
  member.gear[slot]=uid;
  member.hp=Math.min(member.hp,stats(s,id).maxHp);
  return true;
}
function spend(s,cost) {
  if (Object.keys(cost).some(key=>(s.materials[key] || 0)<cost[key])) return false;
  for (const [key,n] of Object.entries(cost)) s.materials[key]-=n;
  return true;
}
function salvage(s, ids) {
  const eligible=s.bag.filter(item=>ids.includes(item.uid) && !item.locked && !holding(s,item.uid) && !ITEMS[item.code].unique && item.grade<4);
  if (!eligible.length) return false;
  const removed=new Set(eligible.map(i=>i.uid));
  addMaterial(s,"iron",eligible.reduce((n,i)=>n+1+i.forged,0));
  s.bag=s.bag.filter(item=>!removed.has(item.uid));
  return true;
}

class SaveBook {
  constructor(storage) {
    this.storage=storage;
    this.error=false;
    this.data={slots:[null,null,null,null], cards:{}};
    try {
      const read=JSON.parse(storage.getItem(GAME_SAVE));
      if(Array.isArray(read?.slots)&&read.slots.length>=3){
        this.data={...read,slots:Array.from({length:4},(_,i)=>read.slots[i]||null),cards:read.cards||{}};
      }
    } catch { this.error=true; }
  }
  get(index) { return this.data.slots[index] ? structuredClone(this.data.slots[index]) : null; }
  write(next) {
    try {
      this.storage.setItem(GAME_SAVE,JSON.stringify(next));
      this.data=next; this.error=false; return true;
    } catch { this.error=true; return false; }
  }
  save(state,index=0) {
    const slots=this.data.slots.slice();
    slots[index]=structuredClone(state);
    slots[index].stamp=Date.now();
    return this.write({...this.data,slots});
  }
  cardsFor(seed) { const entry=this.data.cards[seed];return entry ? structuredClone(entry) : null; }
  writeCards(seed,entry) { return this.write({...this.data,cards:{...this.data.cards,[seed]:structuredClone(entry)}}); }
}
