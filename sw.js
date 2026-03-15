const CACHE_NAME = 'chatbox-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/deploy-client.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css'
];

// Install Service Worker
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch Service Worker
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        var fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            // Check if valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(function() {
          // Offline fallback
          if (event.request.url.indexOf('/api/') === 0) {
            return new Response(JSON.stringify({ error: 'Offline mode' }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        });
      })
    );
});

// Activate Service Worker
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push Notifications
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'New message received',
    icon: 'https://picsum.photos/seed/chatbox/192/192',
    badge: 'https://picsum.photos/seed/chatbox/72/72',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Chat',
        icon: 'https://picsum.photos/seed/chatbox/128/128'
      },
      {
        action: 'close',
        title: 'Close',
        icon: 'https://picsum.photos/seed/chatbox/128/128'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('ChatBox', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
