import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { LastHeardEntry } from '../models/LastHeard';

let io: Server | null = null;

export function initializeWebSocket(server: HttpServer): void {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to WebSocket:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected from WebSocket:', socket.id);
    });
  });

  console.log('WebSocket server initialized');
}

export function broadcastNewEntry(entry: LastHeardEntry): void {
  if (io) {
    io.emit('newLastHeardEntry', entry);
  }
}

export function getWebSocketInstance(): Server | null {
  return io;
}