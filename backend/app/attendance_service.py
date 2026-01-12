"""
Simple Attendance Service
Handles basic attendance marking with face recognition
"""

from datetime import datetime, time, date, timedelta
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app import models
from app.notification_service import get_notification_service
from app.security_service import get_security_service
import math
import base64
import os
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Try to import face recognition, fallback if not available
try:
    from app import face_recognition_utils
    FACE_RECOGNITION_AVAILABLE = True
    logger.info("Face recognition module loaded successfully")
except ImportError as e:
    logger.warning(f"Face recognition not available: {e}")
    FACE_RECOGNITION_AVAILABLE = False
    face_recognition_utils = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AttendanceService:
    
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = get_notification_service(db)
        self.security_service = get_security_service(db)
        
        # Office configuration
        self.OFFICE_COORDS = {
            "lat": 17.4065,
            "lon": 78.4772,
            "name": "Dhanush Healthcare Pvt. Ltd.",
            "address": "Hyderabad, Telangana"
        }
        self.MAX_DISTANCE = 100  # meters
        
        # Time windows for different shifts
        self.SHIFT_WINDOWS = {
            "Morning Shift": {"start": time(8, 0), "end": time(11, 0), "grace": 15},
            "Evening Shift": {"start": time(13, 0), "end": time(16, 0), "grace": 15},
            "Night Shift": {"start": time(21, 0), "end": time(23, 59), "grace": 15}
        }
    
    async def mark_attendance_comprehensive(
        self, 
        employee_id: int, 
        photo_base64: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        use_face_recognition: bool = True
    ) -> Dict[str, Any]:
        """
        Comprehensive attendance marking with all pre-checks and validations
        
        Flow:
        1. Pre-Checks (already marked, WFH status, shift assignment)
        2. Verification (camera, face recognition, GPS)
        3. Validation (time window, location, fraud detection)
        4. Record Creation (status assignment, approval workflow)
        """
        
        try:
            logger.info(f"Starting comprehensive attendance marking for employee {employee_id}")
            
            # ============================================
            # STEP 1: PRE-CHECKS
            # ============================================
            
            pre_check_result = await self._perform_pre_checks(employee_id)
            if not pre_check_result["success"]:
                return pre_check_result
            
            employee = pre_check_result["employee"]
            wfh_request = pre_check_result["wfh_request"]
            assigned_shift = pre_check_result["assigned_shift"]
            
            # ============================================
            # STEP 2: VERIFICATION
            # ============================================
            
            verification_result = await self._perform_verification(
                employee, photo_base64, latitude, longitude, use_face_recognition
            )
            if not verification_result["success"]:
                return verification_result
            
            # ============================================
            # STEP 3: VALIDATION
            # ============================================
            
            validation_result = await self._perform_validation(
                employee, assigned_shift, wfh_request, latitude, longitude
            )
            if not validation_result["success"]:
                return validation_result
            
            # ============================================
            # STEP 4: RECORD CREATION
            # ============================================
            
            record_result = await self._create_attendance_record(
                employee, assigned_shift, wfh_request, verification_result, validation_result
            )
            
            return record_result
            
        except Exception as e:
            logger.error(f"Error in comprehensive attendance marking: {str(e)}")
            return {
                "success": False,
                "error": f"System error: {str(e)}",
                "error_type": "system_error"
            }
    
    async def _perform_pre_checks(self, employee_id: int) -> Dict[str, Any]:
        """Perform pre-checks before attendance marking"""
        
        # Get employee
        employee = self.db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        if not employee:
            return {"success": False, "error": "Employee not found", "error_type": "employee_not_found"}
        
        # Check if already marked today
        today = date.today()
        existing_attendance = self.db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee_id,
            models.Attendance.date == today
        ).first()
        
        if existing_attendance:
            return {
                "success": False, 
                "error": "Attendance already marked for today",
                "error_type": "already_marked",
                "existing_record": {
                    "check_in": existing_attendance.check_in_time.strftime("%H:%M") if existing_attendance.check_in_time else None,
                    "check_out": existing_attendance.check_out_time.strftime("%H:%M") if existing_attendance.check_out_time else None,
                    "status": existing_attendance.status
                }
            }
        
        # Check WFH status
        wfh_request = self.db.query(models.WFHRequest).filter(
            models.WFHRequest.employee_id == employee_id,
            models.WFHRequest.date == today,
            models.WFHRequest.status == "approved"
        ).first()
        
        # Get assigned shift
        assigned_shift = self.db.query(models.Shift).filter(
            models.Shift.employee_id == employee_id,
            models.Shift.is_active == True
        ).first()
        
        return {
            "success": True,
            "employee": employee,
            "wfh_request": wfh_request,
            "assigned_shift": assigned_shift
        }
    
    async def _perform_verification(
        self, 
        employee: models.Employee, 
        photo_base64: Optional[str], 
        latitude: Optional[float], 
        longitude: Optional[float],
        use_face_recognition: bool
    ) -> Dict[str, Any]:
        """Perform verification checks"""
        
        verification_data = {
            "face_verified": False,
            "face_confidence": 0.0,
            "location_verified": False,
            "distance_from_office": None,
            "device_info": None
        }
        
        # Face recognition verification
        if use_face_recognition and photo_base64:
            try:
                face_result = await face_recognition_utils.verify_face(
                    employee.id, photo_base64
                )
                verification_data["face_verified"] = face_result.get("verified", False)
                verification_data["face_confidence"] = face_result.get("confidence", 0.0)
            except Exception as e:
                logger.warning(f"Face recognition failed: {str(e)}")
                verification_data["face_verified"] = False
        
        # GPS verification
        if latitude and longitude:
            distance = self._calculate_distance(
                latitude, longitude,
                self.OFFICE_COORDS["lat"], self.OFFICE_COORDS["lon"]
            )
            verification_data["distance_from_office"] = distance
            verification_data["location_verified"] = distance <= self.MAX_DISTANCE
        
        return {
            "success": True,
            "verification_data": verification_data
        }
    
    async def _perform_validation(
        self,
        employee: models.Employee,
        assigned_shift: Optional[models.Shift],
        wfh_request: Optional[models.WFHRequest],
        latitude: Optional[float],
        longitude: Optional[float]
    ) -> Dict[str, Any]:
        """Perform validation checks"""
        
        current_time = datetime.now().time()
        validation_data = {
            "time_window_valid": False,
            "location_required": True,
            "shift_name": "Default",
            "grace_period_used": False
        }
        
        # Time window validation
        if assigned_shift:
            shift_config = self.SHIFT_WINDOWS.get(assigned_shift.shift_name, self.SHIFT_WINDOWS["Morning Shift"])
            validation_data["shift_name"] = assigned_shift.shift_name
            
            # Check if within time window (including grace period)
            start_time = shift_config["start"]
            end_time = shift_config["end"]
            grace_minutes = shift_config["grace"]
            
            # Calculate grace period end time
            grace_end = datetime.combine(date.today(), end_time)
            grace_end += timedelta(minutes=grace_minutes)
            grace_end_time = grace_end.time()
            
            if start_time <= current_time <= end_time:
                validation_data["time_window_valid"] = True
            elif end_time < current_time <= grace_end_time:
                validation_data["time_window_valid"] = True
                validation_data["grace_period_used"] = True
        else:
            # Default time window (9 AM - 11 AM)
            validation_data["time_window_valid"] = time(9, 0) <= current_time <= time(11, 0)
        
        # Location requirement
        if wfh_request:
            validation_data["location_required"] = False
        
        return {
            "success": True,
            "validation_data": validation_data
        }
    
    async def _create_attendance_record(
        self,
        employee: models.Employee,
        assigned_shift: Optional[models.Shift],
        wfh_request: Optional[models.WFHRequest],
        verification_result: Dict[str, Any],
        validation_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create attendance record with proper status"""
        
        verification_data = verification_result["verification_data"]
        validation_data = validation_result["validation_data"]
        
        # Determine attendance status
        status = "present"
        requires_approval = False
        
        # Check for issues that require approval
        if not validation_data["time_window_valid"]:
            status = "late"
            requires_approval = True
        
        if validation_data["location_required"] and not verification_data["location_verified"]:
            status = "remote_unverified"
            requires_approval = True
        
        if verification_data["face_verified"] is False and verification_data.get("face_confidence", 0) < 0.7:
            status = "identity_unverified"
            requires_approval = True
        
        # Create attendance record
        attendance = models.Attendance(
            employee_id=employee.id,
            date=date.today(),
            check_in_time=datetime.now().time(),
            status=status,
            location_lat=verification_data.get("location_lat"),
            location_lon=verification_data.get("location_lon"),
            distance_from_office=verification_data.get("distance_from_office"),
            face_confidence=verification_data.get("face_confidence", 0.0),
            is_wfh=wfh_request is not None,
            requires_approval=requires_approval,
            shift_name=validation_data.get("shift_name", "Default"),
            grace_period_used=validation_data.get("grace_period_used", False),
            verification_data={
                "face_verified": verification_data["face_verified"],
                "location_verified": verification_data["location_verified"],
                "time_window_valid": validation_data["time_window_valid"]
            }
        )
        
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        
        # Send notifications if approval required
        if requires_approval:
            await self._send_approval_notification(employee, attendance, status)
        
        return {
            "success": True,
            "message": "Attendance marked successfully",
            "attendance_id": attendance.id,
            "status": status,
            "requires_approval": requires_approval,
            "check_in_time": attendance.check_in_time.strftime("%H:%M"),
            "verification_summary": {
                "face_verified": verification_data["face_verified"],
                "location_verified": verification_data["location_verified"],
                "time_window_valid": validation_data["time_window_valid"]
            }
        }
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in meters"""
        from math import radians, cos, sin, asin, sqrt
        
        # Convert to radians
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371000  # Radius of earth in meters
        
        return c * r
    
    async def _send_approval_notification(
        self, 
        employee: models.Employee, 
        attendance: models.Attendance, 
        status: str
    ):
        """Send notification for attendance requiring approval"""
        try:
            # Get manager
            manager = self.db.query(models.User).filter(
                models.User.role.in_(["manager", "hr", "admin"])
            ).first()
            
            if manager:
                await self.notification_service.create_notification(
                    user_id=manager.id,
                    title=f"Attendance Approval Required",
                    message=f"{employee.first_name} {employee.last_name} marked attendance with status: {status}",
                    type="attendance_approval",
                    action_url=f"/attendance/approvals/{attendance.id}"
                )
        except Exception as e:
            logger.error(f"Failed to send approval notification: {str(e)}")
    
    async def approve_attendance(self, attendance_id: int, approved_by: int, notes: Optional[str] = None) -> Dict[str, Any]:
        """Approve attendance record"""
        
        attendance = self.db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
        if not attendance:
            return {"success": False, "error": "Attendance record not found"}
        
        if not attendance.requires_approval:
            return {"success": False, "error": "Attendance does not require approval"}
        
        # Update attendance
        attendance.requires_approval = False
        attendance.approved_by = approved_by
        attendance.approved_at = datetime.utcnow()
        attendance.approval_notes = notes
        
        # Update status to approved version
        if attendance.status == "late":
            attendance.status = "present_late"
        elif attendance.status == "remote_unverified":
            attendance.status = "remote_approved"
        elif attendance.status == "identity_unverified":
            attendance.status = "present_approved"
        
        self.db.commit()
        
        # Notify employee
        employee = self.db.query(models.Employee).filter(models.Employee.id == attendance.employee_id).first()
        if employee and employee.user:
            await self.notification_service.create_notification(
                user_id=employee.user.id,
                title="Attendance Approved",
                message=f"Your attendance for {attendance.date} has been approved",
                type="attendance_approved"
            )
        
        return {
            "success": True,
            "message": "Attendance approved successfully",
            "new_status": attendance.status
        }
    
    async def _perform_pre_checks(self, employee_id: int) -> Dict[str, Any]:
        """
        Perform all pre-checks before attendance marking
        
        Checks:
        1. Employee exists and is active
        2. Attendance not already marked today
        3. WFH approval status for today
        4. Assigned shift identification
        """
        
        logger.info(f"Performing pre-checks for employee {employee_id}")
        
        # Check 1: Employee exists and is active
        employee = self.db.query(models.Employee).filter(
            models.Employee.id == employee_id
        ).first()
        
        if not employee:
            return {
                "success": False,
                "error": "employee_not_found",
                "message": "Employee profile not found",
                "details": {"employee_id": employee_id}
            }
        
        if not employee.user or not employee.user.is_active:
            return {
                "success": False,
                "error": "employee_inactive",
                "message": "Employee account is inactive",
                "details": {"employee_id": employee_id}
            }
        
        # Check 2: Attendance not already marked today
        today = date.today()
        existing_attendance = self.db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee_id,
            models.Attendance.date >= datetime.combine(today, time.min),
            models.Attendance.date < datetime.combine(today, time.max)
        ).first()
        
        if existing_attendance:
            return {
                "success": False,
                "error": "already_marked",
                "message": "Attendance already marked for today",
                "details": {
                    "existing_attendance": {
                        "id": existing_attendance.id,
                        "check_in": existing_attendance.check_in.isoformat() if existing_attendance.check_in else None,
                        "status": existing_attendance.status,
                        "work_mode": existing_attendance.work_mode
                    }
                }
            }
        
        # Check 3: WFH approval status
        wfh_request = self.db.query(models.WFHRequest).filter(
            models.WFHRequest.employee_id == employee_id,
            models.WFHRequest.request_date == today,
            models.WFHRequest.status == "approved"
        ).first()
        
        # Check 4: Assigned shift identification
        assigned_shift = self._get_employee_shift(employee)
        
        logger.info(f"Pre-checks completed successfully for employee {employee_id}")
        
        return {
            "success": True,
            "employee": employee,
            "wfh_request": wfh_request,
            "assigned_shift": assigned_shift,
            "details": {
                "has_wfh_approval": wfh_request is not None,
                "work_mode": "wfh" if wfh_request else "office",
                "shift_name": assigned_shift.name if assigned_shift else "Default"
            }
        }
    
    async def _perform_verification(
        self, 
        employee: models.Employee, 
        photo_base64: Optional[str],
        latitude: Optional[float],
        longitude: Optional[float],
        use_face_recognition: bool
    ) -> Dict[str, Any]:
        """
        Perform verification steps
        
        Verifications:
        1. Camera permission and photo capture
        2. Face recognition with confidence score
        3. GPS validation (office mode only)
        4. Fraud detection checks
        """
        
        logger.info(f"Performing verification for employee {employee.id}")
        
        verification_data = {
            "photo_captured": False,
            "face_recognition_used": False,
            "face_match_confidence": 0.0,
            "gps_validated": False,
            "location_distance": None,
            "fraud_indicators": []
        }
        
        # Verification 1: Photo capture
        if not photo_base64:
            return {
                "success": False,
                "error": "photo_required",
                "message": "Photo is required for attendance verification",
                "details": {"verification_step": "photo_capture"}
            }
        
        verification_data["photo_captured"] = True
        
        # Verification 2: Face recognition
        if use_face_recognition:
            face_result = await self._verify_face_recognition(employee, photo_base64)
            if not face_result["success"]:
                return face_result
            
            verification_data["face_recognition_used"] = True
            verification_data["face_match_confidence"] = face_result["confidence"]
        
        # Verification 3: GPS validation (office mode only)
        wfh_request = self.db.query(models.WFHRequest).filter(
            models.WFHRequest.employee_id == employee.id,
            models.WFHRequest.request_date == date.today(),
            models.WFHRequest.status == "approved"
        ).first()
        
        work_mode = "wfh" if wfh_request else "office"
        
        if work_mode == "office":
            gps_result = self._validate_gps_location(latitude, longitude)
            if not gps_result["success"]:
                return gps_result
            
            verification_data["gps_validated"] = True
            verification_data["location_distance"] = gps_result["distance"]
        
        # Verification 4: Comprehensive security validation
        security_validation = self.security_service.validate_attendance_security(
            employee.id, photo_base64, latitude, longitude, 
            verification_data.get("location_distance", 50.0)
        )
        
        verification_data["security_validation"] = security_validation
        verification_data["fraud_indicators"] = security_validation.get("warnings", [])
        
        # Block if critical security issues
        if not security_validation["security_passed"]:
            return {
                "success": False,
                "error": "security_validation_failed",
                "message": "Security validation failed: " + ", ".join(security_validation["critical_issues"]),
                "details": security_validation
            }
        
        logger.info(f"Verification completed for employee {employee.id}")
        
        return {
            "success": True,
            "verification_data": verification_data,
            "details": {
                "work_mode": work_mode,
                "face_confidence": verification_data["face_match_confidence"],
                "location_distance": verification_data["location_distance"],
                "fraud_score": len(fraud_indicators)
            }
        }
    
    async def _verify_face_recognition(
        self, 
        employee: models.Employee, 
        photo_base64: str
    ) -> Dict[str, Any]:
        """Verify face recognition with confidence scoring"""
        
        try:
            # Load profile image
            profile_image = face_recognition_utils.load_profile_image(employee.id)
            
            if not profile_image:
                return {
                    "success": False,
                    "error": "profile_image_missing",
                    "message": "Profile image not found. Please upload your profile image first",
                    "details": {"employee_id": employee.id}
                }
            
            # Compare faces
            result = face_recognition_utils.compare_faces(
                profile_image, 
                photo_base64,
                tolerance=0.6
            )
            
            if not result["match"]:
                return {
                    "success": False,
                    "error": "face_mismatch",
                    "message": "Face does not match profile image",
                    "details": {
                        "confidence": result["confidence"],
                        "threshold": 60.0,
                        "employee_id": employee.id
                    }
                }
            
            return {
                "success": True,
                "confidence": result["confidence"],
                "details": {"face_match": True, "confidence": result["confidence"]}
            }
            
        except Exception as e:
            logger.error(f"Face recognition error for employee {employee.id}: {e}")
            return {
                "success": False,
                "error": "face_recognition_failed",
                "message": f"Face recognition failed: {str(e)}",
                "details": {"exception": str(e)}
            }
    
    def _validate_gps_location(
        self, 
        latitude: Optional[float], 
        longitude: Optional[float]
    ) -> Dict[str, Any]:
        """Validate GPS location for office attendance"""
        
        if not latitude or not longitude:
            return {
                "success": False,
                "error": "location_required",
                "message": "GPS location is required for office attendance",
                "details": {"required_for": "office_mode"}
            }
        
        # Calculate distance from office
        distance = self._haversine_distance(
            latitude, longitude, 
            self.OFFICE_COORDS["lat"], self.OFFICE_COORDS["lon"]
        )
        
        if distance > self.MAX_DISTANCE:
            return {
                "success": False,
                "error": "location_too_far",
                "message": f"You are {int(distance)}m away from office. Must be within {self.MAX_DISTANCE}m of {self.OFFICE_COORDS['name']}",
                "details": {
                    "distance": distance,
                    "max_allowed": self.MAX_DISTANCE,
                    "office_location": self.OFFICE_COORDS["name"]
                }
            }
        
        return {
            "success": True,
            "distance": distance,
            "details": {"within_range": True, "distance_meters": distance}
        }
    
    def _detect_fraud_indicators(
        self, 
        employee: models.Employee,
        photo_base64: str,
        latitude: Optional[float],
        longitude: Optional[float],
        verification_data: Dict[str, Any]
    ) -> list:
        """Detect potential fraud indicators"""
        
        fraud_indicators = []
        
        # Check 1: Low face recognition confidence
        if verification_data.get("face_match_confidence", 0) < 70:
            fraud_indicators.append({
                "type": "low_face_confidence",
                "severity": "medium",
                "details": f"Face confidence {verification_data.get('face_match_confidence', 0)}% below threshold"
            })
        
        # Check 2: Unusual location pattern
        recent_attendance = self.db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee.id,
            models.Attendance.date >= datetime.now() - timedelta(days=7)
        ).all()
        
        if latitude and longitude and recent_attendance:
            # Check for significant location changes
            for att in recent_attendance[-3:]:  # Last 3 records
                if att.latitude and att.longitude:
                    distance = self._haversine_distance(
                        latitude, longitude, att.latitude, att.longitude
                    )
                    if distance > 1000:  # More than 1km difference
                        fraud_indicators.append({
                            "type": "location_anomaly",
                            "severity": "low",
                            "details": f"Location differs by {int(distance)}m from recent attendance"
                        })
                        break
        
        # Check 3: Rapid successive attempts
        recent_attempts = self.db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee.id,
            models.Attendance.date >= datetime.now() - timedelta(minutes=5)
        ).count()
        
        if recent_attempts > 0:
            fraud_indicators.append({
                "type": "rapid_attempts",
                "severity": "high",
                "details": f"Multiple attendance attempts within 5 minutes"
            })
        
        # Check 4: Weekend/Holiday attendance without approval
        today = date.today()
        if today.weekday() >= 5:  # Saturday or Sunday
            # Check if there's a special work approval
            special_approval = self.db.query(models.WFHRequest).filter(
                models.WFHRequest.employee_id == employee.id,
                models.WFHRequest.request_date == today,
                models.WFHRequest.status == "approved"
            ).first()
            
            if not special_approval:
                fraud_indicators.append({
                    "type": "weekend_attendance",
                    "severity": "medium",
                    "details": "Attendance on weekend without special approval"
                })
        
        return fraud_indicators
    
    async def _perform_validation(
        self,
        employee: models.Employee,
        assigned_shift: Optional[models.Shift],
        wfh_request: Optional[models.WFHRequest],
        latitude: Optional[float],
        longitude: Optional[float]
    ) -> Dict[str, Any]:
        """
        Perform validation checks
        
        Validations:
        1. Check-in time vs shift window
        2. Late attendance flagging
        3. Work mode validation
        4. Special circumstances
        """
        
        logger.info(f"Performing validation for employee {employee.id}")
        
        validation_data = {
            "within_time_window": False,
            "requires_approval": False,
            "attendance_status": "present",
            "work_mode": "wfh" if wfh_request else "office",
            "late_minutes": 0,
            "shift_window": None
        }
        
        # Validation 1: Time window check
        current_time = datetime.now().time()
        
        if assigned_shift:
            shift_config = self.SHIFT_WINDOWS.get(assigned_shift.name, {
                "start": time(9, 0), "end": time(11, 0), "grace": 15
            })
            
            validation_data["shift_window"] = {
                "start": shift_config["start"].strftime("%H:%M"),
                "end": shift_config["end"].strftime("%H:%M"),
                "grace_minutes": shift_config["grace"]
            }
            
            # Check if within main window
            if shift_config["start"] <= current_time <= shift_config["end"]:
                validation_data["within_time_window"] = True
            else:
                # Check grace period
                grace_end = (datetime.combine(date.today(), shift_config["end"]) + 
                           timedelta(minutes=shift_config["grace"])).time()
                
                if current_time <= grace_end:
                    validation_data["within_time_window"] = True
                    validation_data["late_minutes"] = self._calculate_late_minutes(
                        current_time, shift_config["end"]
                    )
                else:
                    validation_data["requires_approval"] = True
                    validation_data["attendance_status"] = "late"
                    validation_data["late_minutes"] = self._calculate_late_minutes(
                        current_time, shift_config["end"]
                    )
        else:
            # Default time window (9 AM - 11 AM)
            default_start = time(9, 0)
            default_end = time(11, 0)
            
            if default_start <= current_time <= default_end:
                validation_data["within_time_window"] = True
            else:
                validation_data["requires_approval"] = True
                validation_data["attendance_status"] = "late"
                validation_data["late_minutes"] = self._calculate_late_minutes(
                    current_time, default_end
                )
        
        # Validation 2: Work mode validation
        if validation_data["work_mode"] == "office":
            if not latitude or not longitude:
                return {
                    "success": False,
                    "error": "location_required_office",
                    "message": "GPS location is required for office attendance",
                    "details": {"work_mode": "office"}
                }
        
        logger.info(f"Validation completed for employee {employee.id}")
        
        return {
            "success": True,
            "validation_data": validation_data,
            "details": {
                "status": validation_data["attendance_status"],
                "requires_approval": validation_data["requires_approval"],
                "late_minutes": validation_data["late_minutes"]
            }
        }
    
    async def _create_attendance_record(
        self,
        employee: models.Employee,
        wfh_request: Optional[models.WFHRequest],
        assigned_shift: Optional[models.Shift],
        photo_base64: Optional[str],
        latitude: Optional[float],
        longitude: Optional[float],
        verification_data: Dict[str, Any],
        validation_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create the final attendance record with all data"""
        
        logger.info(f"Creating attendance record for employee {employee.id}")
        
        try:
            # Save photo
            photo_url = None
            if photo_base64:
                photo_url = self._save_attendance_photo(photo_base64, employee.id)
            
            # Determine location address
            if validation_data["work_mode"] == "wfh":
                location_address = "Work From Home"
            else:
                location_address = self.OFFICE_COORDS["address"]
            
            # Create attendance record
            attendance = models.Attendance(
                employee_id=employee.id,
                date=datetime.utcnow(),
                status=validation_data["attendance_status"],
                check_in=datetime.utcnow(),
                latitude=latitude,
                longitude=longitude,
                photo_url=photo_url,
                location_address=location_address,
                verification_method="face_recognition" if verification_data["face_recognition_used"] else "photo",
                is_fraud_suspected=len(verification_data["fraud_indicators"]) > 0,
                work_mode=validation_data["work_mode"],
                wfh_request_id=wfh_request.id if wfh_request else None,
                requires_approval=validation_data["requires_approval"],
                approval_status="auto_approved" if not validation_data["requires_approval"] else "pending",
                shift_id=assigned_shift.id if assigned_shift else None,
                face_match_confidence=verification_data.get("face_match_confidence"),
                flagged_reason="; ".join([f["details"] for f in verification_data["fraud_indicators"]]) if verification_data["fraud_indicators"] else None
            )
            
            self.db.add(attendance)
            self.db.commit()
            self.db.refresh(attendance)
            
            # Send notifications if required
            if validation_data["requires_approval"]:
                await self.notification_service.notify_late_attendance_flagged(attendance.id)
            
            # Send fraud alert if indicators detected
            if verification_data["fraud_indicators"]:
                await self._send_fraud_alert(attendance, verification_data["fraud_indicators"])
            
            logger.info(f"Attendance record created successfully for employee {employee.id}")
            
            return {
                "success": True,
                "attendance": {
                    "id": attendance.id,
                    "date": attendance.date.isoformat(),
                    "check_in": attendance.check_in.isoformat(),
                    "status": attendance.status,
                    "work_mode": attendance.work_mode,
                    "location_address": attendance.location_address,
                    "requires_approval": attendance.requires_approval,
                    "face_confidence": attendance.face_match_confidence,
                    "verification_method": attendance.verification_method
                },
                "verification_data": verification_data,
                "validation_data": validation_data,
                "message": "Attendance marked successfully"
            }
            
        except Exception as e:
            logger.error(f"Error creating attendance record for employee {employee.id}: {e}")
            self.db.rollback()
            return {
                "success": False,
                "error": "record_creation_failed",
                "message": f"Failed to create attendance record: {str(e)}",
                "details": {"exception": str(e)}
            }
    
    # ============================================
    # HELPER METHODS
    # ============================================
    
    def _get_employee_shift(self, employee: models.Employee) -> Optional[models.Shift]:
        """Get employee's assigned shift (default to Morning Shift)"""
        # In a real system, this would check employee's assigned shift
        # For now, return Morning Shift as default
        return self.db.query(models.Shift).filter(
            models.Shift.name == "Morning Shift"
        ).first()
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two GPS coordinates in meters"""
        R = 6371e3  # Earth radius in meters
        phi1 = lat1 * math.pi / 180
        phi2 = lat2 * math.pi / 180
        delta_phi = (lat2 - lat1) * math.pi / 180
        delta_lambda = (lon2 - lon1) * math.pi / 180
        
        a = math.sin(delta_phi/2) * math.sin(delta_phi/2) + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda/2) * math.sin(delta_lambda/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    def _calculate_late_minutes(self, current_time: time, expected_time: time) -> int:
        """Calculate how many minutes late the employee is"""
        current_dt = datetime.combine(date.today(), current_time)
        expected_dt = datetime.combine(date.today(), expected_time)
        
        if current_dt > expected_dt:
            return int((current_dt - expected_dt).total_seconds() / 60)
        return 0
    
    def _save_attendance_photo(self, photo_base64: str, employee_id: int) -> Optional[str]:
        """Save base64 photo to file system"""
        try:
            upload_dir = "uploads/attendance_photos"
            os.makedirs(upload_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"emp_{employee_id}_{timestamp}.jpg"
            filepath = os.path.join(upload_dir, filename)
            
            photo_data = base64.b64decode(
                photo_base64.split(',')[1] if ',' in photo_base64 else photo_base64
            )
            with open(filepath, 'wb') as f:
                f.write(photo_data)
            
            return filepath
        except Exception as e:
            logger.error(f"Error saving photo for employee {employee_id}: {e}")
            return None
    
    async def _send_fraud_alert(self, attendance: models.Attendance, fraud_indicators: list):
        """Send fraud alert to HR/Admin"""
        
        # Get HR and Admin users
        hr_users = self.db.query(models.User).filter(
            models.User.role.in_(['hr', 'admin']),
            models.User.is_active == True
        ).all()
        
        employee = attendance.employee
        
        for hr_user in hr_users:
            subject = f"🚨 Fraud Alert - {employee.first_name} {employee.last_name}"
            
            indicators_text = "\n".join([
                f"• {indicator['type'].replace('_', ' ').title()}: {indicator['details']}"
                for indicator in fraud_indicators
            ])
            
            message = f"""
FRAUD ALERT: Suspicious attendance activity detected

Employee: {employee.first_name} {employee.last_name}
Department: {employee.department or 'N/A'}
Date: {attendance.date.strftime('%B %d, %Y at %I:%M %p')}
Work Mode: {attendance.work_mode.upper()}

Fraud Indicators:
{indicators_text}

Please review this attendance record immediately:
https://yourapp.com/dashboard/attendance

Attendance ID: {attendance.id}
            """.strip()
            
            await self.notification_service.send_email(
                to_email=hr_user.email,
                subject=subject,
                body=message
            )
            
            # Create urgent in-app notification
            await self.notification_service.create_in_app_notification(
                user_id=hr_user.id,
                title="🚨 Fraud Alert",
                message=f"Suspicious attendance from {employee.first_name} {employee.last_name}",
                type="error",
                action_url="/dashboard/attendance",
                notification_data={
                    "attendance_id": attendance.id,
                    "employee_name": f"{employee.first_name} {employee.last_name}",
                    "fraud_indicators": fraud_indicators,
                    "severity": "high"
                }
            )

# ============================================
# SERVICE FACTORY
# ============================================

def get_attendance_service(db: Session) -> AttendanceService:
    """Get attendance service instance"""
    return AttendanceService(db)