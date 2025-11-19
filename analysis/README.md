# Data Analysis Module

Processes raw benchmark data and generates statistical summaries and visualizations.

## Features

- **Data Loading**: Automatic discovery and loading of benchmark CSV files
- **Statistical Aggregation**: Mean, Median, Standard Deviation, Min, Max for all metrics
- **Visualizations**:
  - RTT trends across client counts
  - Connection time trends
  - Broadcast latency trends
  - Throughput comparisons
  - Comprehensive metrics comparison
- **Summary Tables**: Exported in CSV and Markdown formats

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Basic Usage

Run analysis on all discovered libraries:

```bash
cd src
python analyze.py
```

### Advanced Usage

Specify data and output directories:

```bash
python analyze.py --data-dir /path/to/raw/data --output-dir /path/to/output
```

Analyze specific libraries only:

```bash
python analyze.py --libraries ws socketio golang-gorilla
```

Skip visualization generation (faster):

```bash
python analyze.py --no-viz
```

Choose output format:

```bash
python analyze.py --format csv          # CSV only
python analyze.py --format markdown     # Markdown only
python analyze.py --format both         # Both formats (default)
```

### Command-Line Options

```
--data-dir PATH         Path to raw data directory (default: ../../data/raw)
--output-dir PATH       Path to output directory (default: ../../data/processed)
--libraries LIB [LIB]   Specific libraries to analyze (default: all)
--no-viz                Skip visualization generation
--format {csv,markdown,both}  Output format for summary tables (default: both)
```

## Input

Reads CSV files from the raw data directory with the following formats:

- **RTT Data**: `rtt_{library}_{clientcount}clients.csv`
  - Columns: `client_id`, `rtt_ms`, `timestamp`

- **Connection Time**: `connection_time_{library}_{clientcount}clients.csv`
  - Columns: `client_id`, `connection_time_ms`

- **Broadcast Latency**: `broadcast_latency_{library}_{clientcount}clients.csv`
  - Columns: `client_id`, `latency_ms`, `timestamp`

- **Throughput**: `throughput_{library}.csv`
  - Columns: `timestamp`, `messages_per_second`, `active_connections`

## Output

Generates in the processed data directory:

### Statistics CSV Files
- `rtt_statistics.csv` - RTT statistics by library and client count
- `connection_time_statistics.csv` - Connection time statistics
- `broadcast_latency_statistics.csv` - Broadcast latency statistics
- `throughput_statistics.csv` - Throughput statistics by library
- `summary_table.csv` - Comprehensive summary of all metrics

### Visualizations (PNG, 300 DPI)
- `rtt_trends.png` - RTT trends across client counts
- `connection_time_trends.png` - Connection time trends
- `broadcast_latency_trends.png` - Broadcast latency trends
- `throughput_comparison.png` - Throughput comparison bar charts
- `all_metrics_comparison.png` - Comprehensive metrics comparison

### Summary Tables
- `summary_table.md` - Markdown-formatted performance summary

## Module Structure

```
src/
├── __init__.py           # Package initialization
├── analyze.py            # Main analysis script (entry point)
├── data_loader.py        # CSV data loading utilities
├── stats_calculator.py   # Statistical aggregation functions
└── visualizer.py         # Visualization generation
```

## Example Output

```
======================================================================
WebSocket Benchmark Analysis
======================================================================

Loading data from: ../../data/raw
Discovered libraries: ws, socketio, golang-gorilla

Loading RTT data...
  Loaded 2611585 RTT measurements
Loading connection time data...
  Loaded 4401 connection time measurements
Loading broadcast latency data...
  Loaded 58786 broadcast latency measurements
Loading throughput data...
  Loaded 11280 throughput measurements

Calculating statistics...
  Aggregating RTT statistics...
  Aggregating connection time statistics...
  Aggregating broadcast latency statistics...
  Aggregating throughput statistics...
  Creating summary table...

Exporting statistics...
  Saved RTT statistics to: ../../data/processed/rtt_statistics.csv
  Saved connection time statistics to: ../../data/processed/connection_time_statistics.csv
  Saved broadcast latency statistics to: ../../data/processed/broadcast_latency_statistics.csv
  Saved throughput statistics to: ../../data/processed/throughput_statistics.csv
  Saved summary table to: ../../data/processed/summary_table.csv
  Saved summary table (Markdown) to: ../../data/processed/summary_table.md

Generating visualizations...
  Creating RTT trends chart...
  Creating connection time trends chart...
  Creating broadcast latency trends chart...
  Creating throughput comparison chart...
  Creating all metrics comparison chart...

======================================================================
Analysis Complete!
======================================================================

Results saved to: ../../data/processed

Performance Summary:
----------------------------------------------------------------------
 library       rtt_mean_ms  rtt_median_ms  conn_mean_ms  conn_median_ms  throughput_mean_msg_s  throughput_max_msg_s
 ws            1.68         1.55           34.54         33.47           3074.38                10000
 socketio      1.69         1.42           35.05         30.02           2418.72                6000
 golang-gorilla 0.45         0.38           3.21          2.95            8500.00                15000
```

## Docker

Build and run using Docker:

```bash
docker build -t websocket-analysis .
docker run -v $(pwd)/../data:/app/data websocket-analysis
```

