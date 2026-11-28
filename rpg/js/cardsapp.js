"use strict";
// ===== 札の卓（試作） =====
const RARE=["","#cfcfcf","#56b35a","#4a90e2","#a66ad8","#e8b93c","#fff"];
const base=id=>String(id).split("|")[0];
const KIND_NM={"魔物":"魔物の札","色違い":"色違いの札","光る":"光る札","人物":"人物の札","限定":"限定の札"};
const KEY="rpgCards1";
// ---------- このRPGの世界の札（物語に出てくる魔物と人だけ。試作の240枚は使わない） ----------
// n＝上・右・下・左の数字。★1は合計13前後、★2は16、★3は21、★4は25
const WORLD={
  w_koromochi:{nm:"コロモチ",r:1,n:[3,3,3,4],src:"img/m_koromochi.png",sz:[26,20],k:"魔物"},
  w_kawauso:{nm:"カワウソ盗",r:1,n:[5,5,2,1],src:"img/monster_131.png",sz:[24,22],k:"魔物"},
  w_mizugumo:{nm:"ミズグモ",r:1,n:[2,5,4,2],src:"img/m_mizugumo.png",sz:[57,40],k:"魔物"},
  w_donguri:{nm:"ドングリ兵",r:1,n:[4,2,3,4],src:"img/monster_130.png",sz:[23,30],k:"魔物"},
  w_fukuro:{nm:"見張りのフクロウ",r:1,n:[3,4,2,4],src:"img/monster_112.png",sz:[22,30],k:"魔物"},
  w_hane:{nm:"ハネネズミ",r:1,n:[5,2,5,1],src:"img/monster_132.png",sz:[20,22],k:"魔物"},
  w_kakashi:{nm:"カカシ番",r:2,n:[2,6,5,3],src:"img/monster_088.png",sz:[65,70],k:"魔物"},
  w_ookami:{nm:"モリオオカミ",r:2,n:[6,4,2,4],src:"img/m_ookami.png",sz:[56,45],k:"魔物"},
  w_oya:{nm:"オヤミズグモ",r:3,n:[4,7,6,4],src:"img/monster_134.png",sz:[89,70],k:"魔物"},
  w_ishikoro:{nm:"イシコロ小僧",r:1,n:[3,4,4,2],src:"img/monster_133.png",sz:[35,35],k:"魔物"},
  w_tsuta:{nm:"ツタ鎧",r:2,n:[5,3,6,2],src:"img/monster_005.png",sz:[37,72],k:"魔物"},
  w_garm:{nm:"石橋のガルム",r:4,n:[7,5,7,6],src:"img/c_garm.png",sz:[44,59],k:"魔物"},
  w_nushi:{nm:"ヌシガエル",r:4,n:[5,6,8,6],src:"img/monster_135.png",sz:[89,90],k:"魔物"},
  w_bram:{nm:"脱走騎士",r:3,n:[6,6,5,4],src:"img/c_bram.png",sz:[42,59],k:"人物"},
  w_teo:{nm:"見習い剣士",r:2,n:[5,4,3,4],src:"img/c_teo.png",sz:[32,59],k:"人物"},
  w_rinka:{nm:"拳法娘",r:2,n:[6,3,3,4],src:"img/c_rinka.png",sz:[35,59],k:"人物"},
  w_toraji:{nm:"船着きの見張り",r:2,n:[3,5,5,3],src:"img/c_toraji.png",sz:[34,58],k:"人物"},
  w_seri:{nm:"猟師の娘",r:2,n:[4,6,2,4],src:"img/c_seri.png",sz:[33,58],k:"人物"},
  w_poruka:{nm:"貸本屋の娘",r:2,n:[2,4,6,4],src:"img/c_poruka.png",sz:[34,58],k:"人物"},
  w_komari:{nm:"森のいたずらっ子",r:2,n:[5,2,4,5],src:"img/c_komari.png",sz:[37,49],k:"人物"},
  w_nat:{nm:"旅の機械いじり",r:2,n:[3,3,5,5],src:"img/c_nat.png",sz:[41,58],k:"人物"},
  w_karin:{nm:"鐘つき見習い",r:2,n:[4,4,4,4],src:"img/c_karin.png",sz:[39,59],k:"人物"},
  w_mugiwara:{nm:"ムギワラ坊",r:1,n:[4,3,3,3],src:"img/monster_136.png",sz:[31,35],k:"魔物"},
  w_kamausagi:{nm:"カマウサギ",r:1,n:[5,4,1,3],src:"img/monster_003.png",sz:[40,45],k:"魔物"},
  w_fusha:{nm:"フウシャ虫",r:2,n:[3,6,2,5],src:"img/monster_082.png",sz:[35,35],k:"魔物"},
  w_doro:{nm:"ドロ人形",r:2,n:[6,2,6,2],src:"img/monster_031.png",sz:[72,70],k:"魔物"},
  w_hakamori:{nm:"ハカモリ鴉",r:1,n:[4,4,2,3],src:"img/monster_037.png",sz:[31,30],k:"魔物"},
  w_rousoku:{nm:"ロウソク霊",r:2,n:[2,5,5,4],src:"img/monster_007.png",sz:[22,35],k:"魔物"},
  w_sekkan:{nm:"石棺ヤドカリ",r:2,n:[6,2,3,5],src:"img/monster_138.png",sz:[27,30],k:"魔物"},
  w_shishi:{nm:"双頭の石獅子",r:4,n:[7,6,6,6],src:"img/monster_139.png",sz:[88,75],k:"魔物"},
  w_honeban:{nm:"ホネ番兵",r:2,n:[5,5,3,3],src:"img/monster_035.png",sz:[43,70],k:"魔物"},
  w_rizeria:{nm:"王女リゼリア",r:4,n:[6,8,5,6],src:"img/c_rizeria.png",sz:[31,64],k:"人物"},
  w_hanna:{nm:"木こり娘",r:3,n:[7,6,3,5],src:"img/c_hanna.png",sz:[39,58],k:"人物"},
  w_sig:{nm:"黒外套の隊長",r:3,n:[7,4,6,4],src:"img/c_sig2.png",sz:[41,59],k:"人物"},
  w_vald:{nm:"宰相",r:4,n:[5,7,6,7],src:"img/c_vald.png",sz:[33,59],k:"人物"},
  w_edmon:{nm:"慈王",r:4,n:[4,8,7,6],src:"img/c_edmon.png",sz:[41,58],k:"人物"},
  w_shoki:{nm:"役場の書記",r:1,n:[2,4,3,5],src:"img/c_shoki.png",sz:[33,59],k:"人物"},
  w_kai:{nm:"渡し守",r:3,n:[6,5,4,6],src:"img/c_kai.png",sz:[35,59],k:"人物"},
  w_iei:{nm:"渡し守（遺影）",r:3,n:[5,6,5,5],src:"img/c_iei.png",sz:[34,59],k:"人物"},
  w_jako:{nm:"泣き屋のジャコ",r:3,n:[6,4,5,6],src:"img/c_jako.png",sz:[36,59],k:"人物"},
  w_gonzo:{nm:"胴元ゴンゾ",r:3,n:[7,5,4,5],src:"img/c_gonzo.png",sz:[38,59],k:"人物"},
  w_sekimori:{nm:"東の関守",r:2,n:[3,6,5,2],src:"img/c_sekimori.png",sz:[32,58],k:"人物"},
  w_tomon:{nm:"東門の門番",r:1,n:[4,4,3,2],src:"img/c_tomon.png",sz:[35,58],k:"人物"},
  w_nakiya:{nm:"泣き屋",r:1,n:[3,3,4,3],src:"img/c_nakiya.png",sz:[34,58],k:"人物"},
  w_akamugi:{nm:"アカムギ蛇",r:1,n:[4,2,3,4],src:"img/m_akamugi.png",sz:[32,30],k:"魔物"},
  w_margo:{nm:"大頭取マルゴ",r:4,n:[7,6,6,6],src:"img/c_margo.png",sz:[38,58],k:"人物"},
  w_aster:{nm:"勇者アスター",r:4,n:[8,6,5,6],src:"img/c_aster.png",sz:[34,58],k:"人物"},
  w_gina:{nm:"闘技場の受付",r:2,n:[4,5,3,4],src:"img/c_gina.png",sz:[33,59],k:"人物"},
  w_shokanban:{nm:"商館の番人",r:2,n:[5,6,2,3],src:"img/c_shokanban.png",sz:[40,58],k:"人物"},
  w_tobakuban:{nm:"賭場の番人",r:2,n:[6,3,4,3],src:"img/c_tobakuban.png",sz:[36,58],k:"人物"},
  w_taisho:{nm:"隊商の男",r:1,n:[3,4,3,3],src:"img/c_taisho.png",sz:[40,59],k:"人物"},
  w_mizuuri:{nm:"水売りの娘",r:1,n:[2,4,4,3],src:"img/c_mizuuri.png",sz:[33,59],k:"人物"},
  w_ryogae:{nm:"両替商",r:1,n:[3,3,3,4],src:"img/c_ryogae.png",sz:[31,58],k:"人物"},
  w_tsubo:{nm:"壺振り",r:2,n:[4,4,4,4],src:"img/c_tsubo.png",sz:[37,59],k:"人物"},
  w_keihin:{nm:"景品係",r:1,n:[3,3,4,3],src:"img/c_keihin.png",sz:[33,59],k:"人物"},
  w_hagewashi:{nm:"ハゲワシ僧",r:2,n:[5,3,5,4],src:"img/monster_047.png",sz:[56,35],k:"魔物"},
  w_sunaningyo:{nm:"砂人形",r:2,n:[6,6,2,2],src:"img/m_sunaningyo.png",sz:[72,70],k:"魔物"},
  w_miira:{nm:"ミイラ猫",r:2,n:[4,5,3,5],src:"img/monster_143.png",sz:[36,30],k:"魔物"},
  w_koganegai:{nm:"コガネガイ",r:3,n:[7,5,4,5],src:"img/m_koganegai.png",sz:[48,40],k:"魔物"},
  w_zazan:{nm:"大砂蟲ザザーン",r:4,n:[8,7,5,7],src:"img/monster_024.png",sz:[59,70],k:"魔物"},
  w_tozoku:{nm:"岩窟の盗賊",r:1,n:[4,3,4,3],src:"img/c_tozoku.png",sz:[35,58],k:"人物"},
  w_sasha:{nm:"砂蠍のサーシャ",r:4,n:[7,5,7,6],src:"img/c_sasha.png",sz:[36,59],k:"人物"},
  w_rojin:{nm:"谷の老人",r:1,n:[2,3,4,4],src:"img/c_rojin.png",sz:[40,59],k:"人物"},
  w_fukumen:{nm:"覆面の買い手",r:3,n:[6,6,6,3],src:"img/c_fukumen.png",sz:[40,59],k:"人物"},
  w_dreg:{nm:"片鉤のドレッグ",r:4,n:[8,5,6,6],src:"img/c_dreg.png",sz:[45,59],k:"人物"},
  w_kaizoku:{nm:"入り江の海賊",r:2,n:[5,4,4,4],src:"img/c_kaizoku.png",sz:[41,59],k:"人物"},
  w_yakunin:{nm:"港の役人",r:1,n:[3,4,4,2],src:"img/c_yakunin.png",sz:[37,59],k:"人物"},
  w_ryoshi:{nm:"年寄りの漁師",r:1,n:[2,4,3,4],src:"img/c_ryoshi.png",sz:[40,59],k:"人物"},
  w_okamiS:{nm:"酒場の女将",r:2,n:[6,3,5,3],src:"img/c_okamis.png",sz:[38,58],k:"人物"},
  w_uouri:{nm:"魚売り",r:1,n:[4,3,2,4],src:"img/c_uouri.png",sz:[33,59],k:"人物"},
  w_todai:{nm:"灯台守",r:2,n:[3,5,4,5],src:"img/c_todai.png",sz:[42,58],k:"人物"},
  w_minarai:{nm:"船大工の見習い",r:1,n:[3,3,4,3],src:"img/c_minarai.png",sz:[29,50],k:"人物"},
  w_hatch:{nm:"船大工ハッチ",r:2,n:[5,5,3,4],src:"img/c_hatch.png",sz:[37,59],k:"人物"},
  w_suifu:{nm:"水夫頭",r:2,n:[6,4,4,3],src:"img/c_suifu.png",sz:[40,59],k:"人物"},
  w_gaikotsu:{nm:"海賊ガイコツ",r:2,n:[5,4,3,5],src:"img/m_gaikotsu.png",sz:[43,70],k:"魔物"},
  w_fujitsubo:{nm:"フジツボ岩男",r:2,n:[3,7,4,3],src:"img/m_fujitsubo.png",sz:[84,90],k:"魔物"},
  w_yadokahou:{nm:"ヤドカリ砲",r:2,n:[6,2,5,3],src:"img/monster_146.png",sz:[36,35],k:"魔物"},
  w_tobiuo:{nm:"トビウオ槍",r:1,n:[5,2,2,3],src:"img/monster_145.png",sz:[51,35],k:"魔物"},
  w_kurage:{nm:"クラゲ提灯",r:1,n:[2,4,4,2],src:"img/monster_086.png",sz:[33,40],k:"魔物"},
  w_kamome:{nm:"カモメ団",r:1,n:[4,3,1,4],src:"img/monster_026.png",sz:[37,30],k:"魔物"},
  w_utsubo:{nm:"大ウツボ",r:4,n:[7,8,5,6],src:"img/m_utsubo.png",sz:[114,95],k:"魔物"},
  w_mifa:{nm:"神託の巫女ミーファ",r:4,n:[6,8,6,7],src:"img/c_mifa.png",sz:[36,58],k:"人物"},
  w_ordo:{nm:"大司教オルド",r:3,n:[5,6,6,5],src:"img/c_ordo.png",sz:[32,58],k:"人物"},
  w_riko:{nm:"司書見習いリコ",r:1,n:[3,4,3,3],src:"img/c_riko.png",sz:[28,50],k:"人物"},
  w_monso:{nm:"門の僧",r:1,n:[3,3,4,3],src:"img/c_monso.png",sz:[31,58],k:"人物"},
  w_kairouso:{nm:"回廊の僧",r:2,n:[4,5,3,5],src:"img/c_kairouso.png",sz:[31,58],k:"人物"},
  w_junreiM:{nm:"巡礼の男",r:1,n:[3,3,3,4],src:"img/c_junreim.png",sz:[37,59],k:"人物"},
  w_junreiF:{nm:"巡礼の女",r:1,n:[4,3,3,3],src:"img/c_junreif.png",sz:[38,58],k:"人物"},
  w_hoshigashi:{nm:"星菓子売り",r:1,n:[2,5,3,3],src:"img/c_hoshigashi.png",sz:[40,59],k:"人物"},
  w_kanetsukiS:{nm:"鐘つきの老僧",r:2,n:[5,3,5,4],src:"img/c_kanetsukis.png",sz:[40,59],k:"人物"},
  w_seitonoko:{nm:"聖都の子",r:1,n:[4,2,4,3],src:"img/c_seitonoko.png",sz:[40,47],k:"人物"},
  w_junreigani:{nm:"巡礼ガニ",r:1,n:[4,4,2,3],src:"img/monster_025.png",sz:[41,30],k:"魔物"},
  w_shirayuri:{nm:"白百合の精",r:2,n:[3,4,5,4],src:"img/monster_147.png",sz:[19,25],k:"魔物"},
  w_kanetsuki:{nm:"鐘つきコウモリ",r:1,n:[4,2,4,3],src:"img/monster_015.png",sz:[63,30],k:"魔物"},
  w_irogarasu:{nm:"色硝子蝶",r:2,n:[5,3,4,4],src:"img/monster_148.png",sz:[41,30],k:"魔物"},
  w_inoriseki:{nm:"祈り石像",r:3,n:[4,7,6,4],src:"img/monster_058.png",sz:[32,70],k:"魔物"},
  w_rouko:{nm:"蝋涙コロモチ",r:1,n:[3,4,3,2],src:"img/m_rouko.png",sz:[20,20],k:"魔物"},
  w_shugozo:{nm:"沈黙の守護像",r:4,n:[7,6,7,7],src:"img/monster_065.png",sz:[87,70],k:"魔物"},
  w_seiei:{nm:"黒外套の精鋭",r:3,n:[6,5,5,6],src:"img/monster_077.png",sz:[52,70],k:"魔物"},
  w_tetsuken:{nm:"鉄の番犬",r:2,n:[5,4,3,4],src:"img/monster_079.png",sz:[54,45],k:"魔物"},
  w_fuurou:{nm:"封蝋コウモリ",r:1,n:[3,4,3,3],src:"img/m_fuurou.png",sz:[55,29],k:"魔物"},
  w_kurohei:{nm:"黒外套の兵",r:1,n:[4,3,3,3],src:"img/monster_018.png",sz:[42,70],k:"魔物"},
  w_kerbe:{nm:"三つ首の鉄犬ケルベ",r:4,n:[7,7,6,7],src:"img/m_kerbe.png",sz:[126,90],k:"魔物"},
  w_oswald:{nm:"騎士団長オズワルド",r:3,n:[6,5,5,5],src:"img/c_oswald.png",sz:[40,58],k:"人物"},
  w_kishi:{nm:"王城の騎士",r:1,n:[4,3,3,3],src:"img/c_kishi.png",sz:[35,58],k:"人物"},
  w_teishin:{nm:"廷臣",r:1,n:[2,4,3,4],src:"img/c_teishin.png",sz:[31,58],k:"人物"},
  w_yukiusagi:{nm:"ユキウサギ兵",r:1,n:[3,3,4,3],src:"img/m_yukiusagi.png",sz:[40,41],k:"魔物"},
  w_shimofuri:{nm:"シモフリ狼",r:2,n:[5,3,4,4],src:"img/monster_054.png",sz:[71,45],k:"魔物"},
  w_yukidaruma:{nm:"雪だるま親方",r:2,n:[3,5,5,3],src:"img/monster_098.png",sz:[50,45],k:"魔物"},
  w_kogoe:{nm:"凍えた兵",r:1,n:[4,3,2,4],src:"img/monster_039.png",sz:[44,70],k:"魔物"},
  w_tsurara:{nm:"ツララ蜘蛛",r:2,n:[4,4,4,4],src:"img/m_tsurara.png",sz:[57,40],k:"魔物"},
  w_shirokuma:{nm:"白熊武者",r:3,n:[6,6,4,5],src:"img/monster_052.png",sz:[106,90],k:"魔物"},
  w_hyouga:{nm:"氷河ムカデ",r:4,n:[7,6,7,7],src:"img/m_hyouga.png",sz:[79,40],k:"魔物"},
  w_senken:{nm:"先遣隊の兵",r:1,n:[4,4,3,2],src:"img/monster_070.png",sz:[65,70],k:"魔物"},
  w_toride:{nm:"砦の兵",r:1,n:[3,4,3,3],src:"img/c_toride.png",sz:[35,58],k:"人物"},
  w_bolts:{nm:"炊事兵ボルツ",r:2,n:[3,5,4,4],src:"img/c_bolts.png",sz:[37,59],k:"人物"},
  w_toby:{nm:"新兵トビー",r:2,n:[5,3,3,5],src:"img/c_toby.png",sz:[33,58],k:"人物"},
  w_nel:{nm:"ミルナのネル",r:1,n:[2,4,4,3],src:"img/c_nel.png",sz:[38,58],k:"人物"},
  w_elma:{nm:"魔術師エルマ",r:4,n:[7,5,7,6],src:"img/c_elma.png",sz:[38,58],k:"人物"},
  w_rokka:{nm:"槍騎士ロッカ",r:3,n:[5,6,5,5],src:"img/c_rokka.png",sz:[31,58],k:"人物"},
  w_gerd:{nm:"先遣隊長ゲルト",r:3,n:[6,5,4,6],src:"img/c_gerd.png",sz:[42,58],k:"人物"},
  w_dag:{nm:"坑夫頭ダグ",r:2,n:[4,5,4,3],src:"img/c_dag.png",sz:[40,59],k:"人物"},
  w_nii:{nm:"半鬼の子ニィ",r:3,n:[5,4,6,6],src:"img/c_nii.png",sz:[39,59],k:"人物"},
  w_mogura:{nm:"坑道モグラ",r:3,n:[6,6,5,4],src:"img/monster_023.png",sz:[131,90],k:"魔物"},
  w_kageboushi:{nm:"カゲボウシ",r:1,n:[3,3,4,4],src:"img/monster_066.png",sz:[34,45],k:"魔物"},
  w_yakou:{nm:"夜光キノコ",r:1,n:[2,4,4,3],src:"img/m_yakou.png",sz:[28,30],k:"魔物"},
  w_kagee:{nm:"影絵の鹿",r:2,n:[5,3,4,4],src:"img/monster_149.png",sz:[27,45],k:"魔物"},
  w_yamibotaru:{nm:"闇ボタル",r:1,n:[3,4,3,3],src:"img/monster_064.png",sz:[36,30],k:"魔物"},
  w_kibasen:{nm:"キバ戦士",r:2,n:[5,4,3,4],src:"img/m_kibasen.png",sz:[76,45],k:"魔物"},
  w_tsukihoe:{nm:"月吠え狼",r:2,n:[4,4,5,3],src:"img/m_tsukihoe.png",sz:[56,45],k:"魔物"},
  w_takahei:{nm:"風切り鷹兵",r:2,n:[4,3,4,5],src:"img/monster_090.png",sz:[72,65],k:"魔物"},
  w_raichou:{nm:"雷鳥",r:3,n:[5,5,5,6],src:"img/m_raichou.png",sz:[68,45],k:"魔物"},
  w_ferga:{nm:"牙の長フェルガ",r:4,n:[8,6,6,7],src:"img/c_ferga.png",sz:[43,58],k:"人物"},
  w_shuri:{nm:"翼の長シュリ",r:4,n:[7,7,6,7],src:"img/m_shuri.png",sz:[72,65],k:"魔物"},
  w_orgo:{nm:"留守居のオルゴ",r:3,n:[4,7,6,4],src:"img/monster_005.png",sz:[37,72],k:"魔物"},
  w_nene:{nm:"森の婆ネネ",r:4,n:[6,7,7,6],src:"img/c_nene.png",sz:[38,59],k:"人物"},
  w_kitanoko:{nm:"北の子",r:1,n:[3,3,3,4],src:"img/c_kitanoko.png",sz:[38,59],k:"人物"},
  w_rolo:{nm:"牙の若衆ロロ",r:2,n:[5,4,3,4],src:"img/m_rolo.png",sz:[76,45],k:"魔物"},
  w_kana:{nm:"翼の語り部カナ",r:2,n:[3,5,4,4],src:"img/c_kana.png",sz:[44,59],k:"人物"},
  w_numayamori:{nm:"沼ヤモリ兵",r:2,n:[4,4,4,4],src:"img/m_numayamori.png",sz:[53,70],k:"魔物"},
  w_dokuhebi:{nm:"毒吐き大蛇",r:1,n:[3,3,4,3],src:"img/m_dokuhebi.png",sz:[32,30],k:"魔物"},
  w_dorogame:{nm:"泥亀の盾持ち",r:2,n:[3,6,5,3],src:"img/m_dorogame.png",sz:[63,40],k:"魔物"},
  w_kodaiko:{nm:"小鬼太鼓",r:1,n:[4,3,3,3],src:"img/monster_012.png",sz:[38,45],k:"魔物"},
  w_dohyouoni:{nm:"土俵鬼",r:3,n:[7,5,4,5],src:"img/monster_091.png",sz:[106,90],k:"魔物"},
  w_dara:{nm:"鱗の長ダーラ",r:4,n:[6,8,7,6],src:"img/c_dara.png",sz:[45,59],k:"人物"},
  w_goura:{nm:"角の長ゴウラ",r:4,n:[8,7,6,6],src:"img/c_goura.png",sz:[38,59],k:"人物"},
  w_doro:{nm:"鱗の料理番ドロ",r:2,n:[4,4,4,4],src:"img/m_doro.png",sz:[53,70],k:"魔物"},
  w_donta:{nm:"角の太鼓打ちドン太",r:2,n:[5,3,4,4],src:"img/m_donta.png",sz:[38,45],k:"魔物"},
  w_mondou:{nm:"問答好きの蛙",r:2,n:[3,5,5,3],src:"img/m_mondou.png",sz:[89,90],k:"魔物"},
  w_kuuza:{nm:"空の玉座",r:4,n:[7,7,7,7],src:"img/c_gyokuza.png",sz:[30,40],k:"魔物"},
  w_kokedaruma:{nm:"コケダルマ",r:1,n:[4,5,2,3],src:"img/monster_094.png",sz:[63,40],k:"魔物"},
  w_yonaki:{nm:"ヨナキフクロウ",r:1,n:[3,2,5,4],src:"img/m_yonaki.png",sz:[22,30],k:"魔物"},
  w_shinin:{nm:"死人の行軍",r:5,n:[8,9,9,8],src:"img/c_shinin.png",sz:[100,58],k:"人物"},
  w_saomaou:{nm:"棹の魔王",r:5,n:[9,8,8,9],src:"img/c_saomaou.png",sz:[51,67],k:"人物"},
  w_serinin:{nm:"競り人",r:1,n:[4,3,3,3],src:"img/c_serinin.png",sz:[42,58],k:"人物"},
  w_sunamogu:{nm:"スナモグリ",r:2,n:[6,5,2,3],src:"img/m_sunamogu.png",sz:[131,90],k:"魔物"},
  w_saboten:{nm:"サボテン拳士",r:2,n:[6,2,4,4],src:"img/monster_142.png",sz:[67,45],k:"魔物"},
  w_sasori:{nm:"サソリ武者",r:2,n:[5,3,6,2],src:"img/monster_046.png",sz:[61,55],k:"魔物"},
  w_kinkoro:{nm:"金のコロモチ",r:3,n:[6,5,5,5],src:"img/m_kinkoro.png",sz:[26,20],k:"魔物"},
  w_muku:{nm:"麦わら帽の子",r:3,n:[5,6,6,4],src:"img/c_muku.png",sz:[41,60],k:"人物"},
};
Object.keys(CARDS).forEach(k=>delete CARDS[k]);
Object.keys(WORLD).forEach((k,i)=>{ CARDS[k]={...WORLD[k],im:k,no:i+1}; IMG[k]=WORLD[k].sz; });
ORDER.length=0; Object.keys(WORLD).forEach(k=>ORDER.push(k));
GLOWS.length=0;
const PRACTICE=new URLSearchParams(location.search).get("practice")==="1"; // 1回目は賭けなしの練習
const artSrc=c=>c.src||`../cards/img/c/${c.im}.png`;
// 最初の札束：トトがくれる2枚と、おまけの札
START.length=0; ["w_kai","w_muku","w_koromochi","w_koromochi","w_kawauso","w_kawauso","w_mizugumo","w_mizugumo","w_donguri","w_donguri"].forEach(c=>START.push(c));
// 相手：0＝札売りのトト（看板はヌシガエル）、1＝かわうそ亭の女将ベラ
OPPS.length=0; OPPS.push(
  {nm:"札売りのトト",who:"100",cap:9,depth:1,sig:"w_nushi",pool:["w_nushi","w_koromochi","w_koromochi","w_kawauso","w_kawauso","w_donguri","w_mizugumo","w_hane","w_ishikoro","w_kakashi","w_ookami","w_teo","w_poruka","w_rinka","w_fukuro","w_taisho","w_mizuuri"]},
  {nm:"女将ベラ",who:"070",cap:10,depth:2,sig:"w_kawauso",pool:["w_oya","w_kakashi","w_kakashi","w_ookami","w_ookami","w_hane","w_hane","w_mizugumo","w_ishikoro","w_tsuta","w_koromochi","w_seri","w_karin"]},
  {nm:"橋番のガルム",who:"g",cap:11,depth:2,sig:"w_garm",pool:["w_garm","w_bram","w_ishikoro","w_ishikoro","w_tsuta","w_tsuta","w_kakashi","w_ookami","w_hane","w_donguri","w_nat","w_toraji","w_komari"]},
  {nm:"看板娘ニコ",who:"070n",cap:12,depth:2,sig:"w_rizeria",pool:["w_rizeria","w_edmon","w_shoki","w_mugiwara","w_mugiwara","w_kamausagi","w_kamausagi","w_fusha","w_doro","w_kakashi","w_ookami","w_hane","w_seri","w_karin"]},
  {nm:"粉屋のモルト",who:"019k",cap:11,depth:2,sig:"w_fusha",pool:["w_fusha","w_hanna","w_fusha","w_mugiwara","w_mugiwara","w_mugiwara","w_kamausagi","w_doro","w_koromochi","w_hane","w_kakashi","w_poruka","w_nat"]},
  {nm:"門番ダリオ",who:"g10",cap:12,depth:2,sig:"w_honeban",pool:["w_honeban","w_sig","w_vald","w_kerbe","w_tetsuken","w_tetsuken","w_fuurou","w_fuurou","w_kurohei","w_kurohei","w_oswald","w_kishi","w_kishi","w_teishin","w_shishi","w_doro","w_doro","w_kamausagi","w_fusha","w_mugiwara","w_hakamori","w_rousoku","w_sekkan","w_ookami","w_teo","w_rinka","w_sekimori","w_tomon","w_akamugi"]},
  {nm:"胴元ゴンゾ",who:"135",cap:12,depth:2,sig:"w_rousoku",pool:["w_rousoku","w_rousoku","w_jako","w_nakiya","w_nakiya","w_tomon","w_hakamori","w_hakamori","w_honeban","w_sekkan","w_doro","w_akamugi","w_akamugi","w_kakashi","w_ookami"]},
  {nm:"村長の孫ティム",who:"069",cap:9,depth:1,sig:"w_donguri",pool:["w_donguri","w_donguri","w_koromochi","w_koromochi","w_kawauso","w_mizugumo","w_hane","w_fukuro","w_mugiwara","w_kamausagi","w_ookami","w_kokedaruma","w_yonaki"]},
  {nm:"大頭取マルゴ",who:"134",cap:14,depth:3,sig:"w_koganegai",pool:["w_koganegai","w_fukumen","w_rojin","w_margo","w_aster","w_shokanban","w_shokanban","w_taisho","w_taisho","w_ryogae","w_mizuuri","w_sasori","w_sasori","w_sunamogu","w_akamugi","w_doro","w_tsubo"]},
  {nm:"闘技場の受付ジーナ",who:"137",cap:13,depth:3,sig:"w_sunamogu",pool:["w_sunamogu","w_sunamogu","w_sasori","w_saboten","w_saboten","w_hagewashi","w_sunaningyo","w_miira","w_tozoku","w_sasha","w_zazan","w_tobakuban","w_gina","w_keihin","w_serinin","w_akamugi","w_doro","w_ookami","w_kakashi","w_teo","w_rinka"]},
  {nm:"船大工ハッチ",who:"099c",cap:13,depth:3,sig:"w_hagewashi",pool:["w_hagewashi","w_hagewashi","w_minarai","w_minarai","w_yakunin","w_ryoshi","w_uouri","w_todai","w_okamiS","w_kaizoku","w_gaikotsu","w_yadokahou","w_fujitsubo","w_tobiuo","w_kamome","w_kurage","w_sunaningyo","w_sasori"]},
  {nm:"大司教オルド",who:"008",cap:14,depth:3,sig:"w_mifa",pool:["w_mifa","w_ordo","w_monso","w_monso","w_kairouso","w_junreiM","w_junreiF","w_hoshigashi","w_kanetsukiS","w_seitonoko","w_inoriseki","w_shirayuri","w_junreigani","w_rouko"]},
  {nm:"司書見習いリコ",who:"129r",cap:12,depth:2,sig:"w_inoriseki",pool:["w_inoriseki","w_riko","w_riko","w_irogarasu","w_kanetsuki","w_rouko","w_rouko","w_shirayuri","w_junreigani","w_junreigani","w_monso","w_seitonoko","w_hoshigashi"]},
  {nm:"炊事兵ボルツ",who:"099h",cap:12,depth:2,sig:"w_aster",pool:["w_aster","w_bolts","w_toride","w_toride","w_toby","w_nel","w_yukiusagi","w_yukiusagi","w_shimofuri","w_kogoe","w_kogoe","w_yukidaruma","w_senken"]},
  {nm:"魔術師エルマ",who:"089",cap:14,depth:3,sig:"w_shimofuri",pool:["w_shimofuri","w_elma","w_rokka","w_gerd","w_aster","w_shirokuma","w_hyouga","w_tsurara","w_tsurara","w_senken","w_senken","w_kogoe","w_shimofuri","w_shimofuri","w_yukidaruma"]},
  {nm:"半鬼の子ニィ",who:"073n",cap:12,depth:2,sig:"w_mogura",pool:["w_mogura","w_nii","w_dag","w_dag","w_yukiusagi","w_yukiusagi","w_yukidaruma","w_yukidaruma","w_shimofuri","w_tsurara","w_kogoe","w_toride","w_bolts"]},
  {nm:"牙の若衆ロロ",who:"m:m_rolo",cap:13,depth:3,sig:"w_ferga",pool:["w_ferga","w_rolo","w_kibasen","w_kibasen","w_tsukihoe","w_tsukihoe","w_kageboushi","w_kagee","w_yamibotaru","w_yakou","w_kitanoko","w_nene"]},
  {nm:"翼の語り部カナ",who:"054",cap:13,depth:3,sig:"w_shuri",pool:["w_shuri","w_kana","w_takahei","w_takahei","w_raichou","w_yamibotaru","w_yamibotaru","w_kagee","w_yakou","w_kageboushi","w_orgo","w_kitanoko"]},
  {nm:"鱗の料理番ドロ",who:"m:m_doro",cap:13,depth:3,sig:"w_dara",pool:["w_dara","w_doro","w_numayamori","w_numayamori","w_dokuhebi","w_dokuhebi","w_dorogame","w_mondou","w_yakou","w_kageboushi","w_kagee","w_yamibotaru"]},
  {nm:"角の太鼓打ちドン太",who:"m:m_donta",cap:13,depth:3,sig:"w_goura",pool:["w_goura","w_donta","w_kodaiko","w_kodaiko","w_dohyouoni","w_dohyouoni","w_kibasen","w_tsukihoe","w_takahei","w_kitanoko","w_kagee","w_yakou"]},
  {nm:"留守居のオルゴ",who:"m:monster_005",cap:14,depth:3,sig:"w_kuuza",pool:["w_kuuza","w_orgo","w_nene","w_ferga","w_shuri","w_dara","w_goura","w_raichou","w_dohyouoni","w_dorogame","w_kagee","w_tsukihoe","w_kana","w_rolo"]});
PRIZES.length=0;
const SHOP_CARDS=["w_koromochi","w_kawauso","w_mizugumo","w_donguri","w_hane"], SHOP_PRICE=30;
// お金はRPGの記録にある（同じ端末の保存場所）
// 物語で出会うまでは相手の札に出さない人（RPGの進みの数）。出会う前の人物の絵を先に見せないため
const LATE={w_edmon:41,w_vald:41,w_shoki:44,w_jako:45,w_sekimori:47,w_akamugi:46,w_aster:51,w_taisho:48,w_mizuuri:50,w_saboten:48,w_hagewashi:53,w_sunaningyo:53,w_rojin:53,w_miira:54,w_tozoku:54,w_koganegai:54,w_sasha:56,w_zazan:56,w_fukumen:59,w_dreg:65,w_kaizoku:64,w_yakunin:63,w_ryoshi:63,w_okamiS:63,w_uouri:63,w_todai:63,w_minarai:63,w_hatch:63,w_suifu:66,w_gaikotsu:64,w_fujitsubo:64,w_yadokahou:64,w_tobiuo:66,w_kurage:66,w_kamome:66,w_utsubo:66,w_mifa:73,w_ordo:68,w_riko:69,w_monso:68,w_kairouso:71,w_junreiM:67,w_junreiF:67,w_hoshigashi:68,w_kanetsukiS:68,w_seitonoko:68,w_junreigani:67,w_shirayuri:67,w_kanetsuki:71,w_irogarasu:71,w_inoriseki:71,w_rouko:71,w_shugozo:73,w_seiei:73,w_tetsuken:78,w_fuurou:78,w_kurohei:78,w_kerbe:80,w_oswald:81,w_kishi:81,w_teishin:81,w_toride:83,w_bolts:83,w_toby:83,w_nel:83,w_yukiusagi:84,w_shimofuri:84,w_yukidaruma:84,w_kogoe:84,w_elma:85,w_rokka:85,w_gerd:85,w_dag:86,w_nii:86,w_senken:87,w_tsurara:88,w_shirokuma:88,w_hyouga:90,w_mogura:88,w_kageboushi:91,w_yakou:91,w_kagee:91,w_yamibotaru:91,w_kibasen:93,w_tsukihoe:93,w_takahei:93,w_raichou:93,w_ferga:93,w_shuri:93,w_orgo:92,w_nene:92,w_kitanoko:92,w_rolo:93,w_kana:93,w_numayamori:93,w_dokuhebi:93,w_dorogame:93,w_kodaiko:93,w_dohyouoni:93,w_dara:93,w_goura:93,w_doro:93,w_donta:93,w_mondou:93,w_kuuza:96,w_kokedaruma:105,w_yonaki:105};
function rpgStage(){ try{ return JSON.parse(localStorage.getItem("rpgPlay1")).flags.s||0; }catch(e){ return 0; } }
// 後から足した札（相手の持ち札に、記録が作られた後で加えるもの）
const ADDED=["w_sig","w_vald","w_edmon","w_shoki","w_hanna","w_fukuro","w_sekimori","w_tomon","w_akamugi","w_taisho","w_mizuuri","w_saboten","w_hagewashi","w_sunaningyo","w_rojin","w_miira","w_tozoku","w_koganegai","w_sasha","w_zazan","w_fukumen","w_dreg","w_kaizoku","w_yakunin","w_ryoshi","w_okamiS","w_uouri","w_todai","w_minarai","w_hatch","w_suifu","w_gaikotsu","w_fujitsubo","w_yadokahou","w_tobiuo","w_kurage","w_kamome","w_utsubo","w_mifa","w_ordo","w_riko","w_monso","w_kairouso","w_junreiM","w_junreiF","w_hoshigashi","w_kanetsukiS","w_seitonoko","w_junreigani","w_shirayuri","w_kanetsuki","w_irogarasu","w_inoriseki","w_rouko","w_shugozo","w_seiei","w_tetsuken","w_fuurou","w_kurohei","w_kerbe","w_oswald","w_kishi","w_teishin","w_toride","w_bolts","w_toby","w_nel","w_yukiusagi","w_shimofuri","w_yukidaruma","w_kogoe","w_elma","w_rokka","w_gerd","w_dag","w_nii","w_senken","w_tsurara","w_shirokuma","w_hyouga","w_mogura","w_kageboushi","w_yakou","w_kagee","w_yamibotaru","w_kibasen","w_tsukihoe","w_takahei","w_raichou","w_ferga","w_shuri","w_orgo","w_nene","w_kitanoko","w_rolo","w_kana","w_numayamori","w_dokuhebi","w_dorogame","w_kodaiko","w_dohyouoni","w_dara","w_goura","w_doro","w_donta","w_mondou","w_kuuza","w_kokedaruma","w_yonaki"];
function rpgGold(add){ try{ const t=JSON.parse(localStorage.getItem("rpgPlay1")); if(add){ t.gold+=add; localStorage.setItem("rpgPlay1",JSON.stringify(t)); } return t.gold; }catch(e){ return 0; } }
function goldTag(){ return `<span style="color:var(--text)">${rpgGold().toLocaleString()} G</span>`; }

// ---------- 記録 ----------
let S;
function fresh(){ return {v:4,col:countOf(START),seen:{},op:OPPS.map(o=>({pool:o.pool.slice(),base:[...new Set(o.pool)],won:0,lost:0})),last:{},coin:0,games:0,shigoro:0}; }
function countOf(a){ const c={}; a.forEach(x=>c[x]=(c[x]||0)+1); return c; }
function load(){ try{ const t=localStorage.getItem(KEY); S=t?JSON.parse(t):fresh(); }catch(e){ S=fresh(); } if(S.v!==4) S=fresh();
  while(S.op.length<OPPS.length){ const o=OPPS[S.op.length]; S.op.push({pool:o.pool.slice(),base:[...new Set(o.pool)],won:0,lost:0}); }
  // 相手ごとに「もう配った札」を覚えておき、後の更新で相手に足した札は、その相手の持ち札へ一度だけ加える
  OPPS.forEach((o,k)=>{ const st=S.op[k]; if(!st.base) st.base=[...new Set(o.pool.filter(c=>!ADDED.includes(c)))];
    [...new Set(o.pool)].forEach(c=>{ if(!st.base.includes(c)){ o.pool.filter(x=>x===c).forEach(()=>st.pool.push(c)); st.base.push(c); } }); });
  // RPGの出来事でもらった札（rpgCardGift）を手札に入れる
  try{ const gs=JSON.parse(localStorage.getItem("rpgCardGift")||"[]"); if(gs.length){ gs.forEach(c=>{ if(CARDS[c]) S.col[c]=(S.col[c]||0)+1; }); localStorage.removeItem("rpgCardGift"); save(); } }catch(e){}
  Object.keys(S.col).forEach(k=>{ if(!CARDS[k]) delete S.col[k]; S.seen[k]=1; }); }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} }
function restock(){
  OPPS.forEach((o,k)=>{ const st=S.op[k]; const want=countOf(o.pool.filter(c=>CARDS[c].r<=2)); const have=countOf(st.pool);
    Object.keys(want).forEach(c=>{ for(let i=(have[c]||0);i<want[c];i++) st.pool.push(c); }); });
}
function owned(){ const a=[]; Object.keys(S.col).sort(byCard).forEach(k=>{ for(let i=0;i<S.col[k];i++) a.push(k); }); return a; }
function byCard(a,b){ return CARDS[b].r-CARDS[a].r || sum(CARDS[b].n)-sum(CARDS[a].n) || (a<b?-1:1); }
function sum(n){ return n[0]+n[1]+n[2]+n[3]; }
function rk(list){ return list.reduce((s,c)=>s+CARDS[c].r,0); }

// ---------- 札の絵 ----------
const N=v=>v>=10?"A":String(v);
function cardEl(cid,owner,w,h,o={}){
  const c=CARDS[cid], d=document.createElement("div");
  d.className="card "+owner; d.style.width=w+"px"; d.style.height=h+"px";
  const nums=o.n||c.n, q=o.mini?[]:(o.q||c.q||[]), fs=Math.max(11,Math.round(w*0.19));
  const [iw,ih]=IMG[c.im], bw=w*0.88, bh=h*0.66;
  const fit=iw<=bw&&ih<=bh, sc=fit?Math.max(1,Math.floor(Math.min(bw/iw,bh/ih))):(iw>bw*1.7&&ih>bh*1.3?0.5:1);
  const top=ih*sc<=bh?(bh-ih*sc)/2:0;
  const qn=q.map(k=>QK[k].nm).join("・");
  d.innerHTML=`<div class="face"></div>
   <div class="art"><img src="${artSrc(c)}" style="width:${iw*sc}px;height:${ih*sc}px;top:${top}px"></div>
   <div class="stars">★${c.r}</div><div class="shield"></div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;top:${Math.round(h*0.03)}px">${N(nums[0])}</div>
   <div class="n" style="font-size:${fs}px;right:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[1])}</div>
   <div class="n" style="font-size:${fs}px;left:0;right:0;bottom:${q.length?Math.round(h*(q.length>1?0.25:0.155)):Math.round(h*0.04)}px">${N(nums[2])}</div>
   <div class="n" style="font-size:${fs}px;left:${Math.round(w*0.04)}px;top:${Math.round(h*0.42)}px">${N(nums[3])}</div>
   ${q.length?`<div class="qk" style="font-size:${Math.max(9,Math.round(w*(q.length>1?0.12:0.14)))}px;line-height:1.15">${q.map(k=>QK[k].nm).join("<br>")}</div>`:""}`;
  if(o.mini) d.querySelectorAll(".n").forEach(x=>x.remove());
  d.style.borderColor=RARE[c.r]; d.style.borderWidth=c.r>=5?"3px":"2px"; if(c.r>=6) d.classList.add("r6"); if(c.glow) d.classList.add("glow");
  if(o.shield) d.classList.add("shielded");
  if(o.sealed) d.classList.add("sealed");
  holdToShow(d,cid);
  if(o.count>1){ const b=document.createElement("div"); b.className="mark t"; b.style.bottom="auto"; b.style.top="-2px"; b.style.left="auto"; b.style.right="-2px"; b.style.transform="none"; b.textContent="×"+o.count; d.appendChild(b); }
  return d;
}
function backEl(w,h){ const d=el("div","card back"); d.style.width=w+"px"; d.style.height=h+"px"; d.innerHTML='<div class="bk"></div>'; return d; }
function who(id,box){ // 人物の正面の立ち姿（2倍、上半身で切る）。"g"＝橋番のガルム（魔物の絵の顔）
  const d=document.createElement("div"); d.className="sprite";
  if(id==="g10"){ d.style.cssText=`width:${box[0]}px;height:${box[1]}px;background:url(img/monster_010.png) no-repeat;background-size:${box[0]*1.7}px auto;background-position:45% 4%;image-rendering:pixelated`; return d; }
  if(id==="g") id="132";   // 橋番のガルム（人の型の石の巨人の絵）
  if(id.startsWith("m:")){ d.style.cssText=`width:${box[0]}px;height:${box[1]}px;background:url(img/${id.slice(2)}.png) no-repeat;background-size:auto ${box[1]*1.1}px;background-position:30% 0;image-rendering:pixelated`; return d; } // 魔物の姿の相手（牙の若衆ロロ など）
  d.style.cssText=`width:${box[0]}px;height:${box[1]}px;background-image:url(img/person_${id}.png);background-size:288px 600px;background-position:${-(96)+(box[0]-96)/2}px ${box[1]>=120?0:-4}px`;
  return d;
}
function desc(cid){ const c=CARDS[cid]; return `${c.nm}　${"★".repeat(c.r)}`+(c.q?"　"+c.q.map(k=>`${QK[k].nm}：${QK[k].ds}`).join("　"):"")+(c.only?`　（${c.only}）`:""); }
function toast(t){ const e=document.createElement("div"); e.className="toast"; e.textContent=t; document.querySelector(".screen").appendChild(e); setTimeout(()=>e.remove(),1300); }
const $app=document.getElementById("app");
function screen(){ $app.innerHTML=""; const s=document.createElement("div"); s.className="screen"; $app.appendChild(s); return s; }
function el(tag,cls,html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!==undefined) e.innerHTML=html; return e; }

// ---------- 長押しで札をくわしく見る ----------
let HOLD=null, EAT=false;
function holdToShow(d,cid){
  const start=(e)=>{ clearTimeout(HOLD); HOLD=setTimeout(()=>{ EAT=true; detail(cid); },420); };
  const stop=()=>clearTimeout(HOLD);
  d.addEventListener("pointerdown",start); d.addEventListener("pointerup",stop); d.addEventListener("pointerleave",stop); d.addEventListener("pointercancel",stop);
  d.addEventListener("contextmenu",e=>e.preventDefault());
}
document.addEventListener("click",e=>{ if(EAT){ EAT=false; e.stopPropagation(); e.preventDefault(); } },true);
function detail(cid){
  const c=CARDS[cid]; const v=el("div","veil"); v.style.zIndex=40;
  const k=cardEl(cid,"nb",150,196); k.classList.add("pop"); v.appendChild(k);
  v.appendChild(el("div","",`<div style="font-size:20px;font-weight:700;text-align:center">${c.nm}</div><div style="text-align:center;color:${RARE[c.r]==="#fff"?"#ffe08a":RARE[c.r]};letter-spacing:2px">${"★".repeat(c.r)}</div>`));
  const q=el("div","frame",""); q.style.cssText+="padding:10px 14px;max-width:320px;text-align:center;line-height:1.6";
  q.innerHTML=`<div style="font-size:12px;color:var(--sub);margin-bottom:4px">No.${String(c.no).padStart(3,"0")}　${KIND_NM[c.k]}</div>`+
    (c.q?c.q.map(k=>`<div style="color:var(--gold);font-size:16px;font-weight:700">${QK[k].nm}</div><div style="font-size:14px;margin-bottom:4px">${QK[k].ds}</div>`).join(""):`<div style="font-size:14px;color:var(--sub)">くせなし</div>`);
  if(c.fam){ const f=ORDER.filter(x=>CARDS[x].fam===c.fam&&x!==cid); if(f.length) q.innerHTML+=`<div style="font-size:12px;color:var(--sub);margin-top:4px">同じ系統：${f.map(x=>S.seen[x]?CARDS[x].nm:"？？？").join("・")}</div>`; }
  if(c.only) q.innerHTML+=`<div style="font-size:12px;color:#ffb3d0;margin-top:6px">${c.only}</div>`;
  v.appendChild(q);
  v.onclick=()=>v.remove();
  (document.querySelector(".screen")||document.body).appendChild(v);
}

// ---------- 相手の手札（上限の中で一番強い5枚。看板札は必ず入れる） ----------
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function oppDeck(pool,cap,must){ // 相手の手札：毎回組み方を変え、並びも混ぜる
  const p=pool.slice().sort(byCard), n=p.length, all=[], seen=new Set();
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++){
    const h=[p[a],p[b],p[c],p[d],p[e]], r=rk(h); if(r>cap) continue;
    if(must && pool.includes(must) && !h.includes(must)) continue;
    const key=h.join(); if(seen.has(key)) continue; seen.add(key);
    all.push([r*100+h.reduce((s,x)=>s+sum(CARDS[x].n),0),h]);
  }
  if(!all.length) return shuffle(p.slice(-5));
  all.sort((x,y)=>y[0]-x[0]);
  const top=all[0][0], cand=all.filter(x=>x[0]>=top-130).slice(0,10);
  return shuffle(cand[Math.floor(Math.random()*cand.length)][1].slice());
}
function bestDeck(pool,cap,must){
  const p=pool.slice().sort(byCard); let best=null,bs=-1;
  const n=p.length;
  for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)for(let c=b+1;c<n;c++)for(let d=c+1;d<n;d++)for(let e=d+1;e<n;e++){
    const h=[p[a],p[b],p[c],p[d],p[e]], r=rk(h); if(r>cap) continue;
    if(must && pool.includes(must) && !h.includes(must)) continue;
    const sc=r*100+h.reduce((s,x)=>s+sum(CARDS[x].n),0);
    if(sc>bs){ bs=sc; best=h; }
  }
  if(!best){ best=p.slice(-5); }
  return best;
}

// ---------- 町 ----------
function coinTag(){ return `<span style="color:var(--gold)">◎ ${S.coin.toLocaleString()}</span>`; }
function town(){ parent.postMessage({t:"close"},"*"); }
// 札帳：240種を番号の順に。持っていない札は影だけ
function collection(page){
  // 出会った札・持っている札だけが載る（全部で何種類あるかは見せない）
  const list=ORDER.filter(id=>S.col[id]||S.seen[id]);
  const s=screen(), per=25, pages=Math.max(1,Math.ceil(list.length/per)); page=Math.max(0,Math.min(pages-1,page));
  const have=Object.keys(S.col).length;
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town;
  bar.appendChild(el("div","title","札帳")); bar.appendChild(el("div","lbl",`持っている札 <b style="color:var(--gold)">${have}</b>種`)); bar.appendChild(b); s.appendChild(bar);
  const g=el("div","book");
  list.slice(page*per,(page+1)*per).forEach(id=>{
    const box=el("div","bk1");
    if(S.col[id]){ box.appendChild(cardEl(id,"nb",66,86,{count:S.col[id]})); }
    else { const c=CARDS[id], sh=el("div","card shadow"); sh.style.cssText="width:66px;height:86px";
      sh.innerHTML=S.seen[id]?`<div class="art"><img src="${artSrc(c)}" style="${(()=>{ const [iw,ih]=IMG[c.im], sc=iw<=58&&ih<=56?Math.max(1,Math.floor(Math.min(58/iw,56/ih))):1; return `width:${iw*sc}px;height:${ih*sc}px;top:${ih*sc<=56?(56-ih*sc)/2:0}px`; })()}"></div>`:`<div class="q">？</div>`;
      box.appendChild(sh); }
    box.appendChild(el("div","no",String(CARDS[id].no).padStart(3,"0")));
    g.appendChild(box);
  });
  s.appendChild(g);
  const nav=el("div","pager");
  const pv=el("button","btn","‹"); pv.onclick=()=>collection(page-1); if(page===0) pv.classList.add("dim");
  const nx=el("button","btn","›"); nx.onclick=()=>collection(page+1); if(page===pages-1) nx.classList.add("dim");
  const dots=el("div","dots"); for(let i=0;i<pages;i++){ const d=el("i",i===page?"on":""); d.onclick=()=>collection(i); dots.appendChild(d); }
  nav.appendChild(pv); nav.appendChild(dots); nav.appendChild(nx); s.appendChild(nav);
  let sx=null; g.addEventListener("pointerdown",e=>{ sx=e.clientX; }); g.addEventListener("pointerup",e=>{ if(sx!==null&&Math.abs(e.clientX-sx)>60) collection(page+(e.clientX<sx?1:-1)); sx=null; });
}
function gain(cid){ S.col[cid]=(S.col[cid]||0)+1; S.seen[cid]=1; save(); }
function reveal(cid,title,back){
  const v=el("div","veil");
  v.appendChild(el("div","big",title));
  const c=cardEl(cid,"me",130,170); c.classList.add("flip"); v.appendChild(c);
  v.appendChild(el("div","",desc(cid))); v.lastChild.style.cssText="font-size:13px;padding:0 20px;text-align:center";
  const b=el("button","btn gold","受け取る"); b.onclick=()=>{ v.remove(); if(back) back(); }; v.appendChild(b);
  document.querySelector(".screen").appendChild(v);
}

// ---------- 遊び場 ----------
function casino(){
  const s=screen();
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town; bar.appendChild(el("div","title","遊び場")); const right=el("div","",coinTag()); bar.appendChild(right); bar.appendChild(b); s.appendChild(bar);
  const tile=(title,sub,cid,go)=>{ const f=el("div","frame opp"); const inf=el("div","info"); inf.appendChild(el("div","nm",title)); inf.appendChild(el("div","sub",sub)); f.appendChild(inf); const c=cardEl(cid,S.col[cid]?"me":"nb",64,84); f.appendChild(c); f.onclick=go; return f; };
  const ex=el("div","row"); ex.style.gap="8px"; ex.style.alignItems="center";
  const gl=el("div","lbl",goldTag()); gl.style.fontSize="14px"; gl.style.minWidth="64px"; ex.appendChild(gl);
  [[50,100],[250,500]].forEach(([c,g])=>{ const bt=el("button","btn",`◎${c}<small style="color:var(--sub)">（${g}G）</small>`); bt.style.flex="1"; bt.style.fontSize="14px"; bt.style.padding="8px 6px";
    bt.onclick=()=>{ if(rpgGold()<g){ toast("お金が足りない"); return; } rpgGold(-g); S.coin+=c; save(); casino(); toast(`コイン ◎${c} にかえた`); }; ex.appendChild(bt); });
  s.appendChild(ex);
  s.appendChild(tile("スロット","7が3つそろうと、ここだけの札","m004",slot));
  s.appendChild(tile("チンチロ","ピンゾロで勝つと、ここだけの札","m050",chin));
  s.appendChild(el("div","lbl","景品"));
  const info=el("div","info2","");
  const r=el("div","row"); r.style.gap="6px"; r.style.flexWrap="wrap";
  PRIZES.forEach(([cid,price])=>{ const w=el("div",""); w.style.cssText="display:flex;flex-direction:column;align-items:center;gap:6px";
    const c=cardEl(cid,"nb",52,68); w.appendChild(c);
    const p=el("div","",`<span style="color:var(--gold);font-size:13px">◎${price}</span>`); p.style.minHeight="30px"; w.appendChild(p);
    c.onclick=()=>{ info.textContent=desc(cid); r.querySelectorAll(".card").forEach(x=>x.classList.remove("target")); c.classList.add("target");
      r.querySelectorAll(".buy").forEach(x=>{ x.outerHTML=`<span style="color:var(--gold);font-size:13px">◎${x.dataset.p}</span>`; });
      const bt=el("button","btn gold buy",`交換 ◎${price}`); bt.dataset.p=price; bt.style.cssText+="font-size:12px;padding:5px 6px"; p.innerHTML=""; p.appendChild(bt);
      bt.onclick=()=>{ if(S.coin<price){ toast("コインが足りない"); return; } S.coin-=price; gain(cid); reveal(cid,"交換した！",casino); }; };
    r.appendChild(w); });
  s.appendChild(r); s.appendChild(info);
}
// スロット
const SYM=[["7",3],["鎧",3],["炎",5],["鴉",6],["雫",8]];
const PAY3={"7":1000,"鎧":300,"炎":120,"鴉":60,"雫":30}, PAY2={"7":60,"鎧":30,"炎":20,"鴉":16,"雫":13};
const SYMIMG={"鎧":["m004",1],"炎":["m007",2],"鴉":["m037",2],"雫":["m001",3]};
function symEl(k){ const d=el("div",""); d.style.cssText="width:100%;height:100%;display:flex;align-items:center;justify-content:center";
  if(k==="7"){ d.innerHTML='<span style="font-family:Avenir Next,system-ui;font-weight:900;font-size:64px;color:#ffd35a;text-shadow:0 3px 0 #8a4b10,0 0 12px #ffb347">7</span>'; }
  else { const [im,sc]=SYMIMG[k], [w,h]=IMG[im]; d.innerHTML=`<img src="../cards/img/c/${im}.png" style="width:${w*sc}px;height:${h*sc}px;image-rendering:pixelated">`; }
  return d; }
function pickSym(){ let r=Math.random()*25; for(const [k,w] of SYM){ if((r-=w)<0) return k; } return "雫"; }
let SL=null;
function slot(){
  const s=screen(); SL=SL||{busy:false,last:["7","鎧","炎"]};
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=()=>{ if(!SL.busy) casino(); }; bar.appendChild(el("div","title","スロット")); const ct=el("div","",coinTag()); bar.appendChild(ct); bar.appendChild(b); s.appendChild(bar);
  const mac=el("div","frame"); mac.style.cssText+="padding:14px;display:flex;gap:8px;justify-content:center;background:linear-gradient(#3a2430,#1d1418)";
  const reels=[0,1,2].map(i=>{ const r=el("div",""); r.style.cssText="width:104px;height:128px;background:linear-gradient(#f6ecd6,#d8c8a6);border:3px solid #5a3d2a;border-radius:6px;overflow:hidden;box-shadow:0 0 0 2px #000 inset"; r.appendChild(symEl(SL.last[i])); mac.appendChild(r); return r; });
  s.appendChild(mac);
  const res=el("div","info2",""); res.style.fontSize="18px"; res.style.color="var(--gold)"; s.appendChild(res);
  // 配当表
  const pt=el("div","frame"); pt.style.cssText+="padding:8px 12px;display:grid;grid-template-columns:auto 1fr auto 1fr;gap:4px 10px;align-items:center;font-size:13px";
  SYM.forEach(([k])=>{ const a=el("div",""); a.style.cssText="width:34px;height:34px"; const se=symEl(k); se.style.transform="scale(.42)"; se.style.transformOrigin="center"; a.appendChild(se);
    pt.appendChild(a); pt.appendChild(el("div","",`3つ　<b style="color:var(--gold)">◎${PAY3[k]}</b>`)); pt.appendChild(el("div","lbl","2つ")); pt.appendChild(el("div","",`<b>◎${PAY2[k]}</b>`)); });
  s.appendChild(pt);
  const sp=el("div",""); sp.style.flex="1"; s.appendChild(sp);
  const go=el("button","btn gold","回す（◎10）"); go.style.fontSize="20px"; go.style.padding="16px";
  const spin=()=>{ if(SL.busy) return; if(S.coin<10){ toast("コインが足りない"); return; }
    SL.busy=true; S.coin-=10; save(); ct.innerHTML=coinTag(); res.textContent="";
    const out=[pickSym(),pickSym(),pickSym()]; let t=0;
    const iv=setInterval(()=>{ t++; reels.forEach((r,i)=>{ if(t<8+i*6){ r.innerHTML=""; r.appendChild(symEl(SYM[(t+i*2)%5][0])); } else if(t===8+i*6){ r.innerHTML=""; r.appendChild(symEl(out[i])); r.animate([{transform:"translateY(-10px)"},{transform:"none"}],{duration:160}); } });
      if(t>=8+12){ clearInterval(iv); SL.last=out; finish(out); } },70);
  };
  const finish=(o)=>{ let win=0; if(o[0]===o[1]&&o[1]===o[2]) win=PAY3[o[0]]; else if(o[0]===o[1]) win=PAY2[o[0]];
    S.coin+=win; save(); ct.innerHTML=coinTag(); SL.busy=false;
    if(win){ res.textContent=`◎${win} 当たり！`; mac.animate([{filter:"brightness(1.6)"},{filter:"none"}],{duration:500,iterations:win>=300?4:1}); } else res.textContent="";
    if(o.join("")==="777"){ gain("m004"); reveal("m004","大当たり！",null); }
    else if(o.join("")==="鎧鎧鎧"&&!S.col.L05&&!(S.gotL||{}).L05){ S.gotL=S.gotL||{}; S.gotL.L05=1; gain("L05"); reveal("L05","限定の札！",null); } };
  go.onclick=spin; mac.onclick=spin;
  s.appendChild(go);
}
// チンチロ
function hand(d){ const a=d.slice().sort((x,y)=>x-y);
  if(a[0]===a[2]) return a[0]===1?{nm:"ピンゾロ",rk:100,m:5}:{nm:`${a[0]}のゾロ目`,rk:90+a[0],m:3};
  if(a.join("")==="456") return {nm:"シゴロ",rk:80,m:2};
  if(a.join("")==="123") return {nm:"ヒフミ",rk:-10,m:2};
  if(a[0]===a[1]) return {nm:`${a[2]}の目`,rk:a[2],m:1};
  if(a[1]===a[2]) return {nm:`${a[0]}の目`,rk:a[0],m:1};
  return null; }
const PIPS={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function dieEl(v,size){ const d=el("div",""); d.style.cssText=`width:${size}px;height:${size}px;background:#fbf6ea;border-radius:${size*0.18}px;box-shadow:0 2px 0 #a99a80,0 0 0 1px #0004 inset;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);padding:${size*0.12}px;gap:1px`;
  for(let i=0;i<9;i++){ const p=el("div",""); if(PIPS[v].includes(i)) p.style.cssText=`border-radius:50%;background:${v===1?"#d23":"#222"};width:${v===1?"100%":"78%"};height:${v===1?"100%":"78%"};margin:auto`; d.appendChild(p); } return d; }
let CH={bet:10};
function chin(){
  const s=screen(); CH.state=CH.state||"bet";
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=()=>{ if(CH.state==="bet"||CH.state==="done"){ CH.state="bet"; casino(); } }; bar.appendChild(el("div","title","チンチロ")); const ct=el("div","",coinTag()); bar.appendChild(ct); bar.appendChild(b); s.appendChild(bar);
  const dl=el("div","frame opp"); const w=el("div","who"); w.style.width="56px"; w.style.height="70px"; w.appendChild(who("099",[56,70])); dl.appendChild(w);
  const di=el("div","info"); di.appendChild(el("div","nm","壺振りのゲン")); const dh=el("div","sub",CH.dh?`親の目：${CH.dh}`:"親"); di.appendChild(dh); dl.appendChild(di); s.appendChild(dl);
  const bowl=el("div",""); bowl.style.cssText="margin:6px auto;width:300px;height:220px;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#5a3b2a 0%,#3a2418 55%,#1e120c 75%);box-shadow:0 0 0 6px #6b4a33,0 10px 20px #000a,inset 0 12px 30px #000c;display:flex;align-items:center;justify-content:center;gap:14px";
  const dice=CH.dice||[4,5,6]; dice.forEach(v=>bowl.appendChild(dieEl(v,52))); s.appendChild(bowl);
  const msg=el("div","info2",CH.msg||""); msg.style.fontSize="17px"; msg.style.color="var(--gold)"; s.appendChild(msg);
  const mh=el("div","info2",CH.ph?`こちらの目：${CH.ph}`:""); s.appendChild(mh);
  const sp=el("div",""); sp.style.flex="1"; s.appendChild(sp);
  const roll=(cb)=>{ let t=0; const iv=setInterval(()=>{ t++; const r=[1,2,3].map(()=>1+Math.floor(Math.random()*6)); bowl.innerHTML=""; r.forEach(v=>bowl.appendChild(dieEl(v,52))); if(t>=10){ clearInterval(iv); cb(r); } },60); };
  if(CH.state==="bet"){
    const r=el("div","row"); r.style.gap="8px"; [10,50,100].forEach(v=>{ const bt=el("button","btn"+(CH.bet===v?" gold":""),`◎${v}`); bt.style.flex="1"; bt.onclick=()=>{ CH.bet=v; chin(); }; r.appendChild(bt); }); s.appendChild(r);
    const go=el("button","btn gold","勝負"); go.style.fontSize="20px"; go.style.padding="14px";
    go.onclick=()=>{ if(S.coin<CH.bet*2){ toast("コインが足りない（賭けの2倍が要る）"); return; } CH.state="dealer"; CH.try=0; CH.dh=null; CH.ph=null; CH.msg="親が振る…"; chin(); dealerRoll(); };
    s.appendChild(go);
  } else if(CH.state==="player"){
    const go=el("button","btn gold",`振る（あと${3-CH.try}回）`); go.style.fontSize="20px"; go.style.padding="14px";
    const doRoll=()=>{ if(CH.rolling) return; CH.rolling=true; roll(r=>{ CH.rolling=false; CH.dice=r; CH.try++; const h=hand(r);
        if(h){ CH.ph=h.nm; CH.phv=h; if(h.nm==="シゴロ"){ S.shigoro=(S.shigoro||0)+1; save(); } settle(); if(h.nm==="シゴロ") setTimeout(()=>awards(),1200); } else if(CH.try>=3){ CH.ph="目なし"; CH.phv={nm:"目なし",rk:0,m:1}; settle(); } else { CH.msg="目なし…もう一度"; chin(); } }); };
    go.onclick=doRoll; bowl.onclick=doRoll; s.appendChild(go);
  } else if(CH.state==="done"){
    const go=el("button","btn gold","もう一勝負"); go.style.fontSize="20px"; go.style.padding="14px"; go.onclick=()=>{ CH.state="bet"; CH.msg=""; CH.dh=null; CH.ph=null; chin(); }; s.appendChild(go);
  }
  function dealerRoll(){ roll(r=>{ CH.dice=r; CH.try++; const h=hand(r);
    if(!h && CH.try<3){ chin(); setTimeout(dealerRoll,350); return; }
    CH.dhv=h||{nm:"目なし",rk:0,m:1}; CH.dh=CH.dhv.nm; CH.try=0;
    if(CH.dhv.rk>=80){ CH.state="done"; pay(-CH.bet*CH.dhv.m, `親の${CH.dh}。こちらの負け`); return; }
    if(CH.dhv.rk<0){ CH.state="done"; pay(CH.bet*2, "親のヒフミ。こちらの勝ち"); return; }
    if(CH.dhv.rk===0){ CH.state="done"; pay(CH.bet, "親の目なし。こちらの勝ち"); return; }
    CH.state="player"; CH.msg=`親は${CH.dh}。こちらの番`; chin(); }); }
  function settle(){ const p=CH.phv, d=CH.dhv; CH.state="done";
    if(p.rk<0) return pay(-CH.bet*2,"ヒフミ…倍払い");
    if(p.rk>d.rk){ pay(CH.bet*p.m, `${p.nm}！こちらの勝ち`); if(p.nm==="ピンゾロ"){ gain("m050"); setTimeout(()=>reveal("m050","ピンゾロ！",null),300); } return; }
    if(p.rk===d.rk) return pay(0,"引き分け");
    pay(-CH.bet*d.m,"こちらの負け"); }
  function pay(v,text){ S.coin=Math.max(0,S.coin+v); save(); CH.msg=text+(v?`（${v>0?"+":""}${v}）`:""); chin(); }
}

// ---------- 支度 ----------
let P=null; // 支度中の状態
function prep(k){
  const o=OPPS[k], st=S.op[k];
  const stage=rpgStage(), ok=c=>(LATE[c]||0)<=stage;
  // 相手の持ち札が5枚より少ないと、相手の番で止まってしまう。足りなければ補充し、それでも足りなければ弱い札を足す（「もう一勝負」から来ても同じ）
  if(st.pool.filter(ok).length<5){ restock(); save(); }
  const low=o.pool.filter(c=>ok(c)&&CARDS[c].r<=2).sort((a,b)=>CARDS[a].r-CARDS[b].r);
  for(let i=0;st.pool.filter(ok).length<5&&low.length;i++){ st.pool.push(low[i%low.length]); save(); }
  const opDeck=oppDeck(st.pool.filter(ok),o.cap,o.sig);
  let glow=null; // ごくまれに、伏せ札の中に光る札がまじる
  if(Math.random()<0.04){ const idx=opDeck.findIndex(x=>x!==o.sig); if(idx>=0){ opDeck[idx]=GLOWS[Math.floor(Math.random()*GLOWS.length)]; glow=idx; } }
  let mine=(S.last[k]||[]).slice();
  const pool=owned();
  const can=(()=>{ const c=countOf(pool); for(const x of mine){ if(!c[x]) return false; c[x]--; } return mine.length===5 && rk(mine)<=o.cap; })();
  if(!can) mine=quickDeck(pool,o.cap);
  const loan=pool.length<5;
  if(loan){ mine=pool.slice(); while(mine.length<5) mine.push("w_koromochi"); }
  P={k,op:opDeck,mine,target:null,loan,glow};
  drawPrep();
}
function quickDeck(pool,cap){ // 上限の中で強い5枚（数字の合計の大きい順に詰める）
  const p=pool.slice().sort((a,b)=>sum(CARDS[b].n)+CARDS[b].r*3-sum(CARDS[a].n)-CARDS[a].r*3), h=[]; let w=0;
  for(const c of p){ if(h.length>=5) break; const r=CARDS[c].r; if(w+r+(4-h.length)*1<=cap){ h.push(c); w+=r; } }
  return h;
}
function weight(mine){ return rk(mine); }
const KEEP=["w_iei","w_saomaou","w_shinin"]; // 物語でもらった形見の札：相手は狙わない（賭けで失わない）
function oppPick(){ // 相手は、こちらの手札の一番いい札を狙う
  if(P.loan||PRACTICE) return null;
  const c=P.mine.filter(x=>!KEEP.includes(x)); return (c.length?c:P.mine).slice().sort(byCard)[0];
}
function miniOrEmpty(cid,owner,lab,cls){
  const box=el("div",""); box.style.cssText="display:flex;flex-direction:column;align-items:center;gap:3px;width:64px";
  box.appendChild(el("div","lbl",lab));
  if(cid){ const c=cardEl(cid,owner,40,52); if(cls) c.classList.add(cls); box.appendChild(c); }
  else { const d=el("div",""); d.style.cssText="width:40px;height:52px;border:2px dashed #5a4a3e;border-radius:6px"; box.appendChild(d); }
  return box;
}
function drawPrep(){
  const o=OPPS[P.k], s=screen();
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town;
  const t=el("div",""); t.style.cssText="display:flex;align-items:center;gap:8px"; const w=el("div",""); w.style.cssText="width:40px;height:44px;overflow:hidden"; w.appendChild(who(o.who,[40,60])); t.appendChild(w); t.appendChild(el("div","title",o.nm)); bar.appendChild(t); bar.appendChild(b); s.appendChild(bar);
  const say=(x)=>setTimeout(()=>{ const i=document.querySelector(".tray .info2"); if(i) i.textContent=desc(x); });
  // 相手（伏せたまま）
  const op=el("div","panel op");
  const oh=el("div","phead"); oh.appendChild(el("div","",`相手の手札`)); oh.appendChild(el("div","",`持ち札 ${S.op[P.k].pool.length}枚`)); op.appendChild(oh);
  const ready=P.mine.length===5;
  const or=el("div","row"); or.style.perspective="800px";
  const slots=P.op.map((cid,i)=>{ const slot=el("div",""); slot.style.cssText="width:58px;height:76px;position:relative";
    const bk=backEl(58,76); if(ready) bk.classList.add("lure"); slot.appendChild(bk);
    bk.onclick=()=>{ if(P.target!==null) return; if(P.mine.length<5){ toast("手札を5枚にする"); return; } choose(i,slot,bk); };
    or.appendChild(slot); return slot; });
  op.appendChild(or); s.appendChild(op);
  // 賭け
  const pick=oppPick();
  const vs=el("div","vsband");
  const lb=el("div",""); lb.style.cssText="display:flex;flex-direction:column;align-items:center;gap:3px;width:64px"; lb.appendChild(el("div","lbl","指名")); const q=backEl(40,52); q.querySelector(".bk").innerHTML="<b>？</b>"; lb.appendChild(q); vs.appendChild(lb);
  const mlab=()=>vs.querySelector(".vsmid .lbl");
  const mid=el("div","vsmid"); mid.innerHTML=`<div class="vs">VS</div><div class="lbl">${P.loan?"貸し札の練習":PRACTICE?"賭けなしの練習":"勝った方が受け取る"}</div>`; vs.appendChild(mid);
  vs.appendChild(miniOrEmpty(P.loan||PRACTICE?null:pick,"me","狙われる","danger"));
  s.appendChild(vs);
  // 自分の手札
  const me=el("div","panel me");
  const r=rk(P.mine);
  const mh=el("div","phead"); mh.appendChild(el("div","",`こちらの手札`));
  const meter=el("div","wmeter"); for(let i=0;i<o.cap;i++){ const d=el("i",""); if(i<r) d.className=r>o.cap?"over":"on"; meter.appendChild(d); } const wl=el("span","",`★${r}/${o.cap}`); meter.appendChild(wl); mh.appendChild(meter); me.appendChild(mh);
  const mr=el("div","row");
  P.mine.forEach((cid,i)=>{ const c=cardEl(cid,"me",62,80); if(!P.loan&&cid===pick&&P.mine.indexOf(cid)===i) c.classList.add("danger"); c.onclick=()=>{ if(P.loan) return; P.mine.splice(i,1); drawPrep(); say(cid); }; mr.appendChild(c); });
  for(let i=P.mine.length;i<5;i++){ const e=el("div","slot"); mr.appendChild(e); }
  me.appendChild(mr); s.appendChild(me);
  // 手持ち
  const tray=el("div","tray");
  const left=countOf(owned()); P.mine.forEach(x=>{ if(left[x]) left[x]--; });
  const ids=Object.keys(S.col).sort(byCard).filter(id=>left[id]>0);
  const th=el("div","phead"); th.appendChild(el("div","",`手持ち`)); th.appendChild(el("div","lbl",`${ids.reduce((s,x)=>s+left[x],0)}枚`)); tray.appendChild(th);
  tray.appendChild(el("div","info2",""));
  const g=el("div","grid");
  ids.forEach(id=>{ const n=left[id]; const c=cardEl(id,"me",48,62,{count:n}); const heavy=r+CARDS[id].r>o.cap||P.mine.length>=5; if(heavy) c.style.opacity=".45";
    c.onclick=()=>{ say(id); if(P.loan) return; if(P.mine.length>=5){ toast("手札は5枚まで"); return; } if(r+CARDS[id].r>o.cap){ toast("重さの上限をこえる"); return; } P.mine.push(id); drawPrep(); say(id); };
    g.appendChild(c); });
  tray.appendChild(g); s.appendChild(tray);
  function choose(i,slot,bk){ // 伏せ札を1枚めくって確定。後戻りなし
    P.target=i; S.last[P.k]=P.mine.slice(); save();
    const cid=P.op[i], sig=cid===o.sig, gl=Boolean(CARDS[cid].glow); S.seen[cid]=1;
    document.querySelectorAll("button,.card").forEach(x=>{ x.style.pointerEvents="none"; });
    or.querySelectorAll(".back").forEach(x=>{ x.classList.remove("lure"); if(x!==bk) x.style.opacity=".35"; });
    bk.animate([{transform:"rotateY(0)"},{transform:"rotateY(90deg)"}],{duration:220,fill:"forwards"});
    setTimeout(()=>{ slot.innerHTML=""; const c=cardEl(cid,"op",58,76); slot.appendChild(c); c.animate([{transform:"rotateY(90deg)"},{transform:"rotateY(0) scale(1.2)"},{transform:"scale(1)"}],{duration:380});
      const m=cardEl(cid,"op",40,52); q.replaceWith(m);
      const lab=mlab();
      if(gl){ lab.innerHTML=`<span style="color:#e8f2ff;font-size:16px;text-shadow:0 0 8px #9cc4ff">光る札！</span>`; s.animate([{background:"#cfe0ff66"},{background:"transparent"}],{duration:500,iterations:4}); }
      else if(sig){ c.classList.add("target"); m.classList.add("target"); lab.innerHTML=`<span style="color:var(--gold);font-size:16px">看板の札！</span>`; s.animate([{background:"#e8c27a55"},{background:"transparent"}],{duration:700,iterations:2}); }
      else lab.textContent=`${CARDS[cid].nm}　${"★".repeat(CARDS[cid].r)}`;
      setTimeout(startMatch,gl?2600:sig?2200:1400); },230);
  }
}

function guessHands(G,n){
  const m=G.h[0].filter(x=>x).length, pool=(typeof S!=="undefined"&&S)?owned():START.slice(), out=[];
  for(let k=0;k<n;k++){ const p=pool.slice(), h=[]; for(let j=0;j<m&&p.length;j++){ h.push(p.splice(Math.floor(Math.random()*p.length),1)[0]); } out.push(h); }
  return out;
}
function aiMove(G,depth){
  const ms=moves(G,1); let best=null,bv=-1e9;
  const hands=depth>1?guessHands(G,3):[G.h[0]];
  for(const [i,c] of ms){ let v=0; for(const h of hands){ const g={b:G.b,h:[h,G.h[1]]}; play(g,1,i,c,null); v+=search(g,0,depth-1,-1e9,1e9); } v=v/hands.length+Math.random()*0.6; if(v>bv){ bv=v; best=[i,c]; } }
  return best;
}

// ---------- 勝負の画面 ----------
let M=null;
function startMatch(){
  const k=P.k, first=Math.random()<0.5?0:1;
  M={k,G:{b:Array(9).fill(null),h:[P.mine.slice(),P.op.slice()],lost:[0,0]},turn:-1,sel:null,busy:true,
     wager:(P.target===null||P.loan||PRACTICE)?null:{take:P.op[P.target],give:oppPick()},loan:P.loan,known:P.target};
  drawMatch(); tossOnBoard(first);
}
function tossOnBoard(first){
  const bd=document.querySelector(".board"); const ov=el("div","toss");
  ov.innerHTML=`<div class="coinwrap"><div class="coin3d ${first?'red':'blue'}"><div class="cf blue">先</div><div class="cf red">後</div></div></div><div class="tosstx"></div>`;
  bd.appendChild(ov);
  setTimeout(()=>{ ov.querySelector(".tosstx").textContent=first===0?"こちらの先攻":"相手の先攻"; ov.classList.add("done"); },1500);
  setTimeout(()=>{ ov.remove(); M.turn=first; M.busy=false; drawMatch(); if(first===1) setTimeout(aiTurn,400); },2600);
}
function dims(){
  const H=$app.clientHeight, W=Math.min(440,$app.clientWidth);
  let ch=Math.min(150,(H-330)/3), cw=Math.round(ch/1.27);
  if(cw*3+24>W-20){ cw=Math.floor((W-44)/3); ch=Math.round(cw*1.27); }
  return {cw:Math.floor(cw),ch:Math.floor(ch)};
}
function drawMatch(fx){
  const o=OPPS[M.k], s=screen(), G=M.G, D=dims();
  const top=el("div","score");
  const ow=el("div",""); ow.style.cssText="display:flex;align-items:center;gap:6px"; const w=el("div",""); w.style.cssText="width:36px;height:40px;overflow:hidden"; w.appendChild(who(o.who,[36,60])); ow.appendChild(w); ow.appendChild(el("div","",`<span style="font-size:13px">${o.nm}</span>`));
  top.appendChild(ow); top.appendChild(el("div","",`<b style="color:var(--opL)">${score(G,1)}</b>`)); s.appendChild(top);
  const or=el("div","row"); or.style.minHeight="70px";
  G.h[1].forEach((cid,i)=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:50px;height:65px"; or.appendChild(e); return; } if(i!==M.known){ or.appendChild(backEl(50,65)); return; } const c=cardEl(cid,"op",50,65); c.classList.add("target"); or.appendChild(c); });
  s.appendChild(or);
  const bd=el("div","frame board"); bd.style.gridTemplateColumns=`repeat(3,${D.cw}px)`;
  for(let i=0;i<9;i++){
    const ce=el("div","cell"); ce.style.width=D.cw+"px"; ce.style.height=D.ch+"px";
    const c=G.b[i];
    if(c){ const full=CARDS[c.cid].q||[]; const e=cardEl(c.cid,c.o===0?"me":"op",D.cw-4,D.ch-4,{n:c.n,shield:c.g,q:full,sealed:full.length&&!c.q.length}); if(fx&&fx[i]) e.classList.add(fx[i]); ce.appendChild(e); }
    else if(M.sel!==null&&M.turn===0&&!M.busy) ce.classList.add("can");
    ce.onclick=()=>{ if(M.busy||M.turn!==0||G.b[i]) return; if(M.sel===null){ return; } humanPlay(M.sel,i); };
    bd.appendChild(ce);
  }
  s.appendChild(bd);
  const info=el("div","info2",M.sel!==null?desc(G.h[0][M.sel]):(M.turn===1?"相手が考えている…":"")); s.appendChild(info);
  const mr=el("div","row"); mr.style.minHeight="96px";
  G.h[0].forEach((cid,i)=>{ if(!cid){ const e=el("div",""); e.style.cssText="width:64px;height:84px"; mr.appendChild(e); return; } const c=cardEl(cid,"me",64,84); if(M.sel===i) c.classList.add("sel"); if(M.wager&&base(cid)===M.wager.give) c.classList.add("danger");
    c.onclick=()=>{ if(M.busy) return; M.sel=M.sel===i?null:i; drawMatch(); }; mr.appendChild(c); });
  s.appendChild(mr);
  const bt=el("div","score"); bt.appendChild(el("div","lbl",M.wager?"賭けの勝負":"賭けなし")); bt.appendChild(el("div","",`<b style="color:var(--meL)">${score(G,0)}</b>`)); s.appendChild(bt);
}
const EVNM={chainx:"連鎖！",combo:"同数・合計！",seal:"封印",curse:"祟り！",spite:"道連れ！",back:"執念で戻った！",grow:"成長",turn:"回転",debuff:"威圧"};
function animate(ev,done){
  // 番の始め（執念・成長） → 置く（回転） → 置いたとき・裏返る → 連鎖
  ev.forEach(e=>{ if(e.cell!==undefined&&M.G.b[e.cell]) S.seen[M.G.b[e.cell].cid]=1; });
  const steps=[], say=(list)=>{ const t=[...new Set(list.map(e=>e.t==="guard"?(e.wall?"鉄壁！":"踏ん張った！"):EVNM[e.t]).filter(Boolean))]; if(t.length) setTimeout(()=>toast(t.join("　")),50); };
  const pre=ev.filter(e=>e.lv===0), put=ev.filter(e=>e.t==="put"), l1=ev.filter(e=>e.lv===1), l2=ev.filter(e=>e.lv===2);
  if(pre.length) steps.push(()=>{ const fx={}; pre.forEach(e=>fx[e.cell]=e.t==="back"?"flip":"pop"); say(pre); return fx; });
  steps.push(()=>{ const fx={}; put.forEach(e=>fx[e.cell]="pop"); return fx; });
  if(l1.length) steps.push(()=>{ const fx={}; l1.forEach(e=>{ fx[e.cell]=e.t==="flip"||e.t==="spite"?"flip":"pop"; }); say(l1); return fx; });
  if(l2.length) steps.push(()=>{ const fx={}; l2.forEach(e=>{ fx[e.cell]=e.t==="flip"?"flip":"pop"; }); if(l2.some(e=>e.t==="flip")) l2.push({t:"chainx"}); say(l2); return fx; });
  let i=0; const next=()=>{ if(i>=steps.length){ done(); return; } const fx=steps[i++](); drawMatch(fx); setTimeout(next,i===1?300:480); }; next();
}
function humanPlay(hi,cell){
  M.busy=true; M.sel=null; const ev=[]; play(M.G,0,hi,cell,ev,true);
  animate(ev,()=>{ M.busy=false; endOrNext(1); });
}
function aiTurn(){
  M.busy=true; drawMatch();
  setTimeout(()=>{ const [hi,cell]=aiMove(M.G,OPPS[M.k].depth); const ev=[]; play(M.G,1,hi,cell,ev,true); animate(ev,()=>{ M.busy=false; endOrNext(0); }); },450);
}
function endOrNext(nextSide){
  if(M.G.b.every(x=>x)||!M.G.h[nextSide].some(x=>x)){ setTimeout(result,500); return; } // 置ける札がない側の番になったら、そこで終わる（止まらないように）
  M.turn=nextSide; drawMatch(); if(nextSide===1) setTimeout(aiTurn,500);
}
function result(){
  const st=S.op[M.k], me=score(M.G,0), op=score(M.G,1), win=me>op, draw=me===op;
  if(win){ st.won++; S.coin+=40; } else if(!draw) st.lost++;
  S.games=(S.games||0)+1; if(S.games%3===0) restock();
  let got=null,lost=null;
  if(M.wager&&!draw){
    if(win){ got=M.wager.take; const j=st.pool.indexOf(got); if(j>=0) st.pool.splice(j,1); S.col[got]=(S.col[got]||0)+1; S.seen[got]=1; }
    else { lost=M.wager.give; if(S.col[lost]){ S.col[lost]--; if(!S.col[lost]) delete S.col[lost]; } st.pool.push(lost); }
  }
  save();
  drawMatch();
  const v=el("div","veil");
  v.appendChild(el("div","big",win?"勝ち":draw?"引き分け":"負け"));
  v.appendChild(el("div","",`<span style="color:var(--meL);font-size:22px">${me}</span>　対　<span style="color:var(--opL);font-size:22px">${op}</span>`+(win?`　<span style="color:var(--gold)">◎+40</span>`:"")));
  if(got||lost){ const c=cardEl(got||lost,got?"me":"op",120,156); c.classList.add("flip"); v.appendChild(c); v.appendChild(el("div","",got?`${CARDS[got].nm}を手に入れた！`:`${CARDS[lost].nm}を取られた…`)); }
  else if(draw&&M.wager) v.appendChild(el("div","lbl","賭けた札は、どちらも動かない"));
  const r=el("div","row"); r.style.gap="10px";
  const a=el("button","btn gold","もう一勝負"); a.onclick=()=>prep(M.k);
  const b=el("button","btn","卓を離れる"); b.onclick=town;
  if(!PRACTICE) r.appendChild(a); r.appendChild(b); v.appendChild(r);
  document.querySelector(".screen").appendChild(v);
  setTimeout(()=>awards(),900);
}
// 限定の札：条件を満たしたら、まだ持っていなければ渡す
function awards(){
  const won=k=>S.op[k].won, kinds=Object.keys(S.col).length, glows=GLOWS.filter(g=>S.col[g]).length;
  const rules=[["L09",(S.shigoro||0)>=3],["L10",OPPS.every((o,k)=>won(k)>=1)]].filter(([id])=>CARDS[id]); // 限定の札は、この世界のぶんを決めてから
  const due=rules.filter(([id,ok])=>ok&&!S.col[id]&&!S.gotL?.[id]).map(([id])=>id);
  if(!due.length) return;
  const id=due[0]; S.gotL=S.gotL||{}; S.gotL[id]=1; gain(id); reveal(id,"限定の札！",()=>awards());
}
// 札売り：町の外で見かける魔物の★1の札
function shop(){
  const s=screen();
  const bar=el("div","bar"); const b=el("button","btn back","✕"); b.onclick=town; bar.appendChild(el("div","title","札売り")); bar.appendChild(el("div","lbl",goldTag())); bar.appendChild(b); s.appendChild(bar);
  const g=el("div",""); g.style.cssText="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;justify-items:center";
  SHOP_CARDS.forEach(cid=>{ const w=el("div",""); w.style.cssText="display:flex;flex-direction:column;align-items:center;gap:4px";
    const c=cardEl(cid,"nb",84,110); w.appendChild(c); w.appendChild(el("div","lbl",`${CARDS[cid].nm}　持っている${S.col[cid]||0}`));
    const bt=el("button","btn gold",`${SHOP_PRICE}G`); bt.style.cssText+="font-size:14px;padding:6px 12px";
    bt.onclick=()=>{ if(rpgGold()<SHOP_PRICE){ toast("お金が足りない"); return; } rpgGold(-SHOP_PRICE); gain(cid); shop(); toast(`${CARDS[cid].nm}の札を買った`); };
    w.appendChild(bt); g.appendChild(w); });
  s.appendChild(g);
}
load();
(()=>{ const q=new URLSearchParams(location.search), go=q.get("go"), k=+q.get("k");
  if(go==="duel"){ const st=S.op[k]; if(st.pool.length<5){ restock(); save(); } prep(k); }
  else if(go==="casino") casino(); else if(go==="book") collection(0); else if(go==="shop") shop(); else town(); })();
window.__S=()=>S; window.__M=()=>M;
