// Encoding: UTF-8 (suporte a caracteres especiais pt-BR)
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('test-report.json', 'utf-8'));

let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>QA Overflow - Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-box { flex: 1; padding: 15px; border-radius: 5px; text-align: center; }
        .passed { background: #d4edda; border: 1px solid #c3e6cb; }
        .failed { background: #f8d7da; border: 1px solid #f5c6cb; }
        .summary-box h2 { margin: 0; font-size: 2em; }
        .test-suite { margin: 20px 0; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; }
        .suite-header { background: #007bff; color: white; padding: 10px 15px; font-weight: bold; }
        .test-case { padding: 10px 15px; border-bottom: 1px solid #eee; }
        .test-case:last-child { border-bottom: none; }
        .status { padding: 3px 10px; border-radius: 3px; font-size: 0.9em; font-weight: bold; float: right; }
        .passed-status { background: #28a745; color: white; }
        .failed-status { background: #dc3545; color: white; }
        .timestamp { color: #666; font-size: 0.9em; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>QA Overflow - Regression Test Report</h1>
        <div class="summary">
            <div class="summary-box passed">
                <h2>${data.numPassedTests}</h2>
                <p>Tests Passed</p>
            </div>
            <div class="summary-box failed">
                <h2>${data.numFailedTests}</h2>
                <p>Tests Failed</p>
            </div>
            <div class="summary-box passed">
                <h2>${data.numTotalTestSuites}</h2>
                <p>Test Suites</p>
            </div>
        </div>`;

data.testResults.forEach(suite => {
    const suiteName = path.basename(suite.name);
    html += `<div class="test-suite"><div class="suite-header">${suiteName}</div>`;
    
    suite.assertionResults.forEach(test => {
        const statusClass = test.status === 'passed' ? 'passed-status' : 'failed-status';
        html += `<div class="test-case">
            <span>${test.title}</span>
            <span class="status ${statusClass}">${test.status.toUpperCase()}</span>
        </div>`;
    });
    
    html += `</div>`;
});

html += `<div class="timestamp">Generated: ${new Date().toLocaleString('pt-BR')}</div>
    </div>
</body>
</html>`;

fs.writeFileSync('test-report-final.html', html, 'utf-8');
console.log('Report generated: test-report-final.html');
