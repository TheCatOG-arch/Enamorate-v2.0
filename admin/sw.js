// Service Worker para el Admin
self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Requerido por Chrome Android
});