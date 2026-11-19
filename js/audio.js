/**
 * ORBIT — Deep Space Generative Audio Engine (Web Audio API)
 * Generates an ambient sci-fi drone and interactive UI feedback.
 * No external audio files needed; 100% synthesized.
 */

class OrbitAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.ambientNodes = null;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.setupAmbientDrone();
  }

  setupAmbientDrone() {
    if (!this.ctx) return;

    // Sub-bass drone (40 Hz & 48 Hz with subtle beat frequency)
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(82.4, this.ctx.currentTime); // E2 note (fifth)

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(32.7, this.ctx.currentTime); // C1 sub

    // Lowpass filter for deep cosmic warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // LFO to slowly sweep filter frequency (simulating orbital drift)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // 12.5s cycle
    lfoGain.gain.setValueAtTime(45, this.ctx.currentTime);
    lfo.connect(filter.frequency);

    // Drone gain
    const droneGain = this.ctx.createGain();
    droneGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(this.masterGain);

    osc1.start();
    osc2.start();
    subOsc.start();
    lfo.start();

    this.ambientNodes = { osc1, osc2, subOsc, lfo, droneGain, filter };
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.8, this.ctx.currentTime + 1.2);
    } else {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
    }

    return !this.isMuted;
  }

  // Sci-fi hover micro-interaction
  playHover() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // Sci-fi button click trigger
  playClick() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  // Deep warp swell for major actions
  playWarp() {
    if (this.isMuted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.4);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (e) {}
  }
}

window.orbitAudio = new OrbitAudioEngine();
