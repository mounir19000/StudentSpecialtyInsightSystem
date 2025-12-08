# Student Spec Insight - Docker Setup

This project has been fully dockerized for easy deployment and development. Both
the frontend (React/Vite) and backend (FastAPI) are containerized and can be run
with a single command.

## Prerequisites

- Docker
- Docker Compose

## 🚀 How to Build and Run

### Option 1: Quick Start (Recommended)

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd StageWeb

# Build and start all services in one command
docker-compose up -d --build

# Wait for containers to be healthy, then access the application
```

### Option 2: Step by Step

```bash
# 1. Build all containers
docker-compose build

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps
```

### Option 3: Development Mode (with logs)

```bash
# Build and run with live logs
docker-compose up --build

# Or run in background and view logs separately
docker-compose up -d --build
docker-compose logs -f
```

## 📱 Access the Application

Once running, access these URLs:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health
- **Frontend API Proxy**: http://localhost/api/health

## ✅ Verify Everything is Working

```bash
# Check container status
docker-compose ps

# Test backend health
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost

# Test frontend API proxy
curl http://localhost/api/health
```

Expected output: All containers should show "healthy" status and API calls
should return JSON responses.

## Services

### Backend (FastAPI)

- **Port:** 8000
- **Technology:** Python 3.12, FastAPI, SQLAlchemy
- **Database:** SQLite (persisted via Docker volume)
- **Features:**
  - Student data analysis
  - ML-based specialty prediction
  - File upload processing
  - Authentication system

### Frontend (React/Vite)

- **Port:** 80
- **Technology:** React, TypeScript, Vite, Tailwind CSS
- **Features:**
  - Student management interface
  - Data visualization
  - Export functionality
  - Modern responsive UI

## 🛠️ Docker Commands Reference

### Basic Operations

```bash
# Build and start (recommended for first time)
docker-compose up -d --build

# Start existing containers
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
docker-compose down -v

# View container status
docker-compose ps

# View logs (all services)
docker-compose logs -f

# View logs (specific service)
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Building and Rebuilding

```bash
# Rebuild all containers (when code changes)
docker-compose build

# Rebuild specific container
docker-compose build backend
docker-compose build frontend

# Force rebuild (ignore cache)
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

### Troubleshooting Commands

```bash
# Remove containers and rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Clean up Docker system
docker system prune -a

# Check container health
docker-compose ps
docker inspect <container-name>

# Access container shell (for debugging)
docker-compose exec backend bash
docker-compose exec frontend sh
```

## Architecture

The application uses a multi-container setup:

1. **Backend Container:**

   - Python 3.12 slim base image
   - Installs scientific libraries (pandas, scikit-learn, matplotlib)
   - Runs FastAPI with Uvicorn server
   - Health checks ensure reliability

2. **Frontend Container:**

   - Multi-stage build (Node.js build + Nginx serve)
   - Optimized production build
   - Nginx reverse proxy for API calls
   - Security headers and gzip compression

3. **Networking:**
   - Custom bridge network for inter-service communication
   - Frontend proxies API calls to backend automatically
   - Database persistence via mounted volumes

## Data Persistence

- SQLite database is persisted in `./backend/student_spec_insight.db`
- CSV data files are mounted read-only from `./data` directory
- Both are automatically available to the backend container

## Environment Variables

The setup uses minimal configuration:

- `PYTHONPATH=/app` - Set for proper Python imports
- `DATABASE_URL=sqlite:///./student_spec_insight.db` - Database location

## 🔧 Troubleshooting

### Check Service Health

```bash
# Backend health check
curl http://localhost:8000/api/health

# Frontend accessibility
curl http://localhost

# Frontend API proxy test
curl http://localhost/api/health

# Container status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend
```

### Common Issues and Solutions

#### 1. **Port Conflicts**

```bash
# Error: Port already in use
# Solution: Change ports in docker-compose.yml
# Edit the ports section:
# ports:
#   - "8080:80"    # Change 80 to 8080
#   - "8001:8000"  # Change 8000 to 8001
```

#### 2. **Build Failures**

```bash
# Solution: Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 3. **Database Issues**

```bash
# Solution: Reset database
docker-compose down -v
rm -f backend/student_spec_insight.db  # Remove database file
docker-compose up -d
```

#### 4. **CORS Errors**

```bash
# Check if backend includes frontend URL in CORS settings
# Should include: http://localhost, http://127.0.0.1
docker-compose logs backend | grep -i cors
```

#### 5. **Container Won't Start**

```bash
# Check detailed error logs
docker-compose logs <service-name>

# Try starting individual services
docker-compose up backend
docker-compose up frontend
```

### Development vs Production

#### Development Mode

```bash
# Run with live logs for debugging
docker-compose up --build

# Make code changes and rebuild
docker-compose build <service>
docker-compose up -d
```

#### Production Mode

```bash
# Run in background (detached)
docker-compose up -d --build

# Monitor health
watch 'docker-compose ps'
```

## Development Notes

- The containers are optimized for production use
- Frontend uses nginx for serving static files and reverse proxying
- Backend runs with proper security (non-root user)
- Health checks ensure containers are ready before accepting traffic
- Docker images use multi-stage builds for smaller sizes

## Security Features

- Non-root users in both containers
- Security headers in nginx configuration
- Minimal attack surface with slim base images
- Network isolation between containers
