// A unique name for our cache
const CACHE_NAME = 'field-data-cache-v1';

// The list of files to cache.
// IMPORTANT: This includes the external libraries from the CDN.
const filesToCache = [
  '.', // This caches the root directory, which is your main HTML file
  'manifest.json',
  'icon-192x192.png',
  'icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js'
];

// 1. On install, cache the files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching files.');
        return cache.addAll(filesToCache);
      })
  );
});

// 2. On fetch, serve from cache first
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If we found a match in the cache, return it.
        // Otherwise, fetch from the network.
        return response || fetch(event.request);
      })
  );
});
