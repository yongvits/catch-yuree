import React, { useEffect, useRef, useCallback } from 'react';
import { RiceGrain, Weevil, Ghost, Particle, FloatingText, HerbItem } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { spriteEngine } from '../utils/spriteEngine';
import { herbEngine } from '../utils/herbEngine';

interface WeevilCanvasProps {
  totalCount: number;
  isPaused?: boolean;
  ascendedText?: string;
  comboPrefix?: string;
  onCountChange: (remaining: number, total: number) => void;
  onVictory: (elapsedSeconds: number, comboMax: number, accuracy: number) => void;
  onHit?: (combo: number) => void;
  onMiss?: () => void;
}

export const WeevilCanvas: React.FC<WeevilCanvasProps> = ({
  totalCount,
  isPaused = false,
  ascendedText = 'Ascended ✨',
  comboPrefix = 'Combo x',
  onCountChange,
  onVictory,
  onHit,
  onMiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // References for mutable game state
  const stateRef = useRef({
    weevils: [] as Weevil[],
    ghosts: [] as Ghost[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    riceGrains: [] as RiceGrain[],
    herbs: [] as HerbItem[],
    bgCanvas: null as HTMLCanvasElement | null,
    fgCanvas: null as HTMLCanvasElement | null,
    totalCount: totalCount,
    remainingCount: totalCount,
    combo: 0,
    maxCombo: 0,
    lastHitTime: 0,
    totalTaps: 0,
    successfulHits: 0,
    startTime: 0,
    isVictoryTriggered: false,
    ghostIdCounter: 0,
    animationFrameId: 0,
    lastActivityTime: performance.now(),
  });

  // Reference for dragging chili, garlic, and kaffir lime leaf with long press
  const herbHoldRef = useRef<{
    herbId: number;
    pointerId: number | 'mouse';
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    timer: number | null;
    isDragging: boolean;
  } | null>(null);

  // Setup offscreen canvas
  const initOffscreenCanvas = useCallback(() => {
    if (!stateRef.current.bgCanvas) {
      stateRef.current.bgCanvas = document.createElement('canvas');
    }
    if (!stateRef.current.fgCanvas) {
      stateRef.current.fgCanvas = document.createElement('canvas');
    }
  }, []);

  // 1. Generate rice grains with realistic distribution
  const generateRiceGrains = useCallback((width: number, height: number) => {
    const grains: RiceGrain[] = [];
    const totalGrains = Math.floor((width * height) / 38);
    const shades = [
      '#ffffff',
      '#fefcf6',
      '#fcf8ea',
      '#f6edd2',
      '#f0e6c7',
      '#eae0bd',
      '#ded4b0',
    ];

    for (let i = 0; i < totalGrains; i++) {
      grains.push({
        x: Math.random() * width,
        y: Math.random() * height,
        rx: 7.0 + Math.random() * 4.5,
        ry: 2.5 + Math.random() * 1.3,
        rot: Math.random() * Math.PI * 2,
        shade: shades[Math.floor(Math.random() * shades.length)],
        isForeground: Math.random() < 0.22,
      });
    }
    stateRef.current.riceGrains = grains;
  }, []);

  // 1.5 Generate scattered herbs (Chili, Kaffir Lime, Garlic) matching traditional rice sack repellents
  const generateHerbs = useCallback((width: number, height: number) => {
    const items: HerbItem[] = [];
    const count = Math.max(7, Math.min(12, Math.floor((width * height) / 85000) + 4));
    const pad = 48;

    // Guaranteed diverse mix of chilies (0..3), kaffir lime leaves (4..7), and garlic cloves (8..11)
    const herbPool: { frame: number; cat: 'chili' | 'lime' | 'garlic'; baseScale: number }[] = [];

    // Guarantee at least two of each category:
    herbPool.push({ frame: Math.floor(Math.random() * 4), cat: 'chili', baseScale: 1.05 });
    herbPool.push({ frame: Math.floor(Math.random() * 4), cat: 'chili', baseScale: 0.95 });
    herbPool.push({ frame: 4 + Math.floor(Math.random() * 4), cat: 'lime', baseScale: 1.0 });
    herbPool.push({ frame: 4 + Math.floor(Math.random() * 4), cat: 'lime', baseScale: 1.1 });
    herbPool.push({ frame: 8 + Math.floor(Math.random() * 4), cat: 'garlic', baseScale: 0.9 });
    herbPool.push({ frame: 8 + Math.floor(Math.random() * 4), cat: 'garlic', baseScale: 1.0 });

    while (herbPool.length < count) {
      const r = Math.random();
      if (r < 0.35) {
        herbPool.push({ frame: Math.floor(Math.random() * 4), cat: 'chili', baseScale: 0.9 + Math.random() * 0.25 });
      } else if (r < 0.7) {
        herbPool.push({ frame: 4 + Math.floor(Math.random() * 4), cat: 'lime', baseScale: 0.95 + Math.random() * 0.25 });
      } else {
        herbPool.push({ frame: 8 + Math.floor(Math.random() * 4), cat: 'garlic', baseScale: 0.85 + Math.random() * 0.25 });
      }
    }

    for (let i = 0; i < herbPool.length; i++) {
      const hInfo = herbPool[i];
      let hx = 0;
      let hy = 0;
      let attempts = 0;
      let tooClose = true;

      while (tooClose && attempts < 150) {
        hx = pad + Math.random() * (width - pad * 2);
        hy = pad + Math.random() * (height - pad * 2);
        tooClose = false;

        for (let j = 0; j < items.length; j++) {
          const other = items[j];
          if (Math.hypot(hx - other.x, hy - other.y) < 100) {
            tooClose = true;
            break;
          }
        }
        attempts++;
      }

      items.push({
        id: i + 1,
        x: hx,
        y: hy,
        rotation: Math.random() * Math.PI * 2,
        scale: hInfo.baseScale,
        frameIndex: hInfo.frame,
        category: hInfo.cat,
        isForeground: i % 2 === 0, // Half nestled in background under grains, half resting on top!
      });
    }

    stateRef.current.herbs = items;
  }, []);

  // 2. Render single rice grain
  const drawRiceGrain = (targetCtx: CanvasRenderingContext2D, g: RiceGrain) => {
    targetCtx.save();
    targetCtx.translate(g.x, g.y);
    targetCtx.rotate(g.rot);

    targetCtx.shadowColor = 'rgba(42, 28, 12, 0.3)';
    targetCtx.shadowBlur = 2.5;
    targetCtx.shadowOffsetX = 1.0;
    targetCtx.shadowOffsetY = 1.0;

    targetCtx.fillStyle = g.shade;
    targetCtx.beginPath();
    targetCtx.moveTo(-g.rx, 0);
    targetCtx.quadraticCurveTo(0, -g.ry, g.rx, 0);
    targetCtx.quadraticCurveTo(0, g.ry, -g.rx, 0);
    targetCtx.closePath();
    targetCtx.fill();

    targetCtx.shadowColor = 'transparent';
    targetCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    targetCtx.beginPath();
    targetCtx.ellipse(-g.rx * 0.25, -g.ry * 0.35, g.rx * 0.35, g.ry * 0.18, 0.1, 0, Math.PI * 2);
    targetCtx.fill();

    targetCtx.restore();
  };

  // 3. Render offscreen rice sack layers (Background woven sack & Foreground grains)
  const renderOffscreenRice = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) return;

    initOffscreenCanvas();
    const bgCanvas = stateRef.current.bgCanvas!;
    const fgCanvas = stateRef.current.fgCanvas!;

    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    fgCanvas.width = canvas.width;
    fgCanvas.height = canvas.height;

    const bgCtx = bgCanvas.getContext('2d');
    const fgCtx = fgCanvas.getContext('2d');
    if (!bgCtx || !fgCtx) return;

    // Sack texture background
    bgCtx.fillStyle = '#b09477';
    bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

    // Weaved hemp/burlap thread lines
    bgCtx.strokeStyle = 'rgba(92, 64, 51, 0.2)';
    bgCtx.lineWidth = 1.2;
    const step = 8;
    for (let x = 0; x < bgCanvas.width; x += step) {
      bgCtx.beginPath();
      bgCtx.moveTo(x, 0);
      bgCtx.lineTo(x, bgCanvas.height);
      bgCtx.stroke();
    }
    for (let y = 0; y < bgCanvas.height; y += step) {
      bgCtx.beginPath();
      bgCtx.moveTo(0, y);
      bgCtx.lineTo(bgCanvas.width, y);
      bgCtx.stroke();
    }

    fgCtx.clearRect(0, 0, fgCanvas.width, fgCanvas.height);

    stateRef.current.riceGrains.forEach((g) => {
      const targetCtx = g.isForeground ? fgCtx : bgCtx;
      drawRiceGrain(targetCtx, g);
    });
  }, [initOffscreenCanvas]);

  // 4. Spawn weevils with non-overlapping initial distribution
  const spawnWeevils = useCallback((count: number) => {
    const canvas = canvasRef.current;
    const w = canvas && canvas.width > 0 ? canvas.width : window.innerWidth;
    const h = canvas && canvas.height > 0 ? canvas.height : window.innerHeight;
    const padding = 35;

    const playableArea = (w - padding * 2) * (h - padding * 2);
    let minDistance = Math.sqrt(playableArea / count) * 0.85;
    minDistance = Math.min(minDistance, 100);

    const newWeevils: Weevil[] = [];

    for (let i = 0; i < count; i++) {
      let spawnX = 0;
      let spawnY = 0;
      let attempts = 0;
      let tooClose = true;

      while (tooClose && attempts < 200) {
        spawnX = padding + Math.random() * (w - padding * 2);
        spawnY = padding + Math.random() * (h - padding * 2);
        tooClose = false;

        for (let j = 0; j < newWeevils.length; j++) {
          const other = newWeevils[j];
          const dist = Math.hypot(spawnX - other.x, spawnY - other.y);
          if (dist < minDistance) {
            tooClose = true;
            break;
          }
        }

        attempts++;
        if (attempts % 45 === 0) {
          minDistance *= 0.85;
        }
      }

      const shouldStartIdle = Math.random() < 0.35;
      newWeevils.push({
        id: i + 1,
        x: spawnX,
        y: spawnY,
        vx: shouldStartIdle ? 0 : (Math.random() - 0.5) * 0.7,
        vy: shouldStartIdle ? 0 : (Math.random() - 0.5) * 0.7,
        baseSpeed: 0.35 + Math.random() * 0.55,
        scurryTimer: 0,
        size: 13 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        legsPhase: Math.random() * 100,
        opacity: 1,
        isDying: false,
        scale: 1,
        changeDirTimer: Math.random() * 100,
        idlePauseTimer: shouldStartIdle ? Math.floor(60 + Math.random() * 180) : 0,
      });
    }

    stateRef.current.weevils = newWeevils;
    stateRef.current.ghosts = [];
    stateRef.current.particles = [];
    stateRef.current.floatingTexts = [];
    stateRef.current.remainingCount = count;
    stateRef.current.totalCount = count;
    stateRef.current.combo = 0;
    stateRef.current.maxCombo = 0;
    stateRef.current.totalTaps = 0;
    stateRef.current.successfulHits = 0;
    stateRef.current.startTime = performance.now();
    stateRef.current.lastActivityTime = performance.now();
    stateRef.current.isVictoryTriggered = false;

    onCountChange(count, count);
  }, [onCountChange]);

  // 5. Draw animated weevil using the 8-frame character spritesheet
  const drawWeevil = (ctx: CanvasRenderingContext2D, w: Weevil) => {
    const frameIndex = Math.floor(w.legsPhase) % 8;
    const squishScaleX = w.isDying ? w.scale * 1.3 : w.scale;
    const squishScaleY = w.isDying ? w.scale * 0.7 : w.scale;

    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.rotate(w.rotation);
    ctx.scale(squishScaleX, squishScaleY);
    ctx.globalAlpha = w.isDying ? Math.min(w.opacity, 0.65) : w.opacity;

    spriteEngine.drawFrame(
      ctx,
      frameIndex,
      0,
      0,
      w.size,
      0,
      w.isDying ? 0.65 : 1.0,
      1.0,
      w.isDying
    );
    ctx.restore();
  };

  // 6. Draw bright glowing spirit of the spritesheet character ascending to heaven (blue spirit tone, halo removed, reduced opacity & enhanced glow)
  const drawGhost = (ctx: CanvasRenderingContext2D, g: Ghost) => {
    ctx.save();
    ctx.translate(g.x, g.y);
    ctx.rotate(g.rotation);
    ctx.scale(g.scale, g.scale);
    // Smooth ease-out fade curve for peaceful, gradual disappearance without abrupt vanishing
    const currentAlpha = Math.max(0, Math.min(1, g.opacity));
    const smoothAlpha = Math.sin((currentAlpha * Math.PI) / 2);
    ctx.globalAlpha = smoothAlpha;

    const size = g.size * spriteEngine.getSizeScale();

    // --- 1. ENHANCED LUMINOUS GLOW EFFECT (เพิ่มการเรืองแสง) ---
    // Outer wide ethereal blue spirit glow aura
    ctx.save();
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = Math.round(45 * smoothAlpha);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.32 * smoothAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.55, size * 1.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Radiant cyan/blue luminous core glow
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = Math.round(32 * smoothAlpha);
    const coreGrad = ctx.createRadialGradient(0, 0, size * 0.15, 0, 0, size * 1.25);
    coreGrad.addColorStop(0, `rgba(224, 242, 254, ${0.68 * smoothAlpha})`); // Luminous crystal bright center
    coreGrad.addColorStop(0.55, `rgba(56, 189, 248, ${0.45 * smoothAlpha})`);
    coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 2. TRANSLUCENT ANGELIC FAIRY WINGS (สลับปีกกลับด้านมาทางหัว และให้อยู่กลางตัว) ---
    // Wings attached at exact body center (y = 0) and oriented towards the head
    const wingWiggle = Math.sin(g.wingPhase) * 0.28;
    const wingSpan = size * 1.35;

    // Left Wing (Attached on left center body, spreading gracefully outwards toward head)
    ctx.save();
    ctx.translate(-size * 0.32, 0); // อยู่กลางตัว
    ctx.rotate(-(Math.PI - 0.52) + wingWiggle); // สลับด้านมาทางหัว
    ctx.fillStyle = `rgba(56, 189, 248, ${0.52 * smoothAlpha})`;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.90 * smoothAlpha})`;
    ctx.lineWidth = size * 0.08;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = Math.round(22 * smoothAlpha);

    // Primary wing blade
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.48, 0, wingSpan * 0.52, wingSpan * 0.28, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Secondary fairy winglet lobe
    ctx.fillStyle = `rgba(125, 211, 252, ${0.38 * smoothAlpha})`;
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.36, wingSpan * 0.14, wingSpan * 0.34, wingSpan * 0.18, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner glowing wing vein
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.80 * smoothAlpha})`;
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingSpan * 0.3, -wingSpan * 0.05, wingSpan * 0.85, 0);
    ctx.stroke();
    ctx.restore();

    // Right Wing (Attached on right center body, spreading gracefully outwards toward head)
    ctx.save();
    ctx.translate(size * 0.32, 0); // อยู่กลางตัว
    ctx.rotate(-0.52 - wingWiggle); // สลับด้านมาทางหัว
    ctx.fillStyle = `rgba(56, 189, 248, ${0.52 * smoothAlpha})`;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.90 * smoothAlpha})`;
    ctx.lineWidth = size * 0.08;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = Math.round(22 * smoothAlpha);

    // Primary wing blade
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.48, 0, wingSpan * 0.52, wingSpan * 0.28, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Secondary fairy winglet lobe
    ctx.fillStyle = `rgba(125, 211, 252, ${0.38 * smoothAlpha})`;
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.36, -wingSpan * 0.14, wingSpan * 0.34, wingSpan * 0.18, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner glowing wing vein
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.80 * smoothAlpha})`;
    ctx.lineWidth = size * 0.035;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingSpan * 0.3, wingSpan * 0.05, wingSpan * 0.85, 0);
    ctx.stroke();
    ctx.restore();

    // --- 3. THE SPIRIT SPRITE WITH TRANSLUCENT OPACITY & RADIANT GLOW ---
    // Opacity fades synchronously with smoothAlpha to prevent sudden disappearance
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = Math.round(36 * smoothAlpha);
    spriteEngine.drawFrame(
      ctx,
      g.frameIndex ?? 0,
      0,
      0,
      size,
      0, // Already transformed by parent
      smoothAlpha * 0.72, // Fades smoothly from 0.72 down to 0.0!
      1.0,
      true // isGhost = true
    );
    ctx.restore();

    ctx.restore();
  };

  // 7. Create squish particles matching the blue spirit theme & rice bran
  const createSquishParticles = (x: number, y: number) => {
    const count = 22;
    const colors = [
      '#38bdf8', // Luminous sky blue
      '#60a5fa', // Soft blue
      '#93c5fd', // Light spirit blue
      '#0284c7', // Rich deep blue
      '#bae6fd', // Pale ethereal ice blue
      '#ca945a', // Caramel shell powder
      '#fef08a', // Rice powder
      '#ffffff', // Pure white spark
    ];
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.5) * 7,
        size: 1.5 + Math.random() * 4.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.025 + Math.random() * 0.035,
      });
    }
  };

  // 7.5 Create fragrant aromatic sparks for herbs (chili, lime, garlic)
  const createHerbSparks = (x: number, y: number, category: 'chili' | 'lime' | 'garlic', count = 8) => {
    const sparkColor =
      category === 'chili'
        ? '#ef4444' // Ruby chili spark
        : category === 'lime'
        ? '#84cc16' // Lime green zest
        : '#fef08a'; // Garlic ivory essence
    for (let p = 0; p < count; p++) {
      stateRef.current.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * 3.5,
        vy: (Math.random() - 0.5) * 3.5 - 1.2,
        size: 1.6 + Math.random() * 2.8,
        color: sparkColor,
        life: 0.85,
        decay: 0.045 + Math.random() * 0.03,
      });
    }
  };

  // 7.8 Draw lifted/dragged herb item with elevated shadow and repellent aura ring
  const drawDraggedHerb = (ctx: CanvasRenderingContext2D, h: HerbItem) => {
    ctx.save();

    // 1. Elevated 3D cast drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(28, 14, 5, 0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 16;
    herbEngine.drawHerb(ctx, h.frameIndex, h.x, h.y, 35 * h.scale * 1.25, h.rotation);
    ctx.restore();

    // 2. Aromatic repellent perimeter ring
    const repelRadius = 82 * h.scale;
    const auraColor =
      h.category === 'chili'
        ? 'rgba(239, 68, 68, 0.5)'
        : h.category === 'lime'
        ? 'rgba(132, 204, 22, 0.5)'
        : 'rgba(254, 240, 138, 0.5)';
    ctx.save();
    ctx.strokeStyle = auraColor;
    ctx.lineWidth = 1.8;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(h.x, h.y, repelRadius, 0, Math.PI * 2);
    ctx.stroke();

    const glowGrad = ctx.createRadialGradient(h.x, h.y, 10, h.x, h.y, repelRadius);
    glowGrad.addColorStop(0, auraColor.replace('0.5', '0.22'));
    glowGrad.addColorStop(1, auraColor.replace('0.5', '0'));
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(h.x, h.y, repelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Main slightly magnified herb item
    herbEngine.drawHerb(ctx, h.frameIndex, h.x, h.y, 35 * h.scale * 1.25, h.rotation);
    ctx.restore();
  };

  // 8. Add floating text on hit/combo
  const addFloatingText = (x: number, y: number, text: string, color = '#fef08a') => {
    stateRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y: y - 10,
      text,
      color,
      opacity: 1,
      scale: 1,
      vy: -1.2,
    });
  };

  // 9. Input detection (Touch / Click)
  const handleInput = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || stateRef.current.isVictoryTriggered) return;

      const rect = canvas.getBoundingClientRect();
      const tapX = (clientX - rect.left) * (canvas.width / rect.width);
      const tapY = (clientY - rect.top) * (canvas.height / rect.height);

      stateRef.current.totalTaps++;
      stateRef.current.lastActivityTime = performance.now();

      let hitDetected = false;
      const weevils = stateRef.current.weevils;
      const now = performance.now();

      for (let i = weevils.length - 1; i >= 0; i--) {
        const w = weevils[i];
        if (w.isDying) continue;

        const dist = Math.hypot(w.x - tapX, w.y - tapY);
        const hitRadius = Math.max(22, w.size * spriteEngine.getSizeScale() * 2.3);

        if (dist < hitRadius) {
          w.isDying = true;
          w.opacity = 0.65;
          w.vx = 0;
          w.vy = 0;

          // Bran burst particles
          createSquishParticles(w.x, w.y);

          // Audio
          soundManager.playSquish();

          // Combo tracking (within 1.4 seconds)
          if (now - stateRef.current.lastHitTime < 1400) {
            stateRef.current.combo++;
          } else {
            stateRef.current.combo = 1;
          }
          stateRef.current.lastHitTime = now;
          if (stateRef.current.combo > stateRef.current.maxCombo) {
            stateRef.current.maxCombo = stateRef.current.combo;
          }

          // Floating text
          if (stateRef.current.combo > 1) {
            soundManager.playCombo(stateRef.current.combo);
            addFloatingText(w.x, w.y, `${comboPrefix}${stateRef.current.combo}!`, '#38bdf8');
          } else {
            addFloatingText(w.x, w.y, ascendedText, '#38bdf8');
          }

          // Released ghost (Expands 1x larger [2.0x scale] before disappearing, duration +50%)
          stateRef.current.ghostIdCounter++;
          stateRef.current.ghosts.push({
            id: stateRef.current.ghostIdCounter,
            x: w.x,
            y: w.y,
            frameIndex: Math.floor(w.legsPhase) % 8,
            floatSpeed: 0, // ไม่ลอยขึ้น! (stationary Y, ไม่ลอยขึ้นบนจอ)
            zoomSpeed: 0.011,
            scale: 1.0,
            rotation: w.rotation,
            opacity: 1.0,
            fadeSpeed: 0.011, // เพิ่มเวลาขึ้นครึ่งหนึ่ง (+50% duration: ~1.5 - 1.6 วินาที)
            wavePhase: Math.random() * Math.PI,
            wingPhase: Math.random() * 10,
            size: w.size,
          });

          // Ghost ascension sound
          const pitchFactor = 1.0 + Math.min(stateRef.current.combo * 0.05, 0.4);
          soundManager.playGhost(pitchFactor);

          stateRef.current.remainingCount--;
          stateRef.current.successfulHits++;
          hitDetected = true;

          onHit?.(stateRef.current.combo);
          onCountChange(stateRef.current.remainingCount, stateRef.current.totalCount);

          if (stateRef.current.remainingCount <= 0) {
            stateRef.current.isVictoryTriggered = true;
            const elapsed = (performance.now() - stateRef.current.startTime) / 1000;
            const accuracy = Math.round(
              (stateRef.current.successfulHits / Math.max(stateRef.current.totalTaps, 1)) * 100
            );
            soundManager.playVictory();
            setTimeout(() => {
              onVictory(elapsed, stateRef.current.maxCombo, accuracy);
            }, 600);
          }
          break;
        }
      }

      // Missed: weevils within radius get startled and scurry away!
      if (!hitDetected) {
        stateRef.current.combo = 0;
        soundManager.playStartled();
        onMiss?.();

        weevils.forEach((w) => {
          const dist = Math.hypot(w.x - tapX, w.y - tapY);
          if (dist < 110 && !w.isDying) {
            w.idlePauseTimer = 0; // Wake up immediately!
            const angle = Math.atan2(w.y - tapY, w.x - tapX) + (Math.random() - 0.5) * 0.7;
            w.scurryTimer = 160;
            w.vx = Math.cos(angle) * w.baseSpeed * 3.2;
            w.vy = Math.sin(angle) * w.baseSpeed * 3.2;
            w.changeDirTimer = 160;
          }
        });
      }

      // Check if tap hit an herb item (gentle fragrant spark puff effect!)
      stateRef.current.herbs.forEach((h) => {
        const dist = Math.hypot(h.x - tapX, h.y - tapY);
        if (dist < 42 * h.scale) {
          createHerbSparks(h.x, h.y, h.category, 6);
        }
      });
    },
    [onCountChange, onVictory, onHit, onMiss, ascendedText, comboPrefix]
  );

  // Resize canvas and update positions proportionally
  const resizeGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    canvas.width = width;
    canvas.height = height;

    generateRiceGrains(width, height);
    generateHerbs(width, height);
    renderOffscreenRice();

    if (oldWidth > 0 && oldHeight > 0) {
      const scaleX = width / oldWidth;
      const scaleY = height / oldHeight;
      stateRef.current.weevils.forEach((w) => {
        w.x *= scaleX;
        w.y *= scaleY;
        w.x = Math.max(w.size, Math.min(width - w.size, w.x));
        w.y = Math.max(w.size, Math.min(height - w.size, w.y));
      });
    }
  }, [generateRiceGrains, generateHerbs, renderOffscreenRice]);

  // Convert client coordinates to canvas coordinates
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  // Check if pointer pressed on an herb to start long-press hold
  const checkHerbStart = useCallback(
    (canvasX: number, canvasY: number, pointerId: number | 'mouse') => {
      const herbs = stateRef.current.herbs;
      let closestHerb: HerbItem | null = null;
      let minDist = Infinity;

      for (let i = herbs.length - 1; i >= 0; i--) {
        const h = herbs[i];
        const dist = Math.hypot(h.x - canvasX, h.y - canvasY);
        const grabRadius = 46 * h.scale;
        if (dist < grabRadius && dist < minDist) {
          minDist = dist;
          closestHerb = h;
        }
      }

      if (closestHerb) {
        const targetId = closestHerb.id;
        const offsetX = canvasX - closestHerb.x;
        const offsetY = canvasY - closestHerb.y;

        const timer = window.setTimeout(() => {
          if (herbHoldRef.current && herbHoldRef.current.herbId === targetId) {
            herbHoldRef.current.isDragging = true;
            const target = stateRef.current.herbs.find((h) => h.id === targetId);
            if (target) {
              target.isDragging = true;
              soundManager.playHerbPick();
              if (typeof navigator !== 'undefined' && navigator.vibrate) {
                try {
                  navigator.vibrate(35);
                } catch {
                  // ignore
                }
              }
              createHerbSparks(target.x, target.y, target.category, 12);
            }
          }
        }, 250); // 250ms long press

        herbHoldRef.current = {
          herbId: targetId,
          pointerId,
          startX: canvasX,
          startY: canvasY,
          offsetX,
          offsetY,
          timer,
          isDragging: false,
        };
      }
    },
    []
  );

  // Dragging herb
  const handleHerbMove = useCallback((canvasX: number, canvasY: number) => {
    const hold = herbHoldRef.current;
    if (!hold) return;

    if (!hold.isDragging) {
      if (Math.hypot(canvasX - hold.startX, canvasY - hold.startY) > 16) {
        if (hold.timer) clearTimeout(hold.timer);
        herbHoldRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const herb = stateRef.current.herbs.find((h) => h.id === hold.herbId);
    if (herb) {
      const pad = 35;
      herb.x = Math.max(pad, Math.min(canvas.width - pad, canvasX - hold.offsetX));
      herb.y = Math.max(pad, Math.min(canvas.height - pad, canvasY - hold.offsetY));
      stateRef.current.lastActivityTime = performance.now();

      if (Math.random() < 0.22) {
        createHerbSparks(herb.x, herb.y, herb.category, 1);
      }
    }
  }, []);

  // Dropping herb
  const handleHerbEnd = useCallback(() => {
    const hold = herbHoldRef.current;
    if (!hold) return;

    if (hold.timer) {
      clearTimeout(hold.timer);
    }

    if (hold.isDragging) {
      const herb = stateRef.current.herbs.find((h) => h.id === hold.herbId);
      if (herb) {
        herb.isDragging = false;
        soundManager.playHerbDrop();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(20);
          } catch {
            // ignore
          }
        }
        createHerbSparks(herb.x, herb.y, herb.category, 8);
      }
    }

    herbHoldRef.current = null;
  }, []);

  // Main game update & loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeGame();
    spawnWeevils(totalCount);

    herbEngine.onLoaded(() => {
      renderOffscreenRice();
    });

    let animationId: number;

    const loop = () => {
      const {
        weevils,
        ghosts,
        particles,
        floatingTexts,
        bgCanvas,
        fgCanvas,
      } = stateRef.current;

      const ctx = canvas.getContext('2d');
      if (ctx && canvas.width > 0 && canvas.height > 0) {
        if (!isPaused) {
          // --- 1. Repulsion physics between weevils to prevent clumping ---
          for (let i = 0; i < weevils.length; i++) {
            const w1 = weevils[i];
            if (w1.isDying) continue;

            for (let j = i + 1; j < weevils.length; j++) {
              const w2 = weevils[j];
              if (w2.isDying) continue;

              const dx = w2.x - w1.x;
              const dy = w2.y - w1.y;
              const dist = Math.hypot(dx, dy);
              const personalSpace = (w1.size + w2.size) * 1.5;

              if (dist < personalSpace && dist > 0) {
                const force = ((personalSpace - dist) / personalSpace) * 0.12;
                const pushX = (dx / dist) * force;
                const pushY = (dy / dist) * force;

                w1.vx -= pushX;
                w1.vy -= pushY;
                w2.vx += pushX;
                w2.vy += pushY;
              }
            }
          }

          // Screen idle check: if user hasn't interacted for >1.4s, weevils walk slowly or rest in place
          const isScreenIdle = performance.now() - stateRef.current.lastActivityTime > 1400;

          // --- 2. Update Weevils ---
          for (let i = weevils.length - 1; i >= 0; i--) {
            const w = weevils[i];
            if (w.isDying) {
              w.scale -= 0.14;
              w.opacity -= 0.14;
              if (w.scale <= 0) {
                weevils.splice(i, 1);
              }
              continue;
            }

            // Check if weevil is resting / idling quietly in place
            if ((w.idlePauseTimer ?? 0) > 0) {
              w.idlePauseTimer!--;
              w.vx = 0;
              w.vy = 0;
              // Very gentle resting idle animation (subtle breathing / antennae wiggle)
              w.legsPhase += 0.02;
            } else {
              w.changeDirTimer--;
              if (w.changeDirTimer <= 0) {
                const angle = Math.random() * Math.PI * 2;
                if (isScreenIdle && Math.random() < 0.40) {
                  // Undisturbed weevil rests and stays still in place among rice grains
                  w.idlePauseTimer = Math.floor(90 + Math.random() * 210); // 1.5 - 5 seconds
                  w.vx = 0;
                  w.vy = 0;
                  w.changeDirTimer = w.idlePauseTimer + 40;
                } else {
                  // Walking: if screen is idle, walk slowly; if player is active, normal speed
                  const speed =
                    w.scurryTimer > 0
                      ? w.baseSpeed * 2.8
                      : isScreenIdle
                      ? w.baseSpeed * (0.32 + Math.random() * 0.20) // เดินช้า ๆ เมื่อไม่ได้แตะจอ
                      : w.baseSpeed;
                  w.vx = Math.cos(angle) * speed;
                  w.vy = Math.sin(angle) * speed;
                  w.changeDirTimer = isScreenIdle ? 100 + Math.random() * 120 : 60 + Math.random() * 90;
                }
              }
            }

            if (w.scurryTimer > 0) {
              w.scurryTimer--;
            }

            const currentSpeed = Math.hypot(w.vx, w.vy);
            if (currentSpeed > 0.05) {
              w.legsPhase += currentSpeed * 0.45;
              w.rotation = Math.atan2(w.vy, w.vx) - Math.PI / 2;
            }

            w.x += w.vx;
            w.y += w.vy;

            // Natural herbal repellent behavior: weevils strongly dislike pungent chili, garlic, and lime
            // If weevil gets close, it flees immediately at full sprint speed ("วิ่งไปเลย"!)
            for (let hi = 0; hi < stateRef.current.herbs.length; hi++) {
              const herb = stateRef.current.herbs[hi];
              const hdx = w.x - herb.x;
              const hdy = w.y - herb.y;
              const hDist = Math.hypot(hdx, hdy);
              const repelRadius = 82 * herb.scale; // Expanded aromatic deterrence radius (~75-95px)

              if (hDist < repelRadius && hDist > 0) {
                // Panicked sprint mode: wake up from idle pause immediately and scamper rapidly away
                w.idlePauseTimer = 0;
                w.scurryTimer = Math.max(w.scurryTimer, 75);
                const angle = Math.atan2(hdy, hdx) + (Math.random() - 0.5) * 0.35;
                const urgency = 1 - hDist / repelRadius;
                const fleeSpeed = w.baseSpeed * (3.2 + urgency * 2.2); // Noticeably rapid sprint
                w.vx = Math.cos(angle) * fleeSpeed;
                w.vy = Math.sin(angle) * fleeSpeed;
                w.changeDirTimer = 55 + Math.random() * 45;

                // Subtle aromatic repellent spark if very close
                if (hDist < 38 * herb.scale && Math.random() < 0.1) {
                  createHerbSparks(herb.x, herb.y, herb.category, 1);
                }
              }
            }

            const pad = w.size;
            if (w.x < pad) {
              w.x = pad;
              w.vx *= -1;
              w.changeDirTimer = 0;
            }
            if (w.x > canvas.width - pad) {
              w.x = canvas.width - pad;
              w.vx *= -1;
              w.changeDirTimer = 0;
            }
            if (w.y < pad) {
              w.y = pad;
              w.vy *= -1;
              w.changeDirTimer = 0;
            }
            if (w.y > canvas.height - pad) {
              w.y = canvas.height - pad;
              w.vy *= -1;
              w.changeDirTimer = 0;
            }
          }

          // --- 3. Update Ghosts (Expands until 1x larger [2.0x scale] before disappearing, duration +50%) ---
          for (let i = ghosts.length - 1; i >= 0; i--) {
            const g = ghosts[i];
            // Stationary Y position (ไม่ลอยขึ้นนะ)
            g.opacity -= g.fadeSpeed;
            // ขยายใหญ่กว่าเดิม 1 เท่า (scale จาก 1.0 ถึง 2.0x) ก่อนจะหายไป
            const progress = Math.max(0, Math.min(1, 1 - g.opacity));
            g.scale = 1.0 + progress * 1.0;
            g.wingPhase += 0.18;

            // Soft glowing trail dust as the soul peacefully dissolves
            if (Math.random() < 0.22 && g.opacity > 0.12 && g.opacity < 0.9) {
              particles.push({
                x: g.x + (Math.random() - 0.5) * g.size * g.scale * 0.7,
                y: g.y + (Math.random() - 0.5) * g.size * g.scale * 0.7,
                vx: (Math.random() - 0.5) * 0.7,
                vy: (Math.random() - 0.5) * 0.7,
                size: 1.2 + Math.random() * 2.5,
                color: Math.random() > 0.4 ? '#38bdf8' : '#bae6fd',
                life: 0.7,
                decay: 0.032,
              });
            }

            if (g.opacity <= 0) {
              ghosts.splice(i, 1);
            }
          }

          // --- 4. Update Particles ---
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.91;
            p.vy *= 0.91;
            p.life -= p.decay;
            if (p.life <= 0) {
              particles.splice(i, 1);
            }
          }

          // --- 5. Update Floating Texts ---
          for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i];
            ft.y += ft.vy;
            ft.opacity -= 0.025;
            ft.scale = Math.min(1.25, ft.scale + 0.015);
            if (ft.opacity <= 0) {
              floatingTexts.splice(i, 1);
            }
          }
        }

        // --- RENDER PASS ---
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Background Rice Sack layer
        if (bgCanvas) {
          ctx.drawImage(bgCanvas, 0, 0);
        }

        // 1.5 Background herbs (nestled under foreground rice grains)
        stateRef.current.herbs
          .filter((h) => !h.isForeground && !h.isDragging)
          .forEach((h) => {
            herbEngine.drawHerb(ctx, h.frameIndex, h.x, h.y, 34 * h.scale, h.rotation);
          });

        // 2. Alive Weevils
        weevils.forEach((w) => drawWeevil(ctx, w));

        // 3. Foreground Rice grains (creates natural depth with weevils crawling under some grains!)
        if (fgCanvas) {
          ctx.drawImage(fgCanvas, 0, 0);
        }

        // 3.5 Foreground herbs (resting on top of rice grains for high visual clarity!)
        stateRef.current.herbs
          .filter((h) => h.isForeground && !h.isDragging)
          .forEach((h) => {
            herbEngine.drawHerb(ctx, h.frameIndex, h.x, h.y, 35 * h.scale, h.rotation);
          });

        // 3.8 Dragged herb (lifted above everything with elevated shadow & repellent aura)
        const draggedHerb = stateRef.current.herbs.find((h) => h.isDragging);
        if (draggedHerb) {
          drawDraggedHerb(ctx, draggedHerb);
        }

        // 4. Bran burst particles
        particles.forEach((p) => {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        // 5. Bright Ascending Ghosts (rendered above everything for 3D zoom effect)
        ghosts.forEach((g) => drawGhost(ctx, g));

        // 6. Floating Combo / Text Indicators
        floatingTexts.forEach((ft) => {
          ctx.save();
          ctx.globalAlpha = Math.max(0, ft.opacity);
          ctx.font = `bold ${Math.round(18 * ft.scale)}px 'Kanit', sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = ft.color;
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 6;
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        });
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    stateRef.current.animationFrameId = animationId;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (herbHoldRef.current && herbHoldRef.current.pointerId === 'mouse') {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        handleHerbMove(coords.x, coords.y);
      }
    };

    const handleGlobalMouseUp = () => {
      if (herbHoldRef.current && herbHoldRef.current.pointerId === 'mouse') {
        handleHerbEnd();
      }
    };

    const handleWindowResize = () => {
      resizeGame();
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      if (herbHoldRef.current?.timer) {
        clearTimeout(herbHoldRef.current.timer);
        herbHoldRef.current = null;
      }
    };
  }, [totalCount, isPaused, resizeGame, spawnWeevils, getCanvasCoords, handleHerbMove, handleHerbEnd]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block cursor-crosshair touch-none select-none z-0"
      onMouseDown={(e) => {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        if (!herbHoldRef.current) {
          checkHerbStart(coords.x, coords.y, 'mouse');
        }
        handleInput(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (herbHoldRef.current && herbHoldRef.current.pointerId === 'mouse') {
          const coords = getCanvasCoords(e.clientX, e.clientY);
          handleHerbMove(coords.x, coords.y);
        }
      }}
      onMouseUp={() => {
        if (herbHoldRef.current && herbHoldRef.current.pointerId === 'mouse') {
          handleHerbEnd();
        }
      }}
      onTouchStart={(e) => {
        // Multi-touch squashing: handle up to 4 simultaneous touch points
        const touches = e.changedTouches;
        const count = Math.min(touches.length, 4);
        for (let i = 0; i < count; i++) {
          const t = touches[i];
          const coords = getCanvasCoords(t.clientX, t.clientY);
          if (!herbHoldRef.current) {
            checkHerbStart(coords.x, coords.y, t.identifier);
          }
          handleInput(t.clientX, t.clientY);
        }
      }}
      onTouchMove={(e) => {
        if (!herbHoldRef.current) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === herbHoldRef.current.pointerId) {
            const coords = getCanvasCoords(t.clientX, t.clientY);
            handleHerbMove(coords.x, coords.y);
            break;
          }
        }
      }}
      onTouchEnd={(e) => {
        if (!herbHoldRef.current) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === herbHoldRef.current.pointerId) {
            handleHerbEnd();
            break;
          }
        }
      }}
      onTouchCancel={(e) => {
        if (!herbHoldRef.current) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier === herbHoldRef.current.pointerId) {
            handleHerbEnd();
            break;
          }
        }
      }}
    />
  );
};
