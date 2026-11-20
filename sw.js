// いつも最新版：まずネットから取りに行き、取れたら控えを更新。電波がないときだけ控えを使う
const CACHE='maou-v1';
self.addEventListener('install',e=>{ self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET' || new URL(req.url).origin!==location.origin) return;
  e.respondWith((async()=>{
    try{ const res=await fetch(req,{cache:'no-store'}); if(res && res.ok){ const c=await caches.open(CACHE); c.put(req,res.clone()); } return res; }
    catch(err){ const hit=await caches.match(req,{ignoreSearch:true}); if(hit) return hit; if(req.mode==='navigate'){ const idx=await caches.match('./index.html')||await caches.match('./'); if(idx) return idx; } throw err; }
  })());
});
