#!/usr/bin/env python3
"""
Run employee management database enhancements
"""

import psycopg2
import os
from dotenv import load_dotenv

def run_migration():
    load_dotenv()
    
    try:
        # Database connection
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'hr_system'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', 'password')
        )
        
        # Read and execute SQL file
        with open('create_employee_enhancements.sql', 'r') as f:
            sql_content = f.read()
        
        cursor = conn.cursor()
        cursor.execute(sql_content)
        conn.commit()
        cursor.close()
        conn.close()
        
        print('✅ Employee management enhancements applied successfully!')
        
    except Exception as e:
        print(f'❌ Error applying enhancements: {e}')
        return False
    
    return True

if __name__ == '__main__':
    run_migration()