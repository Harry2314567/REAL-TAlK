const express = require('express');
const { WebSocketServer } = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up public static file delivery
app.use(express.static(path.join(__dirname, 'public')));

// Root route delivers the mobile walkie-talkie interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin dashboard route delivers the tracking radar map view
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const server = app.listen(PORT, () => {
    console.log(`\n=====================================================`);
    console.log(`REALTALK SYSTEM ONLINE // PORT ${PORT}`);
    console.log(`=====================================================\n`);
});

const wss = new WebSocketServer({ server });
let audioClients = new Set();
let dashboardClients = new Set();

wss.on('connection', (ws) => {
    ws.phoneId = '???';

    ws.on('message', (message) => {
        try {
            const stringMessage = message.toString();
            if (stringMessage.startsWith('{')) {
                const data = JSON.parse(stringMessage);
                
                // Device Registration Identification System
                if (data.type === 'REGISTER_PHONE') {
                    ws.phoneId = data.phoneId;
                    if (data.phoneId === 'DASHBOARD') {
                        dashboardClients.add(ws);
                        audioClients.delete(ws);
                    } else {
                        audioClients.add(ws);
                    }
                    console.log(`[CONNECTED] Core Sign-In: Device ID [${ws.phoneId}]`);
                    return;
                }
                
                // Location Tracking Frame Parsing Logic
                if (data.type === 'LOCATION_PING') {
                    for (let client of dashboardClients) {
                        if (client.readyState === ws.OPEN) {
                            client.send(JSON.stringify({
                                type: 'MAP_UPDATE',
                                phoneId: ws.phoneId,
                                lat: data.lat,
                                lng: data.lng,
                                accuracy: data.accuracy,
                                speed: data.speed
                            }));
                        }
                    }
                    return;
                }

                // Audio Status Metadata Syncing Block (Talking/Idle alerts)
                if (data.type === 'STATUS_UPDATE') {
                    for (let client of audioClients) {
                        if (client !== ws && client.readyState === ws.OPEN) {
                            client.send(JSON.stringify({
                                type: 'PEER_STATUS',
                                phoneId: ws.phoneId,
                                status: data.status
                            }));
                        }
                    }
                    return;
                }
            }
        } catch (e) {
            console.error("JSON Parse Error:", e);
        }

        // Audio Stream Forwarder: Pipe binary audio out strictly to other walkie talkie nodes
        for (let client of audioClients) {
            if (client !== ws && client.readyState === ws.OPEN) {
                try {
                    client.send(message);
                } catch (err) {}
            }
        }
    });

    ws.on('close', () => {
        audioClients.delete(ws);
        dashboardClients.delete(ws);
        console.log(`[DISCONNECTED] Node Dropped: Device ID [${ws.phoneId}]`);
    });
});
```[cite: 1]

---

### 2. `package.json` (Updated)
* **Fixes:** Ensures Render recognizes the correct start command and handles dependencies. Make sure your project structure places `server.js` at the root, or inside a folder if specified.

```json
{
  "name": "realtalk-walkie-talkie",
  "version": "1.0.0",
  "description": "Real-time voice and radar location streaming network",
  "main": "server.js",
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "ws": "^8.16.0"
  }
}
```[cite: 3]

---

### 3. `index.html` (Updated)
* **Fixes:** Robust WSS protocol resolution (`wss://` vs `ws://` based on `https`), and added `accuracy` and `speed` data properties inside the GPS geolocation telemetry ping.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REALTALK // TRANSMITTER</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background: #0a0b0d; color: #ffffff; margin: 0; 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
            height: 100vh; overflow: hidden;
        }
        .container { text-align: center; width: 90%; max-width: 400px; }
        h2 { font-size: 26px; letter-spacing: 3px; margin-bottom: 5px; color: #707585; }
        
        .phone-id-badge { 
            font-size: 13px; color: #a0a5b5; background: #14161d; padding: 6px 16px; 
            border-radius: 6px; display: inline-block; font-weight: bold;
            letter-spacing: 1px; margin-bottom: 25px; border: 1px solid #1c1e26; 
        }

        .status { font-size: 13px; color: #8a8e9b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 2px; }
        
        .speaker-alert {
            font-size: 14px; font-weight: bold; color: #ff9500; min-height: 20px;
            margin-bottom: 20px; letter-spacing: 1px; text-transform: uppercase;
        }

        .talk-trigger { 
            width: 180px; height: 180px; border-radius: 50%; border: 2px solid #3a3f4d;
            background: linear-gradient(145deg, #2c2f36, #1e2025); color: #a0a5b5; 
            font-size: 20px; font-weight: 600; letter-spacing: 1px; cursor: pointer; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.4); outline: none; transition: all 0.1s ease;
            user-select: none; -webkit-user-select: none;
        }
        .talk-trigger.active { 
            background: #1a1b1f; color: #00ff66; border-color: #00ff66; transform: scale(0.96); 
            box-shadow: 0 0 30px rgba(0, 255, 102, 0.2);
        }
        .hint { margin-top: 35px; font-size: 12px; color: #414550; letter-spacing: 0.5px; }
    </style>
</head>
<body>

    <div class="container">
        <h2>REALTALK</h2>
        <div id="phoneIdDisplay" class="phone-id-badge">...</div>
        <div id="speakerAlert" class="speaker-alert"></div>
        <div id="statusText" class="status">Connecting...</div>
        <br><br>
        <button id="talkBtn" class="talk-trigger">TALK</button>
        <p class="hint">Hold to talk. Release to listen.</p>
    </div>

    <script>
        const statusText = document.getElementById('statusText');
        const phoneIdDisplay = document.getElementById('phoneIdDisplay');
        const speakerAlert = document.getElementById('speakerAlert');
        const talkBtn = document.getElementById('talkBtn');
        let socket, mediaRecorder;
        let isButtonHeld = false;
        let locationInterval;
        
        let rawId = localStorage.getItem('realtalk_num_id') || "";
        let myNumberId = rawId.replace(/\D/g, ''); 

        if (!myNumberId || myNumberId.length !== 3) {
            myNumberId = Math.floor(100 + Math.random() * 900).toString();
        }
        localStorage.setItem('realtalk_num_id', myNumberId);
        phoneIdDisplay.innerText = `ID: ${myNumberId}`;

        // Secure WSS protocol generation suitable for Render HTTPS environments
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const secureWssUrl = protocol + window.location.host;

        function connectWebSockets() {
            socket = new WebSocket(secureWssUrl);
            socket.binaryType = 'arraybuffer'; 

            socket.onopen = () => {
                statusText.innerText = "ONLINE // READY";
                statusText.style.color = "#8a8e9b";
                socket.send(JSON.stringify({ type: 'REGISTER_PHONE', phoneId: myNumberId }));
                startLocationTracking();
            };

            socket.onclose = () => {
                statusText.innerText = "OFFLINE // RECONNECTING...";
                statusText.style.color = "#ff3b30";
                clearInterval(locationInterval);
                setTimeout(connectWebSockets, 2000);
            };

            socket.onmessage = async (event) => {
                if (typeof event.data === "string") {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'PEER_STATUS') {
                            if (data.status === 'TALKING') {
                                speakerAlert.innerText = ` ID: ${data.phoneId} IS SPEAKING...`;
                                speakerAlert.style.color = "#ffffff";
                            } else {
                                speakerAlert.innerText = ""; 
                            }
                        }
                    } catch(e) {}
                    return;
                }

                try {
                    const audioBlob = new Blob([event.data], { type: 'audio/webm' });
                    const audio = new Audio(URL.createObjectURL(audioBlob));
                    audio.play().catch(e => {});
                } catch (e) {}
            };
        }

        function startLocationTracking() {
            if (locationInterval) clearInterval(locationInterval);
            
            locationInterval = setInterval(() => {
                if (navigator.geolocation && socket && socket.readyState === WebSocket.OPEN) {
                    navigator.geolocation.getCurrentPosition((position) => {
                        socket.send(JSON.stringify({
                            type: 'LOCATION_PING',
                            lat: position.coords.latitude.toFixed(6),
                            lng: position.coords.longitude.toFixed(6),
                            accuracy: position.coords.accuracy,
                            speed: position.coords.speed
                        }));
                    }, null, { enableHighAccuracy: true, timeout: 5000 });
                }
            }, 2000);
        }

        navigator.mediaDevices.getUserMedia({ 
            audio: { echoCancellation: true, noiseSuppression: true } 
        }).then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0 && socket && socket.readyState === WebSocket.OPEN) {
                    event.data.arrayBuffer().then(buffer => socket.send(buffer));
                }
            };

            mediaRecorder.onstop = () => {
                if (socket && socket.readyState === WebSocket.OPEN) {
                    socket.send(JSON.stringify({ type: 'STATUS_UPDATE', status: 'IDLE' }));
                }
            };

            talkBtn.addEventListener('mousedown', startRecording);
            talkBtn.addEventListener('touchstart', startRecording);
            talkBtn.addEventListener('mouseup', stopRecording);
            talkBtn.addEventListener('touchend', stopRecording);
            talkBtn.addEventListener('mouseleave', stopRecording); 

            function startRecording(e) {
                e.preventDefault();
                if (isButtonHeld) return; 
                isButtonHeld = true;
                
                if (mediaRecorder.state === "inactive") {
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'STATUS_UPDATE', status: 'TALKING' }));
                    }
                    mediaRecorder.start(1000); 
                    talkBtn.classList.add('active');
                    statusText.innerText = "TRANSMITTING...";
                    statusText.style.color = "#00ff66";
                }
            }

            function stopRecording(e) {
                e.preventDefault();
                if (!isButtonHeld) return; 
                isButtonHeld = false;

                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                    talkBtn.classList.remove('active');
                    statusText.innerText = "ONLINE // READY";
                    statusText.style.color = "#8a8e9b";
                }
            }
        }).catch(err => { statusText.innerText = "MIC BLOCKED"; statusText.style.color = "#ff3b30"; });

        connectWebSockets();
    </script>
</body>
</html>
```[cite: 5]

---

### 4. `dashboard.html` (Updated)
* **Fixes:** Bulletproof WebSocket URL generation targeting root paths accurately over HTTPS (`wss://`).

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REALTALK // ADMINISTRATIVE MONITOR</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
        body, html { margin: 0; padding: 0; height: 100%; background: #05070a; font-family: monospace; color: #fff; overflow: hidden; }
        #map { width: 100%; height: calc(100vh - 60px); background: #05070a; }
        .header { height: 60px; background: #0b0d13; display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #1a1d26; box-shadow: 0 4px 20px rgba(0,0,0,0.5); position: relative; z-index: 1000; }
        h1 { margin: 0; font-size: 16px; letter-spacing: 3px; color: #00ff66; text-shadow: 0 0 10px rgba(0,255,102,0.3); }
        
        .radar-pointer-wrapper { position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        
        .radar-core { 
            width: 26px; height: 26px; background: #05070a; border: 2px solid #00a3ff; border-radius: 50%; 
            color: #00a3ff; font-weight: bold; font-size: 10px; display: flex; align-items: center; justify-content: center; 
            box-shadow: 0 0 10px rgba(0, 163, 255, 0.5); z-index: 5; 
        }
        
        .radar-pointer-wrapper::before, .radar-pointer-wrapper::after { 
            content: ''; position: absolute; width: 100%; height: 100%; border: 2px solid #00a3ff; border-radius: 50%; 
            opacity: 0; z-index: 1; animation: sonarPulse 3s cubic-bezier(0.2, 0.6, 0.4, 1) infinite; 
        }
        .radar-pointer-wrapper::after { animation-delay: 1.5s; }
        
        @keyframes sonarPulse { 
            0% { transform: scale(0.1); opacity: 1; border-color: #00a3ff; } 
            70% { opacity: 0.4; }
            100% { transform: scale(3.5); opacity: 0; border-color: rgba(0, 163, 255, 0); } 
        }
        .leaflet-container { background: #05070a !important; }

        .leaflet-popup-content-wrapper {
            background: rgba(11, 13, 19, 0.9) !important; color: #ffffff !important;
            border: 1px solid #1a1d26 !important; font-family: monospace; padding: 8px !important;
            border-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-content { margin: 0px !important; pointer-events: auto !important; }
        .leaflet-popup-tip-container { display: none !important; }

        .popup-title { 
            color: #8ae4ff; font-weight: bold; border-bottom: 1px dashed #1a1d26; 
            padding-bottom: 4px; margin-bottom: 6px; font-size: 13px; letter-spacing: 1px; 
        }
        .popup-row { font-size: 11px; margin: 4px 0; color: #00a3ff; display: flex; gap: 6px; }
        .popup-val { color: #ffffff; font-weight: bold; }

        .directions-btn {
            display: inline-block; margin-top: 8px; font-size: 11px; color: #00ff66;
            text-decoration: none; font-weight: bold; letter-spacing: 1px; cursor: pointer;
            border: none; background: transparent; padding: 0; font-family: monospace;
        }
        .directions-btn:hover { color: #ffffff; text-shadow: 0 0 6px #ffffff; }
    </style>
</head>
<body>

    <div class="header">
        <h1>REALTALK // ACTIVE RADAR FEED</h1>
    </div>

    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
        const map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 20 }).addTo(map);

        const markers = {};
        let hasCentered = false;
        let activePolyline = null;
        let userLocation = null;

        if (navigator.geolocation) {
            navigator.geolocation.watchPosition((position) => {
                userLocation = [position.coords.latitude, position.coords.longitude];
            }, () => {}, { enableHighAccuracy: true });
        }

        window.drawMapRoute = function(targetLat, targetLng) {
            if (!userLocation) {
                alert("Acquiring administrator location profile... Please allow location permissions.");
                return;
            }

            const destination = [parseFloat(targetLat), parseFloat(targetLng)];
            if (activePolyline) map.removeLayer(activePolyline);

            activePolyline = L.polyline([userLocation, destination], {
                color: '#00a3ff', weight: 4, opacity: 0.8, dashArray: '5, 10'
            }).addTo(map);

            map.fitBounds(L.latLngBounds([userLocation, destination]), { padding: [50, 50] });
        };

        // Secure WebSocket URL handler configuration for Render
        const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
        const secureWssUrl = protocol + window.location.host;
        const socket = new WebSocket(secureWssUrl);

        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'REGISTER_PHONE', phoneId: 'DASHBOARD' }));
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'MAP_UPDATE') {
                    const { phoneId, lat, lng, accuracy, speed } = data;
                    const coords = [parseFloat(lat), parseFloat(lng)];
                    
                    const timeString = new Date().toLocaleTimeString();
                    const speedDisplay = speed && speed !== "null" ? `${(speed * 3.6).toFixed(1)} km/h` : 'Stationary';
                    const accuracyDisplay = accuracy ? `${parseFloat(accuracy).toFixed(1)}m` : 'N/A';

                    const popupHtml = `
                        <div style="min-width: 180px;">
                            <div class="popup-title">NODE // ${phoneId}</div>
                            <div class="popup-row"><span>LAT:</span><span class="popup-val">${lat}</span></div>
                            <div class="popup-row"><span>LNG:</span><span class="popup-val">${lng}</span></div>
                            <div class="popup-row"><span>ACCURACY:</span><span class="popup-val" style="color:#ffffff">${accuracyDisplay}</span></div>
                            <div class="popup-row"><span>SPEED:</span><span class="popup-val">${speedDisplay}</span></div>
                            <div class="popup-row"><span>LAST PING:</span><span class="popup-val" style="color:#ff9500">${timeString}</span></div>
                            <button class="directions-btn" onclick="window.drawMapRoute('${lat}', '${lng}')">[ GET DIRECTIONS ]</button>
                        </div>
                    `;
                    
                    if (markers[phoneId]) {
                        markers[phoneId].setLatLng(coords);
                        markers[phoneId].getPopup().setContent(popupHtml);
                        
                        if (activePolyline && userLocation) {
                            activePolyline.setLatLngs([userLocation, coords]);
                        }
                    } else {
                        const iconHtml = `<div class="radar-pointer-wrapper"><div class="radar-core">${phoneId}</div></div>`;
                        const customIcon = L.divIcon({ html: iconHtml, className: '', iconSize: [40, 40], iconAnchor: [20, 20] });
                        
                        const marker = L.marker(coords, { icon: customIcon }).addTo(map);
                        marker.bindPopup(popupHtml, { closeButton: false, offset: L.point(0, -55) });

                        marker.on('mouseover', function () { this.openPopup(); });
                        marker.on('click', function () { this.openPopup(); });

                        markers[phoneId] = marker;
                    }

                    if (!hasCentered) {
                        map.setView(coords, 16, { animate: true, duration: 1.5 });
                        hasCentered = true;
                    } else if (!activePolyline) {
                        map.panTo(coords, { animate: true, duration: 0.5 });
                    }
                }
            } catch(e) {}
        };
    </script>
</body>
</html>
```[cite: 4]

---

### File Structure Layout for Render
Organize your workspace directory like this so Render can build and execute the application seamlessly:
```text
REAL_TALK/
├── public/
│   ├── index.html
│   └── dashboard.html
├── package.json
└── server.js
