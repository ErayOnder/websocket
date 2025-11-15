# WebSocket Server - socket.io

WebSocket server implementation using the `socket.io` library (v4.8.1).

## Features

- Echo test handler: Point-to-point message echo
- Broadcast test handler: Broadcast messages from special client to all receivers
- Throughput measurement: Server-side metrics logging

## Usage

### Local Development
```bash
npm install
npm start
```

### Docker
```bash
docker build -t websocket-server-socketio .
docker run -p 8080:8080 websocket-server-socketio
```

### Docker Compose
```bash
cd ..
docker-compose --profile nodejs-socketio up
```

## Configuration

- Port: 8080 (default, configurable via PORT environment variable)

