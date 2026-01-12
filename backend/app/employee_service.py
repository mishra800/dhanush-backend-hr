"""
Enhanced Employee Service - Comprehensive employee management functionality
"""

import pandas as pd
import io
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc, text
from fastapi import HTTPException, UploadFile
import json
import uuid

from app import models, schemas
from app.profile_service import ProfileService


class EmployeeService:
    """Enhanced service for comprehensive employee management"""
    
    def __init__(self, db: Session):
        self.db = db
        self.profile_service = ProfileService(db)
    
    # ============================================
    # EMPLOYEE DIRECTORY & SEARCH
    # ============================================
    
    def get_employee_directory(
        self, 
        search: Optional[str] = None,
        department: Optional[str] = None,
        position: Optional[str] = None,
        manager_id: Optional[int] = None,
        employment_type: Optional[str] = None,
        is_active: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[schemas.EmployeeDirectoryOut]:
        """Get employee directory with advanced filtering"""
        
        # Use the database view for optimized queries
        query = self.db.execute(text("SELECT * FROM employee_directory"))
        employees = query.fetchall()
        
        # Convert to list of dicts for filtering
        employee_list = [dict(row._mapping) for row in employees]
        
        # Apply filters
        if search:
            search_lower = search.lower()
            employee_list = [
                emp for emp in employee_list
                if (search_lower in (emp.get('full_name', '') or '').lower() or
                   search_lower in (emp.get('email', '') or '').lower() or
                   search_lower in (emp.get('employee_code', '') or '').lower())
            ]
        
        if department:
            employee_list = [
                emp for emp in employee_list
                if emp.get('department', '').lower() == department.lower()
            ]
        
        if position:
            employee_list = [
                emp for emp in employee_list
                if position.lower() in (emp.get('position', '') or '').lower()
            ]
        
        if employment_type:
            employee_list = [
                emp for emp in employee_list
                if emp.get('employment_type') == employment_type
            ]
        
        if is_active is not None:
            employee_list = [
                emp for emp in employee_list
                if emp.get('is_active') == is_active
            ]
        
        # Apply pagination
        total = len(employee_list)
        employee_list = employee_list[skip:skip + limit]
        
        return employee_list
    
    def get_organizational_chart(self) -> Dict[str, Any]:
        """Get organizational chart data"""
        
        # Get all employees with their managers
        employees = self.db.query(models.Employee).options(
            joinedload(models.Employee.user)
        ).all()
        
        # Build hierarchy
        org_chart = {
            "nodes": [],
            "edges": [],
            "departments": {}
        }
        
        for emp in employees:
            if not emp.user or not emp.user.is_active:
                continue
                
            node = {
                "id": emp.id,
                "name": f"{emp.first_name} {emp.last_name}",
                "position": emp.position or "Employee",
                "department": emp.department or "Unassigned",
                "email": emp.user.email,
                "profile_image": emp.profile_image_url,
                "manager_id": emp.manager_id
            }
            org_chart["nodes"].append(node)
            
            # Add edge to manager if exists
            if emp.manager_id:
                org_chart["edges"].append({
                    "from": emp.manager_id,
                    "to": emp.id
                })
            
            # Group by department
            dept = emp.department or "Unassigned"
            if dept not in org_chart["departments"]:
                org_chart["departments"][dept] = []
            org_chart["departments"][dept].append(node)
        
        return org_chart
    
    # ============================================
    # BULK OPERATIONS
    # ============================================
    
    def validate_bulk_employee_data(self, df: pd.DataFrame) -> Tuple[bool, List[str], List[Dict]]:
        """Validate bulk employee import data"""
        errors = []
        valid_records = []
        
        required_columns = ['first_name', 'last_name', 'email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            errors.append(f"Missing required columns: {', '.join(missing_columns)}")
            return False, errors, []
        
        for index, row in df.iterrows():
            record_errors = []
            
            # Validate required fields
            if pd.isna(row['first_name']) or not str(row['first_name']).strip():
                record_errors.append(f"Row {index + 2}: First name is required")
            
            if pd.isna(row['last_name']) or not str(row['last_name']).strip():
                record_errors.append(f"Row {index + 2}: Last name is required")
            
            if pd.isna(row['email']) or not str(row['email']).strip():
                record_errors.append(f"Row {index + 2}: Email is required")
            else:
                # Check if email already exists
                existing_user = self.db.query(models.User).filter(
                    models.User.email == str(row['email']).strip()
                ).first()
                if existing_user:
                    record_errors.append(f"Row {index + 2}: Email {row['email']} already exists")
            
            # Validate email format
            email = str(row['email']).strip() if not pd.isna(row['email']) else ""
            if email:
                is_valid, error = self.profile_service.validate_email(email)
                if not is_valid:
                    record_errors.append(f"Row {index + 2}: {error}")
            
            # Validate phone if provided
            phone = str(row.get('phone', '')).strip() if not pd.isna(row.get('phone')) else ""
            if phone:
                is_valid, error = self.profile_service.validate_phone_number(phone)
                if not is_valid:
                    record_errors.append(f"Row {index + 2}: {error}")
            
            # Validate date of joining if provided
            if 'date_of_joining' in row and not pd.isna(row['date_of_joining']):
                try:
                    if isinstance(row['date_of_joining'], str):
                        datetime.strptime(row['date_of_joining'], '%Y-%m-%d')
                except ValueError:
                    record_errors.append(f"Row {index + 2}: Invalid date format for date_of_joining. Use YYYY-MM-DD")
            
            if record_errors:
                errors.extend(record_errors)
            else:
                # Convert row to dict and clean up
                record = row.to_dict()
                # Replace NaN values with None
                for key, value in record.items():
                    if pd.isna(value):
                        record[key] = None
                    elif isinstance(value, str):
                        record[key] = value.strip()
                
                valid_records.append(record)
        
        return len(errors) == 0, errors, valid_records
    
    def bulk_import_employees(
        self, 
        file: UploadFile, 
        imported_by: int
    ) -> schemas.BulkImportLogOut:
        """Import employees from CSV/Excel file"""
        
        # Create import log
        import_log = models.BulkImportLog(
            filename=file.filename,
            total_records=0,
            imported_by=imported_by,
            import_type="employees",
            status="processing"
        )
        self.db.add(import_log)
        self.db.commit()
        self.db.refresh(import_log)
        
        try:
            # Read file
            content = file.file.read()
            
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            elif file.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(content))
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV or Excel.")
            
            import_log.total_records = len(df)
            self.db.commit()
            
            # Validate data
            is_valid, errors, valid_records = self.validate_bulk_employee_data(df)
            
            if not is_valid:
                import_log.status = "failed"
                import_log.error_details = {"validation_errors": errors}
                import_log.completed_at = datetime.utcnow()
                self.db.commit()
                return import_log
            
            # Import valid records
            successful_count = 0
            failed_count = 0
            import_errors = []
            
            for record in valid_records:
                try:
                    # Create user account
                    user = models.User(
                        email=record['email'],
                        hashed_password="temp_password_needs_reset",  # User will need to reset
                        is_active=True,
                        role="employee"
                    )
                    self.db.add(user)
                    self.db.flush()  # Get user ID
                    
                    # Generate employee code if not provided
                    employee_code = record.get('employee_code')
                    if not employee_code:
                        employee_code = f"EMP{user.id:06d}"
                    
                    # Find manager if manager_email provided
                    manager_id = None
                    if record.get('manager_email'):
                        manager_user = self.db.query(models.User).filter(
                            models.User.email == record['manager_email']
                        ).first()
                        if manager_user and manager_user.employee:
                            manager_id = manager_user.employee[0].id
                    
                    # Create employee record
                    employee = models.Employee(
                        user_id=user.id,
                        first_name=record['first_name'],
                        last_name=record['last_name'],
                        department=record.get('department'),
                        position=record.get('position'),
                        phone=record.get('phone'),
                        employee_code=employee_code,
                        manager_id=manager_id,
                        employment_type=record.get('employment_type', 'full_time'),
                        work_location=record.get('work_location'),
                        date_of_joining=datetime.strptime(record['date_of_joining'], '%Y-%m-%d') if record.get('date_of_joining') else datetime.utcnow()
                    )
                    self.db.add(employee)
                    successful_count += 1
                    
                except Exception as e:
                    failed_count += 1
                    import_errors.append(f"Failed to import {record['email']}: {str(e)}")
                    self.db.rollback()
            
            # Update import log
            import_log.successful_records = successful_count
            import_log.failed_records = failed_count
            import_log.status = "completed" if failed_count == 0 else "partial"
            import_log.error_details = {"import_errors": import_errors} if import_errors else None
            import_log.completed_at = datetime.utcnow()
            
            self.db.commit()
            return import_log
            
        except Exception as e:
            import_log.status = "failed"
            import_log.error_details = {"system_error": str(e)}
            import_log.completed_at = datetime.utcnow()
            self.db.commit()
            raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    
    # ============================================
    # EMPLOYEE LIFECYCLE MANAGEMENT
    # ============================================
    
    def create_lifecycle_event(
        self, 
        event_data: schemas.EmployeeLifecycleEventCreate,
        created_by: int
    ) -> schemas.EmployeeLifecycleEventOut:
        """Create employee lifecycle event"""
        
        employee = self.db.query(models.Employee).filter(
            models.Employee.id == event_data.employee_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Create lifecycle event
        lifecycle_event = models.EmployeeLifecycleEvent(
            **event_data.dict(),
            created_by=created_by
        )
        
        self.db.add(lifecycle_event)
        self.db.commit()
        self.db.refresh(lifecycle_event)
        
        return lifecycle_event
    
    def approve_lifecycle_event(
        self, 
        event_id: int, 
        approved_by: int,
        approval_notes: Optional[str] = None
    ) -> schemas.EmployeeLifecycleEventOut:
        """Approve and execute lifecycle event"""
        
        event = self.db.query(models.EmployeeLifecycleEvent).filter(
            models.EmployeeLifecycleEvent.id == event_id
        ).first()
        
        if not event:
            raise HTTPException(status_code=404, detail="Lifecycle event not found")
        
        if event.status != "pending":
            raise HTTPException(status_code=400, detail="Event is not pending approval")
        
        # Update event status
        event.approved_by = approved_by
        event.status = "approved"
        
        # Apply changes to employee record
        employee = self.db.query(models.Employee).filter(
            models.Employee.id == event.employee_id
        ).first()
        
        if event.event_type in ["promotion", "transfer", "department_change", "role_change"]:
            # Apply new data to employee
            if event.new_data:
                for field, value in event.new_data.items():
                    if hasattr(employee, field):
                        setattr(employee, field, value)
        
        elif event.event_type == "exit":
            # Handle employee exit
            employee.user.is_active = False
            
            # Create exit record if not exists
            existing_exit = self.db.query(models.EmployeeExit).filter(
                models.EmployeeExit.employee_id == employee.id
            ).first()
            
            if not existing_exit:
                exit_record = models.EmployeeExit(
                    employee_id=employee.id,
                    exit_type=event.new_data.get('exit_type', 'resignation'),
                    last_working_date=datetime.strptime(event.new_data.get('last_working_date'), '%Y-%m-%d').date() if event.new_data.get('last_working_date') else None,
                    reason=event.reason,
                    created_by=approved_by,
                    status="in_progress"
                )
                self.db.add(exit_record)
        
        event.status = "completed"
        self.db.commit()
        self.db.refresh(event)
        
        return event
    
    def initiate_employee_exit(
        self, 
        exit_data: schemas.EmployeeExitCreate,
        created_by: int
    ) -> schemas.EmployeeExitOut:
        """Initiate employee exit process"""
        
        employee = self.db.query(models.Employee).filter(
            models.Employee.id == exit_data.employee_id
        ).first()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        # Check if exit already exists
        existing_exit = self.db.query(models.EmployeeExit).filter(
            models.EmployeeExit.employee_id == exit_data.employee_id,
            models.EmployeeExit.status.in_(["initiated", "in_progress"])
        ).first()
        
        if existing_exit:
            raise HTTPException(status_code=400, detail="Exit process already initiated for this employee")
        
        # Create exit record
        exit_record = models.EmployeeExit(
            **exit_data.dict(),
            created_by=created_by,
            clearance_status={
                "hr": False,
                "it": False,
                "finance": False,
                "assets": False,
                "manager": False
            }
        )
        
        self.db.add(exit_record)
        self.db.commit()
        self.db.refresh(exit_record)
        
        return exit_record
    
    # ============================================
    # EMPLOYEE ANALYTICS
    # ============================================
    
    def get_employee_analytics(self) -> schemas.EmployeeAnalyticsOut:
        """Get comprehensive employee analytics"""
        
        # Check cache first
        cached_analytics = self.db.query(models.EmployeeAnalyticsCache).filter(
            models.EmployeeAnalyticsCache.metric_name == "employee_overview",
            models.EmployeeAnalyticsCache.expires_at > datetime.utcnow()
        ).first()
        
        if cached_analytics:
            return schemas.EmployeeAnalyticsOut(**cached_analytics.metric_value)
        
        # Calculate analytics
        total_employees = self.db.query(models.Employee).count()
        active_employees = self.db.query(models.Employee).join(models.User).filter(
            models.User.is_active == True
        ).count()
        
        # Get departments
        departments = self.db.query(models.Employee.department).distinct().filter(
            models.Employee.department.isnot(None)
        ).all()
        departments = [dept[0] for dept in departments if dept[0]]
        
        # Calculate average tenure
        avg_tenure_query = self.db.query(
            func.avg(
                func.extract('epoch', func.now() - models.Employee.date_of_joining) / (30.44 * 24 * 3600)
            )
        ).filter(
            models.Employee.date_of_joining.isnot(None)
        ).scalar()
        
        avg_tenure_months = float(avg_tenure_query) if avg_tenure_query else 0.0
        
        # Calculate turnover rate (exits in last 12 months / average headcount)
        one_year_ago = datetime.utcnow() - timedelta(days=365)
        exits_last_year = self.db.query(models.EmployeeExit).filter(
            models.EmployeeExit.created_at >= one_year_ago
        ).count()
        
        turnover_rate = (exits_last_year / total_employees * 100) if total_employees > 0 else 0.0
        
        # New hires this month
        start_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_hires_this_month = self.db.query(models.Employee).filter(
            models.Employee.date_of_joining >= start_of_month
        ).count()
        
        # Exits this month
        exits_this_month = self.db.query(models.EmployeeExit).filter(
            models.EmployeeExit.created_at >= start_of_month
        ).count()
        
        analytics = schemas.EmployeeAnalyticsOut(
            total_employees=total_employees,
            active_employees=active_employees,
            departments=departments,
            avg_tenure_months=avg_tenure_months,
            turnover_rate=turnover_rate,
            new_hires_this_month=new_hires_this_month,
            exits_this_month=exits_this_month
        )
        
        # Cache the result
        cache_entry = models.EmployeeAnalyticsCache(
            metric_name="employee_overview",
            metric_value=analytics.dict(),
            calculated_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=1)  # Cache for 1 hour
        )
        self.db.add(cache_entry)
        self.db.commit()
        
        return analytics
    
    def get_department_analytics(self) -> List[schemas.DepartmentAnalyticsOut]:
        """Get analytics by department"""
        
        # Use the database view
        query = self.db.execute(text("SELECT * FROM department_hierarchy"))
        results = query.fetchall()
        
        return [
            schemas.DepartmentAnalyticsOut(
                department=row.department,
                total_employees=row.total_employees,
                avg_tenure_years=float(row.avg_tenure_years) if row.avg_tenure_years else 0.0,
                department_heads=row.department_heads
            )
            for row in results
        ]
    
    def get_skills_analytics(self) -> List[schemas.SkillsAnalyticsOut]:
        """Get skills analytics by employee"""
        
        # Use the database view
        query = self.db.execute(text("SELECT * FROM employee_skills_summary"))
        results = query.fetchall()
        
        return [
            schemas.SkillsAnalyticsOut(
                employee_id=row.employee_id,
                employee_name=row.employee_name,
                department=row.department or "Unassigned",
                total_skills=row.total_skills or 0,
                avg_proficiency=float(row.avg_proficiency) if row.avg_proficiency else 0.0,
                certified_skills=row.certified_skills or 0
            )
            for row in results
        ]
    
    # ============================================
    # SKILLS MANAGEMENT
    # ============================================
    
    def create_skill(self, skill_data: schemas.SkillCreate) -> schemas.SkillOut:
        """Create a new skill"""
        
        # Check if skill already exists
        existing_skill = self.db.query(models.Skill).filter(
            models.Skill.name.ilike(skill_data.name)
        ).first()
        
        if existing_skill:
            raise HTTPException(status_code=400, detail="Skill already exists")
        
        skill = models.Skill(**skill_data.dict())
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        
        return skill
    
    def assign_skill_to_employee(
        self, 
        skill_assignment: schemas.EmployeeSkillCreate
    ) -> schemas.EmployeeSkillOut:
        """Assign skill to employee"""
        
        # Check if assignment already exists
        existing_assignment = self.db.query(models.EmployeeSkill).filter(
            models.EmployeeSkill.employee_id == skill_assignment.employee_id,
            models.EmployeeSkill.skill_id == skill_assignment.skill_id
        ).first()
        
        if existing_assignment:
            # Update existing assignment
            for field, value in skill_assignment.dict().items():
                if field not in ['employee_id', 'skill_id']:
                    setattr(existing_assignment, field, value)
            
            existing_assignment.last_assessed = date.today()
            self.db.commit()
            self.db.refresh(existing_assignment)
            return existing_assignment
        
        # Create new assignment
        assignment = models.EmployeeSkill(
            **skill_assignment.dict(),
            last_assessed=date.today()
        )
        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)
        
        return assignment