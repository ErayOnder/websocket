import WSClient from './clients/ws-client.js';
import SocketIOClient from './clients/socketio-client.js';
import Logger from './utils/logger.js';

const logger = new Logger();

/**
 * Generic client test function
 * @param {Function} ClientClass - Client class constructor (WSClient or SocketIOClient)
 * @param {string} url - Server URL
 * @param {string} clientName - Name for logging (e.g., 'WebSocket (ws)', 'Socket.IO')
 * @param {string} testMessage - Message to send
 * @param {number} waitTime - Time to wait before closing (ms)
 */
async function testClient(ClientClass, url, clientName, testMessage, waitTime = 1000) {
  const client = new ClientClass(url, 1, logger);

  try {
    const connectionTime = await client.connect();
    logger.log(`Client connected in ${connectionTime}ms`);

    client.onMessage((message) => {
      logger.log(`Received: ${message}`);
    });

    await client.send(testMessage);

    setTimeout(() => {
      client.close();
      logger.log('Client closed');
    }, waitTime);

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
logger.log('WebSocket Client Simulator - Basic Infrastructure Test');
logger.log('=====================================================');
logger.log('');
logger.log('Note: This demo requires a WebSocket server running on ws://localhost:8080');
logger.log('For Socket.IO tests, a server should be running on http://localhost:3000');
logger.log('');

logger.log('Testing WebSocket (ws) client');
logger.log('=====================================================');
logger.log('');
testWSClient();

// logger.log('Testing Socket.IO client');
// logger.log('=====================================================');
// logger.log('');
// testSocketIOClient();

// logger.log('Testing multiple WebSocket (ws) clients');
// logger.log('=====================================================');
// logger.log('');
// demoMultipleWS();

// logger.log('Testing multiple Socket.IO clients');
// logger.log('=====================================================');
// logger.log('');
// demoMultipleSocketIO();
