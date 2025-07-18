# Troubleshooting Guide

## White Screen Issue - FIXED ✅

### What was the problem?
The white screen occurred because:
1. **Static file paths mismatch**: Vite builds generated `/assets/` paths, but Go server served them at `/static/`
2. **Old API endpoints**: Some frontend code still referenced `localhost:3333` instead of `/api/`

### What was fixed?
1. **Frontend serving**: Updated Go server to serve assets at `/assets/` path (matching Vite expectations)
2. **API endpoints**: Fixed all frontend API calls to use relative `/api/` paths
3. **File structure**: Ensured proper file copying in Docker container

### How to verify the fix?
1. Build and run: `./start.sh`
2. Open: `http://localhost:1337`
3. Should see: VS Code-like interface with file explorer and code editor
4. Check browser console: Should be no 404 errors for assets

### If you still see a white screen:
1. Check browser console (F12) for errors
2. Verify Docker container logs: `docker logs ad-agent`
3. Test API endpoints: `curl http://localhost:1337/api/services`
4. Check if frontend built correctly: `ls frontend/dist/`

### Container debugging:
```bash
# Check if container is running
docker ps

# View container logs
docker logs ad-agent

# Access container shell
docker exec -it ad-agent sh

# Check files inside container
docker exec -it ad-agent ls -la /app/frontend/dist/
```

## Common Issues

### 404 Errors for Assets
- **Cause**: Mismatch between asset paths in HTML and server routes
- **Fix**: Ensure Go server serves `/assets/` route matching Vite output

### API Call Failures
- **Cause**: Hardcoded localhost URLs in frontend
- **Fix**: Use relative paths like `/api/services` instead of `http://localhost:3333/services`

### Frontend Not Loading
- **Cause**: index.html not served correctly
- **Fix**: Ensure `router.StaticFile("/", "./frontend/dist/index.html")` path is correct

All of these issues have been fixed in the current version! 🎯
