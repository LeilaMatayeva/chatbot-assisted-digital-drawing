from datetime import datetime
from extensions import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    time_spent = db.Column(db.Integer)
    eraser_clicks = db.Column(db.Integer, default=0)  # New column for eraser clicks
    delete_all_clicks = db.Column(db.Integer, default=0)  # New column for delete all clicks
    message_count = db.Column(db.Integer, default=0)  # New column for message count
    screenshot_path = db.Column(db.String(255))

class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String, nullable=False)
    user = db.relationship('User', backref=db.backref('messages', lazy=True))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)



class ChatbotMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('chatbot_messages', lazy=True))





