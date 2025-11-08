# Backend Startup Guide

## Why Port Conflicts Happen

The port conflict issue occurs because:

1. **Background Processes**: When `mvn spring-boot:run` is run in the background, the Java process can become orphaned if not properly managed
2. **No Process Tracking**: Without PID tracking, we can't reliably stop the previous instance
3. **Multiple Restarts**: During development, multiple restart attempts can leave old processes running
4. **Maven Plugin Behavior**: The `spring-boot:run` plugin runs in foreground - background execution can leave processes behind

## Solution

We've implemented two scripts:

### `start.sh` - Start the backend
- Automatically kills any process using port 8080
- Cleans up any orphaned Spring Boot processes
- Starts the server in the foreground (properly managed)
- **Usage**: `./start.sh` or `cd backend && ./start.sh`

### `stop.sh` - Stop the backend
- Gracefully stops processes on port 8080
- Kills any Spring Boot/Java processes
- **Usage**: `./stop.sh` or `cd backend && ./stop.sh`

## Best Practices

1. **Always stop before starting**: Run `./stop.sh` before `./start.sh` if you're restarting
2. **Use the scripts**: Don't run `mvn spring-boot:run` directly - use the scripts
3. **Check for running processes**: If you see port errors, run `./stop.sh` first

## Manual Cleanup (if needed)

If scripts don't work, manually clean up:

```bash
# Find and kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or find all Spring Boot processes
ps aux | grep "ApiApplication" | grep -v grep | awk '{print $2}' | xargs kill -9
```

