from supabase import create_client, Client
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import base64
import uuid
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    _instance: Optional['DatabaseManager'] = None
    _client: Optional[Client] = None
    
    def __new__(cls) -> 'DatabaseManager':
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize the Supabase client if not already initialized"""
        if self._client is None:
            url = "https://qwnyotnopqbynarbtpsf.supabase.co"
            # Use service role key for backend operations
            key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bnlvdG5vcHFieW5hcmJ0cHNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTA2NTM2MiwiZXhwIjoyMDU0NjQxMzYyfQ.nvCdn4mb4eG-1lqqrTmZ8XwdJkNJ38Le0_ETyyxOLCw"
            self._client = create_client(url, key)
            logger.info("Initialized Supabase client with service role")

    def test_connection(self):
        """Test the Supabase connection"""
        try:
            # Try a simple query to test the connection
            self.client.table('messages').select('id').limit(1).execute()
            logger.info("Database connection test successful")
        except Exception as e:
            logger.error(f"Database connection test failed: {str(e)}")
            raise
    
    @property
    def client(self) -> Client:
        """Get the Supabase client instance"""
        if self._client is None:
            self._initialize()
        return self._client

    def save_message(self, content: str, message_type: str, project_id: str, user_id: str):
        """Save a message to the database"""
        try:
            logger.info(f"Saving message for project {project_id} and user {user_id}")
            result = self.client.table('messages').insert({
                'content': content,
                'type': message_type,
                'project_id': project_id,
                'user_id': user_id
            }).execute()
            logger.info("Message saved successfully")
            # Handle both list and .data responses
            return result.data if hasattr(result, 'data') else result
        except Exception as e:
            logger.error(f"Error saving message: {str(e)}")
            raise

    def save_prompt(self, content: str, prompt_type: str, project_id: str, user_id: str):
        """Save a prompt to the database"""
        try:
            logger.info(f"Saving prompt for project {project_id}")
            result = self.client.table('prompts').insert({
                'content': content,
                'type': prompt_type,
                'project_id': project_id,
                'user_id': user_id
            }).execute()
            logger.info("Prompt saved successfully")
            # Handle both list and .data responses
            return result.data if hasattr(result, 'data') else result
        except Exception as e:
            logger.error(f"Error saving prompt: {str(e)}")
            raise

    def get_project_messages(self, project_id: str, user_id: str) -> List[Dict[str, Any]]:
        """Get all messages for a project in chronological order"""
        try:
            logger.info(f"Fetching messages for project {project_id}")
            response = self.client.table('messages')\
                .select('*')\
                .eq('project_id', project_id)\
                .eq('user_id', user_id)\
                .order('created_at', desc=False)\
                .execute()
            
            # Handle both list and .data responses
            messages = response.data if hasattr(response, 'data') else response
            print(response)
            if messages:
                logger.info(f"Found {len(messages)} messages")
                return messages
            logger.info("No messages found")
            return []
        except Exception as e:
            logger.error(f"Error getting project messages: {str(e)}")
            raise

    def get_project_prompts(self, project_id: str, user_id: str):
        """Get all prompts for a project"""
        try:
            logger.info(f"Fetching prompts for project {project_id}")
            result = self.client.table('prompts')\
                .select('*')\
                .eq('project_id', project_id)\
                .eq('user_id', user_id)\
                .execute()
            logger.info(f"Found {len(result.data if hasattr(result, 'data') else result)} prompts")
            # Handle both list and .data responses
            return result.data if hasattr(result, 'data') else result
        except Exception as e:
            logger.error(f"Error getting project prompts: {str(e)}")
            raise