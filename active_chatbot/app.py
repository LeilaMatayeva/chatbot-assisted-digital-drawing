import os
import requests
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify, redirect, url_for
from flask import session
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView  # Corrected import
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import base64
from chat import get_response
from extensions import db
from models import User, ChatMessage, ChatbotMessage

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
print(os.environ)
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Configuration
app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///info.db'
db.init_app(app)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Optional: reduces overhead if you don't need track modifications

# Database setup

migrate = Migrate(app, db)

class ChatMessageModelView(ModelView):
    column_list = ('user.username', 'message', 'timestamp')  # Specify the columns to display
    column_labels = {
        'user.username': 'Username',  # Rename the column header

    }

class ChatbotMessageModelView(ModelView):
    column_list = ('user.username', 'message', 'timestamp')
    column_labels = {
        'user.username': 'Username',
    }



# Admin setup
admin = Admin(app, name='active_chatbot', template_mode='bootstrap3')
admin.add_view(ModelView(User, db.session))
admin.add_view(ChatMessageModelView(ChatMessage, db.session))
admin.add_view(ChatbotMessageModelView(ChatbotMessage, db.session))




# Create tables before the first request
with app.app_context():
    db.create_all()

# Route definitions
@app.route("/")
def index_get():
    return render_template("start.html")

@app.route("/predict", methods=["POST"])
def predict():
    text = request.get_json().get("message")
    response, tag = get_response(text)
    data = request.get_json()
    message_content = data.get('message')

    user_id = session.get('user_id')
    if user_id and message_content:
        user = User.query.get(user_id)
        if user:
            user.message_count += 1  # Increment the message count
            db.session.commit()

            message = ChatMessage(user_id=user_id, message=message_content)
            db.session.add(message)
            db.session.commit()

            chatbot_message = ChatbotMessage(user_id=user_id, message=response)
            db.session.add(chatbot_message)
            db.session.commit()


    if not response:  # Fallback to ChatGPT API
        prompt = (f"You ar an Art Assistant. I am a beginner artist. Your goal is to inspire and help "
                  f"with a maximum of one or two short sentences per message, sometimes using emojis to lighten the "
                  f"mood."
                  f"You are friendly and motivating. Your advice should always "
                  f"steer the artist in the right"
                  f"direction, be helpful and actually answer the question (if it's asked). Give me actual step by "
                  f"step drawing advices.  {text}")
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        data = {"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": prompt}]}
        api_response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=data)
        if api_response.status_code == 200:
            api_response_json = api_response.json()
            answer = api_response_json.get("choices")[0].get("message")["content"].strip()
        else:
            answer = "Sorry, I couldn't process your request right now."
    else:
        answer = response

    return jsonify({"answer": answer, "tag": tag})

@app.route("/submit_name", methods=["POST"])
def submit_name():
    username = request.form['name']
    user = User.query.filter_by(username=username).first()
    if not user:
        user = User(username=username)
        db.session.add(user)
        db.session.commit()

    # Store the user ID in the session
    session['user_id'] = user.id
    return redirect(url_for('base_page'))


@app.route("/submit_time", methods=["POST"])
def submit_time():
    data = request.get_json()
    time_spent = data.get('timeSpent')

    # Assuming you have a way to identify the current user, e.g., a session
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    if user:
        user.time_spent = time_spent
        db.session.commit()

    return jsonify({"success": True})



@app.route("/track_eraser_click", methods=["POST"])
def track_eraser_click():
    data = request.get_json()
    user_id = data.get('userId')
    user = User.query.get(user_id)
    if user:
        user.eraser_clicks += 1
        db.session.commit()
        return jsonify({"success": True, "eraserClicks": user.eraser_clicks})
    else:
        return jsonify({"error": "User not found"}), 404

@app.route("/track_delete_all_click", methods=["POST"])
def track_delete_all_click():
    data = request.get_json()
    user_id = data.get('userId')
    user = User.query.get(user_id)
    if user:
        user.delete_all_clicks += 1
        db.session.commit()
        return jsonify({"success": True, "deleteallClicks": user.delete_all_clicks})
    else:
        return jsonify({"error": "User not found"}), 404


@app.route('/submit_screenshot', methods=['POST'])
def submit_screenshot():
    data = request.get_json()
    image_data = data.get('image')
    user_id = session.get('user_id')


    if user_id and image_data:
        user = User.query.get(user_id)
        # Decode the base64 image
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        image_bytes = base64.b64decode(imgstr)

        # Save the image to a file
        filename = f'{user.username}_active.{ext}'
        filepath = os.path.join('screenshots', filename)  # Specify your path for saving screenshots
        with open(filepath, 'wb') as f:
            f.write(image_bytes)

        # Save the file path in the User model
        user = User.query.get(user_id)
        if user:
            user.screenshot_path = filepath
            db.session.commit()

        return jsonify({"success": True})
    return jsonify({"error": "Missing data"}), 400


@app.route("/base")
def base_page():
    return render_template("base.html")

# Run the application
if __name__ == "__main__":
    app.run(debug=True)
