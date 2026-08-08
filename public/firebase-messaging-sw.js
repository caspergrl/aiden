importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyC5eqRAZ5DXKjssZnYEPWHaKoThksQuEMY',
  authDomain: 'aidencare.co',
  projectId: 'aiden-12acb',
  storageBucket: 'aiden-12acb.firebasestorage.app',
  messagingSenderId: '90168103816',
  appId: '1:90168103816:web:8d15ea56231852b413203d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || 'Aiden';
  const body  = payload.notification?.body  || '';
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
  });
});
