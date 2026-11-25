const cachePrefix = 'shiokage-';
const cacheName = `${cachePrefix}v7`;
const scope = new URL(self.registration.scope);
const shell = [
  './', './index.html', './style.css', './battle.css', './adventure-ui.css', './game.js', './map.js', './content.js', './battle.js',
  './audio.js', './campaign.js', './dangers.js', './recruits.js', './town-landmarks.js', './characters.js', './expansion.js',
  './journey.js', './companion-journeys.js', './inquiries.js', './trials.js', './adventure-story.js', './adventure-world.js', './adventure-world-data.js',
  './adventure-terrain.js', './adventure-landscapes.js', './adventure-balance.js', './adventure-loot.js', './adventure-hunts.js', './adventure-companions.js',
  './adventure-companion-scenes.js', './adventure-companion-ui.js',
  './manifest.webmanifest', './icon.png', './icon-mask.png',
  './assets/catalog.json'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await Promise.all(shell.map(async path => {
      const request = new Request(new URL(path, scope), { cache: 'reload' });
      const response = await fetch(request);
      if (!isCacheable(response, path.slice(2), false)) throw new Error(`Missing application file ${path}`);
      await cache.put(request, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const cache = await caches.open(cacheName);
    for (const key of keys.filter(key => key !== cacheName && key.startsWith(cachePrefix))) {
      const previous = await caches.open(key);
      const images = (await previous.keys()).filter(request => {
        const url = new URL(request.url);
        return url.origin===scope.origin && url.pathname.startsWith(scope.pathname+'assets/') && url.pathname.endsWith('.png');
      });
      // The asset bank is unchanged in this update. Transfer downloaded sprites before removing the old shell.
      for (let index=0; index<images.length; index+=32) {
        await Promise.all(images.slice(index,index+32).map(async request => {
          if (await cache.match(request)) return;
          const ready = await previous.match(request);
          if (ready) await cache.put(request,ready);
        }));
      }
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

function isCacheable(response, path, navigating) {
  if (!response.ok || response.status !== 200 || response.type !== 'basic' || response.redirected) return false;
  const type = response.headers.get('content-type') || '';
  if (navigating || path === '' || path.endsWith('.html')) return type.includes('text/html');
  if (path.endsWith('.js')) return /(?:java|ecma)script/i.test(type);
  if (path.endsWith('.css')) return type.includes('text/css');
  if (path.endsWith('.png')) return type.includes('image/png') || type.includes('application/octet-stream');
  if (/\.(?:json|webmanifest)$/.test(path)) return type.includes('json');
  return false;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname) || request.headers.has('range')) return;
  const path = url.pathname.slice(scope.pathname.length);
  const navigating = request.mode === 'navigate';

  event.respondWith((async () => {
    const cache = await caches.open(cacheName).catch(() => undefined);
    if (cache && path.startsWith('assets/') && !path.endsWith('.json')) {
      const asset = await cache.match(request) || undefined;
      if (asset) return asset;
    }

    try {
      const response = await fetch(request, { cache: 'no-cache' });
      if (cache && isCacheable(response, path, navigating)) {
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch {
      if (cache) {
        const previous = await cache.match(request) || (navigating && await cache.match(new URL('./', scope)));
        if (previous) return previous;
      }
      return Response.error();
    }
  })());
});
