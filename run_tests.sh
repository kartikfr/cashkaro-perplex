#!/bin/bash
# Test runner script for Product Image Extractor

echo "Product Image Extractor - Test Runner"
echo "====================================="

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    exit 1
fi

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo "Python version: $python_version"

# Check if required packages are installed
echo "Checking dependencies..."
python3 -c "import requests, bs4" 2>/dev/null
if [ $? -ne 0 ]; then
    echo "Installing dependencies..."
    pip3 install -r requirements.txt
fi

# Run tests
echo "Running tests..."
python3 test_extractor.py

echo "Tests completed!"

