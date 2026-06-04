/* Bill Management — Service Worker v1 */
const CACHE = 'bill-mgmt-v1';
const ASSETS = [
  './payment_manager.html',
  'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;600;700&display=swap'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  /* Network-first for fonts, cache-first for app shell */
  if (e.request.url.includes('fonts.googleapis') ||
      e.request.url.includes('fonts.gstatic')) {
    e.respondWith(
      caches.open(CACHE).then(function(cache) {
        return fetch(e.request).then(function(res) {
          cache.put(e.request, res.clone());
          return res;
        }).catch(function() {
          return cache.match(e.request);
        });
      })
    );
    return;
  }
  /* Cache-first for the app HTML */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(res) {
        return caches.open(CACHE).then(function(cache) {
          cache.put(e.request, res.clone());
          return res;
        });
      });
    })
  );
});
