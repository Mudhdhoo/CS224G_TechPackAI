from utils.prompts import SYSTEM_PROMPT_CUSTOMER_AGENT, SYSTEM_PROMPT_CODE_AGENT
from loguru import logger
import json
import base64
import os
from utils.compile import compile_latex_from_txt

class CustomerAgent:
    def __init__(self, client, code_agent, database, model="gpt-4o"):
        self.__SYSTEM_PROMPT = SYSTEM_PROMPT_CUSTOMER_AGENT
        self.model = model
        self.code_agent = code_agent
        self.client = client
        self.database = database
        self.reset_conv_history()

        self.functions = [{
            "name": "generate_template",
            "description": "Generate a latex Tech Pack template based on user input.",
            "parameters": {
                "type": "object",
                "properties": {
                    "context": {"type": "string"},
                },
                "required": ["context"]
            }
        }]
        
        self.project_id = None
    
    def chat_stream(self, user_message, project_id, user_id):
        try:
            # Load history from database when restarting or switching to another project
            if self.project_id == None or self.project_id != project_id:
                self.load_conversation_history(project_id, user_id, self.database)
                self.project_id = project_id

            # Add user message to conversation history
            self.conv_history.append({"role":"user", "content": f"{user_message}"})
            # Check for template generation first
            function_completion = self.get_completion()
            message = function_completion.choices[0].message

            if message.function_call and message.function_call.name == "generate_template":
                # Non-streaming path for function calls
                response, code = self.get_response(message)
                if code:
                    proj_dir = os.path.join(os.getcwd(), 'projects', project_id)
                    with open(f"{proj_dir}/code.txt", "w") as file:
                        file.write(code)
                        logger.info(f"Compiling latex code at projects/{project_id}/code.txt")
                        current_dir = os.path.dirname(os.path.abspath(__file__))
                        self.compile_latex(os.path.join(current_dir, "projects"), project_id)
                
                self.conv_history.append({"role":"assistant", "content":f"{response}"})
                yield response
            else:
                # For regular messages, use streaming
                streaming_completion = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.conv_history,
                    temperature=0.7,
                    stream=True
                )
                
                # Collect the full response to add to history later
                full_response = ""
                
                # Process the streaming response
                for chunk in streaming_completion:
                    if hasattr(chunk.choices[0], 'delta') and hasattr(chunk.choices[0].delta, 'content'):
                        content = chunk.choices[0].delta.content
                        if content:
                            full_response += content
                            yield content

                # Save the complete response to conversation history
                self.conv_history.append({"role":"assistant", "content":f"{full_response}"})
                
        except Exception as e:
            print(f"Error in chat_stream: {e}")
            yield f"Error: {str(e)}"
    
    def get_completion(self):
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=self.conv_history,
            functions=self.functions,
            function_call="auto",
            temperature=0.7,
            stream=False
        )

        return completion
    
    def load_conversation_history(self, project_id, user_id, db):
        """Load previous messages from the database"""
        try:
            logger.info(f"Loading conversation history for project {project_id} and user {user_id}")

            messages = db.get_project_messages(project_id, user_id)

            # Reset conversation history
            self.reset_conv_history()
            self.load_image("illustration", project_id)
            self.load_image("reference", project_id)

            # Add messages in chronological order 
            for msg in messages[:]:
                if msg["type"] == "assistant":
                    self.conv_history.append({"role": "assistant", "content": msg["content"]})
                elif msg["type"] == "user":
                    self.conv_history.append({"role": "user", "content": msg["content"]})
                
        except Exception as e:
            logger.error(f"Error loading conversation history: {str(e)}")
            raise

    def get_response(self, message):
        code = None
        # Check if code generation is needed
        if message.function_call and message.function_call.name == "generate_template":
            # Generate code
            args = json.loads(message.function_call.arguments)
            code = self.code_agent.generate_template(args["context"])
            # Add code generation result to history
            self.conv_history.append(
                {"role": "developer", "content": "You just generated a tech pack, tell this to the user."}
                )
            
            # Get final response with code explanation
            completion = self.client.chat.completions.create(
                model="gpt-4o",
                messages=self.conv_history,
                temperature = 0.7,
                stream = False
            )
            response = completion.choices[0].message.content
        else:
            response = message.content

        return response, code
    
    def reset_conv_history(self):
        self.conv_history =[
                {"role": "developer", "content": self.__SYSTEM_PROMPT}, 
                ]
        
    def load_image(self, type, project_id):
        assert type in ["illustration", "reference"], "type must be illustration or reference"
        images_path = os.path.join(os.getcwd(), "projects", project_id, type)
        image_names = os.listdir(images_path)
        images = [os.path.join(images_path, file) for file in image_names]

        conv = {
                "role": "user",
                "content": [{
                        "type": "text",
                        "text": f"Here are the {type} image(s).\n\
                            <REMEMBER THESE FILE NAMES EXACTLY>\n\
                                The names of these {type} images are {[name for name in image_names]}. These come in the same order as the images.\n\
                            </REMEMBER THESE FILE NAMES EXACTLY> ",
                    }]
                    }
        
        for image in images:
            with open(image, "rb") as image_file:
                image = base64.b64encode(image_file.read()).decode("utf-8")
            conv["content"].append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                }
                )
        self.conv_history.append(conv)

    def compile_latex(self, project_path, project_id):
        code_path = os.path.join(os.getcwd(), project_path, project_id)
        assert os.path.exists(code_path), f"The path {code_path} does not exitst."
        try:
            compile_latex_from_txt(code_path)
            return True
        except Exception as e:
            print(e)



class CodeAgent:
    def __init__(self, client, model="gpt-4o"):
        self.__SYSTEM_PROMPT = SYSTEM_PROMPT_CODE_AGENT
        self.model = model
        self.client = client
        self.conv_history =[
            {"role": "developer", "content": self.__SYSTEM_PROMPT},     # Provide general instructions and tasks
            ]
        
        self.history_loaded = False
    
    def generate_template(self, context):
        self.conv_history.append({"role":"user", "content": f"{context}"})

        response = self.client.chat.completions.create(
            model=self.model,
            messages=self.conv_history,
            temperature=0.7,
            stream=False)
        
        self.conv_history.append({"role":"assistant", "content":f"{response}"})
        
        return response.choices[0].message.content