import { Server } from 'socket.io';
import { createServer } from 'http';
import Logger from './logger.js';

class SocketIOServer {
  constructor(port = 3000, enableLogging = false) {
    this.port = port;
    this.enableLogging = enableLogging;
    this.httpServer = null;
    this.io = null;
    this.clients = new Map();
    this.logger = new Logger();

    // Throughput tracking
    this.messageCount = 0;
    this.throughputInterval = null;
    this.throughputData = [];
  }

  start() {
    this.httpServer = createServer();
    this.io = new Server(this.httpServer, {
      transports: ['websocket'],
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
    });

    this.httpServer.listen(this.port, () => {
      this.logger.log(`Socket.IO server listening on port ${this.port}`);
      if (this.enableLogging) {
        this.startThroughputTracking();
      }
    });

    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  handleConnection(socket) {
    this.clients.set(socket.id, socket);
    this.logger.log(`Client connected. Total clients: ${this.clients.size}`);

    socket.on('message', (data) => {
      this.handleMessage(socket, data);
    });

    socket.on('disconnect', () => {
      this.clients.delete(socket.id);
      this.logger.log(`Client disconnected. Total clients: ${this.clients.size}`);
    });

    socket.on('error', (error) => {
      this.logger.error(`Client error: ${error.message}`);
      this.clients.delete(socket.id);
    });
  }

  handleMessage(socket, data) {
    this.messageCount++;

    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;

      if (message.type === 'ping') {
        this.handlePing(socket, message);
      } else if (message.type === 'broadcast') {
        this.handleBroadcast(socket, message);
      } else {
        socket.emit('message', message);
      }
    } catch (error) {
      socket.emit('message', data);
    }
  }

  handlePing(socket, message) {
    socket.emit('message', {
      type: 'pong',
      id: message.id,
      timestamp: message.timestamp
    });
  }

  handleBroadcast(sender, message) {
    let broadcastCount = 0;

    this.clients.forEach((client, clientId) => {
      if (clientId !== sender.id) {
        client.emit('message', message);
        broadcastCount++;
      }
    });

    this.logger.log(`Broadcasted message ${message.id} to ${broadcastCount} clients`);
  }

  startThroughputTracking() {
    let lastMessageCount = 0;

    this.throughputInterval = setInterval(() => {
      const messagesPerSecond = this.messageCount - lastMessageCount;
      lastMessageCount = this.messageCount;

      const dataPoint = {
        timestamp: Date.now(),
        messagesPerSecond: messagesPerSecond,
        activeConnections: this.clients.size
      };

      this.throughputData.push(dataPoint);
      this.logger.appendThroughput('socketio', dataPoint.timestamp, dataPoint.messagesPerSecond, dataPoint.activeConnections);
      this.logger.appendResourceMetrics('socketio', dataPoint.timestamp, dataPoint.activeConnections);
    }, 1000); // Track every second
  }

  stop() {
    this.logger.log('Shutting down server...');

    if (this.throughputInterval) {
      clearInterval(this.throughputInterval);
    }

    this.clients.forEach((socket) => {
      socket.disconnect(true);
    });

    if (this.io) {
      this.io.close(() => {
        if (this.httpServer) {
          this.httpServer.close(() => {
            this.logger.log('Server stopped');
            process.exit(0);
          });
        }
      });
    }
  }
}

export default SocketIOServer;
