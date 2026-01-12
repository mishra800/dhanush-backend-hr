from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, time
from app import database, models, schemas
from app.role_utils import require_role

router = APIRouter(
    prefix="/meeting-rooms",
    tags=["meeting-rooms"]
)

@router.post("/", response_model=schemas.MeetingRoomOut)
def create_meeting_room(
    room: schemas.MeetingRoomCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager"]))
):
    """Create a new meeting room"""
    db_room = models.MeetingRoom(
        name=room.name,
        location=room.location,
        capacity=room.capacity,
        equipment=room.equipment,
        created_by=current_user.id
    )
    
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    
    return db_room

@router.get("/", response_model=List[schemas.MeetingRoomOut])
def get_meeting_rooms(
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"]))
):
    """Get all meeting rooms"""
    query = db.query(models.MeetingRoom)
    
    if is_active is not None:
        query = query.filter(models.MeetingRoom.is_active == is_active)
    
    return query.offset(skip).limit(limit).all()

@router.get("/{room_id}", response_model=schemas.MeetingRoomOut)
def get_meeting_room(
    room_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"]))
):
    """Get specific meeting room"""
    room = db.query(models.MeetingRoom).filter(models.MeetingRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Meeting room not found")
    return room

@router.put("/{room_id}", response_model=schemas.MeetingRoomOut)
def update_meeting_room(
    room_id: int,
    room_update: schemas.MeetingRoomCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager"]))
):
    """Update meeting room"""
    room = db.query(models.MeetingRoom).filter(models.MeetingRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Meeting room not found")
    
    for field, value in room_update.dict(exclude_unset=True).items():
        setattr(room, field, value)
    
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{room_id}")
def delete_meeting_room(
    room_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr"]))
):
    """Delete meeting room"""
    room = db.query(models.MeetingRoom).filter(models.MeetingRoom.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Meeting room not found")
    
    # Check if room has active bookings
    active_bookings = db.query(models.MeetingRoomBooking).filter(
        models.MeetingRoomBooking.room_id == room_id,
        models.MeetingRoomBooking.meeting_date >= date.today(),
        models.MeetingRoomBooking.status == "confirmed"
    ).count()
    
    if active_bookings > 0:
        raise HTTPException(status_code=400, detail="Cannot delete room with active bookings")
    
    db.delete(room)
    db.commit()
    return {"message": "Meeting room deleted successfully"}

# Room Booking endpoints
@router.post("/bookings", response_model=schemas.MeetingRoomBookingOut)
def create_room_booking(
    booking: schemas.MeetingRoomBookingCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"]))
):
    """Book a meeting room"""
    # Check if room exists and is active
    room = db.query(models.MeetingRoom).filter(
        models.MeetingRoom.id == booking.room_id,
        models.MeetingRoom.is_active == True
    ).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Meeting room not found or inactive")
    
    # Check for conflicts
    start_time_obj = datetime.strptime(booking.start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(booking.end_time, "%H:%M").time()
    
    conflicts = db.query(models.MeetingRoomBooking).filter(
        models.MeetingRoomBooking.room_id == booking.room_id,
        models.MeetingRoomBooking.meeting_date == booking.meeting_date,
        models.MeetingRoomBooking.status == "confirmed",
        models.MeetingRoomBooking.start_time < end_time_obj,
        models.MeetingRoomBooking.end_time > start_time_obj
    ).first()
    
    if conflicts:
        raise HTTPException(status_code=400, detail="Room is already booked for this time slot")
    
    # Check capacity
    if booking.attendee_count > room.capacity:
        raise HTTPException(status_code=400, detail=f"Room capacity is {room.capacity}, requested {booking.attendee_count}")
    
    db_booking = models.MeetingRoomBooking(
        room_id=booking.room_id,
        user_id=current_user.id,
        meeting_date=booking.meeting_date,
        start_time=start_time_obj,
        end_time=end_time_obj,
        purpose=booking.purpose,
        attendee_count=booking.attendee_count,
        status="confirmed"
    )
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    
    return db_booking

@router.get("/bookings", response_model=List[schemas.MeetingRoomBookingOut])
def get_room_bookings(
    room_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"]))
):
    """Get room bookings with optional filters"""
    query = db.query(models.MeetingRoomBooking)
    
    if room_id:
        query = query.filter(models.MeetingRoomBooking.room_id == room_id)
    if date_from:
        query = query.filter(models.MeetingRoomBooking.meeting_date >= date_from)
    if date_to:
        query = query.filter(models.MeetingRoomBooking.meeting_date <= date_to)
    if status:
        query = query.filter(models.MeetingRoomBooking.status == status)
    
    return query.order_by(models.MeetingRoomBooking.meeting_date.desc()).offset(skip).limit(limit).all()

@router.get("/bookings/{booking_id}", response_model=schemas.MeetingRoomBookingOut)
def get_room_booking(
    booking_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"]))
):
    """Get specific room booking"""
    booking = db.query(models.MeetingRoomBooking).filter(models.MeetingRoomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking

@router.put("/bookings/{booking_id}/cancel")
def cancel_room_booking(
    booking_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"]))
):
    """Cancel a room booking"""
    booking = db.query(models.MeetingRoomBooking).filter(models.MeetingRoomBooking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check if user can cancel (owner or admin/hr)
    if booking.user_id != current_user.id and current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    booking.status = "cancelled"
    booking.cancelled_at = datetime.utcnow()
    
    db.commit()
    return {"message": "Booking cancelled successfully"}

@router.get("/{room_id}/availability")
def check_room_availability(
    room_id: int,
    meeting_date: date,
    start_time: str,
    end_time: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(require_role(["admin", "hr", "manager", "employee"]))
):
    """Check if room is available for given time slot"""
    room = db.query(models.MeetingRoom).filter(
        models.MeetingRoom.id == room_id,
        models.MeetingRoom.is_active == True
    ).first()
    
    if not room:
        raise HTTPException(status_code=404, detail="Meeting room not found or inactive")
    
    start_time_obj = datetime.strptime(start_time, "%H:%M").time()
    end_time_obj = datetime.strptime(end_time, "%H:%M").time()
    
    conflicts = db.query(models.MeetingRoomBooking).filter(
        models.MeetingRoomBooking.room_id == room_id,
        models.MeetingRoomBooking.meeting_date == meeting_date,
        models.MeetingRoomBooking.status == "confirmed",
        models.MeetingRoomBooking.start_time < end_time_obj,
        models.MeetingRoomBooking.end_time > start_time_obj
    ).all()
    
    return {
        "available": len(conflicts) == 0,
        "conflicts": [
            {
                "id": booking.id,
                "start_time": booking.start_time.strftime("%H:%M"),
                "end_time": booking.end_time.strftime("%H:%M"),
                "purpose": booking.purpose
            }
            for booking in conflicts
        ]
    }