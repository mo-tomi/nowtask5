const CACHE_NAME = 'nowtask-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/css/style-base.css',
  '/css/style-components.css',
  '/js/core.js',
  '/js/tasks.js',
  '/js/render.js',
  '/js/modals.js',
  '/js/gauge.js',
  '/js/events.js',
  '/js/ui-main.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// インストール時にキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Cache installation failed:', err);
      })
  );
  // 新しいService Workerをすぐにアクティブ化
  self.skipWaiting();
});

// アクティベーション時に古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 新しいService Workerがすぐに制御を開始
  return self.clients.claim();
});

// フェッチ時のキャッシュ戦略（Cache First）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }

        // キャッシュになければネットワークから取得
        return fetch(event.request).then(response => {
          // 有効なレスポンスかチェック
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスをクローンしてキャッシュに保存
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // オフライン時のフォールバック（必要に応じて追加）
        return caches.match('/index.html');
      })
  );
});

// バックグラウンド同期（オプション）
self.addEventListener('sync', event => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // タスクの同期処理（必要に応じて実装）
  console.log('Background sync triggered');
}
