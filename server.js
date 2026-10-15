const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Handle WebSockets connections
io.on('connection', (socket) => {
  socket.on('audio-stream', (data) => {
    socket.broadcast.emit('audio-stream', data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
