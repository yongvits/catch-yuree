import React, { useEffect, useRef, useCallback } from 'react';
import { RiceGrain, Weevil, Ghost, Particle, FloatingText } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { spriteEngine } from '../utils/spriteEngine';

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
  });

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

      newWeevils.push({
        id: i + 1,
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        baseSpeed: 0.35 + Math.random() * 0.55,
        scurryTimer: 0,
        size: 13 + Math.random() * 4,
        rotation: Math.random() * Math.PI * 2,
        legsPhase: Math.random() * 100,
        opacity: 1,
        isDying: false,
        scale: 1,
        changeDirTimer: Math.random() * 100,
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
    ctx.globalAlpha = Math.max(0, Math.min(1, g.opacity * 0.8)); // Reduced opacity for ethereal translucency

    const size = g.size;

    // --- 1. ENHANCED LUMINOUS GLOW EFFECT (เพิ่มการเรืองแสง) ---
    // Outer wide ethereal blue spirit glow aura
    ctx.save();
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 45;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.55, size * 1.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Radiant cyan/blue luminous core glow
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 32;
    const coreGrad = ctx.createRadialGradient(0, 0, size * 0.15, 0, 0, size * 1.25);
    coreGrad.addColorStop(0, 'rgba(224, 242, 254, 0.65)'); // Luminous crystal bright center
    coreGrad.addColorStop(0.55, 'rgba(56, 189, 248, 0.45)');
    coreGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Translucent Angelic Fairy Wings with soft blue glow
    const wingWiggle = Math.sin(g.wingPhase) * 0.35;
    const wingSpan = size * 1.25;

    // Left Wing
    ctx.save();
    ctx.translate(-size * 0.55, -size * 0.15);
    ctx.rotate(-0.45 + wingWiggle);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = size * 0.08;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(0, 0, wingSpan * 0.85, wingSpan * 0.38, -0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.translate(size * 0.55, -size * 0.15);
    ctx.rotate(0.45 - wingWiggle);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.strokeStyle = '#bae6fd';
    ctx.lineWidth = size * 0.08;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(0, 0, wingSpan * 0.85, wingSpan * 0.38, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. THE SPIRIT SPRITE WITH TRANSLUCENT OPACITY & RADIANT GLOW
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 36;
    spriteEngine.drawFrame(
      ctx,
      g.frameIndex ?? 0,
      0,
      0,
      size,
      0, // Already transformed by parent
      0.72, // Reduced opacity for ethereal spirit translucency
      1.0,
      true // isGhost = true
    );
    ctx.restore();

    // Halo ring removed per user request: "ตอนตายเอาวงแหวนที่หัวออก ปรับให้เป็นโทนออกฟ้า"

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

      let hitDetected = false;
      const weevils = stateRef.current.weevils;
      const now = performance.now();

      for (let i = weevils.length - 1; i >= 0; i--) {
        const w = weevils[i];
        if (w.isDying) continue;

        const dist = Math.hypot(w.x - tapX, w.y - tapY);
        const hitRadius = w.size * 2.3;

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

          // Released ghost
          stateRef.current.ghostIdCounter++;
          stateRef.current.ghosts.push({
            id: stateRef.current.ghostIdCounter,
            x: w.x,
            y: w.y,
            frameIndex: Math.floor(w.legsPhase) % 8,
            floatSpeed: 2.5 + Math.random() * 1.5,
            zoomSpeed: 0.05 + Math.random() * 0.03,
            scale: 1.0,
            rotation: w.rotation,
            opacity: 0.72,
            fadeSpeed: 0.015 + Math.random() * 0.005,
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
            const angle = Math.atan2(w.y - tapY, w.x - tapX) + (Math.random() - 0.5) * 0.7;
            w.scurryTimer = 160;
            w.vx = Math.cos(angle) * w.baseSpeed * 3.2;
            w.vy = Math.sin(angle) * w.baseSpeed * 3.2;
            w.changeDirTimer = 160;
          }
        });
      }
    },
    [onCountChange, onVictory, onHit, onMiss]
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
  }, [generateRiceGrains, renderOffscreenRice]);

  // Main game update & loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resizeGame();
    spawnWeevils(totalCount);

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

            w.changeDirTimer--;
            if (w.changeDirTimer <= 0) {
              const angle = Math.random() * Math.PI * 2;
              const speed = w.scurryTimer > 0 ? w.baseSpeed * 2.8 : w.baseSpeed;
              w.vx = Math.cos(angle) * speed;
              w.vy = Math.sin(angle) * speed;
              w.changeDirTimer = 60 + Math.random() * 90;
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

          // --- 3. Update Ghosts ---
          for (let i = ghosts.length - 1; i >= 0; i--) {
            const g = ghosts[i];
            g.y -= g.floatSpeed;
            g.scale += g.zoomSpeed;
            g.opacity -= g.fadeSpeed;
            g.wavePhase += 0.04;
            g.x += Math.sin(g.wavePhase) * 1.2;
            g.wingPhase += 0.28;

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

        // 2. Alive Weevils
        weevils.forEach((w) => drawWeevil(ctx, w));

        // 3. Foreground Rice grains (creates natural depth with weevils crawling under some grains!)
        if (fgCanvas) {
          ctx.drawImage(fgCanvas, 0, 0);
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

    const handleWindowResize = () => {
      resizeGame();
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [totalCount, isPaused, resizeGame, spawnWeevils]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full block cursor-crosshair touch-none select-none z-0"
      onMouseDown={(e) => handleInput(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches && e.touches.length >= 4) {
          // Reserved for 4-finger interface restore gesture
          return;
        }
        if (e.touches && e.touches.length > 0) {
          handleInput(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
    />
  );
};
