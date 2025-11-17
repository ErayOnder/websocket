import WSServer from './src/server.js';

/**
 * Main entry point for WebSocket server (ws library)
 */

// Parse command line arguments
const port = parseInt(process.argv[2]) || 8080;

// Create and start server
const server = new WSServer(port);
server.start();

console.log('');
console.log('='.repeat(60));
console.log('WebSocket Server (ws library v8.18.3)');
console.log('='.repeat(60));
console.log(`Port: ${port}`);
console.log('');
console.log('Supported message types:');
console.log('  - Echo: {"type": "echo", "id": 1, "timestamp": ...}');
console.log('  - Broadcast: {"type": "broadcast", "id": 1, "timestamp": ...}');
console.log('');
console.log('Throughput metrics logged to: data/raw/throughput_ws.csv');
console.log('Press Ctrl+C to stop');
console.log('='.repeat(60));
console.log('');
