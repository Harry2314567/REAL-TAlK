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

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

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

    socket.emit('joined-successfully', {
      myId: socket.id,
      members: Object.values(rooms[socket.room])
    });

    socket.to(socket.room).emit('user-joined', {
      id: socket.id,
      username: socket.username
    });
  });

  // WebRTC Signaling Events
  socket.on('webrtc-offer', ({ targetId, offer }) => {
    io.to(targetId).emit('webrtc-offer', {
      senderId: socket.id,
      offer: offer
    });
  });

  socket.on('webrtc-answer', ({ targetId, answer }) => {
    io.to(targetId).emit('webrtc-answer', {
      senderId: socket.id,
      answer: answer
    });
  });

  socket.on('webrtc-ice-candidate', ({ targetId, candidate }) => {
    io.to(targetId).emit('webrtc-ice-candidate', {
      senderId: socket.id,
      candidate: candidate
    });
  });

  // Talk status updates
  socket.on('talk-status', (data) => {
    const room = socket.room || 'ALPHA-1';
    socket.to(room).emit('user-talk-status', {
      id: socket.id,
      username: socket.username,
      talking: typeof data === 'object' ? data.talking : data
    });
  });

  // Emergency Alerts
  socket.on('send-alert', () => {
    const room = socket.room || 'ALPHA-1';
    io.to(room).emit('receive-alert', {
      id: socket.id,
      username: socket.username
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const room = socket.room;

    if (room && rooms[room] && rooms[room][socket.id]) {
      delete rooms[room][socket.id];

      if (Object.keys(rooms[room]).length === 0) {
        delete rooms[room];
      }

      socket.to(room).emit('user-left', {
        id: socket.id
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Squad Radio Server running on port ${PORT}`);
});
