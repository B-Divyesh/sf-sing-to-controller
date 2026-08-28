const CACHE = 'sing-switch-v2';
const SHELL = ['/', '/assets/sound-landscape.webp', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const shellResponse = await fetch('/', { cache: 'reload' });
    await cache.put('/', shellResponse.clone());
    const html = await shellResponse.text();
    const builtAssets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map((match) => match[1]);
    await cache.addAll([...new Set([...SHELL.slice(1), ...builtAssets])]);
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    if (event.request.mode === 'navigate') return caches.match('/');
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }));
});
