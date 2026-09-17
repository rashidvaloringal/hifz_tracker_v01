const CACHE_NAME = 'mushaf-core-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Audio streams using Range headers bypass service worker cache
  if (e.request.headers.has('range') || url.hostname.includes('everyayah.com') || url.hostname.includes('verses.quran.com')) {
    return;
  }

  // Dynamic Cache for Fonts and Quran API
  if (url.hostname.includes('api.quran.com') || url.hostname.includes('static.qurancdn.com')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const res = await fetch(e.request);
          if (res.status === 200) cache.put(e.request, res.clone());
          return res;
        } catch (err) {
          return cached;
        }
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
