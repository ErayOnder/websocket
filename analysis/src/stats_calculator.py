"""
Statistical aggregation for benchmark data.
"""

import pandas as pd
import numpy as np
from typing import Dict, List


class StatisticsCalculator:
    """Calculates statistical summaries of benchmark data."""

    @staticmethod
    def calculate_basic_stats(data: pd.Series) -> Dict[str, float]:
        """
        Calculate basic statistics for a data series.

        Args:
            data: Pandas Series of numeric values

        Returns:
            Dictionary with mean, median, std, min, max, count
        """
        if data.empty:
            return {
                'mean': np.nan,
                'median': np.nan,
                'std': np.nan,
                'min': np.nan,
                'max': np.nan,
                'count': 0
            }

        return {
            'mean': data.mean(),
            'median': data.median(),
            'std': data.std(),
            'min': data.min(),
            'max': data.max(),
            'count': len(data)
        }

    def aggregate_rtt_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate RTT statistics by library and client count.

        Args:
            df: DataFrame with columns: library, client_count, rtt_ms

        Returns:
            DataFrame with aggregated statistics
        """
        if df.empty:
            return pd.DataFrame()

        grouped = df.groupby(['library', 'client_count'])['rtt_ms']

        stats = grouped.agg([
            ('mean', 'mean'),
            ('median', 'median'),
            ('std', 'std'),
            ('min', 'min'),
            ('max', 'max'),
            ('count', 'count')
        ]).reset_index()

        return stats

    def aggregate_connection_time_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate connection time statistics by library and client count.

        Args:
            df: DataFrame with columns: library, client_count, connection_time_ms

        Returns:
            DataFrame with aggregated statistics
        """
        if df.empty:
            return pd.DataFrame()

        grouped = df.groupby(['library', 'client_count'])['connection_time_ms']

        stats = grouped.agg([
            ('mean', 'mean'),
            ('median', 'median'),
            ('std', 'std'),
            ('min', 'min'),
            ('max', 'max'),
            ('count', 'count')
        ]).reset_index()

        return stats

    def aggregate_broadcast_latency_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate broadcast latency statistics by library and client count.

        Args:
            df: DataFrame with columns: library, client_count, latency_ms

        Returns:
            DataFrame with aggregated statistics
        """
        if df.empty:
            return pd.DataFrame()

        grouped = df.groupby(['library', 'client_count'])['latency_ms']

        stats = grouped.agg([
            ('mean', 'mean'),
            ('median', 'median'),
            ('std', 'std'),
            ('min', 'min'),
            ('max', 'max'),
            ('count', 'count')
        ]).reset_index()

        return stats

    def aggregate_throughput_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate throughput statistics by library.

        Args:
            df: DataFrame with columns: library, messages_per_second, active_connections

        Returns:
            DataFrame with aggregated statistics
        """
        if df.empty:
            return pd.DataFrame()

        # Filter out zero throughput (idle periods)
        df_active = df[df['messages_per_second'] > 0]

        if df_active.empty:
            return pd.DataFrame()

        grouped = df_active.groupby('library')['messages_per_second']

        stats = grouped.agg([
            ('mean', 'mean'),
            ('median', 'median'),
            ('std', 'std'),
            ('min', 'min'),
            ('max', 'max'),
            ('count', 'count')
        ]).reset_index()

        return stats

    def create_summary_table(self, rtt_df: pd.DataFrame, conn_df: pd.DataFrame,
                           broadcast_df: pd.DataFrame, throughput_df: pd.DataFrame) -> pd.DataFrame:
        """
        Create a comprehensive summary table combining all metrics.

        Args:
            rtt_df: RTT statistics DataFrame
            conn_df: Connection time statistics DataFrame
            broadcast_df: Broadcast latency statistics DataFrame
            throughput_df: Throughput statistics DataFrame

        Returns:
            Combined summary DataFrame
        """
        # Get unique libraries
        libraries = set()
        for df in [rtt_df, conn_df, broadcast_df, throughput_df]:
            if not df.empty and 'library' in df.columns:
                libraries.update(df['library'].unique())

        summaries = []

        for library in sorted(libraries):
            summary = {'library': library}

            # RTT stats (across all client counts)
            if not rtt_df.empty:
                lib_rtt = rtt_df[rtt_df['library'] == library]
                if not lib_rtt.empty:
                    summary['rtt_mean_ms'] = lib_rtt['mean'].mean()
                    summary['rtt_median_ms'] = lib_rtt['median'].median()

            # Connection time stats
            if not conn_df.empty:
                lib_conn = conn_df[conn_df['library'] == library]
                if not lib_conn.empty:
                    summary['conn_mean_ms'] = lib_conn['mean'].mean()
                    summary['conn_median_ms'] = lib_conn['median'].median()

            # Broadcast latency stats
            if not broadcast_df.empty:
                lib_broadcast = broadcast_df[broadcast_df['library'] == library]
                if not lib_broadcast.empty:
                    summary['broadcast_mean_ms'] = lib_broadcast['mean'].mean()
                    summary['broadcast_median_ms'] = lib_broadcast['median'].median()

            # Throughput stats
            if not throughput_df.empty:
                lib_throughput = throughput_df[throughput_df['library'] == library]
                if not lib_throughput.empty:
                    summary['throughput_mean_msg_s'] = lib_throughput['mean'].iloc[0]
                    summary['throughput_max_msg_s'] = lib_throughput['max'].iloc[0]

            summaries.append(summary)

        if not summaries:
            return pd.DataFrame()

        return pd.DataFrame(summaries)

    def calculate_percentiles(self, data: pd.Series, percentiles: List[float] = [25, 50, 75, 95, 99]) -> Dict[str, float]:
        """
        Calculate percentiles for a data series.

        Args:
            data: Pandas Series of numeric values
            percentiles: List of percentile values to calculate

        Returns:
            Dictionary mapping percentile to value
        """
        if data.empty:
            return {f'p{p}': np.nan for p in percentiles}

        return {f'p{p}': np.percentile(data, p) for p in percentiles}
