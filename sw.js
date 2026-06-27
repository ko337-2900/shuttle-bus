// ─────────────────────────────────────────────────────────
// Service Worker – シティハウス小金井公園 シャトルバス
//
// キャッシュ戦略:
//   HTML / JS / CSS / 画像 → cache-first（高速表示）
//   timetable.json         → network-first（常に最新データ）
//
// バージョン更新手順:
//   CACHE_VERSION を上げるだけで古いキャッシュが自動削除される
// ─────────────────────────────────────────────────────────

const CACHE_VERSION = 'v0.0.4079'; // ← 更新時にここだけ変更する
const CACHE_NAME    = `shuttle-${CACHE_VERSION}`;

// cache-first で管理する静的アセット
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './app.json',
  './icon-192.png',
  './icon-512.png',
  './protobuf.min.js',
];

// network-first で管理するファイル（常に最新を取得）
const NETWORK_FIRST = [
  './timetable.json',
];

// ── インストール: 静的アセットをキャッシュ ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()) // 即座にアクティブ化
  );
});

// ── アクティベート: 古いキャッシュを削除 → 全クライアントを即時制御 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME) // 現バージョン以外を削除
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // 開いているタブも即座に新SWで制御
  );
});

// ── フェッチ: ファイルに応じてキャッシュ戦略を切り替え ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isNetworkFirst = NETWORK_FIRST.some(f => url.pathname.endsWith(f.replace('./', '')));

  if (isNetworkFirst) {
    // network-first: ネットワーク優先、失敗時はキャッシュを使用
    event.respondWith(networkFirst(event.request));
  } else {
    // cache-first: キャッシュ優先、なければネットワーク
    event.respondWith(cacheFirst(event.request));
  }
});

// cache-first 戦略
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

// network-first 戦略（timetable.json用）
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // 取得成功 → キャッシュを更新して返す
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
      return response;
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (err) {
    // ネットワーク失敗 → キャッシュから返す（オフライン対応）
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}
