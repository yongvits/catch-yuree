export interface RiceGrain {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot: number;
  shade: string;
  isForeground: boolean;
}

export interface Weevil {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeed: number;
  scurryTimer: number;
  size: number;
  rotation: number;
  legsPhase: number;
  opacity: number;
  isDying: boolean;
  scale: number;
  changeDirTimer: number;
  variant?: 'normal' | 'fast' | 'fat';
}

export interface Ghost {
  id: number;
  x: number;
  y: number;
  floatSpeed: number;
  zoomSpeed: number;
  scale: number;
  rotation: number;
  opacity: number;
  fadeSpeed: number;
  wavePhase: number;
  wingPhase: number;
  size: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  decay: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  scale: number;
  vy: number;
}

export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'extreme';

export interface DifficultyConfig {
  name: string;
  count: number;
  description: string;
  speedMultiplier: number;
}
