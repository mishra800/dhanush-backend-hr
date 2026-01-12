from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from app import database, models, schemas
from app.dependencies import get_current_user
from datetime import datetime, timedelta
import shutil
import os
import uuid
import random

router = APIRouter(
    prefix="/engagement",
    tags=["engagement"]
)

# ============================================
# SURVEY ENDPOINTS
# ============================================

@router.get("/surveys", response_model=List[schemas.SurveyOut])
def get_surveys(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all active surveys"""
    try:
        surveys = db.query(models.Survey).filter(models.Survey.status == "active").all()
        return surveys
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching surveys: {str(e)}")

@router.post("/surveys", response_model=schemas.SurveyOut)
def create_survey(
    survey: schemas.SurveyCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new survey - Admin/HR only"""
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Only Admin and HR can create surveys")
    
    try:
        db_survey = models.Survey(**survey.dict())
        db.add(db_survey)
        db.commit()
        db.refresh(db_survey)
        return db_survey
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating survey: {str(e)}")

@router.post("/surveys/{survey_id}/respond", response_model=schemas.SurveyResponseOut)
def respond_to_survey(
    survey_id: int, 
    response: schemas.SurveyResponseCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit survey response"""
    try:
        # Get employee ID
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        # Check if survey exists
        survey = db.query(models.Survey).filter(models.Survey.id == survey_id).first()
        if not survey:
            raise HTTPException(status_code=404, detail="Survey not found")
        
        # Check if already responded
        existing_response = db.query(models.SurveyResponse).filter(
            models.SurveyResponse.survey_id == survey_id,
            models.SurveyResponse.employee_id == employee.id
        ).first()
        
        if existing_response:
            raise HTTPException(status_code=400, detail="You have already responded to this survey")
        
        db_response = models.SurveyResponse(
            **response.dict(),
            survey_id=survey_id,
            employee_id=employee.id
        )
        db.add(db_response)
        db.commit()
        db.refresh(db_response)
        return db_response
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting response: {str(e)}")

# ============================================
# SENTIMENT ANALYSIS
# ============================================

@router.post("/analyze-advanced-sentiment")
def analyze_advanced_sentiment(
    data: schemas.EngagementAnalysisRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Advanced sentiment analysis with NLP"""
    try:
        text_lower = data.text.lower()
        
        positive_words = ["good", "great", "excellent", "happy", "love", "amazing", "satisfied", "enjoy", "wonderful", "fantastic", "awesome", "brilliant"]
        negative_words = ["bad", "poor", "hate", "terrible", "awful", "disappointed", "frustrated", "stressed", "overwhelmed", "horrible", "worst", "annoying"]
        stress_words = ["stress", "pressure", "overwhelm", "burnout", "exhausted", "tired", "deadline", "overwork", "anxiety"]
        
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)
        stress_count = sum(1 for w in stress_words if w in text_lower)
        
        # Enhanced sentiment calculation
        sentiment_score = pos_count - neg_count
        
        if sentiment_score >= 3:
            sentiment = "Very Positive"
            engagement = 9
            satisfaction = 9
            morale = 8.5
            stress = 2
        elif sentiment_score >= 1:
            sentiment = "Positive"
            engagement = 7.5
            satisfaction = 7.5
            morale = 7
            stress = 3
        elif sentiment_score <= -3:
            sentiment = "Very Negative"
            engagement = 2
            satisfaction = 2
            morale = 2.5
            stress = 9
        elif sentiment_score <= -1:
            sentiment = "Negative"
            engagement = 4
            satisfaction = 4
            morale = 4.5
            stress = 7
        else:
            sentiment = "Neutral"
            engagement = 6
            satisfaction = 6
            morale = 6
            stress = 5
        
        # Adjust stress based on specific keywords
        if stress_count > 0:
            stress = min(stress + (stress_count * 1.5), 10)
            engagement = max(engagement - (stress_count * 0.5), 1)
        
        # Topic detection
        topics = []
        topic_keywords = {
            "Work Environment": ["work", "environment", "office", "workspace", "culture"],
            "Team Collaboration": ["team", "colleague", "collaboration", "communication", "support"],
            "Work-Life Balance": ["balance", "hours", "overtime", "flexible", "remote"],
            "Management": ["manager", "boss", "leadership", "supervision", "feedback"],
            "Career Growth": ["promotion", "growth", "development", "learning", "opportunity"],
            "Compensation": ["salary", "pay", "bonus", "benefits", "compensation"]
        }
        
        for topic, keywords in topic_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                topics.append({"name": topic, "sentiment": sentiment})
        
        confidence = min(85 + (abs(sentiment_score) * 5), 95)
        
        return {
            "sentiment": sentiment,
            "confidence": round(confidence, 1),
            "metrics": {
                "engagement": round(engagement, 1),
                "satisfaction": round(satisfaction, 1),
                "morale": round(morale, 1),
                "stress": round(stress, 1)
            },
            "topics": topics,
            "word_analysis": {
                "positive_words": pos_count,
                "negative_words": neg_count,
                "stress_indicators": stress_count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

@router.post("/predict-attrition")
def predict_attrition(
    data: schemas.AttritionPredictionRequest,
    current_user: models.User = Depends(get_current_user)
):
    """Predict employee attrition risk using ML-like scoring"""
    try:
        risk_score = 0
        factors = []
        
        # Weighted risk factors
        if data.no_promotion_years >= 4:
            risk_score += 30
            factors.append("No promotion in 4+ years (High Risk)")
        elif data.no_promotion_years >= 2:
            risk_score += 20
            factors.append("No promotion in 2+ years")
        
        if data.below_market_salary:
            risk_score += 25
            factors.append("Below market salary")
        
        if data.engagement_score <= 3:
            risk_score += 25
            factors.append("Very low engagement score")
        elif data.engagement_score <= 5:
            risk_score += 15
            factors.append("Low engagement score")
        
        if data.job_search_activity:
            risk_score += 35
            factors.append("Active job search detected")
        
        if data.workload_hours >= 60:
            risk_score += 20
            factors.append("Excessive workload (60+ hours)")
        elif data.workload_hours >= 50:
            risk_score += 10
            factors.append("High workload (50+ hours)")
        
        # Additional factors if available
        if hasattr(data, 'team_conflicts') and data.team_conflicts:
            risk_score += 15
            factors.append("Team conflicts reported")
        
        if hasattr(data, 'satisfaction_score') and data.satisfaction_score <= 4:
            risk_score += 10
            factors.append("Low job satisfaction")
        
        risk_score = min(risk_score, 100)
        
        # Risk level classification
        if risk_score >= 75:
            risk_level = "Critical"
        elif risk_score >= 50:
            risk_level = "High"
        elif risk_score >= 25:
            risk_level = "Medium"
        else:
            risk_level = "Low"
        
        # Recommended actions based on risk level
        actions = []
        if risk_level == "Critical":
            actions = [
                "Schedule immediate retention conversation",
                "Review and adjust compensation package",
                "Discuss career advancement opportunities",
                "Consider role modification or transfer",
                "Implement immediate workload adjustments"
            ]
        elif risk_level == "High":
            actions = [
                "Conduct comprehensive stay interview",
                "Review compensation benchmarking",
                "Create personalized development plan",
                "Address workload concerns"
            ]
        elif risk_level == "Medium":
            actions = [
                "Schedule regular check-ins",
                "Monitor engagement levels",
                "Provide growth opportunities"
            ]
        else:
            actions = [
                "Continue regular performance reviews",
                "Maintain current engagement initiatives"
            ]
        
        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "factors": factors,
            "actions": actions,
            "recommendation": f"Priority: {risk_level} - Immediate action required" if risk_level in ["Critical", "High"] else f"Monitor and maintain current approach"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting attrition: {str(e)}")

# ============================================
# PULSE SURVEY
# ============================================

@router.post("/pulse-survey", response_model=schemas.PulseSurveyOut)
async def submit_pulse_survey(
    data: schemas.PulseSurveyCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit daily pulse survey"""
    try:
        # Get employee
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        # Check if already submitted today
        today = datetime.utcnow().date()
        existing_pulse = db.query(models.PulseSurvey).filter(
            models.PulseSurvey.employee_id == employee.id,
            func.date(models.PulseSurvey.submitted_at) == today
        ).first()
        
        if existing_pulse:
            raise HTTPException(status_code=400, detail="You have already submitted a pulse survey today")
        
        # Validate mood
        valid_moods = ['terrible', 'bad', 'okay', 'good', 'amazing']
        if data.mood not in valid_moods:
            raise HTTPException(status_code=400, detail=f"Invalid mood. Must be one of: {', '.join(valid_moods)}")
        
        pulse_survey = models.PulseSurvey(
            employee_id=employee.id,
            mood=data.mood,
            comment=data.comment
        )
        
        db.add(pulse_survey)
        db.commit()
        db.refresh(pulse_survey)
        
        return pulse_survey
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting pulse survey: {str(e)}")

@router.get("/pulse-survey/history", response_model=List[schemas.PulseSurveyOut])
async def get_pulse_history(
    limit: int = Query(default=30, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get user's pulse survey history"""
    try:
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        pulse_history = db.query(models.PulseSurvey).filter(
            models.PulseSurvey.employee_id == employee.id
        ).order_by(desc(models.PulseSurvey.submitted_at)).limit(limit).all()
        
        return pulse_history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching pulse history: {str(e)}")

# ============================================
# RECOGNITION SYSTEM
# ============================================

@router.post("/recognition", response_model=schemas.RecognitionOut)
async def send_recognition(
    data: schemas.RecognitionCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Send recognition to a colleague"""
    try:
        # Validate recipient exists
        recipient = db.query(models.Employee).filter(models.Employee.id == data.recipient_id).first()
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Validate badge type
        valid_badges = ['star', 'team', 'innovator', 'goal', 'helpful', 'gogetter', 'creative', 'greatwork']
        if data.badge not in valid_badges:
            raise HTTPException(status_code=400, detail=f"Invalid badge type. Must be one of: {', '.join(valid_badges)}")
        
        # Validate message length
        if len(data.message.strip()) < 10:
            raise HTTPException(status_code=400, detail="Recognition message must be at least 10 characters long")
        
        recognition = models.Recognition(
            sender_id=current_user.id,
            recipient_id=data.recipient_id,
            message=data.message.strip(),
            badge=data.badge
        )
        
        db.add(recognition)
        
        # Create notification for recipient
        if recipient.user_id:
            notification = models.EngagementNotification(
                user_id=recipient.user_id,
                type="recognition",
                message=f"You received a {data.badge} recognition from {current_user.first_name}!"
            )
            db.add(notification)
        
        db.commit()
        db.refresh(recognition)
        
        return recognition
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error sending recognition: {str(e)}")

@router.get("/recognition/received", response_model=List[schemas.RecognitionOut])
async def get_received_recognitions(
    limit: int = Query(default=20, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get recognitions received by current user"""
    try:
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        recognitions = db.query(models.Recognition).filter(
            models.Recognition.recipient_id == employee.id
        ).order_by(desc(models.Recognition.created_at)).limit(limit).all()
        
        return recognitions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recognitions: {str(e)}")

@router.get("/recognition/wall", response_model=List[schemas.RecognitionOut])
async def get_recognition_wall(
    limit: int = Query(default=50, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get recent recognitions for the recognition wall"""
    try:
        recognitions = db.query(models.Recognition).order_by(
            desc(models.Recognition.created_at)
        ).limit(limit).all()
        
        return recognitions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching recognition wall: {str(e)}")

# ============================================
# ANONYMOUS FEEDBACK
# ============================================

@router.post("/feedback", response_model=schemas.FeedbackOut)
async def submit_feedback(
    data: schemas.FeedbackCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit anonymous feedback"""
    try:
        # Validate category
        valid_categories = ['general', 'workplace', 'management', 'benefits', 'culture', 'suggestion']
        if data.category not in valid_categories:
            raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}")
        
        # Validate text length
        if len(data.text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Feedback must be at least 10 characters long")
        
        feedback = models.AnonymousFeedback(
            text=data.text.strip(),
            category=data.category
        )
        
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        
        return feedback
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting feedback: {str(e)}")

@router.get("/feedback/wall", response_model=List[schemas.FeedbackOut])
async def get_feedback_wall(
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=20, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get feedback wall - Admin/HR only"""
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Only Admin and HR can view feedback wall")
    
    try:
        query = db.query(models.AnonymousFeedback).filter(models.AnonymousFeedback.status == "active")
        
        if category:
            query = query.filter(models.AnonymousFeedback.category == category)
        
        feedback_list = query.order_by(desc(models.AnonymousFeedback.submitted_at)).limit(limit).all()
        
        return feedback_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching feedback: {str(e)}")

# ============================================
# WELLNESS CHECK-IN
# ============================================

@router.post("/wellness-checkin", response_model=schemas.WellnessCheckinOut)
async def submit_wellness_checkin(
    data: schemas.WellnessCheckinCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit wellness check-in"""
    try:
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        # Validate score
        if not 1 <= data.score <= 10:
            raise HTTPException(status_code=400, detail="Wellness score must be between 1 and 10")
        
        wellness_checkin = models.WellnessCheckin(
            employee_id=employee.id,
            score=data.score,
            notes=data.notes
        )
        
        db.add(wellness_checkin)
        db.commit()
        db.refresh(wellness_checkin)
        
        return wellness_checkin
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting wellness check-in: {str(e)}")

@router.get("/wellness-checkin/history", response_model=List[schemas.WellnessCheckinOut])
async def get_wellness_history(
    limit: int = Query(default=30, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get wellness check-in history"""
    try:
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        wellness_history = db.query(models.WellnessCheckin).filter(
            models.WellnessCheckin.employee_id == employee.id
        ).order_by(desc(models.WellnessCheckin.submitted_at)).limit(limit).all()
        
        return wellness_history
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching wellness history: {str(e)}")

# ============================================
# ENGAGEMENT METRICS & ANALYTICS
# ============================================

@router.get("/engagement-metrics")
async def get_engagement_metrics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get overall engagement metrics"""
    try:
        # Calculate real metrics from database
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        # Pulse survey metrics
        pulse_count = db.query(models.PulseSurvey).filter(
            models.PulseSurvey.submitted_at >= thirty_days_ago
        ).count()
        
        avg_mood_query = db.query(func.avg(
            func.case(
                (models.PulseSurvey.mood == 'terrible', 1),
                (models.PulseSurvey.mood == 'bad', 2),
                (models.PulseSurvey.mood == 'okay', 3),
                (models.PulseSurvey.mood == 'good', 4),
                (models.PulseSurvey.mood == 'amazing', 5),
                else_=3
            )
        )).filter(models.PulseSurvey.submitted_at >= thirty_days_ago).scalar()
        
        avg_mood = avg_mood_query or 3.0
        
        # Recognition metrics
        recognition_count = db.query(models.Recognition).filter(
            models.Recognition.created_at >= thirty_days_ago
        ).count()
        
        # Wellness metrics
        avg_wellness = db.query(func.avg(models.WellnessCheckin.score)).filter(
            models.WellnessCheckin.submitted_at >= thirty_days_ago
        ).scalar() or 6.0
        
        # Calculate overall engagement score
        overall_engagement = min(int((avg_mood / 5.0) * 100), 100)
        
        # Determine attrition risk level
        if avg_mood >= 4.0 and avg_wellness >= 7.0:
            attrition_risk = "Low"
        elif avg_mood >= 3.0 and avg_wellness >= 5.0:
            attrition_risk = "Medium"
        else:
            attrition_risk = "High"
        
        return {
            "overall_engagement": overall_engagement,
            "happiness_score": round(avg_mood, 1),
            "recognition_count": recognition_count,
            "attrition_risk": attrition_risk,
            "pulse_participation": pulse_count,
            "wellness_average": round(avg_wellness, 1),
            "period": "Last 30 days"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating engagement metrics: {str(e)}")

# ============================================
# PHOTO GALLERY
# ============================================

@router.post("/gallery/create-album", response_model=schemas.PhotoAlbumOut)
async def create_gallery_album(
    data: schemas.PhotoAlbumCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create new photo album - Admin/HR/Manager only"""
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(
            status_code=403, 
            detail="Only Admin, HR, and Managers can create albums"
        )
    
    try:
        if len(data.title.strip()) < 3:
            raise HTTPException(status_code=400, detail="Album title must be at least 3 characters long")
        
        album = models.PhotoAlbum(
            title=data.title.strip(),
            description=data.description,
            created_by=current_user.id
        )
        
        db.add(album)
        db.commit()
        db.refresh(album)
        
        return album
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating album: {str(e)}")

@router.get("/gallery/albums", response_model=List[schemas.PhotoAlbumOut])
async def get_gallery_albums(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all photo albums"""
    try:
        albums = db.query(models.PhotoAlbum).filter(
            models.PhotoAlbum.is_active == True
        ).order_by(desc(models.PhotoAlbum.created_at)).all()
        
        return albums
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching albums: {str(e)}")

@router.post("/gallery/upload")
async def upload_gallery_photo(
    album_id: int,
    photo: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload photo to gallery album - Admin/HR/Manager only"""
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(
            status_code=403, 
            detail="Only Admin, HR, and Managers can upload photos to gallery"
        )
    
    try:
        # Validate album exists
        album = db.query(models.PhotoAlbum).filter(
            models.PhotoAlbum.id == album_id,
            models.PhotoAlbum.is_active == True
        ).first()
        
        if not album:
            raise HTTPException(status_code=404, detail="Album not found")
        
        # Validate file type
        if not photo.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Create upload directory
        upload_dir = "backend/uploads/gallery"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = photo.filename.split('.')[-1] if '.' in photo.filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(photo.file, buffer)
        
        # Save to database
        gallery_photo = models.PhotoGallery(
            album_id=album_id,
            filename=unique_filename,
            original_filename=photo.filename,
            file_path=file_path,
            uploaded_by=current_user.id
        )
        
        db.add(gallery_photo)
        db.commit()
        db.refresh(gallery_photo)
        
        return {
            "message": "Photo uploaded successfully",
            "photo_id": gallery_photo.id,
            "filename": unique_filename,
            "album_id": album_id,
            "uploaded_by": current_user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading photo: {str(e)}")

# ============================================
# MINI GAMES
# ============================================

@router.post("/games/score", response_model=schemas.GameScoreOut)
async def submit_game_score(
    data: schemas.GameScoreCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit game score"""
    try:
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        # Validate game type
        valid_games = ['trivia', 'wordscramble', 'quickmath', 'memory']
        if data.game_type not in valid_games:
            raise HTTPException(status_code=400, detail=f"Invalid game type. Must be one of: {', '.join(valid_games)}")
        
        # Validate score
        if data.score < 0:
            raise HTTPException(status_code=400, detail="Score cannot be negative")
        
        game_score = models.GameScore(
            employee_id=employee.id,
            game_type=data.game_type,
            score=data.score
        )
        
        db.add(game_score)
        db.commit()
        db.refresh(game_score)
        
        return game_score
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting game score: {str(e)}")

@router.get("/games/leaderboard")
async def get_game_leaderboard(
    game_type: Optional[str] = Query(default=None),
    limit: int = Query(default=10, le=50),
    db: Session = Depends(database.get_db)
):
    """Get game leaderboard"""
    try:
        query = db.query(
            models.GameScore.employee_id,
            func.max(models.GameScore.score).label('best_score'),
            func.count(models.GameScore.id).label('games_played')
        ).join(models.Employee)
        
        if game_type:
            query = query.filter(models.GameScore.game_type == game_type)
        
        leaderboard_data = query.group_by(models.GameScore.employee_id).order_by(
            desc('best_score')
        ).limit(limit).all()
        
        # Format leaderboard with employee names
        leaderboard = []
        for idx, (employee_id, best_score, games_played) in enumerate(leaderboard_data):
            employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
            if employee:
                leaderboard.append({
                    "rank": idx + 1,
                    "name": f"{employee.first_name} {employee.last_name[0]}.",
                    "score": best_score,
                    "games_played": games_played,
                    "badge": "🥇" if idx == 0 else "🥈" if idx == 1 else "🥉" if idx == 2 else "⭐"
                })
        
        return leaderboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching leaderboard: {str(e)}")

# ============================================
# NOTIFICATIONS
# ============================================

@router.get("/notifications", response_model=List[schemas.NotificationOut])
async def get_notifications(
    limit: int = Query(default=20, le=100),
    unread_only: bool = Query(default=False),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get user notifications"""
    try:
        query = db.query(models.EngagementNotification).filter(
            models.EngagementNotification.user_id == current_user.id
        )
        
        if unread_only:
            query = query.filter(models.EngagementNotification.is_read == False)
        
        notifications = query.order_by(
            desc(models.EngagementNotification.created_at)
        ).limit(limit).all()
        
        return notifications
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching notifications: {str(e)}")

@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        notification = db.query(models.EngagementNotification).filter(
            models.EngagementNotification.id == notification_id,
            models.EngagementNotification.user_id == current_user.id
        ).first()
        
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        
        notification.is_read = True
        db.commit()
        
        return {"message": "Notification marked as read"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")

@router.patch("/notifications/mark-all-read")
async def mark_all_notifications_read(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark all notifications as read"""
    try:
        db.query(models.EngagementNotification).filter(
            models.EngagementNotification.user_id == current_user.id,
            models.EngagementNotification.is_read == False
        ).update({"is_read": True})
        
        db.commit()
        
        return {"message": "All notifications marked as read"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error marking all notifications as read: {str(e)}")

# ============================================
# TEAM ACTIVITIES
# ============================================

@router.post("/activities", response_model=schemas.TeamActivityOut)
async def create_team_activity(
    data: schemas.TeamActivityCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create team activity - Admin/HR/Manager only"""
    if current_user.role not in ['admin', 'hr', 'manager']:
        raise HTTPException(
            status_code=403, 
            detail="Only Admin, HR, and Managers can create team activities"
        )
    
    try:
        # Validate activity type
        valid_types = ['virtual', 'physical', 'hybrid']
        if data.activity_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid activity type. Must be one of: {', '.join(valid_types)}")
        
        # Validate scheduled date is in the future
        if data.scheduled_date <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Scheduled date must be in the future")
        
        activity = models.TeamActivity(
            title=data.title.strip(),
            description=data.description,
            activity_type=data.activity_type,
            scheduled_date=data.scheduled_date,
            max_participants=data.max_participants,
            created_by=current_user.id
        )
        
        db.add(activity)
        db.commit()
        db.refresh(activity)
        
        return activity
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating team activity: {str(e)}")

@router.get("/activities", response_model=List[schemas.TeamActivityOut])
async def get_team_activities(
    upcoming_only: bool = Query(default=True),
    limit: int = Query(default=20, le=100),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get team activities"""
    try:
        query = db.query(models.TeamActivity).filter(models.TeamActivity.is_active == True)
        
        if upcoming_only:
            query = query.filter(models.TeamActivity.scheduled_date >= datetime.utcnow())
        
        activities = query.order_by(models.TeamActivity.scheduled_date).limit(limit).all()
        
        return activities
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching team activities: {str(e)}")

@router.post("/activities/{activity_id}/join")
async def join_team_activity(
    activity_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Join a team activity"""
    try:
        employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee profile not found")
        
        # Check if activity exists
        activity = db.query(models.TeamActivity).filter(
            models.TeamActivity.id == activity_id,
            models.TeamActivity.is_active == True
        ).first()
        
        if not activity:
            raise HTTPException(status_code=404, detail="Activity not found")
        
        # Check if already joined
        existing_participation = db.query(models.ActivityParticipant).filter(
            models.ActivityParticipant.activity_id == activity_id,
            models.ActivityParticipant.employee_id == employee.id
        ).first()
        
        if existing_participation:
            raise HTTPException(status_code=400, detail="You have already joined this activity")
        
        # Check if activity is full
        if activity.max_participants:
            current_participants = db.query(models.ActivityParticipant).filter(
                models.ActivityParticipant.activity_id == activity_id
            ).count()
            
            if current_participants >= activity.max_participants:
                raise HTTPException(status_code=400, detail="Activity is full")
        
        # Join activity
        participation = models.ActivityParticipant(
            activity_id=activity_id,
            employee_id=employee.id
        )
        
        db.add(participation)
        db.commit()
        
        return {"message": "Successfully joined the activity"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error joining activity: {str(e)}")

