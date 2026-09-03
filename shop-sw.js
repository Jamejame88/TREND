/* متجر TREND — عامل الخدمة
   يخزّن هيكل الصفحة محليًا لتفتح فورًا، والبيانات تُجلب من الشبكة دائمًا.
   ملاحظة: لوحة الإدارة (panel.html) لها عامل خدمة منفصل (sw.js). */

const CACHE = 'trend-shop';
const SHELL = ['./site.html', './shop-manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  /* لوحة الإدارة ونداءات البيانات لا تُخزّن هنا */
  if (url.indexOf('panel.html') !== -1 ||
      url.indexOf('script.google.com') !== -1 ||
      url.indexOf('script.googleusercontent.com') !== -1 ||
      e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
