// Global variables
let currentData = null;
let selectedColumns = [];
let calculationResults = {};

// DOM elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupFileUpload();
});

// File upload functionality
function setupFileUpload() {
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect({ target: { files: files } });
        }
    });
    
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a CSV file.');
        return;
    }
    
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.remove('hidden');
    
    // Parse CSV file
    Papa.parse(file, {
        header: true,
        complete: function(results) {
            currentData = results.data;
            console.log('Parsed data:', currentData);
            console.log('Columns found:', Object.keys(currentData[0] || {}));
        },
        error: function(error) {
            alert('Error parsing CSV file: ' + error.message);
            console.error('Parse error:', error);
        }
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Navigation functions
function nextStep() {
    if (!currentData) {
        alert('Please upload a file first.');
        return;
    }
    
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('step2').classList.remove('hidden');
    
    populateColumnSelection();
}

function prevStep() {
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
}

function populateColumnSelection() {
    const columnSelection = document.getElementById('columnSelection');
    columnSelection.innerHTML = '';
    
    if (!currentData || currentData.length === 0) return;
    
    const headers = Object.keys(currentData[0]);
    
    headers.forEach((header, index) => {
        const columnItem = document.createElement('div');
        columnItem.className = 'column-item';
        columnItem.innerHTML = `
            <input type="checkbox" id="col_${index}" value="${header}" onchange="toggleColumn('${header}')">
            <label for="col_${index}">${header}</label>
        `;
        columnSelection.appendChild(columnItem);
    });
}

function toggleColumn(columnName) {
    if (selectedColumns.includes(columnName)) {
        selectedColumns = selectedColumns.filter(col => col !== columnName);
    } else {
        selectedColumns.push(columnName);
    }
}

// Main calculation function
async function startCalculation() {
    if (selectedColumns.length === 0) {
        alert('Please select at least one column to analyze.');
        return;
    }
    
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('step3').classList.remove('hidden');
    document.getElementById('loadingIndicator').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    
    try {
        // Perform calculations
        await performCalculations();
        
        // Display results
        displayResults();
        
        document.getElementById('loadingIndicator').classList.add('hidden');
        document.getElementById('results').classList.remove('hidden');
    } catch (error) {
        alert('Error during calculation: ' + error.message);
        console.error('Calculation error:', error);
    }
}

async function performCalculations() {
    calculationResults = {
        basic: [],
        progressive: {},
        truncation: []
    };
    
    for (const columnName of selectedColumns) {
        console.log(`Processing column: ${columnName}`);
        
        // Get column data and calculate daily returns
        const columnData = extractColumnData(columnName);
        const dailyReturns = calculateDailyReturns(columnData);
        const absReturns = dailyReturns.map(Math.abs).filter(val => !isNaN(val) && val > 0);
        
        if (absReturns.length === 0) {
            console.warn(`No valid data for column ${columnName}`);
            continue;
        }
        
        // Sort in descending order
        absReturns.sort((a, b) => b - a);
        
        // Basic calculations
        if (document.getElementById('methodHill').checked) {
            const hillResult = calculateHillEstimator(absReturns);
            calculationResults.basic.push({
                column: columnName,
                method: 'Hill',
                ...hillResult
            });
        }
        
        if (document.getElementById('methodRS').checked) {
            const rsResult = calculateRankSizeRegression(absReturns);
            calculationResults.basic.push({
                column: columnName,
                method: 'Rank-Size',
                ...rsResult
            });
        }
        
        // Progressive analysis (Method 3)
        if (document.getElementById('progressiveAnalysis').checked) {
            calculationResults.progressive[columnName] = calculateProgressiveAnalysis(absReturns);
        }
        
        // Truncation analysis (Method 4)
        if (document.getElementById('truncationAnalysis').checked) {
            const truncation1 = parseInt(document.getElementById('truncation1').value);
            const truncation2 = parseInt(document.getElementById('truncation2').value);
            
            const truncationResults = calculateTruncationAnalysis(dailyReturns, truncation1, truncation2);
            truncationResults.forEach(result => {
                calculationResults.truncation.push({
                    column: columnName,
                    ...result
                });
            });
        }
    }
}

function extractColumnData(columnName) {
    return currentData.map(row => parseFloat(row[columnName])).filter(val => !isNaN(val));
}

function calculateDailyReturns(prices) {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
        if (prices[i-1] !== 0) {
            returns.push((prices[i] - prices[i-1]) / prices[i-1]);
        }
    }
    return returns;
}

// Hill Estimator calculation
function calculateHillEstimator(sortedAbsReturns) {
    const n = sortedAbsReturns.length;
    const logValues = sortedAbsReturns.map(Math.log);
    const logRn = logValues[n-1]; // log of the smallest value
    
    let sum = 0;
    for (let i = 0; i < n; i++) {
        sum += logValues[i] - logRn;
    }
    
    const xi = n / sum;
    const standardError = xi / Math.sqrt(n);
    const margin = 1.96 * standardError;
    
    return {
        tailIndex: xi,
        standardError: standardError,
        ciLower: xi - margin,
        ciUpper: xi + margin
    };
}

// Rank-Size Regression calculation
function calculateRankSizeRegression(sortedAbsReturns) {
    const n = sortedAbsReturns.length;
    const logValues = sortedAbsReturns.map(Math.log);
    
    // Prepare data for regression: ln(t - 0.5) vs ln|r|(t)
    const xValues = []; // ln(t - 0.5)
    const yValues = []; // ln|r|(t)
    
    for (let t = 1; t <= n; t++) {
        xValues.push(Math.log(t - 0.5));
        yValues.push(logValues[t-1]);
    }
    
    // Linear regression
    const regression = linearRegression(yValues, xValues); // Note: y vs x for slope interpretation
    const slope = Math.abs(regression.slope); // b parameter (tail index)
    
    const standardError = Math.sqrt(2/n) * slope;
    const margin = 1.96 * standardError;
    
    return {
        tailIndex: slope,
        standardError: standardError,
        ciLower: slope - margin,
        ciUpper: slope + margin
    };
}

function linearRegression(y, x) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
}

// Progressive analysis (Method 3)
function calculateProgressiveAnalysis(sortedAbsReturns) {
    const results = {
        hill: [],
        rankSize: []
    };
    
    const startSize = Math.min(100, sortedAbsReturns.length);
    
    for (let size = startSize; size <= sortedAbsReturns.length; size++) {
        const subset = sortedAbsReturns.slice(0, size);
        
        if (document.getElementById('methodHill').checked) {
            const hillResult = calculateHillEstimator(subset);
            results.hill.push({
                sampleSize: size,
                ...hillResult
            });
        }
        
        if (document.getElementById('methodRS').checked) {
            const rsResult = calculateRankSizeRegression(subset);
            results.rankSize.push({
                sampleSize: size,
                ...rsResult
            });
        }
    }
    
    return results;
}

// Truncation analysis (Method 4)
function calculateTruncationAnalysis(dailyReturns, truncation1, truncation2) {
    // Separate positive and negative returns
    const positiveReturns = dailyReturns.filter(r => r > 0).sort((a, b) => b - a);
    const negativeReturns = dailyReturns.filter(r => r < 0).map(Math.abs).sort((a, b) => b - a);
    
    const results = [];
    
    [truncation1, truncation2].forEach(truncLevel => {
        // Positive returns analysis
        if (positiveReturns.length > 0) {
            const truncSize = Math.floor(positiveReturns.length * truncLevel / 100);
            const truncatedData = positiveReturns.slice(0, Math.max(1, truncSize));
            
            const hillResult = calculateHillEstimator(truncatedData);
            const rsResult = calculateRankSizeRegression(truncatedData);
            
            results.push({
                type: 'Positive',
                totalN: positiveReturns.length,
                truncationLevel: truncLevel,
                usedN: truncatedData.length,
                hillTailIndex: hillResult.tailIndex,
                hillStandardError: hillResult.standardError,
                hillCiLower: hillResult.ciLower,
                hillCiUpper: hillResult.ciUpper,
                rsTailIndex: rsResult.tailIndex,
                rsStandardError: rsResult.standardError,
                rsCiLower: rsResult.ciLower,
                rsCiUpper: rsResult.ciUpper
            });
        }
        
        // Negative returns analysis
        if (negativeReturns.length > 0) {
            const truncSize = Math.floor(negativeReturns.length * truncLevel / 100);
            const truncatedData = negativeReturns.slice(0, Math.max(1, truncSize));
            
            const hillResult = calculateHillEstimator(truncatedData);
            const rsResult = calculateRankSizeRegression(truncatedData);
            
            results.push({
                type: 'Negative',
                totalN: negativeReturns.length,
                truncationLevel: truncLevel,
                usedN: truncatedData.length,
                hillTailIndex: hillResult.tailIndex,
                hillStandardError: hillResult.standardError,
                hillCiLower: hillResult.ciLower,
                hillCiUpper: hillResult.ciUpper,
                rsTailIndex: rsResult.tailIndex,
                rsStandardError: rsResult.standardError,
                rsCiLower: rsResult.ciLower,
                rsCiUpper: rsResult.ciUpper
            });
        }
    });
    
    return results;
}

// Display results
function displayResults() {
    displayBasicResults();
    displayTruncationResults();
    if (document.getElementById('generateGraphics').checked) {
        displayCharts();
    }
}

function displayBasicResults() {
    const tbody = document.querySelector('#basicResultsTable tbody');
    tbody.innerHTML = '';
    
    calculationResults.basic.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.column}</td>
            <td>${result.method}</td>
            <td>${result.tailIndex.toFixed(4)}</td>
            <td>${result.standardError.toFixed(4)}</td>
            <td>${result.ciLower.toFixed(4)}</td>
            <td>${result.ciUpper.toFixed(4)}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayTruncationResults() {
    if (calculationResults.truncation.length === 0) {
        document.getElementById('truncationResultsSection').style.display = 'none';
        return;
    }
    
    const tbody = document.querySelector('#truncationResultsTable tbody');
    tbody.innerHTML = '';
    
    calculationResults.truncation.forEach(result => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${result.column} (${result.type})</td>
            <td>${result.totalN}</td>
            <td>${result.truncationLevel}%</td>
            <td>${result.usedN}</td>
            <td>${result.rsTailIndex.toFixed(4)}</td>
            <td>${result.rsStandardError.toFixed(4)}</td>
            <td>[${result.rsCiLower.toFixed(4)}, ${result.rsCiUpper.toFixed(4)}]</td>
            <td>${result.hillTailIndex.toFixed(4)}</td>
            <td>${result.hillStandardError.toFixed(4)}</td>
            <td>[${result.hillCiLower.toFixed(4)}, ${result.hillCiUpper.toFixed(4)}]</td>
        `;
        tbody.appendChild(row);
    });
}

function displayCharts() {
    const chartsContainer = document.getElementById('chartsContainer');
    chartsContainer.innerHTML = '';
    
    Object.keys(calculationResults.progressive).forEach(columnName => {
        const progressiveData = calculationResults.progressive[columnName];
        
        // Hill method chart
        if (progressiveData.hill.length > 0) {
            createProgressiveChart(chartsContainer, columnName, 'Hill', progressiveData.hill);
        }
        
        // Rank-Size method chart
        if (progressiveData.rankSize.length > 0) {
            createProgressiveChart(chartsContainer, columnName, 'Rank-Size', progressiveData.rankSize);
        }
    });
}

function createProgressiveChart(container, columnName, method, data) {
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    
    const title = document.createElement('div');
    title.className = 'chart-title';
    title.textContent = `${columnName} - ${method} Method Progressive Analysis`;
    chartContainer.appendChild(title);
    
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'chart-wrapper';
    
    const canvas = document.createElement('canvas');
    canvasWrapper.appendChild(canvas);
    chartContainer.appendChild(canvasWrapper);
    container.appendChild(chartContainer);
    
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.sampleSize),
            datasets: [
                {
                    label: 'Tail Index',
                    data: data.map(d => d.tailIndex),
                    borderColor: 'rgb(37, 99, 235)',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.1
                },
                {
                    label: '95% CI Upper',
                    data: data.map(d => d.ciUpper),
                    borderColor: 'rgba(37, 99, 235, 0.3)',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    pointRadius: 0
                },
                {
                    label: '95% CI Lower',
                    data: data.map(d => d.ciLower),
                    borderColor: 'rgba(37, 99, 235, 0.3)',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Sample Size'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Tail Index'
                    }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false,
                },
                legend: {
                    display: true
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Download functions
function downloadResults() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Basic results
    csvContent += "Basic Results\n";
    csvContent += "Column,Method,Tail Index,Standard Error,95% CI Lower,95% CI Upper\n";
    calculationResults.basic.forEach(result => {
        csvContent += `${result.column},${result.method},${result.tailIndex},${result.standardError},${result.ciLower},${result.ciUpper}\n`;
    });
    
    // Truncation results
    if (calculationResults.truncation.length > 0) {
        csvContent += "\nTruncation Analysis Results\n";
        csvContent += "Column,N Total,Truncation %,n Used,RS Tail Index,RS Std Error,RS 95% CI,Hill Tail Index,Hill Std Error,Hill 95% CI\n";
        calculationResults.truncation.forEach(result => {
            csvContent += `${result.column} (${result.type}),${result.totalN},${result.truncationLevel},${result.usedN},${result.rsTailIndex},${result.rsStandardError},"[${result.rsCiLower}-${result.rsCiUpper}]",${result.hillTailIndex},${result.hillStandardError},"[${result.hillCiLower}-${result.hillCiUpper}]"\n`;
        });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tail_index_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadCharts() {
    const charts = document.querySelectorAll('#chartsContainer canvas');
    charts.forEach((canvas, index) => {
        const link = document.createElement('a');
        link.download = `chart_${index + 1}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

function resetCalculator() {
    currentData = null;
    selectedColumns = [];
    calculationResults = {};
    
    document.getElementById('step3').classList.add('hidden');
    document.getElementById('step1').classList.remove('hidden');
    
    // Reset file input
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    
    // Clear results
    document.querySelector('#basicResultsTable tbody').innerHTML = '';
    document.querySelector('#truncationResultsTable tbody').innerHTML = '';
    document.getElementById('chartsContainer').innerHTML = '';
}