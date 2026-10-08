// Sprite engine for the 8-frame Weevil Character Spritesheet (4 cols x 2 rows)
// Faithfully matches the exact cartoon character art from 0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png

export interface SpriteSheetData {
  image: HTMLImageElement | null;
  frames: HTMLCanvasElement[];
  isLoaded: boolean;
}

// Native IndexedDB helper for reliable persistent storage on mobile devices (bypassing Safari's 5MB localStorage limit)
const IDB_NAME = 'weevil_game_assets';
const IDB_STORE = 'sprites';
const IDB_KEY = 'custom_spritesheet_data';

async function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return null;
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveToIDB(val: string): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(val, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function getFromIDB(): Promise<string | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function clearFromIDB(): Promise<void> {
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

class SpriteEngine {
  private frames: HTMLCanvasElement[] = [];
  private ghostFrames: HTMLCanvasElement[] = [];
  private isLoaded = false;
  private customImageSrc: string | null = null;
  private customLengthScale = 1.0;
  private onSpriteLoadedCallbacks: (() => void)[] = [];

  constructor() {
    this.loadSavedLengthScale();
    this.initDefaultProceduralSprites();
    this.initSpriteCascade();
  }

  private loadSavedLengthScale() {
    try {
      const savedScale = localStorage.getItem('weevil_sprite_length_scale');
      if (savedScale) {
        const val = parseFloat(savedScale);
        if (!isNaN(val) && val >= 0.5 && val <= 2.5) {
          this.customLengthScale = val;
        }
      }
    } catch {
      // ignore
    }
  }

  public setLengthScale(scale: number) {
    this.customLengthScale = Math.max(0.6, Math.min(2.5, scale));
    try {
      localStorage.setItem('weevil_sprite_length_scale', this.customLengthScale.toString());
    } catch {
      // ignore
    }
    this.notifyLoaded();
  }

  public getLengthScale(): number {
    return this.customLengthScale;
  }

  // Load custom sprite in priority order: localStorage -> IndexedDB -> Bundled skin files in public
  private async initSpriteCascade() {
    // 1. Try localStorage
    try {
      const saved = localStorage.getItem('weevil_custom_spritesheet');
      if (saved && saved.startsWith('data:image/')) {
        const ok = await this.loadFromDataUrl(saved);
        if (ok) return;
      }
    } catch {
      // ignore
    }

    // 2. Try IndexedDB (if localStorage failed or was cleared)
    try {
      const idbSaved = await getFromIDB();
      if (idbSaved && idbSaved.startsWith('data:image/')) {
        const ok = await this.loadFromDataUrl(idbSaved);
        if (ok) {
          try {
            localStorage.setItem('weevil_custom_spritesheet', idbSaved);
          } catch {
            // ignore
          }
          return;
        }
      }
    } catch {
      // ignore
    }

    // 3. Try bundled skins in public folder (uploaded character sprite 0E437456..., weevil_skin.png, yuree.png)
    await this.loadPresetSkin();
  }

  // Attempts to load candidate bundled character skins from public directory
  public async loadPresetSkin(): Promise<boolean> {
    const base = import.meta.env.BASE_URL || './';
    const originPath =
      typeof window !== 'undefined'
        ? window.location.pathname.replace(/\/[^/]*$/, '/')
        : '/';

    const candidates = [
      // Primary: Exact filename uploaded by user
      `${originPath}0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png`,
      `${base}0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png`,
      `./0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png`,
      `0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png`,
      `/0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png`,
      // Secondary: standard clean skin names
      `${originPath}weevil_skin.png`,
      `${base}weevil_skin.png`,
      `./weevil_skin.png`,
      `weevil_skin.png`,
      `/weevil_skin.png`,
      `${originPath}yuree.png`,
      `${base}yuree.png`,
      `./yuree.png`,
      `yuree.png`,
      `/yuree.png`,
      // Subpath fallbacks for GitHub Pages repo name
      `/catch-yuree/0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png`,
      `/catch-yuree/weevil_skin.png`,
      `/catch-yuree/yuree.png`,
      `${base}spritesheet.png`,
      `./spritesheet.png`,
    ];

    const uniqueCandidates = Array.from(new Set(candidates));

    for (const url of uniqueCandidates) {
      try {
        const ok = await this.loadFromUrl(url);
        if (ok) {
          // Cache in IDB & localStorage for instantaneous reload
          if (this.customImageSrc) {
            try {
              localStorage.setItem('weevil_custom_spritesheet', this.customImageSrc);
            } catch {
              // ignore
            }
            saveToIDB(this.customImageSrc);
          }
          return true;
        }
      } catch {
        // continue
      }
    }
    return false;
  }

  public loadFromUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      // DO NOT set crossOrigin for relative or local images to avoid CORS block on GitHub Pages!
      if (url.startsWith('http://') || url.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        try {
          const maxDim = 1024;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(false);
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/png');
          this.loadFromDataUrl(dataUrl).then(resolve);
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  public onLoaded(callback: () => void) {
    this.onSpriteLoadedCallbacks.push(callback);
    if (this.isLoaded) {
      callback();
    }
  }

  private notifyLoaded() {
    this.onSpriteLoadedCallbacks.forEach((cb) => cb());
  }

  // Load from File with auto-downscaling to guarantee compatibility with mobile devices
  public async loadFromFile(file: File): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawDataUrl = e.target?.result as string;
          if (!rawDataUrl) {
            return resolve({ success: false, error: 'Could not read file' });
          }

          const img = new Image();
          await new Promise<void>((imgRes, imgRej) => {
            img.onload = () => imgRes();
            img.onerror = () => imgRej(new Error('Invalid image format'));
            img.src = rawDataUrl;
          });

          // Downscale huge mobile photos (e.g. 4000x3000) to optimal game spritesheet dimension (max 1024px)
          const maxDim = 1024;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const resizeCanvas = document.createElement('canvas');
          resizeCanvas.width = w;
          resizeCanvas.height = h;
          const rCtx = resizeCanvas.getContext('2d');
          if (!rCtx) return resolve({ success: false, error: 'Canvas context unavailable' });
          rCtx.drawImage(img, 0, 0, w, h);

          const optimizedDataUrl = resizeCanvas.toDataURL('image/png');

          const success = await this.loadFromDataUrl(optimizedDataUrl);
          if (success) {
            try {
              localStorage.setItem('weevil_custom_spritesheet', optimizedDataUrl);
            } catch {
              // Ignore localStorage quota exceeded on mobile Safari
            }
            await saveToIDB(optimizedDataUrl);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Failed to slice 4x2 grid' });
          }
        } catch (err: any) {
          resolve({ success: false, error: err?.message || 'Processing failed' });
        }
      };
      reader.onerror = () => resolve({ success: false, error: 'File read error' });
      reader.readAsDataURL(file);
    });
  }

  public async resetToDefault() {
    try {
      localStorage.removeItem('weevil_custom_spritesheet');
    } catch {
      // ignore
    }
    await clearFromIDB();
    this.customImageSrc = null;
    this.initDefaultProceduralSprites();
    this.notifyLoaded();
  }

  // Slices a 4x2 spritesheet image into 8 transparent frames
  public loadFromDataUrl(dataUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const cols = 4;
        const rows = 2;
        const totalFrames = 8;
        const frameWidth = Math.floor(img.width / cols);
        const frameHeight = Math.floor(img.height / rows);

        if (frameWidth <= 0 || frameHeight <= 0) {
          return resolve(false);
        }

        const newFrames: HTMLCanvasElement[] = [];

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (newFrames.length >= totalFrames) break;

            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = frameWidth;
            frameCanvas.height = frameHeight;
            const fCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
            if (!fCtx) continue;

            fCtx.drawImage(
              img,
              c * frameWidth,
              r * frameHeight,
              frameWidth,
              frameHeight,
              0,
              0,
              frameWidth,
              frameHeight
            );

            // Chroma-key white/near-white background to transparent with smooth edge transition
            const imgData = fCtx.getImageData(0, 0, frameWidth, frameHeight);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
              const red = data[i];
              const green = data[i + 1];
              const blue = data[i + 2];
              const minVal = Math.min(red, green, blue);
              const maxVal = Math.max(red, green, blue);
              const sat = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;

              // White/light gray background removal with soft antialiasing
              if (minVal > 218 && sat < 0.16) {
                if (minVal > 240) {
                  data[i + 3] = 0;
                } else {
                  const factor = (minVal - 218) / 22;
                  data[i + 3] = Math.round(data[i + 3] * (1 - factor));
                }
              }
            }
            fCtx.putImageData(imgData, 0, 0);
            newFrames.push(frameCanvas);
          }
        }

        if (newFrames.length === totalFrames) {
          this.frames = newFrames;
          this.ghostFrames = this.generateGhostFrames(newFrames);
          this.isLoaded = true;
          this.customImageSrc = dataUrl;
          this.notifyLoaded();
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }

  // Convert character frames into a glowing spectral ghost palette in distinct blue tones (โทนฟ้า)
  private generateGhostFrames(sourceFrames: HTMLCanvasElement[]): HTMLCanvasElement[] {
    return sourceFrames.map((frame) => {
      const gCanvas = document.createElement('canvas');
      gCanvas.width = frame.width;
      gCanvas.height = frame.height;
      const gCtx = gCanvas.getContext('2d', { willReadFrequently: true });
      if (!gCtx) return frame;

      gCtx.drawImage(frame, 0, 0);

      try {
        const imgData = gCtx.getImageData(0, 0, frame.width, frame.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a > 15) {
            // Perceived luminance
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;

            // Transform into distinct, glowing ethereal blue ghost spectrum (โทนออกฟ้า + โปร่งแสง):
            if (luma > 190) {
              // Bright highlights -> glowing celestial crystal icy blue / celestial white-blue
              const factor = (luma - 190) / 65;
              data[i] = Math.round(180 + factor * 65);     // R: 180 -> 245
              data[i + 1] = Math.round(225 + factor * 25); // G: 225 -> 250
              data[i + 2] = 255;                           // B: 255
              data[i + 3] = Math.round(a * 0.78);          // Lower opacity for ethereal ghost transparency
            } else if (luma > 75) {
              // Body / shell / fluff / limbs -> distinct sky blue / electric spirit blue (#38bdf8 / #60a5fa)
              const factor = (luma - 75) / 115; // 0 to 1
              data[i] = Math.round(40 + factor * 115);     // R: 40 -> 155
              data[i + 1] = Math.round(135 + factor * 75); // G: 135 -> 210
              data[i + 2] = Math.round(235 + factor * 20); // B: 235 -> 255 (dominant vivid blue)
              data[i + 3] = Math.round(a * 0.72);          // Lower opacity for ethereal ghost transparency
            } else {
              // Outlines / snout / eyes / details -> deep royal spirit sapphire blue (#0369a1 to #1e3a8a)
              const darkFactor = luma / 75; // 0 to 1
              data[i] = Math.round(10 + darkFactor * 25);    // R: 10 -> 35
              data[i + 1] = Math.round(40 + darkFactor * 65);// G: 40 -> 105
              data[i + 2] = Math.round(150 + darkFactor * 75);// B: 150 -> 225 (vibrant deep blue)
              data[i + 3] = Math.round(a * 0.75);          // Lower opacity for ethereal ghost transparency
            }
          }
        }
        gCtx.putImageData(imgData, 0, 0);
      } catch {
        // Fallback
      }

      return gCanvas;
    });
  }

  // Pre-render the 8 walk-cycle frames matching 0E437456-E0D9-44E6-A2BC-3D63910CD8FE.png in high resolution
  private initDefaultProceduralSprites() {
    const size = 180;
    const newFrames: HTMLCanvasElement[] = [];

    // Exact leg coordinates matching the 8 sprites in the image:
    // [rearL, midL, frontL, rearR, midR, frontR]
    // where front legs reach downwards (positive Y), rear reach upwards (negative Y)
    const legKeyframes = [
      // Frame 0 (top-left)
      {
        rL: [-0.65, -0.65, -0.85, -0.55],
        mL: [-0.6, -0.2, -0.92, -0.15],
        fL: [-0.5, 0.25, -0.75, 0.65],
        rR: [0.65, -0.65, 0.82, -0.5],
        mR: [0.6, -0.2, 0.9, -0.1],
        fR: [0.5, 0.25, 0.72, 0.7],
        snoutOffset: -0.06,
      },
      // Frame 1 (top 2nd)
      {
        rL: [-0.65, -0.65, -0.78, -0.6],
        mL: [-0.6, -0.2, -0.95, -0.05],
        fL: [-0.5, 0.25, -0.68, 0.6],
        rR: [0.65, -0.65, 0.88, -0.45],
        mR: [0.6, -0.2, 0.85, -0.15],
        fR: [0.5, 0.25, 0.8, 0.65],
        snoutOffset: 0.05,
      },
      // Frame 2 (top 3rd)
      {
        rL: [-0.65, -0.65, -0.82, -0.52],
        mL: [-0.6, -0.2, -0.9, -0.22],
        fL: [-0.5, 0.25, -0.8, 0.55],
        rR: [0.65, -0.65, 0.78, -0.6],
        mR: [0.6, -0.2, 0.92, -0.05],
        fR: [0.5, 0.25, 0.75, 0.6],
        snoutOffset: -0.03,
      },
      // Frame 3 (top right)
      {
        rL: [-0.65, -0.65, -0.88, -0.48],
        mL: [-0.6, -0.2, -0.85, -0.1],
        fL: [-0.5, 0.25, -0.7, 0.68],
        rR: [0.65, -0.65, 0.85, -0.55],
        mR: [0.6, -0.2, 0.88, -0.18],
        fR: [0.5, 0.25, 0.82, 0.55],
        snoutOffset: 0.04,
      },
      // Frame 4 (bottom-left)
      {
        rL: [-0.65, -0.65, -0.8, -0.58],
        mL: [-0.6, -0.2, -0.92, -0.12],
        fL: [-0.5, 0.25, -0.74, 0.62],
        rR: [0.65, -0.65, 0.8, -0.58],
        mR: [0.6, -0.2, 0.92, -0.12],
        fR: [0.5, 0.25, 0.74, 0.62],
        snoutOffset: -0.05,
      },
      // Frame 5 (bottom 2nd)
      {
        rL: [-0.65, -0.65, -0.76, -0.62],
        mL: [-0.6, -0.2, -0.88, -0.18],
        fL: [-0.5, 0.25, -0.82, 0.58],
        rR: [0.65, -0.65, 0.86, -0.48],
        mR: [0.6, -0.2, 0.86, -0.15],
        fR: [0.5, 0.25, 0.78, 0.68],
        snoutOffset: 0.03,
      },
      // Frame 6 (bottom 3rd)
      {
        rL: [-0.65, -0.65, -0.85, -0.5],
        mL: [-0.6, -0.2, -0.95, -0.08],
        fL: [-0.5, 0.25, -0.76, 0.65],
        rR: [0.65, -0.65, 0.82, -0.55],
        mR: [0.6, -0.2, 0.9, -0.2],
        fR: [0.5, 0.25, 0.7, 0.6],
        snoutOffset: -0.02,
      },
      // Frame 7 (bottom right)
      {
        rL: [-0.65, -0.65, -0.82, -0.55],
        mL: [-0.6, -0.2, -0.9, -0.15],
        fL: [-0.5, 0.25, -0.72, 0.68],
        rR: [0.65, -0.65, 0.85, -0.5],
        mR: [0.6, -0.2, 0.88, -0.12],
        fR: [0.5, 0.25, 0.75, 0.65],
        snoutOffset: 0.02,
      },
    ];

    const frameWidth = 160;
    const frameHeight = 216;

    for (let frameIdx = 0; frameIdx < 8; frameIdx++) {
      const canvas = document.createElement('canvas');
      canvas.width = frameWidth;
      canvas.height = frameHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      ctx.save();
      ctx.translate(frameWidth / 2, frameHeight / 2);

      const kf = legKeyframes[frameIdx];
      const s = 76;

      // --- 1. SIX INSECT LEGS (Gold-tan with bold black outlines and jointed claws) ---
      const legList = [
        kf.rL, // Rear Left
        kf.mL, // Mid Left
        kf.fL, // Front Left
        kf.rR, // Rear Right
        kf.mR, // Mid Right
        kf.fR, // Front Right
      ];

      legList.forEach(([sx, sy, ex, ey]) => {
        const startX = sx * s;
        const startY = sy * s;
        const endX = ex * s;
        const endY = ey * s;

        // Middle joint bend
        const bendX = (startX + endX) * 0.5 + (startX < 0 ? -s * 0.14 : s * 0.14);
        const bendY = (startY + endY) * 0.5 - s * 0.05;

        // Black outer stroke
        ctx.strokeStyle = '#181818';
        ctx.lineWidth = s * 0.13;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(bendX, bendY, endX, endY);
        ctx.stroke();

        // Claw tip hook
        const clawAngle = Math.atan2(endY - bendY, endX - bendX) + (startX < 0 ? -0.7 : 0.7);
        const clawLen = s * 0.12;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX + Math.cos(clawAngle) * clawLen, endY + Math.sin(clawAngle) * clawLen);
        ctx.stroke();

        // Inner caramel filling
        ctx.strokeStyle = '#ca945a';
        ctx.lineWidth = s * 0.075;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(bendX, bendY, endX, endY);
        ctx.stroke();
      });

      // --- 2. ELYTRA SHELL (Caramel-gold grooved beetle shell at top) ---
      ctx.save();
      ctx.translate(0, -s * 0.28);

      // Shell base outline & fill
      ctx.fillStyle = '#ca945a';
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = s * 0.07;
      ctx.beginPath();
      // Rounded shell curving down
      ctx.moveTo(-s * 0.46, s * 0.35);
      ctx.bezierCurveTo(-s * 0.56, -s * 0.2, -s * 0.35, -s * 0.55, 0, -s * 0.55);
      ctx.bezierCurveTo(s * 0.35, -s * 0.55, s * 0.56, -s * 0.2, s * 0.46, s * 0.35);
      ctx.quadraticCurveTo(0, s * 0.42, -s * 0.46, s * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Vertical black groove stripes on shell (matching spritesheet exactly)
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = s * 0.04;
      ctx.lineCap = 'round';

      // Center seam
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.54);
      ctx.lineTo(0, s * 0.38);
      ctx.stroke();

      // 3 curved grooves on left & 3 on right
      const grooves = [0.15, 0.28, 0.39];
      grooves.forEach((gx) => {
        // Left groove
        ctx.beginPath();
        ctx.moveTo(-s * gx * 0.7, -s * 0.5);
        ctx.quadraticCurveTo(-s * gx * 1.15, -s * 0.05, -s * gx * 0.9, s * 0.35);
        ctx.stroke();

        // Right groove
        ctx.beginPath();
        ctx.moveTo(s * gx * 0.7, -s * 0.5);
        ctx.quadraticCurveTo(s * gx * 1.15, -s * 0.05, s * gx * 0.9, s * 0.35);
        ctx.stroke();
      });

      ctx.restore();

      // --- 3. PRONOTUM / THORAX (Middle chest segment) ---
      ctx.save();
      ctx.translate(0, -s * 0.05);
      ctx.fillStyle = '#ca945a';
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = s * 0.07;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.38, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Center chest groove
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.18);
      ctx.lineTo(0, s * 0.18);
      ctx.stroke();
      ctx.restore();

      // --- 4. FLUFFY HOT PINK / MAGENTA RUFF BOWS (Prominent character feature) ---
      const drawPinkFluff = (side: number) => {
        ctx.save();
        ctx.translate(side * s * 0.34, -s * 0.04);
        ctx.fillStyle = '#df2d64';
        ctx.strokeStyle = '#181818';
        ctx.lineWidth = s * 0.065;

        // Cluster of 6 cloud lobes with black outlines
        const lobes = [
          [-s * 0.08, -s * 0.15, s * 0.13],
          [s * 0.08, -s * 0.13, s * 0.15],
          [s * 0.13, s * 0.02, s * 0.14],
          [s * 0.06, s * 0.15, s * 0.15],
          [-s * 0.07, s * 0.16, s * 0.14],
          [-s * 0.14, s * 0.01, s * 0.13],
        ];

        // Fill solid
        ctx.beginPath();
        lobes.forEach(([lx, ly, lr]) => {
          ctx.moveTo(lx + lr, ly);
          ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        });
        ctx.fill();

        // Stroke lobes
        lobes.forEach(([lx, ly, lr]) => {
          ctx.beginPath();
          ctx.arc(lx, ly, lr, 0, Math.PI * 2);
          ctx.stroke();
        });

        // Highlights for fluffy depth
        ctx.fillStyle = '#eb4c7e';
        lobes.forEach(([lx, ly, lr]) => {
          ctx.beginPath();
          ctx.arc(lx - lr * 0.2, ly - lr * 0.2, lr * 0.45, 0, Math.PI * 2);
          ctx.fill();
        });

        ctx.restore();
      };

      drawPinkFluff(-1); // Left bow
      drawPinkFluff(1);  // Right bow

      // --- 5. HEAD (Pale peachy beige oval head) ---
      ctx.save();
      ctx.translate(0, s * 0.12);
      ctx.fillStyle = '#dfbaa0';
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = s * 0.07;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.22, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // --- 6. GLOSSY BIG CARTOON EYES ---
      const drawEye = (side: number) => {
        const eyeX = side * s * 0.1;
        const eyeY = -s * 0.02;
        const radiusX = s * 0.075;
        const radiusY = s * 0.095;

        // Glossy black oval
        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, radiusX, radiusY, side * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // White reflection catchlights (Large top catchlight + small lower sparkle)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX + side * s * 0.02, eyeY - s * 0.03, radiusX * 0.48, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(eyeX - side * s * 0.015, eyeY + s * 0.035, radiusX * 0.22, 0, Math.PI * 2);
        ctx.fill();
      };
      drawEye(-1);
      drawEye(1);

      // --- 7. LONG CURVED BLACK SNOUT (Rostrum) ---
      const snoutSway = kf.snoutOffset * s;
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = s * 0.11;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, s * 0.08);
      ctx.quadraticCurveTo(snoutSway * 1.6, s * 0.35, snoutSway, s * 0.6);
      ctx.stroke();

      // Subtle gloss line along snout
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = s * 0.035;
      ctx.beginPath();
      ctx.moveTo(-s * 0.01, s * 0.12);
      ctx.quadraticCurveTo(snoutSway * 1.6 - s * 0.01, s * 0.35, snoutSway - s * 0.01, s * 0.52);
      ctx.stroke();

      // --- 8. ARTICULATED ELBOWED ANTENNAE ---
      ctx.strokeStyle = '#181818';
      ctx.lineWidth = s * 0.045;
      ctx.lineCap = 'round';

      // Left antenna
      ctx.beginPath();
      ctx.moveTo(-s * 0.04, s * 0.18);
      ctx.lineTo(-s * 0.18, s * 0.28);
      ctx.lineTo(-s * 0.2, s * 0.45);
      ctx.stroke();

      // Right antenna
      ctx.beginPath();
      ctx.moveTo(s * 0.04, s * 0.18);
      ctx.lineTo(s * 0.18, s * 0.28);
      ctx.lineTo(s * 0.2, s * 0.45);
      ctx.stroke();

      ctx.restore(); // Restore head
      ctx.restore(); // Restore main canvas

      newFrames.push(canvas);
    }

    this.frames = newFrames;
    this.ghostFrames = this.generateGhostFrames(newFrames);
    this.isLoaded = true;
  }

  // Draw animated weevil frame onto target canvas (isGhost = true for spectral spirit colors)
  public drawFrame(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    x: number,
    y: number,
    size: number,
    rotation: number,
    opacity = 1.0,
    scale = 1.0,
    isGhost = false
  ) {
    const frameList = isGhost && this.ghostFrames.length > 0 ? this.ghostFrames : this.frames;
    if (frameList.length === 0) return;

    const frame = frameList[frameIndex % frameList.length];
    if (!frame) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.globalAlpha = opacity;

    // Maintain true native aspect ratio of the spritesheet frame (Height / Width)
    const nativeAspect = (frame.height || 1) / (frame.width || 1);
    const renderWidth = size * 2.8;
    const renderHeight = renderWidth * nativeAspect * this.customLengthScale;

    if (isGhost) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 36;
    }

    ctx.drawImage(frame, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);

    if (isGhost) {
      // Radiant luminous glow bloom pass with additive lighting
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = opacity * 0.45;
      ctx.shadowColor = '#bae6fd';
      ctx.shadowBlur = 24;
      ctx.drawImage(frame, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
      ctx.restore();
    }

    ctx.restore();
  }

  public getFrameCount(): number {
    return this.frames.length;
  }

  public hasCustomSprite(): boolean {
    return !!this.customImageSrc;
  }

  public getCustomImageSrc(): string | null {
    return this.customImageSrc;
  }

  public getFrameCanvas(idx: number): HTMLCanvasElement | null {
    return this.frames[idx] || null;
  }

  public getGhostFrameCanvas(idx: number): HTMLCanvasElement | null {
    return this.ghostFrames[idx] || null;
  }
}

export const spriteEngine = new SpriteEngine();
