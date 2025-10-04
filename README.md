# Student Spec Insight

> A comprehensive web application for managing and analyzing student academic
> data, specialties, and performance metrics.

## 🎯 Overview

Student Spec Insight is a modern web application designed to help educational
institutions manage student data, track academic performance, and analyze
specialty preferences. The system provides powerful filtering, data
visualization, and export capabilities to support data-driven decision making.

## ✨ Features

### 📊 Dashboard & Analytics

- **Real-time Statistics**: Overview of student counts, performance metrics, and
  specialty distribution
- **Interactive Charts**: Visual representation of student performance and
  specialty analysis
- **Advanced Filtering**: Filter students by specialty, promotion, performance
  metrics
- **Performance Tracking**: Monitor student rankings and grades across semesters

### 👥 Student Management

- **Student Directory**: Comprehensive list of students with detailed profiles
- **Individual Profiles**: Detailed view of each student's academic journey
- **Search & Filter**: Advanced search capabilities with multiple filter options
- **Bulk Operations**: Efficient management of multiple student records

### 📁 Data Import & Export

- **File Upload**: Support for CSV, XLS, and XLSX file formats
- **Promotion-based Import**: Associate uploaded data with specific promotions
- **Data Validation**: Comprehensive validation of imported student data
- **Export Capabilities**: Export filtered data in various formats

### 🔐 Authentication & Security

- **Secure Authentication**: JWT-based authentication system
- **Protected Routes**: Role-based access control
- **Session Management**: Secure session handling

### 🎨 User Interface

- **Modern Design**: Clean, intuitive interface built with Tailwind CSS
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Theme**: Customizable theme preferences
- **Accessibility**: WCAG compliant design patterns

## 🛠️ Technology Stack

### Frontend

- **React 18** - Modern JavaScript library for building user interfaces
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library
- **Recharts** - Composable charting library
- **React Router** - Client-side routing
- **Sonner** - Toast notifications

### Development Tools

- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing and optimization
- **Bun** - Fast JavaScript runtime and package manager

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or bun package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Lovable-Mounir/student-spec-insight.git
   cd student-spec-insight
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser** Navigate to `http://localhost:5173`

## 📝 API Integration

The frontend expects a backend API with the following endpoints:

### Authentication

- `POST /api/auth/login` - User authentication
- `POST /api/auth/logout` - User logout

### Students

- `GET /api/students` - List students with filtering
- `GET /api/students/:matricule` - Get student details
- `POST /api/upload/student-data` - Upload student data file

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/specialty-analysis` - Get specialty analysis

### Data Export

- `POST /api/export/students` - Export student data

For detailed API specification, see
[backend_upload_specification.md](./backend_upload_specification.md)

## 📊 Data Structure

### Student Data Format

The system expects student data with the following fields:

- **Matricule** - Student ID
- **Academic Subjects**: SYS1, RES1, ANUM, RO, ORG, LANG1, IGL, THP, MCSI, BDD,
  SEC, CPROJ, PROJ, LANG2, ARCH, SYS2, RES2
- **Performance Metrics**: Rang S1, Moy S1, Rang S2, Moy S2, Rang, Moy Rachat
- **Promotion** - Academic year/promotion (provided separately during upload)

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout component
│   └── ProtectedRoute.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── StudentList.tsx
│   ├── StudentDetail.tsx
│   └── Upload.tsx
└── services/           # API service layer
    └── api.ts
```

## 🔧 Configuration

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Build Configuration

The project uses Vite for building and bundling. Configuration can be found in
`vite.config.ts`.

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop**: Full-featured interface with advanced filtering
- **Tablet**: Optimized layout with touch-friendly interactions
- **Mobile**: Streamlined interface focusing on essential features

## 🚀 Deployment

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run preview
```

### Environment Setup

1. Set up your backend API
2. Configure environment variables
3. Build and deploy the frontend
4. Set up SSL certificates for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file
for details.

## 👨‍💻 Author

**Mounir** - [Lovable-Mounir](https://github.com/Lovable-Mounir)

## 🆘 Support

If you have any questions or run into issues, please:

1. Check the existing issues
2. Create a new issue with detailed information
3. Contact the development team

---

<div align="center">
  <p>Built with ❤️ for educational institutions</p>
</div>