// Оконце: работает и без интернета. Страница — «сначала сеть», остальное — из кэша с обновлением.
// Модель распознавания приложение кэширует само (кэш okontse-model).
const SHELL = 'okontse-shell-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('okontse-shell-') && k !== SHELL).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (/\/(vision-|brain-|model\.json)/.test(url.pathname)) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(SHELL).then((s) => s.put('index', c)); return r; })
      .catch(() => caches.open(SHELL).then((s) => s.match('index'))));
    return;
  }
  e.respondWith(caches.open(SHELL).then(async (s) => {
    const hit = await s.match(req);
    const net = fetch(req).then((r) => { if (r.ok && (url.origin === location.origin || r.type === 'cors')) s.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
