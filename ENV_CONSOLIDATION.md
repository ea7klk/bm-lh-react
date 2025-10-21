# Environment Variable Consolidation

## Changes Made

The project has been updated to use a single, centralized environment configuration when running in Docker.

### Before (Redundant Configuration)
```
/.env                   # Used by Docker Compose
/.env.example          # Example file
/backend/.env          # Backend-specific (redundant in Docker)
/backend/.env.example  # Backend example (redundant in Docker)
```

### After (Consolidated Configuration)
```
/.env                   # Single source of truth for Docker
/.env.example          # Comprehensive example file
```

## Why This Change?

1. **Docker Environment**: When running in Docker containers, environment variables are passed from Docker Compose to the containers
2. **Single Source of Truth**: All configuration is now in one place
3. **Simplified Deployment**: No need to manage multiple .env files
4. **Better Developer Experience**: Copy one file and configure once

## How Environment Variables Work Now

### In Docker (Production/Development with Docker)
1. Docker Compose reads `.env` file
2. Variables are passed to containers via `env_file` directive
3. Additional overrides can be set in docker-compose.yml
4. Start.sh script passes all variables to the Node.js process

### In Local Development (without Docker)
1. Backend still uses dotenv.config() in server.ts
2. If you run the backend locally, you can create a `backend/.env` file
3. Or set environment variables directly in your shell/IDE

## Updated Files

### Configuration Files
- ✅ `/.env.example` - Now contains all variables with documentation
- ✅ `/start.sh` - Updated to pass all environment variables to backend
- ✅ `/.dockerignore` - Excludes backend .env files from Docker build

### Documentation
- ✅ `EMAIL_SETUP.md` - Updated to reference root .env file
- ✅ `EMAIL_CONFIG.md` - Updated to reflect consolidated approach
- ✅ `README.md` - Updated setup instructions

## Migration for Existing Deployments

If you have an existing deployment with backend/.env:

1. **Copy variables from backend/.env to root .env**:
   ```bash
   # Copy any custom values from backend/.env to .env
   cat backend/.env >> .env
   ```

2. **Remove duplicate variables** in root .env (keep the values you want)

3. **Remove backend/.env files**:
   ```bash
   rm backend/.env backend/.env.example
   ```

4. **Restart containers**:
   ```bash
   docker compose down
   docker compose up --build -d
   ```

## Environment Variable Reference

All variables are now documented in `.env.example`. Key categories:

- **Database**: `DATABASE_URL`
- **Authentication**: `JWT_SECRET`, `JWT_EXPIRES_IN`
- **Email**: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, etc.
- **Application**: `NODE_ENV`, `PORT`, `USE_MOCK_DATA`
- **Features**: `ENABLE_BRANDMEISTER_SERVICE`, `ENABLE_SUMMARY_SCHEDULER`
- **Frontend**: `FRONTEND_URL`, `APP_NAME`, `APP_URL`

## Benefits

1. **Simplified Configuration**: One file to manage
2. **Better Documentation**: All variables documented in one place
3. **Easier Deployment**: Copy .env.example to .env and configure
4. **Reduced Confusion**: No duplicate or conflicting configurations
5. **Docker Best Practices**: Environment managed at container orchestration level

## For Contributors

When developing:
1. Copy `.env.example` to `.env`
2. Configure your values in `.env`
3. Never commit `.env` (it's in .gitignore)
4. Update `.env.example` when adding new environment variables