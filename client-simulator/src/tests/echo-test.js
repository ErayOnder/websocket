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
      const sendTime = Date.now();

      this.pendingMessages.set(messageId, sendTime);

      const message = JSON.stringify({
        type: 'echo',
        id: messageId,
        timestamp: sendTime
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
      const receiveTime = Date.now();
      const message = JSON.parse(messageData);

      if (message.type !== 'echo') {
        return;
      }

      const messageId = message.id;
      const sendTime = this.pendingMessages.get(messageId);

      if (sendTime) {
        const rtt = receiveTime - sendTime;

        this.rttData.push({
          clientId: this.client.clientId,
          messageId: messageId,
          rtt: rtt,
          timestamp: receiveTime
        });

        this.pendingMessages.delete(messageId);
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
      return { mean: 0, median: 0, min: 0, max: 0, count: 0 };
    }

    const rtts = this.rttData.map(d => d.rtt).sort((a, b) => a - b);
    const sum = rtts.reduce((acc, val) => acc + val, 0);
    const mean = sum / rtts.length;
    const median = rtts.length % 2 === 0
      ? (rtts[rtts.length / 2 - 1] + rtts[rtts.length / 2]) / 2
      : rtts[Math.floor(rtts.length / 2)];
    const min = rtts[0];
    const max = rtts[rtts.length - 1];

    return {
      mean: parseFloat(mean.toFixed(2)),
      median: parseFloat(median.toFixed(2)),
      min: min,
      max: max,
      count: rtts.length
    };
  }
}

export default EchoTest;
