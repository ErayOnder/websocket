"""
Visualization generation for benchmark data.
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from typing import List, Optional, Tuple
import numpy as np


class Visualizer:
    """Creates visualizations for benchmark data."""

    def __init__(self, output_dir: str = "../../data/processed", style: str = "seaborn-v0_8-darkgrid"):
        """
        Initialize the visualizer.

        Args:
            output_dir: Directory to save visualizations
            style: Matplotlib style to use
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Set style
        try:
            plt.style.use(style)
        except:
            plt.style.use('seaborn-v0_8')

        # Set default figure size and DPI
        plt.rcParams['figure.figsize'] = (12, 6)
        plt.rcParams['figure.dpi'] = 100
        plt.rcParams['savefig.dpi'] = 300
        plt.rcParams['font.size'] = 10

        # Color palette for different libraries
        self.colors = sns.color_palette("husl", n_colors=8)

    def plot_rtt_trends(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create line chart showing RTT trends across client counts.

        Args:
            stats_df: DataFrame with columns: library, client_count, mean, median
            save_path: Path to save the figure (None = auto-generate)
        """
        if stats_df.empty:
            print("Warning: No RTT data to plot")
            return

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        # Group by library
        for idx, (library, group) in enumerate(stats_df.groupby('library')):
            color = self.colors[idx % len(self.colors)]

            # Plot mean RTT
            ax1.plot(group['client_count'], group['mean'],
                    marker='o', label=library, color=color, linewidth=2)

            # Plot median RTT
            ax2.plot(group['client_count'], group['median'],
                    marker='s', label=library, color=color, linewidth=2)

        # Configure mean plot
        ax1.set_xlabel('Number of Clients', fontsize=12)
        ax1.set_ylabel('Mean RTT (ms)', fontsize=12)
        ax1.set_title('Mean Round Trip Time by Client Count', fontsize=14, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Configure median plot
        ax2.set_xlabel('Number of Clients', fontsize=12)
        ax2.set_ylabel('Median RTT (ms)', fontsize=12)
        ax2.set_title('Median Round Trip Time by Client Count', fontsize=14, fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'rtt_trends.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved RTT trends chart to: {save_path}")
        plt.close()

    def plot_connection_time_trends(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create line chart showing connection time trends across client counts.

        Args:
            stats_df: DataFrame with columns: library, client_count, mean, median
            save_path: Path to save the figure
        """
        if stats_df.empty:
            print("Warning: No connection time data to plot")
            return

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        # Group by library
        for idx, (library, group) in enumerate(stats_df.groupby('library')):
            color = self.colors[idx % len(self.colors)]

            # Plot mean connection time
            ax1.plot(group['client_count'], group['mean'],
                    marker='o', label=library, color=color, linewidth=2)

            # Plot median connection time
            ax2.plot(group['client_count'], group['median'],
                    marker='s', label=library, color=color, linewidth=2)

        # Configure mean plot
        ax1.set_xlabel('Number of Clients', fontsize=12)
        ax1.set_ylabel('Mean Connection Time (ms)', fontsize=12)
        ax1.set_title('Mean Connection Time by Client Count', fontsize=14, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Configure median plot
        ax2.set_xlabel('Number of Clients', fontsize=12)
        ax2.set_ylabel('Median Connection Time (ms)', fontsize=12)
        ax2.set_title('Median Connection Time by Client Count', fontsize=14, fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'connection_time_trends.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved connection time trends chart to: {save_path}")
        plt.close()

    def plot_broadcast_latency_trends(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create line chart showing broadcast latency trends across client counts.

        Args:
            stats_df: DataFrame with columns: library, client_count, mean, median
            save_path: Path to save the figure
        """
        if stats_df.empty:
            print("Warning: No broadcast latency data to plot")
            return

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        # Group by library
        for idx, (library, group) in enumerate(stats_df.groupby('library')):
            color = self.colors[idx % len(self.colors)]

            # Plot mean broadcast latency
            ax1.plot(group['client_count'], group['mean'],
                    marker='o', label=library, color=color, linewidth=2)

            # Plot median broadcast latency
            ax2.plot(group['client_count'], group['median'],
                    marker='s', label=library, color=color, linewidth=2)

        # Configure mean plot
        ax1.set_xlabel('Number of Clients', fontsize=12)
        ax1.set_ylabel('Mean Broadcast Latency (ms)', fontsize=12)
        ax1.set_title('Mean Broadcast Latency by Client Count', fontsize=14, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Configure median plot
        ax2.set_xlabel('Number of Clients', fontsize=12)
        ax2.set_ylabel('Median Broadcast Latency (ms)', fontsize=12)
        ax2.set_title('Median Broadcast Latency by Client Count', fontsize=14, fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'broadcast_latency_trends.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved broadcast latency trends chart to: {save_path}")
        plt.close()



    def plot_throughput_vs_load(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create line chart showing average throughput vs client load (Load Test only).

        Args:
            stats_df: DataFrame with columns: library, client_count, mean_throughput
            save_path: Path to save the figure
        """
        if stats_df.empty:
            print("Warning: No throughput vs load data to plot")
            return

        fig, ax = plt.subplots(figsize=(12, 6))

        # Group by library
        for idx, (library, group) in enumerate(stats_df.groupby('library')):
            color = self.colors[idx % len(self.colors)]
            
            # Sort by client count to ensure correct line drawing
            group = group.sort_values('client_count')
            
            ax.plot(group['client_count'], group['mean_throughput'],
                    marker='o', label=library, color=color, linewidth=2)

        ax.set_xlabel('Number of Clients', fontsize=12)
        ax.set_ylabel('Mean Throughput (msg/s)', fontsize=12)
        ax.set_title('Average Throughput vs Client Load (Load Test)', fontsize=14, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)
        
        # Ensure x-axis has integer ticks for client counts if they are few
        client_counts = sorted(stats_df['client_count'].unique())
        if len(client_counts) < 20:
            ax.set_xticks(client_counts)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'throughput_vs_load.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved throughput vs load chart to: {save_path}")
        plt.close()

    def plot_all_metrics_comparison(self, summary_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create comprehensive comparison chart for all metrics.

        Args:
            summary_df: DataFrame with all metrics summary
            save_path: Path to save the figure
        """
        if summary_df.empty:
            print("Warning: No summary data to plot")
            return

        # Select columns to plot
        metric_cols = [col for col in summary_df.columns if col != 'library']

        if not metric_cols:
            print("Warning: No metrics found in summary data")
            return

        num_metrics = len(metric_cols)
        fig, axes = plt.subplots(2, (num_metrics + 1) // 2, figsize=(16, 10))
        axes = axes.flatten()

        for idx, metric in enumerate(metric_cols):
            ax = axes[idx]

            # Filter out NaN values
            data = summary_df[['library', metric]].dropna()

            if data.empty:
                continue

            x = np.arange(len(data))
            ax.bar(x, data[metric], color=self.colors[:len(data)], alpha=0.8)
            ax.set_xlabel('Library', fontsize=10)
            ax.set_ylabel(metric.replace('_', ' ').title(), fontsize=10)
            ax.set_title(metric.replace('_', ' ').title(), fontsize=11, fontweight='bold')
            ax.set_xticks(x)
            ax.set_xticklabels(data['library'], rotation=45, ha='right', fontsize=9)
            ax.grid(True, alpha=0.3, axis='y')

        # Hide unused subplots
        for idx in range(len(metric_cols), len(axes)):
            axes[idx].set_visible(False)

        plt.suptitle('WebSocket Library Performance Comparison', fontsize=16, fontweight='bold', y=1.00)
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'all_metrics_comparison.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved all metrics comparison chart to: {save_path}")
        plt.close()

    def plot_message_loss_trends(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create line chart showing message loss rate trends across client counts.

        Args:
            stats_df: DataFrame with columns: library, client_count, total_loss_rate
            save_path: Path to save the figure
        """
        if stats_df.empty:
            print("Warning: No reliability data to plot")
            return

        fig, ax = plt.subplots(figsize=(12, 6))

        # Group by library
        for idx, (library, group) in enumerate(stats_df.groupby('library')):
            color = self.colors[idx % len(self.colors)]
            ax.plot(group['client_count'], group['total_loss_rate'],
                   marker='o', label=library, color=color, linewidth=2)

        ax.set_xlabel('Number of Clients', fontsize=12)
        ax.set_ylabel('Message Loss Rate (%)', fontsize=12)
        ax.set_title('Message Loss Rate by Client Count', fontsize=14, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'message_loss_trends.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved message loss trends chart to: {save_path}")
        plt.close()

    def plot_connection_stability(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing connection stability (disconnect rate) across client counts.

        Args:
            stats_df: DataFrame with columns: library, client_count, disconnect_count_sum, clients_with_disconnects_pct
            save_path: Path to save the figure
        """
        if stats_df.empty:
            print("Warning: No stability data to plot")
            return

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        # Plot 1: Total disconnects by client count
        for idx, (library, group) in enumerate(stats_df.groupby('library')):
            color = self.colors[idx % len(self.colors)]
            ax1.plot(group['client_count'], group['disconnect_count_sum'],
                    marker='o', label=library, color=color, linewidth=2)

        ax1.set_xlabel('Number of Clients', fontsize=12)
        ax1.set_ylabel('Total Disconnects', fontsize=12)
        ax1.set_title('Total Disconnects by Client Count', fontsize=14, fontweight='bold')
        ax1.legend()
        ax1.grid(True, alpha=0.3)

        # Plot 2: Percentage of clients with disconnects
        for idx, (library, group) in enumerate(stats_df.groupby('library')):
            color = self.colors[idx % len(self.colors)]
            ax2.plot(group['client_count'], group['clients_with_disconnects_pct'],
                    marker='s', label=library, color=color, linewidth=2)

        ax2.set_xlabel('Number of Clients', fontsize=12)
        ax2.set_ylabel('Clients with Disconnects (%)', fontsize=12)
        ax2.set_title('Percentage of Clients with Disconnects', fontsize=14, fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'connection_stability.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved connection stability chart to: {save_path}")
        plt.close()

    def plot_resource_usage(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing server resource usage (CPU and Memory).

        Args:
            stats_df: DataFrame with resource metrics
            save_path: Path to save the figure
        """
        if stats_df.empty:
            print("Warning: No resource data to plot")
            return

        servers = stats_df['server'].tolist()
        x = np.arange(len(servers))
        width = 0.35

        # Determine which metrics are available (Go vs Node.js)
        has_golang = 'cpu_goroutines_mean' in stats_df.columns
        has_nodejs = 'cpu_user_ms_mean' in stats_df.columns

        if has_golang and has_nodejs:
            # Mixed: create separate plots for Go and Node.js
            fig, axes = plt.subplots(2, 2, figsize=(14, 10))

            # Filter Go and Node.js servers
            go_servers = stats_df[stats_df['server'].str.contains('golang')]
            node_servers = stats_df[~stats_df['server'].str.contains('golang')]

            # Go servers - Goroutines
            if not go_servers.empty:
                ax = axes[0, 0]
                x_go = np.arange(len(go_servers))
                ax.bar(x_go, go_servers['cpu_goroutines_mean'], width, label='Mean', alpha=0.8)
                ax.bar(x_go + width, go_servers['cpu_goroutines_max'], width, label='Max', alpha=0.8)
                ax.set_xlabel('Server', fontsize=10)
                ax.set_ylabel('Goroutines', fontsize=10)
                ax.set_title('Go: Goroutine Count', fontsize=12, fontweight='bold')
                ax.set_xticks(x_go + width / 2)
                ax.set_xticklabels(go_servers['server'], rotation=45, ha='right', fontsize=9)
                ax.legend()
                ax.grid(True, alpha=0.3, axis='y')

            # Go servers - Memory
            if not go_servers.empty:
                ax = axes[0, 1]
                x_go = np.arange(len(go_servers))
                ax.bar(x_go, go_servers['memory_alloc_mb_mean'], width, label='Mean Alloc', alpha=0.8)
                ax.bar(x_go + width, go_servers['memory_sys_mb_mean'], width, label='Mean Sys', alpha=0.8)
                ax.set_xlabel('Server', fontsize=10)
                ax.set_ylabel('Memory (MB)', fontsize=10)
                ax.set_title('Go: Memory Usage', fontsize=12, fontweight='bold')
                ax.set_xticks(x_go + width / 2)
                ax.set_xticklabels(go_servers['server'], rotation=45, ha='right', fontsize=9)
                ax.legend()
                ax.grid(True, alpha=0.3, axis='y')

            # Node.js servers - CPU
            if not node_servers.empty:
                ax = axes[1, 0]
                x_node = np.arange(len(node_servers))
                ax.bar(x_node, node_servers['cpu_user_ms_mean'], width, label='User Mean', alpha=0.8)
                ax.bar(x_node + width, node_servers['cpu_system_ms_mean'], width, label='System Mean', alpha=0.8)
                ax.set_xlabel('Server', fontsize=10)
                ax.set_ylabel('CPU Time (ms)', fontsize=10)
                ax.set_title('Node.js: CPU Usage', fontsize=12, fontweight='bold')
                ax.set_xticks(x_node + width / 2)
                ax.set_xticklabels(node_servers['server'], rotation=45, ha='right', fontsize=9)
                ax.legend()
                ax.grid(True, alpha=0.3, axis='y')

            # Node.js servers - Memory
            if not node_servers.empty:
                ax = axes[1, 1]
                x_node = np.arange(len(node_servers))
                ax.bar(x_node, node_servers['memory_rss_mb_mean'], width, label='RSS Mean', alpha=0.8)
                ax.bar(x_node + width, node_servers['memory_heap_used_mb_mean'], width, label='Heap Mean', alpha=0.8)
                ax.set_xlabel('Server', fontsize=10)
                ax.set_ylabel('Memory (MB)', fontsize=10)
                ax.set_title('Node.js: Memory Usage', fontsize=12, fontweight='bold')
                ax.set_xticks(x_node + width / 2)
                ax.set_xticklabels(node_servers['server'], rotation=45, ha='right', fontsize=9)
                ax.legend()
                ax.grid(True, alpha=0.3, axis='y')

        elif has_golang:
            # Go only
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

            ax1.bar(x, stats_df['cpu_goroutines_mean'], width, label='Mean', alpha=0.8)
            ax1.bar(x + width, stats_df['cpu_goroutines_max'], width, label='Max', alpha=0.8)
            ax1.set_xlabel('Server', fontsize=12)
            ax1.set_ylabel('Goroutines', fontsize=12)
            ax1.set_title('Goroutine Count', fontsize=14, fontweight='bold')
            ax1.set_xticks(x + width / 2)
            ax1.set_xticklabels(servers, rotation=45, ha='right')
            ax1.legend()
            ax1.grid(True, alpha=0.3, axis='y')

            ax2.bar(x, stats_df['memory_alloc_mb_mean'], width, label='Mean Alloc', alpha=0.8)
            ax2.bar(x + width, stats_df['memory_sys_mb_mean'], width, label='Mean Sys', alpha=0.8)
            ax2.set_xlabel('Server', fontsize=12)
            ax2.set_ylabel('Memory (MB)', fontsize=12)
            ax2.set_title('Memory Usage', fontsize=14, fontweight='bold')
            ax2.set_xticks(x + width / 2)
            ax2.set_xticklabels(servers, rotation=45, ha='right')
            ax2.legend()
            ax2.grid(True, alpha=0.3, axis='y')

        elif has_nodejs:
            # Node.js only
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

            ax1.bar(x, stats_df['cpu_user_ms_mean'], width, label='User Mean', alpha=0.8)
            ax1.bar(x + width, stats_df['cpu_system_ms_mean'], width, label='System Mean', alpha=0.8)
            ax1.set_xlabel('Server', fontsize=12)
            ax1.set_ylabel('CPU Time (ms)', fontsize=12)
            ax1.set_title('CPU Usage', fontsize=14, fontweight='bold')
            ax1.set_xticks(x + width / 2)
            ax1.set_xticklabels(servers, rotation=45, ha='right')
            ax1.legend()
            ax1.grid(True, alpha=0.3, axis='y')

            ax2.bar(x, stats_df['memory_rss_mb_mean'], width, label='RSS Mean', alpha=0.8)
            ax2.bar(x + width, stats_df['memory_heap_used_mb_mean'], width, label='Heap Mean', alpha=0.8)
            ax2.set_xlabel('Server', fontsize=12)
            ax2.set_ylabel('Memory (MB)', fontsize=12)
            ax2.set_title('Memory Usage', fontsize=14, fontweight='bold')
            ax2.set_xticks(x + width / 2)
            ax2.set_xticklabels(servers, rotation=45, ha='right')
            ax2.legend()
            ax2.grid(True, alpha=0.3, axis='y')

        plt.suptitle('Server Resource Usage', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'resource_usage.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved resource usage chart to: {save_path}")
        plt.close()

    def plot_performance_degradation(self, degradation_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing performance degradation as client count increases.

        Args:
            degradation_df: DataFrame with degradation metrics
            save_path: Path to save the figure
        """
        if degradation_df.empty:
            print("Warning: No degradation data to plot")
            return

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        libraries = degradation_df['library'].tolist()
        x = np.arange(len(libraries))
        width = 0.6

        # Plot 1: Total degradation percentage
        colors_list = self.colors[:len(libraries)]
        ax1.bar(x, degradation_df['total_degradation_pct'], width, color=colors_list, alpha=0.8)
        ax1.set_xlabel('Library', fontsize=12)
        ax1.set_ylabel('Total Degradation (%)', fontsize=12)
        ax1.set_title('Performance Degradation (Baseline to Peak Load)', fontsize=14, fontweight='bold')
        ax1.set_xticks(x)
        ax1.set_xticklabels(libraries, rotation=45, ha='right')
        ax1.grid(True, alpha=0.3, axis='y')

        # Add value labels on bars
        for i, v in enumerate(degradation_df['total_degradation_pct']):
            ax1.text(i, v + 1, f'{v:.1f}%', ha='center', va='bottom', fontsize=10)

        # Plot 2: Degradation per 100 clients
        ax2.bar(x, degradation_df['degradation_per_100_clients_pct'], width, color=colors_list, alpha=0.8)
        ax2.set_xlabel('Library', fontsize=12)
        ax2.set_ylabel('Degradation per 100 Clients (%)', fontsize=12)
        ax2.set_title('Degradation Rate (% per 100 Clients)', fontsize=14, fontweight='bold')
        ax2.set_xticks(x)
        ax2.set_xticklabels(libraries, rotation=45, ha='right')
        ax2.grid(True, alpha=0.3, axis='y')

        # Add value labels on bars
        for i, v in enumerate(degradation_df['degradation_per_100_clients_pct']):
            ax2.text(i, v + 0.5, f'{v:.1f}%', ha='center', va='bottom', fontsize=10)

        plt.suptitle('Performance Degradation Under Load', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'performance_degradation.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved performance degradation chart to: {save_path}")
        plt.close()

    def plot_memory_leak_analysis(self, leak_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing memory leak detection results.

        Args:
            leak_df: DataFrame with memory leak detection results
            save_path: Path to save the figure
        """
        if leak_df.empty:
            print("Warning: No memory leak data to plot")
            return

        # Filter to show only primary memory metrics (avoid duplication)
        primary_metrics = leak_df[leak_df['metric'].isin(['Memory Alloc (MB)', 'Memory Heap Used (MB)', 'Memory RSS (MB)'])]

        if primary_metrics.empty:
            primary_metrics = leak_df  # Use all if no primary metrics found

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        # Plot 1: Memory growth rate
        servers = primary_metrics['server'].tolist()
        x = np.arange(len(servers))
        width = 0.6

        colors = [self.colors[0] if leak else self.colors[2] for leak in primary_metrics['leak_detected']]
        ax1.bar(x, primary_metrics['growth_rate_mb_per_hour'], width, color=colors, alpha=0.8)
        ax1.set_xlabel('Server', fontsize=12)
        ax1.set_ylabel('Memory Growth (MB/hour)', fontsize=12)
        ax1.set_title('Memory Growth Rate', fontsize=14, fontweight='bold')
        ax1.set_xticks(x)
        ax1.set_xticklabels(servers, rotation=45, ha='right', fontsize=9)
        ax1.grid(True, alpha=0.3, axis='y')
        ax1.axhline(y=0, color='black', linestyle='--', linewidth=1, alpha=0.5)

        # Add legend
        from matplotlib.patches import Patch
        legend_elements = [Patch(facecolor=self.colors[0], alpha=0.8, label='Leak Detected'),
                          Patch(facecolor=self.colors[2], alpha=0.8, label='No Leak')]
        ax1.legend(handles=legend_elements, loc='upper right')

        # Plot 2: R² values (fit quality)
        ax2.bar(x, primary_metrics['r_squared'], width, color=colors, alpha=0.8)
        ax2.set_xlabel('Server', fontsize=12)
        ax2.set_ylabel('R² (Linear Fit Quality)', fontsize=12)
        ax2.set_title('Memory Growth Linearity', fontsize=14, fontweight='bold')
        ax2.set_xticks(x)
        ax2.set_xticklabels(servers, rotation=45, ha='right', fontsize=9)
        ax2.grid(True, alpha=0.3, axis='y')
        ax2.set_ylim(0, 1.0)

        # Add threshold line
        ax2.axhline(y=0.7, color='red', linestyle='--', linewidth=1, alpha=0.7, label='Leak Threshold')
        ax2.legend()

        plt.suptitle('Memory Leak Detection Analysis', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'memory_leak_analysis.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved memory leak analysis chart to: {save_path}")
        plt.close()

    def plot_cpu_utilization(self, resource_data: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing CPU utilization over time, split by server type.

        Args:
            resource_data: DataFrame with timestamp and cpu_percent
            save_path: Path to save the figure
        """
        if resource_data.empty or 'cpu_percent' not in resource_data.columns:
            print("Warning: No CPU utilization data to plot")
            return

        # Split servers into Go and Node.js
        go_servers = resource_data[resource_data['server'].str.contains('golang', case=False)]['server'].unique()
        node_servers = resource_data[~resource_data['server'].str.contains('golang', case=False)]['server'].unique()

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

        # Plot Go Servers
        if len(go_servers) > 0:
            for idx, server in enumerate(go_servers):
                server_df = resource_data[resource_data['server'] == server].copy()
                server_df['timestamp'] = pd.to_datetime(server_df['timestamp'], errors='coerce')
                server_df = server_df.dropna(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
                
                # Filter out initial and trailing idle periods
                if 'active_connections' in server_df.columns:
                    active_mask = server_df['active_connections'] > 0
                    if active_mask.any():
                        first_active_idx = server_df[active_mask].index.min()
                        last_active_idx = server_df[active_mask].index.max()
                        server_df = server_df.iloc[first_active_idx:last_active_idx + 1].reset_index(drop=True)
                
                if server_df.empty:
                    continue

                timestamps_numeric = server_df['timestamp'].astype('int64') / 1e9
                min_time = timestamps_numeric.min()
                server_df['time_minutes'] = (timestamps_numeric - min_time) / 60

                color = self.colors[idx % len(self.colors)]
                ax1.plot(server_df['time_minutes'], server_df['cpu_percent'],
                       label=server, color=color, linewidth=2, alpha=0.8)

            ax1.set_xlabel('Time (minutes)', fontsize=12)
            ax1.set_ylabel('CPU Utilization (%)', fontsize=12)
            ax1.set_title('Go Servers (Multi-core)', fontsize=14, fontweight='bold')
            ax1.legend()
            ax1.grid(True, alpha=0.3)
            ax1.set_ylim(bottom=0)
        else:
            ax1.text(0.5, 0.5, 'No Go server data', ha='center', va='center')
            ax1.axis('off')

        # Plot Node.js Servers
        if len(node_servers) > 0:
            for idx, server in enumerate(node_servers):
                server_df = resource_data[resource_data['server'] == server].copy()
                server_df['timestamp'] = pd.to_datetime(server_df['timestamp'], errors='coerce')
                server_df = server_df.dropna(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
                
                # Filter out initial and trailing idle periods
                if 'active_connections' in server_df.columns:
                    active_mask = server_df['active_connections'] > 0
                    if active_mask.any():
                        first_active_idx = server_df[active_mask].index.min()
                        last_active_idx = server_df[active_mask].index.max()
                        server_df = server_df.iloc[first_active_idx:last_active_idx + 1].reset_index(drop=True)
                
                if server_df.empty:
                    continue

                timestamps_numeric = server_df['timestamp'].astype('int64') / 1e9
                min_time = timestamps_numeric.min()
                server_df['time_minutes'] = (timestamps_numeric - min_time) / 60

                color = self.colors[(idx + len(go_servers)) % len(self.colors)]
                ax2.plot(server_df['time_minutes'], server_df['cpu_percent'],
                       label=server, color=color, linewidth=2, alpha=0.8)

            ax2.set_xlabel('Time (minutes)', fontsize=12)
            ax2.set_ylabel('CPU Utilization (%)', fontsize=12)
            ax2.set_title('Node.js Servers (Single-core)', fontsize=14, fontweight='bold')
            ax2.legend()
            ax2.grid(True, alpha=0.3)
            ax2.set_ylim(bottom=0, top=110) # Node.js caps at 100% usually
        else:
            ax2.text(0.5, 0.5, 'No Node.js server data', ha='center', va='center')
            ax2.axis('off')

        plt.suptitle('CPU Utilization Over Time', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'cpu_utilization_trends.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved CPU utilization chart to: {save_path}")
        plt.close()

    def plot_memory_utilization(self, resource_data: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing memory utilization over time, split by server type.

        Args:
            resource_data: DataFrame with timestamp and memory metrics
            save_path: Path to save the figure
        """
        if resource_data.empty:
            print("Warning: No memory utilization data to plot")
            return

        # Split servers into Go and Node.js
        go_servers = resource_data[resource_data['server'].str.contains('golang', case=False)]['server'].unique()
        node_servers = resource_data[~resource_data['server'].str.contains('golang', case=False)]['server'].unique()

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

        # Plot Go Servers (memory_alloc_mb and memory_sys_mb)
        if len(go_servers) > 0 and 'memory_alloc_mb' in resource_data.columns:
            for idx, server in enumerate(go_servers):
                server_df = resource_data[resource_data['server'] == server].copy()
                server_df['timestamp'] = pd.to_datetime(server_df['timestamp'], errors='coerce')
                server_df = server_df.dropna(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
                
                # Filter out initial and trailing idle periods
                if 'active_connections' in server_df.columns:
                    active_mask = server_df['active_connections'] > 0
                    if active_mask.any():
                        first_active_idx = server_df[active_mask].index.min()
                        last_active_idx = server_df[active_mask].index.max()
                        server_df = server_df.iloc[first_active_idx:last_active_idx + 1].reset_index(drop=True)
                
                if server_df.empty:
                    continue

                timestamps_numeric = server_df['timestamp'].astype('int64') / 1e9
                min_time = timestamps_numeric.min()
                server_df['time_minutes'] = (timestamps_numeric - min_time) / 60

                color = self.colors[idx % len(self.colors)]
                
                # Plot both alloc and sys memory
                ax1.plot(server_df['time_minutes'], server_df['memory_alloc_mb'],
                       label=f'{server} (Alloc)', color=color, linewidth=2, alpha=0.8, linestyle='-')
                ax1.plot(server_df['time_minutes'], server_df['memory_sys_mb'],
                       label=f'{server} (Sys)', color=color, linewidth=1.5, alpha=0.5, linestyle='--')

            ax1.set_xlabel('Time (minutes)', fontsize=12)
            ax1.set_ylabel('Memory Usage (MB)', fontsize=12)
            ax1.set_title('Go Servers Memory Usage', fontsize=14, fontweight='bold')
            ax1.legend(fontsize=9)
            ax1.grid(True, alpha=0.3)
            ax1.set_ylim(bottom=0)
        else:
            ax1.text(0.5, 0.5, 'No Go server data', ha='center', va='center')
            ax1.axis('off')

        # Plot Node.js Servers (memory_rss_mb and memory_heap_used_mb)
        if len(node_servers) > 0 and 'memory_rss_mb' in resource_data.columns:
            for idx, server in enumerate(node_servers):
                server_df = resource_data[resource_data['server'] == server].copy()
                server_df['timestamp'] = pd.to_datetime(server_df['timestamp'], errors='coerce')
                server_df = server_df.dropna(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)
                
                # Filter out initial and trailing idle periods
                if 'active_connections' in server_df.columns:
                    active_mask = server_df['active_connections'] > 0
                    if active_mask.any():
                        first_active_idx = server_df[active_mask].index.min()
                        last_active_idx = server_df[active_mask].index.max()
                        server_df = server_df.iloc[first_active_idx:last_active_idx + 1].reset_index(drop=True)
                
                if server_df.empty:
                    continue

                timestamps_numeric = server_df['timestamp'].astype('int64') / 1e9
                min_time = timestamps_numeric.min()
                server_df['time_minutes'] = (timestamps_numeric - min_time) / 60

                color = self.colors[(idx + len(go_servers)) % len(self.colors)]
                
                # Plot both RSS and Heap Used
                ax2.plot(server_df['time_minutes'], server_df['memory_rss_mb'],
                       label=f'{server} (RSS)', color=color, linewidth=2, alpha=0.8, linestyle='-')
                if 'memory_heap_used_mb' in server_df.columns:
                    ax2.plot(server_df['time_minutes'], server_df['memory_heap_used_mb'],
                           label=f'{server} (Heap)', color=color, linewidth=1.5, alpha=0.5, linestyle='--')

            ax2.set_xlabel('Time (minutes)', fontsize=12)
            ax2.set_ylabel('Memory Usage (MB)', fontsize=12)
            ax2.set_title('Node.js Servers Memory Usage', fontsize=14, fontweight='bold')
            ax2.legend(fontsize=9)
            ax2.grid(True, alpha=0.3)
            ax2.set_ylim(bottom=0)
        else:
            ax2.text(0.5, 0.5, 'No Node.js server data', ha='center', va='center')
            ax2.axis('off')

        plt.suptitle('Memory Utilization Over Time', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'memory_utilization_trends.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved memory utilization chart to: {save_path}")
        plt.close()

    def plot_load_test_progressive_degradation(self, degradation_data: dict, save_path: Optional[str] = None) -> None:
        """
        Create chart showing progressive performance degradation during load test.

        Args:
            degradation_data: Dictionary mapping library names to degradation DataFrames
            save_path: Path to save the figure
        """
        if not degradation_data:
            print("Warning: No load test degradation data to plot")
            return

        fig, axes = plt.subplots(2, 2, figsize=(16, 12))

        # Plot 1: RTT P95 vs Client Count
        ax = axes[0, 0]
        for idx, (library, df) in enumerate(degradation_data.items()):
            color = self.colors[idx % len(self.colors)]
            ax.plot(df['client_count'], df['rtt_p95'], marker='o', label=library,
                   color=color, linewidth=2, alpha=0.8)

        ax.set_xlabel('Client Count', fontsize=12)
        ax.set_ylabel('RTT P95 (ms)', fontsize=12)
        ax.set_title('Latency Degradation Under Load', fontsize=14, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)

        # Plot 2: Message Loss Rate vs Client Count
        ax = axes[0, 1]
        for idx, (library, df) in enumerate(degradation_data.items()):
            color = self.colors[idx % len(self.colors)]
            ax.plot(df['client_count'], df['message_loss_rate'], marker='s', label=library,
                   color=color, linewidth=2, alpha=0.8)

        ax.set_xlabel('Client Count', fontsize=12)
        ax.set_ylabel('Message Loss Rate (%)', fontsize=12)
        ax.set_title('Message Loss Under Load', fontsize=14, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)

        # Plot 3: CPU Utilization vs Client Count (if available)
        ax = axes[1, 0]
        has_cpu_data = False
        for idx, (library, df) in enumerate(degradation_data.items()):
            if 'cpu_percent' in df.columns and df['cpu_percent'].notna().any():
                color = self.colors[idx % len(self.colors)]
                ax.plot(df['client_count'], df['cpu_percent'], marker='^', label=library,
                       color=color, linewidth=2, alpha=0.8)
                has_cpu_data = True

        if has_cpu_data:
            ax.set_xlabel('Client Count', fontsize=12)
            ax.set_ylabel('CPU Utilization (%)', fontsize=12)
            ax.set_title('CPU Usage Under Load', fontsize=14, fontweight='bold')
            ax.legend()
            ax.grid(True, alpha=0.3)
        else:
            ax.text(0.5, 0.5, 'No CPU data available', ha='center', va='center',
                   fontsize=14, transform=ax.transAxes)
            ax.axis('off')

        # Plot 4: Memory Usage vs Client Count (if available)
        ax = axes[1, 1]
        has_memory_data = False
        for idx, (library, df) in enumerate(degradation_data.items()):
            if 'memory_mb' in df.columns and df['memory_mb'].notna().any():
                color = self.colors[idx % len(self.colors)]
                ax.plot(df['client_count'], df['memory_mb'], marker='d', label=library,
                       color=color, linewidth=2, alpha=0.8)
                has_memory_data = True

        if has_memory_data:
            ax.set_xlabel('Client Count', fontsize=12)
            ax.set_ylabel('Memory Usage (MB)', fontsize=12)
            ax.set_title('Memory Usage Under Load', fontsize=14, fontweight='bold')
            ax.legend()
            ax.grid(True, alpha=0.3)
        else:
            ax.text(0.5, 0.5, 'No memory data available', ha='center', va='center',
                   fontsize=14, transform=ax.transAxes)
            ax.axis('off')

        plt.suptitle('Progressive Performance Degradation', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'load_test_progressive_degradation.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved load test progressive degradation chart to: {save_path}")
        plt.close()

    def plot_load_test_max_capacity(self, summary_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing maximum capacity comparison across libraries.

        Args:
            summary_df: DataFrame with load test summary data
            save_path: Path to save the figure
        """
        if summary_df.empty:
            print("Warning: No load test summary data to plot")
            return

        fig, ax = plt.subplots(figsize=(12, 7))

        libraries = summary_df['library'].tolist()
        x = np.arange(len(libraries))
        width = 0.35

        # Create bars for max healthy and max total
        bars1 = ax.bar(x - width/2, summary_df['max_healthy_clients'], width,
                      label='Max Healthy Clients', color=self.colors[2], alpha=0.8)
        bars2 = ax.bar(x + width/2, summary_df['max_total_clients'], width,
                      label='Max Total Clients', color=self.colors[0], alpha=0.6)

        ax.set_xlabel('Library', fontsize=12)
        ax.set_ylabel('Client Count', fontsize=12)
        ax.set_title('Maximum Client Capacity Comparison', fontsize=14, fontweight='bold')
        ax.set_xticks(x)
        ax.set_xticklabels(libraries, rotation=45, ha='right')
        ax.legend()
        ax.grid(True, alpha=0.3, axis='y')

        # Add value labels on bars
        for bar in bars1:
            height = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2., height,
                   f'{int(height)}', ha='center', va='bottom', fontsize=9)

        # Add failure reason annotations
        for i, (lib, reason) in enumerate(zip(libraries, summary_df['failure_reason'])):
            reason_short = reason.replace('_', ' ').title()[:20]
            ax.text(i, 5, reason_short, ha='center', va='bottom',
                   fontsize=8, rotation=90, alpha=0.7)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'load_test_max_capacity.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved load test max capacity chart to: {save_path}")
        plt.close()

    def plot_load_test_health_timeline(self, csv_path, save_path: Optional[str] = None) -> None:
        """
        Create chart showing health status timeline for a single load test.

        Args:
            csv_path: Path to load test CSV file
            save_path: Path to save the figure
        """
        import pandas as pd

        df = pd.read_csv(csv_path)

        if df.empty:
            print("Warning: No load test data to plot")
            return

        # Extract library name from filename
        from pathlib import Path
        filename = Path(csv_path).stem
        library = '_'.join(filename.split('_')[2:-1])

        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(14, 10), sharex=True)

        # Map health status to numeric values for coloring
        health_map = {'GREEN': 0, 'YELLOW': 1, 'RED': 2}
        df['health_numeric'] = df['health_status'].map(health_map)

        # Plot 1: Client count with health status coloring
        colors_map = {0: self.colors[2], 1: '#FFA500', 2: self.colors[0]}  # Green, Orange, Red
        for status, color_idx in health_map.items():
            status_df = df[df['health_status'] == status]
            if not status_df.empty:
                ax1.scatter(range(len(df))[df['health_status'] == status],
                          status_df['client_count'],
                          c=[colors_map[color_idx]] * len(status_df),
                          label=status, s=100, alpha=0.7, edgecolors='black', linewidths=0.5)

        ax1.plot(range(len(df)), df['client_count'], 'k--', alpha=0.3, linewidth=1)
        ax1.set_ylabel('Client Count', fontsize=12)
        ax1.set_title(f'Load Test Health Timeline - {library}', fontsize=14, fontweight='bold')
        ax1.legend(title='Health Status')
        ax1.grid(True, alpha=0.3)

        # Plot 2: RTT P95 with threshold line
        ax2.plot(range(len(df)), df['rtt_p95'], marker='o', color=self.colors[3],
                linewidth=2, label='RTT P95')
        ax2.axhline(y=500, color='red', linestyle='--', linewidth=1, alpha=0.7, label='P95 Threshold (500ms)')
        ax2.set_xlabel('Test Step', fontsize=12)
        ax2.set_ylabel('RTT P95 (ms)', fontsize=12)
        ax2.set_title('Latency Evolution', fontsize=12, fontweight='bold')
        ax2.legend()
        ax2.grid(True, alpha=0.3)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / f'load_test_health_timeline_{library}.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved load test health timeline chart to: {save_path}")
        plt.close()

    def plot_load_test_resource_efficiency(self, efficiency_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create chart showing resource efficiency comparison.

        Args:
            efficiency_df: DataFrame with resource efficiency metrics
            save_path: Path to save the figure
        """
        if efficiency_df.empty:
            print("Warning: No efficiency data to plot")
            return

        fig, axes = plt.subplots(1, 3, figsize=(16, 5))

        libraries = efficiency_df['library'].tolist()
        x = np.arange(len(libraries))
        width = 0.6

        # Plot 1: CPU per client
        ax = axes[0]
        if 'cpu_percent_per_client' in efficiency_df.columns:
            cpu_data = efficiency_df['cpu_percent_per_client'].fillna(0)
            bars = ax.bar(x, cpu_data, width, color=self.colors[:len(libraries)], alpha=0.8)
            ax.set_ylabel('CPU % per Client', fontsize=12)
            ax.set_title('CPU Efficiency', fontsize=14, fontweight='bold')

            for i, v in enumerate(cpu_data):
                if v > 0:
                    ax.text(i, v, f'{v:.4f}', ha='center', va='bottom', fontsize=9)
        else:
            ax.text(0.5, 0.5, 'No CPU data', ha='center', va='center', transform=ax.transAxes)
            ax.axis('off')

        # Plot 2: Memory per client
        ax = axes[1]
        if 'memory_mb_per_client' in efficiency_df.columns:
            mem_data = efficiency_df['memory_mb_per_client'].fillna(0)
            bars = ax.bar(x, mem_data, width, color=self.colors[:len(libraries)], alpha=0.8)
            ax.set_ylabel('Memory (MB) per Client', fontsize=12)
            ax.set_title('Memory Efficiency', fontsize=14, fontweight='bold')

            for i, v in enumerate(mem_data):
                if v > 0:
                    ax.text(i, v, f'{v:.4f}', ha='center', va='bottom', fontsize=9)
        else:
            ax.text(0.5, 0.5, 'No memory data', ha='center', va='center', transform=ax.transAxes)
            ax.axis('off')

        # Plot 3: Throughput per client
        ax = axes[2]
        if 'throughput_per_client' in efficiency_df.columns:
            throughput_data = efficiency_df['throughput_per_client']
            bars = ax.bar(x, throughput_data, width, color=self.colors[:len(libraries)], alpha=0.8)
            ax.set_ylabel('Messages/sec per Client', fontsize=12)
            ax.set_title('Throughput Efficiency', fontsize=14, fontweight='bold')

            for i, v in enumerate(throughput_data):
                ax.text(i, v, f'{v:.2f}', ha='center', va='bottom', fontsize=9)

        # Set x-axis labels for all plots
        for ax in axes:
            if ax.get_visible():
                ax.set_xticks(x)
                ax.set_xticklabels(libraries, rotation=45, ha='right', fontsize=10)
                ax.grid(True, alpha=0.3, axis='y')

        plt.suptitle('Resource Efficiency Comparison', fontsize=16, fontweight='bold')
        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'load_test_resource_efficiency.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved load test resource efficiency chart to: {save_path}")
        plt.close()

    def plot_load_test_failure_modes(self, failure_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create pie chart showing distribution of failure modes.

        Args:
            failure_df: DataFrame with failure mode distribution
            save_path: Path to save the figure
        """
        if failure_df.empty:
            print("Warning: No failure mode data to plot")
            return

        fig, ax = plt.subplots(figsize=(10, 8))

        # Create pie chart
        wedges, texts, autotexts = ax.pie(
            failure_df['count'],
            labels=[reason.replace('_', ' ').title() for reason in failure_df['failure_reason']],
            autopct='%1.1f%%',
            colors=self.colors[:len(failure_df)],
            startangle=90,
            textprops={'fontsize': 11}
        )

        # Make percentage text bold
        for autotext in autotexts:
            autotext.set_color('white')
            autotext.set_fontweight('bold')

        ax.set_title('Load Test Failure Mode Distribution', fontsize=14, fontweight='bold', pad=20)

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'load_test_failure_modes.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved load test failure modes chart to: {save_path}")
        plt.close()
