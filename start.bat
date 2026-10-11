@echo off
title Amazon Inventory Reconciliation AI - Launcher
echo ======================================================================
echo    Starting Amazon Inventory Reconciliation AI (PES ML Mini-Project)
echo ======================================================================
echo.

echo [1/3] Starting Flask Backend Server (Port 5000)...
start "Flask Backend Server" cmd /k "cd /d "%~dp0amazon-inventory-ai\backend" && python app.py"

echo [2/3] Starting Vite React Frontend (Port 5173)...
start "React Frontend Server" cmd /k "cd /d "%~dp0amazon-inventory-ai\frontend" && npm run dev"

echo.
echo [3/3] Waiting 3 seconds for servers to initialize...
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo ======================================================================
echo Backend:  http://127.0.0.1:5000/api/dashboard
echo Frontend: http://localhost:5173
echo.
echo Both servers are now running in separate windows.
echo To stop them, simply close those terminal windows.
echo ======================================================================
pause
