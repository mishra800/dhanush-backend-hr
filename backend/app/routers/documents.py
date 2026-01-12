from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
from ..database import get_db
from .. import models, schemas
from ..role_utils import require_role
from ..dependencies import get_current_user
import random
from fastapi.responses import FileResponse

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

# Document types configuration
DOCUMENT_TYPES = [
    "Identity Documents",
    "Educational Certificates", 
    "Employment Documents",
    "Banking Documents",
    "Personal Documents",
    "Contracts",
    "Policies",
    "Tax Forms",
    "Benefits",
    "Training Materials",
    "General"
]

@router.get("/types")
def get_document_types():
    """Get available document types"""
    return {"document_types": DOCUMENT_TYPES}

@router.post("/upload", response_model=schemas.EmployeeDocumentOut)
def upload_document(
    file: UploadFile = File(...),
    document_type: str = "General",
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload a new document"""
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")

    # Validate document type
    if document_type not in DOCUMENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid document type. Must be one of: {DOCUMENT_TYPES}")

    # Create upload directory
    upload_dir = "uploads/documents"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{employee.id}_{timestamp}_{document_type.replace(' ', '_')}{file_extension}"
    file_location = f"{upload_dir}/{unique_filename}"
    
    # Save file
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Mock AI OCR Verification (replace with real OCR service)
    ocr_confidence = round(random.uniform(60.0, 99.9), 1)
    is_verified = ocr_confidence >= 75.0
    rejection_reason = None
    
    if not is_verified:
        rejection_reason = "Low OCR confidence. Please ensure the document is clear and well-lit."
    
    # Create document record
    document = models.EmployeeDocument(
        employee_id=employee.id,
        document_type=document_type,
        document_url=file_location,
        is_verified=is_verified,
        ocr_confidence=ocr_confidence,
        rejection_reason=rejection_reason
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document

@router.get("/", response_model=List[schemas.EmployeeDocumentOut])
def get_my_documents(
    document_type: Optional[str] = None,
    verified_only: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get current user's documents with optional filters"""
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        return []
    
    query = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.employee_id == employee.id)
    
    if document_type:
        query = query.filter(models.EmployeeDocument.document_type == document_type)
    
    if verified_only is not None:
        query = query.filter(models.EmployeeDocument.is_verified == verified_only)
    
    return query.order_by(models.EmployeeDocument.uploaded_at.desc()).all()

@router.get("/all", response_model=List[dict])
def get_all_documents(
    employee_id: Optional[int] = None,
    document_type: Optional[str] = None,
    verification_status: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "hr"]))
):
    """Get all documents (Admin/HR only) with filters"""
    query = db.query(models.EmployeeDocument).join(models.Employee)
    
    if employee_id:
        query = query.filter(models.EmployeeDocument.employee_id == employee_id)
    
    if document_type:
        query = query.filter(models.EmployeeDocument.document_type == document_type)
    
    if verification_status is not None:
        query = query.filter(models.EmployeeDocument.is_verified == verification_status)
    
    documents = query.order_by(models.EmployeeDocument.uploaded_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "document_id": doc.id,
            "employee_name": f"{doc.employee.first_name} {doc.employee.last_name}",
            "employee_id": doc.employee_id,
            "document_type": doc.document_type,
            "document_url": doc.document_url,
            "is_verified": doc.is_verified,
            "ocr_confidence": doc.ocr_confidence,
            "uploaded_at": doc.uploaded_at.isoformat(),
            "rejection_reason": doc.rejection_reason,
            "verified_by": doc.verified_by,
            "verified_at": doc.verified_at.isoformat() if doc.verified_at else None
        }
        for doc in documents
    ]

@router.get("/{document_id}")
def get_document_details(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get specific document details"""
    document = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check access permissions
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if employee and document.employee_id != employee.id and current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return {
        "document_id": document.id,
        "employee_name": f"{document.employee.first_name} {document.employee.last_name}",
        "employee_id": document.employee_id,
        "document_type": document.document_type,
        "document_url": document.document_url,
        "is_verified": document.is_verified,
        "ocr_confidence": document.ocr_confidence,
        "uploaded_at": document.uploaded_at.isoformat(),
        "rejection_reason": document.rejection_reason,
        "verified_by": document.verified_by,
        "verified_at": document.verified_at.isoformat() if document.verified_at else None
    }

@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Download a document file"""
    document = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check access permissions
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if employee and document.employee_id != employee.id and current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Check if file exists
    if not os.path.exists(document.document_url):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    filename = os.path.basename(document.document_url)
    return FileResponse(
        path=document.document_url,
        filename=filename,
        media_type='application/octet-stream'
    )

@router.put("/{document_id}/verify")
def verify_document(
    document_id: int,
    verification_status: bool,
    rejection_reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "hr"]))
):
    """Manually verify or reject a document (Admin/HR only)"""
    document = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.is_verified = verification_status
    if not verification_status and rejection_reason:
        document.rejection_reason = rejection_reason
    else:
        document.rejection_reason = None
    
    document.verified_by = current_user.id
    document.verified_at = datetime.utcnow()
    
    db.commit()
    db.refresh(document)
    
    return {
        "message": f"Document {'verified' if verification_status else 'rejected'} successfully",
        "document": schemas.EmployeeDocumentOut.model_validate(document)
    }

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a document"""
    document = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check permissions - only owner or admin/hr can delete
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if employee and document.employee_id != employee.id and current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete file from filesystem
    try:
        if os.path.exists(document.document_url):
            os.remove(document.document_url)
    except Exception as e:
        print(f"Warning: Could not delete file {document.document_url}: {e}")
    
    # Delete database record
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.get("/pending-verification/count")
def get_pending_verification_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "hr"]))
):
    """Get count of documents pending verification"""
    count = db.query(models.EmployeeDocument).filter(
        models.EmployeeDocument.is_verified == False,
        models.EmployeeDocument.ocr_confidence < 75.0
    ).count()
    
    return {"pending_count": count}

@router.get("/statistics")
def get_document_statistics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["admin", "hr"]))
):
    """Get document statistics for admin dashboard"""
    total_documents = db.query(models.EmployeeDocument).count()
    verified_documents = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.is_verified == True).count()
    pending_documents = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.is_verified == False).count()
    
    # Documents by type
    type_stats = {}
    for doc_type in DOCUMENT_TYPES:
        count = db.query(models.EmployeeDocument).filter(models.EmployeeDocument.document_type == doc_type).count()
        if count > 0:
            type_stats[doc_type] = count
    
    return {
        "total_documents": total_documents,
        "verified_documents": verified_documents,
        "pending_documents": pending_documents,
        "verification_rate": round((verified_documents / total_documents * 100), 2) if total_documents > 0 else 0,
        "documents_by_type": type_stats
    }