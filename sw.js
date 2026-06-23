// Service Worker – cache-first for offline support
// バージョンを上げるたびにCACHEを変更する → 即時更新される
const CACHE = 'shuttle-v0.0.0';
const ASSETS = ['./index.html', './manifest.json', './timetable.json', './icon-192.png', './icon-512.png'];

// インストール: 新キャッシュを作成し即座にアクティブ化
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  // 待機せず即座にactivateへ
  self.skipWaiting();
});

// アクティベート: 古いキャッシュを全削除 → 全クライアントを即時制御
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // 開いているタブも即座に新SWで制御
  );
});

// フェッチ: キャッシュ優先、なければネットワーク
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
