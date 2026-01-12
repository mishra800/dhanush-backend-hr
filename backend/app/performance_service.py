"""
Performance Management Service
Handles KPI tracking, performance metrics calculation, and analytics
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from app import models, database
import json

class PerformanceService:
    
    @staticmethod
    def calculate_employee_performance_score(employee_id: int, db: Session, period_months: int = 12) -> Dict:
        """
        Calculate comprehensive performance score for an employee
        Based on multiple factors: KPIs, goals, feedback, attendance, etc.
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period_months * 30)
        
        # Get employee
        employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
        if not employee:
            return {"error": "Employee not found"}
        
        # 1. Goal Achievement Score (30% weight)
        goals = db.query(models.Goal).filter(
            models.Goal.employee_id == employee_id,
            models.Goal.created_at >= start_date
        ).all()
        
        goal_score = 0
        if goals:
            completed_goals = [g for g in goals if g.status == "completed"]
            goal_score = (len(completed_goals) / len(goals)) * 100
        
        # 2. Performance Review Score (25% weight)
        reviews = db.query(models.PerformanceReview).filter(
            models.PerformanceReview.employee_id == employee_id,
            models.PerformanceReview.review_date >= start_date
        ).all()
        
        review_score = 0
        if reviews:
            avg_rating = sum(r.rating for r in reviews) / len(reviews)
            review_score = (avg_rating / 5.0) * 100  # Convert to percentage
        
        # 3. Attendance Score (20% weight)
        attendance_records = db.query(models.Attendance).filter(
            models.Attendance.employee_id == employee_id,
            models.Attendance.date >= start_date.date()
        ).all()
        
        attendance_score = 0
        if attendance_records:
            present_days = len([a for a in attendance_records if a.status == "present"])
            attendance_score = (present_days / len(attendance_records)) * 100
        
        # 4. Feedback Sentiment Score (15% weight)
        feedbacks = db.query(models.Feedback).filter(
            models.Feedback.employee_id == employee_id,
            models.Feedback.created_at >= start_date
        ).all()
        
        sentiment_score = 50  # Neutral baseline
        if feedbacks:
            # Calculate average sentiment (assuming sentiment analysis is done)
            positive_feedback = len([f for f in feedbacks if "positive" in f.type.lower()])
            sentiment_score = (positive_feedback / len(feedbacks)) * 100
        
        # 5. Learning & Development Score (10% weight)
        # This would integrate with learning system - using mock for now
        learning_score = 75  # Mock score
        
        # Calculate weighted final score
        final_score = (
            goal_score * 0.30 +
            review_score * 0.25 +
            attendance_score * 0.20 +
            sentiment_score * 0.15 +
            learning_score * 0.10
        )
        
        # Determine performance category
        if final_score >= 90:
            category = "Outstanding"
            color = "green"
        elif final_score >= 80:
            category = "Exceeds Expectations"
            color = "blue"
        elif final_score >= 70:
            category = "Meets Expectations"
            color = "yellow"
        elif final_score >= 60:
            category = "Needs Improvement"
            color = "orange"
        else:
            category = "Unsatisfactory"
            color = "red"
        
        return {
            "employee_id": employee_id,
            "employee_name": f"{employee.first_name} {employee.last_name}",
            "final_score": round(final_score, 1),
            "category": category,
            "color": color,
            "breakdown": {
                "goal_achievement": round(goal_score, 1),
                "performance_reviews": round(review_score, 1),
                "attendance": round(attendance_score, 1),
                "feedback_sentiment": round(sentiment_score, 1),
                "learning_development": round(learning_score, 1)
            },
            "metrics": {
                "total_goals": len(goals),
                "completed_goals": len([g for g in goals if g.status == "completed"]),
                "total_reviews": len(reviews),
                "attendance_days": len(attendance_records),
                "feedback_count": len(feedbacks)
            },
            "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        }
    
    @staticmethod
    def get_team_performance_analytics(manager_id: int, db: Session) -> Dict:
        """
        Get performance analytics for a manager's team
        """
        # Get team members
        team_members = db.query(models.Employee).filter(
            models.Employee.manager_id == manager_id
        ).all()
        
        if not team_members:
            return {"error": "No team members found"}
        
        team_performance = []
        total_score = 0
        
        for member in team_members:
            perf = PerformanceService.calculate_employee_performance_score(member.id, db)
            if "error" not in perf:
                team_performance.append(perf)
                total_score += perf["final_score"]
        
        avg_team_score = total_score / len(team_performance) if team_performance else 0
        
        # Performance distribution
        categories = {"Outstanding": 0, "Exceeds Expectations": 0, "Meets Expectations": 0, 
                     "Needs Improvement": 0, "Unsatisfactory": 0}
        
        for perf in team_performance:
            categories[perf["category"]] += 1
        
        return {
            "manager_id": manager_id,
            "team_size": len(team_members),
            "average_score": round(avg_team_score, 1),
            "performance_distribution": categories,
            "team_performance": team_performance,
            "top_performers": sorted(team_performance, key=lambda x: x["final_score"], reverse=True)[:3],
            "improvement_needed": [p for p in team_performance if p["final_score"] < 70]
        }
    
    @staticmethod
    def get_performance_trends(employee_id: int, db: Session, months: int = 12) -> Dict:
        """
        Get performance trends over time for an employee
        """
        trends = []
        current_date = datetime.now()
        
        for i in range(months):
            month_start = current_date - timedelta(days=(i+1)*30)
            month_end = current_date - timedelta(days=i*30)
            
            # Get performance data for this month
            reviews = db.query(models.PerformanceReview).filter(
                models.PerformanceReview.employee_id == employee_id,
                models.PerformanceReview.review_date >= month_start,
                models.PerformanceReview.review_date < month_end
            ).all()
            
            goals = db.query(models.Goal).filter(
                models.Goal.employee_id == employee_id,
                models.Goal.created_at >= month_start,
                models.Goal.created_at < month_end
            ).all()
            
            avg_rating = 0
            if reviews:
                avg_rating = sum(r.rating for r in reviews) / len(reviews)
            
            goal_completion = 0
            if goals:
                completed = len([g for g in goals if g.status == "completed"])
                goal_completion = (completed / len(goals)) * 100
            
            trends.append({
                "month": month_start.strftime("%Y-%m"),
                "performance_rating": round(avg_rating, 1),
                "goal_completion": round(goal_completion, 1),
                "review_count": len(reviews),
                "goal_count": len(goals)
            })
        
        trends.reverse()  # Show oldest to newest
        return {
            "employee_id": employee_id,
            "trends": trends,
            "period_months": months
        }
    
    @staticmethod
    def generate_performance_insights(employee_id: int, db: Session) -> Dict:
        """
        Generate AI-powered insights and recommendations for employee performance
        """
        perf_data = PerformanceService.calculate_employee_performance_score(employee_id, db)
        
        if "error" in perf_data:
            return perf_data
        
        insights = []
        recommendations = []
        
        # Analyze each component
        breakdown = perf_data["breakdown"]
        
        if breakdown["goal_achievement"] < 70:
            insights.append("Goal achievement is below expectations")
            recommendations.append("Set more realistic and achievable goals")
            recommendations.append("Provide additional support and resources")
        
        if breakdown["attendance"] < 85:
            insights.append("Attendance patterns show room for improvement")
            recommendations.append("Discuss any challenges affecting attendance")
            recommendations.append("Consider flexible work arrangements if appropriate")
        
        if breakdown["feedback_sentiment"] < 60:
            insights.append("Feedback sentiment indicates potential engagement issues")
            recommendations.append("Schedule regular one-on-one meetings")
            recommendations.append("Provide more positive recognition and feedback")
        
        if breakdown["performance_reviews"] > 85:
            insights.append("Consistently strong performance in reviews")
            recommendations.append("Consider for advanced projects or leadership roles")
            recommendations.append("Explore career development opportunities")
        
        # Overall performance insights
        if perf_data["final_score"] >= 85:
            insights.append("High performer with consistent results")
            recommendations.append("Consider for promotion or increased responsibilities")
        elif perf_data["final_score"] < 70:
            insights.append("Performance improvement needed across multiple areas")
            recommendations.append("Develop a performance improvement plan")
            recommendations.append("Increase coaching and mentoring support")
        
        return {
            "employee_id": employee_id,
            "performance_score": perf_data["final_score"],
            "insights": insights,
            "recommendations": recommendations,
            "strengths": [k for k, v in breakdown.items() if v >= 80],
            "improvement_areas": [k for k, v in breakdown.items() if v < 70],
            "generated_at": datetime.now().isoformat()
        }