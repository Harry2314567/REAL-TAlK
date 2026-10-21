class DualAudioEngine {
  constructor() {
    this.ctx = null;
    this.micStream = null;
    this.micSource = null;
    this.processor = null;
    this.bassFilter = null;
    this.trebleFilter = null;
    this.gainPrimary = null;
    this.gainSecondary = null;
    this.isInitialized = false;
    this.isTransmitting = false;
    this.ws = null;
  }

  init(wsConnection) {
    if (this.isInitialized) return;
    this.ws = wsConnection;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Equalizer Biquad Filters for zero-loss tone shaping
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 150;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 3000;

    // Dual gain nodes for volume control
    this.gainPrimary = this.ctx.createGain();
    this.gainSecondary = this.ctx.createGain();

    // Routing Chain for Output Playback
    this.bassFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.gainPrimary);
    this.trebleFilter.connect(this.gainSecondary);

    this.gainPrimary.connect(this.ctx.destination);
    this.gainSecondary.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  async startTransmission() {
    if (!this.isInitialized) return;
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);

      // Create a ScriptProcessor to capture microphone audio frames
      this.processor = this.ctx.createScriptProcessor(2048, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isTransmitting) return;
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 audio to Int16 PCM array buffer for light network transmission
        const pcmBuffer = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmBuffer[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(pcmBuffer.buffer);
        }
      };

      this.micSource.connect(this.processor);
      this.processor.connect(this.ctx.destination);
      this.isTransmitting = true;
    } catch (err) {
      console.error("Microphone Access Error:", err);
      alert("Microphone permission required for walkie-talkie transmission!");
    }
  }

  stopTransmission() {
    this.isTransmitting = false;
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
  }

  playReceivedAudio(bufferData) {
    if (!this.isInitialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const pcm16 = new Int16Array(bufferData);
    const float32 = new Float32Array(pcm16.length);

    // Convert Int16 back to Float32 for Web Audio API playback
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 0x7FFF;
    }

    const audioBuffer = this.ctx.createBuffer(1, float32.length, this.ctx.sampleRate);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.bassFilter);
    source.start();
  }

  setPreset(mode) {
    if (!this.isInitialized) return;
    if (mode === 'bass') {
      this.bassFilter.gain.value = 8;
      this.trebleFilter.gain.value = 1;
    } else if (mode === 'treble') {
      this.bassFilter.gain.value = 0;
      this.trebleFilter.gain.value = 7;
    } else {
      this.bassFilter.gain.value = 0;
      this.trebleFilter.gain.value = 0;
    }
  }

  setVolume(primaryVol, secondaryVol) {
    if (!this.isInitialized) return;
    this.gainPrimary.gain.value = parseFloat(primaryVol);
    this.gainSecondary.gain.value = parseFloat(secondaryVol);
  }
}

const audioEngine = new DualAudioEngine();
