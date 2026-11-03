import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { trafficSimulator } from '../services/trafficSimulationService';

let ioInstance: SocketIOServer | null = null;

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    // Support both websocket and polling fallback
    transports: ['websocket', 'polling'],
  });

  ioInstance.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (Transport: ${socket.conn.transport.name})`);

    socket.emit('connection:ack', {
      connected: true,
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      message: 'Connected to UrbanFlow Real-Time Traffic Stream',
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });

    // Allow client to request on-demand simulation step
    socket.on('simulation:step', async () => {
      try {
        const result = await trafficSimulator.simulateTick();
        socket.emit('simulation:step:ack', result);
      } catch (err: any) {
        socket.emit('simulation:step:error', { error: err.message });
      }
    });
  });

  // Wire broadcaster into simulation service
  trafficSimulator.setBroadcaster((event: string, data: any) => {
    if (ioInstance) {
      ioInstance.emit(event, data);
    }
  });

  return ioInstance;
}

export function broadcastSocketEvent(event: string, data: any) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

export function getSocketServer(): SocketIOServer | null {
  return ioInstance;
}
