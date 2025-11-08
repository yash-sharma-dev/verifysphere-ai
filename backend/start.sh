#!/bin/bash

# Startup script for VerifySphere Backend
# This script ensures port 8080 is free before starting the server

# Don't exit on error - we want to handle cleanup gracefully
set +e

echo "Starting VerifySphere Backend..."

# Kill any process using port 8080
echo "Checking port 8080..."
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "Port 8080 is in use. Killing existing processes..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Kill any existing Spring Boot or Java processes that might be holding resources
echo "Checking for existing Spring Boot/Java processes..."
ps aux | grep -E "java.*spring-boot|mvn.*spring-boot|java.*ApiApplication" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 1

# Double-check port is free
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "Port 8080 still in use after cleanup. Force killing..."
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Verify port is free
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "ERROR: Port 8080 is still in use. Please manually free the port."
    exit 1
fi

echo "Port 8080 is free. Starting backend..."

# Set environment variables if not already set
export GEMINI_API_KEY=${GEMINI_API_KEY:-AIzaSyAN5ak2u0iFdE9ODHJtaF0xvQ6JP3Rubqg}
export GEMINI_MODEL_NAME=${GEMINI_MODEL_NAME:-gemini-2.5-flash}

# Change to backend directory
cd "$(dirname "$0")"

# Start the Spring Boot application (runs in foreground)
echo "Starting Spring Boot application..."
echo "Press Ctrl+C to stop the server"
mvn spring-boot:run


