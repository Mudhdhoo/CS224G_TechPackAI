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
                
                compilation_result = None
                if code:
                    # Ensure project directory exists
                    proj_dir = os.path.join(os.getcwd(), 'projects', project_id)
                    os.makedirs(proj_dir, exist_ok=True)
                    
                    # Write LaTeX code to file
                    code_txt_path = os.path.join(proj_dir, "code.txt")
                    logger.info(f"Writing LaTeX code to {code_txt_path}")
                    
                    with open(code_txt_path, "w") as file:
                        file.write(code)
                    
                    # Verify the file was written correctly
                    if not os.path.exists(code_txt_path) or os.path.getsize(code_txt_path) == 0:
                        logger.error(f"Failed to write LaTeX code to {code_txt_path}")
                        response += "\n\nThere was an issue generating your tech pack. The system couldn't save the LaTeX code properly."
                    else:
                        logger.info(f"Compiling LaTeX code at {code_txt_path}")
                        current_dir = os.path.dirname(os.path.abspath(__file__))
                        compilation_result = self.compile_latex(os.path.join(current_dir, "projects"), project_id)
                        
                        # Add compilation result feedback to response
                        if compilation_result:
                            response += "\n\nYour tech pack has been updated and a new PDF has been generated. You can view it using the 'Tech Pack Preview' button."
                        else:
                            response += "\n\nThere was an issue generating your tech pack PDF. The system team has been notified."
                
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
            logger.error(f"Error in chat_stream: {str(e)}")
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
            
            # Try to load images if they exist
            try:
                illustration_dir = os.path.join(os.getcwd(), "projects", project_id, "illustration")
                if os.path.exists(illustration_dir) and os.listdir(illustration_dir):
                    self.load_image("illustration", project_id)
            except Exception as e:
                logger.error(f"Error loading illustration images: {str(e)}")
                
            try:
                reference_dir = os.path.join(os.getcwd(), "projects", project_id, "reference")
                if os.path.exists(reference_dir) and os.listdir(reference_dir):
                    self.load_image("reference", project_id)
            except Exception as e:
                logger.error(f"Error loading reference images: {str(e)}")

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
        
        if not os.path.exists(images_path):
            logger.warning(f"{type} directory does not exist: {images_path}")
            return
            
        image_names = os.listdir(images_path)
        if not image_names:
            logger.warning(f"No {type} images found in {images_path}")
            return
            
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
            try:
                with open(image, "rb") as image_file:
                    image_data = base64.b64encode(image_file.read()).decode("utf-8")
                conv["content"].append(
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_data}"},
                    }
                    )
            except Exception as e:
                logger.error(f"Error loading image {image}: {str(e)}")
        
        self.conv_history.append(conv)

    def compile_latex(self, project_path, project_id):
        """
        Compile the LaTeX document for the specified project.
        
        Returns:
            bool: True if compilation succeeded, False otherwise
        """
        try:
            # Validate project directory
            project_dir = os.path.join(project_path, project_id)
            if not os.path.exists(project_dir):
                logger.error(f"Project directory does not exist: {project_dir}")
                return False
                
            # Compile the LaTeX document
            logger.info(f"Compiling LaTeX for project: {project_id}")
            pdf_path = compile_latex_from_txt(project_dir)
            
            if pdf_path and os.path.exists(pdf_path):
                logger.info(f"Successfully compiled PDF: {pdf_path}")
                return True
            else:
                logger.error(f"Failed to compile PDF for project: {project_id}")
                return False
                
        except Exception as e:
            logger.error(f"Error compiling LaTeX: {str(e)}")
            return False



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