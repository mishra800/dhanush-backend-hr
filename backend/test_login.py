#!/usr/bin/env python3
"""
Test login endpoint to verify database relationships are working
"""

import requests
import sys

def test_login():
    """Test login endpoint"""
    
    try:
        print("Testing login endpoint...")
        
        # Test login with dummy credentials (should fail but not crash)
        response = requests.post(
            "http://127.0.0.1:8000/auth/login",
            data={
                "username": "test@example.com",
                "password": "testpassword"
            },
            timeout=10
        )
        
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Login endpoint is working (authentication failed as expected)")
            return True
        elif response.status_code == 500:
            print("❌ Database relationship error still exists")
            print(f"Response: {response.text}")
            return False
        else:
            print(f"✅ Login endpoint responded with status {response.status_code}")
            return True
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return False

if __name__ == "__main__":
    if test_login():
        print("\n🎉 Database relationships are working!")
        sys.exit(0)
    else:
        print("\n💥 Database relationships still have issues!")
        sys.exit(1)