# WebSocket Server - coder/websocket

WebSocket server implementation using the `coder/websocket` library (v1.8.13).

## Features

- Echo test handler: Point-to-point message echo
- Broadcast test handler: Broadcast messages from special client to all receivers
- Throughput measurement: Server-side metrics logging
- Thread-safe concurrent connection handling

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
go mod download
go run server.go
```

### Docker
```bash
docker build -t websocket-server-coder .
docker run -p 8080:8080 websocket-server-coder
```

### Docker Compose
```bash
cd ..
docker-compose --profile golang-coder up
```

### Testing

From the client-simulator directory:

```bash
# Echo test
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-coder --test echo

# Broadcast test
npm run benchmark:quick -- --client-type ws --server ws://localhost:8080 --library golang-coder --test broadcast
```

## Performance

Tested performance with Node.js client simulator:

- **Echo Test (5 clients)**: Mean RTT 0.37-0.61ms (median 0.26-0.36ms), 49 messages per client
- **Echo Test (10 clients)**: Mean RTT 0.29-1.16ms (median 0.27-0.3ms), 49 messages per client
- **Broadcast Test (5 clients)**: Mean latency 0.59-4.46ms, 4 messages received per non-sender
- **Broadcast Test (10 clients)**: Mean latency 0.7-1.06ms, 9 messages received per non-sender
- **Throughput**: Handles 100+ messages/second per client with sub-millisecond latency

## Configuration

- **Port**: 8080 (default, configurable via `PORT` environment variable)

