const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// WebRTC Signaling Server
wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    // Relay WebRTC SDP offers, answers, and ICE candidates to all other peers
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`R34L_T4LK Server live on port ${PORT}`);
});
