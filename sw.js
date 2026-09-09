/* Service Worker بسيط لموقع TREND
   وظيفته الأساسية تمكين تثبيت التطبيق على الجوال (شرط من المتصفح).
   بيخزّن الصفحة وأيقوناتها بس - بيانات المنتجات والنقاط بتظل تتحمّل من الشبكة
   دايمًا حتى ما يشوف الزبون أسعار أو نقاط قديمة. */
const CACHE = 'trend-v1';
const SHELL = ['site.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // أي طلب لخدمات خارجية (Supabase / Apps Script / الصور) بيروح للشبكة مباشرة
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  // الصفحة نفسها: الشبكة أولًا، والكاش احتياط لو النت مقطوع
  if (e.request.mode === 'navigate' || url.pathname.endsWith('site.html')) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then((r) => r || caches.match('site.html')))
    );
    return;
  }

  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
