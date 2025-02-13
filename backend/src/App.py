from flask import Flask
from flask_cors import CORS
from routes import ChatRoutes, UploadIllustrationRoute, UploadReferenceRoute
from models import OpenAI_GPT
from database import DatabaseManager

class FlaskApp:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        self.model = OpenAI_GPT(model="gpt-4o")
        self.database = DatabaseManager()
        self.register_routes()

    def register_routes(self):
        self.app.register_blueprint(ChatRoutes(self.model, self.database).blueprint)
        self.app.register_blueprint(UploadIllustrationRoute(self.model, self.database).blueprint)
        self.app.register_blueprint(UploadReferenceRoute(self.model, self.database).blueprint)

    def run(self):
        self.app.run(debug=True)

if __name__ == "__main__":
    app = FlaskApp()
    app.run()
