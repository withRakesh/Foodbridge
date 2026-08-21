const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');

const startExpiryJob = require('./utils/expireDonations');

const PORT = process.env.PORT || 5000;

connectDB();
startExpiryJob();

// Create the raw HTTP server, wrapping our Express app
const server = http.createServer(app);

// Attach Socket.io to that same server
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});

// Make io accessible to our controllers later (important, explained below)
app.set('io', io);

// Middleware to authenticate socket connections
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error: no token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('role');

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    socket.userId = decoded.id;
    socket.userRole = user.role;
    next();
  } catch (error) {
    next(new Error('Authentication error: invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} (${socket.userRole}) connected (socket: ${socket.id})`);

  socket.join(socket.userId);              // private room, just for this user
  socket.join(`role:${socket.userRole}`);  // shared room, e.g. "role:ngo"

  socket.on('disconnect', () => {
    console.log(`User ${socket.userId} disconnected (socket: ${socket.id})`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});