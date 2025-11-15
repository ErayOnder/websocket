# Client Simulator Module

Generates phased concurrent load for WebSocket benchmarking and measures client-side metrics.

## Features

- Phased load generation: 100, 200, 400, 600, 800, 1000 concurrent clients
- Echo test: Measures Round Trip Time (RTT) and Connection Time
- Broadcast test: Measures Broadcast Latency
- CSV logging: Systematic file naming for all metrics
- Support for both native WebSocket (ws) and Socket.IO connections

## Installation

```bash
npm install
```

## Usage

```bash
npm start
```

## Architecture

### Core Components

#### 1. WSClient ([src/ws-client.js](src/ws-client.js))
WebSocket client wrapper using the `ws` library with built-in connection time measurement.

**Features:**
- Automatic connection time tracking
- Message handler registration
- Promise-based API for connection and messaging
- Error handling and reconnection support

**Example:**
```javascript
import WSClient from './ws-client.js';

const client = new WSClient('ws://localhost:8080', 1);
const connectionTime = await client.connect();
console.log(`Connected in ${connectionTime}ms`);

client.onMessage((message) => console.log('Received:', message));
await client.send('Hello server!');
```

#### 2. SocketIOClient ([src/socketio-client.js](src/socketio-client.js))
Socket.IO client wrapper with connection time measurement.

**Features:**
- WebSocket-only transport mode for fair comparison
- Connection time tracking
- Consistent API with WSClient
- Event-based message handling

**Example:**
```javascript
import SocketIOClient from './socketio-client.js';

const client = new SocketIOClient('http://localhost:3000', 1);
const connectionTime = await client.connect();
console.log(`Connected in ${connectionTime}ms`);
```

#### 3. Logger ([src/logger.js](src/logger.js))
CSV logging utility for writing benchmark metrics.

**Features:**
- Automatic CSV file creation with proper headers
- Systematic file naming convention
- Batch and streaming write modes
- Console logging with timestamps

**Methods:**
- `writeConnectionTime(library, numClients, data)` - Write connection time metrics
- `writeRTT(library, numClients, data)` - Write round-trip time metrics
- `writeBroadcastLatency(library, numClients, data)` - Write broadcast latency metrics

## Configuration

Configuration options will be added via command-line arguments or config file.

## Output

Metrics are logged to CSV files in `../../data/raw/` directory with naming convention:
- `connection_time_<library>_<clients>clients.csv`
- `rtt_<library>_<clients>clients.csv`
- `broadcast_latency_<library>_<clients>clients.csv`

## Current Status

**Phase 2.1: Basic Client Infrastructure - COMPLETED**
- ✅ Node.js project with dependencies (ws, socket.io-client)
- ✅ Basic WebSocket client connection logic (WSClient)
- ✅ Basic Socket.IO client connection logic (SocketIOClient)
- ✅ Connection time measurement
- ✅ CSV logging structure (Logger)

## Next Steps

- Task 2.2: Echo Test Implementation
- Task 2.3: Broadcast Test Implementation
- Task 2.4: Load Generation System
- Task 2.5: Test Orchestration

