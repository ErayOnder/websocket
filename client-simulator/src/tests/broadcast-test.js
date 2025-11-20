import { calculateStatistics } from '../utils/statistics.js';

/**
 * Broadcast Test
 * Measures broadcast latency where one sender broadcasts to all receivers
 * Client sends a broadcast message and waits for responses from all receivers
 */
class BroadcastTest {
  constructor(clients, logger, senderClientId = 1) {
    this.clients = clients;
    this.logger = logger;
    this.senderClientId = senderClientId;
    this.senderClient = clients.find(c => c.clientId === senderClientId);
    this.receiverClients = clients.filter(c => c.clientId !== senderClientId);
    this.latencyData = [];
    this.broadcastCounter = 0;
  }

  /**
   * Run broadcast test with manual sender (client sends broadcast trigger)
   * @param {number} durationMs - Test duration in milliseconds
   * @param {number} broadcastInterval - Interval between broadcasts in milliseconds
   * @returns {Promise<Array>} Array of broadcast latency measurements
   */
  async run(durationMs = 60000, broadcastInterval = 3000) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let intervalId;

      this.receiverClients.forEach(client => {
        client.onMessage((message) => {
          this.handleBroadcastMessage(client.clientId, message);
        });
      });

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= durationMs) {
          clearInterval(intervalId);

          setTimeout(() => {
            this.logger.log(`Broadcast test completed. Total broadcasts: ${this.broadcastCounter}, Total messages received: ${this.latencyData.length}`);
            resolve(this.latencyData);
          }, 500);

          return;
        }

        this.sendBroadcast();
      }, broadcastInterval);
    });
  }

  async sendBroadcast() {
    try {
      const broadcastId = ++this.broadcastCounter;
      const sendTime = performance.now();

      const message = JSON.stringify({
        type: 'broadcast',
        id: broadcastId,
        timestamp: sendTime
      });

      await this.senderClient.send(message);
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to send broadcast: ${error.message}`);
      }
    }
  }

  handleBroadcastMessage(clientId, messageData) {
    try {
      const receiveTime = performance.now();
      // Socket.IO sends parsed objects, native WebSocket sends strings
      const message = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;

      if (message.type !== 'broadcast') {
        return;
      }

      const broadcastId = message.id;
      const sendTime = message.timestamp;
      const latency = receiveTime - sendTime;

      this.latencyData.push({
        clientId: clientId,
        broadcastId: broadcastId,
        latency: latency,
        timestamp: Date.now()
      });

    } catch (error) {
      // Ignore parse errors (might be a different message format)
    }
  }

  getLatencyData() {
    return this.latencyData.map(d => ({
      clientId: d.clientId,
      latency: d.latency,
      timestamp: d.timestamp
    }));
  }

  getStatistics() {
    const stats = calculateStatistics(this.latencyData, 'latency');
    return {
      ...stats,
      broadcastCount: this.broadcastCounter
    };
  }

  getStatisticsByClient() {
    const clientStats = [];

    this.receiverClients.forEach(client => {
      const clientData = this.latencyData.filter(d => d.clientId === client.clientId);

      const stats = calculateStatistics(clientData, 'latency');

      clientStats.push({
        clientId: client.clientId,
        ...stats
      });
    });

    return clientStats;
  }
}

export default BroadcastTest;
