import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPWAPrompt?: BeforeInstallPromptEvent | null;
  }
}

let cachedDeferredPrompt: BeforeInstallPromptEvent | null =
  typeof window !== 'undefined' && window.__deferredPWAPrompt ? window.__deferredPWAPrompt : null;
const promptListeners = new Set<(e: BeforeInstallPromptEvent | null) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    cachedDeferredPrompt = e as BeforeInstallPromptEvent;
    window.__deferredPWAPrompt = cachedDeferredPrompt;
    promptListeners.forEach((cb) => cb(cachedDeferredPrompt));
  });

  window.addEventListener('appinstalled', () => {
    cachedDeferredPrompt = null;
    window.__deferredPWAPrompt = null;
    promptListeners.forEach((cb) => cb(null));
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (cachedDeferredPrompt) return cachedDeferredPrompt;
    if (typeof window !== 'undefined' && window.__deferredPWAPrompt) {
      cachedDeferredPrompt = window.__deferredPWAPrompt;
      return window.__deferredPWAPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    if (!cachedDeferredPrompt && window.__deferredPWAPrompt) {
      cachedDeferredPrompt = window.__deferredPWAPrompt;
      setDeferredPrompt(cachedDeferredPrompt);
    }

    const handlePromptUpdate = (promptEvent: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    promptListeners.add(handlePromptUpdate);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      promptListeners.delete(handlePromptUpdate);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    const targetPrompt = deferredPrompt || cachedDeferredPrompt || window.__deferredPWAPrompt;
    if (!targetPrompt) return false;
    await targetPrompt.prompt();
    const { outcome } = await targetPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      cachedDeferredPrompt = null;
      window.__deferredPWAPrompt = null;
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
