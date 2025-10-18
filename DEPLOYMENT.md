# BM Last Heard - Deployment Guide

## Overview
This document provides detailed instructions for deploying the BM Last Heard application.

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │─────▶│  Express API    │─────▶│   PostgreSQL    │
│   (Port 3000)   │      │   (Port 3001)   │      │   (Port 5432)   │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Prerequisites

### For Docker Deployment
- Docker Engine 20.10+
- Docker Compose 2.0+

### For Manual Deployment
- Node.js 18+ with npm
- PostgreSQL 15+

## Docker Deployment (Production)

### 1. Clone the Repository
```bash
git clone https://github.com/ea7klk/bm-lh-react.git
cd bm-lh-react
```

### 2. Start All Services
```bash
docker-compose up -d
```

This will:
- Create a PostgreSQL database with the schema
- Build and start the backend API
- Build and start the frontend with Nginx
- Set up networking between containers

### 3. Verify Services
```bash
# Check all containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Test backend API
curl http://localhost:3001/health

# Test frontend
curl http://localhost:3000
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PostgreSQL: localhost:5432 (user: bmuser, db: bm_lastheard)

### 5. Stop Services
```bash
docker-compose down

# To remove volumes as well
docker-compose down -v
```

## Manual Deployment (Development)

### 1. Database Setup

#### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database and user
CREATE DATABASE bm_lastheard;
CREATE USER bmuser WITH PASSWORD 'bmpassword';
GRANT ALL PRIVILEGES ON DATABASE bm_lastheard TO bmuser;
\q
```

#### Initialize Schema
```bash
psql -U bmuser -d bm_lastheard -f backend/database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

Example .env:
```
PORT=3001
DATABASE_URL=postgresql://bmuser:bmpassword@localhost:5432/bm_lastheard
NODE_ENV=development
```

#### Start Backend
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env if needed
nano .env
```

Example .env:
```
REACT_APP_API_URL=http://localhost:3001/api
```

#### Start Frontend
```bash
# Development mode
npm start

# Build for production
npm run build

# Serve production build
npx serve -s build
```

## Environment Variables

### Backend (.env)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Backend API port | 3001 | No |
| DATABASE_URL | PostgreSQL connection string | - | Yes |
| NODE_ENV | Environment (development/production) | development | No |
| USE_MOCK_DATA | Use mock data instead of database | false | No |

### Frontend (.env)
| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| REACT_APP_API_URL | Backend API URL | http://localhost:3001/api | Yes |

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### API Endpoints Testing
```bash
# Health check
curl http://localhost:3001/health

# Get last heard data
curl http://localhost:3001/api/lastheard

# Get specific entry
curl http://localhost:3001/api/lastheard/1

# Create new entry (POST)
curl -X POST http://localhost:3001/api/lastheard \
  -H "Content-Type: application/json" \
  -d '{
    "callsign": "EA7KLK",
    "name": "Test User",
    "dmr_id": 2147001,
    "target_id": 214,
    "target_name": "Spain",
    "source": "BM Master",
    "duration": 120,
    "slot": 2,
    "reflector": 4400
  }'
```

## Production Considerations

### Security
- Change default PostgreSQL password
- Use HTTPS with SSL certificates
- Set up firewall rules
- Enable CORS only for trusted domains
- Use environment-specific secrets

### Performance
- Enable connection pooling in PostgreSQL
- Use CDN for frontend static assets
- Implement caching strategies
- Set up load balancing for high traffic

### Monitoring
- Set up logging aggregation
- Monitor database performance
- Track API response times
- Set up alerts for failures

### Backup
```bash
# Backup database
docker exec bm-lh-postgres pg_dump -U bmuser bm_lastheard > backup.sql

# Restore database
docker exec -i bm-lh-postgres psql -U bmuser bm_lastheard < backup.sql
```

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `docker-compose ps` or `pg_isready`
- Verify DATABASE_URL is correct
- Check logs: `docker-compose logs backend`

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:3001/health`
- Check REACT_APP_API_URL in frontend/.env
- Check browser console for CORS errors

### Database connection errors
- Verify PostgreSQL credentials
- Check if database exists: `psql -U bmuser -d bm_lastheard -c "\dt"`
- Ensure PostgreSQL accepts connections from your host

### Mock Data Mode
If you need to run without a database (for testing):
```bash
# Backend .env
USE_MOCK_DATA=true
```

## Updating the Application

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose up -d --build

# Or for manual deployment
cd backend && npm install && npm run build
cd ../frontend && npm install && npm run build
```

## Contact & Support

For issues, questions, or contributions:
- GitHub Issues: https://github.com/ea7klk/bm-lh-react/issues
- Repository: https://github.com/ea7klk/bm-lh-react
