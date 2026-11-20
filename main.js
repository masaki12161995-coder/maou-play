// ===== 音・タイトル・起動 =====
let AC=null, BGM={name:null,timer:null,step:0};
function audioUnlock(){ if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); }
function soundOn(){ return AC && (!G || G.settings.sound); }
function tone(f,d,type,vol,when){ if(!AC) return; const t=(when||AC.currentTime); const o=AC.createOscillator(), g=AC.createGain(); o.type=type||'square'; o.frequency.value=f; g.gain.setValueAtTime(vol||0.05,t); g.gain.exponentialRampToValueAtTime(0.0001,t+d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+d+0.02); }
function sfx(n){ if(typeof SIM!=='undefined' && SIM.on) return; if(!soundOn()) return; const t=AC.currentTime;
  const S={tick:[[880,.04]],ok:[[660,.05],[990,.06]],back:[[440,.06]],hit:[[180,.08,'sawtooth']],crit:[[220,.06,'sawtooth'],[440,.1,'square']],heal:[[523,.08,'sine'],[659,.08,'sine'],[784,.12,'sine']],
   buff:[[600,.06,'triangle'],[800,.08,'triangle']],down:[[300,.08,'triangle'],[150,.14,'triangle']],enc:[[392,.06],[523,.06],[659,.1]],lvup:[[523,.08],[659,.08],[784,.08],[1046,.18]],
   rare:[[784,.08,'triangle'],[988,.08,'triangle'],[1318,.2,'triangle']],rainbow:[[523,.1,'sine'],[659,.1,'sine'],[784,.1,'sine'],[1046,.1,'sine'],[1318,.1,'sine'],[1568,.3,'sine']],
   join:[[659,.08],[784,.08],[1046,.16]],save:[[784,.1,'sine'],[1046,.2,'sine']],inn:[[523,.15,'sine'],[392,.15,'sine'],[523,.3,'sine']],buy:[[1046,.05],[1318,.08]],equip:[[440,.05],[660,.07]],ult:[[220,.1,'sawtooth'],[330,.1,'sawtooth'],[440,.2,'sawtooth']],rewind:[[1568,.045,'sine'],[1318,.045,'sine'],[1175,.045,'sine'],[988,.045,'sine'],[784,.045,'sine'],[659,.045,'sine'],[523,.05,'sine'],[440,.05,'sine'],[392,.3,'sine']],
   win:[[784,.07],[988,.07],[1318,.22]],mvp:[[1318,.06,'triangle'],[1760,.16,'triangle']],best:[[1568,.05,'sine'],[2093,.05,'sine'],[2637,.14,'sine']],
   pop:[[880,.04,'triangle'],[1175,.06,'triangle']],stairs:[[392,.05,'triangle'],[330,.05,'triangle'],[262,.08,'triangle']],chest:[[330,.05],[494,.05],[659,.1]],
   door:[[110,.12,'sawtooth'],[98,.2,'sawtooth']],quake:[[65,.35,'sawtooth'],[55,.35,'sawtooth'],[49,.6,'sawtooth']],ko:[[392,.08,'triangle'],[311,.08,'triangle'],[233,.2,'triangle']]}[n];
  if(!S) return; let w=t; for(const [f,d,ty] of S){ tone(f,d,ty||'square',0.05,w); w+=d*0.9; } }
// ゲージが伸びる音：割合が大きいほど高くまで上がる（delay秒あとから）
function sfxGauge(ratio,delay){ if(typeof SIM!=='undefined' && SIM.on) return; if(!soundOn()) return; const t=AC.currentTime+(delay||0), n=Math.max(3,Math.round(4+ratio*8));
  for(let i=0;i<n;i++){ tone(330+ (ratio*900)*(i/(n-1)), .035,'triangle',0.035, t+i*(0.55/n)); } }
const NOTE=n=>440*Math.pow(2,(n-69)/12);
const TRACKS={
  title:{bpm:84,m:[64,0,67,0,72,71,67,0,64,0,62,64,65,0,64,0, 60,0,64,0,67,65,64,0,62,0,59,60,62,0,0,0],b:[45,45,52,52,48,48,55,55]},
  field:{bpm:120,m:[60,64,67,72,71,67,64,67,65,69,72,77,76,72,69,72, 62,65,69,74,72,69,65,69,67,71,74,79,77,74,71,67],b:[48,48,53,53,50,50,55,55]},
  world:{bpm:100,m:[67,0,72,74,76,0,74,72,71,0,67,0,69,71,72,0, 64,0,67,69,71,0,69,67,65,0,64,0,62,0,0,0],b:[48,55,52,55,47,55,50,55]},
  battle:{bpm:160,m:[69,72,76,72,69,72,76,79,77,74,71,74,77,74,71,68, 69,72,76,81,79,76,72,76,74,71,68,71,69,0,69,0],b:[45,45,45,45,43,43,44,44]},
  boss:{bpm:150,m:[57,60,63,60,57,60,64,63,57,60,63,66,65,63,60,59],b:[33,33,36,36,39,39,38,38]},
  town:{bpm:104,m:[67,0,64,67,72,0,71,69,67,0,65,64,62,0,0,0, 64,0,65,67,69,0,67,65,64,0,62,0,60,0,0,0],b:[48,48,53,53,55,55,48,48]},
  dungeon:{bpm:112,m:[57,0,60,0,62,0,60,59,57,0,0,0,55,0,57,0, 57,0,60,0,63,0,62,60,59,0,0,0,56,0,0,0],b:[33,33,33,33,31,31,32,32],w:'square',v:0.022},
  sad:{bpm:66,m:[69,0,0,72,71,0,69,0,67,0,0,0,64,0,0,0, 65,0,0,69,67,0,65,0,64,0,0,0,0,0,0,0],b:[45,45,41,41,43,43,40,40]},
  noah:{bpm:92,m:[72,0,76,79,77,76,74,0,72,0,74,76,72,0,0,0, 69,0,72,76,74,72,71,0,72,0,0,0,0,0,0,0],b:[48,52,53,55,57,53,55,48]},
  noahDark:{bpm:132,m:[60,0,63,67,65,63,62,0,60,0,62,63,60,0,0,0, 56,0,60,63,62,60,59,0,60,0,0,0,60,63,67,72],b:[36,36,41,43,44,41,43,36],w:'sawtooth',v:0.02,bw:'square'},
  ending:{bpm:70,m:[72,0,71,72,74,0,72,0,69,0,67,69,71,0,0,0,67,0,69,71,72,0,74,0,76,0,74,72,72,0,0,0],b:[48,43,45,40,41,43,48,48]},
};
function bgm(name){
  if(name==='field' && RT.map) name=RT.map.town?'town':'dungeon';
  if(name===BGM.name && BGM.timer) return;
  if(BGM.timer){ clearInterval(BGM.timer); BGM.timer=null; }
  BGM.name=name; if(!name||!TRACKS[name]) return;
  if(name==='win'){ if(soundOn()) sfx('lvup'); return; }
  const tr=TRACKS[name]; BGM.step=0; const dt=60/tr.bpm/2*1000;
  BGM.timer=setInterval(()=>{ if(!soundOn()) return; const i=BGM.step++; const n=tr.m[i%tr.m.length]; if(n) tone(NOTE(n),dt/1000*0.9,tr.w||'triangle',tr.v||0.035); if(i%4===0){ const b=tr.b[Math.floor(i/4)%tr.b.length]; tone(NOTE(b),dt/1000*3.5,tr.bw||'sine',tr.bw?0.025:0.05); } }, dt);
}

// ---------- タイトル ----------
const tcv=$('tcv'), tcx=tcv.getContext('2d');
function drawTitle(){
  if($('title').style.display==='none') return;
  const r=$('title').getBoundingClientRect(), dpr=Math.min(3,window.devicePixelRatio||1);
  if(tcv.width!==Math.round(r.width*dpr)||tcv.height!==Math.round(r.height*dpr)){ tcv.width=Math.round(r.width*dpr); tcv.height=Math.round(r.height*dpr); }
  const W=r.width,H=r.height, t=RT.anim; tcx.setTransform(dpr,0,0,dpr,0,0); tcx.clearRect(0,0,W,H);
  // 地平線は「ボタンのすぐ上」、城の大きさは「題字とボタンの間」に収まるように
  const lb=document.querySelector('#title .tlogo').getBoundingClientRect(), bb=$('tbtns').getBoundingClientRect();
  const top=lb.bottom-r.top, btm=(bb.height?bb.top:r.bottom)-r.top;
  const hz=Math.min(H*0.72, btm-18), cxm=W/2, u=Math.max(140,Math.min(W, (hz-top-24)/0.62, H*0.55));   // 地平線・真ん中・大きさの基準
  // 空
  let g=tcx.createLinearGradient(0,0,0,hz); g.addColorStop(0,'#05071a'); g.addColorStop(0.55,'#15153a'); g.addColorStop(1,'#3a2350'); tcx.fillStyle=g; tcx.fillRect(0,0,W,hz);
  // 星（またたく）
  const rng=mulberry(7); for(let i=0;i<110;i++){ const x=rng()*W, y=rng()*hz*0.92, k=rng(); tcx.fillStyle=`rgba(255,255,255,${0.25+0.55*Math.abs(Math.sin(t/(26+k*20)+i))})`; const sz=k>0.92?2:1.2; tcx.fillRect(x,y,sz,sz); }
  // 空のヒビ（城の真上へ、ジグザグに落ちてくる）
  const k0=u/400, sx=cxm, sy=hz-214*k0; const pts=[[W*0.97,0],[W*0.91,H*0.07],[W*0.95,H*0.13],[W*0.85,H*0.22],[W*0.79,H*0.26],[(W*0.79+sx)/2+6,(H*0.26+sy)/2],[sx+4,sy-10],[sx,sy]];
  const pulse=0.6+0.4*Math.sin(t/14);
  for(const [lw,col,blur] of [[7,`rgba(168,85,247,${0.18*pulse})`,24],[3,`rgba(192,132,252,${0.75})`,14],[1.2,'#f5e8ff',4]]){
    tcx.strokeStyle=col; tcx.lineWidth=lw; tcx.shadowColor='#c084fc'; tcx.shadowBlur=blur; tcx.lineJoin='round'; tcx.beginPath(); pts.forEach(([x,y],i)=>i?tcx.lineTo(x,y):tcx.moveTo(x,y)); tcx.stroke();
    tcx.beginPath(); tcx.moveTo(pts[3][0],pts[3][1]); tcx.lineTo(W*0.99,H*0.27); tcx.moveTo(pts[5][0],pts[5][1]); tcx.lineTo(pts[5][0]-W*0.08,pts[5][1]+H*0.02); tcx.stroke(); }
  tcx.shadowBlur=0;
  // 城のうしろのぼんやりした光
  g=tcx.createRadialGradient(cxm,hz-u*0.2,4,cxm,hz-u*0.2,u*0.75); g.addColorStop(0,'rgba(124,58,237,0.28)'); g.addColorStop(1,'rgba(124,58,237,0)'); tcx.fillStyle=g; tcx.fillRect(0,0,W,hz);
  // 遠い山（2重）
  const ridge=(base,amp,seed,col)=>{ const rr=mulberry(seed); tcx.fillStyle=col; tcx.beginPath(); tcx.moveTo(0,hz); let x=0; tcx.lineTo(0,base); while(x<W){ x+=W*(0.06+rr()*0.08); tcx.lineTo(Math.min(W,x),base-rr()*amp); } tcx.lineTo(W,hz); tcx.closePath(); tcx.fill(); };
  ridge(hz-u*0.10,u*0.16,11,'#1b1838'); ridge(hz-u*0.03,u*0.09,23,'#100f24');
  // 城（真ん中）
  tcx.fillStyle='#07070f'; const B=hz+1, c=cxm, k=k0;
  const R=(x,y,w,h)=>tcx.fillRect(c+x*k,B-y*k-h*k,w*k,h*k);
  R(-90,0,180,70); R(-112,0,34,112); R(78,0,34,112); R(-58,0,26,132); R(32,0,26,132); R(-18,0,36,168);
  const spire=(x,y,w,h)=>{ tcx.beginPath(); tcx.moveTo(c+x*k,B-y*k); tcx.lineTo(c+(x+w/2)*k,B-(y+h)*k); tcx.lineTo(c+(x+w)*k,B-y*k); tcx.fill(); };
  spire(-116,112,42,34); spire(74,112,42,34); spire(-61,132,32,30); spire(29,132,32,30); spire(-22,168,44,46);
  for(let i=-5;i<5;i++) R(i*18+2,70,9,8);   // 城壁のぎざぎざ
  // 窓（消えかけの紫）
  tcx.fillStyle=`rgba(192,132,252,${0.35+0.25*Math.sin(t/20)})`; for(const [x,y] of [[-5,120],[-5,96],[-100,70],[90,70],[-50,96],[40,96]]) R(x,y,10,12);
  // 手前の丘と地面
  g=tcx.createLinearGradient(0,hz,0,H); g.addColorStop(0,'#0b0b18'); g.addColorStop(1,'#04040a'); tcx.fillStyle=g; tcx.fillRect(0,hz,W,H-hz);
  tcx.fillStyle='#0d0d1c'; tcx.beginPath(); tcx.moveTo(0,hz+u*0.06); tcx.quadraticCurveTo(W*0.25,hz-u*0.02,W*0.5,hz+u*0.03); tcx.quadraticCurveTo(W*0.75,hz+u*0.08,W,hz+u*0.02); tcx.lineTo(W,H); tcx.lineTo(0,H); tcx.fill();
  // ふもとの村の明かり（ソラの村）
  for(const [x,y] of [[0.16,0.075],[0.2,0.085],[0.13,0.09],[0.23,0.07]]){ tcx.fillStyle=`rgba(253,224,138,${0.55+0.3*Math.sin(t/9+x*40)})`; tcx.fillRect(W*x,hz+u*y,2.5,2.5); }
  if(META.cleared){ const x=cxm,y=hz+u*0.2; const gl=0.5+0.5*Math.sin(t/10); tcx.strokeStyle=`rgba(250,204,21,${0.5+gl*0.5})`; tcx.lineWidth=2; tcx.beginPath(); tcx.arc(x,y,10,0.2,Math.PI-0.2); tcx.stroke(); tcx.fillStyle=`rgba(250,204,21,${0.6+gl*0.4})`; tcx.beginPath(); tcx.arc(x,y+11,4,0,7); tcx.fill(); }
}
setInterval(drawTitle,60);
function showTitle(){
  RT.mode='title'; $('title').style.display='flex'; $('msg').style.display='none'; hidePanel(); bgm(null);
  META=loadMeta(); const susp=loadSave('mzy_suspend'), ss=[1,2,3].map(k=>loadSave(slotKey(k)));
  $('tsub').textContent = META.cleared ? '― 首飾りは、どこへ消えた？ ―' : '― The Demon King Died Yesterday ―';
  const start=async(fn)=>{ $('title').style.display='none'; await fn(); };
  const main=()=>{
    const b=[]; if(susp) b.push(['susp','中断したところから',`記録${susp.slot||1}・${saveInfo(susp)}`]); if(ss.some(Boolean)) b.push(['cont','つづきから','']); b.push(['new','はじめから','']);
    $('tbtns').innerHTML=b.map(([k,t,s])=>`<button class="cb" data-t="${k}">${t}${s?`<div style="font-size:11px;opacity:.7;font-weight:400;margin-top:2px">${s}</div>`:''}</button>`).join('');
    $('tbtns').querySelectorAll('[data-t]').forEach(x=>x.onclick=()=>{ audioUnlock(); sfx('ok'); const k=x.dataset.t;
      if(k==='susp') return start(async()=>{ kvDel('mzy_suspend'); resumeFrom(susp); bgm(RT.mode==='world'?'world':'field'); });
      pick(k); });
  };
  // 記録を選ぶ（つづきから：書いてある記録だけ選べる／はじめから：空き、または上書きを確かめて）
  const pick=(mode)=>{
    $('tbtns').innerHTML=`<div class="tpk">${mode==='cont'?'どの記録から始める？':'どの記録で始める？'}</div>`+[1,2,3].map(k=>{ const s=ss[k-1]; const dis=mode==='cont'&&!s;
      return `<button class="cb slotb${dis?' dis':''}" data-k="${k}">${slotLabel(k,s,false)}</button>`; }).join('')+`<button class="cb sm tback">もどる</button>`;
    $('tbtns').querySelector('.tback').onclick=()=>{ sfx('back'); main(); };
    $('tbtns').querySelectorAll('[data-k]').forEach(x=>x.onclick=()=>{ const k=+x.dataset.k, s=ss[k-1];
      if(mode==='cont'){ if(!s) return; sfx('ok'); return start(async()=>{ RT.slot=k; resumeFrom(s); bgm(RT.mode==='world'?'world':'field'); }); }
      if(s && !x.dataset.conf){ x.dataset.conf=1; sfx('tick'); const e=x.querySelector('.ss'); e.textContent='もう一度タップで消してはじめる'; e.style.color='#ffb3c1'; return; }
      sfx('ok'); start(async()=>{ RT.slot=k; kvDel(slotKey(k)); kvDel('mzy_suspend'); newGame(); RT.dark=true; enterRoom(); bgm('town'); RT.busy=true; await TRIG.start(); if(TRIG.dream) await TRIG.dream(); await TRIG.wake(); RT.busy=false; });
    });
  };
  main();
  bgmTitleWhenTapped();
}
// アプリを閉じた・切り替えたときは自動で中断セーブ（フィールドと世界地図のみ）
function autoSuspend(){ try{ if((RT.mode==='field'||RT.mode==='world') && !RT.busy && !RT.event && !msgResolve && G && G.party){ const s={...G, slot:RT.slot||1, saveLoc:{loc:RT.mode==='world'?'__world':G.loc,floor:G.floor,x:G.x,y:G.y}}; kvSet('mzy_suspend',JSON.stringify(s)); } }catch(e){} }
// 戻ってきたら中断データは消す（中断は「閉じたまま終わったとき」の保険。やり直しには使えない）
document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='hidden') autoSuspend(); else if(document.visibilityState==='visible' && RT.mode!=='title'){ try{ kvDel('mzy_suspend'); }catch(e){} } });
window.addEventListener('pagehide',autoSuspend);
function bgmTitleWhenTapped(){ const h=()=>{ audioUnlock(); if(RT.mode==='title') bgm('title'); document.removeEventListener('pointerdown',h); }; document.addEventListener('pointerdown',h); }

// ---------- 起動 ----------
window.addEventListener('resize',()=>{ resizeCanvas(); });
resizeCanvas(); setTimeout(resizeCanvas,200);
requestAnimationFrame(frame);
showTitle();
// テスト用の入口
window.__G = ()=>G;
