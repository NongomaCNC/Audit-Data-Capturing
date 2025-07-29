// A version for the cache. Change this to a new version to trigger an update.
const CACHE_NAME = 'field-data-cache-v2';

// A list of all the files and resources the app needs to function offline.
// This list remains the same as all our code is in the main file.
const urlsToCache = [
  '.', // This represents the main HTML file (index.html)
  'manifest.json',
  'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js',
  'https://placehold.co/192x192/007bff/ffffff?text=FDC',
  'https://placehold.co/512x512/007bff/ffffff?text=FDC'
];

// --- INSTALL EVENT ---
// This event is fired when the service worker is first installed.
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  // waitUntil() ensures that the service worker will not install until the
  // code inside it has successfully completed.
  event.waitUntil(
    // Open the cache by name.
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Add all the specified URLs to the cache.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete.');
        // Activate the new service worker immediately.
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// --- ACTIVATE EVENT ---
// This event is fired when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // If a cache's name is not our current CACHE_NAME, we delete it.
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activation complete.');
        // Take control of all open clients (pages) at once.
        return self.clients.claim();
    })
  );
});

// --- FETCH EVENT ---
// This event is fired for every network request the page makes.
// We use this to serve cached content when offline.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // We use respondWith() to hijack the request and provide our own response.
  event.respondWith(
    // Check if the requested resource is in our cache.
    caches.match(event.request)
      .then(cachedResponse => {
        // If the resource is in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If the resource is not in the cache, fetch it from the network.
        return fetch(event.request).then(
            (networkResponse) => {
                // A response can only be used once, so we need to clone it.
                let responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                return networkResponse;
            }
        ).catch(error => {
            console.error('Service Worker: Fetch failed.', error);
            // You could return a custom offline page here if you had one.
        });
      })
  );
});
