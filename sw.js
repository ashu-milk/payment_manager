/* ════════════════════════════════════════
   Bill Management — Service Worker
   役割: オフライン対応 + 自動更新チェック
   ════════════════════════════════════════ */

/* このバージョン番号を更新するたびに変更してください。
   変更すると古いキャッシュが破棄され、新しいファイルが
   ダウンロードされます。 */
const CACHE_VERSION = 'v3';
const CACHE_NAME = 'bill-management-' + CACHE_VERSION;

const ASSETS_TO_CACHE = [
  './payment_manager.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

/* ── インストール時: 最新ファイルをキャッシュ ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── 有効化時: 古いバージョンのキャッシュを削除 ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name.startsWith('bill-management-') && name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── フェッチ時: ネットワーク優先、失敗時はキャッシュ ──
   オンライン時は常に最新ファイルを取得し、
   オフライン時は保存済みファイルで動作します。 */
self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function(networkResponse) {
      var responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(event.request, responseClone);
      });
      return networkResponse;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});

/* ── メッセージ受信: アプリ側からの更新適用指示 ── */
self.addEventListener('message', function(event) {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
