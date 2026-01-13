#!/usr/bin/env python3
"""
Simple backend health test
"""

import requests
import sys

def test_backend_health():
    """Test if backend is running and responding"""
    
    # Test different ports
    ports = [8000, 8001]
    
    for port in ports:
        try:
            print(f"Testing backend on port {port}...")
            
            # Test root endpoint
            response = requests.get(f"http://127.0.0.1:{port}/", timeout=5)
            if response.status_code == 200:
                print(f"✅ Backend is running on port {port}!")
                print(f"   Response: {response.json()}")
                return True
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Cannot connect to port {port}")
            continue
        except requests.exceptions.Timeout:
            print(f"❌ Timeout on port {port}")
            continue
        except Exception as e:
            print(f"❌ Error on port {port}: {e}")
            continue
    
    print("❌ Backend is not accessible on any port!")
    return False

if __name__ == "__main__":
    if test_backend_health():
        print("\n🎉 Backend is working!")
        sys.exit(0)
    else:
        print("\n💥 Backend is not working!")
        sys.exit(1)