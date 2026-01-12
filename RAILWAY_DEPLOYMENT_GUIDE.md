# Railway Deployment Guide - Full Features Enabled

This guide will help you deploy your HR Management System to Railway with ALL features enabled, including:
- ✅ Face Recognition for Attendance
- ✅ Advanced AI Resume Parsing
- ✅ ML-powered Analytics
- ✅ All system dependencies

## Quick Start

1. **Go to Railway**: [railway.app](https://railway.app)
2. **Create New Project** → **Deploy from GitHub repo**
3. **Select your repository**: `mishra800/dhanush-backend-hr`
4. **Set Root Directory**: `backend`
5. **Add Environment Variables** (see below)
6. **Deploy!**

## Environment Variables

Add these in Railway dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=your-secret-key-here-make-it-long-and-random
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend-domain.com
```

## Database Setup

1. In Railway dashboard, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Copy the `DATABASE_URL` from the PostgreSQL service
4. Add it to your main service environment variables

## Features Now Enabled ✅

### 🎯 Face Recognition
- Real-time attendance verification
- Profile photo matching
- Confidence scoring
- Anti-spoofing detection

### 🧠 AI Resume Parsing
- PDF/DOCX text extraction
- Skills identification
- Experience calculation
- Education matching
- Job fit scoring

### 📊 ML Analytics
- Performance predictions
- Engagement insights
- Talent intelligence
- Advanced reporting

### 🔧 System Dependencies
- OpenCV for image processing
- dlib for face detection
- scikit-learn for ML
- spaCy for NLP
- All Python packages

## Why Railway?

✅ **Supports Docker** - All system dependencies work  
✅ **Auto-scaling** - Handles traffic spikes  
✅ **Built-in monitoring** - Track performance  
✅ **Easy database** - PostgreSQL with one click  
✅ **Affordable** - $5-20/month  
✅ **Fast deployment** - Deploy in minutes  

## Cost

- **Hobby**: $5/month (development)
- **Pro**: $20/month (production)
- **Usage-based** pricing for resources

## Alternative Platforms

If you prefer other platforms:

1. **Render** - Similar to Railway
2. **DigitalOcean App Platform** - Good Docker support  
3. **Heroku** - Classic but expensive
4. **AWS/GCP** - Enterprise but complex

## Troubleshooting

**Build fails?**
- Check Railway build logs
- Verify Dockerfile syntax
- Ensure all files are committed

**App crashes?**
- Check Railway application logs
- Verify environment variables
- Test database connection

**Slow performance?**
- Upgrade to Pro plan
- Monitor resource usage
- Optimize database queries

## Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)

Your app is now ready with ALL features enabled! 🚀