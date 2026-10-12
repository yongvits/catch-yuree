// Title Screen Image Engine for persistent custom Title Art
// Supports upload of any image file, with IndexedDB persistence on mobile/desktop

const IDB_NAME = 'weevil_game_title_db';
const IDB_STORE = 'title_assets';
const IDB_KEY = 'custom_title_image_data';
const LS_FALLBACK_KEY = 'weevil_custom_title_image';

function openIDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    try {
      const request = indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveToIDB(dataUrl: string): Promise<void> {
  const db = await openIDB();
  if (!db) {
    try {
      localStorage.setItem(LS_FALLBACK_KEY, dataUrl);
    } catch {
      // ignore
    }
    return;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(dataUrl, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getFromIDB(): Promise<string | null> {
  const db = await openIDB();
  if (!db) {
    try {
      return localStorage.getItem(LS_FALLBACK_KEY);
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function deleteFromIDB(): Promise<void> {
  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    // ignore
  }
  const db = await openIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

class TitleEngine {
  private customImageData: string | null = null;
  private isInitialized = false;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    if (typeof window === 'undefined') return;
    try {
      const saved = await getFromIDB();
      if (saved) {
        this.customImageData = saved;
      }
    } catch {
      // fallback
    } finally {
      this.isInitialized = true;
      this.notify();
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    if (this.isInitialized) {
      cb();
    }
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {
        // ignore
      }
    });
  }

  public getCustomImage(): string | null {
    return this.customImageData;
  }

  public async setCustomImage(dataUrl: string): Promise<void> {
    this.customImageData = dataUrl;
    await saveToIDB(dataUrl);
    this.notify();
  }

  public async resetToDefault(): Promise<void> {
    this.customImageData = null;
    await deleteFromIDB();
    this.notify();
  }
}

export const titleEngine = new TitleEngine();
