
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
 
    const response = await fetch('http://127.0.0.1:5000/chat', {
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

  async getProjectMessages(projectId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
};
