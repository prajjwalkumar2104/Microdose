// A minimal service worker to satisfy PWA installation requirements
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Required to pass the Chrome PWA audit
  e.respondWith(fetch(e.request).catch(() => new Response("Offline")));
});