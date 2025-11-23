import { WebSocketServer } from 'ws';
import Logger from './logger.js';

class WSServer {
  constructor(port = 8080, enableLogging = false) {
    this.port = port;
    this.enableLogging = enableLogging;
    this.wss = null;
    this.clients = new Set();
    this.logger = new Logger();

    // Throughput tracking
    this.messageCount = 0;
    this.throughputInterval = null;
    this.throughputData = [];
  }

  start() {
    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('listening', () => {
      this.logger.log(`WebSocket server (ws) listening on port ${this.port}`);
      if (this.enableLogging) {
        this.startThroughputTracking();
      }
    });

    this.wss.on('connection', (ws) => {
      this.handleConnection(ws);
    });

    this.wss.on('error', (error) => {
      this.logger.error(`Server error: ${error.message}`);
    });

    process.on('SIGTERM', () => this.stop());
    process.on('SIGINT', () => this.stop());
  }

  handleConnection(ws) {
    this.clients.add(ws);

    ws.on('message', (data) => {
      this.handleMessage(ws, data);
    });

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    ws.on('error', (error) => {
      this.logger.error(`Client error: ${error.message}`);
      this.clients.delete(ws);
    });
  }

  handleMessage(ws, data) {
    this.messageCount++;

    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'ping') {
        this.handlePing(ws, message);
      } else if (message.type === 'broadcast') {
        this.handleBroadcast(ws, message);
      } else {
        ws.send(data);
      }
    } catch (error) {
      ws.send(data); // Not JSON, echo raw data back
    }
  }

  handlePing(ws, message) {
    ws.send(JSON.stringify({
      type: 'pong',
      id: message.id,
      timestamp: message.timestamp
    }));
  }

  handleBroadcast(sender, message) {
    const broadcastData = JSON.stringify(message);

    this.clients.forEach(client => {
      if (client !== sender && client.readyState === 1) {
        client.send(broadcastData);
      }
    });

    this.logger.log(`Broadcasted message ${message.id} to ${this.clients.size - 1} clients`);
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
      this.logger.appendThroughput('ws', dataPoint.timestamp, dataPoint.messagesPerSecond, dataPoint.activeConnections);
      this.logger.appendResourceMetrics('ws', dataPoint.timestamp, dataPoint.activeConnections);
    }, 1000); // Track every second
  }

  stop() {
    this.logger.log('Shutting down server...');

    if (this.throughputInterval) {
      clearInterval(this.throughputInterval);
    }

    this.clients.forEach(client => {
      client.close();
    });

    if (this.wss) {
      this.wss.close(() => {
        this.logger.log('Server stopped');
        process.exit(0);
      });
    }
  }
}

export default WSServer;
