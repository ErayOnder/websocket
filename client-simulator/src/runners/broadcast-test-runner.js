import TestRunner from './test-runner.js';
import BroadcastTest from '../tests/broadcast-test.js';

class BroadcastTestRunner extends TestRunner {
  validateConfig(config) {
    super.validateConfig(config);
    if (typeof config.broadcastInterval !== 'number' || config.broadcastInterval <= 0) {
      throw new Error("BroadcastTestRunner: Missing or invalid config option: broadcastInterval");
    }
  }

  getFileTypes() {
    return ['broadcast_latency'];
  }

  logTestStart(loadPhases, iterations) {
    this.logger.log('Starting Phased Broadcast Test');
    this.logger.log(`Load phases: ${loadPhases.join(', ')}`);
    this.logger.log(`Iterations per phase: ${iterations}`);
    this.logger.log(`Client type: ${this.config.clientType} | Server name: ${this.config.serverName} in ${this.config.serverUrl}`);
    this.logger.log(`Duration: ${this.config.testDuration}ms | Broadcast interval: ${this.config.broadcastInterval}ms`);
    this.logger.log('===');
  }

  logTestComplete() {
    this.logger.log('');
    this.logger.log('===');
    this.logger.log('Phased Broadcast Test Complete');
  }

  async run(numClients, metrics = ['broadcast_latency']) {
    const clients = this.createClients(numClients);

    try {
      const { connectedClients, failedConnections } = await this.connectClients(clients);
      const { stats, clientStats, latencyData } = await this.runBroadcastTests(connectedClients);

      if (metrics.includes('broadcast_latency')) {
        this.logger.writeBroadcastLatency(this.config.serverName, numClients, latencyData);
      }

      this.closeClients(connectedClients);

      return {
        success: true,
        stats: stats,
        clientStats: clientStats,
        clientCount: numClients,
        connectedClientCount: connectedClients.length,
        failedConnectionCount: failedConnections.length,
        broadcastCount: stats.broadcastCount,
        messageCount: stats.count
      };

    } catch (error) {
      this.logger.error(`Broadcast test failed: ${error.message}`);
      this.closeClients(clients);

      return {
        success: false,
        error: error.message
      };
    }
  }

  async runBroadcastTests(connectedClients) {
    this.logger.log('Running broadcast test...');
    const broadcastTest = new BroadcastTest(connectedClients, this.logger, 1);
    await broadcastTest.run(this.config.testDuration, this.config.broadcastInterval);

    const stats = broadcastTest.getStatistics();
    const clientStats = broadcastTest.getStatisticsByClient();
    const latencyData = broadcastTest.getLatencyData();

    this.logger.log(`${connectedClients.length} clients broadcasted ${stats.broadcastCount} messages successfully`);
    return {
      stats,
      clientStats,
      latencyData
    };
  }
}

export default BroadcastTestRunner;
