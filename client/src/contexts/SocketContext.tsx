import React, { createContext, useContext, useEffect, useMemo, useState, PropsWithChildren } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../config';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const defaultValue: SocketContextType = { socket: null, isConnected: false };
const SocketContext = createContext<SocketContextType>(defaultValue);
export function SocketProvider({ children }: PropsWithChildren<{}>) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
  // Prefer API_BASE origin if defined; else use current origin
    let url: string | undefined;
    try {
      if (API_BASE) {
        const u = new URL(API_BASE);
        // Connect sockets directly to backend origin
        url = `${u.protocol}//${u.host}`;
      }
    } catch {}
    if (!url && typeof window !== 'undefined') {
      url = `${window.location.protocol}//${window.location.host}`;
    }

    const s = io(url || '', {
      path: '/socket.io',
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      withCredentials: true,
    });
    setSocket(s);
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', (err) => {
      console.warn('Socket connect_error:', err?.message || err);
    });
    s.on('error', (err) => {
      console.warn('Socket error:', err);
    });
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error');
      s.off('error');
      s.close();
    };
  }, []);

  const value = useMemo<SocketContextType>(() => ({ socket, isConnected }), [socket, isConnected]);
  return React.createElement(SocketContext.Provider, { value }, children as React.ReactNode);
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
