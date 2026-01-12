class MeetingService:
    def __init__(self, db, notification_service=None):
        self.db = db
        self.notification_service = notification_service
        
    def create_meeting(self, meeting_data, created_by):
        return {"message": "Meeting created"}
        
    def get_meetings(self, user_id, filters=None):
        return []
        
    def get_meeting_by_id(self, meeting_id, user_id):
        return {"id": meeting_id}