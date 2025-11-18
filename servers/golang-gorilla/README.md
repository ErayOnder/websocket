# WebSocket Server - gorilla/websocket

WebSocket server implementation using the `gorilla/websocket` library (v1.5.3).

## Features

- **Echo test handler**: Point-to-point message echo with JSON message support
- **Broadcast test handler**: Broadcasts messages from one client to all other connected clients
- **Throughput measurement**: Server-side metrics logging (messages/second, active connections)
- **CSV logging**: Automatic logging of throughput data to `../../data/raw/throughput_golang_gorilla.csv`
- **Concurrent client support**: Thread-safe handling of multiple simultaneous WebSocket connections

## Message Protocol

The server expects JSON messages with the following format:

```json
{
  "type": "echo" | "broadcast",
  "id": 1,
  "timestamp": 1234567890.123
}
```

**Note**: The `timestamp` field accepts floating-point numbers (for JavaScript `performance.now()` compatibility).

- **Echo messages**: Server echoes the message back to the sender
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
```

### Docker
```bash
docker build -t websocket-server-gorilla .
docker run -p 8080:8080 websocket-server-gorilla
```

### Docker Compose
```bash
cd ..
docker-compose --profile golang-gorilla up
```

## Testing

Test with the client simulator:

```bash
# Echo test
cd ../../client-simulator
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-gorilla --test echo

# Broadcast test
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-gorilla --test broadcast
```

## Performance

Tested performance with Node.js client simulator:

- **Echo Test (5 clients)**: Mean RTT 0.49-0.56ms, 49 messages per client
- **Echo Test (10 clients)**: Mean RTT 0.45-0.71ms, 49 messages per client
- **Broadcast Test (5 clients)**: Mean latency 0.8-2.42ms, 4 messages received per non-sender
- **Broadcast Test (10 clients)**: Mean latency 0.5-1.54ms, 9 messages received per non-sender
- **Throughput**: Handles 100+ messages/second per client with sub-millisecond latency

## Configuration

- **Port**: 8080 (default, configurable via `PORT` environment variable)
- **CORS**: Allows all origins for benchmarking purposes
- **Read/Write Buffer**: 1024 bytes each

