"""
Predictive Analytics Router
Advanced AI/ML endpoints for HR predictions and insights
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas import (
    AttritionPredictionOut, PerformanceForecastOut, SalaryOptimizationOut,
    RecruitmentPredictionOut, TeamDynamicsOut, PredictiveAnalyticsRequest,
    AttritionPredictionRequest, PerformanceForecastRequest, SalaryOptimizationRequest,
    RecruitmentPredictionRequest, TeamDynamicsRequest
)
from ..predictive_analytics_service import PredictiveAnalyticsService
from ..role_utils import has_permission
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/predictive-analytics", tags=["Predictive Analytics"])

# ============================================
# EMPLOYEE ATTRITION PREDICTION
# ============================================

@router.post("/attrition/predict")
async def predict_employee_attrition(
    request: PredictiveAnalyticsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict employee attrition risk using ML models"""
    
    # Check permissions
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        # Create analytics service instance
        analytics_service = PredictiveAnalyticsService(db)
        predictions = analytics_service.predict_employee_attrition(request.employee_ids)
        
        return {
            "success": True,
            "message": f"Generated attrition predictions for {len(predictions)} employees",
            "predictions": predictions,
            "summary": {
                "total_employees": len(predictions),
                "high_risk": len([p for p in predictions if p["risk_level"] in ["high", "critical"]]),
                "medium_risk": len([p for p in predictions if p["risk_level"] == "medium"]),
                "low_risk": len([p for p in predictions if p["risk_level"] == "low"])
            }
        }
        
    except Exception as e:
        logger.error(f"Error in attrition prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate attrition predictions")

@router.get("/attrition/history/{employee_id}")
async def get_attrition_history(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get historical attrition predictions for an employee"""
    
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    from ..models import AttritionPrediction
    from sqlalchemy import desc
    
    predictions = db.query(AttritionPrediction)\
        .filter(AttritionPrediction.employee_id == employee_id)\
        .order_by(desc(AttritionPrediction.prediction_date))\
        .limit(10).all()
    
    return {
        "employee_id": employee_id,
        "predictions": [
            {
                "prediction_date": p.prediction_date.isoformat(),
                "attrition_probability": p.attrition_probability,
                "risk_level": p.risk_level,
                "contributing_factors": p.contributing_factors,
                "confidence_score": p.confidence_score
            }
            for p in predictions
        ]
    }

# ============================================
# PERFORMANCE FORECASTING
# ============================================

@router.post("/performance/forecast")
async def forecast_employee_performance(
    request: PerformanceForecastRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Forecast employee performance using ML models"""
    
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        analytics_service = PredictiveAnalyticsService(db)
        forecasts = analytics_service.forecast_employee_performance(request.employee_ids, request.forecast_period)
        
        return {
            "success": True,
            "message": f"Generated performance forecasts for {len(forecasts)} employees",
            "forecast_period": request.forecast_period,
            "forecasts": forecasts,
            "summary": {
                "total_employees": len(forecasts),
                "improving": len([f for f in forecasts if f["growth_trajectory"] == "improving"]),
                "stable": len([f for f in forecasts if f["growth_trajectory"] == "stable"]),
                "declining": len([f for f in forecasts if f["growth_trajectory"] == "declining"]),
                "average_predicted_rating": sum(f["predicted_rating"] for f in forecasts) / len(forecasts) if forecasts else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Error in performance forecasting: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate performance forecasts")

@router.get("/performance/trends/{employee_id}")
async def get_performance_trends(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get performance trends and predictions for an employee"""
    
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    from ..models import PerformanceForecast, PerformanceReview
    from sqlalchemy import desc
    
    # Get historical performance reviews
    reviews = db.query(PerformanceReview)\
        .filter(PerformanceReview.employee_id == employee_id)\
        .order_by(PerformanceReview.review_date)\
        .all()
    
    # Get performance forecasts
    forecasts = db.query(PerformanceForecast)\
        .filter(PerformanceForecast.employee_id == employee_id)\
        .order_by(desc(PerformanceForecast.forecast_date))\
        .limit(5).all()
    
    return {
        "employee_id": employee_id,
        "historical_performance": [
            {
                "review_date": r.review_date.isoformat(),
                "overall_rating": r.overall_rating,
                "manager_rating": r.manager_rating,
                "peer_rating": r.peer_rating
            }
            for r in reviews
        ],
        "performance_forecasts": [
            {
                "forecast_date": f.forecast_date.isoformat(),
                "forecast_period": f.forecast_period,
                "predicted_rating": f.predicted_rating,
                "predicted_kpi_score": f.predicted_kpi_score,
                "growth_trajectory": f.growth_trajectory,
                "confidence_interval": f.confidence_interval
            }
            for f in forecasts
        ]
    }

# ============================================
# SALARY OPTIMIZATION
# ============================================

@router.post("/salary/optimize")
async def optimize_employee_salaries(
    request: SalaryOptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate salary optimization recommendations"""
    
    if not has_permission(current_user.role, ["admin", "hr"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        analytics_service = PredictiveAnalyticsService(db)
        optimizations = analytics_service.optimize_employee_salaries(request.employee_ids)
        
        # Calculate summary statistics
        total_current = sum(o["current_salary"] for o in optimizations)
        total_recommended = sum(o["recommended_salary"] for o in optimizations)
        budget_impact = total_recommended - total_current
        
        return {
            "success": True,
            "message": f"Generated salary optimizations for {len(optimizations)} employees",
            "optimizations": optimizations,
            "summary": {
                "total_employees": len(optimizations),
                "current_budget": total_current,
                "recommended_budget": total_recommended,
                "budget_impact": budget_impact,
                "budget_increase_percentage": (budget_impact / total_current * 100) if total_current > 0 else 0,
                "employees_needing_increase": len([o for o in optimizations if o["adjustment_percentage"] > 0]),
                "employees_overpaid": len([o for o in optimizations if o["adjustment_percentage"] < -5])
            }
        }
        
    except Exception as e:
        logger.error(f"Error in salary optimization: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate salary optimizations")

@router.get("/salary/market-analysis/{employee_id}")
async def get_salary_market_analysis(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed salary market analysis for an employee"""
    
    if not has_permission(current_user.role, ["admin", "hr"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    from ..models import SalaryOptimization, Employee, SalaryStructure
    from sqlalchemy import desc
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Get latest salary optimization
    optimization = db.query(SalaryOptimization)\
        .filter(SalaryOptimization.employee_id == employee_id)\
        .order_by(desc(SalaryOptimization.analysis_date))\
        .first()
    
    # Get current salary structure
    salary_structure = db.query(SalaryStructure)\
        .filter(SalaryStructure.employee_id == employee_id)\
        .order_by(desc(SalaryStructure.effective_date))\
        .first()
    
    return {
        "employee_id": employee_id,
        "employee_name": f"{employee.first_name} {employee.last_name}",
        "department": employee.department,
        "position": employee.position,
        "current_analysis": {
            "current_salary": optimization.current_salary if optimization else salary_structure.basic_salary if salary_structure else 0,
            "recommended_salary": optimization.recommended_salary if optimization else 0,
            "market_percentile": optimization.market_percentile if optimization else 0,
            "performance_factor": optimization.performance_factor if optimization else 0,
            "skill_premium": optimization.skill_premium if optimization else 0,
            "retention_risk_adjustment": optimization.retention_risk_adjustment if optimization else 0,
            "justification": optimization.justification if optimization else "No analysis available"
        } if optimization else None
    }

# ============================================
# RECRUITMENT SUCCESS PREDICTION
# ============================================

@router.post("/recruitment/predict-success")
async def predict_recruitment_success(
    request: RecruitmentPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Predict recruitment success probability for candidates"""
    
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        analytics_service = PredictiveAnalyticsService(db)
        predictions = analytics_service.predict_recruitment_success(request.application_ids)
        
        return {
            "success": True,
            "message": f"Generated recruitment predictions for {len(predictions)} candidates",
            "predictions": predictions,
            "summary": {
                "total_candidates": len(predictions),
                "high_success_probability": len([p for p in predictions if p["success_probability"] > 0.7]),
                "medium_success_probability": len([p for p in predictions if 0.4 <= p["success_probability"] <= 0.7]),
                "low_success_probability": len([p for p in predictions if p["success_probability"] < 0.4]),
                "average_success_probability": sum(p["success_probability"] for p in predictions) / len(predictions) if predictions else 0,
                "recommended_hires": len([p for p in predictions if p["overall_recommendation"] == "strong_hire"])
            }
        }
        
    except Exception as e:
        logger.error(f"Error in recruitment prediction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate recruitment predictions")

@router.get("/recruitment/candidate-analysis/{application_id}")
async def get_candidate_analysis(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed analysis for a specific candidate"""
    
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    from ..models import RecruitmentPrediction, Application
    
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    prediction = db.query(RecruitmentPrediction)\
        .filter(RecruitmentPrediction.application_id == application_id)\
        .order_by(desc(RecruitmentPrediction.prediction_date))\
        .first()
    
    return {
        "application_id": application_id,
        "candidate_name": application.candidate_name,
        "job_title": application.job.title if application.job else "Unknown",
        "ai_fit_score": application.ai_fit_score,
        "prediction": {
            "success_probability": prediction.success_probability,
            "performance_prediction": prediction.performance_prediction,
            "cultural_fit_score": prediction.cultural_fit_score,
            "retention_likelihood": prediction.retention_likelihood,
            "risk_factors": prediction.risk_factors,
            "strengths": prediction.strengths,
            "prediction_date": prediction.prediction_date.isoformat()
        } if prediction else None
    }

# ============================================
# TEAM DYNAMICS ANALYSIS
# ============================================

@router.post("/team-dynamics/analyze")
async def analyze_team_dynamics(
    request: TeamDynamicsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Analyze team collaboration patterns and dynamics"""
    
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    try:
        analytics_service = PredictiveAnalyticsService(db)
        analyses = analytics_service.analyze_team_dynamics(request.departments)
        
        return {
            "success": True,
            "message": f"Generated team dynamics analysis for {len(analyses)} departments",
            "analyses": analyses,
            "summary": {
                "total_departments": len(analyses),
                "high_performing_teams": len([a for a in analyses if a["overall_health"] > 0.8]),
                "teams_needing_attention": len([a for a in analyses if a["overall_health"] < 0.6]),
                "average_collaboration_score": sum(a["collaboration_score"] for a in analyses) / len(analyses) if analyses else 0,
                "departments_with_conflict_risk": len([a for a in analyses if a["conflict_risk"] == "high"])
            }
        }
        
    except Exception as e:
        logger.error(f"Error in team dynamics analysis: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to analyze team dynamics")

@router.get("/team-dynamics/department/{department}")
async def get_department_dynamics(
    department: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed team dynamics for a specific department"""
    
    if not has_permission(current_user.role, ["admin", "hr", "manager"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    from ..models import TeamDynamics, Employee
    from sqlalchemy import desc
    
    # Get latest team dynamics analysis
    analysis = db.query(TeamDynamics)\
        .filter(TeamDynamics.department == department)\
        .order_by(desc(TeamDynamics.analysis_date))\
        .first()
    
    # Get team members
    team_members = db.query(Employee)\
        .filter(Employee.department == department)\
        .all()
    
    return {
        "department": department,
        "team_size": len(team_members),
        "team_members": [
            {
                "id": member.id,
                "name": f"{member.first_name} {member.last_name}",
                "position": member.position,
                "years_of_experience": member.years_of_experience
            }
            for member in team_members
        ],
        "latest_analysis": {
            "analysis_date": analysis.analysis_date.isoformat(),
            "collaboration_score": analysis.collaboration_score,
            "communication_effectiveness": analysis.communication_effectiveness,
            "team_cohesion_score": analysis.team_cohesion_score,
            "conflict_indicators": analysis.conflict_indicators,
            "productivity_trends": analysis.productivity_trends,
            "key_influencers": analysis.key_influencers,
            "recommendations": analysis.recommendations
        } if analysis else None
    }

# ============================================
# COMPREHENSIVE ANALYTICS DASHBOARD
# ============================================

@router.get("/dashboard/overview")
async def get_predictive_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive predictive analytics overview"""
    
    if not has_permission(current_user.role, ["admin", "hr"]):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    from ..models import (
        AttritionPrediction, PerformanceForecast, SalaryOptimization,
        RecruitmentPrediction, TeamDynamics, Employee
    )
    from sqlalchemy import func, desc
    from datetime import datetime, timedelta
    
    # Get recent predictions count
    recent_date = datetime.now() - timedelta(days=30)
    
    attrition_count = db.query(func.count(AttritionPrediction.id))\
        .filter(AttritionPrediction.prediction_date >= recent_date).scalar()
    
    performance_count = db.query(func.count(PerformanceForecast.id))\
        .filter(PerformanceForecast.forecast_date >= recent_date).scalar()
    
    salary_count = db.query(func.count(SalaryOptimization.id))\
        .filter(SalaryOptimization.analysis_date >= recent_date).scalar()
    
    recruitment_count = db.query(func.count(RecruitmentPrediction.id))\
        .filter(RecruitmentPrediction.prediction_date >= recent_date).scalar()
    
    team_count = db.query(func.count(TeamDynamics.id))\
        .filter(TeamDynamics.analysis_date >= recent_date).scalar()
    
    # Get high-risk employees
    high_risk_attrition = db.query(func.count(AttritionPrediction.id))\
        .filter(
            AttritionPrediction.risk_level.in_(["high", "critical"]),
            AttritionPrediction.prediction_date >= recent_date
        ).scalar()
    
    total_employees = db.query(func.count(Employee.id)).scalar()
    
    return {
        "overview": {
            "total_employees": total_employees,
            "predictions_last_30_days": {
                "attrition_predictions": attrition_count,
                "performance_forecasts": performance_count,
                "salary_optimizations": salary_count,
                "recruitment_predictions": recruitment_count,
                "team_analyses": team_count
            },
            "risk_indicators": {
                "high_attrition_risk_employees": high_risk_attrition,
                "attrition_risk_percentage": (high_risk_attrition / total_employees * 100) if total_employees > 0 else 0
            }
        },
        "recent_insights": {
            "message": "Predictive analytics system is operational and generating insights",
            "last_updated": datetime.now().isoformat(),
            "model_status": "active"
        }
    }