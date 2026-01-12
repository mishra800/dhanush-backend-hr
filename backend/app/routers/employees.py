from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import os
from datetime import datetime
from app import database, models, schemas
from app.employee_service import EmployeeService
from app.role_utils import require_roless

router = APIRouter(
    prefix="/employees",
    tags=["employees"]
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/search")
def search_employees(
    q: str = None,
    department: str = None,
    position: str = None,
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """Search employees with filters"""
    query = db.query(models.Employee).join(models.User)
    
    if q:
        # Search in first name, last name, and email
        query = query.filter(
            (models.Employee.first_name.ilike(f"%{q}%")) |
            (models.Employee.last_name.ilike(f"%{q}%")) |
            (models.User.email.ilike(f"%{q}%"))
        )
    
    if department:
        query = query.filter(models.Employee.department.ilike(f"%{department}%"))
    
    if position:
        query = query.filter(models.Employee.position.ilike(f"%{position}%"))
    
    if status:
        query = query.filter(models.User.is_active == (status == "active"))
    
    employees = query.offset(skip).limit(limit).all()
    return employees

@router.get("/departments")
def get_departments(db: Session = Depends(database.get_db)):
    """Get list of all departments"""
    departments = db.query(models.Employee.department).distinct().filter(
        models.Employee.department.isnot(None),
        models.Employee.department != ""
    ).all()
    return [dept[0] for dept in departments if dept[0]]

@router.get("/positions")
def get_positions(db: Session = Depends(database.get_db)):
    """Get list of all positions"""
    positions = db.query(models.Employee.position).distinct().filter(
        models.Employee.position.isnot(None),
        models.Employee.position != ""
    ).all()
    return [pos[0] for pos in positions if pos[0]]

@router.get("/", response_model=List[schemas.EmployeeOut])
def get_employees(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    employees = db.query(models.Employee).join(models.User).offset(skip).limit(limit).all()
    return employees

@router.get("/interviewers", response_model=List[schemas.EmployeeOut])
def get_interviewers(db: Session = Depends(database.get_db)):
    """Get employees who can conduct interviews (HR, managers, admins)"""
    interviewers = db.query(models.Employee).join(models.User).filter(
        models.User.role.in_(['hr', 'manager', 'admin'])
    ).all()
    return interviewers

@router.post("/", response_model=schemas.EmployeeOut)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(database.get_db)):
    db_employee = models.Employee(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.post("/create-with-account")
def create_employee_with_account(
    employee_data: dict,
    db: Session = Depends(database.get_db)
):
    """
    Create employee and automatically create user account
    Expected data:
    {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@dhanushhealthcare.com",
        "department": "Engineering",
        "position": "Senior Developer",
        "date_of_joining": "2025-01-15",
        "pan_number": "ABCDE1234F",
        "aadhaar_number": "1234 5678 9012",
        "password": "optional - will generate if not provided"
    }
    """
    from app.auth_utils import get_password_hash
    import secrets
    
    # Extract email and password
    email = employee_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Generate password if not provided
    password = employee_data.get("password")
    if not password:
        password = secrets.token_urlsafe(12)  # Generate random password
    
    # Create user account - use the same hashing function as auth
    hashed_password = get_password_hash(password)
    new_user = models.User(
        email=email,
        hashed_password=hashed_password,
        role="employee",
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create employee profile
    employee_dict = {
        "user_id": new_user.id,
        "first_name": employee_data.get("first_name"),
        "last_name": employee_data.get("last_name"),
        "department": employee_data.get("department"),
        "position": employee_data.get("position"),
        "date_of_joining": employee_data.get("date_of_joining"),
        "pan_number": employee_data.get("pan_number"),
        "aadhaar_number": employee_data.get("aadhaar_number"),
        "profile_summary": employee_data.get("profile_summary"),
        "wfh_status": employee_data.get("wfh_status", "office")
    }
    
    new_employee = models.Employee(**employee_dict)
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return {
        "message": "Employee and user account created successfully",
        "employee": new_employee,
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "role": new_user.role
        },
        "login_credentials": {
            "email": email,
            "password": password,
            "role": new_user.role,
            "note": "Please share these credentials securely with the employee"
        }
    }

@router.get("/{employee_id}", response_model=schemas.EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(database.get_db)):
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.put("/{employee_id}", response_model=schemas.EmployeeOut)
def update_employee(employee_id: int, employee_update: schemas.EmployeeUpdate, db: Session = Depends(database.get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    update_data = employee_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_employee, key, value)
    
    db.commit()
    db.refresh(db_employee)
    return db_employee

@router.patch("/{employee_id}/status")
def update_employee_status(
    employee_id: int,
    status_data: dict,
    db: Session = Depends(database.get_db)
):
    """Update employee status (active/inactive)"""
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Update user status
    user = db.query(models.User).filter(models.User.id == employee.user_id).first()
    if user:
        new_status = status_data.get('status')
        if new_status in ['active', 'inactive']:
            user.is_active = (new_status == 'active')
            db.commit()
            return {"message": f"Employee status updated to {new_status}"}
    
    raise HTTPException(status_code=400, detail="Invalid status")

@router.get("/by-email/{email}")
def get_employee_by_email(email: str, db: Session = Depends(database.get_db)):
    """Get employee by email address"""
    employee = db.query(models.Employee).join(models.User).filter(
        models.User.email == email
    ).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.get("/by-department/{department}")
def get_employees_by_department(
    department: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    """Get employees by department"""
    employees = db.query(models.Employee).filter(
        models.Employee.department.ilike(f"%{department}%")
    ).offset(skip).limit(limit).all()
    return employees

@router.delete("/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(database.get_db)):
    db_employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    db.delete(db_employee)
    db.commit()
    return {"message": "Employee deleted successfully"}

@router.post("/extract-info")
async def extract_info(file: UploadFile = File(...)):
    # Mock AI Extraction Logic
    # In a real app, this would use OCR (Tesseract/Google Vision)
    
    filename = file.filename.lower()
    
    # Simulate extraction based on filename or just random plausible data
    extracted_data = {
        "first_name": "ExtractedName",
        "last_name": "ExtractedSurname",
        "pan_number": "ABCDE1234F",
        "aadhaar_number": "1234 5678 9012",
        "summary": "Experienced professional with background in engineering."
    }
    
    if "offer" in filename:
        extracted_data["summary"] = "Offer letter detected. Candidate has been offered a Senior role."
    elif "pan" in filename:
        extracted_data["summary"] = "PAN Card detected. Identity verification pending."
    
    return extracted_data

@router.get("/{employee_id}/documents")
def get_employee_documents(employee_id: int, db: Session = Depends(database.get_db)):
    """Get all documents for an employee"""
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    documents = db.query(models.EmployeeDocument).filter(
        models.EmployeeDocument.employee_id == employee_id
    ).all()
    return documents

@router.delete("/{employee_id}/documents/{document_id}")
def delete_employee_document(
    employee_id: int,
    document_id: int,
    db: Session = Depends(database.get_db)
):
    """Delete an employee document"""
    document = db.query(models.EmployeeDocument).filter(
        models.EmployeeDocument.id == document_id,
        models.EmployeeDocument.employee_id == employee_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from filesystem
    if os.path.exists(document.document_url):
        os.remove(document.document_url)
    
    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.patch("/{employee_id}/documents/{document_id}/verify")
def verify_employee_document(
    employee_id: int,
    document_id: int,
    verification_data: dict,
    db: Session = Depends(database.get_db)
):
    """Verify/approve an employee document"""
    document = db.query(models.EmployeeDocument).filter(
        models.EmployeeDocument.id == document_id,
        models.EmployeeDocument.employee_id == employee_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.is_verified = verification_data.get('is_verified', False)
    document.rejection_reason = verification_data.get('rejection_reason')
    document.verified_at = datetime.utcnow() if document.is_verified else None
    
    db.commit()
    return {"message": "Document verification updated"}

@router.post("/{employee_id}/upload-document")
async def upload_document(employee_id: int, file: UploadFile = File(...), doc_type: str = "General", db: Session = Depends(database.get_db)):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    db_document = models.EmployeeDocument(
        employee_id=employee_id,
        document_type=doc_type,
        document_url=file_location
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


@router.get("/stats/overview")
def get_employee_stats(db: Session = Depends(database.get_db)):
    """Get employee statistics overview"""
    from sqlalchemy import func
    
    total_employees = db.query(models.Employee).count()
    active_employees = db.query(models.Employee).join(models.User).filter(
        models.User.is_active == True
    ).count()
    
    # Department breakdown
    dept_stats = db.query(
        models.Employee.department,
        func.count(models.Employee.id).label('count')
    ).filter(
        models.Employee.department.isnot(None),
        models.Employee.department != ""
    ).group_by(models.Employee.department).all()
    
    # Recent joiners (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_joiners = db.query(models.Employee).filter(
        models.Employee.date_of_joining >= thirty_days_ago
    ).count()
    
    return {
        "total_employees": total_employees,
        "active_employees": active_employees,
        "inactive_employees": total_employees - active_employees,
        "recent_joiners": recent_joiners,
        "department_breakdown": [
            {"department": dept, "count": count} for dept, count in dept_stats
        ]
    }

@router.get("/export/csv")
def export_employees_csv(db: Session = Depends(database.get_db)):
    """Export employees to CSV format"""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    employees = db.query(models.Employee).join(models.User).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'First Name', 'Last Name', 'Email', 'Department', 
        'Position', 'Date of Joining', 'Status', 'Phone'
    ])
    
    # Write data
    for emp in employees:
        writer.writerow([
            emp.id,
            emp.first_name or '',
            emp.last_name or '',
            emp.user.email if emp.user else '',
            emp.department or '',
            emp.position or '',
            emp.date_of_joining.strftime('%Y-%m-%d') if emp.date_of_joining else '',
            'Active' if emp.user and emp.user.is_active else 'Inactive',
            emp.phone or ''
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employees.csv"}
    )

# Profile management endpoints
from app.dependencies import get_current_user
from app.profile_service import ProfileService

@router.put("/me/profile")
def update_my_profile(
    profile_data: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update current user's employee profile with validation"""
    
    profile_service = ProfileService(db)
    success, message, employee = profile_service.update_profile(current_user.id, profile_data)
    
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    return {
        "message": message,
        "employee": employee,
        "profile_completion": employee.profile_completion_percentage
    }

@router.get("/me/profile-status")
def get_profile_status(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get current user's profile completion status"""
    
    profile_service = ProfileService(db)
    status = profile_service.get_profile_status(current_user.id)
    
    return status

def calculate_profile_completion(employee):
    """Calculate profile completion percentage - Legacy function for backward compatibility"""
    profile_service = ProfileService(None)
    return profile_service.calculate_profile_completion(employee)
    

# ============================================
# EMPLOYEE DIRECTORY & ORGANIZATIONAL CHART
# ============================================

@router.get("/directory", response_model=List[schemas.EmployeeDirectoryOut])
def get_employee_directory(
    search: Optional[str] = Query(None, description="Search by name, email, or employee code"),
    department: Optional[str] = Query(None, description="Filter by department"),
    position: Optional[str] = Query(None, description="Filter by position"),
    manager_id: Optional[int] = Query(None, description="Filter by manager"),
    employment_type: Optional[str] = Query(None, description="Filter by employment type"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(database.get_db)
):
    """Get employee directory with advanced filtering and search"""
    service = EmployeeService(db)
    return service.get_employee_directory(
        search=search,
        department=department,
        position=position,
        manager_id=manager_id,
        employment_type=employment_type,
        is_active=is_active,
        skip=skip,
        limit=limit
    )

@router.get("/organizational-chart")
def get_organizational_chart(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr", "manager"]))
):
    """Get organizational chart data"""
    service = EmployeeService(db)
    return service.get_organizational_chart()

# ============================================
# BULK OPERATIONS
# ============================================

@router.post("/bulk-import", response_model=schemas.BulkImportLogOut)
def bulk_import_employees(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Bulk import employees from CSV or Excel file"""
    
    # Validate file type
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(
            status_code=400, 
            detail="Invalid file format. Please upload CSV or Excel file."
        )
    
    service = EmployeeService(db)
    return service.bulk_import_employees(file, current_user.id)

@router.get("/bulk-import/logs", response_model=List[schemas.BulkImportLogOut])
def get_bulk_import_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Get bulk import logs"""
    logs = db.query(models.BulkImportLog).order_by(
        models.BulkImportLog.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return logs

@router.get("/bulk-import/template")
def download_bulk_import_template(
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Download CSV template for bulk employee import"""
    
    template_data = {
        "first_name": ["John", "Jane"],
        "last_name": ["Doe", "Smith"],
        "email": ["john.doe@company.com", "jane.smith@company.com"],
        "department": ["Engineering", "Marketing"],
        "position": ["Software Engineer", "Marketing Manager"],
        "phone": ["+1234567890", "+1234567891"],
        "date_of_joining": ["2024-01-15", "2024-02-01"],
        "employee_code": ["EMP001", "EMP002"],
        "manager_email": ["manager@company.com", "manager@company.com"],
        "employment_type": ["full_time", "full_time"],
        "work_location": ["Office", "Remote"]
    }
    
    import pandas as pd
    import io
    from fastapi.responses import StreamingResponse
    
    df = pd.DataFrame(template_data)
    
    # Create CSV in memory
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=employee_import_template.csv"}
    )

# ============================================
# EMPLOYEE LIFECYCLE MANAGEMENT
# ============================================

@router.post("/lifecycle-events", response_model=schemas.EmployeeLifecycleEventOut)
def create_lifecycle_event(
    event_data: schemas.EmployeeLifecycleEventCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr", "manager"]))
):
    """Create employee lifecycle event (promotion, transfer, etc.)"""
    service = EmployeeService(db)
    return service.create_lifecycle_event(event_data, current_user.id)

@router.put("/lifecycle-events/{event_id}/approve")
def approve_lifecycle_event(
    event_id: int,
    approval_notes: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Approve and execute lifecycle event"""
    service = EmployeeService(db)
    return service.approve_lifecycle_event(event_id, current_user.id, approval_notes)

@router.get("/lifecycle-events", response_model=List[schemas.EmployeeLifecycleEventOut])
def get_lifecycle_events(
    employee_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr", "manager"]))
):
    """Get lifecycle events with filtering"""
    query = db.query(models.EmployeeLifecycleEvent)
    
    if employee_id:
        query = query.filter(models.EmployeeLifecycleEvent.employee_id == employee_id)
    
    if event_type:
        query = query.filter(models.EmployeeLifecycleEvent.event_type == event_type)
    
    if status:
        query = query.filter(models.EmployeeLifecycleEvent.status == status)
    
    events = query.order_by(
        models.EmployeeLifecycleEvent.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return events

# ============================================
# EMPLOYEE EXIT MANAGEMENT
# ============================================

@router.post("/exits", response_model=schemas.EmployeeExitOut)
def initiate_employee_exit(
    exit_data: schemas.EmployeeExitCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr", "manager"]))
):
    """Initiate employee exit process"""
    service = EmployeeService(db)
    return service.initiate_employee_exit(exit_data, current_user.id)

@router.get("/exits", response_model=List[schemas.EmployeeExitOut])
def get_employee_exits(
    status: Optional[str] = Query(None),
    exit_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Get employee exits with filtering"""
    query = db.query(models.EmployeeExit)
    
    if status:
        query = query.filter(models.EmployeeExit.status == status)
    
    if exit_type:
        query = query.filter(models.EmployeeExit.exit_type == exit_type)
    
    exits = query.order_by(
        models.EmployeeExit.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return exits

@router.put("/exits/{exit_id}/clearance")
def update_exit_clearance(
    exit_id: int,
    department: str,
    cleared: bool,
    notes: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr", "manager"]))
):
    """Update exit clearance status for a department"""
    
    exit_record = db.query(models.EmployeeExit).filter(
        models.EmployeeExit.id == exit_id
    ).first()
    
    if not exit_record:
        raise HTTPException(status_code=404, detail="Exit record not found")
    
    # Update clearance status
    clearance_status = exit_record.clearance_status or {}
    clearance_status[department] = {
        "cleared": cleared,
        "cleared_by": current_user.id,
        "cleared_at": datetime.utcnow().isoformat(),
        "notes": notes
    }
    
    exit_record.clearance_status = clearance_status
    
    # Check if all clearances are complete
    required_clearances = ["hr", "it", "finance", "assets", "manager"]
    all_cleared = all(
        clearance_status.get(dept, {}).get("cleared", False) 
        for dept in required_clearances
    )
    
    if all_cleared and exit_record.status == "in_progress":
        exit_record.status = "completed"
    
    db.commit()
    db.refresh(exit_record)
    
    return {"message": "Clearance updated successfully", "exit": exit_record}

# ============================================
# EMPLOYEE ANALYTICS
# ============================================

@router.get("/analytics/overview", response_model=schemas.EmployeeAnalyticsOut)
def get_employee_analytics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Get comprehensive employee analytics"""
    service = EmployeeService(db)
    return service.get_employee_analytics()

@router.get("/analytics/departments", response_model=List[schemas.DepartmentAnalyticsOut])
def get_department_analytics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Get analytics by department"""
    service = EmployeeService(db)
    return service.get_department_analytics()

@router.get("/analytics/skills", response_model=List[schemas.SkillsAnalyticsOut])
def get_skills_analytics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Get skills analytics by employee"""
    service = EmployeeService(db)
    return service.get_skills_analytics()

# ============================================
# SKILLS MANAGEMENT
# ============================================

@router.post("/skills", response_model=schemas.SkillOut)
def create_skill(
    skill_data: schemas.SkillCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Create a new skill"""
    service = EmployeeService(db)
    return service.create_skill(skill_data)

@router.get("/skills", response_model=List[schemas.SkillOut])
def get_skills(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(database.get_db)
):
    """Get all skills with filtering"""
    query = db.query(models.Skill)
    
    if category:
        query = query.filter(models.Skill.category == category)
    
    if search:
        query = query.filter(models.Skill.name.ilike(f"%{search}%"))
    
    skills = query.offset(skip).limit(limit).all()
    return skills

@router.post("/skills/assign", response_model=schemas.EmployeeSkillOut)
def assign_skill_to_employee(
    skill_assignment: schemas.EmployeeSkillCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr", "manager"]))
):
    """Assign skill to employee"""
    service = EmployeeService(db)
    return service.assign_skill_to_employee(skill_assignment)

@router.get("/{employee_id}/skills", response_model=List[schemas.EmployeeSkillOut])
def get_employee_skills(
    employee_id: int,
    db: Session = Depends(database.get_db)
):
    """Get skills for a specific employee"""
    skills = db.query(models.EmployeeSkill).filter(
        models.EmployeeSkill.employee_id == employee_id
    ).all()
    
    return skills

# ============================================
# EMPLOYEE CONTRACTS
# ============================================

@router.post("/contracts", response_model=schemas.EmployeeContractOut)
def create_employee_contract(
    contract_data: schemas.EmployeeContractCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Create employee contract"""
    
    # Check if employee exists
    employee = db.query(models.Employee).filter(
        models.Employee.id == contract_data.employee_id
    ).first()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    contract = models.EmployeeContract(
        **contract_data.dict(),
        created_by=current_user.id
    )
    
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    return contract

@router.get("/contracts", response_model=List[schemas.EmployeeContractOut])
def get_employee_contracts(
    employee_id: Optional[int] = Query(None),
    contract_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_roles(["admin", "hr"]))
):
    """Get employee contracts with filtering"""
    query = db.query(models.EmployeeContract)
    
    if employee_id:
        query = query.filter(models.EmployeeContract.employee_id == employee_id)
    
    if contract_type:
        query = query.filter(models.EmployeeContract.contract_type == contract_type)
    
    if status:
        query = query.filter(models.EmployeeContract.status == status)
    
    contracts = query.order_by(
        models.EmployeeContract.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return contracts
