#!/bin/bash

# YouTube Comment Analyzer - Backend Startup Script

echo "YouTube Comment Analyzer - Starting Backend Server"
echo "=================================================="

# Change to backend directory
cd "$(dirname "$0")/backend"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed or not in PATH"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "Python found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null && ! command -v pip &> /dev/null; then
    echo "Error: pip is not installed"
    echo "Please install pip"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if installation was successful
if [ $? -ne 0 ]; then
    echo "Error: Failed to install dependencies"
    echo "Please check the error messages above"
    exit 1
fi

echo "Starting FastAPI server..."
echo "Server will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
python main.py
