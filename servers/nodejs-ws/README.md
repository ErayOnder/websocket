# WebSocket Server - ws Library

WebSocket server implementation using the `ws` library (v8.18.3) for benchmarking.

## Features

- **Echo Test Handler**: Receives messages and echoes them back to the sender
- **Broadcast Test Handler**: Broadcasts messages from sender to all other connected clients
- **Throughput Measurement**: Tracks messages per second and active connections
- **CSV Logging**: Exports throughput metrics to `data/raw/throughput_ws.csv`

## Installation

```bash
npm install
```

## Usage

### Start Server (default port 8080)
```bash
npm start
```

### Start Server on Custom Port
```bash
node server.js 3000
```

### Docker
```bash
docker build -t websocket-server-ws .
docker run -p 8080:8080 websocket-server-ws
```

### Docker Compose
```bash
cd ..
docker-compose --profile nodejs-ws up
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
The server will echo this message back to the sender.

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

- **[src/server.js](src/server.js)** - Main WebSocket server class
  - Connection management
  - Echo and Broadcast message handlers
  - Throughput tracking (messages/second)
  - Graceful shutdown

- **[src/logger.js](src/logger.js)** - CSV logging utility
  - Throughput metrics logging
  - Console output with timestamps

- **[server.js](server.js)** - Entry point

## Metrics

Throughput metrics are logged every second to `data/raw/throughput_ws.csv`:

```csv
timestamp,messages_per_second,active_connections
1234567890,150,100
1234567891,148,100
```

## Configuration

- **Port**: 8080 (default), can be changed via command line argument
- **Throughput Interval**: 1 second (hardcoded)

## Testing with Client Simulator

From the client-simulator directory:

```bash
# Quick test with 5 clients
npm run benchmark:quick

# Full benchmark
npm run benchmark -- --server ws://localhost:8080 --library ws
```

