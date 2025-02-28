from flask import Blueprint, request, jsonify, send_file, Response, stream_with_context
import werkzeug
import base64
import os
import json
from loguru import logger

class ChatRoutes:
    def __init__(self, model, database):
        self.blueprint = Blueprint("chat", __name__)
        self.model = model
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.blueprint.route('/chat', methods=['POST'])
        def chat():
            data = request.get_json()

            message = data.get("content", "")
            project_id = data.get("projectId", "")
            user_id = data.get("userId", "")
            
            # Return SSE stream
            def generate():
                try:
                    # Save user message to database first
                    self.database.save_message(message, "user", project_id, user_id)
                    
                    # Stream the response
                    response_content = ""
                    for chunk in self.model.chat_stream(message, project_id, user_id):
                        response_content += chunk
                        yield f"data: {json.dumps({'content': chunk})}\n\n"
                    
                    # Save the complete response to database after streaming
                    self.database.save_message(response_content, "assistant", project_id, user_id)
                    
                    # Send done signal
                    yield f"data: {json.dumps({'done': True})}\n\n"
                    
                except Exception as e:
                    print(e)
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
            
            return Response(stream_with_context(generate()), 
                            mimetype='text/event-stream',
                            headers={
                                'Cache-Control': 'no-cache',
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                            })

class UploadIllustrationRoute:
    def __init__(self, customer_agent, code_agent, database):
        self.blueprint = Blueprint("upload_illustration", __name__)
        self.customer_agent = customer_agent
        self.code_agent = code_agent
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.blueprint.route('/upload_illustration', methods=['POST'])
        def upload():
            print("ILLU")
            if 'images' not in request.files:
                return jsonify({'error': 'No image part in the request'}), 400
            
            user_id = request.form.get('userId')    # Get user ID
            project_id = request.form.get('projectId')  # Get project ID
            images = request.files.getlist("images")  # Get all uploaded files

            conv = {
                    "role": "user",
                    "content": [{
                            "type": "text",
                            "text": f"Here are the illustration image(s).\n\
                                <REMEMBER>\n\
                                    The names of these illustration images are {[image.filename for image in images]}. These come in the same order as the images.\n\
                                </REMEMBER> ",
                        }]
                        }
            
            for image in images:
                if image.filename == '':
                    return jsonify({'error': 'No selected file'}), 400
                
                # Secure the filename and save it in a local "uploads" folder (create this folder)
                filename = werkzeug.utils.secure_filename(image.filename)
                upload_folder = os.path.join(os.getcwd(), f'projects/{project_id}/illustration')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                image.save(file_path)

                # Encode image to base64
                with open(file_path, "rb") as image_file:
                    image = base64.b64encode(image_file.read()).decode("utf-8")

                conv["content"].append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                    }
                    )
                self.customer_agent.conv_history.append(conv)
                self.code_agent.conv_history.append(conv)
              #  self.database.save_image(image, project_id, user_id)
            
            return jsonify({'message': 'File uploaded successfully'})
        
class UploadReferenceRoute:
    def __init__(self, customer_agent, code_agent, database):
        self.blueprint = Blueprint("upload_reference", __name__)
        self.customer_agent = customer_agent
        self.code_agent = code_agent
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.blueprint.route('/upload_reference', methods=['POST'])
        def upload():
            print('REFERENCE')
            if 'images' not in request.files:
                return jsonify({'error': 'No image part in the request'}), 400
            
            user_id = request.form.get('userId')    # Get user ID
            project_id = request.form.get('projectId')  # Get project ID
            images = request.files.getlist("images")  # Get all uploaded files

            conv = {
                    "role": "user",
                    "content": [{
                            "type": "text",
                            "text": f"Here are the illustration image(s).\n\
                                <REMEMBER>\n\
                                    The names of these reference images are {[image.filename for image in images]}. These come in the same order as the images.\n\
                                </REMEMBER> ",
                        }]
                        }

            for image in images:
                if image.filename == '':
                    return jsonify({'error': 'No selected file'}), 400
                
                # Secure the filename and save it in a local "uploads" folder (create this folder)
                filename = werkzeug.utils.secure_filename(image.filename)
                upload_folder = os.path.join(os.getcwd(), f'projects/{project_id}/reference')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                image.save(file_path)

                # # Encode image to base64
                with open(file_path, "rb") as image_file:
                    image = base64.b64encode(image_file.read()).decode("utf-8")

                conv["content"].append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                    }
                    )
               # self.customer_agent.conv_history.append(conv)
                self.code_agent.conv_history.append(conv)
               # self.database.save_image(image, project_id, user_id)
            
            return jsonify({'message': 'File uploaded successfully'})
        
class PreviewPDFRoute:
    def __init__(self):
        self.blueprint = Blueprint("preview_pdf", __name__)
        self.setup_routes()

    def setup_routes(self):
        @self.blueprint.route('/preview_pdf', methods=['GET'])
        def preview_pdf():
            try:
                # Specify your PDF folder path
                pdf_folder = os.path.join(os.getcwd(), 'project')
                pdf_filename = f"tech_pack1.pdf"  # assuming PDFs are named by project ID
                pdf_path = os.path.join(pdf_folder, pdf_filename)
                self.increment += 1 
                # Check if file exists
                if not os.path.exists(pdf_path):
                    return {'error': 'PDF not found'}, 404
                    
                return send_file(
                    pdf_path,
                    mimetype='application/pdf',
                    as_attachment=False
                )
        
            except Exception as e:
                return {'error': str(e)}, 500
            
class BeginConversationRoute:
    def __init__(self, database):
        self.blueprint = Blueprint("begin_conversation", __name__)
        self.setup_routes()
        self.database = database

    def setup_routes(self):
        @self.blueprint.route('/begin_conversation', methods=['POST'])
        def begin_conversation():
            logger.info("Conversation Initialized")
            user_id = request.form.get('userId')    # Get user ID
            project_id = request.form.get('projectId')  # Get project ID
            self.database.save_message("Thank you for uploading you illustration and reference images! To get started, please prove your brand name and designer name.", 
                                       "assistant", 
                                       project_id, 
                                       user_id)
            
            return jsonify({'message': 'Conversation initialized'})


