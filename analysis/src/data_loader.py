"""
Data loading utilities for WebSocket benchmark CSV files.
"""

import pandas as pd
import os
from pathlib import Path
from typing import Dict, List, Tuple
import glob


class DataLoader:
    """Loads and manages benchmark CSV data."""

    def __init__(self, data_dir: str = "../../data/raw"):
        """
        Initialize the data loader.

        Args:
            data_dir: Path to directory containing raw CSV files
        """
        self.data_dir = Path(data_dir)
        if not self.data_dir.exists():
            raise ValueError(f"Data directory not found: {self.data_dir}")

    def load_rtt_data(self, library: str, client_count: int) -> pd.DataFrame:
        """
        Load RTT (Round Trip Time) data for a specific library and client count.

        Args:
            library: Library name (e.g., 'ws', 'socketio', 'golang-gorilla')
            client_count: Number of clients

        Returns:
            DataFrame with columns: client_id, rtt_ms, timestamp
        """
        pattern = f"rtt_{library}_{client_count}clients.csv"
        file_path = self.data_dir / pattern

        if not file_path.exists():
            return pd.DataFrame(columns=['client_id', 'rtt_ms', 'timestamp'])

        df = pd.read_csv(file_path)
        df['library'] = library
        df['client_count'] = client_count
        return df

    def load_connection_time_data(self, library: str, client_count: int) -> pd.DataFrame:
        """
        Load connection time data for a specific library and client count.

        Args:
            library: Library name
            client_count: Number of clients

        Returns:
            DataFrame with columns: client_id, connection_time_ms
        """
        pattern = f"connection_time_{library}_{client_count}clients.csv"
        file_path = self.data_dir / pattern

        if not file_path.exists():
            return pd.DataFrame(columns=['client_id', 'connection_time_ms'])

        df = pd.read_csv(file_path)
        df['library'] = library
        df['client_count'] = client_count
        return df

    def load_broadcast_latency_data(self, library: str, client_count: int) -> pd.DataFrame:
        """
        Load broadcast latency data for a specific library and client count.

        Args:
            library: Library name
            client_count: Number of clients

        Returns:
            DataFrame with columns: client_id, latency_ms, timestamp
        """
        pattern = f"broadcast_latency_{library}_{client_count}clients.csv"
        file_path = self.data_dir / pattern

        if not file_path.exists():
            return pd.DataFrame(columns=['client_id', 'latency_ms', 'timestamp'])

        df = pd.read_csv(file_path)
        df['library'] = library
        df['client_count'] = client_count
        return df

    def load_throughput_data(self, library: str) -> pd.DataFrame:
        """
        Load server-side throughput data for a specific library.

        Args:
            library: Library name

        Returns:
            DataFrame with columns: timestamp, messages_per_second, active_connections
        """
        # Throughput files use underscores, but library names may have hyphens
        library_normalized = library.replace('-', '_')
        pattern = f"throughput_{library_normalized}.csv"
        file_path = self.data_dir / pattern

        if not file_path.exists():
            return pd.DataFrame(columns=['timestamp', 'messages_per_second', 'active_connections'])

        df = pd.read_csv(file_path)
        df['library'] = library  # Keep original library name for consistency
        return df

    def discover_libraries(self) -> List[str]:
        """
        Discover all libraries present in the data directory.

        Returns:
            List of library names
        """
        libraries = set()

        # Check RTT files
        for file in self.data_dir.glob("rtt_*.csv"):
            # Extract library name from pattern: rtt_{library}_{count}clients.csv
            name = file.stem.replace("rtt_", "")
            if "_" in name:
                library = "_".join(name.split("_")[:-1])  # Remove the last part (client count)
                libraries.add(library)

        return sorted(list(libraries))

    def discover_client_counts(self, library: str) -> List[int]:
        """
        Discover all client counts available for a specific library.

        Args:
            library: Library name

        Returns:
            Sorted list of client counts
        """
        counts = set()

        # Check RTT files
        pattern = f"rtt_{library}_*clients.csv"
        for file in self.data_dir.glob(pattern):
            # Extract count from pattern: rtt_{library}_{count}clients.csv
            stem = file.stem
            parts = stem.split("_")
            if parts[-1] == "clients":
                # This shouldn't happen with our pattern, let's try a different approach
                continue
            # Try to extract number before "clients"
            count_str = stem.split("_")[-1].replace("clients", "")
            try:
                counts.add(int(count_str))
            except ValueError:
                continue

        return sorted(list(counts))

    def load_all_rtt_data(self, libraries: List[str] = None) -> pd.DataFrame:
        """
        Load all RTT data for specified libraries.

        Args:
            libraries: List of library names (None = all discovered libraries)

        Returns:
            Combined DataFrame with all RTT data
        """
        if libraries is None:
            libraries = self.discover_libraries()

        all_data = []

        for library in libraries:
            client_counts = self.discover_client_counts(library)
            for count in client_counts:
                df = self.load_rtt_data(library, count)
                if not df.empty:
                    all_data.append(df)

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def load_all_connection_time_data(self, libraries: List[str] = None) -> pd.DataFrame:
        """
        Load all connection time data for specified libraries.

        Args:
            libraries: List of library names (None = all discovered libraries)

        Returns:
            Combined DataFrame with all connection time data
        """
        if libraries is None:
            libraries = self.discover_libraries()

        all_data = []

        for library in libraries:
            client_counts = self.discover_client_counts(library)
            for count in client_counts:
                df = self.load_connection_time_data(library, count)
                if not df.empty:
                    all_data.append(df)

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def load_all_broadcast_latency_data(self, libraries: List[str] = None) -> pd.DataFrame:
        """
        Load all broadcast latency data for specified libraries.

        Args:
            libraries: List of library names (None = all discovered libraries)

        Returns:
            Combined DataFrame with all broadcast latency data
        """
        if libraries is None:
            libraries = self.discover_libraries()

        all_data = []

        for library in libraries:
            client_counts = self.discover_client_counts(library)
            for count in client_counts:
                df = self.load_broadcast_latency_data(library, count)
                if not df.empty:
                    all_data.append(df)

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def load_reliability_data(self, library: str, client_count: int) -> pd.DataFrame:
        """
        Load reliability metrics data for a specific library and client count.

        Args:
            library: Library name (e.g., 'ws', 'socketio')
            client_count: Number of clients

        Returns:
            DataFrame with columns: client_id, messages_sent, messages_received, messages_lost, loss_rate_percent, library, client_count
        """
        pattern = f"reliability_{library}_{client_count}clients.csv"
        file_path = self.data_dir / pattern

        if not file_path.exists():
            return pd.DataFrame(columns=['client_id', 'messages_sent', 'messages_received', 'messages_lost', 'loss_rate_percent'])

        df = pd.read_csv(file_path)
        df['library'] = library
        df['client_count'] = client_count
        return df

    def load_connection_stability_data(self, library: str, client_count: int) -> pd.DataFrame:
        """
        Load connection stability metrics data for a specific library and client count.

        Args:
            library: Library name (e.g., 'ws', 'socketio')
            client_count: Number of clients

        Returns:
            DataFrame with columns: client_id, disconnect_count, library, client_count
        """
        pattern = f"connection_stability_{library}_{client_count}clients.csv"
        file_path = self.data_dir / pattern

        if not file_path.exists():
            return pd.DataFrame(columns=['client_id', 'disconnect_count'])

        df = pd.read_csv(file_path)
        df['library'] = library
        df['client_count'] = client_count
        return df

    def load_resource_data(self, server_name: str) -> pd.DataFrame:
        """
        Load server resource metrics data.

        Args:
            server_name: Server name (e.g., 'golang_gorilla', 'golang_coder', 'ws', 'socketio')

        Returns:
            DataFrame with resource metrics (columns vary by server type)
        """
        # Resource files use underscores, normalize the server name
        server_normalized = server_name.replace('-', '_')
        pattern = f"resources_{server_normalized}.csv"
        file_path = self.data_dir / pattern

        if not file_path.exists():
            return pd.DataFrame()

        df = pd.read_csv(file_path)
        df['server'] = server_name  # Keep original server name for consistency

        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])

        return df

    def load_all_reliability_data(self, libraries: List[str] = None) -> pd.DataFrame:
        """
        Load all reliability metrics data across all libraries and client counts.

        Args:
            libraries: List of library names (None = all discovered libraries)

        Returns:
            Combined DataFrame with all reliability data
        """
        if libraries is None:
            libraries = self.discover_libraries()

        all_data = []

        for library in libraries:
            client_counts = self.discover_client_counts(library)
            for count in client_counts:
                df = self.load_reliability_data(library, count)
                if not df.empty:
                    all_data.append(df)

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def load_all_stability_data(self, libraries: List[str] = None) -> pd.DataFrame:
        """
        Load all connection stability data across all libraries and client counts.

        Args:
            libraries: List of library names (None = all discovered libraries)

        Returns:
            Combined DataFrame with all connection stability data
        """
        if libraries is None:
            libraries = self.discover_libraries()

        all_data = []

        for library in libraries:
            client_counts = self.discover_client_counts(library)
            for count in client_counts:
                df = self.load_connection_stability_data(library, count)
                if not df.empty:
                    all_data.append(df)

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)

    def load_all_resource_data(self, servers: List[str] = None) -> pd.DataFrame:
        """
        Load all server resource metrics data.

        Args:
            servers: List of server names (None = discover from available files)

        Returns:
            Combined DataFrame with all resource metrics
        """
        if servers is None:
            # Discover servers from resource files
            servers = []
            for file in self.data_dir.glob("resources_*.csv"):
                # Extract server name from pattern: resources_{server}.csv
                server_name = file.stem.replace("resources_", "")
                # Convert underscores to hyphens to match library naming convention
                server_name = server_name.replace('_', '-')
                servers.append(server_name)

        all_data = []

        for server in servers:
            df = self.load_resource_data(server)
            if not df.empty:
                all_data.append(df)

        if not all_data:
            return pd.DataFrame()

        return pd.concat(all_data, ignore_index=True)
