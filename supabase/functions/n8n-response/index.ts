import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-n8n-source, x-railway-url',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      request_id, 
      type, 
      status, 
      content, 
      error_message, 
      processing_time, 
      metadata,
      job_application_id 
    } = await req.json()

    console.log('📥 Received N8N response:', { request_id, type, status, job_application_id })

    if (!request_id) {
      throw new Error('Missing request_id')
    }

    if (status === 'success' && content) {
      // Determine the job_application_id to use
      let finalJobApplicationId = job_application_id

      // If no job_application_id provided, use a placeholder or the request_id
      if (!finalJobApplicationId || finalJobApplicationId === 'null' || finalJobApplicationId === '') {
        finalJobApplicationId = `n8n-${request_id}`
      }

      // Store the generated content in ai_generations table
      const { error } = await supabaseClient
        .from('ai_generations')
        .insert({
          request_id,
          type,
          content,
          is_used: false,
          job_application_id: finalJobApplicationId,
          generated_on: new Date().toISOString()
        })

      if (error) {
        console.error('❌ Error storing AI generation:', error)
        throw error
      }

      console.log('✅ Successfully stored AI generation for request:', request_id)
    } else {
      console.error('❌ N8N generation failed:', error_message)
      
      // Store the error in ai_generations table for tracking
      await supabaseClient
        .from('ai_generations')
        .insert({
          request_id,
          type,
          content: `Error: ${error_message || 'Generation failed'}`,
          is_used: false,
          job_application_id: `error-${request_id}`,
          generated_on: new Date().toISOString()
        })
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Response processed successfully',
        request_id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error processing N8N response:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})