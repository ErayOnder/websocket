import WebSocket from 'ws';

class WSClient {
  constructor(url, clientId, logger) {
    this.url = url;
    this.clientId = clientId;
    this.ws = null;
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
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.connectionTime = Date.now() - this.connectionStartTime;
          this.isConnected = true;
          resolve(this.connectionTime);
        });

        this.ws.on('message', (data) => {
          const message = data.toString();
          this.messageHandlers.forEach(handler => handler(message));
        });

        this.ws.on('error', (error) => {
          if (this.logger) {
            this.logger.error(`[Client ${this.clientId}] WebSocket error: ${error.message}`);
          } else {
            console.error(`[Client ${this.clientId}] WebSocket error:`, error.message);
          }
          reject(error);
        });

        this.ws.on('close', () => {
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
      if (!this.isConnected || !this.ws) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      this.ws.send(message, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }

  getConnectionTime() {
    return this.connectionTime;
  }
}

export default WSClient;
