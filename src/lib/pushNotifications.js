export const browserSupportsPush = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  window.isSecureContext;

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

export const registerPushServiceWorker = async () => {
  const registration = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  return registration;
};

export const getExistingPushSubscription = async () => {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
};

export const subscribeToPush = async (publicKey) => {
  const registration = await registerPushServiceWorker();
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });
};
