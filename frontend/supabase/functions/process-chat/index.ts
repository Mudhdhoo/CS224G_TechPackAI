
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PYTHON_BACKEND_URL = 'http://127.0.0.1:8000';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { content, projectId, userId } = await req.json()

    console.log('Processing request for:', { projectId, userId })

    // Get project's reference and illustration images
    const { data: referenceImages, error: refError } = await supabaseClient
      .from('reference_images')
      .select('file_path')
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (refError) {
      console.error('Error fetching reference images:', refError)
      throw refError
    }

    const { data: illustrationImages, error: illError } = await supabaseClient
      .from('illustration_images')
      .select('file_path')
      .eq('project_id', projectId)
      .eq('user_id', userId)

    if (illError) {
      console.error('Error fetching illustration images:', illError)
      throw illError
    }

    console.log('Forwarding request to Python backend with:', {
      content,
      projectId,
      userId,
      referenceImagesCount: referenceImages.length,
      illustrationImagesCount: illustrationImages.length,
      backendUrl: PYTHON_BACKEND_URL
    })

    // Forward the request to the Python backend
    try {
      const pythonResponse = await fetch(`${PYTHON_BACKEND_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          projectId,
          userId,
          referenceImages: referenceImages.map(img => img.file_path),
          illustrationImages: illustrationImages.map(img => img.file_path)
        }),
      })

      const responseText = await pythonResponse.text()
      console.log('Python backend raw response:', responseText)

      if (!pythonResponse.ok) {
        console.error('Python backend error:', pythonResponse.status, responseText)
        return new Response(
          JSON.stringify({ error: `Python backend error: ${responseText}` }),
          { 
            status: pythonResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      let aiResponse
      try {
        aiResponse = JSON.parse(responseText)
      } catch (error) {
        console.error('Error parsing Python response:', error)
        return new Response(
          JSON.stringify({ error: 'Invalid response from Python backend' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      console.log('Parsed response from Python backend:', aiResponse)

      return new Response(
        JSON.stringify(aiResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('Error calling Python backend:', error)
      return new Response(
        JSON.stringify({ error: `Failed to connect to Python backend: ${error.message}` }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
