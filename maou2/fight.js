"use strict";

const SKILL_FLAGS = {
  H01:[
    {power:1.0,gain:31},{power:.91,follow:true,mark:true},{power:.78,guard:"side"},
    {power:1.48,spread:true,cover:true},{power:1.14,pass:true,follow:true},{power:1.65,break:2,interrupt:2},
  ],
  H02:[
    {power:.73,range:true,heal:.16},{power:.84,range:true,delay:18},{power:.70,range:true,guard:"weak"},
    {heal:.47,wait:"hurt",pass:true},{power:.58,range:true,guard:"team",heal:.20},{revive:.46,wait:"fallen"},
  ],
  H03:[
    {power:.93,delay:12,interrupt:1},{power:.89,break:2,interrupt:1},{power:.94,guard:"side",element:"water"},
    {power:.91,cover:true,guard:"back"},{power:1.24,break:2,spread:true,element:"water"},{pass:true,follow:true,power:.95},
  ],
  H04:[
    {power:.73,guard:"side"},{power:.92,guard:"self",taunt:true},{power:.70,guard:"weak"},
    {guard:"pair",cover:true,taunt:true},{guard:"weak",cover:true,power:1.13},{guard:"team",cover:true,taunt:true},
  ],
  H05:[
    {power:.96,range:true,back:true},{power:.83,range:true,mark:true},{power:.81,range:true,interrupt:2,delay:18},
    {power:1.56,range:true,interrupt:2,break:1},{power:1.27,range:true,spread:true,back:true},{power:1.04,range:true,spread:true,mark:true},
  ],
  H11:[
    {power:.8,range:true,element:"light",guard:"side"},{power:.72,range:true,back:true,heal:.15},{power:.97,range:true,follow:true,pass:true,element:"light"},
    {guard:"team",heal:.12,wait:"hurt"},{revive:.43,wait:"fallen"},{heal:.32,wait:"hurt",guard:"pair"},
  ],
  person_077:[
    {power:.72,range:true,heal:.14,element:"water"},{power:.85,range:true,cleanse:true},{power:.85,range:true,heal:.10},
    {heal:.51,wait:"hurt",cleanse:true},{heal:.26,wait:"hurt",guard:"front",healRow:true},{revive:.47,wait:"fallen",cleanse:true},
  ],
  H12:[
    {power:.95,pull:true},{power:.82,range:true,delay:18},{power:.81,mark:true,break:1},
    {power:1.18,pull:true,mark:true,pass:true},{guard:"pair",cover:true},{power:1.57,break:3,interrupt:1},
  ],
  H15:[
    {power:.76,range:true,delay:19,element:"wind"},{power:.79,range:true,mark:true},{power:.74,guard:"back",range:true},
    {pass:true,delayAlly:true},{power:.88,redirect:true,range:true,element:"wind"},{speedTeam:true},
  ],
  H08:[
    {power:.92,spread:true,element:"water"},{power:.83,delay:18,pull:true,element:"water"},{power:1.02,follow:true,element:"water"},
    {power:1.18,break:1,push:true,element:"water"},{power:1.3,spread:true,break:2,element:"water"},{pass:true,delayAlly:true,cleanse:true,guard:"pair"},
  ],
  H13:[
    {power:.92,range:true,element:"light",back:true,mark:true},{power:1.05,range:true,break:2},{power:.8,range:true,guard:"side"},
    {power:1.16,range:true,follow:true,guard:"side"},{power:1.13,range:true,break:1,spread:true},{power:1.2,range:true,guard:"weak",element:"light"},
  ],
  H14:[
    {power:.97,element:"fire"},{power:.91,break:2},{power:.83,guard:"weak",element:"fire"},
    {power:1.24,element:"fire",break:2,spread:true},{power:1.15,guard:"front",element:"fire"},{pass:true,power:.83,element:"fire"},
  ],
  H06:[
    {power:1.0,break:1},{power:.89,guard:"self"},{power:.74,range:true,spread:true,pass:true},
    {power:1.36,push:true},{power:1.32,spread:true,break:2},{power:1.4,follow:true,guard:"pair"},
  ],
};

const LEARNING = [1,16,34,1,11,27,1,7,13,21,32,44];
function learning(level,index) { return LEARNING[index] <= level; }
const partyName = id => CAST[id]?.name || "";
const laneSide = slot => slot % 2;

function resolveFight(save,enemies,seed) {
  const random=seeded(mixSeed(seed+":battle"));
  const formation=save.formation.slice();
  const party=formation.map((id,slot)=>{
    if (!id || !save.members[id]) return null;
    const member=save.members[id], powers=stats(save,id);
    return {...powers,id,slot,hp:Math.max(0,Math.min(powers.maxHp,member.hp)), level:member.level,
      gauge:0,guard:0,cover:0,taunt:0,mark:0,broken:0,hitCount:0,due:Math.round(200/powers.speed), turns:0,
      equipped:member.equipped.slice(), stars:member.stars};
  });
  const foes=enemies.map((enemy,index)=>({...enemy,slot:index,hp:enemy.maxHp,defeatedAt:null,due:Math.round(200/enemy.speed)+2,
    charge:0,turns:0,brace:enemy.brace||0,guard:0,mark:0,broken:0,hitCount:0}));
  const frames=[], events=[], notices=[], reasons=[];
  const snapshot=at=>frames.push({at,party:party.map(p=>p&&({...p})),foes:foes.map(e=>({...e}))});
  const notify=(event,side,index,text,kind,lift=0)=>notices.push({at:event.impact,side,index,text,kind,lift});
  const live=arr=>arr.filter(u=>u?.hp>0);
  const passive=(member,index)=>member?.equipped.includes(index);

  const perks=id=>live(party).find(unit=>unit.id===id);
  const sideMate=p=>party[p.slot^2]?.hp ? party[p.slot^2] : null;
  const adjacent=p=>party[p.slot^1]?.hp ? party[p.slot^1] : null;
  const boost=(unit,i,base)=>base+2*((unit.stars[i]||1)-1);
  function addCharge(event,actor,target,amount) {
    if(!target?.hp||actor===target)return;
    const old=target.gauge;
    target.gauge=Math.min(100,target.gauge+amount);
    if(old<100&&target.gauge===100)target.feedFrom=actor.id;
    notify(event,"party",target.slot,"ゲージ","state",15);
  }
  function mend(event,target,amount) {
    if(!target?.hp)return;
    const healed=Math.min(target.maxHp-target.hp,Math.round(amount));
    if(healed>0){target.hp+=healed;notify(event,"party",target.slot,"+"+healed,"heal");}
  }
  const weak=arr=>live(arr).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  let lastTarget=null, victorious=false;
  snapshot(0);

  function hurt(event,attacker,target,amount,side,opts={}) {
    let damage=Math.max(1,Math.round(attacker.attack*amount-target.defense*(target.broken ? .28 : .57)));
    if (opts.element && opts.element===target.weak) damage=Math.round(damage*1.34);
    if (opts.follow && (target.mark || target===lastTarget)) damage=Math.round(damage*1.43);
    const crit=random()<.10;
    if (crit) damage=Math.round(damage*1.5);
    const protectedAmount=Math.min(target.guard,Math.max(0,damage-1));
    target.guard-=protectedAmount;
    if (protectedAmount) notify(event,side,target.slot,"守り","protect",21);
    damage=Math.min(damage-protectedAmount,target.hp);
    target.hp-=damage; target.hitCount++;
    if (!target.hp && side==="foes") target.defeatedAt=event.impact;
    if (side==="party") target.gauge=Math.min(100,target.gauge+8);
    const kind=side==="party"?"hurt":crit?"critical":"damage";
    notify(event,side,target.slot,String(damage),kind);
    if (crit) notify(event,side,target.slot,"会心","criticalState",20);
    if (side==="party" && !target.hp) {
      target.gauge=0;
      notify(event,side,target.slot,"倒れた","hurtState",20);
      for (const member of live(party)) {
        if (member.id==="H01" && passive(member,7) && (member.slot^1)===target.slot)guard(event,member,boost(member,7,7));
        if (member.id==="H02" && passive(member,7) && target.slot<2)mend(event,adjacent(member),boost(member,7,8));
        if (member.id==="H11" && passive(member,8)) {
          mend(event,sideMate(member),boost(member,8,8));
          mend(event,adjacent(member),boost(member,8,8));
        }
      }
      if(target.id==="H04"&&passive(target,11)&&live(party).length)guard(event,weak(party),boost(target,11,20));
    } else if(side==="party" && target.hp && target.slot<2) {
      const defender=adjacent(target);
      if(defender?.id==="H04"&&passive(defender,6))guard(event,defender,boost(defender,6,2));
    }
    return damage;
  }
  function guard(event,target,amount,relay=true) {
    if(!target?.hp)return;
    target.guard=Math.min(35,target.guard+Math.round(amount));
    notify(event,"party",target.slot,"守り","protect",18);
    if(relay&&target.id==="H06"&&passive(target,7)&&!target.sharedGuard) {
      target.sharedGuard=true;guard(event,adjacent(target),boost(target,7,6),false);
    }
  }
  function fireEnemy(event,enemy) {
    const alive=live(party);
    if (!alive.length) return;
    const side=enemy.slot%2;
    const rows=order=>order.map(i=>party[i]).find(unit=>unit?.hp>0);
    let target=enemy.focus==="rear" ? rows([2+side,3-side,side,1-side]) :
      enemy.focus==="weak" ? weak(party) : rows([side,1-side,2+side,3-side]);
    if (enemy.charge) target=enemy.nextLane==="rear"?rows([2+side,3-side,side,1-side]):rows([side,1-side,2+side,3-side]);
    const initial=target;
    event.target=target.slot;
    if (enemy.boss && !enemy.charge && enemy.turns%(enemy.tempo||3)===1) {
      enemy.charge=1;
      const sequence=enemy.lanes||["rear","front"];
      enemy.nextLane=sequence[Math.floor(enemy.turns/(enemy.tempo||3))%sequence.length];
      event.kind="charge";
      event.headline=enemy.name+"が構える";
      event.result=enemy.nextLane==="front"?"前列を狙う":"後列を狙う";
      event.row=enemy.nextLane;
      const shield=perks("H04");
      if(event.row==="rear"&&shield&&passive(shield,7))guard(event,sideMate(shield),boost(shield,7,12));
      return;
    }
    const protector=alive.find(p=>p.taunt>0 || (p.cover>0 && p!==target)) ||
      alive.find(p=>p.id==="H04" && passive(p,9) && target.slot>=2 && p.slot<2 && alive.filter(m=>m.slot<2).length===1);
    if (protector && protector!==target) {
      protector.usedShoulder=true;
      protector.taunt=Math.max(0,protector.taunt-1); protector.cover=Math.max(0,protector.cover-1);
      reasons.push({kind:"cover",actor:protector.id,friend:target.id,enemy:enemy.name});
      notify(event,"party",protector.slot,"かばう","state",22);
      if(protector.id==="H04"&&passive(protector,8))protector.gauge=Math.min(100,protector.gauge+boost(protector,8,17));
      if(target.id==="H03"&&passive(target,11))guard(event,protector,boost(target,11,9));
      if(target.id==="H06"&&passive(target,9))target.covered=true;
      if(target.id==="H11"&&passive(target,6))addCharge(event,target,protector,boost(target,6,13));
      if(target.id==="person_077"&&passive(target,9))mend(event,protector,boost(target,9,13));
      if(target.id==="H12"&&passive(target,11)&&!target.usedShare&&protector.defense>=17){
        target.usedShare=true;addCharge(event,target,protector,boost(target,11,27));
      }
      const bow=perks("H05");
      if(bow&&passive(bow,7))hurt(event,bow,enemy,.49,"foes",{element:bow.element});
      target=protector;
    }
    event.target=target.slot;
    const power=(enemy.charge ? 2.52 : enemy.brace && enemy.turns%3===0 ? 1.43 : .97)*(enemy.shaken?.72:1);
    enemy.shaken=false;
    const lane=enemy.charge ? enemy.nextLane : null;
    const line=lane && live(party).filter(p=>lane==="rear" ? p.slot>=2 : p.slot<2);
    event.kind="enemy";
    const move=enemy.charge ? (enemy.bigMove||"渦の一撃") : (enemy.move||"打ちかかる");
    enemy.charge=0;
    event.headline=enemy.name+"の"+move+"！";
    event.affected=[target.slot];
    const healer=perks("person_077");
    if(healer&&passive(healer,8)&&target.justMended){guard(event,target,boost(healer,8,8));target.justMended=false;}
    if(!lane && target.speed>=enemy.speed+4 && random()<.08){
      notify(event,"party",target.slot,"回避","state");
      const wind=perks("H15");
      if(target.slot<2&&wind&&passive(wind,10))hurt(event,wind,enemy,.4,"foes",{element:"wind"});
      event.result=partyName(target.id)+"はかわした";return;
    }
    const damage=hurt(event,enemy,target,power,"party");
    if(enemy.poison && target.hp) {
      target.poison=Math.max(target.poison||0,2);
      notify(event,"party",target.slot,"毒","hurtState",17);
    }
    for(const ally of line || []) {
      if(ally===target||ally===initial)continue;
      hurt(event,enemy,ally,power*.71,"party");event.affected.push(ally.slot);
    }
    event.result=target!==initial ? partyName(target.id)+"がかばった" : partyName(target.id)+"に "+damage;
    if (!target.hp) event.result=partyName(target.id)+"は倒れた";
    if(target.hp&&target.id==="H03"&&passive(target,6)&&target.slot<2&&!target.firstHit) {
      target.gauge=Math.min(100,target.gauge+boost(target,6,19));target.firstHit=true;
    }
    const lead=perks("H01"), mage=perks("H02"), craft=perks("H03"), lamp=perks("H11"), hook=perks("H12");
    if(lead&&passive(lead,6)&&!lead.usedMark){enemy.mark=1;lead.usedMark=true;}
    if(lead&&passive(lead,9)&&initial.slot<2&&enemy.hp) {
      hurt(event,lead,enemy,.38,"foes",{follow:true});event.counter=enemy.slot;
    }
    if(mage&&passive(mage,6)&&enemy.lastTarget===initial.id)enemy.mark=1;
    if(craft&&passive(craft,8)&&initial.slot>=2&&!craft.usedRope){guard(event,initial,boost(craft,8,9));craft.usedRope=true;}
    if(lamp&&passive(lamp,7)&&initial.slot>=2&&!lamp.usedRear){guard(event,initial,boost(lamp,7,11));lamp.usedRear=true;}
    if(hook&&passive(hook,10)&&/突進|圧/.test(move))enemy.due+=6;
    if(hook&&passive(hook,8)&&lane&&target.slot<2)addCharge(event,hook,target,boost(hook,8,16));
    enemy.lastTarget=initial.id;
  }

  function playerAction(event,actor) {
    if(actor.poison) {
      actor.poison--;
      actor.hp=Math.max(1,actor.hp-5);notify(event,"party",actor.slot,"毒","hurtState",19);
    }
    const normal=actor.equipped[0] ?? 0, active=actor.equipped[1] ?? 3;
    const rules=SKILL_FLAGS[actor.id] || SKILL_FLAGS.H01;
    const activeRule=rules[active];
    const wounded=weak(party);
    const waiting=(activeRule.wait==="fallen" && !party.some(p=>p && !p.hp)) ||
                  (activeRule.wait==="hurt" && wounded.hp>wounded.maxHp*.78);
    const index=actor.gauge>=100 && !waiting ? active : normal;
    const rule=rules[index], star=actor.stars[index]||1;
    const isActive=index>=3;
    event.active=isActive;
    event.headline=partyName(actor.id)+"の"+CAST[actor.id].skills[index].name+"！";
    event.kind=isActive?"skill":"cut";
    if (isActive) {
      actor.gauge=0;
      if (actor.feedFrom) reasons.push({kind:"feed",actor:actor.feedFrom,friend:actor.id});
      actor.feedFrom=null;
    } else actor.gauge=Math.min(100,actor.gauge+(rule.gain||27));
    if (rule.cover) {
      actor.cover=2;
      if(actor.id==="H12"&&passive(actor,7)&&wounded.hp<wounded.maxHp*.62)guard(event,actor,boost(actor,7,7));
    }
    if(actor.turns===1){
      if(actor.id==="H04"&&passive(actor,10)&&save.members[actor.id].gear[3])guard(event,adjacent(actor),boost(actor,10,12));
      if(actor.id==="H02"&&passive(actor,8))addCharge(event,actor,sideMate(actor),boost(actor,8,20));
      if(actor.id==="person_077"&&passive(actor,7)&&live(foes).some(f=>f.poison))actor.gauge+=boost(actor,7,20);
      if(actor.id==="H05"&&passive(actor,6))actor.due-=boost(actor,6,12);
      if(actor.id==="H15"&&passive(actor,9)&&actor.slot<2)for(const p of live(party).filter(p=>p.slot>=2))p.due-=boost(actor,9,11);
    }
    if(rule.speedTeam)for(const p of live(party).filter(p=>p!==actor))p.due-=boost(actor,11,15);
    if (rule.taunt) {actor.taunt=2;notify(event,"party",actor.slot,"挑発","state",21);}
    if (rule.guard) {
      const ally=party[actor.slot^2]?.hp ? party[actor.slot^2] : wounded;
      const targets=rule.guard==="team"?live(party):rule.guard==="back"?live(party).filter(p=>p.slot>=2):
        rule.guard==="front"?live(party).filter(p=>p.slot<2):
        rule.guard==="pair"?[...new Set([actor,ally])]:[rule.guard==="self"?actor:rule.guard==="weak"?wounded:ally];
      for (const member of targets) guard(event,member,isActive?9+star*2:3+star);
    }
    if (rule.pass) {
      const recipient=live(party).filter(p=>p!==actor).sort((a,b)=>rule.delayAlly?a.speed-b.speed:b.gauge-a.gauge)[0];
      if(recipient){
        if(rule.delayAlly)recipient.due-=20;
        addCharge(event,actor,recipient,29+star);
        if(actor.id==="H15"&&passive(actor,11)&&actor.slot>=2&&!actor.firstGust){actor.firstGust=true;guard(event,recipient,boost(actor,11,12));}
        if(recipient.id==="H15"&&passive(recipient,7)&&actor.speed<recipient.speed&&!recipient.windReturn){
          recipient.windReturn=true;addCharge(event,recipient,actor,boost(recipient,7,19));
        }
      }
    }
    if (rule.heal || rule.revive) {
      const target=rule.revive?party.find(p=>p && !p.hp):wounded;
      const potential=Math.round(target.maxHp*(rule.heal||rule.revive)+star*2);
      const healed=Math.min(target.maxHp-target.hp,potential);
      if(rule.cleanse && target.poison){target.poison=0;notify(event,"party",target.slot,"毒が消えた","protect",15);}
      if(actor.id==="person_077"&&passive(actor,6)&&potential>healed)mend(event,adjacent(target),potential-healed);
      if(rule.healRow || actor.id==="person_077"&&passive(actor,11)&&actor.wasHealed)
        for(const p of live(party).filter(p=>p!==target&&p.slot<2))mend(event,p,p.maxHp*.19);
      if (healed>0) {
        target.hp+=healed;target.justMended=true;target.wasHealed=true;
        notify(event,"party",target.slot,"+"+healed,"heal");
        if (rule.revive) {
          notify(event,"party",target.slot,"復活","revive",18);
          reasons.push({kind:"revive",actor:actor.id,friend:target.id});
          if(actor.id==="person_077"&&passive(actor,10))addCharge(event,actor,target,boost(actor,10,20));
          if(actor.id==="H02"&&passive(actor,10)&&actor.slot>=2)target.due-=boost(actor,10,17);
          const lead=perks("H01");
          if(lead&&passive(lead,11)&&!target.stoodGuard){target.stoodGuard=true;guard(event,target,boost(lead,11,16));}
        } else if(actor.id==="H02"&&passive(actor,9)&&target.guard)target.due-=boost(actor,9,12);
      } else if (actor.id==="H02" && passive(actor,6)) guard(event,actor,5);
      event.result=partyName(target.id)+(rule.revive?"が立ち上がった":"に手当て");
      event.target=target.slot;
      if (isActive && !rule.power) event.kind=rule.revive?"revive":"heal";
    }
    if(rule.cleanse && !rule.heal && wounded.poison)wounded.poison--;
    if (!rule.power) {
      event.target ??= actor.slot;
      if (!rule.heal && !rule.revive) event.kind="guard";
      event.result ||= "味方が身を守った";
      return;
    }
    if(actor.id==="H11"&&passive(actor,11)&&waiting&&actor.gauge>=100)mend(event,wounded,boost(actor,11,9));
    const candidates=live(foes);
    const rec=actor.ranged || rule.range;
    const fighter=rule.interrupt && candidates.find(f=>f.charge && rec) ||
      actor.id==="H05"&&actor.slot>=2&&passive(actor,9)&&weak(candidates.slice(1)) ||
      rule.back && candidates.at(-1) || rule.follow && lastTarget && lastTarget.hp && lastTarget ||
      rule.break && candidates.find(f=>f.brace || f.guard) || candidates[rec && actor.slot%2 ? candidates.length-1:0];
    const targets=rule.spread?candidates.slice(0,3):[fighter];
    event.target=fighter.slot;
    if (targets.length>1) {event.kind="fire";event.targets=targets.map(t=>t.slot);}
    const wind=perks("H15"), hinge=perks("H03"), weight=perks("H06"), hook=perks("H12"), lamp=perks("H11");
    for (const foe of targets) {
      if(wind&&passive(wind,6)&&!wind.marked){wind.marked=true;foe.mark=1;}
      if(actor.id==="H15"&&passive(actor,8)&&actor.turns===1&&foe.focus==="rear")foe.broken=2;
      if(rule.redirect&&foe.charge){foe.nextLane="rear";foe.due+=8;}
      if (rule.interrupt && foe.charge) {
        foe.charge=0;
        foe.due+=9;
        notify(event,"foes",foe.slot,"大技を止めた","state",21);
        reasons.push({kind:"stop",actor:actor.id,enemy:foe.name});
        const healer=perks("H02");
        if(healer&&passive(healer,11))mend(event,actor,boost(healer,11,11));
      }
      foe.due+=Math.min(rule.delay || 0,foe.boss?4:17);
      if(rule.break||actor.covered&&!isActive) {
        actor.covered=false;foe.broken=2;foe.guard=Math.max(0,foe.guard-(rule.break||1)*8);
        if(actor.id==="H01"&&passive(actor,10))actor.due-=boost(actor,10,10);
        if(actor.id==="H03"&&passive(actor,9))foe.shaken=true;
      }
      if(rule.push||rule.pull) {
        foe.due+=foe.boss?6:16;
        if(rule.push&&passive(actor,6))foe.mark=1;
        if(rule.pull&&actor.id==="H12"&&passive(actor,6)&&!actor.usedPull){actor.usedPull=true;foe.charge=0;}
        if(hinge&&passive(hinge,7))foe.due+=5;
        if(weight&&passive(weight,8))addCharge(event,actor,weight,boost(weight,8,13));
        const stream=perks("H08");if(stream&&passive(stream,6))stream.gauge=Math.min(100,stream.gauge+boost(stream,6,18));
      }
      if(actor.id==="H06"&&passive(actor,11)&&actor.turns===1&&actor.attack>=26)foe.due+=boost(actor,11,9);
      if(hinge&&passive(hinge,10)&&lastTarget===foe&&foe.lastBy!==actor.id)foe.due+=4;
      if(hook&&passive(hook,9)&&rule.mark)addCharge(event,actor,hook,boost(hook,9,13));
      if(actor.id==="H08"&&passive(actor,7)&&actor.turns===1)foe.mark=1;
      if(actor.id==="H08"&&passive(actor,8)&&foe!==candidates[0])foe.mark=1;
      if(actor.id==="H08"&&passive(actor,10)&&actor.slot<2&&actor.turns===1)guard(event,sideMate(actor),boost(actor,10,8));
      if(actor.id==="H08"&&passive(actor,11)&&foe.due>actor.due+150)foe.broken=2;
      const glass=perks("H13"), spark=perks("H14");
      if(glass&&glass!==actor&&passive(glass,6)&&foe.mark&&rec)addCharge(event,glass,actor,boost(glass,6,10));
      if(glass&&passive(glass,8)&&actor.turns===1&&actor.slot>=2)mend(event,actor,boost(glass,8,8));
      if(glass&&passive(glass,9)&&lastTarget&&lastTarget!==foe&&foe.defense>=15)foe.mark=1;
      if(actor.id==="H13"&&passive(actor,7)&&foe.broken&&candidates.at(-1)!==foe)hurt(event,actor,candidates.at(-1),.34,"foes",{element:"light"});
      if(spark&&passive(spark,6)&&actor.element&&!actor.firstElement) {
        actor.firstElement=true;addCharge(event,spark,actor,boost(spark,6,12));
      }
      if(spark&&passive(spark,11)&&spark.slot<2&&rule.break&&spark!==actor&&foe.hp)hurt(event,spark,foe,.40,"foes",{element:"fire"});
      const chain=lastTarget===foe && foe.lastBy!==actor.id;
      if(chain&&lamp&&passive(lamp,9))mend(event,actor,boost(lamp,9,5));
      const element=rule.element||actor.element;
      if(lamp===actor&&passive(actor,10)&&element==="light")for(const p of live(party).filter(p=>p.slot<2))p.poison=Math.max(0,(p.poison||0)-1);
      if(rule.back&&actor.id!=="H05"&&passive(perks("H05"),11)&&candidates[0]!==foe)candidates[0].broken=1;
      if(actor.id==="H05"&&passive(actor,8)&&foe.evadedBolt)foe.mark=1;
      const evades=foe.focus==="rear"&&actor.id==="H05"&&!foe.mark&&random()<.07;
      if(evades){foe.evadedBolt=true;notify(event,"foes",foe.slot,"回避","state");event.result=foe.name+"はかわした";continue;}
      const n=hurt(event,actor,foe,rule.power*(1+(star-1)*.115),"foes",{...rule,element});
      if(weight&&passive(weight,10)&&chain&&foe.hp)hurt(event,weight,foe,.35,"foes",{});
      const stream=perks("H08");
      if(stream&&stream!==actor&&passive(stream,9)&&chain&&element==="water"&&foe.hp)hurt(event,stream,foe,.43,"foes",{element:"water"});
      if(spark&&passive(spark,7)&&chain&&element==="fire")spark.gauge=Math.min(100,spark.gauge+boost(spark,7,13));
      if(spark&&passive(spark,8)&&!foe.hp&&element==="fire"){
        const next=live(foes)[0];if(next)hurt(event,spark,next,.5,"foes",{element:"fire"});
      }
      if(actor.id==="H05"&&passive(actor,10)&&!foe.hp)actor.gauge=Math.min(100,actor.gauge+boost(actor,10,19));
      if(foe.broken)foe.broken--;
      if(rule.mark)foe.mark=1;
      foe.lastBy=actor.id;
      lastTarget=foe;
      event.result=foe.hp>0 ? foe.name+"に "+n : foe.name+"は倒れた！";
    }
    if (isActive && actor.id==="H01" && passive(actor,8)) {
      const ally=party[actor.slot^2];
      if(ally?.hp)addCharge(event,actor,ally,boost(actor,8,22));
    }
  }
  for (let step=0;step<100 && live(party).length && live(foes).length;step++) {
    const turn=[
      ...live(party).map(unit=>({unit,side:"party"})), ...live(foes).map(unit=>({unit,side:"foes"}))
    ].sort((a,b)=>a.unit.due-b.unit.due || b.unit.speed-a.unit.speed)[0];
    const at=540+step*620;
    const event={at,impact:at+265,until:at+610,actor:turn.unit.slot, side:turn.side};
    const unit=turn.unit;
    unit.turns++;
    if (turn.side==="party") playerAction(event,unit);
    else fireEnemy(event,unit);
    unit.due+=Math.round(1100 / unit.speed);
    events.push(event); snapshot(event.impact);
  }
  victorious=!live(foes).length;
  const end=(events.at(-1)?.until||630)+390;
  return {frames,events,notices,reasons,victorious,stalemate:!victorious && Boolean(live(party).length),end,
    health:party.map(p=>p?.hp??null)};
}
