const experienceAt = level => 16 * (level - 1) ** 2;
const experienceLevel = xp => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 16));
const exploredLevels = [1,3,7,12,17,22,27,32,37,43,49,56,62,72];
const combatLevels = [1,2,5,8,12,16,20,24,28,33,38,44,50,64];

export function adventureFieldLevel(rawLevel) {
  const level = Number(rawLevel) || 1;
  if (level <= 1) return 1;
  const right = exploredLevels.findIndex(threshold => threshold >= level);
  if (right < 0) return Math.round(level - 8);
  const proportion = (level - exploredLevels[right - 1]) / (exploredLevels[right] - exploredLevels[right - 1]);
  return Math.round(combatLevels[right - 1] + (combatLevels[right] - combatLevels[right - 1]) * proportion);
}

export function adventureBossLevel(boss) {
  if (!boss) return 1;
  return boss.chapter ? combatLevels[boss.chapter] : adventureFieldLevel(boss.level);
}

export function adventureBattleExperience(current, encounterLevel, enemies, boss = false) {
  const level = experienceLevel(current);
  if (level === 1) return Math.min(28 - current, Math.max(6, (boss ? 23 : 16) + Math.max(0, enemies - 1) * 2));
  const company = 1 + Math.max(0, enemies - 1) * .16;
  const step = experienceAt(encounterLevel + 1) - experienceAt(encounterLevel);
  const catchUp = Math.max(0, experienceAt(Math.max(1, encounterLevel - 2)) - current) * .15;
  const allowance = experienceAt(level + (level < 7 ? 2 : 3)) - current - 1;
  const roaming = .42 + .40 * Math.min(1, Math.max(0, (encounterLevel - 8) / 11));
  return Math.max(1, Math.min(allowance, Math.round(step * (boss ? 1.13 : roaming) * company + catchUp)));
}

const pressure = [
  null, null,
  {pattern:'wave', target:'all', warning:'鋏の白泡が横に伸びる。', cue:'次の一撃は味方全体。盾を割るか、守りを固める。'},
  {pattern:'roots', target:'all', warning:'足元の根が扇状に広がる。', cue:'根を叩き切ると大技が止まる。遅れたら全員を守る。'},
  {pattern:'plate', target:'all', warning:'橋桁が震え、打ち払いが来る。', cue:'別の系統で盾を削る。'},
  {pattern:'heat', target:'all', warning:'積み石が赤熱し、熱が吹き出す。', cue:'水や刃で崩す。盾が残ったら受ける味方を守る。'},
  {pattern:'dive', target:'one', warning:'翼の影が狙った味方に止まる。', cue:'影のついた味方を守る。着地前の盾割りでも止まる。'},
  {pattern:'echo', target:'all', warning:'鎖の節が鳴り、反響が広がる。', cue:'違う属性で反響を散らす。盾を割るか、全体を守る。'},
  {pattern:'arms', target:'alternate', warning:'触腕の向きが変わる。', cue:'一本なら狙われた味方、広げたら全員を守る。'},
  {pattern:'copy', target:'one', warning:'複数の眼が一人を見据える。', cue:'狙われた仲間を守る。攻撃上昇があると威力を写される。'},
  {pattern:'gale', target:'all', warning:'高く張った翼に砂が集まる。', cue:'全員を守る。前脚が着いた次の巡は攻めやすい。'},
  {pattern:'heads', target:'alternate', warning:'一つの首が合図を出す。', cue:'表示された対象を守る。残り体力は次の巡までに戻す。'},
  {pattern:'phases', target:'all', warning:'姿勢が深く沈み、力が集まる。', cue:'いまの足場で盾を割るか、全員で守る。'}
];

export function adventureBossBalance(chapter, level, members, squadLevel = level) {
  const plan = pressure[chapter];
  if (!plan) return null;
  const partyScale = 1 + (Math.max(1, members) - 1) * (plan.target === 'one' ? .40 : .34);
  const phases = chapter === 12 ? 1.55 : 1;
  const extra = chapter <= 3 ? Math.min(4, Math.max(0, squadLevel - level - .5)) : 0;
  const offense = Math.round((17 + level * 4.15) * (1 + extra * .065));
  const armor = Math.round(9 + level * 2.42);
  return {
    attack:offense, magicAttack:offense, defense:armor, magicDefense:armor,
    maxHp:Math.round((205 + level * 47) * partyScale * phases * (1 + extra * .13)),
    crit:0,
    tactics: {
      ...plan,
      chargedPower:plan.target === 'one' ? 4.25 : chapter <= 3 ? 3.78 : 3.67,
      probingPower:chapter <= 3 ? 1.20 : 1.31,
      shielded:.31, weakShielded:.59
    }
  };
}
