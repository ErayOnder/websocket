import { io } from 'socket.io-client';

class SocketIOClient {
  constructor(url, clientId, logger) {
    this.url = url;
    this.clientId = clientId;
    this.socket = null;
    this.connectionStartTime = null;
    this.connectionTime = null;
    this.isConnected = false;
    this.messageHandlers = [];
    this.logger = logger;
    this.disconnectCount = 0;
    this.disconnectTimestamps = [];
    this.wasUnexpectedDisconnect = false;
    this.closeHandlers = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.connectionStartTime = performance.now(); // High precision timing

      try {
        this.socket = io(this.url, {
          transports: ['websocket'],
          reconnection: false
        });

        this.socket.on('connect', () => {
          this.connectionTime = performance.now() - this.connectionStartTime; // High precision timing
          this.isConnected = true;
          resolve(this.connectionTime);
        });

        this.socket.on('message', (data) => {
          this.messageHandlers.forEach(handler => handler(data));
        });

        this.socket.on('connect_error', (error) => {
          if (this.logger) {
            this.logger.error(`[Client ${this.clientId}] Socket.IO error: ${error.message}`);
          } else {
            console.error(`[Client ${this.clientId}] Socket.IO error:`, error.message);
          }
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          const wasConnected = this.isConnected;
          this.isConnected = false;

          if (wasConnected) {
            // Track unexpected disconnects (not initiated by client)
            this.disconnectCount++;
            this.disconnectTimestamps.push({
              timestamp: Date.now(),
              reason: reason || '',
              wasUnexpected: true
            });
            this.wasUnexpectedDisconnect = true;
          }

          // Notify close handlers
          this.closeHandlers.forEach(handler => handler({ reason, wasUnexpected: wasConnected }));
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  onClose(handler) {
    this.closeHandlers.push(handler);
  }

  send(message) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected || !this.socket) {
        reject(new Error('Socket.IO not connected'));
        return;
      }

      this.socket.emit('message', message);
      resolve();
    });
  }

  close() {
    if (this.socket) {
      this.wasUnexpectedDisconnect = false; // Mark as expected disconnect
      this.socket.close();
      this.isConnected = false;
    }
  }

  getConnectionTime() {
    return this.connectionTime;
  }

  getConnectionStabilityMetrics() {
    return {
      clientId: this.clientId,
      disconnectCount: this.disconnectCount,
      disconnects: this.disconnectTimestamps
    };
  }
}

export default SocketIOClient;
