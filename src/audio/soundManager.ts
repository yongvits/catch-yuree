class SoundManager {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // เสียงบี้มอด (Squish sound from original code)
  public playSquish() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Audio fallback handling
    }
  }

  // เสียงวิญญาณมอดลอยละลิ่วสู่สุคติ (Ghost Ascension Sound from original code)
  public playGhost(pitchFactor = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      const baseFreq = 280 * pitchFactor;
      const targetFreq = 950 * pitchFactor;
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(targetFreq, this.ctx.currentTime + 0.55);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.55);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.6);
    } catch {
      // Audio fallback
    }
  }

  // เสียงคอมโบเมื่อแตะต่อเนื่อง
  public playCombo(comboCount: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
      const noteFreq = notes[Math.min(comboCount - 1, notes.length - 1)];

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(noteFreq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch {
      // Audio fallback
    }
  }

  // เสียงมอดตกใจวิ่งหนีเมื่อแตะพลาด (Scurry rustle sound)
  public playStartled() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio fallback
    }
  }

  // เสียงฉลองชัยชนะ (Victory Sound from original code)
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const melody = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
      melody.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.09);

        gain.gain.setValueAtTime(0.22, this.ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.09 + 0.3);

        osc.start(this.ctx.currentTime + i * 0.09);
        osc.stop(this.ctx.currentTime + i * 0.09 + 0.35);
      });
    } catch {
      // Audio fallback
    }
  }

  // เสียงหยิบสมุนไพรขึ้นมาลาก (Herb pick up)
  public playHerbPick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.13);
    } catch {
      // Audio fallback
    }
  }

  // เสียงวางสมุนไพรลงบนข้าว (Herb drop)
  public playHerbDrop() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Audio fallback
    }
  }

  // เสียงระเบิดพลังสมุนไพรรูปตัว Y (Y-Shape Blast Explosion)
  public playYExplosion() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // Deep blast impact thump
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.connect(boomGain);
      boomGain.connect(this.ctx.destination);
      boom.type = 'sawtooth';
      boom.frequency.setValueAtTime(160, t);
      boom.frequency.exponentialRampToValueAtTime(34, t + 0.42);
      boomGain.gain.setValueAtTime(0.36, t);
      boomGain.gain.exponentialRampToValueAtTime(0.005, t + 0.44);
      boom.start(t);
      boom.stop(t + 0.46);

      // Fiery noise / burst filter sweep
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.38);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.frequency.exponentialRampToValueAtTime(180, t + 0.38);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.28, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, t + 0.38);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(t);

      // Power chime accent
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();
      chime.connect(chimeGain);
      chimeGain.connect(this.ctx.destination);
      chime.type = 'triangle';
      chime.frequency.setValueAtTime(440, t);
      chime.frequency.exponentialRampToValueAtTime(880, t + 0.18);
      chimeGain.gain.setValueAtTime(0.14, t);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      chime.start(t);
      chime.stop(t + 0.25);
    } catch {
      // Audio fallback
    }
  }

  // เสียงวงกลมเวทสมุนไพรจับมอดพร้อมกัน (Circle Trap Seal)
  public playCircleSeal() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.045);
        gain.gain.setValueAtTime(0.16, t + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.002, t + idx * 0.045 + 0.28);
        osc.start(t + idx * 0.045);
        osc.stop(t + idx * 0.045 + 0.3);
      });
    } catch {
      // Audio fallback
    }
  }
}

export const soundManager = new SoundManager();
