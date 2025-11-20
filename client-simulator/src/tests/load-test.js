import { calculateStatistics, calculateMessageLossRate } from '../utils/statistics.js';

/**
 * Load Test Implementation
 * Measures performance under load by sending periodic pings to all clients
 * Similar to EchoTest but designed for simultaneous multi-client load
 */
class LoadTest {
  constructor(clients, logger, config = {}) {
    this.clients = clients;
    this.logger = logger;
    this.config = {
      messageInterval: config.messageInterval || 100,
      ...config
    };

    this.rttData = [];
    this.messageCounter = 0;
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.startTime = null;
  }

  /**
   * Run load test for specified duration
   * @param {number} durationMs - Test duration in milliseconds
   * @param {number} messageInterval - Interval between messages in milliseconds
   * @returns {Promise<Array>} RTT data
   */
  async run(durationMs, messageInterval) {
    this.startTime = Date.now();
    this.rttData = [];
    this.messagesSent = 0;
    this.messagesReceived = 0;

    this.clients.forEach(client => {
      client.onMessage((message) => {
        this.handleResponse(client.clientId, message);
      });
    });

    const endTime = Date.now() + durationMs;

    while (Date.now() < endTime) {
      await this.sendPingToAllClients();
      await this.sleep(messageInterval);
    }

    // Wait for final responses
    await this.sleep(500);

    return this.rttData;
  }

  async sendPingToAllClients() {
    const timestamp = Date.now();

    const promises = this.clients.map(async (client) => {
      if (!client.isConnected) {
        return;
      }

      try {
        const messageId = ++this.messageCounter;
        const sendTime = performance.now();

        if (!client._loadTestPending) {
          client._loadTestPending = new Map();
        }
        client._loadTestPending.set(messageId, sendTime);

        this.messagesSent++;

        const message = JSON.stringify({
          type: 'ping',
          id: messageId,
          timestamp: timestamp
        });

        await client.send(message);
      } catch (error) {
        if (this.logger) {
          this.logger.error(`Client ${client.clientId} failed to send: ${error.message}`);
        }
      }
    });

    await Promise.allSettled(promises);
  }

  handleResponse(clientId, messageData) {
    try {
      const receiveTime = performance.now();
      // Socket.IO sends parsed objects, native WebSocket sends strings
      const message = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;

      if (message.type !== 'pong') {
        return;
      }

      const client = this.clients.find(c => c.clientId === clientId);
      if (!client || !client._loadTestPending) {
        return;
      }

      const messageId = message.id;
      const sendTime = client._loadTestPending.get(messageId);

      if (sendTime !== undefined) {
        const rtt = receiveTime - sendTime;
        this.rttData.push({
          clientId: clientId,
          messageId: messageId,
          rtt: rtt,
          timestamp: Date.now()
        });

        client._loadTestPending.delete(messageId);
        this.messagesReceived++;
      }
    } catch (error) {
      // Ignore parse errors
    }
  }

  getRTTData() {
    return this.rttData.map(d => ({
      clientId: d.clientId,
      rtt: d.rtt,
      timestamp: d.timestamp
    }));
  }

  getStatistics() {
    return calculateStatistics(this.rttData, 'rtt', {
      includePercentiles: true,
      includeJitter: false
    });
  }

  getReliabilityData() {
    return {
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      messagesLost: this.messagesSent - this.messagesReceived,
      lossRate: calculateMessageLossRate(this.messagesSent, this.messagesReceived)
    };
  }

  cleanup() {
    this.clients.forEach(client => {
      if (client._loadTestPending) {
        client._loadTestPending.clear();
        delete client._loadTestPending;
      }
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default LoadTest;
