// オフラインでも遊べるようにする係（ホーム画面のアプリ用）
// ・ページ（.html）は、つながるときは毎回いちばん新しいものを取りに行き、つながらないときは前に保存したものを出す
// ・js は「?v=番号」つきなので、同じ番号なら保存したものを使う（更新すると番号が変わり、古い番号の分は消す）
// ・絵などは、保存したものをすぐ出しつつ、裏で新しいものに入れかえておく
// ・ページを開くたびに files.json（ゲームで使うファイルの一覧）を見て、まだ保存していない物を裏で保存する
const CACHE = "rpg-v1";
self.addEventListener("install", e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(["./", "./index.html", "./cards.html", "./manifest.webmanifest"]).catch(() => {}))); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
async function store(req, res) {
  if (!res || !res.ok) return res;
  const c = await caches.open(CACHE), url = new URL(req.url);
  await c.put(req, res.clone());
  if (url.search.includes("v=")) for (const k of await c.keys()) { const u = new URL(k.url); if (u.pathname === url.pathname && u.search !== url.search) c.delete(k); } // 古い番号の js を消す
  return res;
}
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  if (req.mode === "navigate" || url.pathname.endsWith(".html") || url.pathname.endsWith("/")) {
    e.respondWith(fetch(req).then(r => store(req, r)).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match("./index.html"))));
  } else if (url.search.includes("v=")) {
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(r2 => store(req, r2))));
  } else {
    e.respondWith(caches.match(req).then(r => { const f = fetch(req).then(r2 => store(req, r2)).catch(() => r); return r || f; }));
  }
});
// ページから「そろえて」と言われたら、一覧のうちまだ保存していない物を保存する
self.addEventListener("message", e => {
  if (e.data !== "sync") return;
  e.waitUntil((async () => {
    try {
      const list = await (await fetch("files.json", { cache: "no-store" })).json(), c = await caches.open(CACHE);
      for (const f of list) if (!(await c.match(f))) { try { const r = await fetch(f); if (r.ok) await c.put(f, r); } catch (err) {} }
    } catch (err) {}
  })());
});
