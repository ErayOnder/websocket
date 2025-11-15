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

## Quick Start

### Run Echo Test Demo (5 seconds)
```bash
npm run demo:echo
```

### Run Full Benchmark Suite
```bash
npm run benchmark
```

### Run Quick Benchmark (5 seconds, 5 and 10 clients)
```bash
npm run benchmark:quick
```

### Custom Benchmark
```bash
node src/benchmark.js --server ws://localhost:8080 --test echo --duration 10 --load-phases 10,20,50
```

## Command Line Options

```
-s, --server <url>           Server URL (default: ws://localhost:8080)
-l, --library <name>         Library name for CSV files (default: ws)
-c, --client-type <type>     Client type: ws or socketio (default: ws)
-t, --test <type>            Test type: echo, broadcast, or all (default: all)
-p, --load-phases <phases>   Comma-separated client counts (default: 100,200,400,600,800,1000)
-i, --iterations <n>         Iterations per phase (default: 3)
-d, --duration <seconds>     Test duration in seconds (default: 60)
-h, --help                   Show help message
```

## Examples

### Test with Socket.IO Server
```bash
node src/benchmark.js --client-type socketio --server http://localhost:3000 --library socketio
```

### Echo Test Only
```bash
node src/benchmark.js --test echo --duration 30
```

### Broadcast Test Only
```bash
node src/benchmark.js --test broadcast --duration 60
```

### Custom Load Phases
```bash
node src/benchmark.js --load-phases 50,100,200,500 --iterations 5
```

## Architecture

### Core Components

#### 1. WSClient ([src/clients/ws-client.js](src/clients/ws-client.js))
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

#### 2. SocketIOClient ([src/clients/socketio-client.js](src/clients/socketio-client.js))
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

#### 3. Logger ([src/utils/logger.js](src/utils/logger.js))
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

#### 4. EchoTest ([src/tests/echo-test.js](src/tests/echo-test.js))
Implements Echo test scenario for RTT measurement.

**Features:**
- Sends messages at configurable intervals
- Measures RTT from send to receive
- Tracks all messages with unique IDs
- Calculates statistics (mean, median, min, max)

**Usage:**
```javascript
const echoTest = new EchoTest(client, logger);
await echoTest.run(60000, 100); // 60s duration, 100ms interval
const stats = echoTest.getStatistics();
```

#### 5. BroadcastTest ([src/tests/broadcast-test.js](src/tests/broadcast-test.js))
Implements Broadcast test scenario for latency measurement.

**Features:**
- One sender triggers broadcasts to all receivers
- Measures latency for each receiver
- Configurable broadcast interval (default: 3000ms)
- Per-client and overall statistics

**Usage:**
```javascript
const broadcastTest = new BroadcastTest(clients, logger, senderClientId);
await broadcastTest.runWithSender(60000, 3000); // 60s duration, 3s interval
const stats = broadcastTest.getStatistics();
```

#### 6. TestRunner ([src/runners/test-runner.js](src/runners/test-runner.js))
Orchestrates test execution with multiple clients and load phases.

**Features:**
- Single and multi-client test execution
- Phased load generation (100, 200, 400, 600, 800, 1000)
- Multiple iterations per phase (default: 3)
- Automatic result aggregation and CSV logging

**Key Methods:**
- `runSingleEchoTest()` - Run echo test with one client
- `runMultiClientEchoTest(numClients)` - Run echo test with N clients
- `runPhasedEchoTest(loadPhases, iterations)` - Run complete echo benchmark
- `runBroadcastTest(numClients, interval)` - Run broadcast test with N clients
- `runPhasedBroadcastTest(loadPhases, iterations, interval)` - Run complete broadcast benchmark

#### 7. Benchmark ([src/benchmark.js](src/benchmark.js))
Main entry point with command-line interface.

**Features:**
- Full CLI argument parsing
- Echo and/or Broadcast test execution
- Configurable load phases, iterations, and duration
- Summary results display

## Output

Metrics are logged to CSV files in `../../data/raw/` directory with naming convention:
- `connection_time_<library>_<clients>clients.csv`
- `rtt_<library>_<clients>clients.csv`
- `broadcast_latency_<library>_<clients>clients.csv`

## Current Status

**Phase 2: Client Simulator Module - COMPLETED ✅**

- ✅ **Task 2.1**: Basic Client Infrastructure
  - WebSocket (ws) and Socket.IO client wrappers
  - Connection time measurement
  - CSV logging utility

- ✅ **Task 2.2**: Echo Test Implementation
  - RTT measurement logic
  - Message tracking with unique IDs
  - Statistical analysis

- ✅ **Task 2.3**: Broadcast Test Implementation
  - Sender/receiver role management
  - Broadcast latency measurement
  - Per-client statistics

- ✅ **Task 2.4**: Load Generation System
  - Phased load (100, 200, 400, 600, 800, 1000 clients)
  - Concurrent client management
  - Connection cleanup

- ✅ **Task 2.5**: Test Orchestration
  - Multi-iteration test runner
  - Systematic file naming
  - Error handling and recovery

- ✅ **Task 2.6**: Polish
  - Command-line interface
  - Comprehensive logging
  - Documentation

## File Structure

```
client-simulator/
├── src/
│   ├── clients/               # WebSocket client implementations
│   │   ├── ws-client.js       # Native WebSocket (ws) client wrapper
│   │   └── socketio-client.js # Socket.IO client wrapper
│   ├── tests/                 # Test scenario implementations
│   │   ├── echo-test.js       # Echo test (RTT measurement)
│   │   └── broadcast-test.js  # Broadcast test (latency measurement)
│   ├── runners/               # Test orchestration
│   │   └── test-runner.js     # Multi-client test runner with phased load
│   ├── utils/                 # Utilities
│   │   └── logger.js          # CSV logging and console output
│   ├── benchmark.js           # Main CLI entry point
│   ├── demo-echo.js           # Echo test demo script
│   └── index.js               # Basic client examples
├── package.json
├── Dockerfile
└── README.md
```

## Next Steps

Ready for **Phase 3: Server Implementations**
- Task 3.1: Node.js ws server
- Task 3.2: Node.js socket.io server
- Task 3.3: Golang gorilla/websocket server
- Task 3.4: Golang coder/websocket server

