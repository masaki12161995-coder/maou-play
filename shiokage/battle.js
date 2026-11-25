const FRAMES = {
  back: [1, 3], step: [0, 3], nextStep: [2, 3],
  face: [1, 0], skill: [0, 4]
};

const attributes = {
  火: ['◆', '#ff916f'], 水: ['●', '#79baff'], 風: ['≋', '#8de0aa'], 土: ['■', '#deb07a'],
  雷: ['ϟ', '#ffe375'], 氷: ['❄', '#a9ebff'], 光: ['✦', '#fff0b9'], 闇: ['◐', '#d5a9ff'],
  剣: ['†', '#efcaaa'], 大剣: ['‡', '#efcaaa'], 短剣: ['‹', '#ffadbb'], 槍: ['↑', '#c2e9e1'],
  斧: ['◒', '#edbda2'], 弓: ['⌁', '#e0c98b'], 杖: ['⌑', '#d2bae9'], 素手: ['◇', '#f4d0bb'],
  盾: ['⬘', '#b8d4ef'], その他: ['◇', '#e3d8c9'], なし: ['◇', '#e3d8c9']
};

export function attributeInfo(name) {
  const [glyph, color] = attributes[name] ?? attributes.その他;
  return { name: name || '無', glyph, color };
}

const themes = {
  field: ['#142126', '#354945', '#213631', '#142523', '#102022', '#7f9675', '#d7a672'],
  town: ['#251d2a', '#5a3f3c', '#423032', '#2c252b', '#201c25', '#94675b', '#e6ac64'],
  cave: ['#101d27', '#253c46', '#20323d', '#192936', '#121c29', '#577c88', '#86b8ae'],
  ruin: ['#242032', '#4c3b46', '#3d3548', '#272635', '#211e2c', '#897287', '#d2a48d'],
  coast: ['#17283c', '#3b5061', '#283e50', '#192e3d', '#142534', '#70968f', '#e6c98b'],
  snow: ['#273347', '#56647a', '#4b5a6c', '#344557', '#232e42', '#8eacc6', '#f1ddc9'],
  ash: ['#2c1b27', '#67404b', '#503040', '#352635', '#291d2c', '#a86969', '#f2a278'],
  final: ['#1a162a', '#473052', '#342647', '#251f39', '#1c172e', '#937199', '#efb6d5']
};

const marks = {
  heal: '体力回復', restore: '気力回復', revive: '蘇生', guard: '被ダメージ軽減', drain: '体力吸収',
  weaken: '攻撃低下', strengthen: '攻撃上昇', ward: '防御上昇', poison: '毒',
  slow: '速度低下', stun: '行動不能', shatter: '盾削り', cleanse: '弱体を解除'
};
const statusInfo = {
  strengthen: ['攻↑', .25, false], ward: ['防↑', .28, false], weaken: ['攻↓', .30, true],
  poison: ['毒', .07, true], slow: ['速↓', .25, true], stun: ['止', 1, true]
};
const beneficial = new Set(['heal', 'restore', 'revive', 'guard', 'strengthen', 'ward', 'cleanse']);
const statusOnly = new Set(['strengthen', 'ward', 'cleanse']);
const spellStyles = { 火: 'fire', 水: 'water', 風: 'wind', 土: 'earth', 雷: 'lightning', 氷: 'ice', 光: 'light', 闇: 'dark' };
const targetLabel = { one: '敵1体', all: '敵全体', self: '自分', ally: '味方1人', allies: '味方全体' };

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, action, className = '', disabled = false) {
  const node = element('button', `cb-button ${className}`, label);
  node.type = 'button';
  node.disabled = disabled;
  node.addEventListener('click', action);
  return node;
}

function trait(name, className = '') {
  const { glyph, color, name: label } = attributeInfo(name);
  const node = element('span', `cb-attribute ${className}`, glyph);
  node.style.setProperty('--cb-element', color);
  node.setAttribute('aria-label', label);
  node.title = label;
  return node;
}

function copy(object) {
  return JSON.parse(JSON.stringify(object));
}

function cleanNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function bounded(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function healthPhase(unit) {
  const count = Math.max(1, Math.floor(cleanNumber(unit.phaseCount, 1)));
  return 1 + Math.min(count - 1, Math.floor((unit.maxHp - unit.hp) * count / unit.maxHp));
}

function phaseDamage(unit, loss) {
  const count = Math.max(1, Math.floor(cleanNumber(unit.phaseCount, 1)));
  const phase = healthPhase(unit);
  if (phase === count) return loss;
  const floor = Math.floor(unit.maxHp * (count - phase) / count);
  return Math.min(loss, unit.hp - floor);
}

function normalizeSkill(skill, i) {
  const target = skill.effect === 'guard' ? 'self' : beneficial.has(skill.effect) ? 'ally' : 'one';
  return {
    id: `技${i}`, name: '一閃', attribute: skill.weapon || '素手', power: 1.45,
    target, hits: 1, cost: 0, ...skill
  };
}

function normalize(unit, ally, i) {
  const maxHp = Math.max(1, cleanNumber(unit.maxHp, 100));
  const maxMp = Math.max(0, cleanNumber(unit.maxMp, ally ? 18 : 0));
  const maxShield = Math.max(1, cleanNumber(unit.shield, 2));
  const weakness = [...new Set(unit.weaknesses?.length ? unit.weaknesses : ['剣', '光'])];
  const attack = cleanNumber(unit.attack, 17);
  const defense = cleanNumber(unit.defense, 6);
  return {
    ...unit, side: ally ? 'ally' : 'enemy', index: i, id: unit.id ?? i, key: `${ally ? 'a' : 'e'}${i}`,
    hp: bounded(cleanNumber(unit.hp, maxHp), 0, maxHp), maxHp,
    mp: bounded(cleanNumber(unit.mp, maxMp), 0, maxMp), maxMp,
    attack, defense, magicAttack: cleanNumber(unit.magicAttack, attack), magicDefense: cleanNumber(unit.magicDefense, defense),
    speed: cleanNumber(unit.speed, 10), accuracy: cleanNumber(unit.accuracy, 100),
    evasion: cleanNumber(unit.evasion, 0), crit: cleanNumber(unit.crit, 0),
    weapon: unit.weapon || unit.attribute || '素手', boost: 1, maxShield, guard: Math.max(1,maxShield-(unit.openingShieldCuts??0)),
    skills: (unit.skills || []).map((skill, index) => normalizeSkill({ weapon: unit.weapon || 'なし', ...skill }, index)),
    weakness, broken: 0, guarding: false, weakened: 0, statuses: {}, gearUsed: {}, guardedAt:-2,
    echoedAttribute:'', echoedHits:0,
    known: new Set(unit.knownWeaknesses?.filter(x => weakness.includes(x)) || [])
  };
}

function reportUnit(unit) {
  const result = { ...unit, knownWeaknesses: [...unit.known] };
  for (const key of ['key', 'known', 'weakness', 'side', 'boost', 'guard', 'broken', 'guarding', 'weakened', 'maxShield', 'statuses','gearUsed','guardedAt','echoedAttribute','echoedHits']) delete result[key];
  return result;
}

function matchesCheckpoint(checkpoint, party, enemies) {
  if (checkpoint?.version !== 1) return false;
  const matches = (saved, units) => Array.isArray(saved) && saved.length === units.length
    && units.every((unit, index) => unit.id === saved[index]?.id);
  const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);
  return matches(checkpoint.party, party) && matches(checkpoint.enemies, enemies)
    && Number.isSafeInteger(checkpoint.round) && checkpoint.round >= 1
    && Number.isSafeInteger(checkpoint.turns) && checkpoint.turns >= 0
    && isRecord(checkpoint.inventory) && isRecord(checkpoint.lastActions);
}

function restoreCombatUnit(unit, saved) {
  unit.hp = bounded(cleanNumber(saved.hp, unit.hp), 0, unit.maxHp);
  unit.mp = bounded(cleanNumber(saved.mp, unit.mp), 0, unit.maxMp);
  unit.boost = bounded(Math.floor(cleanNumber(saved.boost, unit.boost)), 0, 5);
  unit.maxShield = cleanNumber(unit.phaseShields?.[healthPhase(unit) - 1], unit.maxShield);
  unit.guard = bounded(Math.floor(cleanNumber(saved.guard, unit.guard)), 0, unit.maxShield);
  unit.broken = Math.max(0, Math.floor(cleanNumber(saved.broken, 0)));
  unit.weakened = Math.max(0, Math.floor(cleanNumber(saved.weakened, 0)));
  unit.guarding = bounded(cleanNumber(saved.guarding, 0), 0, .9) || false;
  unit.guardedAt=cleanNumber(saved.guardedAt,-2);
  unit.echoedAttribute=typeof saved.echoedAttribute==='string'?saved.echoedAttribute:'';
  unit.echoedHits=bounded(Math.floor(cleanNumber(saved.echoedHits,0)),0,5);
  unit.gearUsed=saved.gearUsed&&typeof saved.gearUsed==='object'?{...saved.gearUsed}:{};
  unit.statuses = Object.fromEntries(Object.keys(statusInfo).flatMap(key => {
    const status = saved.statuses?.[key];
    return Number.isSafeInteger(status?.until) && status.until >= 1
      ? [[key, { until: status.until, amount: bounded(cleanNumber(status.amount, statusInfo[key][1]), 0, 1) }]]
      : [];
  }));
  if (Array.isArray(saved.knownWeaknesses)) {
    unit.known = new Set(saved.knownWeaknesses.filter(entry => unit.weakness.includes(entry)));
  }
}

function checkpointUnit(unit) {
  const { id, hp, mp, boost, guard, broken, guarding, weakened, statuses, gearUsed, guardedAt, echoedAttribute, echoedHits } = unit;
  return { id, hp, mp, boost, guard, broken, guarding, weakened, statuses: copy(statuses), gearUsed:{...gearUsed},guardedAt,echoedAttribute,echoedHits,knownWeaknesses: [...unit.known] };
}

function physicalScale(desired = 1) {
  const dpr = window.devicePixelRatio || 1;
  return Math.max(1, Math.round(dpr * desired)) / dpr;
}

function personScale() {
  return physicalScale(window.innerHeight > 745 && window.innerWidth >= 370 ? 5 / 3 : 4 / 3);
}

function monsterScale(width, count) {
  if (count === 1) return physicalScale(width >= 145 ? 5 / 3 : width >= 75 ? 2 : 8 / 3);
  return physicalScale(width >= 90 ? 5 / 3 : width >= 53 ? 2 : 8 / 3);
}

const spriteUrl = source => `url(${JSON.stringify(source || '')})`;

function personFrame(node, source, pose, scale, flip) {
  const [column, row] = FRAMES[pose];
  node.style.width = `${48 * scale}px`;
  node.style.height = `${60 * scale}px`;
  node.style.backgroundImage = spriteUrl(source);
  node.style.backgroundSize = `${144 * scale}px ${300 * scale}px`;
  node.style.backgroundPosition = `${-column * 48 * scale}px ${-row * 60 * scale}px`;
  node.style.setProperty('--cb-flip', flip ? '-1' : '1');
}

function fillPortrait(holder, unit) {
  const portrait = element('i', 'cb-timeline-portrait');
  if (unit.side === 'ally' || unit.human) {
    const scale = physicalScale(4 / 3);
    personFrame(portrait, unit.sprite, 'face', scale, unit.side === 'enemy');
    portrait.style.top = `${-7 * scale}px`;
  } else {
    portrait.classList.add('cb-timeline-monster');
    portrait.style.backgroundImage = spriteUrl(unit.sprite);
    portrait.style.width = `${(unit.width || 48) * physicalScale()}px`;
    portrait.style.height = `${(unit.height || 48) * physicalScale()}px`;
    portrait.style.top = `${(27 - Math.min(unit.height || 48, 37)) / 2}px`;
  }
  holder.append(portrait);
}

function paintBackdrop(canvas, theme) {
  const rect = canvas.getBoundingClientRect();
  const resolution = 2;
  const w = Math.ceil(rect.width / resolution);
  const h = Math.ceil(rect.height / resolution);
  if (!w || !h || (canvas.width === w && canvas.height === h && canvas.dataset.theme === theme)) return;
  canvas.width = w;
  canvas.height = h;
  canvas.dataset.theme = theme;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const [sky, haze, far, near, ground, light, sun] = themes[theme] || themes.field;
  let seed = 9187;
  const rand = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  const horizon = Math.round(h * 0.44);
  const blend = ctx.createLinearGradient(0, 0, 0, horizon * 1.5);
  blend.addColorStop(0, sky);
  blend.addColorStop(0.76, haze);
  blend.addColorStop(1, ground);
  ctx.fillStyle = blend;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.25, h * 0.13, 3, w * 0.25, h * 0.13, w * 0.42);
  glow.addColorStop(0, `${sun}40`);
  glow.addColorStop(1, `${sun}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, horizon * 1.33);
  const indoor = ['cave', 'final'].includes(theme);
  const architectural = ['ruin', 'town'].includes(theme);
  for (let i = 0; i < 48; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(rand() * horizon * 1.06);
    ctx.globalAlpha = rand() * 0.26 + 0.06;
    ctx.fillStyle = y < horizon * 0.45 ? sun : light;
    ctx.fillRect(x, y, rand() < 0.31 ? 2 : 1, 1);
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 4; i++) {
    const crest = horizon - 14 + i * 6;
    ctx.fillStyle = [light, far, near, ground][i];
    ctx.globalAlpha = i === 0 ? 0.43 : 1;
    for (let x = 0; x < w; x += 2) {
      const wave = Math.sin((x + i * 31) * 0.035) * (7 + i * 2) + Math.sin(x * 0.085 + i * 2) * 4;
      const top = Math.round(crest + wave + rand() * 3);
      ctx.fillRect(x, top, 2, Math.max(8, Math.ceil(horizon * 0.63) + i * 5));
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon + 18, w, h);
  for (let i = 0; i < 56; i++) {
    const x = Math.floor(rand() * w);
    const height = Math.floor(4 + rand() * 13);
    const baseline = horizon + Math.round(rand() * 12);
    ctx.fillStyle = i % 7 === 0 ? light : near;
    if (architectural) {
      ctx.fillRect(x, baseline - height, 3 + i % 6, height + 4);
      if (i % 4 === 0) ctx.fillRect(x - 2, baseline - height - 1, 8, 2);
    } else {
      ctx.fillRect(x, baseline - height, 2, height + 5);
      for (let twig = 0; twig < height / 3; twig++) {
        ctx.fillRect(x - twig - 1, baseline - height + twig * 2, twig * 2 + 4, 1);
      }
    }
  }
  if (indoor) {
    ctx.fillStyle = near;
    for (let x = 0; x < w; x += 5) {
      const level = Math.round(8 + 19 * Math.sin(x / 10) ** 2 + rand() * 17);
      ctx.fillRect(x, 0, 5, level);
      ctx.fillRect(x + 1, level - 1, 2, 5);
    }
  }
  for (let i = 0; i < 380; i++) {
    const x = Math.floor(rand() * w);
    const y = Math.floor(horizon + 12 + rand() * (h - horizon - 12));
    ctx.fillStyle = i % 13 === 0 ? sun : i % 3 === 0 ? light : near;
    ctx.globalAlpha = i % 13 === 0 ? 0.11 : 0.23 + rand() * 0.33;
    ctx.fillRect(x, y, 1 + Math.floor(rand() * 7 * y / h), i % 15 === 0 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
  const shade = ctx.createRadialGradient(w * 0.46, h * 0.58, w * 0.18, w * 0.46, h * 0.58, w * 0.61);
  shade.addColorStop(0, `${ground}00`);
  shade.addColorStop(1, '#0a11199e');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
}

function rewardRows(items) {
  return (items || []).map(item => {
    const row = element('div', `cb-loot cb-rarity-${item.rarity ?? '白'}`);
    if (item.icon) {
      const icon = element('img', 'cb-loot-icon');
      icon.src = item.icon;
      icon.alt = '';
      row.append(icon);
    }
    const description = element('div', 'cb-loot-description');
    description.append(element('strong', '', item.name));
    const effect = item.effectLabel || item.note;
    if (effect) description.append(element('span', '', effect));
    row.append(description, element('b', '', item.equipment || item.slot ? item.rarity ?? '白' : `×${item.amount || 1}`));
    return row;
  });
}

export function startBattle(config) {
  const {
    mount, audio, items = [], inventory: startingInventory = {}, theme = 'field', title = '', fast = false,
    speed: initialSpeed = 'normal', onSpeedChange, rng = Math.random, onCommit, onFinish, rewards, rules = {}
  } = config;
  if (!mount || !config.party?.length || !config.enemies?.length) throw new Error('戦闘を開始できません');
  const party = config.party.slice(0, 4).map((unit, i) => normalize(unit, true, i));
  const enemies = config.enemies.slice(0, 4).map((unit, i) => normalize(unit, false, i));
  const units = [...party, ...enemies];
  const resumed = matchesCheckpoint(config.resume, party, enemies) ? config.resume : null;
  if (resumed) {
    party.forEach((unit, i) => restoreCombatUnit(unit, resumed.party[i]));
    enemies.forEach((unit, i) => restoreCombatUnit(unit, resumed.enemies[i]));
  }
  const inventory = { ...(resumed?.inventory ?? startingInventory) };
  const previousActions = resumed?.lastActions ?? config.lastActions;
  let lastActions = Array.isArray(previousActions)
    ? Object.fromEntries(previousActions.map((action, i) => [party[i]?.id, action]))
    : copy(previousActions || {});
  let round = resumed?.round ?? 1;
  let turns = resumed?.turns ?? 0;
  let currentIndex = 0;
  let page = 'main';
  let pageIndex = 0;
  let enemyFocus = null;
  let allyFocus = null;
  let plan = {};
  let resolving = false;
  let closed = false;
  let result = null;
  let speed = initialSpeed === 'fast' ? 'fast' : 'normal';
  let repeatPace = false;
  let lastEvent = '';
  let activation = 0;
  let roundOrder = null;
  let boostMeter = null;
  let committed = makeCheckpoint();
  const acted = new Set();
  const tacticalPlans = new Map();
  const totalXP = party.map(unit => unit.xp || 0);
  const refs = new Map();

  const root = element('section', 'cb-battle');
  root.setAttribute('aria-label', '戦闘');
  root.dataset.theme = theme;
  root.dataset.actionPhase = 'idle';
  root.style.setProperty('--cb-person-height', `${60 * personScale()}px`);
  const top = element('header', 'cb-header');
  const label = element('span', 'cb-location', title || '遭遇戦');
  const phaseLabel = element('span', 'cb-phase-label');
  phaseLabel.hidden = true;
  const roundLabel = element('span', 'cb-round');
  top.append(label, phaseLabel, roundLabel);
  const speedButton = onSpeedChange ? button('', () => {
    speed = speed === 'fast' ? 'normal' : 'fast';
    sfx('click');
    showSpeed();
    onSpeedChange(speed);
  }, 'cb-speed-button') : null;
  if (speedButton) top.append(speedButton);
  const timeline = element('div', 'cb-timeline');
  const arena = element('div', 'cb-arena');
  const backdrop = element('canvas', 'cb-backdrop');
  backdrop.setAttribute('aria-hidden', 'true');
  const field = element('div', 'cb-field');
  const monsterStage = element('div', 'cb-monsters');
  const partyStage = element('div', 'cb-party');
  const fxStage = element('div', 'cb-effects');
  const banner = element('div', 'cb-banner');
  const aim = element('div', 'cb-aim-label');
  aim.setAttribute('aria-live', 'polite');
  const intent = element('aside', 'cb-tactical-intent');
  intent.hidden = true;
  intent.setAttribute('aria-live','polite');
  arena.append(backdrop, field, fxStage, aim, banner);
  field.append(monsterStage, partyStage);
  const commands = element('section', 'cb-commands');
  commands.setAttribute('aria-label', 'コマンド');
  root.append(top, timeline, arena, commands);
  mount.replaceChildren(root);

  const phasedEnemy = enemies.find(unit => unit.phaseCount > 1);
  let battlefieldTheme = theme;
  let shownPhase = 0;
  const painter = () => paintBackdrop(backdrop, battlefieldTheme);
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(painter) : null;
  observer?.observe(arena);
  requestAnimationFrame(painter);
  const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const motionOff = () => media?.matches;
  const sfx = name => audio?.effect?.(name);
  const remain = unit => unit.hp > 0;
  const byKey = key => units.find(unit => unit.key === key);
  const current = () => party[currentIndex];
  const broken = (unit, at = round) => unit.broken >= at;
  const statusOn = (unit, tag, at = round) => unit.statuses[tag]?.until >= at ||
    (tag === 'weaken' && unit.weakened >= at);
  const statusAmount = (unit, tag, at = round) => statusOn(unit, tag, at)
    ? unit.statuses[tag]?.amount ?? statusInfo[tag][1] : 0;
  const canPlan = unit => remain(unit) && !broken(unit) && !statusOn(unit, 'stun');
  const pace = () => Math.max(0.68, (speed === 'fast' ? 0.76 : 1) * (fast ? 0.91 : 1) * (repeatPace ? 0.84 : 1));
  const time = ms => Math.round(ms * pace());
  const wait = ms => new Promise(resolve => setTimeout(resolve, time(ms)));
  const battleLevel = unit => Math.max(1, Math.floor(cleanNumber(unit.level, 1)));

  function showSpeed() {
    if (!speedButton) return;
    const name = speed === 'fast' ? '速い' : '通常';
    speedButton.replaceChildren(element('span', '', '速度'), element('strong', '', name));
    speedButton.setAttribute('aria-label', `戦闘の速度 ${name}。押して切り替える`);
    speedButton.disabled = resolving || !!result;
  }

  function setPhase(phase, actor) {
    root.dataset.actionPhase = phase;
    if (actor) root.dataset.actionActor = actor.key;
    if (phase === 'idle') {
      delete root.dataset.actionActor;
      delete root.dataset.hit;
    }
  }

  function syncEnemyPhase(notify = false) {
    if (!phasedEnemy || !remain(phasedEnemy)) return;
    const phase = healthPhase(phasedEnemy);
    if (shownPhase === phase) return;
    const oldPhase = shownPhase;
    shownPhase = phase;
    root.dataset.enemyPhase = String(phase);
    phaseLabel.hidden = false;
    phaseLabel.textContent = phasedEnemy.phaseNames?.[phase - 1] || `${phase}/${phasedEnemy.phaseCount}`;
    phaseLabel.setAttribute('aria-label', `戦いの段階 ${phase} / ${phasedEnemy.phaseCount} ${phaseLabel.textContent}`);
    battlefieldTheme = phasedEnemy.phaseThemes?.[phase - 1] || [theme, 'cave', 'final'][phase - 1] || theme;
    painter();
    if (notify && oldPhase) {
      const maxShield = phasedEnemy.phaseShields?.[phase - 1];
      if (Number.isFinite(maxShield) && maxShield > 0) {
        phasedEnemy.maxShield = maxShield;
        if (!broken(phasedEnemy)) phasedEnemy.guard = maxShield;
      }
      showBanner(`戦場が変わった　${phaseLabel.textContent}`);
      stagePulse('phase');
      sfx('step');
    }
  }

  function living(side) {
    return (side === 'ally' ? party : enemies).filter(remain);
  }

  function animate(node, frames, ms, options = {}) {
    if (!node?.animate || motionOff()) return;
    return node.animate(frames, { duration: time(ms), easing: 'cubic-bezier(.16,.74,.24,1)', ...options });
  }

  function teamOrder(at = round) {
    const available = unit => remain(unit) && !broken(unit, at) && !statusOn(unit, 'stun', at);
    if (at === round && roundOrder) return roundOrder.filter(available);
    const urgent = at === round && tacticalBeat(at) === 'surge' && enemies.some(unit=>unit.tactics&&available(unit));
    const speedAt = unit => {
      const prepared = urgent && unit.side === 'ally' &&
        ['guard','ward','heal','revive'].includes(plan[unit.id]?.effect);
      return unit.speed * (1 - statusAmount(unit, 'slow', at)) + (prepared ? 10000 : 0);
    };
    return units.filter(available).sort((first, second) =>
      speedAt(second) - speedAt(first) || first.key.localeCompare(second.key));
  }

  function showTimeline() {
    roundLabel.textContent = `${round}巡目`;
    const activeKey = resolving ? activation : !result && current()?.key;
    const bars = [[round, '今巡'], [round + 1, '次巡']].map(([at, text]) => {
      const line = element('div', 'cb-orderline');
      line.append(element('span', 'cb-orderlabel', text));
      for (const unit of teamOrder(at)) {
        const slot = element('span', `cb-orderchip cb-order-${unit.side}${activeKey === unit.key && at === round ? ' is-active' : ''}`);
        const spent = at === round && acted.has(unit.key);
        slot.classList.toggle('is-spent', spent);
        slot.classList.toggle('is-urgent', !!unit.tactics && tacticalBeat(at) === 'surge');
        slot.title = `${unit.name}　Lv ${battleLevel(unit)}`;
        slot.setAttribute('aria-label', spent ? `${slot.title}（行動済み）` : slot.title);
        fillPortrait(slot, unit);
        line.append(slot);
      }
      return line;
    });
    timeline.replaceChildren(...bars);
  }

  function drawUnit(unit) {
    const ally = unit.side === 'ally';
    const featured = !ally && unit.bossVisual && enemies.length === 1 && unit.width > 0 && unit.height > 0;
    const group = element('div', `cb-unit cb-${unit.side}`);
    if (!ally && unit.width >= 180) group.classList.add('is-wide');
    if (featured) {
      group.classList.add('is-featured');
      group.style.setProperty('--cb-boss-ratio', unit.width / unit.height);
    }
    const imageBox = element('div', 'cb-unit-image');
    const sprite = element(ally || unit.human ? 'div' : 'img', 'cb-sprite');
    const shadow = element('span', 'cb-shadow');
    if (ally || unit.human) {
      sprite.classList.add('cb-person');
      personFrame(sprite, unit.sprite, ally ? 'back' : 'face', personScale(), false);
    } else {
      sprite.classList.add('cb-monster');
      sprite.alt = '';
      sprite.draggable = false;
      sprite.src = unit.sprite;
      if (unit.width && !featured) {
        const rendered = unit.width * monsterScale(unit.width, enemies.length);
        sprite.style.width = `${rendered}px`;
        shadow.style.setProperty('--cb-shadow-size', `${rendered * .76}px`);
      }
      if (unit.width && unit.height) sprite.style.aspectRatio = `${unit.width} / ${unit.height}`;
      if (['飛ぶ', '浮く'].includes(unit.posture)) sprite.classList.add('is-airborne');
    }
    imageBox.append(shadow, sprite);
    const card = element('button', 'cb-unit-card');
    card.type = 'button';
    card.disabled = true;
    card.addEventListener('click', () => chooseTarget(unit));
    imageBox.addEventListener('click', () => chooseTarget(unit));
    const identity = element('div', 'cb-unit-identity');
    const name = element('strong', 'cb-unit-name', unit.name);
    name.title = unit.name;
    const level = element('span', 'cb-unit-level', `Lv ${battleLevel(unit)}`);
    level.setAttribute('aria-label', `レベル ${battleLevel(unit)}`);
    identity.append(name, level);
    const details = element('div', 'cb-unit-details');
    const hpTrack = element('div', 'cb-hp-track');
    const hpTrail = element('i', 'cb-hp-trail');
    const hp = element('i', 'cb-hp');
    hpTrack.append(hpTrail, hp);
    const mpTrack = element('div', 'cb-mp-track');
    const mp = element('i', 'cb-mp');
    mpTrack.append(mp);
    const hpText = element('b', 'cb-unit-hptext');
    const mpText = element('b', 'cb-unit-mptext');
    const status = element('div', 'cb-status-list');
    const guard = element('strong', 'cb-shield');
    const weak = element('div', 'cb-weaknesses');
    let charge;
    if (ally) {
      details.classList.add('cb-ally-details');
      const health = element('div', 'cb-resource-row');
      health.append(element('span', 'cb-resource-label', '体力'), hpTrack, hpText);
      const spirit = element('div', 'cb-resource-row');
      spirit.append(element('span', 'cb-resource-label', '気力'), mpTrack, mpText);
      details.append(health, spirit);
      charge = element('div', 'cb-boost-dots cb-unit-boost');
      for (let i = 0; i < 5; i++) charge.append(element('i', 'cb-boost-dot'));
      card.append(identity, details, charge, status);
      group.append(imageBox, card);
    } else {
      imageBox.append(element('span', 'cb-enemy-focus', '狙い'));
      details.append(guard, weak);
      card.append(identity, hpTrack, details, status);
      group.append(imageBox, card);
    }
    refs.set(unit.key, { group, imageBox, sprite, card, hp, hpTrail, mp, hpText, mpText, guard, weak, status, charge });
    (ally ? partyStage : monsterStage).append(group);
  }

  function updateUnit(unit) {
    const ui = refs.get(unit.key);
    if (!ui) return;
    ui.group.classList.toggle('is-dead', !remain(unit));
    ui.group.classList.toggle('is-broken', broken(unit));
    ui.group.classList.toggle('is-focused', unit === current() && !resolving && !result);
    ui.group.classList.toggle('is-guarding', unit.guarding);
    const health = `scaleX(${unit.hp / unit.maxHp})`;
    ui.hp.style.transform = health;
    ui.hpTrail.style.transform = health;
    if (unit.side === 'ally') {
      ui.hpText.textContent = unit.hp;
      ui.hpText.setAttribute('aria-label', `体力 ${unit.hp} / ${unit.maxHp}`);
      ui.mpText.textContent = unit.mp;
      ui.mpText.setAttribute('aria-label', `気力 ${unit.mp} / ${unit.maxMp}`);
      ui.mp.style.transform = `scaleX(${unit.maxMp ? unit.mp / unit.maxMp : 0})`;
      ui.charge.setAttribute('aria-label', `ブースト ${unit.boost}`);
      for (const [index, dot] of Array.from(ui.charge.children).entries()) {
        dot.classList.toggle('is-filled', index < unit.boost);
        dot.classList.remove('is-used');
      }
    } else {
      ui.guard.textContent = broken(unit) ? '砕' : unit.guard;
      ui.guard.setAttribute('aria-label', broken(unit) ? 'ブレイク中' : `守り ${unit.guard}`);
      ui.weak.replaceChildren(...unit.weakness.map(weakness => unit.known.has(weakness)
        ? trait(weakness, 'cb-weakness') : element('span', 'cb-weakness cb-unknown', '？')));
    }
    const badges = Object.entries(statusInfo).flatMap(([key, [mark, , harmful]]) => {
      if (!statusOn(unit, key)) return [];
      const chip = element('span', `cb-status-chip ${harmful ? 'is-down' : 'is-up'}`, mark);
      chip.title = marks[key];
      chip.setAttribute('aria-label', marks[key]);
      return [chip];
    });
    if (unit.guarding) {
      const chip = element('span', 'cb-status-chip is-up', '守');
      chip.title = '防御中';
      badges.push(chip);
    }
    ui.status.replaceChildren(...badges);
  }

  function targetSet(action, actor) {
    switch (action.target) {
      case 'self': return [actor];
      case 'ally': case 'allies':
        return (actor.side === 'ally' ? party : enemies).filter(unit => action.effect === 'revive' ? !remain(unit) : remain(unit));
      default: return living(actor.side === 'ally' ? 'enemy' : 'ally');
    }
  }

  function markTargets() {
    const planning = !resolving && !result && current();
    const preferred = byKey(enemyFocus);
    const selectedEnemy = preferred && remain(preferred) ? preferred : living('enemy')[0];
    const selectedAlly = byKey(allyFocus) ?? current();
    aim.hidden = !planning;
    if (planning) {
      enemyFocus = selectedEnemy?.key;
      const foe = element('span', 'cb-aim-enemy', `狙い　${selectedEnemy?.name ?? '—'}`);
      const friend = element('span', 'cb-aim-ally', `味方　${selectedAlly?.name ?? '—'}`);
      aim.replaceChildren(foe, friend);
      root.dataset.enemyTarget = selectedEnemy?.key ?? '';
      root.dataset.allyTarget = selectedAlly?.key ?? '';
    }
    for (const unit of units) {
      const ui = refs.get(unit.key);
      const eligible = !!planning && (unit.side === 'ally' || remain(unit));
      const selected = eligible && (unit === selectedEnemy || unit === selectedAlly);
      ui.card.disabled = !eligible;
      ui.card.setAttribute('aria-pressed', String(selected));
      ui.group.classList.toggle('is-targetable', eligible);
      ui.group.classList.toggle('is-target', selected || (unit === selectedEnemy && !result));
    }
  }

  function basic(actor, target, boost = 0) {
    return { type: 'attack', id: 'attack', name: '攻撃', weapon: actor.weapon, attribute: actor.weapon,
      target: 'one', power: 1, hits: 1 + boost, cost: 0, boost, targetKey: target?.key };
  }

  function healing(action) {
    return ['heal', 'restore', 'revive'].includes(action.effect);
  }

  function boostsUse(action) {
    return (action.type === 'skill' || action.type === 'attack' || action.type === 'guard') && action.effect !== 'cleanse';
  }

  function plannedTarget(action, actor) {
    const options = targetSet(action, actor);
    if (['self', 'all', 'allies'].includes(action.target)) return options[0];
    if (action.target === 'ally') return options.find(unit => unit === (byKey(allyFocus) ?? actor));
    return options.find(unit => unit.key === enemyFocus) ?? options[0];
  }

  function pickAction(action, boost) {
    const actor = current();
    if (!actor || resolving || result) return;
    const target = plannedTarget(action, actor);
    if (!target) return;
    sfx('click');
    const used = boostsUse(action) ? boost : 0;
    const candidate = action.type === 'attack' ? basic(actor, target, used) : { ...action, boost: used, targetKey: target.key };
    commitAction(candidate);
  }

  function chooseTarget(unit) {
    if (resolving || result || !current() || (unit.side === 'enemy' && !remain(unit))) return;
    sfx('click');
    if (unit.side === 'ally') allyFocus = unit.key;
    else enemyFocus = unit.key;
    showControls();
  }

  function commandFor(actor, previous, repeating = false) {
    const firstTarget = living('enemy')[0];
    const fallback = () => basic(actor, firstTarget);
    if (!previous) return fallback();
    const boost = previous.boost || 0;
    if (boost > Math.min(3, actor.boost)) return fallback();
    let action;
    if (previous.type === 'attack') {
      action = basic(actor, firstTarget, boost);
    } else if (previous.type === 'guard') {
      return { ...previous, targetKey: actor.key, target: 'self' };
    } else if (previous.type === 'skill') {
      const skill = actor.skills.find(known => known.id === previous.id);
      if (!skill || actor.mp < skill.cost) return fallback();
      action = { ...skill, type: 'skill', boost };
    } else if (previous.type === 'item') {
      const item = items.find(known => known.id === previous.id);
      if (!item || amount(item) < 1) return fallback();
      action = itemAction(item);
    } else {
      return fallback();
    }
    const targets = targetSet(action, actor);
    const source = targets.find(unit => unit.key === previous.targetKey);
    if (!source && !['all', 'allies', 'self'].includes(action.target) && repeating) return fallback();
    if (!source && !targets.length) return fallback();
    return { ...action, targetKey: source?.key ?? targets[0]?.key };
  }

  function itemAction(item) {
    return { ...item, type: 'item', target: item.target || 'ally', boost: 0, hits: 1, cost: 0 };
  }

  function amount(item) {
    return inventory[item.id] ?? item.amount ?? 0;
  }

  function countUnplanned(item) {
    const booked = Object.values(plan).filter(action => action.type === 'item' && action.id === item.id).length;
    return Math.max(0, amount(item) - booked);
  }

  function go(next) {
    sfx('click');
    page = next;
    pageIndex = 0;
    showControls();
  }

  function workLabel(actor) {
    const meter = element('div', 'cb-actor');
    const identity = element('div', 'cb-actor-identity');
    identity.append(element('strong', '', actor.name), element('span', '', 'の番'));
    meter.append(identity);
    const boosts = element('div', 'cb-boost');
    const meterBody = element('div', 'cb-boost-body');
    const count = element('span', 'cb-boost-count', '↑ なぞってブースト');
    const dots = element('div', 'cb-boost-dots');
    dots.setAttribute('aria-label', `ブースト残り ${actor.boost}`);
    for (let i = 1; i <= 5; i++) {
      dots.append(element('i', `cb-boost-dot${i <= actor.boost ? ' is-filled' : ''}`));
    }
    meterBody.append(count, dots);
    boosts.append(meterBody);
    meter.append(boosts);
    boostMeter = {count, dots};
    return meter;
  }

  function showBoostPreview(amount) {
    if (!boostMeter) return;
    const {count, dots} = boostMeter;
    count.textContent = amount ? `ブースト ${amount}段` : '↑ なぞってブースト';
    for (const [index, dot] of Array.from(dots.children).entries()) dot.classList.toggle('is-used', index < amount);
    const charge = refs.get(current()?.key)?.charge;
    if (charge) {
      for (const [index, dot] of Array.from(charge.children).entries()) dot.classList.toggle('is-used', index < amount);
    }
  }

  function actionButton(label, action, className = '', disabled = false) {
    let gesture = null;
    let swallowClick = false;
    const node = button(label, () => {
      if (swallowClick) {
        swallowClick = false;
        return;
      }
      pickAction(action, 0);
    }, className, disabled);
    if (!boostsUse(action)) return node;
    node.classList.add('cb-swipe-action');
    const preview = amount => {
      showBoostPreview(amount);
      const modifier = node.querySelector('.cb-action-preview');
      if (modifier) modifier.textContent = boostForecast(action, amount);
      const applied = node.querySelector('.cb-effect-preview');
      if (applied) applied.textContent = effectLabel(action, amount);
    };
    const adjust = event => {
      const rise = gesture.y - event.clientY;
      const across = Math.abs(event.clientX - gesture.x);
      const amount = rise > across * .62 ? Math.min(gesture.limit, Math.floor(rise / 29)) : 0;
      if (amount === gesture.amount) return;
      const gestureActor = gesture.actor;
      for (let count = gesture.amount + 1; count <= amount; count++) {
        const step = () => {
          if (!closed) {
            sfx('boost');
            stagePulse('boost');
            chargeAura(gestureActor, count, 290);
          }
        };
        const delay = 57 * (count - gesture.amount - 1);
        if (delay) setTimeout(step, delay);
        else step();
      }
      gesture.amount = amount;
      preview(amount);
      node.dataset.boost = amount ? String(amount) : '';
    };
    function clearGesture() {
      gesture = null;
      delete node.dataset.boost;
      preview(0);
    }
    node.addEventListener('pointerdown', event => {
      if (node.disabled || resolving || result || gesture || event.isPrimary === false || event.button !== 0) return;
      const actor = current();
      if (!actor) return;
      swallowClick = false;
      gesture = { id: event.pointerId, actor, x: event.clientX, y: event.clientY, amount: 0, limit: Math.min(3, actor.boost) };
      try { node.setPointerCapture(event.pointerId); } catch { /* The direct click covers browsers without capture. */ }
    });
    node.addEventListener('pointermove', event => {
      if (gesture?.id === event.pointerId) adjust(event);
    });
    node.addEventListener('pointerup', event => {
      if (gesture?.id !== event.pointerId) return;
      adjust(event);
      const {amount, actor} = gesture;
      clearGesture();
      if (!amount) return;
      swallowClick = true;
      setTimeout(() => {swallowClick = false;}, 420);
      if (actor === current()) pickAction(action, amount);
    });
    for (const type of ['pointercancel', 'lostpointercapture']) {
      node.addEventListener(type, event => {
        if (gesture?.id === event.pointerId) clearGesture();
      });
    }
    return node;
  }

  function effectLabel(action, boost = 0) {
    if (!marks[action.effect]) return '';
    const name = marks[action.effect];
    if (action.effect === 'shatter') return `${name} ＋${Math.max(1, Math.floor(cleanNumber(action.magnitude, 2)))}`;
    if (action.effect === 'stun') return `${name} ${conditionDuration(action, boost)}巡`;
    if (statusInfo[action.effect]) {
      const amount = Math.round(cleanNumber(action.magnitude, statusInfo[action.effect][1]) * 100);
      return `${name} ${amount}％・${conditionDuration(action, boost)}巡`;
    }
    return name;
  }

  function boostForecast(action, boost) {
    if (action.type === 'attack') return `${action.weapon} ×${1 + boost}回`;
    if (action.effect === 'guard') return `被害 ${Math.round(guardReduction(action, boost) * 100)}％減`;
    const power = Math.round((action.power ?? 1) * (1 + boost * .35) * 100) / 100;
    return `${healing(action) ? '回復' : '威力'}×${power}`;
  }

  function guardReduction(action, boost) {
    return bounded(cleanNumber(action.magnitude, .42) + boost * .12, .05, .9);
  }

  function conditionDuration(action, boost) {
    const stun = action.effect === 'stun';
    return bounded(Math.floor(cleanNumber(action.duration, stun ? 1 : 2)) + (stun ? 0 : boost), 1, 9);
  }

  function detailRow(action, actor, isItem) {
    const command = isItem ? itemAction(action) : { ...action, type: 'skill' };
    const unaffordable = !isItem && actor.mp < action.cost;
    const badTarget = !plannedTarget(command, actor);
    const unavailable = badTarget || (isItem ? countUnplanned(action) < 1 : unaffordable);
    const row = actionButton('', command, `cb-detail${unaffordable ? ' is-unaffordable' : ''}`, unavailable);
    if (badTarget) row.title = action.effect === 'revive' ? '力尽きた味方を先にタップ' : '対象を先にタップ';
    if (isItem && action.icon) {
      const img = element('img', 'cb-detail-icon');
      img.src = action.icon;
      img.alt = '';
      row.append(img);
    } else {
      row.append(trait(action.attribute, 'cb-detail-icon'));
    }
    const meta = element('div', 'cb-detail-meta');
    const header = element('span', 'cb-detail-name');
    const name = element('strong', '', action.name);
    if (!isItem && action.signature) {
      name.append(element('i', 'cb-signature-mark', '決め技'));
      row.classList.add('is-signature');
    }
    const amountLabel = isItem ? `残り ${countUnplanned(action)}` : `消費気力 ${action.cost}`;
    header.append(name, element('small', 'cb-detail-cost', amountLabel));
    const info = element('span', 'cb-detail-tags');
    if (action.attribute) info.append(element('span', 'cb-detail-attribute', action.attribute));
    if (action.weapon) info.append(element('span', '', action.weapon === 'なし' ? '武器なし' : action.weapon));
    const target = targetLabel[action.target || (isItem ? 'ally' : 'one')];
    if (isItem) {
      info.append(element('span', '', `${marks[action.effect] || '効果'} ${action.power || ''}`.trim()));
    } else if ((action.power ?? 1) > 0 && !statusOnly.has(action.effect) && action.effect !== 'guard') {
      info.append(element('span', 'cb-action-preview', boostForecast(command, 0)), element('span', '', `${action.hits || 1}回`));
    } else if (action.effect === 'guard') {
      info.append(element('span', 'cb-action-preview', boostForecast(command, 0)));
    }
    info.append(element('span', '', target || '敵1体'));
    if (!isItem && effectLabel(action)) info.append(element('span', 'cb-effect-preview', effectLabel(action)));
    if (badTarget) info.append(element('span', 'cb-target-help', row.title));
    meta.append(header, info);
    if (action.note) meta.append(element('span', 'cb-detail-note', action.note));
    row.append(meta);
    return row;
  }

  function showList(actor, type) {
    const isItem = type === 'items';
    const requested = isItem ? items.filter(item => amount(item) > 0) : actor.skills;
    const perPage = 3;
    const count = Math.max(1, Math.ceil(requested.length / perPage));
    const list = element('div', 'cb-selection-list');
    const heading = element('div', 'cb-selection-heading');
    const back = button('‹ 戻る', () => go('main'), 'cb-back');
    heading.append(back, element('strong', '', isItem ? '道具' : '技'));
    if (count > 1) {
      const pager = element('div', 'cb-pager');
      pager.setAttribute('role', 'navigation');
      pager.setAttribute('aria-label', isItem ? '道具のページ' : '技のページ');
      const turnPage = movement => {
        sfx('click');
        pageIndex += movement;
        showControls();
      };
      const previousPage = button('‹', () => turnPage(-1), '', pageIndex <= 0);
      previousPage.setAttribute('aria-label', '前のページ');
      const nextPage = button('›', () => turnPage(1), '', pageIndex >= count - 1);
      nextPage.setAttribute('aria-label', '次のページ');
      pager.append(previousPage, element('span', '', `${pageIndex + 1}/${count}`), nextPage);
      heading.append(pager);
    }
    list.append(heading);
    if (!requested.length) list.append(element('p', 'cb-empty', isItem ? '持っている道具がありません' : '使える技がありません'));
    for (const action of requested.slice(pageIndex * perPage, (pageIndex + 1) * perPage)) {
      list.append(detailRow(action, actor, isItem));
    }
    return list;
  }

  function showControls() {
    for (const unit of units) updateUnit(unit);
    showSpeed();
    markTargets();
    showTacticalIntent();
    if (result) return showResult();
    if (resolving) {
      const status = element('div', 'cb-resolving');
      status.setAttribute('aria-live', 'polite');
      status.append(element('span', 'cb-resolving-mark', '✦'), element('strong', '', lastEvent || '交戦中'));
      commands.replaceChildren(status);
      return;
    }
    const actor = current();
    if (!actor) {
      const status = element('div', 'cb-resolving');
      status.append(element('strong', '', 'この巡は行動できない'), button('次の巡へ', () => void playRound(false)));
      commands.replaceChildren(status);
      return;
    }
    const meter = workLabel(actor);
    if (page === 'skills' || page === 'items') {
      commands.replaceChildren(meter, showList(actor, page));
      return;
    }
    const actionGrid = element('div', 'cb-command-grid');
    const attack = actionButton('攻撃', basic(actor), 'cb-primary');
    attack.append(element('small', 'cb-action-preview', `${actor.weapon} ×1回`));
    const skill = button('技', () => go('skills'), '', !actor.skills.length);
    if (actor.skills.length) skill.append(element('small', '', `${actor.skills.length}つ`));
    const item = button('道具', () => go('items'), '', !items.some(item => countUnplanned(item) > 0));
    const usableItems = items.filter(entry => countUnplanned(entry) > 0).length;
    if (usableItems) item.append(element('small', '', `${usableItems}種`));
    const guard = actionButton('守る', { type: 'guard', id: 'guard', name: '防御', target: 'self', effect: 'guard', power: 1, cost: 0 });
    guard.append(element('small', 'cb-action-preview', '被害 42％減'));
    const repeat = button('前の行動をくり返す', repeatTurn, 'cb-repeat', !Object.keys(lastActions).length);
    const escape = button('退く', retreat, 'cb-escape', rules.noEscape || rules.duel);
    actionGrid.append(attack, skill, item, guard, repeat, escape);
    commands.replaceChildren(meter, actionGrid);
  }

  function commitAction(action) {
    plan[current().id] = action;
    const next = party.findIndex((unit, i) => i > currentIndex && canPlan(unit));
    page = 'main';
    if (next !== -1) {
      currentIndex = next;
      showTimeline();
      showControls();
      return;
    }
    lastActions = copy(plan);
    void playRound(false);
  }

  function repeatTurn() {
    if (resolving || !Object.keys(lastActions).length) return;
    sfx('click');
    plan = { ...lastActions };
    page = 'main';
    void playRound(true);
  }

  function retreat() {
    if (rules.noEscape || rules.duel || resolving) return;
    sfx('escape');
    finish(false, true);
  }

  function spritePoint(unit, vertical = 0.48) {
    const box = refs.get(unit.key).sprite.getBoundingClientRect();
    const origin = arena.getBoundingClientRect();
    return { x: box.left + box.width / 2 - origin.left, y: box.top + box.height * vertical - origin.top };
  }

  function placeEffect(node, point) {
    node.style.left = `${point.x}px`;
    node.style.top = `${point.y}px`;
  }

  function effectLifetime(node, duration, holder = fxStage, delay = 0) {
    node.style.setProperty('--cb-fx-duration', `${time(duration)}ms`);
    if (delay) node.style.animationDelay = `${time(delay)}ms`;
    holder.append(node);
    node.addEventListener('animationend', () => node.remove(), { once: true });
    setTimeout(() => node.remove(), time(duration + delay) + 100);
  }

  function stagePulse(kind) {
    root.querySelector('.cb-stage-signal')?.remove();
    const signal = element('i', `cb-stage-signal is-${kind}`);
    effectLifetime(signal, kind === 'break' ? 610 : kind === 'boost' ? 395 : 480, root);
  }

  function chargeAura(actor, boost, duration) {
    const ui = refs.get(actor.key);
    const glow = element('i', 'cb-boost-glow');
    glow.style.setProperty('--cb-boost-size', `${60 + 12 * boost}px`);
    effectLifetime(glow, duration, ui.imageBox);
    for (let i = 0; i < boost + 1; i++) {
      const halo = element('i', 'cb-boost-halo');
      halo.style.setProperty('--cb-boost-size', `${36 + 8 * boost}px`);
      effectLifetime(halo, duration - 55 * i, ui.imageBox, i * 55);
    }
    animate(ui.sprite, [
      { filter: 'drop-shadow(0 0 1px #ffd175)' },
      { filter: 'brightness(1.6) drop-shadow(0 0 15px #ffbf58)', offset: 0.48 },
      { filter: 'drop-shadow(0 0 3px #f4bc5f)' }
    ], duration);
  }

  function impact(resultHit, boosted) {
    const { target, heal, weak, shatter, miss, status, element: affinity } = resultHit;
    const ui = refs.get(target.key);
    const point = spritePoint(target);
    if (miss) {
      animate(ui.imageBox, [
        { transform: 'none', opacity: 1 },
        { transform: 'translateY(-6px)', opacity: .55, offset: .38 },
        { transform: 'none', opacity: 1 }
      ], 290);
      return;
    }
    const style = shatter ? ' is-break' : weak ? ' is-weak' : heal || statusOnly.has(status) ? ' is-heal' : '';
    const burst = element('i', `cb-impact-burst${style}${boosted ? ' is-boosted' : ''}`);
    if (affinity && spellStyles[affinity]) burst.dataset.element = spellStyles[affinity];
    placeEffect(burst, point);
    effectLifetime(burst, shatter ? 710 : weak ? 600 : 420);
    if (heal || resultHit.amount === null) {
      animate(ui.sprite, [{ filter: 'drop-shadow(0 0 14px #73e4bd)' }, { filter: 'none' }], 470);
    } else {
      const edge = arena.getBoundingClientRect();
      const body = ui.sprite.getBoundingClientRect();
      const sameSide = target.side === 'ally';
      const span = sameSide ? edge.bottom - body.bottom : body.top - edge.top;
      const strength = shatter ? 21 : weak ? 17 : 13;
      const distance = Math.min(strength, Math.max(0, span - (shatter ? 11 : 3)));
      const recoil = (sameSide ? 1 : -1) * distance;
      const sway = Math.min(6, 2 + (strength - distance) / 2);
      animate(ui.imageBox, [
        { transform: 'none', filter: 'brightness(4.5)' },
        { transform: `translate(${sway}px,${recoil}px)`, filter: 'brightness(5) saturate(.12)', offset: 0.2 },
        { transform: `translate(${-sway * 0.45}px,${recoil * 0.72}px)`, filter: 'brightness(1.72)', offset: 0.4 },
        { transform: 'none', filter: 'none' }
      ], shatter ? 460 : 355, { easing: 'ease-out' });
    }
    if (affinity && spellStyles[affinity]) {
      const color = attributeInfo(affinity).color;
      for (let i = 0; i < 6; i++) {
        const particle = element('i', 'cb-spell-particle');
        const angle = i * Math.PI / 3;
        const radius = 23 + (i % 3) * 9;
        particle.dataset.element = spellStyles[affinity];
        particle.style.setProperty('--cb-spell', color);
        particle.style.setProperty('--cb-shard-x', `${Math.cos(angle) * radius}px`);
        particle.style.setProperty('--cb-shard-y', `${Math.sin(angle) * radius}px`);
        particle.style.setProperty('--cb-shard-turn', `${(i + 1) * 58}deg`);
        placeEffect(particle, point);
        effectLifetime(particle, 470);
      }
    }
    if (!shatter) return;
    const total = 15;
    for (let i = 0; i < total; i++) {
      const angle = i * Math.PI * 2 / total;
      const distance = 32 + i % 4 * 14;
      const shard = element('i', 'cb-shard');
      placeEffect(shard, point);
      shard.style.setProperty('--cb-shard-x', `${Math.cos(angle) * distance}px`);
      shard.style.setProperty('--cb-shard-y', `${Math.sin(angle) * distance}px`);
      shard.style.setProperty('--cb-shard-turn', `${i * 42}deg`);
      effectLifetime(shard, 640);
    }
  }

  function shakeArena() {
    animate(field, [{ transform: 'translate(7px,-2px)' }, { transform: 'translate(-7px,4px)' },
      { transform: 'translate(5px,-2px)' }, { transform: 'translate(-3px,1px)' },
      { transform: 'translate(1px,-1px)' }, { transform: 'none' }], 430, { easing: 'linear' });
    animate(backdrop, [{ transform: 'translate(3px,-2px) scale(1.02)' }, { transform: 'translate(-3px,3px) scale(1.02)' },
      { transform: 'translate(2px,0px) scale(1.01)' }, { transform: 'none' }], 390);
  }

  function stackDamage(target, amount, marker, stacks) {
    const ui = refs.get(target.key);
    let entry = stacks.get(target.key);
    if (!entry) {
      ui.number?.remove();
      const node = element('div', 'cb-damage cb-damage-stack');
      const total = element('b', 'cb-damage-total');
      const label = element('span', 'cb-damage-marker');
      label.hidden = true;
      node.append(total, label);
      const point = spritePoint(target, 0.31);
      point.x = bounded(point.x, 59, arena.clientWidth - 59);
      point.y = Math.max(point.y, 145);
      placeEffect(node, point);
      fxStage.append(node);
      entry = { node, total, label, value: 0 };
      ui.number = node;
      stacks.set(target.key, entry);
    }
    entry.value += amount;
    entry.total.textContent = `合計 ${entry.value}`;
    if (marker && (entry.label.hidden || marker === 'ブレイク')) {
      entry.label.textContent = marker;
      entry.label.hidden = false;
    }
    if (entry.node.querySelectorAll('.cb-damage-addend').length >= 4) entry.node.querySelector('.cb-damage-addend')?.remove();
    entry.label.before(element('b', 'cb-damage-addend', amount));
  }

  function popDamage(resultHit, quickHit, stacks) {
    const { target, amount, heal, weak, shatter, miss, critical, status, shieldCut } = resultHit;
    const ui = refs.get(target.key);
    const marker = shatter ? 'ブレイク' : weak ? '弱点' : miss ? 'かわした' : critical ? '会心' :
      marks[status] ?? (shieldCut ? '盾を削った' : '');
    if (stacks && !heal && !miss && amount > 0) {
      stackDamage(target, amount, marker, stacks);
      return;
    }
    if (!stacks?.has(target.key)) ui.number?.remove();
    const number = element('div', `cb-damage${heal ? ' is-heal' : ''}${weak || critical ? ' is-weak' : ''}${shatter ? ' is-break' : ''}`);
    if (marker) number.append(element('span', '', marker));
    if (amount !== null) number.append(element('b', '', heal ? `＋${amount}` : amount));
    const point = spritePoint(target, 0.36);
    point.x = bounded(point.x, 44, arena.clientWidth - 44);
    point.y = Math.max(point.y, 44);
    placeEffect(number, point);
    if (!stacks?.has(target.key)) ui.number = number;
    effectLifetime(number, shatter ? 990 : quickHit ? 610 : 810);
  }

  function bolt(actor, target, action, physical, duration) {
    const source = spritePoint(actor);
    const destination = spritePoint(target);
    const dx = destination.x - source.x;
    const dy = destination.y - source.y;
    const attr = attributeInfo(action.attribute || action.weapon);
    const projectile = element('i', `cb-bolt ${physical ? 'is-slash' : 'is-cast'}${action.boost ? ' is-boosted' : ''}`);
    if (spellStyles[attr.name]) projectile.dataset.element = spellStyles[attr.name];
    projectile.style.setProperty('--cb-fx-color', healing(action) ? '#87f7c9' : attr.color);
    placeEffect(projectile, source);
    projectile.style.setProperty('--cb-fx-x', `${dx}px`);
    projectile.style.setProperty('--cb-fx-y', `${dy}px`);
    projectile.style.setProperty('--cb-fx-angle', `${Math.atan2(dy, dx)}rad`);
    projectile.style.setProperty('--cb-fx-size', `${bounded(Math.hypot(dx, dy) * 0.29, 26, 68) + (action.boost || 0) * 7}px`);
    effectLifetime(projectile, duration);
  }

  function showBanner(text, boosted = false) {
    banner.classList.toggle('is-boosted', boosted);
    banner.textContent = text;
    banner.classList.add('is-visible');
  }

  function applyCondition(target, action) {
    const tag = action.effect;
    if (tag === 'cleanse') {
      for (const [key, [, , harmful]] of Object.entries(statusInfo)) if (harmful) delete target.statuses[key];
      target.weakened = 0;
      return tag;
    }
    if (!Object.hasOwn(statusInfo, tag)) return null;
    const amount = bounded(cleanNumber(action.magnitude, statusInfo[tag][1]), 0, 1);
    const duration = conditionDuration(action, action.boost || 0);
    const before = target.statuses[tag];
    const until = round + duration - 1 + (tag === 'stun' && acted.has(target.key) ? 1 : 0);
    target.statuses[tag] = { amount: Math.max(before?.amount ?? 0, amount), until: Math.max(before?.until ?? 0, until) };
    return tag;
  }

  function supportOnly(action) {
    return statusOnly.has(action.effect) || (action.power === 0 && Object.hasOwn(statusInfo, action.effect));
  }

  const hasGear=(unit,key)=>unit.gearEffects?.includes(key);
  function useGearOnce(unit,key) {
    if(!hasGear(unit,key)||unit.gearUsed[key]) return false;
    unit.gearUsed[key]=true;
    return true;
  }

  function strike(actor, target, action) {
    const attr = action.attribute || action.weapon || actor.weapon;
    const chance = action.tacticalRelease ? 100 : bounded(actor.accuracy - target.evasion, 35, 100);
    if (chance < 100 && rng() * 100 >= chance) return { target, amount: null, miss: true };
    const shielded = target.side === 'enemy' && !broken(target);
    const weakness = target.side === 'enemy' && target.weakness.includes(attr);
    const brokenBefore = broken(target);
    const critical = actor.crit > 0 && rng() * 100 < actor.crit;
    const boost = action.type === 'attack' ? 1 : 1 + (action.boost || 0) * 0.35;
    const modifier = (1 - statusAmount(actor, 'weaken')) * (1 + statusAmount(actor, 'strengthen'));
    const magic = action.channel === 'magic';
    const offense = magic ? actor.magicAttack : actor.attack;
    const defense = (magic ? target.magicDefense : target.defense) * (1 + statusAmount(target, 'ward'));
    const power = (action.power ?? 1) * (brokenBefore ? 1 + cleanNumber(action.bonusVsBreak, 0) : 1);
    const base = Math.max(2, offense * modifier * power * boost - defense * 0.57);
    const guarding = target.guarding ? 1 - target.guarding : 1;
    const weaknessBonus = weakness ? 1.27 : 1;
    const breakBonus = brokenBefore ? 1.94 : 1;
    const cover=action.shelterKey?(action.shelterKey===target.key ? .88 : .70) : 1;
    const echoFactor=action.echoKey===target.key ? .55 : 1;
    const firstRound=round===1?(actor.openingAttack??1):1;
    const shell = shielded && target.tactics ? (weakness ? target.tactics.weakShielded : target.tactics.shielded) : 1;
    const channelCover = shielded && target.tactics?.pattern === 'plate' && magic === (round % 2 === 0) ? .62 : 1;
    const protection = action.tacticalRelease && actor.guard <= 1 ? .90 : 1;
    const aftershock = action.tacticalFocus && action.tacticalFocus !== target.key ? .42 : 1;
    const damage = phaseDamage(target, Math.max(1, Math.round(base * guarding * weaknessBonus * breakBonus * cover * echoFactor * firstRound * shell * channelCover * protection * aftershock * (critical ? 1.5 : 1) * (0.94 + 0.12 * rng()))));
    let shatter = false;
    if (weakness) target.known.add(attr);
    const extra = (action.effect === 'shatter' ? Math.max(1, Math.floor(cleanNumber(action.magnitude, 2))) : 0)+Number(shielded&&weakness&&useGearOnce(actor,'pierce'));
    const shieldCut = shielded && extra > 0;
    if (shielded && (weakness || shieldCut)) {
      target.guard = Math.max(0, target.guard - Number(weakness) - extra);
      if (!target.guard) {
        shatter = true;
        target.broken = round + 1;
      }
    }
    if (target.tactics?.pattern === 'echo') {
      target.echoedHits = shatter ? 0 : target.echoedAttribute === attr ? Math.min(5, target.echoedHits + 1) : 1;
      target.echoedAttribute = shatter ? '' : attr;
    }
    target.hp = Math.max(0, target.hp - damage);
    if(target.hp<target.maxHp*.22&&useGearOnce(target,'secondWind')){
      target.hp=Math.min(target.maxHp,target.hp+Math.ceil(target.maxHp*.30));
      sfx('heal');
    }
    if (action.effect === 'drain') {
      const absorbed = Math.ceil(damage * bounded(cleanNumber(action.magnitude, 1 / 3), 0, 1));
      actor.hp = Math.min(actor.maxHp, actor.hp + absorbed);
    }
    const slow=remain(target)&&attr==='氷'&&useGearOnce(actor,'chill')?applyCondition(target,{effect:'slow',magnitude:.30,duration:2}):null;
    const status = (remain(target) ? applyCondition(target, action) : null)??slow;
    return { target, amount: damage, weak: weakness, shatter, critical, shieldCut, status, element: attr };
  }

  function restore(actor, target, action) {
    const boost = 1 + (action.boost || 0) * 0.35;
    const power = action.power ?? 1;
    const offense = action.channel === 'magic' ? actor.magicAttack : actor.attack;
    const amount = action.type === 'item' ? Math.round(power) : Math.round(offense * power * boost);
    const useMp = action.effect === 'restore';
    const before = useMp ? target.mp : target.hp;
    if (useMp) target.mp = Math.min(target.maxMp, target.mp + amount);
    else target.hp = Math.min(target.maxHp, target.hp + Math.max(1, amount));
    const status = action.cleanses ? applyCondition(target, {effect:'cleanse'}) : null;
    return { target, amount: (useMp ? target.mp : target.hp) - before, heal: true, revive: action.effect === 'revive', status, element: action.attribute };
  }

  function tacticalBeat(at) {
    return ['probe','surge','open'][(at - 1) % 3];
  }

  function tacticalPlan(actor) {
    if (tacticalPlans.has(actor.key)) return tacticalPlans.get(actor.key);
    const {tactics} = actor;
    const beat = tacticalBeat(round);
    const charge = Math.floor((round - 1) / 3);
    const attacks = actor.skills.filter(skill=>skill.power>0&&!beneficial.has(skill.effect));
    const origin = attacks[(actor.phaseCount>1 ? healthPhase(actor)-1 : charge) % attacks.length] ?? basic(actor);
    const ranked = [...living('ally')].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);
    if (tactics.pattern === 'copy') ranked.sort((a,b)=>statusAmount(b,'strengthen')-statusAmount(a,'strengthen'));
    const target = ranked[0];
    const wide = tactics.target === 'all' || (tactics.target === 'alternate' && charge % 2 === 0);
    const amplify = tactics.pattern === 'echo' ? 1 + Math.max(0,actor.echoedHits-1)*.06 :
      tactics.pattern === 'copy' && target ? 1 + .8*statusAmount(target,'strengthen') : 1;
    const deliberate = beat==='probe' && tactics.pattern==='heat' ? actor.skills.find(skill=>skill.effect==='strengthen') : undefined;
    const action = deliberate ? {...deliberate,targetKey:actor.key} : {
      ...origin,
      name:beat==='open'?'息を整える':origin.name,
      power:beat==='surge'?tactics.chargedPower*amplify*(wide||tactics.target==='one'?1:1.15):
        beat==='open'?.77:tactics.probingPower,
      effect:beat==='surge'?origin.effect:undefined,
      target:beat==='surge'?'all':'one', targetKey:target?.key,
      hits:1, tacticalRelease:beat==='surge', tacticalFocus:beat==='surge'&&!wide?target?.key:undefined
    };
    const next = {...action, type:'skill', boost:0, cost:0};
    tacticalPlans.set(actor.key,next);
    return next;
  }

  function showTacticalIntent() {
    const enemy = enemies.find(unit=>unit.tactics&&remain(unit));
    const active = !!enemy && !resolving && !result;
    intent.hidden = !active;
    for (const unit of party) refs.get(unit.key).group.classList.remove('is-threatened','is-main-threat');
    if (!active) return;
    const {tactics} = enemy;
    const beat = tacticalBeat(round);
    const move = tacticalPlan(enemy);
    const paused = broken(enemy) || statusOn(enemy,'stun');
    intent.dataset.intent = paused ? 'halted' : beat;
    intent.dataset.target = move.target;
    const range = move.tacticalFocus ? `${byKey(move.tacticalFocus)?.name??'味方一人'}＋余波` :
      move.target==='all' ? '味方全体' : move.target==='self' ? '自分' : byKey(move.targetKey)?.name ?? '味方一人';
    const title = paused ? '好機　相手は今巡、動けない' : beat==='surge' ?
      `大技の予告　${move.name} → ${range}` : beat==='open' ? '好機　相手は大技の反動で動きが鈍い' :
        `次の巡に大技　${tactics.warning}`;
    const wall = tactics.pattern==='plate' ? (round%2===0?'魔法に備えている。':'物理に備えている。') : '';
    const echo = tactics.pattern==='echo' && enemy.echoedHits>=2 ? `反響 ${enemy.echoedHits}。 ` : '';
    const detail = paused ? 'ブーストや技で攻めるなら今。' : beat==='surge' ?
      `${wall}${echo}盾を割ると中断。守り・回復は先に行動。` :
      beat==='probe' ? `${wall}大技の前に盾を戻す。先に割れば止まる。` : `${wall}${tactics.cue}`;
    intent.replaceChildren(element('strong','',title),element('small','',detail));
    if (!paused && beat==='surge') for (const ally of living('ally')) {
      const group = refs.get(ally.key).group;
      if (move.target==='all' || ally.key===move.targetKey) group.classList.add('is-threatened');
      group.classList.toggle('is-main-threat',ally.key===move.tacticalFocus);
    }
  }

  function enemyAction(actor) {
    if (actor.tactics) {
      const announced=tacticalPlan(actor);
      const target=byKey(announced.targetKey);
      return target&&remain(target) ? announced : {...announced,targetKey:living('ally')[0]?.key};
    }
    const targets = living('ally');
    const usable = actor.skills.filter(skill => {
      const candidates = targetSet(skill, actor);
      if (skill.effect === 'heal' || skill.cleanse) return candidates.some(unit => unit.hp < unit.maxHp * 0.45);
      if (skill.effect === 'restore') return candidates.some(unit => unit.mp < unit.maxMp * 0.45);
      return candidates.length > 0;
    });
    const phaseSkill = actor.phaseCount > 1 ? usable[(healthPhase(actor) - 1) % usable.length] : null;
    const selected = phaseSkill || (actor.behavior === 'relentless' ? usable[(round - 1) % usable.length]
      : round % (actor.behavior === 'caster' ? 2 : 3) === 0 ? usable[(round + actor.index) % usable.length] : null);
    let target = targets[Math.floor(rng() * targets.length)];
    if (actor.behavior === 'hunter') target = [...targets].sort((a, b) => a.hp - b.hp)[0];
    if (!selected) return basic(actor, target);
    const { target: mode } = selected;
    if (mode === 'self' || mode === 'ally' || mode === 'allies') {
      const candidates = targetSet(selected, actor);
      target = mode === 'ally' && selected.effect === 'heal'
        ? [...candidates].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0]
        : candidates[0];
    }
    return { ...selected, type: 'skill', targetKey: target?.key, boost: 0 };
  }

  function presentHit(reports, boost) {
    const shatter = reports.some(report => report.shatter);
    const weak = reports.some(report => report.weak);
    const heal = reports.some(report => report.heal);
    const miss = reports.every(report => report.miss);
    const support = reports.every(report => report.amount === null && !report.miss);
    root.dataset.hit = shatter ? 'break' : weak ? 'weak' : heal ? 'heal' : miss ? 'miss' : support ? 'support' : 'normal';
    if (shatter || weak) stagePulse(shatter ? 'break' : 'weak');
    sfx(shatter ? 'break' : weak ? 'weak' : heal ? 'heal' : miss ? 'step' : support ? 'skill' : 'hit');
    for (const report of reports) impact(report, boost > 0);
    if (shatter) shakeArena();
    return { shatter, weak };
  }

  function showHitState(actor, reports) {
    let fallen = false;
    syncEnemyPhase(true);
    for (const { target, weak, revive, shieldCut } of reports) {
      const ui = refs.get(target.key);
      if (revive && (target.side === 'ally' || target.human)) {
        personFrame(ui.sprite, target.sprite, target.side === 'ally' ? 'back' : 'face', personScale(), false);
      }
      updateUnit(target);
      if (weak || shieldCut) animate(ui.guard, [
        { transform: 'scale(1.22)', filter: 'brightness(1.95)' }, { transform: 'none', filter: 'none' }
      ], 350);
      fallen ||= !remain(target);
    }
    if (actor) updateUnit(actor);
    if (fallen) sfx('fall');
    if (fallen || reports.some(report => report.shatter || ['slow', 'stun', 'cleanse'].includes(report.status))) showTimeline();
  }

  function approach(actor, target, boost) {
    const from = spritePoint(actor);
    const to = target ? spritePoint(target) : from;
    const difference = to.x - from.x;
    if (actor.side !== 'ally') {
      return { x: bounded(difference * .16, -31, 31), y: 34 };
    }
    if (!target || target.side === 'ally') {
      return { x: bounded(difference * .14, -24, 24), y: -27 };
    }
    const attackerTop = refs.get(actor.key).sprite.getBoundingClientRect().top;
    const cardsBottom = Math.max(...living('enemy').map(unit => refs.get(unit.key).card.getBoundingClientRect().bottom));
    const gap = Math.max(14, attackerTop - cardsBottom - 5);
    return { x: bounded(difference * .42, -106, 106), y: -Math.min(77 + boost * 4, gap) };
  }

  function showCutIn(actor, action, boost) {
    const cut = element('div', 'cb-cut-in');
    cut.setAttribute('aria-hidden', 'true');
    const band = element('div', 'cb-cut-in-band');
    const body = element('div', 'cb-cut-in-body');
    const pose = element('i', 'cb-cut-in-sprite');
    personFrame(pose, actor.sprite, 'skill', physicalScale(2.5), false);
    const text = element('div', 'cb-cut-in-text');
    text.append(element('b', '', action.name), element('span', '',
      [action.signature ? '決め技' : '', boost ? `ブースト ${boost}` : ''].filter(Boolean).join(' ・ ')));
    body.append(pose, text);
    band.append(body);
    cut.append(band);
    effectLifetime(cut, 840, arena);
  }

  function swing(sprite, physical, targetRight) {
    const turn = targetRight ? 1 : -1;
    if (physical) {
      animate(sprite, [
        { rotate: `${-7 * turn}deg`, scale: '1 1' },
        { rotate: `${16 * turn}deg`, translate: `${turn * 7}px -5px`, scale: '1.06 .96', offset: .38 },
        { rotate: '0deg', translate: '0 0', scale: '1 1' }
      ], 220);
    } else {
      animate(sprite, [
        { translate: '0 0', filter: 'none' },
        { translate: '0 -7px', filter: 'brightness(1.45)', offset: .45 },
        { translate: '0 0', filter: 'none' }
      ], 255);
    }
  }

  async function perform(actor, action) {
    if (!action || closed || !remain(actor)) return;
    lastEvent = `${actor.name}　${action.name}`;
    activation = actor.key;
    showTimeline();
    showControls();
    const ui = refs.get(actor.key);
    const ally = actor.side === 'ally';
    const boost = action.boost || 0;
    const isHeal = healing(action);
    const isGuard = action.type === 'guard' || action.effect === 'guard';
    const isSupport = supportOnly(action);
    const physical = action.type === 'attack' || (action.channel !== 'magic' && action.weapon === action.attribute && !isHeal && !isSupport);
    if (ally && boost) actor.boost -= boost;
    if (ally && action.type === 'skill') actor.mp -= action.cost;
    if (ally && boost===3 && hasGear(actor,'return')) actor.mp=Math.min(actor.maxMp,actor.mp+Math.max(4,Math.round(actor.maxMp*.12)));
    if (action.type === 'item') inventory[action.id] = amount(action) - 1;
    updateUnit(actor);
    showBanner(boost ? `ブースト×${boost}　${action.name}` : action.name, boost > 0);
    delete root.dataset.hit;
    const possibleTargets = targetSet(action, actor);
    const aimAt = possibleTargets.find(unit => unit.key === action.targetKey) ?? possibleTargets[0];
    const targetRight = aimAt ? spritePoint(aimAt).x > spritePoint(actor).x : !ally;
    const stepPlan = approach(actor, aimAt, boost);
    const lunge = motionOff() ? 'none' : `translate(${stepPlan.x}px,${stepPlan.y}px)`;
    const stacks = action.hits > 1 ? new Map() : null;
    ui.group.classList.add('is-acting');
    if (!isGuard) {
      setPhase('windup', actor);
      if (ally && !motionOff()) personFrame(ui.sprite, actor.sprite, 'step', personScale(), false);
      const step = animate(ui.imageBox, [
        { transform: 'none' },
        { transform: `translate(${stepPlan.x * .12}px,${stepPlan.y * .48}px)`, offset: .42 },
        { transform: lunge }
      ], 275, { fill: 'forwards', easing: 'ease-in-out' });
      await wait(120);
      if (closed) return;
      if (ally && !motionOff()) personFrame(ui.sprite, actor.sprite, 'nextStep', personScale(), false);
      await wait(155);
      if (closed) return;
      ui.imageBox.style.transform = lunge;
      step?.cancel();
    }
    setPhase('stance', actor);
    if (ally && !isGuard) personFrame(ui.sprite, actor.sprite, 'back', personScale(), false);
    ui.imageBox.classList.add(physical ? 'is-weapon-stance' : 'is-skill-stance');
    await wait(isGuard ? 125 : 165);
    if (closed) return;
    if (boost) {
      setPhase('charge', actor);
      sfx('boost');
      stagePulse('boost');
      chargeAura(actor, boost, 495);
      await wait(425);
      if (closed) return;
    }
    if (ally && (action.signature || boost === 3)) {
      showCutIn(actor, action, boost);
      await wait(220);
      if (closed) return;
    }
    if (isGuard) {
      setPhase('contact', actor);
      sfx('guard');
      actor.guardedAt=round;
      const targets = targetSet(action, actor).filter(unit => action.target === 'allies' || unit.key === action.targetKey);
      for (const target of targets) {
        target.guarding = guardReduction(action, boost);
        const shieldEffect = element('i', 'cb-impact-burst is-guard');
        placeEffect(shieldEffect, spritePoint(target));
        effectLifetime(shieldEffect, 520);
        updateUnit(target);
      }
      await wait(350);
    } else {
      const available = targetSet(action, actor);
      const first = available.find(unit => unit.key === action.targetKey) ?? available[0];
      const targets = ['all', 'allies'].includes(action.target) ? available : first ? [first] : [];
      if(!ally&&action.target==='all') {
        const defender=targets.find(unit=>useGearOnce(unit,'shelter'));
        if(defender) action={...action,shelterKey:defender.key};
      }
      if(ally&&physical&&first&&targets.length===1&&actor.guardedAt===round-1&&hasGear(actor,'echo')) {
        const other=living('enemy').filter(unit=>unit!==first).sort((a,b)=>Math.abs(a.index-first.index)-Math.abs(b.index-first.index))[0];
        if(other){action={...action,echoKey:other.key};targets.push(other);}
      }
      for (let hit = 0; hit < action.hits && !closed; hit++) {
        const liveTargets = targets.filter(target => isHeal || remain(target));
        if (!liveTargets.length) break;
        const quickHit = hit > 0;
        const flight = physical ? (quickHit ? 184 : 275) : (quickHit ? 240 : 350);
        setPhase('launch', actor);
        delete root.dataset.hit;
        if (ally && !motionOff()) personFrame(ui.sprite, actor.sprite, 'nextStep', personScale(), false);
        swing(ui.sprite, physical, targetRight);
        sfx(action.type === 'attack' ? ally ? 'attack' : 'enemyAttack' : 'skill');
        for (const target of liveTargets) bolt(actor, target, action, physical, flight);
        await wait(flight);
        if (closed) return;
        if (ally && !motionOff()) personFrame(ui.sprite, actor.sprite, 'back', personScale(), false);
        setPhase('contact', actor);
        const reports = liveTargets.map(target => {
          if (isHeal) return restore(actor, target, action);
          if (isSupport) return { target, amount: null, status: applyCondition(target, action), element: action.attribute };
          return strike(actor, target, action);
        });
        const emphasis = presentHit(reports, boost);
        await wait(quickHit ? 104 : 140);
        if (closed) return;
        setPhase('damage', actor);
        for (const report of reports) popDamage(report, quickHit, stacks);
        await wait(quickHit ? 86 : 115);
        if (closed) return;
        setPhase('settle', actor);
        const settle = emphasis.shatter ? 480 : quickHit ? 225 : emphasis.weak ? 345 : 310;
        root.style.setProperty('--cb-hp-time', `${time(Math.min(settle, 340))}ms`);
        showHitState(actor, reports);
        await wait(settle);
      }
    }
    if (closed) return;
    if (stacks) {
      for (const { node } of stacks.values()) {
        node.dataset.fading = 'true';
        setTimeout(() => node.remove(), time(620));
      }
    }
    setPhase('return', actor);
    ui.imageBox.classList.remove('is-weapon-stance', 'is-skill-stance');
    if (!isGuard) {
      if (ally && !motionOff()) personFrame(ui.sprite, actor.sprite, 'nextStep', personScale(), false);
      const returnTrip = animate(ui.imageBox, [
        { transform: lunge },
        { transform: `translate(${stepPlan.x * .12}px,${stepPlan.y * .48}px)`, offset: .58 },
        { transform: 'none' }
      ], 250, { fill: 'forwards', easing: 'ease-in-out' });
      await wait(130);
      if (closed) return;
      if (ally && !motionOff()) personFrame(ui.sprite, actor.sprite, 'step', personScale(), false);
      await wait(120);
      ui.imageBox.style.removeProperty('transform');
      returnTrip?.cancel();
    } else await wait(130);
    if (closed) return;
    if (ally) personFrame(ui.sprite, actor.sprite, 'back', personScale(), false);
    ui.group.classList.remove('is-acting');
  }

  function snapshot() {
    return { party: party.map(reportUnit), enemies: enemies.map(reportUnit), inventory: { ...inventory }, lastActions: copy(lastActions), round, turns };
  }

  function makeCheckpoint() {
    return { version: 1, party: party.map(checkpointUnit), enemies: enemies.map(checkpointUnit),
      inventory: { ...inventory }, lastActions: copy(lastActions), round, turns };
  }

  function checkpoint() {
    return copy(committed);
  }

  async function tickPoison() {
    const targets = units.filter(unit => remain(unit) && statusOn(unit, 'poison'));
    if (!targets.length) return;
    lastEvent = '毒のダメージ';
    activation = 0;
    showControls();
    const reports = targets.map(target => {
      const loss = Math.max(1, Math.ceil(target.maxHp * statusAmount(target, 'poison')));
      const amount = phaseDamage(target, Math.min(target.hp, loss));
      target.hp -= amount;
      return {target, amount, status: 'poison', element: '闇'};
    });
    delete root.dataset.actionActor;
    setPhase('contact');
    presentHit(reports, 0);
    await wait(110);
    if (closed) return;
    setPhase('damage');
    for (const report of reports) popDamage(report, false);
    await wait(85);
    if (closed) return;
    setPhase('settle');
    showHitState(null, reports);
    await wait(230);
  }

  async function playRound(repeating) {
    resolving = true;
    repeatPace = repeating;
    const order = teamOrder();
    roundOrder = order;
    showControls();
    const usingBoost = new Set();
    for (const actor of order) {
      if (closed) return;
      if (!canPlan(actor)) continue;
      const action = actor.side === 'ally' ? commandFor(actor, plan[actor.id], repeating) : enemyAction(actor);
      if (action.boost) usingBoost.add(actor.key);
      turns++;
      await perform(actor, action);
      if (closed) return;
      acted.add(actor.key);
      if (!living('enemy').length || !living('ally').length) {
        await wait(190);
        finish(living('enemy').length === 0, false);
        return;
      }
    }
    await tickPoison();
    if (closed) return;
    if (!living('enemy').length || !living('ally').length) {
      await wait(190);
      finish(living('enemy').length === 0 && living('ally').length > 0, false);
      return;
    }
    round++;
    roundOrder = null;
    tacticalPlans.clear();
    for (const unit of units) {
      unit.guarding = false;
      if (unit.side === 'ally' && remain(unit) && !usingBoost.has(unit.key)) unit.boost = Math.min(5, unit.boost + 1);
      if (unit.broken === round - 1) unit.guard = unit.maxShield;
      if (unit.tactics && tacticalBeat(round)==='surge' && !broken(unit)) unit.guard=unit.maxShield;
      for (const tag of Object.keys(unit.statuses)) if (unit.statuses[tag].until < round) delete unit.statuses[tag];
    }
    resolving = false;
    activation = 0;
    currentIndex = party.findIndex(canPlan);
    plan = {};
    acted.clear();
    setPhase('idle');
    banner.classList.remove('is-visible');
    showTimeline();
    showControls();
    committed = makeCheckpoint();
    onCommit?.({ ...snapshot(), checkpoint: checkpoint() });
  }

  function finish(won, escaped) {
    if (closed || result) return;
    resolving = false;
    result = { won, escaped, ...snapshot() };
    result.rewards = won ? rewards?.(result.enemies, { ...result, totalXP }) || {} : {};
    if(won){
      committed=makeCheckpoint();
      onCommit?.({ ...snapshot(),checkpoint:checkpoint() });
    }
    setPhase('idle');
    banner.classList.remove('is-visible');
    activation = 0;
    showTimeline();
    showControls();
    if (!escaped) sfx(won ? 'victory' : 'defeat');
    if (won && result.rewards.levelUps?.length) setTimeout(() => { if (!closed) sfx('level'); }, 440);
  }

  function showResult() {
    const outcome = element('div', `cb-outcome${result.won ? ' is-victory' : ''}`);
    const heading = element('div', 'cb-outcome-heading');
    const label = result.won ? '勝利' : result.escaped ? '離脱' : '全滅';
    heading.append(element('i', 'cb-outcome-mark', result.won ? '✦' : '◇'), element('strong', '', label));
    outcome.append(heading);
    if (result.won) {
      const { xp = 0, gold = 0, items: found, levelUps = [] } = result.rewards;
      const gain = element('div', 'cb-gain');
      gain.append(element('span', '', `経験 ＋${xp}`), element('span', '', `お金 ＋${gold}`));
      outcome.append(gain);
      if (levelUps.length) {
        const growth = element('section', 'cb-growth');
        growth.append(element('h3', '', 'レベルアップ'));
        const cards = element('div', 'cb-growth-cards');
        for (const level of levelUps) {
          const card = element('div', 'cb-growth-card');
          const heading = element('div', 'cb-growth-identity');
          heading.append(element('strong', '', level.name ?? level));
          if (Number.isFinite(level.from) && Number.isFinite(level.to)) {
            heading.append(element('span', 'cb-unit-level', `Lv ${level.from} → ${level.to}`));
          }
          card.append(heading);
          if (level.gains?.length) {
            const stats = element('div', 'cb-stat-gains');
            for (const { label, amount } of level.gains) {
              if (amount > 0) stats.append(element('span', '', `${label} ＋${amount}`));
            }
            card.append(stats);
          }
          if (level.learned?.length) {
            const learned = element('div', 'cb-learned-techniques');
            learned.append(element('b', '', '技を習得'));
            for (const name of level.learned) learned.append(element('span', '', name));
            card.append(learned);
          }
          cards.append(card);
        }
        growth.append(cards);
        outcome.append(growth);
      }
      if (found?.length) {
        const loot = element('div', 'cb-loots');
        loot.append(...rewardRows(found));
        outcome.append(loot);
      }
    }
    const closeText = result.won || result.escaped ? '先へ' : '旅へ戻る';
    const closeResult = (exploreLoot = false) => {
      if (closed) return;
      const outcomeData = exploreLoot ? { ...result, exploreLoot: true } : result;
      destroy();
      onFinish?.(outcomeData);
    };
    const actions = element('div', 'cb-outcome-actions');
    if (result.won && result.rewards.items?.some(item => item.equipment || item.slot)) {
      actions.append(button('装備して比べる', () => closeResult(true), 'cb-primary cb-outcome-close'));
    }
    actions.append(button(closeText, () => closeResult(), 'cb-outcome-close'));
    outcome.append(actions);
    commands.replaceChildren(outcome);
  }

  function destroy() {
    closed = true;
    observer?.disconnect();
    root.remove();
  }

  for (const unit of units) drawUnit(unit);
  if (enemies.some(unit=>unit.tactics)) {
    monsterStage.classList.add('cb-has-tactics');
    monsterStage.append(intent);
  }
  monsterStage.dataset.count = String(enemies.length);
  monsterStage.style.setProperty('--cb-count', enemies.length);
  partyStage.dataset.count = String(party.length);
  currentIndex = party.findIndex(canPlan);
  syncEnemyPhase();
  if (!living('ally').length) finish(false, false);
  else if (!living('enemy').length) finish(true, false);
  else {
    showTimeline();
    showControls();
  }
  return { destroy, snapshot, checkpoint };
}
