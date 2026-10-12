// Herb & Natural Repellent Sprite Engine (Chili, Kaffir Lime Leaf, Garlic)
// Supports the 4 columns x 3 rows (12 items) spritesheet matching 3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png

const IDB_NAME = 'weevil_game_herbs_db';
const IDB_STORE = 'herbs_assets';
const IDB_KEY = 'custom_herbs_spritesheet';

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
  if (!db) return;
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
  if (!db) return null;
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

class HerbEngine {
  // 12 Frames:
  // 0..3: Chili (พริก)
  // 4..7: Kaffir Lime Leaves (ใบมะกรูด)
  // 8..11: Garlic Cloves (กระเทียม)
  private frames: HTMLCanvasElement[] = [];
  private isLoaded = false;
  private customImageSrc: string | null = null;
  private onLoadedCallbacks: (() => void)[] = [];

  constructor() {
    this.initDefaultProceduralHerbs();
    this.initHerbCascade();
  }

  public onLoaded(callback: () => void) {
    this.onLoadedCallbacks.push(callback);
    if (this.isLoaded) {
      callback();
    }
  }

  private notifyLoaded() {
    this.onLoadedCallbacks.forEach((cb) => cb());
  }

  public getFrameCanvas(index: number): HTMLCanvasElement | null {
    if (index >= 0 && index < this.frames.length) {
      return this.frames[index];
    }
    return null;
  }

  public getFrameCount(): number {
    return this.frames.length;
  }

  public hasCustomSpritesheet(): boolean {
    return !!this.customImageSrc;
  }

  // Load priority: Bundled public images -> localStorage -> IndexedDB -> Procedural
  private async initHerbCascade() {
    // 1. Try bundled public images first (ensures latest updated repo file 3BC67C8E... is loaded)
    const presetOk = await this.loadPresetHerbs();
    if (presetOk) return;

    // 2. Check localStorage (for user-uploaded custom files)
    try {
      const saved = localStorage.getItem('weevil_herbs_spritesheet');
      if (saved && saved.startsWith('data:image/')) {
        const ok = await this.loadFromDataUrl(saved);
        if (ok) return;
      }
    } catch {
      // ignore
    }

    // 3. Check IndexedDB
    try {
      const idbSaved = await getFromIDB();
      if (idbSaved && idbSaved.startsWith('data:image/')) {
        const ok = await this.loadFromDataUrl(idbSaved);
        if (ok) return;
      }
    } catch {
      // ignore
    }
  }

  public async loadPresetHerbs(): Promise<boolean> {
    const base = import.meta.env.BASE_URL || './';
    const originPath =
      typeof window !== 'undefined'
        ? window.location.pathname.replace(/\/[^/]*$/, '/')
        : '/';

    const candidates = [
      // Primary: Exact filename uploaded by user
      `${originPath}3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png`,
      `${base}3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png`,
      `./3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png`,
      `3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png`,
      `/3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png`,
      `/catch-yuree/3BC67C8E-0E58-4179-BD41-6DE6B9B12918.png`,
      // Secondary: Standard naming aliases
      `${originPath}herbs_spritesheet.png`,
      `${base}herbs_spritesheet.png`,
      `./herbs_spritesheet.png`,
      `herbs_spritesheet.png`,
      `/herbs_spritesheet.png`,
      `/catch-yuree/herbs_spritesheet.png`,
      `${originPath}herbs.png`,
      `./herbs.png`,
      `herbs.png`,
      `${originPath}repellents.png`,
      `./repellents.png`,
      `repellents.png`,
    ];

    const uniqueCandidates = Array.from(new Set(candidates));

    for (const url of uniqueCandidates) {
      try {
        const ok = await this.loadFromUrl(url);
        if (ok) {
          return true;
        }
      } catch {
        // continue
      }
    }
    return false;
  }

  // Slices directly from HTMLImageElement into 12 items (4 cols x 3 rows)
  public sliceFromImageElement(img: HTMLImageElement): boolean {
    const cols = 4;
    const rows = 3;
    const totalItems = 12;

    const frameWidth = Math.floor(img.width / cols);
    const frameHeight = Math.floor(img.height / rows);

    if (frameWidth <= 0 || frameHeight <= 0) {
      return false;
    }

    // Check if image matches legacy 1448x1086 dimensions that had boundary overlaps
    const isLegacy1448 = Math.abs(img.width - 1448) < 10 && Math.abs(img.height - 1086) < 10;
    const legacyBoxes: [number, number, number, number][] = [
      // Row 0 Chilies: [minX, minY, maxX, maxY]
      [27, 33, 389, 394],
      [371, 24, 736, 399],
      [724, 44, 1064, 395],
      [1094, 23, 1410, 393],
      // Row 1 Kaffir Lime Leaves
      [28, 427, 314, 757],
      [401, 426, 679, 748],
      [766, 432, 1057, 767],
      [1105, 450, 1423, 756],
      // Row 2 Garlic / Shallot Cloves
      [55, 770, 329, 1045],
      [378, 764, 700, 1046],
      [778, 777, 1054, 1050],
      [1130, 759, 1415, 1047],
    ];

    const newFrames: HTMLCanvasElement[] = [];

    // Temporary full-size canvas to sample & extract from img
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = img.width;
    fullCanvas.height = img.height;
    const fullCtx = fullCanvas.getContext('2d', { willReadFrequently: true });
    if (!fullCtx) return false;
    fullCtx.drawImage(img, 0, 0);

    for (let index = 0; index < totalItems; index++) {
      const r = Math.floor(index / cols);
      const c = index % cols;

      let srcX = c * frameWidth;
      let srcY = r * frameHeight;
      let srcW = frameWidth;
      let srcH = frameHeight;

      if (isLegacy1448 && legacyBoxes[index]) {
        const [bx0, by0, bx1, by1] = legacyBoxes[index];
        const pad = 6;
        srcX = Math.max(0, bx0 - pad);
        srcY = Math.max(0, by0 - pad);
        srcW = Math.min(img.width - srcX, bx1 - bx0 + pad * 2);
        srcH = Math.min(img.height - srcY, by1 - by0 + pad * 2);
      }

      // Extract raw chunk
      const rawChunk = document.createElement('canvas');
      rawChunk.width = srcW;
      rawChunk.height = srcH;
      const rawCtx = rawChunk.getContext('2d', { willReadFrequently: true });
      if (!rawCtx) continue;

      rawCtx.drawImage(fullCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

      const imgData = rawCtx.getImageData(0, 0, srcW, srcH);
      const data = imgData.data;
      const cornerAlpha = data[3];
      const isAlreadyTransparent = cornerAlpha === 0;

      // Chroma-key white background if needed
      if (!isAlreadyTransparent) {
        for (let i = 0; i < data.length; i += 4) {
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          const minVal = Math.min(red, green, blue);
          const maxVal = Math.max(red, green, blue);
          const sat = maxVal === 0 ? 0 : (maxVal - minVal) / maxVal;

          if (minVal > 220 && sat < 0.16) {
            if (minVal > 242) {
              data[i + 3] = 0;
            } else {
              const factor = (minVal - 220) / 22;
              data[i + 3] = Math.round(data[i + 3] * (1 - factor));
            }
          }
        }
        rawCtx.putImageData(imgData, 0, 0);
      }

      // Auto-trim bounding box & center into a clean, unclipped square frame
      let minX = srcW;
      let minY = srcH;
      let maxX = 0;
      let maxY = 0;
      let foundPixel = false;

      for (let y = 0; y < srcH; y++) {
        for (let x = 0; x < srcW; x++) {
          const a = data[(y * srcW + x) * 4 + 3];
          if (a > 15) {
            foundPixel = true;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      const frameCanvas = document.createElement('canvas');
      if (foundPixel && maxX >= minX && maxY >= minY) {
        const itemW = maxX - minX + 1;
        const itemH = maxY - minY + 1;
        const maxDim = Math.max(itemW, itemH);
        const targetSize = Math.max(260, maxDim + 24); // Generous padding to prevent any edge clipping

        frameCanvas.width = targetSize;
        frameCanvas.height = targetSize;
        const fCtx = frameCanvas.getContext('2d');
        if (fCtx) {
          const dstX = Math.round((targetSize - itemW) / 2);
          const dstY = Math.round((targetSize - itemH) / 2);
          fCtx.drawImage(rawChunk, minX, minY, itemW, itemH, dstX, dstY, itemW, itemH);
        }
      } else {
        frameCanvas.width = srcW;
        frameCanvas.height = srcH;
        const fCtx = frameCanvas.getContext('2d');
        if (fCtx) {
          fCtx.drawImage(rawChunk, 0, 0);
        }
      }

      newFrames.push(frameCanvas);
    }

    if (newFrames.length === totalItems) {
      this.frames = newFrames;
      this.isLoaded = true;
      this.notifyLoaded();
      return true;
    }
    return false;
  }

  public loadFromUrl(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        try {
          const success = this.sliceFromImageElement(img);
          if (success) {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0);
                this.customImageSrc = canvas.toDataURL('image/png');
              }
            } catch {
              // ignore
            }
            resolve(true);
          } else {
            resolve(false);
          }
        } catch {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }

  public async loadFromFile(file: File): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const rawDataUrl = e.target?.result as string;
          if (!rawDataUrl) return resolve({ success: false, error: 'Could not read file' });

          const img = new Image();
          await new Promise<void>((imgRes, imgRej) => {
            img.onload = () => imgRes();
            img.onerror = () => imgRej(new Error('Invalid image format'));
            img.src = rawDataUrl;
          });

          const success = this.sliceFromImageElement(img);
          if (success) {
            this.customImageSrc = rawDataUrl;
            try {
              localStorage.setItem('weevil_herbs_spritesheet', rawDataUrl);
            } catch {
              // ignore
            }
            await saveToIDB(rawDataUrl);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: 'Could not slice 4x3 herbs grid' });
          }
        } catch (err: any) {
          resolve({ success: false, error: err?.message || 'Processing failed' });
        }
      };
      reader.onerror = () => resolve({ success: false, error: 'File read error' });
      reader.readAsDataURL(file);
    });
  }

  // Slices a 4 columns x 3 rows grid into 12 transparent items
  public loadFromDataUrl(dataUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const ok = this.sliceFromImageElement(img);
        if (ok) {
          this.customImageSrc = dataUrl;
          resolve(true);
        } else {
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  }

  // Draw herb on context with natural cast shadow
  public drawHerb(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    x: number,
    y: number,
    baseSize: number,
    rotation: number,
    opacity = 1.0
  ) {
    const frame = this.getFrameCanvas(frameIndex);
    if (!frame) return;

    const nativeAspect = frame.height / frame.width;
    const renderWidth = baseSize * 2.2;
    const renderHeight = renderWidth * nativeAspect;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.globalAlpha = opacity;

    // 1. Soft ambient cast shadow on rice
    ctx.save();
    ctx.shadowColor = 'rgba(38, 24, 12, 0.42)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 3.5;
    ctx.shadowOffsetY = 4.5;
    ctx.drawImage(frame, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);
    ctx.restore();

    // 2. Main herb sprite
    ctx.drawImage(frame, -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight);

    ctx.restore();
  }

  // Built-in procedural rendering matching the exact 12 items:
  // 0: Dried wrinkled red chili, 1: Fresh curved red chili, 2: Fresh green chili, 3: Cayenne red chili
  // 4: Double-lobed kaffir lime leaf, 5: Oval lime leaf, 6: Glossy dark lime leaf, 7: Scalloped lime leaf
  // 8: Papery garlic clove, 9: Tan dry garlic clove, 10: Peeled ivory garlic, 11: Purple striped garlic
  private initDefaultProceduralHerbs() {
    const fw = 180;
    const fh = 180;
    const procedural: HTMLCanvasElement[] = [];

    for (let i = 0; i < 12; i++) {
      const c = document.createElement('canvas');
      c.width = fw;
      c.height = fh;
      const ctx = c.getContext('2d');
      if (!ctx) continue;

      ctx.save();
      ctx.translate(fw / 2, fh / 2);

      if (i < 4) {
        // --- CHILIES (Row 0: 0, 1, 2, 3) ---
        this.renderProceduralChili(ctx, i);
      } else if (i < 8) {
        // --- KAFFIR LIME LEAVES (Row 1: 4, 5, 6, 7) ---
        this.renderProceduralLimeLeaf(ctx, i - 4);
      } else {
        // --- GARLIC CLOVES (Row 2: 8, 9, 10, 11) ---
        this.renderProceduralGarlic(ctx, i - 8);
      }

      ctx.restore();
      procedural.push(c);
    }

    this.frames = procedural;
  }

  // Procedural Chili Peppers
  private renderProceduralChili(ctx: CanvasRenderingContext2D, variant: number) {
    const isDried = variant === 0;
    const isGreen = variant === 2;
    const baseColor = isGreen ? '#2e7d32' : isDried ? '#c62828' : '#e53935';
    const highlightColor = isGreen ? '#81c784' : isDried ? '#e57373' : '#ff8a80';
    const darkShade = isGreen ? '#1b5e20' : isDried ? '#7f0000' : '#b71c1c';

    ctx.save();
    ctx.rotate(-0.4);

    // Stem (curled at top)
    ctx.strokeStyle = isDried ? '#a1887f' : '#4caf50';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -50);
    ctx.quadraticCurveTo(12, -70, 4, -80);
    ctx.stroke();

    // Calyx crown
    ctx.fillStyle = isDried ? '#8d6e63' : '#388e3c';
    ctx.beginPath();
    ctx.moveTo(-12, -45);
    ctx.lineTo(12, -45);
    ctx.lineTo(8, -38);
    ctx.lineTo(0, -35);
    ctx.lineTo(-8, -38);
    ctx.closePath();
    ctx.fill();

    // Chili Body
    ctx.beginPath();
    ctx.moveTo(-10, -42);
    // Left curve
    ctx.bezierCurveTo(-26, -10, -32, 20, 20, 65);
    // Right curve back
    ctx.bezierCurveTo(4, 30, 15, -10, 10, -42);
    ctx.closePath();

    const grad = ctx.createLinearGradient(-25, 0, 20, 30);
    grad.addColorStop(0, darkShade);
    grad.addColorStop(0.35, baseColor);
    grad.addColorStop(0.7, highlightColor);
    grad.addColorStop(1, darkShade);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outer subtle outline
    ctx.strokeStyle = 'rgba(30, 10, 5, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Glossy ridge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-6, -30);
    ctx.bezierCurveTo(-15, 0, -10, 25, 8, 50);
    ctx.stroke();

    if (isDried) {
      // Wrinkle marks on dried chili
      ctx.strokeStyle = 'rgba(60, 10, 10, 0.55)';
      ctx.lineWidth = 2;
      for (let w = -20; w <= 35; w += 10) {
        ctx.beginPath();
        ctx.moveTo(-16, w);
        ctx.quadraticCurveTo(-5, w + 4, 6, w + 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Procedural Kaffir Lime Leaves
  private renderProceduralLimeLeaf(ctx: CanvasRenderingContext2D, variant: number) {
    const isDoubleLobed = variant === 0 || variant === 2;
    const isDark = variant === 0 || variant === 2;
    const leafGreen = isDark ? '#1b5e20' : '#2e7d32';
    const brightGreen = isDark ? '#4caf50' : '#81c784';

    ctx.save();
    ctx.rotate(0.2);

    // Stem
    ctx.strokeStyle = '#33691e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 55);
    ctx.lineTo(0, 70);
    ctx.stroke();

    // Leaf outline (Hourglass double lobe for kaffir lime)
    ctx.beginPath();
    if (isDoubleLobed) {
      // Lower lobe
      ctx.moveTo(0, 55);
      ctx.bezierCurveTo(-30, 45, -34, 25, -15, 12);
      // Upper lobe
      ctx.bezierCurveTo(-42, -5, -38, -45, 0, -65);
      ctx.bezierCurveTo(38, -45, 42, -5, 15, 12);
      ctx.bezierCurveTo(34, 25, 30, 45, 0, 55);
    } else {
      // Single oval / scalloped leaf
      ctx.moveTo(0, 55);
      ctx.bezierCurveTo(-45, 25, -45, -30, 0, -65);
      ctx.bezierCurveTo(45, -30, 45, 25, 0, 55);
    }
    ctx.closePath();

    const lGrad = ctx.createLinearGradient(-35, 0, 35, 0);
    lGrad.addColorStop(0, '#0f3d13');
    lGrad.addColorStop(0.3, leafGreen);
    lGrad.addColorStop(0.7, brightGreen);
    lGrad.addColorStop(1, '#1b5e20');
    ctx.fillStyle = lGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(10, 35, 10, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Central leaf spine vein
    ctx.strokeStyle = '#7cb342';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 55);
    ctx.quadraticCurveTo(-2, 0, 0, -62);
    ctx.stroke();

    // Lateral veins
    ctx.strokeStyle = 'rgba(139, 195, 74, 0.45)';
    ctx.lineWidth = 1.5;
    const veinY = [-40, -25, -10, 5, 25, 40];
    veinY.forEach((vy) => {
      ctx.beginPath();
      ctx.moveTo(0, vy);
      ctx.quadraticCurveTo(-15, vy - 8, -26, vy - 12);
      ctx.moveTo(0, vy);
      ctx.quadraticCurveTo(15, vy - 8, 26, vy - 12);
      ctx.stroke();
    });

    // Glossy waxy sheen highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.ellipse(8, -25, 16, 25, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // Procedural Garlic Cloves
  private renderProceduralGarlic(ctx: CanvasRenderingContext2D, variant: number) {
    const isPeeled = variant === 2;
    const isPurple = variant === 3;

    ctx.save();
    ctx.rotate(-0.25);

    // Crescent / Teardrop clove shape
    ctx.beginPath();
    ctx.moveTo(35, -45); // Pointed beak tip
    // Inner curve
    ctx.quadraticCurveTo(-8, -20, -32, 25);
    // Base root
    ctx.quadraticCurveTo(-25, 42, -5, 45);
    // Outer rounded belly
    ctx.bezierCurveTo(32, 42, 45, 10, 35, -45);
    ctx.closePath();

    const gGrad = ctx.createLinearGradient(-30, 25, 35, -20);
    if (isPeeled) {
      gGrad.addColorStop(0, '#f5e6ca');
      gGrad.addColorStop(0.4, '#fff9e6');
      gGrad.addColorStop(0.8, '#faecd4');
      gGrad.addColorStop(1, '#edd6b1');
    } else if (isPurple) {
      gGrad.addColorStop(0, '#e8d5be');
      gGrad.addColorStop(0.3, '#f2dcd0');
      gGrad.addColorStop(0.65, '#e0a8b8');
      gGrad.addColorStop(1, '#c57896');
    } else {
      gGrad.addColorStop(0, '#d7c2a7');
      gGrad.addColorStop(0.3, '#f5ebe0');
      gGrad.addColorStop(0.7, '#ebd8c4');
      gGrad.addColorStop(1, '#cbb497');
    }
    ctx.fillStyle = gGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(80, 50, 30, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Root end callus
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.ellipse(-20, 36, 9, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Papery skin longitudinal grooves
    ctx.strokeStyle = isPurple ? 'rgba(173, 50, 100, 0.35)' : 'rgba(160, 130, 100, 0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-16, 32);
    ctx.bezierCurveTo(-5, 15, 15, -10, 34, -42);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-10, 36);
    ctx.bezierCurveTo(8, 20, 25, 0, 35, -40);
    ctx.stroke();

    // Glossy light highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(14, 2, 8, 22, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export const herbEngine = new HerbEngine();
