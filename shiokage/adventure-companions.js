import { adventurePersonal, adventurePairs } from './adventure-companion-scenes.js';

function trial(prompt, choices, succeeds = 0) {
  return { prompt, choices, succeeds };
}

function task(label, scenes, requirements = {}) {
  return { label, scenes, ...requirements };
}

const arrivalByPerson = {
  13:'傾いた小舟にナギが飛び移る。子どもの足が岸に着いてから、自分の剣を拾った。',
  39:'伝言筒を落とした犬がノルの靴ひもを引く。ノルは犬に筒を持たせ、膝へ包帯を巻いた。',
  8:'サラドの帽子が砂へ飛ぶ。拾いに行かず、子どもの前に手のひらほどの砂の窓を作る。',
  36:'ザイラが二本目の鐘まで走る。鐘を鳴らす前に振り返り、転んだ相手へ槍の柄を出す。',
  85:'リエルは弓を下ろし、矢を葦の間に差した。落ちかけた巣が、その矢で止まる。',
  37:'ティノは薬を味見してから窓を開ける。閉めようとした人へ、自分の袖を敷いて渡した。',
  65:'下がる板の間へガレスが盾を差す。続く人の足が全部出るまで手を離さない。',
  94:'橋板が止まる。メクは客の足元へすべり込み、歯車を止めたまま後ろの子を振り返る。',
  32:'家の名札に火が走る。アサギが自分の火文字を踏み消し、紙の裏でそれを覆う。',
  41:'月明かりが差すとレアは一瞬のけぞる。影の側から腕を伸ばし、子どもの薬を拾う。',
  6:'ラーネは白い鎧に泥がついても、膝を曲げて低い段にいる人へ声をかける。',
  7:'荷車が門をふさぐとテイは一度走り去った。誰もいない横口から戻り、車を脇へ呼ぶ。',
  45:'畦が崩れる。バルは濡れた土を片手でつかみ、足元に小さい堤を盛って放した。',
  27:'旗が野菜籠へ落ちる。フィズは謝って全部拾い、地面に寝かせた棒だけで芸を続ける。',
  33:'縄が外れかける。クオは自分の荷を置き、向こうから来た手へ縄の端を返す。',
  54:'風に引かれた本が橋から落ちそうだ。メイリは頁を押さえたまま、そばの子へ渡す。',
  38:'ブラムは割れた家の前へ盾を立てる。重い石は両手で持たず、通りがかった人を呼ぶ。',
  46:'ナチが路地で指輪をつまむ。自分の懐へ入れず、子どもの袋へ戻して口を結ぶ。',
  81:'子どもがキジの角をつかむ。熱いこぶしがそちらへ行かないよう、反対の地面に沈める。',
  42:'子どもが縮こまるとコノエは火を吹き消し、次は自分の靴にだけ明かりを当てる。',
  62:'ヌクは借りた櫂を先に干す。腰まで入った水の中で、小魚が舟から出るのを待つ。',
  110:'ウロが桟橋で盾の背を釘に当てる。潜ろうとする見習いに、手の方を貸してくれと頼む。',
  117:'シルは風で飛んだ手紙を一気に集める。落とした人の顔より、手元の破れた封を先に思い出す。',
  103:'ヴェルは大剣を置き、夜明け前の窓を手で少しだけ開ける。まだ働く人へ椅子を運ぶ。',
  23:'ツノハが斧の家紋を削っている。刃をしまってから、走ってきた子の荷のほうを取る。',
  49:'カイが舟灯を貸す。疑う人がいても、転びかけた舟を支える腕を離さない。',
  67:'ホタルは鳥の真似した声に一度だけ答え、向かってきた人へは先に旗を上げる。',
  15:'カナメが鉄の柱を一回鳴らす。返事が来た途端、剣の背で柱を押さえて音を止める。',
  111:'倉の灯はつかない。ニエは子どもの手を取り、窓板の隙間が向く方を教える。',
  104:'ミラが濡れた荷を拾い、鞘の羽根で刃の水を払う。踏み板の乾いた側へ手を出す。',
  48:'リュネは流れた舟を寄せる。縄は積み荷より先に、帰る人の踏み板へかける。',
  60:'バートは剣ほどの報酬が書かれた紙を閉じ、見習いと同じ高さに膝をつく。',
  106:'ゴドは力比べへ走り出す代わりに、手を低くおろして子どもと重い門を押す。',
  66:'ナオエはへこんだ窓を押し戻す。外へくしゃみをしてから患者のそばで薬箱を開けた。',
  114:'エルドは剣を抜かず、大剣ごと床へ寝かせる。逃げてきた人へそこを越える足の置き方を見せる。',
  35:'朝の港でエナが避難する家族の道を空ける。その人が曲がりきるまで、次の言葉を待った。'
};

function person(designId, id, name, town, title, attribute, art, hello, reply, need, kit) {
  return {
    designId, id, name, town, title, role: title, attribute, art, hello, reply,
    arrival: arrivalByPerson[id], need: { kind: 'adventure', ...need }, adventureKit: kit
  };
}

function strength(role, label, strong, alternate, name, effect, options = {}) {
  const signature = { name, effect, cost: 7, ...options };
  const aid = ['heal', 'guard', 'ward', 'restore', 'strengthen', 'cleanse', 'revive'].includes(effect);
  const power = signature.power ?? 1;
  return {
    role, label, strength: strong, alternate, signature,
    advanced: { name: `${name}・応用`, learn: 40, cost: signature.cost + 12, power: power * 1.18, magnitude: signature.magnitude },
    mastery: { name: `${name}・極意`, learn: 58, cost: signature.cost + 21, power: power * 1.40, target: aid && signature.target === 'ally' ? 'allies' : signature.target }
  };
}

export const adventureRecruits = [
  person('P01', 13, 'ナギ', 'T01', '小舟の護衛', '土', 'craft',
    '先にそっち。舟の名なんか、あとでいい。', '剣を預けても手は空く。その手で、あんたと行くよ。',
    task('小舟の救助を手伝う', [trial('子どもと荷が残ってる。腰縄は一本。どう使う？', ['子どもの腰に結ぶ', '荷を先にくくる'])]),
    strength('guard', '先に受ける剣士', 'defense', 'cut', '受け返し', 'guard', { target: 'ally', magnitude: .67 })),
  person('P03', 39, 'ノル', 'T01', '犬を連れた伝令', '風', 'listen',
    '俺を迎えに来たんだ。こいつの仕事、そっち。', 'その足音ならついて行ける。犬にも聞いてみるよ。',
    task('犬と渡しで落ち合う', [trial('足跡は桟橋に続いてる。犬は笛より、帰りの灯を見つける。', ['灯が届く桟橋へ行く', '笛で遠くから呼ぶ'])], { blocked: 'W04' }),
    strength('stalker', '道具を使う味方を援護', 'speed', 'haste', '短い伝令', 'strengthen', { target: 'ally', magnitude: .36, duration: 3, cost: 5 })),
  person('P04', 8, 'サラド', 'T02', '砂を固める杖使い', '風', 'verify',
    '見える？　走るのは風が一回やんでから。', '帽子を拾う暇くらい、一緒に作れそうね。',
    task('宿の吹き返しを止める', [trial('風が壁に当たって戻るね。板なら、どこに立てよう？', ['風上に開口を向ける', '壁の手前で板を斜めにする'], 1)]),
    strength('channeler', '砂壁で列を守る', 'magicDefense', 'veil', '砂の窓', 'ward', { channel: 'magic', target: 'allies', magnitude: .31, duration: 3, cost: 8 })),
  person('P06', 36, 'ザイラ', 'T02', '鐘まで走る槍使い', '雷', 'duel',
    '手を貸す。次は本気で抜いていい。', 'ありがと。次は、あんたが行き先を選びな。',
    task('二つの鐘を回る', [trial('鐘は二つ。鳴った方から走ろう。風除けの裏も見える？', ['一つ目の鐘で走る', '鳴る前に飛び出す']), trial('二つ目が鳴った。桟は濡れてる！', ['木の桟を跳ぶ', '風除けの裏へ曲がる'], 1)]),
    strength('duelist', '素早く大技を止める', 'attack', 'feint', '待って突く槍', 'stun', { power: 1.16, duration: 1, cost: 8 })),
  person('P07', 85, 'リエル', 'T03', '葦の弓取り', '風', 'listen',
    '獲物はいい。いま止めるのはこっち。', '弓を置いた時も、私がいると思ってね。',
    task('ひなの巣を踏まないで進む', [trial('巣のすぐ下に怪物。葦が動く方を見て。', ['開けた方へ誘う', '巣の脇を駆ける'])], { site: 'R33', mark: 'R33-mark-1', alternativeWin: 'B13' }),
    strength('ranger', '標的を替えて盾を削る', 'accuracy', 'snipe', '目を移す矢', 'shatter', { power: 1.03, magnitude: 2 })),
  person('P08', 37, 'ティノ', 'T03', '窓辺の薬師', '光', 'craft',
    '匂いで僕が止まる。手は動くから、少し開けといて。', '窓さえ開けば平気。診る役は僕が引き受けるよ。',
    task('見本で手当てを試す', [trial('歩き疲れた人と、毒を受けた人がいる。先に疲れた方を頼むよ。', ['食べ物と水を渡す', '解毒の術を使う']), trial('次は毒を受けた人。まだ手がしびれるって。', ['また食べ物を渡す', '解毒の術を使う'], 1)]),
    strength('mender', '毒を解き、傷も手当て', 'magicAttack', 'clean', '窓を開ける手当て', 'heal', { channel: 'magic', target: 'ally', power: 1.85, cleanses: true })),
  person('P10', 65, 'ガレス', 'T04', '昇桟を守る盾持ち', '土', 'craft',
    '急ぐな。いまなら、ここに俺がいる。', '後ろは俺が持つ。見えなくなったら声をくれ。',
    task('避難を終え、盾の支え方を試す', [trial('荷が滑る。下で受ける場所を見てくれ。', ['足場に盾を置いて受ける', '下がる桟の下へ入る'])], { chapter: 'C02', blocked: 'W01' }),
    strength('guard', '大きな一撃を受け切る', 'maxHp', 'brace', '昇桟の大盾', 'guard', { target: 'ally', magnitude: .81, cost: 8 })),
  person('P11', 94, 'メク', 'T04', '昇桟の修理屋', '雷', 'verify',
    '上げないで。いま下がるほうが安全。', '回らない時のことも考える。道具袋、少し場所を空けて。',
    task('水車を止めて板を降ろす', [trial('重りは二つ。片方を上に掛けたよ。もう片方は？', ['同じ段に掛ける', '下の段に掛ける'], 1)]),
    strength('tactician', '留め具で盾を弱らせる', 'accuracy', 'shield', '逆止めの歯', 'shatter', { target:'all', power: .58, magnitude: 2, cost: 9 })),
  person('P13', 32, 'アサギ', 'T05', '火文字の術師', '火', 'verify',
    '書き直せるのは私の字。家の名前は触らないで。', '裏から読む人もいる。次の火は、隣で見てて。',
    task('安全な三面で火を試す', [trial('三つの面がある。熱の逃げない板はどれ？', ['濡れた面', '乾いた石', '人の家の名札'], 1), trial('残りの二面も黒くする必要はない。何秒当てよう？', ['すぐ離す', '赤くなるまで当てる'])], { site: 'R35', mark: 'R35-mark-1' }),
    strength('mage', '火と別属性を重ねる', 'magicAttack', 'circle', '裏返す火文字', 'weaken', { channel:'magic', power:1.26, magnitude:.31, duration:2, attribute:'火' })),
  person('P14', 41, 'レア', 'T05', '夜の解呪師', '闇', 'comfort',
    '灯は落として。そのほうが手当てが早い。', '隣なら、月を見ないで歩けると思う。',
    task('影の戸口で解呪を覚える', [trial('瓶は光でふくらむ。傷には触らず、戸を少し閉めて。', ['影の手で瓶を受ける', '月にかざして瓶を見る'])]),
    strength('mender', '解呪と魔法への備え', 'magicDefense', 'veil', '月陰の守り', 'ward', { channel:'magic', target:'ally', magnitude:.53, duration:3 })),
  person('P16', 6, 'ラーネ', 'T06', '泥を踏む白騎士', '氷', 'craft',
    '勝った話はあとで。あと一人の声を聞きたい。', '足跡は私が戻って見てくる。帰ったら名を呼んで。',
    task('林の戦いで盾を崩した時を話す', [trial('盾を崩す前、立っていたのはどっち？', ['動いた根の外側', '根が出たばかりの真上'])], { chapter:'C03' }),
    strength('guard', '続く味方の物理攻撃を援護', 'defense', 'cut', '白騎士の合図', 'strengthen', { target:'ally', magnitude:.51, duration:2, cost:8 })),
  person('P18', 7, 'テイ', 'T06', '横道を知る走り手', '風', 'listen',
    '今だけ。先に歩いて、俺は最後でいい。', '走って先を見るよ。いなくなったと思ったら声をかけて。',
    task('林の怪物の通り道を見て戻る', [trial('同じ根は二度は戻らない。見張りにどっちと知らせる？', ['足音の消えた横口', '足音を追う正面'])], { site:'R36', mark:'R36-mark-1' }),
    strength('stalker', '敵が狙う一人を先に守る', 'evasion', 'brace', '横口への手引き', 'guard', { target:'ally', magnitude:.52, cost:4 })),
  person('P19', 45, 'バル', 'T07', '土を築く祈り手', '土', 'craft',
    'いい土だ。次の段は素手で止められる人を呼ぼう。', '知らない土があるなら、先に触らせてくれ。',
    task('土を二通りに支える', [trial('崩れそうな土を、まず自分の手でどうする？', ['下から固める', '上の石を抜く']), trial('今度は両手が離れる。術をどこへ残す？', ['人が通る頭の上', '手が届く足元'], 1)]),
    strength('tactician', '土の術で踏ん張りを支える', 'defense', 'ward', '足元の支え', 'ward', {channel:'magic', target:'allies', magnitude:.34, duration:2, cost:6 })),
  person('P21', 27, 'フィズ', 'T07', '旗で風をつかむ曲芸師', '風', 'bargain',
    'うまく行ったふりはしない。次のは本当に見て。', '見てるだけでもいいよ。たまに旗、受け取って。',
    task('風に合わせて三枚の旗を返す', [trial('赤だけがこっちを向いた。最初はどれ？', ['赤い旗', '青い旗']), trial('次に白。最後の色は風が触るまで待つ。', ['白、青の順', '青、白の順'])]),
    strength('stalker', '敵をそらして仲間を強くする', 'evasion', 'fury', '追いかけたくなる旗', 'strengthen', { target:'allies', magnitude:.26, duration:2, cost:8 })),
  person('P22', 33, 'クオ', 'T08', '谷橋の槍衛兵', '土', 'duel',
    '止めてくれたの、あんただった。俺だけが助けたんじゃない。', '渡りきるまでなら、俺の槍を杖にしてくれ。',
    task('水切りの固定足場を確かめる', [trial('張った綱より先に、他の人も立てる場所を見ておきたい。', ['岩の棚へ予備の綱を掛ける', '揺れる板だけで渡る'])], { chapter:'C04', site:'D09', mark:'D09-mark-1', alternativeWin:'B17', blocked:'W03' }),
    strength('guard', '守りと大きな盾割りを切り替える', 'defense', 'brace', '橋を返す槍', 'shatter', { power:1.42, magnitude:3, cost:8 })),
  person('P24', 54, 'メイリ', 'T08', '橋の記し手', '光', 'verify',
    '三行目を読んで。その線でいまの帰り道が分かる。', '本にない道なら、私にも教えて。書いて持ってく。',
    task('音と光で三方向を読む', [trial('北、東、南。声が届くのは北だけ。暗い東へは何を置く？', ['低い灯', '高い風見']), trial('南には灯も届かない。足で分かる目印は？', ['床の縄', '空の旗'])]),
    strength('mage', '安全に属性の弱点を探る', 'maxMp', 'snare', '三つの帰り道', 'shatter', {channel:'magic', power:.85, magnitude:1, attribute:'光', cost:4 })),
  person('P25', 38, 'ブラム', 'T09', '家を支える石工', '土', 'craft',
    '俺の家なんだ。今日だけ、片っぽを持ってくれ。', '手が足りないなら言え。俺もそうする。',
    task('下棚へ無理なく退く', [trial('広い方の岩はまだ揺れる。戻り口はどっちだ。', ['狭いが揺れない段', '大きな岩の下'])], {site:'R42', mark:'R42-mark-1'}),
    strength('guard', '敵の立ち直りからみんなを守る', 'maxHp', 'shield', '岩棚に盾を置く', 'guard', { target:'allies', magnitude:.48, cost:9 })),
  person('P26', 46, 'ナチ', 'T09', '指輪を返す盗賊', '闇', 'shadow',
    '私が取ったと思った？　ひもが切れてただけ。', '落ちた物は、拾った訳まで返さなくていいよね。',
    task('落とし主だけが分かる返し方を選ぶ', [trial('拾い物だって売りに出すと、誰の手にも渡る。この袋をどうしよう？', ['巾着に入れて店主に預ける', '通りで名前を叫ぶ'])]),
    strength('stalker', '短剣の刻みで敵の力を落とす', 'crit', 'toxin', 'ほころびを拾う刃', 'weaken', { power:1.46, magnitude:.40, duration:2, cost:6 })),
  person('P28', 81, 'キジ', 'T10', '拳を熱くする角持ち', '火', 'duel',
    '親は知らない。いま熱いのは俺の手だ。', '熱い方ばかり見てないな。手合わせは旅で頼むよ。',
    task('火を消さず怪物から守る', [trial('ここでは子の方へ火を向けたくない。どう誘い出す？', ['火を背にして一撃で追う', '冷えた石の方へ回る'], 1)], {alternativeWin:'B05'}),
    strength('breaker', '拳に火を重ねる二連撃', 'attack', 'fury', '熱を返す拳', null, { power:1.03, hits:2, attribute:'火', cost:7 })),
  person('P30', 42, 'コノエ', 'T10', '火を見せる魔導士', '火', 'craft',
    '怖がったのを見てた。もう一度はやらない。手元、ここだけ借りるよ。', '小さな火でも見えるものがある。今度は、そっちを旅で探したいな。',
    task('火を二つの術で低く保つ', [trial('蒸気の出る面に火を置いた。次に使うのは？', ['水で温度を落とす', '火をもう一度当てる']), trial('あとは風の向きね。人がいるのはどっち？', ['煙を客席へ送る', '空いた戸へ逃がす'], 1)]),
    strength('mage', '二つの火で敵の力をそらす', 'magicAttack', 'blunt', '舞台を照らす火', 'weaken', { channel:'magic', target:'all', power:.98, magnitude:.27, duration:3, cost:9 })),
  person('P31', 62, 'ヌク', 'T11', '浜で舟を浮かす舟守', '水', 'comfort',
    '先に君ら。水が落ちるまで私は立っとる。', '焦って出るくらいなら乗らん。待てる旅なら一緒に行こう。',
    task('浮いた舟から生き物が出るのを待つ', [trial('舟が浮いた。中にまだ小さいのがいるよ。', ['水を渡って外へ出るまで待つ', '早く走らせるため舟を揺らす'])], {site:'D14',mark:'D14-mark-1',alternativeWin:'B20',blocked:'W04'}),
    strength('mender', '長い戦いで全員を立て直す', 'maxMp', 'renew', '舟べりの手当て', 'heal', { channel:'magic', target:'allies', power:1.18, cost:8 })),
  person('P33', 110, 'ウロ', 'T11', '船を直す海賊', '土', 'bargain',
    'いま欲しいのは拍手でも泳ぎでもない。釘一本、握れるか。', '船に釘があるなら直す。一緒に戦う時は斧だ。',
    task('舟骨の盾を交代で押さえる', [trial('釘を打つ前に盾を押さえる手が一人足りん。', ['代わって盾を押す', '今すぐ一人で釘を打たせる'])], {alternativeWin:'B20'}),
    strength('breaker', '斧で敵の立て直しを遅らせる', 'defense', 'shield', '船釘を抜く斧', 'slow', { power:1.29, magnitude:.34, duration:3, cost:7 })),
  person('P34', 117, 'シル', 'T12', '風を使う配達人', '風', 'bargain',
    '手紙はみんな覚えてる。あなたの目印、よかったら教えて。', 'あなたの向かう方なら覚えたよ。荷物は軽くして行く。',
    task('高い段から昼の帆と夜の灯を見る', [trial('昼は帆を見たから、今は灯。帰る方を知らせて。', ['二つの印が重なる段', '灯が消える方の浜'])], {site:'R46',mark:'R46-mark-1'}),
    strength('tactician', '風で遅れを取り戻す', 'speed', 'clean', '返事を運ぶ風', 'cleanse', { channel:'magic',target:'allies',duration:1,cost:7 })),
  person('P36', 103, 'ヴェル', 'T12', '朝まで働く大剣の護衛', '闇', 'comfort',
    'すまない。眠らないだけで、疲れはするんだ。', '夜の全部は任せなくていい。前半なら私が立つよ。',
    task('安全棚で眠る相手の動きを読む', [trial('床が振れる。次の穴から離れるならどっち？', ['根元の崩れた板', '岩でつながる上の棚'], 1)], {chapter:'C06',site:'D13',mark:'D13-mark-2',alternativeWin:'B44'}),
    strength('guard', '魔法攻撃に耐えて力を返す', 'magicDefense', 'veil', '夜明けまでの構え', 'drain', { channel:'magic', power:1.37,recoil:.12,magnitude:.59,cost:7 })),
  person('P37', 23, 'ツノハ', 'T13', '印を削った山の斧使い', '闇', 'duel',
    '誰の家か聞く前に、どっちへ運ぶんだ。', '家の印はなくても、あんたの道なら分かる。行こう。',
    task('闇の弱点を見切る稽古', [trial('影が先に重くなる。構えるか、飛び込むか？', ['足を止めて斧を構える', '先に正面へ飛び込む'])]),
    strength('breaker', '盾のある相手に斧で弱体', 'attack', 'counter', '削り出す斧', 'shatter', { power:1.29,magnitude:2,cost:6 })),
  person('P38', 49, 'カイ', 'T13', '舟灯を貸す船長', '水', 'bargain',
    '私を疑っていい。灯だけは先に使って。', '貸して帰るつもりだったの。でも、次も一緒に帰りたい。',
    task('戻った舟灯で救助を支度する', [trial('古い灯はもう戻った。今度は先にどこへ置く？', ['人を上げる岸の端', '誰かの部屋の奥'])], {chapter:'C08'}),
    strength('stalker', '狙われた列を水の技で守る', 'speed', 'snipe', '舷の返し波', 'guard', {target:'allies',magnitude:.41,cost:5})),
  person('P40', 67, 'ホタル', 'T14', '鳥の声を聞き分ける術師', '風', 'listen',
    'あっちがよく似てるのは本当。でも返事は一人ずつでいい。', '先に一回、旗を振って。返事を重ねずに歩くから。',
    task('声が反る場所で合図を使い分ける', [trial('声を出すと二つに返る。人には何を見せる？', ['旗を一回振る', '大きな声を重ねる']),trial('次は旗が見えない。足場を踏める音は？', ['安全な岩の短い足音', '鳥の鳴き真似'])], {chapter:'C07',site:'D18',mark:'D18-mark-1',alternativeWin:'B23'}),
    strength('channeler', '音の術で魔法攻撃を弱める', 'magicDefense', 'blunt', '二度返さない声', 'weaken', {channel:'magic',target:'one',power:1.09,magnitude:.47,duration:2,cost:6})),
  person('P42', 15, 'カナメ', 'T14', '小さい歌の剣衛兵', '光', 'craft',
    '聞こえた。大きくは歌わなくていい、いまのでいい。', '僕の声が聞こえたら、一度返事して。それで着いていける。',
    task('洞で剣と魔法を切り替えた手を思い出す', [trial('鉄に刃が返された時は、同じ手をもう一度？', ['術に切り替える', '同じ刃を続ける'])], {chapter:'C07',site:'D16',mark:'D16-mark-1'}),
    strength('guard', '盾も弱体も一手で崩せる', 'defense', 'clean', '小さな反響', 'shatter', {power:1.34,magnitude:2,cost:7})),
  person('P44', 111, 'ニエ', 'T15', '灯を試す雷の術師', '雷', 'verify',
    '私もつかない火を知ってる。今夜の道は、これで見える。', 'つかなかったら声を呼んで。待つ場所はこっちにある。',
    task('倉の灯と返事の方を確かめる', [trial('灯を動かした。声は同じ窓からした。それで分かるのは？', ['灯と声は別に動く', '死者が倉へ帰ってきた'])], {chapter:'C08'}),
    strength('mage', '雷の準備で味方の気力を戻す', 'maxMp', 'spring', '雷灯の助け', 'restore', {channel:'magic',target:'ally',power:23,cost:8})),
  person('P45', 104, 'ミラ', 'T15', '氷の短剣を持つ斥候', '氷', 'listen',
    'その先は濡れてる。私が通った方からどうぞ。', '顔は出す。あんたが来ない時も帰り道は空けとく。',
    task('使った逃げ口から荷と人を安全に運ぶ', [trial('私が人を上げた場所は狭い。荷と名前、どっちを預かる？', ['荷だけ受け取る', '名前を聞き取って渡す'])], {chapter:'C08',site:'R50',mark:'R50-mark-1'}),
    strength('stalker', '氷の刻みで敵の命中をそらす', 'crit', 'snare', '羽根を払う刃', 'slow', {channel:'magic',power:1.21,magnitude:.47,duration:2,attribute:'氷',cost:7})),
  person('P46', 48, 'リュネ', 'T16', '沖舟を引く水の魔法使い', '水', 'comfort',
    '私が乗らなくても帰したい。足を置けたら知らせて。', '降りる岸は自分で決める。今日は、こっちに立つよ。',
    task('舟を留め、次の岸まで道を確かめる', [trial('舟が戻った。先に積み荷を引けば、板が動く。', ['踏み板の綱を先に留める', '積み荷の綱を先に引く'])], {chapter:'C08',site:'R50',mark:'R50-mark-1',visited:['T19'],blocked:'W05'}),
    strength('channeler', '一人への大打撃を受け流す', 'magicDefense', 'mend', '潮を二つに分ける', 'guard', {channel:'magic',target:'ally',magnitude:.76,cost:8})),
  person('P50', 60, 'バート', 'T17', '契約を読み直す大剣使い', '土', 'bargain',
    'いまは剣を受け取らなくていい。ここ、断れるか一緒に見てくれ。', '降りる時は先に話す。受ける時も、今みたいに言うよ。',
    task('護衛の線と交代口を決める', [trial('若い人に最後の番を任せるなら、何を先に決めたい？', ['断れるのは本人だと書く', '剣を預けるまで黙っておく'])]),
    strength('guard', '味方の攻撃と守りを合わせる', 'attack', 'brace', '引き継ぐ大剣', 'strengthen', {target:'ally',magnitude:.43,duration:3,cost:7})),
  person('P53', 106, 'ゴド', 'T18', '重い門を開く格闘家', '雷', 'duel',
    'こっちで力が要る。終わったら、勝負の台まで一緒に来いよ。', '上がるまで一緒に押せる奴がいると、広いところへ行ける。',
    task('二人で重い門を開ける', [trial('守りの棒を外す時、子が門の近くにいる。', ['背を合わせてから子を下げる', '子を外へ通してから背を合わせる'],1)]),
    strength('breaker', '素手で敵の次の行動を遅らせる', 'attack', 'feint', '門押しの構え', 'slow', {power:1.49,magnitude:.31,duration:2,cost:6})),
  person('P55', 66, 'ナオエ', 'T19', '窓を開ける薬の使い手', '光', 'craft',
    '戦えないと決められる前から薬は作れたよ。まずこの部屋、息ができるようにする。', '傷を見せる前に君の返事を聞くね。私もそうしてもらう。',
    task('回復と解毒を続けて試す', [trial('歩けないくらい疲れた人がいる。手にある薬で何から？', ['体力を戻す薬', '術の使用を促す薬']),trial('次の人は傷よりも毒。先にするのは？', ['傷だけ包む', '毒を抜いて手を洗う'],1)]),
    strength('mender', '治療と状態異常の解除', 'magicDefense', 'clean', '手当ての前の窓', 'heal', {channel:'magic',target:'allies',power:1.23,cleanses:true,cost:11})),
  person('P58', 114, 'エルド', 'T20', '壁と人を守る剣士', '土', 'craft',
    '剣は置く。ここから人を受け取ったら、門の番は誰に頼める？', '二つできるとは言わない。君が頼んだ方を守るよ。',
    task('三方向の傷を避難路から見分ける', [trial('引っかき傷、焦げた壁、潰れた岩。身を置くなら？', ['三つが届かない高い棚', 'いちばん大きい焼け跡'])], {chapter:'C11',site:'D30',mark:'D30-mark-1',endingBlocked:'E3'}),
    strength('guard', '一人の体力を決定的な一撃から守る', 'maxHp', 'brace', '敷いた大剣の向こう', 'guard', {target:'ally',magnitude:.88,cost:11})),
  person('P61', 35, 'エナ', 'T01', '港を守る大剣の護衛', '氷', 'craft',
    '暖かいところに置いて。先に私が行くから。', 'もう黙って決めない。隣にいていいなら、今度は一緒に決めたい。',
    task('港で自分の言葉を交わす', [trial('聞いてほしいの。私がしなかったことを。', ['ここでエナの言葉を待つ', '許してもらうよう先に頼む'])], {postEna:true}),
    strength('breaker', '受けた力を味方の攻撃へ返す', 'maxHp', 'brace', '雪解けの背', 'strengthen', {target:'ally',magnitude:.46,duration:3,cost:7}))
];

export const adventurePersonById = new Map(adventureRecruits.map(person => [person.id, person]));
export const adventureKits = Object.fromEntries(adventureRecruits.map(person => [person.id, person.adventureKit]));
export { adventurePersonal, adventurePairs };

export function recruitmentReady(id, state) {
  const person = adventurePersonById.get(Number(id));
  const { adventure = {}, members = [], lost = {}, discovered = {} } = state;
  const { flags = {}, ending, cleared = {}, seen = {} } = adventure;
  if(!person || members.includes(person.id) || lost[person.id]) return false;
  const need = person.need;
  if(need.blocked && flags[need.blocked]) return false;
  if(need.endingBlocked && ending === need.endingBlocked) return false;
  if(need.postEna) return (ending === 'E1' || ending === 'E2') && !!flags.heardEna && !['W02','W03','W04'].some(flag => flags[flag]);
  if(need.chapter && !flags[need.chapter]) return false;
  const arrived = site => discovered[site] || seen[site] || state.map === site;
  if(need.visited?.some(site => !arrived(site))) return false;
  if(need.alternativeWin && cleared[need.alternativeWin]) return true;
  if(need.mark) return Boolean(seen[need.mark]);
  return !need.site || Boolean(arrived(need.site));
}

export function chapterDepartures(flags, ending, guardianId) {
  const departures = new Map();
  if(flags.W01) departures.set(65, '舟を待たなかったことを知り、盾を置いた。');
  if(flags.W03) departures.set(33, '避難所の火を奪ったと知り、谷へ戻った。');
  if(flags.W04) {
    departures.set(39, '傷ついた魔物のことを聞き、犬と道を分けた。');
    departures.set(62, '岸に縄を残して旅を去った。');
  }
  if(flags.W05) departures.set(48, '救助舟を失い、見越浜に残った。');
  if(ending === 'E2' && [33,48].includes(guardianId)) departures.set(guardianId,'自分で引き受けた役目のため沖に残った。');
  if(ending === 'E3') departures.set(114,'大剣を持ち、門を出ていった。');
  return departures;
}

export function adventureEpisodeReady(episode, state) {
  const {flags = {}, ending, chapter = 1} = state.adventure ?? {};
  if(!episode || episode.post && !ending || episode.beforeEnding && ending || episode.after && !flags[episode.after]) return false;
  return episode.members.every(id => {
    if(episode.temporaryEna && id === 35) return chapter >= 2 && chapter <= 8;
    return state.members?.includes(id) && !state.lost?.[id];
  });
}
