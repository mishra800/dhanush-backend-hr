from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, time
from .. import models, schemas
from ..database import get_db
from ..role_utils import require_role
from ..meeting_service_simple import MeetingService
from ..notification_service import NotificationService

router = APIRouter(
    prefix="/meetings",
    tags=["meetings"]
)

def get_meeting_service(db: Session = Depends(get_db)) -> MeetingService:
    notification_service = NotificationService(db)
    return MeetingService(db, notification_service)

@router.post("/", response_model=schemas.MeetingOut)
def create_meeting(
    meeting: schemas.MeetingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Create a new meeting"""
    return meeting_service.create_meeting(meeting, current_user.id)

@router.get("/", response_model=List[schemas.MeetingOut])
def get_meetings(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    meeting_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get meetings with optional filters"""
    filters = {}
    if status:
        filters['status'] = status
    if date_from:
        filters['date_from'] = date_from
    if date_to:
        filters['date_to'] = date_to
    if meeting_type:
        filters['meeting_type'] = meeting_type
    
    meetings = meeting_service.get_meetings(current_user.id, filters)
    return meetings[skip:skip + limit]

@router.get("/upcoming", response_model=List[schemas.MeetingOut])
def get_upcoming_meetings(
    days_ahead: int = Query(7, ge=1, le=30),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get upcoming meetings for the current user"""
    return meeting_service.get_upcoming_meetings(current_user.id, days_ahead)

@router.get("/analytics")
def get_meeting_analytics(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get meeting analytics for the current user"""
    return meeting_service.get_meeting_analytics(current_user.id, date_from, date_to)

@router.post("/check-conflicts")
def check_meeting_conflicts(
    meeting_date: date,
    start_time: str,
    end_time: str,
    exclude_meeting_id: Optional[int] = None,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Check for meeting conflicts"""
    start_time_obj = datetime.strptime(start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(end_time, "%H:%M").time()
    
    conflicts = meeting_service.check_conflicts(
        current_user.id, meeting_date, start_time_obj, end_time_obj, exclude_meeting_id
    )
    
    return {
        "has_conflicts": len(conflicts) > 0,
        "conflicts": [
            {
                "id": meeting.id,
                "title": meeting.title,
                "start_time": meeting.start_time.strftime("%H:%M"),
                "end_time": meeting.end_time.strftime("%H:%M")
            }
            for meeting in conflicts
        ]
    }

@router.get("/{meeting_id}", response_model=schemas.MeetingOut)
def get_meeting(
    meeting_id: int,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get specific meeting details"""
    return meeting_service.get_meeting_by_id(meeting_id, current_user.id)

@router.put("/{meeting_id}", response_model=schemas.MeetingOut)
def update_meeting(
    meeting_id: int,
    meeting_update: schemas.MeetingUpdate,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Update meeting details"""
    return meeting_service.update_meeting(meeting_id, meeting_update, current_user.id)

@router.post("/{meeting_id}/cancel")
def cancel_meeting(
    meeting_id: int,
    reason: Optional[str] = None,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Cancel a meeting"""
    meeting = meeting_service.cancel_meeting(meeting_id, current_user.id, reason)
    return {"message": "Meeting cancelled successfully", "meeting": meeting}

@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Delete a meeting"""
    meeting = meeting_service.get_meeting_by_id(meeting_id, current_user.id)
    
    # Check if user can delete this meeting
    if meeting.created_by != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}

@router.post("/{meeting_id}/attendees")
def add_attendees(
    meeting_id: int,
    attendee_data: schemas.MeetingAttendeeCreate,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Add attendees to a meeting"""
    meeting_service.add_attendees(meeting_id, attendee_data.user_ids, current_user.id)
    return {"message": "Attendees added successfully"}

@router.put("/{meeting_id}/attendees/{user_id}/status")
def update_attendee_status(
    meeting_id: int,
    user_id: int,
    status_update: schemas.AttendeeStatusUpdate,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Update attendee status (accept/decline/tentative)"""
    meeting_service.update_attendee_status(meeting_id, user_id, status_update.status, current_user.id)
    return {"message": "Status updated successfully"}

@router.post("/{meeting_id}/attendance/{action}")
def mark_attendance(
    meeting_id: int,
    action: str,  # join or leave
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Mark when user joins/leaves meeting"""
    if action not in ["join", "leave"]:
        raise HTTPException(status_code=400, detail="Action must be 'join' or 'leave'")
    
    meeting_service.mark_attendance(meeting_id, current_user.id, action)
    return {"message": f"Attendance marked: {action}"}

# Meeting Notes endpoints
@router.get("/{meeting_id}/notes", response_model=List[schemas.MeetingNoteOut])
def get_meeting_notes(
    meeting_id: int,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get meeting notes"""
    return meeting_service.get_meeting_notes(meeting_id, current_user.id)

@router.post("/{meeting_id}/notes", response_model=schemas.MeetingNoteOut)
def add_meeting_note(
    meeting_id: int,
    note: schemas.MeetingNoteCreate,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Add a note to the meeting"""
    return meeting_service.add_meeting_note(
        meeting_id, current_user.id, note.content, note.note_type, note.is_private
    )

# Action Items endpoints
@router.get("/{meeting_id}/action-items", response_model=List[schemas.MeetingActionItemOut])
def get_meeting_action_items(
    meeting_id: int,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get action items for a meeting"""
    return meeting_service.get_action_items(meeting_id=meeting_id)

@router.post("/{meeting_id}/action-items", response_model=schemas.MeetingActionItemOut)
def create_action_item(
    meeting_id: int,
    action_item: schemas.MeetingActionItemCreate,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Create an action item from a meeting"""
    return meeting_service.create_action_item(meeting_id, action_item, current_user.id)

@router.get("/action-items/my-tasks", response_model=List[schemas.MeetingActionItemOut])
def get_my_action_items(
    status: Optional[str] = None,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Get action items assigned to current user"""
    return meeting_service.get_action_items(assigned_to=current_user.id, status=status)

@router.put("/action-items/{action_item_id}/status")
def update_action_item_status(
    action_item_id: int,
    status: str,
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"])),
    meeting_service: MeetingService = Depends(get_meeting_service)
):
    """Update action item status"""
    meeting_service.update_action_item_status(action_item_id, status, current_user.id)
    return {"message": "Action item status updated successfully"}