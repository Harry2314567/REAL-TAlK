const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
  let currentRoom = null;
  let username = null;

  socket.on('join-room', ({ room, username: name, passcode }) => {
    username = name;
    
    if (!rooms[room]) {
      rooms[room] = { passcode, members: {} };
    } else if (rooms[room].passcode !== passcode) {
      socket.emit('error-msg', 'AUTH FAILED: ACCESS CODE INVALID');
      return;
    }

    currentRoom = room;
    socket.join(room);

    rooms[room].members[socket.id] = { id: socket.id, username, lat: null, lng: null };

    const memberList = Object.values(rooms[room].members);
    socket.emit('joined-successfully', { members: memberList, myId: socket.id });

    socket.to(room).emit('user-joined', { id: socket.id, username });
  });

  socket.on('location-update', ({ lat, lng }) => {
    if (currentRoom && rooms[currentRoom] && rooms[currentRoom].members[socket.id]) {
      rooms[currentRoom].members[socket.id].lat = lat;
      rooms[currentRoom].members[socket.id].lng = lng;

      socket.to(currentRoom).emit('friend-location', {
        id: socket.id,
        username,
        lat,
        lng
      });
    }
  });

  socket.on('signal', ({ targetId, signal }) => {
    io.to(targetId).emit('signal', { senderId: socket.id, signal });
  });

  socket.on('talk-status', (isSpeaking) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('user-talk-status', { id: socket.id, isSpeaking });
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].members[socket.id];
      socket.to(currentRoom).emit('user-left', socket.id);

      if (Object.keys(rooms[currentRoom].members).length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Tactical HUD server active on port ${PORT}`);
});
