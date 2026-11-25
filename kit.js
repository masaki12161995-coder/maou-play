// ===== 完全オートバトル：13人のスキル =====
// 1人が覚えるのは 通常3・アクティブ3・パッシブ6。装備は 通常1・アクティブ1・パッシブ2。
// どのスキルも★1〜★5。★2と★4で数字が伸び、★3で「状態」などが足され、★5で「連鎖」が起きる。
// 数字の [a,b] は ★1でa、★5でb（あいだは等分）。
const LV_N=[1,18,38], LV_A=[1,12,30], LV_P=[8,14,22,30,40,50], SLOT_LV=[8,14];
const BOOKS=['book1','book2','book3','book4']; // 万能の書（どの種類にも使える）。★2・★3・★4・★5にする
// 技の書は3種類：通常（型）・アクティブ（奥義）・パッシブ（心得）。それぞれ初・中・上・極
const BOOKK={N:['bN1','bN2','bN3','bN4'],A:['bA1','bA2','bA3','bA4'],P:['bP1','bP2','bP3','bP4']};
function isBook(k){ return /^(book|b[NAP])[1-4]$/.test(k); }
// 強化に使う書：その種類の書が先、なければ万能の書。r は今の★
function bookUse(kind,r){ if(r>=5) return null; const a=BOOKK[kind][r-1], w=BOOKS[r-1]; if((G.inv[a]||0)>0) return a; if((G.inv[w]||0)>0) return w; return null; }
// 落ちる書の種類：アクティブは強化の効きが大きいので少なめ
function rollBookKind(){ const x=Math.random(); return x<0.3?'N':x<0.75?'P':'A'; }
function bookOf(tier,kind){ return 'b'+(kind||rollBookKind())+tier; }

const KIT = {
'アルト':{ pow:1.25, role:'攻撃', theme:'とどめを刺して、仲間を乗せる',
 N:[{nm:'斬る', d:'前の敵を斬る（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{xLow:{th:0.3,x:1.5}}, r3d:'HP30%以下の敵に1.5倍', r5:{kG:25}, r5d:'倒すとゲージ+25'},
    {nm:'狙い斬り', d:'HPが一番少ない敵を斬る（{m}）', k:'atk', tgt:'low', m:[0.9,1.3], r3:{dd:40}, r3d:'40%で防御↓', r5:{kAtk:{pct:10,t:2}}, r5d:'倒すと味方全員の攻撃+10%'},
    {nm:'勇気の一太刀', d:'前の敵を斬り（{m}）、味方全員のゲージ+{gAll}', k:'atk', tgt:'front', m:[0.8,1.2], gAll:[4,8], r3:{cr:15}, r3d:'会心率+15%', r5:{cPG:10}, r5d:'会心で味方全員のゲージ+10'}],
 A:[{nm:'青の一閃', d:'HPが一番少ない敵を弱点の属性で斬る（{m}）', k:'atk', tgt:'low', el:'weak', m:[3.0,5.0], tag:'ボス', r3:{xLow:{th:0.5,x:1.3}}, r3d:'HP50%以下の敵に1.3倍', r5:{idef:0.3}, r5d:'防御を30%無視'},
    {nm:'旋風斬', d:'敵全体を斬る（{m}）', k:'atk', tgt:'all', m:[1.6,2.6], tag:'雑魚', r3:{kG:20}, r3d:'倒した数×ゲージ+20', r5:{kRe:0.5}, r5d:'1体でも倒せばもう一度（威力半分）'},
    {nm:'勇者の号令', d:'味方全員の攻撃+{pAtk.pct}%（2ターン）とゲージ+15', k:'support', pAtk:{pct:[20,36],t:2}, pG:15, tag:'配る', r3:{pSpd:2}, r3d:'速度↑も', r5:{pAtk:{pct:36,t:3}, nextCrit:1}, r5d:'3ターンに伸び、次の味方のアクティブが必ず会心'}],
 P:[{id:'follow', nm:'続く剣', d:'味方がアクティブを使った直後、同じ敵に{v%}のダメージで追撃（1ターン1回）', v:[0.8,1.5], tag:'ボス'},
    {id:'rally', nm:'勝ちどき', d:'自分が敵を倒すと、味方全員の攻撃+{v}%（2ターン）とゲージ+{v2}', v:[15,30], v2:[20,40], tag:'雑魚'},
    {id:'killAgain', nm:'とどめの技', d:'敵を倒すと{v}%でもう1回行動（1ターン1回）', v:[40,100], tag:'雑魚'},
    {id:'oath', nm:'勇者の誓い', d:'味方が攻撃を受けるたび「誓い」+1。5つで敵全員に{v%}の光ダメージ＋味方全員の被ダメージ−20%（1ターン）', v:[1.5,2.5], need:5, stack:'誓い'},
    {id:'back', nm:'勇者の背中', d:'攻撃アップ中の味方1人につき、自分の攻撃+{v}%', v:[8,15]},
    {id:'lastStand', nm:'最後の砦', d:'致命傷を1度だけHP1で耐え、直後に敵全員へ{v%}の反撃', v:[2.0,3.0]}] },

'リリィ':{ role:'回復', theme:'治すほど、味方が強くなる',
 N:[{nm:'祈り', d:'HP80%未満の味方がいれば一番減った1人を回復（魔攻×{m}）。いなければ光の攻撃（魔攻×0.8）', k:'pray', m:[0.8,1.2], r3:{cure:1}, r3d:'状態異常も治す', r5:{n:2}, r5d:'2人に届く'},
    {nm:'光の礫', d:'光の魔法（{m}）', k:'atk', tgt:'front', mag:1, el:'light', m:[0.9,1.3], r3:{hLow:30}, r3d:'与えたダメージの30%で一番減った味方を回復', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'守りの祈り', d:'一番HPの低い味方に加護（魔攻×{m}の盾）', k:'shield', tgt:'low', m:[0.6,1.0], r3:{shAtk:10}, r3d:'盾がある間その味方の攻撃+10%', r5:{n:2}, r5d:'2人に'}],
 A:[{nm:'ヒーリア', d:'味方全員を回復（魔攻×{m}）', k:'heal', tgt:'all', m:[1.4,2.2], tag:'回復', r3:{pCut:{pct:20,t:2}}, r3d:'2ターン被ダメージ−20%', r5:{cure:1, pG:15}, r5d:'状態異常を治し、ゲージ+15'},
    {nm:'祈りの光', d:'一番減った1人を大きく回復（魔攻×{m}）＋状態異常を治す', k:'heal', tgt:'low', m:[4.0,6.0], cure:1, tag:'回復', r3:{over:1}, r3d:'あふれた分は加護になる', r5:{toG:50}, r5d:'その味方のゲージ+50'},
    {nm:'女神の加護', d:'味方全員に加護（魔攻×{m}の盾）', k:'shield', tgt:'all', m:[1.0,1.6], tag:'守る', r3:{shAtk:15}, r3d:'盾がある間は攻撃+15%', r5:{shBurst:1}, r5d:'盾が割れると、殴った敵に割れた量の光ダメージ'}],
 P:[{id:'healWind', nm:'癒やしの風', d:'回復した味方のゲージ+{v}', v:[10,20]},
    {id:'bless', nm:'祝福', d:'回復した味方の攻撃+{v}%（2ターン）', v:[15,30]},
    {id:'overflow', nm:'あふれる癒やし', d:'満タンを超えた回復の{v}%が加護（盾）になる', v:[50,100]},
    {id:'judge', nm:'裁きの祈り', d:'回復するたび「祈り」+1。4つで敵全員に魔攻{v%}の光ダメージ', v:[1.6,2.6], need:4, stack:'祈り'},
    {id:'devotion', nm:'献身', d:'味方が攻撃を受けるたび、自分のゲージ+{v}', v:[4,8]},
    {id:'foresight', nm:'先読みの癒やし', d:'ボスが力をためたら、ゲージに関係なく先にアクティブを使う（1戦闘1回）。その回復量は{v}倍', v:[1.2,1.6]}] },

'ノア':{ role:'補助', theme:'眠らせて、時間を配る',
 N:[{nm:'ルミナ', d:'光の魔法（{m}）', k:'atk', tgt:'front', mag:1, el:'light', m:[0.8,1.2], r3:{st:{s:'sleep',c:20}}, r3d:'20%で眠り', r5:{xSt:{st:'sleep',x:2}}, r5d:'眠っている敵に2倍'},
    {nm:'子守唄', d:'弱い魔法（{m}）＋眠り{st.c}%', k:'atk', tgt:'front', mag:1, m:[0.5,0.8], st:{s:'sleep',c:[25,45]}, r3:{sd:1}, r3d:'速度↓', r5:{stG:15}, r5d:'眠らせたらゲージ+15'},
    {nm:'寄り添う手', d:'攻撃せず、ゲージが一番多い味方に+{gTop}', k:'support', gTop:[15,25], r3:{nextPow:15}, r3d:'その味方の次のアクティブ+15%', r5:{gTopN:2}, r5d:'2人に'}],
 A:[{nm:'ひだまりの祈り', d:'倒れた味方を復活（HP{rev}%）。いなければ全員のHPを{pHeal}%回復', k:'revive', rev:[40,70], pHeal:[20,36], tag:'守る', r3:{fullG:1}, r3d:'復活した味方のゲージが満タン', r5:{guardAll:1}, r5d:'全員に1度だけ死なない加護'},
    {nm:'時の揺りかご', d:'味方全員のゲージ+{pG}＋速度↑', k:'support', pG:[20,36], pSpd:2, tag:'配る', r3:{nextPow:20}, r3d:'もらった味方の次のアクティブ+20%', r5:{actTop:1}, r5d:'ゲージが一番多い味方がすぐに動く'},
    {nm:'静かな夜', d:'敵全体を眠らせる（{st.c}%）＋速度↓', k:'atk', tgt:'all', m:0, st:{s:'sleep',c:[40,60]}, sd:1, tag:'雑魚', r3:{deep:2}, r3d:'攻撃2回まで目覚めない', r5:{slG:10}, r5d:'眠った数×味方全員のゲージ+10'}],
 P:[{id:'gift', nm:'時の贈り物', d:'ノアからゲージをもらった味方は、次のアクティブの威力+{v}%', v:[30,60]},
    {id:'refund', nm:'払い戻し', d:'仲間が倒れた次のターン、最初に動いてゲージ+{v}', v:[50,100]},
    {id:'deepSleep', nm:'深い眠り', d:'眠った敵は、攻撃を{v}回受けるまで目覚めない', v:[2,4,'i']},
    {id:'dreamCrit', nm:'夢の隙', d:'眠っている敵への攻撃は、味方全員の会心率+{v}%', v:[30,60]},
    {id:'nightmare', nm:'悪夢', d:'ターンの終わりに眠っている敵1体ごとに「夢」+1。3つで眠っている敵全員に{v%}の闇ダメージ（起こさない）', v:[2.0,3.2], need:3, stack:'夢'},
    {id:'undo', nm:'取り消し', d:'自分が倒れたとき、1度だけHP{v}%で立ち上がる', v:[30,70]}] },

'ミナ':{ pow:1.1, role:'攻撃', theme:'殴るほど気が溜まり、会心で止まらない',
 N:[{nm:'連打', d:'{h}回×{m}。1回ごとにゲージ+12', k:'atk', tgt:'front', m:[0.5,0.7], h:2, gph:12, r3:{kph:1}, r3d:'1回ごとに気+1', r5:{h:3}, r5d:'3回に'},
    {nm:'気合い', d:'前の敵に{m}＋気+{kAdd}', k:'atk', tgt:'front', m:[0.8,1.2], kAdd:2, r3:{scIf:'ki5'}, r3d:'気5以上なら会心率+30%', r5:{kAdd:3}, r5d:'気+3'},
    {nm:'発勁', d:'気を全部使い、前の敵に{m}＋気1つにつき+15%', k:'atk', tgt:'front', m:[0.6,1.0], xKi:0.15, r3:{scIf:'ki8'}, r3d:'気8以上なら必ず会心', r5:{kiBack:0.5}, r5d:'使った気の半分が戻る'}],
 A:[{nm:'百烈拳', d:'前の敵に{h}回×{m}', k:'atk', tgt:'front', m:[0.6,1.0], h:5, tag:'ボス', r3:{kph:1}, r3d:'1発ごとに気+1', r5:{cHit:1}, r5d:'会心のたびに1発追加（最大5）'},
    {nm:'竜巻蹴り', d:'敵全体を蹴る（{m}）', k:'atk', tgt:'all', m:[1.6,2.6], tag:'雑魚', r3:{kpt:1}, r3d:'当てた数だけ気+1', r5:{reKi10:1}, r5d:'気が10ならもう一度'},
    {nm:'覇王拳', d:'前の敵に1発{m}。気1つにつき+10%（気は使い切る）', k:'atk', tgt:'front', m:[3.0,5.0], xKi:0.10, tag:'ボス', r3:{sc:1}, r3d:'必ず会心', r5:{kKi:1}, r5d:'倒すと気が全部戻る'}],
 P:[{id:'kiUp', nm:'気の高まり', d:'攻撃が当たるたび気+1（最大10）。気1つにつき攻撃+{v}%', v:[1.5,3]},
    {id:'chase', nm:'追い打ち', d:'通常攻撃で会心が出たら、{v}%でもう1回殴る（1回の行動で3回まで）', v:[50,100]},
    {id:'shatter', nm:'砕きの拳', d:'眠り・麻痺・凍結・停止の敵への会心率+{v}%', v:[60,100]},
    {id:'kiBurst', nm:'闘気解放', d:'気が10になると、敵全員に{v%}のダメージ。気は0に戻る', v:[2.0,3.2]},
    {id:'counter', nm:'反撃', d:'攻撃を受けると{v}%で100%で殴り返す。気+1', v:[20,45]},
    {id:'desperate', nm:'火事場', d:'HP50%以下で攻撃+{v}%、気の溜まりが2倍', v:[15,30]}] },

'ガルド':{ role:'攻撃', theme:'削れるほど、強くなる',
 N:[{nm:'大振り', d:'前の敵を斬る（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{xSelfLow:{th:0.5,x:1.3}}, r3d:'自分のHP50%以下で1.3倍', r5:{dd:50}, r5d:'50%で防御↓'},
    {nm:'血の刃', d:'自分のHPを8%払い、前の敵に{m}', k:'atk', tgt:'front', m:[1.3,1.8], cost:8, r3:{gSelf:15}, r3d:'ゲージ+15', r5:{costIfAbove:0.3}, r5d:'HP30%以下なら払わない'},
    {nm:'地鳴らし', d:'敵全体に{m}＋{dd}%で防御↓', k:'atk', tgt:'all', m:[0.5,0.8], dd:[20,40], r3:{xSt:{st:'defDown',x:1.3}}, r3d:'防御↓の敵に1.3倍', r5:{gSelf:10}, r5d:'ゲージ+10'}],
 A:[{nm:'修羅斬', d:'闇の一撃（{m}）。自分のHP50%以下で1.3倍', k:'atk', tgt:'high', el:'dark', m:[3.0,5.0], xSelfLow:{th:0.5,x:1.3}, tag:'ボス', r3:{xSelfScale:2.0}, r3d:'HPが低いほど最大2倍', r5:{idefLow:1}, r5d:'HP30%以下なら防御無視'},
    {nm:'地割れ', d:'敵全体に{m}＋防御↓', k:'atk', tgt:'all', m:[1.6,2.6], dd:100, tag:'雑魚', r3:{xSt:{st:'defDown',x:1.3}}, r3d:'防御↓の敵に1.3倍', r5:{kAtkSelf:15}, r5d:'倒すたび攻撃+15%（戦闘中ずっと、重なる）'},
    {nm:'仁王立ち', d:'2ターン挑発し、自分の攻撃+{atkSelf.pct}%', k:'taunt', turns:2, atkSelf:{pct:[30,50],t:3}, tag:'守る', r3:{hurtG:10}, r3d:'挑発中に殴られるたびゲージ+10', r5:{noDie:1}, r5d:'挑発中は倒れない'}],
 P:[{id:'wounded', nm:'手負いの獣', d:'HPが減るほど攻撃↑（最大+{v}%）', v:[30,60]},
    {id:'blood', nm:'血の代償', d:'アクティブのたびHPを15%払い、威力+{v}%', v:[25,50]},
    {id:'rage', nm:'怒り', d:'攻撃を受けるたび「怒り」+1。4つでHPが一番多い敵に{v%}の闇ダメージ（自分のHPが低いほど最大1.5倍）', v:[2.5,4.0], need:4, stack:'怒り'},
    {id:'breakDef', nm:'崩しの一撃', d:'防御↓の敵への攻撃+{v}%', v:[15,35]},
    {id:'undying', nm:'不死身', d:'致命傷を1度だけHP1で耐え、そのあと攻撃+{v}%', v:[15,35]},
    {id:'vengeance', nm:'道連れ', d:'自分が倒れたとき、敵全員に{v%}の闇ダメージ', v:[2.0,3.5]}] },

'オルガ':{ role:'盾', theme:'引き受けて、まとめて返す',
 N:[{nm:'盾打ち', d:'前の敵を盾で打つ（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{xTaunt:1.3}, r3d:'挑発中は1.3倍', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'構え', d:'攻撃せず、次のターンまで挑発＋被ダメージ−{cut}%', k:'stance', cut:[20,40], r3:{defUp:1}, r3d:'防御↑', r5:{ctr:1.0}, r5d:'構え中に殴られると反撃（1.0）'},
    {nm:'返しの構え', d:'攻撃せず、次に受けた攻撃に反撃（{ctr}）', k:'stance', cut:0, ctr:[1.5,2.5], once:1, noTaunt:1, r3:{ctrAll:1}, r3d:'反撃が敵全体に', r5:{gSelf:30}, r5d:'ゲージ+30'}],
 A:[{nm:'鉄の誓い', d:'3ターン挑発＋被ダメージ−{cut}%', k:'taunt', turns:3, cut:[30,50], tag:'守る', r3:{pCut:{pct:10,t:3}}, r3d:'味方全員の被ダメージ−10%', r5:{hurtWeak:1}, r5d:'挑発中に殴ってきた敵の攻撃↓'},
    {nm:'盾の旋風', d:'敵全体に{m}＋自分に挑発（2ターン）', k:'atk', tgt:'all', m:[1.6,2.6], tauntSelf:2, tag:'雑魚', r3:{cutSelf:20}, r3d:'挑発中の被ダメージ−20%', r5:{tauntSelf:3}, r5d:'挑発が3ターンに'},
    {nm:'報いの一撃', d:'この戦闘で受けたダメージ合計の{m}倍を、一番HPの多い敵に', k:'atk', tgt:'high', xTaken:1, m:[0.3,0.6], tag:'ボス', r3:{el:'light', drain:0.2}, r3d:'光属性になり、与えたダメージの20%回復', r5:{idef:1}, r5d:'防御無視'}],
 P:[{id:'retaliate', nm:'報復の盾', d:'挑発中に攻撃を受けると、敵全員に{v%}の反撃', v:[0.7,1.2]},
    {id:'shieldMind', nm:'盾の心得', d:'攻撃を受けるとゲージ+{v}（普通は+10）', v:[15,25]},
    {id:'guardChain', nm:'守りの連鎖', d:'挑発中に攻撃を受けるたび、ゲージが一番少ない味方に+{v}', v:[5,10]},
    {id:'wall', nm:'鉄壁', d:'挑発中は防御・魔防+{v}%', v:[15,30]},
    {id:'immovable', nm:'不動', d:'攻撃を受けるたび「不動」+1。6つで敵全員に{v%}のダメージ＋1ターン挑発', v:[2.0,3.5], need:6, stack:'不動'},
    {id:'recover', nm:'リカバー', d:'HP40%以下になると1度だけ魔攻{v%}ぶん回復', v:[2.0,3.5]}] },

'シオン':{ pow:1.14, role:'攻撃', theme:'会心が会心を呼ぶ',
 N:[{nm:'切りつけ', d:'前の敵を斬る（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{cr:10}, r3d:'会心率+10%', r5:{cG:10}, r5d:'会心でゲージ+10'},
    {nm:'急所狙い', d:'前の敵に{m}・会心率+{cr}%（印の敵には必ず会心）', k:'atk', tgt:'front', m:[0.8,1.2], cr:[30,50], scIf:'mark', r3:{cSpd:1}, r3d:'会心で速度↑', r5:{mark:1}, r5d:'当てた敵に印（1ターン）'},
    {nm:'影の印', d:'前の敵に{m}＋急所の印（2ターン、その敵への会心率が全員+{markCr}%）', k:'atk', tgt:'front', m:[0.6,1.0], mark:2, markCr:[30,40], r3:{mark:3}, r3d:'印が3ターンに', r5:{markG:5}, r5d:'印の敵に誰かが会心を出すたび味方全員のゲージ+5'}],
 A:[{nm:'影縫い', d:'一番HPの多い敵に{m}・必ず会心', k:'atk', tgt:'high', m:[3.0,5.0], sc:1, tag:'ボス', r3:{mark:3}, r3d:'急所の印（3ターン）を付ける', r5:{critX:0.5}, r5d:'会心ダメージ+50%'},
    {nm:'双刃乱舞', d:'敵全体を斬る（{m}）・会心率+30%', k:'atk', tgt:'all', m:[1.5,2.5], cr:30, tag:'雑魚', r3:{cG:10}, r3d:'会心1回ごとにゲージ+10', r5:{kRe:0.5, kReCrit:1}, r5d:'会心で倒すともう一度（威力半分）'},
    {nm:'夜明けの双刃', d:'前の敵に{h}回×{m}・必ず会心', k:'atk', tgt:'front', m:[0.75,1.25], h:4, sc:1, tag:'ボス', r3:{xSt:{st:'mark',x:1.3}}, r3d:'印の敵に1.3倍', r5:{cSpd:1}, r5d:'会心ごとに速度↑'}],
 P:[{id:'momentum', nm:'勢い', d:'会心が出るとゲージ+{v}', v:[8,16]},
    {id:'gale', nm:'疾風', d:'会心が出るたび速度+{v}%（最大+50%）', v:[5,10]},
    {id:'chainBlade', nm:'連鎖の刃', d:'自分が会心を出すと、次に動く味方の会心率+{v}%', v:[60,100]},
    {id:'deepWound', nm:'深い傷', d:'会心ダメージ+{v}%', v:[15,35]},
    {id:'thousand', nm:'千の刃', d:'味方の誰かが会心を出すたび「刃」+1。4つで敵全員に{v%}×4回（必ず会心）', v:[0.4,0.7], need:4, stack:'刃'},
    {id:'critHunt', nm:'急所狩り', d:'眠り・麻痺・凍結・停止・印の敵に会心を出すと、{v}%でもう1回行動（1ターン1回）', v:[50,100]}] },

'ドルク':{ pow:0.88, role:'攻撃', theme:'燃やして、もう一度唱える',
 N:[{nm:'火種', d:'炎の魔法（{m}）＋{st.c}%で燃焼', k:'atk', tgt:'front', mag:1, el:'fire', m:[0.7,1.1], st:{s:'burn',c:[40,70]}, r3:{burnT:4}, r3d:'燃焼が4ターンに', r5:{burnG:5}, r5d:'燃えている敵1体につきゲージ+5'},
    {nm:'魔法弾', d:'無属性の魔法（{m}）', k:'atk', tgt:'front', mag:1, m:[1.0,1.4], r3:{xSt:{st:'burn',x:1.3}}, r3d:'燃えている敵に1.3倍', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'冷気', d:'氷の魔法（{m}）＋{st.c}%で凍結', k:'atk', tgt:'front', mag:1, el:'ice', m:[0.7,1.1], st:{s:'freeze',c:[30,60]}, r3:{frostPhys:20}, r3d:'凍った敵は物理の被ダメージ+20%', r5:{thawG:15}, r5d:'凍結が割れるとゲージ+15'}],
 A:[{nm:'大魔法', d:'弱点の属性で一番HPの多い敵に（{m}）。炎なら燃焼、氷なら凍結を付ける', k:'atk', tgt:'high', mag:1, el:'weak', m:[3.0,5.0], elSt:1, tag:'ボス', r3:{xPerSt:0.15}, r3d:'状態異常1つにつき+15%', r5:{weakX:0.3}, r5d:'弱点ダメージ+30%'},
    {nm:'業火', d:'炎の全体魔法（{m}）＋{st.c}%で燃焼', k:'atk', tgt:'all', mag:1, el:'fire', m:[1.6,2.6], st:{s:'burn',c:[50,80]}, tag:'雑魚', r3:{burnX:1.5}, r3d:'この燃焼のダメージ1.5倍', r5:{kSpread:'burn'}, r5d:'燃えている敵が倒れると隣に燃え移る'},
    {nm:'爆炎', d:'一番HPの多い敵に炎（{m}）。さらに燃えている敵全員の燃焼を爆発させ、残りの燃焼ダメージを2倍で一度に与える', k:'atk', tgt:'high', mag:1, el:'fire', m:[2.0,3.4], burst:2, tag:'ボス', r3:{keepBurn:1}, r3d:'爆発しても燃焼が残る', r5:{burstG:20}, r5d:'爆発した数×ゲージ+20'}],
 P:[{id:'spread', nm:'燃え広がり', d:'アクティブのあと燃えている敵がいれば、もう一度出る（威力{v}%）', v:[50,100]},
    {id:'ember', nm:'熾火', d:'燃焼ダメージが入るたび「熾火」+1。6つで敵全員に{v%}の炎ダメージ＋燃焼', v:[2.0,3.2], need:6, stack:'熾火'},
    {id:'frost', nm:'凍てつく大地', d:'凍った敵は、味方全員からの被ダメージ+{v}%', v:[20,40]},
    {id:'heatRes', nm:'熱の共鳴', d:'敵にかかっている状態異常1つにつき魔法+{v}%（5つまで）', v:[6,12]},
    {id:'prep', nm:'詠唱の準備', d:'戦闘開始時ゲージ+{v}', v:[25,50]},
    {id:'infernoHeart', nm:'業火の心', d:'燃焼のダメージ+{v}%', v:[30,80]}] },

// ---- 隠し仲間（条件は軽く、威力は高め） ----
'ルガ':{ pow:1.2, role:'攻撃', theme:'誰より先に動いて狩る', rare:1,
 N:[{nm:'突き', d:'前の敵を突く（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{xFirst:1.3}, r3d:'そのターン最初に動いたら1.3倍', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'二段突き', d:'前の敵に{h}回×{m}', k:'atk', tgt:'front', m:[0.55,0.75], h:2, r3:{weakH:3}, r3d:'弱点なら3回', r5:{spdSelf:1}, r5d:'速度↑'},
    {nm:'牙', d:'HPが一番少ない敵に{m}。HP50%以下の敵に1.5倍', k:'atk', tgt:'low', m:[0.8,1.2], xLow:{th:0.5,x:1.5}, r3:{kG:20}, r3d:'倒すとゲージ+20', r5:{kAgain:1}, r5d:'倒すともう1回行動'}],
 A:[{nm:'天穿', d:'光の槍で一番HPの多い敵に（{m}）', k:'atk', tgt:'high', el:'light', m:[3.2,5.4], tag:'ボス', r3:{xFirst:1.3}, r3d:'先に動いたターンなら1.3倍', r5:{idef:0.3}, r5d:'防御を30%無視'},
    {nm:'竜巻槍', d:'敵全体を薙ぐ（{m}）', k:'atk', tgt:'all', m:[1.7,2.8], tag:'雑魚', r3:{kG:15}, r3d:'倒した数×ゲージ+15', r5:{spdSelf:1}, r5d:'速度↑'},
    {nm:'月下の跳躍', d:'高く跳び（次の行動まで攻撃を受けない）、一番HPの多い敵に（{m}）', k:'atk', tgt:'high', el:'light', m:[3.6,5.8], air:1, tag:'ボス', r3:{land:0.5}, r3d:'着地で敵全体に0.5', r5:{sc:1}, r5d:'必ず会心'}],
 P:[{id:'vanguard', nm:'先駆け', d:'そのターン最初に動くと威力+{v}%', v:[20,40]},
    {id:'swift', nm:'駆ける足', d:'速度+{v}%', v:[10,20]},
    {id:'huntChain', nm:'狩りの連鎖', d:'敵を倒すとゲージ+{v}', v:[30,60]},
    {id:'pack', nm:'群れの狩り', d:'敵が3体以上いると攻撃+{v}%', v:[15,30]},
    {id:'scent', nm:'獣の嗅覚', d:'弱点を突くとゲージ+{v}', v:[10,18]},
    {id:'moonFang', nm:'月の牙', d:'最初に動いたターンごとに「牙」+1。3つでHPが一番多い敵に{v%}の光ダメージ（必ず会心）', v:[3.0,4.8], need:3, stack:'牙'}] },

'ゴード':{ pow:1.3, role:'攻撃', theme:'状態異常を数えて、仕留める', rare:1,
 N:[{nm:'投げナイフ', d:'前の敵に{m}＋{st.c}%で毒', k:'atk', tgt:'front', m:[1.0,1.4], st:{s:'poison',c:[15,35]}, r3:{xSt:{st:'poison',x:1.2}}, r3d:'毒の敵に1.2倍', r5:{h:2}, r5d:'2本投げる'},
    {nm:'しびれ針', d:'前の敵に{m}＋{st.c}%で麻痺', k:'atk', tgt:'front', m:[0.7,1.1], st:{s:'paralyze',c:[20,40]}, r3:{scIf:'paralyze'}, r3d:'麻痺の敵に必ず会心', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'えぐり', d:'前の敵に{m}。状態異常1つにつき+20%', k:'atk', tgt:'front', m:[0.8,1.2], xPerSt:0.2, r3:{poisonExt:1}, r3d:'毒を1ターン延ばす', r5:{st2G:15}, r5d:'状態異常2つ以上の敵ならゲージ+15'}],
 A:[{nm:'処刑の刃', d:'一番状態異常の多い敵に{m}。状態異常1つにつき威力+{pctSt}%', k:'atk', tgt:'mostSt', m:[3.2,5.4], xPerSt:[0.2,0.3], pctSt:[20,30], tag:'ボス', r3:{scIf:'st2'}, r3d:'状態異常2つ以上なら必ず会心', r5:{stAdd:1}, r5d:'当てたあと状態異常を1つ足す'},
    {nm:'毒霧', d:'敵全体に{m}＋{st.c}%で毒', k:'atk', tgt:'all', m:[1.7,2.8], st:{s:'poison',c:[50,80]}, tag:'雑魚', r3:{st2:{s:'paralyze',c:20}}, r3d:'20%で麻痺も', r5:{kSpread:'poison'}, r5d:'毒の敵が倒れると隣に毒が移る'},
    {nm:'狩人の罠', d:'前の敵に{m}＋毒・麻痺・燃焼から{stPick.n}つ（各60%）', k:'atk', tgt:'front', m:[2.2,3.4], stPick:{n:2,c:60}, tag:'ボス', r3:{stPick:{n:3,c:60}}, r3d:'3つとも', r5:{sd:1}, r5d:'速度↓も'}],
 P:[{id:'stHunt', nm:'狩りの間合い', d:'状態異常の敵を攻撃するとゲージ+{v}', v:[6,14]},
    {id:'venom', nm:'猛毒', d:'毒のダメージ+{v}%', v:[50,150]},
    {id:'stSkill', nm:'狩りの技', d:'状態異常の成功率+{v}%', v:[10,30]},
    {id:'widen', nm:'弱みを広げる', d:'状態異常の敵を攻撃すると、{v}%で別の状態異常を足す', v:[15,35]},
    {id:'finish', nm:'仕留め', d:'状態異常2つ以上の敵への会心率+{v}%', v:[30,100]},
    {id:'finale', nm:'勇者狩りの終幕', d:'敵に状態異常が付くたび「狩り」+1。5つで状態異常が一番多い敵に、状態異常1つにつき{v%}のダメージ', v:[0.8,1.3], need:5, stack:'狩り'}] },

'イヴ':{ pow:1.38, role:'攻撃', theme:'撃つと癒え、癒えると撃つ', rare:1,
 N:[{nm:'聖光', d:'光の魔法（{m}）', k:'atk', tgt:'front', mag:1, el:'light', m:[1.0,1.4], r3:{hLow:10}, r3d:'与えたダメージの10%で一番減った味方を回復', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'癒やしの光', d:'HP80%未満の味方がいれば一番減った1人を回復（魔攻×{m}）。いなければ光の攻撃（0.8）', k:'pray', m:[0.7,1.1], r3:{healHit:0.5}, r3d:'回復量の50%を敵に光ダメージ', r5:{n:2}, r5d:'2人に届く'},
    {nm:'光の楔', d:'光の魔法（{m}）＋その敵は光の被ダメージ+{lvn.pct}%（2ターン）', k:'atk', tgt:'front', mag:1, el:'light', m:[0.6,1.0], lvn:{pct:[15,30],t:2}, r3:{lvn:{pct:30,t:3}}, r3d:'3ターンに', r5:{splash:0.3}, r5d:'敵全体にも0.3'}],
 A:[{nm:'天の裁き', d:'光の魔法で一番HPの多い敵に（{m}）', k:'atk', tgt:'high', mag:1, el:'light', m:[3.2,5.4], tag:'ボス', r3:{xPerFull:0.1}, r3d:'HP満タンの味方1人につき+10%', r5:{idef:0.3}, r5d:'防御を30%無視'},
    {nm:'光の雨', d:'光の全体魔法（{m}）', k:'atk', tgt:'all', mag:1, el:'light', m:[1.7,2.8], tag:'雑魚', r3:{hAll:10}, r3d:'与えたダメージの10%で味方全員回復', r5:{fullG:15}, r5d:'HP満タンの味方のゲージ+15'},
    {nm:'創世の光', d:'光の全体魔法（{m}）＋味方全員のHPを{pHeal}%回復', k:'atk', tgt:'all', mag:1, el:'light', m:[1.3,2.1], pHeal:[15,30], tag:'回復', r3:{cure:1}, r3d:'状態異常も治す', r5:{pShield:0.6}, r5d:'加護（魔攻×0.6の盾）も'}],
 P:[{id:'afterglow', nm:'祈りの残り火', d:'アクティブのあと、与えたダメージの{v}%ぶん味方全員を回復', v:[8,20]},
    {id:'cycle', nm:'光の循環', d:'味方が回復を受けるたび、自分のゲージ+{v}', v:[3,7]},
    {id:'primal', nm:'原初の光', d:'光のダメージ+{v}%', v:[10,25]},
    {id:'lamp', nm:'聖なる灯', d:'HPが満タンの味方1人につき魔攻+{v}%', v:[3,8]},
    {id:'wake', nm:'千年の目覚め', d:'戦闘開始時ゲージ+{v}', v:[20,45]},
    {id:'pillar', nm:'光の柱', d:'味方が回復を受けるたび「光」+1。8つで敵全員に{v%}の光ダメージ', v:[2.4,3.8], need:8, stack:'光'}] },

'クロノ':{ pow:1.48, role:'攻撃', theme:'時を止め、時を足す', rare:1,
 N:[{nm:'時の針', d:'魔法（{m}）', k:'atk', tgt:'front', mag:1, m:[0.9,1.3], r3:{sd:1}, r3d:'速度↓', r5:{xSt:{st:'stop',x:2}}, r5d:'止まっている敵に2倍'},
    {nm:'刻み', d:'魔法（{m}）。ゲージが+15多く溜まる', k:'atk', tgt:'front', mag:1, m:[0.6,1.0], gSelf:15, r3:{gNext:10}, r3d:'次に動く味方のゲージ+10', r5:{again:15}, r5d:'15%でもう1回行動'},
    {nm:'遅延', d:'魔法（{m}）＋{st.c}%で1ターン停止', k:'atk', tgt:'front', mag:1, m:[0.5,0.9], st:{s:'stop',c:[15,35]}, r3:{bossOk:1}, r3d:'ボスにも効きやすい', r5:{stopG:10}, r5d:'止めたら味方全員のゲージ+10'}],
 A:[{nm:'刻の断罪', d:'一番HPの多い敵に魔法（{m}）＋{st.c}%で停止', k:'atk', tgt:'high', mag:1, m:[3.2,5.4], st:{s:'stop',c:[30,50]}, tag:'ボス', r3:{xSt:{st:'stop',x:1.5}}, r3d:'止まっている敵に1.5倍', r5:{stopAgain:1}, r5d:'止めたらもう1回行動'},
    {nm:'時空の歪み', d:'敵全体に魔法（{m}）＋速度↓', k:'atk', tgt:'all', mag:1, m:[1.7,2.8], sd:1, tag:'雑魚', r3:{st:{s:'stop',c:20}}, r3d:'20%で停止', r5:{stopG:10}, r5d:'止めた数×味方全員のゲージ+10'},
    {nm:'加速の刻', d:'味方全員の速度↑＋ゲージ+{pG}', k:'support', pSpd:2, pG:[15,30], tag:'配る', r3:{actTop:1}, r3d:'ゲージが一番多い味方がすぐに動く', r5:{pSpd:3}, r5d:'速度↑が3ターンに'}],
 P:[{id:'waver', nm:'時のゆらぎ', d:'{v}%でもう1回行動', v:[15,30]},
    {id:'haste', nm:'早回し', d:'自分が動くたび、次に動く味方のゲージ+{v}', v:[5,12]},
    {id:'stopped', nm:'止まった時間', d:'止まっている敵への攻撃+{v}%（味方全員）', v:[25,50]},
    {id:'foresee', nm:'刻の先読み', d:'戦闘開始時ゲージ+{v}', v:[20,45]},
    {id:'rewind', nm:'巻き戻し', d:'倒れた味方を、そのターンの始めのHPに戻す（1戦闘{v}回）', v:[1,2,'i']},
    {id:'timeEnd', nm:'刻の果て', d:'毎ターン「刻」+1。4つで敵全員に{v%}のダメージ＋30%で停止', v:[2.0,3.4], need:4, stack:'刻'}] },

'レオン':{ pow:1.28, role:'攻撃', theme:'仲間を引き上げる', rare:1,
 N:[{nm:'聖剣', d:'光の剣（{m}）', k:'atk', tgt:'front', el:'light', m:[1.0,1.4], r3:{xAnyAtkUp:1.2}, r3d:'攻撃アップ中の味方がいれば1.2倍', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'導きの剣', d:'前の敵に{m}＋ゲージが一番少ない味方に+{gLow}', k:'atk', tgt:'front', m:[0.8,1.2], gLow:[8,15], r3:{aLow:10}, r3d:'その味方の攻撃+10%（2ターン）', r5:{gLowN:2}, r5d:'2人に'},
    {nm:'光輪', d:'敵全体に光（{m}）', k:'atk', tgt:'all', el:'light', m:[0.45,0.75], r3:{gpt:5}, r3d:'当てた数×ゲージ+5', r5:{xWeak:2}, r5d:'光が弱点の敵に2倍'}],
 A:[{nm:'千年の一閃', d:'光の剣で一番HPの多い敵に（{m}）', k:'atk', tgt:'high', el:'light', m:[3.2,5.4], tag:'ボス', r3:{xPerAtkUp:0.1}, r3d:'攻撃アップ中の味方1人につき+10%', r5:{idef:0.3}, r5d:'防御を30%無視'},
    {nm:'光輪斬', d:'光の剣で敵全体（{m}）', k:'atk', tgt:'all', el:'light', m:[1.7,2.8], tag:'雑魚', r3:{pAtk:{pct:10,t:2}}, r3d:'味方全員の攻撃+10%', r5:{kG:20}, r5d:'倒すとゲージ+20'},
    {nm:'器の剣', d:'味方全員の攻撃+{pAtk.pct}%（3ターン）・会心率+10%', k:'support', pAtk:{pct:[20,40],t:3}, pCrit:10, tag:'配る', r3:{pG:15}, r3d:'ゲージ+15', r5:{pCut:{pct:20,t:3}}, r5d:'被ダメージ−20%も'}],
 P:[{id:'command', nm:'号令', d:'アクティブのあと、味方全員の攻撃+{v}%（2ターン）', v:[12,25]},
    {id:'breath', nm:'勇者の呼吸', d:'通常攻撃のゲージ+{v}', v:[5,12]},
    {id:'resonance', nm:'始まりの共鳴', d:'味方がアクティブを使うたびゲージ+{v}', v:[6,14]},
    {id:'lead', nm:'先導', d:'攻撃アップ中の味方の会心率+{v}%', v:[15,30]},
    {id:'thousandGuard', nm:'千年の守り', d:'味方全員の被ダメージ−{v}%', v:[5,12]},
    {id:'afterlight', nm:'千年の残光', d:'味方がアクティブを使うたび「残光」+1。4つで敵全員に{v%}の光ダメージ＋味方全員の攻撃+15%', v:[2.4,3.8], need:4, stack:'残光'}] },
// ---- 追加の仲間10人（レア度が高いほど強い） ----
'ロロ':{ pow:1.18, role:'攻撃', theme:'目利きとお宝', rare:1,
 N:[{nm:'投げ銭', d:'前の敵に{m}。与えたダメージの5%ぶんお金が入る', k:'atk', tgt:'front', m:[1.0,1.4], gp:5, r3:{gp:10}, r3d:'お金が10%に', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'目利き', d:'前の敵の弱点を見抜き、そこを突く（{m}）', k:'atk', tgt:'front', el:'weak', m:[0.8,1.2], reveal:1, r3:{expose:{pct:15,t:2}}, r3d:'見抜いた敵は被ダメージ+15%', r5:{gAll:5}, r5d:'味方全員のゲージ+5'},
    {nm:'値切り', d:'前の敵に{m}＋攻撃ダウン', k:'atk', tgt:'front', m:[0.7,1.1], atkDown:1, r3:{dd:50}, r3d:'50%で防御ダウン', r5:{gSelf:15}, r5d:'ゲージ+15'}],
 A:[{nm:'大当たり', d:'HPが一番多い敵の弱点に{m}。30%で3倍', k:'atk', tgt:'high', el:'weak', m:[2.4,4.0], lucky:{c:30,x:3}, tag:'ボス', r3:{lucky:{c:40,x:3}}, r3d:'40%に', r5:{lucky:{c:50,x:3}}, r5d:'50%に'},
    {nm:'札束の嵐', d:'敵全員に{m}', k:'atk', tgt:'all', m:[1.6,2.6], gp:5, tag:'雑魚', r3:{kG:15}, r3d:'倒した数×ゲージ+15', r5:{gp:15}, r5d:'お金が15%に'},
    {nm:'商売繁盛', d:'味方全員のゲージ+{pG}・会心率+10%', k:'support', pG:[15,30], pCrit:10, tag:'配る', r3:{pAtk:{pct:15,t:2}}, r3d:'攻撃+15%も', r5:{pCrit:25}, r5d:'会心率+25%に'}],
 P:[{id:'appraise', nm:'目利きの眼', d:'戦闘のはじめに敵全員の弱点を見抜き、弱点ダメージ+{v}%', v:[10,25]},
    {id:'greedy', nm:'がめつい', d:'戦闘で手に入るお金+{v}%', v:[20,50]},
    {id:'bargain', nm:'掘り出し物', d:'装備を落とす確率+{v}%', v:[15,35]},
    {id:'interest', nm:'利子', d:'味方が弱点を突くたび「利子」+1。5つで敵全員に{v%}のダメージ（金貨の雨）', v:[1.8,3.0], need:5, stack:'利子'},
    {id:'fortune', nm:'福の神', d:'味方全員の会心率+{v}%', v:[4,10]},
    {id:'purse', nm:'ふところ', d:'致命傷を1度だけ、お金を払ってHP{v}%で耐える', v:[10,40]}] },

'テオ':{ role:'盾', theme:'仲間をかばって育つ', rare:1,
 N:[{nm:'小盾打ち', d:'前の敵を盾で打つ（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{xTaunt:1.3}, r3d:'かばっている間は1.3倍', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'かばう', d:'攻撃せず、次の自分の番まで味方への攻撃を代わりに受ける。被ダメージ−{cut}%', k:'stance', cover:1, noTaunt:1, cut:[20,40], r3:{defUp:1}, r3d:'防御アップ', r5:{ctr:1.0}, r5d:'かばったら反撃100%'},
    {nm:'聖なる突き', d:'光の突き（{m}）＋自分の防御アップ', k:'atk', tgt:'front', el:'light', m:[0.9,1.3], selfDefUp:1, r3:{hLow:20}, r3d:'与えたダメージの20%で一番減った味方を回復', r5:{gAll:5}, r5d:'味方全員のゲージ+5'}],
 A:[{nm:'見習いの誓い', d:'2ターン、味方への攻撃をすべて代わりに受ける。被ダメージ−{cut}%', k:'taunt', turns:2, cover:1, cut:[30,50], tag:'守る', r3:{turns:3}, r3d:'3ターンに', r5:{hurtG:10}, r5d:'受けるたびゲージ+10'},
    {nm:'聖盾の光', d:'味方全員に盾（自分の最大HPの{shHp}%）', k:'shield', tgt:'all', shHp:[10,20], tag:'守る', r3:{pCut:{pct:15,t:2}}, r3d:'被ダメージ−15%（2ターン）', r5:{cure:1}, r5d:'状態異常も治す'},
    {nm:'反撃の剣', d:'HPが一番多い敵に{m}。この戦闘で受けたダメージが多いほど最大1.5倍', k:'atk', tgt:'high', el:'light', m:[2.8,4.6], xTakenScale:1.5, tag:'ボス', r3:{idef:0.2}, r3d:'防御を20%無視', r5:{xTakenScale:2}, r5d:'最大2倍に'}],
 P:[{id:'grit', nm:'まだまだ', d:'攻撃を受けるたび防御+{v}%（最大+30%）', v:[3,6]},
    {id:'guardHeart', nm:'かばう心', d:'味方がHP30%以下になると1戦闘1回、その味方を最大HPの{v}%回復し、自分が攻撃を受ける', v:[20,40]},
    {id:'pride', nm:'守り手の誇り', d:'かばっている間、味方全員の攻撃+{v}%', v:[10,20]},
    {id:'paladin', nm:'聖騎士の血', d:'味方の代わりに攻撃を受けるたび「誓い」+1。5つで敵全員に{v%}の光ダメージ＋味方全員のHP10%回復', v:[1.5,2.5], need:5, stack:'誓い'},
    {id:'resolve', nm:'固い意志', d:'状態異常にかかりにくい（+{v}%）', v:[30,100]},
    {id:'standFirm', nm:'踏みとどまる', d:'致命傷を1度だけHP1で耐え、ゲージが{v}たまる', v:[50,100]}] },

'リュート':{ pow:1.0, role:'補助', theme:'歌で仲間を押し上げる', rare:2,
 N:[{nm:'かき鳴らし', d:'前の敵に魔法{m}＋味方全員のゲージ+{gAll}', k:'atk', tgt:'front', mag:1, m:[0.8,1.2], gAll:[3,6], r3:{cr:10}, r3d:'会心率+10%', r5:{gAll:8}, r5d:'ゲージ+8に'},
    {nm:'励ましの歌', d:'攻撃せず、味方全員の攻撃+{pAtk.pct}%（2ターン）', k:'support', pAtk:{pct:[5,10],t:2}, r3:{pG:5}, r3d:'味方全員のゲージ+5', r5:{pCrit:10}, r5d:'会心率+10%も'},
    {nm:'眠りの調べ', d:'敵全員に魔法{m}＋眠り{st.c}%', k:'atk', tgt:'all', mag:1, m:[0.4,0.6], st:{s:'sleep',c:[15,30]}, r3:{sd:1}, r3d:'速度ダウン', r5:{gSelf:15}, r5d:'ゲージ+15'}],
 A:[{nm:'勇者の歌', d:'味方全員の攻撃+{pAtk.pct}%・会心率+10%（3ターン）', k:'support', pAtk:{pct:[15,28],t:3}, pCrit:10, tag:'配る', r3:{pG:15}, r3d:'ゲージ+15も', r5:{pCrit:25}, r5d:'会心率+25%に'},
    {nm:'早弾き', d:'味方全員のゲージ+{pG}', k:'support', pG:[20,35], tag:'配る', r3:{pSpd:2}, r3d:'速度アップも', r5:{actTop:1}, r5d:'ゲージが一番多い味方がすぐ動く'},
    {nm:'鎮魂歌', d:'敵全員に魔法{m}＋防御ダウン', k:'atk', tgt:'all', mag:1, m:[1.4,2.4], dd:100, tag:'雑魚', r3:{st:{s:'sleep',c:20}}, r3d:'20%で眠り', r5:{atkDown:1}, r5d:'攻撃ダウンも'}],
 P:[{id:'encore', nm:'アンコール', d:'アクティブのあと、{v}%でもう一度歌う', v:[20,40]},
    {id:'resonate', nm:'旋律の共鳴', d:'味方がアクティブを使うたび、その味方のHPを最大HPの{v}%回復', v:[3,6]},
    {id:'accomp', nm:'伴奏', d:'攻撃アップ中の味方の速度+{v}%', v:[10,20]},
    {id:'finale2', nm:'最終楽章', d:'アクティブを使うたび「節」+1。2つで味方全員の攻撃+{v}%（2ターン）とゲージ+20', v:[20,35], need:2, stack:'節'},
    {id:'cheer', nm:'観客の声援', d:'立っている味方1人につき魔攻+{v}%', v:[4,8]},
    {id:'lastSong', nm:'歌いつづける', d:'倒れたとき1度だけ、味方全員のHPを{v}%回復する', v:[20,40]}] },

'ミオ':{ pow:1.1, role:'攻撃', theme:'弱点を射抜く光の矢', rare:2,
 N:[{nm:'光の矢', d:'光の矢（{m}）', k:'atk', tgt:'front', el:'light', m:[1.0,1.4], r3:{cr:10}, r3d:'会心率+10%', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'狙い撃ち', d:'弱点の属性で{m}。弱点なら会心率+30%', k:'atk', tgt:'front', el:'weak', m:[0.9,1.3], weakCr:30, r3:{weakCr:50}, r3d:'会心率+50%に', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'灯火の矢', d:'光の矢（{m}）＋その敵は光の被ダメージ+{lvn.pct}%（2ターン）', k:'atk', tgt:'front', el:'light', m:[0.6,1.0], lvn:{pct:[15,30],t:2}, r3:{reveal:1}, r3d:'弱点も見抜く', r5:{lvn:{pct:30,t:3}}, r5d:'3ターンに'}],
 A:[{nm:'灯台の一矢', d:'HPが一番多い敵に光の矢（{m}）。弱点なら1.3倍', k:'atk', tgt:'high', el:'light', m:[3.2,5.2], xWeak:1.3, tag:'ボス', r3:{sc:1}, r3d:'かならず会心', r5:{idef:0.3}, r5d:'防御を30%無視'},
    {nm:'流星の雨', d:'ランダムな敵に{h}回×{m}（光）', k:'atk', tgt:'random', rh:1, el:'light', m:[0.45,0.75], h:5, tag:'雑魚', r3:{h:6}, r3d:'6回に', r5:{h:7}, r5d:'7回に'},
    {nm:'照らす光', d:'敵全員の弱点を見抜き、味方全員の弱点ダメージ+{weakBuff.pct}%（3ターン）', k:'support', weakBuff:{pct:[20,40],t:3}, reveal:1, tag:'配る', r3:{pG:10}, r3d:'味方全員のゲージ+10', r5:{weakBuff:{pct:40,t:4}}, r5d:'4ターンに'}],
 P:[{id:'hawk', nm:'鷹の目', d:'弱点を突くとゲージ+{v}', v:[10,20]},
    {id:'rapid', nm:'連射', d:'通常攻撃が{v}%でもう1回', v:[15,35]},
    {id:'keeper', nm:'灯台守の誇り', d:'HPが満タンのとき攻撃+{v}%', v:[15,30]},
    {id:'guiding', nm:'導きの光', d:'味方の誰かが弱点を突くたび「灯」+1。6つで敵全員に{v%}の光ダメージ（弱点扱い）', v:[2.0,3.4], need:6, stack:'灯'},
    {id:'longshot', nm:'遠矢', d:'敵が1体だけのとき攻撃+{v}%', v:[20,40]},
    {id:'dawnWatch', nm:'夜明けの見張り', d:'戦闘開始時ゲージ+{v}', v:[30,50]}] },

'ヨル':{ pow:0.78, role:'攻撃', theme:'呪いを重ねて、はじけさせる', rare:2,
 N:[{nm:'影の手', d:'闇の魔法（{m}）＋呪い+1', k:'atk', tgt:'front', mag:1, el:'dark', m:[0.9,1.3], curse:1, r3:{curse:2}, r3d:'呪い+2に', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'呪いの言葉', d:'敵全員に魔法{m}＋呪い+1', k:'atk', tgt:'all', mag:1, el:'dark', m:[0.4,0.6], curse:1, r3:{sd:1}, r3d:'速度ダウン', r5:{curse:2}, r5d:'呪い+2に'},
    {nm:'影縛り', d:'闇の魔法（{m}）＋麻痺{st.c}%', k:'atk', tgt:'front', mag:1, el:'dark', m:[0.6,1.0], st:{s:'paralyze',c:[20,40]}, r3:{curse:1}, r3d:'呪い+1', r5:{atkDown:1}, r5d:'攻撃ダウンも'}],
 A:[{nm:'呪詛爆ぜ', d:'HPが一番多い敵に闇の魔法{m}＋その敵の呪いをはじけさせる（呪い1つにつき{curseBurst%}）', k:'atk', tgt:'high', mag:1, el:'dark', m:[1.5,2.4], curseBurst:[0.6,0.9], tag:'ボス', r3:{keepCurse:1}, r3d:'はじけても呪いが半分残る', r5:{sc:1}, r5d:'かならず会心'},
    {nm:'闇の大波', d:'敵全員に闇の魔法{m}＋呪い+1', k:'atk', tgt:'all', mag:1, el:'dark', m:[1.6,2.6], curse:1, tag:'雑魚', r3:{curse:2}, r3d:'呪い+2に', r5:{kG:15}, r5d:'倒した数×ゲージ+15'},
    {nm:'千年の守り歌', d:'味方全員の被ダメージ−{pCut.pct}%（2ターン）＋状態異常を治す', k:'support', pCut:{pct:[20,35],t:2}, cure:1, tag:'守る', r3:{pG:10}, r3d:'味方全員のゲージ+10', r5:{pCut:{pct:35,t:3}}, r5d:'3ターンに'}],
 P:[{id:'cursedDmg', nm:'呪いの深み', d:'呪われた敵への攻撃+{v}%（味方全員）', v:[8,18]},
    {id:'curseHit', nm:'連なる呪い', d:'攻撃が当たるたび{v}%で呪い+1', v:[30,60]},
    {id:'shadowGuard', nm:'影の身代わり', d:'味方が致命傷を受けたとき、1戦闘{v}回だけ影が代わりに受ける', v:[1,2,'i']},
    {id:'darkFest', nm:'闇の祝祭', d:'敵に呪いが付くたび「宴」+1。10で敵全員に{v%}の闇ダメージ', v:[2.2,3.6], need:10, stack:'宴'},
    {id:'demonBlood', nm:'魔族の血', d:'闇のダメージ+{v}%', v:[15,30]},
    {id:'vesselKin', nm:'器の一族', d:'戦闘のはじめに敵全員へ呪い+{v}', v:[1,3,'i']}] },

'モルド':{ pow:1.45, role:'攻撃', theme:'弱った敵と、生き返った者を葬る', rare:3,
 N:[{nm:'シャベル打ち', d:'前の敵に{m}。アンデッドに1.5倍', k:'atk', tgt:'front', m:[1.0,1.4], xUndead:1.5, r3:{xLow:{th:0.3,x:1.3}}, r3d:'HP30%以下の敵に1.3倍', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'墓掘り', d:'HPが一番少ない敵に{m}。HP25%以下の敵を{exec.c}%で倒す（ボスには効かない）', k:'atk', tgt:'low', m:[0.8,1.2], exec:{th:0.25,c:[10,20]}, r3:{exec:{th:0.35,c:20}}, r3d:'HP35%以下に', r5:{kG:20}, r5d:'倒すとゲージ+20'},
    {nm:'弔いの灯', d:'光の一撃（{m}）。アンデッドに2倍', k:'atk', tgt:'front', el:'light', m:[0.8,1.2], xUndead:2, r3:{hLow:15}, r3d:'与えたダメージの15%で一番減った味方を回復', r5:{gAll:5}, r5d:'味方全員のゲージ+5'}],
 A:[{nm:'葬送', d:'HPが一番多い敵に{m}。敵のHPが減っているほど最大1.6倍。アンデッドに1.5倍', k:'atk', tgt:'high', m:[3.2,5.4], xFoeLow:1.6, xUndead:1.5, tag:'ボス', r3:{idef:0.3}, r3d:'防御を30%無視', r5:{sc:1}, r5d:'かならず会心'},
    {nm:'墓場の鐘', d:'敵全員に{m}。アンデッドに1.5倍', k:'atk', tgt:'all', m:[1.7,2.8], xUndead:1.5, tag:'雑魚', r3:{exec:{th:0.2,c:20}}, r3d:'HP20%以下の敵を20%で倒す', r5:{kG:15}, r5d:'倒した数×ゲージ+15'},
    {nm:'最後の祈り', d:'倒れた味方を全員HP{rev}%で起こす。いなければ全員のHPを{pHeal}%回復', k:'revive', rev:[30,60], pHeal:[15,30], tag:'守る', r3:{fullG:1}, r3d:'起こした味方のゲージ満タン', r5:{guardAll:1}, r5d:'全員に1度だけ死なない加護'}],
 P:[{id:'deathScent', nm:'死の匂い', d:'HP30%以下の敵への攻撃+{v}%', v:[25,50]},
    {id:'sendOff', nm:'引導', d:'敵を倒すと、次の攻撃+{v}%', v:[30,60]},
    {id:'procession', nm:'葬列', d:'敵が倒れるたび「棺」+1。2つで敵全員に{v%}のダメージ＋HP50%以下の敵を10%で倒す', v:[1.5,2.5], need:2, stack:'棺'},
    {id:'graveEye', nm:'墓守の目', d:'アンデッドへのダメージ+{v}%（味方全員）', v:[15,30]},
    {id:'noRise', nm:'土に還す', d:'敵の回復を{v}%減らす', v:[50,100]},
    {id:'mourner', nm:'死を見送る者', d:'仲間が倒れると、自分の攻撃+{v}%（戦闘中）', v:[30,60]}] },

'ベラ':{ pow:1.56, role:'攻撃', theme:'斧で群れごと薙ぎ払う', rare:3,
 N:[{nm:'薙ぎ払い', d:'敵全員に{m}', k:'atk', tgt:'all', m:[0.45,0.7], r3:{kG:10}, r3d:'倒すとゲージ+10', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'兜割り', d:'前の敵に{m}＋防御ダウン', k:'atk', tgt:'front', m:[1.2,1.6], dd:100, r3:{cr:15}, r3d:'会心率+15%', r5:{spill:1}, r5d:'倒したら、余ったダメージを次の敵へ'},
    {nm:'挑み', d:'前の敵に{m}＋自分に挑発（1ターン）', k:'atk', tgt:'front', m:[0.9,1.3], tauntSelf:1, r3:{cutSelf:20}, r3d:'挑発中の被ダメージ−20%', r5:{gSelf:15}, r5d:'ゲージ+15'}],
 A:[{nm:'一刀両断', d:'HPが一番多い敵に{m}。倒したら、余ったダメージを次の敵へ', k:'atk', tgt:'high', m:[4.0,6.4], spill:1, tag:'ボス', r3:{cr:30}, r3d:'会心率+30%', r5:{critX:0.5}, r5d:'会心ダメージ+50%'},
    {nm:'大旋風', d:'敵全員に{m}', k:'atk', tgt:'all', m:[1.9,3.0], tag:'雑魚', r3:{dd:50}, r3d:'50%で防御ダウン', r5:{kRe:0.5}, r5d:'倒したらもう一度（威力半分）'},
    {nm:'傭兵の号令', d:'味方全員の攻撃+{pAtk.pct}%（2ターン）＋ゲージ+10', k:'support', pAtk:{pct:[25,40],t:2}, pG:10, tag:'配る', r3:{pCrit:15}, r3d:'会心率+15%も', r5:{pAtk:{pct:40,t:3}}, r5d:'3ターンに'}],
 P:[{id:'bloodBack', nm:'返り血', d:'敵を倒すとHPを{v}%回復', v:[10,20]},
    {id:'pushThrough', nm:'押し切る', d:'敵1体につき攻撃+{v}%', v:[6,12]},
    {id:'strongArm', nm:'剛腕', d:'会心ダメージ+{v}%', v:[20,40]},
    {id:'warCry', nm:'戦場の鬨', d:'自分が敵を倒すたび「鬨」+1。2つで敵全員に{v%}のダメージ', v:[2.5,4.0], need:2, stack:'鬨'},
    {id:'aftershock', nm:'余波', d:'1体への攻撃のとき、ほかの敵にも{v}%のダメージ', v:[20,40]},
    {id:'guildBond', nm:'ギルドの絆', d:'味方が会心を出すたびゲージ+{v}', v:[5,10]}] },

'アルベルト':{ pow:1.5, role:'攻撃', theme:'王の采配で、仲間を動かす', rare:3,
 N:[{nm:'王の剣', d:'前の敵を斬る（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{xSelfFull:1.3}, r3d:'自分のHP満タンなら1.3倍', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'王の威光', d:'前の敵に{m}＋攻撃ダウン', k:'atk', tgt:'front', m:[0.7,1.1], atkDown:1, r3:{gAll:5}, r3d:'味方全員のゲージ+5', r5:{allDown:1}, r5d:'敵全員の攻撃ダウン'},
    {nm:'命令', d:'攻撃せず、ゲージが一番多い味方をすぐに動かす', k:'support', actTop:1, r3:{gTop:10}, r3d:'その味方のゲージ+10', r5:{gTop:20}, r5d:'ゲージ+20に'}],
 A:[{nm:'王の一太刀', d:'HPが一番多い敵に{m}。自分のHPが満タンなら1.3倍', k:'atk', tgt:'high', m:[3.4,5.6], xSelfFull:1.3, tag:'ボス', r3:{idef:0.2}, r3d:'防御を20%無視', r5:{sc:1}, r5d:'かならず会心'},
    {nm:'総攻撃の号令', d:'味方全員の攻撃+{pAtk.pct}%（2ターン）し、ほかの味方がすぐに通常攻撃する', k:'support', pAtk:{pct:[15,25],t:2}, allAttack:1, tag:'配る', r3:{pG:10}, r3d:'ゲージ+10も', r5:{pAtk:{pct:25,t:3}}, r5d:'3ターンに'},
    {nm:'王都の盾', d:'味方全員の被ダメージ−{pCut.pct}%（2ターン）＋HPを{pHeal}%回復', k:'support', pCut:{pct:[25,40],t:2}, pHeal:[15,25], tag:'守る', r3:{cure:1}, r3d:'状態異常も治す', r5:{pCut:{pct:40,t:3}}, r5d:'3ターンに'}],
 P:[{id:'majesty', nm:'王の風格', d:'味方全員の防御+{v}%', v:[8,15]},
    {id:'command2', nm:'采配', d:'アクティブのあと、ゲージが一番多い味方のゲージ+{v}', v:[20,40]},
    {id:'stillStrong', nm:'老いてなお', d:'自分のHPが満タンのとき攻撃+{v}%', v:[20,40]},
    {id:'kingReturn', nm:'王の帰還', d:'味方が動くたび「采配」+1。12で味方全員の攻撃+{v}%（2ターン）とゲージ+30', v:[20,40], need:12, stack:'采配'},
    {id:'noFlee', nm:'逃げない王', d:'致命傷を1度だけHP1で耐え、味方全員の攻撃+{v}%（2ターン）', v:[20,40]},
    {id:'regret', nm:'四十年の悔い', d:'仲間が倒れると、味方全員の被ダメージ−{v}%（2ターン）', v:[15,30]}] },

'ピピ':{ pow:1.0, role:'攻撃', theme:'まねして、追いつき、追いこす', rare:4,
 N:[{nm:'木の剣', d:'前の敵を叩く（{m}）', k:'atk', tgt:'front', m:[1.0,1.4], r3:{cr:10}, r3d:'会心率+10%', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'まねっこ', d:'前に動いた味方の通常攻撃を、威力{mimicN%}でまねる', k:'atk', tgt:'front', m:1, mimicN:[0.6,1.0], r3:{gSelf:10}, r3d:'ゲージ+10', r5:{mimicN:1.2}, r5d:'威力120%に'},
    {nm:'勇者ごっこ', d:'前の敵に{m}＋自分の攻撃+5%（戦闘中、最大+50%）', k:'atk', tgt:'front', m:[0.8,1.2], selfStack:5, r3:{selfStack:8}, r3d:'+8%に', r5:{gSelf:10}, r5d:'ゲージ+10'}],
 A:[{nm:'勇者のまね', d:'直前に味方が使ったアクティブを、威力{mimic%}でまねる（なければ1体に300%）', k:'atk', tgt:'high', m:3.0, mimic:[0.7,1.2], tag:'ボス', r3:{gSelf:20}, r3d:'ゲージ+20', r5:{mimic:1.5}, r5d:'威力150%に'},
    {nm:'ぼくも勇者', d:'HPが一番多い敵に光の剣（{m}）', k:'atk', tgt:'high', el:'light', m:[3.4,6.0], tag:'ボス', r3:{xAnyAtkUp:1.3}, r3d:'攻撃アップ中の味方がいれば1.3倍', r5:{sc:1}, r5d:'かならず会心'},
    {nm:'みんなを守る', d:'味方全員に盾（自分の最大HPの{shHp}%）＋攻撃+15%（2ターン）', k:'shield', tgt:'all', shHp:[10,20], pAtk:{pct:15,t:2}, tag:'守る', r3:{pG:10}, r3d:'ゲージ+10も', r5:{shHp:30}, r5d:'盾が30%に'}],
 P:[{id:'growing', nm:'伸びざかり', d:'ターンが進むたび攻撃+{v}%（最大+60%）', v:[3,6]},
    {id:'admire', nm:'あこがれ', d:'アルトかレオンがアクティブを使うと、ゲージ+{v}', v:[20,40]},
    {id:'spirit', nm:'負けん気', d:'攻撃を受けるたび攻撃+{v}%（戦闘中）', v:[4,8]},
    {id:'nextEra', nm:'次の時代', d:'味方がアクティブを使うたび「夢」+1。4つでHPが一番多い敵に{v%}の一撃（かならず会心）', v:[3.5,5.5], need:4, stack:'夢'},
    {id:'innocent', nm:'無邪気', d:'状態異常にかかりにくい（+{v}%）', v:[30,100]},
    {id:'heroEgg', nm:'勇者の卵', d:'自分がもらう経験値+{v}%', v:[30,60]}] },

'ザガン':{ pow:0.97, role:'攻撃', theme:'戦うほど覚え、強くなる', rare:4,
 N:[{nm:'大斧', d:'前の敵に{m}。同じ敵を続けて攻撃するたび+8%（戦闘中）', k:'atk', tgt:'front', m:[1.0,1.4], focus:8, r3:{focus:12}, r3d:'+12%に', r5:{gSelf:10}, r5d:'ゲージ+10'},
    {nm:'黒将の威圧', d:'前の敵に{m}＋敵全員の攻撃ダウン', k:'atk', tgt:'front', m:[0.8,1.2], allDown:1, r3:{tauntSelf:1}, r3d:'自分に挑発（1ターン）', r5:{gSelf:15}, r5d:'ゲージ+15'},
    {nm:'斬り返し', d:'攻撃せず構え、次に受けた攻撃に{ctr%}で反撃', k:'stance', ctr:[2.0,3.0], once:1, noTaunt:1, r3:{ctrAll:1}, r3d:'反撃が敵全員に', r5:{gSelf:30}, r5d:'ゲージ+30'}],
 A:[{nm:'黒将の一撃', d:'HPが一番多い敵に{m}。覚え1つにつき+10%', k:'atk', tgt:'high', m:[4.0,6.5], xLearn:0.1, tag:'ボス', r3:{idef:0.3}, r3d:'防御を30%無視', r5:{sc:1}, r5d:'かならず会心'},
    {nm:'魔軍の進撃', d:'敵全員に{m}＋自分に挑発（2ターン）', k:'atk', tgt:'all', m:[2.0,3.2], tauntSelf:2, tag:'雑魚', r3:{cutSelf:30}, r3d:'挑発中の被ダメージ−30%', r5:{kG:20}, r5d:'倒した数×ゲージ+20'},
    {nm:'三度目の正直', d:'HPが一番多い敵に、覚え1つにつき{xLearnAll%}のダメージ（最低300%）', k:'atk', tgt:'high', m:3.0, xLearnAll:[0.6,1.0], tag:'ボス', r3:{gSelf:20}, r3d:'ゲージ+20', r5:{sc:1}, r5d:'かならず会心'}],
 P:[{id:'learn', nm:'学習', d:'攻撃を受けるたび「覚え」+1（最大10）。覚え1つにつき被ダメージ−{v}%・攻撃+{v}%', v:[3,5]},
    {id:'remember', nm:'忘れない', d:'前の戦闘と同じ種類の敵への攻撃+{v}%', v:[20,40]},
    {id:'generalPride', nm:'黒将の誇り', d:'HP50%以上のとき被ダメージ−{v}%', v:[15,30]},
    {id:'thirdTime', nm:'三度目', d:'同じ敵を3回攻撃するたび、その敵に{v%}の追撃', v:[3.0,5.0]},
    {id:'warlord', nm:'魔軍の将', d:'味方全員の攻撃+{v}%', v:[8,15]},
    {id:'undying2', nm:'不滅の黒将', d:'倒れても1度だけHP{v}%で立ち上がる', v:[50,100]}] },

};
// 覚えるLvを付ける
for(const n in KIT){ const K=KIT[n]; K.N.forEach((s,i)=>{s.lv=LV_N[i]; s.kind='N'; s.i=i;}); K.A.forEach((s,i)=>{s.lv=LV_A[i]; s.kind='A'; s.i=i;}); K.P.forEach((s,i)=>{s.lv=LV_P[i]; s.kind='P'; s.i=i;}); }

// ---- 数字の解決 ----
// [a,b]：★1でa、★5でb。整数どうしで差が4以上なら整数に丸める（%など）。[a,b,'i'] は必ず整数（回数など）
function rkv(x,r){ if(!(Array.isArray(x)&&(x.length===2||(x.length===3&&x[2]==='i'))&&typeof x[0]==='number'&&typeof x[1]==='number')) return x; const v=x[0]+(x[1]-x[0])*(r-1)/4;
  return (x[2]==='i' || (Number.isInteger(x[0])&&Number.isInteger(x[1])&&Math.abs(x[1]-x[0])>=4))? Math.round(v) : +v.toFixed(2); }
function rkDeep(o,r){ if(Array.isArray(o)){ const v=rkv(o,r); return v===o? o.map(x=>rkDeep(x,r)) : v; } if(o&&typeof o==='object'){ const z={}; for(const k in o) z[k]=rkDeep(o[k],r); return z; } return o; }
function skillAt(def,r){ const o={...def}; delete o.r3; delete o.r5; if(r>=3&&def.r3) Object.assign(o,def.r3); if(r>=5&&def.r5) Object.assign(o,def.r5); const z=rkDeep(o,r); z.rank=r; z.def=def; return z; }
function fmtNum(v){ return typeof v==='number'? (Number.isInteger(v)? String(v) : String(+v.toFixed(2))) : v; }
function skillText(def,r){ const z=skillAt(def,r);
  return (def.d||'').replace(/\{([\w.]+)(%?)\}/g,(_,p,pc)=>{ let v=z; for(const k of p.split('.')) v=v&&v[k]; return pc? Math.round(v*100)+'%' : fmtNum(v); }); }

// ---- 育ち具合 ----
function kitMember(n){ const m=G.members[n]; if(!m.kit||m.kit.v!==2) m.kit={v:2, n:0, a:0, p:[null,null], rk:{}}; return m.kit; }
function skRank(n,kind,i){ const k=kitMember(n); return k.rk[kind+i]||1; }
function learned(n,kind,i){ const K=KIT[n], m=G.members[n]; if(!K||!m) return false; return m.lv>=K[kind][i].lv; }
// 開いた枠が空なら、覚えたパッシブを自動で入れる（光る石で付け替えられる）
function kitAutoFill(n){ const m=G.members[n], k=kitMember(n), K=KIT[n]; if(!K) return;
  for(let i=0;i<2;i++){ if(m.lv>=SLOT_LV[i] && k.p[i]===null){ const free=K.P.map((p,j)=>j).filter(j=>K.P[j].lv<=m.lv && !k.p.includes(j)); if(free.length) k.p[i]=free[0]; } }
  for(let i=0;i<2;i++){ if(k.p[i]!==null && (m.lv<SLOT_LV[i] || K.P[k.p[i]].lv>m.lv)) k.p[i]=null; }
  if(!learned(n,'N',k.n)) k.n=0; if(!learned(n,'A',k.a)) k.a=0;
}
function normalOf(n){ const K=KIT[n], k=kitMember(n); return skillAt(K.N[k.n], skRank(n,'N',k.n)); }
function activeOf(n){ const K=KIT[n], k=kitMember(n); return skillAt(K.A[k.a], skRank(n,'A',k.a)); }
function equippedPassives(n){ const K=KIT[n]; if(!K||!G.members[n]) return []; kitAutoFill(n); return kitMember(n).p.filter(s=>s!==null).map(j=>skillAt(K.P[j], skRank(n,'P',j))); }
// 戦闘で使うパッシブの値（id → 値）
function passiveMap(n){ const o={}; for(const p of equippedPassives(n)){ o[p.id]=p.v; if(p.v2!==undefined) o[p.id+'2']=p.v2; } return o; }
const RANKJP=r=>'★'+r;
// 能力値に直接効くパッシブ
const P_STATIC={bargain:v=>({dropUp:v}), resolve:v=>({resist:v}), innocent:v=>({resist:v}), dawnWatch:v=>({startGauge:v}), strongArm:v=>({critDmg:v}), swift:v=>({spdPct:v}), prep:v=>({startGauge:v}), wake:v=>({startGauge:v}), foresee:v=>({startGauge:v}), deepWound:v=>({critDmg:v})};

// レベルが上がったときに覚えたこと
function growthNews(n,lv){ const K=KIT[n]; if(!K) return []; const out=[];
  K.N.forEach(s=>{ if(s.lv===lv&&lv>1) out.push(`通常攻撃「${s.nm}」`); });
  K.A.forEach(s=>{ if(s.lv===lv&&lv>1) out.push(`アクティブ「${s.nm}」`); });
  K.P.forEach(s=>{ if(s.lv===lv) out.push(`パッシブ「${s.nm}」`); });
  if(lv===SLOT_LV[0]) out.push('パッシブ枠が開いた');
  if(lv===SLOT_LV[1]) out.push('パッシブ枠が2つになった');
  return out; }
