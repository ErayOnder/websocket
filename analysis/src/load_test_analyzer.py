#!/usr/bin/env python3
"""
Load Test Analysis for WebSocket Benchmarks

Analyzes progressive load test results to identify:
- Maximum healthy capacity
- Performance degradation curves
- Failure modes
- Resource efficiency
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Tuple
import argparse
import sys


class LoadTestAnalyzer:
    """Analyzes load test results and generates comparative insights."""

    def analyze_single_test(self, csv_path: Path) -> Dict:
        """
        Analyze a single load test result.

        Args:
            csv_path: Path to load test CSV file

        Returns:
            Dictionary with analysis results
        """
        df = pd.read_csv(csv_path)

        if df.empty:
            return {}

        # Extract library name from filename
        filename = csv_path.stem
        library = '_'.join(filename.split('_')[2:-1])  # load_test_{library}_{date}

        # Find breaking point
        failure_row = df[df['failure_reason'].notna()]
        if not failure_row.empty:
            max_total_clients = failure_row.iloc[0]['client_count']
            failure_reason = failure_row.iloc[0]['failure_reason']
            failure_details = failure_row.iloc[0]['failure_details'] if 'failure_details' in failure_row.columns else ''
        else:
            max_total_clients = df['client_count'].max()
            failure_reason = 'max_limit_reached'
            failure_details = ''

        # Find last healthy state
        healthy_df = df[df['health_status'] == 'GREEN']
        if not healthy_df.empty:
            max_healthy_clients = healthy_df['client_count'].max()
            baseline_row = healthy_df.iloc[0]
            peak_healthy_row = healthy_df.iloc[-1]
        else:
            max_healthy_clients = df['client_count'].min()
            baseline_row = df.iloc[0]
            peak_healthy_row = df.iloc[-1]

        # Calculate baseline and peak metrics
        baseline_rtt_p95 = baseline_row['rtt_p95']
        peak_rtt_p95 = peak_healthy_row['rtt_p95']
        baseline_cpu = baseline_row['cpu_percent'] if pd.notna(baseline_row['cpu_percent']) else None
        peak_cpu = peak_healthy_row['cpu_percent'] if pd.notna(peak_healthy_row['cpu_percent']) else None

        # Test duration
        test_duration_sec = len(df) * 45  # Approximate: 15s stabilization + 30s measurement

        # Total messages processed
        total_messages = df['messages_per_second'].sum() * 30  # 30s measurement windows

        # Average throughput
        avg_throughput = df['messages_per_second'].mean()

        return {
            'library': library,
            'max_healthy_clients': int(max_healthy_clients),
            'max_total_clients': int(max_total_clients),
            'failure_reason': failure_reason,
            'failure_details': failure_details,
            'baseline_rtt_p95': round(baseline_rtt_p95, 2),
            'peak_rtt_p95': round(peak_rtt_p95, 2),
            'baseline_cpu': round(baseline_cpu, 2) if baseline_cpu is not None else None,
            'peak_cpu': round(peak_cpu, 2) if peak_cpu is not None else None,
            'test_duration_sec': test_duration_sec,
            'total_messages': int(total_messages),
            'avg_throughput': round(avg_throughput, 2)
        }

    def compare_libraries(self, results: List[Dict]) -> pd.DataFrame:
        """
        Compare load test results across multiple libraries.

        Args:
            results: List of analysis results from analyze_single_test

        Returns:
            DataFrame with comparative analysis
        """
        if not results:
            return pd.DataFrame()

        df = pd.DataFrame(results)

        # Sort by max healthy clients (descending)
        df = df.sort_values('max_healthy_clients', ascending=False)

        return df

    def calculate_degradation_curves(self, csv_path: Path) -> pd.DataFrame:
        """
        Extract performance degradation curve from load test.

        Args:
            csv_path: Path to load test CSV file

        Returns:
            DataFrame with degradation curve data
        """
        df = pd.read_csv(csv_path)

        if df.empty:
            return pd.DataFrame()

        # Select key metrics for degradation analysis
        degradation_df = df[[
            'client_count',
            'rtt_mean',
            'rtt_p95',
            'rtt_p99',
            'message_loss_rate',
            'cpu_percent',
            'memory_mb',
            'health_status'
        ]].copy()

        # Add normalized metrics (percentage of baseline)
        baseline = degradation_df.iloc[0]

        degradation_df['rtt_p95_normalized'] = (
            (degradation_df['rtt_p95'] / baseline['rtt_p95']) * 100
        ) if baseline['rtt_p95'] > 0 else 100

        degradation_df['cpu_normalized'] = (
            (degradation_df['cpu_percent'] / baseline['cpu_percent']) * 100
        ) if pd.notna(baseline['cpu_percent']) and baseline['cpu_percent'] > 0 else None

        return degradation_df

    def identify_failure_modes(self, results: List[Dict]) -> pd.DataFrame:
        """
        Analyze distribution of failure modes across tests.

        Args:
            results: List of analysis results

        Returns:
            DataFrame with failure mode distribution
        """
        if not results:
            return pd.DataFrame()

        failure_counts = {}
        for result in results:
            reason = result.get('failure_reason', 'unknown')
            failure_counts[reason] = failure_counts.get(reason, 0) + 1

        df = pd.DataFrame([
            {'failure_reason': reason, 'count': count}
            for reason, count in failure_counts.items()
        ])

        df['percentage'] = (df['count'] / df['count'].sum() * 100).round(2)
        df = df.sort_values('count', ascending=False)

        return df

    def calculate_resource_efficiency(self, csv_path: Path) -> Dict:
        """
        Calculate resource efficiency metrics.

        Args:
            csv_path: Path to load test CSV file

        Returns:
            Dictionary with efficiency metrics
        """
        df = pd.read_csv(csv_path)

        if df.empty:
            return {}

        # Extract library name
        filename = csv_path.stem
        library = '_'.join(filename.split('_')[2:-1])

        # Average resources per client
        healthy_df = df[df['health_status'] == 'GREEN']
        if healthy_df.empty:
            healthy_df = df

        avg_cpu_per_client = None
        if healthy_df['cpu_percent'].notna().any():
            avg_cpu_per_client = (
                healthy_df['cpu_percent'].mean() / healthy_df['client_count'].mean()
            )

        avg_memory_per_client = None
        if healthy_df['memory_mb'].notna().any():
            avg_memory_per_client = (
                healthy_df['memory_mb'].mean() / healthy_df['client_count'].mean()
            )

        # Throughput efficiency (messages per second per client)
        avg_throughput_per_client = (
            healthy_df['messages_per_second'].mean() / healthy_df['client_count'].mean()
        )

        return {
            'library': library,
            'cpu_percent_per_client': round(avg_cpu_per_client, 4) if avg_cpu_per_client else None,
            'memory_mb_per_client': round(avg_memory_per_client, 4) if avg_memory_per_client else None,
            'throughput_per_client': round(avg_throughput_per_client, 2)
        }


def main():
    """Main analysis pipeline for load tests."""
    parser = argparse.ArgumentParser(
        description='Analyze WebSocket load test results'
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
    print("Load Test Analysis")
    print("=" * 70)
    print()

    # Find all load test files
    load_test_files = list(data_dir.glob('load_test_*.csv'))

    if not load_test_files:
        print("Error: No load test files found in data directory")
        sys.exit(1)

    print(f"Found {len(load_test_files)} load test result(s)")
    print()

    # Analyze each test
    analyzer = LoadTestAnalyzer()
    results = []
    efficiency_results = []
    degradation_curves = {}

    for csv_path in load_test_files:
        print(f"Analyzing: {csv_path.name}")

        # Single test analysis
        result = analyzer.analyze_single_test(csv_path)
        if result:
            results.append(result)
            print(f"  Max Healthy Clients: {result['max_healthy_clients']}")
            print(f"  Failure Reason: {result['failure_reason']}")

        # Resource efficiency
        efficiency = analyzer.calculate_resource_efficiency(csv_path)
        if efficiency:
            efficiency_results.append(efficiency)

        # Degradation curves
        degradation = analyzer.calculate_degradation_curves(csv_path)
        if not degradation.empty:
            library = result['library']
            degradation_curves[library] = degradation

        print()

    # Comparative analysis
    if results:
        print("Generating comparative analysis...")

        # Summary comparison
        summary_df = analyzer.compare_libraries(results)
        summary_path = output_dir / 'load_test_summary.csv'
        summary_df.to_csv(summary_path, index=False)
        print(f"  Saved summary to: {summary_path}")

        # Failure mode analysis
        failure_modes = analyzer.identify_failure_modes(results)
        if not failure_modes.empty:
            failure_path = output_dir / 'load_test_failure_modes.csv'
            failure_modes.to_csv(failure_path, index=False)
            print(f"  Saved failure modes to: {failure_path}")

        # Resource efficiency
        if efficiency_results:
            efficiency_df = pd.DataFrame(efficiency_results)
            efficiency_path = output_dir / 'load_test_efficiency.csv'
            efficiency_df.to_csv(efficiency_path, index=False)
            print(f"  Saved resource efficiency to: {efficiency_path}")

        # Save degradation curves
        for library, degradation_df in degradation_curves.items():
            curve_path = output_dir / f'load_test_degradation_{library}.csv'
            degradation_df.to_csv(curve_path, index=False)
            print(f"  Saved degradation curve to: {curve_path}")

        # Markdown report
        markdown_path = output_dir / 'load_test_report.md'
        with open(markdown_path, 'w') as f:
            f.write("# Load Test Results\n\n")
            f.write("## Summary Comparison\n\n")
            f.write(summary_df.to_markdown(index=False))
            f.write("\n\n")

            if not failure_modes.empty:
                f.write("## Failure Mode Distribution\n\n")
                f.write(failure_modes.to_markdown(index=False))
                f.write("\n\n")

            if efficiency_results:
                f.write("## Resource Efficiency\n\n")
                f.write(efficiency_df.to_markdown(index=False))
                f.write("\n")

        print(f"  Saved report to: {markdown_path}")

    print()
    print("=" * 70)
    print("Analysis Complete!")
    print("=" * 70)
    print()

    # Display summary
    if results:
        print("Load Test Summary:")
        print("-" * 70)
        print(summary_df.to_string(index=False))
        print()

    return 0


if __name__ == '__main__':
    sys.exit(main())
