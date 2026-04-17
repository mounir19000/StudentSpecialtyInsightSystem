# StageWeb - Student Specialty Insight System

A comprehensive full-stack application for analyzing student data and providing intelligent specialty recommendations using machine learning.

## Project Overview
Student Specialty Insight System is a modern web application that helps educational institutions analyze student performance data and predict optimal specialty tracks using machine learning algorithms.

## Application Features
The system provides role-based access with capabilities tailored to each type of user:
- **Administrators** can upload student data via Excel or CSV, manage student
records and promotions, configure specialty prediction models, generate
comprehensive analytics reports, and export data and insights to PDF.
- **Analysts** have access to interactive dashboards with real-time data
visualization, advanced filtering and search across multiple criteria, student
performance trend analysis, and specialty recommendation insights powered by
machine learning.
- **Students and Staff** can view individual student profiles, track academic
progress, access specialty recommendations, and export personal reports.

Across all roles, the application provides JWT-based authentication, intelligent ML predictions using scikit-learn, bulk file processing via Excel and CSV, and full PDF export capabilities for both individual and aggregate records.

## Architecture

```
StageWeb/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI + Python
├── data/              # Sample CSV datasets
├── docker-compose.yml # Container orchestration
└── DOCKER_README.md   # Docker setup guide
```

### Technology Stack

#### Frontend

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query (TanStack)
- **Routing**: React Router
- **Charts**: Recharts + Plotly.js
- **Export**: jsPDF + html2canvas

#### Backend

- **Framework**: FastAPI (Python 3.12)
- **Database**: SQLite with SQLAlchemy ORM
- **Authentication**: JWT with passlib
- **ML Libraries**: scikit-learn, pandas, numpy
- **Visualization**: matplotlib, plotly, seaborn
- **File Processing**: openpyxl, python-multipart

#### DevOps

- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production)
- **API Documentation**: OpenAPI/Swagger (auto-generated)

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/mounir19000/StageWeb.git
cd StageWeb
```

### 2. Build and Run with Docker

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

### 3. Access the Application

| Service      | URL                              |
| ------------ | -------------------------------- |
| Frontend     | http://localhost                 |
| Backend API  | http://localhost:8000            |
| API Docs     | http://localhost:8000/docs       |
| Health Check | http://localhost:8000/api/health |

### 4. Verify Setup

```bash
# Test backend
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost

# View logs
docker-compose logs -f
```

## Detailed Setup

For comprehensive setup instructions, troubleshooting, and development guidelines, see: **[DOCKER_README.md](./DOCKER_README.md)**