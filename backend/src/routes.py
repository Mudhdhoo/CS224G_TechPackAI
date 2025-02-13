from flask import Blueprint, request, jsonify
import werkzeug
import base64
import os

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

            # Set CORS Headers if not initialized properly
            response = jsonify({"message": "Received", "data": data})
            response.headers.add("Access-Control-Allow-Origin", "*")
            response.headers.add("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
            response.headers.add("Access-Control-Allow-Headers", "Content-Type, Authorization")

            message = data.get("content", "")
            project_id = data.get("projectId", "")
            user_id = data.get("userId", "")
            try:
                reply = self.model.chat(message,
                                        project_id,
                                        user_id,
                                        self.database)

                # Return the reply in a JSON response
                return jsonify({"content": reply})
            except Exception as e:
                print(e)
                return jsonify({"error": str(e)}), 500

class UploadIllustrationRoute:
    def __init__(self, model, database):
        self.blueprint = Blueprint("upload_illustration", __name__)
        self.model = model
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.blueprint.route('/upload_illustration', methods=['POST'])
        def upload():
            print("ILLU")
            if 'images' not in request.files:
                return jsonify({'error': 'No image part in the request'}), 400
            
            images = request.files.getlist("images")  # Get all uploaded files
            for image in images:
                if image.filename == '':
                    return jsonify({'error': 'No selected file'}), 400
                
                # Secure the filename and save it in a local "uploads" folder (create this folder)
                filename = werkzeug.utils.secure_filename(image.filename)
                upload_folder = os.path.join(os.getcwd(), 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                image.save(file_path)

                # Encode image to base64
                with open(file_path, "rb") as image_file:
                    image = base64.b64encode(image_file.read()).decode("utf-8")

                conv = {
                        "role": "user",
                        "content": [{
                                "type": "text",
                                "text": f"Here are the illustration image(s).",
                            }]
                            }
                conv["content"].append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                    }
                    )
                self.model.conv_history.append(conv)
            
            return jsonify({'message': 'File uploaded successfully'})
        
class UploadReferenceRoute:
    def __init__(self, model, database):
        self.blueprint = Blueprint("upload_reference", __name__)
        self.model = model
        self.database = database
        self.setup_routes()

    def setup_routes(self):
        @self.blueprint.route('/upload_reference', methods=['POST'])
        def upload():
            print('REF')
            if 'images' not in request.files:
                return jsonify({'error': 'No image part in the request'}), 400
            
            images = request.files.getlist("images")  # Get all uploaded files
            for image in images:
                if image.filename == '':
                    return jsonify({'error': 'No selected file'}), 400
                
                # Secure the filename and save it in a local "uploads" folder (create this folder)
                filename = werkzeug.utils.secure_filename(image.filename)
                upload_folder = os.path.join(os.getcwd(), 'uploads')
                os.makedirs(upload_folder, exist_ok=True)
                file_path = os.path.join(upload_folder, filename)
                image.save(file_path)

                # # Encode image to base64
                with open(file_path, "rb") as image_file:
                    image = base64.b64encode(image_file.read()).decode("utf-8")

                conv = {
                        "role": "user",
                        "content": [{
                                "type": "text",
                                "text": f"Here are the reference image(s).",
                            }]
                            }
                conv["content"].append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                    }
                    )
                self.model.conv_history.append(conv)
            
            return jsonify({'message': 'File uploaded successfully'})
