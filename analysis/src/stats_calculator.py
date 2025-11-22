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

    def calculate_throughput_vs_load(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate average throughput vs client load for the load test phase only.
        
        Args:
            df: DataFrame with columns: timestamp, messages_per_second, active_connections
            
        Returns:
            DataFrame with columns: client_count, mean_throughput
        """
        if df.empty:
            return pd.DataFrame()

        # Filter out zero throughput (idle periods) and zero connections (disconnects)
        df_active = df[(df['messages_per_second'] > 0) & (df['active_connections'] > 0)].copy()
        
        if df_active.empty:
            return pd.DataFrame()
            
        # Detect the split between Load Test and Broadcast Test
        # The client count increases (200 -> 3200) then resets (-> 200)
        # We want to keep only the first phase (Load Test)
        
        # Find indices where client count drops significantly (indicating a new test phase)
        # We look for a drop where current < previous
        # But we need to be careful about small fluctuations or the same count repeating
        
        # Get unique client counts in order of appearance to see the pattern
        # But since we have time series data, we can just iterate or use diff
        
        # Calculate difference in active connections
        df_active['conn_diff'] = df_active['active_connections'].diff()
        
        # Find where connection count drops significantly (e.g. by more than 100)
        # This indicates a reset to the start of a new test phase
        reset_points = df_active[df_active['conn_diff'] < -50].index
        
        if not reset_points.empty:
            # The first reset point marks the end of the first phase (Load Test)
            first_reset_idx = reset_points[0]
            # Keep only data up to the reset point
            df_phase1 = df_active.loc[:first_reset_idx-1] # loc is inclusive, so -1 might be needed if index is integer
            # Actually, let's be safer with slicing based on position if index is not monotonic
            
            # Let's use integer location to be safe
            reset_loc = df_active.index.get_loc(first_reset_idx)
            if isinstance(reset_loc, slice):
                # This shouldn't happen with unique index, but just in case
                reset_loc = reset_loc.start
                
            df_phase1 = df_active.iloc[:reset_loc]
        else:
            # No reset found, assume it's all one phase (or just Load Test)
            df_phase1 = df_active
            
        # Group by active_connections (client load) and calculate mean throughput
        grouped = df_phase1.groupby('active_connections')['messages_per_second'].mean().reset_index()
        grouped.rename(columns={
            'active_connections': 'client_count', 
            'messages_per_second': 'mean_throughput'
        }, inplace=True)
        
        return grouped

    def create_summary_table(self, rtt_df: pd.DataFrame, conn_df: pd.DataFrame,
                           broadcast_df: pd.DataFrame, throughput_df: pd.DataFrame,
                           reliability_df: pd.DataFrame = None, stability_df: pd.DataFrame = None) -> pd.DataFrame:
        """
        Create a comprehensive summary table combining all metrics.

        Args:
            rtt_df: RTT statistics DataFrame
            conn_df: Connection time statistics DataFrame
            broadcast_df: Broadcast latency statistics DataFrame
            throughput_df: Throughput statistics DataFrame
            reliability_df: Reliability statistics DataFrame (optional)
            stability_df: Connection stability statistics DataFrame (optional)

        Returns:
            Combined summary DataFrame
        """
        # Get unique libraries
        libraries = set()
        for df in [rtt_df, conn_df, broadcast_df, throughput_df, reliability_df, stability_df]:
            if df is not None and not df.empty and 'library' in df.columns:
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

            # Reliability stats (message loss)
            if reliability_df is not None and not reliability_df.empty:
                lib_reliability = reliability_df[reliability_df['library'] == library]
                if not lib_reliability.empty:
                    summary['message_loss_rate_pct'] = lib_reliability['total_loss_rate'].mean()
                    summary['messages_lost_total'] = lib_reliability['messages_lost_sum'].sum()

            # Stability stats (disconnects)
            if stability_df is not None and not stability_df.empty:
                lib_stability = stability_df[stability_df['library'] == library]
                if not lib_stability.empty:
                    summary['disconnect_count_total'] = lib_stability['disconnect_count_sum'].sum()
                    summary['clients_with_disconnects_pct'] = lib_stability['clients_with_disconnects_pct'].mean()

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

    def aggregate_reliability_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate reliability metrics (message loss rate) by library and client count.

        Args:
            df: DataFrame with columns: library, client_count, messages_sent, messages_received, messages_lost, loss_rate_percent

        Returns:
            DataFrame with aggregated reliability statistics
        """
        if df.empty:
            return pd.DataFrame()

        grouped = df.groupby(['library', 'client_count'])

        stats = grouped.agg({
            'messages_sent': ['sum', 'mean'],
            'messages_received': ['sum', 'mean'],
            'messages_lost': ['sum', 'mean'],
            'loss_rate_percent': ['mean', 'median', 'max']
        }).reset_index()

        # Flatten column names
        stats.columns = ['_'.join(col).strip('_') if col[1] else col[0] for col in stats.columns.values]

        # Calculate overall loss rate from totals
        stats['total_loss_rate'] = (stats['messages_lost_sum'] / stats['messages_sent_sum'] * 100).round(2)

        return stats

    def aggregate_stability_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate connection stability metrics by library and client count.

        Args:
            df: DataFrame with columns: library, client_count, disconnect_count

        Returns:
            DataFrame with aggregated stability statistics
        """
        if df.empty:
            return pd.DataFrame()

        grouped = df.groupby(['library', 'client_count'])

        stats = grouped.agg({
            'disconnect_count': ['sum', 'mean', 'median', 'max', 'count']
        }).reset_index()

        # Flatten column names
        stats.columns = ['_'.join(col).strip('_') if col[1] else col[0] for col in stats.columns.values]

        # Calculate percentage of clients with disconnects
        stats['clients_with_disconnects_pct'] = (
            (grouped['disconnect_count'].apply(lambda x: (x > 0).sum()).reset_index(drop=True) / stats['disconnect_count_count']) * 100
        ).round(2)

        return stats

    def aggregate_resource_stats(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Aggregate server resource metrics by server.

        Args:
            df: DataFrame with resource metrics (columns vary by server type)

        Returns:
            DataFrame with aggregated resource statistics
        """
        if df.empty:
            return pd.DataFrame()

        summaries = []

        for server in df['server'].unique():
            server_df = df[df['server'] == server]
            summary = {'server': server}

            # Golang servers have: cpu_goroutines, memory_alloc_mb, memory_sys_mb, gc_count
            if 'cpu_goroutines' in server_df.columns:
                summary['cpu_goroutines_mean'] = server_df['cpu_goroutines'].mean()
                summary['cpu_goroutines_max'] = server_df['cpu_goroutines'].max()
                summary['memory_alloc_mb_mean'] = server_df['memory_alloc_mb'].mean()
                summary['memory_alloc_mb_max'] = server_df['memory_alloc_mb'].max()
                summary['memory_sys_mb_mean'] = server_df['memory_sys_mb'].mean()
                summary['memory_sys_mb_max'] = server_df['memory_sys_mb'].max()
                summary['gc_count_total'] = server_df['gc_count'].max() - server_df['gc_count'].min()

            # Node.js servers have: cpu_user_ms, cpu_system_ms, cpu_percent, memory_rss_mb, memory_heap_used_mb, etc.
            if 'cpu_user_ms' in server_df.columns:
                summary['cpu_user_ms_mean'] = server_df['cpu_user_ms'].mean()
                summary['cpu_user_ms_max'] = server_df['cpu_user_ms'].max()
                summary['cpu_system_ms_mean'] = server_df['cpu_system_ms'].mean()
                summary['cpu_system_ms_max'] = server_df['cpu_system_ms'].max()
                if 'cpu_percent' in server_df.columns:
                    summary['cpu_percent_mean'] = server_df['cpu_percent'].mean()
                    summary['cpu_percent_max'] = server_df['cpu_percent'].max()
                summary['memory_rss_mb_mean'] = server_df['memory_rss_mb'].mean()
                summary['memory_rss_mb_max'] = server_df['memory_rss_mb'].max()
                summary['memory_heap_used_mb_mean'] = server_df['memory_heap_used_mb'].mean()
                summary['memory_heap_used_mb_max'] = server_df['memory_heap_used_mb'].max()

            summaries.append(summary)

        return pd.DataFrame(summaries)

    def calculate_performance_degradation(self, rtt_df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate performance degradation as client count increases.

        Args:
            df: DataFrame with columns: library, client_count, mean (RTT mean)

        Returns:
            DataFrame with degradation metrics per library
        """
        if rtt_df.empty:
            return pd.DataFrame()

        degradation_results = []

        for library in rtt_df['library'].unique():
            lib_df = rtt_df[rtt_df['library'] == library].sort_values('client_count')

            if len(lib_df) < 2:
                continue

            # Get baseline (lowest client count)
            baseline_count = lib_df['client_count'].min()
            baseline_rtt = lib_df[lib_df['client_count'] == baseline_count]['mean'].iloc[0]

            # Get peak load (highest client count)
            peak_count = lib_df['client_count'].max()
            peak_rtt = lib_df[lib_df['client_count'] == peak_count]['mean'].iloc[0]

            # Calculate degradation metrics
            degradation_pct = ((peak_rtt - baseline_rtt) / baseline_rtt * 100) if baseline_rtt > 0 else 0
            degradation_per_100_clients = degradation_pct / ((peak_count - baseline_count) / 100) if peak_count > baseline_count else 0

            degradation_results.append({
                'library': library,
                'baseline_clients': baseline_count,
                'baseline_rtt_ms': round(baseline_rtt, 2),
                'peak_clients': peak_count,
                'peak_rtt_ms': round(peak_rtt, 2),
                'total_degradation_pct': round(degradation_pct, 2),
                'degradation_per_100_clients_pct': round(degradation_per_100_clients, 2)
            })

        return pd.DataFrame(degradation_results)

    def detect_memory_leaks(self, resource_df: pd.DataFrame) -> pd.DataFrame:
        """
        Detect potential memory leaks using linear regression on memory usage over time.

        Args:
            resource_df: DataFrame with timestamp and memory metrics

        Returns:
            DataFrame with leak detection results per server
        """
        if resource_df.empty:
            return pd.DataFrame()

        from scipy import stats as scipy_stats

        leak_results = []

        for server in resource_df['server'].unique():
            # Make a copy to avoid SettingWithCopyWarning and ensure proper operations
            server_df = resource_df[resource_df['server'] == server].copy()
            
            # Ensure timestamp is datetime before sorting
            server_df['timestamp'] = pd.to_datetime(server_df['timestamp'], errors='coerce')
            server_df = server_df.dropna(subset=['timestamp']).sort_values('timestamp').reset_index(drop=True)

            if len(server_df) < 10:  # Need at least 10 data points
                continue
            
            # Create time index (seconds since start)
            # Convert to numeric (nanoseconds since epoch) then to seconds
            timestamps_numeric = server_df['timestamp'].astype('int64') / 1e9
            min_time = timestamps_numeric.min()
            server_df['time_index'] = timestamps_numeric - min_time

            # Detect leak for different memory metrics
            memory_cols = []
            if 'memory_alloc_mb' in server_df.columns:
                memory_cols.append(('memory_alloc_mb', 'Memory Alloc (MB)'))
            if 'memory_sys_mb' in server_df.columns:
                memory_cols.append(('memory_sys_mb', 'Memory Sys (MB)'))
            if 'memory_rss_mb' in server_df.columns:
                memory_cols.append(('memory_rss_mb', 'Memory RSS (MB)'))
            if 'memory_heap_used_mb' in server_df.columns:
                memory_cols.append(('memory_heap_used_mb', 'Memory Heap Used (MB)'))

            for mem_col, mem_name in memory_cols:
                # Linear regression: memory = slope * time + intercept
                slope, intercept, r_value, p_value, std_err = scipy_stats.linregress(
                    server_df['time_index'],
                    server_df[mem_col]
                )

                # Memory growth rate (MB per hour)
                growth_rate_per_hour = slope * 3600

                # Determine if leak is likely
                # Criteria: positive slope, high R² (good fit), statistically significant (p < 0.05)
                is_leak_likely = (
                    slope > 0.01 and  # Growing by more than 0.01 MB/sec
                    r_value ** 2 > 0.7 and  # Good linear fit
                    p_value < 0.05  # Statistically significant
                )

                leak_results.append({
                    'server': server,
                    'metric': mem_name,
                    'growth_rate_mb_per_hour': round(growth_rate_per_hour, 4),
                    'r_squared': round(r_value ** 2, 4),
                    'p_value': round(p_value, 4),
                    'leak_detected': is_leak_likely,
                    'start_memory_mb': round(server_df[mem_col].iloc[0], 2),
                    'end_memory_mb': round(server_df[mem_col].iloc[-1], 2),
                    'total_growth_mb': round(server_df[mem_col].iloc[-1] - server_df[mem_col].iloc[0], 2)
                })

        return pd.DataFrame(leak_results)
