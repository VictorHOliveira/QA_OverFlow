const CACHE = 'qaoverflow-v1';
const FILES = [
  '/',
  '/css/style.css',
  '/favicon.ico',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(FILES);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          var clone = networkResponse.clone();
          caches.open(CACHE).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(name) { return name !== CACHE; }).map(function(name) { return caches.delete(name); })
      );
    })
  );
});
