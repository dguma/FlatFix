import React, { createContext, useContext, ReactNode, useEffect, useMemo, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../config';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Prefer API_BASE origin if defined; else use current origin
    let url: string | undefined;
    try {
      if (API_BASE) {
        const u = new URL(API_BASE);
        url = `${u.protocol}//${u.host}`;
      }
    } catch {}
    if (!url && typeof window !== 'undefined') {
      url = `${window.location.protocol}//${window.location.host}`;
    }

    const s = io(url || '', {
      autoConnect: true,
      transports: ['websocket'],
      withCredentials: true
    });
    setSocket(s);
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.close();
    };
  }, []);

  const value = useMemo<SocketContextType>(() => ({ socket, isConnected }), [socket, isConnected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
