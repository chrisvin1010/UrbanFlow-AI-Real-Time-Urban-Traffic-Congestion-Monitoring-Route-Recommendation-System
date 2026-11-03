"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
exports.broadcastSocketEvent = broadcastSocketEvent;
exports.getSocketServer = getSocketServer;
const socket_io_1 = require("socket.io");
const trafficSimulationService_1 = require("../services/trafficSimulationService");
let ioInstance = null;
function initSocketServer(httpServer) {
    ioInstance = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
        // Support both websocket and polling fallback
        transports: ['websocket', 'polling'],
    });
    ioInstance.on('connection', (socket) => {
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
                const result = await trafficSimulationService_1.trafficSimulator.simulateTick();
                socket.emit('simulation:step:ack', result);
            }
            catch (err) {
                socket.emit('simulation:step:error', { error: err.message });
            }
        });
    });
    // Wire broadcaster into simulation service
    trafficSimulationService_1.trafficSimulator.setBroadcaster((event, data) => {
        if (ioInstance) {
            ioInstance.emit(event, data);
        }
    });
    return ioInstance;
}
function broadcastSocketEvent(event, data) {
    if (ioInstance) {
        ioInstance.emit(event, data);
    }
}
function getSocketServer() {
    return ioInstance;
}
//# sourceMappingURL=trafficSocket.js.map