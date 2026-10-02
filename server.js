const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Store active room members
const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // User joins frequency room
  socket.on('join-room', ({ room, username }) => {
    socket.room = room || 'ALPHA-1';
    socket.username = username || `SOLDIER-${socket.id.slice(0, 4)}`;

    socket.join(socket.room);

    if (!rooms[socket.room]) {
      rooms[socket.room] = {};
    }

    rooms[socket.room][socket.id] = {
      id: socket.id,
      username: socket.username
    };

    // Send current squad list to the joined user
    socket.emit('joined-successfully', {
      myId: socket.id,
      members: Object.values(rooms[socket.room])
    });

    // Broadcast to other users that someone joined
    socket.to(socket.room).emit('user-joined', {
      id: socket.id,
      username: socket.username
    });
  });

  // Handle Push-To-Talk state changes
  socket.on('talk-status', (data) => {
    const room = socket.room || 'ALPHA-1';
    socket.to(room).emit('user-talk-status', {
      id: socket.id,
      username: socket.username,
      talking: typeof data === 'object' ? data.talking : data
    });
  });

  // Relay real-time WebRTC audio data / audio chunks
  socket.on('audio-stream', (audioChunk) => {
    const room = socket.room || 'ALPHA-1';
    socket.to(room).emit('receive-audio', {
      id: socket.id,
      audio: audioChunk
    });
  });

  // Relay custom Emergency Alerts
  socket.on('send-alert', () => {
    const room = socket.room || 'ALPHA-1';
    io.to(room).emit('receive-alert', {
      id: socket.id,
      username: socket.username
    });
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const room = socket.room;

    if (room && rooms[room] && rooms[room][socket.id]) {
      const username = rooms[room][socket.id].username;
      delete rooms[room][socket.id];

      // Clean up empty rooms
      if (Object.keys(rooms[room]).length === 0) {
        delete rooms[room];
      }

      // Notify squad members of disconnection
      socket.to(room).emit('user-left', {
        id: socket.id,
        username: username
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Squad Radio Server running on port ${PORT}`);
});
