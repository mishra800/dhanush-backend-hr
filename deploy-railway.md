# Railway Deployment Instructions

## Quick Deploy Steps

### 1. Go to Railway
- Visit: https://railway.app/new
- Click "Deploy from GitHub repo"

### 2. Select Repository
- Choose: `mishra800/dhanush-backend-hr`
- Branch: `main`

### 3. Configure Service
- **Root Directory**: Leave empty (use root)
- **Build Command**: `docker build -f Dockerfile.railway -t hr-backend .`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4. Add Database
- Click "+ New" → "Database" → "PostgreSQL"
- Copy the DATABASE_URL

### 5. Environment Variables
Add these in Railway dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database
SECRET_KEY=hr-management-super-secret-key-2024-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
ENVIRONMENT=production
FRONTEND_URL=https://your-frontend-domain.netlify.app
PORT=8000
```

### 6. Deploy
- Click "Deploy"
- Wait for build to complete
- Your API will be available at: `https://your-service-name.railway.app`

## Alternative: Use Render

If Railway continues to have issues, try Render:

1. Go to: https://render.com
2. Connect GitHub
3. Create "Web Service"
4. Build Command: `cd backend && pip install -r requirements.txt`
5. Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add PostgreSQL database
7. Set environment variables
8. Deploy

## Test Deployment

Once deployed, test these endpoints:
- `GET /health` - Health check
- `GET /` - Welcome message
- `POST /auth/login` - Login endpoint