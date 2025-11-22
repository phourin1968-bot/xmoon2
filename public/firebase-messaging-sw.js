// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBmLAf0wVSyqTy6GVI2dC4fDs82pnGdNtw",
  authDomain: "xmoon-95c2b.firebaseapp.com",
  projectId: "xmoon-95c2b",
  storageBucket: "xmoon-95c2b.firebasestorage.app",
  messagingSenderId: "582494816988",
  appId: "1:582494816988:web:c0b1931f152b384ffe8219"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('📬 Message reçu en arrière-plan:', payload);
  
  const notificationTitle = payload.notification?.title || 'XMOON';
  const notificationOptions = {
    body: payload.notification?.body || 'Nouveau message',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200], // Pattern de vibration
    tag: 'xmoon-notification',
    requireInteraction: false,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification cliquée:', event);
  
  event.notification.close();
  
  // Ouvrir ou focus l'app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si l'app est déjà ouverte, la focus
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Sinon, ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});