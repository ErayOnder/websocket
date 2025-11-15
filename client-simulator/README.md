# Client Simulator Module

Generates phased concurrent load for WebSocket benchmarking and measures client-side metrics.

## Features

- Phased load generation: 100, 200, 400, 600, 800, 1000 concurrent clients
- Echo test: Measures Round Trip Time (RTT) and Connection Time
- Broadcast test: Measures Broadcast Latency
- CSV logging: Systematic file naming for all metrics

## Usage

```bash
npm install
npm start
```

## Configuration

Configuration options will be added via command-line arguments or config file.

## Output

Metrics are logged to CSV files in `../../data/raw/` directory with naming convention:
- `rtt_<library>_<clients>clients.csv`
- `connection_time_<library>_<clients>clients.csv`
- `broadcast_latency_<library>_<clients>clients.csv`

