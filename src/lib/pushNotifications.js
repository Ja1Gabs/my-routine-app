export const browserCanAskNotificationPermission = () =>
  typeof window !== 'undefined' &&
  'Notification' in window;

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

const buffersAreEqual = (left, right) => {
  if (!left || !right || left.byteLength !== right.byteLength) return false;

  const leftView = new Uint8Array(left);
  const rightView = new Uint8Array(right);
  return leftView.every((value, index) => value === rightView[index]);
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
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  const existingSubscription = await registration.pushManager.getSubscription();

  if (existingSubscription) {
    const existingKey = existingSubscription.options?.applicationServerKey;
    if (buffersAreEqual(existingKey, applicationServerKey)) {
      return existingSubscription;
    }

    await existingSubscription.unsubscribe();
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
};
