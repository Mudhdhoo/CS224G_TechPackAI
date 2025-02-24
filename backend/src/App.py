from flask import Flask
from flask_cors import CORS
from routes import ChatRoutes, UploadIllustrationRoute, UploadReferenceRoute, PreviewPDFRoute
from models import CustomerAgent, CodeAgent
from database import DatabaseManager
from openai import OpenAI

class FlaskApp:
    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)
        self.client = OpenAI()
        self.database = DatabaseManager()
        self.code_agent = CodeAgent(self.client, model="gpt-4o")
        self.customer_agent = CustomerAgent(self.client, self.code_agent, self.database, model="gpt-4o")
        self.register_routes()

    def register_routes(self):
        self.app.register_blueprint(ChatRoutes(self.customer_agent, self.database).blueprint)
        self.app.register_blueprint(UploadIllustrationRoute(self.customer_agent, self.code_agent, self.database).blueprint)
        self.app.register_blueprint(UploadReferenceRoute(self.customer_agent, self.code_agent, self.database).blueprint)
        self.app.register_blueprint(PreviewPDFRoute().blueprint)

    def run(self):
        self.app.run(debug=True)

if __name__ == "__main__":
    app = FlaskApp()
    app.run()
