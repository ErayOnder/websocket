import WSClient from '../clients/ws-client.js';
import SocketIOClient from '../clients/socketio-client.js';
import EchoTest from '../tests/echo-test.js';
import BroadcastTest from '../tests/broadcast-test.js';
import Logger from '../utils/logger.js';

class TestRunner {
  constructor(config = {}) {
    this.config = {
      serverUrl: config.serverUrl || 'ws://localhost:8080',
      libraryName: config.libraryName || 'ws',
      clientType: config.clientType || 'ws', // 'ws' or 'socketio'
      testDuration: config.testDuration || 60000, // 60 seconds
      messageInterval: config.messageInterval || 100, // 100ms between messages
      ...config
    };
    this.logger = new Logger();
  }

  async runSingleEchoTest() {
    this.logger.log(`Starting Echo Test - Single Client`);
    this.logger.log(`Server: ${this.config.serverUrl}`);
    this.logger.log(`Duration: ${this.config.testDuration}ms`);
    this.logger.log('---');

    const ClientClass = this.config.clientType === 'socketio' ? SocketIOClient : WSClient;
    const client = new ClientClass(this.config.serverUrl, 1, this.logger);

    try {
      // Connect client
      const connectionTime = await client.connect();
      this.logger.log(`Client connected in ${connectionTime}ms`);

      // Run echo test
      const echoTest = new EchoTest(client, this.logger);
      const rttData = await echoTest.run(this.config.testDuration, this.config.messageInterval);

      // Get statistics
      const stats = echoTest.getStatistics();
      this.logger.log(`RTT Statistics: Mean=${stats.mean}ms, Median=${stats.median}ms, Min=${stats.min}ms, Max=${stats.max}ms, Count=${stats.count}`);

      // Write to CSV
      this.logger.writeRTT(this.config.libraryName, 1, echoTest.getRTTData());
      this.logger.writeConnectionTime(this.config.libraryName, 1, [{
        clientId: 1,
        connectionTime: connectionTime
      }]);

      // Close client
      client.close();
      this.logger.log('Client closed');

      return {
        success: true,
        stats: stats,
        connectionTime: connectionTime,
        messageCount: rttData.length
      };

    } catch (error) {
      this.logger.error(`Echo test failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run echo test with multiple clients
   * @param {number} numClients - Number of concurrent clients
   * @returns {Promise<Object>} Test results and statistics
   */
  async runMultiClientEchoTest(numClients) {
    this.logger.log(`Starting Echo Test - ${numClients} Concurrent Clients`);
    this.logger.log(`Server: ${this.config.serverUrl}`);
    this.logger.log(`Duration: ${this.config.testDuration}ms`);
    this.logger.log('---');

    const ClientClass = this.config.clientType === 'socketio' ? SocketIOClient : WSClient;
    const clients = [];
    const echoTests = [];
    const connectionData = [];

    // Create clients
    for (let i = 0; i < numClients; i++) {
      const client = new ClientClass(this.config.serverUrl, i + 1, this.logger);
      clients.push(client);
    }

    try {
      // Connect all clients
      this.logger.log('Connecting clients...');
      const connectionPromises = clients.map(async (client) => {
        const connectionTime = await client.connect();
        connectionData.push({
          clientId: client.clientId,
          connectionTime: connectionTime
        });
        return { clientId: client.clientId, success: true };
      });

      const connectionResults = await Promise.allSettled(connectionPromises);
      const successfulClientIds = new Set();
      const failedConnections = [];

      connectionResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const clientId = clients[index].clientId;
          this.logger.error(`Client ${clientId} connection failed: ${result.reason.message}`);
          failedConnections.push(clientId);
        } else {
          successfulClientIds.add(result.value.clientId);
        }
      });
      const connectedClients = clients.filter(client => successfulClientIds.has(client.clientId));

      if (connectedClients.length === 0) {
        throw new Error('All clients failed to connect');
      }
      this.logger.log(`${connectedClients.length}/${numClients} clients connected successfully${failedConnections.length > 0 ? ` (${failedConnections.length} failed)` : ''}`);

      // Run echo tests concurrently on connected clients only
      this.logger.log('Running echo tests...');
      const testPromises = connectedClients.map(async (client) => {
        const echoTest = new EchoTest(client, this.logger);
        echoTests.push(echoTest);
        await echoTest.run(this.config.testDuration, this.config.messageInterval);
        return { clientId: client.clientId, success: true };
      });

      const testResults = await Promise.allSettled(testPromises);

      const failedTests = [];
      testResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const clientId = connectedClients[index].clientId;
          this.logger.error(`Client ${clientId} echo test failed: ${result.reason.message}`);
          failedTests.push(clientId);
        }
      });
      if (failedTests.length > 0) {
        this.logger.log(`${testResults.length - failedTests.length}/${connectedClients.length} echo tests completed successfully (${failedTests.length} failed)`);
      }

      // Aggregate RTT data from all clients
      const allRTTData = [];
      echoTests.forEach(test => {
        allRTTData.push(...test.getRTTData());
      });

      // Calculate overall statistics
      const allRTTs = allRTTData.map(d => d.rtt).sort((a, b) => a - b);
      const mean = allRTTs.reduce((acc, val) => acc + val, 0) / allRTTs.length;
      const median = allRTTs.length % 2 === 0
        ? (allRTTs[allRTTs.length / 2 - 1] + allRTTs[allRTTs.length / 2]) / 2
        : allRTTs[Math.floor(allRTTs.length / 2)];

      const stats = {
        mean: parseFloat(mean.toFixed(2)),
        median: parseFloat(median.toFixed(2)),
        min: allRTTs[0],
        max: allRTTs[allRTTs.length - 1],
        count: allRTTs.length
      };

      this.logger.log(`Overall RTT Statistics: Mean=${stats.mean}ms, Median=${stats.median}ms, Min=${stats.min}ms, Max=${stats.max}ms, Count=${stats.count}`);

      // Collect reliability metrics from echo tests
      const reliabilityData = [];
      echoTests.forEach(test => {
        reliabilityData.push(test.getReliabilityMetrics());
      });

      // Collect connection stability metrics from clients
      const stabilityData = [];
      connectedClients.forEach(client => {
        const stability = client.getConnectionStabilityMetrics();
        stabilityData.push(stability);
      });

      // Write to CSV
      this.logger.writeRTT(this.config.libraryName, numClients, allRTTData);
      this.logger.writeConnectionTime(this.config.libraryName, numClients, connectionData);
      this.logger.writeReliabilityMetrics(this.config.libraryName, numClients, reliabilityData);
      this.logger.writeConnectionStability(this.config.libraryName, numClients, stabilityData);

      // Close all connected clients
      connectedClients.forEach(client => client.close());
      this.logger.log('All clients closed');

      return {
        success: true,
        stats: stats,
        clientCount: numClients,
        connectedClientCount: connectedClients.length,
        failedConnectionCount: failedConnections.length,
        failedTestCount: failedTests.length,
        messageCount: allRTTData.length
      };

    } catch (error) {
      this.logger.error(`Multi-client echo test failed: ${error.message}`);
      // Clean up any connecte  d clients
      clients.forEach(client => {
        try {
          client.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run echo test across all load phases
   * @param {Array<number>} loadPhases - Array of client counts (default: [100, 200, 400, 600, 800, 1000])
   * @param {number} iterations - Number of iterations per load phase (default: 3)
   * @returns {Promise<Array>} Results for all phases
   */
  async runPhasedEchoTest(loadPhases = [100, 200, 400, 600, 800, 1000], iterations = 3) {
    this.logger.log('Starting Phased Echo Test');
    this.logger.log(`Load phases: ${loadPhases.join(', ')}`);
    this.logger.log(`Iterations per phase: ${iterations}`);
    this.logger.log('===');

    this.logger.clearPhasedTestData(this.config.libraryName, loadPhases);

    const results = [];

    for (const numClients of loadPhases) {
      for (let iteration = 1; iteration <= iterations; iteration++) {
        this.logger.log('');
        this.logger.log(`Phase: ${numClients} clients - Iteration ${iteration}/${iterations}`);
        this.logger.log('---');

        const result = await this.runMultiClientEchoTest(numClients);
        results.push({
          numClients,
          iteration,
          ...result
        });

        // Wait a bit between iterations
        if (iteration < iterations) {
          this.logger.log('Waiting 5 seconds before next iteration...');
          await this.sleep(5000);
        }
      }

      // Wait between load phases
      if (numClients !== loadPhases[loadPhases.length - 1]) {
        this.logger.log('Waiting 10 seconds before next phase...');
        await this.sleep(10000);
      }
    }

    this.logger.log('');
    this.logger.log('===');
    this.logger.log('Phased Echo Test Complete');
    return results;
  }

  /**
   * Run broadcast test with multiple clients
   * @param {number} numClients - Number of concurrent clients
   * @param {number} broadcastInterval - Interval between broadcasts (default: 3000ms)
   * @returns {Promise<Object>} Test results and statistics
   */
  async runBroadcastTest(numClients, broadcastInterval = 3000) {
    this.logger.log(`Starting Broadcast Test - ${numClients} Concurrent Clients`);
    this.logger.log(`Server: ${this.config.serverUrl}`);
    this.logger.log(`Duration: ${this.config.testDuration}ms`);
    this.logger.log(`Broadcast interval: ${broadcastInterval}ms`);
    this.logger.log('---');

    const ClientClass = this.config.clientType === 'socketio' ? SocketIOClient : WSClient;
    const clients = [];
    const connectionData = [];

    // Create clients
    for (let i = 0; i < numClients; i++) {
      const client = new ClientClass(this.config.serverUrl, i + 1, this.logger);
      clients.push(client);
    }

    try {
      // Connect all clients
      this.logger.log('Connecting clients...');
      const connectionPromises = clients.map(async (client) => {
        const connectionTime = await client.connect();
        connectionData.push({
          clientId: client.clientId,
          connectionTime: connectionTime
        });
        this.logger.log(`Client ${client.clientId} connected in ${connectionTime}ms`);
        return { clientId: client.clientId, success: true };
      });

      const connectionResults = await Promise.allSettled(connectionPromises);
      const successfulClientIds = new Set();
      const failedConnections = [];

      connectionResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const clientId = clients[index].clientId;
          this.logger.error(`Client ${clientId} connection failed: ${result.reason.message}`);
          failedConnections.push(clientId);
        } else {
          successfulClientIds.add(result.value.clientId);
        }
      });
      const connectedClients = clients.filter(client => successfulClientIds.has(client.clientId));

      if (connectedClients.length === 0) {
        throw new Error('All clients failed to connect');
      }
      this.logger.log(`${connectedClients.length}/${numClients} clients connected successfully${failedConnections.length > 0 ? ` (${failedConnections.length} failed)` : ''}`);

      this.logger.log('Running broadcast test...');
      const broadcastTest = new BroadcastTest(connectedClients, this.logger, 1);
      await broadcastTest.run(this.config.testDuration, broadcastInterval);

      // Get statistics
      const stats = broadcastTest.getStatistics();
      const clientStats = broadcastTest.getStatisticsByClient();

      this.logger.log(`Overall Broadcast Latency: Mean=${stats.mean}ms, Median=${stats.median}ms, Min=${stats.min}ms, Max=${stats.max}ms`);
      this.logger.log(`Total broadcasts: ${stats.broadcastCount}, Total messages received: ${stats.count}`);

      // Collect connection stability metrics from clients
      const stabilityData = [];
      connectedClients.forEach(client => {
        const stability = client.getConnectionStabilityMetrics();
        stabilityData.push(stability);
      });

      // Write to CSV
      this.logger.writeBroadcastLatency(this.config.libraryName, numClients, broadcastTest.getLatencyData());
      this.logger.writeConnectionTime(this.config.libraryName, numClients, connectionData);
      this.logger.writeConnectionStability(this.config.libraryName, numClients, stabilityData);

      // Close all connected clients
      connectedClients.forEach(client => client.close());
      this.logger.log('All clients closed');

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
      // Clean up any connected clients
      clients.forEach(client => {
        try {
          client.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Run broadcast test across all load phases
   * @param {Array<number>} loadPhases - Array of client counts (default: [100, 200, 400, 600, 800, 1000])
   * @param {number} iterations - Number of iterations per load phase (default: 3)
   * @param {number} broadcastInterval - Interval between broadcasts (default: 3000ms)
   * @returns {Promise<Array>} Results for all phases
   */
  async runPhasedBroadcastTest(loadPhases = [100, 200, 400, 600, 800, 1000], iterations = 3, broadcastInterval = 3000) {
    this.logger.log('Starting Phased Broadcast Test');
    this.logger.log(`Load phases: ${loadPhases.join(', ')}`);
    this.logger.log(`Iterations per phase: ${iterations}`);
    this.logger.log(`Broadcast interval: ${broadcastInterval}ms`);
    this.logger.log('===');

    this.logger.clearPhasedTestData(this.config.libraryName, loadPhases);

    const results = [];

    for (const numClients of loadPhases) {
      for (let iteration = 1; iteration <= iterations; iteration++) {
        this.logger.log('');
        this.logger.log(`Phase: ${numClients} clients - Iteration ${iteration}/${iterations}`);
        this.logger.log('---');

        const result = await this.runBroadcastTest(numClients, broadcastInterval);
        results.push({
          numClients,
          iteration,
          ...result
        });

        // Wait a bit between iterations
        if (iteration < iterations) {
          this.logger.log('Waiting 5 seconds before next iteration...');
          await this.sleep(5000);
        }
      }

      // Wait between load phases
      if (numClients !== loadPhases[loadPhases.length - 1]) {
        this.logger.log('Waiting 10 seconds before next phase...');
        await this.sleep(10000);
      }
    }

    this.logger.log('');
    this.logger.log('===');
    this.logger.log('Phased Broadcast Test Complete');
    return results;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TestRunner;
