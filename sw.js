// いつも最新版：まずネットから取りに行き、取れたら控えを更新。電波がないときだけ控えを使う
const CACHE='maou-v1';
self.addEventListener('install',e=>{ self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET' || new URL(req.url).origin!==location.origin) return;
  // 絵は、控えがあれば控えをすぐ使い、裏で新しいものを取りに行く（電波が弱くても絵が欠けないように）
  if(/\/img\/[^?]+\.png/.test(req.url)){
    e.respondWith((async()=>{
      const c=await caches.open(CACHE), key=req.url.split('?')[0], hit=await c.match(key);
      const net=fetch(key,{cache:'no-store'}).then(res=>{ if(res&&res.ok) c.put(key,res.clone()); return res; });
      if(hit){ e.waitUntil(net.catch(()=>{})); return hit; }
      return net;
    })());
    return;
  }
  e.respondWith((async()=>{
    try{ const res=await fetch(req,{cache:'no-store'}); if(res && res.ok){ const c=await caches.open(CACHE); c.put(req,res.clone()); } return res; }
    catch(err){ const hit=await caches.match(req,{ignoreSearch:true}); if(hit) return hit; if(req.mode==='navigate'){ const idx=await caches.match('./index.html')||await caches.match('./'); if(idx) return idx; } throw err; }
  })());
});
