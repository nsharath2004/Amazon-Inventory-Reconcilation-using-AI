# PowerShell Launcher for Amazon Inventory Reconciliation AI
$root = $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Starting Amazon Inventory Reconciliation AI (PES ML Mini-Project)  " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting Flask Backend Server (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\amazon-inventory-ai\backend'; python app.py"

Write-Host "[2/2] Starting React Frontend Server (Port 5173)..." -ForegroundColor Green
Start-Process cmd -ArgumentList "/k", "cd /d `"$root\amazon-inventory-ai\frontend`" && npm run dev"

Start-Sleep -Seconds 3

Write-Host "Opening web application at http://localhost:5173..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Backend running at:  http://127.0.0.1:5000" -ForegroundColor White
Write-Host "Frontend running at: http://localhost:5173" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
