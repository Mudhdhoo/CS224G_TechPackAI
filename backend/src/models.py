from openai import OpenAI
from utils.utils import encode_image
from utils.prompts import SYSTEM_PROMPT, TEMPLATE_PROMPT, TEMPLATE_INSTRUCTION_PROMPT
from loguru import logger

class OpenAI_GPT:
    def __init__(self, model="gpt-4o"):
        self.__SYSTEM_PROMPT = SYSTEM_PROMPT
        self.__TEMPLATE_PROMPT = TEMPLATE_PROMPT
        self.__TEMPLATE_INSTRUCTION_PROMPT = TEMPLATE_INSTRUCTION_PROMPT
        self.model = model
        self.client = OpenAI()
        self.conv_history =[
            {"role": "developer", "content": self.__SYSTEM_PROMPT},     # Provide general instructions and tasks
            {"role": "developer", "content": self.__TEMPLATE_PROMPT},          # Provide Latex Tempalte
            {"role": "developer", "content": self.__TEMPLATE_INSTRUCTION_PROMPT}    # Provide instructions on how to fill out template
            ]
        
        self.history_loaded = False

    def chat(self, user_message, project_id, user_id, database):
        try:
            if not self.history_loaded:     # Load previous history from database when restarting conversation 
                self.load_conversation_history(project_id, user_id, database)

            database.save_message(user_message, "user", project_id, user_id)    # Save user message to database
            self.conv_history.append({"role":"user", "content": f"{user_message}"})

            completion = self.get_completion()

            response = completion.choices[0].message.content

            self.conv_history.append({"role":"assistant", "content":f"{response}"})
            database.save_message(response, "assistant", project_id, user_id)   # Save response to database
        except Exception as e:
            print(e)

        return response
    
    def get_completion(self):
        completion = self.client.chat.completions.create(
            model=self.model,
            messages=self.conv_history,
            temperature=0.7,
            stream=False
        )

        return completion
    
    def load_conversation_history(self, project_id, user_id, db):
        """Load previous messages from the database"""
        try:
            # If history is already loaded, skip
            if self.history_loaded:
                return

            logger.info(f"Loading conversation history for project {project_id} and user {user_id}")
            result = db.get_project_messages(project_id, user_id)
            messages = result
            
            # Add messages in chronological order
            for msg in messages:
                role = "assistant" if msg["type"] == "assistant" else "user"
                self.conv_history.append({"role": role, "content": msg["content"]})
            
            self.history_loaded = True
                
        except Exception as e:
            logger.error(f"Error loading conversation history: {str(e)}")
            raise
        