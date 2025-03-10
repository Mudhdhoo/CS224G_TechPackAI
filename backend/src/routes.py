from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, JSONResponse, FileResponse
import json
import os
import base64
import werkzeug
from loguru import logger

class ChatRoutes:
    def __init__(self, model, database):
        self.router = APIRouter()
        self.model = model
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.router.post("/chat")
        async def chat(request: Request):
            data = await request.json()
            message = data.get("content", "")
            project_id = data.get("projectId", "")
            user_id = data.get("userId", "")

            async def generate():
                try:
                    # Save user message to database first
                    self.database.save_message(message, "user", project_id, user_id)
                    
                    response_content = ""
                    # Assuming chat_stream is synchronous; if async, await appropriately
                    for chunk in self.model.chat_stream(message, project_id, user_id):
                        response_content += chunk
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                    
                    # Save the complete response to database after streaming
                    self.database.save_message(response_content, "assistant", project_id, user_id)
                    yield f"data: {json.dumps({'done': True})}\n\n"
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"

            return StreamingResponse(generate(), media_type="text/event-stream", headers={
                "Cache-Control": "no-cache",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            })

class UploadIllustrationRoute:
    def __init__(self, customer_agent, code_agent, database):
        self.router = APIRouter()
        self.customer_agent = customer_agent
        self.code_agent = code_agent
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.router.post("/upload_illustration")
        async def upload_illustration(
            userId: str = Form(...),
            projectId: str = Form(...),
            images: list[UploadFile] = File(...)
        ):
            print("ILLU")
            if not images:
                return JSONResponse({"error": "No image part in the request"}, status_code=400)
            
            conv = {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": (
                        "Here are the illustration image(s).\n"
                        "<REMEMBER>\n"
                        f"The names of these illustration images are {[image.filename for image in images]}. These come in the same order as the images.\n"
                        "</REMEMBER>"
                    )
                }]
            }
            
            for image in images:
                if image.filename == '':
                    return JSONResponse({"error": "No selected file"}, status_code=400)
                
                filename = werkzeug.utils.secure_filename(image.filename)
                upload_folder = os.path.join(os.getcwd(), f'projects/{projectId}/illustration')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                with open(file_path, "wb") as buffer:
                    content = await image.read()
                    buffer.write(content)
                
                with open(file_path, "rb") as image_file:
                    encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
                
                conv["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"},
                })
                self.customer_agent.conv_history.append(conv)
                self.code_agent.conv_history.append(conv)
            
            return {"message": "File uploaded successfully"}

class UploadReferenceRoute:
    def __init__(self, customer_agent, code_agent, database):
        self.router = APIRouter()
        self.customer_agent = customer_agent
        self.code_agent = code_agent
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.router.post("/upload_reference")
        async def upload_reference(
            userId: str = Form(...),
            projectId: str = Form(...),
            images: list[UploadFile] = File(...)
        ):
            print("REFERENCE")
            if not images:
                return JSONResponse({"error": "No image part in the request"}, status_code=400)
            
            conv = {
                "role": "user",
                "content": [{
                    "type": "text",
                    "text": (
                        "Here are the reference image(s).\n"
                        "<REMEMBER>\n"
                        f"The names of these reference images are {[image.filename for image in images]}. These come in the same order as the images.\n"
                        "</REMEMBER>"
                    )
                }]
            }
            
            for image in images:
                if image.filename == '':
                    return JSONResponse({"error": "No selected file"}, status_code=400)
                
                filename = werkzeug.utils.secure_filename(image.filename)
                upload_folder = os.path.join(os.getcwd(), f'projects/{projectId}/reference')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                with open(file_path, "wb") as buffer:
                    content = await image.read()
                    buffer.write(content)
                
                with open(file_path, "rb") as image_file:
                    encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
                
                conv["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}"},
                })
                self.code_agent.conv_history.append(conv)
            
            return {"message": "File uploaded successfully"}

class PreviewPDFRoute:
    def __init__(self):
        self.router = APIRouter()
        self.setup_routes()

    def setup_routes(self):
        @self.router.api_route("/preview_pdf", methods=["GET", "POST"])
        async def preview_pdf(request: Request):
            project_id = None
            if request.method == "POST":
                form = await request.form()
                project_id = form.get('projectId')
            else:
                project_id = request.query_params.get('projectId')
            
            if not project_id:
                return JSONResponse({"error": "projectId is required"}, status_code=400)
            
            pdf_folder = os.path.join(os.getcwd(), f'projects/{project_id}')
            pdf_filename = "tech_pack.pdf"
            pdf_path = os.path.join(pdf_folder, pdf_filename)
            
            if not os.path.exists(pdf_path):
                # Try alternative filenames if tech_pack.pdf doesn't exist
                alternative_filenames = ["code.pdf"]
                for alt_filename in alternative_filenames:
                    alt_path = os.path.join(pdf_folder, alt_filename)
                    if os.path.exists(alt_path):
                        # Rename the file to tech_pack.pdf for consistency
                        try:
                            os.rename(alt_path, pdf_path)
                            break
                        except:
                            # If rename fails, use the original file
                            pdf_filename = alt_filename
                            pdf_path = alt_path
                            break
                else:
                    # No PDF files found
                    return JSONResponse({"error": "PDF not found. Try regenerating your tech pack."}, status_code=404)
            
            return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_filename)

class BeginConversationRoute:
    def __init__(self, database):
        self.router = APIRouter()
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.router.post("/begin_conversation")
        async def begin_conversation(userId: str = Form(...), projectId: str = Form(...)):
            logger.info("Conversation Initialized")
            self.database.save_message(
                "Thank you for uploading your illustration and reference images! To get started, please provide your brand name and designer name.",
                "assistant", projectId, userId
            )
            return {"message": "Conversation initialized"}
        
