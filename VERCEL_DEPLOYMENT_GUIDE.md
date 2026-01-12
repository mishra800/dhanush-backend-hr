# Vercel Backend Deployment Guide

## Prerequisites
1. **Database Setup**: Create a PostgreSQL database
   - **Neon** (Recommended): https://neon.tech - Free tier available
   - **Supabase**: https://supabase.com - Free tier available  
   - **Railway**: https://railway.app - Free tier available

2. **Vercel Account**: Sign up at https://vercel.com

## Deployment Methods

### Method 1: Web Interface (Recommended)
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository
4. Set **Root Directory** to `backend`
5. Vercel auto-detects Python project
6. Click "Deploy"

### Method 2: CLI Deployment
```bash
# Run the deployment script
./deploy-backend.cmd
```

## Required Environment Variables

Set these in your Vercel project dashboard (Settings → Environment Variables):

### Essential Variables
```
DATABASE_URL=postgresql://username:password@host:port/database_name
SECRET_KEY=your-very-secure-secret-key-here
ENVIRONMENT=production
DEBUG=False
```

### CORS Configuration
```
FRONTEND_URL=https://your-frontend-domain.netlify.app
CORS_ORIGINS=https://your-frontend-domain.netlify.app
APP_BASE_URL=https://your-frontend-domain.netlify.app
```

### Email Configuration (Optional)
```
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@company.com
```

### AI Features (Optional)
```
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

### SMS/WhatsApp (Optional)
```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Post-Deployment Steps

1. **Test the API**: Visit `https://your-backend.vercel.app` - should show welcome message
2. **Update Frontend**: Update your frontend's API URL to point to the new backend
3. **Database Migration**: Your app will auto-create tables on first run
4. **Test Key Features**: Login, registration, and main functionality

## Troubleshooting

### Common Issues:
- **Database Connection**: Ensure DATABASE_URL is correct
- **CORS Errors**: Check FRONTEND_URL and CORS_ORIGINS match your frontend domain
- **Build Failures**: Check requirements.txt has all dependencies
- **Function Timeout**: Increase maxDuration in vercel.json if needed

### Logs:
- View deployment logs in Vercel dashboard
- Check function logs for runtime errors

## Your Current Configuration

✅ **vercel.json** - Properly configured
✅ **requirements.txt** - All dependencies listed  
✅ **main.py** - FastAPI app ready
✅ **.vercelignore** - Excludes unnecessary files
✅ **CORS Setup** - Configured for production

Your backend is ready to deploy!