# R34L_T4LK 🎙️⚡

**R34L_T4LK** is a minimalist, cyberpunk-styled walkie-talkie web application featuring dual audio hardware routing, zero-loss Web Audio API equalizer presets, and persistent peer identity management via QR codes. Built with a Node.js/Express and WebSockets backend, it is fully optimized as an installable Progressive Web Application (PWA).

---

## 🚀 Key Features

* **Cyberpunk UI/UX:** Pitch-black theme (`#000000`) accented with neon cyan (`#00f3ff`) and purple (`#bf00ff`), featuring an animated letter-by-letter loading sequence.
* **Zero-Loss Dual Audio Engine:** Powered by the Web Audio API (`AudioContext`, gain nodes, low/high shelf biquad filters) to manage simultaneous playback channels with studio, bass, and treble presets.
* **Hardware Routing Hub:** Configurable bottom slide-up drawer allowing users to toggle between **1 Wired + 1 Bluetooth** or **2 Bluetooth** audio routing modes with independent volume control sliders.
* **Permanent User Identity & QR Linking:** Side-drawer management system featuring a fixed user QR identity matrix, manual user ID linking, camera-based QR scanning simulation, and a permanent friends list.
* **Real-Time Signaling Server:** Built-in WebSocket signaling layer (`server.js`) ready for peer-to-peer WebRTC voice communication.

---

## 📁 Project Architecture

```text
r34l-t4lk/
├── public/
│   ├── index.html       # Main application layout & DOM structure
│   ├── style.css        # Cyberpunk aesthetics, animations, & slide drawers
│   ├── audioEngine.js   # Web Audio API processing & biquad filter presets
│   ├── app.js           # UI logic, state management, & event listeners
│   └── manifest.json    # PWA configuration for native app installation
├── package.json         # Node.js dependencies and start scripts
└── server.js            # Express static file server & WebSocket signaling relay# REAL-TAlK
