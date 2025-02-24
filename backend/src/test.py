from openai import OpenAI
import json
import os

class LLMOrchestrator:
    def __init__(self):
        self.client = OpenAI()
        self.conversation_history = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant. Use the generate_code function when users request code."
            }
        ]
        
        self.functions = [{
            "name": "generate_code",
            "description": "Generate code based on user requirements",
            "parameters": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "requirements": {"type": "array", "items": {"type": "string"}},
                    "context": {"type": "object"}
                },
                "required": ["description", "requirements"]
            }
        }]
    
    def generate_code(self, description: str, requirements: list, context: dict) -> str:
        """Generates code using GPT-4"""
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a specialized coding assistant."},
                {"role": "user", "content": f"Description: {description}\nRequirements: {requirements}\nContext: {context}"}
            ]
        )
        return response.choices[0].message.content
    
    def process_message(self, user_message: str) -> str:
        """Process user message and generate response"""
        # Add user message to history
        self.conversation_history.append({"role": "user", "content": user_message})
        
        # Get response from assistant
        response = self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=self.conversation_history,
            functions=self.functions,
            function_call="auto"
        )
        
        message = response.choices[0].message
        
        # Check if code generation is needed
        if message.function_call and message.function_call.name == "generate_code":
            # Generate code
            args = json.loads(message.function_call.arguments)
            code = self.generate_code(
                args["description"],
                args["requirements"],
                args.get("context", {})
            )
            
            # Add code generation result to history
            self.conversation_history.extend([
                dict(message),
                {"role": "function", "name": "generate_code", "content": code}
            ])
            
            # Get final response with code explanation
            final_response = self.client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=self.conversation_history
            )
            return final_response.choices[0].message.content
        
        # If no code needed, return direct response
        self.conversation_history.append(dict(message))
        return message.content

def main():
    # Initialize orchestrat
    
    orchestrator = LLMOrchestrator()
    print("Chat started (type 'quit' to exit)")
    
    # Main chat loop
    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() == 'quit':
            break
        
        response = orchestrator.process_message(user_input)
        print("\nAssistant:", response)


if __name__ == "__main__":
    main()