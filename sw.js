const CACHE = 'bomc4-v5';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Trang game (HTML/JS): ưu tiên bản mới nhất từ mạng, mất mạng mới dùng bản lưu.
// Ảnh/manifest: dùng bản lưu ngay rồi cập nhật ngầm.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || /\.(html|js)$/.test(url.pathname) || url.pathname.endsWith('/');
  const save = res => {
    if (res && res.ok) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(req, clone)); }
    return res;
  };
  if (isPage) {
    e.respondWith(fetch(req).then(save).catch(() => caches.match(req).then(c => c || caches.match('./index.html'))));
  } else {
    e.respondWith(caches.match(req).then(cached => cached || fetch(req).then(save)));
    e.waitUntil(fetch(req).then(save).catch(() => {}));
  }
});
