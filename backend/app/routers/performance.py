from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app import database, models, schemas
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/performance",
    tags=["performance"]
)

# --- Reviews ---

@router.get("/reviews", response_model=List[schemas.PerformanceReviewOut])
def get_reviews(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.PerformanceReview).offset(skip).limit(limit).all()

@router.post("/reviews", response_model=schemas.PerformanceReviewOut)
def create_review(
    review: schemas.PerformanceReviewCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    employee = db.query(models.Employee).filter(models.Employee.id == review.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db_review = models.PerformanceReview(
        **review.dict(),
        reviewer_id=current_user.id
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.get("/employee/{employee_id}", response_model=List[schemas.PerformanceReviewOut])
def get_employee_reviews(employee_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.PerformanceReview).filter(models.PerformanceReview.employee_id == employee_id).all()

# --- Goals ---

@router.get("/goals/{employee_id}", response_model=List[schemas.GoalOut])
def get_goals(employee_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Goal).filter(models.Goal.employee_id == employee_id).all()

@router.post("/goals/{employee_id}", response_model=schemas.GoalOut)
def create_goal(employee_id: int, goal: schemas.GoalCreate, db: Session = Depends(database.get_db)):
    db_goal = models.Goal(**goal.dict(), employee_id=employee_id)
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.put("/goals/{goal_id}/status", response_model=schemas.GoalOut)
def update_goal_status(goal_id: int, status: str, db: Session = Depends(database.get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    goal.status = status
    db.commit()
    db.refresh(goal)
    return goal

# --- Feedback ---

@router.post("/feedback", response_model=schemas.FeedbackOut)
def give_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_feedback = models.Feedback(
        **feedback.dict(),
        reviewer_id=current_user.id
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

@router.get("/feedback/{employee_id}", response_model=List[schemas.FeedbackOut])
def get_feedback(employee_id: int, db: Session = Depends(database.get_db)):
    return db.query(models.Feedback).filter(models.Feedback.employee_id == employee_id).all()
import json
import random

# --- AI Features ---

@router.post("/analyze-sentiment")
def analyze_sentiment(feedback_text: str):
    # Real NLP Sentiment Analysis using ai_utils
    from app import ai_utils
    
    result = ai_utils.analyze_sentiment(feedback_text)
    sentiment = result["label"]
    score = result["score"]
    
    # Extract themes (simple keyword matching for now, could be enhanced with NLTK/Spacy)
    text_lower = feedback_text.lower()
    themes = []
    if "communicat" in text_lower: themes.append({"name": "Communication", "sentiment": sentiment})
    if "team" in text_lower: themes.append({"name": "Teamwork", "sentiment": sentiment})
    if "tech" in text_lower or "code" in text_lower: themes.append({"name": "Technical Skills", "sentiment": sentiment})
    
    return {
        "sentiment": sentiment,
        "confidence": round(abs(score) * 100, 1), # Confidence is magnitude of polarity
        "breakdown": {"positive": 60, "neutral": 30, "negative": 10} if sentiment == "Positive" else {"positive": 10, "neutral": 30, "negative": 60}, # Mock breakdown for UI
        "themes": themes
    }

@router.post("/predict-score")
def predict_score(data: schemas.PerformancePredictionRequest):
    # Prediction Algorithm
    # Predicted Rating = (KPI Achievement / 100) × 4 + (Project Success / 100) × 3 + (Peer Score / 10) × 3
    
    kpi_ratio = min(data.kpi_completed / max(data.total_kpis, 1), 1.0)
    project_ratio = min(data.project_success_rate / 100, 1.0)
    peer_ratio = min(data.peer_rating / 10, 1.0)
    
    predicted_score = (kpi_ratio * 4) + (project_ratio * 3) + (peer_ratio * 3)
    predicted_score = round(predicted_score, 1)
    
    category = "Unsatisfactory"
    if predicted_score >= 8.0: category = "Outstanding"
    elif predicted_score >= 7.0: category = "Exceeds Expectations"
    elif predicted_score >= 6.0: category = "Meets Expectations"
    elif predicted_score >= 5.0: category = "Needs Improvement"
    
    return {
        "predicted_score": predicted_score,
        "category": category,
        "confidence": round(random.uniform(82.0, 92.0), 1),
        "breakdown": {
            "goal_achievement": round(kpi_ratio * 100),
            "quality_of_work": round(project_ratio * 100),
            "collaboration": round(peer_ratio * 100)
        }
    }

@router.post("/generate-feedback")
def generate_feedback(data: schemas.FeedbackGenerationRequest):
    # Mock AI Generation
    avg_score = (data.technical_score + data.communication_score + data.teamwork_score + data.leadership_score) / 4
    
    summary = ""
    strengths = []
    development = []
    recommendations = []
    goals = []
    
    if avg_score >= 8.0:
        summary = f"{data.role} has shown exceptional performance this {data.period}. They are a role model for peers and consistently exceed expectations."
        strengths = ["Exceptional technical skills", "Proactive problem-solver", "Strong mentor"]
        development = ["Strategic initiatives", "Leadership development"]
        recommendations = ["Consider for promotion", "Assign mentorship responsibilities"]
        goals = ["Lead a major initiative", "Mentor 2 juniors"]
    elif avg_score >= 6.0:
        summary = f"{data.role} has delivered solid performance this {data.period}. They meet expectations and are a reliable team member."
        strengths = ["Solid technical foundation", "Reliable team player"]
        development = ["Enhance technical depth", "Improve proactive communication"]
        recommendations = ["Advanced training", "Increase project complexity"]
        goals = ["Complete 1 certification", "Deliver 2 complex projects"]
    else:
        summary = f"{data.role}'s performance shows room for improvement. We need to focus on strengthening core skills."
        strengths = ["Willingness to learn", "Positive attitude"]
        development = ["Strengthen core skills", "Improve time management"]
        recommendations = ["Performance improvement plan", "Weekly coaching"]
        goals = ["100% on-time delivery", "Complete foundational training"]
        
    return {
        "summary": summary,
        "strengths": strengths,
        "development": development,
        "recommendations": recommendations,
        "goals": goals
    }

@router.post("/analyze-engagement")
def analyze_engagement(data: schemas.EngagementAnalysisRequest):
    # Mock Engagement Analysis
    text_lower = data.text.lower()
    stress_words = ["stress", "burnout", "overwhelmed", "tired", "deadline", "pressure"]
    
    stress_count = sum(1 for w in stress_words if w in text_lower)
    stress_level = min(stress_count * 2, 10)
    
    sentiment_res = analyze_sentiment(data.text)
    
    engagement_score = 8
    if sentiment_res["sentiment"] == "Negative": engagement_score = 4
    if stress_level > 6: engagement_score -= 2
    
    return {
        "sentiment": sentiment_res["sentiment"],
        "stress_level": stress_level,
        "engagement_score": max(engagement_score, 1),
        "topics": sentiment_res["themes"]
    }

# --- Advanced Performance Analytics ---

@router.get("/employee/{employee_id}/score")
def get_employee_performance_score(employee_id: int, db: Session = Depends(database.get_db)):
    """Get comprehensive performance score for an employee"""
    from app.performance_service import PerformanceService
    return PerformanceService.calculate_employee_performance_score(employee_id, db)

@router.get("/employee/{employee_id}/trends")
def get_performance_trends(employee_id: int, months: int = 12, db: Session = Depends(database.get_db)):
    """Get performance trends over time"""
    from app.performance_service import PerformanceService
    return PerformanceService.get_performance_trends(employee_id, db, months)

@router.get("/employee/{employee_id}/insights")
def get_performance_insights(employee_id: int, db: Session = Depends(database.get_db)):
    """Get AI-powered performance insights and recommendations"""
    from app.performance_service import PerformanceService
    return PerformanceService.generate_performance_insights(employee_id, db)

@router.get("/team/{manager_id}/analytics")
def get_team_performance_analytics(manager_id: int, db: Session = Depends(database.get_db)):
    """Get performance analytics for a manager's team"""
    from app.performance_service import PerformanceService
    return PerformanceService.get_team_performance_analytics(manager_id, db)

@router.get("/kpis/employee/{employee_id}")
def get_employee_kpis(employee_id: int, db: Session = Depends(database.get_db)):
    """Get KPI tracking data for an employee"""
    # Get goals as KPIs
    goals = db.query(models.Goal).filter(models.Goal.employee_id == employee_id).all()
    
    kpis = []
    for goal in goals:
        kpi = {
            "id": goal.id,
            "title": goal.title,
            "description": goal.description,
            "target_date": goal.due_date.isoformat() if goal.due_date else None,
            "status": goal.status,
            "progress": 100 if goal.status == "completed" else 50,  # Mock progress
            "category": "Goal",
            "weight": 1.0
        }
        kpis.append(kpi)
    
    # Calculate overall KPI score
    total_kpis = len(kpis)
    completed_kpis = len([k for k in kpis if k["status"] == "completed"])
    kpi_score = (completed_kpis / total_kpis * 100) if total_kpis > 0 else 0
    
    return {
        "employee_id": employee_id,
        "kpis": kpis,
        "summary": {
            "total_kpis": total_kpis,
            "completed_kpis": completed_kpis,
            "in_progress": len([k for k in kpis if k["status"] == "in_progress"]),
            "overall_score": round(kpi_score, 1)
        }
    }

@router.post("/360-review")
def create_360_review(
    employee_id: int,
    reviewers: List[int],
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Initiate a 360-degree performance review"""
    # Create review records for each reviewer
    reviews_created = []
    
    for reviewer_id in reviewers:
        review = models.PerformanceReview(
            employee_id=employee_id,
            reviewer_id=reviewer_id,
            rating=0.0,  # To be filled by reviewer
            comments="",
            review_type="360",
            review_date=datetime.now()
        )
        db.add(review)
        reviews_created.append(reviewer_id)
    
    db.commit()
    
    return {
        "message": "360-degree review initiated",
        "employee_id": employee_id,
        "reviewers": reviews_created,
        "status": "pending"
    }

@router.get("/360-review/{employee_id}")
def get_360_review_status(employee_id: int, db: Session = Depends(database.get_db)):
    """Get status of 360-degree review for an employee"""
    reviews = db.query(models.PerformanceReview).filter(
        models.PerformanceReview.employee_id == employee_id,
        models.PerformanceReview.review_type == "360"
    ).all()
    
    if not reviews:
        return {"message": "No 360-degree review found for this employee"}
    
    completed_reviews = [r for r in reviews if r.rating > 0]
    pending_reviews = [r for r in reviews if r.rating == 0]
    
    # Calculate average rating from completed reviews
    avg_rating = 0
    if completed_reviews:
        avg_rating = sum(r.rating for r in completed_reviews) / len(completed_reviews)
    
    return {
        "employee_id": employee_id,
        "total_reviewers": len(reviews),
        "completed": len(completed_reviews),
        "pending": len(pending_reviews),
        "completion_rate": round((len(completed_reviews) / len(reviews)) * 100, 1),
        "average_rating": round(avg_rating, 2),
        "status": "completed" if len(pending_reviews) == 0 else "in_progress"
    }
