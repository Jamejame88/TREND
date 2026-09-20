/* Service Worker — موقع TREND
   وظيفتان: تمكين تثبيت التطبيق على الجوال، وتشغيله لو انقطع النت.

   قاعدة أساسية: الصفحة والملفات بتُجلب من الشبكة أولًا دايمًا،
   والكاش احتياط بس. هيك أي تحديث بترفعه بيوصل الزبون فورًا
   بدل ما يعلق على نسخة قديمة.

   ⚠ لما تعدّل هاد الملف مستقبلًا، غيّر رقم CACHE تحت (v4 ← v5...)
   حتى ينمسح الكاش القديم تلقائيًا عند كل الزباين. */
const CACHE = 'trend-v4';
const SHELL = [
  'site.html', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'css/site.css',
  'js/site/core.js', 'js/site/ai.js', 'js/site/member.js', 'js/site/save-mode.js',
  'js/site/vip-install.js', 'js/site/gallery.js', 'js/site/club.js',
  'js/site/catalog.js', 'js/site/cart.js', 'js/site/app.js'
];

self.addEventListener('install', (e) => {
  // skipWaiting: النسخة الجديدة بتشتغل فورًا بدل ما تنتظر إغلاق كل النوافذ
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL).catch(() => null))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// رسالة من الصفحة بتخلي النسخة الجديدة تستلم بدون انتظار
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

/* ignoreSearch بالبحث عن نسخة الكاش: الملفات بتنطلب مع ?v=1 لكسر كاش المتصفح،
   والكاش مخزّنها بدون الرقم - فبدونها الموقع ما بيشتغل بدون نت. */
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // أي طلب لخدمة خارجية (Supabase / Apps Script / الصور) بيروح للشبكة مباشرة
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;

  // الشبكة أولًا، والكاش بس لو فشل الاتصال
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then((r) => r || caches.match('site.html')))
  );
});
