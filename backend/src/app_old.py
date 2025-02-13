import os
import werkzeug
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import base64


client = OpenAI()

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin requests from your React app

system_prompt = "You are a helpful assistant."
conversation_hist = [{"role": "developer", "content": system_prompt}]

# Chat endpoint: receives a message and (optionally) conversation history
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    message = data.get('message', '')
    conversation_hist.append({"role": "user", "content": message})
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=conversation_hist
        )
        reply = response.choices[0].message.content
        conversation_hist.append({"role": "assistant", "content": reply})

        # Return the reply in a JSON response
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# File upload endpoint
@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:
        return jsonify({'error': 'No image part in the request'}), 400
    image = request.files['image']
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
                    "text": f"Here is an image.",
                }]
                }
    conv["content"].append(
        {
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{image}"},
        }
        )
    conversation_hist.append(conv)

    # Here you could add file/image processing logic as needed
    return jsonify({'message': 'File uploaded successfully'})

if __name__ == '__main__':
    app.run(debug=True)