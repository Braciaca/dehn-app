// Service Worker: legt alle Dateien im Cache ab, damit die App offline läuft.
// Mit Verbindung kommt immer die aktuelle Fassung vom Server, damit nie alte und
// neue Dateien gemischt werden. Ohne Verbindung antwortet der Cache.
const CACHE = 'dehnapp-v4';
const DATEIEN = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'vendor/three/three.module.min.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'js/app.js',
  'js/audio.js',
  'js/figure.js',
  'js/figure3d.js',
  'js/filter.js',
  'js/sequence.js',
  'js/store.js',
  'js/timer.js',
  'js/ui.js',
  'js/data/exercises.js',
  'js/data/poses3d.js',
  'js/data/templates.js',
  'js/views/detail.js',
  'js/views/editor.js',
  'js/views/einstellungen.js',
  'js/views/player.js',
  'js/views/routinen.js',
  'js/views/uebungen.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((namen) => Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const anfrage = event.request;
  if (anfrage.method !== 'GET' || new URL(anfrage.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        // 'no-cache' fragt den Server immer, ob es eine neuere Fassung gibt.
        const antwort = await fetch(anfrage, { cache: 'no-cache' });
        if (antwort.ok) cache.put(anfrage, antwort.clone());
        return antwort;
      } catch {
        const treffer = await cache.match(anfrage, { ignoreSearch: true });
        return treffer || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    }),
  );
});
