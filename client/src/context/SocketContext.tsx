import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSocket } from '../services/socket';

interface TrafficUpdatePayload {
  timestamp: string;
  roadsCount: number;
  roads: {
    id: string;
    roadName: string;
    congestionScore: number;
    currentSpeed: number;
    congestionCategory: string;
  }[];
}

interface SocketContextType {
  isConnected: boolean;
  lastTrafficUpdate: TrafficUpdatePayload | null;
  triggerSimulationStep: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastTrafficUpdate, setLastTrafficUpdate] = useState<TrafficUpdatePayload | null>(null);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onTrafficUpdate(data: TrafficUpdatePayload) {
      setLastTrafficUpdate(data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('traffic:update', onTrafficUpdate);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('traffic:update', onTrafficUpdate);
    };
  }, []);

  const triggerSimulationStep = () => {
    const socket = getSocket();
    socket.emit('simulation:step');
  };

  return (
    <SocketContext.Provider value={{ isConnected, lastTrafficUpdate, triggerSimulationStep }}>
      {children}
    </SocketContext.Provider>
  );
};

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
