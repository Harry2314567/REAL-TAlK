class DualAudioEngine {
  constructor() {
    this.ctx = null;
    this.bassFilter = null;
    this.trebleFilter = null;
    this.gainPrimary = null;
    this.gainSecondary = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Equalizer Biquad Filters for zero-loss tone shaping
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 150;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 3000;

    // Dual gain nodes for independent channel management
    this.gainPrimary = this.ctx.createGain();
    this.gainSecondary = this.ctx.createGain();

    // Routing Chain: Input -> Bass -> Treble -> Dual Gains -> Audio Destination
    this.bassFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.gainPrimary);
    this.trebleFilter.connect(this.gainSecondary);

    this.gainPrimary.connect(this.ctx.destination);
    this.gainSecondary.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  setPreset(mode) {
    if (!this.isInitialized) this.init();

    if (mode === 'bass') {
      this.bassFilter.gain.value = 8;
      this.trebleFilter.gain.value = 1;
    } else if (mode === 'treble') {
      this.bassFilter.gain.value = 0;
      this.trebleFilter.gain.value = 7;
    } else {
      // Studio Flat
      this.bassFilter.gain.value = 0;
      this.trebleFilter.gain.value = 0;
    }
  }

  setVolume(primaryVol, secondaryVol) {
    if (!this.isInitialized) return;
    this.gainPrimary.gain.value = primaryVol;
    this.gainSecondary.gain.value = secondaryVol;
  }
}

const audioEngine = new DualAudioEngine();
