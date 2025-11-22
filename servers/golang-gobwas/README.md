# WebSocket Server - gobwas/ws

WebSocket server implementation using the `gobwas/ws` library (v1.2.1).

## Features

- **Echo test handler**: Point-to-point message echo with JSON message support
- **Broadcast test handler**: Broadcasts messages from one client to all other connected clients
- **Throughput measurement**: Server-side metrics logging (messages/second, active connections)
- **CSV logging**: Automatic logging of throughput data to `../../data/raw/throughput_golang_gobwas.csv`
- **Concurrent client support**: Thread-safe handling of multiple simultaneous WebSocket connections
- **Low-level control**: Uses gobwas/ws for zero-copy upgrades and efficient message handling

## Message Protocol

The server expects JSON messages with the following format:

```json
{
  "type": "ping" | "broadcast",
  "id": 1,
  "timestamp": 1234567890.123
}
```

**Note**: The `timestamp` field accepts floating-point numbers (for JavaScript `performance.now()` compatibility).

- **Ping messages**: Server responds with a pong message containing the same ID and timestamp
- **Broadcast messages**: Server broadcasts the message to all connected clients except the sender

## Usage

### Local Development
```bash
# Download dependencies
go mod download

# Build the server
go build -o server .

# Run the server
PORT=8080 ./server

# Or with logging enabled
./server --port 8080 --log
```

### Docker
```bash
docker build -t websocket-server-gobwas .
docker run -p 8080:8080 websocket-server-gobwas
```

### Docker Compose
```bash
cd ..
docker-compose --profile golang-gobwas up
```

## Testing

Test with the client simulator:

```bash
# Init test
cd ../../client-simulator
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-gobwas --test init

# Load test
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-gobwas --test load

# Broadcast test
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-gobwas --test broadcast
```

## Performance

The gobwas/ws library is designed for high-performance scenarios with:

- **Zero-copy upgrades**: Minimal memory allocations during WebSocket handshake
- **Low-level control**: Direct access to connection I/O for optimized message handling
- **Efficient parsing**: Fast WebSocket frame parsing with minimal overhead

Expected performance characteristics:
- Sub-millisecond latency for ping-pong messages
- High throughput for broadcast scenarios
- Low memory footprint compared to higher-level libraries

## Configuration

- **Port**: 8080 (default, configurable via `PORT` environment variable or `--port` flag)
- **Logging**: Disabled by default, enable with `--log` flag
- **CORS**: Allows all origins for benchmarking purposes
