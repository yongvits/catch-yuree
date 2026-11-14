import { registerSW } from 'virtual:pwa-register';

type OfflineReadyCallback = (ready: boolean) => void;

let offlineReady = false;
const listeners = new Set<OfflineReadyCallback>();
let initialized = false;

function setOfflineReadyState(ready: boolean) {
  offlineReady = ready;
  listeners.forEach((cb) => cb(ready));
}

export function initPWARegistration() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  if ('serviceWorker' in navigator) {
    if (navigator.serviceWorker.controller) {
      setOfflineReadyState(true);
    } else {
      navigator.serviceWorker.ready
        .then((registration) => {
          if (registration.active) {
            setOfflineReadyState(true);
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
        setOfflineReadyState(true);
      },
      onRegisteredSW(_swUrl, registration) {
        if (registration?.active) {
          setOfflineReadyState(true);
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

export async function cacheAllAssetsForOffline(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const coreAssets = [
    './',
    './index.html',
    './manifest.webmanifest',
    './TitleBG.png',
    './TitleBG_portrait.png',
    './A9BC3D04-3E6A-471B-B545-EDE2038E33DF.png',
    './0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png',
    './3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png',
    './pwa-192x192.png',
    './pwa-512x512.png',
    './apple-touch-icon.png',
  ];

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.update().catch(() => {});
        if (reg.active) {
          setOfflineReadyState(true);
        }
      }
    }

    if ('caches' in window) {
      const cache = await caches.open('catch-yuree-manual-offline-v1');
      await Promise.allSettled(
        coreAssets.map(async (url) => {
          const matched = await caches.match(url);
          if (!matched) {
            await cache.add(url);
          }
        })
      );
      setOfflineReadyState(true);
      return true;
    }
  } catch {
    // ignore
  }

  return offlineReady;
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
