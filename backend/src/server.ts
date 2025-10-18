import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import lastHeardRoutes from './routes/lastHeardRoutes';
import { startBrandmeisterService, stopBrandmeisterService } from './services/brandmeisterService';
import { initializeDatabase } from './services/databaseService';
import { initializeWebSocket } from './services/websocketService';

dotenv.config();

const app: Application = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'BM Last Heard API is running' });
});

app.use('/api/lastheard', lastHeardRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
server.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize WebSocket
  initializeWebSocket(server);
  
  // Initialize database
  await initializeDatabase();
  
  // Start Brandmeister websocket service
  startBrandmeisterService();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  stopBrandmeisterService();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  stopBrandmeisterService();
  process.exit(0);
});

export default app;
