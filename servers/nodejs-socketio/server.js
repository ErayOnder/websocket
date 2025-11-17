import SocketIOServer from './src/server.js';

/**
 * Main entry point for Socket.IO server
 */

// Parse command line arguments
const port = parseInt(process.argv[2]) || 3000;

// Create and start server
const server = new SocketIOServer(port);
server.start();

console.log('');
console.log('='.repeat(60));
console.log('Socket.IO Server (v4.8.1)');
console.log('='.repeat(60));
console.log(`Port: ${port}`);
console.log('');
console.log('Supported message types:');
console.log('  - Echo: {"type": "echo", "id": 1, "timestamp": ...}');
console.log('  - Broadcast: {"type": "broadcast", "id": 1, "timestamp": ...}');
console.log('');
console.log('Throughput metrics logged to: data/raw/throughput_socketio.csv');
console.log('Press Ctrl+C to stop');
console.log('='.repeat(60));
console.log('');
