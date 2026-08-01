/**
 * server.ts — Entry point
 * Sets up Express + Vite middleware + Socket.io
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import { setupSocketHandlers } from './io.js';
import { getRooms } from './rooms.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS']
  },
  pingInterval: 10000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1e7
});

const PORT = process.env.PORT || 3000;

// Make rooms and io available globally for cross-module access
(globalThis as any).getRooms = getRooms;
(globalThis as any).io = io;

// Setup socket handlers
setupSocketHandlers(io);

// Vite middleware (dev) or static files (prod)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 1-2-Switch Party Game Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
