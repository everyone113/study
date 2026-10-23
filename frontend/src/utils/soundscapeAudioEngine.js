/**
 * Web Audio API Focus Soundscape Procedural Synthesis Engine
 * 100% Client-side synthesized offline audio - Zero MP3 downloads, 0ms latency.
 * Channels:
 *  1. Gentle Rain (Pink noise + Lowpass 850Hz + Bandpass 1200Hz + LFO 0.15Hz)
 *  2. Cafe Ambience (Brown noise + 200-2500Hz filter + subtle porcelain clinks at 2800Hz & 3400Hz)
 *  3. Mechanical Keyboard (Periodic Poisson clicks: highpass 3500Hz + 320Hz thock decay)
 *  4. Ocean Waves (Slow 9s LFO sweeping lowpass 250Hz-900Hz with tidal volume swell)
 *  5. 40Hz Alpha Wave (Binaural beats: 216Hz left + 256Hz right, plus 40Hz isochronic pulse)
 */

export const SOUNDSCAPE_CHANNELS = {
  rain: {
    name: 'Mưa rơi nhẹ (Gentle Rain)',
    lowpassCutoff: 850,
    bandpassCutoff: 1200,
    bandpassQ: 1.2,
    lfoFreq: 0.15,
  },
  cafe: {
    name: 'Quán cà phê (Cafe Ambience)',
    brownFilterLow: 200,
    brownFilterHigh: 2500,
    impulseFrequencies: [2800, 3400],
  },
  keyboard: {
    name: 'Bàn phím cơ (Mechanical Keyboard)',
    clickHighpassCutoff: 3500,
    clickDurationMs: 4,
    thockFreq: 320,
    thockDecayMs: 30,
  },
  waves: {
    name: 'Sóng biển (Ocean Waves)',
    lfoPeriodSeconds: 9.0,
    filterSweepMin: 250,
    filterSweepMax: 900,
  },
  alpha: {
    name: 'Sóng não Alpha 40Hz (Binaural Beats)',
    carrierFreq: 216,
    binauralOffset: 40,
    isochronicPulseFreq: 40,
  },
};

export const SOUNDSCAPE_PRESETS = {
  deep_study: {
    name: 'Tập trung sâu (Deep Study)',
    description: 'Sóng não Alpha 40Hz kết hợp mưa nhẹ tạo dải tần tập trung cao độ',
    volumes: { rain: 0.55, cafe: 0.0, keyboard: 0.0, waves: 0.25, alpha: 0.75 }
  },
  rainy_evening: {
    name: 'Chiều mưa yên tĩnh (Rainy Evening)',
    description: 'Tiếng mưa rơi rì rào và sóng vỗ dạt dào thư giãn',
    volumes: { rain: 0.85, cafe: 0.15, keyboard: 0.0, waves: 0.45, alpha: 0.2 }
  },
  coffee_flow: {
    name: 'Quán cà phê năng suất (Coffee Flow)',
    description: 'Không khí quán cà phê ấm cúng cùng tiếng gõ phím nhộn nhịp',
    volumes: { rain: 0.0, cafe: 0.7, keyboard: 0.6, waves: 0.0, alpha: 0.3 }
  },
  zen_waves: {
    name: 'Thiền định biển khơi (Zen Waves)',
    description: 'Sóng biển dạt dào tuần hoàn ru êm tâm trí',
    volumes: { rain: 0.2, cafe: 0.0, keyboard: 0.0, waves: 0.85, alpha: 0.4 }
  },
  mechanical_asmr: {
    name: 'Gõ code cơ học (Mechanical ASMR)',
    description: 'Tiếng gõ phím cơ chân thực kích thích năng suất lập trình',
    volumes: { rain: 0.25, cafe: 0.3, keyboard: 0.85, waves: 0.0, alpha: 0.25 }
  }
};

class SoundscapeAudioEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.compressor = null;
    this.channels = {};
    this.channelGains = {};
    this.channelVolumes = {
      rain: 0.5,
      cafe: 0.2,
      keyboard: 0.3,
      waves: 0.4,
      alpha: 0.5,
    };
    this.channelMutes = {
      rain: false,
      cafe: false,
      keyboard: false,
      waves: false,
      alpha: false,
    };
    this.masterVolume = 0.7;
    this.isPlaying = false;
    this.activeIntervals = [];
    this.listeners = new Set();
  }

  initContext() {
    if (this.audioCtx && this.audioCtx.state !== 'closed') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioCtx = new AudioContextClass();

    // Master Limiter / Compressor to prevent any clipping distortion
    this.compressor = this.audioCtx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-6, this.audioCtx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.audioCtx.currentTime);
    this.compressor.ratio.setValueAtTime(8, this.audioCtx.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioCtx.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioCtx.currentTime);

    // Master Volume Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);

    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.audioCtx.destination);
  }

  // Create a 5-second looping buffer of pink noise
  createPinkNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 5;
    const buffer = this.audioCtx.createBuffer(2, bufferSize, this.audioCtx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
        b6 = white * 0.115926;
      }
    }
    return buffer;
  }

  // Create a 5-second looping buffer of brown noise
  createBrownNoiseBuffer() {
    const bufferSize = this.audioCtx.sampleRate * 5;
    const buffer = this.audioCtx.createBuffer(2, bufferSize, this.audioCtx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = data[i];
        data[i] *= 0.8;
      }
    }
    return buffer;
  }

  // Channel 1: Rain Generator
  buildRainChannel() {
    const ctx = this.audioCtx;
    const gain = ctx.createGain();
    const currentVol = this.channelMutes.rain ? 0 : this.channelVolumes.rain;
    gain.gain.setValueAtTime(currentVol, ctx.currentTime);

    const noise = ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer();
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(SOUNDSCAPE_CHANNELS.rain.lowpassCutoff, ctx.currentTime);

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(SOUNDSCAPE_CHANNELS.rain.bandpassCutoff, ctx.currentTime);
    bandpass.Q.setValueAtTime(SOUNDSCAPE_CHANNELS.rain.bandpassQ, ctx.currentTime);

    // Subtle micro-modulation LFO for organic rain depth
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(SOUNDSCAPE_CHANNELS.rain.lfoFreq, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.08, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    noise.connect(lowpass);
    lowpass.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.compressor);

    noise.start();
    lfo.start();

    return {
      gainNode: gain,
      stop: () => {
        try { noise.stop(); lfo.stop(); } catch (e) {}
      }
    };
  }

  // Channel 2: Cafe Ambience Generator
  buildCafeChannel() {
    const ctx = this.audioCtx;
    const gain = ctx.createGain();
    const currentVol = this.channelMutes.cafe ? 0 : this.channelVolumes.cafe;
    gain.gain.setValueAtTime(currentVol, ctx.currentTime);

    // Warm background crowd rumble
    const noise = ctx.createBufferSource();
    noise.buffer = this.createBrownNoiseBuffer();
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    noise.start();

    // Occasional subtle cup/porcelain chimes
    const chimeTimer = setInterval(() => {
      if (!this.isPlaying || this.channelMutes.cafe) return;
      if (Math.random() > 0.45) return;
      try {
        const osc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        const freq = SOUNDSCAPE_CHANNELS.cafe.impulseFrequencies[
          Math.floor(Math.random() * SOUNDSCAPE_CHANNELS.cafe.impulseFrequencies.length)
        ] + (Math.random() * 80 - 40);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        chimeGain.gain.setValueAtTime(0.015, ctx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

        osc.connect(chimeGain);
        chimeGain.connect(gain);

        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      } catch (e) {}
    }, 2800);

    this.activeIntervals.push(chimeTimer);

    return {
      gainNode: gain,
      stop: () => {
        try { noise.stop(); } catch (e) {}
        clearInterval(chimeTimer);
      }
    };
  }

  // Channel 3: Mechanical Keyboard Generator
  buildKeyboardChannel() {
    const ctx = this.audioCtx;
    const gain = ctx.createGain();
    const currentVol = this.channelMutes.keyboard ? 0 : this.channelVolumes.keyboard;
    gain.gain.setValueAtTime(currentVol, ctx.currentTime);
    gain.connect(this.compressor);

    const triggerKeyClick = () => {
      if (!this.isPlaying || this.channelMutes.keyboard) return;
      try {
        const now = ctx.currentTime;
        // High click noise burst
        const bufferSize = ctx.sampleRate * 0.004;
        const noiseBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuf;

        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(SOUNDSCAPE_CHANNELS.keyboard.clickHighpassCutoff, now);

        const clickGain = ctx.createGain();
        clickGain.gain.setValueAtTime(0.08, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.008);

        noiseNode.connect(highpass);
        highpass.connect(clickGain);
        clickGain.connect(gain);

        // Low thock tone
        const osc = ctx.createOscillator();
        const thockGain = ctx.createGain();
        osc.type = 'triangle';
        const jitterFreq = SOUNDSCAPE_CHANNELS.keyboard.thockFreq + (Math.random() * 40 - 20);
        osc.frequency.setValueAtTime(jitterFreq, now);

        thockGain.gain.setValueAtTime(0.06, now);
        thockGain.gain.exponentialRampToValueAtTime(0.0001, now + (SOUNDSCAPE_CHANNELS.keyboard.thockDecayMs / 1000));

        osc.connect(thockGain);
        thockGain.connect(gain);

        noiseNode.start(now);
        noiseNode.stop(now + 0.01);
        osc.start(now);
        osc.stop(now + 0.035);
      } catch (e) {}
    };

    // Simulate natural typing rhythm
    let nextDelay = 220;
    const scheduleNextKey = () => {
      if (!this.isPlaying) return;
      triggerKeyClick();
      // Random pause to simulate thinking vs typing burst
      const isPause = Math.random() < 0.12;
      nextDelay = isPause ? 600 + Math.random() * 800 : 120 + Math.random() * 220;
      const timer = setTimeout(scheduleNextKey, nextDelay);
      this.activeIntervals.push(timer);
    };

    scheduleNextKey();

    return {
      gainNode: gain,
      stop: () => {}
    };
  }

  // Channel 4: Ocean Waves Generator
  buildWavesChannel() {
    const ctx = this.audioCtx;
    const gain = ctx.createGain();
    const currentVol = this.channelMutes.waves ? 0 : this.channelVolumes.waves;
    gain.gain.setValueAtTime(currentVol, ctx.currentTime);

    const noise = ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer();
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(SOUNDSCAPE_CHANNELS.waves.filterSweepMin, ctx.currentTime);
    filter.Q.setValueAtTime(2.0, ctx.currentTime);

    // Wave swell LFO
    const lfoFreq = 1 / SOUNDSCAPE_CHANNELS.waves.lfoPeriodSeconds;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(lfoFreq, ctx.currentTime);

    // Modulate filter cutoff between 250Hz and 900Hz
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(325, ctx.currentTime);
    filter.frequency.setValueAtTime(575, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.compressor);

    noise.start();
    lfo.start();

    return {
      gainNode: gain,
      stop: () => {
        try { noise.stop(); lfo.stop(); } catch (e) {}
      }
    };
  }

  // Channel 5: 40Hz Alpha Wave (Binaural Beats & Isochronic)
  buildAlphaChannel() {
    const ctx = this.audioCtx;
    const gain = ctx.createGain();
    const currentVol = this.channelMutes.alpha ? 0 : this.channelVolumes.alpha;
    gain.gain.setValueAtTime(currentVol, ctx.currentTime);

    const carrier = SOUNDSCAPE_CHANNELS.alpha.carrierFreq; // 216Hz
    const offset = SOUNDSCAPE_CHANNELS.alpha.binauralOffset; // 40Hz -> 256Hz

    // Left Ear Carrier (216Hz)
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(carrier, ctx.currentTime);

    // Right Ear Target (256Hz) -> generates 40Hz delta
    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(carrier + offset, ctx.currentTime);

    // Stereo Panner or Channel Merger
    const merger = ctx.createChannelMerger(2);
    oscLeft.connect(merger, 0, 0); // Left channel
    oscRight.connect(merger, 0, 1); // Right channel

    // Subtle 40Hz Isochronic amplitude pulse
    const isochronicGain = ctx.createGain();
    isochronicGain.gain.setValueAtTime(0.7, ctx.currentTime);

    const pulseOsc = ctx.createOscillator();
    pulseOsc.frequency.setValueAtTime(SOUNDSCAPE_CHANNELS.alpha.isochronicPulseFreq, ctx.currentTime);
    const pulseDepth = ctx.createGain();
    pulseDepth.gain.setValueAtTime(0.2, ctx.currentTime);

    pulseOsc.connect(pulseDepth);
    pulseDepth.connect(isochronicGain.gain);

    merger.connect(isochronicGain);
    isochronicGain.connect(gain);
    gain.connect(this.compressor);

    oscLeft.start();
    oscRight.start();
    pulseOsc.start();

    return {
      gainNode: gain,
      stop: () => {
        try { oscLeft.stop(); oscRight.stop(); pulseOsc.stop(); } catch (e) {}
      }
    };
  }

  start() {
    this.initContext();
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;

    // Build all 5 procedural channels
    this.channels.rain = this.buildRainChannel();
    this.channels.cafe = this.buildCafeChannel();
    this.channels.keyboard = this.buildKeyboardChannel();
    this.channels.waves = this.buildWavesChannel();
    this.channels.alpha = this.buildAlphaChannel();

    this.notify();
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;

    // Clear interval/timeout tasks
    for (const timer of this.activeIntervals) {
      clearInterval(timer);
      clearTimeout(timer);
    }
    this.activeIntervals = [];

    // Stop channel sources
    for (const key of Object.keys(this.channels)) {
      if (this.channels[key] && typeof this.channels[key].stop === 'function') {
        this.channels[key].stop();
      }
    }
    this.channels = {};

    this.notify();
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
    return this.isPlaying;
  }

  setMasterVolume(val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.masterVolume = clamped;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setTargetAtTime(clamped, this.audioCtx.currentTime, 0.04);
    }
    this.notify();
  }

  setChannelVolume(channelId, val) {
    const clamped = Math.max(0, Math.min(1, val));
    this.channelVolumes[channelId] = clamped;

    if (this.channels[channelId]?.gainNode && this.audioCtx) {
      const effective = this.channelMutes[channelId] ? 0 : clamped;
      this.channels[channelId].gainNode.gain.setTargetAtTime(effective, this.audioCtx.currentTime, 0.04);
    }
    this.notify();
  }

  getChannelVolume(channelId) {
    return this.channelVolumes[channelId] ?? 0.5;
  }

  toggleChannelMute(channelId) {
    const nextMute = !this.channelMutes[channelId];
    this.channelMutes[channelId] = nextMute;

    if (this.channels[channelId]?.gainNode && this.audioCtx) {
      const effective = nextMute ? 0 : (this.channelVolumes[channelId] ?? 0.5);
      this.channels[channelId].gainNode.gain.setTargetAtTime(effective, this.audioCtx.currentTime, 0.04);
    }
    this.notify();
    return nextMute;
  }

  applyPreset(presetKey) {
    const preset = SOUNDSCAPE_PRESETS[presetKey];
    if (!preset) return;

    for (const [ch, vol] of Object.entries(preset.volumes)) {
      this.channelMutes[ch] = false;
      this.setChannelVolume(ch, vol);
    }
    if (!this.isPlaying) {
      this.start();
    }
    this.notify();
  }

  getState() {
    return {
      isPlaying: this.isPlaying,
      masterVolume: this.masterVolume,
      volumes: { ...this.channelVolumes },
      mutes: { ...this.channelMutes },
    };
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try { fn(state); } catch (e) {}
    });
  }

  destroy() {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try { this.audioCtx.close(); } catch (e) {}
    }
    this.audioCtx = null;
    this.listeners.clear();
  }
}

// Export singleton instance
export const soundscapeEngine = new SoundscapeAudioEngine();
export default soundscapeEngine;
