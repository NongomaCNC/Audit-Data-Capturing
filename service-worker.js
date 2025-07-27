const CACHE_NAME = 'field-data-capture-v2'; // Increment cache version on changes
const urlsToCache = [
    './', // Caches the root URL (index.html)
    'index.html',
    'manifest.json',
    'https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js',
    // Add paths to your icons:
    'icons/icon-192x192.png',
    'icons/icon-512x512.png',
    'icons/icon-maskable-192x192.png',
    'icons/icon-maskable-512x512.png',
    // Add any other critical assets (e.g., custom fonts, other JS files)
];

// Install event: Caches all essential assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.error('[Service Worker] Failed to cache:', err);
            })
    );
});

// Activate event: Cleans up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activation complete!');
            return self.clients.claim(); // Ensures the new service worker takes control immediately
        })
    );
});

// Fetch event: Intercepts network requests and serves from cache if available
self.addEventListener('fetch', (event) => {
    // Only cache GET requests for static assets
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
        return; // Don't cache POST requests or data URLs
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    // console.log('[Service Worker] Serving from cache:', event.request.url);
                    return response;
                }

                // No cache hit - fetch from network
                // console.log('[Service Worker] Fetching from network:', event.request.url);
                return fetch(event.request).then(
                    (response) => {
                        // Check if we received a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // IMPORTANT: Clone the response. A response is a stream
                        // and can only be consumed once. We consume it once to cache it
                        // and once the browser consumes it.
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                ).catch(error => {
                    // This catch block handles network failures when fetching
                    console.error('[Service Worker] Fetch failed:', event.request.url, error);
                    // You could serve an offline page here if needed
                    // return caches.match('/offline.html');
                });
            })
    );
});