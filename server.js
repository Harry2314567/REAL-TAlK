const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Serve static app files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket Binary Audio Relay
wss.on('connection', (ws) => {
  console.log('[R34L_T4LK] New peer connected.');

  ws.on('message', (data, isBinary) => {
    // Relay raw PCM binary audio data to all other connected peers
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  ws.on('close', () => {
    console.log('[R34L_T4LK] Peer disconnected.');
  });
});

server.listen(PORT, () => {
  console.log(`R34L_T4LK Server live on http://localhost:${PORT}`);
});
