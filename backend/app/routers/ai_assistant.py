from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from ..database import get_db
from ..models import *
from ..dependencies import get_current_user
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json
from datetime import datetime, timedelta, date
import re
from collections import defaultdict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-assistant", tags=["AI Assistant"])

class ChatMessage(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = {}
    history: Optional[List[Dict[str, Any]]] = []

class ChatResponse(BaseModel):
    response: str
    data: Optional[dict] = None
    suggestions: Optional[List[str]] = []
    actions: Optional[List[Dict[str, Any]]] = []
    confidence: Optional[float] = None
    intent: Optional[str] = None

class AIAssistantService:
    def __init__(self, db: Session, current_user: User):
        self.db = db
        self.current_user = current_user
        self.intent_patterns = self._initialize_intent_patterns()
        
    def _initialize_intent_patterns(self):
        """Initialize intent recognition patterns"""
        return {
            'leave_balance': [
                r'leave.*balance', r'remaining.*leave', r'how.*many.*leave',
                r'vacation.*days', r'pto.*balance', r'time.*off.*left'
            ],
            'leave_request': [
                r'apply.*leave', r'request.*leave', r'take.*leave',
                r'book.*vacation', r'submit.*leave'
            ],
            'leave_status': [
                r'leave.*status', r'leave.*approved', r'leave.*pending',
                r'vacation.*status', r'time.*off.*status'
            ],
            'attendance_today': [
                r'attendance.*today', r'checked.*in', r'today.*attendance',
                r'work.*today', r'present.*today'
            ],
            'attendance_history': [
                r'attendance.*history', r'past.*attendance', r'attendance.*record',
                r'working.*hours', r'attendance.*summary'
            ],
            'wfh_request': [
                r'work.*from.*home', r'wfh.*request', r'remote.*work',
                r'home.*office', r'work.*remotely'
            ],
            'payroll_current': [
                r'current.*salary', r'this.*month.*salary', r'latest.*payslip',
                r'recent.*pay', r'current.*pay'
            ],
            'payroll_history': [
                r'salary.*history', r'past.*payslips', r'previous.*salary',
                r'payroll.*records', r'pay.*history'
            ],
            'tax_info': [
                r'tax.*deduction', r'income.*tax', r'tds.*amount',
                r'tax.*calculation', r'tax.*details'
            ],
            'pf_info': [
                r'pf.*amount', r'provident.*fund', r'pf.*balance',
                r'epf.*contribution', r'retirement.*fund'
            ],
            'job_search': [
                r'job.*opening', r'available.*position', r'hiring.*now',
                r'career.*opportunity', r'new.*job'
            ],
            'employee_count': [
                r'how.*many.*employee', r'total.*employee', r'employee.*count',
                r'team.*size', r'staff.*count'
            ],
            'performance_review': [
                r'performance.*review', r'appraisal.*result', r'rating.*score',
                r'feedback.*received', r'review.*status'
            ],
            'goals_progress': [
                r'goal.*progress', r'objective.*status', r'target.*achievement',
                r'kpi.*performance', r'milestone.*reached'
            ],
            'learning_progress': [
                r'course.*progress', r'training.*status', r'learning.*path',
                r'skill.*development', r'certification.*progress'
            ],
            'asset_info': [
                r'my.*laptop', r'assigned.*asset', r'equipment.*list',
                r'device.*information', r'hardware.*assigned'
            ],
            'announcement_recent': [
                r'recent.*announcement', r'latest.*news', r'company.*update',
                r'new.*announcement', r'what.*new'
            ],
            'help_general': [
                r'help.*me', r'what.*can.*you.*do', r'how.*to.*use',
                r'assistance.*needed', r'support.*required'
            ]
        }
    
    def get_employee_data(self):
        """Get current user's employee data with caching"""
        if not hasattr(self, '_employee_cache'):
            self._employee_cache = self.db.query(Employee).filter(
                Employee.user_id == self.current_user.id
            ).first()
        return self._employee_cache
    
    def detect_intent(self, message: str, context: Dict = None) -> tuple:
        """Advanced intent detection with confidence scoring"""
        message_lower = message.lower()
        intent_scores = {}
        
        # Pattern-based intent detection
        for intent, patterns in self.intent_patterns.items():
            score = 0
            for pattern in patterns:
                if re.search(pattern, message_lower):
                    score += 1
            if score > 0:
                intent_scores[intent] = score / len(patterns)
        
        # Context-based intent enhancement
        if context:
            if context.get('page') == '/leave':
                intent_scores['leave_balance'] = intent_scores.get('leave_balance', 0) + 0.3
                intent_scores['leave_request'] = intent_scores.get('leave_request', 0) + 0.3
            elif context.get('page') == '/attendance':
                intent_scores['attendance_today'] = intent_scores.get('attendance_today', 0) + 0.3
            elif context.get('page') == '/payroll':
                intent_scores['payroll_current'] = intent_scores.get('payroll_current', 0) + 0.3
        
        # Get best intent
        if intent_scores:
            best_intent = max(intent_scores.items(), key=lambda x: x[1])
            return best_intent[0], best_intent[1]
        
        return 'help_general', 0.5
    
    def analyze_message(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Enhanced message analysis with intent detection and context awareness"""
        try:
            # Detect intent
            intent, confidence = self.detect_intent(message, context)
            
            # Route to appropriate handler
            handler_map = {
                'leave_balance': self.handle_leave_balance,
                'leave_request': self.handle_leave_request_guidance,
                'leave_status': self.handle_leave_status,
                'attendance_today': self.handle_attendance_today,
                'attendance_history': self.handle_attendance_history,
                'wfh_request': self.handle_wfh_guidance,
                'payroll_current': self.handle_payroll_current,
                'payroll_history': self.handle_payroll_history,
                'tax_info': self.handle_tax_info,
                'pf_info': self.handle_pf_info,
                'job_search': self.handle_job_search,
                'employee_count': self.handle_employee_count,
                'performance_review': self.handle_performance_review,
                'goals_progress': self.handle_goals_progress,
                'learning_progress': self.handle_learning_progress,
                'asset_info': self.handle_asset_info,
                'announcement_recent': self.handle_announcements,
                'help_general': self.handle_help_general
            }
            
            handler = handler_map.get(intent, self.handle_help_general)
            response = handler(message, context, history)
            
            # Add intent and confidence to response
            response.intent = intent
            response.confidence = confidence
            
            # Add contextual suggestions if not provided
            if not response.suggestions:
                response.suggestions = self.get_contextual_suggestions(intent, context)
            
            return response
            
        except Exception as e:
            logger.error(f"Error analyzing message: {str(e)}")
            return ChatResponse(
                response="I encountered an error processing your request. Please try again or contact support.",
                intent="error",
                confidence=0.0
            )
    
    def handle_leave_balance(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Enhanced leave balance handler with detailed breakdown"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(
                response="I couldn't find your employee profile. Please contact HR for assistance.",
                suggestions=["Contact HR", "Check profile", "Login again"]
            )
        
        # Get leave balances with detailed breakdown
        leave_balances = self.db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee.id
        ).all()
        
        # Get leave policy information
        leave_policies = self.db.query(LeavePolicy).all()
        policy_map = {policy.leave_type: policy for policy in leave_policies}
        
        if not leave_balances:
            return ChatResponse(
                response="No leave balance information found. Your leave balances may not be initialized yet. Please contact HR.",
                suggestions=["Contact HR", "Check leave policy", "Apply for leave"],
                actions=[{"type": "contact_hr", "label": "Contact HR"}]
            )
        
        # Build detailed response
        response_parts = ["📊 **Your Leave Balance Summary:**\n"]
        total_balance = 0
        balance_data = []
        
        for balance in leave_balances:
            policy = policy_map.get(balance.leave_type)
            annual_quota = policy.annual_quota if policy else "N/A"
            
            response_parts.append(
                f"• **{balance.leave_type.title()}**: {balance.balance} days remaining"
            )
            if annual_quota != "N/A":
                used = annual_quota - balance.balance
                response_parts.append(f"  (Used: {used}/{annual_quota} days)")
            
            total_balance += balance.balance
            balance_data.append({
                "type": balance.leave_type,
                "balance": balance.balance,
                "annual_quota": annual_quota,
                "used": annual_quota - balance.balance if annual_quota != "N/A" else 0
            })
        
        response_parts.append(f"\n🎯 **Total Available**: {total_balance} days")
        
        # Add usage recommendations
        if total_balance > 10:
            response_parts.append("\n💡 **Tip**: You have a good leave balance. Consider planning a vacation!")
        elif total_balance < 5:
            response_parts.append("\n⚠️ **Note**: Your leave balance is running low. Plan your time off carefully.")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "leave_balances": balance_data,
                "total_balance": total_balance
            },
            suggestions=[
                "Apply for leave",
                "Check leave policy", 
                "View leave history",
                "Plan vacation"
            ],
            actions=[
                {"type": "apply_leave", "label": "Apply for Leave", "url": "/leave"},
                {"type": "view_policy", "label": "View Leave Policy"}
            ]
        )
    
    def handle_leave_request_guidance(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Guide user through leave request process"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Please contact HR for leave request assistance.")
        
        # Check for pending requests
        pending_requests = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee.id,
            LeaveRequest.status == 'pending'
        ).count()
        
        response_parts = ["📝 **Leave Request Process:**\n"]
        
        if pending_requests > 0:
            response_parts.append(f"⏳ You have {pending_requests} pending leave request(s).\n")
        
        response_parts.extend([
            "**Steps to apply for leave:**",
            "1. Go to Leave Management section",
            "2. Click 'Apply for Leave'", 
            "3. Select leave type and dates",
            "4. Add reason (optional but recommended)",
            "5. Submit for manager approval",
            "",
            "**Tips for faster approval:**",
            "• Apply at least 2 days in advance",
            "• Provide clear reason for urgent requests",
            "• Check team calendar for conflicts",
            "• Ensure adequate leave balance"
        ])
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={"pending_requests": pending_requests},
            suggestions=[
                "Check leave balance",
                "View pending requests",
                "Leave policy details",
                "Contact manager"
            ],
            actions=[
                {"type": "apply_leave", "label": "Apply for Leave Now", "url": "/leave"},
                {"type": "check_balance", "label": "Check Balance"}
            ]
        )
    
    def handle_attendance_today(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Enhanced today's attendance with detailed information"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get today's attendance
        today = date.today()
        today_attendance = self.db.query(Attendance).filter(
            and_(
                Attendance.employee_id == employee.id,
                func.date(Attendance.date) == today
            )
        ).first()
        
        # Get WFH status for today
        wfh_request = self.db.query(WFHRequest).filter(
            WFHRequest.employee_id == employee.id,
            WFHRequest.request_date == today,
            WFHRequest.status == "approved"
        ).first()
        
        if not today_attendance:
            response = "📅 **Today's Attendance**: Not marked yet\n"
            if wfh_request:
                response += "🏠 **Work Mode**: Work from Home (Approved)\n"
                response += "\n💡 You can mark attendance from anywhere today!"
            else:
                response += "🏢 **Work Mode**: Office\n"
                response += "\n⏰ Remember to mark your attendance when you arrive at the office."
            
            return ChatResponse(
                response=response,
                data={
                    "attendance_marked": False,
                    "wfh_approved": wfh_request is not None,
                    "work_mode": "wfh" if wfh_request else "office"
                },
                suggestions=[
                    "Mark attendance now",
                    "Check office location",
                    "WFH policy",
                    "Attendance rules"
                ],
                actions=[
                    {"type": "mark_attendance", "label": "Mark Attendance", "url": "/attendance"}
                ]
            )
        
        # Format attendance details
        check_in_time = today_attendance.check_in.strftime('%H:%M') if today_attendance.check_in else "Not checked in"
        check_out_time = today_attendance.check_out.strftime('%H:%M') if today_attendance.check_out else "Not checked out"
        
        # Calculate working hours
        working_hours = "N/A"
        if today_attendance.check_in and today_attendance.check_out:
            duration = today_attendance.check_out - today_attendance.check_in
            hours = duration.total_seconds() / 3600
            working_hours = f"{int(hours)}h {int((hours % 1) * 60)}m"
        elif today_attendance.check_in:
            current_time = datetime.now()
            if current_time.date() == today:
                duration = current_time - today_attendance.check_in
                hours = duration.total_seconds() / 3600
                working_hours = f"{int(hours)}h {int((hours % 1) * 60)}m (ongoing)"
        
        status_emoji = {
            'present': '✅',
            'late': '⏰', 
            'absent': '❌',
            'wfh': '🏠'
        }.get(today_attendance.status, '📋')
        
        response_parts = [
            "📅 **Today's Attendance Summary:**",
            f"",
            f"{status_emoji} **Status**: {today_attendance.status.title()}",
            f"🕐 **Check-in**: {check_in_time}",
            f"🕕 **Check-out**: {check_out_time}",
            f"⏱️ **Working Hours**: {working_hours}",
            f"🏢 **Work Mode**: {today_attendance.work_mode.upper()}"
        ]
        
        if today_attendance.location_address:
            response_parts.append(f"📍 **Location**: {today_attendance.location_address}")
        
        if today_attendance.face_match_confidence:
            response_parts.append(f"🔐 **Face Recognition**: {today_attendance.face_match_confidence}% confidence")
        
        # Add contextual tips
        if not today_attendance.check_out and today_attendance.check_in:
            response_parts.append("\n💡 **Reminder**: Don't forget to check out when you leave!")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "attendance_marked": True,
                "check_in": check_in_time,
                "check_out": check_out_time,
                "status": today_attendance.status,
                "work_mode": today_attendance.work_mode,
                "working_hours": working_hours,
                "face_confidence": today_attendance.face_match_confidence
            },
            suggestions=[
                "Check out now" if not today_attendance.check_out else "View attendance history",
                "Weekly summary",
                "Attendance rules",
                "Report issue"
            ],
            actions=[
                {"type": "checkout", "label": "Check Out", "url": "/attendance"} if not today_attendance.check_out else None,
                {"type": "view_history", "label": "View History", "url": "/attendance"}
            ]
        )
    
    def get_contextual_suggestions(self, intent: str, context: Dict = None) -> List[str]:
        """Generate contextual suggestions based on intent and context"""
        suggestion_map = {
            'leave_balance': [
                "Apply for leave",
                "Check leave policy", 
                "View leave history",
                "Plan vacation"
            ],
            'attendance_today': [
                "Mark attendance",
                "Check weekly hours",
                "Attendance policy",
                "Report issue"
            ],
            'payroll_current': [
                "View payslip details",
                "Tax breakdown",
                "PF information",
                "Salary structure"
            ],
            'job_search': [
                "View all openings",
                "Application status",
                "Career guidance",
                "Skill requirements"
            ],
            'help_general': [
                "What can you do?",
                "Leave balance",
                "Today's attendance", 
                "Recent announcements"
            ]
        }
        
        base_suggestions = suggestion_map.get(intent, [
            "How can you help?",
            "Leave information",
            "Attendance details",
            "Company updates"
        ])
        
        # Add role-specific suggestions
        if hasattr(self, 'current_user') and self.current_user:
            if self.current_user.role in ['manager', 'hr', 'admin']:
                base_suggestions.extend([
                    "Team statistics",
                    "Pending approvals",
                    "Employee reports"
                ])
        
        return base_suggestions[:4]  # Limit to 4 suggestions
    def handle_payroll_current(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Enhanced payroll information with detailed breakdown"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get latest payroll
        latest_payroll = self.db.query(Payroll).filter(
            Payroll.employee_id == employee.id
        ).order_by(Payroll.payment_date.desc()).first()
        
        # Get salary structure
        salary_structure = self.db.query(SalaryStructure).filter(
            SalaryStructure.employee_id == employee.id
        ).order_by(SalaryStructure.effective_date.desc()).first()
        
        if not latest_payroll:
            return ChatResponse(
                response="No payroll information found. Your salary details may not be processed yet. Please contact HR.",
                suggestions=["Contact HR", "Check salary structure", "Payroll policy"]
            )
        
        # Build detailed payroll response
        response_parts = [
            f"💰 **Payroll Summary for {latest_payroll.month}**",
            "",
            f"💵 **Net Salary**: ₹{latest_payroll.net_salary:,.2f}",
            "",
            "**Earnings:**",
            f"• Basic Salary: ₹{latest_payroll.basic_salary:,.2f}",
            f"• Allowances: ₹{latest_payroll.allowances:,.2f}",
            f"• Overtime: ₹{getattr(latest_payroll, 'overtime', 0):,.2f}",
            "",
            "**Deductions:**",
            f"• PF Contribution: ₹{latest_payroll.pf:,.2f}",
            f"• Tax (TDS): ₹{latest_payroll.tax:,.2f}",
            f"• Other Deductions: ₹{latest_payroll.deductions - latest_payroll.pf - latest_payroll.tax:,.2f}",
            "",
            f"📊 **Gross Salary**: ₹{latest_payroll.basic_salary + latest_payroll.allowances:,.2f}",
            f"📉 **Total Deductions**: ₹{latest_payroll.deductions:,.2f}"
        ]
        
        # Add year-to-date information if available
        ytd_payrolls = self.db.query(Payroll).filter(
            Payroll.employee_id == employee.id,
            func.extract('year', Payroll.payment_date) == datetime.now().year
        ).all()
        
        if len(ytd_payrolls) > 1:
            ytd_net = sum(p.net_salary for p in ytd_payrolls)
            ytd_tax = sum(p.tax for p in ytd_payrolls)
            response_parts.extend([
                "",
                "**Year-to-Date (YTD):**",
                f"• Total Earnings: ₹{ytd_net:,.2f}",
                f"• Total Tax Paid: ₹{ytd_tax:,.2f}"
            ])
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "net_salary": latest_payroll.net_salary,
                "basic_salary": latest_payroll.basic_salary,
                "allowances": latest_payroll.allowances,
                "deductions": latest_payroll.deductions,
                "pf": latest_payroll.pf,
                "tax": latest_payroll.tax,
                "month": latest_payroll.month,
                "ytd_earnings": sum(p.net_salary for p in ytd_payrolls) if ytd_payrolls else 0
            },
            suggestions=[
                "Download payslip",
                "Tax breakdown",
                "PF details",
                "Salary history"
            ],
            actions=[
                {"type": "download_payslip", "label": "Download Payslip"},
                {"type": "view_structure", "label": "View Salary Structure", "url": "/payroll"}
            ]
        )
    
    def handle_performance_review(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Enhanced performance review information"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get performance reviews
        reviews = self.db.query(PerformanceReview).filter(
            PerformanceReview.employee_id == employee.id
        ).order_by(PerformanceReview.review_date.desc()).limit(5).all()
        
        # Get goals
        goals = self.db.query(Goal).filter(Goal.employee_id == employee.id).all()
        
        if not reviews:
            return ChatResponse(
                response="No performance reviews found. Your first review may be scheduled soon. Check with your manager for details.",
                suggestions=[
                    "Set goals",
                    "Contact manager", 
                    "Performance policy",
                    "Self assessment"
                ]
            )
        
        latest_review = reviews[0]
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        
        response_parts = [
            "📊 **Performance Review Summary**",
            "",
            f"⭐ **Latest Rating**: {latest_review.rating}/5.0",
            f"📅 **Review Date**: {latest_review.review_date.strftime('%B %Y')}",
            f"📈 **Average Rating**: {avg_rating:.1f}/5.0 (from {len(reviews)} reviews)",
            ""
        ]
        
        # Add goals information
        if goals:
            completed_goals = len([g for g in goals if g.status == 'completed'])
            in_progress_goals = len([g for g in goals if g.status == 'in_progress'])
            
            response_parts.extend([
                "🎯 **Goals Progress:**",
                f"• Completed: {completed_goals} goals",
                f"• In Progress: {in_progress_goals} goals",
                f"• Total: {len(goals)} goals",
                ""
            ])
        
        # Add performance trend
        if len(reviews) > 1:
            trend = "📈 Improving" if reviews[0].rating > reviews[1].rating else "📉 Declining" if reviews[0].rating < reviews[1].rating else "➡️ Stable"
            response_parts.append(f"**Trend**: {trend}")
        
        # Add next review information
        if latest_review.review_date:
            next_review_date = latest_review.review_date + timedelta(days=365)  # Assuming annual reviews
            if next_review_date > datetime.now().date():
                response_parts.append(f"📅 **Next Review**: Expected around {next_review_date.strftime('%B %Y')}")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "latest_rating": latest_review.rating,
                "average_rating": round(avg_rating, 1),
                "total_reviews": len(reviews),
                "completed_goals": len([g for g in goals if g.status == 'completed']) if goals else 0,
                "total_goals": len(goals) if goals else 0
            },
            suggestions=[
                "View detailed review",
                "Set new goals",
                "Request feedback",
                "Performance tips"
            ],
            actions=[
                {"type": "view_reviews", "label": "View All Reviews", "url": "/performance"},
                {"type": "set_goals", "label": "Set Goals"}
            ]
        )
    
    def handle_learning_progress(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Enhanced learning and development information"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get enrollments
        enrollments = self.db.query(Enrollment).filter(
            Enrollment.employee_id == employee.id
        ).all()
        
        # Get available courses
        available_courses = self.db.query(Course).filter(Course.is_active == True).all()
        
        if not enrollments:
            return ChatResponse(
                response=f"🎓 **Learning Dashboard**\n\nYou're not enrolled in any courses yet. We have {len(available_courses)} courses available for you to explore!\n\n**Popular Categories:**\n• Technical Skills\n• Leadership Development\n• Compliance Training\n• Soft Skills\n\nStart your learning journey today!",
                data={
                    "enrolled_courses": 0,
                    "available_courses": len(available_courses),
                    "completed_courses": 0
                },
                suggestions=[
                    "Browse courses",
                    "Recommended courses",
                    "Learning paths",
                    "Skill assessment"
                ],
                actions=[
                    {"type": "browse_courses", "label": "Browse Courses", "url": "/learning"}
                ]
            )
        
        # Calculate statistics
        completed_courses = len([e for e in enrollments if e.progress >= 100])
        in_progress_courses = len([e for e in enrollments if 0 < e.progress < 100])
        avg_progress = sum(e.progress for e in enrollments) / len(enrollments)
        
        response_parts = [
            "🎓 **Learning Progress Summary**",
            "",
            f"📚 **Enrolled Courses**: {len(enrollments)}",
            f"✅ **Completed**: {completed_courses} courses",
            f"⏳ **In Progress**: {in_progress_courses} courses",
            f"📊 **Average Progress**: {avg_progress:.1f}%",
            ""
        ]
        
        # Show current courses
        if in_progress_courses > 0:
            response_parts.append("**Current Courses:**")
            for enrollment in enrollments:
                if 0 < enrollment.progress < 100:
                    course_title = enrollment.course.title if hasattr(enrollment, 'course') else "Course"
                    response_parts.append(f"• {course_title}: {enrollment.progress}% complete")
            response_parts.append("")
        
        # Show completed courses
        if completed_courses > 0:
            response_parts.append("**Recently Completed:**")
            completed_enrollments = [e for e in enrollments if e.progress >= 100]
            for enrollment in completed_enrollments[:3]:  # Show last 3
                course_title = enrollment.course.title if hasattr(enrollment, 'course') else "Course"
                response_parts.append(f"• {course_title} ✅")
            response_parts.append("")
        
        # Learning recommendations
        if avg_progress > 80:
            response_parts.append("🌟 **Great job!** You're making excellent progress. Consider exploring advanced courses!")
        elif avg_progress > 50:
            response_parts.append("👍 **Good progress!** Keep up the momentum to complete your current courses.")
        else:
            response_parts.append("💪 **Get started!** Dedicate some time each week to boost your learning progress.")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "enrolled_courses": len(enrollments),
                "completed_courses": completed_courses,
                "in_progress_courses": in_progress_courses,
                "average_progress": round(avg_progress, 1),
                "available_courses": len(available_courses)
            },
            suggestions=[
                "Continue learning",
                "Browse new courses",
                "Learning schedule",
                "Skill certificates"
            ],
            actions=[
                {"type": "continue_learning", "label": "Continue Learning", "url": "/learning"},
                {"type": "browse_courses", "label": "Browse Courses"}
            ]
        )
    
    def handle_help_general(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Enhanced general help with personalized assistance"""
        user_role = self.current_user.role
        employee = self.get_employee_data()
        
        # Role-specific capabilities
        capabilities = {
            'admin': [
                "👥 Employee management and analytics",
                "📊 System-wide reports and insights", 
                "🔧 Configuration and settings",
                "📋 Audit logs and compliance",
                "💼 Recruitment and onboarding oversight"
            ],
            'hr': [
                "👤 Employee lifecycle management",
                "📝 Leave and attendance management",
                "💰 Payroll and benefits administration",
                "📊 HR analytics and reporting",
                "🎯 Performance management"
            ],
            'manager': [
                "👥 Team management and oversight",
                "✅ Leave and attendance approvals",
                "📊 Team performance analytics",
                "🎯 Goal setting and reviews",
                "📈 Team development insights"
            ],
            'employee': [
                "📅 Leave balance and requests",
                "⏰ Attendance tracking and history",
                "💰 Payroll and salary information",
                "🎓 Learning and development",
                "📊 Performance goals and reviews"
            ]
        }
        
        user_capabilities = capabilities.get(user_role, capabilities['employee'])
        
        response_parts = [
            f"👋 **Hello{f' {employee.first_name}' if employee else ''}!** I'm your AI HR Assistant.",
            "",
            "🤖 **What I can help you with:**"
        ]
        
        response_parts.extend(user_capabilities)
        
        response_parts.extend([
            "",
            "💬 **How to interact with me:**",
            "• Ask questions in natural language",
            "• Use specific terms like 'leave balance', 'today's attendance'",
            "• I understand context from your current page",
            "• I can guide you through processes step-by-step",
            "",
            "🎯 **Popular queries:**"
        ])
        
        # Add popular queries based on role
        if user_role == 'employee':
            popular_queries = [
                "What's my leave balance?",
                "Show today's attendance",
                "Latest salary details",
                "Available courses"
            ]
        elif user_role == 'manager':
            popular_queries = [
                "Team attendance summary",
                "Pending leave requests",
                "Team performance metrics",
                "Recent applications"
            ]
        else:  # HR/Admin
            popular_queries = [
                "Employee count by department",
                "Recent job applications",
                "Payroll processing status",
                "System analytics"
            ]
        
        for query in popular_queries:
            response_parts.append(f"• \"{query}\"")
        
        response_parts.extend([
            "",
            "🚀 **Try asking me something specific to get started!**"
        ])
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "user_role": user_role,
                "capabilities": user_capabilities,
                "employee_name": employee.first_name if employee else None
            },
            suggestions=popular_queries,
            actions=[
                {"type": "quick_help", "label": "Quick Help Guide"},
                {"type": "feature_tour", "label": "Take Feature Tour"}
            ]
        )
    
    # Add remaining handler methods with similar enhancements...
    def handle_leave_status(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle leave status queries"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        recent_leaves = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee.id
        ).order_by(LeaveRequest.created_at.desc()).limit(5).all()
        
        if not recent_leaves:
            return ChatResponse(
                response="No leave requests found. You haven't applied for any leave yet.",
                suggestions=["Apply for leave", "Check leave balance", "Leave policy"]
            )
        
        response_parts = ["📋 **Your Recent Leave Requests:**\n"]
        
        for leave in recent_leaves[:3]:
            status_emoji = {"approved": "✅", "rejected": "❌", "pending": "⏳"}.get(leave.status, "📋")
            response_parts.append(
                f"{status_emoji} **{leave.start_date.strftime('%d %b')} - {leave.end_date.strftime('%d %b %Y')}**"
            )
            response_parts.append(f"   Type: {leave.leave_type.title()}")
            response_parts.append(f"   Status: {leave.status.title()}")
            if leave.manager_comments:
                response_parts.append(f"   Comments: {leave.manager_comments}")
            response_parts.append("")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={"recent_leaves": [{"start_date": str(l.start_date), "end_date": str(l.end_date), "status": l.status} for l in recent_leaves[:3]]},
            suggestions=["Apply new leave", "Check balance", "Contact manager", "Leave policy"]
        )
    
    def handle_wfh_guidance(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle WFH request guidance"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get recent WFH requests
        wfh_requests = self.db.query(WFHRequest).filter(
            WFHRequest.employee_id == employee.id
        ).order_by(WFHRequest.created_at.desc()).limit(5).all()
        
        response_parts = [
            "🏠 **Work From Home Information**",
            "",
            "**How to request WFH:**",
            "1. Go to Attendance section",
            "2. Click 'Request WFH'",
            "3. Select date and provide reason",
            "4. Submit for approval",
            "",
            "**WFH Guidelines:**",
            "• Request at least 1 day in advance",
            "• Provide valid business reason",
            "• Ensure internet connectivity",
            "• Maintain regular working hours",
            ""
        ]
        
        if wfh_requests:
            response_parts.append("**Your Recent WFH Requests:**")
            for wfh in wfh_requests[:3]:
                status_emoji = {"approved": "✅", "rejected": "❌", "pending": "⏳"}.get(wfh.status, "📋")
                response_parts.append(f"{status_emoji} {wfh.request_date.strftime('%d %b %Y')}: {wfh.status.title()}")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={"wfh_requests": [{"date": str(w.request_date), "status": w.status} for w in wfh_requests[:3]] if wfh_requests else []},
            suggestions=["Request WFH", "WFH policy", "Check status", "Contact manager"]
        )
    
    # Add other handler methods...
    def handle_attendance_history(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle attendance history queries"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get recent attendance (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_attendance = self.db.query(Attendance).filter(
            Attendance.employee_id == employee.id,
            Attendance.date >= thirty_days_ago
        ).order_by(Attendance.date.desc()).all()
        
        if not recent_attendance:
            return ChatResponse(
                response="No attendance records found for the last 30 days.",
                suggestions=["Mark attendance", "Attendance policy", "Contact HR"]
            )
        
        # Calculate statistics
        total_days = len(recent_attendance)
        present_days = len([a for a in recent_attendance if a.status in ['present', 'late']])
        late_days = len([a for a in recent_attendance if a.status == 'late'])
        wfh_days = len([a for a in recent_attendance if a.work_mode == 'wfh'])
        
        attendance_rate = (present_days / total_days * 100) if total_days > 0 else 0
        
        response_parts = [
            "📊 **Attendance Summary (Last 30 Days)**",
            "",
            f"📅 **Total Days**: {total_days}",
            f"✅ **Present**: {present_days} days ({attendance_rate:.1f}%)",
            f"⏰ **Late Arrivals**: {late_days} days",
            f"🏠 **Work from Home**: {wfh_days} days",
            ""
        ]
        
        if attendance_rate >= 95:
            response_parts.append("🌟 **Excellent attendance!** Keep up the great work!")
        elif attendance_rate >= 85:
            response_parts.append("👍 **Good attendance!** You're doing well.")
        else:
            response_parts.append("📈 **Improvement needed.** Consider discussing with your manager.")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "total_days": total_days,
                "present_days": present_days,
                "late_days": late_days,
                "wfh_days": wfh_days,
                "attendance_rate": round(attendance_rate, 1)
            },
            suggestions=["View detailed report", "Mark today's attendance", "Attendance policy", "Weekly summary"]
        )
    
    def handle_payroll_history(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle payroll history queries"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get payroll history (last 12 months)
        payroll_records = self.db.query(Payroll).filter(
            Payroll.employee_id == employee.id
        ).order_by(Payroll.payment_date.desc()).limit(12).all()
        
        if not payroll_records:
            return ChatResponse(
                response="No payroll history found.",
                suggestions=["Contact HR", "Current salary", "Salary structure"]
            )
        
        # Calculate year-to-date totals
        current_year = datetime.now().year
        ytd_records = [p for p in payroll_records if p.payment_date.year == current_year]
        
        ytd_gross = sum(p.basic_salary + p.allowances for p in ytd_records)
        ytd_net = sum(p.net_salary for p in ytd_records)
        ytd_tax = sum(p.tax for p in ytd_records)
        
        response_parts = [
            f"💰 **Payroll History ({len(payroll_records)} months)**",
            "",
            f"📊 **Year-to-Date ({current_year}):**",
            f"• Gross Earnings: ₹{ytd_gross:,.2f}",
            f"• Net Salary: ₹{ytd_net:,.2f}",
            f"• Tax Paid: ₹{ytd_tax:,.2f}",
            "",
            "**Recent Months:**"
        ]
        
        for record in payroll_records[:6]:
            response_parts.append(f"• {record.month}: ₹{record.net_salary:,.2f}")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "ytd_gross": ytd_gross,
                "ytd_net": ytd_net,
                "ytd_tax": ytd_tax,
                "months_count": len(payroll_records)
            },
            suggestions=["Download payslips", "Tax summary", "Salary trends", "Contact HR"]
        )
    
    def handle_tax_info(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle tax information queries"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get current year payroll for tax calculation
        current_year = datetime.now().year
        payroll_records = self.db.query(Payroll).filter(
            Payroll.employee_id == employee.id,
            func.extract('year', Payroll.payment_date) == current_year
        ).all()
        
        if not payroll_records:
            return ChatResponse(
                response="No tax information available for current year.",
                suggestions=["Contact HR", "Tax policy", "Previous year tax"]
            )
        
        total_tax = sum(p.tax for p in payroll_records)
        total_gross = sum(p.basic_salary + p.allowances for p in payroll_records)
        
        response_parts = [
            f"📊 **Tax Information ({current_year})**",
            "",
            f"💰 **Total Tax Deducted**: ₹{total_tax:,.2f}",
            f"📈 **Gross Income**: ₹{total_gross:,.2f}",
            f"📉 **Effective Tax Rate**: {(total_tax/total_gross*100):.1f}%",
            "",
            "**Monthly Breakdown:**"
        ]
        
        for record in payroll_records[-6:]:  # Last 6 months
            response_parts.append(f"• {record.month}: ₹{record.tax:,.2f}")
        
        response_parts.extend([
            "",
            "💡 **Tax Saving Tips:**",
            "• Invest in ELSS mutual funds",
            "• Claim HRA if applicable", 
            "• Submit investment proofs to HR",
            "• Consider NPS contributions"
        ])
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "total_tax": total_tax,
                "total_gross": total_gross,
                "effective_rate": round(total_tax/total_gross*100, 1) if total_gross > 0 else 0
            },
            suggestions=["Tax saving options", "Submit proofs", "Tax calculator", "Contact HR"]
        )
    
    def handle_pf_info(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle PF information queries"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get PF contributions from payroll
        payroll_records = self.db.query(Payroll).filter(
            Payroll.employee_id == employee.id
        ).order_by(Payroll.payment_date.desc()).limit(12).all()
        
        if not payroll_records:
            return ChatResponse(
                response="No PF information available.",
                suggestions=["Contact HR", "PF policy", "Salary details"]
            )
        
        total_pf = sum(p.pf for p in payroll_records)
        monthly_pf = payroll_records[0].pf if payroll_records else 0
        
        # Calculate employer contribution (assuming 12% each)
        employer_contribution = total_pf  # Same as employee contribution
        total_pf_balance = total_pf + employer_contribution
        
        response_parts = [
            "🏦 **Provident Fund Information**",
            "",
            f"💰 **Your Contribution**: ₹{total_pf:,.2f}",
            f"🏢 **Employer Contribution**: ₹{employer_contribution:,.2f}",
            f"📊 **Total PF Balance**: ₹{total_pf_balance:,.2f}",
            f"📅 **Monthly Contribution**: ₹{monthly_pf:,.2f}",
            "",
            "**PF Benefits:**",
            "• Tax-free returns",
            "• Employer matching contribution",
            "• Retirement security",
            "• Loan facility available",
            "",
            "**Withdrawal Options:**",
            "• Partial withdrawal for specific purposes",
            "• Full withdrawal on retirement/resignation",
            "• Online UAN portal access"
        ]
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "employee_contribution": total_pf,
                "employer_contribution": employer_contribution,
                "total_balance": total_pf_balance,
                "monthly_contribution": monthly_pf
            },
            suggestions=["PF withdrawal", "UAN details", "PF loan", "Contact HR"]
        )
    
    def handle_job_search(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle job search and recruitment queries"""
        # Get active jobs
        active_jobs = self.db.query(Job).filter(Job.is_active == True).all()
        
        # Check for specific job types in message
        message_lower = message.lower()
        filtered_jobs = active_jobs
        
        if any(term in message_lower for term in ['python', 'developer', 'software']):
            filtered_jobs = [job for job in active_jobs if any(term in job.title.lower() for term in ['python', 'developer', 'software'])]
        elif any(term in message_lower for term in ['sales', 'marketing']):
            filtered_jobs = [job for job in active_jobs if any(term in job.title.lower() for term in ['sales', 'marketing'])]
        elif any(term in message_lower for term in ['hr', 'human resource']):
            filtered_jobs = [job for job in active_jobs if 'hr' in job.title.lower() or 'human' in job.title.lower()]
        
        if not active_jobs:
            return ChatResponse(
                response="No job openings are currently available. Check back later or contact HR for upcoming opportunities.",
                suggestions=["Contact HR", "Career guidance", "Skill development", "Internal opportunities"]
            )
        
        response_parts = [
            f"💼 **Job Opportunities ({len(filtered_jobs)} positions)**",
            ""
        ]
        
        # Group jobs by department
        jobs_by_dept = defaultdict(list)
        for job in filtered_jobs[:10]:  # Limit to 10 jobs
            jobs_by_dept[job.department].append(job)
        
        for dept, jobs in jobs_by_dept.items():
            response_parts.append(f"**{dept}:**")
            for job in jobs:
                response_parts.append(f"• {job.title} - {job.location}")
                if hasattr(job, 'experience_required'):
                    response_parts.append(f"  Experience: {job.experience_required}")
            response_parts.append("")
        
        if len(active_jobs) > len(filtered_jobs):
            response_parts.append(f"💡 **{len(active_jobs) - len(filtered_jobs)} more positions available** in other departments.")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "total_jobs": len(active_jobs),
                "filtered_jobs": len(filtered_jobs),
                "departments": list(jobs_by_dept.keys())
            },
            suggestions=["View all jobs", "Application process", "Job requirements", "Career guidance"],
            actions=[
                {"type": "view_jobs", "label": "View All Jobs", "url": "/recruitment"},
                {"type": "apply_job", "label": "Apply Now"}
            ]
        )
    
    def handle_employee_count(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle employee count and statistics queries"""
        if self.current_user.role not in ['admin', 'hr', 'manager']:
            return ChatResponse(
                response="You don't have permission to access employee statistics.",
                suggestions=["Contact HR", "Your team info", "Company directory"]
            )
        
        # Get employee statistics
        total_employees = self.db.query(Employee).count()
        
        # Get department breakdown
        dept_stats = self.db.query(
            Employee.department,
            func.count(Employee.id).label('count')
        ).group_by(Employee.department).all()
        
        # Get recent hires (last 30 days)
        thirty_days_ago = datetime.now() - timedelta(days=30)
        recent_hires = self.db.query(Employee).filter(
            Employee.date_of_joining >= thirty_days_ago
        ).count()
        
        response_parts = [
            f"👥 **Employee Statistics**",
            "",
            f"📊 **Total Employees**: {total_employees}",
            f"🆕 **Recent Hires (30 days)**: {recent_hires}",
            "",
            "**Department Breakdown:**"
        ]
        
        for dept_stat in dept_stats:
            dept_name = dept_stat.department or "Unassigned"
            response_parts.append(f"• {dept_name}: {dept_stat.count} employees")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "total_employees": total_employees,
                "recent_hires": recent_hires,
                "departments": [{"name": d.department, "count": d.count} for d in dept_stats]
            },
            suggestions=["Department details", "Hiring trends", "Employee directory", "Org chart"]
        )
    
    def handle_goals_progress(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle goals and objectives progress"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get goals
        goals = self.db.query(Goal).filter(Goal.employee_id == employee.id).all()
        
        if not goals:
            return ChatResponse(
                response="No goals found. Setting clear goals is important for career growth. Consider discussing with your manager to set SMART goals.",
                suggestions=["Set new goals", "Goal templates", "Contact manager", "Performance planning"],
                actions=[
                    {"type": "set_goals", "label": "Set Goals", "url": "/performance"}
                ]
            )
        
        # Calculate statistics
        completed_goals = [g for g in goals if g.status == 'completed']
        in_progress_goals = [g for g in goals if g.status == 'in_progress']
        pending_goals = [g for g in goals if g.status == 'pending']
        
        completion_rate = (len(completed_goals) / len(goals) * 100) if goals else 0
        
        response_parts = [
            "🎯 **Goals Progress Summary**",
            "",
            f"📊 **Total Goals**: {len(goals)}",
            f"✅ **Completed**: {len(completed_goals)} ({completion_rate:.1f}%)",
            f"⏳ **In Progress**: {len(in_progress_goals)}",
            f"📋 **Pending**: {len(pending_goals)}",
            ""
        ]
        
        # Show recent goals
        if in_progress_goals:
            response_parts.append("**Current Goals:**")
            for goal in in_progress_goals[:3]:
                response_parts.append(f"• {goal.title}")
                if hasattr(goal, 'target_date') and goal.target_date:
                    response_parts.append(f"  Target: {goal.target_date.strftime('%b %Y')}")
            response_parts.append("")
        
        # Performance feedback
        if completion_rate >= 80:
            response_parts.append("🌟 **Excellent progress!** You're achieving your goals consistently.")
        elif completion_rate >= 60:
            response_parts.append("👍 **Good progress!** Keep focusing on your current objectives.")
        else:
            response_parts.append("📈 **Focus needed.** Consider reviewing and prioritizing your goals.")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "total_goals": len(goals),
                "completed_goals": len(completed_goals),
                "in_progress_goals": len(in_progress_goals),
                "completion_rate": round(completion_rate, 1)
            },
            suggestions=["Update progress", "Set new goals", "Goal strategies", "Manager feedback"]
        )
    
    def handle_asset_info(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle asset and equipment information"""
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="Employee profile not found.")
        
        # Get assigned assets
        assigned_assets = self.db.query(Asset).filter(Asset.assigned_to == employee.id).all()
        
        if not assigned_assets:
            return ChatResponse(
                response="No assets currently assigned to you. If you need equipment, please contact the Assets Team or submit a request through the Asset Management section.",
                suggestions=["Request asset", "Contact Assets Team", "Asset policy", "IT support"],
                actions=[
                    {"type": "request_asset", "label": "Request Asset", "url": "/assets"}
                ]
            )
        
        response_parts = [
            "💻 **Your Assigned Assets**",
            ""
        ]
        
        # Group assets by type
        assets_by_type = defaultdict(list)
        for asset in assigned_assets:
            assets_by_type[asset.type].append(asset)
        
        for asset_type, assets in assets_by_type.items():
            response_parts.append(f"**{asset_type.title()}:**")
            for asset in assets:
                response_parts.append(f"• {asset.name}")
                if hasattr(asset, 'serial_number') and asset.serial_number:
                    response_parts.append(f"  Serial: {asset.serial_number}")
                if hasattr(asset, 'assigned_date') and asset.assigned_date:
                    response_parts.append(f"  Assigned: {asset.assigned_date.strftime('%b %Y')}")
            response_parts.append("")
        
        response_parts.extend([
            "**Asset Responsibilities:**",
            "• Keep assets in good condition",
            "• Report any issues immediately",
            "• Return assets when leaving",
            "• Follow company asset policy"
        ])
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "total_assets": len(assigned_assets),
                "asset_types": list(assets_by_type.keys())
            },
            suggestions=["Report issue", "Asset policy", "Request maintenance", "Contact IT"]
        )
    
    def handle_announcements(self, message: str, context: Dict = None, history: List = None) -> ChatResponse:
        """Handle company announcements and news"""
        # Get recent announcements
        recent_announcements = self.db.query(Announcement).filter(
            Announcement.is_active == True
        ).order_by(Announcement.created_at.desc()).limit(5).all()
        
        if not recent_announcements:
            return ChatResponse(
                response="No recent announcements available. Check back later for company updates and news.",
                suggestions=["Company news", "HR updates", "Policy changes", "Events calendar"]
            )
        
        response_parts = [
            "📢 **Recent Announcements**",
            ""
        ]
        
        for announcement in recent_announcements:
            response_parts.append(f"**{announcement.title}**")
            response_parts.append(f"📅 {announcement.created_at.strftime('%d %b %Y')}")
            
            # Add preview of content
            content_preview = announcement.content[:100] + "..." if len(announcement.content) > 100 else announcement.content
            response_parts.append(f"{content_preview}")
            response_parts.append("")
        
        return ChatResponse(
            response="\n".join(response_parts),
            data={
                "announcement_count": len(recent_announcements),
                "announcements": [
                    {
                        "title": a.title,
                        "date": a.created_at.strftime('%Y-%m-%d'),
                        "content_preview": a.content[:100]
                    } for a in recent_announcements
                ]
            },
            suggestions=["Read full announcements", "Company events", "Policy updates", "HR news"],
            actions=[
                {"type": "view_announcements", "label": "View All", "url": "/announcements"}
            ]
        )
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="I couldn't find your employee profile. Please contact HR.")
        
        # Get leave balance
        leave_balances = self.db.query(LeaveBalance).filter(LeaveBalance.employee_id == employee.id).all()
        
        # Get recent leave requests
        recent_leaves = self.db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == employee.id
        ).order_by(LeaveRequest.created_at.desc()).limit(5).all()
        
        if 'balance' in message or 'remaining' in message:
            if leave_balances:
                balance_text = "Your current leave balances:\n"
                for balance in leave_balances:
                    balance_text += f"• {balance.leave_type}: {balance.balance} days\n"
                return ChatResponse(
                    response=balance_text,
                    data={"leave_balances": [{"type": lb.leave_type, "balance": lb.balance} for lb in leave_balances]}
                )
            else:
                return ChatResponse(response="No leave balance information found. Please contact HR.")
        
        elif 'status' in message or 'request' in message:
            if recent_leaves:
                status_text = "Your recent leave requests:\n"
                for leave in recent_leaves[:3]:
                    status_text += f"• {leave.start_date.strftime('%Y-%m-%d')} to {leave.end_date.strftime('%Y-%m-%d')}: {leave.status.title()}\n"
                return ChatResponse(
                    response=status_text,
                    data={"recent_leaves": [{"start_date": str(l.start_date), "end_date": str(l.end_date), "status": l.status} for l in recent_leaves[:3]]}
                )
            else:
                return ChatResponse(response="No recent leave requests found.")
        
        else:
            # General leave info
            total_balance = sum(lb.balance for lb in leave_balances) if leave_balances else 0
            return ChatResponse(
                response=f"You have {total_balance} total leave days remaining. You can apply for leave through the Leave section in your dashboard.",
                data={"total_balance": total_balance}
            )
    
    def handle_payroll_queries(self, message: str) -> ChatResponse:
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="I couldn't find your employee profile. Please contact HR.")
        
        # Get latest payroll
        latest_payroll = self.db.query(Payroll).filter(
            Payroll.employee_id == employee.id
        ).order_by(Payroll.payment_date.desc()).first()
        
        # Get salary structure
        salary_structure = self.db.query(SalaryStructure).filter(
            SalaryStructure.employee_id == employee.id
        ).order_by(SalaryStructure.effective_date.desc()).first()
        
        if 'pf' in message or 'provident fund' in message:
            if latest_payroll:
                return ChatResponse(
                    response=f"Your PF contribution for {latest_payroll.month} was ₹{latest_payroll.pf:,.2f}. The company contributes 12% of your basic salary to PF.",
                    data={"pf_amount": latest_payroll.pf, "month": latest_payroll.month}
                )
            else:
                return ChatResponse(response="No payroll information found. Please contact HR.")
        
        elif 'tax' in message:
            if latest_payroll:
                return ChatResponse(
                    response=f"Your tax deduction for {latest_payroll.month} was ₹{latest_payroll.tax:,.2f}.",
                    data={"tax_amount": latest_payroll.tax, "month": latest_payroll.month}
                )
            else:
                return ChatResponse(response="No tax information found. Please contact HR.")
        
        elif 'salary' in message or 'pay' in message:
            if latest_payroll:
                return ChatResponse(
                    response=f"Your net salary for {latest_payroll.month} was ₹{latest_payroll.net_salary:,.2f}. Basic: ₹{latest_payroll.basic_salary:,.2f}, Allowances: ₹{latest_payroll.allowances:,.2f}, Deductions: ₹{latest_payroll.deductions:,.2f}",
                    data={
                        "net_salary": latest_payroll.net_salary,
                        "basic_salary": latest_payroll.basic_salary,
                        "allowances": latest_payroll.allowances,
                        "deductions": latest_payroll.deductions,
                        "month": latest_payroll.month
                    }
                )
            else:
                return ChatResponse(response="No salary information found. Please contact HR.")
        
        else:
            if salary_structure:
                total_ctc = salary_structure.basic_salary + salary_structure.hra + salary_structure.other_allowances
                return ChatResponse(
                    response=f"Your current CTC is ₹{total_ctc:,.2f} annually. Basic: ₹{salary_structure.basic_salary:,.2f}, HRA: ₹{salary_structure.hra:,.2f}, Other Allowances: ₹{salary_structure.other_allowances:,.2f}",
                    data={
                        "total_ctc": total_ctc,
                        "basic_salary": salary_structure.basic_salary,
                        "hra": salary_structure.hra,
                        "other_allowances": salary_structure.other_allowances
                    }
                )
            else:
                return ChatResponse(response="No salary structure information found. Please contact HR.")
    
    def handle_attendance_queries(self, message: str) -> ChatResponse:
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="I couldn't find your employee profile. Please contact HR.")
        
        # Get recent attendance
        recent_attendance = self.db.query(Attendance).filter(
            Attendance.employee_id == employee.id
        ).order_by(Attendance.date.desc()).limit(10).all()
        
        if 'today' in message:
            today_attendance = self.db.query(Attendance).filter(
                and_(
                    Attendance.employee_id == employee.id,
                    func.date(Attendance.date) == datetime.now().date()
                )
            ).first()
            
            if today_attendance:
                check_in_time = today_attendance.check_in.strftime('%H:%M') if today_attendance.check_in else "Not checked in"
                check_out_time = today_attendance.check_out.strftime('%H:%M') if today_attendance.check_out else "Not checked out"
                return ChatResponse(
                    response=f"Today's attendance: Check-in: {check_in_time}, Check-out: {check_out_time}, Status: {today_attendance.status.title()}",
                    data={
                        "check_in": check_in_time,
                        "check_out": check_out_time,
                        "status": today_attendance.status,
                        "work_mode": today_attendance.work_mode
                    }
                )
            else:
                return ChatResponse(response="No attendance record found for today.")
        
        elif 'wfh' in message or 'work from home' in message:
            wfh_requests = self.db.query(WFHRequest).filter(
                WFHRequest.employee_id == employee.id
            ).order_by(WFHRequest.created_at.desc()).limit(5).all()
            
            if wfh_requests:
                wfh_text = "Your recent WFH requests:\n"
                for wfh in wfh_requests[:3]:
                    wfh_text += f"• {wfh.request_date.strftime('%Y-%m-%d')}: {wfh.status.title()}\n"
                return ChatResponse(
                    response=wfh_text,
                    data={"wfh_requests": [{"date": str(w.request_date), "status": w.status} for w in wfh_requests[:3]]}
                )
            else:
                return ChatResponse(response="No WFH requests found.")
        
        else:
            # General attendance summary
            if recent_attendance:
                present_days = len([a for a in recent_attendance if a.status == 'present'])
                return ChatResponse(
                    response=f"In the last {len(recent_attendance)} days, you were present for {present_days} days. Your current WFH status: {employee.wfh_status.title()}",
                    data={
                        "total_days": len(recent_attendance),
                        "present_days": present_days,
                        "wfh_status": employee.wfh_status
                    }
                )
            else:
                return ChatResponse(response="No attendance records found.")
    
    def handle_job_queries(self, message: str) -> ChatResponse:
        # Get active jobs
        active_jobs = self.db.query(Job).filter(Job.is_active == True).all()
        
        if 'python' in message or 'developer' in message:
            python_jobs = [job for job in active_jobs if 'python' in job.title.lower() or 'developer' in job.title.lower()]
            if python_jobs:
                job_text = f"Found {len(python_jobs)} Python/Developer positions:\n"
                for job in python_jobs[:3]:
                    job_text += f"• {job.title} - {job.department} ({job.location})\n"
                return ChatResponse(
                    response=job_text,
                    data={"jobs": [{"id": j.id, "title": j.title, "department": j.department, "location": j.location} for j in python_jobs[:3]]}
                )
            else:
                return ChatResponse(response="No Python/Developer positions currently available.")
        
        elif 'open' in message or 'available' in message:
            if active_jobs:
                return ChatResponse(
                    response=f"We have {len(active_jobs)} open positions across various departments. Check the Recruitment section for details.",
                    data={"total_jobs": len(active_jobs)}
                )
            else:
                return ChatResponse(response="No open positions currently available.")
        
        else:
            # Get recent applications if user has access
            if self.current_user.role in ['admin', 'hr', 'manager']:
                recent_applications = self.db.query(Application).order_by(Application.applied_date.desc()).limit(5).all()
                return ChatResponse(
                    response=f"Recent activity: {len(recent_applications)} new applications received. {len(active_jobs)} positions are currently open.",
                    data={
                        "recent_applications": len(recent_applications),
                        "open_positions": len(active_jobs)
                    }
                )
            else:
                return ChatResponse(response=f"There are {len(active_jobs)} open positions available. Visit the careers page to apply.")
    
    def handle_employee_queries(self, message: str) -> ChatResponse:
        if self.current_user.role not in ['admin', 'hr', 'manager']:
            return ChatResponse(response="You don't have permission to access employee information.")
        
        # Get employee count by department
        employee_stats = self.db.query(
            Employee.department, 
            func.count(Employee.id).label('count')
        ).group_by(Employee.department).all()
        
        if 'count' in message or 'total' in message:
            total_employees = sum(stat.count for stat in employee_stats)
            dept_text = f"Total employees: {total_employees}\nBy department:\n"
            for stat in employee_stats:
                dept_text += f"• {stat.department}: {stat.count}\n"
            return ChatResponse(
                response=dept_text,
                data={
                    "total_employees": total_employees,
                    "by_department": [{"department": s.department, "count": s.count} for s in employee_stats]
                }
            )
        
        else:
            total_employees = sum(stat.count for stat in employee_stats)
            return ChatResponse(
                response=f"We have {total_employees} employees across {len(employee_stats)} departments.",
                data={"total_employees": total_employees, "departments": len(employee_stats)}
            )
    
    def handle_performance_queries(self, message: str) -> ChatResponse:
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="I couldn't find your employee profile. Please contact HR.")
        
        # Get recent performance reviews
        reviews = self.db.query(PerformanceReview).filter(
            PerformanceReview.employee_id == employee.id
        ).order_by(PerformanceReview.review_date.desc()).limit(3).all()
        
        # Get goals
        goals = self.db.query(Goal).filter(Goal.employee_id == employee.id).all()
        
        if 'review' in message or 'rating' in message:
            if reviews:
                latest_review = reviews[0]
                return ChatResponse(
                    response=f"Your latest performance review: {latest_review.rating}/5.0 on {latest_review.review_date.strftime('%Y-%m-%d')}. {len(reviews)} total reviews on record.",
                    data={
                        "latest_rating": latest_review.rating,
                        "review_date": str(latest_review.review_date),
                        "total_reviews": len(reviews)
                    }
                )
            else:
                return ChatResponse(response="No performance reviews found.")
        
        elif 'goal' in message:
            if goals:
                completed_goals = len([g for g in goals if g.status == 'completed'])
                return ChatResponse(
                    response=f"You have {len(goals)} goals. {completed_goals} completed, {len(goals) - completed_goals} in progress.",
                    data={
                        "total_goals": len(goals),
                        "completed_goals": completed_goals,
                        "pending_goals": len(goals) - completed_goals
                    }
                )
            else:
                return ChatResponse(response="No goals found. Set some goals in the Performance section.")
        
        else:
            avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 0
            return ChatResponse(
                response=f"Performance summary: Average rating {avg_rating:.1f}/5.0 from {len(reviews)} reviews. {len(goals)} goals tracked.",
                data={
                    "average_rating": round(avg_rating, 1),
                    "total_reviews": len(reviews),
                    "total_goals": len(goals)
                }
            )
    
    def handle_learning_queries(self, message: str) -> ChatResponse:
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="I couldn't find your employee profile. Please contact HR.")
        
        # Get enrollments
        enrollments = self.db.query(Enrollment).filter(Enrollment.employee_id == employee.id).all()
        
        # Get available courses
        available_courses = self.db.query(Course).all()
        
        if 'progress' in message or 'enrolled' in message:
            if enrollments:
                progress_text = "Your course progress:\n"
                for enrollment in enrollments[:5]:
                    progress_text += f"• {enrollment.course.title}: {enrollment.progress}% complete\n"
                return ChatResponse(
                    response=progress_text,
                    data={"enrollments": [{"course": e.course.title, "progress": e.progress} for e in enrollments[:5]]}
                )
            else:
                return ChatResponse(response="You're not enrolled in any courses yet.")
        
        elif 'available' in message or 'course' in message:
            return ChatResponse(
                response=f"{len(available_courses)} courses available. You're enrolled in {len(enrollments)}. Check the Learning section to explore more.",
                data={
                    "available_courses": len(available_courses),
                    "enrolled_courses": len(enrollments)
                }
            )
        
        else:
            avg_progress = sum(e.progress for e in enrollments) / len(enrollments) if enrollments else 0
            return ChatResponse(
                response=f"Learning summary: {len(enrollments)} courses enrolled, {avg_progress:.1f}% average progress. {len(available_courses)} total courses available.",
                data={
                    "enrolled_courses": len(enrollments),
                    "average_progress": round(avg_progress, 1),
                    "available_courses": len(available_courses)
                }
            )
    
    def handle_asset_queries(self, message: str) -> ChatResponse:
        employee = self.get_employee_data()
        if not employee:
            return ChatResponse(response="I couldn't find your employee profile. Please contact HR.")
        
        # Get assigned assets
        assigned_assets = self.db.query(Asset).filter(Asset.assigned_to == employee.id).all()
        
        if assigned_assets:
            asset_text = "Your assigned assets:\n"
            for asset in assigned_assets:
                asset_text += f"• {asset.name} ({asset.type}) - {asset.serial_number}\n"
            return ChatResponse(
                response=asset_text,
                data={"assets": [{"name": a.name, "type": a.type, "serial_number": a.serial_number} for a in assigned_assets]}
            )
        else:
            return ChatResponse(response="No assets currently assigned to you.")
    
    def handle_announcement_queries(self, message: str) -> ChatResponse:
        # Get recent announcements
        recent_announcements = self.db.query(Announcement).order_by(Announcement.created_at.desc()).limit(5).all()
        
        if recent_announcements:
            announcement_text = "Recent announcements:\n"
            for announcement in recent_announcements[:3]:
                announcement_text += f"• {announcement.title} ({announcement.created_at.strftime('%Y-%m-%d')})\n"
            return ChatResponse(
                response=announcement_text,
                data={"announcements": [{"title": a.title, "date": str(a.created_at)} for a in recent_announcements[:3]]}
            )
        else:
            return ChatResponse(response="No recent announcements.")
    
    def handle_general_queries(self, message: str) -> ChatResponse:
        # Provide general help based on user role
        if self.current_user.role == 'admin':
            return ChatResponse(
                response="I can help you with employee management, recruitment, payroll, performance reviews, and system administration. What would you like to know?",
                data={"user_role": "admin"}
            )
        elif self.current_user.role == 'hr':
            return ChatResponse(
                response="I can assist with recruitment, employee onboarding, leave management, performance reviews, and HR analytics. How can I help?",
                data={"user_role": "hr"}
            )
        elif self.current_user.role == 'manager':
            return ChatResponse(
                response="I can help with team management, performance reviews, leave approvals, and employee development. What do you need?",
                data={"user_role": "manager"}
            )
        else:
            return ChatResponse(
                response="I can help you with leave requests, attendance, payroll information, performance goals, learning courses, and company announcements. What would you like to know?",
                data={"user_role": "employee"}
            )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(
    message: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced chat with AI Assistant with intent detection and context awareness"""
    try:
        assistant = AIAssistantService(db, current_user)
        response = assistant.analyze_message(
            message.message, 
            message.context, 
            message.history
        )
        
        # Log interaction for analytics
        logger.info(f"AI Assistant interaction - User: {current_user.id}, Intent: {response.intent}, Confidence: {response.confidence}")
        
        return response
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@router.post("/suggestions")
async def get_contextual_suggestions(
    context: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get contextual suggestions based on user context and role"""
    try:
        assistant = AIAssistantService(db, current_user)
        
        # Generate role-based suggestions
        base_suggestions = []
        
        if current_user.role == 'employee':
            base_suggestions = [
                "What's my leave balance?",
                "Show today's attendance",
                "Latest salary details",
                "Available courses",
                "My performance goals"
            ]
        elif current_user.role == 'manager':
            base_suggestions = [
                "Team attendance summary",
                "Pending leave requests", 
                "Team performance metrics",
                "Recent job applications",
                "Employee count in my team"
            ]
        elif current_user.role in ['hr', 'admin']:
            base_suggestions = [
                "Total employee count",
                "Recent job applications",
                "Payroll processing status",
                "Company announcements",
                "System analytics"
            ]
        
        # Add context-specific suggestions
        page = context.get('page', '')
        if '/leave' in page:
            base_suggestions.insert(0, "Check my leave balance")
            base_suggestions.insert(1, "How to apply for leave")
        elif '/attendance' in page:
            base_suggestions.insert(0, "Today's attendance status")
            base_suggestions.insert(1, "Mark attendance now")
        elif '/payroll' in page:
            base_suggestions.insert(0, "Latest salary details")
            base_suggestions.insert(1, "Tax information")
        
        return {"suggestions": base_suggestions[:5]}
        
    except Exception as e:
        logger.error(f"Error getting suggestions: {str(e)}")
        return {"suggestions": ["How can you help me?", "What can you do?", "Show my information"]}

@router.get("/analytics")
async def get_ai_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI Assistant usage analytics (Admin/HR only)"""
    if current_user.role not in ['admin', 'hr']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    try:
        # This would typically come from a dedicated analytics table
        # For now, return mock analytics data
        analytics = {
            "total_interactions": 1250,
            "active_users": 85,
            "top_intents": [
                {"intent": "leave_balance", "count": 245, "percentage": 19.6},
                {"intent": "attendance_today", "count": 198, "percentage": 15.8},
                {"intent": "payroll_current", "count": 156, "percentage": 12.5},
                {"intent": "help_general", "count": 134, "percentage": 10.7},
                {"intent": "learning_progress", "count": 98, "percentage": 7.8}
            ],
            "user_satisfaction": 4.2,
            "resolution_rate": 87.5,
            "avg_response_time": 1.2
        }
        
        return analytics
        
    except Exception as e:
        logger.error(f"Error getting analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving analytics")

@router.post("/feedback")
async def submit_feedback(
    feedback_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit feedback for AI Assistant interaction"""
    try:
        # Log feedback for improvement
        logger.info(f"AI Assistant feedback - User: {current_user.id}, Rating: {feedback_data.get('rating')}, Comment: {feedback_data.get('comment')}")
        
        # In a real implementation, save to feedback table
        return {"message": "Feedback submitted successfully", "status": "success"}
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Error submitting feedback")

@router.get("/capabilities")
async def get_ai_capabilities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI Assistant capabilities based on user role"""
    try:
        assistant = AIAssistantService(db, current_user)
        
        # Role-specific capabilities
        capabilities = {
            'admin': {
                "categories": [
                    {
                        "name": "Employee Management",
                        "capabilities": [
                            "Employee statistics and analytics",
                            "Department-wise breakdowns",
                            "Hiring trends and metrics",
                            "Organizational insights"
                        ]
                    },
                    {
                        "name": "System Analytics",
                        "capabilities": [
                            "System usage statistics",
                            "Performance metrics",
                            "User activity reports",
                            "Configuration insights"
                        ]
                    }
                ]
            },
            'hr': {
                "categories": [
                    {
                        "name": "Employee Services",
                        "capabilities": [
                            "Leave management assistance",
                            "Payroll information",
                            "Performance review data",
                            "Employee onboarding support"
                        ]
                    },
                    {
                        "name": "Recruitment",
                        "capabilities": [
                            "Job posting information",
                            "Application tracking",
                            "Candidate analytics",
                            "Hiring process guidance"
                        ]
                    }
                ]
            },
            'manager': {
                "categories": [
                    {
                        "name": "Team Management",
                        "capabilities": [
                            "Team attendance monitoring",
                            "Leave request approvals",
                            "Performance tracking",
                            "Team analytics"
                        ]
                    }
                ]
            },
            'employee': {
                "categories": [
                    {
                        "name": "Personal Information",
                        "capabilities": [
                            "Leave balance and history",
                            "Attendance tracking",
                            "Payroll and salary details",
                            "Performance goals and reviews"
                        ]
                    },
                    {
                        "name": "Learning & Development",
                        "capabilities": [
                            "Course enrollment and progress",
                            "Skill development tracking",
                            "Certification information",
                            "Learning recommendations"
                        ]
                    }
                ]
            }
        }
        
        user_capabilities = capabilities.get(current_user.role, capabilities['employee'])
        
        return {
            "role": current_user.role,
            "capabilities": user_capabilities,
            "features": [
                "Natural language processing",
                "Context-aware responses", 
                "Intent detection",
                "Personalized suggestions",
                "Real-time data access"
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting capabilities: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving capabilities")

@router.get("/health")
async def ai_health_check():
    """Health check for AI Assistant service"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "features": [
            "intent_detection",
            "context_awareness", 
            "role_based_responses",
            "advanced_analytics"
        ]
    }