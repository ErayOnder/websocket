/**
 * Broadcast Test Implementation
 * Measures broadcast latency where one sender broadcasts to all receivers
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
      const sendTime = Date.now();

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
      const receiveTime = Date.now();
      const message = JSON.parse(messageData);

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
        timestamp: receiveTime
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
    if (this.latencyData.length === 0) {
      return { mean: 0, median: 0, min: 0, max: 0, count: 0, broadcastCount: 0 };
    }

    const latencies = this.latencyData.map(d => d.latency).sort((a, b) => a - b);
    const sum = latencies.reduce((acc, val) => acc + val, 0);
    const mean = sum / latencies.length;
    const median = latencies.length % 2 === 0
      ? (latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2
      : latencies[Math.floor(latencies.length / 2)];
    const min = latencies[0];
    const max = latencies[latencies.length - 1];

    return {
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      min: min,
      max: max,
      count: latencies.length,
      broadcastCount: this.broadcastCounter
    };
  }

  getStatisticsByClient() {
    const clientStats = [];

    this.receiverClients.forEach(client => {
      const clientData = this.latencyData.filter(d => d.clientId === client.clientId);

      if (clientData.length === 0) {
        clientStats.push({
          clientId: client.clientId,
          mean: 0,
          median: 0,
          min: 0,
          max: 0,
          count: 0
        });
        return;
      }

      const latencies = clientData.map(d => d.latency).sort((a, b) => a - b);
      const sum = latencies.reduce((acc, val) => acc + val, 0);
      const mean = sum / latencies.length;
      const median = latencies.length % 2 === 0
        ? (latencies[latencies.length / 2 - 1] + latencies[latencies.length / 2]) / 2
        : latencies[Math.floor(latencies.length / 2)];

      clientStats.push({
        clientId: client.clientId,
        mean: parseFloat(mean.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        min: latencies[0],
        max: latencies[latencies.length - 1],
        count: latencies.length
      });
    });

    return clientStats;
  }
}

export default BroadcastTest;
