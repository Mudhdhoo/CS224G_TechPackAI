from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import (
    ChatRoutes, 
    UploadIllustrationRoute, 
    UploadReferenceRoute, 
    PreviewPDFRoute, 
    BeginConversationRoute)
from models import CustomerAgent, CodeAgent, ImageAnalysisAgent
from database import DatabaseManager
from openai import OpenAI

app = FastAPI()

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Initialize shared components
client = OpenAI()
database = DatabaseManager()
code_agent = CodeAgent(client, model="o1-2024-12-17")       # Use o1 for quality in code generation
customer_agent = CustomerAgent(client, code_agent, database, model="gpt-4o")    # Use 4o for general conversation
image_analysis_agent = ImageAnalysisAgent(client, model='o1-2024-12-17') 

# Instantiate route classes and include their routers
chat_routes_instance = ChatRoutes(customer_agent, database)
upload_illustration_instance = UploadIllustrationRoute(customer_agent, code_agent, image_analysis_agent, database)
upload_reference_instance = UploadReferenceRoute(customer_agent, code_agent, database)
preview_pdf_instance = PreviewPDFRoute()
begin_conversation_instance = BeginConversationRoute(database, customer_agent)

app.include_router(chat_routes_instance.router)
app.include_router(upload_illustration_instance.router)
app.include_router(upload_reference_instance.router)
app.include_router(preview_pdf_instance.router)
app.include_router(begin_conversation_instance.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("App:app", host="127.0.0.1", port=8000, reload=True)
