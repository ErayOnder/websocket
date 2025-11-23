import TestRunner from './test-runner.js';
import LoadTest from '../tests/load-test.js';
import { calculateStatistics } from '../utils/statistics.js';

class LoadTestRunner extends TestRunner {
  validateConfig(config) {
    super.validateConfig(config);
    if (typeof config.messageInterval !== 'number' || config.messageInterval <= 0) {
      throw new Error("LoadTestRunner: Missing or invalid config option: messageInterval");
    }
  }

  getFileTypes() {
    return ['rtt', 'connection_time'];
  }

  logTestStart(loadPhases, iterations) {
    this.logger.log('Starting Progressive Load Test');
    this.logger.log(`Load phases: ${loadPhases.join(', ')}`);
    this.logger.log(`Iterations per phase: ${iterations}`);
    this.logger.log(`Client type: ${this.config.clientType} | Server name: ${this.config.serverName} in ${this.config.serverUrl}`);
    this.logger.log(`Duration: ${this.config.testDuration}ms | Message interval: ${this.config.messageInterval}ms`);
    this.logger.log('===');
  }

  logTestComplete() {
    this.logger.log('');
    this.logger.log('===');
    this.logger.log('Progressive Load Test Complete');
  }

  async run(numClients, metrics = ['rtt', 'connection_time', 'reliability', 'connection_stability']) {
    const clients = this.createClients(numClients);

    try {
      const { connectedClients, connectionData, failedConnections } = await this.connectClients(clients);
      const { allRTTData, reliabilityData, stabilityData } = await this.runLoadTests(connectedClients);

      if (metrics.includes('rtt')) {
        this.logger.writeRTT(this.config.serverName, numClients, allRTTData);
      }

      if (metrics.includes('connection_time')) {
        this.logger.writeConnectionTime(this.config.serverName, numClients, connectionData);
      }

      this.closeClients(connectedClients);

      const stats = calculateStatistics(allRTTData, 'rtt', {
        includePercentiles: true,
        includeJitter: true
      });

      return {
        success: true,
        stats: stats,
        connectedClientCount: connectedClients.length,
        failedConnectionCount: failedConnections.length,
        reliabilityData: reliabilityData,
        connectionData: connectionData,
        stabilityData: stabilityData
      };

    } catch (error) {
      this.logger.error(`Load test failed: ${error.message}`);
      this.closeClients(clients);

      return {
        success: false,
        error: error.message
      };
    }
  }

  async runLoadTests(connectedClients) {
    this.logger.log('Running load tests...');
    const loadTest = new LoadTest(connectedClients, this.logger, {
      messageInterval: this.config.messageInterval
    });

    try {
      await loadTest.run(this.config.testDuration, this.config.messageInterval);
      const allRTTData = loadTest.getRTTData();
      const reliabilityData = loadTest.getReliabilityData();
      const stabilityData = connectedClients.map(client => client.getConnectionStabilityMetrics());
      loadTest.cleanup();

      this.logger.log(`Load test completed successfully`);
      this.logger.log(`  Messages sent: ${reliabilityData.messagesSent}`);
      this.logger.log(`  Messages received: ${reliabilityData.messagesReceived}`);
      this.logger.log(`  Message loss rate: ${reliabilityData.lossRate.toFixed(2)}%`);

      return {
        allRTTData,
        reliabilityData,
        stabilityData,
      };

    } catch (error) {
      this.logger.error(`Load test execution failed: ${error.message}`);
      throw error;
    }
  }
}

export default LoadTestRunner;
