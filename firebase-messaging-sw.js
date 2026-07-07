importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCqzN6ujDOYej7pkHWCCn-q9KmO68vtp5U',
  authDomain: 'link-4cc8b.firebaseapp.com',
  projectId: 'link-4cc8b',
  storageBucket: 'link-4cc8b.firebasestorage.app',
  messagingSenderId: '386484965697',
  appId: '1:386484965697:web:b2e5b271d7dda245d411c0',
});

const messaging = firebase.messaging();

// Notificações recebidas com o app em BACKGROUND
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Saborsan', {
    body: body || '',
    icon: icon || '/images/logo-saborsan.png',
    badge: '/images/favicon.svg',
    data: payload.data,
    vibrate: [200, 100, 200],
  });
});

// Clique na notificação abre o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
