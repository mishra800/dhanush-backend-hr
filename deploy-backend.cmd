@echo off
echo Deploying Backend to Vercel...

echo.
echo IMPORTANT: Make sure you have:
echo 1. Created a PostgreSQL database (Neon, Supabase, or Railway)
echo 2. Set up environment variables in Vercel dashboard
echo 3. Logged into Vercel CLI or use web interface
echo.

cd backend

echo Step 1: Login to Vercel (if not already logged in)
echo If you get certificate errors, use the web interface at vercel.com
vercel login

echo.
echo Step 2: Deploy to production
vercel --prod

echo.
echo Backend deployment complete!
echo.
echo Next steps:
echo 1. Go to Vercel dashboard to set environment variables
echo 2. Update your frontend API URL to point to the new backend
echo 3. Test the deployment
pause