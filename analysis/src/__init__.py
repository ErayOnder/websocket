"""
WebSocket Benchmark Analysis Module

This module provides tools for analyzing WebSocket benchmark data:
- Data loading from CSV files
- Statistical aggregation
- Visualization generation
- Summary table creation
"""

__version__ = "1.0.0"

from .data_loader import DataLoader
from .stats_calculator import StatisticsCalculator
from .visualizer import Visualizer

__all__ = ['DataLoader', 'StatisticsCalculator', 'Visualizer']
