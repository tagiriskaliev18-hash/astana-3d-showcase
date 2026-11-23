/**
 * Procedural Web Audio Cyberpunk 2077 Ambient Soundscape
 * Synthesizes Vangelis/Blade Runner deep sub-bass drone, evolving neon synth pad,
 * and dynamic rain noise modulated live by cyberLevel & rainIntensity.
 * Muted by default until user clicks the Audio HUD toggle.
 */

export class CyberAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.nodes = null;
    this.cyberLevel = 1.0;
    this.rainIntensity = 1.0;
  }

  toggle() {
    if (this.enabled) {
      this.stop();
      return false;
    }
    return this.start();
  }

  start() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return false;

      this.ctx = new AudioCtx();
      const now = this.ctx.currentTime;

      const master = this.ctx.createGain();
      master.gain.setValueAtTime(0.001, now);
      master.gain.exponentialRampToValueAtTime(0.24, now + 1.8);
      master.connect(this.ctx.destination);

      // Deep Cyberpunk 55Hz sub-bass drone (A1 sawtooth through warm lowpass)
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(55, now);

      const bassOsc2 = this.ctx.createOscillator();
      bassOsc2.type = 'triangle';
      bassOsc2.frequency.setValueAtTime(82.41, now); // E2 fifth

      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(175, now);
      bassFilter.Q.value = 3.2;

      // Slow LFO modulating synth filter cutoff
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.11, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(65, now);
      lfo.connect(lfoGain);
      lfoGain.connect(bassFilter.frequency);

      const bassGain = this.ctx.createGain();
      bassGain.gain.setValueAtTime(0.45, now);
      bassOsc.connect(bassFilter);
      bassOsc2.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(master);

      // High ethereal pad chord shimmer
      const padOsc = this.ctx.createOscillator();
      padOsc.type = 'sine';
      padOsc.frequency.setValueAtTime(220, now);
      const padGain = this.ctx.createGain();
      padGain.gain.setValueAtTime(0.08, now);
      padOsc.connect(padGain);
      padGain.connect(master);

      // Procedural Rain Noise Buffer (filtered white/pink noise)
      const bufferLen = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferLen, this.ctx.sampleRate);
      const out = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferLen; i++) {
        const white = Math.random() * 2 - 1;
        out[i] = (lastOut + 0.06 * white) / 1.06;
        lastOut = out[i];
      }
      const rainSrc = this.ctx.createBufferSource();
      rainSrc.buffer = noiseBuffer;
      rainSrc.loop = true;

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'bandpass';
      rainFilter.frequency.setValueAtTime(1650, now);
      rainFilter.Q.value = 0.7;

      const rainGain = this.ctx.createGain();
      rainGain.gain.setValueAtTime(0.28 * this.cyberLevel * this.rainIntensity, now);

      rainSrc.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(master);

      bassOsc.start(now);
      bassOsc2.start(now);
      lfo.start(now);
      padOsc.start(now);
      rainSrc.start(now);

      this.nodes = {
        master,
        bassOsc,
        bassOsc2,
        lfo,
        padOsc,
        rainSrc,
        rainGain,
        bassFilter
      };
      this.enabled = true;
      this.syncMood(this.cyberLevel, this.rainIntensity);
      return true;
    } catch {
      return false;
    }
  }

  syncMood(cyberLevel, rainIntensity) {
    this.cyberLevel = cyberLevel;
    this.rainIntensity = rainIntensity;
    if (!this.enabled || !this.nodes || !this.ctx) return;

    const now = this.ctx.currentTime;
    const rainTarget = Math.max(0.001, 0.3 * cyberLevel * rainIntensity);
    this.nodes.rainGain.gain.setTargetAtTime(rainTarget, now, 0.25);
    this.nodes.bassFilter.frequency.setTargetAtTime(110 + cyberLevel * 120, now, 0.25);
  }

  playShiftPulse(toCyber) {
    if (!this.enabled || !this.ctx || !this.nodes) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(toCyber ? 68 : 260, now);
      osc.frequency.exponentialRampToValueAtTime(toCyber ? 310 : 62, now + 0.65);

      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(900, now);

      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.14, now + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.72);

      osc.connect(f);
      f.connect(g);
      g.connect(this.nodes.master);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch {
      // ignore audio glitches
    }
  }

  stop() {
    if (!this.enabled || !this.ctx || !this.nodes) return;
    const ctxRef = this.ctx;
    const nodesRef = this.nodes;
    this.enabled = false;
    this.nodes = null;
    this.ctx = null;

    try {
      const now = ctxRef.currentTime;
      nodesRef.master.gain.setTargetAtTime(0.0001, now, 0.18);
      setTimeout(() => {
        try {
          nodesRef.bassOsc.stop();
          nodesRef.bassOsc2.stop();
          nodesRef.lfo.stop();
          nodesRef.padOsc.stop();
          nodesRef.rainSrc.stop();
          ctxRef.close();
        } catch {
          // already closed
        }
      }, 600);
    } catch {
      // ignore
    }
  }
}
