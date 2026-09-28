/**
 * AudioFX - Procedural Web Audio Synthesizer
 * Zero external asset dependencies. Generates rich, organic sound effects live.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('squishbox_muted') === 'true';
    this.volume = parseFloat(localStorage.getItem('squishbox_volume') || '0.7');
    this.raveInterval = null;
    this.pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
    this.currentNoteIndex = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('squishbox_muted', this.muted);
    return this.muted;
  }

  getMasterGain() {
    if (!this.ctx || this.muted) return null;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    gain.connect(this.ctx.destination);
    return gain;
  }

  // Bubble pop with melodic pitch variation
  playPop(multiplier = 1) {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    const baseFreq = this.pentatonic[this.currentNoteIndex % this.pentatonic.length] * multiplier;
    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.pentatonic.length;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  // Organic rubbery squish sound
  playSquish(intensity = 1) {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    const startFreq = 180 + Math.random() * 40;
    osc.frequency.setValueAtTime(startFreq * intensity, now);
    osc.frequency.linearRampToValueAtTime(320 * intensity, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.16);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.linearRampToValueAtTime(1200, now + 0.06);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.16);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Cartoon boing / spring oscillation
  playBoing() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(450, now + 0.2);
    osc.frequency.linearRampToValueAtTime(200, now + 0.35);

    // Add vibrato
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(22, now);
    lfoGain.gain.setValueAtTime(40, now);
    lfo.connect(osc.frequency);
    lfo.start(now);
    lfo.stop(now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Whoosh for fling / slingshot
  playWhoosh() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = this.ctx.currentTime;
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);

    noise.start(now);
    noise.stop(now + 0.21);
  }

  // Chime fanfare for combos and achievements
  playFanfare() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.45);
    });
  }

  // Laser zap for physics sandbox
  playLaser() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(master);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Tiny melodic step tick when entering secret sequence keys
  playStepTick(step = 0) {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    const freq = 440 * Math.pow(1.059463, step * 2);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.1, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Ethereal Zero-G / Anti-gravity pitch glide
  playZeroG(isInverted = true) {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    if (isInverted) {
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(640, now + 0.35);
    } else {
      osc.frequency.setValueAtTime(640, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.35);
    }

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Secret / Easter egg unlocked chime
  playSecretChime() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const notes = [440, 554.37, 659.25, 830.61, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(master);

      osc.start(now);
      osc.stop(now + 0.4);
    });
  }

  // Start continuous rhythmic rave beat for Konami Disco Mode
  startRaveBeat() {
    this.stopRaveBeat();
    let step = 0;
    const bpmNotes = [130.81, 164.81, 196.00, 261.63, 196.00, 164.81];

    this.raveInterval = setInterval(() => {
      if (this.muted) return;
      this.init();
      const master = this.getMasterGain();
      if (!master) return;

      const now = this.ctx.currentTime;
      // Kick beat on step 0, 2
      if (step % 2 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        kickGain.gain.setValueAtTime(0.4, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        kickOsc.connect(kickGain);
        kickGain.connect(master);
        kickOsc.start(now);
        kickOsc.stop(now + 0.13);
      }

      // Synth arpeggio
      const synthOsc = this.ctx.createOscillator();
      const synthGain = this.ctx.createGain();
      synthOsc.type = 'sawtooth';
      const freq = bpmNotes[step % bpmNotes.length] * 2;
      synthOsc.frequency.setValueAtTime(freq, now);
      synthGain.gain.setValueAtTime(0.12, now);
      synthGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      synthOsc.connect(synthGain);
      synthGain.connect(master);
      synthOsc.start(now);
      synthOsc.stop(now + 0.11);

      step++;
    }, 140);
  }

  stopRaveBeat() {
    if (this.raveInterval) {
      clearInterval(this.raveInterval);
      this.raveInterval = null;
    }
  }

  // Satisfying crispy snack chomp when catching cheese
  playChomp() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Playful synth cat meow
  playMeow() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    // Classic meow frequency curve: start mid, rise high, fall gently
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(850, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.32);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  // Time Warp / Slow-Mo dilation sound
  playTimeWarp(isSlow = true) {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    if (isSlow) {
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);
    } else {
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.45);
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Crystal water droplet / liquid plop
  playWaterDrop() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 600 + Math.random() * 400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.2, now + 0.08);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(master);
  // Electric lightning bolt zap
  playZap() {
    this.init();
    const master = this.getMasterGain();
    if (!master) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

window.soundEngine = new SoundEngine();
