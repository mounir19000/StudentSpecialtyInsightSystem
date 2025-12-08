# 🎓 StageWeb - Student Specialty Insight System

A comprehensive full-stack application for analyzing student data and providing
intelligent specialty recommendations using machine learning.

## 🚀 **Repository Merge Notice**

This repository combines the previously separate frontend and backend
repositories:

- **Frontend**: `student-spec-insight-front`
- **Backend**: `student-spec-insight-backend`

All commit history from both repositories has been preserved and merged into
this unified codebase.

## 📋 **Project Overview**

Student Specialty Insight System is a modern web application that helps
educational institutions analyze student performance data and predict optimal
specialty tracks using machine learning algorithms.

### **Key Features**

- 📊 **Student Data Analysis** - Comprehensive analytics and insights
- 🤖 **ML-Based Predictions** - Intelligent specialty recommendations
- 📁 **File Processing** - Excel/CSV upload and processing
- 👥 **User Management** - Authentication and role-based access
- 📈 **Interactive Dashboards** - Real-time data visualization
- 📄 **Export Capabilities** - PDF reports and data export
- 🔍 **Advanced Search & Filtering** - Find students by multiple criteria

## 🏗️ **Architecture**

```
StageWeb/
├── 🎨 frontend/          # React + TypeScript + Vite
├── ⚙️  backend/           # FastAPI + Python
├── 📊 data/              # Sample CSV datasets
├── 🐳 docker-compose.yml # Container orchestration
└── 📖 DOCKER_README.md   # Docker setup guide
```

### **Technology Stack**

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

## 🚀 **Quick Start**

### **Prerequisites**

- Docker & Docker Compose
- Git

### **1. Clone the Repository**

```bash
git clone https://github.com/mounir19000/StageWeb.git
cd StageWeb
```

### **2. Build and Run with Docker**

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

### **3. Access the Application**

- **🌐 Frontend**: http://localhost
- **🔗 Backend API**: http://localhost:8000
- **📚 API Docs**: http://localhost:8000/docs
- **❤️ Health Check**: http://localhost:8000/api/health

### **4. Verify Setup**

```bash
# Test backend
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost

# View logs
docker-compose logs -f
```

## 📖 **Detailed Setup**

For comprehensive setup instructions, troubleshooting, and development
guidelines, see: 👉 **[DOCKER_README.md](./DOCKER_README.md)**

## 🎯 **Application Features**

### **For Administrators**

- Upload student data (Excel/CSV)
- Manage student records and promotions
- Generate comprehensive analytics reports
- Export data and insights to PDF
- Configure specialty prediction models

### **For Analysts**

- Interactive dashboards with real-time data
- Advanced filtering and search capabilities
- Student performance trend analysis
- Specialty recommendation insights
- Visual charts and graphs

### **For Students/Staff**

- View individual student profiles
- Track academic progress
- Access specialty recommendations
- Export personal reports

## 🔧 **Development**

### **Project Structure**

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Application pages
│   ├── services/      # API communication
│   ├── contexts/      # React contexts
│   └── lib/          # Utilities and helpers
├── public/           # Static assets
└── Dockerfile        # Frontend container config

backend/
├── app/
│   ├── routers/      # API route handlers
│   ├── models.py     # Database models
│   ├── schemas.py    # Pydantic schemas
│   └── utils/        # Helper functions
├── requirements.txt  # Python dependencies
└── Dockerfile       # Backend container config
```

### **API Endpoints**

- `GET /api/health` - System health check
- `POST /api/auth/login` - User authentication
- `GET /api/students` - List students with filtering
- `POST /api/upload` - Upload student data files
- `GET /api/dashboard` - Analytics dashboard data
- `GET /api/analysis` - ML predictions and insights
- `POST /api/export` - Generate PDF reports

### **Database Schema**

- **Users** - Authentication and roles
- **Students** - Student records and grades
- **Promos** - Class/promotion management
- **Specialties** - Available specialty tracks
- **Predictions** - ML recommendation results

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 **API Documentation**

Interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🐛 **Troubleshooting**

Common issues and solutions are documented in
[DOCKER_README.md](./DOCKER_README.md#troubleshooting).

For additional help:

1. Check container logs: `docker-compose logs <service>`
2. Verify health endpoints
3. Ensure ports 80 and 8000 are available
4. Clear Docker cache if needed: `docker system prune -a`

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 👥 **Team**

- **Frontend Development**: Modern React/TypeScript SPA
- **Backend Development**: FastAPI with ML integration
- **DevOps**: Docker containerization and deployment
- **Data Science**: ML models for specialty prediction

## 🔗 **Original Repositories**

This unified repository was created by merging:

- [student-spec-insight-backend](https://github.com/mounir19000/student-spec-insight-backend)
- [student-spec-insight-front](https://github.com/mounir19000/student-spec-insight-front)

All commit history has been preserved during the merge process.

---

**🎉 Ready to analyze student data? Start with `docker-compose up -d --build`
and visit http://localhost!**
