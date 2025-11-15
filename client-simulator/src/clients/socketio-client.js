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
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.connectionStartTime = Date.now();

      try {
        this.socket = io(this.url, {
          transports: ['websocket'],
          reconnection: false
        });

        this.socket.on('connect', () => {
          this.connectionTime = Date.now() - this.connectionStartTime;
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

        this.socket.on('disconnect', () => {
          this.isConnected = false;
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
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
      this.socket.close();
      this.isConnected = false;
    }
  }

  getConnectionTime() {
    return this.connectionTime;
  }
}

export default SocketIOClient;
