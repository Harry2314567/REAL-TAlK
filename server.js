const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Default passcode lock
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "1234";

app.use(express.static(path.join(__dirname, 'public')));

// Store room states
const rooms = {};

io.on('connection', (socket) => {

  // Join room request
  socket.on('join-room', ({ room, username, passcode }) => {
    if (!rooms[room]) {
      rooms[room] = {
        passcode: passcode,
        members: {}
      };
    }

    // Security check
    if (rooms[room].passcode !== passcode) {
      socket.emit('error-msg', 'Access Denied: Invalid Security Lock Code!');
      return;
    }

    socket.join(room);
    socket.room = room;
    socket.username = username;

    rooms[room].members[socket.id] = {
      id: socket.id,
      username: username,
      isSpeaking: false
    };

    socket.emit('joined-successfully', {
      members: Object.values(rooms[room].members),
      myId: socket.id
    });

    socket.to(room).emit('user-joined', {
      id: socket.id,
      username: username
    });
  });

  // WebRTC Signaling
  socket.on('signal', ({ targetId, signal }) => {
    io.to(targetId).emit('signal', {
      senderId: socket.id,
      signal: signal
    });
  });

  // Push-To-Talk state updates
  socket.on('talk-status', (isTalking) => {
    if (socket.room && rooms[socket.room] && rooms[socket.room].members[socket.id]) {
      rooms[socket.room].members[socket.id].isSpeaking = isTalking;
      io.to(socket.room).emit('user-talk-status', {
        id: socket.id,
        isSpeaking: isTalking
      });
    }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    if (socket.room && rooms[socket.room]) {
      delete rooms[socket.room].members[socket.id];
      socket.to(socket.room).emit('user-left', socket.id);

      if (Object.keys(rooms[socket.room].members).length === 0) {
        delete rooms[socket.room];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Real Talk Server running on port ${PORT}`));
