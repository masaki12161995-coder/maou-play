// ===== 寄り道（サブイベント） =====
// 町の住人の一人が「頼みごと」を持つ。条件を満たすと頭に！が出る。報酬は紫以上の装備か、仲間の過去が分かる会話。
const hasM = n => G.members[n] && G.members[n].avail;
function sideReward(slot, r, kind){ const key='side_'+G.loc+'_'+G.chapter+'_'+(slot||'x'); const it=withRunSeed(key, ()=>{ const rr=typeof r==='object'?(Math.random()<r.up?3:2):(r||2); return makeItem(slot||randomSlot(), avgLv()+3, rr, kind); }); it.id=G.nid++; gainItem(it); const bk=G.chapter>=4?'book3':'book2'; G.inv[bk]=(G.inv[bk]||0)+1; toast(`${ITEMS[bk].n}も手に入れた`); return it; }
async function sideGot(it){ sfx(it.r>=3?'rare':'ok'); await say('', `${itemName(it)} を手に入れた！`); }
async function sideFight(area, n, lvAdd, opts){
  for(let w=0; w<n; w++){ const r=await randomBattle(area, G.loc, {lv:avgLv()+(lvAdd||2), ...(opts||{})}); if(r!=='win') return false; }
  return true;
}
const SIDE = {
  mina_dojo:{ town:'lumiere', who:'道場の弟子', ok:()=>G.chapter>=1&&hasM('ミナ')&&!F('sd_mina'),
    run:async()=>{
      await talk([['道場の弟子', G.chapter>=5?'ミナ！ 王都が崩れて、逃げてきたゴロツキどもが道場に居すわってるんだ！':'ミナ！ 帰ってきたのか！ 道場が……ゴロツキどもに乗っ取られてるんだ！'],['ミナ','父ちゃんの道場に？ ……アルト、ちょっと付き合って！']]);
      if(!await sideFight(2,2,3)) return;
      setF('sd_mina');
      await talk([['ミナ','……ふう。父ちゃんね、最後まで「拳は守るためにある」って言ってた。'],['ミナ','魔王軍と戦って死んだんじゃないの。逃げ遅れた子をかばって、崖から落ちたんだ。'],['ミナ','だからあたし、だれかをかばえる拳になりたい。……へへ、ちょっとかっこつけすぎ？']]);
      await sideGot(sideReward('arm',2)); } },
  orga_grave:{ town:'azur', who:'港の墓守', ok:()=>G.chapter>=2&&hasM('オルガ')&&!F('sd_orga'),
    run:async()=>{
      await talk([['港の墓守','騎士さま、またいらしたんですね。部下の方々の墓、きれいにしておきましたよ。'],['オルガ','……ありがとう。'],['オルガ','アルト殿。ここには、私の部下が眠っている。セイル様の命令で、魔物の巣に向かわせた者たちだ。'],['オルガ', G.chapter>=5?'誰も戻らなかった。……命令は正しかったと、信じていた。信じなければ、ここに立てなかった。今は……分からない。':'誰も戻らなかった。……命令は正しかったと、今も信じている。信じなければ、ここに立てない。']]);
      setF('sd_orga');
      await talk([['港の墓守','騎士さま、これを。部下の方が、いつか隊長に渡してくれと預けていったものです。']]);
      await sideGot(sideReward('head',2)); } },
  gard_debt:{ town:'garam', who:'借金取り', ok:()=>G.chapter>=2&&hasM('ガルド')&&!F('sd_gard'),
    run:async()=>{
      const cost=200*Math.max(2,G.chapter)*Math.max(2,G.chapter);
      await talk([['借金取り','おい、ガルド。死んだオルソの借金、まだ残ってるぜ。'],['ガルド','……あいつの分は、オレが払うと言ったはずだ。']]);
      const c=await choose(`借金取り「${cost.toLocaleString()}Gだ。払えないなら、腕ずくでもらう」`,[`${cost.toLocaleString()}G払う`,'戦う','やめる']);
      if(c===2) return;
      if(c===0){ if(G.gold<cost){ await say('借金取り','足りねえじゃねえか。出直してきな。'); return; } G.gold-=cost; sfx('buy'); }
      else { if(!await sideFight(9,1,3)) return; }
      setF('sd_gard');
      await talk([['ガルド','……オルソはな、魔王軍で一緒だった。門番のくせに花が好きなやつだった。'],['ガルド','借金は、病気の妹のためだった。あいつが死んだとき、妹は生きてた。……それで十分だ。'],['ガルド','礼だ。オルソの形見だが、オレには小さすぎる。']]);
      await sideGot(sideReward('acc',2)); } },
  sion_1:{ town:'dura', who:'荒野の宿の主人', ok:()=>G.chapter>=3&&hasM('シオン')&&!F('sd_sion1'),
    run:async()=>{
      await talk([['荒野の宿の主人','坊主、焼かれた村の生き残りを探してるんだろ。……サハに、それらしい娘がいるって噂だ。'],['シオン','……本当か。']]);
      setF('sd_sion1'); } },
  sion_2:{ town:'saha', who:'水くみの娘', ok:()=>F('sd_sion1')&&hasM('シオン')&&!F('sd_sion2'),
    run:async()=>{
      await talk([['水くみの娘','……シオン？ シオンなの？'],['シオン','リタ……！ 生きてたのか。'],['水くみの娘','火の中で、銀色の髪のお姉ちゃんが、わたしの手を引いてくれたの。気がついたら、ここにいた。'],['シオン','銀色の……？'],['水くみの娘','うん。……でもね、そのとき、わたし、一度息が止まった気がするの。夢かな。']]);
      setF('sd_sion2');
      await talk([['シオン','……ありがとな、リタ。生きててくれて。'],['水くみの娘','これ、村のお守り。シオンが持ってて。']]);
      await sideGot(sideReward('acc',{up:0.3})); } },
  dorc_past:{ town:'belka', who:'古文書館の司書', ok:()=>G.chapter>=3&&hasM('ドルク')&&!F('sd_dorc'),
    run:async()=>{
      await talk([['古文書館の司書','ドルク先生、教会からまた手紙が届いています。「研究をやめよ」と。'],['ドルク','……ふん。何度目だろうな。'],['ドルク','アルト殿。わしが教会を追われたのは、「魔王はフタだ」と書いたからではない。'],['ドルク','「巫女の力は、使うたびに何かを育てている」と書いたからじゃ。……その「何か」が何か、わしにも分からんかった。'],['ドルク','その論文は、セイル司祭が自ら燃やした。笑っておったよ。']]);
      await say('','書庫の奥で、何かが動いた。');
      if(!await sideFight(12,1,4)) return;
      setF('sd_dorc');
      await talk([['ドルク','……やれやれ。古い番人じゃ。これは、わしが若いころに使っていた杖。持っていけ。']]);
      await sideGot(sideReward('weapon',2,'m')); } },
  arena:{ town:'garam', who:'闘技場の受付', ok:()=>G.chapter>=3&&!F('sd_arena_'+G.chapter),
    run:async()=>{
      const c=await choose('闘技場の受付「3連戦で勝ち抜けば、景品が出るよ。途中で回復はなし。挑戦するかい？」',['挑戦する','やめる']); if(c!==0) return;
      const area=LOCS[G.next]?LOCS[G.next].area:9;
      if(!await sideFight(Math.min(area,20),3,4)) return;
      setF('sd_arena_'+G.chapter); await say('闘技場の受付','3連勝だ！ おめでとう。景品を持っていきな。');
      { const w=arenaWins(); if(w<4 && !RC('bella')) await say('闘技場の受付', w===1? 'そうそう、ギルド長があんたたちを見てたよ。あの人、ちがう時期に4回勝ち抜いた相手としか話さないんだってさ。' : `これで${w}回目だね。ギルド長が、また見てたよ。`); }
      await sideGot(sideReward(null,{up:0.2})); } },
  nest:{ town:'dura', who:'牛飼い', ok:()=>G.chapter>=3&&!G.unlocked.includes('nest'),
    run:async()=>{
      await talk([['牛飼い','荒野の東の岩山にな、光る魔物が集まる巣があるんだ。'],['牛飼い','光る魔物は、いい物を落とすって話だぜ。命知らずなら行ってみな。']]);
      unlock('nest'); toast('世界地図に「光る敵の巣」が増えた'); } },
};
// 町の住人に頼みごとを割り当てる（特別な住人・道しるべの次の人）
function decorateSide(m){
  const qs=Object.entries(SIDE).filter(([k,q])=>q.town===m.id && q.ok());
  const pool=m.npcs.filter(n=>!n.shop && n.role==='flavor' && !n.gone);
  qs.forEach(([k,q],i)=>{ const n=pool[i]; if(!n) return; n.role='side'; n.side=k; n.nm=q.who; });
}
