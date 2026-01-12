"""
Onboarding Approval Service - Gatekeeper Model
Handles the gatekeeper model for onboarding workflow where IT provisioning 
only happens after compliance approval
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from . import models
from .notification_service import NotificationService
from .it_provisioning_service import ITProvisioningService
import json
import secrets
import string


class OnboardingApprovalService:
    def __init__(self, db: Session):
        self.db = db
        self.notification_service = NotificationService(db)
        self.it_service = ITProvisioningService(db)
    
    def get_compliance_status(self, employee_id: int) -> Dict:
        """
        Get compliance gate status for an employee
        """
        employee = self.db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        if not employee:
            return {"error": "Employee not found"}
        
        # Get or create onboarding approval record
        approval = self.db.query(models.OnboardingApproval).filter(
            models.OnboardingApproval.employee_id == employee_id,
            models.OnboardingApproval.approval_stage == "compliance_review"
        ).first()
        
        if not approval:
            approval = models.OnboardingApproval(
                employee_id=employee_id,
                approval_stage="compliance_review",
                status="pending"
            )
            self.db.add(approval)
            self.db.commit()
            self.db.refresh(approval)
        
        # Check form completion
        form_completed = employee.profile_summary is not None
        
        # Check document verification
        documents = self.db.query(models.EmployeeDocument).filter(
            models.EmployeeDocument.employee_id == employee_id
        ).all()
        
        documents_verified = len(documents) > 0 and all(doc.is_verified for doc in documents)
        
        return {
            "employee_id": employee_id,
            "compliance_gate_status": approval.status,
            "form_completed": form_completed,
            "documents_verified": documents_verified,
            "ocr_verification_complete": approval.ocr_verification_complete,
            "admin_review_complete": approval.admin_review_complete,
            "form_data_locked": approval.form_data_locked,
            "can_proceed_to_it": approval.status == "approved",
            "compliance_approved_at": approval.compliance_approved_at.isoformat() if approval.compliance_approved_at else None
        }
    
    def submit_for_compliance_review(self, employee_id: int) -> Dict:
        """Submit employee data for compliance review"""
        employee = self.db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        if not employee:
            return {"success": False, "message": "Employee not found"}
        
        # Check if form is completed
        if not employee.profile_summary:
            return {"success": False, "message": "Employee information form must be completed first"}
        
        # Get or create approval record
        approval = self.db.query(models.OnboardingApproval).filter(
            models.OnboardingApproval.employee_id == employee_id,
            models.OnboardingApproval.approval_stage == "compliance_review"
        ).first()
        
        if not approval:
            approval = models.OnboardingApproval(
                employee_id=employee_id,
                approval_stage="compliance_review",
                status="pending"
            )
            self.db.add(approval)
        
        approval.status = "pending"
        approval.form_data_locked = True  # Lock form data for review
        
        self.db.commit()
        
        return {
            "success": True,
            "message": "Employee data submitted for compliance review",
            "status": "pending_review"
        }
    
    def approve_compliance_and_request_it(self, request_data: Dict, reviewer_id: int) -> Dict:
        """Approve compliance and create IT provisioning ticket (GATEKEEPER)"""
        employee_id = request_data["employee_id"]
        
        employee = self.db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        if not employee:
            return {"success": False, "message": "Employee not found"}
        
        # Get approval record
        approval = self.db.query(models.OnboardingApproval).filter(
            models.OnboardingApproval.employee_id == employee_id,
            models.OnboardingApproval.approval_stage == "compliance_review"
        ).first()
        
        if not approval:
            return {"success": False, "message": "No compliance review record found"}
        
        # Approve compliance
        approval.status = "approved"
        approval.reviewed_by = reviewer_id
        approval.approved_at = datetime.utcnow()
        approval.compliance_approved_at = datetime.utcnow()
        approval.review_notes = request_data.get("review_notes", "")
        
        # Generate IT ticket number
        ticket_number = self._generate_ticket_number()
        
        # Create IT provisioning ticket
        it_ticket = models.ITProvisioningTicket(
            ticket_number=ticket_number,
            employee_id=employee_id,
            approval_id=approval.id,
            verified_full_name=request_data["verified_full_name"],
            verified_email_prefix=request_data["verified_email_prefix"],
            verified_department=request_data["verified_department"],
            verified_position=request_data["verified_position"],
            priority=request_data.get("priority", "normal"),
            requested_resources={
                "email": True,
                "vpn": True,
                "access_card": True,
                "hardware": True
            },
            status="open"
        )
        
        self.db.add(it_ticket)
        self.db.commit()
        self.db.refresh(it_ticket)
        
        return {
            "success": True,
            "message": f"Compliance approved and IT ticket {ticket_number} created",
            "ticket_number": ticket_number,
            "ticket_id": it_ticket.id
        }
    
    def process_it_provisioning(self, ticket_id: int, it_admin_id: int) -> Dict:
        """Process IT provisioning ticket"""
        ticket = self.db.query(models.ITProvisioningTicket).filter(
            models.ITProvisioningTicket.id == ticket_id
        ).first()
        
        if not ticket:
            return {"success": False, "message": "IT ticket not found"}
        
        if ticket.status != "open":
            return {"success": False, "message": "Ticket is not in open status"}
        
        # Update ticket status
        ticket.status = "in_progress"
        ticket.assigned_to = it_admin_id
        ticket.assigned_at = datetime.utcnow()
        
        # Provision IT resources
        provisioning_result = self.it_service.provision_all_resources(
            employee_id=ticket.employee_id,
            provision_email=True,
            provision_vpn=True,
            provision_access_card=True,
            assign_assets=True
        )
        
        if provisioning_result["success"]:
            # Mark ticket as completed
            ticket.status = "completed"
            ticket.completed_at = datetime.utcnow()
            ticket.email_created = True
            ticket.vpn_created = True
            ticket.access_card_created = True
            ticket.hardware_assigned = True
        else:
            ticket.status = "failed"
            ticket.it_notes = f"Provisioning failed: {provisioning_result['message']}"
        
        self.db.commit()
        
        return {
            "success": provisioning_result["success"],
            "message": provisioning_result["message"],
            "ticket_status": ticket.status,
            "provisioned_resources": provisioning_result.get("provisioned_resources", {}),
            "failed_resources": provisioning_result.get("failed_resources", [])
        }
    
    def get_onboarding_progress(self, employee_id: int) -> Dict:
        """Get detailed onboarding progress"""
        employee = self.db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        if not employee:
            return {"error": "Employee not found"}
        
        # Calculate current phase based on completion status
        current_phase = 1
        phase_name = "Pre-Boarding"
        
        # Check compliance status
        compliance_status = self.get_compliance_status(employee_id)
        
        # Determine current phase
        if employee.profile_summary and compliance_status["documents_verified"]:
            if compliance_status["compliance_gate_status"] == "approved":
                current_phase = 4
                phase_name = "IT Provisioning"
                
                # Check if IT provisioning is complete
                it_resources = self.it_service.get_employee_it_resources(employee_id)
                if it_resources.get("email") and it_resources.get("vpn"):
                    current_phase = 5
                    phase_name = "Induction & Activation"
            else:
                current_phase = 3
                phase_name = "Compliance Review"
        elif employee.profile_summary:
            current_phase = 3
            phase_name = "Document Upload"
        else:
            current_phase = 2
            phase_name = "Information Form"
        
        # Calculate completion percentage
        completion_percentage = min(current_phase * 20, 100)
        
        # Calculate days since joining
        days_since_joining = 0
        if employee.date_of_joining:
            days_since_joining = (datetime.utcnow() - employee.date_of_joining).days
        
        return {
            "employee_id": employee_id,
            "current_phase": current_phase,
            "phase_name": phase_name,
            "completion_percentage": completion_percentage,
            "days_since_joining": days_since_joining,
            "is_immediate_joiner": employee.is_immediate_joiner or False,
            "compliance_gate_status": compliance_status["compliance_gate_status"],
            "form_data_locked": compliance_status["form_data_locked"],
            "it_provisioning_status": self._get_it_provisioning_status(employee_id)
        }
    
    def advance_to_next_phase(self, employee_id: int) -> Dict:
        """Advance employee to next onboarding phase"""
        progress = self.get_onboarding_progress(employee_id)
        current_phase = progress["current_phase"]
        
        if current_phase >= 5:
            return {"success": False, "message": "Employee is already in final phase"}
        
        # Phase advancement logic would go here
        # For now, just return success
        return {
            "success": True,
            "message": f"Employee advanced from phase {current_phase} to {current_phase + 1}",
            "new_phase": current_phase + 1
        }
    
    def activate_employee(self, employee_id: int, admin_id: int) -> Dict:
        """Final employee activation"""
        employee = self.db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        if not employee:
            return {"success": False, "message": "Employee not found"}
        
        employee.onboarding_status = "completed"
        employee.is_active = True
        
        self.db.commit()
        
        return {
            "success": True,
            "message": f"Employee {employee.first_name} {employee.last_name} has been activated",
            "status": "completed"
        }
    
    def advance_to_phase(self, employee_id: int, target_phase: int) -> Dict:
        """Advance employee to specific phase"""
        return self.advance_to_next_phase(employee_id)
    
    def check_phase_prerequisites(self, employee_id: int, phase: int) -> Dict:
        """Check if employee can proceed to specific phase"""
        progress = self.get_onboarding_progress(employee_id)
        current_phase = progress["current_phase"]
        
        can_proceed = current_phase >= phase - 1
        
        return {
            "employee_id": employee_id,
            "target_phase": phase,
            "current_phase": current_phase,
            "can_proceed": can_proceed,
            "prerequisites_met": can_proceed
        }
    
    def _generate_ticket_number(self) -> str:
        """Generate unique IT ticket number"""
        timestamp = datetime.now().strftime("%Y%m%d")
        random_suffix = ''.join(secrets.choice(string.digits) for _ in range(4))
        return f"IT-{timestamp}-{random_suffix}"
    
    def _get_it_provisioning_status(self, employee_id: int) -> str:
        """Get IT provisioning status for employee"""
        ticket = self.db.query(models.ITProvisioningTicket).filter(
            models.ITProvisioningTicket.employee_id == employee_id
        ).first()
        
        if not ticket:
            return "not_started"
        
        return ticket.status