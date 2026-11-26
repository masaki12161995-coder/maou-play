"use strict";

const RELEASE="maou-rebuild-mobile-1";
const OFFLINE=[
  "index.html",
  "manifest.webmanifest",
  "viewport.js",
  "data.js",
  "models.js",
  "fight.js",
  "world.js",
  "chapter1-layouts.js",
  "chapter1-exits.js",
  "chapter1-text.js",
  "chapter1-world.js",
  "chapter1-scenes.js",
  "field.js",
  "dialogue.js",
  "battleview.js",
  "ui.js",
  "cards.js",
  "game.js",
  "assets/E01.png",
  "assets/E03.png",
  "assets/E40.png",
  "assets/H01.png",
  "assets/H02.png",
  "assets/H03.png",
  "assets/H04.png",
  "assets/H05.png",
  "assets/H06.png",
  "assets/H08.png",
  "assets/H11.png",
  "assets/H12.png",
  "assets/H13.png",
  "assets/H14.png",
  "assets/H15.png",
  "assets/H16.png",
  "assets/H17.png",
  "assets/H19.png",
  "assets/H21.png",
  "assets/H22.png",
  "assets/M01.png",
  "assets/M02.png",
  "assets/M03.png",
  "assets/M04.png",
  "assets/M11.png",
  "assets/M33.png",
  "assets/M34.png",
  "assets/M35.png",
  "assets/M37.png",
  "assets/M38.png",
  "assets/M55.png",
  "assets/appicon_180.png",
  "assets/appicon_192.png",
  "assets/appicon_512.png",
  "assets/bag.png",
  "assets/bone.png",
  "assets/book.png",
  "assets/chest.png",
  "assets/cloth.png",
  "assets/coin.png",
  "assets/eq_amulet_01.png",
  "assets/eq_hood_01.png",
  "assets/eq_ring_01.png",
  "assets/flag.png",
  "assets/herb.png",
  "assets/lantern.png",
  "assets/map.png",
  "assets/mat_005.png",
  "assets/mat_006.png",
  "assets/mat_015.png",
  "assets/mat_054.png",
  "assets/monster_002.png",
  "assets/monster_003.png",
  "assets/monster_005.png",
  "assets/monster_006.png",
  "assets/monster_009.png",
  "assets/monster_017.png",
  "assets/monster_022.png",
  "assets/monster_026.png",
  "assets/monster_030.png",
  "assets/monster_035.png",
  "assets/monster_036.png",
  "assets/monster_037.png",
  "assets/monster_042.png",
  "assets/monster_047.png",
  "assets/monster_073.png",
  "assets/monster_082.png",
  "assets/monster_083.png",
  "assets/monster_084.png",
  "assets/monster_087.png",
  "assets/monster_090.png",
  "assets/monster_092.png",
  "assets/monster_099.png",
  "assets/monster_100.png",
  "assets/monster_102.png",
  "assets/monster_104.png",
  "assets/monster_113.png",
  "assets/monster_114.png",
  "assets/monster_119.png",
  "assets/monster_124.png",
  "assets/ore.png",
  "assets/party.png",
  "assets/person_007.png",
  "assets/person_008.png",
  "assets/person_011.png",
  "assets/person_013.png",
  "assets/person_018.png",
  "assets/person_019.png",
  "assets/person_021.png",
  "assets/person_022.png",
  "assets/person_030.png",
  "assets/person_032.png",
  "assets/person_045.png",
  "assets/person_051.png",
  "assets/person_061.png",
  "assets/person_066.png",
  "assets/person_067.png",
  "assets/person_070.png",
  "assets/person_071.png",
  "assets/person_072.png",
  "assets/person_074.png",
  "assets/person_075.png",
  "assets/person_076.png",
  "assets/person_077.png",
  "assets/person_080.png",
  "assets/person_085.png",
  "assets/person_088.png",
  "assets/person_089.png",
  "assets/person_094.png",
  "assets/person_095.png",
  "assets/person_096.png",
  "assets/person_099.png",
  "assets/person_100.png",
  "assets/person_101.png",
  "assets/rope.png",
  "assets/sealIcon.png",
  "assets/starterAxe.png",
  "assets/starterBow.png",
  "assets/starterShield.png",
  "assets/starterStaff.png",
  "assets/starterSword.png",
  "assets/starterVest.png",
  "assets/stone.png",
  "assets/tool_031.png",
  "assets/vial.png"
];

const core=new URL("index.html",self.registration.scope).href;
const staticURLs=new Set(OFFLINE.map(path=>new URL(path,self.registration.scope).href));

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(RELEASE).then(cache=>cache.addAll(OFFLINE)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith("maou-rebuild-mobile-")&&key!==RELEASE)
      .map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch",event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=="GET"||!url.href.startsWith(self.registration.scope))return;
  if(request.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(RELEASE);
      const saved=await cache.match(core);
      if(saved)return saved;
      try{
        return await fetch(request);
      }catch{}
      return Response.error();
    })());
    return;
  }
  const key=url.origin+url.pathname;
  if(!staticURLs.has(key))return;
  event.respondWith((async()=>{
    const cache=await caches.open(RELEASE);
    return await cache.match(key)||fetch(request);
  })());
});
