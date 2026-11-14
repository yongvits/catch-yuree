import { registerSW } from 'virtual:pwa-register';

type OfflineReadyCallback = (ready: boolean) => void;

let offlineReady = false;
const listeners = new Set<OfflineReadyCallback>();
let initialized = false;

export function initPWARegistration() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller) {
      offlineReady = true;
    } else {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (registration.active) {
            offlineReady = true;
            listeners.forEach((cb) => cb(true));
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }

  try {
    registerSW({
      immediate: true,
      onOfflineReady() {
        offlineReady = true;
        listeners.forEach((cb) => cb(true));
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration?.active) {
          offlineReady = true;
          listeners.forEach((cb) => cb(true));
        }
      },
      onRegisterError() {
        // ignore registration errors in unsupported contexts
      },
    });
  } catch {
    // ignore
  }
}

export function isAppOfflineReady(): boolean {
  return offlineReady;
}

export function subscribeOfflineReady(cb: OfflineReadyCallback): () => void {
  listeners.add(cb);
  cb(offlineReady);
  return () => {
    listeners.delete(cb);
  };
}
