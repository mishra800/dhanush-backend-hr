# HR Management System - Backend API

A comprehensive FastAPI-based backend for HR Management System with features including employee management, attendance tracking, payroll processing, recruitment, and more.

## 🚀 Features

- **Authentication & Authorization** - JWT-based secure authentication
- **Employee Management** - Complete employee lifecycle management
- **Attendance System** - Real-time attendance tracking with face recognition
- **Payroll Management** - Automated payroll processing and calculations
- **Recruitment System** - End-to-end recruitment workflow
- **Leave Management** - Leave requests and approval system
- **Asset Management** - IT asset tracking and management
- **Onboarding System** - Streamlined employee onboarding
- **Performance Management** - Employee performance tracking
- **Analytics & Reporting** - Comprehensive HR analytics

## 🛠️ Technology Stack

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **Authentication**: JWT tokens
- **File Processing**: Resume parsing, document handling
- **AI Integration**: OpenAI/Gemini for intelligent features
- **Face Recognition**: For attendance system
- **Email**: SMTP integration for notifications

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL database
- pip (Python package manager)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/mishra800/hr-backened-dhanush.git
cd hr-backened-dhanush
```

### 2. Install dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Set up environment variables
```bash
cp backend/.env.example backend/.env
# Edit .env with your database credentials and API keys
```

### 4. Run the application
```bash
cd backend
python main.py
```

The API will be available at `http://localhost:8000`

## 📚 API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🌐 Deployment

This backend is ready for deployment on:
- **Vercel** (Recommended)
- **Railway**
- **Heroku**
- **AWS Lambda**

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in the backend directory
3. Set environment variables in Vercel dashboard

## 🔧 Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://user:password@host:port/database
SECRET_KEY=your-jwt-secret-key
ENVIRONMENT=production
DEBUG=False
```

Optional (for enhanced features):
```env
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email
SMTP_PASSWORD=your-password
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── routers/          # API route handlers
│   ├── models.py         # Database models
│   ├── schemas.py        # Pydantic schemas
│   ├── database.py       # Database configuration
│   └── services/         # Business logic services
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
└── vercel.json         # Vercel deployment config
```

## 🔐 Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Input validation with Pydantic
- SQL injection prevention with SQLAlchemy ORM

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the API documentation at `/docs`
- Review the deployment guide in `DEPLOYMENT_GUIDE.md`