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

    def plot_throughput_comparison(self, stats_df: pd.DataFrame, save_path: Optional[str] = None) -> None:
        """
        Create bar chart comparing throughput across libraries.

        Args:
            stats_df: DataFrame with columns: library, mean, max
            save_path: Path to save the figure
        """
        if stats_df.empty:
            print("Warning: No throughput data to plot")
            return

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

        libraries = stats_df['library'].tolist()
        x = np.arange(len(libraries))
        width = 0.6

        # Plot mean throughput
        ax1.bar(x, stats_df['mean'], width,
               color=self.colors[:len(libraries)], alpha=0.8)
        ax1.set_xlabel('Library', fontsize=12)
        ax1.set_ylabel('Mean Throughput (msg/s)', fontsize=12)
        ax1.set_title('Mean Throughput Comparison', fontsize=14, fontweight='bold')
        ax1.set_xticks(x)
        ax1.set_xticklabels(libraries, rotation=45, ha='right')
        ax1.grid(True, alpha=0.3, axis='y')

        # Plot max throughput
        ax2.bar(x, stats_df['max'], width,
               color=self.colors[:len(libraries)], alpha=0.8)
        ax2.set_xlabel('Library', fontsize=12)
        ax2.set_ylabel('Max Throughput (msg/s)', fontsize=12)
        ax2.set_title('Maximum Throughput Comparison', fontsize=14, fontweight='bold')
        ax2.set_xticks(x)
        ax2.set_xticklabels(libraries, rotation=45, ha='right')
        ax2.grid(True, alpha=0.3, axis='y')

        plt.tight_layout()

        if save_path is None:
            save_path = self.output_dir / 'throughput_comparison.png'

        plt.savefig(save_path, bbox_inches='tight')
        print(f"Saved throughput comparison chart to: {save_path}")
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
