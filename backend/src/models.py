from utils.prompts import SYSTEM_PROMPT_CUSTOMER_AGENT, SYSTEM_PROMPT_CODE_AGENT
from loguru import logger
import json

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

    def chat(self, user_message, project_id, user_id):
        try:
            # Load history from database when restarting or switching to another project
            if self.project_id == None or self.project_id != project_id:
                self.load_conversation_history(project_id, user_id, self.database)
                self.project_id = project_id

            self.database.save_message(user_message, "user", project_id, user_id)    # Save user message to database
            self.conv_history.append({"role":"user", "content": f"{user_message}"})

            # Get completion
            completion = self.get_completion()
            # Get response
            response, code = self.get_response(completion.choices[0].message)

            if code != None:
                with open("code.txt", "w") as file:
                    file.write(code)

            self.conv_history.append({"role":"assistant", "content":f"{response}"})
            self.database.save_message(response, "assistant", project_id, user_id)   # Save response to database
        except Exception as e:
            print(e)

        return response
    
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

            # Add messages in chronological order 
            for msg in messages[1:]:
                role = "assistant" if msg["type"] == "assistant" else "user"
                self.conv_history.append({"role": role, "content": msg["content"]})
                
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
        