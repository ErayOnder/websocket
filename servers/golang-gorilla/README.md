# WebSocket Server - gorilla/websocket

WebSocket server implementation using the `gorilla/websocket` library (v1.5.3).

## Features

- Echo test handler: Point-to-point message echo
- Broadcast test handler: Broadcast messages from special client to all receivers
- Throughput measurement: Server-side metrics logging

## Usage

### Local Development
```bash
go mod download
go run server.go
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

## Configuration

- Port: 8080 (default, configurable via PORT environment variable)

