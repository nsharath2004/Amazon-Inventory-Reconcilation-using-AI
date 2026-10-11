@echo off
title Push to GitHub - Amazon Inventory Reconciliation AI
setlocal

echo ======================================================================
echo       Push to GitHub - Amazon Inventory Reconciliation AI
echo ======================================================================
echo.

set "REPO_URL=%~1"

if "%REPO_URL%"=="" (
    echo Please enter your GitHub Repository URL.
    echo (Example: https://github.com/your-username/amazon-inventory-ai.git)
    echo.
    set /p REPO_URL="GitHub URL: "
)

if "%REPO_URL%"=="" (
    echo Error: No repository URL provided.
    pause
    exit /b 1
)

echo.
echo Setting remote origin to: %REPO_URL%
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git branch -M main

echo.
echo Pushing branch 'main' to GitHub...
git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo [OK] Successfully pushed to GitHub!
) else (
    echo.
    echo [!] Push failed. Make sure:
    echo     1. The repository exists on your GitHub account.
    echo     2. You have permission to push to it.
    echo     3. You enter your GitHub credentials/Personal Access Token when prompted.
)

echo.
pause
