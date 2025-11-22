import SocketIOServer from './src/server.js';

/**
 * Main entry point for Socket.IO server
 */

// Parse command line arguments
const args = process.argv.slice(2);
let port = 3000;
let enableLogging = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' || args[i] === '-p') {
        port = parseInt(args[++i]) || 3000;
    } else if (args[i] === '--log') {
        enableLogging = true;
    } else if (!isNaN(parseInt(args[i]))) {
        // Support legacy format: node server.js 3000
        port = parseInt(args[i]);
    }
}

// Create and start server
const server = new SocketIOServer(port, enableLogging);
server.start();

console.log('');
console.log('='.repeat(60));
console.log('Socket.IO Server (v4.8.1)');
console.log('='.repeat(60));
console.log(`Port: ${port}`);
console.log(`Logging: ${enableLogging ? 'ENABLED' : 'DISABLED'}`);
console.log('');
console.log('Supported message types:');
console.log('  - Echo: {"type": "echo", "id": 1, "timestamp": ...}');
console.log('  - Broadcast: {"type": "broadcast", "id": 1, "timestamp": ...}');
console.log('');
if (enableLogging) {
    console.log('Throughput metrics logged to: data/raw/throughput_socketio.csv');
    console.log('Resource metrics logged to: data/raw/resources_socketio.csv');
}
console.log('Press Ctrl+C to stop');
console.log('='.repeat(60));
console.log('');
