import WSClient from '../clients/ws-client.js';
import SocketIOClient from '../clients/socketio-client.js';
import Logger from '../utils/logger.js';

class TestRunner {
  constructor(config = {}) {
    this.validateConfig(config);
    this.config = { ...config };
    this.logger = new Logger();
  }

  validateConfig(config) {
    if (!config.serverUrl) {
      throw new Error(`${this.constructor.name}: Missing required config option: serverUrl`);
    }
    if (!config.serverName) {
      throw new Error(`${this.constructor.name}: Missing required config option: serverName`);
    }
    if (!config.clientType) {
      throw new Error(`${this.constructor.name}: Missing required config option: clientType`);
    }
    if (typeof config.testDuration !== 'number' || config.testDuration <= 0) {
      throw new Error(`${this.constructor.name}: Missing or invalid config option: testDuration`);
    }
  }

  /**
   * Run test across all load phases
   * @param {Array<number>} loadPhases - Array of client counts
   * @param {number} iterations - Number of iterations per load phase
   * @returns {Promise<Array>} Results for all phases
   */
  async runPhased(loadPhases, iterations = 3) {
    this.logTestStart(loadPhases, iterations);
    this.logger.clearPhasedTestData(this.config.serverName, loadPhases);

    const results = [];
    for (const numClients of loadPhases) {
      for (let iteration = 1; iteration <= iterations; iteration++) {
        this.logger.log('');
        this.logger.log(`Phase: ${numClients} clients - Iteration ${iteration}/${iterations}`);
        this.logger.log('---');

        const result = await this.run(numClients);
        results.push({
          numClients,
          iteration,
          ...result
        });

        if (iteration < iterations) {
          this.logger.log('Waiting 5 seconds before next iteration...');
          await this.sleep(5000);
        }
      }

      if (numClients !== loadPhases[loadPhases.length - 1]) {
        this.logger.log('Waiting 10 seconds before next phase...');
        await this.sleep(10000);
      }
    }

    this.logTestComplete();
    return results;
  }

  async run(numClients) {
    throw new Error(`${this.constructor.name}: run() must be implemented by subclass`);
  }

  logTestStart(loadPhases, iterations) {
    this.logger.log('Starting Test');
    this.logger.log(`Load phases: ${loadPhases.join(', ')}`);
    this.logger.log(`Iterations per phase: ${iterations}`);
    this.logger.log(`Client type: ${this.config.clientType} | Server name: ${this.config.serverName} in ${this.config.serverUrl}`);
    this.logger.log(`Duration: ${this.config.testDuration}ms`);
    this.logger.log('===');
  }

  logTestComplete() {
    this.logger.log('');
    this.logger.log('===');
    this.logger.log('Test Complete');
  }

  createClients(numClients) {
    const ClientClass = this.config.clientType === 'socketio' ? SocketIOClient : WSClient;
    const clients = [];

    for (let i = 0; i < numClients; i++) {
      const client = new ClientClass(this.config.serverUrl, i + 1, this.logger);
      clients.push(client);
    }

    return clients;
  }

  async connectClients(clients) {
    const connectionData = [];
    const failedConnections = [];

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

    this.logger.log(`${connectedClients.length}/${clients.length} clients connected successfully${failedConnections.length > 0 ? ` (${failedConnections.length} failed)` : ''}`);

    return {
      connectedClients,
      connectionData,
      failedConnections
    };
  }

  closeClients(clients) {
    clients.forEach(client => {
      try {
        client.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    });
    this.logger.log('All clients closed');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default TestRunner;
