# WebSocket Server - fasthttp/websocket

WebSocket server implementation using the `fasthttp/websocket` library (v1.5.10) with `valyala/fasthttp` (v1.51.0).

## Features

- **Echo test handler**: Point-to-point message echo with JSON message support
- **Broadcast test handler**: Broadcasts messages from one client to all other connected clients
- **Throughput measurement**: Server-side metrics logging (messages/second, active connections)
- **CSV logging**: Automatic logging of throughput data to `../../data/raw/throughput_golang_fasthttp.csv`
- **Concurrent client support**: Thread-safe handling of multiple simultaneous WebSocket connections
- **High-performance HTTP**: Built on top of fasthttp for optimized HTTP handling

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
docker build -t websocket-server-fasthttp .
docker run -p 8080:8080 websocket-server-fasthttp
```

### Docker Compose
```bash
cd ..
docker-compose --profile golang-fasthttp up
```

## Testing

Test with the client simulator:

```bash
# Init test
cd ../../client-simulator
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-fasthttp --test init

# Load test
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-fasthttp --test load

# Broadcast test
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-fasthttp --test broadcast
```

## Performance

The fasthttp/websocket library is designed for high-performance scenarios with:

- **Fast HTTP processing**: Uses fasthttp instead of net/http for optimized request handling
- **Zero allocations**: Minimal memory allocations during request processing
- **High concurrency**: Efficient handling of thousands of concurrent connections
- **Low latency**: Optimized for sub-millisecond response times

Expected performance characteristics:
- Sub-millisecond latency for ping-pong messages
- High throughput for broadcast scenarios
- Efficient memory usage under high load
- Better performance than standard net/http in high-concurrency scenarios

## Configuration

- **Port**: 8080 (default, configurable via `PORT` environment variable or `--port` flag)
- **Logging**: Disabled by default, enable with `--log` flag
- **CORS**: Allows all origins for benchmarking purposes
- **Read/Write Buffer**: 1024 bytes each
