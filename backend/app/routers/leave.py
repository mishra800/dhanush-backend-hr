from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, extract, func
from typing import List, Optional
from datetime import datetime, date, timedelta
from app import database, models, schemas
from app.dependencies import get_current_user
from app.notification_service import NotificationService
import calendar

router = APIRouter(
    prefix="/leave",
    tags=["leave"]
)

def get_notification_service(db: Session = Depends(database.get_db)) -> NotificationService:
    return NotificationService(db)

# --- Leave Types ---

@router.get("/types", response_model=List[dict])
def get_leave_types(db: Session = Depends(database.get_db)):
    """Get all available leave types"""
    leave_types = db.query(models.LeaveType).filter(models.LeaveType.is_active == True).all()
    
    if not leave_types:
        # Seed default leave types
        default_types = [
            {"name": "Sick Leave", "code": "SL", "max_days_per_year": 12, "carry_forward": False, "description": "For medical emergencies and illness"},
            {"name": "Casual Leave", "code": "CL", "max_days_per_year": 12, "carry_forward": False, "description": "For personal work and short breaks"},
            {"name": "Earned Leave", "code": "EL", "max_days_per_year": 21, "carry_forward": True, "description": "Annual vacation leave"},
            {"name": "Maternity Leave", "code": "ML", "max_days_per_year": 180, "carry_forward": False, "description": "For maternity purposes"},
            {"name": "Paternity Leave", "code": "PL", "max_days_per_year": 15, "carry_forward": False, "description": "For paternity purposes"},
            {"name": "Bereavement Leave", "code": "BL", "max_days_per_year": 5, "carry_forward": False, "description": "For family bereavement"}
        ]
        
        for type_data in default_types:
            leave_type = models.LeaveType(**type_data)
            db.add(leave_type)
        
        db.commit()
        leave_types = db.query(models.LeaveType).filter(models.LeaveType.is_active == True).all()
    
    return [
        {
            "id": lt.id,
            "name": lt.name,
            "code": lt.code,
            "max_days_per_year": lt.max_days_per_year,
            "carry_forward": lt.carry_forward,
            "description": lt.description
        }
        for lt in leave_types
    ]

# --- Balances ---

@router.get("/balances/{employee_id}", response_model=List[schemas.LeaveBalanceOut])
def get_leave_balances(employee_id: int, db: Session = Depends(database.get_db)):
    """Get leave balances for an employee"""
    balances = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == employee_id).all()
    
    if not balances:
        # Initialize balances for all leave types
        leave_types = db.query(models.LeaveType).filter(models.LeaveType.is_active == True).all()
        
        for leave_type in leave_types:
            balance = models.LeaveBalance(
                employee_id=employee_id,
                leave_type_id=leave_type.id,
                leave_type=leave_type.name,
                balance=leave_type.max_days_per_year,
                used=0,
                year=datetime.now().year
            )
            db.add(balance)
        
        db.commit()
        balances = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == employee_id).all()
    
    return balances

@router.post("/balances/{employee_id}/adjust", response_model=dict)
def adjust_leave_balance(
    employee_id: int,
    adjustment_data: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Adjust leave balance (admin/HR only)"""
    
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Not authorized to adjust leave balances")
    
    leave_type_id = adjustment_data.get("leave_type_id")
    adjustment = adjustment_data.get("adjustment", 0)
    reason = adjustment_data.get("reason", "Manual adjustment")
    
    balance = db.query(models.LeaveBalance).filter(
        and_(
            models.LeaveBalance.employee_id == employee_id,
            models.LeaveBalance.leave_type_id == leave_type_id
        )
    ).first()
    
    if not balance:
        raise HTTPException(status_code=404, detail="Leave balance not found")
    
    old_balance = balance.balance
    balance.balance += adjustment
    balance.updated_at = datetime.utcnow()
    
    # Log the adjustment
    adjustment_log = models.LeaveAdjustment(
        employee_id=employee_id,
        leave_type_id=leave_type_id,
        old_balance=old_balance,
        adjustment=adjustment,
        new_balance=balance.balance,
        reason=reason,
        adjusted_by=current_user.id
    )
    
    db.add(adjustment_log)
    db.commit()
    
    return {
        "message": "Leave balance adjusted successfully",
        "old_balance": old_balance,
        "adjustment": adjustment,
        "new_balance": balance.balance
    }

# --- Holidays ---

@router.get("/holidays", response_model=List[schemas.HolidayOut])
def get_holidays(
    year: Optional[int] = Query(None, description="Year to filter holidays"),
    db: Session = Depends(database.get_db)
):
    """Get holidays for a specific year"""
    
    if not year:
        year = datetime.now().year
    
    holidays = db.query(models.Holiday).filter(
        extract('year', models.Holiday.date) == year
    ).order_by(models.Holiday.date).all()
    
    if not holidays:
        # Seed holidays for current year
        current_year = datetime.now().year
        seed_data = [
            {"date": date(current_year, 1, 1), "name": "New Year's Day", "type": "Public"},
            {"date": date(current_year, 1, 26), "name": "Republic Day", "type": "Public"},
            {"date": date(current_year, 8, 15), "name": "Independence Day", "type": "Public"},
            {"date": date(current_year, 10, 2), "name": "Gandhi Jayanti", "type": "Public"},
            {"date": date(current_year, 12, 25), "name": "Christmas Day", "type": "Public"}
        ]
        
        for data in seed_data:
            holiday = models.Holiday(**data)
            db.add(holiday)
        
        db.commit()
        holidays = db.query(models.Holiday).filter(
            extract('year', models.Holiday.date) == year
        ).order_by(models.Holiday.date).all()
    
    return holidays

@router.post("/holidays", response_model=schemas.HolidayOut)
def create_holiday(
    holiday_data: schemas.HolidayCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new holiday (admin/HR only)"""
    
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Not authorized to create holidays")
    
    # Check if holiday already exists
    existing = db.query(models.Holiday).filter(models.Holiday.date == holiday_data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="Holiday already exists for this date")
    
    holiday = models.Holiday(**holiday_data.dict())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    
    return holiday

# --- Leave Requests ---

@router.post("/request", response_model=schemas.LeaveRequestOut)
def request_leave(
    leave_request: schemas.LeaveRequestCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Submit a leave request"""
    
    # Get employee
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # Validate dates
    if leave_request.start_date > leave_request.end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end date")
    
    if leave_request.start_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot request leave for past dates")
    
    # Calculate duration
    duration = (leave_request.end_date - leave_request.start_date).days + 1
    
    # Check if it's a weekend or holiday
    working_days = calculate_working_days(leave_request.start_date, leave_request.end_date, db)
    
    # Check leave balance
    balance = db.query(models.LeaveBalance).filter(
        and_(
            models.LeaveBalance.employee_id == employee.id,
            models.LeaveBalance.leave_type == leave_request.leave_type
        )
    ).first()
    
    if not balance:
        raise HTTPException(status_code=400, detail="Leave type not found in your balance")
    
    if balance.balance < working_days:
        raise HTTPException(status_code=400, detail=f"Insufficient leave balance. Available: {balance.balance}, Required: {working_days}")
    
    # Check for overlapping requests
    overlapping = db.query(models.LeaveRequest).filter(
        and_(
            models.LeaveRequest.employee_id == employee.id,
            models.LeaveRequest.status.in_(["pending", "approved"]),
            models.LeaveRequest.start_date <= leave_request.end_date,
            models.LeaveRequest.end_date >= leave_request.start_date
        )
    ).first()
    
    if overlapping:
        raise HTTPException(status_code=400, detail="You have an overlapping leave request")
    
    # Create leave request
    db_leave = models.LeaveRequest(
        employee_id=employee.id,
        leave_type=leave_request.leave_type,
        start_date=leave_request.start_date,
        end_date=leave_request.end_date,
        reason=leave_request.reason,
        duration_days=working_days,
        status="pending"
    )
    
    db.add(db_leave)
    db.commit()
    db.refresh(db_leave)
    
    # Send notification to managers
    managers = db.query(models.User).filter(
        models.User.role.in_(["manager", "hr", "admin"])
    ).all()
    
    for manager in managers:
        notification_service.create_notification(
            user_id=manager.id,
            title="New Leave Request",
            message=f"{employee.first_name} {employee.last_name} has requested {leave_request.leave_type} from {leave_request.start_date} to {leave_request.end_date}",
            type="leave_request",
            action_url=f"/leave/requests/{db_leave.id}"
        )
    
    return db_leave

@router.get("/requests", response_model=List[schemas.LeaveRequestOut])
def get_my_leave_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    year: Optional[int] = Query(None, description="Filter by year"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get current user's leave requests"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    query = db.query(models.LeaveRequest).filter(models.LeaveRequest.employee_id == employee.id)
    
    if status:
        query = query.filter(models.LeaveRequest.status == status)
    
    if year:
        query = query.filter(extract('year', models.LeaveRequest.start_date) == year)
    
    return query.order_by(models.LeaveRequest.created_at.desc()).all()

@router.get("/employee/{employee_id}", response_model=List[schemas.LeaveRequestOut])
def get_employee_leaves(
    employee_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get leave requests for a specific employee (managers/HR only)"""
    
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to view employee leaves")
    
    return db.query(models.LeaveRequest).filter(
        models.LeaveRequest.employee_id == employee_id
    ).order_by(models.LeaveRequest.created_at.desc()).all()

@router.get("/pending", response_model=List[schemas.LeaveRequestWithEmployee])
def get_pending_leaves(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all pending leave requests for managers/HR"""
    
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to view pending leaves")
    
    return db.query(models.LeaveRequest).filter(
        models.LeaveRequest.status == "pending"
    ).order_by(models.LeaveRequest.created_at.desc()).all()

@router.put("/approve/{leave_id}", response_model=schemas.LeaveRequestOut)
def approve_leave(
    leave_id: int,
    approval_data: Optional[dict] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Approve a leave request"""
    
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to approve leaves")
    
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Leave request is not pending")
    
    # Update leave status
    leave.status = "approved"
    leave.approved_by = current_user.id
    leave.approved_at = datetime.utcnow()
    
    if approval_data and approval_data.get("comments"):
        leave.manager_comments = approval_data["comments"]
    
    # Deduct from leave balance
    balance = db.query(models.LeaveBalance).filter(
        and_(
            models.LeaveBalance.employee_id == leave.employee_id,
            models.LeaveBalance.leave_type == leave.leave_type
        )
    ).first()
    
    if balance:
        balance.balance -= leave.duration_days
        balance.used += leave.duration_days
        balance.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(leave)
    
    # Send notification to employee
    employee = db.query(models.Employee).filter(models.Employee.id == leave.employee_id).first()
    if employee and employee.user:
        notification_service.create_notification(
            user_id=employee.user.id,
            title="Leave Request Approved",
            message=f"Your {leave.leave_type} request from {leave.start_date} to {leave.end_date} has been approved",
            type="leave_approved"
        )
    
    return leave

@router.put("/reject/{leave_id}", response_model=schemas.LeaveRequestOut)
def reject_leave(
    leave_id: int,
    rejection_data: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
    notification_service: NotificationService = Depends(get_notification_service)
):
    """Reject a leave request"""
    
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to reject leaves")
    
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave.status != "pending":
        raise HTTPException(status_code=400, detail="Leave request is not pending")
    
    # Update leave status
    leave.status = "rejected"
    leave.approved_by = current_user.id
    leave.approved_at = datetime.utcnow()
    leave.manager_comments = rejection_data.get("reason", "No reason provided")
    
    db.commit()
    db.refresh(leave)
    
    # Send notification to employee
    employee = db.query(models.Employee).filter(models.Employee.id == leave.employee_id).first()
    if employee and employee.user:
        notification_service.create_notification(
            user_id=employee.user.id,
            title="Leave Request Rejected",
            message=f"Your {leave.leave_type} request from {leave.start_date} to {leave.end_date} has been rejected. Reason: {leave.manager_comments}",
            type="leave_rejected"
        )
    
    return leave

@router.delete("/cancel/{leave_id}", response_model=dict)
def cancel_leave_request(
    leave_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Cancel a leave request (employee can cancel their own pending requests)"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    leave = db.query(models.LeaveRequest).filter(
        and_(
            models.LeaveRequest.id == leave_id,
            models.LeaveRequest.employee_id == employee.id
        )
    ).first()
    
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave.status not in ["pending"]:
        raise HTTPException(status_code=400, detail="Can only cancel pending leave requests")
    
    leave.status = "cancelled"
    leave.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Leave request cancelled successfully"}

# --- Leave Calendar ---

@router.get("/calendar", response_model=dict)
def get_leave_calendar(
    month: Optional[int] = Query(None, description="Month (1-12)"),
    year: Optional[int] = Query(None, description="Year"),
    employee_id: Optional[int] = Query(None, description="Filter by employee"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get leave calendar for a specific month"""
    
    if not month:
        month = datetime.now().month
    if not year:
        year = datetime.now().year
    
    # Get leaves for the month
    query = db.query(models.LeaveRequest).filter(
        and_(
            models.LeaveRequest.status == "approved",
            extract('year', models.LeaveRequest.start_date) == year,
            extract('month', models.LeaveRequest.start_date) == month
        )
    )
    
    if employee_id:
        query = query.filter(models.LeaveRequest.employee_id == employee_id)
    
    leaves = query.all()
    
    # Get holidays for the month
    holidays = db.query(models.Holiday).filter(
        and_(
            extract('year', models.Holiday.date) == year,
            extract('month', models.Holiday.date) == month
        )
    ).all()
    
    # Generate calendar data
    cal = calendar.monthcalendar(year, month)
    calendar_data = []
    
    for week in cal:
        week_data = []
        for day in week:
            if day == 0:
                week_data.append(None)
            else:
                day_date = date(year, month, day)
                
                # Find leaves for this day
                day_leaves = []
                for leave in leaves:
                    if leave.start_date <= day_date <= leave.end_date:
                        day_leaves.append({
                            "employee_name": f"{leave.employee.first_name} {leave.employee.last_name}",
                            "leave_type": leave.leave_type,
                            "reason": leave.reason
                        })
                
                # Find holidays for this day
                day_holidays = [
                    {"name": h.name, "type": h.type}
                    for h in holidays
                    if h.date == day_date
                ]
                
                week_data.append({
                    "day": day,
                    "date": day_date.isoformat(),
                    "is_weekend": day_date.weekday() >= 5,
                    "leaves": day_leaves,
                    "holidays": day_holidays
                })
        
        calendar_data.append(week_data)
    
    return {
        "year": year,
        "month": month,
        "month_name": calendar.month_name[month],
        "calendar": calendar_data
    }

# --- Analytics ---

@router.get("/analytics", response_model=dict)
def get_leave_analytics(
    year: Optional[int] = Query(None, description="Year for analytics"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get leave analytics"""
    
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(status_code=403, detail="Not authorized to view analytics")
    
    if not year:
        year = datetime.now().year
    
    # Get all leaves for the year
    leaves = db.query(models.LeaveRequest).filter(
        extract('year', models.LeaveRequest.start_date) == year
    ).all()
    
    # Calculate analytics
    total_requests = len(leaves)
    approved_requests = len([l for l in leaves if l.status == "approved"])
    pending_requests = len([l for l in leaves if l.status == "pending"])
    rejected_requests = len([l for l in leaves if l.status == "rejected"])
    
    # Leave type breakdown
    leave_type_breakdown = {}
    for leave in leaves:
        leave_type = leave.leave_type
        if leave_type not in leave_type_breakdown:
            leave_type_breakdown[leave_type] = {"count": 0, "days": 0}
        leave_type_breakdown[leave_type]["count"] += 1
        leave_type_breakdown[leave_type]["days"] += leave.duration_days
    
    # Monthly breakdown
    monthly_breakdown = {}
    for i in range(1, 13):
        monthly_breakdown[calendar.month_name[i]] = 0
    
    for leave in leaves:
        if leave.status == "approved":
            month_name = calendar.month_name[leave.start_date.month]
            monthly_breakdown[month_name] += leave.duration_days
    
    return {
        "year": year,
        "summary": {
            "total_requests": total_requests,
            "approved_requests": approved_requests,
            "pending_requests": pending_requests,
            "rejected_requests": rejected_requests,
            "approval_rate": (approved_requests / total_requests * 100) if total_requests > 0 else 0
        },
        "leave_type_breakdown": leave_type_breakdown,
        "monthly_breakdown": monthly_breakdown
    }

# --- Helper Functions ---

def calculate_working_days(start_date: date, end_date: date, db: Session) -> int:
    """Calculate working days excluding weekends and holidays"""
    
    working_days = 0
    current_date = start_date
    
    # Get holidays in the date range
    holidays = db.query(models.Holiday).filter(
        and_(
            models.Holiday.date >= start_date,
            models.Holiday.date <= end_date
        )
    ).all()
    
    holiday_dates = {h.date for h in holidays}
    
    while current_date <= end_date:
        # Skip weekends (Saturday = 5, Sunday = 6)
        if current_date.weekday() < 5 and current_date not in holiday_dates:
            working_days += 1
        current_date += timedelta(days=1)
    
    return working_days
