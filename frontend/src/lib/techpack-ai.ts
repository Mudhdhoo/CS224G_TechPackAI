import { supabase } from "@/integrations/supabase/client";

export interface TechPackResponse {
  content: string;
  type: 'assistant';
}

export interface ImageUploadResult {
  path: string;
  type: 'reference' | 'illustration';
}

export const techpackAI = {
  async uploadImage(file: File, type: 'reference' | 'illustration', projectId: string): Promise<ImageUploadResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const bucket = type === 'reference' ? 'reference_images' : 'illustration_images';
    const path = `${projectId}/${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) throw error;

    // Store image reference in database
    const { error: dbError } = await supabase
      .from(type === 'reference' ? 'reference_images' : 'illustration_images')
      .insert({
        project_id: projectId,
        file_path: path,
        user_id: user.id
      });

    if (dbError) throw dbError;

    return {
      path,
      type
    };
  },

  async sendMessage(content: string, projectId: string): Promise<TechPackResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
 
    const response = await fetch('http://127.0.0.1:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content,
        projectId,
        userId: user.id,
        referenceImages: [],  // Will be implemented later if needed
        illustrationImages: [], // Will be implemented later if needed
        initialize: false
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: data.content,
      type: 'assistant'
    };
  },

  // Fixed streaming method
  async sendMessageStream(content: string, projectId: string, onChunk: (chunk: string) => void): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
 
    // Add stream=true query parameter to indicate streaming mode to the backend
    const response = await fetch('http://127.0.0.1:8000/chat?stream=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream', // Explicitly request SSE format
      },
      body: JSON.stringify({
        content,
        projectId,
        userId: user.id,
        referenceImages: [],
        illustrationImages: [],
        initialize: false
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to start streaming: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }
    
    const decoder = new TextDecoder();
    let buffer = ''; // Buffer for incomplete chunks
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            processSSEChunk(buffer, onChunk);
          }
          break;
        }
        
        // Decode the chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete SSE messages
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || ''; // Keep the last incomplete chunk
        
        for (const message of messages) {
          processSSEChunk(message, onChunk);
        }
      }
    } catch (error) {
      console.error('Error reading stream:', error);
      throw error;
    }
  },

  async getProjectMessages(projectId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    console.log(data)
    return data;
  }
};

// Helper function to process SSE chunks
function processSSEChunk(chunk: string, onChunk: (content: string) => void) {
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data:')) {
      try {
        const jsonStr = line.substring(5).trim();
        if (jsonStr) {
          const data = JSON.parse(jsonStr);
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          if (data.content) {
            onChunk(data.content);
          }
          
          if (data.done === true) {
            return;
          }
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    }
  }
}