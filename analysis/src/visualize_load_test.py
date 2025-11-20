#!/usr/bin/env python3
"""
Visualization script for load test results.

Generates all charts for load test analysis.
"""

import argparse
import sys
from pathlib import Path
import pandas as pd

from visualizer import Visualizer
from load_test_analyzer import LoadTestAnalyzer


def main():
    """Main visualization pipeline for load tests."""
    parser = argparse.ArgumentParser(
        description='Generate visualizations for WebSocket load test results'
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

    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print("Load Test Visualization")
    print("=" * 70)
    print()

    # Initialize components
    visualizer = Visualizer(args.output_dir)
    analyzer = LoadTestAnalyzer()

    # Find all load test files
    load_test_files = list(data_dir.glob('load_test_*.csv'))

    if not load_test_files:
        print("Error: No load test files found in data directory")
        sys.exit(1)

    print(f"Found {len(load_test_files)} load test result(s)")
    print()

    # Collect degradation curves
    degradation_curves = {}

    for csv_path in load_test_files:
        result = analyzer.analyze_single_test(csv_path)
        if result:
            library = result['library']
            degradation_df = analyzer.calculate_degradation_curves(csv_path)
            if not degradation_df.empty:
                degradation_curves[library] = degradation_df

    # Generate visualizations
    print("Generating visualizations...")
    print()

    # 1. Progressive degradation (all libraries)
    if degradation_curves:
        print("  Creating progressive degradation chart...")
        visualizer.plot_load_test_progressive_degradation(degradation_curves)

    # 2. Maximum capacity comparison
    summary_path = output_dir / 'load_test_summary.csv'
    if summary_path.exists():
        print("  Creating max capacity comparison chart...")
        summary_df = pd.read_csv(summary_path)
        visualizer.plot_load_test_max_capacity(summary_df)

    # 3. Health timeline (per library)
    for csv_path in load_test_files:
        filename = csv_path.stem
        library = '_'.join(filename.split('_')[2:-1])
        print(f"  Creating health timeline for {library}...")
        visualizer.plot_load_test_health_timeline(csv_path)

    # 4. Resource efficiency
    efficiency_path = output_dir / 'load_test_efficiency.csv'
    if efficiency_path.exists():
        print("  Creating resource efficiency chart...")
        efficiency_df = pd.read_csv(efficiency_path)
        visualizer.plot_load_test_resource_efficiency(efficiency_df)

    # 5. Failure modes
    failure_path = output_dir / 'load_test_failure_modes.csv'
    if failure_path.exists():
        print("  Creating failure modes chart...")
        failure_df = pd.read_csv(failure_path)
        visualizer.plot_load_test_failure_modes(failure_df)

    print()
    print("=" * 70)
    print("Visualization Complete!")
    print("=" * 70)
    print(f"\nCharts saved to: {output_dir}")
    print()

    return 0


if __name__ == '__main__':
    sys.exit(main())
