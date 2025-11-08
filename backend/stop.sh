#!/bin/bash

# Stop script for VerifySphere Backend
# Gracefully stops the backend server

echo "Stopping VerifySphere Backend..."

# Find and kill processes using port 8080
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "Found process on port 8080, stopping..."
    lsof -ti:8080 | xargs kill -15 2>/dev/null || true
    sleep 2
    
    # Force kill if still running
    if lsof -ti:8080 > /dev/null 2>&1; then
        echo "Force killing remaining processes..."
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
fi

# Kill any Spring Boot processes
ps aux | grep -E "java.*ApiApplication|mvn.*spring-boot:run" | grep -v grep | awk '{print $2}' | xargs kill -15 2>/dev/null || true
sleep 1

# Force kill if still running
ps aux | grep -E "java.*ApiApplication|mvn.*spring-boot:run" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true

echo "Backend stopped."

