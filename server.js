const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { origin: '*' } 
});

// Serve static assets from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Store active operators and telemetry
const operators = {};

io.on('connection', (socket) => {
  console.log(`[OPERATOR CONNECTED]: ${socket.id}`);

  // Voice stream broadcast
  socket.on('audio-stream', (data) => {
    socket.broadcast.emit('audio-stream', {
      sender: socket.id,
      buffer: data
    });
  });

  // GPS Telemetry updates
  socket.on('telemetry', (data) => {
    operators[socket.id] = { id: socket.id, ...data };
    io.emit('telemetry-update', operators);
  });

  socket.on('disconnect', () => {
    console.log(`[OPERATOR DISCONNECTED]: ${socket.id}`);
    delete operators[socket.id];
    io.emit('telemetry-update', operators);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`REAL_TALK server operating on port ${PORT}`);
});
