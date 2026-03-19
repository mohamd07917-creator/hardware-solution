const CACHE_NAME = 'hardware-solutions-v2';

// الملفات التي تُحفظ للعمل بدون إنترنت
const STATIC_CACHE = [
  '/hardware-solution/',
  '/hardware-solution/index.html',
  '/hardware-solution/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap'
];

// تثبيت Service Worker وحفظ الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

// تفعيل وحذف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// استراتيجية: Network First للـ Firebase والـ GitHub، Cache First للباقي
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase و GitHub دائماً من الإنترنت
  if (url.includes('firebase') || url.includes('googleapis.com/firestore') || url.includes('raw.githubusercontent.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // باقي الطلبات: جرب الكاش أولاً ثم الإنترنت
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
