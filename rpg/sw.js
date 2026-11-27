// オフラインでも遊べるようにする係（ホーム画面のアプリ用）
// ・ページ（.html）は、つながるときは毎回いちばん新しいものを取りに行き、つながらないときは前に保存したものを出す
// ・js は「?v=番号」つきなので、同じ番号なら保存したものを使う（更新すると番号が変わる）
// ・絵や音は、保存したものをすぐ出しつつ、裏で新しいものに入れかえておく
const CACHE = "rpg-v1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./cards.html", "./manifest.webmanifest"]).catch(() => {}))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const put = res => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(k => k.put(req, c)); } return res; };
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    e.respondWith(fetch(req).then(put).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
  } else if (url.search.includes("v=")) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(put)));
  } else {
    e.respondWith(caches.match(req).then(r => { const f = fetch(req).then(put).catch(() => r); return r || f; }));
  }
});
