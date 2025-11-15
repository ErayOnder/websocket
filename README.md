# WebSocket Benchmarking Framework

A modular, containerized framework for benchmarking WebSocket libraries across different technologies (Node.js and Golang) with reproducible results.

## Project Overview

This framework replicates performance benchmarks for WebSocket libraries, measuring key metrics like Round Trip Time (RTT), Connection Time, Throughput, and Broadcast Latency across different load levels.

## Architecture

The framework consists of three main modules:

1. **Client Simulator** - Generates phased concurrent load and measures client-side metrics
2. **WebSocket Servers** - Four server implementations (Node.js: ws, socket.io | Golang: gorilla/websocket, coder/websocket)
3. **Data Analysis** - Processes raw data and generates statistical summaries and visualizations

## Project Status

🚧 **Phase 1 Complete** - Infrastructure and project structure set up. Ready for implementation.

## Prerequisites

- **Node.js** 20+ (for client-simulator and Node.js servers)
- **Python** 3.11+ (for analysis module)
- **Go** 1.21+ (for Golang servers)
- **Docker** and **Docker Compose** (for containerized execution)

## Environment Setup

### Client Simulator
```bash
cd client-simulator
npm install
```

### Analysis Module
```bash
cd analysis
pip install -r requirements.txt
```

### Node.js Servers
```bash
# ws library server
cd servers/nodejs-ws
npm install

# socket.io server
cd servers/nodejs-socketio
npm install
```

### Golang Servers
```bash
# gorilla/websocket server
cd servers/golang-gorilla
go mod download

# coder/websocket server
cd servers/golang-coder
go mod download
```

### Docker Setup
All modules include Dockerfiles for containerized execution. Use Docker Compose to run servers:

```bash
cd servers
docker-compose --profile <server-name> up
```

Available profiles: `nodejs-ws`, `nodejs-socketio`, `golang-gorilla`, `golang-coder`

## Documentation

- [Project Structure](PROJECT_STRUCTURE.md) - Detailed architecture and directory structure
- [Task Breakdown](TASK_BREAKDOWN.md) - Complete task list organized by phases

## Next Steps

See [TASK_BREAKDOWN.md](TASK_BREAKDOWN.md) for detailed implementation tasks. Start with Phase 2: Client Simulator Module.

## License

TBD

