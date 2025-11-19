#!/usr/bin/env python3
"""
Main analysis script for WebSocket benchmark data.

This script:
1. Loads raw CSV data from benchmarks
2. Calculates statistical summaries
3. Generates visualizations
4. Exports summary tables
"""

import argparse
import sys
from pathlib import Path

from data_loader import DataLoader
from stats_calculator import StatisticsCalculator
from visualizer import Visualizer


def main():
    """Main analysis pipeline."""
    parser = argparse.ArgumentParser(
        description='Analyze WebSocket benchmark data and generate reports'
    )
    parser.add_argument(
        '--data-dir',
        type=str,
        default='../../data/raw',
        help='Path to raw data directory (default: ../../data/raw)'
    )
    parser.add_argument(
        '--output-dir',
        type=str,
        default='../../data/processed',
        help='Path to output directory (default: ../../data/processed)'
    )
    parser.add_argument(
        '--libraries',
        type=str,
        nargs='+',
        help='Specific libraries to analyze (default: all discovered)'
    )
    parser.add_argument(
        '--no-viz',
        action='store_true',
        help='Skip visualization generation'
    )
    parser.add_argument(
        '--format',
        choices=['csv', 'markdown', 'both'],
        default='both',
        help='Output format for summary tables (default: both)'
    )

    args = parser.parse_args()

    # Create output directory
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("WebSocket Benchmark Analysis")
    print("=" * 70)
    print()

    # Initialize components
    print(f"Loading data from: {args.data_dir}")
    try:
        loader = DataLoader(args.data_dir)
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

    stats_calc = StatisticsCalculator()
    visualizer = Visualizer(args.output_dir)

    # Discover libraries
    if args.libraries:
        libraries = args.libraries
        print(f"Analyzing specified libraries: {', '.join(libraries)}")
    else:
        libraries = loader.discover_libraries()
        if not libraries:
            print("Error: No data found in data directory")
            sys.exit(1)
        print(f"Discovered libraries: {', '.join(libraries)}")

    print()

    # Load all data
    print("Loading RTT data...")
    rtt_data = loader.load_all_rtt_data(libraries)
    print(f"  Loaded {len(rtt_data)} RTT measurements")

    print("Loading connection time data...")
    conn_data = loader.load_all_connection_time_data(libraries)
    print(f"  Loaded {len(conn_data)} connection time measurements")

    print("Loading broadcast latency data...")
    broadcast_data = loader.load_all_broadcast_latency_data(libraries)
    print(f"  Loaded {len(broadcast_data)} broadcast latency measurements")

    print("Loading throughput data...")
    throughput_data = []
    for library in libraries:
        df = loader.load_throughput_data(library)
        if not df.empty:
            throughput_data.append(df)

    if throughput_data:
        import pandas as pd
        throughput_data = pd.concat(throughput_data, ignore_index=True)
        print(f"  Loaded {len(throughput_data)} throughput measurements")
    else:
        import pandas as pd
        throughput_data = pd.DataFrame()
        print(f"  No throughput data found")

    print()

    # Calculate statistics
    print("Calculating statistics...")

    print("  Aggregating RTT statistics...")
    rtt_stats = stats_calc.aggregate_rtt_stats(rtt_data)

    print("  Aggregating connection time statistics...")
    conn_stats = stats_calc.aggregate_connection_time_stats(conn_data)

    print("  Aggregating broadcast latency statistics...")
    broadcast_stats = stats_calc.aggregate_broadcast_latency_stats(broadcast_data)

    print("  Aggregating throughput statistics...")
    throughput_stats = stats_calc.aggregate_throughput_stats(throughput_data)

    print("  Creating summary table...")
    summary_table = stats_calc.create_summary_table(
        rtt_stats, conn_stats, broadcast_stats, throughput_stats
    )

    print()

    # Export statistics
    print("Exporting statistics...")

    if args.format in ['csv', 'both']:
        if not rtt_stats.empty:
            rtt_path = output_dir / 'rtt_statistics.csv'
            rtt_stats.to_csv(rtt_path, index=False)
            print(f"  Saved RTT statistics to: {rtt_path}")

        if not conn_stats.empty:
            conn_path = output_dir / 'connection_time_statistics.csv'
            conn_stats.to_csv(conn_path, index=False)
            print(f"  Saved connection time statistics to: {conn_path}")

        if not broadcast_stats.empty:
            broadcast_path = output_dir / 'broadcast_latency_statistics.csv'
            broadcast_stats.to_csv(broadcast_path, index=False)
            print(f"  Saved broadcast latency statistics to: {broadcast_path}")

        if not throughput_stats.empty:
            throughput_path = output_dir / 'throughput_statistics.csv'
            throughput_stats.to_csv(throughput_path, index=False)
            print(f"  Saved throughput statistics to: {throughput_path}")

        if not summary_table.empty:
            summary_path = output_dir / 'summary_table.csv'
            summary_table.to_csv(summary_path, index=False)
            print(f"  Saved summary table to: {summary_path}")

    if args.format in ['markdown', 'both']:
        if not summary_table.empty:
            summary_md_path = output_dir / 'summary_table.md'
            with open(summary_md_path, 'w') as f:
                f.write("# WebSocket Library Performance Summary\n\n")
                f.write(summary_table.to_markdown(index=False, floatfmt=".2f"))
                f.write("\n")
            print(f"  Saved summary table (Markdown) to: {summary_md_path}")

    print()

    # Generate visualizations
    if not args.no_viz:
        print("Generating visualizations...")

        if not rtt_stats.empty:
            print("  Creating RTT trends chart...")
            visualizer.plot_rtt_trends(rtt_stats)

        if not conn_stats.empty:
            print("  Creating connection time trends chart...")
            visualizer.plot_connection_time_trends(conn_stats)

        if not broadcast_stats.empty:
            print("  Creating broadcast latency trends chart...")
            visualizer.plot_broadcast_latency_trends(broadcast_stats)

        if not throughput_stats.empty:
            print("  Creating throughput comparison chart...")
            visualizer.plot_throughput_comparison(throughput_stats)

        if not summary_table.empty:
            print("  Creating all metrics comparison chart...")
            visualizer.plot_all_metrics_comparison(summary_table)

        print()

    # Print summary
    print("=" * 70)
    print("Analysis Complete!")
    print("=" * 70)
    print()
    print(f"Results saved to: {output_dir}")
    print()

    # Display summary table if available
    if not summary_table.empty:
        print("Performance Summary:")
        print("-" * 70)
        print(summary_table.to_string(index=False, float_format=lambda x: f'{x:.2f}'))
        print()

    return 0


if __name__ == '__main__':
    sys.exit(main())
