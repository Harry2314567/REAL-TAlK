const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: '*' } 
});

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Relay live audio and peer telemetry
io.on('connection', (socket) => {
  console.log(`[OPERATOR CONNECTED]: ${socket.id}`);

  // Broadcast audio chunk to other operators
  socket.on('audio-stream', (data) => {
    socket.broadcast.emit('audio-stream', { id: socket.id, audio: data });
  });

  // Broadcast tactical GPS telemetry coordinates
  socket.on('telemetry', (data) => {
    socket.broadcast.emit('telemetry', { id: socket.id, ...data });
  });

  socket.on('disconnect', () => {
    console.log(`[OPERATOR DISCONNECTED]: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`REAL_TALK command server active on port ${PORT}`);
});
