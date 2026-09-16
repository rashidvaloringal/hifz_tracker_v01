const CACHE_NAME = 'mushaf-hifdh-v2026';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
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

  // ഓഡിയോ ഫയലുകൾ റേഞ്ച് എറർ വരാതിരിക്കാൻ ബൈപാസ് ചെയ്യുന്നു
  if (e.request.headers.has('range') || url.hostname.includes('everyayah.com') || url.hostname.includes('verses.quran.com')) {
    return;
  }

  // API, ഫോണ്ടുകൾ എന്നിവ ഓഫ്‌ലൈനായി സ്ഥിരമായി സൂക്ഷിക്കുന്നു (Cache First with Background Update)
  if (url.hostname.includes('api.quran.com') || url.hostname.includes('static.qurancdn.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        try {
          const res = await fetch(e.request);
          if (res.status === 200) {
            cache.put(e.request, res.clone());
          }
          return res;
        } catch (err) {
          return cached;
        }
      })
    );
    return;
  }

  // ആപ്പ് ഷെൽ ഫാൾബാക്ക്
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});
