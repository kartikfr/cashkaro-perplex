@echo off
REM Test runner script for Product Image Extractor (Windows)

echo Product Image Extractor - Test Runner
echo =====================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check Python version
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set python_version=%%i
echo Python version: %python_version%

REM Check if required packages are installed
echo Checking dependencies...
python -c "import requests, bs4" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Run tests
echo Running tests...
python test_extractor.py

echo Tests completed!
pause

