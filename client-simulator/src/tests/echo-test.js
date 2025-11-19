/**
 * Echo Test Implementation
 * Measures Round Trip Time (RTT) by sending messages and measuring response time
 */

class EchoTest {
  constructor(client, logger) {
    this.client = client;
    this.logger = logger;
    this.rttData = [];
    this.messageCounter = 0;
    this.pendingMessages = new Map();
    this.messagesSent = 0;
    this.messagesReceived = 0;
    this.timeoutThreshold = 10000; // 10 seconds timeout for message loss
  }

  /**
   * Run echo test for a specified duration
   * @param {number} durationMs - Test duration in milliseconds
   * @param {number} intervalMs - Interval between messages in milliseconds
   * @returns {Promise<Array>} Array of RTT measurements
   */
  async run(durationMs = 60000, intervalMs = 100) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let intervalId;

      this.client.onMessage((message) => {
        this.handleEchoResponse(message);
      });

      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;

        if (elapsed >= durationMs) {
          clearInterval(intervalId);

          setTimeout(() => {
            this.logger.log(`Echo test completed. Total messages: ${this.rttData.length}`);
            resolve(this.rttData);
          }, 500);

          return;
        }

        this.sendEchoMessage();
      }, intervalMs);
    });
  }

  async sendEchoMessage() {
    try {
      const messageId = ++this.messageCounter;
      const sendTime = performance.now(); // High precision timing

      this.pendingMessages.set(messageId, sendTime);
      this.messagesSent++;

      const message = JSON.stringify({
        type: 'echo',
        id: messageId,
        timestamp: Date.now() // Keep Date.now() for timestamp in message
      });

      await this.client.send(message);
    } catch (error) {
      if (this.logger) {
        this.logger.error(`Failed to send echo message: ${error.message}`);
      }
    }
  }

  handleEchoResponse(messageData) {
    try {
      const receiveTime = performance.now(); // High precision timing
      // Socket.IO sends parsed objects, native WebSocket sends strings
      const message = typeof messageData === 'string' ? JSON.parse(messageData) : messageData;

      if (message.type !== 'echo') {
        return;
      }

      const messageId = message.id;
      const sendTime = this.pendingMessages.get(messageId);

      if (sendTime) {
        const rtt = receiveTime - sendTime; // RTT in milliseconds with microsecond precision

        this.rttData.push({
          clientId: this.client.clientId,
          messageId: messageId,
          rtt: rtt,
          timestamp: Date.now() // Keep Date.now() for timestamp in CSV
        });

        this.pendingMessages.delete(messageId);
        this.messagesReceived++;
      }

    } catch (error) {
      // Ignore parse errors (might be a different message format)
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
    if (this.rttData.length === 0) {
      return {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        count: 0,
        p95: 0,
        p99: 0,
        jitter: 0,
        messageLossRate: this.getMessageLossRate()
      };
    }

    const rtts = this.rttData.map(d => d.rtt).sort((a, b) => a - b);
    const sum = rtts.reduce((acc, val) => acc + val, 0);
    const mean = sum / rtts.length;
    const median = rtts.length % 2 === 0
      ? (rtts[rtts.length / 2 - 1] + rtts[rtts.length / 2]) / 2
      : rtts[Math.floor(rtts.length / 2)];
    const min = rtts[0];
    const max = rtts[rtts.length - 1];

    // Calculate percentiles
    const p95Index = Math.floor(rtts.length * 0.95);
    const p99Index = Math.floor(rtts.length * 0.99);
    const p95 = rtts[p95Index] || rtts[rtts.length - 1];
    const p99 = rtts[p99Index] || rtts[rtts.length - 1];

    // Calculate standard deviation for jitter
    const variance = rtts.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / rtts.length;
    const stdDev = Math.sqrt(variance);

    return {
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      min: min,
      max: max,
      count: rtts.length,
      p95: parseFloat(p95.toFixed(2)),
      p99: parseFloat(p99.toFixed(2)),
      jitter: parseFloat(stdDev.toFixed(2)),
      messageLossRate: this.getMessageLossRate()
    };
  }

  getMessageLossRate() {
    if (this.messagesSent === 0) {
      return 0;
    }
    const lostMessages = this.messagesSent - this.messagesReceived;
    return parseFloat(((lostMessages / this.messagesSent) * 100).toFixed(2));
  }

  getReliabilityMetrics() {
    return {
      clientId: this.client.clientId,
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      messagesLost: this.messagesSent - this.messagesReceived,
      lossRate: this.getMessageLossRate()
    };
  }
}

export default EchoTest;
