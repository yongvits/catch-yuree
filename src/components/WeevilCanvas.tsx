import React, { useEffect, useRef, useCallback } from 'react';
import { RiceGrain, Weevil, Ghost, Particle, FloatingText, HerbItem, RitualEffect } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { spriteEngine } from '../utils/spriteEngine';
import { herbEngine } from '../utils/herbEngine';
import { Language } from '../i18n/translations';
import {
  detectHerbFormations,
  getWeevilsInsideCircle,
  getWeevilsInYBlast,
  CircleFormationResult,
  YFormationResult,
} from '../utils/herbFormations';

interface HudRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

interface WeevilCanvasProps {
  totalCount: number;
  isPaused?: boolean;
  language?: Language;
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
  language = 'en',
  ascendedText = 'Ascended ✨',
  comboPrefix = 'Combo x',
  onCountChange,
  onVictory,
  onHit,
  onMiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hudRectsRef = useRef<HudRect[]>([]);
  const frameCounterRef = useRef(0);
  const movedHerbIdsRef = useRef<Set<number>>(new Set());
  const herbCooldownRef = useRef<Map<number, number>>(new Map());
  const armedCircleRef = useRef<CircleFormationResult | null>(null);
  const languageRef = useRef<Language>(language);
  languageRef.current = language;

  // References for mutable game state
  const stateRef = useRef({
    weevils: [] as Weevil[],
    ghosts: [] as Ghost[],
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    ritualEffects: [] as RitualEffect[],
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

  // Measure [data-hud-zone="true"] elements in canvas coordinates so weevils stay clear of score/HUD
  const refreshHudRects = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    if (cRect.width <= 0 || cRect.height <= 0) return;
    const scaleX = canvas.width / cRect.width;
    const scaleY = canvas.height / cRect.height;

    const nodes = document.querySelectorAll<HTMLElement>('[data-hud-zone="true"]');
    const rects: HudRect[] = [];
    nodes.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        rects.push({
          left: (r.left - cRect.left) * scaleX,
          top: (r.top - cRect.top) * scaleY,
          right: (r.right - cRect.left) * scaleX,
          bottom: (r.bottom - cRect.top) * scaleY,
        });
      }
    });
    hudRectsRef.current = rects;
  }, []);

  // Multi-touch reference for dragging chili, garlic, and kaffir lime leaf simultaneously
  const activeHerbHoldsRef = useRef<
    Map<
      number | 'mouse',
      {
        herbId: number;
        pointerId: number | 'mouse';
        startX: number;
        startY: number;
        offsetX: number;
        offsetY: number;
        timer: number | null;
        isDragging: boolean;
      }
    >
  >(new Map());

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

  // 1.5 Generate scattered herbs (Chili, Kaffir Lime, Garlic) with unique sprites & balanced categories
  const generateHerbs = useCallback((width: number, height: number) => {
    refreshHudRects();
    const items: HerbItem[] = [];
    const count = Math.max(9, Math.min(12, Math.floor((width * height) / 68000) + 6));
    const pad = 58;

    const shuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const chiliFrames = shuffle([0, 1, 2, 3]);
    const limeFrames = shuffle([4, 5, 6, 7]);
    const garlicFrames = shuffle([8, 9, 10, 11]);

    // Round-robin balanced deal with 100% unique frameIndex sprites (up to 4 of each category)
    const herbPool: { frame: number; cat: 'chili' | 'lime' | 'garlic'; baseScale: number }[] = [];
    for (let i = 0; i < count; i++) {
      const slot = Math.floor(i / 3);
      const kind = i % 3;
      if (kind === 0) {
        herbPool.push({ frame: chiliFrames[slot], cat: 'chili', baseScale: 0.92 + Math.random() * 0.2 });
      } else if (kind === 1) {
        herbPool.push({ frame: limeFrames[slot], cat: 'lime', baseScale: 0.95 + Math.random() * 0.2 });
      } else {
        herbPool.push({ frame: garlicFrames[slot], cat: 'garlic', baseScale: 0.88 + Math.random() * 0.2 });
      }
    }

    const hudRects = hudRectsRef.current;

    for (let i = 0; i < herbPool.length; i++) {
      const hInfo = herbPool[i];
      let hx = 0;
      let hy = 0;
      let attempts = 0;
      let tooClose = true;

      while (tooClose && attempts < 180) {
        hx = pad + Math.random() * Math.max(20, width - pad * 2);
        hy = pad + Math.random() * Math.max(20, height - pad * 2);
        tooClose = false;

        for (let hi = 0; hi < hudRects.length; hi++) {
          const hr = hudRects[hi];
          if (hx >= hr.left - 34 && hx <= hr.right + 34 && hy >= hr.top - 34 && hy <= hr.bottom + 34) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) {
          attempts++;
          continue;
        }

        for (let j = 0; j < items.length; j++) {
          const other = items[j];
          if (Math.hypot(hx - other.x, hy - other.y) < 95) {
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
        vx: 0,
        vy: 0,
        rotation: Math.random() * Math.PI * 2,
        scale: hInfo.baseScale,
        frameIndex: hInfo.frame,
        category: hInfo.cat,
        isForeground: i % 2 === 0, // Half nestled in background under grains, half resting on top!
      });
    }

    stateRef.current.herbs = items;
    movedHerbIdsRef.current.clear();
    herbCooldownRef.current.clear();
    armedCircleRef.current = null;
  }, [refreshHudRects]);

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

  // 4. Spawn weevils with non-overlapping initial distribution (away from edges & score HUD)
  const spawnWeevils = useCallback((count: number) => {
    refreshHudRects();
    const canvas = canvasRef.current;
    const w = canvas && canvas.width > 0 ? canvas.width : window.innerWidth;
    const h = canvas && canvas.height > 0 ? canvas.height : window.innerHeight;
    const edgePadding = Math.min(58, Math.min(w, h) * 0.16);
    const hudRects = hudRectsRef.current;

    const playableArea = Math.max(1000, (w - edgePadding * 2) * (h - edgePadding * 2));
    let minDistance = Math.sqrt(playableArea / count) * 0.85;
    minDistance = Math.min(minDistance, 100);

    const newWeevils: Weevil[] = [];

    for (let i = 0; i < count; i++) {
      let spawnX = 0;
      let spawnY = 0;
      let attempts = 0;
      let tooClose = true;

      while (tooClose && attempts < 240) {
        spawnX = edgePadding + Math.random() * Math.max(20, w - edgePadding * 2);
        spawnY = edgePadding + Math.random() * Math.max(20, h - edgePadding * 2);
        tooClose = false;

        // Avoid spawning inside or near HUD score/timer elements
        for (let hi = 0; hi < hudRects.length; hi++) {
          const hr = hudRects[hi];
          if (
            spawnX >= hr.left - 36 &&
            spawnX <= hr.right + 36 &&
            spawnY >= hr.top - 36 &&
            spawnY <= hr.bottom + 36
          ) {
            tooClose = true;
            break;
          }
        }
        if (tooClose) {
          attempts++;
          continue;
        }

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
    stateRef.current.ritualEffects = [];
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
  }, [onCountChange, refreshHudRects]);

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

    // --- 2. TRANSLUCENT ANGELIC FAIRY WINGS (ปีกขนาดกะทัดรัด น่ารัก เล็กลง 1 เท่า สมดุลกับตัวมอด) ---
    // The weevil sprite body rendered width is ~size * 2.8
    const bodyWidth = size * 2.8;
    const wingWiggle = Math.sin(g.wingPhase) * 0.32;
    const wingSpan = bodyWidth * 0.68; // ปีกเล็กลง 1 เท่า (กะทัดรัด น่ารัก พอดีตัว)
    const wingAttachX = bodyWidth * 0.28; // ตำแหน่งโคนปีกชิดลำตัวพอดี
    const wingAttachY = -size * 0.12; // เยื้องไปทางหัวเล็กน้อย

    // Left Wing (Attached on left side of body, spreading gracefully outwards toward head)
    ctx.save();
    ctx.translate(-wingAttachX, wingAttachY);
    ctx.rotate(-(Math.PI - 0.55) + wingWiggle);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.58 * smoothAlpha})`;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.95 * smoothAlpha})`;
    ctx.lineWidth = bodyWidth * 0.028;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = Math.round(18 * smoothAlpha);

    // Primary wing blade
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.48, 0, wingSpan * 0.52, wingSpan * 0.26, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Secondary fairy winglet lobe
    ctx.fillStyle = `rgba(125, 211, 252, ${0.42 * smoothAlpha})`;
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.38, wingSpan * 0.16, wingSpan * 0.38, wingSpan * 0.19, 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner glowing wing veins
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.85 * smoothAlpha})`;
    ctx.lineWidth = bodyWidth * 0.015;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingSpan * 0.3, -wingSpan * 0.06, wingSpan * 0.88, 0);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingSpan * 0.25, wingSpan * 0.08, wingSpan * 0.65, wingSpan * 0.16);
    ctx.stroke();
    ctx.restore();

    // Right Wing (Attached on right side of body, spreading gracefully outwards toward head)
    ctx.save();
    ctx.translate(wingAttachX, wingAttachY);
    ctx.rotate(-0.55 - wingWiggle);
    ctx.fillStyle = `rgba(56, 189, 248, ${0.58 * smoothAlpha})`;
    ctx.strokeStyle = `rgba(186, 230, 253, ${0.95 * smoothAlpha})`;
    ctx.lineWidth = bodyWidth * 0.028;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = Math.round(18 * smoothAlpha);

    // Primary wing blade
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.48, 0, wingSpan * 0.52, wingSpan * 0.26, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Secondary fairy winglet lobe
    ctx.fillStyle = `rgba(125, 211, 252, ${0.42 * smoothAlpha})`;
    ctx.beginPath();
    ctx.ellipse(wingSpan * 0.38, -wingSpan * 0.16, wingSpan * 0.38, wingSpan * 0.19, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner glowing wing veins
    ctx.strokeStyle = `rgba(240, 249, 255, ${0.85 * smoothAlpha})`;
    ctx.lineWidth = bodyWidth * 0.015;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingSpan * 0.3, wingSpan * 0.06, wingSpan * 0.88, 0);
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(wingSpan * 0.25, -wingSpan * 0.08, wingSpan * 0.65, -wingSpan * 0.16);
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
    const repelRadius = 54 * h.scale;
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

  // 8. Add floating text on hit/combo/ritual
  const addFloatingText = (x: number, y: number, text: string, color = '#fef08a') => {
    stateRef.current.floatingTexts.push({
      id: Math.random(),
      x,
      y: y - 10,
      text,
      color,
      opacity: 1,
      scale: 1.1,
      vy: -1.1,
    });
  };

  // Shared elimination helper for single squish or multi-bug Y-bomb / Circle capture
  const eliminateWeevil = useCallback(
    (w: Weevil, now: number, playIndividualAudio = true) => {
      if (w.isDying) return false;
      w.isDying = true;
      w.opacity = 0.65;
      w.vx = 0;
      w.vy = 0;

      createSquishParticles(w.x, w.y);

      if (playIndividualAudio) {
        soundManager.playSquish();
      }

      if (now - stateRef.current.lastHitTime < 1400) {
        stateRef.current.combo++;
      } else {
        stateRef.current.combo = 1;
      }
      stateRef.current.lastHitTime = now;
      if (stateRef.current.combo > stateRef.current.maxCombo) {
        stateRef.current.maxCombo = stateRef.current.combo;
      }

      if (playIndividualAudio && stateRef.current.combo > 1) {
        soundManager.playCombo(stateRef.current.combo);
      }

      stateRef.current.ghostIdCounter++;
      stateRef.current.ghosts.push({
        id: stateRef.current.ghostIdCounter,
        x: w.x,
        y: w.y,
        frameIndex: Math.floor(w.legsPhase) % 8,
        floatSpeed: 0.95 + Math.random() * 0.25,
        zoomSpeed: 0.011,
        scale: 1.0,
        rotation: w.rotation,
        opacity: 1.0,
        fadeSpeed: 0.011,
        wavePhase: Math.random() * Math.PI,
        wingPhase: Math.random() * 10,
        size: w.size,
      });

      if (playIndividualAudio) {
        const pitchFactor = 1.0 + Math.min(stateRef.current.combo * 0.05, 0.4);
        soundManager.playGhost(pitchFactor);
      }

      stateRef.current.remainingCount = Math.max(0, stateRef.current.remainingCount - 1);
      stateRef.current.successfulHits++;

      onHit?.(stateRef.current.combo);
      onCountChange(stateRef.current.remainingCount, stateRef.current.totalCount);

      if (stateRef.current.remainingCount <= 0 && !stateRef.current.isVictoryTriggered) {
        stateRef.current.isVictoryTriggered = true;
        const elapsed = (performance.now() - stateRef.current.startTime) / 1000;
        const accuracy = Math.min(
          100,
          Math.round((stateRef.current.successfulHits / Math.max(stateRef.current.totalTaps, 1)) * 100)
        );
        soundManager.playVictory();
        setTimeout(() => {
          onVictory(elapsed, stateRef.current.maxCombo, accuracy);
        }, 700);
      }

      return true;
    },
    [onCountChange, onHit, onVictory]
  );

  // Trigger Y-Shape Herb Explosion across blast radius
  const triggerYExplosion = useCallback(
    (yForm: YFormationResult) => {
      const now = performance.now();
      const targets = getWeevilsInYBlast(yForm, stateRef.current.weevils);

      // Fiery explosion shockwave & Y-rune flash
      stateRef.current.ritualEffects.push({
        kind: 'y',
        x: yForm.center.x,
        y: yForm.center.y,
        radius: yForm.blastRadius,
        progress: 0,
        points: yForm.tips,
        junction: yForm.junction,
      });

      // Explosive fiery embers across the blast radius
      const fireColors = ['#f97316', '#ef4444', '#facc15', '#fef08a', '#fb923c', '#ffffff'];
      for (let i = 0; i < 48; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 10;
        stateRef.current.particles.push({
          x: yForm.center.x + (Math.random() - 0.5) * 24,
          y: yForm.center.y + (Math.random() - 0.5) * 24,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2.5 + Math.random() * 4.5,
          color: fireColors[Math.floor(Math.random() * fireColors.length)],
          life: 1.0,
          decay: 0.02 + Math.random() * 0.02,
        });
      }

      soundManager.playYExplosion();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([45, 30, 75]);
        } catch {
          // ignore
        }
      }

      let killed = 0;
      if (targets.length > 0) {
        stateRef.current.totalTaps += targets.length;
        targets.forEach((w) => {
          if (eliminateWeevil(w, now, false)) killed++;
        });
        soundManager.playGhost(1.15);
      }

      const label =
        killed > 0
          ? languageRef.current === 'th'
            ? `ระเบิดตัว Y! 💥 กำจัด ${killed} ตัว`
            : `Y-BOMB! 💥 x${killed}`
          : languageRef.current === 'th'
          ? 'ระเบิดตัว Y! 💥'
          : 'Y-BOMB! 💥';
      addFloatingText(yForm.center.x, yForm.center.y - 16, label, '#fde047');

      // Recoil Y-herbs smoothly outward & put on short cooldown so they don't immediately re-detonate
      const cooldownEnd = now + 1650;
      yForm.herbs.forEach((h) => {
        herbCooldownRef.current.set(h.id, cooldownEnd);
        const angle = Math.atan2(h.y - yForm.center.y, h.x - yForm.center.x) + (Math.random() - 0.5) * 0.35;
        const kick = 8 + Math.random() * 4;
        h.vx = Math.cos(angle) * kick;
        h.vy = Math.sin(angle) * kick;
        createHerbSparks(h.x, h.y, h.category, 6);
      });

      armedCircleRef.current = null;
    },
    [eliminateWeevil]
  );

  // Trigger Circle Herb Trap eliminating all enclosed weevils simultaneously
  const triggerCircleTrap = useCallback(
    (circle: CircleFormationResult, targets: Weevil[]) => {
      const now = performance.now();

      stateRef.current.ritualEffects.push({
        kind: 'circle',
        x: circle.center.x,
        y: circle.center.y,
        radius: circle.radius,
        progress: 0,
        points: circle.orderedPoints,
      });

      // Mystic emerald-cyan capture sparks
      const trapColors = ['#34d399', '#38bdf8', '#a7f3d0', '#fde047', '#ffffff'];
      for (let i = 0; i < 42; i++) {
        const angle = (i / 42) * Math.PI * 2;
        const speed = 2.5 + Math.random() * 5.5;
        stateRef.current.particles.push({
          x: circle.center.x + Math.cos(angle) * circle.radius * 0.65,
          y: circle.center.y + Math.sin(angle) * circle.radius * 0.65,
          vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -0.7),
          vy: Math.sin(angle) * speed * (Math.random() > 0.5 ? 1 : -0.7),
          size: 2.2 + Math.random() * 3.8,
          color: trapColors[Math.floor(Math.random() * trapColors.length)],
          life: 1.0,
          decay: 0.022 + Math.random() * 0.02,
        });
      }

      soundManager.playCircleSeal();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([30, 25, 55]);
        } catch {
          // ignore
        }
      }

      let killed = 0;
      if (targets.length > 0) {
        stateRef.current.totalTaps += targets.length;
        targets.forEach((w) => {
          if (eliminateWeevil(w, now, false)) killed++;
        });
        soundManager.playGhost(1.1);
      }

      const label =
        languageRef.current === 'th'
          ? `วงกลมจับมอด! ✨ กำจัด ${killed} ตัว`
          : `CIRCLE TRAP! ✨ x${killed}`;
      addFloatingText(circle.center.x, circle.center.y - 12, label, '#6ee7b7');

      // Gentle outward scatter & cooldown so circle doesn't repeat on the spot
      const cooldownEnd = now + 1650;
      circle.herbs.forEach((h) => {
        herbCooldownRef.current.set(h.id, cooldownEnd);
        const angle = Math.atan2(h.y - circle.center.y, h.x - circle.center.x) + (Math.random() - 0.5) * 0.25;
        const kick = 6 + Math.random() * 3;
        h.vx = Math.cos(angle) * kick;
        h.vy = Math.sin(angle) * kick;
        createHerbSparks(h.x, h.y, h.category, 6);
      });

      armedCircleRef.current = null;
    },
    [eliminateWeevil]
  );

  // 9. Input detection (Touch / Click)
  const handleInput = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || stateRef.current.isVictoryTriggered) return;

      const rect = canvas.getBoundingClientRect();
      const tapX = (clientX - rect.left) * (canvas.width / rect.width);
      const tapY = (clientY - rect.top) * (canvas.height / rect.height);

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
          stateRef.current.totalTaps++;
          eliminateWeevil(w, now, true);
          hitDetected = true;
          break;
        }
      }

      // Check if tap landed directly on an herb item (don't penalize combo or startle bugs if grabbing an herb!)
      let tappedHerb = false;
      stateRef.current.herbs.forEach((h) => {
        const dist = Math.hypot(h.x - tapX, h.y - tapY);
        if (dist < 44 * h.scale) {
          tappedHerb = true;
          createHerbSparks(h.x, h.y, h.category, 6);
        }
      });

      // Missed: weevils within radius get startled and scurry away!
      if (!hitDetected && !tappedHerb) {
        stateRef.current.totalTaps++;
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
    },
    [eliminateWeevil, onMiss]
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
        const pad = Math.min(Math.max(52, w.size * 3.2), Math.min(width, height) * 0.16);
        w.x = Math.max(pad, Math.min(width - pad, w.x));
        w.y = Math.max(pad, Math.min(height - pad, w.y));
      });
    }
    refreshHudRects();
  }, [generateRiceGrains, generateHerbs, renderOffscreenRice, refreshHudRects]);

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

  // Check if pointer pressed on an herb to start long-press hold (supports multiple simultaneous fingers)
  const checkHerbStart = useCallback(
    (canvasX: number, canvasY: number, pointerId: number | 'mouse') => {
      // Prevent picking an herb already held by another finger
      const busyHerbIds = new Set<number>();
      activeHerbHoldsRef.current.forEach((hold) => {
        busyHerbIds.add(hold.herbId);
      });

      const herbs = stateRef.current.herbs;
      let closestHerb: HerbItem | null = null;
      let minDist = Infinity;

      for (let i = herbs.length - 1; i >= 0; i--) {
        const h = herbs[i];
        if (busyHerbIds.has(h.id)) continue;
        const dist = Math.hypot(h.x - canvasX, h.y - canvasY);
        const grabRadius = Math.max(55, 62 * h.scale); // Generous grab area for fingers
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
          const hold = activeHerbHoldsRef.current.get(pointerId);
          if (hold && hold.herbId === targetId) {
            hold.isDragging = true;
            const target = stateRef.current.herbs.find((h) => h.id === targetId);
            if (target) {
              target.isDragging = true;
              target.vx = 0;
              target.vy = 0;
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
        }, 115); // Snappy 115ms hold for effortless multi-finger arranging

        activeHerbHoldsRef.current.set(pointerId, {
          herbId: targetId,
          pointerId,
          startX: canvasX,
          startY: canvasY,
          offsetX,
          offsetY,
          timer,
          isDragging: false,
        });
      }
    },
    []
  );

  // Dragging herb (supports multi-touch simultaneously) & live Y/Circle preview
  const handleHerbMove = useCallback((canvasX: number, canvasY: number, pointerId: number | 'mouse') => {
    const hold = activeHerbHoldsRef.current.get(pointerId);
    if (!hold) return;

    if (!hold.isDragging) {
      if (Math.hypot(canvasX - hold.startX, canvasY - hold.startY) > 36) {
        if (hold.timer) clearTimeout(hold.timer);
        activeHerbHoldsRef.current.delete(pointerId);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const herb = stateRef.current.herbs.find((h) => h.id === hold.herbId);
    if (herb) {
      const pad = 38;
      herb.x = Math.max(pad, Math.min(canvas.width - pad, canvasX - hold.offsetX));
      herb.y = Math.max(pad, Math.min(canvas.height - pad, canvasY - hold.offsetY));
      herb.vx = 0;
      herb.vy = 0;
      movedHerbIdsRef.current.add(herb.id);
      stateRef.current.lastActivityTime = performance.now();

      if (Math.random() < 0.22) {
        createHerbSparks(herb.x, herb.y, herb.category, 1);
      }
    }
  }, []);

  // Dropping herb (supports multi-touch) -> detect Y-Bomb or Circle Capture
  const handleHerbEnd = useCallback(
    (pointerId: number | 'mouse') => {
      const hold = activeHerbHoldsRef.current.get(pointerId);
      if (!hold) return;

      if (hold.timer) {
        clearTimeout(hold.timer);
      }

      if (hold.isDragging) {
        const herb = stateRef.current.herbs.find((h) => h.id === hold.herbId);
        if (herb) {
          herb.isDragging = false;
          movedHerbIdsRef.current.add(herb.id);
          soundManager.playHerbDrop();
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try {
              navigator.vibrate(20);
            } catch {
              // ignore
            }
          }
          createHerbSparks(herb.x, herb.y, herb.category, 8);

          // Check if player just completed a Circle Trap or Y-Shape Explosion
          const { bestCircle, bestY } = detectHerbFormations(
            stateRef.current.herbs,
            movedHerbIdsRef.current,
            {
              focusHerbId: herb.id,
              cooldownUntil: herbCooldownRef.current,
            }
          );

          if (bestCircle) {
            const trapped = getWeevilsInsideCircle(bestCircle, stateRef.current.weevils);
            if (trapped.length > 0) {
              triggerCircleTrap(bestCircle, trapped);
            } else {
              // Keep secret circle trap armed silently until a weevil steps inside!
              armedCircleRef.current = bestCircle;
            }
          } else if (bestY) {
            triggerYExplosion(bestY);
          }
        }
      }

      activeHerbHoldsRef.current.delete(pointerId);
    },
    [triggerCircleTrap, triggerYExplosion]
  );

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

            // Natural herbal repellent behavior: weevils dislike chili, garlic, and lime
            // Tightened slightly while dragging so players can encircle bugs cleanly
            for (let hi = 0; hi < stateRef.current.herbs.length; hi++) {
              const herb = stateRef.current.herbs[hi];
              const hdx = w.x - herb.x;
              const hdy = w.y - herb.y;
              const hDist = Math.hypot(hdx, hdy);
              const repelRadius = (herb.isDragging ? 52 : 64) * herb.scale;

              if (hDist < repelRadius && hDist > 0) {
                w.idlePauseTimer = 0;
                w.scurryTimer = Math.max(w.scurryTimer, 65);
                const angle = Math.atan2(hdy, hdx) + (Math.random() - 0.5) * 0.3;
                const urgency = 1 - hDist / repelRadius;
                const fleeSpeed = w.baseSpeed * (2.6 + urgency * 1.8);
                w.vx = Math.cos(angle) * fleeSpeed;
                w.vy = Math.sin(angle) * fleeSpeed;
                w.changeDirTimer = 50 + Math.random() * 40;

                if (hDist < 34 * herb.scale && Math.random() < 0.08) {
                  createHerbSparks(herb.x, herb.y, herb.category, 1);
                }
              }
            }

            // 1. Stay clearly away from all 4 screen edges (ห้ามเดินชิดขอบจอ)
            const edgePad = Math.min(
              Math.max(54, w.size * 3.4),
              Math.min(canvas.width, canvas.height) * 0.18
            );
            const steerMargin = 18;

            // Gentle inward steering near screen border so movement looks natural
            if (w.x < edgePad + steerMargin && w.vx < 0) w.vx += 0.08;
            if (w.x > canvas.width - edgePad - steerMargin && w.vx > 0) w.vx -= 0.08;
            if (w.y < edgePad + steerMargin && w.vy < 0) w.vy += 0.08;
            if (w.y > canvas.height - edgePad - steerMargin && w.vy > 0) w.vy -= 0.08;

            if (w.x < edgePad) {
              w.x = edgePad;
              w.vx = Math.abs(w.vx) || w.baseSpeed;
              w.changeDirTimer = Math.min(w.changeDirTimer, 15);
            }
            if (w.x > canvas.width - edgePad) {
              w.x = canvas.width - edgePad;
              w.vx = -(Math.abs(w.vx) || w.baseSpeed);
              w.changeDirTimer = Math.min(w.changeDirTimer, 15);
            }
            if (w.y < edgePad) {
              w.y = edgePad;
              w.vy = Math.abs(w.vy) || w.baseSpeed;
              w.changeDirTimer = Math.min(w.changeDirTimer, 15);
            }
            if (w.y > canvas.height - edgePad) {
              w.y = canvas.height - edgePad;
              w.vy = -(Math.abs(w.vy) || w.baseSpeed);
              w.changeDirTimer = Math.min(w.changeDirTimer, 15);
            }

            // 2. Stay clear of score / timer / HUD interface zones (ห้ามเดินชิด interface score)
            const hudPad = Math.max(30, w.size * 2.1);
            const hudRects = hudRectsRef.current;
            for (let hi = 0; hi < hudRects.length; hi++) {
              const hr = hudRects[hi];
              const fLeft = hr.left - hudPad;
              const fTop = hr.top - hudPad;
              const fRight = hr.right + hudPad;
              const fBottom = hr.bottom + hudPad;

              if (w.x > fLeft && w.x < fRight && w.y > fTop && w.y < fBottom) {
                const penLeft = fLeft >= edgePad ? w.x - fLeft : Infinity;
                const penRight = fRight <= canvas.width - edgePad ? fRight - w.x : Infinity;
                const penTop = fTop >= edgePad ? w.y - fTop : Infinity;
                const penBottom = fBottom <= canvas.height - edgePad ? fBottom - w.y : Infinity;

                const minPen = Math.min(penLeft, penRight, penTop, penBottom);
                if (minPen === penBottom) {
                  w.y = fBottom;
                  w.vy = Math.abs(w.vy) || w.baseSpeed;
                } else if (minPen === penRight) {
                  w.x = fRight;
                  w.vx = Math.abs(w.vx) || w.baseSpeed;
                } else if (minPen === penLeft) {
                  w.x = fLeft;
                  w.vx = -(Math.abs(w.vx) || w.baseSpeed);
                } else if (minPen === penTop) {
                  w.y = fTop;
                  w.vy = -(Math.abs(w.vy) || w.baseSpeed);
                }
                w.changeDirTimer = Math.min(w.changeDirTimer, 15);
              }
            }
          }

          // Update Herb recoil velocities & check armed Circle Trap
          const nowTs = performance.now();
          stateRef.current.herbs.forEach((h) => {
            if (!h.isDragging && ((h.vx && Math.abs(h.vx) > 0.05) || (h.vy && Math.abs(h.vy) > 0.05))) {
              h.x += h.vx || 0;
              h.y += h.vy || 0;
              h.vx = (h.vx || 0) * 0.84;
              h.vy = (h.vy || 0) * 0.84;

              const herbPad = 48;
              h.x = Math.max(herbPad, Math.min(canvas.width - herbPad, h.x));
              h.y = Math.max(herbPad, Math.min(canvas.height - herbPad, h.y));

              // Keep bounced herbs out of top-left HUD score zone
              const hudRects = hudRectsRef.current;
              for (let hi = 0; hi < hudRects.length; hi++) {
                const hr = hudRects[hi];
                if (h.x > hr.left - 30 && h.x < hr.right + 30 && h.y > hr.top - 30 && h.y < hr.bottom + 30) {
                  h.y = Math.min(canvas.height - herbPad, hr.bottom + 32);
                  h.vy = Math.abs(h.vy || 0);
                }
              }
            }
          });

          // If an empty Circle Trap is armed, fire automatically as soon as any weevil enters it
          if (armedCircleRef.current && !stateRef.current.isVictoryTriggered) {
            const armed = armedCircleRef.current;
            const allClear = armed.herbs.every(
              (h) => !h.isDragging && (herbCooldownRef.current.get(h.id) ?? 0) <= nowTs
            );
            if (!allClear) {
              armedCircleRef.current = null;
            } else {
              const trapped = getWeevilsInsideCircle(armed, weevils);
              if (trapped.length > 0) {
                triggerCircleTrap(armed, trapped);
              }
            }
          }

          // Update Ritual Shockwave / Magic Ring effects
          for (let i = stateRef.current.ritualEffects.length - 1; i >= 0; i--) {
            const ef = stateRef.current.ritualEffects[i];
            ef.progress += ef.kind === 'y' ? 0.032 : 0.036;
            if (ef.progress >= 1) {
              stateRef.current.ritualEffects.splice(i, 1);
            }
          }

          // --- 3. Update Ghosts (ตัวใหญ่ขึ้นมาอีก 2 เท่า และลอยขึ้นสู่เบื้องบน) ---
          for (let i = ghosts.length - 1; i >= 0; i--) {
            const g = ghosts[i];
            g.y -= g.floatSpeed; // ลอยขึ้น
            g.wavePhase += 0.026;
            g.x += Math.sin(g.wavePhase) * 0.32; // พริ้วไหวเบา ๆ ขณะลอยขึ้น
            g.opacity -= g.fadeSpeed;
            // ตัวใหญ่ขึ้นมาอีก 2 เท่า (ขยายตัวขึ้นเป็น ~3.2 เท่า) ก่อนจะหายไป
            const progress = Math.max(0, Math.min(1, 1 - g.opacity));
            g.scale = 1.0 + progress * 2.2;
            g.wingPhase += 0.18;

            // Soft glowing trail dust as the soul peacefully dissolves
            if (Math.random() < 0.22 && g.opacity > 0.12 && g.opacity < 0.9) {
              particles.push({
                x: g.x + (Math.random() - 0.5) * g.size * g.scale * 0.7,
                y: g.y + (Math.random() - 0.5) * g.size * g.scale * 0.7,
                vx: (Math.random() - 0.5) * 0.7,
                vy: (Math.random() - 0.5) * 0.7 - 0.25,
                size: 1.2 + Math.random() * 2.5,
                color: Math.random() > 0.4 ? '#38bdf8' : '#bae6fd',
                life: 0.7,
                decay: 0.032,
              });
            }

            if (g.opacity <= 0 || g.y < -120) {
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

        // Periodically refresh HUD bounds so score/expanded menu changes stay synchronized
        frameCounterRef.current++;
        if (frameCounterRef.current % 20 === 1) {
          refreshHudRects();
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

        // 3.7 Triggered Ritual Effects (Y-Bomb Blast Wave & Circle Seal Vortex)
        stateRef.current.ritualEffects.forEach((ef) => {
          const alpha = Math.max(0, 1 - ef.progress);
          const easeOut = 1 - Math.pow(1 - ef.progress, 3);
          ctx.save();
          if (ef.kind === 'y') {
            const curR = ef.radius * (0.2 + 0.92 * easeOut);
            const blastGrad = ctx.createRadialGradient(ef.x, ef.y, curR * 0.1, ef.x, ef.y, curR);
            blastGrad.addColorStop(0, `rgba(254, 240, 138, ${0.55 * alpha})`);
            blastGrad.addColorStop(0.55, `rgba(249, 115, 22, ${0.42 * alpha})`);
            blastGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = blastGrad;
            ctx.beginPath();
            ctx.arc(ef.x, ef.y, curR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(253, 224, 71, ${0.95 * alpha})`;
            ctx.lineWidth = Math.max(2, 10 * alpha);
            ctx.shadowColor = '#f97316';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(ef.x, ef.y, curR, 0, Math.PI * 2);
            ctx.stroke();

            if (ef.junction) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * alpha})`;
              ctx.lineWidth = Math.max(2, 7 * alpha);
              ef.points.forEach((tip) => {
                ctx.beginPath();
                ctx.moveTo(ef.junction!.x, ef.junction!.y);
                ctx.lineTo(tip.x, tip.y);
                ctx.stroke();
              });
            }
          } else {
            const curR = ef.radius * (1.08 - 0.15 * ef.progress);
            const sealGrad = ctx.createRadialGradient(ef.x, ef.y, 4, ef.x, ef.y, curR);
            sealGrad.addColorStop(0, `rgba(110, 231, 183, ${0.55 * alpha})`);
            sealGrad.addColorStop(0.7, `rgba(56, 189, 248, ${0.35 * alpha})`);
            sealGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = sealGrad;
            ctx.beginPath();
            ctx.arc(ef.x, ef.y, curR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(110, 231, 183, ${0.95 * alpha})`;
            ctx.lineWidth = Math.max(2, 8 * alpha);
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.arc(ef.x, ef.y, curR, 0, Math.PI * 2);
            ctx.stroke();

            if (ef.points.length >= 3) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * alpha})`;
              ctx.lineWidth = Math.max(1.5, 4 * alpha);
              ctx.beginPath();
              ctx.moveTo(ef.points[0].x, ef.points[0].y);
              for (let pi = 1; pi < ef.points.length; pi++) {
                ctx.lineTo(ef.points[pi].x, ef.points[pi].y);
              }
              ctx.closePath();
              ctx.stroke();
            }
          }
          ctx.restore();
        });

        // 3.8 Dragged herbs (lifted above everything with elevated shadow & repellent aura, supports multi-touch)
        stateRef.current.herbs
          .filter((h) => h.isDragging)
          .forEach((dh) => {
            drawDraggedHerb(ctx, dh);
          });

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
      if (activeHerbHoldsRef.current.has('mouse')) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        handleHerbMove(coords.x, coords.y, 'mouse');
      }
    };

    const handleGlobalMouseUp = () => {
      if (activeHerbHoldsRef.current.has('mouse')) {
        handleHerbEnd('mouse');
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (activeHerbHoldsRef.current.size > 0) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (activeHerbHoldsRef.current.has(t.identifier)) {
            const coords = getCanvasCoords(t.clientX, t.clientY);
            handleHerbMove(coords.x, coords.y, t.identifier);
          }
        }
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (activeHerbHoldsRef.current.size > 0) {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (activeHerbHoldsRef.current.has(t.identifier)) {
            handleHerbEnd(t.identifier);
          }
        }
      }
    };

    const handleWindowResize = () => {
      resizeGame();
    };

    window.addEventListener('resize', handleWindowResize);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: true });
    window.addEventListener('touchend', handleGlobalTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleGlobalTouchEnd, { passive: true });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleWindowResize);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
      activeHerbHoldsRef.current.forEach((hold) => {
        if (hold.timer) clearTimeout(hold.timer);
      });
      activeHerbHoldsRef.current.clear();
    };
  }, [totalCount, isPaused, resizeGame, spawnWeevils, getCanvasCoords, handleHerbMove, handleHerbEnd, refreshHudRects, triggerCircleTrap]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block cursor-crosshair touch-none select-none z-0"
      onMouseDown={(e) => {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        checkHerbStart(coords.x, coords.y, 'mouse');
        handleInput(e.clientX, e.clientY);
      }}
      onMouseMove={(e) => {
        if (activeHerbHoldsRef.current.has('mouse')) {
          const coords = getCanvasCoords(e.clientX, e.clientY);
          handleHerbMove(coords.x, coords.y, 'mouse');
        }
      }}
      onMouseUp={() => {
        if (activeHerbHoldsRef.current.has('mouse')) {
          handleHerbEnd('mouse');
        }
      }}
      onTouchStart={(e) => {
        // Multi-touch squashing & multi-object dragging
        const touches = e.changedTouches;
        const count = Math.min(touches.length, 4);
        for (let i = 0; i < count; i++) {
          const t = touches[i];
          const coords = getCanvasCoords(t.clientX, t.clientY);
          checkHerbStart(coords.x, coords.y, t.identifier);
          handleInput(t.clientX, t.clientY);
        }
      }}
      onTouchMove={(e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (activeHerbHoldsRef.current.has(t.identifier)) {
            const coords = getCanvasCoords(t.clientX, t.clientY);
            handleHerbMove(coords.x, coords.y, t.identifier);
          }
        }
      }}
      onTouchEnd={(e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (activeHerbHoldsRef.current.has(t.identifier)) {
            handleHerbEnd(t.identifier);
          }
        }
      }}
      onTouchCancel={(e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (activeHerbHoldsRef.current.has(t.identifier)) {
            handleHerbEnd(t.identifier);
          }
        }
      }}
    />
  );
};
