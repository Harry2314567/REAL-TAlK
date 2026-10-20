const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Serve public static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Store active room sockets & member states
const rooms = {};

wss.on('connection', (ws) => {
  let currentRoom = null;
  let memberId = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // Join Room Event
      if (data.type === 'JOIN_ROOM') {
        currentRoom = data.roomID || 'TRIP-ALPHA-01';
        memberId = data.memberId || `RIDER_${Math.floor(1000 + Math.random() * 9000)}`;

        if (!rooms[currentRoom]) {
          rooms[currentRoom] = new Set();
        }
        rooms[currentRoom].add(ws);
        ws.memberId = memberId;

        broadcastToRoom(currentRoom, {
          type: 'SYSTEM_LOG',
          message: `${memberId} joined room ${currentRoom}`,
          members: Array.from(rooms[currentRoom]).map(s => s.memberId)
        });
      }

      // Voice Audio & PTT Broadcast
      if (data.type === 'AUDIO_DATA' || data.type === 'PTT_STATUS') {
        broadcastToRoom(currentRoom, data, ws);
      }

      // GPS Telemetry & Route Sync
      if (data.type === 'GPS_UPDATE') {
        broadcastToRoom(currentRoom, {
          type: 'PEER_GPS',
          sender: memberId,
          lat: data.lat,
          lon: data.lon,
          speed: data.speed,
          alt: data.alt,
          heading: data.heading
        }, ws);
      }

      // AI Party Media Sync Event
      if (data.type === 'PARTY_MEDIA_SYNC') {
        broadcastToRoom(currentRoom, {
          type: 'PARTY_MEDIA_SYNC',
          sender: memberId,
          mediaUrl: data.mediaUrl,
          targetMembers: data.targetMembers,
          action: data.action
        });
      }

      // SOS Emergency Broadcast
      if (data.type === 'SOS_ALERT') {
        broadcastToRoom(currentRoom, {
          type: 'SOS_ALERT',
          sender: memberId,
          lat: data.lat,
          lon: data.lon,
          roomID: currentRoom
        });
      }

    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms[currentRoom]) {
      rooms[currentRoom].delete(ws);
      if (rooms[currentRoom].size === 0) {
        delete rooms[currentRoom];
      } else {
        broadcastToRoom(currentRoom, {
          type: 'SYSTEM_LOG',
          message: `${memberId} disconnected`,
          members: Array.from(rooms[currentRoom]).map(s => s.memberId)
        });
      }
    }
  });
});

function broadcastToRoom(roomID, payload, excludeSocket = null) {
  if (!rooms[roomID]) return;
  const msg = JSON.stringify(payload);
  rooms[roomID].forEach((client) => {
    if (client !== excludeSocket && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

server.listen(PORT, () => {
  console.log(`R34L_T4LK Server running on port ${PORT}`);
});
