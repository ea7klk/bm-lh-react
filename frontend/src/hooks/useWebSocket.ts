import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { LastHeardEntry } from '../types';

interface UseWebSocketOptions {
  onNewEntry?: (entry: LastHeardEntry) => void;
  url?: string;
}

export function useWebSocket({ onNewEntry, url = 'http://localhost:3001' }: UseWebSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    socketRef.current = io(url, {
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    socket.on('newLastHeardEntry', (entry: LastHeardEntry) => {
      console.log('New last heard entry received:', entry);
      if (onNewEntry) {
        onNewEntry(entry);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [url, onNewEntry]);

  return {
    socket: socketRef.current,
    disconnect: () => socketRef.current?.disconnect(),
  };
}