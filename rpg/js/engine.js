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
const RANGE_NM = { one: "単体", col: "縦", row: "横", all: "全体", rand: "ランダム", self: "自分", allies: "味方全体", summon: "" };
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
  // 集める仲間（西境地方）
  r_shotei:  { nm: "掌底", bp: 2, rank: "D", tg: "one", at: ["打"], stun: 25, dist: "近", dir: "直接", kind: "攻撃" },
  r_senpu:   { nm: "旋風脚", bp: 6, rank: "C", tg: "row", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  // ドン・ガルム（棍棒）
  g_ranpan:  { nm: "欄干打ち", bp: 2, rank: "D", tg: "one", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  g_jinarashi:{ nm: "地ならし", bp: 6, rank: "C", tg: "row", at: ["打"], stun: 1, dist: "近", dir: "直接", kind: "攻撃" },
  g_hashi:   { nm: "橋の構え", bp: 4, tg: "self", cover: 3, kind: "防御" },
  // ハンナ（斧）
  h_maki:    { nm: "薪割り", bp: 3, rank: "D", tg: "one", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  h_maruta:  { nm: "丸太転がし", bp: 6, rank: "C", tg: "row", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  h_taiboku: { nm: "大木断ち", bp: 9, rank: "B", tg: "one", at: ["斬"], stun: 1, dist: "近", dir: "直接", kind: "攻撃" },
  sig_sandan:{ nm: "三段突き", bp: 9, rank: "C", tg: "one", hits: 3, at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  r_hyaku:   { nm: "百烈拳", bp: 9, rank: "D", tg: "one", hits: 3, at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  t_neko:    { nm: "猫の一突き", bp: 8, rank: "B", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  s_kage:    { nm: "影縫い", bp: 4, rank: "D", tg: "one", at: ["突"], stun: 40, dist: "遠", dir: "間接", kind: "攻撃" },
  p_kado:    { nm: "本の角", bp: 2, rank: "E", tg: "one", at: ["打"], stun: 50, dist: "近", dir: "直接", kind: "攻撃" },
  p_yomi:    { nm: "読み聞かせ", bp: 5, tg: "allies", heal: 18, magic: 1, kind: "回復" },
  p_atsu:    { nm: "分厚い一撃", bp: 6, rank: "C", tg: "one", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  k_doku:    { nm: "毒の小刀", bp: 3, rank: "E", tg: "one", at: ["突"], poison: 70, dist: "近", dir: "直接", kind: "攻撃" },
  k_kemuri:  { nm: "化け煙", bp: 5, rank: "E", tg: "all", at: ["陰"], magic: 1, stun: 20, dist: "遠", dir: "間接", kind: "攻撃" },
  k_kusune:  { nm: "くすね斬り", bp: 6, rank: "C", tg: "one", hits: 2, at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  n_spanner: { nm: "スパナ打ち", bp: 2, rank: "D", tg: "one", at: ["打"], stun: 40, dist: "近", dir: "直接", kind: "攻撃" },
  n_shime:   { nm: "締め直し", bp: 5, tg: "allies", heal: 20, kind: "回復" },
  n_haguru:  { nm: "歯車投げ", bp: 5, rank: "C", tg: "col", at: ["打"], dist: "遠", dir: "間接", kind: "攻撃" },
  c_suzu:    { nm: "鈴の音", bp: 3, rank: "D", tg: "one", at: ["陽"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  c_genki:   { nm: "元気の鈴", bp: 5, tg: "allies", heal: 30, magic: 1, kind: "回復" },
  c_kane:    { nm: "鐘の響き", bp: 9, rank: "C", tg: "all", at: ["陽"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  // ブラム（大剣）
  kabuto:    { nm: "兜割り", bp: 3, rank: "D", tg: "one", at: ["斬"], stun: 30, dist: "近", dir: "直接", kind: "攻撃" },
  onagi:     { nm: "大薙ぎ", bp: 7, rank: "C", tg: "row", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  sutemi:    { nm: "捨て身斬り", bp: 10, rank: "B", tg: "one", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  // カイ（先に鉄をはめた長い棹＝槍の扱い。突）。技の名前を変えても、記録の中の名前（oarhit など）はそのまま
  oarhit:    { nm: "棹突き", bp: 2, rank: "D", tg: "one", at: ["突"], stun: 35, dist: "近", dir: "直接", kind: "攻撃" },
  waterwheel:{ nm: "水切り", bp: 6, rank: "C", tg: "row", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  rapidsplit:{ nm: "瀬割り", bp: 9, rank: "B", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
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
  silkbind:  { nm: "糸しばり", bp: 0, rank: "D", tg: "one", at: ["冷"], dist: "遠", dir: "間接", kind: "攻撃" },
  callkids:  { nm: "子を呼ぶ", bp: 0, tg: "summon", kind: "補助" },
  wingslap:  { nm: "羽耳はたき", bp: 3, rank: "D", tg: "row", at: ["斬"], dist: "遠", dir: "間接", kind: "攻撃" },
  sickle:    { nm: "錆び鎌", bp: 4, rank: "C", tg: "one", at: ["斬"], poison: 35, dist: "近", dir: "直接", kind: "攻撃" },
  pebble:    { nm: "小石つぶて", bp: 2, rank: "D", tg: "one", at: ["打"], dist: "遠", dir: "間接", kind: "攻撃" },
  vinewhip:  { nm: "蔦しばり", bp: 4, rank: "C", tg: "one", at: ["斬"], stun: 25, dist: "近", dir: "直接", kind: "攻撃" },
  stonethrow:{ nm: "石投げ", bp: 0, rank: "B", tg: "one", at: ["打"], dist: "遠", dir: "間接", kind: "攻撃" },
  bridgequake:{ nm: "地ならし", bp: 0, rank: "C", tg: "all", at: ["打"], dist: "遠", dir: "間接", kind: "攻撃" },
  // 中央平原
  strawroll: { nm: "わら転がし", bp: 3, rank: "D", tg: "row", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  sickleear: { nm: "鎌耳", bp: 3, rank: "D", tg: "one", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  windsting: { nm: "風車針", bp: 3, rank: "D", tg: "one", at: ["突"], poison: 50, dist: "遠", dir: "間接", kind: "攻撃" },
  mugikami:  { nm: "麦穂噛み", bp: 3, rank: "D", tg: "one", at: ["突"], poison: 45, dist: "近", dir: "直接", kind: "攻撃" },
  sunakaki:  { nm: "砂かき", bp: 4, rank: "C", tg: "row", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  togeken:   { nm: "とげ拳", bp: 4, rank: "C", tg: "one", at: ["突", "打"], dist: "近", dir: "直接", kind: "攻撃" },
  hasami:    { nm: "大ばさみ", bp: 4, rank: "C", tg: "one", at: ["斬"], hits: 2, dist: "近", dir: "直接", kind: "攻撃" },
  // ジャコ（弓）：賽の目のように散らばる矢、泣き声で怯ませる矢、逃げ際の一矢
  j_sai:     { nm: "賽の目撃ち", bp: 5, rank: "E", tg: "rand", hits: 3, at: ["突"], dist: "遠", dir: "間接", kind: "攻撃" },
  j_naki:    { nm: "泣き矢", bp: 4, rank: "D", tg: "col", at: ["突"], stun: 30, dist: "遠", dir: "間接", kind: "攻撃" },
  j_miyage:  { nm: "置き土産", bp: 8, rank: "B", tg: "one", at: ["突"], dist: "遠", dir: "間接", kind: "攻撃" },
  mudslap:   { nm: "泥はたき", bp: 4, rank: "C", tg: "col", at: ["打"], dist: "近", dir: "直接", kind: "攻撃" },
  // 王家の地下墓所
  gravepeck: { nm: "墓つつき", bp: 3, rank: "D", tg: "one", at: ["突", "陰"], dist: "遠", dir: "間接", kind: "攻撃" },
  oldblade2: { nm: "古式の剣", bp: 4, rank: "C", tg: "one", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  bluefire:  { nm: "青い灯", bp: 4, rank: "D", tg: "col", at: ["熱", "陰"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  lidpinch:  { nm: "蓋ばさみ", bp: 4, rank: "C", tg: "one", at: ["打"], stun: 30, dist: "近", dir: "直接", kind: "攻撃" },
  lionclaw:  { nm: "石の爪", bp: 0, rank: "B", tg: "one", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
  lionroar:  { nm: "咆哮", bp: 0, rank: "C", tg: "all", at: ["打"], stun: 20, dist: "遠", dir: "間接", kind: "攻撃" },
  lionfang:  { nm: "石の牙", bp: 0, rank: "A", tg: "one", at: ["突"], dist: "近", dir: "直接", kind: "攻撃" },
  lionbreath:{ nm: "灰の息", bp: 0, rank: "C", tg: "row", at: ["陰"], magic: 1, dist: "遠", dir: "間接", kind: "攻撃" },
  wolfbite:  { nm: "かみ裂き", bp: 3, rank: "D", tg: "one", at: ["斬"], dist: "近", dir: "直接", kind: "攻撃" },
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
  sunway:   { nm: "陽の心得", ds: "［いつも］陽のダメージ＋15%" },
  greatway: { nm: "大剣の心得", ds: "［いつも］斬のダメージ＋10%" },
  axeway:   { nm: "斧の心得", ds: "［いつも］斬のダメージ＋10%" },
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
  saibow:    { slot: "weapon", wt: "bow", nm: "賽振りの短弓", rank: "B", pow: 13, st: { cha: 2 }, price: 0, icon: "eq_bow_02" },
  longbow:   { slot: "weapon", wt: "bow", nm: "長弓", rank: "A", pow: 14, st: { dex: 3 }, ps: "w_bp", price: 430, icon: "eq_bow_03" },
  ironspear: { slot: "weapon", wt: "spear", nm: "鉄の槍", rank: "B", pow: 13, st: { str: 1 }, ps: "w_bp", price: 130, icon: "eq_spear_02" },
  oldblade:  { slot: "weapon", wt: "sword", nm: "古木の守り刀", rank: "S", pow: 18, st: { str: 3, agi: 2 }, ps: "w_bp", icon: "eq_sword_04" }, // 林の宝箱だけ
  heavybook: { slot: "weapon", wt: "club", nm: "分厚い本", rank: "B", pow: 11, st: { int: 2 }, price: 150, icon: "mat_046" },
  spanner:   { slot: "weapon", wt: "club", nm: "大きなスパナ", rank: "B", pow: 12, st: { dex: 1 }, price: 150, icon: "eq_club_03" },
  bellstaff: { slot: "weapon", wt: "staff", nm: "鈴の杖", rank: "B", pow: 5, mp: { 陽: 12 }, st: { lov: 2 }, price: 160, icon: "eq_staff_02" },
  ranpan:    { slot: "weapon", wt: "club", nm: "石の欄干", rank: "B", pow: 14, st: { vit: 2, agi: -1 }, icon: "eq_club_03" },
  woodaxe:   { slot: "weapon", wt: "axe", nm: "木こりの大斧", rank: "C", pow: 13, st: { str: 2, dex: -1 }, price: 120, icon: "eq_axe_02" },
  scoutgreat:{ slot: "weapon", wt: "great", nm: "斥候の大剣", rank: "B", pow: 15, st: { str: 2, agi: -2 }, price: 200, icon: "eq_great_01" },
  iron_great:{ slot: "weapon", wt: "great", nm: "鉄の大剣", rank: "B", pow: 15, st: { str: 1, agi: -1 }, price: 220, icon: "eq_great_03" },
  oar:       { slot: "weapon", wt: "spear", nm: "渡しの棹", rank: "B", pow: 12, st: { vit: 1 }, price: 60, icon: "eq_spear_01" },
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
  karasu:  { nm: "鴉の羽根", icon: "mat_108", fam: "羽", rare: "緑" },
  hone:    { nm: "小さな骨", icon: "mat_115", fam: "骨・牙・爪", rare: "白" },
  rou:     { nm: "青い蝋", icon: "mat_rou", fam: "液体・粉", rare: "白" },
  sekkan:  { nm: "石棺のかけら", icon: "mat_009", fam: "石・結晶", rare: "白" },
  mugi:    { nm: "麦わら", icon: "mat_024", fam: "植物", rare: "白" },
  usage:   { nm: "兎の毛皮", icon: "mat_006", fam: "皮・鱗・甲羅", rare: "白" },
  doro:    { nm: "泥の塊", icon: "mat_023", fam: "液体・粉", rare: "緑" },
  tetsu:   { nm: "鉄くず", icon: "mat_010", fam: "金属", rare: "白" },
  hane:    { nm: "灰色の羽耳", icon: "mat_015", fam: "羽", rare: "白" },
  wara:    { nm: "かかしの布きれ", icon: "mat_013", fam: "布・紙", rare: "白" },
  koishi:  { nm: "丸い小石", icon: "mat_005", fam: "石・結晶", rare: "白" },
  tsuta:   { nm: "鎧の蔦", icon: "mat_004", fam: "植物", rare: "白" },
  kiba:    { nm: "狼の牙", icon: "mat_033", fam: "骨・牙・爪", rare: "緑" },
  ryurin:  { nm: "苔竜の鱗", icon: "mat_077", fam: "皮・鱗・甲羅", rare: "紫" },
  akauroko: { nm: "赤麦蛇の鱗", icon: "mat_008", fam: "皮・鱗・甲羅", rare: "白" },
  tsume:    { nm: "白い大爪", icon: "mat_033", fam: "骨・牙・爪", rare: "緑" },
  kokaku:   { nm: "蠍の甲殻", icon: "mat_008", fam: "皮・鱗・甲羅", rare: "緑" },
  sabotane: { nm: "サボテンの種", icon: "mat_024", fam: "植物", rare: "白" },
};
// 秘伝書：技を「覚醒」させて、使うBPを1つ減らす。1回目は壱、2回目は弐、3回目は参が要る
const TOOLS = {
  book1: { nm: "秘伝書・壱", icon: "tool_001", ds: "技の覚醒（1回目）に使う" },
  book2: { nm: "秘伝書・弐", icon: "tool_007", ds: "技の覚醒（2回目）に使う" },
  book3: { nm: "秘伝書・参", icon: "tool_013", ds: "技の覚醒（3回目）に使う" },
  // 食べ物：戦いの中で、技と同じように選んで食べる（food＝戻るHPの割合）。その人の1回の行動を使う
  hoshiniku: { nm: "干し肉", icon: "tool_034", ds: "戦いの中で食べると、HPが2割戻る。犬の好物", food: 0.2, price: 10 },
  onigiri: { nm: "握り飯", icon: "tool_onigiri", ds: "戦いの中で食べると、HPが3割戻る", food: 0.3, price: 20 },
  uo: { nm: "川魚", icon: "tool_uo", ds: "リム川でとれた魚。ヤン爺が分けてくれる" },
  hon: { nm: "貸本", icon: "mat_046", ds: "半年も返ってこなかった、ハルネの貸本屋の本", key: 1 },
  bento: { nm: "村長の弁当", icon: "tool_bento", ds: "戦いの中で食べると、HPが半分戻る", food: 0.5 },
  // 物語の品（使えない）
  tsuno: { nm: "焦げた角飾り", icon: "mat_062", ds: "川の簗に引っかかっていた", key: 1 },
  shibou: { nm: "死亡届の控え", icon: "mat_021", ds: "王都の役場で受け取った、届けの控え", key: 1 },
  hakamairi: { nm: "墓参りの札", icon: "mat_072", ds: "関守に見せれば、墓参りの者として東の関所を通れる", key: 1 },
  medal: { nm: "金の蠍のメダル", icon: "mat_073", ds: "金の蠍亭の遊びに使うメダル", key: 1 },
};
const FOODS = Object.keys(TOOLS).filter(k => TOOLS[k].food); // 弱いものから先に食べる
// 拾った武器・防具に付く「おまけ」（本家の(力)(体)…と同じ考え。＋付きはさらにまれ）
const BONUS = { str: "力", vit: "体", dex: "器", agi: "速", int: "知", wil: "精", lov: "愛", cha: "魅" };

// ---------- 魔物の心（本家のスタイル。もとの能力値に％を掛け、技を1つ足す） ----------
// up＝この心を付けていると上がりやすい能力値（本家のスタイルの↑と同じ考え）
const HEARTS = {
  koromochi:{ nm: "コロモチの心", col: "白", mul: { str: 92, vit: 110, dex: 95, agi: 90, int: 100, wil: 108, lov: 105, cha: 100 }, sk: "mochislam", up: ["vit", "wil"] },
  mizugumo: { nm: "ミズグモの心", col: "白", mul: { str: 98, vit: 94, dex: 108, agi: 108, int: 102, wil: 96, lov: 100, cha: 100 }, sk: "waterthread", up: ["dex", "agi"] },
  donguri:  { nm: "ドングリ兵の心", col: "白", mul: { str: 100, vit: 104, dex: 105, agi: 100, int: 95, wil: 100, lov: 100, cha: 104 }, sk: "acornshot", up: ["dex", "vit"] },
  hanenezumi:{ nm: "ハネネズミの心", col: "白", mul: { str: 94, vit: 92, dex: 106, agi: 114, int: 100, wil: 96, lov: 100, cha: 102 }, sk: "wingslap", up: ["agi", "dex"] },
  kakashi:  { nm: "カカシ番の心", col: "白", mul: { str: 108, vit: 106, dex: 98, agi: 88, int: 96, wil: 104, lov: 100, cha: 96 }, sk: "sickle", up: ["str", "vit"] },
  ishikoro: { nm: "イシコロ小僧の心", col: "白", mul: { str: 104, vit: 110, dex: 100, agi: 92, int: 94, wil: 100, lov: 100, cha: 100 }, sk: "pebble", up: ["vit", "dex"] },
  tsutayoroi:{ nm: "ツタ鎧の心", col: "緑", mul: { str: 108, vit: 112, dex: 96, agi: 90, int: 96, wil: 104, lov: 100, cha: 96 }, sk: "vinewhip", up: ["vit", "str"] },
  mugiwara: { nm: "ムギワラ坊の心", col: "白", mul: { str: 102, vit: 104, dex: 100, agi: 98, int: 96, wil: 100, lov: 104, cha: 100 }, sk: "strawroll", up: ["vit", "lov"] },
  kamausagi:{ nm: "カマウサギの心", col: "白", mul: { str: 104, vit: 92, dex: 104, agi: 112, int: 92, wil: 96, lov: 100, cha: 100 }, sk: "sickleear", up: ["agi", "str"] },
  fusha:    { nm: "フウシャ虫の心", col: "白", mul: { str: 94, vit: 94, dex: 110, agi: 108, int: 100, wil: 98, lov: 100, cha: 100 }, sk: "windsting", up: ["dex", "agi"] },
  doro:     { nm: "ドロ人形の心", col: "緑", mul: { str: 110, vit: 114, dex: 92, agi: 86, int: 94, wil: 104, lov: 100, cha: 96 }, sk: "mudslap", up: ["vit", "str"] },
  hakamori: { nm: "ハカモリ鴉の心", col: "白", mul: { str: 96, vit: 92, dex: 108, agi: 114, int: 100, wil: 96, lov: 100, cha: 100 }, sk: "gravepeck", up: ["agi", "dex"] },
  honeban:  { nm: "ホネ番兵の心", col: "白", mul: { str: 108, vit: 104, dex: 104, agi: 94, int: 90, wil: 100, lov: 96, cha: 100 }, sk: "oldblade2", up: ["str", "dex"] },
  rousoku:  { nm: "ロウソク霊の心", col: "白", mul: { str: 90, vit: 92, dex: 98, agi: 104, int: 114, wil: 108, lov: 100, cha: 100 }, sk: "bluefire", up: ["int", "wil"] },
  akamugi:  { nm: "アカムギ蛇の心", col: "白", mul: { str: 98, vit: 94, dex: 108, agi: 110, int: 98, wil: 96, lov: 100, cha: 100 }, sk: "mugikami", up: ["agi", "dex"] },
  sunamogu: { nm: "スナモグリの心", col: "緑", mul: { str: 112, vit: 112, dex: 90, agi: 86, int: 92, wil: 100, lov: 100, cha: 96 }, sk: "sunakaki", up: ["str", "vit"] },
  saboten:  { nm: "サボテン拳士の心", col: "緑", mul: { str: 108, vit: 108, dex: 106, agi: 94, int: 90, wil: 102, lov: 96, cha: 98 }, sk: "togeken", up: ["str", "vit"] },
  sasori:   { nm: "サソリ武者の心", col: "緑", mul: { str: 110, vit: 106, dex: 104, agi: 96, int: 90, wil: 96, lov: 96, cha: 100 }, sk: "hasami", up: ["str", "dex"] },
  sekkan:   { nm: "石棺ヤドカリの心", col: "白", mul: { str: 104, vit: 116, dex: 96, agi: 86, int: 94, wil: 104, lov: 100, cha: 100 }, sk: "lidpinch", up: ["vit", "wil"] },
  shishi:   { nm: "石獅子の心", col: "青", mul: { str: 112, vit: 114, dex: 100, agi: 98, int: 96, wil: 110, lov: 100, cha: 104 }, sk: "lionclaw", up: ["str", "vit"], ps: "standfast" },
  ookami:   { nm: "モリオオカミの心", col: "白", mul: { str: 106, vit: 96, dex: 100, agi: 110, int: 92, wil: 96, lov: 100, cha: 100 }, sk: "wolfbite", up: ["agi", "str"] },
  nushi:    { nm: "ヌシガエルの心", col: "緑", mul: { str: 106, vit: 114, dex: 92, agi: 86, int: 102, wil: 112, lov: 105, cha: 102 }, sk: "bigyawn", up: ["vit", "wil"] },
  kokemusha:{ nm: "コケ武者の心", col: "緑", mul: { str: 114, vit: 110, dex: 100, agi: 90, int: 88, wil: 100, lov: 95, cha: 98 }, sk: "mosscut", up: ["str", "vit"] },
  koma:     { nm: "祠守りの狛の心", col: "緑", mul: { str: 108, vit: 116, dex: 96, agi: 96, int: 90, wil: 110, lov: 100, cha: 95 }, sk: "stonefang", up: ["vit", "str"] },
  sennen:   { nm: "千年ダケの心", col: "緑", mul: { str: 84, vit: 104, dex: 96, agi: 92, int: 116, wil: 112, lov: 108, cha: 104 }, sk: "glowspore", up: ["int", "wil"] },
  midorinushi:{ nm: "苔竜ミドリヌシの心", col: "青", mul: { str: 112, vit: 118, dex: 96, agi: 90, int: 112, wil: 114, lov: 104, cha: 106 }, sk: "mossbreath", up: ["vit", "int"] },
};

// ---------- 仲間（物語の順。0＝主人公） ----------
// st＝始めの能力値、cap＝本人の上限、up＝上がりやすい能力値、hpCap＝HPの上限、rare＝レア度
const HEROES = [
  { id: "kai", nm: "カイ", img: "person_108", wt: "spear", rare: "S", hp: 230, hpCap: 1250, lp: 9, st: { str: 24, vit: 24, dex: 14, agi: 15, int: 9, wil: 16, lov: 12, cha: 14 },
    cap: { str: 122, vit: 128, dex: 90, agi: 94, int: 64, wil: 106, lov: 88, cha: 98 }, up: ["vit", "str"],
    res: {}, sk: ["oarhit", "waterwheel", "rapidsplit"], ps: ["ironwall", "spearway", "standfast"], gear: { weapon: "oar", armor: "tunic", sub: null, acc: null } },
  { id: "lise", nm: "リゼット", img: "person_002", wt: "rapier", rare: "S", hp: 165, hpCap: 1000, lp: 7, st: { str: 12, vit: 13, dex: 25, agi: 22, int: 18, wil: 17, lov: 22, cha: 22 },
    cap: { str: 76, vit: 86, dex: 124, agi: 116, int: 110, wil: 104, lov: 120, cha: 128 }, up: ["dex", "cha"],
    res: {}, sk: ["vitalstab", "medicine", "doublestab"], ps: ["rapierway", "healer", "momentum"], gear: { weapon: "thinblade", armor: "cloak", sub: null, acc: null } },
  { id: "muku", nm: "ムク", img: "person_058", wt: "fist", rare: "A", hp: 185, hpCap: 1080, lp: 8, st: { str: 22, vit: 17, dex: 15, agi: 24, int: 7, wil: 10, lov: 14, cha: 12 },
    cap: { str: 124, vit: 104, dex: 92, agi: 126, int: 54, wil: 76, lov: 90, cha: 84 }, up: ["str", "agi"],
    res: {}, sk: ["headbutt", "flurry", "uppercut"], ps: ["fistway", "spirit", "counter"], gear: { weapon: "wraps", armor: "tunic", sub: null, acc: null } },
  { id: "bram", nm: "ブラム", img: "person_005", wt: "great", rare: "S", hp: 300, hpCap: 1300, lp: 10, st: { str: 31, vit: 29, dex: 16, agi: 12, int: 8, wil: 22, lov: 14, cha: 14 },
    cap: { str: 130, vit: 124, dex: 92, agi: 78, int: 60, wil: 112, lov: 84, cha: 90 }, up: ["str", "vit"],
    res: {}, sk: ["kabuto", "onagi", "sutemi"], ps: ["greatway", "charge", "counter"], gear: { weapon: "scoutgreat", armor: "leather", sub: null, acc: null } },
  // ---- 集める仲間（西境地方の8人。col＝集める仲間。加わり方は story.js の JOIN） ----
  { id: "teo", nm: "テオ", img: "person_001", wt: "sword", rare: "A", col: 1, hp: 215, hpCap: 1000, lp: 8, st: { str: 25, vit: 20, dex: 17, agi: 19, int: 8, wil: 14, lov: 14, cha: 18 },
    cap: { str: 120, vit: 104, dex: 96, agi: 104, int: 56, wil: 88, lov: 86, cha: 100 }, up: ["str", "agi"],
    res: {}, sk: ["gale", "twin", "holycut"], ps: ["swordway", "charge", "momentum"], gear: { weapon: "ironsword", armor: "tunic", sub: null, acc: null } },
  { id: "rinka", nm: "リンカ", img: "person_004", wt: "fist", rare: "A", col: 1, hp: 205, hpCap: 1000, lp: 8, st: { str: 26, vit: 18, dex: 16, agi: 25, int: 8, wil: 15, lov: 13, cha: 14 },
    cap: { str: 122, vit: 98, dex: 92, agi: 124, int: 54, wil: 92, lov: 82, cha: 86 }, up: ["str", "agi"],
    res: {}, sk: ["r_shotei", "r_senpu", "r_hyaku"], ps: ["fistway", "counter", "spirit"], gear: { weapon: "wraps", armor: "tunic", sub: null, acc: null } },
  { id: "toraji", nm: "トラジ", img: "person_009", wt: "spear", rare: "A", col: 1, hp: 220, hpCap: 1000, lp: 8, st: { str: 25, vit: 21, dex: 20, agi: 20, int: 9, wil: 13, lov: 12, cha: 13 },
    cap: { str: 120, vit: 106, dex: 104, agi: 104, int: 58, wil: 84, lov: 80, cha: 84 }, up: ["str", "dex"],
    res: {}, sk: ["thrust", "pierce", "t_neko"], ps: ["spearway", "momentum", "charge"], gear: { weapon: "ironspear", armor: "leather", sub: null, acc: null } },
  { id: "seri", nm: "セリ", img: "person_017", wt: "bow", rare: "A", col: 1, hp: 190, hpCap: 1000, lp: 7, st: { str: 16, vit: 16, dex: 27, agi: 23, int: 12, wil: 15, lov: 18, cha: 14 },
    cap: { str: 86, vit: 90, dex: 126, agi: 116, int: 74, wil: 92, lov: 100, cha: 86 }, up: ["dex", "agi"],
    res: {}, sk: ["aim", "s_kage", "shower"], ps: ["bowway", "momentum", "spirit"], gear: { weapon: "shortbow", armor: "cloak", sub: null, acc: null } },
  { id: "poruka", nm: "ポルカ", img: "person_029", wt: "club", rare: "A", col: 1, hp: 185, hpCap: 1000, lp: 7, st: { str: 18, vit: 17, dex: 15, agi: 16, int: 24, wil: 22, lov: 20, cha: 18 },
    cap: { str: 92, vit: 92, dex: 88, agi: 92, int: 118, wil: 112, lov: 108, cha: 100 }, up: ["int", "wil"],
    res: {}, sk: ["p_kado", "p_yomi", "p_atsu"], ps: ["clubway", "focus", "healer"], gear: { weapon: "heavybook", armor: "cloak", sub: null, acc: null } },
  { id: "komari", nm: "コマリ", img: "person_046", wt: "rapier", rare: "A", col: 1, hp: 180, hpCap: 1000, lp: 7, st: { str: 15, vit: 15, dex: 24, agi: 27, int: 14, wil: 14, lov: 16, cha: 20 },
    cap: { str: 82, vit: 86, dex: 118, agi: 126, int: 84, wil: 86, lov: 96, cha: 110 }, up: ["agi", "dex"],
    res: {}, sk: ["k_doku", "k_kemuri", "k_kusune"], ps: ["rapierway", "momentum", "spirit"], gear: { weapon: "thinblade", armor: "tunic", sub: null, acc: null } },
  { id: "nat", nm: "ナット", img: "person_094", wt: "club", rare: "A", col: 1, hp: 205, hpCap: 1000, lp: 8, st: { str: 22, vit: 21, dex: 22, agi: 16, int: 16, wil: 17, lov: 19, cha: 15 },
    cap: { str: 108, vit: 108, dex: 110, agi: 92, int: 86, wil: 96, lov: 102, cha: 88 }, up: ["dex", "vit"],
    res: {}, sk: ["n_spanner", "n_shime", "n_haguru"], ps: ["clubway", "healer", "spirit"], gear: { weapon: "spanner", armor: "leather", sub: null, acc: null } },
  { id: "karin", nm: "カリン", img: "person_105", wt: "staff", rare: "A", col: 1, hp: 175, hpCap: 1000, lp: 7, st: { str: 11, vit: 15, dex: 14, agi: 17, int: 22, wil: 21, lov: 27, cha: 20 },
    cap: { str: 70, vit: 88, dex: 86, agi: 98, int: 112, wil: 114, lov: 126, cha: 106 }, up: ["lov", "int"],
    res: {}, sk: ["c_suzu", "c_genki", "c_kane"], ps: ["healer", "focus", "sunway"], gear: { weapon: "bellstaff", armor: "cloak", sub: null, acc: null } },
  // ---- 寄り道で加わる仲間（side＝寄り道。加わり方は story.js） ----
  { id: "hanna", nm: "ハンナ", img: "person_020", wt: "axe", rare: "A", side: 1, hp: 240, hpCap: 1150, lp: 9, st: { str: 28, vit: 23, dex: 13, agi: 16, int: 7, wil: 14, lov: 15, cha: 17 },
    cap: { str: 126, vit: 116, dex: 84, agi: 92, int: 52, wil: 88, lov: 92, cha: 98 }, up: ["str", "vit"],
    res: {}, sk: ["h_maki", "h_maruta", "h_taiboku"], ps: ["axeway", "charge", "spirit"], gear: { weapon: "woodaxe", armor: "tunic", sub: null, acc: null } },
  { id: "garm", nm: "ガルム", img: "person_132", wt: "club", rare: "A", side: 1, hp: 300, hpCap: 1400, lp: 12, st: { str: 27, vit: 31, dex: 8, agi: 8, int: 5, wil: 21, lov: 14, cha: 12 },
    cap: { str: 122, vit: 132, dex: 60, agi: 58, int: 40, wil: 104, lov: 86, cha: 80 }, up: ["vit", "str"],
    res: { 斬: 15, 打: 10, 突: 15 }, sk: ["g_ranpan", "g_jinarashi", "g_hashi"], ps: ["clubway", "ironwall", "standfast"], gear: { weapon: "ranpan", armor: null, sub: null, acc: null } },
  // ---- 物語の仲間（5人目。第2章の終わりの葬列で加わる） ----
  { id: "jako", nm: "ジャコ", img: "person_133", wt: "bow", rare: "S", hp: 250, hpCap: 1050, lp: 8, st: { str: 17, vit: 18, dex: 30, agi: 28, int: 14, wil: 14, lov: 15, cha: 26 },
    cap: { str: 84, vit: 92, dex: 126, agi: 122, int: 80, wil: 82, lov: 92, cha: 124 }, up: ["dex", "agi"],
    res: {}, sk: ["j_sai", "j_naki", "j_miyage"], ps: ["bowway", "quickdraw", "momentum"], gear: { weapon: "saibow", armor: "cloak", sub: null, acc: null } },
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
  kawauso:  { mat: "kegawa", nm: "カワウソ盗", img: "monster_131", wt: "fang", pow: 6, hp: 80, st: { str: 14, vit: 10, dex: 16, agi: 18, int: 5, wil: 8, lov: 0, cha: 8 }, res: { 斬: -20 }, gold: 5 },
  koromochi:{ mat: "mochi", nm: "コロモチ", img: "m_koromochi", wt: "club", pow: 10, hp: 80, st: { str: 29, vit: 14, dex: 8, agi: 9, int: 6, wil: 14, lov: 0, cha: 6 }, res: { 打: 40, 熱: -40, 雷: -30 }, every: { n: 3, sk: "mochislam" }, gold: 6, heart: "koromochi" },
  mizugumo: { mat: "ito", nm: "ミズグモ", img: "m_mizugumo", wt: "fang", pow: 11, hp: 90, st: { str: 31, vit: 11, dex: 16, agi: 22, int: 12, wil: 9, lov: 0, cha: 10 }, res: { 冷: 40, 熱: -40, 打: -20 }, every: { n: 2, sk: "waterthread" }, gold: 9, heart: "mizugumo" },
  donguri:  { mat: "donguri", nm: "ドングリ兵", img: "monster_130", wt: "spear", pow: 11, hp: 90, st: { str: 30, vit: 14, dex: 14, agi: 12, int: 5, wil: 10, lov: 0, cha: 8 }, res: { 熱: -50, 打: 20, 斬: -20 }, every: { n: 3, sk: "acornshot" }, gold: 8, heart: "donguri" },
  // 親蜘蛛：カイ1人で戦う山場。子を呼ぶ。親を倒せば、子は逃げる
  oyamizugumo:{ mat: "ito", nm: "オヤミズグモ", img: "monster_134", wt: "fang", pow: 16, hp: 315, boss: 1, st: { str: 40, vit: 13, dex: 16, agi: 14, int: 14, wil: 12, lov: 0, cha: 14 },
              res: { 冷: 40, 熱: -40, 打: -20 }, plan: { 2: "callkids", 4: "silkbind", 5: "callkids" }, every: { n: 4, sk: "callkids" }, every2: { n: 3, sk: "silkbind" }, stunRes: 1, gold: 45 },
  komizu:   { nm: "子グモ", img: "m_mizugumo", wt: "fang", pow: 9, hp: 55, st: { str: 26, vit: 9, dex: 14, agi: 20, int: 8, wil: 7, lov: 0, cha: 8 }, res: { 冷: 40, 熱: -40, 打: -20 }, gold: 3 },
  moriookami:{ mat: "kiba", nm: "モリオオカミ", img: "m_ookami", wt: "fang", pow: 11, hp: 110, st: { str: 32, vit: 12, dex: 14, agi: 24, int: 5, wil: 8, lov: 0, cha: 10 }, res: { 熱: -30, 突: -20, 冷: 20 }, every: { n: 3, sk: "wolfbite" }, gold: 11, heart: "ookami" },
  // 西街道
  hanenezumi:{ mat: "hane", nm: "ハネネズミ", img: "monster_132", wt: "fang", pow: 9, hp: 70, st: { str: 26, vit: 9, dex: 18, agi: 27, int: 8, wil: 9, lov: 0, cha: 10 }, res: { 突: -30, 雷: -30, 打: 20 }, every: { n: 3, sk: "wingslap" }, gold: 8, heart: "hanenezumi" },
  kakashi:  { mat: "tetsu", nm: "カカシ番", img: "monster_088", wt: "claw", pow: 11, hp: 130, st: { str: 31, vit: 15, dex: 12, agi: 9, int: 5, wil: 12, lov: 0, cha: 9 }, res: { 熱: -60, 斬: -20, 突: 30, 打: 20 }, every: { n: 3, sk: "sickle" }, gold: 12, heart: "kakashi" },
  // 中央平原（強さ2〜3）
  mugiwara: { mat: "mugi", nm: "ムギワラ坊", img: "monster_136", wt: "club", pow: 10, hp: 105, st: { str: 30, vit: 15, dex: 15, agi: 14, int: 6, wil: 10, lov: 0, cha: 10 }, res: { 熱: -50, 斬: -20, 打: 10 }, every: { n: 3, sk: "strawroll" }, gold: 12, heart: "mugiwara" },
  kamausagi:{ mat: "usage", nm: "カマウサギ", img: "monster_003", wt: "claw", pow: 10, hp: 85, st: { str: 30, vit: 11, dex: 18, agi: 26, int: 6, wil: 9, lov: 0, cha: 10 }, res: { 突: -30, 冷: 20 }, every: { n: 2, sk: "sickleear" }, gold: 11, heart: "kamausagi" },
  fusha:    { mat: "hane", nm: "フウシャ虫", img: "monster_082", wt: "fang", pow: 9, hp: 80, st: { str: 27, vit: 10, dex: 22, agi: 24, int: 8, wil: 10, lov: 0, cha: 10 }, res: { 熱: -40, 雷: -30, 打: -20, 斬: 10 }, every: { n: 3, sk: "windsting" }, gold: 12, heart: "fusha" },
  doro:     { mat: "doro", nm: "ドロ人形", img: "monster_031", wt: "fist", pow: 12, hp: 170, st: { str: 32, vit: 20, dex: 10, agi: 8, int: 6, wil: 14, lov: 0, cha: 9 }, res: { 打: 30, 斬: 10, 冷: -30, 雷: -30 }, every: { n: 3, sk: "mudslap" }, gold: 16, heart: "doro" },
  // 王家の地下墓所（強さ3）
  hakamori: { mat: "karasu", nm: "ハカモリ鴉", img: "monster_037", wt: "fang", pow: 10, hp: 85, st: { str: 30, vit: 11, dex: 22, agi: 28, int: 10, wil: 10, lov: 0, cha: 10 }, res: { 突: -30, 雷: -30, 陰: 30 }, every: { n: 2, sk: "gravepeck" }, gold: 13, heart: "hakamori" },
  honeban:  { mat: "hone", nm: "ホネ番兵", img: "monster_035", wt: "sword", pow: 12, hp: 160, st: { str: 34, vit: 18, dex: 18, agi: 12, int: 6, wil: 12, lov: 0, cha: 10 }, res: { 突: 40, 斬: 20, 打: -30, 陽: -60, 陰: 50 }, every: { n: 3, sk: "oldblade2" }, gold: 15, heart: "honeban" },
  rousoku:  { mat: "rou", nm: "ロウソク霊", img: "monster_007", wt: "fang", pow: 9, hp: 75, st: { str: 20, vit: 10, dex: 14, agi: 20, int: 26, wil: 18, lov: 0, cha: 12 }, mag: 11, res: { 斬: 30, 突: 30, 冷: -60, 熱: 60, 陽: -30 }, every: { n: 2, sk: "bluefire" }, gold: 14, heart: "rousoku" },
  akamugi:  { mat: "akauroko", nm: "アカムギ蛇", img: "m_akamugi", wt: "fang", pow: 11, hp: 120, st: { str: 31, vit: 13, dex: 20, agi: 24, int: 7, wil: 10, lov: 0, cha: 10 }, res: { 斬: -20, 冷: -40, 熱: 20 }, every: { n: 2, sk: "mugikami" }, gold: 15, heart: "akamugi" },
  sunamogu: { mat: "tsume", nm: "スナモグリ", img: "m_sunamogu", fsc: 0.3, wt: "claw", pow: 13, hp: 260, st: { str: 36, vit: 24, dex: 12, agi: 9, int: 6, wil: 14, lov: 0, cha: 8 }, res: { 打: 20, 斬: 10, 冷: -40, 雷: -30 }, every: { n: 3, sk: "sunakaki" }, gold: 24, heart: "sunamogu" },
  saboten:  { mat: "sabotane", nm: "サボテン拳士", img: "monster_142", wt: "fist", pow: 13, hp: 210, st: { str: 34, vit: 24, dex: 18, agi: 12, int: 6, wil: 14, lov: 0, cha: 10 }, res: { 突: 20, 冷: 20, 熱: -40, 斬: -20 }, every: { n: 2, sk: "togeken" }, gold: 22, heart: "saboten" },
  sasori:   { mat: "kokaku", nm: "サソリ武者", img: "monster_046", wt: "axe", pow: 13, hp: 190, st: { str: 35, vit: 22, dex: 20, agi: 16, int: 6, wil: 12, lov: 0, cha: 10 }, res: { 斬: 30, 突: 10, 打: -20, 冷: -30 }, every: { n: 2, sk: "hasami" }, gold: 22, heart: "sasori" },
  sekkan:   { mat: "sekkan", nm: "石棺ヤドカリ", img: "m_sekkan", wt: "claw", pow: 11, hp: 175, st: { str: 31, vit: 26, dex: 12, agi: 8, int: 6, wil: 16, lov: 0, cha: 9 }, res: { 斬: 40, 突: 30, 打: -30, 雷: -40 }, every: { n: 3, sk: "lidpinch" }, gold: 16, heart: "sekkan" },
  // 双頭の石獅子：一つの体の絵に、二つの頭（twin）。頭ごとに狙えて、別々に動く。片方が倒れると、残った頭は荒れる（lone）
  shishiL:  { mat: "sekkan", book: "book1", nm: "石獅子・右の頭", img: "monster_139", twin: "A", wt: "claw", pow: 12, hp: 400, boss: 1, st: { str: 28, vit: 22, dex: 16, agi: 14, int: 10, wil: 18, lov: 0, cha: 14 },
              res: { 斬: 30, 突: 20, 打: -20, 雷: -30 }, plan: { 3: "lionroar" }, every: { n: 2, sk: "lionclaw" }, lone: "lionroar", stunRes: 1, gold: 60 },
  shishiR:  { mat: "hone", nm: "石獅子・左の頭", img: "monster_139", twin: "B", wt: "fang", pow: 12, hp: 400, boss: 1, mag: 12, st: { str: 27, vit: 22, dex: 16, agi: 16, int: 22, wil: 18, lov: 0, cha: 14 },
              res: { 斬: 30, 突: 20, 打: -20, 冷: -30 }, plan: { 2: "lionbreath", 5: "lionbreath" }, every: { n: 3, sk: "lionfang" }, lone: "lionfang", stunRes: 1, gold: 60 },
  // 一本杉の拳法娘（腕試し）
  rinka:    { nm: "リンカ", img: "person_004", person: 1, human: 1, wt: "fist", pow: 11, hp: 680, boss: 1, st: { str: 33, vit: 20, dex: 18, agi: 30, int: 8, wil: 16, lov: 0, cha: 16 },
              res: {}, plan: { 2: "r_senpu", 4: "r_hyaku", 6: "r_senpu" }, every: { n: 2, sk: "r_shotei" }, rageFrom: 8, rage: "r_hyaku", gold: 0 },
  // 黒外套の隊長（人間。心は落とさない）
  sig:      { nm: "シグ", img: "person_146", person: 1, psc: 1.5, human: 1, wt: "spear", pow: 13, hp: 520, boss: 1, st: { str: 37, vit: 20, dex: 20, agi: 24, int: 8, wil: 20, lov: 0, cha: 18 },
              res: {}, plan: { 2: "pierce", 4: "sig_sandan", 6: "pierce" }, every: { n: 2, sk: "vitalstab" }, rageFrom: 8, rage: "sig_sandan", stunRes: 1, gold: 0 },
  // 古い見張り塔
  ishikoro: { mat: "koishi", nm: "イシコロ小僧", img: "monster_133", wt: "club", pow: 10, hp: 85, st: { str: 29, vit: 18, dex: 16, agi: 13, int: 6, wil: 10, lov: 0, cha: 10 }, res: { 打: 20, 突: 30, 斬: 20, 冷: -30, 雷: -20 }, every: { n: 2, sk: "pebble" }, gold: 11, heart: "ishikoro" },
  tsutayoroi:{ mat: "tsuta", nm: "ツタ鎧", img: "monster_005", wt: "sword", pow: 12, hp: 150, st: { str: 31, vit: 20, dex: 13, agi: 10, int: 8, wil: 14, lov: 0, cha: 10 }, res: { 熱: -50, 斬: -20, 突: 20, 打: 20, 冷: 20 }, every: { n: 3, sk: "vinewhip" }, gold: 15, heart: "tsutayoroi" },
  // 石橋のガルム：3人で勝てる強さ。倒れる前に「参った」と言うので、心は落ちない
  garm:     { mat: "koishi", book: "book1", nm: "石橋のガルム", img: "person_132", person: 1, psc: 1.6, wt: "fist", pow: 12, hp: 650, boss: 1, st: { str: 33, vit: 20, dex: 14, agi: 8, int: 8, wil: 18, lov: 0, cha: 16 },
              res: { 斬: 30, 突: 10, 打: -10, 冷: -30, 雷: -20, 熱: 20 }, plan: { 2: "stonethrow", 4: "bridgequake", 6: "stonethrow", 7: "bridgequake" }, every: { n: 2, sk: "stonethrow" }, rageFrom: 10, rage: "bridgequake", stunRes: 1, gold: 120 },
  nushi:    { mat: "kai", book: "book1", nm: "ヌシガエル", img: "monster_135", wt: "fist", pow: 14, hp: 1130, boss: 1, st: { str: 42, vit: 22, dex: 10, agi: 10, int: 18, wil: 18, lov: 0, cha: 22 },
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
  const heart = h.heart && heartOf(h.heart), st = {}, res = { ...h.res }, ps = [...h.ps];
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
  const st = { seed: seed || 1, turn: 0, actions: 0, queue: [], log: [], over: null, phase: "command", cmd: {}, focus: null, wave: W, lastCmd: {}, items: { ...(W.items || {}) } };
  const F = FORMATIONS[lo.form];
  const SOLO = { c: 0, r: 2, b: {}, h: 1 };
  const lineup = W.solo != null ? [[W.solo, SOLO]] : (W.fixed || lo.pos).slice(0, 5).map((hi, slot) => [hi, F.slots[slot]]);
  st.party = lineup.filter(([hi]) => hi != null).map(([hi, sl], i) => {
    const h = resolveHero(hi, roster && roster[hi]), s = heroStats(h, sl);
    const u = base({ ...h, ...s, side: 0, slot: i, c: sl.c, r: sl.r, hate: sl.h, max: h.hp, hp: Math.max(1, Math.round(h.hp * ((W.hp0 || {})[hi] || 1))), lp: h.lpNow, bp: BP0 }); // hp0＝傷を負ったまま始まる人（HPの割合）
    if (u.lp <= 0) { u.down = true; u.hp = 0; } // LPが尽きた人は戦えない（宿で戻る）
    return u;
  });
  st.foes = W.foes.map((f, i) => {
    const M = FOES[f.k], fst = {};
    for (const k of STATS) fst[k] = Math.round(M.st[k] * m);
    if (W.atk) fst.str = Math.round(fst.str * W.atk); // 物語の戦いで、相手が張り切っているとき（腕力だけ上げる）
    const hp = Math.round(M.hp * Math.pow(m, 2.2)), pow = Math.round(M.pow * m); // 体力は能力値より速く増える（こちらの攻撃も、能力×武器×技で掛け算に伸びるため）
    const u = base({ ...M, pow, mag: Math.round((M.mag || 6) * m), st: fst, key: f.k, id: "f" + i, side: 1, slot: i, c: f.big ? -1 : f.c, r: f.big ? -1 : f.r, big: !!f.big, max: hp, hp, lp: 1, hate: 1, sk: [], ps: [], bp: 0 });
    if (f.wait) { u.down = true; u.hp = 0; u.wait = true; } // まだ出てきていない（呼ばれると出てくる）
    return u;
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
// 全力AUTOが食べ物を食べるのは、立っているのが自分1人で、HPが4割を切ったときだけ（仲間がいるときは、食べ物を勝手に減らさない）
// コマンドを選び終えたら動き出す。auto＝"normal"/"full"なら自動で選ぶ。support＝補助・防御・回復の技もオートで使うか
function commit(st, auto, support) {
  for (const u of alive(st.party)) if (auto || !st.cmd[u.id]) st.cmd[u.id] = (auto === "full" && u.hp < u.max * 0.4 && alive(st.party).length === 1 && foodLeft(st, u)) || keyOf(autoChoose(st, u, auto || "normal", support));
  st.lastCmd = { ...st.cmd };
  st.queue = alive(all(st)).map(u => ({ u, s: u.st.agi * (0.9 + rnd(st) * 0.2) })).sort((a, b) => b.s - a.s).map(x => x.u);
  st.phase = "run";
}

// 食べ物：いま選べるもの（ほかの人がこのターンに選んだぶんは引く）。無ければ null。選ぶときの名前は "item:名前"
function foodLeft(st, u) {
  for (const k of FOODS) {
    const used = Object.entries(st.cmd).filter(([id, c]) => id !== u.id && c === "item:" + k).length;
    if ((st.items[k] || 0) - used > 0) return "item:" + k;
  }
  return null;
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
  if ((hasP(a, "swordway") || hasP(a, "greatway") || hasP(a, "axeway")) && at.includes("斬")) v *= 1.1;
  if ((hasP(a, "bowway") || hasP(a, "spearway") || hasP(a, "rapierway")) && at.includes("突")) v *= 1.1;
  if ((hasP(a, "clubway") || hasP(a, "fistway")) && at.includes("打")) v *= 1.1;
  if (hasP(a, "heatway") && at.includes("熱")) v *= 1.15;
  if (hasP(a, "sunway") && at.includes("陽")) v *= 1.15;
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
  let s = SKILLS.attack;
  if (u.plan && u.plan[st.turn]) s = SKILLS[u.plan[st.turn]];
  else if (u.rageFrom && st.turn >= u.rageFrom) s = SKILLS[u.rage];
  else if (u.every && st.turn % u.every.n === 0) s = SKILLS[u.every.sk];
  else if (u.every2 && st.turn % u.every2.n === 0) s = SKILLS[u.every2.sk];
  if (u.lone && !st.foes.some(f => f !== u && f.boss && !f.down)) s = SKILLS[u.lone]; // 相方が倒れたら、残った方は荒れる
  if (s.tg === "summon" && !st.foes.some(f => f.down && f !== u && !f.boss)) s = SKILLS.attack; // 呼べる子がいなければ、ふつうに攻める
  return s;
}

function act(st, u) {
  let s;
  const c = u.side === 0 ? st.cmd[u.id] || "" : "";
  if (c.startsWith("item:")) { // 食べ物を食べる（無くなっていたら、ふつうに攻める）
    const k = c.slice(5), T = TOOLS[k];
    if (T && st.items[k] > 0) {
      st.items[k]--; st.actions++;
      const h = Math.min(u.max - u.hp, Math.round(u.max * T.food)); u.hp += h; u.healed += h;
      log(st, { t: "item", u: u.id, k, nm: T.nm }); log(st, { t: "heal", d: u.id, v: h });
      return;
    }
  }
  if (u.side === 1) s = foeChoose(st, u);
  else { s = SKILLS[c] || SKILLS.attack; if (cost(u, s) > u.bp) s = SKILLS.attack; }
  if (u.side === 0) { u.bp -= cost(u, s); if (s !== SKILLS.attack) (u.used = u.used || {})[keyOf(s)] = 1; }
  st.actions++;
  log(st, { t: "act", u: u.id, skill: keyOf(s), nm: s.nm, sk: s !== SKILLS.attack, magic: !!s.magic, kind: s.kind });
  if (s.tg === "self") { if (s.cover) { u.cover = s.cover; log(st, { t: "status", d: u.id, nm: "かばう構え" }); } }
  else if (s.tg === "summon") { // 倒れている・まだ出ていない子を1体、呼び出す
    const k = st.foes.find(f => f.down && f !== u && !f.boss);
    if (k) { k.down = false; k.wait = false; k.hp = k.max; k.poison = 0; k.stun = 0; log(st, { t: "summon", d: k.id }); }
  }
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
  const hd = st.wave.head != null ? st.foes[st.wave.head] : null;
  if (hd && hd.down && !st.over) { for (const f of alive(st.foes)) { f.down = true; f.fled = true; log(st, { t: "flee", d: f.id }); } }
  if (!alive(st.foes).length) st.over = "win"; else if (!alive(st.party).length) st.over = "lose";
}

// ---------- 戦いのあと ----------
// 成長：勝った戦いに出ていた人だけ。上がる先は「場所の上限」と「本人の上限」の低いほう。上限から遠いほど上がりやすい
function grow(hi, mem, tier, rng) {
  const def = HEROES[hi], A = capOf(tier), heart = mem.heart && heartOf(mem.heart), out = [];
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
// 心のレア度：同じ魔物の心でも、落ちるたびに 白〜虹 のどれか。同じ魔物の同じレア度なら、どこで拾っても同じ性能
//  id は「魔物の名前@レア度」（白は名前だけ）。レア度が1つ上がるごとに、能力の倍率がすべて上がる
//  上がり方は本家（ロマサガRS）のスタイル補正を参考に：虹では得意な能力が200%近く、苦手な能力は120%前後。白は種ごとの85〜115%のまま
//  倍率＝白の倍率＋（レア度の上乗せ）×（その能力の得意さ）。得意さ＝白で100%より高いほど大きい（0.3〜1.2）
const HEART_RANKS = ["白", "緑", "青", "紫", "金", "虹"], HEART_ADD = { 白: 0, 緑: 12, 青: 25, 紫: 40, 金: 60, 虹: 85 };   // よく出る緑・青は控えめに、めったに出ない金・虹ははっきり強く
const HEART_ODDS = [62, 25, 9, 3, 0.9, 0.1]; // 落ちたときのレア度の出やすさ（％）
function heartOf(id) {
  if (!id) return null;
  const [k, r] = String(id).split("@"), base = HEARTS[k]; if (!base) return null;
  const rank = r || "白", add = HEART_ADD[rank] || 0, mul = {};
  for (const s of STATS) { const w = Math.max(0.3, Math.min(1.2, 0.5 + (base.mul[s] - 100) / 20)); mul[s] = Math.round(base.mul[s] + add * w); }
  return { ...base, key: k, rank, mul };
}
function rollHeart(k, rng, boss) {
  let x = rng() * 100, i = 0; for (; i < HEART_ODDS.length - 1; i++) { if ((x -= HEART_ODDS[i]) < 0) break; }
  if (boss) i = Math.min(HEART_RANKS.length - 1, i + 1); // ボスの心は1つ上から
  return i ? `${k}@${HEART_RANKS[i]}` : k;
}
// ごほうび：お金と、魔物の心・武器防具の落とし物
function rewards(st, rng) {
  const out = { gold: 0, hearts: [], items: [], mats: [], tools: [] }, tier = st.wave.tier || 1;
  for (const f of st.foes) {
    if (f.wait || f.fled) continue; // 出てこなかった者・逃げた者のぶんは無い
    out.gold += Math.round((f.gold || 0) * Math.pow(1.3, tier - 1) * (0.8 + rng() * 0.4)); // お金は強さ1つごとに1.3倍
    if (f.heart && !st.wave.noHeart && rng() < (f.boss ? 1 : 0.07)) out.hearts.push(rollHeart(f.heart, rng, f.boss));
    if (f.mat && rng() < (f.boss ? 1 : 0.4)) out.mats.push(f.mat);
    if (f.book && f.boss) out.tools.push(f.book);
  }
  const drops = st.wave.drops || [];
  for (const d of drops) if (rng() < d.p) out.items.push(rollItem(d.id, rng));
  return out;
}

const api = { BP0, BP_TURN, BP_MAX, ATTR, RANK, STATS, ST_NM, RANGE_NM, WTYPE, SKILLS, PASSIVES, GEAR, HEARTS, HEROES, START, FORMATIONS, FOES, WAVES, HEART_RANKS, heart: heartOf,
  BONUS, AREA_CAP, MATS, TOOLS, FOODS, foodLeft, cost, awMax, rankMul, fxText, rankUp, defLo, resolveHero, heroStats, newBattle, commit, step, alive, resMul, grow, rollItem, rewards };
if (typeof module !== "undefined") module.exports = api; else root.BT = api;
})(this);
