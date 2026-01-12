# FastAPI entrypoint for Vercel deployment
import sys
import os

# Add the parent directory to Python path so we can import from main.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the FastAPI app from main.py
from main import app

# This is required for Vercel to find the FastAPI app
# The app variable must be named 'app' and be directly accessible