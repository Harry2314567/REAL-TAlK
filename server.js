const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static assets from public folder
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store for channels and active users
const rooms = {};

io.on('connection', (socket) => {
  let currentRoom = null;
  let username = null;

  socket.on('join-room', ({ room, username: name, passcode }) => {
    username = name;
    
    if (!rooms[room]) {
      // Create new room with passcode
      rooms[room] = { passcode, members: {} };
    } else if (rooms[room].passcode !== passcode) {
      socket.emit('error-msg', 'Incorrect room passcode!');
      return;
    }

    currentRoom = room;
    socket.join(room);

    // Register user details
    rooms[room].members[socket.id] = { id: socket.id, username, lat: null, lng: null };

    // Send existing members list to newly joined user
    const memberList = Object.values(rooms[room].members);
    socket.emit('joined-successfully', { members: memberList, myId: socket.id });

    // Broadcast new join to channel peers
    socket.to(room).emit('user-joined', { id: socket.id, username });
  });

  // Handle location update relays
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

  // Relay WebRTC signaling data
  socket.on('signal', ({ targetId, signal }) => {
    io.to(targetId).emit('signal', { senderId: socket.id, signal });
  });

  // Relay talking indicator status
  socket.on('talk-status', (isSpeaking) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('user-talk-status', { id: socket.id, isSpeaking });
    }
  });

  // Handle disconnection and cleanup
  socket.on('disconnect', () => {
    if (currentRoom && rooms[currentRoom]) {
      delete rooms[currentRoom].members[socket.id];
      socket.to(currentRoom).emit('user-left', socket.id);

      // Clean up empty room
      if (Object.keys(rooms[currentRoom].members).length === 0) {
        delete rooms[currentRoom];
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Real Talk server running on port ${PORT}`);
});
