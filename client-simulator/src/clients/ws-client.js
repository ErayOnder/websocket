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
    this.disconnectCount = 0;
    this.disconnectTimestamps = [];
    this.wasUnexpectedDisconnect = false;
    this.closeHandlers = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.connectionStartTime = performance.now();

      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.connectionTime = performance.now() - this.connectionStartTime;
          this.isConnected = true;
          resolve(this.connectionTime);
        });

        this.ws.on('message', (data) => {
          const message = data.toString();
          this.messageHandlers.forEach(handler => handler(message));
        });

        this.ws.on('error', (error) => {
          this.logger.error(`[Client ${this.clientId}] WebSocket error: ${error.message}`);
          reject(error);
        });

        this.ws.on('close', (code, reason) => {
          const wasConnected = this.isConnected;
          this.isConnected = false;

          if (wasConnected) {
            // Track unexpected disconnects (not initiated by client)
            this.disconnectCount++;
            this.disconnectTimestamps.push({
              timestamp: Date.now(),
              code: code,
              reason: reason?.toString() || '',
              wasUnexpected: true
            });
            this.wasUnexpectedDisconnect = true;
          }

          this.closeHandlers.forEach(handler => handler({ code, reason, wasUnexpected: wasConnected }));
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
      this.wasUnexpectedDisconnect = false;
      this.ws.close();
      this.isConnected = false;
    }
  }

  clearMessageHandlers() {
    this.messageHandlers = [];
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

export default WSClient;
