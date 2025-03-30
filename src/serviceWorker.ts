/* eslint-disable @typescript-eslint/no-explicit-any */
// Service worker for caching static assets and music files

const CACHE_NAME = 'mustin-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/main.css',
];

// Install event
self.addEventListener('install', (event: any) => {
  console.log('Service Worker: Installed');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => (self as any).skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event: any) => {
  console.log('Service Worker: Activated');
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
          return null;
        })
      );
    })
  );
});

// Fetch event strategy: Cache with network fallback
self.addEventListener('fetch', (event: any) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle image and audio files differently
  const url = new URL(event.request.url);
  const isImage = url.pathname.match(/\.(jpe?g|png|gif|webp|svg)$/i);
  const isAudio = url.pathname.match(/\.(mp3|wav|ogg|m4a)$/i);
  
  if (isImage || isAudio) {
    // For media files: Cache first, then network
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(fetchResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            // Put a copy of the response in the cache
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  } else {
    // For other assets: Network first, fallback to cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Make a copy of the response
          const responseCopy = response.clone();
          
          // Open the cache
          caches.open(CACHE_NAME)
            .then(cache => {
              // Add the response to the cache
              cache.put(event.request, responseCopy);
            });
            
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Helper function to pre-cache specific song files
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'CACHE_SONGS') {
    const songUrls = event.data.songUrls;
    
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Pre-caching songs', songUrls);
        return Promise.all(
          songUrls.map((url: string) => 
            fetch(url)
              .then(response => cache.put(url, response))
              .catch(error => console.error('Failed to cache:', url, error))
          )
        );
      })
      .then(() => {
        // Notify the client that caching is complete
        if (event.source) {
          event.source.postMessage({
            type: 'SONGS_CACHED',
            success: true
          });
        }
      });
  }
});

export {};