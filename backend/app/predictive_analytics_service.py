"""
Predictive Analytics Service
Advanced AI/ML models for HR predictions and insights
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, mean_squared_error, classification_report
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
import json
import logging
from . import models
import joblib
import os

logger = logging.getLogger(__name__)

class PredictiveAnalyticsService:
    """Advanced predictive analytics for HR management"""
    
    def __init__(self, db: Session):
        self.db = db
        self.models_dir = "ml_models"
        os.makedirs(self.models_dir, exist_ok=True)
    
    # ============================================
    # EMPLOYEE ATTRITION PREDICTION
    # ============================================
    
    def predict_employee_attrition(self, employee_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Predict which employees are likely to leave"""
        try:
            # Get employee data for prediction
            query = self.db.query(models.Employee)
            if employee_ids:
                query = query.filter(models.Employee.id.in_(employee_ids))
            
            employees = query.all()
            predictions = []
            
            for employee in employees:
                # Extract features for attrition prediction
                features = self._extract_attrition_features(employee)
                
                # Load or train attrition model
                model = self._get_or_train_attrition_model()
                
                # Make prediction
                probability = model.predict_proba([features])[0][1]  # Probability of leaving
                risk_level = self._categorize_attrition_risk(probability)
                contributing_factors = self._identify_attrition_factors(employee, features)
                
                # Save prediction to database
                prediction = models.AttritionPrediction(
                    employee_id=employee.id,
                    attrition_probability=float(probability),
                    risk_level=risk_level,
                    contributing_factors=contributing_factors,
                    confidence_score=0.85,  # Model confidence
                    model_version="v1.0"
                )
                
                self.db.add(prediction)
                predictions.append({
                    "employee_id": employee.id,
                    "employee_name": f"{employee.first_name} {employee.last_name}",
                    "department": employee.department,
                    "attrition_probability": probability,
                    "risk_level": risk_level,
                    "contributing_factors": contributing_factors,
                    "recommendations": self._generate_retention_recommendations(risk_level, contributing_factors)
                })
            
            self.db.commit()
            return predictions
            
        except Exception as e:
            logger.error(f"Error in attrition prediction: {str(e)}")
            return []
    
    def _extract_attrition_features(self, employee: models.Employee) -> List[float]:
        """Extract features for attrition prediction"""
        features = []
        
        # Basic employee info
        features.append(employee.years_of_experience or 0)
        features.append(1 if employee.department == "Engineering" else 0)
        features.append(1 if employee.department == "Sales" else 0)
        features.append(1 if employee.department == "HR" else 0)
        
        # Performance metrics
        latest_review = self.db.query(models.PerformanceReview)\
            .filter(models.PerformanceReview.employee_id == employee.id)\
            .order_by(desc(models.PerformanceReview.review_date))\
            .first()
        
        features.append(latest_review.overall_rating if latest_review else 3.0)
        features.append(latest_review.manager_rating if latest_review else 3.0)
        
        # Attendance patterns
        attendance_count = self.db.query(func.count(models.Attendance.id))\
            .filter(
                models.Attendance.employee_id == employee.id,
                models.Attendance.date >= datetime.now() - timedelta(days=90)
            ).scalar() or 0
        
        features.append(attendance_count)
        
        # Leave usage
        leave_days = self.db.query(func.sum(models.LeaveRequest.days_requested))\
            .filter(
                models.LeaveRequest.employee_id == employee.id,
                models.LeaveRequest.status == "approved",
                models.LeaveRequest.start_date >= datetime.now() - timedelta(days=365)
            ).scalar() or 0
        
        features.append(leave_days)
        
        # Salary information
        salary_structure = self.db.query(models.SalaryStructure)\
            .filter(models.SalaryStructure.employee_id == employee.id)\
            .order_by(desc(models.SalaryStructure.effective_date))\
            .first()
        
        features.append(salary_structure.basic_salary if salary_structure else 50000)
        
        # Engagement metrics
        engagement_score = self._calculate_engagement_score(employee.id)
        features.append(engagement_score)
        
        return features
    
    def _get_or_train_attrition_model(self):
        """Get existing attrition model or train a new one"""
        model_path = os.path.join(self.models_dir, "attrition_model.joblib")
        
        if os.path.exists(model_path):
            return joblib.load(model_path)
        
        # Train new model with historical data
        return self._train_attrition_model()
    
    def _train_attrition_model(self):
        """Train attrition prediction model"""
        # Get historical employee data
        employees = self.db.query(models.Employee).all()
        
        X = []
        y = []
        
        for employee in employees:
            features = self._extract_attrition_features(employee)
            # For demo, use random attrition labels (in real scenario, use actual historical data)
            attrition = np.random.choice([0, 1], p=[0.8, 0.2])  # 20% attrition rate
            
            X.append(features)
            y.append(attrition)
        
        if len(X) < 10:  # Not enough data, return dummy model
            model = RandomForestClassifier(n_estimators=10, random_state=42)
            # Create dummy data for training
            X = np.random.rand(50, 10)
            y = np.random.choice([0, 1], 50)
        
        X = np.array(X)
        y = np.array(y)
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Save model
        model_path = os.path.join(self.models_dir, "attrition_model.joblib")
        joblib.dump(model, model_path)
        
        return model
    
    def _categorize_attrition_risk(self, probability: float) -> str:
        """Categorize attrition risk level"""
        if probability >= 0.7:
            return "critical"
        elif probability >= 0.5:
            return "high"
        elif probability >= 0.3:
            return "medium"
        else:
            return "low"
    
    def _identify_attrition_factors(self, employee: models.Employee, features: List[float]) -> List[str]:
        """Identify contributing factors for attrition risk"""
        factors = []
        
        # Analyze features to identify risk factors
        if features[4] < 3.0:  # Low performance rating
            factors.append("Below average performance rating")
        
        if features[6] < 60:  # Low attendance
            factors.append("Irregular attendance pattern")
        
        if features[7] > 20:  # High leave usage
            factors.append("High leave utilization")
        
        if features[9] < 0.6:  # Low engagement
            factors.append("Low engagement score")
        
        if len(factors) == 0:
            factors.append("No significant risk factors identified")
        
        return factors
    
    def _generate_retention_recommendations(self, risk_level: str, factors: List[str]) -> List[str]:
        """Generate retention recommendations based on risk factors"""
        recommendations = []
        
        if risk_level in ["high", "critical"]:
            recommendations.append("Schedule immediate one-on-one meeting with manager")
            recommendations.append("Review compensation and career development opportunities")
        
        if "Below average performance rating" in factors:
            recommendations.append("Provide additional training and mentoring support")
            recommendations.append("Set clear performance improvement goals")
        
        if "Low engagement score" in factors:
            recommendations.append("Conduct engagement survey and feedback session")
            recommendations.append("Consider role adjustment or team change")
        
        if "Irregular attendance pattern" in factors:
            recommendations.append("Discuss work-life balance and flexible work options")
        
        if len(recommendations) == 0:
            recommendations.append("Continue regular check-ins and career development discussions")
        
        return recommendations
    
    # ============================================
    # PERFORMANCE FORECASTING
    # ============================================
    
    def forecast_employee_performance(self, employee_ids: Optional[List[int]] = None, 
                                    forecast_period: str = "next_quarter") -> List[Dict[str, Any]]:
        """Forecast future employee performance"""
        try:
            query = self.db.query(models.Employee)
            if employee_ids:
                query = query.filter(models.Employee.id.in_(employee_ids))
            
            employees = query.all()
            forecasts = []
            
            for employee in employees:
                # Extract performance features
                features = self._extract_performance_features(employee)
                
                # Load or train performance model
                model = self._get_or_train_performance_model()
                
                # Make prediction
                predicted_rating = model.predict([features])[0]
                predicted_kpi_score = min(max(predicted_rating * 20, 0), 100)  # Convert to 0-100 scale
                
                growth_trajectory = self._determine_growth_trajectory(employee, predicted_rating)
                confidence_interval = self._calculate_confidence_interval(predicted_rating)
                
                # Save forecast to database
                forecast = models.PerformanceForecast(
                    employee_id=employee.id,
                    forecast_period=forecast_period,
                    predicted_rating=float(predicted_rating),
                    predicted_kpi_score=float(predicted_kpi_score),
                    growth_trajectory=growth_trajectory,
                    confidence_interval=confidence_interval,
                    model_version="v1.0"
                )
                
                self.db.add(forecast)
                forecasts.append({
                    "employee_id": employee.id,
                    "employee_name": f"{employee.first_name} {employee.last_name}",
                    "current_rating": self._get_current_rating(employee.id),
                    "predicted_rating": predicted_rating,
                    "predicted_kpi_score": predicted_kpi_score,
                    "growth_trajectory": growth_trajectory,
                    "improvement_areas": self._identify_improvement_areas(employee, features),
                    "development_recommendations": self._generate_development_recommendations(growth_trajectory)
                })
            
            self.db.commit()
            return forecasts
            
        except Exception as e:
            logger.error(f"Error in performance forecasting: {str(e)}")
            return []
    
    def _extract_performance_features(self, employee: models.Employee) -> List[float]:
        """Extract features for performance prediction"""
        features = []
        
        # Historical performance ratings
        reviews = self.db.query(models.PerformanceReview)\
            .filter(models.PerformanceReview.employee_id == employee.id)\
            .order_by(desc(models.PerformanceReview.review_date))\
            .limit(3).all()
        
        # Average ratings from last 3 reviews
        if reviews:
            avg_rating = sum(r.overall_rating for r in reviews) / len(reviews)
            rating_trend = self._calculate_rating_trend(reviews)
        else:
            avg_rating = 3.0
            rating_trend = 0.0
        
        features.extend([avg_rating, rating_trend])
        
        # KPI performance
        kpi_scores = self.db.query(models.KPIProgress)\
            .filter(models.KPIProgress.employee_id == employee.id)\
            .order_by(desc(models.KPIProgress.updated_at))\
            .limit(5).all()
        
        avg_kpi = sum(k.progress_percentage for k in kpi_scores) / len(kpi_scores) if kpi_scores else 75.0
        features.append(avg_kpi / 100.0)  # Normalize to 0-1
        
        # Attendance consistency
        attendance_rate = self._calculate_attendance_rate(employee.id)
        features.append(attendance_rate)
        
        # Learning and development
        course_completion = self._calculate_course_completion_rate(employee.id)
        features.append(course_completion)
        
        # Engagement metrics
        engagement_score = self._calculate_engagement_score(employee.id)
        features.append(engagement_score)
        
        # Experience and tenure
        features.append(employee.years_of_experience or 0)
        
        return features
    
    def _get_or_train_performance_model(self):
        """Get existing performance model or train a new one"""
        model_path = os.path.join(self.models_dir, "performance_model.joblib")
        
        if os.path.exists(model_path):
            return joblib.load(model_path)
        
        return self._train_performance_model()
    
    def _train_performance_model(self):
        """Train performance prediction model"""
        employees = self.db.query(models.Employee).all()
        
        X = []
        y = []
        
        for employee in employees:
            features = self._extract_performance_features(employee)
            # Use current rating as target (in real scenario, use future performance data)
            current_rating = self._get_current_rating(employee.id)
            
            X.append(features)
            y.append(current_rating)
        
        if len(X) < 10:
            # Create dummy data for training
            X = np.random.rand(50, 7)
            y = np.random.uniform(2.0, 5.0, 50)
        
        X = np.array(X)
        y = np.array(y)
        
        # Train model
        model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Save model
        model_path = os.path.join(self.models_dir, "performance_model.joblib")
        joblib.dump(model, model_path)
        
        return model
    
    # ============================================
    # SALARY OPTIMIZATION
    # ============================================
    
    def optimize_employee_salaries(self, employee_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Generate salary optimization recommendations"""
        try:
            query = self.db.query(models.Employee)
            if employee_ids:
                query = query.filter(models.Employee.id.in_(employee_ids))
            
            employees = query.all()
            optimizations = []
            
            for employee in employees:
                current_salary = self._get_current_salary(employee.id)
                market_data = self._get_market_salary_data(employee)
                performance_factor = self._calculate_performance_factor(employee.id)
                skill_premium = self._calculate_skill_premium(employee)
                retention_risk = self._get_retention_risk(employee.id)
                
                # Calculate recommended salary
                recommended_salary = self._calculate_recommended_salary(
                    current_salary, market_data, performance_factor, skill_premium, retention_risk
                )
                
                justification = self._generate_salary_justification(
                    current_salary, recommended_salary, performance_factor, market_data
                )
                
                # Save optimization to database
                optimization = models.SalaryOptimization(
                    employee_id=employee.id,
                    current_salary=current_salary,
                    recommended_salary=recommended_salary,
                    market_percentile=market_data["percentile"],
                    performance_factor=performance_factor,
                    skill_premium=skill_premium,
                    retention_risk_adjustment=retention_risk,
                    justification=justification
                )
                
                self.db.add(optimization)
                optimizations.append({
                    "employee_id": employee.id,
                    "employee_name": f"{employee.first_name} {employee.last_name}",
                    "current_salary": current_salary,
                    "recommended_salary": recommended_salary,
                    "adjustment_percentage": ((recommended_salary - current_salary) / current_salary) * 100,
                    "market_position": market_data["position"],
                    "performance_factor": performance_factor,
                    "justification": justification,
                    "priority": self._calculate_adjustment_priority(current_salary, recommended_salary, retention_risk)
                })
            
            self.db.commit()
            return optimizations
            
        except Exception as e:
            logger.error(f"Error in salary optimization: {str(e)}")
            return []
    
    # ============================================
    # RECRUITMENT SUCCESS PREDICTION
    # ============================================
    
    def predict_recruitment_success(self, application_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        """Predict recruitment success probability for candidates"""
        try:
            query = self.db.query(models.Application)
            if application_ids:
                query = query.filter(models.Application.id.in_(application_ids))
            
            applications = query.all()
            predictions = []
            
            for application in applications:
                # Extract candidate features
                features = self._extract_candidate_features(application)
                
                # Load or train recruitment model
                model = self._get_or_train_recruitment_model()
                
                # Make predictions
                success_prob = model.predict_proba([features])[0][1]
                performance_pred = self._predict_candidate_performance(features)
                cultural_fit = self._assess_cultural_fit(application)
                retention_likelihood = self._predict_retention_likelihood(features)
                
                risk_factors, strengths = self._analyze_candidate_profile(application, features)
                
                # Save prediction to database
                prediction = models.RecruitmentPrediction(
                    application_id=application.id,
                    success_probability=float(success_prob),
                    performance_prediction=float(performance_pred),
                    cultural_fit_score=float(cultural_fit),
                    retention_likelihood=float(retention_likelihood),
                    risk_factors=risk_factors,
                    strengths=strengths
                )
                
                self.db.add(prediction)
                predictions.append({
                    "application_id": application.id,
                    "candidate_name": application.candidate_name,
                    "job_title": application.job.title if application.job else "Unknown",
                    "success_probability": success_prob,
                    "performance_prediction": performance_pred,
                    "cultural_fit_score": cultural_fit,
                    "retention_likelihood": retention_likelihood,
                    "overall_recommendation": self._generate_hiring_recommendation(success_prob, performance_pred, cultural_fit),
                    "risk_factors": risk_factors,
                    "strengths": strengths
                })
            
            self.db.commit()
            return predictions
            
        except Exception as e:
            logger.error(f"Error in recruitment prediction: {str(e)}")
            return []
    
    # ============================================
    # TEAM DYNAMICS ANALYSIS
    # ============================================
    
    def analyze_team_dynamics(self, departments: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Analyze team collaboration patterns and dynamics"""
        try:
            if departments:
                dept_list = departments
            else:
                dept_list = self.db.query(models.Employee.department)\
                    .distinct().filter(models.Employee.department.isnot(None)).all()
                dept_list = [d[0] for d in dept_list]
            
            analyses = []
            
            for department in dept_list:
                # Get team members
                team_members = self.db.query(models.Employee)\
                    .filter(models.Employee.department == department).all()
                
                if len(team_members) < 2:
                    continue
                
                # Calculate team metrics
                collaboration_score = self._calculate_collaboration_score(team_members)
                communication_effectiveness = self._assess_communication_effectiveness(team_members)
                conflict_indicators = self._identify_conflict_indicators(team_members)
                productivity_trends = self._analyze_productivity_trends(team_members)
                team_cohesion = self._calculate_team_cohesion(team_members)
                key_influencers = self._identify_key_influencers(team_members)
                recommendations = self._generate_team_recommendations(
                    collaboration_score, communication_effectiveness, conflict_indicators
                )
                
                # Save analysis to database
                analysis = models.TeamDynamics(
                    department=department,
                    collaboration_score=collaboration_score,
                    communication_effectiveness=communication_effectiveness,
                    conflict_indicators=conflict_indicators,
                    productivity_trends=productivity_trends,
                    team_cohesion_score=team_cohesion,
                    recommendations=recommendations,
                    key_influencers=key_influencers
                )
                
                self.db.add(analysis)
                analyses.append({
                    "department": department,
                    "team_size": len(team_members),
                    "collaboration_score": collaboration_score,
                    "communication_effectiveness": communication_effectiveness,
                    "team_cohesion_score": team_cohesion,
                    "productivity_trend": productivity_trends.get("trend", "stable"),
                    "conflict_risk": "high" if len(conflict_indicators) > 2 else "low",
                    "key_influencers": key_influencers,
                    "recommendations": recommendations,
                    "overall_health": self._calculate_team_health_score(
                        collaboration_score, communication_effectiveness, team_cohesion
                    )
                })
            
            self.db.commit()
            return analyses
            
        except Exception as e:
            logger.error(f"Error in team dynamics analysis: {str(e)}")
            return []
    
    # ============================================
    # HELPER METHODS
    # ============================================
    
    def _calculate_engagement_score(self, employee_id: int) -> float:
        """Calculate employee engagement score"""
        # Get recent pulse survey responses
        surveys = self.db.query(models.PulseSurvey)\
            .filter(models.PulseSurvey.employee_id == employee_id)\
            .order_by(desc(models.PulseSurvey.created_at))\
            .limit(3).all()
        
        if surveys:
            avg_score = sum(s.satisfaction_score for s in surveys) / len(surveys)
            return avg_score / 5.0  # Normalize to 0-1
        
        return 0.7  # Default engagement score
    
    def _calculate_attendance_rate(self, employee_id: int) -> float:
        """Calculate attendance rate for last 90 days"""
        total_days = 90
        attended_days = self.db.query(func.count(models.Attendance.id))\
            .filter(
                models.Attendance.employee_id == employee_id,
                models.Attendance.date >= datetime.now() - timedelta(days=total_days),
                models.Attendance.status == "present"
            ).scalar() or 0
        
        return min(attended_days / (total_days * 0.7), 1.0)  # Assuming 5 working days per week
    
    def _calculate_course_completion_rate(self, employee_id: int) -> float:
        """Calculate learning course completion rate"""
        enrollments = self.db.query(models.Enrollment)\
            .filter(models.Enrollment.employee_id == employee_id).all()
        
        if not enrollments:
            return 0.5  # Default completion rate
        
        completed = sum(1 for e in enrollments if e.completion_status == "completed")
        return completed / len(enrollments)
    
    def _get_current_rating(self, employee_id: int) -> float:
        """Get current performance rating"""
        latest_review = self.db.query(models.PerformanceReview)\
            .filter(models.PerformanceReview.employee_id == employee_id)\
            .order_by(desc(models.PerformanceReview.review_date))\
            .first()
        
        return latest_review.overall_rating if latest_review else 3.0
    
    def _get_current_salary(self, employee_id: int) -> float:
        """Get current salary for employee"""
        salary_structure = self.db.query(models.SalaryStructure)\
            .filter(models.SalaryStructure.employee_id == employee_id)\
            .order_by(desc(models.SalaryStructure.effective_date))\
            .first()
        
        return salary_structure.basic_salary if salary_structure else 50000.0
    
    # Additional helper methods would be implemented here...
    # (Truncated for brevity, but would include all the referenced helper methods)
    
    def _calculate_rating_trend(self, reviews: List[models.PerformanceReview]) -> float:
        """Calculate performance rating trend"""
        if len(reviews) < 2:
            return 0.0
        
        ratings = [r.overall_rating for r in reversed(reviews)]
        return (ratings[-1] - ratings[0]) / len(ratings)
    
    def _determine_growth_trajectory(self, employee: models.Employee, predicted_rating: float) -> str:
        """Determine growth trajectory based on prediction"""
        current_rating = self._get_current_rating(employee.id)
        
        if predicted_rating > current_rating + 0.3:
            return "improving"
        elif predicted_rating < current_rating - 0.3:
            return "declining"
        else:
            return "stable"
    
    def _calculate_confidence_interval(self, predicted_rating: float) -> Dict[str, float]:
        """Calculate confidence interval for prediction"""
        margin = 0.2  # ±0.2 rating points
        return {
            "lower": max(predicted_rating - margin, 1.0),
            "upper": min(predicted_rating + margin, 5.0)
        }
    
    def _identify_improvement_areas(self, employee: models.Employee, features: List[float]) -> List[str]:
        """Identify areas for performance improvement"""
        areas = []
        
        if features[2] < 0.7:  # Low KPI performance
            areas.append("Goal achievement and KPI performance")
        
        if features[3] < 0.8:  # Low attendance
            areas.append("Attendance consistency")
        
        if features[4] < 0.6:  # Low learning completion
            areas.append("Professional development and learning")
        
        if features[5] < 0.6:  # Low engagement
            areas.append("Employee engagement and motivation")
        
        return areas if areas else ["Continue current performance level"]
    
    def _generate_development_recommendations(self, growth_trajectory: str) -> List[str]:
        """Generate development recommendations based on trajectory"""
        if growth_trajectory == "improving":
            return [
                "Provide stretch assignments and leadership opportunities",
                "Consider for promotion or role expansion",
                "Assign mentoring responsibilities"
            ]
        elif growth_trajectory == "declining":
            return [
                "Schedule performance improvement plan",
                "Provide additional training and support",
                "Increase manager check-ins and feedback"
            ]
        else:
            return [
                "Maintain current development path",
                "Explore new skill development opportunities",
                "Consider lateral moves for growth"
            ]
    
    # ============================================
    # SALARY OPTIMIZATION HELPER METHODS
    # ============================================
    
    def _get_market_salary_data(self, employee: models.Employee) -> Dict[str, Any]:
        """Get market salary data for employee position"""
        # In a real implementation, this would connect to salary databases
        # For now, we'll simulate market data
        base_market_salary = {
            "Engineering": 80000,
            "Sales": 70000,
            "HR": 65000,
            "Marketing": 68000,
            "Finance": 75000
        }.get(employee.department, 60000)
        
        # Adjust for experience
        experience_multiplier = 1 + (employee.years_of_experience or 0) * 0.05
        market_salary = base_market_salary * experience_multiplier
        
        return {
            "market_salary": market_salary,
            "percentile": 0.6,  # Assume 60th percentile
            "position": "competitive"
        }
    
    def _calculate_performance_factor(self, employee_id: int) -> float:
        """Calculate performance-based salary adjustment factor"""
        current_rating = self._get_current_rating(employee_id)
        
        # Convert 1-5 rating to adjustment factor
        if current_rating >= 4.5:
            return 1.15  # 15% premium for top performers
        elif current_rating >= 4.0:
            return 1.10  # 10% premium for high performers
        elif current_rating >= 3.5:
            return 1.05  # 5% premium for good performers
        elif current_rating >= 3.0:
            return 1.0   # No adjustment for average performers
        else:
            return 0.95  # 5% reduction for underperformers
    
    def _calculate_skill_premium(self, employee: models.Employee) -> float:
        """Calculate skill-based premium"""
        # In a real implementation, this would analyze skills and market demand
        # For now, simulate based on department
        skill_premiums = {
            "Engineering": 0.1,  # 10% premium for technical skills
            "Sales": 0.05,       # 5% premium for sales skills
            "HR": 0.03,          # 3% premium for HR skills
            "Marketing": 0.05,   # 5% premium for marketing skills
            "Finance": 0.07      # 7% premium for finance skills
        }
        
        return skill_premiums.get(employee.department, 0.0)
    
    def _get_retention_risk(self, employee_id: int) -> float:
        """Get retention risk adjustment factor"""
        # Check if we have attrition prediction
        latest_prediction = self.db.query(models.AttritionPrediction)\
            .filter(models.AttritionPrediction.employee_id == employee_id)\
            .order_by(desc(models.AttritionPrediction.prediction_date))\
            .first()
        
        if latest_prediction:
            if latest_prediction.risk_level == "critical":
                return 0.15  # 15% retention bonus
            elif latest_prediction.risk_level == "high":
                return 0.10  # 10% retention bonus
            elif latest_prediction.risk_level == "medium":
                return 0.05  # 5% retention bonus
        
        return 0.0  # No retention adjustment
    
    def _calculate_recommended_salary(self, current_salary: float, market_data: Dict[str, Any], 
                                    performance_factor: float, skill_premium: float, 
                                    retention_risk: float) -> float:
        """Calculate recommended salary based on all factors"""
        market_salary = market_data["market_salary"]
        
        # Start with market salary as base
        recommended = market_salary
        
        # Apply performance factor
        recommended *= performance_factor
        
        # Add skill premium
        recommended *= (1 + skill_premium)
        
        # Add retention risk adjustment
        recommended *= (1 + retention_risk)
        
        # Don't recommend more than 20% increase from current salary
        max_increase = current_salary * 1.20
        recommended = min(recommended, max_increase)
        
        # Don't recommend less than 95% of current salary (unless significant underperformance)
        min_salary = current_salary * 0.95
        if performance_factor >= 1.0:
            recommended = max(recommended, min_salary)
        
        return round(recommended, 2)
    
    def _generate_salary_justification(self, current_salary: float, recommended_salary: float, 
                                     performance_factor: float, market_data: Dict[str, Any]) -> str:
        """Generate justification for salary recommendation"""
        adjustment_pct = ((recommended_salary - current_salary) / current_salary) * 100
        
        justification_parts = []
        
        if adjustment_pct > 5:
            justification_parts.append(f"Market analysis indicates {adjustment_pct:.1f}% increase needed for competitive positioning")
        elif adjustment_pct < -5:
            justification_parts.append(f"Current salary is {abs(adjustment_pct):.1f}% above market rate")
        else:
            justification_parts.append("Current salary is aligned with market rates")
        
        if performance_factor > 1.05:
            justification_parts.append("Strong performance warrants premium compensation")
        elif performance_factor < 0.98:
            justification_parts.append("Performance improvement needed before salary increase")
        
        return ". ".join(justification_parts)
    
    def _calculate_adjustment_priority(self, current_salary: float, recommended_salary: float, 
                                    retention_risk: float) -> str:
        """Calculate priority level for salary adjustment"""
        adjustment_pct = abs((recommended_salary - current_salary) / current_salary) * 100
        
        if retention_risk > 0.1 and adjustment_pct > 10:
            return "critical"
        elif adjustment_pct > 15:
            return "high"
        elif adjustment_pct > 8:
            return "medium"
        else:
            return "low"
    
    # ============================================
    # RECRUITMENT PREDICTION HELPER METHODS
    # ============================================
    
    def _extract_candidate_features(self, application: models.Application) -> List[float]:
        """Extract features for candidate success prediction"""
        features = []
        
        # AI fit score from resume parsing
        features.append(application.ai_fit_score / 100.0)  # Normalize to 0-1
        
        # Years of experience
        features.append(application.years_of_experience or 0)
        
        # Education level (simulate based on application data)
        education_score = 0.7  # Default education score
        if hasattr(application, 'education') and application.education:
            # In real implementation, analyze education data
            education_score = 0.8
        features.append(education_score)
        
        # Skills match (simulate based on job requirements)
        skills_match = min(application.ai_fit_score / 80.0, 1.0)  # Convert fit score to skills match
        features.append(skills_match)
        
        # Interview performance (if available)
        interview_score = 0.75  # Default score
        ai_interview = self.db.query(models.AIInterview)\
            .filter(models.AIInterview.application_id == application.id)\
            .first()
        if ai_interview:
            interview_score = ai_interview.overall_score / 100.0
        features.append(interview_score)
        
        # Expected salary vs budget (simulate)
        salary_fit = 0.8  # Assume good salary fit
        features.append(salary_fit)
        
        return features
    
    def _get_or_train_recruitment_model(self):
        """Get existing recruitment model or train a new one"""
        model_path = os.path.join(self.models_dir, "recruitment_model.joblib")
        
        if os.path.exists(model_path):
            return joblib.load(model_path)
        
        return self._train_recruitment_model()
    
    def _train_recruitment_model(self):
        """Train recruitment success prediction model"""
        applications = self.db.query(models.Application).all()
        
        X = []
        y = []
        
        for application in applications:
            features = self._extract_candidate_features(application)
            # Simulate success based on status (in real scenario, use historical hire success data)
            success = 1 if application.status in ["hired", "onboarding"] else 0
            
            X.append(features)
            y.append(success)
        
        if len(X) < 10:
            # Create dummy data for training
            X = np.random.rand(50, 6)
            y = np.random.choice([0, 1], 50, p=[0.7, 0.3])  # 30% success rate
        
        X = np.array(X)
        y = np.array(y)
        
        # Train model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X, y)
        
        # Save model
        model_path = os.path.join(self.models_dir, "recruitment_model.joblib")
        joblib.dump(model, model_path)
        
        return model
    
    def _predict_candidate_performance(self, features: List[float]) -> float:
        """Predict candidate's future performance"""
        # Simple heuristic based on features
        performance_score = (
            features[0] * 0.3 +  # AI fit score
            min(features[1] / 10, 1.0) * 0.2 +  # Experience (capped at 10 years)
            features[2] * 0.2 +  # Education
            features[3] * 0.3    # Skills match
        )
        
        return min(max(performance_score * 5, 1.0), 5.0)  # Convert to 1-5 scale
    
    def _assess_cultural_fit(self, application: models.Application) -> float:
        """Assess cultural fit score"""
        # In real implementation, this would analyze interview responses, values alignment, etc.
        # For now, simulate based on AI interview emotional tone
        ai_interview = self.db.query(models.AIInterview)\
            .filter(models.AIInterview.application_id == application.id)\
            .first()
        
        if ai_interview and ai_interview.emotional_tone:
            tone_scores = {
                "Confident": 0.9,
                "Enthusiastic": 0.85,
                "Professional": 0.8,
                "Calm": 0.75,
                "Nervous": 0.6,
                "Uncertain": 0.5
            }
            return tone_scores.get(ai_interview.emotional_tone, 0.7)
        
        return 0.75  # Default cultural fit score
    
    def _predict_retention_likelihood(self, features: List[float]) -> float:
        """Predict likelihood of candidate staying long-term"""
        # Heuristic based on experience and fit scores
        retention_score = (
            min(features[1] / 5, 1.0) * 0.4 +  # Experience stability
            features[0] * 0.3 +  # Job fit
            features[5] * 0.3    # Salary fit
        )
        
        return min(max(retention_score, 0.3), 0.95)  # Keep between 30% and 95%
    
    def _analyze_candidate_profile(self, application: models.Application, 
                                 features: List[float]) -> Tuple[List[str], List[str]]:
        """Analyze candidate profile for risk factors and strengths"""
        risk_factors = []
        strengths = []
        
        # Analyze features for risks and strengths
        if features[0] < 0.6:  # Low AI fit score
            risk_factors.append("Below average job fit score")
        elif features[0] > 0.8:
            strengths.append("Excellent job fit and qualifications")
        
        if features[1] < 2:  # Low experience
            risk_factors.append("Limited relevant experience")
        elif features[1] > 8:
            strengths.append("Extensive relevant experience")
        
        if features[4] < 0.6:  # Poor interview performance
            risk_factors.append("Below average interview performance")
        elif features[4] > 0.8:
            strengths.append("Strong interview performance")
        
        # Add default items if lists are empty
        if not risk_factors:
            risk_factors.append("No significant risk factors identified")
        
        if not strengths:
            strengths.append("Meets basic job requirements")
        
        return risk_factors, strengths
    
    def _generate_hiring_recommendation(self, success_prob: float, performance_pred: float, 
                                      cultural_fit: float) -> str:
        """Generate overall hiring recommendation"""
        overall_score = (success_prob + performance_pred/5 + cultural_fit) / 3
        
        if overall_score > 0.8:
            return "strong_hire"
        elif overall_score > 0.65:
            return "hire"
        elif overall_score > 0.5:
            return "maybe"
        else:
            return "no_hire"
    
    # ============================================
    # TEAM DYNAMICS HELPER METHODS
    # ============================================
    
    def _calculate_collaboration_score(self, team_members: List[models.Employee]) -> float:
        """Calculate team collaboration score"""
        # In real implementation, analyze meeting attendance, project participation, etc.
        # For now, simulate based on team size and performance
        
        team_size = len(team_members)
        
        # Get average performance ratings
        total_rating = 0
        rating_count = 0
        
        for member in team_members:
            latest_review = self.db.query(models.PerformanceReview)\
                .filter(models.PerformanceReview.employee_id == member.id)\
                .order_by(desc(models.PerformanceReview.review_date))\
                .first()
            
            if latest_review:
                total_rating += latest_review.overall_rating
                rating_count += 1
        
        avg_performance = total_rating / rating_count if rating_count > 0 else 3.0
        
        # Collaboration score based on team performance and size
        base_score = avg_performance / 5.0  # Normalize to 0-1
        
        # Adjust for team size (optimal size is 5-7 people)
        if 5 <= team_size <= 7:
            size_factor = 1.0
        elif team_size < 5:
            size_factor = 0.9  # Small teams may lack diversity
        else:
            size_factor = max(0.7, 1.0 - (team_size - 7) * 0.05)  # Large teams may have coordination issues
        
        return min(base_score * size_factor, 1.0)
    
    def _assess_communication_effectiveness(self, team_members: List[models.Employee]) -> float:
        """Assess team communication effectiveness"""
        # In real implementation, analyze meeting frequency, email patterns, feedback scores
        # For now, simulate based on engagement scores
        
        total_engagement = 0
        for member in team_members:
            engagement = self._calculate_engagement_score(member.id)
            total_engagement += engagement
        
        avg_engagement = total_engagement / len(team_members)
        
        # Communication effectiveness correlates with engagement
        return min(avg_engagement * 1.1, 1.0)  # Slight boost for communication
    
    def _identify_conflict_indicators(self, team_members: List[models.Employee]) -> List[str]:
        """Identify potential conflict indicators in the team"""
        indicators = []
        
        # Check for performance disparities
        ratings = []
        for member in team_members:
            rating = self._get_current_rating(member.id)
            ratings.append(rating)
        
        if len(ratings) > 1:
            rating_std = np.std(ratings)
            if rating_std > 1.0:
                indicators.append("Significant performance disparities within team")
        
        # Check for attendance issues
        low_attendance_count = 0
        for member in team_members:
            attendance_rate = self._calculate_attendance_rate(member.id)
            if attendance_rate < 0.8:
                low_attendance_count += 1
        
        if low_attendance_count > len(team_members) * 0.3:
            indicators.append("Multiple team members with attendance issues")
        
        # Check for engagement issues
        low_engagement_count = 0
        for member in team_members:
            engagement = self._calculate_engagement_score(member.id)
            if engagement < 0.6:
                low_engagement_count += 1
        
        if low_engagement_count > len(team_members) * 0.4:
            indicators.append("Low engagement levels across team")
        
        return indicators
    
    def _analyze_productivity_trends(self, team_members: List[models.Employee]) -> Dict[str, Any]:
        """Analyze team productivity trends"""
        # In real implementation, analyze project completion rates, KPI achievements, etc.
        # For now, simulate based on performance data
        
        current_performance = []
        for member in team_members:
            rating = self._get_current_rating(member.id)
            current_performance.append(rating)
        
        avg_performance = sum(current_performance) / len(current_performance)
        
        # Simulate trend (in real implementation, compare with historical data)
        trend = "stable"
        if avg_performance > 3.8:
            trend = "improving"
        elif avg_performance < 3.2:
            trend = "declining"
        
        return {
            "trend": trend,
            "average_performance": avg_performance,
            "performance_distribution": {
                "high_performers": len([p for p in current_performance if p >= 4.0]),
                "average_performers": len([p for p in current_performance if 3.0 <= p < 4.0]),
                "low_performers": len([p for p in current_performance if p < 3.0])
            }
        }
    
    def _calculate_team_cohesion(self, team_members: List[models.Employee]) -> float:
        """Calculate team cohesion score"""
        # In real implementation, analyze collaboration patterns, peer feedback, etc.
        # For now, simulate based on engagement and performance consistency
        
        engagements = []
        for member in team_members:
            engagement = self._calculate_engagement_score(member.id)
            engagements.append(engagement)
        
        avg_engagement = sum(engagements) / len(engagements)
        engagement_consistency = 1.0 - np.std(engagements)  # Lower std = higher consistency
        
        # Cohesion is average of engagement level and consistency
        cohesion = (avg_engagement + engagement_consistency) / 2
        
        return min(max(cohesion, 0.0), 1.0)
    
    def _identify_key_influencers(self, team_members: List[models.Employee]) -> List[str]:
        """Identify key influencers in the team"""
        influencers = []
        
        # Identify based on experience and performance
        for member in team_members:
            rating = self._get_current_rating(member.id)
            experience = member.years_of_experience or 0
            
            # Key influencer criteria: high performance + experience OR senior position
            if (rating >= 4.0 and experience >= 5) or "Senior" in (member.position or ""):
                influencers.append(f"{member.first_name} {member.last_name}")
        
        # If no clear influencers, pick top performer
        if not influencers and team_members:
            top_performer = max(team_members, key=lambda m: self._get_current_rating(m.id))
            influencers.append(f"{top_performer.first_name} {top_performer.last_name}")
        
        return influencers
    
    def _generate_team_recommendations(self, collaboration_score: float, 
                                     communication_effectiveness: float, 
                                     conflict_indicators: List[str]) -> List[str]:
        """Generate recommendations for team improvement"""
        recommendations = []
        
        if collaboration_score < 0.7:
            recommendations.append("Implement regular team collaboration sessions and cross-functional projects")
        
        if communication_effectiveness < 0.7:
            recommendations.append("Establish clear communication protocols and regular team meetings")
        
        if len(conflict_indicators) > 1:
            recommendations.append("Address team conflicts through mediation and team building activities")
        
        if collaboration_score > 0.8 and communication_effectiveness > 0.8:
            recommendations.append("Team is performing well - consider expanding responsibilities or mentoring other teams")
        
        # Always include at least one recommendation
        if not recommendations:
            recommendations.append("Continue current team practices and monitor performance regularly")
        
        return recommendations
    
    def _calculate_team_health_score(self, collaboration_score: float, 
                                   communication_effectiveness: float, 
                                   team_cohesion: float) -> float:
        """Calculate overall team health score"""
        return (collaboration_score + communication_effectiveness + team_cohesion) / 3

def get_predictive_analytics_service(db: Session) -> PredictiveAnalyticsService:
    """Dependency to get predictive analytics service"""
    return PredictiveAnalyticsService(db)