"""
Profile Service - Handles profile validation, completion tracking, and management
"""

import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session
from app import models
import json

class ProfileService:
    """Service for managing employee profiles"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_phone_number(self, phone: str) -> Tuple[bool, str]:
        """Validate phone number format"""
        if not phone:
            return True, ""  # Phone is optional
        
        # Remove all non-digit characters
        digits_only = re.sub(r'\D', '', phone)
        
        # Check if it's a valid length (10 digits for US, or 10-15 for international)
        if len(digits_only) < 10 or len(digits_only) > 15:
            return False, "Phone number must be between 10-15 digits"
        
        return True, ""
    
    def validate_email(self, email: str) -> Tuple[bool, str]:
        """Validate email format"""
        if not email:
            return False, "Email is required"
        
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return False, "Invalid email format"
        
        return True, ""
    
    def validate_date_of_birth(self, dob: str) -> Tuple[bool, str]:
        """Validate date of birth"""
        if not dob:
            return True, ""  # DOB is optional
        
        try:
            birth_date = datetime.strptime(dob, '%Y-%m-%d').date()
            today = date.today()
            
            # Check if date is not in the future
            if birth_date > today:
                return False, "Date of birth cannot be in the future"
            
            # Check if age is reasonable (between 16 and 100)
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            if age < 16 or age > 100:
                return False, "Age must be between 16 and 100 years"
            
            return True, ""
        except ValueError:
            return False, "Invalid date format. Use YYYY-MM-DD"
    
    def validate_profile_data(self, profile_data: Dict) -> Tuple[bool, List[str]]:
        """Validate all profile data"""
        errors = []
        
        # Validate required fields
        if not profile_data.get('first_name', '').strip():
            errors.append("First name is required")
        
        if not profile_data.get('last_name', '').strip():
            errors.append("Last name is required")
        
        if not profile_data.get('department', '').strip():
            errors.append("Department is required")
        
        # Validate phone number
        phone = profile_data.get('phone', '')
        if phone:
            is_valid, error = self.validate_phone_number(phone)
            if not is_valid:
                errors.append(error)
        
        # Validate date of birth
        dob = profile_data.get('date_of_birth', '')
        if dob:
            is_valid, error = self.validate_date_of_birth(dob)
            if not is_valid:
                errors.append(error)
        
        # Validate emergency contact phone
        emergency_phone = profile_data.get('emergency_contact_phone', '')
        if emergency_phone:
            is_valid, error = self.validate_phone_number(emergency_phone)
            if not is_valid:
                errors.append(f"Emergency contact phone: {error}")
        
        # If emergency contact name is provided, phone should also be provided
        if profile_data.get('emergency_contact_name', '') and not emergency_phone:
            errors.append("Emergency contact phone is required when emergency contact name is provided")
        
        return len(errors) == 0, errors
    
    def calculate_profile_completion(self, employee: models.Employee) -> int:
        """Calculate profile completion percentage"""
        total_fields = 10
        completed_fields = 0
        
        # Core fields (required)
        if employee.first_name and employee.first_name.strip():
            completed_fields += 1
        if employee.last_name and employee.last_name.strip():
            completed_fields += 1
        if employee.department and employee.department.strip():
            completed_fields += 1
        
        # Optional but important fields
        if employee.phone and employee.phone.strip():
            completed_fields += 1
        if employee.position and employee.position.strip():
            completed_fields += 1
        if employee.address and employee.address.strip():
            completed_fields += 1
        if employee.date_of_birth:
            completed_fields += 1
        if employee.emergency_contact_name and employee.emergency_contact_name.strip():
            completed_fields += 1
        if employee.emergency_contact_phone and employee.emergency_contact_phone.strip():
            completed_fields += 1
        if employee.profile_image_url and employee.profile_image_url.strip():
            completed_fields += 1
        
        return int((completed_fields / total_fields) * 100)
    
    def get_missing_fields(self, employee: models.Employee) -> List[str]:
        """Get list of missing profile fields"""
        missing = []
        
        if not (employee.first_name and employee.first_name.strip()):
            missing.append("first_name")
        if not (employee.last_name and employee.last_name.strip()):
            missing.append("last_name")
        if not (employee.department and employee.department.strip()):
            missing.append("department")
        if not (employee.phone and employee.phone.strip()):
            missing.append("phone")
        if not (employee.position and employee.position.strip()):
            missing.append("position")
        if not (employee.address and employee.address.strip()):
            missing.append("address")
        if not employee.date_of_birth:
            missing.append("date_of_birth")
        if not (employee.emergency_contact_name and employee.emergency_contact_name.strip()):
            missing.append("emergency_contact_name")
        if not (employee.emergency_contact_phone and employee.emergency_contact_phone.strip()):
            missing.append("emergency_contact_phone")
        if not (employee.profile_image_url and employee.profile_image_url.strip()):
            missing.append("profile_image")
        
        return missing
    
    def update_profile(self, user_id: int, profile_data: Dict) -> Tuple[bool, str, Optional[models.Employee]]:
        """Update employee profile with validation"""
        
        # Validate profile data
        is_valid, errors = self.validate_profile_data(profile_data)
        if not is_valid:
            return False, "; ".join(errors), None
        
        # Get or create employee record
        employee = self.db.query(models.Employee).filter(
            models.Employee.user_id == user_id
        ).first()
        
        if not employee:
            # Create new employee record
            employee = models.Employee(
                user_id=user_id,
                first_name=profile_data.get('first_name', '').strip(),
                last_name=profile_data.get('last_name', '').strip(),
                phone=profile_data.get('phone', '').strip(),
                department=profile_data.get('department', '').strip(),
                position=profile_data.get('position', '').strip(),
                address=profile_data.get('address', '').strip(),
                emergency_contact_name=profile_data.get('emergency_contact_name', '').strip(),
                emergency_contact_phone=profile_data.get('emergency_contact_phone', '').strip()
            )
            
            # Handle date of birth
            if profile_data.get('date_of_birth'):
                try:
                    employee.date_of_birth = datetime.strptime(profile_data['date_of_birth'], '%Y-%m-%d')
                except ValueError:
                    pass
            
            self.db.add(employee)
        else:
            # Update existing employee record
            if 'first_name' in profile_data:
                employee.first_name = profile_data['first_name'].strip()
            if 'last_name' in profile_data:
                employee.last_name = profile_data['last_name'].strip()
            if 'phone' in profile_data:
                employee.phone = profile_data['phone'].strip()
            if 'department' in profile_data:
                employee.department = profile_data['department'].strip()
            if 'position' in profile_data:
                employee.position = profile_data['position'].strip()
            if 'address' in profile_data:
                employee.address = profile_data['address'].strip()
            if 'emergency_contact_name' in profile_data:
                employee.emergency_contact_name = profile_data['emergency_contact_name'].strip()
            if 'emergency_contact_phone' in profile_data:
                employee.emergency_contact_phone = profile_data['emergency_contact_phone'].strip()
            
            # Handle date of birth
            if 'date_of_birth' in profile_data and profile_data['date_of_birth']:
                try:
                    employee.date_of_birth = datetime.strptime(profile_data['date_of_birth'], '%Y-%m-%d')
                except ValueError:
                    pass
        
        # Update profile completion percentage
        employee.profile_completion_percentage = self.calculate_profile_completion(employee)
        
        try:
            self.db.commit()
            self.db.refresh(employee)
            return True, "Profile updated successfully", employee
        except Exception as e:
            self.db.rollback()
            return False, f"Database error: {str(e)}", None
    
    def get_profile_status(self, user_id: int) -> Dict:
        """Get comprehensive profile status"""
        employee = self.db.query(models.Employee).filter(
            models.Employee.user_id == user_id
        ).first()
        
        if not employee:
            return {
                "has_profile": False,
                "profile_completion": 0,
                "missing_fields": ["first_name", "last_name", "phone", "department", "position", "address", "emergency_contact_name", "emergency_contact_phone", "date_of_birth", "profile_image"],
                "employee": None
            }
        
        completion = self.calculate_profile_completion(employee)
        missing = self.get_missing_fields(employee)
        
        return {
            "has_profile": True,
            "profile_completion": completion,
            "missing_fields": missing,
            "employee": employee,
            "is_complete": completion >= 80,  # Consider 80% as complete
            "critical_missing": [field for field in missing if field in ["first_name", "last_name", "department"]]
        }