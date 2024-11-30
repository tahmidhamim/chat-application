const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { log } = require('console');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/api', authRoutes);
app.use('/api', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Socket.io for real-time messaging
io.on('connection', (socket) => {
  socket.on('message', (msg) => {
    io.emit('message', msg);
  });
  socket.on('notification', (msg) => {
    io.emit('notification', msg);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    server.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error('DB connection failed', err));
