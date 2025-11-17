# WebSocket Server - Socket.IO

WebSocket server implementation using the `socket.io` library (v4.8.1) for benchmarking.

## Features

- **Echo Test Handler**: Receives messages and echoes them back to the sender
- **Broadcast Test Handler**: Broadcasts messages from sender to all other connected clients
- **Throughput Measurement**: Tracks messages per second and active connections
- **CSV Logging**: Exports throughput metrics to `data/raw/throughput_socketio.csv`
- **WebSocket-only Transport**: Configured for fair comparison with native WebSocket servers

## Installation

```bash
npm install
```

## Usage

### Start Server (default port 3000)
```bash
npm start
```

### Start Server on Custom Port
```bash
node server.js 8080
```

### Docker
```bash
docker build -t websocket-server-socketio .
docker run -p 3000:3000 websocket-server-socketio
```

### Docker Compose
```bash
cd ..
docker-compose --profile nodejs-socketio up
```

## Message Protocol

The server supports two message types:

### Echo Test
```json
{
  "type": "echo",
  "id": 1,
  "timestamp": 1234567890
}
```
The server will echo this message back to the sender via the 'message' event.

### Broadcast Test
```json
{
  "type": "broadcast",
  "id": 1,
  "timestamp": 1234567890
}
```
The server will broadcast this message to all connected clients except the sender.

## Architecture

### Components

- **[src/server.js](src/server.js)** - Main Socket.IO server class
  - Connection management with Socket.IO
  - Echo and Broadcast message handlers
  - Throughput tracking (messages/second)
  - Graceful shutdown
  - WebSocket-only transport configuration

- **[src/logger.js](src/logger.js)** - CSV logging utility
  - Throughput metrics logging
  - Console output with timestamps

- **[server.js](server.js)** - Entry point

## Metrics

Throughput metrics are logged every second to `data/raw/throughput_socketio.csv`:

```csv
timestamp,messages_per_second,active_connections
1234567890,150,100
1234567891,148,100
```

## Configuration

- **Port**: 3000 (default), can be changed via command line argument
- **Transport**: WebSocket-only (polling disabled for fair comparison)
- **Throughput Interval**: 1 second (hardcoded)

## Testing with Client Simulator

From the client-simulator directory:

```bash
# Quick test with 5 clients
npm run benchmark:quick -- --client-type socketio --server http://localhost:3000 --library socketio

# Full benchmark
npm run benchmark -- --client-type socketio --server http://localhost:3000 --library socketio
```

## Socket.IO vs Native WebSocket

This server is configured with `transports: ['websocket']` to:
- Disable HTTP long-polling fallback
- Ensure fair comparison with native ws server
- Match the WebSocket-only behavior of the ws library

This configuration provides the most accurate performance comparison between Socket.IO and native WebSocket implementations.
