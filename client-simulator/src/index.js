import WSClient from './clients/ws-client.js';
import SocketIOClient from './clients/socketio-client.js';
import Logger from './utils/logger.js';
import WebSocket from 'ws';

const logger = new Logger();

/**
 * Check if a server is available at the given URL
 * @param {string} url - Server URL to check
 * @param {string} serverType - Type of server ('ws' or 'socketio')
 * @returns {Promise<boolean>} - True if server is reachable
 */
async function checkServerAvailability(url, serverType) {
  return new Promise((resolve) => {
    if (serverType === 'ws') {
      const ws = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 2000); // 2 second timeout
      
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });
      
      ws.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    } else {
      // For Socket.IO, we'll just try to connect
      resolve(true); // Socket.IO will handle connection errors
    }
  });
}

/**
 * Generic client test function
 * @param {Function} ClientClass - Client class constructor (WSClient or SocketIOClient)
 * @param {string} url - Server URL
 * @param {string} clientName - Name for logging (e.g., 'WebSocket (ws)', 'Socket.IO')
 * @param {string} testMessage - Message to send
 * @param {number} waitTime - Time to wait before closing (ms)
 */
async function testClient(ClientClass, url, clientName, testMessage, waitTime = 1000) {
  logger.log(`Attempting to connect ${clientName} client to ${url}...`);
  const client = new ClientClass(url, 1, logger);

  try {
    const connectionTime = await client.connect();
    logger.log(`✓ Successfully connected to ${url} in ${connectionTime}ms`);

    client.onMessage((message) => {
      logger.log(`Received: ${message}`);
    });

    await client.send(testMessage);
    logger.log(`Sent test message: "${testMessage}"`);

    // Wait for the specified time before closing
    await new Promise((resolve) => {
      setTimeout(() => {
        client.close();
        logger.log('Client closed');
        resolve();
      }, waitTime);
    });

  } catch (error) {
    logger.error(`Connection failed: ${error.message}`);
  }
}

async function testWSClient() {
  await testClient(
    WSClient,
    'ws://localhost:8080',
    'WebSocket (ws)',
    'Hello from ws client!'
  );
}

async function testSocketIOClient() {
  await testClient(
    SocketIOClient,
    'http://localhost:3000',
    'Socket.IO',
    'Hello from Socket.IO client!'
  );
}

/**
 * Generic function to test multiple clients and measure connection times
 * @param {Function} ClientClass - Client class constructor (WSClient or SocketIOClient)
 * @param {string} url - Server URL
 * @param {string} libraryName - Library name for CSV file naming (e.g., 'ws', 'socketio')
 * @param {number} numClients - Number of concurrent clients to create
 * @param {number} waitTime - Time to wait before closing clients (ms)
 */
async function demoMultipleClients(ClientClass, url, libraryName, numClients = 5, waitTime = 2000) {
  const clients = [];
  const connectionData = [];

  for (let i = 0; i < numClients; i++) {
    const client = new ClientClass(url, i + 1, logger);
    clients.push(client);
  }

  const connectionPromises = clients.map(async (client) => {
    try {
      const connectionTime = await client.connect();
      connectionData.push({
        clientId: client.clientId,
        connectionTime: connectionTime
      });
      logger.log(`Client ${client.clientId} connected in ${connectionTime}ms`);
    } catch (error) {
      logger.error(`Client ${client.clientId} failed to connect: ${error.message}`);
    }
  });

  await Promise.all(connectionPromises);

  logger.writeConnectionTime(libraryName, numClients, connectionData);

  setTimeout(() => {
    clients.forEach(client => client.close());
    logger.log('All clients closed');
  }, waitTime);
}

async function demoMultipleWS() {
  await demoMultipleClients(
    WSClient,
    'ws://localhost:8080',
    'WebSocket (ws)',
    'ws',
    5
  );
}

async function demoMultipleSocketIO() {
  await demoMultipleClients(
    SocketIOClient,
    'http://localhost:3000',
    'Socket.IO',
    'socketio',
    5
  );
}

// Main execution
async function main() {
  logger.log('WebSocket Client Simulator - Basic Infrastructure Test');
  logger.log('=====================================================');
  logger.log('');
  logger.log('Scanning for available servers...');
  logger.log('');

  // Check available servers
  const serversToCheck = [
    { url: 'ws://localhost:8080', name: 'WebSocket (ws) server', type: 'ws' },
    { url: 'http://localhost:3000', name: 'Socket.IO server', type: 'socketio' }
  ];

  const availableServers = [];
  for (const server of serversToCheck) {
    logger.log(`Checking ${server.name} at ${server.url}...`);
    const isAvailable = await checkServerAvailability(server.url, server.type);
    if (isAvailable) {
      logger.log(`  ✓ ${server.name} is available`);
      availableServers.push(server);
    } else {
      logger.log(`  ✗ ${server.name} is not available`);
    }
  }

  logger.log('');
  logger.log('=====================================================');
  logger.log('');

  if (availableServers.length === 0) {
    logger.error('No servers found! Please start a server before running tests.');
    logger.log('');
    logger.log('To start a server:');
    logger.log('  - WebSocket (ws): cd servers/nodejs-ws && npm start');
    logger.log('  - Socket.IO: cd servers/nodejs-socketio && npm start');
    return;
  }

  logger.log(`Found ${availableServers.length} server(s) available`);
  logger.log('');

  // Test WebSocket server if available
  if (availableServers.some(s => s.url === 'ws://localhost:8080')) {
    logger.log('Testing WebSocket (ws) client');
    logger.log('=====================================================');
    logger.log('');
    await testWSClient();
    logger.log('');
  }

  // Test Socket.IO server if available
  if (availableServers.some(s => s.url === 'http://localhost:3000')) {
    logger.log('Testing Socket.IO client');
    logger.log('=====================================================');
    logger.log('');
    await testSocketIOClient();
    logger.log('');
  }

  logger.log('All tests completed!');
}

main().catch((error) => {
  logger.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
