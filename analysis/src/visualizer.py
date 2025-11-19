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
