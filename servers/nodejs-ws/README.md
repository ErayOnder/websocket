# WebSocket Server - ws Library

WebSocket server implementation using the `ws` library (v8.18.3).

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
docker build -t websocket-server-ws .
docker run -p 8080:8080 websocket-server-ws
```

### Docker Compose
```bash
cd ..
docker-compose --profile nodejs-ws up
```

## Configuration

- Port: 8080 (default, configurable via PORT environment variable)

