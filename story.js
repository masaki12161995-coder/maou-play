// ===== ストーリー・イベント・住人 =====
const TRIG = {};
const F = k => G.flags[k];
const setF = (k,v) => { G.flags[k] = v===undefined?1:v; };
function unlock(...ids){ for(const id of ids) if(!G.unlocked.includes(id)) G.unlocked.push(id); }
function setObj(t, next){ G.obj=t; G.next=next||null; toast('目的：'+t); }
function setChapter(n){ G.chapter=n; setF('ch'+n); RT.saveWhenFree=n; } // 章が変わったら、イベントが終わって歩ける状態になったときに自動でセーブ
async function chapterTitle(n){ await fade(true); const el=$('msg'); el.style.display='block'; el.innerHTML=`<div style="text-align:center;font-size:18px;font-weight:800;padding:14px 0;letter-spacing:.1em">${CHAPTERS[n]}</div>`; await sleep(1800); el.style.display='none'; await fade(false); }
function starterGear(n){
  const lv=Math.max(1,avgLv()); const c=CHARS[n];
  const m=G.members[n]; if(!m.equip.weapon) { m.equip.weapon=makeItem('weapon',lv,0,c.wpn==='mag'?'m':'p',{ty:FAV[n]}); m.equip.weapon.isNew=false; }
  if(!m.equip.body){ m.equip.body=makeItem('body',lv,0,undefined,{mei:false}); m.equip.body.isNew=false; }
  if(!m.equip.head){ m.equip.head=makeItem('head',lv,0,undefined,{mei:false}); m.equip.head.isNew=false; }
  const s=calcStats(n); m.hp=s.hp;
}
// 旅立ちの支度：今のレベルより古い装備だけ、ふつうの装備に替える（外したものは袋へ）
function refreshGear(n){ const m=G.members[n], lv=Math.max(1,m.lv), c=CHARS[n];
  for(const sl of ['weapon','body','head','arm']){ const cur=m.equip[sl]; if(cur && cur.iLv>=lv-1) continue; const it=makeItem(sl,lv,0,sl==='weapon'?(c.wpn==='mag'?'m':'p'):undefined,sl==='weapon'?{ty:FAV[n]}:{mei:false}); it.isNew=false; if(cur) G.gear.push(cur); m.equip[sl]=it; } }
function join(n, quiet, lv1){
  if(!G.members[n]) addMember(n, lv1? 1 : Math.max(1, avgLv()));
  const m=G.members[n]; m.avail=true; if(!lv1 && m.lv<avgLv()-1){ m.lv=avgLv(); m.exp=0; }
  starterGear(n);
  if(!G.party.includes(n) && G.party.length<4) G.party.push(n);
  if(!quiet){ toast(`${n} が仲間になった！`); sfx('join'); }
  renderTop();
}
function leave(n){
  G.party=G.party.filter(x=>x!==n); const m=G.members[n]; if(!m) return; m.avail=false;
  for(const sl of SLOTS){ if(m.equip[sl]){ G.gear.push(m.equip[sl]); m.equip[sl]=null; } }
  for(const k of Object.keys(G.members)){ if(G.party.length>=4) break; if(G.members[k].avail && !G.party.includes(k)) G.party.push(k); }
  renderTop();
}
async function gotoLoc(id,pos){ await fade(true); enterMap(id,0,pos); await fade(false); }
async function narr(...lines){ for(const l of lines) await say('',l); }
async function talk(lines){ for(const [w,t] of lines) await say(w,t); }
async function runTrigger(k){
  const f=TRIG[k]; if(!f) return;
  // イベント中は、戦闘のあとで一時的に動ける状態になっても、記録（自動セーブ・中断）しない
  const wasBusy=RT.busy; RT.busy=true; RT.event=(RT.event||0)+1;
  try{ await f(); if(RT.event===1 && typeof dismissStaged==='function') await dismissStaged(); } finally { RT.event=Math.max(0,(RT.event||1)-1); RT.busy=wasBusy; renderTop(); }
}
async function fight(idx,extra){ const r=await bossBattle(idx,extra); return r==='win'; }

// ---------- 序章 ----------
TRIG.start = async()=>{
  await narr('千年のあいだ、この世界には「魔王」がいた。','そして今日、ソラの村の若者が、その魔王を討つために旅立つ。');
};
// はじまり：暗いまま声だけ → 目を開けると自分の部屋。リリィに起こされる
TRIG.wake = async()=>{
  RT.sleeping=true;
  await talk([['リリィ','アルト、起きてる？ 今日だよ、旅立ちの日！']]);
  await fade(true); RT.dark=false; await fade(false);
  await talk([['リリィ','……もう。まだ寝てる。'],['リリィ','ほら、起きて！ 村のみんなが広場で待ってるよ。…勇者さまのお見送りだって。']]);
  sfx('ok'); const s=RT.map.objs.find(o=>o.type==='sleeper'); if(s) s.gone=true; RT.sleeping=false; G.x=3; G.y=2; G.dir='down'; RT.trail=[0,1,2,3].map(()=>({x:3,y:2,dir:'down'}));
  const ly=RT.map.npcs.find(n=>n.who==='リリィ'); if(ly){ ly.dir='up'; await sleep(300);
    await talk([['リリィ','おはよ。……ねぐせ、ついてるよ。'],['リリィ','じゃ、先に外で待ってるね！']]);
    await npcWalk(ly,[[4,3],[4,4],[4,5],[4,6],[4,7]],150); ly.gone=true; sfx('stairs'); }
};
TRIG.enter_sora = async()=>{
  if(G.chapter===0 && !F('s_open')){ setF('s_open');
    if(G.x===15&&G.y===18){ RT.trail=[{x:16,y:18,dir:'left'},{x:16,y:18,dir:'left'},{x:16,y:18,dir:'left'},{x:16,y:18,dir:'left'}]; await sleep(500); }
    await talk([
      ['村長','おお、勇者さま。この村はな、千年前から勇者さまをお育てするためにあるんじゃ。'],['村長','北の山を越えれば魔王城。どうか、ご無事で。']]);
    await narr('リリィが、胸元の青い石を握っている。'); if(RT.trail[0]) G.dir=dirTo(G.x,G.y,RT.trail[0].x,RT.trail[0].y);
    await talk([['リリィ','これ、覚えてる？ 小さいころ、アルトがくれた「守り石」。'],['リリィ','ずっと持ってたんだ。…だから、大丈夫。どこまででも、ついていくから。']]);
    unlock('mtpath'); setObj('北の山道を越えて魔王城へ','mtpath');
    doSave();
  }
  if(F('cleared') && G.chapter>=7 && !F('s_post')){ setF('s_post'); }
};
TRIG.goal_mtpath = async()=>{
  setF('goal_mtpath');
  await talk([['リリィ','あ、こっち！ この崖ぞいの道のほうが近いよ。'],['リリィ','……えっ？ なんで知ってるのかって？ な、なんとなく！']]);
  unlock('castle'); setObj('魔王城へ','castle');
  await narr('岩陰の向こうに、黒い城が見えた。');
  await gotoLoc('castle');
};
TRIG.boss_castle = async()=>{
  await narr('城門を守る巨大な鎧が、ぎしりと動いた。');
  if(!await fight(0)) return;
  setF('boss_castle');
  await narr('鎧が崩れ落ちる。城の中は、不気味なほど静かだった。');
  sfx('door'); await fade(true); enterThrone(); await fade(false);
  await narr('玉座の間。……赤い絨毯の先に、誰かが倒れている。');
};
TRIG.maou_body = async()=>{
  setF('maou_seen');
  await narr('魔王が、倒れていた。','目は、静かに閉じられている。');
  await talk([['リリィ','……死んでる。'],['アルト','（剣の傷じゃない。光で焼かれたような跡だ……）']]);
  await narr('その瞬間、ゴゴゴ…と大地が揺れた。');
  setF('skycrack'); sfx('quake'); if(typeof RT!=='undefined'){ RT.quake=40; }
  await narr('窓の外――空に、大きなヒビが走っていた。');
  await talk([['リリィ','空が……割れてる。'],['リリィ','とにかく村に戻ろう！']]);
  await gotoLoc('sora',{x:9,y:12});
  await talk([['村長','勇者さま！ 空が、空が裂けておる！'],['村長','魔王が死んでおったと…？ ならば、誰が…。'],['村長','王都ルミエールへ行き、王さまにお伝えくだされ。'],['村長','旅の支度じゃ。村の者が、装備と薬草を用意してくれた。']]);
  for(const n of G.party) refreshGear(n); G.inv.herb=(G.inv.herb||0)+3; fullHeal(); renderTop();
  setChapter(1); await chapterTitle(1);
  unlock('halt'); setObj('宿場町ハルトを通って王都ルミエールへ','halt');
};

// ---------- 1章 ----------
TRIG.enter_halt = async()=>{
  if(G.chapter===1 && !F('noah_join')){ setF('noah_join');
    await narr('宿屋の前で、銀色の髪の少女がこちらを見ていた。');
    await talk([['銀髪の少女','……また、ここ？'],['リリィ','え？'],['銀髪の少女','ううん。…わたしは、ノア。教会の司祭セイルさまの使い。'],
      ['ノア','勇者さまを、王都までお連れするように言われてる。'],['ノア','……あと、わたし、「やり直し」を覚えていられるの。'],['ノア','時間がもどっても、わたしだけは、覚えてる。……変な子だって、思った？']]);
    join('ノア'); unlock('lumiere'); setObj('王都ルミエールへ','lumiere');
  }
  if(G.chapter>=1 && F('noah_join')) unlock('lumiere');
};
TRIG.enter_lumiere = async()=>{
  // 前のセーブでハルトに寄らずに来ていたら、王都の門の前でノアと出会う
  if(G.chapter===1 && !F('noah_join')){ setF('noah_join');
    await narr('王都の門の前で、銀色の髪の少女がこちらを見ていた。');
    await talk([['銀髪の少女','……また、ここ？'],['リリィ','え？'],['銀髪の少女','ううん。…わたしは、ノア。教会の司祭セイルさまの使い。勇者さまを、お迎えに来たの。'],
      ['ノア','……あと、わたし、「やり直し」を覚えていられるの。'],['ノア','時間がもどっても、わたしだけは、覚えてる。……変な子だって、思った？']]);
    join('ノア');
  }
  if(G.chapter===1 && !F('lum1')){ setF('lum1');
    await talk([['衛兵','止まれ！ 今は非常時だ、勝手には通さんぞ。'],['？？？|セイル','その方々は、私のお客さまです。通してあげてください。'],['衛兵','せ、セイル司祭さま！ 失礼しました！']]);
    await talk([['セイル','ようこそ、勇者さま。司祭のセイルと申します。ノアがお役に立てたなら何よりです。'],['セイル','王がお待ちです。さあ、こちらへ。']]);
    await fade(true); RT.dark=true; await fade(false);
    await narr('玉座の間。王は、魔王の死と空のヒビの話を、黙って聞いていた。');
    await talk([['王','魔王を殺した者がいる……。そして、世界は崩れ始めた。'],['王','勇者よ。空のヒビの原因と、魔王を殺した者を探してくれ。'],
      ['セイル','教会も全力で支えましょう。旅のお金はご心配なく。'],['王','それと……南の黒将ザガンが、村を焼いて回っておる。魔王を失った魔王軍の、いちばんの暴れ者だ。'],['王','鉱山町グラムが危ない。街道の森を抜けて、向かってくれ。']]);
    await fade(true); RT.dark=false; for(const n of (RT.staged||[])) if(n.actor) n.gone=true; RT.staged=[]; await fade(false);
    unlock('forest'); setObj('街道の森を抜けて鉱山町グラムへ','forest');
  }
  if(G.chapter>=5 && !F('lum5')){ setF('lum5');
    await narr('王都は、半分が瓦礫になっていた。','街の真ん中に、白い塔が突き刺さるように立っている。');
    await talk([['オルガ','セイルの塔……。入り口は地下水路からしかないようだ。']]);
    unlock('sewer'); setObj('王都地下水路からセイルの塔へ','sewer');
  }
};
TRIG.leave_lumiere = async()=>{
  if(G.chapter===1 && F('lum1') && !F('mina_join')){ setF('mina_join'); RT.stageOpt={'衛兵':{near:3}};
    await talk([['？？？|ミナ','だーかーら！ あたしも連れてけって言ってんの！'],['衛兵','ダメだ！ 子どもが黒将の討伐なんて！'],['？？？|ミナ','子どもじゃない、ミナ！ 拳闘士ミナ！ 父ちゃんの道場をザガンに潰されたんだ！'],
      ['ミナ','……あ、あんたたち、勇者さま？ ちょうどいいや、あたしも行く！ 強いよ、あたし！'],['ノア','……にぎやかな子。'],['ミナ','あんた、なんかいい匂いするね！ 友だちになろ！']]);
    join('ミナ');
  }
};
TRIG.goal_forest = async()=>{ setF('goal_forest'); await narr('森を抜けた。山あいに、煙を上げる町が見える。'); unlock('gram'); setObj('鉱山町グラムへ','gram'); };
TRIG.enter_gram = async()=>{
  if(G.chapter===1 && !F('gram1')){ setF('gram1');
    await talk([['町長','勇者さまか！ 昨夜、ザガンの手下に襲われてな……。'],['町長','奴らは坑道の奥から出てきた。坑道のどこかに、砦への抜け道があるはずだ。'],['町長','どうか調べてくだされ！']]);
    unlock('mine'); setObj('グラム坑道を調べる','mine');
  }
};
TRIG.boss_mine = async()=>{
  await narr('坑道の奥で、巨大な土竜が牙をむいた。');
  if(!await fight(1)) return; setF('boss_mine');
  await narr('土竜が倒れた奥に、ザガン軍の地図が落ちていた。');
  await talk([['リリィ','砦は……焼かれた村の、さらに南。'],['ミナ','よーし、殴り込みだ！']]);
  unlock('burnt'); setObj('焼かれた村の跡を抜けて黒将の砦へ','burnt');
};
TRIG.goal_burnt = async()=>{ setF('goal_burnt');
  await narr('焼け跡の向こうを、小さな影が走り去っていった。','……生き残りの子どもだろうか。');
  unlock('fort1'); setObj('黒将の砦でザガンを倒す','fort1'); };
TRIG.boss_fort1 = async()=>{
  await talk([['ザガン','魔王が死んだ今、この世はオレのものだ。ガキどもが何の用だ？'],['ミナ','父ちゃんの道場の分、きっちり返してもらう！'],['ザガン','ハッ、かかってこい！']]);
  if(!await fight(2)) return; setF('boss_fort1');
  { const bo=RT.map&&RT.map.objs.find(o=>o.type==='boss'); if(bo) RT.map.objs.push({type:'fallen',who:'ザガン',x:bo.x,y:bo.y,eyes:'line'}); await sleep(500); }
  await talk([['ザガン','ぐ……オレが……こんなガキどもに……。'],['ザガン','……その剣筋、覚えたぞ……。']]);
  await narr('黒将ザガンは、動かなくなった。','そのとき、逃げようとする獣人の副官と目が合った。');
  RT.stageOpt={'獣人の副官':{near:3,here:1}}; await stageSpeaker('獣人の副官');
  const c=await choose('副官がおびえた目でこちらを見ている。',['とどめを刺す','見逃す']);
  if(c===1){ setF('luga_spared'); await say('獣人の副官','……なぜ、殺さない。……この借りは、忘れない。'); } else await narr('副官は、闇の中へ逃げていった。');
  await gotoLoc('lumiere');
  await narr('王都では、黒将討伐の祝宴が開かれた。','「これで平和が戻った」――誰もが、そう信じていた。');
  await talk([['セイル','見事です、勇者さま。教会からも感謝を。'],['ノア','……………。']]);
  const n=await choose('夜。宿の部屋。眠る前に、少し部屋を見回す？',['見回す','そのまま眠る']);
  if(n===0){ setF('noah_bed'); await narr('となりのベッドが、空だった。','ノアの姿がない。……夜明け前、ノアは何事もなかったように戻ってきた。'); }
  setChapter(2); await chapterTitle(2);
  await talk([['リリィ','アルト、空を見て……！ ヒビが、広がってる。'],['セイル','ザガンを倒しても止まらない……。原因は別にあるのでしょう。'],['セイル','海の向こう、ガラムの先の古戦場には、魔王軍の古い記録が眠っていると聞きます。港町アズールから船を。']]);
  unlock('azur'); setObj('港町アズールへ','azur'); fullHeal();
};

// ---------- 2章 ----------
TRIG.enter_azur = async()=>{
  if(G.chapter===2 && !F('azur1')){ setF('azur1');
    await talk([['船長','船？ 出せねぇよ。霧で灯台の火が消えちまってな。'],['船長','灯台の村ルースのじいさんなら、何とかできるかもしれんが。']]);
    unlock('ruth'); setObj('灯台の村ルースへ','ruth'); }
};
TRIG.enter_ruth = async()=>{
  if(G.chapter===2 && !F('ruth1')){ setF('ruth1');
    await talk([['灯台守','灯台の火種は、霧の湿原の先の洞窟にある。ところが大蛇が住みついてな……。'],['灯台守','火種を取り戻してくれたら、船も出せるじゃろう。']]);
    unlock('marsh'); setObj('霧の湿原を抜けて灯台の洞窟へ','marsh'); }
};
TRIG.goal_marsh = async()=>{ setF('goal_marsh'); await narr('霧の向こうに、ぽっかりと口を開けた洞窟が見えた。'); unlock('lhcave'); setObj('灯台の洞窟で火種を取り戻す','lhcave'); await gotoLoc('lhcave'); };
TRIG.boss_lhcave = async()=>{
  await narr('火種の前で、巨大な蛇がとぐろを巻いている。');
  if(!await fight(3)) return; setF('boss_lhcave');
  await narr('火種を持ち帰ると、灯台に火が戻った。霧が晴れていく。');
  await gotoLoc('azur');
  await talk([['？？？|オルガ','あなたたちが勇者一行か。王国騎士オルガ。セイル司祭のご推薦で、船の護衛を務める。'],['オルガ','セイル様は本当に立派なお方だ。あの方のためなら、私はどこへでも行く。']]);
  join('オルガ');
  await narr('船は海を越え、傭兵の町ガラムへ着いた。');
  unlock('garam'); setObj('傭兵の町ガラムへ','garam'); await arrive('garam');
};
TRIG.enter_garam = async()=>{
  if(G.chapter===2 && !F('garde_join')){ setF('garde_join');
    await narr('酒場で、大剣を背負った男が笑っていた。');
    await talk([['大剣の男','勇者だぁ？ 魔王が死んだ件を調べてる？ ……ハッ。'],['大剣の男','魔王を殺したのは、オレかもな。'],['ミナ','はぁ!? あんた何者よ！'],
      ['ガルド','ガルド。元・魔王軍の剣士さ。冗談だよ、冗談。'],['ガルド','古戦場に用があるんだろ？ 案内してやる。どうせ道はオレしか知らねぇ。']]);
    join('ガルド'); if(G.party.length>=4){} unlock('battlefield'); setObj('古戦場へ','battlefield');
    await say('','（仲間が5人以上になったら、メニューの顔の下の「控えと入れ替え」で、戦うメンバー4人を選べる）');
  }
};
TRIG.enter_battlefield = async()=>{
  if(!F('bf_night')){ setF('bf_night');
    await narr('古戦場の手前で野営をした。','夜中、ガルドがひとりで抜け出していく。');
    const c=await choose('あとをつける？',['あとをつける','やめておく']);
    if(c===0){ setF('followed'); await narr('ガルドは古い墓の前で、何かを土に埋めていた。','……何を埋めたのかは、暗くて見えなかった。'); }
    else await narr('……気になったが、そのまま眠った。');
  }
};
TRIG.boss_battlefield = async()=>{
  await narr('古戦場の奥で、黒い鎧の亡霊がこちらを見ている。');
  if(!await fight(4)) return; setF('boss_battlefield');
  await narr('亡霊の最後の一撃が、ガルドの胸を貫いた。');
  await fade(true); await sleep(900); await fade(false);
  await talk([['ガルド','……う。オレは……。'],['リリィ','気がついた！ 気絶してただけみたい……よかった。'],['ガルド','……おかしいな。完全に、やられたと思ったんだが。'],['ノア','……………よかった。']]);
  setF('garde_scar'); setF('boss_battlefield_note');
  await narr('ガルドの頬の古傷が、いつの間にか消えていた。……誰も、そのことに気づかなかった。');
  unlock('wreck'); setObj('沈没船を調べる','wreck');
};
TRIG.boss_wreck = async()=>{
  await narr('沈没船の船倉で、巨大な影がうごめいた。');
  if(!await fight(5)) return; setF('boss_wreck');
  await narr('船長室で、魔王軍の航海日誌を見つけた。','「我らが王は、器なり。器を守ることが、我らの務めなり」');
  await talk([['オルガ','器……？'],['ガルド','………。']]);
  await gotoLoc('lumiere');
  await narr('王都に戻ると、妙な噂が広がっていた。','「魔王を殺したのは、元魔王軍の大剣使いらしい」');
  await talk([['ミナ','……ガルド、ほんとに違うんだよね？'],['ガルド','……信じるかどうかは、お前らが決めろ。']]);
  setChapter(3); await chapterTitle(3);
  await talk([['セイル','学術都市ベルカの古文書館に、「器」についての記録があるかもしれません。']]);
  unlock('belka'); setObj('学術都市ベルカへ','belka'); fullHeal();
};

// ---------- 3章 ----------
TRIG.enter_belka = async()=>{
  if(G.chapter===3 && !F('dorc_join')){ setF('dorc_join');
    await talk([['老魔導士','ほう、勇者の一行か。わしはドルク。昔は教会で学者をしておった。'],['ドルク','「器」の記録じゃと？ あの棚は……教会の人間が来た日に、燃えてしまってのう。'],['ドルク','じゃが、地下書庫に写しがあるやもしれん。案内しよう。']]);
    join('ドルク'); unlock('archive'); setObj('古文書館の地下書庫で写しを探す','archive');
    if(F('luga_spared') && !F('luga_join')){ setF('luga_join');
      await talk([['獣人の男','……やっと見つけた。黒将の砦で、オレを見逃した勇者だな。'],['ルガ','ルガだ。借りを返しに来た。'],['ルガ','あの夜……ザガンさまの亡骸のそばに、銀色の髪の少女がいたのを見た。'],['ノア','………。'],['ルガ','それが何なのかは分からん。だが、オレも一緒に行く。']]);
      join('ルガ');
    }
  }
};
TRIG.goal_archive = async()=>{ setF('goal_archive');
  await narr('書庫の奥、埃をかぶった写本を見つけた。','「魔王は世界の蓋なり。虚を封じ、千年の痛みに耐える器なり」');
  await talk([['ドルク','魔王は……世界のフタじゃった、と？'],['リリィ','……。'],['ドルク','続きは荒野の向こう、砂の遺跡にあるはずじゃ。']]);
  unlock('dura'); setObj('荒野の宿場ドゥラへ','dura'); };
TRIG.enter_dura = async()=>{
  if(G.chapter===3 && !F('sion_join')){ setF('sion_join');
    await talk([['保安官','こら、またお前か！ 盗みは三度目だぞ！'],['少年','うるせぇ！ 腹が減ってんだよ！'],['リリィ','あの子……焼かれた村で見た子だ。'],
      ['少年','……あんたら、ザガンを倒したんだってな。……オレの村を焼いたやつだ。'],['シオン','オレはシオン。……礼は言わねぇ。でも、ついてってやる。']]);
    join('シオン'); unlock('saha'); setObj('オアシスの村サハへ','saha'); }
};
TRIG.enter_saha = async()=>{ if(G.chapter===3 && !F('saha1')){ setF('saha1'); await talk([['族長','砂の遺跡は、魔王軍が昔使っていた場所じゃ。守り手がおる。気をつけなされ。']]); unlock('ruins'); setObj('砂の遺跡を調べる','ruins'); } };
TRIG.boss_ruins = async()=>{
  await narr('遺跡の最深部で、砂の守り手が立ちはだかった。');
  if(!await fight(6)) return; setF('boss_ruins');
  await narr('守り手の奥に、小さな祭壇があった。そこに、古い供え物が置かれていた。');
  await talk([['ガルド','……オレが古戦場で埋めてたのも、これと同じだ。'],['ガルド','魔王さまへの供え物さ。オレは、魔王さまの門番だった。……殺すわけがねぇ。'],['ミナ','……ごめん、ガルド。疑って。'],['ガルド','いいさ。']]);
  await narr('遺跡を出ると、地平線に黒い軍旗が上がっていた。');
  await talk([['シオン','あれ……黒将の旗だ。'],['リリィ','うそ……ザガンは、倒したはず。'],['ミナ','あの時、確かに……殺したよな？']]);
  unlock('fort2'); setObj('黒将の新しい砦へ','fort2');
};
TRIG.boss_fort2 = async()=>{
  const u=G.elemUse||{}; const top=Object.keys(u).sort((a,b)=>u[b]-u[a])[0]||'none';
  await talk([['ザガン','よう、勇者。また会ったな。'],['シオン','……なんで生きてるんだよ！'],['ザガン','知らん。目が覚めたら、生きていた。……だが、全部覚えているぞ。'],
    ['ザガン', top==='none'?'お前らの剣筋も、間合いも、全部だ！':`お前らの${ELJP[top]}の技――もう効かんぞ！`]]);
  if(!await fight(7)) return; setF('boss_fort2');
  { const bo=RT.map&&RT.map.objs.find(o=>o.type==='boss'); if(bo) RT.map.objs.push({type:'fallen',who:'ザガン',x:bo.x,y:bo.y,eyes:'line'}); await sleep(500); }
  await talk([['ザガン','また……か……。'],['シオン','………。'],['ガルド','おい、誰か説明しろ。確実に仕留めたはずの奴が、なぜ生きてた。'],['ノア','……………。']]);
  await talk([['ドルク','……写本の続きを読んだ。落ち着いて聞いてくれ。'],['ドルク','魔王は、魔王を倒した者に受け継がれる。倒した者が、次の「器」になるんじゃ。'],['ドルク','そして勇者とは……次の器になるために、器のそばで育てられる者のこと。'],
    ['リリィ','……ソラの村が、魔王城のすぐそばにあるのは……。'],['ドルク','そういうことじゃ。……では、今の器は、誰じゃ？ 魔王を殺した者は――']]);
  setChapter(4); await chapterTitle(4);
  await talk([['オルガ','大聖堂へ行こう。セイル様なら、きっと何かご存じのはずだ。'],['オルガ','北の雪の村ヒュッテから、峡谷を抜けた先だ。']]);
  unlock('hutte'); setObj('雪の村ヒュッテへ','hutte'); fullHeal();
};

// ---------- 4章 ----------
TRIG.enter_hutte = async()=>{ if(G.chapter===4 && !F('hutte1')){ setF('hutte1'); await talk([['峡谷の案内人','大聖堂へ？ 凍てつく峡谷を抜けるしかない。最近は氷竜が出るそうだ。']]); unlock('canyon'); setObj('凍てつく峡谷を抜ける','canyon'); } };
TRIG.boss_canyon = async()=>{ await narr('峡谷の出口で、白い竜が吠えた。'); if(!await fight(8)) return; setF('boss_canyon'); await narr('峡谷を抜けると、雪の向こうに大聖堂の尖塔が見えた。'); unlock('sancta'); setObj('大聖堂の町サンクタへ','sancta'); };
TRIG.enter_sancta = async()=>{
  if(G.chapter===4 && !F('sancta1')){ setF('sancta1');
    await talk([['セイル','よくぞここまで。大聖堂の地下に、器の記録があります。どうぞ自由にお調べください。'],['セイル','すべてが分かれば、世界を救う道も見えるでしょう。'],['オルガ','セイル様……ありがとうございます！']]);
    unlock('undercat'); setObj('大聖堂の地下で器の記録を探す','undercat'); }
};
TRIG.goal_undercat = async()=>{ setF('goal_undercat');
  await narr('地下の最奥。鎖で封じられた古い扉があった。','扉の向こうから、かすかな声がする。「……だれか……」');
  const c=await choose('封じられた扉を開ける？',['開ける','開けずに先へ進む']);
  if(c===0){ setF('eve_join');
    await talk([['白い髪の女','……光が、見えたのは、何百年ぶりかしら。'],['イヴ','わたしはイヴ。ノアより前に作られた、最初の「記録の巫女」。命の力は、もう枯れてしまったけれど。'],['イヴ','……あの子は、元気？ ノアは、わたしの妹のようなもの。'],['ノア','………。'],['イヴ','あなたたちと行くわ。あの子のことを、見届けたいの。']]);
    join('イヴ');
  } else await narr('扉は、二度と開くことはなかった。');
  await narr('記録の最後のページ：「現在の器は、器の神殿にて確かめられる」');
  unlock('temple'); setObj('器の神殿で今の器を確かめる','temple'); };
TRIG.goal_temple = async()=>{ setF('goal_temple');
  await narr('神殿の祭壇。今の「器」に反応して光るという水晶がある。');
  await talk([['セイル','さあ、手をかざしてみてください。みなさん、順番に。']]);
  await narr('アルト――光らない。ミナ――光らない。ガルド――光らない。','リリィの番になった。','リリィは、手袋をはずした。','その手は、指先まで真っ黒に染まっていた。','水晶が、黒く光った。');
  await talk([['アルト','……リリィ？'],['リリィ','……ごめんね、アルト。'],['リリィ','魔王を殺したのは、わたし。'],['ミナ','うそ……でしょ……？'],
    ['リリィ','わたしね、何十回も「やり直し」てきたの。アルトがくれた守り石の力で。'],['リリィ','どの世界でも、アルトは魔王を倒して……次の魔王になった。千年、痛みに耐える器に。'],
    ['リリィ','何回やり直しても、そうなった。だから……アルトが着く前の夜に、わたしが殺したの。'],['リリィ','アルトを、魔王にしないために。']]);
  await narr('……静かな拍手が、神殿に響いた。');
  await talk([['セイル','素晴らしい。ようやく見つかりました。器の場所が。'],['オルガ','……セイル様？'],['セイル','善人のふりも、ここまでです。もう必要ありませんから。'],
    ['セイル','虚の力は、私がいただく。その娘ごと、ね。'],['オルガ','そんな……！ あなたは、民のために……！'],['セイル','民？ 寄付をくれる数字のことですか？ 名前など、一人も覚えていませんよ。']]);
  await narr('セイルの聖騎士たちが、リリィをつかんで連れ去っていく。');
  leave('リリィ'); setF('lily_taken');
  await talk([['聖騎士団長','追わせはせん！']]);
  if(!await fight(9,{lv:locLv('temple')})) return; setF('boss_temple');
  await narr('……セイルの姿は、もうなかった。','逃げのびた一行を、闇色の外套の者たちが取り囲んだ。');
  unlock('shadow'); await gotoLoc('shadow');
  await talk([['里長','安心なされ。ここは影の里。……かつて魔王軍と呼ばれた者たちの村じゃ。'],['里長','我らは千年、器となった魔王さまを守ってきた。魔王さまは千年、ずっと痛みに耐えておられた。'],['里長','そしてセイルは、器ごと虚の力を奪うつもりじゃ。そうなれば、世界は終わる。'],['ガルド','……オレたちの仕事は、まだ終わってなかったってことだ。']]);
  setChapter(5); await chapterTitle(5);
  unlock('refuge'); setObj('避難所の村へ。リリィを取り戻す','refuge'); fullHeal();
};

// ---------- 5章 ----------
TRIG.enter_refuge = async()=>{
  if(G.chapter===5 && !F('refuge1')){ setF('refuge1');
    await narr('世界の崩壊から逃げてきた人々が、身を寄せ合っている。');
    await talk([['オルガ','……私は、あの方を信じていた。民のために祈る、立派な人だと。'],['オルガ','私の剣は、何を守ってきたんだろうな。'],['ミナ','オルガ……。今は、リリィを守る剣でいいじゃん。'],['オルガ','……ああ。そうだな。']]);
    if(!F('lum5')){ await talk([['避難してきた男','あんたら、王都へ行くのか？ 王都の真ん中に、白い塔が生えたんだ……！']]); setObj('崩れゆく王都へ','lumiere'); }
    else await talk([['避難してきた男','王都の塔へ行くのか？ ……地下水路は、王都の西の外れから入れるらしい。']]); }
};
TRIG.boss_sewer = async()=>{ await narr('水路の奥で、巨大な何かが水しぶきを上げた。'); if(!await fight(10)) return; setF('boss_sewer'); await narr('水路の天井に、塔へ続くはしごがあった。'); unlock('tower'); setObj('セイルの塔へ','tower'); await gotoLoc('tower'); };
TRIG.boss_tower = async()=>{
  { const bo=RT.map&&RT.map.objs.find(o=>o.type==='boss'); if(bo&&!RT.map.npcs.some(n=>n.nm==='リリィ'&&!n.gone)) placeNear('リリィ',bo); RT.stageOpt={'リリィ':{near:99}}; }
  await narr('塔の最上階。鎖につながれたリリィと、セイルがいた。');
  await talk([['セイル','しつこいですね。損な役回りの勇者さま。'],['セイル','あと少しで、虚の力は私のものになる。邪魔はさせません。']]);
  if(!await fight(11)) return; setF('boss_tower');
  { const bo=RT.map&&RT.map.objs.find(o=>o.type==='boss'); if(bo){ bo.hideActor=true; RT.map.objs.push({type:'fallen',who:'セイル',look:specLook(speakerSpec('セイル')),x:bo.x,y:bo.y,eyes:'line',tmp:1}); } }
  await talk([['セイル','ば……かな……。この私が……損を……。']]);
  await narr('セイルは床に崩れ落ち、動かなくなった。','――そのとき。','ノアが、セイルの体に手をかざしていた。','淡い光。セイルの胸が、ふたたび上下し始めた。');
  await talk([['ミナ','ノア……？ 何、してるの……？'],['ノア','……あ。'],['ノア','……ちがう、わたし、そんなつもりじゃ……体が、勝手に……。'],['ガルド','おい……まさか。オレの古傷が消えたのも……。'],['シオン','ザガンが生きてたのも……！'],
    ['ノア','………うん。ぜんぶ、わたし。'],['ノア','わたしは、死を見ると、取り消してしまうの。敵でも、悪い人でも。'],['ノア','誰にも、死んでほしくないの。……それだけだったのに。'],
    ['ドルク','……死を取り消すたび、その「取り消された死」が虚を育てる。世界が崩れていたのは……。'],['ノア','……知らなかった。セイルさまは、教えてくれなかった。'],['ノア','でも、止められないの。止め方が、わからないの。']]);
  await narr('生き返ったセイルを、塔の床から湧き出した虚が呑みこんでいく。'); for(const o of RT.map.objs) if(o.tmp&&o.who==='セイル') o.gone=true; await narr('悲鳴は、すぐに消えた。');
  await talk([['ノア','……ごめんなさい。わたし、みんなのそばにいたら、また誰かを……。'],['ノア','さよなら。']]);
  await narr('ノアは光の中に消えた。','……ノアの装備は、荷物に戻された。');
  leave('ノア'); setF('noah_left');
  RT.stageOpt=null; await narr('鎖をほどくと、リリィが力なく笑った。');
  await talk([['リリィ','……来てくれたんだね。'],['アルト','（当たり前だ、と言う代わりに、その手をにぎった）'],['リリィ','……一緒に行かせて。ノアを、ひとりにできない。']]);
  join('リリィ'); if(!G.party.includes('リリィ')){ G.party[G.party.length-1]='リリィ'; renderTop(); toast('リリィがパーティーに戻った（控えと入れ替えで変えられる）'); }
  unlock('hate'); setObj('最果ての村ハテへ','hate'); fullHeal();
};
TRIG.enter_hate = async()=>{
  if(G.chapter===5 && !F('hate1')){ setF('hate1');
    await talk([['老婆','虚の淵へ行くんだね。……今夜はここで休んでいきな。']]);
    await narr('最後の夜。宿で、仲間たちと話した。');
    const lines={ 'ミナ':'ノアはさ、あたしの最初の友だちなんだ。……だから、ちゃんと止めてあげなきゃ。','ガルド':'オレは一度死んで、あいつに生かされた。……その命で、あいつを止める。皮肉な話だな。',
      'オルガ':'今度こそ、守るべきものを間違えない。','シオン':'……ザガンを何度も生き返らせたやつだ。許せねぇ。……でも、泣いてたよな、あいつ。','ドルク':'誰にも死んでほしくない、か。それは、この世でいちばん優しくて、いちばん重い願いじゃ。',
      'リリィ':'わたしも、ノアと同じ。……大事な人のために、世界をめちゃくちゃにした。だから、分かるの。','ルガ':'あの少女に、ザガンさまは何度も救われた。……オレも、礼を言わねばならん。','イヴ':'ノアに、ありがとうと言ってあげて。最後に。','ゴード':'……勇者を狩っていたオレが、勇者の背中を押すとはな。',
      'ロロ':'帳簿の二重の日付、やっと意味が分かった。……全部終わったら、ハルトに店を出すよ。勇者さま割引つきでな。','ミオ':'灯台の光はね、帰ってくる人のためにあるの。だから、みんなで帰ろう。',
      'テオ':'ぼく、こわいです。……でも、だれかの前に立つって、決めましたから。','リュート':'勇者の歌の最後の番、まだ白紙なんだ。……明日、書けるといいな。',
      'モルド':'死んだ者は、眠らせてやるのが筋じゃ。……あの子も、同じじゃよ。','ヨル':'魔王さまの痛みが終わったのに、まだ誰かが痛がってる。……今度こそ、終わらせよう。' };
    for(const n of Object.keys(G.members).filter(n=>G.members[n].avail&&lines[n])) await say(n,lines[n]);
    setChapter(6); await chapterTitle(6);
    unlock('abyss'); setObj('虚の淵へ','abyss'); fullHeal();
  }
  if(F('cleared') && !((META.goRun||{})[G.runSeed]) && !F('chrono_join')){ setF('chrono_join');
    await narr('村の片隅に、見たことのない人影が立っていた。');
    await talk([['時の番人','……面白い。一度も時を戻さずに、ここまで来た世界は初めてだ。'],['クロノ','私はクロノ。時の番人。巻き戻される時間を、ずっと外から見てきた。'],['クロノ','この世界の行く末を、近くで見せてもらおう。']]);
    join('クロノ');
  }
};
TRIG.enter_abyss = async()=>{ if(F('cleared') && !F('abyss_post')){ setF('abyss_post'); await narr('虚の淵は、静まり返っていた。'); } };
TRIG.boss_abyss = async()=>{
  if(F('cleared')){ setF('boss_abyss'); await narr('……何もない。','ここで何かと戦ったような気がする。','足もとに、何かが落ちていたような気もする。','……気のせいだろうか。'); return; }
  await narr('淵の底で、虚が形を成した。');
  if(!await fight(12)) return; setF('void_down');
  await narr('虚の化身が崩れ落ちる。その向こうに、ノアが立っていた。');
  await talk([['ノア','……来てくれたんだ。'],['ノア','虚は、わたしの中にいるの。わたしが生きている限り、死は取り消されて、虚は育ち続ける。'],['ノア','自分では、どうしても止められなかった。何度やっても、体が勝手に。'],
    ['ノア','だから……アルト。あなたにしか、頼めない。'],['ノア','わたしを、終わらせて。'],['リリィ','ノア……！'],['ノア','リリィ。あなたは、やり直せる人。……わたしは、取り消すことしかできなかった。'],['ノア','ねえ、アルト。……ちゃんと、覚えていてね。わたしが、ここにいたこと。']]);
  await narr('ノアがそっと手をかざした。あたたかい光が、みんなの傷をふさいでいく。'); fullHeal(); renderTop();
  doSave();
  if(!await fight(13)) return;
  await ending();
};
async function ending(){
  RT.busy=true; bgm('sad');
  await narr('ノアの体から、光が抜けていく。');
  await talk([['ノア','……ありがとう。'],['ノア','あったかい……。死ぬって、こんなに静かなんだね。']]);
  await narr('ノアの首から、金の首飾りが外れ、地面に落ちた。','カラン、と小さな音がした。');
  await fade(true); bgm('ending');
  const roll=['空のヒビは、ゆっくりと閉じていった。','死は、もう取り消されない。','世界は、ふたたび「終わりのある世界」に戻った。','','ミナは、父の道場を建て直した。',F('luga_join')?'ガルドとルガは、影の里で魔王の墓を守っている。':'ガルドは、影の里で魔王の墓を守っている。','オルガは騎士を辞め、避難所の村で子どもたちに剣を教えている。','シオンは、焼かれた村に家を建てた。','ドルクは、本当の歴史を書き残している。','','そしてアルトとリリィは、ソラの村へ帰った。','','魔王は昨日死んだ。','そしてもう、誰も魔王にならない。','','― おわり ―'];
  const el=$('msg'); el.style.display='block';
  for(const l of roll){ el.innerHTML=`<div style="text-align:center;padding:8px 0;font-size:15px">${l||'　'}</div>`; await sleep(l?1500:500); }
  el.style.display='none';
  // クリアの記録（レベルはノア戦のあと）
  const lv=G.members['アルト'].lv;
  META=loadMeta(); META.cleared=1; META.clearLv=lv; saveMeta(META);
  el.style.display='block'; el.innerHTML=`<div style="text-align:center;padding:10px 0">クリアデータを記録しました<br><b>アルト Lv ${lv}</b></div>`; await sleep(2600);
  el.innerHTML='<div style="text-align:center;padding:12px 0">……</div>'; await sleep(1800); el.style.display='none';
  // 巻き戻し：最後のセーブへ。説明はしない
  const s=loadSave(slotKey());
  if(s){ s.flags.cleared=1; s.flags.void_down=1; s.chapter=7; if(!s.unlocked.includes('maze')) s.unlocked.push('maze'); s.obj='記憶の迷宮'; s.next='maze'; s.loc='abyss';
    resumeFrom(s); doSave(); }
  await fade(false); bgm('field');
  RT.busy=false;
}

// ---------- 物語の直し（読み込み時） ----------
// イベントの途中で記録された古いセーブなど、「出来事は済んだのに、次の場所が開いていない」状態を直す。
// 済んだ出来事から順に、開くはずの場所・章・仲間・目的をそろえる（会話は飛ばす）
const STORY_FIX=[
 ['goal_mtpath',{un:['castle'],obj:['魔王城へ','castle']}],
 ['boss_castle',{ch:1,un:['halt'],obj:['宿場町ハルトを通って王都ルミエールへ','halt']}],
 ['noah_join',{un:['lumiere'],join:['ノア'],obj:['王都ルミエールへ','lumiere']}],
 ['lum1',{un:['forest'],obj:['街道の森を抜けて鉱山町グラムへ','forest']}],
 ['mina_join',{join:['ミナ']}],
 ['goal_forest',{un:['gram'],obj:['鉱山町グラムへ','gram']}],
 ['gram1',{un:['mine'],obj:['グラム坑道を調べる','mine']}],
 ['boss_mine',{un:['burnt'],obj:['焼かれた村の跡を抜けて黒将の砦へ','burnt']}],
 ['goal_burnt',{un:['fort1'],obj:['黒将の砦でザガンを倒す','fort1']}],
 ['boss_fort1',{ch:2,un:['azur'],obj:['港町アズールへ','azur']}],
 ['azur1',{un:['ruth'],obj:['灯台の村ルースへ','ruth']}],
 ['ruth1',{un:['marsh'],obj:['霧の湿原を抜けて灯台の洞窟へ','marsh']}],
 ['goal_marsh',{un:['lhcave'],obj:['灯台の洞窟で火種を取り戻す','lhcave']}],
 ['boss_lhcave',{un:['garam'],join:['オルガ'],obj:['傭兵の町ガラムへ','garam']}],
 ['garde_join',{un:['battlefield'],join:['ガルド'],obj:['古戦場へ','battlefield']}],
 ['boss_battlefield',{un:['wreck'],obj:['沈没船を調べる','wreck']}],
 ['boss_wreck',{ch:3,un:['belka'],obj:['学術都市ベルカへ','belka']}],
 ['dorc_join',{un:['archive'],join:['ドルク'],obj:['古文書館の地下書庫で写しを探す','archive']}],
 ['goal_archive',{un:['dura'],obj:['荒野の宿場ドゥラへ','dura']}],
 ['sion_join',{un:['saha'],join:['シオン'],obj:['オアシスの村サハへ','saha']}],
 ['saha1',{un:['ruins'],obj:['砂の遺跡を調べる','ruins']}],
 ['boss_ruins',{un:['fort2'],obj:['黒将の新しい砦へ','fort2']}],
 ['boss_fort2',{ch:4,un:['hutte'],obj:['雪の村ヒュッテへ','hutte']}],
 ['hutte1',{un:['canyon'],obj:['凍てつく峡谷を抜ける','canyon']}],
 ['boss_canyon',{un:['sancta'],obj:['大聖堂の町サンクタへ','sancta']}],
 ['sancta1',{un:['undercat'],obj:['大聖堂の地下で器の記録を探す','undercat']}],
 ['goal_undercat',{un:['temple'],obj:['器の神殿で今の器を確かめる','temple']}],
 ['boss_temple',{ch:5,un:['shadow','refuge'],obj:['避難所の村へ。リリィを取り戻す','refuge']}],
 ['refuge1',{obj:['崩れゆく王都へ','lumiere']}],
 ['lum5',{un:['sewer'],obj:['王都地下水路からセイルの塔へ','sewer']}],
 ['boss_sewer',{un:['tower'],obj:['セイルの塔へ','tower']}],
 ['boss_tower',{un:['hate'],obj:['最果ての村ハテへ','hate']}],
 ['hate1',{ch:6,un:['abyss'],obj:['虚の淵へ','abyss']}],
];
function storyRepair(){
  if(!G || !G.flags || G.flags.cleared) return 0;
  let fixed=0, obj=null;
  for(const [f,R] of STORY_FIX){ if(!G.flags[f]) continue;
    for(const u of (R.un||[])) if(!G.unlocked.includes(u)){ G.unlocked.push(u); fixed++; }
    if(R.ch && G.chapter<R.ch){ G.chapter=R.ch; G.flags['ch'+R.ch]=1; fixed++; }
    for(const n of (R.join||[])){ const m=G.members[n]; const gone=(n==='ノア'&&G.flags.boss_tower)||(n==='リリィ'&&G.flags.lily_taken&&!G.flags.boss_tower);
      if(!gone && (!m || !m.avail)){ try{ join(n,true); fixed++; }catch(e){} } }
    if(R.obj) obj=R.obj; }
  // リリィとノアの出入り（さらわれた・戻った・去った）
  const lily=G.members['リリィ'];
  if(G.flags.boss_tower){ if(lily && !lily.avail){ try{ join('リリィ',true); fixed++; }catch(e){} } const no=G.members['ノア']; if(no && no.avail){ try{ leave('ノア'); fixed++; }catch(e){} } }
  else if(G.flags.boss_temple && lily && lily.avail){ try{ leave('リリィ'); fixed++; }catch(e){} }
  // 目的が、済んだ出来事より前を指していたら、いちばん先の出来事の目的にそろえる
  if(obj && G.chapter<7 && (G.next!==obj[1])){ const back=!G.next || !LOCS[G.next] || STORY_FIX.some(([f,R])=>G.flags[f] && R.obj && R.obj[1]===G.next) && G.next!==obj[1];
    if(back){ G.obj=obj[0]; G.next=obj[1]; fixed++; } }
  return fixed;
}

// ---------- クリア後 ----------
const FRAG_SCENES = [
  'ある周：アルトは魔王を倒し、玉座に座った。リリィが名前を呼んでも、もう振り向かなかった。',
  'ある周：ガルドは古戦場で死んだ。生き返ることはなかった。ノアがいない周だった。',
  'ある周：セイルが器を手に入れ、空は真っ黒に染まった。',
  'ある周：リリィは魔王城に一人で行き、返り討ちにあった。守り石が光り、時間が戻った。',
  'ある周：ミナの道場は焼かれ、ミナは二度と笑わなかった。',
  'ある周：ザガンは一度も生き返らず、シオンは復讐の相手を失って、さまよい続けた。',
  'ある周：オルガはセイルを信じたまま、彼の盾となって死んだ。',
  'ある周：ドルクは古文書を燃やされた日に、口封じに殺された。',
  'ある周：ノアは誰の死も取り消さなかった。そのかわり、ずっと泣いていた。',
  'ある周：アルトはリリィを疑い、剣を向けた。リリィは笑って、時間を戻した。',
  'ある周：誰も死ななかった。そして、世界がなくなった。',
  '最後の欠片：首飾りが落ちる、その直前。リリィが守り石を握りしめ、目を閉じた。――時間が、ほんの少しだけ戻った。'
];
function mazeLv(){ return 60+Math.min(11,(G.flags.mazeNo||0))*3; }
function mazeIsAgain(){ return F('boss_maze_'+(G.flags.mazeNo||0)); }
TRIG.boss_maze = async()=>{
  const k=G.flags.mazeNo||0;
  const again=F('boss_maze_'+k);
  await narr(again?`「${MAZE_BOSS[k].nm}」が、また目を開けた。`:`迷宮の最奥で、欠片の番人が目を開けた。――「${MAZE_BOSS[k].nm}」`);
  if(!await fight(12,{lv:mazeLv(),mul:1.2,maze:true,mazeK:k})) return;
  G.mazePot=(G.mazePot||0)+Math.round(20*(1+0.15*k)); // 番人を倒した分のかけら
  if(again){ await narr('番人は静かに崩れた。欠片は、もう光らない。'); await gotoLoc('sora',{x:9,y:19}); await mazeSecure(true); return; }
  setF('boss_maze_'+k); G.frag=Math.max(G.frag,k+1);
  await narr('欠片が光り、知らないはずの記憶が流れこんでくる。', FRAG_SCENES[k]);
  if(k===11){ await narr('………。'); const el=$('msg'); el.style.display='block'; el.innerHTML='<div style="text-align:center;padding:12px 0;font-size:16px;letter-spacing:.1em">to be continued</div>'; await sleep(2600); el.style.display='none';
    unlock('tomb'); setObj('初代勇者の墓所へ','tomb'); }
  else setObj(`記憶の迷宮（第${k+2}の迷宮）`,'maze');
  await gotoLoc('sora',{x:9,y:19}); await mazeSecure(true);
};
TRIG.boss_tomb = async()=>{
  if(F('boss_tomb')) return;
  await narr('墓所の奥で、古い鎧の騎士が立ち上がった。','「千年前、私はこの世界のフタになった。……お前たちは、何を選ぶ？」');
  if(!await fight(12,{lv:99,mul:1.4,maze:true})) return; setF('boss_tomb');
  if(G.party.includes('リリィ')){
    await talk([['初代勇者','……その石。私が残した守り石か。'],['レオン','やり直しの力は、愛する者を失いたくないという、私の未練だった。'],['レオン','……それを持つ少女よ。お前はまだ、使い続けるのか。'],['リリィ','………。'],['レオン','答えなくていい。私も、その答えを見届けよう。']]);
    join('レオン');
  } else await narr('騎士は、何かを探すように辺りを見回し、消えていった。');
};
// ソラの宿屋の主人（隠し仲間）
async function gordTalk(){
  const k='gord_'+Math.min(G.chapter,5); const lines=['いらっしゃい。……昔は剣を握ってたこともあったがね。','勇者さま、か。……昔、別の勇者を見たことがある。','あんたの目、あの頃の勇者に似てるな。','……オレは昔、教会の命令で「勇者になれなかった者」を狩っていた。','器になれなかった勇者は、用済みだったのさ。……続きはまた今度な。','……全部話したぜ。今度は、オレが借りを返す番だ。'];
  const i=Math.min(G.chapter,5); const cnt0=[0,1,2,3,4,5].filter(c=>F('gord_'+c)).length;
  await say('宿屋の主人', i===5 && cnt0+(F(k)?0:1)<4 ? '……まあ、昔話はまた今度にしよう。あんたらは忙しそうだ。' : lines[i]); if(!F(k)){ setF(k); }
  const cnt=[0,1,2,3,4,5].filter(c=>F('gord_'+c)).length;
  if(G.chapter>=5 && cnt>=4 && !F('gord_join')){ setF('gord_join'); await talk([['ゴード','オレはゴード。元・勇者狩りだ。……最後くらい、勇者の味方をさせてくれ。']]); join('ゴード'); }
}

// ---------- 住人 ----------
const RES_SPECIAL = {
  sora:[ ['村長',c=>c===0?'この村はな、千年前から勇者さまをお育てするためにあるんじゃ。':c>=4?'……勇者さまが器になるための村、か。わしらは、何も知らずに……。':'勇者さま、どうかご無事で。'],
         ['神父',c=>'魔王城の方角にも、毎朝祈りなさい。……それが、この村のならわしです。'],
         ['リリィの母',c=>c===0?'リリィをよろしくね。あの子、あんたのことになると無茶するから。':'あの子、小さい頃から、あんたが遠くへ行っちゃう夢ばかり見てうなされてたのよ。'] ],
  halt:[ ['宿の女将',c=>c<=1?'さっきの銀髪の子、何日も前から「勇者さまが来る」って待ってたよ。まるで知ってたみたいにね。':'銀髪の子は元気かい？ 不思議な子だったねえ。'] ],
  lumiere:[ ['教会の受付',c=>c<=4?'セイル様は、寄付をくださった方の金額を、ぜんぶ覚えておいでなんです。すごいでしょう？':'セイル様が……あんな方だったなんて。'],
            ['墓守',c=>c<=2?'最近、死んだはずの兵士を見たって噂があるんだ。気味が悪いよ。':'墓がね、ときどき空っぽになるんだ。……誰かが起こしてるのかね。'] ],
  gram:[ ['怪我をした鉱夫',c=>c<=2?'ザガンに斬られた仲間が、朝には何事もなく起きてたんだ。夢だったのかな。':'あの夜のこと、ずっと考えてる。'] ],
  garam:[ ['傭兵',c=>F('boss_ruins')?'ガルドの疑いは晴れたらしいな。あいつは義理堅い男さ。':F('boss_wreck')?'ガルドが魔王殺しだって噂？ ……オレは信じねえ。あいつは門番だった男だ。':'ガルド？ あいつは昔、魔王城の門番だったって話だぜ。'] ],
  belka:[ ['学生',c=>'あの棚の古文書、教会の人が来た日に燃えたんですよ。偶然……ですかね。'] ],
  shadow:[ ['里の子ども',c=>'魔王さまはね、やさしい人だったんだって。ずっと痛いのをがまんしてたんだって。'] ],
  refuge:[ ['グラムから来た鉱夫',c=>F('boss_tower')?'あの夜、銀髪の子がオレの仲間の手を握ってた。……あれは夢じゃなかったんだな。':'グラムの鉱夫だ。坑道にまでヒビが入って、みんなで逃げてきたんだ。'],
           ['避難所の子ども',c=>F('cleared')?'お兄ちゃんたち、もう帰ってきたの？ さっき出かけたばっかりなのに。':'空が怖いよ……。'] ],
  hate:[ ['老婆',c=>F('cleared')?'あんたら、前にもここで「いってきます」って言わなかったかい？':'ここが世界の果てさ。この先は、虚の淵だけだよ。'] ],
};
// 道案内：いまの目的地が、この町から見てどの方角かを教える（一つの町に一人だけ）
function guideLine(){
  const here=G.loc, nx=G.next; const obj=G.obj?`\n（目的：${G.obj}）`:'';
  if(!nx || !LOCS[nx] || !LOCS[here]) return '旅の無事を祈ってるよ。'+obj;
  if(nx===here) return 'この町で、まだやることがありそうだね。町の人に話を聞いてみたら？'+obj;
  const A=LOCS[here], B=LOCS[nx]; const dx=B.x-A.x, dy=B.y-A.y;
  const ang=(Math.atan2(-dy,dx)*180/Math.PI+360)%360; const d=['東','北東','北','北西','西','南西','南','南東'][Math.round(ang/45)%8];
  return `${B.n}なら、ここから${d}の方角だよ。${Math.hypot(dx,dy)>0.35?'少し遠いから、支度をしっかりね。':''}`+obj;
}
// うわさ（章ごと）。[セリフ, 条件] の形なら、条件に合うときだけ
const RUMOR = [
  ['今日は勇者さまの旅立ちの日だ！','空がなんだか変な色だね。'],
  ['黒将ザガンが南で村を焼いてるらしい。','魔王が死んだって本当かい？','教会のセイル様は立派なお方だよ。','昔話でね、時を一度も戻さずに旅をした者のところには「時の番人」が会いに来るんだってさ。'],
  ['ザガンが倒されたのに、空のヒビは広がる一方だ。',['船が出ないと商売あがったりだ。','!boss_lhcave'],['海の向こうへ、また船が出るようになったってさ。','boss_lhcave'],'時の番人のおとぎ話？ ……一度もつまずかない旅なんて、あるのかねえ。'],
  [['元魔王軍の大剣使いが犯人だって噂だよ。','!boss_ruins'],['古い本には、魔王は世界のフタだって書いてあるらしい。','goal_archive'],['砂漠の遺跡には近づかないほうがいい。','!boss_ruins'],['ザガンの旗がまた上がったって？ そんな馬鹿な。','boss_ruins'],'空のヒビが、また少し広がったね。'],
  ['雪が止まない……。','大聖堂は巡礼者でいっぱいだ。','セイル様が、勇者さまを大歓迎しているそうだ。'],
  ['世界が崩れていく……。',['セイルの塔に、教会の騎士たちが集まっている。','!boss_tower'],'ここも、いつまで持つかねえ。'],
  ['虚の淵から、黒い風が吹いてくる。','……どうか、無事で。'],
  ['なんだか長い夢を見ていた気がするよ。','前にもこの話をした気がする……。','あんたたち、どこかで会ったかい？ ……いや、気のせいか。'],
];
const FLAVOR = ['今日の晩ごはん、何にしようかな。','この町の井戸水はおいしいんだ。','うちの猫、知らない？','若いころは冒険者だったんだがねえ。','武器屋の親父は、ああ見えて優しいんだ。','宿屋の料理は絶品だよ。','最近、肩がこってね。','お金は大事にね！','あんた、いい顔してるね。','雨の匂いがする。','子どもたちが元気でうれしいよ。','魔物が増えて、商売が大変だ。'];
// 5章からの崩れていく世界では、のんきなひとりごとは言わない
const FLAVOR_DARK = ['手が震えて、何も手につかないよ。','せめて、温かいものを食べておきな。','家族の顔を、ちゃんと覚えておこうと思って。','空を見ないようにしてるんだ。','こんな時だけど、あんたの顔を見たら少し安心したよ。','祈ることしかできないなんてね。','荷物をまとめたけど、行く先がないんだ。','子どもたちには、明日の話をしてやってる。','夜が長くなった気がする。','どうか、無事で。……それしか言えないけど。'];
function decorateTown(m){
  const id=m.id; const sp=RES_SPECIAL[id]||[];
  m.npcs.filter(n=>!n.shop).forEach((n,i)=>{
    if(i<sp.length){ n.role='special'; n.nm=sp[i][0]; n.fn=sp[i][1]; n.isNew=sp[i][2]; }
    else if(i===sp.length){ n.role='guide'; n.nm='道案内の旅人'; }
    else n.role='flavor';
  });
  if(typeof decorateSide==='function') decorateSide(m);
  // 5章の王都は人が減る（話のある人は残す）
  if(id==='lumiere' && G.chapter>=5) m.npcs.forEach((n,i)=>{ if(n.role==='flavor' && i%3===0) n.gone=true; });
  // ふつうの住人に、町の中で重ならない番号を振る（同じセリフが二人に出ないように）
  // 話すことより人が多い町（崩れていく大きな町など）では、余った人はいない（逃げた）ことにする
  { const cap=typeof townPool==='function'? townPool(id).length : 99; m.npcs.filter(n=>n.role==='flavor' && !n.gone).forEach((n,i)=>{ if(i>=cap) n.gone=true; else n.fi=i; }); }
  // 町に立っている「あとで仲間になる人」は、その人の姿で。仲間になったら町からいなくなる
  m.npcs.forEach(n=>{ if(n.role!=='special' && n.role!=='side') return; const c=SPEAKER_CHAR[n.nm]; if(!c || !CHARS[c]) return; if(G.members[c]&&G.members[c].avail) n.gone=true; else n.who=c; });
  if(id==='sora' && !(G.members['ゴード']&&G.members['ゴード'].avail)){ const inn=m.npcs.find(n=>n.kind==='inn'); if(inn) inn.who='ゴード'; }
  m.npcs.forEach(n=>{ const shopLabel={inn:'宿の主人',item:'道具屋',equip:'武具屋',smith:'錬成屋'}[n.kind]; const tl=(n.role==='flavor'&&typeof townLine==='function')?townLine(id,n):null;
    n.type=npcType(n.nm||shopLabel||(tl&&tl.who)||'', n.seed); });
  if(typeof assignBankNpcs==='function') assignBankNpcs(m);
  // ソラの村：神父は教会の前に。アルトの家の扉の前はあけておく
  if(id==='sora' && m.church){ const pr=m.npcs.find(n=>n.nm==='神父'); const at=(x,y)=>m.npcs.find(n=>n.x===x&&n.y===y&&!n.gone);
    if(pr){ const o=at(m.church.x,m.church.y); if(o&&o!==pr){ o.x=pr.x; o.y=pr.y; } pr.x=m.church.x; pr.y=m.church.y; pr.dir='down'; }
    const d=at(15,18); if(d){ const c=[[12,19],[7,19],[12,16],[7,16],[17,19]].find(([x,y])=>walkable(m,x,y)); if(c){ d.x=c[0]; d.y=c[1]; } } }
  townReach(m, id==='sora'&&m.church?[[15,18]]:[]);
}
// 町の全員（とアルトの家の扉）に、入口から歩いてたどり着けるようにする。
// ふさいでいる木は切り、ふさいでいる住人は空いている場所へどいてもらう
function townReach(m,spots){
  const D=[[1,0],[-1,0],[0,1],[0,-1]], W=m.w, H=m.h, K=(x,y)=>y*W+x;
  const npcAt=(x,y)=>m.npcs.find(n=>n.x===x&&n.y===y&&!n.gone);
  const reach=()=>{ const s=new Set([K(m.start.x,m.start.y)]), q=[[m.start.x,m.start.y]]; while(q.length){ const [x,y]=q.shift(); for(const [dx,dy] of D){ const nx=x+dx,ny=y+dy; if(nx<1||ny<1||nx>=W-1||ny>=H||s.has(K(nx,ny))||!walkable(m,nx,ny)) continue; s.add(K(nx,ny)); q.push([nx,ny]); } } return s; };
  const soft=(x,y)=>{ if(x<1||y<1||x>=W-1||y>=H-1) return -1; const v=tileAt(m,x,y); const n=npcAt(x,y);
    if(n) return (!n.shop&&(v===0||v===9))?1:-1; if(walkable(m,x,y)) return 0; return v===2?1:-1; };
  for(let pass=0;pass<12;pass++){
    const ok=reach();
    const goals=[...m.npcs.filter(n=>!n.gone).map(n=>({n,adj:D.map(([dx,dy])=>[n.x+dx,n.y+dy])})), ...spots.map(([x,y])=>({spot:[x,y],adj:[[x,y]]}))];
    const bad=goals.find(g=> g.spot ? !(ok.has(K(...g.spot))) : !g.adj.some(([x,y])=>ok.has(K(x,y))));
    if(!bad) return;
    // 0-1幅優先で、いちばん少ない「どかす数」で届く道を探す
    const dist=new Map(), prev=new Map(), dq=[]; for(const k of ok){ dist.set(k,0); dq.push(k); }
    const tgt=new Set(bad.adj.filter(([x,y])=>soft(x,y)>=0||(bad.spot)).map(([x,y])=>K(x,y)));
    let hit=null;
    while(dq.length){ const k=dq.shift(); if(tgt.has(k)){ hit=k; break; } const x=k%W, y=(k-x)/W;
      for(const [dx,dy] of D){ const nx=x+dx,ny=y+dy, c=soft(nx,ny); if(c<0) continue; const nk=K(nx,ny), nd=dist.get(k)+c; if(dist.has(nk)&&dist.get(nk)<=nd) continue; dist.set(nk,nd); prev.set(nk,k); c?dq.push(nk):dq.unshift(nk); } }
    if(hit==null) return;
    const path=[]; for(let k=hit;prev.has(k);k=prev.get(k)) path.push(k);
    const used=new Set(path);
    for(const k of path){ const x=k%W, y=(k-x)/W; if(tileAt(m,x,y)===2) m.t[k]=0;
      const n=npcAt(x,y); if(n){ const free=[...ok].filter(f=>!used.has(f)&&walkable(m,f%W,(f-f%W)/W)&&!spots.some(([sx,sy])=>K(sx,sy)===f)&&f%W!==9&&f%W!==10);
        if(free.length){ free.sort((a,b)=>(Math.abs(a%W-x)+Math.abs((a-a%W)/W-y))-(Math.abs(b%W-x)+Math.abs((b-b%W)/W-y))); const f=free[0]; n.x=f%W; n.y=(f-f%W)/W; } } }
  }
}
function npcKey(n){ return `seen_${RT.map.id}_${n.idx}_${G.chapter}`; }
function npcHasNew(n){ if(n.shop) return false; if(n.role==='side') return SIDE[n.side]&&SIDE[n.side].ok(); if(n.role==='special'&&n.isNew&&n.isNew()) return true; if(n.role==='special'||n.role==='guide') return !G.flags[npcKey(n)]; return false; }
async function talkNpc(n){ RT.talkNpc=n; try{ return await talkNpc0(n); } finally{ RT.talkNpc=null; } }
async function talkNpc0(n){
  n.dir={up:'down',down:'up',left:'right',right:'left'}[G.dir]||'down';
  if(n.shop){
    if(n.kind==='inn' && RT.map.id==='sora') await gordTalk();
    await openShop(n.kind); return;
  }
  setF(npcKey(n));
  const c=G.chapter;
  if(n.role==='side'){ const q=SIDE[n.side]; if(q&&q.ok()){ await q.run(); } else await say(n.nm, 'ありがとう。助かったよ。'); return; }
  if(n.role==='special'){ const r=n.fn(c); if(typeof r==='function') await r(); else await say(n.nm, r); return; }
  if(n.role==='guide'){ await say(n.nm, guideLine()); return; }
  const tl=townLine(RT.map.id,n); await say(tl?tl.who:'', tl?tl.text:'……');
}

// ---------- 宿屋のひとこと ----------
async function innChat(){
  G.innCount=(G.innCount||0)+1;
  const has=n=>G.party.includes(n);
  if(G.chapter>=1 && G.chapter<=4 && has('リリィ') && has('ノア') && Math.random()<0.35){
    const loads=(loadMeta().loads||0);
    const pool=[[['ノア','リリィは、どうしてそんなにアルトのこと、わかるの？'],['リリィ', loads>0?'……ずっと、見てきたから。何回も。':'ずっと、見てきたから。']],
      [['リリィ','ノアは、怖くないの？ 時間がもどるのを覚えてるって。'],['ノア','……ちょっとだけ。でも、ひとりじゃないって、今は思う。']],
      [['ノア','ねえリリィ。もし、だれかが死んじゃったら、どうする？'],['リリィ', loads>0?'……やり直す、かな。何度でも。':'……どうするだろう。わかんないや。']],
      [['リリィ','そのお茶、おいしい？'],['ノア','うん。……こういう時間が、ずっと続けばいいのに。']]];
    await talk(pick(pool));
  }
  else if(F('cleared') && has('リリィ') && !F('lily_tired')){ setF('lily_tired'); await narr('夜。リリィが窓の外を見ていた。'); await talk([['リリィ','……なんでもないよ。ちょっと、疲れただけ。']]); }
  else if(G.chapter>=2 && G.chapter<=6 && Math.random()<0.3){ const ms=G.party.filter(n=>n!=='アルト'); if(ms.length>=2){ const [x,y]=[pick(ms),pick(ms)]; if(x!==y){ const L=PAIR_TALK.find(p=>(p[0]===x&&p[1]===y)||(p[0]===y&&p[1]===x)); if(L && !(G.chapter>=4 && (x==='リリィ'||y==='リリィ'))) await talk(L[2]); } } }
}
// 宿で仲間同士が話す（短い会話）
const PAIR_TALK=[
  ['ミナ','ノア',[['ミナ','ノアってさ、笑うとすっごくかわいいのに。もっと笑いなよ！'],['ノア','……こう？'],['ミナ','あはは、ひきつってる！']]],
  ['ガルド','ノア',[['ガルド','……おい、チビ。古戦場で、オレを運んだのはお前か？'],['ノア','……ううん。わたし、何もしてないよ。'],['ガルド','そうか。……ならいい。']]],
  ['オルガ','ガルド',[['オルガ','元魔王軍の男と同じ宿とはな。'],['ガルド','嫌なら別の部屋を取りな、騎士さま。'],['オルガ','……いや。あなたの剣は、まっすぐだ。それは分かる。']]],
  ['シオン','ガルド',[['シオン','あんた、魔王軍だったんだろ。ザガンのこと、知ってたのか。'],['ガルド','ああ。……あいつを止められなかった。それは、オレの罪だ。']]],
  ['ドルク','ノア',[['ドルク','巫女どのは、教会のどこで育ったのかね。'],['ノア','……覚えてない。気づいたら、セイルさまのそばにいた。'],['ドルク','……ふむ。']]],
  ['ミナ','オルガ',[['ミナ','オルガさん、腕相撲しよ！'],['オルガ','……騎士の名にかけて、負けん。'],['ミナ','そうこなくっちゃ！']]],
  ['リリィ','ミナ',[['ミナ','リリィってさ、アルトのこと好きでしょ？'],['リリィ','な、なに急に！ ……ずっと一緒だっただけだよ。']]],
  ['シオン','ミナ',[['シオン','……お前、なんでいつも笑ってられるんだ。'],['ミナ','笑ってないと、泣いちゃうからだよ。……シオンも、たまには泣きな？']]],
  ['ドルク','リリィ',[['ドルク','リリィどの。その手袋、少し見せてもらえんかね。'],['リリィ','……冷え性なんです。ごめんなさい。']]],
  ['オルガ','ノア',[['オルガ','ノア。セイル様は、あなたにとってどんな方だ？'],['ノア','……やさしい人。わたしに、だれも死なせなくていいって、言ってくれた。']]],
];
