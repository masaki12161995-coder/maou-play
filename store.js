// セーブの保管：端末（localStorage）＋ アカウント側（Claudeのdb）に二重保存。新しい方を使う。
const KV={ mem:{}, cloud:null, ready:false, queue:{}, busy:{} };
function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function lsSet(k,v){ try{ if(v==null) localStorage.removeItem(k); else localStorage.setItem(k,v); }catch(e){} }
function kvAt(k){ return +(KV.mem['@'+k] ?? lsGet('@'+k) ?? 0); }
function kvGet(k){ return (k in KV.mem) ? KV.mem[k] : lsGet(k); }
function kvSet(k,v){ const at=Date.now(); KV.mem[k]=v; KV.mem['@'+k]=at; lsSet(k,v); lsSet('@'+k,String(at)); kvPush(k,v,at); }
function kvDel(k){ kvSet(k,null); }
async function kvPush(k,v,at){
  if(!KV.cloud) return; KV.queue[k]={v,at}; if(KV.busy[k]) return;
  KV.busy[k]=true;
  while(KV.queue[k]){ const q=KV.queue[k]; delete KV.queue[k];
    try{ await KV.cloud.doc(k).set({v:q.v, at:q.at}); }catch(e){ console.warn('cloud save failed',e); } }
  KV.busy[k]=false;
}
async function kvInit(){
  try{
    if(!window.claude || !claude.use) return;
    const [db,user]=await Promise.all([claude.use('db'),claude.use('user')]); if(!db||!user) return;
    const id=await user.id(); if(!id) return;
    const col=db.collection('data/users/'+id);
    let changed=false;
    for(const k of ['mzy_save','mzy_save2','mzy_save3','mzy_suspend','mzy_meta']){
      let d=null; try{ const s=await col.doc(k).get(); d=s&&(typeof s.data==='function'?s.data():s); }catch(e){}
      const cAt=d&&d.at?+d.at:0, lAt=kvAt(k);
      if(cAt>lAt){ KV.mem[k]=d.v??null; KV.mem['@'+k]=cAt; lsSet(k,d.v??null); lsSet('@'+k,String(cAt)); changed=true; }
      else if(lAt>cAt){ KV.cloud=col; kvPush(k,kvGet(k),lAt); }
    }
    KV.cloud=col; KV.ready=true;
    if(changed && RT.mode==='title') showTitle();
  }catch(e){ console.warn('cloud init failed',e); }
}
setTimeout(kvInit,0);
