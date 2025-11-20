# Tail Index Calculator

A modern web application for calculating tail indexes using Hill Estimator and OLS Log-Log Rank-Size Regression methods. This tool helps analyze extreme value distributions in financial time series data.

![Step 1: Upload Data](https://github.com/user-attachments/assets/540f04ff-7513-49d3-abb7-3dae98bade0b)

## 🚀 How to Use

### Step 1: Prepare Your Data

Create a CSV file with your time series data. The file should have:
- **First row**: Column headers (e.g., Date, Price_A, Price_B, Price_C)
- **Subsequent rows**: Your data values

**Example CSV format:**
```csv
Date,Price_A,Price_B,Price_C
2023-01-01,100.5,200.3,150.7
2023-01-02,102.1,201.5,152.3
2023-01-03,99.8,199.2,149.1
...
```

### Step 2: Upload Your File

![Step 2: Configure Analysis](https://github.com/user-attachments/assets/b86be122-6fda-4195-98cf-af2afbb7f0ba)

1. Open `index.html` in your web browser
2. **Drag and drop** your CSV file into the upload area, or click **"Choose File"** to browse
3. Once uploaded, you'll see the file name and size
4. Click **"Continue"** to proceed

### Step 3: Configure Analysis

Select your analysis preferences:

#### **Select Columns to Analyze**
- Check the columns containing price/value data you want to analyze
- Don't select date columns - they're automatically excluded from calculations

#### **Select Methods**
- ✅ **Hill Estimator Method**: Calculates tail index using the Hill estimator
- ✅ **OLS Log-Log Rank-Size Regression Method**: Uses rank-size regression analysis
- Both methods are selected by default

#### **Analysis Options**
- ✅ **Generate Graphics**: Creates interactive charts showing progressive analysis
- ✅ **Progressive Analysis (Method 3)**: Analyzes tail index evolution starting from 100 data points
- ✅ **Truncation Level Analysis (Method 4)**: Separate analysis for positive and negative returns

#### **Truncation Levels**
- Set percentages (default: 5% and 10%)
- These determine how much of the tail to analyze in truncation analysis

### Step 4: View Results

![Step 3: Results](https://github.com/user-attachments/assets/e9360129-8b13-426e-b73a-39f75e9eb411)

Click **"Start Calculation"** to begin analysis. You'll see:

#### **Basic Tail Index Results**
A table showing:
- Column name
- Method used (Hill or Rank-Size)
- Tail Index value
- Standard Error
- 95% Confidence Interval (Lower and Upper bounds)

#### **Truncation Level Analysis Results**
Detailed breakdown for positive and negative returns:
- Total number of data points (N)
- Truncation percentage used
- Number of data points used (n)
- Tail index values for both RS and Hill methods
- Standard errors and confidence intervals

#### **Progressive Analysis Charts**
Interactive charts showing:
- How tail index changes as more data points are added
- 95% confidence interval bands
- Separate charts for each column and method

### Step 5: Download Results

Two download options:
- **Download Results (CSV)**: Get all calculations in CSV format for further analysis
- **Download Charts (PNG)**: Save all charts as individual PNG images

Click **"Start New Analysis"** to analyze a different dataset.

## 📊 Understanding the Results

### Tail Index (ξ)
- **Values < 2**: Heavy-tailed distribution (common in financial data)
- **Values > 2**: Lighter tails
- **Lower values**: More extreme events expected

### Methods Explained

#### Hill Estimator
- Formula: `ξ_Hill = n / Σ(log|r|(t) - log|r|(n))`
- Best for: Large sample sizes
- Limitation: Can be sensitive to sample size selection

#### Rank-Size Regression
- Formula: `ln(t - 0.5) = a - b * ln|r|(t)`
- The parameter b represents the tail index
- Preferred by many researchers for robustness

### Standard Error and Confidence Intervals
- **Standard Error**: Measure of estimate precision (lower is better)
- **95% CI**: Range where true value likely falls (narrower is better)

## 💡 Tips for Best Results

1. **Sample Size**: Use at least 100 data points for reliable results
2. **Data Quality**: Ensure your CSV is properly formatted with no missing values in price columns
3. **Column Selection**: Only select numeric price/value columns
4. **Interpretation**: Compare both Hill and Rank-Size methods for robustness
5. **Progressive Analysis**: Watch for stability in tail index as sample size increases

## 🔧 Technical Details

### Calculation Process
1. **Daily Returns**: Automatically calculated as `(P_t - P_{t-1}) / P_{t-1}`
2. **Absolute Values**: Returns converted to absolute values
3. **Sorting**: Data sorted in descending order
4. **Tail Index Calculation**: Applied to sorted absolute returns

### Progressive Analysis
- Starts with first 100 data points
- Adds one observation at a time
- Recalculates tail index for each step
- Shows evolution with confidence bands

### Truncation Analysis
- Separates positive and negative returns
- Analyzes only the top X% (truncation level)
- Provides separate estimates for each tail

## 🌐 Running Locally

1. Download or clone this repository
2. Open `index.html` in any modern web browser
3. No installation or server required!

## 📝 File Format Requirements

- **Format**: CSV (Comma-Separated Values)
- **Encoding**: UTF-8
- **First row**: Must contain column headers
- **Data rows**: Numeric values only (no text in price columns)
- **No special requirements**: Works with any size dataset

## ❓ Troubleshooting

**Issue**: "Please select a CSV file" error
- **Solution**: Make sure your file has a .csv extension

**Issue**: No results or NaN values
- **Solution**: Ensure you have enough data points (minimum 10, recommended 100+)

**Issue**: Charts not displaying
- **Solution**: Make sure "Generate Graphics" is checked in Step 2

**Issue**: Unexpected tail index values
- **Solution**: Check that you selected the correct columns (price columns, not date)

## 📚 References

This implementation is based on:
- Hill, B. M. (1975). A simple general approach to inference about the tail of a distribution
- Gabaix, X., & Ibragimov, R. (2011). Rank-1/2: A simple way to improve the OLS estimation of tail exponents

## 📄 License

Open source - free to use for research and educational purposes.