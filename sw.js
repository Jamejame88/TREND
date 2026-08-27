/* لوحة TREND — عامل الخدمة
   يخزّن ملف اللوحة محليًا حتى تفتح فورًا وتشتغل حتى لو النت ضعيف.
   البيانات (المنتجات، الأرقام) بتضل تُجلب من الشبكة دائمًا. */

const CACHE = 'trend-panel-v1';
const SHELL = [
  './panel.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL).catch(() => {}))
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

  /* لا نخزّن أي نداء بيانات — لازم يكون طازج دائمًا */
  if (url.indexOf('script.google.com') !== -1 ||
      url.indexOf('script.googleusercontent.com') !== -1 ||
      url.indexOf('api.imgbb.com') !== -1 ||
      e.request.method !== 'GET') {
    return;
  }

  /* الشبكة أولًا، والمخزّن احتياط عند انقطاع النت */
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
