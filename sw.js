/* Bill Management — Service Worker v2 */
const CACHE = 'bill-mgmt-v2';

/* ── Install: cache the app shell ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      /* キャッシュ失敗してもインストールは続行する */
      return cache.addAll([
        './payment_manager.html',
        './'
      ]).catch(function() {});
    })
  );
  /* 旧バージョンを待たずに即時アクティブ化 */
  self.skipWaiting();
});

/* ── Activate: 古いキャッシュを削除 ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: キャッシュ優先、なければネットワーク、
           両方失敗したらオフラインページを返す ── */
self.addEventListener('fetch', function(e) {
  /* POSTなどのナビゲーション以外はスルー */
  if (e.request.method !== 'GET') return;

  var url = new URL(e.request.url);

  /* Google Fonts: ネットワーク優先 → キャッシュ → 無視 */
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var copy = res.clone();
        caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  /* アプリ本体: キャッシュ優先 → ネットワーク取得してキャッシュ更新 */
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      /* バックグラウンドでネットワークから最新版を取得してキャッシュ更新 */
      var networkFetch = fetch(e.request).then(function(res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function() { return null; });

      /* キャッシュがあればすぐ返し、なければネットワークを待つ */
      return cached || networkFetch;
    })
  );
});

/* ── メッセージ受信: SKIP_WAITING ── */
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
