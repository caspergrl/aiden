import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export async function requestPushPermission() {
  if (Capacitor.isNativePlatform()) {
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  }
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const perm = await Notification.requestPermission();
  return perm === 'granted';
}

export async function registerPushToken() {
  if (Capacitor.isNativePlatform()) {
    return new Promise(resolve => {
      PushNotifications.register();
      PushNotifications.addListener('registration',      t => resolve(t.value));
      PushNotifications.addListener('registrationError', () => resolve(null));
    });
  }
  try {
    const reg  = await navigator.serviceWorker.ready;
    const vapid = import.meta.env.VITE_FCM_VAPID_KEY;
    if (!vapid) return null;
    const { getMessaging, getToken } = await import('firebase/messaging');
    const { app } = await import('./firebase');
    const messaging = getMessaging(app);
    return await getToken(messaging, { vapidKey: vapid, serviceWorkerRegistration: reg });
  } catch {
    return null;
  }
}

export function isPushSupported() {
  return Capacitor.isNativePlatform() || ('Notification' in window && 'serviceWorker' in navigator);
}

export function getPushPermissionState() {
  if (Capacitor.isNativePlatform()) return 'unknown';
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}
