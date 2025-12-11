const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { initWebSocket } = require('./websocket');

const app = express();
const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://projectflow-omega.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   🚀 ProjectFlow API Server               ║
  ║                                           ║
  ║   Server running on port ${PORT}            ║
  ║   WebSocket enabled                       ║
  ║                                           ║
  ║   API: http://localhost:${PORT}/api         ║
  ║   Health: http://localhost:${PORT}/health   ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = { app, server };
