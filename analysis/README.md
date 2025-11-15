# Data Analysis Module

Processes raw benchmark data and generates statistical summaries and visualizations.

## Features

- Statistical aggregation: Mean, Median, Standard Deviation
- Visualization: Line charts for all metrics
- Summary tables: Peak load performance comparison

## Usage

```bash
pip install -r requirements.txt
python src/analyze.py
```

## Input

Reads CSV files from `../../data/raw/` directory.

## Output

Generates:
- Processed statistics in `../../data/processed/`
- Visualizations (PNG/PDF)
- Summary tables (CSV/Markdown)

