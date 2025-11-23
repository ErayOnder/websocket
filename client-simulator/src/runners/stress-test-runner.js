import LoadTestRunner from './load-test-runner.js';
import WSClient from '../clients/ws-client.js';
import SocketIOClient from '../clients/socketio-client.js';

class StressTestRunner extends LoadTestRunner {
    constructor(config) {
        super(config);
        this.activeClients = [];
        this.currentClientCount = 0;
    }

    getFileTypes() {
        return ['reliability', 'connection_stability'];
    }

    async runRampUp(loadPhases, metrics = ['reliability', 'connection_stability']) {
        this.logTestStart(loadPhases);
        this.logger.clearPhasedTestData(this.config.serverName, loadPhases, metrics);

        const results = [];

        try {
            for (const targetCount of loadPhases) {
                const newClientsNeeded = targetCount - this.currentClientCount;

                if (newClientsNeeded > 0) {
                    this.logger.log('');
                    this.logger.log(`Ramping up: Adding ${newClientsNeeded} clients (Target: ${targetCount})...`);

                    const newClients = this.createClients(newClientsNeeded, this.currentClientCount);
                    const { connectedClients, failedConnections } = await this.connectClients(newClients);

                    this.activeClients = [...this.activeClients, ...connectedClients];
                    this.currentClientCount = this.activeClients.length;

                    if (failedConnections.length > 0) {
                        this.logger.error(`Failed to connect ${failedConnections.length} clients. Current active: ${this.currentClientCount}`);
                    }
                } else if (newClientsNeeded < 0) {
                    this.logger.log(`Scaling down: Removing ${Math.abs(newClientsNeeded)} clients...`);
                    const clientsToRemove = this.activeClients.splice(newClientsNeeded);
                    this.closeClients(clientsToRemove);
                    this.currentClientCount = this.activeClients.length;
                }

                this.logger.log('');
                this.logger.log(`Phase: ${this.currentClientCount} active clients`);
                this.logger.log(`Duration: ${this.config.testDuration}ms | Interval: ${this.config.messageInterval}ms`);
                this.logger.log('---');

                const result = await this.runStep(this.activeClients, targetCount, metrics);
                results.push(result);
            }
        } catch (error) {
            this.logger.error(`Stress test failed: ${error.message}`);
        } finally {
            this.logger.log('Cleaning up all clients...');
            this.closeClients(this.activeClients);
            this.activeClients = [];
            this.currentClientCount = 0;
        }

        this.logTestComplete();
        return results;
    }

    async runStep(clients, labelCount, metrics) {
        this.logger.log('Running stress step...');

        try {
            // Reuse runLoadTests from LoadTestRunner
            const { reliabilityData, stabilityData } = await super.runLoadTests(clients);

            // Write metrics to CSV
            if (metrics.includes('reliability')) {
                this.logger.writeReliabilityData(this.config.serverName, labelCount, reliabilityData);
            }

            if (metrics.includes('stability') || metrics.includes('connection_stability')) {
                this.logger.writeConnectionStability(this.config.serverName, labelCount, stabilityData);
            }

            return {
                numClients: labelCount,
                success: true,
                reliabilityData,
                stabilityData
            };

        } catch (error) {
            this.logger.error(`Step execution failed: ${error.message}`);
            return {
                numClients: labelCount,
                success: false,
                error: error.message
            };
        }
    }

    // Override createClients to handle offset IDs
    createClients(numClients, startIdOffset = 0) {
        const ClientClass = this.config.clientType === 'socketio' ? SocketIOClient : WSClient;
        const clients = [];

        for (let i = 0; i < numClients; i++) {
            const client = new ClientClass(this.config.serverUrl, startIdOffset + i + 1, this.logger);
            clients.push(client);
        }

        return clients;
    }

    logTestStart(loadPhases) {
        this.logger.log('Starting Ramp-Up Stress Test');
        this.logger.log(`Ramp-up phases: ${loadPhases.join(' -> ')} clients`);
        this.logger.log(`Client type: ${this.config.clientType} | Server name: ${this.config.serverName} in ${this.config.serverUrl}`);
        this.logger.log(`Step Duration: ${this.config.testDuration}ms | Message interval: ${this.config.messageInterval}ms`);
        this.logger.log('===');
    }
}

export default StressTestRunner;
