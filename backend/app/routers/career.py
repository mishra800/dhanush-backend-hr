from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from app import database, models, schemas
from app.dependencies import get_current_user
from datetime import datetime, timedelta
import json

router = APIRouter(
    prefix="/career",
    tags=["career"]
)

@router.get("/jobs", response_model=List[schemas.JobOut])
def get_public_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    # In a real app, we might filter by is_active=True specifically for public view
    jobs = db.query(models.Job).filter(models.Job.is_active == True).offset(skip).limit(limit).all()
    return jobs

@router.get("/dashboard")
def get_career_dashboard(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive career dashboard data for employee"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # Calculate career score based on various factors
    career_score = calculate_career_score(employee, db)
    
    # Get career level and progression
    career_level = determine_career_level(employee)
    
    # Calculate skills mastery
    skills_mastery = calculate_skills_mastery(employee, db)
    
    # Get time in current role
    time_in_role = calculate_time_in_role(employee)
    
    # Get recent achievements
    recent_achievements = get_recent_achievements(employee, db)
    
    # Get career pathways
    career_pathways = generate_career_pathways(employee, db)
    
    # Get skills assessment
    skills_data = get_skills_assessment(employee, db)
    
    # Get career goals
    career_goals = get_career_goals(employee, db)
    
    # Get available mentors
    available_mentors = get_available_mentors(db)
    
    # Get internal opportunities
    internal_opportunities = get_internal_opportunities(employee, db)
    
    return {
        "career_score": career_score,
        "current_level": career_level["current"],
        "next_level": career_level["next"],
        "skills_mastery": skills_mastery,
        "time_in_role": time_in_role,
        "recent_achievements": recent_achievements,
        "career_pathways": career_pathways,
        "skills": skills_data,
        "career_goals": career_goals,
        "available_mentors": available_mentors,
        "internal_opportunities": internal_opportunities
    }

@router.get("/path-recommendation/{employee_id}")
def get_career_path(employee_id: int, db: Session = Depends(database.get_db)):
    """Enhanced AI Career Path Recommendation with detailed analysis"""
    
    employee = db.query(models.Employee).filter(models.Employee.id == employee_id).first()
    current_role = employee.position if employee else "Software Engineer"
    
    # Enhanced recommendations based on role, skills, and performance
    recommendations = generate_enhanced_career_recommendations(employee, db)
        
    return {
        "current_role": current_role,
        "recommendations": recommendations,
        "career_analysis": analyze_career_trajectory(employee, db),
        "skill_gaps": identify_skill_gaps(employee, db),
        "market_insights": get_market_insights(current_role)
    }

@router.post("/goals")
def create_career_goal(
    goal_data: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new career goal"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # Create career goal record (would need CareerGoal model)
    goal = {
        "employee_id": employee.id,
        "title": goal_data["title"],
        "description": goal_data["description"],
        "category": goal_data["category"],
        "target_date": goal_data["target_date"],
        "status": "active",
        "progress": 0,
        "created_at": datetime.utcnow()
    }
    
    # In production, save to database
    return {"success": True, "message": "Career goal created successfully", "goal_id": 1}

@router.get("/skills-assessment")
def get_skills_assessment(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get detailed skills assessment for employee"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    return get_skills_assessment(employee, db)

@router.post("/mentorship/request")
def request_mentorship(
    mentor_id: int,
    message: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Request mentorship from a mentor"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # Create mentorship request (would need MentorshipRequest model)
    return {"success": True, "message": "Mentorship request sent successfully"}

@router.get("/opportunities/internal")
def get_internal_job_opportunities(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get internal job opportunities matched to employee profile"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    return get_internal_opportunities(employee, db)

@router.post("/opportunities/{opportunity_id}/apply")
def apply_internal_opportunity(
    opportunity_id: int,
    application_data: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Apply for internal job opportunity"""
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee profile not found")
    
    # Create internal application (would integrate with recruitment system)
    return {"success": True, "message": "Application submitted successfully"}

@router.get("/analytics")
def get_career_analytics(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get career analytics and insights for admin users"""
    
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(status_code=403, detail="Only admin or HR can view career analytics")
    
    # Get career progression analytics
    return {
        "total_employees": db.query(models.Employee).count(),
        "career_progression_stats": get_career_progression_stats(db),
        "skills_gap_analysis": get_organization_skills_gaps(db),
        "mentorship_program_stats": get_mentorship_stats(db),
        "internal_mobility_rate": calculate_internal_mobility_rate(db),
        "career_satisfaction_score": get_career_satisfaction_score(db)
    }

# Helper functions

def calculate_career_score(employee: models.Employee, db: Session) -> int:
    """Calculate overall career score based on multiple factors"""
    score = 50  # Base score
    
    # Add points for tenure
    if employee.date_of_joining:
        years_of_service = (datetime.utcnow() - employee.date_of_joining).days / 365
        score += min(years_of_service * 5, 20)  # Max 20 points for tenure
    
    # Add points for performance (mock data)
    score += 15  # Mock performance score
    
    # Add points for skills development (mock data)
    score += 10  # Mock skills score
    
    return min(int(score), 100)

def determine_career_level(employee: models.Employee) -> Dict:
    """Determine current and next career level"""
    current_role = employee.position or "Employee"
    
    level_mapping = {
        "Junior": {"current": "Junior Level", "next": "Mid Level"},
        "Senior": {"current": "Senior Level", "next": "Lead Level"},
        "Lead": {"current": "Lead Level", "next": "Manager Level"},
        "Manager": {"current": "Manager Level", "next": "Senior Manager"},
        "Director": {"current": "Director Level", "next": "VP Level"}
    }
    
    for key, value in level_mapping.items():
        if key.lower() in current_role.lower():
            return value
    
    return {"current": "Mid Level", "next": "Senior Level"}

def calculate_skills_mastery(employee: models.Employee, db: Session) -> int:
    """Calculate overall skills mastery percentage"""
    # Mock calculation - in production, this would analyze actual skill assessments
    return 75

def calculate_time_in_role(employee: models.Employee) -> str:
    """Calculate time in current role"""
    if employee.date_of_joining:
        years = (datetime.utcnow() - employee.date_of_joining).days / 365
        return f"{years:.1f}"
    return "0.0"

def get_recent_achievements(employee: models.Employee, db: Session) -> List[Dict]:
    """Get recent achievements for employee"""
    # Mock data - in production, this would come from performance reviews, learning records, etc.
    return [
        {
            "title": "Completed Advanced React Course",
            "date": "2024-01-10",
            "type": "learning"
        },
        {
            "title": "Led successful project delivery",
            "date": "2024-01-05",
            "type": "performance"
        },
        {
            "title": "Mentored 2 junior developers",
            "date": "2023-12-20",
            "type": "leadership"
        }
    ]

def generate_career_pathways(employee: models.Employee, db: Session) -> List[Dict]:
    """Generate AI-powered career pathways"""
    current_role = employee.position or "Software Engineer"
    
    pathways = []
    
    if "Engineer" in current_role or "Developer" in current_role:
        pathways.extend([
            {
                "id": 1,
                "title": "Technical Leadership Track",
                "description": "Progress from Senior Developer to Tech Lead to Engineering Manager",
                "steps": [
                    {"role": "Senior Software Engineer", "timeframe": "6-12 months", "current": True},
                    {"role": "Tech Lead", "timeframe": "12-18 months", "current": False},
                    {"role": "Engineering Manager", "timeframe": "24-36 months", "current": False}
                ],
                "match_score": 85,
                "required_skills": ["Leadership", "System Design", "Team Management"]
            },
            {
                "id": 2,
                "title": "Technical Specialist Track",
                "description": "Become a domain expert and technical architect",
                "steps": [
                    {"role": "Senior Software Engineer", "timeframe": "6-12 months", "current": True},
                    {"role": "Principal Engineer", "timeframe": "18-24 months", "current": False},
                    {"role": "Distinguished Engineer", "timeframe": "36-48 months", "current": False}
                ],
                "match_score": 78,
                "required_skills": ["Advanced Architecture", "Domain Expertise", "Technical Mentoring"]
            }
        ])
    
    return pathways

def get_skills_assessment(employee: models.Employee, db: Session) -> List[Dict]:
    """Get skills assessment data"""
    # Mock data - in production, this would come from skill assessments, peer reviews, etc.
    return [
        {"name": "React/Frontend", "current": 85, "target": 95, "category": "Technical"},
        {"name": "System Design", "current": 60, "target": 85, "category": "Technical"},
        {"name": "Leadership", "current": 45, "target": 75, "category": "Soft Skills"},
        {"name": "Project Management", "current": 55, "target": 80, "category": "Management"}
    ]

def get_career_goals(employee: models.Employee, db: Session) -> List[Dict]:
    """Get career goals for employee"""
    # Mock data - in production, this would come from career_goals table
    return [
        {
            "id": 1,
            "title": "Complete System Design Course",
            "description": "Master advanced system design patterns and architecture",
            "category": "skill",
            "target_date": "2024-03-15",
            "progress": 65,
            "status": "in_progress"
        },
        {
            "id": 2,
            "title": "Lead a Cross-functional Project",
            "description": "Successfully lead a project involving multiple teams",
            "category": "experience",
            "target_date": "2024-06-30",
            "progress": 30,
            "status": "in_progress"
        }
    ]

def get_available_mentors(db: Session) -> List[Dict]:
    """Get available mentors"""
    # Mock data - in production, this would come from mentors table
    return [
        {
            "id": 1,
            "name": "Sarah Johnson",
            "role": "Senior Engineering Manager",
            "expertise": ["Leadership", "System Design", "Team Building"],
            "experience": "8 years",
            "rating": 4.9,
            "availability": "Available"
        },
        {
            "id": 2,
            "name": "Michael Chen",
            "role": "Principal Engineer",
            "expertise": ["Architecture", "Performance", "Mentoring"],
            "experience": "12 years",
            "rating": 4.8,
            "availability": "Limited"
        }
    ]

def get_internal_opportunities(employee: models.Employee, db: Session) -> List[Dict]:
    """Get internal job opportunities matched to employee"""
    # Get active internal jobs and calculate match scores
    jobs = db.query(models.Job).filter(
        models.Job.is_active == True,
        models.Job.is_internal == True  # Assuming there's an is_internal field
    ).all()
    
    opportunities = []
    for job in jobs:
        match_score = calculate_job_match_score(employee, job)
        if match_score > 50:  # Only show relevant opportunities
            opportunities.append({
                "id": job.id,
                "title": job.title,
                "department": job.department,
                "location": job.location,
                "type": "Full-time",
                "match_score": match_score,
                "posted_date": job.posted_date.isoformat(),
                "application_deadline": (job.posted_date + timedelta(days=30)).isoformat(),
                "skills_match": ["React", "TypeScript"],  # Mock data
                "skills_gap": ["GraphQL"],  # Mock data
                "description": job.description
            })
    
    return opportunities

def calculate_job_match_score(employee: models.Employee, job: models.Job) -> int:
    """Calculate how well an employee matches a job"""
    # Mock calculation - in production, this would analyze skills, experience, etc.
    return 85

def generate_enhanced_career_recommendations(employee: models.Employee, db: Session) -> List[Dict]:
    """Generate enhanced career recommendations with detailed analysis"""
    current_role = employee.position or "Software Engineer"
    
    recommendations = []
    
    if "Engineer" in current_role or "Developer" in current_role:
        recommendations = [
            {
                "target_role": "Senior Software Engineer",
                "timeframe": "6-12 Months",
                "match_score": 85,
                "skill_gaps": ["System Design", "Cloud Architecture (AWS)", "Leadership Fundamentals"],
                "learning_path": [
                    "Advanced System Design Course",
                    "AWS Certified Solutions Architect",
                    "Technical Leadership Bootcamp"
                ],
                "estimated_salary_increase": "15-25%",
                "market_demand": "High",
                "internal_openings": 3
            },
            {
                "target_role": "Team Lead",
                "timeframe": "12-18 Months",
                "match_score": 70,
                "skill_gaps": ["Leadership", "Project Management", "Mentoring", "Stakeholder Communication"],
                "learning_path": [
                    "Leadership 101",
                    "Agile Project Management",
                    "Effective Communication for Engineers"
                ],
                "estimated_salary_increase": "20-30%",
                "market_demand": "Medium",
                "internal_openings": 1
            }
        ]
    
    return recommendations

def analyze_career_trajectory(employee: models.Employee, db: Session) -> Dict:
    """Analyze employee's career trajectory"""
    return {
        "career_velocity": "Above Average",
        "promotion_readiness": 75,
        "skill_development_rate": "Fast",
        "leadership_potential": "High",
        "recommended_next_step": "Focus on system design and leadership skills"
    }

def identify_skill_gaps(employee: models.Employee, db: Session) -> List[Dict]:
    """Identify skill gaps for career advancement"""
    return [
        {
            "skill": "System Design",
            "current_level": 60,
            "required_level": 85,
            "priority": "High",
            "learning_resources": ["System Design Interview Course", "Designing Data-Intensive Applications"]
        },
        {
            "skill": "Leadership",
            "current_level": 45,
            "required_level": 75,
            "priority": "Medium",
            "learning_resources": ["Leadership Fundamentals", "Managing Technical Teams"]
        }
    ]

def get_market_insights(role: str) -> Dict:
    """Get market insights for a role"""
    return {
        "average_salary": "$95,000 - $130,000",
        "job_growth_rate": "15% (Much faster than average)",
        "in_demand_skills": ["React", "Node.js", "AWS", "System Design"],
        "market_trends": [
            "Increased demand for full-stack capabilities",
            "Growing importance of cloud architecture skills",
            "Leadership skills becoming more valued"
        ]
    }

def get_career_progression_stats(db: Session) -> Dict:
    """Get career progression statistics"""
    return {
        "average_promotion_time": "18 months",
        "internal_promotion_rate": "65%",
        "skill_development_completion_rate": "78%",
        "career_satisfaction_score": 4.2
    }

def get_organization_skills_gaps(db: Session) -> List[Dict]:
    """Get organization-wide skills gap analysis"""
    return [
        {"skill": "Cloud Architecture", "gap_percentage": 45, "employees_affected": 23},
        {"skill": "Leadership", "gap_percentage": 38, "employees_affected": 31},
        {"skill": "Data Science", "gap_percentage": 52, "employees_affected": 18}
    ]

def get_mentorship_stats(db: Session) -> Dict:
    """Get mentorship program statistics"""
    return {
        "active_mentorships": 15,
        "available_mentors": 8,
        "mentorship_satisfaction": 4.6,
        "career_advancement_rate": "85% of mentees advance within 2 years"
    }

def calculate_internal_mobility_rate(db: Session) -> float:
    """Calculate internal mobility rate"""
    return 23.5  # Percentage

def get_career_satisfaction_score(db: Session) -> float:
    """Get overall career satisfaction score"""
    return 4.3  # Out of 5
