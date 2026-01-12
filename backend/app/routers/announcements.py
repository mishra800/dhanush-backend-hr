from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app import database, models, schemas
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)

@router.get("/", response_model=List[schemas.AnnouncementOut])
def get_announcements(db: Session = Depends(database.get_db)):
    anns = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
    if not anns:
        # Seed
        seed = models.Announcement(
            title="Welcome to the New HR System!",
            content="We are excited to launch our new AI-powered HR platform. Please update your profiles.",
            posted_by=1 # Admin
        )
        db.add(seed)
        db.commit()
        anns = db.query(models.Announcement).all()
    return anns

@router.get("/with-status")
def get_announcements_with_status(
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Get announcements with acknowledgment status for current user"""
    anns = db.query(models.Announcement).order_by(models.Announcement.created_at.desc()).all()
    
    # Get employee record for current user
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    
    result = []
    for ann in anns:
        # Check if user acknowledged this announcement
        acknowledged = False
        acknowledged_at = None
        
        if employee:
            ack = db.query(models.AnnouncementAcknowledgment).filter(
                models.AnnouncementAcknowledgment.announcement_id == ann.id,
                models.AnnouncementAcknowledgment.employee_id == employee.id
            ).first()
            
            if ack:
                acknowledged = True
                acknowledged_at = ack.acknowledged_at
        
        # Get author name
        author = db.query(models.User).filter(models.User.id == ann.posted_by).first()
        author_name = "HR" if author and author.role in ['admin', 'hr'] else "System"
        
        result.append({
            "id": ann.id,
            "title": ann.title,
            "content": ann.content,
            "posted_by": ann.posted_by,
            "author_name": author_name,
            "created_at": ann.created_at,
            "acknowledged": acknowledged,
            "acknowledged_at": acknowledged_at
        })
    
    return result

@router.post("/", response_model=schemas.AnnouncementOut)
def create_announcement(ann: schemas.AnnouncementCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Only Admin/HR
    db_ann = models.Announcement(**ann.dict(), posted_by=current_user.id)
    db.add(db_ann)
    db.commit()
    db.refresh(db_ann)
    return db_ann

@router.post("/{announcement_id}/acknowledge")
def acknowledge_announcement(
    announcement_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Acknowledge that the user has read an announcement"""
    # Check if announcement exists
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Get employee record for current user
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    # Check if already acknowledged
    existing_ack = db.query(models.AnnouncementAcknowledgment).filter(
        models.AnnouncementAcknowledgment.announcement_id == announcement_id,
        models.AnnouncementAcknowledgment.employee_id == employee.id
    ).first()
    
    if existing_ack:
        return {"message": "Already acknowledged", "acknowledged_at": existing_ack.acknowledged_at}
    
    # Create acknowledgment
    acknowledgment = models.AnnouncementAcknowledgment(
        announcement_id=announcement_id,
        employee_id=employee.id
    )
    db.add(acknowledgment)
    db.commit()
    db.refresh(acknowledgment)
    
    return {"message": "Announcement acknowledged successfully", "acknowledged_at": acknowledgment.acknowledged_at}

@router.put("/{announcement_id}/toggle-status")
def toggle_announcement_status(
    announcement_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Toggle announcement active status (Admin/HR only)"""
    # Check if user is admin/hr
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Not authorized to modify announcements")
    
    # Check if announcement exists
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Toggle status
    announcement.is_active = not announcement.is_active
    db.commit()
    db.refresh(announcement)
    
    status = "activated" if announcement.is_active else "deactivated"
    return {"message": f"Announcement {status} successfully", "is_active": announcement.is_active}

@router.get("/stats")
def get_announcement_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get announcement statistics (Admin/HR only)"""
    # Check if user is admin/hr
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Not authorized to view statistics")
    
    # Get total announcements
    total_announcements = db.query(models.Announcement).count()
    
    # Get active announcements (not expired)
    active_announcements = db.query(models.Announcement).filter(
        models.Announcement.is_active == True,
        models.Announcement.expires_at.is_(None) | (models.Announcement.expires_at > datetime.utcnow())
    ).count()
    
    # Get total employees
    total_employees = db.query(models.Employee).count()
    
    # Get acknowledgment stats for recent announcements
    recent_announcements = db.query(models.Announcement).order_by(
        models.Announcement.created_at.desc()
    ).limit(5).all()
    
    announcement_stats = []
    for ann in recent_announcements:
        ack_count = db.query(models.AnnouncementAcknowledgment).filter(
            models.AnnouncementAcknowledgment.announcement_id == ann.id
        ).count()
        
        announcement_stats.append({
            "id": ann.id,
            "title": ann.title,
            "created_at": ann.created_at,
            "acknowledgments": ack_count,
            "acknowledgment_rate": round((ack_count / total_employees * 100) if total_employees > 0 else 0, 1)
        })
    
    return {
        "total_announcements": total_announcements,
        "active_announcements": active_announcements,
        "total_employees": total_employees,
        "recent_announcement_stats": announcement_stats
    }

@router.get("/{announcement_id}/acknowledgments")
def get_announcement_acknowledgments(
    announcement_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get list of employees who acknowledged an announcement (Admin/HR only)"""
    # Check if user is admin/hr
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Not authorized to view acknowledgments")
    
    # Check if announcement exists
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Get acknowledgments with employee details
    acknowledgments = db.query(models.AnnouncementAcknowledgment).filter(
        models.AnnouncementAcknowledgment.announcement_id == announcement_id
    ).join(models.Employee).all()
    
    result = []
    for ack in acknowledgments:
        employee = db.query(models.Employee).filter(models.Employee.id == ack.employee_id).first()
        if employee:
            result.append({
                "employee_id": employee.id,
                "employee_name": f"{employee.first_name} {employee.last_name}",
                "acknowledged_at": ack.acknowledged_at
            })
    
    return {
        "announcement_id": announcement_id,
        "announcement_title": announcement.title,
        "total_acknowledgments": len(result),
        "acknowledgments": result
    }
