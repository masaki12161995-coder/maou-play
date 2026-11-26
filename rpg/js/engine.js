// 戦闘の決まり（ロマサガRS型・横向きの画面）。画面に触れない部分。ブラウザでもnodeでも動く
// 設計書「新しいRPG 戦いの決まり（ロマサガRS型）」に合わせる
//  ・仲間5人。陣形は5か所（場所ごとの能力の上下と狙われやすさ）。仲間も敵も「列（c：敵に近い順）」と「段（r）」を持つ
//  ・敵は縦3×横3のマスに最大9体。大きい敵は1体でマスを全部使う
//  ・技の範囲：単体・縦一列（同じ列）・横一列（同じ段）・全体・ランダム。印：近/遠、直接/間接
//  ・コマンドバトル。BP初期10・毎ターン＋3・上限20。通常AUTO（通常攻撃だけ）と全力AUTO（技も使う）。連携とオーバードライブはない
//  ・ダメージ＝（武器威力×1.5＋技威力）×（1＋攻める能力×4−守る能力×1.5）÷100×倍率
//  ・能力値＝もとの能力×魔物の心の％（付けていなければ100%）＋装備の上乗せ。そこに陣形の％
(function (root) {
"use strict";

const BP0 = 10, BP_TURN = 3, BP_MAX = 20;
const ATTR = ["斬", "打", "突", "熱", "冷", "雷", "陽", "陰"];
const RANK = { N: 7, E: 12, D: 18, C: 25, B: 33, A: 42, S: 52, SS: 64, SSS: 78 };
const STATS = ["str", "vit", "dex", "agi", "int", "wil", "lov", "cha"];
const ST_NM = { str: "腕力", vit: "体力", dex: "器用さ", agi: "素早さ", int: "知力", wil: "精神", lov: "愛", cha: "魅力" };
const RANGE_NM = { one: "単体", col: "縦", row: "横", all: "全体", rand: "ランダム", self: "自分", allies: "味方全体" };
// 武器の種類：威力が決まる能力と、通常攻撃の属性
const WTYPE = {
  sword: { nm: "剣", st: "str", at: ["斬"] }, great: { nm: "大剣", st: "str", at: ["斬"] }, axe: { nm: "斧", st: "str", at: ["斬"] },
  club: { nm: "棍棒", st: "str", at: ["打"] }, spear: { nm: "槍", st: "str", at: ["突"] }, rapier: { nm: "小剣", st: "dex", at: ["突"] },
  bow: { nm: "弓", st: "dex", at: ["突"] }, fist: { nm: "体術", st: "fist", at: ["打"] }, staff: { nm: "杖", st: "str", at: ["打"] },
  fang: { nm: "牙", st: "str", at: ["突"] }, claw: { nm: "爪", st: "str", at: ["斬"] },
};

// ---------- 技 ----------
// tg: 範囲。dist: 近/遠。dir: 直接/間接。kind: 攻撃・防御・補助・回復。magic: 術（知力で撃ち、精神で受ける）
const SKILLS = {
  attack:    { nm: "通常攻撃", bp: 0, rank: "N", tg: "one", dist: "近", dir: "直接", kind: "攻撃" },
  // レオン（剣）
  gale:      { nm: "疾風斬り", bp: 3, rank: "D", tg: "one", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  twin:      { nm: "二段斬り", bp: 6, rank: "C", tg: "one", hits: 2, at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  cleave:    { nm: "薙ぎ払い", bp: 8, rank: "C", tg: "row", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  // アデラ（剣と盾）
  guardcut:  { nm: "盾打ち", bp: 2, rank: "E", tg: "one", at: ["打"], stun: 60, dist: "近", dir: "直接", kind: "攻撃" },
  cover:     { nm: "かばう構え", bp: 4, tg: "self", cover: 3, kind: "防御" },
  holycut:   { nm: "聖光斬", bp: 9, rank: "B", tg: "one", at: ["斬", "陽"], dist: "近", dir: "直接", kind: "攻撃" },
  // カイン（杖・術）
  fireball:  { nm: "火の玉", bp: 3, rank: "D", tg: "one", at: ["熱"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  flamewall: { nm: "炎の柱", bp: 6, rank: "C", tg: "col", at: ["熱"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  inferno:   { nm: "業火", bp: 12, rank: "B", tg: "all", at: ["熱"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  // ミレイ（弓）
  aim:       { nm: "狙い撃ち", bp: 2, rank: "D", tg: "one", at: ["突"], dist: "遠", dir: "間接", kind: "攻撃" },
  healrain:  { nm: "癒しの水", bp: 5, tg: "allies", heal: 30, magic: 1, kind: "回復" },
  shower:    { nm: "五月雨撃ち", bp: 9, rank: "E", tg: "rand", hits: 5, at: ["突"], dist: "遠", dir: "間接", kind: "攻撃" },
  // ガイ（槍）
  thrust:    { nm: "突き", bp: 2, rank: "D", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  pierce:    { nm: "串刺し", bp: 5, rank: "C", tg: "row", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  lightning: { nm: "雷突き", bp: 10, rank: "A", tg: "one", at: ["突", "雷"], dist: "近", dir: "直接", kind: "攻撃" },
  // 魔物の技（心を付けると、その人も使える）
  spore:     { nm: "毒の胞子", bp: 3, rank: "E", tg: "col", at: ["陰"], magic: 1, poison: 70, dist: "遠", dir: "間接", kind: "攻撃" },
  gust:      { nm: "はばたき", bp: 4, rank: "D", tg: "row", at: ["斬"], dist: "遠", dir: "間接", kind: "攻撃" },
  hornrush:  { nm: "角の突進", bp: 4, rank: "C", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  bonebite:  { nm: "骨かみ", bp: 3, rank: "D", tg: "one", at: ["突", "陰"], dist: "近", dir: "直接", kind: "攻撃" },
  pickaxe:   { nm: "つるはし振り", bp: 4, rank: "C", tg: "one", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  stomp:     { nm: "地ならし", bp: 0, rank: "C", tg: "all", at: ["打"], dist: "遠", dir: "間接", kind: "攻撃" },
  fury:      { nm: "怒りの大振り", bp: 0, rank: "SS", tg: "all", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  sweepclub: { nm: "なぎ倒し", bp: 0, rank: "B", tg: "col", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  bodyslam:  { nm: "ぷるぷる体当たり", bp: 2, rank: "E", tg: "one", at: ["打"], stun: 30, dist: "近", dir: "直接", kind: "攻撃" },
  rootlash:  { nm: "根の鞭", bp: 7, rank: "B", tg: "row", at: ["打"], dist: "遠", dir: "直接", kind: "攻撃" },
  gnaw:      { nm: "かじりつき", bp: 2, rank: "D", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  // カイ（櫂＝棍棒）
  oarhit:    { nm: "櫂打ち", bp: 2, rank: "D", tg: "one", at: ["打"], stun: 35, dist: "近", dir: "直接", kind: "攻撃" },
  waterwheel:{ nm: "水車", bp: 6, rank: "C", tg: "row", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  rapidsplit:{ nm: "瀬割り", bp: 9, rank: "B", tg: "one", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  // リゼット（小剣）
  vitalstab: { nm: "急所突き", bp: 3, rank: "D", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  medicine:  { nm: "薬箱の手当て", bp: 5, tg: "allies", heal: 30, magic: 1, kind: "回復" },
  doublestab:{ nm: "二連突き", bp: 7, rank: "C", tg: "one", hits: 2, at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  // ムク（体術）
  headbutt:  { nm: "頭突き", bp: 2, rank: "D", tg: "one", at: ["打"], stun: 40, dist: "近", dir: "直接", kind: "攻撃" },
  flurry:    { nm: "連打", bp: 5, rank: "E", tg: "rand", hits: 3, at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  uppercut:  { nm: "かち上げ", bp: 8, rank: "B", tg: "one", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  // 魔物の技（心を宿すと、その人も使える）
  mochislam: { nm: "もち体当たり", bp: 2, rank: "E", tg: "one", at: ["打"], stun: 30, dist: "近", dir: "直接", kind: "攻撃" },
  waterthread:{ nm: "水の糸", bp: 4, rank: "D", tg: "one", at: ["冷"], magic: 1, stun: 25, dist: "遠", dir: "間接", kind: "攻撃" },
  acornshot: { nm: "どんぐりつぶて", bp: 3, rank: "D", tg: "one", at: ["突"], dist: "遠", dir: "間接", kind: "攻撃" },
  mudsplash: { nm: "泥はね", bp: 6, rank: "C", tg: "col", at: ["冷"], dist: "遠", dir: "間接", kind: "攻撃" },
  bigyawn:   { nm: "大あくび", bp: 8, rank: "E", tg: "all", at: ["陰"], magic: 1, stun: 30, dist: "遠", dir: "間接", kind: "攻撃" },
  swampquake:{ nm: "沼ゆらし", bp: 0, rank: "C", tg: "all", at: ["打"], dist: "遠", dir: "間接", kind: "攻撃" },
  bodypress: { nm: "のしかかり", bp: 0, rank: "B", tg: "one", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  bite:      { nm: "かみつき", bp: 0, rank: "D", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  mosscut:   { nm: "苔むす太刀", bp: 0, rank: "B", tg: "row", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  stonefang: { nm: "石の牙", bp: 0, rank: "B", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  glowspore: { nm: "光る胞子", bp: 0, rank: "C", tg: "all", at: ["陽"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  mossbreath:{ nm: "苔の息吹", bp: 0, rank: "A", tg: "all", at: ["冷"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  dragontail:{ nm: "竜の尾", bp: 0, rank: "A", tg: "col", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
};

// ---------- パッシブ ----------
const PASSIVES = {
  spirit:   { nm: "闘志", ds: "［戦いの始め］BP＋2" },
  momentum: { nm: "勢い", ds: "［攻撃が当たった時］たまにBP＋1" },
  swordway: { nm: "剣の心得", ds: "［いつも］斬のダメージ＋10%" },
  ironwall: { nm: "鉄壁", ds: "［いつも］受けるダメージ−15%" },
  standfast:{ nm: "仁王立ち", ds: "［ターンの始め］体力＋5%（3回まで）" },
  counter:  { nm: "反撃", ds: "［直接攻撃を受けた時］たまに通常攻撃で返す" },
  focus:    { nm: "魔力集中", ds: "［戦いの始め］BP＋3" },
  heatway:  { nm: "熱の心得", ds: "［いつも］熱のダメージ＋15%" },
  afterglow:{ nm: "余熱", ds: "［技を使った後］たまにBP＋2" },
  bowway:   { nm: "弓の心得", ds: "［いつも］突のダメージ＋10%" },
  healer:   { nm: "癒し手", ds: "［いつも］回復の量＋20%" },
  quickdraw:{ nm: "速射", ds: "［戦いの始め］素早さ＋15%" },
  spearway: { nm: "槍の心得", ds: "［いつも］突のダメージ＋10%" },
  charge:   { nm: "突撃", ds: "［戦いの始め］腕力＋10%" },
  thunder:  { nm: "雷の心得", ds: "［いつも］雷のダメージ＋15%" },
  clubway:  { nm: "棍棒の心得", ds: "［いつも］打のダメージ＋10%" },
  fistway:  { nm: "体術の心得", ds: "［いつも］打のダメージ＋10%" },
  rapierway:{ nm: "小剣の心得", ds: "［いつも］突のダメージ＋10%" },
  // 装備のパッシブ
  w_sword:  { nm: "剣士の誉れ", ds: "剣を使う者の腕力＋5%" },
  w_fire:   { nm: "炎の杖", ds: "熱のダメージ＋10%" },
  w_bp:     { nm: "鋭気", ds: "［攻撃が当たった時］まれにBP＋1" },
};

// ---------- 装備（ランクB〜SSS。st＝能力値の上乗せ、res＝耐性） ----------
const GEAR = {
  // 武器（威力powは武器の種類ごとに決まった値。拾った物には、まれに能力のおまけが付く）
  ironsword: { slot: "weapon", wt: "sword", nm: "鉄の剣", rank: "B", pow: 12, st: { str: 1 }, price: 120, icon: "eq_sword_02" },
  knightswd: { slot: "weapon", wt: "sword", nm: "騎士の剣", rank: "A", pow: 14, st: { str: 2, vit: 1 }, ps: "w_sword", price: 420, icon: "eq_sword_03" },
  oakstaff:  { slot: "weapon", wt: "staff", nm: "樫の杖", rank: "B", pow: 5, mp: { 熱: 12 }, st: { int: 2 }, ps: "w_fire", price: 110, icon: "eq_staff_02" },
  sagestaff: { slot: "weapon", wt: "staff", nm: "賢者の杖", rank: "A", pow: 6, mp: { 熱: 16 }, st: { int: 4, wil: 1 }, ps: "w_fire", price: 450, icon: "eq_staff_03" },
  shortbow:  { slot: "weapon", wt: "bow", nm: "狩人の弓", rank: "B", pow: 11, st: { dex: 2 }, price: 120, icon: "eq_bow_01" },
  longbow:   { slot: "weapon", wt: "bow", nm: "長弓", rank: "A", pow: 14, st: { dex: 3 }, ps: "w_bp", price: 430, icon: "eq_bow_03" },
  ironspear: { slot: "weapon", wt: "spear", nm: "鉄の槍", rank: "B", pow: 13, st: { str: 1 }, ps: "w_bp", price: 130, icon: "eq_spear_02" },
  oldblade:  { slot: "weapon", wt: "sword", nm: "古木の守り刀", rank: "S", pow: 18, st: { str: 3, agi: 2 }, ps: "w_bp", icon: "eq_sword_04" }, // 林の宝箱だけ
  oar:       { slot: "weapon", wt: "club", nm: "渡しの櫂", rank: "B", pow: 12, st: { vit: 1 }, price: 60, icon: "eq_club_01" },
  oakclub:   { slot: "weapon", wt: "club", nm: "樫の棍棒", rank: "B", pow: 13, st: { str: 1 }, price: 130, icon: "eq_club_02" },
  thinblade: { slot: "weapon", wt: "rapier", nm: "旅の小剣", rank: "B", pow: 10, st: { dex: 1 }, price: 60, icon: "eq_rapier_01" },
  needle:    { slot: "weapon", wt: "rapier", nm: "細身の剣", rank: "B", pow: 11, st: { dex: 2 }, price: 130, icon: "eq_rapier_02" },
  wraps:     { slot: "weapon", wt: "fist", nm: "革の拳当て", rank: "B", pow: 9, st: { agi: 1 }, price: 60, icon: "eq_fist_01" },
  ironfist:  { slot: "weapon", wt: "fist", nm: "鉄の拳当て", rank: "B", pow: 10, st: { str: 1 }, price: 130, icon: "eq_fist_02" },
  mosssword: { slot: "weapon", wt: "sword", nm: "苔むす古刀", rank: "A", pow: 15, st: { str: 2, vit: 1 }, icon: "eq_sword_03" },
  sennengai: { slot: "weapon", wt: "club", nm: "千年櫂", rank: "S", pow: 19, st: { str: 3, vit: 3 }, ps: "w_bp", icon: "eq_club_04" }, // 苔むす祠の奥だけ
  // 鎧・盾・飾り
  tunic:     { slot: "armor", kind: "服", nm: "麻の服", rank: "B", st: { vit: 1 }, res: { 斬: 5, 打: 5, 突: 5 }, price: 40, icon: "eq_vest_01" },
  cloak:     { slot: "armor", kind: "外套", nm: "旅の外套", rank: "B", st: { wil: 1 }, res: { 熱: 8, 冷: 8, 雷: 8 }, price: 60, icon: "eq_cloak_01" },
  plate:     { slot: "armor", kind: "重鎧", nm: "鉄の鎧", rank: "B", st: { vit: 3, agi: -3 }, res: { 斬: 20, 打: 15, 突: 20 }, price: 220, icon: "eq_armor_02" },
  leather:   { slot: "armor", kind: "軽鎧", nm: "革の鎧", rank: "B", st: { vit: 1 }, res: { 斬: 10, 打: 10, 突: 10, 熱: 5, 冷: 5, 雷: 5 }, price: 120, icon: "eq_armor_01" },
  chain:     { slot: "armor", kind: "軽鎧", nm: "鎖かたびら", rank: "A", st: { vit: 2 }, res: { 斬: 18, 打: 10, 突: 15, 熱: 5, 冷: 5, 雷: 5 }, price: 380, icon: "eq_vest_03" },
  robe:      { slot: "armor", kind: "ローブ", nm: "麻のローブ", rank: "B", st: { wil: 2 }, res: { 斬: -5, 打: -5, 突: -5, 熱: 15, 冷: 15, 雷: 15, 陽: 10, 陰: 10 }, price: 110, icon: "eq_robe_01" },
  buckler:   { slot: "sub", nm: "小さな盾", rank: "B", st: { vit: 1 }, sres: { スタン: 20 }, price: 80, icon: "eq_buckler_01" },
  hood:      { slot: "sub", nm: "旅の頭巾", rank: "B", st: { wil: 1 }, sres: { 毒: 20 }, price: 70, icon: "eq_hood_02" },
  ring:      { slot: "acc", nm: "力の指輪", rank: "B", st: { str: 2 }, price: 150, icon: "eq_ring_02" },
  charm:     { slot: "acc", nm: "お守り", rank: "B", st: { lov: 2, cha: 1 }, price: 100, icon: "eq_charm_01" },
};
// ---------- 素材（魔物が落とす。鍛冶で装備を強くするのに使う）と、道具 ----------
const MATS = {
  mochi:   { nm: "もちのかけら", icon: "mat_118", fam: "液体・粉", rare: "白" },
  ito:     { nm: "クモの糸", icon: "mat_121", fam: "布・紙", rare: "緑" },
  donguri: { nm: "どんぐり", icon: "mat_103", fam: "植物", rare: "白" },
  kegawa:  { nm: "茶色の毛皮", icon: "mat_006", fam: "皮・鱗・甲羅", rare: "白" },
  kai:     { nm: "沼の貝殻", icon: "mat_101", fam: "皮・鱗・甲羅", rare: "緑" },
  oreha:   { nm: "錆びた折れ刃", icon: "mat_012", fam: "金属", rare: "緑" },
  ishi:    { nm: "祠の石くれ", icon: "mat_078", fam: "石・結晶", rare: "紫" },
  kinoko:  { nm: "光るきのこ", icon: "mat_100", fam: "植物", rare: "白" },
  ryurin:  { nm: "苔竜の鱗", icon: "mat_077", fam: "皮・鱗・甲羅", rare: "紫" },
};
// 秘伝書：技を「覚醒」させて、使うBPを1つ減らす。1回目は壱、2回目は弐、3回目は参が要る
const TOOLS = {
  book1: { nm: "秘伝書・壱", icon: "tool_001", ds: "技の覚醒（1回目）に使う" },
  book2: { nm: "秘伝書・弐", icon: "tool_007", ds: "技の覚醒（2回目）に使う" },
  book3: { nm: "秘伝書・参", icon: "tool_013", ds: "技の覚醒（3回目）に使う" },
};
// 拾った武器・防具に付く「おまけ」（本家の(力)(体)…と同じ考え。＋付きはさらにまれ）
const BONUS = { str: "力", vit: "体", dex: "器", agi: "速", int: "知", wil: "精", lov: "愛", cha: "魅" };

// ---------- 魔物の心（本家のスタイル。もとの能力値に％を掛け、技を1つ足す） ----------
// up＝この心を付けていると上がりやすい能力値（本家のスタイルの↑と同じ考え）
const HEARTS = {
  koromochi:{ nm: "コロモチの心", col: "白", mul: { str: 92, vit: 110, dex: 95, agi: 90, int: 100, wil: 108, lov: 105, cha: 100 }, sk: "mochislam", up: ["vit", "wil"] },
  mizugumo: { nm: "ミズグモの心", col: "白", mul: { str: 98, vit: 94, dex: 108, agi: 108, int: 102, wil: 96, lov: 100, cha: 100 }, sk: "waterthread", up: ["dex", "agi"] },
  donguri:  { nm: "ドングリ兵の心", col: "白", mul: { str: 100, vit: 104, dex: 105, agi: 100, int: 95, wil: 100, lov: 100, cha: 104 }, sk: "acornshot", up: ["dex", "vit"] },
  nushi:    { nm: "ヌシガエルの心", col: "緑", mul: { str: 106, vit: 114, dex: 92, agi: 86, int: 102, wil: 112, lov: 105, cha: 102 }, sk: "bigyawn", up: ["vit", "wil"] },
  kokemusha:{ nm: "コケ武者の心", col: "緑", mul: { str: 114, vit: 110, dex: 100, agi: 90, int: 88, wil: 100, lov: 95, cha: 98 }, sk: "mosscut", up: ["str", "vit"] },
  koma:     { nm: "祠守りの狛の心", col: "緑", mul: { str: 108, vit: 116, dex: 96, agi: 96, int: 90, wil: 110, lov: 100, cha: 95 }, sk: "stonefang", up: ["vit", "str"] },
  sennen:   { nm: "千年ダケの心", col: "緑", mul: { str: 84, vit: 104, dex: 96, agi: 92, int: 116, wil: 112, lov: 108, cha: 104 }, sk: "glowspore", up: ["int", "wil"] },
  midorinushi:{ nm: "苔竜ミドリヌシの心", col: "青", mul: { str: 112, vit: 118, dex: 96, agi: 90, int: 112, wil: 114, lov: 104, cha: 106 }, sk: "mossbreath", up: ["vit", "int"] },
};

// ---------- 仲間（物語の順。0＝主人公） ----------
// st＝始めの能力値、cap＝本人の上限、up＝上がりやすい能力値、hpCap＝HPの上限、rare＝レア度
const HEROES = [
  { id: "kai", nm: "カイ", img: "person_079", wt: "club", rare: "S", hp: 230, hpCap: 1250, lp: 9, st: { str: 24, vit: 24, dex: 14, agi: 15, int: 9, wil: 16, lov: 12, cha: 14 },
    cap: { str: 122, vit: 128, dex: 90, agi: 94, int: 64, wil: 106, lov: 88, cha: 98 }, up: ["vit", "str"],
    res: {}, sk: ["oarhit", "waterwheel", "rapidsplit"], ps: ["ironwall", "clubway", "standfast"], gear: { weapon: "oar", armor: "tunic", sub: null, acc: null } },
  { id: "lise", nm: "リゼット", img: "person_002", wt: "rapier", rare: "S", hp: 165, hpCap: 1000, lp: 7, st: { str: 12, vit: 13, dex: 25, agi: 22, int: 18, wil: 17, lov: 22, cha: 22 },
    cap: { str: 76, vit: 86, dex: 124, agi: 116, int: 110, wil: 104, lov: 120, cha: 128 }, up: ["dex", "cha"],
    res: {}, sk: ["vitalstab", "medicine", "doublestab"], ps: ["rapierway", "healer", "momentum"], gear: { weapon: "thinblade", armor: "cloak", sub: null, acc: null } },
  { id: "muku", nm: "ムク", img: "person_058", wt: "fist", rare: "A", hp: 185, hpCap: 1080, lp: 8, st: { str: 22, vit: 17, dex: 15, agi: 24, int: 7, wil: 10, lov: 14, cha: 12 },
    cap: { str: 124, vit: 104, dex: 92, agi: 126, int: 54, wil: 76, lov: 90, cha: 84 }, up: ["str", "agi"],
    res: {}, sk: ["headbutt", "flurry", "uppercut"], ps: ["fistway", "spirit", "counter"], gear: { weapon: "wraps", armor: "tunic", sub: null, acc: null } },
];
const START = [0]; // はじめから居るのは主人公だけ
// 場所の上限（強さの段階ごと）。ここより先は、強い場所で戦わないと伸びない
// 強さの物差し：物語が1〜10、やり込みが11〜20。能力値の上限は14あたりで本人の上限に届く（その先は装備・心・技で伸ばす）
const AREA_CAP = { 1: { st: 30, hp: 260 }, 2: { st: 35, hp: 310 }, 3: { st: 41, hp: 370 }, 4: { st: 47, hp: 440 }, 5: { st: 53, hp: 520 }, 6: { st: 60, hp: 610 }, 7: { st: 67, hp: 710 }, 8: { st: 75, hp: 820 }, 9: { st: 83, hp: 940 }, 10: { st: 92, hp: 1080 },
  11: { st: 101, hp: 1230 }, 12: { st: 110, hp: 1390 }, 13: { st: 120, hp: 1560 }, 14: { st: 130, hp: 1740 }, 15: { st: 140, hp: 1930 }, 16: { st: 150, hp: 2130 }, 17: { st: 160, hp: 2340 }, 18: { st: 170, hp: 2560 }, 19: { st: 180, hp: 2790 }, 20: { st: 190, hp: 3030 } };
const capOf = tier => AREA_CAP[Math.max(1, Math.min(20, Math.floor(tier || 1)))];

// ---------- 陣形（5か所。c＝敵に近い順の列0〜2、r＝段0〜4。b＝能力の％、h＝狙われやすさ） ----------
const FORMATIONS = {
  arrow:  { nm: "鋒矢の陣", ds: "先頭が守りを固めて引きつけ、後ろが攻める",
            slots: [{ c: 0, r: 2, b: { vit: 30, wil: 30 }, h: 3 }, { c: 1, r: 1, b: { str: 15, dex: 15, int: 15 }, h: 1 }, { c: 1, r: 3, b: { str: 15, dex: 15, int: 15 }, h: 1 },
                    { c: 2, r: 0, b: { int: 20, lov: 20 }, h: 0.5 }, { c: 2, r: 4, b: { int: 20, lov: 20 }, h: 0.5 }] },
  line:   { nm: "横陣", ds: "全員の腕力・器用さ・知力＋10%。縦一列の攻撃に弱い",
            slots: [0, 1, 2, 3, 4].map(r => ({ c: 0, r, b: { str: 10, dex: 10, int: 10 }, h: 1 })) },
  square: { nm: "方陣", ds: "全員の体力・精神＋15%。前の2人が狙われやすい",
            slots: [{ c: 0, r: 1, b: { vit: 15, wil: 15 }, h: 1.6 }, { c: 0, r: 3, b: { vit: 15, wil: 15 }, h: 1.6 }, { c: 1, r: 2, b: { vit: 15, wil: 15 }, h: 1 },
                    { c: 2, r: 1, b: { vit: 15, wil: 15 }, h: 0.7 }, { c: 2, r: 3, b: { vit: 15, wil: 15 }, h: 0.7 }] },
};

// ---------- 魔物（決まった動き方。plan: ターン→技、every: nターンごと、rageFrom: 長引くと毎ターン） ----------
// 能力値は「強さ1」のときの値。場所の強さに合わせて掛け算する。human＝人間（心を落とさず、倒れても消えない）
const FOES = {
  // 西境：リム川・ささやきの森
  kawauso:  { mat: "kegawa", nm: "カワウソ盗", img: "m_kawauso", wt: "fang", pow: 6, hp: 80, st: { str: 14, vit: 10, dex: 16, agi: 18, int: 5, wil: 8, lov: 0, cha: 8 }, res: { 斬: -20 }, gold: 5 },
  koromochi:{ mat: "mochi", nm: "コロモチ", img: "m_koromochi", wt: "fist", pow: 6, hp: 75, st: { str: 13, vit: 14, dex: 8, agi: 9, int: 6, wil: 14, lov: 0, cha: 6 }, res: { 打: 40, 熱: -40, 雷: -30 }, every: { n: 3, sk: "mochislam" }, gold: 6, heart: "koromochi" },
  mizugumo: { mat: "ito", nm: "ミズグモ", img: "m_mizugumo", wt: "fang", pow: 7, hp: 95, st: { str: 17, vit: 11, dex: 16, agi: 22, int: 12, wil: 9, lov: 0, cha: 10 }, res: { 冷: 40, 熱: -40, 打: -20 }, every: { n: 2, sk: "waterthread" }, gold: 9, heart: "mizugumo" },
  donguri:  { mat: "donguri", nm: "ドングリ兵", img: "m_donguri", wt: "spear", pow: 7, hp: 90, st: { str: 16, vit: 14, dex: 14, agi: 12, int: 5, wil: 10, lov: 0, cha: 8 }, res: { 熱: -50, 打: 20, 斬: -20 }, every: { n: 3, sk: "acornshot" }, gold: 8, heart: "donguri" },
  nushi:    { mat: "kai", book: "book1", nm: "ヌシガエル", img: "m_nushi", wt: "fist", pow: 14, hp: 1050, boss: 1, st: { str: 42, vit: 22, dex: 10, agi: 10, int: 18, wil: 18, lov: 0, cha: 22 },
              res: { 打: 20, 冷: 50, 雷: -40, 熱: -20 }, plan: { 2: "mudsplash", 3: "bodypress", 4: "bigyawn", 6: "swampquake", 7: "bodypress", 8: "mudsplash" }, every: { n: 2, sk: "bodypress" }, rageFrom: 9, rage: "swampquake", stunRes: 1, gold: 120, heart: "nushi" },
  // 黒外套の兵（人間）
  kuro_s:   { nm: "黒外套の兵", img: "monster_019", human: 1, wt: "sword", pow: 11, hp: 340, st: { str: 30, vit: 20, dex: 14, agi: 14, int: 6, wil: 12, lov: 0, cha: 12 }, res: { 斬: 20, 雷: -30 }, every: { n: 3, sk: "gale" }, gold: 24 },
  kuro_a:   { nm: "黒外套の兵", img: "monster_020", human: 1, wt: "bow", pow: 10, hp: 255, st: { str: 12, vit: 12, dex: 32, agi: 20, int: 8, wil: 12, lov: 0, cha: 12 }, res: { 打: -20 }, every: { n: 2, sk: "aim" }, gold: 24 },
  // 苔むす祠（強さ6の場所。ここの値は強さ1のときのもの）
  kokemusha:{ mat: "oreha", nm: "コケ武者", img: "m_kokemusha", wt: "sword", pow: 12, hp: 190, st: { str: 26, vit: 22, dex: 14, agi: 13, int: 6, wil: 14, lov: 0, cha: 12 }, res: { 斬: 30, 突: 20, 熱: -50, 陽: -30 }, every: { n: 2, sk: "mosscut" }, gold: 30, heart: "kokemusha" },
  koma:     { mat: "ishi", nm: "祠守りの狛", img: "monster_067", wt: "fang", pow: 11, hp: 210, st: { str: 24, vit: 28, dex: 12, agi: 16, int: 6, wil: 18, lov: 0, cha: 12 }, res: { 斬: 40, 突: 40, 打: -40, 熱: 20 }, every: { n: 2, sk: "stonefang" }, stunRes: 1, gold: 32, heart: "koma" },
  sennen:   { mat: "kinoko", nm: "千年ダケ", img: "m_sennen", wt: "fist", pow: 7, hp: 160, st: { str: 10, vit: 16, dex: 10, agi: 12, int: 26, wil: 20, lov: 0, cha: 24 }, res: { 熱: -60, 冷: 30, 陽: 40 }, every: { n: 2, sk: "glowspore" }, gold: 28, heart: "sennen" },
  midorinushi:{ mat: "ryurin", book: "book2", nm: "苔竜ミドリヌシ", img: "m_midorinushi", wt: "claw", pow: 14, hp: 1500, boss: 1, st: { str: 30, vit: 26, dex: 14, agi: 14, int: 26, wil: 22, lov: 0, cha: 24 },
              res: { 斬: 20, 突: 20, 冷: 40, 熱: -40 }, plan: { 1: "dragontail", 3: "mossbreath", 5: "dragontail", 6: "mossbreath" }, every: { n: 2, sk: "dragontail" }, rageFrom: 9, rage: "mossbreath", stunRes: 1, gold: 900, heart: "midorinushi" },
};
const WAVES = [];

// ---------- 小道具 ----------
function rnd(st) { st.seed = (st.seed * 1103515245 + 12345) & 0x7fffffff; return st.seed / 0x7fffffff; }
function alive(list) { return list.filter(u => !u.down); }
function all(st) { return [...st.party, ...st.foes]; }
function opps(st, u) { return u.side === 0 ? st.foes : st.party; }
function hasP(u, id) { return (u.ps || []).includes(id); }
function log(st, e) { st.log.push(e); }
function keyOf(s) { return Object.keys(SKILLS).find(k => SKILLS[k] === s); }
// 耐性→倍率（本家は非公開のため、こちらで決めた形）：−45なら1.45倍、＋30なら約0.77倍、＋125なら約0.44倍
// その人にとっての消費BP（覚醒した回数だけ減る。1より下にはならない）
function cost(u, s) { if (!s.bp) return 0; const k = keyOf(s); return Math.max(1, s.bp - (((u && u.aw) || {})[k] || 0)); }
// 覚醒できる回数（重い技ほど多い）
function awMax(s) { return !s.bp ? 0 : s.bp <= 3 ? 1 : s.bp <= 7 ? 2 : 3; }
// 技ランク：使って勝つと上がる。1つ上がるごとに威力・回復量＋0.5%（最大99）
function rankMul(u, s) { const r = ((u && u.sr) || {})[keyOf(s)] || 1; return 1 + (r - 1) * 0.005; }
// 技のおまけの効果を短い言葉で（技の一覧に出す）
function fxText(s) {
  const out = [];
  if (s.tg === "rand") out.push(`ランダム${s.hits}回`); else if (s.hits > 1) out.push(`${s.hits}回攻撃`);
  if (s.stun) out.push("スタン");
  if (s.poison) out.push("毒");
  if (s.heal) out.push("倒れた味方も起こす");
  if (s.cover) out.push(`${s.cover}ターン身代わり`);
  return out.join("・");
}
function resMul(d, at) {
  let best = 0;
  for (const a of at) { const r = d.res[a] || 0; const m = r < 0 ? 1 - r / 100 : 100 / (100 + r); if (m > best) best = m; }
  return best || 1;
}

function defLo() { return { form: "arrow", pos: [0, null, null, null, null] }; }
// 遊んでいる記録（mem）から戦う人を作る。mem無しなら始めの状態（試しの計算用）
//  mem = { st, hp(最大HP), lp(いまのLP), gear:{slot: {id, b}}, heart: 心のキー|null }
function resolveHero(hi, mem) {
  const def = HEROES[hi];
  if (!mem) mem = { st: { ...def.st }, hp: def.hp, lp: def.lp, gear: Object.fromEntries(Object.entries(def.gear).map(([k, id]) => [k, id ? { id, b: null } : null])), heart: def.heart || null };
  return { ...def, hi, st: mem.st, hp: mem.hp, lpNow: mem.lp, gearList: Object.values(mem.gear).filter(Boolean), heart: mem.heart, sr: mem.sr || {}, aw: mem.aw || {} };
}
// 能力値：もとの能力×心の％＋装備の上乗せ（拾った物のおまけも）。そこに陣形の％
function heroStats(h, slotDef) {
  if (typeof h === "number") h = resolveHero(h);
  const heart = h.heart && HEARTS[h.heart], st = {}, res = { ...h.res }, ps = [...h.ps];
  for (const k of STATS) st[k] = h.st[k] * (heart ? heart.mul[k] / 100 : 1);
  let pow = 6; const mp = {}; // mp＝属性ごとの術威力（術の技は、その属性の術威力で撃つ。無ければ素手と同じ6）
  for (const it of h.gearList) {
    const g = GEAR[it.id]; if (!g) continue;
    for (const k in (g.st || {})) st[k] += g.st[k];
    for (const k in (it.b || {})) st[k] += it.b[k];
    for (const a in (g.res || {})) res[a] = (res[a] || 0) + g.res[a];
    if (g.ps) ps.push(g.ps);
    if (g.slot === "weapon") { pow = g.pow; for (const a in (g.mp || {})) mp[a] = g.mp[a]; if (it.el) mp[it.el] = Math.max(mp[it.el] || 0, Math.round(g.pow * 0.8)); }
  }
  if (ps.includes("w_sword") && h.wt === "sword") st.str *= 1.05;
  const b = slotDef ? slotDef.b : {};
  for (const k of STATS) st[k] = Math.max(1, Math.round(st[k] * (1 + (b[k] || 0) / 100)));
  const sk = [...h.sk]; if (heart) sk.push(heart.sk);
  return { st, res, ps, pow, mp, sk };
}
function base(u) { return Object.assign(u, { down: false, poison: 0, stun: 0, cover: 0, stack: 0, dealt: 0, taken: 0, healed: 0, downAt: 0 }); }

// wave：WAVESの番号か {nm, foes, tier}。roster：仲間ごとの記録（HEROESの並び。無ければ始めの状態）
function newBattle(wave, seed, lo, roster) {
  lo = lo || defLo();
  const W = typeof wave === "number" ? WAVES[wave] : wave, tier = W.tier || 1, m = 1 + 0.2 * (tier - 1);
  const st = { seed: seed || 1, turn: 0, actions: 0, queue: [], log: [], over: null, phase: "command", cmd: {}, focus: null, wave: W, lastCmd: {} };
  const F = FORMATIONS[lo.form];
  const SOLO = { c: 0, r: 2, b: {}, h: 1 };
  const lineup = W.solo != null ? [[W.solo, SOLO]] : (W.fixed || lo.pos).slice(0, 5).map((hi, slot) => [hi, F.slots[slot]]);
  st.party = lineup.filter(([hi]) => hi != null).map(([hi, sl], i) => {
    const h = resolveHero(hi, roster && roster[hi]), s = heroStats(h, sl);
    const u = base({ ...h, ...s, side: 0, slot: i, c: sl.c, r: sl.r, hate: sl.h, max: h.hp, hp: h.hp, lp: h.lpNow, bp: BP0 });
    if (u.lp <= 0) { u.down = true; u.hp = 0; } // LPが尽きた人は戦えない（宿で戻る）
    return u;
  });
  st.foes = W.foes.map((f, i) => {
    const M = FOES[f.k], fst = {};
    for (const k of STATS) fst[k] = Math.round(M.st[k] * m);
    const hp = Math.round(M.hp * Math.pow(m, 2.2)), pow = Math.round(M.pow * m); // 体力は能力値より速く増える（こちらの攻撃も、能力×武器×技で掛け算に伸びるため）
    return base({ ...M, pow, mag: Math.round(6 * m), st: fst, key: f.k, id: "f" + i, side: 1, slot: i, c: f.big ? -1 : f.c, r: f.big ? -1 : f.r, big: !!f.big, max: hp, hp, lp: 1, hate: 1, sk: [], ps: [], bp: 0 });
  });
  for (const u of st.party) {
    if (hasP(u, "spirit")) bpAdd(st, u, 2, "闘志");
    if (hasP(u, "focus")) bpAdd(st, u, 3, "魔力集中");
    if (hasP(u, "quickdraw")) { u.st.agi = Math.round(u.st.agi * 1.15); log(st, { t: "passive", u: u.id, nm: "速射" }); }
    if (hasP(u, "charge")) { u.st.str = Math.round(u.st.str * 1.1); log(st, { t: "passive", u: u.id, nm: "突撃" }); }
  }
  beginTurn(st);
  return st;
}
function bpAdd(st, u, v, why) { const b = u.bp; u.bp = Math.min(BP_MAX, u.bp + v); if (why) log(st, { t: "passive", u: u.id, nm: why, v: "BP+" + (u.bp - b) }); }

function beginTurn(st) {
  st.turn++;
  for (const u of alive(st.party)) {
    if (st.turn > 1) u.bp = Math.min(BP_MAX, u.bp + BP_TURN);
    if (hasP(u, "standfast") && u.stack < 3) { u.stack++; u.st.vit = Math.round(u.st.vit * 1.05); }
  }
  st.phase = "command"; st.cmd = {};
  const f = st.foes.find(x => x.id === st.focus);
  if (!f || f.down) st.focus = (alive(st.foes)[0] || {}).id;
  log(st, { t: "turn", n: st.turn });
}
// コマンドを選び終えたら動き出す。auto＝"normal"/"full"なら自動で選ぶ。support＝補助・防御・回復の技もオートで使うか
function commit(st, auto, support) {
  for (const u of alive(st.party)) if (auto || !st.cmd[u.id]) st.cmd[u.id] = keyOf(autoChoose(st, u, auto || "normal", support));
  st.lastCmd = { ...st.cmd };
  st.queue = alive(all(st)).map(u => ({ u, s: u.st.agi * (0.9 + rnd(st) * 0.2) })).sort((a, b) => b.s - a.s).map(x => x.u);
  st.phase = "run";
}

// ---------- 範囲 ----------
function targets(st, u, s) {
  const foes = alive(opps(st, u)); if (!foes.length) return [];
  if (s.tg === "all") return foes;
  const t = pickTarget(st, u, s); if (!t) return [];
  if (s.tg === "col") return t.big ? [t] : foes.filter(f => f.big || f.c === t.c);
  if (s.tg === "row") return t.big ? [t] : foes.filter(f => f.big || f.r === t.r);
  return [t];
}
function pickTarget(st, u, s) {
  const list = alive(opps(st, u)); if (!list.length) return null;
  if (u.side === 1) { // 狙われやすさで重み付け
    const w = list.map(p => p.hate * (p.cover > 0 ? 4 : 1)); const sum = w.reduce((a, b) => a + b, 0);
    let r = rnd(st) * sum; for (let i = 0; i < list.length; i++) { r -= w[i]; if (r <= 0) return list[i]; } return list[list.length - 1];
  }
  const f = list.find(x => x.id === st.focus); if (f) return f; // 全員で同じ敵を狙う
  const at = s.at || WTYPE[u.wt].at;
  return list.slice().sort((a, b) => resMul(b, at) - resMul(a, at) || a.hp - b.hp)[0];
}

// ---------- ダメージ ----------
function damage(st, a, d, s) {
  const wt = WTYPE[a.wt], magic = Boolean(s.magic), at = s.at || wt.at;
  let A, statT;
  if (magic) { A = a.st.int; statT = 1 + A * 4 - d.st.wil * 1.5; }
  else if (wt.st === "fist") { A = a.st.str; statT = 1 + a.st.str * 2 + a.st.agi * 2.5 - d.st.vit * 1.2; }
  else { A = a.st[wt.st]; statT = 1 + A * 4 - d.st.vit * 1.5; }
  statT = Math.max(A, statT);
  const mpow = a.side === 1 ? (a.mag || 6) : Math.max(6, ...at.map(x => (a.mp || {})[x] || 0)); // 術の技の威力：敵は強さに応じて、仲間は武器の術威力
  let v = ((magic ? mpow : a.pow) * 1.5 + RANK[s.rank || "N"]) * statT / 100;
  const rm = resMul(d, at); v *= rm;
  if (a.side === 0) v *= rankMul(a, s);
  if (hasP(a, "swordway") && at.includes("斬")) v *= 1.1;
  if ((hasP(a, "bowway") || hasP(a, "spearway") || hasP(a, "rapierway")) && at.includes("突")) v *= 1.1;
  if ((hasP(a, "clubway") || hasP(a, "fistway")) && at.includes("打")) v *= 1.1;
  if (hasP(a, "heatway") && at.includes("熱")) v *= 1.15;
  if (hasP(a, "w_fire") && at.includes("熱")) v *= 1.1;
  if (hasP(a, "thunder") && at.includes("雷")) v *= 1.15;
  if (hasP(d, "ironwall")) v *= 0.85;
  if (d.cover > 0) v *= 0.5;
  v *= 0.95 + rnd(st) * 0.1;
  v = Math.max(1, Math.round(v));
  d.hp = Math.max(0, d.hp - v); a.dealt += v; d.taken += v;
  log(st, { t: "hit", a: a.id, d: d.id, v, weak: rm > 1.05, resist: rm < 0.95 });
  if (hasP(a, "momentum") && rnd(st) < 0.3) bpAdd(st, a, 1, "勢い");
  if (hasP(a, "w_bp") && rnd(st) < 0.15) bpAdd(st, a, 1, "鋭気");
  if (d.hp <= 0) { fall(st, d); return v; }
  if (s.stun && !d.stunRes && rnd(st) * 100 < s.stun + (a.st.cha - d.st.cha)) { d.stun = 1; log(st, { t: "status", d: d.id, nm: "スタン" }); }
  if (s.poison && rnd(st) * 100 < s.poison + (a.st.cha - d.st.cha)) { d.poison = 3; log(st, { t: "status", d: d.id, nm: "毒" }); }
  if (s.dir === "直接" && hasP(d, "counter") && !a.down && rnd(st) < 0.25) { log(st, { t: "passive", u: d.id, nm: "反撃" }); damage(st, d, a, SKILLS.attack); }
  return v;
}
function hitDown(st, d) { if (d.lp > 0) { d.lp--; log(st, { t: "lp", d: d.id, lp: d.lp }); } }
function fall(st, d) {
  if (d.down) return;
  d.down = true; d.downAt = st.turn; d.lp = Math.max(0, d.lp - 1); d.poison = 0; d.stun = 0; d.cover = 0;
  log(st, { t: "down", d: d.id, lp: d.lp });
}

// ---------- オートの選び方 ----------
// オートの選び方（本家と同じ決まり）
//  通常AUTO：通常攻撃だけ
//  全力AUTO：今のBPで使える技の中で、いちばんBPの重いものを使う。同じBPなら下の段（心の技は一番下）。
//            攻撃と回復の技は使う。補助・防御の技は「補助/防御」がONのときだけ使う
function autoChoose(st, u, mode, support) {
  if (mode !== "full") return SKILLS.attack;
  let best = SKILLS.attack;
  for (const k of u.sk) {
    const s = SKILLS[k];
    if (cost(u, s) > u.bp) continue;
    if ((s.kind === "補助" || s.kind === "防御") && support === false) continue;
    if (cost(u, s) >= cost(u, best)) best = s;
  }
  return best;
}
function foeChoose(st, u) {
  if (u.plan && u.plan[st.turn]) return SKILLS[u.plan[st.turn]];
  if (u.rageFrom && st.turn >= u.rageFrom) return SKILLS[u.rage];
  if (u.every && st.turn % u.every.n === 0) return SKILLS[u.every.sk];
  return SKILLS.attack;
}

function act(st, u) {
  let s;
  if (u.side === 1) s = foeChoose(st, u);
  else { s = SKILLS[st.cmd[u.id]] || SKILLS.attack; if (cost(u, s) > u.bp) s = SKILLS.attack; }
  if (u.side === 0) { u.bp -= cost(u, s); if (s !== SKILLS.attack) (u.used = u.used || {})[keyOf(s)] = 1; }
  st.actions++;
  log(st, { t: "act", u: u.id, skill: keyOf(s), nm: s.nm, sk: s !== SKILLS.attack, magic: !!s.magic, kind: s.kind });
  if (s.tg === "self") { if (s.cover) { u.cover = s.cover; log(st, { t: "status", d: u.id, nm: "かばう構え" }); } }
  else if (s.tg === "allies") {
    for (const p of st.party) {
      if (p.down && p.lp <= 0) continue;
      const v = Math.round((s.heal + u.st.lov * 1.6) * (hasP(u, "healer") ? 1.2 : 1) * rankMul(u, s));
      if (p.down) { p.down = false; p.hp = Math.min(p.max, v); u.healed += p.hp; log(st, { t: "revive", d: p.id, v }); }
      else { const h = Math.min(p.max - p.hp, v); p.hp += h; u.healed += h; log(st, { t: "heal", d: p.id, v: h }); }
    }
  } else if (s.tg === "rand") {
    for (let k = 0; k < s.hits; k++) { const l = alive(opps(st, u)); if (!l.length) break; damage(st, u, l[Math.floor(rnd(st) * l.length)], s); }
  } else {
    const tg = targets(st, u, s);
    for (const d of tg) for (let k = 0; k < (s.hits || 1) && !d.down && !u.down; k++) damage(st, u, d, s);
    if (u.side === 1 && s.tg === "all") for (const d of st.party.filter(p => p.down && !tg.includes(p))) hitDown(st, d); // 全体攻撃は倒れた仲間も巻き込む
  }
  if (u.side === 0 && s !== SKILLS.attack && hasP(u, "afterglow") && rnd(st) < 0.35) bpAdd(st, u, 2, "余熱");
}

// 1人ぶん進める。戻り値は動いた人。ターンが終わると次のターンのコマンド選びに戻る（nullを返す）
function step(st) {
  if (st.over || st.phase !== "run") return null;
  while (st.queue.length && st.queue[0].down) st.queue.shift();
  if (!st.queue.length) { endTurn(st); if (!st.over) beginTurn(st); return null; }
  const u = st.queue.shift();
  if (u.stun > 0) { u.stun = 0; log(st, { t: "skip", u: u.id, nm: "スタン" }); }
  else act(st, u);
  checkEnd(st);
  return u;
}
function endTurn(st) {
  for (const u of alive(all(st))) {
    if (u.poison > 0) { const v = Math.max(1, Math.round(u.max * 0.06)); u.hp = Math.max(0, u.hp - v); u.poison--; log(st, { t: "dot", d: u.id, v, nm: "毒" }); if (u.hp <= 0) fall(st, u); }
    if (u.cover > 0) u.cover--;
  }
  checkEnd(st);
  if (!st.over && st.wave.until && st.turn >= st.wave.until) st.over = st.wave.untilOver || "lose"; // 物語で決まっている終わり方
  if (!st.over && st.turn >= 30) st.over = "time";
}
function checkEnd(st) {
  if (!alive(st.foes).length) st.over = "win"; else if (!alive(st.party).length) st.over = "lose";
}

// ---------- 戦いのあと ----------
// 成長：勝った戦いに出ていた人だけ。上がる先は「場所の上限」と「本人の上限」の低いほう。上限から遠いほど上がりやすい
function grow(hi, mem, tier, rng) {
  const def = HEROES[hi], A = capOf(tier), heart = mem.heart && HEARTS[mem.heart], out = [];
  for (const k of STATS) {
    const cap = Math.min(A.st, def.cap[k]), v = mem.st[k];
    if (v >= cap) continue;
    let p = 0.10 + 0.5 * (1 - v / cap);
    if (def.up.includes(k)) p *= 1.6;
    if (heart && heart.up.includes(k)) p *= 1.6;
    p = Math.min(0.85, p * 0.35);
    if (rng() < p) { const add = rng() < 0.15 && v + 2 <= cap ? 2 : 1; mem.st[k] += add; out.push({ k, v: add }); }
  }
  const hcap = Math.min(A.hp, def.hpCap);
  if (mem.hp < hcap && rng() < 0.25 + 0.6 * (1 - mem.hp / hcap)) { const add = Math.min(hcap - mem.hp, 4 + Math.floor(rng() * 9)); mem.hp += add; out.push({ k: "hp", v: add }); }
  return out;
}
// 拾った武器・防具：決まった中身＋まれに能力のおまけ（(力)なら腕力＋3、さらにまれに＋付きで＋4）
// 技ランク：その戦いで使った技が、勝つと上がることがある。上限は場所の強さ×10（弱い場所では頭打ち）
function rankUp(mem, used, tier, rng) {
  const out = [], cap = Math.min(99, (tier || 1) * 10);
  mem.sr = mem.sr || {};
  for (const k of Object.keys(used || {})) {
    const cur = mem.sr[k] || 1;
    if (cur < cap && rng() < 0.15 + 0.5 * (1 - cur / cap)) { mem.sr[k] = cur + 1; out.push({ k, nm: SKILLS[k].nm, v: cur + 1 }); }
  }
  return out;
}
function rollItem(id, rng) {
  const g = GEAR[id], it = { id, b: null, tag: "" };
  if (!g) return it;
  // 属性つきの武器（ランクA以上・杖以外）：その属性の術威力が付き、知力＋3。心の技など、術の技を持つ人に向く
  if (g.slot === "weapon" && g.wt !== "staff" && g.rank !== "B" && rng() < 0.12) {
    const el = ["熱", "冷", "雷", "陽", "陰"][Math.floor(rng() * 5)];
    it.el = el; it.b = { int: 3 }; it.tag = "(" + el + ")"; return it;
  }
  if (rng() > 0.22) return it;
  const pool = g.slot === "weapon" ? (g.wt === "staff" ? ["int", "wil"] : g.wt === "bow" ? ["dex", "agi"] : ["str", "vit", "agi"]) : ["vit", "wil", "agi"];
  const k = pool[Math.floor(rng() * pool.length)], plus = rng() < 0.15;
  it.b = { [k]: plus ? 4 : 3 }; it.tag = "(" + BONUS[k] + (plus ? "+" : "") + ")";
  return it;
}
// ごほうび：お金と、魔物の心・武器防具の落とし物
function rewards(st, rng) {
  const out = { gold: 0, hearts: [], items: [], mats: [], tools: [] }, tier = st.wave.tier || 1;
  for (const f of st.foes) {
    out.gold += Math.round((f.gold || 0) * Math.pow(1.3, tier - 1) * (0.8 + rng() * 0.4)); // お金は強さ1つごとに1.3倍
    if (f.heart && !st.wave.noHeart && rng() < (f.boss ? 1 : 0.07)) out.hearts.push(f.heart);
    if (f.mat && rng() < (f.boss ? 1 : 0.4)) out.mats.push(f.mat);
    if (f.book && f.boss) out.tools.push(f.book);
  }
  const drops = st.wave.drops || [];
  for (const d of drops) if (rng() < d.p) out.items.push(rollItem(d.id, rng));
  return out;
}

const api = { BP0, BP_TURN, BP_MAX, ATTR, RANK, STATS, ST_NM, RANGE_NM, WTYPE, SKILLS, PASSIVES, GEAR, HEARTS, HEROES, START, FORMATIONS, FOES, WAVES,
  BONUS, AREA_CAP, MATS, TOOLS, cost, awMax, rankMul, fxText, rankUp, defLo, resolveHero, heroStats, newBattle, commit, step, alive, resMul, grow, rollItem, rewards };
if (typeof module !== "undefined") module.exports = api; else root.BT = api;
})(this);
