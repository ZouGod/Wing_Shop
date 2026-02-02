# Wing Shop Demand Forecasting Dashboard

A complete inventory and demand forecasting system for Wing Shop supermarket using Python, Jupyter Notebooks, and Flask.

## Project Structure

```
wing-shop-forecast/
├── notebooks/                    # Jupyter Notebooks
│   ├── 01_data_loading.ipynb    # Load and merge datasets
│   ├── 02_eda.ipynb             # Exploratory Data Analysis
│   ├── 03_data_cleaning.ipynb   # Clean and preprocess data
│   ├── 04_model_training.ipynb  # Train ARIMA/Prophet models
│   └── 05_flask_deployment.ipynb# Flask web application
├── data/                        # Data files
├── models/                      # Saved trained models
├── static/                      # CSS and JS files
├── templates/                   # HTML templates
├── requirements.txt             # Python dependencies
└── README.md
```

## Dataset

Download from Kaggle: https://www.kaggle.com/competitions/favorita-grocery-sales-forecasting/data

Required files:
- train.csv (main sales data)
- items.csv (product details)
- stores.csv (store information)
- oil.csv (economic indicator)
- holidays_events.csv (calendar events)
- transactions.csv (customer traffic)

**Note:** If Kaggle data is unavailable, the notebooks will auto-generate sample data simulating Cambodia market conditions.

## Installation

```bash
pip install -r requirements.txt
```

## Usage

1. Place data files in `data/` folder (or use auto-generated sample data)
2. Open Jupyter: `jupyter notebook`
3. Run notebooks in order: 01 → 02 → 03 → 04 → 05
4. The last cell in notebook 05 starts the Flask server
5. Access dashboard at http://localhost:5000

## Model Performance Target

- **Objective:** Predict demand with <10% error margin (MAPE)
- **Methods:** Moving Average, Exponential Smoothing, ARIMA, Prophet, Ensemble
- **Business Impact:** Saves money on storage and ensures customers always find what they need

## Features

- Product/Store filtering
- 7/14/30 day forecasting
- Real-time inventory monitoring
- Stock alerts and reorder recommendations
- 95% confidence intervals on predictions
